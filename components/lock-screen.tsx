"use client";

import { useEffect, useRef, useState } from "react";
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

// Attempt automatic biometric prompt at most once per page load so manual lock
// or user cancellation does not enter an unlock prompt loop.
let autoBioAttempted = false;

export function LockScreen({
  onProvisioned,
}: {
  onProvisioned: (words: string[]) => void;
}) {
  const { status, unlock, createVault } = useVault();
  const {
    enrolled,
    ready: bioReady,
    unlock: unlockBiometric,
  } = useBiometric();
  const [mode, setMode] = useState<"unlock" | "create">("unlock");
  const [email, setEmail] = useState("");
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [pwExpanded, setPwExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const autoTriedRef = useRef(false);

  // Prefill the remembered email (after mount, to avoid an SSR hydration mismatch).
  useEffect(() => {
    const saved = getVaultEmail();
    if (saved) {
      setEmail(saved);
      setSavedEmail(saved);
    }
    setReady(true);
  }, []);

  const emailKnown =
    mode === "unlock" &&
    ready &&
    !signedOut &&
    !!savedEmail &&
    savedEmail.trim().length > 0;
  const bioPrimary = mode === "unlock" && bioReady && enrolled && !signedOut;

  // Auto-trigger biometric prompt once on cold mount when enrolled and remembered.
  useEffect(() => {
    if (!ready || !bioPrimary) return;
    if (autoBioAttempted || autoTriedRef.current) return;
    autoBioAttempted = true;
    autoTriedRef.current = true;
    unlockBiometric().catch(() => {
      // Silent fallback: Safari/iOS may require a tap, or user cancelled.
    });
  }, [ready, bioPrimary, unlockBiometric]);

  const busy = status === "unlocking";

  async function biometric() {
    setError(null);
    try {
      await unlockBiometric();
    } catch {
      setError("Mở khóa bằng sinh trắc thất bại. Hãy dùng master password.");
      setPwExpanded(true);
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
    setSignedOut(true);
    setPw("");
    setConfirm("");
    setPwExpanded(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const mail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(mail)) return setError("Nhập email hợp lệ.");
    try {
      if (mode === "create") {
        if (pw.length < MIN_LEN)
          return setError(`Master password phải có ít nhất ${MIN_LEN} ký tự.`);
        if (pw !== confirm) return setError("Master password không khớp.");
        const words = await createVault(mail, pw);
        onProvisioned(words);
      } else {
        await unlock(mail, pw);
      }
    } catch (err) {
      setError(messageFor(err, mode));
    }
  }

  const formVisible = !bioPrimary || pwExpanded;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 text-center shadow-card sm:p-8">
        <div className="mb-5 flex justify-center">
          <BrandMark variant="tile" size={48} />
        </div>
        <h1 className="text-[22px] font-semibold tracking-[-0.37px] text-ink">
          {mode === "create" ? "Tạo vault mới" : "Vault đang khóa"}
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {mode === "create"
            ? "Chọn master password. Mật khẩu này không bao giờ rời khỏi máy và không thể đặt lại."
            : bioPrimary
              ? "Xác thực sinh trắc hoặc nhập master password"
              : "Nhập master password để giải mã"}
        </p>

        {bioPrimary && (
          <div className="mt-6 flex flex-col gap-2.5">
            <PillButton
              onClick={biometric}
              disabled={busy}
              className="w-full py-3"
            >
              <Fingerprint size={18} />
              {busy ? "Đang mở khóa..." : "Mở bằng vân tay / Face"}
            </PillButton>
            {!pwExpanded && (
              <button
                type="button"
                onClick={() => setPwExpanded(true)}
                className="py-1 text-xs font-medium text-muted hover:text-ink md:hidden"
              >
                Dùng master password
              </button>
            )}
          </div>
        )}

        <form
          onSubmit={submit}
          className={`mt-5 flex flex-col gap-3 text-left ${
            formVisible ? "flex" : "hidden md:flex"
          }`}
        >
          {emailKnown ? (
            <div className="flex items-center justify-between gap-2 rounded-lg bg-inset px-3 py-2.5">
              <span className="flex min-w-0 items-center gap-2 text-sm text-ink-2">
                <User size={17} className="shrink-0 text-muted" />
                <span className="truncate">{email}</span>
              </span>
              <button
                type="button"
                onClick={signOut}
                className="shrink-0 text-xs font-medium text-ink underline-offset-2 hover:underline"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <input
              type="email"
              value={email}
              autoFocus={mode === "create" || signedOut}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="off"
              data-1p-ignore=""
              data-lpignore="true"
              data-bwignore=""
              data-form-type="other"
              className="w-full rounded-lg border border-transparent bg-inset px-3 py-2.5 text-sm text-ink transition placeholder:text-faint focus:border-ink/30 focus:bg-surface"
            />
          )}
          <PasswordInput
            value={pw}
            onChange={setPw}
            show={show}
            onToggle={() => setShow((s) => !s)}
            placeholder="Master password"
            autoFocus={ready && bioReady && mode === "unlock" && !bioPrimary && emailKnown}
          />
          {mode === "create" && (
            <PasswordInput
              value={confirm}
              onChange={setConfirm}
              show={show}
              placeholder="Xác nhận master password"
            />
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <PillButton
            type="submit"
            variant={bioPrimary ? "ghost" : "primary"}
            disabled={busy}
            className="mt-1 w-full py-3"
          >
            {busy
              ? "Đang giải mã..."
              : mode === "create"
                ? "Tạo vault"
                : "Mở khóa"}
            {!busy && <ArrowRight size={16} />}
          </PillButton>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className="text-sm font-medium text-ink underline-offset-2 hover:underline"
            onClick={() => {
              setError(null);
              setPw("");
              setConfirm("");
              setMode((m) => (m === "create" ? "unlock" : "create"));
            }}
          >
            {mode === "create"
              ? "Đã có vault? Mở khóa"
              : "Lần đầu sử dụng? Tạo vault"}
          </button>
          <Link href="/docs">
            <PillButton variant="ghost">
              <BookOpen size={15} /> Tài liệu
            </PillButton>
          </Link>
        </div>

        {mode === "unlock" && (
          <p className="mt-5 text-xs text-muted">
            Quên master password? Khôi phục bằng file backup đã export (Cài đặt
            &rarr; Sao lưu).
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
        className="w-full rounded-lg border border-transparent bg-inset px-3 py-2.5 pr-10 font-mono text-sm text-ink transition placeholder:font-sans placeholder:text-faint focus:border-ink/30 focus:bg-surface"
      />
      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
          aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
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
    return "Sai master password.";
  if (/already registered/i.test(msg))
    return "Tài khoản này đã có vault. Hãy chuyển sang Mở khóa.";
  return msg;
}
