"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MagnifyingGlass,
  Plus,
  LockKey,
  SquaresFour,
} from "@phosphor-icons/react/dist/ssr";
import type { VaultItem } from "@/lib/vault/items";
import type { VaultItemType } from "@/lib/supabase/types";
import { searchItems } from "@/lib/vault/search";
import {
  FACET_BY_TYPE,
  sortItems,
  hasTotp,
  showsFavFilter,
  shows2FAFilter,
  type Category,
  type SortKey,
} from "@/lib/ui/item-filters";
import { primarySecretField } from "@/lib/ui/item-fields";
import { currentCode, parseTotp } from "@/lib/ui/totp";
import { useClipboard } from "@/lib/ui/use-clipboard";
import { useSettings } from "@/lib/vault/settings-store";
import { useMediaQuery } from "@/lib/ui/use-media-query";
import { IconButton, PillButton } from "./ui-kit";
import { TypeChips } from "./type-chips";
import { FilterPopover } from "./filter-popover";
import { VaultRow, VaultListSkeleton } from "./vault-row";
import { ItemDetail } from "./item-detail";
import { DetailDrawer } from "./detail-drawer";
import { BrandMark } from "./brand-mark";
import { Toast } from "./toast";

export function VaultScreen({
  items,
  loading,
  selectedId,
  modalOpen,
  onSelect,
  onCloseDetail,
  onAdd,
  onEdit,
  onDelete,
  onLock,
}: {
  items: VaultItem[];
  loading: boolean;
  selectedId: string | null;
  modalOpen: boolean;
  onSelect: (id: string, pushHistory: boolean) => void;
  onCloseDetail: () => void;
  onAdd: () => void;
  onEdit: (item: VaultItem) => void;
  onDelete: (item: VaultItem) => void;
  onLock: () => void;
}) {
  const clearSeconds = useSettings((s) => s.settings.clipboardClearSeconds);
  const favicon = useSettings((s) => s.settings.fetchFavicons);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { copy, copiedField, remaining } = useClipboard(clearSeconds);

  const [category, setCategory] = useState<Category>("all");
  const [tags, setTags] = useState<string[]>([]);
  const [tagMode, setTagMode] = useState<"any" | "all">("any");
  const [facet, setFacet] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");
  const [favOnly, setFavOnly] = useState(false);
  const [twoFAOnly, setTwoFAOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [toastLabel, setToastLabel] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => setFacet(""), [category]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const i of items) {
      const t = i.data.tags;
      if (Array.isArray(t)) t.forEach((x) => typeof x === "string" && set.add(x));
    }
    return [...set].sort();
  }, [items]);

  const categoryItems = useMemo(() => {
    if (category === "favorites") return items.filter((i) => i.favorite);
    if (category === "all") return items;
    return items.filter((i) => i.type === category);
  }, [items, category]);

  const filtered = useMemo(() => {
    let list = categoryItems;
    if (tags.length) {
      list = list.filter((i) => {
        const t = Array.isArray(i.data.tags) ? (i.data.tags as string[]) : [];
        return tagMode === "all"
          ? tags.every((x) => t.includes(x))
          : tags.some((x) => t.includes(x));
      });
    }
    // Apply a toggle ONLY where its control is shown (see shows*Filter), so a
    // filter left on in one category never silently empties another.
    if (favOnly && showsFavFilter(category)) list = list.filter((i) => i.favorite);
    if (twoFAOnly && shows2FAFilter(category)) list = list.filter(hasTotp);
    const f =
      category !== "all" && category !== "favorites"
        ? FACET_BY_TYPE[category as VaultItemType]
        : undefined;
    if (f && facet) list = list.filter((i) => f.value(i) === facet);
    return sortItems(searchItems(list, query), sort);
  }, [categoryItems, category, tags, tagMode, favOnly, twoFAOnly, facet, sort, query]);

  const selected = useMemo(
    () => (selectedId ? items.find((i) => i.id === selectedId) ?? null : null),
    [items, selectedId],
  );

  const copyField = useCallback(
    (label: string, value: string) => {
      setToastLabel(label);
      void copy(label, value);
    },
    [copy],
  );

  // Desktop keyboard shortcuts: Ctrl+K, Up/Down, c/u/t quick copy, Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || modalOpen) return;

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

      if (e.key === "Escape") {
        if (selectedId) onCloseDetail();
        else if (query) setQuery("");
        else if (isEditable) active?.blur();
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey || isEditable || filtered.length === 0) {
        return;
      }

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const cur = selectedId
          ? filtered.findIndex((i) => i.id === selectedId)
          : -1;
        const nextIdx =
          e.key === "ArrowDown"
            ? (cur + 1) % filtered.length
            : cur <= 0
              ? filtered.length - 1
              : cur - 1;
        onSelect(filtered[nextIdx].id, false);
        return;
      }

      if (!selected) return;
      // Don't hijack single-letter shortcuts if user focused a button/link or highlighted text.
      if (
        active instanceof HTMLButtonElement ||
        active instanceof HTMLAnchorElement ||
        window.getSelection()?.toString()
      ) {
        return;
      }

      if (e.key === "c") {
        const sec = primarySecretField(selected.type, selected.data);
        if (sec) {
          e.preventDefault();
          copyField(sec.label, sec.value);
        }
      } else if (e.key === "u") {
        const user =
          typeof selected.data.username === "string"
            ? selected.data.username
            : typeof selected.data.oauth_account === "string"
              ? selected.data.oauth_account
              : "";
        if (user) {
          e.preventDefault();
          copyField("tài khoản", user);
        }
      } else if (e.key === "t" && hasTotp(selected)) {
        const totp = parseTotp(String(selected.data.totp_secret ?? ""));
        if (totp) {
          e.preventDefault();
          const { code } = currentCode(totp, Date.now());
          copyField("mã 2FA", code);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen, selectedId, selected, filtered, query, onSelect, onCloseDetail, copyField]);

  const toastMsg =
    copiedField && toastLabel
      ? `Đã copy ${toastLabel} - tự xóa sau ${remaining}s`
      : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-canvas">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line bg-canvas px-4 sm:gap-3 sm:px-6">
        <div className="relative flex-1 sm:max-w-xl">
          <MagnifyingGlass
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm trong vault..."
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

        <FilterPopover
          category={category}
          categoryItems={categoryItems}
          allTags={allTags}
          facet={facet}
          onFacet={setFacet}
          sort={sort}
          onSort={setSort}
          favOnly={favOnly}
          onFavOnly={setFavOnly}
          twoFAOnly={twoFAOnly}
          onTwoFAOnly={setTwoFAOnly}
          tags={tags}
          onToggleTag={(t) =>
            setTags((prev) =>
              prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
            )
          }
          tagMode={tagMode}
          onTagMode={setTagMode}
          onClearAll={() => {
            setFacet("");
            setSort("updated");
            setFavOnly(false);
            setTwoFAOnly(false);
            setTags([]);
          }}
        />

        <div className="hidden flex-1 sm:block" />

        <PillButton onClick={onAdd}>
          <Plus size={16} /> <span className="hidden sm:inline">Thêm mục</span>
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

      <div className="border-b border-line bg-canvas">
        <TypeChips
          items={items}
          category={category}
          onCategory={setCategory}
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-h-0 overflow-y-auto px-4 pb-24 pt-4 sm:px-6 md:pb-8">
          {filtered.length === 0 && loading ? (
            <VaultListSkeleton />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-20 text-center text-muted">
              {query.trim() ? (
                <>
                  <MagnifyingGlass size={38} className="mb-3 text-faint" />
                  <p className="font-medium text-ink">Không tìm thấy kết quả</p>
                </>
              ) : (
                <>
                  <BrandMark
                    variant="flat"
                    size={38}
                    className="mb-3 text-muted"
                  />
                  <p className="font-medium text-ink">Chưa có mục nào</p>
                  <p className="mt-1 text-sm">
                    Bấm nút Thêm mục để lưu thông tin đầu tiên vào vault.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((item) => (
                <VaultRow
                  key={item.id}
                  item={item}
                  selected={selected?.id === item.id}
                  favicon={favicon}
                  onSelect={() => onSelect(item.id, !isDesktop)}
                  onCopyField={copyField}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="hidden min-h-0 border-l border-line bg-surface lg:flex lg:flex-col">
          {selected ? (
            <ItemDetail
              item={selected}
              clearSeconds={clearSeconds}
              onClose={onCloseDetail}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted">
              <SquaresFour size={32} className="mb-2.5 text-faint" />
              <p className="text-sm font-medium text-ink">Chọn một mục</p>
              <p className="mt-1 text-xs">
                Xem chi tiết hoặc copy nhanh bằng nút bên cạnh mỗi hàng.
              </p>
            </div>
          )}
        </aside>
      </div>

      {!isDesktop && (
        <DetailDrawer
          item={selected}
          clearSeconds={clearSeconds}
          onClose={onCloseDetail}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}

      <Toast message={toastMsg} />
    </div>
  );
}
