"use client";

import {
  ShieldCheck,
  SquaresFour,
  LockLaminated,
  Gear,
} from "@phosphor-icons/react/dist/ssr";
import type { AppTab } from "@/lib/ui/use-tab";

export function BottomNav({
  tab,
  onTab,
  onOpenSecurity,
  onOpenSettings,
  issueCount,
}: {
  tab: AppTab;
  onTab: (t: AppTab) => void;
  onOpenSecurity: () => void;
  onOpenSettings: () => void;
  issueCount: number;
}) {
  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-line bg-surface/95 px-2 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] backdrop-blur md:hidden"
    >
      <NavBtn
        active={tab === "codes"}
        onClick={() => onTab("codes")}
        icon={<ShieldCheck size={20} weight={tab === "codes" ? "fill" : "regular"} />}
        label="Mã 2FA"
      />
      <NavBtn
        active={tab === "vault"}
        onClick={() => onTab("vault")}
        icon={<SquaresFour size={20} weight={tab === "vault" ? "fill" : "regular"} />}
        label="Vault"
      />
      <NavBtn
        active={false}
        onClick={onOpenSecurity}
        icon={<LockLaminated size={20} />}
        label="Bảo mật"
        badge={issueCount}
      />
      <NavBtn
        active={false}
        onClick={onOpenSettings}
        icon={<Gear size={20} />}
        label="Cài đặt"
      />
    </nav>
  );
}

function NavBtn({
  active,
  onClick,
  icon,
  label,
  badge = 0,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex min-w-[64px] flex-col items-center gap-0.5 rounded-full px-3 py-1 text-[11px] font-medium transition ${
        active ? "bg-inset text-ink" : "text-muted hover:text-ink"
      }`}
    >
      <span className="relative">
        {icon}
        {badge > 0 && (
          <span className="absolute -right-2 -top-1 rounded-full bg-accent px-1 text-[9px] font-semibold leading-tight text-accent-ink">
            {badge}
          </span>
        )}
      </span>
      <span>{label}</span>
    </button>
  );
}
