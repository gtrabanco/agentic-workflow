# Changelog

Skills are versioned **independently**: each `skills/<name>/SKILL.md` carries its
own `version:` (semver) in frontmatter and bumps on its own cadence. This file
records those bumps, grouped by release date, newest first.

> The `skills` CLI installs from this repo and pins what a consumer installed by
> content hash in their `skills-lock.json`; `npx skills update` moves a skill to
> the latest version published here. The per-skill `version:` is the human- and
> agent-readable source of truth (the CLI ignores unknown frontmatter keys).

## Versioning policy (per skill)

- **major** — a breaking change to how you invoke or rely on the skill: a rename,
  a removed/renamed flag, a changed contract or output shape, or a moved
  responsibility. Consumers must read the migration note.
- **minor** — new capability or option that is backward compatible (a new flag, an
  added section, a new routing case).
- **patch** — wording, examples, clarifications, internal tidy-ups; no behavior
  change.

Renames are **major** and ship with a migration note — see
[`docs/workflow/MIGRATION.md`](docs/workflow/MIGRATION.md).

---

## 2026-06-05 — revert context: fork (output suppressed in CLI)

- `audit-docs` `1.0.1` → `1.0.2` — remove `context: fork`: the CLI suppresses
  the subagent's output, leaving the skill silent. Reverted until the feature
  works end-to-end.
- `audit-pr` `1.0.1` → `1.0.2` — same reason.
- `product-audit` `1.0.2` → `1.0.3` — same reason.

## 2026-06-09 — product-audit upgraded to Fable 5

- `product-audit` `1.0.3` → `1.1.0` (minor) — `model: opus[1m]` → `model: fable`.
  Fable 5 has native 1M context (no `[1m]` suffix needed), scores 80.3% on
  SWE-Bench Pro vs 69.2% for Opus 4.8, and is designed for exactly this use case:
  deep, long-horizon sweeps where depth matters more than speed. The suffix
  `fable[1m]` is not documented and unnecessary — Fable 5 always runs at 1M.
  Requires Claude Code ≥ v2.1.170.

## 2026-06-09 — batch follow-up: portable prompt + Deploy & rollback

- `docs/workflow/PORTABLE_PROMPT.md` — synced with the quality batch (it
  regenerates the skills in other projects, so it must describe the current
  contract): corrected the stale **10+3** count to **9 user-facing + 4
  internal**; added sizing, UI design reference, hardening phase, tests-first +
  execution protocols, SPEC drift, batch triage, and forge detection.
- Feature SPEC template (template/ + repo mirror) — new optional **Deploy &
  rollback** section (migrations order, feature flag, config changes, rollback
  path; explicit n/a when merging is enough).

## 2026-06-09 — quality batch: sizing, tests-first, SPEC drift, forge-agnostic

One coordinated batch from the skills review (token efficiency + product
quality), landed as atomic commits:

- **Size-aware planning.** The feature SPEC template gains a `Size` field
  (`XS/S/M/L`). `plan-feature-interview` `1.1.0` and `plan-feature-from-issue`
  `1.1.0` estimate it (plus a **UI design reference** question for features with
  a UI surface); `plan-feature-scaffold` `1.1.0` scales the artifacts — XS/S →
  SPEC-only single-pass (no ceremony), M/L → full set whose `PLAN.md` **always
  ends in a hardening phase**; `plan-feature` `1.1.0` routes and prints the right
  next step. Small features from issues now have a first-class lightweight path.
  Internal-step descriptions shortened (always-loaded context).
- **`execute-phase` `1.2.0`** — tests-first on core/domain + orchestration
  phases (SPEC dev scenarios = the test list, red → green); P1 commits planning
  artifacts separately (fixes them landing untracked on `main`); gate-red
  protocol (never commit red; unfixable-in-scope → `known-issues.md` + stop);
  plan-divergence rule (update TASKS/PLAN + `decisions.md`, never silently
  diverge); reads `progress.md` for continuity; same-session shortcut skips
  re-reading unchanged planning docs between consecutive phases.
- **`review-change` `1.1.0`** — SPEC drift check: diff vs. the governing SPEC's
  scope and acceptance criteria, at every checkpoint (cheaper than catching it
  at the `audit-pr` gate).
- **`triage-issue` `1.1.0`** — batch triage (`triage-issue 12 14 17`):
  independent verdicts, one summary table.
- **Forge-agnostic.** Template `CLAUDE.md` Workflow conventions declare the
  **Forge** (GitHub/`gh` | GitLab/`glab` | other); `init-workspace` `1.1.0`
  detects it from the remote URL and records it. Skills running forge commands
  (`plan-fix` `1.0.1`, `audit-pr` `1.0.3`, `audit-docs` `1.0.3`, plus the
  already-bumped `plan-feature-from-issue`, `triage-issue`, `execute-phase`)
  now say "forge CLI per Workflow conventions" with `gh` as the canonical
  example — GitHub usage is unchanged.
- **`review-implementation` `1.0.1`** — description shortened 96 → 36 words
  (it sits in context every session; the body still owns the axes + rubric).
- Repo's own feature SPEC template: removed leaked real-project positioning
  wording.

## 2026-06-09 — execute-phase /loop pattern documented

