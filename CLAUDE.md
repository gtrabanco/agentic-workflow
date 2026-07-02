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
- No stack/real-project references leaked into the skills or shared docs.

---

## Conventions

| Type | Convention |
|---|---|
| Skill directories | kebab-case (`execute-phase`) |
| Markdown docs | kebab-case or SCREAMING_CASE per existing siblings |
| Skill `name:` | matches the directory name exactly |

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
