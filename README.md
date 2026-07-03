<p align="center">
  <img src="docs/assets/logo.svg" alt="Agentic Workflow logo" width="120" height="120">
</p>

<p align="center">
  <a href="https://www.youtube.com/watch?v=2Ai0NkTvoeM">
    <img src="https://img.youtube.com/vi/2Ai0NkTvoeM/mqdefault.jpg" alt="ship-roadmap opening a PR on a sample repository" width="280">
  </a>
  <br>
  <sub style="font-size: 0.75em;"><code>ship-roadmap</code> opening a PR end to end on a sample repository — click to watch</sub>
</p>

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
skills/                  the 25 skills (12 user-facing + 13 internal) — the installable source
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

**12 user-facing skills** (one menu entry each) + **13 internal** ones composed
for you: the `plan-feature` router's three planning steps, the `review-change`
engine, and the workflow's **own 9-skill internal review pack** (`review-code`,
`review-security`, `review-verify`, `review-debt`, `review-design`,
`review-a11y`, `review-brand`, `review-perf`, `review-seo`) — so **no external
review skill is ever required**, on any agent, with any model. One disciplined
path: **plan → execute → review → audit → merge.**

### Setup

| Skill            | What it does                                                                                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init-workspace` | Fetches the `template/` scaffold and **adapts it to your project** by interview (gate, doc map, architecture); suggests the companion review skills your platform needs; offers to install the skills |

### Plan

| Skill          | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plan-feature` | **One entry point to plan a feature.** Detects the input — a raw idea (interview), an issue `#N` (issue → scoped SPEC), or a scoped slug/SPEC (straight to scaffolding) — routes to the right step, then registers the roadmap entry. `--next` plans the next roadmap item. **Sizes every feature** (`XS/S/M/L`): small ones get a SPEC-only, single-pass path — no artifact ceremony; M/L get the full set with a mandatory hardening phase. |
| `plan-fix`     | The fix-flow counterpart: architect-drafts a tightly-scoped fix SPEC from an issue, commits on a fix branch, **stops for review**.                                                                                                                                                                                                                                                                                                            |

> You only ever call `plan-feature`; it composes the internal steps
> `plan-feature-interview`, `plan-feature-from-issue`, and `plan-feature-scaffold`
> (hidden from the menu).

### Execute

| Skill           | What it does                                                                                                                                                                                                                                                                                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `execute-phase` | Implements one phase of a feature (default), a small `XS/S` feature in a single pass, or a fix (`--fix`). **Dependency gate first**: the unit's transitive `Depends on:` closure must be merged, or it stops with the unmet chain and build order (`--force` overrides, logged). **Tests-first** on domain/orchestration work, never commits red, gate-verified, one commit per phase; **hands off to `review-change` every 2 phases and once at the end (mandatory)**. A finished unit **always opens its PR and flips to `done`** (built, not merged). |

### Review & audit — _change → PR → product_

| Skill           | Scope           | What it does                                                                                                                                                                                   |
| --------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `review-change` | the **change**  | Runs only the reviews that **apply to your platform** (code, security, verify, design, a11y, brand, perf, SEO) and classifies → one decision table + an explicit manual-verification checklist |
| `audit-pr`      | the **PR**      | Merge gate: acceptance met, all phases done, docs/tests/CI green, `Closes #N`, review axes clean → **merge-ready or a list of blockers**                                                       |
| `product-audit` | the **product** | Periodic full-spectrum health check; mines feature docs → proposes issues + roadmap add/remove (**never auto-fixes**)                                                                          |
| `audit-docs`    | the **docs**    | Audits docs ↔ roadmap ↔ code ↔ fix index for drift                                                                                                                                             |

> `review-change`'s findings engine is the internal `review-implementation` — the
> two-phase find → classify pass it composes (and `audit-pr` / `product-audit`
> reuse) — plus the internal review pack: one `review-*` skill per axis, each a
> fixed checklist returning a findings table + PASS|FAIL. None are menu entries;
> you reach them through `review-change`.

