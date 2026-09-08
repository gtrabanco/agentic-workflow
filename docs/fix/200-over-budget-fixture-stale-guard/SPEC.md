# fix/200-over-budget-fixture-stale-guard

> Fix specification for issue #200 — the `check-skill-context` "over-budget
> reference" fixture is stale on `main`: its hard-coded 10 000-character body
> now fits inside `review-change`'s grown reference ceiling, so the checker
> correctly exits 0 and the fail-closed assertion fails. No Product half: a
> fix unit's authority is reproduction, root cause, regression scope, and
> rollback.

## Goal

Restore the rot-proof property of the over-budget fixture in
`scripts/check-skill-context.test.mjs`: the generated reference must be
**over-budget by construction** — sized from the manifest's effective
`review-change` reference ceiling at runtime — instead of by a stale constant,
so the test exercises the checker's fail-closed refusal at any future ceiling
value. Without this, the suite is red on `main` (verified) and the repo's
context-budget gate cannot be run clean.

## Issue

`#200` — ["ISSUE: check-skill-context over-budget fixture is stale — the
fail-closed guard is no longer exercised on
main"](https://github.com/gtrabanco/agentic-workflow/issues/200)
(`bug`, opened 2026-09-08 by `gtrabanco`). The PR closes it via `Closes #200`.

## Branch

`fix/200-over-budget-fixture-stale-guard` (from `main` at `f48dff00`)

## Depends on

None. Independent of #198 (per-skill script relocation) and #196 (producer
package); see Cross-issue notes for the re-base rule.

## Root cause

`scripts/check-skill-context.test.mjs:78-83` — the `"over-budget reference"`
fixture writes a reference body of `"x".repeat(10_000)` into a copied
`review-change` tree. The checker computes a reference estimate as
`ceil(utf8-bytes / 4)` (`scripts/check-skill-context.mjs:69`) and compares it
against the **effective** budget — `manifest.defaults` merged with
`manifest.skills[skill]` (`scripts/check-skill-context.mjs:161`,
`docs/workflow/SKILL_CONTEXT_BUDGETS.json` → `defaults.referenceEstimateMax`
2200 overridden by `skills["review-change"].referenceEstimateMax` **2800**).
The fixture's 10 000-char body yields an estimate of ≈ 2502 ≤ 2800, so the
checker correctly exits 0 and `assert.notEqual(result.status, 0)` fails
(`scripts/check-skill-context.test.mjs:35`). `review-change`'s ceiling grew to
2800 in the re-basis recorded in the manifest's own provenance row
(`feature 30 / issue #170`, measured 2746); the fixture was never re-sized.

## Detected in

`main` as of `262d5cb5` — verified on a pristine tree (2026-09-08, issue #200
body) and re-verified on this branch's base (`f48dff00`): both
`node scripts/check-skill-context.test.mjs` and
`bun scripts/check-skill-context.test.mjs` fail with
`AssertionError: over-budget reference should fail closed` (`actual: 0,
expected: 0`). Surfaced while landing #197 (PR #199); **not introduced
there** — the PR's route re-basis does not touch this fixture.

## Scope

### In scope

- One fixture case in `scripts/check-skill-context.test.mjs`
  (`"over-budget reference"`, lines 78–83): replace the hard-coded
  10 000-char body with a body sized at runtime from
  `docs/workflow/SKILL_CONTEXT_BUDGETS.json`, using the same effective-budget
  merge the checker performs (`{ ...defaults, ...skills["review-change"] }`),
  and writing `"x".repeat(effectiveCeiling * 8)` — an estimate ≈ 2× the
  effective ceiling, over budget by construction.
- `docs/fix/README.md`: the `pending` index row for #200 (committed with this
  SPEC).

### Out of scope

