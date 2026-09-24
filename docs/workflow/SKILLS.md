# Skill system reference

The skills that make up the agentic workflow, grouped by role.

**13 user-facing skills** (one menu entry each) + the internal steps
composed for you: `pre-execution-review` (the planning-ledger shapes and
ownership, ledger-only after feature 61), the `review-change` findings engine
`review-implementation`, the `phase-contract` lint contract, the
`verification-contract` acceptance guard, and the workflow's own 9-skill
internal review pack: `review-code`, `review-security`, `review-verify`,
`review-debt`, `review-design`, `review-a11y`, `review-brand`, `review-perf`,
`review-seo`. Additionally, **one metadata-internal** contract not discoverable
by the `skills` CLI (`orchestration-envelope`; it carries `metadata.internal: true`
which the CLI respects to exclude from `npx skills add` discovery). The 13
user-facing skills cover setup, repository-state discovery/resolution, the
adaptive unit lane, execution, review, audit, finding folds, docs generation,
issue triage, session logging, and workflow status. The former fixed pipeline
(`design-feature` → `review-spec` → `plan-feature` → `review-plan`) and the
autopilot role (`ship-roadmap`) are retired (feature 61): their work lives in
`unit-lane`'s catalog steps and the companion pi package's deterministic
`advance` conductor. **bump-skill** is a repo-only maintenance tool (not a
workflow skill) and is excluded from the workflow skill index entirely.

## Context budget and progressive loading

Skill metadata is always advertised by the agent, but a `SKILL.md` body enters
context only after activation. The context checker discovers every
`skills/*/SKILL.md` entrypoint and applies one default entrypoint budget;
overrides are limited to description metadata. Segmented entrypoints keep universal gates and an
explicit route in `SKILL.md`, then load detailed `references/` only when that
route needs them. References are one hop deep and must not link to more
references, so small models do not have to discover a hidden instruction chain.

The committed budget uses `ceil(UTF-8 bytes / 4)` as a deterministic estimate,
not as provider billing tokens. Every main entrypoint is capped at 2,800
estimated tokens and 240 lines, with no size exception. The nine entrypoints
refactored in the second progressive-loading pass fell from a combined 30,868
to 16,046 estimated tokens while preserving their contracts behind explicit
routes. Validate the catalog with:

```sh
bun scripts/check-skill-context.mjs   # node scripts/check-skill-context.mjs — fallback when bun is absent
```

Prompt caching may reduce repeated latency or billed input on a supporting
provider, but it does not shrink the active context. Correctness and context
capacity therefore rely on segmentation, not cache behavior. See
[`SKILL_CONTEXT_BUDGETS.json`](SKILL_CONTEXT_BUDGETS.json) for the enforced
limits.

## Setup

| Skill | Role | Hands off to |
|---|---|---|
| `init-workspace` | Fetch and adapt the scaffold; seed repository contracts; explicitly offer the detected Claude/Cursor/Copilot/OpenCode safety adapter without clobbering hooks | `discover-repository-state` |
| `discover-repository-state` | Creates a frozen, evidence-backed repository-state ledger; separates facts, decisions, planned work, documentation, and inference | `unit-lane` / `resolve-repository-state` |
| `resolve-repository-state` | Sole writer that resolves an explicit fact contradiction and publishes the next frozen snapshot | the interrupted workflow step |

## The adaptive unit lane (`unit-lane`)

One document, adaptive steps. `unit-lane` is the single conductor for a
feature or a fix: `scripts/unit-route.mjs --triage <unit>` reads the unit doc
against the closed catalog (`scripts/catalog.json` — `research, design, plan,
implement, tests, evidence, review, docs, release`) and returns the ordered
subset the unit needs; the model executes only that subset. `unit-lane` absorbs
the retired fixed pipeline (`design-feature` → `review-spec` → `plan-feature`
→ `review-plan`) into catalog steps, and it creates the unit doc:
`docs/features/<NN>-<slug>/` for a feature (`/unit-lane <slug>`,
`/unit-lane "<idea>"`, `/unit-lane --from-issue <n>`) or
`docs/fix/<issue>-<topic>/` for a fix (`/unit-lane --fix <n>`).

`execute-phase` executes a unit that is already triaged (`implement`/`tests`/
`evidence` steps); docs-only units run entirely inside `unit-lane`. The
`pre-execution-review` internal pack survives only as the owner of the
planning-ledger shapes and ownership that `execute-phase` and `review-change`
consume — the standalone `SPEC-REVIEW-PASS` / `PLAN-REVIEW-PASS` gates are
retired.

## Plan (absorbed into the lane)

