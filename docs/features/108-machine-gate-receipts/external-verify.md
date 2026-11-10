# 108 — machine-gate-receipts · external verify

First external verification (no prior receipt existed → full verdict, once).

```
EXTERNAL VERIFY — base: 2a28f038a246d35ba159037620ebe337a56e57ed · head: 10975fff3a8871ece4c8dd9a19cfa28c89d292c9
Blockers: 0 code blockers — 1 open obligation: O17 (`bun scripts/local-gate.mjs --skip-network` exits 1: `worktree-guard` red on the FOREIGN worktree `.git/worktrees/fix-489-narrow-local-pin-rule` — merged into origin/main, dirty; a live foreign session's checkout, not this unit's files. The unit doc records the same class of red at cut as feat-427. Owner decision pending: clean the foreign worktree(s) or accept the 12-step subset from G1/G5 as the unit's receipt.)
Advisories: 4 —
  1. skills/audit-pr/SKILL.md:79-80 — the trigger bullet "When you want one defensible answer to 'is this PR actually ready?'…" was deleted; no S# covers removing it (S5 adds checklist items only). Smallest action: restore the bullet or record its removal as a deliberate edit in the unit doc.
  2. docs/features/108-machine-gate-receipts/SPEC.md §Log E4 — recorded "9 pass / 0 fail" for scripts/gate-receipt.test.mjs; the final suite is 10 tests (the G4-recorded filtered-run case landed after E4 was written). Every other recorded count matched exactly (20/44/28/21/20/811). Smallest action: refresh the E4 count line.
  3. docs/ROADMAP.md:131 — row 108 still quotes the issue's verbatim "SHA-bound gate envelope" wording that S12/D3 superseded (validity = content manifest, HEAD sha = provenance); the SPEC's Retirements section discloses the narrowing. Smallest action: paraphrase the roadmap row or note the supersession beside it.
  4. scripts/gate-receipt.mjs (runGate `partial: options.passthrough.length > 0`) — ANY passthrough argument (e.g. `-- --no-bail`, a full run) marks the receipt degraded `partial-gate-selection`, broader than the header's "a filtered run (`-- --only …`)". Fail-closed direction. Smallest action: either narrow the doc or narrow the flag set.
Sibling sweep: clean — surviving "SHA-bound" mentions are verbatim issue quotes (SPEC L1/L2, roadmap row → advisory 3); no live surface asserts the superseded head-SHA validity, the old 64 KiB/4,096-entry limits survive nowhere they bind, and the docs/CAPABILITIES.md `gate-receipt@1` mention is current and true.
Completeness: S1–S14 all resolved — every S# maps to a task with an `(Implements: S#)` validator re-run green here (schema suite 20 pass; crate suite 811 pass; runner suite 10 pass; local-gate suite 44 pass; audit-pr-receipt suite 28 pass; normative-drift 21 pass; vocabulary-parity 20 pass; prose-gate-inventory 21 pass; skill-lint 0 findings; context budgets PASS; red-first 48 pairs PASS; changeset lint ok; version-parity VERDICT: PASS; docs-generate --check PASS; roadmap check PASS, 0 violations; S7 diff empty). O1–O16 verified with validators re-run green here; O17 open (the blocker above).
Spot check: bun test packages/agentic-workflow-schema/test/gate-receipt.test.mjs → 20 pass / 0 fail → match (E1). Additionally matched live: E5, E6, E7, E8, E9, E10, E11, E12, E13, E14, E15, E16, G5's red-first verdict.
Verdict: NEEDS-DECISION (O17)
```

Provenance notes for the next run:

- The six initial suite failures in this environment (`node` absent from PATH:
  `--json`, `--jobs`, `journal-carrier-check` in `scripts/local-gate.test.mjs`;
  three `gh`-shim CLI cases in `scripts/audit-pr-receipt.test.mjs`) reproduce at
  the base commit in a `mktemp -d` scratch of `origin/main` under the same
  environment and vanish with node on PATH — environmental, not change-caused.
  All suites re-run 0 fail with node on PATH.
- The runner's mutation paths (`gate-receipt.mjs run`, `--json` writes) were
  exercised only in `mktemp -d` scratch — a fixture green gate (pass/exit 0),
  an unrelated commit keeping the receipt `current` (exit 0, S12.1), and a
  mutated signed file flipping it to `stale` with the changed path named
  (exit 4, S12.3). The live tree was never written by the runner.
- Scratch copies removed; no commit, push, branch, or forge mutation performed.
- Delta trigger for the next verification: any commit after `10975fff` on this
  branch → re-verify the delta diff, the O17 blocker state, and the spot check only.