- **The checker itself** (`scripts/check-skill-context.mjs`) — it is correct;
  the failing test is the fixture. Any ceiling raise/trim belongs to the
  manifest's declared re-basis process (policy `relative-headroom`, rules in
  `docs/workflow/SKILL_CONTEXT_BUDGETS.json`).
- **Other fixtures in the same test file** — the remaining nine+ failure
  fixtures (nested, missing, unreachable, heading, route, headroom…) all pass
  and stay untouched; a regression pin for them would be new work.
- **Ceiling re-basis or SKILL trim work** — issue #176 (route budget
  slimming) and debt item D2 own that; this fix does not touch any ceiling.
- **#198 / #196** (per-skill script relocation; producer package) — separate
  features that may move where `scripts/check-skill-context.*` lives; this
  fix does not relocate anything.

### Planning evidence

| id | claim-or-obligation | authority-kind | source-and-location | observed-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|---|
| PE-001 | The suite is red on `main`/base: the over-budget fixture's checker run exits 0 and `assert.notEqual(result.status, 0)` (test line 35) throws `AssertionError` | repository | `scripts/check-skill-context.test.mjs:35,78-83`; reproduced 2026-09-08 on `f48dff00` via `bun scripts/check-skill-context.test.mjs` | `f48dff00` | AC1 (guard exercised again) | current | proven | — |
| PE-002 | Root cause: 10 000-char body → estimate ≈ 2502 ≤ effective ceiling 2800, so the checker correctly exits 0; ceiling grown by the re-basis recorded in the manifest's own provenance (measured 2746) | repository | `scripts/check-skill-context.mjs:69,161,206-207`; `docs/workflow/SKILL_CONTEXT_BUDGETS.json` (`defaults.referenceEstimateMax` 2200, `skills["review-change"].referenceEstimateMax` 2800 + `referenceSources`) | `f48dff00` | OB-1, AC2 | current | proven | — |
| PE-003 | The issue's fix sketch ("body of `ceiling * 2` chars") is itself miscalibrated: estimate = `ceil(bytes/4)`, so `ceiling × 2` chars → ≈ 0.5× ceiling, still under budget. An estimate of 2× the ceiling requires `ceiling × 8` chars. Fix spec sizes by estimate, not chars | derived | rule: `estimate = Math.ceil(Buffer.byteLength/4)` (PE-002 input `scripts/check-skill-context.mjs:69`) applied to PE-002's ceiling | `f48dff00` | P1 task 1 sizing | current | proven | — |
| PE-004 | Regression scope: change is confined to one fixture case in one test file; the checker script, the manifest, and the skill tree are untouched, so every currently-passing assertion in the suite keeps its exact input | repository | `scripts/check-skill-context.test.mjs` (full read, 2026-09-08); diff boundary = lines 78–83 only | `f48dff00` | OB-3, AC3 | current | proven | — |
| PE-005 | Rollback: one-commit PR → `gh pr revert` / `git revert` restores the red suite exactly as it is today; no data, no migration, no cache | derived | rule: single-commit revert of the unit's PR; input rows PE-001, PE-004 | `f48dff00` | Rollback section | current | proven | — |
| PE-006 | Affected invariant / use case: the repo's declared verification gate requires "Context budgets pass" (`bun scripts/check-skill-context.mjs`) and a clean full suite; the over-budget fixture is the only pin that the checker *refuses* oversized references rather than only measuring them | document | `CLAUDE.md` §"Verification" (bullets 3–4); `docs/fix/_TEMPLATE/SPEC.md` "Rules that must never be violated" intent | current tree | OB-1 | current | proven | — |
| PE-007 | Cross-issue exposure: #198 and #196 may relocate `scripts/check-skill-context.*`; #176/D2 own ceiling trims; no open PR exists today. Decision: ship independently; re-base this branch before execution if #198/#196 land first | forge | https://github.com/gtrabanco/agentic-workflow/issues/198, /196, /176; `gh pr list --state open` → `[]` (2026-09-08) | 2026-09-08 | Cross-issue notes | current | proven | — |
| PE-008 | Detection lead time: no CI workflow runs this suite today (`.github/workflows/` contains only `publish-schema`, `publish-pi-package`, `sync-derived-branches`); the gate is local per `CLAUDE.md` §"Verification", so the red state surfaces on the next local gate run, not in CI | repository | `.github/workflows/` (3 files, grep 2026-09-08); `CLAUDE.md` §"Verification" | `f48dff00` | Impact / Observability | current | proven | — |

