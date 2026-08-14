# Feature workflow (end-to-end)

> 🇪🇸 [Versión en español](FEATURE_WORKFLOW.es.md)

From an idea or a feature-request issue to a merged PR — every step and the skill
that drives it. The lifecycle, per `CLAUDE.md`, is the **five-stage pipeline**:

```
design (design-feature) → plan (plan-feature) → execute (execute-phase)
  → review (review-change) → audit (audit-pr / product-audit)
```

Each feature is carried by **one `SPEC.md`, written in two halves**: `design-feature`
writes the **Product half** (goal, context, scope, capability closure →
acceptance criteria, tooling, product decisions) and stamps `## Design status`;
`plan-feature` refuses to plan a feature whose product half isn't marked
`designed`, then writes the **Engineering half** (architecture impact, design,
phases, testing, dev scenarios, deploy & rollback, deliverables). See
`docs/features/_TEMPLATE/SPEC.md` for the exact section layout.

## Stage 0 — Design (`design-feature`)

**Product definition and capability closure** — the stage that turns an idea or
a feature request into an exhaustive, checkable set of acceptance criteria, so
non-frontier executor models don't silently omit the implicit work (e.g. "auth
with dashboard management and ACLs" must not collapse to a users table + a list
view).

`design-feature <slug>`:

- Folds in the raw-idea interview when starting from zero — **one question per
  turn, never batched**, each with a recommended default. The question list is
  a fixed six-slot **vagueness rubric** (affected users/roles · error & edge
  states · data shape · boundaries & limits · out of scope · success criteria);
  any requirement without a verifiable acceptance criterion is automatically
  the next question, vague wording is reframed as measurable targets, "decide
  later" answers land in the SPEC's `### Deferred decisions` section, and ≥ 3
  rubric slots left empty ends the turn `NEEDS_INPUT` instead of guessing.
- Runs **proportional research**: the capability-closure checklist first
  (cheap), external/domain research only when the domain is new to the project
  — no systematic per-feature market research.
- Walks the **capability-closure checklists** — three fixed tables, a blank
  row fails the gate and the filled rows become the Acceptance criteria:
  - **Entity closure** — for each entity introduced or touched, CRUD + state
    transitions, each with a UI entry point + API surface + test, or an
    explicit `n/a: <reason>`.
  - **Integration closure** — the feature reconciled against **every**
    subsystem in the project's **capability inventory**
    (`docs/CAPABILITIES.md`: auth, ACL, navigation, notifications, search,
    audit, settings, …), one row per subsystem, none skipped. This is what
    makes "add a blog" imply the ACL permission, the dashboard link with
    drafts on top, and the auth requirement — without being told. No
    inventory file yet → the skill derives one from the architecture doc +
    code and offers to seed it.
  - **Role matrix** — for each capability, EVERY inventory role explicitly
    `allowed`/`denied`; no role left implicit.
- Runs the **expectation sweep** — the implicit-knowledge gate: enumerates
  ≥ 10 things (≥ 5 for XS/S) a competent human would assume ship with a
  feature of this kind ("a blog has drafts", "a list has an empty state") and
  forces each into exactly one of in-scope / out-of-scope / deferred — never
  left unstated. Rejected expectations are recorded as out-of-scope, defusing
  future surprises.
