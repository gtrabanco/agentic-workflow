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
