import pLimit from "p-limit";
import { env, cfg } from "./lib/env";
import { supabase } from "./lib/clients";
import { extractUsers } from "./extract";
import { applyGates } from "./gate";
import { generateCandidates, pairKey, type ExclusionSet } from "./candidates";
import { scorePair, topPercentileThreshold } from "./score";
import { judgePair, loadCache, flushCache } from "./llm";
import { buildMatches } from "./match";
import { writeRun } from "./store/write";
import type { NormUser, PairEval } from "./types";
import { clamp } from "./lib/normalize";

const LLM_MAX_PER_SUBJECT = Number(process.env.MM_LLM_MAX_PER_SUBJECT || 12);
const LLM_CONCURRENCY = Number(process.env.MM_LLM_CONCURRENCY || 6);

function arg(name: string): string | undefined {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  return p ? p.split("=")[1] : process.argv.includes(`--${name}`) ? "true" : undefined;
}

async function loadExclusions(): Promise<ExclusionSet> {
  const rejected = new Set<string>();
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("matches")
      .select("user_id, match_user_id, response, feedback")
      .range(from, from + 999);
    if (error || !data || data.length === 0) break;
    for (const m of data as any[]) {
      const r = `${m.response ?? ""} ${m.feedback ?? ""}`.toLowerCase();
      if (/reject|declin|no |not interested|pass|negative|unmatch/.test(r)) {
        if (m.user_id && m.match_user_id) rejected.add(pairKey(m.user_id, m.match_user_id));
      }
    }
    if (data.length < 1000) break;
    from += 1000;
  }
  return { rejected };
}

/** Optional balanced pool cap for a cheaper validation run (--limit=N). */
function capPool(pool: NormUser[], limit: number): NormUser[] {
  if (!limit || pool.length <= limit) return pool;
  const women = pool.filter((u) => u.gender === "woman").sort((a, b) => (b.visual_composite ?? 0) - (a.visual_composite ?? 0));
  const men = pool.filter((u) => u.gender === "man").sort((a, b) => (b.visual_composite ?? 0) - (a.visual_composite ?? 0));
  const half = Math.floor(limit / 2);
  return [...women.slice(0, half), ...men.slice(0, limit - Math.min(half, women.length))];
}

