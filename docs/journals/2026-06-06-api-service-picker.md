# 2026-06-06 - API Key service picker + BrandIcon refactor

The API Key "Service" field became a searchable picker backed by its own service registry with logos, mirroring the login platform picker. Brainstorm -> plan -> cook -> commit on `origin/dev` (`98f4448`, `2a96827`).

## What
- `components/brand-icon.tsx` (new): a shared `BrandIcon({ iconRef, label, size })` that renders a developer-icons SVG, or a local PNG/WEBP with a network-free monogram fallback. `EngineIcon` is now a thin wrapper over it (rule of three on the icon renderer - platform/engine/service). PlatformIcon keeps its own favicon variant.
- `lib/ui/services.ts` (new): a 40-service registry across 6 categories (AI, Cloud, Dev, Payments, Comms, Software), mirroring `platforms.ts`. Logos use bundled developer-icons where available (exact export names: ClaudeAI, VercelLight, GitHubLight, ReSend, NPM, DeepSeek, HuggingFace) and a local PNG at `/service/<id>.png` otherwise. `findServiceByName` matches a stored name back to a Service.
- `components/service-picker.tsx` (new): clone of the platform picker - trigger (logo + name), panel with search + category chips + grouped grid + a "Dịch vụ khác" custom free-text. Stores the picked service name.
- `components/service-icon.tsx` (new): known service -> BrandIcon; unknown/custom -> monogram.
- Wiring: `item-fields.ts` adds a `"service"` FieldKind (api_key.service); `item-form.tsx` renders ServicePicker; `item-card.tsx` + `filter-bar.tsx` show the service logo on the card + Service facet.

## Decisions
- DRY: extracted BrandIcon (3rd icon renderer) but did NOT generalize the whole picker (only 2 rich pickers - cloned platform-picker for services to limit risk to the working login flow).
- Stores the service NAME (not an id), so card/facet logo lookups go through `findServiceByName`.

## Verification
`pnpm typecheck` clean (all developer-icons import names resolve), `pnpm guard` clean, `pnpm build` passes (13 routes). No regression in login/database icons (BrandIcon refactor). Missing service PNGs fall back to a clean monogram (no broken-image icon).

## Follow-up (user)
~18 logo files still need to be dropped into `public/service/<id>.png` for the services not in developer-icons (gemini added; remaining: mistral, perplexity, grok, elevenlabs, cohere, soniox, linear, stripe, paypal, polar, paddle, twilio, sendgrid, mailgun, windows-11-pro, jetbrains, adobe). Until then they show a monogram.
