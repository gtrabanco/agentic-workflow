# AGENTS.md

> **The repository's single agent guide** — one copy of these rules. A host that
> reads only `CLAUDE.md` points at this file instead of duplicating it (the
> `init-workspace` skill applies the same rule to target projects).

Guidance for AI coding agents working in **this** repository (`agentic-workflow`).

This repo is **not** an application. It ships two things: **`skills/`** — a
stack-agnostic set of agent skills that run a disciplined, doc-driven
feature/issue workflow, one `skills/<name>/SKILL.md` each — and **`template/`** —
an exportable documentation scaffold (documentation map, SPEC/feature/fix
templates, GitHub templates, conventions) that a target project copies so the
skills have a substrate to operate on. The skills are **project-adaptive**: at
runtime they discover and obey the target project's own guide, documentation map,
architecture, roadmap and style docs, so nothing here is tied to a specific
stack, framework, or architecture pattern.

## Repository layout

```
skills/                  the workflow skills (one SKILL.md each) — the installable source
template/                the exportable documentation scaffold (generic, copyable)
packages/                four companion npm packages (bun-managed islands — docs/workflow/PACKAGES.md)
scripts/                 the deterministic gates and generators, each with its sibling *.test.mjs
docs/workflow/           the tutorial: feature flow, issue flow, skill reference, replication
docs/ROADMAP.md          the single Features+Fixes index — the worklist
docs/architecture/       ARCHITECTURE.md and ARCHITECTURAL_INVARIANTS.md
docs/design/             design notes (REDESIGN.md)
docs/research/           research notes and their evidence
docs/CAPABILITIES.md     the capability inventory (roles + cross-cutting subsystems)
docs/LOGS.md             the session journal (`log-session` writes it)
docs/features/_TEMPLATE  feature SPEC template
docs/fix/                fix SPEC template + one folder per fix unit
.changeset/              per-PR release intent files
.github/                 issue + PR templates the workflow expects
skills.sh.json           the skills-CLI manifest
README.md                project overview
```

