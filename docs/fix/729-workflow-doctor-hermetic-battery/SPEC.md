---
type: fix
scope: xs
roadmap_summary: Issue [#729](https://github.com/gtrabanco/agentic-workflow/issues/729) (S): the `workflow-doctor` battery suite answers green with and without an ambient `AGENTIC_WORKFLOW_SKILLS_ROOT` — the three discovery cases declare their scenario's `env` (the injection the sibling cases already use), every assertion byte unchanged, and the root gate proves both environments.
---

# fix/729-workflow-doctor-hermetic-battery

> Fix specification — one single unit document.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.1
schema: @gtrabanco/agentic-workflow-schema@4.10.1
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

```text
retention-declaration@1
path | disposition
TASKS.md | trimmable · legacy carrier
PLAN.md | trimmable
progress.md | trimmable · legacy carrier
ACCEPTANCE.md | trimmable · legacy carrier
testing.md | trimmable
CHECKLIST.md | trimmable
BRIEF.md | trimmable
pr-body.md | trimmable
external-verify.md | trimmable
review-findings.md | trimmable
planning-findings.md | trimmable
SPEC.md | kept
decisions.md | kept
known-issues.md | kept
planning-obligations.md | kept
planning-evidence.md | kept
architecture-notes.md | kept
sources.md | kept
research.md | kept
```

## Issue

`#729` — tracked issue in the project's forge, filed 2026-11-25 from unit
#698's external-verify diagnosis (advisory A1, `SPEC.md` E21 there). The PR
must close it via `Closes #729`.

## Specs

Requirements, each numbered `S#` quoting the issue's own words verbatim.

**S1 — the battery suite is hermetic against the host declaration.**
> The battery suite is green with **and** without an ambient host declaration: the discovery cases state their scenario's env explicitly (the sibling cases at `:518` and `:536` already inject `env` — the house style), and every assertion keeps its exact expectation.

**S2 — the root suite proves it under both environments.**
> `env -u AGENTIC_WORKFLOW_SKILLS_ROOT bun scripts/run-root-suite.mjs` and the same run **with** the variable set both exit 0.

**S3 — the repair touches inputs, never assertions.**
> The diff of `scripts/workflow-doctor.test.mjs` adds only env isolation (the `env:` argument and its comment) — every assertion line is byte-identical to base.

## Acceptance criteria

- **AC1** — `env AGENTIC_WORKFLOW_SKILLS_ROOT=<any existing dir> bun test scripts/workflow-doctor.test.mjs` exits 0, and the same command without the variable also exits 0. (S1)
- **AC2** — `git diff origin/main..HEAD -- scripts/workflow-doctor.test.mjs | rg '^-[^-]' | rg 'assert'` matches nothing (exit 1) — the diff adds only the `env:` argument and its comment, and every assertion line is byte-identical to base. (S3)
- **AC3** — `env -u AGENTIC_WORKFLOW_SKILLS_ROOT bun scripts/run-root-suite.mjs` and the same run **with** the variable set both exit 0. (S2)
## Impact

What the fix touches beyond its own lines:

- **Named high-risk item (from the tier verdict, quoted verbatim):**
  `scripts/workflow-doctor.test.mjs` · `signal: destructive` — the classifier
  escalates because the test file imports `../packages/agentic-workflow/src/workflow-doctor/upstream.mjs`
  at module level (the forge-facing module). This unit's hunks are four
  `buildBattery` calls plus one comment; no forge path, no assertion and no
  runtime module is edited.
- The battery **runtime is untouched**: `locateSkillsTree`'s precedence
  (`--skills-root` → host declaration → `.agents/skills` → `.claude/skills` →
  `skills/`) is #703's approved #716/#717 design and stays exactly as it is —
  this unit fixes the suite's inputs, not the resolution rule.
- Consumers of the suite: `scripts/run-root-suite.mjs` (root gate), the
  installed `pre-push` hook, and the manual `root-suite.yml` CI workflow — all
  of them simply stop being environment-sensitive.
- The surviving observation that the installed pi tree carries no literal
  launcher pin (so any undeclared resolution to it yields `pin-absent`) is
  disclosed here and left to #703's domain — see `## Non-goals`.
- The unit's own review mark raises the harvest's frozen count: its `R1` line
  (`10b086702`) is one more `R` mark in the tree, so
  `scripts/findings-corpus.test.mjs`'s `reviewMarks` constant moves 174 → 175
  (`3ab8b15d6`) — the same mechanism fix/701's re-freeze documented, never a
  relaxed assertion. The unit's second non-doc hunk, four lines of constant and
  comment.

## Surfaces

- `scripts`
- `docs`

## Retirements

None — strictly an input-isolation repair: nothing is removed, renamed or
orphaned. The ambient-read default `options.env ?? process.env` in
`packages/agentic-workflow/src/workflow-doctor/battery.mjs:188` stays — it is
the runtime's own contract (production sessions must keep reading the host
declaration), not a surface this unit retires. No new exported symbol, token
or consumer is added past the unit's own document.

