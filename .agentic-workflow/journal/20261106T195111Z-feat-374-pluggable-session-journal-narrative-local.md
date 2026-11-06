## 2026-11-06T19:50:54Z — feat/374-pluggable-session-journal — manual
- **Commits:** 13 (`bcd0830c…f5af845e`)
- **Files:** 33 files
- **Summary:** Applied issue #374: pluggable session-journal storage — canonical entry schema, store-driver contract, two reference drivers (Markdown, SQLite)
- **Decisions:** D1 full slice (schema + contract + both drivers + conformance tests + docs); D2 single PR; D3 insert-only contract (corrections are new entries, never edits); D5 reason as core field (byte-parity with AC4's markdown render); D9 monotonic arrival-order ids; D10 programmatic driver selection, no config key; D12 both UTC timestamp precisions accepted
- **Next:** PR #431 opened against main — review the diff, ledgers at docs/fix/374-pluggable-session-journal/, then either approve merge or request changes
