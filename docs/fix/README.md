# Active fixes

Index of in-progress and pending fixes. Merged fixes are removed from this
table — history lives in git log + closed issues.

## Status legend

- `pending` — SPEC drafted, branch not yet open
- `in-progress` — branch open, work ongoing
- `done` — built, PR open, awaiting merge (merge state lives in the forge — same
  meaning as the roadmap's `done`); the row is removed only **after** the PR merges

## Active

| Issue | Topic | Status | Notes |
|---|---|---|---|
| [#182](https://github.com/gtrabanco/agentic-workflow/issues/182) | deterministic-receipts-and-pr-hygiene | `done` · [#241](https://github.com/gtrabanco/agentic-workflow/pull/241) | The three prose closings become deterministic runtimes: `scripts/review-receipt.mjs` (a `REVIEW-PASS` cannot be reported without a current, SHA-bound receipt), `scripts/audit-pr-gate.mjs` (closed gate set with receipt currency first, plus the `tree-clean` / `branch-pushed` / `pr-ready` terminal-hygiene gates `audit-pr` now owns), `scripts/session-close.mjs` (the log entry is committed alone, never left riding along), and the pi extension guard. The issue's wider amendment family (affecting-path manifest CLI, ledger subcommands, escalation/freshness fields) is **descoped and routed to roadmap row 35 `scoped-receipt-verifier`**; because row 35 cites #182, the SPEC flags a required owner decision (re-point row 35, or keep #182 open) before merge — see `docs/fix/182-deterministic-receipts-and-pr-hygiene/SPEC.md` §Cross-issue notes. Depends on none for the delivered scope; lands before feature 33 (#173). |
| [#179](https://github.com/gtrabanco/agentic-workflow/issues/179) | declared-ledger-delta-receipts | `pending` | Execution-ledger amendments (SPEC tick flips, obligation `status` cells) become a declared class: the sensor answers `declared-delta` instead of voiding plan receipts, `audit-pr` warns non-blocking, verify-axis staleness findings fold. Depends on #170/#171/#172 (features 30/31/32) merging — dependency gate enforces at execution. **Issue-state conflict (flagged 2026-09-16, left for an owner decision — not silently dropped or repaired): the tracked issue is CLOSED while this row reads `pending`, and the unit folder's plan receipt `rp-fix179-20260907-003` (`plan-review-pass`) no longer verifies — `stale-context` over `CLAUDE.md` + `docs/workflow/REPOSITORY_STATE.md`. Resolution is either reopen the issue and re-pin the plan, or drop the row.** |

Historical artifacts remain under `docs/fix/`; merged and closed work is
intentionally absent from this index.

---

## Conventions

- Folder: `docs/fix/<issue-number>-<topic>/`
- Branch: `fix/<issue-number>-<topic>`
- Every fix has a tracked issue in the project's forge; the PR closes it via
  `Closes #<n>` (or the forge's equivalent auto-close convention).
- The row is removed from this table only **after** the PR merges — do not
  maintain history here.
- See `_TEMPLATE/SPEC.md` for the spec format.
- Workflow rules: the `execute-phase` skill's `--fix` mode (wherever your
  agent installed the skills).