**Dogfooding model (authoring):** repo sessions consume the workflow from the
installed release (Pi package / installed plugin), not from the working copy; the
committed layout carries no working-copy activation surface. Authoring sessions
opt in by creating a local, gitignored mount (`ln -sfn ../skills .claude/skills`)
or by exercising a single working-copy skill via per-session flags (e.g.
`pi --no-skills --skill skills/<name>/SKILL.md`). **One home:** the rationale and
the export path are [`README.md`](README.md#whats-inside).

## Documentation map

Which doc owns what — read the right context before acting, and add a row when a
new doc takes ownership of a task:

| Task | Required docs |
|---|---|
| Any change to these skills, gates or templates | this guide, then the owner each line below names; [`docs/workflow/GATE_INVENTORY.md`](docs/workflow/GATE_INVENTORY.md) owns which carrier each gate has |
| Authoring or editing a skill | [`docs/workflow/SKILL_AUTHORING.md`](docs/workflow/SKILL_AUTHORING.md) |
| Anything under `packages/` | [`docs/workflow/PACKAGES.md`](docs/workflow/PACKAGES.md) |
| Picking up work, sequencing a unit | [`docs/ROADMAP.md`](docs/ROADMAP.md), [`docs/workflow/LANE_FLOW.md`](docs/workflow/LANE_FLOW.md) |
| Writing a unit doc | [`docs/features/_TEMPLATE/SPEC.md`](docs/features/_TEMPLATE/SPEC.md), [`docs/fix/_TEMPLATE/SPEC.md`](docs/fix/_TEMPLATE/SPEC.md) |
| An architecture change or a cross-cutting rule | [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md), [`docs/architecture/ARCHITECTURAL_INVARIANTS.md`](docs/architecture/ARCHITECTURAL_INVARIANTS.md) |
| A new capability or integration surface | [`docs/CAPABILITIES.md`](docs/CAPABILITIES.md) |
| Resuming a session, or what happened last | [`docs/LOGS.md`](docs/LOGS.md), [`docs/workflow/REPOSITORY_STATE.md`](docs/workflow/REPOSITORY_STATE.md) — the domain-separation safeguard's detail is [`docs/workflow/DOMAIN_SEPARATION.md`](docs/workflow/DOMAIN_SEPARATION.md) |
| The tutorial as a whole | [`docs/workflow/README.md`](docs/workflow/README.md) — it owns the pages index |

## Deep references

This file is the **core**: identity, layout, the rules that bound every change,
the verification gate and the machine contracts. Everything that only matters
while doing one kind of work is one hop away and read on demand:

| Reference | Read it when you are… |
|---|---|
| [`docs/workflow/SKILL_AUTHORING.md`](docs/workflow/SKILL_AUTHORING.md) | authoring or editing a skill: frontmatter contract, body sections, the closing `→ Next:` block, hand-off vs compose across a model/effort boundary |
| [`docs/workflow/PACKAGES.md`](docs/workflow/PACKAGES.md) | touching `packages/`: the bun workspace, the single lockfile, pin rules, the version-parity gate, changesets, publish channels |
| [`docs/workflow/GOLDEN_FIXTURE.md`](docs/workflow/GOLDEN_FIXTURE.md) | smoke-testing a wording change to an executor-path skill |
| [`docs/workflow/GATE_INVENTORY.md`](docs/workflow/GATE_INVENTORY.md) | asking whether a gate survives a compaction, and where its carrier lives |
| [`docs/workflow/SKILLS.md`](docs/workflow/SKILLS.md) | looking up what a skill does, or where it runs in the flow |
| [`docs/workflow/REPLICATE.md`](docs/workflow/REPLICATE.md) | replicating the workflow into another project |
| [`docs/workflow/MIGRATION.md`](docs/workflow/MIGRATION.md) | landing a breaking surface, and needing the migration note beside it |
| [`docs/workflow/SETUP.md`](docs/workflow/SETUP.md) | provisioning this repo's own authoring toolchain |
| [`docs/workflow/DOMAIN_SEPARATION.md`](docs/workflow/DOMAIN_SEPARATION.md) | running product-audit here (the domain-drift sweep's method), or when unsure which domain a decision belongs to |

## Instruction precedence

When two sources disagree, the **nearest one wins**:

1. An explicit instruction in the prompt.
2. The nearest `AGENTS.md` — this file is the repository's root one.
3. A personal `~/AGENTS.md`.
4. The documents: `docs/ROADMAP.md`, this directory's `docs/workflow/` tutorial,
   and the unit docs.

A lower rung never overrides a higher one. Where the same rule lives below this
file, this guide **links** it instead of restating it (see the ownership rule
under [Working rules](#working-rules)).

## Working rules

- **Docs language is English-only (permanent).** Every committed artifact (skills,
  docs, templates, `README`, `CHANGELOG`, commits, PR descriptions) is in English,
  regardless of the language used to request the work; reply to the user in the
  user's language. The bilingual `.es.md` siblings were removed repo-wide
  (2026-09-15). Owner decision 2026-10-27 (issue
  [#232](https://github.com/gtrabanco/agentic-workflow/issues/232)): the package
  ships **English-only permanently** — bilingualism is a rendering concern of the
  project's upcoming web layer (#295 direction), never a committed artifact. Do
  **not** create or update any `.es.md` sibling, add a language-switcher link, or
  translate any package surface.
- **Vendored third-party code carries its provenance.** Any code copied from a
  third party into this repository — into a package's `src/`, a script, or a
  skill reference — keeps a header comment naming the **source URL, the author,
  the version copied, and the license name**. A copy without those four is a
  provenance defect: an upstream relicensing or an attribution obligation cannot
  be audited later. Vendoring is a real alternative to adding a
  dependency and it is weighed as one (unit 28's D36 rejected a 1,419-line
  copied `sha256` closure on measured cost and kept the package's own core, and
  AC21 keeps the schema package dependency-free); whichever route a change
  takes, the provenance header is mandatory for the first.
- **Stack/architecture agnostic.** Do not introduce references to any specific
  product, stack, framework, ORM, runtime, or architecture pattern into the
  skills or the shared docs. Generic phrasing ("the project's architecture")
  is the rule.
- **Documentation currency ships with the unit**: the README describing a
  changed surface is updated and its superseded prose deleted in the same PR.
  Step owner: [`skills/unit-lane/references/DOCS.md`](skills/unit-lane/references/DOCS.md);
  `audit-docs` check 15 audits it.
- **One PR per unit of work, always against `main`.** Never work on `main`
  directly; never stack PRs. **Owner-applied inline batches are the one
  exception**: the owner may direct a correction batch to land straight on
  `main` without a branch or PR (a docs/a11y/wording repair he orders
  mid-session, applied where he asked for it). Such a batch keeps the
  conventional-commit format, is recorded in the unit doc or session log that
  owns it, and is not a general licence — an agent never pushes to `main` on its
  own initiative, and every unit of work that is not one of those batches still
  arrives through a PR.
- **Forge issue dependencies are declared twice and must agree.** An issue that
  depends on others carries a `## Dependencies` section (prose, for triage) AND
  the native GitHub `blocked-by` relationship (machine; GraphQL mutation
  `addBlockedBy`) — the relationship is authoritative: update it, not just the
  prose, when a blocker is re-scoped, superseded or resolved early. A PR that
  resolves an issue never merges while any of that issue's `blocked-by`
  relationships is still open — merging out of order ships a unit whose
  prerequisites are absent; `review-change`/`audit-pr` treat an open blocker of
  the closed issue as a delivery blocker. Soft order relations (`Related` — no
  blocker, but a better order: resource optimization, schema/grammar definition,
  or any recorded reason) live in the `## Dependencies` prose section only, are
  completed at issue creation and revisited at triage — owner:
  [docs/workflow/ISSUE_WORKFLOW.md §Relationships](docs/workflow/ISSUE_WORKFLOW.md).
- **Published history is owner-written.** When `main` moves and the PR conflicts, the
  branch is brought up to date by integrating `main` and resolving the conflicted
  files on the branch: the agent resolves the files and hands the branch back,
  and the owner runs the integration. Pushed commits are a shared surface — a
  reviewer's checkout, another session, a CI artifact — so the owner rewrites
  them when genuinely needed, and the PR then notes why the hashes changed. Only the owner may rewrite published history: an agent must
  never run `git push --force` (or any command with the identical result — a
  rebase/amend of already-pushed commits followed by a push, a ref delete plus
  re-push, or any force spelling) unless the owner explicitly authorizes it in
  the same turn and no non-rewriting alternative exists. Soft rule by design:
  the mechanical enforcement of this line was tried and removed (issue #346) —
  the discipline lives here, in review and in the owner's merge.
- **Commit format:** conventional commits, e.g. `feat(skills): add execute-phase`,
  `docs(workflow): clarify replicate steps`, `chore(template): add brand stub`.
- **Tests first for a non-empty test impact set.** A change derives the tests
  it can affect instead of guessing them — `bun scripts/test-impact.mjs --base
  <rev>` answers the set from the touched symbols, the paths its tests name, the
  suite beside each change and any LSP-resolved references — and runs that set
  plus the project gate. A prose-only change answers `empty`: the verdict is
  recorded in the phase's evidence, the ceremony is skipped, and no test is
  invented. The mechanism and the block belong to
  [`skills/execute-phase/references/TEST_IMPACT.md`](skills/execute-phase/references/TEST_IMPACT.md).
- **A new script ships its sibling suite — red commit before green — and a
  test is never edited to pass.** Every `scripts/x.mjs` arrives with `scripts/x.test.mjs`
  as two commits: the suite lands alone, observed failing on the missing
  module or the failing assertion (the red commit), then the implementation
  lands observed green — the unit doc's `## Log` records both runs as `E`
  lines naming both SHAs, and `scripts/red-first.mjs` enforces the ordering
  in the root suite (pairs introduced after the gate's own commit; earlier
  pairs are grandfathered). `scripts/structural-sibling-pins.test.mjs` reads
  the tree, so an unpaired file fails the gate. A failing test is repaired by changing the code it judges —
  never by relaxing, deleting or skipping the assertion, and never by narrowing
  its input until it passes. A case that genuinely cannot hold is `n/a` with its
  reason recorded, not quietly removed.
- **`human-revision-needed` blocks development.** An issue or PR carrying that
  label is on hold: nothing is planned, implemented, committed or merged for it
  until a human removes the label. It means "a plan is waiting for human review",
  so an agent may apply it — and must then stop — but may never remove it, not
  even when its own work looks finished. Vocabulary and semantics are owned by
  `skills/triage-issue/references/LABELS.md`; this guide is the only place that
  states the hold, and every skill honors it before acting.
- **No backward-compatibility support (owner decision).** This repository ships
  one version at a time and never keeps an old surface alive for an older
  consumer: every dependency is pinned, the skills and the four packages carry
  one train version (D-40-14), and the version-parity gate plus the pin-watch job
  keep the pair aligned. A superseded helper, script, doc, flag or prose block is
  deleted in the change that supersedes it; a copy of a published artifact is
  never a compatibility shim. A project that needs an older line keeps an older
  **pin**, not a fork. If a real external consumer ever needs a surface kept, that
  is a new unit with a recorded decision — never a default. The review pack reads
  this rule (its compatibility policy) when classifying an obsolete surface.
- **Domain separation — product vs dogfooding (owner decision 2026-11-07).**
  The product ships only what it can build deterministically with its own code
  and prose; the classification test lives on issue 435. This project's
  decisions (forge publication, papers sweeps, label semantics, scheduling)
  never enter a product surface unrequested, either direction. Exceptions:
  owner-requested dual landing (e.g. #405's journal) and this safeguard itself
  (project-domain, here only). product-audit runs here add a **project-only
  domain-drift sweep**: product surfaces checked for dogfooding claims, project
  surfaces for product rules. Never ships in `skills/product-audit/`.
- **Every repetition names its owner.** Before a rule, contract or vocabulary
  enters this guide — or any doc — find the surface that owns it and link it.
  A second copy is allowed only where a consumer cannot reach the owner, and it
  must say whose it is. This is the rule that keeps the file from growing back
  after the split: `scripts/residue-dimensions.test.mjs` refuses a rule name that
  appears outside its owner without a pointer.

## Verification

This repo has no application build. "Green" means:

- The `skills` CLI discovers every skill: `npx skills add . --list` lists them all.
- Markdown is well-formed; cross-references between docs resolve.
- Context budgets pass: `bun scripts/check-skill-context.mjs` (every skill's
  `SKILL.md`) and its `--documents` mode (this guide plus the `docs/workflow/`
  references it indexes) are within the ceilings the same manifest declares.
- No stack/real-project references leaked into the skills or shared docs.
- Root suites pass: `node scripts/run-root-suite.mjs` (the same
  `scripts/*.test.mjs` with git signing neutralized for the throwaway fixture
  repositories, so an operator's `commit.gpgsign=true` cannot fail a suite that
  commits nothing real); per file, `bun test scripts/<file>.test.mjs` runs the
  identical suite bun-first (`node --test scripts/<file>.test.mjs` is the
  fallback) — including `scripts/golden-fixture.test.mjs`, which asserts the
  golden fixture's deterministic half.
- The root gate is a bounded worker pool, one worker per CPU by default
  (`--jobs <n>` caps it, `--jobs 1` runs one suite at a time): each worker runs
  the identical per-file invocation, so a suite is isolated in its own process
  exactly as the per-file rule runs it, `--bail` stops the dispatch at the
  first red and kills the suites still in flight, and the first failing status
  is forwarded verbatim (unit 100). CI needs no workflow edit — the manual
  `root-suite.yml` delegates to this script, so the node leg parallelizes the
  same way.
- If `packages/agentic-workflow-schema/` was touched: `bun run test` passes
  there, and any change to the envelope schema in
  `skills/orchestration-envelope/SKILL.md` is mirrored in the package (types +
  `envelope.schema.json` + version bump) — same PR, always.
- If `packages/pi-agentic-workflow/` was touched: `bun run test` passes there.
  Nothing to re-bundle by hand: `skills/` at the repo root is the only skills
  tree in git, and the package stages its filtered copy at test and pack time
  (that copy is gitignored and deleted again by `postpack`).
  `test/alias-coverage.test.mjs` and `test/skill-parity.test.mjs` read both
  trees; the staged one is always rebuilt first, so it is never stale.

### Where the gate runs

The gate is local-first (owner decision 2026-11-04): `bun scripts/local-gate.mjs`
runs every check the remote gate runs, in the same order. Independent steps run
concurrently in a bounded worker pool (`--jobs`, one worker per CPU capped at 4
by default) under a dependency graph that holds apart the steps that would race
on the same bytes (`schema-build`'s dist and every step that reads or rebuilds
it); with bail — the default — the first red stops the dispatch, in-flight
steps finish, and dependents of the red never run (`--no-bail` keeps going and
skips a failed step's transitive dependents instead). `--install-hook` writes a
`pre-push` hook
that runs the offline subset, so a push never waits on the registry. That hook
also spends the push range before running it: it passes the remote tip to the
gate as `--push-base`, and a `test-impact` verdict of `empty` (no executable
path changed — prose and assets only) skips the test-bearing steps; a `targeted`
verdict, a refusal or an absent script runs the full gate, never a silent skip.
A checkout carrying the old hook reinstalls it with `bun scripts/local-gate.mjs --install-hook`.
The shared-document classes (issue #498) arm the same way and are documented here
because the arming is the same per-checkout limitation: `.gitattributes` names
`docs/ROADMAP.md merge=agentic-shared-roadmap`,
`docs/workflow/SKILL_CONTEXT_BUDGETS.json merge=agentic-shared-budgets`,
`docs/workflow/REPOSITORY_STATE.md merge=agentic-shared-repo-state` and
`docs/LOGS.md merge=agentic-shared-logs`, and
`bun scripts/shared-doc-merge.mjs --install` writes the driver config a clone
never inherits; arming is optional — an unarmed clone degrades to git's textual
merge, and the armed drivers add the semantic layer (row union by key; a
same-row status flip or a differing ceiling leaf surfaces as a real conflict;
`REPOSITORY_STATE.md` never unions; `LOGS.md` unions by entry stamp — the same
stamp with different bodies, or a one-sided entry deletion, is a real
conflict). The write-path half of the contract lives
in the crate: `writer-driver-contract@1` in
[`packages/agentic-workflow/README.md`](packages/agentic-workflow/README.md) is
the contract's one home.
**The generated projection carries no per-regeneration line**, so two concurrent
regenerations merge as plain text and no checkout has to be armed for that. For
the residual case — two branches inserting a row at the same position in one
sorted table (the projection's tables, and `docs/ROADMAP.md`'s since fix #507,
whose generated half appends a row per unit folder while every hand-owned cell
passes through untouched) — `.gitattributes` names `docs/generated/**`
(`merge=docs-generated`, armed by `bun scripts/docs-generated-merge.mjs --install`)
while the `docs/ROADMAP.md` attribute stays with the shared-document class
registry above — one claim per path, the registry stated once — and
`bun scripts/docs-generated-merge.mjs --install` writes the driver config a
clone never inherits; arming it is optional. Either way the gate's
`docs-generated-projection` step runs `docs-generate --check` on every push —
offline and not test-gated, because a prose-only push is exactly the push that
stales the projection.
The remote
gate is manual only — `gh workflow run root-suite.yml --ref <branch>` — for a
branch you cannot run locally.

**Runtime convention — bun runs scripts and tests; the root gate runs under either
runtime.** Two scopes, one override. `AGENTIC_WORKFLOW_RUNTIME=bun|node` wins everywhere it is
set. Outside that override: (a) **manual invocation** of repo scripts is bun-first
(`bun scripts/x.mjs`, `bun run <pkg-script>`), with the same command under node as
the guaranteed fallback, enforced by the gate's node-compat steps — skill prose and usage
strings show the bun form, and skills running in user projects resolve
bun-else-node at invocation (`npm_config_user_agent` starting with `bun/` pins
bun); (b) **package-spawned children of `@gtrabanco/pi-agentic-workflow`** run
under the runtime that launched pi (bun when pi was installed via bun, node when
via npm), resolved by the package's runtime module
(`detectRuntime`/`runtimeBin`/`runtimeEnv`) — the user's install choice decides,
bun is never forced. The shebangs stay `#!/usr/bin/env node` — the portable
fallback, since a shebang cannot express "bun else node". **The suite's bun-first
rule extends to the gate.** Per file, tests are bun-first —
`bun test scripts/<file>.test.mjs`, with `node --test scripts/<file>.test.mjs` as the
guaranteed fallback — and the whole gate runs under either runtime:
`scripts/run-root-suite.mjs` adapts the invocation per runtime (`bun test`
subcommand vs `node --test` flag), wraps every suite process in two external bounds
— a 120s suite wall-clock killer and a sampled 1.5 GB memory cap, both
signal-based because a microtask-starved loop never fires a runner's own timer
(issue #493) — and the per-test budget defaults to 10s per test; a suite that
measured above it is named, with its reason and cost, in
`scripts/test-timeout-allowlist.json`. CI still runs `node scripts/run-root-suite.mjs`; the node-only
carve-out issue #329 pinned is gone (`bun scripts/run-root-suite.mjs` died with
`Cannot use test outside of the test runner`), and `scripts/invocation-drift.mjs`
pins this paragraph's facts.

**Tool choice is re-decided every turn.**
Manual invocation runs `bun` before `node` and search runs `rg` before `grep`;
both stay legitimate as the documented fallback when the preferred tool is
absent — check availability once per session with
`node scripts/setup-env.mjs --check` (`docs/workflow/SETUP.md`), never assume it.
The `rg`-first *search feature* stays #269's; this rule owns the tool choice only.

### Normalizer inventory (this repository)

The rule that orders these steps — and the fact that a post-freeze byte change voids
the receipts that bound those bytes — is owned by
`skills/execute-phase/references/PRE_EXECUTION_GATE.md` §"Normalizer order"; this list
only says which of **our** steps rewrite bytes and where they sit relative to a
snapshot or acceptance freeze. `scripts/pre-execution-quality.test.mjs` parses this
block and refuses the schedule if a mutating step is ever re-marked as a tail step.

```text
normalizer-inventory@1
step | kind | side
skill-lint | the authoring lint — reports, never repairs (the train stamps versions; there is no bump writer) | n/a
bun run bundle:skills | generator (stages the pack-time skill bundle at `packages/pi-agentic-workflow/skills/`; gitignored and removed by `postpack`, so it is build output, never a committed mirror) | before
bun run build (packages/agentic-workflow-schema) | generator (`tsc`, emits `dist/`) | before
generate-pre-execution-schemas.mjs | generator (writes the two `pre-execution-*.schema.json` projections) | before
generate-verification-schemas.mjs | generator (writes the verification schema projections) | before
generate-pre-execution-schemas.mjs --check | check-only (drift report, `bun run check:pre-execution-schemas`) | after
generate-verification-schemas.mjs --check | check-only (drift report, `bun run check:verification-schemas`) | after
pre-execution-snapshot.mjs verify | check-only (re-derives a bound digest, writes nothing) | after
bun scripts/check-skill-context.mjs (--routes) | check-only (budget report, writes nothing) | after
probe-sha256-paths.mjs (packages/agentic-workflow-schema) | check-only (SHA-256 path and cost probe, `bun run probe:sha256-paths`, prints digests/timings, writes nothing) | after
formatter | none declared — this repository has no Prettier, Biome or EditorConfig configuration, so the formatter category is empty here | n/a
```

### Normative surfaces (the drift gate's scope)

A *normative surface* is a place that orders what an agent may do next: a flag it
may pass, a gate trace it may print, a verdict it may emit, a field it may write,
a route it may hand off to. Feature 28's AC15 binds each of those to the machine
surface that accepts it — the schema package's published vocabularies
(`packages/agentic-workflow-schema/src/`), the `argument-hint:` frontmatter of each
skill, and the skill directory itself. The gate reads **versioned grammar only**:
a `block:` id, a `fenced:` fixed-output contract, a `table:` section, a
`schema-export:` published const read from committed source, or frontmatter.
It never parses a sentence, so a surface with no fixed grammar in the `grammar` cell
is the defect this table exists to prevent, and `scripts/normative-drift.test.mjs`
fails closed on it. `machine` names the vocabulary the surface's tokens resolve
against (`+` joins several); `must-name` is `yes` only where the machine's every
value must be ordered by some surface, which is the direction that catches a value
published and never declared anywhere else. The `#` lines are directives: host
commands a hand-off may print that are not skills.

```text
normative-surfaces@1
# hand-off-host-commands: clear
surface | file | grammar | machine | must-name
skill-declared-arguments | skills/*/SKILL.md | frontmatter:argument-hint | n/a | no
closing-hand-offs | skills/*/SKILL.md | fenced:→ Next: | skill | no
gate-rejection-vocabulary | skills/pre-execution-review/references/POLICY.md | block:gate-rejection-vocabulary@1 | gate-rejection-type | yes
preflight-gate-traces | skills/execute-phase/references/PREFLIGHT.md | fenced:GATE REJECTION — | gate-rejection-type | no
pre-execution-gate-trace | skills/execute-phase/references/PRE_EXECUTION_GATE.md | fenced:GATE REJECTION — | gate-rejection-type | no
sensor-labels | skills/workflow-status/references/PRE_EXECUTION.md | table:One label per stage | n/a | no
product-audit-trigger | skills/product-audit/SKILL.md | block:audit-trigger@1 | n/a | no
product-audit-finding-route | skills/product-audit/SKILL.md | block:finding-route@1 | n/a | no
sweep-declaration-grammar | skills/execute-phase/references/FOLDING.md | block:sweep-declaration@1 | n/a | no
snapshot-commands | skills/pre-execution-review/references/SNAPSHOT.md | fenced:--stage | pre-execution-stage+pre-execution-unit-kind | no
ledger-ownership-map | skills/pre-execution-review/references/LEDGERS.md | block:ledger-ownership@1 | n/a | no
ledger-review-mark-shape | skills/pre-execution-review/references/LEDGERS.md | block:review-mark@1 | n/a | no
ledger-finding-mark-shape | skills/pre-execution-review/references/LEDGERS.md | block:finding-mark@1 | n/a | no
ledger-gate-ran-mark | skills/pre-execution-review/references/LEDGERS.md | block:gate-ran@1 | n/a | no
tier-cost-ledger | docs/workflow/TIER_COST.md | block:tier-cost@1 | n/a | no
sensor-envelope-fields | skills/workflow-status/references/SENSOR_CORE.md | block:sensor-fields@1 | envelope-field | no
batch-plan-fields | skills/batch-scheduler/references/PLAN.md | table:batch-fields@1 | n/a | no
batch-reason-kind-vocabulary | packages/agentic-workflow-schema/src/batch-plan.ts | schema-export:BATCH_REASON_KINDS | batch-reason-kind | no
batch-finding-code-vocabulary | packages/agentic-workflow-schema/src/batch-plan.ts | schema-export:BATCH_FINDING_CODES | batch-finding-code | no
batch-size-hint-vocabulary | packages/agentic-workflow-schema/src/batch-plan.ts | schema-export:BATCH_SIZE_HINTS | batch-size-hint | no
doc-provenance-format-vocabulary | packages/agentic-workflow-schema/src/doc-provenance.ts | schema-export:DOC_PROVENANCE_FORMATS | doc-provenance-format | no
doc-provenance-grammar-family-vocabulary | packages/agentic-workflow-schema/src/doc-provenance.ts | schema-export:DOC_GRAMMAR_FAMILIES | doc-grammar-family | no
doc-provenance-stamp | packages/agentic-workflow-schema/README.md | block:doc-provenance@1 | doc-provenance-format+doc-grammar-family | no
continuation-refusal-vocabulary | packages/agentic-workflow-schema/src/continuation.ts | schema-export:CONTINUATION_REFUSALS | continuation-refusal-type | yes
gate-receipt-verdicts | packages/agentic-workflow-schema/src/gate-receipt.ts | schema-export:GATE_RECEIPT_VERDICTS | gate-receipt-verdict | yes
gate-receipt-check-statuses | packages/agentic-workflow-schema/src/gate-receipt.ts | schema-export:GATE_CHECK_STATUSES | gate-check-status | yes
gate-receipt-freshness | packages/agentic-workflow-schema/src/gate-receipt.ts | schema-export:GATE_RECEIPT_FRESHNESS_CODES | gate-receipt-freshness | no
gate-receipt-grammar | packages/agentic-workflow-schema/README.md | block:gate-receipt@1 | n/a | no
ask-dont-infer-rule | skills/unit-lane/references/DESIGN.md | block:ask-dont-infer@1 | n/a | no
activity-fusion | skills/unit-lane/references/PLAN.md | block:activity-fusion@1 | n/a | no
relay-status-grammar | skills/unit-lane/references/RELAY.md | block:relay-status@1 | n/a | no
journal-fragment-grammar | packages/agentic-workflow/README.md | block:journal-fragment-grammar@1 | n/a | no
journal-write-grammar | packages/agentic-workflow/README.md | block:journal-write-grammar@1 | n/a | no
journal-entry-contract | packages/agentic-workflow-schema/src/journal.ts | schema-export:JOURNAL_ENTRY_KINDS | journal-entry | no
journal-driver-contract | packages/agentic-workflow/README.md | block:journal-driver-contract@1 | n/a | no
turn-contract-fields | skills/orchestration-envelope/references/TURN_CONTRACT.md | block:hand-off-fields@1 | envelope-field:next | yes
turn-contract-transitions | skills/orchestration-envelope/references/TURN_CONTRACT.md | block:hand-off-transitions@1 | workflow-intent | no
turn-contract-receipt | skills/orchestration-envelope/references/TURN_CONTRACT.md | block:turn-contract-receipt@1 | n/a | no
open-questions-block | skills/orchestration-envelope/references/TURN_CONTRACT.md | block:open-questions@1 | continuation-refusal-type | no
path-protection-contract | skills/orchestration-envelope/references/TURN_CONTRACT.md | block:path-protection@1 | path-protection-reason | no
spec-requirement-ids | docs/features/_TEMPLATE/SPEC.md + docs/fix/_TEMPLATE/SPEC.md + template/docs/features/_TEMPLATE/SPEC.md + template/docs/fix/_TEMPLATE/SPEC.md | block:spec-requirement@1 | n/a | no
task-spec-links | docs/features/_TEMPLATE/SPEC.md + docs/fix/_TEMPLATE/SPEC.md + template/docs/features/_TEMPLATE/SPEC.md + template/docs/fix/_TEMPLATE/SPEC.md | block:task-spec-link@1 | n/a | no
log-kind-vocabulary | docs/features/_TEMPLATE/SPEC.md + docs/fix/_TEMPLATE/SPEC.md + template/docs/features/_TEMPLATE/SPEC.md + template/docs/fix/_TEMPLATE/SPEC.md | block:log-kind@1 | n/a | no
findings-carrier | docs/features/_TEMPLATE/SPEC.md + docs/fix/_TEMPLATE/SPEC.md + template/docs/features/_TEMPLATE/SPEC.md + template/docs/fix/_TEMPLATE/SPEC.md | block:findings-table@1 | n/a | no
findings-severity-ladder | skills/review-implementation/references/CLASSIFY.md | block:finding-severity-ladder@1 | finding-severity-ladder | no
findings-impact | skills/review-implementation/references/CLASSIFY.md | block:finding-impact@1 | finding-impact | no
pass-name-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:PASS_NAMES | pass-name | no
path-protection-reasons | packages/agentic-workflow/src/path-policy.mjs | schema-export:PATH_GUARD_REASONS | path-protection-reason | no
risk-tier-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:RISK_TIER_KINDS | risk-tier | yes
risk-tier-signals | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:RISK_TIER_SIGNAL_KINDS | risk-tier-signal | yes
risk-tier-reasons | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:RISK_TIER_REASONS | risk-tier-reason | yes
size-tier-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:SIZE_TIER_KINDS | size-tier | yes
risk-tier-verdict | skills/execute-phase/references/risk-tiers.md | block:risk-tier-verdict@1 | n/a | no
passive-record | skills/execute-phase/references/risk-tiers.md | block:passive-record@1 | n/a | no
adversarial-verdict-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:ADVERSARIAL_VERDICTS | adversarial-verdict | no
adversarial-reflector-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:ADVERSARIAL_REFLECTOR_VERDICTS | adversarial-reflector-verdict | no
adversarial-stability-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:ADVERSARIAL_STABILITY_VERDICTS | adversarial-stability | no
adversarial-verdict-grammar | skills/review-change/references/ADVERSARIAL_SETUP.md | block:adversarial-verdict@1 | adversarial-verdict+adversarial-reflector-verdict+adversarial-stability | no
projection-seam-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:PROJECTION_SEAMS | projection-seam | yes
projection-op-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:PROJECTION_OPS | projection-op | yes
projection-selector-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:PROJECTION_SELECTOR_KINDS | projection-selector-kind | yes
projection-hash-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:PROJECTION_HASH_ALGORITHMS | projection-hash-algorithm | yes
guard-verdict-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:GUARD_VERDICTS | guard-verdict | yes
guard-rejection-reason-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:GUARD_REJECTION_REASONS | guard-rejection-reason | yes
projection-manifest-grammar | packages/agentic-workflow-schema/README.md | block:projection-manifest@1 | n/a | no
guard-verdict-grammar | packages/agentic-workflow-schema/README.md | block:guard-verdict@1 | n/a | no
test-impact-verdict | skills/execute-phase/references/TEST_IMPACT.md | fenced:TEST IMPACT — | n/a | no
writer-driver-contract | packages/agentic-workflow/README.md | block:writer-driver-contract@1 | n/a | no
writer-refusal-vocabulary | packages/agentic-workflow/src/writer/driver.mjs | schema-export:WRITER_REFUSAL_REASONS | writer-refusal-reason | no
shared-merge-class-vocabulary | scripts/shared-doc-merge.mjs | schema-export:SHARED_MERGE_CLASSES | shared-merge-class | no
shared-merge-refusal-vocabulary | scripts/shared-doc-merge.mjs | schema-export:SHARED_MERGE_REFUSAL_REASONS | shared-merge-refusal-reason | no
```

### Rendered facts (prose that restates a machine value)

Where prose repeats a version, a count, or a contract id, the machine is
authoritative and the prose is the defect (AC15). Each restatement is declared
once here and the test **recomputes** the value: `claim` is a fixed form
(`literal:<exact text>`, `package-versions`), `machine` names the publisher, `+`
joins surfaces carrying the same fact; `literal:` compares the number or id inside
the quoted text, the table kinds compare every row the same way. A restatement
found in review but not pinned here is a known-issue with its re-trigger
condition, never a silent gap.

```text
rendered-facts@1
surface | claim | machine | rule
docs/workflow/SKILLS.md | pattern:\*\*(\d+) user-facing skills\*\* | count:user-facing | equals
CHANGELOG.md | package-versions | package:version | equals-each

```

The two schema generators show the split: one script rewrites a projection or
reports on it, and only the reporting mode may run after a freeze. No script or
skill may keep a second copy of this list.

## Docs site

The generated documentation projection (`docs/generated/**` — the reverse edge
of "docs drive the work", issue #396) is plain markdown, rendered only by the
repository's own emitter (`bun scripts/docs-generate.mjs`), never hand-written.
The same emitter syncs the two roadmap tables (fix #507): a feature folder
without a row gains one, every hand-owned cell passes through untouched, and a
unit doc's `roadmap_summary:` overrides its row's summary cell — edit the unit
doc, never the table.
The declaration the emitter reads; omitting `content-dir`, `build` and `map`
keeps the emitter's defaults (`docs/generated`, no build step, no map script):

```
- format: md
```

## Config policy for new features

The unified config (issue #427) is the only place a user-tunable setting lives.
Before a new key enters it, the four questions are asked in order — owner:
[`docs/workflow/CONFIG.md`](docs/workflow/CONFIG.md).

1. **Is it really configurable?** A flag, a derived default or a value inferred
   from context is not config. Only an intentionally user-tunable setting is.
2. **Which section?** Cross-tool behaviour goes in a base feature section
   (`agentic-workflow.json`); behaviour that only makes sense inside this
   package goes in its extension section (`pi-agentic-workflow.json`). The two
   never overlap.
3. **Schema first.** Define the type, the JSON Schema fragment and the shipped
   default together in the section owner (`packages/agentic-workflow-schema/src/config.ts`
   for a base section; the package's descriptor for an extension). New keys are
   optional; no coercion; unknown keys are refused, never merged. Regenerate
   `config.schema.json` with the generator, never by hand.
4. **Docs, init, changeset, roadmap.** Update the human doc, offer the value in
   `init-workspace` when it has a meaningful default, add a `.changeset/` entry
   (`feat` for a new key), and record the section in the roadmap when it ships.

A key that no runtime reads is not shipped: publish the consumer or keep the key
out. A section's defaults are read from the section owner (the schema package)
by the runtime, so the CLI and the extension cannot disagree about "absent".

## Conventions

| Type | Convention |
|---|---|
| Skill directories | kebab-case (`execute-phase`) |
| Markdown docs | kebab-case or SCREAMING_CASE per existing siblings |
| Skill `name:` | matches the directory name exactly |
| Machine/config surfaces (`.claude-plugin/plugin.json` `skills` array) | alphabetical |
| Narrative surfaces (README "The skills" `###` sections, `docs/workflow/SKILLS.md`) | flow order (the stage a skill runs at: Setup, Design, Plan, Execute, Review & audit, Decide, Document, Session, Repo maintenance, Autopilot) — never alphabetized |

## Worktree creation

This repo uses git worktrees under `.worktrees/<flat-name>` at the repository
root (gitignored). The path must stay **inside the repository tree** — Serena
and other MCPs detect worktrees as separate project paths and break when
worktrees live outside the repo tree — but **never inside `.git/worktrees/`**.

⚠️ **CRITICAL: `.git/worktrees/` is git's private worktree-administration
namespace, not a place for working trees.** `git worktree prune` deletes any
container directory under it **recursively — with the working tree and its
uncommitted work inside it** — exit 0, no warning. A path like
`.git/worktrees/fix/493-x` also collides with git's basename-named admin dirs
(`feat/493-x` and `fix/493-x` become `493-x` and `493-x1`), leaving an
admin-to-tree mapping no tool can follow. The guard
(`scripts/worktree-guard.mjs`) flags any worktree under `.git/worktrees/` as
`ADMIN_NAMESPACE`. **Never create, move or restore a worktree into
`.git/worktrees/`.**

When asked to create a worktree for an issue or branch, always follow the
steps below **in order** — they are not optional and have no shortcuts.

### Step 1 — Determine the branch name

Read the target issue (or existing remote branch) to find the branch naming
convention. This repo uses:

| Unit kind | Branch format |
|---|---|
| Feature | `feat/<issue-number>-<topic-slug>` |
| Fix | `fix/<issue-number>-<topic-slug>` |

Examples: `feat/432-model-memory-tier-0`, `fix/429-log-session-extension`.

If a remote branch already exists on the correct name (`origin/feat/…`), use it
as the source and preserve its full history (do not create a new branch from
`main` unless the issue is brand new with no commits yet).

### Step 2 — Derive the flat worktree name

The worktree directory is the branch name with `/` replaced by `-` — one flat
leaf, no nested slash:

| Branch | Worktree path |
|---|---|
| `feat/432-model-memory` | `.worktrees/feat-432-model-memory` |
| `fix/429-log-session-extension` | `.worktrees/fix-429-log-session-extension` |

The flat leaf keeps git's admin dir (named after the basename) 1:1 with the
working tree — no basename collisions, ever.

### Step 3 — Remove the local branch if it exists

The local branch is recreated by the worktree creation. If it already exists,
git will refuse to create it again:

```bash
git branch -D <branch-name> 2>/dev/null
```

### Step 4 — Create the worktree (one step)

```bash
git worktree add -b <branch-name> .worktrees/<flat-name> <branch-name-or-sha>
```

Or, when the branch already exists (e.g. a remote branch checked out in
Step 1):

```bash
git worktree add .worktrees/<flat-name> <branch-name>
```

`.worktrees/` is gitignored, so the checkout never shows up in `git status`.
**Never** use `/tmp` or any path outside the repo, and **never** a path under
`.git/` — see the warning above.

For a **new issue with no remote branch yet**, `-b <branch-name>` creates the
branch from the current HEAD (run it from `main` when the unit must start
there).

### Step 5 — Copy Serena configuration

Every worktree must have a working `.serena/project.yml` (the one Serena
readability gate in `packages/pi-agentic-workflow/src/routing/serena-readiness.ts`
parses to announce `language_servers`). Copy from the repo root:

```bash
cp -n .serena/project.yml .worktrees/<flat-name>/.serena/project.yml
cp -n .serena/project.local.yml .worktrees/<flat-name>/.serena/project.local.yml
```

The `.project.yml` file is gitignored and gets regenerated by `init-workspace`,
but copying it ensures Serena starts with language servers from the first
second.

### Step 6 — Verify

```bash
git worktree list  # should show the new entry under .worktrees/
git log -1           # should show the correct branch head
```

**Common failure modes (always check these):**
- Worktree created at `/tmp/...` → Serena fails to detect it.
- Worktree created under `.git/worktrees/` → `git worktree prune` destroys it
  (and every sibling tree in the same container) silently; move it out with
  `git worktree move <path> .worktrees/<flat-name>` — never prune it.
- Branch deleted then re-created from `main` → loses all remote history.
- Missing `.serena/project.yml` copy → Serena reports "no language_servers".
- `fatal: '<path>' is a missing but already registered worktree` → the
  worktree's directory is gone; recover with `git worktree repair` or remove
  the stale entry with `git worktree remove <path>` / `git worktree prune`.
  **Prune only removes registrations whose directories are already gone** —
  never run it to "fix" a worktree that still exists on disk, and never point
  a recovery at a path under `.git/worktrees/`.

### Worktree removal

When a worktree is no longer needed, remove it **before** deleting the branch:

```bash
git worktree remove .worktrees/<flat-name>
git branch -D <branch-name>
```

## Skills available in this repo

When repeated searches or documentation lookups happen here,
prefer creating or refining a skill over re-deriving the knowledge. Store
reusable operational knowledge as a skill under `skills/`; the authoring contract
is [`docs/workflow/SKILL_AUTHORING.md`](docs/workflow/SKILL_AUTHORING.md).

**Repo maintenance skill (specific to this repo):**

- **`skill-lint`** (was `bump-skill` — renamed when the per-skill bump ledger
  retired, D-40-14) — after editing any SKILL.md, run this before committing.
  It lints the repo's authoring rules and runs the content checks
  (`bun scripts/skill-lint.mjs`), and reports; it repairs nothing and
  bumps nothing — the train version is stamped by `scripts/release.mjs apply`
  at cut time, and a skill change ships via a `.changeset/` intent file.
  `skill-lint` is `user-invocable: false` — invoke it via the Skill
  tool / by following its `SKILL.md` directly, not the slash-command menu.
  It also carries `metadata.internal: true`, the `skills` CLI's own gate
  that keeps `npx skills add` from discovering/offering repo-internal
  skills to target projects (see `docs/fix/74-bump-skill-discovery-exclusion/`).

## Distribution

The skills install with the [`skills`](https://github.com/vercel-labs/skills) CLI:
`npx skills add gtrabanco/agentic-workflow`. There is no build step — adding a
skill is adding a `skills/<name>/SKILL.md`; replication guidance is
[`docs/workflow/REPLICATE.md`](docs/workflow/REPLICATE.md).
