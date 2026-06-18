import { cfg } from "./lib/env";
import { isActiveDatable } from "./lib/normalize";
import type { NormUser } from "./types";

/**
 * Eligibility gates (PRD Section 4), run before any scoring.
 * Mutates NormUser.eligible / ineligible_reason and computes visual_percentile.
 * Returns the surviving (eligible) pool.
 */
export function applyGates(users: NormUser[]): NormUser[] {
  // ── Hard data gates ──
  for (const u of users) {
    if (u.visual_composite == null) {
      u.ineligible_reason = "no_face_score";
    } else if (
      !(u.values_text || u.partner_text || u.self_text || u.relationship_text)
    ) {
      u.ineligible_reason = "no_persona";
    } else if (u.gender == null) {
      u.ineligible_reason = "no_gender";
    } else if (u.age == null) {
      u.ineligible_reason = "no_age";
    } else if (!isActiveDatable(u.trust_status_raw, u.stage, u.relationship_status)) {
      u.ineligible_reason = "not_datable";
    } else {
      u.ineligible_reason = null;
    }
    u.eligible = u.ineligible_reason == null;
  }

  // ── Visual percentile within own gender (only over data-eligible users) ──
  for (const g of ["man", "woman"] as const) {
    const cohort = users.filter((u) => u.eligible && u.gender === g && u.visual_composite != null);
    const sorted = [...cohort].sort((a, b) => (a.visual_composite! - b.visual_composite!));
    const n = sorted.length;
    sorted.forEach((u, i) => {
      // percentile = % of cohort at or below this user
      u.visual_percentile = n <= 1 ? 100 : Math.round(((i + 0.5) / n) * 100);
    });
  }

  // ── Hard attractiveness floor drop (below gender percentile floor) ──
  for (const u of users) {
    if (u.eligible && u.visual_percentile != null && u.visual_percentile < cfg.attractivenessFloorPct) {
      u.eligible = false;
      u.ineligible_reason = "below_attractiveness_floor";
    }
  }

  return users.filter((u) => u.eligible);
}
