# External verify — 630 telemetry merge safety

First receipt for this unit: no `EXTERNAL VERIFY` block and no review verdict
existed when this run bound the state (the SPEC's `## Correction history` was
empty), so this is a full verdict, once. Uncommitted by design — the verify run
is read-only; the owner commits or moves it beside the unit doc.

State binding: unit dir `docs/fix/630-telemetry-merge-safety/` · base
`origin/main` @ `748a372f` (= merge-base) · head `c607c53a` · branch
`feat/630-telemetry-merge-safety` (clean, synced with its origin).

EXTERNAL VERIFY — base: 748a372f · head: c607c53a
Blockers: 0
Advisories: 6
- A1 — `SPEC.md` Log `E10`: the recorded counts for `agentic-shared-telemetry` on `packages/agentic-workflow/README.md` / `docs/workflow/TIER_COST.md` ("3 · 2") never reproduce — observed 1 matching line / 2 occurrences · 1 at head and at every commit in the range (`3474aced`, `d49c78e5`). The underlying validator (O14, "at least 1 each") holds and the other six counts on the same line reproduce exactly; evidence-recording inaccuracy, not a code defect.
- A2 — `planning-evidence.md` PE-008: the base regression baseline records 13 pass (driver suite) / 14 pass (`writer.merge`); the base tree measures 12 / 15 (reproduced from `git archive origin/main` in scratch). Off by one in opposite directions; the claim both suites pass at the cut head holds, and head−base deltas are exactly the 5+5 new cases.
- A3 — `packages/agentic-workflow/bin/shared-merge.mjs:9-10`: the docstring shows bare direct-execution spellings (`node_modules/…/bin/shared-merge.mjs --install`) but the file is mode 100644 (same as the pre-existing `bin/path-guard.mjs`), so that literal spelling fails EACCES. Every armed command is runtime-prefixed (`bun`/`node` per `driverCommand`), so no armed path is affected. Smallest action: prefix the docstring spellings with `bun`, or chmod 755 to match `bin/turn-contract.mjs`.
- A4 — pre-existing, relocated verbatim: `resolveMerge`'s plain-form class inference reads `argv[5]`, but git's plain form `%O %A %B %L %P` delivers the path at `argv[4]`, so plain-form inference never fires (it refuses `unknown-path` naming the base temp file instead). Byte-identical at base (`scripts/shared-doc-merge.mjs` `resolveMerge`) — advisory, not change-caused.
- A5 — `skills/init-workspace/references/UPGRADE.md:107`: "the five `agentic-shared-*` class lines" counts classes, not lines (six attribute lines; the telemetry class claims two paths as a pair). Self-corrected by the enumeration that follows.
- A6 — `packages/agentic-workflow/src/telemetry/reconstruct.mjs` (`main`): bare `agentic-workflow telemetry` now refuses with `expected "reconstruct" or "merge-install", got …` where base said `expected "reconstruct", got …` — error-path wording delta causally tied to the new route; the `telemetry-reconstruct@1` refusal envelope and exit codes are unchanged and nothing pins the old string.
Sibling sweep: clean — live enumerations updated in `BOOTSTRAP_WRITE.md`, `UPGRADE.md`, `AGENTS.md`, the crate README and `TIER_COST.md`; the only surviving four-class/four-line enumerations are frozen historical unit docs (507 SPEC/external-verify, 560-307 SPEC, 537 planning-evidence); `scripts/differential-baseline.mjs`'s "four classes" is verdict classes, not merge classes (false positive); the doctor's `merge-drivers` probe groups by the `agentic-shared-` prefix with no class hardcode.
Completeness: S1–S5 all resolved — S1→P3/P4, S2→P3/P4/P5, S3→P5/P6, S4→P5, S5→P1/P2/P3/P6/P7; every task carries `(Implements: S#)` with a validator that re-ran green here. Obligations O1–O17 all `verified`, validators re-run green (O7's measured-corpus `/tmp` probe is gone by design; its validator case `F-630-4` reproduces).
Spot check: `rg -c 'agentic-shared-telemetry' packages/agentic-workflow/README.md docs/workflow/TIER_COST.md` → reported "3 · 2", observed 1 · 1 — mismatch on 2 of the 8 counts that `E10` line records (A1). Bounded: the six executable suite tallies and every gate verdict on the same receipt re-ran and matched exactly, so the untrustworthiness is confined to that prose count pair.
Verdict: VERIFIED

Evidence annex (declared verification commands, observed 2026-11-18, head `c607c53a`):

| command | observed | reported | match |
|---|---|---|---|
| `bun test packages/agentic-workflow/test/writer.merge.test.mjs` | exit 0 · 20 pass / 0 fail | E4: 20 pass | ✓ |
| `bun test scripts/shared-doc-merge.test.mjs` | exit 0 · 17 pass / 0 fail | E5: 17 pass | ✓ |
| `bun test scripts/docs-generated-merge.test.mjs` | exit 0 · 18 pass / 0 fail | E5b: 18 pass | ✓ |
| `bun test packages/agentic-workflow/test/telemetry-merge-install.test.mjs` | exit 0 · 8 pass / 0 fail | E6: 8 pass | ✓ |
| `bun test packages/agentic-workflow/test/telemetry-reconstruct.test.mjs` | exit 0 · 18 pass / 0 fail | E7: 18 pass | ✓ |
| `bun test packages/agentic-workflow/test/doctor.checks.test.mjs` | exit 0 · 21 pass / 0 fail | E9: 21 pass | ✓ |
| `bun test scripts/normative-drift.test.mjs` | exit 0 · 21 pass / 0 fail | E12: 21 pass | ✓ |
| `bun scripts/prose-gate-inventory.mjs` | `verdict: PASS` | E12 | ✓ |
| `bun scripts/docs-generate.mjs --check` | 3 checked · 0 stale · Roadmap unchanged · PASS | E13 | ✓ |
| `bun scripts/check-skill-context.mjs --documents` | PASS · AGENTS.md 725/728 | E11 | ✓ |
| `bun scripts/version-parity-gate.mjs --content` | `VERDICT: PASS` | E15 | ✓ |
| `bun scripts/local-gate.mjs --no-bail` | PASS · 19/19 steps · 724 s | G1: 18/19 (`worktree-guard` red over other sessions' worktrees — condition since cleared; O16 reproduces stronger than recorded) | ✓ |
| `rg -c 'TIER_COST.md merge=agentic-shared-telemetry' .gitattributes template/.gitattributes BOOTSTRAP_WRITE.md` | 1 · 1 · 1 | E10 | ✓ |
| `rg -c 'sessions.jsonl merge=agentic-shared-telemetry' .gitattributes template/.gitattributes` | 1 · 1 | E10 | ✓ |
| `rg -c 'appendFileSync' packages/agentic-workflow/src/writer/shared-merge.mjs` | 2 | E10 | ✓ |

Own probes (beyond the writer's tests — the change's new tests are not evidence; all mutation-capable paths ran only in `mktemp -d` scratch, never against the live tree):

- Canonical-JSON dedup (D3's wording; shipped tests only dedup byte-identical lines): the re-serialized twin `{"tokens":2,"source":"pi:session=b"}` vs `{"source":"pi:session=b","tokens":2}` appended on theirs → driver exit 0, "both sides already carry the same lines; nothing to append", `%A` byte-identical to ours.
- Table dedup through a real `git merge` with the driver armed via the crate bin (`bun <bin> --install`, `verdict: PASS`): identical row on both branches → exit 0, the row lands exactly once, no markers.
- Deletion refusal (S5 boundary): theirs deletes a committed row while appending → exit 1, `SHARED MERGE REFUSAL — non-append-union — …`, `%A` byte-identical to ours, no markers.
- Missing-trailing-newline boundary: ours without a final newline + theirs appending → exit 0, the delta appended correctly, no `*.shared-doc-merge` staging artifact created.
- Reconciliation trigger with the declaration present (shipped tests cover only `declared:false`): `telemetry reconstruct write` → `merge_driver {armed, declared: true, next: null}`, second run `unchanged`, `.gitattributes` byte-untouched.
- Foreign-claim install (S2's additive rule): a `.gitattributes` claiming `TIER_COST.md` with another driver → the installer appends only the JSONL line, never adds a second claim, receipt honest (`declared: false`, `missing: 1`).
- CLI regression: bare `telemetry` refused at base and head (A6's wording delta only); `telemetry merge-install --help` exit 0; unknown flag refusal exit 2.

Stability check: every probe drives only the `telemetry` class on its declared path — driver dispatch is per-path from `.gitattributes`, so no reproducer fires on untouched adjacent code. Base-vs-head differential: the unarmed degradation (git's textual merge) and A4's plain-form oddity are byte-identical at base; nothing failed at head that passed at base.

Mutation-path disclosure: no unproven mutation path touched the live tree or the shared worktree — the armed driver, both `--install` entries, `telemetry merge-install` and `telemetry reconstruct write` ran only in `mktemp -d` scratch; the declared suites run in their own throwaway fixtures; the gate's steps are check-only over the live tree (plus the gitignored `dist/` rebuild the gate itself owns). Nothing to clean.
