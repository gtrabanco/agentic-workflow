# 17 — finding-severity-routing

> Feature specification. This is the **feature doc** read at the start
> of the workflow (`CLAUDE.md` → Feature workflow). Fill every section.
> Detailed phase tasks live in `PLAN.md` / `TASKS.md`, generated in
> planning mode from this spec.
>
> **One SPEC, two halves.** `design-feature` writes the **Product half**
> (product definition, capability closure, acceptance criteria) and stamps
> `## Design status`. `plan-feature` refuses to plan a feature not marked
> `designed`, then writes the **Engineering half** (architecture, design,
> phases, testing).

## Goal

Give the fold cycle machine-assisted per-finding model routing. `review-change`
and `audit-pr` compute a per-finding **severity** (the `Sev` column of their
decision table) today, but discard it at the end of the turn — nothing durable
survives, so `workflow-status` cannot surface it and an orchestrator picking a
fixing model for a mixed fold batch must re-open the review report by hand. This
feature introduces a small **per-unit fold ledger** that `review-change` /
`audit-pr` write their fix-now findings into (with severity), that
`execute-phase`'s fold cycle consumes and ticks, and that `workflow-status`
reads (read-only, unchanged contract) to emit `findings.fix_now[]` items
carrying `severity` + a derived `suggested_tier`. It closes the gap issue #49
identified: today the fold-cycle model ladder (routine → execution tier; subtle
→ the tier that found it) must be applied manually per finding.

## Branch

`feat/17-finding-severity-routing`

## Size

`M` — touches three skills (`review-change`, `audit-pr`, `execute-phase`,
`workflow-status`), introduces a new durable artifact with a two-state
lifecycle, and changes the machine-envelope item shape (so the schema package
must be mirrored in the same PR — see Product decisions). Multi-skill,
multi-concern → phased execution, full artifact set.

## Dependencies

