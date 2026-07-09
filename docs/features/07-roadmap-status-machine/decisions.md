# 07 — roadmap-status-machine · decisions

Architecture/scope decisions + open questions. Product decisions live in the
SPEC's Product half; this file records engineering decisions and their rationale.

## Decided

- **Roadmap status is the primary gate signal; SPEC `## Design status` marker is
  retained as the SPEC-local record + legacy fallback.** Migrates the U3 interim
  (SPEC-marker gate) to the roadmap status, as #13's SPEC deferred to U4. Rationale:
  one status vocabulary all consumers read; no SPEC body-shape change.

- **Execution requires `planned` uniformly (resolves #14's "or `defined` for
  single-pass?" open question).** `execute-phase` requires `planned` for every
  mode, XS/S single-pass included, because `plan-feature-scaffold` runs for XS/S
  (SPEC-only) and lands the row at `planned`. A `defined` unit always redirects to
  `/plan-feature`. Rationale: one uniform executable state, no special case where
  `defined` is sometimes runnable.

- **One owner per status transition (no double-writers).** `idea→defined`:
  design-feature / plan-feature-from-issue; `defined→planned`:
  plan-feature-scaffold; `planned→in-progress`: execute-phase P1; `→done`: PR-open
  step. Rationale: status can never be inferred or written twice → no drift.

- **`workflow-status` adds one additive envelope field (`design_candidates`), not
  a schema overhaul.** Keeps the change independent of U7 (envelope removal) and
  preserves all existing keys.

- **Founding writes not-yet-scaffolded features as `idea` rows; the autopilot
  promotes them JIT.** `ship-roadmap` does not fake `planned` on rows that have no
  artifacts yet; the single substrate/init unit founding scaffolds immediately
  stays a normal `planned` unit. Rationale: status must match the artifacts it
  represents, even under autopilot.

- **`ship-roadmap` JIT design is derive-only from `SHIP_DECISIONS.md`; anything
  not derivable → `NEEDS_INPUT` + park.** Preserves the "no further questions after
  the interview" contract with no autopilot exemption from the design gate.

- **Legacy migration is documentation, not automation, here.** The `MIGRATION.md`
  equivalence rule keeps pre-U4 roadmaps working; the automated migrator is U10.

## Open questions

- None blocking. (The composition-tier boundary for `ship-roadmap`'s JIT design is
  already governed by its documented ≥-tier founding rule — no new decision needed.)
