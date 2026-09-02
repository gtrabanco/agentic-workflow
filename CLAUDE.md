# CLAUDE.md

Guidance for AI coding agents working in **this** repository (`agentic-workflow`).

This repo is **not** an application. It ships two things:

1. **`skills/`** — a stack-agnostic set of agent skills that run a disciplined,
   doc-driven feature/issue workflow. Each is one `skills/<name>/SKILL.md`.
2. **`template/`** — an exportable documentation scaffold: the *way of working*
   (documentation map, SPEC/feature/fix templates, GitHub templates, conventions)
   that a target project copies so the skills have a substrate to operate on.

The skills are **project-adaptive**: at runtime they discover and obey the target
project's own guide, documentation map, architecture, roadmap and style docs.
Nothing here is tied to a specific stack, framework, or architecture pattern.

---

## Repository layout

```
skills/                  the workflow skills (one SKILL.md each) — the installable source
.claude/skills           symlink → ../skills, so this repo dogfoods them in Claude Code
template/                the exportable documentation scaffold (generic, copyable)
packages/                two companion npm packages (bun-managed islands — see Packages below)
docs/workflow/           the tutorial: feature flow, issue flow, skill reference, replication
docs/features/_TEMPLATE  feature SPEC template + ROADMAP
docs/fix/                fix SPEC template + index
.github/                 issue + PR templates the workflow expects
README.md / README.es.md project overview (EN / ES)
```

---

## Working rules

- **Docs language is English.** Every committed artifact (skills, docs, templates,
  commits, PR descriptions) is in English, regardless of the language used to
  request the work. Reply to the user in the user's language.
- **Human-readable docs carry EN + ES siblings.** `README`, `CHANGELOG`,
  `docs/workflow/*.md`, and the schema package `README` each get a faithful
  `.es.md` sibling with reciprocal language-switcher links
  (`> 🇪🇸 [Versión en español](<name>.es.md)` on the English original,
  `> 🇬🇧 [English version](<name>.md)` on the Spanish sibling).
  **Hard rule — the ES sibling is updated in the SAME change, never
  deferred.** If a change edits an English doc that has a `.es.md` sibling (or
  is documentation that should be translated), it MUST update the Spanish
  version in the same commit/PR — a diff that touches only the English side of
  a bilingual pair is incomplete and must not be committed or merged. This is
  not "on next touch, best effort": whoever edits the English doc owns the
  reciprocal ES edit right then. There is no automated staleness check, so the
  rule is enforced by the author and by review. **Scope exception:** `SKILL.md`,
  SPECs, commits, PRs, and machine config (`model-routing.yml`) stay
  English-only per the docs-language rule above and have **no** ES sibling — the
  bilingual sync rule applies only to docs that actually have a translatable
  sibling (human tutorial/reference prose), never to process artifacts.
- **Vendored third-party code carries its provenance.** Any code copied from a
  third party into this repository — into a package's `src/`, a script, or a
  skill reference — keeps a header comment naming the **source URL, the author,
  the version copied, and the license name**. A copy without those four is a
  provenance defect, not a formatting slip: nothing else in the tree says where
  the bytes came from, so an upstream relicensing or an attribution obligation
  cannot be audited later. Vendoring is a real alternative to adding a
  dependency and it is weighed as one (unit 28's D36 rejected a 1,419-line
  copied `sha256` closure on measured cost and kept the package's own core, and
  AC21 keeps the schema package dependency-free); whichever route a change
  takes, the provenance header is mandatory for the first.
- **Stack/architecture agnostic.** Do not introduce references to any specific
  product, stack, framework, ORM, runtime, or architecture pattern into the
  skills or the shared docs. Generic phrasing ("the project's architecture",
  "the project's verification gate") is the rule.
