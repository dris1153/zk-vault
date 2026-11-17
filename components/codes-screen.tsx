"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MagnifyingGlass,
  Plus,
  QrCode,
  LockKey,
  ShieldCheck,
  Keyboard,
} from "@phosphor-icons/react/dist/ssr";
import type { VaultItem } from "@/lib/vault/items";
import { removeItem, toggleFavorite } from "@/lib/vault/item-actions";
import { useSettings } from "@/lib/vault/settings-store";
import { useNow } from "@/lib/ui/use-now";
import { useClipboard } from "@/lib/ui/use-clipboard";
import {
  filterCodeEntries,
  toCodeEntries,
  type CodeEntry,
} from "@/lib/ui/codes";
import { currentCode, parseTotp, parseTotpMeta } from "@/lib/ui/totp";
import { isMigrationUri } from "@/lib/ui/ga-migration";
import { CodeRow } from "./code-row";
import { IconButton, PillButton } from "./ui-kit";
import { Toast } from "./toast";
import { QrScannerModal } from "./qr-scanner-modal";
import { ImportGaModal } from "./import-ga-modal";
import type { FormData } from "./item-form";

export function CodesScreen({
  items,
  loading,
  dek,
  modalOpen,
  onLock,
  onAddManual,
  onEdit,
  onOpenLoginDetail,
}: {
  items: VaultItem[];
  loading: boolean;
  dek: CryptoKey;
  modalOpen: boolean;
  onLock: () => void;
  onAddManual: (presetData?: FormData) => void;
  onEdit: (item: VaultItem) => void;
  onOpenLoginDetail: (item: VaultItem) => void;
}) {
  const { settings } = useSettings();
  const now = useNow(1000);
  const { copy, copiedField, remaining } = useClipboard(
    settings.clipboardClearSeconds,
  );
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [qrOpen, setQrOpen] = useState(false);
  const [gaOpen, setGaOpen] = useState(false);
  const [gaInitialUri, setGaInitialUri] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const allEntries = useMemo(() => toCodeEntries(items), [items]);
  const filtered = useMemo(
    () => filterCodeEntries(allEntries, query),
    [allEntries, query],
  );
  const pinned = useMemo(() => filtered.filter((e) => e.pinned), [filtered]);
  const unpinned = useMemo(() => filtered.filter((e) => !e.pinned), [filtered]);

  // Reset keyboard selection when query changes.
  useEffect(() => {
    setSelectedIdx(-1);
  }, [query]);

  useEffect(() => {
    setSelectedIdx((i) => (i >= filtered.length ? -1 : i));
  }, [filtered.length]);

  useEffect(() => {
    if (selectedIdx >= 0 && filtered[selectedIdx]) {
      rowRefs.current
        .get(filtered[selectedIdx].id)
        ?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIdx, filtered]);

  useEffect(() => {
    if (!copiedField) {
      setToastMsg(null);
      return;
    }
    setToastMsg(`Đã copy - tự xóa sau ${remaining}s`);
  }, [copiedField, remaining]);

  function handleCopy(entry: CodeEntry, code: string) {
    void copy(entry.id, code);
  }

  // Desktop keyboard flow: Ctrl+K / type-to-search, Up/Down, Enter to copy, Esc to clear.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || modalOpen || qrOpen || gaOpen) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      const active = document.activeElement as HTMLElement | null;
      const isEditable =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement ||
        Boolean(active?.isContentEditable);
      const isControl =
        isEditable ||
        active instanceof HTMLButtonElement ||
        active instanceof HTMLAnchorElement;

      if (e.key === "Escape") {
        if (query) {
          setQuery("");
          setSelectedIdx(-1);
        } else if (isEditable) {
          active?.blur();
        }
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "ArrowDown" && filtered.length > 0) {
        if (active instanceof HTMLSelectElement) return;
        e.preventDefault();
        setSelectedIdx((i) => (i + 1) % filtered.length);
        return;
      }
      if (e.key === "ArrowUp" && filtered.length > 0) {
        if (active instanceof HTMLSelectElement) return;
        e.preventDefault();
        setSelectedIdx((i) => (i <= 0 ? filtered.length - 1 : i - 1));
        return;
      }
      if (
        e.key === "Enter" &&
        selectedIdx >= 0 &&
        filtered[selectedIdx] &&
        (!active || active === document.body || active === searchRef.current)
      ) {
        const entry = filtered[selectedIdx];
        const totp = parseTotp(entry.secret);
        if (totp) {
          e.preventDefault();
          const { code } = currentCode(totp, Date.now());
          void copy(entry.id, code);
        }
        return;
      }

      // Printable non-space key when not on an interactive control -> focus search.
      if (
        !isControl &&
        e.key.length === 1 &&
        e.key !== " " &&
        window.matchMedia("(min-width: 768px)").matches
      ) {
        searchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen, qrOpen, gaOpen, query, filtered, selectedIdx, copy]);

  function handleQuickQrResult(text: string) {
    setQrOpen(false);
    if (isMigrationUri(text)) {
      setGaInitialUri(text);
      setGaOpen(true);
      return;
    }
    const meta = parseTotpMeta(text);
    onAddManual({
      title: meta?.issuer || "",
      account: meta?.account || "",
      totp_secret: text,
      tags: [],
    });
  }

  const bindRowRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) rowRefs.current.set(id, el);
    else rowRefs.current.delete(id);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-canvas">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line bg-canvas px-4 sm:gap-3 sm:px-6">
        <h1 className="hidden text-[18px] font-semibold tracking-[-0.2px] text-ink md:block">
          Mã 2FA
        </h1>
        <div className="relative flex-1 md:ml-4 md:max-w-md">
          <MagnifyingGlass
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm mã 2FA..."
            autoComplete="off"
            data-1p-ignore=""
            data-lpignore="true"
            data-bwignore=""
            data-form-type="other"
            className="w-full rounded-full border border-transparent bg-inset py-2 pl-9 pr-3 text-sm text-ink transition placeholder:text-faint focus:border-ink/30 focus:bg-surface sm:pr-16"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-line bg-surface px-1.5 py-px text-[11px] text-muted sm:block">
            Ctrl K
          </span>
        </div>

        <div className="hidden flex-1 md:block" />

        <PillButton
          variant="ghost"
          onClick={() => setGaOpen(true)}
          className="hidden sm:inline-flex"
        >
          <QrCode size={16} /> Import GA
        </PillButton>
        <IconButton
          onClick={() => setQrOpen(true)}
          title="Quét mã QR"
          aria-label="Quét mã QR"
          className="sm:hidden"
        >
          <QrCode size={19} />
        </IconButton>
        <PillButton onClick={() => onAddManual()}>
          <Plus size={16} /> <span className="hidden sm:inline">Thêm mã</span>
          <span className="sm:hidden">Thêm</span>
        </PillButton>
        <IconButton
          onClick={onLock}
          title="Khóa ngay"
          aria-label="Khóa ngay"
          className="md:hidden"
        >
          <LockKey size={18} />
        </IconButton>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-24 pt-5 sm:px-6 md:pb-8">
        <div className="mx-auto max-w-3xl">
          {allEntries.length === 0 && loading ? (
            <CodesSkeleton />
          ) : allEntries.length === 0 ? (
            <EmptyCodes
              onScanQr={() => setQrOpen(true)}
              onImportGa={() => setGaOpen(true)}
              onManual={() => onAddManual()}
            />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-muted">
              <MagnifyingGlass size={36} className="mb-3 text-faint" />
              <p className="font-medium text-ink">
                Không tìm thấy mã khớp &quot;{query}&quot;
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {pinned.length > 0 && (
                <section aria-label="Đã ghim">
                  <h2 className="mb-2.5 px-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                    Đã ghim
                  </h2>
                  <div className="flex flex-col gap-2.5">
                    {pinned.map((entry, idx) => (
                      <CodeRow
                        key={entry.id}
                        entry={entry}
                        now={now}
                        hideCodes={settings.hideCodes}
                        copied={copiedField === entry.id}
                        selected={selectedIdx === idx}
                        favicon={settings.fetchFavicons}
                        rowRef={bindRowRef(entry.id)}
                        onCopy={handleCopy}
                        onTogglePin={(it) => void toggleFavorite(it)}
                        onEdit={onEdit}
                        onDelete={(it) => void removeItem(it.id)}
                        onOpenDetail={
                          entry.source === "login"
                            ? onOpenLoginDetail
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </section>
              )}

              {unpinned.length > 0 && (
                <section aria-label="Tất cả mã 2FA">
                  {pinned.length > 0 && (
                    <h2 className="mb-2.5 px-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                      Tất cả
                    </h2>
                  )}
                  <div className="flex flex-col gap-2.5">
                    {unpinned.map((entry, idx) => (
                      <CodeRow
                        key={entry.id}
                        entry={entry}
                        now={now}
                        hideCodes={settings.hideCodes}
                        copied={copiedField === entry.id}
                        selected={selectedIdx === pinned.length + idx}
                        favicon={settings.fetchFavicons}
                        rowRef={bindRowRef(entry.id)}
                        onCopy={handleCopy}
                        onTogglePin={(it) => void toggleFavorite(it)}
                        onEdit={onEdit}
                        onDelete={(it) => void removeItem(it.id)}
                        onOpenDetail={
                          entry.source === "login"
                            ? onOpenLoginDetail
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      <QrScannerModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        onResult={handleQuickQrResult}
      />

      <ImportGaModal
        open={gaOpen}
        onClose={() => {
          setGaOpen(false);
          setGaInitialUri(null);
        }}
        dek={dek}
        initialUri={gaInitialUri}
      />

      <Toast message={toastMsg} />
    </div>
  );
}

function EmptyCodes({
  onScanQr,
  onImportGa,
  onManual,
}: {
  onScanQr: () => void;
  onImportGa: () => void;
  onManual: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl bg-surface px-6 py-12 text-center shadow-card">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-wash text-accent-ink">
        <ShieldCheck size={26} />
      </span>
      <h2 className="text-[18px] font-semibold text-ink">Chưa có mã 2FA nào</h2>
      <p className="mt-1.5 text-sm text-muted">
        Thêm mã xác thực hai bước để mở app lên là thấy và copy ngay.
      </p>
      <div className="mt-6 flex w-full flex-col gap-2.5">
        <PillButton onClick={onScanQr} className="w-full py-2.5">
          <QrCode size={17} /> Quét mã QR
        </PillButton>
        <PillButton
          variant="ghost"
          onClick={onImportGa}
          className="w-full py-2.5"
        >
          <QrCode size={17} /> Import từ Google Authenticator
        </PillButton>
        <PillButton
          variant="ghost"
          onClick={onManual}
          className="w-full py-2.5"
        >
          <Keyboard size={17} /> Nhập secret thủ công
        </PillButton>
      </div>
    </div>
  );
}

function CodesSkeleton() {
  return (
    <div aria-hidden className="flex animate-pulse flex-col gap-2.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl bg-surface p-4 shadow-card"
        >
          <span className="h-10 w-10 shrink-0 rounded-lg bg-inset" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-32 rounded bg-inset" />
            <div className="h-3 w-44 rounded bg-inset" />
          </div>
          <div className="h-6 w-24 rounded bg-inset" />
        </div>
      ))}
    </div>
  );
}
