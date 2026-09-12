# TASKS — 37-phase-lint-script

Per-phase execution checklists. Artifact revision: `37-plan-6`.

## P1 — Amend phase-contract rule 1

Layer: docs · Done-when: `grep -n "Hardening & PR" skills/phase-contract/SKILL.md` → matches rule 1, and `npm run bundle:skills` → exit 0.

- [x] Amend `skills/phase-contract/SKILL.md` rule 1: authorize the templates' literal closing title `Hardening & PR` as the sole exception (`&` is a normalization separator; title-deliverable normalizes to `hardening-pr`); any other `&`-joined title still FAILs
- [x] Run `bump-skill` for `phase-contract`: bump version 1.0.1 to 1.0.2 and add new rows in CHANGELOG.md and CHANGELOG.es.md + README/SKILLS table sync
- [x] Re-run `npm run bundle:skills` (pi mirror parity)

## P2 — Implement the deterministic phase linter

Layer: config/infra · Done-when: `node --test scripts/phase-lint.test.mjs` → exit 0.

- [x] Create `scripts/phase-lint.mjs` with the plan-grammar parser (phase headings, `Layer:` line, tasks, `Done-when:`) per SPEC Design
- [x] Implement the eight rule checks (`box-1`…`box-8`) with per-phase verdict lines in the fixed output block; box-1 implements the amended rule 1 verbatim
- [x] Implement fail-closed reason codes (`missing-plan`, `no-phases`, `unparseable`, `lint-blocked`) and exit codes 0/1
- [x] Compute per-phase fingerprints and the file-level sha256 fingerprint line
- [x] Write the corpus fixtures in `scripts/phase-lint.test.mjs` (valid, invalid, ambiguous-layer, no-phases, missing-plan, 9-task-phase threshold fixture asserting `BLOCKED — box 3`) asserting verdicts + reason codes
- [x] Verify determinism and node fallback parity (AC4, AC7)

## P3 — Create the producer crate vehicle

Layer: config/infra · Done-when: `test -d packages/agentic-workflow && test -f packages/agentic-workflow/package.json && test -d .agentic-workflow/tmp` → exit 0.

- [x] Create `packages/agentic-workflow/package.json` (name `@gtrabanco/agentic-workflow`, private, zero dependencies)
- [x] Create `packages/agentic-workflow/README.md` stub
- [x] Create `.agentic-workflow/tmp/.gitkeep` (committed, so the convention exists on fresh clones)

## P4 — Slim the three consumer routes to run-and-paste

Layer: docs · Done-when: `grep -n "phase-lint.mjs" skills/plan-feature-scaffold/SKILL.md skills/plan-fix/SKILL.md skills/execute-phase/SKILL.md` → matches in all three, and `bun scripts/check-skill-context.mjs` + `npx skills add . --list` → exit 0.

- [x] `skills/plan-feature-scaffold/SKILL.md`: replace model-reasoning lint with run-and-paste of `bun scripts/phase-lint.mjs <plan>`; minor bump
- [x] `skills/plan-fix/SKILL.md`: same replacement; minor bump
- [x] `skills/execute-phase/SKILL.md` + `references/PREFLIGHT.md`: pre-flight runs the script instead of model reasoning; minor bump
- [x] Do not touch `skills/phase-contract/SKILL.md` in this phase (amended once in P1, sole rule owner)
- [x] Run `bump-skill` for the three edited skills: minor bumps + CHANGELOG rows in CHANGELOG.md and CHANGELOG.es.md + README/SKILLS table sync
- [x] Re-run `npm run bundle:skills` (pi mirror parity)
- [x] Run `bun scripts/check-skill-context.mjs` and `npx skills add . --list` — both green

## P5 — Implement the box-2 test-file mapping

Layer: config/infra · Done-when: `node --test scripts/phase-lint.test.mjs` → exit 0, and `bun scripts/phase-lint.mjs docs/features/37-phase-lint-script/TASKS.md` → exit 0.

- [ ] Add the red-first corpus fixtures to `scripts/phase-lint.test.mjs`: a test-only `Layer: hardening` phase creating `scripts/tokenizer.test.mjs` expects box-2 PASS (the VF-7 reproducer); a `Layer: hardening` phase with source target `scripts/tokenizer.mjs` expects `BLOCKED — box 2`; a `Layer: config/infra` phase creating `scripts/phase-lint.test.mjs` beside its implementation keeps box-2 PASS
- [ ] Implement the mapping in `scripts/phase-lint.mjs`: a test-file target (basename containing `.test.`) in a phase declared `hardening` maps to `hardening`; every other target keeps the frozen prefix-table mapping; the ambiguous flow is unchanged

## P6 — Hardening & PR

Layer: hardening · Done-when: `git status --porcelain -- docs/` → empty, and the project verification gate commands exit 0.

- [x] Re-run the project's full verification gate (commands + exit codes pasted)
- [x] Exercise dev-scenario edge corpus: oversized input, permission-denied, concurrent runs (see SPEC Dev scenarios)
- [x] Pending-docs check: `git status --porcelain -- docs/` → empty
- [x] Set the roadmap row status to `done` and commit the flip
- [x] `git push`
- [x] Open the PR (`gh pr create --body-file <path>` — body written as a Markdown file, real backticks, never inline `--body`/heredoc) and PRINT THE PR URL in the chat; the body includes `Closes #184`
- [x] Update the roadmap row to `done · [#<pr>](<pr-url>)`
- [x] Commit `docs: link PR #<n>` and push
