# Decisions — 52-machine-checked-turn-contract

Product-half decisions recorded by `design-feature` (append-only; newest last).

## Evidence rows (grounding, 2026-09-16)

One row per material claim, fixed column order
(`claim-or-obligation | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence`):

| claim-or-obligation | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|
| Boxes 1–5 are mechanically checkable with git/gh; boxes 6–11 stay agent-attested; scope = script + profile + sensor echo; non-goals as recorded | forge | https://github.com/gtrabanco/agentic-workflow/issues/226 (fetched 2026-09-16) | issue body @ 2026-09-16 | current | proven | — |
| Token audit: full feature run ≈ 129K tokens of skill text; contract narration re-paid every turn | forge | https://github.com/gtrabanco/agentic-workflow/issues/226 (fetched 2026-09-16) | issue body @ 2026-09-16 | current | proven | — |
| `guard-command.sh` already enforces a policy subset deterministically (fixed output + exit codes; unknown arg → exit 2) | repository | `template/.agentic-workflow/hooks/guard-command.sh` | main @ design turn | current | proven | — |
| The sensor emits Envelope v2 with `next` fields — the echo source exists | repository | `scripts/workflow-status.mjs:1270` (envelope `next,`), `:922` (`next.recommended`) | main @ design turn | current | proven | — |
| The producer crate exists — vehicle rule (declined 43) satisfied; verifier lands as a crate subcommand | repository | `packages/agentic-workflow/package.json` (`@gtrabanco/agentic-workflow` 0.0.0, private) | main @ design turn | current | proven | — |
| Producer lineage: 37/38 merged (PRs #212/#213), crate created by first producer | forge | https://github.com/gtrabanco/agentic-workflow/pull/212 · https://github.com/gtrabanco/agentic-workflow/pull/213 | roadmap row 37/38 @ 2026-09-16 | current | proven | — |
| Repo verification gate pattern: versioned grammar blocks pinned by tests | repository | `scripts/normative-drift.test.mjs`; `CLAUDE.md` §Normative surfaces | main @ design turn | current | proven | — |
| Mirror parity rule: `packages/pi-agentic-workflow/skills/` byte-identical to `skills/`, same PR | repository | `CLAUDE.md` §Verification; `packages/pi-agentic-workflow/test/skill-parity.test.mjs` | main @ design turn | current | proven | — |
| `--help` prints usage and exits 0 is the repo script convention | repository | `scripts/workflow-status.mjs:93` | main @ design turn | current | proven | — |
| Agent self-attestation is not evidence; compile the contract once, verify deterministically with zero model calls, cite the proof | document | https://github.com/SurefireStudios/StateProof (fetched 2026-09-16) | README @ 2026-09-16 | current | proven | — |
| Deterministic pre-commit gates + framework/scaffold distribution pattern (package the check once, don't copy scripts project to project) | document | https://pre-commit.com (fetched 2026-09-16) | site @ 2026-09-16 | current | proven | — |
| `docs/CAPABILITIES.md` is the unfilled template → integration closure walks a derived inventory | repository | `docs/CAPABILITIES.md` (template rows only) | main @ design turn | current | proven | — |
| No architectural-invariants document exists | ledger | `REPOSITORY_STATE.md` F010 | snapshot 2026-08-30 | current | proven | — |
| English-only interim for committed artifacts | ledger | `REPOSITORY_STATE.md` F011 / AD-002 | snapshot 2026-08-30 | current | proven | — |
| Failure semantics, per-box checks, exit codes, ephemeral receipt, proportionate tests, size delegation | user | interview answers 2026-09-16 (Q1 accept-defaults · Q2 template_hook · Q3 custom) → decisions D-52-1…D-52-9 below | design turn | not-applicable | decision | — |

Research gate: two external sources fetched (StateProof, pre-commit — rows above). Offline/unanswered question: none.

## Decision log

## 2026-09-16 — D-52-1: Size `M`, 3 phases, no split

- **What**: Size the feature `M` with 3 phases (P1 engines + parity tests, P2
  profile + registration + docs wiring, P3 hardening & PR); full artifact set.
- **Why**: User delegated sizing ("size should be defined automatically by
  you… each phase atomic enough for a tiny model like qwen3.6 but big enough
  not to be a phase per task item"). Three deliverables (engine, shim,
  profile/registration) exceed the S bar (≤ half a day) but stay one concern,
  ≤ 5 phases, zero open product decisions — no split trigger fires.
- **Authority**: user instruction (2026-09-16, design interview Q3, custom).

## 2026-09-16 — D-52-2: Distribution — producer-crate engine + scaffold shim

- **What**: The verifier ships twice, one grammar: crate engine
  `packages/agentic-workflow/bin/turn-contract.mjs` (this repo) and scaffold
  shim `template/.agentic-workflow/hooks/turn-contract.sh` (target projects
  running the scaffold). The crate stays `private: true`.
- **Why**: User widened the crate-only default: target projects that install
  skills via `npx skills add` cannot execute private-crate scripts, and the
  scaffold is the substrate they actually copy. pre-commit's distribution
  pattern (package the check with the framework, not per-project copies)
  supports the shim route. General per-skill script distribution stays with
  #44.
- **Authority**: user instruction (2026-09-16, design interview Q2,
  `template_hook`).
- **Consequence**: two engines must emit byte-identical lines → parity test
  is a first-class AC (AC7); one normative grammar source in
  `TURN_CONTRACT.md` (D-52-5).

## 2026-09-16 — D-52-3: Ephemeral receipt — nothing persisted, no JSON mode

- **What**: The receipt is one stdout line; no file, no ledger row, no JSON
  output. The line pasted in the agent's transcript is the evidence; the exit
  code is machine-checkable.
- **Why**: User accepted the defaults (interview Q1 `accept_defaults`, Q2
  ride-along). Anything persisted needs staleness rules (void after any
  commit) — that is #172/#35 territory, out of scope here (issue #226 scope
  is a fixed one-line receipt).
- **Authority**: user instruction (2026-09-16, design interview Q1/Q2).

## 2026-09-16 — D-52-4: Box2 degradation in target projects

- **What**: Without the phase-lint script (target projects), box2 checks
  frozen-acceptance artifact presence only; with the script present, box2
  additionally requires phase-lint green when the unit has a plan. Never
  re-runs the project's full test gate.
- **Why**: Consequence of D-52-2: the shim cannot assume repo-specific
  scripts; keeping box2 "cheap deterministic checks only" preserves the
  accepted Q1 semantics on both engines.
- **Authority**: authoring decision under user-delegated scope (interview Q1
  accepted defaults; Q3 delegation).

## 2026-09-16 — D-52-5: Grammar home — fenced surface in TURN_CONTRACT.md

- **What**: The receipt grammar is declared once as
  `block:turn-contract-receipt@1` in `TURN_CONTRACT.md`, registered in
  `CLAUDE.md`'s normative-surfaces table (machine `n/a`, must-name `no`), and
  pinned by a repo conformance test (`scripts/turn-contract-grammar.test.mjs`).
  The schema package is untouched.
- **Why**: `normative-drift.test.mjs` already pins versioned grammar blocks —
  the issue itself suggests sharing that grammar source. A schema-package
  vocabulary would add cross-package sync cost for a surface whose every
  value is already ordered by the contract file itself.
- **Authority**: authoring decision (issue #226 scope item 1 + repo
  normative-surface rules; no user override).

## 2026-09-16 — D-52-6: Exit-code contract and closed reason-code vocabulary

- **What**: Exit `0` ok / `1` contract fail / `2` usage error. Initial closed
  codes: `branch-default` · `not-a-repo` · `no-commits` · `acceptance-missing`
  · `phase-lint-failed` · `pr-not-open` · `pr-head-mismatch` ·
  `pr-unreachable` · `dirty-tree` · `ahead-of-remote`. Extended only through
  a SPEC change.
- **Why**: Accepted Q1 defaults (fixed one-line fail receipt, fail-closed
  offline) plus house precedent — `guard-command.sh` exits 2 on usage/policy
  errors, distinct from a compliance failure.
- **Authority**: user instruction (2026-09-16, design interview Q1) + repo
  precedent.

## 2026-09-16 — D-52-7: Adoption boundary — canonical contract only

- **What**: The machine-check profile lands in the canonical
  `TURN_CONTRACT.md` only; bespoke inline contracts are untouched.
- **Why**: Issue #226 non-goal; #173 migrates bespoke contracts one skill per
  phase and adopts the machine profile there.
- **Authority**: issue #226 (fetched 2026-09-16).

## 2026-09-16 — D-52-8: Echo source — the sensor's envelope `next` fields

- **What**: The closing `→ Next:` block may be composed from the
  workflow-status envelope's `next.recommended` + `next.alternatives`,
  preserving the fixed block shape; no sensor schema change.
- **Why**: Issue #226 scope item 3; emission proven at
  `scripts/workflow-status.mjs:1270` — the surface already exists.
- **Authority**: issue #226 (fetched 2026-09-16) + repository evidence.

## 2026-09-16 — D-52-9: Test proportionality

- **What**: Per-box pass/fail/n-a engine cases, the two-engine parity matrix,
  and the grammar conformance test — no combinatorial sweep of flag × state
  permutations.
- **Why**: User instruction ("use tests but don't test stupidly everything").
- **Authority**: user instruction (2026-09-16, design interview Q3, custom).

## Open offer (upsert-safe, needs user confirmation)

- Seed `docs/CAPABILITIES.md` from the template with the **derived inventory
  and roles** used by this SPEC's integration/role closures (producer crate,
  template scaffold, sensor, schema package, Pi mirror, skills distribution,
  verification gate, normative-surfaces, workflow docs, roadmap state machine,
  forge/git; roles: executor-agent, authoring-agent, review-agent, driver,
  human-owner). `product-audit` freshness-checks that file; seeding it makes
  the next design turn walk a live inventory instead of re-deriving one.
  Not done now — the file is a maintained substrate, and the skill requires
  user confirmation to seed it.

