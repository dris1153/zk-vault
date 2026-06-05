"use client";

// Registers the service worker (production only) and surfaces a "new version,
// reload" prompt when a new SW is waiting. The SW waits (skipWaiting: false) until
// the user confirms, so an open vault session is never refreshed out from under them.

import { useEffect, useState } from "react";
import { ArrowClockwise } from "@phosphor-icons/react/dist/ssr";

type SkipFn = () => void;

export function PwaUpdate() {
  const [skip, setSkip] = useState<SkipFn | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let cancelled = false;
    (async () => {
      const { Serwist } = await import("@serwist/window");
      if (cancelled) return;
      const sw = new Serwist("/sw.js", { scope: "/" });
      // Reload ONLY when the user clicked "Tải lại" - not on the first-install
      // clients.claim(), which also fires "controlling".
      let reloadRequested = false;
      sw.addEventListener("waiting", () => {
        setSkip(() => () => {
          reloadRequested = true;
          void sw.messageSkipWaiting();
        });
      });
      sw.addEventListener("controlling", () => {
        if (reloadRequested) window.location.reload();
      });
      await sw.register();
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!skip) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-charcoal bg-ash px-4 py-3 shadow-lg">
      <span className="text-sm text-silver">Có bản cập nhật mới</span>
      <button
        onClick={skip}
        className="flex items-center gap-1.5 rounded-lg bg-azure px-3 py-1.5 text-sm font-medium text-[#08233f] transition hover:brightness-110"
      >
        <ArrowClockwise size={15} /> Tải lại
      </button>
    </div>
  );
}
