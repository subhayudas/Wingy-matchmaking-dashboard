import { cfg } from "./lib/env";
import { pairKey } from "./candidates";
import type { PairEval, ConfirmedMatch } from "./types";

interface QualifiedPair {
  a: string;
  b: string;
  aToB: number;
  bToA: number;
  combined: number;
  evalAB: PairEval;
  evalBA: PairEval;
}

/**
 * Mutual best-match (PRD 5.6).
 * A pair qualifies only if BOTH directions clear the floor AND verdict is
 * strong/possible with no dealbreaker either way. Each person keeps their top-5
 * qualified pairs; a pair is confirmed if in EITHER person's top-5; "strong_mutual"
 * when in BOTH. Then iteratively prune users with no qualifying match.
 */
export function buildMatches(evals: PairEval[]): {
  matches: ConfirmedMatch[];
  prunedUserIds: Set<string>;
  keptUserIds: Set<string>;
} {
  // index directional evals
  const byDir = new Map<string, PairEval>(); // "s>c" → eval
  for (const e of evals) byDir.set(`${e.subject_id}>${e.candidate_id}`, e);

  const qualifies = (e: PairEval | undefined): boolean =>
    !!e &&
    e.final_score != null &&
    e.final_score >= cfg.absScoreFloor &&
    (e.verdict === "strong" || e.verdict === "possible") &&
    !e.dealbreaker_violated;

  // Build qualified unordered pairs (both directions must qualify)
  const qpairs = new Map<string, QualifiedPair>();
  for (const e of evals) {
    const back = byDir.get(`${e.candidate_id}>${e.subject_id}`);
    if (!qualifies(e) || !qualifies(back)) continue;
    const key = pairKey(e.subject_id, e.candidate_id);
    if (qpairs.has(key)) continue;
    const [a, b] = key.split("::");
    const evalAB = byDir.get(`${a}>${b}`)!;
    const evalBA = byDir.get(`${b}>${a}`)!;
    qpairs.set(key, {
      a, b,
      aToB: evalAB.final_score!,
      bToA: evalBA.final_score!,
      combined: evalAB.final_score! + evalBA.final_score!,
      evalAB, evalBA,
    });
  }

  let allPairs = [...qpairs.values()];

  // ── Iterated outcome prune to a fixed point ──
  // Keep refining the set of "alive" users: a user is alive if they have >=1
  // qualified pair with another alive user.
  let alive = new Set<string>();
  for (const p of allPairs) { alive.add(p.a); alive.add(p.b); }
  for (;;) {
    const livePairs = allPairs.filter((p) => alive.has(p.a) && alive.has(p.b));
    const next = new Set<string>();
    for (const p of livePairs) { next.add(p.a); next.add(p.b); }
    if (next.size === alive.size) { alive = next; allPairs = livePairs; break; }
    alive = next;
  }

  // ── Top-5 per person by combined score (greedy, highest-first) ──
  const perPersonTop = new Map<string, QualifiedPair[]>();
  const sorted = [...allPairs].sort((x, y) => y.combined - x.combined);
  const countFor = new Map<string, number>();
  const confirmedKeys = new Set<string>();

  for (const p of sorted) {
    const ca = countFor.get(p.a) ?? 0;
    const cb = countFor.get(p.b) ?? 0;
    // A pair is confirmed if it fits in EITHER person's remaining top-5 slots.
    if (ca < cfg.maxMatchesPerPerson || cb < cfg.maxMatchesPerPerson) {
      confirmedKeys.add(pairKey(p.a, p.b));
      if (ca < cfg.maxMatchesPerPerson) {
        countFor.set(p.a, ca + 1);
        (perPersonTop.get(p.a) ?? perPersonTop.set(p.a, []).get(p.a)!).push(p);
      }
      if (cb < cfg.maxMatchesPerPerson) {
        countFor.set(p.b, cb + 1);
        (perPersonTop.get(p.b) ?? perPersonTop.set(p.b, []).get(p.b)!).push(p);
      }
    }
  }

  // rank within each person's list
  const rankOf = (uid: string, key: string): number | null => {
    const list = perPersonTop.get(uid);
    if (!list) return null;
    const ordered = [...list].sort((x, y) => y.combined - x.combined);
    const idx = ordered.findIndex((p) => pairKey(p.a, p.b) === key);
    return idx === -1 ? null : idx + 1;
  };

  const matches: ConfirmedMatch[] = [];
  const keptUserIds = new Set<string>();
  for (const key of confirmedKeys) {
    const p = qpairs.get(key)!;
    const rankA = rankOf(p.a, key);
    const rankB = rankOf(p.b, key);
    const strong = rankA != null && rankB != null;
    matches.push({
      user_a: p.a,
      user_b: p.b,
      is_mutual: true,
      strong_mutual: strong,
      rank_for_a: rankA,
      rank_for_b: rankB,
      combined_score: p.combined,
      a_to_b_score: p.aToB,
      b_to_a_score: p.bToA,
      summary_reasoning: p.evalAB.rationale || p.evalBA.rationale || "",
      career_reasoning: p.evalAB.career_reasoning || p.evalBA.career_reasoning || "",
      status: strong ? "strong_mutual" : "confirmed",
    });
    keptUserIds.add(p.a);
    keptUserIds.add(p.b);
  }

  return { matches, prunedUserIds: new Set(), keptUserIds };
}
