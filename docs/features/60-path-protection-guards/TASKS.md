# TASKS — 60-path-protection-guards

Per-phase checklists mirroring `PLAN.md` (fingerprints recorded there). The
frozen finish line is `ACCEPTANCE.md`; the obligations ledger is
`planning-obligations.md`. Command-checkable acceptance is expressed as the
command; judgment-only checks are labelled `read-verified`.

## P1 — Tier 1 path gate

Layer: config/infra · fingerprint `P1:config/infra:7:tier-1-path-gate`
· Phase-lint: PASS (8/8)

- [x] Create `packages/agentic-workflow/src/path-policy.mjs` with the frozen `path-protection-policy@1` model: the `SHIPPED_PATH_POLICY` default (five classes, each with its default globs and its freeze flag), `parsePathPolicy(text)`, `resolvePathPolicy(shipped, override)` (globs union, requirement maximum), `serializeShippedPolicy()` (the canonical seed serialization P2 diffs against), the closed `PATH_GUARD_REASONS` export as a frozen literal array (readable by the drift gate's `schema-export:` surface), and the `DEGRADATION_CODES` export
- [x] Add the plan-declaration reader and the record reader to `packages/agentic-workflow/src/path-policy.mjs`: `parsePlanDeclaration(text)` reads `path-protection-plan@1` (the `freeze-after` line plus `created` / `not-created` / `ignored` rows, each requiring a non-empty justification), and `parseRecords(text)` reads `path-protection-records@1` (`justification` / `approval` rows); both fail closed with `malformed-declaration`
- [x] Add the pure evaluator `evaluatePathGuard({ changes, policy, declaration, records, phase })` to `packages/agentic-workflow/src/path-policy.mjs`: it maps each `(path, operation)` pair to its class and freeze state, applies the requirement, and returns `{ verdict, reason, offenders }` from the closed `PATH_GUARD_REASONS` set (an unmatched record yields `unmatched-record`)
- [x] Create `packages/agentic-workflow/bin/path-guard.mjs` — the gate CLI `--unit <unit-dir> --phase <P<n>> [--base <ref>]` that resolves the policy (an absent config yields `missing-config` with the shipped defaults in force; an unreadable, invalid, oversized config yields `malformed-config` with the shipped defaults in force), derives changed paths from `git status --porcelain=v1 -z --untracked-files=all` unioned with `git diff --name-status` when `--base` is given, and prints the fixed `PATH-GUARD` block with exit 0 for pass, exit 1 for fail, exit 2 for usage
- [x] Create `packages/agentic-workflow/test/path-guard.engine.test.mjs` with the freeze × class × operation matrix cases (the tests class, the e2e class, the test-file class, the fixtures class, and the policy-config class across pre-freeze and post-freeze), the creation-versus-modification cases, the justification, approval, and unmatched-record cases, the shipped-default fallback plus degradation cases, and the `path-guard:empty-diff` pin (a clean tree yields `pass — clean`, exit 0)
- [x] Create `scripts/path-protection.test.mjs` as the repo-root discipline suite: the CLI exit codes and fixed block over throwaway git fixture units, the closed-reason closure, the no-auto-approval negative case, the policy-config-always-protected case, the `path-guard:two-runs` byte-identical idempotence pin, and the `path-guard:committed-range` pin (a committed protected modification with no record fails at the next checkpoint `path-guard --phase P1 --base <pre-P1-ref>`, exit 1)
- [x] Run both new suites green: `bun test packages/agentic-workflow/test/ && node --test scripts/path-protection.test.mjs` → exit 0 — evidence: `<recorded at execution>`

Done-when: `bun test packages/agentic-workflow/test/ && node --test scripts/path-protection.test.mjs` → exit 0 with the matrix, fallback, record, empty-diff, two-runs, committed-range, and CLI exit-code pins green.

## P2 — Template policy ship

Layer: docs · fingerprint `P2:docs:6:template-policy-ship` · Phase-lint: PASS (8/8)

- [x] Create `template/.agentic-workflow/path-policy.json` as the install seed of the shipped-default policy, byte-identical to the crate module's default serialization
- [x] Create `template/.agentic-workflow/path-protection.md` — the doc page for the policy: the protected classes, the pre-freeze versus post-freeze matrix, the tighten-only rule, the degradation behavior, and the justification and approval escape procedure
- [x] Add the path-protection section to `template/.agentic-workflow/hooks/README.md` — the policy's home beside the command guard, what it protects, and the two consumers (the Tier 1 gate and the pi guard)
- [x] Extend `skills/init-workspace/references/BOOTSTRAP_WRITE.md` so install mode seeds the policy file and its doc page additively
- [x] Extend `skills/init-workspace/references/UPGRADE.md` so upgrade mode proposes the missing policy file and doc page without clobbering an existing owner policy
- [x] Run the template-seed parity command and the seeding greps: `template/.agentic-workflow/path-policy.json` is diffed byte-for-byte against the crate's `serializeShippedPolicy()` output (`node -e` importing `packages/agentic-workflow/src/path-policy.mjs`), and `grep -c 'path-policy' skills/init-workspace/references/` counts both seeding references — evidence: `<recorded at execution>`

Done-when: `diff <(node -e "import('./packages/agentic-workflow/src/path-policy.mjs').then(m=>process.stdout.write(m.serializeShippedPolicy()))") template/.agentic-workflow/path-policy.json` → empty, and `grep -c 'path-policy' skills/init-workspace/references/*.md` → at least 2.

## P3 — Checkpoint contract adoption

Layer: docs · fingerprint `P3:docs:8:checkpoint-contract-adoption` · Phase-lint: PASS (8/8)

- [x] Add the `path-protection@1` fixed-grammar block to `skills/orchestration-envelope/references/TURN_CONTRACT.md` — the closed reason vocabulary, the checkpoint invocation, and the `path-protection-plan@1` / `path-protection-records@1` row shapes (placeholder tokens only, no project globs)
- [x] Wire the checkpoint into `skills/execute-phase/references/PREFLIGHT.md` — a path-protection step after the phase-lint guard that records each phase's base ref, runs `path-guard --unit <unit-dir> --phase P<n-1> --base <P<n-1> base ref>` over the just-closed committed range (P1 uses the planning-artifacts range; the final phase's range is checked by P5's close-out gate), pastes its block, and stops on a fail with the typed `GATE REJECTION — path-protection` trace (no `--force` bypass; the escape hatch is the recorded record)
- [x] Add the `path-protection` row to the `gate-rejection-vocabulary@1` block in `skills/pre-execution-review/references/POLICY.md` and update the same file's prose sentence "from a closed set of four" to name the five-member closed set, so the block and the sentence cannot contradict each other
- [x] Add two `normative-surfaces@1` rows to `CLAUDE.md` — `path-protection-contract` (grammar `block:path-protection@1`, machine `path-protection-reason`, must-name `no`) and `path-protection-reasons` (grammar `schema-export:PATH_GUARD_REASONS`, file `packages/agentic-workflow/src/path-policy.mjs`, machine `path-protection-reason`, must-name `no`) — and one pointer sentence to the test-immutability section of `skills/verification-contract/SKILL.md`
- [x] Add the declaration-block instruction to `skills/plan-feature-scaffold/references/SCAFFOLD_PROCESS.md` — placeholder tokens only
- [x] Add the same declaration-block instruction to the engineering boxes of `docs/features/_TEMPLATE/SPEC.md` and to its fix-tree sibling — placeholder tokens only
- [x] Re-base the touched skills' budget entries in `docs/workflow/SKILL_CONTEXT_BUDGETS.json` via the declared `ceil(measured × 1.10)` rule with the growth source named in `policy.declared`
- [x] Run both gates green: `node --test scripts/normative-drift.test.mjs` and `node scripts/check-skill-context.mjs` → exit 0 — evidence: `<recorded at execution>`

Done-when: `node --test scripts/normative-drift.test.mjs` and `node scripts/check-skill-context.mjs` → exit 0 with the new normative row resolved and every touched route within its re-based ceiling.

## P4 — Pi preventive guard

Layer: config/infra · fingerprint `P4:config/infra:7:pi-preventive-guard` · Phase-lint: PASS (8/8)

- [x] Create `packages/pi-agentic-workflow/src/config/path-policy.ts` — the embedded shipped-default mirror, the `PathProtectionOverride` type, `intersectPathPolicy(shipped, override)` (globs union, requirement maximum, an ignored lowering reported), `matchingJustification(targetPath, recordsText)` (the `path-protection-records@1` reader the guard uses), and the degradation codes
- [x] Add the optional `pathProtection` key to `ConfigFile` and the resolved `pathProtection` field to `EffectiveConfig` in `packages/pi-agentic-workflow/src/config/types.ts`
- [x] Validate the `pathProtection` key strictly in `packages/pi-agentic-workflow/src/config/schema.ts` by adding it to `ROOT_KEYS` and checking its shape
- [x] Resolve the effective path policy in `packages/pi-agentic-workflow/src/config/merge.ts` and surface the cross-scope override plus its degradation records from `packages/pi-agentic-workflow/src/config/load.ts`
- [x] Register the `tool_call` guard in `packages/pi-agentic-workflow/src/extension/index.ts` — resolve the repo root from `ctx.cwd`, read the `path-protection-records@1` block of every `docs/features/*/decisions.md` and `docs/fix/*/decisions.md`, block a `write` / `edit` call to an existing protected path whose target matches no `justification` row, return `{ block: true, reason }` naming the escape path, and pass read-only calls plus new-file creates
- [x] Create `packages/pi-agentic-workflow/test/path-protection.test.mjs` with the block and reason cases, the matching-justification-permits-write positive case, the read-passthrough case, the create-passthrough case, the tighten and loosen resolution cases, and the cross-package shipped-default parity case
- [x] Run the package suite green: `cd packages/pi-agentic-workflow && bun run test` → exit 0 — evidence: `<recorded at execution>`

Done-when: `cd packages/pi-agentic-workflow && bun run test` → exit 0 with the block, matching-record, passthrough, tighten/loosen, and parity pins green.

## P5 — Hardening & PR

Layer: hardening · fingerprint `P5:hardening:10:hardening-pr` · Phase-lint: PASS (8/8)

- [x] Run the full verification ladder — `node --test scripts/*.test.mjs`, `bun test packages/agentic-workflow/test/`, and the pi package suite in its own directory → exit 0 across the ladder
- [x] Bump the six touched skills at **minor** with the repo's `bump-skill` maintenance skill — `execute-phase`, `plan-feature-scaffold`, `init-workspace`, `orchestration-envelope`, `pre-execution-review`, `verification-contract` — so every `version:` frontmatter and its changelog rows are synchronized, then verify with `node --test scripts/normative-drift.test.mjs` → exit 0 — evidence: `<recorded at execution>`
- [x] Bump the pi package (`pi-agentic-workflow`) to `0.11.0` and add its Companion npm packages changelog row naming the feature-60 re-bundle, then verify with `node --test scripts/normative-drift.test.mjs` → exit 0 — evidence: `<recorded at execution>`
- [x] Re-bundle the Pi mirror from the final skill tree with the package's own `bun run bundle:skills` and run the parity suite (`node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs`) → exit 0
- [x] Verify the frozen acceptance manifest blob with `git hash-object docs/features/60-path-protection-guards/ACCEPTANCE.md` and record the acceptance receipt in the unit progress log
- [x] Confirm every phase fingerprint in this plan still matches the committed phase shapes and that every read-verified row has its evidence recorded (manual)
- [ ] Record P5's base ref (`git rev-parse HEAD` at phase entry) in the phase handoff, then run the close-out path gate `bun packages/agentic-workflow/bin/path-guard.mjs --unit docs/features/60-path-protection-guards --phase P5 --base <P5 base ref>` → exit 0 with the `PATH-GUARD` block pasted; a fail stops the close-out before the PR (no `--force` bypass) — evidence: `<recorded at execution>`
- [ ] open the PR (`gh pr create --body-file <path>` — body written as a Markdown file, real backticks, never inline `--body`/heredoc that leaves `\`-escaped backticks) and PRINT THE PR URL in the chat
- [ ] update the roadmap row to `done · [#<pr>](<pr-url>)`
- [ ] commit `docs: link PR #<n>` and push

Done-when: `bun packages/agentic-workflow/bin/path-guard.mjs --unit docs/features/60-path-protection-guards --phase P5 --base <P5 base ref>` → exit 0 and `node --test scripts/path-protection.test.mjs` → exit 0 with the whole ladder green, the version/CHANGELOG sweep recorded, parity green, and the PR URL printed.