- Records per-feature tooling notes (installed skills/MCPs relevant to *this*
  feature — a global sweep is `product-audit`'s job, not this).
- **Upserts**: re-running on an existing slug re-reads the SPEC + `decisions.md`
  and never destroys recorded decisions — revisions append to `decisions.md`.
- **Interaction rule**: bare `design-feature <slug>` prints a summary and asks
  what to add/remove/change (review mode); `design-feature <slug> <instruction>`
  applies the change directly, no questions.
- Scales down for XS features: the interview may be a single question and most
  closure rows resolve to `n/a` — the gate stays uniform, but passing it is
  cheap.

Once every closure row is filled or explicitly `n/a` **and the SPEC template's
Spec-lint product boxes all tick** (mechanical presence checks: no placeholders,
out-of-scope non-empty, every criterion runnable or `read-verified`, deferred
decisions present, one integration row per inventory subsystem, role matrix
complete, expectation sweep fully resolved), `design-feature` sets
`## Design status` to `designed` and hands off to `/plan-feature <slug>`.

### The redirect gate

`plan-feature` keys its gate on the SPEC's `## Design status` marker: no
`SPEC.md`, or the marker missing/not `designed`, or the Capability closure
section empty → **STOP**, no bypass flag:

```
→ Next: /design-feature <slug> — this feature has no completed product design yet
  (capability closure not done). Design it first; then re-run /plan-feature <slug>.
```

Marker `designed` and closure present → `plan-feature` proceeds to scaffold the
Engineering half.

## Stage 1 — Plan: which path, then SPEC + artifacts

**One entry point** — `plan-feature` — detects where the work comes from and
routes to the right internal step:

| You have… | Invoke | The router runs | Result |
|---|---|---|---|
| An undesigned feature (no `SPEC.md`, or `## Design status` not `designed`) | `plan-feature <slug>` | — | **STOP**, redirect to `/design-feature <slug>` (see above) |
| A GitHub issue requesting a feature | `plan-feature <N>` (or `--from-issue N`) | `plan-feature-from-issue` | Issue → filled SPEC product half (satisfies closure), with `Closes #N` |
| An already-designed feature/SPEC (`## Design status: designed`) | `plan-feature <slug>` (or `--scaffold`) | `plan-feature-scaffold` | Engineering half filled + artifact scaffolding |
| Nothing — take the next roadmap item | `plan-feature --next` | picks the next `planned` entry | Scaffolds it (redirects to `design-feature` first if it's undesigned) |

All paths **read the project first** (agent guide, documentation map,
architecture, roadmap, domain/style docs) so the feature respects the codebase's
real constraints. You only ever call `plan-feature`; the internal steps below are
invoked for you (they never appear in the menu). The raw-idea interview
previously run by `plan-feature` now lives in `design-feature` (Stage 0) —
`plan-feature` is engineering-planning only.

### The issue path — `plan-feature-from-issue`

Reads the issue, **confirms it's actually a feature** (a bug/tech-debt gets
routed to `triage-issue`), translates to the docs language if needed, maps it to
the roadmap (number, slug, dependencies, conflicts), closes scope gaps with you,
writes the SPEC's product half (satisfying capability closure — handing thin
issues to `design-feature` when needed), and wires `Closes #N` for the eventual
PR.

## Stage 1b — Plan: SPEC + artifacts (`plan-feature-scaffold`)

Once the feature is designed (`## Design status: designed`), the router runs
`plan-feature-scaffold`, which fills the **Engineering half** and writes
**docs only** into `docs/features/<NN>-<slug>/`. **The artifact set scales to the
SPEC's `Size`:**

- **XS/S** (≤ one commit / ≤ half a day) — `SPEC.md` plus the frozen
  `ACCEPTANCE.md` manifest are the only planning artifacts; no PLAN/TASKS
  ceremony, but its `### Phases` section lists **≥ 2
  phases** (`P1` implementation, `P2 — Hardening & PR` = the close-out).
  Next step: `execute-phase <NN>` (runs every remaining phase).
- **M/L** (phased work) — the full set:
  - `SPEC.md` — every section filled (goals, architecture impact, acceptance,
    branch, size, dependencies, testing, dev scenarios).
  - `ACCEPTANCE.md` — the frozen, content-addressed acceptance and validation
    manifest. Implementation cannot weaken it; a product change must amend and
    re-freeze it explicitly.
  - `PLAN.md` — phased plan whose **last implementation phase is always a
    hardening phase** (edge cases + the SPEC's dev-scenario failure modes,
    implemented and tested — not just documented).
  - `TASKS.md`, `progress.md`, `testing.md`, `known-issues.md`,
    `decisions.md`, `architecture-notes.md` — mirroring the set recent features use.
  - **L** also prompts: consider splitting into independently shippable features.

It then **registers the feature in the roadmap** (numbering, ordering,
dependencies). It does **not** create the branch or write code.

**`review-findings.md` — the fix-now fold ledger (written during Stage 4, not
scaffolded up front).** `review-change`/`audit-pr` create
`docs/features/<NN>-<slug>/review-findings.md` the first time a fix-now
finding needs to fold — fixed schema
`| id | file:line | axis | severity | class | route | folded |`, `folded`
starting `no`, deduped by `file:line`+axis, both writers sharing the same
ledger. `execute-phase`'s fold cycle ticks each folded row `folded: yes`;
`workflow-status` surfaces unfolded rows in the machine envelope's
`findings.fix_now[]`. Fixes use the equivalent path,
`docs/fix/<n>-<topic>/review-findings.md`.

> Unknowns become open questions in `decisions.md` — never blank placeholders.

## Stage 2 — Execute the unit (`execute-phase`)

