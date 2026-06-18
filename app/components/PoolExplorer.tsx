"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Avatar } from "./Avatar";
import { Chip } from "./Chip";
import { displayName } from "../lib/format";

interface PoolUser {
  user_id: string;
  full_name: string | null;
  readable_username: string | null;
  pseudonym: string | null;
  gender: string | null;
  age: number | null;
  location_city: string | null;
  visual_percentile: number | null;
  visual_composite: number | null;
  archetype: string | null;
  career_text: string | null;
  persona_summary: string | null;
  matched: boolean;
}

export function PoolExplorer({ users, focus }: { users: PoolUser[]; focus?: string }) {
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState<"all" | "man" | "woman">("all");
  const [minPct, setMinPct] = useState(0);
  const [matchedOnly, setMatchedOnly] = useState(false);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return users.filter((u) => {
      if (gender !== "all" && u.gender !== gender) return false;
      if (minPct && (u.visual_percentile ?? 0) < minPct) return false;
      if (matchedOnly && !u.matched) return false;
      if (s) {
        const hay = [u.full_name, u.readable_username, u.pseudonym, u.location_city, u.career_text].join(" ").toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [users, search, gender, minPct, matchedOnly]);

  return (
    <div>
      <div className="card mb-8 flex flex-wrap items-center gap-3 p-5">
        <input className="input min-w-[220px] flex-1" placeholder="Search name, city, career…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex gap-1.5">
          {(["all", "woman", "man"] as const).map((g) => (
            <button key={g} onClick={() => setGender(g)} className={`btn ${gender === g ? "btn-primary" : "btn-ghost"} !px-4 !py-2 capitalize`}>{g}</button>
          ))}
        </div>
        <button onClick={() => setMatchedOnly((v) => !v)} className={`btn ${matchedOnly ? "btn-primary" : "btn-ghost"} !px-4 !py-2`}>Matched only</button>
        <label className="flex w-40 flex-col gap-1">
          <span className="flex justify-between text-[11px] text-ink/55"><span className="uppercase tracking-wide">Attractiveness %</span><span className="font-mono">{minPct}+</span></span>
          <input type="range" min={0} max={100} step={5} value={minPct} onChange={(e) => setMinPct(Number(e.target.value))} />
        </label>
      </div>

      <p className="mb-5 text-sm text-ink/55"><span className="font-mono text-ink">{filtered.length}</span> of {users.length} eligible users</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((u) => (
          <div key={u.user_id} id={u.user_id} className={`card p-5 ${focus === u.user_id ? "ring-2 ring-gold" : ""}`}>
            <div className="flex items-center gap-3">
              <Avatar user={u} size={52} ring />
              <div className="min-w-0">
                <p className="editorial truncate text-base font-semibold text-ink">{displayName(u)}</p>
                <p className="truncate text-xs text-ink/45">{[u.age, u.location_city].filter(Boolean).join(" · ")}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="font-mono text-sm text-muted">{u.visual_percentile ?? "—"}</p>
                <p className="text-[10px] uppercase tracking-wide text-ink/40">pct</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {u.gender && <Chip tone={u.gender === "woman" ? "purple" : "blue"}>{u.gender}</Chip>}
              {u.matched ? <Chip tone="green">Matched</Chip> : <Chip tone="orange">No match</Chip>}
              {u.archetype && <Chip tone="ink">{u.archetype}</Chip>}
            </div>
            {u.career_text && <p className="mt-3 line-clamp-2 text-xs text-ink-soft">{u.career_text}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
