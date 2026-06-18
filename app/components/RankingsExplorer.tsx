"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Avatar } from "./Avatar";
import { Chip } from "./Chip";
import { ScoreRing } from "./ScoreRing";
import { FactorBars } from "./FactorBars";
import { displayName, verdictChip, scoreColor } from "../lib/format";

interface SlimUser {
  user_id: string;
  full_name: string | null;
  pseudonym: string | null;
  readable_username: string | null;
  gender: string | null;
  age: number | null;
  location_city: string | null;
  visual_percentile: number | null;
  visual_composite: number | null;
  archetype: string | null;
  career_text: string | null;
  photo_paths_json: string[] | null;
  matched: boolean;
}

interface SlimPair {
  rank: number | null;
  direction: string | null;
  final_score: number | null;
  raw_score: number | null;
  llm_score: number | null;
  attraction: number | null;
  background: number | null;
  career: number | null;
  age_score: number | null;
  verdict: string | null;
  one_line_hook: string | null;
  rationale: string | null;
  career_reasoning: string | null;
  dealbreaker_violated: boolean | null;
  red_flags_json: string[] | null;
}

interface Candidate {
  match_id: number | null;
  candidate: SlimUser;
  pair: SlimPair;
}

interface Person {
  user: SlimUser;
  best: number | null;
  avgTop: number | null;
  strongCount: number;
  evaluated: number;
  candidates: Candidate[];
}

type SortKey = "best" | "avg" | "strong" | "attractiveness" | "name";

