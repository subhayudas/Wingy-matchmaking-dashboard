import Anthropic from "@anthropic-ai/sdk";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { env, cfg } from "./lib/env";
import type { NormUser, Direction } from "./types";

const CACHE_DIR = resolve(process.cwd(), "engine/.cache");
const LLM_CACHE = resolve(CACHE_DIR, `llm-${cfg.llmModel}.json`);

// `sk-ant-oat*` is an OAuth (Claude Code subscription) access token → must be
// sent as a Bearer authToken with the oauth beta header, NOT as x-api-key, and
// the system prompt must begin with the Claude Code identity line. Standard
// `sk-ant-api*` keys use apiKey normally.
const isOAuth = env.anthropicKey.startsWith("sk-ant-oat");
if (isOAuth) delete process.env.ANTHROPIC_API_KEY; // stop SDK auto x-api-key
const client = env.anthropicKey
  ? isOAuth
    ? new Anthropic({
        apiKey: null,
        authToken: env.anthropicKey,
        defaultHeaders: { "anthropic-beta": "oauth-2025-04-20" },
        maxRetries: 6, // SDK honors Retry-After on 429/5xx
      })
    : new Anthropic({ apiKey: env.anthropicKey, maxRetries: 6 })
  : null;

const CLAUDE_CODE_IDENTITY = "You are Claude Code, Anthropic's official CLI for Claude.";

export interface LlmResult {
  verdict: "strong" | "possible" | "reject";
  factor_scores: { attraction: number; background: number; career: number; age: number };
  career_reasoning: string;
  llm_score: number;
  dealbreaker_violated: boolean;
  red_flags: string[];
  rationale: string;
  one_line_hook: string;
}

let cache: Record<string, LlmResult> = {};
function loadCache() {
  if (existsSync(LLM_CACHE)) cache = JSON.parse(readFileSync(LLM_CACHE, "utf8"));
}
let dirty = 0;
function saveCache(force = false) {
  if (!force && ++dirty % 8 !== 0) return;
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(LLM_CACHE, JSON.stringify(cache));
}
export function flushCache() {
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(LLM_CACHE, JSON.stringify(cache));
}

function profileBlock(u: NormUser): string {
  return [
    `gender: ${u.gender}, age: ${u.age}, location: ${u.location_city ?? "unknown"}`,
    `archetype: ${u.archetype ?? "n/a"}, visual_composite(0-10): ${u.visual_composite ?? "n/a"}, visual_percentile(in-gender): ${u.visual_percentile ?? "n/a"}`,
    `career/profession: ${u.career_text ?? "unknown"}${u.linkedin_url ? ` (linkedin: ${u.linkedin_url})` : ""}`,
    `self: ${u.self_text ?? ""}`,
    `values: ${u.values_text ?? ""}`,
    `wants in partner: ${u.partner_text ?? ""}`,
    `relationship intent: ${u.relationship_text ?? ""}`,
    `dealbreakers: ${u.dealbreakers_text ?? "none stated"}`,
    `life stage: ${u.life_stage_text ?? ""}`,
  ].join("\n");
}

const SYSTEM = `You are Wingy's matchmaking judge. You evaluate ONE direction of a potential romantic match: how good CANDIDATE is FOR SUBJECT.

Judge four factors, each 0..1:
- attraction: physical/visual fit for the subject (use visual composite, archetype, and the subject's stated visual preference).
- background: location, life-stage, values, identity, lifestyle alignment.
- career: judge the TWO REAL PROFESSIONS. Apply this gender asymmetry as a principle:
  * If the SUBJECT is a WOMAN: the man's career/ambition/profession matters a LOT — a weak or mismatched career profile should materially lower the score.
  * If the SUBJECT is a MAN: the woman's career matters FAR LESS — it should rarely make or break the match.
  * Same-gender: weigh career by what each person's own persona/dealbreakers actually signal.
  Always write career_reasoning explaining why the two professions do/don't fit, given who is the subject.
- age: age proximity within the allowed band.

Then give an overall llm_score (0..1) for this direction, a verdict, dealbreaker check, red flags, a 2-4 sentence rationale, and a short one_line_hook.

Be decisive and honest. Reject genuinely poor matches. Output STRICT JSON only, no prose, matching exactly:
{"verdict":"strong|possible|reject","factor_scores":{"attraction":0,"background":0,"career":0,"age":0},"career_reasoning":"","llm_score":0,"dealbreaker_violated":false,"red_flags":[],"rationale":"","one_line_hook":""}`;

