# 603 — external verify receipt

First receipt for this unit (no prior `EXTERNAL VERIFY` block existed in this
unit dir), so this is the full verdict, once. Read-only run: no commit, no
push, no branch, no forge call; the corrections belong to `/aw-local-apply`.

```text
EXTERNAL VERIFY — base: 7c395d880650bf50aca3a71c18487a3cec17718c · head: b8bfeecd2260ae6aed4250ada387a611238d1f3f
Blockers: 8 — B1 docs/features/603-self-documenting-cli/planning-obligations.md:17 (O5) + SPEC.md:40/70 (S2/AC-S2) · B2 skills/self-documenting-cli/SKILL.md:29 + packages/agentic-workflow/src/runner/help.mjs:518,472 (S1/AC-S1b) · B3 docs/workflow/PORTABLE_PROMPT.md:5 (sibling) · B4 .claude-plugin/plugin.json:45 (convention + SPEC Impact) · B5 scripts/forge-read-drift.test.mjs F1 + scripts/reading-coverage.test.mjs:150 + scripts/review-loop-discipline.test.mjs:364 (root suite, AC-S8b) · B6 docs/features/603-self-documenting-cli/planning-obligations.md:23 (O11) · B7 docs/features/603-self-documenting-cli/planning-obligations.md:14 (O2) + SPEC.md:37 (S1) · B8 packages/agentic-workflow/bin/agentic-workflow.mjs:686-697 (help <sub> --json silently ignored) — reproducers and base-vs-head evidence per blocker below
Advisories: 7 — A1 SPEC.md:241 (P8 frozen validator string now observes 4, not 3) · A2 planning-obligations.md:14,16,19 (O1/O3/O8 evidence columns name suite cases that do not exist) · A3 packages/agentic-workflow/test/cli.surface.test.mjs:96-103 (parity guard never reads the dispatch registry; state correct today) · A4 scripts/roadmap-settle.test.mjs:78 live drift (pre-existing at base) · A5 scripts/unit-doc-contract.test.mjs:442 (pre-existing at base) · A6 environment artifacts of this worktree's hoisted install (workflow-status-sensor, doc-discipline, runner.distribution — identical at base, repaired) · A7 SPEC.md P6/Impact predicted a budget row for the new skill; none exists and the gate is green
Sibling sweep: docs/workflow/PORTABLE_PROMPT.md:5 — "14 user-facing skills + 15 internal steps" asserts the pre-change count (tree now 16 internal per `bun scripts/skill-surface-counts.mjs`); every other surviving mention checked (README, REPLICATE, SKILLS.md, generated projection, old usage literal, skills.sh.json, historical testing.md records) is either updated, consistent with the base's own pattern, or a dated record — the one live lie is PORTABLE_PROMPT (B3)
Completeness: resolved: S3, S4 (disposition: known-issues + O9 direct-import), S5 (disposition: known-issues verdict + 17 table rows ≥ 5, dated), S6 (measurement reproduces exactly: help index 8,958 B, README 132,054 B; validator-string drift → A1), S7 (cli.surface 10/10) | open ids: S1 (B2, B7, B8), S2 (B1), S8/AC-S8b (B5, B6); ledger rows open: O2 (B7), O5 (B1), O11 (B6)
Spot check: bun test packages/agentic-workflow/test/cli.surface.test.mjs → match (10 pass, 0 fail — equals recorded G1; cross-checked cli.help 9/9 = E5, check-skill-context PASS 31 skills = G4, normative-drift 24 pass = G5)
Verdict: NEEDS-DECISION (B1, B2, B3, B4, B5, B6, B7, B8)
```

Dated: 2026-11-23. Base materialized once in `mktemp -d` scratch
(`/tmp/aw603-base-UnsiuR`, removed after the run); every base-side claim below
was executed against `7c395d880` in that scratch.

## Blockers