- **One PR per unit of work, always against `main`.** Never work on `main`
  directly; never stack PRs (a PR's base is always `main`).
- **Commit format:** conventional commits, e.g. `feat(skills): add execute-phase`,
  `docs(workflow): clarify replicate steps`, `chore(template): add brand stub`.

---

## Authoring a skill

A skill is a folder `skills/<name>/SKILL.md` with YAML frontmatter + a body.

```yaml
---
name: <kebab-case-name>          # must match the directory name
user-invocable: true             # REQUIRED for it to appear in the agent's /command menu
version: 1.0.0                   # per-skill semver; bump on every change (see below)
description: >
  One paragraph with concrete trigger phrases so the agent knows when to load it.
---
```

Body sections every skill follows: `When to use`, `Step 0 — Discover the project
(always first)`, `Process`, `Guardrails`, `Relationship to other skills`,
`Done when`.

> **`user-invocable: true` is mandatory.** Without it, the skill is not offered
> in the slash-command menu in this environment. Always set it explicitly.

> **Always close with a `→ Next:` block.** Every skill ends its turn with a
> **visible recommendation block** — not a buried "Done when" bullet. The shape is
> the "review checkpoint" style: one **recommended** command on the `→ Next:` line,
> then the open alternatives as `·` sub-bullets, leaving the choice to the user
> (recommend, never dictate). Use this exact shape:
>
> ```
> → Next: /<recommended-command> — <one-line why>
>   · <alternative> → <when to pick it>
>   · <alternative> → <when to pick it>
> ```
>
> Two cases the block must cover when they apply: (a) **finishing a unit/feature** →
> point to the next concrete unit (`/plan-feature --next`, or a named issue/roadmap
> entry); (b) **recurring inconsistency** — when `review-change`/`triage-issue` see
> the *same* problem twice (e.g. SPEC drift on consecutive units) → recommend
> `/product-audit`. A terminal verdict still names what to do with it (merge,
> re-audit, triage). This is part of "Done when" for every skill.

> **Phases are `P1, P2, …` ("phases"), never "Steps"/`S1`.** Any skill that
> produces or references a plan labels implementation steps `P1, P2, …` and calls
> them *phases* (a Spanish or other-language UI may say "fases"/"pasos", but the
> committed artifacts and the labels stay `P1, P2, …`). The label is the executor's
> argument (`execute-phase NN P2`), so it must be stable and uniform — never emit
> `S1`/`S2`/"Step N" into a `PLAN.md`, `TASKS.md`, `progress.md`, SPEC, or roadmap.

> **Checklists over heuristics; fixed output formats.** Skills are executed by
> models of any strength, not only frontier ones — write instructions a weaker
> model cannot misread: (a) heuristics become **checklists** ("pass only if: ✓ …"),
> every item independently checkable, n/a stated explicitly; (b) reports and
> verdicts carry a **fixed output contract** ("Return exactly: …" with the block
> quoted) ending in an unambiguous decision (`PASS | FAIL`,
> `MERGE-READY | BLOCKED`, a named verdict); (c) bound freedom with
> **Allowed / Forbidden lists** wherever a skill could "improve" beyond scope;
> (d) "if needed" is banned — name the minimum set to verify (docs, files,
> checks). Claude tiers stay the declared defaults (they set the reference bar),
> but every skill must run correctly on any agent and any model — see the README
> model-equivalence table.

> **Complete dynamic hand-offs.** When the invocation or artifact contains more
> than one issue, dependency, finding, or other target, the closing recommendation
> must name every actual ID once, in order, joined with ` + ` (for example,
> `#71 + #72 + #73`). A command may use the designated primary when its syntax
> requires one, but the full set must remain visible beside it. Never emit only
> the primary, a generic "act on the verdicts", or literal placeholders/ellipsis
> in a live hand-off.

> **Turn contract at the top.** Every user-facing skill opens with a
> `## Turn contract` section: the 2–6 boxes every invocation must tick before
> the turn may end (the deliverable in its fixed format; the closing `→ Next:`
> block printed **last**; for executors: git/forge commands actually **RUN**
> with sha/PR-URL pasted — describing an action is not performing it). Weaker
> models drop end-of-document duties, so the contract goes first, and every
> skill states that an about-to-end turn with an unchecked box is not done.

> **Self-contained reviews — never depend on external skills.** The review axes
> are covered by the repo's **own internal review pack**
> (`skills/review-*`: code, security, verify, debt, design, a11y, brand, perf,
> seo — each a fixed checklist returning a findings table + `PASS | FAIL`).
> `review-change` / `product-audit` compose the pack; platform skills a project
> installs are **optional extras run in addition, never dependencies** — a skill
> body must never require a Claude Code-bundled or third-party skill to function.

> **Every user-facing skill carries a `## Portability` section.** The skills
> install into 70+ agents via the `skills` CLI; Claude Code features (slash-command
> menu, per-skill `model:`/`effort:`, `/loop`, subagents, hooks, `ultracode`) are
> conveniences, **not the contract**. Every `user-invocable: true` skill includes a
> short `## Portability (agents other than Claude Code)` section stating the
> fallbacks that apply to it, drawn from these standards:
> *no slash menu* → open the target skill's `SKILL.md` and follow it literally in a
> fresh conversation; *no model tiers* → strongest model for planning/review/audit,
> cheaper for mechanical execution, and never review a change with a model weaker
> than the one that wrote it; *no `/loop`/subagents* → re-invoke manually and follow
> the closing `→ Next:` block. Tailor per skill (e.g. hooks for `log-session`,
> subagents for `ship-roadmap`). Additionally, whenever a skill body references a
> Claude Code-specific feature, pair it **inline** with the generic fallback — the
> instruction must be executable by an agent that has never heard of Claude Code.

> **Version every change.** Each skill carries its own `version:` and evolves
> independently. When you change a skill, bump its `version:` (major = rename or
> contract/flag change; minor = backward-compatible capability; patch = wording/
> examples) and add a line to [`CHANGELOG.md`](CHANGELOG.md). Renames are major and
> need a note in `docs/workflow/MIGRATION.md`.

> **Smoke-test wording changes to executor-path skills.** After editing
> `execute-phase`, `plan-feature`, `plan-feature-scaffold`,
> `plan-feature-from-issue`, `design-feature`, or a `review-*` skill, run the
> manual procedure in
> [`docs/workflow/GOLDEN_FIXTURE.md`](docs/workflow/GOLDEN_FIXTURE.md) — it
> drives a fixed toy fixture through the changed skill with the weakest model
> in your fleet to catch wording a frontier model absorbs silently but a weak
> model misreads.

### Hand off, don't compose across a model/effort boundary

A skill's `model` and `effort` are **fixed at the start of its turn** and do **not**
change when it loads another skill mid-turn (verified against the Claude Code
skills / model-config docs). So invoking skill B from skill A runs B at **A's**
model and effort, not B's — silently under- or over-powering B.

**Rule (the test is ≥, not "same"):** before composing skill B in-turn, compare
tiers. Compose **only when A's model/effort is ≥ B's** (so B isn't under-powered).
If B needs a **higher** model or effort than A, **hand off** instead — print
`run /<skill>` / the next command and let the user invoke B in a fresh turn at its
own tier. Most of the flow already hands off (`plan-feature` prints
`execute-phase NN P1`; `plan-fix` stops and suggests `execute-phase --fix`;
`triage-issue`/`review-change`/`audit-pr` route with suggestions; `execute-phase`
hands off to `/review-change` at its review checkpoint).

**Why ≥ and not "same":** composing at a *higher* tier (e.g. `product-audit` at
`opus`/`max` running `audit-docs`'s `sonnet`/`medium` checks) over-powers B —
harmless, just costlier. Composing at a *lower* tier (the bug we hit: `execute-phase`
at `sonnet`/`medium` running `review-change` at `opus`/`high`) **under-powers** B — a
real regression. So the orchestrators and routers, which are the high-tier (`opus`,
`high`/`max`) skills, may safely compose what they synthesize: `review-change` →
`review-implementation` + companions; `product-audit` → its sub-checks; the
`plan-feature` router → its `opus` internals (it carries the highest effort of its
paths). Everything else hands off.

> Note: `ultracode` is a Claude Code **session setting** (xhigh effort + automatic
> multi-agent workflow orchestration), **not** a frontmatter `effort:` value — a
> skill cannot declare it. The accepted `effort:` values are `low`/`medium`/`high`/
> `xhigh`/`max`.

---

## Distribution

The skills install with the [`skills`](https://github.com/vercel-labs/skills) CLI,
which reads the `SKILL.md` files straight from this repo into any supported agent
(Claude Code, Cursor, Codex, …):

```sh
npx skills add gtrabanco/agentic-workflow
```

There is no build step and no generated installer — adding a skill is just adding
a `skills/<name>/SKILL.md`. Full replication guidance is in
`docs/workflow/REPLICATE.md`.

---

## Verification

This repo has no application build. "Green" means:

- The `skills` CLI discovers every skill: `npx skills add . --list` lists them all.
- Markdown is well-formed; cross-references between docs resolve.
- Context budgets pass: `node scripts/check-skill-context.mjs` (every skill's
  `SKILL.md` is within its enforced line/token budget and reference reachability).
- No stack/real-project references leaked into the skills or shared docs.
- If `packages/agentic-workflow-schema/` was touched: `bun run test` passes
  there, and any change to the envelope schema in
  `skills/orchestration-envelope/SKILL.md` is mirrored in the package (types +
  `envelope.schema.json` + version bump) — same PR, always.
- If `packages/pi-agentic-workflow/` was touched: `bun run test` passes there,
  and any change to a `skills/<name>/SKILL.md` is re-bundled into the package
  with `npm run bundle:skills` (the committed `packages/pi-agentic-workflow/skills/`
  mirror stays byte-identical to `skills/`; `test/alias-coverage.test.mjs`
  reads both trees) — same PR, always.

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
bump-skill | version bumper and doc writer (rewrites SKILL.md `version:`, both CHANGELOG tables, README/SKILLS cells) | before
npm run bundle:skills | bundler (copies `skills/` into the Pi package mirror `packages/pi-agentic-workflow/skills/`) | before
npm run build (packages/agentic-workflow-schema) | generator (`tsc`, emits `dist/`) | before
generate-pre-execution-schemas.mjs | generator (writes the two `pre-execution-*.schema.json` projections) | before
generate-verification-schemas.mjs | generator (writes the verification schema projections) | before
generate-docs | docs generator (writes `docs/site/guides/`) | before
generate-pre-execution-schemas.mjs --check | check-only (drift report, `npm run check:pre-execution-schemas`) | after
generate-verification-schemas.mjs --check | check-only (drift report, `npm run check:verification-schemas`) | after
pre-execution-snapshot.mjs verify | check-only (re-derives a bound digest, writes nothing) | after
node scripts/check-skill-context.mjs (--routes) | check-only (budget report, writes nothing) | after
probe-sha256-paths.mjs (packages/agentic-workflow-schema) | check-only (SHA-256 path and cost probe, `npm run probe:sha256-paths`, prints digests/timings, writes nothing) | after
formatter | none declared — this repository has no Prettier, Biome or EditorConfig configuration, so the formatter category is empty here | n/a
```

### Normative surfaces (the drift gate's scope)

A *normative surface* is a place that orders what an agent may do next: a flag it
may pass, a gate trace it may print, a verdict it may emit, a field it may write,
a route it may hand off to. Feature 28's AC15 binds each of those to the machine
surface that accepts it — the schema package's published vocabularies
(`packages/agentic-workflow-schema/src/`), the `argument-hint:` frontmatter of each
skill, and the skill directory itself. The gate reads **versioned grammar only**:
a `block:` id, a `fenced:` fixed-output contract, a `table:` section, or frontmatter.
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
plan-mode-routing | skills/plan-feature/references/ROUTING.md | block:plan-mode-routes@1 | skill+flag | no
fix-mode-routing | skills/plan-fix/references/PLANNING_PROCESS.md | block:fix-mode-routes@1 | skill+flag | no
review-spec-verdicts | skills/review-spec/references/OUTPUT.md | fenced:SPEC-REVIEW-PASS+Verdict: | pre-execution-verdict | yes
review-plan-verdicts | skills/review-plan/references/OUTPUT.md | fenced:PLAN-REVIEW-PASS+Verdict: | pre-execution-verdict | yes
review-spec-handoff | skills/review-spec/references/OUTPUT.md | fenced:→ Next: | skill | no
review-plan-handoff | skills/review-plan/references/OUTPUT.md | fenced:→ Next: | skill | no
sensor-labels | skills/workflow-status/references/PRE_EXECUTION.md | table:One label per stage | n/a | no
snapshot-commands | skills/pre-execution-review/references/SNAPSHOT.md | fenced:--stage | pre-execution-stage+pre-execution-unit-kind | no
ledger-ownership-map | skills/pre-execution-review/references/LEDGERS.md | block:ledger-ownership@1 | n/a | no
ledger-review-mark-shape | skills/pre-execution-review/references/LEDGERS.md | block:review-mark@1 | n/a | no
sensor-envelope-fields | skills/workflow-status/references/SENSOR_CORE.md | block:sensor-fields@1 | envelope-field | no
turn-contract-fields | skills/orchestration-envelope/references/TURN_CONTRACT.md | block:hand-off-fields@1 | envelope-field:next | yes
turn-contract-transitions | skills/orchestration-envelope/references/TURN_CONTRACT.md | block:hand-off-transitions@1 | workflow-intent | no
```

### Rendered facts (prose that restates a machine value)

Where prose repeats a version, a count, or a contract id, the machine is
authoritative and the prose is the defect (AC15). A regex over sentences cannot
find those, so each restatement is declared once here and the test **recomputes**
the value: `claim` is a fixed form (`literal:<exact text>`, `version-tables`,
`package-versions`), `machine` names the publisher, `+` joins surfaces that each
carry the same fact. `literal:` compares the number or id inside the quoted text;
the table kinds compare every row the same way. A restatement found in review but
not pinned here is a known-issue with its re-trigger condition, never a silent gap.

```text
rendered-facts@1
surface | claim | machine | rule
docs/workflow/SKILLS.md | pattern:\*\*(\d+) user-facing skills\*\* | count:user-facing | equals
docs/workflow/SKILLS.es.md | pattern:\*\*(\d+) skills orientadas al usuario\*\* | count:user-facing | equals
CHANGELOG.md + CHANGELOG.es.md | version-tables | frontmatter:version | equals-each
CHANGELOG.md + CHANGELOG.es.md | package-versions | package:version | equals-each
skills/review-spec/references/OUTPUT.md + skills/review-plan/references/OUTPUT.md | literal:agentic-workflow/pre-execution-review-receipt@1 | const:PRE_EXECUTION_RECEIPT_CONTRACT_ID | equals
```

The two schema generators are the clean example of the split the rule turns on: the
same script rewrites a projection or reports on it, and only the reporting mode may
run after a freeze. `bundle:skills` must run after the last edit under `skills/` and
before any freeze, because `test/skill-parity.test.mjs` fails a drifted mirror. No
script or skill may keep a second copy of this list.

---

## Packages

The two npm packages under `packages/` are independent bun-managed islands,
not a workspaces monorepo — there is no root `package.json` and nothing
hoists.

- **bun is the package manager, everywhere.** `bun.lock` (committed) is the
  sole lockfile: install with `bun install --frozen-lockfile`, run scripts
  with `bun run <script>`. A `package-lock.json` inside any package is drift
  — each package's `.gitignore` rejects it and
  `test/lockfile-policy.test.mjs` fails the suite if one appears (both npm
  lockfiles resurrected once, on main, and had to be removed again). The npm
  CLI is still used for the publish step only (Trusted Publishing +
  `--provenance` are npm-CLI-specific tooling Bun doesn't replicate).
- **Version bumps are manual and same-PR.** Bump `version:` in the touched
  package's `package.json` and add a row to the "Companion npm packages" /
  "Paquetes npm complementarios" table in `CHANGELOG.md` + `CHANGELOG.es.md`
  in the same PR. CI publishes on merge to `main` when the version differs
  from the registry (`publish-schema.yml`, `publish-pi-package.yml` — one
  file per package, because npm Trusted Publisher records pin the workflow
  filename; a rename would break the npm-side record until re-registered by
  hand).
- **Changesets: deliberately not adopted** (decided 2026-08-30). The curated
  bilingual changelog tables above are the release-notes surface; changesets
  would fork them into per-package English-only `CHANGELOG.md` files,
  require re-binding both packages' npm Trusted Publisher records to a new
  release workflow, and add a version-PR loop for exactly two independent
  packages with no cross-dependencies. Revisit when a third package lands or
  per-package beta/snapshot channels are needed.

---

## Conventions

| Type | Convention |
|---|---|
| Skill directories | kebab-case (`execute-phase`) |
| Markdown docs | kebab-case or SCREAMING_CASE per existing siblings |
| Skill `name:` | matches the directory name exactly |
| Machine/config surfaces (`.claude-plugin/plugin.json` `skills` array, `docs/workflow/model-routing.yml` top-level keys) | alphabetical |
| Narrative surfaces (README "The skills" `###` sections, `docs/workflow/SKILLS.md`) | flow order (the stage a skill runs at: Setup, Design, Plan, Execute, Review & audit, Decide, Document, Session, Repo maintenance, Autopilot) — never alphabetized |

---

## Skills available in this repo

When repeated searches or repeated documentation lookups happen while working
here, prefer creating or refining a skill over re-deriving the knowledge. Store
reusable operational knowledge as a skill under `skills/`.

**Repo maintenance skill (specific to this repo):**

- **`bump-skill`** — after editing any SKILL.md, run this before committing.
  It bumps `version:`, adds changelog rows to `CHANGELOG.md` and
  `CHANGELOG.es.md`, and updates the skills and model tables in both READMEs.
  This is the mechanical enforcement of the "Version every change" rule above.
  `bump-skill` itself is `user-invocable: false` — invoke it via the Skill
  tool / by following its `SKILL.md` directly, not the slash-command menu.
  It also carries `metadata.internal: true`, the `skills` CLI's own gate
  that keeps `npx skills add` from discovering/offering repo-internal
  skills to target projects (see `docs/fix/74-bump-skill-discovery-exclusion/`).