function keyFor(sId: string, cId: string, dir: Direction): string {
  return `${sId}>${cId}|${dir}`;
}

function parseJson(text: string): LlmResult | null {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    const o = JSON.parse(t.slice(start, end + 1));
    return {
      verdict: o.verdict,
      factor_scores: {
        attraction: Number(o.factor_scores?.attraction) || 0,
        background: Number(o.factor_scores?.background) || 0,
        career: Number(o.factor_scores?.career) || 0,
        age: Number(o.factor_scores?.age) || 0,
      },
      career_reasoning: String(o.career_reasoning ?? ""),
      llm_score: Number(o.llm_score) || 0,
      dealbreaker_violated: Boolean(o.dealbreaker_violated),
      red_flags: Array.isArray(o.red_flags) ? o.red_flags.map(String) : [],
      rationale: String(o.rationale ?? ""),
      one_line_hook: String(o.one_line_hook ?? ""),
    };
  } catch {
    return null;
  }
}

export async function judgePair(
  subject: NormUser,
  candidate: NormUser,
  direction: Direction
): Promise<LlmResult | null> {
  const k = keyFor(subject.id, candidate.id, direction);
  if (cache[k]) return cache[k];
  if (!client) return null; // no key → caller treats as skipped

  const subjectRole = direction === "M2W" ? "MAN evaluating a WOMAN" : direction === "W2M" ? "WOMAN evaluating a MAN" : "same-gender evaluation";
  const userMsg = `Direction: ${subjectRole}. Score how good CANDIDATE is FOR SUBJECT.

=== SUBJECT (${subject.gender}) ===
${profileBlock(subject)}

=== CANDIDATE (${candidate.gender}) ===
${profileBlock(candidate)}

Return the strict JSON now.`;

  // The SDK retries 429/5xx internally (Retry-After aware), but some 500s come
  // back with x-should-retry:false and the SDK gives up immediately — those are
  // still usually transient. We add our own bounded retry (with backoff) around
  // BOTH the API call and unparseable output, so one bad response can't abort
  // the whole batch. On total failure we return null and the caller falls back
  // to the raw score for that pair.
  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const resp = await client.messages.create({
        model: cfg.llmModel,
        max_tokens: 700,
        system: [
          // OAuth tokens require the CC identity as the first system block.
          { type: "text", text: CLAUDE_CODE_IDENTITY },
          // cache_control is accepted at runtime; SDK 0.32 types omit it.
          { type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } } as any,
        ],
        messages: [{ role: "user", content: userMsg }],
      });
      const text = resp.content.filter((c) => c.type === "text").map((c: any) => c.text).join("");
      const parsed = parseJson(text);
      if (parsed && parsed.verdict) {
        cache[k] = parsed;
        saveCache();
        return parsed;
      }
      // unparseable / missing verdict → fall through to retry
    } catch (err: any) {
      if (attempt === MAX_ATTEMPTS - 1) {
        console.warn(`   ⚠️  LLM judge gave up for ${k} after ${MAX_ATTEMPTS} attempts: ${err?.status ?? ""} ${err?.message ?? err}`);
        return null; // graceful degradation — caller uses raw score
      }
    }
    // backoff before the next attempt (0.6s, 1.2s, 1.8s, 2.4s)
    await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
  }
  return null;
}

export { loadCache };
