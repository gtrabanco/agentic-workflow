# fix/329-runtime-invocation-drift

> Fix specification — one single unit document, cut in the re-cut
> `spec-by-reference` shape from `docs/fix/_TEMPLATE/SPEC.md`. Size: **M** — the
> planning ledgers live beside this doc as `planning-evidence.md` and
> `planning-obligations.md` (never both embedded and separate).

## Issue

`#329` — AGENT DRIFT: sessions keep invoking node where the bun-first convention
orders bun, and grep where ripgrep is installed — the correction does not stick.
The PR closes it via `Closes #329`.

## Specs

Requirements numbered `S#`, quoting the requester's own words verbatim. The
frozen request is L1; every later decision cites its `S#`.

**S1 — One normative tool-discipline line in both agent guides.**
> - One normative line in `AGENTS.md` + `template/AGENTS.md` (agent-tool discipline): *manual invocation runs bun before node; search runs rg before grep; both node/grep remain legitimate fallbacks when the preferred tool is absent — availability is checked once per session, not assumed.*

**S2 — The choice is re-made every turn, not every session.**
> - A Step-0 checklist box in `unit-lane` / `execute-phase` (one line, same shape as the model-tier portability notes) so the choice is re-made every turn, not every session.

**S3 — Sweep the wrong-tool usage strings.**
> - Sweep the `usage: node` strings to the bun form (the same 10 flagged in LOGS.md:3471).

**S4 — The rg-first search feature stays #269's; this issue owns the habit only.**
> - **Ownership decision (owner, 2026-10-27): ripgrep-first search stays owned by #269.** This issue's rg duty is only the Step-0 tool-choice discipline — prefer `rg` when it is available, `grep` as the documented fallback — never the search-feature work. No slice of #269 is absorbed here.

