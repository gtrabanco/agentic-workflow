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
value. The suite is red on `main` for **two independent reasons** (re-verified
2026-09-08, cycle-2 repair): this stale fixture, and a pre-existing
route-budget red (`test.mjs:112`, PE-009) that this unit deliberately does not
own (see Scope). The declared context-budget gate
(`bun scripts/check-skill-context.mjs`) is green today (PE-011); this unit's
finish line is the **fixture red being gone**, not a green suite — the suite
returns to green only when the separate route-budget unit lands.

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

A second, independent red was masked behind the fixture failure and is **not
owned by this unit**: `assert.equal(routeJson.status, 0, …)` at
`scripts/check-skill-context.test.mjs:112` fails because
`bun scripts/check-skill-context.mjs --routes` exits 1 with 15 route-budget
exceedances (7 `execute-phase:*` route estimate; 8 `review-change:*` route
estimate+lines) at the base tree (PE-009, re-verified 2026-09-08 in the
cycle-2 repair). The suite aborts at the fixture assertion first, which hid
the route red from the cycle-1 reproduction; receipt
`rp-fix200-20260908-001` (RP1-F1/RP1-F2) surfaced it. It is out of scope here
(see Scope and Cross-issue notes); its disposition is a separate decision
(PE-010).

## Scope

### In scope

- One fixture case in `scripts/check-skill-context.test.mjs`
  (`"over-budget reference"`, lines 78–83): replace the hard-coded
  10 000-char body with a body sized at runtime from
  `docs/workflow/SKILL_CONTEXT_BUDGETS.json`, using the same effective-budget
  merge the checker performs (`{ ...defaults, ...skills["review-change"] }`),
  and writing `"x".repeat(effectiveCeiling * 8)` — an estimate ≈ 2× the
  effective ceiling, over budget by construction.
- `docs/fix/README.md`: the #200 index row — registered `pending` at draft,
  flipped to `in-progress` by the cycle-2 repair commit (branch open, plan
  under review); flipped to `done · PR #…` only in the final phase.

### Out of scope

- **The checker itself** (`scripts/check-skill-context.mjs`) — it is correct;
  the failing test is the fixture. Any ceiling raise/trim belongs to the
  manifest's declared re-basis process (policy `relative-headroom`, rules in
  `docs/workflow/SKILL_CONTEXT_BUDGETS.json`).
- **Other fixtures in the same test file** — the remaining nine+ *failure*
  fixtures (nested, missing, unreachable, heading, route, headroom…) all pass
  and stay untouched; a regression pin for them would be new work. (The
  non-fixture shipped-state route assertions are a different story — next
  bullet.)
- **The route-budget red** (`test.mjs:112` `routeJson` assertion, plus the
  shipped-headroom block it masks): 15 exceedances at base (PE-009). Its
  disposition — a declared re-basis in `docs/workflow/SKILL_CONTEXT_BUDGETS.json`
  naming the growth source, or a route trim — is #176/D2 territory and a
  separate indexed unit (PE-010). This unit touches no route assertion and no
  manifest byte, and must never grow it silently (receipt
  `rp-fix200-20260908-001`, out-of-scope observation).
- **Ceiling re-basis or SKILL trim work** — issue #176 (route budget
  slimming) and debt item D2 own that; this fix does not touch any ceiling.
- **#198 / #196** (per-skill script relocation; producer package) — separate
  features that may move where `scripts/check-skill-context.*` lives; this
  fix does not relocate anything.

### Planning evidence

