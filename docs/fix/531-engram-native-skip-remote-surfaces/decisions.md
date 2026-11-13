# Decisions — fix/531-engram-native-skip-remote-surfaces

The record file for the justifications the path-protection guard requires and for
the ordering call the acceptance criteria leave open. The block's shape and
authority are owned by the `path-protection-records@1` contract the guard reads
(`packages/pi-agentic-workflow/src/config/path-policy.ts`); the `paths` cell is a
glob, and `**/` is used so one row names the file whether the guard resolves it
against a checkout root or a linked worktree inside it.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | **/packages/pi-agentic-workflow/test/engram-provision.test.mjs | P2 | 2026-11-13 | execute-phase | Issue #531 AC4/AC3/AC2: adds the corpus the current module cannot satisfy — Pi's two settings.json scopes (`piSettingsPaths`, `readInstalledPackageSourcesFrom`, both trust values), the `ENGRAM_BIN` override cases, and the both-set report that must still state the external-server fact. Pure addition: the file's pre-existing cases and assertions (consent-first, config-invalid, already-declared, unsupported-host, registered read-back) are untouched, which is exactly what AC6 asks the suite to keep proving.
justification | **/packages/pi-agentic-workflow/test/shipped-adapter.test.mjs | P2 | 2026-11-13 | execute-phase | Issue #531 AC1/AC2/AC4/AC6: adds the shipped-entry cases no pure module can see — the notification level the operator actually reads ("informatively" is an adapter fact), the project-scope settings.json honoured only while trusted, and the environment isolation the new `process.env.ENGRAM_URL` read makes necessary. Setup-only change on the three pre-existing Engram cases: PATH keeps resolving a stub binary and `ENGRAM_URL` is pinned unset, so no assertion is edited — the suite stops depending on whose shell ran it.
```

## D1 — the AC1/AC2 overlap is ordered, not guessed (2026-11-13)

AC1 (native package present ⇒ `native-active`) and AC2 (`ENGRAM_URL` set ⇒
`external-server`) are both unconditional, so an install carrying both facts
collides. Resolution: `native-active` is the reported status — the native
extension is *why* nothing is registered, and it outranks the MCP path under
every configuration — while the same line states the external-server fact, so
AC2's "reported as a deliberate configuration" still holds in the overlap. Both
halves are pinned by tests (`the native package outranks the external server`,
and its `served by the external Engram server` assertion). Owner may overrule in
one line: the ordering is one `if` in `provisionEngram`.

## D2 — detection reads both scopes Pi reads (2026-11-13)

`<agentDir>/settings.json` always; `<cwd>/.pi/settings.json` only while the
project is trusted — Pi's own rule (`@earendil-works/pi-coding-agent@1.5.2`
`dist/core/settings-manager.js:228-229`, `docs/packages.md`). Reading only the
user file (the branch state this unit inherits) satisfied AC4's parenthetical but
left the AC1 defect in place for a project installed with `pi install -l`. The
trust argument is the one `declaredMcpServerPaths` already applies to `mcp.json`,
so both readers consult the same surface the host does.

## D3 — `ENGRAM_BIN` becomes a real resolution surface (2026-11-13)

AC3 requires that following every route the refusal names moves the operator
forward. Naming `ENGRAM_BIN` while the lookup ignored it reproduces the reported
defect one level down. `resolveEngramBinary` therefore resolves the override
first — an absolute path as given, a bare name through `PATH`, exactly as
Engram's own extension resolves it — and fails closed (no `PATH` fallback) when
the named binary does not resolve, because falling back would register a binary
the operator did not name.

## D4 — the deliberate outcomes notify at `info` (2026-11-13)

S2 says the native skip is reported "informatively". The level is decided in one
expression in the adapter (`ctx.ui.notify(message, ...)`), so `registered`,
`native-active` and `external-server` notify at `info` while `config-invalid`,
`binary-missing` and `unsupported-host` stay `warning`, and `not-consented` stays
silent. Pinned through the shipped entry, not inferred from the message text.

## Disclosed session side effect — the guard's record copy (2026-11-13)

The path-protection guard this session runs reads every `docs/{features,fix}/*/decisions.md`
from the **session cwd** (the primary checkout), while this unit's work happens in
the linked worktree `.worktrees/fix-531-engram-native-skip-remote-surfaces`. That
copy existed for the duration of the test-file edits and was removed afterwards;
it carried this file's block verbatim and no other content. It is recorded here
because an unrecorded write to the primary checkout is what this unit's own live-tree
rule forbids hiding.

It was created a second time for the correction batch (L3), for the one test-file
edit that batch needed, and removed again the same way. Both copies carried this
file's block verbatim and nothing else; the primary checkout ends clean
(`git status --porcelain` → 0 entries).

## D5 — the consent instruction names the file the switch is read from (2026-11-13)

`memory` is a base-config section: `loadConfig` merges it from
`agentic-workflow.json` (`src/config/load.ts:158`), whose section owner declares
it (`packages/agentic-workflow-schema/src/config.ts:241`). The extension file's
`ROOT_KEYS` (`src/config/schema.ts:39-53`) has no `memory` key, so the old
instruction — "set `memory: { engram: true }` in `pi-agentic-workflow.json`" —
sent the operator to a file that refuses the key and lands them on
`config-invalid`: a route that cannot work, the defect class issue #531 S3
repairs one message over. The name now comes from the schema's published
`BASE_CONFIG_FILE`, so one owner names the file and a future rename cannot make
the message lie again.
