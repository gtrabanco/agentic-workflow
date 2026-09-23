# Feature 62 — decisions & justification records

## Path protection

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/pi-agentic-workflow/test/conductor-loop.test.mjs | P7 | 2026-09-23 | execute-phase | repair a TypeError in the test's own assertion expression (`boolean.test()` on `line0.includes("/\d+/")`) — the test crashes for ANY implementation; the repair preserves the assertion's intent (k/cap counter + command presence) and weakens nothing.
justification | packages/pi-agentic-workflow/test/conductor-sensor.test.mjs | P7 | 2026-09-23 | execute-phase | repair the fixture generator: the string `'\\n```\n'` put a real newline inside a single-quoted JS literal, so every fenced fixture script died with SyntaxError (no implementation can pass); escaped to `'\\n```\\n'` so the fixture emits the intended fenced JSON. Assertions unchanged — the schema-invalid fixtures still refuse.
justification | packages/pi-agentic-workflow/test/alias-coverage.test.mjs | P6 | 2026-09-23 | execute-phase | factual registration-surface update: AC1 requires the native `advance` command to be registered, so the exact registered-command-set assertions grow by `ADVANCE_COMMAND` (3→4 count, set literals, and the skill-derived filter). No assertion is weakened — the set is still exact.
```

## Diff-guard exception (recorded, not gamed)

`DIFF-GUARD BREACH — 62` · Lines: 2306 > 400 · Files: 31 > 8 (2026-09-23).
The unit is a roadmap-L feature: one new module tree (`src/conductor/`, 9 files),
an 84-test tests-first suite (8 files), config/extension wiring, docs and the
release bump. The anti-gaming rule was honoured: nothing was deleted to fit the
budget; the split that was possible (tests-first and docs as parallel scoped
work) was taken. Remaining size is inherent to the closed feature, recorded
here as the exception the lane requires.