| id | claim-or-obligation | authority-kind | source-and-location | observed-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|---|
| PE-001 | The suite is red on `main`/base: the over-budget fixture's checker run exits 0 and `assert.notEqual(result.status, 0)` (test line 35) throws `AssertionError: over-budget reference should fail closed` | repository | `scripts/check-skill-context.test.mjs:35,78-83`; reproduced 2026-09-08 on `f48dff00` via `bun scripts/check-skill-context.test.mjs`; re-verified 2026-09-08 in the cycle-2 repair after the RP1-F3 revert (exit 1, same assertion) | `7fa68074` | AC1 (fixture red gone) | current | proven | — |
| PE-002 | Root cause: 10 000-char body → estimate ≈ 2502 ≤ effective ceiling 2800, so the checker correctly exits 0; ceiling grown by the re-basis recorded in the manifest's own provenance (measured 2746) | repository | `scripts/check-skill-context.mjs:69,161,206-207`; `docs/workflow/SKILL_CONTEXT_BUDGETS.json` (`defaults.referenceEstimateMax` 2200, `skills["review-change"].referenceEstimateMax` 2800 + `referenceSources`) | `f48dff00` | OB-1, AC2 | current | proven | — |
| PE-003 | The issue's fix sketch ("body of `ceiling * 2` chars") is itself miscalibrated: estimate = `ceil(bytes/4)`, so `ceiling × 2` chars → ≈ 0.5× ceiling, still under budget. An estimate of 2× the ceiling requires `ceiling × 8` chars. Fix spec sizes by estimate, not chars | derived | rule: `estimate = Math.ceil(Buffer.byteLength/4)` (PE-002 input `scripts/check-skill-context.mjs:69`) applied to PE-002's ceiling | `f48dff00` | P1 task 1 sizing | current | proven | — |
| PE-004 | Regression scope (re-cited honestly per RP1-F2, receipt `rp-fix200-20260908-001`): the unit's *edit* is confined to one fixture case in one test file (lines 78–83), and every currently-passing assertion keeps its exact input. The suite additionally contains two **pre-existing red** assertions — `routeJson` at `test.mjs:112` and the shipped-headroom block it masks — both `--routes`-based, untouched by this unit and out of scope (PE-009). The suite exits 1 at `:112` once the fixture assertion is made to pass (observed 2026-09-08 in cycle-1 review, re-confirmed in this repair before the revert) | repository | `scripts/check-skill-context.test.mjs` (full read, cycle-2 repair 2026-09-08); diff boundary = the over-budget fixture body only; red-set observed at `test.mjs:112` | `7fa68074` (bytes re-verified after the RP1-F3 revert) | OB-3, AC3, AC6 | current | proven | — |
| PE-005 | Rollback: one-commit PR → `gh pr revert` / `git revert` restores the red suite exactly as it is today; no data, no migration, no cache | derived | rule: single-commit revert of the unit's PR; input rows PE-001, PE-004 | `f48dff00` | Rollback section | current | proven | — |
| PE-006 | Affected invariant / use case: the repo's declared verification gate requires "Context budgets pass" (`bun scripts/check-skill-context.mjs`) and a clean full suite; the over-budget fixture is the only pin that the checker *refuses* oversized references rather than only measuring them | document | `CLAUDE.md` §"Verification" (bullets 3–4); `docs/fix/_TEMPLATE/SPEC.md` "Rules that must never be violated" intent | current tree | OB-1 | current | proven | — |
| PE-007 | Cross-issue exposure: #198 and #196 may relocate `scripts/check-skill-context.*`; #176/D2 own ceiling trims; no open PR exists today. Decision: ship independently; re-base this branch before execution if #198/#196 land first | forge | https://github.com/gtrabanco/agentic-workflow/issues/198, /196, /176; `gh pr list --state open` → `[]` (2026-09-08) | 2026-09-08 | Cross-issue notes | current | proven | — |
| PE-008 | Detection lead time: no CI workflow runs this suite today (`.github/workflows/` contains only `publish-schema`, `publish-pi-package`, `sync-derived-branches`); the gate is local per `CLAUDE.md` §"Verification", so the red state surfaces on the next local gate run, not in CI | repository | `.github/workflows/` (3 files, grep 2026-09-08); `CLAUDE.md` §"Verification" | `f48dff00` | Impact / Observability | current | proven | — |
| PE-009 | The route-budget red is real and current: `bun scripts/check-skill-context.mjs --routes` → exit 1 with 15 `^- ` exceedance lines (7 `execute-phase:*` route estimate; 8 `review-change:*` route estimate+lines); the checker's own message states the disposition rule ("raise it at a declared re-basis and name the growth source, or trim the route") | repository | `bun scripts/check-skill-context.mjs --routes` → exit 1, 15 exceedances (2026-09-08, cycle-2 repair, `skills/` + manifest byte-identical to `7fa68074`); `scripts/check-skill-context.test.mjs:112` asserts this red | `7fa68074` | Out of scope, AC6 | current | proven | — |
| PE-010 | The route red's root cause is unattributed and its disposition is a **decision**, not engineering: a declared re-basis in `docs/workflow/SKILL_CONTEXT_BUDGETS.json` naming the growth source (suspect: #199's skill rewrites), or a route trim (#176/D2 territory). No issue is filed from this plan (evidence-grounding forbids forge writes from an authoring skill); the owner is the repo owner via triage/#176 | derived | rule: the checker's exceedance message (PE-009) + receipt `rp-fix200-20260908-001` out-of-scope observation (`progress.md`) | `a60722f0` | Cross-issue notes, AC6 | current | decision | repo owner — decide re-basis vs trim, then index the route red as its own unit (triage, or a future `plan-fix`) |
| PE-011 | The declared verification gate stays green: `bun scripts/check-skill-context.mjs` (bare) → exit 0, `PASS context budgets: 39 skills`; `--budgets` → exit 0 likewise — the route red is not part of the bare/budgets gate | repository | `bun scripts/check-skill-context.mjs` → exit 0; `--budgets` → exit 0 (both 2026-09-08, cycle-2 repair) | `7fa68074` | OB-3, AC3 | current | proven | — |
| PE-012 | The RP1-F3 unsanctioned mid-review edit (unstaged `"x".repeat(22_400)` hard-code in `test.mjs`) was reverted source-side in this repair: working-tree bytes of `scripts/check-skill-context.test.mjs` are restored to `7fa68074`; committed plan bytes were never touched | repository | `git checkout -- scripts/check-skill-context.test.mjs` + `git status --porcelain` (2026-09-08, cycle-2 repair) | `7fa68074` | Rules (test immutability), Decisions | current | proven | — |

### Obligations

| obligation-id | Authority source | Affected use case or invariant | Phase | Task | Implementation owner | Validator | Required evidence | Status |
|---|---|---|---|---|---|---|---|---|
| OB-1 | Issue #200 "Expected" + PE-002 | Fail-closed over-budget refusal is exercised at any future ceiling value — the **fixture red is gone** (the suite's remaining red at this revision is the pre-existing route red, `test.mjs:112`, PE-009 — never the fixture) | P1 | Size the fixture body from the manifest (2× effective-ceiling estimate) | execute-phase --fix | `bun scripts/check-skill-context.test.mjs` and `node scripts/check-skill-context.test.mjs`: piped output contains **no** `over-budget reference should fail closed` line (`\| grep -cF "over-budget reference should fail closed"` → `0`); pasted tail shows any remaining failure at the route red, not the fixture | Command output pasted in the phase tick | planned |
| OB-2 | Issue #200 "Expected" + PE-003 | No stale size constant remains — the body size is derived from `docs/workflow/SKILL_CONTEXT_BUDGETS.json` at runtime | P1 | Same task as OB-1 | execute-phase --fix | read-verified: `grep -n "repeat(10_000)" scripts/check-skill-context.test.mjs` → no match; the over-budget case reads the manifest | grep output pasted | planned |
| OB-3 | PE-004 + PE-006 | The checker itself and all other fixtures stay byte-untouched and green | P1 | Verify-only task: run the gate unchanged | execute-phase --fix | `bun scripts/check-skill-context.mjs --budgets` → exit 0, `PASS context budgets` | Command output pasted | planned |
| OB-4 | `CLAUDE.md` §"Runtime convention" (bun first, node guaranteed fallback) | The suite passes on the node fallback too | P1 | Verify-only task: run the node fallback | execute-phase --fix | `node scripts/check-skill-context.test.mjs` → exit 0 | Command output pasted | planned |
| OB-5 | `docs/fix/README.md` conventions | The fix is indexed while the branch is open | P1 | n/a — the row was written `pending` with the draft commit; the cycle-2 repair commit flips it to `in-progress` (branch open); `done · PR #…` only in the final phase | plan-fix (this commit) | read-verified: `grep -n "#200" docs/fix/README.md` → 1 match with status `in-progress` | This commit's diff | in-progress |
| OB-6 | Receipt `rp-fix200-20260908-001` (RP1-F1 out-of-scope observation) + PE-010 | The route red is recorded as a separate out-of-scope unit with a named owner and disposition path — never grown into this unit | n/a — satisfied by this repair commit (Scope + Cross-issue notes + PE-009/PE-010) | plan-fix (this commit) | read-verified: `grep -c "route-budget red" docs/fix/200-over-budget-fixture-stale-guard/SPEC.md` → ≥ 1 match in Out of scope and Cross-issue notes | This commit's diff | in-progress |

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
- **No manufactured green (receipt `rp-fix200-20260908-001`)**: the suite is
  expected to remain red at the pre-existing route red (`test.mjs:112`) at
  this revision. Touching the route assertions, the routes manifest, or
  weakening any assertion to make the suite exit 0 is forbidden — the route
  red belongs to a separate unit (PE-010), and the validator may not be
  narrowed to hide it.

## Impact

- **Layers touched** — hardening only: one test fixture case. No schema/db,
  domain, api, or ui surface exists to touch; the checker script and the
  budget manifest are read-only inputs to this fix.
- **Modules and files** — `scripts/check-skill-context.test.mjs` (over-budget
  fixture, lines 78–83). Nothing else.
- **Blast radius** — one fixture case; all other assertions in the suite keep
  identical inputs; the suite's two pre-existing red assertions (route red,
  `test.mjs:112` and the shipped-headroom block) are untouched (PE-004,
  PE-009). No skill tree, no package, no manifest change.
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

