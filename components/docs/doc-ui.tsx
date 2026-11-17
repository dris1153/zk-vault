// Presentational text primitives for the docs page (DESIGN.md Campsite typography).

import type { ReactNode } from "react";

export function DocSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mb-16 scroll-mt-24">
      <h2 className="mb-4 text-[29px] font-semibold leading-[1.2] tracking-[-0.52px] text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function H3({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-2 mt-8 text-[18px] font-semibold text-ink">{children}</h3>
  );
}

export function P({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-[15px] leading-relaxed text-ink-2">{children}</p>
  );
}

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-inset px-1.5 py-0.5 font-mono text-[13px] text-ink">
      {children}
    </code>
  );
}

export function CodeBlock({ children }: { children: ReactNode }) {
  return (
    <pre className="my-4 overflow-x-auto rounded-xl border border-line bg-inset p-4 font-mono text-[13px] leading-relaxed text-ink">
      <code>{children}</code>
    </pre>
  );
}

type CalloutTone = "info" | "warn";

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: CalloutTone;
  title?: string;
  children: ReactNode;
}) {
  const styles =
    tone === "warn"
      ? "border-danger/30 bg-danger/5"
      : "border-line bg-accent-wash/60";
  const titleColor = tone === "warn" ? "text-danger" : "text-accent-ink";
  return (
    <div className={`my-4 rounded-xl border p-4 ${styles}`}>
      {title && (
        <div className={`mb-1 text-sm font-semibold ${titleColor}`}>{title}</div>
      )}
      <div className="text-[14px] leading-relaxed text-ink-2">{children}</div>
    </div>
  );
}

export function Steps({ children }: { children: ReactNode }) {
  return <ol className="my-4 flex flex-col gap-4">{children}</ol>;
}

export function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-wash font-mono text-sm font-semibold text-accent-ink">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-1 font-semibold text-ink">{title}</div>
        <div className="text-[14px] leading-relaxed text-ink-2">{children}</div>
      </div>
    </li>
  );
}

export function Bullets({ children }: { children: ReactNode }) {
  return (
    <ul className="my-3 flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-relaxed text-ink-2 marker:text-muted">
      {children}
    </ul>
  );
}
