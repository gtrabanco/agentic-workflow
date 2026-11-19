## 2026-11-19T11:41:48Z — feat/596-test-relevance-sweep — narrative
- **Commits:** 17 (`23950525…3f4b213c`)
- **Files:** 148 files
- **Summary:** Resolve issue #596 (obligation tags per test suite), freeze ledgers, implement schema + gate + suite tags + sweep docs, verify, push PR #649
- **Decisions:** D1: adopted issue #596's obligation taxonomy verbatim; D2: resolved prompt-byte/distribution-contract to single token test-obligation; D3: sweep cost input is the root gate's own PASS output; D4: must-name:no for the vocabulary normative row; D5: protected surface = repo-relative path for gate-resolvability; D6: one declaration per suite head, no central registry (avoids rot); D7: fix row hand-written because ceremony roadmap row-upsert cannot write a fix row (ENAMETOOLONG); D8: wall-clock deltas attributed to run variance, not a speedup
- **Next:** Owner reviews PR #649 (https://github.com/gtrabanco/agentic-workflow/pull/649), issues external verdict, and merges when satisfied. Two findings remain unfixed by design: ceremony roadmap row-upsert defect (O16 n/a), and four surviving mutants in two ceremony clusters (coverage gap named in sweep.md).
