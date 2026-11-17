## 2026-11-16T21:30:14Z — feat/504-extended-telemetry — issue #504 extended telemetry
- **Commits:** 7 (`a0e850ef…1fcb5359`)
- **Files:** 35 files
- **Summary:** Applied issue #504: the session sample now carries the phase, the package version, the model and the five provider token fields; a per-session JSONL sink ships beside the tier-cost@2 ledger; a report CLI reads either source and aggregates by phase or unit; and a coverage test pins the phase vocabulary to the repository's real command surface. Seven commits over a0e850ef..1fcb5359, every obligation verified, three package suites green (947 / 893 / 935 pass).
- **Decisions:** model joins the sample although S1's block omits it (S5's --model filter, the use-case table and the promoted feature all read it); pi telemetry report resolves to bun scripts/telemetry-report.mjs because the host's extension API has no CLI-subcommand seam; one grammar per ledger file, @1 still read and still written to a @1 ledger; the JSONL path ships as .pi/.telemetry/sessions.jsonl under the one telemetry.enabled switch
- **Next:** Owner external verification over 888aaceb..HEAD, then the PR against main with the Closes #504 footer
