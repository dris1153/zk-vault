"use client";

import { useEffect, useState } from "react";
import { Copy, Check } from "@phosphor-icons/react/dist/ssr";
import {
  parseTotp,
  currentCode,
  nextCode,
  formatCode,
} from "@/lib/ui/totp";
import { IconButton } from "./ui-kit";
import { CountdownRing } from "./code-row";

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
    <div className="border-b border-line py-3.5">
      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
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
  const now = Date.now();
  const { code, secondsRemaining, period } = currentCode(totp, now);
  const expiring = secondsRemaining <= 5;
  const next = expiring ? nextCode(totp, now) : null;
  return (
    <div className="flex items-center gap-3">
      <div>
        <span
          className={`font-mono text-xl font-semibold tracking-[3px] tabular-nums ${
            expiring ? "text-danger" : "text-ink"
          }`}
        >
          {formatCode(code)}
        </span>
        {expiring && next && (
          <div className="font-mono text-[11px] font-medium text-danger tabular-nums">
            Tiếp theo: {formatCode(next)}
          </div>
        )}
      </div>
      <CountdownRing
        remaining={secondsRemaining}
        period={period}
        expiring={expiring}
      />
      <IconButton
        onClick={() => onCopy(code)}
        aria-label="Sao chép mã 2FA"
        className="ml-auto"
      >
        {copied ? <Check size={17} className="text-ink" /> : <Copy size={17} />}
      </IconButton>
    </div>
  );
}
