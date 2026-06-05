---
title: Zero-Knowledge Personal Credential Vault — Brainstorm Summary
date: 2026-06-05
status: approved
stack: Next.js (App Router), Supabase (Postgres + Auth + RLS), Tailwind v4 + shadcn
design_system: ../../DESIGN.md (Supabase-style, Electric Azure)
---

# ZK Credential Vault — Brainstorm Summary

## 1. Problem Statement
Personal, single-user vault lưu mọi credential: social login/password, private key wallet, seed phrase, SSH key, cụm từ bảo mật, API key. Yêu cầu: bảo mật tối đa, login không cần phức tạp, UX gọn — phân bổ rõ ràng, dễ tìm kiếm & lưu trữ. Stack cố định: Next.js + Supabase.

## 2. Critical Correction (đã thống nhất)
- **Hash ≠ storage.** Hash 1 chiều → không lấy lại được private key. Vault cần **encryption 2 chiều (AES-256-GCM)**.
- Hash (Argon2id) chỉ dùng làm **KDF**: master password → key. Không dùng "hash để lưu data".

## 3. Approaches Evaluated

| Tiêu chí | Zero-Knowledge E2E ✅ CHỌN | Server-side encryption |
|---|---|---|
| Encrypt/decrypt | Browser (client) | Next.js API/server |
| Supabase thấy | Chỉ ciphertext | Plaintext / giữ key |
| DB/server breach | Vô dụng cho attacker | Mất sạch |
| Phù hợp wallet/seed | Có | Không |

Key derivation: **Envelope (key-wrapping)** ✅ thay vì derive-direct — cho phép đổi master password không re-encrypt vault + làm recovery key khả thi.

Auth: **1 master password dual-derive** ✅ (salt_auth → Supabase login; salt_master → KEK). Recovery: **recovery key (wrap DEK lần 2) + encrypted export** ✅.

## 4. Final Architecture

### Crypto (envelope)
```
Master Password
 ├─ Argon2id(salt_auth)   → authSecret → Supabase Auth password (RLS gate)
 └─ Argon2id(salt_master) → KEK_master (RAM only, never leaves browser)
DEK = CSPRNG 256-bit (encrypts ALL items)
 ├─ wrapped_DEK_master   = AES-GCM(DEK, KEK_master)
 └─ wrapped_DEK_recovery = AES-GCM(DEK, KEK_recovery)   ; KEK_recovery = Argon2id(recoveryKey, salt_recovery)
Item: encrypted_data = AES-256-GCM(JSON, DEK, iv)
```
- Đổi master = re-wrap DEK. Recovery = recoveryKey → unwrap DEK.
- Libs: `hash-wasm` (Argon2id), native Web Crypto (AES-GCM), recovery key BIP39-style.

### Zero-Knowledge discipline (BẮT BUỘC)
Mọi encrypt/decrypt + đọc/ghi vault data = **client-side**. KHÔNG đưa plaintext qua Server Action/API Route. DEK chỉ ở RAM khi unlocked. Supabase gọi trực tiếp từ browser (RLS bảo vệ).

### Data model (Supabase + RLS `user_id = auth.uid()`)
- `vault_config` (1/user): kdf_params (algo,mem,iter,salt_auth,salt_master,salt_recovery), wrapped_dek_master, wrapped_dek_recovery, timestamps.
- `vault_items`: id, user_id, **type** (plaintext: filter/đếm), **favorite** (plaintext), encrypted_data (ciphertext mọi field nhạy cảm), iv, timestamps.
- Tradeoff: chỉ `type`+`favorite` plaintext (rò rỉ không đáng kể) → UX sidebar nhanh. Title/username/password/tags/notes mã hóa hết.

### Item types (JSON trong encrypted_data) — 5 loại
- **login**: title, username, password, url, totp_secret?, notes, tags[]
- **wallet**: title, network, address, private_key, seed_phrase, derivation_path?, notes, tags[]
- **ssh_key**: title, host?, username?, private_key, public_key, passphrase?, notes, tags[]
- **secure_note**: title, content, tags[]  (dùng cho cụm từ bảo mật)
- **api_key**: title, service, key, secret?, notes, tags[]

### Search
Decrypt-all-in-memory khi unlock → `fuse.js` fuzzy trên title/username/url/tags/notes. Tức thì cho <1000 items, giữ zero-knowledge.

### UX/UI (`/design-taste-frontend` + DESIGN.md azure)
- Lock screen: centered, master password, azure CTA.
- Main: sidebar categories (All/Logins/Wallets/SSH/Notes/API/Favorites)+tags+counts · top search instant + "+Add" azure pill · grid Feature Cards (#121212/#2e2e2e/16px, icon azure) masked secondary · detail drawer (reveal/copy auto-clear/edit) · Add-Edit modal form động theo type.
- Settings: auto-lock timeout, đổi master, recovery key, export .vault.

## 5. Scope

### v1 (MVP)
Crypto core · Supabase schema+RLS+auth dual-derive · lock/unlock + auto-lock · CRUD 5 types · sidebar+instant search · clipboard auto-clear · recovery key + encrypted export · UI (DESIGN.md azure).

### v1.5
WebAuthn/biometric unlock (PRF + fallback master) · TOTP generator (`otpauth`).

### v2
Password health check (offline) · PWA/extension để giảm supply-chain risk.

## 6. Risks & Mitigations
- **Web supply-chain (điểm yếu lớn nhất):** mỗi load tải lại crypto JS từ server → server/dep compromise có thể đánh cắp master password lúc gõ. ZK KHÔNG chống được. Mitigate: CSP nghiêm ngặt, SRI, pin/tối thiểu deps, self-host, v2 PWA/extension cache.
- **Mất master password = mất vault** (đặc tính ZK). Mitigate: recovery key (cất két) + encrypted export định kỳ.
- **Crypto core dễ sai chết người.** Mitigate: unit test kỹ Phase 1 (round-trip encrypt/decrypt, wrap/unwrap, recovery path) trước khi build trên.
- **Lỡ tay đưa plaintext qua server.** Mitigate: review nghiêm — vault data chỉ client-side; CI lint cấm import server cho crypto module.
- **Device compromise (keylogger/malware):** ngoài tầm kiểm soát của app — chấp nhận, ghi rõ trong threat model.
- **WebAuthn PRF support lệch trình duyệt:** luôn fallback master password.

## 7. Success Criteria
- Supabase chỉ chứa ciphertext (verify: dump DB không lộ field nào đọc được).
- Round-trip mọi type chính xác; recovery key khôi phục được DEK.
- Đổi master không cần re-encrypt items.
- Search instant; auto-lock xóa DEK khỏi RAM; clipboard tự wipe.
- Không request nào gửi plaintext/master/DEK lên network (verify: network tab + server logs sạch).

## 8. Build Phases (cho /ck:plan)
1. Crypto core (KDF, DEK envelope, AES-GCM, recovery key) + unit tests.
2. Supabase: schema, RLS, auth dual-derive, vault_config provisioning.
3. Lock/unlock + auto-lock + session key (RAM) management.
4. Vault CRUD (5 types) + encrypt/decrypt pipeline.
5. UI (/design-taste-frontend + DESIGN.md): sidebar, search, cards, drawer, modal.
6. Hardening: clipboard clear, encrypted export, recovery flow.
(v1.5: WebAuthn PRF + TOTP.)
