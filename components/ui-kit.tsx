"use client";

// Small shared primitives in the DESIGN.md azure system. Pill buttons (9999px),
// 8px inputs, hairline borders, flat (no shadow), azure focus.

import { forwardRef } from "react";
import { Check } from "@phosphor-icons/react/dist/ssr";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "azure" | "ghost" | "danger";
};

export function PillButton({
  variant = "azure",
  className = "",
  ...props
}: ButtonProps) {
  const styles = {
    azure:
      "bg-azure text-[#08233f] hover:brightness-105 active:translate-y-px disabled:opacity-50",
    ghost:
      "border border-slate text-snow hover:border-graphite hover:bg-white/[0.04]",
    danger: "text-danger hover:bg-danger/10",
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
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-silver transition hover:bg-ash hover:text-snow ${className}`}
      {...props}
    />
  );
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
  hint?: string;
}

export function Field({ label, children, hint }: FieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-smoke">
        {label}
      </span>
      {children}
      {hint && <span className="text-xs text-smoke">{hint}</span>}
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
>(function TextInput({ className = "", mono, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-lg border border-slate bg-obsidian px-3 py-2.5 text-sm text-snow outline-none transition placeholder:text-smoke focus:border-azure ${
        mono ? "font-mono tracking-normal" : ""
      } ${className}`}
      {...props}
    />
  );
});

export function TextArea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      className={`w-full resize-y rounded-lg border border-slate bg-obsidian px-3 py-2.5 text-sm text-snow outline-none transition placeholder:text-smoke focus:border-azure ${className}`}
      {...props}
    />
  );
}

/** Centered modal backdrop + panel. */
export function Modal({
  open,
  onClose,
  children,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      // Close only when the press STARTS on the backdrop (mousedown), so selecting
      // text in an input and releasing outside does not dismiss the modal.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${width} max-h-[90dvh] overflow-y-auto rounded-2xl border border-charcoal bg-obsidian`}
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
          ? "border-azure bg-azure text-[#08233f]"
          : "border-slate bg-obsidian text-transparent"
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
      <span className="flex h-full w-full items-center justify-center rounded-[5px] border border-slate bg-obsidian text-transparent transition peer-hover:border-graphite peer-checked:border-azure peer-checked:bg-azure peer-checked:text-[#08233f] peer-focus-visible:ring-2 peer-focus-visible:ring-azure/50 peer-disabled:opacity-50">
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
        checked ? "bg-azure" : "bg-charcoal"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-snow transition-transform ${
          checked ? "translate-x-4.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
