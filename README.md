<p align="center">
  <img src="docs/assets/logo.svg" alt="Agentic Workflow logo" width="120" height="120">
</p>

# Agentic Workflow Skills

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

> The model-agnostic install (`npx skills add gtrabanco/agentic-workflow`)
> carries no skill `model:`/`effort:` frontmatter — every skill simply
> **inherits whatever model and effort your agent session is already using**.
> The goal: using this workflow should never lock you into one vendor's model lineup — you pick the model, the skills just run the discipline.

## What's inside

```
skills/                  29 source skills (14 user-facing + 14 workflow internals + 1 metadata-internal; 28 discoverable — skill-lint is repo-only)
packages/                four companion npm packages: @gtrabanco/agentic-workflow (the runner crate —
                         `agentic-workflow <unit-doc|roadmap|changelog|budgets|manifest|doc|section|relay|memory|log>`, typed file
                         services, guards and the `doc` retrieval index), @gtrabanco/agentic-workflow-schema
                         (machine contracts), @gtrabanco/pi-agentic-workflow (one-command install for Pi —
                         see Install) and @gtrabanco/pi-nan-agentic-workflow (the optional NaN.builders
                         preset: provider profile, model ladder, quota-tier routing)
scripts/                 the deterministic gates, sensors and generators, each with its sibling *.test.mjs
template/                 the exportable documentation scaffold (the substrate the skills read)
docs/workflow/           the full tutorial (feature flow, issue flow, reference, replication)
docs/ROADMAP.md           the single Features+Fixes index (the planning artifacts skills produce)
docs/features/_TEMPLATE  feature SPEC template
docs/fix/                fix SPEC template (the active-fixes index lives in docs/ROADMAP.md)
.github/                 issue + PR templates the workflow expects
```

