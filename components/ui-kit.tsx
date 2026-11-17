"use client";

// Small shared primitives in the DESIGN.md Campsite system. Pill buttons (9999px),
// 8px inputs with Fog Gray chrome, Paper White cards with 5%-black shadows.

import { forwardRef, useEffect, useId, useRef } from "react";
import { Check } from "@phosphor-icons/react/dist/ssr";

// Module-level stack so Escape only ever closes the topmost open Modal.
const modalStack: string[] = [];

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
};

export function PillButton({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const styles = {
    primary:
      "bg-ink text-white shadow-button hover:bg-ink/90 active:translate-y-px disabled:opacity-50",
    ghost:
      "border border-line bg-surface text-ink-2 hover:bg-inset hover:text-ink disabled:opacity-50",
    danger:
      "border border-danger/30 bg-danger/5 text-danger hover:bg-danger/10 disabled:opacity-50",
  }[variant];
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed ${styles} ${className}`}
      {...props}
    />
  );
}

export function IconButton({ className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-2 transition hover:bg-inset hover:text-ink ${className}`}
      {...props}
    />
  );
}

export function Tag({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-accent-wash px-2.5 py-0.5 text-xs font-medium text-accent-ink ${className}`}
    >
      {children}
    </span>
  );
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
  hint?: string;
}

export function Field({ label, children, hint }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium tracking-[0.3px] text-muted">
        {label}
      </span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

export const TextInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    mono?: boolean;
    // allow password-manager ignore attributes (data-1p-ignore, data-lpignore, ...)
    [key: `data-${string}`]: string | undefined;
  }
>(function TextInput({ className = "", mono, type, autoComplete, ...props }, ref) {
  // A vault wants NO browser/password-manager autofill on any field. Default to
  // off (new-password for password fields) + ignore attrs; callers can override.
  const noFill = autoComplete ?? (type === "password" ? "new-password" : "off");
  return (
    <input
      ref={ref}
      type={type}
      autoComplete={noFill}
      data-1p-ignore=""
      data-lpignore="true"
      data-bwignore=""
      data-form-type="other"
      className={`w-full rounded-lg border border-transparent bg-inset px-3 py-2.5 text-sm text-ink transition placeholder:text-faint focus:border-ink/30 focus:bg-surface ${
        mono ? "font-mono tracking-normal" : ""
      } ${className}`}
      {...props}
    />
  );
});

export function TextArea({
  className = "",
  autoComplete = "off",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      autoComplete={autoComplete}
      data-1p-ignore=""
      data-lpignore="true"
      data-bwignore=""
      data-form-type="other"
      className={`w-full resize-y rounded-lg border border-transparent bg-inset px-3 py-2.5 text-sm text-ink transition placeholder:text-faint focus:border-ink/30 focus:bg-surface ${className}`}
      {...props}
    />
  );
}

/** Centered modal backdrop + panel. Closes only if it is the topmost modal. */
export function Modal({
  open,
  onClose,
  children,
  width = "max-w-lg",
  dismissable = true,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
  dismissable?: boolean;
}) {
  const id = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    modalStack.push(id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (modalStack[modalStack.length - 1] !== id) return;
      if (!dismissable) return;
      e.stopPropagation();
      e.preventDefault();
      onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      const idx = modalStack.lastIndexOf(id);
      if (idx !== -1) modalStack.splice(idx, 1);
    };
  }, [open, id, dismissable]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px]"
      onMouseDown={(e) => {
        if (dismissable && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${width} max-h-[90dvh] overflow-y-auto rounded-xl border border-line bg-surface shadow-card`}
      >
        {children}
      </div>
    </div>
  );
}

/** Presentational checkbox box (the styled square only). Use inside a control that
 *  already handles the toggle (e.g. a clickable row/button). */
export function CheckboxBox({
  checked,
  className = "",
}: {
  checked: boolean;
  className?: string;
}) {
  return (
    <span
      className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[5px] border transition ${
        checked
          ? "border-ink bg-ink text-white"
          : "border-line bg-inset text-transparent"
      } ${className}`}
    >
      <Check size={13} weight="bold" />
    </span>
  );
}

/** Accessible custom checkbox: a hidden native input + a styled box. */
export function Checkbox({
  checked,
  onChange,
  disabled,
  className = "",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <span className={`relative inline-flex h-4.5 w-4.5 shrink-0 ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      <span className="flex h-full w-full items-center justify-center rounded-[5px] border border-line bg-inset text-transparent transition peer-hover:border-muted peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-ink/30 peer-disabled:opacity-50">
        <Check size={13} weight="bold" />
      </span>
    </span>
  );
}

/** Toggle switch for on/off settings. */
export function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition disabled:opacity-50 ${
        checked ? "bg-ink" : "bg-line"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-surface shadow-row transition-transform ${
          checked ? "translate-x-4.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
