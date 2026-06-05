// App brand mark: an isometric "vault cube" with an ajar lid + azure opening
// rim (DESIGN.md line-art + Electric Azure accent). One source, two variants:
//   tile - azure gradient app-icon container (lock screen, sidebar, docs, favicon)
//   flat - currentColor wireframe + azure accent, transparent (inline / empty state)

import type { CSSProperties } from "react";

const BODY = "M4 7.5 L4 16.5 L12 21 L20 16.5 L20 7.5"; // open box silhouette
const INNER = "M12 12 L20 7.5 M12 12 L12 21 M12 12 L4 7.5"; // 3D cube edges
const RIM = "M4 7.5 L12 12 L20 7.5"; // azure opening rim (the glow)
const LID = "M12 0.6 L20 5.1 L12 9.6 L4 5.1 Z"; // lifted lid rhombus

function Cube({
  size,
  stroke,
  accent,
  className,
}: {
  size: number;
  stroke: string;
  accent: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path d={INNER} stroke={stroke} strokeWidth={1.6} strokeLinecap="round" />
      <path d={BODY} stroke={stroke} strokeWidth={1.6} strokeLinejoin="round" />
      <path d={RIM} stroke={accent} strokeWidth={1.6} strokeLinejoin="round" />
      <path d={LID} stroke={stroke} strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  );
}

export function BrandMark({
  variant = "flat",
  size = 24,
  className = "",
}: {
  variant?: "tile" | "flat";
  size?: number;
  className?: string;
}) {
  if (variant === "tile") {
    const style: CSSProperties = {
      width: size,
      height: size,
      borderRadius: Math.round(size * 0.28),
    };
    return (
      <span
        className={`inline-flex items-center justify-center bg-gradient-to-br from-azure to-azure-depth ${className}`}
        style={style}
      >
        <Cube size={Math.round(size * 0.62)} stroke="#ffffff" accent="#bfe0ff" />
      </span>
    );
  }
  return (
    <Cube size={size} stroke="currentColor" accent="#3e9bff" className={className} />
  );
}
