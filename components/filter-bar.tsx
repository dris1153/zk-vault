"use client";

import type { ReactNode } from "react";
import { Star, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import type { VaultItem } from "@/lib/vault/items";
import type { VaultItemType } from "@/lib/supabase/types";
import {
  FACET_BY_TYPE,
  facetOptions,
  SORT_OPTIONS,
  type SortKey,
} from "@/lib/ui/item-filters";
import { PLATFORMS } from "@/lib/ui/platforms";
import { Select } from "./select";
import { PlatformIcon } from "./platform-icon";
import { EngineIcon } from "./engine-icon";
import { ServiceIcon } from "./service-icon";
import type { Category } from "./sidebar";

// Single source of truth for which categories show (and therefore apply) each
// filter-bar toggle - so the render gate and the apply logic can never drift
// (a hidden-but-still-applied filter is what caused the empty-result bug).
export const showsFavFilter = (c: Category) => c !== "favorites";
export const shows2FAFilter = (c: Category) => c === "all" || c === "login";

// A bundled logo for a facet value (no favicon fetch): platform logo for Login,
// engine logo for Database; a network-free monogram for unknown domains.
function facetIcon(category: Category, value: string): ReactNode {
  if (category === "login") {
    const p = PLATFORMS.find((x) => x.name === value) ?? null;
    return <PlatformIcon platform={p} url={value} favicon={false} size={16} />;
  }
  if (category === "database") {
    return <EngineIcon engine={value} size={16} />;
  }
  if (category === "api_key") {
    return <ServiceIcon service={value} size={16} />;
  }
  return undefined;
}

export function FilterBar({
  category,
  items,
  facet,
  onFacet,
  sort,
  onSort,
  favOnly,
  onFavOnly,
  twoFAOnly,
  onTwoFAOnly,
}: {
  category: Category;
  items: VaultItem[];
  facet: string;
  onFacet: (v: string) => void;
  sort: SortKey;
  onSort: (v: SortKey) => void;
  favOnly: boolean;
  onFavOnly: (v: boolean) => void;
  twoFAOnly: boolean;
  onTwoFAOnly: (v: boolean) => void;
}) {
  const typeFacet =
    category !== "all" && category !== "favorites"
      ? FACET_BY_TYPE[category as VaultItemType]
      : undefined;
  const options = typeFacet ? facetOptions(typeFacet, items) : [];

  return (
    <div className="flex flex-wrap items-center gap-2 px-6 pt-5">
      {typeFacet && options.length > 0 && (
        <div className="w-45">
          <Select
            value={facet}
            onChange={onFacet}
            options={[
              { value: "", label: `Tất cả ${typeFacet.label.toLowerCase()}` },
              ...options.map((o) => ({
                value: o,
                label: typeFacet.optionLabel(o),
                icon: facetIcon(category, o),
              })),
            ]}
          />
        </div>
      )}

      <div className="w-37.5">
        <Select value={sort} onChange={onSort} options={SORT_OPTIONS} />
      </div>

      {showsFavFilter(category) && (
        <Toggle
          active={favOnly}
          onClick={() => onFavOnly(!favOnly)}
          icon={<Star size={14} weight={favOnly ? "fill" : "regular"} />}
        >
          Yêu thích
        </Toggle>
      )}

      {shows2FAFilter(category) && (
        <Toggle
          active={twoFAOnly}
          onClick={() => onTwoFAOnly(!twoFAOnly)}
          icon={<ShieldCheck size={14} />}
        >
          Có 2FA
        </Toggle>
      )}
    </div>
  );
}

function Toggle({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm transition ${
        active
          ? "border-azure/40 bg-azure/[0.08] text-snow"
          : "border-charcoal text-silver hover:border-slate hover:text-snow"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
