---
type: fix
scope: medium
roadmap_summary: Issue [#630](https://github.com/gtrabanco/agentic-workflow/issues/630) (M): telemetry merge safety — `TIER_COST.md` and `.pi/.telemetry/sessions.jsonl` join the shared-document merge classes as an append-only `telemetry` class (row/line union with deduplication, the delta appended to `%A`, never staging+rename), declared in `.gitattributes`, armed by init-workspace and by a new `agentic-workflow telemetry merge-install`, and armed as part of `telemetry reconstruct write` so no project keeps an unguarded telemetry file.
---

# fix/630-telemetry-merge-safety

> One-line: the two telemetry destinations stop being files git resolves by
> textual merge — the `telemetry` class unions the rows/lines both branches
> appended, and three installation surfaces make sure a project's telemetry is
> actually guarded instead of merely mergeable.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#630` — tracked issue in the project's forge, closed by this PR via `Closes #630`.

## Specs

Requirements are the issue's `# Requirements` section, one requirement per
`**S#**`, quoted verbatim. Its `# Test evidence` section is the frozen-failure
corpus (§Log `E1`–`E3`), not a second requirement list; its
`# Before implementation: verification questions` and `# Open design decisions`
are the questions this cut answers, and each answer is a `D` line in `## Log`.

**S1 — Register telemetry paths as merge-safe appendable surfaces.**
> **S1 — Register telemetry paths as merge-safe appendable surfaces.**
> The telemetry files (`TIER_COST.md` and `sessions.jsonl`) must be registered
> in the shared-doc merge system so git merges them cleanly when branches
> append rows independently.

**S2 — Provide an installation gate for the telemetry merge driver.**
> **S2 — Provide an installation gate for the telemetry merge driver.**
> The driver must be installed automatically when a project activates telemetry
> or when the universal CLI is used. No project should end up with an unguarded
> telemetry file. Installation happens at three surfaces:
>
> 1. **init-workspace** (primary surface): During `.gitattributes` bootstrap and
>    driver arming. Init-workspace already adds additive lines to
>    `.gitattributes` (registry lines for the four existing classes) and arms
>    drivers via `bun scripts/shared-doc-merge.mjs --install`. Telemetry paths
>    must be added here alongside the existing `logs` class entry:
>    - `.gitattributes`: add `docs/workflow/TIER_COST.md merge=agentic-shared-telemetry`
>      and `.pi/.telemetry/sessions.jsonl merge=agentic-shared-telemetry`
>    - Arming: the driver class `telemetry` is already covered by `--install`
>      since it iterates all classes
>
> 2. **Universal CLI** (retroactive surface): `agentic-workflow telemetry
>    merge-install` — lets users who have telemetry active before this fix
>    install the protection without re-running `init-workspace`
>
> 3. **Reconciliation trigger**: When `agentic-workflow telemetry reconstruct
>    write` runs for the first time on a project that never had telemetry
>    active (i.e., this is the reconciliation after initial activation), it
>    arms the driver as part of the reconciliation flow. This ensures the
>    first write is protected.

**S3 — Make the driver installable via universal CLI.**
> **S3 — Make the driver installable via universal CLI.**
> A project that has telemetry active before this fix can install the merge
> protection manually via `@gtrabanco/agentic-workflow` CLI.

**S4 — Include a reconciliation-time installation trigger.**
> **S4 — Include a reconciliation-time installation trigger.**
> When `telemetry reconstruct write` runs for the first time on a project that
> has never had telemetry active, it must arm the driver as part of the
> reconciliation.

**S5 — The driver must use `appendFileSync`-compatible semantics.**
> **S5 — The driver must use `appendFileSync`-compatible semantics.**
> The merge must treat each row/line as an independent atomic append.
> It must NOT use staging+rename (which was tested and found to have race
> conditions for append-only).
> It must support deduplication of identical rows across branches.
>
> **Critical:** Test 2 proved staging+rename is **worse** than appendFileSync
> for concurrent writes (42-55/1000 lines vs 2000/2000). The merge strategy
> must be append-compatible (like `unionLogEntries`), never read-modify-write.

## Acceptance criteria

Frozen at cut. The issue carries no `## Acceptance criteria` section, so the
list is one observable criterion per `S#`, each naming the check that proves it.

- **AC-S1** — Both telemetry paths resolve to the `telemetry` class, and both
  `.gitattributes` carriers name them: the repository's own file and the
  template a scaffolded project copies. Check:
  `bun test scripts/shared-doc-merge.test.mjs` exits 0 with the two
  `telemetry`-class cases present, and
  `rg -c 'TIER_COST.md merge=agentic-shared-telemetry' .gitattributes template/.gitattributes`
  prints `1` and `1`.
- **AC-S2** — The three installation surfaces each install: init-workspace's
  registry list and the template carry the lines, `--install` arms the class
  because it iterates the vocabulary, and the reconciliation trigger is on the
  `write` path. Check: `rg -c 'TIER_COST.md merge=agentic-shared-telemetry' skills/init-workspace/references/BOOTSTRAP_WRITE.md`
  matches 1 and `bun test scripts/shared-doc-merge.test.mjs` exits 0 (its
  `--install` case asserts every declared class, `telemetry` included).
- **AC-S3** — `agentic-workflow telemetry merge-install` exists, appends the
  missing `.gitattributes` registry lines additively, arms the driver
  idempotently, and refuses a directory that is not a git checkout (exit 2,
  nothing written). Check:
  `bun test packages/agentic-workflow/test/telemetry-merge-install.test.mjs`
  exits 0.
- **AC-S4** — `agentic-workflow telemetry reconstruct write` arms the driver as
  part of the reconciliation and reports the arming in its receipt; on a
  non-checkout it reports `unavailable` and the write still succeeds. Check:
  `bun test packages/agentic-workflow/test/telemetry-reconstruct.test.mjs`
  exits 0, and its `write` receipt carries the `merge_driver` block.
- **AC-S5** — The `telemetry` merge is append-only and deduplicating: both
  sides' new rows/lines survive, an identical row/line lands once, a side that
  is not an append-only extension of the base refuses closed, and the driver
  reaches `%A` through `appendFileSync` — no staging file, no rename, on the
  `telemetry` class. Check:
  `bun test packages/agentic-workflow/test/writer.merge.test.mjs` and
  `bun test scripts/shared-doc-merge.test.mjs` exit 0, and
  `rg -c 'appendFileSync' packages/agentic-workflow/src/writer/shared-merge.mjs`
  matches at least 1 while the telemetry branch names no `renameSync`.

## Impact

Cut at plan time. Every surface this fix reads or writes, and what changes on it:

| Surface | Why it changes | Its consumers |
|---|---|---|
| `packages/agentic-workflow/src/writer/merges.mjs` | S5: the append-only union the `telemetry` class runs (`telemetryRowKey`, `unionAppendOnly`) | the driver, both telemetry paths, their suites |
| `packages/agentic-workflow/src/writer/shared-merge.mjs` (new) | S1/S2/S5: the git mechanics move out of `scripts/` so the universal CLI can arm a driver in a project that ships no `scripts/` tree; the class registry gains `telemetry` and the telemetry write path appends to `%A` | `scripts/shared-doc-merge.mjs`, the crate bin, the CLI |
| `packages/agentic-workflow/bin/shared-merge.mjs` (new) | S2/S3: the driver entry an npm-only project arms | git, `telemetry merge-install` |
| `scripts/shared-doc-merge.mjs` | S1/S2: becomes the thin entry over the crate implementation — same argv form, same documented `--install`, same exports | every armed checkout, the root suite, the doctor, `AGENTS.md` |
| `packages/agentic-workflow/src/telemetry/merge-install.mjs` (new) | S2/S3/S4: the one installer (declaration + arming + receipt) the CLI and the reconciliation both call | `bin/agentic-workflow.mjs`, `src/telemetry/reconstruct.mjs` |
| `packages/agentic-workflow/src/telemetry/reconstruct.mjs` | S4: `write` arms the driver and reports it, degrading on a non-checkout | the CLI, its suite |
| `packages/agentic-workflow/bin/agentic-workflow.mjs` | S3: the `telemetry merge-install` route | every CLI user |
| `.gitattributes`, `template/.gitattributes` | S1/S2: the two registry lines | git, `init-workspace`, `UPGRADE.md` |
| `skills/init-workspace/references/BOOTSTRAP_WRITE.md`, `UPGRADE.md` | S2: the registry list a scaffold proposes | the scaffold, its audits |
| `AGENTS.md` | S1/S2: the shared-document registry paragraph and the two `normative-surfaces@1` rows (the vocabulary moves to the crate) | `normative-drift`, every reader |
| `packages/agentic-workflow/README.md`, `docs/workflow/TIER_COST.md` | S1/S2/S5: the shipped class, the installer and the append-only contract the ledger's own prose must state | package and ledger readers |
| `docs/fix/630-telemetry-merge-safety/` | the unit's own record | the review pack |

Sweep at plan time: `rg -n 'agentic-shared-|SHARED_MERGE_CLASSES|classForPath'`.
The registry has exactly two prose homes (`AGENTS.md` and
`skills/init-workspace/references/BOOTSTRAP_WRITE.md`/`UPGRADE.md`), one machine
home (`SHARED_MERGE_CLASSES`) and one declaration home (`.gitattributes` in the
repo and in `template/`); all four move in this change, and nothing restates the
class list a fifth time.

## Surfaces

- `packages/agentic-workflow`
- `scripts`
- `docs`
- `skills/init-workspace`
- `template`

## Retirements

Nothing is retired. The change is additive except for one **relocation**: the
driver's git mechanics move from `scripts/shared-doc-merge.mjs` to
`packages/agentic-workflow/src/writer/shared-merge.mjs`, because S2/S3 require
the universal CLI to install a driver in a project that ships no `scripts/`
tree — a copy in both places would be the second grammar the writer contract
forbids. The script keeps its path, its exports and its argv form, so every
armed checkout and every documented command keeps working.

Inventory receipt: `bun scripts/residual-classify.mjs --inventory --base 748a372f`
— recorded in `## Log`.

## Non-goals

The issue states no out-of-scope list; decided at cut:

- **No second driver for the JSONL path.** One class, one driver name
  (`agentic-shared-telemetry`), per-path dispatch inside it — the issue's own
  open decision 3.
- **No push-time immutability gate for `TIER_COST.md`.** `scripts/log-immutability.mjs`
  stays the journal's gate. S1–S5 scope the merge system; making a documentation
  file's prose append-only at push time is a policy change nobody asked for and
  is named here so the owner can overrule it with one line.
- **No tracking change.** `.pi/.telemetry/` stays gitignored in this repository
  (issue #504). The driver acts on tracked paths only, so the JSONL half becomes
  live in a project that chooses to carry its telemetry corpus in git; the
  declaration is shipped either way because S2 names both paths.
- **No new telemetry format.** The row/line grammars, the LEDGER_PATH and the
  writer are untouched.
- **No automatic `.gitattributes` write from the reconciliation trigger.** The
  trigger arms the git config and reports what the declaration says; rewriting a
  tracked file is the explicit command's and init-workspace's job.

## Risk tier

Verdict copied from the crate's classifier over the planned paths
(`contract: risk-tier-verdict@1`), never written from memory:

- **Tier** — `standard` · **Task Size** — understood / contained / resumable-from-diff
- **Named high-risk item** — none — not a high-tier unit

## Future

- **2026-11-18, open — the configurable JSONL path.** `telemetry.jsonFile` may
  name a path other than `.pi/.telemetry/sessions.jsonl`; a project that moves it
  keeps the declaration on the default path only. A per-project declaration
  written by `merge-install` from the resolved config is the follow-up, not this
  unit.

## Future cost

Every project that tracks a telemetry destination now carries a merge driver:
an un-armed clone keeps today's textual merge (git's documented degradation), and
`agentic-workflow doctor` reports it as `unarmed` with the installer as its
action. The `telemetry` class may never grow a second write strategy: its
append-only rule is stated once, in the crate README's writer contract.

## Applicable tests

- `packages/agentic-workflow/test/writer.merge.test.mjs` — the two union
  semantics (`F-630-1`…`F-630-5`).
- `scripts/shared-doc-merge.test.mjs` — the driver over real `git merge` in
  throwaway fixtures, the four existing classes, and the regression pins for the
  relocated mechanics (`F-630-6`…`F-630-11`).
- `packages/agentic-workflow/test/telemetry-merge-install.test.mjs` (new) — the
  installer and the CLI route.
- `packages/agentic-workflow/test/telemetry-reconstruct.test.mjs` — the
  reconciliation trigger and its degradation.

## Known pre-existing issues

- The stale extension path in the operator's `~/.pi/agent/settings.json`
  (`/tmp/serena-activation-*`) made every `bash` call fail at the start of this
  session with `config.enabled` — **does not affect** this unit; the checkout was
  repaired by the operator before the first command ran, and no artefact of it
  ships.
- `bun scripts/worktree-guard.mjs` fails on this host over two **other** sessions'
  worktrees (`.worktrees/feat-611-dogfooding-vehicle`: branch merged into
  `origin/main`; `.worktrees/fix-626-config-guards-ux`: merged and dirty) —
  **does not affect** this unit: the guard reads `git worktree list`, never the
  diff, and names no path of this branch. Left in place deliberately (one of them
  holds another session's uncommitted work); the owner decides their removal.
- Two default-jobs runs of `node scripts/run-root-suite.mjs` on this host (load
  average 8.0 on 6 cores, five worktrees) hit the 120 s suite wall clock on
  `scripts/phase-lint.test.mjs` and failed `scripts/unit-route.test.mjs` —
  **does not affect** this unit: both suites pass alone (`bun test
  scripts/unit-route.test.mjs`: 64 pass; `node --test` the same) and the pool run
  at `--jobs 2` is green end to end (`E14`). Recorded, not excused.
- The crate's `dist/` is gitignored build output, rebuilt by the gate when stale
  — **does not affect** this unit; no contract suite reads another source set's
  build.

## Tasks

P1 first, smallest within each ready set; the prerequisite order is the one the
dependency graph forces (corpus → semantics → driver → surfaces → docs → gate).

- P1 — Freeze the issue's four test-evidence reproducers as failing checks: the two append-union cases, the dedup case, the non-append-only refusal, and the concurrent-writer pair that justifies S5 (validator: `bun test packages/agentic-workflow/test/writer.merge.test.mjs` exits 1 and matches `F-630-1` through `F-630-5`)
  (Implements: S1, S5)
  - Relevant files: packages/agentic-workflow/test/writer.merge.test.mjs
- P2 — Implement the append-only union and the telemetry row key in the merge library (validator: `bun test packages/agentic-workflow/test/writer.merge.test.mjs` exits 0)
  (Implements: S5)
  - Relevant files: packages/agentic-workflow/src/writer/merges.mjs
- P3 — Relocate the driver's git mechanics into the crate, add the `telemetry` class with per-path dispatch and the append-to-`%A` write path, and keep `scripts/shared-doc-merge.mjs` as the thin documented entry (validator: `bun test scripts/shared-doc-merge.test.mjs` exits 0)
  (Implements: S1, S2, S5)
  - Relevant files: packages/agentic-workflow/src/writer/shared-merge.mjs, packages/agentic-workflow/bin/shared-merge.mjs, scripts/shared-doc-merge.mjs
- P4 — Declare the class in the repository's and the template's `.gitattributes`, and move the two `AGENTS.md` normative rows with the vocabulary (validator: `bun scripts/prose-gate-inventory.mjs` prints `verdict: PASS` and `bun test scripts/normative-drift.test.mjs` exits 0)
  (Implements: S1, S2)
  - Relevant files: ./.gitattributes, template/.gitattributes, AGENTS.md
- P5 — Ship the installer as `agentic-workflow telemetry merge-install` and wire the reconciliation trigger into `telemetry reconstruct write` (validator: `bun test packages/agentic-workflow/test/telemetry-merge-install.test.mjs` and `bun test packages/agentic-workflow/test/telemetry-reconstruct.test.mjs` exit 0)
  (Implements: S2, S3, S4)
  - Relevant files: packages/agentic-workflow/src/telemetry/merge-install.mjs, packages/agentic-workflow/src/telemetry/reconstruct.mjs, packages/agentic-workflow/bin/agentic-workflow.mjs
- P6 — Write the declared docs surface: init-workspace's registry list, the crate README's class and writer-contract note, the ledger's own append-only note, and the changeset (validator: `bun scripts/docs-generate.mjs --check` exits 0 and `bun scripts/check-skill-context.mjs --documents` exits 0)
  (Implements: S1, S2, S3, S5)
  - Relevant files: skills/init-workspace/references/BOOTSTRAP_WRITE.md, skills/init-workspace/references/UPGRADE.md, packages/agentic-workflow/README.md, docs/workflow/TIER_COST.md, .changeset/630-telemetry-merge-safety.md
- P7 — Verification: the whole root gate plus the crate suite in the foreground (validator: `bun scripts/local-gate.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5)
  - Relevant files: docs/fix/630-telemetry-merge-safety/

### Planning evidence

This is an M unit, so the ledger lives beside this document:
[`planning-evidence.md`](planning-evidence.md). It is the only carrier — this
section never embeds a second copy.

### Obligations

This is an M unit, so the ledger lives beside this document:
[`planning-obligations.md`](planning-obligations.md). It is the only carrier —
this section never embeds a second copy, and every row is `verified` (or an
evidenced `n/a`) before the handoff.

## Triaged steps

```text
TRIAGE — 630-telemetry-merge-safety (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
```

The block is the machine's authoritative step list, emitted by
`runner unit-route --triage 630-telemetry-merge-safety` at the cut head. Two
notes on how this unit honours it: the `plan` step is the frozen ledger pair
this folder carries (the owner's substitution, `D1`), and the `review` step is
the **owner's** external verification — this workflow applies the change inline
and hands the diff over, so no in-repo review pack runs on it.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|


## Log

- **L1** — 2026-11-18, the issue, verbatim:
  ```
  # Problem

  Two telemetry files are written via bare `appendFileSync()` with **no merge
  protection** and **no installation gate**. When two branches independently
  append rows/lines to these files and git merges them, the textual merge produces
  real conflict markers that lose data:

  - `docs/workflow/TIER_COST.md` — markdown table (row append)
  - `.pi/.telemetry/sessions.jsonl` — JSONL (line append)

  The write path driver (`packages/agentic-workflow/src/writer/driver.mjs`)
  exists for shared-document merge safety, but telemetry files are **not**
  registered in that system: no entry in `SHARED_MERGE_CLASSES`, no entry in
  `classForPath()`, no entry in `.gitattributes`, no registration in
  `scripts/log-immutability.mjs`.

  # Requirements

  S1 — Register telemetry paths as merge-safe appendable surfaces.
  S2 — Provide an installation gate for the telemetry merge driver (three
  surfaces: init-workspace, universal CLI, reconciliation trigger).
  S3 — Make the driver installable via universal CLI.
  S4 — Include a reconciliation-time installation trigger.
  S5 — The driver must use `appendFileSync`-compatible semantics: append-only,
  never staging+rename, deduplicating identical rows across branches.

  # Test evidence

  Test 1 `appendFileSync` concurrent safety: 2000/2000 lines, 0 corrupt.
  Test 2 staging+rename concurrent safety: 42–55/1000 lines, data destroyed.
  Test 3 git merge conflict without driver: markers in the middle of the table.
  Test 4 git merge with the semantic driver: clean union, ordered by stamp.

  # Open design decisions

  JSONL merge: new class or inline? CLI command name? TIER_COST row key?
  ```
  (The four `# Requirements` blocks are quoted verbatim in `## Specs`; the test
  evidence is the frozen corpus of `E1`–`E3`; the open decisions are `D1`–`D6`.)

- **D1** — 2026-11-18, issue `#630` open decision 3, owner authority (the
  requester names it "cleanest"): **one new class `telemetry`** with per-path
  dispatch inside it, not two classes and not an inline path.
- **D2** — 2026-11-18, issue `#630` open decision 3, first option: the
  `TIER_COST.md` row key is the row's `source` cell — the last cell in both the
  `@1` and the `@2` grammars, unique per row by the ledger's own contract
  ("one row per session, not per day").
- **D3** — 2026-11-18, issue `#630` open decision 1, decided on the frozen
  evidence (`E1`): the JSONL merge is a **line union by canonical JSON identity**
  behind the append-only rule — an append never rewrites a line, so a side that
  is not an append-only extension of the base refuses closed instead of guessing.
- **D4** — 2026-11-18, issue `#630` open decision 4: the command is
  `agentic-workflow telemetry merge-install`, the issue's own spelling, so the
  surface it asks for is the surface that ships.
- **D5** — 2026-11-18, S2/S3 + the writer contract's "never a second grammar":
  the driver's git mechanics move into the crate (`src/writer/shared-merge.mjs`)
  so the universal CLI can arm a working driver in a project that ships no
  `scripts/` tree; `scripts/shared-doc-merge.mjs` stays the documented entry over
  it. A copy in both places is the defect this decision refuses.
- **D6** — 2026-11-18, S5 read against the driver's git contract: the `telemetry`
  class reaches `%A` by **appending the delta** with `fs.appendFileSync` (the
  union is computed first, and a result that is not an extension of `ours`
  refuses closed); every other class keeps its `staging file + rename` write,
  which their own tests pin. "Never staging+rename" is honoured literally on the
  class it was measured on.
- **D7** — 2026-11-18, S4 read narrowly: the reconciliation trigger arms the git
  config and reports the declaration; the `.gitattributes` write belongs to
  `merge-install` (explicit) and init-workspace (scaffold). A telemetry
  reconstruction never rewrites a tracked file behind the operator's back.
- **P1** — 2026-11-18 15:05, the unit doc and the frozen ledger pair cut before
  any code · `ef64284c`.
- **E1** — 2026-11-18, `runner unit-route --triage 630-telemetry-merge-safety` · exit 0 ·
  `Steps: plan, implement, tests, evidence, review, docs` · `Budget: strong`.
- **E2** — 2026-11-18, the frozen corpus is RED before the implementation:
  `bun test packages/agentic-workflow/test/writer.merge.test.mjs` · exit 1 ·
  `0 pass, 1 fail, 1 error` (`Export named 'telemetryRowKey' not found`).
- **E3** — 2026-11-18, the driver's corpus is RED too:
  `bun test scripts/shared-doc-merge.test.mjs` · exit 1 · `12 pass, 5 fail`
  (`F-630-6`…`F-630-10`).
- **P2** — 2026-11-18 15:20, the red corpus committed · `f6e4e9ee`.
- **E4** — 2026-11-18, `bun test packages/agentic-workflow/test/writer.merge.test.mjs` · exit 0 ·
  `20 pass, 0 fail` (`F-630-1`…`F-630-5` plus the 15 pre-existing cases).
- **E5** — 2026-11-18, `bun test scripts/shared-doc-merge.test.mjs` · exit 0 · `17 pass, 0 fail`
  (`F-630-6`…`F-630-10`, the 12 pre-existing cases unchanged, `--install` arming five classes).
- **E5b** — 2026-11-18, `bun test scripts/docs-generated-merge.test.mjs` · exit 0 · `18 pass, 0 fail`
  (both `.gitattributes` pins now derive from `attributeLines()`).
- **E6** — 2026-11-18, `bun test packages/agentic-workflow/test/telemetry-merge-install.test.mjs` ·
  exit 0 · `8 pass, 0 fail` (`F-630-11`…`F-630-14`, the npm-only merge through the crate bin included).
- **E7** — 2026-11-18, `bun test packages/agentic-workflow/test/telemetry-reconstruct.test.mjs` ·
  exit 0 · `18 pass, 0 fail` (the `merge_driver` receipt, `armed` → `unchanged`, and the
  `unavailable` degradation; `write touches nothing outside the two destinations it names` green).
- **E8** — 2026-11-18, the measured corpus behind S5 (`/tmp/aw630probe`, removed):
  `append` 20 × 100 lines → `2000 lines, 20 unique sessions, 0 corrupt`;
  `staging` 20 × 100 lines → `548 lines, 18 unique sessions` (the issue measured 42–55/1000).
- **E9** — 2026-11-18, `bun test packages/agentic-workflow/test/doctor.checks.test.mjs` · exit 0 ·
  `21 pass, 0 fail` (the `merge-drivers` probe and installer unchanged by the relocation).
- **P3** — 2026-11-18 15:35, the merge library and the relocated mechanics committed ·
  `ba3c631c`.
- **P4** — 2026-11-18 15:50, the declaration, the installer and the docs committed ·
  `3474aced`.
- **E10** — 2026-11-18, the count pins: `rg -c 'TIER_COST.md merge=agentic-shared-telemetry'` →
  `.gitattributes` 1 · `template/.gitattributes` 1 · `BOOTSTRAP_WRITE.md` 1;
  `rg -c 'sessions.jsonl merge=agentic-shared-telemetry'` → 1 · 1; `rg -c 'agentic-shared-telemetry'
  UPGRADE.md` → 1; `rg -c 'appendFileSync' src/writer/shared-merge.mjs` → 2;
  `rg -c 'agentic-shared-telemetry' packages/agentic-workflow/README.md docs/workflow/TIER_COST.md` → 3 · 2.
- **E11** — 2026-11-18, `bun scripts/check-skill-context.mjs --documents` · exit 0 ·
  `PASS context documents: 4 budgeted documents` (AGENTS.md 725 lines of its 728 ceiling, 560 of 571
  prose, 13,085 of 13,259 est — the guide paragraph was compressed to a pointer at the crate README
  rather than re-pinning a ceiling).
- **E12** — 2026-11-18, `bun test scripts/normative-drift.test.mjs` · exit 0 · `21 pass, 0 fail`
  (the two `shared-merge-*` vocabulary rows now read the crate file) and
  `bun scripts/prose-gate-inventory.mjs` → `verdict: PASS`.
- **E13** — 2026-11-18, `bun scripts/docs-generate.mjs --check` · exit 0 · `3 checked · 0 stale ·
  0 orphaned` · `Roadmap: unchanged` (fix rows stay owner-managed, `PE-012`).
- **E14** — 2026-11-18, `node scripts/run-root-suite.mjs --jobs 2` · exit 0 · `122` suites PASS, 0 FAIL
  (the node leg of the whole repository).
- **E15** — 2026-11-18, `bun scripts/version-parity-gate.mjs --content` · exit 0 · `VERDICT: PASS`
  after the changeset declared `@gtrabanco/pi-agentic-workflow` (patch) beside the crate's minor.
- **P5** — 2026-11-18 16:05, the registry and both attribute pins derived from one map ·
  `d49c78e5`.
- **G1** — 2026-11-18, HEAD dc656baa136b8688480f545a288abe43365cb8d9,
  `bun scripts/local-gate.mjs --no-bail` · 18 of 19 steps exit 0
  (`docs-generated-projection`, `version-parity-content`, `version-parity-pins`, `secret-scan`,
  `log-immutability`, `workspace-install`, `root-suite`, `crate-suite-bun`, `crate-suite-node`,
  `schema-node-compat`, `pi-compat-guard`, `pi-node-compat`, `dependency-pin-gate`,
  `dependency-advisories`) · the one red is `worktree-guard` (exit 1), whose two findings name
  **other** sessions' worktrees — the pre-existing host condition recorded in
  §Known pre-existing issues, unchanged by this unit and left for the owner. This line lands in a
  docs-only commit after the run, so the gate receipt attests `dc656baa` plus this record.
- **L2** — 2026-11-18, the owner's correction request on this unit's 2026-11-18 `EXTERNAL VERIFY`
  receipt (`external-verify.md`: VERIFIED, 0 blockers, 6 advisories A1–A6), verbatim:
  "Apply to this repository: triage and fix those that deserve to fix but understand the context
  before fix and check you haven't broke another different thing, if you have done, start the loop
  again until you fixed full symbol/related stuff" — §0 resolves the verb as **fix findings**: the
  blockers set is empty, so the batch is advisory-scope by the owner's order (the same wording on
  VERIFIED receipts); §9 bounds apply — one batch, one recheck of what it touched, a second pass
  only if the same finding still fails.
- **P6** — 2026-11-18, the correction ledgers frozen before any code: obligations O18–O19 cut
  `planned`, evidence PE-013 appended, the six advisories routed as findings F1–F6, the verify
  receipt committed beside this doc · this commit.
- **D8** — 2026-11-18, §0 resolution from state before any action: **fix findings** against the
  unit's first `EXTERNAL VERIFY` receipt (base `748a372f`, head `c607c53a`) — outcome `proceed`, no
  ambiguity: the unit dir, its ledgers and the receipt all bind. Authority: L2, §9.
- **D9** — 2026-11-18, advisory A1 (`E10`'s README/TIER_COST counts): folded as an append-only
  evidence correction — `E16` records the observed counts; `E10` is never edited (the log-kind
  contract: a correction appends, never edits). The underlying validator (O14, at least 1 match
  per carrier) holds either way.
- **D10** — 2026-11-18, advisory A2 (`PE-008`'s base tallies 13/14): folded as `PE-013`, which
  supersedes the two tallies with the measured 12/15 — frozen evidence rows are never edited, and
  the head−base arithmetic (exactly the 5+5 new `F-630-*` cases) confirms the suites' substance.
- **D11** — 2026-11-18, advisory A3 (the crate bin's bare direct-execution spellings over a
  100644 file): folded as a docstring fix — the two usage lines spell `bun node_modules/…` per the
  runtime convention (manual invocation is bun-first; usage strings show the bun form). chmod 755
  is rejected: direct exec would pin the shebang's `node` and silently violate that convention,
  which the armed command resolves properly with its own bun-else-node switch.
- **D12** — 2026-11-18, advisory A4 (the plain-form class inference never fires — the code reads
  `argv[5]` where git's plain `%O %A %B %L %P` delivers the path at `argv[4]`): folded as the code
  fix — `resolveMerge` falls back to `argv[4]` when `argv[5]` is absent, making the module's own
  plain-form contract true. Red-first: the inference case lands failing at its own commit. A
  doc-only fix (deleting the plain-form claim) is rejected: the documented capability is the right
  behavior and the index is the defect, and the unknown-path refusal stays closed either way.
- **D13** — 2026-11-18, advisory A5 (`UPGRADE.md` "the five … class lines" counts classes, not
  lines): folded as the recount reword — five classes, six registry lines, both enumerated.
- **D14** — 2026-11-18, advisory A6 (the bare `telemetry` refusal wording now names the second
  token): **wontfix** — the new wording is the correct consequence of the `merge-install` route;
  reverting would make the refusal lie about what it accepts. The `telemetry-reconstruct@1`
  refusal envelope, the exit codes and every pinned assertion are unchanged.
- **E16** — 2026-11-18, advisory A1's observed counts: `rg -c 'agentic-shared-telemetry'
  packages/agentic-workflow/README.md docs/workflow/TIER_COST.md` · exit 0 · `README.md:1`,
  `TIER_COST.md:1` (matching lines; 2 · 1 occurrences by `rg -o`) — identical at head `c607c53a`
  and at every commit in the range (`3474aced`, `d49c78e5`); `E10`'s "3 · 2" matched no state of
  the tree. The other six counts on `E10` reproduce exactly.
- **E17** — 2026-11-18, RED observed before the fix · `bun test scripts/shared-doc-merge.test.mjs`
  · exit 1 · `17 pass, 1 fail` — the plain-form case fails at its status assertion (the driver
  refuses `unknown-path` where the module's contract says it infers) · corpus commit `c542cef0`.
- **E18** — 2026-11-18, GREEN after the fix · `bun test scripts/shared-doc-merge.test.mjs` · exit 0
  · `18 pass, 0 fail` (the plain form infers `roadmap` from the named path, unions the rows, and
  the unknown plain-form path still refuses) · fix commit `893f3734` (O18 verified).
- **E19** — 2026-11-18, O19's validators in the foreground: `rg -c 'bun
  node_modules/@gtrabanco/agentic-workflow/bin/shared-merge.mjs'
  packages/agentic-workflow/bin/shared-merge.mjs` → 2; `rg -c 'the five .agentic-shared'
  skills/init-workspace/references/UPGRADE.md` → 1; `rg -c 'six registry lines'
  skills/init-workspace/references/UPGRADE.md` → 1; `bun scripts/check-skill-context.mjs
  --documents` → `PASS context documents: 4 budgeted documents` and the skills mode → `PASS
  context budgets: 30 skills` (O19 verified).
- **E20** — 2026-11-18, the loop check over everything that reads the touched module · all exit 0:
  `scripts/docs-generated-merge.test.mjs` 18/0 · `writer.merge.test.mjs` 20/0 ·
  `telemetry-merge-install.test.mjs` 8/0 · `telemetry-reconstruct.test.mjs` 18/0 ·
  `doctor.checks.test.mjs` 21/0 · `normative-drift.test.mjs` 21/0 · the crate suite `bun run test`
  1304/0 · `scripts/unit-route.test.mjs` alone 64/0.
- **E21** — 2026-11-18, the differential (§6): pre-batch head `c607c53a` vs batch head `893f3734`,
  identical scratch fixtures, fresh `%A` copies per case, every touched command through the root
  entry · 12 cases: 10 byte-identical (install both shapes, roadmap union, telemetry table, JSONL
  union, unknown-path and class-mismatch refusals, unreadable-side, both usage errors) · the two
  differences are exactly the asked repair: `plain-known` refuses `unknown-path` exit 1 at base →
  infers `roadmap` from the named path and resolves exit 0 at head, and `plain-unknown`'s refusal
  now names the path the driver was handed instead of the base temp file (exit 1 both).
- **F1** — 2026-11-18, folded at `b190821d`: `E16` records the observed counts beside `E10`, which
  is never edited; the underlying validator (O14) re-confirmed green in the verify receipt.
- **F2** — 2026-11-18, folded at `b190821d`: `PE-013` supersedes `PE-008`'s two tallies with the
  measured 12/15 (scratch `git archive origin/main` run); the head−base delta arithmetic confirms
  the suites' substance.
- **F3** — 2026-11-18, folded at `b12a8bbf`: the crate bin's two usage spellings carry the `bun`
  runtime prefix (O19's count pins them); the file's mode stays 100644 per the `path-guard.mjs`
  precedent, so no armed path changes.
- **F4** — 2026-11-18, folded at `893f3734`: `resolveMerge` falls back to `argv[4]` when `argv[5]`
  is absent — the plain form infers the class from the named path as the module's contract states,
  and the unknown-path refusal stays closed (red first at `c542cef0`, green at `893f3734`; the
  differential shows the two asked differences and ten byte-identical cases).
- **F5** — 2026-11-18, folded at `b12a8bbf`: `UPGRADE.md` now counts five classes and six registry
  lines, both enumerated; the init-workspace budgets stay green (E19).
- **F6** — 2026-11-18, folded wontfix at this commit (D14): the new refusal wording is the correct
  consequence of the `merge-install` route; the envelope, exit codes and pinned assertions are
  unchanged.
- **P7** — 2026-11-18, the correction batch's commits: `b190821d` (ledgers + receipt), `c542cef0`
  (red corpus), `893f3734` (the fix), `b12a8bbf` (prose currency), this commit (close-out) ·
  `scripts/test-impact.mjs --base c607c53a` → `targeted` (3 executable paths, 1 suite by path);
  the loop check ran the wider set by hand (E20).
- **G2** — 2026-11-18, `bun scripts/local-gate.mjs --no-bail` at the batch content (post C5's
  working-tree edits) · exit 0 · **PASS — 19 step(s) in 560s**, every step green including
  `root-suite`, `crate-suite-bun`, `crate-suite-node` and `worktree-guard`. A first gate attempt
  on this shared box hit the documented load flake (`scripts/unit-route.test.mjs` F7 — 64/0
  alone, E20) and was re-run on a quieter host: the flake is the pre-existing environment
  condition §Known pre-existing issues records, not a batch regression. This line lands in a
  docs-only commit after the run, so the gate receipt attests the batch head plus this record.
### Correction history

2026-11-18 — one owner-directed correction batch on the first `EXTERNAL VERIFY`
receipt (VERIFIED, 0 blockers, 6 advisories): F1–F5 folded (E16's observed
counts, PE-013's superseding base tallies, the crate bin's runtime-prefixed
usage spellings, the plain-form class inference fix, the UPGRADE.md recount),
F6 folded wontfix (D14). Red-first: the plain-form case landed failing at its
own commit before the fix. Obligations O18–O19 cut `planned` at the batch cut
and flipped only on their foreground validators.

## Next

The owner's delta verification of the correction batch (`/aw-local-review` or a
delta `EXTERNAL VERIFY` on the correction head); the batch's own recheck is
recorded in E17–E21 and G2, and the next verify run binds this unit's receipt as
its delta base.

## References

- Issue: [#630](https://github.com/gtrabanco/agentic-workflow/issues/630)
- The merge layer it joins: [`docs/features/498-shared-writer-driver/SPEC.md`](../../features/498-shared-writer-driver/SPEC.md)
- The writer contract it must not fork: [`packages/agentic-workflow/README.md`](../../../packages/agentic-workflow/README.md) `writer-driver-contract@1`
- The ledger whose rows this merges: [`docs/workflow/TIER_COST.md`](../../workflow/TIER_COST.md) `tier-cost@2`

## Branch

`feat/630-telemetry-merge-safety`

## Depends on

None.

## Regression scope

| Scenario | Verification |
|---|---|
| The four existing classes keep their semantics (`roadmap` row union, `budgets` structural union, `repo-state` fail-closed, `logs` entry union) | `bun test scripts/shared-doc-merge.test.mjs` exits 0 |
| The driver's fail-closed decisions hold: unknown path, generated projection, class mismatch, unreadable side, malformed side, usage errors | same suite, the `FF-6` cases |
| `scripts/shared-doc-merge.mjs --install` still arms every class in a fixture checkout, idempotently, and refuses a non-checkout | same suite, the `--install` cases |
| Every armed checkout keeps working after the mechanics move | same suite; the armed command still names the script |
| The writer/ledger behaviour is untouched: `O_APPEND` appends, the duplicate guard compares a whole row | `bun test packages/agentic-workflow/test/telemetry-reconstruct.test.mjs` exits 0 |
| The reconstruction writes no file outside its two destinations | same suite, `write touches nothing outside the two destinations it names` |
| The doctor's `merge-drivers` probe and installer still resolve the shared classes | `bun test packages/agentic-workflow/test/doctor.checks.test.mjs` exits 0 |
| The root gate, the context budgets and the projection stay green | `bun scripts/local-gate.mjs` exits 0 |
