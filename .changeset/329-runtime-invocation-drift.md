---
"@gtrabanco/pi-agentic-workflow": patch
---

fix(skills): re-decide the shell-tool choice every turn and gate the wrong-tool literals

**The correction now has a machine half (issue #329).** Four prose rounds did not
stop sessions from invoking `node` where the bun-first convention orders `bun`,
because nothing re-ordered the choice at command time and the repo's own
artifacts taught the wrong tool. This change makes the choice a per-turn box in
both executor skills, states the normative rule in both agent guides (bun before
node on manual invocation, `rg` before `grep` on search, both fallbacks
legitimate, availability checked once with `setup-env.mjs --check`), and sweeps
the literals: seventeen `usage: node` strings in twelve scripts move to the bun
form, five skill lines that taught `node scripts/…` move to `bun`, and one
`node` line keeps its place because it declares the fallback on the same line.
The bootstrap pair (`setup-env.mjs`, `update-tools.mjs`) keeps its node usage
string by declaration — `setup-env` provisions bun, so it cannot print a bun
usage string on a machine that has no bun yet.

`scripts/invocation-drift.mjs` is the new deterministic gate: it fails closed on
an undeclared wrong-tool usage string, a skill literal with no adjacent fallback
declaration, a missing guide sentence or turn box, a stale bootstrap allowlist,
or a missing suite carve-out, and the root suite runs it. The deleted-skill
guard in `scripts/pre-execution-quality.test.mjs` now registers a skip the
runner counts (`1 skip`, `0 fail` under both `node --test` and `bun test`)
instead of exiting 0 silently, so a whole guarded file can no longer read as a
green test. The ripgrep search feature stays #269's; this change owns the tool
choice only.
