# fix/285-pre-execution-lineage-gate

> One-line: the pre-execution lineage gate stops demanding retired pre-lane
> artifacts and reads the lane-era unit doc instead — contract, producer, and
> enforcers agree.

## Issue

`#285` — tracked issue in the project's forge. The PR must close it via
`Closes #285` in the body (or the forge's equivalent auto-close convention).

## Objective

Re-align the pre-execution lineage gate with feature 61's single-unit-doc
contract. `pre-execution-snapshot.mjs` still requires `ACCEPTANCE.md` (a
retired artifact) at plan stage, and `audit-pr`'s closure gate still requires a
`progress.md` receipt — artifacts the lane-era pipeline structurally never
writes, so every lane-era unit is unauditable in principle.

## Why

Feature 61 (P8b) re-homed the planning ledgers into the unit doc
(`### Planning evidence`, `### Obligations` — `skills/pre-execution-review/references/LEDGERS.md`)
and retired the spec/plan receipt stages in the sensor
(`scripts/workflow-status.mjs` senses `stage: "lane"`). Three-way split left
behind: the contract moved, the producer (`unit-lane`) never gained a step that
writes the ledgers, and the enforcers (`scripts/pre-execution-contract.mjs`
plan-stage table, `skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md`
gate 1) stayed frozen in the pre-lane model. Reproduced on `65-doc-toolchain`
(PR #282 audit, finding F54): `verify --stage plan` exits 1 demanding
`ACCEPTANCE.md`; no lane-era unit can pass the merge gate's lineage check
without hand-writing retired artifacts.

## User outcome

A lane-era unit (SPEC.md only, no `progress.md`/`ACCEPTANCE.md`) passes
`audit-pr`'s pre-execution lineage gate: the audit re-derives the unit doc's
triage block currency and closes obligations from the unit doc's own
`### Obligations` ledger. Legacy units that do carry `progress.md` receipts and
an `ACCEPTANCE.md` keep working unchanged.

## Acceptance criteria

1. A lane-era fix unit whose folder carries only `SPEC.md` (no `ACCEPTANCE.md`,
   no `progress.md`) builds a plan-stage snapshot:
   `bun scripts/pre-execution-snapshot.mjs build --stage plan --unit <fixture>`
   prints a 64-hex digest and exits 0 (today: exit 1
   `required artifact(s) absent: docs/fix/<fixture>/ACCEPTANCE.md`).
2. Legacy binding is preserved: a unit folder that does carry `ACCEPTANCE.md`
   still binds the `acceptance` artifact row in the same plan snapshot
   (fixture test asserts the kind is present when the file exists).
3. `audit-pr`'s closure gate (reference 02) verifies lane-era lineage from the
   unit doc: the triage block present and current (re-derive with
   `bun scripts/unit-route.mjs --triage <unit>` and compare the `Steps:` line
   against the block pasted in the unit doc's Evidence section) and obligations
   closed from `### Obligations` (unit doc for the embedded shape,
   `planning-obligations.md` for the separate-file shape). A unit that does
   carry legacy `progress.md` receipts keeps the
   `pre-execution-snapshot.mjs verify --stage plan` path. Stale, missing, or
   open-obligation outcomes stay **BLOCKED** as today.
4. The producer exists: the unit-doc templates (`docs/features/_TEMPLATE/SPEC.md`,
   `docs/fix/_TEMPLATE/SPEC.md`) carry `### Planning evidence` and
   `### Obligations`, and `unit-lane`'s plan step instructs cutting both ledgers
   per `LEDGERS.md` sizing (embedded in the unit doc for XS/S, separate
   `planning-evidence.md` / `planning-obligations.md` files for M/L — never
   both).
5. Repo gate green: `node --test scripts/*.test.mjs` exits 0 (red-first tests
   for AC1/AC2 written before the implementation change).

## Non-goals

- Not changing the snapshot digest, receipt grammar, or the schema package's
  published vocabularies. The one schema surface this fix touches is
  `REQUIRED_ARTIFACTS` (plan-stage requiredness — the authoritative half of AC1;
  amended per `decisions.md` D-285-1, schema 4.6.0).
- Not retiring the `pre-execution-snapshot.mjs` CLI or its spec/plan stages —
  legacy units and the review step still consume it.
- Not touching review-receipt currency or affecting-path binding (that is
  #286's scope, separate lane).
- Not retrofitting already-shipped lane-era unit docs (61–65, 69, 71) with
  ledger sections.
- Not changing `workflow-status` sensing (already lane-era, `stage: "lane"`).

## Future cost

- The lane must keep writing the two ledger sections: bound by `unit-lane`'s
  plan step and the templates (the templates are the enforcement surface a
  lane copy inherits).

## Applicable tests

`node --test scripts/*.test.mjs` — specifically new red-first cases for AC1/AC2
(plan-stage requiredness + fixture build), the existing
`pre-execution-quality.test.mjs` content pins on reference 02 (kept passing,
updated only where the gate text intentionally moves), and
`scripts/ledger-ownership.test.mjs` / `scripts/unit-route.test.mjs` for the
template change.

## Known pre-existing issues

- `#286` (head-bound review receipts void on non-affecting commits) —
  does-not-affect this unit (separate lane, same root-cause family).
- `#269` ripgrep requirement OPEN — does-not-affect (no runtime dependency here).
- `65-doc-toolchain` review findings F54–F57 — affects this unit's motivation
  only; they are cleared by re-running the audit on PR #282 after merge, not in
  this fix.

## Tasks

P1 — Red-first tests: new `scripts/lane-era-lineage.test.mjs` asserting AC1
(build plan snapshot over a fixture lane-era fix folder → digest, exit 0) and
AC2 (same fixture with `ACCEPTANCE.md` binds the `acceptance` row), plus the
reference-02 and template content pins for AC3/AC4 (validators:
`node --test scripts/lane-era-lineage.test.mjs` fails before P2–P4, passes after).

P2 — Enforcer A: `scripts/pre-execution-contract.mjs` plan-stage `acceptance`
row becomes `required: false` (legacy units still bind it when present);
`skills/pre-execution-review/references/SNAPSHOT.md` requiredness wording
updated to say the same (validator: `node --test scripts/pre-execution-quality.test.mjs`
exits 0).

P3 — Enforcer B: rewrite gate 1 of `skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md`
to the lane-era lineage check (triage-block currency + unit-doc obligations),
keeping the legacy verify path for units that carry `progress.md` receipts and
every sentence the content pins freeze (validator:
`node --test scripts/pre-execution-quality.test.mjs` exits 0).

P4 — Producer: `### Planning evidence` + `### Obligations` sections added to
both unit-doc templates; `skills/unit-lane/references/PLAN.md` gains the
ledger-cutting instructions per `LEDGERS.md` sizing (validator:
`node --test scripts/lane-era-lineage.test.mjs scripts/ledger-ownership.test.mjs
scripts/unit-route.test.mjs` exits 0).

P5 — Verification sweep: full gate `node --test scripts/*.test.mjs`,
`bun scripts/check-skill-context.mjs` budgets, and the diff guard (validator:
`node --test scripts/*.test.mjs` exits 0).

P6 — Fold review findings F9–F13 (cycle 4): red-first behavioral tests for a
`scripts/unit-lineage.mjs` machine surface of audit-pr gate 1 (F10
non-author-controlled discriminator, F11 obligation-ledger BLOCKED rules, F12
behavioral triage currency), gate-1 rewrite retracting the phantom digest
paragraph (F9), and the F1 provenance repair (F13). Validators:
`node --test scripts/lane-era-lineage.test.mjs` (red before the script exists)
and `node scripts/ledger-provenance.mjs docs/fix/285-pre-execution-lineage-gate/review-findings.md --check`
exit 0.

```text
path-protection-plan@1
freeze-after: none
kind | path | justification
created | scripts/unit-lineage.mjs | the machine surface of audit-pr gate 1 — F10/F11 demand a runtime the gate prose routes through, not rules with no reader
```

## Evidence

> Evidence is verified, not claimed — a reviewer re-runs it.

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| AC1 | `node --test scripts/lane-era-lineage.test.mjs` | 0 | `plan snapshot builds for a lane-era fix unit with no ACCEPTANCE.md and no progress.md` pass; build prints 64-hex digest | lane-era-lineage suite (red-first: failed at 36af142c with the issue's exact `required artifact(s) absent` error) |
| AC2 | `node --test scripts/lane-era-lineage.test.mjs` | 0 | `legacy acceptance manifest still binds when present` pass; kind `acceptance` bound at `<unit>/ACCEPTANCE.md` | lane-era-lineage suite |
| AC3 | `node --test scripts/lane-era-lineage.test.mjs scripts/pre-execution-quality.test.mjs` | 0 | AC3 pins pass post-rewrite; all reference-02 content pins intact | lane-era-lineage suite + pre-execution-quality P4 pins |
| AC4 | `node --test scripts/lane-era-lineage.test.mjs scripts/ledger-ownership.test.mjs scripts/unit-route.test.mjs` | 0 | template + PLAN.md pins pass; ledger ownership and triage contracts unbroken | lane-era-lineage + ledger-ownership + unit-route suites |
| AC5 | `node --test scripts/*.test.mjs` | 0 | 619 pass / 0 fail; `bun scripts/check-skill-context.mjs` PASS 28 skills + PASS 14 routes | full repo gate |
| AC5 | `bun run test` (packages/agentic-workflow-schema) | 0 | 717 pass / 0 fail (schema 4.6.0); check:pre-execution-schemas + check:verification-schemas drift-free | schema package gate |
| — | `bun scripts/diff-guard.mjs --base main --unit 285` | 1 | `DIFF-GUARD BREACH — Lines: 617 > 400 · Files: 16 > 8` | exception recorded: `decisions.md` D-285-2 (real count reported, nothing shrunk) |
| — | `bun scripts/diff-guard.mjs --base origin/main --unit 285` | 1 | `DIFF-GUARD BREACH — Lines: 1335 > 400 · Files: 25 > 8` | head-true count after the cycle-4 fold (D-285-2 exception stands; real count reported, nothing shrunk) |
| — | `node packages/agentic-workflow/bin/path-guard.mjs --unit docs/fix/285-pre-execution-lineage-gate --phase P6 --base 8c6d12db` | 0 | `PATH-GUARD pass — justified · checked: 7` | P6 checkpoint over the fold's committed range |
| — | `node --test scripts/lane-era-lineage.test.mjs` (fold F9–F13, red-first) | 0 | 17 tests pass; behavioral `unit-lineage` suite drives gate 1's runtime over fixture repos (red: 15 fail / 2 pass at `a505c7b7`) | fold `833c1121` |
| — | `node scripts/unit-lineage.mjs --unit 285-pre-execution-lineage-gate` | 0 | `LINEAGE OK — lane-era (triage block re-derives) · obligations closed (5)` | the gate's own machine surface on this unit |
| — | `node --test scripts/*.test.mjs` | 0 | 632 pass / 0 fail | full repo gate at `833c1121` |
| — | `bun scripts/check-skill-context.mjs` | 0 | `PASS context budgets: 28 skills` | full budget sweep at `833c1121` |
| — | `node scripts/ledger-provenance.mjs docs/fix/285-pre-execution-lineage-gate/review-findings.md --check` | 0 | `CHECK PASS` | F13: every `folded: yes` row carries a verified fold token |

## Triaged steps

```text
TRIAGE — 285-pre-execution-lineage-gate (fix)
Steps: plan, implement, tests, evidence, review, docs
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
```

> Authoritative step list from `bun scripts/unit-route.mjs --triage 285-pre-execution-lineage-gate` — the model never re-derives, reorders, or invents steps. Skipped steps recorded as `n/a: <reason>`: research — n/a (catalog: fix unit), design — n/a (catalog: fix unit), release — n/a (catalog: fix unit).

### Planning evidence

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | file-read | plan stage requires `ACCEPTANCE.md` (`required: true`, kind `acceptance`) — the retired pre-lane artifact | `scripts/pre-execution-contract.mjs:39` | verified 2026-10-05 | O1 |
| PE-002 | file-read | audit-pr gate 1 demands a `progress.md` plan receipt re-verified via `pre-execution-snapshot.mjs verify --stage plan` | `skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md` (§Pre-execution lineage, item 1) | verified 2026-10-05 | O3 |
| PE-003 | file-read | the sensor already retired the receipt stages: lane-era rows are `stage: "lane"`, `boundDigest: null` | `scripts/workflow-status.mjs` (buildEnvelope, feature 61 P8b comment) | verified 2026-10-05 | O3 |
| PE-004 | file-read | the ledger contract re-homes Planning evidence + Obligations into the unit doc (XS/S embedded, M/L separate files, never both) | `skills/pre-execution-review/references/LEDGERS.md` (ledger table + sizing note) | verified 2026-10-05 | O3, O4 |
| PE-005 | grep | the producer never wrote the ledgers: `grep -i obligation skills/unit-lane/` → 0 hits; lane plan step fills Tasks only | `skills/unit-lane/references/PLAN.md` | verified 2026-10-05 | O4 |
| PE-006 | file-read | unit-doc templates carry no ledger sections | `docs/features/_TEMPLATE/SPEC.md`, `docs/fix/_TEMPLATE/SPEC.md` | verified 2026-10-05 | O4 |
| PE-007 | file-read | content pins freeze sentences of reference 02 (`Any \`planned\`…`, `wearing a new name`, `BLOCKED\n   \|, naming the ids`, `may not be exported`, `only emitter of MERGE-READY`, verify-recipe naming, no `git hash-object`) — the gate rewrite must keep them | `scripts/pre-execution-quality.test.mjs` (P4 route-contract tests) | verified 2026-10-05 | O3 |
| PE-008 | file-read | triage re-derivation is deterministic: `unit-route.mjs --triage` prints `Steps:` from doc facts (type, scope, tests) — comparing the pasted block's `Steps:` line is a mechanical currency check | `scripts/unit-route.mjs` (runTriage, unitFacts) | verified 2026-10-05 | O3 |
| PE-009 | file-read | acceptance-row requiredness is decided by `STAGE_ARTIFACTS`, not the schema builder — the schema package stays untouched | `scripts/pre-execution-contract.mjs` (buildSnapshot consumes `row.required`) | verified 2026-10-05 | O1, O2 |
| PE-010 | sampled | the consumer sweep at P2: every `acceptance`-row consumer already tolerates absence — `attributeFreshness`'s acceptance-exclusion names "a snapshot that binds no acceptance manifest", and the wording-only route fails closed without one | `scripts/pre-execution-snapshot.mjs` (acceptancePaths filter, wordingOnly guard) | verified 2026-10-05 | O2 |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | AC1 | lane-era fix unit builds a plan snapshot with no `ACCEPTANCE.md` | P2 | P2 (tests in P1) | unit-lane:implement | `node --test scripts/lane-era-lineage.test.mjs` | test cases `plan snapshot builds for a lane-era fix unit`, digest recorded in Evidence | verified |
| O2 | AC2 | legacy units still bind the acceptance manifest when present | P2 | P2 (tests in P1) | unit-lane:implement | `node --test scripts/lane-era-lineage.test.mjs` | test case `legacy acceptance manifest still binds when present` | verified |
| O3 | AC3 | audit-pr lineage gate reads lane-era surfaces; legacy receipt path retained; pinned sentences survive | P3 | P3 | unit-lane:implement | `node --test scripts/pre-execution-quality.test.mjs` | content pins pass post-rewrite | verified |
| O4 | AC4 | templates + unit-lane plan step produce the ledgers per LEDGERS.md sizing | P4 | P4 | unit-lane:implement | `node --test scripts/lane-era-lineage.test.mjs scripts/ledger-ownership.test.mjs scripts/unit-route.test.mjs` | template + PLAN.md pins pass | verified |
| O5 | AC5 | full repo gate green, budgets within ceiling | P5 | P5 | unit-lane:implement | `node --test scripts/*.test.mjs && bun scripts/check-skill-context.mjs` | gate output in Evidence | verified |
| O6 | P6 | review findings F9–F13 folded with machine mechanisms: F10 discriminator keyed on a verifying receipt, F11 obligation BLOCKED rules with a reader, F12 behavioral triage currency, F9 digest paragraph retracted, F13 provenance repaired | P6 | P6 | unit-lane:implement | `node --test scripts/lane-era-lineage.test.mjs && node scripts/ledger-provenance.mjs docs/fix/285-pre-execution-lineage-gate/review-findings.md --check` | suite green (red-first at a505c7b7) + CHECK PASS in Evidence | verified |

## Progress log

- 2026-10-05 13:09 — unit opened from issue #285: branch `fix/285-pre-execution-lineage-gate`, SPEC drafted from fix template, index row → in-progress → 94d8eb9d — next: triage
- 2026-10-05 13:15 — triage ran (`bun scripts/unit-route.mjs --triage 285-pre-execution-lineage-gate`), block pasted verbatim; plan step: tasks cut, planning evidence + obligations ledgers cut (embedded shape) → 4f06c1d3 — next: red-first tests
- 2026-10-05 13:22 — tests step (red-first): `scripts/lane-era-lineage.test.mjs` written; AC1/AC3/AC4 red (AC1 reproduces the issue's exact exit-1 error), AC2 green as the legacy baseline → 36af142c — next: implement
- 2026-10-05 13:40 — implement P2 (enforcer A): schema `REQUIRED_ARTIFACTS.plan` → `["spec"]` (package 4.6.0, same-PR bump + changelog row), repo plan-stage row `required: false`, SNAPSHOT.md requiredness wording; red-first in the schema package too (two pinned tests updated first, red confirmed, then source) → 245dea2c — next: enforcer B
- 2026-10-05 13:45 — implement P3 (enforcer B): audit-pr 02 gate 1 rewritten (lane-era triage currency + unit-doc obligations; legacy verify path retained); context budgets re-based (per-skill 2469; routes 10113/632) at declared re-basis → 8b0fcbfa — next: producer
- 2026-10-05 13:50 — implement P4 (producer): templates gain `### Planning evidence` + `### Obligations`; unit-lane PLAN.md cuts both ledgers per LEDGERS.md sizing → ffab7c28 — next: diff guard
- 2026-10-05 14:00 — diff guard BREACH (617/16 vs 400/8): honest split attempted (three commits), exception recorded D-285-2, real count reported — next: review
- 2026-10-05 14:05 — review step ran at HEAD ffab7c28 (axes: code, security, perf, verify; a11y/brand/seo n/a) — `review-findings.md` written, 1 low report-note, 0 fix-now — next: docs
- 2026-10-05 14:20 — docs step: bump-skill over the three touched skills (unit-lane 1.3.0, audit-pr 5.5.0, pre-execution-review 2.7.0), changelog rows, README audit-pr cell; full gate re-run green (619/0) → 7404a423 — next: open PR
- 2026-10-06 00:10 — fold F9–F13 (cycle 4, task P6): red-first behavioral suite for `scripts/unit-lineage.mjs` (gate 1's machine surface; 15 fail / 2 pass at a505c7b7), script + gate-1 rewrite + routing pin → 833c1121 — next: fold marks + ledger provenance
- 2026-10-06 00:15 — F13 fold: F1 report-note's bogus `folded: yes` dropped (never folded, no token), cycle-4 fold note recorded; ledger-provenance --check green; SPEC evidence + obligations O6 → 9864c82c — next: flip F9–F13 marks
- 2026-10-06 00:20 — fold marks: F9–F13 `folded: yes` (tokens 833c1121 / 9864c82c); CHECK PASS 12 proven-cited / 1 open (F1 report-note); P6 path-guard pass; full suite 632/0; schema package 717/0; budgets PASS → 525bf469 — next: push, then cycle-5 review on the new HEAD

## Next

PR #287 carries the fold: re-run `/review-change` on the new HEAD (cycle 5 —
the F9–F13 fold changed gate 1's mechanism, so an independent re-review is due);
after merge, re-run `audit-pr` on PR #282 to clear F54–F57.

## References

- Issue: [#285](https://github.com/gtrabanco/agentic-workflow/issues/285)
- Feature 61 SPEC P8b (contract re-home); PR #282 audit finding F54
- `skills/pre-execution-review/references/LEDGERS.md` (ledger homes/sizing)
- Companion: #286 (separate lane, shared root cause)

## Branch

`fix/285-pre-execution-lineage-gate`

## Depends on

#288 (fix/286-affecting-path-receipt-binding) — merge order only: audit-pr 5.5.0
+ budget re-basis clash on the shared reference; the second merge to land must
rebase to absorb the version bump.

## Regression scope

- Legacy snapshot behaviour (spec/plan stages over a fixture tree with
  `ACCEPTANCE.md` + `progress.md` receipts): `scripts/pre-execution-sensor.test.mjs`,
  `scripts/pre-execution-timeline.test.mjs`, `scripts/pre-execution-wording-only-manifest.test.mjs`.
- Template/triage contract: `scripts/unit-route.test.mjs`,
  `scripts/ledger-ownership.test.mjs`, `scripts/golden-fixture.test.mjs`.
- Content pins on the audit reference: `scripts/pre-execution-quality.test.mjs`.
