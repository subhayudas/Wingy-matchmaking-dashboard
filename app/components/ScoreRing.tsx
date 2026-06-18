import { scoreColor } from "../lib/format";

export function ScoreRing({
  score,
  size = 64,
  label,
}: {
  score: number | null;
  size?: number;
  label?: string;
}) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const v = score ?? 0;
  const dash = c * v;
  const color = scoreColor(score);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(13,21,16,0.08)" strokeWidth={4} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: "stroke-dasharray 600ms cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="editorial font-bold" style={{ fontSize: size * 0.28, color }}>
          {score == null ? "—" : Math.round(v * 100)}
        </span>
        {label && <span className="mt-0.5 text-[9px] uppercase tracking-wider text-ink/45">{label}</span>}
      </div>
    </div>
  );
}