- `docs/fix/README.md` — the #200 row (draft wrote it `pending`; the cycle-2
  repair commit flips it to `in-progress`; it becomes `done · PR #…` only in
  the final phase — OB-5/AC5). No SKILL.md is edited → no `bump-skill` run,
  no `CHANGELOG.md`/`CHANGELOG.es.md` row, no Pi-package re-bundle. Fix SPECs
  are English-only process artifacts (no ES sibling applies).

## Observability

The suite's final stdout line `PASS context checker: nested, missing,
unreachable, heading, budget, argument, route, and route-reference failures
rejected` is the health line once the separate route-budget unit lands; at
this revision the expected failure signal is the pre-existing route red at
`test.mjs:112` (never `over-budget reference should fail closed`, which is
the failure signal this unit retires). No metrics/alerts exist for repo
scripts in this repository.

## Cross-issue notes

- **#198 (per-skill package layout)** — may relocate `scripts/` into skills.
  Parallel; independent of this fix. If it merges first, re-base this branch
  before execution and adjust paths only (the manifest-read logic is
  unchanged). Decision: ship independently (PE-007).
- **#196 (producer package / deterministic scripts)** — same exposure as #198.
  Parallel; re-base rule identical.
- **#176 (context-route slimming) / debt D2 (plan-fix:issue trim)** — own
  ceiling re-basis downward; this fix is unaffected (sizes from the manifest,
  never from a constant). **The route-budget red (PE-009) routes here**: its
  disposition — declared re-basis naming the growth source (suspect #199's
  skill rewrites) or route trim — is a decision owned by the repo owner
  (PE-010); no issue is filed from this plan (no forge writes from authoring
  skills), and this unit neither absorbs nor silently grows it.
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
  The cycle-2 repair additionally left them unstaged (unchanged decision).
- **Validator re-scoped to the fixture pin (cycle-2 repair, receipt
  `rp-fix200-20260908-001`)** — the cycle-1 validator (`suite` → exit 0) was
  unreachable inside the unit's scope because of the masked route red
  (RP1-F1/RP1-F2). The done-when is now "the fixture red is gone"
  (`grep -cF "over-budget reference should fail closed"` → `0`), reachable
  under both the current tree (suite red at the route red) and a future tree
  where the route unit has landed (suite green).
- **Route red recorded, not grown (cycle-2 repair)** — the 15-exceedance
  route red is documented as out of scope with an owner and both disposition
  paths (PE-009/PE-010); no route assertion or manifest byte is touched, and
  no issue is filed from the plan (evidence-grounding forbids forge writes
  from authoring skills).
- **RP1-F3 resolved source-side (cycle-2 repair)** — the unsanctioned
  mid-review edit (`"x".repeat(22_400)` hard-code with a comment misstating
  the default ceiling) was reverted via `git checkout` (PE-012); `execute-phase`
  implements task 1 properly from the manifest instead.
- **Fix-index row `pending` → `in-progress` (cycle-2 repair)** — the branch
  is open and the plan is under re-review, matching the index legend and the
  fix-191 precedent (its cycle-1 receipt finding RP1-F2 flagged exactly this
  staleness).

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

- P1 — `Phase-lint: PASS (8/8) · fingerprint P1:hardening:3:over-budget-fixture-manifest-sized` (re-linted cycle 2 after the done-when re-scope: 8/8, shape unchanged)
- P2 — `Phase-lint: PASS (8/8) · fingerprint P2:close-out:7:hardening-and-pr` (unchanged)

### P1 — Over-budget fixture sized from the manifest

Layer: `hardening`. Done-when: the fixture red is gone —
`bun scripts/check-skill-context.test.mjs 2>&1 | grep -cF "over-budget
reference should fail closed"` → `0` (the suite's remaining red at this
revision is the pre-existing route red at `test.mjs:112`, out of scope —
PE-009; never the fixture).

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
- [ ] Run the full suite on both runtimes and paste outputs:
      `bun scripts/check-skill-context.test.mjs` and
      `node scripts/check-skill-context.test.mjs` — each paste must show **no**
      `over-budget reference should fail closed` line (any remaining failure
      at this revision is the route red at `test.mjs:112`); also paste
      `bun scripts/check-skill-context.mjs --budgets` → exit 0 +
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
restores the tree exactly; the suite returns to its base state (red at the
stale fixture + the route red). Data cleanup: none. Nothing preserved or lost
beyond the one commit.

## Status

`pending` · `in-progress` · `done` (built, PR open — merge state lives in the forge)

(Removed from `docs/fix/README.md` only **after** the PR merges.)
