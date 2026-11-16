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
| `docs/ROADMAP.md` `## Features` rows 436 and 560, `## Fixes` row #560 | 436 settles to `done · [#515](…)` (D6); 560 becomes `in-progress · carried by fix #560` and settles `done · [#577](…)` when the PR opens (E19); the fix index gains the unit's active row — all three through the crate's `roadmap` writers, never a hand edit | `roadmap-settle`, `workflow-status`, the docs projection, the in-flight claim sweep |
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

`bun scripts/test-impact.mjs --base 2907d5f6` answers `targeted` — 8 executable
paths, 18 suites (amended 2026-11-16, external-verify B1: `verdict: empty`
held only before the owner routed #566/#567 onto this branch; this unit's own
delta stays prose plus one probe-comment line, E29). The named suites run in the
root gate, and the deterministic gates run regardless; their receipts are in
`## Log`: the tier-cost, ledger-ownership, normative-drift and roadmap suites,
the emitter's `--check`, `roadmap-settle`, `phase-lint`, `unit-route`,
`promise-coherence`, the crate suite pair and the root gate.

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
  enters; unit-560's own change is prose-only, and the branch's executable paths
  are exactly the ten surfaces declared by #566, #567 and the merged #571
  (amended 2026-11-16, external-verify B1 — the original 0-path proof held only
  before the owner routed #566/#567 onto this branch) — proved by
  `git diff --name-only 2907d5f6...HEAD | rg '^(packages|scripts|skills)/' | rg -v '^(packages/agentic-workflow/README.md|packages/agentic-workflow/src/memory/probe.mjs|packages/agentic-workflow/test/memory-probe.test.mjs|packages/pi-agentic-workflow/src/extension/index.ts|packages/pi-agentic-workflow/src/guards/shell-path.ts|packages/pi-agentic-workflow/test/shell-write-guard.test.mjs|scripts/run-root-suite.mjs|scripts/run-root-suite.test.mjs|skills/orchestration-envelope/references/TURN_CONTRACT.md|skills/unit-lane/references/MEMORY.md)$'`
  exiting 1 (no undeclared executable path) and
  `bun test scripts/normative-drift.test.mjs` exiting 0.

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
- **L3** — 2026-11-16, the owner's correction request, verbatim: "Apply to this repository: triage and fix those that deserve to fix but understand the context before fix and check you haven't broke another different thing, if you have done, start the loop again until you fixed full symbol/related stuff" — §0 bound to this unit's `EXTERNAL VERIFY` block (0 blockers, 4 advisories), so the batch is advisory-scope by the owner's order.
- **D13** — 2026-11-16, the triage of the four advisories (authority: L3): A1 (the fixes-table row relocation) **wontfix** — the armed union driver's designed product (`packages/agentic-workflow/src/writer/merges.mjs:139`: insertions land at the end of their block), no ordering contract in the Fixes preamble/legend, and the only "fix" would be the hand edit the index rule forbids; A2 **fixed** — both `docs/fix/435-project-charter/SPEC.md` Future rows keep their original text and gain a dated resolution (#436 closed + PR #515 merged 2026-11-11; #366 closed `completed` 2026-11-08), while the dated historical mentions (435's own `external-verify.md`, the research session README) stay as history; A3 **fixed** — this doc's Impact cell now names the final `done · [#577]` settle beside the intermediate state, and `decisions.md` D9 stays untouched (append-only ledger listing the writes performed, not a current-state claim); A4 **fixed** — the four `2026-12-18` cells corrected through the crate's writers, each to the date of its introducing commit (`2026-11-15`). Batch commits: `8b9857d6` (writers) + `1a1dfa02` (prose). Evidence: E21–E25, gate G7.
- **E21** — 2026-11-16, the §2 RED corpus before any fix: `rg -c 'roadmap row 436 settled `done · \[#515\]` \(fix #560 D6\)' docs/fix/435-project-charter/SPEC.md` · exit 1; `rg -c 'closed `completed` 2026-11-08' docs/fix/435-project-charter/SPEC.md` · exit 1; `rg -c 'settles `done · \[#577\]\(…\)` when the PR opens \(E19\)' docs/fix/560-307-residual-completion/SPEC.md` · exit 1; `rg -c '2026-12-18' docs/ROADMAP.md` · **4**; preservation baselines (435's two original row bodies) · 1 and 1.
- **E22** — 2026-11-16, the date evidence and the writer differential: `git log -S` dates every `2026-12-18` string to its introducing commit — `17e53779`, `87ce2bc8`, `8fef1ac7`, all authored 2026-11-15 (row 470's `idea · postponed` → `defined` flip happens inside `17e53779`); forge: #560 created 2026-11-15, #566/#567 created and closed 2026-11-15. Fixture first (`mktemp -d`): four CLI writes on a ROADMAP copy → receipts `0d6f00f6 → d228e24e → 3c0ea0e3 → d3ec5fb3 → 7bb6b117`, `diff` 8 changed lines, byte-identical after normalizing the dates. Live repeats the same revision chain: `git diff` = 4 rows (4+/4−), normalized-identical, `rg -c '2026-12-18' docs/ROADMAP.md` → exit 1.
- **E23** — 2026-11-16, GREEN flips and sibling sweeps: A2a → 1, A2b → 1, A3 → 1, A4 → 0 matches; `rg -c 'Resolved 2026-11-16' docs/fix/435-project-charter/SPEC.md` → 2; repo-wide `2026-12-18` matches only this unit's `external-verify.md` evidence quote; the three preservation baselines still 1/1/1 (every original row body intact — append-only resolutions, the #383 pattern).
- **E24** — 2026-11-16, base-side proof for 435's two red readers: with the A2 append stashed (`git stash push -- docs/fix/435-project-charter/SPEC.md`, popped in the same run), `bun …/agentic-workflow.mjs verify docs/fix/435-project-charter/SPEC.md` · exit 2 and `bun scripts/promise-coherence.mjs docs/fix/435-project-charter/SPEC.md` · exit 1 `BLOCKED: validator-mismatch` (5 checked · 11 skipped) **at base too**, and `diff` of the two outputs (violations and claims lines) is empty. The 10 violations (section order, obligations O13/O18 status cells, 2026-11-07 G-lines without HEAD shas, two missing 2026-11-07 journal fragments) and the two failing legacy validator cells pre-date this batch on `origin/main` — reported to the owner as an advisory, not batch-caused, untouched by it.
- **E25** — 2026-11-16, the S1c recheck battery at the fix head: `verify` 560 · `ok: true`; `phase-lint` 560 · `verdict PASS` (same fingerprint as G2); `promise-coherence` 560 · PASS 7 checked · 0 skipped; `bun scripts/roadmap-settle.mjs` · exit 0 · 210 unit docs · 0 violations; `bun scripts/docs-generate.mjs --check` · exit 0 · 0 stale (`Roadmap: docs/ROADMAP.md — unchanged`); `roadmap read --nn 436` and `--nn 560` · settle forms intact; `bun scripts/test-impact.mjs --base origin/main` · `verdict: empty` (changed 10, executable 0) — prose-only, no test invented. Every obligation validator then re-ran in the foreground at its required outcome: O1 phase-lint PASS · O2 `bun test scripts/ledger-ownership.test.mjs` 14 pass/0 fail + LEDGERS line 178 · O3/O5/O7/O10/O12/O14 exit 1 as required · O4/O6/O8 match 1 · O9 compare exit 2 `insufficient-corpus` · O11 `rows: []` · O13 0-stale · O15 PASS 210/0 — obligations O1–O15 all stay `verified`.
- **E26** — 2026-11-16, the session fragment through the legal door (D11): `bun packages/agentic-workflow/bin/agentic-workflow.mjs journal write --kind narrative --title fix-560-307-residual-completion-advisory-batch …` · exit 0 · `20261116T025715Z-fix-560-307-residual-completion-narrative-local.md` (1,155 bytes, branch `fix/560-307-residual-completion`); `git diff 2907d5f6...HEAD -- docs/LOGS.md` → no output (the aggregator's file untouched).
- **G7** — 2026-11-16, HEAD `1a1dfa022dd718248d7d193b5bef06d78ab16dde`, the offline root gate over the batch: `bun scripts/local-gate.mjs --skip-network --jobs 1` · exit 0 · **`local-gate: PASS — 15 step(s) in 394s`** (the 4 network steps skipped by the offline subset as always).
- **P8** — 2026-11-16, the advisory correction batch: the four date cells rewritten through `rowUpsert`/`fixrow`, 435's two Future rows resolved, the 560 Impact cell settled · `8b9857d6` + `1a1dfa02`.
- **L4** — 2026-11-16, the owner's correction request on this unit's delta `EXTERNAL VERIFY` receipt (4 blockers B1–B4, 5 advisories A1–A5), verbatim: "Apply to this repository: triage and fix those that deserve to fix but understand the context before fix and check you haven't broke another different thing, if you have done, start the loop again until you fixed full symbol/related stuff" — §0 bound to `external-verify.md`'s latest block (`NEEDS-DECISION`), so the batch is blocker-scope by the owner's order; the triage is D14.
- **D14** — 2026-11-16, the triage of the receipt's nine findings (authority: L4): **B1 fixed** — the "0 executable paths / prose-only" assertion proved wider than the receipt named it: `## Applicable tests` (SPEC:166-167) and the regression-scope row (SPEC:455) carried the same claim and were caught by this batch's own claim-family sweep; AC12, both prose carriers and O12's cells are rescoped to the branch's ten declared executable paths with an allowlist validator. **B2 fixed** — 566's AC4/O10 "skills diff is MEMORY.md only" scoped to this unit's change plus #567's declared `TURN_CONTRACT.md`, allowlist validator. **B3 fixed** — feature 66's AC8 description gains the promised `Mirror-contract note`, O3's validator re-pinned to `Mirror-contract note` matches 2. **B4 fixed** — the three five-check lines (66:257, 66:272, 538:134) gain dated `Six-check note`s. **A2 fixed** — probe.mjs's bounds sentence names the capability call's 4 s (comment only; no test pins the sentence). **A3 fixed** — 566 AC3's parenthetical states the observed `exits 1 (0 matches …)`. **A1 wontfix here** — a new write indicator (`sed -i`, `dd`) is 567's Future-cost rule (recorded D-row + a red case first; D2's boundary is owner-ruled), never a docs-batch widening. **A4 environment** — the worktree-guard flake and the mid-run ref/head movement are disclosures, no repo byte. **A5 wontfix** — the two dated historical mentions stay history per receipt-1's D13. Batch shape: this unit's own correction history (L3/D13/E21–E26/G7) — existing-row status flips per the correction bounds (O12, O10, O3 reopened in this commit before any fix), no new obligation rows because the batch owns no unit `S#` for their authority column. Evidence: E27–E29, gate G8.
- **E27** — 2026-11-16, the §2 frozen-failure corpus observed before the first edit: AC12/O12's declared proof `git diff --name-only 2907d5f6...HEAD | rg '^(packages|scripts|skills)/'` · **exit 0 · 10 paths** (both require exit 1); AC4's `git diff --name-only origin/main...HEAD -- skills/` → MEMORY.md + TURN_CONTRACT.md (claimed: MEMORY.md only); `rg -c 'Mirror-contract note' docs/features/66-engram-memory-substrate/SPEC.md` → **1** (B3 needs 2); `rg -c 'Six-check note'` → exit 1 in 66's SPEC and exit 1 in 538's SPEC (B4 needs 2 and 1); `rg -c 'capability call' packages/agentic-workflow/src/memory/probe.mjs` → exit 1, `rg -c 'two CLI-backed'` → 1 (A2); `rg -c 'exits 1, 0 matches in skills' docs/fix/566-…SPEC.md` → exit 1 (A3); the B1 claim-family sweep added by this batch's own loop: `rg -n 'touches no executable|No executable surface changed' docs/fix/560-307-residual-completion/SPEC.md` → SPEC:166-167 and SPEC:455 (same false claim outside the receipt's named lines).
- **E28** — 2026-11-16, the same corpus green and the §9 flips: AC12's proof command (this doc, `## Acceptance criteria`) · **exit 1** · AC4's allowlist proof (566 SPEC) · **exit 1** · `rg -c 'Mirror-contract note' docs/features/66-engram-memory-substrate/SPEC.md` · **2** · `rg -c 'Six-check note' docs/features/66-engram-memory-substrate/SPEC.md` · **2** and `rg -c 'Six-check note' docs/fix/538-engram-startup-report/SPEC.md` · **1** · `rg -c 'capability call' packages/agentic-workflow/src/memory/probe.mjs` · **1** · `rg -c 'two CLI-backed' packages/agentic-workflow/src/memory/probe.mjs` · exit 1 · `rg -c 'exits 1, 0 matches in skills' docs/fix/566-upstream-corrected-instruction-bugs/SPEC.md` · **1** · claim-family sweep · exit 1 (0 live carriers); O12's amended validator (its ledger cell) · exit 1 with `bun test scripts/normative-drift.test.mjs` · 21 pass/0 fail · O10's amended validator (its ledger cell) · exit 1 (clause-1 empty output re-observed) · O3's re-pinned validator (its ledger cell) · **2** — rows O12 (560), O10/O3 (566) flip `planned → verified` in this batch; `bun scripts/test-impact.mjs --base 2907d5f6` · `verdict: targeted` · `executable: 8` · `suites (18)` — the number the amended `## Applicable tests` now states.
- **E29** — 2026-11-16, differential and collateral (S3/S4): probe differential — `git diff 084f70cf..HEAD -- packages/agentic-workflow/src/memory/probe.mjs` → comment lines only, no code byte; `bun test packages/agentic-workflow/test/memory-probe.test.mjs` · exit 0 · 25 pass/0 fail at the pre-batch head (receipt run) and at the batch head. The loop fired once and was closed in-batch: the first placement of 66's Six-check note used blank lines inside P1's box → `phase-lint` 66 · exit 1 · `P1 box-8: bullet carries no (validator: …)`; the note went inline and phase-lint re-ran · exit 0 · fingerprint `e0b6fb80…` unchanged (base side by stash-proof at `084f70cf`: phase-lint 66 exit 0). Readers green at the batch head: phase-lint 560/566/567/66/538 · exit 0; verify 560/566/567 · `ok: true`; promise-coherence 560 PASS 7·0, 566 PASS 2·4, 567 PASS 2·4, 538 PASS 7·28; roadmap-settle · PASS 213/0; docs-generate --check · 0 stale; check-skill-context --routes --budgets · PASS 30 skills. Pre-existing, byte-identical at base (`git stash` proof at `084f70cf`, popped in the same run) and at head — reported, never fixed here: verify 66 · REFUSAL 71 violations (legacy obligations-open/progress-entry), verify 538 · REFUSAL 7 violations (head-less G3 receipt + five cited `scripts/…` paths absent at base too), promise-coherence 66 · BLOCKED validator-mismatch (13 checked · 14 skipped) — none of the three is in this batch's declared battery and none carries a byte this batch touched.
- **G8** — 2026-11-16, HEAD `f4400404` (the correction batch), the offline root gate: `bun scripts/local-gate.mjs --skip-network --jobs 1` · exit 0 · **`local-gate: PASS — 15 step(s) in 733s`** (the 4 network steps skipped by the offline subset as always; `version-parity-content` answered `changeset-intent` for the probe package off the branch's existing `.changeset/probe-instance-id-capability.md`, no new changeset needed for the comment repair). Two earlier attempts of the same command reded at `root-suite` under this box's concurrent-session load (four other sessions' test runs, load 5.5–8.2) — the documented per-test-budget flake class (this unit's Known pre-existing issues and `scripts/test-timeout-allowlist.json`'s own measured records); the same suite measured **114/114 suites PASS** standalone mid-batch, and no suite this batch touches (memory-probe, the docs readers) ever reded.
- **P9** — 2026-11-16, the correction batch closed: plan freeze + the three reopened rows · `b81d88d5`, the delta receipt recorded · `1dcb1c14`, B1–B4 + A2/A3 repairs with E27–E29 and the `planned → verified` flips · `f4400404`, gate receipt G8 (this line) · the batch's own commit.

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
| The branch's executable surfaces are exactly the #566/#567/#571-declared paths (AC12), each carried by its own suite | `bun scripts/test-impact.mjs --base 2907d5f6` → `targeted` with its named suites (E29), plus the root gate (G8) |