**B1 — S2/AC-S2/O5: the failure feedback was not delivered for `config` and
`doc`, and AC-S2's required suite cases for those families do not exist.**
`planning-obligations.md:17` (O5) records `verified` with evidence "one case
per family"; `SPEC.md:40` (S2) names "config ops, doc ops" explicitly;
`SPEC.md:70` (AC-S2) requires suite cases per family
(`ceremony`, `config`, `doc`, `journal`, the bin).
Reproducers (head): `bun packages/agentic-workflow/bin/agentic-workflow.mjs
config bogus-op` → single line `CONFIG REFUSAL — unknown config operation
"bogus-op"`, exit 2, no candidates, no `help` pointer; `… doc --bogus` → the
usage line only, exit 1, no pointer. Suite: `rg 'config.*bogus|doc --bogus'
packages/agentic-workflow/test/cli.help.test.mjs` → no match (the suite has
ceremony ×2, journal, and the bin's closed world — no config, no doc).
Base-vs-head: both outputs are byte-identical at `7c395d880` (scratch) — the
promise is new, the delivery is not. Smallest action: add the pointer (and the
candidates where the registry is closed) to the `config`/`doc` usage-failure
paths, or re-scope S2/AC-S2/O5 to the families actually delivered and record
the narrowing as a dated decision in the unit doc.

**B2 — S1/AC-S1b: "`--help`/`-h` on every subcommand, one implementation, the
identical block" is false as shipped.**
`SKILL.md:29` (conduct rule) and `help.mjs:518` (index) and `help.mjs:472`
(docstring "the same bytes whichever door") all assert the universal claim;
`SPEC.md:67` (AC-S1b) scopes the proof to a suite case over three names only.
Reproducer (head): `… workflow-status -h` → exit 1, `unknown flag: -h` (while
`workflow-status --help` prints its own block); byte sweep over all 73
subcommands: `help <sub>` differs from `<sub> --help`/`-h` on `unit-route`,
`workflow-status`, `quality-metrics`, and `help` itself (4/73), and `-h` hard
fails on `workflow-status`. Base-vs-head: the behavior is identical at
`7c395d880`, but the base made no such claim (`help` did not exist); the
claim text is this change's. The three-subcommand carve-out is recorded in
`.changeset/603-self-documenting-cli.md` but nowhere in the unit doc, and the
`-h` failure is recorded nowhere. Smallest action: qualify the three claim
surfaces to the recorded carve-out, and either make `-h` answer on
`workflow-status` or record the exception in the unit doc.

**B3 — sibling sweep (F51/F53 class): `docs/workflow/PORTABLE_PROMPT.md:5`
still asserts "14 user-facing skills + 15 internal steps".** The tree now
carries 16 workflow internals (`bun scripts/skill-surface-counts.mjs` →
`count:workflow-internals 16`); README and REPLICATE were updated by this
change, the portable prompt was not. Base-vs-head: the sentence was correct at
`7c395d880` (15 internals) and is wrong at head — change-caused. Smallest
action: update the count in that one line.

**B4 — `.claude-plugin/plugin.json:45`: the skills array is no longer
alphabetical.** `./skills/self-documenting-cli` sits before
`./skills/runner-contract`; `sort -c` over the array fails at
`./skills/runner-contract`. Base-vs-head: the base array is sorted
(`sort -c` clean), head is not; AGENTS.md § Conventions pins machine surfaces
to alphabetical, and SPEC.md's Impact claims "alphabetical insertion of the new
skill". No gate catches it (skill-lint passes; its order rule scopes to
`user-invocable: true`). Smallest action: move the line below
`./skills/runner-contract`.

