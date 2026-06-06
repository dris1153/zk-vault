"use client";

import { useState } from "react";
import { changeMasterPassword } from "@/lib/vault/change-master";
import { rotateRecoveryKey } from "@/lib/vault/rotate-recovery";
import { PillButton, TextInput, Field } from "./ui-kit";
import { RecoveryWordsDialog } from "./recovery-words-dialog";

const MIN_LEN = 8;

export function SettingsAccount() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [rotating, setRotating] = useState(false); // confirm step shown
  const [rotBusy, setRotBusy] = useState(false);
  const [rotError, setRotError] = useState<string | null>(null);
  const [newWords, setNewWords] = useState<string[] | null>(null);

  async function rotate() {
    setRotError(null);
    setRotBusy(true);
    try {
      const words = await rotateRecoveryKey();
      setNewWords(words);
      setRotating(false);
    } catch (e) {
      setRotError(e instanceof Error ? e.message : String(e));
    } finally {
      setRotBusy(false);
    }
  }

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

      <div className="h-px bg-charcoal" />

      <div className="text-[11px] uppercase tracking-[0.12em] text-smoke">
        Recovery key
      </div>
      <p className="text-sm text-silver">
        Tạo lại bộ 24 từ recovery (ví dụ khi lỡ mất giấy). Recovery key cũ sẽ ngừng
        hoạt động; master password không đổi.
      </p>
      {rotError && <p className="text-sm text-danger">{rotError}</p>}
      {rotating ? (
        <div className="rounded-2xl border border-danger/40 bg-danger/[0.06] p-4">
          <p className="text-sm text-silver">
            Recovery key cũ sẽ{" "}
            <strong className="text-snow">không dùng được nữa</strong>. Hãy lưu kỹ
            24 từ mới hiện ra ngay sau đó.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <PillButton
              variant="ghost"
              onClick={() => setRotating(false)}
              disabled={rotBusy}
            >
              Huỷ
            </PillButton>
            <PillButton variant="danger" onClick={rotate} disabled={rotBusy}>
              {rotBusy ? "Đang tạo..." : "Xác nhận tạo lại"}
            </PillButton>
          </div>
        </div>
      ) : (
        <PillButton
          variant="ghost"
          onClick={() => {
            setRotError(null);
            setRotating(true);
          }}
          className="self-start"
        >
          Tạo lại recovery key
        </PillButton>
      )}

      {newWords && (
        <RecoveryWordsDialog
          words={newWords}
          onClose={() => setNewWords(null)}
        />
      )}
    </div>
  );
}
