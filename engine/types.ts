export type Gender = "man" | "woman";
export type Direction = "M2W" | "W2M" | "SAME";

/** A fully-normalized, gate-ready user assembled from Supabase + Azure. */
export interface NormUser {
  id: string;
  full_name: string;
  pseudonym: string | null;
  readable_username: string | null;
  linkedin_url: string | null;
  stage: string | null;
  trust_status_raw: any;

  gender: Gender | null;
  age: number | null;
  orientation: string | null;        // e.g. "heterosexual"
  dating_preference: Gender | null;   // the gender they want
  location_city: string | null;
  height_cm: number | null;
  relationship_status: string | null;

  // persona
  values_text: string | null;
  partner_text: string | null;
  self_text: string | null;
  relationship_text: string | null;
  dealbreakers_text: string | null;
  life_stage_text: string | null;
  identity_anchors_text: string | null;
  intent_alignment_text: string | null;
  visual_preference_text: string | null;
  persona_weights: any;

  // visual (Azure)
  visual_composite: number | null;    // 0–10
  archetype: string | null;
  masc_fem_signal: number | null;     // -1..1 (negative feminine, positive masculine) if available
  visual_raw: any;

  // derived
  visual_percentile: number | null;   // 0–100 within own gender
  career_text: string | null;         // best-effort profession summary

  // gate outcome
  eligible: boolean;
  ineligible_reason: string | null;
  photo_paths: string[];
}

export interface FactorScores {
  attraction: number;
  background: number;
  age: number;
  career: number;
}

/** Directional candidate evaluation. */
export interface PairEval {
  subject_id: string;
  candidate_id: string;
  direction: Direction;
  raw_score: number;            // weighted attraction+background+age (career via LLM)
  attraction: number;
  background: number;
  age_score: number;
  // LLM-filled:
  career: number | null;
  llm_score: number | null;
  verdict: "strong" | "possible" | "reject" | null;
  dealbreaker_violated: boolean;
  red_flags: string[];
  rationale: string | null;
  career_reasoning: string | null;
  one_line_hook: string | null;
  final_score: number | null;   // α·raw + (1−α)·llm
  rank: number | null;          // subject's rank of this candidate
}

export interface ConfirmedMatch {
  user_a: string;
  user_b: string;
  is_mutual: boolean;
  strong_mutual: boolean;
  rank_for_a: number | null;
  rank_for_b: number | null;
  combined_score: number;
  a_to_b_score: number;
  b_to_a_score: number;
  summary_reasoning: string;
  career_reasoning: string;
  status: string;
}
