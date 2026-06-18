import type { PoolClient } from "pg";
import { pg } from "../lib/clients";
import { ensureSchema } from "./schema";
import type { NormUser, PairEval, ConfirmedMatch } from "../types";

function summarizePersona(u: NormUser): string {
  return [u.self_text, u.values_text].filter(Boolean).join(" · ").slice(0, 600) || "";
}

/** Batched multi-row insert. Splits into chunks to stay under the param cap. */
async function bulkInsert(
  client: PoolClient,
  table: string,
  columns: string[],
  rows: any[][]
) {
  if (rows.length === 0) return;
  const maxParams = 60000;
  const perRow = columns.length;
  const chunkSize = Math.max(1, Math.floor(maxParams / perRow));
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const values: any[] = [];
    const tuples = chunk.map((row, r) => {
      const ph = row.map((_, c) => `$${r * perRow + c + 1}`);
      values.push(...row);
      return `(${ph.join(",")})`;
    });
    await client.query(
      `INSERT INTO ${table} (${columns.join(",")}) VALUES ${tuples.join(",")}`,
      values
    );
  }
}

/** Write a complete, self-contained run snapshot to Neon. */
export async function writeRun(args: {
  runId: string;
  modelVersion: string;
  config: any;
  allUsers: NormUser[]; // every user (eligible + not), for the Excluded view
  matchedUserIds: Set<string>;
  evals: PairEval[];
  matches: ConfirmedMatch[];
  stats: any;
}) {
  const { runId, modelVersion, config, allUsers, matchedUserIds, evals, matches, stats } = args;
  await ensureSchema();
  const client = await pg.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO mm_run (run_id, started_at, finished_at, model_version, config_json, pool_size, n_matches, stats_json)
       VALUES ($1, now(), now(), $2, $3, $4, $5, $6)
       ON CONFLICT (run_id) DO UPDATE SET finished_at=now(), n_matches=$5, stats_json=$6`,
      [runId, modelVersion, config, allUsers.filter((u) => u.eligible).length, matches.length, stats]
    );

    // users
    await bulkInsert(
      client, "mm_user",
      ["run_id", "user_id", "full_name", "pseudonym", "readable_username", "gender", "age",
       "location_city", "height_cm", "orientation", "dating_preference", "career_text", "linkedin_url",
       "visual_composite", "visual_percentile", "archetype", "photo_paths_json", "persona_summary",
       "values_text", "partner_text", "dealbreakers_text", "eligible", "ineligible_reason", "matched"],
      allUsers.map((u) => [
        runId, u.id, u.full_name, u.pseudonym, u.readable_username, u.gender, u.age,
        u.location_city, u.height_cm, u.orientation, u.dating_preference, u.career_text, u.linkedin_url,
        u.visual_composite, u.visual_percentile, u.archetype, JSON.stringify(u.photo_paths),
        summarizePersona(u), u.values_text, u.partner_text, u.dealbreakers_text,
        u.eligible, u.ineligible_reason, matchedUserIds.has(u.id),
      ])
    );

    // pairs (only scored directional evals)
    await bulkInsert(
      client, "mm_pair",
      ["run_id", "subject_id", "candidate_id", "direction", "raw_score", "attraction",
       "background", "career", "age_score", "llm_score", "final_score", "verdict", "dealbreaker_violated",
       "red_flags_json", "rationale", "career_reasoning", "one_line_hook", "rank"],
      evals.map((e) => [
        runId, e.subject_id, e.candidate_id, e.direction, e.raw_score, e.attraction,
        e.background, e.career, e.age_score, e.llm_score, e.final_score, e.verdict,
        e.dealbreaker_violated, JSON.stringify(e.red_flags), e.rationale, e.career_reasoning,
        e.one_line_hook, e.rank,
      ])
    );

    // matches
    await bulkInsert(
      client, "mm_match",
      ["run_id", "user_a", "user_b", "is_mutual", "strong_mutual", "rank_for_a", "rank_for_b",
       "combined_score", "a_to_b_score", "b_to_a_score", "summary_reasoning", "career_reasoning", "status"],
      matches.map((m) => [
        runId, m.user_a, m.user_b, m.is_mutual, m.strong_mutual, m.rank_for_a, m.rank_for_b,
        m.combined_score, m.a_to_b_score, m.b_to_a_score, m.summary_reasoning, m.career_reasoning, m.status,
      ])
    );

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
