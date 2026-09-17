# fix/182-deterministic-receipts-and-pr-hygiene

> Fix specification. Copy of `docs/fix/_TEMPLATE/SPEC.md` filled per issue
> #182. Registered in `docs/fix/README.md` (`pending`). Fix unit — no Product
> half exists; its authority is reproduction, root cause, regression scope,
> rollback path, and the affected use case.

## Goal

Replace the three prose contracts that let a review verdict be *reported* while
it was not *recorded*, and that gave terminal hygiene no owner at merge time,
with deterministic runtimes:

1. `review-change` closed its final review by hand-assembling a
   `review-change:pass` PR comment (post → re-read → retry) — a prose loop
   nothing checked, pinned only by a test that reimplemented the marker
   grammar. `scripts/review-receipt.mjs` becomes the emitter: `emit` refuses a
   PR whose head moved, posts idempotently, re-reads, and exits non-zero unless
   the newest marker names the reviewed head.
2. `audit-pr`'s gate set, verdict, and `audit-pr:merge-ready` comment were prose,
   and tree-clean / branch-pushed / pr-ready were assumptions, not gates.
   `scripts/audit-pr-gate.mjs` becomes the runtime: a closed gate set with
   receipt currency first, and three terminal-hygiene gates read from state.
3. `/log-session` left its `docs/LOGS.md` entry uncommitted *by design*, which is
   the foreign dirty path a later review refused. `scripts/session-close.mjs`
   proves the append, commits the log alone, and names every leftover path.

This is the unit already cut on branch `fix/182-deterministic-receipts-and-pr-hygiene`;
its runtime change landed as `c541aac5` (2026-09-17), and the phases below carry
each delivered surface to its validator and close the unit.

## Issue

#182 — tracked issue in the project's forge (label `bug`, severity medium). The
PR must close it via `Closes #182` in the body.

The issue's declared scope is wider than this unit (the affecting-path manifest
CLI family of amendments 1–4). That remainder is routed, not absorbed — see
`### Out of scope` and `## Cross-issue notes`, which flags a required owner
decision about roadmap row 35 before merge.

## Branch

`fix/182-deterministic-receipts-and-pr-hygiene`, cut from `main` (`d63e9b12`).
The runtime body of the fix already landed on this branch in `c541aac5`; the
phases below are the unit's verification and close-out ledger.

## Depends on

None. The delivered runtimes depend only on `scripts/` plus the standard Node
runtime; they import nothing from the schema package's digest machinery (that
machinery belongs to the routed affecting-path manifest scope), so the issue's
declared feature-30/31/32 and #179 prerequisites do not gate this unit.

## Root cause

Three contracts that were prose where they had to be mechanical:

1. **The review receipt was a prose loop.** `PERSIST_AND_DECIDE.md` step 12 (the
   bytes `c541aac5` replaced) instructed a model to derive the decision, write
   the fixed body to a temp file, run `gh pr comment --body-file <path>`, then
   re-read the comments and retry on a failed confirmation — with "do not print
   a `REVIEW-PASS` report while the receipt is not current" as a sentence, not a
   gate. `scripts/audit-pr-receipt.test.mjs` proved a **local reimplementation**
   of the marker grammar, so the test and the runtime could drift apart.
2. **The merge gate had no runtime and half a gate set.** `audit-pr`'s gates,
   verdict precedence, and merge-ready comment lived only in
   `skills/audit-pr/references/03_AUDIT_PROCESS.md`; the hygiene dimensions the
   canonical turn contract box 5 assumes (`git status --porcelain` clean, branch
   not ahead of remote, PR not a draft) were not named as gates anywhere, so
   nothing checked them at merge time.
3. **The session log was dirty by design.** `log-session` SKILL.md step 5 (the
   bytes `c541aac5` replaced) said the entry "rides along with the next commit",
   so a session log append from another conversation left a tracked, dirty
   `docs/LOGS.md` in a shared checkout — exactly the path `review-change`'s
   repo-global workspace precondition refuses.

## Detected in

Session log `docs/LOGS.md`, entry `2026-09-17T23:17Z —
fix/182-deterministic-receipts-and-pr-hygiene — manual` (`8f151bc0`): while
auditing PR #240 (feature 55), `review-change` returned `REVIEW-PASS` twice while
no current receipt existed, because step 12 assembled the receipt in prose. The
same log records the follow-up audit-pr `BLOCKED` loop this unit unblocks.

## Scope

### In scope

1. **Deterministic receipt runtime** (`scripts/review-receipt.mjs`, P1): the
   pure marker grammar and `render` / `verify` / `emit` commands; `emit` refuses
   a moved head, posts once via `--body-file -`, re-reads, and exits non-zero
   unless the newest `review-change:pass` marker names the reviewed head;
   `verify` exits `0` current / `3` absent / `4` stale.
