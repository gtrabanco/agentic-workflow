# testing — 30-repair-receipt-delta-review

## Validation ladder

| Layer | Required evidence | Command or check |
|---|---|---|
| Receipt contract (fold surface) | fixed REPAIR-RECEIPT block, field list, empty/failed-gate/frozen branches pinned verbatim in the skill texts | `node --test scripts/review-loop-discipline.test.mjs` (new receipt pin sections) |
| Classification vocabulary | batch-class field uses only `review-implementation`'s closed class set | `grep -c "replan-in-unit" skills/review-implementation/references/CLASSIFY.md` ≥ 1 before/after + discipline suite |
| Delta review surface | delta default, escalation triggers + observed numbers, genuinely-new dedupe, cap counts deltas | same discipline suite (delta/escalation/cap sections) + `node --test scripts/bounded-delivery-loops.test.mjs` |
| Durable mark contract | recheck-cell consumption note pinned; `finding-mark@1` shape, `VF-` exclusions, single writer unchanged | discipline suite + `node --test scripts/ledger-ownership.test.mjs scripts/ledger-provenance.test.mjs` (fixture-backed annotator behavior, not prose assertions) |
| Ledger truth classes | no new ledger row type or owner; the receipt adds no persisted row | `node --test scripts/ledger-ownership.test.mjs` + `node --test scripts/pre-execution-quality.test.mjs` |
| Normative surfaces | versioned grammars declared; no surface restates a stale skill/package version | `node --test scripts/normative-drift.test.mjs` |
| Context/installability | bumped skills within budgets; distribution parity | `node scripts/check-skill-context.mjs`; `npx skills add . --list` |
| Untouched surfaces | `audit-pr` and the schema package byte-untouched | `node --test scripts/audit-pr-receipt.test.mjs`; schema `npm test`; empty `git diff --name-only main...HEAD -- packages/agentic-workflow-schema skills/audit-pr` |
| Pi distribution | canonical bundle parity and package behavior | `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test` |
| Bilingual sync | EN/ES narrative + MIGRATION note in the same change | read-verified at PR time (switcher links intact) |

## Mandatory scenario inventory

Each dev scenario from the SPEC (`### Dev scenarios`) resolves to the named
phase's pins:

- **fold:empty-batch** — a unit whose `review-findings.md` has zero `folded: no`
  rows: invoking `/fold-findings` prints the receipt with `none` class and the
  OPTIONAL branch. Pinned in P1 (empty-batch branch pins).
- **fold:failed-gate** — the project gate is red at fold time (stub: break a
  test on a scratch branch): the receipt prints with the observed exit codes
  and nothing folded. Pinned in P1 (failed-gate branch pins).
- **fold:freeze-batch** — the queue contains a `replan-in-unit` row: no flips,
  no commits, REPLAN-ROUTE with retained ids. Pinned in P1.
- **review:delta-default** — a REQUIRED (delta) receipt precedes the review:
  `review-change` re-verifies folded rows at cited locations and reviews the
  fold diff only. Pinned in P2.
- **review:escalation-width / review:escalation-size** — a fold diff with a
  changed file outside the cited union (or a changed line >50 lines from cited
  lines) / exceeding 200 lines or 15 files escalates to a full pass naming the
  trigger + numbers. Pinned in P2.
- **review:same-location-re-report** — a same-`file:line`+axis candidate inside
  delta scope becomes `regression of <id>` or `DISPUTED`, never a plain new
  row. Pinned in P2 (extends the existing cycle-2 rule).
- **fold:unmaterializable-recheck** — a `finding-mark@1` `recheck` cell naming
  no runnable method → `BLOCKED` with the missing input named. Pinned in P1.
- **n/a: permission denied / wrong role** — no runtime permission surface
  exists; the role matrix (SPEC Capability closure) already denies
  reclassification to the reviewer and receipt emission to non-folders, and the
  no-reclassification pins cover it.
- **n/a: concurrent/duplicate fold turns** — the workflow is single-writer per
  turn (one fold agent owns the queue); the ledger's one-owner map
  (`fold-findings:folded-flag`) plus `REOPENED` annotations cover provenance
  failures; no new runtime concurrency model is introduced.
- **n/a: dependency outage** — a missing forge/network is covered by the
  existing `REVIEW BLOCKED` workspace precondition and BLOCKED verdicts; the
  receipt's gate field records observed exit codes, which is the same
  evidence path.

## Test discipline

- Pins are red-first: written before the skill text they assert, made green by
  the same phase's edit; never edited to pass (test-immutability contract).
- Every existing pin must keep passing; a pin may only be strengthened.
- The `--check`/`--json` annotator behaviors are proven against the seeded
  fixture (`scripts/fixtures/finding-mark-ledger.md`), never asserted from
  prose alone.