`execute-phase <NN>` or `execute-phase --fix <n>` implements **all remaining
phases** in one bounded unit run. Passing an explicit `P<k>` preserves the old
atomic behavior and executes exactly that phase:

1. Verifies the branch — creates `feat/<NN>-<slug>` if you're on `main`
   (it never works on `main`). **On P1 it first commits the planning artifacts
   separately** (`docs(NN-slug): planning artifacts`), so planning history
   stays apart from implementation.
2. Verifies the frozen `ACCEPTANCE.md`, then reads `progress.md` (the **phase handoff record** — a fixed
   `Done / Remains / Gotchas / Files / Next` entry per phase), then `SPEC.md`
   + `TASKS.md` for the requested phase. That is the whole handoff — each
   phase runs in a fresh conversation under an explicit context budget (≤ 10
   full-file reads beyond the unit's own docs).
3. Gives the current phase to a fresh worker context and implements **only that
   phase** — **tests first** on core/domain and
   orchestration work: the phase's acceptance/integration tests are written
   red, then implemented to green (the SPEC's dev scenarios are the test
   list). No bundling, no premature abstraction, no unrelated refactors. A
   newly discovered, out-of-scope finding is classified by the documented
   **Autofix / Opportunistic Fix / Proposal** policy before action; only a
   low-risk local fix that passes every policy box may join the phase commit,
   and its evidence and decision are recorded in `decisions.md`. A proposal is
   reported without creating an issue unless the user explicitly requests it.
4. Runs the project's verification gate (type-check, tests, build). **Never
   commits red** — an unfixable-within-scope failure goes to
   `known-issues.md` and execution stops with a report.
5. Updates `TASKS.md`, `progress.md` (appending the phase's handoff entry in
   the fixed schema), `testing.md`, `known-issues.md` (and
   `decisions.md` if architecture moved). When reality contradicts the plan,
   `TASKS.md`/`PLAN.md` are updated and the why recorded in `decisions.md` —
   never a silent divergence.
6. Commits in conventional format — one commit per phase — and returns only a
   compact phase receipt to the unit controller.
7. The controller advances to the next pending phase without an intermediate
   review. A phase gets three repair attempts by default; repeated evidence
   without a changed code/test receipt stops as `NO-PROGRESS` instead of
   spinning.
8. The final phase flips the roadmap row to `done` and opens the PR (never
   branch-only), then hands off to the mandatory bounded
   `/loop-review-fold <NN>` → `/audit-pr` gate.

**Fresh context is a phase boundary, not a user-intervention boundary.** A
capable agent uses a fresh subagent/worker for each phase while the outer unit
run continues. A headless driver opens a new context and persists the phase
receipt. An agent without either facility may run inline using only the compact
receipt and unit docs; manual per-phase invocation remains available through an
explicit `P<k>`, but is no longer the default.

> Want the **whole roadmap** built this way — every feature through every stage,
> with you only at the merges? That's the `ship-roadmap` autopilot: one upfront
> interview, then a `/loop`-driven run of this exact flow, feature by feature,
> ending in a final report. See its entry in [SKILLS.md](SKILLS.md).

During execution, domain knowledge skills auto-load as guardrails: the
project's stack/domain guardrail skills (architecture pattern, domain rules,
framework, ORM, runtime/platform).

## Context hygiene & cost

The cheap way to run this flow is also the documented way. Fixed rules:

- **End of a unit or phase → `/log-session`, then a NEW conversation.** Never
  compact to cross that boundary. The SPEC/TASKS/progress docs plus the
  session log already ARE the persistent memory — a fresh conversation reloads
  only those, not the whole prior transcript.
