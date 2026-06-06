# Changelog

All notable changes to ZKVault. Format based on [Keep a Changelog](https://keepachangelog.com/), versioning per [Semantic Versioning](https://semver.org/).

Release anchors are git tags (`vX.Y.Z`). To see what changed since a release: `git log v0.2.0..HEAD --oneline`.

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
