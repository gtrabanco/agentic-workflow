# Decisions — fix/331-authoring-setup

Append-only decision ledger for the unit. The issue's open questions are
resolved as `D1`/`D2` in the unit doc's `## Log` (with their evidence rows in
`planning-evidence.md`); this file carries the ledger rows the machine gates
read.

## Questions

```text
open-questions@1
id | date | type | question | blocks | search-receipt | options | route
Q1 | 2026-10-28 | open-question | Owner amendment S8/S9: when verification finds a committed config "not up to date" (.serena/project.yml, .engram/), what may setup-env.mjs do — fix only local gitignored state, also regenerate committed configs (serena init rewrites the committed project.yml), or only verify and report? | O17/O18: whether the config phase may rewrite committed shared state or only rebuild gitignored local state | AC3 guard (committed shared state); S2 verbatim ("never initializes, wipes or rewrites `.engram/`"); live worktree evidence (.serena/cache absent) | A — local-only: rebuild gitignored state, verify committed read-only, error clearly on invalid committed files, never run serena init \| B — also regenerate committed configs with the tools (diff left for the owner to commit) \| C — verify-only: fix tools, report config, build nothing | human-owner
```

Resolution: **A — local-only**, the owner's verbatim reply "Solo estado local" (2026-10-28, via the workflow's §1 single focused question).

## Justifications

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/setup-env.test.mjs | P2 | 2026-10-28 | execute-phase | S2/S6/S7's owning suite: one RED test per requested rule plus the AC3 .engram byte-identity guard — the tests are new files, authored before the implementation they pin
justification | scripts/update-tools.test.mjs | P4 | 2026-10-28 | execute-phase | S3's owning suite: pin-watch reuse-by-identity, dry-run no-spawn, and the exact upgrade commands; authored RED before scripts/update-tools.mjs exists, with two wrong first-draft expectations (degraded:false vs undefined, DRIFT case) corrected before first green — no gate test weakened
justification | scripts/update-tools.mjs | P4 | 2026-10-28 | execute-phase | S3's implementation: a new script reusing pin-watch exports by identity; touches no existing command's code path
justification | scripts/setup-env.test.mjs | P9 | 2026-10-28 | execute-phase | owner amendment S8/S9: the pipeline's owning suite grows the RED tests for stop-on-failure, bounded convergence, config verification and the worktree-shaped fixture — appended to the same file that owns S2/S6/S7 rules
justification | scripts/setup-env.mjs | P10 | 2026-10-28 | execute-phase | owner amendment S8/S9: the progressive verify→fix→next pipeline, config steps and PATH augmentation land in the script the amendment names; no other command's code path changes
```
