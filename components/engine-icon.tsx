"use client";

// Renders a database engine logo: a bundled developer-icons SVG, or a local PNG
// at /engine/<id>.png with a network-free monogram fallback. Mirrors PlatformIcon.

import { useState } from "react";
import { engineIconRef, engineLabel } from "@/lib/ui/db-engines";
import { Monogram } from "./platform-icon";

export function EngineIcon({
  engine,
  size = 18,
}: {
  engine: string;
  size?: number;
}) {
  const ref = engineIconRef(engine);
  if (ref.kind === "svg") {
    const Comp = ref.Comp;
    return <Comp size={size} />;
  }
  return <EnginePng src={ref.src} label={engineLabel(engine)} size={size} />;
}

function EnginePng({
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
