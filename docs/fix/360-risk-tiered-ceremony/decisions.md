# Decisions — fix/360-risk-tiered-ceremony

Owner decisions taken during the pre-implementation review of this unit. Each
one is quoted with its authority: the owner's own words.

## D360-1 — The unit is split in three, each with its own SPEC and PR

> "Partir la unidad en 3"

This unit keeps the classifier and the tier's machine surface (`360a`). Two child
units carry the rest, because neither can be written without its own frozen
failure corpus first (the rule this workflow applies to every new mechanic):

- `360b` — **S9, the measured acceptance**: the instrument that collects tokens
  and wall-clock per unit per tier and compares before/after over ≥3 real units.
- `360c` — **D2 option 1 (capability analysis)** plus **m1 option b** (the
  ceremony CLI writing the passive carrier).

**S9 remains a hard delivery requirement of #360** (owner: "S9 es requisito de
entrega"): `360a` is not #360 closed, it is #360's first third. The issue stays
open until `360b` lands.

## D360-2 — One source of truth: `detail.risk_tier` + `detail.size_tier`; `next` untouched

The size and the risk of a unit are properties **of the unit**, not of the next
action. `next.tier` keeps its own, different meaning — the model budget for the
next command, read off the fixed command→tier map (`ENVELOPE_CORE.md` §next.tier).
Duplicating either fact into `next` would create two sources of truth for one
value, and the schema could no longer say which wins.

Rejected: `next.tier_size` / `next.tier_risk` alongside `detail.*` (two copies of
each fact); renaming `next.tier` → `next.model_tier` (a breaking envelope change
with no consumer asking for it).

Naming follows the repo's own convention, `<qualifier>_<class>` — `suggested_tier`
(102 uses), `budget_tier` (36), `risk_tier`, `task_size` — so the new field is
`size_tier`, never `tier_size`.

## D360-3 — D2 option 1 (capability analysis) is deferred to `360c`

The owner's preferred shape is analysing what a file *can do* (its imports and
its effects) rather than matching a list of operation names. It is right, and it
is not this unit's work: it needs one mini-analyser per language family in the
repo (`mjs`, `ts`, `sh`, `py`) and its own frozen corpus before it exists.

Until it lands, the classifier keeps the content list **and** fails closed: a
change it cannot prove inert never reaches `passive`.

## D360-4 — m2 option b: the reference is cited, not loaded on every route

`skills/execute-phase/references/risk-tiers.md` is linked from `SKILL.md` by path
but is **not** in every execute route's read set, because loading it on all eight
routes re-bases eight ceilings for one sentence.

## D360-5 — m1 option b: the passive carrier's writer is the ceremony CLI

`docs/passive/<id>.md` stays as the carrier (one file per passive unit, no shared
file to conflict on), and its **only writer is the ceremony CLI** — never `echo`,
`sed -i` or a hand edit. The subcommand ships in `360c`; until it exists this unit
declares the carrier's grammar without claiming a writer, so no passive unit is
produced by a hand-written file.
