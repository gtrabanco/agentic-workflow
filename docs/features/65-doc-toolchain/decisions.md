# 65 — doc-toolchain · decisions.md

Escape records required by the path-protection policy (`path-protection-records@1`).
Append-only: a removal or a lowering is ignored by the gate.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/agentic-workflow/test/doc.store.test.mjs | P3 | 2026-10-01 | execute-phase | new P3 red-first test suite for store/config/manifest was created pre-freeze (create: none) and this is its first in-phase correction (async callback + stray comment), not a weakening; assertions unchanged or strengthened
```
