# Toy plan — 99-csv-export-command (golden fixture)

Phase-lint target of this fixture: `node scripts/phase-lint.mjs scripts/fixtures/golden-fixture/toy-plan.md` → `verdict PASS`.

### P1 — implement export-csv

Layer: `domain`. Done-when: `node scripts/phase-lint.mjs scripts/fixtures/golden-fixture/toy-plan.md` → `verdict PASS`.

- [ ] Command handler writes a header row + one row per record to `<path>`
- [ ] Empty record set → header-only file, exit 0

### P2 — Hardening & PR

Layer: `hardening`. Done-when: `git status --porcelain -- docs/` → empty, and the project verification gate commands exit 0.

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the roadmap row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a Markdown file, real backticks, never inline `--body`/heredoc) and PRINT THE PR URL in the chat
- [ ] Update the roadmap row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #<n>` and push
