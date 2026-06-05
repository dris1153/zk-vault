"use client";

import { useState } from "react";
import { useVault } from "@/lib/vault/use-vault";
import { LockScreen } from "@/components/lock-screen";
import { AppShell } from "@/components/app-shell";
import { RecoveryWordsDialog } from "@/components/recovery-words-dialog";

export default function Home() {
  const { status } = useVault();
  const [recoveryWords, setRecoveryWords] = useState<string[] | null>(null);

  if (status !== "unlocked") {
    return <LockScreen onProvisioned={setRecoveryWords} />;
  }

  return (
    <>
      <AppShell />
      {recoveryWords && (
        <RecoveryWordsDialog
          words={recoveryWords}
          onClose={() => setRecoveryWords(null)}
        />
      )}
    </>
  );
}
