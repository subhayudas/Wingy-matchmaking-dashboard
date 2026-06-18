"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
} from "recharts";
import { scoreColor } from "../lib/format";

export function ScoreHistogram({ data }: { data: { bucket: string; count: number; mid: number }[] }) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -18 }}>
          <XAxis dataKey="bucket" tick={{ fill: "#253c31", fontSize: 10 }} interval={0} />
          <YAxis tick={{ fill: "#253c31", fontSize: 10 }} allowDecimals={false} />
          <Tooltip cursor={{ fill: "rgba(44,72,57,0.06)" }} contentStyle={{ borderRadius: 12, border: "1px solid rgba(13,21,16,0.1)", fontSize: 12 }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={scoreColor(d.mid)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GenderPie({ men, women }: { men: number; women: number }) {
  const data = [
    { name: "Men", value: men, fill: "#5a8ba0" },
    { name: "Women", value: women, fill: "#8a7fc8" },
  ];
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={2}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.fill} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(13,21,16,0.1)", fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="-mt-6 flex justify-center gap-5 text-[11px] text-ink/60">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "#5a8ba0" }} />Men {men}</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "#8a7fc8" }} />Women {women}</span>
      </div>
    </div>
  );
}
