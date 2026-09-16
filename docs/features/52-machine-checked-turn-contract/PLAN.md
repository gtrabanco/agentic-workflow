# PLAN — 52-machine-checked-turn-contract

Three implementation phases (receipt surface → verifier engine → hardening &
PR). The box semantics, reason codes, exit contract, grammar, and profile
wording are frozen in `SPEC.md` (`## Engineering half` → `### Design`); this
file narrates the same cut for the executor. Artifact revision of this plan
set: `52-plan-2`.

Phase order note (ED-52-1): the design sketch listed "engines →
profile/registration", but the frozen phase-lint prefix table maps
`template/` + `skills/` + `docs/` → `docs` and `packages/` + `scripts/` →
`config/infra` (`scripts/phase-lint.mjs` `layerForTarget()`), so a single
phase cannot carry both the shim and the engine. The cut ships the whole
declarative receipt surface first (P1, docs) and the engine plus its suites
second (P2, config/infra); the three-phase count of D-52-1 is preserved.

## P1 — Ship the machine-check receipt surface

Layer: docs. One deliverable: the machine-check receipt surface — the
scaffold shim that emits receipts, its hook test, the machine-check profile
and the versioned grammar block in the canonical contract, the normative
registration, the skill release mechanics, and the two docs pointers.

- Shim `template/.agentic-workflow/hooks/turn-contract.sh`: bash + git + gh
  only (AC12 — the file may not contain a node/bun/npm/npx token), `set -u`
  house style per `guard-command.sh` (PE-007), flags `--finished`/`--help`,
  box checks 1–5 per the SPEC §Design semantics, the receipt grammar, exit
  codes 0/1/2. Box2 in the shim is the frozen-acceptance presence check only
  (ED-52-3: AC12 forbids invoking a runtime, so D-52-4's phase-lint clause is
  unreachable in the shim's environment contract).
- Hook test `template/.agentic-workflow/hooks/tests/test-turn-contract.sh`
  follows the house helper pattern of
  `template/.agentic-workflow/hooks/tests/test-command-guard.sh` (PE-008):
  throwaway `git init -b <default>` fixture repos, per-box pass/fail/n-a
  cases, subdirectory invocation, `--help`, unknown-flag exit 2 (D-52-9 — no
  combinatorial sweep).
- `skills/orchestration-envelope/references/TURN_CONTRACT.md` gains a
  `## Machine-check profile (boxes 1–5)` section (≤ 20 lines — six skills
  load this file, PE-015) and the fenced `turn-contract-receipt@1` grammar
  block (the exact block frozen in the SPEC §Acceptance criteria; D-52-5).
  Profile clauses (AC9): boxes 1–5 are demonstrated by running the verifier
  and pasting the one-line receipt; prose recitation of boxes 1–5 is not
  required when the receipt is pasted; the verifier-unavailable fallback is
  stated (recite as today); boxes 6–11 are unchanged; the closing `→ Next:`
  block may be echoed from the workflow-status envelope's `next.recommended`
  + `next.alternatives` preserving the fixed block shape (D-52-8, PE-002).
  The profile section's regressions run in P1 (SPEC §Open questions risk 1 —
  detect at the phase that grows the file, not only at P3's gate):
  `bun scripts/check-skill-context.mjs` → exit 0 (budget headroom after the
  ≤ 20-line section — AC11's P1 leg, O3) and `node --test
  scripts/workflow-status-sensor.test.mjs` → exit 0 (the echo clause maps
  the envelope's `next` fields — AC10, O15).
- `CLAUDE.md`'s normative-surfaces table gains the row
  `turn-contract-receipt | skills/orchestration-envelope/references/TURN_CONTRACT.md | block:turn-contract-receipt@1 | n/a | no`
  (machine `n/a` is an accepted cell with standing precedent — PE-009).
- `bump-skill` for `orchestration-envelope`: minor bump 2.0.2 → 2.1.0
  (backward-compatible capability), CHANGELOG row, README/SKILLS table sync
  (PE-011), then `npm run bundle:skills` so the pi mirror stays
  byte-identical (PE-010).
- One pointer each in `docs/workflow/ORCHESTRATION.md` and
  `docs/workflow/FEATURE_WORKFLOW.md` (AC14 — exactly one per file, no
  grammar restatement anywhere).

Done-when: the hook suite exits 0, `node --test
scripts/normative-drift.test.mjs` and `node --test
scripts/workflow-status-sensor.test.mjs` stay green (the new CLAUDE.md row
and the new fenced block both parse), and `bun scripts/check-skill-context.mjs`
exits 0.

## P2 — Implement the turn-contract verifier engine

Layer: config/infra. One deliverable: the crate verifier engine, pinned by
its suite, the two-engine parity suite, and the grammar conformance test.

- Engine `packages/agentic-workflow/bin/turn-contract.mjs`: node-stdlib-only
  (zero dependencies — the crate has no lockfile, PE-006), portable
  `#!/usr/bin/env node` shebang, bun-first invocation per repo convention
  with the node fallback guaranteed (PE-005), flags `--finished`/`--help`,
  box checks 1–5 with the full semantics frozen in SPEC §Design (unit
  resolution from the branch name, default-branch resolution chain,
  fail-closed gh via `gh pr view --json state,headRefOid` — PE-003),
  receipt grammar, exit codes 0/1/2, read-only, correct from any cwd inside
  the repo.
- Engine suite `packages/agentic-workflow/test/turn-contract.engine.test.mjs`:
  throwaway fixture repos, gh stubbed through a PATH shim, per-box
  pass/fail/n-a cases, `--help`, unknown flag, subdirectory invocation, and
  the no-tree-mutation assertion (D-52-9 proportionality).
- Parity suite `packages/agentic-workflow/test/turn-contract.parity.test.mjs`:
  the same fixture-repo matrix through both engines asserting byte-identical
  stdout lines and exit codes (AC7).
- Conformance test `scripts/turn-contract-grammar.test.mjs`: both engines'
  outputs match the fenced `turn-contract-receipt@1` block parsed from
  `TURN_CONTRACT.md`, and the `CLAUDE.md` normative-surfaces row is present
  (AC8).

Done-when: `node --test packages/agentic-workflow/test/` exits 0 and
`node --test scripts/turn-contract-grammar.test.mjs` exits 0.

## P3 — Hardening & PR

Layer: hardening. Edge corpus over the SPEC §Dev scenarios matrix, the full
verification gate, then the literal close-out chain (PR with `Closes #226`,
roadmap flip to `done · [#<pr>]`, link commit).

Done-when: `git status --porcelain` → empty, with the PR URL printed in chat.
