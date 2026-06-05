/// <reference lib="webworker" />

// Service worker (Serwist). PACKAGING ONLY: precache the static build for an
// offline app shell + supply-chain pinning. It is compiled by @serwist/next in a
// worker context (excluded from the project tsconfig).

import { Serwist, NetworkFirst } from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig, RuntimeCaching } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

// SECURITY: never cache Supabase or any API response. Only top-level navigations
// (the static app shell HTML, which holds no secrets) use NetworkFirst; every
// other request - including Supabase auth/vault fetch/XHR - passes straight to the
// network (NetworkOnly) and is NEVER cached. Do NOT add an API caching rule here.
// INVARIANT: the shell HTML must stay user-agnostic - never SSR vault/user data
// into a navigation response, or this NetworkFirst rule would cache it.
const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ request }) => request.mode === "navigate",
    handler: new NetworkFirst({ cacheName: "pages", networkTimeoutSeconds: 3 }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false, // wait for the user to confirm (see components/pwa-update.tsx)
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
});

// The update prompt sends this to activate a waiting SW on user confirmation.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

serwist.addEventListeners();
