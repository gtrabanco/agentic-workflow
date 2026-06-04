# Agentic Workflow Skills

> 🇪🇸 [Versión en español](README.es.md)

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

## What's inside

```
skills/                  the 9 skills (one SKILL.md each) — the installable source
.claude/skills           symlink → ../skills, so this repo dogfoods them in Claude Code
template/                 the exportable documentation scaffold (the substrate the skills read)
docs/workflow/           the full tutorial (feature flow, issue flow, reference, replication)
docs/features/_TEMPLATE  feature SPEC template + ROADMAP (the planning artifacts skills produce)
docs/fix/                fix SPEC template + index
.github/                 issue + PR templates the workflow expects
```

The skills are the **behavior**; `template/` is the **substrate** they read (a
generic `CLAUDE.md` + documentation map, SPEC/feature/fix templates, and GitHub
templates). Scaffold a new project's way of working with
`npx degit gtrabanco/agentic-workflow/template my-project` — see
[`docs/workflow/REPLICATE.md`](docs/workflow/REPLICATE.md).

## The skills

### Setup
| Skill | What it does |
|---|---|
| `init-workspace` | Fetches the `template/` scaffold and **adapts it to your project** by interview (gate, doc map, architecture); offers to install the skills |

### Planning & creation
| Skill | What it does |
|---|---|
| `design-feature` | Interactive interview from a raw idea; proactively asks to fill the SPEC |
| `feature-from-issue` | Turns a feature-request issue into a scoped SPEC (wires `Closes #N`) |
| `plan-feature` | Scaffolds the SPEC + full planning artifact set; registers it in the roadmap (docs only) |

### Decision & review
| Skill | What it does |
|---|---|
| `triage-issue` | Classifies an issue (fix-now / promote / postpone / wontfix) by **verifying its trigger against the code** |
| `review-implementation` | Two-phase review (find → classify) ending in a decision table: fix-now / postpone / ignore / intentional-tradeoff |
| `audit-docs` | Audits docs ↔ roadmap ↔ code ↔ fix index for drift |

### Execution (compose with the above)
`execute-phase` (one phase, a small feature in a single pass, or a fix with
`--fix`), `draft-fix-spec` (draft a fix SPEC from an issue).

Companion skills for UI/UX and language-specific quality (design, ux, typing…)
are **not bundled** — they're domain-specific, so install them per project. See
`docs/workflow/RECOMMENDED_SKILLS.md` for which apply when.

## Recommended model & effort

Each skill **pre-sets its model** in frontmatter (table below) using a floating
tier alias (`opus`/`sonnet`/`haiku`) that auto-updates to the latest version — so
it never goes stale. The override applies only for that skill's turn; your session
model resumes afterward. **You stay in control:** to change a skill's model, edit
its `model:` line (or set `model: inherit` to follow your session). Effort is your
call per run.

| Skill | Model tier | Effort | Why |
|---|---|---|---|
| `init-workspace` | Opus | high | interview-driven project bootstrap + adaptation |
| `design-feature` | Opus | high | open-ended interview + design judgement |
| `feature-from-issue` | Opus | high | classify, translate, scope, map to the roadmap |
| `draft-fix-spec` | Opus | high | architect-level scoping + risk analysis |
| `triage-issue` | Opus | high | verify triggers against the code; judgement call |
| `review-implementation` | Opus | high | deep multi-axis review + classification |
| `plan-feature` | Opus | medium | structured artifact scaffolding from a scoped SPEC |
| `audit-docs` | Sonnet | medium | mostly mechanical cross-document checks (Opus for deep audits) |
| `execute-phase` | Sonnet | medium | mechanical implementation per SPEC — one phase or single-pass (Opus if the logic is subtle) |

> Rule of thumb: **planning, judgement and review → Opus, high effort**;
> **mechanical execution → Sonnet, medium** (bump to Opus when the logic is subtle).

## How to use them

Full tutorial in **[`docs/workflow/`](docs/workflow/README.md)**. In short:

### Build a feature
```
/design-feature   "<your idea>"        # or  /feature-from-issue <N>
        → interview / issue analysis → fills the SPEC
/plan-feature                          # scaffolds SPEC + PLAN + TASKS + … + roadmap entry
/execute-phase <NN> <phase>         # implement one phase at a time, gate-verified, one commit each
/review-implementation                 # findings + classified decision table (no refactor)
/code-review · /security-review · /verify
gh pr create --base main               # "Closes #N" if it came from an issue
```
See **[`docs/workflow/FEATURE_WORKFLOW.md`](docs/workflow/FEATURE_WORKFLOW.md)**.

### Handle an issue
```
/triage-issue <N>
   → reads the issue's "when to fix" trigger, verifies it against the current code
   → fix-now → draft-fix-spec → execute-phase --fix
     promote → feature-from-issue
     postpone → dated comment, leave open (no inline work)
     wontfix → propose close
```
See **[`docs/workflow/ISSUE_WORKFLOW.md`](docs/workflow/ISSUE_WORKFLOW.md)**.

### Review & classify a branch
```
/review-implementation                 # defaults to the current diff vs main; pass a path to narrow
```
See **[`docs/workflow/REVIEW_AND_CLASSIFY.md`](docs/workflow/REVIEW_AND_CLASSIFY.md)**.

## Core principles

1. **Docs drive the work** — every skill reads the project's guide, doc map,
   architecture, roadmap and style docs first, and respects them.
2. **Plan before code** — features get a SPEC + artifacts before a line is written.
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
# From the root of the TARGET repository — install all 9 skills:
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

## Recommended companion skills

`docs/workflow/RECOMMENDED_SKILLS.md` lists the **stack-agnostic** quality &
architecture skills worth having (e.g. `karpathy-guidelines`, `code-review`,
`security-review`, `simplify`, `skill-creator`, the `engineering:*` set), and —
crucially — which ones to **skip** for a given project (e.g. design skills for a
terminal program, `claude-api` with no LLM features).
