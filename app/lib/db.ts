import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _mmPool: Pool | undefined;
}

export const pool =
  global._mmPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    ssl: { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") global._mmPool = pool;

export async function q<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}

export async function latestRunId(): Promise<string | null> {
  const rows = await q<{ run_id: string }>(
    "SELECT run_id FROM mm_run ORDER BY finished_at DESC NULLS LAST, started_at DESC LIMIT 1"
  );
  return rows[0]?.run_id ?? null;
}
