# 65 — doc-toolchain · decisions.md

Escape records required by the path-protection policy (`path-protection-records@1`).
Append-only: a removal or a lowering is ignored by the gate.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/agentic-workflow/test/doc.store.test.mjs | P3 | 2026-10-01 | execute-phase | new P3 red-first test suite for store/config/manifest was created pre-freeze (create: none) and this is its first in-phase correction (async callback + stray comment), not a weakening; assertions unchanged or strengthened
justification | packages/agentic-workflow/test/doc.chunks.test.mjs | P4 | 2026-10-01 | execute-phase | pre-implementation clarification of the P4a chunker suite's own preamble rule: a file whose first content line is a heading has an empty preamble range, so no preamble chunk is emitted (meta still rides every chunk per D5); two expectations aligned to that rule before the implementation existed — no weakening, no implementation pressure
justification | packages/agentic-workflow/test/doc.chunks.test.mjs | P4 | 2026-10-01 | execute-phase | second pre-implementation clarification of the same P4a suite: `section` carries the heading PATH ("One > Two"), matching the id slug and disambiguating duplicate titles, and the dedupe fixture rewritten to two headings that actually share one heading path (the original nested fixture produced distinct paths, so it exercised no dedupe at all); both align the test to D5's heading-path id rule — no weakening
```
