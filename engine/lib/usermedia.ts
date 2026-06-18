import { supabase } from "./clients";

/**
 * Pull the best display photos per user from Supabase `usermedia`.
 *
 * `usermedia` is the comprehensive scrape of each user's images. Every image row
 * carries a `profile_photos` flag — true marks a good, face-forward picture of
 * the person (the scraper's own curation, which independently agrees with face
 * detection). We surface those first so the avatar shows the best available shot,
 * then fall back to the user's other completed images. `blob_path` is the full
 * `media`-container path the photo proxy at /api/photo already understands, so no
 * transformation is needed.
 */
export async function pullUserMediaPhotos(maxPerUser = 6): Promise<Map<string, string[]>> {
  const rows: { user_id: string; blob_path: string; profile_photos: boolean | null }[] = [];
  let from = 0;
  const page = 1000;
  for (;;) {
    const { data, error } = await supabase
      .from("usermedia")
      .select("user_id, blob_path, profile_photos, created_at")
      .eq("media_type", "image")
      .eq("processing_status", "completed")
      .order("created_at", { ascending: true })
      .range(from, from + page - 1);
    if (error) throw new Error(`usermedia: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...(data as any[]));
    if (data.length < page) break;
    from += page;
  }

  // Group per user, keeping curated profile photos ahead of everything else.
  const byUser = new Map<string, { profile: string[]; other: string[] }>();
  for (const r of rows) {
    if (!r.user_id || !r.blob_path) continue;
    let bucket = byUser.get(r.user_id);
    if (!bucket) byUser.set(r.user_id, (bucket = { profile: [], other: [] }));
    (r.profile_photos === true ? bucket.profile : bucket.other).push(r.blob_path);
  }

  const out = new Map<string, string[]>();
  for (const [uid, { profile, other }] of byUser) {
    out.set(uid, [...profile, ...other].slice(0, maxPerUser));
  }
  return out;
}
