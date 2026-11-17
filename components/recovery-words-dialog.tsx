"use client";

import { useState } from "react";
import { Modal, PillButton, Checkbox } from "./ui-kit";

export function RecoveryWordsDialog({
  words,
  onClose,
}: {
  words: string[];
  onClose: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(words.join(" "));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <Modal open onClose={() => {}} width="max-w-xl">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-ink">
          Lưu khóa khôi phục (24 từ)
        </h2>
        <p className="mt-1 text-sm text-muted">
          24 từ này là cách duy nhất để khôi phục vault nếu bạn quên master
          password. Hãy ghi ra giấy và cất giữ ngoại tuyến. Chúng chỉ hiển thị
          một lần duy nhất.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {words.map((w, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg border border-line bg-inset px-3 py-2"
            >
              <span className="w-5 text-right font-mono text-xs text-ink-2">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-mono text-sm text-ink">{w}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <PillButton variant="ghost" onClick={copyAll}>
            {copied ? "Đã chép" : "Sao chép tất cả"}
          </PillButton>
          <span className="text-xs text-danger">
            Mất cả master password và recovery key đồng nghĩa mất dữ liệu vĩnh
            viễn.
          </span>
        </div>

        <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm text-ink-2">
          <Checkbox checked={confirmed} onChange={setConfirmed} />
          Tôi đã lưu khóa khôi phục ở nơi an toàn.
        </label>

        <div className="mt-5 flex justify-end">
          <PillButton disabled={!confirmed} onClick={onClose}>
            Tiếp tục vào vault
          </PillButton>
        </div>
      </div>
    </Modal>
  );
}
