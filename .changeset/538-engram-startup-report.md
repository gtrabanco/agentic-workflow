---
"@gtrabanco/pi-agentic-workflow": minor
---

fix(pi-agentic-workflow): the Engram startup report is silent on a healthy install

The report was one advisory for every state — healthy, broken and unconfigured —
so an opted-in install with working memory printed a remediation line on every
session start, which reads as "engram is not available" (issue #538). It is now
the consent × runtime-health state machine the issue asks for, and every report
carries the `notice` Pi's UI applies:

- a healthy native install says nothing — the `engram` binary resolves (on `PATH`
  or through `ENGRAM_BIN`) or `ENGRAM_URL` names a server, so there is nothing to
  repair and nothing to read;
- a broken one is a single `error` naming the resolution that failed, quoting
  `ENGRAM_BIN` when it is set so "absent" and "unresolvable" are distinguishable,
  every route that repairs it, and the `engram --version` versus `/health` check
  for a stale binary/server pair;
- a leftover `mcpServers.engram` entry beside the native package is a `warning`:
  memory resolves, the native-only write guarantee does not;
- the opt-out stays silent, and `registered`, `external-server` and
  `already-declared` keep their informational lines.

No config key changes: `memory` keeps `{ engram: boolean }`, and nothing is
probed at session start — the version pair is named as a check, not measured.
