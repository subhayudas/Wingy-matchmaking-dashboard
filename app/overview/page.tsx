import { getRun } from "../lib/queries";
import { q } from "../lib/db";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { Chip } from "../components/Chip";
import { ScoreHistogram, GenderPie } from "../components/OverviewCharts";
import { REASON_LABELS } from "../lib/format";

export const dynamic = "force-dynamic";

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card p-5">
      <p className="eyebrow text-ink/40">{label}</p>
      <p className="editorial mt-1 text-4xl font-bold text-ink">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink/50">{sub}</p>}
    </div>
  );
}

export default async function OverviewPage() {
  const run = await getRun();
  if (!run) return <EmptyState title="No matchmaking run found" />;
  const rid = run.run_id;

  const [poolGender, matchScores, matchCount, strongCount, matchedUsers, reasons] = await Promise.all([
    q<{ gender: string; n: number }>("SELECT gender, count(*)::int n FROM mm_user WHERE run_id=$1 AND eligible=true GROUP BY gender", [rid]),
    q<{ combined_score: number }>("SELECT combined_score FROM mm_match WHERE run_id=$1", [rid]),
    q<{ n: number }>("SELECT count(*)::int n FROM mm_match WHERE run_id=$1", [rid]),
    q<{ n: number }>("SELECT count(*)::int n FROM mm_match WHERE run_id=$1 AND strong_mutual=true", [rid]),
    q<{ n: number }>("SELECT count(*)::int n FROM mm_user WHERE run_id=$1 AND matched=true", [rid]),
    q<{ ineligible_reason: string; n: number }>("SELECT ineligible_reason, count(*)::int n FROM mm_user WHERE run_id=$1 AND eligible=false GROUP BY ineligible_reason ORDER BY n DESC", [rid]),
  ]);

  const men = poolGender.find((g) => g.gender === "man")?.n ?? 0;
  const women = poolGender.find((g) => g.gender === "woman")?.n ?? 0;

  // histogram of combined/2 in 0..1
  const buckets = Array.from({ length: 10 }, (_, i) => ({ bucket: `${i * 10}`, count: 0, mid: i / 10 + 0.05 }));
  for (const m of matchScores) {
    const v = Math.max(0, Math.min(0.999, m.combined_score / 2));
    buckets[Math.floor(v * 10)].count++;
  }

  const stats = run.stats_json || {};

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow={`Run ${rid}`}
        title="Run Overview"
        subtitle={`Model ${run.model_version ?? "—"} · finished ${run.finished_at ? new Date(run.finished_at).toLocaleString() : "—"}`}
        right={
          <div className="flex gap-2">
            {stats.llm && <Chip tone={stats.llm === "on" ? "green" : "ink"}>LLM {stats.llm}</Chip>}
            {stats.elapsedSec != null && <Chip tone="ink">{stats.elapsedSec}s</Chip>}
          </div>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Stat label="Eligible pool" value={men + women} sub={`${men} men · ${women} women`} />
        <Stat label="Confirmed matches" value={matchCount[0]?.n ?? 0} />
        <Stat label="Strong mutual" value={strongCount[0]?.n ?? 0} sub="top-5 for both" />
        <Stat label="Matched people" value={matchedUsers[0]?.n ?? 0} />
        <Stat label="Candidate pairs" value={stats.candidates ?? "—"} sub={`${stats.survivingPairs ?? "—"} to LLM`} />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <p className="eyebrow mb-4 text-ink/40">Match score distribution (combined ÷ 2)</p>
          <ScoreHistogram data={buckets} />
        </div>
        <div className="card p-6">
          <p className="eyebrow mb-4 text-ink/40">Eligible pool by gender</p>
          <GenderPie men={men} women={women} />
        </div>
      </div>

      <div className="card p-6">
        <p className="eyebrow mb-4 text-ink/40">Exclusions by reason</p>
        <div className="flex flex-col gap-2.5">
          {reasons.map((r) => {
            const total = reasons.reduce((s, x) => s + x.n, 0);
            return (
              <div key={r.ineligible_reason} className="flex items-center gap-3">
                <span className="w-52 shrink-0 text-sm text-ink-soft">{REASON_LABELS[r.ineligible_reason] || r.ineligible_reason}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/8">
                  <div className="h-full rounded-full bg-muted" style={{ width: `${(r.n / total) * 100}%` }} />
                </div>
                <span className="w-12 shrink-0 text-right font-mono text-xs text-ink/60">{r.n}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
