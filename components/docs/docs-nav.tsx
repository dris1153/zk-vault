"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const GROUPS = [
  {
    label: "Người dùng",
    pages: [
      { href: "/docs", label: "Tổng quan" },
      { href: "/docs/bat-dau", label: "Bắt đầu" },
      { href: "/docs/tinh-nang", label: "Hướng dẫn dùng" },
      { href: "/docs/khoi-phuc", label: "Khôi phục & FAQ" },
    ],
  },
  {
    label: "Nhà phát triển",
    pages: [
      { href: "/docs/bao-mat", label: "Bảo mật & kiến trúc" },
      { href: "/docs/trien-khai", label: "Triển khai" },
    ],
  },
];

export function DocsNav() {
  const path = usePathname();
  const active = (href: string) =>
    href === "/docs" ? path === "/docs" : path.startsWith(href);

  return (
    <nav className="lg:sticky lg:top-24 lg:self-start">
      <div className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-0 lg:pb-0">
        {GROUPS.map((g) => (
          <div
            key={g.label}
            className="flex shrink-0 gap-1 lg:mb-4 lg:flex-col lg:gap-0.5"
          >
            <div className="hidden px-3 pb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted lg:block">
              {g.label}
            </div>
            {g.pages.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  active(p.href)
                    ? "bg-inset text-ink"
                    : "text-muted hover:bg-inset/70 hover:text-ink"
                }`}
              >
                {p.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}
