# Planning Evidence — feature/591-skill-discovery

> One row per Engineering claim the change rests on. `authority-kind`:
> `known` | `assumption` | `unknown` | `spec`. `freshness`: `current` | `stale` |
> `not-applicable`. Every `known` row was sampled at the cut
> (2026-11-16, `main` = `1b17682f`, worktree `feat-591-skill-discovery`) with the
> command or the source path in its `source` cell. No claim about `node`, `bun`,
> `git`, `npx` or this repository's gates rests on model memory: each was
> executed or read in the version the tree pins before it guided code.

## Ledger

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | known | The seven checks are code with a fixed id set, a fixed name set, a fixed report block and a fixed exit contract (`0` PASS, `1` FAIL, `2` usage); the shapes are `SL-01`…`SL-07` and a *declared machine marker* (`<!-- ns:field -->`) is the one HTML-comment shape the screen allows | `sed -n '46,79p' scripts/skill-lint.mjs` (the `CHECKS` array and `COMMENT_MARKER`); `bun scripts/skill-lint.mjs` → exit 0, `skill-lint — 103 file(s) · 7 check(s)`, `0 finding(s)`, `verdict: PASS` | current | O1, O4, O5 |
| PE-002 | known | A root `scripts/*.mjs` importing a crate module is this repository's established direction, not a new coupling: 37 root scripts already do it, so moving the seven patterns into `packages/agentic-workflow/src/` keeps `scripts/skill-lint.mjs` importable without a build step | `rg -l 'from "\.\./packages/agentic-workflow/src' scripts/*.mjs \| wc -l` → `37` | current | O1 |
| PE-003 | known | The crate README is the command surface's owner **under test**: the suite asserts the README's `usage: agentic-workflow <…>` list equals the bin's token for token, and that every dispatched token has a `\| \`<cmd>\`` Commands row — so a new subcommand lands in three places or goes red | `packages/agentic-workflow/test/cli.surface.test.mjs:27-42` | current | O10 |
| PE-004 | known | The runner half dispatches through one closed table (`RUNNER_COMMANDS` in `src/runner/cli.mjs`), and the bin's `default` case honours a synchronous numeric return by setting `process.exitCode`, so a `run(argv) => number` command needs no promise and no second registry | `packages/agentic-workflow/src/runner/cli.mjs:29-46`; `packages/agentic-workflow/bin/agentic-workflow.mjs:1768-1774` | current | O10 |
| PE-005 | known | The crate's suite runs `test/*.test.mjs` after rebuilding the schema package's `dist/`, so a new `skills.*.test.mjs` is discovered by the existing script with no manifest edit | `packages/agentic-workflow/package.json` `scripts.test` → `bun run --cwd ../agentic-workflow-schema build && bun test --timeout=30000 test/` | current | O1, O3, O6, O7, O8, O9 |
| PE-006 | known | The guide's `machineLines` is an **exact** pin, and the `documents` section has no emitter — the `budgets` CLI refuses/re-bases route-shaped ceilings only — so a `normative-surfaces@1` row addition is a hand re-pin whose reason must be recorded in the manifest's `sources` | `docs/workflow/SKILL_CONTEXT_BUDGETS.json` (`documents.files["AGENTS.md"].machineLines: 150`, `linesMax: 713`, its own `sources` rows naming the absence of an emitter); `rg -n "routeEstimateMax\|machineLines" packages/agentic-workflow/src/edit/Budgets.mjs` → only the route-shaped pair is read | current | O12 |
| PE-007 | known | The drift gate resolves a `schema-export:NAME` row by parsing that const out of the file named in the row's `file` cell, and a `block:` row iff the named file publishes a fenced block whose first line is the marker — the two mechanisms this unit's rows rely on | `scripts/normative-drift.test.mjs:330-360` (versioned block), `:417-437` (schema-export branch); existing rows `doctor-install-route-vocabulary` (crate `src/doctor/vocabulary.mjs`) and `quality-metrics-fields` (crate README block) in `AGENTS.md` | current | O12 |
| PE-008 | known | Row 591 already exists in the roadmap as `idea` with its issue link, so this unit moves a status cell rather than adding a row — and a feature row's summary cell is emitted from the unit doc's `roadmap_summary:` | `docs/ROADMAP.md:177`; `docs/generated/units.md` (the projection's unit rows) | current | O13 |
| PE-009 | known | The template guide carries **no** "Optional review extras" note today (`rg` finds it only in `skills/init-workspace`, `skills/product-audit` and this repository's own guide), so registration must create the note and its block when absent, and the template seeds it for a new project | `rg -c "Optional review extras" template/AGENTS.md` → no match (exit 1); `rg -n "Optional review extras" skills/init-workspace/references/BOOTSTRAP_WRITE.md` → step 15 | current | O8, O11 |
| PE-010 | known | The distribution form this repository documents is `npx skills add gtrabanco/agentic-workflow`: a source token, with no verified version-suffix syntax here. The screen therefore emits exactly `npx skills add <source>` and carries the pin as its own envelope cell, inventing no `@<version>` grammar | `rg -n "npx skills add" README.md` → lines 21 and 256 | current | O6 |
| PE-011 | known | The crate's file-service precedent for a consented single-document writer is `charter land`: `readFileSync` → transform → `writeFileSync`, the date taken from the payload rather than a clock, and every refusal raised **before** the first byte moves | `packages/agentic-workflow/src/charter/interview.mjs:1-30` (the header contract), `:403-418` (`land`) | current | O8, O9, O14 |
| PE-012 | known | Every mutating case in this crate runs on a `mkdtemp` fixture rather than the live tree, and the suites strip `GIT_*` location variables before spawning git — the guard this unit's writer path follows | `packages/agentic-workflow/test/fixtures.mjs:20-44` (`GIT_CONFIG`, `GIT_LOCATION_VARS`); `packages/agentic-workflow/test/quality-metrics.cli.test.mjs` (the `mkdtemp` + `--repo` pattern) | current | O14 |

## Verification

- Every `known` row was sampled on 2026-11-16 in this worktree; the two rows that
  cite a repository file name the path and the line span read.
- No row is `assumption` or `unknown`: the two things this unit could have
  guessed — a version-suffix install syntax (PE-010) and the `documents` budget's
  emitter (PE-006) — are recorded as what the tree actually does, and the design
  avoids the unverified shape instead of asserting it.
