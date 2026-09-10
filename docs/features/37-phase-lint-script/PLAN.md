# PLAN — 37-phase-lint-script

Four implementation phases (linter implementation → vehicle crate → consumer
skill slimming → hardening & PR). The input grammar, rule-check semantics,
reason codes, and output contract are frozen in `SPEC.md` (`## Engineering half`
→ `### Design`). Artifact revision of this plan set: `37-plan-2`.

## P1 — Implement the deterministic phase linter

Layer: config/infra · write the corpus test red-first, then implement
`scripts/phase-lint.mjs` with the plan-grammar parser (phase headings, `Layer:`
line, tasks, `Done-when:`), the eight rule checks with per-phase verdict lines,
the fail-closed reason codes (`missing-plan`, `no-phases`, `unparseable`),
exit codes 0/1, per-phase fingerprints, and the whole-plan sha256 fingerprint
line. No network calls, no external dependencies.

## P2 — Create the producer crate vehicle

Layer: config/infra · per the vehicle rule (declined 43 / issue #196), create
the minimal `packages/agentic-workflow` crate skeleton (`package.json`, README
stub; no dependencies, no build step) and the `.agentic-workflow/tmp/.gitkeep`
scratch convention. The linter stays at `scripts/phase-lint.mjs` (ED1).

## P3 — Slim the three consumer routes to run-and-paste

Layer: docs · edit `skills/plan-feature-scaffold/SKILL.md`,
`skills/plan-fix/SKILL.md`, and `skills/execute-phase/SKILL.md` (+
`references/PREFLIGHT.md`) so the phase-lint step runs
`bun scripts/phase-lint.mjs <plan.md>` and pastes its output; keep the
`phase-contract` pointer as sole rule owner; minor version bumps for all three;
re-run `npm run bundle:skills` for pi mirror parity.

## P4 — Hardening & PR

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Exercise dev-scenario edge corpus: oversized input, permission-denied, concurrent runs (see SPEC Dev scenarios)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the roadmap row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #184`
- [ ] Update the roadmap row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #<n>` and push
