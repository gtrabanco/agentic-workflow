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
