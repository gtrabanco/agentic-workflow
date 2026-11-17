---
"@gtrabanco/pi-agentic-workflow": patch
---

fix(deps): bump the pi-extensible-workflows pin from 6.3.0 to 6.4.0

The registry published 6.4.0 on 2026-11-16 with no GitHub release, so the window
was read from `CHANGELOG.md` at the upstream `v6.4.0` tag and cross-checked
against the two npm tarballs. **The release is a breaking change shipped as a
minor on purpose** — upstream says so in its own changelog ("an explicit
operator choice, not a SemVer-compliant version") — and it lands on this package
because the extension is registered **by path** (`pi.extensions` →
`node_modules/pi-extensible-workflows/dist/subagents/index.js`).

**What changes for this package's users.** The extension no longer shows its own
release-notes notice at startup, and `pi-extensible-workflows/changelog-state.json`
is no longer read or written (upstream's file, never ours — delete it if it is
there). Pi shows a package's `CHANGELOG.md` under *Extension Updates* only for
npm- or git-installed packages, so a path-loaded extension shows **no release
notes** at all. Nothing else in the extension's user surface disappears: the
five subagent tools, their schemas and the durable run records are unchanged.

**The window, entry by entry** (9 of 9 changelog bullets, the breaking one first):

- *Breaking — the release-notes notice is gone*: affects us; documented above,
  no code involved.
- *`worktreeSetup`* (shell commands run inside each newly created workflow or
  subagent worktree; `WORKTREE_FAILED` plus removal on failure or a 10-minute
  timeout): a new setting, adopted by nobody; it fires only for worktrees this
  extension creates, not for the `git worktree add` this repository's own recipe
  runs. Recorded as a proposal for the owner, not part of this bump.
- *`reviewLoop.sharedReviewer`*: a new option on a workflow function this
  repository never calls (the starter extension is not loaded); it would trade
  cross-iteration reviewer independence for cost, so it is proposed with a
  recommended reject.
- *`@piewf/cli` bundles Pi 1.5.2*: does not affect us — this package neither
  ships nor invokes that CLI.
- *`minimatch` `^10.2.5` → `^11.0.8`* (`GHSA-g3hv-75wg-m249`): resolution only.
  The workspace lock moves the top-level `minimatch` `10.2.6` → `11.0.9` and
  adds `@isaacs/nonrecursive-glob-match`; Pi's own declared `10.2.6` stays nested
  under `@earendil-works/pi-coding-agent`, so the advisory pass keeps reporting
  that copy report-only — it is Pi's manifest, not this package's.
- *Prompt inspection on Pi ≥ 1.2.0*: engine surface, never loaded here.
- *Home/End end the notices again in the agents workspace on Pi 1.5*: the
  keybinding matcher is inside the bundle this package loads, so `/subagents`
  gets the wider action set back.
- *`piewf doctor cleanup` tolerates a borrowed worktree already removed*: the
  store deciding it is inside the loaded bundle, so a subagent record whose
  borrowed worktree was removed by hand is no longer refused as un-retainable.
- *`subagents_run`'s description documents extension-owned options*: the model
  reads it, the schema is unchanged.

**What it means in code.** Nothing to adapt: no module of this package imports
the dependency, and the bundle already required the peer-resolved `typebox` at
load time in 6.3.0 (`typebox/value`, `typebox/compile`), so 6.4.0 unifying its
`Type` import on that same instance adds no resolution requirement. The lockfile
rides the same commit, refreshed with `bun install` — the importer's pin, the
`pi-extensible-workflows` entry and the `minimatch` resolutions its dependency
change forces, nothing else.
