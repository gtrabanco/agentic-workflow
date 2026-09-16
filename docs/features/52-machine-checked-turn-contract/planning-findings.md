# Planning findings — 52-machine-checked-turn-contract

One stage-aware table. Reviewers append rows; nobody edits a reviewed artifact
to make a row disappear. Contract:
`pre-execution-review/references/LEDGERS.md` §Findings.

```text
finding-id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision
```

| finding-id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision |
|---|---|---|---|---|---|---|---|---|---|
| SPEC52-F1 | spec | info | product | a768d95cb498656aeea9d46c7b9bf41110a3bdb6732ed69ee068abb2b850536b | Capability closure row E2 cites the house bash-test pattern as `tests/test-command-guard.sh style`, but no top-level `tests/` directory exists — the canonical file is `template/.agentic-workflow/hooks/tests/test-command-guard.sh`. The claim's substance holds (the house pattern exists); the path prefix is shorthand. No downstream effect: AC13's own target path `template/.agentic-workflow/hooks/tests/test-turn-contract.sh` is already correct. | `find . -name test-command-guard.sh` → single hit at `template/.agentic-workflow/hooks/tests/test-command-guard.sh`; `ls tests/` → no such directory | open | — | — |
