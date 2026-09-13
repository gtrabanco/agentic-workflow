# PLAN — 37-phase-lint-script

Seven implementation phases (rule-owner amendment → linter implementation →
vehicle crate → consumer skill slimming → box-2 test-file mapping → grammar
conformance → hardening & PR). The input grammar, rule-check semantics, reason
codes, and output contract are frozen in `SPEC.md` (`## Engineering half` →
`### Design`). Artifact revision of this plan set: `37-plan-4` (repair batch
for review receipt PLAN-REVIEW-37-3 — folds F8–F11; fingerprints re-derived
mechanically over the re-cut plan, see ED7), then `37-plan-5`
(user-directed replan-in-unit fold of code-review finding F7 — the SPEC §Design
box-2 test-file mapping for the owner-sanctioned test-only `hardening` shape;
the former close-out P5 is renumbered P6, and fingerprints are re-derived by
`scripts/phase-lint.mjs` itself — see decisions.md), then `37-plan-6` (repair
batch for review receipt PLAN-REVIEW-37-6 — folds F14–F16 — plus the
feature-38 merge readiness; phase shape and fingerprints unchanged — see
ED8), then `37-plan-7` (user-directed replan-in-unit re-cut of the four
plan-owned review rows F28 + F29 + F30 + F33 — the loop-cap route: §Design
box-5 widened to owner rule 5, the grammar gains fenced-code-block handling,
the title-deliverable article rule and the §Output contract reason codes
re-stated to their agreeing authorities; the plan is re-cut to seven phases —
the new P6 owns the two behavioral conformance fixes, the former close-out P6
is renumbered P7; fingerprints re-derived by the linter — see decisions.md
ED9).

## P1 — Amend phase-contract rule 1

Layer: docs · amend `skills/phase-contract/SKILL.md` rule 1 with the
owner-sanctioned exception: the templates' literal closing title
`Hardening & PR` is the only authorized `&`-joined title; its title-deliverable
normalizes to `hardening-pr` (`&` is a normalization separator, not a
deliverable joiner); any other `&`-joined title still FAILs. Run `bump-skill`
for the amended skill (bump version 1.0.1 to 1.0.2 and add the new rows in
CHANGELOG.md and CHANGELOG.es.md with README/SKILLS table sync), then re-run
`npm run bundle:skills` for pi mirror parity. This implements the F5 resolution
(ED6) — the rule amendment lands in the rule owner, inside this PR.
`phase-contract` is not edited again by any other phase of this feature.

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
does not touch it); run `bump-skill` for the three edited skills (minor bumps +
CHANGELOG rows in both CHANGELOGs + README/SKILLS table sync); re-run
`npm run bundle:skills` for pi mirror parity. Each task's target file is the
edited skill itself; the run-and-paste command inside the prose is quoted
content, not a file the phase edits.

## P5 — Implement the box-2 test-file mapping

Layer: config/infra · write the corpus fixtures red-first, then implement the
SPEC-frozen box-2 test-file mapping: a test-file target (basename containing
`.test.`) in a phase declared `hardening` maps to `hardening` — the
owner-sanctioned test-only shape (`phase-contract` rule 2); every other
target keeps the prefix-table mapping and the ambiguous flow is unchanged.
This lands the code-review F7 fold (replan-in-unit); `phase-contract` is not
touched (amended once in P1, sole rule owner).

## P6 — Conform the linter to the re-cut grammar

Layer: config/infra · write the corpus fixtures red-first (the VF-30 bare
standalone alternatives-word reproducer expecting `BLOCKED — box 5` with an
embedded-word negative, the VF-33 quoted-plan-fragment-inside-a-fence
reproducer, the unclosed-fence edge), then implement the two behaviors in
`scripts/phase-lint.mjs`: box-5 fails the standalone alternatives word per the
mechanical definition frozen in SPEC §Design box-5 (no word character and no
hyphen adjacent on both sides; hyphen-joined compounds are one token, never a
joiner), and the parser recognizes fenced code blocks and ignores every line
inside one, an unclosed fence running to end of file. This lands the F30 +
F33 re-cut (replan-in-unit); `phase-contract` is not touched (amended twice,
sole rule owner — O12).

## P7 — Hardening & PR

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
