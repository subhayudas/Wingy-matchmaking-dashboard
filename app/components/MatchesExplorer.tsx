"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Avatar } from "./Avatar";
import { Chip } from "./Chip";
import { ScoreRing } from "./ScoreRing";
import { displayName, scoreColor } from "../lib/format";

interface Row {
  id: number;
  a: any;
  b: any;
  combined: number;
  aToB: number;
  bToA: number;
  strong: boolean;
  status: string;
  hook: string | null;
  factors: { attraction: number; background: number; career: number; age: number };
  minPct: number;
}

export function MatchesExplorer({ rows }: { rows: Row[] }) {
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState<"all" | "man" | "woman">("all");
  const [strongOnly, setStrongOnly] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [minPct, setMinPct] = useState(0);
  const [factorMins, setFactorMins] = useState({ attraction: 0, background: 0, career: 0, age: 0 });
  const [sort, setSort] = useState<"combined" | "attraction" | "career">("combined");

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    let out = rows.filter((r) => {
      if (strongOnly && !r.strong) return false;
      if (minScore && r.combined / 2 < minScore) return false;
      if (minPct && r.minPct < minPct) return false;
      if (gender !== "all" && r.a.gender !== gender && r.b.gender !== gender) return false;
      if (factorMins.attraction && r.factors.attraction < factorMins.attraction) return false;
      if (factorMins.background && r.factors.background < factorMins.background) return false;
      if (factorMins.career && r.factors.career < factorMins.career) return false;
      if (factorMins.age && r.factors.age < factorMins.age) return false;
      if (s) {
        const hay = [r.a, r.b]
          .map((u) => [u.full_name, u.readable_username, u.pseudonym, u.location_city].join(" "))
          .join(" ")
          .toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
    out = out.sort((x, y) => {
      if (sort === "attraction") return y.factors.attraction - x.factors.attraction;
      if (sort === "career") return y.factors.career - x.factors.career;
      return y.combined - x.combined;
    });
    return out;
  }, [rows, search, gender, strongOnly, minScore, minPct, factorMins, sort]);

  function exportCsv() {
    const header = ["person_a", "person_b", "combined", "a_to_b", "b_to_a", "strong_mutual", "attraction", "background", "career", "age", "status"];
    const lines = filtered.map((r) =>
      [
        displayName(r.a), displayName(r.b),
        (r.combined / 2).toFixed(3), r.aToB.toFixed(3), r.bToA.toFixed(3),
        r.strong, r.factors.attraction.toFixed(3), r.factors.background.toFixed(3),
        r.factors.career.toFixed(3), r.factors.age.toFixed(3), r.status,
      ].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wingy-matches.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const FactorSlider = ({ k, label }: { k: keyof typeof factorMins; label: string }) => (
    <label className="flex flex-col gap-1">
      <span className="flex justify-between text-[11px] text-ink/55">
        <span className="uppercase tracking-wide">{label}</span>
        <span className="font-mono">{Math.round(factorMins[k] * 100)}+</span>
      </span>
      <input
        type="range" min={0} max={1} step={0.05} value={factorMins[k]}
        onChange={(e) => setFactorMins((f) => ({ ...f, [k]: Number(e.target.value) }))}
      />
    </label>
  );

  return (
    <div>
      {/* Filter bar */}
      <div className="card mb-8 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <input
            className="input min-w-[220px] flex-1"
            placeholder="Search name, username, city…"
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
            onClick={() => setStrongOnly((v) => !v)}
            className={`btn ${strongOnly ? "btn-primary" : "btn-ghost"} !px-4 !py-2`}
          >
            ★ Strong mutual
          </button>
          <select
            className="input cursor-pointer"
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
          >
            <option value="combined">Sort: Best overall</option>
            <option value="attraction">Sort: Attraction</option>
            <option value="career">Sort: Career</option>
          </select>
          <button onClick={exportCsv} className="btn btn-ghost !px-4 !py-2">
            Export CSV
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
          <label className="flex flex-col gap-1">
            <span className="flex justify-between text-[11px] text-ink/55">
              <span className="uppercase tracking-wide">Min score</span>
              <span className="font-mono">{Math.round(minScore * 100)}+</span>
            </span>
            <input type="range" min={0} max={1} step={0.05} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="flex justify-between text-[11px] text-ink/55">
              <span className="uppercase tracking-wide">Attractiveness %</span>
              <span className="font-mono">{minPct}+</span>
            </span>
            <input type="range" min={0} max={100} step={5} value={minPct} onChange={(e) => setMinPct(Number(e.target.value))} />
          </label>
          <FactorSlider k="attraction" label="Attraction" />
          <FactorSlider k="background" label="Background" />
          <FactorSlider k="career" label="Career" />
          <FactorSlider k="age" label="Age" />
        </div>
      </div>

      <div className="mb-5 flex items-baseline justify-between">
        <p className="text-sm text-ink/55">
          <span className="font-mono text-ink">{filtered.length}</span> of {rows.length} mutual matches
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((r) => (
          <Link key={r.id} href={`/match/${r.id}`} className="card card-hover group block p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center -space-x-3">
                <Avatar user={r.a} size={56} ring />
                <Avatar user={r.b} size={56} ring />
              </div>
              <ScoreRing score={r.combined / 2} size={56} />
            </div>
            <div className="mt-4">
              <h3 className="editorial text-lg font-semibold leading-tight text-ink">
                {displayName(r.a)} <span className="text-gold">×</span> {displayName(r.b)}
              </h3>
              <p className="mt-0.5 text-xs text-ink/45">
                {[r.a.age, r.b.age].filter(Boolean).join(" · ")} {r.a.location_city ? `· ${r.a.location_city}` : ""}
              </p>
            </div>
            {r.hook && <p className="mt-3 line-clamp-2 text-sm italic leading-snug text-ink-soft">“{r.hook}”</p>}
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              {r.strong && <Chip tone="green">★ Strong mutual</Chip>}
              <Chip tone="ink">A→B {Math.round(r.aToB * 100)}</Chip>
              <Chip tone="ink">B→A {Math.round(r.bToA * 100)}</Chip>
              <span className="ml-auto flex items-center gap-1 text-[11px] text-ink/40">
                <span className="h-2 w-2 rounded-full" style={{ background: scoreColor(r.factors.attraction) }} />
                {Math.round(r.factors.attraction * 100)} attr
              </span>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card mt-2 p-12 text-center text-ink/50">No matches fit these filters.</div>
      )}
    </div>
  );
}
