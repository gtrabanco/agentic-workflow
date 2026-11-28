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

The shim now checks the host against this package's declared `peerDependencies`
range, read from its own manifest: a satisfying host module is preferred over an
unsatisfying sandbox copy (the entry hands it the running host's package
directory), a satisfying range loads the layer silently, and an unsatisfying or
unreadable version becomes one `session_start` warning naming the resolved
version, its path and the one-line `bun add` repair. Nothing writes to the
sandbox: the repair is reported, never performed. `dependency/versions` gains the
`.d.mts` type projection the shim imports.
