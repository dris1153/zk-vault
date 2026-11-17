"use client";

// Top-level tab + detail selection URL state (?tab=codes|vault&item=id).
// Uses history API directly so there are no extra Next.js routes or SSR hits,
// and mobile hardware back closes the detail sheet cleanly.

import { useCallback, useEffect, useRef, useState } from "react";

export type AppTab = "codes" | "vault";

function readUrlState(): { tab: AppTab; detailId: string | null } {
  if (typeof window === "undefined") return { tab: "codes", detailId: null };
  const params = new URLSearchParams(window.location.search);
  const tab: AppTab = params.get("tab") === "vault" ? "vault" : "codes";
  const detailId = tab === "vault" ? params.get("item") || null : null;
  return { tab, detailId };
}

export function useTab() {
  const [tab, setTabState] = useState<AppTab>("codes");
  const [detailId, setDetailId] = useState<string | null>(null);
  const pushedDetailRef = useRef(false);

  useEffect(() => {
    const sync = () => {
      const next = readUrlState();
      setTabState(next.tab);
      setDetailId(next.detailId);
      if (!next.detailId) pushedDetailRef.current = false;
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const setTab = useCallback((next: AppTab) => {
    setTabState(next);
    setDetailId(null);
    pushedDetailRef.current = false;
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (next === "codes") url.searchParams.delete("tab");
    else url.searchParams.set("tab", next);
    url.searchParams.delete("item");
    window.history.pushState(null, "", url.pathname + url.search + url.hash);
  }, []);

  const openDetail = useCallback((id: string, pushHistory = false) => {
    setTabState("vault");
    setDetailId(id);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", "vault");
    url.searchParams.set("item", id);
    if (pushHistory) {
      pushedDetailRef.current = true;
      window.history.pushState(null, "", url.pathname + url.search + url.hash);
    } else {
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setDetailId(null);
    if (typeof window === "undefined") return;
    if (pushedDetailRef.current && new URLSearchParams(window.location.search).has("item")) {
      pushedDetailRef.current = false;
      window.history.back();
      return;
    }
    pushedDetailRef.current = false;
    const url = new URL(window.location.href);
    url.searchParams.delete("item");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, []);

  return { tab, setTab, detailId, openDetail, closeDetail };
}