`plan-feature` and `plan-fix` are retired: the engineering half, sizing, and
roadmap registration are the lane's `plan` catalog step, reached from
`/unit-lane <slug>` (feature) or `/unit-lane --fix <n>` (fix).

### Internal steps (hidden from the menu; composed for you)

| Skill | Role |
|---|---|
| `pre-execution-review` | Single owner of the **planning-ledger table shapes, homes and writers**, including the durable review mark's row, that `execute-phase` and `review-change` consume. The retired `review-spec`/`review-plan` review-cycle semantics are legacy-only. `user-invocable: false` — it emits no verdict |
| `review-implementation` | Classification engine over synthesized table (fix-now / replan-in-unit / decision-required / proposal); findings only, no refactor. `user-invocable: false` — the engine `review-change` composes (and `audit-pr` / `product-audit` reuse) |
| `orchestration-envelope` | Package-owned machine-result contracts (strict Envelope v2, compact SkillOutcome v1, compatibility parsing, and deterministic snapshots) for driven worker/sensor skills. `user-invocable: false` — the conductor is the companion pi package's `advance` command (feature 62); its deterministic routing lives in `workflow-status` / `unit-lane` |
| `verification-contract` | Freezes acceptance before implementation, defines validation levels, and binds evidence to the current acceptance blob and code receipt. `user-invocable: false` — planners, executors, and reviewers compose it |
| `phase-contract` | The single owner of the eight phase-lint rules, the fixed PASS/BLOCKED result, and the normalized phase fingerprint. `user-invocable: false` — consumed by `execute-phase` and the lane's `plan` step |
| `review-code` | Correctness + reuse/simplification/efficiency checklist over the diff. `user-invocable: false` — one axis of `review-change`'s internal review pack |
| `review-security` | OWASP-shaped security checklist over the diff. `user-invocable: false` — internal review pack |
| `review-verify` | Runtime-behavior verification checklist (does the change actually do what it claims). `user-invocable: false` — internal review pack |
| `review-debt` | Tech-debt transform over classified table (does not rescan diff). `user-invocable: false` — internal review pack |
| `review-design` | Architecture/layering-consistency checklist over the diff. `user-invocable: false` — internal review pack |
| `review-a11y` | Accessibility checklist over UI changes. `user-invocable: false` — internal review pack |
| `review-brand` | Brand/voice-consistency checklist over user-facing copy. `user-invocable: false` — internal review pack |
| `review-perf` | Performance-regression checklist over the diff. `user-invocable: false` — internal review pack |
| `review-seo` | SEO checklist over public-facing pages/routes. `user-invocable: false` — internal review pack |

## Execute

| Skill | Role |
|---|---|
| `execute-phase` | With only a feature/fix target, executes **all remaining phases** through a bounded unit loop; an explicit `P<k>` remains atomic. Each phase gets a fresh worker context and compact receipt, tests-first implementation, a three-attempt default repair budget, no-progress detection, and no intermediate review ceremony. Acceptance is frozen before code. Findings inside the current unit are fixed there; unrelated findings remain proposals and never create issues automatically. A completed unit opens its PR and flips to `done` |

## Review & audit — *change → PR → product*

