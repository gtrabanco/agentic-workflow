---
type: fix
scope: medium
ac-hash: ac9bcec9f4b7ad76d2eca586e6ec112cd28e9cba1cf5c6e586bcbabf3e0743e0
roadmap_summary: Issue [#716](https://github.com/gtrabanco/agentic-workflow/issues/716) (M): the batch scheduler's lane vocabulary stops being agentic-workflow's own tree — a project declares its lane trees in `batchScheduler.surfaces`, an undeclared project's own directories are discovered instead of degrading to `surface-unknown`, and `--infer-surfaces` reads the same vocabulary the sensor reads.
---

# fix/716-batch-scheduler-surface-vocab

> One-line: the batch scheduler's surface vocabulary has one owner that reads the
> project, not this repository's folder names — declared in the unified config,
> discovered from the tree while nothing is declared, and consumed by the planner
> and by triage's emitter from the same resolver.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.1
schema: @gtrabanco/agentic-workflow-schema@4.10.1
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

```text
retention-declaration@1
path | disposition
SPEC.md | kept
decisions.md | kept
known-issues.md | kept
planning-obligations.md | kept
planning-evidence.md | kept
external-verify.md | trimmable
review-findings.md | trimmable
```

## Issue

`#716` — tracked issue in the project's forge. The PR closes it via
`Closes #716`. The unit lives under `docs/fix/` because it is applied through the
owner's local workflow (`## Log` L2), the same home units 701/703/706/710 took.
Family: the #716/#717 defect class — a distributable surface that silently assumes
this repository's tree (the sibling #717 sweeps the rest of the class).

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim
between the quote markers. `S1` is the operator's order; `S2`–`S10` quote the
issue's own words, which that order adopts as the work.

**S1 — the order: apply #716 to this repository, inline.**
> Apply to this repository: issue #716

**S2 — the defect: the vocabulary is this repository's folder names.**
> `batch-scheduler`'s surface vocabulary is hardcoded to **agentic-workflow's own repository layout** — `skills/<name>`, `packages/<name>`, `scripts`, `docs`, `template`, `.github` — so on any other project the sensor degrades every issue to `surface-unknown`, emits a `blind-spot`, and forces fully serial execution. The product's cross-project scope is defeated by its own sensor.

**S3 — the verdict and the shape the owner recorded.**
> **fix-now (high)** — the defect defeats the entire value proposition of the batch scheduler for every consumer project. The fix is in the producer's `surfaceKey` function and its `--infer-surfaces` emitter. The simplest coherent fix is: project-declared vocabulary (init-workspace interviews/infers lane trees) + emitter upgrade (reads declared config). Schema and tests are the other surfaces. No merge conflict with #717 because #717 is the audit sweep of *other* surfaces, not the scheduler itself.

**S4 — both dimensions share the closed list, so a declaration and a diff agree on nothing.**
> The docstring says "the documented surfaces" — meaning **agentic-workflow's own docs**. `surfaceKeyFor` (the branch-diff side) maps the same list, so both the declared and the measured dimensions share the assumption. Both a `src/pages/app/ledger` declaration *and* a live branch that only rewrites `src/**` resolve to **no surface**.

**S5 — the envelope is vocabulary-agnostic; only the producer is closed.**
> There is no enum. The envelope carries any lane key; **only the producer refuses to produce them** for a foreign tree. So the defect is squarely in `batch-scheduler`'s key derivation, not in a schema decision.

**S6 — triage's only source re-parses the body through the same chain, so its contract is unfulfillable.**
> And `--infer-surfaces` (the triage step's emitter, issue #574 S2, decision D6) does not infer anything from the repository — it **re-parses the issue body** through the same `resolveBodySurfaces` → `surfaceKey` chain:

```
$ batch-scheduler.mjs --infer-surfaces 333   # body: … ## Where → src/pages/app/roles, src/middleware
[the printed declaration block, elided: its one key]
- `surface-unknown`

$ batch-scheduler.mjs --infer-surfaces 341   # body: … ## Where → src/pages/api/ledger.ts, src/shared/domain/…, migrations/…
[the printed declaration block, elided: its one key]
- `surface-unknown`
```

> Even a body whose `## Where` lists **actual files under the project's real tree** (`src/pages/api/ledger.ts`) resolves to nothing, because `src` is not in the closed list. So triage-issue's contract ("written from `--infer-surfaces` output, never hand-typed") is unfulfillable on a foreign tree: the emitter's only output is `surface-unknown`.

**S7 — the live effect on a consumer project.**
> A single `batch-scheduler` run over the 28 open issues of `sosfelinosbasti`:
>
> - **19–23 issues** in batch 1, all `degraded: surface-unknown-issue-<n>`
> - `finding blind-spot: …batch cannot be shown parallel-safe; run them serially`
> - every issue serialized into one `general` lane after the first `satisfied-inputs` row
>
> The plan technically succeeds but delivers none of the value the sensor exists for. Any project whose tree is not agentic-workflow's monorepo layout gets the same result by construction.

**S8 — no project-side surface declaration exists to fix it through configuration.**
> - **`init-workspace`** — interviews for ceremony, gates, policies; **never asks** "which directory trees are this project's parallel lanes", and writes nothing surface-related for the scheduler.
>
> Plus `skills/batch-scheduler/references/PLAN.md` documents the closed vocabulary as the grammar:
>
> ```
> | `lanes[].surface` | one lane per touched surface — `skills/<name>`, `packages/<name>`, `scripts`, `docs`, `template`, `.github`, or `general` when nothing resolved. |
> ```

**S9 — the directions, and the owner's selection of two of them.**
> 1. **Project-declared vocabulary.** `init-workspace` interviews/infers the target project's top-level lane trees (e.g. `src`, `app`, `api`, `lib`…) and records them in a versioned `.agentic-workflow/` block (or the charter). `surfaceKey` reads it first, falls back to the built-in list for unconfigured repos. This matches how the charter already records project-owned decisions.
>
> 3. **Emitter upgrade.** `--infer-surfaces` gains a `--root` mode that walks the repository tree (or reads the declared config) instead of only re-parsing body prose, so triage-issue's contract becomes fulfillable on any project.
>
> 1 + 3 together seem the coherent fix (declare per project; the emitter and the sensor both read the same vocabulary source), but the decision is the owner's.

The owner's selection is the record triage wrote into the roadmap row
(`docs/ROADMAP.md`, `716 | batch-scheduler-surface-vocab`), which is the
authority this unit implements:

> Fix: make the vocabulary configurable per project + upgrade emitter to read from declared config.

**S10 — the rollback strategy and the severity the tier rests on.**
> Additive change to the vocabulary resolver; a reverted PR restores the hardcoded list. Tests are the safety net — they assert the agentic-workflow tree and the fallback.

> high (defeats the core value of batch-scheduler for every consumer project)

## Acceptance criteria

Frozen at the cut; `ac-hash:` in the frontmatter is this section's SHA-256
(heading and the next `## ` excluded). One criterion per requirement, each
naming the check that proves it.

1. **S1 — the order is applied inline against the frozen ledgers.** `git log --oneline main..HEAD` carries only this unit's conventional commits, and `rg -n 'review-change|audit-pr' docs/fix/716-batch-scheduler-surface-vocab/` matches only the workflow text quoted in `## Log` L2: no review pack, no fold cycle, no self-granted gate exception.
2. **S2 — a foreign tree's real paths resolve to lanes instead of `surface-unknown`.** `bun test scripts/batch-scheduler.test.mjs` exits 0 with the case `S2: a foreign tree resolves the paths its body names, instead of degrading to surface-unknown`, which builds a scratch tree carrying `src/pages/…` and `migrations/…` and a body whose `## Where` lists `src/pages/api/ledger.ts`, `src/shared/domain/ledger.ts`, `migrations/001.sql`, and asserts lanes `src/pages`, `src/shared`, `migrations` with `degraded` free of `surface-unknown-issue-<n>`.
3. **S3 — the recorded fix shape is the one built: declared vocabulary plus an emitter that reads it.** `bun test scripts/batch-scheduler.test.mjs` exits 0 with the case `S3: the emitter and the producer read one vocabulary, and a declared project's keys are its declaration`, asserting the same key set reaches `--infer-surfaces` output and the plan's lanes; `docs/workflow/CONFIG.md` documents `batchScheduler.surfaces` in the sections table and the shipped-defaults reference.
4. **S4 — both dimensions resolve through one resolver, and the diff side agrees with the declared side.** `bun test scripts/batch-scheduler.test.mjs` exits 0 with the case `S4: a branch diff and a body declaration resolve through the same vocabulary`, where a live branch rewriting `src/pages/x.ts` covers a declared `src/pages` (`claimed_surface` absent) and a branch rewriting only `src/config/x.ts` does not (`claimed_surface: ["src/pages"]`); `rg -n 'top === "skills"' packages/agentic-workflow/src/batch-scheduler/index.mjs` matches nothing.
5. **S5 — the envelope stays vocabulary-agnostic; the declaration lives in config.** `bun test packages/agentic-workflow-schema/test/batch-plan.test.mjs` exits 0 with its lane-surface cases unchanged (a bounded string, no enum), and `bun test packages/agentic-workflow-schema/test/config-contract.test.mjs` exits 0 with `batchScheduler` declared as a base section whose `surfaces` entries the validator refuses by path when malformed.
6. **S6 — triage's only source now infers.** `bun test scripts/batch-scheduler.test.mjs` exits 0 with the case `S6: --infer-surfaces prints the block for a foreign tree and prints the unknown only when nothing resolves`, asserting the paste block `## Surfaces` with `src/pages`/`migrations` keys on the foreign-tree fixture, `- surface-unknown` for a body naming nothing, exit 0 both times, no state write.
7. **S7 — a consumer-shaped run batches in parallel.** `bun test scripts/batch-scheduler.test.mjs` exits 0 with the case `S7: a consumer-shaped set plans in parallel batches with no blind spot`, whose fixture is the `sosfelinosbasti` shape (a `src/`-rooted tree) and asserts `summary.batches` ≥ 2, no `surface-unknown-issue-<n>` in `degraded`, no `blind-spot` finding, and no `general` lane.
8. **S8 — a project declares its own lane trees, and the scaffold asks for them.** `bun packages/agentic-workflow/bin/agentic-workflow.mjs config set batchScheduler.surfaces '["src/pages","src/shared"]' --scope project` exits 0 in a scratch project and writes the array; `bun test scripts/batch-scheduler.test.mjs` exits 0 with the case `S8: a declared vocabulary excludes a tree it does not name`; `skills/init-workspace/references/CONFIG.md` documents the offer and `runner config set` line.
9. **S9 — the three layers coexist: shipped, declared, discovered.** `bun test scripts/batch-scheduler.test.mjs` exits 0 with the cases `S9: the shipped roots are still recognized whatever a project declares` (a declared project keeps `skills/<name>`/`packages/<name>`/`scripts`/`docs`/`template`/`.github` resolving exactly as before), `S9: a bare tree root joins the children declared in the run`, and `S9: an unreadable config degrades and the plan still prints`; the discovery layer is off once a project declares, proven by `S8`'s case.
10. **S10 — the change is additive: this repository's own plan does not move, and a revert restores the old resolver.** `bun scripts/batch-scheduler.mjs --no-state --json-only` on this checkout produces an envelope byte-identical to the same command run at the base commit over the same issue set (`--issues-file` fixture, both runs in `mktemp -d` scratch), recorded as an `E` line; `git diff --name-only main...HEAD` touches the crate, the schema package, the tests and their declared docs surfaces only — no state-file version bump, no envelope field, no `test` deleted.

## Impact

Four code surfaces, one config contract, and the prose that repeats the closed
list.

- **`packages/agentic-workflow/src/batch-scheduler/index.mjs`** — `surfaceKey`,
  `surfaceKeyFor` and every function between them and the plan (`surfaceKeys`,
  `resolveBodySurfaces`, `extractSurfaces`, `unitDocSurfaces`, `resolveSurfaces`,
  the `--infer-surfaces` branch) gain one `vocabulary` argument; the tree-root
  lane rule stops being `skills`/`packages`-specific.
- **`packages/agentic-workflow/src/batch-scheduler/vocabulary.mjs`** (new) — the
  resolver: the shipped roots, the project's declared entries read through the
  config API, and the tree discovery an undeclared project gets. One owner, both
  consumers import it.
- **`packages/agentic-workflow-schema/src/config.ts` (+
  `config.schema.json`)** — one new base section, regenerated through its
  generator, never hand-edited.
- **`scripts/batch-scheduler.test.mjs`** — the frozen-failure corpus, one case
  per requirement, plus the regression case that this repository's own keys are
  unchanged.
- **Prose that restates the closed list**: `docs/workflow/CONFIG.md`,
  `skills/batch-scheduler/references/PLAN.md` (the owner),
  `skills/batch-scheduler/SKILL.md`, `skills/triage-issue/SKILL.md` +
  `references/ISSUE_PROCESS.md`, `skills/init-workspace/references/CONFIG.md`,
  the four unit-doc templates and the two issue forms, and
  `packages/agentic-workflow/README.md`.
- **This repository's own config** — `.pi/agentic-workflow.json` is committed and
  carries explicit defaults; the new section is materialized through
  `runner config default`, never hand-written.

What to ask before touching: the declared shape of the config key (a project's
own vocabulary is the owner's data model) — resolved at the cut by the recorded
fix sentence (`S9`) and by the config policy's carrier rule (`D1`).

## Surfaces

- `packages/agentic-workflow`
- `packages/agentic-workflow-schema`
- `skills/batch-scheduler`
- `skills/triage-issue`
- `skills/init-workspace`
- `scripts`
- `docs`
- `.github`
- `template`

## Retirements

Two surfaces this unit retires, each replaced in the same change:

- **the hardcoded producer vocabulary** — the two inline lists in `surfaceKey`
  (`["scripts", "docs", "template", ".github"]` and the `skills`/`packages`
  branch) and the parallel one in `surfaceKeyFor`, replaced by
  `SHIPPED_SURFACE_ROOTS` in `vocabulary.mjs`. Consumer:
  `packages/agentic-workflow/src/batch-scheduler/index.mjs` (the only owner).
  Negative-capability pin: `rg -n 'top === "skills"' packages/agentic-workflow/src/batch-scheduler/` → 0, and
  `rg -c 'SHIPPED_SURFACE_ROOTS' packages/agentic-workflow/src/batch-scheduler/index.mjs` → ≥ 1.
- **the `skills`/`packages`-only tree-root rule** in the plan's lane derivation,
  replaced by the vocabulary-agnostic "a key that is a strict prefix of another
  row's key joins its children". Pin: `rg -n 'root !== "skills" \&\& root !== "packages"' packages/agentic-workflow/src/batch-scheduler/index.mjs` → 0.

The `surface-unknown` token is **not** retired: it stays the honest answer when
the project's own vocabulary and tree both name nothing.

## Non-goals

- **Not a generic "any first-level directory is a lane" rewrite of the producer.**
  Discovery is the undeclared-project fallback; a project that declares gets its
  declaration, exactly (`D2`, `D4`).
- **No new envelope field, no state-file version bump, no `batch-plan@5`.** The
  vocabulary is data the producer reads; the envelope keeps `lane.surface` a
  bounded string (`S5`).
- **No migration of any existing project's declarations.** An existing
  `## Surfaces` body keeps its keys, because the shipped roots are always
  recognized (`S9`).
- **Not the #717 sweep.** Other surfaces that assume this repository's tree are
  that issue's; this unit fixes the scheduler's vocabulary and its emitter only.
- **No network read.** Discovery walks the project tree; the forge is untouched.

## Risk tier

Copied verbatim from `runner ceremony tier classify` at the cut head (the
command's own output, `## Log` E1).

- **Tier** — `standard` · **Task Size** — `{understood: true, contained_risk: "contained", resumable_from_diff: true}`
- **Named high-risk item** — none — not a high-tier unit (`signals: []`)
- **Why `standard`, from the verdict (`## Log` E1)** — `reason_kind: executable-content`, 7 escalating paths (the two issue forms, the config schema and its source, the planner module, the new resolver, the suite); `task_size.ceremony: unit-doc`, `verification: gates`.

## Future

- **2026-11-24 (#716 §"Suggested directions" 2) — generic derivation for the
  producer.** "Any first-level directory becomes `top`" without requiring the
  tree walk that discovery does. Status: `discarded 2026-11-24` — direction 1+3
  is the owner's recorded selection, and discovery already answers the
  unconfigured project without redefining a declared one.

## Future cost

- **A project that renames a lane tree must update `batchScheduler.surfaces`.**
  Binds: the project's operator. Discovery covers only undeclared projects, so a
  rename is a config edit, and the emitter's advisory names the key.
- **A new shipped root is a schema-package release.** Binds: this repository —
  `SHIPPED_SURFACE_ROOTS` is the only list, and every consumer imports it (`IR1`).

## Applicable tests

- `bun test scripts/batch-scheduler.test.mjs` — the planner's suite: the frozen
  failure corpus (`S2`–`S9` cases), the regression case that this repository's
  keys do not move (`S9`), and the emitter's block output (`S6`).
- `cd packages/agentic-workflow-schema && bun run test` — the config contract,
  the regenerated schema artifact and the envelope (the section is declared, a
  malformed entry is refused, `lane.surface` stays a bounded string).
- `bun scripts/local-gate.mjs` — the repository gate, at handoff.

## Known pre-existing issues

- **`renderHumanSummary`/`printHumanSummary` prints one joined claimed-surfaces
  line** (unit 621's B2) — `does-not-affect` this unit: no summary line changes
  here, and the `claimed_surface` field's shape is untouched.
- **`docs/features/107-mechanization-inventory/INVENTORY.md` restates the
  envelope's field set** — `affects` this unit only in that the row keeps
  `batch-plan@4` (no field is added); the row is not edited, and the drift would
  be a version bump this unit does not make.
- **`docs/features/470-content-guard-layer` narrates `batch-plan@3`** — a sibling
  in-progress unit (unit 621's A3); `does-not-affect` this unit (no version move).

## Tasks

- P1 — Cut the unit doc and its two ledgers, and record the decisions and pre-existing issues beside it (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/716-batch-scheduler-surface-vocab/SPEC.md --no-git` exits 0)
  (Implements: S1)
  - Relevant files: docs/fix/716-batch-scheduler-surface-vocab/SPEC.md, docs/fix/716-batch-scheduler-surface-vocab/planning-evidence.md, docs/fix/716-batch-scheduler-surface-vocab/planning-obligations.md, docs/fix/716-batch-scheduler-surface-vocab/decisions.md, docs/fix/716-batch-scheduler-surface-vocab/known-issues.md
- P2 — RED: the vocabulary cases land alone, observed failing on the behaviour they judge (validator: `bun test scripts/batch-scheduler.test.mjs` exits 1 and the failing case names are recorded as an `E` line)
  (Implements: S2, S3, S4, S6, S7)
  - Relevant files: scripts/batch-scheduler.test.mjs
- P3 — The config section: `batchScheduler.surfaces` is declared, documented and its committed projection regenerated (validator: `cd packages/agentic-workflow-schema && bun run test` exits 0)
  (Implements: S5, S8)
  - Relevant files: packages/agentic-workflow-schema/src/config.ts, packages/agentic-workflow-schema/config.schema.json, packages/agentic-workflow-schema/test/config-contract.test.mjs
- P4 — The resolver: one module owns the shipped roots, the declared entries and the tree discovery (validator: `bun test scripts/batch-scheduler.test.mjs` exits 0 with the vocabulary cases green)
  (Implements: S2, S4, S9)
  - Relevant files: packages/agentic-workflow/src/batch-scheduler/vocabulary.mjs
- P5 — The producer: the plan, the unit-doc fallback and the branch-diff side all read the resolver, and the tree-root lane rule stops naming two folders (validator: `bun test scripts/batch-scheduler.test.mjs` exits 0)
  (Implements: S2, S4, S7, S9)
  - Relevant files: packages/agentic-workflow/src/batch-scheduler/index.mjs
- P6 — The emitter: `--infer-surfaces` prints the block from the same resolver and names the config key once when discovery answered (validator: `bun test scripts/batch-scheduler.test.mjs` exits 0 with the emitter case green)
  (Implements: S6)
  - Relevant files: packages/agentic-workflow/src/batch-scheduler/index.mjs
- P7 — Docs currency: every prose restatement of the closed list names the owner, and the scaffold asks a project for its lane trees (validator: `bun scripts/skill-lint.mjs` exits 0 and `rg -n 'skills/<name>`, `packages/<name>`, `scripts`, `docs`, `template`, `.github`' skills docs template .github` reports only the owner's page)
  (Implements: S3, S8, S9)
  - Relevant files: skills/batch-scheduler/references/PLAN.md, skills/batch-scheduler/SKILL.md, skills/triage-issue/SKILL.md, skills/triage-issue/references/ISSUE_PROCESS.md, skills/init-workspace/references/CONFIG.md, docs/workflow/CONFIG.md, docs/fix/_TEMPLATE/SPEC.md, docs/features/_TEMPLATE/SPEC.md, template/docs/fix/_TEMPLATE/SPEC.md, template/docs/features/_TEMPLATE/SPEC.md, .github/ISSUE_TEMPLATE/fix.yml, .github/ISSUE_TEMPLATE/feature.yml, packages/agentic-workflow/README.md
- P8 — Units and state: the roadmap row through the emitter, the changeset, this repository's own materialized config value, and the session journal fragment (validator: `bun scripts/docs-generate.mjs --check` exits 0 and `bun scripts/lint-changeset.mjs .changeset/716-batch-scheduler-surface-vocab.md` exits 0)
  (Implements: S1, S3)
  - Relevant files: docs/ROADMAP.md, .changeset/716-batch-scheduler-surface-vocab.md, .pi/agentic-workflow.json, .agentic-workflow/journal/
- P9 — Verification: the frozen corpus, the differential against the base commit and the obligation ledger closed (validator: `bun scripts/local-gate.mjs` exits 0 and every obligations row reads `verified`)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8, S9, S10)
  - Relevant files: docs/fix/716-batch-scheduler-surface-vocab/planning-obligations.md, docs/fix/716-batch-scheduler-surface-vocab/SPEC.md

## Triaged steps

`runner unit-route --triage 716` at the cut head, verbatim:

```text
TRIAGE — 716 (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
relay: bootstrap-needed — no packet at .pi-web/relays/716-batch-scheduler-surface-vocab
relay-next: create .pi-web/relays/716-batch-scheduler-surface-vocab/ (charter → docs/fix/716-batch-scheduler-surface-vocab/SPEC.md) then dispatch_relay(packet: ".pi-web/relays/716-batch-scheduler-surface-vocab", leg: "1") · legs: 10 = 9 phases + 1 coherence review
```

The `review` step is replaced by the owner's external verification: this unit is
applied inline by the owner's workflow (`## Log` L2), so no review pack, no
`audit-pr` and no fold cycle runs on it.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-24, the operator's order, verbatim:
  ```
  Apply to this repository: issue #716
  ```
- **L2** — 2026-11-24, the operator's governing workflow for this application, verbatim (the part that binds the procedure):
  ```
  ## 0. Resolve the intent from state before acting

  Print the resolution **before** any action — the state decides the sequence, the words only pick the verb:

  - **continue** → the next incomplete phase from the unit doc (`P<n>` unticked);
  - **fix findings / repair** → read the unit dir's latest `EXTERNAL VERIFY` block (or last review verdict) and run one correction batch on its blockers, per correction history (§9);
  - **re-verify** → hand off to `/aw-local-review` on the current head;
  - plain prose → infer the closest of the three; state contradicts the intent → stop and report it with evidence.
  ...
  4. Work inline — never run this repo's own machinery on its own surgery

  No `review-change`, no `audit-pr`, no fold cycle, no self-granted gate exceptions on this change. Direct application: the §5 ledger freeze **is** the plan; implement against it, hand the diff to me. The one exception is the repo's deterministic gates (tests, lints) — run those always.
  ```
- **L3** — 2026-11-24, the intent resolved from state before any action: branch `feat/716-batch-scheduler-surface-vocab` cut from `022769f8b`, zero commits ahead of `main`, no unit dir on disk, no review verdict and no `EXTERNAL VERIFY` block → **continue** at the first incomplete phase, which is §5's ledger cut (nothing exists to continue). No question is owed: the workflow's own steps decide the sequence.
- **D1** — 2026-11-24, the declaration's carrier is the unified config (`batchScheduler.surfaces` in the base `agentic-workflow.json`), not the charter and not a `.agentic-workflow/` block. Authority: the issue's `## Evidence` §5 lists the intended homes and finds none, the owner's recorded fix sentence says "configurable per project", and the repository's config policy makes the unified config the only place a user-tunable setting lives (`AGENTS.md` § Config policy; `docs/workflow/CONFIG.md`). Recorded in `decisions.md`.
- **D2** — 2026-11-24, the resolution order is shipped roots → declared entries → tree discovery, where the first two are one stage (so a declared entry refines a shipped root) and discovery answers only when nothing is declared. Authority: `S9` direction 1 ("reads it first, falls back to the built-in list for unconfigured repos") plus `S10`'s "additive" rollback. Recorded in `decisions.md`.
- **P1** — 2026-11-24, the unit doc, the two ledgers, the decision record and the known-issues record are cut; the acceptance section is frozen before the first line of code. Commit `747ad4169`.
- **E1** — 2026-11-24, `bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify --paths "<the 15 planned paths>"` · exit 0 · `tier: standard`, `reason_kind: executable-content`, 7 escalating paths, `signals: []` — copied verbatim into `## Risk tier`.
- **E2** — 2026-11-24, `bun test scripts/batch-scheduler.test.mjs` at the RED commit `52bfda3e8` · exit 1 · `97 pass / 9 fail`; the nine are `S2: a foreign tree resolves…`, `S3: the emitter and the producer read one vocabulary…`, `S4: a branch diff and a body declaration…`, `S6: --infer-surfaces prints the block for a foreign tree…`, `S7: a consumer-shaped set plans in parallel lanes…`, `S9: a bare tree root joins the children declared in the run`, `S9: an unreadable config degrades by name…`, `S9: the shipped roots are still recognized whatever a project declares`, `S10: the shipped vocabulary has one owner and no second copy`. The tenth case (`S8: a declared vocabulary excludes a tree it does not name`) passes on the old code because the old code discovered nothing — it is the exclusion half only the pair proves.
- **P2** — 2026-11-24, the frozen-failure corpus lands alone and is observed failing on the behaviour it judges. Commit `52bfda3e8`.
- **E3** — 2026-11-24, `bun test scripts/batch-scheduler.test.mjs` · exit 0 · `106 pass / 0 fail` (the ten new cases plus the 96 the suite carried).
- **E4** — 2026-11-24, `cd packages/agentic-workflow-schema && bun run build && bun run generate:config-schema` · exit 0 · `wrote config.schema.json`; then `bun run test` · exit 0 · `954 pass / 0 fail` (the section, its refusal cases, the regenerated artifact and the section-list pin).
- **E5** — 2026-11-24, the differential on this repository's own corpus (`/tmp` fixture, both runs `--root <base checkout> --no-state --json-only`): base `022769f8b` and head each print 6,456 bytes and `diff` exits 0 — the shipped-tree declarations, the dependency layers and the `surface-unknown` rows are byte-identical.
- **E6** — 2026-11-24, the differential on the consumer-shaped corpus (`src/pages`, `src/shared`, `migrations` in one tree): base degrades `surface-unknown-issue-201/202/203`, one `general` lane, `blind-spot` finding; head plans three lanes (`migrations`, `src/pages`, `src/shared`), `degraded: []`, `findings: []` — the requested difference, and the only one.
- **E7** — 2026-11-24, `rg -n 'top === "skills"' packages/agentic-workflow/src/batch-scheduler/index.mjs` → no match (exit 1); `rg -n 'root !== "skills"' …` → no match (exit 1); `rg -c 'SHIPPED_SURFACE_ROOTS' packages/agentic-workflow/src/batch-scheduler/index.mjs` → `1`.
- **E8** — 2026-11-24, the config's one writer in a `mktemp -d` project: `cd <scratch> && bun <bin> config set batchScheduler.surfaces '["src/pages","src/shared"]' --scope project` · exit 0 · the file carries `{"batchScheduler":{"surfaces":["src/pages","src/shared"]}}`; the same command with `'["src/*"]'` · exit 2 · `CONFIG REFUSAL — "batchScheduler.surfaces" was not written · batchScheduler.surfaces[0]: must match ^[^/*<>][^<>*]*$`. **Live-tree side effect, disclosed and cleaned:** the first attempt ran in this worktree and wrote the array into the committed `.pi/agentic-workflow.json`; it was reverted with `git checkout` in the same minute, the file is byte-identical to its committed state, and the scratch rerun is the evidence recorded here.
- **E9** — 2026-11-24, the emitters and lints: `bun scripts/docs-generate.mjs --check` · exit 0 · `3 checked · 0 stale`; `bun scripts/skill-lint.mjs` · exit 0 · `0 finding(s)`; `bun scripts/check-skill-context.mjs` · exit 0 · `PASS context budgets: 33 skills`; `--routes` · exit 0 · `PASS route budgets: 14 routes`; `bun packages/agentic-workflow/bin/agentic-workflow.mjs scaffold-contract check` · exit 0 · `SHELL OK`-pair `MATCH`, `verdict SCAFFOLD OK`.
- **E10** — 2026-11-24, the crate and package suites: `packages/agentic-workflow` `bun ../../scripts/run-root-suite.mjs --dir packages/agentic-workflow/test --suite-timeout 1200 --jobs 1` · exit 0 · `84/84` suites PASS; the same set under `bun run test:node` · no FAIL line; `cd packages/agentic-workflow-schema && bun run test:node` · `954 pass / 0 fail`; `cd packages/pi-agentic-workflow && bun run test` · `1115 pass / 0 fail`; `bun run test:node` · `1114 pass / 1 skipped / 0 fail`.
- **E11** — 2026-11-24, `bun scripts/local-gate.mjs --only workspace-install,schema-build,version-parity-content,docs-generated-projection,skill-context-budgets,journal-carrier-check,log-immutability,push-identity,secret-scan,temp-hygiene,tmp-gc,worktree-guard,rigidity-review,dimension-regression,dependency-pin-gate,dependency-advisories --jobs 2` · exit 0 · `local-gate: PASS — 14 step(s) in 7s`; `--only pi-compat-guard` · exit 0 · `pi leg 1.1.0: tsc --noEmit clean`, `pi leg latest: tsc --noEmit clean`.
- **E12** — 2026-11-24, the gate's two test-bearing steps, honestly: the root suite `bun scripts/run-root-suite.mjs --jobs 1 --test-timeout 60 --suite-timeout 900` → `142 PASS / 2 FAIL` of 144 suites, both red at the base commit as well (`scripts/findings-corpus.test.mjs` `1178 !== 1173` and `scripts/workflow-doctor.test.mjs` `pin null !== "4.10.1"` — `## Known pre-existing issues` K6/K8), and `crate-suite-bun` under the gate's own 240s suite wall hit `SUITE TIMEOUT` on `doc.structure.test.mjs` while that suite's content passes (`owner parity (S11)` 202,812 ms under `load average` 17 on 6 cores; the same suite standalone 288s, 19/19 pass — K7).
- **E13** — 2026-11-24, `bun packages/agentic-workflow/bin/agentic-workflow.mjs config default --scope project` · exit 0 · `1 file(s) written · 1 key(s) materialized · 0 removed` — the new section enters this repository's committed config through its engine, and the backup file it leaves behind is removed.
- **E14** — 2026-11-24, `rg -n '<the closed list>' skills template .github docs packages/agentic-workflow/README.md` → exactly one match, the owner's own page (`skills/batch-scheduler/references/PLAN.md` § The surface vocabulary); `docs/workflow/CONFIG.md`'s row and `packages/agentic-workflow/README.md`'s row name that owner instead of restating it.
- **E15** — 2026-11-24, `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/716-batch-scheduler-surface-vocab/SPEC.md --no-git` → the only violations are the `obligations-open` rows this ledger closes below.
- **P3** — 2026-11-24, the config section, its regenerated projection and its contract case. Commit `82b530930`.
- **P4** — 2026-11-24, the resolver module: shipped roots, declared entries, bounded tree discovery, one `surfaceKey`. Commit `82b530930`.
- **P5** — 2026-11-24, the producer reads the resolver on both sides, and the tree-root lane rule stops naming two folders. Commit `82b530930`.
- **P6** — 2026-11-24, the emitter resolves through the same vocabulary and names the config key once on stderr. Commit `82b530930`.
- **P7** — 2026-11-24, docs currency across the owner page, the config guides, the scaffold offer, triage's contract and the crate README. Commit `82b530930`.
- **P8** — 2026-11-24, the roadmap row through `docs-generate`, the changeset, the materialized config section and the journal fragment. Commit `82b530930`.
- **P9** — 2026-11-24, verification: the frozen corpus green, the differential on both corpora, the twelve gate steps proven individually (E6–E12, E15), the obligations ledger closed (`19 verified`) and the two pre-existing reds recorded as K6/K8 with their base-commit reproduction. Commit `a77928c17`.
- **D11** — 2026-11-24, `O19` stays `in-progress` instead of `verified`: two of its three validators exit 0 (`skill-lint`, `check-skill-context`) and the third — `bun scripts/local-gate.mjs` — exits 1 on two suites that are already red at `022769f8b` (K6's frozen count, K8's absent pin) plus one suite wall that only a contended box crosses (K7). Marking the row verified would be self-approval of an outcome no run produced, so the row is handed over open with its cause; repairing another unit's frozen count is not this unit's scope.
- **D10** — 2026-11-24, the session fragment is the one the writer accepted, not the one I would have written last: `journal write` computed its commit count (2) at the moment it ran, and its errata route is closed for this repository's shared `local` identity — `--supersedes` is refused with "cannot correct the shared local identity — it is not a conversation, and an errata corrects one conversation's entry (`journal-write-grammar@1`)". The fragment therefore stands as the snapshot it is, and this `## Log` carries the full evidence.

## Next

P2 — land the frozen-failure corpus alone and observe it failing on the behaviour
it judges.

## References

- Issue [#716](https://github.com/gtrabanco/agentic-workflow/issues/716) — the
  request this unit applies, quoted verbatim in `## Specs`.
- Issue [#717](https://github.com/gtrabanco/agentic-workflow/issues/717) — the
  sibling sweep of the same leak class; depends on this unit's vocabulary.
- `docs/fix/574-batch-scheduler-surface-detection/` — the surface-declaration
  unit (`SURFACE_SECTIONS`, `surface-unknown`, the `--infer-surfaces` emitter).
- `docs/fix/621-batch-scheduler-surface-verification/` — the `claimed_surface`
  side of the same resolver.
- `docs/ROADMAP.md` row `716 | batch-scheduler-surface-vocab` — the owner's
  recorded fix sentence (`S9`).

## Branch

`feat/716-batch-scheduler-surface-vocab`

## Depends on

Empty — independent. (#717 depends on this unit, not the reverse.)

## Regression scope

| scenario | verifier |
|---|---|
| this repository's declared surface keys are unchanged (`skills/<name>`, `packages/<name>`, `scripts`, `docs`, `template`, `.github`) | `bun test scripts/batch-scheduler.test.mjs` — the case `S9: the shipped roots are still recognized whatever a project declares` plus the pre-existing `B3`/`F9` cases |
| a body that declares nothing still degrades to `surface-unknown-issue-<n>`, and two such rows are still one `blind-spot` | pre-existing cases `F4`, `F5` in `scripts/batch-scheduler.test.mjs` |
| the `## Surfaces` section stays exclusive over `## Where`/`## In scope`, and file claims are unchanged | pre-existing cases `F1`–`F3`, `F8` |
| the envelope still validates as `batch-plan@4` with `lane.surface` a bounded string and no new field | `bun test packages/agentic-workflow-schema/test/batch-plan.test.mjs` |
| the committed config still validates, and every config surface still resolves | `bun scripts/local-config-contract.test.mjs` and `bun test packages/agentic-workflow/test/config-cli.test.mjs` |
| this repository's own plan does not move | the base-vs-head differential recorded as an `E` line (`S10`) |
