# 2026-06-06 - Login OAuth vs Credential mode

Login items got a Credential | OAuth method toggle. Brainstorm -> plan -> cook -> commit on `origin/dev` (`267f75d`).

## What
- A segmented `auth_method` toggle (Mật khẩu | OAuth) on Login items. OAuth mode keeps Platform/URL and adds an OAuth provider Select (with logos) + an account (email/username) field, while hiding password + totp.
- Conditional fields via a new `FieldDef.visibleWhen?(data)` predicate, honored by BOTH the add/edit form and the detail drawer (FIELDS_BY_TYPE already drives both, so they stay in sync). The drawer also skips the `auth_method` control kind.
- `lib/ui/oauth-providers.ts` (new): a small provider registry (Google, GitHub, Apple, Microsoft, Facebook, X, Discord, GitLab, LinkedIn, Slack) reusing the shared `svg()` brand helper + BrandIcon. The provider field renders the generic `<Select>` (which already supports a per-option icon).
- `cardSubtitle(login)` + the drawer's provider-logo row reflect oauth.

## Key decision / gotcha
- `loginSchema` MUST list the new fields (auth_method/oauth_provider/oauth_account) - `parseItemData` runs `schema.parse()` which STRIPS unknown keys, so without the schema additions the new fields would silently vanish on save. This was the #1 risk and is handled.
- `auth_method` defaults to credential when undefined -> all existing logins are unaffected (backward compat).
- Switching method leaves the other mode's values in the encrypted data (hidden, unused) - acceptable.

## Verification
`pnpm typecheck` clean, `pnpm guard` clean, `pnpm build` passes (13 routes), no em-dashes. Manual save/reopen persistence + the toggle UX left for the user to confirm on `pnpm dev`.
