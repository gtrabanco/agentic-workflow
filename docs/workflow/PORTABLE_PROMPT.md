# Portable prompt — install the agentic workflow skill system

Paste the prompt below into Claude Code (or any capable coding agent) **from the
root of the target repository**. It regenerates the agentic workflow — **10
user-facing skills + 3 internal planning steps** — **adapted to that project's**
architecture, documentation, and conventions, rather than copying this repo's
specifics verbatim.

Use this when you want the skills tuned to a new project. For a deterministic,
identical copy instead, install them with the `skills` CLI:
`npx skills add gtrabanco/agentic-workflow` (see `REPLICATE.md`).

---

````text
You are setting up an agentic feature/issue workflow as reusable Claude skills in
THIS repository. Do not assume this project matches any other — discover its
conventions and adapt.

## 0. Safety
- Never work on the default branch (main/master). Create a dedicated branch
  (e.g. `chore/agentic-workflow-skills`) or an isolated git worktree first.
- If the working tree has uncommitted changes, do not disturb them: use a
  worktree off the default branch.

## 1. Discover the project (read before writing anything)
Find and read whatever exists; record the real paths and rules:
- The agent guide at the repo root: `CLAUDE.md` and/or `AGENTS.md`.
  Extract: the documentation map, the feature workflow, branch/PR rules, the
  pre-commit checklist, the docs language, and the verification gate commands
  (type-check / test / build — whatever the project uses, e.g.
  npm/pnpm/yarn/cargo/go/make equivalents).
- The architecture doc and layering rules.
- The feature system: a SPEC template (e.g. `docs/features/_TEMPLATE/SPEC.md`),
  the roadmap (e.g. `docs/features/ROADMAP.md`), and 1–2 recent feature folders
  to learn the exact artifact set used.
- The fix system: a fix index (e.g. `docs/fix/README.md`) and fix SPEC template.
- `.github/ISSUE_TEMPLATE/` and `.github/PULL_REQUEST_TEMPLATE.md`.
- Naming conventions, money/i18n/SEO/a11y/security rules, and runtime limits.
If something doesn't exist, note it; the skills must degrade gracefully and say
so at runtime rather than assuming a path.

## 2. Create the skills under `.claude/skills/<name>/SKILL.md`
Each file: YAML frontmatter (`name`, `user-invocable`, a trigger-rich
`description`, and a pre-set `model`/`effort`) + a body with `When to use`,
`Step 0 — Discover the project (always first)`, `Process`, `Guardrails`,
`Relationship to other skills`, `Done when`. Make every skill discover-first and
reference THIS project's real paths/commands/language.

**Plan**
1. `plan-feature` — the ROUTER and the only planning entry in the menu. Detect the
   input — a raw idea, an issue `#N`, a scoped slug/SPEC, or `--next` (next roadmap
   item) — dispatch to the right internal step below, then ensure the roadmap entry
   and print the next step (`execute-phase NN P1`).
2. `plan-fix` — architect-draft a tightly-scoped fix SPEC from an issue, register
   it in the fix index, commit on a fix branch, and STOP for review.

**Internal planning steps** (`user-invocable: false` — invoked only by the router)
3. `plan-feature-interview` — interactive interview from a raw idea; proactively
   ask (small batched rounds, recommended defaults) to fill every SPEC dimension,
   including failure-mode dev scenarios; offer to open a tracking issue.
4. `plan-feature-from-issue` — convert a feature-request issue into a scoped SPEC
   (confirm it's a feature, not a bug/debt; translate to docs language; map to
   roadmap; close gaps by asking; wire `Closes #N`).
5. `plan-feature-scaffold` — scaffold the SPEC + the project's full planning
   artifact set and register it in the roadmap. Docs only; no code, no branch.

**Execute**
6. `execute-phase` — implement one phase (default), a small feature in a single
   pass, or a fix (`--fix`). Branch safety, the project's verification gate,
   per-phase doc discipline; hand off to `review-change` every 2 phases (a review
   checkpoint — suggest it rather than composing it, so it runs at its own
   model/effort).

**Review & audit** (change → PR → product)
7. `review-implementation` — two-phase review of a change. Phase 1 FIND (no
   refactor) across: bugs, architecture violations, removable/dead code (EXCEPT
   code intentionally staged for an in-progress/planned feature — cross-check
   roadmap/SPEC/known-issues), security/cybersecurity, platform/runtime
   incompatibilities, overengineering & premature optimization, bundle-size
   risk, and tests (failing AND missing). Phase 2 CLASSIFY each finding as
   fix-now / postpone / ignore / intentional-tradeoff in a decision table with
   WHY, implementation risk, long-term impact, and a premature-optimization flag.
   Findings only — never refactor.
8. `review-change` — platform-adaptive orchestrator: run only the reviews that
   apply to this project + change (compose `review-implementation` + the project's
   companion review skills) and synthesize ONE classified table + an explicit
   manual-verification checklist. Findings only.
9. `audit-pr` — PR-level merge gate: SPEC acceptance met, all phases complete,
   docs updated, `Closes #N`, tests, CI green, branch independently mergeable, and
   the review axes clean → merge-ready or a list of blockers. Never merges or edits.
10. `product-audit` — periodic product-wide health check across every applicable
   axis + process/docs/roadmap coherence; mine feature docs → propose issues +
   roadmap add/remove. Never auto-fixes; the user decides.
11. `audit-docs` — audit docs ↔ roadmap ↔ code ↔ fix index for drift; produce a
   severity-ranked report; fix only low-risk items on request.

**Decide**
12. `triage-issue` — classify an issue (fix-now / promote-to-feature / postpone /
   wontfix). Parse the issue's own "when to fix"/trigger and VERIFY it against the
   current code (grep counts, thresholds, repro). Route, or leave open with a
   dated re-confirmation comment. Never implement deferred work inline.

Compose with (do not duplicate) the project's own companion review skills
(`/code-review`, `/security-review`, `/verify`, and any design/a11y/brand/perf/SEO
skills) — `review-change` and `product-audit` invoke only the applicable ones. If
a needed one is absent, note the gap rather than failing.

## 3. Write a `docs/workflow/` copy
Create
`docs/workflow/{README,FEATURE_WORKFLOW,ISSUE_WORKFLOW,SKILLS,REVIEW_AND_CLASSIFY,REPLICATE}.md`
documenting the end-to-end feature flow, the issue flow, the skill reference, the
review/audit flow, and how to replicate — all using THIS project's real paths,
gate commands, and rules.

## 4. Respect the project throughout
Honor the architecture, style guides, and all existing documentation. Use the
project's docs language for every artifact. Keep changes docs-only in this setup
task. Do not add dependencies.

## 5. Finish
Run the project's verification gate if you touched anything it covers, commit on
the dedicated branch in the project's commit style, and open a PR against the
default branch summarizing the skill system. Then stop and report what you
created and how to use it.
````

---

## Notes

- The prompt is intentionally **discovery-driven**: it asks the agent to learn
  each project's rules instead of hardcoding this repo's. That's what lets you
  "work the same way" everywhere while still respecting each project's architecture.
- After it runs, drive features with `plan-feature` (the router) and fixes with
  `plan-fix`, execute with `execute-phase`, review with `review-change`, gate the
  PR with `audit-pr`, and triage issues with `triage-issue` — exactly as
  documented in `docs/workflow/`.