### Obligations

| obligation-id | Authority source | Affected use case or invariant | Phase | Task | Implementation owner | Validator | Required evidence | Status |
|---|---|---|---|---|---|---|---|---|
| OB-1 | Issue #200 "Expected" + PE-002 | Fail-closed over-budget refusal is exercised at any future ceiling value | P1 | Size the fixture body from the manifest (2× effective-ceiling estimate) | execute-phase --fix | `bun scripts/check-skill-context.test.mjs` → exit 0, final line `PASS context checker: …` | Command output pasted in the phase tick | planned |
| OB-2 | Issue #200 "Expected" + PE-003 | No stale size constant remains — the body size is derived from `docs/workflow/SKILL_CONTEXT_BUDGETS.json` at runtime | P1 | Same task as OB-1 | execute-phase --fix | read-verified: `grep -n "repeat(10_000)" scripts/check-skill-context.test.mjs` → no match; the over-budget case reads the manifest | grep output pasted | planned |
| OB-3 | PE-004 + PE-006 | The checker itself and all other fixtures stay byte-untouched and green | P1 | Verify-only task: run the gate unchanged | execute-phase --fix | `bun scripts/check-skill-context.mjs --budgets` → exit 0, `PASS context budgets` | Command output pasted | planned |
| OB-4 | `CLAUDE.md` §"Runtime convention" (bun first, node guaranteed fallback) | The suite passes on the node fallback too | P1 | Verify-only task: run the node fallback | execute-phase --fix | `node scripts/check-skill-context.test.mjs` → exit 0 | Command output pasted | planned |
| OB-5 | `docs/fix/README.md` conventions | The fix is indexed as `pending` before any phase runs | P1 | n/a — satisfied by this draft commit (row written with the SPEC) | plan-fix (this commit) | read-verified: `grep -n "#200" docs/fix/README.md` → 1 match | This commit's diff | in-progress |

## Acceptance

Objective, verifiable conditions for "done". Each criterion is a runnable
command where possible, or labelled `read-verified` — never unlabelled prose.

### Spec-lint (mechanical — presence checks only)

Run by `plan-fix` before committing the draft; fail-closed, no quality
judgement. Any FAIL → fix the SPEC before the commit.

- [x] No template placeholders left (`grep -nE '<(topic|n|task|command|expected)'`
      over the filled sections returns nothing — the `### P1` scaffold lines
      are replaced, not kept).
- [x] `### Out of scope` has ≥ 1 concrete bullet — never empty.
- [x] Every `## Acceptance` criterion is a runnable command OR labelled
      `read-verified`.
- [x] Every phase passes the 8-box Phase-lint below (already mandatory,
      owned by `skills/phase-contract/SKILL.md`).
- [x] `### Planning evidence` has a `current` row for the reproduction, the root
      cause, the regression scope, and the rollback path — none blank, none
      `n/a`.
- [x] `### Obligations` has one row per normative behaviour, applicable invariant,
      affected use case, and required failure state, each with a phase and a
      validator; no `deferred` row and none exported to a follow-up issue.

## Rules that must never be violated

- `CLAUDE.md` §"Verification" — anti-gaming: the test must keep asserting
  **fail-closed refusal** (`assert.notEqual(result.status, 0)` + the same
  `/estimate .* >|lines .* > /` regex); it may never be loosened, skipped, or
  turned green by weakening the assertion (verification-contract anti-gaming
  rules apply verbatim).
