"use client";

import { useMemo, useRef, useState } from "react";
import {
  DownloadSimple,
  UploadSimple,
  Warning,
} from "@phosphor-icons/react/dist/ssr";
import { exportVault, importVault } from "@/lib/vault/export";
import { useSettings } from "@/lib/vault/settings-store";
import { PillButton, TextInput, TextArea, Field, Checkbox } from "./ui-kit";

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

  async function doExport() {
    setStatus(null);
    try {
      await exportVault();
      setStatus("Backup downloaded.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    }
  }

  async function doImport() {
    if (!file) return setStatus("Choose a .vault file first.");
    setBusy(true);
    setStatus(null);
    try {
      const secret = useRecovery
        ? { recoveryWords: words.trim().split(/\s+/) }
        : { master };
      const { imported, total } = await importVault(file, secret, dek);
      setStatus(`Imported ${imported} of ${total} item${total === 1 ? "" : "s"}.`);
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
      <div className="text-[11px] uppercase tracking-[0.12em] text-smoke">
        Backup &amp; restore
      </div>

      <div className="flex items-center justify-between">
        <p className="max-w-[60%] text-sm text-silver">
          Download an encrypted <span className="font-mono">.vault</span> backup.
          Store it safely - it is your recovery if you lose your master password.
        </p>
        <PillButton variant="ghost" onClick={doExport}>
          <DownloadSimple size={16} /> Export
        </PillButton>
      </div>

      <div
        className={`flex items-center gap-1.5 text-xs ${
          backup.stale ? "text-amber-500" : "text-smoke"
        }`}
      >
        {backup.stale && <Warning size={13} weight="fill" />}
        {backup.label}
        {backup.stale && " - nên export một bản mới."}
      </div>

      <div className="h-px bg-charcoal" />

      <p className="text-sm text-silver">
        Restore from a backup into this vault. Unlock the file with its master
        password, or with the recovery key if you forgot it.
      </p>
      <input
        ref={fileRef}
        type="file"
        accept=".vault,application/json"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="text-sm text-silver file:mr-3 file:rounded-full file:border file:border-slate file:bg-transparent file:px-3 file:py-1.5 file:text-snow"
      />

      <label className="flex cursor-pointer items-center gap-2 text-sm text-silver">
        <Checkbox checked={useRecovery} onChange={setUseRecovery} />
        Use recovery key instead of master password
      </label>

      {useRecovery ? (
        <Field label="Recovery key (24 words)">
          <TextArea
            value={words}
            onChange={(e) => setWords(e.target.value)}
            placeholder="word1 word2 word3 ..."
            className="font-mono"
          />
        </Field>
      ) : (
        <Field label="Backup's master password">
          <TextInput
            mono
            type="password"
            value={master}
            onChange={(e) => setMaster(e.target.value)}
          />
        </Field>
      )}

      <div className="flex items-center justify-between">
        {status && <span className="text-sm text-azure">{status}</span>}
        <PillButton onClick={doImport} disabled={busy} className="ml-auto">
          <UploadSimple size={16} /> {busy ? "Importing..." : "Import"}
        </PillButton>
      </div>
    </div>
  );
}
