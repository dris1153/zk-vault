"use client";

import { useEffect, useState } from "react";
import { Eye, EyeSlash, ArrowsClockwise } from "@phosphor-icons/react/dist/ssr";
import type { VaultItemType } from "@/lib/supabase/types";
import { FIELDS_BY_TYPE } from "@/lib/ui/item-fields";
import { generatePassword } from "@/lib/ui/password-gen";
import { scorePassword } from "@/lib/vault/password-health";
import { OAUTH_PROVIDERS } from "@/lib/ui/oauth-providers";
import { Field, TextInput, TextArea } from "./ui-kit";
import { PlatformPicker } from "./platform-picker";
import { TotpField } from "./totp-field";
import { EngineSelect } from "./engine-select";
import { ServicePicker } from "./service-picker";
import { Select } from "./select";
import { BrandIcon } from "./brand-icon";

export type FormData = Record<string, unknown>;

export function ItemForm({
  type,
  value,
  onChange,
}: {
  type: VaultItemType;
  value: FormData;
  onChange: (v: FormData) => void;
}) {
  const set = (name: string, v: unknown) => onChange({ ...value, [name]: v });

  return (
    <div className="flex flex-col gap-4">
      {FIELDS_BY_TYPE[type]
        .filter((f) => !f.visibleWhen || f.visibleWhen(value))
        .map((f) => {
        const str = typeof value[f.name] === "string" ? (value[f.name] as string) : "";
        return (
          <Field key={f.name} label={f.label}>
            {f.kind === "auth_method" ? (
              <AuthMethodToggle
                value={value.auth_method === "oauth" ? "oauth" : "credential"}
                onChange={(v) => set("auth_method", v)}
              />
            ) : f.kind === "oauth_provider" ? (
              <Select
                value={str}
                onChange={(v) => set(f.name, v)}
                options={OAUTH_PROVIDERS.map((p) => ({
                  value: p.id,
                  label: p.name,
                  icon: <BrandIcon iconRef={p.icon} label={p.name} size={16} />,
                }))}
              />
            ) : f.kind === "textarea" ? (
              <TextArea
                value={str}
                onChange={(e) => set(f.name, e.target.value)}
                className={f.name === "public_key" ? "font-mono" : ""}
              />
            ) : f.kind === "secret" ? (
              <SecretInput
                value={str}
                onChange={(v) => set(f.name, v)}
                withTools={f.name === "password" || f.name === "passphrase"}
              />
            ) : f.kind === "platform" ? (
              <PlatformPicker value={str} onChange={(v) => set(f.name, v)} />
            ) : f.kind === "totp" ? (
              <TotpField value={str} onChange={(v) => set(f.name, v)} />
            ) : f.kind === "db_engine" ? (
              <EngineSelect value={str} onChange={(v) => set(f.name, v)} />
            ) : f.kind === "service" ? (
              <ServicePicker value={str} onChange={(v) => set(f.name, v)} />
            ) : f.kind === "tags" ? (
              <TagsInput
                value={Array.isArray(value.tags) ? (value.tags as string[]) : []}
                onChange={(v) => set("tags", v)}
              />
            ) : (
              <TextInput
                value={str}
                onChange={(e) => set(f.name, e.target.value)}
              />
            )}
          </Field>
        );
      })}
    </div>
  );
}

function AuthMethodToggle({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: "credential" | "oauth") => void;
}) {
  const opts: { v: "credential" | "oauth"; label: string }[] = [
    { v: "credential", label: "Mật khẩu" },
    { v: "oauth", label: "OAuth" },
  ];
  return (
    <div className="flex overflow-hidden rounded-lg border border-slate">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={`flex-1 px-3 py-2 text-sm transition ${
            value === o.v
              ? "bg-azure font-medium text-[#08233f]"
              : "text-silver hover:bg-ash hover:text-snow"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const STRENGTH = [
  { label: "Rất yếu", color: "bg-danger", w: "w-1/5" },
  { label: "Yếu", color: "bg-danger", w: "w-2/5" },
  { label: "Trung bình", color: "bg-amber-500", w: "w-3/5" },
  { label: "Khá", color: "bg-azure", w: "w-4/5" },
  { label: "Mạnh", color: "bg-emerald-500", w: "w-full" },
];

function SecretInput({
  value,
  onChange,
  withTools,
}: {
  value: string;
  onChange: (v: string) => void;
  withTools?: boolean;
}) {
  const [show, setShow] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    if (!withTools || !value) {
      setScore(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      scorePassword(value).then((s) => {
        if (!cancelled) setScore(s);
      });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [value, withTools]);

  return (
    <div>
      <div className="relative">
        <TextInput
          mono
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={withTools ? "pr-16" : "pr-10"}
        />
        {withTools && (
          <button
            type="button"
            onClick={() => {
              onChange(generatePassword());
              setShow(true);
            }}
            className="absolute right-9 top-1/2 -translate-y-1/2 text-silver transition hover:text-azure"
            aria-label="Tạo mật khẩu mạnh"
            title="Tạo mật khẩu mạnh"
          >
            <ArrowsClockwise size={18} />
          </button>
        )}
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-silver hover:text-snow"
          aria-label={show ? "Hide" : "Show"}
        >
          {show ? <EyeSlash size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {withTools && score !== null && (
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-charcoal">
            <div
              className={`h-full rounded-full transition-all ${STRENGTH[score].color} ${STRENGTH[score].w}`}
            />
          </div>
          <span className="w-20 text-right text-xs text-smoke">
            {STRENGTH[score].label}
          </span>
        </div>
      )}
    </div>
  );
}

function TagsInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [raw, setRaw] = useState(value.join(", "));
  return (
    <TextInput
      value={raw}
      placeholder="comma, separated, tags"
      onChange={(e) => {
        setRaw(e.target.value);
        onChange(
          e.target.value
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        );
      }}
    />
  );
}
