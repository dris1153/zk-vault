"use client";

import { useEffect, useState } from "react";
import { Copy, Check } from "@phosphor-icons/react/dist/ssr";
import { parseTotp, currentCode, formatCode } from "@/lib/ui/totp";
import { IconButton } from "./ui-kit";

export function TotpDisplay({
  secret,
  onCopy,
}: {
  secret: string;
  onCopy?: (code: string) => void;
}) {
  const totp = parseTotp(secret);
  const [, force] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!totp) return;
    const id = window.setInterval(() => force((n) => n + 1), 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret]);

  if (!secret.trim()) return null;

  return (
    <div className="border-b border-charcoal py-3.5">
      <div className="mb-1.5 text-[11px] uppercase tracking-[0.1em] text-smoke">
        Mã 2FA
      </div>
      {!totp ? (
        <span className="text-sm text-danger">TOTP không hợp lệ</span>
      ) : (
        <Live
          totp={totp}
          copied={copied}
          onCopy={(code) => {
            onCopy?.(code);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
          }}
        />
      )}
    </div>
  );
}

function Live({
  totp,
  copied,
  onCopy,
}: {
  totp: NonNullable<ReturnType<typeof parseTotp>>;
  copied: boolean;
  onCopy: (code: string) => void;
}) {
  const { code, secondsRemaining, period } = currentCode(totp);
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-xl tracking-[3px] text-azure">
        {formatCode(code)}
      </span>
      <Ring remaining={secondsRemaining} period={period} />
      <IconButton
        onClick={() => onCopy(code)}
        aria-label="Copy"
        className="ml-auto"
      >
        {copied ? <Check size={17} className="text-azure" /> : <Copy size={17} />}
      </IconButton>
    </div>
  );
}

function Ring({ remaining, period }: { remaining: number; period: number }) {
  const r = 9;
  const circ = 2 * Math.PI * r;
  const frac = remaining / period;
  return (
    <span className="relative inline-flex h-6 w-6 items-center justify-center">
      <svg width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r={r} fill="none" stroke="#2e2e2e" strokeWidth="2" />
        <circle
          cx="12"
          cy="12"
          r={r}
          fill="none"
          stroke="#3e9bff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - frac)}
          transform="rotate(-90 12 12)"
        />
      </svg>
      <span className="absolute font-mono text-[9px] text-smoke">{remaining}</span>
    </span>
  );
}
