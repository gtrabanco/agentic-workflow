# 11 — adversarial-multi-reviewer

> Feature specification. This is the **feature doc** read at the start
> of the workflow (`CLAUDE.md` → Feature workflow). Fill every section.
> Detailed phase tasks live in `PLAN.md` / `TASKS.md`.
>
> **One SPEC, two halves.** The Product half below was written from issue
> [#18](https://github.com/gtrabanco/agentic-workflow/issues/18) by
> `plan-feature-from-issue`; the Engineering half by `plan-feature-scaffold`.

## Goal

Add an **opt-in** multi-reviewer mode to `review-change` — `--adversarial N` —
that runs **N independent, context-clean, diff-only** reviewers in **parallel**,
each carrying the adversarial "assume the diff is WRONG" stance introduced by
feature 05 (U2), then merges and dedupes their findings by `file:line` into the
single classified decision table `review-change` already produces. It exists
because a single adversarial reviewer decorrelates *some* blind spots, but N
reviewers across different model families decorrelate *more* — at a cost (2–3× the
most expensive review stage), which is exactly why it stays **default OFF** and is
only **auto-recommended** (never forced) for `L` or sensitive-flagged changes.
`ship-roadmap`, which runs unattended, **enables it as a hard floor** for its
`L`/sensitive checkpoint cadence.

## Branch

`feat/11-adversarial-multi-reviewer`

## Size

`M` — mechanical but multi-surface (two `SKILL.md` contracts + one workflow doc +
release metadata), and the reviewer-orchestration contract it adds (parallel
spawn, cross-platform fallbacks, dedup + confirm-by-≥1 semantics, the
ship-roadmap hard-floor decision) is substantive design a weak executor must not
improvise — so it earns the full artifact set. Four phases, last = hardening. Not
split: the plan is ≤5 phases, each phase is a single concern/layer, and every
design decision is resolved here (see `decisions.md`).

## Dependencies

- **Hard dependency: feature 05 `adversarial-context-clean-review` (U2)** — this
  feature builds directly on U2's two contributions: `review-implementation`'s
  find phase being **adversarial by default** ("assume the diff is WRONG; prove
  it does not work") and `review-change`'s **context-clean** turn-contract box (a
  review must run in a conversation that did not write the diff). `--adversarial
  N` *multiplies* that single reviewer into N; it does not relax the contract.
  Feature 05 is `done` **and merged**
  ([#23](https://github.com/gtrabanco/agentic-workflow/pull/23)), so the
  dependency is satisfied — planning and execution are both unblocked.
- No other feature dependency; no external gate.

---

## Product half

Written from issue #18 by `plan-feature-from-issue`.

### Context

Feature 05 (U2) hardened the mandatory end-of-unit review two ways: the finding
engine now assumes the diff is broken and tries to prove it, and the reviewing
conversation must be **context-clean** (it must not be the one that wrote the
diff, or it shares the author's blind spots). That single adversarial,
context-clean pass captures most of the value for a normal change.

But for **high-risk** changes (an `L` feature, or one touching a sensitive area —
auth, payments, destructive migrations, secrets, CI config) a single reviewer is
still one point of view. The Bun-port pattern the design session referenced —
*"1 implementer, 2+ adversarial reviewers whose only job is to find bugs and
reasons the code does not work"* — decorrelates blind spots further by running
**several** independent reviewers, ideally across **different model families**
(same-family instances share training blind spots; cross-family review catches
what one family systematically misses — the invariant feature 04 already states
for the single reviewer).

The gap: `review-change` today runs exactly one reviewer. There is no way to ask
for N, no defined way to merge N reviewers' findings without double-counting, and
no policy for when the extra cost is worth it. Feature 05 explicitly deferred this
(`--adversarial N`) to U8/#18, *depending on* U2 — which is now merged.

### Business goals

Internal/technical feature — no external business goal. The outcome is a
higher-assurance review option for high-risk changes, opt-in so its 2–3× cost is
only paid when the risk justifies it, and a hard floor under `ship-roadmap`'s
unattended runs where no human is present to exercise skip judgment.

### Scope

#### In scope

- **`review-change --adversarial N`** — a new opt-in flag on the existing
  `review-change` skill:
  - N independent reviewers, each **context-clean** (did not write the diff),
    **diff-only**, carrying U2's **adversarial stance**, run in **parallel**.
  - **Platform-adaptive spawn** (per the skills' portability standard, three
    tiers): Claude Code → N parallel **subagents**; another agent with headless
    invocation → N parallel **headless invocations**; neither → the documented
    **inline fallback** of N **sequential fresh conversations**.
  - **Prefer model-family diversity** across the N reviewers (decorrelates blind
    spots) — a preference, not a hard requirement (an agent with one family still
    runs N same-family reviewers and says so).
  - **Merge + dedupe by `file:line`** into the one classified decision table
    `review-change` already emits; a finding surfaced by **≥1** reviewer enters
    classification normally (inclusion threshold is 1, not a majority). Record how
    many of the N reviewers flagged each finding as a confidence signal.
  - **Default OFF.** No flag → today's single-reviewer behavior, unchanged.
  - **Auto-recommended, never forced,** for `L` or sensitive-flagged changes:
    `review-change` surfaces the recommendation but proceeds single-reviewer if
    the user doesn't opt in.
- **`ship-roadmap` hard floor** — the autopilot's REVIEW step **enables**
  `--adversarial N` (default N=2) for `L` or sensitive-flagged features as a
  **hard floor**, because it runs unattended and a risk-proportional review floor
  replaces the absent human's skip judgment. This is a **recorded decision:** it
  deliberately does **not** match the interactive advisory checkpoint — do not
  "align" the two.
- **`docs/workflow/REVIEW_AND_CLASSIFY.md`** — document the opt-in adversarial
  multi-reviewer mode (when to reach for it, the cost note, the three spawn
  tiers).
- **MINOR `version:` bump** for `review-change` and `ship-roadmap` (new
  backward-compatible capability); `CHANGELOG.md` + `CHANGELOG.es.md` rows; README
  skill/model tables refreshed — via `bump-skill`. A `docs/workflow/MIGRATION.md`
  note (additive capability, not a breaking change).

#### Out of scope / non-goals

- **Changing the single-reviewer default.** Absent the flag, behavior is
  byte-for-byte today's. Owner: this feature must not alter the default path.
- **A voting/quorum threshold to *include* a finding.** Inclusion is ≥1 reviewer;
  the existing classification rubric (`review-implementation`) still decides
  fix-now/postpone/ignore/tradeoff. A majority-to-include scheme is explicitly not
  built (it would suppress a real bug only one sharp reviewer caught).
- **Relaxing U2's context-clean contract.** Each reviewer is still context-clean;
  the mode multiplies reviewers, it does not weaken the invariant. Owner:
  feature 05 owns the contract; this feature inherits it.
- **Auto-selecting N or the model families.** N is user-supplied (or ship-roadmap's
  fixed floor of 2); family diversity is a documented preference the agent
  satisfies with whatever families it has.
- **A new review engine.** Reviewers reuse `review-implementation` +
  `review-change`'s existing applicable-axes logic — no parallel findings engine.
- **`audit-pr` / `product-audit` multi-reviewer modes** — this feature touches
  `review-change` (and `ship-roadmap`'s use of it) only.

### Capability closure

This is a docs/skills-workflow feature: it introduces **no runtime entity** and
**no new persisted state** — it adds an opt-in behavior to an existing review
skill and a policy to an existing autopilot. Entity/CRUD rows are therefore `n/a`
with reasons; the "capabilities" are the review behaviors that change, each mapped
to a checkable surface.

```markdown
For EACH entity this feature introduces or touches:
- [x] Create — n/a: no runtime entity; feature edits skill/docs text only
- [x] Read/list — n/a: no runtime entity
- [x] Update — n/a: no runtime entity
- [x] Delete — n/a: no runtime entity
- [x] State transitions — n/a: no runtime entity

For EACH capability (action a user takes):
- [x] "Run an N-reviewer adversarial review of a change" — entry point:
      `review-change --adversarial N` · ACL: n/a (no auth surface)
- [x] "Get the N-reviewer mode recommended for a high-risk change" — entry point:
      `review-change` auto-recommends it (never forces) when the change is `L`
      or sensitive-flagged · ACL: n/a
- [x] "Have the autopilot enforce the N-reviewer floor unattended" — entry point:
      `ship-roadmap` REVIEW step enables `--adversarial 2` for `L`/sensitive
      features as a hard floor · ACL: n/a
- [x] "Default single-reviewer review, unchanged" — entry point: `review-change`
      with no flag · ACL: n/a

For EACH role / permission:
- [x] n/a — no roles/permissions; the workflow skills have no auth model
```

### Acceptance criteria

All command-checkable except the `read-verified` items. Commands assume repo root.

- **AC1 — flag exists in `review-change`.** The argument-hint and body advertise
  `--adversarial N`:
  ```sh
  grep -q -- "--adversarial" skills/review-change/SKILL.md   # exit 0
  ```
- **AC2 — three spawn tiers documented in `review-change`.** Subagents /
  headless / sequential-fresh-conversation fallback all appear:
  ```sh
  grep -qi "subagent" skills/review-change/SKILL.md
  grep -qi "headless" skills/review-change/SKILL.md
  grep -qi "sequential\|fresh conversation" skills/review-change/SKILL.md
  # all three exit 0
  ```
- **AC3 — merge/dedup + confirm-by-≥1 documented in `review-change`.**
  ```sh
  grep -qi "dedup\|deduped\|deduplicat" skills/review-change/SKILL.md
  grep -qi "file:line" skills/review-change/SKILL.md
  # both exit 0; the ≥1-reviewer inclusion rule is read-verified in the same section
  ```
- **AC4 — default OFF + auto-recommend for L/sensitive documented in
  `review-change`.**
  ```sh
  grep -qi "default off\|off by default\|opt-in" skills/review-change/SKILL.md
  grep -qi "sensitive" skills/review-change/SKILL.md
  # both exit 0
  ```
- **AC5 — ship-roadmap hard floor + do-not-align note.** `ship-roadmap`'s REVIEW
  step enables the mode for L/sensitive as a floor and records that it is
  deliberately not aligned with the interactive advisory checkpoint:
  ```sh
  grep -qi -- "--adversarial" skills/ship-roadmap/SKILL.md
  grep -qi "floor" skills/ship-roadmap/SKILL.md
  # both exit 0; the "do not align with the interactive advisory checkpoint"
  # rationale is read-verified in the REVIEW step
  ```
- **AC6 — workflow doc updated.** `REVIEW_AND_CLASSIFY.md` documents the opt-in
  adversarial multi-reviewer mode + its cost note:
  ```sh
  grep -qi "adversarial" docs/workflow/REVIEW_AND_CLASSIFY.md   # exit 0
  ```
- **AC7 — U2 contract intact.** `review-change`'s context-clean turn-contract box
  is NOT weakened — it still requires a conversation that did not write the diff:
  ```sh
  grep -qi "did NOT implement the change\|did not write the diff" skills/review-change/SKILL.md   # exit 0
  ```
- **AC8 — default path untouched.** No flag → single reviewer: the pre-feature
  Process steps (findings engine → applicable pack → synthesize) are unchanged
  for the no-flag case (read-verified: the `--adversarial N` behavior is
  additive, gated on the flag; the default Process reads as before).
- **AC9 — MINOR bumps + changelog + tables** (bump-skill enforced):
  ```sh
  grep -c "adversarial\|multi-reviewer\|11-adversarial" CHANGELOG.md   # >= 1
  ```
  read-verified: `review-change` and `ship-roadmap` each got a MINOR `version:`
  bump vs their pre-feature value, mirrored in `CHANGELOG.md` +
  `CHANGELOG.es.md` + both README skill tables.
- **AC10 — discovery + no dangling refs.** `npx skills add . --list` lists every
  skill (no malformed frontmatter), and no doc points at a review-change behavior
  that doesn't exist (read-verified in the hardening phase).

### Tooling

- `bump-skill` (this repo's internal skill) is the mechanical enforcement for
  AC9 — run it after the skill edits, before commit.
- No MCP servers apply.

### Product decisions

Settled in the 2026-07-09 design session (recorded in issue #18):
default OFF; opt-in via `--adversarial N`; auto-recommended (not forced) for
`L`/sensitive; `ship-roadmap` enables it as an unattended **hard floor** (N=2)
that deliberately does not mirror the interactive advisory checkpoint; inclusion
threshold ≥1 reviewer; model-family diversity preferred; 2–3× cost is the reason
it stays opt-in. No further product decisions open. Engineering decisions in
`decisions.md`.

## Design status

`designed` — every capability-closure row is filled or explicitly `n/a`, and the
acceptance criteria are enumerated as runnable checks.

---

## Engineering half

Written by `plan-feature-scaffold`.

### Technical goals

- One new **opt-in** code path in `review-change`, fully gated on `--adversarial
  N`; the default path is provably unchanged (AC8).
- A single, unambiguous **merge/dedupe contract** (by `file:line`, confirm-by-≥1,
  reviewer-count recorded) so N reviewers collapse into the one existing decision
  table without double-counting.
- **Platform-adaptive** spawn documented at all three portability tiers so the
  mode works on any agent, not just Claude Code.
- `ship-roadmap`'s floor and the interactive advisory are kept **intentionally
  distinct** — the SPEC records this so a future "consistency" edit doesn't
  collapse them.
- Zero change to `review-implementation`, the schema, or the npm package.

### Architecture impact

- **Docs/skills layer only.** No code, no runtime, no schema. Invariants: the
  default (no-flag) `review-change` path is untouched (AC8); U2's context-clean
  contract is inherited, not modified (AC7); `review-implementation` (the engine)
  is not edited — the N reviewers each run the existing engine.
- Follows the same "orchestrator composes what it synthesizes" principle already
  in `review-change`: the N reviewers are spawned/composed by `review-change`,
  which then merges their tables.

### Design

**The flag.** `review-change --adversarial N`:

- `N` is the reviewer count, **integer ≥ 2**. `N` absent → default single-reviewer
  mode (unchanged). `N` given but `< 2` → treat as a usage error: state that
  `--adversarial` needs N≥2 and fall back to the single reviewer (do not silently
  run 1). `ship-roadmap`'s floor passes `N=2`.
- The flag changes **only** the *findings-gathering* stage (Process step 1 today).
  Steps 2–10 (SPEC-drift, workflow-discipline, applicable pack, synthesize,
  manual-verify, triage, report, `→ Next:`) run once, over the **merged** table.

**Spawning the N reviewers (platform-adaptive, three tiers).** Each reviewer is a
**context-clean, diff-only, adversarial** run of the existing findings engine
(`review-implementation` **only** — the applicable pack runs **once**, over the
merged table, as part of the unchanged steps 2–10), reviewing the same scope:

1. **Claude Code** → spawn **N subagents in parallel**, one reviewer each. Prefer
   assigning **different model families** across them where the environment offers
   more than one.
2. **Another agent with headless invocation** → **N parallel headless
   invocations**, each a fresh context reviewing the diff.
3. **Neither** (inline fallback) → **N sequential fresh conversations** — slower,
   documented explicitly as the floor-of-last-resort so no agent is blocked.

Each reviewer returns its own classified findings (the existing
`review-implementation` output). The orchestrating `review-change` never reviews
in the same breath as authoring — U2's context-clean box still applies to the
orchestrator too; the reviewers are fresh by construction.

**Merge + dedupe.** The orchestrator collects the N reviewers' findings and:

- **Dedupes by `file:line`** (plus axis, to avoid collapsing two genuinely
  different findings on the same line). Identical findings from multiple reviewers
  become **one** row.
- Annotates each merged row with **how many of the N reviewers flagged it**
  (a confidence signal shown in the table, e.g. a `Reviewers` column `2/3`).
- **Inclusion threshold = ≥1**: a finding any single reviewer raised enters
  classification normally. No majority gate — a real defect only one sharp
  reviewer caught must not be dropped.
- The merged set then flows through the **unchanged** classification + synthesis
  (Process steps 6–9), producing the same fixed-format report + `PASS | FAIL`.

**Default OFF + auto-recommend.** Absent the flag, nothing changes. When
`review-change` determines the change is `L` or sensitive-flagged (per the
project's sensitive-area list) it **recommends** `--adversarial N` in its output
(and/or in the `→ Next:` block) but proceeds single-reviewer unless the user opts
in. The recommendation is advisory in interactive use.

**ship-roadmap hard floor.** In `ship-roadmap`'s REVIEW step, the current
risk-proportional cadence is: XS/S + non-sensitive M → one end review; L/sensitive
→ checkpoint every 2 phases. This feature adds: for **L or sensitive-flagged**
features, the composed `review-change` runs **`--adversarial 2`** — a **hard
floor**, because the autopilot is unattended and a risk-proportional review floor
replaces the human's skip judgment. Record inline that this floor **deliberately
does not mirror** the interactive advisory checkpoint (which stays opt-in) — the
two are intentionally different and must not be "aligned".

**Docs.** `REVIEW_AND_CLASSIFY.md` gains a short "Adversarial multi-reviewer
(opt-in)" subsection: what it is, the three spawn tiers, the ≥1 inclusion rule,
and the **cost note** (2–3× the most expensive stage → why it's opt-in). A
`MIGRATION.md` entry records the additive capability.

### Decisions to confirm

All resolved — see `decisions.md`. Summary: N≥2 (N<2 → usage error, fall back to
single); inclusion ≥1 reviewer (no quorum); dedupe key = `file:line`+axis;
reviewer-count recorded as a confidence column; MINOR bump for both skills;
ship-roadmap floor = N=2 and intentionally distinct from the interactive advisory;
no change to `review-implementation`/schema/package.

### Testing requirements

Documentation/skills feature — the "tests" are the AC grep commands run at the
verification gate (see `testing.md`), plus `npx skills add . --list` for discovery
integrity. No unit/integration test code is added. Layer: repo-verification
(the CLAUDE.md "Verification" section) — markdown well-formed, cross-references
resolve, no leaked stack/real-project references, skills all discoverable.

### Dev scenarios

Orchestration-only; no new domain. Each reproduced by reading the resulting
`SKILL.md`/doc text and running the AC greps against the working tree.

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| `adversarial:no-flag` | default single-review path unchanged | absence of the flag (AC8) — the default Process reads as before |
| `adversarial:sub-2` | `--adversarial 1` (or 0) rejected | the N≥2 guard → usage error + single-reviewer fallback (read-verified in the flag section) |
| `adversarial:dedup` | same finding raised by 2 reviewers | the `file:line`+axis dedupe → one row, `Reviewers 2/N` (AC3) |
| `adversarial:no-subagents` | an agent with neither subagents nor headless | the documented sequential-fresh-conversation fallback (AC2 tier 3) |
| `adversarial:floor` | an unattended L/sensitive ship-roadmap feature | ship-roadmap enables `--adversarial 2` as a hard floor (AC5) |

### Phases

- **P1 — `review-change --adversarial N` mode.** Add the flag to the
  argument-hint + body: the N≥2 semantics, the three-tier platform-adaptive
  spawn, the merge/dedupe + confirm-by-≥1 contract, default OFF + auto-recommend
  for L/sensitive, and the Portability fallback line. Do not touch the default
  Process path beyond gating step 1 on the flag. (One concern: the `review-change`
  contract.) Gate: AC1–AC4, AC7, AC8.
- **P2 — ship-roadmap floor + workflow doc.** Wire `ship-roadmap`'s REVIEW step to
  enable `--adversarial 2` as a hard floor for L/sensitive features, with the
  do-not-align note; add the "Adversarial multi-reviewer (opt-in)" subsection +
  cost note to `REVIEW_AND_CLASSIFY.md`. (One concern: the autopilot policy + its
  workflow doc.) Gate: AC5, AC6.
- **P3 — Release metadata.** Run `bump-skill` (MINOR × 2 for `review-change` +
  `ship-roadmap`, both CHANGELOGs, both README tables); add the `MIGRATION.md`
  note. (One concern: release/version docs.) Gate: AC9.
- **P4 — Hardening + PR.** Sweep for dangling references (a doc pointing at a
  review-change behavior that doesn't exist), confirm discovery (`npx skills add
  . --list`, AC10), confirm the schema package + `review-implementation` are
  untouched, re-read the merge/dedupe + floor sections for internal coherence,
  re-run every AC command; then open the PR (`Closes #18`). Gate: AC10 + full
  AC re-run.

### Deploy & rollback

**n/a** — merging is the deploy. Rollback = revert the PR; no data, no migration,
no flag. The `--adversarial N` flag is additive and default-off, so a revert
restores today's behavior exactly.

### Open questions / risks

- **RISK (low): reviewer cost surprise.** The mode is 2–3× the most expensive
  review stage. Mitigation: default OFF, explicit cost note in the docs, and only
  ship-roadmap enables it automatically (bounded to L/sensitive, N=2).
- **RISK (low): family diversity unavailable.** An agent with a single model
  family runs N same-family reviewers — less decorrelation than intended.
  Mitigation: the preference is documented as "prefer, where available" and the
  agent states when it couldn't diversify; not a blocker.
- **RESOLVED:** inclusion threshold? ≥1 reviewer (no quorum) — see `decisions.md`.
- **RESOLVED:** does ship-roadmap's floor match the interactive advisory? No —
  intentionally distinct; recorded so it isn't "aligned" later.
- **RESOLVED:** dependency U2 merged? Yes (#23).

### Deliverables

- `skills/review-change/SKILL.md` with the `--adversarial N` mode (flag,
  three-tier spawn, merge/dedupe + confirm-by-≥1, default OFF + auto-recommend),
  MINOR-bumped.
- `skills/ship-roadmap/SKILL.md` with the L/sensitive `--adversarial 2` hard floor
  + do-not-align note, MINOR-bumped.
- `docs/workflow/REVIEW_AND_CLASSIFY.md` "Adversarial multi-reviewer (opt-in)"
  subsection + cost note.
- `docs/workflow/MIGRATION.md` entry; `CHANGELOG.md` + `CHANGELOG.es.md` rows;
  refreshed README skill/model tables.
- PR with `Closes #18`, URL printed in chat.

### Post-merge next feature

Per `docs/features/ROADMAP.md` — the remaining backlog units (U9/#19
golden-fixture, U10/#20 init-workspace upgrade, U11/#21 final docs). No feature
`Depends on:` this one, so ordering is by backlog priority, not dependency.