- **Hand-offs to review/audit → always a fresh conversation.** Already the
  contract (a skill's model/effort composes only within its own turn); this is
  the same rule stated for its economics, not a new one.
- **Compact only mid-phase**, and only when you hold unpersisted state you
  cannot afford to lose. Even then, prefer committing WIP plus a `progress.md`
  note and cutting to a new conversation over compacting.
- **Why it's expensive:** compaction re-reads the **entire** conversation with
  the **currently selected** session model (input cost) and writes the summary
  (output cost). Auto-compact fires near the context limit — exactly when
  re-reading is most expensive. A fresh conversation costs ~zero by comparison,
  because the workflow's own docs are the memory, not the transcript.

## Stage 3 — Hardening

**Always the last implementation phase in `PLAN.md`** (the scaffold puts it
there for every M/L feature — it is not optional). Run as a phase via
`execute-phase`: edge cases, failure modes from the SPEC's dev scenarios,
empty/degraded states, races, idempotency, error mapping, and disclosure rules
(e.g. don't hide user-facing limitations). Still docs-updated and gate-verified
like any phase.

## Stage 4 — Review & audit (whole branch)

Unit-loop execution records risk triggers but does not interrupt for intermediate
reviews. It hands off once at the end to mandatory `loop-review-fold`, which
selects review or fold from persisted evidence and re-reviews only changed
HEADs. A finished unit
**always opens its PR and flips to `done`** (built, not merged — merge state lives in
the forge); the final review and the merge gate then run over the PR:

- **`loop-review-fold`** — the simple router. A previous review with an open
  queue invokes `fold-findings` first; otherwise it invokes `review-change`.
  After a changed HEAD it reviews again. Unresolved findings go to
  `triage-issue --prioritize-now`; oversized work is replanned into new `P<n>`
  phases that the user executes manually.
- **`review-change`** — the read-only review engine. Runs only the reviews that **apply to
  this platform**, checks **SPEC drift** (does the diff actually do what the
  SPEC promises — nothing contradicted, silently exceeded, or left untouched?),
  and synthesizes one **classified decision table** plus an explicit
  manual-verification checklist. It composes:
  - `review-implementation` — two-phase review across bugs, architecture
    violations, removable/dead code (minus planned-feature code), security,
    platform/runtime incompatibilities, overengineering, bundle risks, and tests
    (failing **and** missing), each classified fix-now / replan-in-unit /
    decision-required / proposal / ignore with WHY, impl risk, long-term
    impact, and a premature-opt flag.
  - `/code-review`, `/security-review`, `/verify`, and — for UI —
    `design-review`, `accessibility-review`, `brand-review` (only the applicable
    ones; never an irrelevant pass).

  Findings only, no refactor; `fix-now` folds into the current phase (never a
  tracked issue, never `plan-fix`); `replan-in-unit` appends new user-confirmed
  phases to the unit's SPEC; `decision-required` blocks until the user decides;
  independent **proposals** are batched for explicit user triage, never lost and
  no backlog created by the review.
- **`audit-pr`** — the merge gate. Acceptance criteria met, all phases complete,
  docs/tests/CI green (**never merge with pending docs**), `Closes #N` present, the
  issue/fix-index entry still tracked (removed only after merge), branch independently
  mergeable, the review axes clean, and **closure integrity** (a feature SPEC's
  `## Capability closure` has no blank rows; absent on a legacy SPEC → a dated
  `design-debt` warning, never a blocker; `n/a` for fix-governed PRs) →
  **merge-ready or a list of blockers**.

Re-run the gate (type-check, tests, build) green.

## Stage 5 — PR

- **The PR always opens — every unit, including an `XS/S` feature or a
  fix, never ends branch-only.** Opening the PR is the unit's last step and flips its
  roadmap/fix-index status to `done` (built, not merged).
- Base **always** `main`; the branch must be **independently mergeable**.
- **Never stack PRs.** If a feature is too large, split into independently
  shippable slices — never by internal phases.
- Conventional title; body includes `Closes #N` if it came from an issue.
- The pre-commit checklist (from `CLAUDE.md`): the gate (type-check, tests,
  build) green, no architecture violations, no hardcoded secrets, no hidden
  user-facing limitations, and any other project-mandated rules satisfied.

## Worked example

```
/design-feature  "<your feature>"   → interview + capability closure
   → product half of SPEC filled, `## Design status: designed` (offers to open a tracking issue)
/plan-feature  NN                   → gate reads `designed` → proceeds (no redirect)
   → engineering half filled → scaffolds docs/features/NN-<slug>/{SPEC,PLAN,TASKS,…}.md + roadmap entry
/execute-phase  NN                  → P1…hardening, fresh worker per phase, gate green, one commit each
   → final phase: flip roadmap to `done`, open the PR ("Closes #<issue>")
/loop-review-fold NN                → select review/fold from persisted evidence → review changed HEAD; triage unresolved findings
/audit-pr                           → merge gate: merge-ready or blockers (never merge with pending docs)
   → human merges
```

(Pass `P1`, `P2`, … only when you intentionally want a single atomic phase.
Legacy SPECs without `## Phases` still run implement → mark-done → open-PR in
one pass. Every path ends in the same mandatory
`/loop-review-fold` → `/audit-pr` gate.)
