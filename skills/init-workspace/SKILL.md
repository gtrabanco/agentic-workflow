---
name: init-workspace
user-invocable: true
version: 1.8.0
argument-hint: <target-dir>
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Bootstrap a project's way of working: fetch the agentic-workflow documentation
  scaffold (template/) and adapt it to THIS project by interview — fill the
  CLAUDE.md documentation map, gate commands and architecture, prune doc folders
  that don't apply, keep the SPEC/feature/fix and GitHub templates — then offer to
  install the skills. The adaptive counterpart to a raw `npx degit` copy. On Claude Code and want hand-tuned per-skill model/effort tiers? Install the `#claude` branch instead (`npx skills add gtrabanco/agentic-workflow#claude`) — see the README. This branch is model-agnostic: the skill inherits whatever model and effort your agent session is already using.
  Triggers:
  "set up the agentic workflow here", "init-workspace", "scaffold this project's
  docs", "adapt the workflow template to this repo", "bootstrap the way of working".
---

# Init Workspace

Turn an empty or existing repo into one that works with the agentic workflow:
copy the generic scaffold, then **tailor it to this project** instead of leaving
raw placeholders.

## Turn contract — verify before ending the turn

```
✓ The adapted scaffold is written (or the merge/abort decision was asked) and remaining placeholders are listed
✓ Nothing was installed or overwritten without an explicit yes
✓ Artifact language: explicit user instruction > the project's declared docs language > English. The CONVERSATION language never decides — a Spanish prompt still produces English PRs/issues/commits/SPECs unless one of the first two says otherwise
✓ The closing `→ Next:` block is printed, then the machine envelope (fenced ```json — see ## Machine envelope) as the ABSOLUTE last output
```

About to end the turn with any box unchecked? The turn is NOT done — complete
the missing box first (weak models drop end-of-document duties; this list is
first on purpose).

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
   - **Git workflow** — how parallel work is handled: **branches** (default —
     one active unit at a time, sequential, plain `git switch -c`) or
     **worktrees** (parallel units in separate checkouts; only if the user's
     agent/tooling manages them). Recorded in the Workflow conventions
     **Git workflow** line; every skill that creates branches honors it.
   - **Docs language.**
   - **Architecture** — pattern, layers/modules, and dependency-direction rules
     (stay architecture-agnostic; record the user's choice in `ARCHITECTURE.md`).
   - **Doc domains** — which of `providers/ brand/ domain/ business/
     infrastructure/ legal/ frontend/` apply. **Delete the folders that don't**
     (e.g. `frontend/` for a non-UI project).
   - **Performance tooling** — detect what the stack offers, one slot at a
     time (fixed checklist, first match per slot; record `none` explicitly
     when nothing fits — never leave the slot undiscussed):
     - *Static complexity lint*: Biome present → enable its `complexity`
       group (incl. `noExcessiveCognitiveComplexity`); ESLint present →
       suggest `eslint-plugin-sonarjs` + `eslint-plugin-unicorn`; neither →
       ask for the stack's equivalent or record `none`.
     - *Benchmark harness*: Vitest → `vitest bench`; Bun runtime → `mitata`;
       Node → `tinybench`/`mitata`; other stacks → ask for the project's
       benchmark command or record `none`.
     - *Profiler*: Node → `node --cpu-prof` (zero-dependency default) or `0x`
       via the project's package runner; Bun → `bun --inspect` CPU profiling;
       other → ask or record `none`.
     (The named tools are the TS/JS **adapter examples**; the contract is the
     generic block below.) Offer installation — **the user confirms each
     dependency; never install silently** — and register the outcome in the
     template's `Performance commands` block next to the verification gate,
     so `review-perf` can measure instead of guess.
   - **Docs site** — does the project have (or want) a developer docs website
     the `generate-docs` skill can write into? If yes, fill the template's
     `Docs site` block in `CLAUDE.md` (format: starlight/docusaurus/markdown,
     content dir, build command, optional knowledge-map command — proposed
     from discovery: an `astro.config.*` + `@astrojs/starlight` dependency
     means Starlight). If no, leave the block commented out — `generate-docs`
     then reports NOT-CONFIGURED instead of guessing. Never scaffold the
     website itself.
   - **Naming conventions** and **MCP servers**, if any.
4. **Write the adapted scaffold.** Fill the `CLAUDE.md` placeholders (commands,
   the documentation map rows, architecture); keep `AGENTS.md`, the
   `features/_TEMPLATE` + `ROADMAP`, the `fix/_TEMPLATE` + `README`, and the
   `.github/` templates; prune unused doc folders and map rows. Leave honest
   placeholders where the user hasn't decided — never invent values.
5. **Offer the workflow skills.** Propose installing them:
   `npx skills add gtrabanco/agentic-workflow` (note the SSH/local-path variant if
   the source is private). Don't install without a yes.
6. **State that reviews are self-contained; offer optional extras.** The
   workflow ships its **own internal review pack** (`review-code`,
   `review-security`, `review-verify`, `review-debt`, `review-design`,
   `review-a11y`, `review-brand`, `review-perf`, `review-seo`) — it installs
   with the skills and covers every review axis, so **no external review skill
   is required on any agent**. If the user wants platform-specific extras (a
   framework skill, a stack-specific security skill), record them in `CLAUDE.md`
   under a short "Optional review extras" note so `review-change` and
   `product-audit` run them **in addition** — never as a dependency. Don't
   install anything without a yes.
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

## Machine envelope

Every invocation ends with the **machine envelope** — schema, field rules and
placement per the installed `orchestration-envelope` skill: one fenced
```json block, printed **after** the closing block above, as the **absolute
last output** of the turn (external orchestrators parse the LAST fenced json
block; see `docs/workflow/ORCHESTRATION.md`). All top-level keys always
present; values only from verified command output, never invented.

This skill emits:

- **`state`:** `OK` (scaffold adapted / installed per the user's answers) or
  `NEEDS_INPUT` (an interview decision is pending — `needs_input` filled).
- **Fields:** `unit.type: "docs"`; `next.recommended` = `/plan-feature` (or
  `/ship-roadmap` when the user asked for the autopilot), `tier: "strong"`.
- `detail`: `{"scaffold_written": [paths], "skills_installed": true|false}`.

## Portability (agents other than Claude Code)

The workflow is the contract; Claude Code features are conveniences. On an
agent that lacks one, apply the fallback — never skip the step the feature
enables:

- **No slash-command menu** — where this skill says `/<skill>`, open that
  skill's `SKILL.md` (wherever your agent installed the skills) and follow it
  literally, in a fresh conversation: hand-offs assume a clean context.
- **No per-skill `model:`/`effort:`** — on the `#claude` branch the frontmatter pins these tiers; here, pick tiers yourself:
  the interview and adaptation are judgment work — run them on your
  **strongest** model.
- **No Claude Code hooks** — the template's `.claude/` auto-logging hooks are
  Claude Code-specific; on other agents skip that offer and note that
  `log-session` is the manual alternative.

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
  companion review skills are recorded (and offered).
- **The closing `→ Next:` block is printed** (plus the offer to install the skills):

  ```
  → Next: /plan-feature — plan the first feature
    · raw idea → /plan-feature "<idea>"   · next roadmap entry → /plan-feature --next
    · confirm the scaffold is coherent → /audit-docs
  ```
