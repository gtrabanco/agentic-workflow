---
type: feature
scope: large
roadmap_summary: Issue [#553](https://github.com/gtrabanco/agentic-workflow/issues/553) (M) — migrate every `scripts/*.mjs` a shipped skill cites into the universal CLI, re-point the citations to the symbolic `runner <sub>` form, close the `template/AGENTS.md` self-contradiction, and leave zero `bun scripts/` citations outside `metadata.internal` skills. The deferred half of #424. Owner decision 2026-11-14.
---

# 553 — universal-cli-coverage

> One-line: migrate every script a shipped skill tells a target agent to run into the universal CLI, so no shipping skill cites `bun scripts/*.mjs` and a target project never needs a `scripts/` tree.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

```text
retention-declaration@1
path | disposition
TASKS.md | trimmable · legacy carrier
PLAN.md | trimmable
progress.md | trimmable · legacy carrier
ACCEPTANCE.md | trimmable · legacy carrier
testing.md | trimmable
CHECKLIST.md | trimmable
BRIEF.md | trimmable
pr-body.md | trimmable
external-verify.md | trimmable
review-findings.md | trimmable
planning-findings.md | trimmable
SPEC.md | kept
decisions.md | kept
known-issues.md | kept
planning-obligations.md | kept
planning-evidence.md | kept
architecture-notes.md | kept
sources.md | kept
research.md | kept
```

## Specs

**S1 — Migrate the target-critical scripts into the universal CLI.**
> "Migrate the target-critical scripts into the universal CLI (crate subcommands or sibling bins, the #352 pattern; MIGRATION.md's table grows), each with its tests"

**S2 — Re-point every shipped-skill citation to the pinned CLI invocation.**
> "Re-point every shipped-skill citation to the pinned invocation `bunx @gtrabanco/agentic-workflow@<pin> <sub>` (RUNNER.md's table grows; normative-drift pins it)"

**S3 — `docs-generate` becomes a CLI subcommand.**
> "docs-generate becomes a CLI subcommand so template/AGENTS.md and bootstrap cite a command that exists"

**S4 — Decide test-impact's seam.**
> "Decide test-impact's seam: CLI subcommand (portable tier in the crate) or a declared project seam with explicit skill prose"

**S5 — session-close becomes programmatically reachable.**
> "session-close becomes reachable programmatically so pi stops degrading to writer: \"absent\" in targets"

**S6 — Repo-authoring four stay in scripts/ but citations in shipped skill prose are reworded.**
> "The repo-authoring four stay in `scripts/`, but their citations in **shipped** skill prose are reworded so no shipped skill tells a target agent to run `bun scripts/*.mjs`"

**S7 — End state verifiable: grep skills/ for script citations.**
> "End state verifiable: `rg -n \"bun scripts/|node scripts/\" skills/` → 0 matches outside explicitly repo-internal (`metadata.internal`) skills"

**S8 — The migrated subcommand arrives with its carrier.**
> "**the migrated subcommand arrives with its carrier** — one `local-gate` step (or one live full-sweep assertion in its sibling suite) so a red budget cannot merge again. Migrating the command without a caller only relocates the hole."

```text
spec-requirement@1
kind | shape | what it orders
requirement | **S<n>[a-z]? — <title>.** | one requirement; the id is what a task links and a finding cites
quote | > <the requester's words, verbatim> | the requirement's own text, unedited apart from a marked elision
correction | **S<n><letter> — <title>.** | an appended amendment to requirement S<n>; never an edit of it
```

## Acceptance criteria

One criterion per `S#`, each naming the check that proves it. Frozen at cut; the
review's per-criterion coverage table dismantles this section, so a criterion
without a check that can fail is a defect here, not a finding later.

- **AC1 (S1)** — every `scripts/*.mjs` cited by a shipped skill resolves to a router subcommand that runs its module, and the module's own sibling suite still passes unmodified against the `scripts/` shim. Proven by `bun test scripts/cli-coverage.test.mjs` (router row + RUNNER row + README row per migrated command) and by each family's `bun test scripts/<cmd>.test.mjs`.
- **AC2 (S2)** — every shipped-skill executable step cites the symbolic form `runner <subcommand>`, never a launcher and never a version. Proven by `bun test scripts/cli-coverage.test.mjs` (`no-script-citation`, `no-launcher-in-skill`, `no-pin-in-skill` findings = 0).
- **AC3 (S3)** — `runner docs-generate` is a subcommand, and `template/AGENTS.md` and the bootstrap prose call it. Proven by the same suite's `template-script-citation` finding = 0 plus a scratch-scaffold run of `docs-generate --check` exiting 0.
- **AC4 (S4)** — `test-impact` is decided as a CLI subcommand, its prose stops promising a project-local script ("this repository ships one"), and `TEST_IMPACT.md` names the command. Proven by `rg -c 'this repository ships one' skills/` printing `0` and by `scripts/test-impact.test.mjs` exiting 0.
- **AC5 (S5)** — pi resolves the writer through the CLI, so a target that installed the package answers `writer: "cli"` instead of `writer: "absent"`. Proven by `bun run --cwd packages/pi-agentic-workflow test` exiting 0 with the CLI-present case green.
- **AC6 (S6)** — no shipped skill names `skill-lint`, `release`, `version-parity-gate` or `lint-changeset` in its prose; those four stay repo-side. Proven by the coverage suite's `repo-authoring-citation` finding = 0.
- **AC7 (S7)** — `rg -n "bun scripts/|node scripts/" skills/` returns matches only inside `metadata.internal` skills. Proven by the coverage suite's scan (it excludes `metadata.internal: true` skills and asserts the rest are empty).
- **AC8 (S8)** — `check-skill-context` ships as `runner skill-context` **and** a `local-gate` step runs the live sweep. Proven by the new step id in `scripts/local-gate.mjs` (pinned by `scripts/release-workflows.test.mjs`) and by that step's command exiting 0.

## Impact

- **What consumes this unit's deliverables.** Every shipped skill that runs a
  deterministic step (`unit-lane`, `execute-phase`, `review-change`, `audit-pr`,
  `audit-docs`, `product-audit`, `fold-findings`, `log-session`,
  `init-workspace`, `discover-repository-state`, `resolve-repository-state`,
  `triage-issue`, `batch-scheduler`, `review-verify`, `review-implementation`,
  `review-security`, `orchestration-envelope`): their executable steps stop
  naming a repository path and start naming the runner. The pi package's session
  handler (`packages/pi-agentic-workflow/src/log-session-invocation.ts`) stops
  degrading to `writer: "absent"`. The scaffold (`template/AGENTS.md`) stops
  citing a script tree it does not ship.
- **What this unit consumes.** `RUNNER.md`'s closed candidate set and symbolic
  citation (issue #555, block `runner-pin@1` / `runner-set@1`), the crate's
  router (`bin/agentic-workflow.mjs`), and each script's own sibling suite as
  the parity net.
- **What stops being true.** The claim that a deterministic step needs the
  project's own `scripts/` tree. The claim that a skill citation names a file
  instead of a command. `TEST_IMPACT.md`'s "the project's hint… this repository
  ships one" wording. `TURN_CONTRACT.md` teaching `bun scripts/x.mjs <unit-dir>`
  as the shape of a box that runs a command. The pi handler's `WRITER_SCRIPT`
  constant as the only resolution path.
- **What must be asked before touching.** The scripts are this repository's own
  gate carriers (`local-gate` steps, `run-root-suite` entries): a migration may
  not change their behaviour, so the shim keeps argv, exit code and bytes
  identical and every sibling suite runs unmodified — a suite that has to change
  to keep passing is a behaviour change and is a different unit.

## Surfaces

- `packages/agentic-workflow`
- `packages/pi-agentic-workflow`
- `skills`
- `scripts`
- `template`
- `docs`

## Retirements

The migration retires **the skill-visible script path**, not the scripts: each
migrated `scripts/<x>.mjs` becomes a zero-logic shim (resolve the module, forward
argv and the exit code) exactly as `scripts/relay-packet.mjs` already does over
`src/relay/Packet.mjs`, because the repository's own gate and suites are its
callers. No `scripts/` file loses an exported symbol (`export *` keeps every
test-imported binding), and no entry leaves `run-root-suite`.

Retired outright:

| Surface | Consumer evidence |
|---|---|
| `TEST_IMPACT.md`'s project-local-script promise | `rg -c 'this repository ships one' skills/` → currently `1`; after this unit `0` |
| `template/AGENTS.md:117`'s `bun scripts/docs-generate.mjs` | `rg -c 'bun scripts/' template/` → currently `1`; after this unit `0` |
| `TURN_CONTRACT.md`'s placeholder shape for a box that runs a command | `rg -c "bun scripts/x" skills/` → currently `1`; after this unit `0` |
| pi's `WRITER_SCRIPT = "scripts/session-close.mjs"`-only resolution | `packages/pi-agentic-workflow/src/log-session-invocation.ts:46`; the CLI route replaces it, and the repo-script route stays as the fallback for an authoring checkout |

## Non-goals

- A `template/scripts/` folder — explicitly rejected by the owner; the CLI is the distribution.
- The repository's own gate suite moving into the crate (`MIGRATION.md`: "they gate this repository and never ship").
- Programmatic runner detection (`bunx`/`npx`/`pnpm dlx` resolution) — delivered by #555, consumed here, never reopened.
- A new `help` surface for the CLI — #603's unit, not this one.

## Risk tier

- **Tier** — `standard` · **Task Size** — `standard`
- **Named high-risk item** — `none — not a high-tier unit`

## Future

none

## Future cost

- A new deterministic step is born as a CLI subcommand: the authoring rule lands
  in `docs/workflow/CLI.md` and `SKILL_AUTHORING.md`, and the coverage suite
  refuses a shipped `bun scripts/` citation, so the hole cannot reopen quietly.
- The crate's router is a hand-written `switch`: every new subcommand touches one
  shared file. #603 replaces it with a registry and parity-pins the three
  surfaces (router, usage string, README); until then a new command is three
  edits and the coverage suite is what keeps them together.

## Applicable tests

- `scripts/cli-coverage.test.mjs` — the unit's own corpus: citation scan, router
  coverage, documentation rows, repo-only exemptions (new).
- Every migrated command's sibling suite under `scripts/<cmd>.test.mjs` —
  unmodified, run against the shim; they are the parity net.
- `packages/agentic-workflow/test/cli.surface.test.mjs` — the crate's own usage
  surface grows with each subcommand.
- `packages/pi-agentic-workflow/test/log-session-invocation.test.mjs` — the
  writer resolution (S5).
- `scripts/release-workflows.test.mjs` — the `local-gate` step-id set (S8).
- `scripts/run-root-suite.mjs`, `bun run --cwd packages/agentic-workflow test`,
  `bun scripts/check-skill-context.mjs`, `bun scripts/normative-drift.test.mjs`,
  `bun scripts/docs-generate.mjs --check`.

## Known pre-existing issues

- `scripts/check-skill-context.mjs` has no gate caller (the issue's own finding,
  #553 comment 2026-11-15) — **affects** this unit: S8 is its carrier.
- The roadmap row and `docs/generated/units.md` are stale the moment this unit
  doc lands (`bun scripts/docs-generate.mjs --check` exits 1, naming both) —
  **does not affect** delivery: the row and the projection are the emitter's to
  write (P9), never hand-edited.
- `docs/features/553-universal-cli/` carried a draft SPEC at a folder name the
  roadmap row does not link (`553-universal-cli-coverage`). **Affects** this
  unit: the folder moves to the linked name in P1, and the draft's invented
  sections (three internal CLI-maintenance skills the issue never asked for) are
  dropped rather than carried.

## Tasks

- P1 — Land the unit's own corpus as a red suite: `scripts/cli-coverage.test.mjs` derives the cited-script set from `skills/`, exempts `metadata.internal` skills, and refuses a citation whose command has no router case, RUNNER row and README row; it also refuses a shipped skill naming a launcher, a pin, a repo-authoring script or the placeholder. (validator: `bun test scripts/cli-coverage.test.mjs` exits 1 at cut, naming the unmigrated commands) (Implements: S1, S2, S6, S7)
  - Relevant files: scripts/cli-coverage.test.mjs, skills/, packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/README.md, skills/runner-contract/references/RUNNER.md
- P2 — Write the pattern down: `docs/workflow/CLI.md` (why the CLI is the distribution, the router, how to add a subcommand, how to migrate a script red-first, how a skill cites it) and the `SKILL_AUTHORING.md` rule that a runtime command is a subcommand, never a script. (validator: `rg -c 'runner <subcommand>' docs/workflow/CLI.md` prints a positive count and `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/features/553-universal-cli-coverage/SPEC.md` exits 0) (Implements: S1, S2)
  - Relevant files: docs/workflow/CLI.md, docs/workflow/SKILL_AUTHORING.md, docs/workflow/README.md
- P3 — Migrate the lane/docs family and re-point its citations: `relevant-files`, `roadmap-settle`, `docs-generate`, `docs-generated-merge`, `shared-merge`, `test-impact`, `session-close`. (validator: `bun test scripts/relevant-files.test.mjs scripts/roadmap-settle.test.mjs scripts/docs-generate.test.mjs scripts/docs-generated-merge.test.mjs scripts/shared-doc-merge.test.mjs scripts/test-impact.test.mjs scripts/session-close.test.mjs` exits 0) (Implements: S1, S2, S3, S4, S5)
  - Relevant files: packages/agentic-workflow/src/{relevant-files,roadmap-settle,docs-generate,docs-generated-merge,shared-merge,test-impact,session-close,}/, packages/agentic-workflow/bin/agentic-workflow.mjs, scripts/{relevant-files,roadmap-settle,docs-generate,docs-generated-merge,shared-doc-merge,test-impact,session-close}.mjs, skills/
- P4 — Migrate the receipts family and re-point its citations: `review-receipt`, `gate-receipt`, `correction-budget`, `differential-baseline`, `review-state`, `scope-manifest`, `adversarial-verdict`. (validator: `bun test scripts/review-receipt.test.mjs scripts/gate-receipt.test.mjs scripts/correction-budget.test.mjs scripts/differential-baseline.test.mjs scripts/review-state.test.mjs scripts/scope-manifest.test.mjs scripts/adversarial-verdict.test.mjs` exits 0) (Implements: S1, S2)
  - Relevant files: packages/agentic-workflow/src/{review-receipt,gate-receipt,correction-budget,differential-baseline,review-state,scope-manifest,adversarial-verdict}/, packages/agentic-workflow/bin/agentic-workflow.mjs, scripts/, skills/
- P5 — Migrate the audit and lane-graph family and re-point its citations: `audit-pr-gate`, `dependency-advisory-pass`, `unit-lineage`, `batch-scheduler`, `promise-coherence`. (validator: `bun test scripts/audit-pr-gate.test.mjs scripts/dependency-advisory-pass.test.mjs scripts/unit-lineage.test.mjs scripts/batch-scheduler.test.mjs scripts/promise-coherence.test.mjs` exits 0) (Implements: S1, S2)
  - Relevant files: packages/agentic-workflow/src/{audit-pr-gate,dependency-advisory-pass,unit-lineage,batch-scheduler,promise-coherence}/, packages/agentic-workflow/bin/agentic-workflow.mjs, scripts/, skills/
- P6 — Migrate the product-audit family and re-point its citations: `coverage-gap`, `decision-promotion`, `dimension-regression`, `journal-corpus`, `restatement-sweep`, `retention-debt`, `repository-state`, `test-obligation-tags`, each carrying its seeded fixture as a `--fixture <dir>` mode so no shipped skill names a fixture script. (validator: `bun test scripts/coverage-gap.test.mjs scripts/decision-promotion.test.mjs scripts/dimension-regression.test.mjs scripts/journal-corpus.test.mjs scripts/restatement-sweep.test.mjs scripts/retention-debt.test.mjs scripts/repository-state.test.mjs scripts/test-obligation-tags.test.mjs` exits 0) (Implements: S1, S2)
  - Relevant files: packages/agentic-workflow/src/{coverage-gap,decision-promotion,dimension-regression,journal-corpus,restatement-sweep,retention-debt,repository-state,test-obligation-tags}/, packages/agentic-workflow/bin/agentic-workflow.mjs, scripts/, skills/product-audit/
- P7 — Migrate the platform family and give `check-skill-context` its carrier: `skill-context`, `setup-env`, `test-route`, plus the `local-gate` step that runs the live sweep. (validator: `bun test scripts/check-skill-context.test.mjs scripts/setup-env.test.mjs scripts/test-route.test.mjs scripts/release-workflows.test.mjs` exits 0 and `bun packages/agentic-workflow/bin/agentic-workflow.mjs skill-context` exits 0) (Implements: S1, S2, S8)
  - Relevant files: packages/agentic-workflow/src/{skill-context,setup-env,test-route}/, packages/agentic-workflow/bin/agentic-workflow.mjs, scripts/local-gate.mjs, scripts/release-workflows.test.mjs, scripts/{check-skill-context,setup-env,test-route}.mjs
- P8 — Sweep the citations the script migrations do not own: `template/AGENTS.md`, `skills/orchestration-envelope/references/TURN_CONTRACT.md`'s placeholder, `TEST_IMPACT.md`'s seam prose, and every remaining shipped `bun scripts/` reference, each to the symbolic form. (validator: `bun test scripts/cli-coverage.test.mjs` exits 0) (Implements: S2, S3, S6, S7)
  - Relevant files: template/AGENTS.md, skills/, skills/execute-phase/references/TEST_IMPACT.md, skills/orchestration-envelope/references/TURN_CONTRACT.md
- P9 — Publish the surfaces: `RUNNER.md`'s subcommand table, `MIGRATION.md`'s mapping table, the crate README's `## Commands` rows, the roadmap row and the fix row through the emitters, and the session log entry. (validator: `bun scripts/docs-generate.mjs --check` exits 0 and `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap check docs/features/553-universal-cli-coverage/SPEC.md` exits 0) (Implements: S1, S2)
  - Relevant files: skills/runner-contract/references/RUNNER.md, docs/workflow/MIGRATION.md, packages/agentic-workflow/README.md, docs/ROADMAP.md, docs/LOGS.md
- P10 — Verification: the unit's corpus green, the whole gate green, the budgets inside their ceilings, the projection current, and every obligation row closed with its validator run in the foreground. (validator: `bun scripts/local-gate.mjs` exits 0) (Implements: S1, S2, S3, S4, S5, S6, S7, S8)
  - Relevant files: scripts/local-gate.mjs, docs/features/553-universal-cli-coverage/planning-obligations.md

```text
task-spec-link@1
kind | shape | what it orders
link | (Implements: S<n>, S<m>, …) | the requirements this task delivers; metadata, never task text
```

### Planning evidence

M/L unit: the ledger is the unit folder's `planning-evidence.md`.

### Obligations

M/L unit: the ledger is the unit folder's `planning-obligations.md`.

## Triaged steps

> The lane's `plan` step for a local, unpublished change is this document's own
> `## Tasks` list plus the two frozen ledgers; the runner's `unit-route --triage`
> block is not generated for this unit (the owner's local flow substitutes for
> it, and a pasted copy would be a second, drifting owner).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-14, the owner's requirement, verbatim:
  ```
  es justo lo que te pedí que no hubiera ningún script usando "bun scripts/*.mjs" en las skills, sino que todo viviera en una cli universal que se haría más tarde y ese 'más tarde' es ahora en esta issue. Pero ya pilla tarde así que crea otra issue para esto.
  ```
- **L2** — 2026-11-14, the boundary the owner stated beside it, verbatim:
  ```
  template no tiene carpeta scripts porque no lo necesita, para eso es el universal cli.
  ```
- **L3** — 2026-11-15, the carrier requirement, from the owner's #553 comment, verbatim:
  ```
  the migrated subcommand arrives with its carrier — one `local-gate` step (or one live full-sweep assertion in its sibling suite) so a red budget cannot merge again. Migrating the command without a caller only relocates the hole.
  ```
- **P1** — 2026-11-20, the unit doc and both ledgers cut before the first line of code, and the folder renamed to the roadmap row's link · `26d17a6`.
- **E1** — 2026-11-20, `bun test scripts/cli-coverage.test.mjs` · exit 1 · 4 of 6 cases red, 101 shipped-skill citations and 6 template citations named with the command each must become.
- **E2** — 2026-11-20, `bun test scripts/cli-coverage.test.mjs` · exit 0 · 6/6 green after the sweep: `no-script-citation`, `launcher`, `pin`, `repo-authoring`, `template-citation` and `undocumented-command` all empty, and the shim-parity case green.
- **P2** — 2026-11-20, `docs/workflow/CLI.md` and the authoring rule published · `fb8680d`.
- **P3..P7** — 2026-11-20, the migration in five families: lane/docs (`f7b1ed1`, `b948a5f`), receipts (`d176e4f`), audit and lane graph (`e785957`, `d8780bb`, `5ce3d7b`), product-audit and platform (`9016eaf`).
- **D16** — 2026-11-20, this repository's own gates pin a script's *bytes* as often as its behaviour: eleven suites and three gates read the source they judge, so every migration re-points them where the code now lives (`84c1a11`). Two of them gained a real contract with the move: the crate's dispatch table is pinned to the 45 commands the sweep delivers, and `BATCH_BLOCKING_LABELS` is imported from the schema package instead of restated (`vocabulary-residency@1`).
- **D17** — 2026-11-20, the pi bundle's projection rule binds the exact bytes it removes, so the re-derived digest is the rule obeyed, not silenced (`88109b7`).
- **E3** — 2026-11-20, `bun test scripts/release-workflows.test.mjs` · exit 0 · 26/26 green with the new `skill-context-budgets` step in the pinned id list.
- **E4** — 2026-11-20, `bun scripts/check-skill-context.mjs` · exit 0 · `PASS context budgets: 30 skills`; `references/RUNNER.md` was re-based twice by the manifest's own arithmetic (measured 2864, then 3628, each with its growth source).
- **E5** — 2026-11-20, `bun test scripts/normative-drift.test.mjs` · exit 0 · 23/23 green.
- **E6** — 2026-11-20, `bun scripts/docs-generate.mjs --check` · exit 0 · `Roadmap: docs/ROADMAP.md — unchanged`, `verdict: PASS`; `roadmap check` on this unit doc `verdict: PASS`, 0 violations.
- **E7** — 2026-11-20, `bun run --cwd packages/agentic-workflow test` · exit 0 · 1361 pass across 77 files.
- **E8** — 2026-11-20, `bun run --cwd packages/pi-agentic-workflow test` and `test:node` · exit 0 on both legs · 1024 tests, 1023 pass 1 skipped.
- **E9** — 2026-11-20, `bun scripts/run-root-suite.mjs` · exit 0 · 136 suites PASS.
- **G1** — 2026-11-20, `bun scripts/local-gate.mjs` · exit 0 · `local-gate: PASS — 20 step(s) in 531s` at HEAD `88109b7a8`.
- **E10** — 2026-11-20, a scratch scaffold with no `scripts/` tree: `docs-generate` wrote the projection and `docs-generate --check` then exited 0 (`Files: 3 checked · 0 missing`, `verdict: PASS`).
- **E11** — 2026-11-20, the end state the issue names: the citation scan over `skills/` matches only `skills/skill-lint/**` (the declared internal skill, 6 lines) and zero outside it; the coverage suite's `pin-in-skill` findings are empty because the pin lives in RUNNER.md's fenced `runner-pin@1` carrier (D15).
- **E12** — 2026-11-20, `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/features/553-universal-cli-coverage/SPEC.md` · exit 0 · `VERIFY PASS`, obligations closed.

## Next

P1: land `scripts/cli-coverage.test.mjs` red.

## References

- #424 (delivered the feedback channel; its Non-goals deferred exactly this adoption sweep)
- #555 (the symbolic `runner <sub>` citation and the closed candidate set this unit cites)
- #554 (the hook shims — the same one-implementation pattern applied to shell)
- #603 (the registry/help unit that replaces the hand-written router this unit extends)
- `docs/workflow/MIGRATION.md` — the boundary: runtime commands → crate; repo gates → `scripts/`
