"use client";

// Mobile full-screen detail sheet wrapper around ItemDetail.

import type { VaultItem } from "@/lib/vault/items";
import { ItemDetail } from "./item-detail";

export function DetailDrawer({
  item,
  clearSeconds,
  onClose,
  onEdit,
  onDelete,
}: {
  item: VaultItem | null;
  clearSeconds: number;
  onClose: () => void;
  onEdit: (item: VaultItem) => void;
  onDelete: (item: VaultItem) => void;
}) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-40 bg-surface lg:hidden">
      <ItemDetail
        item={item}
        clearSeconds={clearSeconds}
        onClose={onClose}
        onEdit={onEdit}
        onDelete={onDelete}
        backArrow
      />
    </div>
  );
}