## 2026-09-16 — ED-52-1: Phase cut is surface-first (P1 docs → P2 config/infra)

- **What**: The 3-phase cut ships P1 = shim + hook test + grammar block +
  machine-check profile + normative-surfaces row + bump/bundle + docs
  pointers (docs), P2 = engine + engine suite + parity suite + conformance
  test (config/infra), P3 = Hardening & PR — reversing the design sketch's
  "engines → profile/registration" order while preserving D-52-1's
  three-phase count.
- **Why**: The frozen phase-lint prefix table maps `template/`/`skills/`/
  `docs/` → docs and `packages/`/`scripts/` → config/infra
  (`scripts/phase-lint.mjs` `layerForTarget()`); one phase cannot carry the
  shim (`template/`) beside the engine (`packages/`) — box 2 would BLOCK
  the mixed-layer phase (PE-001). The grammar-block phase must also precede
  the conformance test that pins it.
- **Authority**: authoring decision under user-delegated sizing (D-52-1:
  "size should be defined automatically by you"); recorded here and in
  SPEC §Phases for the reviewer.

## 2026-09-16 — ED-52-2: Box2 unit resolution from the branch name

- **What**: Box2 applies when the branch is unit-shaped — `feat/<rest>` →
  `docs/features/<rest>`, `fix/<rest>` → `docs/fix/<rest>` — and the unit
  directory exists; then `<unit-dir>/ACCEPTANCE.md` must exist at HEAD
  (`git cat-file -e`). A branch that is not unit-shaped, or whose unit
  directory does not exist, leaves box2 not-applicable.
