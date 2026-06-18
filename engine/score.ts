import { clamp } from "./lib/normalize";
import { ageScore } from "./candidates";
import type { NormUser, Direction, FactorScores } from "./types";

/** Direction-specific non-career weights (PRD 5.2). Career enters via LLM. */
function weights(direction: Direction): { attraction: number; background: number; age: number } {
  if (direction === "M2W") return { attraction: 0.45, background: 0.3, age: 0.25 };
  if (direction === "W2M") return { attraction: 0.35, background: 0.3, age: 0.2 };
  // same-sex: balanced
  return { attraction: 0.4, background: 0.3, age: 0.3 };
}

function tokens(t: string | null): Set<string> {
  if (!t) return new Set();
  return new Set(
    t
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

/** Attraction: subject's visual preference vs candidate's visual profile + percentile proximity. */
function attractionScore(s: NormUser, c: NormUser): number {
  // base: candidate's composite normalized 0..10 → 0..1
  const composite = c.visual_composite != null ? clamp(c.visual_composite / 10, 0, 1) : 0.5;

  // visual preference text overlap (if subject expressed one) with candidate archetype/raw
  let prefBonus = 0;
  if (s.visual_preference_text) {
    const prefTok = tokens(s.visual_preference_text);
    const candDesc = tokens([c.archetype, JSON.stringify(c.visual_raw?.presentation ?? "")].join(" "));
    prefBonus = jaccard(prefTok, candDesc) * 0.2;
  }

  // percentile proximity — people tend to pair within a band of attractiveness
  let proximity = 0;
  if (s.visual_percentile != null && c.visual_percentile != null) {
    proximity = (1 - Math.abs(s.visual_percentile - c.visual_percentile) / 100) * 0.15;
  }

  return clamp(composite * 0.7 + prefBonus + proximity, 0, 1);
}

/** Background: location, life-stage, values/identity overlap. */
function backgroundScore(s: NormUser, c: NormUser): number {
  let score = 0;
  // location
  if (s.location_city && c.location_city) {
    score += s.location_city.toLowerCase() === c.location_city.toLowerCase() ? 0.35 : 0.1;
  } else {
    score += 0.15;
  }
  // values + identity + life-stage overlap
  const sVals = tokens([s.values_text, s.identity_anchors_text, s.life_stage_text].join(" "));
  const cVals = tokens([c.values_text, c.identity_anchors_text, c.life_stage_text].join(" "));
  score += jaccard(sVals, cVals) * 0.45;
  // what S wants in a partner vs who C is
  const want = tokens(s.partner_text);
  const are = tokens([c.self_text, c.identity_anchors_text].join(" "));
  score += jaccard(want, are) * 0.2;
  return clamp(score, 0, 1);
}

export function scorePair(s: NormUser, c: NormUser, direction: Direction): {
  raw: number;
  factors: Pick<FactorScores, "attraction" | "background" | "age">;
} {
  const w = weights(direction);
  const attraction = attractionScore(s, c);
  const background = backgroundScore(s, c);
  const age = ageScore(s, c);
  const raw = clamp(w.attraction * attraction + w.background * background + w.age * age, 0, 1);
  return { raw, factors: { attraction, background, age } };
}

/**
 * Per-subject threshold filter (PRD 5.4): keep S→C if raw is in S's top percentile
 * AND above the absolute floor. Returns the indices to keep.
 */
export function topPercentileThreshold(
  scores: number[],
  topPct: number,
  absFloor: number
): boolean[] {
  if (scores.length === 0) return [];
  const sorted = [...scores].sort((a, b) => b - a);
  const cutIdx = Math.max(0, Math.ceil((topPct / 100) * sorted.length) - 1);
  const cut = sorted[cutIdx];
  return scores.map((s) => s >= cut && s >= absFloor);
}