- `CLAUDE.md` §"Runtime convention" — bun-first, node-guaranteed-fallback; the
  fix must pass on both runtimes (`scripts/check-skill-context.test.mjs` is a
  root script; its `#!/usr/bin/env node` shebang stays).
- Test immutability (verification-contract): existing assertions in this test
  file are immutable; this fix may only resize the fixture's *input*, never
  its expectation.

## Impact

- **Layers touched** — hardening only: one test fixture case. No schema/db,
  domain, api, or ui surface exists to touch; the checker script and the
  budget manifest are read-only inputs to this fix.
- **Modules and files** — `scripts/check-skill-context.test.mjs` (over-budget
  fixture, lines 78–83). Nothing else.
- **Blast radius** — one fixture case; all other assertions in the suite keep
  identical inputs (PE-004). No skill tree, no package, no manifest change.
- **Detection lead time** — no CI job runs this suite today (PE-008); the red
  state surfaces on the next local full-gate run. After the fix, a stale
  fixture can never rot silently again: any future ceiling move is picked up
  at runtime.

## Operational risks

None: no scheduled job, queue, cache, schema, or external adapter is involved
(the suite spawns the checker against a throwaway temp fixture tree and
removes it). Concurrency hazard n/a.

## Security risks

n/a — no auth, secrets, PII, webhooks, or rate-limits involved.

## Compliance touchpoints

n/a — no domain or compliance rules apply to a test fixture.

## Affected docs

- `docs/fix/README.md` — new `pending` row for #200 (written with this SPEC;
  becomes an acceptance-criterion target via OB-5/AC4). Flipped to `done ·
  PR #…` only in the final phase.
- No SKILL.md is edited → no `bump-skill` run, no `CHANGELOG.md`/`CHANGELOG.es.md`
  row, no Pi-package re-bundle. Fix SPECs are English-only process artifacts
  (no ES sibling applies).

## Observability

