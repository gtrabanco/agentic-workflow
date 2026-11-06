---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/agentic-workflow-schema": minor
---

feat(journal): pluggable session-journal storage — canonical entry + store-driver contract (#374)

The journal's record is decoupled from its storage: one canonical, versioned,
structured entry type and a pluggable store-driver contract, with the human
Markdown journal rendered *from* the store, never written *as* the store. The
default driver keeps today's behaviour byte-for-byte, so this repository sees
no journal diff beyond the entries it writes.

- The schema package publishes `journal-entry@1` (`src/journal.ts` +
  `journal-entry.schema.json`): closed core fields (`timestamp`, `branch`,
  `kind`, `summary`, `reason`, optional derivable `commits`/`files`) plus the
  **open `metadata` map** — validated for shape, never for keys, so a consumer
  adds `dev_id`, `commit_hash`, `team`, `ticket` without forking the type.
- The crate ships the driver contract (`journal-driver-contract@1`, the crate
  README): `append(entry)` insert-only, `query(predicate)` with the one
  predicate grammar (`dateRange`, `branch`, `keyword` — expressed once,
  answered identically by every driver), and `render(range)` — the Markdown
  journal as a render target. The shipped drivers: the default Markdown
  driver (byte-identical append, carrier-composed with #405's fragments) and
  the reference SQLite driver (`.agentic-workflow/journal-store/entries.db`,
  insert-only, reusing feature 65's runtime adapter). One shared conformance
  suite (`runDriverConformance`) both pass — and a driver that strips
  metadata or mutates stored entries fails it (the failing-driver fixture).
- The mechanical writer (`createJournalPublisher`) now appends through the
  default driver: the options API and both result shapes are unchanged, the
  carrier's presence outranks the journal's (an opted-in project needs no
  `docs/LOGS.md` to write a fragment), both paths resolve against the caller's
  cwd, and a declared `kind` the mechanical writer cannot produce is a refusal
  instead of a silently mechanical fragment.
- The driver-authoring path is documented in the crate README (the four
  guarantees, the conformance obligation, no second configuration surface —
  drivers are selected programmatically).