### Decide

| Skill          | What it does                                                                                               |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| `triage-issue` | Classifies an issue (fix-now / promote / postpone / wontfix) by **verifying its trigger against the code** |

### Session

| Skill         | What it does                                                                                                                                                                                                                                                                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `log-session` | Appends a structured entry to `docs/LOGS.md` — what the session did, files touched, decisions + _why_, and the next step — so you (or anyone) can resume cold. Run it before `/clear` or before closing. The `template/` also ships **free, opt-in hooks** that auto-append a mechanical entry on `/clear`/exit and can re-inject the last entry on start. |

### Repo maintenance

| Skill        | What it does                                                                                                                                                                                                                                                                                                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bump-skill` | After editing a skill in this repo: bumps `version:` in the SKILL.md frontmatter, adds rows to CHANGELOG.md + CHANGELOG.es.md, and updates the skill and model tables in README.md + README.es.md. Also **lints the repo's authoring rules** (every skill closes with a `→ Next:` block; phases are `P1, P2, …`, never `S1`/"Steps"). Run before every commit that touches a skill. |

### Autopilot — the whole flow, end to end

| Skill          | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ship-roadmap` | **Builds the whole app from the roadmap.** One upfront interview (product, features, stack, architecture — recommended _proportionally_, never defaulting to a named pattern — quality bars, ops, autonomy, budget), founds the project if needed, creates or adopts the complete roadmap, then a `/loop`-driven build loop ships it feature by feature through the skills above — **with no further questions**. Default: opens PRs, you merge; `--fullauto` merges MERGE-READY PRs under non-negotiable safety floors. Ends with a final report: issues to open, discovered feature proposals, manual checks, product-audit cadence. |

How the autopilot runs the workflow — one interview in, reviewed PRs out, and
you only step in to merge (amber):

```mermaid
flowchart LR
    I([Interview]):::you --> RM[Roadmap] --> P[Plan]
    P --> X[Execute] --> RV[Review] --> PR[Open PR] --> A[Audit] --> M([Merge]):::you
    M -->|next feature| P
    M -.->|roadmap done| REP[Final report]
    classDef you fill:#f6c177,stroke:#8a5a00,color:#3a2406;
```

The same `plan → execute → review → audit → merge` path you'd run by hand — the
autopilot just moves you to its edges. Under `--fullauto`, `ship-roadmap` also
handles the merges, under non-negotiable safety floors.

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

## Recommended model & effort

Each skill **pre-sets its model and effort** in frontmatter (table below). The
model uses a floating tier alias (`opus`/`sonnet`/`haiku`) that auto-updates to the
latest version — so it never goes stale. Both apply only for that skill's turn;
your session model/effort resume afterward. **You stay in control:** to change
them, edit the skill's `model:` / `effort:` lines (or `model: inherit` to follow
your session).

