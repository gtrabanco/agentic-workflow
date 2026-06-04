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
description: >
  One paragraph with concrete trigger phrases so the agent knows when to load it.
---
```

Body sections every skill follows: `When to use`, `Step 0 — Discover the project
(always first)`, `Process`, `Guardrails`, `Relationship to other skills`,
`Done when`.

> **`user-invocable: true` is mandatory.** Without it, the skill is not offered
> in the slash-command menu in this environment. Always set it explicitly.

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
