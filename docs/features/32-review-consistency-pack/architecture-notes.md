# architecture-notes — 32-review-consistency-pack

## Layer analysis

- **config/infra (P1)** — one branch of `scripts/workflow-status.mjs`: the
  `NRS_BLOCKING` set keeps `draft`/`contradicted`/`resolved` and the `missing`
  case emits `detail.substrate_notice` plus one `detail.workflow_observations`
  line, keeps `/discover-repository-state` in `alternatives`, and falls through
  to the normal state computation. The sensor stays read-only (no forge write,
  no file write; feature 38's read-only greps keep passing), and `detail` is
  schema-unconstrained, so the schema package and the envelope contract are
  untouched.
- **docs (P2, P3, P4)** — contract text only:
  `skills/pre-execution-review/references/LEDGERS.md` (corrected prose + the
  `gate-ran@1` mark + the extended `review-findings` owner cell), both
  `docs/*/_TEMPLATE/LEDGERS.md` projections, 
  `skills/review-implementation/references/CLASSIFY.md` (conversion table +
  derived blocking gate), the corrected flip wording in
  `skills/review-change/references/PERSIST_AND_DECIDE.md` and
  `skills/execute-phase/references/FOLDING.md`, `skills/fold-findings/SKILL.md`,
  the `audit-docs`/`product-audit`/`audit-pr`/`plan-feature`/
  `plan-feature-scaffold`/`review-change`/`workflow-status` text fixes.
- **hardening (P5)** — qualification only: ladder runs, mirror re-bundle +
  parity, acceptance-blob receipt, README bibliography, close-out.

## Contract impact

- **Ownership map.** The live map keeps exactly the seven AC16 truth classes;
  only the existing `review-findings` row's owner cell grows two column-sets
  (`execute-phase:gate-ran-marks`, `review-change:review-gate-ran-marks`), and
  both projections must carry the identical cell or
  `scripts/ledger-ownership.test.mjs` fails closed. No new truth class, no new
  ledger pattern.
- **Ledger row parsers.** The `gate-ran@1` mark is appended **text**, not a
  seventh-column row: the router reads only `|`-led rows with ≥ 7 cells and
  treats only `VF-`/`REVIEW-RAN` ids as marks, and the provenance annotator
  matches `^\|\s*(F\d+)\s*\|`. Neither parser is extended (ED-32-3).
- **Severity conversion.** One table, four producer scales, mapped onto the
  ledger scale `high | med | low`; `info` is the immaterial value and maps to
  `low`. An unknown scale fails closed. The closed class set
  (`fix-now | replan-in-unit | decision-required | proposal | ignore`) and D10's
  three-state verdict rule are unchanged.
- **NRS optionality.** Only the absent case degrades; the three real lifecycle
  states keep blocking. This aligns the sensor with the contract text that
  already declared NRS optional (`EXECUTION_CONTRACT.md`), reducing a run-scoped
  false blocker without weakening any real gate.
- **No schema, package, or public API change.** `packages/agentic-workflow-schema`
  is regression-only; the Pi mirror is regenerated from the skill tree.

## Preflight classification

```text
Preflight: Stage 1 — NRS consumed · arch: deferred
Preflight: NRS consumed · invariant classification: n/a (no project invariants declared — REPOSITORY_STATE.md F010)
```

`docs/architecture/ARCHITECTURAL_INVARIANTS.md` is absent (NRS F010), so the
project declares no architectural invariants. The applicable workflow-level rows
of `docs/workflow/WORKFLOW_INVARIANTS.md:78-80` are classified **preserves**:
`review-change` stays the final-diff authority (O16); the `review-change` +
`fold-findings` pair keeps its two-cycle bound and never merges or discards
findings (O18); `audit-pr` stays the sole MERGE-READY emitter and keeps
consuming CI (O17).

## Docs language

English-only interim (NRS F011 / AD-002): no `.es.md` sibling is created or
updated by this unit.
