# architecture-notes — 60-path-protection-guards

## Layer analysis

- **config/infra (P1, P4):** the producer crate
  (`packages/agentic-workflow/`) gains the policy module
  (`src/path-policy.mjs`), the gate CLI (`bin/path-guard.mjs`), and the engine
  suite; `scripts/path-protection.test.mjs` is the repo-root discipline suite.
  The policy model is pure (parse, resolve, evaluate) and the CLI is the only
  spawn point (`git status`, `git diff`); nothing writes. The pi package gains
  the strict `pathProtection` key in its config layer
  (`src/config/{types,schema,merge,load}.ts`), the embedded default mirror
  (`src/config/path-policy.ts`), and the `tool_call` registration in
  `src/extension/index.ts` beside the existing `model_select` /
  `thinking_level_select` / `agent_settled` handlers.
- **docs (P2, P3):** `template/.agentic-workflow/` gains the policy seed
  (`path-policy.json`) and its doc page (`path-protection.md`), the hooks README
  gains the guard section, and the two `init-workspace` references seed them.
  The checkpoint contract lives in
  `skills/orchestration-envelope/references/TURN_CONTRACT.md` (the
  `path-protection@1` grammar block), `skills/execute-phase/references/PREFLIGHT.md`
  (the checkpoint step), `skills/pre-execution-review/references/POLICY.md` (the
  rejection type), `skills/verification-contract/SKILL.md` (the pointer), the
  plan templates and the scaffold reference (the declaration instruction), and
  `CLAUDE.md` (the normative-surface row).
- **hardening (P5):** qualification only — ladder runs, mirror re-bundle plus
  parity, acceptance blob receipt, close-out.

## Contract impact

- **One policy, three consumers.** `path-protection-policy@1` is owned by the
  crate module; the template seed and the pi mirror are copies pinned by parity
  checks (E-60-1). A new protected class, a new operation, or a new requirement
  value is a SPEC change, never a code path. The reason vocabulary is closed
  (`PATH_GUARD_REASONS`) and declared as a normative surface.
- **Additive configuration.** `pathProtection` is an optional key in the pi
  config file; an absent key means the shipped defaults, and an existing file
  without the key stays valid (the strict validator adds the key to
  `ROOT_KEYS` without changing any other key's semantics).
- **Read-only gate.** The CLI reads the policy, the plan declaration, the
  escape records, and git state, and prints; it writes nothing. It needs no
  network and no forge, so it is usable offline and on any host with the crate.
- **Ledger reuse, no new ledger.** Justifications and approvals are append-only
  rows in the unit's `decisions.md` under the already-declared
  `execute-phase:phase-decisions` and `human-owner:ratified-verdicts` column
  sets. The gate is a reader; the ownership map is unchanged.
- **Normative surface additions.** `path-protection-reason` joins the drift
  gate's must-name closed set through the `block:path-protection@1` grammar;
  `gate-rejection-type` gains `path-protection`. The skill text carries
  placeholders only, so `grep -nE 'tests/\*\*|e2e/\*\*' skills/` stays empty.
- **No public package release.** `packages/agentic-workflow` is private
  (`"private": true`) and the change is not published; the pi package gains a
  minor version bump per the repo's version-per-change rule (recorded at
  execution with its CHANGELOG row).

## Runtime and distribution

- The crate ships with the repository, not with the installed skills
  (feature 59 B-01 / feature 44 #198). The checkpoint wiring discloses an
  unavailable gate exactly as the phase-lint guard already does and records it;
  it never silently skips the gate.
- The pi mirror (`packages/pi-agentic-workflow/skills/`) must be re-bundled in
  the same PR as any skill edit; the bundle runs in P5 after the last skill
  write (P3).
- Context budgets are re-based in P3, after all skill text is final, using the
  tool's own declared rule.
