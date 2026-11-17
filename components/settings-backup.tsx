"use client";

import { useMemo, useRef, useState } from "react";
import {
  DownloadSimple,
  UploadSimple,
  Warning,
  QrCode,
} from "@phosphor-icons/react/dist/ssr";
import { exportVault, importVault } from "@/lib/vault/export";
import { useSettings } from "@/lib/vault/settings-store";
import { PillButton, TextInput, TextArea, Field, Checkbox } from "./ui-kit";
import { ImportGaModal } from "./import-ga-modal";

export function SettingsBackup({ dek }: { dek: CryptoKey }) {
  const lastExportAt = useSettings((s) => s.settings.lastExportAt);
  const backup = useMemo(() => {
    if (!lastExportAt) return { label: "Chưa sao lưu lần nào", stale: true };
    const days = Math.floor(
      (Date.now() - new Date(lastExportAt).getTime()) / 86_400_000,
    );
    const when = days <= 0 ? "hôm nay" : `${days} ngày trước`;
    return { label: `Sao lưu gần nhất: ${when}`, stale: days > 30 };
  }, [lastExportAt]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [useRecovery, setUseRecovery] = useState(false);
  const [master, setMaster] = useState("");
  const [words, setWords] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [gaOpen, setGaOpen] = useState(false);

  async function doExport() {
    setStatus(null);
    try {
      await exportVault();
      setStatus("Đã tải xuống bản sao lưu.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    }
  }

  async function doImport() {
    if (!file) return setStatus("Hãy chọn file .vault trước.");
    setBusy(true);
    setStatus(null);
    try {
      const secret = useRecovery
        ? { recoveryWords: words.trim().split(/\s+/) }
        : { master };
      const { imported, total } = await importVault(file, secret, dek);
      setStatus(`Đã nhập ${imported} / ${total} mục.`);
      setFile(null);
      setMaster("");
      setWords("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
        Google Authenticator
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="max-w-[65%] text-sm text-ink-2">
          Nhập hàng loạt mã 2FA từ mã QR xuất tài khoản của Google
          Authenticator.
        </p>
        <PillButton variant="ghost" onClick={() => setGaOpen(true)}>
          <QrCode size={16} /> Import 2FA
        </PillButton>
      </div>

      <div className="h-px bg-line" />

      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
        Sao lưu &amp; khôi phục
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="max-w-[65%] text-sm text-ink-2">
          Tải file sao lưu mã hóa <span className="font-mono">.vault</span>. Hãy
          cất nơi an toàn để khôi phục nếu quên master password.
        </p>
        <PillButton variant="ghost" onClick={doExport}>
          <DownloadSimple size={16} /> Xuất .vault
        </PillButton>
      </div>

      <div
        className={`flex items-center gap-1.5 text-xs ${
          backup.stale ? "font-medium text-accent-ink" : "text-muted"
        }`}
      >
        {backup.stale && (
          <Warning size={13} weight="fill" className="text-accent-ink" />
        )}
        {backup.label}
        {backup.stale && " - nên xuất một bản mới."}
      </div>

      <div className="h-px bg-line" />

      <p className="text-sm text-ink-2">
        Khôi phục từ file sao lưu vào vault hiện tại. Mở khóa file bằng master
        password hoặc bằng recovery key nếu bạn quên mật khẩu cũ.
      </p>
      <input
        ref={fileRef}
        type="file"
        accept=".vault,application/json"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="text-sm text-ink-2 file:mr-3 file:rounded-full file:border file:border-line file:bg-inset file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink"
      />

      <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-2">
        <Checkbox checked={useRecovery} onChange={setUseRecovery} />
        Dùng recovery key thay cho master password
      </label>

      {useRecovery ? (
        <Field label="Recovery key (24 từ)">
          <TextArea
            value={words}
            onChange={(e) => setWords(e.target.value)}
            placeholder="word1 word2 word3 ..."
            className="font-mono"
          />
        </Field>
      ) : (
        <Field label="Master password của bản sao lưu">
          <TextInput
            mono
            type="password"
            value={master}
            onChange={(e) => setMaster(e.target.value)}
          />
        </Field>
      )}

      <div className="flex items-center justify-between gap-3">
        {status && <span className="text-sm font-medium text-ink">{status}</span>}
        <PillButton onClick={doImport} disabled={busy} className="ml-auto">
          <UploadSimple size={16} /> {busy ? "Đang nhập..." : "Khôi phục"}
        </PillButton>
      </div>

      <ImportGaModal open={gaOpen} onClose={() => setGaOpen(false)} dek={dek} />
    </div>
  );
}
