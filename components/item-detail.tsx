"use client";

import { useEffect, useState } from "react";
import {
  X,
  ArrowLeft,
  PencilSimple,
  Eye,
  EyeSlash,
  Copy,
  ArrowSquareOut,
  Trash,
  Timer,
  Check,
  Star,
} from "@phosphor-icons/react/dist/ssr";
import type { VaultItem } from "@/lib/vault/items";
import { toggleFavorite } from "@/lib/vault/item-actions";
import { TYPE_LABEL } from "@/lib/ui/icons";
import { FIELDS_BY_TYPE, type FieldDef } from "@/lib/ui/item-fields";
import { findPlatform } from "@/lib/ui/platforms";
import { engineLabel } from "@/lib/ui/db-engines";
import { findOAuthProvider, oauthProviderLabel } from "@/lib/ui/oauth-providers";
import { EngineIcon } from "./engine-icon";
import { BrandIcon } from "./brand-icon";
import { useClipboard } from "@/lib/ui/use-clipboard";
import { useSettings } from "@/lib/vault/settings-store";
import { IconButton, Tag } from "./ui-kit";
import { PlatformIcon } from "./platform-icon";
import { TotpDisplay } from "./totp-display";
import { ItemAvatar } from "./item-avatar";

export function ItemDetail({
  item,
  clearSeconds,
  onClose,
  onEdit,
  onDelete,
  backArrow = false,
}: {
  item: VaultItem;
  clearSeconds: number;
  onClose: () => void;
  onEdit: (item: VaultItem) => void;
  onDelete: (item: VaultItem) => void;
  backArrow?: boolean;
}) {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const { copy, copiedField, remaining } = useClipboard(clearSeconds);
  const favicon = useSettings((s) => s.settings.fetchFavicons);

  useEffect(() => {
    setRevealed(new Set());
    setConfirming(false);
  }, [item.id]);

  const tags = (item.data.tags as string[] | undefined) ?? [];

  const toggle = (name: string) =>
    setRevealed((s) => {
      const next = new Set(s);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-start gap-3 border-b border-line p-5">
        {backArrow && (
          <IconButton onClick={onClose} aria-label="Quay lại" className="-ml-2">
            <ArrowLeft size={19} />
          </IconButton>
        )}
        <ItemAvatar item={item} favicon={favicon} boxSize={40} iconSize={20} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[17px] font-semibold text-ink">
            {(item.data.title as string) ?? "Không tiêu đề"}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
            <span>{TYPE_LABEL[item.type]}</span>
            {tags.map((t) => (
              <Tag key={t}>#{t}</Tag>
            ))}
          </div>
        </div>
        <IconButton
          onClick={() => void toggleFavorite(item)}
          aria-label={item.favorite ? "Bỏ yêu thích" : "Yêu thích"}
          title={item.favorite ? "Bỏ yêu thích" : "Yêu thích"}
        >
          <Star
            size={18}
            weight={item.favorite ? "fill" : "regular"}
            className={item.favorite ? "text-accent" : ""}
          />
        </IconButton>
        <IconButton onClick={() => onEdit(item)} aria-label="Sửa" title="Sửa">
          <PencilSimple size={18} />
        </IconButton>
        {!backArrow && (
          <IconButton onClick={onClose} aria-label="Đóng" title="Đóng">
            <X size={18} />
          </IconButton>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {FIELDS_BY_TYPE[item.type]
          .filter(
            (f) =>
              f.name !== "title" &&
              f.name !== "tags" &&
              f.kind !== "auth_method" &&
              (!f.visibleWhen || f.visibleWhen(item.data)),
          )
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

      <div className="flex items-center justify-between border-t border-line px-5 py-3.5 text-xs text-muted">
        <span>
          Cập nhật {new Date(item.updatedAt).toLocaleDateString("vi-VN")}
        </span>
        {confirming ? (
          <span className="flex items-center gap-2">
            <button
              type="button"
              className="text-muted hover:text-ink"
              onClick={() => setConfirming(false)}
            >
              Hủy
            </button>
            <button
              type="button"
              className="font-medium text-danger"
              onClick={() => onDelete(item)}
            >
              Xác nhận xóa
            </button>
          </span>
        ) : (
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-danger hover:bg-danger/10"
            onClick={() => setConfirming(true)}
          >
            <Trash size={15} /> Xóa
          </button>
        )}
      </div>
    </div>
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
  const [copiedTemp, setCopiedTemp] = useState(false);
  if (!text) return null;
  const isSecret = field.kind === "secret";
  const isSeed = field.name === "seed_phrase";

  return (
    <div className="border-b border-line py-3.5">
      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
        {field.label}
      </div>

      {isSeed && revealed ? (
        <SeedGrid phrase={text} />
      ) : (
        <div className="flex items-center gap-2">
          {field.name === "url" ? (
            <span className="flex min-w-0 flex-1 items-center gap-2 text-sm text-ink">
              <PlatformIcon
                platform={findPlatform(text)}
                url={text}
                size={18}
                favicon={favicon}
              />
              <span className="truncate">
                {findPlatform(text)?.name ?? text}
              </span>
            </span>
          ) : field.kind === "db_engine" ? (
            <span className="flex min-w-0 flex-1 items-center gap-2 text-sm text-ink">
              <EngineIcon engine={text} />
              <span className="truncate">{engineLabel(text)}</span>
            </span>
          ) : field.kind === "oauth_provider" ? (
            <span className="flex min-w-0 flex-1 items-center gap-2 text-sm text-ink">
              {findOAuthProvider(text) && (
                <BrandIcon
                  iconRef={findOAuthProvider(text)!.icon}
                  label={text}
                  size={18}
                />
              )}
              <span className="truncate">{oauthProviderLabel(text)}</span>
            </span>
          ) : (
            <span
              className={`min-w-0 flex-1 break-all text-sm text-ink ${
                isSecret ? "font-mono" : ""
              } ${field.name === "content" ? "whitespace-pre-wrap" : ""}`}
            >
              {isSecret && !revealed ? "••••••••••••" : text}
            </span>
          )}
          {isSecret && (
            <IconButton onClick={onReveal} aria-label="Hiện hoặc ẩn">
              {revealed ? <EyeSlash size={17} /> : <Eye size={17} />}
            </IconButton>
          )}
          {field.name === "url" && (
            <a
              href={normalizeUrl(text)}
              target="_blank"
              rel="noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-inset hover:text-ink"
            >
              <ArrowSquareOut size={17} />
            </a>
          )}
          <IconButton
            onClick={() => {
              onCopy(text);
              setCopiedTemp(true);
              setTimeout(() => {
                setCopiedTemp(false);
              }, 1500);
            }}
            aria-label="Sao chép"
          >
            {copiedTemp ? (
              <Check size={17} className="text-ink" />
            ) : (
              <Copy size={17} />
            )}
          </IconButton>
        </div>
      )}

      {copied && (
        <div
          className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-ink"
          title="Tự xóa clipboard khi hết giờ, hoặc ngay khi bạn quay lại tab nếu lúc đó đang ở app khác. Trình duyệt chỉ xóa được khi tab còn mở."
        >
          <Timer size={13} /> Đã chép, tự xóa sau 0:
          {String(remaining).padStart(2, "0")}
        </div>
      )}
    </div>
  );
}

function SeedGrid({ phrase }: { phrase: string }) {
  const words = phrase.trim().split(/\s+/);
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {words.map((w, i) => (
        <span
          key={i}
          className="rounded-lg border border-line bg-inset px-2 py-1.5 font-mono text-[13px] text-ink"
        >
          <span className="mr-1 text-muted">
            {String(i + 1).padStart(2, "0")}
          </span>
          {w}
        </span>
      ))}
    </div>
  );
}

function normalizeUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}