None hard. Soft/related: issue [#37](https://github.com/gtrabanco/agentic-workflow/issues/37)
(`docs/fix/37-bilingual-human-docs`) documents the manual fold-cycle model
ladder in prose; this feature makes that ladder machine-assisted but does not
own or edit #37's docs. Not a blocker in either direction.

---

## Product half

Written by `design-feature`. Complete — `## Design status` below reads
`designed`.

### Context

**Why now.** Issue #49 (2026-07-12) asked whether `workflow-status`'s
`next.tier` already gives per-finding fix-model guidance; it does not.
`next.tier` (`skills/workflow-status/SKILL.md:305-319`) is a single coarse tier
for the **whole** next command, derived from a fixed command→tier map — it never
varies per finding. And `findings.fix_now` in the envelope
(`skills/workflow-status/SKILL.md:339`) is a bare array with no severity.

**The gap (verified, 2026-07-13).** `review-change` computes a per-finding
severity — the `Sev` column of its decision table
(`| Axis | Finding | Sev | Class | WHY | Route |`,
`skills/review-change/SKILL.md:243-247`) — but **persists nothing to disk**
(`grep -n -i "severity\|write\|persist" skills/review-change/SKILL.md` finds no
write path; the table lives only in the turn's output). `audit-pr` blockers are
the same. So when `execute-phase`'s fold cycle
(`skills/execute-phase/SKILL.md:404-424`) folds a **mixed** batch of fix-now
findings back into a branch — some routine/mechanical, some subtle
(logic/security/architecture, exactly the kind a weaker executor would miss) —
deciding whether an individual finding needs a stronger model than the default
execution tier requires re-reading `review-change`'s decision table by hand.

There is also a latent inconsistency this feature incidentally resolves:
`workflow-status` step 8 (`SKILL.md:130-135`) already assumes a "review report
present in the feature folder" to detect that review ran, but no skill writes
one. The fold ledger gives that detection a real artifact.

**The shape.** `workflow-status` must stay **read-only** — it may only *surface*
severity that already exists on disk (the same way it surfaces `open_prs[].ci`
or `pending_triage[].title` from existing artifacts). That forces a persistence
surface owned by the *writer* skills, not by the sensor. The chosen surface is a
new per-unit **fix-now fold ledger** (`review-findings.md`), confirmed with the
project lead 2026-07-13 (see Product decisions D1).

### Business goals

Internal tooling feature — no external business outcome. The outcome served:
cheaper and safer autonomous / semi-autonomous runs. An orchestrator (human or
driver) can pick the fixing model per finding without re-opening the review
report — routine findings stay on the cheap execution tier, subtle ones are
bumped to the tier that found them — so a mixed fold batch is neither
under-powered (a subtle bug re-folded by too weak a model) nor uniformly
over-powered (every mechanical fix run on the strong tier).

### Scope

#### In scope

- A new durable per-unit artifact **`review-findings.md`** (the *fix-now fold
  ledger*), located beside the unit's other docs:
  `docs/features/<NN>-<slug>/review-findings.md` for features,
  `docs/fix/<n>-<topic>/review-findings.md` for fixes. Fixed table schema:
  `| id | file:line | axis | severity | class | route | folded |`.
- `review-change` and `audit-pr` gain a **persist step**: when they produce
  fix-now findings on an **unmerged** unit, they append those rows (carrying the
  verbatim `Sev` value) to that unit's ledger. `id` is stable per finding
  (`F1, F2, …`); re-runs dedupe by `file:line` + `axis` (matching the existing
  merge rule at `review-change/SKILL.md:225-227`).
- `execute-phase`'s fold cycle gains a ledger step: when a finding is folded and
  committed, its ledger row's `folded` flips `no → yes` (the one and only state
  transition). A new box is added to the fold-cycle checklist
  (`execute-phase/SKILL.md:411-420`).
- `workflow-status` reads the ledger's **unfolded** (`folded: no`) fix-now rows
  and emits them as structured `findings.fix_now[]` items:
  `{id, file, axis, severity, class, route, suggested_tier}`. Stays read-only.
- A per-finding **`suggested_tier`**, derived by `workflow-status` from a fixed,
  documented map (severity `high` OR a subtle axis → `strong`; otherwise
  `cheap`). Derivation table lives in `workflow-status/SKILL.md`.
- The **machine-envelope item shape** change is mirrored in the schema package
  `packages/agentic-workflow-schema/` (types + `envelope.schema.json` + version
  bump) in the **same PR**, per the repo's Verification rule.
- `template/` mirror of the ledger convention wherever the documentation map /
  doc-templates are templated (so a fresh install inherits it).

#### Out of scope / non-goals

- **`next.tier` behavior is unchanged** — it stays the single tier for a
  homogeneous next command. The new per-finding field only applies to the
  fix_now array. (Issue #49 explicit.) → owned by nobody; deliberately frozen.
- **`workflow-status` never judges or edits** — it only surfaces severity the
  writer skills already persisted. No new judgment, no write, no repair. →
  invariant, not a feature.
- **Non-fix-now findings are not persisted here.** postpone / intentional-
  tradeoff / ignore keep their existing homes (`known-issues.md`, a tracked
  issue, `decisions.md`) via `triage-issue` (`review-change/SKILL.md:253-262`).
  The ledger is **fix-now only** — a different lifecycle (fold immediately, not
  linger awaiting triage). → owned by `triage-issue` (unchanged).
- **The orchestrator's actual model *selection*.** The envelope only *surfaces*
  `suggested_tier`; how a driver / `ship-roadmap` consumes it to pick a model is
  a separate consumption concern. → a follow-up, filed if/when a consumer needs
  it (out of this SPEC).
- **Editing #37's fold-cycle-ladder prose.** → owned by
  `docs/fix/37-bilingual-human-docs`.

### Capability closure

> Adapted to this repo (no app runtime): "UI entry point" = the skill/section
> that triggers or surfaces the behavior; "API" = the artifact schema / envelope
> field / skill contract; "test" = a grep-checkable acceptance criterion and/or
> a `GOLDEN_FIXTURE.md` run. Roles/permissions are skill-scoped — this repo has
> no runtime ACL (stated explicitly below, not left blank).

**Entity: fix-now fold ledger (`review-findings.md`)**

- [ ] Create — entry point: `review-change` / `audit-pr` persist step (fix-now
      findings on an unmerged unit) · API: `docs/**/<unit>/review-findings.md`,
      fixed table `| id | file:line | axis | severity | class | route | folded |`
      · test: `grep -q "review-findings.md" skills/review-change/SKILL.md skills/audit-pr/SKILL.md`
      and the golden-fixture run writes the file with a `high`/`med`/`low`
      severity value.
- [ ] Read/list — entry point: `workflow-status` (reads unfolded rows) +
      `execute-phase` fold cycle (reads to fold) · API: `workflow-status`
      surfaces them in `findings.fix_now[]` · test:
      `grep -q "review-findings.md" skills/workflow-status/SKILL.md` and the
      envelope example shows a populated `fix_now` item with `severity` +
      `suggested_tier`.
- [ ] Update — entry point: `execute-phase` fold cycle flips `folded: no → yes`
      on fold+commit; `review-change` re-run appends new rows, deduped by
      `file:line`+`axis` · API: same table · test: fold-cycle checklist
      (`execute-phase/SKILL.md`) contains a "ledger row marked `folded: yes`" box
      (`grep -q "folded" skills/execute-phase/SKILL.md`).
- [ ] Delete — n/a: the ledger is retained as the unit's fold history (like
      `known-issues.md`); rows are never deleted — `folded: yes` is the terminal
      state and the ledger ships with the merged unit as its audit record.
- [ ] State transitions — `folded: no → yes`, owned solely by `execute-phase`'s
      fold cycle · UI: fold-cycle checklist box · API: the `folded` column ·
      test: grep the checklist box (above). No other transition exists.

**Entity: `findings.fix_now[]` envelope item (touched — gains structure)**

- [ ] Create — n/a: not user-created; `workflow-status` emits it as a stateless
      projection of the ledger's unfolded rows each invocation.
- [ ] Read/list — entry point: the emitted envelope (consumed by an
      orchestrator/driver and readable by a human) · API: item shape
      `{id, file, axis, severity, class, route, suggested_tier}` · test:
      `envelope.schema.json` validates the new item shape; the `SKILL.md`
      envelope example shows a populated item; schema package version bumped.
- [ ] Update — n/a: recomputed (read-only) every invocation from current ledger
      state; the envelope holds no state of its own.
- [ ] Delete — a finding leaves `fix_now[]` when its ledger row reads
      `folded: yes` (`workflow-status` lists only `folded: no` rows) · test: a
      folded ledger row is absent from the envelope example / golden-fixture
      output.
- [ ] State transitions — n/a: the envelope item is a stateless projection; its
      lifecycle is the ledger's, above.

**Capability: persist fix-now findings to the ledger**

- [ ] Visible entry point: a new "persist fix-now findings" step in
      `review-change` and `audit-pr`.
- [ ] Who may execute it (ACL): skill-scoped — `review-change` / `audit-pr`
      only. n/a: no runtime user role (docs/skills repo).

**Capability: tick a finding folded**

- [ ] Visible entry point: the fold-cycle checklist box in `execute-phase`.
- [ ] Who may execute it (ACL): skill-scoped — `execute-phase`'s fold cycle
      only. n/a: no runtime user role.

**Capability: derive `suggested_tier`**

- [ ] Visible entry point: `workflow-status` emits
      `findings.fix_now[].suggested_tier`; the fixed derivation table is
      documented in `workflow-status/SKILL.md`.
- [ ] Who may execute it (ACL): skill-scoped — `workflow-status` only,
      mechanically (no judgment). n/a: no runtime user role.

**Roles / permissions**

- [ ] n/a: this repo has no runtime access-control model. Every "who" above is a
      **skill boundary** (which skill owns the write/read), not a user role.
      Assigned/revoked/viewed are therefore n/a — the skill contract is the only
      authority.

### Acceptance criteria

Each is objective and checkable — command-checkable where possible, else
`read-verified`. (Copied from the resolved closure rows above.)

1. `review-change` and `audit-pr` each contain a persist step that writes
   fix-now findings (with the `Sev` value) to the unit's `review-findings.md`
   ledger when the unit is unmerged. Check: `grep -q "review-findings.md"
   skills/review-change/SKILL.md skills/audit-pr/SKILL.md`.
2. The ledger uses the fixed schema
   `| id | file:line | axis | severity | class | route | folded |` and holds
   **fix-now findings only** (non-fix-now routed to `triage-issue` unchanged).
   Check: `read-verified` against the two skill bodies + the ledger example.
3. `execute-phase`'s fold-cycle checklist has a box that flips the folded
   finding's ledger row to `folded: yes` on fold+commit. Check:
   `grep -q "folded" skills/execute-phase/SKILL.md` and `read-verified` the box
   sits inside the existing fold-cycle checklist.
4. `workflow-status` reads only `folded: no` ledger rows and emits
   `findings.fix_now[]` items shaped
   `{id, file, axis, severity, class, route, suggested_tier}`. Check:
   `grep -q "review-findings.md" skills/workflow-status/SKILL.md` and the
   `SKILL.md` envelope example shows a populated item.
5. `suggested_tier` is derived by a fixed, documented table (severity `high` OR
   a subtle axis {security, correctness, logic, architecture, design,
   concurrency} → `strong`; otherwise `cheap`), reusing the `strong`/`cheap`
   vocabulary of `next.tier`. Check: `read-verified` the derivation table exists
   in `workflow-status/SKILL.md` and is a checklist a weak model cannot misread.
6. `next.tier` behavior is unchanged (single tier for the homogeneous next
   command). Check: `read-verified` — the `next.tier` derivation section is not
   altered in intent.
7. `workflow-status` remains read-only: no write, no edit, no judgment is added.
   Check: `read-verified` — the persist step lives only in the writer skills.
8. The schema package mirrors the new `findings.fix_now[]` item shape
   (`envelope.schema.json` + types + version bump), same PR. Check:
   `cd packages/agentic-workflow-schema && npm test` passes and the version is
   bumped.
9. The `GOLDEN_FIXTURE.md` run through the edited executor-path skills produces
   a ledger with a real severity value and a matching envelope item. Check:
   `read-verified` via the golden-fixture run log.
10. Affected docs updated (see Affected docs, once phased): the documentation
    map lists `review-findings.md`, and `template/` mirrors the convention.

### Tooling

- **`bump-skill`** (internal) — every edited `SKILL.md` (`review-change`,
  `audit-pr`, `execute-phase`, `workflow-status`) needs a `version:` bump +
  CHANGELOG/README rows; run before committing.
- **`GOLDEN_FIXTURE.md` procedure** — mandatory smoke test after editing the
  executor-path skills (`execute-phase`, `review-*`, `workflow-status`) with the
  weakest fleet model.
- **`packages/agentic-workflow-schema/` (`npm test`)** — the envelope schema
  change lives here and must stay green.
- No external MCP applies.

### Product decisions

- **D1 (2026-07-13, confirmed with project lead).** Persistence surface = a
  **new per-unit fix-now fold ledger** (`review-findings.md`), *not* the full
  review report and *not* an extension of `known-issues.md`. Rationale: it fits
  existing per-unit-artifact patterns, gives the fold cycle the durable ledger
  the issue notes it lacks, keeps `known-issues.md` reserved for its distinct
  (postponed/non-fix-now) lifecycle, and lets `workflow-status` stay read-only
  by reading an artifact the writer skills own. Rejected alternatives: (a)
  persist the whole review report — couples `workflow-status` to the report's
  markdown format; (b) extend `known-issues.md` — mixes two lifecycles.
- **D2 (2026-07-13, confirmed with project lead).** Severity representation =
  **verbatim `high`/`med`/`low`** passed through from `review-change`'s `Sev`
  column, **plus** a derived `suggested_tier`. Rejected: a lossy coarse
  `routine`/`subtle` bucket — it would discard the `high`/`med`/`low` the review
  already computes and lock the envelope into one policy. Keeping raw severity is
  zero-loss and lets any consumer apply its own policy.
- **D3 (drafting assumption, re-questionable in planning).** `suggested_tier`
  reuses the existing `strong`/`cheap` vocabulary of `next.tier` rather than
  introducing a third tier name, so a consumer already reading `next.tier` needs
  no new vocabulary. The "subtle axis" set is
  {security, correctness, logic, architecture, design, concurrency}; everything
  else (tests, style, docs, perf-low, mechanical) is routine. Conservative by
  design: over-powering a fix is harmless per CLAUDE.md's `≥` rule, under-
  powering is the regression — so `high` severity on any axis also forces
  `strong`.
- **D4 (drafting assumption).** `audit-pr` writes to the **same** ledger as
  `review-change` (both feed the fold cycle), rather than a separate audit
  ledger — the fold cycle consumes one list.

## Design status

`designed` — every capability-closure row is filled or explicitly `n/a`, and
both open scope questions from issue #49 are resolved (D1, D2).

---

## Engineering half

Written by `plan-feature` / `plan-feature-scaffold` (filled 2026-07-13), once the
Product half above is marked `designed`.

### Technical goals

1. A single durable per-unit artifact — `review-findings.md`, the **fix-now fold
   ledger** — with a fixed table schema, owned (written) by `review-change` and
   `audit-pr`, consumed by `execute-phase`'s fold cycle, and read (never written)
   by `workflow-status`.
2. A **verbatim-severity** pass-through: the writer copies `review-change`'s `Sev`
   value (`high`/`med`/`low`) into the ledger unchanged — zero-loss (D2).
3. A **mechanically-derived** `suggested_tier` (`strong`/`cheap`) that
   `workflow-status` computes from a fixed table a weak model cannot misread —
   no judgment, no new tier vocabulary (D3).
4. The machine-envelope `findings.fix_now[]` item gains structure, mirrored in the
   schema package **in the same PR** (types + `envelope.schema.json` + version
   bump), keeping `validateEnvelope()` green.
5. **Invariants held:** `workflow-status` stays read-only; `next.tier` is
   unchanged; non-fix-now findings keep their existing `triage-issue` homes.

### Architecture impact

No application runtime — the "architecture" here is the **skill-boundary graph**
and the machine-envelope contract. Layer/ownership map (each edge owned by exactly
one skill, mirroring the roadmap's per-transition ownership rule):

| Surface | Owner (writes) | Readers | Concern |
|---|---|---|---|
| `review-findings.md` ledger (create + append rows) | `review-change`, `audit-pr` | `execute-phase`, `workflow-status` | persistence of fix-now severity |
| ledger `folded: no → yes` (the one state transition) | `execute-phase` fold cycle | `workflow-status` | fold lifecycle |
| `findings.fix_now[]` envelope item (structured projection) | `workflow-status` (stateless emit) | orchestrator / driver / human | surfacing |
| `suggested_tier` derivation table | `workflow-status` (mechanical) | — | routing hint |
| `EnvelopeFixNowFinding` type + JSON schema | schema package (mirrors `workflow-status`) | `validateEnvelope()` consumers | machine contract |

- **The ledger is the persistence surface** that lets `workflow-status` stay
  read-only (it surfaces an artifact the writer skills own — the same pattern as
  `open_prs[].ci` or `pending_triage[].title`). This also gives
  `workflow-status` step 8's "review report present" detection a real artifact
  (the latent inconsistency the SPEC notes is incidentally resolved).
- **Existing `EnvelopeFixNowFinding` shape is `{ref, title, file?}`**
  (`packages/agentic-workflow-schema/src/index.ts:90`,
  `envelope.schema.json:84`). This feature **replaces** it with
  `{id, file, axis, severity, class, route, suggested_tier}` — a breaking item-shape
  change, which is exactly why the schema package must bump and be mirrored in the
  same PR.
- **No new mechanism** is invented: dedupe reuses `review-change`'s existing
  `file:line`+axis merge rule (`skills/review-change/SKILL.md:225-227`); the fold
  tick is one new box in `execute-phase`'s existing fold-cycle checklist
  (`skills/execute-phase/SKILL.md:404-424`); `suggested_tier` reuses `next.tier`'s
  `strong`/`cheap` vocabulary (`skills/workflow-status/SKILL.md:305-319`).

### Design

**Ledger file — `review-findings.md`** at `docs/features/<NN>-<slug>/` (features)
or `docs/fix/<n>-<topic>/` (fixes). Fixed schema, one row per fix-now finding:

```
| id | file:line | axis | severity | class | route | folded |
```

- `id` — stable per finding, `F1, F2, …` in first-seen order.
- `file:line`, `axis`, `severity` (verbatim `Sev`), `class` (always `fix-now` in
  this ledger), `route` (`plan-fix` / `fold into phase`) — copied from the
  writer's decision table.
- `folded` — `no` on write; `execute-phase` flips it to `yes` on fold+commit. The
  **only** state transition. Rows are never deleted (retained as the unit's fold
  history, like `known-issues.md`).

**Write rule (`review-change` / `audit-pr`).** After classification, for each
**fix-now** finding on an **unmerged** unit: append a row to the unit's ledger
(create the file with the header if absent). Re-runs **dedupe by `file:line` +
axis** — an existing row is not duplicated; a genuinely new finding gets the next
`Fn` id. Non-fix-now findings are **not** written here — they keep their
`triage-issue` routes unchanged. If the unit is already merged, nothing is written
(the fold cycle is over).

**Fold rule (`execute-phase`).** When a folded finding is fixed **and committed**,
its ledger row's `folded` flips `no → yes` — a new box inside the existing
fold-cycle checklist. This is the ledger's whole update surface.

**Read + derive (`workflow-status`).** Read each unit's ledger, take only
`folded: no` rows, and emit them as `findings.fix_now[]` items:
`{id, file, axis, severity, class, route, suggested_tier}`. `suggested_tier` is
derived by this fixed table (no judgment):

```
suggested_tier = strong  IF severity == high
                 OR axis ∈ {security, correctness, logic, architecture,
                            design, concurrency}
               = cheap    otherwise
```

`folded: yes` rows are excluded (already fixed → not pending). `workflow-status`
writes nothing.

### Decisions to confirm

Carried from the Product half's D3/D4 (flagged re-questionable) — **both
confirmed at planning, no change**:

- **D3 — confirmed.** `suggested_tier` reuses `strong`/`cheap`; subtle-axis set is
  {security, correctness, logic, architecture, design, concurrency}; `high`
  severity on any axis forces `strong`. Conservative per CLAUDE.md's `≥` rule
  (over-powering harmless, under-powering the regression). No third tier name.
- **D4 — confirmed.** `audit-pr` writes to the **same** ledger as `review-change`
  — the fold cycle consumes one list, not two.

No open questions remain → `decisions.md` records these as resolved, none open.

### Testing requirements

Repo has no application build — "green" = the skills CLI discovers every skill,
markdown/cross-refs resolve, no stack leakage, and (since the schema package is
touched) `npm test` passes there. Per-criterion checks (command where possible,
else `read-verified`) are emitted as **runnable commands** in `TASKS.md` and
`testing.md`. The mandatory `GOLDEN_FIXTURE.md` run (weakest fleet model) after
editing the executor-path skills (`review-change`, `execute-phase`,
`workflow-status`) must produce a ledger with a real severity value and a matching
envelope item (acceptance criterion 9).

### Dev scenarios

Happy path and failure modes each land in the owning skill and are exercised in
P5 (hardening):

- **Happy — mixed fold batch.** `review-change` on an unmerged unit finds one
  `high`/security (subtle) + one `low`/tests (routine) fix-now finding → both
  rows appended; `workflow-status` emits two `fix_now` items,
  `suggested_tier` `strong` and `cheap` respectively.
- **Re-run dedupe.** `review-change` runs twice on the same branch; the second run
  appends **only** genuinely new rows (dedupe by `file:line`+axis) — no duplicate
  `id`s.
- **Fold + tick.** `execute-phase` folds `F1`, commits → `F1.folded` flips
  `no → yes`; next `workflow-status` poll drops `F1` from `fix_now[]`.
- **Merged unit.** Writer runs on an already-merged unit → **no** ledger write
  (fold cycle over).
- **Missing ledger.** `workflow-status` runs on a unit with no `review-findings.md`
  (review never ran) → `fix_now` is `[]`, no error.
- **audit-pr blockers.** `audit-pr` fix-now blockers append to the **same** ledger
  (D4); `workflow-status` surfaces them identically.
- **Schema drift guard.** A malformed item shape fails `validateEnvelope()` in
  `npm test` — the schema mirror is what keeps the contract enforceable.

Reproduce locally via the `GOLDEN_FIXTURE.md` toy feature + the greps in
`testing.md`.

### Phases

Execution ledger — `execute-phase` runs **one phase per invocation** and ticks
`TASKS.md`. **5 phases**, held to the ~5 ceiling; each is one skill/concern, zero
open decisions (D1–D4 all resolved), verification gate runs locally — the
mandatory split rule does **not** trigger. `P1` also commits the planning
artifacts and confirms the roadmap row. The last phase is Hardening & PR.

- **P1 — `review-change`: ledger schema + persist step.** Define
  `review-findings.md` (schema + location + write/dedupe rule) in `review-change`;
  add the persist step (fix-now, unmerged only). `bump-skill` (minor). Commit
  planning artifacts + confirm roadmap row 17 `planned`.
- **P2 — `audit-pr`: persist to the same ledger.** `audit-pr` fix-now blockers
  append to the same `review-findings.md` (D4), same dedupe rule. `bump-skill`
  (minor).
- **P3 — `execute-phase`: fold-cycle tick.** Add the `folded: no → yes` box to the
  existing fold-cycle checklist. `bump-skill` (minor).
- **P4 — `workflow-status` + schema package: emit + mirror.** Read unfolded rows,
  emit structured `findings.fix_now[]`, document the `suggested_tier` derivation
  table; mirror the item shape in the schema package (types +
  `envelope.schema.json` + version bump); `npm test` green. `bump-skill` for
  `workflow-status` (minor).
- **P5 — Hardening & PR.** Implement/verify every dev-scenario failure edge in the
  owning skills; mirror the ledger convention into `template/` + add
  `review-findings.md` to the documentation map; `GOLDEN_FIXTURE.md` run (weakest
  model); full gate + `audit-docs`; close out (PR `Closes #49`, print URL, roadmap
  row → `done · [#PR]`, link commit).

### Deploy & rollback

No runtime deploy — "deploy" is the merged PR. Rollback = revert the PR; the
ledger convention and the schema item-shape change are the only externally-visible
surfaces, both reverted together (same PR). A stranded `review-findings.md` in a
feature folder after a revert is inert (no skill reads a schema-less file with the
old skills restored).

### Open questions / risks

- **Risk — item-shape break.** Replacing `EnvelopeFixNowFinding` `{ref, title,
  file?}` with the new shape breaks any consumer reading the old fields. Mitigation:
  same-PR schema bump + version bump signal the break; `next.tier` and the rest of
  the envelope are untouched. No known external consumer today (envelope is
  driver-internal).
- **Risk — writer/reader schema drift.** If a writer emits a column the reader
  doesn't expect, `workflow-status` silently mis-surfaces. Mitigation: the schema
  is fixed and quoted verbatim in all three skills; the golden-fixture run
  cross-checks writer output against emitted envelope.
- No open **questions** — D1–D4 resolved.

### Deliverables

- `skills/review-change/SKILL.md` — ledger schema + persist step (minor bump).
- `skills/audit-pr/SKILL.md` — persist step to the same ledger (minor bump).
- `skills/execute-phase/SKILL.md` — fold-cycle `folded: no → yes` box (minor bump).
- `skills/workflow-status/SKILL.md` — read unfolded rows, structured
  `findings.fix_now[]`, `suggested_tier` derivation table (minor bump).
- `packages/agentic-workflow-schema/` — `EnvelopeFixNowFinding` new shape (types +
  `envelope.schema.json` + tests) + version bump; `npm test` green.
- `template/` — ledger convention mirrored; documentation map lists
  `review-findings.md`.
- `CHANGELOG.md` / `CHANGELOG.es.md`, `README.md` / `README.es.md` — updated by
  `bump-skill` for each edited skill.
- This feature folder's artifact set (SPEC + PLAN/TASKS/progress/testing/
  known-issues/decisions/architecture-notes).
- PR against `main`, `Closes #49`, URL printed; roadmap row 17 → `done · [#PR]`.

### Post-merge next feature

No roadmap successor is chained on 17. After merge, `workflow-status` /
`ship-roadmap` pick the next startable unit; the natural follow-up (out of this
SPEC, filed if/when a consumer needs it) is teaching a driver / `ship-roadmap` to
**consume** `suggested_tier` for actual per-finding model selection.
