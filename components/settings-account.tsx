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
      return setError(`Mật khẩu mới phải có ít nhất ${MIN_LEN} ký tự.`);
    if (next !== confirm) return setError("Mật khẩu mới không khớp.");
    setBusy(true);
    try {
      await changeMasterPassword(current, next);
      setStatus("Đã đổi master password.");
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
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
        Đổi master password
      </div>
      <p className="text-sm text-ink-2">
        Chỉ bọc lại khóa giải mã mà không mã hóa lại các mục. Recovery key vẫn
        còn hiệu lực.
      </p>

      <Field label="Mật khẩu hiện tại">
        <TextInput
          mono
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </Field>
      <Field label="Mật khẩu mới">
        <TextInput
          mono
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
      </Field>
      <Field label="Xác nhận mật khẩu mới">
        <TextInput
          mono
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </Field>

      {error && <p className="text-sm text-danger">{error}</p>}
      {status && <p className="text-sm font-medium text-ink">{status}</p>}

      <PillButton onClick={submit} disabled={busy} className="self-end">
        {busy ? "Đang đổi..." : "Đổi mật khẩu"}
      </PillButton>

      <div className="h-px bg-line" />

      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
        Recovery key
      </div>
      <p className="text-sm text-ink-2">
        Tạo lại bộ 24 từ recovery (ví dụ khi lỡ mất giấy). Recovery key cũ sẽ
        ngừng hoạt động; master password không đổi.
      </p>
      {rotError && <p className="text-sm text-danger">{rotError}</p>}
      {rotating ? (
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-4">
          <p className="text-sm text-ink-2">
            Recovery key cũ sẽ{" "}
            <strong className="text-ink">không dùng được nữa</strong>. Hãy lưu kỹ
            24 từ mới hiện ra ngay sau đó.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <PillButton
              variant="ghost"
              onClick={() => setRotating(false)}
              disabled={rotBusy}
            >
              Hủy
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