async function main() {
  const t0 = Date.now();
  const runId = arg("run") || `run_${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const limit = Number(arg("limit") || 0);
  const noLlm = arg("no-llm") === "true" || !env.anthropicKey;
  const useCache = arg("fresh") !== "true";

  console.log(`\n🚀 Wingy matchmaking run: ${runId}`);
  console.log(`   model=${cfg.llmModel} llm=${noLlm ? "OFF" : "ON"} limit=${limit || "none"} cache=${useCache}\n`);

  console.log("① Extract + normalize...");
  const allUsers = await extractUsers({ useCache });
  console.log(`   ${allUsers.length} users assembled`);

  console.log("② Gate (eligibility + attractiveness floor)...");
  let pool = applyGates(allUsers);
  const reasons: Record<string, number> = {};
  for (const u of allUsers) if (!u.eligible) reasons[u.ineligible_reason || "?"] = (reasons[u.ineligible_reason || "?"] || 0) + 1;
  console.log(`   eligible pool: ${pool.length} (men ${pool.filter(u=>u.gender==="man").length}, women ${pool.filter(u=>u.gender==="woman").length})`);
  console.log(`   dropped:`, reasons);
  if (limit) { pool = capPool(pool, limit); console.log(`   capped to ${pool.length} for this run`); }

  console.log("③ Generate candidates...");
  const excl = await loadExclusions();
  const candidates = generateCandidates(pool, excl);
  console.log(`   ${candidates.length} directional candidate pairs (excl ${excl.rejected.size} prior-rejected)`);

  console.log("④ Raw 4-factor scoring + per-subject threshold...");
  // score all, group by subject for percentile threshold
  const scored = candidates.map((cp) => {
    const { raw, factors } = scorePair(cp.subject, cp.candidate, cp.direction);
    return { cp, raw, factors };
  });
  const bySubject = new Map<string, typeof scored>();
  for (const s of scored) (bySubject.get(s.cp.subject.id) ?? bySubject.set(s.cp.subject.id, []).get(s.cp.subject.id)!).push(s);

  const surviving: typeof scored = [];
  for (const [, list] of bySubject) {
    const keep = topPercentileThreshold(list.map((x) => x.raw), cfg.topPercentile, cfg.absScoreFloor);
    const kept = list.filter((_, i) => keep[i]).sort((a, b) => b.raw - a.raw).slice(0, LLM_MAX_PER_SUBJECT);
    surviving.push(...kept);
  }
  console.log(`   ${surviving.length} directional pairs survive threshold → LLM`);

  console.log(`⑤ LLM reasoning filter (${noLlm ? "skipped" : `concurrency ${LLM_CONCURRENCY}`})...`);
  if (!noLlm) loadCache();
  const limiter = pLimit(LLM_CONCURRENCY);
  let done = 0;
  const evals: PairEval[] = await Promise.all(
    surviving.map((s) =>
      limiter(async () => {
        const { cp, raw, factors } = s;
        let career: number | null = null, llmScore: number | null = null;
        let verdict: PairEval["verdict"] = null, dbv = false, redFlags: string[] = [];
        let rationale: string | null = null, careerR: string | null = null, hook: string | null = null;
        if (!noLlm) {
          const r = await judgePair(cp.subject, cp.candidate, cp.direction);
          if (r) {
            career = r.factor_scores.career;
            llmScore = r.llm_score;
            verdict = r.verdict;
            dbv = r.dealbreaker_violated;
            redFlags = r.red_flags;
            rationale = r.rationale;
            careerR = r.career_reasoning;
            hook = r.one_line_hook;
          }
        }
        // final score blend
        const final = llmScore != null ? clamp(cfg.llmAlpha * raw + (1 - cfg.llmAlpha) * llmScore, 0, 1) : raw;
        // if LLM off, accept on raw alone with a synthetic "possible" verdict above floor
        const effVerdict = verdict ?? (final >= cfg.absScoreFloor ? "possible" : "reject");
        if (++done % 25 === 0) console.log(`     ${done}/${surviving.length}`);
        return {
          subject_id: cp.subject.id,
          candidate_id: cp.candidate.id,
          direction: cp.direction,
          raw_score: raw,
          attraction: factors.attraction,
          background: factors.background,
          age_score: factors.age,
          career,
          llm_score: llmScore,
          verdict: effVerdict,
          dealbreaker_violated: dbv,
          red_flags: redFlags,
          rationale,
          career_reasoning: careerR,
          one_line_hook: hook,
          final_score: final,
          rank: null,
        } as PairEval;
      })
    )
  );
  if (!noLlm) flushCache();

  // rank candidates per subject by final score
  const bySub = new Map<string, PairEval[]>();
  for (const e of evals) (bySub.get(e.subject_id) ?? bySub.set(e.subject_id, []).get(e.subject_id)!).push(e);
  for (const [, list] of bySub) {
    list.sort((a, b) => (b.final_score ?? 0) - (a.final_score ?? 0));
    list.forEach((e, i) => (e.rank = i + 1));
  }

  console.log("⑥ Mutual best-match + outcome prune...");
  const { matches, keptUserIds } = buildMatches(evals);
  console.log(`   ${matches.length} confirmed mutual pairs; ${keptUserIds.size} users matched`);
  const strong = matches.filter((m) => m.strong_mutual).length;
  console.log(`   ${strong} strong-mutual (in both top-5)`);

  // mark which eligible-but-unmatched users get pruned reason
  for (const u of allUsers) {
    if (u.eligible && !keptUserIds.has(u.id)) {
      // keep eligible flag for pool view, but note no qualifying match
      if (!u.ineligible_reason) u.ineligible_reason = "no_qualifying_match";
    }
  }

  console.log("⑦ Write to Neon...");
  const stats = {
    eligible: pool.length,
    candidates: candidates.length,
    survivingPairs: surviving.length,
    evals: evals.length,
    matches: matches.length,
    strongMutual: strong,
    matchedUsers: keptUserIds.size,
    dropReasons: reasons,
    llm: noLlm ? "off" : "on",
    elapsedSec: Math.round((Date.now() - t0) / 1000),
  };
  await writeRun({
    runId,
    modelVersion: noLlm ? "raw-only" : cfg.llmModel,
    config: cfg,
    allUsers,
    matchedUserIds: keptUserIds,
    evals,
    matches,
    stats,
  });

  console.log(`\n✅ Done in ${stats.elapsedSec}s. run_id=${runId}`);
  console.log(JSON.stringify(stats, null, 2));
  process.exit(0);
}

main().catch((e) => { console.error("Run failed:", e); process.exit(1); });
