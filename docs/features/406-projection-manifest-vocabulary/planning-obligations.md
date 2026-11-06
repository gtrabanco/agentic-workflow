# 406 — projection-manifest-vocabulary · planning obligations

One row per normative behaviour, compatibility invariant, affected use case and
required failure state. Nine-column shape owned by
`skills/pre-execution-review/references/LEDGERS.md` §2; every row `planned` at cut
time and `verified` only with its validator run and its evidence recorded where
`required-evidence` says.

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1, S2 | the contract is declared once, inside the schema package, and nothing outside it changes | P1 | P1 | execute-phase | `bun test packages/agentic-workflow-schema/test/projection.test.mjs` exits 0 | suite name plus exit code in the `## Log` `E` line | planned |
| O2 | S3, S13 | the seam set is a closed, exported, non-empty vocabulary and an unknown seam is refused | P1 | P1 | execute-phase | `bun test packages/agentic-workflow-schema/test/projection.test.mjs` exits 0 | the `unknown seam` case name plus exit code in the `E` line | planned |
| O3 | S4, S9 | a valid manifest fixture (three ops, all selector forms, keep-list, hash) validates | P1 | P1 | execute-phase | `bun test packages/agentic-workflow-schema/test/projection.test.mjs` exits 0 | the `valid manifest` case name plus exit code in the `E` line | planned |
| O4 | S4, S9 | an unknown op is refused by the validator | P1 | P1 | execute-phase | `bun test packages/agentic-workflow-schema/test/projection.test.mjs` exits 0 | the `unknown op` case name plus exit code in the `E` line | planned |
| O5 | S4, S9 | a malformed selector is refused: zero or two selector forms, `within` on a non-line form, an uncompilable regex, an empty path or heading title | P1 | P1 | execute-phase | `bun test packages/agentic-workflow-schema/test/projection.test.mjs` exits 0 | the malformed-selector case names plus exit code in the `E` line | planned |
| O6 | S4 | every rule carries `contentHash` = `sha256:<64 lowercase hex>` over the removed UTF-8 bytes, a unique id, a repo-relative `source`, and an `enforcingCommand`; `except` is legal only on `remove` | P1 | P1 | execute-phase | `bun test packages/agentic-workflow-schema/test/projection.test.mjs` exits 0 | the hash/keep-list/enforcing-command case names plus exit code in the `E` line | planned |
| O7 | S5, S9 | a guard verdict is one of `allow \| block \| degrade`; a rejection carries a reason from the closed set, the requirement, the enforcing command and a message; `degrade` names its declared fallback | P1 | P1 | execute-phase | `bun test packages/agentic-workflow-schema/test/projection.test.mjs` exits 0 | the guard-verdict case names plus exit code in the `E` line | planned |
| O8 | S9 | the two published Draft-07 schemas validate the valid fixture and reject the same malformed matrix under strict `ajv` | P2 | P2 | execute-phase | `bun test packages/agentic-workflow-schema/test/projection.test.mjs` exits 0 | the ajv parity case names plus exit code in the `E` line | planned |
| O9 | S7 | both schemas are listed in `files` and reachable through `exports`, so a consumer import cannot break | P2 | P2 | execute-phase | `cd packages/agentic-workflow-schema && npm pack --dry-run --json` matches 2 (both schema names) | the two packed paths in the `E` line | planned |
| O10 | S10 | the six sets are exported by the package and imported by the root vocabulary-parity suite | P3 | P3 | execute-phase | `bun test scripts/vocabulary-parity.test.mjs` exits 0 | exit code plus the six imported names in the `E` line | planned |
| O11 | S6, S11 | every new machine grammar has a `normative-surfaces@1` row that resolves, and the drift gate passes in both directions | P3 | P3 | execute-phase | `bun test scripts/normative-drift.test.mjs` exits 0 | exit code plus the six row names in the `E` line | planned |
| O12 | S7 | the release intent is a valid changeset declaring the schema package at the right level | P3 | P3 | execute-phase | `bun scripts/lint-changeset.mjs .changeset/406-projection-manifest-vocabulary.md` exits 0 | exit code in the `E` line | planned |
| O13 | S1, S11 | the roadmap row points at this unit and the unit doc carries the frozen ledgers | P4 | P4 | execute-phase | `rg -c '406-projection-manifest-vocabulary' docs/ROADMAP.md` matches 1 | the count in the `E` line | planned |
| O14 | S7, S11 | the schema package suite passes under both runtimes and the repository gate passes | P5 | P5 | execute-phase | `bun scripts/local-gate.mjs` exits 0 | the gate receipt in the `## Log` `G` line | planned |
| O15 | S12 | no dependency is added to the schema package and a frozen install resolves the workspace | P5 | P5 | execute-phase | `rg -c '"dependencies"' packages/agentic-workflow-schema/package.json` matches 0 and `bun install --frozen-lockfile` exits 0 | both results in the `E` line | planned |
