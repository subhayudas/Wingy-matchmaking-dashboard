import { getRun, getExcluded } from "../lib/queries";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { Avatar } from "../components/Avatar";
import { Chip } from "../components/Chip";
import { displayName, REASON_LABELS } from "../lib/format";

export const dynamic = "force-dynamic";

const REASON_TONE: Record<string, any> = {
  no_face_score: "ink",
  no_persona: "orange",
  no_age: "yellow",
  no_gender: "purple",
  not_datable: "red",
  below_attractiveness_floor: "red",
  no_qualifying_match: "orange",
};

export default async function ExcludedPage() {
  const run = await getRun();
  if (!run) return <EmptyState title="No matchmaking run found" />;
  const users = await getExcluded(run.run_id);

  const groups = new Map<string, typeof users>();
  for (const u of users) {
    const k = u.ineligible_reason || "unknown";
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(u);
  }
  const ordered = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Removed before or after matching"
        title="Excluded"
        subtitle="Users dropped by the eligibility gates (no face score, no persona, no age, not datable, below the attractiveness floor) or pruned afterward for having no qualifying mutual match."
      />
      <div className="flex flex-col gap-10">
        {ordered.map(([reason, list]) => (
          <section key={reason}>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="editorial text-xl font-semibold text-ink">{REASON_LABELS[reason] || reason}</h2>
              <Chip tone={REASON_TONE[reason] || "ink"}>{list.length}</Chip>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {list.slice(0, 60).map((u) => (
                <div key={u.user_id} className="card flex items-center gap-3 p-3">
                  <Avatar user={u} size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{displayName(u)}</p>
                    <p className="truncate text-[11px] text-ink/45">{[u.gender, u.age].filter(Boolean).join(" · ") || "—"}</p>
                  </div>
                </div>
              ))}
            </div>
            {list.length > 60 && <p className="mt-3 text-xs text-ink/40">+ {list.length - 60} more</p>}
          </section>
        ))}
      </div>
    </div>
  );
}
