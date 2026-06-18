import Link from "next/link";
import { notFound } from "next/navigation";
import { getRun, getMatch } from "../../lib/queries";
import { Avatar } from "../../components/Avatar";
import { Chip } from "../../components/Chip";
import { ScoreRing } from "../../components/ScoreRing";
import { FactorBars } from "../../components/FactorBars";
import { FactorRadar } from "../../components/FactorRadar";
import { displayName, verdictChip } from "../../lib/format";
import type { MmUser, MmPair } from "../../lib/queries";

export const dynamic = "force-dynamic";

function ProfileCard({ u, sub }: { u: MmUser; sub: string }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-4">
        <Avatar user={u} size={72} ring />
        <div className="min-w-0">
          <h2 className="editorial truncate text-xl font-semibold text-ink">{displayName(u)}</h2>
          <p className="text-xs text-ink/45">{sub}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {u.gender && <Chip tone={u.gender === "woman" ? "purple" : "blue"}>{u.gender}</Chip>}
            {u.age && <Chip tone="ink">{u.age}</Chip>}
            {u.location_city && <Chip tone="ink">{u.location_city}</Chip>}
            {u.visual_percentile != null && <Chip tone="orange">{u.visual_percentile}th pct</Chip>}
          </div>
        </div>
      </div>
      {u.career_text && (
        <div className="mt-4">
          <p className="eyebrow mb-1 text-ink/40">Career</p>
          <p className="text-sm text-ink-soft">{u.career_text}</p>
        </div>
      )}
      {u.archetype && (
        <div className="mt-3">
          <p className="eyebrow mb-1 text-ink/40">Visual archetype</p>
          <p className="text-sm italic text-ink-soft">{u.archetype}</p>
        </div>
      )}
      {u.values_text && (
        <div className="mt-3">
          <p className="eyebrow mb-1 text-ink/40">Values</p>
          <p className="line-clamp-3 text-sm text-ink-soft">{u.values_text}</p>
        </div>
      )}
      {u.partner_text && (
        <div className="mt-3">
          <p className="eyebrow mb-1 text-ink/40">Wants in a partner</p>
          <p className="line-clamp-3 text-sm text-ink-soft">{u.partner_text}</p>
        </div>
      )}
      {u.dealbreakers_text && (
        <div className="mt-3">
          <p className="eyebrow mb-1 text-rust/70">Dealbreakers</p>
          <p className="text-sm text-ink-soft">{u.dealbreakers_text}</p>
        </div>
      )}
      <Link href={`/pool?focus=${u.user_id}`} className="nav-link mt-4 inline-block text-xs text-muted">
        View full profile →
      </Link>
    </div>
  );
}

function DirectionPanel({ from, to, pair }: { from: MmUser; to: MmUser; pair: MmPair | null }) {
  const v = verdictChip(pair?.verdict ?? null);
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">
          {displayName(from)} <span className="text-ink/35">→</span> {displayName(to)}
        </p>
        <span className={`chip ${v.cls}`}>{v.label}</span>
      </div>
      <div className="mt-4 flex items-center gap-5">
        <ScoreRing score={pair?.final_score ?? null} size={68} label="final" />
        <div className="flex-1">
          <FactorBars
            values={{
              attraction: pair?.attraction,
              background: pair?.background,
              career: pair?.career,
              age: pair?.age_score,
            }}
          />
        </div>
      </div>
      {pair?.career_reasoning && (
        <div className="mt-4 rounded-card bg-cream-alt/60 p-3">
          <p className="eyebrow mb-1 text-gold">Career reasoning</p>
          <p className="text-sm leading-relaxed text-ink-soft">{pair.career_reasoning}</p>
        </div>
      )}
      {pair?.rationale && <p className="mt-3 text-sm leading-relaxed text-ink-soft">{pair.rationale}</p>}
      {pair?.red_flags_json && pair.red_flags_json.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {pair.red_flags_json.map((f, i) => (
            <Chip key={i} tone="red">⚑ {f}</Chip>
          ))}
        </div>
      )}
      {pair?.dealbreaker_violated && <Chip tone="red" className="mt-3">Dealbreaker violated</Chip>}
    </div>
  );
}

export default async function MatchDetail({ params }: { params: { id: string } }) {
  const run = await getRun();
  if (!run) notFound();
  const data = await getMatch(run.run_id, Number(params.id));
  if (!data) notFound();
  const { match, a, b, aToB, bToA } = data;

  return (
    <div className="animate-fade-up">
      <Link href="/" className="nav-link mb-6 inline-block text-sm text-ink/60">← All matches</Link>

      {/* Hero */}
      <div className="card mb-8 overflow-hidden">
        <div className="bg-dark px-6 py-8 text-cream md:px-10 md:py-10">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-4">
              <Avatar user={a} size={84} ring />
              <span className="display-l text-cream/90">×</span>
              <Avatar user={b} size={84} ring />
            </div>
            <div className="text-center">
              <ScoreRing score={match.combined_score / 2} size={88} label="combined" />
            </div>
          </div>
          <h1 className="display-l mt-6 text-center text-cream">
            {displayName(a)} <span className="text-gold">&</span> {displayName(b)}
          </h1>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {match.strong_mutual && <Chip tone="green">★ Strong mutual — top-5 for both</Chip>}
            <Chip tone="ink">Rank #{match.rank_for_a ?? "—"} for {displayName(a)}</Chip>
            <Chip tone="ink">Rank #{match.rank_for_b ?? "—"} for {displayName(b)}</Chip>
          </div>
        </div>
      </div>

      {/* Radar + summary */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <p className="eyebrow mb-3 text-ink/40">Four-factor compatibility (both directions)</p>
          <FactorRadar
            aToB={{ attraction: aToB?.attraction, background: aToB?.background, career: aToB?.career, age: aToB?.age_score }}
            bToA={{ attraction: bToA?.attraction, background: bToA?.background, career: bToA?.career, age: bToA?.age_score }}
            labelA={displayName(a)}
            labelB={displayName(b)}
          />
        </div>
        <div className="card flex flex-col justify-center p-6">
          <p className="eyebrow mb-2 text-gold">Why they fit</p>
          <p className="editorial text-lg leading-snug text-ink">
            {match.summary_reasoning || "Mutual high-quality match across attraction, background, career and age."}
          </p>
          {match.career_reasoning && (
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              <span className="font-medium text-muted">Career: </span>
              {match.career_reasoning}
            </p>
          )}
        </div>
      </div>

      {/* Directional detail */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DirectionPanel from={a} to={b} pair={aToB} />
        <DirectionPanel from={b} to={a} pair={bToA} />
      </div>

      {/* Profiles */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ProfileCard u={a} sub={a.readable_username ? `@${a.readable_username}` : a.pseudonym ?? ""} />
        <ProfileCard u={b} sub={b.readable_username ? `@${b.readable_username}` : b.pseudonym ?? ""} />
      </div>
    </div>
  );
}
