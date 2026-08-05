# Skill system reference

> 🇪🇸 [Versión en español](SKILLS.es.md)

The skills that make up the agentic workflow, grouped by role.

**17 user-facing skills** (one menu entry each) + **14 internal** steps composed
for you (the `plan-feature` router's two planning steps, the `review-change`
findings engine `review-implementation`, the `orchestration-envelope` contract,
the workflow's own 9-skill internal review pack: `review-code`,
`review-security`, `review-verify`, `review-debt`, `review-design`,
`review-a11y`, `review-brand`, `review-perf`, `review-seo`, and the repo-only
`bump-skill` maintenance helper). The 17 user-facing skills cover setup,
repository-state discovery/resolution, design, planning, execution, review,
audit, finding folds, docs generation, issue triage, roadmap shipping, session
logging, and workflow status.

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

## Plan

| Skill | Role | Hands off to |
|---|---|---|
| `plan-feature` | **Router, engineering-planning only.** Given an undesigned feature (no `## Design status: designed`), **STOPS and redirects** to `/design-feature <slug>` (no bypass flag). Given a designed feature or issue `#N` (issue → scoped product half → `design-feature` for thin issues), routes to fill the **engineering half**, **sizes the feature** (`XS/S/M/L`), then registers the roadmap entry | `execute-phase <NN> P1` (M/L and XS/S alike — XS/S phases live in the SPEC) |
| `plan-fix` | Architect-drafts a tightly-scoped fix SPEC from an issue; commits on a fix branch; stops for review | `execute-phase --fix` |

### Internal steps (hidden from the menu; composed for you)

| Skill | Role |
|---|---|
| `plan-feature-from-issue` | Feature-request issue → scoped SPEC product half (satisfies capability closure), with `Closes #N` (invoked by `plan-feature`) |
| `plan-feature-scaffold` | Fills the SPEC's **engineering half** + planning artifacts **scaled to the feature's size** (XS/S → SPEC-only; M/L → full set ending in a mandatory hardening phase); registers in roadmap (docs only) (invoked by `plan-feature`) |
| `review-implementation` | Two-phase find → classify → decision table (fix-now / replan-in-unit / decision-required / proposal); findings only, no refactor. `user-invocable: false` — the engine `review-change` composes (and `audit-pr` / `product-audit` reuse) |
| `orchestration-envelope` | The machine-envelope contract: canonical driver-injected system-prompt snippet, repair loop, and JSON schema. `user-invocable: false` — the piece an external driver injects, not a menu entry |
| `review-code` | Correctness + reuse/simplification/efficiency checklist over the diff. `user-invocable: false` — one axis of `review-change`'s internal review pack |
| `review-security` | OWASP-shaped security checklist over the diff. `user-invocable: false` — internal review pack |
| `review-verify` | Runtime-behavior verification checklist (does the change actually do what it claims). `user-invocable: false` — internal review pack |
| `review-debt` | Tech-debt / TODO / dead-code checklist over the diff. `user-invocable: false` — internal review pack |
| `review-design` | Architecture/layering-consistency checklist over the diff. `user-invocable: false` — internal review pack |
| `review-a11y` | Accessibility checklist over UI changes. `user-invocable: false` — internal review pack |
| `review-brand` | Brand/voice-consistency checklist over user-facing copy. `user-invocable: false` — internal review pack |
| `review-perf` | Performance-regression checklist over the diff. `user-invocable: false` — internal review pack |
| `review-seo` | SEO checklist over public-facing pages/routes. `user-invocable: false` — internal review pack |

## Execute

| Skill | Role |
|---|---|
| `execute-phase` | Execute one feature phase (default), a small `XS/S` feature in a single pass, or a fix (`--fix`); **tests-first** on domain/orchestration work, never commits red, P1 commits planning artifacts separately; **fresh conversation per phase under an explicit context budget** (≤ 10 full-file reads), handing off through `progress.md`'s fixed `Done / Remains / Gotchas / Files / Next` entry schema; branch safety + per-phase doc discipline + gate; **descope guard** (any issue created is classified discovered-work vs. descope — a descope STOPs for a user-approved, dated `## Amendments` entry before the issue may exist); **recommends a `review-change` checkpoint at trigger-based cadence — layer boundary, accumulation, or sensitivity (skippable) — and hands off once at the end (mandatory)**; a finished unit **always opens its PR and flips to `done`** (built, not merged) |

