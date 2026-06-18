export function pct(n: number | null | undefined, digits = 0): string {
  if (n == null) return "—";
  return `${(n * 100).toFixed(digits)}%`;
}

export function scoreColor(score: number | null | undefined): string {
  if (score == null) return "#9aa39c";
  if (score >= 0.78) return "#2c4839"; // forest — excellent
  if (score >= 0.65) return "#5a7a4f"; // good
  if (score >= 0.55) return "#c8933a"; // gold — okay
  return "#b84c2b"; // rust — weak
}

export function verdictChip(verdict: string | null): { cls: string; label: string } {
  switch (verdict) {
    case "strong":
      return { cls: "bg-chip-green text-muted", label: "Strong" };
    case "possible":
      return { cls: "bg-chip-yellow text-[#7a6418]", label: "Possible" };
    case "reject":
      return { cls: "bg-chip-red text-rust", label: "Reject" };
    default:
      return { cls: "bg-ink/5 text-ink/60", label: verdict || "—" };
  }
}

export function initials(name: string | null, fallback: string | null): string {
  const n = (name && name.trim()) || fallback || "?";
  // Split on whitespace and hyphens, and drop the numeric suffix so a
  // pseudonym like "calm-swift-7843" yields "CS" rather than "CA".
  const parts = n.split(/[\s-]+/).filter((p) => p && !/^\d+$/.test(p));
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Choose the most representative photo for a person. `photo_paths_json` is built
 * from Supabase `usermedia` (see engine/lib/usermedia.ts), already ordered so
 * the scraper's curated `profile_photos` — the best face-forward shots of the
 * person — sit first, ahead of other feed images. So the first path is the best
 * available picture of them; just take it.
 */
export function pickPhoto(paths: string[] | null | undefined): string | null {
  if (!paths || paths.length === 0) return null;
  return paths[0];
}

/**
 * Build a URL for a user photo. The Azure `wingy` account blocks public access,
 * so blob-relative paths are routed through our authenticated proxy at
 * /api/photo/<path> (see app/api/photo and app/lib/azure.ts). Absolute URLs
 * (already-public images) are passed through untouched.
 */
export function photoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const clean = path.replace(/^\/+/, "");
  return `/api/photo/${clean.split("/").map(encodeURIComponent).join("/")}`;
}

/**
 * The dashboard never surfaces a person's real identity. Always show their
 * pseudonym (the Supabase `users.pseudonym`, e.g. "calm-swift-7843"), which is
 * populated for every user. `full_name`/`readable_username` are kept on the
 * record only for search/matching, never for display.
 */
export function displayName(u: { pseudonym?: string | null }): string {
  return (u.pseudonym && u.pseudonym.trim()) || "Unknown";
}

export const REASON_LABELS: Record<string, string> = {
  no_face_score: "No face / visual score",
  no_persona: "No persona data",
  no_gender: "Gender unresolvable",
  no_age: "No parseable age",
  not_datable: "Not active / datable",
  below_attractiveness_floor: "Below attractiveness floor",
  no_qualifying_match: "No qualifying mutual match",
};