- **Why**: The SPEC freezes box2's semantics ("frozen-acceptance artifacts
  present at HEAD", "cheap deterministic checks only") but not the unit
  identification; branch-name resolution is the deterministic mechanism
  this workflow already uses for unit branches, and the n/a branch keeps
  the verifier from failing non-unit work (e.g. docs-only branches) the
  contract's box 1 already gates.
- **Authority**: authoring decision under the SPEC's frozen box semantics
  (scope item 5); recorded for the reviewer.

## 2026-09-16 — ED-52-3: The shim's box2 is presence-only

- **What**: The scaffold shim checks frozen-acceptance presence only; the
  conditional phase-lint clause of D-52-4 is implemented by the crate
  engine only.
- **Why**: AC12 forbids any node/bun/npm/npx token in the shim, so it
  cannot invoke `scripts/phase-lint.mjs` even when a target project has
  one; D-52-4's degradation is the shim's standing condition. No AC is
  narrowed — AC2–AC5 pin the engine, AC12 pins the shim.
- **Authority**: synthesis of the SPEC's own frozen constraints (D-52-4 ×
  AC12); disclosed in `known-issues.md`.

## 2026-09-16 — ED-52-4: Default-branch resolution chain

- **What**: Default branch = target of `refs/remotes/origin/HEAD`, else
  local `main`, else local `master`; if none exists, box3 counts every
  commit on HEAD as not-on-default.
- **Why**: The engine and shim need one deterministic default-branch
  answer for boxes 1 and 3; the chain matches what this repo and typical
  targets expose (sampled: `refs/remotes/origin/main`), and the no-default
  fallback keeps fresh fixture repos deterministic.
- **Authority**: authoring decision (PE-004 sampled plumbing).

## 2026-09-16 — ED-52-5: CI wiring of `scripts/` suites stays out of this unit

- **What**: The grammar conformance test is registered under `scripts/`
  and validated node-first (`node --test`, AC8) but is not added to the
  CI node-compat jobs; the gap is disclosed in `known-issues.md` and
  triaged with #198.
