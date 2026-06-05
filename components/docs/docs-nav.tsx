"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PAGES = [
  { href: "/docs", label: "Tổng quan" },
  { href: "/docs/bao-mat", label: "Bảo mật" },
  { href: "/docs/tinh-nang", label: "Tính năng" },
  { href: "/docs/trien-khai", label: "Triển khai" },
  { href: "/docs/khoi-phuc", label: "Khôi phục & FAQ" },
];

export function DocsNav() {
  const path = usePathname();
  const active = (href: string) =>
    href === "/docs" ? path === "/docs" : path.startsWith(href);

  return (
    <nav className="lg:sticky lg:top-24 lg:self-start">
      <div className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:pb-0">
        <div className="hidden px-2.5 pb-2 text-[11px] uppercase tracking-[0.12em] text-smoke lg:block">
          Tài liệu
        </div>
        {PAGES.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className={`shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm transition ${
              active(p.href)
                ? "bg-azure/[0.08] text-snow"
                : "text-silver hover:bg-ash hover:text-snow"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