2. **Deterministic merge-gate and hygiene runtime** (`scripts/audit-pr-gate.mjs`,
   P1): a closed 13-name gate set (the ten historical gates plus `tree-clean`,
   `branch-pushed`, `pr-ready`); the receipt-currency check precedes the gate
   set; `comment` refuses a BLOCKED verdict and confirms the landed marker;
   `hygiene` reads tree / branch / draft state and applies only the `gh pr ready`
   mechanical repair.
3. **Deterministic session close** (`scripts/session-close.mjs`, P1): `render`
   computes the git facts and prints the entry without writing; `close` refuses
   a log that was not appended to, commits `docs/LOGS.md` **alone**, and names
   every path still uncommitted — never `git add -A`.
4. **Single grammar owner** (P1): `scripts/audit-pr-receipt.test.mjs` imports the
   runtimes instead of redefining the marker grammar and gate functions, so its
   pre-existing assertions bind the code the skills run.
5. **Pi extension guard** (`packages/pi-agentic-workflow/src/extension/receipt-guard.ts`,
   P2): blocks the unverifiable inline receipt path and warns once per settled
   turn on a dirty worktree; the bundled skills mirror is refreshed with the
   rewritten skill bytes.
6. **Skill wiring** (P3): `review-change`, `audit-pr`, and `log-session` name the
   runtimes as the box/step; version bumps (`review-change` 3.6.0, `audit-pr`
   5.2.0, `log-session` 2.2.0, pi package 0.11.0); `CHANGELOG.md` rows; the
   `audit-pr` route ceiling re-baselined with a declared source.

### Out of scope

- **The affecting-path manifest CLI family** — the issue's expected behaviour 1
  (affecting-surface workspace precondition), the path-digest `sign`/`verify`
  scoped receipt binding of amendment 1, and the forge-closure facts of
  amendment 2: routed to roadmap row 35 `scoped-receipt-verifier` (feature, `idea`).
  Those surfaces need a new deterministic CLI beside
  `scripts/pre-execution-snapshot.mjs`, reusing the schema package's digest
  functions; that is a feature-scale unit, not this fix.
- **Review-findings ledger subcommands** (amendment 3: `append`, `flip`,
  `emit-receipt`): routed to roadmap row 35 with the same CLI family.
- **Escalation payload fields** (issue comment, `escalation: { cause,
  finding_ids[], refuter_outcomes? }`) and **planning-evidence freshness fields**
  (audit addition of 2026-09-15): both are additive receipt-schema fields owned
  by the routed CLI family; no schema change lands here.
- **Canonical turn-contract box 5 rewrite**: the issue itself sequences this to
  feature 33 (`#173`, `turn-contract-single-owner`), which migrates every bespoke
  turn contract once against the final text. Rewriting box 5 here would be the
  double migration #173 exists to avoid.
- **Schema-package README mirror** (issue AC 6): `n/a` — this unit changes no
  schema, envelope field, or generated projection.
- **The other foreign-dirt classes** (`.engram/`, `.pi/`, `.serena/`, session
  markers, a foreign docs edit outside the log): the same routed precondition
  scope; this unit removes the *log* source and makes the terminal state
  checked, and does not classify dirt.

### Planning evidence

The fix's own authority: reproduction, root cause with code evidence, regression
scope, rollback path, and the affected invariant or use case — one compact row
each.

