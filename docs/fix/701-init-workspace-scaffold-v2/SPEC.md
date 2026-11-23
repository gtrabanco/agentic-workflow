---
type: fix
scope: large
roadmap_summary: The scaffold comparator travels: `runner scaffold-contract check` reads the installed release's own section contract and reports the consumer's `docs/{features,fix}/_TEMPLATE` against it, so a template that drifted after install/upgrade is named instead of discovered by an audit rejection; the same engine gains `authoring`, the write-time check that dies at emission rather than at audit; and the export gains the worktree namespace law with its guard, the gate/hook equivalence enumeration, and the gate integrity floor. SPEC: [SPEC](fix/701-init-workspace-scaffold-v2/SPEC.md)
---

# fix/701-init-workspace-scaffold-v2

> Issue #701 asks for four scaffold-contract repairs a consumer project hit in
> one week. Three premises hold exactly as filed and are shipped. Two do not
> reproduce against this tree and are recorded as a premise correction rather
> than implemented as stated: the `### Triaged steps` heading-level drift (all
> four templates carry `## Triaged steps`) and the three-truths
> acceptance-section drift (no template ships an acceptance section at all —
> the real defect is the *promise* without the section). The mechanism the
> issue is actually about — a comparator that never leaves the vendor repo, so
> nothing re-checks a consumer's templates after drift, upgrade, or local
> edits — holds, and travels here.

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
external-verify.md | trimmable
review-findings.md | trimmable
planning-findings.md | trimmable
planning-evidence.md | kept
planning-obligations.md | kept
decisions.md | kept
SPEC.md | kept
```

## Issue

`#701` — tracked issue in the project's forge. The PR closes it via
`Closes #701`.

## Specs

**S1 — the issue under application.**
> "Apply to this repository: issue #701"

**S2 — a consumer's template must never write a shape the release rejects.**
> "A consumer project's unit-doc scaffold must never write a shape the installed release's contract rejects — the four scaffold defects fix-101/fix-334 (sosfelinosbasti) hit in one week, each traceable to something neither init-workspace nor upgrade defines."

**S3 — the comparator must travel to the consumer.**
> "- **Travel the comparator to consumers**: run the existing `scaffold-parity` comparison as a runner subcommand or install/upgrade check against the consumer's `docs/{features,fix}/_TEMPLATE` (and other scaffold contract surfaces), report each mismatch, and offer to apply the current templates. Any new fixed grammar the check reads ships as a normative surface, never parsed from prose."

**S4 — a write-time structural check for the staged unit doc.**
> "- **A write-time structural check for the staged unit doc** (the #698 companion): heading presence, acceptance-section name, tick consistency — so the F18/F1 class dies at emission, not at audit."

**S5 — the worktree namespace law and its guard travel to the template.**
> "- **Worktree namespace law + guard** shipped to the template (the vendor's rule statement, plus a pre-flight or audit guard)."

**S6 — gate/hook equivalence is enumerated, never discovered.**
> "- **Gate/hook equivalence enumeration** in the bypass rule and init-workspace's gate docs; a step the hook runs and the gate lacks is named, not discovered by a review finding."

**S7 — the gate integrity floor.**
> "- **Gate integrity floor** as template text: no masking of truncation; env/runtime parity with CI is declared, not assumed."

**S8 — the acceptance shape the issue states.**
> "A consumer installs the workflow and a fresh relay authoring session cannot produce a unit doc the audit layer rejects for shape; upgrade is idempotent about contract parity; `git worktree add` into `.git/worktrees/` is refused or audited; a bypassed hook whose step the gate lacks is named at bypass time; a gate that can pass while executing a fraction of the suite is a declared defect, not a green receipt."

**S9 — the requester's delivery instruction.**
> "Create the pr when finish"

**S10 — the requester's procedure, verbatim in its binding parts.**
> "Print the resolution **before** any action — the state decides the sequence, the words only pick the verb"
>
> "If this change repairs known failures, extract each one's reproducer from git history / the findings ledger **as a failing check before implementing** — they are the test corpus; the change is done when every reproducer passes."
>
> "No `review-change`, no `audit-pr`, no fold cycle, no self-granted gate exceptions on this change. Direct application: the §5 ledger freeze **is** the plan; implement against it, hand the diff to me."
>
> "Work-unit commits of ~400 authored changed lines (additions+deletions), Conventional Commit messages, tests and docs alongside behavior."