## Non-goals

- **No change to the resolution precedence.** Declared-over-discovered is
  #703's shipped design for #716/#717; inverting it to make tests pass would
  be the IR3 violation this unit exists to avoid.
- **No host-side unpublishing** of `AGENTIC_WORKFLOW_SKILLS_ROOT` in the pi
  package — the publication is the feature.
- **The installed pi tree's missing literal launcher pin** (why an undeclared
  resolution to it reports `pin-absent`) is a separate question in #703's
  domain; this unit does not touch the pin reader.

## Risk tier

Copied verbatim from `runner ceremony tier classify` at the cut head over the
planned paths (`scripts/workflow-doctor.test.mjs`, this document):

- **Tier** — `high` · **Task Size** — `{understood: true, contained_risk: "named", resumable_from_diff: true, ceremony: "unit-doc+review-change", verification: "review-change"}`
- **Named high-risk item** — `scripts/workflow-doctor.test.mjs` (`signal: destructive`)

`reason`: `1 path(s) touch a named high-risk surface: destructive (scripts/workflow-doctor.test.mjs · ../packages/agentic-workflow/src/workflow-doctor/upstream.mjs · (module-level))`.
The escalation is the test file's own pre-existing module-level import of the
forge-facing module — every edit to this file escalates, as unit #698 recorded
for its bin. The high tier's full review pass runs on this branch; the hunk
never reaches the forge.

## Future

none.

## Future cost

- Every future `buildBattery` case in this suite must declare its scenario's
  `env` (inject `env:` or document that no ambient declaration is assumed);
  binds future authors of `scripts/workflow-doctor.test.mjs`, proven red here
  the moment an ambient declaration exists.

## Applicable tests

