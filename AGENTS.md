# AGENTS.md

> **The repository's single agent guide** — one copy of these rules. There is no
> `CLAUDE.md` here: a host that reads only that name is pointed at this file by
> the `init-workspace` rule “one guide, one name”
> (`skills/init-workspace/SKILL.md`), which applies the same rule to target
> projects.

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
docs/audits/             product-audit's carrier — one dated file per audit
.agentic-workflow/       this repo's own workflow state: the journal fragment carrier (journal.md, journal/), the index and hooks
docs/LOGS.md             the session journal (`log-session` writes it)
docs/features/_TEMPLATE  feature SPEC template
docs/fix/                fix SPEC template + one folder per fix unit
.changeset/              per-PR release intent files
.claude-plugin/          the plugin/marketplace manifests the skills CLI and the Pi package read
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
| [`docs/workflow/SKILL_AUTHORING.md`](docs/workflow/SKILL_AUTHORING.md) | authoring or editing a skill: frontmatter contract, body sections, the closing `→ Next:` block, hand-off vs compose across a model/effort boundary, and the guide shape a target project's scaffold must follow |
| [`docs/workflow/WORKTREES.md`](docs/workflow/WORKTREES.md) | creating, naming, recovering or removing a worktree: the namespace law's procedure and its failure modes |
| [`packages/pi-agentic-workflow/README.md`](packages/pi-agentic-workflow/README.md) | installing or configuring the package, or asking what the plugin's commands and config keys are |
| [`docs/workflow/PACKAGES.md`](docs/workflow/PACKAGES.md) | touching `packages/`: the bun workspace, the single lockfile, pin rules, the version-parity gate, changesets, publish channels |
| [`docs/workflow/GOLDEN_FIXTURE.md`](docs/workflow/GOLDEN_FIXTURE.md) | smoke-testing a wording change to an executor-path skill |
| [`docs/workflow/GATE_INVENTORY.md`](docs/workflow/GATE_INVENTORY.md) | asking whether a gate survives a compaction, and where its carrier lives |
| [`docs/workflow/LOADING.md`](docs/workflow/LOADING.md) | asking which tier a document belongs to, what a session loads always, or where the volatile machine regions must sit inside a file |
| [`docs/workflow/SKILLS.md`](docs/workflow/SKILLS.md) | looking up what a skill does, or where it runs in the flow |
| [`docs/workflow/REPLICATE.md`](docs/workflow/REPLICATE.md) | replicating the workflow into another project |
| [`docs/workflow/MIGRATION.md`](docs/workflow/MIGRATION.md) | landing a breaking surface, and needing the migration note beside it |
| [`docs/workflow/SETUP.md`](docs/workflow/SETUP.md) | provisioning this repo's own authoring toolchain |
| [`docs/workflow/DOMAIN_SEPARATION.md`](docs/workflow/DOMAIN_SEPARATION.md) | running product-audit here (the domain-drift sweep's method), or when unsure which domain a decision belongs to |
| [`docs/workflow/FEEDBACK.md`](docs/workflow/FEEDBACK.md) | writing or changing a CLI command, script or engine: the three feedback flags, the stderr-only invariant, and what a command must report |
| [`docs/workflow/RETENTION.md`](docs/workflow/RETENTION.md) | trimming, settling or restoring a merged unit, or changing the trim matrix: the settled carrier, the eligibility predicate, the archive manifest, the trim declaration and the reader contract |

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

## Inviolable rules

The laws no session may violate — always loaded, never behind a pointer, and
pinned by their own line count (`blockLines` in the budgets manifest) so a law
enters by manifest edit with its reason. `owner` names the surface that owns the
law's mechanism, never a restatement of it; `state` says how the law is enforced,
and `bun scripts/inviolable-rules.mjs` refuses a row whose owner or state does not
resolve:

- `materialized: <gate-id|path>` — a gate of the [gate inventory](docs/workflow/GATE_INVENTORY.md), or the suite that pins it.
- `soft-by-design: <reason>` — prose because no offline check can decide it, with the reason recorded.
- `materializable: #<issue>` — the carrier is a filed unit, and the row names it.

A genuinely new law is its own unit; this section structures the laws that exist.

```text
inviolable-rules@1
rule | statement | owner | state
IR1-vocabulary-residency | a closed vocabulary has one owner and every consumer imports it | docs/architecture/ARCHITECTURAL_INVARIANTS.md#block:vocabulary-residency@1 | materialized: published-vocabulary-parity
IR2-force-push-ban | an agent never rewrites published history; the owner does, and the PR records why the hashes moved | AGENTS.md#Working rules | soft-by-design: the mechanical enforcement was tried and deliberately removed (issue #346), so the owner's merge is the check
IR3-test-immutability | a failing test is repaired by the code it judges, never by weakening, deleting or skipping the assertion | skills/unit-lane/references/TESTS.md#Obligation tags | soft-by-design: a weakened assertion is indistinguishable from a legitimate test edit without reading intent, so a reviewer decides it
IR4-red-first | a new script's suite lands in its own commit before its implementation | skills/unit-lane/references/TESTS.md#Red-first commits | materialized: red-first-ordering
IR5-human-revision-hold | nothing is planned, implemented or merged for an item carrying `human-revision-needed`, and an agent may apply that label but never remove it | skills/triage-issue/references/LABELS.md#Review-gate label vocabulary (human-owned) | soft-by-design: host-owned — the label lives on the forge, so no offline suite can read it
IR6-no-backward-compat | **No backward-compatibility support**: a superseded surface is deleted in the change that supersedes it, and a copy of a published artifact is never a compatibility shim | AGENTS.md#Working rules | soft-by-design: an owner decision the review pack reads as its compatibility policy, and no gate can separate a kept surface from a deleted one
IR7-domain-separation | a project decision never enters a product surface unrequested, and a product rule never enters a project surface | docs/workflow/DOMAIN_SEPARATION.md#The product-audit dimension (this repo only) | soft-by-design: carried by product-audit's project-only domain-drift sweep, which a person runs rather than a gate
IR8-worktree-namespace | a worktree never lives under git's `.git/worktrees/` namespace, where `git worktree prune` destroys it silently | docs/workflow/WORKTREES.md#Where they live | materialized: worktree-audit
IR9-english-only | every committed artifact is English, permanently, and no translated sibling is created | AGENTS.md#Working rules | materialized: docs-language
IR10-no-assumption | a fact the tree, the docs and a prior owner decision do not evidence is asked, never guessed | skills/unit-lane/references/DESIGN.md#block:ask-dont-infer@1 | materializable: #644
IR11-one-owner-per-rule | a rule, contract or vocabulary names the surface that owns it before it enters a doc, and a second copy cites that owner | AGENTS.md#Working rules | materializable: #646
IR12-stderr-only | a command's progress goes to stderr while stdout and the envelope stay the machine receipt | docs/workflow/FEEDBACK.md#The invariants (never trade one away) | materialized: packages/agentic-workflow/test/feedback.test.mjs
IR13-no-secrets | no secret-shaped value enters the tree, and a benign shape is answered by a narrow allowlist entry rather than by silence | template/AGENTS.md#Inviolable rules | materialized: secret-scan
IR14-tool-choice | the preferred tool is re-checked every turn and the documented fallback is never assumed absent | docs/workflow/SETUP.md#The toolchain, per tool | materialized: invocation-drift
```

## Working rules

- **Docs language is English-only (permanent).** Every committed artifact is in
  English, regardless of the language the work was requested in; reply to the user
  in the user's language. Owner decision 2026-10-27 (issue
  [#232](https://github.com/gtrabanco/agentic-workflow/issues/232)): bilingualism is
  a rendering concern of the project's web layer (#295), never a committed
  artifact — do **not** create a `.es.md` sibling, add a language-switcher link, or
  translate a package surface.
- **Vendored third-party code carries its provenance.** Code copied from a third
  party — into a package's `src/`, a script, or a skill reference — keeps a header
  naming the **source URL, the author, the version copied, and the license name**.
  A copy without those four is a provenance defect: an upstream relicensing or an
  attribution obligation cannot be audited later. Vendoring is weighed against
  adding the dependency on measured cost, and it never waives the header.
- **Stack/architecture agnostic.** Do not introduce references to any specific
  product, stack, framework, ORM, runtime, or architecture pattern into the
  skills or the shared docs. Generic phrasing ("the project's architecture")
  is the rule. The rule scopes to the **target project's** stack: a host-agent
  name (Claude Code, Cursor, Copilot, OpenCode, Pi) is sanctioned where a
  portability or adapter feature requires it — a skill's `## Portability`
  section, the safety-adapter offer, a host-specific hook — and never as a
  technology recommendation for the project the workflow runs in.
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
- **Integrating `main` into a branch.** The agent resolves the conflicted files on
  the branch and hands it back; the owner runs the integration and, when it is
  genuinely needed, the rewrite — with the PR noting why the hashes changed. An
  agent must never run `git push --force` (or a rebase/amend of pushed commits
  followed by a push, a ref delete plus re-push — any force spelling) unless the
  owner explicitly authorizes it in the same turn and no non-rewriting alternative
  exists (`IR2`).
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
  A test the unit adds also carries its **justification line** — the independent
  obligation it covers, never the implementation under test (owner: same file
  § The justification line); a test without one is a finding, not a silent pass.
- **A new script ships its sibling suite — red commit before green — and a
  test is never edited to pass.** Every `scripts/x.mjs` arrives with `scripts/x.test.mjs`
  as two commits: the suite lands alone, observed failing on the missing
  module or the failing assertion (the red commit), then the implementation
  lands observed green — the unit doc's `## Log` records both runs as `E`
  lines naming both SHAs, and `scripts/red-first.mjs` enforces the ordering
  (`IR4`). `scripts/structural-sibling-pins.test.mjs` reads the tree, so an
  unpaired file fails the gate. A failing test is repaired by changing the code it judges —
  never by relaxing, deleting or skipping the assertion, and never by narrowing
  its input until it passes (`IR3`). A case that genuinely cannot hold is `n/a` with
  its reason recorded. A suite also declares its **obligation tag** at its head —
  the surface it protects and the obligations it asserts there (owner:
  [`skills/unit-lane/references/TESTS.md`](skills/unit-lane/references/TESTS.md)
  § Obligation tags; gate: `bun scripts/test-obligation-tags.mjs`). A test is
  deleted only through the authority that same file states (§ Deletion
  authority): a scheduled task or a `fix-now (delete)` row, each citing its
  ground — never as a repair to a red suite (`IR3`).
- **`human-revision-needed` blocks development.** An issue or PR carrying that
  label is on hold: nothing is planned, implemented, committed or merged for it
  until a human removes the label. It means "a plan is waiting for human review",
  so an agent may apply it — and must then stop — but may never remove it (`IR5`).
  Vocabulary and semantics are owned by `skills/triage-issue/references/LABELS.md`.
- **No backward-compatibility support (owner decision).** This repository ships
  one version at a time and never keeps an old surface alive for an older
  consumer: every dependency is pinned, the skills and the four packages carry
  one train version (D-40-14), and the version-parity gate plus the pin-watch job
  keep the pair aligned. A project that needs an older line keeps an older
  **pin**, not a fork. If a real external consumer ever needs a surface kept, that
  is a new unit with a recorded decision — never a default (`IR6`).
- **Domain separation — product vs dogfooding (owner decision 2026-11-07).**
  The product ships only what it can build deterministically with its own code
  and prose; the classification test lives on issue 435. The exceptions are an
  owner-requested dual landing and this safeguard itself (project-domain, here
  only); the sweep that reads the rule is the product-audit dimension `IR7` names.
- **A cross-unit decision is promoted, not buried (issue #650).** A decision
  recorded in a unit's `decisions.md` (or a `## Log` `D` line) declares its scope:
  `unit-only` stays in the unit, `cross-unit` lands in exactly ONE permanent owner
  doc — this guide's `## Inviolable rules` row when it is a law, `ARCHITECTURE.md`
  when it is structure, `ARCHITECTURAL_INVARIANTS.md` when it is a checkable
  property — and the unit row cites that doc, never a copy. The procedure is
  `template/docs/architecture/ARCHITECTURE.md` § Promoting a decision (product
  surface) applied to this repository's own docs; `product-audit`'s `Decision
  promotion` dimension reports a cross-unit decision that names no owner doc
  (`bun scripts/decision-promotion.mjs .`).
- **Every repetition names its owner.** Before a rule, contract or vocabulary
  enters this guide — or any doc — find the surface that owns it and link it.
  A second copy is allowed only where a consumer cannot reach the owner, and it
  must say whose it is (`IR11`). The detector that exists today covers one rule:
  `scripts/residue-dimensions.test.mjs` refuses a restatement of the no-assumption
  rule outside its owner; the general sweep is #646's.

## Verification

This repo has no application build. "Green" means:

- The `skills` CLI discovers every skill: `npx skills add . --list` lists them all.
- Markdown is well-formed; cross-references between docs resolve.
- Context budgets pass: `bun scripts/check-skill-context.mjs` (every skill's
  `SKILL.md`) and its `--documents` mode (this guide plus the `docs/workflow/`
  references it indexes) are within the ceilings the same manifest declares.
- No stack/real-project references leaked into the skills or shared docs.
- Root suites pass: `node scripts/run-root-suite.mjs` (the same
  `scripts/*.test.mjs`, git signing and a stable fixture identity neutralized
  for throwaway fixtures so an operator's `commit.gpgsign=true` — or a runner
  with no ambient identity — cannot fail a suite that commits nothing
  real, and the schema package's gitignored `dist/` rebuilt first when it is
  stale — no contract suite reads another source set's build); per file,
  `bun test scripts/<file>.test.mjs` runs the identical suite bun-first
  (`node --test scripts/<file>.test.mjs` is the fallback), the
  `scripts/golden-fixture.test.mjs` deterministic half included.
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
also spends the push range before running it: it passes the pushed ref's remote tip —
the merge-base for a single new branch — as `--push-base`, and a `test-impact` verdict of `empty` (no executable
path changed — prose and assets only) skips the test-bearing steps; a `targeted`
verdict, a refusal or an absent script runs the full gate, never a silent skip. A push that sends no ref update — an up-to-date branch, a dry run — or only deletions publishes nothing, so the hook exits 0 before any range step instead of inventing a merge-base range; several publishable refs, or a ref git cannot prove a base for, leaves the base unproven and the range-bound steps stay dropped. A checkout carrying the old hook reinstalls it with `bun scripts/local-gate.mjs --install-hook` (which asks git where the hooks live, so it works from a worktree, where `.git` is a file); the installed hook passes `--jobs auto` (load-sized, overridable with `AGENTIC_WORKFLOW_GATE_JOBS`), so a push never claims the whole box while other sessions work.
The shared-document classes (issue #498, plus #630's telemetry class) arm the
same way: `.gitattributes` names each class's paths, `runner shared-merge
--install` writes the driver config a clone never inherits, and arming is optional —
an unarmed clone degrades to git's textual merge. The write-path contract is
[`writer-driver-contract@1`](packages/agentic-workflow/README.md); the generated
projection carries no per-regeneration line, so two regenerations merge as plain
text, and the residual case (two branches inserting a row in one sorted table)
is `docs/generated/**`'s driver, armed by `runner docs-generated-merge
--install`. Either way the gate's `docs-generated-projection` step runs
`docs-generate --check` on every push — offline and not test-gated, because a
prose-only push is exactly the push that stales the projection.
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
— a 120s suite wall-clock killer (a suite declares its own higher bound in
  `scripts/test-timeout-allowlist.json` when load alone pushes it past the
  shared one) and a sampled 1.5 GB memory cap, both
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

**Every CLI reports through the feedback channel.** A command that can take
noticeable time says so — start, what it is doing, and how long it took — through
the runner crate's `src/feedback/index.mjs`, which publishes `FEEDBACK_TIERS`
and takes the tier flags `--debug` and `--profile`. Every line goes to **stderr**: stdout and the envelope
stay the machine receipt. A second progress convention, a private timer or a
progress byte on stdout is the defect; the contract and its authoring rules are
owned by [`docs/workflow/FEEDBACK.md`](docs/workflow/FEEDBACK.md).

## Docs site

The generated documentation projection (`docs/generated/**` — the reverse edge of
"docs drive the work", issue #396) is plain markdown, rendered only by the
repository's own emitter (`bun scripts/docs-generate.mjs`), never hand-written.
The same emitter syncs the two roadmap tables (fix #507): a feature folder without
a row gains one, every hand-owned cell passes through untouched, and a unit doc's
`roadmap_summary:` overrides its row's summary cell — edit the unit doc, never the
table. The declaration the emitter reads (omitting the other keys keeps its
defaults: `docs/generated`, no build step, no map script):

```
- format: md
```

## Config policy for new features

The unified config (issue #427) is the only place a user-tunable setting lives,
and a new key answers four questions in order before it enters it — owner:
[`docs/workflow/CONFIG.md`](docs/workflow/CONFIG.md) §"Adding a config key to a
feature". A key that no runtime reads is not shipped: publish the consumer or keep
the key out, with the section's defaults read from the section owner so the CLI and
the extension cannot disagree about "absent".

## Conventions

| Type | Convention |
|---|---|
| Skill directories | kebab-case (`execute-phase`) |
| Markdown docs | kebab-case or SCREAMING_CASE per existing siblings |
| Skill `name:` | matches the directory name exactly |
| Machine/config surfaces (`.claude-plugin/plugin.json` `skills` array) | alphabetical |
| Narrative surfaces (README "The skills" `###` sections, `docs/workflow/SKILLS.md`) | flow order (the stage a skill runs at: Setup, Design, Plan, Execute, Review & audit, Decide, Document, Session, Repo maintenance, Autopilot) — never alphabetized |

## Worktree creation

Worktrees live under `.worktrees/<flat-name>` at the repository root — one flat
leaf, the branch name with `/` replaced by `-` — and **never** under
`.git/worktrees/`, which `git worktree prune` deletes recursively with the working
tree and its uncommitted work inside it (`IR8`; the guard is
`scripts/worktree-guard.mjs`, which reports an `ADMIN_NAMESPACE` finding).

The branch naming table, the six ordered steps, the Serena configuration copy, the
failure modes and the removal order are one hop away in
[`docs/workflow/WORKTREES.md`](docs/workflow/WORKTREES.md) — read it before
creating, moving or recovering a worktree, and follow its steps in order.

## Skills available in this repo

The authoring contract is
[`docs/workflow/SKILL_AUTHORING.md`](docs/workflow/SKILL_AUTHORING.md), which also
carries the repo-maintenance skill's rules (`skill-lint`: run it after editing any
`SKILL.md`, it reports and repairs nothing, and it is `user-invocable: false` with
`metadata.internal: true` so the `skills` CLI never offers it to a target project).
When repeated searches or documentation lookups happen here, prefer creating or
refining a skill over re-deriving the knowledge.

## Distribution

The skills install with the [`skills`](https://github.com/vercel-labs/skills) CLI:
`npx skills add gtrabanco/agentic-workflow`. There is no build step — adding a
skill is adding a `skills/<name>/SKILL.md`; replication guidance is
[`docs/workflow/REPLICATE.md`](docs/workflow/REPLICATE.md).

## Machine regions (volatile, last)

The three versioned blocks below are the parts of this guide a unit re-pins most
often. They sit **last** on purpose: a prompt cache keeps a prefix, so a unit that
adds one `normative-surfaces@1` row invalidates only the bytes after its own change
instead of everything below it (owner: `docs/workflow/LOADING.md`).

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
skill, and the skill directory itself. **Which** package owns a vocabulary is not
this table's question: `vocabulary-residency@1`
([`docs/architecture/ARCHITECTURAL_INVARIANTS.md`](docs/architecture/ARCHITECTURAL_INVARIANTS.md))
owns that rule, and reading this inventory as a residency policy is the misreading
that produced issue #643. The gate reads **versioned grammar only**:
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
vocabulary-residency | docs/architecture/ARCHITECTURAL_INVARIANTS.md | block:vocabulary-residency@1 | n/a | no
inviolable-rules | AGENTS.md | block:inviolable-rules@1 | n/a | no
closing-hand-offs | skills/*/SKILL.md | fenced:→ Next: | skill | no
gate-rejection-types | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:GATE_REJECTION_TYPES | gate-rejection-type | yes
gate-rejection-vocabulary | skills/pre-execution-review/references/POLICY.md | block:gate-rejection-vocabulary@1 | gate-rejection-type | yes
preflight-gate-traces | skills/execute-phase/references/PREFLIGHT.md | fenced:GATE REJECTION — | gate-rejection-type | no
pre-execution-gate-trace | skills/execute-phase/references/PRE_EXECUTION_GATE.md | fenced:GATE REJECTION — | gate-rejection-type | no
sensor-labels | skills/workflow-status/references/PRE_EXECUTION.md | table:One label per stage | n/a | no
product-audit-trigger | skills/product-audit/SKILL.md | block:audit-trigger@1 | n/a | no
product-audit-finding-route | skills/product-audit/SKILL.md | block:finding-route@1 | n/a | no
coverage-gap-grammar | skills/product-audit/references/AUDIT_DIMENSIONS.md | block:coverage-gap@1 | n/a | no
journal-corpus-grammar | skills/product-audit/references/AUDIT_DIMENSIONS.md | block:journal-corpus@1 | n/a | no
test-surplus-grammar | skills/product-audit/references/AUDIT_DIMENSIONS.md | block:test-surplus@1 | n/a | no
sweep-declaration-grammar | skills/execute-phase/references/FOLDING.md | block:sweep-declaration@1 | n/a | no
snapshot-commands | skills/pre-execution-review/references/SNAPSHOT.md | fenced:--stage | pre-execution-stage+pre-execution-unit-kind | no
ledger-ownership-map | skills/pre-execution-review/references/LEDGERS.md | block:ledger-ownership@1 | n/a | no
ledger-review-mark-shape | skills/pre-execution-review/references/LEDGERS.md | block:review-mark@1 | n/a | no
ledger-finding-mark-shape | skills/pre-execution-review/references/LEDGERS.md | block:finding-mark@1 | n/a | no
ledger-gate-ran-mark | skills/pre-execution-review/references/LEDGERS.md | block:gate-ran@1 | n/a | no
tier-cost-ledger | docs/workflow/TIER_COST.md | block:tier-cost@2 | n/a | no
tier-cost-comparison | docs/workflow/TIER_COST.md | block:tier-cost-compare@1 | n/a | no
sensor-envelope-fields | skills/workflow-status/references/SENSOR_CORE.md | block:sensor-fields@1 | envelope-field | no
batch-plan-fields | skills/batch-scheduler/references/PLAN.md | table:batch-fields@1 | n/a | no
batch-reason-kind-vocabulary | packages/agentic-workflow-schema/src/batch-plan.ts | schema-export:BATCH_REASON_KINDS | batch-reason-kind | no
batch-finding-code-vocabulary | packages/agentic-workflow-schema/src/batch-plan.ts | schema-export:BATCH_FINDING_CODES | batch-finding-code | no
batch-size-hint-vocabulary | packages/agentic-workflow-schema/src/batch-plan.ts | schema-export:BATCH_SIZE_HINTS | batch-size-hint | no
phase-batching-decision-vocabulary | packages/agentic-workflow-schema/src/phase-batching.ts | schema-export:PHASE_BATCHING_DECISIONS | phase-batching-decision | no
phase-batching-reason-vocabulary | packages/agentic-workflow-schema/src/phase-batching.ts | schema-export:PHASE_BATCHING_REASON_KINDS | phase-batching-reason | no
phase-batching-tool-harness-vocabulary | packages/agentic-workflow-schema/src/phase-batching.ts | schema-export:PHASE_BATCHING_TOOL_HARNESSES | phase-batching-tool-harness | no
phase-batching-cache-posture-vocabulary | packages/agentic-workflow-schema/src/phase-batching.ts | schema-export:PHASE_BATCHING_CACHE_POSTURES | phase-batching-cache-posture | no
guard-modes | packages/agentic-workflow-schema/src/config.ts | schema-export:GUARD_MODES | guard-mode | no
guard-names | packages/agentic-workflow-schema/src/config.ts | schema-export:GUARD_NAMES | guard-name | no
guard-reference-table | docs/workflow/CONFIG.md | table:guard-reference@1 | n/a | no
doc-degradation-vocabulary | packages/agentic-workflow-schema/src/doc-envelope.ts | schema-export:DOC_DEGRADATIONS | doc-degradation | no
doc-provenance-format-vocabulary | packages/agentic-workflow-schema/src/doc-provenance.ts | schema-export:DOC_PROVENANCE_FORMATS | doc-provenance-format | no
ceremony-profile-piece-vocabulary | packages/agentic-workflow-schema/src/ceremony-profile.ts | schema-export:CEREMONY_PROFILE_PIECES | ceremony-profile-piece | no
ceremony-profile-adoption-vocabulary | packages/agentic-workflow-schema/src/ceremony-profile.ts | schema-export:CEREMONY_PROFILE_ADOPTIONS | ceremony-profile-adoption | no
ceremony-profile-refusal-vocabulary | packages/agentic-workflow-schema/src/ceremony-profile.ts | schema-export:CEREMONY_PROFILE_REFUSALS | ceremony-profile-refusal | no
ceremony-profile-block | packages/agentic-workflow-schema/README.md | block:ceremony-profile@1 | n/a | no
interview-bank | skills/init-workspace/references/ENGINEERING_INTERVIEW.md | block:interview-bank@1 | n/a | no
elicitation-checklist | skills/unit-lane/references/ELICITATION.md | block:elicitation-checklist@1 | n/a | no
pre-spec | skills/unit-lane/references/ELICITATION.md | block:pre-spec@1 | n/a | no
materialization-outcome-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:MATERIALIZATION_OUTCOMES | materialization-outcome | no
materialization-finding-code-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:MATERIALIZATION_FINDING_CODES | materialization-finding-code | no
artifact-evidence-kind-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:ARTIFACT_EVIDENCE_KINDS | artifact-evidence-kind | no
materialization-grammar | packages/agentic-workflow/README.md | block:materialization@1 | materialization-outcome+materialization-finding-code+artifact-evidence-kind | no
doc-provenance-grammar-family-vocabulary | packages/agentic-workflow-schema/src/doc-provenance.ts | schema-export:DOC_GRAMMAR_FAMILIES | doc-grammar-family | no
doc-provenance-stamp | packages/agentic-workflow-schema/README.md | block:doc-provenance@1 | doc-provenance-format+doc-grammar-family | no
continuation-refusal-vocabulary | packages/agentic-workflow-schema/src/continuation.ts | schema-export:CONTINUATION_REFUSALS | continuation-refusal-type | yes
gate-receipt-verdicts | packages/agentic-workflow-schema/src/gate-receipt.ts | schema-export:GATE_RECEIPT_VERDICTS | gate-receipt-verdict | yes
gate-receipt-check-statuses | packages/agentic-workflow-schema/src/gate-receipt.ts | schema-export:GATE_CHECK_STATUSES | gate-check-status | yes
gate-receipt-freshness | packages/agentic-workflow-schema/src/gate-receipt.ts | schema-export:GATE_RECEIPT_FRESHNESS_CODES | gate-receipt-freshness | no
gate-receipt-grammar | packages/agentic-workflow-schema/README.md | block:gate-receipt@1 | n/a | no
ask-dont-infer-rule | skills/unit-lane/references/DESIGN.md | block:ask-dont-infer@1 | n/a | no
evidence-staleness-rule | skills/unit-lane/references/DESIGN.md | block:evidence-staleness@1 | n/a | no
activity-fusion | skills/unit-lane/references/PLAN.md | block:activity-fusion@1 | n/a | no
residual-promise-grammar | skills/unit-lane/references/DESIGN.md | block:residual-promise@1 | n/a | no
relay-status-grammar | skills/unit-lane/references/RELAY.md | block:relay-status@1 | n/a | no
journal-fragment-grammar | packages/agentic-workflow/README.md | block:journal-fragment-grammar@1 | n/a | no
journal-write-grammar | packages/agentic-workflow/README.md | block:journal-write-grammar@1 | n/a | no
journal-headless-grammar | packages/agentic-workflow/README.md | block:journal-headless-grammar@1 | n/a | no
runner-set | skills/runner-contract/references/RUNNER.md | block:runner-set@1 | n/a | no
journal-entry-contract | packages/agentic-workflow-schema/src/journal.ts | schema-export:JOURNAL_ENTRY_KINDS | journal-entry | no
journal-driver-contract | packages/agentic-workflow/README.md | block:journal-driver-contract@1 | n/a | no
turn-contract-fields | skills/orchestration-envelope/references/TURN_CONTRACT.md | block:hand-off-fields@1 | envelope-field:next | yes
turn-contract-transitions | skills/orchestration-envelope/references/TURN_CONTRACT.md | block:hand-off-transitions@1 | workflow-intent | no
turn-contract-receipt | skills/orchestration-envelope/references/TURN_CONTRACT.md | block:turn-contract-receipt@1 | n/a | no
open-questions-block | skills/orchestration-envelope/references/TURN_CONTRACT.md | block:open-questions@1 | continuation-refusal-type | no
needs-input-route-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:NEEDS_INPUT_ROUTES | needs-input-route | no
substrate-class-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:SUBSTRATE_CLASSES | substrate-class | no
substrate-coverage-block | packages/agentic-workflow/README.md | block:substrate-coverage@1 | substrate-class | no
path-protection-contract | skills/orchestration-envelope/references/TURN_CONTRACT.md | block:path-protection@1 | path-protection-reason | no
spec-requirement-ids | docs/features/_TEMPLATE/SPEC.md + docs/fix/_TEMPLATE/SPEC.md + template/docs/features/_TEMPLATE/SPEC.md + template/docs/fix/_TEMPLATE/SPEC.md | block:spec-requirement@1 | n/a | no
task-spec-links | docs/features/_TEMPLATE/SPEC.md + docs/fix/_TEMPLATE/SPEC.md + template/docs/features/_TEMPLATE/SPEC.md + template/docs/fix/_TEMPLATE/SPEC.md | block:task-spec-link@1 | n/a | no
log-kind-vocabulary | docs/features/_TEMPLATE/SPEC.md + docs/fix/_TEMPLATE/SPEC.md + template/docs/features/_TEMPLATE/SPEC.md + template/docs/fix/_TEMPLATE/SPEC.md | block:log-kind@1 | n/a | no
findings-carrier | docs/features/_TEMPLATE/SPEC.md + docs/fix/_TEMPLATE/SPEC.md + template/docs/features/_TEMPLATE/SPEC.md + template/docs/fix/_TEMPLATE/SPEC.md | block:findings-table@1 | n/a | no
findings-severity-ladder | skills/review-implementation/references/CLASSIFY.md | block:finding-severity-ladder@1 | finding-severity-ladder | no
findings-impact | skills/review-implementation/references/CLASSIFY.md | block:finding-impact@1 | finding-impact | no
pass-name-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:PASS_NAMES | pass-name | no
triage-verdict-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:TRIAGE_VERDICTS | triage-verdict | no
triage-criteria-provenance-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:TRIAGE_CRITERIA_PROVENANCE | triage-criteria-provenance | no
setup-defect-route | skills/triage-issue/references/ISSUE_PROCESS.md | block:setup-defect-route@1 | n/a | no
path-protection-reasons | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:PATH_GUARD_REASONS | path-protection-reason | no
content-guard-reasons | packages/agentic-workflow-schema/src/content-guard.ts | schema-export:CONTENT_GUARD_REASONS | content-guard-reason | yes
feedback-tiers | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:FEEDBACK_TIERS | feedback-tier | no
shell-tool-choice-grammar | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:NODE_SANCTIONED_SCRIPTS | node-sanctioned-script | no
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
writer-refusal-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:WRITER_REFUSAL_REASONS | writer-refusal-reason | no
shared-merge-class-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:SHARED_MERGE_CLASSES | shared-merge-class | no
shared-merge-refusal-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:SHARED_MERGE_REFUSAL_REASONS | shared-merge-refusal-reason | no
tool-inventory | packages/agentic-workflow/README.md | block:tool-inventory@1 | n/a | no
tool-doctor-envelope | packages/agentic-workflow/README.md | block:doctor-envelope@1 | n/a | no
doctor-check-status-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:DOCTOR_CHECK_STATUSES | doctor-check-status | no
doctor-install-route-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:INSTALL_ROUTES | install-route | no
doctor-wizard-move-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:WIZARD_MOVES | wizard-move | no
quality-metric-name-vocabulary | packages/agentic-workflow-schema/src/quality-metrics.ts | schema-export:QUALITY_METRIC_NAMES | quality-metric-name | no
quality-confidence-vocabulary | packages/agentic-workflow-schema/src/quality-metrics.ts | schema-export:QUALITY_CONFIDENCES | quality-confidence | no
quality-metrics-fields | packages/agentic-workflow/README.md | block:quality-metrics@1 | n/a | no
skill-screen-verdict-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:SKILL_SCREEN_VERDICTS | skill-screen-verdict | no
skill-consent-answer-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:SKILL_CONSENT_ANSWERS | skill-consent-answer | no
skill-extra-state-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:SKILL_EXTRA_STATES | skill-extra-state | no
skill-discovery-envelope | packages/agentic-workflow/README.md | block:skill-discovery@1 | n/a | no
review-extras-grammar | packages/agentic-workflow/README.md | block:review-extras@1 | n/a | no
test-obligation-kind-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:TEST_OBLIGATION_KINDS | test-obligation-kind | no
test-obligation-tag-grammar | skills/unit-lane/references/TESTS.md | block:test-obligation-tag@1 | test-obligation-kind | no
test-justification-grammar | skills/unit-lane/references/TESTS.md | block:test-justification@1 | n/a | no
test-deletion-authority-grammar | skills/unit-lane/references/TESTS.md | block:test-deletion-authority@1 | n/a | no
settled-carrier-grammar | docs/workflow/RETENTION.md | block:settled-carrier@1 | n/a | no
retention-declaration-grammar | docs/workflow/RETENTION.md | block:retention-declaration@1 | n/a | no
retention-archive-contract | docs/workflow/RETENTION.md | block:retention-archive@1 | n/a | no
retention-debt-receipt | docs/workflow/RETENTION.md | block:retention-debt@1 | n/a | no
decision-scope-vocabulary | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:DECISION_SCOPES | decision-scope | no
decision-scope-grammar | skills/unit-lane/references/DESIGN.md | block:decision-scope@1 | n/a | no
decision-promotion-grammar | skills/product-audit/references/AUDIT_DIMENSIONS.md | fenced:decision-promotion@1 | n/a | no
repository-state | skills/resolve-repository-state/references/STATE_CONTRACT.md | block:repository-state@1 | n/a | no
restatement-corpus | skills/audit-docs/references/RESTATEMENT.md | block:restatement-corpus@1 | n/a | no
```

### Rendered facts (prose that restates a machine value)

Where prose repeats a version, a count, or a contract id, the machine is
authoritative and the prose is the defect (AC15). Each restatement is declared
once here and the test **recomputes** the value: `claim` is a fixed form
(`literal:<exact text>`, `package-versions`), `machine` names the publisher, `+`
joins surfaces carrying the same fact; `literal:` compares the number or id inside
the quoted text, the table kinds compare every row the same way. A restatement
found in review but not pinned here is a known-issue with its re-trigger
condition, never a silent gap. The skill-surface counters this block cites are
derived by `bun scripts/skill-surface-counts.mjs`, the one owner of the
derivation the drift gate imports; `count:skill-references` is derived and
printed there with no committed rendering today, so the first surface that
renders it earns a row here.

```text
rendered-facts@1
surface | claim | machine | rule
README.md | pattern:(\d+) source skills | count:skill-files | equals
README.md | pattern:source skills \((\d+) user-facing | count:user-facing | equals
README.md | pattern:(\d+) workflow internals | count:workflow-internals | equals
README.md+docs/workflow/SKILLS.md | pattern:(\d+) metadata-internal | count:metadata-internal | equals
README.md | pattern:(\d+) discoverable | count:discoverable | equals
README.md+docs/workflow/SKILLS.md | pattern:\*\*(\d+) user-facing skills\*\* | count:user-facing | equals
docs/workflow/SKILLS.md | pattern:The (\d+)\s+user-facing skills cover | count:user-facing | equals
docs/workflow/REPLICATE.md | pattern:The (\d+) installable skills | count:discoverable | equals
docs/workflow/REPLICATE.md | pattern:The \d+ installable skills \((\d+) user-facing | count:user-facing | equals
docs/workflow/REPLICATE.md | pattern:\+ (\d+) internal, including | count:workflow-internals | equals
docs/workflow/REPLICATE.md | pattern:installable set is \*\*(\d+) user-facing | count:user-facing | equals
docs/workflow/REPLICATE.md | pattern:user-facing \+ (\d+) internal\*\* | count:workflow-internals | equals
docs/workflow/REPLICATE.md | pattern:internal\*\* \((\d+) total\) | count:discoverable | equals
docs/workflow/REPLICATE.md | pattern:\*\*User-facing \((\d+)\) | count:user-facing | equals
docs/workflow/REPLICATE.md | pattern:\*\*Internal \((\d+)\) | count:workflow-internals | equals
skills/runner-contract/references/RUNNER.md | literal:bunx @gtrabanco/agentic-workflow@4.10.0 | package:version | equals
CHANGELOG.md | package-versions | package:version | equals-each
skills/pre-execution-review/references/POLICY.md | restates:gate-rejection-vocabulary@1:gate-rejection-type | const:GATE_REJECTION_TYPES | equals-set
docs/workflow/README.md | pattern:The (\d+) companion npm packages | count:packages | equals

```

The two schema generators show the split: one script rewrites a projection or
reports on it, and only the reporting mode may run after a freeze. No script or
skill may keep a second copy of this list.

