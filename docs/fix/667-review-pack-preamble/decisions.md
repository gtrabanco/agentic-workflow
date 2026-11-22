# 667 — review-pack preamble extraction · decisions

Decisions taken at the cut (2026-11-22), each with its scope: `unit-only` stays in
this unit, `cross-unit` lands in a permanent owner doc (issue #650). Every
decision cites the requirement it serves.

## D1 — The owner is the existing finder contract, never a new file

`scope: unit-only` · serves S2.

`skills/review-implementation/references/FINDER_CONTRACT.md` already declares
itself the single owner of `## Scope` and `## Materiality bar`; a second "shared
preamble" file would fork a contract that already names its owner (IR11). The
contract is extended, its title widened to the whole preamble, and the passes
keep citing one path.

## D2 — The checklist discipline stays inline in every pass, citing the owner

`scope: unit-only` · serves S3, AC2, O5.

The 2026-11-21 probe's only production-model fabricated tally happened in the cell
where the always-on protocol travelled **as a pointer the model never
dereferenced**; with the same content physically in context, none occurred. The
materiality bar, a negative instruction, held as a pointer 30/30. So: the bar and
the scope contract travel as pointers, the every-item protocol and its tally do
not. Each pass binds them into its own output shape and cites
`§Checklist discipline` as the rule's owner — the owner states the contract, the
pass binds it (IR11's pattern), never a second owner.

## D3 — The inline protocol lives under the checklist heading; `Done when` is untouched

`scope: unit-only` · serves S3(c), O6.

S3(c) names the axis checklist, `Return exactly` and `Done when` as untouched, so
the inline protocol cannot replace `Done when`'s first bullet even though that
bullet restates the every-item rule. The protocol lands as the checklist
section's opening paragraph: `evaluated` equals this list's item count, every item
carries evidence or an `n/a` with its reason, and `pass + findings + n/a` equals
it. That keeps the three frozen regions byte-identical (O6) and returns the metric
to the block the probe evaluates (the tally line) instead of to a closing
checklist nobody scores.

The heading loses its discipline parenthetical (`## Checklist (evaluate EVERY
item — none is optional; n/a must be stated)` → `## Checklist`): with the protocol
inline beneath it, the parenthetical was the ninth copy of the same sentence.

## D4 — The four header variants, and what each keeps per file

`scope: unit-only` · serves S3, O9.

| variant | passes | keeps per file |
|---|---|---|
| plain | a11y, brand, design, perf, security, seo | the identity line, the two pointers, the inline protocol, the axis checklist, `Return exactly`, `Done when` |
| `review-code` | code | the plain shape **plus** the ask-don't-infer sentence and its `ask-dont-infer@1` owner pointer |
| `review-verify` | verify | the plain shape **plus** the blockquote `RUNNER.md` pointer (it owns the launcher's order and pin) and the S5 discoverer→auditor paragraph (it is this pass's own cost-scaling rule) |
| transform | debt | the identity line, the transform-scope pointer, the transform protocol, the `## Transform` items, `Return exactly`, `Done when` — **no materiality section**: it transforms a table instead of padding a checklist |

None of the survivors moves to the owner: `review-verify`'s RUNNER pointer is a
launcher contract that the pass must read before its first command, and the S5
paragraph is a rule about *this* pass's role, not a rule the pack shares.

## D5 — The identity and the findings-only guardrail are owned; the two imperatives stay

`scope: unit-only` · serves S2, S3, O10.

The composition clause ("Composed by `review-change` / `product-audit` within
their conversation") is the composers' contract, so it moves to `§Pass identity`.
Each pass keeps the two things it must never have to dereference — *follow this
file inline as the routed step* and *findings only, never edits, never refactors*
— in one line that names the owner. Deleting the guardrail entirely was rejected:
it is the pass's own output discipline, and the probe's pointer-only cell is
evidence that an always-on negative instruction is not worth the risk even where
the 2026-11-21 bar held.

## D6 — One declared route re-basis, no new gate, no grammar block

`scope: unit-only` · serves S5, O14, O15, O18.

The nine passes ride the flat defaults (2 800 est / 240 lines) and stay under it,
and `FINDER_CONTRACT.md` rides the reference default (2 200 est) at 867. But the
four `review-change:*` **route** ceilings do bind: every review-change route loads
`review-implementation`'s references — this file among them — plus `review-debt`,
so the owner's growth moved all four (25 323 est / 1 739 lines at the head,
against ceilings of 27 119 / 1 863). `check-skill-context.mjs --routes` caught it
on the first run, so the four rows are re-based to exactly
`ceil(measured x 1.10)` — 27 856 / 1 913 for `adversarial`, 24 314 / 1 688 for the
two defaults, 25 067 / 1 726 for `synthesize` — each carrying a `sources` row that
names the growth source, the same arithmetic every previous re-basis used. A
re-pin without a bound ceiling would be a faked receipt; a bound ceiling left
un-re-pinned would be a hidden cost. No versioned grammar block lands — the new contract text is prose,
and `review-loop-discipline` (the reader that already pins the bar) keeps reading
it — so `normative-drift` and `AGENTS.md`'s `normative-surfaces@1` are untouched.

The cost form is declared instead of hidden: the owner adds bytes read once per
spawned pass when a reviewer dereferences the pointer, and
`check-skill-context.mjs` cannot see a cross-skill read (it measures a skill's own
`references/` only). That is recorded in the unit doc's `## Future cost`, not
absorbed into a ceiling.

## D7 — The probe cells measure this tree, and the comparison keys on the failure

`scope: unit-only` · serves S4, O13.

The issue's simulated harness hand-rewrote the pass file and injected a simulated
preamble plus the contract. After P2 the real bytes exist, so P3 measures them:
the delivered `review-code/SKILL.md` with the real `FINDER_CONTRACT.md` spliced
before `## Checklist` (`B+`), and the same file with no splice (`B−`, the
citation-only failure the design must preclude). `probe/CELLS.md` records the two
deviations rather than smoothing them over.

The P1 control is not the clean comparator the issue's recorded baseline
suggested: at this head 1 of 3 control runs fabricated a tally (`20 evaluated`
against 19 items) and another under-reported its `n/a` bucket. So `degrades` is
decided by **fabrication**, a **decoy row**, or **recall below the control's mean
minus 1** — not by absolute tally coherence, which the control itself does not
hold. A post-change run that merely matches the control's incoherence is `neutral`
at best.

## D8 — The materiality pin survives unchanged, and that is the stronger receipt

`scope: unit-only` · serves O12, PE-009.

`scripts/review-loop-discipline.test.mjs` block 5 asserts, inside each finder,
`## Materiality bar`, `cite the rule it violates` and `never pad the table`. The
plan anticipated moving that pin to the owner. It did not have to move: the
pointer keeps the two operative phrases as the pass's own binding ("cite the rule
it violates beside the evidence; never pad the table") while the bar's *rule set*
(what is not a finding) exists only at the owner. The test is therefore
**byte-unchanged**, which is a stronger statement than a moved pin: this change
did not weaken a gate to pass. Recorded because the plan said otherwise and the
difference is the point.

## D9 — The new suite's obligation and its justification

`scope: unit-only` · serves O1–O11.

`scripts/review-pack-preamble.test.mjs` declares
`obligations=contract,failure-path,convention` and protects the owner plus two of
the passes whose variants carry the risk (`review-code`, `review-verify`). Its
justification line: it guards the observable contract that a pass's own brief
still contains the discipline its tally is judged against — the pointer-only
failure path — plus the invariant that an extraction never edits the axis content
it is only supposed to move around. It does not restate the implementation: the
hashes it compares are the pre-change regions of nine reviewed files, not the new
prose it is looking for.

## D10 — The floor model's tally incoherence is an observation, not a repair

`scope: unit-only` · recorded in the unit doc's `## Future`.

The probe shows the floor model asserting tallies it cannot count (1/3 coherent in
the control). A unit could make the tally machine-derivable from the pass's own
`n/a` markers, but that changes the output contract all nine passes share — out of
this unit's scope, and the owner's case to schedule.

## Path protection

The suite this unit lands is a protected path. Its one post-red amendment narrows
an over-broad assertion the transform variant cannot satisfy — `review-debt` has no
`## Checklist` to read before, so the scope imperative it must honour is "before the
transform" — while the obligation (a fail-closed imperative scope pointer in every
pass) is unchanged and still asserted.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/review-pack-preamble.test.mjs | P4 | 2026-11-22 | execute-phase | the transform pass has no checklist, so its scope imperative is the transform; the assertion is narrowed to the requirement, never dropped
```
