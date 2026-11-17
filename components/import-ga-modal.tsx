"use client";

// Bulk import from Google Authenticator "Transfer accounts" QR exports
// (`otpauth-migration://offline?data=...`) or standard `otpauth://totp/...` URIs.
// All decoding happens client-side in memory and clears on close.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  QrCode,
  ImageSquare,
  CheckCircle,
  Warning,
} from "@phosphor-icons/react/dist/ssr";
import { useItems } from "@/lib/vault/items-store";
import { addItem } from "@/lib/vault/item-actions";
import { parseTotp, parseTotpMeta } from "@/lib/ui/totp";
import { decodeQrFromImage } from "@/lib/ui/qr-decode";
import {
  isMigrationUri,
  parseMigrationUri,
  toOtpauthUri,
  type MigratedOtp,
} from "@/lib/ui/ga-migration";
import { findPlatform } from "@/lib/ui/platforms";
import { Modal, IconButton, PillButton, Checkbox, TextArea, Tag } from "./ui-kit";
import { PlatformIcon } from "./platform-icon";
import { QrScannerModal } from "./qr-scanner-modal";

interface Candidate {
  key: string;
  otp: MigratedOtp;
  duplicate: boolean;
  selected: boolean;
}

export function ImportGaModal({
  open,
  onClose,
  dek,
  initialUri,
}: {
  open: boolean;
  onClose: () => void;
  dek: CryptoKey;
  initialUri?: string | null;
}) {
  const items = useItems((s) => s.items);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activeBatchProgress, setActiveBatchProgress] = useState<{
    seen: number;
    expected: number;
  } | null>(null);
  const batchesByIdRef = useRef<Map<number, { expected: number; indices: Set<number> }>>(
    new Map(),
  );
  const seqRef = useRef(0);
  const [skippedUnsupported, setSkippedUnsupported] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [resultNote, setResultNote] = useState<string | null>(null);

  // Normalized base32 secrets already in the vault for duplicate detection.
  const existingSecrets = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      const s =
        typeof item.data.totp_secret === "string" ? item.data.totp_secret : "";
      const parsed = s ? parseTotp(s) : null;
      if (parsed) set.add(parsed.secret.base32);
    }
    return set;
  }, [items]);

  // Clear all decoded secret material when modal closes; process initialUri on open.
  useEffect(() => {
    if (!open) {
      setScannerOpen(false);
      setPasteText("");
      setCandidates([]);
      batchesByIdRef.current = new Map();
      seqRef.current = 0;
      setActiveBatchProgress(null);
      setSkippedUnsupported(0);
      setError(null);
      setScanError(null);
      setSaving(false);
      setProgress(null);
      setResultNote(null);
      return;
    }
    if (initialUri) {
      try {
        ingestUri(initialUri);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialUri]);

  function ingestUri(raw: string): { batchComplete: boolean } {
    const text = raw.trim();
    if (!text) return { batchComplete: false };
    setResultNote(null);

    if (isMigrationUri(text)) {
      const batch = parseMigrationUri(text);
      let skipped = 0;
      const incoming: MigratedOtp[] = [];
      for (const o of batch.otps) {
        if (o.type !== "totp" || o.algorithm === "MD5") {
          skipped++;
        } else {
          incoming.push(o);
        }
      }
      if (skipped > 0) setSkippedUnsupported((n) => n + skipped);

      const entry = batchesByIdRef.current.get(batch.batchId) ?? {
        expected: batch.batchSize,
        indices: new Set<number>(),
      };
      entry.expected = Math.max(entry.expected, batch.batchSize);
      entry.indices.add(batch.batchIndex);
      batchesByIdRef.current.set(batch.batchId, entry);

      const seen = entry.indices.size;
      const expected = entry.expected;
      setActiveBatchProgress(expected > 1 && seen < expected ? { seen, expected } : null);

      setCandidates((prev) =>
        mergeCandidates(prev, incoming, existingSecrets, () => ++seqRef.current),
      );

      return { batchComplete: seen >= expected };
    }

    if (/^otpauth:\/\/totp\//i.test(text)) {
      const totp = parseTotp(text);
      const meta = parseTotpMeta(text);
      if (!totp) {
        throw new Error("URI otpauth:// không hợp lệ.");
      }
      const otp: MigratedOtp = {
        secret: totp.secret.base32,
        issuer: meta?.issuer || "Không tiêu đề",
        account: meta?.account || "",
        algorithm:
          (totp.algorithm.toUpperCase() as MigratedOtp["algorithm"]) || "SHA1",
        digits: totp.digits,
        period: totp.period,
        type: "totp",
        counter: 0,
      };
      setCandidates((prev) =>
        mergeCandidates(prev, [otp], existingSecrets, () => ++seqRef.current),
      );
      return { batchComplete: true };
    }

    throw new Error(
      "Mã QR không phải định dạng Google Authenticator (otpauth-migration://).",
    );
  }

  function handleScanned(text: string) {
    setScanError(null);
    setError(null);
    try {
      const { batchComplete } = ingestUri(text);
      if (batchComplete) setScannerOpen(false);
    } catch (e) {
      setScanError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleFiles(files: FileList) {
    setError(null);
    const errors: string[] = [];
    let anyFound = false;
    for (const file of Array.from(files)) {
      try {
        const text = await decodeQrFromImage(file);
        if (text) {
          anyFound = true;
          ingestUri(text);
        }
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }
    if (!anyFound && errors.length === 0) {
      errors.push("Không tìm thấy mã QR hợp lệ trong ảnh.");
    }
    if (errors.length > 0) setError(errors.join(" "));
  }

  function handlePasteParse() {
    setError(null);
    const lines = pasteText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    const failedLines: string[] = [];
    const errors: string[] = [];
    for (const line of lines) {
      try {
        ingestUri(line);
      } catch (e) {
        failedLines.push(line);
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }
    setPasteText(failedLines.join("\n"));
    if (errors.length > 0) setError(errors[0]);
  }

  const selectedCount = candidates.filter((c) => c.selected).length;

  async function saveSelected() {
    const picked = candidates.filter((c) => c.selected);
    if (picked.length === 0) return;
    setSaving(true);
    setError(null);
    setProgress({ done: 0, total: picked.length });

    let ok = 0;
    const failedKeys = new Set<string>();
    const failedLabels: string[] = [];
    for (let i = 0; i < picked.length; i++) {
      const cand = picked[i];
      try {
        await addItem(dek, "authenticator", {
          title: cand.otp.issuer,
          account: cand.otp.account,
          totp_secret: toOtpauthUri(cand.otp),
          tags: [],
        });
        ok++;
      } catch {
        failedKeys.add(cand.key);
        failedLabels.push(cand.otp.issuer);
      }
      setProgress({ done: i + 1, total: picked.length });
    }

    setSaving(false);
    if (failedKeys.size === 0) {
      onClose();
    } else {
      setResultNote(
        `Đã lưu ${ok}/${picked.length} tài khoản. Lỗi khi lưu: ${failedLabels.join(", ")}.`,
      );
      setCandidates((prev) =>
        prev.filter((c) => !c.selected || failedKeys.has(c.key)),
      );
    }
  }

  const batchStatus = activeBatchProgress ? (
    <div className="rounded-lg bg-accent-wash px-3 py-2 text-xs font-medium text-accent-ink">
      Đã quét {activeBatchProgress.seen}/{activeBatchProgress.expected} mã QR.
      Đưa mã QR tiếp theo vào khung để tiếp tục.
    </div>
  ) : null;

  const scannerStatus =
    scanError || batchStatus ? (
      <div className="flex flex-col gap-2">
        {batchStatus}
        {scanError && <p className="text-xs font-medium text-danger">{scanError}</p>}
      </div>
    ) : null;

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!saving) onClose();
      }}
      dismissable={!saving}
      width="max-w-lg"
    >
      <div className="flex items-center justify-between border-b border-line p-5">
        <h2 className="text-base font-semibold">
          Import từ Google Authenticator
        </h2>
        <IconButton
          onClick={onClose}
          disabled={saving}
          aria-label="Đóng"
        >
          <X size={18} />
        </IconButton>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <p className="text-sm text-muted">
          Trong Google Authenticator, chọn <strong>Transfer accounts</strong>{" "}
          &rarr; <strong>Export accounts</strong>, rồi quét hoặc chọn ảnh các mã
          QR hiện ra.
        </p>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <PillButton
            onClick={() => {
              setScanError(null);
              setScannerOpen(true);
            }}
            disabled={saving}
          >
            <QrCode size={16} /> Quét QR bằng camera
          </PillButton>
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink-2 transition hover:bg-inset hover:text-ink">
            <ImageSquare size={16} /> Chọn ảnh QR
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={saving}
              onChange={(e) => {
                if (e.target.files?.length) void handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {batchStatus}

        <details open={candidates.length === 0} className="border-t border-line pt-3">
          <summary className="cursor-pointer text-xs font-medium text-muted hover:text-ink">
            Hoặc dán URI <span className="font-mono">otpauth-migration://</span>
          </summary>
          <div className="mt-2 flex flex-col gap-2">
            <TextArea
              rows={2}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="otpauth-migration://offline?data=..."
              className="font-mono text-xs"
            />
            {pasteText.trim() && (
              <PillButton
                variant="ghost"
                onClick={handlePasteParse}
                className="self-end"
              >
                Phân tích URI
              </PillButton>
            )}
          </div>
        </details>

        {skippedUnsupported > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-accent-wash px-3 py-2 text-xs font-medium text-accent-ink">
            <Warning size={15} />
            Đã bỏ qua {skippedUnsupported} tài khoản HOTP/MD5 không hỗ trợ.
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}
        {resultNote && <p className="text-sm font-medium text-ink">{resultNote}</p>}

        {candidates.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>
                Tìm thấy {candidates.length} tài khoản ({selectedCount} đã chọn)
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setCandidates((prev) =>
                      prev.map((c) => ({ ...c, selected: true })),
                    )
                  }
                  className="font-medium text-ink hover:underline"
                >
                  Chọn tất cả
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCandidates((prev) =>
                      prev.map((c) => ({ ...c, selected: false })),
                    )
                  }
                  className="hover:text-ink"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            <div className="max-h-64 divide-y divide-line overflow-y-auto rounded-xl border border-line bg-canvas">
              {candidates.map((c) => {
                const platform = findPlatform(c.otp.issuer);
                return (
                  <label
                    key={c.key}
                    className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-inset/60"
                  >
                    <Checkbox
                      checked={c.selected}
                      onChange={(checked) =>
                        setCandidates((prev) =>
                          prev.map((x) =>
                            x.key === c.key ? { ...x, selected: checked } : x,
                          ),
                        )
                      }
                    />
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface shadow-row">
                      <PlatformIcon
                        platform={platform}
                        fallbackLabel={c.otp.issuer}
                        size={18}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-ink">
                          {c.otp.issuer}
                        </span>
                        {c.duplicate && <Tag>Đã có</Tag>}
                      </div>
                      {c.otp.account && (
                        <div className="truncate text-xs text-muted">
                          {c.otp.account}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              {progress && saving ? (
                <span className="text-xs text-muted">
                  Đang lưu {progress.done}/{progress.total}...
                </span>
              ) : activeBatchProgress ? (
                <button
                  type="button"
                  onClick={() => {
                    setScanError(null);
                    setScannerOpen(true);
                  }}
                  className="text-xs font-medium text-ink hover:underline"
                >
                  + Quét thêm QR ({activeBatchProgress.seen}/
                  {activeBatchProgress.expected})
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <PillButton variant="ghost" onClick={onClose} disabled={saving}>
                  Hủy
                </PillButton>
                <PillButton
                  onClick={saveSelected}
                  disabled={saving || selectedCount === 0}
                >
                  <CheckCircle size={16} />
                  {saving ? "Đang nhập..." : `Nhập ${selectedCount} tài khoản`}
                </PillButton>
              </div>
            </div>
          </div>
        )}
      </div>

      <QrScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onResult={handleScanned}
        continuous
        multipleFiles
        title="Quét QR Google Authenticator"
        status={scannerStatus}
      />
    </Modal>
  );
}

function mergeCandidates(
  prev: Candidate[],
  incoming: MigratedOtp[],
  existingSecrets: Set<string>,
  nextSeq: () => number,
): Candidate[] {
  const seenDedup = new Set(
    prev.map((c) => `${c.otp.secret}:${c.otp.issuer}:${c.otp.account}`),
  );
  const next = [...prev];
  for (const otp of incoming) {
    const sig = `${otp.secret}:${otp.issuer}:${otp.account}`;
    if (seenDedup.has(sig)) continue;
    seenDedup.add(sig);
    const duplicate = existingSecrets.has(otp.secret);
    next.push({
      key: `${sig}:${nextSeq()}`,
      otp,
      duplicate,
      selected: !duplicate,
    });
  }
  return next;
}
