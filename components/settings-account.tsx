"use client";

import { useState } from "react";
import { changeMasterPassword } from "@/lib/vault/change-master";
import { PillButton, TextInput, Field } from "./ui-kit";

const MIN_LEN = 8;

export function SettingsAccount() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setStatus(null);
    setError(null);
    if (next.length < MIN_LEN)
      return setError(`New password must be at least ${MIN_LEN} characters.`);
    if (next !== confirm) return setError("New passwords do not match.");
    setBusy(true);
    try {
      await changeMasterPassword(current, next);
      setStatus("Master password changed.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-[11px] uppercase tracking-[0.12em] text-smoke">
        Change master password
      </div>
      <p className="text-sm text-silver">
        Re-wraps your key without re-encrypting items. Your recovery key stays
        valid.
      </p>

      <Field label="Current master password">
        <TextInput
          mono
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </Field>
      <Field label="New master password">
        <TextInput
          mono
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
      </Field>
      <Field label="Confirm new password">
        <TextInput
          mono
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </Field>

      {error && <p className="text-sm text-danger">{error}</p>}
      {status && <p className="text-sm text-azure">{status}</p>}

      <PillButton onClick={submit} disabled={busy} className="self-end">
        {busy ? "Changing..." : "Change password"}
      </PillButton>
    </div>
  );
}