| id | claim-or-obligation | authority-kind | source-and-location | observed-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|---|
| PE-001 | Reproduction: `review-change` can report `Decision: REVIEW-PASS` and recommend `/audit-pr` while no current receipt exists, because step 12 assembled, posted, re-read and retried the receipt comment in prose, and the marker grammar was pinned only by a local reimplementation inside the receipt test | repository | `skills/review-change/references/PERSIST_AND_DECIDE.md` step 12 (pre-`c541aac5` bytes); `skills/review-change/SKILL.md` receipt box (pre-`c541aac5` bytes); `scripts/audit-pr-receipt.test.mjs` (pre-`c541aac5` bytes, local `REVIEW_MARKER_RE`) | `c541aac5^` | O1, O2, AC1, AC2 | current | proven | — |
| PE-002 | Root cause: the receipt, the merge gate and the session close were instructions to a model, not runtimes — nothing made a reviewer mechanically unable to end its turn without a current receipt, nothing evaluated the merge gate set deterministically, and `log-session` step 5 left `docs/LOGS.md` dirty by design | repository | `skills/review-change/references/PERSIST_AND_DECIDE.md` step 12; `skills/audit-pr/references/03_AUDIT_PROCESS.md` step 2–7 (pre-`c541aac5` bytes); `skills/log-session/SKILL.md` step 5 (pre-`c541aac5` bytes) | `c541aac5^` | O1, O3, O4, O5, AC1, AC3, AC4 | current | proven | — |
| PE-003 | Regression scope: the change is confined to `scripts/` (three new runtimes plus tests), the four rewritten skill files under `skills/`, the pi package's extension guard and bundled mirror, `CHANGELOG.md`, and `docs/workflow/SKILL_CONTEXT_BUDGETS.json`; no schema package byte, no envelope contract, and no application runtime path changes | repository | `git show --stat c541aac5` → 26 files; `grep -rn "review-receipt\|audit-pr-gate\|session-close" skills/ packages/pi-agentic-workflow/src` | `c541aac5` | O1–O9, AC1–AC8 | current | proven | — |
| PE-004 | Rollback path: one `git revert` of the fix commit restores the three prose paths and the pre-fix skill bytes; data cleanup: none (no schema, no migration, no persisted state); preserved: the receipts and logs already posted (a posted PR comment is forge history, untouched by the revert) | derived | rule "single-commit revert", inputs PE-002 + PE-003; `git log --oneline -1 c541aac5` | — | O1–O9, AC1–AC8 | not-applicable | decision | — |
| PE-005 | Affected use case/invariant: a review verdict must be a forge-visible, SHA-bound record before the report recommends a merge gate, and a merge gate must read hygiene from state instead of assuming it — the invariant this unit makes mechanical | repository | `skills/review-change/SKILL.md` receipt box; `skills/audit-pr/references/01_MERGE_GATES.md` hygiene rows (`c541aac5`); `skills/orchestration-envelope/references/TURN_CONTRACT.md` box 5 | `c541aac5` | O1, O3, O4, O7, AC1, AC3, AC6 | current | proven | — |
| PE-006 | User directive: the branch is pushed and needs `/plan-fix 182` to produce the unit's SPEC/ACCEPTANCE and open the PR; the unit is the deterministic-receipts-and-pr-hygiene branch, not the full affecting-path CLI family | repository | `docs/LOGS.md` entry `2026-09-17T23:17Z — fix/182-deterministic-receipts-and-pr-hygiene — manual` (`8f151bc0`), `**Next:**` line | `8f151bc0` | O1–O9, AC1–AC8 | current | proven | — |
| PE-007 | Detected in the field: while auditing PR #240 (feature 55), `review-change` returned `REVIEW-PASS` twice with no current receipt; the audit-pr loop then blocked; the fix was built in a separate worktree because two live sessions were committing to `feat/55-executable-golden-fixture` | repository | `docs/LOGS.md` entry `2026-09-17T23:17Z … — manual` (`8f151bc0`), `**Summary:**` + `**Decisions:**` lines | `8f151bc0` | O1, O3, AC1, AC3 | current | proven | — |
| PE-008 | The marker grammar now has one owner: `scripts/audit-pr-receipt.test.mjs` imports `scripts/review-receipt.mjs` and `scripts/audit-pr-gate.mjs`, so its long-standing assertions execute the code the skills invoke rather than a copy | repository | `scripts/audit-pr-receipt.test.mjs` import lines; `scripts/review-receipt.mjs` `REVIEW_MARKER_RE`; `scripts/audit-pr-gate.mjs` `GATE_NAMES` | `c541aac5` | O2, O3, AC2, AC3 | current | proven | — |
| PE-009 | The routed remainder is real, separate work: roadmap row 35 `scoped-receipt-verifier` (`idea`) describes the affecting-path receipt binding as one deterministic CLI beside `pre-execution-snapshot.mjs`, and it cites #182 as its tracked issue — a row/issue-boundary decision this SPEC flags rather than silently resolves | document | `docs/features/ROADMAP.md` row 35; `docs/fix/README.md` history (`2264b454`, AD-2 dropped the stale #182 row because the issue was re-registered as row 35) | `d63e9b12` | AC9, `## Cross-issue notes` | current | proven | — |
| PE-010 | Context budgets are enforced by file: `docs/workflow/SKILL_CONTEXT_BUDGETS.json` carries the per-route ceiling and `sources` map, and `scripts/check-skill-context.mjs` fails the gate when a route exceeds it | repository | `docs/workflow/SKILL_CONTEXT_BUDGETS.json` (`audit-pr` / `audit-pr:fix` entries); `scripts/check-skill-context.mjs` | `c541aac5` | O8, AC7 | current | proven | — |

### Obligations

One row per normative behaviour, applicable invariant, affected use case, and
required failure state. Status is `planned | in-progress | verified | n/a |
deferred`; `n/a` requires evidence, and no row is `deferred` to a follow-up issue.

