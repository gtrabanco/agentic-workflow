---
"@gtrabanco/agentic-workflow": minor
---

feat(cli): `doctor` and `setup` — the deterministic tool doctor and its consent-gated wizard

One read-only checker for the workflow's third-party tool surfaces: fourteen
rows, each with real evidence (resolved path, version, version pair, health
probe, config state), a derived move and a status from the published
`DOCTOR_CHECK_STATUSES`. It is the established twin of `resources detect` — own
contract id (`doctor@1`), injectable probes, no writes, no package manager ever
run.

The declarative half is new and singular: the crate README's `tool-inventory@1`
block declares what every default tool is, why it exists, whether it is required
or optional, how it is detected, its alternative and its install route, and the
checker refuses (exit 2) when the document and the probes disagree in either
direction — a documented tool nobody checks can no longer ship.

`setup` maps each unsatisfied row to one of the four published `WIZARD_MOVES`:
`report-only`, `ask-consent-write` (the project's own installer, run only after
an explicit yes and recorded once in `.agentic-workflow/provision-log.jsonl`),
`instruct-only` (the exact command, printed) and `residual` (another owner's
decision). It re-reads the same envelope afterwards, so a repaired row leaves the
plan and a second run is a no-op.

`scripts/setup-env.mjs --doctor [--json]` gains the repository carrier for the
same envelope, and `init-workspace`'s discovery step reads it instead of
re-deriving tool state by hand.
