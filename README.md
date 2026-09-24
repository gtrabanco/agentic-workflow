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
skills/                  28 source skills (13 user-facing + 14 workflow internals + 1 metadata-internal; 27 discoverable — bump-skill is repo-only)
packages/                companion npm packages: @gtrabanco/agentic-workflow-schema (machine contracts)
                         and @gtrabanco/pi-agentic-workflow (one-command install for Pi — see Install)
template/                 the exportable documentation scaffold (the substrate the skills read)
docs/workflow/           the full tutorial (feature flow, issue flow, reference, replication)
docs/features/_TEMPLATE  feature SPEC template + ROADMAP (the planning artifacts skills produce)
docs/fix/                fix SPEC template + index
.github/                 issue + PR templates the workflow expects
```

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

**13 user-facing skills** (one menu entry each) + internal contracts composed
for you: the lane's triage-driven step selection (`unit-lane`), the executor
(`execute-phase`), the internal review pack (`review-code`, `review-security`,
`review-verify`, `review-debt`, `review-design`, `review-a11y`, `review-brand`,
`review-perf`, `review-seo`), the workflow's own pre-execution evidence owner
(`pre-execution-review`), the `orchestration-envelope` contract, and the repo-only
`bump-skill` maintenance helper (excluded from installation) — so **no external
review skill is ever required**, on any agent, with any model. One disciplined
path: **triage → catalog steps (design, implement, tests, evidence, review) →
review the change → audit → merge.**

> Every skill's invocation forms and flags (`--fix`, `--force`,
> `--adversarial N`, `--next`, `--fullauto`, …) are catalogued in the
> [Invocation & arguments reference](docs/workflow/SKILLS.md#invocation--arguments-reference).

### Setup

| Skill            | What it does                                                                                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init-workspace` | Fetches and adapts `template/` by interview: gate, doc map, architecture, capability inventory, optional invariants, and injection-safe labels. It detects Claude Code, Cursor, Copilot, or OpenCode and offers the repository-scoped safety guard explicitly — never installs or overwrites hooks without consent. Existing scaffolds enter **upgrade mode** (additive: only missing blocks/adapters) which also reconciles and retires a legacy `CLAUDE.md` into `AGENTS.md`, and only with consent — a client that reads only the old name may keep it. Provision the Serena project config: writes `.serena/project.yml` with `language_servers` for the detected stack and adds the `.gitignore` block. |
| `discover-repository-state` | Creates and freezes an evidence-backed repository-state ledger before planning or implementation; facts, decisions, documentation, planned work, and inference remain distinct |
| `resolve-repository-state` | Sole writer for an explicit repository-state contradiction; verifies the competing evidence and publishes the next frozen snapshot |

### Execute

| Skill           | What it does                                                                                                                                                                                                                                                                                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `execute-phase` | With no phase argument, executes **all remaining feature/fix phases** through PR close-out; explicit `P<n>` keeps one-phase atomic mode. Every phase retains its own acceptance-blob check, phase/invariant/dependency gates, tests, docs, and commit. Unit-loop mode uses fresh workers where available, compact receipts otherwise, skips intermediate review stops, and halts on red/no-progress/attempt budget. Discoveries become `Autofix`, `Opportunistic Fix`, or a proposal—never an automatic issue. Each phase's pre-flight runs `bun scripts/phase-lint.mjs <plan>` and pastes its output. |

### Review & audit — _change → PR → product_