| obligation-id | Authority source | Affected use case or invariant | Phase | Task | Implementation owner | Validator | Required evidence | Status |
|---|---|---|---|---|---|---|---|---|
| O1 | PE-001 + PE-002 + PE-005 | A `REVIEW-PASS` cannot be reported without a current, SHA-bound receipt: `emit` refuses a moved head and exits non-zero unless the newest marker names the reviewed head | P1 | 1 | execute-phase | AC1 validator (`node --test scripts/review-receipt.test.mjs`) → exit 0 | test count + exit code in progress.md | planned |
| O2 | PE-001 + PE-008 | The receipt marker grammar has exactly one owner: the receipt test imports the runtime instead of redefining the grammar | P1 | 3 | execute-phase | AC2 validator (import grep + receipt test exit 0) | grep output + test count in progress.md | planned |
| O3 | PE-002 + PE-005 | The merge gate is a closed, machine-evaluated set, and an absent or stale receipt blocks before any gate is read | P1 | 4 | execute-phase | AC3 validator (`node --test scripts/audit-pr-receipt.test.mjs`) → exit 0 | test count + exit code in progress.md | planned |
| O4 | PE-002 + PE-005 | Terminal hygiene is read from state, not assumed: `tree-clean`, `branch-pushed`, `pr-ready` are gates, and only the draft flag has a mechanical repair | P1 | 5 | execute-phase | AC4 validator (`hygiene --apply` on a clean fixture → exit 0; a dirty path names itself) | command output in progress.md | planned |
| O5 | PE-002 + PE-006 | A session close commits the log entry alone and names every leftover path; a rewritten or unappended log is refused | P1 | 6 | execute-phase | AC5 validator (`node --test scripts/session-close.test.mjs`) → exit 0 | test count + exit code in progress.md | planned |
| O6 | PE-002 + PE-006 | The pi extension blocks the unverifiable inline receipt path and warns once per settled turn on a dirty worktree | P2 | 1 | execute-phase | AC6 validator (`cd packages/pi-agentic-workflow && bun run test`) → exit 0 | test count + exit code in progress.md | planned |
| O7 | PE-005 + PE-006 | The three skills name the runtimes as their box/step, so no prose path remains for a reviewer to end a turn through | P3 | 1 | execute-phase | AC7 validator (three greps → ≥ 1 each) | grep output in progress.md | planned |
| O8 | PE-010 + PE-006 | The bundled skills mirror stays byte-identical to `skills/` and every route stays within its enforced context budget | P2 | 4 | execute-phase | AC8 validator (`bun scripts/check-skill-context.mjs` → exit 0; pi suite mirror parity) | command output in progress.md | planned |
| O9 | PE-006 + PE-009 | The fix-index row flips to `done` with the PR link after the PR opens, and the flagged row-35 boundary is carried to the reviewer | P4 | close-out | execute-phase | AC9 validator (grep the row) → 1 | `docs/fix/README.md` row | planned |

## Acceptance

Frozen manifest: `docs/fix/182-deterministic-receipts-and-pr-hygiene/ACCEPTANCE.md` · Blob: `d73d7a1bef9c90554924c566f58863c903399efa` · Status: frozen · Recorded at plan cut 2026-09-17.

Objective, verifiable conditions for "done". Each criterion is a runnable
command with an expected outcome; the record of each run is greppable in the
unit progress file.

### Spec-lint (mechanical — presence checks only)

Run by `plan-fix` before committing the draft; fail-closed, no quality
judgement.

