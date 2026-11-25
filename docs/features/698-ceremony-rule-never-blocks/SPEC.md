---
type: feature
scope: medium
roadmap_summary: Issue [#698](https://github.com/gtrabanco/agentic-workflow/issues/698) (M): a ceremony-shaped finding never blocks the merge of a complete, integrated, gate-green feature — a published `workflow` finding class that routes upstream, a machine `repair-receipt` that `audit-pr-gate` and `review-receipt` consume as currency under typed conditions, verdict receipts for every non-pass outcome, and a ceremony-bookkeeping class the delta derives from.
ac-hash: 4e7d8bc0e28e2829f8429206f12a9cd0ccd41342199bf9cb04b045d6d72cde96
---

# 698 — ceremony-rule-never-blocks

> One-line: a ceremony-shaped finding stops being a blocker of the project's
> feature — it becomes a typed workflow defect that routes upstream, and a
> repaired, gate-green, acceptance-stable head is merge evidence again.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.1
schema: @gtrabanco/agentic-workflow-schema@4.10.1
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

```text
retention-declaration@1
path | disposition
SPEC.md | kept
decisions.md | kept
known-issues.md | kept
planning-obligations.md | kept
planning-evidence.md | kept
external-verify.md | trimmable
review-findings.md | trimmable
planning-findings.md | trimmable
```

## Issue

`#698` — tracked issue in the project's forge, labelled `promoted` (triage
verdict 2026-12-23: promote; the unit's surfaces were already declared). This
unit's PR closes it via `Closes #698`.

The issue is a cluster: its normative rule is one sentence, and its mechanisms
were partly claimed by sibling units filed from the same field pass. This
unit's `## Non-goals` cites each sibling by number, so nothing declared here is
a deferral of unowned work.

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim
between the quote markers. `S1` is the operator's order; `S2`–`S9` quote the
issue's own words, which that order adopts as the work.

**S1 — the order: apply #698 to this repository, inline.**
> Apply to this repository: issue #698

**S2 — the rule: correctness decides blocking, never ceremony bookkeeping.**
> Make a ceremony-shaped finding **never block the merge of a complete, integrated, gate-green feature**. Blocking must be *derived from the feature's own correctness* — acceptance criteria coverage, evidence re-run green, gate pass, integration into the application as requested — never from the ceremony's own bookkeeping state. Today the opposite happens: review→fold→audit-pr cycles re-run on a finished feature and every blocker is ceremony.
>
> **Owner direction (2026-11-23, jotted in conversation):** the most important thing is building the feature correctly and completely — respecting the project's architecture, development guidelines (design system et al.) and the user's expectations — with evidenced completeness. Ceremony compliance ranks below that. A ceremony defect is a defect of agentic-workflow, never of the project under development. Legitimate responses: fix it upstream, degrade it to a repair that never reopens the review cycle, or split the feature — but NEVER force another full review cycle on a feature that is done and green.

**S3 — failure point 1: the ceremony/workflow finding class.**
> 1. **No ceremony/workflow finding class.** The findings ladder (`BLOCKER|CRITICAL|WARNING|SUGGESTION` + impact) and the owning-stage vocabulary ({product|plan|source|environment|runtime}) cannot express "the workflow's own scaffold, gate or carrier is defective". Such findings circulate as in-unit `BLOCKER · fix-now` rows and the anti-deflation rule pushes them UP. Field sample beyond fix-334's F1–F3: the unit's degraded Engram memory probe (`session-ambiguity · doctor-error`) was absorbed INTO the unit doc as evidence row E-p0 — substrate degradation recorded as product evidence — when the correct route is a typed workflow-defect finding that reports upstream (the #703 report battery reads memory-doctor state among its fixtures). A ceremony finding must classify as a workflow defect and route upstream (an agentic-workflow issue), never block the consuming PR.

**S4 — failure point 2: the machine-consumable repair receipt.**
> 2. **Currency is tree-wide, not unit-scoped.** Receipts (gate-receipt, review-receipt) hash a digest over the whole worktree, so any unit's (or even the review's own) bookkeeping voids another unit's proof of greenness. A repair needs a **machine-consumable REPAIR-RECEIPT**: `fold-findings` posts a SHA-bound marker (`<!-- fold-findings:repair sha=… scope=… class=… -->`) that `review-receipt verify` and `audit-pr-gate` accept as currency when the class is ceremony/docs-only, zero open BLOCKER/CRITICAL rows, AC blob byte-identical and the gate green — else fail closed to today's routing. **The receipt is two-way**: it carries the encoded route (SKIPPED/OPTIONAL/REQUIRED), so the same shape serves both continuations (audit-pr accepts the head as-is and the feature proceeds to merge) and re-runs (the cycle repeats with the receipt as its typed input); the consumer decides from the class, never from mechanics.

**S5 — failure point 3: audit-pr re-audits its own scope.**
> 3. **audit-pr has no re-audit path for its own blockers.** Any stale receipt routes the whole PR to `/review-change` even when the folded rows are audit-pr's own emitted blockers. It should re-audit its own scope from the fold receipt, exactly as `/aw-local-review` blocks only on material findings.

**S6 — failure point 7: the receipt emission order.**
> 7. **Receipt emission order is unpinned — the receipts void each other.** Every bookkeeping commit (ledger rows, the unit doc's `## Log`, the review's own receipt) rotates the head, and both receipts must be current at the audit head. fix-334 lived the full alternation: the re-triage verified its review receipt, then its own doc commit staled it; cycle 3 re-pinned the review receipt and its ledger commit re-staled the gate receipt (`changed_paths: [docs/fix/334…/review-findings.md]` — the review's own bookkeeping). The close-out needs a prescribed emission order (bookkeeping commits first, receipts emitted last, a re-pin that commits nothing), or the repair-receipt class of point 2 absorbs the ordering.

**S7 — universal receipt emission: every verdict leaves a machine trace.**
> - **Universal receipt emission (owner requirement, added 2026-11-23)**: EVERY ceremony surface that reaches a verdict must emit a typed, machine-verifiable receipt, and the downstream consumers must know each one:
>   - review receipts: `review-change` currently posts the `review-change:pass` marker only on REVIEW-PASS — a non-pass verdict (REVIEW-FAIL, cycle 2 of fix-334) posts NOTHING, so a failed review leaves no machine trace of what it verified or refuted;
>   - audit-pr receipts: today only MERGE-READY posts a comment (`runner audit-pr-gate comment`); a **BLOCKED verdict emits no receipt at all** — fix-334's blockers had to be hand-reconstructed into the findings ledger from session memory (commit `93425617`, literally titled "reconstruct fold ledger from audit-pr blockers"), a fidelity and provenance risk the receipt requirement exists to kill;
>   - repair receipts: `fold-findings`' REPAIR-RECEIPT is terminal unconsumed prose today; the planned `execute-phase --repair` (post fold-findings retirement, #307 notes 5–6) must emit the same typed shape, and `execute-phase`'s in-lane repair path emits whatever verdict-level receipt its red-gate loop produces, so a lane-level repair is never receipt-less.

**S8 — the advisory: a ceremony finding routes upstream, never into a repair round.**
> When a review, fold or audit cycle classifies findings as ceremony/workflow-defect class (the class this issue introduces), the composing skill must surface an **advisory** to the owner: this finding looks like an agentic-workflow defect, not a defect of the project under development; search the upstream issue tracker first (#170, #301, #260, this issue are the known prior art) and, if unreported, offer to file it. The advisory is never a blocker and never a repair round.

**S9 — the acceptance shape.**
> A unit whose feature work is complete (ACs covered with re-run evidence, gate pass, CI pass, integration verified) and whose only open findings are ceremony-class completes to merge with at most one fold turn plus one audit-pr run — no full re-review cycle — across both the vendor repo installs and consumer projects like sosfelinosbasti.

## Acceptance criteria

Frozen at the cut; `ac-hash:` in the frontmatter is this section's SHA-256
(heading and the next `## ` excluded). One criterion per requirement, each
naming the check that proves it.

1. **S1 — the order is applied inline against the frozen ledgers.** `git log --oneline main..HEAD` carries only this unit's conventional commits, and `rg -n 'review-change|audit-pr|fold-findings' docs/features/698-ceremony-rule-never-blocks/` matches no run record: no review pack, no fold cycle, no self-granted gate exception.
2. **S2 — a ceremony-shaped finding cannot block; correctness still does.** `bun test scripts/repair-receipt.test.mjs` exits 0 with the case `a repaired, gate-green, acceptance-stable head is merge currency`, and the same suite proves the negative: an open BLOCKER row, a moved acceptance hash, a red gate and a source-bearing delta each hold currency at `RE-REVIEW-REQUIRED`.
3. **S3 — the `workflow` class is published and never lands as an in-unit blocking row.** `bun test packages/agentic-workflow/test/runner.ceremony-findings.test.mjs` exits 0 with the cases `a workflow row must be report-only` and `the class cell resolves against the published set`, and `PRE_EXECUTION_FINDING_CLASSES` in `packages/agentic-workflow-schema/src/pre-execution-contract.ts` carries `workflow`.
4. **S4 — the repair receipt is machine-consumable by both consumers under its typed conditions.** `bun test scripts/repair-receipt.test.mjs` exits 0 with the cases `the marker encodes the route and every piece of evidence it checked`, `a stale gate receipt staled only by ceremony bookkeeping stays gate currency`, and `OME emits one typed marker per verdict at the head`; `scripts/audit-pr-receipt.test.mjs` and `scripts/review-receipt.test.mjs` exit 0 with their repair-currency cases.
5. **S5 — audit-pr re-audits its own scope instead of routing to a fresh review.** `bun test scripts/audit-pr-receipt.test.mjs` exits 0 with the case `a current repair receipt keeps the review gate satisfied and the remaining gates decide`; the `audit-pr` skill prose names the repair currency before the route to `/review-change`.
6. **S6 — the emission order is prescribed and the re-pin commits nothing.** `rg -n 'bookkeeping commits first' skills/fold-findings/SKILL.md` matches, and `bun test scripts/repair-receipt.test.mjs` exits 0 with the case `emit refuses a head it cannot read and posts no commit`.
7. **S7 — every non-pass verdict leaves a typed machine receipt.** `bun test scripts/audit-pr-receipt.test.mjs` exits 0 with the case `a BLOCKED verdict posts one blocked receipt and re-auditing the same head skips it`; `bun test scripts/review-receipt.test.mjs` exits 0 with the case `a REVIEW-FAIL receipt names the head, the cycle and the open finding count`; both markers are parsed by their own runtimes.
8. **S8 — the advisory is surfaced and never becomes a blocker or a repair round.** `rg -n 'agentic-workflow defect' skills/review-implementation/references/CLASSIFY.md skills/fold-findings/SKILL.md` matches both files, and the `workflow` class's route cell in the owning-stage table names the upstream tracker, not a fold.
9. **S9 — one fold turn plus one audit-pr run is the documented continuation.** `rg -n 'RE-REVIEW-SKIPPED' skills/fold-findings/SKILL.md skills/audit-pr/references/03_AUDIT_PROCESS.md` matches both files, and `bun test scripts/repair-receipt.test.mjs` exits 0 with the case `a ceremony-only repair derives RE-REVIEW-SKIPPED`.

## Impact

The change lands on four surfaces that already have consumers, plus prose.

- **`packages/agentic-workflow-schema/src/pre-execution-contract.ts`** — one
  added value in `PRE_EXECUTION_FINDING_CLASSES` (`workflow`). Every reader of
  the class cell validates against it: `runner ceremony findings`,
  `scripts/vocabulary-probe.mjs`, the pre-execution receipt contract, and the
  four unit-doc templates. The generated pre-execution schema projections must
  be re-emitted in the same change.
- **`packages/agentic-workflow/src/repair-receipt/`** (new) — the runtime the
  prose `REPAIR-RECEIPT` block has waited for. `scripts/repair-receipt.mjs` is
  this repository's caller; `src/runner/cli.mjs`, `src/runner/help.mjs`, the
  bin usage list and the crate README's command table all name it, and
  `cli.surface.test.mjs` pins the four in one direction.
- **`packages/agentic-workflow/src/audit-pr-gate/`** — one accepted currency and
  one emitted receipt. `auditVerdict` gains the repair currency as its
  review-receipt escape hatch; `gateReceiptGate`'s stale answer is overridden
  only when the repair receipt says the gate ran green before bookkeeping moved;
  `comment` posts a BLOCKED receipt instead of nothing. Every existing gate and
  the `MERGE-READY` path stay byte-identical.
- **`packages/agentic-workflow/src/review-receipt/`** — a non-pass marker family
  (`review-change:fail`, `review-change:needs-decision`) and a repair-currency
  branch in `verify`. The pass marker, its parser and `emit` keep their bytes.
- **`packages/agentic-workflow/src/scope-manifest/`** — one additive closed
  matcher (`isCeremonyBookkeeping`) beside `isNonAffecting`; the scope digest
  and its existing classes are untouched, so no published receipt rotates.
- **Prose** — `review-implementation/references/CLASSIFY.md` (owning-stage row
  and advisory), `pre-execution-review/references/POLICY.md` and `LEDGERS.md`
  (the class list), the four unit-doc templates' `findings-table@1` class cell,
  `skills/fold-findings/` (emit command + order), `skills/audit-pr/` (currency
  + blocked receipt), `skills/review-change/references/PERSIST_AND_DECIDE.md`
  (non-pass receipt), and the schema crate README (the published set row + the
  repair receipt grammar block).
- **What stops being true**: `REPAIR-RECEIPT` stops being terminal prose with
  no consumer; a BLOCKED audit stops being receipt-less; a `workflow` defect
  stops being an in-unit `BLOCKER · fix-now` row; and a head whose only delta is
  ceremony bookkeeping stops voiding a green gate.

## Surfaces

- `packages/agentic-workflow-schema`
- `packages/agentic-workflow`
- `skills/fold-findings`
- `skills/audit-pr`
- `skills/review-change`
- `skills/review-implementation`
- `skills/pre-execution-review`
- `docs`
- `template`

## Retirements

Strictly additive: no token is renamed and no runtime is removed. The computed
inventory of what this unit *adds*, each with its consumer:

| surface | consumer |
|---|---|
| `workflow` class token | `runner ceremony findings` write validation, `scripts/vocabulary-probe.mjs`, the four `findings-table@1` blocks, `review-implementation`'s owning-stage table |
| `repair-receipt emit` / `verify` | `scripts/repair-receipt.mjs`, `src/runner/cli.mjs`, `skills/fold-findings/SKILL.md`, `skills/audit-pr/references/03_AUDIT_PROCESS.md` |
| the `fold-findings:repair` marker | `audit-pr-gate`'s receipt gate and `review-receipt verify` |
| the `audit-pr:blocked` marker | `skills/audit-pr/SKILL.md`'s close-out; `audit-pr-gate comment` |
| the `review-change:fail` / `:needs-decision` markers | `review-receipt`'s parser and `skills/review-change/references/PERSIST_AND_DECIDE.md` |
| `isCeremonyBookkeeping` | the repair receipt's delta derivation |

`runner residual-classify --inventory --base main` is the manifest-derived
receipt for these rows (§ `## Log` E-line).

## Non-goals

- **Write-time structural checks for staged triage/tick consistency** (issue
  point 4) are #701's declared scope: `runner scaffold-contract authoring` is its
  carrier and its roadmap row names the F18/F1 drift class. This unit consumes
  the class it publishes; it does not duplicate the checker.
- **The cycle caps** (`review.max-cycles`, `audit-pr.max-runs`, default 2) join
  #669's deterministic lane driver, as the issue's own bullet says; no config key
  is added here (a key no runtime reads is not shipped).
- **The anonymized report bundle and its generator** are #703's
  `agentic-workflow-doctor`; this unit's prose only names the advisory and its
  route.
- **The findings-writer destruction defects** the issue's triage records
  (`writeRows` replacing prose, row identity on `--folded`) are #702's; the
  writer this unit extends is the one #702 landed.
- **Prose-only delivery conditions** are #704's; this unit adds no new one.
- **`execute-phase --repair`** (post `fold-findings` retirement) is #307's note;
  this unit ships the typed shape it must emit, and its owning skill emits the
  same marker through the one command.

## Risk tier

Copied verbatim from `runner ceremony tier classify` at the cut head over the
planned paths:

- **Tier** — `high` · **Task Size** — `{understood: true, contained_risk: "named", resumable_from_diff: true, ceremony: "unit-doc+review-change", verification: "review-change"}`
- **Named high-risk item** — `packages/agentic-workflow/bin/agentic-workflow.mjs` (`signal: destructive`)

`reason`: `1 path(s) touch a named high-risk surface: destructive (packages/agentic-workflow/bin/agentic-workflow.mjs · ../src/doc/retrieval.mjs · (module-level))`.
The named surface's escalation is the module-level reference that file has always
carried; this unit's hunk is the usage list entry and nothing else. The
`review-change` half of the ceremony is replaced by the operator's own external
verification (S1's inline workflow, `## Log` L2/D1).

## Future

none.

## Future cost

- A new published class token now costs four mirrors in one change (the schema
  const, the README row, the owning-stage table, the findings-table block); the
  vocabulary parity suite refuses a diverging copy, so the next class is told by
  a red suite instead of by a reviewer.
- A consumer that adds a receipt family (a new verdict surface) extends
  `repair-receipt`'s marker grammar and its two consumers; it never re-implements
  a freshness rule inside a skill, which is the defect class this unit closes.
- The ceremony-bookkeeping matcher is deliberately narrow. A new bookkeeping
  carrier (a second journal home, a new receipt log) extends
  `CEREMONY_BOOKKEEPING_*` in `scope-manifest`, and its own suite proves the
  class name, so the next carrier is a one-file change with a red test.

## Applicable tests

- `bun test scripts/repair-receipt.test.mjs` — the new runtime: marker grammar,
  route derivation, every currency condition and its failing counterpart (red
  first, its own commit).
- `bun test scripts/audit-pr-receipt.test.mjs` — repair currency on the review
  gate and the gate-receipt gate, and the BLOCKED receipt.
- `bun test scripts/review-receipt.test.mjs` — the non-pass markers and the
  repair-currency branch in `verify`.
- `bun test scripts/scope-manifest.test.mjs` — the ceremony-bookkeeping matcher
  and the untouched scope digest.
- `bun test packages/agentic-workflow/test/runner.ceremony-findings.test.mjs` —
  the `workflow` class write-time refusal.
- `bun test scripts/vocabulary-parity.test.mjs` and
  `bun test scripts/vocabulary-probe.test.mjs` — the published set and every
  mirror.
- `bun test packages/agentic-workflow/test/cli.surface.test.mjs` — the help
  registry, the usage line and the README rows for the new command.
- `bun test scripts/pre-execution-quality.test.mjs` — the regenerated
  pre-execution schema projections.
- `bun scripts/check-skill-context.mjs`, `bun scripts/skill-lint.mjs`,
  `bun test scripts/normative-drift.test.mjs`,
  `bun test scripts/prose-gate-inventory.test.mjs` — the prose budgets and the
  drift gates the changed pages belong to.
- `bun scripts/run-root-suite.mjs` and
  `bun run --cwd packages/agentic-workflow test` — the two gates.

## Known pre-existing issues

- **The risk-tier classifier escalates every edit to
  `packages/agentic-workflow/bin/agentic-workflow.mjs`** (`signal: destructive`,
  reason `../src/doc/retrieval.mjs · (module-level)`). `does-not-affect`: the
  escalation is recorded as the unit's named high-risk item; this unit's hunk is
  the usage list entry.
- **`scripts/test-obligation-tags.test.mjs` refuses an untagged root suite** —
  `affects` this unit: the new `scripts/repair-receipt.test.mjs` carries its
  `// test-obligation:` head, and the edited root suites keep theirs.
- **The roadmap table carries the #698 row twice** (`docs/ROADMAP.md:215` and
  `:219`, the second added by `2780f79a7`). `does-not-affect`: the duplicate
  renders once and no reader counts rows; this unit's own row is removed at
  merge, and the duplicate is reported to the owner rather than silently deleted
  inside this change.
- **`bun test` can report `0 pass 0 fail` on a few suites that pass under
  `node --test`.** `does-not-affect`: every touched suite runs under both
  invocations in the verification block, and a zero-case report is named there
  rather than counted as green.

## Tasks

- P1 — Cut the unit doc, the two standalone ledgers, the decisions and known-issues carriers; register the roadmap row through its writer (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/features/698-ceremony-rule-never-blocks/SPEC.md --no-git` exits 0)
  (Implements: S1, S8, S9)
  - Relevant files: docs/features/698-ceremony-rule-never-blocks/SPEC.md, docs/features/698-ceremony-rule-never-blocks/planning-evidence.md, docs/features/698-ceremony-rule-never-blocks/planning-obligations.md, docs/features/698-ceremony-rule-never-blocks/decisions.md, docs/features/698-ceremony-rule-never-blocks/known-issues.md, docs/ROADMAP.md
- P2 — RED: the `repair-receipt` suite lands alone and is observed failing on the absent module (validator: `bun test scripts/repair-receipt.test.mjs` exits 1 with the module-resolution failure recorded as an `E` line)
  (Implements: S4, S6, S9)
  - Relevant files: scripts/repair-receipt.test.mjs
- P3 — The `workflow` class: one schema token, its four mirrors, and the findings writer's report-only refusal (validator: `bun test packages/agentic-workflow/test/runner.ceremony-findings.test.mjs` exits 0 AND `bun test scripts/vocabulary-parity.test.mjs` exits 0)
  (Implements: S3, S8)
  - Relevant files: packages/agentic-workflow-schema/src/pre-execution-contract.ts, packages/agentic-workflow-schema/README.md, packages/agentic-workflow/src/runner/ceremony/findings.mjs, packages/agentic-workflow/src/runner/ceremony/review.mjs, skills/review-implementation/references/CLASSIFY.md, skills/pre-execution-review/references/POLICY.md, skills/pre-execution-review/references/LEDGERS.md, docs/fix/_TEMPLATE/SPEC.md, docs/features/_TEMPLATE/SPEC.md, template/docs/fix/_TEMPLATE/SPEC.md, template/docs/features/_TEMPLATE/SPEC.md, packages/agentic-workflow/test/runner.ceremony-findings.test.mjs
- P4 — The runtime and its command: marker grammar, route derivation, currency judge, CLI, help and README rows (validator: `bun test scripts/repair-receipt.test.mjs` exits 0)
  (Implements: S4, S6)
  - Relevant files: packages/agentic-workflow/src/repair-receipt/index.mjs, scripts/repair-receipt.mjs, packages/agentic-workflow/src/runner/cli.mjs, packages/agentic-workflow/src/runner/help.mjs, packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/README.md
- P5 — The ceremony-bookkeeping class in the scope manifest and the repair receipt's delta derivation (validator: `bun test scripts/scope-manifest.test.mjs` exits 0 AND `bun test scripts/repair-receipt.test.mjs` exits 0)
  (Implements: S4, S6)
  - Relevant files: packages/agentic-workflow/src/scope-manifest/index.mjs, packages/agentic-workflow/src/repair-receipt/index.mjs, scripts/scope-manifest.test.mjs
- P6 — The consumers: audit-pr currency, the BLOCKED receipt, and the review non-pass receipt (validator: `bun test scripts/audit-pr-receipt.test.mjs` exits 0 AND `bun test scripts/review-receipt.test.mjs` exits 0)
  (Implements: S2, S5, S7)
  - Relevant files: packages/agentic-workflow/src/audit-pr-gate/index.mjs, packages/agentic-workflow/src/review-receipt/index.mjs, scripts/audit-pr-receipt.test.mjs, scripts/review-receipt.test.mjs
- P7 — The skills: the fold's emit command and emission order, audit-pr's currency and blocked receipt, review-change's non-pass receipt, the advisory (validator: `rg -n 'RE-REVIEW-SKIPPED' skills/fold-findings/SKILL.md skills/audit-pr/references/03_AUDIT_PROCESS.md` matches both files AND `bun scripts/check-skill-context.mjs` exits 0)
  (Implements: S5, S6, S7, S8, S9)
  - Relevant files: skills/fold-findings/SKILL.md, skills/fold-findings/references/FOLD_PROCESS.md, skills/audit-pr/SKILL.md, skills/audit-pr/references/03_AUDIT_PROCESS.md, skills/review-change/references/PERSIST_AND_DECIDE.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json
- P8 — State, release intent, and the verification block (validator: `bun scripts/lint-changeset.mjs` exits 0 AND `bun scripts/run-root-suite.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8, S9)
  - Relevant files: .changeset/698-ceremony-rule-never-blocks.md, docs/ROADMAP.md, docs/generated, .agentic-workflow/journal, docs/features/698-ceremony-rule-never-blocks/planning-obligations.md

## Triaged steps

`runner unit-route --triage 698` at the cut head, verbatim:

```text
TRIAGE — 698 (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
relay: bootstrap-needed — no packet at .pi-web/relays/698-ceremony-rule-never-blocks
relay-next: create .pi-web/relays/698-ceremony-rule-never-blocks/ (charter → docs/features/698-ceremony-rule-never-blocks/SPEC.md) then dispatch_relay(packet: ".pi-web/relays/698-ceremony-rule-never-blocks", leg: "1") · legs: 9 = 8 phases + 1 coherence review
```

The `review` step is replaced by the operator's external verification (S1), and
the `release` step is the changeset that ships with the code.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-24, the operator's order, verbatim:
  ```
  Apply to this repository: issue #698
  ```
- **L2** — 2026-11-24, the operator's governing workflow for this application, verbatim (the parts that bind the procedure):
  ```
  0. Resolve the intent from state before acting
  ...
  4. Work inline — never run this repo's own machinery on its own surgery

  No `review-change`, no `audit-pr`, no fold cycle, no self-granted gate exceptions on this change. Direct application: the §5 ledger freeze **is** the plan; implement against it, hand the diff to me. The one exception is the repo's deterministic gates (tests, lints) — run those always.
  ...
  8. Verify like a writer, hand off like one
  ...
  Then run the declared verification commands in the foreground and report each as `command: observed result`. Then stop and present: the diff summary, the obligations ledger state (rows × status), the verification block, the §7 documentation state, and every failed/skipped/pending check honestly — **I am the external verifier**. Do not self-approve, do not claim done before my verdict.
  ```
- **E0** — 2026-11-24, the state resolution: `git status --short` empty; `git log --oneline -1` = `207147ff1`; `ls docs/features/698-*` exit 1 (no unit doc); `gh issue view 698` label `promoted`, no `blocked-by`; `docs/ROADMAP.md` carried the row twice (`:215` from `0c0e2718a`, `:219` re-added by `2780f79a7`) — repaired through `roadmap rowUpsert`'s duplicate splice, never by a hand edit (`D13`).
- **E1** — 2026-11-24, the frozen-failure corpus before any implementation: `bun test scripts/repair-receipt.test.mjs` at `a6847fe57` · exit **1** · `Cannot find module './repair-receipt.mjs'` (0 pass / 1 fail / 1 error) — the fold's `REPAIR-RECEIPT` had no runtime, the defect S4 names; `bun test packages/agentic-workflow/test/runner.ceremony-findings.test.mjs` before the class landed · exit **1** · 12 pass / 2 fail (the two `O20` cases) — the writer had no owning stage named `workflow`.
- **E2** — 2026-11-24, P3 green at `0edb8363d`: `bun test packages/agentic-workflow/test/runner.ceremony-findings.test.mjs` · exit 0 · **14 pass / 0 fail**; `bun test scripts/vocabulary-parity.test.mjs` · exit 0 · **37 pass / 0 fail**; `bun test packages/agentic-workflow-schema/test/pre-execution-receipt.test.mjs` · exit 0 · **23 pass / 0 fail**.
- **E3** — 2026-11-24, the repair runtime at `8b36fdb73`: `bun test scripts/repair-receipt.test.mjs` · exit 0 · **11 pass / 0 fail**, including the end-to-end fixture (`assembleReceipt` → bookkeeping commit → `collectRepairFacts` → currency) and its negative (a source-bearing delta derives `RE-REVIEW-REQUIRED`).
- **E4** — 2026-11-24, the ceremony-bookkeeping class at `aeeb9413b`: `bun test scripts/scope-manifest.test.mjs` · exit 0 · **9 pass / 0 fail** — the class is closed and named, `isNonAffecting` answers only its two published classes, and the digest still never binds the head.
- **E5** — 2026-11-24, the consumers at `1d1ad5ed6`: `bun test scripts/audit-pr-receipt.test.mjs` · exit 0 · **36 pass / 0 fail**; `bun test scripts/review-receipt.test.mjs` · exit 0 · **32 pass / 0 fail**.
- **E6** — 2026-11-24, the published set and its mirrors: `bun test scripts/vocabulary-parity.test.mjs` · exit 0 · **37 pass / 0 fail**; `bun test scripts/vocabulary-probe.test.mjs` · exit 0 · **10 pass / 0 fail**.
- **E7** — 2026-11-24, the CLI surface: `bun test packages/agentic-workflow/test/cli.surface.test.mjs` · exit 0 · **12 pass / 0 fail**; `bun test scripts/cli-coverage.test.mjs` · exit 0 · **8 pass / 0 fail**; `bun test packages/agentic-workflow/test/runner.dispatch.test.mjs` · exit 0 · **7 pass / 0 fail**; `bun packages/agentic-workflow/bin/agentic-workflow.mjs help repair-receipt` · exit **0**.
- **E8** — 2026-11-24, the drift gates: `bun test scripts/normative-drift.test.mjs` · **24 pass / 0 fail**; `bun test scripts/prose-gate-inventory.test.mjs` · **22 pass / 0 fail**; `bun test scripts/invocation-drift.test.mjs` · **13 pass / 0 fail**.
- **E9** — 2026-11-24, the schema projections: `bun run --cwd packages/agentic-workflow-schema check:pre-execution-schemas` · exit 0 · `pre-execution schemas are generated and drift-free (2 files)`; `bun test scripts/pre-execution-quality.test.mjs` · exit 0 · **2 pass / 0 fail** (the deleted-skill fixtures skip by design).
- **E10** — 2026-11-24, `bun scripts/run-root-suite.mjs --jobs 4` · exit 0 · **145/145 PASS**, including `repair-receipt` (11/0), `audit-pr-receipt` (36/0), `review-receipt` (32/0), `scope-manifest` (9/0), `vocabulary-parity` (37/0), `check-skill-context`, `cli-coverage`, `red-first` and `test-obligation-tags`.
- **E11** — 2026-11-24, `bun run --cwd packages/agentic-workflow test` · exit 0 · **84/84 suites PASS**; `bun run --cwd packages/agentic-workflow-schema test` · exit 0 · **953 pass / 0 fail**.
- **E12** — 2026-11-24, the state surfaces: `bun scripts/check-skill-context.mjs` · `PASS context budgets: 33 skills`; `--routes` · `PASS route budgets: 14 routes`; `bun scripts/skill-lint.mjs` · `0 finding(s) · verdict: PASS`; `bun scripts/lint-changeset.mjs` · `ok .changeset/698-ceremony-rule-never-blocks.md`; `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap read docs/ROADMAP.md --nn 698` · the `in-progress · unit …` row; `journal aggregate --check` · `{"ok":true,"checked":59,"refusals":[]}`.
- **G1** — 2026-11-24, HEAD `709452055`, `bun scripts/local-gate.mjs --jobs 4` · exit 0 · **`local-gate: PASS — 20 step(s) in 482s`** — root-suite 145/145, crate-suite bun+node, pi-node-compat 1079/1 skipped, schema, docs-generated-projection, version-parity-content, skill-context-budgets, journal-carrier-check, log-immutability, secret-scan, worktree-guard and red-first.
- **P1** — 2026-11-24, unit doc + the two standalone ledgers + decisions + known-issues; the roadmap row moved through `roadmap rowUpsert` (which also spliced the duplicate) · `71421c3bf`.
- **P2** — 2026-11-24, the `repair-receipt` suite alone, observed red (E1) · `a6847fe57`.
- **P3** — 2026-11-24, the `workflow` class, its four mirrors and the writer's report-only refusal (E2) · `0edb8363d`.
- **P5** — 2026-11-24, the ceremony-bookkeeping class and the stale gate verdict (E4) · `aeeb9413b`.
- **P4** — 2026-11-24, the repair-receipt runtime, its command, help and README rows (E3) · `8b36fdb73`.
- **P6** — 2026-11-24, audit-pr currency + the BLOCKED receipt, review-receipt repair currency + the non-pass families (E5) · `1d1ad5ed6`.
- **P7** — 2026-11-24, the skills: the fold's emission command and order, audit-pr's currency and both-verdict receipt, review-change's non-pass receipt, the advisory (E12) · `725356c18`.
- **P8** — 2026-11-24, the changeset, the emitted projection, the budget re-pins, the command registration and the dispatch/case re-cuts (D14) · `709452055`.
- **P8a** — 2026-11-24, the ledger closure and this Log (docs-only over the gated bytes; `docs-generate --check` re-run green) · this commit.
- **D14** — 2026-11-24, three closed-set re-cuts, each named rather than silent: `runner.dispatch.test.mjs`'s command list gains `repair-receipt`; `ceremony-findings-ledger.test.mjs`'s `--class c` placeholder becomes the published `source` (the writer now validates the class cell; the assertion is unchanged); `workflow-tools.test.mjs`'s BLOCKED action moves `none → post` because S7 makes a BLOCKED verdict receipt-bearing. No assertion was weakened or deleted (`IR3`), and the suites' intent is intact.

## Next

`→ Next: /aw-local-review` on the handed-off diff (S1's workflow: the operator is
the external verifier; no review pack runs on this change).

## References

- Issue [#698](https://github.com/gtrabanco/agentic-workflow/issues/698) — the
  normative rule and its field data (fix-101 PR #335, fix-334 PR #336).
- #170 (REPAIR-RECEIPT in prose, no consumer), #301/#260 (the closed-as-covered
  hole), #307 (execute-phase's repair path), #409 (the gate receipt's content
  manifest), #669 (the cycle caps), #701, #702, #703, #704 (the sibling units
  this unit cites in `## Non-goals`).
- `skills/pre-execution-review/references/LEDGERS.md` — the ledger shapes.
- `docs/features/30-repair-receipt-delta-review/` — the prose the marker makes
  machine-consumable.

## Branch

`feat/698-ceremony-rule-a-ceremony-shaped-finding-never-bl` (the worktree branch
this unit is applied on; the unit slug follows the roadmap row's topic cell).

## Depends on

Empty — independent. Related, no blocker: #701 (the write-time checker), #702
(the writer), #703 (the report vehicle), #669 (the caps), #704 (prose
conditions).

## Regression scope

| scenario | check |
|---|---|
| a current review receipt still makes MERGE-READY when every gate passes | `bun test scripts/audit-pr-receipt.test.mjs` exits 0 |
| the pass marker's bytes and `emit` behaviour are unchanged | `bun test scripts/review-receipt.test.mjs` exits 0 |
| the gate receipt's freshness rule and the scope digest are unchanged | `bun test scripts/gate-receipt.test.mjs` and `bun test scripts/scope-manifest.test.mjs` exit 0 |
| the findings writer's existing row shapes, prose preservation and ids still hold | `bun test packages/agentic-workflow/test/runner.ceremony-findings.test.mjs` exits 0 |
| the published class set still resolves in every mirror | `bun test scripts/vocabulary-parity.test.mjs` and `bun test scripts/vocabulary-probe.test.mjs` exit 0 |
| the CLI surface (help, usage, README, dispatch) still names one set | `bun test packages/agentic-workflow/test/cli.surface.test.mjs` exits 0 |
| the pre-execution schema projections still reproduce from the consts | `bun test scripts/pre-execution-quality.test.mjs` exits 0 |
