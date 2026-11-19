---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": minor
---

feat(vehicle): arm and report the authoring checkout's own vehicle (issue #611)

An authoring session now runs the working tree instead of the installed release,
and when it cannot, the state is readable instead of being reported as a bug.

- `scripts/setup-env.mjs` arms `AGENTIC_WORKFLOW_RUNNER` at this checkout's crate
  bin through a gitignored local env fragment, verifies it read-only, and stays
  opt-in where pi is absent.
- the tool doctor gains the `dogfooding-vehicle` row: `unarmed` when the override
  is unset, `stale` when it is applied but does not reach this checkout,
  `unreachable` when the armed path does not exist, `ok` when it does — each with
  the installed version, the resolved target and the newest canary tag, and the
  exact arming or refresh command.
- `triage-issue` gains the setup-defect pre-classification: a runner refusal for a
  subcommand the working tree ships, while the vehicle is stale or unarmed, is a
  setup state, pinned prose-to-code by a suite so the two cannot drift.