- **Why**: The integration-closure row's "run by the node-compat CI job"
  is loose prose — today's node-compat jobs run only the packages' own
  suites (PE-012), and no AC requires a workflow edit; adding one would
  widen the change surface to publish infrastructure without a frozen
  criterion demanding it. The row's substance (the test passes under plain
  node) holds by construction.
- **Authority**: authoring decision; disclosed rather than silently
  dropped, per the anti-gap rule.

## 2026-09-16 — ED-52-6: box4 gh failure mapping

- **What**: With `--finished`, the verifier runs `gh pr view <branch> --json
  state,headRefOid`. A nonzero exit is `pr-unreachable` (gh could not be
  asked); an output with no `state`, an empty payload, or a state other than
  `OPEN` is `pr-not-open`. A missing upstream short-circuits to `pr-not-open`
  before gh is invoked.
- **Why**: The SPEC's own named command exits nonzero when a branch has no PR
  at all, so a blanket `any gh error → pr-unreachable` would make `no PR →
  pr-not-open` unreachable. Splitting the two by observable payload keeps the
  fail-closed guarantee (an unreachable gh is never a fake ok) while still
  naming a branch whose PR is absent or closed as `pr-not-open`. Both suites
  pin all four box4 outcomes against a PATH-stubbed gh, so the contract is
  testable without a forge.
- **Authority**: execution refinement of SPEC §Design box4 / PE-003, inside the
  frozen reason-code vocabulary (D-52-6); no acceptance criterion narrowed.

## 2026-09-16 — Execution hygiene: pre-existing feature-59 bytes relocated

- **What**: The worktree carried uncommitted cross-unit bytes before P1 —
  `docs/features/ROADMAP.md` consolidation edits folding rows 48/55 into a new
  feature 59, and the untracked `docs/features/59-executable-continuations-fixture/`
  design folder. They were moved to the `feat/59-executable-continuations-fixture`
  worktree (the branch that owns them), leaving this unit's tree clean for the
  box-5 gate.
- **Why**: Box 5 requires an empty `git status --porcelain`, and committing
  another unit's design work on `feat/52` would bundle out-of-scope artifacts
  into this PR.
- **Authority**: repo hygiene / turn-contract box 5; not a deliverable of this
  unit.

## 2026-09-16 — ED-52-7: P2 gate blocked by the frozen validator's Node form

- **What**: The P2 gate command `node --test packages/agentic-workflow/test/`
  (AC2, AC7, TASKS P2 done-when) cannot pass on the repository's pinned Node
  (`v22.23.1`) or the environment default (`v24.19.0`): Node ≥ 22 resolves the
  directory positional as a module and exits `Cannot find module`. The suite
  passes under the documented form `node --test packages/agentic-workflow/test/*.test.mjs`
  (40/40) and under the directory form on Node 20 (41 pass).
- **Why**: Planning-evidence **PE-005** ("node v22.23.1 supports `node --test
  <dir>` directory mode") is false — Node's own v22 docs accept files or glob
  patterns, and the repo's `test:node` scripts already use the glob form. This
  is a **Plan-level validator defect** (implementation-discovery question 6
  contradiction), not a source/test defect: no engine or suite byte is wrong.
- **Authority**: discovered at execution; routed as finding `PLAN52-F9`. The
  frozen `ACCEPTANCE.md` may only change through the verification contract's
  amendment path (explicit user approval → dated SPEC `## Amendments` row →
  replacement manifest → fresh receipt); the executor does not self-authorize
  it.

## 2026-09-16 — ED-52-8: AC2/AC7 amended to bun-first (user-approved)

- **What**: On the owner's explicit approval, the frozen ACCEPTANCE validators
  for AC2 and AC7 (and TASKS/PLAN P2 done-when, testing.md, obligations O6/O9)
  change from directory mode `node --test packages/agentic-workflow/test/` to
  `bun test packages/agentic-workflow/test/` (bun-first) with a Node-24 glob
  fallback `node --test packages/agentic-workflow/test/*.test.mjs`. SPEC gains
  a dated `## Amendments` row; PE-005 is marked `refuted`; the replacement
  `ACCEPTANCE.md` is re-frozen (blob
  `c088a621b794fe6b9d4bf3c138406c0c488c4889`) and a fresh acceptance receipt is
  recorded.
- **Why**: The owner directed the repository's documented bun-first runtime
  (bun default, Node 24 fallback). Directory mode is not a Node ≥ 22 interface,
  so the original validator could never pass on the pinned runtime; the suite
  bytes and every assertion are unchanged.
- **Authority**: explicit user approval at the P2 gate; verification contract
  amendment order (approval → SPEC amendment → replacement manifest → fresh
  receipt). Finding `PLAN52-F9`.
