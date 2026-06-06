# Changelog

All notable changes to ZKVault. Format based on [Keep a Changelog](https://keepachangelog.com/), versioning per [Semantic Versioning](https://semver.org/).

Release anchors are git tags (`vX.Y.Z`). To see what changed since a release: `git log v0.3.0..HEAD --oneline`.

## [0.3.0] - 2026-06-06

OAuth logins, an API-key service picker, and a unified brand-logo system.

### Added
- **Login OAuth / Credential mode** - a method toggle on Login items. OAuth mode adds a provider picker (with logos: Google, GitHub, Apple, Microsoft, Facebook, X, Discord, GitLab, LinkedIn, Slack) and an account field, and hides the password / 2FA fields.
- **API Key service picker** - the Service field is now a searchable picker grouped by category (AI, Cloud, Dev, Payments, Comms, Software) with brand logos.
- **Brand logos in the filter bar** - the platform / engine / service facet dropdowns now show logos.
- **License + security policy** - MIT `LICENSE.md`, a `SECURITY.md` (private vulnerability reporting), and this `CHANGELOG.md`.

### Changed
- **Unified brand logos** - all local logos live under `public/brand/` behind shared `svg/png/webp` helpers and a single `BrandIcon` renderer, reused by the platform, engine, and service registries.
- Switched the package manager to **pnpm** (lockfile `pnpm-lock.yaml`, pinned via `packageManager`).

### Fixed
- A filter toggle left on in one category (e.g. "Có 2FA") no longer empties another category where that toggle is hidden.
- Select dropdown z-index (the listbox could render behind other elements).
- A wrong brand name.

### Security
- Bumped vitest to 4.x to clear a critical advisory (GHSA-5xrq-8626-4rwp; a dev-only tool, not shipped).

## [0.2.0] - 2026-06-06

The first feature update since v0.1.0: a built-in password generator, recovery-key rotation, a backup reminder, and a context-aware filter bar, plus custom UI controls that match the dark theme.

### Added
- **Password generator + strength meter** - generate a strong random password (Web Crypto) in the item form, with a live zxcvbn strength bar on password fields.
- **Rotate recovery key** - regenerate the 24-word recovery key from Settings -> Account without changing the master password; the DEK is re-wrapped under a fresh recovery key and the old one stops working.
- **Backup reminder** - the Backup tab shows the last-export age and warns when a backup is stale (over 30 days or never).
- **Main-screen filter bar** - context-aware per-type facets (Login -> Platform, Wallet -> Network, SSH -> Host, API Key -> Service, Database -> Engine), a Sort control, and quick Favorites / has-2FA toggles.
- **Skeleton loading** - placeholder cards while items decrypt, removing the brief empty flash on unlock.

### Changed
- Custom themed checkboxes, toggle switches, and dropdowns replace the OS-default widgets.
- In-app docs reorganized into User / Developer sections with getting-started + how-to.
- Concurrency-safe key re-wrapping: change-master and rotate-recovery each write only their own KDF salt.
- Login platform list cleanup (added a game category; folded Google into popular).

### Fixed
- Autofill disabled app-wide (lock screen, search, every input).
- Lock screen no longer flips to the remembered-email label while typing a new email.

## [0.1.0] - First public release

Zero-knowledge personal credential vault (Next.js + Supabase). Client-side Argon2id + AES-256-GCM envelope encryption; six item types incl. database; TOTP 2FA + QR scan; biometric unlock (WebAuthn); password health (+ opt-in HIBP); tags with multi-tag filtering; fuzzy search; auto-lock; clipboard auto-clear; encrypted .vault export/import; installable PWA; in-app docs.

> Published as a GitHub release without a git tag, so there is no `v0.1.0` anchor to diff against; v0.2.0 onward is tagged.
