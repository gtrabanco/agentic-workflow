---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": patch
---

feat(journal): headless journal fragments, and the distributable action that writes them

A CI-driven session — an agent action landing a pull request, a scheduled driver,
a compiled workflow — had no journal entry: `log-session` only covers an
interactive session with a live operator, and a hand-composed fragment is the
failure class `journal write` removed.

`journal headless` is the headless run's writer. The caller declares what the run
did (`--issue`, `--summary`, `--decisions`, `--next`, `--files`, or a rendered
`--block`) and the identifiers it carries (`--workflow`, `--run-id`, `--actor`),
and the operation composes the fragment through the owners that already exist:
`fragmentName` for the name, `renderEntryBlock` for the bytes, `writeJournal` for
the write. Provenance rides the fragment grammar's own fields — the session slot
carries `gha-<run id>` and the heading names the workflow, the run and the actor —
so no field or kind is added. One entry per run: a second invocation for the same
run id answers `already-present` and writes nothing, so a re-run never duplicates
an entry or fails the job. An absent carrier, an incomplete provenance, an
invalid run id or issue, a prose+block pair and a collision are exit 2
`JOURNAL REFUSAL — <reason>` before any byte lands. The contract is
`journal-headless-grammar@1` in this package's README.

`journal/action.yml` is the distributable composite action
(`uses: gtrabanco/agentic-workflow/journal@<tag>`), and `journal/headless.mjs` is
its adapter: it maps the run's environment onto the operation, derives the crate
version from its own tagged tree (no second version literal), honours
`AGENTIC_WORKFLOW_RUNNER`, and fails closed with an actionable refusal when no
runner resolves. No model in the write path, no token, no forge call — the
action's only effect is one file under the project's carrier, which the shipped
aggregator later appends to the journal.
