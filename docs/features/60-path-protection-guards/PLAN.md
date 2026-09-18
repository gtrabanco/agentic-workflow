# PLAN — 60-path-protection-guards

Five phases, one layer each, zero open decisions. The Product half's sketch
("deterministic defaults, owner-configurable, tests freeze") is cut into three
config/infra deliverables (the gate, the pi guard) and two docs deliverables
(the template ship, the checkpoint contract) by the one-layer-per-phase rule
(`scripts/phase-lint.mjs` `layerForTarget()`; E-60-9 in `decisions.md`). Every
phase is one layer, zero open decisions, locally verifiable. Artifact revision
of this plan set: `60-plan-1` (initial cut 2026-09-18 by
`plan-feature-scaffold`).

Spec-lint engineering boxes (run at scaffold time): all pass — `### Dev
scenarios` carries eight failure-mode rows; every phase below passes the 8-box
phase-lint; `### Planning evidence` and `### Obligations` point at the frozen
M/L ledgers with zero blank cells; every normative Product behaviour has one
obligation row with a phase and a validator; no template placeholder remains in
the SPEC.

## P1 — Tier 1 path gate

Layer: config/infra

Build the deterministic policy model, the two gap parsers, the pure evaluator,
and the gate CLI in the producer crate, plus the crate engine suite and the
repo-root discipline suite. Everything is local and offline: the gate reads the
policy, the plan declaration, the escape records, and `git status`, and prints
one fixed block.

- [ ] Create `packages/agentic-workflow/src/path-policy.mjs` with the frozen `path-protection-policy@1` model: the `SHIPPED_PATH_POLICY` default (five classes, each with its default globs and its freeze flag), `parsePathPolicy(text)`, `resolvePathPolicy(shipped, override)` (globs union, requirement maximum), the closed `PATH_GUARD_REASONS` export, and the `DEGRADATION_CODES` export
- [ ] Add the plan-declaration reader and the record reader to `packages/agentic-workflow/src/path-policy.mjs`: `parsePlanDeclaration(text)` reads `path-protection-plan@1` (the `freeze-after` line plus `created` / `not-created` / `ignored` rows, each requiring a non-empty justification), and `parseRecords(text)` reads `path-protection-records@1` (`justification` / `approval` rows); both fail closed with `malformed-declaration`
- [ ] Add the pure evaluator `evaluatePathGuard({ changes, policy, declaration, records, phase })` to `packages/agentic-workflow/src/path-policy.mjs`: it maps each `(path, operation)` pair to its class and freeze state, applies the requirement, and returns `{ verdict, reason, offenders }` from the closed `PATH_GUARD_REASONS` set (an unmatched record yields `unmatched-record`)
- [ ] Create `packages/agentic-workflow/bin/path-guard.mjs` — the gate CLI `--unit <unit-dir> --phase <P<n>> [--base <ref>]` that resolves the policy (an absent config yields `missing-config` with the shipped defaults in force; an unreadable, invalid, oversized config yields `malformed-config` with the shipped defaults in force), derives changed paths from `git status --porcelain=v1 -z --untracked-files=all` unioned with `git diff --name-status` when `--base` is given, and prints the fixed `PATH-GUARD` block with exit 0 for pass, exit 1 for fail, exit 2 for usage
- [ ] Create `packages/agentic-workflow/test/path-guard.engine.test.mjs` with the freeze × class × operation matrix cases (the tests class, the e2e class, the test-file class, the fixtures class, and the policy-config class across pre-freeze and post-freeze), the creation-versus-modification cases, the justification, approval, and unmatched-record cases, and the shipped-default fallback plus degradation cases
- [ ] Create `scripts/path-protection.test.mjs` as the repo-root discipline suite: the CLI exit codes and fixed block over throwaway git fixture units, the closed-reason closure, the no-auto-approval negative case, and the policy-config-always-protected case
- [ ] Run both new suites green: `node --test packages/agentic-workflow scripts/path-protection.test.mjs` → exit 0

Done-when: `node --test packages/agentic-workflow scripts/path-protection.test.mjs` → exit 0 with the matrix, fallback, record, and CLI exit-code pins green.

Phase-lint: PASS (8/8) · fingerprint `P1:config/infra:7:tier-1-path-gate`

## P2 — Template policy ship

Layer: docs

Ship the policy to new installs: the template seed, its doc page, the hooks
README section, and the `init-workspace` install/upgrade seeding. The seed is
byte-identical to the crate default; the README documents what the guard is and
who consumes it.

- [ ] Create `template/.agentic-workflow/path-policy.json` as the install seed of the shipped-default policy, byte-identical to the crate module's default serialization
- [ ] Create `template/.agentic-workflow/path-protection.md` — the doc page for the policy: the protected classes, the pre-freeze versus post-freeze matrix, the tighten-only rule, the degradation behavior, and the justification and approval escape procedure
- [ ] Add the path-protection section to `template/.agentic-workflow/hooks/README.md` — the policy's home beside the command guard, what it protects, and the two consumers (the Tier 1 gate and the pi guard)
- [ ] Extend `skills/init-workspace/references/BOOTSTRAP_WRITE.md` so install mode seeds the policy file and its doc page additively
- [ ] Extend `skills/init-workspace/references/UPGRADE.md` so upgrade mode proposes the missing policy file and doc page without clobbering an existing owner policy
- [ ] Run the template mirror check and the seeding greps: the crate default serialization diffs empty against the template seed, and `grep -c 'path-policy' skills/init-workspace/references/` counts both seeding references

Done-when: the template mirror diff is empty and `grep -c 'path-policy' skills/init-workspace/references/*.md` is at least 2.

Phase-lint: PASS (8/8) · fingerprint `P2:docs:6:template-policy-ship`

## P3 — Checkpoint contract adoption

