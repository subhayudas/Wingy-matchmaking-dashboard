export function PageHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-ink/8 pb-6">
      <div>
        {eyebrow && <p className="eyebrow mb-2 text-gold">{eyebrow}</p>}
        <h1 className="display-l text-ink">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/55">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
