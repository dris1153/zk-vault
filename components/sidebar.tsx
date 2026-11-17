"use client";

import {
  ShieldCheck,
  SquaresFour,
  Gear,
  LockLaminated,
  LockKey,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { VaultItem } from "@/lib/vault/items";
import { hasTotp } from "@/lib/ui/item-filters";
import type { AppTab } from "@/lib/ui/use-tab";
import { BrandMark } from "./brand-mark";

interface SidebarProps {
  items: VaultItem[];
  tab: AppTab;
  onTab: (t: AppTab) => void;
  onOpenSettings: () => void;
  onOpenSecurity: () => void;
  onLock: () => void;
  issueCount: number;
  className?: string;
}

export function Sidebar({
  items,
  tab,
  onTab,
  onOpenSettings,
  onOpenSecurity,
  onLock,
  issueCount,
  className = "",
}: SidebarProps) {
  const codeCount = items.filter(hasTotp).length;

  return (
    <aside
      className={`flex w-60 shrink-0 flex-col gap-1 border-r border-line bg-canvas p-3 ${className}`}
    >
      <div className="flex items-center gap-2.5 px-3 pb-5 pt-2 font-semibold text-ink">
        <BrandMark variant="tile" size={26} />
        <span>ZKVault</span>
      </div>

      <NavItem
        icon={ShieldCheck}
        label="Mã 2FA"
        count={codeCount}
        active={tab === "codes"}
        onClick={() => onTab("codes")}
      />
      <NavItem
        icon={SquaresFour}
        label="Vault"
        count={items.length}
        active={tab === "vault"}
        onClick={() => onTab("vault")}
      />

      <div className="mt-auto flex flex-col gap-1 border-t border-line pt-3">
        <button
          type="button"
          onClick={onOpenSecurity}
          className="flex items-center gap-2.5 rounded-full px-3 py-2 text-sm font-medium text-muted transition hover:bg-inset hover:text-ink"
        >
          <LockLaminated size={18} />
          <span>Kiểm tra bảo mật</span>
          {issueCount > 0 && (
            <span className="ml-auto rounded-full bg-accent-wash px-2 py-0.5 text-xs font-semibold text-accent-ink">
              {issueCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center gap-2.5 rounded-full px-3 py-2 text-sm font-medium text-muted transition hover:bg-inset hover:text-ink"
        >
          <Gear size={18} />
          <span>Cài đặt</span>
        </button>
        <button
          type="button"
          onClick={onLock}
          className="flex items-center gap-2.5 rounded-full px-3 py-2 text-sm font-medium text-muted transition hover:bg-inset hover:text-ink"
        >
          <LockKey size={18} />
          <span>Khóa vault</span>
        </button>
      </div>
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
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-full px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-inset text-ink"
          : "text-muted hover:bg-inset/70 hover:text-ink"
      }`}
    >
      <Icon
        size={18}
        weight={active ? "fill" : "regular"}
        className={active ? "text-ink" : "text-muted"}
      />
      <span>{label}</span>
      <span className="ml-auto text-xs text-muted tabular-nums">{count}</span>
    </button>
  );
}
