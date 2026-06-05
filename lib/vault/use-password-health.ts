"use client";

// Reactive password-health analysis over the in-RAM items. zxcvbn loads lazily
// inside analyzePasswordHealth; the breach check runs only when `breach` is true.

import { useEffect, useRef, useState } from "react";
import { useItems } from "./items-store";
import { analyzePasswordHealth, type HealthReport } from "./password-health";

export function usePasswordHealth(opts: { breach: boolean; weak: boolean }): {
  report: HealthReport | null;
  loading: boolean;
} {
  const items = useItems((s) => s.items);
  const [report, setReport] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(false);
  const runId = useRef(0);

  useEffect(() => {
    const id = ++runId.current;
    setLoading(true);
    analyzePasswordHealth(items, { breach: opts.breach, weak: opts.weak })
      .then((r) => {
        if (id === runId.current) setReport(r);
      })
      .catch(() => {
        if (id === runId.current) setReport(null);
      })
      .finally(() => {
        if (id === runId.current) setLoading(false);
      });
  }, [items, opts.breach, opts.weak]);

  return { report, loading };
}