| Skill           | Scope           | What it does                                                                                                                                                                                   |
| --------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `review-change` | the **change**  | Runs only the reviews that **apply to your platform** (code, security, verify, design, a11y, brand, perf, SEO) — adversarially by default, assuming the diff is wrong until proven otherwise — and classifies → one decision table + an explicit manual-verification checklist; a dirty tree or unpushed commits stop the review as a `REVIEW BLOCKED` precondition before any pass runs — workspace state is never a persisted finding, and the review commits its own findings append so it never dirties the tree it next judges. The mandatory end review **must run in a conversation that did not implement the change** — if it did, stop and hand off to a fresh one. Opt-in `--adversarial N`: N independent context-clean reviewers, each an index-assigned role (correctness/security/SPEC-coverage), run in parallel (subagents / headless / sequential-fallback), findings merged by `file:line` at an inclusion threshold of ≥1 — default off, auto-recommended (never forced) when the change is `L`/sensitive, the reviewer isn't the fleet's strongest or is weaker than the diff's author, or only one model family is available on a `≥M` change. `--synthesize` is the standalone fusion entry point for manually-run reviewers. Fix-now findings on an unmerged unit persist to that unit's fix-now fold ledger (`review-findings.md`), deduped by `file:line`+axis (only `high`/`med` persist — `low` findings are report-only notes that never block). Classification honors the engine's **fix-now override checks**: a cheap fix or an in-scope defect is always fix-now (never a postpone/known-issue/tradeoff escape), and a too-large in-scope fix-now routes to `replan-in-unit` — user-confirmed SPEC phase(s) on the same branch, never a downgrade |
| `fold-findings` | the **findings ledger** | Repairs the full queue in the fewest compatible atomic batches, grouping by root cause/mechanical rule + validator + rollback boundary. One batch gets one commit, while every finding retains its ledger tick and output receipt. Classification stays frozen; disputes stop for a user decision and no fold creates backlog. |
| `audit-pr`      | the **PR**      | Read-first merge gate that **consumes the current `review-change` `REVIEW-PASS` receipt** (a missing/stale receipt is a blocker routed to `/review-change`, never re-reviewed) and evaluates only the delivery contract: phases/docs complete, CI, mergeability, traceability, capability closure, descope integrity, and the receipt's invariant/manual-check result → **MERGE-READY or evidenced blockers**, always with the full URL. MERGE-READY posts a dated SHA-bound PR comment; BLOCKED persists blockers to the shared fold ledger. |
| `product-audit` | the **product** | Explicit-invocation-only, periodic full-spectrum health check persisted as `docs/audits/<id>-<date>.md`; mines code and feature history into severity-ranked findings plus issue/roadmap/tooling proposals, checks capability-inventory freshness and repeated scope export, gates every claim on evidence provenance and reports the delta vs the prior audit of equivalent scope, and never auto-fixes. |
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

| Skill         | What it does                                                                                                                                                                                                                                                                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `log-session` | Appends a structured entry to `docs/LOGS.md` — what the session did, files touched, decisions + _why_, and the next step — so you (or anyone) can resume cold. Run it before `/clear` or before closing. The `template/` also ships **free, opt-in hooks** that auto-append a mechanical entry on `/clear`/exit and can re-inject the last entry on start. |

### Session

