export function Chip({
  children,
  className = "",
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "blue" | "green" | "purple" | "yellow" | "red" | "orange" | "ink";
}) {
  const tones: Record<string, string> = {
    blue: "bg-chip-blue text-[#1a5e7a]",
    green: "bg-chip-green text-muted",
    purple: "bg-chip-purple text-[#4b3f9e]",
    yellow: "bg-chip-yellow text-[#7a6418]",
    red: "bg-chip-red text-rust",
    orange: "bg-chip-orange text-[#9c5a18]",
    ink: "bg-ink/6 text-ink/70",
  };
  return <span className={`chip ${tone ? tones[tone] : ""} ${className}`}>{children}</span>;
}
