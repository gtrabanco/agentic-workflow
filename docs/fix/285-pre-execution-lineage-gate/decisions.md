# fix/285-pre-execution-lineage-gate — decisions

Path-protection records for this unit (append-only; owner: `skills/orchestration-envelope/references/TURN_CONTRACT.md`):

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/agentic-workflow-schema/test/pre-execution-snapshot.test.mjs | P2 | 2026-10-05 | execute-phase | The test pins the plan required set as SPEC + ACCEPTANCE — the retired pre-lane artifact requirement AC1 removes. Red-first: the test must state the new contract (SPEC required; the acceptance manifest binds when present) before src/pre-execution.ts REQUIRED_ARTIFACTS changes, so the suite fails first and proves the change.
justification | packages/agentic-workflow-schema/test/release-contract.test.mjs | P5 | 2026-10-05 | execute-phase | F2: version pin update (4.5.0 → 4.6.0) to match the schema package bump; the test asserts the release contract, not behavior — it moves with every same-PR version bump recorded in CHANGELOG.md.
justification | packages/agentic-workflow-schema/test/verification-gates.test.mjs | P5 | 2026-10-05 | execute-phase | F2: version pin update (4.5.0 → 4.6.0) to match the schema package bump; same AC7 contract pin as release-contract.test.mjs.
justification | docs/fix/285-pre-execution-lineage-gate/SPEC.md | P5 | 2026-10-05 | execute-phase | F3: Evidence row rewrite — the `bun run test` output row must reflect the actual suite result after the version pin fix (717 pass / 0 fail at 4.6.0).
justification | docs/fix/285-pre-execution-lineage-gate/SPEC.md | P5 | 2026-10-05 | execute-phase | F8: Cross-PR collision fix — updating the `## Depends on` section from `None` to reference the merge-order dependency on #288 for the audit-pr 5.5.0 version bump.
justification | docs/fix/285-pre-execution-lineage-gate/SPEC.md | P5 | 2026-10-05 | execute-phase | F4–F6: audit-pr reference text updates — non-author-controlled gate discriminator, obligations validation, and BLOCKED verdict for absent sections.
justification | docs/fix/285-pre-execution-lineage-gate/SPEC.md | P5 | 2026-10-05 | execute-phase | F7: triage currency anchor text — frozen digest/timestamp anchor for the triage re-derivation.
justification | docs/fix/285-pre-execution-lineage-gate/review-findings.md | P5 | 2026-10-05 | execute-phase | F2–F8: flip `folded: no → yes` for all folded rows.
justification | CHANGELOG.md · docs/workflow/SKILL_CONTEXT_BUDGETS.json · README.md · skills/audit-pr/SKILL.md · SPEC.md `Depends on` | P5 | 2026-10-05 | execute-phase | F8: coordinate cross-PR collision — single audit-pr 5.5.0 version, single budget re-base, correct SPEC `## Depends on`.
justification | packages/agentic-workflow-schema/test/pre-execution-canonical.test.mjs | P2 | 2026-10-05 | execute-phase | The canonical test's tail asserts a SPEC-only plan snapshot is refused — the same retired pre-lane requirement the fix removes. The assertion flips to the new contract (SPEC-only builds; acceptance-only is refused) so the suite proves both directions of the binding-when-present rule.
justification | packages/agentic-workflow-schema/src/pre-execution.ts | P2 | 2026-10-05 | execute-phase | REQUIRED_ARTIFACTS.plan requires the acceptance manifest — a pre-lane artifact lane-era units structurally never write (issue #285). The plan required set becomes SPEC-only; the manifest binds when present. Digests, receipt grammar, and published vocabularies are untouched.
justification | packages/agentic-workflow-schema/package.json | P2 | 2026-10-05 | execute-phase | Version bump is mandatory and same-PR for any schema package change (AGENTS.md, Packages).
justification | scripts/lane-era-lineage.test.mjs | P6 | 2026-10-05 | execute-phase | F11/F12: the behavioral lineage suite grows the red-first tests the findings demand — a machine surface (unit-lineage.mjs) driven over fixture repos instead of substring pins on gate prose.
justification | scripts/unit-lineage.mjs | P6 | 2026-10-05 | execute-phase | F9/F10/F11: new file — the machine surface of audit-pr gate 1. Keys the lane-era/legacy discriminator on a verifying receipt (not author-controlled progress.md presence) and gives the absent/empty/open-obligation BLOCKED rules a reader.
justification | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md | P6 | 2026-10-05 | execute-phase | F9/F10: gate 1 rewritten to invoke the machine surface and to retract the "frozen digest anchor" paragraph naming a triage digest unit-route.mjs never emits; the pinned sentences (verify recipe, no git hash-object, item-2 obligations wording) survive.
justification | scripts/pre-execution-quality.test.mjs | P6 | 2026-10-05 | execute-phase | Pin maintenance: the P4 route-contract pins gain the unit-lineage.mjs routing pin so the gate prose cannot silently decouple from its runtime.
justification | docs/fix/285-pre-execution-lineage-gate/review-findings.md | P6 | 2026-10-05 | execute-phase | F13 + fold bookkeeping: F1's bogus `folded: yes` (a low report-note is never folded) drops to `folded: no` so ledger-provenance --check passes; F9–F13 flip to `folded: yes` with the real fold SHA.
justification | docs/fix/285-pre-execution-lineage-gate/SPEC.md | P6 | 2026-10-05 | execute-phase | The unit doc records the fold: new task P6, obligations row, Evidence rows for the fold gate, Progress log entry.
justification | docs/fix/285-pre-execution-lineage-gate/decisions.md | P6 | 2026-10-05 | execute-phase | This file: the justifications above and the D-285-4 decision entry are the path-protection record the checkpoint gate reads.
```

## Decision log

- **D-285-1 (2026-10-05)** — scope amendment discovered at P2: the Non-goals line
  "schema package untouched" was written against vocabularies/digests/receipt
  grammar. The plan-stage requiredness (`REQUIRED_ARTIFACTS`) lives in
  `packages/agentic-workflow-schema/src/pre-execution.ts` and is the authoritative
  half of the requiredness the fix relaxes — AC1 is impossible without it. Amended:
  the schema package's REQUIRED_ARTIFACTS + its pinning test + the package version
  bump are in scope; every other schema surface stays untouched.
- **D-285-2 (2026-10-05) — diff-size exception (recorded, not forced).** After the
  three implement steps the diff guard answers
  `DIFF-GUARD BREACH — Lines: 617 > 400 · Files: 16 > 8`. The unit is one root
  cause spanning three layers (schema requiredness, audit gate, producer) plus its
  red-first tests on both sides (repo suite + schema package) — an honest split
  was attempted (schema / gate / producer are three separate commits) and the
  remainder is irreducible without deleting comments, docs or tests, which is
  forbidden. Exception recorded with the real count: 617 lines, 16 files. No
  budget was gamed; no comment, blank line, doc or test was removed to fit.
- **D-285-3 (2026-10-05) — Non-goals line amended inline.** The SPEC's
  Non-goals bullet "Not changing the snapshot digest, receipt grammar, or schema
  package vocabularies" is reworded to name `REQUIRED_ARTIFACTS` as the one
  schema surface in scope (per D-285-1); the SPEC is the unit doc, not a frozen
  plan file, so the amendment is recorded here and reflected in place.
- **D-285-4 (2026-10-06) — cycle-4 fold (F9–F13) answered with mechanisms, not
  prose.** Cycle 4 rejected the F4–F7 fold because its repairs were sentences
  with no reader and no test. This fold adds `scripts/unit-lineage.mjs`, the
  machine surface of audit-pr gate 1, and rewrites gate 1 to route through it:
  (a) F10's replan route is executed as task P6 — the discriminator keys on a
  **verifying** plan receipt (`pre-execution-snapshot.mjs verify --stage plan`
  exit 0), never on author-controlled `progress.md` presence; a receipt that
  does not re-derive falls through to the lane-era checks, so no unit can choose
  a weaker gate. (b) F9 is resolved by **retraction**: the "frozen digest
  anchor" paragraph named a digest `unit-route.mjs --triage` never emitted; the
  byte binding the gate needs is already provided by the triage output being a
  pure function of the unit doc's bytes, so implementing a digest surface would
  be an unnecessary CLI change. (c) F11/F12 are the behavioral suite in
  `scripts/lane-era-lineage.test.mjs` driving the runtime over fixture repos
  (red-first: 15 fail / 2 pass at `a505c7b7`). (d) F13: F1 was a `low`
  report-note that was never folded — its `folded: yes` mark was bogus and is
  dropped to `folded: no`.