export function RankingsExplorer({ people, focus }: { people: Person[]; focus?: string }) {
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState<"all" | "man" | "woman">("all");
  const [minBest, setMinBest] = useState(0);
  const [withMatchesOnly, setWithMatchesOnly] = useState(false);
  const [strongOnly, setStrongOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("best");
  const [openId, setOpenId] = useState<string | null>(null);

  const byId = useMemo(() => new Map(people.map((p) => [p.user.user_id, p])), [people]);

  // Auto-open the focused person (deep link from another page).
  useEffect(() => {
    if (focus && byId.has(focus)) setOpenId(focus);
  }, [focus, byId]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    let out = people.filter((p) => {
      const u = p.user;
      if (gender !== "all" && u.gender !== gender) return false;
      if (withMatchesOnly && p.evaluated === 0) return false;
      if (strongOnly && p.strongCount === 0) return false;
      if (minBest && (p.best ?? 0) < minBest) return false;
      if (s) {
        const hay = [u.full_name, u.readable_username, u.pseudonym, u.location_city, u.career_text]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
    out = [...out].sort((a, b) => {
      switch (sort) {
        case "avg":
          return (b.avgTop ?? -1) - (a.avgTop ?? -1);
        case "strong":
          return b.strongCount - a.strongCount || (b.best ?? -1) - (a.best ?? -1);
        case "attractiveness":
          return (b.user.visual_percentile ?? -1) - (a.user.visual_percentile ?? -1);
        case "name":
          return displayName(a.user).localeCompare(displayName(b.user));
        default:
          return (b.best ?? -1) - (a.best ?? -1);
      }
    });
    return out;
  }, [people, search, gender, minBest, withMatchesOnly, strongOnly, sort]);

  const open = openId ? byId.get(openId) ?? null : null;

  function exportCsv() {
    const header = [
      "person", "person_gender", "person_age", "person_city", "person_pct",
      "rank", "candidate", "candidate_gender", "final_score", "raw_score", "llm_score",
      "attraction", "background", "career", "age", "verdict", "hook",
    ];
    const lines: string[] = [];
    for (const p of filtered) {
      for (const c of p.candidates) {
        lines.push(
          [
            displayName(p.user), p.user.gender, p.user.age, p.user.location_city, p.user.visual_percentile,
            c.pair.rank, displayName(c.candidate), c.candidate.gender,
            c.pair.final_score?.toFixed(3), c.pair.raw_score?.toFixed(3), c.pair.llm_score?.toFixed(3),
            c.pair.attraction?.toFixed(3), c.pair.background?.toFixed(3), c.pair.career?.toFixed(3),
            c.pair.age_score?.toFixed(3), c.pair.verdict, c.pair.one_line_hook,
          ]
            .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
            .join(",")
        );
      }
    }
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wingy-top-matches.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="card mb-8 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <input
            className="input min-w-[220px] flex-1"
            placeholder="Search name, username, city, career…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-1.5">
            {(["all", "woman", "man"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={`btn ${gender === g ? "btn-primary" : "btn-ghost"} !px-4 !py-2 capitalize`}
              >
                {g}
              </button>
            ))}
          </div>
          <button
            onClick={() => setWithMatchesOnly((v) => !v)}
            className={`btn ${withMatchesOnly ? "btn-primary" : "btn-ghost"} !px-4 !py-2`}
          >
            Has candidates
          </button>
          <button
            onClick={() => setStrongOnly((v) => !v)}
            className={`btn ${strongOnly ? "btn-primary" : "btn-ghost"} !px-4 !py-2`}
          >
            ★ Has strong
          </button>
          <select
            className="input cursor-pointer"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="best">Sort: Best match score</option>
            <option value="avg">Sort: Avg of top 5</option>
            <option value="strong"># of strong matches</option>
            <option value="attractiveness">Attractiveness %</option>
            <option value="name">Name (A–Z)</option>
          </select>
          <button onClick={exportCsv} className="btn btn-ghost !px-4 !py-2">
            Export CSV
          </button>
        </div>

        <div className="mt-5 max-w-xs">
          <label className="flex flex-col gap-1">
            <span className="flex justify-between text-[11px] text-ink/55">
              <span className="uppercase tracking-wide">Min best-match score</span>
              <span className="font-mono">{Math.round(minBest * 100)}+</span>
            </span>
            <input
              type="range" min={0} max={1} step={0.05} value={minBest}
              onChange={(e) => setMinBest(Number(e.target.value))}
            />
          </label>
        </div>
      </div>

      <p className="mb-5 text-sm text-ink/55">
        <span className="font-mono text-ink">{filtered.length}</span> of {people.length} people in the pool
      </p>

      {/* Person grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <PersonCard key={p.user.user_id} person={p} onOpen={() => setOpenId(p.user.user_id)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card mt-2 p-12 text-center text-ink/50">No one in the pool fits these filters.</div>
      )}

      {open && <RankingDrawer person={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function PersonCard({ person, onOpen }: { person: Person; onOpen: () => void }) {
  const u = person.user;
  const top = person.candidates.slice(0, 4);
  return (
    <button
      onClick={onOpen}
      className="card card-hover group block w-full p-5 text-left"
    >
      <div className="flex items-center gap-3">
        <Avatar user={u} size={52} ring />
        <div className="min-w-0 flex-1">
          <p className="editorial truncate text-base font-semibold text-ink">{displayName(u)}</p>
          <p className="truncate text-xs text-ink/45">{[u.age, u.location_city].filter(Boolean).join(" · ")}</p>
        </div>
        {person.best != null ? (
          <ScoreRing score={person.best} size={50} label="best" />
        ) : (
          <div className="text-right">
            <p className="font-mono text-sm text-ink/40">—</p>
            <p className="text-[10px] uppercase tracking-wide text-ink/40">best</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {u.gender && <Chip tone={u.gender === "woman" ? "purple" : "blue"}>{u.gender}</Chip>}
        {u.visual_percentile != null && <Chip tone="orange">{u.visual_percentile}th pct</Chip>}
        {person.strongCount > 0 && <Chip tone="green">★ {person.strongCount} strong</Chip>}
      </div>

      <div className="mt-4 flex items-center justify-between">
        {person.evaluated > 0 ? (
          <div className="flex items-center -space-x-2.5">
            {top.map((c) => (
              <Avatar key={c.candidate.user_id} user={c.candidate} size={30} ring />
            ))}
            {person.evaluated > top.length && (
              <span className="ml-3.5 text-[11px] text-ink/45">+{person.evaluated - top.length}</span>
            )}
          </div>
        ) : (
          <span className="text-xs italic text-ink/40">No candidates evaluated</span>
        )}
        <span className="text-xs font-medium text-muted opacity-0 transition group-hover:opacity-100">
          View top 5 →
        </span>
      </div>
    </button>
  );
}

function RankingDrawer({ person, onClose }: { person: Person; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const u = person.user;

  // Portal to <body> so the fixed overlay escapes the page's transformed
  // (animate-fade-up) wrapper — a transformed ancestor otherwise becomes the
  // containing block for position:fixed and traps the drawer in the column.
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] animate-fade-up"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto bg-cream shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-ink/8 bg-cream/95 px-6 py-5 backdrop-blur-md">
          <div className="flex items-start gap-4">
            <Avatar user={u} size={64} ring />
            <div className="min-w-0 flex-1">
              <h2 className="editorial truncate text-xl font-semibold text-ink">{displayName(u)}</h2>
              <p className="text-xs text-ink/45">
                {[u.age, u.location_city, u.archetype].filter(Boolean).join(" · ")}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {u.gender && <Chip tone={u.gender === "woman" ? "purple" : "blue"}>{u.gender}</Chip>}
                {u.visual_percentile != null && <Chip tone="orange">{u.visual_percentile}th pct</Chip>}
                {person.strongCount > 0 && <Chip tone="green">★ {person.strongCount} strong</Chip>}
              </div>
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost !h-9 !w-9 !p-0 text-lg leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <p className="mt-3 text-xs uppercase tracking-wide text-gold">
            Top {person.candidates.length} {person.candidates.length === 1 ? "match" : "matches"}
            {person.evaluated > person.candidates.length ? ` of ${person.evaluated} evaluated` : ""}
          </p>
        </div>

        {/* Candidate list */}
        <div className="flex flex-col gap-4 px-6 py-5">
          {person.candidates.length === 0 && (
            <div className="card p-10 text-center text-sm text-ink/50">
              No candidates were evaluated for {displayName(u)} in this run.
            </div>
          )}
          {person.candidates.map((c, i) => (
            <CandidateRow key={c.candidate.user_id} c={c} index={i} />
          ))}
        </div>
      </aside>
    </div>,
    document.body
  );
}

function CandidateRow({ c, index }: { c: Candidate; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const cand = c.candidate;
  const v = verdictChip(c.pair.verdict ?? null);
  const rank = c.pair.rank ?? index + 1;

  return (
    <div className="card p-5">
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center gap-1">
          <span className="editorial text-lg font-black text-ink/25">#{rank}</span>
          <Avatar user={cand} size={48} ring />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="editorial truncate text-base font-semibold text-ink">{displayName(cand)}</p>
              <p className="truncate text-xs text-ink/45">
                {[cand.gender, cand.age, cand.location_city].filter(Boolean).join(" · ")}
              </p>
            </div>
            <ScoreRing score={c.pair.final_score} size={52} label="fit" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className={`chip ${v.cls}`}>{v.label}</span>
            {c.pair.llm_score != null && <Chip tone="ink">LLM {Math.round(c.pair.llm_score * 100)}</Chip>}
            {cand.visual_percentile != null && <Chip tone="orange">{cand.visual_percentile}th pct</Chip>}
            {c.match_id != null && <Chip tone="green">✓ Mutual match</Chip>}
            {c.pair.dealbreaker_violated && <Chip tone="red">Dealbreaker</Chip>}
          </div>
        </div>
      </div>

      {c.pair.one_line_hook && (
        <p className="mt-3 text-sm italic leading-snug text-ink-soft">“{c.pair.one_line_hook}”</p>
      )}

      <div className="mt-4">
        <FactorBars
          values={{
            attraction: c.pair.attraction,
            background: c.pair.background,
            career: c.pair.career,
            age: c.pair.age_score,
          }}
        />
      </div>

      {(c.pair.rationale || c.pair.career_reasoning || (c.pair.red_flags_json?.length ?? 0) > 0) && (
        <button
          onClick={() => setExpanded((x) => !x)}
          className="nav-link mt-3 inline-block text-xs text-muted"
        >
          {expanded ? "Hide reasoning" : "Why this match →"}
        </button>
      )}

      {expanded && (
        <div className="mt-3 flex flex-col gap-3">
          {c.pair.career_reasoning && (
            <div className="rounded-card bg-cream-alt/60 p-3">
              <p className="eyebrow mb-1 text-gold">Career reasoning</p>
              <p className="text-sm leading-relaxed text-ink-soft">{c.pair.career_reasoning}</p>
            </div>
          )}
          {c.pair.rationale && <p className="text-sm leading-relaxed text-ink-soft">{c.pair.rationale}</p>}
          {(c.pair.red_flags_json?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {c.pair.red_flags_json!.map((f, i) => (
                <Chip key={i} tone="red">⚑ {f}</Chip>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center gap-4 border-t border-ink/6 pt-3 text-xs">
        <Link href={`/pool?focus=${cand.user_id}`} className="nav-link text-ink/55">
          View profile →
        </Link>
        {c.match_id != null && (
          <Link href={`/match/${c.match_id}`} className="nav-link text-muted">
            Open mutual match →
          </Link>
        )}
        <span className="ml-auto flex items-center gap-1.5 text-ink/40">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: scoreColor(c.pair.final_score) }}
          />
          raw {c.pair.raw_score != null ? Math.round(c.pair.raw_score * 100) : "—"}
        </span>
      </div>
    </div>
  );
}
