# 27 — pi-agentic-workflow · known-issues

Deferred items, each linked to (or destined for) an issue. Deferred work is **not**
implemented inline by this feature's phases.

## Deferred

- **Roadmap number 27 was taken on `main` — RESOLVED before P2.** Recorded when
  this branch sat behind `829ad18`, which had registered `27 ·
  pre-execution-plan-review` (issue #146) and `28 · bounded-implementation-
  discovery` (issue #149) as `idea · scheduled` rows, colliding with this unit's
  row 27 and making AC16 (`git diff main`) unpassable. The user chose to keep
  NN 27 for this unit and renumber the two unstarted rows to 28/29, and to rebase
  (`decisions.md`, 2026-08-29). Done: branch rebased onto `main` with the renumber
  applied in the roadmap-conflicted commits; the frozen `ACCEPTANCE.md` blob is
  unchanged (`22d3f33…`) because no path it names moved. Nothing left open.
- **Roadmap row 26 — RESOLVED after this branch's base.** Recorded at
  scaffold time when `main` had rows 25 → 27; `main` now carries
  `26 · staged-verification-contracts · done · [#145]` plus its folder. Kept here
  as history; the real residue is the numbering collision above.
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

## 2026-08-29 — live model-backed smoke of a routed command (P6)

**Issue**: every routing assertion in this unit runs against a Pi-shaped double
(`test/helpers/session.mjs`) plus the compiled entry, and `pi install ./` proves
the package manifest resolves inside a real Pi process. What was **not** observed
is a real routed turn end to end: `pi -p "/help"` during P6 returned
`Codex error: The usage limit has been reached`, so no live session was driven
through `/plan-feature` with a configured model.

**Status**: open — recorded as residual risk, not as a blocked acceptance criterion
(no acceptance criterion in `ACCEPTANCE.md` requires a live model turn; AC3/AC4/AC7
are defined against the extension contract).

**Mitigation**: `pi install ./` + `pi -e ./dist/extension/index.js` start clean;
the double replays Pi's `model_select` synchronously and returns Pi's own model
objects, so the shapes the router stores and restores are Pi's, not invented ones.

**First manual check for the reviewer**: after `pi install ./` in this package
folder, set a global `pi-agentic-workflow.json` route to a model you can actually
use, run `/workflow-status`, and confirm the session model returns when the turn
settles.
