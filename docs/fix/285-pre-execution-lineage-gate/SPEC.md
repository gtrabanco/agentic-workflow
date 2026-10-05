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

- Not changing the snapshot digest, receipt grammar, or schema package
  vocabularies (`packages/agentic-workflow-schema` untouched).
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

## Evidence

> Evidence is verified, not claimed — a reviewer re-runs it.

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|

## Progress log

One entry per step taken. Format exactly:
`YYYY-MM-DD HH:MM — <what was done> → <commit sha or evidence> — next: <what is next>`

## Next

Run triage and execute the triaged steps.

## References

- Issue: [#285](https://github.com/gtrabanco/agentic-workflow/issues/285)
- Feature 61 SPEC P8b (contract re-home); PR #282 audit finding F54
- `skills/pre-execution-review/references/LEDGERS.md` (ledger homes/sizing)
- Companion: #286 (separate lane, shared root cause)

## Branch

`fix/285-pre-execution-lineage-gate`

## Depends on

None (independent of #286's lane; audit-pr reference edits are sequential by
merge order, not by dependency).

## Regression scope

- Legacy snapshot behaviour (spec/plan stages over a fixture tree with
  `ACCEPTANCE.md` + `progress.md` receipts): `scripts/pre-execution-sensor.test.mjs`,
  `scripts/pre-execution-timeline.test.mjs`, `scripts/pre-execution-wording-only-manifest.test.mjs`.
- Template/triage contract: `scripts/unit-route.test.mjs`,
  `scripts/ledger-ownership.test.mjs`, `scripts/golden-fixture.test.mjs`.
- Content pins on the audit reference: `scripts/pre-execution-quality.test.mjs`.
