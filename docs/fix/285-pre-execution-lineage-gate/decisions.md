# fix/285-pre-execution-lineage-gate — decisions

Path-protection records for this unit (append-only; owner: `skills/orchestration-envelope/references/TURN_CONTRACT.md`):

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/agentic-workflow-schema/test/pre-execution-snapshot.test.mjs | P2 | 2026-10-05 | execute-phase | The test pins the plan required set as SPEC + ACCEPTANCE — the retired pre-lane artifact requirement AC1 removes. Red-first: the test must state the new contract (SPEC required; the acceptance manifest binds when present) before src/pre-execution.ts REQUIRED_ARTIFACTS changes, so the suite fails first and proves the change.
justification | packages/agentic-workflow-schema/test/pre-execution-canonical.test.mjs | P2 | 2026-10-05 | execute-phase | The canonical test's tail asserts a SPEC-only plan snapshot is refused — the same retired pre-lane requirement the fix removes. The assertion flips to the new contract (SPEC-only builds; acceptance-only is refused) so the suite proves both directions of the binding-when-present rule.
justification | packages/agentic-workflow-schema/src/pre-execution.ts | P2 | 2026-10-05 | execute-phase | REQUIRED_ARTIFACTS.plan requires the acceptance manifest — a pre-lane artifact lane-era units structurally never write (issue #285). The plan required set becomes SPEC-only; the manifest binds when present. Digests, receipt grammar, and published vocabularies are untouched.
justification | packages/agentic-workflow-schema/package.json | P2 | 2026-10-05 | execute-phase | Version bump is mandatory and same-PR for any schema package change (AGENTS.md, Packages).
```

## Decision log

- **D-285-1 (2026-10-05)** — scope amendment discovered at P2: the Non-goals line
  "schema package untouched" was written against vocabularies/digests/receipt
  grammar. The plan-stage requiredness (`REQUIRED_ARTIFACTS`) lives in
  `packages/agentic-workflow-schema/src/pre-execution.ts` and is the authoritative
  half of the requiredness the fix relaxes — AC1 is impossible without it. Amended:
  the schema package's REQUIRED_ARTIFACTS + its pinning test + the package version
  bump are in scope; every other schema surface stays untouched.
