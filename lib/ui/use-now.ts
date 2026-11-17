"use client";

// Single shared 1-second ticker for live TOTP lists. Aligns to the next whole
// second boundary and pauses while the document is hidden.

import { useEffect, useState } from "react";

export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let alignTimer: number | null = null;
    let tickTimer: number | null = null;

    const clearAll = () => {
      if (alignTimer !== null) window.clearTimeout(alignTimer);
      if (tickTimer !== null) window.clearInterval(tickTimer);
      alignTimer = null;
      tickTimer = null;
    };

    const start = () => {
      clearAll();
      if (document.hidden) return;
      const current = Date.now();
      setNow(current);
      const delay = intervalMs - (current % intervalMs);
      alignTimer = window.setTimeout(() => {
        setNow(Date.now());
        tickTimer = window.setInterval(() => setNow(Date.now()), intervalMs);
      }, delay);
    };

    const onVisibility = () => {
      if (document.hidden) clearAll();
      else start();
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearAll();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs]);

  return now;
}
