// Shared brand-logo helpers + type. All local logos live in one folder:
// `public/brand/<id>.(png|webp)`. Used by the platform, engine, and service
// registries, and rendered by <BrandIcon> / <PlatformIcon>.

import type { ComponentType } from "react";

export type IconComp = ComponentType<{ size?: number; className?: string }>;

export type BrandIconRef =
  | { kind: "svg"; Comp: IconComp }
  | { kind: "png"; src: string }
  | { kind: "webp"; src: string };

export const svg = (Comp: IconComp): BrandIconRef => ({ kind: "svg", Comp });
export const png = (id: string): BrandIconRef => ({
  kind: "png",
  src: `/brand/${id}.png`,
});
export const webp = (id: string): BrandIconRef => ({
  kind: "webp",
  src: `/brand/${id}.webp`,
});
