# testing — 32-review-consistency-pack

## Validation ladder

| Layer | Required evidence | Command or check |
|---|---|---|
| Sensor behaviour (P1) | a missing repository-state ledger yields a non-blocking notice, `blocking: false`, zero `repository-state` blockers, exit 0; `draft`/`contradicted`/`resolved` keep the substrate blocker, `state: BLOCKED`, and the `/discover-repository-state` recommendation; the merged feature 31 review-loop-cycle projection is unchanged | `node --test scripts/workflow-status-sensor.test.mjs` → exit 0 |
| Sensor regression (P1) | the pre-execution receipt/gate suite is unaffected by the NRS branch | `node --test scripts/workflow-status-pre-execution.test.mjs` → exit 0 |
| Contract text (P2) | flip attribution cited to `ledger-ownership@1` at the three claiming surfaces plus `fold-findings`; the `LEDGERS.md` prose matches its own map; `triage-issue`'s three modes named; `plan-feature` verifies while the scaffold writes; the `docs/workflow/` scan is empty; the workflow-status references state the same NRS split | `node --test scripts/review-loop-discipline.test.mjs` → exit 0 with the new pins; `grep -rnE "only step that ever flips\|one and only ledger state transition" docs/workflow/ --include=*.md` → no match |
| Ownership grammar (P2, P4) | the map keeps exactly seven truth classes, one declaration per ledger pattern, owner-cell equality with both projections | `node --test scripts/ledger-ownership.test.mjs` → exit 0 |
| Classification contract (P3) | the conversion section covers the four producer scales; an unknown scale fails closed; the ad-hoc finder mapping is gone and its pin is re-pointed; the four blocking citation categories and the no-citation outcome are pinned; D10 is unchanged; the `report-note` definition is cited to `LEDGERS.md` §3, never restated; `audit-docs` reports 14 checks with legend severities; `product-audit` uses the closed class set; `audit-pr`'s result scale reads `pass \| blocker \| n-a` | `node --test scripts/review-loop-discipline.test.mjs` → exit 0; `grep -n "MEDIUM" skills/audit-docs/SKILL.md` → no match; `grep -nE "postpone\|tradeoff" skills/product-audit/` → no match |
| Merge-gate regression (P3) | the receipt-at-head gate and its verdict contract are unchanged | `node --test scripts/audit-pr-receipt.test.mjs` → exit 0 |
| Roadmap contract (P2) | the roadmap status machine and the plan-feature wording rules still hold | `node --test scripts/bounded-delivery-loops.test.mjs` → exit 0 |
| Release bookkeeping (P4) | the `CHANGELOG.md` once-per-table collision resolved (feature 60's `pre-execution-review` row at 2.4.0, frontmatter 2.4.0) so the drift gate reaches exit 0 without extending the legacy exemption list; budgets re-based for every touched skill at the declared re-basis, new entries declared where a skill rode `defaults` | `node --test scripts/normative-drift.test.mjs` → exit 0; `node scripts/check-skill-context.mjs` → exit 0 |
| Qualification (P5) | the whole ladder green; mirror byte-identical; schema package regression-only; acceptance blob unchanged; README bibliography present | the full ladder, `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test` → exit 0, `cd packages/agentic-workflow-schema && bun run test` → exit 0, `git hash-object docs/features/32-review-consistency-pack/ACCEPTANCE.md` → the recorded blob |

## Mandatory scenario inventory

Each SPEC dev scenario resolves to the named phase's pins:

- **`sweep:empty-state`** — the AC-01 `docs/workflow/` scan plus the negative text
  pins: a tree that carries no stale restatement, and no pin that could pass on a
  stale one (P2).
- **`sweep:unknown-scale`** — the fail-closed pin feeding an undeclared severity
  scale; the consumer returns the finding for a missing table row and never
  converts it (P3).
- **`sweep:wrong-role-write`** — the sole-writer text pins against the
  `ledger-ownership@1` map, plus `scripts/ledger-ownership.test.mjs` (P2, P4).
- **`sweep:stale-head`** — the GATE-RAN reuse pin: identical HEAD reuses; a
  changed head re-runs (P4).
- **`sweep:additive-slots`** — the additive-slots and reserved-`manifest` pins:
  unknown trailing fields are ignored (P4).
- **`sweep:nrs-missing`** — the sensor fixture with no repository-state ledger:
  notice emitted, zero missing-ledger blockers, exit 0 (P1).

## Tooling

- bun-else-node runtime (repo convention); the node-compat CI job enforces the
  fallback, and every command above runs under both.
- The sensor suite's existing throwaway git-repo fixture harness
  (`scripts/workflow-status-sensor.test.mjs:83-130`) and its `gh` shim; no
  network in tests.
- All other checks are text assertions over the owned skill files read through
  `fs.readFileSync`, plus `grep` gates for the removed vocabularies.

## Execution evidence

Filled by `execute-phase` per phase; the acceptance blob receipt is recorded in
`progress.md` at first execution run.
