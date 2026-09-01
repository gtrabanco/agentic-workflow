# Skill system reference

> 🇪🇸 [Versión en español](SKILLS.es.md)

The skills that make up the agentic workflow, grouped by role.

**20 user-facing skills** (one menu entry each) + **17 internal steps**
composed for you (the `plan-feature` router's two planning steps, the two
pre-execution evidence owners `evidence-grounding` (authoring readiness) and
`pre-execution-review` (the shared review cycle + the planning ledgers), the
`review-change` findings engine `review-implementation`, the
`planning-preflight` planning gate, the `phase-contract` lint contract,
the `verification-contract` acceptance guard, the workflow's own 9-skill
internal review pack: `review-code`, `review-security`, `review-verify`,
`review-debt`, `review-design`, `review-a11y`, `review-brand`, `review-perf`,
`review-seo`). Additionally, **one metadata-internal** contract not discoverable
by the `skills` CLI (`orchestration-envelope`; it carries `metadata.internal: true`
which the CLI respects to exclude from `npx skills add` discovery). The 20
user-facing skills cover setup, repository-state discovery/resolution, design,
pre-execution review (product and plan), planning, execution, review, audit,
finding folds, docs generation, issue triage, roadmap shipping, session logging,
and workflow status. **bump-skill** is a
repo-only maintenance tool (not a workflow skill) and is excluded from the
workflow skill index entirely.

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
node scripts/check-skill-context.mjs
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
| `discover-repository-state` | Creates a frozen, evidence-backed repository-state ledger; separates facts, decisions, planned work, documentation, and inference | `plan-feature` / `resolve-repository-state` |
| `resolve-repository-state` | Sole writer that resolves an explicit fact contradiction and publishes the next frozen snapshot | the interrupted workflow step |

## Design

