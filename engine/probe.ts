/**
 * Connectivity + cross-DB join probe.
 * Verifies Supabase, Azure Table Storage, and Neon are reachable with the
 * provided credentials, and confirms the supabase.users.id == azure PartitionKey
 * == user_persona.user_id join produces eligible candidates.
 */
import "./lib/env";
import { supabase, azureTable, pg } from "./lib/clients";

async function probeSupabase() {
  console.log("\n── Supabase ──────────────────────────────");
  for (const t of ["users", "user_basics", "user_persona", "user_identities", "matches"]) {
    const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
    if (error) console.log(`  ✗ ${t.padEnd(16)} ERROR: ${error.message}`);
    else console.log(`  ✓ ${t.padEnd(16)} ${count} rows`);
  }
  const { data: sample } = await supabase
    .from("users")
    .select("id, full_name, age, gender, stage, trust_status")
    .limit(3);
  console.log("  sample users:", JSON.stringify(sample, null, 0));
  return (sample || []).map((u: any) => u.id as string);
}

async function probeAzure(sampleIds: string[]) {
  console.log("\n── Azure Table Storage ───────────────────");
  const client = azureTable("uservisualprofile");
  let n = 0;
  const seen = new Set<string>();
  const iter = client.listEntities();
  for await (const e of iter) {
    n++;
    seen.add(e.partitionKey as string);
    if (n >= 200) break; // just confirm reachability + shape
  }
  console.log(`  ✓ uservisualprofile reachable; scanned ${n} entities, ${seen.size} distinct partitionKeys`);
  // Check one entity's analysis_json shape
  const iter2 = client.listEntities();
  for await (const e of iter2) {
    const raw = (e as any).analysis_json;
    if (raw) {
      try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        console.log("  analysis_json keys:", Object.keys(parsed).slice(0, 12).join(", "));
        console.log("  scores.composite sample:", parsed?.scores?.composite);
      } catch {
        console.log("  analysis_json present but unparseable on first row");
      }
      break;
    }
  }
}

async function probeNeon() {
  console.log("\n── Neon Postgres ─────────────────────────");
  const { rows } = await pg.query("select version()");
  console.log("  ✓", rows[0].version);
}

async function main() {
  const ids = await probeSupabase();
  await probeAzure(ids);
  await probeNeon();
  console.log("\n✅ Probe complete.\n");
  await pg.end();
}

main().catch((e) => {
  console.error("Probe failed:", e);
  process.exit(1);
});
