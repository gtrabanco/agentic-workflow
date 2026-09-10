# PLAN — 37-phase-lint-script

Five implementation phases (rule-owner amendment → linter implementation →
vehicle crate → consumer skill slimming → hardening & PR). The input grammar,
rule-check semantics, reason codes, and output contract are frozen in
`SPEC.md` (`## Engineering half` → `### Design`). Artifact revision of this
plan set: `37-plan-3`.

## P1 — Amend phase-contract rule 1

Layer: docs · amend `skills/phase-contract/SKILL.md` rule 1 with the
owner-sanctioned exception: the templates' literal closing title
`Hardening & PR` is the only authorized `&`-joined title; its title-deliverable
normalizes to `hardening-pr` (`&` is a normalization separator, not a
deliverable joiner); any other `&`-joined title still FAILs. Version bump
1.0.1 → 1.0.2, then re-run `npm run bundle:skills` for pi mirror parity. This
implements the F5 resolution (ED6) — the rule amendment lands in the rule
owner, inside this PR. `phase-contract` is not edited again by any other phase
of this feature.

## P2 — Implement the deterministic phase linter

Layer: config/infra · write the corpus test red-first, then implement
`scripts/phase-lint.mjs` with the plan-grammar parser (phase headings, `Layer:`
line, tasks, `Done-when:`), the eight rule checks (box-1 implementing the
amended rule 1 verbatim) with per-phase verdict lines, the fail-closed reason
codes (`missing-plan`, `no-phases`, `unparseable`), exit codes 0/1, per-phase
fingerprints, and the whole-plan sha256 fingerprint line. The corpus includes
a 9-task-phase fixture asserting `BLOCKED — box 3` (owns the `lint:threshold`
dev scenario). No network calls, no external dependencies.

## P3 — Create the producer crate vehicle

Layer: config/infra · per the vehicle rule (declined 43 / issue #196), create
the minimal `packages/agentic-workflow` crate skeleton (`package.json`, README
stub; no dependencies, no build step) and the `.agentic-workflow/tmp/.gitkeep`
scratch convention. The linter stays at `scripts/phase-lint.mjs` (ED1).

## P4 — Slim the three consumer routes to run-and-paste

Layer: docs · edit `skills/plan-feature-scaffold/SKILL.md`,
`skills/plan-fix/SKILL.md`, and `skills/execute-phase/SKILL.md` (+
`references/PREFLIGHT.md`) so the phase-lint step runs
`bun scripts/phase-lint.mjs <plan.md>` and pastes its output; keep the
`phase-contract` pointer as sole rule owner (amended once in P1 — this phase
does not touch it); minor version bumps for all three; re-run
`npm run bundle:skills` for pi mirror parity.

## P5 — Hardening & PR

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
