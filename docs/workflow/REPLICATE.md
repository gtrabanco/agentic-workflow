# Replicate in any project

Replicating the workflow has **two halves**: the documentation **scaffold** (the
substrate the skills read) and the **skills** themselves (the behavior).

## Half 1 — the documentation scaffold (`template/`)

The skills operate on a project's documentation substrate: the documentation map,
the SPEC/feature/fix templates, and the conventions. This repo ships that
substrate as a generic, copyable scaffold in `template/`:

```sh
# Scaffold a new project's way of working (CLAUDE.md, docs/ tree, .github templates):
npx degit gtrabanco/agentic-workflow/template my-project
```

Then fill in the placeholders in `CLAUDE.md` (commands, the documentation map,
your architecture) and delete the doc folders you don't need (e.g. `frontend/`
for a non-UI project). The skills read this scaffold at runtime, so the two halves
fit together.

## Half 2 — the skills

Two ways to install the skills into a repo. They're complementary.

| Method | What you get | When to use |
|---|---|---|
| **`skills` CLI** | The 13 skills (10 user-facing + 3 internal) copied (or symlinked) **verbatim** into the target agent's skills dir | You want the exact same skills, fast, deterministic, on any agent |
| **Portable prompt** | The 13 skills **regenerated, adapted** to the target repo's docs/architecture | You want them tuned to a different project's conventions |

The set is **13 skills — 10 user-facing + 3 internal**:

- **User-facing (10):** `init-workspace`, `plan-feature`, `plan-fix`,
  `execute-phase`, `review-implementation`, `review-change`, `audit-pr`,
  `audit-docs`, `product-audit`, `triage-issue`.
- **Internal (3):** `plan-feature-interview`, `plan-feature-from-issue`,
  `plan-feature-scaffold` — hidden from the menu and invoked by the
  `plan-feature` router, which detects the input (raw idea → interview, issue →
  from-issue, scoped slug/SPEC → scaffold) and dispatches to the right engine.

## Method 1 — `skills` CLI (deterministic)

The [`skills`](https://github.com/vercel-labs/skills) CLI reads the `SKILL.md`
files straight from this repo and installs them into whatever agent you use. It
auto-detects installed agents (Claude Code, Cursor, Codex, OpenCode, Cline, and
[70+ more](https://skills.sh)) and writes each skill into that agent's skills
directory — `.claude/skills/` for Claude Code, `.agents/skills/` for the
universal set, etc.

```sh
# From the root of the TARGET repository — install all 13 skills:
npx skills add gtrabanco/agentic-workflow

# This repo is PRIVATE. The shorthand above can fail under bunx; use the SSH URL:
npx skills add git@github.com:gtrabanco/agentic-workflow.git

# Useful flags:
#   --skill <name>     install only specific skills (repeatable)
#   --agent <name>     target specific agents (repeatable; e.g. claude-code, cursor, codex)
#   --global, -g       install for the current user instead of the current project
#   --copy             copy files instead of symlinking
#   --list, -l         list the skills the source exposes, then exit
#   --yes, -y          non-interactive

# Manage them afterwards:
npx skills list
npx skills update
npx skills remove <name>
```

No npm publish, no registry, no build step — the CLI clones the repo and places
the skill folders for each agent. Adding a skill to this system is just adding a
`skills/<name>/SKILL.md`; the CLI picks it up automatically with no manifest to
maintain.

After installing, the skills work immediately because they **discover the target
project at runtime** (agent guide, documentation map, architecture, roadmap, fix
index). Nothing in them is hardcoded to this repo's paths.

> **Single skill / different ref.** The source accepts a path to one skill
> (`.../tree/main/skills/plan-feature`), a full git URL, or a local path
> (`npx skills add ./path/to/agentic-workflow`). See the `skills` README for all
> source formats.

## Method 2 — Portable prompt (adaptive)

[`PORTABLE_PROMPT.md`](PORTABLE_PROMPT.md) contains a prompt you paste into
Claude Code (or any capable coding agent) from the target repo's root. It:

1. Discovers that project's conventions (branch rules, gate commands, docs
   language, SPEC/roadmap/fix layout, architecture, style).
2. Creates the skills adapted to those conventions.
3. Writes a `docs/workflow/` copy using the project's real paths and commands.
4. Composes with whatever execution/review skills already exist there.

Use this when the target project's structure differs enough that you'd rather the
skills be re-tuned than copied.

## Which should I use?

- Same stack / similar repo → **`skills` CLI** (Method 1). The skills adapt at
  runtime anyway.
- Different stack, or you want the docs/workflow copy written in the project's own
  terms → **prompt** (Method 2).
- Belt and suspenders → install with the CLI, then run `audit-docs` to
  confirm the skills line up with the new project's docs.

## What "respect the project" means here

Both methods produce skills that, at runtime, **read and obey the target
project's** architecture rules, documentation map, style guides, naming
conventions, money/i18n/SEO/a11y/security rules, and verification gate. The
workflow shape stays constant; the specifics always come from the project you're
in.
