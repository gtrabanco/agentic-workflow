## Implementation guidance (single-pass & per-phase)

**Tests first where they pay.** For core/domain and orchestration phases, write
the phase's acceptance/integration tests first (red), then implement to green —
the SPEC's dev scenarios are the test list, so its failure modes get exercised,
not just documented. UI and adapter glue may test after implementation.

Map each change to the project's layers per its architecture doc; build inner layers first, outer last:

1. **Persistence/schema** (if any) — update where defined, generate migrations with the project's tooling, never hand-edit generated output.
2. **Core/domain** — no outer-layer imports; use the project's value objects/rules.
3. **Orchestration/use-case** — inject dependencies, idempotent if re-callable, typed errors.
4. **Adapters** — implement the project's ports; never leak raw external errors inward.
5. **Controller/endpoint** — map errors to responses; webhooks: verify signature, enqueue, return fast.
6. **UI** (if any) — follow the design-system/i18n/accessibility docs; no hardcoded strings.
7. **Tests** — whatever wasn't written first (see above): light mocks of the project's interfaces; test orchestration, not adapters.

## Completion checklist (single-pass)

Write `docs/features/<NN>-<slug>/CHECKLIST.md`: schema migration applied (if any) · core layer has no outer imports · orchestration idempotent + typed errors · adapters implement ports · tests pass · type-check/lint green · UI strings localized (if UI) · domain value-object rules respected · user-facing limitations disclosed · new deps pinned. Note any decisions not captured in the SPEC.

## Review checkpoint & finishing a unit

**`review-change` is mandatory — every unit gets a final review before merge, no
exceptions.** It runs in its own turn (hand-off, not composed): a skill's model and
effort are fixed at turn start, so invoking `review-change` from here would run it at
execute-phase's `sonnet`/`medium` rather than its own `opus`/`high` — under-powering
the review. So **suggest** it; don't compose it. (General rule: across a model/effort
boundary, hand off; don't compose.) On agents without per-skill model config the same
rule holds by hand: run the review as a **separate, fresh invocation** on your
strongest model — never inline in the implementation run.

**Cadence.** Feature mode: after each completed phase, the closing block
**recommends** the hand-off whenever a *Review checkpoint trigger* fires
(layer boundary, accumulation, or sensitivity — see above), naming which one —
a suggestion the user may skip to keep executing phases; the skill never
blocks on an intermediate review. What is **never optional** is the end: every
unit gets one `review-change` pass before merge (single-pass and `--fix`
included — they have no intermediate phases, so the end review is their only
one).

**Finishing a unit (single-pass, `--fix`, or a feature's final phase): the last step
is always an open PR.** Mark the unit `done`, commit the flip, push, and `gh pr create`
(see the mode steps above) — regardless of the review/audit still to come. Then hand
off to `/review-change` (mandatory), which feeds `audit-pr` (the merge gate).

**Adversarial pass at that mandatory end review.** `review-change` evaluates its
own recommendation checklist there (`L`/sensitive change, reviewer not the
fleet's strongest or weaker than the author, or a single model family on a
`≥M` change) and — only when a box fires — recommends `--adversarial N`
(N=2 default, N=3 on a security/auth surface or a single-family fleet) instead
of its default single-reviewer pass. This is evaluated once, at that mandatory
end review; it does not change the trigger-based checkpoint cadence above.

Checkpoint hand-off (print it — every invocation ends by suggesting the next
step; when a trigger fires, the review is the recommendation, continuing is a
listed alternative — the user picks):

```
Phase <N> done and committed. Review checkpoint (recommended) — <trigger name> fired: <one-line reason>.
→ Next: /review-change — it reviews the branch at its own model/effort
  · skip the checkpoint → /execute-phase <NN> <next phase> (the mandatory end review still covers everything)
  · findings (if you review) → fold fix-now into the branch; non-fix-now → /triage-issue; then re-review
```

`<trigger name>` is one of `layer boundary`, `accumulation`, or `sensitivity`
(see *Review checkpoint triggers*); `<one-line reason>` cites the evidence
(e.g. "next phase declares `api`, this one was `domain`", "612 lines / 11
files since `a1b2c3d`", "phase touched auth middleware"). No trigger fired?
Omit the checkpoint line entirely and go straight to naming the next phase.