**B5 — the root suite is red at head with three change-caused suites**
(`node scripts/run-root-suite.mjs` → exit 1; failing:
`forge-read-drift`, `reading-coverage`, `review-loop-discipline`, plus two
pre-existing advisories A4/A5). Base-vs-head: all three pass at `7c395d880`
(9/9, 6/6, and the suite's own PASS line respectively).
- `scripts/forge-read-drift.test.mjs` F1 → `skills/self-documenting-cli/references/forge.md:26`
  `transport-leak`: shipped prose names `gh api`; the rule (S2, AC6) is that the
  transport lives in the crate and the skill cites `runner`.
  Smallest action: reword the recipe to the sanctioned citation form.
- `scripts/reading-coverage.test.mjs:150` → seven `unrowed` files:
  `skills/self-documenting-cli/SKILL.md` + its six `references/*.md`.
  Smallest action: add the seven rows to the `reading-coverage@1` block in
  `docs/fix/646-docs-skills-reconciliation/second-read.md`.
- `scripts/review-loop-discipline.test.mjs:364` →
  `self-documenting-cli carries the train version (D-40-14): '4.10.1' !== '4.10.0'`
  — the new skill's frontmatter `version: 4.10.1` (`SKILL.md:4`) mismatches the
  train anchor (`packages/pi-agentic-workflow/package.json` → 4.10.0) every
  skill is pinned to. Smallest action: stamp `version: 4.10.0` on the new
  skill (the release stamp moves the whole train later).

**B6 — O11 (`planning-obligations.md:23`) is `verified` while its validator
and its own claim are red.** Reproducer: `bun scripts/local-gate.mjs` → exit 1
`FAILED at workspace-install` — at head **and** at base (both executed;
base fails at the identical step, so the cause — the pi package's published
`4.10.0` pin breaking `prepare` — is pre-existing and matches G7). The row's
affected-use-case ("the gates stay green: root suite, crate suite, …") does not
reproduce: the root suite is red (B5, three of them change-caused — it was
never run or recorded in the unit's `## Log` at all), and the crate suite's
recorded G6 1-fail was an environment artifact (missing package-level
`node_modules`, identical at base) that a faithful env repair turns into
80/0 PASS. The row's required evidence — "a `G` line with the gate's verdict
line" — the only gate verdict lines recorded (G6, G7) are failures.
Smallest action: re-triage O11/AC-S8b to record the true gate state, or land
B5's repairs and re-run the gate before closing the row.

**B7 — O2 (`planning-obligations.md:14`) and S1's "the same registry the
dispatch reads (src/runner/cli.mjs) — one implementation" do not hold.**
`src/runner/help.mjs` is a parallel registry: it imports nothing from the
dispatch (`rg HELP_REGISTRY packages/agentic-workflow/src/runner/ceremony/
packages/agentic-workflow/src/runner/cli.mjs` → no matches), and the ceremony
object vocabulary now exists as two literals — `CEREMONY_OBJECTS` in
`ceremony/index.mjs:56` and the 18-name `ops` array in `help.mjs:60` — while
the per-object `fail("unknown-op", { ops: […] })` arrays stay at their
callsites (SPEC's Retirements/Impact said they would be "moved into the one
registry as data"; they were copied, not moved). O2's required evidence — "a
case asserting `ceremony`'s op list is read from it, not from a literal" —
exists nowhere (`rg CEREMONY_OBJECTS packages/agentic-workflow/test/` → no
matches). Base-vs-head: at base there was one object list; the duplication is
change-caused. Today the two lists agree (verified live: `ceremony` with no
args prints the same 18 objects the help row shows), so there is no live
divergence — the defect is the claim and the missing guard. Smallest action:
import the dispatch's registries into `help.mjs` (or add a suite case binding
help rows to `CEREMONY_OBJECTS`/`RUNNER_COMMANDS`/the switch arms), and
re-word S1/O2 to what the bytes do.

**B8 — `help <sub> --json` silently ignores an explicit option with success.**
`bin/agentic-workflow.mjs:686-697`: `--json` is honored only when no target is
present (`wantsJson && !target`). Reproducer (head): `… help ceremony --json`
and `… help --json ceremony` both print the prose block and exit 0. S1's own
grammar (`SPEC.md:37`) declares `agentic-workflow help [subcommand] [--json]`.
Base-vs-head: `help` did not exist at `7c395d880`, so the ignored option is
change-caused; no suite case covers the combination. Smallest action: render
the single-entry envelope for `help <sub> --json` (or refuse the combination
non-zero), and add the case.

## Advisories

- **A1** `SPEC.md:241` — P8's frozen validator string is
  `rg -c 'roadmap row reconcile' … matches 3`; it now observes **4** (the
  delivered measurement table added the phrase). The substance of S6
  reproduces exactly; the frozen expectation text drifted with its own
  deliverable (P10's row writes `matches ≥ 5`, so the `3` reads as equality).
- **A2** `planning-obligations.md:14,16,19` — O1's evidence names a suite case
  "that enumerates both dispatch lists" (the suite enumerates the usage-token
  list instead; the state is correct — 73 rows = 27 case arms + 45
  `RUNNER_COMMANDS` keys + `help`, verified independently); O3's evidence names
  a `delete-section` case the suite does not contain (behavior verified
  live); O8's evidence names "the budget row" that was never written (defaults
  cover the skill, gate green).
- **A3** `cli.surface.test.mjs:96-103` — the fail-closed injection case
  re-implements the filter over a copy of the usage tokens; no parity case
  reads `RUNNER_COMMANDS` or the bin's `case` arms, so S7's "registry" edge is
  not actually exercised (state correct today; B7 names the guard gap).
- **A4** `scripts/roadmap-settle.test.mjs:78` — live-tree violation
  `docs/features/98-deterministic-tool-doctor/SPEC.md:1 slug-mismatch` fails
  **identically at base** (268 docs there, 269 at head — the 603 row itself
  settles clean); pre-existing drift on another unit's row.
- **A5** `scripts/unit-doc-contract.test.mjs:442` — `4.10.0 !== 4.10.1`
  (schema package behind the crate train) fails **identically at base**;
  pre-existing version-parity debt.
- **A6** environment: this worktree runs the hoisted linker (E3), which leaves
  `packages/agentic-workflow/node_modules` absent — that artifact alone made
  `workflow-status-sensor` (ENOENT), `doc-discipline` (grep on a symlinked
  path) and `runner.distribution` (shipped-copy) fail here **and at base**; it
  was repaired (a real, gitignored directory of symlinks to the root graph)
  and all three then pass at head (crate suite 80/0). Running the declared
  `bun scripts/local-gate.mjs` executed its pre-existing `workspace-install`
  step, which emptied `node_modules` (default isolated linker, aborting at the
  pi `prepare` script); restored with the documented
  `bun install --ignore-scripts --linker=hoisted`. Tracked files were never
  modified by any of this (`git status` clean at the end of the run).
- **A7** `SPEC.md` P6/Impact — "its budget row in
  `docs/workflow/SKILL_CONTEXT_BUDGETS.json`" was predicted; no row exists,
  the skill measures under the default ceiling, and
  `bun scripts/check-skill-context.mjs` is green (31 skills) — so PE-008's
  "needs its row or the gate is red" claim is also contradicted by the run.

## What was verified green (command → observed)

- `bun test packages/agentic-workflow/test/cli.help.test.mjs` → 9 pass 0 fail (E5).
- `bun test packages/agentic-workflow/test/cli.surface.test.mjs` → 10 pass 0 fail (G1).
- `bun test packages/agentic-workflow/test/runner.dispatch.test.mjs` → 7 pass 0 fail (G2); assertions untouched by the diff.
- `bun test packages/agentic-workflow/test/self-documenting-cli.skill.test.mjs` → 7 pass 0 fail (G3).
- `bun scripts/check-skill-context.mjs` → PASS 31 skills; `--documents` → PASS 7 documents (G4).
- `bun test packages/agentic-workflow/test/skills.discovery.test.mjs` → 16 pass 0 fail.
- `bun test scripts/normative-drift.test.mjs` → 24 pass 0 fail at head (base: 20 pass **4 fail** — this change fixes base's drift red).
- `bun … phase-lint docs/features/603-self-documenting-cli/SPEC.md` → verdict PASS (O12).
- `bun packages/agentic-workflow/bin/agentic-workflow.mjs docs-generate --check` → verdict PASS (projection in sync).
- `bun scripts/skill-lint.mjs` → PASS, 0 findings.
- Crate suite `bun scripts/run-root-suite.mjs --dir packages/agentic-workflow/test` → **80 PASS 0 FAIL** after the env repair (G6's 1-fail was A6's artifact, identical at base).
- Pi S4 property by direct import → `tools: 6 all deferred: true families: true help ptr: true` (O9); `bun run test` in `packages/pi-agentic-workflow` fails at `bundle:skills` with the recorded projection hash-mismatch **identically at base** (known-issues' claim confirmed).
- Success-receipt differential (O6/AC-S2c): 15 read-only invocations run at base and head, paths normalized → 13 byte-identical on stdout+stderr+exit; `memory probe` differs only by its per-run instance-id and feedback timing, `doctor` only because a scratch clone carries neither the installed pre-push hook nor the armed merge drivers (environment, verified against the live worktree). Zero exit codes moved; zero success receipts changed.
- Enumerations: usage line = 73 = 27 case arms + 45 `RUNNER_COMMANDS` keys + `help`; `HELP_NAMES` = 73, equal both ways; `help` output contains every name; `--help`/`-h`/`help <sub>` byte-identical on 69 of 73 (B2 lists the four).
- `.changeset/603-self-documenting-cli.md` exists and matches the delivered intent (including the recorded three-subcommand help carve-out).

Corrections for the blockers above belong to `/aw-local-apply` (one batch →
one blockers-only recheck → a second only if the same blocker persists →
`Needs your decision`).
