import { getRun, getPool } from "../lib/queries";
import { PoolExplorer } from "../components/PoolExplorer";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";

export const dynamic = "force-dynamic";

export default async function PoolPage({ searchParams }: { searchParams: { focus?: string } }) {
  const run = await getRun();
  if (!run) return <EmptyState title="No matchmaking run found" />;
  const users = await getPool(run.run_id);

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="The matchable pool"
        title="People"
        subtitle="Every user who cleared the data + attractiveness gates, with their in-gender visual percentile and persona. Those without a qualifying mutual match are flagged ‘No match’."
      />
      <PoolExplorer users={users as any} focus={searchParams.focus} />
    </div>
  );
}
