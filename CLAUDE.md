# CLAUDE.md

Project guidance for AI assistants. ZKVault is a single-user, zero-knowledge credential vault (Next.js App Router + Supabase, dark-only, Tailwind v4). See `README.md` (dev reference), the in-app `/docs`, and `docs/journals/` for history.

## Release process

Follow this order so the tagged commit always carries the correct version + changelog (the v0.2.0 release tagged a commit that still said `0.1.0` because the merge happened before the version bump - do not repeat that).

1. **On `dev`, prepare the release commit:** Bump `package.json` `version` to the new `X.Y.Z`; update `CHANGELOG.md` with a `## [X.Y.Z] - YYYY-MM-DD` section (Added / Changed / Fixed) covering everything since the previous tag (get the list with `git log <prev-tag>..HEAD --oneline`, e.g. `git log v0.2.0..HEAD --oneline`); commit `chore(release): vX.Y.Z` and push to `dev`.
2. **Merge `dev` -> `main`** (PR). The merge commit on `main` is what gets released.
3. **Publish the GitHub release** with target `main`, creating tag `vX.Y.Z` (so the tag points at the merge commit that already has the right version + changelog). Mark "Set as a pre-release" while still on `0.x`. No binaries (web app).
4. **Diff between releases** with `git log vA.B.C..vX.Y.Z --oneline` (or `git log vX.Y.Z..origin/dev` to see unreleased work).

Notes:
- Always create the git **tag** (releases are the diff anchors). v0.1.0 had no tag, so it cannot be diffed against.
- Versioning is SemVer; the app is `0.x` (pre-1.0), so a feature batch bumps the MINOR.
- Release notes / titles are written in English; the in-app `/docs` copy is Vietnamese.

## Conventions

- Conventional commits, no AI references in messages.
- Never commit secrets / `.env.local` (gitignored).
- Before commit/push: `npx tsc --noEmit`, `npm run guard`, `npm test`, `npm run build` must pass. No em-dashes in app/UI/docs copy (use hyphens).
- Crypto/vault layer is client-only (enforced by `npm run guard`); never import it into a server context.
- **Markdown:** do NOT hard-wrap text inside a paragraph or list item - write each paragraph/bullet as one continuous line and let the editor soft-wrap. Blank lines separate paragraphs as usual. (Applies to all `.md`: CHANGELOG, journals, docs, plans.)
