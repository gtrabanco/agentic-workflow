# TASKS — 37-phase-lint-script

Per-phase execution checklists. Artifact revision: `37-plan-4`.

## P1 — Amend phase-contract rule 1

- [x] Amend `skills/phase-contract/SKILL.md` rule 1: authorize the templates' literal closing title `Hardening & PR` as the sole exception (`&` is a normalization separator; title-deliverable normalizes to `hardening-pr`); any other `&`-joined title still FAILs
- [x] Run `bump-skill` for `phase-contract`: bump version 1.0.1 to 1.0.2 and add new rows in CHANGELOG.md and CHANGELOG.es.md + README/SKILLS table sync
- [x] Re-run `npm run bundle:skills` (pi mirror parity)

## P2 — Implement the deterministic phase linter

- [ ] Create `scripts/phase-lint.mjs` with the plan-grammar parser (phase headings, `Layer:` line, tasks, `Done-when:`) per SPEC Design
- [ ] Implement the eight rule checks (`box-1`…`box-8`) with per-phase verdict lines in the fixed output block; box-1 implements the amended rule 1 verbatim
- [ ] Implement fail-closed reason codes (`missing-plan`, `no-phases`, `unparseable`, `lint-blocked`) and exit codes 0/1
- [ ] Compute per-phase fingerprints and the file-level sha256 fingerprint line
- [ ] Write the corpus fixtures in `scripts/phase-lint.test.mjs` (valid, invalid, ambiguous-layer, no-phases, missing-plan, 9-task-phase threshold fixture asserting `BLOCKED — box 3`) asserting verdicts + reason codes
- [ ] Verify determinism and node fallback parity (AC4, AC7)

## P3 — Create the producer crate vehicle

- [ ] Create `packages/agentic-workflow/package.json` (name `@gtrabanco/agentic-workflow`, private, zero dependencies)
- [ ] Create `packages/agentic-workflow/README.md` stub
- [ ] Create `.agentic-workflow/tmp/.gitkeep` (committed, so the convention exists on fresh clones)

## P4 — Slim the three consumer routes to run-and-paste

- [ ] `skills/plan-feature-scaffold/SKILL.md`: replace model-reasoning lint with run-and-paste of `bun scripts/phase-lint.mjs <plan>`; minor bump
- [ ] `skills/plan-fix/SKILL.md`: same replacement; minor bump
- [ ] `skills/execute-phase/SKILL.md` + `references/PREFLIGHT.md`: pre-flight runs the script instead of model reasoning; minor bump
- [ ] Do not touch `skills/phase-contract/SKILL.md` in this phase (amended once in P1, sole rule owner)
- [ ] Run `bump-skill` for the three edited skills: minor bumps + CHANGELOG rows in CHANGELOG.md and CHANGELOG.es.md + README/SKILLS table sync
- [ ] Re-run `npm run bundle:skills` (pi mirror parity)
- [ ] Run `bun scripts/check-skill-context.mjs` and `npx skills add . --list` — both green

## P5 — Hardening & PR

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Exercise dev-scenario edge corpus: oversized input, permission-denied, concurrent runs (see SPEC Dev scenarios)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the roadmap row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a Markdown file, real backticks, never inline `--body`/heredoc) and PRINT THE PR URL in the chat; the body includes `Closes #184`
- [ ] Update the roadmap row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #<n>` and push
