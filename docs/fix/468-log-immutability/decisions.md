# Decisions — fix/468-log-immutability

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/log-immutability.test.mjs | P8 | 2026-11-08 | execute-phase | The frozen red suite was observed against tiny fixture journals only; the gate's first foreground run on the live tree killed `git show <base>:docs/LOGS.md` at spawnSync's default 1 MiB maxBuffer (the real journal is 1,054,227 bytes). The regression pin (a >1 MiB journal that must still read, verdict PASS) joins the suite in the same change as the fix — an assertion added, never an existing one relaxed.
```
