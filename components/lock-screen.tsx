"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeSlash,
  ArrowRight,
  BookOpen,
  Fingerprint,
} from "@phosphor-icons/react/dist/ssr";
import { useVault } from "@/lib/vault/use-vault";
import { useBiometric } from "@/lib/vault/use-biometric";
import { PillButton } from "./ui-kit";
import { BrandMark } from "./brand-mark";

const MIN_LEN = 8;

export function LockScreen({
  onProvisioned,
}: {
  onProvisioned: (words: string[]) => void;
}) {
  const { status, isProvisioned, unlock, createVault } = useVault();
  const { enrolled, unlock: unlockBiometric } = useBiometric();
  const [mode, setMode] = useState<"unlock" | "create">(
    isProvisioned ? "unlock" : "create",
  );
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = status === "unlocking";

  async function biometric() {
    setError(null);
    try {
      await unlockBiometric();
    } catch {
      setError("Mở khóa bằng sinh trắc thất bại. Dùng master password.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "create") {
        if (pw.length < MIN_LEN)
          return setError(
            `Master password must be at least ${MIN_LEN} characters.`,
          );
        if (pw !== confirm) return setError("Passwords do not match.");
        const words = await createVault(pw);
        onProvisioned(words);
      } else {
        await unlock(pw);
      }
    } catch (err) {
      setError(messageFor(err, mode));
    }
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 flex justify-center">
          <BrandMark variant="tile" size={48} />
        </div>
        <h1 className="text-2xl font-medium">
          {mode === "create" ? "Create your vault" : "Vault locked"}
        </h1>
        <p className="mt-1.5 text-sm text-smoke">
          {mode === "create"
            ? "Choose a master password. It never leaves this device and cannot be reset."
            : "Enter your master password to decrypt"}
        </p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-3 text-left">
          <PasswordInput
            value={pw}
            onChange={setPw}
            show={show}
            onToggle={() => setShow((s) => !s)}
            placeholder="Master password"
            autoFocus
          />
          {mode === "create" && (
            <PasswordInput
              value={confirm}
              onChange={setConfirm}
              show={show}
              placeholder="Confirm master password"
            />
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <PillButton
            type="submit"
            disabled={busy}
            className="mt-1 w-full py-3"
          >
            {busy
              ? "Decrypting..."
              : mode === "create"
                ? "Create vault"
                : "Unlock"}
            {!busy && <ArrowRight size={16} />}
          </PillButton>
        </form>

        {mode === "unlock" && enrolled && (
          <PillButton
            variant="ghost"
            onClick={biometric}
            disabled={busy}
            className="mt-3 w-full py-3"
          >
            <Fingerprint size={18} /> Mở bằng vân tay / Face
          </PillButton>
        )}

        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            type="button"
            className="text-sm text-azure-link hover:underline"
            onClick={() => {
              setError(null);
              setMode((m) => (m === "create" ? "unlock" : "create"));
            }}
          >
            {mode === "create"
              ? "Already have a vault? Unlock"
              : "First time here? Create a vault"}
          </button>
          <Link href="/docs">
            <PillButton variant="ghost">
              <BookOpen size={15} /> Tài liệu
            </PillButton>
          </Link>
        </div>

        {mode === "unlock" && (
          <p className="mt-6 text-xs text-smoke">
            Forgot your master password? Recovery uses your encrypted export
            file (Settings &rarr; Export).
          </p>
        )}
      </div>
    </main>
  );
}

function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle?: () => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate bg-obsidian px-3 py-2.5 pr-10 font-mono text-sm text-snow outline-none transition placeholder:font-sans placeholder:text-smoke focus:border-azure"
      />
      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-silver hover:text-snow"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeSlash size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
}

function messageFor(err: unknown, mode: "unlock" | "create"): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (
    mode === "unlock" &&
    /invalid login|decrypt|operation-specific/i.test(msg)
  )
    return "Incorrect master password.";
  if (/already registered/i.test(msg))
    return "A vault already exists for this account. Switch to Unlock.";
  return msg;
}
