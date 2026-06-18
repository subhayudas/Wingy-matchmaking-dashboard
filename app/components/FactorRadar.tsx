"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

export function FactorRadar({
  aToB,
  bToA,
  labelA,
  labelB,
}: {
  aToB: Record<string, number | null | undefined>;
  bToA: Record<string, number | null | undefined>;
  labelA: string;
  labelB: string;
}) {
  const keys = ["attraction", "background", "career", "age"];
  const data = keys.map((k) => ({
    factor: k[0].toUpperCase() + k.slice(1),
    [labelA]: Math.round(((aToB[k] as number) ?? 0) * 100),
    [labelB]: Math.round(((bToA[k] as number) ?? 0) * 100),
  }));
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="rgba(13,21,16,0.12)" />
          <PolarAngleAxis dataKey="factor" tick={{ fill: "#253c31", fontSize: 11 }} />
          <Radar name={labelA} dataKey={labelA} stroke="#2c4839" fill="#2c4839" fillOpacity={0.28} />
          <Radar name={labelB} dataKey={labelB} stroke="#c8933a" fill="#c8933a" fillOpacity={0.22} />
        </RadarChart>
      </ResponsiveContainer>
      <div className="mt-1 flex items-center justify-center gap-5 text-[11px] text-ink/60">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-forest" />{labelA} → {labelB}</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gold" />{labelB} → {labelA}</span>
      </div>
    </div>
  );
}
