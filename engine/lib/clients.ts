import { createClient } from "@supabase/supabase-js";
import { TableClient } from "@azure/data-tables";
import { ClientSecretCredential } from "@azure/identity";
import { Pool } from "pg";
import { env } from "./env";

// ─── Supabase (secret key → RLS bypass, server-side only) ───
export const supabase = createClient(env.supabaseUrl, env.supabaseSecret, {
  auth: { persistSession: false },
});

// ─── Azure Table Storage (service principal) ───
const azureCred = new ClientSecretCredential(
  env.azureTenantId,
  env.azureClientId,
  env.azureClientSecret
);

export function azureTable(tableName: string): TableClient {
  return new TableClient(
    `https://${env.azureTableAccount}.table.core.windows.net`,
    tableName,
    azureCred
  );
}

// ─── Neon Postgres ───
export const pg = new Pool({
  connectionString: env.databaseUrl,
  max: 8,
  ssl: { rejectUnauthorized: false },
});
