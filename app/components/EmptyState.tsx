export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card mx-auto mt-16 max-w-xl p-12 text-center">
      <p className="editorial text-2xl font-semibold text-ink">{title}</p>
      {hint && <p className="mt-3 text-sm leading-relaxed text-ink/55">{hint}</p>}
    </div>
  );
}