**On agents other than Claude Code** these frontmatter fields are ignored — and
that's covered: every user-facing skill ships a **Portability** section with
explicit fallbacks (no slash menu → follow the target `SKILL.md` in a fresh
conversation; no model tiers → strongest model for planning/review/audit,
cheaper for execution; no `/loop`/subagents → manual re-invocation guided by
each skill's closing `→ Next:` block). The workflow is the contract; the Claude
Code features are conveniences.

| Skill            | Model tier | Effort | Why                                                                                                                                                                                      |
| ---------------- | ---------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init-workspace` | Opus       | high   | interview-driven project bootstrap + adaptation                                                                                                                                          |
| `plan-feature`   | Opus       | high   | router + planning: its internal interview/scoping steps run **in its turn**, so the router must carry the effort (composed skills inherit the turn's effort)                             |
| `plan-fix`       | Opus       | high   | architect-level scoping + risk analysis                                                                                                                                                  |
| `execute-phase`  | Sonnet     | medium | mechanical implementation per SPEC — one phase or single-pass (Opus if the logic is subtle)                                                                                              |
| `review-change`  | Opus       | high   | platform-adaptive review orchestration + synthesis                                                                                                                                       |
| `audit-pr`       | Opus       | high   | whole-PR merge-readiness judgement                                                                                                                                                       |
| `product-audit`  | Opus       | max    | product-wide multi-axis sweep + proposals (max effort for the widest context sweep)                                                                                                      |
| `audit-docs`     | Sonnet     | medium | mostly mechanical cross-document checks (Opus for deep audits)                                                                                                                           |
| `triage-issue`   | Opus       | high   | verify triggers against the code; judgement call                                                                                                                                         |
| `log-session`    | Sonnet     | medium | structured summarization, not judgement — deliberately the cheap tier, never Opus (the `.claude/` hooks do the mechanical capture for free)                                              |
| `ship-roadmap`   | Opus       | high   | the autopilot conductor: composes the planning/review/audit skills in-turn (equal tier) and delegates implementation to Sonnet subagents — judgment stays strong, bulk tokens stay cheap |

> The 13 internal skills aren't selected directly. Because they're composed
> **within a caller's turn**, they inherit that turn's model/effort (a skill's
> `model`/`effort` is fixed at turn start) — the values in their frontmatter
> (`review-implementation`, `plan-feature-interview`, `plan-feature-from-issue`,
> `review-code`, `review-security` high; `plan-feature-scaffold` and the rest of
> the review pack medium) are declared defaults for a direct run, which is why
> the `plan-feature` and `review-change` orchestrators themselves carry `high`.
>
> Rule of thumb: **planning, judgement, review and audit → Opus** (high, or max for
> the product-wide sweep); **mechanical execution → Sonnet, medium** (bump to Opus
> when the logic is subtle).

### Model equivalence (non-Claude / free-inference models)

Claude tiers are the **default** (they set the reference bar), but nothing in the
workflow depends on them — the skills are model-agnostic. Map the tiers to
whatever family you run and edit each skill's `model:`/`effort:` accordingly:

| Claude default | Capability class | Use it for |
|---|---|---|
| Opus + `high`/`max` | **Frontier reasoning** — the strongest model you have, reasoning/thinking mode on | planning, review, audit, triage, the merge gate |
| Sonnet + `medium` | **Mid workhorse** — a solid coding model at default settings | mechanical execution per SPEC, doc checks, session logs |
| Haiku | **Small & cheap** — any fast lightweight model | optional grep-shaped evidence gathering |

**Concrete picks** (open-weight, as of **July 2026** — this landscape moves
fast; sanity-check against a current leaderboard before pinning):

- **Frontier reasoning** (⇔ Opus + `high`/`max`): **DeepSeek V4** (tops
  LiveCodeBench/Codeforces among open models), **Kimi K2.6** (strongest for
  agentic/repo-level coding and tool use), **GLM-5.x / GLM-4.7 Thinking**,
  **Qwen3 235B-A22B** — run in reasoning/thinking mode. Closed non-Claude
  equivalents: the top GPT / Gemini reasoning tier.
- **Mid workhorse** (⇔ Sonnet + `medium`): **DeepSeek V3.2** (the value pick
  via API), **Qwen3-Coder / Qwen3 32B**, **GLM-5.1**, or any of the frontier
  picks with reasoning mode off.
- **Small & cheap** (⇔ Haiku): **Qwen3 4–14B**, **Mistral Small 3.1**,
  **Gemma 3 27B**, **Phi-4-mini** — local-friendly, fine for grep-shaped work.

#### <img src="docs/assets/nan-cloud.svg" alt="NaN Cloud logo" width="20" height="19"> Running on [NaN.builders](https://cloud.nan.builders/r/7GK06FX8)

[NaN Cloud](https://cloud.nan.builders/r/7GK06FX8) serves the open-weight
frontier ([full catalog](https://nan.builders/docs/models): GLM-5.2 ~753B MoE ·
Mimo V2.5 310B · DeepSeek V4 Flash 284B · Qwen3.6 35B · Gemma4 26B) with
per-request **Thinking** toggle and **effort** control (Minimal → Max), which
maps 1:1 onto this workflow's tiers. Our picks per skill:

| Skill | NaN model | Thinking | Effort |
|---|---|---|---|
| `init-workspace`, `plan-feature`, `plan-fix`, `review-change`, `audit-pr`, `triage-issue` | **GLM-5.2** | on | High |
| `product-audit` | **GLM-5.2** | on | **Max** |
| `ship-roadmap` (conductor) | **GLM-5.2** | on | High |
| `execute-phase` (+ ship-roadmap's execution runs), `audit-docs`, `bump-skill` | **Qwen3.6** | off | Medium |
| `log-session`, evidence gathering | **DeepSeek V4 Flash** | off | Low |

Alternates: subtle implementation logic → bump `execute-phase` to GLM-5.2/High;
**Mimo V2.5** (a different family) reviewing Qwen-written code adds reviewer
independence; **Gemma4** swaps into the small tier. Whisper, Kokoro, Rerank,
Qwen3 Embedding and Flux 2 Klein are audio/retrieval/image models — not used by
the workflow. Sign up via [this referral link](https://cloud.nan.builders/r/7GK06FX8).

**If GLM-5.2 is down — fallback ladder:**

| # | Fallback | Config | Good for | Never for |
|---|---|---|---|---|
| 1 | **Mimo V2.5** (310B, reasoning, 1M ctx) | Thinking on, High (Max for `product-audit`) | **every** GLM-5.2 slot, including `audit-pr` and `product-audit`; as a cross-family reviewer it even adds independence | — |
| 2 | **Qwen3.6** (35B) | Thinking on, High | `plan-feature`, `plan-fix`, `init-workspace`, `triage-issue`, `ship-roadmap` conductor — their output is re-checked downstream by review/audit | `audit-pr` · `product-audit` · reviewing code Qwen3.6 itself wrote (≥ holds, independence doesn't) |
| 3 | **DeepSeek V4 Flash** (284B·21B active) | Thinking on, High | last-resort planning/triage when 1–2 are down | any verdict that gates a merge |
| — | **Gemma4** (26B) | — | small mechanical tier only | judgment, ever |

**The two merge-gating verdicts only run on tier 1 quality:** `audit-pr` and
`product-audit` may fall back to **Mimo V2.5** (Max effort), but never further
down — a mid-model sweep returns a *plausible-looking but shallow* report,
worse than no report. Both GLM-5.2 **and** Mimo V2.5 down → defer: the human
gates the merge manually, the product audit waits. Everything already at the
Qwen3.6/Flash tiers is unaffected by a GLM-5.2 outage.

**Prefer no model pinning at all?** Install the **`#inheritance` variant** —
the same skills, auto-synced to latest on every push, with every `model:` /
`effort:` field stripped so each skill **inherits your session's model and
effort**. Ideal for non-Claude agents or when you drive the model choice
yourself:

```sh
npx skills add gtrabanco/agentic-workflow#inheritance
```

`effort:` maps to your model's reasoning/thinking budget (`high` → maximum
reasoning; `medium` → default; no such control → just honor the strong/cheap
split above). Two invariants survive any mapping: **never review a change with a
model weaker than the one that wrote it**, and **audit verdicts (the merge gate)
get the strongest model you have**. Expect weaker models to follow the workflow
correctly — the skills are written as checklists and fixed output formats — but
produce shallower judgment; the discipline holds, the ceiling moves.

