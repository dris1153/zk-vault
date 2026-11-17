"use client";

import { useEffect, useRef, useState } from "react";
import {
  Star,
  User,
  Key,
  ShieldCheck,
  DotsThreeVertical,
  Copy,
} from "@phosphor-icons/react/dist/ssr";
import type { VaultItem } from "@/lib/vault/items";
import { cardSubtitle, primarySecretField } from "@/lib/ui/item-fields";
import { hasTotp } from "@/lib/ui/item-filters";
import { currentCode, parseTotp } from "@/lib/ui/totp";
import { ItemAvatar } from "./item-avatar";
import { IconButton, Tag } from "./ui-kit";

export function VaultRow({
  item,
  selected,
  favicon,
  onSelect,
  onCopyField,
}: {
  item: VaultItem;
  selected: boolean;
  favicon: boolean;
  onSelect: () => void;
  onCopyField: (label: string, value: string) => void;
}) {
  const title = (item.data.title as string) ?? "Không tiêu đề";
  const subtitle = cardSubtitle(item.type, item.data);
  const tags = Array.isArray(item.data.tags)
    ? (item.data.tags as string[])
    : [];
  const username =
    item.type === "login"
      ? typeof item.data.username === "string" && item.data.username
        ? item.data.username
        : typeof item.data.oauth_account === "string"
          ? item.data.oauth_account
          : ""
      : item.type === "database" || item.type === "ssh_key"
        ? typeof item.data.username === "string"
          ? item.data.username
          : ""
        : "";

  const primarySecret = primarySecretField(item.type, item.data);
  const withTotp = hasTotp(item);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.preventDefault();
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [menuOpen]);

  function copyTotpNow() {
    const raw =
      typeof item.data.totp_secret === "string" ? item.data.totp_secret : "";
    const totp = parseTotp(raw);
    if (!totp) return;
    const { code } = currentCode(totp, Date.now());
    onCopyField("mã 2FA", code);
  }

  const hasQuickActions = !!(username || primarySecret || withTotp);

  return (
    <div
      className={`group relative flex items-center gap-2 rounded-xl px-3.5 py-3 transition ${
        selected
          ? "bg-inset ring-1 ring-ink/15"
          : "bg-surface shadow-card hover:bg-inset/50"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <ItemAvatar item={item} favicon={favicon} boxSize={38} iconSize={19} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[15px] font-semibold text-ink">
              {title}
            </span>
            {item.favorite && (
              <Star
                size={13}
                weight="fill"
                className="shrink-0 text-accent-ink"
                aria-label="Yêu thích"
              />
            )}
          </div>
          {subtitle && (
            <div className="truncate text-xs text-muted">{subtitle}</div>
          )}
        </div>
      </button>

      {tags.length > 0 && (
        <div className="hidden shrink-0 items-center gap-1 xl:flex">
          {tags.slice(0, 2).map((t) => (
            <Tag key={t}>#{t}</Tag>
          ))}
          {tags.length > 2 && (
            <span className="text-[11px] font-medium text-muted">
              +{tags.length - 2}
            </span>
          )}
        </div>
      )}

      {hasQuickActions && (
        <div
          className={`hidden shrink-0 items-center gap-0.5 transition sm:flex ${
            selected
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
          }`}
        >
          {username && (
            <IconButton
              type="button"
              onClick={() => onCopyField("tài khoản", username)}
              title="Copy tài khoản"
              aria-label={`Copy tài khoản ${title}`}
            >
              <User size={16} />
            </IconButton>
          )}
          {primarySecret && (
            <IconButton
              type="button"
              onClick={() =>
                onCopyField(primarySecret.label, primarySecret.value)
              }
              title={`Copy ${primarySecret.label}`}
              aria-label={`Copy ${primarySecret.label} của ${title}`}
            >
              <Key size={16} />
            </IconButton>
          )}
          {withTotp && (
            <IconButton
              type="button"
              onClick={copyTotpNow}
              title="Copy mã 2FA"
              aria-label={`Copy mã 2FA của ${title}`}
            >
              <ShieldCheck size={16} />
            </IconButton>
          )}
        </div>
      )}

      {hasQuickActions && (
        <div className="relative shrink-0 sm:hidden" ref={menuRef}>
          <IconButton
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={`Sao chép nhanh ${title}`}
            aria-expanded={menuOpen}
          >
            <DotsThreeVertical size={18} weight="bold" />
          </IconButton>

          {menuOpen && (
            <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-line bg-surface p-1.5 shadow-card">
              {username && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onCopyField("tài khoản", username);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-ink hover:bg-inset"
                >
                  <Copy size={14} /> Copy tài khoản
                </button>
              )}
              {primarySecret && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onCopyField(primarySecret.label, primarySecret.value);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-ink hover:bg-inset"
                >
                  <Key size={14} /> Copy {primarySecret.label}
                </button>
              )}
              {withTotp && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    copyTotpNow();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-ink hover:bg-inset"
                >
                  <ShieldCheck size={14} /> Copy mã 2FA
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function VaultListSkeleton() {
  return (
    <div aria-hidden className="flex animate-pulse flex-col gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl bg-surface p-3.5 shadow-card"
        >
          <span className="h-9.5 w-9.5 shrink-0 rounded-lg bg-inset" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-36 rounded bg-inset" />
            <div className="h-3 w-48 rounded bg-inset" />
          </div>
        </div>
      ))}
    </div>
  );
}