| Skill | Role | Hands off to |
|---|---|---|
| `design-feature` | **Product definition.** Folds in the raw-idea interview (one question per turn, fixed six-slot vagueness rubric, ≥ 3 empty slots → `NEEDS_INPUT`), runs proportional research, and walks the **capability-closure** checklists — **entity closure** (per entity → CRUD + state transitions + UI + API + test or explicit `n/a`), **integration closure** (one resolved row per subsystem in the project's capability inventory, `docs/CAPABILITIES.md` — auth, ACL, navigation, notifications, …), and the **role matrix** (every inventory role explicitly allowed/denied per capability) — into exhaustive acceptance criteria, plus the **expectation sweep** (≥ 10 implicit domain expectations, each forced to in-scope/out-of-scope/deferred). Writes the SPEC's **product half** and stamps `## Design status: designed` only after the template's **Spec-lint product boxes** (mechanical presence checks) all tick. Upserts on re-run; never destroys recorded decisions | `plan-feature <slug>` |

## Pre-execution review (the two gates between an idea and a line of code)

| Skill | Role | Hands off to |
|---|---|---|
| `review-spec` | **Independent Product gate.** Read-only review of the designed Product half in a context that did not write it: builds the frozen `stage: spec` snapshot, runs the fixed checks, and returns one of `SPEC-REVIEW-PASS` / `SPEC-REVIEW-FAIL` / `NEEDS-DESIGN` with a snapshot-bound receipt in `progress.md`. A FAIL's findings go to the unit's stage-aware `planning-findings.md`; the author's own readiness result can never stand in for the verdict. | `plan-feature` on a current PASS; `design-feature` to repair; the human when a product choice is genuinely open |
| `review-plan` | **Independent Engineering gate.** Same contract over the frozen plan (`stage: plan` snapshot: SPEC, `ACCEPTANCE.md`, planning evidence, obligations, phases, tests; the parent Product snapshot digest is required): ledger sweep L1–L6, checks P1–P12 (F1–F4 on fix units), then `PLAN-REVIEW-PASS` / `PLAN-REVIEW-FAIL` / `NEEDS-DESIGN` + receipt. | `execute-phase` on a current PASS; the planning author to re-cut; `design-feature` on `NEEDS-DESIGN` |

Both are read-only over every artifact they judge, share one policy
(`pre-execution-review`: independence, unioned findings, counter-evidence-only
dismissal, bounded repair cycles, `CONVERGENCE-ANOMALY`), and neither can be
bypassed by a flag. `evidence-grounding` is what makes the *author's* turn
ready to request those reviews — one evidence row per material claim, a
deterministic readiness result, never a verdict.

## Plan

| Skill | Role | Hands off to |
|---|---|---|
| `plan-feature` | **Router, engineering-planning only.** Given an undesigned feature (no `## Design status: designed`), **STOPS and redirects** to `/design-feature <slug>` (no bypass flag). Given a designed feature or issue `#N` (issue → scoped product half → `design-feature` for thin issues), routes to fill the **engineering half**, **sizes the feature** (`XS/S/M/L`), then registers the roadmap entry | `execute-phase <NN>` (all remaining phases) or `execute-phase <NN> P1` (one explicit phase) |
| `plan-fix` | Drafts one fix unit from one issue or a compatible issue set. Grouping accepts a capability bundle or homogeneous mechanical batch when the set has one outcome, verification plan, and atomic rollback; shared files, root cause, and severity are not required | `execute-phase --fix <n>` (all remaining phases) |

### Internal steps (hidden from the menu; composed for you)

| Skill | Role |
|---|---|
| `plan-feature-from-issue` | Feature-request issue → scoped SPEC product half (satisfies capability closure), with `Closes #N` (invoked by `plan-feature`) |
| `plan-feature-scaffold` | Fills the SPEC's **engineering half** + planning artifacts **scaled to the feature's size** (XS/S → SPEC-only; M/L → full set ending in a mandatory hardening phase); registers in roadmap (docs only) (invoked by `plan-feature`) |
| `evidence-grounding` | Authoring-side evidence contract + readiness preflight (`stage: spec` and `stage: plan`): claim→authority→artifact rows, the fixed readiness vocabulary, and the revision rotation that lets a reviewer detect its own write. `user-invocable: false` — composed by `design-feature`, `plan-feature-scaffold` and `plan-fix`; it can never emit a review PASS |
| `pre-execution-review` | Single owner of the shared review cycle (clean-context independence, truthful author-exclusion and diversity labels, unioned findings, counter-evidence-only dismissal, untrusted content, repair classes, no-progress, `CONVERGENCE-ANOMALY`, legacy adoption, write-then-report marking of terminal verdicts and typed gate rejections) and of the planning ledger table shapes, homes and writers, including the durable review mark's row. `user-invocable: false` — composed by `review-spec`, `review-plan` and the authoring skills; it emits no verdict |
| `review-implementation` | Classification engine over synthesized table (fix-now / replan-in-unit / decision-required / proposal); findings only, no refactor. `user-invocable: false` — the engine `review-change` composes (and `audit-pr` / `product-audit` reuse) |
| `orchestration-envelope` | Package-owned machine-result contracts (strict Envelope v2, compact SkillOutcome v1, compatibility parsing, and deterministic snapshots) for driven worker/sensor skills. `user-invocable: false` — `ship-roadmap` remains a native-banner conductor |
| `verification-contract` | Freezes acceptance before implementation, defines validation levels, and binds evidence to the current acceptance blob and code receipt. `user-invocable: false` — planners, executors, and reviewers compose it |
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
| `review-change` | the **change** | Run applicable isolated reviews, verify the frozen acceptance blob against the current code receipt, map criteria to diff evidence, classify once, and persist one SHA-bound verdict. **Mandatory before merge** | `loop-review-fold` (recommended on failure) / manual `fold-findings` |
| `fold-findings` | the **findings ledger** | Repair the selected queue in compatible atomic batches. Every finding retains an individual ledger verdict and evidence; batching is allowed only when members share a correction rule, validator, and rollback boundary | re-run `review-change` / surface a real dispute for user decision |
| `loop-review-fold` | the **review/fold router** | Check persisted evidence, run `fold-findings` first when a previous `review-change` left an open queue, otherwise run `review-change`; after a changed HEAD, review again. Unresolved findings route to `triage-issue --prioritize-now`, with oversized work replanned into new manual phases | `audit-pr` on pass / user triage and manual execution on unresolved findings |
| `audit-pr` | the **PR** | Read-first merge gate that **consumes the current `review-change` `REVIEW-PASS` receipt** (absent/stale → blocker routed to `/review-change`, never re-reviewed) → SHA-bound MERGE-READY comment or evidenced blockers; never edits or merges. Active `ship-roadmap --fullauto` is the only consumer allowed to execute an automated merge | `execute-phase` / `plan-fix` / `triage-issue` |
| `product-audit` | the **product** | Periodic full-spectrum health check; mines feature docs → proposes issues + roadmap add/remove (never auto-fixes); scope-export recurrence (≥ 2 consecutive units exporting scope → planning-quality finding routed to #64) | `triage-issue` / `plan-feature` / `plan-fix` |
| `audit-docs` | the **docs** | Audit docs ↔ roadmap ↔ code ↔ fix index for drift | report (+ optional low-risk fixes) |

> `review-change`'s findings engine is the internal `review-implementation`
> (`user-invocable: false`) — the synthesized-table classifier it composes, and
> that `audit-pr` / `product-audit` reuse. It's not a menu entry; see
> [Internal steps](#internal-steps-hidden-from-the-menu-composed-for-you).

## Decide

| Skill | Role | Hands off to |
|---|---|---|
| `triage-issue` | Classify fix-now / fix-in-unit / promote / postpone / wontfix; a scope-membership check (before classification) routes an issue that already belongs to an open unit onto that unit's own branch; verify triggers vs. real code; accepts several issues in one batch; `--prioritize-now` triages unresolved review findings and routes oversized work to a plan with new phases | `plan-fix`, `execute-phase`/`fold-findings` (fix-in-unit), `plan-feature`, or a dated comment |

## Document

| Skill | Role | Hands off to |
|---|---|---|
| `generate-docs` | Turn a unit's diff into developer docs on the project's own docs site: incremental how-to guides via a discovered adapter (Starlight MDX reference, plain-markdown fallback), a knowledge/call map rendered from a project-declared deterministic command (never model-inferred), opt-in `--review` export of review reports. Provenance frontmatter (`generated-by`/`source-unit`) lets `audit-docs` catch orphan/stale pages | the unit's close-out commit (pages ride the unit's PR); `audit-docs` for drift |

## Autopilot — the whole flow, end to end

| Skill | Role | Hands off to |
|---|---|---|
| `ship-roadmap` | **Conductor.** One upfront interview and a driver loop ship the roadmap and issue sweep. Default: opens PRs, human merges. `--fullauto` is the sole automated merge authority and uses the transient fail-closed wrapper plus an idempotent PR comment; direct merges remain blocked | human merges / `triage-issue` batch / `product-audit` |

## Session

| Skill | Role | Hands off to |
|---|---|---|
| `log-session` | Append a structured entry to `docs/LOGS.md` — summary, files, decisions + *why*, next step — so a cold reader (or the next session) resumes without re-reading git. Manual + rich; `model: sonnet` (cheap). Complemented by free, opt-in `template/.claude/` hooks that auto-append a mechanical entry on `/clear`/exit and can re-inject the last entry on start | `/clear` (session captured) or the resume command in the entry's **Next** line |
| `workflow-status` | **Read-only sensor for programmatic orchestration.** Computes the full project state — every feature/fix with its transitive dependency closure (met/unmet), the roadmap's five-state machine, what is startable now and in which build order, open PRs + audit state, pending fixes and findings awaiting triage, the mandatory review proven from its durable `REVIEW-RAN` mark and never from a ledger that merely exists — and emits it as one fixed JSON machine envelope. The piece an external driver calls between steps. Never edits anything | the driver's next invocation (it never hands off to another skill itself) |

## Repo maintenance (specific to the agentic-workflow repo)

| Skill | Role |
|---|---|
| `bump-skill` | After editing a SKILL.md: bump `version:`, add CHANGELOG.md + CHANGELOG.es.md rows, update the README skill/model tables. Repo-only — its description keeps it from triggering in other projects |

## Invocation & arguments reference

Every user-invocable skill's invocation forms and what each argument/flag does
— the human-readable mirror of each skill's `argument-hint` frontmatter.
Brackets `[…]` = optional; `|` separates alternative forms. A skill invoked
with no arguments uses the default stated here.

| Skill | Invocation | Arguments & flags |
|---|---|---|
| `audit-docs` | `/audit-docs [--fix]` | No args: report-only, findings ranked by severity. `--fix`: additionally applies the **low-risk** fixes — docs are never rewritten without it (or an explicit user go-ahead). |
| `audit-pr` | `/audit-pr [pr-number]` | Defaults to the current branch's PR. A number targets another PR. |
| `design-feature` | `/design-feature <idea \| NN-slug> [instruction]` | A raw idea → interview from zero. A bare existing `NN-slug` → **review mode**: prints a summary of what the feature will do and asks what to add/remove/change. `NN-slug + instruction` → applies the change directly, no questions, scoped to the instruction. Upsert always — the only from-zero reset is an explicit "delete and redesign" in the instruction. |
| `discover-repository-state` | `/discover-repository-state` | Reads repository evidence and writes a frozen Normalized Repository State; contradictions route to `/resolve-repository-state`. |
| `execute-phase` | `/execute-phase <NN> [P<k>] \| --fix <n> [P<k>] [--max-attempts N] \| [--force]` | Target only → execute every remaining phase and close the unit. Explicit `P<k>` → execute exactly that phase. `--max-attempts N` bounds phase repair attempts (default 3). `--force` is the recorded user-only dependency/status override. |
| `fold-findings` | `/fold-findings [finding-id …]` | No args: repairs the complete pending fix-now queue, grouping only compatible corrections. IDs restrict the queue. Every member still receives its own `FOLDED \| DISPUTED \| BLOCKED` result. |
| `generate-docs` | `/generate-docs [NN-slug \| fix-n \| path/glob] [--review]` | Scope defaults to the current branch's diff vs the default branch; a slug/fix/path narrows or redirects it. `--review` → additionally export the most recent `review-change` report as a docs page (opt-in, never automatic). |
| `init-workspace` | `/init-workspace [target-dir]` | Defaults to the current directory. On a repo that already has the scaffold it auto-switches to **upgrade mode** (proposes only the new/missing template blocks; additive-only). |
| `log-session` | `/log-session [note]` | The optional note is prepended to the entry's Summary. |
| `plan-feature` | `/plan-feature <NN-slug \| #N> \| --from-issue N \| --scaffold <slug> \| --next` | A slug or issue reference is auto-detected; flags force a path: `--from-issue N` (issue → scoped product half), `--scaffold <slug>` (straight to engineering-half scaffolding), `--next` (next roadmap entry). An undesigned feature (roadmap row below `defined`) → stops and redirects to `/design-feature` — no bypass flag. |
| `loop-review-fold` | `/loop-review-fold <NN> \| --fix <n>` | Runs the simple review/fold router. It selects review or fold from persisted evidence, then routes unresolved findings to `/triage-issue --prioritize-now`; oversized work becomes new `P<n>` phases that the user executes manually. |
| `review-spec` | `/review-spec <NN-slug \| slug> [--repair]` | Reviews the Product half of one unit in a clean context. No args: reports what it can bind and stops — it never guesses a unit. `--repair` continues a recorded cycle instead of starting a new one. |
| `review-plan` | `/review-plan <NN-slug \| fix-<n>> [--repair]` | Reviews the frozen plan (feature or fix unit) in a clean context; requires the parent Product receipt for feature units. Same no-guessing and `--repair` rules as `/review-spec`. |
| `plan-fix` | `/plan-fix <issue-number> [<issue-number> …]` | One issue → one fix unit. Multiple issues → one compatible capability bundle or homogeneous mechanical batch when the whole set shares an outcome, verification plan, and atomic release/rollback. If the set fails, returns the fewest maximal compatible groups instead of splitting reflexively into one PR per issue. |
| `product-audit` | `/product-audit [path-or-area]` | Explicit invocation only. Defaults to the whole product; a path/area narrows the sweep. Proposes only — never fixes. |
| `resolve-repository-state` | `/resolve-repository-state <contradiction-id>` | Verifies both evidence sources and publishes the next frozen snapshot, or stops with explicit missing input. |
| `review-change` | `/review-change [path-or-glob] [--adversarial N]` | Defaults to the current change (branch diff vs the default branch); a path widens/narrows. `--adversarial N` → N independent, context-clean, diff-only adversarial reviewers in parallel, findings merged and deduped (opt-in; auto-recommended for `L`/sensitive changes). |
| `ship-roadmap` | `/ship-roadmap [--fullauto]` · `/ship-roadmap --continue [--fullauto]` | Default: opens PRs, the human merges. `--fullauto` must be present on each iteration and uses the repository wrapper after a fresh MERGE-READY verdict. `--continue` resumes one stage. |
| `triage-issue` | `/triage-issue <n> [n…] \| --prioritize-now <unit> F<k> [F<j>…]` | Issue batches produce independent verdicts plus one summary table; review-finding mode attempts every unresolved finding now and routes oversized work to `plan-feature`/`plan-fix` plus new manual phases. |
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
IDEA / undesigned SPEC ─▶ design-feature (product half + capability closure)
                          → `## Design status: designed`
                          → review-spec (clean context, read-only) ─▶ SPEC-REVIEW-PASS ─┐
                   ┌──────────────── plan-feature (router, engineering-planning only) ─┐
DESIGNED slug/SPEC ┤  --scaffold → plan-feature-scaffold (engineering half)            │
ISSUE(feature) ────┤  #N / --from-issue → plan-feature-from-issue                      ├─▶ execute-phase (all phases) ─▶ open PR (`done`) ─▶ loop-review-fold ─▶ audit-pr ─▶ merge
ROADMAP --next ────┘  registers the roadmap entry, prints the next step                │
                       (undesigned input → STOP, redirect to /design-feature, no bypass)

ISSUE(any) ─▶ triage-issue ─┬─ fix-now ─▶ plan-fix (compatible batch) ─▶ review-plan ─▶ execute-phase --fix ─▶ open PR (`done`) ─▶ loop-review-fold ─▶ audit-pr ─▶ merge
                            ├─ fix-in-unit ─▶ execute-phase <NN> P<k> / fold-findings (ledger row) / replan on the open unit
                            ├─ promote ─▶ plan-feature (router → from-issue) ─▶ (feature chain above)
                            ├─ postpone ─▶ dated comment, leave open
                            └─ wontfix ─▶ propose close

loop-review-fold ── persisted-state selection → review-change ↔ fold-findings;
                    unresolved findings → triage-issue → replan + manual phases;
review-change ── runs the applicable read-only reviews + classifies a change;
                 composes review-implementation + the platform's companion skills;
                 fix-now ─▶ folds into the open phase · replan-in-unit ─▶ new user-confirmed phases
                 decision-required ─▶ surface, block · proposals ─▶ user routes to triage-issue
audit-pr ─────── PR-level merge gate (merge-ready or blockers)
product-audit ── periodic product-wide sweep → proposes issues + roadmap changes
audit-docs ───── audits docs ↔ roadmap ↔ code ↔ fix index, anytime

ship-roadmap ─── AUTOPILOT around the whole feature chain: interview → founding →
                 roadmap → /loop { review-spec → plan-feature → review-plan → execute-phase (fresh cheap workers)
                 → PR → loop-review-fold → audit-pr → merge } → final report;
                 human at the merges (default) and at product-audit (always)
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
