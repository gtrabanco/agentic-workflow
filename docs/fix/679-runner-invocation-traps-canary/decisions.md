# Decisions — fix/679-runner-invocation-traps-canary

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/cli-coverage.test.mjs | P3 | 2026-11-22 | execute-phase | The usage anchor moves from the scope-less `usage: agentic-workflow <…>` to the scoped, pinned `usage: bunx @gtrabanco/agentic-workflow@<pin> <…>`; the README parser must read the shape the bin and the crate README now carry. The token set, the citation rules and every refusal are unchanged, so this is a contract-anchor update, never a relaxed assertion.
justification | scripts/canary-tag.test.mjs | P7 | 2026-11-22 | execute-phase | The 2026-11-22 EXTERNAL VERIFY advisory 2's smallest action is a parser fix in `scripts/canary-tag.mjs`; its RED corpus (valueless `--commit`/`--root`, empty `--root`, `snapshot` rejecting `record`'s options) is appended to this suite as the fold's proof, every pre-existing case keeps its exact expectations (an added contract, never a weakened assertion), and the batch also appends the differential pin for `record`'s missing-tag message.
approval | scripts/canary-tag.test.mjs | P7 | 2026-11-22 | human-owner | owner instruction 2026-11-22 (external-verify correction round), verbatim: "Apply to this repository: triage and fix those that deserve to fix but understand the context before fix and check you haven't broke another different thing, if you have done, start the loop again until you fixed full symbol/related stuff" — the recorded owner order for this post-freeze addition to the protected suite; advisory 2 names this file's module, and its own parser cases are how the fold proves.
```

## D1 — the canary tag records the staged tree

The canary cut stages the train version into the declared manifests and
`RUNNER.md`, publishes those bytes, then restores the worktree. Recording the tag
at the restored `HEAD` is what let `npx skills add …#v<canary tag>` install
skills whose cited services were younger than the stable pin. The tag now names
a commit materialized from the staged tracked tree (`scripts/canary-tag.mjs
snapshot`/`record`); no branch moves and the committed pin stays stable, so
`#stable` and `#vX.Y.Z` installs are unchanged.

## D2 — the pi bundle is not part of the repair

`packages/pi-agentic-workflow/projection-manifest.json` pointerizes the
invocation section, so the packaged skills never carry a pin and the pi resolver
spawns the installed crate. The stale-pin trap is the standalone skills tree
installed from a git ref; the pi path was already coherent (`PE-005`).

## D3 — `#main` ahead of the last canary stays documented, not auto-resolved

A branch install can be newer than the last cut. The exact-pin invariant forbids
a moving ref (`latest`, `@canary`) in `RUNNER.md`, so this unit documents the
state and makes the refusal name the repair (install a canary tag at or after
the service, or set `AGENTIC_WORKFLOW_RUNNER`); the next canary cut makes the
tree coherent again. Auto-resolution would be a different contract decision.

## D4 — no scope-less alias package

The issue marks publishing the scope-less name as a heavier, separate call. This
unit only stops the docs and the usage string from inviting it.

## D5 — subcommand usage lines keep the bin's own name

The top-level usage line is the one a reader can mistake for an npm package, so
it now spells `bunx @gtrabanco/agentic-workflow@<pin>`. A subcommand's
`usage: agentic-workflow <sub> …` is printed by the already-installed bin and
names a command, not a package; changing every one would churn the whole CLI
surface without removing the ambiguity that actually produced the trap.
