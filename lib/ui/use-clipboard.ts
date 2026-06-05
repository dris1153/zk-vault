"use client";

// Copy a value, then auto-wipe the clipboard after `clearSeconds` with a live
// countdown. Best-effort: the browser only lets us write the clipboard while the
// tab is FOCUSED, so when you copy and switch apps the timed wipe can't run. We
// therefore also retry the wipe the moment the tab regains focus/visibility, so
// the secret is cleared as soon as you return. It cannot be cleared if you never
// come back to the tab, and an OS clipboard-history manager keeps its own copy.

import { useState, useRef, useEffect, useCallback } from "react";

export function useClipboard(clearSeconds: number) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);
  const timer = useRef<number | null>(null);
  const pending = useRef(false); // a wipe is owed but the tab was unfocused

  const stopTimer = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
  }, []);

  const wipe = useCallback(() => {
    navigator.clipboard.writeText("").then(
      () => {
        pending.current = false;
      },
      () => {
        pending.current = true; // retry on focus/visibility
      },
    );
  }, []);

  // Retry the owed wipe as soon as the tab is focused/visible again.
  useEffect(() => {
    const retry = () => {
      if (pending.current && document.visibilityState === "visible") wipe();
    };
    document.addEventListener("visibilitychange", retry);
    window.addEventListener("focus", retry);
    return () => {
      document.removeEventListener("visibilitychange", retry);
      window.removeEventListener("focus", retry);
    };
  }, [wipe]);

  useEffect(() => stopTimer, [stopTimer]);

  // When the countdown reaches 0, perform the wipe (side-effect OUTSIDE the
  // state updater, so it is not double-invoked under StrictMode).
  useEffect(() => {
    if (!copiedField || remaining > 0) return;
    stopTimer();
    pending.current = true;
    wipe();
    setCopiedField(null);
  }, [copiedField, remaining, stopTimer, wipe]);

  const copy = useCallback(
    async (field: string, value: string) => {
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        return;
      }
      pending.current = false;
      setCopiedField(field);
      setRemaining(clearSeconds);
      stopTimer();
      timer.current = window.setInterval(() => {
        setRemaining((r) => (r <= 1 ? 0 : r - 1));
      }, 1000);
    },
    [clearSeconds, stopTimer],
  );

  return { copy, copiedField, remaining };
}
