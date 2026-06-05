"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeSlash,
  ArrowRight,
  BookOpen,
  Fingerprint,
  User,
} from "@phosphor-icons/react/dist/ssr";
import { useVault } from "@/lib/vault/use-vault";
import { useBiometric } from "@/lib/vault/use-biometric";
import { getVaultEmail, clearVaultEmail } from "@/lib/vault/identity";
import { signOutVault } from "@/lib/supabase/auth";
import { PillButton } from "./ui-kit";
import { BrandMark } from "./brand-mark";

const MIN_LEN = 8;

export function LockScreen({
  onProvisioned,
}: {
  onProvisioned: (words: string[]) => void;
}) {
  const { status, unlock, createVault } = useVault();
  const { enrolled, unlock: unlockBiometric } = useBiometric();
  // Always default to "unlock" (deterministic - no SSR/hydration flip) and correct
  // on a new device with an existing cloud vault. First-timers use the toggle.
  const [mode, setMode] = useState<"unlock" | "create">("unlock");
  const [email, setEmail] = useState("");
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false); // remembered-email check done

  // Prefill the remembered email (after mount, to avoid an SSR hydration mismatch).
  useEffect(() => {
    const saved = getVaultEmail();
    if (saved) {
      setEmail(saved);
      setSavedEmail(saved);
    }
    setReady(true);
  }, []);

  const busy = status === "unlocking";
  // Show the email as a label only when there is a REMEMBERED email (read at
  // mount), not while the user is typing a fresh one on first login.
  const emailKnown =
    mode === "unlock" && ready && !!savedEmail && savedEmail.trim().length > 0;

  async function biometric() {
    setError(null);
    try {
      await unlockBiometric();
    } catch {
      setError("Mở khóa bằng sinh trắc thất bại. Dùng master password.");
    }
  }

  async function signOut() {
    setError(null);
    clearVaultEmail();
    try {
      await signOutVault();
    } catch {
      // best-effort; locking already wiped the in-RAM key
    }
    setEmail("");
    setSavedEmail(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const mail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(mail)) return setError("Nhập email hợp lệ.");
    try {
      if (mode === "create") {
        if (pw.length < MIN_LEN)
          return setError(
            `Master password must be at least ${MIN_LEN} characters.`,
          );
        if (pw !== confirm) return setError("Passwords do not match.");
        const words = await createVault(mail, pw);
        onProvisioned(words);
      } else {
        await unlock(mail, pw);
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
          {emailKnown ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-charcoal bg-ash/40 px-3 py-2.5">
              <span className="flex min-w-0 items-center gap-2 text-sm text-silver">
                <User size={17} className="shrink-0 text-smoke" />
                <span className="truncate">{email}</span>
              </span>
              <button
                type="button"
                onClick={signOut}
                className="shrink-0 text-xs text-azure-link hover:underline"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <input
              type="email"
              value={email}
              autoFocus={mode === "create"}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="off"
              data-1p-ignore=""
              data-lpignore="true"
              data-bwignore=""
              data-form-type="other"
              className="w-full rounded-lg border border-slate bg-obsidian px-3 py-2.5 text-sm text-snow outline-none transition placeholder:text-smoke focus:border-azure"
            />
          )}
          <PasswordInput
            value={pw}
            onChange={setPw}
            show={show}
            onToggle={() => setShow((s) => !s)}
            placeholder="Master password"
            autoFocus={mode === "unlock"}
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

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
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
        autoComplete="new-password"
        data-1p-ignore=""
        data-lpignore="true"
        data-bwignore=""
        data-form-type="other"
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
