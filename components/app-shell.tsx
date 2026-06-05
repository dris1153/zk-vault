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
import { SecurityCheckModal } from "./security-check-modal";
import { useSettings } from "@/lib/vault/settings-store";
import { usePasswordHealth } from "@/lib/vault/use-password-health";

export function AppShell() {
  const { dek, lock } = useVault();
  const items = useItems((s) => s.items);
  const clearSeconds = useSettings((s) => s.settings.clipboardClearSeconds);
  const breachEnabled = useSettings((s) => s.settings.breachCheckEnabled);

  const [category, setCategory] = useState<Category>("all");
  const [tag, setTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<VaultItem | null>(null);
  const [editing, setEditing] = useState<VaultItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const [healthDeep, setHealthDeep] = useState(false); // latches once the panel is opened
  const searchRef = useRef<HTMLInputElement>(null);

  const { report, loading: healthLoading } = usePasswordHealth({
    breach: breachEnabled && securityOpen,
    weak: healthDeep,
  });

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

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
    <div className="grid h-[100dvh] grid-cols-1 md:grid-cols-[240px_1fr]">
      <Sidebar
        className="hidden md:flex"
        items={items}
        category={category}
        onCategory={setCategory}
        tag={tag}
        onTag={setTag}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenSecurity={() => {
          setHealthDeep(true);
          setSecurityOpen(true);
        }}
        issueCount={report?.totalIssues ?? 0}
      />

      {/* Mobile sidebar drawer */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
      />
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-200 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          className="h-full"
          items={items}
          category={category}
          onCategory={setCategory}
          tag={tag}
          onTag={setTag}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenSecurity={() => {
            setHealthDeep(true);
            setSecurityOpen(true);
          }}
          issueCount={report?.totalIssues ?? 0}
          onNavigate={() => setSidebarOpen(false)}
        />
      </div>

      <div className="flex min-w-0 flex-col">
        <TopBar
          ref={searchRef}
          query={query}
          onQuery={setQuery}
          onAdd={() => setAddOpen(true)}
          onLock={lock}
          onMenu={() => setSidebarOpen(true)}
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

      <SecurityCheckModal
        open={securityOpen}
        onClose={() => setSecurityOpen(false)}
        report={report}
        loading={healthLoading}
        onOpenItem={(id) => {
          const it = items.find((i) => i.id === id);
          if (it) {
            setSelected(it);
            setSecurityOpen(false);
          }
        }}
      />
    </div>
  );
}
