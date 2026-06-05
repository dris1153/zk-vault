"use client";

import { useEffect, useState } from "react";
import {
  X,
  PencilSimple,
  Eye,
  EyeSlash,
  Copy,
  ArrowSquareOut,
  Trash,
  Timer,
} from "@phosphor-icons/react/dist/ssr";
import type { VaultItem } from "@/lib/vault/items";
import { TYPE_ICON, TYPE_LABEL } from "@/lib/ui/icons";
import { FIELDS_BY_TYPE, type FieldDef } from "@/lib/ui/item-fields";
import { findPlatform } from "@/lib/ui/platforms";
import { engineIcon, engineLabel } from "@/lib/ui/db-engines";
import { useClipboard } from "@/lib/ui/use-clipboard";
import { useSettings } from "@/lib/vault/settings-store";
import { IconButton } from "./ui-kit";
import { PlatformIcon } from "./platform-icon";
import { TotpDisplay } from "./totp-display";

export function DetailDrawer({
  item,
  clearSeconds,
  onClose,
  onEdit,
  onDelete,
}: {
  item: VaultItem | null;
  clearSeconds: number;
  onClose: () => void;
  onEdit: (item: VaultItem) => void;
  onDelete: (item: VaultItem) => void;
}) {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const { copy, copiedField, remaining } = useClipboard(clearSeconds);
  const favicon = useSettings((s) => s.settings.fetchFavicons);

  useEffect(() => {
    setRevealed(new Set());
    setConfirming(false);
  }, [item?.id]);

  const open = !!item;
  const Icon = item ? TYPE_ICON[item.type] : null;
  const tags = (item?.data.tags as string[] | undefined) ?? [];

  const toggle = (name: string) =>
    setRevealed((s) => {
      const next = new Set(s);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/45 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      />
      <aside
        className={`fixed right-0 top-0 z-40 flex h-full w-full flex-col border-l border-charcoal bg-obsidian transition-transform duration-200 sm:w-[420px] sm:max-w-[92vw] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {item && Icon && (
          <>
            <div className="flex items-start gap-3 border-b border-charcoal p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-azure/10 text-azure">
                <Icon size={21} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[17px] font-medium">
                  {(item.data.title as string) ?? "Untitled"}
                </h3>
                <p className="mt-0.5 text-xs text-smoke">
                  {TYPE_LABEL[item.type]}
                  {tags.length > 0 && " · " + tags.map((t) => "#" + t).join(" ")}
                </p>
              </div>
              <IconButton onClick={() => onEdit(item)} aria-label="Edit">
                <PencilSimple size={18} />
              </IconButton>
              <IconButton onClick={onClose} aria-label="Close">
                <X size={18} />
              </IconButton>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-5">
              {FIELDS_BY_TYPE[item.type]
                .filter((f) => f.name !== "title" && f.name !== "tags")
                .map((f) =>
                  f.kind === "totp" ? (
                    <TotpDisplay
                      key={f.name}
                      secret={
                        typeof item.data[f.name] === "string"
                          ? (item.data[f.name] as string)
                          : ""
                      }
                      onCopy={(code) => copy(f.name, code)}
                    />
                  ) : (
                    <Row
                      key={f.name}
                      field={f}
                      value={item.data[f.name]}
                      revealed={revealed.has(f.name)}
                      onReveal={() => toggle(f.name)}
                      onCopy={(v) => copy(f.name, v)}
                      copied={copiedField === f.name}
                      remaining={remaining}
                      favicon={favicon}
                    />
                  ),
                )}
            </div>

            <div className="flex items-center justify-between border-t border-charcoal px-5 py-3.5 text-xs text-smoke">
              <span>Updated {new Date(item.updatedAt).toLocaleDateString()}</span>
              {confirming ? (
                <span className="flex items-center gap-2">
                  <button
                    className="text-smoke hover:text-silver"
                    onClick={() => setConfirming(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="font-medium text-danger"
                    onClick={() => onDelete(item)}
                  >
                    Confirm delete
                  </button>
                </span>
              ) : (
                <button
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-danger hover:bg-danger/10"
                  onClick={() => setConfirming(true)}
                >
                  <Trash size={15} /> Delete
                </button>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function Row({
  field,
  value,
  revealed,
  onReveal,
  onCopy,
  copied,
  remaining,
  favicon = false,
}: {
  field: FieldDef;
  value: unknown;
  revealed: boolean;
  onReveal: () => void;
  onCopy: (v: string) => void;
  copied: boolean;
  remaining: number;
  favicon?: boolean;
}) {
  const text = typeof value === "string" ? value : "";
  if (!text) return null;
  const isSecret = field.kind === "secret";
  const isSeed = field.name === "seed_phrase";

  return (
    <div className="border-b border-charcoal py-3.5">
      <div className="mb-1.5 text-[11px] uppercase tracking-[0.1em] text-smoke">
        {field.label}
      </div>

      {isSeed && revealed ? (
        <SeedGrid phrase={text} />
      ) : (
        <div className="flex items-center gap-2">
          {field.name === "url" ? (
            <span className="flex min-w-0 flex-1 items-center gap-2 text-sm">
              <PlatformIcon
                platform={findPlatform(text)}
                url={text}
                size={18}
                favicon={favicon}
              />
              <span className="truncate">{findPlatform(text)?.name ?? text}</span>
            </span>
          ) : field.kind === "db_engine" ? (
            <span className="flex min-w-0 flex-1 items-center gap-2 text-sm">
              <EngineIcon value={text} />
              <span className="truncate">{engineLabel(text)}</span>
            </span>
          ) : (
            <span
              className={`min-w-0 flex-1 break-all text-sm ${
                isSecret ? "font-mono" : ""
              }`}
            >
              {isSecret && !revealed ? "••••••••••••" : text}
            </span>
          )}
          {isSecret && (
            <IconButton onClick={onReveal} aria-label="Reveal">
              {revealed ? <EyeSlash size={17} /> : <Eye size={17} />}
            </IconButton>
          )}
          {field.name === "url" && (
            <a
              href={normalizeUrl(text)}
              target="_blank"
              rel="noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full text-silver hover:bg-ash hover:text-snow"
            >
              <ArrowSquareOut size={17} />
            </a>
          )}
          <IconButton onClick={() => onCopy(text)} aria-label="Copy">
            <Copy size={17} />
          </IconButton>
        </div>
      )}

      {copied && (
        <div
          className="mt-1.5 flex items-center gap-1.5 text-xs text-azure"
          title="Tự xóa clipboard khi hết giờ, hoặc ngay khi bạn quay lại tab nếu lúc đó đang ở app khác. Trình duyệt chỉ xóa được khi tab còn mở."
        >
          <Timer size={13} /> copied, clears in 0:
          {String(remaining).padStart(2, "0")}
        </div>
      )}
    </div>
  );
}

function EngineIcon({ value }: { value: string }) {
  const Icon = engineIcon(value);
  return <Icon size={18} />;
}

function SeedGrid({ phrase }: { phrase: string }) {
  const words = phrase.trim().split(/\s+/);
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {words.map((w, i) => (
        <span
          key={i}
          className="rounded-md border border-charcoal bg-ash px-2 py-1.5 font-mono text-[13px]"
        >
          <span className="mr-1 text-smoke">{String(i + 1).padStart(2, "0")}</span>
          {w}
        </span>
      ))}
    </div>
  );
}

function normalizeUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}