The runner crate ships the **`doc` retrieval index** (feature 65, hardened by
issue #443): one gitignored SQLite store under `.agentic-workflow/index/` that
answers `agentic-workflow doc --query <term>` over FTS5 keyword search plus an
optional OpenAI-compatible embeddings endpoint (`AGENTIC_WORKFLOW_DOC_EMBEDDINGS_*`).
The mode is resolved **at query time** — hybrid when a provider is configured and
the store holds vectors under the pinned model, keyword with the declared cause
otherwise, and an explicit `--mode` always wins — so the vectors the sync pays for
are the ones the query uses. `doc --sync` embeds the pending chunks with pacing,
retry/backoff and a resume point, and the pi package's native `/aw-index` command
runs that sync and prints its report (pending chunks, pinned model, last sync,
degradations). It is a **discovery aid, never authority**: no gate or decision
reads it. Positional document operations (`doc read|edit|index`) are unit `71`,
still `defined` — the CLI refuses them by name and only accepts the four
retrieval flags.

**Dogfooding model (authoring):** repo sessions consume the workflow from the
installed release (Pi package / installed plugin), not from the working copy.
The committed layout carries no working-copy activation surface. Authoring
sessions opt in by creating a local, gitignored mount
(`ln -sfn ../skills .claude/skills`) or by exercising a single working-copy
skill via per-session flags (e.g. `pi --no-skills --skill skills/<name>/SKILL.md`).

The skills are the **behavior**; `template/` is the **substrate** they read (a
generic `AGENTS.md` + documentation map, SPEC/feature/fix templates, and GitHub
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

**14 user-facing skills** (one menu entry each) + internal contracts composed
for you: the lane's triage-driven step selection (`unit-lane`), the executor
(`execute-phase`), the internal review pack (`review-code`, `review-security`,
`review-verify`, `review-debt`, `review-design`, `review-a11y`, `review-brand`,
`review-perf`, `review-seo`), the workflow's own pre-execution evidence owner
(`pre-execution-review`), the `orchestration-envelope` contract, and the repo-only
`skill-lint` maintenance helper (excluded from installation) — so **no external
review skill is ever required**, on any agent, with any model. One disciplined
path: **triage → catalog steps (design, implement, tests, evidence, review) →
review the change → audit → merge.**

> Every skill's invocation forms and flags (`--fix`, `--force`,
> `--adversarial N`, `--next`, `--fullauto`, …) are catalogued in the
> [Invocation & arguments reference](docs/workflow/SKILLS.md#invocation--arguments-reference).

### Setup

> Provisioning this repo's own authoring toolchain (bun, uv + serena-agent, engram, the `gentle-engram` pi package)? Run `node scripts/setup-env.mjs` — the full guide is [`docs/workflow/SETUP.md`](docs/workflow/SETUP.md).

| Skill            | What it does                                                                                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init-workspace` | Fetches and adapts `template/` by interview: gate, doc map, architecture, capability inventory, optional invariants, and injection-safe labels. It detects Claude Code, Cursor, Copilot, or OpenCode and offers the repository-scoped safety guard explicitly — never installs or overwrites hooks without consent. Existing scaffolds enter **upgrade mode** (additive: only missing blocks/adapters) which also reconciles and retires a legacy `CLAUDE.md` into `AGENTS.md`, and only with consent — a client that reads only the old name may keep it. Consent is mandatory and never defaulted: a consent gap runs the three-tier dispatch and stops with the `open-questions@1` block. Provision Serena end to end on **one** consent question: the tool (`uv tool install -p 3.13 serena-agent` + `serena init`, `pipx` on the MCP path only), the detected platform's MCP registration, the consent-gated append to the global `trusted_project_path_patterns`, and the project config — `.serena/project.yml` with fixed `markdown`+`json` entries plus detected languages (`typescript`, `python`, `yaml` when `.yml` present, etc.) and the `.gitignore` block. Then it reports exactly what it installed and registered, and enforces the startup rule (a failing server is dropped, never left dead; LSP evidence stays TypeScript/JavaScript-only). A refusal installs, registers and writes nothing. |
| `discover-repository-state` | Creates and freezes an evidence-backed repository-state ledger before planning or implementation; facts, decisions, documentation, planned work, and inference remain distinct |
| `resolve-repository-state` | Sole writer for an explicit repository-state contradiction; verifies the competing evidence and publishes the next frozen snapshot |

### Design & plan

| Skill        | What it does                                                                                                                                                                                                                                                                                                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `unit-lane`  | **One-shot lane conductor for a delivery unit** (the entry point for new work): opens or resumes `docs/features/<NN>-<slug>/SPEC.md`, runs a closed-catalog **triage** that picks the steps this unit actually needs (research, design, plan, implement, tests, evidence, review, docs, release) and runs them **inline, one step per turn**, cutting phases at plan time, then hands execution to `/execute-phase` **one phase per turn** and closes with the evidence, the context-clean review receipt and `/audit-pr`. With a pi-web session present the same hand-off can run as **Relay legs** — one fresh-context leg per phase plus a fresh-context coherence reviewer as the pre-PR gate, every packet checked offline by `bun scripts/relay-packet.mjs` and no receipt claimed before the PR exists; without pi-web the per-phase hand-off is unchanged. Deterministic guards (diff-size, path protection, scope) bite when a unit outgrows the light path, and a missing input stops it with the `open-questions@1` block instead of guessing. |

### Execute

| Skill           | What it does                                                                                                                                                                                                                                                                                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `execute-phase` | Executes **one phase per turn** (`<NN> P<k>`, tier attached) with its own acceptance-blob check, phase/invariant/dependency gates, tests, docs, and commit — the closing hand-off names the next single phase and the catalog tier, and resumes `unit-lane` after the last phase. Looping all remaining phases (`<NN>` with no phase) is an explicit operator choice only. Halts on red/no-progress/attempt budget. Discoveries become `Autofix`, `Opportunistic Fix`, or a proposal—never an automatic issue. Each phase's pre-flight runs `bun scripts/phase-lint.mjs <plan>` and pastes its output. The whole-unit close-out settles the roadmap row through the crate's writer (`bun scripts/roadmap-settle.mjs` exits 0, issue #316). It never interviews: a missing input runs the three-tier dispatch and then `scripts/needs-input.mjs` prints the `open-questions@1` block and the run stops, routed back to the stage that owns the fact. |

### Review & audit — _change → PR → product_

| Skill           | Scope           | What it does                                                                                                                                                                                   |
| --------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `review-change` | the **change**  | Runs only the reviews that **apply to your platform** (code, security, verify, design, a11y, brand, perf, SEO) — adversarially by default, assuming the diff is wrong until proven otherwise — and classifies → one decision table + an explicit manual-verification checklist; a dirty tree or unpushed commits stop the review as a `REVIEW BLOCKED` precondition before any pass runs — workspace state is never a persisted finding, and the review commits its own findings append so it never dirties the tree it next judges. The mandatory end review **must run in a conversation that did not implement the change** — if it did, stop and hand off to a fresh one. Opt-in `--adversarial N`: N independent context-clean reviewers, each an index-assigned role (correctness/security/SPEC-coverage), run in parallel (subagents / headless / sequential-fallback), findings merged by `file:line` at an inclusion threshold of ≥1. In that mode the pass **verifies instead of enumerating**: every candidate is arbitrated `kill | confirm` with falsifying or supporting evidence, a claim the diff does not ground is dropped by a diff-only reflector, and a reproducer that also fires on untouched adjacent code is re-scoped before it persists — `scripts/adversarial-verdict.mjs` checks the pass's record and prints what may persist. Default off, auto-recommended (never forced) when the change is `L`/sensitive, the reviewer isn't the fleet's strongest or is weaker than the diff's author, or only one model family is available on a `≥M` change. `--synthesize` is the standalone fusion entry point for manually-run reviewers. Fix-now findings on an unmerged unit persist to that unit's fix-now fold ledger — its `## Findings` section for a migrated unit, `review-findings.md` for a legacy one, probe-first and never both — deduped by `file:line`+axis (only `high`/`med` persist — `low` findings are report-only notes that never block). Classification honors the engine's **fix-now override checks**: a cheap fix or an in-scope defect is always fix-now (never a postpone/known-issue/tradeoff escape), and a too-large in-scope fix-now routes to `replan-in-unit` — user-confirmed SPEC phase(s) on the same branch, never a downgrade. Its **review charter**: try to dismantle the claim that what works, works and works well — in-scope bugs, security issues and guard skips are this review's own findings, expectations are asked about rather than inferred, and the repo-wide bug/security/broken-version hunt belongs to `product-audit` |
| `fold-findings` | the **findings ledger** | Repairs the full queue in the fewest compatible atomic batches, grouping by root cause/mechanical rule + validator + rollback boundary. One batch gets one commit, while every finding retains its ledger tick and output receipt. Classification stays frozen; disputes stop for a user decision and no fold creates backlog. A token- or claim-shaped change carries its `swept:` declaration, which `promise-coherence` re-runs. |
| `audit-pr`      | the **PR**      | Read-first merge gate that **consumes the current `review-change` `REVIEW-PASS` receipt** (a missing/stale receipt is a blocker routed to `/review-change`, never re-reviewed) and evaluates only the delivery contract: phases/docs complete, CI, mergeability, traceability, capability closure, descope integrity, and the receipt's invariant/manual-check result → **MERGE-READY or evidenced blockers**, always with the full URL. A stale-by-sha receipt that recorded a scope manifest stays current across a non-affecting head delta (session log, agent toolstate); any affecting-path delta still voids it (fix/286). The pre-execution lineage gate keys on the unit surface: lane-era units verify their pasted triage block by re-derivation and close obligations from the unit doc; legacy units keep the progress.md receipt path (fix/285). MERGE-READY posts a dated SHA-bound PR comment; BLOCKED persists blockers to the shared fold ledger. |
| `product-audit` | the **product** | Explicit-invocation-only, measured-trigger full-spectrum health check persisted as `docs/audits/<id>-<date>.md` — it fires on a drift signal, threshold debt, or an explicit owner request (`audit-trigger@1`), and an under-threshold invocation returns the `insufficient-corpus` verdict instead of inventing findings or figures; every dimension starts at its deterministic producer's receipt (never re-run by the model — only the non-mechanizable remainder is model-swept) and dimensions the project's ceremony profile does not declare are recorded `n/a` (#436, consumption-side); mines code and feature history into severity-ranked findings typed 1:1 with review's finding vocabulary (route cells are `finding-route@1` resolver hand-offs) plus issue/roadmap/tooling proposals, checks capability-inventory freshness and repeated scope export, gates every claim on evidence provenance and reports the delta vs the prior audit of equivalent scope, and never auto-fixes; it **owns the repo-wide open-ended bug hunt, security research and broken-version investigation** (scoped, sampled and budgeted per dimension) while `review-change` owns the same hunt against one change. |
| `audit-docs`    | the **docs**    | Audits docs ↔ READMEs ↔ roadmap ↔ code ↔ fix index for drift                                                        |

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

| Skill         | What it does                                                                                                                                                                                                                                                                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `log-session` | Writes a structured entry — what the session did, files touched, decisions + _why_, and the next step — so you (or anyone) can resume cold: appended to `docs/LOGS.md`, or written as one fragment under `.agentic-workflow/journal/` when the project opted in to the fragment carrier (#405). Run it before `/clear` or before closing. The `template/` also ships **free, opt-in hooks** that auto-append a mechanical entry on `/clear`/exit and can re-inject the last entry on start. |

### Session

> `log-session` belongs to this stage too; its entry sits under
> [Document](#document) so the same skill is never described twice.

| Skill         | What it does                                                                                                                                                                                                                                                                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workflow-status` | **Read-only sensor for programmatic orchestration.** Emits one fixed JSON machine envelope with the full project state — every feature/fix with its dependency closure, roadmap's five-state machine, what is startable and build order, open PRs + audit state, pending findings, the untriaged issue backlog, fix-now findings with derived `suggested_tier`, and the injection-safe `detail.urgent` field. Supports `--last-envelope` (no-progress guard) and `--compact` (drops proved-merged units and evidence memos, ~half the bytes). The resolved `next` command is projected into `next.continuation` with typed refusals at `detail.continuation_refusal`. Never edits anything. |
| `batch-scheduler` | **Read-only planner for parallel orchestration** (issues #449, #460): reads the live work graph (native `blocked-by` + prose soft deps, touched surfaces per issue, roadmap + unit docs in flight) and emits the fixed `batch-plan@2` machine envelope — batch 1 runnable now, batch N+1 next, one lane per surface with same-surface serialization, per-issue worktree + `/unit-lane --from-issue <N>` command + reason, measured size hints (facts, not a lane-count policy), untriaged rows and open cross-lane soft deps as declared signals, the lifecycle delta vs the previous plan (`new_issues[]`/`closed_since[]`), and cyclic/orphaned/mismatched spots as findings. Persists claimed lanes and the last-seen issue set to `.agentic-workflow/batches.json` so a re-run recognizes what launched and reports what changed (`--no-state` reads pure). Plans and reports only — never spawns, never creates worktrees. Works with no decision model configured. |

### Repo maintenance

| Skill        | What it does                                                                                                                                                                                                                                                                                                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `skill-lint` | After editing a SKILL.md or a reference beside one in this repo: runs the content checks (`bun scripts/skill-lint.mjs` — hidden comments, frontmatter tags, invisible codepoints, unpinned URLs, credential/exfiltration shapes, backslash paths, time-sensitive claims; rules in `references/CHECKS.md`), lints the authoring rules (every skill closes with a `→ Next:` block; phases are `P1, P2, …`, never `S1`/"Steps") and the machine-surface registration rules (every `user-invocable: true` skill has a matching alphabetical entry in `.claude-plugin/plugin.json`; internal skills carry `metadata.internal: true` to stay out of `npx skills add` discovery). Reports, never repairs — skills carry the unified train version, stamped by `scripts/release.mjs apply` at cut time (D-40-14), and a skill change ships via a `.changeset/` intent file. Was `bump-skill` (its per-skill bump ledger retired). Run before every commit that touches a skill. |

The review axes are **self-contained**: the bundled internal review pack covers
code, security, verify, debt, design, a11y, brand, perf and SEO on any agent.
Platform-specific extras (a framework skill, a stack linter) are optional —
`review-change` and `product-audit` run them **in addition** when installed,
never as a dependency. See `docs/workflow/RECOMMENDED_SKILLS.md`.

> **Upgrading from an older install?** See
> [`docs/workflow/MIGRATION.md`](docs/workflow/MIGRATION.md) — three skills were
> renamed, so re-add to update + delete the three old folders.
>
> **Versioning.** The skills and the four packages carry **one train version**
> (`version:` in its frontmatter, stamped by `scripts/release.mjs apply` at cut
> time — D-40-14); changes are logged in [`CHANGELOG.md`](CHANGELOG.md). Upgrade
> an install with `npx skills update`.

## Choosing a model

Every skill **inherits whatever model and effort your agent session is already
using** — no skill pins a tier, so there's nothing to configure and nothing to
go stale. Every user-facing skill also ships a **Portability** section with
explicit fallbacks for agents without a slash menu, model tiers, or
`/loop`/subagents (follow the target `SKILL.md` in a fresh conversation;
strongest model for planning/review/audit, cheaper for execution; manual
re-invocation guided by each skill's closing `→ Next:` block). The workflow is
the contract; the guidance below is for choosing your own models.

### Capability classes

The skills are model-agnostic by design: nothing in the workflow depends on a
specific vendor or tier. This table is a mental-model guide for which *kind* of
model to point each skill at:

| Capability class | Use it for |
|---|---|
| **Frontier reasoning** — the strongest model you have, reasoning/thinking mode on | planning, review, audit, triage, the merge gate |
| **Mid workhorse** — a solid coding model at default settings | mechanical execution per SPEC, doc checks, session logs |
| **Small & cheap** — any fast lightweight model | optional grep-shaped evidence gathering |

**Concrete picks** (open-weight, as of **July 2026** — this landscape moves
fast; sanity-check against a current leaderboard before pinning):

- **Frontier reasoning**: **DeepSeek V4** (tops
  LiveCodeBench/Codeforces among open models), **Kimi K2.6** (strongest for
  agentic/repo-level coding and tool use), **GLM-5.x / GLM-4.7 Thinking**,
  **Qwen3 235B-A22B** — run in reasoning/thinking mode. Closed non-Claude
  equivalents: the top GPT / Gemini reasoning tier.
- **Mid workhorse**: **DeepSeek V3.2** (the value pick
  via API), **Qwen3-Coder / Qwen3 32B**, **GLM-5.1**, or any of the frontier
  picks with reasoning mode off.
- **Small & cheap**: **Qwen3 4–14B**, **Mistral Small 3.1**,
  **Gemma 3 27B**, **Phi-4-mini** — local-friendly, fine for grep-shaped work.

### Running the whole flow on a small/cheap fleet

The skills are hardened for small executor models (modest context windows, no
prompt caching): frozen acceptance, fixed checklists instead of judgment calls,
Phase-lint and Spec-lint gates, compact phase receipts, bounded repair loops,
and reviews isolated per axis returning findings tables only. On a fleet with no
frontier-class model at all:

- **Execution** (`execute-phase`, `log-session`, doc bookkeeping) is designed
  for the cheapest tier — one fresh worker context per phase, compact handoff
  through the unit doc's own `## Tasks` and `## Log`, at most 10 full-file reads
  per phase. The outer invocation
  continues through every remaining phase unless an explicit `P<n>` is passed.
- **Planning, review, and audit** (`unit-lane`, `review-change`,
  `audit-pr`, `product-audit`) still get the
  **strongest model you have**, even if that model isn't frontier-class —
  and never one weaker than the model that wrote the change.
- **Reviews**: keep the per-axis isolation default (each pass a fresh
  context, table-only return) and prefer `--adversarial 2` on `L` or
  sensitive changes — N cheap, decorrelated reviewers recover part of what a
  single small reviewer misses.
- **Split more.** The mandatory-split rule (≤ ~5 phases, one layer per
  phase) is the main lever: smaller phases are what make cheap execution
  reliable. When in doubt, cut smaller.


**Installing.** Every skill
**inherits your session's model and effort** — the plain install command gives
you exactly that:

```sh
npx skills add gtrabanco/agentic-workflow
```

`effort:` maps to your model's reasoning/thinking budget (`high` → maximum
reasoning; `medium` → default; no such control → just honor the strong/cheap
split above). Two invariants hold under any mapping: **never review a change
with a model weaker than the one that wrote it — and prefer a different model
family than the writer's** (same-family instances share training blind spots,
cross-family decorrelates errors), and **audit verdicts (the merge gate) get
the strongest model you have**. Expect weaker models to follow the workflow
correctly — the skills are written as checklists and fixed output formats — but
produce shallower judgment; the discipline holds, the ceiling moves.

## Programmatic orchestration

Interactive skills stay text-first. A headless driver adds a compact machine
result only at the invocation boundary, parses it with
**[`@gtrabanco/agentic-workflow-schema`](packages/agentic-workflow-schema/)**,
and combines it with deterministic facts compiled from selected workflow
documents. `workflow-status` retains its full Envelope v2 sensor result;
other driven skills return the smaller SkillOutcome v1. The driver owns I/O,
sessions, authorization, and one bounded repair attempt; the package owns the
strict JSON Schemas, parsing, compatibility diagnostics, and
WorkflowSnapshot v1. See **[programmatic orchestration](docs/workflow/ORCHESTRATION.md)**
for the protocol and driver example.

**The delivery cycle itself is code** (unit 78): `node scripts/unit-cycle.mjs
<NN|slug>` runs one unit's whole cycle programmatically — design if
undesigned, plan if unplanned, each phase as its own `pi -p` session, tests,
evidence, docs, release, the context-clean review until its receipt is current,
folds within `--max-cycles` (default 2), and `audit-pr` — re-sensing the repo
after every act and stopping only for manual input or a closed terminal state
(exit 0 `done` · 2 `needs-input` with the verbatim `open-questions@1` block ·
3 `budget-exhausted` · 4 `no-progress` · 5 `failed`). Its control decisions are
pure functions proven offline by `scripts/unit-cycle.test.mjs`; skills stay
the step contracts the loop invokes, never the loop itself. `--dry-run` prints
the sensed state and the next action without spawning anything.

## How to use them

Full tutorial in **[`docs/workflow/`](docs/workflow/README.md)**. In short:

### Build a feature

```
# New unit: docs/features/NN-<slug>/SPEC.md (14 sections)
/unit-lane NN                      → triage picks the steps this unit needs; the lane runs them one per turn
                                   → execution is handed off one phase at a time: /execute-phase NN P<k>
                                   → a finished unit always opens its PR + flips to done (built, not merged)
/fold-findings → re-run /review-change  # manual review→fold; unresolved findings go to triage/replan
/audit-pr                          # merge gate: merge-ready or blockers (never merge with pending docs)
                                   → human merges
```

See **[`docs/workflow/FEATURE_WORKFLOW.md`](docs/workflow/FEATURE_WORKFLOW.md)**.

### Handle an issue

```
/triage-issue <N>
   → reads the issue's "when to fix" trigger, verifies it against the current code
   → fix-now     → lane fix mode → execute-phase --fix
     fix-in-unit → resolve on the open unit's own branch (execute-phase / fold-findings / replan)
     promote     → lane feature mode (triage → catalog steps)
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

### Resume across sessions

```
/log-session                    # before /clear or closing: log what you did + the next step (docs/LOGS.md, or a fragment when the carrier is on)
```

The `template/` ships free, opt-in Claude Code hooks (`template/.claude/`) that
auto-append a mechanical entry on every `/clear` and exit, and can re-inject the
last entry on start so you resume cold — no model, no token cost for the capture.

## Core principles

1. **Docs drive the work** — every skill reads the project's guide, doc map,
   architecture, roadmap and style docs first, and respects them.
2. **Plan before code, review before plan** — features get a SPEC + artifacts
   before a line is written, and the Product half and the Plan each need a current
   independent PASS before the next hop runs.
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
# Model-agnostic: every skill inherits YOUR session's model and effort.
npx skills add gtrabanco/agentic-workflow

# Pick specific skills, or target a specific agent:
npx skills add gtrabanco/agentic-workflow --skill unit-lane --skill triage-issue
npx skills add gtrabanco/agentic-workflow --agent claude-code --agent cursor

# Install for the current user (global) instead of the current project:
npx skills add gtrabanco/agentic-workflow --global

# Manage them later:
npx skills list
npx skills update
npx skills remove unit-lane

# Pin a version: install from a tagged release (or any tag/branch) with #<ref>:
npx skills add gtrabanco/agentic-workflow#release-2026-07-02
#   …then `npx skills experimental_install` restores the exact set from skills-lock.json.
#   See CHANGELOG.md → "Installing & pinning a version" for how pinning works.
```

### One-command install on Pi

On [Pi](https://github.com/badlogic/pi-mono) you don't need the skills CLI at
all — the method ships as a single npm package that bundles the same skills
together with everything the copy-per-agent route leaves out: a friendly slash
command for every public skill (`/unit-lane --next`, not
`/skill:unit-lane --next`), and optional per-command model routing that
sends each workflow command to the model you choose and gives your session
back afterwards.

```sh
pi install npm:@gtrabanco/pi-agentic-workflow
```

Restart Pi and run `/agentic-workflow-settings` once. Update and removal are
`pi update` / `pi remove` with the same package name. Details, model-routing
configuration, and troubleshooting live in
**[`packages/pi-agentic-workflow/README.md`](packages/pi-agentic-workflow/README.md)**.

### Channels: stable and canary

The package follows two npm dist-tags. `latest` is the stable train; `canary` is
the prerelease of the next train, cut for the packages that changed.

```sh
# Try the next prerelease
pi install npm:@gtrabanco/pi-agentic-workflow@canary
npx skills add gtrabanco/agentic-workflow#<the canary tag from its release page>

# Back to stable
pi install npm:@gtrabanco/pi-agentic-workflow@latest
npx skills add gtrabanco/agentic-workflow#stable
```

No uninstall is needed in either direction: `pi install` replaces the recorded
source of the same package instead of adding a second copy, and the skills CLI
keeps one ref per skill name (the last `add` wins). `pi update --extensions`
then follows whichever tag is recorded. The `@canary` dist-tag is repointed at
every stable cut, so an install left on `@canary` lands on the stable version at
the next one; a skills install pinned to a `#v…` tag is frozen and follows the
branch only after the `#stable` re-add. Every release page repeats these
commands for its own channel.

## Uninstall

To remove the complete `agentic-workflow` install from the current project
without selecting skills interactively, pass all published skill names to one
`remove` command:

```sh
npx skills remove --yes \
  audit-docs audit-pr skill-lint discover-repository-state \
  execute-phase fold-findings init-workspace log-session \
  orchestration-envelope phase-contract product-audit \
  resolve-repository-state review-a11y review-brand review-change review-code \
  review-debt review-design review-implementation review-perf review-security \
  review-seo review-verify triage-issue \
  verification-contract workflow-status unit-lane pre-execution-review \
  plan-feature-interview bump-skill
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
npx skills remove --yes unit-lane plan-feature-interview bump-skill
npx skills add gtrabanco/agentic-workflow
```

For a global installation, add `--global` to both commands. These names are not
published by the current pack: `plan-feature-interview` was an internal helper
installed by older releases before its logic moved into the lane's `design`
step, and `bump-skill` was later reclassified as repository-internal.

### Updating an existing install

`npx skills add …` / `npx skills update` only refreshes the **skills**
(behavior) — on a project that already has the documentation scaffold, run
this ordered path to bring the **substrate** (`AGENTS.md` + `docs/`) forward
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
# Install (Hermes ignores model:/effort: anyway, so the model-agnostic
# skills — inheriting whatever model your Hermes session runs — fit here):
npx skills add gtrabanco/agentic-workflow --agent hermes-agent --global -y
#   → copies each skill to ~/.hermes/skills/<skill>/  ✔ detected by desktop & terminal

# Update later — re-run the add per agent, NOT `skills update`:
npx skills add gtrabanco/agentic-workflow --agent hermes-agent --global -y
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
skipped.) Pick your session model per the [capability classes](#capability-classes).

**Invoking:** in Hermes, `/<name>` loads **bundles**, not individual skills —
`/execute-phase` returns `error: not a quick/plugin/skill command` even when
the skill shows as enabled. Three working ways:

```sh
# 1. One-time: create a bundle → /workflow becomes the slash entry point
hermes bundles create workflow \
  -s init-workspace -s unit-lane -s execute-phase \
  -s review-change -s audit-pr -s product-audit -s audit-docs \
  -s triage-issue -s log-session \
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
| [gtrabanco/ship-lab](https://github.com/gtrabanco/ship-lab) | json2csv CLI — built end-to-end with the (now retired) `ship-roadmap` autopilot     |
| [gtrabanco/bingo-ev](https://github.com/gtrabanco/bingo-ev) | Started with vibecoding, migrated to the workflow once it was working |

## References

- Jin & Chen (2026). *Are LLMs Reliable Code Reviewers? Systematic Overcorrection in Requirement Conformance Judgement.* arXiv:2603.00539. <https://arxiv.org/abs/2603.00539> — the study on which feature 31's planning materiality floor (`low` = report-note, material = `medium`+) is built.
- Philipp Görz, Joschua Schilling, Nicolai Bissantz, and Thorsten Holz (2025). *An Empirical Study of Fuzz Harness Degradation.* FSE '26 / arXiv:2505.06177. <https://arxiv.org/abs/2505.06177> — the validator-determinism rule grounding: a validator depending on network, wall-clock time, randomness, or unordered concurrency re-fails a frozen criterion with zero changes.
- Ze Sheng, Dmitrijs Trizna, Luigino Camastra, Zhicheng Chen, Qingxiao Xu, and Jeff Huang (2026). *Quality-Assured Fuzz Harness Generation via the Four Principles Framework.* arXiv:2605.21824. <https://arxiv.org/abs/2605.21824> — property/fuzz as a bounded validator class for deterministic, repeatable checks.
- V. J. M. Manès, H. Han, C. Han, S. K. Cha, M. Egele, E. J. Schwartz, and M. Woo (2019). *The Art, Science, and Engineering of Fuzzing: A Survey.* TSE'19. doi:10.1109/TSE.2019.2946563 — the case study grounding property/fuzz validators as a production-quality verification strategy.
- appsec.guide. *Writing harnesses.* <https://appsec.guide/docs/fuzzing/techniques/writing-harnesses/> — practical guidance for writing bounded property/fuzz harnesses compatible with the commands validator class.
- Sanket Badhe, Priyanka Tiwari, and Jonghyun Chung, "SKILL.state: Scalable Long-Horizon Agent Skills," arXiv:2608.26263, 2026. <https://arxiv.org/abs/2608.26263> — *basis:* explicit mutable execution state (vs append-only history) for long-horizon procedural skills; the command-scoped episode lifecycle adopts this design partially.
- `@llblab/pi-state-flow` (Pi extension — prior art, software): <https://github.com/llblab/pi-state-flow> — *basis:* opt-in terminal handoffs between complete agent runs; the soft/optional integration target. Credit as prior art alongside the paper entry.
