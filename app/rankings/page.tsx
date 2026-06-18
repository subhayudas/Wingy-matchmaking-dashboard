import { getRun, getRankings } from "../lib/queries";
import type { MmUser } from "../lib/queries";
import { RankingsExplorer } from "../components/RankingsExplorer";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";

export const dynamic = "force-dynamic";

// Trim the heavy persona/embedding text columns out of the payload — the
// explorer only needs identity, visuals and career to render cards.
function slimUser(u: MmUser) {
  return {
    user_id: u.user_id,
    full_name: u.full_name,
    pseudonym: u.pseudonym,
    readable_username: u.readable_username,
    gender: u.gender,
    age: u.age,
    location_city: u.location_city,
    visual_percentile: u.visual_percentile,
    visual_composite: u.visual_composite,
    archetype: u.archetype,
    career_text: u.career_text,
    photo_paths_json: u.photo_paths_json,
    matched: u.matched,
  };
}

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: { focus?: string };
}) {
  const run = await getRun();
  if (!run) return <EmptyState title="No matchmaking run found" />;

  const rankings = await getRankings(run.run_id);

  const slim = rankings.map((r) => ({
    user: slimUser(r.user),
    best: r.best,
    avgTop: r.avgTop,
    strongCount: r.strongCount,
    evaluated: r.evaluated,
    candidates: r.candidates.map((c) => ({
      match_id: c.match_id,
      candidate: slimUser(c.candidate),
      pair: {
        rank: c.pair.rank,
        direction: c.pair.direction,
        final_score: c.pair.final_score,
        raw_score: c.pair.raw_score,
        llm_score: c.pair.llm_score,
        attraction: c.pair.attraction,
        background: c.pair.background,
        career: c.pair.career,
        age_score: c.pair.age_score,
        verdict: c.pair.verdict,
        one_line_hook: c.pair.one_line_hook,
        rationale: c.pair.rationale,
        career_reasoning: c.pair.career_reasoning,
        dealbreaker_violated: c.pair.dealbreaker_violated,
        red_flags_json: c.pair.red_flags_json,
      },
    })),
  }));

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Per-person rankings"
        title="Top Matches"
        subtitle="The top 5 candidates for every person in the pool — directional best-fits, not only the confirmed mutual matches. Search, filter and sort the pool to find who has the strongest options, then open anyone to see their five."
      />
      <RankingsExplorer people={slim} focus={searchParams.focus} />
    </div>
  );
}
