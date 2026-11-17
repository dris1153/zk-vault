// Presentational flow-diagram primitives in the DESIGN.md Campsite system.
// Color language: keys/secrets = warm accent wash, ciphertext = muted inset,
// client plaintext = white surface. No external deps, responsive.

import type { ReactNode } from "react";

type Tone = "plain" | "key" | "cipher" | "muted";

const TONES: Record<Tone, string> = {
  plain: "border-line bg-surface text-ink shadow-row",
  key: "border-accent/30 bg-accent-wash text-accent-ink",
  cipher: "border-line bg-inset text-ink-2",
  muted: "border-line bg-canvas text-ink-2",
};

export function FlowNode({
  children,
  tone = "plain",
  mono,
}: {
  children: ReactNode;
  tone?: Tone;
  mono?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-center text-sm leading-snug ${
        mono ? "font-mono text-[13px]" : ""
      } ${TONES[tone]}`}
    >
      {children}
    </div>
  );
}

export function Arrow({
  dir = "down",
  label,
}: {
  dir?: "down" | "right";
  label?: string;
}) {
  if (dir === "right") {
    return (
      <div className="flex items-center gap-1 px-1 text-ink-2">
        <span className="h-px w-5 bg-ink-2" />
        <span className="-ml-1 text-xs">›</span>
        {label && <span className="ml-1 text-[11px] text-muted">{label}</span>}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center py-1 text-ink-2">
      <span className="h-4 w-px bg-ink-2" />
      <span className="-mt-2 text-xs leading-none">▼</span>
      {label && <span className="mt-0.5 text-[11px] text-muted">{label}</span>}
    </div>
  );
}

/** Vertical flow column: alternate FlowNode and Arrow children. */
export function Flow({ children }: { children: ReactNode }) {
  return <div className="flex flex-col items-stretch">{children}</div>;
}

/** One node splitting into multiple parallel nodes. */
export function Branch({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}

/** Bordered panel that frames a diagram, with optional caption. */
export function DiagramFrame({
  children,
  caption,
}: {
  children: ReactNode;
  caption?: string;
}) {
  return (
    <figure className="my-6 rounded-xl border border-line bg-surface p-5 shadow-card">
      <div className="flex flex-col gap-0">{children}</div>
      {caption && (
        <figcaption className="mt-4 text-center text-xs text-muted">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export function Legend() {
  const items: { tone: Tone; label: string }[] = [
    { tone: "key", label: "Khóa / bí mật" },
    { tone: "plain", label: "Plaintext (chỉ ở trình duyệt)" },
    { tone: "cipher", label: "Ciphertext (lưu Supabase)" },
  ];
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-ink-2">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span
            className={`inline-block h-3 w-3 rounded-[4px] border ${TONES[i.tone]}`}
          />
          {i.label}
        </span>
      ))}
    </div>
  );
}
