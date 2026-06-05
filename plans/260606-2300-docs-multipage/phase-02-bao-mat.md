---
phase: 2
title: "Bảo mật page"
status: pending
priority: P2
effort: "1.5-2h"
dependencies: [1]
---

# Phase 2: Bảo mật page

## Overview
The security page: encryption model, the email-as-salt identity, server trust
boundary, and the honest threat model.

## Requirements
- Functional: accurately explains the crypto + identity + threats.
- Non-functional: reuse doc-diagram for the envelope flow; < 200 lines (split into
  local sub-components if long).

## Architecture
- `app/docs/bao-mat/page.tsx`:
  - Envelope encryption: a random DEK encrypts every item; the DEK is wrapped by
    KEK_master (Argon2id from the master) AND KEK_recovery (from the 24-word key).
    AES-256-GCM for data, Argon2id (64MiB/3/1) for KDF. Reuse/adapt the
    `storage-flow.tsx` diagram (Flow/FlowNode/Arrow/Branch/DiagramFrame/Legend).
  - Identity (email-as-salt): `authSecret = Argon2id(master, salt=SHA-256(email))`
    is the Supabase login password; the email is entered at first login and kept in
    localStorage (NOT an env var); it solves the chicken-and-egg of cloud ZK auth.
    Email is not a secret.
  - Server boundary: Supabase stores only ciphertext; RLS (`auth.uid() = user_id`);
    `type` + `favorite` are the only plaintext columns.
  - Threat model (honest Callout warn): a leaked master password = full compromise
    (it derives both authSecret and the master KEK); biometric + TOTP are convenience,
    NOT extra factors protecting the vault; the recovery key is a SECOND root (losing
    either master or recovery key + backup is unrecoverable by design).

## Related Code Files
- Create: `app/docs/bao-mat/page.tsx`
- Reuse/move: content from `components/docs/sections/overview.tsx` +
  `storage-flow.tsx`
- Reuse: `doc-ui`, `doc-diagram`

## Implementation Steps
1. Port the still-accurate ZK/envelope content from overview + storage-flow.
2. Add the email-as-salt identity subsection.
3. Add the honest threat-model Callout.
4. Adapt the diagram.

## Success Criteria
- [ ] Crypto, identity, server boundary, and threat model all present + accurate.
- [ ] No stale facts (email is runtime, not env).

## Risk Assessment
- Keep the threat model honest (don't oversell biometric/TOTP as security factors).