Layer: docs

Adopt the checkpoint contract across the plan, turn, execution, and normative
surfaces: the versioned grammar block, the `execute-phase` checkpoint step and
its rejection type, the `verification-contract` pointer, the plan-declaration
instruction in the templates and the scaffold reference, the normative-surface
row, and the budget re-basis for every touched skill.

- [ ] Add the `path-protection@1` fixed-grammar block to `skills/orchestration-envelope/references/TURN_CONTRACT.md` — the closed reason vocabulary, the checkpoint invocation, and the `path-protection-plan@1` / `path-protection-records@1` row shapes (placeholder tokens only, no project globs)
- [ ] Wire the checkpoint into `skills/execute-phase/references/PREFLIGHT.md` — a path-protection step after the phase-lint guard that runs the gate, pastes its block, and stops on a fail with the typed `GATE REJECTION — path-protection` trace (no `--force` bypass; the escape hatch is the recorded record)
- [ ] Add the `path-protection` row to the `gate-rejection-vocabulary@1` block in `skills/pre-execution-review/references/POLICY.md`
- [ ] Add the `path-protection-contract` row to the `normative-surfaces@1` table in `CLAUDE.md` (grammar `block:path-protection@1`, machine `path-protection-reason`, must-name `yes`) and one pointer sentence to the test-immutability section of `skills/verification-contract/SKILL.md`
- [ ] Add the declaration-block instruction to `skills/plan-feature-scaffold/references/SCAFFOLD_PROCESS.md` — placeholder tokens only
- [ ] Add the same declaration-block instruction to the engineering boxes of `docs/features/_TEMPLATE/SPEC.md` and to its fix-tree sibling — placeholder tokens only
- [ ] Re-base the touched skills' budget entries in `docs/workflow/SKILL_CONTEXT_BUDGETS.json` via the declared `ceil(measured × 1.10)` rule with the growth source named in `policy.declared`
- [ ] Run both gates green: `node --test scripts/normative-drift.test.mjs` and `node scripts/check-skill-context.mjs` → exit 0

Done-when: `node --test scripts/normative-drift.test.mjs` and `node scripts/check-skill-context.mjs` → exit 0 with the new normative row resolved and every touched route within its re-based ceiling.

Phase-lint: PASS (8/8) · fingerprint `P3:docs:8:checkpoint-contract-adoption`

## P4 — Pi preventive guard

Layer: config/infra

Tier 2 prevention: the pi package embeds the shipped-default mirror, gains the
strict `pathProtection` settings key and the tighten-only intersection, and
registers the `tool_call` guard that blocks writes to existing protected paths
without a recorded justification. Reads and new-file creates pass.

- [ ] Create `packages/pi-agentic-workflow/src/config/path-policy.ts` — the embedded shipped-default mirror, the `PathProtectionOverride` type, `intersectPathPolicy(shipped, override)` (globs union, requirement maximum, an ignored lowering reported), and the degradation codes
- [ ] Add the optional `pathProtection` key to `ConfigFile` and the resolved `pathProtection` field to `EffectiveConfig` in `packages/pi-agentic-workflow/src/config/types.ts`
- [ ] Validate the `pathProtection` key strictly in `packages/pi-agentic-workflow/src/config/schema.ts` by adding it to `ROOT_KEYS` and checking its shape
- [ ] Resolve the effective path policy in `packages/pi-agentic-workflow/src/config/merge.ts` and surface the cross-scope override plus its degradation records from `packages/pi-agentic-workflow/src/config/load.ts`
- [ ] Register the `tool_call` guard in `packages/pi-agentic-workflow/src/extension/index.ts` — block a `write` / `edit` call to an existing protected path without a matching justification record, return `{ block: true, reason }` naming the escape path, and pass read-only calls plus new-file creates
- [ ] Create `packages/pi-agentic-workflow/test/path-protection.test.mjs` with the block and reason cases, the read-passthrough case, the create-passthrough case, the tighten and loosen resolution cases, and the cross-package shipped-default parity case
- [ ] Run the package suite green: `cd packages/pi-agentic-workflow && bun run test` → exit 0

Done-when: `cd packages/pi-agentic-workflow && bun run test` → exit 0 with the block, passthrough, tighten/loosen, and parity pins green.

Phase-lint: PASS (8/8) · fingerprint `P4:config/infra:7:pi-preventive-guard`

## P5 — Hardening & PR

Layer: hardening

Qualify the whole unit against the frozen finish line, re-bundle the Pi mirror,
and close out. The acceptance blob receipt is recorded at first execution run.

- [ ] Run the full verification ladder — `node --test scripts/*.test.mjs`, `node --test packages/agentic-workflow`, and the pi package suite in its own directory → exit 0 across the ladder
- [ ] Re-bundle the Pi mirror from the final skill tree with the package's own `bun run bundle:skills` and run the parity suite (`node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs`) → exit 0
- [ ] Verify the frozen acceptance manifest blob with `git hash-object docs/features/60-path-protection-guards/ACCEPTANCE.md` and record the acceptance receipt in the unit progress log
- [ ] Confirm every phase fingerprint in this plan still matches the committed phase shapes and that every read-verified row has its evidence recorded (manual)
- [ ] open the PR (`gh pr create --body-file <path>` — body written as a Markdown file, real backticks, never inline `--body`/heredoc that leaves `\`-escaped backticks) and PRINT THE PR URL in the chat
- [ ] update the roadmap row to `done · [#<pr>](<pr-url>)`
- [ ] commit `docs: link PR #<n>` and push

Done-when: `node --test scripts/path-protection.test.mjs` → exit 0 with the whole ladder green, parity green, and the PR URL printed.

Phase-lint: PASS (8/8) · fingerprint `P5:hardening:7:hardening-pr`
