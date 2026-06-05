"use client";

import { useState } from "react";
import { CaretDown, MagnifyingGlass, Globe } from "@phosphor-icons/react/dist/ssr";
import {
  PLATFORMS,
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  findPlatform,
  type Platform,
} from "@/lib/ui/platforms";
import { PlatformIcon } from "./platform-icon";
import { TextInput } from "./ui-kit";

export function PlatformPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const platform = findPlatform(value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const showCustom = customOpen || (!!value && !platform);

  const groups = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: PLATFORMS.filter((p) => p.category === cat && matches(p, query)),
  })).filter((g) => g.items.length > 0);

  const pick = (p: Platform) => {
    onChange(p.domains[0]);
    setCustomOpen(false);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-2.5 rounded-lg border border-slate bg-obsidian px-3 py-2.5 text-left text-sm text-snow transition focus:border-azure"
        >
          {platform ? (
            <>
              <PlatformIcon platform={platform} size={18} />
              <span>{platform.name}</span>
            </>
          ) : value ? (
            <>
              <PlatformIcon url={value} size={18} />
              <span className="truncate text-silver">{value}</span>
            </>
          ) : (
            <>
              <Globe size={18} className="text-smoke" />
              <span className="text-smoke">Chọn nền tảng</span>
            </>
          )}
          <CaretDown size={15} className="ml-auto text-smoke" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-lg border border-charcoal bg-ash p-1.5">
              <div className="relative mb-1">
                <MagnifyingGlass
                  size={15}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-smoke"
                />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm nền tảng..."
                  className="w-full rounded-md border border-slate bg-obsidian py-2 pl-8 pr-2 text-sm text-snow outline-none placeholder:text-smoke focus:border-azure"
                />
              </div>

              {groups.map((g) => (
                <div key={g.cat} className="mb-1">
                  <div className="px-2 py-1 text-[11px] uppercase tracking-[0.1em] text-smoke">
                    {CATEGORY_LABELS[g.cat]}
                  </div>
                  {g.items.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => pick(p)}
                      className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm text-snow transition hover:bg-obsidian"
                    >
                      <PlatformIcon platform={p} size={18} />
                      {p.name}
                    </button>
                  ))}
                </div>
              ))}

              <div className="my-1 h-px bg-charcoal" />
              <button
                type="button"
                onClick={() => {
                  setCustomOpen(true);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm text-azure-link transition hover:bg-obsidian"
              >
                <Globe size={18} /> URL tùy chỉnh
              </button>
            </div>
          </>
        )}
      </div>

      {showCustom && (
        <TextInput
          value={value}
          placeholder="https://example.com"
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function matches(p: Platform, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    p.name.toLowerCase().includes(q) ||
    p.id.includes(q) ||
    p.domains.some((d) => d.includes(q))
  );
}
