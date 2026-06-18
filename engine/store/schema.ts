import { pg } from "../lib/clients";

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS mm_run (
  run_id        TEXT PRIMARY KEY,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at   TIMESTAMPTZ,
  model_version TEXT,
  config_json   JSONB,
  pool_size     INT,
  n_matches     INT,
  stats_json    JSONB
);

CREATE TABLE IF NOT EXISTS mm_user (
  run_id            TEXT NOT NULL REFERENCES mm_run(run_id) ON DELETE CASCADE,
  user_id           TEXT NOT NULL,
  full_name         TEXT,
  pseudonym         TEXT,
  readable_username TEXT,
  gender            TEXT,
  age               INT,
  location_city     TEXT,
  height_cm         INT,
  orientation       TEXT,
  dating_preference TEXT,
  career_text       TEXT,
  linkedin_url      TEXT,
  visual_composite  REAL,
  visual_percentile INT,
  archetype         TEXT,
  photo_paths_json  JSONB,
  persona_summary   TEXT,
  values_text       TEXT,
  partner_text      TEXT,
  dealbreakers_text TEXT,
  eligible          BOOLEAN,
  ineligible_reason TEXT,
  matched           BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (run_id, user_id)
);

CREATE TABLE IF NOT EXISTS mm_pair (
  id            BIGSERIAL PRIMARY KEY,
  run_id        TEXT NOT NULL REFERENCES mm_run(run_id) ON DELETE CASCADE,
  subject_id    TEXT NOT NULL,
  candidate_id  TEXT NOT NULL,
  direction     TEXT,
  raw_score     REAL,
  attraction    REAL,
  background    REAL,
  career        REAL,
  age_score     REAL,
  llm_score     REAL,
  final_score   REAL,
  verdict       TEXT,
  dealbreaker_violated BOOLEAN,
  red_flags_json JSONB,
  rationale     TEXT,
  career_reasoning TEXT,
  one_line_hook TEXT,
  rank          INT
);

CREATE TABLE IF NOT EXISTS mm_match (
  id              BIGSERIAL PRIMARY KEY,
  run_id          TEXT NOT NULL REFERENCES mm_run(run_id) ON DELETE CASCADE,
  user_a          TEXT NOT NULL,
  user_b          TEXT NOT NULL,
  is_mutual       BOOLEAN,
  strong_mutual   BOOLEAN,
  rank_for_a      INT,
  rank_for_b      INT,
  combined_score  REAL,
  a_to_b_score    REAL,
  b_to_a_score    REAL,
  summary_reasoning TEXT,
  career_reasoning  TEXT,
  status          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mm_user_run ON mm_user(run_id);
CREATE INDEX IF NOT EXISTS idx_mm_pair_run ON mm_pair(run_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_mm_match_run ON mm_match(run_id);
CREATE INDEX IF NOT EXISTS idx_mm_match_users ON mm_match(run_id, user_a, user_b);
`;

export async function ensureSchema() {
  await pg.query(SCHEMA_SQL);
}

if (require.main === module) {
  ensureSchema()
    .then(() => { console.log("✅ Neon schema ensured."); return pg.end(); })
    .catch((e) => { console.error(e); process.exit(1); });
}