## Review & audit — *change → PR → product*

| Skill | Scope | Role | Hands off to |
|---|---|---|---|
| `review-change` | the **change** | Run only the reviews that apply to this platform — **each pass isolated by default** (context-clean, returns only its findings table; the orchestrator holds tables, never sources) — + a structural **SPEC drift check** (per-criterion coverage table + diff-hunk mapping) + classify → one decision table + manual-verification checklist; **mandatory before every merge** | `plan-fix` (fix-now) / `triage-issue` (independent proposals) |
| `fold-findings` | the **findings ledger** | Repair each fix-now finding from `review-change`/`audit-pr` for real, one at a time — frozen classification (never reclassifies), a fixed forbidden list closes the known-issues-dump/downgrade/test-loosening/suppression escape hatches; per-finding `FOLDED \| DISPUTED \| BLOCKED` verdict | re-run `review-change` (all folded) / `triage-issue` (disputed) |
| `audit-pr` | the **PR** | Read-first merge gate that **consumes the current `review-change` `REVIEW-PASS` receipt** (absent/stale → blocker routed to `/review-change`, never re-reviewed) → SHA-bound MERGE-READY comment or evidenced blockers; never edits or merges. Active `ship-roadmap --fullauto` is the only consumer allowed to execute an automated merge | `execute-phase` / `plan-fix` / `triage-issue` |
| `product-audit` | the **product** | Periodic full-spectrum health check; mines feature docs → proposes issues + roadmap add/remove (never auto-fixes); scope-export recurrence (≥ 2 consecutive units exporting scope → planning-quality finding routed to #64) | `triage-issue` / `plan-feature` / `plan-fix` |
| `audit-docs` | the **docs** | Audit docs ↔ roadmap ↔ code ↔ fix index for drift | report (+ optional low-risk fixes) |

> `review-change`'s findings engine is the internal `review-implementation`
> (`user-invocable: false`) — the two-phase find → classify pass it composes, and
> that `audit-pr` / `product-audit` reuse. It's not a menu entry; see
> [Internal steps](#internal-steps-hidden-from-the-menu-composed-for-you).

## Decide

| Skill | Role | Hands off to |
|---|---|---|
| `triage-issue` | Classify fix-now / fix-in-unit / promote / postpone / wontfix; a scope-membership check (before classification) routes an issue that already belongs to an open unit onto that unit's own branch; verify triggers vs. real code; accepts several issues in one batch | `plan-fix`, `execute-phase`/`fold-findings` (fix-in-unit), `plan-feature`, or a dated comment |

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
| `workflow-status` | **Read-only sensor for programmatic orchestration.** Computes the full project state — every feature/fix with its transitive dependency closure (met/unmet), the roadmap's five-state machine, what is startable now and in which build order, open PRs + audit state, pending fixes and findings awaiting triage — and emits it as one fixed JSON machine envelope. The piece an external driver calls between steps. Never edits anything | the driver's next invocation (it never hands off to another skill itself) |

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
| `execute-phase` | `/execute-phase <NN> [P<k>] \| --fix <n> [P<k>] \| [--force]` | `NN` alone → single-pass (XS/S SPEC-only features). `NN P<k>` → exactly one phase of an M/L feature. `--fix <n>` → implement the fix unit `docs/fix/<n>-*`. `--force` → override the dependency/status gate (user-only escape hatch; the override is recorded in `decisions.md`; the autopilot never passes it). |
| `fold-findings` | `/fold-findings [finding-id …]` | No args: repairs every fix-now (`folded: no`) row on the unit's `review-findings.md` ledger, one at a time. One or more finding IDs → restricts the queue to exactly those rows. |
| `generate-docs` | `/generate-docs [NN-slug \| fix-n \| path/glob] [--review]` | Scope defaults to the current branch's diff vs the default branch; a slug/fix/path narrows or redirects it. `--review` → additionally export the most recent `review-change` report as a docs page (opt-in, never automatic). |
| `init-workspace` | `/init-workspace [target-dir]` | Defaults to the current directory. On a repo that already has the scaffold it auto-switches to **upgrade mode** (proposes only the new/missing template blocks; additive-only). |
| `log-session` | `/log-session [note]` | The optional note is prepended to the entry's Summary. |
| `plan-feature` | `/plan-feature <NN-slug \| #N> \| --from-issue N \| --scaffold <slug> \| --next` | A slug or issue reference is auto-detected; flags force a path: `--from-issue N` (issue → scoped product half), `--scaffold <slug>` (straight to engineering-half scaffolding), `--next` (next roadmap entry). An undesigned feature (roadmap row below `defined`) → stops and redirects to `/design-feature` — no bypass flag. |
| `plan-fix` | `/plan-fix <issue-number> [<issue-number> …]` | Required, one or more. One number → drafts `docs/fix/<n>-<topic>/SPEC.md` on a fix branch and stops for review. Multiple numbers → a fixed shared-root-cause checklist decides: all-tick merges them into ONE unit keyed to the lowest number; any-fail refuses and prints the split (`/plan-fix <a>`, `/plan-fix <b>` …). |
| `product-audit` | `/product-audit [path-or-area]` | Explicit invocation only. Defaults to the whole product; a path/area narrows the sweep. Proposes only — never fixes. |
| `resolve-repository-state` | `/resolve-repository-state <contradiction-id>` | Verifies both evidence sources and publishes the next frozen snapshot, or stops with explicit missing input. |
| `review-change` | `/review-change [path-or-glob] [--adversarial N]` | Defaults to the current change (branch diff vs the default branch); a path widens/narrows. `--adversarial N` → N independent, context-clean, diff-only adversarial reviewers in parallel, findings merged and deduped (opt-in; auto-recommended for `L`/sensitive changes). |
| `ship-roadmap` | `/ship-roadmap [--fullauto]` · `/ship-roadmap --continue [--fullauto]` | Default: opens PRs, the human merges. `--fullauto` must be present on each iteration and uses the repository wrapper after a fresh MERGE-READY verdict. `--continue` resumes one stage. |
| `triage-issue` | `/triage-issue <n> [n…]` | One or many issue numbers — batch runs produce independent verdicts plus one summary table, grouped by home unit for any `fix-in-unit` verdicts. |
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
                          → `## Design status: designed` ─┐
                   ┌──────────────── plan-feature (router, engineering-planning only) ─┐
DESIGNED slug/SPEC ┤  --scaffold → plan-feature-scaffold (engineering half)            │
ISSUE(feature) ────┤  #N / --from-issue → plan-feature-from-issue                      ├─▶ execute-phase ─▶ open PR (`done`) ─▶ review-change ─▶ audit-pr ─▶ merge
ROADMAP --next ────┘  registers the roadmap entry, prints the next step                │
                       (undesigned input → STOP, redirect to /design-feature, no bypass)

ISSUE(any) ─▶ triage-issue ─┬─ fix-now ─▶ plan-fix ─▶ execute-phase --fix ─▶ open PR (`done`) ─▶ review-change ─▶ audit-pr ─▶ merge
                            ├─ fix-in-unit ─▶ execute-phase <NN> P<k> / fold-findings (ledger row) / replan on the open unit
                            ├─ promote ─▶ plan-feature (router → from-issue) ─▶ (feature chain above)
                            ├─ postpone ─▶ dated comment, leave open
                            └─ wontfix ─▶ propose close

review-change ── runs the applicable reviews + classifies a change (Stage 4, mandatory);
                 composes review-implementation + the platform's companion skills;
                 fix-now ─▶ folds into the open phase · replan-in-unit ─▶ new user-confirmed phases
                 decision-required ─▶ surface, block · proposals ─▶ user routes to triage-issue
audit-pr ─────── PR-level merge gate (merge-ready or blockers)
product-audit ── periodic product-wide sweep → proposes issues + roadmap changes
audit-docs ───── audits docs ↔ roadmap ↔ code ↔ fix index, anytime

ship-roadmap ─── AUTOPILOT around the whole feature chain: interview → founding →
                 roadmap → /loop { plan-feature → execute-phase (sonnet subagents)
                 → review-change → PR → audit-pr → merge } → final report;
                 human at the merges (default) and at product-audit (always)
```

## Design rules every skill follows

1. **Discover first.** Read the agent guide, documentation map, architecture,
   roadmap, and relevant domain/style docs before acting. Adapt to the project.
2. **Respect architecture & style.** Layer rules, domain/i18n/SEO/a11y rules,
   runtime/platform limits, naming conventions — all honored, not bypassed.
3. **Plan before code; one phase at a time; one PR per unit against the default
   branch; never `main`, never stacked.**
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
