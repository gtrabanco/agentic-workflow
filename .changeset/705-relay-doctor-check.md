---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": minor
"init-workspace": patch
"unit-lane": patch
---

feat(doctor): report Relay dispatch capability instead of learning it at the hand-off (issue #705)

The doctor gains its seventeenth documented surface: a `relay` row answering
whether this session can chain Relay legs. The lane used to discover the answer at
the first hand-off — a `dispatch_relay` whose bridge event met no listener, or a
prose fallback to the per-phase route — and the operator now reads it up front.

The issue's own scope decision splits the answer by this repository's delimitation
rule, and the row keeps the split:

- **generic, and the check's** — the `PI_WEB_SESSION` marker, the session-daemon
  endpoint PI WEB itself resolves (`PI_WEB_SESSIOND_SOCKET`, else
  `<PI_WEB_DATA_DIR>/sessiond.sock`, a configured port meaning TCP) and the
  `@jmfederico/pi-relay` package as Pi's settings declare it, with its `relay` and
  `relay-runner` skills on disk;
- **pi-specific, and named** — the `pi-web:session-dispatch:v1` bridge is a
  synchronous host event, so the evidence carries the protocol id and
  `observable: false` with its owner instead of claiming a probe. Nothing here
  dispatches, spawns, connects or installs.

The statuses are the published ones: `not-applicable` without a PI WEB session
(the by-design route, with the per-phase hand-off stated), `unreachable` when the
marker is set and no daemon answers, `missing` when the package or one of its two
skills is absent — the advisory refuses npm by name, because the package is
`private: true` and only dispatches through PI WEB — and `ok` when the generic half
is complete. The row is `optional`, so a missing capability is an advisory that
never fails a run.

`agentic-workflow doctor --check <id>` prints one documented row instead of the
whole inventory, and an id the inventory does not document is a refusal naming the
ids it accepts, never an empty envelope. The shared facts a run computes (the
version batch, the engram health read) are now read only when the selected rows
declare they use them, so a narrowed read costs what it prints: measured 3.3s for
the full inventory, 0.24s for the relay row.

The session marker, the daemon resolution and the host's bridge wording moved into
`src/runner/pi-web.mjs`, imported by the router and the probe — one owner, and the
router's printed hint stays byte-identical. `unit-lane`'s relay reference and
`init-workspace`'s tool-evidence step cite the check instead of re-deriving
presence.
