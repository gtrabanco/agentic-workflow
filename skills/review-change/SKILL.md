---
name: review-change
user-invocable: true
version: 1.10.2
argument-hint: <path-or-glob>
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Platform-adaptive review orchestrator. Reviews the current change by running
  review-implementation (find → classify) AND the workflow's own internal review
  pack — only the passes that apply to this project and this change (review-code,
  review-security, review-verify, review-debt, review-design, review-a11y,
  review-brand, review-perf, review-seo) — never the inapplicable ones (no
  a11y/SEO/brand for a CLI, library, or infra change). Self-contained: no external
  review skills required; installed platform skills run as optional extras.
  Synthesizes one classified report plus an explicit manual-verification checklist.
  Findings only — never refactors. On Claude Code and want hand-tuned per-skill
  model/effort tiers? Install the `#claude` branch instead
  (`npx skills add gtrabanco/agentic-workflow#claude`) — see the README. This
  branch is model-agnostic: the skill inherits whatever model and effort your
  agent session is already using. Triggers: "review this change", "full review
  before merge", "review-change", "run the right reviews for this", "what
  should I check before PR".
---

# Review Change

The quality gate for a change: get every review that *applies* — and skip the ones
that don't — in one synthesized, classified report. **Findings only; never edits
or refactors.**

## Turn contract — verify before ending the turn

