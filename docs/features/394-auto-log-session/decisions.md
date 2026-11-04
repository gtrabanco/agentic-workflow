# Decisions — 394-auto-log-session

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/agentic-workflow/test/log.render.test.mjs, packages/agentic-workflow/test/log.publish.test.mjs | P1 | 2026-11-04 | execute-phase | the two new suites are the deliverable of P1 and P3 — the RED corpus that freezes the payload, the entry bytes and the publisher contract before either module exists; no existing assertion is relaxed, and the files are created, not modified.
justification | packages/pi-agentic-workflow/test/auto-log-session.test.mjs, packages/pi-agentic-workflow/test/auto-log-session-config.test.mjs, packages/pi-agentic-workflow/test/auto-log-session-wiring.test.mjs, packages/pi-agentic-workflow/test/auto-log-session-parity.test.mjs | P4 | 2026-11-04 | execute-phase | the four new suites are the deliverable of P4, P5, P6 and P8: the marker/facts units, the config contract, the wiring invariants (off, one entry, independence, publisher failure) and the byte-parity pin that executes the template hook. Every one is a new file.
justification | packages/pi-agentic-workflow/src/extension/telemetry-wiring.ts | P7 | 2026-11-04 | execute-phase | the log hook an earlier uncommitted draft bolted into this file is removed here so the two switches are two wirings (S4); the file's own suite (telemetry-wiring.test.mjs, session-telemetry.test.mjs) is unchanged and must stay green.
justification | packages/pi-agentic-workflow/test/default-inherit.test.mjs | P5 | 2026-11-04 | execute-phase | AC6's case deep-equals the whole shipped `DEFAULT_CONFIG`, so a new shipped default is added to the snapshot exactly as feature 66's `memory` and #383's `telemetry` were (commit 0dae2290, same test, same line). The assertion stays a full deep-equal of every shipped default — nothing is relaxed, narrowed or skipped, and the new line is what makes the off-by-default switch observable in the product's own snapshot.
```

## Decisions

- **D1** — 2026-11-04, Q1 (marker home): `.pi/.session-<id>.start`. The package's
  own project directory is `.pi/` (`src/config/load.ts:29-35`), and
  `template/.claude/hooks/log-session-end.sh:30` owns the `.claude/.session-*`
  namespace — one home per writer means neither can adopt the other's crashed
  marker. Entry parity is what S8 requires, not marker parity.
- **D2** — 2026-11-04, Q2 (publisher contract): **mirror**. The local journal
  entry is written first and every other publisher is a copy, because S10 says a
  publisher failure never loses the local entry — a replace contract would lose
  it by construction.
- **D3** — 2026-11-04, Q3 (transport): a config-declared command
  (`{ command: string[], timeoutMs? }`, facts JSON on stdin). S3 ships the
  interface, not every backend, and a declared command reaches an HTTP endpoint,
  a queue, a path outside the repo or a log sink without one line of network code
  in this package.
- **D4** — 2026-11-04, Q4 (privacy): the changed-path list travels inside the
  frozen payload. S3 requires every backend to render identically from the same
  payload, so a redacted variant would be a second grammar; the destination is
  operator-declared and opt-in. A redaction policy is in `## Future` with its
  re-trigger.
- **D5** — 2026-11-04, Q5 (version floor): no bump, floor stays
  `>=1.1.0`. This unit uses `session_start` and `session_shutdown` only — no
  `Usage.cost`, no turn events of its own — and #383 already verified 1.1.0 for
  `tool_execution_end.durationMs` (`docs/LOGS.md`, 2026-11-03 entry, decision 5).
- **D6** — 2026-11-04, mode vocabulary: `off | mechanical`. The `rich` value an
  earlier draft invented is dropped — the issue's non-goals reserve narrative
  prose for `/log-session`, and roadmap row 39 states `off|mechanical`.
- **D7** — 2026-11-04, the renderer and the publisher interface live in the
  runner crate, not in the pi package: S2 needs a deterministic CLI and the crate
  is its shipped home; the pi package already depends on the crate and cannot be
  imported by it, so one module beats a mirror plus a parity test.
- **D8** — 2026-11-04, `template/.claude/hooks/log-session-end.sh` is the parity
  **oracle**: the test executes it in a throwaway repository and diffs the bytes
  it appends, so the prose about parity cannot drift from the script.
- **D9** — 2026-11-04, the path list is collected wider than the hook's: the
  hook diffs the committed range only, while a pi session usually ends with
  uncommitted work, so the collector unions the range with
  `git status --porcelain` — the same session-scope rule `sessionChangedPaths`
  already applies for the ledger (`telemetry-wiring.ts:158-176`). Parity is a
  format contract and is pinned on a clean fixture where both agree.
- **D10** — 2026-11-04, the entry is appended on every `session_shutdown`, its
  `reason` recorded, with no filter on `reload`/`new`/`resume`: the mechanics
  bullet says one entry per shutdown, and filtering would be an invented rule. A
  reason filter is in `## Future` with its re-trigger.
- **D11** — 2026-11-04, the acceptance carrier is `### Acceptance criteria`
  inside `## Specs`: the `spec-by-reference` shape this tree validates retired
  the legacy `## Acceptance criteria` H2
  (`packages/agentic-workflow-schema/src/pre-execution.ts:245-264`), and the
  template already nests its ledgers the same way.
