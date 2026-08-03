## Phase handoff record (`progress.md` — fixed schema)

Every phase ends by APPENDING one entry to the unit's `progress.md`. Feature
mode: the file `plan-feature-scaffold` created. Phased XS/S single-pass and
`--fix` units: create `progress.md` beside the SPEC on P1 (the SPEC's
checkboxes stay the task ledger; this file is the **handoff channel**).
Fixed schema — all five lines present, `none` is valid, free prose is not:

```
## P<k> — <YYYY-MM-DD>
- Done: <the phase's delivered tasks, one line>
- Remains: <in-unit work still open, or none>
- Gotchas: <surprises, workarounds, or decisions the NEXT phase must know, or none>
- Files: <paths touched>
- Next: P<k+1> — <its title> | unit finished
```

The entry rides the phase commit (no sha in the entry — the carrying commit is
the phase sha; `git log` resolves it). The next phase starts in a fresh
conversation and reads only `SPEC.md`, its phase's `TASKS.md` section (or SPEC
`## Phases`), and `progress.md`. Never rely on prior-session memory.
