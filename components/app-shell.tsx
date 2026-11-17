"use client";

import { useState } from "react";
import { useVault } from "@/lib/vault/use-vault";
import { useItems } from "@/lib/vault/items-store";
import { removeItem } from "@/lib/vault/item-actions";
import type { VaultItem } from "@/lib/vault/items";
import type { VaultItemType } from "@/lib/supabase/types";
import { useSettings } from "@/lib/vault/settings-store";
import { usePasswordHealth } from "@/lib/vault/use-password-health";
import { useTab } from "@/lib/ui/use-tab";
import { useMediaQuery } from "@/lib/ui/use-media-query";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { CodesScreen } from "./codes-screen";
import { VaultScreen } from "./vault-screen";
import { AddEditModal } from "./add-edit-modal";
import { SettingsDialog } from "./settings-dialog";
import { SecurityCheckModal } from "./security-check-modal";
import type { FormData } from "./item-form";

export function AppShell() {
  const { dek, lock } = useVault();
  const items = useItems((s) => s.items);
  const itemsLoading = useItems((s) => s.loading);
  const breachEnabled = useSettings((s) => s.settings.breachCheckEnabled);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const { tab, setTab, detailId, openDetail, closeDetail } = useTab();

  const [editing, setEditing] = useState<VaultItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [presetType, setPresetType] = useState<VaultItemType>("login");
  const [presetData, setPresetData] = useState<FormData | undefined>(undefined);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [healthDeep, setHealthDeep] = useState(false); // latches once the panel is opened

  const { report, loading: healthLoading } = usePasswordHealth({
    breach: breachEnabled && securityOpen,
    weak: healthDeep,
  });

  if (!dek) return null;

  const openAdd = (type: VaultItemType, data?: FormData) => {
    setEditing(null);
    setPresetType(type);
    setPresetData(data);
    setAddOpen(true);
  };

  const openEdit = (item: VaultItem) => {
    setAddOpen(false);
    setEditing(item);
  };

  const handleDelete = async (item: VaultItem) => {
    await removeItem(item.id);
    if (detailId === item.id) closeDetail();
  };

  const openSecurity = () => {
    setHealthDeep(true);
    setSecurityOpen(true);
  };

  const modalOpen = addOpen || editing !== null || settingsOpen || securityOpen;

  return (
    <div className="grid h-dvh grid-cols-1 bg-canvas md:grid-cols-[240px_1fr]">
      <Sidebar
        className="hidden md:flex"
        items={items}
        tab={tab}
        onTab={setTab}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenSecurity={openSecurity}
        onLock={lock}
        issueCount={report?.totalIssues ?? 0}
      />

      <main className="flex min-h-0 min-w-0 flex-col">
        {tab === "codes" ? (
          <CodesScreen
            items={items}
            loading={itemsLoading}
            dek={dek}
            modalOpen={modalOpen}
            onLock={lock}
            onAddManual={(data) => openAdd("authenticator", data)}
            onEdit={openEdit}
            onOpenLoginDetail={(it) => openDetail(it.id, !isDesktop)}
          />
        ) : (
          <VaultScreen
            items={items}
            loading={itemsLoading}
            selectedId={detailId}
            modalOpen={modalOpen}
            onSelect={openDetail}
            onCloseDetail={closeDetail}
            onAdd={() => openAdd("login")}
            onEdit={openEdit}
            onDelete={handleDelete}
            onLock={lock}
          />
        )}
      </main>

      <BottomNav
        tab={tab}
        onTab={setTab}
        onOpenSecurity={openSecurity}
        onOpenSettings={() => setSettingsOpen(true)}
        issueCount={report?.totalIssues ?? 0}
      />

      <AddEditModal
        open={addOpen || editing !== null}
        editing={editing}
        presetType={presetType}
        presetData={presetData}
        dek={dek}
        onClose={() => {
          setAddOpen(false);
          setEditing(null);
          setPresetData(undefined);
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
          setSecurityOpen(false);
          openDetail(id, !isDesktop);
        }}
      />
    </div>
  );
}