## How to use them

Full tutorial in **[`docs/workflow/`](docs/workflow/README.md)**. In short:

### Build a feature

```
/plan-feature "<your idea>"     # or  /plan-feature <N> (issue)  ·  /plan-feature --next (next roadmap item)
        → router detects idea / issue / scoped slug → interview · issue analysis · scaffold
        → fills the SPEC + PLAN + TASKS + … and registers the roadmap entry
/execute-phase <NN> <phase>     # one phase at a time, gate-verified, one commit each
        → review checkpoint every 2 phases (and mandatory at the end)
        → a finished unit always opens its PR + flips to `done` (built, not merged)
/review-change                  # mandatory: applicable reviews, classified; non-fix-now → triage-issue
/audit-pr                       # merge gate: merge-ready or blockers (never merge with pending docs)
        → human merges
```

See **[`docs/workflow/FEATURE_WORKFLOW.md`](docs/workflow/FEATURE_WORKFLOW.md)**.

### Handle an issue

```
/triage-issue <N>
   → reads the issue's "when to fix" trigger, verifies it against the current code
   → fix-now  → plan-fix → execute-phase --fix
     promote  → plan-feature   (the router takes the issue → scoped SPEC)
     postpone → dated comment, leave open (no inline work)
     wontfix  → propose close
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

### Build the whole app (autopilot)

```
/ship-roadmap                   # ONE interview (product, features, stack, architecture, autonomy, budget)
        → founds the project if needed, writes the complete roadmap, locks the run policy