```text
spec-requirement@1
kind | shape | what it orders
requirement | **S<n>[a-z]? — <title>.** | one requirement; the id is what a task links and a finding cites
quote | > <the requester's words, verbatim> | the requirement's own text, unedited apart from a marked elision
correction | **S<n><letter> — <title>.** | an appended amendment to requirement S<n>; never an edit of it
```

## Premise correction (recorded, not silently dropped)

Three of the issue's four scope claims reproduce and are shipped. Two do not
reproduce against this tree at the cut head (`0c0e2718a`), measured before any
byte changed:

- **§1 "`### Triaged steps` where the contract wants top-level `## Triaged
  steps`"** — all four templates (`docs/fix/_TEMPLATE`, `docs/features/_TEMPLATE`
  and both `template/` twins) carry `## Triaged steps` at level 2, `rg -c
  '^## Triaged steps$'` answering 1 for each (PE-001). Moving one to `###` in a
  throwaway copy left `phase-lint` at `PASS (6/6)` for every phase: the linter
  reads unit-doc sections at any heading level, so the reported failure is not
  reachable through the linter that was named (PE-002). The F18/F1 class the
  issue describes is real in the *field* (a relay wrote the drift by hand), but
  the template is not its source here — so this unit ships the check that would
  catch it (S4), not an edit to a correct template.
- **§1 "three surfaces, three truths about one contract section"** (the
  acceptance section: the frontmatter comment names `## Acceptance criteria`, the
  header names `## Acceptance`, fix-334 used `## Acceptance criteria`) — no
  template ships an acceptance section at all; all four carry only the
  single frontmatter comment at line 6 naming `## Acceptance criteria`
  (PE-003). The real defect is the inverse of the one filed: the template
  **promises** a section the design step writes and never ships its shape, so a
  fresh author has no shipped sentence to copy. `## Acceptance` and
  `## Acceptance criteria` are not two truths the template holds — the former
  appears nowhere in the export. This unit does not invent an acceptance
  section into `spec-by-reference` (that shape retired the heading on purpose,
  PE-004); it pins the promise that does exist — the `ac-hash` frontmatter
  contract — and reports a document whose section the hash cannot find.
- **§1(a) "the comparator runs in the vendor repo over the export — it never
  travels to a consumer"** — measured true: `template/` carries no `scripts/`
  directory and zero references to `scaffold-parity` (PE-005). **Shipped.**
- **§2 the worktree namespace** — measured true: `template/AGENTS.md` carries no
  `.git/worktrees/` or `IR8` mention, and the export ships no worktree guard
  (PE-005). **Shipped.**
- **§3/§4 gate-hook equivalence and the gate integrity floor** — measured true:
  zero occurrences of the bypass enumeration or the truncation/masking rule in
  the export (PE-005). **Shipped.**

## Impact

- **The crate** gains one runner subcommand, `scaffold-contract`, with two
  operations: `check` (the traveled comparator, S3) and `authoring` (the
  write-time check, S4). Its engine lives in
  `packages/agentic-workflow/src/runner/sensors/scaffold-contract.mjs` and
  dispatches through `src/runner/cli.mjs`'s closed table, so one package install
  gives a consumer both.
- **The contract itself is never copied.** Both operations read the section
  lists from the schema package's `resolveUnitDocShape` /
  `UNIT_DOC_SECTION_SHAPES` / `selectSpecProduct`, which is the owner
  (`vocabulary-residency@1`). A second literal list in the new module would be
  exactly the drift class this unit repairs.
- **The export** (`template/`) gains the worktree namespace law with its guard
  instruction (S5), the gate/hook equivalence enumeration (S6) and the gate
  integrity floor (S7) — text a consumer's install already carries a home for.
- **`skills/init-workspace`** gains the two commands in its upgrade path (step
  2 runs `check`, step 6 runs it again after writing) and names `authoring` as
  the relay's emission check; its reference allowlist is unchanged (the command
  is in `RUNNER.md`'s closed set).
- **Consumers of `scaffold-parity.test.mjs` and `unit-doc-contract.test.mjs`**:
  both keep their behaviour. The new engine is a *third* reader of the same
  owner, not a replacement; the two existing suites are the untouched-behaviour
  half this unit's corpus pins.

## Surfaces

- `packages/agentic-workflow`
- `skills`
- `docs`

## Retirements

Strictly additive: one runner subcommand with two operations, one sensor
module, one suite, and prose. No published command, grammar, contract or
template section is removed.

| Superseded | Replaced by |
|---|---|
| "a consumer has no way to ask what its installed release expects of its unit-doc templates" — the question was answered by reading the vendor's source or by an audit rejection | `runner scaffold-contract check --workspace <dir>`, which prints the mismatch rows against the installed release's own contract |

