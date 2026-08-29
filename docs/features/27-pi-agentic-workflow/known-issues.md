# 27 — pi-agentic-workflow · known-issues

Deferred items, each linked to (or destined for) an issue. Deferred work is **not**
implemented inline by this feature's phases.

## Deferred

- **Roadmap number 27 is taken on `main`.** This branch was cut before
  `829ad18`, which registered `27 · pre-execution-plan-review` (issue #146) and
  `28 · bounded-implementation-discovery` (issue #149) as `idea · scheduled`
  rows. Our unit's row 27 (`pi-agentic-workflow`) therefore collides with `main`
  and the branch is 51 files / ~14k lines behind it (feature 26, PR #145).
  Consequences if left alone: the merge duplicates NN 27, the roadmap's
  numbering invariant breaks, and `git diff main --stat` (AC16) can never be
  clean. Resolution is an explicit user decision — renumber this unit to the next
  free NN (`29-pi-agentic-workflow`, branch + folder + SPEC + roadmap row) or
  renumber the two unstarted `idea · scheduled` rows — because the frozen
  `ACCEPTANCE.md` names the `27-` paths in AC4/AC16 and only a user-approved
  amendment may change it. Not fixable silently inside a phase.
- **Missing roadmap row 26 — RESOLVED after this branch's base.** Recorded at
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
