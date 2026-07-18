---
name: review-change
user-invocable: true
version: 2.4.0
argument-hint: <path-or-glob> [--adversarial N] [--merge]
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
✓ This review runs in a conversation that did NOT implement the change; if this conversation wrote the diff, STOP and hand off to a fresh one (the reviewer works from the diff + the SPEC, not the author's mental state).
✓ The synthesized decision table + manual-verification checklist + `Decision: PASS | FAIL` were returned in the fixed output format
✓ Every non-fix-now finding got a destination (triaged — issue / decision / drop)
✓ The closing `→ Next:` block is printed as the ABSOLUTE last output
```

About to end the turn with any box unchecked? The turn is NOT done — complete
the missing box first (weak models drop end-of-document duties; this list is
first on purpose).

## When to use

- **Mandatory before every merge** — every unit (feature, single-pass, or fix) gets a
  `review-change` pass before its merge gate; that end review is never skipped, and
  it must run in a conversation that did **not** implement the change — the
  conversation that wrote a diff shares the author's mental model and tends to
  catch only mechanical issues, missing design defects a context-clean,
  adversarial reviewer would find (see the turn-contract box above). If the
  reviewing conversation authored the diff, stop and hand off to a fresh one
  before reviewing.
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

1. **Findings engine.** No flag → run `review-implementation` once over the
   scope → its classified decision table (fix-now / postpone / ignore /
   intentional-tradeoff), unchanged from before this mode existed. With
   `--adversarial N` → run the **adversarial multi-reviewer mode** below
   instead. With `--merge` → skip straight to that mode's fusion step (N
   findings tables pasted in, per the merge contract). Either way, everything
   from step 2 onward runs once, over the merged table, exactly as in the
   no-flag case.
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
   long-term impact, premature-opt?, route) and add an **Axis** column — plus a
   **`Reviewers n/N`** column when running in `--adversarial N` mode (omitted
   entirely in the default single-reviewer case).
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
9. **Persist fix-now findings to the fold ledger.** The unit's **fix-now fold
   ledger** is `review-findings.md`, located beside its other docs
   (`docs/features/<NN>-<slug>/review-findings.md` for a feature,
   `docs/fix/<n>-<topic>/review-findings.md` for a fix), fixed schema:

   ```
   | id | file:line | axis | severity | class | route | folded |
   ```

   **Merged unit → no write** (a PR exists and its state is `MERGED` — check
   `gh pr view --json state` when a PR is open; otherwise the unit is unmerged
   by definition). Otherwise, for each **fix-now** finding: append a row
   (create the file with the header row if it doesn't exist yet), carrying the
   verbatim `Sev` value into `severity`; `folded` always starts `no` —
   `execute-phase`'s fold cycle is the only step that ever flips it to `yes`.
   Re-runs **dedupe by `file:line` + axis** (the same rule the adversarial mode
   uses to merge reviewer findings, above): a finding already on the ledger at
   that `file:line`+axis is not re-appended; a genuinely new finding gets the
   next `Fn` id. **Non-fix-now findings are never written here** — they keep
   their `triage-issue` destinations from step 8.
10. **Report — Return exactly this structure** (fixed output contract; nothing
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

11. **Next step.** The `→ Next:` block is **never one static template** — branch
   on the `Decision` value from step 10 and emit the matching block **verbatim,
   as multiple literal lines**. Never join the `·` sub-bullets into one prose
   line — each sub-bullet is its own line, exactly as quoted below.

   **`Decision: FAIL`** (any fix-now finding open) — the recommended line is the
   fold, never the merge gate:

   ```
   → Next: /fold-findings — repair each fix-now finding for real (frozen
     classification, no known-issues dump/downgrade/suppression escape hatch),
     then re-run /review-change
     · /audit-pr → only after the table is clean (not yet — findings open)
     · non-fix-now → /triage-issue (issue / documented decision / justified drop)
     · adversarial recommendation checklist fired AND this run was
       single-reviewer? → re-run the fold review as /review-change
       --adversarial N (N per the ladder below) instead of single-reviewer
       (yes: <which box fired>; no: omit this line)
     · SPEC drift flagged here AND on a prior unit? → /product-audit (yes: the
       founding assumptions are probably stale — don't keep patching a
       compounding error; no: omit this line)
   ```

   **`Decision: PASS`** (table clean) — the recommended line is the merge gate:

   ```
   → Next: /audit-pr — merge gate
     · non-fix-now → /triage-issue (issue / documented decision / justified drop)
     · adversarial recommendation checklist fired AND this run was
       single-reviewer? → re-run as /review-change --adversarial N (N per the
       ladder below) before /audit-pr (yes: <which box fired>; no: omit this
       line)
     · SPEC drift flagged here AND on a prior unit? → /product-audit (yes: the
       founding assumptions are probably stale — don't keep patching a
       compounding error; no: omit this line)
   ```

   The `/product-audit` line fires **only on recurring drift** — the same kind
   of inconsistency surfacing a second time, not a single isolated finding;
   the yes/no checkbox above is how to decide, in both branches.

## Adversarial multi-reviewer mode (`--adversarial N`, opt-in)

**Default OFF.** No `--adversarial N` flag → today's single-reviewer behavior,
byte-for-byte unchanged (step 1 above). This mode only replaces the
findings-gathering stage; steps 2–10 run once, over the merged table.

**N semantics.** `--adversarial` flag not passed at all → single-reviewer mode,
no message (today's default). `--adversarial` passed **without** a valid N
(no number given, or a number `< 2`) → usage error: state that `--adversarial`
needs an integer N≥2 and fall back to the single-reviewer path — never
silently run 1. `ship-roadmap`'s hard floor always passes `N=2`.

**Why N reviewers.** A single adversarial, context-clean reviewer (see the
turn-contract box) decorrelates some blind spots; running N independent
reviewers — ideally across **different model families** (a preference, not a
requirement: an agent with one family runs N same-family reviewers and says so)
— decorrelates more, at 2–3× the cost of the findings-gathering stage. That cost
is why the mode stays opt-in and is only **auto-recommended, never forced**.

**Recommendation checklist.** Recommend `--adversarial 2` if **ANY** box ticks
(this skill surfaces the recommendation in its report / `→ Next:` block but
proceeds single-reviewer unless the user opts in):

- ✓ the change is `L`
- ✓ the change touches a sensitive surface (auth, payments, destructive
  migrations, secrets, CI config)
- ✓ the reviewing model is **not the strongest model available in the fleet**,
  or is weaker than the model that authored the diff
- ✓ only one model family is available **and** the change is `≥ M`

The model condition is a documented rule of thumb, **surfaced as a report line
only — never auto-detection.** An agent cannot reliably introspect its own
model identity, so this skill never tries; it states the condition in prose
and lets the human (or the orchestrator that knows which model is running)
judge it.

**N ladder (fixed).** `N=2` is the default (the `ship-roadmap` floor). Bump to
`N=3` when either holds: the change has a security/auth surface, or all
available reviewers share one model family (the third reviewer buys back some
of the decorrelation a single family can't provide). `N>3` is **explicitly
discouraged** — with the ≥1 inclusion threshold below, reviewers beyond 3
mostly add dedupe work at merge time, not new findings.

**Reviewer roles (fixed, assigned by index).** Each reviewer *i* gets role *i*
from this fixed set — never chosen ad hoc:

- **R1 — correctness/logic adversary.** Assume the diff is wrong until proven
  otherwise; hunt first for logic errors, wrong conditionals, off-by-one/edge
  cases, silent behavior changes.
- **R2 — security/inputs adversary.** Hunt first for untrusted input handling,
  injection, auth/authorization gaps, secret handling, and unsafe defaults.
- **R3 — SPEC-coverage adversary.** Hunt first for what the governing SPEC
  *promises* that the diff does not actually do — unmet acceptance criteria,
  silently narrowed scope, claims contradicted by the code.

**A role is an attention priority, NOT an exclusive scope.** The full
`review-implementation` checklist stays **mandatory for every reviewer** —
the role only orders where that reviewer looks first, it never narrows what
they're allowed to flag. The known failure mode this guards against: a
role-narrowed reviewer skips an obvious defect because it fell outside "their"
role. Every reviewer prompt (see the reviewer contract below) must carry this
sentence, not just the role assignment.

**Reviewer contract (single source).** Each of the N reviewers — spawned by
whichever tier below applies — receives this fixed prompt; only `<i>`/`<role
name>`/`<scope>` vary per reviewer. This is the **one and only place** the
reviewer prompt is authored — the Portability paste block later in this skill
quotes it verbatim, never a rewritten copy:

```
ROLE: R<i> — <role name, from the fixed set above>
SCOPE: <diff-only — the branch diff vs the default branch, or the passed path/glob>

You are reviewer <i> of N in an adversarial multi-reviewer review. Assume the
diff is wrong until proven otherwise. Your role orders where you look FIRST —
it is an attention priority, not an exclusive scope: the full
review-implementation checklist stays mandatory. Flag anything wrong, not only
findings inside your role.

Return exactly:
| file:line | axis | Finding | Sev | Class | WHY | Route |
|---|---|---|---|---|---|---|
<one row per finding — empty table if none>
```

**Platform-adaptive spawn (three tiers).** Each of the N reviewers is a
**context-clean, diff-only, adversarial** run of the existing findings engine
(`review-implementation`), reviewing the same scope — none of them is the
conversation that wrote the diff, and the orchestrating `review-change`
conversation never reviews in the same breath as authoring either (the
turn-contract box still applies to the orchestrator):

1. **Claude Code** → spawn **N subagents in parallel**, one reviewer each.
   Prefer assigning **different model families** across them where more than
   one is available.
2. **Another agent with headless invocation** → **N parallel headless
   invocations**, each a fresh context reviewing the diff.
3. **Neither** (inline fallback) → **N sequential fresh conversations** —
   slower, the documented floor-of-last-resort so no agent is blocked from
   using this mode.

**Merge contract (single source).** Collect all N reviewers' classified
findings tables — each already in the reviewer contract's fixed format above
(a `provenance` note records which reviewer/source produced each row) — and:

- **Dedupe by `file:line` + axis** (two genuinely different findings on the
  same line, different axis, stay separate). Identical findings from multiple
  reviewers collapse into **one** row.
- Annotate each merged row with a `Reviewers n/N` column — how many of the N
  flagged it — as a confidence signal.
- **Inclusion threshold = ≥1 reviewer.** A finding any single reviewer raised
  enters classification normally; there is no majority/quorum gate to include a
  finding — a real defect only one sharp reviewer caught must not be dropped.
- **Forbidden — never**, while merging: dropping a finding, downgrading its
  severity, reclassifying it, or re-litigating whether it's real. The merge
  step's only job is fusion; disputing a finding's validity happens later, in
  the normal triage steps (2–10) that consume the merged table — never during
  the merge itself.
- **Externally-produced reviews** (not spawned by this run) are accepted into
  the merge **only if they already arrive in the reviewer contract's fixed
  table format**. Normalizing free prose into that format is the contributing
  conversation's job, not the merge step's — it converts to the table first.
- The merged table then flows through the unchanged steps 2–10 above, producing
  the same fixed-format report + `Decision: PASS | FAIL`.

**`--merge` mode.** `/review-change --merge` is the direct entry point for the
merge contract above — it starts **at the fusion step**, skipping the N-reviewer
spawn: pass it N pasted findings tables (each already in the reviewer
contract's fixed format), and it runs the merge contract, then the unchanged
steps 2–10, to the same fixed report ending `Decision: PASS | FAIL`. This is
how a manual orchestrator — one that ran the N reviewer conversations by hand
via the Portability paste blocks — hands the results back to this skill for
fusion, without re-authoring the dedupe/threshold/forbidden rules itself: the
mode consumes the single merge contract above, never a second copy of it.

**Cadence — once per unit.** The adversarial run (spawn or `--merge`) happens
**once per unit, at the mandatory terminal `review-change`** (the pass before
`Hardening & PR` — see *Review checkpoint & finishing a unit* in
`execute-phase`), where the recommendation checklist above is evaluated. The
one stated exception, not a cadence of its own: a phase touching a sensitive
surface (auth, payments, destructive migrations, secrets, CI config) may earn
an **early** adversarial pass scoped to just that phase's diff — still a
single extra event, not a recurring checkpoint. **Boundary with `#77`** (the general review-checkpoint cadence redesign):
this section owns *where* the adversarial mode runs (the terminal review, plus
the sensitive-phase exception); `#77` owns the general every-N-phases
checkpoint interval — neither issue's change edits the other's sentences.

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

- **fix-now** → persisted to the unit's `review-findings.md` fold ledger, then
  `plan-fix` → `execute-phase --fix`, or fold into the current phase if it's
  unmerged work.
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
  model weaker than the one that wrote it — and prefer a different model family
  than the writer's: same-family instances share training blind spots,
  cross-family decorrelates errors.
- **`--adversarial N` spawn tiers** — Claude Code subagents (tier 1) and
  headless invocation (tier 2) are conveniences; an agent with neither runs the
  tier-3 fallback of N **sequential fresh conversations**, each context-clean
  and diff-only, then merges their findings by hand per the merge contract
  above — slower, never a reason to skip the mode. **One source, two
  wrappers:** the pro path invokes `--adversarial N` / `--merge` and this
  skill runs the contracts itself; a manual orchestrator without either flag
  pastes the two blocks below into fresh conversations by hand — both render
  the exact same reviewer/merge contract, never a second, drifting copy.

  **Reviewer-prompt paste block** (one per reviewer, in a fresh conversation;
  fills `<i>`/`<role name>`/`<scope>` from the fixed role set and N ladder
  above — this is the reviewer contract, quoted verbatim):

  ```
  ROLE: R<i> — <role name, from the fixed set above>
  SCOPE: <diff-only — the branch diff vs the default branch, or the passed path/glob>

  You are reviewer <i> of N in an adversarial multi-reviewer review. Assume the
  diff is wrong until proven otherwise. Your role orders where you look FIRST —
  it is an attention priority, not an exclusive scope: the full
  review-implementation checklist stays mandatory. Flag anything wrong, not only
  findings inside your role.

  Return exactly:
  | file:line | axis | Finding | Sev | Class | WHY | Route |
  |---|---|---|---|---|---|---|
  <one row per finding — empty table if none>
  ```

  **Merge-prompt paste block** (one fresh conversation, after collecting all N
  reviewer tables above — this is the merge contract, quoted verbatim):

  ```
  You are fusing N independent adversarial review tables into one. Given the N
  pasted findings tables below (each already in the reviewer contract's fixed
  format):
  - Dedupe by file:line + axis; identical findings from multiple reviewers
    collapse into one row.
  - Add a `Reviewers n/N` column: how many of the N flagged it.
  - Inclusion threshold = ≥1 reviewer — a finding any single reviewer raised
    enters classification normally; no majority/quorum gate.
  - Forbidden — never: drop a finding, downgrade its severity, reclassify it,
    or re-litigate whether it's real. Fusion only — disputes happen in
    triage, not here.
  - Externally-produced reviews are accepted only if already in the fixed
    table format.

  <N pasted findings tables go here>

  Return the merged table, then continue through review-change's steps 2–10
  to the fixed report ending `Decision: PASS | FAIL`.
  ```

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
