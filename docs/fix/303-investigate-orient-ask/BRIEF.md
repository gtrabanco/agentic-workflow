# Brief — unit 303 (investigate-orient-ask)

A reviewer's two-minute restatement of what this unit changed and why, written from
`decisions.md` so no reviewer has to re-derive the step's questions.

## What the change is

The lane's design and plan steps used to state what the step must **not** do. Both now
state the four stages it **must** run — `investigate → orient → ask → decide` — with a
fixed output contract per stage.

## The four stages, in one line each

| stage | what it forces | where the result lives |
|---|---|---|
| investigate | a provenance search **before** any claim; every claim journaled | `sources.md` (`id \| claim \| source \| certainty`) |
| orient | tiers 0 provenance → 1 research → 2 ask, then cost of being wrong | the same file's rows |
| ask | one batched form-turn over the tier-2 backlog only | `decisions.md`'s `open-questions@1` block |
| decide | the owner's answer, or "Decide for me" + reason | the same block's `decision` rows |

## What a reviewer can check, mechanically

- `node --test scripts/knowledge-honesty-contract.test.mjs` — nine cases: the ordered
  stages, the citation checklist box, the questions pane in both contracts, and that the
  ledger rows the references publish parse with the real reader.
- `grep -n "^## Stage" skills/unit-lane/references/{DESIGN,PLAN}.md` — eight headings,
  four per step, in order.
- `node scripts/needs-input.mjs docs/fix/303-investigate-orient-ask` — exit 0, zero
  pending questions.

## What this unit deliberately does not do

- No dispatcher change (`scripts/needs-input.mjs` is untouched; discovery D1 is recorded
  for the owner).
- No execution-topology change and no skill re-creation (issue §Out of scope).
- No change to `review-change` / `audit-pr`.
