---
"@gtrabanco/agentic-workflow": patch
---

fix(roadmap): collapse duplicate NN rows in the upsert and read the reader's row

The NN-keyed roadmap family (`rowUpsert`, `findRow`, `annotate`) now shares one
scope — the table the `| NN |` header opens — and one rule: the last match
wins, the row `parseIndexRows` keeps. A duplicate-key upsert splices the
earlier duplicates out and settles the survivor, so a settle can never change
only what readers ignore, and a linkless row under another header is never
this key (issue #514, external-verify 2026-11-15 blocker 1).
