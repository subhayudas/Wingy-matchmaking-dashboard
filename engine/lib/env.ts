import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local for engine scripts (Next loads it automatically for the app).
config({ path: resolve(process.cwd(), ".env.local") });

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function num(name: string, fallback: number): number {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export const env = {
  supabaseUrl: req("SUPABASE_URL"),
  supabaseSecret: req("SUPABASE_SECRET_KEY"),
  azureTenantId: req("AZURE_TENANT_ID"),
  azureClientId: req("AZURE_CLIENT_ID"),
  azureClientSecret: req("AZURE_CLIENT_SECRET"),
  azureTableAccount: process.env.AZURE_TABLE_ACCOUNT || process.env.AZURE_STORAGE_ACCOUNT || "wingy",
  databaseUrl: req("DATABASE_URL"),
  anthropicKey: process.env.ANTHROPIC_API_KEY || "",
};

export const cfg = {
  attractivenessFloorPct: num("MM_ATTRACTIVENESS_FLOOR_PCT", 40),
  absScoreFloor: num("MM_ABS_SCORE_FLOOR", 0.55),
  topPercentile: num("MM_TOP_PERCENTILE", 15),
  maxWomanOlder: num("MM_MAX_WOMAN_OLDER", 2),
  maxManOlder: num("MM_MAX_MAN_OLDER", 7),
  sameSexAgeBand: num("MM_SAMESEX_AGE_BAND", 4),
  maxMatchesPerPerson: num("MM_MAX_MATCHES_PER_PERSON", 5),
  llmAlpha: num("MM_LLM_ALPHA", 0.5),
  llmModel: process.env.MM_LLM_MODEL || "claude-sonnet-4-6",
};
