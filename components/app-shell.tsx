"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useVault } from "@/lib/vault/use-vault";
import { useItems } from "@/lib/vault/items-store";
import { removeItem } from "@/lib/vault/item-actions";
import { searchItems } from "@/lib/vault/search";
import type { VaultItem } from "@/lib/vault/items";
import { Sidebar, type Category } from "./sidebar";
import { TopBar } from "./top-bar";
import { ItemGrid } from "./item-grid";
import { DetailDrawer } from "./detail-drawer";
import { AddEditModal } from "./add-edit-modal";
import { SettingsDialog } from "./settings-dialog";
import { useSettings } from "@/lib/vault/settings-store";

export function AppShell() {
  const { dek, lock } = useVault();
  const items = useItems((s) => s.items);
  const clearSeconds = useSettings((s) => s.settings.clipboardClearSeconds);

  const [category, setCategory] = useState<Category>("all");
  const [tag, setTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<VaultItem | null>(null);
  const [editing, setEditing] = useState<VaultItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    let list = items;
    if (category === "favorites") list = list.filter((i) => i.favorite);
    else if (category !== "all") list = list.filter((i) => i.type === category);
    if (tag)
      list = list.filter(
        (i) => Array.isArray(i.data.tags) && (i.data.tags as string[]).includes(tag),
      );
    return searchItems(list, query);
  }, [items, category, tag, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        setSelected(null);
        setAddOpen(false);
        setEditing(null);
        setSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!dek) return null;

  const openEdit = (item: VaultItem) => {
    setSelected(null);
    setEditing(item);
  };
  const handleDelete = async (item: VaultItem) => {
    await removeItem(item.id);
    setSelected(null);
  };
  const modalOpen = addOpen || editing !== null;

  return (
    <div className="grid h-[100dvh] grid-cols-[240px_1fr]">
      <Sidebar
        items={items}
        category={category}
        onCategory={setCategory}
        tag={tag}
        onTag={setTag}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="flex min-w-0 flex-col">
        <TopBar
          ref={searchRef}
          query={query}
          onQuery={setQuery}
          onAdd={() => setAddOpen(true)}
          onLock={lock}
        />
        <div className="flex-1 overflow-y-auto">
          <ItemGrid
            items={filtered}
            onSelect={setSelected}
            searching={query.trim().length > 0}
          />
        </div>
      </div>

      <DetailDrawer
        item={selected}
        clearSeconds={clearSeconds}
        onClose={() => setSelected(null)}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <AddEditModal
        open={modalOpen}
        editing={editing}
        dek={dek}
        onClose={() => {
          setAddOpen(false);
          setEditing(null);
        }}
      />

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
