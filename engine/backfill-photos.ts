/**
 * Backfill best-picture avatars into the live dashboard data.
 *
 * The dashboard reads avatars from mm_user.photo_paths_json. This script repoints
 * the LATEST run's photos at Supabase `usermedia` — surfacing each user's curated
 * `profile_photos` (their best face-forward shots) first — without re-running the
 * full matchmaking pipeline. It UPDATEs only the rows that actually change, so
 * re-running is a no-op.
 *
 *   npm run engine:backfill-photos
 */
import "./lib/env";
import { pg } from "./lib/clients";
import { pullUserMediaPhotos } from "./lib/usermedia";

async function latestRunId(): Promise<string | null> {
  const { rows } = await pg.query("SELECT run_id FROM mm_run ORDER BY started_at DESC LIMIT 1");
  return rows[0]?.run_id ?? null;
}

async function main() {
  const runId = await latestRunId();
  if (!runId) {
    console.log("No runs found in mm_run; nothing to backfill.");
    await pg.end();
    return;
  }
  console.log(`Backfilling usermedia photos for run ${runId}`);

  const media = await pullUserMediaPhotos();
  console.log(`usermedia: photos for ${media.size} users`);

  const { rows } = await pg.query<{ user_id: string; photo_paths_json: string[] | null }>(
    "SELECT user_id, photo_paths_json FROM mm_user WHERE run_id = $1",
    [runId]
  );

  let changed = 0;
  for (const r of rows) {
    const next = media.get(r.user_id) ?? [];
    const prev = Array.isArray(r.photo_paths_json) ? r.photo_paths_json : [];
    if (next.join("\n") === prev.join("\n")) continue;
    await pg.query("UPDATE mm_user SET photo_paths_json = $1 WHERE run_id = $2 AND user_id = $3", [
      JSON.stringify(next),
      runId,
      r.user_id,
    ]);
    changed++;
  }

  console.log(`Done: ${rows.length} users in run, ${changed} updated.`);
  await pg.end();
}

main().catch((e) => {
  console.error("Backfill failed:", e);
  process.exit(1);
});
