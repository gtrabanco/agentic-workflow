# 27 — pi-agentic-workflow · known-issues

Deferred items, each linked to (or destined for) an issue. Deferred work is **not**
implemented inline by this feature's phases.

## Deferred

- **Missing roadmap row 26.** `staged-verification-contracts` shipped as
  [PR #145](https://github.com/gtrabanco/agentic-workflow/pull/145) (merged) but
  has **no row in `docs/features/ROADMAP.md`** — rows jump 25 → 27. This
  feature's SPEC references "feature 26" and correctly does not depend on it
  (see Dependencies: "not required here"), so it is not a blocker here — but the
  roadmap's numbering continuity is broken for the status machine and
  `workflow-status` consumers. Destined for `/audit-docs` (cross-document
  drift); the fix belongs to a docs-only unit, never to this package PR.
- **pi.dev gallery assets.** Explicit out of scope (product half, expectation
  row 20). If the package is listed on the Pi gallery later, video/image assets
  become a small follow-up unit. No issue until a listing is actually attempted.
- **Grouped routing profiles** (planning/execution/review buckets). Explicit
  out of scope (product half). If operators ask for bucket-level defaults after
  using per-command overrides, file a NEW FEATURE issue; the config schema's
  `commands` map is the natural extension point.
- **Config migration into Pi `settings.json`.** Deferred in the SPEC's
  `### Deferred decisions` row D1 — re-open only if Pi documents a stable
  namespaced plugin-settings field. Tracked here so the trigger outlives this
  feature folder.
