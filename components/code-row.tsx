"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  DotsThreeVertical,
  PushPin,
  PencilSimple,
  ArrowSquareOut,
  Trash,
} from "@phosphor-icons/react/dist/ssr";
import type { VaultItem } from "@/lib/vault/items";
import type { CodeEntry } from "@/lib/ui/codes";
import {
  parseTotp,
  currentCode,
  nextCode,
  formatCode,
} from "@/lib/ui/totp";
import { findPlatform } from "@/lib/ui/platforms";
import { PlatformIcon } from "./platform-icon";
import { IconButton } from "./ui-kit";

export function CountdownRing({
  remaining,
  period,
  expiring,
}: {
  remaining: number;
  period: number;
  expiring?: boolean;
}) {
  const r = 9;
  const circ = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, remaining / period));
  return (
    <span className="relative inline-flex h-6 w-6 shrink-0 items-center justify-center">
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <circle
          cx="12"
          cy="12"
          r={r}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="2"
        />
        <circle
          cx="12"
          cy="12"
          r={r}
          fill="none"
          stroke={expiring ? "var(--color-danger)" : "var(--color-ink)"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - frac)}
          transform="rotate(-90 12 12)"
        />
      </svg>
      <span
        className={`absolute font-mono text-[9px] tabular-nums ${
          expiring ? "font-semibold text-danger" : "text-muted"
        }`}
      >
        {remaining}
      </span>
    </span>
  );
}

export function CodeRow({
  entry,
  now,
  hideCodes,
  copied,
  selected = false,
  favicon,
  rowRef,
  onCopy,
  onTogglePin,
  onEdit,
  onDelete,
  onOpenDetail,
}: {
  entry: CodeEntry;
  now: number;
  hideCodes: boolean;
  copied: boolean;
  selected?: boolean;
  favicon: boolean;
  rowRef?: (el: HTMLDivElement | null) => void;
  onCopy: (entry: CodeEntry, code: string) => void;
  onTogglePin: (item: VaultItem) => void;
  onEdit: (item: VaultItem) => void;
  onDelete: (item: VaultItem) => void;
  onOpenDetail?: (item: VaultItem) => void;
}) {
  const totp = useMemo(() => parseTotp(entry.secret), [entry.secret]);
  const [revealed, setRevealed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto re-hide in privacy mode after 10 seconds.
  useEffect(() => {
    if (!revealed) return;
    const t = window.setTimeout(() => setRevealed(false), 10_000);
    return () => window.clearTimeout(t);
  }, [revealed]);

  // Reset reveal if privacy mode is turned off.
  useEffect(() => {
    if (!hideCodes) setRevealed(false);
  }, [hideCodes]);

  // Close row menu on outside pointerdown or Escape (capture stops parent handlers).
  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.preventDefault();
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [menuOpen]);

  const state = totp ? currentCode(totp, now) : null;
  const expiring = state ? state.secondsRemaining <= 5 : false;
  const next = totp && expiring ? nextCode(totp, now) : null;
  const masked = hideCodes && !revealed;
  const platform = findPlatform(entry.url || entry.issuer);

  function handlePrimaryClick() {
    if (!totp || !state) {
      onEdit(entry.item);
      return;
    }
    if (masked) {
      setRevealed(true);
      return;
    }
    onCopy(entry, state.code);
  }

  return (
    <div
      ref={rowRef}
      className={`relative flex items-center gap-2 rounded-xl bg-surface p-3 shadow-card transition sm:p-4 ${
        selected ? "ring-2 ring-ink" : "hover:bg-inset/50"
      }`}
    >
      <button
        type="button"
        onClick={handlePrimaryClick}
        aria-label={
          !totp
            ? `Sửa ${entry.issuer} - secret không hợp lệ`
            : masked
              ? `Hiện mã ${entry.issuer}`
              : `Copy mã ${entry.issuer}`
        }
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-inset">
          {/* Never pass non-URL issuer as url to prevent favicon host leakage. */}
          <PlatformIcon
            platform={platform}
            url={entry.url}
            fallbackLabel={entry.issuer}
            size={20}
            favicon={favicon}
          />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[15px] font-semibold text-ink">
              {entry.issuer}
            </span>
            {entry.pinned && (
              <PushPin
                size={13}
                weight="fill"
                className="shrink-0 text-accent-ink"
                aria-label="Đã ghim"
              />
            )}
            {entry.source === "login" && (
              <span className="shrink-0 rounded-full bg-inset px-2 py-0.5 text-[10px] font-medium text-ink-2">
                Đăng nhập
              </span>
            )}
          </div>
          {entry.account && (
            <div className="truncate text-[13px] text-muted">
              {entry.account}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
          {!state ? (
            <span className="text-xs font-medium text-danger">
              Secret không hợp lệ
            </span>
          ) : (
            <div className="text-right">
              <div
                className={`font-mono text-[22px] font-semibold leading-tight tracking-[0.04em] tabular-nums sm:text-[26px] ${
                  masked
                    ? "select-none text-muted"
                    : expiring
                      ? "text-danger"
                      : "text-ink"
                }`}
              >
                {masked ? "••• •••" : formatCode(state.code)}
              </div>
              {masked ? (
                <div className="text-[11px] text-muted">Chạm để hiện</div>
              ) : expiring && next ? (
                <div className="font-mono text-[11px] font-medium text-danger tabular-nums">
                  Tiếp theo: {formatCode(next)}
                </div>
              ) : null}
            </div>
          )}

          {state &&
            (copied ? (
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-white">
                <Check size={13} weight="bold" />
              </span>
            ) : (
              <CountdownRing
                remaining={state.secondsRemaining}
                period={state.period}
                expiring={expiring}
              />
            ))}
        </div>
      </button>

      <div className="relative shrink-0" ref={menuRef}>
        <IconButton
          type="button"
          onClick={() => {
            setMenuOpen((o) => !o);
            setConfirmDelete(false);
          }}
          aria-label={`Tùy chọn cho ${entry.issuer}`}
          aria-expanded={menuOpen}
        >
          <DotsThreeVertical size={18} weight="bold" />
        </IconButton>

        {menuOpen && (
          <div className="absolute right-0 top-10 z-20 w-48 rounded-xl border border-line bg-surface p-1.5 shadow-card">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onTogglePin(entry.item);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-ink hover:bg-inset"
            >
              <PushPin size={15} weight={entry.pinned ? "fill" : "regular"} />
              {entry.pinned ? "Bỏ ghim" : "Ghim lên đầu"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onEdit(entry.item);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-ink hover:bg-inset"
            >
              <PencilSimple size={15} />
              Chỉnh sửa
            </button>
            {entry.source === "login" && onOpenDetail && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenDetail(entry.item);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-ink hover:bg-inset"
              >
                <ArrowSquareOut size={15} />
                Mở chi tiết đăng nhập
              </button>
            )}
            <div className="my-1 h-px bg-line" />
            {confirmDelete ? (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmDelete(false);
                  onDelete(entry.item);
                }}
                className="flex w-full items-center gap-2 rounded-lg bg-danger/10 px-2.5 py-2 text-left text-sm font-medium text-danger hover:bg-danger/15"
              >
                <Trash size={15} />
                Xác nhận xóa?
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-danger hover:bg-danger/10"
              >
                <Trash size={15} />
                Xóa
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
