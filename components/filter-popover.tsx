"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Funnel, Star, ShieldCheck, Hash } from "@phosphor-icons/react/dist/ssr";
import type { VaultItem } from "@/lib/vault/items";
import type { VaultItemType } from "@/lib/supabase/types";
import {
  FACET_BY_TYPE,
  facetOptions,
  SORT_OPTIONS,
  showsFavFilter,
  shows2FAFilter,
  type Category,
  type SortKey,
} from "@/lib/ui/item-filters";
import { PLATFORMS } from "@/lib/ui/platforms";
import { Select } from "./select";
import { PlatformIcon } from "./platform-icon";
import { EngineIcon } from "./engine-icon";
import { ServiceIcon } from "./service-icon";
import { CheckboxBox } from "./ui-kit";

function facetIcon(category: Category, value: string): ReactNode {
  if (category === "login") {
    const p = PLATFORMS.find((x) => x.name === value) ?? null;
    return <PlatformIcon platform={p} url={value} favicon={false} size={16} />;
  }
  if (category === "database") return <EngineIcon engine={value} size={16} />;
  if (category === "api_key") return <ServiceIcon service={value} size={16} />;
  return undefined;
}

export function FilterPopover({
  category,
  categoryItems,
  allTags,
  facet,
  onFacet,
  sort,
  onSort,
  favOnly,
  onFavOnly,
  twoFAOnly,
  onTwoFAOnly,
  tags,
  onToggleTag,
  tagMode,
  onTagMode,
  onClearAll,
}: {
  category: Category;
  categoryItems: VaultItem[];
  allTags: string[];
  facet: string;
  onFacet: (v: string) => void;
  sort: SortKey;
  onSort: (v: SortKey) => void;
  favOnly: boolean;
  onFavOnly: (v: boolean) => void;
  twoFAOnly: boolean;
  onTwoFAOnly: (v: boolean) => void;
  tags: string[];
  onToggleTag: (t: string) => void;
  tagMode: "any" | "all";
  onTagMode: (m: "any" | "all") => void;
  onClearAll: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const typeFacet =
    category !== "all" && category !== "favorites"
      ? FACET_BY_TYPE[category as VaultItemType]
      : undefined;
  const options = typeFacet ? facetOptions(typeFacet, categoryItems) : [];

  const activeCount =
    (facet ? 1 : 0) +
    (sort !== "updated" ? 1 : 0) +
    (favOnly && showsFavFilter(category) ? 1 : 0) +
    (twoFAOnly && shows2FAFilter(category) ? 1 : 0) +
    tags.length;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
          activeCount > 0 || open
            ? "border-ink bg-inset text-ink"
            : "border-line bg-surface text-muted hover:bg-inset hover:text-ink"
        }`}
      >
        <Funnel size={15} />
        <span className="hidden sm:inline">Lọc</span>
        {activeCount > 0 && (
          <span className="rounded-full bg-ink px-1.5 text-[11px] font-semibold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-4 top-16 z-30 rounded-xl border border-line bg-surface p-4 shadow-card sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-80">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
              Sắp xếp &amp; lọc
            </span>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs font-medium text-ink hover:underline"
              >
                Xóa lọc
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3.5">
            <div>
              <div className="mb-1 text-xs font-medium text-muted">Sắp xếp</div>
              <Select value={sort} onChange={onSort} options={SORT_OPTIONS} />
            </div>

            {typeFacet && options.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-medium text-muted">
                  {typeFacet.label}
                </div>
                <Select
                  value={facet}
                  onChange={onFacet}
                  options={[
                    {
                      value: "",
                      label: `Tất cả ${typeFacet.label.toLowerCase()}`,
                    },
                    ...options.map((o) => ({
                      value: o,
                      label: typeFacet.optionLabel(o),
                      icon: facetIcon(category, o),
                    })),
                  ]}
                />
              </div>
            )}

            {(showsFavFilter(category) || shows2FAFilter(category)) && (
              <div className="flex flex-wrap gap-1.5">
                {showsFavFilter(category) && (
                  <button
                    type="button"
                    onClick={() => onFavOnly(!favOnly)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      favOnly
                        ? "border-ink bg-ink text-white"
                        : "border-line bg-surface text-muted hover:bg-inset hover:text-ink"
                    }`}
                  >
                    <Star size={13} weight={favOnly ? "fill" : "regular"} />
                    Yêu thích
                  </button>
                )}
                {shows2FAFilter(category) && (
                  <button
                    type="button"
                    onClick={() => onTwoFAOnly(!twoFAOnly)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      twoFAOnly
                        ? "border-ink bg-ink text-white"
                        : "border-line bg-surface text-muted hover:bg-inset hover:text-ink"
                    }`}
                  >
                    <ShieldCheck size={13} />
                    Có 2FA
                  </button>
                )}
              </div>
            )}

            {allTags.length > 0 && (
              <div className="border-t border-line pt-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted">Tags</span>
                  <div className="flex overflow-hidden rounded-full border border-line bg-inset text-[10px]">
                    <button
                      type="button"
                      onClick={() => onTagMode("any")}
                      className={`px-2 py-0.5 transition ${
                        tagMode === "any"
                          ? "bg-ink font-medium text-white"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      Bất kỳ
                    </button>
                    <button
                      type="button"
                      onClick={() => onTagMode("all")}
                      className={`px-2 py-0.5 transition ${
                        tagMode === "all"
                          ? "bg-ink font-medium text-white"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      Tất cả
                    </button>
                  </div>
                </div>
                <div className="flex max-h-36 flex-col gap-1 overflow-y-auto">
                  {allTags.map((t) => {
                    const on = tags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => onToggleTag(t)}
                        className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-xs transition ${
                          on
                            ? "bg-inset font-medium text-ink"
                            : "text-muted hover:bg-inset/70 hover:text-ink"
                        }`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <Hash size={12} /> {t}
                        </span>
                        <CheckboxBox checked={on} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
