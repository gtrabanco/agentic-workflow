# 705 — relay-doctor-check · known pre-existing issues

- **The risk-tier classifier escalates every edit to
  `packages/agentic-workflow/bin/agentic-workflow.mjs`** (`signal: destructive`,
  reason `../src/doc/retrieval.mjs · (module-level)`). `does-not-affect`: the
  escalation is recorded as the unit's named high-risk item, and this unit's hunk
  is the `--check` flag inside the doctor/setup argument loop — the retrieval
  module is untouched.
- **`@jmfederico/pi-relay` is `private: true` and unpublished on npm.**
  `affects` this unit's design, not the tree: the probe reads the package on disk
  through Pi's own declarations and never asks a registry, and the row's advisory
  refuses npm by name (`S2`, `D5`).
- **A full `doctor` run costs ~2.7s per spawn on this host** (seven batched
  `--version` probes plus one `GET /health`; the crate's own suite header records
  the measurement). `affects` this unit's verification cost only: `--check`
  narrows the rows and keeps the shared context computation (`D4`), and every
  spawn case carries an explicit timeout.
- **`bun test` can report `0 pass 0 fail` on a few suites that pass under
  `node --test`.** `does-not-affect`: every suite this unit adds or touches is run
  under both invocations in the verification block, and a suite reporting zero
  cases under one runtime is named there rather than counted as green.
- **`scripts/test-obligation-tags.test.mjs` refuses an untagged *root* suite**
  (`scripts/*.test.mjs`). `does-not-affect`: this unit adds no root suite; the new
  probe suite lives in `packages/agentic-workflow/test/`, which the root gate does
  not tag.
