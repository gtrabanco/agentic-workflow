# 52 — machine-checked-turn-contract

> Feature specification for issue
> [#226](https://github.com/gtrabanco/agentic-workflow/issues/226). One SPEC,
> two halves: this file's Product half is authored by `design-feature` (this
> document); the Engineering half is authored by `plan-feature` after an
> independent Product review.

## Goal

One deterministic verifier for the canonical turn contract. A script — a
producer-crate engine for this repo plus a scaffold-shipped shim for target
projects — mechanically checks the five mechanical boxes (branch, pre-edit
gates + frozen acceptance, commit, push/PR, clean tree) and prints a fixed
one-line receipt (`TURN-CONTRACT ok` or `TURN-CONTRACT fail box<N>: <code>`).
A machine-check profile in the canonical `TURN_CONTRACT.md` makes pasting that
receipt the demonstration method for boxes 1–5, so agents stop re-emitting the
11 boxes as prose every turn; boxes 6–11 stay agent-attested judgment calls.
The closing `→ Next:` hand-off may be echoed from the workflow-status sensor's
envelope `next` fields instead of hand-authored. Compliance evidence becomes
deterministic and the per-turn output-token tax drops.

## Branch

`feat/52-machine-checked-turn-contract`

## Size

`M` — two engines (crate subcommand + template shim) with parity tests, a
canonical-contract profile section, a normative-surface registration, and docs
wiring; planned as 3 phases (engines → profile/registration → hardening & PR).
Size delegated to the skill by the user (D-52-1); full artifact set, no split
(single concern, ≤ 5 phases, no unresolved product decisions after the
interview).

## Dependencies

No hard dependencies:

- **37 `phase-lint-script`**: MERGED via PR
  [#212](https://github.com/gtrabanco/agentic-workflow/pull/212). Vehicle rule
  satisfied — the producer crate `@gtrabanco/agentic-workflow` exists on
  `main`, so this feature's verifier lands as a crate subcommand (declined 43
  redistribution).
