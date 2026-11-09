# External verify — unit 107 (mechanization-inventory)

EXTERNAL VERIFY — 2026-11-09 — base: 1fa39fe137e1265e5fcb239bfd8e24803e99a112 · head: bb00d341
Blockers: 2
- B1 — docs/features/107-mechanization-inventory/SPEC.md:292 — stray corrupted table
  fragment (` docs/LOGS.md\` matches 1 | the appended block | verified`) inside the
  `### Obligations` table, a truncated duplicate of O14's row introduced by commit
  `77db19e8` (git log -L confirms the line is an addition of that commit; absent at
  base, where the file does not exist). Reproducer: `sed -n '292p' …/SPEC.md`.
  Smallest action: delete line 292.
- B2 — docs/features/107-mechanization-inventory/SPEC.md:283 (O6) and :187 (AC7) —
  the S6 validator `git diff --name-only main -- | rg -v '^(docs/features/107-…|…)'
  | wc -l` observes **4**, not the recorded `matches 0`: `.changeset/408-mechanization-inventory.md`,
  `scripts/log-immutability.mjs`, `scripts/log-immutability.test.mjs`,
  `skills/audit-docs/SKILL.md` — all four authorized by S16/P6/P7, but the row is
  still marked `verified` with an outcome that no longer reproduces. Same class,
  second instance: SPEC.md:290 (O13) states "`G1` records the root suite's 62 pass /
  16 fail" while the recorded G1 line says "96 suites: 80 pass, 16 fail". Smallest
  action: amend O6/AC7 to carve the S16-authorized paths (or record the S16
  exception in the row) and correct O13's 62→80; the substantive outcomes hold.
Advisories: 2
- docs-generate --check reports "degraded (no `Docs site` block in AGENTS.md)" —
  pre-existing at base, not this unit's surface.
- Root-suite reds (16 suites) are the sandbox's pre-existing fixture/forge failures,
  recorded as reproduced at base by G2/G4; not re-run here, not attributed to this
  change. The changeset lint's warn on the pre-existing `feat-449…` changeset file
  is likewise pre-existing.
Sibling sweep: clean — the old check-13 text survives only as the SPEC's own
historical record of the defect (`## Known pre-existing issues`) and in the
`docs/features/01-generate-docs/` history that originally created the check; no
surface asserts the old truth as current.
Completeness: S1–S16 all resolve to tasks carrying `(Implements: S#)` whose
validators re-ran green here (AC1–AC5, AC7–AC18 executed; AC6/AC12/AC14/AC16
partially manual — owner verdict and recorded G1); all 18 obligation rows
substantively hold, receipts B1/B2 are ledger-text defects, not dropped work.
Spot check: `bun scripts/log-immutability.mjs --base main` → exit 0, "0 violations ·
base 1fa39fe1 · range 11 commits" — match with E13.
Verdict: NEEDS-DECISION (2 open blockers — B1 residue line, B2 stale validator text)

Receipt note: this block was written by the external-verify session into this file
only (no commit, no push, no forge mutation; the two mutation-capable surfaces the
change touches — `log-immutability.mjs`, the roadmap emitter — were not executed
against the live tree by the verifier; `log-immutability` ran in its check-only
mode). Carried as commit `19391ef4` (`chore(review): external verification`), so
the verdict is bound to head `bb00d341` and this file is the unit's committed
evidence carrier.

## Correction recheck — 2026-11-09 (delta, blockers only)

Batch: `fix(107)` — the two blockers above, nothing else.

- **B1 — closed.** `SPEC.md`'s `### Obligations` table no longer carries the
  stray fragment; the reproducer (`awk` over the table for rows that are not
  `| O<n> |`) reports 0. History preserved: the deleted line was a truncated copy
  of `O14`'s last cell, added by `77db19e8`.
- **B2 — closed.** `AC7`/`O6`'s validator is anchored and names S16's four
  authorized paths exactly (`0` now instead of `4`); the negative control still
  reports a path outside the carve, so the check still fails closed. `O13`'s
  quoted count now matches `G1` (`80 pass / 16 fail`).
- Re-ran the touched rows' validators only: `AC7`/`O6` → `0`, `O13` → quoted
  count equals `G1`, `bun scripts/docs-generate.mjs --check` → PASS,
  `bun scripts/roadmap-settle.mjs` → PASS (violations 0),
  `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify` → `VERIFY PASS`,
  `bun scripts/phase-lint.mjs` → PASS, `bun scripts/log-immutability.mjs --base
  main` → 0 violations.

Verdict after the batch: both blockers closed, no new finding carried by the
batch. The final verdict stays with the external verifier.

## Delivered head and the two findings the batch could not close

Delivered: `94316d78` (the repair) and `e16d5433` (the journal append, by the
aggregator identity), both on `feat-408-mechanization-inventory`.

Gate at `e16d5433`, all foreground:

```text
bun scripts/local-gate.mjs                   → PASS · 17 step(s)
bun packages/agentic-workflow/bin/agentic-workflow.mjs verify …/SPEC.md → VERIFY PASS · violations []
bun scripts/phase-lint.mjs …/SPEC.md         → PASS
bun scripts/docs-generate.mjs --check        → PASS · 0 missing · 0 stale · 0 orphaned
bun scripts/roadmap-settle.mjs               → PASS · violations 0
bun scripts/log-immutability.mjs --base main → 0 violations · 14 commits
bun scripts/skill-lint.mjs --skill audit-docs→ 0 findings
bun scripts/check-skill-context.mjs          → PASS · 29 skills
bun scripts/lint-changeset.mjs               → PASS
AC1…AC13, AC16…AC19                           → every count matches the frozen value
```

**N1 — `docs/LOGS.md` carries two `main` session blocks.** A concurrent
aggregation ran on this branch's carrier mid-batch and appended the
`2026-11-09T15:04:20Z` and `15:06:33Z` `main` entries, whose fragments are
still pending here and on `main` (2 each); merging this branch would then
duplicate them. The repair is a truncation of `docs/LOGS.md`, which the
pre-push gate judges against the push range and `e16d5433` is already
published — so it needs a history rewrite, which only the owner authorizes.

**N2 — AC15's frozen count observes 3, not 1.** Two entries beyond the original
`15:39:01Z` one: this batch's (`17:31:14Z`) and another concurrent session's
`17:31:52Z` record of the same unit. The criterion's intent (the entry is in the
journal, not pending; 0 fragments) holds and the fragment count is 0, but its
literal `matches 1` no longer reproduces. Changing an acceptance criterion to
fit the tree is a test change — the owner's call, not this batch's.
