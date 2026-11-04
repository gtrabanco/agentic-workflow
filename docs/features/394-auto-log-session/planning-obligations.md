# Planning Obligations — feature/394-auto-log-session

> One row per normative behaviour, compatibility invariant, affected use case and
> required failure state. Column order and the `status` vocabulary are owned by
> [`skills/pre-execution-review/references/LEDGERS.md`](../../../skills/pre-execution-review/references/LEDGERS.md)
> §2 — this file is the M/L home those rules name, never a second contract.
> Every row is `planned` at the cut; `verified` only after its validator ran in
> the foreground with the evidence recorded where `required-evidence` says.

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1 | A fresh install writes nothing: the extension registers no listener, writes no marker, appends no entry and invokes no publisher | P6 | P6 | execute-phase | `bun test packages/pi-agentic-workflow/test/auto-log-session-wiring.test.mjs` exits 0 | the `off registers no listener` case in that suite | planned |
| O2 | S1 | Project config wins over global config, and an absent switch resolves to `off` | P5 | P5 | execute-phase | `bun test packages/pi-agentic-workflow/test/auto-log-session-config.test.mjs` exits 0 | the `project beats global` and `absent is off` cases | planned |
| O3 | S2 | The renderer has no pi module in its dependency closure — it is testable with zero pi | P1 | P1 | execute-phase | `rg -c "@earendil-works" packages/agentic-workflow/src/log/render.mjs` exits 1 | the `E` line with the command and its exit 1 | planned |
| O4 | S2 | `agentic-workflow log render --facts <payload>` reproduces an entry with no session and prints JSON on stdout | P2 | P2 | execute-phase | `bun packages/agentic-workflow/bin/agentic-workflow.mjs log render --facts <fixture> --json` exits 0 and prints `"contract": "log-entry@1"` | the `E` line with the command, exit and first line of stdout | planned |
| O5 | S2 | A malformed or unreadable payload is refused with a documented exit code, never guessed | P2 | P2 | execute-phase | `bun packages/agentic-workflow/bin/agentic-workflow.mjs log render --facts /dev/null` exits 2 | the `E` line with the refusal line on stderr | planned |
| O6 | S3 | A config-declared publisher receives the frozen payload as JSON on stdin | P3 | P3 | execute-phase | `bun test packages/agentic-workflow/test/log.publish.test.mjs` exits 0 | the `command publisher receives the frozen payload` case | planned |
| O7 | S3 | Every publisher receives the same frozen payload, never rendered prose | P3 | P3 | execute-phase | `bun test packages/agentic-workflow/test/log.publish.test.mjs` exits 0 | the `no publisher receives rendered prose` case | planned |
| O8 | S4 | Telemetry on with the log off writes the ledger row and no journal entry; the log on with telemetry off writes the entry and no row | P6 | P6 | execute-phase | `bun test packages/pi-agentic-workflow/test/auto-log-session-wiring.test.mjs` exits 0 | the two rows of the independence matrix in that suite | planned |
| O9 | S4, S5a | The log contributes no counter of its own: the accumulator is #383's and is read, not re-implemented | P6 | P6 | execute-phase | `rg -c "createSessionTelemetry\|onTurnEnd" packages/pi-agentic-workflow/src/extension/auto-log-session-wiring.ts` exits 1 | the `E` line with the command and its exit 1 | planned |
| O10 | S5 | The payload carries exactly the frozen key set, and the rendered entry carries no prompt text, model output, diff or file content | P1 | P1 | execute-phase | `bun test packages/agentic-workflow/test/log.render.test.mjs` exits 0 | the `the payload has exactly these keys` case | planned |
| O11 | S8 | The renderer's entry bytes equal `template/.claude/hooks/log-session-end.sh`'s appended bytes on one fixture | P8 | P8 | execute-phase | `bun test packages/pi-agentic-workflow/test/auto-log-session-parity.test.mjs` exits 0 | the `the hook and the renderer append identical bytes` case | planned |
| O12 | S9 | A project with no `docs/LOGS.md` did not opt in: nothing is written and no marker is left | P6 | P6 | execute-phase | `bun test packages/pi-agentic-workflow/test/auto-log-session-wiring.test.mjs` exits 0 | the `a project without a journal is not opted in` case | planned |
| O13 | S9 | A second `session_shutdown` for one session appends nothing more | P6 | P6 | execute-phase | `bun test packages/pi-agentic-workflow/test/auto-log-session-wiring.test.mjs` exits 0 | the `a second shutdown appends nothing` case | planned |
| O14 | S9 | A marker left by a crashed or foreign session id is never adopted | P4 | P4 | execute-phase | `bun test packages/pi-agentic-workflow/test/auto-log-session.test.mjs` exits 0 | the `a foreign marker is never adopted` case | planned |
| O15 | S10 | A publisher that throws or exits non-zero keeps the local entry, is reported, and never propagates out of shutdown | P3 | P3 | execute-phase | `bun test packages/agentic-workflow/test/log.publish.test.mjs` exits 0 | the `one failing publisher costs no entry and no sibling` case | planned |
| O16 | S11 | `session_start` writes `.pi/.session-<id>.start` as `<sha> <epoch> <iso>`; `session_shutdown` removes it after the append | P4 | P4 | execute-phase | `bun test packages/pi-agentic-workflow/test/auto-log-session.test.mjs` exits 0 | the marker round-trip case in that suite | planned |
| O17 | S11, PE-002 | The marker lives outside the Claude hook's namespace, so neither writer can read the other's crashed marker | P4 | P4 | execute-phase | `rg -c "\.claude" packages/pi-agentic-workflow/src/auto-log-session.ts` exits 1 | the `E` line with the command and its exit 1 | planned |
| O18 | S1, S2, S3 · AGENTS.md §Working rules (documentation currency) | The crate README, the pi README, roadmap row 39 and the journal header describe the shipped surface, and the change carries its release intent | P9 | P9 | execute-phase | `bun scripts/version-parity-gate.mjs` exits 0 and `rg -c "until feature 41's" docs/LOGS.md` exits 1 | the `E` lines plus `.changeset/394-auto-log-session.md` | planned |
| O19 | S4 · P7 retirements | The log wiring is registered independently of the telemetry switch, and the telemetry wiring carries no log hook | P7 | P7 | execute-phase | `rg -c "auto-log-session-wiring" packages/pi-agentic-workflow/src/extension/index.ts` matches 1 and `rg -c "autoLogSession\|createPublisher" packages/pi-agentic-workflow/src/extension/telemetry-wiring.ts` exits 1 | both `E` lines | planned |

## Lifecycle

- All 19 rows are `planned` at the cut. The `status` cell is the only cell this
  ledger may change afterwards.
- `verified` requires the validator to have run in the foreground with its output
  recorded in the unit doc's `## Log` (`E` lines for evidence, `G` lines for
  gates).
- A row that reopens a behaviour flips back to `in-progress` before any other
  work in the unit continues.
