---
type: feature
scope: large
---

# 603 — self-documenting-cli

> One-line: the universal CLI serves its own grammar at runtime — a `help`
> surface rendered from the registry the dispatch already reads, a failure path
> that names the legal candidates instead of a bare refusal, and an
> agent-facing usage layer that points at `help` instead of re-reading the crate
> README.

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
SPEC.md | kept
decisions.md | kept
known-issues.md | kept
planning-obligations.md | kept
planning-evidence.md | kept
```

## Specs

The request is issue [#603](https://github.com/gtrabanco/agentic-workflow/issues/603),
quoted verbatim from its `## In scope` and `## Acceptance criteria` sections.

**S1 — a `help` surface generated from the dispatch registry.**
> **`agentic-workflow help [subcommand] [--json]`** plus `--help`/`-h` on every subcommand, generated from the same registry the dispatch reads (`src/runner/cli.mjs`) — one implementation; the subcommand's own module declares its ops/flags once and the usage strings render from it. Parity guard extends to registry ↔ usage strings ↔ crate README ↔ help output in both directions (`cli.surface.test.mjs` or successor).

**S2 — every failure feeds back the candidates and a `help` pointer.**
> **Failure feedback on every subcommand**: a usage-class failure (exit 1) names the failed subcommand/object, lists the legal candidates where a closed registry exists (ceremony objects/ops, config ops, doc ops, journal kinds…) and prints one line pointing at `agentic-workflow help <sub>`. Additive to the existing receipts (new keys/`suggestion:` line only — no published receipt changes shape on success); machine consumers keep reading what they read today.

**S3 — a progressive, non-invocable carrier usage skill.**
> **Carrier usage skill (progressive, two levels)**: a `user-invocable: false` carrier skill following the `runner-contract` precedent (no `metadata.internal` — it ships to targets). `SKILL.md` = index only: subcommand family → what it solves → pointer to its `references/<family>.md` + the conduct rule "before guessing flags, query the CLI's own help". References carry *recipes* (read → `--expect` CAS → write; the sensor exit-code exceptions: `needs-input`, `phase-lint`), never restated grammars — the owner rule "every repetition names its owner" binds the README as the grammar's home and normative-drift fails closed on copies.

**S4 — the pi deferred tools carry the index.**
> **Deferred pi tools carry the index**: `agentic_workflow_run`'s tool description names the subcommand families (or a new `agentic_workflow_help` typed tool) — zero standing token cost, covers sessions that never load the skill.

