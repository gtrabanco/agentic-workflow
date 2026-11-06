---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": minor
"audit-docs": patch
"log-session": patch
"init-workspace": patch
---

feat(journal): session-log fragment carrier + merge-to-main aggregator (#405)

One fragment file per journal entry under `.agentic-workflow/journal/`, and one
deterministic, forge-free aggregator (`agentic-workflow journal aggregate`)
that appends the pending fragments to `docs/LOGS.md` newest-first, deletes the
consumed fragments and refuses anything ambiguous — killing branch-vs-branch
conflicts on the session journal by construction, the same fragment-and-consume
shape `.changeset/` uses for release notes.

- The crate gains the `journal` subcommand (`aggregate`, `name`) and
  `src/journal/fragment.mjs` — the single owner of the fragment naming grammar
  (`journal-fragment-grammar@1`: `<UTC-second>-<branch-slug>-<kind>-<session-slug>.md`,
  collisions refused, never overwritten) — plus the aggregator in
  `src/journal/aggregate.mjs`.
- The carrier directory's presence is the opt-in: the local journal publisher,
  the template's SessionEnd hook and `/log-session` produce fragments when it
  exists and append byte-identically to `docs/LOGS.md` when it does not; in
  fragment mode `session-close close` commits the new fragments alone and
  refuses a touched journal outright.
- The carrier ships in `template/` consent-gated and off by default
  (`.agentic-workflow/journal.md` + a concurrency-grouped GitHub Actions
  example and a documented `post-receive` hook); the fragment layout slots
  into #374's future store-driver contract as one more driver.
