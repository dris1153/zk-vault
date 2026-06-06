"use client";

// Shared brand-logo renderer: a bundled developer-icons SVG, or a local PNG/WEBP
// with a network-free monogram fallback. Used by engine + service icons (the
// platform icon keeps its own favicon variant).

import { useState } from "react";
import type { BrandIconRef } from "@/lib/ui/brand";
import { Monogram } from "./platform-icon";

export type { BrandIconRef };

export function BrandIcon({
  iconRef,
  label,
  size = 18,
}: {
  iconRef: BrandIconRef;
  label: string;
  size?: number;
}) {
  if (iconRef.kind === "svg") {
    const Comp = iconRef.Comp;
    return <Comp size={size} />;
  }
  return <BrandImg src={iconRef.src} label={label} size={size} />;
}

function BrandImg({
  src,
  label,
  size,
}: {
  src: string;
  label: string;
  size: number;
}) {
  const [broken, setBroken] = useState(false);
  if (broken) return <Monogram label={label} size={size} />;
  return (
    <img
      src={src}
      alt={label}
      width={size}
      height={size}
      className="rounded-[4px] object-contain"
      onError={() => setBroken(true)}
    />
  );
}
