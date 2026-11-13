# Decisions — fix/438-residual-classify

Decision log for the post-freeze correction batch on the 2026-11-13
`EXTERNAL VERIFY` receipt ([external-verify.md](external-verify.md)). The unit's
frozen decisions live in the unit doc's `## Log`; this file carries the
path-protection records the protected-suite edits require and the decisions
behind them. Append-only — records grammar owned by
[`skills/orchestration-envelope/references/TURN_CONTRACT.md`](../../../skills/orchestration-envelope/references/TURN_CONTRACT.md).

## Decision log

| ID | Decision | Alternatives considered | Rationale |
|---|---|---|---|
| D-438-1 | Fold the receipt's four blockers (B1–B4) as one correction batch, with the fixable advisories (A1–A4) riding the same slices, per the owner's instruction 2026-11-13: "triage and fix those that deserve to fix … start the loop again until you fixed full symbol/related stuff" | Fix only B1 (the executable defect) and leave the doc-surface blockers recorded (rejected: the receipt's B3/B4 are exactly the F51/F3 class the receipt names — one surface corrected while a sibling kept the superseded order); defer advisories to a later unit (rejected: the owner asked for triage *and* fix) | One batch, one recheck: every blocker has a reproducer in the receipt that the batch must turn green |
| D-438-2 | Land the corpus and the pins in this unit's own suite (`scripts/residual-classify.test.mjs`), with the plan-step pin in `scripts/residue-dimensions.test.mjs` — the file that owns PLAN.md's rules | Put every pin in the unit's suite, leaving `residue-dimensions` untouched (rejected when the owner chose "approve both suites": the ownership rule — a rule name lives with its owner — puts PLAN.md's retirement machinery under `residue-dimensions.test.mjs`'s existing regression pin) | Post-freeze protected-suite edits need the owner's recorded approval either way (D-438-3); the placement keeps each pin with the surface it judges |
| D-438-3 | Record the owner's approval for the two post-freeze protected-suite edits, and **do not** push with `--no-verify` | Bypass the pre-push gate so PR #522 goes green-shipped now (rejected by the owner: "No entiendo esta pregunta, por que quieres hacer push con \"no-verify\"?" — a bypass is not the answer he wants); rewrite or drop main's two `docs/LOGS.md` commits so the range clears (rejected: published history is owner-written, and the two commits are main's own) | The push range `a44c6c4a..HEAD` fails `log-immutability` on two main-side commits (`b012b31d`, `3cbc1237`, 2026-11-13), not on this branch's bytes; `--base origin/main` reports 0 violations over this branch's own range. The integration stays committed locally and the blocked push is handed to the owner |

## Path protection

The declaration the checkpoint gate reads
(`bun packages/agentic-workflow/bin/path-guard.mjs --unit docs/fix/438-residual-classify --phase P2`):

```text
path-protection-plan@1
freeze-after: P1
kind | path | justification
```

The unit doc and its ledgers froze at the cut (P1, `f70ab7c6`), so every
protected write after it is post-freeze. This correction batch creates no
protected file: both paths it edits already exist, so the declaration carries
no `created` rows.

## Path-protection escape records

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/residual-classify.test.mjs | P2 | 2026-11-13 | execute-phase | P2 is the unit's red-corpus phase and this suite is its own carrier. The edit adds the receipt's reproducers as new cases (a terminal feature row closes its unit — H3, P4; the fix lane's own control — H4; the templates teach the promise block — T3; inventory rows carry their consumer evidence sites; the four-state --receipt refusal — X2's coverage completed) plus the AC-S10 differential case F1. Every new assertion is added red-first and observed failing before the fixes; no existing assertion is relaxed, deleted or narrowed.
approval | scripts/residual-classify.test.mjs | P2 | 2026-11-13 | human-owner | Owner approval 2026-11-13 (correction-round question "Which approval do you record?"), verbatim answer: "Approve both suites" — the recorded owner order for the post-freeze edit of this protected suite.
justification | scripts/residue-dimensions.test.mjs | P2 | 2026-11-13 | execute-phase | P2 is the red-corpus phase. Blocker B3 of the receipt is a plan-step surface: PLAN.md still orders the superseded prose-only answer for a unit that declares no retirements, so its regression pin is extended with one new assertion naming the strictly-additive inventory answer; the existing prose pin stays untouched and green.
approval | scripts/residue-dimensions.test.mjs | P2 | 2026-11-13 | human-owner | Owner approval 2026-11-13 (correction-round question, option "approve-both" whose detail reads: "B3's PLAN.md pin goes in residue-dimensions.test.mjs — the file that owns PLAN.md's rules; everything else in the unit's own suite") — the recorded owner order for this protected edit too.
```
