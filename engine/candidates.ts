import { cfg } from "./lib/env";
import type { NormUser, Direction, Gender } from "./types";

export interface ExclusionSet {
  /** unordered pair key "a::b" (sorted) → true if previously rejected together */
  rejected: Set<string>;
}

export function pairKey(a: string, b: string): string {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

/**
 * Does C's gender satisfy S's preference? Orientation is the primary driver:
 *  - bisexual / pansexual → match with anyone
 *  - homosexual / gay / lesbian → same gender only
 *  - heterosexual → opposite gender only
 *  - null / unrecognized orientation → assume heterosexual (opposite gender only)
 */
function prefSatisfied(s: NormUser, c: NormUser): boolean {
  const o = (s.orientation || "").toLowerCase();
  if (o.includes("bi") || o.includes("pan")) return true;
  if (o.includes("homo") || o.includes("gay") || o.includes("lesbian")) return c.gender === s.gender;
  // heterosexual, or null/unrecognized → assume heterosexual
  return c.gender !== s.gender;
}

function mutualOrientationFit(a: NormUser, b: NormUser): boolean {
  return prefSatisfied(a, b) && prefSatisfied(b, a);
}

export function directionFor(s: NormUser, c: NormUser): Direction {
  if (s.gender === c.gender) return "SAME";
  // mixed: name by who the *candidate* is, from subject's perspective
  return c.gender === "woman" ? "M2W" : "W2M";
}

/** Age-gap rule (PRD 5.3). Returns true if pair is within band. */
export function ageBandOk(a: NormUser, b: NormUser): boolean {
  if (a.age == null || b.age == null) return false;
  if (a.gender !== b.gender) {
    const man = a.gender === "man" ? a : b;
    const woman = a.gender === "man" ? b : a;
    const delta = man.age! - woman.age!; // man - woman
    return delta >= -cfg.maxWomanOlder && delta <= cfg.maxManOlder;
  }
  return Math.abs(a.age! - b.age!) <= cfg.sameSexAgeBand;
}

/** Age proximity score in [0,1] given the band. Closer = higher. */
export function ageScore(s: NormUser, c: NormUser): number {
  if (s.age == null || c.age == null) return 0;
  if (s.gender !== c.gender) {
    const span = cfg.maxWomanOlder + cfg.maxManOlder; // total band width
    const man = s.gender === "man" ? s : c;
    const woman = s.gender === "man" ? c : s;
    const delta = man.age! - woman.age!;
    const dist = delta >= 0 ? delta / cfg.maxManOlder : -delta / cfg.maxWomanOlder;
    return Math.max(0, 1 - dist);
  }
  return Math.max(0, 1 - Math.abs(s.age! - c.age!) / cfg.sameSexAgeBand);
}

export interface CandidatePair {
  subject: NormUser;
  candidate: NormUser;
  direction: Direction;
}

/** Generate all directional, orientation+age-valid, non-excluded candidate pairs. */
export function generateCandidates(pool: NormUser[], excl: ExclusionSet): CandidatePair[] {
  const out: CandidatePair[] = [];
  for (const s of pool) {
    for (const c of pool) {
      if (s.id === c.id) continue;
      if (!mutualOrientationFit(s, c)) continue;
      if (!ageBandOk(s, c)) continue;
      if (excl.rejected.has(pairKey(s.id, c.id))) continue;
      out.push({ subject: s, candidate: c, direction: directionFor(s, c) });
    }
  }
  return out;
}
