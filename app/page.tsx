import { getRun, getMatchRows } from "./lib/queries";
import { MatchesExplorer } from "./components/MatchesExplorer";
import { PageHeader } from "./components/PageHeader";
import { EmptyState } from "./components/EmptyState";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const run = await getRun();
  if (!run) {
    return (
      <EmptyState
        title="No matchmaking run found"
        hint="Run the engine with `npm run engine:run` to populate Neon, then refresh."
      />
    );
  }
  const matchRows = await getMatchRows(run.run_id);
  const rows = matchRows.map((r) => ({
    id: r.match.id,
    a: r.a,
    b: r.b,
    combined: r.match.combined_score,
    aToB: r.match.a_to_b_score,
    bToA: r.match.b_to_a_score,
    strong: r.match.strong_mutual,
    status: r.match.status || "confirmed",
    hook: r.hook,
    factors: r.factors,
    minPct: Math.min(r.a.visual_percentile ?? 0, r.b.visual_percentile ?? 0),
  }));

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow={`Run ${run.run_id} · ${run.model_version ?? ""}`}
        title="Mutual Matches"
        subtitle="Every pair here is mutual, gate-clean, age-valid and LLM-approved in both directions — people who would genuinely want to date each other. Filter, search, and open any match for the full reasoning."
      />
      {rows.length === 0 ? (
        <EmptyState title="No confirmed matches in this run yet" hint="The LLM reasoning pass may still be running." />
      ) : (
        <MatchesExplorer rows={rows} />
      )}
    </div>
  );
}