- [x] No template placeholders left — the `### P1` scaffold lines are replaced, not kept (the literal `Hardening & PR` chain keeps the template's own pre-written tokens per the phase contract).
- [x] `### Out of scope` has ≥ 1 concrete bullet (six, each with its route).
- [x] Every `## Acceptance` criterion is a runnable command with an expected outcome.
- [x] Every phase passes the 8-box Phase-lint below (the final close-out phase carries only the literal chain, per `skills/phase-contract/SKILL.md`).
- [x] `### Planning evidence` has a `current` row for the reproduction (PE-001), the root cause (PE-002), the regression scope (PE-003), and the rollback path (PE-004) — none blank, none `n/a`.
- [x] `### Obligations` has one row per normative behaviour, applicable invariant, affected use case, and required failure state, each with a phase and a validator; no `deferred` row and none exported to a follow-up issue.

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | The receipt runtime is a pure grammar beside one forge adapter: `render` prints the fixed SHA-bound body without a forge call; `verify` answers current / absent / stale with exit `0` / `3` / `4`; `emit` refuses a PR head that differs from the reviewed head and refuses a malformed argument set. | `node --test scripts/review-receipt.test.mjs` → exit 0 |
| AC2 | The receipt marker grammar has one owner: `scripts/audit-pr-receipt.test.mjs` imports the runtime rather than redefining `REVIEW_MARKER_RE`, and its assertions pass against that runtime. | `grep -c "review-receipt.mjs" scripts/audit-pr-receipt.test.mjs` → ≥ 1 and `node --test scripts/audit-pr-receipt.test.mjs` → exit 0 |
| AC3 | The merge gate is a closed set and receipt currency precedes it: the gate names are exactly the ten historical gates plus `tree-clean`, `branch-pushed`, `pr-ready`; an absent or stale receipt returns `BLOCKED` with `gatesEvaluated: false`; `MERGE-READY` requires every gate `pass`; a BLOCKED verdict posts no comment. | `node --test scripts/audit-pr-receipt.test.mjs` → exit 0 |
| AC4 | Terminal hygiene is derived from state: a clean tree, a level branch and a non-draft PR pass; a dirty path is named in the blocker; an unpushed branch names its commit count; `--apply` runs only the `gh pr ready` repair. | `node scripts/audit-pr-gate.mjs hygiene` → exit 0 on a clean tree and names each dirty path otherwise |
| AC5 | Session close is append-only and single-file: `render` writes nothing; `close` refuses a log that was not appended to, commits `docs/LOGS.md` alone with a `docs(log):` subject, and reports every remaining path with exit `2` (exit `0` when none remain). | `node --test scripts/session-close.test.mjs` → exit 0 |
| AC6 | The pi extension guard blocks the unverifiable inline receipt path and warns once per settled turn on a dirty worktree, and the package suite (including the bundled mirror parity check) is green. | `cd packages/pi-agentic-workflow && bun run test` → exit 0 |
| AC7 | The three skills name their runtime: `review-change` the receipt emitter, `audit-pr` the hygiene gate runtime, `log-session` the session-close command — no prose receipt/comment path remains as the box. | `grep -c "review-receipt.mjs emit" skills/review-change/SKILL.md` → ≥ 1; `grep -c "audit-pr-gate.mjs hygiene" skills/audit-pr/SKILL.md` → ≥ 1; `grep -c "session-close.mjs close" skills/log-session/SKILL.md` → ≥ 1 |
| AC8 | Every skill route stays inside its enforced context budget, and the committed pi mirror stays byte-identical to `skills/`. | `bun scripts/check-skill-context.mjs` → exit 0; `cd packages/pi-agentic-workflow && bun run test` → exit 0 (alias-coverage reads both trees) |
| AC9 | The fix-index row for #182 is registered and, after the PR opens, reads `done` with the PR link in the index's backticked done-row convention; the SPEC names the row-35 boundary decision for the reviewer. | `grep -cE "\[#182\]\(https://github.com/gtrabanco/agentic-workflow/issues/182\) \| deterministic-receipts-and-pr-hygiene \| " docs/fix/README.md` → 1 |

## Phases

Execution ledger — `execute-phase --fix 182` runs **all remaining phases by
default** and ticks tasks here; an explicit phase argument (e.g. `P2`) runs
exactly one phase. Each task names a delivered surface and the evidence that
proves it; the executor re-runs the validator and ticks.

### Phase-lint (owned by `skills/phase-contract/SKILL.md`)

Every implementation phase below passes all 8 boxes before it is emitted
(planner skills) or executed (`execute-phase` pre-flight). The final close-out
phase carries only the literal hardening chain, per the contract's authorized
`Hardening & PR` exception.

Lint output (`node scripts/phase-lint.mjs docs/fix/182-deterministic-receipts-and-pr-hygiene/SPEC.md`, exit 0):

```text
P1 Phase-lint: PASS (8/8) · fingerprint P1:config/infra:6:deterministic-receipt-runtime-family
P2 Phase-lint: PASS (8/8) · fingerprint P2:config/infra:4:pi-extension-receipt-guard
P3 Phase-lint: PASS (8/8) · fingerprint P3:docs:6:skill-wiring-to-runtime-family
P4 Phase-lint: PASS (8/8) · fingerprint P4:hardening:8:hardening-pr
verdict PASS
fingerprint: a4244d3853e066ec83eabb719707ee65386da31a51249d10ab7c6804ea360994
```

### P1 — Deterministic receipt runtime family

Layer: `config/infra`. Done-when:
`node --test scripts/review-receipt.test.mjs scripts/session-close.test.mjs scripts/audit-pr-receipt.test.mjs`
→ exit 0.

- [ ] `scripts/review-receipt.mjs` implements the pure receipt grammar beside one forge adapter, and the `render` / `verify` / `emit` commands (O1)
- [ ] `scripts/review-receipt.mjs` `emit` refuses a PR head that differs from the reviewed head and exits non-zero unless the newest marker names that head (O1)
- [ ] `scripts/audit-pr-receipt.test.mjs` imports the runtime grammar and gate functions instead of redefining them (O2)
- [ ] `scripts/audit-pr-gate.mjs` declares the closed 13-name gate set with receipt currency before the gate set (O3)
- [ ] `scripts/audit-pr-gate.mjs` `hygiene` reads tree / branch / draft state and applies only the PR-ready mechanical repair (O4)
- [ ] `scripts/session-close.mjs` `close` refuses a log that was not appended to, commits the log alone, and names every leftover path (O5)

Phase-lint: PASS (8/8) · fingerprint `P1:config/infra:6:deterministic-receipt-runtime-family`

### P2 — Pi extension receipt guard

Layer: `config/infra`. Done-when: `cd packages/pi-agentic-workflow && bun run test`
→ exit 0.

- [ ] `packages/pi-agentic-workflow/src/extension/receipt-guard.ts` exposes the pure guard for the inline receipt path and the dirty-worktree warning (O6)
- [ ] `packages/pi-agentic-workflow/src/extension/index.ts` wires the guard into the extension lifecycle (O6)
- [ ] `packages/pi-agentic-workflow/test/receipt-guard.test.mjs` pins every guard decision (O6)
- [ ] `packages/pi-agentic-workflow/skills/` mirror refreshed from `skills/` so both trees stay byte-identical (O8)

Phase-lint: PASS (8/8) · fingerprint `P2:config/infra:4:pi-extension-receipt-guard`

### P3 — Skill wiring to the runtime family

Layer: `docs`. Done-when: `bun scripts/check-skill-context.mjs` → `PASS context
budgets: <count> skills`.

- [ ] `skills/review-change/SKILL.md` names the receipt emitter as the final-review box (O7)
- [ ] `skills/review-change/references/PERSIST_AND_DECIDE.md` runs the emitter instead of assembling the body (O7)
- [ ] `skills/audit-pr/SKILL.md` and `skills/audit-pr/references/03_AUDIT_PROCESS.md` name the gate runtime and the three hygiene gates (O7)
- [ ] `skills/log-session/SKILL.md` commits its entry through the session-close command (O7)
- [ ] `docs/workflow/SKILL_CONTEXT_BUDGETS.json` re-baselines the `audit-pr` route ceiling with a declared source (O8)
- [ ] `CHANGELOG.md` carries one row for the `review-change` / `audit-pr` / `log-session` bumps (O7)

Phase-lint: PASS (8/8) · fingerprint `P3:docs:6:skill-wiring-to-runtime-family`

### P4 — Hardening & PR

Layer: hardening · Done-when: `git status --porcelain -- docs/` → empty, and the
project verification gate commands exit 0.

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Carry the roadmap row-35 boundary decision to the reviewer, and set the fix-index row status to `done` only when the PR opens
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a Markdown file, real backticks, never inline `--body`/heredoc) and PRINT THE PR URL in the chat; the body includes `Closes #182`
- [ ] Update the fix-index row to `` `done` · [#<pr>](<pr-url>) ``
- [ ] Commit `docs: link PR #<n>` and push

Phase-lint: PASS (8/8) · fingerprint `P4:hardening:8:hardening-pr`

## Testing

The regression gate is the three red-first suites the fix shipped plus the pi
package suite: `scripts/review-receipt.test.mjs` (pure grammar, idempotent post
decision, moved-head refusal, exit codes), `scripts/session-close.test.mjs`
(append-only proof, single-file commit, leftover reporting),
`scripts/audit-pr-receipt.test.mjs` (imports the runtimes; gate set, verdict
precedence, comment action, hygiene derivation), and
`packages/pi-agentic-workflow/test/receipt-guard.test.mjs`. No heavy mocking:
the forge is exercised through the pure exported decisions, and the CLI paths
take `--comments-json` / `--gates-json` fixtures instead of a live PR. The root
suite (`node --test scripts/*.test.mjs`) and `bun scripts/check-skill-context.mjs`
remain the project gate.

### Failure scenarios

Each failure category this SPEC names points at the phase and validator that
exercises it.

| Failure state | Phase · task | Validator |
|---|---|---|
| The PR head moved between review and receipt | P1 · 2 | AC1 (`emit` refusal test in `scripts/review-receipt.test.mjs`) |
| No receipt, or a receipt at another head, at the merge gate | P1 · 4 | AC3 (`audit-pr-receipt.test.mjs` verdict-precedence tests) |
| A dirty tree at the merge gate | P1 · 5 | AC4 (`hygiene` names each dirty path) |
| A branch ahead of its remote at the merge gate | P1 · 5 | AC4 (`hygiene` names the commit count) |
| A draft PR at the merge gate | P1 · 5 | AC4 (`hygiene --apply` runs the PR-ready repair only) |
| A rewritten or unappended session log | P1 · 6 | AC5 (`session-close.test.mjs` append-only tests) |
| An agent trying the inline, unverifiable receipt path | P2 · 1 | AC6 (`receipt-guard.test.mjs`) |

## Rollback

One `git revert` of the fix commit restores the three prose paths and the pre-fix
skill bytes. Data cleanup: none — no schema migration, no persisted state, and no
data written by the runtimes. Preserved: receipts and comments already posted are
forge history and are untouched by a revert, and the two red-first suites keep
their assertions. Lost: the mechanical guarantee, i.e. the unit's whole point.

## Status

`in-progress` — the runtime body landed on the branch in `c541aac5`; the phases
above verify each surface and close the unit.

(Removed from `docs/fix/README.md` only **after** the PR merges.)

## Rules that must never be violated

- The marker grammar and the gate set each have exactly one owner in code; a test
  pins the runtime, never a copy of it (`PE-008`).
- A receipt is bound to the head it reviewed: a moved head is refused, never
  silently re-posted (PE-005).
- A `BLOCKED` verdict posts no merge-ready comment — no stale green flag
  (`scripts/audit-pr-gate.mjs` `mergeCommentAction`).
- A session close commits `docs/LOGS.md` alone and never runs `git add -A`; a
  concurrent conversation's work is never swept into a log commit
  (`scripts/session-close.mjs`).
- No validator is weakened, skipped, or loosened to manufacture green
  (`verification-contract`).
- Artifacts are English-only (CLAUDE.md; NRS F011 / AD-002).
- Out-of-scope problems are routed (a separate fix/feature entry), never absorbed
  into this unit's phases.
- Never push or open the PR from the planning stage — that belongs to P4
  (`execute-phase --fix`).

## Impact

- **Layers**: tooling (`scripts/`, `config/infra`), project docs (`skills/`,
  `docs/workflow/`), and the pi package's extension layer (`config/infra`). No
  schema/db, domain, api, or ui surface.
- **Files**: `scripts/review-receipt.mjs` + `.test.mjs`,
  `scripts/audit-pr-gate.mjs`, `scripts/session-close.mjs` + `.test.mjs`,
  `scripts/audit-pr-receipt.test.mjs`; `skills/review-change/SKILL.md` +
  `references/PERSIST_AND_DECIDE.md`, `skills/audit-pr/SKILL.md` +
  `references/01_MERGE_GATES.md` + `references/03_AUDIT_PROCESS.md`,
  `skills/log-session/SKILL.md`; `packages/pi-agentic-workflow/src/extension/receipt-guard.ts`,
  `src/extension/index.ts`, `src/extension/factory.ts`,
  `test/receipt-guard.test.mjs`, `test/alias-coverage.test.mjs` and the bundled
  `skills/` mirror; `CHANGELOG.md`; `docs/workflow/SKILL_CONTEXT_BUDGETS.json`.
- **Blast radius**: every workflow turn that closes a review, audits a PR, or logs
  a session — the runtimes become the only path for those three closings. A
  defect in a runtime stops a review close-out or a merge gate, so the red-first
  suites are the protective surface.
- **Detection lead time**: immediate — the runtime's own exit code is the gate
  (`emit` non-zero = no receipt; `hygiene` exit 2 = blocked), and the root and pi
  suites run before merge.

## Operational risks

- **Live forge calls**: `emit`, `comment` and `hygiene --apply` call `gh`. A
  forge outage surfaces as exit 1 with the failing command named (never a silent
  pass); the pure decisions are testable offline through the JSON fixtures.
- **Concurrency in one checkout** (the field event): the fix removes the
  `docs/LOGS.md` dirt source and makes the terminal state checked. It does not
  classify other foreign dirt — that is the routed precondition scope — so a
  review can still stop on a foreign docs edit until row 35 lands.
- **Second runtime for one output**: the skills now instruct a command instead of
  prose; a stale installed skill tree would keep the old prose path until the
  release carries the new bytes (the pi mirror refresh and version bumps are in
  P2/P3 for exactly this).

## Security risks

n/a — no auth, secret, PII, webhook, or rate-limit surface. The receipt body
sanitizes interpolated values (`sanitizeValue`) so a quoted finding cannot forge
a marker, close an HTML comment early, or smuggle a shell interpolation into a
consumer that renders the body through a shell.

## Compliance touchpoints

n/a — stated explicitly per the fix contract.

## Affected docs

Every mapped doc update is an acceptance criterion: `skills/review-change/SKILL.md`
+ `references/PERSIST_AND_DECIDE.md`, `skills/audit-pr/SKILL.md` + its two
reference files, `skills/log-session/SKILL.md` (AC7); the bundled pi mirror
(AC6/AC8); `CHANGELOG.md` version rows (P3, verified by the release bookkeeping
convention); `docs/workflow/SKILL_CONTEXT_BUDGETS.json` (AC8);
`docs/fix/README.md` row lifecycle (AC9).

## Observability

- Green: `node --test scripts/*.test.mjs` → exit 0 and
  `cd packages/pi-agentic-workflow && bun run test` → exit 0; every receipt
  close-out prints the emitter's JSON with `status: current` and the reviewed
  head, and every merge gate prints the gate map and the hygiene triple.
- Silent failure caught: `review-receipt.mjs verify` answers `absent` (exit 3) or
  `stale` (exit 4) instead of a false current; `audit-pr-gate.mjs evaluate`
  returns `BLOCKED` with `gatesEvaluated: false`; `session-close.mjs close`
  refuses a non-append with exit 1 and names leftovers with exit 2;
  `scripts/check-skill-context.mjs` fails the route budget when the skill text
  grows past its ceiling.

## Cross-issue notes

- **Roadmap row 35 `scoped-receipt-verifier` (`idea`, issue #182)** — the routed
  remainder (affecting-path manifest CLI, ledger subcommands, escalation and
  freshness fields). **Decision required before merge (owner):** row 35 cites
  #182 as its tracked issue, so a `Closes #182` orphans the row into the
  #179-style "closed issue, open row" conflict. Choose one: re-point row 35 to a
  fresh issue, or keep #182 open and record this unit's closure elsewhere. This
  SPEC flags the conflict and does not resolve it (it cannot create or re-point
  forge rows).
- **Feature 33 `#173` `turn-contract-single-owner`** — owns the canonical
  box-5 rewrite and the one-time migration of every bespoke turn contract; this
  unit lands first, against final text, exactly as the issue sequences it.
- **Issue #186 (opt-in auto `log-session`)** — the mechanical pi entries are
  append-only and are swept by the terminal hygiene this unit gives `audit-pr`;
  disjoint surfaces (pi package vs canonical skills), parallel-safe.
- **Features 30/31/32 (#170/#171/#172) and #179** — the issue's declared
  prerequisites for the routed CLI family; the delivered runtimes import none of
  their surfaces, so this unit has no dependency edge on them.

## Effort

M — the runtime change plus three red-first suites, the pi guard, and the skill
wiring landed in one commit (`c541aac5`, 26 files); the remaining work in this
SPEC is verification and close-out, not new implementation.

## Decisions made during drafting

1. **Unit scope is the delivered branch, not the issue's full text.** The issue's
   amendments 1–4 (affecting-path manifest CLI, forge-closure facts,
   review-findings ledger subcommands, escalation/freshness fields) are a
   feature-scale unit the repository already routes to plan-feature (roadmap row
   35). This fix unit closes the deterministic-receipt/hygiene/session-close
   defect; the remainder is declared out of scope with its route.
2. **Box 5 is not rewritten here.** The issue assigns the canonical turn-contract
   rewrite to feature 33 (#173) so the contract migrates once; rewriting it here
   would force the double migration #173 exists to prevent.
3. **`Depends on` is empty.** The delivered runtimes reuse no schema digest
   machinery, so the issue's declared prerequisites bind the routed CLI family,
   not this unit.
4. **The fix-index row topic is `deterministic-receipts-and-pr-hygiene`**, taken
   from the branch and the landed commit, not the issue's older
   `scoped-workspace-state-binding` topic (dropped with the stale row in
   `2264b454`); folder and branch stay one name.
5. **The row-35 boundary is flagged, not repaired.** `plan-fix` cannot create or
   re-point a forge row; the decision belongs to the owner and is named in
   `## Cross-issue notes` and AC9.
6. **Phase tasks name the delivered surfaces and their validators.** The runtime
   body already landed in `c541aac5`; the phases are the verification and
   close-out ledger, so each task is checkable against the current tree rather
   than pretending the bytes do not exist.

## Planning preflight record

Preflight: Stage 1 — NRS consumed · arch: deferred

Preflight: NRS consumed · invariant classification: n/a (no project invariants declared)

Readiness (`evidence-grounding` `references/READINESS.md`, `stage: plan`):

```text
READINESS — fix 182-deterministic-receipts-and-pr-hygiene plan READY-FOR-REVIEW
- Artifact revision: ar-fix182-20260917-plan-1 · Rows checked: 10 evidence + 9 obligations · Unknowns open: 0
- Evidence: SPEC.md ### Planning evidence · Frozen: 2026-09-17
```

Box results: 1 `n/a` — a fix unit has no Product half and no parent SPEC to
parent (D6); 2 pass — frozen `ACCEPTANCE.md`, one ID per criterion, named
validators, blob `d73d7a1b` recorded; 3 pass — `## Impact` names the surfaces and
PE-001..PE-010 carry the code evidence, invariant classification `n/a` (NRS
F010); 4 pass — nine obligations, each one phase/task/owner/validator/evidence
row with a non-blank status; 5 pass — the evidence table is embedded in this
SPEC (XS/S home); 6 pass — `### Failure scenarios` maps every named failure state
to a phase and validator; 7 pass — phase-lint `PASS (8/8)` with all four
fingerprints recorded; 8 pass — no dependency edge, final phase is
`Hardening & PR`; 9 pass — rollback stated, no public contract change; 10 pass —
no unresolved decision word, and the one open boundary (roadmap row 35) is an
owned owner decision in `## Cross-issue notes`; 11 pass — every evidence row
`current`, zero unknowns open.

`artifactRevisionId`: `ar-fix182-20260917-plan-1` (this write; one id for the
SPEC + `ACCEPTANCE.md` + the fix-index row it touched).
