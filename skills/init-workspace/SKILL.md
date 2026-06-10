---
name: init-workspace
user-invocable: true
version: 1.1.0
argument-hint: <target-dir>
model: opus
effort: high
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Bootstrap a project's way of working: fetch the agentic-workflow documentation
  scaffold (template/) and adapt it to THIS project by interview — fill the
  CLAUDE.md documentation map, gate commands and architecture, prune doc folders
  that don't apply, keep the SPEC/feature/fix and GitHub templates — then offer to
  install the skills. The adaptive counterpart to a raw `npx degit` copy. Triggers:
  "set up the agentic workflow here", "init-workspace", "scaffold this project's
  docs", "adapt the workflow template to this repo", "bootstrap the way of working".
---

# Init Workspace

Turn an empty or existing repo into one that works with the agentic workflow:
copy the generic scaffold, then **tailor it to this project** instead of leaving
raw placeholders.

## When to use

- Setting up a repo to use these skills and you want the documentation substrate
  (`CLAUDE.md` + `docs/` map + templates) adapted to the project, not just copied.
- Prefer this over a static `npx degit gtrabanco/agentic-workflow/template` when you
  want the gate commands, architecture, and doc domains filled in by interview.

## Step 0 — Discover the project (always first)

Inspect the target dir (`[target-dir]`, default cwd) before touching anything:

- Existing `CLAUDE.md` / `AGENTS.md` / `docs/` / `.github/`? If so, **do not
  clobber** — ask whether to merge, adapt in place, or abort.
- Detect the stack from manifests (`package.json`, `pyproject.toml`, `go.mod`,
  `Cargo.toml`, `Gemfile`, …) to *propose* gate commands and naming conventions.
- Note the git state (is it a repo, what's the default branch, and the **remote
  URL → forge**: github.com → GitHub/`gh`, gitlab → GitLab/`glab`, else ask).

## Process

1. **Preflight.** Confirm the target dir and the discovery findings. If scaffold
   files already exist, get an explicit decision before overwriting.
2. **Fetch the template.** `npx degit gtrabanco/agentic-workflow/template <dir>`
   (into the target if empty, else a temp dir to merge from). **`degit` can't read
   a private repo — it fails, or in `--mode=git` silently leaves an empty dir; for
   a private source, `git clone` via SSH and copy the `template/` subtree instead.**
3. **Interview to adapt** — small batched rounds, each with a recommended default
   drawn from Step 0; skip whatever discovery already answers:
   - **Project** — name + one-line purpose.
   - **Gate** — dev / build / test commands and the verification gate (proposed
     from the detected stack; confirm).
   - **Forge** — issue/PR tracker + CLI (proposed from the remote URL; confirm)
     → recorded in the Workflow conventions **Forge** line.
   - **Docs language.**
   - **Architecture** — pattern, layers/modules, and dependency-direction rules
     (stay architecture-agnostic; record the user's choice in `ARCHITECTURE.md`).
   - **Doc domains** — which of `providers/ brand/ domain/ business/
     infrastructure/ legal/ frontend/` apply. **Delete the folders that don't**
     (e.g. `frontend/` for a non-UI project).
   - **Naming conventions** and **MCP servers**, if any.
4. **Write the adapted scaffold.** Fill the `CLAUDE.md` placeholders (commands,
   the documentation map rows, architecture); keep `AGENTS.md`, the
   `features/_TEMPLATE` + `ROADMAP`, the `fix/_TEMPLATE` + `README`, and the
   `.github/` templates; prune unused doc folders and map rows. Leave honest
   placeholders where the user hasn't decided — never invent values.
5. **Offer the workflow skills.** Propose installing them:
   `npx skills add gtrabanco/agentic-workflow` (note the SSH/local-path variant if
   the source is private). Don't install without a yes.
6. **Suggest the companion review skills** the review/audit skills compose
   internally — only the ones the detected platform needs (from Step 0 + the doc
   domains chosen in step 3):
   - **Always:** `code-review`, `security-review`, `verify`, `tech-debt`.
   - **If UI** (web / mobile / TUI): `design-review`, `accessibility-review`,
     `brand-review`.
   - **If web:** `web-perf` and an SEO skill.
   - **Never** suggest UI / SEO / brand skills for a CLI, library, or infra
     project.
   Record the expected set in `CLAUDE.md` (a short "Companion review skills" note)
   so `review-change` and `product-audit` know what to compose — and so a missing
   one is a noted gap rather than a silent skip. Don't install without a yes.
7. **Report.** List what was created, which placeholders still need human input,
   the companion skills recorded/installed, and the next step: `plan-feature` →
   `execute-phase`.

## Guardrails

- **Never overwrite an existing `CLAUDE.md` or `docs/` without explicit consent.**
- Docs-only scaffolding; no app code, no dependencies installed unprompted.
- Architecture-agnostic: record the project's pattern, don't impose one.
- Honest placeholders over invented specifics; flag what's left to fill.
- Honor the project's **Workflow conventions** once present; on an existing repo,
  don't work on its default branch and never commit/push unless asked.

## Relationship to other skills

- `npx degit gtrabanco/agentic-workflow/template` — the static copy this skill
  adapts. Use that when you want the raw scaffold and will fill it yourself.
- `docs/workflow/PORTABLE_PROMPT.md` — regenerates the **skills** adapted to a
  project (behavior). This skill adapts the **substrate** (docs). Complementary.
- After init: `plan-feature` →
  `execute-phase`; run `audit-docs` to confirm the scaffold is coherent.

## Done when

- A tailored `CLAUDE.md` + `docs/` scaffold + `.github/` templates exist in the
  target, unused folders pruned, residual placeholders flagged, the platform's
  companion review skills are recorded (and offered), and the user knows how to
  install the skills and start the first feature.
