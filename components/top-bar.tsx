"use client";

import { forwardRef } from "react";
import {
  MagnifyingGlass,
  Plus,
  LockKey,
} from "@phosphor-icons/react/dist/ssr";
import { PillButton, IconButton } from "./ui-kit";

export const TopBar = forwardRef<
  HTMLInputElement,
  {
    query: string;
    onQuery: (q: string) => void;
    onAdd: () => void;
    onLock: () => void;
  }
>(function TopBar({ query, onQuery, onAdd, onLock }, ref) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-charcoal px-5">
      <div className="relative max-w-xl flex-1">
        <MagnifyingGlass
          size={17}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-smoke"
        />
        <input
          ref={ref}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search vault..."
          className="w-full rounded-full border border-transparent bg-ash py-2 pl-9 pr-16 text-sm text-snow outline-none transition placeholder:text-smoke focus:border-azure focus:bg-obsidian"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate px-1.5 py-px text-[11px] text-smoke">
          Ctrl K
        </span>
      </div>
      <div className="flex-1" />
      <PillButton onClick={onAdd}>
        <Plus size={16} /> Add
      </PillButton>
      <IconButton onClick={onLock} title="Lock now" aria-label="Lock now">
        <LockKey size={18} />
      </IconButton>
    </header>
  );
});
