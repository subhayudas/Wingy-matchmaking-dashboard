import { q, latestRunId } from "./db";

export interface MmUser {
  user_id: string;
  full_name: string | null;
  pseudonym: string | null;
  readable_username: string | null;
  gender: string | null;
  age: number | null;
  location_city: string | null;
  height_cm: number | null;
  orientation: string | null;
  dating_preference: string | null;
  career_text: string | null;
  linkedin_url: string | null;
  visual_composite: number | null;
  visual_percentile: number | null;
  archetype: string | null;
  photo_paths_json: string[] | null;
  persona_summary: string | null;
  values_text: string | null;
  partner_text: string | null;
  dealbreakers_text: string | null;
  eligible: boolean;
  ineligible_reason: string | null;
  matched: boolean;
}

export interface MmMatch {
  id: number;
  user_a: string;
  user_b: string;
  is_mutual: boolean;
  strong_mutual: boolean;
  rank_for_a: number | null;
  rank_for_b: number | null;
  combined_score: number;
  a_to_b_score: number;
  b_to_a_score: number;
  summary_reasoning: string | null;
  career_reasoning: string | null;
  status: string | null;
}

export interface MmPair {
  id: number;
  subject_id: string;
  candidate_id: string;
  direction: string;
  raw_score: number;
  attraction: number;
  background: number;
  career: number | null;
  age_score: number;
  llm_score: number | null;
  final_score: number | null;
  verdict: string | null;
  dealbreaker_violated: boolean;
  red_flags_json: string[] | null;
  rationale: string | null;
  career_reasoning: string | null;
  one_line_hook: string | null;
  rank: number | null;
}

export interface MmRun {
  run_id: string;
  started_at: string;
  finished_at: string | null;
  model_version: string | null;
  config_json: any;
  pool_size: number | null;
  n_matches: number | null;
  stats_json: any;
}

export async function getRun(): Promise<MmRun | null> {
  const runId = await latestRunId();
  if (!runId) return null;
  const rows = await q<MmRun>("SELECT * FROM mm_run WHERE run_id=$1", [runId]);
  return rows[0] ?? null;
}

export async function getMatchesWithUsers(runId: string) {
  const matches = await q<MmMatch>(
    "SELECT * FROM mm_match WHERE run_id=$1 ORDER BY combined_score DESC",
    [runId]
  );
  const ids = Array.from(new Set(matches.flatMap((m) => [m.user_a, m.user_b])));
  const users = ids.length
    ? await q<MmUser>("SELECT * FROM mm_user WHERE run_id=$1 AND user_id = ANY($2)", [runId, ids])
    : [];
  const byId = new Map(users.map((u) => [u.user_id, u]));
  return matches
    .map((m) => ({ match: m, a: byId.get(m.user_a)!, b: byId.get(m.user_b)! }))
    .filter((x) => x.a && x.b);
}

export interface MatchRow {
  match: MmMatch;
  a: MmUser;
  b: MmUser;
  factors: { attraction: number; background: number; career: number; age: number };
  hook: string | null;
  verdicts: string[];
}

/** Matches enriched with averaged factor scores + hook for the grid/filters. */
export async function getMatchRows(runId: string): Promise<MatchRow[]> {
  const base = await getMatchesWithUsers(runId);
  if (base.length === 0) return [];
  const ids = Array.from(new Set(base.flatMap((x) => [x.match.user_a, x.match.user_b])));
  const pairs = await q<MmPair>(
    "SELECT * FROM mm_pair WHERE run_id=$1 AND subject_id = ANY($2) AND candidate_id = ANY($2)",
    [runId, ids]
  );
  const pairBy = new Map<string, MmPair>();
  for (const p of pairs) pairBy.set(`${p.subject_id}>${p.candidate_id}`, p);

  return base.map(({ match, a, b }) => {
    const ab = pairBy.get(`${match.user_a}>${match.user_b}`);
    const ba = pairBy.get(`${match.user_b}>${match.user_a}`);
    const avg = (x?: number | null, y?: number | null) => {
      const vals = [x, y].filter((v): v is number => v != null);
      return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    };
    return {
      match,
      a,
      b,
      factors: {
        attraction: avg(ab?.attraction, ba?.attraction),
        background: avg(ab?.background, ba?.background),
        career: avg(ab?.career, ba?.career),
        age: avg(ab?.age_score, ba?.age_score),
      },
      hook: ab?.one_line_hook || ba?.one_line_hook || null,
      verdicts: [ab?.verdict, ba?.verdict].filter(Boolean) as string[],
    };
  });
}

export async function getUser(runId: string, userId: string): Promise<MmUser | null> {
  const rows = await q<MmUser>("SELECT * FROM mm_user WHERE run_id=$1 AND user_id=$2", [runId, userId]);
  return rows[0] ?? null;
}

export async function getMatch(runId: string, matchId: number) {
  const rows = await q<MmMatch>("SELECT * FROM mm_match WHERE run_id=$1 AND id=$2", [runId, matchId]);
  const m = rows[0];
  if (!m) return null;
  const [a, b] = await Promise.all([getUser(runId, m.user_a), getUser(runId, m.user_b)]);
  if (!a || !b) return null;
  // both directional pair evals
  const pairs = await q<MmPair>(
    `SELECT * FROM mm_pair WHERE run_id=$1
       AND ((subject_id=$2 AND candidate_id=$3) OR (subject_id=$3 AND candidate_id=$2))`,
    [runId, m.user_a, m.user_b]
  );
  const aToB = pairs.find((p) => p.subject_id === m.user_a) ?? null;
  const bToA = pairs.find((p) => p.subject_id === m.user_b) ?? null;
  return { match: m, a, b, aToB, bToA };
}

export async function getPool(runId: string): Promise<MmUser[]> {
  return q<MmUser>(
    "SELECT * FROM mm_user WHERE run_id=$1 AND eligible=true ORDER BY visual_percentile DESC NULLS LAST",
    [runId]
  );
}

export async function getExcluded(runId: string): Promise<MmUser[]> {
  return q<MmUser>(
    "SELECT * FROM mm_user WHERE run_id=$1 AND eligible=false ORDER BY ineligible_reason, full_name",
    [runId]
  );
}

/** Top mutual candidates for a user (from confirmed matches). */
export async function getUserMatches(runId: string, userId: string) {
  const matches = await q<MmMatch>(
    "SELECT * FROM mm_match WHERE run_id=$1 AND (user_a=$2 OR user_b=$2) ORDER BY combined_score DESC",
    [runId, userId]
  );
  const otherIds = matches.map((m) => (m.user_a === userId ? m.user_b : m.user_a));
  const users = otherIds.length
    ? await q<MmUser>("SELECT * FROM mm_user WHERE run_id=$1 AND user_id = ANY($2)", [runId, otherIds])
    : [];
  const byId = new Map(users.map((u) => [u.user_id, u]));
  return matches.map((m) => ({
    match: m,
    other: byId.get(m.user_a === userId ? m.user_b : m.user_a)!,
  }));
}