- `execute-phase` `1.1.1` → `1.1.2` (patch) — add "Batch execution with `/loop`"
  section: goal-based invocation pattern that runs all phases unattended and
  terminates naturally when `TASKS.md` is fully checked; notes that review
  checkpoints are skipped and `/review-change` should be run once at the end.

## 2026-06-05 — execute-phase explicit commits + allowed-tools

- `execute-phase` `1.1.0` → `1.1.1` (patch) — two fixes for the "skill doesn't
  commit" symptom: (1) add `allowed-tools: [Bash, Read, Edit, Write, MultiEdit]` so
  git/gh commands are pre-approved for the skill's turn instead of prompting per
  operation; (2) rewrite commit and PR steps from descriptive ("Commit") to imperative
  with actual commands (`git add … && git commit -m "…"`, `gh pr create …`) so the
  agent executes them rather than treating them as outcome descriptions.

## 2026-06-05 — context isolation + product-audit 1M context

- `product-audit` `1.0.1` → `1.0.2` — `model: opus` → `model: opus[1m]` (sweeps
  the entire codebase; 1M context hardcoded so it never silently truncates on large
  repos, regardless of session settings); add `context: fork` (runs as an isolated
  subagent — doesn't consume or contaminate the main conversation context).
- `audit-pr` `1.0.0` → `1.0.1` — add `context: fork` (reads PR + SPEC + all
  planning artifacts + CI; autocontained work that should not fill the main context).
- `audit-docs` `1.0.0` → `1.0.1` — add `context: fork` (cross-document scan across
  the whole docs tree; isolated context keeps the main conversation clean).

## 2026-06-05 — skill composition → hand-off

- `execute-phase` `1.0.0` → `1.1.0` (minor) — the every-2-phases review changes
  from an **in-turn auto-run** of `review-change` to a **hand-off**: execute-phase
  stops at the checkpoint and suggests `/review-change`, so it runs at its own
  `opus`/`high` instead of execute-phase's `sonnet`/`medium`. A skill's model/effort
  is fixed at turn start and doesn't change when it composes another skill mid-turn,
  so composing across that model boundary was under-powering the review.
- `review-change` `1.0.0` → `1.0.1` (patch) — wording: `execute-phase` "hands off
  to" it (not "calls"/"triggers").
- `product-audit` `1.0.0` → `1.0.1` (patch) — add a provisional tip that, for the
  broadest run, the *user* can enable `ultracode` (a Claude Code session setting —
  xhigh + multi-agent orchestration — **not** a frontmatter `effort:` value) so the
  sweep fans out across subagents.
- Authoring guide (`CLAUDE.md`): documented **"hand off, don't compose across a
  model/effort boundary"** with the sanctioned same-model exceptions (orchestrators
  like `review-change`/`product-audit`; the `plan-feature` router), and noted that
  `ultracode` is a session setting, not an `effort:` value (`effort:` accepts
  low/medium/high/xhigh/max).

## 2026-06-05 — plan-feature 1.0.1

- `plan-feature` `1.0.0` → `1.0.1` (patch) — **effort `medium` → `high`.** The
  router composes its planning steps (`plan-feature-interview` / `-from-issue` /
  `-scaffold`) **within its own turn**, and a skill's `effort` is fixed at turn
  start (verified against the Claude Code skills + model-config docs) — so the
  internals' `high` never took effect and the whole planning ran at the router's
  `medium`. Raising the router to `high` powers the actual interview and scoping
  correctly.

## 2026-06-05 — first versioned release (all skills `1.0.0`)

Formal versioning starts here. Every skill is stamped `1.0.0`; from now on each
evolves independently under the policy above. The earlier consolidation from the
9-skill set to this 13-skill set (the `plan-feature` router, `plan-fix`,
`review-change`, `audit-pr`, `product-audit`, and the internal `plan-feature-*`
steps) **predates** formal versioning; consumers upgrading from that older install
follow [`docs/workflow/MIGRATION.md`](docs/workflow/MIGRATION.md).

**User-facing (9):**

- `init-workspace` `1.0.0` — adapt the doc scaffold to a project; suggest companion review skills.
- `plan-feature` `1.0.0` — planning router (idea / issue / scoped slug / `--next`).
- `plan-fix` `1.0.0` — architect-draft a scoped fix SPEC; stop for review.
- `execute-phase` `1.0.0` — implement a phase / single-pass / `--fix`; auto-review every 2 phases.
- `review-change` `1.0.0` — platform-adaptive review orchestrator → one classified table + manual checks.
- `audit-pr` `1.0.0` — PR-level merge gate → merge-ready or blockers.
- `product-audit` `1.0.0` — periodic product-wide health check → issue + roadmap proposals.
- `audit-docs` `1.0.0` — docs ↔ roadmap ↔ code ↔ fix-index coherence.
- `triage-issue` `1.0.0` — classify an issue by verifying its trigger against the code.

**Internal (4, `user-invocable: false`):**

- `review-implementation` `1.0.0` — the findings engine + classification rubric `review-change` and the audit skills compose.
- `plan-feature-interview` `1.0.0` — interview a raw idea into a SPEC.
- `plan-feature-from-issue` `1.0.0` — issue → scoped SPEC with `Closes #N`.
- `plan-feature-scaffold` `1.0.0` — SPEC → full planning artifact set + roadmap entry.