```
✓ The synthesized decision table + manual-verification checklist + `Decision: PASS | FAIL` were returned in the fixed output format
✓ Every non-fix-now finding got a destination (triaged — issue / decision / drop)
✓ The closing `→ Next:` block is printed, then the machine envelope (fenced ```json — see ## Machine envelope) as the ABSOLUTE last output
```

About to end the turn with any box unchecked? The turn is NOT done — complete
the missing box first (weak models drop end-of-document duties; this list is
first on purpose).

## When to use

- **Mandatory before every merge** — every unit (feature, single-pass, or fix) gets a
  `review-change` pass before its merge gate; that end review is never skipped.
  `execute-phase` additionally **recommends** a hand-off every 2 phases — an
  optional checkpoint the user may skip.
- When you want the *right* reviews for this change without running irrelevant
  passes (e.g. accessibility on a backend change).

## Scope

Default target is the **current change** (branch diff vs the default branch);
accept a path/glob to widen or narrow. State the scope at the top of the report.

## Step 0 — Discover the project & the change (always first)

Per the agent guide's **Workflow conventions** + **documentation map**, then
decide which axes apply from two inputs:

1. **Project nature** — from the guide/map: is there a UI (`docs/frontend/`
   present)? Is it web, mobile, console/CLI, library/SDK, or backend/infra? Note
   any optional platform review skills the project recorded (its `init-workspace`
   notes them) — extras, never requirements.
2. **Change footprint** — what the diff actually touches (UI components? an API?
   infra? domain logic?). An axis applies only if **both** the project has it
   **and** the change touches it.

## Applicability matrix (default; the project's docs refine it)

Every axis maps to a skill of the workflow's **own internal review pack**
(`skills/review-*` — installed with the workflow, so none can be missing):

| Axis — internal pack skill | Web | Mobile | Console/CLI | Lib/SDK | Backend/Infra |
|---|---|---|---|---|---|
| `review-implementation` (bugs, arch, security, dead code, perf, tests, rules) | ✓ | ✓ | ✓ | ✓ | ✓ |
| `review-code` (correctness + simplification) | ✓ | ✓ | ✓ | ✓ | ✓ |
| `review-security` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `review-verify` (run it, confirm real behavior) | ✓ | ✓ | ✓ | ✓ | ✓ |
| `review-debt` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `review-design` (UI/UX) | ✓ | ✓ | TUI only | ✗ | ✗ |
| `review-a11y` | ✓ | ✓ | rare | ✗ | ✗ |
| `review-brand` (voice/copy) | ✓ | ✓ | output text | ✗ | ✗ |
| `review-perf` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `review-seo` | ✓ | ✗ | ✗ | ✗ | ✗ |
| API ergonomics / usage docs (inline pass) | if API | if API | flags/help | ✓✓ | ✓ |

## Process

1. **Findings engine.** Run `review-implementation` over the scope → its classified
   decision table (fix-now / postpone / ignore / intentional-tradeoff).
2. **SPEC drift check.** Locate the governing SPEC (feature or fix) and compare
   the diff against its scope and acceptance criteria: flag work that contradicts
   the SPEC, silently exceeds it, or leaves a claimed criterion untouched.
   Findings get axis `spec-drift` in the table. Catching drift at a phase
   checkpoint is far cheaper than at the `audit-pr` merge gate. (No SPEC found →
   note it and skip.)
3. **Workflow-discipline check (mechanical, every review).** On the branch
   under review, verify and file findings under axis `workflow`:
   commits follow `<type>(<scope>): <summary>`; phase labels in touched
   planning docs are `P1, P2, …` (never `S1`/"Steps"); the phase's per-phase
   docs were updated (TASKS ticks, progress entry); no commit landed on the
   default branch; artifacts are in the project's declared docs language;
   **the tree is clean and the remote current** — run `git status --porcelain`
   (any tracked modification, code or docs, = a `workflow` finding: work is
   sitting outside the commits under review) and, when the branch has an open
   PR, `git fetch` + `git status -sb` (commits ahead of the remote = a
   `workflow` finding: the PR and CI are judging a stale branch). Both are
   **fix-now** — a review verdict on a branch whose real state isn't pushed
   is worthless. Run the greps/`git log`/`git status` — don't infer compliance.
4. **Applicable pack passes.** For each axis the matrix + footprint mark as
   relevant, run the workflow's own internal skill for it (`review-code`,
   `review-security`, `review-verify`, `review-debt`, `review-design`,
   `review-a11y`, `review-brand`, `review-perf`, `review-seo`) — composed in-turn
   (this same conversation), each returning its fixed-format table + PASS|FAIL.
   **Skip the rest** and say which you skipped and why. The pack ships with the
   workflow, so an applicable pass can never be "missing".
5. **Optional extras.** If the project recorded additional platform review skills
   (stack-specific linters, framework skills) and they are installed, run them
   **in addition** — their findings merge into the same table. Never treat an
   absent extra as a gap; the pack already covered the axis.
6. **Synthesize.** Merge all findings into **one** decision table, deduped by
   `file:line`. Keep `review-implementation`'s columns (Sev, Class, WHY, impl risk,
   long-term impact, premature-opt?, route) and add an **Axis** column.
7. **Manual-verification checklist.** List what automated review **cannot** confirm
   and a human must check — visual correctness, real-device/locale behavior, UX
   feel, perf under load, anything marked *verify*. Be explicit so the dev has zero
   doubt about what to eyeball.
8. **Triage everything not fixed now.** For **every** finding you don't route to
   `fix-now` (postpone / ignore / intentional-tradeoff), run it through
   `triage-issue` (compose in-turn — i.e. within this same conversation/run; equal
   tier) to decide and record its home: a
   tracked issue with a trigger, a documented decision (`decisions.md` / a comment),
   or a justified drop. **No non-fix-now finding may end without a destination** — the
   point is to never silently lose one, and to catch the few that actually deserve an
   issue or a doc note.
9. **Report — return exactly this structure** (fixed output contract; nothing
   more, nothing less):

   ```
   REVIEW CHANGE — scope: <scope>
   Axes run: <list>   Skipped: <list + why>

   <the synthesized decision table (step 6)>

   Manual verification (a human must check):
   - <item> …

   Non-fix-now destinations (step 8): <n> triaged — <issue #s / decisions / drops>

   Summary: <1-2 sentences>
   Decision: PASS | FAIL   (FAIL while any fix-now finding is open)
   ```

10. **Next step.** Close with the `→ Next:` block:

   ```
   → Next: /audit-pr — merge gate (when the table is clean)
     · fix-now findings → fold into the branch — gate green, COMMIT and PUSH
       (execute-phase's fold cycle; an unpushed fix doesn't exist for CI or
       the PR), then re-review
     · non-fix-now → /triage-issue (issue / documented decision / justified drop)
     · SPEC drift flagged here AND on a prior unit → /product-audit (the founding
       assumptions are probably stale — don't keep patching a compounding error)
   ```

   The `/product-audit` line fires **only on recurring drift** — the same kind of
   inconsistency surfacing a second time, not a single isolated finding.

## Example output (generic)

For a change to a backend export module (no UI surface):

> Scope: branch diff vs `main` (`src/export/**`). Skipped: design / a11y / SEO /
> brand — no UI surface.

| Axis | Finding | Sev | Class | WHY | Route |
|---|---|---|---|---|---|
| security | API token read from a committed file | high | fix-now | Credential exposure | `plan-fix` |
| tests | Export handler has no failure-mode test | med | fix-now | Untested error path | fold into phase |
| perf | Full table loaded before filtering | low | postpone | Fine at current size | issue + trigger (>100k rows) |

> Manual-verification (automation can't confirm):
> - The exported file opens cleanly in a spreadsheet app.
> - An empty result set still produces a valid (header-only) file.

## Routing

Every non-`fix-now` finding is routed **through `triage-issue`** (step 8) so its
disposition is a decision, not a default:

- **fix-now** → `plan-fix` → `execute-phase --fix`, or fold into the current phase
  if it's unmerged work.
- **postpone** → `triage-issue` → open a tracked issue with a trigger.
- **intentional-tradeoff** → `triage-issue` → record it (comment / `decisions.md` / issue).
- **ignore** → `triage-issue` → note the rationale (or confirm it truly needs nothing).

## Guardrails

- **Findings + tables only. Never refactor or edit code.**
- Run only applicable axes; never an irrelevant pass (no a11y/SEO/brand for
  CLI/lib/infra). Always report what was skipped and why.
- Honor the project's **Workflow conventions** (docs-language, evidence): cite
  `file:line`, mark uncertainties *verify*.
- **Any forge body this review causes (issues/comments filed via `triage-issue`)
  is Markdown, not shell — never hand-escape.** A `\` before a backtick/`*`/`_`
  renders literally (`` \`code\` `` instead of `` `code` ``); bodies go through
  `--body-file <path>`, never an inline `--body "…"`/heredoc. `triage-issue`
  enforces this for the comments it posts — don't undercut it by pre-escaping
  finding text you hand it.

## Machine envelope

Every invocation ends with the **machine envelope** — schema, field rules and
placement per the installed `orchestration-envelope` skill: one fenced
```json block, printed **after** the closing block above, as the **absolute
last output** of the turn (external orchestrators parse the LAST fenced json
block; see `docs/workflow/ORCHESTRATION.md`). All top-level keys always
present; values only from verified command output, never invented.

This skill emits:

- **`state`:** `READY_FOR_AUDIT` (Decision: PASS — table clean),
  `NEEDS_FIXES` (Decision: FAIL — `findings.fix_now` non-empty; fold via
  execute-phase's fold cycle — commit AND push — then re-review), or `HALT`
  (a critical finding that invalidates continuing any unit — scope `run`).
- **Fields:** `findings.fix_now` = the fix-now rows (`ref`/`title`/`file`);
  `findings.issues_filed` = issue numbers `triage-issue` created this turn
  (integers); `findings.untriaged` MUST be 0 (this skill's own contract routes
  every non-fix-now finding); `recommendations.product_audit: true` when SPEC
  drift recurred across units (with the reason).
- `detail`: `{"axes_run": [...], "axes_skipped": [...], "decision": "PASS|FAIL"}`.

## Portability (agents other than Claude Code)

The workflow is the contract; Claude Code features are conveniences. On an
agent that lacks one, apply the fallback — never skip the step the feature
enables:

- **No slash-command menu** — where this skill says `/<skill>`, open that
  skill's `SKILL.md` (wherever your agent installed the skills) and follow it
  literally, in a fresh conversation: hand-offs assume a clean context.
  "Compose in-turn" means the opposite: run that step within this same
  conversation, as part of this review.
- **No per-skill `model:`/`effort:`** — on the `#claude` branch the frontmatter pins these tiers; here, pick tiers yourself:
  this review needs your **strongest** model. Never review a change with a
  model weaker than the one that wrote it — and prefer a different model
  **family** than the writer's: same-family instances share training blind
  spots, cross-family decorrelates errors.

## Relationship to other skills

- Composes `review-implementation` (engine), the internal review pack
  (`review-code`, `review-security`, `review-verify`, `review-debt`,
  `review-design`, `review-a11y`, `review-brand`, `review-perf`, `review-seo`),
  `triage-issue` (every non-fix-now finding — equal tier, in-turn), and — as
  optional extras only — any platform review skills the project installed.
- Sits in Stage 4 of the feature workflow; `execute-phase` recommends it every 2
  phases (optional checkpoint) and hands off for the **mandatory end review**
  (it runs in its own turn). `fix-now` → `plan-fix`; everything else →
  `triage-issue`.
- `audit-pr` is the PR-level gate it feeds; `product-audit` the periodic full sweep.

## Done when

- One synthesized, classified decision table across all **applicable** axes exists,
  the skipped axes are listed with reasons, and the manual-verification checklist is
  explicit.
- **Every finding has a destination:** fix-now routed, and every non-fix-now finding
  put through `triage-issue` (issue / documented decision / justified drop) — none
  silently lost.
- The **closing `→ Next:` block is printed** (clean → `/audit-pr`; recurring drift →
  `/product-audit`), and **no code changed**.
