"use client";

// Copy a value, then auto-wipe the clipboard after `clearSeconds` with a live
// countdown. Best-effort: some browsers restrict clipboard writes when the tab
// is unfocused, so the wipe may not always land - we minimize lifetime anyway.

import { useState, useRef, useEffect, useCallback } from "react";

export function useClipboard(clearSeconds: number) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);
  const timer = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const copy = useCallback(
    async (field: string, value: string) => {
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        return;
      }
      setCopiedField(field);
      setRemaining(clearSeconds);
      stop();
      timer.current = window.setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            stop();
            navigator.clipboard.writeText("").catch(() => {});
            setCopiedField(null);
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    },
    [clearSeconds, stop],
  );

  return { copy, copiedField, remaining };
}
