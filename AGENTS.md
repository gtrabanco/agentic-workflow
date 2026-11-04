# AGENTS.md

> **This is the repository's single agent guide** — exactly one copy of these
> rules. Older Claude Code releases only read `CLAUDE.md`; if yours is one of
> them, point it at this file rather than re-creating that one (the
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
packages/                three companion npm packages (bun-managed islands — docs/workflow/PACKAGES.md)
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
the export path are [`README.md`](README.md#dogfooding-the-authoring-model).

## Documentation map

Which doc owns what — read the right context before acting, and add a row when a
new doc takes ownership of a task:

| Task | Required docs |
|---|---|
| Any change to these skills, gates or templates | this guide, then the owner each line below names |
| Authoring or editing a skill | [`docs/workflow/SKILL_AUTHORING.md`](docs/workflow/SKILL_AUTHORING.md) |
| Anything under `packages/` | [`docs/workflow/PACKAGES.md`](docs/workflow/PACKAGES.md) |
| Picking up work, sequencing a unit | [`docs/ROADMAP.md`](docs/ROADMAP.md), [`docs/workflow/LANE_FLOW.md`](docs/workflow/LANE_FLOW.md) |
| Writing a unit doc | [`docs/features/_TEMPLATE/SPEC.md`](docs/features/_TEMPLATE/SPEC.md), [`docs/fix/_TEMPLATE/SPEC.md`](docs/fix/_TEMPLATE/SPEC.md) |
| An architecture change or a cross-cutting rule | [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md), [`docs/architecture/ARCHITECTURAL_INVARIANTS.md`](docs/architecture/ARCHITECTURAL_INVARIANTS.md) |
| A new capability or integration surface | [`docs/CAPABILITIES.md`](docs/CAPABILITIES.md) |
| Resuming a session, or what happened last | [`docs/LOGS.md`](docs/LOGS.md), [`docs/workflow/REPOSITORY_STATE.md`](docs/workflow/REPOSITORY_STATE.md) |
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
| [`docs/workflow/SKILLS.md`](docs/workflow/SKILLS.md) | looking up what a skill does, or where it runs in the flow |
| [`docs/workflow/REPLICATE.md`](docs/workflow/REPLICATE.md) | replicating the workflow into another project |
| [`docs/workflow/MIGRATION.md`](docs/workflow/MIGRATION.md) | landing a breaking surface, and needing the migration note beside it |
| [`docs/workflow/SETUP.md`](docs/workflow/SETUP.md) | provisioning this repo's own authoring toolchain |

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
  skills or the shared docs. Generic phrasing ("the project's architecture",
  "the project's verification gate") is the rule.
- **Documentation currency ships with the unit**: the README describing a
  changed surface is updated and its superseded prose deleted in the same PR.
  Step owner: [`skills/unit-lane/references/DOCS.md`](skills/unit-lane/references/DOCS.md);
  `audit-docs` check 15 audits it.
- **One PR per unit of work, always against `main`.** Never work on `main`
  directly; never stack PRs.
- **Published history is owner-written.** Work in short branches off `main`;
  `main` only advances through a PR. When `main` moves and the PR conflicts, the
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
  consumer: every dependency is pinned, the skills and the three packages carry
  one train version (D-40-14), and the version-parity gate plus the pin-watch job
  keep the pair aligned. A superseded helper, script, doc, flag or prose block is
  deleted in the change that supersedes it; a copy of a published artifact is
  never a compatibility shim. A project that needs an older line keeps an older
  **pin**, not a fork. If a real external consumer ever needs a surface kept, that
  is a new unit with a recorded decision — never a default. The review pack reads
  this rule (its compatibility policy) when classifying an obsolete surface.
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
  `SKILL.md` is within its enforced line/token budget, and the guide layer —
  this file plus its `docs/workflow/` references — is within the budgets
  `bun scripts/check-skill-context.mjs --documents` reads from the same manifest).
- No stack/real-project references leaked into the skills or shared docs.
- Root suites pass: `node scripts/run-root-suite.mjs` (the same
  `scripts/*.test.mjs` with git signing neutralized for the throwaway fixture
  repositories, so an operator's `commit.gpgsign=true` cannot fail a suite that
  commits nothing real); per file, `bun test scripts/<file>.test.mjs` runs the
  identical suite bun-first (`node --test scripts/<file>.test.mjs` is the
  fallback) — including `scripts/golden-fixture.test.mjs`, which asserts the
  golden fixture's deterministic half.
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

**Runtime convention — bun runs scripts and tests; the root gate runs under either
runtime.** Two
scopes, one override. `AGENTIC_WORKFLOW_RUNTIME=bun|node` wins everywhere it is
set. Outside that override: (a) **manual invocation** of repo scripts is bun-first
(`bun scripts/x.mjs`, `bun run <pkg-script>`), with the same command under node as
the guaranteed fallback, enforced by a node-compat CI job — skill prose and usage
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
subcommand vs `node --test` flag) and budgets a 60s per-test timeout on the bun leg
(bun→bun spawn overhead plus the full-history git walks; node keeps its no-default
timeout model). CI still runs `node scripts/run-root-suite.mjs`. Before the
adaptation `bun scripts/run-root-suite.mjs` failed by construction
(`Cannot use test outside of the test runner` — bun only enters a runner through its
`test` subcommand) and `bun test scripts/` was not equivalent (unit 329's Log `E19`:
bun's 5-second default timeout, and an echoed error frame carrying
`ERR_MODULE_NOT_FOUND`); issue #329's sweep had pinned the node-only carve-out and
both failure classes are now closed. `scripts/invocation-drift.mjs` still pins this
paragraph's facts, so they cannot be dropped silently.

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
sweep-declaration-grammar | skills/execute-phase/references/FOLDING.md | block:sweep-declaration@1 | n/a | no
snapshot-commands | skills/pre-execution-review/references/SNAPSHOT.md | fenced:--stage | pre-execution-stage+pre-execution-unit-kind | no
ledger-ownership-map | skills/pre-execution-review/references/LEDGERS.md | block:ledger-ownership@1 | n/a | no
ledger-review-mark-shape | skills/pre-execution-review/references/LEDGERS.md | block:review-mark@1 | n/a | no
ledger-finding-mark-shape | skills/pre-execution-review/references/LEDGERS.md | block:finding-mark@1 | n/a | no
ledger-gate-ran-mark | skills/pre-execution-review/references/LEDGERS.md | block:gate-ran@1 | n/a | no
tier-cost-ledger | docs/workflow/TIER_COST.md | block:tier-cost@1 | n/a | no
sensor-envelope-fields | skills/workflow-status/references/SENSOR_CORE.md | block:sensor-fields@1 | envelope-field | no
continuation-refusal-vocabulary | packages/agentic-workflow-schema/src/continuation.ts | schema-export:CONTINUATION_REFUSALS | continuation-refusal-type | yes
ask-dont-infer-rule | skills/unit-lane/references/DESIGN.md | block:ask-dont-infer@1 | n/a | no
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
path-protection-reasons | packages/agentic-workflow/src/path-policy.mjs | schema-export:PATH_GUARD_REASONS | path-protection-reason | no
risk-tier-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:RISK_TIER_KINDS | risk-tier | yes
risk-tier-signals | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:RISK_TIER_SIGNAL_KINDS | risk-tier-signal | yes
risk-tier-reasons | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:RISK_TIER_REASONS | risk-tier-reason | yes
size-tier-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:SIZE_TIER_KINDS | size-tier | yes
risk-tier-verdict | skills/execute-phase/references/risk-tiers.md | block:risk-tier-verdict@1 | n/a | no
passive-record | skills/execute-phase/references/risk-tiers.md | block:passive-record@1 | n/a | no
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