The suite's final stdout line `PASS context checker: nested, missing,
unreachable, heading, budget, argument, route, and route-reference failures
rejected` is the health line; an `AssertionError` naming the fixture label
(`over-budget reference should fail closed`) is the failure signal. No
metrics/alerts exist for repo scripts in this repository.

## Cross-issue notes

- **#198 (per-skill package layout)** — may relocate `scripts/` into skills.
  Parallel; independent of this fix. If it merges first, re-base this branch
  before execution and adjust paths only (the manifest-read logic is
  unchanged). Decision: ship independently (PE-007).
- **#196 (producer package / deterministic scripts)** — same exposure as #198.
  Parallel; re-base rule identical.
- **#176 (context-route slimming) / debt D2 (plan-fix:issue trim)** — own
  ceiling re-basis downward; this fix is unaffected (sizes from the manifest,
  never from a constant).
- **#201 (operator-approved model routing)** — unrelated; no file or flow
  overlap.
- **PR #199 / #197** — landed at base `f48dff00`; explicitly *not* the
  introducer (issue #200 body).

## Effort

**XS** — one fixture case in one test file, one commit, ≤ 1 h (the whole
change is a manifest read + one `repeat()` argument).

## Decisions made during drafting

- **Body sized by estimate, not chars** — the issue's sketch (`ceiling × 2`
  chars) would produce ≈ 0.5× the ceiling in checker estimates and still pass
  (PE-003). The SPEC sizes the body at `effectiveCeiling × 8` chars
  (estimate ≈ 2× ceiling). Mechanical arithmetic grounded in
  `scripts/check-skill-context.mjs:69`; no product choice involved.
- **Effective ceiling, not the raw override** — the fixture computes
  `{ ...defaults, ...skills["review-change"] }.referenceEstimateMax`, mirroring
  the checker's own merge (`scripts/check-skill-context.mjs:161`), so the
  fixture stays correct whichever side of the merge moves.
- **Single-line body** — `"x".repeat(...)` keeps the reference's line count at
  ~3, so only the estimate dimension can fire; the assertion regex
  (`/estimate .* >|lines .* > /`) matches the estimate failure.
- **Unrelated working-tree edits left unstaged** — `main` carried unstaged
  `docs/LOGS.md` + `docs/features/ROADMAP.md` changes when this branch was
  cut; they are not part of this unit and are not staged by the draft commit.

## Testing

The change *is* a test repair, exercised at the integration layer: the suite
spawns the real checker (`process.execPath`) against a real temp copy of the
skill tree and asserts its exit status and output — no mocking. Regression
risk is nil elsewhere (PE-004); the over-budget case is the regression pin
itself for "the checker refuses oversized references".

## Phases

Execution ledger — `execute-phase --fix 200` runs **all remaining phases by
default** and ticks tasks here; an explicit `P<n>` runs exactly one phase.
**Always ≥ 2 phases**: `P1..Pn` implement the fix
(each task independently checkable, no judgement); the final phase is
always `Hardening & PR` — keep its pre-written tasks **literally**, never
paraphrase or merge them into an implementation phase.

### Phase-lint (owned by `skills/phase-contract/SKILL.md`)

Every implementation phase below must pass all 8 boxes before it is emitted
(planner skills) or executed (`execute-phase` pre-flight). Fail-closed: any
unticked box blocks emission/execution until the phase is re-cut or split.
Consume the canonical checklist from `skills/phase-contract/SKILL.md` and
record the result here as `Phase-lint: PASS (8/8) · fingerprint
<P<n>:<layer>:<n-tasks>:<title-deliverable>>` (or `BLOCKED — box <n>: …`).

- P1 — `Phase-lint: PASS (8/8) · fingerprint P1:hardening:3:over-budget-fixture-manifest-sized`
- P2 — `Phase-lint: PASS (8/8) · fingerprint P2:close-out:7:hardening-and-pr`

### P1 — Over-budget fixture sized from the manifest

Layer: `hardening`. Done-when:
`bun scripts/check-skill-context.test.mjs` → exit 0, final stdout line
`PASS context checker: …`.

- [ ] In `scripts/check-skill-context.test.mjs`, replace the hard-coded
      `"x".repeat(10_000)` body of the `"over-budget reference"` fixture
      (lines 78–83) with a runtime-derived size: read
      `docs/workflow/SKILL_CONTEXT_BUDGETS.json`, compute the effective
      ceiling exactly as the checker does
      (`{ ...defaults, ...skills["review-change"] }.referenceEstimateMax`),
      and write `"x".repeat(effectiveCeiling * 8)` so the generated
      reference's estimate is ≈ 2× the ceiling (OB-1, OB-2, PE-002, PE-003).
- [ ] Keep the fail-closed assertion and regex byte-identical:
      `assert.notEqual(result.status, 0, …)` and
      `/estimate .* >|lines .* > /` unchanged (test immutability; only the
      fixture *input* is resized).
- [ ] Run the full gate on both runtimes and paste outputs:
      `bun scripts/check-skill-context.test.mjs` → exit 0 +
      `PASS context checker: …`; `node scripts/check-skill-context.test.mjs`
      → exit 0; `bun scripts/check-skill-context.mjs --budgets` → exit 0 +
      `PASS context budgets` (OB-1, OB-3, OB-4).

### P2 — Hardening & PR

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #200`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #<n>` and push

## Rollback

Single-commit PR → `gh pr revert <pr>` (or `git revert <sha>` on `main`)
restores the tree exactly; the suite returns to its current (red-on-#200)
state. Data cleanup: none. Nothing preserved or lost beyond the one commit.

## Status

`pending` · `in-progress` · `done` (built, PR open — merge state lives in the forge)

(Removed from `docs/fix/README.md` only **after** the PR merges.)
