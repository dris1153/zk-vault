"use client";

import { useEffect, useState } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react/dist/ssr";
import { parseTotp, currentCode, formatCode } from "@/lib/ui/totp";
import { TextInput } from "./ui-kit";

export function TotpField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  const [, force] = useState(0);
  const totp = parseTotp(value);

  useEffect(() => {
    if (!totp) return;
    const id = window.setInterval(() => force((n) => n + 1), 1000);
    return () => window.clearInterval(id);
    // re-arm when the input changes; totp is derived from value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <TextInput
          mono
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="JBSW... hoặc otpauth://..."
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-silver hover:text-snow"
          aria-label={show ? "Ẩn" : "Hiện"}
        >
          {show ? <EyeSlash size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {value.trim() &&
        (totp ? (
          <Preview totp={totp} />
        ) : (
          <span className="text-xs text-danger">Secret không hợp lệ</span>
        ))}
    </div>
  );
}

function Preview({ totp }: { totp: ReturnType<typeof parseTotp> }) {
  if (!totp) return null;
  const { code, secondsRemaining } = currentCode(totp);
  return (
    <span className="text-xs text-azure">
      Mã hiện tại: <span className="font-mono">{formatCode(code)}</span>{" "}
      <span className="text-smoke">({secondsRemaining}s)</span>
    </span>
  );
}
