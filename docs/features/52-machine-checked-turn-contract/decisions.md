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