The two schema generators are the clean example of the split the rule turns on: the
same script rewrites a projection or reports on it, and only the reporting mode may
run after a freeze. `bundle:skills` stages a gitignored build artifact that the
package's own lifecycle stages and removes again. No script or skill may keep a
second copy of this list.

## Conventions

| Type | Convention |
|---|---|
| Skill directories | kebab-case (`execute-phase`) |
| Markdown docs | kebab-case or SCREAMING_CASE per existing siblings |
| Skill `name:` | matches the directory name exactly |
| Machine/config surfaces (`.claude-plugin/plugin.json` `skills` array) | alphabetical |
| Narrative surfaces (README "The skills" `###` sections, `docs/workflow/SKILLS.md`) | flow order (the stage a skill runs at: Setup, Design, Plan, Execute, Review & audit, Decide, Document, Session, Repo maintenance, Autopilot) — never alphabetized |

## Skills available in this repo

When repeated searches or repeated documentation lookups happen while working
here, prefer creating or refining a skill over re-deriving the knowledge. Store
reusable operational knowledge as a skill under `skills/`; the authoring contract
is [`docs/workflow/SKILL_AUTHORING.md`](docs/workflow/SKILL_AUTHORING.md).

**Repo maintenance skill (specific to this repo):**

- **`skill-lint`** (was `bump-skill` — renamed when the per-skill bump ledger
  retired, D-40-14) — after editing any SKILL.md, run this before committing.
  It lints the repo's authoring rules, and runs the content checks
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
