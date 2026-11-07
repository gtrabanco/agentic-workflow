---
type: fix
scope: small
ac-hash: 1d7c1fcc23185a1203ebe701edca9031cc5f7b110686214a3ba97f649155370d
---

# fix/433-precondition-closure

> **Precondition closure** — the design step enumerates the unit's operational
> prerequisites as receipted tier-0 claims; a confirmed-absent one routes to the
> four-option ask, and the plan orders prerequisite tasks before their dependents.
> Applied inline per the owner's governing request (S9–S18 below); this command
> substitutes for the lane's plan step, so the ledgers are cut here and frozen at
> the cut (2026-11-07, base `b8b1d814`).

## Issue

[#433](https://github.com/gtrabanco/agentic-workflow/issues/433) — NEW FEATURE:
precondition closure — design enumerates operational prerequisites with
receipts; confirmed-absent routes to the four-option ask. Part of the #307
direction (kernel amendment of 2026-11-06, item 3). The PR closes it with
`Closes #433` in the body.

## Specs

**S1 — The design step gains a named closure deliverable: precondition closure.**
> The design step gains a named closure deliverable: **precondition closure** — the enumeration of the unit's *operational prerequisites* (data sources, services, endpoints, tables, credentials, environment) as tier-0 claims with search receipts, where **confirmed-absent is evidence, never `unknown`**, and every absent prerequisite routes to a four-option ask.

**S2 — Design stage-1/2 enumerate operational prerequisites; each resolves to a receipted outcome.**
> 1. Design stage-1/2 enumerate operational prerequisites; each is a tier-0 claim with a receipt, resolving to **exists (path:line) / confirmed-absent (demonstrated search) / owner-answered**.

**S3 — Every confirmed-absent prerequisite enters the batched ask with exactly four options.**
> 2. Every confirmed-absent prerequisite enters the batched ask with exactly four options recorded (owner rule, not echo): **(a)** owner provides the resource; **(b)** promote a missing feature as a dependency (*declared twice* — prose + native `blocked-by`, per `AGENTS.md`); **(c)** build it inside this unit as a prerequisite task; **(d)** change scope/AC.

**S4 — The plan sequences prerequisite tasks before their dependents.**
> 3. The plan sequences prerequisite tasks **before** their dependents (topology precedes smallest-first), and a dependent task's validator only runs after its prerequisite tasks pass (see the paired order issue, soft-relate below).

**S5 — One-shot units half-covered get their project-level answer from the project charter.**
> 4. One-shot units half-covered by this closure get their project-level answer from the project charter (soft-relate to the charter issue); the per-unit remainder still asks.

**S6 — Where the change lands.**
> `skills/unit-lane/references/DESIGN.md` (new closure deliverable beside backward/sideways/forward), `PLAN.md` (ordering rule), `open-questions@1` options.

**S7 — Path: a lane-reference fix unit; no new script for the deliverable itself.**
> Lane-reference fix unit; no new script required for the deliverable itself (the sweep is search-receipt-bound).

**S8 — Cite-sources clause: adopted knowledge gets an ATTRIBUTION row in the implementing PR.**
> Same as the model-memory issue: adopted knowledge → `docs/research/ATTRIBUTION.md` row in the implementing PR.

**S9 — The intent is resolved from state, and quoted verbatim (the owner's application protocol, §0–§1).**
> Print the resolution **before** any action — the state decides the sequence, the words only pick the verb … Outcome contract for any mismatch with reality — four outputs only, never an ad-hoc branch: `proceed` … `empty` … `ambiguous` … `mismatch` … Never guess. … Number the request as `S1..Sn`, quoting my words **verbatim** — exact strings, error messages, examples. Never summarize, never add a requirement I did not ask for, mark assumptions as assumptions. Every later decision cites its `S#`.

**S10 — The frozen-failure corpus is RED before anything (§2).**
> If this change repairs known failures, extract each one's reproducer from git history / the findings ledger **as a failing check before implementing** — they are the test corpus; the change is done when every reproducer passes. Nothing else is padded in.

**S11 — Fixtures before the real tree, and the live-tree guard (§3, §4).**
> Any new mechanic (grammar, lint, script, template) is validated on a throwaway copy first: the golden fixture, fixture unit docs, or a toy repo under `mktemp -d /tmp/…`. Scratch lives outside the worktree and is removed after. Only when fixtures pass do the real files change. … **Live-tree guard**: code introduced by this change (commands, hooks, emitters, scripts with side effects) is never executed against the live repository or a shared worktree until verified — mutating paths run only in scratch (§3).

**S12 — No self-machinery on this change (§4).**
> **Work inline — never run this repo's own machinery on its own surgery** … No `review-change`, no `audit-pr`, no fold cycle, no self-granted gate exceptions on this change. Direct application: the §5 ledger freeze **is** the plan; implement against it, hand the diff to me. The one exception is the repo's deterministic gates (tests, lints) — run those always.

**S13 — The ledgers are cut here, in the repo's own shapes, and frozen at the cut (§5).**
> This command substitutes for the lane's plan step, so it writes the planning ledgers in the repo's own shapes — row contracts owned by `skills/pre-execution-review/references/LEDGERS.md`, mirrored in `docs/fix/_TEMPLATE/SPEC.md`. A change applied without them is a legacy unit with no ledgers, and the repo's reviews and audits refuse it until they are constructed — so cut them here, never retrofit them later … Task order is **dependency-topological first, smallest within a ready set** — a prerequisite task precedes its dependants even when larger.

**S14 — Test-first, differential, and model memory is never a source (§6).**
> One RED test per requested rule; for every existing command sharing changed code, one test proving its previous behavior still holds; nothing else. … **Differential check**: run each touched command against a copy of the base commit (in `mktemp -d`, never committed) and against the change; any stdout/stderr/exit difference nobody asked for is a regression — fix and pin it. … **Model memory is never a source** … Work-unit commits of ~400 authored changed lines (additions+deletions), Conventional Commit messages, tests and docs alongside behavior.

**S15 — Documentation and repository state ship in the same change (§7).**
> Ship the docs **in the same change** — never deferred: Unit doc: evidence rows appended in the declared shapes; obligations statuses flipped **only** on foreground-run validators (§8); `## Log` lines for events; Repository indexes: roadmap row, fix-index row — updated via the deterministic emitters/CLI where one exists, never hand-edited prose; a hand edit is a defect — report it instead; `docs/LOGS.md`: the session entry is appended … before the final handoff; The declared docs surface the change touches: README currency, guides, generated projections — run the renderer, never hand-write a projection.

**S16 — Verification is run in the foreground and handed off without self-approval (§8).**
> Close the obligations ledger first: every row flips to `verified` only with its validator actually run in the foreground and the evidence recorded where its `required-evidence` cell says — or an evidenced `n/a` … Then run the declared verification commands in the foreground and report each as `command: observed result`. Then stop and present: the diff summary, the obligations ledger state (rows × status), the verification block, the §7 documentation state, and every failed/skipped/pending check honestly — **I am the external verifier**.

**S17 — Correction bounds are hard (§9).**
> After my review: one correction batch fixing every reported blocker → one recheck limited to those blockers … **A new finding never earns another cycle** — it goes to me, and the turn ends.

**S18 — The failure this unit's workflow prevents is the workflow judging its own surgery.**
> This is a **local, unpublished** workflow for changing agentic-workflow itself. The failure it prevents: the workflow judging its own surgery (unit fix-258 burned 12 review→fold cycles that way). Follow this order, every step:

## Impact

What this change touches beyond its own lines:

- `skills/unit-lane/references/DESIGN.md` — the deliverable lands in Stage 2
  beside the three-direction closure (its sibling sections); the checklist grows
  one closure row and the ask-stage mechanics gain the four-option rule for
  precondition questions. No stage heading moves (`#303`'s stage-slugs are
  journal tokens), no versioned block is added or edited (`open-questions@1`'s
  `options` cell is already free-form), and the `ask-dont-infer@1` owner block
  is untouched.
- `skills/unit-lane/references/PLAN.md` — the ordering rule amends the
  smallest-first rule in place (Purpose, the tasks pane and one checklist row).
- `skills/unit-lane/SKILL.md` §3 — the one-line pointer prose that restates
  what the design step carries gains the new deliverable (docs currency).
- Consumers of the design step's output (`BRIEF.md` reviewers, `execute-phase`,
  the review pack) read one more closure deliverable — additive, nothing they
  currently read changes shape.

## Retirements

`none — the unit only adds a closure deliverable and an ordering rule; nothing
is superseded, so nothing can be removed` (the empty answer is the reason, not
an omission).

## Non-goals

- No new grammar: the `open-questions@1` block's fields and the
  `scripts/needs-input.mjs` reader are untouched (the four options live in the
  already-free-form `options` cell — the #435 precedent: "mechanics reuse
  `needs-input.mjs`/`open-questions@1`, no new grammar").
- No sweep script: the deliverable is search-receipt-bound prose (S7); the
  scriptable-checks slice would be a measured-acceptance decision (#260 rule),
  not this unit.
- No change to `execute-phase`'s execution order mechanics — sequential
  `P1…Pn` execution already runs a phase only after its predecessor passes; the
  plan-level rule (S4) is what encodes the ordering.
- No changes to `template/` — the exported scaffold copies the repo's own
  skills; the deliverable ships in `skills/`, which the template references.
- Findings discovered during implementation never expand scope beyond the
  declared regression boundary (the root suites and the two lane references).

## Risk tier

- **Tier** — `passive` · **Task Size** — `{understood: true, contained_risk: "contained", resumable_from_diff: true, ceremony: "none", verification: "readback"}`
- **Named high-risk item** — `none — not a high-tier unit`

(Copy of `bun scripts/ceremony.mjs tier classify --paths "skills/unit-lane/references/DESIGN.md,skills/unit-lane/references/PLAN.md,docs/fix/433-precondition-closure/SPEC.md"` at the cut head `b8b1d814` — `reason: "every changed path is documentation, an image or prose: no executable effect"`. The verdict can only rise; a rise appends a `## Log` line, never a quiet edit. **Owner-instruction note:** the passive tier's own contract says "this unit doc is not created at all" (readback in `docs/passive/<id>.md`, block `passive-record@1`), but the governing request S13 explicitly substitutes for the lane's plan step and orders the planning ledgers cut here in `docs/fix/433-precondition-closure/` — the explicit instruction wins (instruction precedence, root `AGENTS.md`), so the unit doc exists and the passive readback is this tier cell, never a `docs/passive/` record.)

## Future

`none — nothing was deferred`.

## Future cost

- The precondition-closure deliverable binds every future design step to
  enumerate operational prerequisites before the plan cuts tasks — the design
  and plan steps of every future unit, and every review that reads their
  output.

## Applicable tests

- `scripts/precondition-closure.test.mjs` — this unit's own pin (red-first):
  the deliverable's prose shape in `DESIGN.md`, the four-option ask, the
  `PLAN.md` ordering rule, the charter route, and the unchanged-behaviour pins
  for the surfaces sharing the changed code.
- The root suite (`node scripts/run-root-suite.mjs`) — regression boundary.

## Known pre-existing issues

- The `## Fixes` active row of `docs/ROADMAP.md` has **no deterministic
  writer** (readers only — `index-document.mjs` exports readers; the crate's
  `roadmap rowUpsert` targets the 5-column features table). Recorded by #429
  (E8) as the emitter's absence in its `## Future`. Affects this unit only in
  that its roadmap row is a disclosed hand edit (O9), never a silent one.
- **node-leg gate red, base-identical (does-not-affect).** In this environment
  (node v26.13.0), `node --test scripts/doc-discipline.test.mjs` fails the
  three AC24 store-hook cases ("hook did not create the store") and
  `node --test scripts/roadmap-moved.test.mjs` fails "the crate's roadmap check
  refuses instead of reading the pre-move file" (exit 1 ≠ 2) — deterministically
  (3× runs), and identically at a proper clone of the base `main`; both pass
  under `bun test` and the full gate passes under
  `bun scripts/run-root-suite.mjs` (89/0). Mechanism: those suites spawn the
  repo's CLIs with `process.execPath`, so the node leg exercises the crate
  under node v26.13.0, whose spawned exit classes differ here. Not introduced
  by this unit; the owner may want the node floor re-pinned or the spawned
  runtime pinned (new finding — reported, not cycled, per §9).
- **`journal aggregate` blocked by a stale fragment (does-not-affect).** The
  shared `.agentic-workflow/journal/` carries
  `20261107T151312Z-docs-batch-2-landing-safeguard-manual.md` (kind `manual` —
  outside `mechanical | narrative`), and the aggregator refuses the whole
  pending set before moving a byte. This unit's session entry used the §7
  manual-append fallback; the stale fragment is another session's pending
  entry and was left untouched (new finding — reported, not repaired).

## Tasks

- P1 — Cut the red suite `scripts/precondition-closure.test.mjs` — one pin per requested rule (S2 outcomes, S3 four options, S4 ordering, S5 charter route) plus the unchanged-behaviour pins for the existing prose contracts the changed files carry — committed alone and observed failing (validator: `bun test scripts/precondition-closure.test.mjs` exits non-zero naming the missing deliverable)
  (Implements: S2, S3, S4, S5, S10, S14)
  Relevant files: scripts/precondition-closure.test.mjs
- P2 — `DESIGN.md`: the precondition-closure deliverable beside the three-direction closure (operational prerequisites as tier-0 claims, the three receipted outcomes, the four-option ask, the charter route), the matching checklist rows; `SKILL.md` §3 pointer gains the deliverable (validator: `bun test scripts/precondition-closure.test.mjs` exits 0)
  (Implements: S1, S2, S3, S5, S6, S7, S18)
  Relevant files: skills/unit-lane/references/DESIGN.md, skills/unit-lane/SKILL.md
- P3 — `PLAN.md`: the ordering rule — prerequisite tasks precede their dependants (topology precedes smallest-first within a ready set), and a dependent task's validator only runs after its prerequisite tasks pass (validator: `bun test scripts/precondition-closure.test.mjs` exits 0)
  (Implements: S4, S6)
  Relevant files: skills/unit-lane/references/PLAN.md
- P4 — Documentation and repository state in the same change: the `ATTRIBUTION.md` row (S8), the roadmap row (disclosed hand edit — no writer, PE-005), the changeset intent, the regenerated projection, the session-log fragment (validator: `bun scripts/lint-changeset.mjs` exits 0)
  (Implements: S8, S15)
  Relevant files: docs/research/ATTRIBUTION.md, docs/ROADMAP.md, .changeset/433-precondition-closure.md, docs/generated/units.md, .agentic-workflow/journal/
- P5 — Foreground verification and ledger close: every obligation row flips on its own validator's observed run; the declared verification set runs in the foreground (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S9, S11, S12, S13, S14, S15, S16, S17)
  Relevant files: docs/fix/433-precondition-closure/SPEC.md

### Planning evidence

One row per Engineering claim the change rests on (`id | authority-kind | claim |
source | freshness | affected-decision-or-obligation` — base shape owned by
`skills/unit-lane`'s planning reference; vocabularies owned by
`skills/pre-execution-review/references/LEDGERS.md`):

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | repository | `DESIGN.md` owns the closure directions and the ask-stage mechanics — the deliverable lands as a sibling subsection of Stage 2, not a new file, and the stage headings (`## Stage <n> — <slug>`) are journal tokens that must not move | `skills/unit-lane/references/DESIGN.md:106`; `scripts/knowledge-honesty-contract.test.mjs` (stage-slug pins) | fresh at cut | O1, O2, O3, O5 |
| PE-002 | repository | `PLAN.md` owns task ordering ("smallest first" today) — the rule is amended in place in the Purpose, the tasks pane and the checklist | `skills/unit-lane/references/PLAN.md` (Purpose, § Fixed output contract, checklist) | fresh at cut | O4 |
| PE-003 | repository | the `open-questions@1` `options` cell is free-form — the four-option ask needs no grammar change (the #435 precedent states the same reuse decision) | `template/AGENTS.md` (open-questions@1 example row); `docs/fix/435-project-charter/` | fresh at cut | O3 |
| PE-004 | repository | a lane prose rule is pinned by a prose-shape suite over the reference files (the #303/#432 precedent — `scripts/knowledge-honesty-contract.test.mjs` asserts on `DESIGN.md`/`PLAN.md` bytes, and the root suite auto-discovers `scripts/*.test.mjs`) | `scripts/knowledge-honesty-contract.test.mjs`; `scripts/run-root-suite.mjs` (discovery) | fresh at cut | O1–O5, O6 |
| PE-005 | repository | the `## Fixes` active row has no deterministic writer — readers only; a hand edit is disclosed, never silent | `docs/fix/429-log-session-command/SPEC.md` (E8, and `## Future`); `packages/agentic-workflow/src/index-document.mjs` | fresh at cut | O9 |
| PE-006 | repository | the issue's motivating failures (feat/83 `SponsorCTA.astro`, the satisfied AC) occurred in a consumer project, not this repository — no in-repo reproducer exists, so the frozen-failure corpus is empty and the pin is the prose-shape suite instead | `rg -rn "SponsorCTA|precondition closure" docs/` → no hit (run 2026-11-07, receipt in `## Log` E1) | fresh at cut | S10 verdict, O1 |
| PE-007 | repository | the project charter exists as its own shipped unit (#435, `done · PR #446`) — the one-shot half-coverage routes there; the per-unit remainder still asks | `docs/ROADMAP.md` row 435; `docs/fix/435-project-charter/` | fresh at cut | O5 |
| PE-008 | repository | the passive tier's contract and the governing instruction conflict (passive says no unit doc; S13 orders ledgers cut here) — resolved by instruction precedence (prompt > docs) | `skills/execute-phase/references/risk-tiers.md` (passive-record@1); root `AGENTS.md` (instruction precedence); governing request S13 | fresh at cut | the `## Risk tier` note |

### Obligations

One row per normative behaviour, compatibility invariant, affected use case,
and required failure state (`obligation-id | authority-source |
affected-use-case-or-invariant | phase | task | implementation-owner |
validator | required-evidence | status` — shape owned by
`skills/pre-execution-review/references/LEDGERS.md`):

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S2 | Design stage-1/2 enumerate operational prerequisites (data sources, services, endpoints, tables, credentials, environment) as tier-0 claims with search receipts | P2 | DESIGN.md precondition-closure deliverable | lane agent | `bun test scripts/precondition-closure.test.mjs` exits 0 (the S2 case) | E3 in `## Log` | verified |
| O2 | S1, S2 | Each prerequisite resolves to `exists (path:line)` / `confirmed-absent (demonstrated search)` / `owner-answered`; confirmed-absent is evidence, never `unknown` | P2 | DESIGN.md precondition-closure deliverable | lane agent | `bun test scripts/precondition-closure.test.mjs` exits 0 (the S1/S2 outcome-set case) | E3 in `## Log` | verified |
| O3 | S3 | Every confirmed-absent prerequisite enters the batched ask with exactly the four options recorded, in the `open-questions@1` block the ask stage appends; a promoted dependency is declared twice (prose + native `blocked-by`) | P2 | DESIGN.md deliverable + ask-stage four-option rule | lane agent | `bun test scripts/precondition-closure.test.mjs` exits 0 (the S3 four-option case) | E3 in `## Log` | verified |
| O4 | S4 | The plan sequences prerequisite tasks before their dependents — topology precedes smallest-first within a ready set — and a dependent task's validator only runs after its prerequisite tasks pass | P3 | PLAN.md ordering rule | lane agent | `bun test scripts/precondition-closure.test.mjs` exits 0 (the S4 ordering case) | E3 in `## Log` | verified |
| O5 | S5 | A one-shot unit half-covered by the closure gets its project-level answer from the project charter; the per-unit remainder still asks | P2 | DESIGN.md deliverable (charter route) | lane agent | `bun test scripts/precondition-closure.test.mjs` exits 0 (the S5 charter case) | E3 in `## Log` | verified |
| O6 | S14 (differential) | The existing prose contracts the changed files carry keep their pinned shape — the #303 stage order, the #432 provenance journal and ceiling, the lane turn-contract ticks | P5 | differential via the existing suites | lane agent | `node scripts/run-root-suite.mjs` exits 0 (`knowledge-honesty-contract` among them) | G2 (node leg: the two reds are base-identical environment reds — the #303/#432 pins pass in both legs) + G3 (bun gate exit 0, 89/0) in `## Log` | verified |
| O7 | S6 | The changed references stay within the context budgets the manifest declares | P5 | budget check | lane agent | `bun scripts/check-skill-context.mjs --routes` exits 0 | G4 in `## Log`; the re-base receipt E5 (the first cut exceeded the #432 ceilings — caught by the gate, repaired by the declared re-base) | verified |
| O8 | S8 | Adopted knowledge (Jackson, Meyer, Wiegers & Beatty, CPM/Critical Chain) carries an `ATTRIBUTION.md` row in this change | P4 | attribution row | lane agent | `rg -n "Problem Frames" docs/research/ATTRIBUTION.md` exits 0 with ≥1 match | E7 in `## Log` | verified |
| O9 | S15 | Repository state ships in the same change: roadmap row (disclosed hand edit — no writer exists, PE-005), changeset intent, regenerated projection, session-log fragment | P4 | docs/state | lane agent | `bun scripts/lint-changeset.mjs` exits 0 and `bun scripts/docs-generate.mjs --check` exits 0 | E6 + E7 in `## Log` | verified |
| O10 | S7 | No new script for the deliverable itself — the sweep is search-receipt-bound; the only `scripts/` addition is the read-only pin suite | P5 | scope guard | lane agent | `git diff --name-only main…HEAD -- scripts/` names only `precondition-closure.test.mjs` | E9 in `## Log` | verified |

## Triaged steps

Paste of `bun scripts/unit-route.mjs --triage 433-precondition-closure` at the
cut head `b8b1d814` (2026-11-07), verbatim:

```text
TRIAGE — 433-precondition-closure (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
```

(The `relay:` lines are this session's own runtime suggestion, not part of the
step list; the governing request S12 runs the change inline, no relay.)

## Acceptance criteria

One observable, testable criterion per `S#`, each naming the check that proves
it. Frozen at the cut; `ac-hash:` in the frontmatter is the frozen section's
SHA-256.

| # | Criterion | Proved by |
|---|---|---|
| AC-S1 | `DESIGN.md` carries the named precondition-closure deliverable in Stage 2 beside the three-direction closure, enumerating the operational-prerequisite classes (data sources, services, endpoints, tables, credentials, environment) as tier-0 claims with search receipts (S1) | `bun test scripts/precondition-closure.test.mjs` exits 0 (the S1 deliverable case) |
| AC-S2 | Each prerequisite resolves to `exists (path:line)` / `confirmed-absent (demonstrated search)` / `owner-answered`, and confirmed-absent is evidence, never `unknown` (S2) | the same suite's S2 outcome-set case exits 0 |
| AC-S3 | Every confirmed-absent prerequisite enters the batched ask with exactly the four options (a)–(d) recorded in the `open-questions@1` block, and a promoted dependency is declared twice (S3) | the same suite's S3 four-option case exits 0 |
| AC-S4 | `PLAN.md` orders prerequisite tasks before their dependants — topology precedes smallest-first within a ready set — and states that a dependent task's validator only runs after its prerequisite tasks pass (S4) | the same suite's S4 ordering case exits 0 |
| AC-S5 | The one-shot half-coverage routes to the project charter with the per-unit remainder still asking (S5) | the same suite's S5 charter case exits 0 |
| AC-S6 | The change lands on exactly the declared surfaces — `DESIGN.md` (deliverable), `PLAN.md` (ordering rule), the `open-questions@1` options usage, plus the `SKILL.md` §3 currency pointer — and no versioned block or grammar changed (S6) | the same suite's surface case exits 0; `git diff --stat main…HEAD -- skills/` names only the three files |
| AC-S7 | No new script for the deliverable itself; the only `scripts/` addition is the read-only pin suite (S7) | `git diff --name-only main…HEAD -- scripts/` names only `precondition-closure.test.mjs` |
| AC-S8 | The adopted knowledge sources carry an `ATTRIBUTION.md` row in this change (S8) | `rg -n "Problem Frames" docs/research/ATTRIBUTION.md` matches ≥ 1 |
| AC-S9 | The §0 resolution was printed before any action, and every later decision cites its `S#` (S9) | `## Log` L2 carries the resolution; every obligation row's `authority-source` column names an `S#` |
| AC-S10 | The frozen-failure corpus verdict is recorded with its search receipt: no in-repo reproducer exists (the motivating failures are consumer-project hits) (S10) | `rg -rn "SponsorCTA" docs/ skills/` exits 1 (no hit); `## Log` E1 records the receipt |
| AC-S11 | No new mechanic ran against the live tree; the only new script is read-only over the working tree, and the fixtures-first discipline's scratch (if any) lives outside the worktree and is removed (S11) | the suite's `mktemp -d` discipline; `git status --porcelain` names no scratch path; O10's diff receipt |
| AC-S12 | No `review-change`/`audit-pr`/fold run appears in the receipts; the deterministic gates do (S12) | `## Log` — only `E`/`G` lines naming commands |
| AC-S13 | The planning ledgers exist in the repo's own shapes, cut before the first line of code, every obligation row `planned` at the cut with one phase + one task, and frozen except `status` (S13) | `bun scripts/phase-lint.mjs docs/fix/433-precondition-closure/SPEC.md` exits 0; the obligations table's history in this file's git log |
| AC-S14 | The suite lands RED on the missing deliverable, then GREEN, both observed in the foreground and recorded as `E` rows naming both SHAs; no claim rests on model memory (S14) | the `## Log` E rows naming the red and green SHAs |
| AC-S15 | Roadmap row, changeset intent, regenerated projection and session-log fragment ship in the same change; the roadmap row's hand edit is disclosed, never silent (S15) | `bun scripts/lint-changeset.mjs` exits 0; `bun scripts/docs-generate.mjs --check` exits 0; O9's disclosure in the `## Log` |
| AC-S16 | Every obligation row is `verified` on a foreground run or an evidenced `n/a` before the handoff, and the handoff reports each verification as `command: observed result` without self-approval (S16) | the obligations table's `status` column at the handoff; the handoff's verification block |
| AC-S17 | Corrections after the owner's verdict obey the hard bounds: one batch, one blockers-only recheck, a second pass only for a persisting same blocker (S17) | the `## Log` correction rows of the next turn |
| AC-S18 | The applied workflow is the local, unpublished one, run in the stated order §0→§9 (S18) | this doc's `## Log` line order and the handoff's section order |

## Findings

OPEN rows only (empty at plan time — appended by `review-change` and
`triage-issue`, never by this unit's author):

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

Append-only. `L1` is the issue text verbatim; later lines carry one kind token
from `log-kind@1`.

- **L1** — 2026-11-07, the issue, verbatim:
  ```
  NEW FEATURE: precondition closure — design enumerates operational prerequisites with receipts; confirmed-absent routes to the four-option ask

  **Part of the #307 direction (kernel amendment of 2026-11-06, item 3). No triage yet.**

  ## Summary

  The design step gains a named closure deliverable: **precondition closure** — the enumeration of the unit's *operational prerequisites* (data sources, services, endpoints, tables, credentials, environment) as tier-0 claims with search receipts, where **confirmed-absent is evidence, never `unknown`**, and every absent prerequisite routes to a four-option ask.

  ## Why

  - A unit consuming a data store whose producer does not exist is invalid as scoped, but is only discoverable today by luck: the sideways closure sweeps *existing* siblings; nothing asks *"does the thing I consume exist at all — do you provide it, or is a feature missing that feeds it?"*
  - Real hits this repo already paid: feat/83 in a consumer project cited a component that **does not exist** (`SponsorCTA.astro`) and an AC was discovered already-satisfied by another PR — one missing prerequisite mistaken, one satisfied prerequisite unrecognized; both found late (review/close-out), i.e. at 10× cost per Boehm's defect-cost curve.

  ## Expected behaviour

  1. Design stage-1/2 enumerate operational prerequisites; each is a tier-0 claim with a receipt, resolving to **exists (path:line) / confirmed-absent (demonstrated search) / owner-answered**.
  2. Every confirmed-absent prerequisite enters the batched ask with exactly four options recorded (owner rule, not echo): **(a)** owner provides the resource; **(b)** promote a missing feature as a dependency (*declared twice* — prose + native `blocked-by`, per `AGENTS.md`); **(c)** build it inside this unit as a prerequisite task; **(d)** change scope/AC.
  3. The plan sequences prerequisite tasks **before** their dependents (topology precedes smallest-first), and a dependent task's validator only runs after its prerequisite tasks pass (see the paired order issue, soft-relate below).
  4. One-shot units half-covered by this closure get their project-level answer from the project charter (soft-relate to the charter issue); the per-unit remainder still asks.

  ## Where

  `skills/unit-lane/references/DESIGN.md` (new closure deliverable beside backward/sideways/forward), `PLAN.md` (ordering rule), `open-questions@1` options.

  ## Path

  Lane-reference fix unit; no new script required for the deliverable itself (the sweep is search-receipt-bound).
  ```
- **L2** — 2026-11-07, the owner's governing request S1, verbatim: `Apply to this repository: issue #433` (with the §0–§9 protocol quoted in S9–S18). The §0 state resolution printed before acting: `proceed` — fresh application (no `docs/fix/433-*` dir, no ledgers, no phases at the branch tip `b8b1d814`).
- **E1** — 2026-11-07, the §2 frozen-failure corpus receipt: `rg -rn "SponsorCTA|precondition closure" docs/ skills/` · exit 1 · no hit — the issue's motivating failures are consumer-project hits, no in-repo reproducer exists; the change's pin is the prose-shape suite instead (PE-006).
- **G1** — 2026-11-07, `bun scripts/phase-lint.mjs docs/fix/433-precondition-closure/SPEC.md` · exit 0 · P1–P5 PASS (6/6 each), fingerprint `c0ccce82…`.
- **E2** — 2026-11-07, `bun test scripts/precondition-closure.test.mjs` at the red commit `4a53b4bc` · exit 1 · 8 fail / 2 pass — every deliverable pin red on the missing rule; the two structural differential pins green (stage order, no-new-grammar).
- **E3** — 2026-11-07, `bun test scripts/precondition-closure.test.mjs` at the green commit `e964bb7c` · exit 0 · 10 pass / 0 fail.
- **P1** — 2026-11-07, the ledgers frozen before the first line of code · `72c271f3`.
- **P2** — 2026-11-07, the red suite landed alone, observed failing · `4a53b4bc`.
- **P3** — 2026-11-07, the rule landed: `DESIGN.md` §Precondition closure + checklist rows, `PLAN.md` ordering rule, `SKILL.md` §3 pointer · `e964bb7c`.
- **E4** — 2026-11-07, the red gate caught a real regression of this change: `check-skill-context.test.mjs` and `promise-coherence.test.mjs` red — DESIGN.md measured 4743 est / 327 lines over the re-based-at-#432 ceilings 4528 / 322, which made `measurements()` unavailable and flipped promise-coherence's measure class to PASS. One root cause, two suites. Differential against a base copy confirmed both green at base.
- **E5** — 2026-11-07, the repair — the declared re-base (the #432-precedent route, growth source named, not trimmed semantics): `referenceEstimateMax`/`referenceLinesMax` re-based to exact `ceil(4743 x 1.10) = 5218` / `ceil(327 x 1.10) = 360` in `SKILL_CONTEXT_BUDGETS.json`'s `referenceSources` (fix 433 entry); after it: `bun scripts/check-skill-context.mjs` · exit 0; both suites exit 0 under `bun test` and `node --test`.
- **P4** — 2026-11-07, docs/state: ATTRIBUTION rows (S8), roadmap row (disclosed hand edit — E7), changeset intent via the writer script, projection regenerated, session log appended (manual fallback — E8) · `eba5bc1a`.
- **G2** — 2026-11-07, `node scripts/run-root-suite.mjs` · exit 1 · two suites red (`doc-discipline` AC24 ×3, `roadmap-moved` crate-refusal ×1) — demonstrated identical at a proper clone of base `main` (3× deterministic; `bun run-root-suite.mjs` of the same suite green below) — pre-existing node-leg environment reds (node v26.13.0 spawned-runtime exit classes), recorded in Known pre-existing issues, never attributed to this change.
- **G3** — 2026-11-07, `bun scripts/run-root-suite.mjs` · exit 0 · 89 PASS / 0 FAIL — the environment-valid full gate (bun-first, per the runtime convention); `scripts/golden-fixture.test.mjs` (the fixture's mechanical half) among them.
- **G4** — 2026-11-07, `bun scripts/check-skill-context.mjs --routes` · exit 0 · `PASS route budgets: 14 routes`; `--documents` · exit 0.
- **E6** — 2026-11-07, `bun scripts/lint-changeset.mjs` · exit 0; `bun scripts/docs-generate.mjs` regenerated `docs/generated/units.md`, `--check` · exit 0.
- **E7** — 2026-11-07, `rg -n "Problem Frames" docs/research/ATTRIBUTION.md` · exit 0 · 1 match (O8); the roadmap row is a hand edit because the `## Fixes` active row has no writer (PE-005, #429 E8 precedent) — disclosed, never silent.
- **E8** — 2026-11-07, `bun packages/agentic-workflow/bin/agentic-workflow.mjs journal aggregate` · exit 2 block `JOURNAL REFUSAL — unparseable fragment name "20261107T151312Z-docs-batch-2-landing-safeguard-manual.md"` — a stale fragment from another session blocks the whole batch; this unit's entry used the §7 manual-append fallback, the fragment left untouched (Known pre-existing issues).
- **E9** — 2026-11-07, `git diff --name-only main…HEAD -- scripts/` · names only `precondition-closure.test.mjs` (O10 — no new script for the deliverable itself, S7).
- **E10** — 2026-11-07, the golden-fixture weak-model smoke (GOLDEN_FIXTURE.md steps 2–4) skipped: this environment exposes no second/weaker model to run the smoke against; the fixture's mechanical half ran in G3. Named skip, not silence.
- **P5** — 2026-11-07, the obligations closed on foreground runs (E3, G3, G4, E6, E7, E9) and the diff handed to the owner — `fb4c94eb`.
- **E11** — 2026-11-07, the external verifier's verdict arrived as the owner instruction `Create the PR`; the push was blocked by the pre-push gate at `crate-suite-node`, root-caused to the fragment `c9dd1d88` committed to main with kind `manual` (outside `journal-fragment-grammar@1`'s closed set, branch slug contradicting its own header) — unaggregateable and carrier-probe-red on any checkout. Rider repair `7d430265`: renamed from the entry's own header facts (branch `docs-domain-separation-safeguard`, kind `narrative`, session `local` — the documented no-session fallback); crate suites green both runtimes after (bun 388/0, node exit 0).
- **G5** — 2026-11-07, `bun scripts/local-gate.mjs` · exit 0 · `PASS — 12 step(s) in 231s` (full gate incl. schema-build, schema-node-compat, crate suites, root suites).
- **P6** — 2026-11-07, pushed `origin/feat/433-precondition-closure` and opened the PR — `## References` carries the URL; the roadmap row settled to `done · [#455]` (hand edit, disclosed) and the projection re-rendered in the follow-up commit.

## Next

The PR is open: settle decision with the owner (merge PR #455). After the
merge, the `## Fixes` row is removed (the table's own rule) and the renamed
journal fragment is consumable by `journal aggregate` on the merged tree.

## References

- Issue [#433](https://github.com/gtrabanco/agentic-workflow/issues/433) — PR [#455](https://github.com/gtrabanco/agentic-workflow/pull/455); soft:
  [#307](https://github.com/gtrabanco/agentic-workflow/issues/307) (kernel
  amendment item 3), the charter unit `docs/fix/435-project-charter/`.
- `docs/workflow/ISSUE_WORKFLOW.md` (dependency semantics — the declared-twice
  rule), `skills/unit-lane/references/DESIGN.md` (the deliverable's owner).

## Branch

`feat/433-precondition-closure`

## Depends on

None (the issue's own dependency table: "No hard blocker").

## Regression scope

- The design/plan steps' existing contracts — the #303 ordered stages, the
  #432 provenance journal and certainty ceiling, the lane turn-contract ticks:
  `scripts/knowledge-honesty-contract.test.mjs` (in the root suite).
- The lane references' context budgets: `bun scripts/check-skill-context.mjs --routes`.
- The full root suite: `node scripts/run-root-suite.mjs`.
