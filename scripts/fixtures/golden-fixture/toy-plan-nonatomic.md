# Toy plan — 99-csv-export-command (deliberately non-atomic variant)

Expected: `node scripts/phase-lint.mjs scripts/fixtures/golden-fixture/toy-plan-nonatomic.md` → exit non-zero, `verdict BLOCKED`, at least one `box-<n>` finding line.

### P1 — implement export and import commands

Layer: `api`. Done-when: it looks good.

- [ ] Export command writes CSV records to `<path>`
- [ ] Import command reads CSV records from `<path>`
- [ ] Docs update `docs/adr/0048-export-format.md`
- [ ] Decide whether to stream or buffer the file read
- [ ] Add a `--skip-dupes` flag if the user asks for it later
- [ ] Verify the export in a spreadsheet manually
- [ ] Update the README with both commands
- [ ] Add error handling for malformed rows and empty files
- [ ] Write integration tests for both commands
