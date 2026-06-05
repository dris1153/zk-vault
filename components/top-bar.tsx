"use client";

import { forwardRef } from "react";
import {
  MagnifyingGlass,
  Plus,
  LockKey,
  List,
} from "@phosphor-icons/react/dist/ssr";
import { PillButton, IconButton } from "./ui-kit";

export const TopBar = forwardRef<
  HTMLInputElement,
  {
    query: string;
    onQuery: (q: string) => void;
    onAdd: () => void;
    onLock: () => void;
    onMenu: () => void;
  }
>(function TopBar({ query, onQuery, onAdd, onLock, onMenu }, ref) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-charcoal px-4 sm:gap-3 sm:px-5">
      <IconButton
        onClick={onMenu}
        title="Menu"
        aria-label="Menu"
        className="md:hidden"
      >
        <List size={20} />
      </IconButton>
      <div className="relative flex-1 sm:max-w-xl">
        <MagnifyingGlass
          size={17}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-smoke"
        />
        <input
          ref={ref}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search vault..."
          className="w-full rounded-full border border-transparent bg-ash py-2 pl-9 pr-3 text-sm text-snow outline-none transition placeholder:text-smoke focus:border-azure focus:bg-obsidian sm:pr-16"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-slate px-1.5 py-px text-[11px] text-smoke sm:block">
          Ctrl K
        </span>
      </div>
      <div className="hidden flex-1 sm:block" />
      <PillButton onClick={onAdd}>
        <Plus size={16} /> Add
      </PillButton>
      <IconButton onClick={onLock} title="Lock now" aria-label="Lock now">
        <LockKey size={18} />
      </IconButton>
    </header>
  );
});
