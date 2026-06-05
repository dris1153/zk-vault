"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeSlash, QrCode } from "@phosphor-icons/react/dist/ssr";
import { parseTotp, currentCode, formatCode } from "@/lib/ui/totp";
import { decodeQrFromImage } from "@/lib/ui/qr-decode";
import { TextInput } from "./ui-kit";

type ScanState = "idle" | "scanning" | "error";

export function TotpField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  const [scan, setScan] = useState<ScanState>("idle");
  const [, force] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const totp = parseTotp(value);

  useEffect(() => {
    if (!totp) return;
    const id = window.setInterval(() => force((n) => n + 1), 1000);
    return () => window.clearInterval(id);
    // re-arm when the input changes; totp is derived from value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const set = (v: string) => {
    onChange(v);
    setScan("idle");
  };

  async function handleImage(file: Blob) {
    setScan("scanning");
    try {
      const text = await decodeQrFromImage(file);
      if (text) set(text.trim());
      else setScan("error");
    } catch {
      setScan("error");
    }
  }

  const onPaste = (e: React.ClipboardEvent) => {
    const img = Array.from(e.clipboardData.items).find((i) =>
      i.type.startsWith("image/"),
    );
    const file = img?.getAsFile();
    if (file) {
      e.preventDefault();
      void handleImage(file);
    }
  };

  return (
    <div className="flex flex-col gap-1.5" onPaste={onPaste}>
      <div className="relative">
        <TextInput
          mono
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => set(e.target.value)}
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

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleImage(f);
          e.target.value = "";
        }}
      />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex shrink-0 items-center gap-1 text-xs text-azure-link hover:underline"
        >
          <QrCode size={14} /> Quét QR
        </button>
        {scan === "scanning" && (
          <span className="text-xs text-smoke">Đang quét...</span>
        )}
        {scan === "error" && (
          <span className="text-xs text-danger">
            Không tìm thấy mã QR hợp lệ
          </span>
        )}
        {scan === "idle" &&
          value.trim() &&
          (totp ? (
            <Preview totp={totp} />
          ) : (
            <span className="text-xs text-danger">Secret không hợp lệ</span>
          ))}
      </div>
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
