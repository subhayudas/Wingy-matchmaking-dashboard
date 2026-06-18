import { scoreColor } from "../lib/format";

const FACTORS: { key: string; label: string }[] = [
  { key: "attraction", label: "Attraction" },
  { key: "background", label: "Background" },
  { key: "career", label: "Career" },
  { key: "age", label: "Age" },
];

export function FactorBars({ values }: { values: Record<string, number | null | undefined> }) {
  return (
    <div className="flex flex-col gap-2.5">
      {FACTORS.map((f) => {
        const v = values[f.key];
        const pctv = v == null ? 0 : Math.max(0, Math.min(1, v));
        return (
          <div key={f.key} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-[11px] uppercase tracking-wide text-ink/55">{f.label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/8">
              <div
                className="h-full rounded-full"
                style={{ width: `${pctv * 100}%`, background: scoreColor(v ?? null), transition: "width 600ms cubic-bezier(0.4,0,0.2,1)" }}
              />
            </div>
            <span className="w-9 shrink-0 text-right font-mono text-[11px] text-ink/70">
              {v == null ? "—" : Math.round(pctv * 100)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
