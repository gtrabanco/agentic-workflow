# Portable prompt — install the agentic workflow skill system

Paste the prompt below into Claude Code (or any capable coding agent) **from the
root of the target repository**. It regenerates the agentic workflow — **14
user-facing skills + 15 internal steps** (minus `init-workspace`, which this
prompt itself replaces as the bootstrap) — **adapted to that project's**
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
- The agent guide at the repo root: `AGENTS.md` (a legacy `CLAUDE.md` may still
  be the only name an older Claude Code release reads).
  Extract: the documentation map, the feature workflow, branch/PR rules, the
  pre-commit checklist, the docs language, and the verification gate commands
  (type-check / test / build — whatever the project uses, e.g.
  npm/pnpm/yarn/cargo/go/make equivalents).
- The architecture doc and layering rules.
- The feature system: a SPEC template (e.g. `docs/features/_TEMPLATE/SPEC.md`),
  the roadmap (e.g. `docs/ROADMAP.md`), and 1–2 recent feature folders
  to learn the exact artifact set used.
- The fix system: the fix index (a `## Fixes` table in the roadmap document) and
  fix SPEC template.
- `.github/ISSUE_TEMPLATE/` and `.github/PULL_REQUEST_TEMPLATE.md`.
- The **forge** (issue/PR tracker + CLI): detect it from the remote URL
  (github.com → `gh`, gitlab → `glab`, else ask) and write the skills' forge
  commands with the detected CLI. The `Closes #N` auto-close convention must hold.
- Naming conventions, money/i18n/SEO/a11y/security rules, and runtime limits.
If something doesn't exist, note it; the skills must degrade gracefully and say
so at runtime rather than assuming a path.

## 2. Create the skills under `.claude/skills/<name>/SKILL.md`
Each file: YAML frontmatter (`name`, `user-invocable`, a trigger-rich
`description`) + a body with `When to use`, `Step 0 — Discover the project (always
first)`, `Process`, `Guardrails`, `Relationship to other skills`, `Done when`, and
a closing `→ Next:` block. Pin no per-skill model or effort: every skill inherits
the session's tier, and a boundary that needs another tier hands off instead of
composing. Make every skill discover-first and
reference THIS project's real paths/commands/language.

**Repository state**
Before design or planning, create the Normalized Repository State contract:
- `discover-repository-state` — inspect evidence and write a frozen ledger with
  facts, accepted decisions, planned work, documentation, inference, questions,
  and contradictions kept separate.
- `resolve-repository-state` — the sole writer for resolving contradictions and
  publishing the next frozen snapshot; consumers never update facts inline.
All planning, execution, review, audit, status, and orchestration skills consume
the frozen ledger and route missing or contradictory state to these skills.

**The lane** (the fixed pipeline is retired — its stages are catalog steps now)
1. `unit-lane` — the conductor. Given a slug (`--from-issue <n>` for a tracked
   issue, `--fix <n>` for a fix), it creates ONE unit doc from the template —
   `## Specs` numbering the owner's requirements `S#` verbatim, `## Tasks` with
   phases `P1…Pn` (never `Step N`/`S1`), an evidence carrier (an `## Evidence`
   table, or `## Log` `E` lines on a re-cut unit), and an append-only `## Log` —
   then runs triage (returns the ordered catalog steps that apply) and
   orchestrates the whole lane: research → design → plan → implement → tests →
   evidence → review → docs → release. Each step runs as an atomic gate/commit and
   gets a fresh worker context; the triage block in the unit doc is the only step
   authority.
