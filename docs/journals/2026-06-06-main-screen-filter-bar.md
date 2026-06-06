# 2026-06-06 - Main-screen context-aware filter bar

Added an in-screen filter bar that adapts to the selected category, on top of the
existing sidebar (type/tags) + fuzzy search. Brainstorm -> plan -> cook -> commit on
`origin/dev` (`f92888c`).

## What
- `lib/ui/item-filters.ts` (new): `FACET_BY_TYPE` registry - each facetable type maps
  to a `{ label, value(item), optionLabel }`: Login -> platform (findPlatform name or
  bare domain), Wallet -> network, SSH -> host, API Key -> service, Database -> engine
  (engineLabel). `facetOptions` derives the distinct present values (like tags, so no
  blank options). `SORT_OPTIONS` + `sortItems` (recently updated / added / name A-Z,
  using the existing createdAt/updatedAt). `hasTotp` for the 2FA toggle.
- `components/filter-bar.tsx` (new): renders the category's facet Select (only when
  there is a facet AND options exist), the generic Sort Select, a Favorites toggle
  (hidden in the favorites category), and a has-2FA toggle (Login only). Reuses the
  custom Select; responsive flex-wrap.
- `components/app-shell.tsx`: facet/sort/favOnly/twoFAOnly state; a `categoryItems`
  memo (the facet options derive from the category-scoped list); the `filtered` memo
  now composes category -> tags -> favOnly -> 2FA -> facet -> search -> sort; the facet
  resets on category change.

## Decisions (YAGNI)
- The filter bar owns STRUCTURED per-type fields + sort + quick toggles; it does NOT
  duplicate the sidebar (type/tags/favorites stay there). secure_note has no facet.
- Low ROI at ~7 items today but scales to many logins; kept lightweight.

## Verification
`tsc` clean, `guard` clean, `build` passes (13 routes). No em-dashes. Vietnamese labels
left for the user to proofread.
