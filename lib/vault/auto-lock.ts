// Auto-lock: wipe the session after an idle timeout, and (optionally) when the
// tab is hidden. Activity on pointer/keyboard/scroll resets the idle timer.

"use client";

import { useEffect, useRef } from "react";
import { useSession } from "./session";
import { lock } from "./actions";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "pointermove", "scroll"];

export function useAutoLock(timeoutMs: number, lockOnHidden: boolean): void {
  const status = useSession((s) => s.status);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (status !== "unlocked") return;

    const resetTimer = () => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => lock(), timeoutMs);
    };
    const onVisibility = () => {
      if (lockOnHidden && document.hidden) lock();
    };

    ACTIVITY_EVENTS.forEach((e) =>
      window.addEventListener(e, resetTimer, { passive: true }),
    );
    document.addEventListener("visibilitychange", onVisibility);
    resetTimer();

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, resetTimer));
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [status, timeoutMs, lockOnHidden]);
}
