"use client";

import { useState } from "react";
import Link from "next/link";
import { X, BookOpen } from "@phosphor-icons/react/dist/ssr";
import { useSettings } from "@/lib/vault/settings-store";
import { useVault } from "@/lib/vault/use-vault";
import { useBiometric } from "@/lib/vault/use-biometric";
import {
  Modal,
  IconButton,
  Field,
  PillButton,
  TextInput,
  Switch,
} from "./ui-kit";
import { Select } from "./select";
import { SettingsBackup } from "./settings-backup";
import { SettingsAccount } from "./settings-account";

type Tab = "security" | "backup" | "account";

const TAB_LABEL: Record<Tab, string> = {
  security: "Bảo mật",
  backup: "Sao lưu",
  account: "Tài khoản",
};

const LOCK_OPTIONS = [
  { label: "1 phút", ms: 60_000 },
  { label: "5 phút", ms: 5 * 60_000 },
  { label: "15 phút", ms: 15 * 60_000 },
  { label: "30 phút", ms: 30 * 60_000 },
];

const HIDDEN_LOCK_OPTIONS = [
  { label: "Ngay lập tức", ms: 0 },
  { label: "Sau 30 giây", ms: 30_000 },
  { label: "Sau 1 phút (khuyên dùng)", ms: 60_000 },
  { label: "Sau 5 phút", ms: 5 * 60_000 },
  { label: "Tắt", ms: -1 },
];

const CLIP_OPTIONS = [10, 20, 30];

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
      <div className="flex items-center justify-between border-b border-line p-5">
        <h2 className="text-base font-semibold">Cài đặt</h2>
        <IconButton onClick={onClose} aria-label="Đóng">
          <X size={18} />
        </IconButton>
      </div>

      <div className="flex gap-1 border-b border-line px-3">
        {(["security", "backup", "account"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2.5 text-sm font-medium transition ${
              tab === t
                ? "border-ink text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === "security" && <SecuritySettings />}
        {tab === "backup" && dek && <SettingsBackup dek={dek} />}
        {tab === "account" && <SettingsAccount />}
      </div>

      <div className="border-t border-line px-5 py-3">
        <Link
          href="/docs"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-ink"
        >
          <BookOpen size={15} /> Tài liệu &amp; hướng dẫn
        </Link>
      </div>
    </Modal>
  );
}

function SecuritySettings() {
  const { settings, update } = useSettings();
  return (
    <div className="flex flex-col gap-5">
      <Field label="Tự khóa khi không thao tác">
        <Select
          value={settings.autoLockMs}
          onChange={(v) => update({ autoLockMs: v })}
          options={LOCK_OPTIONS.map((o) => ({ value: o.ms, label: o.label }))}
        />
      </Field>

      <Field
        label="Khóa khi ẩn tab / chuyển ứng dụng"
        hint="Cho phép chuyển nhanh sang app khác để dán mã 2FA mà không phải mở khóa lại ngay."
      >
        <Select
          value={settings.lockOnHiddenAfterMs}
          onChange={(v) => update({ lockOnHiddenAfterMs: v })}
          options={HIDDEN_LOCK_OPTIONS.map((o) => ({
            value: o.ms,
            label: o.label,
          }))}
        />
      </Field>

      <Field label="Xóa clipboard sau khi copy">
        <Select
          value={settings.clipboardClearSeconds}
          onChange={(v) => update({ clipboardClearSeconds: v })}
          options={CLIP_OPTIONS.map((s) => ({
            value: s,
            label: `${s} giây`,
          }))}
        />
      </Field>

      <div>
        <div className="flex items-center justify-between text-sm text-ink-2">
          Ẩn mã 2FA nơi công cộng
          <Switch
            checked={settings.hideCodes}
            onChange={(v) => update({ hideCodes: v })}
          />
        </div>
        <p className="mt-1 text-xs text-muted">
          Làm mờ các mã 6 số trên màn hình chính; chạm lần 1 để hiện, chạm lần
          2 để copy.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between text-sm text-ink-2">
          Hiện favicon cho domain tùy chỉnh
          <Switch
            checked={settings.fetchFavicons}
            onChange={(v) => update({ fetchFavicons: v })}
          />
        </div>
        <p className="mt-1 text-xs text-muted">
          Khi bật, app tải favicon từ bên thứ ba, làm lộ domain bạn lưu. Các
          nền tảng có sẵn không bị ảnh hưởng. Mặc định tắt để giữ
          zero-knowledge.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between text-sm text-ink-2">
          Kiểm tra rò rỉ mật khẩu (HIBP)
          <Switch
            checked={settings.breachCheckEnabled}
            onChange={(v) => update({ breachCheckEnabled: v })}
          />
        </div>
        <p className="mt-1 text-xs text-muted">
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
    <div className="border-t border-line pt-4">
      <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
        Mở khóa bằng sinh trắc (thiết bị này)
      </div>
      {enrolled ? (
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-2">Đã bật trên thiết bị này.</span>
          <PillButton variant="ghost" onClick={doDisable} disabled={busy}>
            Tắt
          </PillButton>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted">
            Lưu một khóa gắn riêng thiết bị này (vân tay/Face/Windows Hello).
            Nhập master để xác nhận.
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
