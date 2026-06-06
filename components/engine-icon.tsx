"use client";

// Database engine logo. Thin wrapper over BrandIcon (svg / png / webp + monogram).

import { engineIconRef, engineLabel } from "@/lib/ui/db-engines";
import { BrandIcon } from "./brand-icon";

export function EngineIcon({
  engine,
  size = 18,
}: {
  engine: string;
  size?: number;
}) {
  return (
    <BrandIcon
      iconRef={engineIconRef(engine)}
      label={engineLabel(engine)}
      size={size}
    />
  );
}
