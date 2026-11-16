## 2026-11-16T22:17:47Z — feat/504-extended-telemetry — narrative
- **Commits:** 11 (`a0e850ef…de9256d4`)
- **Files:** 37 files
- **Summary:** Applied issue 504 extended telemetry - widened the session sample from one collapsed tokens number to phase/version/model and five provider token fields, shipped a per-session JSONL sink and a versioned tier-cost@2 ledger, and wired a report CLI plus a coverage gate that pins the phase vocabulary to the command surface.
- **Decisions:** phase ships in the sample although S1 interface block omits it (S5, the use-case table and 494 scope read model, so the omission was a block typo not a deliberate path-protection); tier-cost grammar is keyed (one block per ledger file, reader names the one it read, the writer follows the file); pi telemetry report resolves to bun scripts/telemetry-report.mjs (Pi extension API has no CLI-subcommand seam); the gate only red - dependency-pin-gate on pi-extensible-workflows 6.3.0 to 6.4.0 - is pre-existing on origin/main and a fix(deps) unit of its own.
- **Next:** Owner reviews PR 593 open against main and merges; the pin drift on pi-extensible-workflows is a separate fix(deps) unit.
