---
type: fix
scope: medium
ac-hash: pending
---

# fix/560-307-residual-completion

> The #307 completeness audit left three residual gaps: a measured-acceptance
> instrument whose measurement never ran, two receipts whose receipt-neutrality
> ruling was never written, and a ceremony profile this repository never said yes
> or no to. Issue #560 orders the six owner decisions (D1–D6) and one measured
> run — nothing else is invented. Applied through the owner's local unpublished
> workflow (§4/§5): the frozen ledgers below substitute for the lane's plan step,
> and no repo review/audit/fold machinery runs on this change.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#560` — [ISSUE: #307 residual completion — run the measured acceptance, rule the new carriers, settle ceremony-profile self-adoption](https://github.com/gtrabanco/agentic-workflow/issues/560). The PR closes it via `Closes #560`.

## Specs

Requirements, each numbered `S#`, quoting the requester's words verbatim. S1 is
the session request; S2–S7 are issue #560's six decision bullets; S8–S9 are its
`## What this issue runs` bullets; S10–S12 are its three `## Expected behaviour`
bullets.

**S1 — Apply issue #560 to this repository.**
> Apply to this repository: issue #560

**S2 — D1: the tier-cost truth class (issue D1).**
> - **D1 — tier-cost truth class.** Amend `ledger-ownership@1` (AC16's seven classes, pinned by `scripts/ledger-ownership.test.mjs`) to admit `docs/workflow/TIER_COST.md` as an owned ledger class, or keep the header-declared writer and record the refusal with its reason. Evidence: #383 `## Future` row 4 (decision-required).

**S3 — D2: the gate-receipt@1 retirement (issue D2).**
> - **D2 — gate-receipt@1 retirement.** Record what `gate-receipt@1` (#409, PR #491) retired when it entered — receipt-neutrality: *"no new receipt, mark or ledger enters without retiring an older one"* — or classify the rule as `n/a` for that carrier with the reason recorded. Today neither the issue nor the carrier names a retirement.

**S4 — D3: wall-clock as a metric (issue D3).**
> - **D3 — wall-clock as a metric.** Keep it gated (owner decision S4a, 2026-11-03: the span is false, the turn boundary is honest) or re-open it once `model_ms`/`tool_ms` are sampled across ≥3 units per tier. Default if undecided: stays out of the comparison.

**S5 — D4: the historical corpus mapping (issue D4).**
> - **D4 — the historical corpus mapping.** The comparison needs units mappable to their own commits (merged branches are deleted; the merge commit is forge evidence). Declare the unit→commit mapping that lets the comparison run over the merged corpus — the #383 `## Future` row names this exact follow-up as "a future unit"; this issue is that unit — or record the historical half as permanently `insufficient-corpus` and measure forward-only.

**S6 — D5: ceremony-profile self-adoption (issue D5).**
> - **D5 — ceremony-profile self-adoption.** Does this repository's own charter (`AGENTS.md`) declare a `ceremony-profile@1` adoption block (and which pieces), or does the repo keep routing ceremony by risk tiers only (row 97) with the refusal recorded? The mechanism ships for target projects; this repo does not consume it today.

**S7 — D6: row 436 status settle (issue D6).**
> - **D6 — row 436 status settle.** `docs/ROADMAP.md` row 436 reads `planned` while issue #436 is closed and PR #515 is merged. The unit doc defers the status cell to the owner; settle it to `done · PR #515` (or record why it stays open).

**S8 — The measured run over the mapped corpus (issue §What this issue runs).**
> - Run `bun scripts/tier-cost.mjs compare --ledger docs/workflow/TIER_COST.md` over the mapped corpus; ledger rows are appended **only by the metric sink** (`turn_start` → `turn_end` → `session_shutdown`) — no human- or model-typed values (#383 S7).

**S9 — The honest outputs allowed (issue §What this issue runs).**
> - Honest outputs allowed: the per-tier rows, or a dated `insufficient-corpus` verdict naming the missing precondition. No synthesised single number; wall-clock enters only if D3 re-opens it.

**S10 — Each decision is recorded with its evidence (issue §Expected behaviour 1).**
> - Each of D1–D6 carries a recorded decision with its evidence run — decided, not inferred.

**S11 — Rows or the declared verdict, never a synthesised number (issue §Expected behaviour 2).**
> - The measured acceptance produces per-tier rows over ≥3 real units per tier, or the declared `insufficient-corpus` verdict with its reason.

**S12 — Receipt-neutrality on every carrier touched (issue §Expected behaviour 3).**
> - Receipt-neutrality holds on every carrier touched: the only admissible grammar change is the D1 ownership-class amendment (schema const + parity pin in one PR), and only if the owner rules yes.

## Impact

Cut at plan time. Every surface this unit reads or writes, and what changes on it:

| Surface | Why it changes | Its consumers |
|---|---|---|
| `docs/fix/560-307-residual-completion/` (this unit) | the frozen request, the acceptance criteria, `planning-evidence.md`, `planning-obligations.md` and `decisions.md` — the six rulings' one home | the owner's external verification; the unit-doc readers |
| `docs/fix/383-measured-acceptance/SPEC.md` `## Future` rows 1, 2, 4 | three dated rulings: D3 (wall-clock stays gated), D4 (pre-sink corpus permanently `insufficient-corpus`, forward-only), D1 (the truth class exists since `f4b23e60`) — each row keeps its original text and gains the resolution | `audit-docs`, the roadmap; any future measurement work |
| `docs/features/108-machine-gate-receipts/SPEC.md` `## Retirements` | D2: the dated record of what `gate-receipt@1` retired when it entered (PR #491) — the carrier's own retirement section said "Nothing is retired" | the receipt-neutrality rule's readers; `review-verify`/`audit-pr` prose |
| `docs/ROADMAP.md` `## Features` rows 436 and 560, `## Fixes` row #560 | 436 settles to `done · [#515](…)` (D6); 560 becomes `in-progress · carried by fix #560`; the fix index gains the unit's active row — all three through the crate's `roadmap` writers, never a hand edit | `roadmap-settle`, `workflow-status`, the docs projection, the in-flight claim sweep |
| `docs/generated/**` | the emitter re-renders after the rows and the unit doc land | the docs site; `docs-generate --check` |
| `.agentic-workflow/journal/*.md` | this session's narrative fragment — the legal session door while the fragment carrier is opted in | the merge aggregator; `log-session` readers |
| `AGENTS.md` (read only) | D5's fact is read here (no `## Project charter`, no adoption block) and recorded in this unit's `decisions.md`; the guide keeps the normative-surface registry only | the router's profile reader; `normative-drift` |

Deliberately untouched: no `packages/**`, no `scripts/**`, no `skills/**`, no test
file, no `.changeset/` (a prose change triggers no release intent), no schema
mirror, and no `## Project charter` block in `AGENTS.md` (D5).

## Retirements

Nothing executable is retired: this unit corrects prose states and settles one
roadmap cell, and no surface, token, helper, contract or narrative is deleted.
The three retired *states* disappear because the fact now exists, not because
anything was removed, and each carries its pin:

- the `open`/`decision-required` **state** in #383's `## Future` row 4 — the class shipped in
  `f4b23e60` (AC16 third amendment), so the row is settled; pin:
  `rg -c '^- `open` — 2026-11-03, \*\*decision-required' docs/fix/383-measured-acceptance/SPEC.md` → 0.
- `Nothing is retired` as the whole truth of #108's `## Retirements` — the
  receipt-neutrality record enters below it, and the original sentence stays as
  the pre-`gate-receipt@1` history it describes; pin:
  `rg -c 'retired the review-local gate re-run attestation' docs/features/108-machine-gate-receipts/SPEC.md` → 1.
- `planned` as row 436's status — issue #436 closed and PR #515 merged; pin:
  `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap read docs/ROADMAP.md --nn 436`
  prints the `done · [#515](…)` settle form.

No `residual-promise@1` row is owed: no surface lands without a consumer.

## Non-goals

- **No new receipt, ledger or mark** (S12): the D1 class amendment is the only
  admissible grammar change and it already shipped; this unit's own decisions
  ledger is the unit carrier every fix already owes, not a new class.
- **No new instrument** (issue §Non-goals): `scripts/tier-cost.mjs` is read and
  run, never edited; a second tool would be the defect.
- **No historical reconstruction** (S5): no synthetic rows, no estimated tokens,
  no per-tier figure recovered from git.
- **No wall-clock column** (S4): no span, no elapsed column, no comparison gate.
- **No ceremony-profile adoption forced on this repository** (S6): `AGENTS.md`
  gains no `## Project charter` section and no block.
- **No re-write of row 436's description cell** (S7): the stale "No triage yet"
  lead-in stays (436's external-verify A3 advisory), only the status cell settles.
- **No review/audit/fold machinery on this change** (the owner's workflow §4).
- **The delivery-budget trigger re-framing** (#307 design notes 2/6) is not
  scoped here and has no carrier — the owner decides whether it gets its own issue.

## Risk tier

Computed by the closed ceremony CLI over this change's own prose path set
(`bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify
--paths "docs/fix/560-307-residual-completion/SPEC.md,docs/fix/560-307-residual-completion/planning-evidence.md,docs/fix/560-307-residual-completion/planning-obligations.md,docs/fix/560-307-residual-completion/decisions.md,docs/fix/383-measured-acceptance/SPEC.md,docs/features/108-machine-gate-receipts/SPEC.md,docs/ROADMAP.md"`), copied verbatim, never written from memory (E6):

- **Tier** — `passive` · **Task Size** — `understood: true`,
  `contained_risk: "contained"`, `resumable_from_diff: true`,
  `ceremony: none`, `verification: readback` · **signals** — `[]`
- **Reason** — `every changed path is documentation, an image or prose: no
  executable effect` (`reason_kind: no-executable-effect`).
- **Named high-risk item** — none — not a high-tier unit.

The `passive` contract's "no unit doc ceremony" and this workflow's §5 unit-doc
cut are both honoured the same way fix #500 honoured them: the prose change keeps
its readback evidence in this doc's `## Log`, and the ledgers the owner's workflow
orders are cut here — D8 records the precedence. No `docs/passive/` record is
created beside it: one change, one carrier.

## Future

- `open` — 2026-11-16, the delivery-budget trigger re-framing (#307 design
  notes 2/6: *"the ~400 lines is not a cap — it is a delivery-budget trigger"*)
  is not scoped here and has no carrier; the owner decides whether it gets its
  own issue (issue #560 §Non-goals). Owner: the owner.

## Future cost

| Standing obligation | Who it binds |
|---|---|
| Wall-clock re-enters the comparison only when `model_ms`/`tool_ms` have been sampled across ≥3 units per tier (D3) — a new column is a `tier-cost@1` grammar change plus its parity pin, never an extra cell | any future measurement work |
| The pre-sink corpus stays `insufficient-corpus` permanently (D4): a retrospective token/turn figure cannot be reconstructed from git, so a future attempt owes a new decision, never an estimated row | any future "measure the history" proposal |
| Row statuses are written through the crate's `roadmap` writers (`read` → `rowUpsert`/`fixrow`), never hand-edited; the settle form is `done · [#N](<same url>)` | every future unit's close |
| A `ceremony-profile@1` adoption by this repository would be a new decision plus a charter (§) change — the absence is a valid state (`readCeremonyProfile` → `null` = catalog default) | whoever proposes adopting it here |
| `docs/workflow/TIER_COST.md` rows stay sink-only: a human- or model-typed row is the #383 S7 defect | any external publisher |

## Applicable tests

`n/a — no tests step for this fix`: the change touches no executable path, so
`bun scripts/test-impact.mjs --base 2907d5f6` answers `verdict: empty` (E12).
The deterministic gates run instead, and their receipts are in `## Log`: the
tier-cost, ledger-ownership, normative-drift and roadmap suites, the emitter's
`--check`, `roadmap-settle`, `phase-lint`, `unit-route`, `promise-coherence`, the
crate suite pair and the root gate.

## Known pre-existing issues

- **`docs/ROADMAP.md:149` row 436's description cell keeps the stale lead-in**
  "No triage yet — …; triage done — …" (fix #436's external-verify A3 advisory:
  the old truth survives inside the same cell before being superseded) —
  `does-not-affect` this unit: only the status cell is settled here, and rewriting
  the description would be the hand edit the index forbids (D9, PE-019).
- **`docs/workflow/TIER_COST.md:64` reads "one unit of 128 recorded a tier"** —
  a statement about *recorded tiers*, not about samples — `does-not-affect`: the
  ledger's samples table holds 0 rows (E3), which is a corpus of zero, exactly
  what `compare` reports.
- **`scripts/tier-cost.mjs` needs the schema package built** (`bun run build` in
  `packages/agentic-workflow-schema`) in a fresh worktree, because it imports the
  published consts — an environment fact, recorded in `## Log` E2, not a defect.
- **`scripts/next-step-ranking.test.mjs` can exceed its per-test budget on a
  loaded shared machine**: its last case spawns fixtures and had no entry in
  `scripts/test-timeout-allowlist.json`, so a concurrent root-suite run crossed
  the 10 s budget while the suite alone passes at this head and at base
  (`## Log` G6). `does-not-affect` this unit — a pre-existing flake of a suite
  this change never touches, and the final gate is green at `--jobs 1`; the
  allowlist decision belongs to the suite's owner.

## Tasks

- P1 — Cut this unit doc with the verdict `S#`s, the frozen acceptance criteria,
  the two planning ledgers in their M homes and `decisions.md` with the six
  rulings (validator: `ls docs/fix/560-307-residual-completion/SPEC.md
  docs/fix/560-307-residual-completion/planning-evidence.md
  docs/fix/560-307-residual-completion/planning-obligations.md
  docs/fix/560-307-residual-completion/decisions.md` exits 0; the reader receipts
  are G1–G3)
  (Implements: S1, S10)
  - Relevant files: docs/fix/560-307-residual-completion/SPEC.md, docs/fix/560-307-residual-completion/planning-evidence.md, docs/fix/560-307-residual-completion/planning-obligations.md, docs/fix/560-307-residual-completion/decisions.md
- P2 — D1/D3/D4: settle #383's `## Future` rows 1, 2 and 4 with their dated
  rulings and evidence, keeping the original text (validator:
  `rg -c 'forward-only' docs/fix/383-measured-acceptance/SPEC.md` matches 1; the
  0-match on `decision-required` is O3/E16)
  (Implements: S2, S4, S5, S10)
  - Relevant files: docs/fix/383-measured-acceptance/SPEC.md
- P3 — D2: append the dated receipt-neutrality record to
  `docs/features/108-machine-gate-receipts/SPEC.md` `## Retirements` — what
  `gate-receipt@1` retired, evidenced from PR #491's own diff (validator:
  `rg -c 'retired the review-local gate re-run attestation' docs/features/108-machine-gate-receipts/SPEC.md`
  matches 1)
  (Implements: S3, S10)
  - Relevant files: docs/features/108-machine-gate-receipts/SPEC.md
- P4 — D6: settle row 436 to `done · [#515](https://github.com/gtrabanco/agentic-workflow/pull/515)`
  through the crate's `roadmap rowUpsert`, preserving every other cell, after a
  `roadmap read` revision (validator: `rg -c '^\| 436 \| .*done . \[#515\]' docs/ROADMAP.md`
  matches 1)
  (Implements: S7, S10)
  - Relevant files: docs/ROADMAP.md
- P5 — D5: record the non-adoption ruling (the repo keeps risk-tier routing; no
  `## Project charter`, no block) in `decisions.md`, with the counts that prove
  it (validator: `rg -c '^- \*\*D5 —' docs/fix/560-307-residual-completion/decisions.md`
  matches 1; the 0-count on the guide is O7/E8)
  (Implements: S6, S10)
  - Relevant files: docs/fix/560-307-residual-completion/decisions.md
- P6 — The measured run and the state writes: run
  `bun scripts/tier-cost.mjs compare --ledger docs/workflow/TIER_COST.md` (exit 2
  `insufficient-corpus`), register features row 560 and the `## Fixes` row #560
  through the writers, re-render the projection with the emitter, and write the
  session's narrative fragment (validator:
  `ls .agentic-workflow/journal/*fix-560-307-residual-completion*narrative*`
  exits 0; the compare, the emitter and the row receipts are O9/O11/O13)
  (Implements: S8, S9, S11, S1)
  - Relevant files: docs/workflow/TIER_COST.md, docs/ROADMAP.md, docs/generated/, .agentic-workflow/journal/
- P7 — The verification sweep: the differential against base `2907d5f6` (every
  touched command's stdout/stderr/exit compared; the tier-cost verdict and the
  ledger must be byte-identical, and the docs projection's only delta is the new
  rows), then the deterministic gates (validator: `bun scripts/roadmap-settle.mjs`
  exits 0; the differential and the root gate are E14/E15 and G5)
  (Implements: S1, S12)
  - Relevant files: docs/fix/560-307-residual-completion/SPEC.md

### Planning evidence

M-sized unit: the ledger lives in [`planning-evidence.md`](planning-evidence.md)
beside this doc (never both).

### Obligations

M-sized unit: the ledger lives in
[`planning-obligations.md`](planning-obligations.md) beside this doc.

## Acceptance criteria

One observable, testable criterion per requirement, each naming the check that
proves it (frozen at cut):

- **AC1 (S1)** — the issue is applied as one landed change with its ledgers cut
  before the rulings — proved by `git diff --stat 2907d5f6...HEAD` naming this
  unit's surfaces and by the triage/phase-lint receipts (`## Log` G1, G2).
- **AC2 (S2)** — D1 is decided against the tree: the `tier-cost` truth class
  exists as AC16's eighth class and this unit changes no grammar — proved by
  `bun test scripts/ledger-ownership.test.mjs` exiting 0 and
  `rg -n '^tier-cost \| docs/workflow/TIER_COST.md' skills/pre-execution-review/references/LEDGERS.md`
  matching 1.
- **AC3 (S2)** — #383's row 4 leaves the `open`/`decision-required` state and records
  the ruling — proved by
  `rg -c '^- `open` — 2026-11-03, \*\*decision-required' docs/fix/383-measured-acceptance/SPEC.md`
  exiting 1 and `rg -c 'settled, \*\*not rejected\*\*' docs/fix/383-measured-acceptance/SPEC.md` matching 1.
- **AC4 (S3)** — D2 is recorded on its carrier: #108's `## Retirements` names
  what `gate-receipt@1` retired — proved by
  `rg -c 'retired the review-local gate re-run attestation' docs/features/108-machine-gate-receipts/SPEC.md`
  matching 1.
- **AC5 (S4)** — D3 is recorded and no wall-clock surface appears — proved by
  `rg -c 'wall[_-]clock|\belapsed\b' scripts/tier-cost.mjs docs/workflow/TIER_COST.md`
  exiting 1 and by the ruling sentence in #383's row 1.
- **AC6 (S5)** — D4 is recorded: the pre-sink corpus is permanently
  `insufficient-corpus` and the comparison is forward-only — proved by the
  ruling in #383's row 2 (`rg -c 'forward-only' …` matching 1).
- **AC7 (S6)** — D5 is decided against the guide, with no adoption block added —
  proved by `rg -c '^## Project charter' AGENTS.md` exiting 1 and by the `D5`
  row in `decisions.md`.
- **AC8 (S7)** — row 436 reads its settle form — proved by
  `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap read docs/ROADMAP.md --nn 436`
  printing `done · [#515](https://github.com/gtrabanco/agentic-workflow/pull/515)`.
- **AC9 (S8)** — the measured run happened over the ledger, with no typed value —
  proved by `bun scripts/tier-cost.mjs compare --ledger docs/workflow/TIER_COST.md`
  exiting 2 with `verdict: insufficient-corpus` and by the ledger's 0 sample rows.
- **AC10 (S9)** — the verdict is dated, names the missing precondition, and no
  synthesised single number exists — proved by the recorded verdict in this doc
  and by `rg -c 'savings|delta_total' scripts/tier-cost.mjs` exiting 1.
- **AC11 (S11)** — the acceptance is either per-tier rows or the declared
  verdict, with its reason — proved by the same `compare` receipt plus
  `bun scripts/tier-cost.mjs read --ledger docs/workflow/TIER_COST.md` reporting
  0 rows.
- **AC12 (S12)** — receipt-neutrality holds: no new grammar/receipt/ledger class
  enters and every touched carrier is prose — proved by
  `git diff --name-only 2907d5f6...HEAD | rg '^(packages|scripts|skills)/'` exiting 1
  and `bun test scripts/normative-drift.test.mjs` exiting 0.

## Triaged steps

> Pasted verbatim from
> `bun packages/agentic-workflow/bin/agentic-workflow.mjs unit-route --triage 560-307-residual-completion`
> (2026-11-16; the machine's authoritative step list). The owner's local
> workflow (§4/§5) substitutes for the lane: the ledger freeze above is the plan,
> and no Relay packet is cut for this surgery.

```text
TRIAGE — 560-307-residual-completion (fix)
Steps: plan, implement, evidence, review, docs
Tiers: plan: cheap, implement: cheap, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, tests: tests n/a, release: not a feature
Budget: strong
relay: bootstrap-needed — no packet at .pi-web/relays/560-307-residual-completion
relay-next: create .pi-web/relays/560-307-residual-completion/ (charter → docs/fix/560-307-residual-completion/SPEC.md) then dispatch_relay(packet: ".pi-web/relays/560-307-residual-completion", leg: "1") · legs: 8 = 7 phases + 1 coherence review
```

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-16, the issue, verbatim:
  ```
  ## Summary

  One issue consolidating the three residual gaps of the #307 completeness audit (2026-11-15): (1) **measured acceptance** — the instrument exists (#383, PR #395, `bun scripts/tier-cost.mjs`) but the measurement never ran (`insufficient-corpus`); (2) **receipt-neutrality rulings** for the two carriers #307's own rule now governs; (3) **ceremony-profile self-adoption + row 436 status**. Every item here is an owner decision or an owner-directed measured run — nothing invents a mechanism. Instrument yes, measurement no.

  ## The decisions this issue resolves (owner decisions, enumerated)

  - **D1 — tier-cost truth class.** Amend `ledger-ownership@1` (AC16's seven classes, pinned by `scripts/ledger-ownership.test.mjs`) to admit `docs/workflow/TIER_COST.md` as an owned ledger class, or keep the header-declared writer and record the refusal with its reason. Evidence: #383 `## Future` row 4 (decision-required).
  - **D2 — gate-receipt@1 retirement.** Record what `gate-receipt@1` (#409, PR #491) retired when it entered — receipt-neutrality: *"no new receipt, mark or ledger enters without retiring an older one"* — or classify the rule as `n/a` for that carrier with the reason recorded. Today neither the issue nor the carrier names a retirement.
  - **D3 — wall-clock as a metric.** Keep it gated (owner decision S4a, 2026-11-03: the span is false, the turn boundary is honest) or re-open it once `model_ms`/`tool_ms` are sampled across ≥3 units per tier. Default if undecided: stays out of the comparison.
  - **D4 — the historical corpus mapping.** The comparison needs units mappable to their own commits (merged branches are deleted; the merge commit is forge evidence). Declare the unit→commit mapping that lets the comparison run over the merged corpus — the #383 `## Future` row names this exact follow-up as "a future unit"; this issue is that unit — or record the historical half as permanently `insufficient-corpus` and measure forward-only.
  - **D5 — ceremony-profile self-adoption.** Does this repository's own charter (`AGENTS.md`) declare a `ceremony-profile@1` adoption block (and which pieces), or does the repo keep routing ceremony by risk tiers only (row 97) with the refusal recorded? The mechanism ships for target projects; this repo does not consume it today.
  - **D6 — row 436 status settle.** `docs/ROADMAP.md` row 436 reads `planned` while issue #436 is closed and PR #515 is merged. The unit doc defers the status cell to the owner; settle it to `done · PR #515` (or record why it stays open).

  ## What this issue runs (the measurement, never a new instrument)

  - Precondition declared by #383 at triage: **≥3 real units per tier must exist and be mappable** before the comparison can run (needs D4).
  - Run `bun scripts/tier-cost.mjs compare --ledger docs/workflow/TIER_COST.md` over the mapped corpus; ledger rows are appended **only by the metric sink** (`turn_start` → `turn_end` → `session_shutdown`) — no human- or model-typed values (#383 S7).
  - Honest outputs allowed: the per-tier rows, or a dated `insufficient-corpus` verdict naming the missing precondition. No synthesised single number; wall-clock enters only if D3 re-opens it.

  ## Expected behaviour

  - Each of D1–D6 carries a recorded decision with its evidence run — decided, not inferred.
  - The measured acceptance produces per-tier rows over ≥3 real units per tier, or the declared `insufficient-corpus` verdict with its reason.
  - Receipt-neutrality holds on every carrier touched: the only admissible grammar change is the D1 ownership-class amendment (schema const + parity pin in one PR), and only if the owner rules yes.
  ```
- **L2** — 2026-11-16, the requester's order, verbatim: "Apply to this repository: issue #560"
- **D1** — 2026-11-16, §0 resolution from state before any action: **continue** — the branch `fix/560-307-residual-completion` sits at `2907d5f6` (0 commits ahead, 0 behind `main`), no `docs/fix/560-*` unit dir, no `EXTERNAL VERIFY` block and no review verdict exists for it, so the issue's own first incomplete phase is the §5 ledger cut; `fix findings` and `re-verify` were excluded on that evidence. Authority: the owner's local workflow, §0.
- **D2** — 2026-11-16, D1's ruling (S2): the `tier-cost` truth class already shipped in `f4b23e60` as AC16's eighth class; only #383's stale Future row needed settling and this unit changes no grammar. Full ruling and evidence: `decisions.md` D1, PE-001/PE-002, E9.
- **D3** — 2026-11-16, D2's ruling (S3): `gate-receipt@1` retired the review-local gate attestation in `review-verify` and `audit-pr` at PR #491; the `gate-ran@1` mark is a different carrier and stays. Full ruling and evidence: `decisions.md` D2, PE-004/PE-005, E10.
- **D4** — 2026-11-16, D3's ruling (S4): wall-clock stays gated; the re-open condition is unmet (0 sampled units). Full ruling and evidence: `decisions.md` D3, PE-003/PE-009, E3.
- **D5** — 2026-11-16, D4's ruling (S5): the pre-sink historical half is permanently `insufficient-corpus` and the comparison runs forward-only. Full ruling and evidence: `decisions.md` D4, PE-008/PE-009, E11.
- **D6** — 2026-11-16, D5's ruling (S6): this repository does not adopt `ceremony-profile@1`; ceremony stays risk-tier routed and the refusal is recorded. Full ruling and evidence: `decisions.md` D5, PE-010/PE-011, E8.
- **D7** — 2026-11-16, D6's ruling (S7): row 436 settles to `done · [#515]` (the ceremony-profile row) through the crate's writer, every other cell preserved. Full ruling and evidence: `decisions.md` D6, PE-012/PE-013/PE-019, E7.
- **D8** — 2026-11-16, the `passive` tier and the workflow's §5 unit-doc order coexist; the verdict is recorded verbatim and the doc is cut — the fix #500 D2 precedence. Full ruling: `decisions.md` D8, PE-017/PE-018.
- **D9** — 2026-11-16, every index write goes through the crate's receipted `roadmap` writers, never a hand edit, and no `roadmap_summary:` override is declared (fix #436 external-verify B3). Full ruling: `decisions.md` D9, PE-012/PE-014.
- **D10** — 2026-11-16, D5's ruling has one home (`decisions.md`), never a second copy in the guide or in fix 436's ledger. Full ruling: `decisions.md` D10, PE-010.
- **D11** — 2026-11-16, the session entry goes through `journal write --kind narrative`, not a `docs/LOGS.md` append (aggregator-only file). Full ruling: `decisions.md` D11, PE-016.
- **D12** — 2026-11-16, the measurement is run, not rebuilt: `scripts/tier-cost.mjs` executes as shipped with no new column, command or gate. Full ruling: `decisions.md` D12, PE-003/PE-009.
- **E1** — 2026-11-16, base state (the §2 frozen-failure reproducer, GREEN before the fix): `git log --oneline -1` → `2907d5f6 docs(audits): product audit 2 2026-11-16`; `git status --porcelain` → no output; `git rev-list --left-right --count main...HEAD` → `0 0`.
- **E2** — 2026-11-16, environment receipt: `bun install --frozen-lockfile` → `164 packages installed [1.53s]`, then `cd packages/agentic-workflow-schema && bun run build` → `tsc`, exit 0 (the fresh worktree had no `node_modules`/`dist`; Known pre-existing issues).
- **E3** — 2026-11-16, the measured run (S8): `bun scripts/tier-cost.mjs compare --ledger docs/workflow/TIER_COST.md` · exit **2** · `verdict: insufficient-corpus`, `min_units_per_tier: 3`, `short_tiers: passive 0 · standard 0 · high 0`, every `by_risk_tier`/`by_size_tier` group `units: 0` — the honest verdict, naming the missing precondition.
- **E4** — 2026-11-16, corpus state: `rg -n '^\| (24|3[0-9])' docs/workflow/TIER_COST.md` over the samples table → no data rows (only the header), so the ledger is a corpus of zero (S9, S11).
- **E5** — 2026-11-16, §2 reproducer, RED before the fix: `git show 2907d5f6:docs/fix/383-measured-acceptance/SPEC.md | rg -c '^- `open` — 2026-11-03, \*\*decision-required'` · 1 · line 92 still carries the `open`/`decision-required` state for a class that `f4b23e60` already shipped; the same pattern at head · exit 1 (0 matches, GREEN).
- **E6** — 2026-11-16, §2 reproducer, RED before the fix: `rg -n 'Nothing is retired' docs/features/108-machine-gate-receipts/SPEC.md` · exit 0 · line 165 — the carrier says nothing was retired while PR #491 replaced the review-local gate attestation.
- **E7** — 2026-11-16, §2 reproducer, RED before the fix: `roadmap read docs/ROADMAP.md --nn 436` · row status `planned`, while `gh api .../issues/436` → `state: closed` (`2026-11-11T22:49:50Z`) and `gh api .../pulls/515` → `merged: true` (`2026-11-11T22:49:48Z`).
- **E8** — 2026-11-16, §2 reproducer, the non-adoption fact (D5): `rg -c '^## Project charter' AGENTS.md` · exit 1 (0 matches); `rg -c '^ceremony-profile@1$' AGENTS.md` · exit 1 (0 matches); the single `ceremony-profile@1` mention is the normative-surface row `ceremony-profile-block | packages/agentic-workflow-schema/README.md | block:ceremony-profile@1` (AGENTS.md:419).
- **E9** — 2026-11-16, D1 evidence: `rg -n '^tier-cost \| docs/workflow/TIER_COST.md' skills/pre-execution-review/references/LEDGERS.md` · line 178, owner `pi-agentic-workflow:session-telemetry`; `bun test scripts/ledger-ownership.test.mjs` · exit 0 · the eighth class and its tree entry pinned (suite output recorded at G5).
- **E10** — 2026-11-16, D2 evidence: `git diff d7b391b4^1 d7b391b4 -- skills/review-verify/SKILL.md skills/audit-pr/references/01_MERGE_GATES.md` · the removed "verification gate ran in THIS review … paste exit status per command" and the plain merge-gate row, replaced by the receipt's consumption/route; `git log -S 'gate-receipt@1' -- packages/agentic-workflow-schema/README.md` → `78ac7c82` (the publisher), PR #491 merge `d7b391b4`.
- **E11** — 2026-11-16, D4 evidence: `ls .agentic-workflow/journal | wc -l` · 84 fragments; a sample fragment carries `- **Commits:** 11 (\`b2b4f04d…12f9ff4e\`)` — the unit→commit mapping exists, and carries no token/turn/time cell (PE-008), so the currency the comparison needs is not reconstructible.
- **E12** — 2026-11-16, the impact set: `bun scripts/test-impact.mjs --base 2907d5f6` · `verdict: empty` · `changed: 9` · `executable: 0` · `suites (0)` — a prose-only change, so no test is invented (`## Applicable tests`).
- **E13** — 2026-11-16, the risk verdict (copied into `## Risk tier`): `bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify --paths "docs/fix/560-307-residual-completion/SPEC.md,docs/fix/560-307-residual-completion/planning-evidence.md,docs/fix/560-307-residual-completion/planning-obligations.md,docs/fix/560-307-residual-completion/decisions.md,docs/fix/383-measured-acceptance/SPEC.md,docs/features/108-machine-gate-receipts/SPEC.md,docs/ROADMAP.md"` · exit 0 · `tier: passive`, `reason_kind: no-executable-effect`, `signals: []`, `task_size: {understood: true, contained_risk: contained, resumable_from_diff: true, ceremony: none, verification: readback}`.
- **E14** — 2026-11-16, differential, the untouched instrument: `bun scripts/tier-cost.mjs compare --ledger docs/workflow/TIER_COST.md` in a scratch copy of base `2907d5f6` (`git archive` into `mktemp -d`, `bun install --frozen-lockfile` plus schema build there, removed after) and at head · exit 2 both sides · byte-identical stdout (`sha256 09d2d20d…` on both files) — the verdict records the corpus and this change moved no instrument byte.
- **E15** — 2026-11-16, differential, the emitter: in a scratch copy of base `2907d5f6` (`git archive` into `mktemp -d`, `bun install --frozen-lockfile` + schema build there, removed after) `bun scripts/docs-generate.mjs --check` · exit 0 · 0 stale — the base projection was **clean**; at head before the re-render · exit 1 · 1 stale (`docs/generated/units.md` missing this unit's row), so the drift was this change's own, never pre-existing; after the emitter's re-render at head · exit 0 · 0 stale. The only rendered delta is this unit's one row.
- **E16** — 2026-11-16, the carriers after the rulings: `rg -c '^- `open` — 2026-11-03, \*\*decision-required' docs/fix/383-measured-acceptance/SPEC.md` · exit 1 (0 matches); `rg -c 'forward-only' docs/fix/383-measured-acceptance/SPEC.md` · 1; `rg -c 'retired the review-local gate re-run attestation' docs/features/108-machine-gate-receipts/SPEC.md` · 1; `rg -c 'wall[_-]clock|\belapsed\b' scripts/tier-cost.mjs docs/workflow/TIER_COST.md` · exit 1 (0 matches).
- **E17** — 2026-11-16, the roadmap writes: `roadmap read docs/ROADMAP.md --nn 436` → `done · [#515]` (receipt `rowUpsert` with the row's other cells preserved); `roadmap read --nn 560` → `in-progress · carried by fix #560`; `roadmap read` over the `## Fixes` table → the `#560` row `in-progress`; `bun scripts/roadmap-settle.mjs` · exit 0 · PASS.
- **E18** — 2026-11-16, the session door: `bun packages/agentic-workflow/bin/agentic-workflow.mjs journal write --kind narrative --title fix-560-307-residual-completion …` · exit 0 · `20261116T005405Z-fix-560-307-residual-completion-narrative-local.md` (1,762 bytes, branch `fix/560-307-residual-completion`); `journal-carrier-check` exit 0 (61 fragments, 0 refusals) and `git diff 2907d5f6...HEAD -- docs/LOGS.md` → no output (the aggregator's file untouched).
- **G1** — 2026-11-16, HEAD `d1aceb237e4011e906d58fde18f96c0add45074a`, `bun packages/agentic-workflow/bin/agentic-workflow.mjs unit-route --triage 560-307-residual-completion` · exit 0 · the block pasted in `## Triaged steps`; the routing mode answers `unit docs/… has all phases recorded but status is 'in-progress' (not 'done') — settle the index or roadmap status before routing to close-out` (exit 2), which is the correct answer while the fix row is open.
- **G2** — 2026-11-16, HEAD `d1aceb237e4011e906d58fde18f96c0add45074a`, `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/fix/560-307-residual-completion/SPEC.md` · exit 0 · `verdict PASS` (P1–P7, 6/6 each).
- **G3** — 2026-11-16, HEAD `d1aceb237e4011e906d58fde18f96c0add45074a`, the unit-doc readers: `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/560-307-residual-completion/SPEC.md` · exit 0 · `ok: true` (sections, obligations-closure, provenance-stamp, receipt-marks, log-kinds, cited-paths, cited-gates); `bun scripts/promise-coherence.mjs docs/fix/560-307-residual-completion/SPEC.md` · exit 0 · `PASS` 7 checked · 0 skipped; `bun scripts/docs-generate.mjs --check` · exit 0 · 0 stale.
- **G4** — 2026-11-16, HEAD `d1aceb237e4011e906d58fde18f96c0add45074a`, the touched suites: `bun test scripts/tier-cost.test.mjs scripts/ledger-ownership.test.mjs scripts/normative-drift.test.mjs scripts/roadmap-settle.test.mjs scripts/vocabulary-probe.test.mjs` · exit 0 · **63 pass · 0 fail** (8.45s); `bun scripts/vocabulary-probe.mjs` · exit 0 · `probe: 0 violations`; `bun scripts/roadmap-settle.mjs` · exit 0 · `210 unit docs checked · 0 violations`.
- **G5** — 2026-11-16, HEAD `d1aceb237e4011e906d58fde18f96c0add45074a`, the root gate: `bun scripts/local-gate.mjs --skip-network --jobs auto` · exit 0 · **`local-gate: PASS — 15 step(s) in 455s`**, including `root-suite` exit 0 in 173s, `crate-suite-bun` exit 0 in 175s and `crate-suite-node` exit 0 in 82s. The 4 network steps (`workspace-install`, `pi-compat-guard`, `dependency-pin-gate`, `dependency-advisories`) are skipped by the offline subset and disclosed, never counted as run. A first run at the same head failed at `worktree-guard` on **another session's** stale registration (`.worktrees/fix-571-false-semantic-reds`, directory absent); the direct guard re-ran green and the full gate pass above followed — concurrent shared state, never this change.
- **P1** — 2026-11-16, the unit doc, both M-size planning ledgers and `decisions.md` cut, every obligation `planned` at cut · `0a37c272`.
- **P2** — 2026-11-16, #383's three Future rows settled (D1, D3, D4) · `6f518c3f`.
- **P3** — 2026-11-16, #108's `## Retirements` gains the receipt-neutrality record (D2) · `6f518c3f`.
- **P4** — 2026-11-16, row 436 settled through the crate writer (D6): `rowUpsert 3066c91f → 6ca6dfc9`, the description cell byte-identical · `d1aceb23`.
- **P5** — 2026-11-16, D5's non-adoption ruling recorded · `0a37c272`.
- **P6** — 2026-11-16, the measured run (exit 2, `insufficient-corpus`), the row registrations (`rowUpsert 6ca6dfc9 → 41544b39` for row 560; `fixrow 41544b39 → 48e97de7`), the projection re-render (exactly one added row) and the narrative fragment `20261116T005405Z-fix-560-307-residual-completion-narrative-local.md` (1,762 bytes) · `d1aceb23`.
- **P7** — 2026-11-16, the verification sweep: the base-vs-head differential (E14/E15) and the offline root gate 15/15 (G5) · `d1aceb23`.
- **E19** — 2026-11-16, the PR and the settle: PR [#577](https://github.com/gtrabanco/agentic-workflow/pull/577) opened against `main` with `Closes #560`; features row 560 settled to `done · [#577] · carried by fix #560` (`rowUpsert 48e97de7 → 8b66fc7e`) and the `## Fixes` row to `done · [#577]` (`fixrow 8b66fc7e → a54f5414`), both through the crate's writers; the projection re-rendered by the emitter.
- **E20** — 2026-11-16, the integration and the mergeable PR: `git merge origin/main` with the shared-doc driver armed (`bun scripts/shared-doc-merge.mjs --install`; `agentic-shared-roadmap`) → merge commit `d4a8287fe3724a3c91e11054d2a3054c0cc0e399`, `docs/ROADMAP.md` resolved to the union of both sides' edits (main's 37 `## Fixes` rows + this unit's `#560` row = 38, nothing lost, verified by key-set comparison); at that head `verify`/`phase-lint`/`promise-coherence`/`roadmap-settle`/`docs-generate --check` all green, `test-impact --base origin/main` → `verdict: empty` (changed 9, executable 0), and `bun scripts/local-gate.mjs --skip-network --jobs 1` → **PASS — 15 step(s) in 507s**; pushed, PR #577 then answered `MERGEABLE / CLEAN`.
- **G6** — 2026-11-16, HEAD `7b586769331c9da2a72b93c5b6a08b4e08a42d38`, the final-head root gate: `bun scripts/local-gate.mjs --skip-network --jobs 1` · exit 0 · **`local-gate: PASS — 15 step(s) in 713s`** (`root-suite` green inside it). A concurrent `--jobs auto` run (2 workers) failed at `scripts/next-step-ranking.test.mjs`'s 10 s per-test budget under shared-machine load; the suite passed standalone at this head (**29 pass · 0 fail**, 22.2 s) and at base, so the red was a pre-existing load flake (Known pre-existing issues), not this change.

## Next

The owner is the external verifier (§8): review PR
[#577](https://github.com/gtrabanco/agentic-workflow/pull/577), the obligations
ledger state (15/15 `verified`) and the verification block in the handoff. The
PR carries `Closes #560` and is mergeable/clean after integrating `origin/main`
(E20); the merge itself is the owner's step. The measured acceptance stays
`insufficient-corpus` until the sink records ≥3 units per tier, and the pre-sink
half is permanently out (D4).

## References

- Issue [#560](https://github.com/gtrabanco/agentic-workflow/issues/560) — the unit's request.
- Issue [#307](https://github.com/gtrabanco/agentic-workflow/issues/307) / [direction 83](docs/features/83-odd-hybrid-direction/SPEC.md) — the receipt-neutrality rule (`## Working rules` #307 §Scope) this unit applies to the two carriers.
- `docs/fix/383-measured-acceptance/` — the instrument (`scripts/tier-cost.mjs`), the `tier-cost@1` ledger and the three `## Future` rows this unit settles.
- `docs/features/108-machine-gate-receipts/` — `gate-receipt@1` (#409, PR #491), the receipt whose retirement this unit records.
- `docs/fix/436-ceremony-profile/` — the `ceremony-profile@1` mechanism and the row whose status this unit settles (D5, D6).
- `docs/fix/500-declare-docs-site-block/` — the `passive`-tier/`unit-doc` precedence precedent this unit reapplies (D8).
- PR [#515](https://github.com/gtrabanco/agentic-workflow/pull/515) — the `ceremony-profile@1` delivery whose roadmap row 436 this unit settles (D6).
- PR [#491](https://github.com/gtrabanco/agentic-workflow/pull/491) — the `gate-receipt@1` delivery whose retired surface D2 records.
- PR: https://github.com/gtrabanco/agentic-workflow/pull/577 — this unit's delivery (`Closes #560`).

## Branch

`fix/560-307-residual-completion`

## Depends on

none — the five dependencies are soft prose relations (issue #560), and the native `blocked-by` graph is empty.

## Regression scope

| Scenario | Verified by |
|---|---|
| The tier-cost instrument and its verdict are unchanged by this unit (a prose ruling cannot move a measurement) | the base-vs-head differential: byte-identical `compare` output, exit 2 both sides (E14) |
| The ledger-ownership map still declares the eighth class and its exact tree entry | `bun test scripts/ledger-ownership.test.mjs` exits 0 (G4) |
| The normative-surface registry and its drift gate are untouched | `bun test scripts/normative-drift.test.mjs` exits 0 (G4) |
| The roadmap stays consistent for every unit doc (no new `pr-url-unsettled`, no slug mismatch) | `bun scripts/roadmap-settle.mjs` exits 0 (E17) |
| The docs projection is emitter-owned and current at head | `bun scripts/docs-generate.mjs --check` exits 0 after the re-render (E15) |
| `docs/LOGS.md` is byte-untouched (aggregator-only) | `git diff 2907d5f6...HEAD -- docs/LOGS.md` prints nothing (E18) |
| No executable surface changed, so no suite can regress behaviourally | `bun scripts/test-impact.mjs --base 2907d5f6` → `verdict: empty` (E12), plus the root gate (G5) |
