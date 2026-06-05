import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { BrandMark } from "@/components/brand-mark";
import { DocsNav } from "@/components/docs/docs-nav";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-charcoal bg-obsidian/90 px-5 backdrop-blur">
        <div className="flex items-center gap-2.5 font-medium">
          <BrandMark variant="tile" size={22} />
          ZKVault
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
        <DocsNav />
        <main className="min-w-0 max-w-[760px]">{children}</main>
      </div>
    </div>
  );
}
