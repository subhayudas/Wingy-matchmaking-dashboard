"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Matches" },
  { href: "/pool", label: "Pool" },
  { href: "/excluded", label: "Excluded" },
  { href: "/overview", label: "Run Overview" },
];

export function Nav() {
  const path = usePathname();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <header className="sticky top-0 z-50 border-b border-ink/8 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between px-5 py-3.5 md:px-8">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="editorial text-[22px] font-black tracking-tight text-ink">Wingy</span>
          <span className="eyebrow text-muted/70 hidden sm:inline">Matchmaking Studio</span>
        </Link>
        <nav className="flex items-center gap-6">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link text-ink" data-active={isActive(l.href)}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
