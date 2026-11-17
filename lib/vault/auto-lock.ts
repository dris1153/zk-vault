// Auto-lock: wipe the session after an idle timeout, and optionally after a
// grace period when the tab/app is hidden. Uses wall-clock timestamps alongside
// timers so background throttling or device sleep cannot bypass the lock.

"use client";

import { useEffect, useRef } from "react";
import { useSession } from "./session";
import { lock } from "./actions";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "pointermove", "scroll"];

export function useAutoLock(
  timeoutMs: number,
  lockOnHiddenAfterMs: number = 60_000,
): void {
  const status = useSession((s) => s.status);
  const idleTimer = useRef<number | null>(null);
  const hiddenTimer = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const hiddenAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (status !== "unlocked") return;

    lastActivityRef.current = Date.now();
    hiddenAtRef.current = document.hidden ? Date.now() : null;

    const clearHidden = () => {
      if (hiddenTimer.current !== null) {
        window.clearTimeout(hiddenTimer.current);
        hiddenTimer.current = null;
      }
    };

    const armIdle = (delay = timeoutMs) => {
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => lock(), delay);
    };

    const armHidden = () => {
      clearHidden();
      if (lockOnHiddenAfterMs === 0) {
        lock();
      } else if (lockOnHiddenAfterMs > 0) {
        hiddenTimer.current = window.setTimeout(
          () => lock(),
          lockOnHiddenAfterMs,
        );
      }
    };

    const onActivity = (e: Event) => {
      const now = Date.now();
      // Throttle noisy pointermove events so we don't thrash timers on every px.
      if (e.type === "pointermove" && now - lastActivityRef.current < 1000) {
        return;
      }
      lastActivityRef.current = now;
      armIdle(timeoutMs);
    };

    const checkElapsedAndResume = () => {
      const now = Date.now();
      if (
        hiddenAtRef.current !== null &&
        lockOnHiddenAfterMs >= 0 &&
        now - hiddenAtRef.current >= lockOnHiddenAfterMs
      ) {
        lock();
        return;
      }
      const idleElapsed = now - lastActivityRef.current;
      if (idleElapsed >= timeoutMs) {
        lock();
        return;
      }
      hiddenAtRef.current = null;
      clearHidden();
      armIdle(timeoutMs - idleElapsed);
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (hiddenAtRef.current === null) hiddenAtRef.current = Date.now();
        armHidden();
      } else {
        checkElapsedAndResume();
      }
    };

    ACTIVITY_EVENTS.forEach((ev) =>
      window.addEventListener(ev, onActivity, { passive: true, capture: true }),
    );
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", checkElapsedAndResume);
    window.addEventListener("pageshow", checkElapsedAndResume);

    armIdle(timeoutMs);
    if (document.hidden) armHidden();

    return () => {
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
      clearHidden();
      ACTIVITY_EVENTS.forEach((ev) =>
        window.removeEventListener(ev, onActivity, { capture: true }),
      );
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", checkElapsedAndResume);
      window.removeEventListener("pageshow", checkElapsedAndResume);
    };
  }, [status, timeoutMs, lockOnHiddenAfterMs]);
}