| Skill | Scope | Role | Hands off to |
|---|---|---|---|
| `review-change` | the **change** | Run applicable isolated reviews, verify the frozen acceptance blob against the current code receipt, map criteria to diff evidence, classify once, and persist one SHA-bound verdict. **Mandatory before merge** | manual `fold-findings` → re-run `review-change` (recommended on failure) |
| `fold-findings` | the **findings ledger** | Repair the selected queue in compatible atomic batches. Every finding retains an individual ledger verdict and evidence; batching is allowed only when members share a correction rule, validator, and rollback boundary | re-run `review-change` / surface a real dispute for user decision |
| `audit-pr` | the **PR** | Read-first merge gate that **consumes the current `review-change` `REVIEW-PASS` receipt** (absent/stale → blocker routed to `/review-change`, never re-reviewed) → SHA-bound MERGE-READY comment or evidenced blockers; never edits or merges | `execute-phase` / `unit-lane` / `triage-issue` |
| `product-audit` | the **product** | Periodic full-spectrum health check; mines feature docs → proposes issues + roadmap add/remove (never auto-fixes); scope-export recurrence (≥ 2 consecutive units exporting scope → planning-quality finding routed to #64) | `triage-issue` / `unit-lane` |
| `audit-docs` | the **docs** | Audit docs ↔ roadmap ↔ code ↔ fix index for drift | report (+ optional low-risk fixes) |

> `review-change`'s findings engine is the internal `review-implementation`
> (`user-invocable: false`) — the synthesized-table classifier it composes, and
> that `audit-pr` / `product-audit` reuse. It's not a menu entry; see
> [Internal steps](#internal-steps-hidden-from-the-menu-composed-for-you).

## Decide

| Skill | Role | Hands off to |
|---|---|---|
| `triage-issue` | Classify fix-now / fix-in-unit / promote / postpone / wontfix; a scope-membership check (before classification) routes an issue that already belongs to an open unit onto that unit's own branch; verify triggers vs. real code; accepts several issues in one batch; `--prioritize-now` triages unresolved review findings and routes oversized work to a plan with new phases | `/unit-lane --fix <n>`, `execute-phase`/`fold-findings` (fix-in-unit), `/unit-lane --from-issue <n>`, or a dated comment |

## Session

| Skill | Role | Hands off to |
|---|---|---|
| `log-session` | Append a structured entry to `docs/LOGS.md` — summary, files, decisions + *why*, next step — so a cold reader (or the next session) resumes without re-reading git. Manual + rich; `model: sonnet` (cheap). Complemented by free, opt-in `template/.claude/` hooks that auto-append a mechanical entry on `/clear`/exit and can re-inject the last entry on start | `/clear` (session captured) or the resume command in the entry's **Next** line |
| `workflow-status` | **Read-only sensor for programmatic orchestration.** Computes the full project state — every feature/fix with its transitive dependency closure (met/unmet), the roadmap's five-state machine, what is startable now and in which build order, open PRs + audit state, pending fixes and findings awaiting triage, the mandatory review proven from its durable `REVIEW-RAN` mark and never from a ledger that merely exists — and emits it as one fixed JSON machine envelope. The piece an external driver calls between steps. Never edits anything | the driver's next invocation (it never hands off to another skill itself) |

## Repo maintenance (specific to the agentic-workflow repo)

| Skill | Role |
|---|---|
| `bump-skill` | After editing a SKILL.md: bump `version:`, add CHANGELOG.md rows, update the README skill/model tables. Repo-only — its description keeps it from triggering in other projects |

## Invocation & arguments reference

Every user-invocable skill's invocation forms and what each argument/flag does
— the human-readable mirror of each skill's `argument-hint` frontmatter.
Brackets `[…]` = optional; `|` separates alternative forms. A skill invoked
with no arguments uses the default stated here.

| Skill | Invocation | Arguments & flags |
|---|---|---|
| `audit-docs` | `/audit-docs [--fix]` | No args: report-only, findings ranked by severity. `--fix`: additionally applies the **low-risk** fixes — docs are never rewritten without it (or an explicit user go-ahead). |
| `audit-pr` | `/audit-pr [pr-number]` | Defaults to the current branch's PR. A number targets another PR. |
| `discover-repository-state` | `/discover-repository-state` | Reads repository evidence and writes a frozen Normalized Repository State; contradictions route to `/resolve-repository-state`. |
| `execute-phase` | `/execute-phase <NN> [P<k>] \| --fix <n> [P<k>] [--max-attempts N] \| [--force]` | Target only → execute every remaining phase and close the unit. Explicit `P<k>` → execute exactly that phase. `--max-attempts N` bounds phase repair attempts (default 3). `--force` is the recorded user-only dependency/status override. |
| `fold-findings` | `/fold-findings [finding-id …]` | No args: repairs the complete pending fix-now queue, grouping only compatible corrections. IDs restrict the queue. Every member still receives its own `FOLDED \| DISPUTED \| BLOCKED` result. |
| `init-workspace` | `/init-workspace [target-dir]` | Defaults to the current directory. On a repo that already has the scaffold it auto-switches to **upgrade mode** (additive: proposes only the new/missing template blocks), which also reconciles and retires a legacy `CLAUDE.md` into `AGENTS.md` — with consent only. |
| `log-session` | `/log-session [note]` | The optional note is prepended to the entry's Summary. |
| `product-audit` | `/product-audit [path-or-area]` | Explicit invocation only. Defaults to the whole product; a path/area narrows the sweep. Proposes only — never fixes. |
| `resolve-repository-state` | `/resolve-repository-state <contradiction-id>` | Verifies both evidence sources and publishes the next frozen snapshot, or stops with explicit missing input. |
| `review-change` | `/review-change [path-or-glob] [--adversarial N]` | Defaults to the current change (branch diff vs the default branch); a path widens/narrows. `--adversarial N` → N independent, context-clean, diff-only adversarial reviewers in parallel, findings merged and deduped (opt-in; auto-recommended for `L`/sensitive changes). |
| `triage-issue` | `/triage-issue <n> [n…] \| --prioritize-now <unit> F<k> [F<j>…]` | Issue batches produce independent verdicts plus one summary table; review-finding mode attempts every unresolved finding now and routes oversized work to `/unit-lane` plus new manual phases. |
| `unit-lane` | `/unit-lane <NN-slug \| "<idea>"> [--retriage] \| --fix <n> \| --from-issue <n>` | The adaptive lane: creates/triages the unit doc, runs the catalog steps the router returns, records evidence, and commits per step. A raw idea creates the unit; `--fix`/`--from-issue` create it from a tracked issue. `--retriage` re-runs the catalog. |
| `workflow-status` | `/workflow-status [--json-only] [--last-envelope <json\|path>]` | Default: human summary + the machine envelope. `--json-only` → envelope only (driver mode). `--last-envelope` → the driver's persisted envelope as a crash-recovery **hint** (diffed against recomputed state; never authoritative). No argument passing on your agent? Paste the JSON in the message — the last fenced json block of the *request* is read as the hint. |

## Built-in companions (Claude Code)

`/code-review` (correctness + simplification), `/security-review` (security pass),
`/verify` (run the app, confirm behavior) — composed by `review-change` when they
apply to the change.

## Domain guardrails (per project — not bundled)

Stack/domain guardrail skills auto-load during execution but are
**project-specific**, so they live in each target repo rather than here — e.g.
an architecture-pattern skill, a domain-rules skill, and stack skills
(framework, ORM, runtime, platform). See `RECOMMENDED_SKILLS.md`.

## How they compose

```
IDEA / undesigned SPEC ─▶ /unit-lane "<idea>" (creates the unit doc + triage)
DESIGNED slug/SPEC ─────▶ /unit-lane <NN-slug>   (re-triage; runs only the steps the catalog returns)
ISSUE(feature) ─────────▶ /unit-lane --from-issue <n>
ISSUE(fix) ─────────────▶ /unit-lane --fix <n>
ROADMAP --next ─────────▶ /unit-lane <slug> of the next startable unit
                          │
                          └─ catalog: research → design → plan → implement → tests → evidence → review → docs → release
                             (implement/tests/evidence steps hand off to /execute-phase for an already-triaged unit)
                             → open PR (`done`) ─▶ fold-findings → re-run review-change ─▶ audit-pr ─▶ merge

ISSUE(any) ─▶ triage-issue ─┬─ fix-now ─▶ /unit-lane --fix <n>
                            ├─ fix-in-unit ─▶ execute-phase <NN> P<k> / fold-findings (ledger row) / replan on the open unit
                            ├─ promote ─▶ /unit-lane --from-issue <n>
                            ├─ postpone ─▶ dated comment, leave open
                            └─ wontfix ─▶ propose close

review→fold (manual) ── fold-findings → re-run review-change on a changed HEAD;
                 unresolved findings → triage-issue → replan + manual phases;
review-change ── runs the applicable read-only reviews + classifies a change;
                 composes review-implementation + the platform's companion skills;
                 fix-now ─▶ folds into the open phase · replan-in-unit ─▶ new user-confirmed phases
                 decision-required ─▶ surface, block · proposals ─▶ user routes to triage-issue
audit-pr ─────── PR-level merge gate (merge-ready or blockers)
product-audit ── periodic product-wide sweep → proposes issues + roadmap changes
audit-docs ───── audits docs ↔ roadmap ↔ code ↔ fix index, anytime

# The conductor is the companion pi package's `advance` command (feature 62):
# sensor (`workflow-status`) → deterministic decide → invoke the printed
# `/skill:<verb> <args>` verbatim. It never merges.
```

## Design rules every skill follows

1. **Discover first.** Read the agent guide, documentation map, architecture,
   roadmap, and relevant domain/style docs before acting. Adapt to the project.
2. **Respect architecture & style.** Layer rules, domain/i18n/SEO/a11y rules,
   runtime/platform limits, naming conventions — all honored, not bypassed.
3. **Plan before code; isolate phase contexts; one PR per unit against the
   default branch; never `main`, never stacked.**
4. **Evidence over reflex.** Verify triggers, cite paths/counts.
5. **Track, don't inline-implement, deferred work.** Keep issues and docs
   coherent and reported.
6. **Gate before commit.** Type-check + tests + build green.
7. **Docs-language discipline.** Artifacts in the project's docs language (this
   repo: English), regardless of the request's language.

## Skill anatomy

Each skill is a folder under `.claude/skills/<name>/` with a `SKILL.md`:

```
---
name: <kebab-case-name>
description: >
  One paragraph with concrete trigger phrases so the model knows when to load it.
---

# Title
## When to use
## Step 0 — Discover the project (always first)
## Process
## Guardrails
## Relationship to other skills
## Done when
```
