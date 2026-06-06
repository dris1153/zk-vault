"use client";

// API-key service logo. Known service -> BrandIcon (svg / png + monogram on fail);
// unknown / custom service -> a network-free monogram of the typed name.

import { findServiceByName } from "@/lib/ui/services";
import { BrandIcon } from "./brand-icon";
import { Monogram } from "./platform-icon";

export function ServiceIcon({
  service,
  size = 18,
}: {
  service: string;
  size?: number;
}) {
  const found = findServiceByName(service);
  if (!found) return <Monogram label={service || "?"} size={size} />;
  return <BrandIcon iconRef={found.icon} label={found.name} size={size} />;
}
