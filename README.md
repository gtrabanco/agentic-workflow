<p align="center">
  <img src="docs/assets/logo.svg" alt="Agentic Workflow logo" width="120" height="120">
</p>

<p align="center">
  <a href="https://www.youtube.com/watch?v=2Ai0NkTvoeM">
    <img src="https://img.youtube.com/vi/2Ai0NkTvoeM/mqdefault.jpg" alt="ship-roadmap opening a PR on a sample repository" width="280">
  </a>
  <br>
  <sub style="font-size: 0.75em;"><code>ship-roadmap</code> opening a PR end to end on a sample repository — click to watch</sub>
</p>

# Agentic Workflow Skills

> 🇪🇸 [Versión en español](README.es.md)

A reusable set of **agent skills** that run a disciplined, doc-driven workflow
for building software with agents — from idea/issue to a reviewed, classified,
merge-ready change. The skills are **project-adaptive**: they discover and obey
each repository's own guide, architecture, roadmap and style docs at runtime, so
the same workflow works on any stack.

They are plain Markdown (`SKILL.md` files), so they work with **any agent** that
reads skills — Claude Code, Cursor, Codex, OpenCode, Cline, and
[70+ others](https://skills.sh) — installed with the
[`skills`](https://github.com/vercel-labs/skills) CLI (see
[Install](#install)).

> The examples in `docs/` are generic and illustrative; the skills
> themselves are stack-agnostic and architecture-agnostic.

> ## ⚠️ Breaking change (v3, 2026-07-04): the default branch is now model-agnostic
>
> `npx skills add gtrabanco/agentic-workflow` (no `#ref`) now installs what used
> to be the **`#inheritance`** variant: no skill carries `model:`/`effort:`
> frontmatter, so every skill simply **inherits whatever model and effort your
> agent session is already using**. The goal: using this workflow should never
> lock you into one vendor's model lineup — you pick the model, the skills just
> run the discipline.
>
> - **On Claude Code and want the hand-tuned, per-skill Opus/Sonnet + effort
>   tiers this project used to ship by default?** Install the **`#claude`**
>   branch instead: `npx skills add gtrabanco/agentic-workflow#claude`.
> - **Already pinned `#inheritance`?** Nothing to do — `#inheritance` keeps
>   working, kept in sync as an exact alias of the default branch.
> - **Everyone else** (any other agent, or you'd rather choose tiers yourself):
>   the plain install command below already gives you this branch — no action
>   needed.
>
> See [`docs/workflow/MIGRATION.md`](docs/workflow/MIGRATION.md) for the full
> rationale and upgrade notes.

## What's inside

```
skills/                  35 source skills (18 user-facing + 15 workflow internals + 2 maintenance contracts; 31 plugin-listed)
.claude/skills           symlink → ../skills, so this repo dogfoods them in Claude Code
template/                 the exportable documentation scaffold (the substrate the skills read)
docs/workflow/           the full tutorial (feature flow, issue flow, reference, replication)
docs/features/_TEMPLATE  feature SPEC template + ROADMAP (the planning artifacts skills produce)
docs/fix/                fix SPEC template + index
.github/                 issue + PR templates the workflow expects
```

The skills are the **behavior**; `template/` is the **substrate** they read (a
generic `CLAUDE.md` + documentation map, SPEC/feature/fix templates, and GitHub
templates). Scaffold a new project's way of working with
`npx degit gtrabanco/agentic-workflow/template my-project` — see
[`docs/workflow/REPLICATE.md`](docs/workflow/REPLICATE.md).

The largest skills use progressive, one-hop loading instead of paying their full
instruction cost at activation. In particular, `execute-phase` now activates at
about 3k estimated tokens rather than 13k, then loads only the route-specific
contracts it needs. Committed budgets enforce that shape; prompt caching is only
an optional provider optimization, never a correctness dependency. See
[Context budget and progressive loading](docs/workflow/SKILLS.md#context-budget-and-progressive-loading).

## The skills

**18 user-facing skills** (one menu entry each) + internal contracts composed
for you: the `plan-feature` router's two planning steps, the `review-change`
engine, the `orchestration-envelope` contract, the workflow's **own 9-skill internal review pack** (`review-code`,
`review-security`, `review-verify`, `review-debt`, `review-design`,
`review-a11y`, `review-brand`, `review-perf`, `review-seo`), and the repo-only
`bump-skill` maintenance helper (excluded from installation) — so **no external review skill is ever
required**, on any agent, with any model. One disciplined path: **design →
plan → execute → review → audit → merge.**

> Every skill's invocation forms and flags (`--fix`, `--force`,
> `--adversarial N`, `--next`, `--fullauto`, …) are catalogued in the
> [Invocation & arguments reference](docs/workflow/SKILLS.md#invocation--arguments-reference).

### Setup

| Skill            | What it does                                                                                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init-workspace` | Fetches and adapts `template/` by interview: gate, doc map, architecture, capability inventory, optional invariants, and injection-safe labels. It detects Claude Code, Cursor, Copilot, or OpenCode and offers the repository-scoped safety guard explicitly — never installs or overwrites hooks without consent. Existing scaffolds enter additive **upgrade mode** and receive only missing blocks/adapters. |
| `discover-repository-state` | Creates and freezes an evidence-backed repository-state ledger before planning or implementation; facts, decisions, documentation, planned work, and inference remain distinct |
| `resolve-repository-state` | Sole writer for an explicit repository-state contradiction; verifies the competing evidence and publishes the next frozen snapshot |

### Design

| Skill            | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `design-feature` | **Product definition.** Folds in the raw-idea interview, then walks three fixed **capability-closure** checklists — **entity closure** (per entity: CRUD + state transitions, each with a UI entry point + API surface + test, or an explicit `n/a: <reason>`), **integration closure** (the feature reconciled against every subsystem in the project's capability inventory, `docs/CAPABILITIES.md`: auth, ACL, navigation, notifications, … — one resolved row per subsystem, none skipped), and a **role matrix** (every inventory role explicitly allowed/denied per capability) — into exhaustive acceptance criteria, plus an **expectation sweep** (≥ 10 implicit domain expectations — "a blog has drafts" — each forced to in-scope/out-of-scope/deferred, never left unstated). It classifies optional architectural invariants from repository evidence and stops for an explicit decision when a rule changes. Writes the SPEC's **product half**, stamps `## Design status: designed`, and sets the feature's roadmap row to `defined` (the `idea → defined` transition). Upserts on re-run; never destroys recorded decisions. |

### Plan

| Skill          | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plan-feature` | **Engineering-planning router for an already-designed feature.** The redirect gate keys on the **roadmap status** first — `idea`/absent → STOP → `design-feature`, no bypass flag; `defined` → proceed to Routing; **`planned`/`in-progress`/`done` → STOP, hand off to `/execute-phase` (never re-scaffolds an already-planned feature)**; the SPEC `## Design status` marker is only the legacy-compat fallback for a pre-migration `planned` row. Given a designed feature, an issue `#N` (issue → scoped product half), or a scoped slug/SPEC (straight to engineering-half scaffolding), routes to the right step, checks optional architectural invariants with evidence, then registers the roadmap entry (re-reading the `defined → planned` write to confirm it landed). `--next` plans the next **`defined`** roadmap item. **Sizes every feature** (`XS/S/M/L`): small ones get a SPEC-only path with ≥ 2 phases in the SPEC (last = `Hardening & PR`) — no artifact ceremony; M/L get the full set with a mandatory hardening phase. |
| `plan-fix`     | Drafts one fix SPEC + frozen `ACCEPTANCE.md` from one or more issues. Multi-issue units group by an atomic delivery boundary: one capability outcome or homogeneous mechanical rule, one verification plan, and one release/rollback boundary; shared files/root cause/equal severity are not required. Incompatible inputs return the fewest maximal groups instead of one issue per PR. |

> `design-feature` (product definition, folds in the raw-idea interview) must
> mark a feature `designed` before `plan-feature` will plan it — `plan-feature`
> refuses and redirects otherwise, no bypass flag. Once designed, you only ever
> call `plan-feature`; it composes the internal steps `plan-feature-from-issue`
> and `plan-feature-scaffold` (hidden from the menu).

### Execute

| Skill           | What it does                                                                                                                                                                                                                                                                                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `execute-phase` | With no phase argument, executes **all remaining feature/fix phases** through PR close-out; explicit `P<n>` keeps one-phase atomic mode. Every phase retains its own acceptance-blob check, phase/invariant/dependency gates, tests, docs, and commit. Unit-loop mode uses fresh workers where available, compact receipts otherwise, skips intermediate review stops, and halts on red/no-progress/attempt budget. Discoveries become `Autofix`, `Opportunistic Fix`, or a proposal—never an automatic issue. |

### Review & audit — _change → PR → product_

| Skill           | Scope           | What it does                                                                                                                                                                                   |
| --------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `review-change` | the **change**  | Runs only the reviews that **apply to your platform** (code, security, verify, design, a11y, brand, perf, SEO) — adversarially by default, assuming the diff is wrong until proven otherwise — and classifies → one decision table + an explicit manual-verification checklist; a dirty tree or unpushed commits on the PR branch are fix-now `workflow` findings. The mandatory end review **must run in a conversation that did not implement the change** — if it did, stop and hand off to a fresh one. Opt-in `--adversarial N`: N independent context-clean reviewers, each an index-assigned role (correctness/security/SPEC-coverage), run in parallel (subagents / headless / sequential-fallback), findings merged by `file:line` at an inclusion threshold of ≥1 — default off, auto-recommended (never forced) when the change is `L`/sensitive, the reviewer isn't the fleet's strongest or is weaker than the diff's author, or only one model family is available on a `≥M` change. `--synthesize` is the standalone fusion entry point for manually-run reviewers. Fix-now findings on an unmerged unit persist to that unit's fix-now fold ledger (`review-findings.md`), deduped by `file:line`+axis. Classification honors the engine's **fix-now override checks**: a cheap fix or an in-scope defect is always fix-now (never a postpone/known-issue/tradeoff escape), and a too-large in-scope fix-now routes to `replan-in-unit` — user-confirmed SPEC phase(s) on the same branch, never a downgrade |
| `fold-findings` | the **findings ledger** | Repairs the full queue in the fewest compatible atomic batches, grouping by root cause/mechanical rule + validator + rollback boundary. One batch gets one commit, while every finding retains its ledger tick and output receipt. Classification stays frozen; disputes stop for a user decision and no fold creates backlog. |
| `loop-review-fold` | the **candidate loop** | Simple state router between `review-change` and `fold-findings`: checks persisted evidence first, folds an existing open queue before reviewing again, and reviews only a changed HEAD. Unresolved findings go to `triage-issue --prioritize-now`; oversized work is replanned into new `P<n>` phases and the user continues execution manually. Never merges or silently drops findings. |
| `audit-pr`      | the **PR**      | Read-first merge gate that **consumes the current `review-change` `REVIEW-PASS` receipt** (a missing/stale receipt is a blocker routed to `/review-change`, never re-reviewed) and evaluates only the delivery contract: phases/docs complete, CI, mergeability, traceability, capability closure, descope integrity, and the receipt's invariant/manual-check result → **MERGE-READY or evidenced blockers**, always with the full URL. MERGE-READY posts a dated SHA-bound PR comment; BLOCKED persists blockers to the shared fold ledger. It never edits or merges: only an active `ship-roadmap --fullauto` stage may consume its verdict and invoke the transient wrapper. |
| `product-audit` | the **product** | Explicit-invocation-only, periodic full-spectrum health check persisted as `docs/audits/<id>-<date>.md`; mines code and feature history into severity-ranked findings plus issue/roadmap/tooling proposals, checks capability-inventory freshness and repeated scope export, and never auto-fixes. |
| `audit-docs`    | the **docs**    | Audits docs ↔ roadmap ↔ code ↔ fix index for drift                                                                                                                                             |

`review-change` and `audit-pr` also evaluate the optional project
`ARCHITECTURAL_INVARIANTS.md` document: every applicable rule needs repository
evidence that the change preserves it, or an explicit architectural decision.
Projects that do not declare the document remain compatible.

> `review-change`'s findings engine is the internal `review-implementation` — the
> two-phase find → classify pass it composes (and `audit-pr` / `product-audit`
> reuse) — plus the internal review pack: one `review-*` skill per axis, each a
> fixed checklist returning a findings table + PASS|FAIL. None are menu entries;
> you reach them through `review-change`.

### Decide

| Skill          | What it does                                                                                               |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| `triage-issue` | Classifies an issue (fix-now / fix-in-unit / promote / postpone / wontfix) by **verifying its trigger against the code**; a scope-membership check (before classification) routes an issue that already belongs to an open unit onto that unit's own branch (`fix-in-unit`), never a new standalone unit; on fix-now + high severity, applies the injection-safe `urgent`/`fix-next` label it owns; on postpone/promote/wontfix, applies the matching disposition label it owns (`postponed`/`promoted`/`wontfix`); also triages persisted `product-audit` findings and unresolved review findings via `--prioritize-now`, routing oversized work to a plan with new phases |

### Document

| Skill           | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generate-docs` | Turns a unit's diff into **developer documentation on the project's own docs site** — incremental how-to guides through a discovered adapter (Starlight MDX first-class, plain markdown fallback), a **knowledge/call map** rendered from a project-declared deterministic command (the model never infers graph edges), and opt-in `--review` export of review reports. Provenance frontmatter lets `audit-docs` catch orphan/stale pages; never scaffolds a site, never edits code. |

### Session

| Skill         | What it does                                                                                                                                                                                                                                                                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `log-session` | Appends a structured entry to `docs/LOGS.md` — what the session did, files touched, decisions + _why_, and the next step — so you (or anyone) can resume cold. Run it before `/clear` or before closing. The `template/` also ships **free, opt-in hooks** that auto-append a mechanical entry on `/clear`/exit and can re-inject the last entry on start. |
| `workflow-status` | **Read-only sensor for programmatic orchestration.** Computes the full project state — every feature/fix with its transitive dependency closure (met/unmet), the roadmap's five-state machine (`idea`/`defined`/`planned`/`in-progress`/`done`), what is startable right now (status ≥ `defined`, deps met) and in which build order, `idea` rows reported separately as design candidates, open PRs + audit state, pending fixes and findings awaiting triage, the untriaged open-issue backlog (`detail.untriaged_issues`, label-authoritative with a `VERDICT:`-comment legacy fallback), each unit's unfolded fix-now findings from its `review-findings.md` ledger as structured `findings.fix_now[]` items carrying a derived `suggested_tier`, plus the injection-safe `detail.urgent` field (labels-only `urgent`/`fix-next` issues + in-flight interruptibility facts) and, per unit, `review` (last-reviewed sha, unreviewed diff, terminal-review/adversarial evidence), `closure.state`, and `issues_born` (descope-amendment provenance) — and emits it as one fixed JSON machine envelope, with a top-level `next.suggested[]` of trigger-attributed suggestions single-sourced from each owning skill's own condition, self-checked against the bundled schema and a fixed command→tier map before printing. With `--last-envelope`, a **no-progress guard** flags a stalled `/plan-feature`/`/design-feature` hint (unit still at its pre-advance status) as a `workflow_observations` note instead of silently repeating it. The piece an external driver calls between steps (see [Programmatic orchestration](#programmatic-orchestration)). Never edits anything. |

### Repo maintenance

| Skill        | What it does                                                                                                                                                                                                                                                                                                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bump-skill` | After editing a skill in this repo: bumps `version:` in the SKILL.md frontmatter, adds rows to CHANGELOG.md + CHANGELOG.es.md, and updates the skill and model tables in README.md + README.es.md. Also **lints the repo's authoring rules** (every skill closes with a `→ Next:` block; phases are `P1, P2, …`, never `S1`/"Steps") and the **machine-surface registration rules** (every `user-invocable: true` skill has a matching entry in `.claude-plugin/plugin.json`; that array and `model-routing.yml`'s keys stay alphabetical; any skill that's both `user-invocable: false` and absent from `plugin.json` — repo-internal, meaningless to a consumer — carries `metadata.internal: true`, the `skills` CLI's own mechanism for staying out of `npx skills add` discovery). Run before every commit that touches a skill. |

### Autopilot — the whole flow, end to end

| Skill          | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ship-roadmap` | **Builds the whole app from the roadmap.** One locked founding interview becomes batch design; a driver loop designs, plans, executes, reviews, opens, and audits one unit per iteration, then sweeps issues and writes the final report. Default: opens PRs, you merge. `--fullauto` is the sole automated merge authority: after a fresh SHA-bound audit it calls the fail-closed transient wrapper, keeps direct merge commands blocked, cleans attempt state on every exit, and records each automerge with an idempotent PR comment. |

How the autopilot runs the workflow — one interview in, reviewed PRs out, and
you only step in to merge (amber):

```mermaid
flowchart LR
    I([Interview]):::you --> RM[Roadmap] --> D[Design] --> P[Plan]
    P --> X[Execute] --> RV[Review] --> PR[Open PR] --> A[Audit] --> M([Merge]):::you
    M -->|next feature| P
    M -.->|roadmap done| REP[Final report]
    classDef you fill:#f6c177,stroke:#8a5a00,color:#3a2406;
```

The same `plan → execute → review → audit → merge` path you'd run by hand — the
autopilot just moves you to its edges. Under `--fullauto`, `ship-roadmap` also
handles merges through the repository's transient wrapper, under non-negotiable
safety floors, and logs each one on its PR. The portable hooks are
defense-in-depth: direct merges and obvious secret dumps are blocked at the
agent boundary, while forge rulesets remain the real security boundary.

The review axes are **self-contained**: the bundled internal review pack covers
code, security, verify, debt, design, a11y, brand, perf and SEO on any agent.
Platform-specific extras (a framework skill, a stack linter) are optional —
`review-change` and `product-audit` run them **in addition** when installed,
never as a dependency. See `docs/workflow/RECOMMENDED_SKILLS.md`.

> **Upgrading from an older install?** See
> [`docs/workflow/MIGRATION.md`](docs/workflow/MIGRATION.md) — three skills were
> renamed, so re-add to update + delete the three old folders.
>
> **Versioning.** Each skill is versioned independently (`version:` in its
> frontmatter); changes are logged in [`CHANGELOG.md`](CHANGELOG.md). Upgrade an
> install with `npx skills update`.

## Recommended model & effort

**This section documents the `#claude` branch** —
`npx skills add gtrabanco/agentic-workflow#claude`. The **default branch**
(`main`, aliased as `#inheritance`) carries none of this: every skill simply
inherits whatever model and effort your agent session is already using, so
there's nothing to configure and nothing to go stale.

On the `#claude` branch, each skill **pre-sets its model and effort** in
frontmatter (table below), sourced from
[`docs/workflow/model-routing.yml`](docs/workflow/model-routing.yml). The
model uses a floating tier alias (`opus`/`sonnet`/`haiku`) that auto-updates to the
latest version — so it never goes stale. Both apply only for that skill's turn;
your session model/effort resume afterward. **You stay in control:** to change
them, edit `model-routing.yml` (the source CI reads to rebuild the `claude`
branch — never edit the `claude` branch's frontmatter directly, it's
force-pushed on every change to `main`).

**On agents other than Claude Code**, or on the default branch, these tiers
don't apply — and that's covered: every user-facing skill ships a
**Portability** section with explicit fallbacks (no slash menu → follow the
target `SKILL.md` in a fresh conversation; no model tiers → strongest model
for planning/review/audit, cheaper for execution; no `/loop`/subagents →
manual re-invocation guided by each skill's closing `→ Next:` block). The
workflow is the contract; per-skill tiers are a `#claude`-branch convenience.

| Skill            | Model tier | Effort | Why                                                                                                                                                                                      |
| ---------------- | ---------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init-workspace` | Opus       | high   | interview-driven project bootstrap + adaptation                                                                                                                                          |
| `discover-repository-state` | Sonnet     | medium | evidence collection and frozen repository-state snapshot                                                                                                                                 |
| `resolve-repository-state` | Opus       | high   | contradiction resolution and repository-state judgment                                                                                                                                  |
| `design-feature` | Opus       | high   | product-definition judgement: raw-idea interview + capability closure, composed by callers only at ≥ this tier                                                                          |
| `plan-feature`   | Opus       | high   | router + engineering planning: its internal scoping steps run **in its turn**, so the router must carry the effort (composed skills inherit the turn's effort)                           |
| `plan-fix`       | Opus       | high   | architect-level scoping + risk analysis                                                                                                                                                  |
| `execute-phase`  | Sonnet     | medium | mechanical implementation per SPEC — whole unit by default, fresh/compact phase transactions (Opus if logic is subtle)                                                                  |
| `review-change`  | Opus       | high   | platform-adaptive review orchestration + synthesis                                                                                                                                       |
| `fold-findings`  | Opus       | high   | never weaker than the review tier that produced the finding; a subtle logic/security finding earns its own strongest-available pass                                                     |
| `loop-review-fold` | Opus     | high   | simple persisted-state router for review, fold, and unresolved-finding triage                                                                                                           |
| `audit-pr`       | Opus       | high   | whole-PR merge-readiness judgement                                                                                                                                                       |
| `product-audit`  | Opus       | max    | product-wide multi-axis sweep + proposals (max effort for the widest context sweep)                                                                                                      |
| `audit-docs`     | Sonnet     | medium | mostly mechanical cross-document checks (Opus for deep audits)                                                                                                                           |
| `triage-issue`   | Opus       | high   | verify triggers against the code; judgement call                                                                                                                                         |
| `log-session`    | Sonnet     | medium | structured summarization, not judgement — deliberately the cheap tier, never Opus (the `.claude/` hooks do the mechanical capture for free)                                              |
| `workflow-status`| Sonnet     | medium | mechanical state reading + dependency-closure computation — a sensor, never judgment                                                                                                     |
| `generate-docs`  | Sonnet     | medium | structured summarization of a diff into guide pages; the graph is tool-generated, never model-inferred (Opus never needed)                                                               |
| `ship-roadmap`   | Opus       | high   | the autopilot conductor: composes the planning/review/audit skills in-turn (equal tier) and delegates implementation to Sonnet subagents — judgment stays strong, bulk tokens stay cheap |

> The internal skills aren't selected directly. Because they're composed
> **within a caller's turn**, they inherit that turn's model/effort (a skill's
> `model`/`effort` is fixed at turn start) — the values in their frontmatter
> (`review-implementation`, `plan-feature-from-issue`, `review-code`,
> `review-security` high; `plan-feature-scaffold` and the rest of the review
> pack medium) are declared defaults for a direct run, which is why the
> `plan-feature` and `review-change` orchestrators themselves carry `high`.
>
> Rule of thumb: **planning, judgement, review and audit → Opus** (high, or max for
> the product-wide sweep); **mechanical execution → Sonnet, medium** (bump to Opus
> when the logic is subtle).

### Model equivalence (non-Claude / free-inference models)

The Claude tiers above (the `#claude` branch) set a reference bar, but nothing
in the workflow depends on them — the skills are model-agnostic by design
(that's the point of the default branch). If you're on the default branch,
this table is just a mental-model guide for which "kind" of model to point
each skill at yourself; if you installed `#claude` anyway and want to swap
its pinned tiers for a different vendor, edit `docs/workflow/model-routing.yml`
accordingly:

| Claude default | Capability class | Use it for |
|---|---|---|
| Opus + `high`/`max` | **Frontier reasoning** — the strongest model you have, reasoning/thinking mode on | planning, review, audit, triage, the merge gate |
| Sonnet + `medium` | **Mid workhorse** — a solid coding model at default settings | mechanical execution per SPEC, doc checks, session logs |
| Haiku | **Small & cheap** — any fast lightweight model | optional grep-shaped evidence gathering |

**Concrete picks** (open-weight, as of **July 2026** — this landscape moves
fast; sanity-check against a current leaderboard before pinning):

- **Frontier reasoning** (⇔ Opus + `high`/`max`): **DeepSeek V4** (tops
  LiveCodeBench/Codeforces among open models), **Kimi K2.6** (strongest for
  agentic/repo-level coding and tool use), **GLM-5.x / GLM-4.7 Thinking**,
  **Qwen3 235B-A22B** — run in reasoning/thinking mode. Closed non-Claude
  equivalents: the top GPT / Gemini reasoning tier.
- **Mid workhorse** (⇔ Sonnet + `medium`): **DeepSeek V3.2** (the value pick
  via API), **Qwen3-Coder / Qwen3 32B**, **GLM-5.1**, or any of the frontier
  picks with reasoning mode off.
- **Small & cheap** (⇔ Haiku): **Qwen3 4–14B**, **Mistral Small 3.1**,
  **Gemma 3 27B**, **Phi-4-mini** — local-friendly, fine for grep-shaped work.

### Running the whole flow on a small/cheap fleet

The skills are hardened for small executor models (modest context windows, no
prompt caching): frozen acceptance, fixed checklists instead of judgment calls,
Phase-lint and Spec-lint gates, compact phase receipts, bounded repair loops,
and reviews isolated per axis returning findings tables only. On a fleet with no
frontier-class model at all:

- **Execution** (`execute-phase`, `log-session`, doc bookkeeping) is designed
  for the cheapest tier — one fresh worker context per phase, compact handoff
  via `progress.md`, at most 10 full-file reads per phase. The outer invocation
  continues through every remaining phase unless an explicit `P<n>` is passed.
- **Planning, review, and audit** (`design-feature`, `plan-feature`,
  `plan-fix`, `review-change`, `audit-pr`, `product-audit`) still get the
  **strongest model you have**, even if that model isn't frontier-class —
  and never one weaker than the model that wrote the change.
- **Reviews**: keep the per-axis isolation default (each pass a fresh
  context, table-only return) and prefer `--adversarial 2` on `L` or
  sensitive changes — N cheap, decorrelated reviewers recover part of what a
  single small reviewer misses.
- **Split more.** The mandatory-split rule (≤ ~5 phases, one layer per
  phase) is the main lever: smaller phases are what make cheap execution
  reliable. When in doubt, cut smaller.

#### <img src="docs/assets/nan-cloud.svg" alt="NaN Cloud logo" width="20" height="19"> Running on [NaN.builders](https://cloud.nan.builders/r/7GK06FX8)

[NaN Cloud](https://cloud.nan.builders/r/7GK06FX8) serves the open-weight
frontier ([full catalog](https://nan.builders/docs/models): GLM-5.2 ~753B MoE ·
Mimo V2.5 310B · DeepSeek V4 Flash 284B · Qwen3.6 35B · Gemma4 26B) behind an
OpenAI-compatible API (`https://api.nan.builders/v1`). Reasoning control is
**per-model, not a uniform dial** — see the matrix below for how each model
maps onto this workflow's `effort:` tiers. Sign up via
[this referral link](https://cloud.nan.builders/r/7GK06FX8).

**Two profiles, not one primary.** GLM-5.2 is no longer available on the
basic plan — it's the **€200-plan** primary (practically unlimited there;
caps only bite very heavy use). On the **basic plan** it's simply
unavailable, so the picks below split into an €200-plan column and a
basic-plan ladder.

> **Verify your catalog first.** The public API reference's `/v1/models`
> listing names only `deepseek-v4-flash`, `mimo-v2.5`, `qwen3.6` and `gemma4`
> for chat — GLM-5.2 does not appear in it. Run `GET /v1/models` with your own
> key and route only to models it actually returns; treat the €200-plan column
> below as conditional on that check.

**Quota-aware routing rule.** Per the catalog, only **Mimo V2.5** and
**DeepSeek V4 Flash** carry an explicit cap (500M tok/member/mo); **Qwen3.6**
and **Gemma4** show no listed cap (256K ctx — "no cap listed" is treated as
*unconfirmed*, never asserted as unlimited). Reserve the two capped 500M
budgets for 1M-context work and merge-gating verdicts; push re-checkable and
mechanical volume onto the uncapped models instead.

**Reasoning control per model** (per the API reference) — map this workflow's
`effort:` values through this matrix instead of assuming a shared dial:

| Model | Control | Default | `effort:` mapping |
|---|---|---|---|
| **DeepSeek V4 Flash** | `reasoning_effort: low\|medium\|high` — top-level body field, not `extra_body` | `medium` | `low`/`medium`/`high` → literal; `xhigh`/`max` → `high` |
| **Qwen3.6** | boolean `chat_template_kwargs.enable_thinking` | ON | `low` → thinking off; `medium` and above → on |
| **Gemma4** | boolean `chat_template_kwargs.enable_thinking` | OFF | `high` and above → thinking on; else off |
| **Mimo V2.5** | none — reasoning always on, not controllable via API | ON | no mapping: every request pays reasoning tokens; leave `max_tokens` headroom (docs: ≥300 absolute minimum) |

**Tool calling is only validated on Qwen3.6.** The API reference marks
OpenAI-style function calling as specifically validated on `qwen3.6`, says to
test the rest before depending on tools in production, and documents Gemma4's
tool calling in an XML format — not the OpenAI `tools` schema agent harnesses
send. So the executor path (`execute-phase`, anything that reads/edits files
through tools) defaults to Qwen3.6; run the tool-calling smoke test in
[`docs/workflow/GOLDEN_FIXTURE.md`](docs/workflow/GOLDEN_FIXTURE.md) before
promoting any other NaN model into that path.

**Preference ladders per task** (2–3 deep on the basic plan; the €200-plan
column assumes GLM-5.2 is confirmed in your own catalog via `GET /v1/models`
per the caveat above — unconfirmed → treat that column as historical and use
the basic-plan ladder):

| Task | Skills | €200 plan (if GLM-5.2 confirmed) | Basic-plan ladder | Never here |
|---|---|---|---|---|
| **Merge gates** | `audit-pr`, `product-audit` | GLM-5.2, Thinking on, High (Max for `product-audit`) | 1. **Mimo V2.5** (reasoning always on) → 2. **DeepSeek V4 Flash** (`reasoning_effort: high`, floor) → else **defer to the human** | Qwen3.6, Gemma4 |
| **Product definition** | `design-feature` | GLM-5.2, Thinking on, High | 1. **Mimo V2.5** (reasoning always on; different family from the Qwen executor adds independence) → 2. **Qwen3.6** (thinking ON — only for XS/S or derivative features, quota-saver) → 3. **DeepSeek V4 Flash** (`reasoning_effort: high`) | Gemma4; Qwen3.6 thinking OFF |
| **Planning / routing / triage** | `plan-feature`, `plan-fix`, `init-workspace`, `triage-issue`, `review-change`, `ship-roadmap` conductor | GLM-5.2, Thinking on, High | 1. **Qwen3.6** (quota-saver) → 2. **Mimo V2.5** → 3. **DeepSeek V4 Flash** | — |
| **Execution / mechanical** | `execute-phase`, `audit-docs`, `bump-skill`, `workflow-status` | Qwen3.6, Thinking off, Medium | 1. **Qwen3.6** → 2. **DeepSeek V4 Flash** (`reasoning_effort: low`) → 3. **Gemma4** only after it passes the tool-calling smoke test | Mimo V2.5 (reasoning can't be turned off — burns its capped budget) |
| **Cheap** | `log-session`, evidence gathering | DeepSeek V4 Flash, `reasoning_effort: low` | 1. **DeepSeek V4 Flash** (`reasoning_effort: low`) → 2. **Qwen3.6** (thinking off) → 3. **Gemma4** (non-agentic steps only, or after the tools smoke test) | Mimo V2.5 |
| **Folding `review-change`/`audit-pr` findings** | `fold-findings` (primary); `execute-phase`'s embedded fold cycle (in-context/portability fallback) | per finding (see below) | **routine/mechanical** finding (style, missing test stub, stale doc) → same as Execution/mechanical; **subtle** finding (logic, security, architecture) → bump to the tier that found it (Merge-gates or Planning/routing ladder, whichever review ran) | — |
| **Adversarial review (`review-change --adversarial N` / `--synthesize`)** | `review-change` | GLM-5.2 × N, Thinking on, High | reviewers never weaker than the model that authored the diff; worked example: Qwen3.6-authored change → `--adversarial 2` with **Mimo V2.5** + **DeepSeek V4 Flash** (`reasoning_effort: high`) — two families neither of which is the Qwen executor, free decorrelation already sitting in this fleet; the orchestrating/merge conversation runs per the Planning/routing ladder (Qwen3.6 thinking ON is compliant there) | a reviewer weaker than the authoring model |

The folding row routes through the standalone `fold-findings` skill, falling
back to `execute-phase`'s embedded fold cycle only where a separate
invocation isn't available; it supersedes the old single-model "Alternates"
line (which only named GLM-5.2 for subtle-logic bumps). Rule of thumb: the fixing model
is never weaker than the one that wrote the original code, and never weaker
than the finding's subtlety warrants — otherwise the fix itself needs
re-catching on re-review, wasting a cycle.

**Why the adversarial row pays for itself on this fleet specifically:** the
mode's recommendation checklist fires whenever the reviewing model isn't the
fleet's strongest or is weaker than the author — on the basic-plan ladder that
is the common case (Qwen3.6 executes most units). Because the fleet already
has four distinct model families, spawning `N=2` reviewers from families other
than the author's is close to free decorrelation, not an extra purchase — the
quota was already reserved for Merge-gates-class work.

**Why `design-feature` sits in the merge-gate class, not the cheap tier:**
its output — the SPEC's product half plus capability closure — is the
**founding assumptions** the rest of the flow builds on, so an error there
compounds through plan → execute → review, the same blast radius as a
merge-gate verdict. Mimo V2.5's always-on reasoning is the right spend for it
(few invocations, high leverage) — unlike mechanical volume, where the same
always-on reasoning burns quota for no benefit. Qwen3.6 with thinking on is
acceptable only as rung 2, and only for XS/S or derivative features: the
raw-idea interview keeps a human in the loop, and `plan-feature`'s
capability-closure gate re-checks the output downstream (the same
re-checked-reasoning caveat below). As with every model choice here,
sanity-check availability against `GET /v1/models` before pinning.

**`Qwen3.6` reasoning caveat, stated explicitly:** acceptable only for
**re-checked** reasoning (planning/routing/triage output that review or audit
verifies downstream) — never a merge-gating verdict (3B active parameters → a
plausible-but-shallow audit is worse than none). On the basic plan, once the
Mimo V2.5 + DeepSeek V4 Flash quota is spent, no strong reasoner remains →
defer to the human, wait for the quota reset, or upgrade to the €200 plan.

**Per-model pros/cons:**

| Model | Size | Context | Basic-plan quota | Good for | Avoid for |
|---|---|---|---|---|---|
| **GLM-5.2** | ~753B MoE | — | Unavailable on the basic plan (€200-plan only, practically unlimited there); not in the public API catalog — confirm via `GET /v1/models` | Every judgment slot, when available | — |
| **Mimo V2.5** | 310B, reasoning always on | 1M ctx | 500M tok/member/mo | Merge gates + long-context work; a different family from Qwen3.6, so it adds reviewer independence | Mechanical/low-effort volume — reasoning can't be turned off, so every cheap task burns the capped budget; tools unvalidated |
| **DeepSeek V4 Flash** | 284B total · 21B active | 1M ctx | 500M tok/member/mo | Cheap/mechanical volume at `reasoning_effort: low`; the only NaN model with a graduated effort dial; last-resort planning/triage floor when 1–2 above are spent | Any verdict that gates a merge |
| **Qwen3.6** | 35B | 256K ctx | no cap listed | The only NaN model with validated OpenAI tool calling → default agentic executor; MTP speculative decoding ≈2× throughput; planning/routing/triage (re-checked downstream) | Merge-gating verdicts; reviewing code it wrote itself |
| **Gemma4** | 26B | 256K ctx | no cap listed | Small non-agentic tier (single-shot text/vision) | Any judgment call; agentic tool loops until it passes the tools smoke test (XML-format tool calling) |

**Operational limits per API key** (from the API reference): 60 requests/min,
**5 concurrent requests max**, 1.5M tokens/min per chat model. Cap any
subagent/review fan-out (`ship-roadmap` parallelism, the `review-change`
pack) at ≤5 concurrent — 3–4 in practice, leaving headroom for the
conductor — and remember an agentic loop spends one request per tool
round-trip, so several agents in parallel hit 60 rpm quickly.

Whisper, Kokoro, Rerank, Qwen3 Embedding and Flux 2 Klein are
audio/retrieval/image models — not used by the workflow. Model strength above
is framed by active-params + role, not benchmark numbers — sanity-check
against a current leaderboard before pinning; this landscape moves fast.

**Already on the default branch (or `#inheritance`)?** No pinning to remove —
that's the point. Every skill already **inherits your session's model and
effort**; the plain install command gives you this:

```sh
npx skills add gtrabanco/agentic-workflow
```

**Want the Claude-tuned tiers pinned per skill instead?** Install `#claude`
(see the breaking-change note near the top of this README):

```sh
npx skills add gtrabanco/agentic-workflow#claude
```

`effort:` maps to your model's reasoning/thinking budget (`high` → maximum
reasoning; `medium` → default; no such control → just honor the strong/cheap
split above). Two invariants survive any mapping: **never review a change with a
model weaker than the one that wrote it — and prefer a different model family
than the writer's** (same-family instances share training blind spots,
cross-family decorrelates errors), and **audit verdicts (the merge gate)
get the strongest model you have**. Expect weaker models to follow the workflow
correctly — the skills are written as checklists and fixed output formats — but
produce shallower judgment; the discipline holds, the ceiling moves.

## Programmatic orchestration

The skills read cleanly in interactive chat — no trailing JSON. A driver that
wants to orchestrate them (a shell loop, CI, your own program) injects the
canonical **system-prompt snippet** so each invocation ends with a **machine
envelope** — one fixed, fenced JSON block (state, unit, phase, PR, findings,
blockers, dependency build order, recommended next command + model-tier
hint) — and runs a **repair loop** when a turn omits it (re-ask with a
one-line prompt; one retry, then a driver-level failure). On providers with
strict structured outputs (`response_format: {type: "json_schema", strict}` —
on NaN: `qwen3.6` and `gemma4`), prefer forcing the envelope by passing the
npm package's `envelope.schema.json` as the response format on the final
envelope turn; keep the repair loop as the fallback for models without it.
The driver then
parses the envelope and invokes the next skill on the model you choose per
step. This is the vendor-neutral replacement for Claude Code's `/loop` and
subagents: the same loop `ship-roadmap` runs in-agent, hosted outside any
agent. `workflow-status` is the one skill that still emits the envelope
inline — it's a read-only sensor reporting the full dependency tree and
what's startable, so emitting it is its whole job. Protocol, snippet, repair
loop, state machine, and a driver skeleton:
**[`docs/workflow/ORCHESTRATION.md`](docs/workflow/ORCHESTRATION.md)**. For
JS/TS drivers, **[`@gtrabanco/agentic-workflow-schema`](packages/agentic-workflow-schema/)**
(npm) ships the types, the JSON Schema, and `parseEnvelope()` implementing the
parse contract — auto-published by CI on every schema change.

## How to use them

Full tutorial in **[`docs/workflow/`](docs/workflow/README.md)**. In short:

### Build a feature

```
/plan-feature "<your idea>"     # or  /plan-feature <N> (issue)  ·  /plan-feature --next (next roadmap item)
        → router detects idea / issue / scoped slug → interview · issue analysis · scaffold
        → fills the SPEC + PLAN + TASKS + … and registers the roadmap entry
/execute-phase <NN>             # all remaining phases; fresh worker + bounded repairs per phase
        → a finished unit always opens its PR + flips to `done` (built, not merged)
/loop-review-fold <NN>          # review → fold → review; unresolved findings go to triage/replan
/audit-pr                       # merge gate: merge-ready or blockers (never merge with pending docs)
        → human merges
```

See **[`docs/workflow/FEATURE_WORKFLOW.md`](docs/workflow/FEATURE_WORKFLOW.md)**.

### Handle an issue

```
/triage-issue <N>
   → reads the issue's "when to fix" trigger, verifies it against the current code
   → fix-now     → plan-fix → execute-phase --fix
     fix-in-unit → resolve on the open unit's own branch (execute-phase / fold-findings / replan)
     promote     → plan-feature   (the router takes the issue → scoped SPEC)
     postpone    → dated comment, leave open (no inline work)
     wontfix     → propose close
```

See **[`docs/workflow/ISSUE_WORKFLOW.md`](docs/workflow/ISSUE_WORKFLOW.md)**.

### Review, audit & classify

```
/review-change                  # runs the right reviews per platform + classifies → one table + manual checks
/audit-pr                       # is THIS PR ready to merge?  merge-ready or blockers
/product-audit                  # where does the whole product stand?  issues + roadmap proposals
/audit-docs                     # did the docs drift from code / roadmap?
```

See **[`docs/workflow/REVIEW_AND_CLASSIFY.md`](docs/workflow/REVIEW_AND_CLASSIFY.md)**.

### Build the whole app (autopilot)

```
/ship-roadmap                   # ONE interview (product, features, stack, architecture, autonomy, budget)
        → founds the project if needed, writes the complete roadmap, locks the run policy
/loop /ship-roadmap --continue  # the loop ships the roadmap feature by feature (add --fullauto to auto-merge)
        → plan → execute → review → PR → audit → (your merge) → next feature → … → final report
```

You only reappear at the merges (default) and at the final report.

### Resume across sessions

```
/log-session                    # before /clear or closing: append what you did + the next step to docs/LOGS.md
```

The `template/` ships free, opt-in Claude Code hooks (`template/.claude/`) that
auto-append a mechanical entry on every `/clear` and exit, and can re-inject the
last entry on start so you resume cold — no model, no token cost for the capture.

## Core principles

1. **Docs drive the work** — every skill reads the project's guide, doc map,
   architecture, roadmap and style docs first, and respects them.
2. **Plan before code** — features get a SPEC + artifacts before a line is written.
3. **One phase at a time** — each verified and committed separately.
4. **One PR per unit, against the default branch** — never on `main`, never stacked.
5. **Evidence over reflex** — triage verifies triggers; deferred work is tracked, not inlined.
6. **Gate before commit** — type-check + tests + build green.

## Install

Use the [`skills`](https://github.com/vercel-labs/skills) CLI — it reads the
`SKILL.md` files straight from this repo and installs them into whatever agent
you use (it auto-detects Claude Code, Cursor, Codex, OpenCode, Cline, and
[70+ more](https://skills.sh)).

```sh
# From the root of the TARGET repository — install all the skills.
# Default branch: model-agnostic, every skill inherits YOUR session's model
# and effort. On Claude Code and want the hand-tuned per-skill tiers this
# project shipped by default before v3? Add #claude — see the breaking-change
# note above.
npx skills add gtrabanco/agentic-workflow
npx skills add gtrabanco/agentic-workflow#claude          # Claude-optimized tiers

# Pick specific skills, or target a specific agent:
npx skills add gtrabanco/agentic-workflow --skill plan-feature --skill triage-issue
npx skills add gtrabanco/agentic-workflow --agent claude-code --agent cursor

# Install for the current user (global) instead of the current project:
npx skills add gtrabanco/agentic-workflow --global

# Manage them later:
npx skills list
npx skills update
npx skills remove plan-feature

# Already pinned #inheritance before v3? It still works — kept as an exact
# alias of the (now model-agnostic) default branch:
npx skills add gtrabanco/agentic-workflow#inheritance

# Pin a version: install from a tagged release (or any tag/branch) with #<ref>:
npx skills add gtrabanco/agentic-workflow#release-2026-07-02
#   …then `npx skills experimental_install` restores the exact set from skills-lock.json.
#   See CHANGELOG.md → "Installing & pinning a version" for how pinning works.
```

## Uninstall

To remove the complete `agentic-workflow` install from the current project
without selecting skills interactively, pass all published skill names to one
`remove` command:

```sh
npx skills remove --yes \
  audit-docs audit-pr design-feature discover-repository-state execute-phase \
  fold-findings generate-docs init-workspace log-session loop-review-fold \
  orchestration-envelope phase-contract plan-feature plan-feature-from-issue \
  plan-feature-scaffold plan-fix planning-preflight product-audit \
  resolve-repository-state review-a11y review-brand review-change review-code \
  review-debt review-design review-implementation review-perf review-security \
  review-seo review-verify ship-roadmap triage-issue verification-contract \
  workflow-status plan-feature-interview bump-skill
```

Use the same command with `--global` to remove the global installation. The
command targets only these `agentic-workflow` names; unrelated skills remain
installed. The final two names are retired legacy entries included to clean
older lockfiles. Avoid `npx skills remove --all` unless you intend to remove
every skill installed in that scope.

For installations created before the retirement of `plan-feature-interview` or
the internal exclusion of `bump-skill`, the command above also clears their
legacy lock entries.

### Repairing an older install

`npx skills add` refreshes existing skills but does not prune retired names from
an existing `skills-lock.json`. If the installer reports a skill claimed in the
lockfile but missing on disk, remove the retired entries and reinstall:

```sh
npx skills remove --yes plan-feature-interview bump-skill
npx skills add gtrabanco/agentic-workflow
```

For a global installation, add `--global` to both commands. These names are not
published by the current pack: `plan-feature-interview` was an internal helper
installed by older releases before its logic moved to `design-feature`, and
`bump-skill` was later reclassified as repository-internal.

### Updating an existing install

`npx skills add …` / `npx skills update` only refreshes the **skills**
(behavior) — on a project that already has the documentation scaffold, run
this ordered path to bring the **substrate** (`CLAUDE.md` + `docs/`) forward
too:

1. Update the skills: `npx skills update` (or a fresh `npx skills add …`).
2. Read **[`docs/workflow/MIGRATION.md`](docs/workflow/MIGRATION.md)** — the
   dated rationale for what changed and why.
3. Run **`init-workspace`** — on a repo it recognizes as an existing
   agentic-workflow scaffold it enters **upgrade mode**: it diffs your
   substrate against the current `template/`, proposes only the blocks you're
   missing (discovery-defaulted, one short interview), and never rewrites a
   block you've already tailored.
4. Optionally run **`product-audit`** to see which newly-available
   *capabilities* (not just docs blocks) now apply to your code.

### Installing on Hermes Agent (desktop & terminal)

Hermes only scans **`~/.hermes/skills/`** (its "source of truth") plus any
`external_dirs` you add in `~/.hermes/config.yaml` — it does **not** scan the
project-scope paths the `skills` CLI writes by default (`./.hermes/skills/`,
`./.agents/skills/`). That's why a plain project install "isn't detected".
Desktop app and terminal share the same mechanism. Category subfolders
(`skills/devops/<skill>/`) are optional — flat `<skill>/SKILL.md` folders are
detected fine.

```sh
# Install (Hermes ignores model:/effort: anyway, so the default branch's
# model-agnostic skills — inheriting whatever model your Hermes session
# runs — are the right pick here, not #claude):
npx skills add gtrabanco/agentic-workflow --agent hermes-agent --global -y
#   → copies each skill to ~/.hermes/skills/<skill>/  ✔ detected by desktop & terminal

# Update later — re-run the add per agent, NOT `skills update`:
npx skills add gtrabanco/agentic-workflow --agent hermes-agent --global -y
npx skills add gtrabanco/agentic-workflow#claude --agent claude-code --global -y   # if you also install globally for Claude Code
#   Why: the global lockfile tracks ONE ref per skill name (last install wins),
#   so a blanket `skills update --global` can repoint every agent's copy to the
#   same ref — re-running each add refreshes each copy from its own ref.
#   Then start a NEW Hermes session (/reset in terminal, or restart the desktop
#   app) — skills load at session start; --now busts the prompt cache (extra tokens).
```

Per-project alternative: keep a project-local install and point Hermes at it in
`~/.hermes/config.yaml`:

```yaml
skills:
  external_dirs:
    - /path/to/your-project/.agents/skills
```

(Local `~/.hermes/skills/` wins on name collisions; missing dirs are silently
skipped.) Pick your session model per the [model-equivalence table](#model-equivalence-non-claude--free-inference-models)
— on NaN.builders, per the picks above.

**Invoking:** in Hermes, `/<name>` loads **bundles**, not individual skills —
`/execute-phase` returns `error: not a quick/plugin/skill command` even when
the skill shows as enabled. Three working ways:

```sh
# 1. One-time: create a bundle → /workflow becomes the slash entry point
hermes bundles create workflow \
  -s init-workspace -s plan-feature -s plan-fix -s execute-phase \
  -s review-change -s audit-pr -s product-audit -s audit-docs \
  -s triage-issue -s log-session -s ship-roadmap \
  -d "agentic-workflow: plan → execute → review → audit → merge"
#    then, in any session:  /workflow execute-phase --fix #243

# 2. Terminal: preload skills for a session
hermes chat -s execute-phase

# 3. Any session, no setup: natural language — skills are matched by description
#    "use the execute-phase skill to implement fix #243"
```

No npm publish, no registry, no build step — `skills` clones the repo and copies
(or symlinks) the skill folders into the right place for each agent. The skills
**discover the target project at runtime** (agent guide, documentation map,
architecture, roadmap, fix index), so they work immediately without per-repo
configuration.

Prefer the skills **regenerated and re-tuned** to a different project's
conventions instead of copied verbatim? See the adaptive
**[portable prompt](docs/workflow/PORTABLE_PROMPT.md)**. Full details and the
"which method when" guide live in
**[`docs/workflow/REPLICATE.md`](docs/workflow/REPLICATE.md)**.

## Optional extra skills

The workflow needs **nothing beyond this repo** — the internal review pack covers
every review axis on any agent. `docs/workflow/RECOMMENDED_SKILLS.md` lists
**optional extras** that can sharpen specific axes when your agent has them
(e.g. `karpathy-guidelines`, `simplify`, the `engineering:*` set), and — crucially
— which ones to **skip** for a given project (e.g. design skills for a terminal
program, `claude-api` with no LLM features). Extras merge into the same review
tables; a missing extra is never a gap.

## Projects built with this workflow

| Project                                                     | Notes                                                                 |
| ----------------------------------------------------------- | --------------------------------------------------------------------- |
| [gtrabanco/ship-lab](https://github.com/gtrabanco/ship-lab) | json2csv CLI — built end-to-end with the `ship-roadmap` autopilot     |
| [gtrabanco/bingo-ev](https://github.com/gtrabanco/bingo-ev) | Started with vibecoding, migrated to the workflow once it was working |