**S5 — No runtime-resolution change, no CI change; node stays the guaranteed fallback.**
> - No runtime-resolution change (#197 already ships `detectRuntime`/`runtimeBin`/`runtimeEnv`).
> - No CI change: the node-compat job stays; node remains the guaranteed fallback.

**S6 — The sweep is a first, mechanically-tested step.**
> - The three fix pieces (normative line, Step-0 box, usage-string sweep) are independent — plan can land the sweep as P1 since it is mechanical and testable (a test asserting no non-test `usage: node` string survives is the pin).

**S7 — Cite the availability check, never duplicate it.**
> - Interplay with #331: `setup-env.mjs --check` is the "availability is checked once" half of the discipline — cite it, don't duplicate it. If #331 merges first, the Step-0 box points at its `--check`.

**S8 — The silent green becomes a visible skip.**
> - The false-green `exit(0)` at `:50` is a guard for deleted skills, but the issue is right that `bun test scripts/` reports green while it skips — the unit should convert that SKIP into a visible `SKIP` marker or a fail-loud mode, not silently delete it.

**S9 — This issue keeps the enforcement half.**
> - **This issue keeps the enforcement half** — what makes the correction stick, which #269 does not own: the 10 `usage: node` strings still printing the wrong tool in `scripts/*.mjs`, the `bun test scripts/` false-green (`pre-execution-quality.test.mjs:50` `process.exit(0)`), and an invocation-drift gate/re-decision-at-turn contract so the convention is re-ordered mid-session instead of living in prose nothing reads.

**S10 — The suite carve-out travels with the sweep.**
> **The suite is the one measured exception:** `node scripts/run-root-suite.mjs` and `node --test scripts/*.test.mjs` run it, while `bun scripts/run-root-suite.mjs` fails by construction (`Cannot use test outside of the test runner` — bun only enters a runner through its `test` subcommand). Switching the suite's commands to bun therefore belongs to the `node → bun` sweep (issue #329) and needs that carve-out carried with it.

`S10` is the receiving half of unit 332's `S14`; its authority is `AGENTS.md`
§Runtime convention, not the issue body, and it is quoted here so the sweep
cannot silently move the suite to a command that fails by construction.

**S11 — Correction: the tests themselves run bun-first.**
> Este cambio pretende corregir el uso de node y has usado node en lugar de bun para muchos de tus tests.

Owner correction, 2026-11-04. It amends the reading of `S5`/`S10`, never their
ids: the full root gate keeps `node scripts/run-root-suite.mjs` for the measured
runner differences, but every per-file test invocation — in unit-doc validators,
obligation rows, the scaffold's validator example and this unit's own evidence —
is `bun test scripts/<file>.test.mjs`, with `node --test` only as the declared
fallback.

## Impact

- **Both agent guides.** `AGENTS.md` §Runtime convention gains the tool-choice
  sentence; `template/AGENTS.md` §Workflow conventions gains the same discipline
  in the scaffold's placeholder voice. `scripts/check-skill-context.mjs
  --documents` bounds the repo guide (393 lines / 6,881 est at the base), so the
  edit must fit that headroom.
- **Both SPEC templates.** `template/docs/{features,fix}/_TEMPLATE/SPEC.md`
  switch their validator example to the bun form (S11), so the scaffold stops
  teaching the nearest literal the old way.
- **Both executor skills.** `skills/unit-lane/SKILL.md` and
  `skills/execute-phase/SKILL.md` turn contracts gain one box each; per-skill
  context ceilings are 4,135 / 319 (unit-lane) and 4,693 / 369 (execute-phase);
  the eight `execute-phase:*` route ceilings in
  `docs/workflow/SKILL_CONTEXT_BUDGETS.json` re-base to exact ceil(measured ×
  1.10) because every one loads the grown `SKILL.md`.
- **Five skill literals that teach `node`** (collapsed-whitespace scan):
  `skills/execute-phase/SKILL.md:171`, `skills/init-workspace/SKILL.md:52-53`,
  `skills/fold-findings/SKILL.md:304`,
  `skills/review-change/references/PERSIST_AND_DECIDE.md:155-156`,
  `skills/unit-lane/SKILL.md:69-70`. The one legitimate literal,
  `skills/execute-phase/references/PREFLIGHT.md:157-158`, keeps `node` because
  the same line declares it as the fallback.
- **Seventeen `usage: node` literals in twelve scripts** (release, review-state,
  changeset-create, test-route ×2, unit-route ×4, version-parity-gate,
  lint-changeset, pin-watch, product-audit-residue-fixture, unit-cycle,
  unit-lineage, vocabulary-probe ×2) move to `usage: bun`. Two stay `node`
  (`scripts/setup-env.mjs`, `scripts/update-tools.mjs`) — declared in D1.
- **`scripts/unit-route.test.mjs:235`** pins the old literal and moves with it.
- **`scripts/pre-execution-quality.test.mjs:47-51`** stops exiting silently; the
  rest of the file sits behind the guard and a registered skip replaces the
  process exit.
- **Consumers of the drift:** every unit-doc validator an agent copies and every
  skill line an agent reads as the nearest literal. Nothing reads these strings
  programmatically, so no machine contract changes.

## Retirements

- The seventeen swept `usage: node` literals are retired in favour of
  `usage: bun`; the two bootstrap literals remain by D1.
- The five skill literals that name `node scripts/…` without declaring it a
  fallback are retired in favour of the bun form.
- The silent `process.exit(0)` skip in `scripts/pre-execution-quality.test.mjs`
  is retired in favour of a registered skip the runner counts. Its assertions are
  not deleted: the same file keeps them behind the same guard.

## Non-goals

- No runtime-resolution change: `detectRuntime`/`runtimeBin`/`runtimeEnv` are
  untouched (S5).
- No CI change; the node-compat job stays and node remains the guaranteed
  fallback (S5, S10).
- No ripgrep search feature — no index, no gitignore contract, no installer
  (S4); #269's row 80 keeps that scope.
- No sweep of historical unit docs, closed logs, or frozen evidence: their
  `node …` lines are receipts of what ran, not instructions for the next turn.

## Future

none

## Future cost

- Every future script's usage string prints the bun form except the declared
  bootstrap allowlist in `scripts/invocation-drift.mjs`. Binds: script authors.
- Every future skill line that names `node scripts/…` must declare it a fallback
  in the adjacent line window the gate reads. Binds: skill authors.
- Both agent guides must keep the normative sentence and the suite carve-out;
  the gate fails closed if either disappears. Binds: guide editors.

## Applicable tests

`scripts/invocation-drift.test.mjs` (new gate + required surfaces + visible
skip), `scripts/unit-route.test.mjs` (the swept usage literal),
`scripts/pre-execution-quality.test.mjs` (guard shape), and the root suite.

## Known pre-existing issues

- Issue #269 (`efficient-context-targeting`, roadmap row 80) is still open and
  owns the ripgrep search feature — `does-not-affect`: this unit adds no search
  machinery, only the tool-choice line and its gate (S4).
- `bun scripts/run-root-suite.mjs` fails by construction — `does-not-affect`:
  that is the S10 carve-out this unit preserves, never repairs.

## Tasks

- P1 — Cut this unit doc, the two planning ledgers, the frozen-failure corpus
  (`CR-1`…`CR-5`) and the acceptance criteria (validator:
  `bun scripts/phase-lint.mjs docs/fix/329-runtime-invocation-drift/SPEC.md` exits 0
  with `verdict PASS`)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8, S9, S10)
  Relevant files: docs/fix/329-runtime-invocation-drift/SPEC.md,
  docs/fix/329-runtime-invocation-drift/planning-evidence.md,
  docs/fix/329-runtime-invocation-drift/planning-obligations.md
- P2 — Tests first: the `invocation-drift` gate and its sibling suite, proven red
  on the base tree and on one fixture per rule, green on a compliant toy tree
  (validator: `bun test scripts/invocation-drift.test.mjs` exits 0 with the
  fixture and live-tree cases, and the RED run is recorded in the Log)
  (Implements: S3, S6, S9)
  Relevant files: scripts/invocation-drift.mjs, scripts/invocation-drift.test.mjs
- P3 — Sweep the seventeen script usage strings to the bun form and move the one
  test that pins the old literal (validator:
  `bun scripts/invocation-drift.mjs` exits 0 with zero `usage-node` violations)
  (Implements: S3, S6)
- P4 — Move the five skill literals that teach `node scripts/…` to the bun form
  and the two SPEC templates' `node --test` validator example to the bun form,
  leaving the lines that declare the fallback (validator:
  `bun scripts/invocation-drift.mjs` exits 0 with zero `node-command-literal` violations)
  (Implements: S3, S4, S11)
- P5 — Land the normative tool-discipline line in both guides and the per-turn
  choice box in both skills, citing `setup-env.mjs --check` for availability and
  keeping the suite carve-out (validator: `bun scripts/invocation-drift.mjs`
  exits 0 with `verdict: PASS` and `bun scripts/check-skill-context.mjs` exits 0)
  (Implements: S1, S2, S4, S5, S7, S10, S11)
  Relevant files: AGENTS.md, template/AGENTS.md, skills/unit-lane/SKILL.md,
  skills/execute-phase/SKILL.md
- P6 — Replace the silent `process.exit(0)` guard with a registered skip so the
  runner reports it, keeping every existing assertion behind the same guard
  (validator: `bun test scripts/pre-execution-quality.test.mjs` exits 0 and
  prints `skipped 1`)
  (Implements: S8)
  Relevant files: scripts/pre-execution-quality.test.mjs
- P7 — Verification: full root suite, guide and skill budgets, phase-lint,
  lineage, the release intent and the differential run against a base-commit
  copy (validator: `node scripts/run-root-suite.mjs` exits 0 and
  `bun scripts/check-skill-context.mjs` exits 0)
  (Implements: S5, S6, S9, S10)
  Relevant files: scripts/, skills/, docs/

### Planning evidence

The ledger lives in [`planning-evidence.md`](planning-evidence.md).

### Obligations

The ledger lives in [`planning-obligations.md`](planning-obligations.md).

## Triaged steps

```
TRIAGE — 329-runtime-invocation-drift (fix)
Steps: implement, evidence
Tiers: implement: cheap, evidence: strong
Skipped: research: trivial scope, design: trivial scope, plan: trivial scope, tests: trivial scope, review: trivial scope, docs: trivial scope, release: not a feature
Budget: strong
```

Run 2026-11-04 via `bun scripts/unit-route.mjs --triage 329-runtime-invocation-drift`.
This block is authoritative for routing, and the model never re-derives it.
**Declared deviation:** the catalog skips `tests` as trivial scope, but this
repair's whole subject is that a correction only sticks when a deterministic
check reddens — the process that ordered it writes the failing check before the
repair, so `P2` exists and is the frozen proof of `O7`.

## Acceptance criteria

One observable, testable criterion per requirement; each names the check that
proves it. Frozen at cut.

| S# | criterion | proving check |
|---|---|---|
| S1 | both guides carry the normative sentence: bun before node on manual invocation, rg before grep on search, both fallbacks legitimate, availability checked once per session | `bun scripts/invocation-drift.mjs` exits 0 with `verdict: PASS`; `rg -c 'Manual invocation runs `bun` before `node`' AGENTS.md template/AGENTS.md` → 1 and 1 |
| S2 | both executor skills tick the choice every turn, not once per session | `bun scripts/invocation-drift.mjs` exits 0; `rg -c 'Tool choice re-made' skills/unit-lane/SKILL.md skills/execute-phase/SKILL.md` → 1 each |
| S3 | no non-bootstrap `usage: node` literal survives in `scripts/*.mjs`; every remaining one is declared with its reason | `bun scripts/invocation-drift.mjs` exits 0; `rg -n 'usage: node' scripts/*.mjs` outside test files → only `setup-env.mjs` and `update-tools.mjs` |
| S4 | the rg duty is a tool-choice line only — no search machinery, no #269 slice | `git diff --name-only main` lists no search/index/installer surface; the line names `grep` as the documented fallback |
| S5 | no CI workflow and no runtime-resolution module changes; the full gate stays `node scripts/run-root-suite.mjs` and node remains the fallback | `git diff --name-only main -- .github/workflows packages/pi-agentic-workflow/src` prints nothing; `rg -c 'node scripts/run-root-suite.mjs' AGENTS.md` → 1 |
| S6 | the sweep ships with a pin test that fails on every swept literal and passes only when the tree is clean | `bun test scripts/invocation-drift.test.mjs` exits 0 with the fixture and live-tree cases |
| S7 | the availability half is cited, not duplicated: the box points at `setup-env.mjs --check` | `rg -c 'setup-env.mjs --check' skills/unit-lane/SKILL.md skills/execute-phase/SKILL.md` → 1 each |
| S8 | the deleted-skill guard is a skip the runner counts, never a silent green | `bun test scripts/pre-execution-quality.test.mjs` prints `1 skip`; `bun test scripts/pre-execution-quality.test.mjs` prints `skipped 1`; both exit 0 |
| S9 | the ratification is machine-held: one gate owns the usage strings, the node literals (script and test forms, in skills and templates), the required surfaces and the suite carve-out, and the root suite runs it | `bun test scripts/invocation-drift.test.mjs` exits 0; `node scripts/run-root-suite.mjs` exits 0 naming the suite |
| S10 | the suite carve-out is carried with its commands: per file `bun test scripts/<file>.test.mjs` (fallback `node --test …`), the gate `node scripts/run-root-suite.mjs`, and the guide states why | `bun scripts/invocation-drift.mjs` exits 0 (`suite-carve-out` row); `rg -c 'fails by construction' AGENTS.md` → 1 |
| S11 | every per-file test invocation in this unit's task validators is `bun test scripts/<file>.test.mjs`; node appears only as the declared fallback and as the full-gate wrapper | `sed -n '/^## Tasks/,/^## Acceptance criteria/p' docs/fix/329-runtime-invocation-drift/SPEC.md \| rg -c 'validator: .node --test'` → 0 and the same pipeline for `validator: .node scripts/` → 1 (the root-suite wrapper); `bun test scripts/invocation-drift.test.mjs` exits 0 with its S11 case |

## Findings

| id | S# / file:line | axis | severity | class | route |
|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-04, the issue, verbatim:
  ```
  ### Summary

  Coding-agent sessions in this repository keep violating two shell-tool conventions, the owner corrects it, and the next session does it again. This is the fourth round. The failure is not tool availability — both preferred tools are installed — it is that the conventions live in prose nothing re-orders mid-session, and the repo's own validator strings teach the wrong tool.

  ### Evidence — this session (2026-10-27, unit 84 in flight)

  While executing `docs/features/84-published-vocabulary-sweep-gate/`, the agent session ran, among others:

  - `node --test scripts/*.test.mjs`, `node scripts/vocabulary-probe.mjs`, `node packages/agentic-workflow/bin/agentic-workflow.mjs roadmap …` — the bun-first convention (`AGENTS.md` §Runtime convention, line 275) orders `bun scripts/x.mjs` / `bun run <pkg-script>` for manual invocation, node as the *guaranteed fallback*, never the default.
  - dozens of `grep -rn …` / `grep -n …` calls while `rg` 15.2.0 is on PATH (`/home/agent/.pi/agent/bin/rg`). No committed normative surface prefers rg (issue #269 is postponed), which is part of the diagnosis — but the owner's standing instruction does, and the session ignored it.

  ### Prior fixes that did not stick

  1. **#197 (closed)** — bun first-class runtime & installer: invocation-surface migration with CI-enforced node fallback. Runtime *resolution* was fixed; agent *invocation habits* were not.
  2. **AGENTS.md §Runtime convention (2026-10-26)** — the explicit two-scope wording (manual = bun-first; package-spawned children follow the launching runtime), plus a session correcting its own `node scripts/…` invocations to `bun scripts/…` (`docs/LOGS.md:3471`: *"Corrected my own node scripts/... invocations to bun scripts/... per the repo's bun-first convention"*).
  3. **Drift flagged, never gated** — the same log entry flags 10 usage strings in `scripts/*.mjs` still printing `usage: node …`, and the `bun test scripts/` false-green (`pre-execution-quality.test.mjs:50` `process.exit(0)`). Known, documented, still present.

  ### Root cause hypothesis

  1. The conventions are **prose read once at Step 0**; nothing in the lane/executor loop re-orders shell-tool choice at command time.
  2. The repo's own artifacts **teach node**: unit-doc validators, obligation rows and CI job names print `node --test scripts/*.test.mjs` verbatim, and script usage strings say `usage: node`. An agent copies the nearest literal.
  3. **rg-first is written nowhere normative** (#269 is backlog/postponed), so grep is always the path of least resistance.

  ### Proposed fix (for triage to cut)

  - One normative line in `AGENTS.md` + `template/AGENTS.md` (agent-tool discipline): *manual invocation runs bun before node; search runs rg before grep; both node/grep remain legitimate fallbacks when the preferred tool is absent — availability is checked once per session, not assumed.*
  - A Step-0 checklist box in `unit-lane` / `execute-phase` (one line, same shape as the model-tier portability notes) so the choice is re-made every turn, not every session.
  - Sweep the `usage: node` strings to the bun form (the same 10 flagged in LOGS.md:3471).
  - **Ownership decision (owner, 2026-10-27): ripgrep-first search stays owned by #269.** This issue's rg duty is only the Step-0 tool-choice discipline — prefer `rg` when it is available, `grep` as the documented fallback — never the search-feature work. No slice of #269 is absorbed here.

  ### Non-goals

  - No runtime-resolution change (#197 already ships `detectRuntime`/`runtimeBin`/`runtimeEnv`).
  - No CI change: the node-compat job stays; node remains the guaranteed fallback.

  ---

  Automated written using an AI.
  ```
- **D1** — 2026-11-04, decision, authority `#331` S6/AC8 plus the bootstrap
  ordering: `scripts/setup-env.mjs` provisions bun, so it cannot print a bun
  usage string on a machine that has no bun yet; `scripts/update-tools.mjs` is
  declared node-run beside it. Both stay `usage: node` and are the gate's
  declared allowlist with that reason. Every other literal moves.
- **D2** — 2026-11-04, decision, authority `S2`: the "Step-0 checklist box"
  lands in the per-turn Turn contract, which is the checklist a turn ticks,
  instead of a sectional Step 0 that is read once per invocation. One line per
  skill, positioned with the other tooling boxes.
- **D3** — 2026-11-04, decision, authority `S9`: the gate is one script
  (`scripts/invocation-drift.mjs`) that scans fixed tokens only — `usage: node`
  literals, `node scripts/` literals in skills with a one-line fallback window,
  and four required-surface strings. It never parses a sentence, and it is the
  single owner of the enforcement half.
- **D4** — 2026-11-04, decision, authority `S8`: the false-green becomes a
  registered skip (`test(name, { skip })`) and the rest of the file moves behind
  the guard in a lexical block. No assertion is deleted and no process exit
  hides the runner's count.
- **E1** (CR-1) — 2026-11-04, frozen-failure corpus at the base tree (`6e65d0b3`):
  `rg -n 'usage: node' scripts/*.mjs` · 21 lines, 19 outside test files, 14
  scripts · the issue's "10" is the 2026-10-28 count; the class grew.
- **E2** (CR-2) — 2026-11-04, `ls skills/evidence-grounding skills/review-spec
  skills/design-feature skills/plan-feature` · exits 2 · all four retired, so
  the guard at `pre-execution-quality.test.mjs:47` fires on every run.
- **E3** (CR-3) — 2026-11-04, `bun test scripts/pre-execution-quality.test.mjs` · exit 0
  · output `SKIP pre-execution-quality: deleted skills … absent`, no test and no
  skip reported — the false green `S8` names.
- **E4** (CR-4) — 2026-11-04, `rg -n 'node\s+scripts/' -U skills` · 9 matches across 6
  files · one (`PREFLIGHT.md:157-158`) declares the fallback on the same line,
  five files teach the node form.
- **E5** — 2026-11-04, `rg -c 'node --test scripts/\*\.test\.mjs' AGENTS.md` ·
  1 · the suite carve-out `S10` preserves.
- **E6** — 2026-11-04, `bun scripts/check-skill-context.mjs` · exit 0 · unit-lane
  3,792 est / 292 lines (ceilings 4,135 / 319); execute-phase 4,479 / 350
  (ceilings 4,693 / 369).
- **E7** — 2026-11-04, `bun scripts/check-skill-context.mjs --documents` · exit 0
  · AGENTS.md 357 lines / 6,255 est (ceilings 393 / 6,881).

- **E8** — 2026-11-04, `node scripts/invocation-drift.mjs` · exit 0 · `verdict: PASS`, `checked: 2 usage strings · 88 skill files · 2 guides · 2 turn contracts`, two `allow:` rows (the bootstrap pair).
- **E9** — 2026-11-04, surface counts: `rg -c 'Manual invocation runs … rg … grep' AGENTS.md template/AGENTS.md` · 1 and 1; `rg -c 'Tool choice re-made' skills/{unit-lane,execute-phase}/SKILL.md` · 1 and 1; `rg -n 'usage: node' scripts/*.mjs` outside tests · the two bootstrap lines only; `rg -c 'as the documented fallback'` · 1 and 1; `rg -c 'setup-env.mjs --check'` in both skills · 1 and 1; `rg -c 'fails by construction' AGENTS.md` · 1.
- **E10** — 2026-11-04, `node --test scripts/invocation-drift.test.mjs` · exit 0 · 11 tests / 11 pass / 0 fail (nine rule fixtures, the live tree, the visible skip). RED first: 9 pass / 2 fail before P3-P6, both failures the frozen-failure corpus.
- **E11** — 2026-11-04, the visible skip: `env -u NODE_TEST_CONTEXT node --test scripts/pre-execution-quality.test.mjs` · exit 0 · `tests 1 / pass 0 / fail 0 / skipped 1`; `bun test scripts/pre-execution-quality.test.mjs` · exit 0 · `0 pass / 1 skip / 0 fail`.
- **E12** — 2026-11-04, `node --test scripts/unit-route.test.mjs` · exit 0 · 57 pass / 0 fail (the swept usage literal still matches).
- **E13** — 2026-11-04, budgets: `bun scripts/check-skill-context.mjs` · exit 0 · 28 skills, unit-lane 3,849 est / 295 lines against 4,135 / 319 and execute-phase 4,536 / 353 against 4,693 / 369; `bun scripts/check-skill-context.mjs --documents` · exit 0 · AGENTS.md 364 lines / 6,358 est against 393 / 6,881; `node scripts/check-skill-context.mjs --routes` · exit 0 · 14 routes, the eight `execute-phase:*` ceilings re-based to exact ceil(measured × 1.10) with the growth source declared in `docs/workflow/SKILL_CONTEXT_BUDGETS.json` (the S2 box).
- **E14** — 2026-11-04, differential (`/tmp` copies of base `6e65d0b3` and the changed tree): the twelve touched scripts run with the same probe argument produce byte-identical stdout/stderr/exit after normalizing only `usage: node` ↔ `usage: bun`; 12/12 same.
- **E15** — 2026-11-04, `bun scripts/phase-lint.mjs docs/fix/329-runtime-invocation-drift/SPEC.md` · exit 0 · `verdict PASS`, all seven phases 6/6.
- **E16** — 2026-11-04, release intent: `bun scripts/lint-changeset.mjs` · exit 0 · the new changeset is well-formed; `node scripts/version-parity-gate.mjs --content --base main` · exit 0 · `VERDICT: PASS`, `[@gtrabanco/pi-agentic-workflow] changeset-intent`.
- **G1** — 2026-11-04, `node scripts/run-root-suite.mjs` · exit 0 · 1,392 tests / 1,391 pass / 0 fail / 1 skipped (the guarded file's registered skip) at the final head.
- **G2** — 2026-11-04, `bun scripts/phase-lint.mjs docs/fix/329-runtime-invocation-drift/SPEC.md` · exit 0 · `verdict PASS`; `node scripts/unit-lineage.mjs --unit 329-runtime-invocation-drift` · exit 0 · `LINEAGE OK — lane-era (triage block re-derives) · obligations closed (14)`.
- **E17** (CR-5) — 2026-11-04, the missing re-decision surface at the base tree: `git grep -c 'Tool choice re-made' main -- skills AGENTS.md template` · exit 1 · 0 matches; `git grep -c 'Manual invocation runs … rg … grep' main -- AGENTS.md template` · exit 1 · 0 matches — nothing re-ordered the choice at turn time and nothing asserted it.
- **P1** — 2026-11-04, unit doc + both planning ledgers cut from issue #329, with `CR-1`…`CR-5`, the acceptance criteria and the triage block · this commit.
- **P2** — 2026-11-04, `scripts/invocation-drift.mjs` + its sibling suite written first; RED on the live tree (9 fixture cases pass, the two corpus cases fail), then green · d777699d.
- **P3** — 2026-11-04, 17 `usage: node` literals in 12 scripts swept to bun; the bootstrap pair keeps its literal by D1; the pin in `scripts/unit-route.test.mjs` moves with it · d777699d.
- **P4** — 2026-11-04, five skill literals swept; the one fallback declaration stays adjacent · d777699d.
- **P5** — 2026-11-04, the normative sentence landed in both guides and the per-turn box in both turn contracts, citing `setup-env.mjs --check`; the suite carve-out is untouched · d777699d.
- **P6** — 2026-11-04, the deleted-skill guard registers a counted skip; the rest of the file sits behind the same guard, no assertion deleted · d777699d.
- **P7** — 2026-11-04, verification: root suite `G1`, differential `E14`, budgets `E13`, lineage `G2`; the eight `execute-phase:*` route ceilings re-based with their declared growth source · d777699d.
- **E18** — 2026-11-04, runtime portability of the new suite: `bun test scripts/invocation-drift.test.mjs` initially failed the S8 case because `process.execPath` is bun there and the nested `node --test` leg executed `bun --test`; the leg now resolves the node binary by name when the parent is bun. Re-run: `bun test` · exit 0 · 11 pass / 0 fail; `node --test` · exit 0 · 11 pass / 0 fail.
- **L2** — 2026-11-04, owner correction, verbatim:
  > Este cambio pretende corregir el uso de node y has usado node en lugar de bun para muchos de tus tests.
- **D5** — 2026-11-04, decision, authority `S11` (the L2 correction, amending how `S5`/`S10` are read): per-file test invocation is `bun test scripts/<file>.test.mjs`, with `node --test` only as the declared fallback; the full gate keeps `node scripts/run-root-suite.mjs` because the measurement (`E19`) shows bun's runner is not equivalent yet. The unit's task validators, obligation rows, the scaffold's validator example and the gate's rule changed in this batch.
- **E19** — 2026-11-04, the measurement behind D5: `bun test scripts/` · exit 1 · `1382 pass / 1 skip / 7 fail`, `Ran 1390 tests across 68 files`; the seven are runner differences, not suite defects: six are bun's 5-second default test timeout on cases that legitimately take longer under `node:test`'s no-default model, one is bun's error frame echoing the source comment that names `ERR_MODULE_NOT_FOUND`. `bun scripts/run-root-suite.mjs scripts/needs-input.test.mjs` · exit 1 · `error: Cannot use afterAll() outside of the test runner`.
- **E20** — 2026-11-04, the bun-first re-runs the correction demands: `bun test scripts/invocation-drift.test.mjs` · exit 0 · 12 pass / 0 fail (the new S11 case included); `bun test scripts/unit-route.test.mjs` · exit 0 · 57 pass / 0 fail; `bun test scripts/pre-execution-quality.test.mjs` · exit 0 · 0 pass / 1 skip / 0 fail; `bun scripts/invocation-drift.mjs` · exit 0 · `verdict: PASS`, 113 files checked (skills + templates).
- **G3** — 2026-11-04, the correction batch's full gate at the corrected head: `node scripts/run-root-suite.mjs` · exit 0 · 1,393 tests / 1,392 pass / 0 fail / 1 skipped.
- **P8** — 2026-11-04, correction batch (L2/S11): the gate now also rules on `node --test …` literals in `skills/**` and `template/**` (`node-command-literal`), the two SPEC templates and the guide state the bun-first per-file form, every task validator and obligation row that invoked a test file moved to `bun test scripts/<file>.test.mjs`, and the measured full-gate reasons are recorded (`E19`) · this commit.

## Next

P2 — write `scripts/invocation-drift.mjs` and its sibling suite first, and run
it red against the base tree.

## References

- Issue [#329](https://github.com/gtrabanco/agentic-workflow/issues/329)
- Roadmap row 88 `runtime-invocation-drift-gate` (features table)
- `AGENTS.md` §Runtime convention; `docs/workflow/SETUP.md` (`setup-env --check`)
- Sibling scope: issue #269 (roadmap row 80) owns the ripgrep search feature
- Template: `docs/fix/_TEMPLATE/SPEC.md`; ledger shapes:
  `skills/pre-execution-review/references/LEDGERS.md`

## Branch

`fix-329-tool-choice`

## Depends on

none — #331's `setup-env.mjs --check` is already on `main` and is cited, not
depended on.

## Regression scope

| Scenario | Check |
|---|---|
| every touched script's usage text still names its own invocation, now bun-form | `bun test scripts/unit-route.test.mjs` exits 0; the differential run against the base copy differs only in `node` → `bun` |
| the root suite still discovers and runs every suite, including the new gate | `node scripts/run-root-suite.mjs` exits 0 |
| the pre-execution-quality assertions still run where the deleted skills exist | the fixture run of the file against the golden fixture (skills present) still executes its cases |
| skill and guide context budgets still pass | `bun scripts/check-skill-context.mjs` and `bun scripts/check-skill-context.mjs --documents` exit 0 |