2. `execute-phase` — the step executor: one step (or all remaining) with frozen
   acceptance, the **derived test-impact set** (tests first on core/domain and
   orchestration work — the unit doc's scenarios are the test list, red →
   green), the project's verification gate before every commit — **never commit
   red** (unfixable-in-scope failures → known issues + stop) — the diff-size
   guard, and red-gate repair. When reality contradicts the plan, return to the
   lane instead of silently diverging. A failing test is repaired by changing the
   code it judges, never by relaxing the assertion. A finished unit **always opens
   its PR** (never branch-only) and **flips the roadmap row to `done` at PR-open**
   (built, not merged — merge state is the forge's).

The retired stages are catalog steps inside those two — never recreate them as
standalone commands: `design-feature` → the `design` step (capability closure:
per entity CRUD + state transitions, each with a UI entry point + API surface +
test or an explicit `n/a: <reason>`; per capability its entry point and who may
execute it; the filled rows become the acceptance criteria); `plan-feature`,
`plan-feature-scaffold`, `plan-feature-from-issue` → the `plan` step (sizing and
phase scaffolding, planned from recorded decisions rather than open questions);
`plan-fix` → the lane's fix mode; `review-spec`/`review-plan` → the `review`
step; `planning-preflight`/`replan-findings` → triage and replanning;
`implementation-discovery` → the bounded, read-only pre-write mapper inside
`execute-phase` (seven evidence questions, one compact map, routing
`READY | REPLAN | NEEDS-DESIGN | BLOCKED` before the first write);
`evidence-grounding` → the `evidence` step.

**Review & audit** (change → PR → product)
3. `review-change` — platform-adaptive orchestrator, **mandatory before every
   merge**: run only the reviews that apply to this project + change (compose
   `review-implementation` + the project's companion review skills), check
   **acceptance drift** (the diff against the unit doc's criteria — nothing
   contradicted, silently exceeded, or left untouched), and synthesize ONE
   classified table + an explicit manual-verification checklist. Give **every
   finding a destination**: fix-now is persisted to the unit's fold ledger and
   handed to `/fold-findings`; replan-in-unit returns to the lane;
   decision-required surfaces to the user, and independent proposals are batched
   for explicit user triage (never create backlog yourself). A finished unit
   walks the review→fold path (`/review-change` → `/fold-findings` → re-review the
   delta), keeping the reviewing context clean of the one that wrote the diff.
4. `review-implementation` (`user-invocable: false` — the classification engine
   `review-change` composes) — two-phase review of a change. Phase 1 FIND (no
   refactor) across: bugs, architecture violations, removable/dead code (EXCEPT
   code intentionally staged for an in-progress unit — cross-check the roadmap and
   unit docs), security/cybersecurity, platform/runtime incompatibilities,
   overengineering & premature optimization, bundle-size risk, and tests (failing
   AND missing). Phase 2 CLASSIFY each finding as fix-now / replan-in-unit /
   decision-required / proposal / ignore on one severity ladder, with WHY.
   Findings only — never refactor.
5. `audit-pr` — PR-level delivery gate: acceptance met, tasks and evidence
   complete, docs updated (**never merge with pending docs**), `Closes #N`, the
   fix row tracked until merge, tests, CI green, branch independently mergeable,
   capability closure, and a current SHA-bound review receipt → **MERGE-READY or
   evidenced blockers**, always with the full URL. `done` ≠ merge-ready (a `done`
   unit can still have an open PR). Never merges or edits.
6. `product-audit` — measured-trigger product-wide health check across every
   applicable axis + process/docs/roadmap coherence; proposes issues and roadmap
   rows. Never auto-fixes; the user decides.
7. `audit-docs` — audit docs ↔ roadmap ↔ code ↔ fix index for drift; produce a
   severity-ranked report; fix only low-risk items on request.
8. `fold-findings` — repair every persisted fix-now finding in compatible atomic
   batches: root-cause fix, green gate, commit, and the per-row `folded: yes`
   update. Never reclassify, never substitute backlog notes.
9. `triage-issue` — classify an issue (fix-now / promote-to-feature / postpone /
   wontfix). Parse the issue's own "when to fix"/trigger and VERIFY it against the
   current code (grep counts, thresholds, repro). Route, or leave open with a
   dated re-confirmation comment. Never implement deferred work inline. Accept
   several issue numbers in one batch (independent verdicts, one summary table).
10. `workflow-status` — the read-only sensor: emit the deterministic Envelope v2
    result (what can run now, what is blocked and by what) and interpret it;
    never decide for the driver.
11. `batch-scheduler` — the deterministic batch planner: the parallel,
    order-respecting, collision-free batches the live work graph allows.
12. `log-session` — append a structured session handoff to the project journal, so
    the next session resumes the thread without re-reading git history.

**Internal contracts** (`user-invocable: false`): `orchestration-envelope` (the
machine-result contract a driver parses), `phase-contract` (the phase-lint rules),
`pre-execution-review` (the planning ledgers and the pre-execution cycle),
`verification-contract` (the acceptance artifact and its execution receipt), the
review pack's per-axis skills (`review-code`, `review-security`, `review-a11y`,
`review-design`, `review-brand`, `review-perf`, `review-seo`, `review-verify`,
`review-debt`), and `skill-lint` (this repository's own authoring lint — it is not
installed in target projects).

**Autopilot** — retired (feature 61 P9): `ship-roadmap`'s deterministic routing
lives in `workflow-status` and the lane, and the unattended conductor is a roadmap
row (62) rather than a skill. There is no end-to-end loop skill: a driver composes
the skills above.

Compose with (do not duplicate) the project's own companion review skills
(`/code-review`, `/security-review`, `/verify`, and any design/a11y/brand/perf/SEO
skills) — `review-change` and `product-audit` invoke only the applicable ones. If
a needed one is absent, note the gap rather than failing.

## 2b. Machine results are profile-owned at the invocation boundary

Interactive skills remain text-first. A headless driver selects the named
profile from `@gtrabanco/agentic-workflow-schema`, appends the generated
`renderOutputInstruction(skill)` to a worker invocation, and parses the final
result with `parseTurn({skill, text, context})`. `workflow-status` keeps the
strict Envelope v2 sensor result; other driven workers return compact
SkillOutcome v1. `workflow-status` is the sensor (Envelope v2); every other skill
stays interactive-first, so none carries a worker profile.

On an absent, malformed, or invalid result, the driver re-invokes the same
session exactly once with `Emit only the machine result for the turn above.` A
second failure is driver-level `FAILED`; arbitrary prose is never promoted to
workflow facts. See `docs/workflow/ORCHESTRATION.md` for the full protocol.

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
- After it runs, drive features and fixes with `unit-lane` (the lane
  conductor — triage → catalog steps → evidence → review), execute with
  `execute-phase`, review with `review-change`, gate the PR with `audit-pr`,
  and triage issues with `triage-issue` — exactly as documented in
  `docs/workflow/`.
