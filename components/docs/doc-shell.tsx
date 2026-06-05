"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { BrandMark } from "@/components/brand-mark";

export interface TocItem {
  id: string;
  label: string;
}

export function DocShell({
  toc,
  children,
}: {
  toc: TocItem[];
  children: React.ReactNode;
}) {
  const [active, setActive] = useState(toc[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );
    for (const t of toc) {
      const el = document.getElementById(t.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [toc]);

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-charcoal bg-obsidian/90 px-5 backdrop-blur">
        <div className="flex items-center gap-2.5 font-medium">
          <BrandMark variant="tile" size={22} />
          Vault
          <span className="text-smoke">· Tài liệu</span>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-full border border-slate px-3 py-1.5 text-sm text-silver transition hover:border-graphite hover:text-snow"
        >
          <ArrowLeft size={15} /> Quay lại vault
        </Link>
      </header>

      <div className="mx-auto grid max-w-[1080px] grid-cols-1 gap-10 px-5 py-10 lg:grid-cols-[210px_1fr]">
        <nav className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-1">
            <div className="px-2.5 pb-2 text-[11px] uppercase tracking-[0.12em] text-smoke">
              Mục lục
            </div>
            {toc.map((t) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className={`rounded-lg px-2.5 py-1.5 text-sm transition ${
                  active === t.id
                    ? "bg-azure/[0.08] text-snow"
                    : "text-silver hover:bg-ash hover:text-snow"
                }`}
              >
                {t.label}
              </a>
            ))}
          </div>
        </nav>

        <main className="min-w-0 max-w-[760px]">{children}</main>
      </div>
    </div>
  );
}
