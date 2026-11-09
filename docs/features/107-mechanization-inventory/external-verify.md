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
mode). Left uncommitted for the implementer/owner to carry with the B1/B2
corrections.
