---
phase: 3
title: "Tính năng page"
status: pending
priority: P2
effort: "2-3h"
dependencies: [2]
---

# Phase 3: Tính năng page

## Overview
The features page: the big new content covering everything shipped since v1.

## Requirements
- Functional: each feature documented accurately (cross-checked against code).
- Non-functional: reuse doc-ui; keep < 200 lines by splitting into local
  sub-components (one per feature group) if needed.

## Architecture
- `app/docs/tinh-nang/page.tsx` (compose local sub-sections):
  - **Loại item (6):** login, wallet, ssh_key, secure_note, api_key, and **database**
    (engine picker: Supabase/PostgreSQL/MySQL/MariaDB/MongoDB/Redis/SQL Server/SQLite;
    fields host/port/database/username/password). Note adding a new type is mostly
    client-side; the database type needed a one-line CHECK-constraint migration (0002).
  - **2FA / TOTP:** paste a base32 secret or an `otpauth://` URI into a login's 2FA
    field; the vault shows the live 6-digit code with a countdown.
  - **Quét QR:** scan a 2FA QR with the live camera OR pick an image; decoded
    entirely client-side (jsQR), needs HTTPS for the camera.
  - **Mở khóa sinh trắc (biometric):** optional, per-device WebAuthn PRF; master is
    always the fallback; the wrapped key lives in IndexedDB; changing master clears it.
  - **Kiểm tra bảo mật (password health):** offline scan for reused / weak (zxcvbn,
    lazy) / old passwords; an opt-in HIBP breach check (k-anonymity, off by default).
  - **Tags + lọc:** multi-tag filtering with an Any/All toggle; tags are independent
    of the type filter.
  - **Tìm kiếm, auto-lock, clipboard:** fuzzy search; auto-lock + lock-on-hidden;
    clipboard auto-clear (best-effort, also clears when you return to the tab).
  - **Favicon (opt-in):** off by default (would leak the domain to a third party).
  - **PWA:** installable app + offline app shell + a "new version" update prompt;
    Supabase data is never cached.

## Related Code Files
- Create: `app/docs/tinh-nang/page.tsx` (+ local sub-components if split)
- Reuse: `doc-ui`
- Cross-check: `lib/ui/item-fields.ts`, `db-engines.ts`, `lib/ui/totp.ts`,
  `qr-decode.ts`, `lib/vault/{webauthn,biometric-actions,password-health}.ts`,
  `app/sw.ts`, `settings.ts`

## Implementation Steps
1. Write each feature sub-section, verifying details against the listed files.
2. Group into the page (split files if > 200 lines).

## Success Criteria
- [ ] All listed features documented + accurate (6 item types, biometric, TOTP, QR,
  health, tags, PWA, etc.).
- [ ] < 200 lines/file; reuses primitives.

## Risk Assessment
- Highest stale-fact risk - verify every claim (e.g. HIBP is opt-in; biometric is
  optional + master fallback; favicons off by default).
