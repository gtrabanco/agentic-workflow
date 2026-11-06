# Session journal — fragment carrier (opted in)

This repository consumes its own fragment carrier: every journal entry lands
here as one fragment file, and the merge-to-main aggregation workflow
(`.github/workflows/agentic-workflow-journal.yml`) is the only writer of
`docs/LOGS.md`.

- Naming grammar and content rules: **one owner** — `journal-fragment-grammar@1`
  in `@gtrabanco/agentic-workflow`'s README (`packages/agentic-workflow/README.md`).
  Writers compute the name: `node packages/agentic-workflow/bin/agentic-workflow.mjs
  journal name --kind <mechanical|narrative>`. Never hand-roll it.
- The mechanical entries are written automatically by the pi extension
  (`.pi/pi-agentic-workflow.json` → `autoLogSession: mechanical`); the narrative
  entries stay `/log-session`'s manual job.
- Full carrier contract: `docs/fix/405-journal-fragments/SPEC.md` and the
  upstream carrier doc `template/.agentic-workflow/journal.md`.