- `env AGENTIC_WORKFLOW_SKILLS_ROOT=$(pwd)/skills bun test scripts/workflow-doctor.test.mjs` — the hermetic suite under a host declaration.
- `env -u AGENTIC_WORKFLOW_SKILLS_ROOT bun test scripts/workflow-doctor.test.mjs` — the same suite in a clean environment.
- `bun scripts/run-root-suite.mjs` under both environments (S2's gate run).
- `bun test scripts/findings-corpus.test.mjs` — the frozen harvest counts the
  unit's own `R1` line moves.
- `bun scripts/docs-generate.mjs --check`, `bun scripts/skill-lint.mjs`,
  `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/729-workflow-doctor-hermetic-battery/SPEC.md --no-git`
  — the doc-state checks this unit's documents carry.

## Known pre-existing issues

- **The classifier escalates any edit to `scripts/workflow-doctor.test.mjs`**
  (`signal: destructive`, module-level `upstream.mjs` import). `does-not-affect`
  this unit: recorded as the named high-risk item above; the hunks are env
  arguments in four calls.
- **The installed pi tree's `RUNNER.md` carries no literal launcher pin**
  (`bunx @gtrabanco/agentic-workflow@4.10.1` absent), so a host-declared
  resolution reports `pin-absent`. `does-not-affect` this unit: after the fix
  no test resolves the host tree, and the product question stays in #703.
- **The ambient `AGENTIC_WORKFLOW_SKILLS_ROOT` exists only on installs of
  `@gtrabanco/pi-agentic-workflow` ≥ `5.0.0-canary.20261125.1`.** `affects`
  this unit's procedure only: the red corpus below is observed with an
  explicit `env` so the reproducer does not depend on the machine's install.

## Tasks

- P1 — Cut the unit doc with its embedded ledgers and register the `## Fixes` row through the writer (validator: `rg -c '^TRIAGE — 729' docs/fix/729-workflow-doctor-hermetic-battery/SPEC.md` matches 1 AND `rg -c 'issues/729' docs/ROADMAP.md` matches 1)
  (Implements: S1, S2, S3)
  - Relevant files: docs/fix/729-workflow-doctor-hermetic-battery/SPEC.md, docs/ROADMAP.md
- P2 — Declare the three cases' scenario env: inject `env` into the four ambient `buildBattery` calls, assertions untouched (validator: `env AGENTIC_WORKFLOW_SKILLS_ROOT=$(pwd)/skills bun test scripts/workflow-doctor.test.mjs` exits 0 AND `env -u AGENTIC_WORKFLOW_SKILLS_ROOT bun test scripts/workflow-doctor.test.mjs` exits 0)
  (Implements: S1)
  - Relevant files: scripts/workflow-doctor.test.mjs
- P3 — Verification: both root-gate environments, the assertion-preservation diff check, and the doc-state checks (validator: `env AGENTIC_WORKFLOW_SKILLS_ROOT=$(pwd)/skills bun scripts/run-root-suite.mjs` exits 0 AND `env -u AGENTIC_WORKFLOW_SKILLS_ROOT bun scripts/run-root-suite.mjs` exits 0 AND `git diff origin/main..HEAD -- scripts/workflow-doctor.test.mjs | rg '^-[^-]' | rg 'assert'` matches nothing AND `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/729-workflow-doctor-hermetic-battery/SPEC.md --no-git` exits 0)
  (Implements: S2, S3)
  - Relevant files: scripts/workflow-doctor.test.mjs, docs/fix/729-workflow-doctor-hermetic-battery/SPEC.md

### Planning evidence

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | known (read this session) | `buildBattery` honors an injected `env`: `battery.mjs:188` reads `options.env ?? process.env`, and `locateSkillsTree` consults only `SKILLS_ROOT_ENV` from it | `packages/agentic-workflow/src/workflow-doctor/battery.mjs:127,188` | current | O1 |
| PE-002 | known (read this session) | the sibling cases already inject their scenario env — `:518` (`--skills-root`) and `:536` (host declaration) pass `env:` explicitly; injection is the suite's own house style | `scripts/workflow-doctor.test.mjs:518,536` | current | O1 |
| PE-003 | sampled-tool-behaviour | the ambient `AGENTIC_WORKFLOW_SKILLS_ROOT` is published once per session by the installed pi package (`5.0.0-canary.20261125.1`, `dist/runtime.js:30`), so every local Pi session on that install carries it | installed package bytes + `env` of this session, sampled 2026-11-25 | current | O1, O2 |
| PE-004 | sampled-tool-behaviour | at the cut head with an explicit declaration the suite answers 20 pass / 3 fail (the three ambient calls); without it, 23 pass / 0 fail | the two foreground runs in `## Log` E1/E2 | current | O1, O2 |
| PE-005 | known (read this session) | the test file's module-level import of `upstream.mjs` is what the tier classifier reads as `signal: destructive` — the escalation is pre-existing, every edit to the file escalates | `runner ceremony tier classify` verdict (Risk tier section) + `scripts/workflow-doctor.test.mjs` imports | current | D1 |
| PE-006 | known (read this session) | the harvest pins the counts the tree actually carries, so a unit that records a review or finding line raises the constant by hand — the mechanism issue #651 introduced and fix/701 re-froze for its own `F1` row | `scripts/findings-corpus.test.mjs:189-197` + `7d1634811` | current | O4 |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1 | the battery suite answers green with and without an ambient host declaration: the three discovery cases state their scenario env, every assertion byte unchanged | P2 | P2 | direct application | `env AGENTIC_WORKFLOW_SKILLS_ROOT=$(pwd)/skills bun test scripts/workflow-doctor.test.mjs` exits 0 AND `env -u AGENTIC_WORKFLOW_SKILLS_ROOT bun test scripts/workflow-doctor.test.mjs` exits 0 | E lines in SPEC `## Log` naming both exits | verified |
| O2 | S2 | the root gate answers green in both environments — no session's host declaration can redden it | P3 | P3 | direct application | `env AGENTIC_WORKFLOW_SKILLS_ROOT=$(pwd)/skills bun scripts/run-root-suite.mjs` exits 0 AND `env -u AGENTIC_WORKFLOW_SKILLS_ROOT bun scripts/run-root-suite.mjs` exits 0 | E line in SPEC `## Log` with both exits | verified |
| O3 | S3 | the repair changes inputs only: no assertion line is deleted, relaxed or edited | P2 | P2 | direct application | `git diff origin/main..HEAD -- scripts/workflow-doctor.test.mjs \| rg '^-[^-]' \| rg 'assert'` matches nothing (exit 1) | E line in SPEC `## Log` | verified |
| O4 | S1 (post-cut, D4's closure) | the harvest's frozen counts match the tree this unit ships: the unit's own `R1` mark is counted, so `reviewMarks` reads 175 and the constant moves with it | P2 | P2 | direct application | `bun test scripts/findings-corpus.test.mjs` exits 0 | E line in SPEC `## Log` naming the exit and the constant's old and new value | verified |

## Triaged steps

```text
TRIAGE — 729 (fix)
Steps: plan, implement, evidence, review, docs
Tiers: plan: cheap, implement: cheap, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, tests: tests n/a, release: not a feature
Budget: strong
relay: bootstrap-needed — no packet at .pi-web/relays/729-workflow-doctor-hermetic-battery
relay-next: create .pi-web/relays/729-workflow-doctor-hermetic-battery/ (charter → docs/fix/729-workflow-doctor-hermetic-battery/SPEC.md) then dispatch_relay(packet: ".pi-web/relays/729-workflow-doctor-hermetic-battery", leg: "1") · legs: 4 = 3 phases + 1 coherence review
```

`tests` is triaged `tests n/a` (the fix lands in a suite that is itself the
artifact); the suite runs are this unit's evidence step and P3's validators.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-25, the issue, verbatim:
  ```
  ISSUE: workflow-doctor battery tests are not hermetic against the host's declared skills root

  What's broken: Three cases in scripts/workflow-doctor.test.mjs call buildBattery without injecting the scenario's env, so the ambient AGENTIC_WORKFLOW_SKILLS_ROOT decides the fixture's skills tree. That variable is published once per session by @gtrabanco/pi-agentic-workflow (since 5.0.0-canary.20261125.1, src/runtime.ts) — the declared-over-discovered design unit #703 shipped for #716/#717. With the variable present, locateSkillsTree resolves the host tree instead of the fixture's: source: host instead of agents, and the installed pi tree carries no literal launcher pin (bunx @gtrabanco/agentic-workflow@4.10.1 absent), so a pin-absent degradation appears where the tests assert zero. Every local Pi session on such an install fails the suite; the failure is base-present (identical on origin/main with the variable set).

  Expected behaviour: The battery suite is green with and without an ambient host declaration: the discovery cases state their scenario's env explicitly (the sibling cases at :518 and :536 already inject env — the house style), and every assertion keeps its exact expectation.

  Actual behaviour: The three ambient calls fail under any host declaration; assertions are correct and must not change.

  Root cause (if known): Unit #703's correction batch added the host-declaration precedence (correct, stays) but left three buildBattery(dir, { doctor … }) calls in its own suite reading process.env — a non-hermetic fixture input, not a code defect. The battery's contract already accepts injectable env.

  Acceptance criteria:
  1. env AGENTIC_WORKFLOW_SKILLS_ROOT=<any existing dir> bun test scripts/workflow-doctor.test.mjs exits 0, and the same command without the variable also exits 0.
  2. The diff of scripts/workflow-doctor.test.mjs adds only env isolation (the env: argument and its comment) — every assertion line is byte-identical to base.
  3. env -u AGENTIC_WORKFLOW_SKILLS_ROOT bun scripts/run-root-suite.mjs and the same run with the variable set both exit 0.

  Severity: medium (functional but degraded — local gates red in every Pi session on the canary install)
  ```
- **L2** — 2026-11-25, the owner's order choosing the option, verbatim:
  ```
  1. Opción A
  2. Verifica tú.
  ```
- **E1** — 2026-11-25, the frozen red corpus at the cut head (`207147ff1`), declaration explicit: `env AGENTIC_WORKFLOW_SKILLS_ROOT=/home/agent/.pi/agent/npm/node_modules/@gtrabanco/pi-agentic-workflow/skills bun test scripts/workflow-doctor.test.mjs` · exit 1 · **20 pass / 3 fail** — `the battery embeds the doctor envelope verbatim and reports the runner version and pin`, `an absent doctor refuses the battery instead of fabricating a healthy row`, `the battery locates the installed skills tree through the skills CLI's documented install dirs`.
- **E2** — 2026-11-25, the clean-environment baseline at the same head: `env -u AGENTIC_WORKFLOW_SKILLS_ROOT bun test scripts/workflow-doctor.test.mjs` · exit 0 · **23 pass / 0 fail**.

- **E3** — 2026-11-25, P2's validator in three environments at `cb5276399`: `env AGENTIC_WORKFLOW_SKILLS_ROOT=$(pwd)/skills bun test scripts/workflow-doctor.test.mjs` · exit 0 · **23 pass / 0 fail**; the same command under the exact value E1 went red under (`/home/agent/.pi/agent/npm/node_modules/@gtrabanco/pi-agentic-workflow/skills`) · exit 0 · **23 pass / 0 fail**; `env -u AGENTIC_WORKFLOW_SKILLS_ROOT bun test scripts/workflow-doctor.test.mjs` · exit 0 · **23 pass / 0 fail** — the E1 corpus is green under its own reproducer.
- **E4** — 2026-11-25, P3's both-environment gate: `env AGENTIC_WORKFLOW_SKILLS_ROOT=$(pwd)/skills bun scripts/run-root-suite.mjs` · exit 0 · **144 suites PASS, 0 FAIL**; `env -u AGENTIC_WORKFLOW_SKILLS_ROOT bun scripts/run-root-suite.mjs` · exit 0 · **144 suites PASS, 0 FAIL** — the ambient declaration can no longer redden the root gate.
- **P1** — 2026-11-25, unit doc + embedded ledgers + decisions, the `## Fixes` row registered through `roadmap fixrow`, projection re-emitted · `c0ed2b475`.
- **P2** — 2026-11-25, the scenario env declared in the three cases (four `buildBattery` calls + one comment; zero assertion lines touched, E5) · `cb5276399`.
- **E5** — 2026-11-25, the assertion-preservation and doc-state checks: `git diff origin/main..HEAD -- scripts/workflow-doctor.test.mjs | rg '^-[^-]' | rg 'assert'` · exit 1 (matches nothing — every assertion line byte-identical); `agentic-workflow verify …/SPEC.md --no-git` · exit 0 · `"ok": true, "violations": []`; `bun scripts/roadmap-settle.mjs` · exit 0 · `verdict: PASS`; `bun scripts/docs-generate.mjs --check` · exit 0 · PASS; `bun scripts/skill-lint.mjs` · `0 finding(s) · verdict: PASS`; `bun scripts/check-skill-context.mjs` · exit 0; `bun scripts/lint-changeset.mjs` · exit 0; `journal aggregate --check` · `ok (59)`.
- **L3** — 2026-11-26, date correction (append-only; the session crossed UTC midnight between #698's batch and this unit): every run recorded above — #729's filing, L1's capture, L2's owner order, E1–E5 and P1/P2 — happened on **2026-11-26** (issue `createdAt` `2026-11-26T14:57:29Z`; this unit's journal fragment `20261126T151803Z`), not the `2026-11-25` their lines print, and `decisions.md` D1's authority date carries the same slip. What stays correct at `2026-11-25`: #698's diagnosis (E21 there), PE-003's first sample of the variable in that turn, and the pi package's own `canary.20261125` name; PE-003's `runtime.js` bytes were read 2026-11-26.
- **G1** — 2026-11-26, GATE-RAN · HEAD 27842a182cad566667eb89f63d82a6f86f7d76ec · `env -u AGENTIC_WORKFLOW_SKILLS_ROOT bun scripts/run-root-suite.mjs` | `env AGENTIC_WORKFLOW_SKILLS_ROOT=/home/agent/.pi/agent/npm/node_modules/@gtrabanco/pi-agentic-workflow/skills bun scripts/run-root-suite.mjs` · exit 0 · 144 suites PASS / 0 FAIL in both environments (the review's gate run at the reviewed head).
- **V1** — 2026-11-26, docs/fix/729-workflow-doctor-hermetic-battery/SPEC.md:65 · reviewer review-change · HEAD 27842a182cad566667eb89f63d82a6f86f7d76ec · recheck direct read of AC2 against `skills/verification-contract/SKILL.md` section "Every criterion names its demonstrating command (S5)": the criterion carries no backticked command and no `manual:`/`read-verified:` label while its claim is command-settleable (O3's validator in this same doc settles it), so S5 fails it closed at review · confirmed
- **R1** — 2026-11-26, review at HEAD 27842a182cad566667eb89f63d82a6f86f7d76ec · verdict REVIEW-FAIL · cycle 1 · gate exit 0 · 1 fix-now row (F1, plan-owned, route replan-in-unit); 1 report-only ignore row (machine gate receipt absent — `runner gate-receipt verify` exit 3); 1 candidate refuted (missing `ac-hash` — the design step was triaged out and the verification contract requires only the `## Acceptance criteria` section plus its E-line receipts)
- **F1** — 2026-11-26, REPLANNED IN UNIT — AC2 (`SPEC.md:65`) carried no demonstrating command (verification-contract S5); the plan re-cut delivers it at `3132d8f8a` (the criterion now embeds the O3 validator's own command, claim text otherwise intact), owner-confirmed 2026-11-26 (`selected minimal-recut`, decisions D3/D4). Never folded: the row's `replan-in-unit` class freezes the fold batch (FOLD_PROCESS §7); recorded per the migrated precedent fix-319 F4/F5 — row removed from `## Findings`, delivery commit and confirmation cited here.

- **E6** — 2026-11-26, the base-vs-delivered differential S2 was missing (E4 recorded only the delivered arm): a `--shared` clone of this repository checked out at base `207147ff1` ran `env -u AGENTIC_WORKFLOW_SKILLS_ROOT bun scripts/run-root-suite.mjs` · exit 1 · **142 PASS / 2 FAIL** (`scripts/doc-discipline.test.mjs`, `scripts/local-gate.test.mjs` — clone-environment artifacts, identical in both arms) and the same command under `AGENTIC_WORKFLOW_SKILLS_ROOT=/home/agent/.pi/agent/npm/node_modules/@gtrabanco/pi-agentic-workflow/skills` · exit 1 · **141 PASS / 3 FAIL** — the one-suite delta is `scripts/workflow-doctor.test.mjs`, E1's corpus reaching the gate. The clone lived under `/tmp` and is removed after this line.
- **E7** — 2026-11-26, the suite-level differential, one head each side: at `207147ff1` in that same clone `env -u AGENTIC_WORKFLOW_SKILLS_ROOT bun test scripts/workflow-doctor.test.mjs` · exit 0 · **23 pass / 0 fail**, and the declaration arm · exit 1 · **20 pass / 3 fail** (E1's three cases, unchanged); at `3ab8b15d6` the three arms — `env -u`, the pi canary skills dir, `$(pwd)/skills` — each · exit 0 · **23 pass / 0 fail**.
- **E8** — 2026-11-26, the harvest re-freeze this unit's own `R1` line forced (O4): `bun test scripts/findings-corpus.test.mjs` at `3170bf346` · exit 1 · **16 pass / 1 fail** (`corpus.reviewMarks` 175 against the frozen 174), then after `scripts/findings-corpus.test.mjs`'s constant moved 174 → 175 (`3ab8b15d6`) · exit 0 · **17 pass / 0 fail**. The tree carries 175 `R` marks: 174 + this unit's `R1` — the mechanism issue #651 introduced, never a relaxed assertion (the four moved lines are the constant and its comment).
- **E9** — 2026-11-26, the re-read of V1's blocker (AC2 carried no demonstrating command) at HEAD `3ab8b15d6`: AC2 now names its own command and that command was run — `git diff origin/main..HEAD -- scripts/workflow-doctor.test.mjs \| rg '^-[^-]' \| rg 'assert'` · exit 1 (matches nothing), exactly the criterion's claim — so S5's demand is met by `3132d8f8a` under D3/D4. Evidence, not a review mark: the cycle-2 `review-change` pass is the reviewer's write.
- **G2** — 2026-11-26, GATE-RAN · HEAD `3ab8b15d6` · `env -u AGENTIC_WORKFLOW_SKILLS_ROOT bun scripts/run-root-suite.mjs` | `env AGENTIC_WORKFLOW_SKILLS_ROOT=/home/agent/.pi/agent/npm/node_modules/@gtrabanco/pi-agentic-workflow/skills bun scripts/run-root-suite.mjs` · exit 0 · **144 suites PASS / 0 FAIL** in both environments, run after the re-freeze.
- **V2** — 2026-11-26, docs/fix/729-workflow-doctor-hermetic-battery/SPEC.md:65 · outer driver recheck of F1 · HEAD 3132d8f8a · recheck direct read of AC2 against verification-contract S5 (the materialized `finding-mark@1` method from V1) + live `git diff origin/main..HEAD -- scripts/workflow-doctor.test.mjs | rg '^-[^-]' | rg 'assert'` → exit 1 (matches nothing) · the criterion now carries its backticked command and S5 passes it · confirmed fixed; dispute resolved by the pre-recorded owner decision D3.
- **P3** — 2026-11-26, verification (both root-suite environments 144/144, O3 diff check, doc-state checks green — E4/E5; re-run at the reviewed head as G1) → `fb63c118e` — next: review cycle 2.
- **G3** — 2026-11-26, GATE-RAN · reviewer review-change, cycle 2 · five attempts in this worktree at the reviewed head `3170bf346` (the support session's unpushed `3ab8b15d6` corpus re-freeze and its evidence commits landed in the worktree mid-review): `env -u AGENTIC_WORKFLOW_SKILLS_ROOT bun scripts/run-root-suite.mjs` → exit 1 (final attempt 142 PASS / 2 FAIL) | the same run with the ambient variable set → exit 1 (140 PASS / 4 FAIL) — every failure a wall-clock bound (`SUITE TIMEOUT` / 60s / 10s) rotating across suites while 3–7 concurrent gates from other sessions ran on the 6-CPU box (load 8–13.7), zero assertion failures in these runs: assertion-green, environment-red; a green both-environments gate exists at the delivered head — the support session's `G2` at `3ab8b15d6` · exit 0 · 144 suites PASS / 0 FAIL (line above); `bun scripts/roadmap-settle.mjs` · exit 0 · PASS; `bun scripts/docs-generate.mjs --check` · exit 0 · PASS. (`G2` is taken by that delivered-head mark, so this reviewer's run records as `G3`.)
- **V3** — 2026-11-26, docs/fix/729-workflow-doctor-hermetic-battery/SPEC.md:65 · reviewer review-change · HEAD 3170bf3465245eafea20babcf0d84e1639ac7152 · cycle-2 recheck of F1: direct read of AC2 against verification-contract S5 — the criterion now embeds its demonstrating command and the claim text is otherwise intact — plus the live O3 command `git diff origin/main..HEAD -- scripts/workflow-doctor.test.mjs | rg '^-[^-]' | rg 'assert'` → exit 1 (matches nothing); closure record judged legitimate (row left `## Findings` + `F` Log line = the migrated close grammar; FOLD_POLICY already-fixed → user decision, taken as D3 before any fold; precedent fix-319 F4/F5/V7; never folded per FOLD_PROCESS §7 freeze) · confirmed fixed, no dispute.
- **R2** — 2026-11-26, review at HEAD 3170bf3465245eafea20babcf0d84e1639ac7152 · verdict REVIEW-FAIL · cycle 2 (delta `27842a182..HEAD`: 2 files, 12 changed lines — neither escalation trigger fired; cited-line AC2 at SPEC.md:65 + the review's own ledger marks, decisions.md D3/D4) · gate exit 1 in both environments (G3 — timeout-only under concurrent load; the support session's delivered-head `G2` at `3ab8b15d6` is green both ways; carried report-only: gate receipt still missing, pre-audit step) · 1 new fix-now row (F2, workflow/source — the blank-line-split decisions table, introduced by this cycle's D3/D4 rows; CONVERGENCE-ANOMALY) · F1 recheck passed (V3) · support commits `3ab8b15d6` + 2 landed unpushed mid-review (outside this delta; PR head still `3170bf346`) · no receipt posted.
- **F2** — 2026-11-26, cycle-2 F2 folded · `850ee5618` · the D3/D4 decision rows rejoined the unit's one `decisions.md` table (the blank lines that split it removed, no decision text touched), so every decision row parses as a row again · verified by `bun test scripts/findings-corpus.test.mjs` exit 0 — the fold also returns the harvest's finding count to 1166, its value before F2's own row existed — and `agentic-workflow verify …/SPEC.md --no-git` exit 0.
## Next

Paste the triage block at cut, implement P2 against the frozen ledgers, run P3,
then `review-change` (the computed high tier requires the full review pass) and
open the PR with `Closes #729`.

## References

- Issue [#729](https://github.com/gtrabanco/agentic-workflow/issues/729) — this unit's issue.
- Issue [#703](https://github.com/gtrabanco/agentic-workflow/issues/703) — the battery suite's owner; the pin observation belongs there.
- Issues [#716](https://github.com/gtrabanco/agentic-workflow/issues/716) / [#717](https://github.com/gtrabanco/agentic-workflow/issues/717) — the declared-over-discovered design this fix must not touch.
- Unit #698's `SPEC.md` E21 — the diagnosis that led here.

## Branch

`fix/729-workflow-doctor-hermetic-battery`

## Depends on

Empty — independent.

## Regression scope

| scenario | check |
|---|---|
| a declared host root still outranks the convention dirs at runtime (the design stays) | `bun test scripts/workflow-doctor.test.mjs` case `the host's AGENTIC_WORKFLOW_SKILLS_ROOT declaration outranks the convention dirs` stays green |
| `--skills-root` still wins over everything | the case `a declared skills root wins over the conventions…` stays green |
| the suite answers green in CI's clean environment (no declaration) | the env-unset root-suite run of S2 exits 0 |
| every assertion the three cases carry is untouched | the O3 diff check matches no `assert` line among the removed lines |
