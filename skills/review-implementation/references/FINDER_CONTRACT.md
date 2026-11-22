# Finder contract — the internal review pack's shared preamble

Single owner of the whole shared preamble every internal review-pack pass
carries. The nine passes — `review-code`, `review-security`, `review-verify`,
`review-design`, `review-a11y`, `review-brand`, `review-perf`, `review-seo` and
the `review-debt` transform — cite this file instead of copying it. Their axis
checklists, their `Return exactly` block and their `Done when` body stay in each
pass's own SKILL.md: this file owns the preamble, never the axis.

## Pass identity

`review-change` and `product-audit` compose these passes within their own
conversation. Each pass file is the routed step and the isolated reviewer's whole
brief: it is followed inline, it emits findings only, and it never edits,
refactors or fixes anything it reviews. A pass that cannot read this file stops
and says so — it never reconstructs the contract from memory.

## Scope

The diff or path/glob the caller passes; default the current change vs the
default branch. State the scope at the top of the returned table. The
`review-debt` transform's scope is the transform discipline's, never the diff's.

## Checklist discipline

Evaluate EVERY checklist item — none is optional. Every item is evaluated with evidence (file:line or command output), or marked `n/a` with the reason it does not apply.

The tally line is a contract, not a courtesy: the `evaluated` count equals the
number of items the pass's own checklist lists, and `pass + findings + n/a`
equals it. A count above the item count is fabricated and fails the pass by
itself; a silently skipped item fails it too.

**Why this stays inline in every pass instead of travelling by reference.** The
2026-11-21 probe (issue #667) put the same content in front of the floor model in
four compositions: the one fabricated tally it produced (`28 evaluated` of 19
items) happened in the cell that carried this protocol **only** as a pointer the
model never dereferenced, and no fabrication occurred in the cells where the
content was physically present. Anti-padding bars are negative instructions and
held as pointers in every run; this protocol is evaluated in the pass's own
output on every run and does not. So each pass states it, cites this section as
the rule's owner, and binds it into its own output shape.

## Transform discipline (`review-debt`)

`review-debt` transforms a table instead of checking a diff, and it is scoped by
what it is handed: the caller's **synthesized findings table** — the fused,
classified decision table. It never rescans the diff: debt-shaped findings are
already in the table, and every ownership decision already happened in the finder
axes. It states the scope — the change the table was synthesized over — at the
top of the returned table.

Its transform rules are the pass's own (`skills/review-debt/SKILL.md`
§Transform): this file owns the scope contract above and the checklist discipline
every pass shares, and adds nothing to the transform's rows.

## Materiality bar

Report a row only when a competent user's outcome changes or a rule the project
explicitly declares is violated — cite the rule it violates beside the evidence.
Not findings: comment/punctuation typos, formatting-only drift, style preference
with no cited rule, hypothetical robustness beyond the SPEC's named scenarios.
An empty table with `Decision: PASS` is the expected result for a well-formed
change — never pad the table.