**S5 — the gh public-skills knowledge route, evaluated and applied.**
> **gh: adopt the official public skills layer at project level if it fits.** […] The unit evaluates and picks the route: `gh skill install github/awesome-copilot github-issues` (blocked on this host's pinned gh 2.46.0 → owner-side upgrade), `npx skills add github/awesome-copilot`, or vendoring with the repo's mandatory provenance header (source URL, author, version, license). The five forge frictions above are the acceptance corpus the knowledge route must cover.

**S6 — measured before/after re-read cost.**
> **The skill reduces re-read cost by pointing, not copying**: measured acceptance names the before/after skill-text tokens an agent needs for the canonical operations (roadmap row reconcile, ceremony pr routing, doc query) using the `token-per-pr` corpus as the sink.

**S7 — the parity guard fails closed on a new subcommand without a help row.**
> The parity guard pins registry ↔ usage strings ↔ README ↔ help output in both directions; `normative-drift` green; a new subcommand cannot ship without its help row (fail closed).

**S8 — the gates stay green and an unknown subcommand never stacks.**
> Gates green: root suite, crate suite at or above baseline, `check-skill-context`, changeset per repo rule. / unknown subcommand is exit 1 with a candidate suggestion, never a stack.

## Acceptance criteria

- **AC-S1** — `agentic-workflow help` lists every subcommand in
  `RUNNER_COMMANDS` **and** the bin's switch, and `help <sub>` answers for each
  one; proven by `bun test packages/agentic-workflow/test/cli.help.test.mjs`
  exiting 0 and by enumerating both lists in that suite.
- **AC-S1b** — `--help` and `-h` on a subcommand print the same block `help
  <sub>` prints (one implementation); proven by a suite case comparing the two
  outputs byte for byte.
- **AC-S2** — a usage-class failure names the failed subcommand/object, lists
  the legal candidates where a closed registry exists, and prints exactly one
  `help` pointer line; proven by suite cases per registry family
  (`ceremony`, `config`, `doc`, `journal`, the bin's closed world).
- **AC-S2b** — the refusal's exit code and `EDIT REFUSAL — ` prefix are
  unchanged; proven by `test/runner.dispatch.test.mjs` (its existing pinned
  assertions) staying green.
- **AC-S2c** — success receipts are byte-identical: no stdout byte of any
  previously-successful invocation changes; proven by the differential check
  (P9) against the base commit.
- **AC-S3** — the carrier skill is `user-invocable: false`, carries **no**
  `metadata.internal`, is discovered by the skills CLI, sits under its
  `SKILL_CONTEXT_BUDGETS.json` ceiling, declares `referenceDepth: 1`, and
  contains zero restated command grammars; proven by the discovery suite,
  `bun scripts/check-skill-context.mjs`, and a case asserting the prose carries
  no `usage:` line of its own.
- **AC-S4** — the pi namespace instruction carries the subcommand family index
  and adds no tool, so the standing token cost of the declared tool set is
  unchanged; proven by the pi package suite.
- **AC-S5** — the gh knowledge route's verdict is recorded with the evidence
  that decided it, and each of the five forge frictions is either covered by a
  route or explicitly declared uncovered with a reason; proven by
  `known-issues.md` carrying the verdict row plus one row per friction, and by
  `rg -c '^\| <friction> ' known-issues.md` matching ≥ 5.
- **AC-S6** — before/after text cost for the three canonical operations
  (roadmap row reconcile, ceremony pr routing, doc query) is measured and
  recorded; proven by the recorded numbers in `## Log` with the measuring
  command named.
- **AC-S7** — the parity guard reads registry, rendered usage, README rows and
  help output in both directions and fails closed when a subcommand lacks a help
  row or a help row lacks a subcommand; proven by a suite case that injects a
  synthetic subcommand and asserts the failure.
- **AC-S8** — an unknown subcommand exits 2 with a candidate suggestion and
  never prints a stack; proven by a suite case asserting the absence of
  `at ` frames in stderr.
- **AC-S8b** — the gates are green: root suite, crate suite, `check-skill-context`,
  and a `.changeset/` entry exists; proven by the P9 gate run.

## Impact

- **`packages/agentic-workflow/bin/agentic-workflow.mjs`** — the closed-world
  refusal (`Unknown service: <x>`, exit 2) gains candidate suggestions and the
  `help` pointer. Exit code and prefix are **pinned** by
  `test/runner.dispatch.test.mjs:120-134`, so this change is strictly additive
  inside that contract (D2).
- **`packages/agentic-workflow/src/runner/cli.mjs`** — `RUNNER_COMMANDS` is the
  dispatch table; it gains the metadata each entry's `help` row renders from.
- **`packages/agentic-workflow/bin/*` + `src/**` op tables** — every
  subcommand's closed ops/flags are declared once; today they are scattered
  across `fail("unknown-op", {ops})` and `onlyFlags(...)` callsites.
- **`packages/agentic-workflow/test/cli.surface.test.mjs`** — grows from
  README↔bin parity to registry↔usage↔README↔help parity in both directions.
- **`packages/pi-agentic-workflow/src/extension/workflow-tools.ts`** — the
  namespace `instructions` (already model-facing, already deferred) gains the
  family index. Zero new tool, zero standing cost (D4).
- **`skills/<new>/`** — a new skill directory, its budget row in
  `docs/workflow/SKILL_CONTEXT_BUDGETS.json`, and discoverability through the
  skills CLI.
- **`.claude-plugin/plugin.json`** `skills` array — alphabetical insertion of
  the new skill (machine surface, `manifest skillAdd`).
- **Nothing stops being true**: no command, flag, receipt shape or exit code is
  removed. This unit is additive (D5) except for the *content* of the refusal,
  which gains words on the same stream with the same exit code.

## Surfaces

- `packages/agentic-workflow`
- `packages/pi-agentic-workflow`
- `skills/self-documenting-cli`
- `docs`

## Retirements

Strictly additive unit; the computed inventory is the anti-divergence receipt.

- No surface is retired. `runner residual-classify --inventory --base <rev>`
  after the implementation is the receipt (E-line recorded in `## Log`).
- The scattered `fail("unknown-op", { ops: [...] })` arrays are **not** retired
  prose: they are moved into the one registry as data (P2), which is a
  de-duplication of the same vocabulary, not a deletion of a surface.

## Non-goals

- **S5 (`gh` public-skills route) is NOT implemented in this change.** This
  host pins `gh 2.46.0` (`gh --version`, E2), and `gh skill` needs ≥ 2.90.0, so
  the primary route is unreachable; the alternate project-level `npx skills add`
  writes no committed artifact, so its acceptance criterion cannot be proven
  from the tree. Recorded as **uncovered with its evidence** in `known-issues.md`
  rather than guessed or silently dropped (IR10, D3). It is the one `S#` this
  change does not deliver, and the handoff names it.
- No skill per subcommand (rejected by the issue itself: registry, budget and
  re-base explosion).
- No restated command grammar in any reference: the crate README stays the
  grammar's home and `normative-drift` fails closed on a copy.
- No `doc --query` work (#443 already shipped it).

## Risk tier

- **Tier** — `standard` · **Task Size** — under-change (classified at P1)
- **Named high-risk item** — none — the change is additive on a CLI surface
  whose exit codes and receipt shapes are pinned by existing suites.

## Future

- **S5's gh knowledge route** — deferred to the owner (needs `gh ≥ 2.90.0` on
  the host, or an owner decision to vendor). Status: `open`, recorded with
  evidence in `known-issues.md`.

## Future cost

- A new subcommand now costs **one registry entry** (summary + ops + flags) and
  one README row; `cli.surface.test.mjs` fails closed without them (S7). That is
  the intended standing cost — it is what makes the help surface truthful.
- The usage skill binds future subcommand families to a `references/<family>.md`
  pointer; a family that arrives without one is a review finding, not a silent
  gap.

## Applicable tests

- `packages/agentic-workflow/test/cli.surface.test.mjs` — extended to the
  four-way parity (S1, S7).
- `packages/agentic-workflow/test/cli.help.test.mjs` — **new**: `help`,
  `help <sub>`, `--help`, `-h`, `--json`, the failure candidates, and the
  no-stack guarantee (S1, S2, S8).
- `packages/agentic-workflow/test/runner.dispatch.test.mjs` — the pinned
  exit-2 refusal must still hold **and** now carry a suggestion (S2, S8).
- `packages/pi-agentic-workflow/test/` — the namespace instructions carry the
  family index (S4).
- `bun scripts/check-skill-context.mjs` and the skills discovery suite — the new
  skill is discoverable and inside its ceiling (S3, S8).

## Known pre-existing issues

- `gh 2.46.0` on this host cannot run `gh skill` — **affects** S5 only; recorded
  uncovered. Does not affect S1–S4, S6–S8.
- `node_modules` did not materialize workspace links under bun's default
  isolated linker in this worktree — **does not affect** the unit; resolved with
  `bun install --linker=hoisted` (E1), which is an environment fact, not a code
  change.

## Tasks

- P1 — Freeze the unit doc and both ledgers; confirm the frozen-failure corpus
  (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/features/603-self-documenting-cli/SPEC.md` exits 0)
  (Implements: S7, S8)
  - Relevant files: docs/features/603-self-documenting-cli/SPEC.md
- P2 — One declarative registry: every subcommand's summary, closed ops and flags
  declared once and exported from `src/runner/`, with `RUNNER_COMMANDS` and the
  bin's switch reading it (validator: `bun test packages/agentic-workflow/test/cli.help.test.mjs` exits 0)
  (Implements: S1)
  - Relevant files: packages/agentic-workflow/src/runner/help.mjs, packages/agentic-workflow/src/runner/cli.mjs
- P3 — The `help` renderer and its wiring: `help`, `help <sub>`, `--help`, `-h`,
  `--json`, unknown-subcommand suggestion (validator: `bun test packages/agentic-workflow/test/cli.help.test.mjs` exits 0)
  (Implements: S1, S8)
  - Relevant files: packages/agentic-workflow/src/runner/help.mjs, packages/agentic-workflow/bin/agentic-workflow.mjs
- P4 — Failure feedback: candidates where a closed registry exists, plus the
  `help <sub>` pointer, inside the pinned exit contract (validator: `bun test packages/agentic-workflow/test/runner.dispatch.test.mjs` exits 0)
  (Implements: S2, S8)
  - Relevant files: packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/src/runner/lib.mjs
- P5 — The four-way parity guard, fail-closed on a new subcommand without a help
  row (validator: `bun test packages/agentic-workflow/test/cli.surface.test.mjs` exits 0)
  (Implements: S7)
  - Relevant files: packages/agentic-workflow/test/cli.surface.test.mjs
- P6 — The carrier usage skill: `SKILL.md` index + `references/<family>.md`
  recipes, budget row, plugin manifest, discoverability (validator: `bun scripts/check-skill-context.mjs` exits 0)
  (Implements: S3, S8)
  - Relevant files: skills/self-documenting-cli/SKILL.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json
- P7 — The pi deferred tools' namespace carries the family index at zero
  standing cost (validator: `bun run test` in `packages/pi-agentic-workflow` exits 0)
  (Implements: S4)
  - Relevant files: packages/pi-agentic-workflow/src/extension/workflow-tools.ts
- P8 — Measured before/after re-read cost for the three canonical operations
  (validator: `rg -c 'roadmap row reconcile' docs/features/603-self-documenting-cli/SPEC.md` matches 3 and the measurement table is present)
  (Implements: S6)
  - Relevant files: docs/features/603-self-documenting-cli/SPEC.md
- P9 — Documentation currency, roadmap row, changeset, and the full gate
  (validator: `bun scripts/local-gate.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S7, S8)
  - Relevant files: docs/ROADMAP.md, .changeset/
- P10 — Record the gh knowledge route verdict and the five forge frictions with
  their coverage state (validator: `rg -c '^\| ' docs/features/603-self-documenting-cli/known-issues.md` matches ≥ 5)
  (Implements: S5)
  - Relevant files: docs/features/603-self-documenting-cli/known-issues.md

```text
task-spec-link@1
kind | shape | what it orders
link | (Implements: S<n>, S<m>, …) | the requirements this task delivers; metadata, never task text
```

### Planning evidence

Frozen in [planning-evidence.md](planning-evidence.md) (M/L unit: the ledger is
the separate file, never both).

### Obligations

Frozen in [planning-obligations.md](planning-obligations.md) (M/L unit: the
ledger is the separate file, never both). Before the unit ships, every row is
`verified` (or an evidenced `n/a`).

## Triaged steps

Frozen by this unit doc's `## Tasks`; the step list is the nine tasks above.


## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-23, the request, verbatim (a local, unpublished workflow
  applying issue #603 to this repository):
  ```
  Apply to this repository: issue #603
  ```
  followed by the owner's `Create the PR`.
- **D1** — 2026-11-23, **unit home** = `docs/features/603-self-documenting-cli/`.
  Authority: issue labels `feature` + `promoted` (triage verdict *"promoted to
  a feature SPEC"*), and roadmap row 603 already lives in `## Features`. The
  workflow's literal `docs/fix/<issue>-<topic>/` path is for the fix lane; this
  is not the fix lane.
- **D2** — 2026-11-23, **the refusal stays exit 2**. The issue says "usage-class
  failure (exit 1)" but `test/runner.dispatch.test.mjs:120-134` pins
  `status === 2` and the `EDIT REFUSAL — Unknown service:` prefix as the
  published closed-world contract, and the crate README documents exit 2 for
  refusals. S2's own "additive … no published receipt changes shape" governs, so
  the change adds candidates and the pointer **without** re-numbering.
- **D3** — 2026-11-23, **S5 is recorded uncovered, not implemented**. `gh
  2.46.0` on this host (`gh skill` needs ≥ 2.90.0) and a project-level
  `npx skills add` leaves no committed artifact to verify. Guessing a route or
  silently dropping the requirement would each violate the owner's instructions;
  it is reported in the handoff and in `known-issues.md`.
- **D4** — 2026-11-23, **the pi index rides the existing namespace
  instruction** rather than adding a tool. A new tool would change the declared
  tool set's standing cost, which S4 explicitly forbids ("zero standing token
  cost").
- **E1** — 2026-11-23, `bash /tmp/probe-603.sh` (the frozen-failure corpus) · the five shapes measured on `7c395d880`: `help` → `EDIT REFUSAL — Unknown service: help` exit **2**; `--help` → the same, exit **2**; `delete-section` → no candidate named; `ceremony bogus-object` → JSON with `objects` (the contrast); `doc --bogus` → a usage line, no `help` pointer; `journal bogus` → names the ops, no pointer.
- **E2** — 2026-11-23, `gh --version` · exit 0 · `gh version 2.46.0` — below the `2.90.0` floor `gh skill` needs (D3).
- **E3** — 2026-11-23, `bun install --ignore-scripts --linker=hoisted` in this worktree · exit 0 · workspace members link; bun's default isolated linker left `node_modules` empty here (PE-011).
- **E4** — 2026-11-23, `bun test packages/agentic-workflow/test/cli.help.test.mjs` · exit 1 · **9 fail** at the red commit `7f45977d8` (the RED run, recorded before the implementation landed).
- **E5** — 2026-11-23, `bun test packages/agentic-workflow/test/cli.help.test.mjs` · exit 0 · **9 pass, 0 fail** after the implementation.
- **E6** — 2026-11-23, the differential check (`bun /tmp/diffcheck.mjs <base> <head>`, base = `7c395d880` materialized at `/tmp/aw603-base-NHnYaU`) · 12 invocations compared · **5 differences, all requested by S2**: `ceremony`×3 gain the additive `help` JSON key (no existing key changed value — verified key-by-key), `journal bogus` and `--no-such-top-level` gain the pointer line. **Zero exit codes moved. Zero success receipts changed.**
- **E7** — 2026-11-23, `bun -e` importing `packages/pi-agentic-workflow/src/extension/workflow-tools.ts` · exit 0 · `tools: 6`, `all deferred: true`, all seven family names present in the runner tool's description, `help <subcommand>` present. The package's own suite is **red on `main` before this unit** (13 cases; see `known-issues.md`), so this property is verified by direct import and the blocker disclosed.
- **E8** — 2026-11-23, the P8 measurement (recorded under `### Measurement (P8)`) · a subcommand block is 47–60 % smaller than its README row; the index is 93 % smaller than the README an agent previously read. The `token-per-pr` script the issue names **does not exist in this tree**.
- **G1** — 2026-11-23, `HEAD 91fd1ffad`, `bun test packages/agentic-workflow/test/cli.surface.test.mjs` · exit 0 · 10 pass, 0 fail (the four-way parity, incl. the fail-closed case, proven live by renaming one registry key → the suite went red).
- **G2** — 2026-11-23, `HEAD 91fd1ffad`, `bun test packages/agentic-workflow/test/runner.dispatch.test.mjs` · exit 0 · 7 pass, 0 fail (the pinned exit-2 refusal, untouched).
- **G3** — 2026-11-23, `HEAD 91fd1ffad`, `bun test packages/agentic-workflow/test/self-documenting-cli.skill.test.mjs` · exit 0 · 7 pass, 0 fail.
- **G4** — 2026-11-23, `HEAD 91fd1ffad`, `bun scripts/check-skill-context.mjs` and `--documents` · exit 0 · `PASS context budgets: 31 skills`, `PASS context documents: 7 budgeted documents`.
- **G5** — 2026-11-23, `HEAD 91fd1ffad`, `bun test scripts/normative-drift.test.mjs` · exit 0 · 24 pass, 0 fail.
- **G6** — 2026-11-23, `HEAD 91fd1ffad`, `bun scripts/run-root-suite.mjs --dir packages/agentic-workflow/test` · **79 PASS, 1 FAIL** — `runner.distribution.test.mjs`, failing **identically on the base commit** (a shipped-copy test with no `node_modules`; pre-existing).
- **G7** — 2026-11-23, `HEAD 91fd1ffad`, `bun scripts/local-gate.mjs` · **FAILED at `workspace-install`**, and `bun scripts/local-gate.mjs` on the base commit fails at the same step — pre-existing (the pi package's published `4.10.0` pin cannot resolve workspace sources at `prepare`). Disclosed, not excused.
- **D5** — 2026-11-23, **strictly additive**. No command, flag, exit code or
  receipt shape is removed; the registry centralizes vocabularies that already
  exist as scattered `ops:` arrays.

### Measurement (P8)

Measured at P8 with the tree's own tools. The `token-per-pr` script the issue
names as the sink **does not exist in this repository** (verified: no such file,
and `scripts/` carries only `tier-cost.mjs`), so the measurement
uses the repository's own deterministic estimate metric — `ceil(UTF-8 bytes / 4)`,
the same one `docs/workflow/SKILL_CONTEXT_BUDGETS.json` declares.

The three canonical operations the issue names, before vs after:

| operation | before (crate README, the only home) | after (`agentic-workflow help <sub>`) | reduction |
|---|---|---|---|
| roadmap row reconcile | 962 chars / ~240 est | 421 chars / ~105 est | **−56%** |
| ceremony `pr` routing | 1,019 chars / ~254 est | 543 chars / ~135 est | **−47%** |
| `doc --query` | 1,213 chars / ~303 est | 480 chars / ~120 est | **−60%** |
| **the whole grammar re-read** | 132,054 chars (the README) | 8,958 chars (`help` index) | **−93%** |

The honest reading: a subcommand's block is roughly **half** the README row that
described it, and the index is an order of magnitude smaller than the README an
agent previously had to find and read. What is *not* claimed: that a session
reads less in total — it reads `help <sub>` instead of the README row, which is a
strict reduction per operation, measured above.

## Next

P2 — build the one declarative registry (`src/runner/help.mjs`) and the
`help` renderer on top of it, tests first.

## References

- Issue [#603](https://github.com/gtrabanco/agentic-workflow/issues/603) — the
  request, quoted verbatim under `## Specs`.
- `docs/ROADMAP.md` row 603.
- `skills/runner-contract/references/RUNNER.md` — the pin the usage layer
  points at.
- `packages/agentic-workflow/README.md` § Commands — the grammar's home.
