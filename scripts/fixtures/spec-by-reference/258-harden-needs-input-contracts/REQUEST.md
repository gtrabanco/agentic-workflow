# The original request — `fix/258-harden-needs-input-contracts`, verbatim

Captured before the conversion so the fixture corpus can be checked against
what the owner actually asked for: every `S#` in the converted `SPEC.md` quotes
one of these strings, and `L1` of its `## Log` restates the head of this file.

Source: `docs/fix/258-harden-needs-input-contracts/SPEC.md` as committed at the
unit's final head (`## Objective`, `## Why`, `## User outcome`, and the
`## Amendments` 2026-10-19 owner quotations). The unit's forge issue #258 is the
request's origin; the committed document is its record in this repository.

---

## `## Issue`, verbatim

```
`#258` — tracked issue in the project's forge. The PR must close it via
`Closes #258` in the body.
```

## `## Objective`, verbatim

```
Three surviving skills that interrupt the user for input (`execute-phase`,
`unit-lane`, `init-workspace`) continue past a blank required answer by
inferring defaults. Each gains an explicit needs-input contract (re-cut
2026-10-19, see Amendments): a required-input gap runs the three-tier
resolution — repo provenance with a recorded search receipt → bounded research
returning 2–3 options → emit the dispatcher's `open-questions@1` block and
stop. Optional input may default; ambiguous input is a question for the owning
stage, never for the user. Same defect class as `review-change`'s `29b52c63`
fix.
```

## `## Why`, verbatim

```
A skill asks via `ask_user` (or the agent's question mechanism), the user
leaves the answer blank, and the skill proceeds on an inferred assumption.
No downstream gate catches it, so planning, execution and review all run on
a silent assumption. Feature 61 retired `plan-feature-scaffold` and
`plan-fix` (absorbed into `unit-lane`), so the issue's original five-skill
table reduces to the three surviving skills above.
```

## `## User outcome`, verbatim

```
When a required answer is blank, the skill visibly stops with the
`open-questions@1` block the needs-input dispatcher prints — the questions,
their search receipts, their options and the route back to the owning stage —
instead of inventing scope, targets or consent. The user always knows when the
workflow is waiting on them.
```

## `## Amendments` — 2026-10-19, the owner's words, verbatim

```
**«en vez de recortar AC1-AC3 … hay que ampliar el scope de este fix para
   arreglarlo y que funcione como se pretende»** — the scope is widened, not
   narrowed: the guard becomes a deterministic producer (state + dispatcher
   + versioned block), because a prose contract cannot be regressed against
   (verified by mutation in cycle 10: deleting the whole `Needs-input guard`
   leaves the gate green).
```

```
2. **The halt carries the open questions, and "research more" is an
   answer** — three-tier resolution in order, never skipped: (0) provenance
   — search the repository's own docs first and record *where*; (1) research
   — external gaps are researched and returned as 2–3 concrete options with
   trade-offs; (2) emit-and-stop — the step stops with the open questions
   written out. Only a user decision closes an open question; a request for
   more research or discussion is a legitimate answer that re-enters tier
   0/1. Execution never interviews.
```

## `## Amendments` — 2026-10-20, the re-cut, verbatim

```
The widening above re-cut AC1–AC3 but left three sections describing the
pre-widening shape, and left a length descriptor nobody shipped. Re-cut here,
no acceptance criterion changed:
```

```
- **AC1 and P10 no longer promise a "3–5 line pointer".** The shipped shape is
  one named-policy section per skill (`## Inputs — artifacts, never questions`,
  `## Inputs — never inferred, never defaulted`, `## Consent — mandatory,
  never defaulted`), each carrying the three-tier ladder and the dispatcher
  pointer. Measured at this head: 19 / 20 / 15 lines.
```

## The owner's fold-scope directive (2026-10-20), verbatim

```
1. **The fix covers the change and everything that depends on it** — callers of
   what a piece receives, consumers of what it delivers, and a check before
   removing anything still in use. A surviving mention of what changed (a
   comment, a prose claim, a declared validator, a manifest narration) is part
   of the same fold. `skills/fold-findings/SKILL.md` 1.9.0 carries this rule in
   place of the minimum-scope guardrail ("do not widen beyond a finding's
   file/line/axis").
```