/loop /ship-roadmap --continue  # the loop ships the roadmap feature by feature (add --fullauto to auto-merge)
        → plan → execute → review → PR → audit → (your merge) → next feature → … → final report
```

You only reappear at the merges (default) and at the final report.

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
# From the root of the TARGET repository — install all the skills:
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

# No model pinning — every skill inherits YOUR session's model and effort
# (same skills, auto-synced to latest; ideal for non-Claude agents):
npx skills add gtrabanco/agentic-workflow#inheritance

# Pin a version: install from a tagged release (or any tag/branch) with #<ref>:
npx skills add gtrabanco/agentic-workflow#release-2026-07-02
#   …then `npx skills experimental_install` restores the exact set from skills-lock.json.
#   See CHANGELOG.md → "Installing & pinning a version" for how pinning works.
```

### Installing on Hermes Agent (desktop & terminal)

Hermes only scans **`~/.hermes/skills/`** (its "source of truth") plus any
`external_dirs` you add in `~/.hermes/config.yaml` — it does **not** scan the
project-scope paths the `skills` CLI writes by default (`./.hermes/skills/`,
`./.agents/skills/`). That's why a plain project install "isn't detected".
Desktop app and terminal share the same mechanism. Category subfolders
(`skills/devops/<skill>/`) are optional — flat `<skill>/SKILL.md` folders are
detected fine.

```sh
# Install (use the inheritance variant — Hermes ignores model:/effort: anyway,
# so let the skills inherit whatever model your Hermes session runs):
npx skills add gtrabanco/agentic-workflow#inheritance --agent hermes-agent --global -y
#   → copies each skill to ~/.hermes/skills/<skill>/  ✔ detected by desktop & terminal

# Update later:
npx skills update --global
#   …then start a NEW session (/reset in terminal, or restart the desktop app) —
#   Hermes loads skills at session start; add --now in Hermes to bust the prompt
#   cache immediately (costs extra tokens).
```

Per-project alternative: keep a project-local install and point Hermes at it in
`~/.hermes/config.yaml`:

```yaml
skills:
  external_dirs:
    - /path/to/your-project/.agents/skills
```

(Local `~/.hermes/skills/` wins on name collisions; missing dirs are silently
skipped.) Pick your session model per the [model-equivalence table](#model-equivalence-non-claude--free-inference-models)
— on NaN.builders, per the picks above.

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
| [gtrabanco/ship-lab](https://github.com/gtrabanco/ship-lab) | json2csv CLI — built end-to-end with the `ship-roadmap` autopilot     |
| [gtrabanco/bingo-ev](https://github.com/gtrabanco/bingo-ev) | Started with vibecoding, migrated to the workflow once it was working |
