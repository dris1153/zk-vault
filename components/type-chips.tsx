"use client";

import { SquaresFour, Star } from "@phosphor-icons/react/dist/ssr";
import type { VaultItem } from "@/lib/vault/items";
import { countByType } from "@/lib/vault/items-store";
import { TYPE_ICON, TYPE_LABEL, TYPE_ORDER } from "@/lib/ui/icons";
import type { Category } from "@/lib/ui/item-filters";

export function TypeChips({
  items,
  category,
  onCategory,
}: {
  items: VaultItem[];
  category: Category;
  onCategory: (c: Category) => void;
}) {
  const counts = countByType(items);
  const favCount = items.filter((i) => i.favorite).length;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto px-4 pb-3 pt-2 sm:px-6">
      <Chip
        active={category === "all"}
        onClick={() => onCategory("all")}
        icon={<SquaresFour size={14} />}
        label="Tất cả"
        count={items.length}
      />
      <Chip
        active={category === "favorites"}
        onClick={() => onCategory("favorites")}
        icon={<Star size={14} weight={category === "favorites" ? "fill" : "regular"} />}
        label="Yêu thích"
        count={favCount}
      />
      {TYPE_ORDER.map((t) => {
        const Icon = TYPE_ICON[t];
        return (
          <Chip
            key={t}
            active={category === t}
            onClick={() => onCategory(t)}
            icon={<Icon size={14} />}
            label={TYPE_LABEL[t]}
            count={counts[t]}
          />
        );
      })}
    </div>
  );
}

function Chip({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-ink text-white shadow-button"
          : "border border-line bg-surface text-muted hover:bg-inset hover:text-ink"
      }`}
    >
      {icon}
      <span>{label}</span>
      <span className={active ? "text-white/75" : "text-muted"}>{count}</span>
    </button>
  );
}
