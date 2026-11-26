---
"execute-phase": minor
"fold-findings": minor
"unit-lane": minor
"review-change": minor
"pre-execution-review": minor
"@gtrabanco/agentic-workflow": patch
"@gtrabanco/pi-agentic-workflow": patch
---

feat(gate-producer): the lane's gate runs are the receipt's runs (issue #728)

The gate receipt shipped consumers and no producer: `review-verify` and
`audit-pr` both blocked on a stale receipt and routed a re-run, and the four step
owners that do run a verification gate cited the producer zero times, so every
unit started stale by construction.

The lane now runs its gate **as** the producer. `execute-phase` (the step gate and
its gate-run marks), `fold-findings` (the group's gate and the `REPAIR-RECEIPT`
`Gate:` line), `unit-lane` (the close-out receipt stage) and `review-change` (the
review's own run) execute `runner gate-receipt run` instead of the bare gate, so
the run that goes green is the run a consumer reads, at the same cost.

Three things make that honest rather than cosmetic:

- **The ordering law.** A receipt's manifest signs 2,410 files in this checkout and
  `docs/**` is among them, so one later document edit stales it. The producer runs
  after the step's final document edit and before the commit that closes the step,
  and the `GATE-RAN` mark's reserved `manifest <sha>` slot carries the receipt's
  digest — the slot stops being a reservation nothing fills.
- **The declared precondition.** A gate that rejects `--json <path>` makes the
  producer exit red, so no project is routed into it blind: `template/AGENTS.md`
  gains the declared gate-script slot (or a declared `none`), and the rule's
  `absent` field states what a project without the handshake does instead.
- **The routing pin.** `scripts/gate-producer-drift.mjs` refuses a step owner
  shipped with zero citations, a `gate-producer@1` block missing one of its six
  fields, a scaffold guide that lost the declaration, and a producer whose default
  gate stopped publishing the handshake — the default is one exported constant
  now, not a literal.

The rule's one home is `skills/pre-execution-review/references/LEDGERS.md`
§ The producer. `gate-receipt@1`, the freshness predicate, `audit-pr-gate`'s
verdict and the CLI's exit contract are unchanged.
