"use client";

import { useState } from "react";
import Link from "next/link";
import { X, BookOpen } from "@phosphor-icons/react/dist/ssr";
import { useSettings } from "@/lib/vault/settings-store";
import { useVault } from "@/lib/vault/use-vault";
import { useBiometric } from "@/lib/vault/use-biometric";
import { Modal, IconButton, Field, PillButton, TextInput } from "./ui-kit";
import { SettingsBackup } from "./settings-backup";
import { SettingsAccount } from "./settings-account";

type Tab = "security" | "backup" | "account";

const LOCK_OPTIONS = [
  { label: "1 minute", ms: 60_000 },
  { label: "5 minutes", ms: 5 * 60_000 },
  { label: "15 minutes", ms: 15 * 60_000 },
  { label: "30 minutes", ms: 30 * 60_000 },
];
const CLIP_OPTIONS = [10, 20, 30];
const selectCls =
  "w-full rounded-lg border border-slate bg-obsidian px-3 py-2.5 text-sm text-snow outline-none focus:border-azure";

export function SettingsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { dek } = useVault();
  const [tab, setTab] = useState<Tab>("security");

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex items-center justify-between border-b border-charcoal p-5">
        <h2 className="text-base font-medium">Settings</h2>
        <IconButton onClick={onClose} aria-label="Close">
          <X size={18} />
        </IconButton>
      </div>

      <div className="flex gap-1 border-b border-charcoal px-3">
        {(["security", "backup", "account"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2.5 text-sm capitalize transition ${
              tab === t
                ? "border-azure text-snow"
                : "border-transparent text-silver hover:text-snow"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === "security" && <SecuritySettings />}
        {tab === "backup" && dek && <SettingsBackup dek={dek} />}
        {tab === "account" && <SettingsAccount />}
      </div>

      <div className="border-t border-charcoal px-5 py-3">
        <Link
          href="/docs"
          className="inline-flex items-center gap-1.5 text-sm text-silver transition hover:text-snow"
        >
          <BookOpen size={15} /> Tài liệu & hướng dẫn
        </Link>
      </div>
    </Modal>
  );
}

function SecuritySettings() {
  const { settings, update } = useSettings();
  return (
    <div className="flex flex-col gap-5">
      <Field label="Auto-lock after">
        <select
          className={selectCls}
          value={settings.autoLockMs}
          onChange={(e) => update({ autoLockMs: Number(e.target.value) })}
        >
          {LOCK_OPTIONS.map((o) => (
            <option key={o.ms} value={o.ms}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>

      <label className="flex items-center justify-between text-sm text-silver">
        Lock when the tab is hidden
        <input
          type="checkbox"
          checked={settings.lockOnHidden}
          onChange={(e) => update({ lockOnHidden: e.target.checked })}
          className="h-4 w-4 accent-[var(--color-azure)]"
        />
      </label>

      <Field label="Clear clipboard after copy">
        <select
          className={selectCls}
          value={settings.clipboardClearSeconds}
          onChange={(e) =>
            update({ clipboardClearSeconds: Number(e.target.value) })
          }
        >
          {CLIP_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s} seconds
            </option>
          ))}
        </select>
      </Field>

      <div>
        <label className="flex items-center justify-between text-sm text-silver">
          Hiện favicon cho domain tùy chỉnh
          <input
            type="checkbox"
            checked={settings.fetchFavicons}
            onChange={(e) => update({ fetchFavicons: e.target.checked })}
            className="h-4 w-4 accent-[var(--color-azure)]"
          />
        </label>
        <p className="mt-1 text-xs text-smoke">
          Khi bật, app tải favicon từ bên thứ ba, làm lộ domain bạn lưu. Các nền
          tảng có sẵn không bị ảnh hưởng. Mặc định tắt để giữ zero-knowledge.
        </p>
      </div>

      <div>
        <label className="flex items-center justify-between text-sm text-silver">
          Kiểm tra rò rỉ mật khẩu (HIBP)
          <input
            type="checkbox"
            checked={settings.breachCheckEnabled}
            onChange={(e) => update({ breachCheckEnabled: e.target.checked })}
            className="h-4 w-4 accent-[var(--color-azure)]"
          />
        </label>
        <p className="mt-1 text-xs text-smoke">
          Khi bật, app gửi 5 ký tự đầu của hash mật khẩu tới HIBP để kiểm tra rò
          rỉ (k-anonymity). Mặc định tắt để giữ zero-knowledge.
        </p>
      </div>

      <BiometricSetting />
    </div>
  );
}

function BiometricSetting() {
  const { supported, enrolled, ready, enable, disable, refresh } =
    useBiometric();
  const [master, setMaster] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ready || !supported) return null;

  async function doEnable() {
    setError(null);
    setBusy(true);
    try {
      await enable(master);
      setMaster("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function doDisable() {
    setBusy(true);
    try {
      await disable();
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-t border-charcoal pt-4">
      <div className="mb-2 text-[11px] uppercase tracking-[0.12em] text-smoke">
        Mở khóa bằng sinh trắc (thiết bị này)
      </div>
      {enrolled ? (
        <div className="flex items-center justify-between">
          <span className="text-sm text-silver">Đã bật trên thiết bị này.</span>
          <PillButton variant="ghost" onClick={doDisable} disabled={busy}>
            Tắt
          </PillButton>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-smoke">
            Lưu một khóa gắn riêng thiết bị này (vân tay/Face/Windows Hello). Nhập
            master để xác nhận.
          </p>
          <div className="flex gap-2">
            <TextInput
              mono
              type="password"
              value={master}
              onChange={(e) => setMaster(e.target.value)}
              placeholder="Master password"
            />
            <PillButton onClick={doEnable} disabled={busy || !master}>
              Bật
            </PillButton>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
