---
type: fix
scope: medium
n: Triaged fix-now (M) 2026-11-21: when a unit runs as Relay legs, the closing leg ends with coherence PASS but never runs `runner review-receipt verify --pr <N>` nor emits the mandated `→ Next:` block — the review-receipt lane is orphaned between relay ends and lane closes. Merge was NOT attempted. Route: /unit-lane --fix 680
---

# fix/680-relay-closeout-receipt-orphan

> Fix specification — one single unit document.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

```text
retention-declaration@1
path | disposition
external-verify.md | trimmable
planning-findings.md | trimmable
planning-evidence.md | kept
planning-obligations.md | kept
decisions.md | kept
SPEC.md | kept
```

## Issue

`#680` — tracked issue in the project's forge. The PR closes it via
`Closes #680`.

## Specs

**S1 — `relay check` refuses a receipt-less Complete verdict.**
> - `relay check` refuses a Complete verdict whose open PR carries no review receipt (the same way it refuses other unmet contract pieces).

**S2 — the closing leg runs the close-out ladder and emits the mandated `→ Next:` block.**
> - The relay's last leg (or the leg that opens the PR) ends by running the close-out ladder: `runner review-receipt verify --pr <N>` and the mandated `→ Next:` block — `/review-change <NN-slug>` when the receipt is missing, `/audit-pr <PR-url>` only when it verifies current. Never "awaiting owner decision" as a substitute.

**S3 — coherence PASS and review receipt are two different states in the unit doc's wording.**
> - Unit-doc status wording distinguishes "coherence review PASS (evidence)" from "review receipt current (receipt)".

**S4 — the surfaced bug: a hand-made coherence receipt is never a substitute, and a PASS never satisfies the receipt check.**
> The closing leg wrote a hand-made `## Final review receipt` into the unit SPEC, declared Relay Complete, and recorded `awaiting owner decision, /audit-pr outside the relay`

**S5 — the machine-checkable shape of the close-out is published on the relay contract, not only in prose.**
> - The relay's last leg (or the leg that opens the PR) ends by running the close-out ladder: `runner review-receipt verify --pr <N>` and the mandated `→ Next:` block

```text
spec-requirement@1
kind | shape | what it orders
requirement | **S<n>[a-z]? — <title>.** | one requirement; the id is what a task links and a finding cites
quote | > <the requester's words, verbatim> | the requirement's own text, unedited apart from a marked elision
correction | **S<n><letter> — <title>.** | an appended amendment to requirement S<n>; never an edit of it
```

## Impact

- `packages/agentic-workflow/src/relay/Packet.mjs` — the one owner of the packet
  contract. `checkPacket` gains the receipt boundary; the new mode
  `closeout` renders the ladder's verdict and the `→ Next:` block. Both callers
  (`scripts/relay-packet.mjs`, `agentic-workflow relay`) inherit it, so the block
  grammar stays single-owned.
- `scripts/relay-packet.mjs` and `packages/agentic-workflow/bin/agentic-workflow.mjs`
  — the usage strings and the mode list.
- `skills/unit-lane/references/RELAY.md` — §Receipt boundary, the baton's
  `Review:` line semantics, and the close-out ladder's machine shape.
- `skills/unit-lane/SKILL.md` §8 close-out ladder — names the relay leg as the
  ladder's owner when the unit ran as legs.
