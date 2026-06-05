"use client";

import { Star } from "@phosphor-icons/react/dist/ssr";
import type { VaultItem } from "@/lib/vault/items";
import { TYPE_ICON } from "@/lib/ui/icons";
import { cardSubtitle } from "@/lib/ui/item-fields";

export function ItemCard({
  item,
  onClick,
}: {
  item: VaultItem;
  onClick: () => void;
}) {
  const Icon = TYPE_ICON[item.type];
  const title = (item.data.title as string) ?? "Untitled";
  const subtitle = cardSubtitle(item.type, item.data);

  return (
    <button
      onClick={onClick}
      className="flex flex-col rounded-2xl border border-charcoal bg-obsidian p-4 text-left transition hover:border-slate hover:bg-ash"
    >
      <div className="mb-3.5 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-azure/10 text-azure">
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{title}</div>
          {subtitle && (
            <div className="truncate text-xs text-smoke">{subtitle}</div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm tracking-[2px] text-smoke">
          ••••••••
        </span>
        {item.favorite && <Star size={14} weight="fill" className="text-azure" />}
      </div>
    </button>
  );
}
