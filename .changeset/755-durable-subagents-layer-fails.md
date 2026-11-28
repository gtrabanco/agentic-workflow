---
"@gtrabanco/agentic-workflow": patch
"@gtrabanco/pi-agentic-workflow": patch
---

fix(pi-package): the durable-subagents layer survives a stale hoisted host copy (issue #755)

The layer loads `pi-extensible-workflows`, whose subagents extension imports the
host through the bare specifier `@earendil-works/pi-coding-agent` — so it binds
whatever copy the extension sandbox hoists. `pi update --all` never re-resolves a
hoisted peer with no direct requester, so that copy can predate the export the
layer needs (0.84.2 predates `createCodemodeExtension`), and every session
reported a missing export while the diagnostic recommended a reinstall that
cannot reach the hoisted copy.

The shim now checks the copy the dependency's own import will bind against
this package's declared `peerDependencies` range, read from its own manifest: a
satisfying bound copy loads the layer silently, an unsatisfying or unreadable
one becomes one `session_start` warning naming the resolved version, its path
and the one-line `bun add` repair — with what the running host is when
`PI_PACKAGE_DIR` names it — and the check refuses before the load, so the old
missing-export message and its reinstall advice can no longer surface for a
peer mismatch. Nothing writes to the
sandbox: the repair is reported, never performed. `dependency/versions` gains the
`.d.mts` type projection the shim imports.