- **38 `workflow-status-sensor-script`**: MERGED via PR
  [#213](https://github.com/gtrabanco/agentic-workflow/pull/213). The sensor
  already emits Envelope v2 with `next` fields
  (`scripts/workflow-status.mjs:1270`) — the echo source exists.

Soft dependencies:

- **33 `turn-contract-single-owner`** (#173, `idea`): its per-skill migration
  adopts the machine profile for bespoke contracts — must not start before
  this feature lands the profile in the canonical contract.
- **35 `scoped-receipt-verifier`** (#182, `idea`): shares the CLI/digest
  family; no surface overlap blocking this unit.
- **48 `binary-validated-continuations`** (#215, `idea`): continuations may
  carry the receipt later; no coupling now.
- **56 `design-interview-batching`** (#231, `idea`): unrelated surfaces.

---

## Product half

Written by `design-feature` (2026-09-16). Complete: `## Design status` below
reads `designed`.

### Context

Every skill turn re-emits the canonical turn contract's 11 boxes as prose — a
pure output-token tax. Issue #226's 2026-09-15 token audit measured a full
feature run at ~129K tokens of skill text, with contract narration re-paid on
every turn. Boxes 1–5 (branch, gates + frozen acceptance, commit, push/PR,
clean tree) are 100% mechanically checkable with `git`/`gh`; boxes 6–11 are
judgment calls that must stay agent-attested.

The substrate is already in place: `template/.agentic-workflow/hooks/guard-command.sh`
enforces a policy subset deterministically (same fixed-output + exit-code
pattern this feature generalizes); `scripts/workflow-status.mjs` already emits
the Envelope v2 `next` fields the echo consumes;
`scripts/normative-drift.test.mjs` already pins versioned grammar blocks, so
the receipt grammar gets the same treatment.

The research gate grounded the pattern externally (evidence rows in
`decisions.md`): StateProof distills the domain thesis — *"For action-taking
agents, the final answer is a claim, not evidence"* — compile the contract
once, verify every run deterministically with zero model calls, cite the proof.
pre-commit shows the distribution shape — package the deterministic check once
and ship it via a framework/scaffold instead of copying scripts project to
project. This feature is that pattern applied to the turn contract: the
contract is compiled once (the profile + grammar), compliance is verified
mechanically (the engines), and distribution rides the scaffold (the shim).
What the capability is not: not a model judging compliance (zero model calls),
not persisted state, not a change to what the boxes require.

### Business goals

- Cut the per-turn output-token tax: demonstrating boxes 1–5 becomes one
  pasted receipt line plus the git/gh evidence, not an 11-box prose recitation.
- Make compliance evidence deterministic and fail-closed (exit-code contract,
  fixed grammar) — removing it from model judgment, per the domain pattern
  above.

### Scope

#### In scope

1. **Verifier engine** in the producer crate:
   `packages/agentic-workflow/bin/turn-contract.mjs` (node-compatible, bun is
   the primary runtime per repo convention), flags `--finished` and `--help`;
   checks boxes 1–5 per the semantics below; prints the receipt; exits
   `0` ok / `1` contract fail / `2` usage error. (AC1–AC6)
2. **Scaffold shim**: `template/.agentic-workflow/hooks/turn-contract.sh`
   (bash + git + gh only — no node/bun), same flags, same receipt grammar,
   same exit codes, so target projects running the scaffold get the verifier
   too. (AC7, AC12, AC13)
3. **Receipt grammar**, declared once as a versioned fenced surface in
   `TURN_CONTRACT.md` and registered in `CLAUDE.md`'s normative-surfaces
   table (machine `n/a`; no schema-package vocabulary — D-52-5); a repo test
   pins engine↔grammar conformance. (AC8)
4. **Machine-check profile** section in
   `skills/orchestration-envelope/references/TURN_CONTRACT.md`: boxes 1–5 are
   demonstrated by running the verifier and pasting the one-line result;
   prose recitation of boxes 1–5 is no longer required when the verifier ran;
   the fallback (verifier unavailable → recite as today) is stated; boxes
   6–11 requirements are unchanged; the closing `→ Next:` block may be echoed
   from the sensor's envelope `next` fields, preserving the fixed block shape
   (recommended line + `·` alternatives). (AC9, AC10, AC11)
5. **Box semantics** (mechanical, per the accepted interview defaults):
   box1 = not on the default branch (else `branch-default`; outside a git
   repo → `not-a-repo`); box2 = frozen-acceptance artifacts present at HEAD
   (`acceptance-missing`) and, when the project has the phase-lint script and
   the unit has a plan, phase-lint green (`phase-lint-failed`) — cheap
   deterministic checks only, full gate re-runs stay with #172/#35; box3 =
   ≥ 1 commit on the branch not on the default branch (`no-commits`); box4 =
   only with `--finished` (pushed + PR open for the branch + PR head equals
   local HEAD: `pr-not-open` / `pr-head-mismatch` / `pr-unreachable` when gh
   is unreachable — fail-closed, never a fake ok), without the flag box4 is
   not-applicable and never fails the line; box5 = clean tree
   (`dirty-tree`) + not ahead of remote (`ahead-of-remote`). (AC2–AC5)
6. **Proportionate tests** (user-calibrated, D-52-9): pass/fail/n-a per box
   in the engine suite, the parity matrix between engines, and the grammar
   conformance test — no combinatorial sweep. (AC2–AC8, AC13)
7. **Docs wiring**: `ORCHESTRATION.md` and `FEATURE_WORKFLOW.md` each gain
   one pointer to the machine profile (no grammar restatement elsewhere).
   (AC14)

#### Out of scope / non-goals

- **No change to what the boxes require** — only how compliance is
  demonstrated (issue #226 non-goal). Owned by: the canonical contract, which
  is unchanged for boxes 6–11.
- **No bespoke-contract migration** — #173 owns it, one skill per phase; this
  feature lands against the canonical contract only.
- **No persisted receipts, no ledger rows, no JSON mode** — the pasted line
  in the transcript is the evidence; receipt staleness rules are #172/#35
  territory. No owner; deliberately dropped (D-52-3).
- **No crate publishing** — the crate stays `private: true`; target projects
  get the verifier via the scaffold shim, and #44 (per-skill package layout)
  later owns script distribution in general (D-52-2).
- **No CI enforcement of turn compliance** — the verifier runs where the
  agent runs; CI keeps its existing suites. No owner; deliberately dropped.
- **No token-savings measurement protocol** — the deliverable is the removal
  of the recitation requirement; quantified savings are not an acceptance
  criterion. No owner; deliberately dropped.
- **No schema-package vocabulary for the receipt** — the grammar is pinned
  repo-side (D-52-5); the schema package is untouched.

### Capability closure

Three fixed checklists. This is a docs-and-scripts repository: "UI entry
point" means the surface an agent or human touches (command, doc section);
"API" means the invocation/configuration surface; roles and the capability
inventory are the derived ones recorded below and in `decisions.md`.

**1. Entity closure** — entities this feature introduces or touches:

**E1 — verifier engine** (`packages/agentic-workflow/bin/turn-contract.mjs`)

- Create — entry point: run from repo root per AC1/AC2 · API: flags
  `--finished`, `--help`; exit {0,1,2} · test: crate engine suite (AC2–AC6)
- Read/list — n/a: stateless command; it reads git/gh state and stores
  nothing (D-52-3)
- Update — behavior changes only through this feature's review cycle;
  version/CHANGELOG ride the package rules · test: grammar conformance (AC8)
- Delete — n/a: no retirement path in scope; removal would be a major
  contract change
- State transitions — n/a: stateless

**E2 — scaffold shim** (`template/.agentic-workflow/hooks/turn-contract.sh`)

- Create — entry point: shipped in the scaffold; target projects invoke it
  after the copy · API: same flags, grammar, exit codes · test: hook suite
  (AC13) + parity (AC7)
- Read/list — n/a: stateless like E1
- Update — via template maintenance; the parity test blocks drift between
  engines · test: AC7
- Delete — n/a: retirement not in scope
- State transitions — n/a: stateless

**E3 — receipt line** (ephemeral artifact)

- Create — emitted by E1/E2 on every run · entry point: stdout, one line ·
  API: fixed grammar (fenced block in `TURN_CONTRACT.md`) · test: AC8
- Read/list — parsed by agents and drivers from the pasted line · entry
  point: the chat transcript · API: the closed reason-code vocabulary ·
  test: AC8
- Update — n/a: immutable once printed; a rerun prints a fresh line
  (staleness by construction)
- Delete — n/a: never persisted (D-52-3)
- State transitions — n/a: single-shot emission

**E4 — machine-check profile** (`TURN_CONTRACT.md` section)

- Create — added in P2 · entry point: loaded by every canonical-contract
  consumer via `orchestration-envelope` · API: profile rules (paste receipt;
  echo hand-off; fallback) · test: AC9
- Read/list — read by all skills each turn · test: AC9, AC14
- Update — versioned with the `orchestration-envelope` skill (minor bump;
  Pi mirror re-bundled same PR) · test: AC11 (parity suite)
- Delete — n/a: profile retirement would be a major contract change
- State transitions — n/a: static text

**2. Integration closure** — `docs/CAPABILITIES.md` is the unfilled template
in this repository (no live inventory), so the inventory is **derived** per
the skill from `CLAUDE.md`'s layout/verification/normative-surface sections
plus the codebase. The derived inventory (recorded; seeding the real file is
offered in `decisions.md`): skills-distribution surface · schema package ·
Pi package mirror · producer crate · template scaffold · repo verification
gate · normative-surfaces tables · workflow docs · roadmap/features state
machine · forge/git · sensor. One row per subsystem:

- Skills distribution surface (skills/, skills CLI, context budgets) — the
  profile lands inside `orchestration-envelope`'s reference; budgets
  re-checked · test: AC11 (`check-skill-context`)
- Schema package — n/a: no vocabulary added; the receipt grammar is pinned
  repo-side (D-52-5)
- Pi package mirror — the skills tree change re-bundled byte-identically
  same PR · test: AC11 (`skill-parity.test.mjs`)
- Producer crate — E1 lands as the crate's bin · test: AC2–AC6
- Template scaffold — E2 lands as a hook plus its bash test, house pattern
  (`tests/test-command-guard.sh` style) · test: AC7, AC12, AC13
- Repo verification gate — the conformance test registered under `scripts/`
  and run by the node-compat CI job · test: AC8
- Normative-surfaces tables (`CLAUDE.md`) — receipt surface row added
  (grammar `block:turn-contract-receipt@1`, machine `n/a`, must-name `no`) ·
  test: `node --test scripts/normative-drift.test.mjs` stays green (AC8)
- Workflow docs — `ORCHESTRATION.md` + `FEATURE_WORKFLOW.md` one pointer
  each · test: AC14
- Roadmap/features state machine — row 52 transitions `idea → defined` in
  this design turn; later transitions belong to scaffold/execute skills ·
  n/a at execution: not a runtime surface of this feature
- Forge/git — the object of verification; gh queries are read-only ·
  test: AC5 (stubbed gh paths)
- Sensor — envelope `next` fields confirmed as the echo source; no schema
  change · test: AC10

**3. Role matrix** — derived roles (recorded in `decisions.md`):
`executor-agent`, `authoring-agent`, `review-agent`, `driver` (orchestrator),
`human-owner`. Every role decided for every capability:

For EACH capability:

- **C1 — run the verifier and paste the receipt**: executor-agent allowed ·
  authoring-agent allowed · review-agent allowed · driver allowed ·
  human-owner allowed
- **C2 — attest boxes 6–11** (the judgment calls): executor-agent allowed ·
  authoring-agent allowed · review-agent allowed · driver **denied** (a
  driver relays and senses; judgment is not a driver function) · human-owner
  allowed
- **C3 — change the receipt grammar or profile text**: executor-agent
  **denied** · authoring-agent **denied** · review-agent **denied** · driver
  **denied** · human-owner allowed (grammar changes are SPEC-owned design
  changes, never agent edits)
- **C4 — echo the closing hand-off from the sensor**: executor-agent
  allowed · authoring-agent allowed · review-agent **denied** (reviewers
  hand off their own verdicts, not the sensor's) · driver allowed ·
  human-owner allowed
- **C5 — skip verification when the verifier is unavailable** (prose
  fallback): executor-agent allowed (fallback only) · authoring-agent
  allowed (fallback only) · review-agent allowed (fallback only) · driver
  **denied** (a driver must treat an unverified turn as unverified) ·
  human-owner allowed

### Expectation sweep

The implicit-knowledge gate for a "machine-check the contract" feature —
domain conventions enumerated and resolved:

| # | Expectation | Resolution | Pointer |
|---|---|---|---|
| 1 | `--help` prints usage and exits 0 | in-scope | AC1 |
| 2 | Pass prints exactly `TURN-CONTRACT ok`, exit 0 | in-scope | AC2 |
| 3 | Fail prints one line `TURN-CONTRACT fail box<N>: <code>`, exit 1, first failing box in 1→5 order | in-scope | AC3, AC4, AC5 |
| 4 | Unknown flags error with exit 2 — never a silent pass | in-scope | AC6 |
| 5 | The verifier is read-only — never mutates repo, index, or config | in-scope | AC2 (engine suite asserts no tree mutation) |
| 6 | Works from any working directory inside the repo | in-scope | AC2 (suite includes a subdirectory case) |
| 7 | Engine runs bun-else-node per repo runtime convention | in-scope | AC1, AC11 (node-compat CI) |
| 8 | Not-a-git-repo / no commits → fixed fail codes, no stack traces | in-scope | AC4 |
| 9 | Offline: gh unreachable with `--finished` → fail-closed `pr-unreachable`, never a fake ok | in-scope | AC5 |
| 10 | Receipt is never persisted; no JSON mode exists | in-scope | Out-of-scope bullet (D-52-3) |
| 11 | Boxes 6–11 prose attestation is still required every turn | in-scope | AC9 |
| 12 | Token savings get a measurement protocol | out-of-scope | Out-of-scope bullet (no owner; deliberately dropped) |
| 13 | The shim runs wherever bash + git exist — no node/bun required | in-scope | AC12 |

### Acceptance criteria

Each criterion is a runnable command (exact invocation; fixture repos are
throwaway git repos built by the suites) or labelled `read-verified`.

- **AC1 (command)**: `node packages/agentic-workflow/bin/turn-contract.mjs --help`
  exits 0 and prints usage naming both flags.
- **AC2 (command)**: engine suite green — `node --test packages/agentic-workflow/test/`;
  it covers, at minimum: clean feature branch (≥ 1 commit ahead of default,
  clean tree) → stdout exactly `TURN-CONTRACT ok`, exit 0; invocation from a
  subdirectory; and a no-tree-mutation assertion.
- **AC3 (command)**: engine suite case — dirty tree in the fixture → stdout
  exactly `TURN-CONTRACT fail box5: dirty-tree`, exit 1.
- **AC4 (command)**: engine suite cases — default branch checked out →
  `TURN-CONTRACT fail box1: branch-default`, exit 1; not a git repo →
  `TURN-CONTRACT fail box1: not-a-repo`, exit 1; branch with no own commits →
  `TURN-CONTRACT fail box3: no-commits`, exit 1.
- **AC5 (command)**: engine suite cases for box4 — `--finished` with no open
  PR → `TURN-CONTRACT fail box4: pr-not-open`, exit 1; gh unreachable →
  `TURN-CONTRACT fail box4: pr-unreachable`, exit 1; PR head mismatch →
  `TURN-CONTRACT fail box4: pr-head-mismatch`, exit 1; stubbed open PR with
  head == local HEAD → box4 passes.
- **AC6 (command)**: engine suite case — unknown flag → usage on stderr,
  exit 2.
- **AC7 (command)**: parity suite green — the same fixture-repo matrix runs
  through both engines and asserts byte-identical stdout lines and exit codes.
- **AC8 (command)**: grammar conformance —
  `node --test scripts/turn-contract-grammar.test.mjs` passes: both engines'
  outputs match the fenced `turn-contract-receipt@1` block in
  `TURN_CONTRACT.md`, and the `CLAUDE.md` normative-surfaces row is present;
  `node --test scripts/normative-drift.test.mjs` stays green.
- **AC9 (read-verified)**: `TURN_CONTRACT.md` carries the machine-check
  profile: boxes 1–5 demonstrated by pasting the receipt; prose recitation of
  boxes 1–5 not required when the verifier ran; the fallback is stated;
  boxes 6–11 requirements unchanged.
- **AC10 (command)**: `node --test scripts/workflow-status-sensor.test.mjs`
  passes; **read-verified**: the envelope carries the `next` fields
  (`scripts/workflow-status.mjs:1270`) and the profile's echo rule maps the
  `→ Next:` block from `next.recommended` + `next.alternatives`.
- **AC11 (command)**: `bun scripts/check-skill-context.mjs` passes, and
  `node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs`
  passes (mirror byte-identical same PR).
- **AC12 (command)**: `grep -nE 'node|bun|npm|npx'
  template/.agentic-workflow/hooks/turn-contract.sh` returns nothing — the
  shim needs only bash + git + gh.
- **AC13 (command)**: `bash template/.agentic-workflow/hooks/tests/test-turn-contract.sh`
  passes (new hook test following the house bash-test pattern).
- **AC14 (read-verified)**: `ORCHESTRATION.md` and `FEATURE_WORKFLOW.md`
  each carry exactly one pointer to the machine profile; the grammar is
  restated nowhere else.

Reason-code vocabulary (closed; extended only through a SPEC change —
`decisions.md` D-52-6): `branch-default` · `not-a-repo` · `no-commits` ·
`acceptance-missing` · `phase-lint-failed` · `pr-not-open` ·
`pr-head-mismatch` · `pr-unreachable` · `dirty-tree` · `ahead-of-remote`.

The declared grammar surface (what AC8 pins; the canonical copy lives in
`TURN_CONTRACT.md` from P2):

```text
turn-contract-receipt@1
ok-line:    TURN-CONTRACT ok
fail-line:  TURN-CONTRACT fail box<N>: <code>
codes:      branch-default | not-a-repo | no-commits | acceptance-missing |
            phase-lint-failed | pr-not-open | pr-head-mismatch |
            pr-unreachable | dirty-tree | ahead-of-remote
exit:       0 ok | 1 contract fail | 2 usage error
order:      boxes 1→5, first failure wins; within box5, dirty-tree precedes
            ahead-of-remote
stdout:     exactly one line; diagnostics never (git/gh evidence stays in the
            agent's transcript)
```

### Tooling

- `gh` CLI — box4 PR checks (read-only queries; stubbed in tests).
- bun-else-node runtime — the engine (repo convention, node-compat CI).
- No skill or MCP dependencies beyond the repository's own skills;
  Serena MCP may assist symbol-level edits during execution but is not part
  of the product surface.

### Product decisions

Recorded in full (with authority and rationale) in
`docs/features/52-machine-checked-turn-contract/decisions.md`; one-line
summary:

- **D-52-1** size `M`, 3 phases, no split — user delegated sizing (interview
  Q3).
- **D-52-2** distribution = producer-crate engine + scaffold shim for target
  projects — user widened the crate-only default (interview Q2).
- **D-52-3** receipt is ephemeral stdout; nothing persisted; no JSON mode —
  user accepted defaults (interview Q1/Q2).
- **D-52-4** box2 degrades in target projects: without the phase-lint script
  the shim checks frozen-acceptance presence only — consequence of D-52-2.
- **D-52-5** grammar home = fenced `turn-contract-receipt@1` in
  `TURN_CONTRACT.md`; machine `n/a` in normative-surfaces; repo test pins
  conformance; schema package untouched.
- **D-52-6** exit codes 0/1/2 and the closed reason-code vocabulary —
  accepted defaults + house precedent (`guard-command.sh` exit 2 for usage
  errors).
- **D-52-7** adoption boundary: canonical contract only; #173 migrates
  bespoke contracts (issue non-goal).
- **D-52-8** echo source = the sensor's existing envelope `next` fields
  (issue scope item 3; emission proven at `scripts/workflow-status.mjs:1270`).
- **D-52-9** test proportionality: per-box pass/fail/n-a + parity matrix;
  no combinatorial sweep — user instruction (interview Q3).

### Deferred decisions

none

| Decision | Why deferred | Decide by (trigger or phase) |
|---|---|---|

### Spec-lint (mechanical — presence checks only)

Product boxes:

- [x] No template placeholders left in the product half —
      `grep -nE '<(where|surface|name|reason|list|role|subsystem|expectation|criterion)'`
      over the Product half returns nothing (closure rows instantiated; the
      grammar block's `<N>`/`<code>` are grammar tokens, not placeholders).
- [x] `#### Out of scope / non-goals` has ≥ 1 concrete bullet — 7 bullets.
- [x] Every Capability closure row is filled or `n/a: <reason>` — zero blank
      rows (E1–E4 × CRUD/transitions; 11 inventory subsystems; 5 roles × 5
      capabilities).
- [x] Integration closure has one row per subsystem of the derived inventory
      (recorded above; `docs/CAPABILITIES.md` absent as a live file) — zero
      subsystems skipped.
- [x] Every capability's role matrix lists EVERY role with an explicit
      `allowed`/`denied` — 5 roles × 5 capabilities, none unlisted.
- [x] `### Expectation sweep` has 13 resolved rows (≥ 10 for M); every row
      resolves to exactly one of `in-scope`, `out-of-scope`, or `deferred`
      with a pointer — zero unresolved rows.
- [x] Every `#### In scope` bullet maps to ≥ 1 acceptance criterion —
      explicit AC pointers on each bullet.
- [x] Every acceptance criterion is a runnable command OR labelled
      `read-verified` — AC1–AC8, AC10–AC13 commands; AC9, AC14 labelled.
- [x] `### Deferred decisions` exists and reads `none`.

## Design status

`designed` — capability closure complete (zero blank rows), product spec-lint
boxes all tick, readiness preflight `READY-FOR-REVIEW` (see closing block).
Awaiting independent review by `review-spec`.

---

## Engineering half

Written by `plan-feature` (scaffold, 2026-09-16; plan-review repair batch
2026-09-16). Artifact revision of this plan set: `52-plan-2`. Grounded in
`planning-evidence.md` (PE-001…PE-016); obligations frozen in
`planning-obligations.md` (O1…O16).

### Technical goals

- Compliance evidence for boxes 1–5 becomes deterministic: one pasted
  receipt line (`TURN-CONTRACT ok` / `TURN-CONTRACT fail box<N>: <code>`)
  plus the git/gh evidence already in the transcript — zero model calls in
  the verification path.
- One grammar, two engines: the producer-crate engine for this repo and a
  scaffold shim for target projects emit byte-identical lines (D-52-2).
- The canonical contract gains a machine-check profile that removes the
  prose-recitation duty for boxes 1–5 when the verifier ran, and permits
  echoing the closing hand-off from the sensor envelope (D-52-8) — without
  changing what any box requires.

### Architecture impact

Surfaces touched: producer crate (new `bin/` + `test/`), template scaffold
(new hook + hook test), `orchestration-envelope` reference (profile section
+ grammar block), `CLAUDE.md` normative-surfaces (one row), two workflow
docs (one pointer each), `scripts/` (one conformance test).

- Layer placement follows the frozen phase-lint prefix table: `template/`,
  `skills/`, `docs/` → docs; `packages/`, `scripts/` → config/infra
  (PE-001). This is what splits P1 (docs) from P2 (config/infra).
- Invariants held: verifier is read-only (asserted in-suite); schema
  package untouched (D-52-5, O13); crate stays private with zero
  dependencies (D-52-2, PE-006); canonical contract only (D-52-7); skills
  mirror re-bundled byte-identically same PR (PE-010); English-only
  committed artifacts (F011/AD-002).
- Preflight: Stage 1 — NRS consumed · arch: deferred.
- Preflight: NRS consumed · invariant classification: n/a (no project
  invariants declared — REPOSITORY_STATE.md F010).

### Design

**Resolution and defaults (both engines).** Repo root =
`git rev-parse --show-toplevel`; failure → box1 `not-a-repo` (this is also
what makes subdirectory invocation work — AC2). Default branch = target of
`refs/remotes/origin/HEAD`, else local `main`, else local `master`, first
existing wins (sampled: `refs/remotes/origin/main` here — PE-004); if none
exists, box3 counts every commit on HEAD as not-on-default.

**Box semantics (mechanical, first failure wins in 1→5 order).**

| Box | Check | Reason code on failure |
|---|---|---|
| 1 | current branch ≠ default branch (`git branch --show-current` vs the chain above) | `branch-default` (repo-level: `not-a-repo`) |
| 2 | when the branch is unit-shaped — `feat/<rest>` → `docs/features/<rest>`, `fix/<rest>` → `docs/fix/<rest>` — and that unit directory exists: `<unit-dir>/ACCEPTANCE.md` must exist at HEAD (`git cat-file -e HEAD:<path>`); plumbing failure counts as missing (fail-closed). A branch that is not unit-shaped, or whose unit directory does not exist, leaves box2 not-applicable (ED-52-2). Engine only: when `scripts/phase-lint.mjs` exists AND the unit has `TASKS.md`, run it over `<unit-dir>/TASKS.md` (bun-else-node) → nonzero exit fails the box. Shim: presence check only (ED-52-3) | `acceptance-missing` · `phase-lint-failed` |
| 3 | `git rev-list --count <default>..HEAD` ≥ 1 (unborn HEAD or plumbing failure → 0, fail-closed) | `no-commits` |
| 4 | only with `--finished`; without the flag box4 is not-applicable and never fails the line. With the flag: no upstream → no PR can exist → `pr-not-open`; `gh pr view <branch> --json state,headRefOid` failing (any gh error) → `pr-unreachable` (fail-closed, never a fake ok — PE-003); no PR or state ≠ `OPEN` → `pr-not-open`; `headRefOid` ≠ local HEAD sha → `pr-head-mismatch` | `pr-not-open` · `pr-unreachable` · `pr-head-mismatch` |
| 5 | `git status --porcelain` non-empty → dirty; else `git rev-list --count @{upstream}..HEAD` > 0 → ahead (no upstream configured → 0; rev-list error with an upstream present → fail-closed as ahead). Within box5, dirty-tree precedes ahead-of-remote | `dirty-tree` · `ahead-of-remote` |

**CLI contract.** Flags: `--finished`, `--help`. `--help` prints usage
naming both flags and exits 0, short-circuiting any other flag. Unknown
flag → usage on stderr, exit 2 (house precedent: `guard-command.sh` —
PE-007). A receipt run prints exactly one line on stdout and never
diagnostics; exit `0` ok · `1` contract fail · `2` usage error (D-52-6).

**Receipt grammar.** The fenced `turn-contract-receipt@1` block frozen in
the Product half (§Acceptance criteria) is the single grammar source; its
canonical copy lives in `TURN_CONTRACT.md` from P1. Engines implement it,
never redefine it (PE-016). The closed reason-code vocabulary is exactly
the ten codes above, extended only through a SPEC change (D-52-6).

**Engines.** Crate engine `packages/agentic-workflow/bin/turn-contract.mjs`:
node-stdlib-only, zero dependencies, `#!/usr/bin/env node` shebang,
bun-first invocation per repo convention with the node fallback guaranteed
(PE-005/PE-006). Shim `template/.agentic-workflow/hooks/turn-contract.sh`:
bash + git + gh only — AC12 forbids a node/bun/npm/npx token anywhere in
the file, which is also why the shim cannot invoke the phase-lint script
(ED-52-3) — `set -u` house style (PE-007).

**Machine-check profile (P1 writes it into `TURN_CONTRACT.md`, ≤ 20
lines — six skills load that file, PE-015).** Clauses (AC9): boxes 1–5 are
demonstrated by running the verifier and pasting the one-line receipt;
prose recitation of boxes 1–5 is not required when the receipt is pasted;
verifier unavailable → recite boxes 1–5 as today (the profile never
weakens a box); boxes 6–11 unchanged and agent-attested. Echo clause
(AC10, D-52-8): the closing `→ Next:` block may be composed from the
workflow-status envelope's `next.recommended` + `next.alternatives`
(`scripts/workflow-status.mjs:922`, `:1270` — PE-002), preserving the
fixed block shape (recommended line + `·` alternatives).

**Tests (D-52-9 proportionality).** Per-box pass/fail/n-a cases in the
engine suite and the hook suite (throwaway `git init -b` fixture repos; gh
stubbed via a PATH shim), the two-engine parity matrix (AC7), and the
grammar conformance test (AC8). No combinatorial flag × state sweep.

**CI note.** The conformance test is node-first (AC8's validator is
`node --test`), satisfying the node-compat guarantee; `scripts/` suites
are not wired into a CI job today (PE-012) — disclosed in
`known-issues.md`, triage with #198.

### Planning evidence

see `planning-evidence.md` (PE-001…PE-016, all `current` + `proven`;
frozen before phases were cut).

### Obligations

see `planning-obligations.md` (O1…O16; every normative behaviour, invariant,
use case, and failure state has exactly one row with phase, task, owner,
validator, and required evidence).

### Decisions to confirm

All engineering decisions are made and recorded in `decisions.md`
(ED-52-1…ED-52-5); none is open. The Product decisions D-52-1…D-52-9 are
inherited unchanged.

- **ED-52-1** phase cut is surface-first: P1 (docs) ships shim + hook test
  + grammar block + profile + registration + bump/bundle + docs pointers;
  P2 (config/infra) ships engine + suites + conformance. The design
  sketch's "engines first" is impossible in 3 phases without a mixed-layer
  phase (phase-lint box 2 blocks `template/` beside `packages/` — PE-001);
  the D-52-1 three-phase count is preserved, the order is reversed.
- **ED-52-2** box2 unit resolution derives from the branch name
  (`feat/<rest>` / `fix/<rest>`); a branch that is not unit-shaped, or
  whose unit directory does not exist, leaves box2 not-applicable — the
  SPEC's "cheap deterministic checks only" semantics.
- **ED-52-3** the shim's box2 is presence-only: AC12 (no runtime token in
  the shim) makes D-52-4's phase-lint clause unreachable there; the engine
  implements it in full.
- **ED-52-4** default-branch resolution chain `origin/HEAD` → `main` →
  `master`; none → box3 counts all HEAD commits (fixture determinism,
  PE-004).
- **ED-52-5** the integration-closure row's "run by the node-compat CI
  job" is satisfied by the conformance test's node-first invocation;
  wiring `scripts/` suites into CI is disclosed in `known-issues.md` and
  triaged with #198, not smuggled into this unit (PE-012).

### Testing requirements

see `testing.md`. Integration-first: engine suite (`node --test
packages/agentic-workflow/test/`), hook suite (house bash-test pattern),
parity suite, grammar conformance, plus the standing skill-surface suites
(context budgets, mirror parity, sensor). No network; gh stubbed; fixtures
are throwaway temp repos; the verifier's read-only property is asserted.

### Dev scenarios

Failure modes are exercised as edge fixtures in the engine and hook suites
(P3 hardening corpus, O11). Scenarios are orchestration through existing
mechanisms (fixture repos, PATH-stubbed gh) — no new domain.

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| `verifier:empty-repo` | repository with zero commits on an unborn, non-default branch | `git init -b feature/x` fixture, no commits → box3 `no-commits`, no stack trace |
| `verifier:plumbing-denied` | unreadable `.git` (permission denied class) | fixture with restricted permissions → exit 1 with a fail line, never exit 0 |
| `verifier:gh-outage` | gh unreachable / failing with `--finished` | PATH-stubbed gh exiting nonzero → `pr-unreachable`, fail-closed |
| `verifier:dirty-ordering` | dirty tree AND ahead-of-remote simultaneously | fixture with both states → `box5: dirty-tree` (documented precedence) |
| `verifier:oversized-status` | dirty tree with many/oddly-named files (unicode, spaces) | fixture files → still exactly one receipt line, stdout-only |
| `verifier:concurrent` | two verifier runs racing | n/a: the verifier is stateless and read-only — no shared state to race on |
| `verifier:threshold` | limit/threshold hit | n/a: box3's ≥ 1-commit threshold is the only threshold, covered by `verifier:empty-repo` |

### Phases

High-level breakdown; detailed tasks live in `TASKS.md` (the lint target),
narrative in `PLAN.md`. Planning is not a numbered phase; `P1` is the first
implementation phase (it also commits the planning artifacts); `P3` is the
hardening/close-out phase carrying the literal close-out chain (M/L: the
PR is the final step of hardening).

- **P1 — Ship the machine-check receipt surface** (docs): shim + hook test
  + machine-check profile + grammar block + normative-surfaces row +
  bump/bundle + two docs pointers. Order note ED-52-1: the surface ships
  before the engine because the frozen prefix table forbids a mixed-layer
  phase; the engine consumes the declared grammar in P2.
- **P2 — Implement the turn-contract verifier engine** (config/infra):
  crate engine + engine suite + parity suite + grammar conformance test.
- **P3 — Hardening & PR** (hardening): dev-scenario edge corpus, full
  verification gate, literal close-out chain (`Closes #226`).

#### Phase-lint (owned by `skills/phase-contract/SKILL.md` — keep in sync with `docs/fix/_TEMPLATE/SPEC.md`)

Run over the emitted plan (`bun scripts/phase-lint.mjs
docs/features/52-machine-checked-turn-contract/TASKS.md`, node fallback):

```text
P1 Phase-lint: PASS (8/8) · fingerprint P1:docs:7:ship-machine-check-receipt-surface
P2 Phase-lint: PASS (8/8) · fingerprint P2:config/infra:4:implement-turn-contract-verifier-engine
P3 Phase-lint: PASS (8/8) · fingerprint P3:hardening:8:hardening-pr
verdict PASS
fingerprint: 2c7d8179e6598cec42870674f000b1802d7270c977cc5d160f6150204bb7db05
```

Re-synced 2026-09-16 with the plan-review repair batch (plan set `52-plan-2`):
P1 gains one regression task (context budgets + sensor suite — PLAN52-F3),
rotating its task count 6 → 7.

### Deploy & rollback

n/a — merging is enough. No schema migrations, no feature flags, no config
changes. Rollback = revert PR; the verifier is additive tooling with no
persisted state (D-52-3).

### Open questions / risks

- **Risk — context budgets:** the profile section grows
  `TURN_CONTRACT.md`, which six skills load (PE-015). Mitigated by the ≤
  20-line cap and AC11 re-running `check-skill-context.mjs` in P1/P3.
- **Risk — gh output drift:** box4 parses `gh pr view --json
  state,headRefOid` (sampled, PE-003). A future gh CLI change would surface
  as `pr-unreachable` (fail-closed), never a false ok; the stub contract in
  the engine suite pins the parsed fields.
- **Disclosed limitation — CI wiring:** `scripts/` suites are not wired
  into a CI job (PE-012, ED-52-5) — see `known-issues.md`; triage with
  #198.
- Inherited open questions: none (the Product half recorded `Deferred
  decisions: none`).

### Deliverables

- `packages/agentic-workflow/bin/turn-contract.mjs` — the crate verifier engine
- `packages/agentic-workflow/test/turn-contract.engine.test.mjs` — engine suite
- `packages/agentic-workflow/test/turn-contract.parity.test.mjs` — two-engine parity suite
- `template/.agentic-workflow/hooks/turn-contract.sh` — the scaffold shim
- `template/.agentic-workflow/hooks/tests/test-turn-contract.sh` — hook suite
- `scripts/turn-contract-grammar.test.mjs` — grammar conformance test
- `skills/orchestration-envelope/references/TURN_CONTRACT.md` — machine-check profile + `turn-contract-receipt@1` grammar block
- `CLAUDE.md` — normative-surfaces row
- `docs/workflow/ORCHESTRATION.md`, `docs/workflow/FEATURE_WORKFLOW.md` — one pointer each
- skill release mechanics: `orchestration-envelope` 2.0.2 → 2.1.0, CHANGELOG row, README/SKILLS sync, re-bundled pi mirror
- planning artifacts: this SPEC's Engineering half, `PLAN.md`, `TASKS.md`, `ACCEPTANCE.md`, `testing.md`, `known-issues.md`, `architecture-notes.md`, `planning-evidence.md`, `planning-obligations.md`

### Post-merge next feature

Per `docs/features/ROADMAP.md` Phase 0 build order (fix #224 · 52 · 56 ·
55 · 48): next is **56 `design-interview-batching` (#231)**. Feature **33
`turn-contract-single-owner` (#173)** later adopts this unit's machine
profile for bespoke contracts and must not start before this feature lands
(soft dependency — SPEC §Dependencies).

---

## Artifacts created by plan-feature (2026-09-16)

- `PLAN.md` / `TASKS.md` — phased plan (prose + linted checklists)
- `ACCEPTANCE.md` — frozen acceptance manifest (AC1–AC14)
- `planning-evidence.md` — engineering claims PE-001…PE-016
- `planning-obligations.md` — obligations ledger O1…O16 (O15/O16 added by
  the plan-review repair batch — PLAN52-F2, PLAN52-F5)
- `testing.md`, `known-issues.md`, `architecture-notes.md` — supporting
  artifacts; engineering decisions ED-52-1…ED-52-5 appended to
  `decisions.md`

## Artifacts already created by this design-feature session

- `docs/features/52-machine-checked-turn-contract/SPEC.md` — this file
  (Product half)
- `docs/features/52-machine-checked-turn-contract/decisions.md` — product
  decisions D-52-1…D-52-9 + grounding evidence rows
- `docs/features/ROADMAP.md` — row 52 `idea → defined`
