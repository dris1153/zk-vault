"use client";

import {
  SquaresFour,
  Star,
  Gear,
  Hash,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { VaultItem } from "@/lib/vault/items";
import type { VaultItemType } from "@/lib/supabase/types";
import { TYPE_ICON, TYPE_LABEL, TYPE_ORDER } from "@/lib/ui/icons";
import { BrandMark } from "./brand-mark";

export type Category = "all" | "favorites" | VaultItemType;

interface SidebarProps {
  items: VaultItem[];
  category: Category;
  onCategory: (c: Category) => void;
  tag: string | null;
  onTag: (t: string | null) => void;
  onOpenSettings: () => void;
  onOpenSecurity: () => void;
  issueCount: number;
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({
  items,
  category,
  onCategory,
  tag,
  onTag,
  onOpenSettings,
  onOpenSecurity,
  issueCount,
  className = "",
  onNavigate,
}: SidebarProps) {
  const countOf = (t: VaultItemType) =>
    items.filter((i) => i.type === t).length;
  const favCount = items.filter((i) => i.favorite).length;
  const tags = uniqueTags(items);
  // Wrap an action so mobile (drawer) usage closes after selecting.
  const nav = (fn: () => void) => () => {
    fn();
    onNavigate?.();
  };

  return (
    <aside
      className={`flex w-60 shrink-0 flex-col gap-1 overflow-y-auto border-r border-charcoal bg-obsidian p-3 ${className}`}
    >
      <div className="flex items-center gap-2.5 px-2.5 pb-4 pt-2 font-medium">
        <BrandMark variant="tile" size={22} />
        ZKVault
      </div>

      <NavItem
        icon={SquaresFour}
        label="All items"
        count={items.length}
        active={category === "all" && !tag}
        onClick={nav(() => {
          onCategory("all");
          onTag(null);
        })}
      />
      {TYPE_ORDER.map((t) => (
        <NavItem
          key={t}
          icon={TYPE_ICON[t]}
          label={pluralize(TYPE_LABEL[t])}
          count={countOf(t)}
          active={category === t && !tag}
          onClick={nav(() => {
            onCategory(t);
            onTag(null);
          })}
        />
      ))}
      <NavItem
        icon={Star}
        label="Favorites"
        count={favCount}
        active={category === "favorites" && !tag}
        onClick={nav(() => {
          onCategory("favorites");
          onTag(null);
        })}
      />

      {tags.length > 0 && (
        <>
          <div className="my-3 h-px bg-charcoal" />
          <div className="px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-smoke">
            Tags
          </div>
          {tags.map((t) => (
            <button
              key={t}
              onClick={nav(() => onTag(tag === t ? null : t))}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition ${
                tag === t
                  ? "bg-azure/[0.08] text-snow"
                  : "text-silver hover:bg-ash hover:text-snow"
              }`}
            >
              <Hash size={14} className="text-graphite" />
              {t}
            </button>
          ))}
        </>
      )}

      <div className="mt-auto" />
      <button
        onClick={nav(onOpenSecurity)}
        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-silver transition hover:bg-ash hover:text-snow"
      >
        <ShieldCheck size={18} />
        Kiểm tra bảo mật
        {issueCount > 0 && (
          <span className="ml-auto rounded-full bg-azure px-1.5 text-xs font-medium text-[#08233f]">
            {issueCount}
          </span>
        )}
      </button>
      <button
        onClick={nav(onOpenSettings)}
        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-silver transition hover:bg-ash hover:text-snow"
      >
        <Gear size={18} />
        Settings
      </button>
    </aside>
  );
}

function NavItem({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: Icon;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition ${
        active
          ? "bg-azure/[0.08] text-snow"
          : "text-silver hover:bg-ash hover:text-snow"
      }`}
    >
      {active && (
        <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded bg-azure" />
      )}
      <Icon size={18} className={active ? "text-azure" : ""} />
      {label}
      <span className="ml-auto text-xs text-smoke">{count}</span>
    </button>
  );
}

function pluralize(label: string): string {
  // All five labels pluralize by appending "s" (Login -> Logins, SSH Key -> SSH Keys).
  return label + "s";
}

function uniqueTags(items: VaultItem[]): string[] {
  const set = new Set<string>();
  for (const i of items) {
    const t = i.data.tags;
    if (Array.isArray(t)) t.forEach((x) => typeof x === "string" && set.add(x));
  }
  return [...set].sort();
}
