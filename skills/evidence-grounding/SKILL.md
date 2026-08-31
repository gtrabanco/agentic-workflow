---
name: evidence-grounding
user-invocable: false
version: 1.1.1
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Internal shared owner of evidence-grounded authoring: the fixed
  claim/authority/evidence/freshness/unknown row, the ordered
  inventory-evidence-draft-readiness passes, `artifactRevisionId` rotation, and
  the no-progress rule. Consumed by `design-feature`, `plan-feature`,
  `plan-feature-scaffold` and `plan-fix`. Never reviews or approves. Not a menu
  entry.
---

# Evidence Grounding (internal)

One shared owner of the evidence discipline that every authoring skill uses
before it asks for an independent review. It prepares and checks; **it never
reviews and can never emit a review PASS**.

## When to use

- `design-feature` — while writing or upserting a Product half.
- `plan-feature` / `plan-feature-scaffold` — while filling the Engineering half
  and cutting phases.
- `plan-fix` — while drafting a fix SPEC and its phases.
- Nothing else. A reviewer does not load this skill: its readiness verdicts are
  authoring-quality gates, not review verdicts. The shared review cycle and the
  planning-ledger shapes belong to `pre-execution-review`; the plan-stage row of
  the evidence table is restated here only as a pointer.

## Hard rule — authority boundary

This skill may emit only these two vocabularies, and only at the step that owns
them:

| Emitted by | Closed outcomes |
|---|---|
| a grounding pass (§Ordered passes, step 2) | `CONTEXT-PREPARED \| NEEDS-EVIDENCE \| NEEDS-DESIGN` |
| a readiness preflight (§Ordered passes, step 5) | `READY-FOR-REVIEW \| NEEDS-EVIDENCE \| NEEDS-DESIGN \| NEEDS-REPLAN` |

`SPEC-REVIEW-PASS`, `PLAN-REVIEW-PASS` and any `*_REVIEW-PASS` string are
**forbidden outputs here** — they belong to `review-spec` / `review-plan`
running in a context that did not author the artifact. A same-context readiness
`READY-FOR-REVIEW` is a statement that the artifact is *shaped* for review; it
is not approval and must never be recorded, quoted, or summarized as approval.

## The fixed evidence row

Every material claim or obligation produces exactly one row, in this column
order (verbatim names, no extra or renamed columns):

```text
claim-or-obligation | authority-kind | source-and-location | observed-revision |
freshness | status: proven|decision|unknown | owner-or-next-evidence
```

Load [references/ROWS.md](references/ROWS.md) for the closed `authority-kind`
and `freshness` vocabularies, the bounded question set, the `unknown` ownership
rule, and where each stage's compact table is frozen. Rows the author cannot
fill are `status: unknown` with a named owner — an unknown is never replaced by
a plausible rationale.

## Ordered passes

Authoring is progressive. Never jump from discovery to a polished artifact.

1. **Inventory** — list every normative obligation, affected role or use case,
   failure state, compatibility boundary, recorded decision, and material
   unknown. One line each; nothing may be added later without re-entering step
   2.
2. **Evidence** — load [references/ROWS.md](references/ROWS.md), acquire a row
   per material claim, and return `CONTEXT-PREPARED | NEEDS-EVIDENCE |
   NEEDS-DESIGN`. Follow references and topology as far as the claim requires —
   the cap is the claim, not a file count.
3. **Draft** — write the artifact from the frozen rows only. Product conclusions
   go to the SPEC Product half / `decisions.md`; engineering conclusions go to
   `planning-evidence.md` (M/L) or the SPEC's `### Planning evidence` (XS/S).
4. **Cut** — for engineering authoring only, cut phases after the affected
   surfaces, validators, and unknown ownership are evidenced, and lint every
   phase with `phase-contract`.
5. **Readiness** — load [references/READINESS.md](references/READINESS.md), run
   the deterministic preflight for the stage, and stop on any non-`READY-FOR-REVIEW`
   outcome.

## Revision handoff

Every authoring write of a governed artifact rotates `artifactRevisionId`:

- the id is opaque, bounded, authoring-owned, and never derived from content;
- one write = one new id for the whole artifact set it touched;
- **a revert to previously published bytes is a new write** and gets a new id —
  that is what stops an old PASS from reviving after mutate-and-revert;
- the same id may be reused by several reviews of unchanged bytes, never across
  a write;
- the author carries the current id into the handoff so the reviewer binds it
  into the snapshot it reviews.

Runtimes persist and rotate the id; a manual authoring workflow carries it
forward by hand. A direct out-of-band edit that bypasses every authoring event
is detectable only when that rotation happens — state this boundary, never
overclaim it.

## No-progress rule

A repeated read must answer a **new named question** or expose **new evidence**.
Otherwise it is no-progress (the review-cycle form of this rule is owned by
`pre-execution-review/references/POLICY.md` §4): stop, record the missing evidence and its owner as
an `unknown` row, and return `NEEDS-EVIDENCE`. Re-running the same search, the
same file, or the same argument with the same result is prohibited — it is not
diligence, it is a stalled pass, and the readiness preflight will refuse the
artifact anyway.

## Guardrails

- Never invent product intent, scope, roles, authority, or user outcomes to fill
  a row — that is `NEEDS-DESIGN` and belongs to the human.
- Never read or quote conversation history as evidence; `source-and-location`
  names a repository path, an issue/PR, a frozen ledger row, or an explicit
  user decision. Absent evidence is `unknown`, never a memory.
- Never emit, imply, or paraphrase a review verdict; see *Hard rule* above.
- Never widen an artifact beyond the frozen obligations found in step 1; new
  obligations discovered later re-enter at step 1 with a dated note.
- Never mutate an artifact another skill owns: this skill prepares `design-
  feature` and planning artifacts, it does not review them.
- No automatic forge writes. No issue creation, ever — an unfilled row stays a
  row with an owner.
- Consume frozen facts from `docs/workflow/REPOSITORY_STATE.md` when present;
  inspect directly only for an absent fact, and route contradictions to
  `resolve-repository-state`.

## Relationship to other skills

- `design-feature`, `plan-feature`, `plan-feature-scaffold`, and `plan-fix`
  compose this skill in-turn (it has no independent tier of its own: it runs at
  the caller's tier, and every caller already plans at the highest tier in the
  fleet, so no caller can under-power it).
- `review-spec` and `plan-feature` read the *frozen* rows through the artifact,
  never through this skill: readiness is the author's gate, review is the
  independent one.
- `phase-contract` owns the phase-lint rules step 4 points at; this skill never
  restates them.
- `verification-contract` owns the frozen finish line; readiness checks that the
  manifest exists and is bound, it never edits or narrows it.

## Done when

- Every material claim in the drafted artifact has one row, and every
  `unknown` row names an owner and the next evidence step.
- The stage's readiness preflight ran and returned `READY-FOR-REVIEW`, or the
  turn ended with the exact blocking outcome and no artifact was handed to a
  reviewer.
- The handoff carries the current `artifactRevisionId` for the written set.
