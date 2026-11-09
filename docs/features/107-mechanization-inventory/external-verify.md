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

EXTERNAL VERIFY — 2026-11-09 — base: 1fa39fe137e1265e5fcb239bfd8e24803e99a112 · head: fe07d52c (delta over bb00d341)
Delta basis: corrections landed since the last receipt (`19391ef4`, `94316d78`, `e16d5433`, `fe07d52c`) →
re-verified B1/B2 + the delta diff (`bb00d341..fe07d52c`: docs only — `docs/LOGS.md`,
`docs/features/107-mechanization-inventory/SPEC.md`, `external-verify.md`) only, then the spot check.
Blockers: 1
- B3 — docs/features/107-mechanization-inventory/SPEC.md:239 (P4 validator), :291 (O14) and AC15 —
  the frozen criterion `rg -c '^## .*feat-408-mechanization-inventory' docs/LOGS.md` `matches 1`
  observes **3** (`15:39:01Z`, `17:31:14Z`, `17:31:52Z`); it observed 1 at the last verified head
  `bb00d341`. One extra entry is the delta's own (`e16d5433`), one a concurrent session's —
  delta-caused, reproduces here, disclosed by the batch as N2 with the criterion correctly left
  unedited (a test is never edited to pass). Same class as the closed B2: a `verified` row whose
  stated outcome no longer reproduces. Smallest action: owner amends the frozen count (or records
  the concurrent-session disposition) — owner-only, the batch refused it correctly.
Advisories: 1
- N1 (merge-order, not base-caused) — `docs/LOGS.md` carries two `main` session blocks
  (`15:04:20Z`, `15:06:33Z`) whose fragments are still pending here and on `main` (2 fragments in
  `.agentic-workflow/journal/` confirmed); merging this branch as-is duplicates them. The gate is
  green on the current range, so not a blocker here; the repair is a `docs/LOGS.md` truncation
  judged against an already-published head → history rewrite, owner-only. Re-trigger: any merge of
  this branch before the fragments are resolved.
Sibling sweep: clean apart from the blocker's own family — the closed B2's old text (`62 pass`, the
  unanchored S6 carve) survives only as the historical record (SPEC D5, the receipt); the stale
  `matches 1` copies are exactly AC15/O14/P4 (named in B3). `docs/fix/468`'s `62 pass` is an
  unrelated unit's count.
Completeness: S1–S16 remain resolved (full-verify receipts stand; delta touched ledger text only);
  open id: O14/AC15 validator (B3). B1 re-checked closed (0 stray rows, header excluded);
  B2 re-checked closed (AC7 → 0, negative control → 5 fails closed, O13's 80 = G1's 80).
Spot check: `bun scripts/log-immutability.mjs --base main` → exit 0, `0 violations · base 1fa39fe1 ·
  range 15 commits` — match with the reported verdict (range grew 14→15 by the docs-only `fe07d52c`,
  expected).
Verdict: NEEDS-DECISION (1 open blocker — B3, owner call on the frozen AC15/O14/P4 count)
Read-only compliance: no commit, no push, no branch, no forge mutation, no other file edit; the
delta introduces no mutation-capable surface (docs only) and none was executed against the live tree
beyond the check-only `log-immutability` run above.
