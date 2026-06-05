"use client";

import { useState } from "react";
import { Modal, PillButton } from "./ui-kit";

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
        <h2 className="text-lg font-medium">Save your recovery key</h2>
        <p className="mt-1 text-sm text-smoke">
          These 24 words are the only way to recover your vault if you forget
          your master password. Write them down and store them offline. They are
          shown once and never again.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {words.map((w, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg border border-charcoal bg-ash px-3 py-2"
            >
              <span className="w-5 text-right font-mono text-xs text-smoke">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-mono text-sm text-snow">{w}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <PillButton variant="ghost" onClick={copyAll}>
            {copied ? "Copied" : "Copy all"}
          </PillButton>
          <span className="text-xs text-danger">
            No master password and no recovery key means the vault is
            unrecoverable.
          </span>
        </div>

        <label className="mt-5 flex items-center gap-3 text-sm text-silver">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-azure)]"
          />
          I have stored my recovery key in a safe place.
        </label>

        <div className="mt-5 flex justify-end">
          <PillButton disabled={!confirmed} onClick={onClose}>
            Continue to vault
          </PillButton>
        </div>
      </div>
    </Modal>
  );
}
