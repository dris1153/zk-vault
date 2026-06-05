// Presentational flow-diagram primitives in the DESIGN.md azure system.
// Color language: keys/secrets = azure, ciphertext = smoke/ash, client
// plaintext = snow. No external deps, responsive (no fixed SVG coordinates).

import type { ReactNode } from "react";

type Tone = "plain" | "key" | "cipher" | "muted";

const TONES: Record<Tone, string> = {
  plain: "border-slate bg-obsidian text-snow",
  key: "border-azure/40 bg-azure/[0.08] text-azure",
  cipher: "border-charcoal bg-ash text-smoke",
  muted: "border-charcoal bg-obsidian text-silver",
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
      className={`rounded-2xl border px-4 py-3 text-center text-sm leading-snug ${
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
      <div className="flex items-center gap-1 px-1 text-azure">
        <span className="h-px w-5 bg-azure" />
        <span className="-ml-1 text-xs">›</span>
        {label && <span className="ml-1 text-[11px] text-smoke">{label}</span>}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center py-1 text-azure">
      <span className="h-4 w-px bg-azure" />
      <span className="-mt-2 text-xs leading-none">▼</span>
      {label && <span className="mt-0.5 text-[11px] text-smoke">{label}</span>}
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
    <figure className="my-6 rounded-2xl border border-charcoal bg-obsidian p-5">
      <div className="flex flex-col gap-0">{children}</div>
      {caption && (
        <figcaption className="mt-4 text-center text-xs text-smoke">
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
    <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-silver">
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