## Non-goals

- **Writing the current templates into the consumer.** The issue's S3 says
  "offer to apply the current templates". The offer stays the operator's act in
  `init-workspace`'s existing never-clobber write step; this unit ships the
  *report* that makes the offer informed. A command that rewrites a tailored
  template is the `init-workspace` no-clobber invariant's business, not a
  sensor's.
- **Shipping an acceptance section into `spec-by-reference`.** That shape
  retired the heading on purpose (PE-004); re-adding it would make
  `## Acceptance criteria` a foreign section for every document the lane
  writes.
- **Auditing `git worktree add` at the git level.** git offers no pre-command
  hook for a builtin (PE-006, the same measurement fix/693 relied on). The
  export ships the law plus the audit command a hook can call; refusing the
  invocation itself is not available.
- **Re-implementing `scaffold-parity`/`unit-doc-contract`.** They stay; this
  unit's suite proves they still answer what they answered.
- **A second bypass mechanism.** The enumeration names what the hook runs and
  the gate lacks; it does not add, remove or replace a hook.

## Risk tier

- **Tier** — `standard` · **Task Size** — understood + contained risk + resumable from diff
- **Named high-risk item** — none — not a high-tier unit

The verdict, `runner ceremony tier classify` at the cut head, verbatim:

```json
{
  "contract": "risk-tier-verdict@1",
  "tier": "standard",
  "reason": "2 path(s) carry executable content: packages/agentic-workflow/src/runner/cli.mjs, packages/agentic-workflow/src/runner/sensors/scaffold-contract.mjs",
  "reason_kind": "executable-content",
  "task_size": {
    "understood": true,
    "contained_risk": "contained",
    "resumable_from_diff": true,
    "ceremony": "unit-doc",
    "verification": "gates"
  },
  "signals": [],
  "paths": {
    "changed": [
      "packages/agentic-workflow/src/runner/sensors/scaffold-contract.mjs",
      "packages/agentic-workflow/src/runner/cli.mjs",
      "template/AGENTS.md",
      "skills/init-workspace/references/UPGRADE.md"
    ],
    "escalating": [
      "packages/agentic-workflow/src/runner/cli.mjs",
      "packages/agentic-workflow/src/runner/sensors/scaffold-contract.mjs"
    ],
    "inert": [
      "skills/init-workspace/references/UPGRADE.md",
      "template/AGENTS.md"
    ]
  }
}
```

The new sensor is read-only over bytes it is handed; its only mutation is none.
Every invocation during development ran against `mktemp -d` scratch copies of
fixture trees, never against this worktree's own `docs/`.

## Future

none

## Future cost

- A new required unit-doc section is added in the schema package and reaches a
  consumer through the package release — never by editing a template into
  agreement. Binds: anyone tempted to fix a parity row by hand.
- A new `TEMPLATE_SURFACES` entry must be a path both the vendor export and a
  consumer install carry, or `check` reports it `absent` forever. Binds: the
  next author of the surface list.
- The gate/hook enumeration is prose in the export; a project that adds a hook
  step without naming it there re-opens the N1/N2 class. Binds: the next hook
  author in a consumer project.

## Applicable tests

- `packages/agentic-workflow/test/scaffold-contract.test.mjs` (new) — the
  reproducer corpus: a drifted template is reported, a current template is
  clean, a template missing its acceptance section is reported under `authoring`
  only when it asserts one, an unknown workspace is a refusal, and both
  operations are read-only.
- `packages/agentic-workflow/test/cli.surface.test.mjs` — the untouched half:
  the README usage line and Commands table keep restating the bin token for
  token with the new subcommand added to both.
- `bun test scripts/scaffold-parity.test.mjs` — the export still carries its
  repo twin's sections in order after the export's new prose.
- `bun test scripts/unit-doc-contract.test.mjs` — the section contract is still
  one list, read from its owner.
- `bun test scripts/check-skill-context.test.mjs` and
  `bun scripts/check-skill-context.mjs --documents` — the edited skill and
  reference stay within their budgets.

## Known pre-existing issues