- Consumers that must not change behaviour: `scripts/relay-route.test.mjs`
  (the router's `relay:` addendum), `scripts/relay-packet.test.mjs`'s existing
  cases (a non-Complete baton is unaffected), and `scripts/review-receipt.test.mjs`
  (the grammar is imported, never re-implemented).
- Nothing live on the other side: the new mode is read-only and the check only
  grows a fault class for a `Complete` baton.

## Surfaces

- `packages/agentic-workflow`
- `scripts`
- `skills/unit-lane`
- `docs`

## Retirements

Strictly additive where executable: no mode, fault class or grammar is removed.
Two prose statements become superseded and are **deleted in the same change**
(`IR6`), never kept as a parallel reading:

| Superseded prose | Owner of the replacement |
|---|---|
| `RELAY.md` §Coherence review closing sentence "the lane's close-out is unchanged" — it implies no relay-side owner exists | `RELAY.md` §Coherence review §Receipt boundary (rewritten to name the close-out owner) |
| `skills/unit-lane/SKILL.md` §8 step 1's "a unit that ran as Relay legs already had it performed by a fresh leg" — true of the verdict, silent on the receipt | the same step, which now names the relay leg as the receipt stage's owner |

The computed additive inventory (`runner residual-classify --inventory`) is
recorded in the `## Log`; every added surface has its consumer in this change
(the `closeout` mode → `RELAY.md` §Receipt boundary; the `Review:` baton line →
`checkPacket`).

## Non-goals

- Repairing the repo-local cwd/HEAD ambiguity of the incident's worktree layout.
- The deferred-tool bugs (#678) and the pin drift (#679) — same incident,
  separate surfaces.
- Target-repo substrate for `scripts/review-receipt.mjs` (each target repo's own
  finding routes it; note it here only as amplifying context).
- Making `relay check` call the forge. The check stays offline and host-free; the
  close-out evidence is read from files the workspace already carries (below).

## Risk tier

- **Tier** — `standard` · **Task Size** — understood, contained risk, resumable from diff
- **Named high-risk item** — none — not a high-tier unit

Verdict copied verbatim from
`bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify`:
`"tier": "standard"`, `"reason_kind": "executable-content"`, `"signals": []`.

## Future

none

## Future cost

- The baton's `Review:` line becomes a **load-bearing** input for a `Complete`
  state: every future relay packet must carry it, and every writer of a baton
  (a leg, or the lane bootstrapping one) must keep it truthful. Binds:
  `skills/unit-lane/references/RELAY.md` and its writers.

## Applicable tests

- `scripts/relay-packet.test.mjs` — the packet contract, extended with the
  receipt-boundary corpus (`CO` cases) and the `closeout` mode cases.
- `scripts/relay-route.test.mjs` — the router's relay hint, unchanged behaviour.
- `scripts/review-receipt.test.mjs` — the receipt grammar this change imports,
  unchanged behaviour.

## Known pre-existing issues

- `scripts/relay-packet.test.mjs` runs the checker through
  `RELAY_PACKET_REPO`-style env re-pointing — **does not affect** this unit: the
  same seam carries the new evidence file.
- The `relay check` session's `workflow-status` `pr.number: null` gap the issue
  records under "the mechanical flag was inert too" — **does not affect** this
  unit: the receipt boundary reads the packet's own declared PR, never the
  sensor's binding.

## Tasks

- P1 — Reproducers first: the receipt-boundary and close-out RED cases in the packet suite (validator: `bun test scripts/relay-packet.test.mjs` exits non-zero on the missing behaviour, observed before P2)
  (Implements: S1, S2, S4)
  - Relevant files: scripts/relay-packet.test.mjs
- P2 — The receipt boundary in `checkPacket`: the baton's `Review:` line and a Complete state's declared PR receipt (validator: `bun test scripts/relay-packet.test.mjs` exits 0)
  (Implements: S1, S4)
  - Relevant files: packages/agentic-workflow/src/relay/Packet.mjs
- P3 — The `closeout` mode: the ladder's verdict and the `→ Next:` block (validator: `bun test scripts/relay-packet.test.mjs` exits 0, the `CO` cases)
  (Implements: S2, S5)
  - Relevant files: packages/agentic-workflow/src/relay/Packet.mjs, scripts/relay-packet.mjs, packages/agentic-workflow/bin/agentic-workflow.mjs
- P4 — The contract prose: `RELAY.md` §Receipt boundary, the baton grammar's `Review:` row, and `unit-lane`'s close-out ladder ownership (validator: `bun scripts/skill-lint.mjs` exits 0 and `bun scripts/check-skill-context.mjs` exits 0)
  (Implements: S3, S5)
  - Relevant files: skills/unit-lane/references/RELAY.md, skills/unit-lane/SKILL.md
- P5 — Verification: the repository gate and the differential baseline (validator: `node scripts/run-root-suite.mjs` exits 0 and `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S1, S2, S3, S4, S5)
  - Relevant files: docs/fix/680-relay-closeout-receipt-orphan/SPEC.md
- P6 — The correction RED cases from the 2026-11-22 `EXTERNAL VERIFY` reproducers: the mode-count case (CO13) and the url-less current-receipt case (CO14) in the packet suite (validator: `bun test scripts/relay-packet.test.mjs` exits non-zero on the missing behaviour, observed before P7)
  (Implements: S2, S5)
  - Relevant files: scripts/relay-packet.test.mjs
- P7 — The correction fixes: the three stale mode-count mentions, `closeout`'s single-condition precondition/route, and `RELAY.md`'s published `Review:` values (validator: `bun test scripts/relay-packet.test.mjs` exits 0, 46 cases)
  (Implements: S2, S5)
  - Relevant files: packages/agentic-workflow/src/relay/Packet.mjs, packages/agentic-workflow/src/promise-coherence/index.mjs, skills/unit-lane/references/RELAY.md
- P8 — The receipt-text corrections: AC-S2's url clause, AC-S5/PE-003's mirror claim, E8's recorded refusal, and the obligation rows this batch updates (validator: `rg -c 'by name, not by import' docs/fix/680-relay-closeout-receipt-orphan/planning-evidence.md` matches 1 and `bun scripts/check-skill-context.mjs` exits 0)
  (Implements: S2, S3, S5)
  - Relevant files: docs/fix/680-relay-closeout-receipt-orphan/SPEC.md, docs/fix/680-relay-closeout-receipt-orphan/planning-evidence.md, docs/fix/680-relay-closeout-receipt-orphan/planning-obligations.md

```text
task-spec-link@1
kind | shape | what it orders
link | (Implements: S<n>, S<m>, …) | the requirements this task delivers; metadata, never task text
```

### Planning evidence

The ledger is `planning-evidence.md` in this folder (M unit).

### Obligations

The ledger is `planning-obligations.md` in this folder (M unit).

## Acceptance criteria

- **AC-S1** — `relay check` on a packet whose baton reads `State: Complete` and
  whose `Review:` line records no current receipt exits non-zero with a fault
  naming the missing receipt, while the same packet with a current receipt
  recorded exits 0. Proved by: the `CO` cases in
  `bun test scripts/relay-packet.test.mjs` exits 0.
- **AC-S2** — `relay closeout <unit>` prints the ladder's verdict and, when the
  receipt is absent or stale, exactly one `→ Next: /review-change <NN-slug>`
  line and no `/audit-pr`; when the receipt is current **and its `Review:` line
  records the PR url**, exactly one `→ Next: /audit-pr <PR-url>` line — a current
  receipt that records no url states `precondition: none — the Review line
  records no PR url` and routes to `/review-change` (amended 2026-11-22 by the
  `EXTERNAL VERIFY` B4 correction: the original clause was unsatisfiable for a
  url-less receipt, which has no url to print). Proved by: the `CO` close-out
  cases (CO7, CO14) in `bun test scripts/relay-packet.test.mjs` exits 0.
- **AC-S3** — `RELAY.md` names the coherence verdict as evidence and the receipt
  as the receipt, states that a `REVIEW-VERDICT: PASS` never satisfies the
  receipt check, and gives `relay closeout` as the leg's own close-out command;
  `unit-lane`'s §8 names the relay leg as the receipt stage's owner for a unit
  that ran as legs. Proved by:
  `rg -U -c 'REVIEW-VERDICT: PASS` never satisfies' skills/unit-lane/references/RELAY.md`
  matches 1 (the sentence wraps across two source lines, so a per-line grep reads
  0) and `bun scripts/skill-lint.mjs` exits 0.
- **AC-S4** — A baton whose `Review:` line records `pending`, and a `Complete`
  baton whose packet declares no PR, are both refused with a fault naming the
  state; a hand-authored `## Final review receipt` heading in the unit doc never
  clears the fault. Proved by: the `CO` refusal cases in
  `bun test scripts/relay-packet.test.mjs` exits 0.
- **AC-S5** — The close-out shape is published as a machine grammar on the relay
  contract (`block:relay-closeout@1`) and its tokens mirror the receipt states
  `receiptStatus` publishes (`current`/`stale`/`absent`, owner
  `packages/agentic-workflow/src/review-receipt/index.mjs`), with `not-current`
  for a line that records no receipt — mirrored by name, never re-implemented as
  a second marker regex (corrected 2026-11-22 by the `EXTERNAL VERIFY` A2 finding:
  the original wording claimed an import the relay path never makes; it reads
  the baton, not the forge). Proved by: the `relay-closeout@1` parse
  case in `bun test scripts/relay-packet.test.mjs` exits 0 and
  `bun scripts/check-skill-context.mjs` exits 0.

## Triaged steps

```
TRIAGE — 680 (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
```

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-21, the issue, verbatim:
  ```
  Bug: relay's coherent-PASS close-out orphans the review-receipt lane — PR ships without a review-change receipt and /audit-pr is never mandated

  When a unit runs as Relay legs, the closing review leg can end the relay with its coherence PASS while the PR carries no `review-change` receipt and `/audit-pr` is never mentioned — the whole review-receipt lane is orphaned between "relay ends" and "lane closes".

  Expected behaviour:
  - The relay's last leg (or the leg that opens the PR) ends by running the close-out ladder: `runner review-receipt verify --pr <N>` and the mandated `→ Next:` block — `/review-change <NN-slug>` when the receipt is missing, `/audit-pr <PR-url>` only when it verifies current. Never "awaiting owner decision" as a substitute.
  - `relay check` refuses a Complete verdict whose open PR carries no review receipt (the same way it refuses other unmet contract pieces).
  - Unit-doc status wording distinguishes "coherence review PASS (evidence)" from "review receipt current (receipt)".
  ```
- **E1** — 2026-11-21, `bun scripts/run-root-suite.mjs` · exit 0 · 137 suites PASS.
- **E2** — 2026-11-21, `cd packages/agentic-workflow && bun test test/` · exit 0 · 1388 pass / 0 fail.
- **E3** — 2026-11-21, `bun test scripts/relay-packet.test.mjs` · exit 0 · 44 pass / 0 fail (the `CO1`–`CO12` cases plus every pre-existing case).
- **E4** — 2026-11-21, differential on the accepted fixture at `3f749feeb` and at the change: `check`, `budget` and `obligations` print byte-identical blocks and exit identically (`diff` empty on all three).
- **E5** — 2026-11-21, `bun test scripts/relay-route.test.mjs` · exit 0 · 13 pass / 0 fail.
- **E6** — 2026-11-21, `bun scripts/skill-lint.mjs` · exit 0 · 0 findings; `bun scripts/check-skill-context.mjs` · exit 0 · PASS 30 skills.
- **E7** — 2026-11-21, `rg -U -c 'REVIEW-VERDICT: PASS` never satisfies' skills/unit-lane/references/RELAY.md` · exit 0 · 1.
- **E8** — 2026-11-21, `bun packages/agentic-workflow/bin/agentic-workflow.mjs relay closeout --help` · exit 2 (`RELAY REFUSAL — unknown flag: --help`; corrected 2026-11-22 by the `EXTERNAL VERIFY` A1 finding — the original parenthetical misattributed the refusal to the missing unit token).
- **E9** — 2026-11-21, `bun test scripts/normative-drift.test.mjs` · exit 0 · 24 pass / 0 fail.
- **E10** — 2026-11-21, the frozen reproducer of the issue: a `Complete` baton whose packet names no receipt at the cut head printed `verdict: PASS` / exit 0; against the change it prints `verdict: FAIL` / exit 1 with `a Complete verdict needs the receipt boundary`.
- **E11** — 2026-11-21, `bun scripts/docs-generate.mjs --check` · exit 0 · 3 checked, 0 stale.
- **E12** — 2026-11-21, `bun packages/agentic-workflow/bin/agentic-workflow.mjs unit-route --triage 680` · exit 0 · `Steps: plan, implement, tests, evidence, review, docs`.
- **E13** — 2026-11-21, `cd packages/pi-agentic-workflow && bun run bundle:skills && bun test` · exit 0 · 1035 pass / 0 fail.
- **E14** — 2026-11-21, `runner dimension-regression --base 3f749fe` · exit 1 (the first run, before its own record existed) · `base 20 dimensions · head 20 dimensions · changed review surfaces 1 · finding missing-reverification-evidence`. The one changed surface is this unit's `docs/workflow/GATE_INVENTORY.md` row, a pure `+1` line with no dimension, review skill or audit producer touched and no dimension dropped (20 → 20); the re-run after this record is `E15`.
- **E15** — 2026-11-21, `bun packages/agentic-workflow/bin/agentic-workflow.mjs dimension-regression --base 3f749fe` · exit 0 · `base 20 dimensions · head 20 dimensions · changed review surfaces 1 · verdict clean`, this record being the evidence it reads.
- **P1** — 2026-11-21, the RED reproducers frozen beside the ledgers · 5620efcec.
- **P2** — 2026-11-21, the receipt boundary in `checkPacket` plus the `closeout` mode · 485f0c720.
- **P3** — 2026-11-21, the `relay-closeout@1` contract prose and the close-out ownership in `unit-lane` · 485f0c720.
- **P4** — 2026-11-21, the surface registered in the gate inventory and both guide ceilings re-based · cbccbb273.
- **D1** — 2026-11-21, owner decision by the issue itself (S1/S2): the receipt state is read from the baton's published `Review:` line rather than from the forge, so `relay check` stays offline and host-free (PE-009, PE-011).
- **L2** — 2026-11-22, the correction request, verbatim: "Apply to this repository: triage and fix those that deserve to fix but understand the context before fix and check you haven't broke another different thing, if you have done, start the loop again until you fixed full symbol/related stuff" — resolved against the 2026-11-22 `EXTERNAL VERIFY` block (NEEDS-DECISION: B1–B4, A1–A4) as one correction batch. Triage: B1–B4 and A1–A3 fix-now; A4 wontfix (fail-closed by design — an uppercase 40-hex sha reads as `not-current` and git SHAs are lowercase).
- **P6** — 2026-11-22, the correction RED cases frozen from the receipt's reproducers (CO13 mode-count, CO14 url-less current receipt) · observed 44 pass / 2 fail · 1a88f1383.
- **P7** — 2026-11-22, the fixes: the three stale `four modes` mentions refreshed, `closeout` gated on one condition (current receipt AND its PR url), `RELAY.md`'s fence and machine row carrying every `Review:` value the runtime parses · 77e565021.
- **P8** — 2026-11-22, the receipt-text corrections (AC-S2's url clause, AC-S5/PE-003's mirror claim, E8's recorded refusal) and the ledger cut (tasks P6–P8, obligations O14–O18) · b7097ebe2.
- **F1** — folded (external verify B1–B3): `skills/unit-lane/references/RELAY.md:50`, `packages/agentic-workflow/src/relay/Packet.mjs:48` and `packages/agentic-workflow/src/promise-coherence/index.mjs:175` still said "four modes" after `RELAY_MODES` grew to five · fold 77e565021 · verified by CO13 green (46 pass / 0 fail).
- **F2** — folded (external verify B4): `closeout`'s precondition line and `→ Next:` route derived from different conditions, so a current receipt without a PR url claimed the gate's precondition was met while routing the leg to `/review-change` · fold 77e565021 · verified by CO14 green; AC-S2 and O7 amended to the url-carrying case in b7097ebe2.
- **F3** — folded (external verify A1–A3): E8's misrecorded refusal reason and AC-S5/PE-003's phantom import claim (b7097ebe2), the baton fence's dropped `attempted <n> — <result>` value and repeated `Review:` prefix (77e565021) · verified by the O16–O18 validators (E17).
- **D2** — 2026-11-22, correction decision (B4): AC-S2's "when the receipt is current" clause is amended to the url-carrying case, because the original was unsatisfiable — a receipt with no url has no `/audit-pr <PR-url>` to print. The alternative (requiring ` · pr <url>` for `current` everywhere, so `check` refuses a url-less current receipt) would move `check`'s boundary and CO3's accepted packet, which the receipt did not ask for; the ladder, not the packet contract, is where the url is needed.
- **G1** — 2026-11-22, `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/fix/680-relay-closeout-receipt-orphan/SPEC.md` · exit 0 · PASS 8/8 (the first run BLOCKED P8's "adds or amends" either-or wording — the task text was reworded, never the rule).
- **E16** — 2026-11-22, `bun test scripts/relay-packet.test.mjs` · exit 0 · 46 pass / 0 fail (CO13 and CO14 green beside every pre-existing case).
- **E17** — 2026-11-22, the O16–O18 validators · `rg -c 'attempted <n> — <result>' skills/unit-lane/references/RELAY.md` → 2 · `rg -c 'RELAY REFUSAL — unknown flag: --help' docs/fix/680-relay-closeout-receipt-orphan/SPEC.md` → 1 · `rg -c 'mirror' docs/fix/680-relay-closeout-receipt-orphan/SPEC.md` → 3 · `rg -c 'by name, not by import' docs/fix/680-relay-closeout-receipt-orphan/planning-evidence.md` → 1 (all exit 0).
- **E18** — 2026-11-22, the differential at `3f749feeb` vs the change in `mktemp -d` scratch (removed after): `check`/`budget`/`tiers`/`obligations` byte-identical on the accepted fixture and `check` byte-identical on Complete + `receipt current at <sha> · pr <url>`; the only differences are the asked-for ones — Complete without a receipt base PASS/exit 0 → head FAIL/exit 1, and `closeout` absent at base (usage, exit 2).
- **E19** — 2026-11-22, the batch's full gate re-run · `node scripts/run-root-suite.mjs` 137 PASS exit 0 · `cd packages/agentic-workflow && bun test test/` 1388 pass / 0 fail · `cd packages/pi-agentic-workflow && bun run bundle:skills && bun test` 1035 pass / 0 fail · `bun scripts/skill-lint.mjs` 0 findings · `bun scripts/check-skill-context.mjs` PASS 30 skills and `--documents` PASS 7 documents · `bun test scripts/normative-drift.test.mjs` 24 pass · `bun test scripts/relay-route.test.mjs` 13 pass · `bun test scripts/review-receipt.test.mjs` 30 pass · `bun scripts/promise-coherence.mjs` PASS (45 checked / 24 skipped) · `bun scripts/docs-generate.mjs --check` PASS (3 checked, 0 stale).

## Next

PR [#683](https://github.com/gtrabanco/agentic-workflow/pull/683) is open with
`Closes #680`. The owner's external verify of the 2026-11-22 correction batch
(B1–B4 fixed, A1–A3 corrected, A4 wontfix) follows; the verdict and any further
correction come from `/aw-local-review`'s owner, never from this session.

## References

- Issue #680; roadmap `## Fixes` row `680-relay-closeout-receipt-orphan`.
- `skills/unit-lane/references/RELAY.md` §Coherence review, §Receipt boundary.
- `skills/unit-lane/SKILL.md` §8 Close the unit.
- `packages/agentic-workflow/src/review-receipt/index.mjs` (the grammar).
- The PR closes the tracked issue via `Closes #680`.

## Branch

`fix/680-relay-review-receipt-closeout`

## Depends on

none

## Regression scope

What previously-working behaviour must NOT break:

| Scenario | Verifier |
|---|---|
| A non-`Complete` baton (`Draft`/`Active`) passes `relay check` exactly as before, with no receipt demand | the pre-existing `check: the accepted packet passes with the fixed block` case in `bun test scripts/relay-packet.test.mjs` |
| Every pre-existing packet fault class still refuses, with its own wording | the `check: refuses …` table in `bun test scripts/relay-packet.test.mjs` |
| The router's `relay:` addendum is byte-unchanged | `bun test scripts/relay-route.test.mjs` |
| `review-receipt verify`'s own contract is unchanged | `bun test scripts/review-receipt.test.mjs` |
| `relay budget` / `tiers` / `obligations` blocks are byte-unchanged | the corresponding cases in `bun test scripts/relay-packet.test.mjs` |
