# Session journal — fragment carrier (opted in)

This repository consumes its own fragment carrier: every journal entry lands
here as one fragment file, and the merge-to-main aggregation workflow
(`.github/workflows/agentic-workflow-journal.yml`) is the only writer of
`docs/LOGS.md`.

- **Only fragments belong in this directory.** A file the aggregator cannot
  parse as `<UTC-second>-<branch-slug>-<kind>-<session-slug>.md` is a refusal
  (exit 2) that blocks the whole aggregation — put documentation beside the
  carrier (this file), never inside it.
- Naming grammar and content rules: **one owner** — `journal-fragment-grammar@1`
  in `@gtrabanco/agentic-workflow`'s README (`packages/agentic-workflow/README.md`).
  Writers compute the name: `node packages/agentic-workflow/bin/agentic-workflow.mjs
  journal name --kind <mechanical|narrative>`. Never hand-roll it.
- **Mechanical entries** are written by the pi extension when
  `autoLogSession` is `mechanical` in `.pi/pi-agentic-workflow.json`; it is
  `{}` today, so they are not automatic yet. Activation (merge → release →
  install the released pi package → restart the session daemon → set
  `{"autoLogSession":{"mode":"mechanical"}}`) is the runbook in
  `docs/fix/405-journal-fragments/SPEC.md` → Log D8. Until then a session's
  mechanical entry is written by the template hook, and the narrative entry is
  always `/log-session`'s manual job.
- Full carrier contract: `docs/fix/405-journal-fragments/SPEC.md` and the
  upstream carrier doc `template/.agentic-workflow/journal.md`.
