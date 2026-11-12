---
type: feature
scope: large
roadmap_summary: one distributable runner — every ceremony operation and runtime sensor as a subcommand of `@gtrabanco/agentic-workflow`, invoked at a train-stamped pin
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

**S8 — `scripts/ceremony*` deleted; root suites re-aimed; `scripts/` returns to repo-own checks.**
> - [ ] `scripts/ceremony*` deleted; root suites re-aimed at the crate; repo `scripts/` keeps only repo-own dev/CI checks.

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
  `scripts/workflow-status.mjs` as a path: the conductor's sensor and the
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
| `scripts/ceremony.mjs`, `scripts/ceremony/*.mjs` (8 modules + lib) | `packages/agentic-workflow/src/runner/ceremony/*` via `agentic-workflow ceremony <object> <op>` | `rg -c 'scripts/ceremony' skills/ scripts/ packages/` → 0 after the change |
| `scripts/phase-lint.mjs`, `scripts/diff-guard.mjs`, `scripts/workflow-status.mjs`, `scripts/pre-execution-snapshot.mjs`, `scripts/pre-execution-contract.mjs`, `scripts/needs-input.mjs`, `scripts/ledger-provenance.mjs` | the same seven as `agentic-workflow <subcommand>` | `rg -c 'bun scripts/(phase-lint\|diff-guard\|workflow-status\|pre-execution-snapshot\|needs-input\|ledger-provenance)\.mjs' skills/` → 0 |
| `scripts/unit-route.mjs`, `scripts/unit-doc-phases.mjs`, `scripts/risk-tiers.mjs`, `scripts/capabilities.mjs`, `scripts/ceremony-profile.mjs` | `packages/agentic-workflow/src/runner/support/*` (the sensors' own import closure: a published crate cannot import a repository script) | `rg -c 'scripts/(unit-route\|unit-doc-phases\|risk-tiers\|capabilities\|ceremony-profile)\.mjs' skills/` → 0 |
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
  by `bun scripts/ceremony.mjs tier classify --paths …` at the cut head)
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
- `ledger-provenance` throws a raw `ENOENT` (stack trace, exit 1) when the path
  it is given does not exist instead of refusing with a usage line —
  **does not affect** this unit's contract (the migration preserves the exit
  code and the message; the frame paths are the only difference), and it is
  **not repaired here** because it is pre-existing behaviour of the sensor's own
  file read, outside S4's "preserve the contract" scope.
- `packages/pi-agentic-workflow` spawns `scripts/workflow-status.mjs` by path —
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
- P7 — Retirement: `scripts/ceremony*` and the migrated runtimes deleted, every remaining script and suite re-pointed at the crate, no assertion weakened (validator: `node scripts/run-root-suite.mjs` exits 0)
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
  into the bin with the crate README surface · commit `d1009167`.
- **G1** — 2026-11-12, `bun test --timeout=30000 test/` in `packages/agentic-workflow` ·
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
  `src/runner/cli.mjs` wires all seven plus the router · commit `P2SHA`.
- **G2** — 2026-11-12, `node --test packages/agentic-workflow/test/runner.dispatch.test.mjs`
  · exit 0 · 6 pass; `node --test packages/agentic-workflow/test/cli.surface.test.mjs`
  · exit 0 · 3 pass (the README restates the seven new commands).

## Next

P1 — cut the crate runner scaffold and move the support closure.

## References

- Issue [#352](https://github.com/gtrabanco/agentic-workflow/issues/352) — the
  PR closes it via `Closes #352`.
- Roadmap row 91 `## Features`; soft-related roadmap rows 44, 61 (P10), 65, 227,
  437, 462, 424.
- `docs/fix/338-closed-ceremony-cli/SPEC.md` — the frozen ceremony operation map
  (its `L1`) is the P0/P1/P2 modules' authority.
- `docs/architecture/ARCHITECTURE.md` — the fan-in direction the crate's modules
  follow.
