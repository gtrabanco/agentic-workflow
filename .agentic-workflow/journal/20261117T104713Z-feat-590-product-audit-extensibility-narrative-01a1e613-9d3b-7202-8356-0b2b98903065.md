## 2026-11-17T10:47:13Z — feat/590-product-audit-extensibility — narrative
- **Commits:** 14 (`4422b401…5f5ba0fe`)
- **Files:** 26 files
- **Summary:** PR #604 opened for unit 590 (feat/590-product-audit-extensibility) — coverage-gap join, the Coverage gaps dimension, and the evolution-regression gate. Tree clean, roadmap row 590 settled through the writer (before fb1c2bb1 → after 10ece22e), projection current. Local gate 17/17 PASS at head 0d5ce407 (421 s, root suite 126 s).
- **Decisions:** D4: ledger-ownership.exception added for product-audit-gap-fixture.mjs→SPEC.md in throwaway trees so the seeded/clean fixture can materialize unit docs without breaking the block list; no new failures reproduce — existing carriers reused as input
- **Next:** Owner external verify of PR #604 (https://github.com/gtrabanco/agentic-workflow/pull/604), then merge. Two items noted but not fixed: (a) ceremony roadmap row-upsert/settle broken (rowUpsert receives path, service passes text — ENAMETOOLONG); (b) pre-push hook passes the full gate then dies with SIGPIPE 141 before git transfers.
