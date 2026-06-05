"use client";

// Hook exposing biometric availability + actions. Support/enrolled are resolved
// in an effect (async + browser-only), so they default to false during SSR/first
// render and never cause a hydration mismatch.

import { useCallback, useEffect, useState } from "react";
import { isBiometricSupported } from "./webauthn";
import {
  enableBiometric,
  unlockWithBiometric,
  disableBiometric,
  hasBiometric,
} from "./biometric-actions";

export interface UseBiometric {
  supported: boolean;
  enrolled: boolean;
  ready: boolean; // initial async check finished
  refresh: () => Promise<void>;
  enable: (masterPassword: string) => Promise<void>;
  unlock: () => Promise<void>;
  disable: () => Promise<void>;
}

export function useBiometric(): UseBiometric {
  const [supported, setSupported] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const [sup, enr] = await Promise.all([
      isBiometricSupported(),
      hasBiometric(),
    ]);
    setSupported(sup);
    setEnrolled(enr);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    supported,
    enrolled,
    ready,
    refresh,
    enable: enableBiometric,
    unlock: unlockWithBiometric,
    disable: disableBiometric,
  };
}
