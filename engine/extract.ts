import { mkdirSync, existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { supabase, azureTable } from "./lib/clients";
import {
  normalizeAge, normalizeGender, normalizeDatingPref, normalizeMascFem, deriveCareer,
} from "./lib/normalize";
import type { NormUser } from "./types";

const CACHE_DIR = resolve(process.cwd(), "engine/.cache");
const CACHE_FILE = resolve(CACHE_DIR, "users.json");

/** Paginate any Supabase table past the 1000-row cap. */
async function pullAll(table: string, columns: string): Promise<any[]> {
  const out: any[] = [];
  let from = 0;
  const page = 1000;
  for (;;) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + page - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < page) break;
    from += page;
  }
  return out;
}

function jsonArrayToText(v: any): string | null {
  if (!v) return null;
  if (typeof v === "string") return v.trim() || null;
  if (Array.isArray(v)) {
    const t = v.map((x) => (x && typeof x === "object" ? x.text : String(x))).filter(Boolean).join(", ");
    return t || null;
  }
  return null;
}

interface VisualRec {
  composite: number | null;
  archetype: string | null;
  mascFem: number | null;
  photos: string[];
  raw: any;
}

function toNum(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

async function pullAzureVisual(): Promise<Map<string, VisualRec>> {
  const client = azureTable("uservisualprofile");
  const map = new Map<string, VisualRec>();
  for await (const e of client.listEntities()) {
    // partitionKey == user_id == supabase UUID
    const pk = ((e as any).user_id || e.partitionKey) as string;
    const raw = (e as any).analysis_json;
    if (!raw) continue; // pool-scoring rows have no analysis_json; skip
    let parsed: any = null;
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      continue;
    }
    if (!parsed) continue;
    // composite is stored as a STRING float, e.g. "6.22"
    const composite = toNum(parsed?.scores?.composite) ?? toNum(parsed?.calibrated_scores?.composite);
    const archetype =
      typeof parsed?.archetype === "string"
        ? parsed.archetype
        : parsed?.archetype?.label ?? parsed?.archetype?.name ?? null;
    const mascFem = normalizeMascFem(
      parsed?.polarity_profile?.masculine_feminine_signal ?? parsed?.masculine_feminine_signal
    );
    // photo paths live on the entity as a JSON array string
    let photos: string[] = [];
    try {
      const ip = (e as any).image_paths_json;
      const arr = typeof ip === "string" ? JSON.parse(ip) : ip;
      if (Array.isArray(arr)) photos = arr.map(String).slice(0, 6);
    } catch {
      /* ignore */
    }
    // Keep the highest-composite profile if a user has multiple analyzed rows.
    const prev = map.get(pk);
    if (!prev || (composite ?? -1) > (prev.composite ?? -1)) {
      map.set(pk, { composite, archetype, mascFem, photos, raw: parsed });
    }
  }
  return map;
}

export async function extractUsers(opts: { useCache?: boolean } = {}): Promise<NormUser[]> {
  if (opts.useCache && existsSync(CACHE_FILE)) {
    return JSON.parse(readFileSync(CACHE_FILE, "utf8"));
  }

  console.log("  pulling supabase: users, user_basics, user_persona, user_identities...");
  const [users, basics, persona, identities] = await Promise.all([
    pullAll("users", "id, full_name, pseudonym, readable_username, linkedin_url, stage, trust_status, gender, age"),
    pullAll("user_basics", "user_id, gender, age, orientation, dating_preference, location_city, height_cm, relationship_status"),
    pullAll("user_persona", "user_id, values_text, partner_text, self_text, relationship_text, dealbreakers_text, dealbreakers, life_stage, identity_anchors, intent_alignment, visual_preference, weights, values"),
    pullAll("user_identities", "user_id, readable_username"),
  ]);
  console.log(`  supabase: ${users.length} users, ${basics.length} basics, ${persona.length} persona`);

  const basicsBy = new Map(basics.map((b: any) => [b.user_id, b]));
  const personaBy = new Map(persona.map((p: any) => [p.user_id, p]));
  const identBy = new Map(identities.map((i: any) => [i.user_id, i]));

  console.log("  scanning azure uservisualprofile...");
  const visual = await pullAzureVisual();
  console.log(`  azure: ${visual.size} visual profiles`);

  const out: NormUser[] = users.map((u: any) => {
    const b = basicsBy.get(u.id) || {};
    const p = personaBy.get(u.id) || {};
    const v = visual.get(u.id) || null;
    const ident = identBy.get(u.id) || {};

    const gender = normalizeGender(b.gender, u.gender);
    const age = normalizeAge(b.age ?? u.age);
    const lifeStageText = jsonArrayToText(p.life_stage);
    const selfText = (p.self_text as string) || null;

    return {
      id: u.id,
      full_name: (u.full_name || "").trim(),
      pseudonym: u.pseudonym || null,
      readable_username: u.readable_username || ident.readable_username || null,
      linkedin_url: u.linkedin_url || null,
      stage: u.stage || null,
      trust_status_raw: u.trust_status ?? null,

      gender,
      age,
      orientation: b.orientation || null,
      dating_preference: normalizeDatingPref(b.dating_preference),
      location_city: b.location_city || null,
      height_cm: typeof b.height_cm === "number" ? b.height_cm : null,
      relationship_status: b.relationship_status || null,

      values_text: (p.values_text as string) || jsonArrayToText(p.values),
      partner_text: (p.partner_text as string) || null,
      self_text: selfText,
      relationship_text: (p.relationship_text as string) || null,
      dealbreakers_text: (p.dealbreakers_text as string) || jsonArrayToText(p.dealbreakers),
      life_stage_text: lifeStageText,
      identity_anchors_text: jsonArrayToText(p.identity_anchors),
      intent_alignment_text: jsonArrayToText(p.intent_alignment),
      visual_preference_text: jsonArrayToText(p.visual_preference),
      persona_weights: p.weights ?? null,

      visual_composite: v?.composite ?? null,
      archetype: v?.archetype ?? null,
      masc_fem_signal: v?.mascFem ?? null,
      visual_raw: v?.raw ?? null,

      visual_percentile: null,
      career_text: deriveCareer(lifeStageText, selfText, u.linkedin_url),

      eligible: false,
      ineligible_reason: null,
      photo_paths: v?.photos ?? [],
    };
  });

  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(CACHE_FILE, JSON.stringify(out));
  return out;
}
