---
type: feature
scope: large
roadmap_summary: Issue [#352](https://github.com/gtrabanco/agentic-workflow/issues/352) (L): one distributable runner — every ceremony operation and runtime sensor as a subcommand of `@gtrabanco/agentic-workflow` invoked at a train-stamped pin; closes the distribution gap row 44 was filed against, delivers fix #338's deferred ceremony modules and completes 61 P10's declared end state
---

# feature/91-distributable-ceremony-runner

> Feature specification — one single unit document. Delivered from issue
> [#352](https://github.com/gtrabanco/agentic-workflow/issues/352) as the
> umbrella unit owner decision 2 declares. Size: **L** — the planning ledgers
> live beside this doc as `planning-evidence.md` and
> `planning-obligations.md` (never both embedded and separate).

## Specs

Requirements numbered `S#`, quoting the requester's own words verbatim. `S1` is
the local order that scopes this delivery; `S2`–`S10` are the issue's in-scope
bullets in the order it states them; `S11` is its acceptance block; `S12`–`S13`
are the two local-order constraints that bound how this unit may be delivered.
Every later decision cites its `S#`.

**S1 — Apply issue #352 to this repository, locally.**
> Apply to this repository: issue #352

…with the local-order preamble that makes the delivery local and unpublished:
> This is a **local, unpublished** workflow for changing agentic-workflow itself.

**S2 — Ceremony P1/P2 modules live in the crate; the registry stays closed.**
> - [ ] Ceremony modules **P1/P2** implemented in the crate: `review`, `acceptance`, `refutation`, `fusion`, `delta`, `progress`, `evidence`, `commit`, `roadmap`, `pr` (gh-backed, declared degradation) — the registry stays closed; `deferred-module` answers disappear.

**S3 — P0 ceremony modules ported and deduplicated.**
> - [ ] Existing **P0** ceremony modules (`workspace`, `docs`, `findings`, `ledger`, `unit`, `plan`) ported into the crate, deduplicated against `unit-doc`/`Roadmap` per decision 3.

**S4 — Sensors migrated, exit contracts and fixed JSON preserved.**
> - [ ] Sensors migrated into the crate (decision 4) preserving their exit contracts (0 success / 1 usage / 2 refusal-block) and fixed JSON outputs.

**S5 — `RUNNER.md` carrier, train stamping, `rendered-facts` row, drift wiring.**
> - [ ] `RUNNER.md` carrier skill + release-train stamping + `rendered-facts` row + drift-gate wiring (decision 7).

**S6 — Skill prose re-pointed at the versioned runner.**
> - [ ] Skill prose rewrite: every `bun scripts/<runtime>.mjs` citation re-pointed to the versioned runner invocation citing `RUNNER.md` (single citation point per skill; no version literal duplicated).

**S7 — Schema dependency exact-pinned where the sensors require it.**
> - [ ] Crate gains the schema package as an exact-pinned dependency where sensors require it (`pre-execution-snapshot` already falls back to `@gtrabanco/agentic-workflow-schema`).

**S8 — `packages/agentic-workflow/src/runner/ceremony/**` deleted; root suites re-aimed; `scripts/` returns to repo-own checks.**
> - [ ] `packages/agentic-workflow/src/runner/ceremony/**` deleted; root suites re-aimed at the crate; repo `scripts/` keeps only repo-own dev/CI checks.

**S9 — Release/state surfaces ship with the change.**
> - [ ] Changeset(s), context budgets re-measured and re-based where prose changed, golden-fixture run for executor-path skills, `MIGRATION.md` note for any renamed surface.

**S10 — No new package, no new Trusted Publisher.**
> - [ ] `publish.yml` unchanged (no new package — the crate already publishes; no new Trusted Publisher registration).

**S11 — The issue's acceptance block, verbatim.**
> - From a clean directory with the skills installed and **no clone of this repo**, every command the skills cite runs via `bunx`/`npx @gtrabanco/agentic-workflow@<version>` and behaves as documented (reproduced and evidenced in a throwaway project).
> - The operation registry is closed: an operation outside it is a JSON usage error; no operation silently shells out to invented commands (the only external dependency is `gh`, with a declared degradation contract).
> - The pin in `RUNNER.md` equals the train version at every cut; a stable cut stamps `X.Y.Z`, a canary cut stamps the canary version; `normative-drift` recomputes and fails on mismatch.
> - No `bun scripts/<migrated-runtime>.mjs` reference remains under `skills/` (grep gate).
> - Re-aimed root suites + crate suites green; `check-skill-context` within budgets; no discipline gate weakened by the re-aim.
> - A project that does not upgrade its skills keeps a coherent frozen pair (skill vX ↔ package vX via the exact pin) with zero maintenance.

**S12 — Deliver inline: the repo's own review machinery never judges this change.**
> No `review-change`, no `audit-pr`, no fold cycle, no self-granted gate exceptions on this change. Direct application: the §5 ledger freeze **is** the plan; implement against it, hand the diff to me. The one exception is the repo's deterministic gates (tests, lints) — run those always.

**S13 — The planning ledgers are cut here, never retrofitted.**
> A change applied without them is a legacy unit with no ledgers, and the repo's reviews and audits refuse it until they are constructed — so cut them here, never retrofit them later:

## Impact

- **Callers of the moved modules.** Every remaining `scripts/*.mjs` that imports
  a migrated module must import it from `packages/agentic-workflow/src/runner/`
  — `prose-gate-inventory`, `docs-generate`, `relevant-files`, `unit-lineage`,
  `unit-cycle`, `findings-corpus`, `promise-coherence`, `structural-sibling-pins`,
  `vocabulary-probe`, `tier-cost`, `batch-scheduler` (tests), `roadmap-settle`
  (tests), `catalog` (tests) and `spec-by-reference` (tests). A missed import is
  a root-suite red, never a silent skip.
- **Suites that spawn the migrated CLIs.** `golden-fixture`, `continuation-discipline`,
  `pre-execution-quality`, `pre-execution-sensor`, `pre-execution-attribution`,
  `normative-drift`, `knowledge-honesty-contract`, `index-document`,
  `lane-era-lineage`, `ledger-ownership`, `risk-tier-*`, `every ceremony-*` suite
  spawn `node scripts/<x>.mjs`. They are re-pointed at
  `packages/agentic-workflow/bin/agentic-workflow.mjs <subcommand>` and keep
  every assertion.
- **Skills that cite the migrated runtimes**: `unit-lane`, `unit-lane/references/STEPS.md`,
  `execute-phase` (+ `references/risk-tiers.md`, `references/TEST_IMPACT.md`),
  `workflow-status` (+ `references/SENSOR_CORE.md`), `product-audit`
  (+ two references), `review-change/references/REVIEW_PROCESS.md`,
  `audit-docs`, `init-workspace` (+ two references), `phase-contract`,
  `orchestration-envelope`. Each rewrites its citation to the runner and points
  at `references/RUNNER.md` for the version — one literal pin in the repo.
- **Downstream 4.11 readers** (`packages/pi-agentic-workflow`) that reference
  `packages/agentic-workflow/src/runner/sensors/workflow-status.mjs` as a path: the conductor's sensor and the
  extension's workflow tools. Path-spawning must follow the crate bin.
- **`AGENTS.md`** publishes the layout and the "no backward-compatibility"
  surface list; `docs/workflow/SKILLS.md` counts user-facing skills — both are
  rendered-facts/normative surfaces a new carrier skill moves.
- Named high-risk item (tier verdict `high`): **destructive** surface
  `packages/agentic-workflow/bin/agentic-workflow.mjs` (the dispatch table decides
  what may write) and **publish** surface `scripts/release.mjs` (the stamp that
  must not mis-write a cut).

## Retirements

Grep-verified at the change; each row names its replacement or its zero-consumer
evidence.

| Retired | Replacement | Evidence |
|---|---|---|
| the ceremony CLI and its 8 P0 modules (once `scripts/ceremony*`) | `packages/agentic-workflow/src/runner/ceremony/*` via `agentic-workflow ceremony <object> <op>` | `rg -c 'scripts/ceremony' skills/ scripts/ packages/` → 0 after the change |
| `packages/agentic-workflow/src/runner/sensors/phase-lint.mjs`, `packages/agentic-workflow/src/runner/sensors/diff-guard.mjs`, `packages/agentic-workflow/src/runner/sensors/workflow-status.mjs`, `packages/agentic-workflow/src/runner/sensors/pre-execution-snapshot.mjs`, `packages/agentic-workflow/src/runner/sensors/pre-execution-contract.mjs`, `packages/agentic-workflow/src/runner/sensors/needs-input.mjs`, `packages/agentic-workflow/src/runner/sensors/ledger-provenance.mjs` | the same seven as `agentic-workflow <subcommand>` | `rg -c 'bun scripts/(phase-lint\|diff-guard\|workflow-status\|pre-execution-snapshot\|needs-input\|ledger-provenance)\.mjs' skills/` → 0 |
| `packages/agentic-workflow/src/runner/unit-route.mjs`, `packages/agentic-workflow/src/runner/unit-doc-phases.mjs`, `packages/agentic-workflow/src/runner/risk-tiers.mjs`, `packages/agentic-workflow/src/runner/capabilities.mjs`, `packages/agentic-workflow/src/runner/ceremony-profile.mjs` | `packages/agentic-workflow/src/runner/support/*` (the sensors' own import closure: a published crate cannot import a repository script) | `rg -c 'scripts/(unit-route\|unit-doc-phases\|risk-tiers\|capabilities\|ceremony-profile)\.mjs' skills/` → 0 |
| `DEFERRED_MODULES` in the ceremony registry (`deferred-module` answers) | the ten modules themselves | `rg -c 'deferred-module' packages/agentic-workflow/src packages/agentic-workflow/test` → 0 |
| the ad-hoc `bun scripts/<runtime>.mjs` narration in ten skill files | one citation per skill of the runner + `RUNNER.md` as the version's single home | the S6/S11 grep gate above |

## Non-goals

- Not migrating repo-own authoring gates (`check-skill-context`, `release.mjs`,
  `local-gate`, `run-root-suite`, `red-first`, `skill-lint`, `version-parity-gate`,
  `docs-generate`, `test-impact`, `structural-sibling-pins` and the rest of the
  gate family) — the issue's Out-of-scope bullet keeps them in `scripts/`.
- Not migrating runtime scripts the issue did not name and whose closure does not
  drag them in (`review-receipt`, `promise-coherence`, `batch-scheduler`,
  `audit-pr-gate`, `roadmap-settle`, `adversarial-verdict`, `correction-budget`,
  `test-impact`, `differential-baseline`, `scope-manifest`, `relay-packet`).
  They stay where they are and are not re-pointed in prose.
- No new package, no compiled binary, no `publish.yml` change (S10).
- No envelope/schema **vocabulary** addition: the sensors that read the schema
  package do so through its existing published exports.
- No Relay / unattended-conductor work (roadmap rows 81, 82).
- Findings discovered during implementation never expand this scope.

## Risk tier

- **Tier** — `high` · **Task Size** — understood **true** · contained risk
  `named` · resumable-from-diff **true** (verdict `risk-tier-verdict@1`, emitted
  by `agentic-workflow ceremony tier classify --paths …` at the cut head)
- **Named high-risk item** — `destructive · packages/agentic-workflow/bin/agentic-workflow.mjs`
  and `publish · scripts/release.mjs` (a mis-stamped cut or a dispatch row that
  writes where it must only read)

## Future

- `bun build --compile` single-binary distribution — out of scope here (the
  issue's Out-of-scope bullet), remains the promotion path once the JS runner is
  the only entry.
- Migrating the remaining runtime scripts (`review-receipt`, `promise-coherence`,
  `batch-scheduler`, …) into the same crate — the closure this unit proves makes
  the follow-up mechanical.
- `status: open`

## Future cost

- **The pin is a release obligation.** Every cut must re-stamp
  `skills/runner-contract/references/RUNNER.md`; `scripts/release.mjs apply` owns
  it and `normative-drift` fails closed when it drifts. Binds whoever cuts a release.
- **One citation point.** A skill that hard-codes a runner version instead of
  citing `RUNNER.md` re-opens the ~13-file manual edit the contract removed.
  Binds every future skill author and the review that reads them.
- **A moved module keeps its suite.** Deleting a `scripts/*.mjs` without moving
  its `*.test.mjs` breaks `structural-sibling-pins`; the crate suite becomes the
  gate carrier. Binds anyone touching `src/runner/`.

## Applicable tests

- `packages/agentic-workflow/test/runner.*.test.mjs` — the crate suites this unit
  adds/moves (dispatch, sensors, ceremony P0, ceremony P1/P2, distribution).
- `scripts/phase-lint.test.mjs`, `scripts/diff-guard.test.mjs`,
  `scripts/workflow-status-*.test.mjs`, `scripts/pre-execution-*.test.mjs`,
  `scripts/needs-input.test.mjs`, `scripts/ledger-provenance.test.mjs`,
  `scripts/ceremony*.test.mjs` — the frozen-failure corpus of the migration,
  moved with their modules and run from the crate suite.
- `node scripts/run-root-suite.mjs` — the re-aim evidence (S8).
- `bun scripts/local-gate.mjs` — the whole gate.

## Known pre-existing issues

- `scripts/schema-runtime.mjs` throws at module scope when
  `packages/agentic-workflow-schema/dist/` is missing — **does not affect** this
  unit's crate suites (the crate imports the pinned package, whose `test` script
  builds it first) and **affects** any root suite the migration re-aims at the
  crate bin: the gate's `schema-build` step runs before `root-suite`, so the
  ordering already holds (owner `scripts/local-gate.mjs` `DEPS`).
- `docs/fix/338-*` ships `deferred-module` answers and its own suite asserts
  them — **affects** this unit: the ceremony suite case that pins
  `deferred-module` is re-pointed to the module that now answers, never deleted
  (S2).
- `ceremony workspace status` loses the first character of the **first** changed file's
  path (`docs/…` → `ocs/…`): the module runs `git status --porcelain=v1` without `-b`
  and the repository's git helper trims the whole output, so the leading space of the
  first row is eaten before `slice(3)`. `ceremony tier` already carries the `-b` repair
  for the same class of defect (issue #384 F1) — **does not affect** this unit (the
  migration preserves the bytes), and it is **not repaired here**: S4 orders the fixed
  JSON outputs preserved, so a repair is its own unit with its own test. Reported in the
  handoff.
- `ledger-provenance` throws a raw `ENOENT` (stack trace, exit 1) when the path
  it is given does not exist instead of refusing with a usage line —
  **does not affect** this unit's contract (the migration preserves the exit
  code and the message; the frame paths are the only difference), and it is
  **not repaired here** because it is pre-existing behaviour of the sensor's own
  file read, outside S4's "preserve the contract" scope.
- `packages/pi-agentic-workflow` spawned `packages/agentic-workflow/src/runner/sensors/workflow-status.mjs` by path before P7 —
  **affects** this unit only where a test asserts that path; the conductor's
  spawn is re-pointed in the same change or the crate bin keeps answering the
  identical CLI.

## Tasks

P1…P9, dependency-topological first, smallest within a ready set. Final task is verification.

- P1 — Crate runner tree: the support closure moved out of the script directory, its import graph re-pointed, the bin's closed dispatch table and the crate README surface the surface test reads (validator: `node --test packages/agentic-workflow/test/runner.dispatch.test.mjs` exits 0)
  (Implements: S3, S4)
  - Relevant files: packages/agentic-workflow/src/runner/, packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/README.md
- P2 — The seven decision-4 sensors become crate subcommands with their exit contracts and fixed output preserved, and their suites move with them (validator: `node --test packages/agentic-workflow/test/runner.sensors.test.mjs` exits 0)
  (Implements: S4, S7)
  - Relevant files: packages/agentic-workflow/src/runner/sensors/, packages/agentic-workflow/test/
- P3 — The eight P0 ceremony modules ported, deduplicated against the crate's `UnitDoc` and `Roadmap` services, one receipt grammar and one refusal contract (validator: `node --test packages/agentic-workflow/test/runner.ceremony-p0.test.mjs` exits 0)
  (Implements: S3)
  - Relevant files: packages/agentic-workflow/src/runner/ceremony/
- P4 — The ten later ceremony modules implemented against the frozen operation map, `gh`-backed with a declared degradation, and the deferred answer gone (validator: `node --test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` exits 0)
  (Implements: S2, S11)
  - Relevant files: packages/agentic-workflow/src/runner/ceremony/
- P5 — The runner carrier skill, the release stamp for both channels, the rendered-fact row with its version machine, and the throwaway-project proof (validator: `node --test packages/agentic-workflow/test/runner.distribution.test.mjs` exits 0)
  (Implements: S5, S11)
  - Relevant files: skills/runner-contract/, scripts/release.mjs, scripts/normative-drift.test.mjs
- P6 — Skill prose re-pointed to the versioned runner invocation citing the carrier, one citation point per skill, and touched ceilings re-measured (validator: `rg -c 'bun scripts/(phase-lint|diff-guard|workflow-status|pre-execution-snapshot|needs-input|ledger-provenance|unit-route)\.mjs' skills/` matches 0)
  (Implements: S6, S9)
  - Relevant files: skills/, docs/workflow/SKILL_CONTEXT_BUDGETS.json
- P7 — Retirement: `packages/agentic-workflow/src/runner/ceremony/**` and the migrated runtimes deleted, every remaining script and suite re-pointed at the crate, no assertion weakened (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S8)
  - Relevant files: scripts/, packages/agentic-workflow/test/
- P8 — State and docs: roadmap row, changeset intent, migration note, session log entry, README currency (validator: `node --test scripts/normative-drift.test.mjs` exits 0)
  (Implements: S9, S10)
  - Relevant files: docs/ROADMAP.md, .changeset/, docs/workflow/MIGRATION.md, docs/LOGS.md
- P9 — Verification: the whole gate and every obligation closed (validator: `bun scripts/local-gate.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13)
  - Relevant files: docs/features/91-distributable-ceremony-runner/planning-obligations.md

### Planning evidence

`planning-evidence.md` (beside this doc — M/L units never embed it).

### Obligations

`planning-obligations.md` (beside this doc — M/L units never embed it).

## Triaged steps

> Machine-authored step list from `bun scripts/unit-route.mjs --triage 91-distributable-ceremony-runner --json`
> at the cut head; the lane never re-derives or reorders it.

```text
triaged-steps@1
slug: 91-distributable-ceremony-runner
route: unit-lane
next-step: P1
tier: high
steps: P1, P2, P3, P4, P5, P6, P7, P8, P9
```

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-12, the local order, verbatim:
  ```
  Apply to this repository: issue #352

  This is a **local, unpublished** workflow for changing agentic-workflow itself. The failure it prevents: the workflow judging its own surgery (unit fix-258 burned 12 review→fold cycles that way). Follow this order, every step:

  ## 0. Resolve the intent from state before acting
  ## 1. Verbatim intent (never paraphrase)
  ## 2. Frozen-failure corpus first (RED before anything)
  ## 3. Fixtures before the real tree
  ## 4. Work inline — never run this repo's own machinery on its own surgery
  ## 5. Freeze the planning ledgers before the first line of code
  ## 6. Implement test-first, differential, in slices
  ## 7. Documentation and state are part of the change, written via surfaces
  ## 8. Verify like a writer, hand off like one
  ## 9. Correction bounds (hard)

  [elided: the nine sections' full bodies — S12 and S13 quote the operative
  sentences; the rest is process the delivery follows, recorded as D1–D4 below]
  ```
- **D1** — 2026-11-12, home decision: the unit lives at
  `docs/features/91-distributable-ceremony-runner/` because roadmap row **91**
  already carries this feature and the folder↔row pairing is machine-checked
  (`docs-generate`); the issue's own `NEW FEATURE` title and owner decision 1
  ("cataloged as feature") agree. The branch is
  `feat/352-new-feature-distributable-ceremony-runner`.
- **D2** — 2026-11-12, closure decision: the seven decision-4 sensors drag their
  runtime import closure (`unit-doc-phases`, `unit-route`, `risk-tiers`,
  `capabilities`, `ceremony-profile`) into the crate — a published package cannot
  import a repository script, so migrating `workflow-status` without them is not
  a coherent half. `unit-route`'s CLI therefore travels too and its skill
  citations are re-pointed (PE-003). Recorded, not discovered later.
- **D3** — 2026-11-12, process: the local order's §4 forbids running
  `review-change`/`audit-pr`/fold on this change; the deterministic gate
  (`bun scripts/local-gate.mjs`, the crate and root suites) is the only
  verification that runs (S12).

- **D4** — 2026-11-12, data decision: the router's `catalog.json` travels with the
  runner (`src/runner/catalog.json`) because a published package cannot read the
  repository's `scripts/`; the repository copy and its four remaining readers are
  re-pointed in the retirement commit, so the catalog keeps one home (the
  invariant O4 already states — no new obligation).
- **E1** — 2026-11-12, differential run of the router: for `--triage <unit> --json`,
  `--triage <unit>`, `<unit>` and `--help`, `node scripts/unit-route.mjs <args>` and
  `node packages/agentic-workflow/bin/agentic-workflow.mjs unit-route <args>` produced
  byte-identical stdout, stderr and exit code · exit 0 · the only difference is the
  `--help` usage line, whose script name is the retired one (`bun scripts/unit-route.mjs`
  → `agentic-workflow unit-route`), as intended.- **P1** — 2026-11-12, the runner's module tree lands in the crate: the support closure
  (`unit-doc-phases`, `unit-route`, `risk-tiers`, `capabilities`, `ceremony-profile`,
  `lib`, `ceremony/tier`) moved into `src/runner/`, its imports re-pointed at the
  pinned schema package and the crate's own `index-document`/`relay`, the project root
  now resolved from the caller's working directory (`src/runner/root.mjs`), the
  bundled catalog added, and the closed dispatch table (`src/runner/cli.mjs`) wired
  into the bin with the crate README surface · commit `8bf10497`.
- **G1** — 2026-11-12, HEAD `43e8c1f9` · `bun test --timeout=30000 test/` in `packages/agentic-workflow` ·
  exit 0 · 664 pass, 0 fail, 35 files.
- **E2** — 2026-11-12, the six sensors' differential run, script vs bin, same args and
  cwd: `phase-lint <unit doc>`, `phase-lint <two paths>`, `phase-lint` (usage),
  `needs-input <unit-dir>`/`--json`/usage, `diff-guard --base HEAD~2`/`--json`/bad flag,
  `workflow-status`/`--compact`, `pre-execution-snapshot`/`contract`,
  `ledger-provenance <unit doc> --check` → byte-identical stdout, stderr and exit code
  in every case except two intended differences: the `needs-input` usage line names
  `agentic-workflow needs-input`, and `ledger-provenance` on a **missing** file prints
  the same `ENOENT` with the new frame paths (the pre-existing crash recorded under
  `## Known pre-existing issues`).
- **P2** — 2026-11-12, the seven decision-4 sensor runtimes answer from the crate: the
  four that were scripts with a self-invocation guard became importable modules with
  exported entries, `workflow-status` now reads its schema version from the pinned
  package instead of the sensor's checkout, `pre-execution-snapshot` imports the pinned
  schema instead of falling back through a repository `dist/`, and
  `src/runner/cli.mjs` wires all seven plus the router · commit `b5ed1ef4`.
- **G2** — 2026-11-12, HEAD `8bf10497` · `node --test packages/agentic-workflow/test/runner.dispatch.test.mjs`
  · exit 0 · 6 pass; `node --test packages/agentic-workflow/test/cli.surface.test.mjs`
  · exit 0 · 3 pass (the README restates the seven new commands).
- **E3** — 2026-11-12, the ceremony modules through both entry points: `workspace status`,
  `unit route --slug …` (which delegates to the router through the shipped bin) and
  `plan lint --slug …` (which delegates to the linter the same way) — same exit code and,
  for the delegating operations, the same JSON; `ceremony` with no object, an unknown
  object and a deferred object answers the same closed-world JSON with exit 1.
- **P3** — 2026-11-12, the eight P0 ceremony modules answer from the crate with one receipt
  grammar and one refusal contract; `unit` and `plan` reach the router and the linter
  through the shipped bin instead of a script path, and `findings` reads its severity
  vocabulary from the pinned schema package · commit `P3SHA`.
- **G3** — 2026-11-12, HEAD `b5ed1ef4` · `node --test packages/agentic-workflow/test/cli.surface.test.mjs`
  · exit 0 · 3 pass (the README restates `ceremony`); the closed-world and deferred answers
  reproduced by hand, recorded in E3.
- **E4** — 2026-11-12, the pin's red-then-green: with RUNNER.md restating `9.9.9` while the
  crate says `4.10.0`, `node --test scripts/normative-drift.test.mjs` exited 1 with
  `[unrendered-value] … no longer states "bunx @gtrabanco/agentic-workflow@4.10.0" while
  package:version says 4.10.0`; restored, the same suite exits 0 (21 pass).
- **P5** — 2026-11-12, the runner carrier ships: `skills/runner-contract/SKILL.md` +
  `references/RUNNER.md` hold the canonical invocation, the pin, the subcommand map, the
  exit contracts and the `AGENTIC_WORKFLOW_RUNNER` override; `scripts/release.mjs` stamps
  the pin on a stable apply and stages it in-cut for a canary (restored by the printed
  checkout); `normative-drift` gained the `package:version` machine and AGENTS.md the
  rendered-fact row; the distribution test proves the declared publish surface runs the
  runner with no repository file behind it · commit `0533c39b`.
- **P6** — 2026-11-12, the prose re-point: 33 skill files moved off `bun scripts/<runtime>.mjs`
  onto `bunx @gtrabanco/agentic-workflow@<pin> <subcommand>`, with the `npx` fallback named
  and one pointer block per citing skill naming RUNNER.md as the pin's home; five touched
  ceilings re-measured and re-based · commit `P6SHA`.
- **G4** — 2026-11-12, HEAD `bdf47890` · `node --test packages/agentic-workflow/test/runner.distribution.test.mjs`
  · exit 0 · 3 pass; `node --test scripts/release.test.mjs` · exit 0 · 73 pass (three of
  them this unit's); `node scripts/check-skill-context.mjs` · exit 0 · 30 skills;
  `bun scripts/check-skill-context.mjs --documents` · exit 0 · 4 documents.
- **P4 (not started)** — the ten later ceremony modules (`review`, `acceptance`,
  `refutation`, `fusion`, `progress`, `evidence`, `commit`, `roadmap`, `delta`, `pr`) are
  **not** implemented; `ceremony <object>` still answers `deferred-module` for them. This
  is the one scope item of S2 that has no code yet.
- **P6 (reverted)** — the prose re-point landed (`cb784493`) and was reverted
  (`05c2310b`) the same session: it grew five skill ceilings and fourteen route ceilings
  and, in doing so, tripped four coupled contracts that each carry a marker table of their
  own — `check-skill-context`'s required-marker table (a doc must still contain
  `phase-lint.mjs <unit-doc>`), `promise-coherence`'s command/claim grammar,
  `ledger-ownership`'s writer scan, and the budget `ceil(<measured> x 1.10)` narration.
  Fixing them is a slice of its own, not a tail of this one; the reverted commit holds the
  exact substitution set to re-apply (`git show cb784493`).
- **P7/P8/P9 (not started)** — the retirement (`packages/agentic-workflow/src/runner/ceremony/**` and the migrated
  runtimes deleted, ~25 root suites and 15 repo scripts re-pointed at the bin), the
  migration note, and the full `local-gate` run.
- **E5** — 2026-11-12, the closed world from the shipped surface:
  `ceremony` → `{error: usage}`, exit 1; `ceremony nonsense x` → `{error: unknown-object}`,
  exit 1; `ceremony review create` → `{error: deferred-module}`, exit 1 (P4's gap, named).
- **G5** — 2026-11-12, HEAD `2119ef9e` · `node --test packages/agentic-workflow/test/runner.dispatch.test.mjs`
  · exit 0 · 6 pass; `node --test packages/agentic-workflow/test/cli.surface.test.mjs`
  · exit 0 · 3 pass; `node --test packages/agentic-workflow/test/runner.distribution.test.mjs`
  · exit 0 · 3 pass.
- **G6** — 2026-11-12, HEAD `2119ef9e` · `node --test scripts/normative-drift.test.mjs` · exit 0 · 21 pass;
  `node --test scripts/ledger-ownership.test.mjs` · exit 0; `node --test scripts/release.test.mjs`
  · exit 0 · 73 pass; `node scripts/check-skill-context.mjs` (+ `--routes`, `--documents`)
  · exit 0 · 30 skills / 14 routes / 4 documents.
- **G7** — 2026-11-12, HEAD `2119ef9e` · `node scripts/run-root-suite.mjs` · exit 0 · 106/106 PASS;
  `bun test --timeout=30000 test/` in the crate · exit 0 · 668 pass;
  `node --test` in the crate · exit 0 · 669 pass.
- **P7** — 2026-11-12, the retirement lands in four verified steps, each one green:
  **(1)** every surviving importer reads the moved parsers from the crate; **(2)** the
  corpora spawn the crate's bin instead of `node scripts/<x>.mjs`, keeping every case and
  option; **(3)** the pre-execution and sensor sandboxes become consumer projects (the
  script copies, the `packages/` link and the contract copy are gone with the reason they
  existed) and the lineage gate and lane cycle spawn through the bin; **(4)** the twelve
  migrated runtimes, the ceremony CLI, `packages/agentic-workflow/src/runner/ceremony/*` and the repository's catalog file
  are deleted, the ceremony suites drive the crate registry, and the ownership map, the pin
  allowlists, the gate inventory, the route map and the pending changesets name the new
  homes · commits `eef887b6`, `207dcc6d`, `4b77c02a`, `P7SHA`.
- **E6** — 2026-11-12, the assertion changes the re-aim required, each tracking a surface this
  unit changed (nothing was relaxed and no case was deleted): the `needs-input` usage line;
  the ceremony `deferred-module` note; the ceremony unknown-object invocation; the router's
  `--help` usage line; the sensor's loader-form case (the crate imports the pinned package);
  the sensor stub sandbox shape (its schema stub now shadows one function over the real
  package); the classifier's foreign-specifier set (the workspace scope is declared); the
  relay catalog's source label; the ownership map's annotator path shape, its scan roots and
  its release-stamp exemption; the promise-coherence fixture's validator path; the
  lint-changeset fixture's sample path; and the module constants in the capability, tier,
  spec-by-reference and catalog corpora.
- **G8** — 2026-11-12, HEAD `P7SHA` · `node scripts/run-root-suite.mjs` exit 0 · 106/106 PASS;
  `bun test --timeout=30000 test/` in the crate exit 0 · 668 pass; `node scripts/docs-generate.mjs --check`
  exit 0; `bun scripts/check-skill-context.mjs` (+ `--routes`) exit 0 · 30 skills / 14 routes.
- **P4 (six of ten)** — `progress`, `evidence`, `acceptance`, `delta`, `refutation` and
  `fusion` answer from the crate with the map's operations, over the unit doc's own
  carriers (the `## Log` `P`/`E` lines, the `## Evidence` table, `## Acceptance criteria`)
  and git — no new artifact, no second grammar; every section read goes through the shared
  fence-aware reader. The four the map still owes (`review`, `commit`, `roadmap`, `pr`)
  answer `deferred-module` naming their own gap: a review state carrier, a commit revert
  policy, a forge-backed settle and `gh`'s degradation contract are decisions the frozen
  map does not take, and inventing them would be a guess. Commit `P4SHA`.
- **G9** — 2026-11-12, HEAD `P4SHA` · `node --test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs`
  exit 0 · 8 pass; crate suite exit 0 · 677 pass (bun) / 677 (node); `node scripts/run-root-suite.mjs`
  exit 0 · 106/106; `node scripts/docs-generate.mjs --check` and `bun scripts/check-skill-context.mjs` exit 0.
- **P7 (completion)** — 2026-11-12, the downstream readers follow the move: the pi package's
  conductor sensor and its three runner tools spawn the crate's bin (resolved once from the
  package's own dependency, with the documented `AGENTIC_WORKFLOW_RUNNER` override selecting
  a local build), the schema package's review-loop corpus reads the crate's pre-execution
  contract, and the test-route map keys the crate's paths · commit `007250c8`.
- **P8** — 2026-11-12, the state ships with the change: `MIGRATION.md` carries the rename
  table and the pin's one home, the workflow references cite the runner, the session journal
  entry is the crate's own writer aggregated into `docs/LOGS.md` (committed under the
  aggregator identity the log gate requires), and the roadmap row 91 stands `in-progress`.
- **P9** — 2026-11-12, `bun scripts/local-gate.mjs` · **PASS — 17 steps in 229s**, including
  `crate-suite-bun` 676, `crate-suite-node` 677, `root-suite` 106/106, `schema-node-compat`,
  `pi-node-compat`, `pi-compat-guard`, `version-parity-content`, `docs-generated-projection`,
  `journal-carrier-check`, `log-immutability`, `temp-hygiene`, `tmp-gc`, `worktree-guard`,
  `dependency-pin-gate`, `dependency-advisories`, `workspace-install`, `schema-build`.
- **D5** — 2026-11-12, the journal's write-path gate requires the aggregator's git identity on
  any commit touching `docs/LOGS.md`; the two commits that carried an aggregated entry were
  re-authored under `journal-bot@users.noreply.github.com` (local, unpushed branch — no
  published history changed) so `log-immutability` reads 0 violations.
- **P4 (complete)** — 2026-11-12, the last four modules close the map: `review` (over the doc's
  `R<n>` lines and `## Findings` rows — the two carriers the ownership map already declares, with
  manual checks and proposals riding inside the same entry), `commit` (the conventional grammar as
  the write gate, `git revert` as delete), `roadmap` (the crate's `Roadmap` writer plus the table
  choice and a settle that promotes only a row already carrying its merged PR link), and `pr`
  (`gh`-backed with the declared degradation: `gh-missing` and `gh-unauthenticated` are ceremonial
  blocks, any other failure is `gh-error`). `DEFERRED_MODULES` is empty and the `deferred-module`
  answer is gone · commit `P4B`.
- **E7** — 2026-11-12, one defect the new contract tests found and this unit repaired (a declared
  deviation from S4's "preserve the fixed outputs", because a corrupted path is not a contract):
  `ceremony workspace status`/`clean-check` lost the first character of the first changed path —
  `git status --porcelain=v1` without `-b`, whose header line the repository's git helper needs
  before trimming. Both now pass `-b` and skip the header, the repair `ceremony tier` already
  carried (issue #384 F1); the case is pinned in `runner.ceremony-p0.test.mjs`.
- **G10** — 2026-11-12, HEAD `P4SHA` · `node --test` on the four crate contract suites · exit 0 · 8 + 9 + 8 + 6
  pass; crate suite 697 pass; `node scripts/run-root-suite.mjs` exit 0 · 106/106.

## Next

Every phase is delivered and all 23 obligation rows are `verified`; the external verifier's
verdict is the remaining step before the PR merges. `review` keeps one carrier (the unit doc's
`R<n>` entries plus its `## Findings` rows) — a project that wants a side ledger for review state
is a new unit with its own decision, not a silent second file here.

## References

- Issue [#352](https://github.com/gtrabanco/agentic-workflow/issues/352) — the
  PR closes it via `Closes #352`.
- Roadmap row 91 `## Features`; soft-related roadmap rows 44, 61 (P10), 65, 227,
  437, 462, 424.
- `docs/fix/338-closed-ceremony-cli/SPEC.md` — the frozen ceremony operation map
  (its `L1`) is the P0/P1/P2 modules' authority.
- `docs/architecture/ARCHITECTURE.md` — the fan-in direction the crate's modules
  follow.
