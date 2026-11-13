---
"@gtrabanco/agentic-workflow": patch
---

fix(test): merge the journal race fixture under the fixture identity

The crate's own publish gate was red on every run: the journal race fixture
merged with `-c commit.gpgsign=false` but no identity, so `git merge` read the
ambient git config — green on a developer box with a global `user.*`,
`fatal: empty ident name` on a CI runner without one.

The fixture identity becomes one exported `-c` list (`GIT_CONFIG` in
`test/fixtures.mjs`), the list the throwing helper already passed to every other
fixture invocation, and the merge uses it. No assertion changed, no git config is
written, and no workflow step manufactures an identity on the runner: the `-c`
per-invocation rule (issue #514 S7) is what keeps a suite from depending on whose
machine runs it.
