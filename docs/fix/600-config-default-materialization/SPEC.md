---
type: feature
scope: large
roadmap_summary: Issue [#600](https://github.com/gtrabanco/agentic-workflow/issues/600) (L): `config default` materializes every declared key into the config files with English comments, merges (never clobbers) operator values, drops schema-absent keys and backs the file up first; `/aw-settings` offers the same engine, the doctor reports key-set divergence, and `init-workspace` asks once. SPEC: [SPEC](fix/600-config-default-materialization/SPEC.md)
---

# fix/600-config-default-materialization

> Fix specification — applied through the owner's local, unpublished workflow:
> the ledgers below are frozen at cut, the change is worked inline, and the owner
> is the external verifier.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#600` — [NEW FEATURE: config default materialization — explicit documented
defaults in config files (CLI `config default`, /aw-settings option,
init-workspace consent, add/remove reconciliation with
backup)](https://github.com/gtrabanco/agentic-workflow/issues/600). The PR closes
it via `Closes #600`.

## Specs

**S0 — Apply the issue to this repository.**
> Apply to this repository: issue #600

**S1 — The CLI materializes explicit, documented defaults.**
> ```
> agentic-workflow config default [--scope global|project|both] [--no-backup] [--project <dir>] [--global-dir <dir>] [--json]
> ```
>
> - Writes every declared section/key **explicitly** into the config file(s), each with an English comment documenting the option (description + type + shipped default, sourced from the schema — the same data `config list` exposes). Comments in English only, per repo rule.

**S2 — Merge, never clobber; reconcile the schema's key set.**
> - **Merge, never clobber**: if the file exists, current user values are preserved verbatim — only keys the operator left undefined gain their explicit default; a user-set value is never overwritten by its default. Keys that no longer exist in the schema are removed (with the file's backup taken first, below).

**S3 — Backup before modifying; `--no-backup` is the CLI opt-out.**
> - **Backup before any existing file is modified**: `<file>.bak-<timestamp>` beside the file (or a declared backups dir). The backup is unconditional when the file exists — **`--no-backup` is the opt-out** (CLI only; no equivalent opt-out elsewhere).

**S4 — Idempotent.**
> - Idempotent: running it twice produces no diff the second time (stability check in the unit's suite).

**S5 — Extension files follow the installed packages through discovery.**
> - Extension files follow the installed packages: base `agentic-workflow.json` always; `pi-agentic-workflow.json` when `pi-agentic-workflow` is installed (its descriptor's schema/defaults drive the comments); the pi-nan extension likewise when that package is installed — via the existing `config-extension@1` discovery (`src/config/discovery.mjs`), so the mechanism is generic, not a per-package special case.

**S6 — Feedback on stderr, machine receipt on stdout.**
> - **Feedback channel**: start/what-it-is-doing/how-long through the runner crate's `src/feedback/index.mjs`, stderr only; stdout carries the machine receipt (files touched, keys materialized, keys removed, backup paths).

**S7 — The settings console offers the same operation.**
> - New menu entry: **"Materialize default values into the config files"** — with a pre-run explanation (what will happen, that current values are preserved, that a backup is made, where the files live). Writes the same output as the CLI (same engine, same backup rule, same extension coverage for pi + pi-nan). No backup opt-out from the console.

**S8 — Upstream add/remove reconciliation, reported by the doctor.**
> - When the schema adds or removes options (any section, base or extension), the materialize operation is the reconciliation path: new keys gain explicit defaults + comments; removed keys are dropped from the file — **after the pre-modification backup**. (What triggers a re-run — the operator, `/aw-settings`, or a doctor notice that the file's key set diverges from the schema — is a design decision for the unit; the divergence check itself is cheap and deterministic.)
> - `doctor` is the natural reporter: a check that compares each existing config file's key set against the schema and reports "new options available — run config default" / "file contains removed keys — backup + materialize" (status vocabulary already exists).

**S9 — init-workspace asks once, with the explanatory wording.**
> - After install, init-workspace asks — clearly worded so the operator understands **what happens, what it is for, and where the files are** — whether to materialize the explicit defaults now. Yes ⇒ the same engine runs (backup rule included); No ⇒ nothing is written. The interview-bank block owns the wording.

**S10 — Docs + norms ship in the same change.**
> - `docs/workflow/CONFIG.md` (the human guide) gains the `config default` operation and the merge/backup contract; `runner-contract` gains the command pin; the feedback contract applies to the new command; budgets re-based; changeset.

**S11 — The declared non-goals.**
> - No change to resolution semantics — defaults stay fill-in-the-gaps at resolve time; materialization only makes them visible and editable. An explicit default in the file must resolve identically to an absent one.
> - No deep-merge introduction; no coercion; unknown keys keep being refused (materialize removes them only in its own explicit, backed-up operation — never in `validate --sanitize`'s place).
> - No auto-write of config files without the operator's action: doctor reports, init-workspace asks, the console offers — nothing rewrites config in the background.
> - No translation of comments (English-only).
> - No decision-model dependency.

## Impact

- **The config CLI**: `config default` joins the `config` switch; the operation
  writes files, so it is the one config op (besides `set`/`init`/`reset`/
  `validate --sanitize`) that mutates. `get/set/list/show/validate/init/reset/
  schema` keep their exact output — `config-cli.test.mjs` is the regression
  suite and is not edited for them.
- **The store**: a backup is a byte copy beside the file. `writeConfigDocument`
  stays the atomic writer; the renderer is new (`renderConfigFile`) and is the
  only writer that emits comments, so `set/reset/validate --sanitize` keep
  writing comment-free pretty JSON exactly as today.
- **The schema package**: `typeOf` becomes exported (`schemaTypeName`) so the
  renderer names a type the same way `config list` does; missing key
  descriptions are filled for the base sections and the pi extension descriptor
  so a materialized comment documents the option instead of repeating the
  section sentence. No schema shape, default, enum or validation rule changes.
- **The doctor**: a probe without a documented inventory row refuses the whole
  run, so the new `config-files` row and its probe land together. Two suites pin
  the row count (15); adding a documented surface moves those pins to 16 — the
  per-row assertions (ids, statuses, one line each) are kept and extended, never
  relaxed.
- **The settings console**: the menu gains one non-draft action (the
  `embedProfile` precedent); the draft, the scope prompt and the save path are
  untouched, so the console's own file edits keep their comment-preserving
  writer.
- **init-workspace**: one bank row (`CFG-01`) plus its charter slot in
  `template/AGENTS.md`, and the operational step in
  `skills/init-workspace/references/CONFIG.md`. The reference budget's largest
  document is untouched, so no reference ceiling re-base is expected; the
  charter-bank check runs in the gate and pins the new row's landing slot.
- **Live-tree guard**: the engine writes files. While it is being built it runs
  only inside `mktemp -d` fixtures copied from the golden shape, never against
  this repository's `.pi/` or `~/.pi/agent/`. The one real run this unit does is
  a differential run of the **unchanged** config commands against a `git
  archive` of the base commit.

## Surfaces

- `packages/agentic-workflow`
- `packages/agentic-workflow-schema`
- `packages/pi-agentic-workflow`
- `skills/init-workspace`
- `template`
- `docs`

## Retirements

Nothing is retired: the unit is additive (a new operation, a new probe, a new
menu entry, a new bank row) and no existing surface is renamed or removed. The
computed surface inventory is the anti-divergence receipt:

```bash
runner residual-classify --inventory --base main
```

Receipt: 18 added surfaces · 16 `used` (live consumer) · 2 `andamio` with a
recorded planned consumer (`decisions.md` §`residual-promise@1`) · 0 `orphan` ·
0 `ambiguous`. The two recorded ones are the hand-written `.d.mts` (its consumer
is the console's TypeScript import, which the scan cannot follow through the
type-only import) and the new suite (its consumer is this unit's declared test
step); every other added surface is found by the executable scan — the CLI
dispatch, the doctor probe, the console, the bank check.

## Non-goals

S11 verbatim is the whole non-goal list. Beyond it this unit does not: touch the
resolution/merge semantics (`fillDefaults`, `mergeValues`, `resolveConfigDocuments`);
add a config key; change `validate --sanitize`; write any config file from a
background hook; translate a comment; or run a review/fold cycle on its own
change (the owner's workflow substitutes for it, §Risk tier).

## Risk tier

Computed, never chosen — `runner ceremony tier classify` at the cut:

```json
{
  "contract": "risk-tier-verdict@1",
  "tier": "high",
  "reason": "1 path(s) touch a named high-risk surface: destructive (packages/agentic-workflow/bin/agentic-workflow.mjs · ../src/doc/retrieval.mjs · (module-level))",
  "reason_kind": "named-high-risk",
  "task_size": {
    "understood": true,
    "contained_risk": "named",
    "resumable_from_diff": true,
    "ceremony": "unit-doc+review-change",
    "verification": "review-change"
  },
  "signals": [
    { "path": "packages/agentic-workflow/bin/agentic-workflow.mjs", "signal": "destructive" }
  ]
}
```

- **Tier** — `high` · **Task Size** — `understood`, `contained_risk: named`, `resumable_from_diff: true`
- **Named high-risk item** — `packages/agentic-workflow/bin/agentic-workflow.mjs` · `destructive`: the operation copies then rewrites an operator's config files. The containment is the design: a byte backup before any existing file is modified, an atomic write, a refusal that leaves the file untouched, and a live-tree guard that keeps the engine in scratch fixtures until it is verified.

The verdict's `ceremony: unit-doc+review-change` is replaced by the owner's
explicit local workflow (`/aw-local-apply` item 4: no `review-change`, no
`audit-pr`, no fold cycle on this change); the owner is the external verifier,
and the deterministic gate still runs. Recorded as a decision, never a silent
skip.

## Future

- Deferred (issue #600, "Where"): a declared backups directory instead of
  `<file>.bak-<timestamp>` beside the file — **open**, this unit keeps the
  beside-the-file form the issue's first spelling names.
- Deferred (issue #600, design decision left to the unit): a doctor notice is
  the trigger this unit ships; a scheduled/`agent_settled` re-run is **open** and
  deliberately not built (S11: nothing writes config in the background).

## Future cost

- Every new base config key must be described in `config.ts`, because the
  materialized comment is the schema's own description; an undescribed key now
  repeats its section sentence in the operator's file. Binds whoever adds a key
  (owner: `docs/workflow/CONFIG.md` §Adding a config key to a feature).
- Every new doctor surface must land with its `tool-inventory@1` row in the same
  change (the doctor refuses a probe with no row). Binds whoever adds a probe.

## Applicable tests

- `packages/agentic-workflow/test/config-materialize.test.mjs` — the engine, the
  renderer, the merge/backup/idempotency/removal rules and the divergence check
  (new suite, red first).
- `packages/agentic-workflow/test/config-cli.test.mjs` — `config default`'s CLI
  contract plus the regression cases for the existing operations.
- `packages/agentic-workflow/test/doctor.checks.test.mjs`,
  `doctor.inventory.test.mjs`, `doctor.cli.test.mjs` — the new documented row and
  its three statuses.
- `packages/pi-agentic-workflow/test/settings-console.test.mjs` — the menu entry,
  the pre-run explanation, the same receipt, no opt-out.
- `packages/agentic-workflow/test/charter.test.mjs` — the shipped bank still
  passes its own check with `CFG-01` and the template's slot.
- Scripts: `bun test scripts/normative-drift.test.mjs` (the new README row
  resolves), `bun test scripts/scaffold-guide.test.mjs` (the template slot),
  `bun scripts/docs-generate.mjs --check`.

## Known pre-existing issues

- `packages/agentic-workflow-schema/dist/` is a gitignored build output; a fresh
  worktree refuses several suites until `bun run build` runs there. **Affects**
  this unit's verification only (resolved by building before the suites).
- The interview bank's `check` needs a guide carrying the charter slots; this
  repository's own `AGENTS.md` carries no `## Project charter`. **Does not
  affect** this unit: the shipped bank is checked against `template/AGENTS.md`,
  the precedent `charter.test.mjs` already pins.
- The concurrent worktree actor has deleted this worktree once during the unit
  (2026-11-21 01:21, before the first commit). **Affects** nothing landed; the
  branch was recreated from `main` and every commit after that is on the branch.

## Acceptance criteria

- **AC-S1** — `config default` on a fresh scope writes every declared base
  section explicitly, each with an English comment naming the option, its type
  and its shipped default, and the file parses back to the resolved defaults.
  Check: `bun test packages/agentic-workflow/test/config-materialize.test.mjs`
  exits 0 with the `fresh scope` case, which asserts one `// <path>` comment line
  per materialized key.
- **AC-S2** — On an existing file the operator's values survive verbatim, only
  undefined keys gain their default, and a key the schema no longer declares is
  dropped; the backup is written before the drop. Check: the same suite's
  `merge` case (user overrides + a stale `guards` section + a stale leaf) exits 0
  and asserts the value set and the removed list.
- **AC-S3** — The backup is `<file>.bak-<timestamp>` beside the file; `--no-backup`
  skips it; the console has no opt-out. Check: `config-materialize.test.mjs`'s
  `backup` case, `config-cli.test.mjs`'s `--no-backup` case, and
  `settings-console.test.mjs`'s materialize case (the engine is called with
  `backup: true`).
- **AC-S4** — A second run produces no byte diff and no second backup. Check:
  the suite's `idempotent` case compares the two renders and the backup count.
- **AC-S5** — Extension files materialize only for discovered packages: a
  synthetic `config-extensions/*.json` yields its own file with its own defaults
  and comments; removing the descriptor stops the file being written. Check: the
  suite's `extension` case.
- **AC-S6** — Progress goes to stderr, the receipt (files, materialized paths,
  removed paths, backups) to stdout, and a refusal prints
  `CONFIG REFUSAL — <reason>` with exit 2 and an untouched file. Check:
  `config-cli.test.mjs`'s `config default` cases capture both streams and the
  file's bytes.
- **AC-S7** — `/aw-settings` offers "Materialize default values into the config
  files", explains what it does, where the files are and that a backup is made,
  and runs the same engine with `backup: true` and no opt-out. Check:
  `settings-console.test.mjs`'s case drives the prompt list and the injected ui.
- **AC-S8** — `doctor` reports an existing project config file whose key set
  diverges from the schema: `missing` names the new options and the advisory says
  `run agentic-workflow config default`; `removed` names the dropped keys; a
  converged file reports `ok`. Check: `doctor.checks.test.mjs`'s
  `config-files` case and `doctor.inventory.test.mjs`'s row list.
- **AC-S9** — `init-workspace` asks one consented question with the explanatory
  wording, "yes" runs the same engine (backup included) and "no" writes nothing;
  the wording lives in the interview bank (`CFG-01`) and lands in the template's
  charter slot. Check: `bun test packages/agentic-workflow/test/charter.test.mjs`
  exits 0 (the shipped bank passes) and `bun test scripts/scaffold-guide.test.mjs`
  exits 0 with the new slot.
- **AC-S10** — `docs/workflow/CONFIG.md` carries the operation, the merge/backup
  contract and the divergence notice; the crate README's `config` row and the
  bin usage line list `default`; `skills/runner-contract/references/RUNNER.md`
  names it; a changeset lists the three touched packages. Check:
  `bun test scripts/normative-drift.test.mjs` exits 0,
  `bun test packages/agentic-workflow/test/cli.surface.test.mjs` exits 0, and
  `bun scripts/lint-changeset.mjs` exits 0.
- **AC-S11** — The declared non-goals hold: a materialized file resolves
  identically to an absent one (`config show --json` byte-equal on a fixture), no
  deep merge or coercion is introduced, `validate --sanitize` still removes
  unknown keys only when asked, and no hook writes config. Check: the suite's
  `resolution parity` case and the untouched `config-cli.test.mjs` sanitize case.

## Tasks

- P1 — Freeze the contract as failing cases: the engine suite (fresh write, merge
  + stale removal, backup, `--no-backup`, idempotency, extension discovery,
  refusal paths, divergence), the CLI cases, the doctor cases, the console case
  and the bank/template case
  (validator: `bun test packages/agentic-workflow/test/config-materialize.test.mjs` exits 1 at this commit — the module does not exist yet)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8, S9, S11)
  - Relevant files: packages/agentic-workflow/test/config-materialize.test.mjs, packages/agentic-workflow/test/config-cli.test.mjs, packages/agentic-workflow/test/doctor.checks.test.mjs, packages/agentic-workflow/test/doctor.inventory.test.mjs, packages/pi-agentic-workflow/test/settings-console.test.mjs
- P2 — The engine: `planSectionMutation`, `materializeConfig`, `renderConfigFile`
  and `configDivergence`, with the backup and the atomic write
  (validator: `bun test packages/agentic-workflow/test/config-materialize.test.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S11)
  - Relevant files: packages/agentic-workflow/src/config/materialize.mjs, packages/agentic-workflow/src/config/store.mjs, packages/agentic-workflow/src/config/api.mjs
- P3 — The CLI operation and its usage line, with the feedback attachment, the
  receipt and the refusal contract
  (validator: `bun test packages/agentic-workflow/test/config-cli.test.mjs` exits 0)
  (Implements: S1, S3, S6)
  - Relevant files: packages/agentic-workflow/bin/agentic-workflow.mjs
- P4 — The schema's missing key descriptions (base sections + the pi descriptor)
  so a materialized comment documents the option
  (validator: `bun test packages/agentic-workflow-schema/test/config-contract.test.mjs` exits 0 and `bun test packages/agentic-workflow/test/config-materialize.test.mjs` exits 0)
  (Implements: S1)
  - Relevant files: packages/agentic-workflow-schema/src/config.ts, packages/pi-agentic-workflow/agentic-workflow.config.json, packages/agentic-workflow-schema/config.schema.json
- P5 — The doctor's documented row and probe
  (validator: `bun test packages/agentic-workflow/test/doctor.checks.test.mjs packages/agentic-workflow/test/doctor.inventory.test.mjs packages/agentic-workflow/test/doctor.cli.test.mjs` exits 0)
  (Implements: S8)
  - Relevant files: packages/agentic-workflow/src/doctor/checks.mjs, packages/agentic-workflow/README.md, packages/agentic-workflow/test/doctor.*.test.mjs
- P6 — The settings console entry and its explanation
  (validator: `cd packages/pi-agentic-workflow && bun run test` exits 0)
  (Implements: S7)
  - Relevant files: packages/pi-agentic-workflow/src/settings/console.ts, packages/pi-agentic-workflow/test/settings-console.test.mjs
- P7 — init-workspace's consent question: the bank row, the template slot and the
  operational step
  (validator: `bun test packages/agentic-workflow/test/charter.test.mjs` exits 0 and `bun test scripts/scaffold-guide.test.mjs` exits 0)
  (Implements: S9)
  - Relevant files: skills/init-workspace/references/ENGINEERING_INTERVIEW.md, skills/init-workspace/references/CONFIG.md, template/AGENTS.md
- P8 — Documentation, the runner pin, the changeset and the differential run
  (validator: `bun test scripts/normative-drift.test.mjs` exits 0 and `bun scripts/lint-changeset.mjs` exits 0 and `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S10)
  - Relevant files: docs/workflow/CONFIG.md, packages/agentic-workflow/README.md, skills/runner-contract/references/RUNNER.md, .changeset/600-config-default-materialization.md, docs/ROADMAP.md
- P9 — Verification: the touched packages' suites, the root gate and the recorded
  evidence
  (validator: `node scripts/run-root-suite.mjs` exits 0 and `cd packages/agentic-workflow && bun run test` exits 0 and `cd packages/pi-agentic-workflow && bun run test` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11)
  - Relevant files: docs/fix/600-config-default-materialization/SPEC.md

## Triaged steps

n/a — the owner's local, unpublished workflow substitutes for the lane's triage
(`## Tasks` is the authoritative list; `unit-lane` is not run on this change).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-21, the applied issue, verbatim (the body's own heading and
  first section):
  ```
  NEW FEATURE: config default materialization — explicit documented defaults in config files (CLI `config default`, /aw-settings option, init-workspace consent, add/remove reconciliation with backup)
  ```
- **L2** — 2026-11-21, the owner's local workflow instruction, verbatim:
  ```
  Apply to this repository: issue #600

  This is a **local, unpublished** workflow for changing agentic-workflow itself.
  ```
- **D1** — 2026-11-21, cut decisions, recorded before the first line of code:
  (a) the materialized value is semantics-preserving — a key takes its default
  only where it is `undefined`, recursing over declared schema properties, so
  `resolveConfigDocuments` never sees a different config; (b) the comment is
  generated from the schema (`description ?? section description` + `type` +
  `default`), never hand-written, so it cannot drift; a key with no shipped
  default is documented but not written; (c) `--scope` defaults to `both` for
  this operation (the others default to `project`) because the operation
  reconciles every file the install owns; (d) the doctor reports the **project**
  scope only — it is a project doctor, and the global file belongs to the
  operator's own `config default --scope global`; (e) the console imports the
  crate's engine in-process (the package already depends on the crate at the same
  pin), so there is one implementation for CLI and console.
- **D2** — 2026-11-21, the risk verdict's `review-change` half is replaced by the
  owner's workflow (item 4), never by a self-granted exception: the deterministic
  gate runs, the owner verifies.
- **D3** — 2026-11-21, the two doctor suites pin the documented-surface count
  (15). Adding the `config-files` surface moves those pins to 16 **and** adds the
  row-level cases; the per-row assertions are not relaxed, so this is an extended
  contract, not a weakened test.
- **P1** — 2026-11-21, ledgers frozen and the worktree recovered after the
  concurrent actor removed it (see `## Known pre-existing issues`).
- **D4** — 2026-11-21, the engine writes through `writeConfigText` (the existing
  atomic writer) and takes the backup with a byte copy before it runs; the
  comment-free `writeConfigDocument` stays the only writer for
  `set`/`reset`/`validate --sanitize`, so their output is byte-identical to
  today's.
- **P2** — 2026-11-21, the RED corpus lands alone: the engine suite (11 cases), three
  `config default` CLI cases, two doctor cases, two console cases · `3a28ff8f1`.
- **E1** — 2026-11-21, the cut-head red, all four in one run · `bun test
  packages/agentic-workflow/test/config-materialize.test.mjs` · exit 1 · 1 error
  (`Cannot find module '../src/config/materialize.mjs'`); `…/config-cli.test.mjs`
  · 11 pass / 3 fail; `…/doctor.checks.test.mjs` · 21 pass / 2 fail; the pi
  package's suite · 1033 pass / 2 fail.
- **P3** — 2026-11-21, the engine, the renderer, the backup, the divergence report and
  the two schema-default repairs · `be9ddc102`.
- **E2** — 2026-11-21, `bun test packages/agentic-workflow/test/config-materialize.test.mjs`
  · exit 0 · 11 pass / 0 fail (fresh write with a comment per key, merge + stale
  removal, resolution parity, backup bytes, second-run no-op, extension discovery,
  broken-file and invalid-merge refusals, `--no-backup`, divergence, renderer).
- **P4** — 2026-11-21, the CLI operation and the doctor probe · `45fcc0263`.
- **E3** — 2026-11-21, `bun test packages/agentic-workflow/test/config-cli.test.mjs`
  · exit 0 · 14 pass / 0 fail (the ten pre-existing cases unedited plus the four
  `config default` cases: both scopes, merge + backup, `--no-backup`, refusals).
- **E4** — 2026-11-21, the config, doctor and surface suites together · `bun test
  config-materialize config-cli doctor.checks doctor.inventory doctor.cli
  doctor.vehicle doctor.wizard cli.surface` · exit 0 · 84 pass / 0 fail.
- **P5** — 2026-11-21, the console entry, the pre-run explanation and the pi
  descriptor's descriptions · `be149d642`.
- **E5** — 2026-11-21, `cd packages/agentic-workflow-schema && bun run test` · exit 0
  · 950 pass / 0 fail (55 files) — the `publisher: null` and `agentGuard.mode`
  repairs included.
- **E6** — 2026-11-21, `cd packages/pi-agentic-workflow && bun run test` · exit 0 ·
  1035 pass / 0 fail (89 files) — the committed descriptor is byte-equal to the
  module's published section again, and the console cases pass.
- **E7** — 2026-11-21, `bun run test` in `packages/agentic-workflow` · exit 0 · 78
  suites PASS (run-root-suite, 4 workers).
- **D5** — 2026-11-21, the two shipped defaults the schema refused are repaired, not
  worked around: `logSession.publisher` gains a `null` branch and
  `gitIdentity.agentGuard.mode` leaves the section default. The differential run
  (`E10`) is the evidence that the only visible deltas are those two facts.
- **D6** — 2026-11-21, the settings console imports the crate engine in-process and
  accepts it as an optional seam; the console test drives the seam, so the
  behaviour under test is the console's flow, while the engine's own suite owns
  the writes.
- **E8** — 2026-11-21, `bun test packages/agentic-workflow/test/charter.test.mjs
  scripts/scaffold-guide.test.mjs` · exit 0 · 34 pass / 0 fail — the shipped bank
  (18 rows, `CFG-01` included) still lands every answer in a slot the template
  carries.
- **E9** — 2026-11-21, the eight script suites the change touches · `bun test
  normative-drift prose-gate-inventory promise-coherence pre-execution-quality
  invocation-drift test-obligation-tags structural-sibling-pins
  version-parity-gate` · exit 0 · 179 pass / 1 skip / 0 fail; the review-loop
  count pin (22→23 charter slots) moved with the template and the suite passes
  on its own.
- **E10** — 2026-11-21, the differential run against `git archive be9b090eb` in
  `mktemp -d`: `config get` (both scopes), `config set` (valid + refused),
  `config reset`, `config validate` (strict and `--sanitize`) · byte-identical
  stdout/stderr/exit; `config list --json` differs only in
  `logSession.publisher.type` (`object` → `null|object`), `config show --json`
  only by the removed `gitIdentity.agentGuard.mode`, `config schema` only by the
  `publisher` `anyOf`, and `config init` only by the same removed default key —
  the four deltas D5 names, nothing else.
- **E11** — 2026-11-21, the doctor differential over the same base: the only delta
  is the new `config-files` row (`mismatch`, move `instruct-only`, instruction
  `agentic-workflow config default`, advisory naming 21 new options and 1 removed
  key); every pre-existing row keeps its status, and the summary moves by exactly
  one.
- **P6** — 2026-11-21, the bank row, the template slot, the checklist, the guide, the
  runner pin, the changeset and the regenerated roadmap/units projection ·
  `fd1b0efd6`.
- **D7** — 2026-11-21, the Fixes intake row is hand-written (`docs-generate` never
  appends fix rows — a folder cannot distinguish a merged fix from an unregistered
  one), and the three count pins the new surfaces extend move with them (doctor
  15→16, template charter slots 22→23, bank rows 17→18). Each pin's own case
  states that its count follows the shipped surface, and no per-row assertion was
  relaxed.
- **E12** — 2026-11-21, `bun scripts/docs-generate.mjs --check` · exit 0 · 3 checked,
  0 missing, 0 stale, 0 orphaned · `bun scripts/check-skill-context.mjs` (30
  skills) and `--documents` (7 documents) · PASS · `bun scripts/lint-changeset.mjs`
  · exit 0.
- **G1** — 2026-11-21, HEAD fd1b0efd6ce61de1121a957da1bc4bdb2af89cb1 · `bun scripts/local-gate.mjs --jobs 4` at that commit · exit 0 ·
  PASS, 20 steps in 367s (root suite, both package test legs, node-compat and the
  projection steps included).
- **G2** — 2026-11-21, HEAD fd1b0efd6ce61de1121a957da1bc4bdb2af89cb1 · the gate's `pi-node-compat` leg · exit 0 · 1035 tests, 1034
  pass, 1 skip, 0 fail.
- **V1** — 2026-11-21, the obligations ledger closes: O1–O16 all `verified` on the
  foreground runs E2–E12; no row is deferred and none is `n/a`.

## Next

The owner's external verdict on the diff: the obligations ledger (16 rows, all
verified), the verification block below and the one open question — whether the
two stale-default repairs (D5) are accepted as part of this unit or split out.

## References

- Issue [#600](https://github.com/gtrabanco/agentic-workflow/issues/600).
- Issue [#427](https://github.com/gtrabanco/agentic-workflow/issues/427) (the
  unified config this builds on), [#537](https://github.com/gtrabanco/agentic-workflow/issues/537)
  (doctor vocabulary), [#591](https://github.com/gtrabanco/agentic-workflow/issues/591)
  (init-workspace consent patterns).
- `docs/workflow/CONFIG.md`, `.changeset/`, `docs/ROADMAP.md`.

## Branch

`feat/600-config-default-materialization`

## Depends on

n/a — #427 is merged.

## Regression scope

- `config get/set/list/show/validate/init/reset/schema` keep their bytes, exit
  codes and refusals: `bun test packages/agentic-workflow/test/config-cli.test.mjs`
  exits 0 with its existing cases unedited.
- `validate --sanitize` still removes unknown keys only when asked and still
  writes comment-free JSON: the same suite's sanitize case.
- The doctor's existing rows keep their statuses and the wizard's moves:
  `bun test packages/agentic-workflow/test/doctor.*.test.mjs` exits 0.
- The settings console's draft/save flow is unchanged:
  `cd packages/pi-agentic-workflow && bun run test` exits 0.
- The interview bank still passes its own check:
  `bun test packages/agentic-workflow/test/charter.test.mjs` exits 0.
