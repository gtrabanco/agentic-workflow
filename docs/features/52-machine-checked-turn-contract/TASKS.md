# TASKS — 52-machine-checked-turn-contract

Per-phase execution checklists. Artifact revision: `52-plan-2`. The lint
target for this plan is this file (the M/L `SPEC.md` `### Phases` section is
the high-level ledger).

## P1 — Ship the machine-check receipt surface

Layer: docs · Done-when: `bash template/.agentic-workflow/hooks/tests/test-turn-contract.sh` → exit 0, `node --test scripts/normative-drift.test.mjs` → exit 0, `node --test scripts/workflow-status-sensor.test.mjs` → exit 0, and `bun scripts/check-skill-context.mjs` → exit 0.

- [ ] Create `template/.agentic-workflow/hooks/turn-contract.sh`: a bash, git and gh shim, flags `--finished` and `--help`, box checks 1–5 per SPEC §Design, the receipt grammar, exit codes 0, 1 and 2, and no node, bun, npm, npx token anywhere in the file (AC12)
- [ ] Create `template/.agentic-workflow/hooks/tests/test-turn-contract.sh` following the house hook-test helper pattern (`PE-008`): throwaway `git init` fixture repos asserting per-box pass, fail and n-a cases, subdirectory invocation, `--help`, and unknown-flag exit 2 (D-52-9 proportionality)
- [ ] Add the `## Machine-check profile` section and the fenced `turn-contract-receipt@1` grammar block to `skills/orchestration-envelope/references/TURN_CONTRACT.md`: paste-receipt demonstration for boxes 1–5, prose recitation not required when the verifier ran, fallback stated, boxes 6–11 unchanged, envelope echo rule (section ≤ 20 lines)
- [ ] Add the `turn-contract-receipt` row to `CLAUDE.md`'s normative-surfaces table (grammar `block:turn-contract-receipt@1`, machine cell unset per D-52-5, must-name `no`)
- [ ] Run `bump-skill` for `orchestration-envelope` (minor 2.0.2 → 2.1.0, CHANGELOG row, README and SKILLS table sync) and re-run `npm run bundle:skills` for pi mirror parity
- [ ] Run the P1 regressions after the profile section lands: `bun scripts/check-skill-context.mjs` exits 0 (budget headroom after the ≤ 20-line section — six skills load the file, PE-015) and `node --test scripts/workflow-status-sensor.test.mjs` exits 0 (the echo clause maps the envelope's `next` fields — AC10, O15)
- [ ] Add exactly one pointer to the machine-check profile in each of `docs/workflow/ORCHESTRATION.md` and `docs/workflow/FEATURE_WORKFLOW.md` (no grammar restatement elsewhere)

## P2 — Implement the turn-contract verifier engine

Layer: config/infra · Done-when: `node --test packages/agentic-workflow/test/` → exit 0, and `node --test scripts/turn-contract-grammar.test.mjs` → exit 0.

- [ ] Create `packages/agentic-workflow/bin/turn-contract.mjs`: a node-stdlib-only engine with a portable `env node` shebang and zero dependencies, flags `--finished` and `--help`, box checks 1–5 per SPEC §Design (resolution chain, reason codes, first-failure-wins order, fail-closed gh), the receipt grammar, exit codes 0, 1 and 2, read-only
- [ ] Create `packages/agentic-workflow/test/turn-contract.engine.test.mjs`: throwaway fixture repos plus a PATH-stubbed gh asserting per-box pass, fail and n-a cases (box2's `acceptance-missing` and `phase-lint-failed` named among the codes — the phase-lint clause is engine-only, ED-52-3), `--help`, unknown flag, subdirectory invocation, and a no-tree-mutation assertion (D-52-9 proportionality)
- [ ] Create `packages/agentic-workflow/test/turn-contract.parity.test.mjs`: the same fixture-repo matrix run through both engines asserting byte-identical stdout lines and exit codes
- [ ] Create `scripts/turn-contract-grammar.test.mjs`: both engines' outputs conform to the fenced `turn-contract-receipt@1` block and the normative-surfaces registration is present

## P3 — Hardening & PR

Layer: hardening · Done-when: `git status --porcelain` → empty.

- [ ] Exercise the SPEC §Dev scenarios failure matrix as edge fixtures in both suites
- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the roadmap row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a Markdown file, real backticks, never inline `--body`/heredoc) and PRINT THE PR URL in the chat; the body includes `Closes #226`
- [ ] Update the roadmap row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #<n>` and push
