---
"@gtrabanco/agentic-workflow": patch
"@gtrabanco/pi-agentic-workflow": patch
---

fix(runner): a canary tag records the tree it published, and the CLI names itself (issue #679)

Two traps made a manual `runner` invocation on a canary train fail with no hint:
the standalone skills' pin named the last stable while the tree already cited
canary-only services, and the crate's usage string spelled the scope-less npm
name that resolves to the `agentic-workflow@0.0.0` placeholder.

The canary cut now snapshots the staged tracked tree before it restores the
worktree and records the tag on that commit (`scripts/canary-tag.mjs`), so
`npx skills add …#v<canary tag>` installs skills whose `runner-pin@1` names the
crate they shipped with. No branch moves and the committed pin stays stable, so
`#stable` and `#vX.Y.Z` installs are unchanged; a tag already recorded on a
different tree is refused instead of retargeted, and the restore now covers the
pin it stages.

The bin's top-level usage line names `bunx @gtrabanco/agentic-workflow@<pin>`
with the pin's owner beside it, and the crate README restates the same line. An
unknown service now answers `EDIT REFUSAL — Unknown service: <name> — this
install is @gtrabanco/agentic-workflow@<version>; a service added after that
version is not in it`, naming the pin contract and `AGENTIC_WORKFLOW_RUNNER` as
the repairs. `RUNNER.md` documents both the canary-tag guarantee and the branch
install that can still be ahead of the last cut, and the pi bundle is untouched
because its projection pointerizes the invocation section.
