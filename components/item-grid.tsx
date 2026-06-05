"use client";

import { MagnifyingGlass, Vault } from "@phosphor-icons/react/dist/ssr";
import type { VaultItem } from "@/lib/vault/items";
import { ItemCard } from "./item-card";

export function ItemGrid({
  items,
  onSelect,
  searching,
}: {
  items: VaultItem[];
  onSelect: (item: VaultItem) => void;
  searching: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-24 text-center text-smoke">
        {searching ? (
          <>
            <MagnifyingGlass size={40} className="mb-3.5 text-graphite" />
            <p>No matches found</p>
          </>
        ) : (
          <>
            <Vault size={40} className="mb-3.5 text-graphite" />
            <p className="text-snow">Nothing here yet</p>
            <p className="mt-1 text-sm">
              Use the Add button to store your first credential.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3.5 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} onClick={() => onSelect(item)} />
      ))}
    </div>
  );
}