| Skill         | What it does                                                                                                                                                                                                                                                                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `log-session` | Appends a structured entry to `docs/LOGS.md` — what the session did, files touched, decisions + _why_, and the next step — so you (or anyone) can resume cold. Run it before `/clear` or before closing. The `template/` also ships **free, opt-in hooks** that auto-append a mechanical entry on `/clear`/exit and can re-inject the last entry on start. |
| `workflow-status` | **Read-only sensor for programmatic orchestration.** Computes the full project state — every feature/fix with its transitive dependency closure (met/unmet), the roadmap's five-state machine (`idea`/`defined`/`planned`/`in-progress`/`done`), what is startable right now (status ≥ `defined`, deps met) and in which build order, `idea` rows reported as `detail.design_candidates`, open PRs + audit state, pending fixes and findings awaiting triage, the mandatory end review proven from its durable `REVIEW-RAN` mark row rather than from a `review-findings.md` that merely exists, the untriaged open-issue backlog (`detail.untriaged_issues`, label-authoritative with a `VERDICT:`-comment legacy fallback), each unit's unfolded fix-now findings from its `review-findings.md` ledger as structured `findings.fix_now[]` items carrying a derived `suggested_tier`, plus the injection-safe `detail.urgent` field (labels-only `urgent`/`fix-next` issues + in-flight interruptibility facts) — and emits it as one fixed JSON machine envelope, `findings.fix_now[]` severity-normalized to the published `high`/`med`/`low` enum, self-checked against the bundled schema and a fixed command→tier map before printing (per-unit `review`/`closure`/`issues_born` and the `next.suggested[]` surface remain steps 10–13 of the published sequence, skill-side and **not yet sensor-mechanized**). With `--last-envelope`, a **no-progress guard** flags a stalled unit still at its pre-advance status. With `--compact`, the same envelope drops repository history — proved-merged units out of `detail.features`/`detail.fixes`, the findings' evidence memos reduced to a fingerprint that keeps their length and names the ledger — while every decision field and `detail.workflow_observations` stay byte-identical (about half the bytes), so a poll loop reads the reduced document and any consumer may switch modes per read
as a `workflow_observations` note instead of silently repeating it. The resolved `next` command is also projected into the schema-validated `next.continuation` object (argv + derived rendering + at-emit preconditions + receiver-verifiable evidence digest + the `convergence` field it advances), with fail-closed typed refusals at `detail.continuation_refusal` whenever no v1 class owns the command, the forge is offline, or a precondition is uncheckable — the emitted command is quoted, never authored. The piece an external driver calls between steps (see [Programmatic orchestration](#programmatic-orchestration)). Never edits anything. |

### Repo maintenance

| Skill        | What it does                                                                                                                                                                                                                                                                                                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bump-skill` | After editing a skill in this repo: bumps `version:` in the SKILL.md frontmatter, adds rows to CHANGELOG.md, and updates the skill table in README.md. Also **lints the repo's authoring rules** (every skill closes with a `→ Next:` block; phases are `P1, P2, …`, never `S1`/"Steps") and the **machine-surface registration rules** (every `user-invocable: true` skill has a matching entry in `.claude-plugin/plugin.json`; that array stays alphabetical; any skill that's both `user-invocable: false` and absent from `plugin.json` — repo-internal, meaningless to a consumer — carries `metadata.internal: true`, the `skills` CLI's own mechanism for staying out of `npx skills add` discovery). Run before every commit that touches a skill. |

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
  via `progress.md`, at most 10 full-file reads per phase. The outer invocation
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

#### <img src="docs/assets/nan-cloud.svg" alt="NaN Cloud logo" width="20" height="19"> Running on [NaN.builders](https://cloud.nan.builders/r/7GK06FX8)

[NaN Cloud](https://cloud.nan.builders/r/7GK06FX8) serves the open-weight
frontier ([full catalog](https://nan.builders/docs/models): glm5.3 ~753B MoE ·
glm5.3-flash 320B (18B active) · deepseek-v4-flash 305B · mimo-v2.5 310B ·
qwen3.8-flash 125B (6B active) · gemma4 26B (4B active) · qwen3.6 35B (3B
active)) behind an OpenAI-compatible API (`https://api.nan.builders/v1`).
Reasoning control is **per-model, not a uniform dial** — see the matrix below
for how each model maps onto this workflow's `effort:` tiers. Sign up via
[this referral link](https://cloud.nan.builders/r/7GK06FX8).

**Two tiers, not one primary.** `glm5.3` is the premium model: it requires the
**GLM 5.3 premium membership**, carries a 3,000M-token allowance per billing
period, and is capped at 400M tokens per rolling 4 hours (the cap a heavy
coding-agent run reaches first). Without that membership it is unavailable, so
the picks below split into a premium column and a basic-plan ladder.

> **Verify your catalog first.** Run `GET /v1/models` with your own key and
> route only to models it actually returns; the exact set depends on your plan
> and the current catalog.

**Quota-aware routing rule.** Monthly allowances per member:
**deepseek-v4-flash** 3B, **glm5.3-flash** 2B, **mimo-v2.5** 1.0B,
**qwen3.8-flash** 500M tokens; **qwen3.6** and **gemma4** list no cap (treated
as *unconfirmed*, never asserted as unlimited); **glm5.3** 3,000M per billing
period plus the 400M rolling-4h window. Reserve the 1M-context budgets for
long-context work and merge-gating verdicts; push re-checkable and mechanical
volume onto the cheaper models.

**Reasoning control per model** (per the API reference) — map this workflow's
`effort:` values through this matrix instead of assuming a shared dial:

| Model | Control | Default | `effort:` mapping |
|---|---|---|---|
| **glm5.3** | `reasoning_effort: low\|medium\|high\|max` — fully controllable | reasoning on | `low`/`medium`/`high`/`max` → literal |
| **glm5.3-flash** | `reasoning_effort: low\|medium\|high\|max` — fully controllable | reasoning on | `low`/`medium`/`high`/`max` → literal |
| **deepseek-v4-flash** | `reasoning_effort` is accepted but has **no effect** — the model chooses its depth per request | adaptive | no mapping: the value is ignored |
| **qwen3.6** | `reasoning_config` (`none\|minimal\|low\|medium\|high\|max`) | on, 16,384-token budget | `none`/`minimal` → thinking off; `low`/`medium`/`high`/`max` → 2,048 / 8,192 / 16,384 / 32,768 tokens |
| **gemma4** | `reasoning_config` (`none\|minimal\|low\|medium\|high\|max`) | on, 16,384-token budget | same as qwen3.6 |
| **mimo-v2.5** | depth accepted but not adjustable — reasoning always on | on | no mapping: every request pays reasoning tokens; leave `max_tokens` headroom (docs: ≥300) |
| **qwen3.8-flash** | depth accepted but not adjustable — reasoning on by default | on | no mapping |

Reasoning traces arrive separately as `message.reasoning_content`. A stream
that produces only reasoning for a long stretch is closed by the platform (a
`finish_reason: "length"` on an empty delta, billed as estimated/false), so a
model that plans without converging is cut rather than left to burn its budget.

**Tool calling is OpenAI-`tools`-native only on `glm5.3`, `glm5.3-flash`,
`deepseek-v4-flash` and `mimo-v2.5`.** `qwen3.6`, `qwen3.8-flash` and `gemma4`
document tool calling in **XML format**, not the OpenAI `tools` schema agent
harnesses send. The executor path (`execute-phase`, anything that reads/edits
files through tools) therefore defaults to `deepseek-v4-flash` (the catalog's
recommended start) or `glm5.3-flash`; `qwen3.6` is previous-generation, kept so
configurations naming it keep working. Run the tool-calling smoke test in
[`docs/workflow/GOLDEN_FIXTURE.md`](docs/workflow/GOLDEN_FIXTURE.md) before
promoting any model into that path.

**Preference ladders per task** (2–3 deep on the basic plan; the premium column
requires the GLM 5.3 membership — without it, use the basic-plan ladder):

| Task | Skills | Premium (`glm5.3`) | Basic-plan ladder | Never here |
|---|---|---|---|---|
| **Merge gates** | `audit-pr`, `product-audit` | glm5.3, High (Max for `product-audit`) | 1. **mimo-v2.5** (reasoning always on) → 2. **deepseek-v4-flash** (floor) → else **defer to the human** | qwen3.6, qwen3.8-flash, gemma4 |
| **Product definition** | `unit-lane` catalog step (`design`) | glm5.3, High | 1. **mimo-v2.5** (reasoning always on; a different family from the executor adds independence) → 2. **deepseek-v4-flash** → 3. **glm5.3-flash** (only for XS/S or derivative features — cheaper, still function-calling) | gemma4; qwen3.6/qwen3.8-flash for agentic runs (XML tools) |
| **Planning / routing / triage** | `unit-lane`, `init-workspace`, `triage-issue`, `review-change` | glm5.3, High | 1. **glm5.3-flash** → 2. **deepseek-v4-flash** → 3. **qwen3.8-flash** (quota-saver) | — |
| **Execution / mechanical** | `execute-phase`, `audit-docs`, `bump-skill`, `workflow-status` | deepseek-v4-flash | 1. **deepseek-v4-flash** → 2. **glm5.3-flash** → 3. **qwen3.8-flash** (only through an XML-aware harness) | mimo-v2.5 (reasoning can't be turned off — burns the capped budget) |
| **Cheap** | `log-session`, evidence gathering | deepseek-v4-flash | 1. **qwen3.8-flash** → 2. **deepseek-v4-flash** | mimo-v2.5 |
| **Folding `review-change`/`audit-pr` findings** | `fold-findings` (primary); `execute-phase`'s embedded fold cycle (in-context/portability fallback) | per finding (see below) | **routine/mechanical** finding (style, missing test stub, stale doc) → same as Execution/mechanical; **subtle** finding (logic, security, architecture) → bump to the tier that found it (Merge-gates or Planning/routing ladder, whichever review ran) | — |
| **Adversarial review (`review-change --adversarial N` / `--synthesize`)** | `review-change` | glm5.3 × N, High | reviewers never weaker than the model that authored the diff; worked example: a deepseek-v4-flash-authored change → `--adversarial 2` with **mimo-v2.5** + **glm5.3-flash** — two families neither of which is the executor, free decorrelation already sitting in this fleet; the orchestrating/merge conversation runs per the Planning/routing ladder | a reviewer weaker than the authoring model |

The folding row routes through the standalone `fold-findings` skill, falling
back to `execute-phase`'s embedded fold cycle only where a separate
invocation isn't available; it supersedes the old single-model "Alternates"
line. Rule of thumb: the fixing model
is never weaker than the one that wrote the original code, and never weaker
than the finding's subtlety warrants — otherwise the fix itself needs
re-catching on re-review, wasting a cycle.

**Why the adversarial row pays for itself on this fleet specifically:** the
mode's recommendation checklist fires whenever the reviewing model isn't the
fleet's strongest or is weaker than the author — on the basic-plan ladder that
is the common case (deepseek-v4-flash and glm5.3-flash execute most units).
Because the fleet already has several distinct model families, spawning `N=2`
reviewers from families other than the author's is close to free decorrelation,
not an extra purchase — the quota was already reserved for Merge-gates-class
work.

**Why the lane's `design` step sits in the merge-gate class, not the cheap tier:**
its output — the SPEC's product half plus capability closure — is the
**founding assumptions** the rest of the flow builds on, so an error there
compounds through plan → execute → review, the same blast radius as a
merge-gate verdict. mimo-v2.5's always-on reasoning is the right spend for it
(few invocations, high leverage) — unlike mechanical volume, where the same
always-on reasoning burns quota for no benefit. glm5.3-flash is acceptable as
rung 2, and only for XS/S or derivative features: the raw-idea interview keeps a
human in the loop, and the lane's `plan` step re-checks the capability closure
downstream (the same re-checked-reasoning caveat below). As with every model
choice here, sanity-check availability against `GET /v1/models` before pinning.

**`qwen3.6`/`qwen3.8-flash` reasoning caveat, stated explicitly:** acceptable
only for **re-checked** reasoning (planning/routing/triage output that review or
audit verifies downstream) — never a merge-gating verdict (3B active parameters
on qwen3.6, 6B on qwen3.8-flash → a plausible-but-shallow audit is worse than
none). On the basic plan, once the mimo-v2.5 + deepseek-v4-flash quota is spent,
no strong reasoner remains → defer to the human, wait for the quota reset, or
upgrade to the GLM 5.3 membership.

**Per-model pros/cons:**

| Model | Size | Context | Basic-plan quota | Good for | Avoid for |
|---|---|---|---|---|---|
| **glm5.3** | ~753B MoE | 1M ctx | Requires the GLM 5.3 premium membership (3,000M/billing period, 400M/rolling 4h); not on the basic plan | Every judgment slot, when available | — |
| **glm5.3-flash** | 320B total · 18B active | 1M ctx | 2B tok/member/mo | Planning/routing/triage and execution; OpenAI-style function calling; multimodal | Merge-gating verdicts (smaller family) |
| **deepseek-v4-flash** | 305B MoE (Vision-Exp) | 1M ctx | 3B tok/member/mo | Default agentic executor: OpenAI-style function calling, image input; planning/routing/triage and cheap volume | Any verdict that gates a merge |
| **mimo-v2.5** | 310B total · 15B active | 1M ctx | 1.0B tok/member/mo | Merge gates + long-context work; a different family from the executors, so it adds reviewer independence | Mechanical/low-effort volume — reasoning can't be turned off, so every cheap task burns the capped budget |
| **qwen3.8-flash** | 125B total · 6B active | 262K ctx | 500M tok/member/mo | Cheap/mechanical volume; quota-saver; non-agentic steps (XML tool calling) | Agentic tool loops through an OpenAI-`tools` harness; merge-gating verdicts |
| **qwen3.6** | 35B total · 3B active | 262K ctx | no cap listed | Previous generation: kept so existing configurations keep working; non-agentic steps (XML tool calling) | New agentic executor work; merge-gating verdicts; reviewing code it wrote itself |
| **gemma4** | 26B total · 4B active | 262K ctx | no cap listed | Small non-agentic tier (single-shot text/vision) | Any judgment call; agentic tool loops (XML-format tool calling) |

**Operational limits per API key** (from the API reference): 60 requests/min,
1.5M tokens/min per chat model for deepseek-v4-flash, mimo-v2.5, qwen3.6 and
gemma4, and **7 simultaneous requests per key on the basic plan (10 on
premium)** across all models — with a per-model cap of 5 for qwen3.6, gemma4 and
mimo-v2.5. Cap any subagent/review fan-out (the `review-change` pack) at ≤5
concurrent — 3–4 in practice, leaving headroom for the conductor — and remember
an agentic loop spends one request per tool round-trip, so several agents in
parallel hit 60 rpm quickly.

Whisper, Kokoro, Rerank, Qwen3 Embedding and Flux 2 Klein are
audio/retrieval/image models — not used by the workflow. Model strength above
is framed by active-params + role, not benchmark numbers — sanity-check
against a current leaderboard before pinning; this landscape moves fast.

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

## How to use them

Full tutorial in **[`docs/workflow/`](docs/workflow/README.md)**. In short:

### Build a feature

```
# New unit: docs/features/NN-<slug>/SPEC.md (13 sections)
/execute-phase NN                  → lane executes triage-decided steps (design, implement, tests, evidence, review...)
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
/log-session                    # before /clear or closing: append what you did + the next step to docs/LOGS.md
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
npx skills add gtrabanco/agentic-workflow --skill plan-feature --skill triage-issue
npx skills add gtrabanco/agentic-workflow --agent claude-code --agent cursor

# Install for the current user (global) instead of the current project:
npx skills add gtrabanco/agentic-workflow --global

# Manage them later:
npx skills list
npx skills update
npx skills remove plan-feature

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
`/skill:plan-feature --next`), and optional per-command model routing that
sends each workflow command to the model you choose and gives your session
back afterwards.

```sh
pi install npm:@gtrabanco/pi-agentic-workflow
```

Restart Pi and run `/agentic-workflow-settings` once. Update and removal are
`pi update` / `pi remove` with the same package name. Details, model-routing
configuration, and troubleshooting live in
**[`packages/pi-agentic-workflow/README.md`](packages/pi-agentic-workflow/README.md)**.

## Uninstall

To remove the complete `agentic-workflow` install from the current project
without selecting skills interactively, pass all published skill names to one
`remove` command:

```sh
npx skills remove --yes \
  audit-docs audit-pr bump-skill discover-repository-state \
  execute-phase fold-findings init-workspace log-session \
  orchestration-envelope phase-contract product-audit \
  resolve-repository-state review-a11y review-brand review-change review-code \
  review-debt review-design review-implementation review-perf review-security \
  review-seo review-verify triage-issue \
  verification-contract workflow-status unit-lane bump-skill
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
installed by older releases before its logic moved to `design-feature`, and
`bump-skill` was later reclassified as repository-internal.

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
skipped.) Pick your session model per the [capability classes](#capability-classes)
— on NaN.builders, per the picks above.

**Invoking:** in Hermes, `/<name>` loads **bundles**, not individual skills —
`/execute-phase` returns `error: not a quick/plugin/skill command` even when
the skill shows as enabled. Three working ways:

```sh
# 1. One-time: create a bundle → /workflow becomes the slash entry point
hermes bundles create workflow \
  -s init-workspace -s plan-feature -s plan-fix -s execute-phase \
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

- Jin & Chen (2026). *Overcorrection in LLM-based artifact review.* arXiv:2603.00539. <https://arxiv.org/abs/2603.00539> — the study on which feature 31's planning materiality floor (`low` = report-note, material = `medium`+) is built.
