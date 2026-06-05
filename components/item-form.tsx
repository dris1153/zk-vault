"use client";

import { useState } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react/dist/ssr";
import type { VaultItemType } from "@/lib/supabase/types";
import { FIELDS_BY_TYPE } from "@/lib/ui/item-fields";
import { Field, TextInput, TextArea } from "./ui-kit";
import { PlatformPicker } from "./platform-picker";
import { TotpField } from "./totp-field";
import { EngineSelect } from "./engine-select";

export type FormData = Record<string, unknown>;

// Stop browser + password-manager autofill in the item dialog: these fields are
// for typing NEW credentials to store, not a login form. Spread onto each input.
const IGNORE_AUTOFILL = {
  "data-1p-ignore": "",
  "data-lpignore": "true",
  "data-bwignore": "",
  "data-form-type": "other",
} as const;

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
      {FIELDS_BY_TYPE[type].map((f) => {
        const str = typeof value[f.name] === "string" ? (value[f.name] as string) : "";
        return (
          <Field key={f.name} label={f.label}>
            {f.kind === "textarea" ? (
              <TextArea
                value={str}
                onChange={(e) => set(f.name, e.target.value)}
                autoComplete="off"
                className={f.name === "public_key" ? "font-mono" : ""}
              />
            ) : f.kind === "secret" ? (
              <SecretInput value={str} onChange={(v) => set(f.name, v)} />
            ) : f.kind === "platform" ? (
              <PlatformPicker value={str} onChange={(v) => set(f.name, v)} />
            ) : f.kind === "totp" ? (
              <TotpField value={str} onChange={(v) => set(f.name, v)} />
            ) : f.kind === "db_engine" ? (
              <EngineSelect value={str} onChange={(v) => set(f.name, v)} />
            ) : f.kind === "tags" ? (
              <TagsInput
                value={Array.isArray(value.tags) ? (value.tags as string[]) : []}
                onChange={(v) => set("tags", v)}
              />
            ) : (
              <TextInput
                value={str}
                onChange={(e) => set(f.name, e.target.value)}
                autoComplete="off"
                {...IGNORE_AUTOFILL}
              />
            )}
          </Field>
        );
      })}
    </div>
  );
}

function SecretInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <TextInput
        mono
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="new-password"
        {...IGNORE_AUTOFILL}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-silver hover:text-snow"
        aria-label={show ? "Hide" : "Show"}
      >
        {show ? <EyeSlash size={18} /> : <Eye size={18} />}
      </button>
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
      autoComplete="off"
      {...IGNORE_AUTOFILL}
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