- A fresh worktree has no `node_modules` and no built `dist/`, so a run needs an
  install plus the schema build first — **does-not-affect** the change; it is
  why every receipt below names the build it ran on. `bun install
  --frozen-lockfile` refuses in this checkout ("dependencies in package.json
  changed … `@gtrabanco/agentic-workflow` changed from 4.10.0 to 4.10.0 in
  packages/pi-agentic-workflow") and a plain `bun install` rewrites
  `bun.lock` — **does-not-affect** (the rewrite was reverted before any commit,
  see `## Log` L4), and it is the D-40-14 train split the pin watch owns.
- `scripts/unit-doc-contract.test.mjs`'s `#462 …train version` case fails:
  `packages/agentic-workflow` is `4.10.1` while
  `packages/agentic-workflow-schema` is `4.10.0` (D-40-14). **does-not-affect** —
  this unit touches no template stamp and no `packages/*/package.json` version;
  the split reproduces on a pristine `origin/main` archive.

## Acceptance criteria

Each criterion names the observable and the check that proves it. The head of
every AC is the requirement it discharges.

- **AC1 (S3)** — `runner scaffold-contract check --workspace <dir>` reads the
  installed release's section contract from the schema package and prints one
  `MISMATCH <surface> — <reason>` row per disagreeing exported template, or
  `SCAFFOLD OK — <n> surface(s) match` when they agree; a workspace with no
  templates is `absent`, never a pass it did not measure. Proved by
  `bun test packages/agentic-workflow/test/scaffold-contract.test.mjs` exits 0.
- **AC2 (S3)** — The command travels: it ships in the crate's closed dispatch
  table and its bin, so a consumer installs one package and gets it, and the
  README usage line and Commands table restate it token for token. Proved by
  `bun test packages/agentic-workflow/test/scaffold-contract.test.mjs` and
  `bun test packages/agentic-workflow/test/cli.surface.test.mjs` exit 0.
- **AC3 (S4)** — `runner scaffold-contract authoring <unit-doc>` reports the
  shape defects a document carries — a missing section, a duplicate, an
  out-of-order section, a heading at the wrong level — through the schema
  package's own selector, so an author learns of the F18/F1 class at emission
  with the same vocabulary the audit uses later, never a second opinion.
  Proved by `bun test packages/agentic-workflow/test/scaffold-contract.test.mjs`
  exits 0.
- **AC4 (S4)** — A document whose frontmatter declares `ac-hash` but whose
  `## Acceptance criteria` section is absent or whose recorded hash does not
  re-derive is reported, not silently accepted. Proved by
  `bun test packages/agentic-workflow/test/scaffold-contract.test.mjs` exits 0.
- **AC5 (S5)** — The exported guide carries the worktree namespace law: a
  worktree never lives under `.git/worktrees/`, the measured consequence is
  stated, and the guard a project can call is named. Proved by
  `bun test packages/agentic-workflow/test/scaffold-contract.test.mjs` exits 0
  (the export-text case pins each required sentence).
- **AC6 (S6)** — The exported guide's bypass rule enumerates what the gate does
  not cover and says a step the hook runs and the gate lacks must be named at
  bypass time, never discovered by a review finding. Proved by
  `bun test packages/agentic-workflow/test/scaffold-contract.test.mjs` exits 0.
- **AC7 (S7)** — The exported guide states the gate integrity floor: no gate
  step may mask truncation (a suite runner that can exit 0 having executed a
  fraction), and the local gate's runtime and environment must be declared
  equal to CI's rather than assumed. Proved by
  `bun test packages/agentic-workflow/test/scaffold-contract.test.mjs` exits 0.
- **AC8 (S8)** — Both operations are read-only: no command writes a template, a
  unit doc or a config byte, and a run over a `mktemp` copy leaves the tree
  byte-identical. Proved by
  `bun test packages/agentic-workflow/test/scaffold-contract.test.mjs` exits 0.
- **AC9 (S2, S3)** — The consumer-facing skill instructs the upgrade path to run
  `check` before and after its additive writes, and names `authoring` as the
  emission check; and the two existing suites
  (`scaffold-parity`, `unit-doc-contract`) still answer what they answered
  before the change. Proved by
  `bun test scripts/scaffold-parity.test.mjs` and
  `bun test scripts/unit-doc-contract.test.mjs` exit with the same case counts
  as the cut-head baseline recorded in `## Log` L5.

## Tasks

- P1 — Freeze these ledgers, the premise correction, and land the RED corpus:
  the new suite plus the touched existing cases, observed failing on the
  missing module and the missing export text.
  (validator: `bun test packages/agentic-workflow/test/scaffold-contract.test.mjs` exits non-zero before the module exists)
  (Implements: S1, S3, S4, S5, S6, S7, S8, S9)
  - Relevant files: docs/fix/701-init-workspace-scaffold-v2/SPEC.md, packages/agentic-workflow/test/scaffold-contract.test.mjs
- P2 — Implement `packages/agentic-workflow/src/runner/sensors/scaffold-contract.mjs`:
  the surface list, `check`, `authoring`, the fixed output vocabularies and the
  refusals, reading every section list from the schema package's owner.
  (validator: `bun test packages/agentic-workflow/test/scaffold-contract.test.mjs` exits 0)
  (Implements: S3, S4, S8)
  - Relevant files: packages/agentic-workflow/src/runner/sensors/scaffold-contract.mjs
- P3 — Dispatch the command: one entry in `src/runner/cli.mjs`'s closed table,
  the bin's usage line, and the crate README's Commands row plus its usage
  line, so the surface is discoverable and its token-for-token pin holds.
  (validator: `bun test packages/agentic-workflow/test/cli.surface.test.mjs` exits 0 and `bun test packages/agentic-workflow/test/scaffold-contract.test.mjs` exits 0)
  (Implements: S3, S8)
  - Relevant files: packages/agentic-workflow/src/runner/cli.mjs, packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/README.md
- P4 — Write the export's three repair texts: the worktree namespace law with
  its guard, the gate/hook equivalence enumeration in the bypass rule, and the
  gate integrity floor.
  (validator: `bun test packages/agentic-workflow/test/scaffold-contract.test.mjs` exits 0 and `bun test scripts/scaffold-parity.test.mjs` exits 0)
  (Implements: S5, S6, S7)
  - Relevant files: template/AGENTS.md
- P5 — Wire the consumer-facing skill: the upgrade path runs `check` before and
  after its additive writes, and names `authoring` as the emission check.
  (validator: `bun scripts/check-skill-context.mjs` exits 0 and `rg -c 'scaffold-contract' skills/init-workspace/` counts at least 3)
  (Implements: S2, S3, S4, S8)
  - Relevant files: skills/init-workspace/references/UPGRADE.md, skills/init-workspace/SKILL.md
- P6 — Documentation and state: the crate README row already lands in P3, so
  this task carries the repository-surface currency — `docs/workflow/SKILLS.md`
  unchanged check, the unit doc's evidence rows and log lines, the roadmap row —
  and the final verification run.
  (validator: `bun scripts/check-skill-context.mjs --documents` exits 0 and `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S8, S10)
  - Relevant files: docs/fix/701-init-workspace-scaffold-v2/SPEC.md, docs/ROADMAP.md

### Planning evidence

This unit is `scope: large`, so the ledger lives in
[`planning-evidence.md`](planning-evidence.md) and this section names it — never
both (owner: `skills/pre-execution-review/references/LEDGERS.md`). Ten rows,
`PE-001`…`PE-010`.

### Obligations

The same M/L convention: the ledger lives in
[`planning-obligations.md`](planning-obligations.md) and this section names it —
never both. Eleven rows, `O1`…`O11`; every row `pending` at cut and flipped only
against a foreground-run validator.

## Triaged steps

```text
n/a — this unit was applied through the owner's local workflow (S10), which
substitutes this document's Tasks for the `runner unit-route --triage` block.
No machine step list was produced.
```

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|
| F1 | S3 | plan | SUGGESTION | docs-only | plan | product owner — S3's "offer to apply the current templates" is discharged as `init-workspace`'s existing never-clobber offer informed by the new report, not by a sensor that writes. Confirm or redirect at review |

## Log

- L1 — the issue text, verbatim: see `## Issue` and the `## Specs` block above.
- L2 — `request` — the requester's opening instruction for this session:
  "Apply to this repository: issue #701" (S1), followed by the local workflow
  procedure this unit follows (S10), and the delivery instruction "Create the pr
  when finish" (S9).
- L3 — `decision` — index `info/refs` read: the branch is `feat/701-init-workspace-scaffold-v2`
  and the PR opens when the unit is done, not before.
- L4 — `evidence` — workspace provisioning in this worktree: `bun install
  --frozen-lockfile` refused (PE-008) and a plain `bun install` rewrote
  `bun.lock`; the rewrite was reverted with `git checkout bun.lock` before any
  commit, so no lockfile byte ships. The schema package's `dist/` was built with
  the workspace's own `tsc`. Nothing was written to this repository's `docs/`
  by any new command: every probe ran under `mktemp -d`.
- L5 — `gate` — cut-head baseline at `0c0e2718a`: `bun test
  scripts/scaffold-parity.test.mjs` 17 pass / 0 fail; `bun test
  scripts/unit-doc-contract.test.mjs` 20 pass / 1 fail (`#462 …train version`,
  D-40-14, `4.10.0` vs `4.10.1`). This is AC9's comparison point.
