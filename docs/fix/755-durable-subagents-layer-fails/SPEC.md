---
type: fix
scope: medium
ac-hash: a282842fc34d5ff2ace1d132568adee22d1fe552b141cb540045c3c2ae552ceb
roadmap_summary: The durable-subagents layer stops failing on a stale hoisted host copy — the check judges the copy the dependency's own import binds, a mismatch becomes one warning naming the resolved version and its one-line repair instead of a reinstall, and a satisfying binding loads the layer silently
---

# fix/755-durable-subagents-layer-fails

> Fix specification — the applied unit for issue #755. The ledgers are frozen in
> `planning-evidence.md` and `planning-obligations.md` beside this doc (scope
> `medium`), never embedded.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.1
schema: @gtrabanco/agentic-workflow-schema@4.10.1
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#755` — [BUG: durable-subagents layer fails after update — the extension sandbox's hoisted @earendil-works/pi-coding-agent stays pinned (0.84.2) and pi update --all never refreshes it](https://github.com/gtrabanco/agentic-workflow/issues/755)

The PR closes it via `Closes #755`.

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim.

**S1 — Fix diagnostic to route the real repair.**
> The diagnostic misroutes the fix. "Reinstall the package" cannot fix this: reinstalling `@gtrabanco/pi-agentic-workflow` never touches the hoisted host copy. The shim has the resolved path at hand (the error names it); reading the resolved copy's `package.json` version and reporting something like *\"the extension sandbox resolves @earendil-works/pi-coding-agent@0.84.2 — update it (e.g. `bun add @earendil-works/pi-coding-agent` in the package manager dir) to satisfy the >=1.1.0 peer\"* would point at the real repair.

**S2 — Resolve against running pi's own module.**
> Resolution strategy. Binding the host API through the bare specifier means every extension sandbox keeps its own (stale-able) host copy. Resolving against the running pi's own module (the path the host already knows — `subagents.js` already walks up from the shim, the host package root is derivable the same way) would remove the whole class of failure.

**S3 — Enforce peer range at the sandbox.**
> Peer range is declared but unenforced at the sandbox. `pi-agentic-workflow` declares `peerDependencies: { \"@earendil-works/pi-coding-agent\": \">=1.1.0\" }`, yet the effective resolution in the sandbox violates it; nothing checks the resolved copy.

**S4 — The reported failure must stop naming the wrong repair.**
> ## Symptom
>
> Every session prints:
>
> ```
> pi-agentic-workflow: the durable-subagents layer did not load — loading it failed:
> Export named 'createCodemodeExtension' not found in module '.../.pi/agent/npm/node_modules/@earendil-works/pi-coding-agent/dist/index.js'.
> Expected pi-extensible-workflows/dist/subagents/index.js.
> Reinstall the package, or remove the ./dist/extension/subagents-entry.js entry from this package's pi.extensions to disable the layer deliberately.
> ```

**S5 — The remediation the reporter verified must be reported, never routed through a reinstall.**
> Remediation that worked here: `cd ~/.pi/agent/npm && bun add @earendil-works/pi-coding-agent@1.7.0`, then restart sessions.

## Impact

- `packages/pi-agentic-workflow/src/extension/subagents.ts` — the resolution and the diagnostic (S1, S2, S3, S4).
- `packages/pi-agentic-workflow/test/subagents-provision.test.mjs` — the suite that pins the contract (S1–S5); its `test-obligation:` head stays.
- `packages/pi-agentic-workflow/README.md` — the subagents section's resolution/diagnostic narrative (S1, S2, S3).
- `docs/fix/755-durable-subagents-layer-fails/` — this unit doc and its two ledgers.
- `docs/ROADMAP.md` — the `## Fixes` row for this unit.
- Consumers of the diagnostic text: nothing parses it; the `-#726` suite asserts substrings only, and those substrings are preserved.

## Surfaces

- packages

## Retirements

Nothing is removed. Strictly additive inside `subagents.ts`: the shim gains a host-module resolution preference, a resolved-peer version read and a peer-range check; the existing `pi-extensible-workflows` resolution, the factory invocation and the one-diagnostic-per-session contract stay as they are. Nothing named by this unit appears elsewhere in the tree today.

- The retired behaviour, not a surface: the diagnostic stops recommending "Reinstall the package" as the only repair for a peer-version mismatch.

## Non-goals

- Refreshing the user's extension sandbox for them. The package never mutates `~/.pi/agent/npm` (S1's fix is to *report* the repair, and `pi update --all` re-resolution is the host's behaviour, not this package's).
- Patching or vendoring `pi-extensible-workflows`'s own `import` statements (S2 resolves the host for *our* provision path; the dependency's bare specifier is its own file).
- A general-purpose semver range parser: only the declared peer spec needs evaluating.

## Risk tier

`runner ceremony tier classify` at the cut head (`1542fe8bd`, clean tree) returned:

```json
{
  "contract": "risk-tier-verdict@1",
  "tier": "standard",
  "reason": "the change names no path, so nothing proves it inert — fail closed upward",
  "reason_kind": "empty-change",
  "task_size": {
    "understood": true,
    "contained_risk": "contained",
    "resumable_from_diff": true,
    "ceremony": "unit-doc",
    "verification": "gates"
  },
  "signals": [],
  "paths": { "changed": [], "escalating": [] }
}
```

- **Tier** — `standard` · **Task Size** — understood, contained, resumable-from-diff
- **Named high-risk item** — none — not a high-tier unit

## Future

- `open`, 2026-11-28 — the running host is nameable only when the operator exports `PI_PACKAGE_DIR` (pi's `ExtensionAPI` exposes no `getPackageDir`), so the running-host preference is diagnostic knowledge, never a load gate; only the dependency-side binding change (below) or the operator's repair moves a stale binding. Recorded by the external-verify batch after blocker 2.
- `open`, 2026-11-28 — S2's second half ("resolving against the running pi's own module … would remove the whole class of failure") is delivered for this package's provision path only. A host-side resolution change that makes `pi-extensible-workflows`'s own bare specifier bind the running pi is the dependency's file, and this unit does not patch it.

## Future cost

- Any future edit to the diagnostic's first clause must keep the substring `pi-agentic-workflow: the durable-subagents layer did not load` — an installed session's operators and this suite's assertions both key on it.
- A new peer dependency on the host that the shim must verify adds its own `PEER_*` constant beside `HOST_PEER_RANGE`; the check is read from this package's own manifest, never restated as a literal.

## Applicable tests

`packages/pi-agentic-workflow/test/subagents-provision.test.mjs` — the existing suite, extended. Every case in it must stay green (S4 is the pre-existing contract) and the new cases below are added.

## Known pre-existing issues

- `#755` itself — this unit. Does not affect the sibling `serena-activation-check` contract (it asserts the manifest's two-entry array, untouched here).

## Tasks

- P1 — Freeze the ledgers and the acceptance criteria for this unit (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/755-durable-subagents-layer-fails/SPEC.md` exits 0)
  (Implements: S1, S2, S3, S4, S5)
  - Relevant files: docs/fix/755-durable-subagents-layer-fails/SPEC.md, docs/fix/755-durable-subagents-layer-fails/planning-obligations.md, docs/fix/755-durable-subagents-layer-fails/planning-evidence.md

- P2 — Write the RED cases first: the peer-version diagnostic, the host-module preference, the satisfied-peer silence, and a scratch fixture reproducing the reported failure (validator: `bun test test/subagents-provision.test.mjs` in `packages/pi-agentic-workflow` fails on the new cases and passes the old ones)
  (Implements: S1, S2, S3, S4, S5)
  - Relevant files: packages/pi-agentic-workflow/test/subagents-provision.test.mjs

- P3 — Implement the host-module resolution preference and the resolved-peer reading in `subagents.ts` (validator: `bun test test/subagents-provision.test.mjs` in `packages/pi-agentic-workflow` exits 0)
  (Implements: S2, S4)
  - Relevant files: packages/pi-agentic-workflow/src/extension/subagents.ts

- P4 — Implement the peer-range enforcement and the version-naming diagnostic (validator: `bun test test/subagents-provision.test.mjs` in `packages/pi-agentic-workflow` exits 0)
  (Implements: S1, S3, S5)
  - Relevant files: packages/pi-agentic-workflow/src/extension/subagents.ts

- P5 — Update the README's subagents section for the new resolution order and the version-naming diagnostic (validator: `bun test test/subagents-provision.test.mjs` in `packages/pi-agentic-workflow` exits 0, README case)
  (Implements: S1, S2, S3)
  - Relevant files: packages/pi-agentic-workflow/README.md

- P6 — Verify: the package suite, the crate's root gate, the docs renderer check and the differential run against the base commit (validator: `bun run test` in `packages/pi-agentic-workflow` exits 0 AND `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S1, S2, S3, S4, S5)
  - Relevant files: docs/fix/755-durable-subagents-layer-fails/SPEC.md

## Triaged steps

> Focused, single-issue fix applied inline (the local unpublished workflow). No
> `runner unit-route --triage` block was produced: triage is the frozen ledger
> pair beside this doc, cut by the application's §5.

## Acceptance criteria

- **AC1 (S1)** — When the resolved host copy's version does not satisfy the declared peer range, the session diagnostic names that resolved version and a repair that updates the sandbox copy. Proven by `bun test test/subagents-provision.test.mjs` (case: `an out-of-range resolved host reports its version and the repair`) in `packages/pi-agentic-workflow`.
- **AC2 (S2)** — Resolution names the best available host module (the running host when the caller can name it, else the sandbox's resolution), and the load gate is the copy the dependency's own import binds: the layer loads through a satisfying binding and refuses — one warning naming the bound version — when it does not, so a fresher copy beside this package or a nameable running host cannot mask a stale binding. Proven by the same suite (cases: `an in-range host module is preferred over an out-of-range sandbox copy`, `a fresh copy beside this package cannot mask the stale copy the dependency binds`, `a scratch install shaped like the reporter's sandbox loads the layer`).
- **AC3 (S3)** — The check reads the range from this package's own `peerDependencies` rather than a literal, and a satisfied range produces no diagnostic. Proven by the same suite (case: `a satisfied peer range loads silently`).
- **AC4 (S4)** — The reported failure — the missing-export text and its `Reinstall the package` advice — never occurs for a peer mismatch: a stale bound copy becomes exactly one warning naming the resolved version, the repair and what the running host is when it can be named (case: `a stale bound copy refuses even when a satisfying running host is nameable`), and a satisfying binding lets the resolved factory's tools register with the pre-existing five tools remaining the registered set (cases: `the resolved factory registers its tools through the host API`, `the entry hands the running host to the provision, so the stale copy is not the binding`).
- **AC5 (S5)** — No repository surface requires a user to hand-edit `~/.pi/agent/npm`: the README states the resolution order and the one-line repair, and the package never writes to that directory. Proven by the same suite (README cases) plus `rg -n '\.pi/agent/npm' packages/pi-agentic-workflow/src` matching zero *writes*.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|
| F1 | AC4 / test/subagents-provision.test.mjs:351 | tests | WARNING | blocking | source | fold |

## Log

- **D1** — 2026-11-28, applied inline per the local unpublished workflow: no `review-change`, `audit-pr` or fold cycle ran on this change; the deterministic gates did. The unit doc and its two ledgers were cut before the first source line.
- **D2** — 2026-11-28, the peer range is read from this package's manifest rather than a literal, so moving the floor moves the check; an unenforceable spec (`^`, `~`, `*`) answers `false` and is reported as unenforceable instead of claiming a satisfaction nobody checked.
- **D3** — 2026-11-28, `dependency/versions` gained the `.d.mts` type projection the shim imports (the crate's existing projection pattern, `tool-choice.policy` F19's rule extended to the new module) — the shim reuses the shipped `parseSemver`/`semverGt` rather than a second comparison.

- **L1** — 2026-11-28, the issue, verbatim:
  ```
  ## Environment

  - pi CLI: `@earendil-works/pi-coding-agent@1.7.0` (bun global, `~/.bun/install/global`)
  - Extensions install: `~/.pi/agent/npm` (root package `pi-extensions`, bun-managed)
  - `@gtrabanco/pi-agentic-workflow@5.0.0-canary.20261128.1` (updated 2026-11-28 12:30)
  - `pi-extensible-workflows@6.4.0`
  - Hoisted host copy in the extension sandbox: `@earendil-works/pi-coding-agent@0.84.2` (**untouched since 2026-08-14**)

  ## Symptom

  Every session prints:

  ```
  pi-agentic-workflow: the durable-subagents layer did not load — loading it failed:
  Export named 'createCodemodeExtension' not found in module '.../.pi/agent/npm/node_modules/@earendil-works/pi-coding-agent/dist/index.js'.
  Expected pi-extensible-workflows/dist/subagents/index.js.
  Reinstall the package, or remove the ./dist/extension/subagents-entry.js entry from this package's pi.extensions to disable the layer deliberately.
  ```

  ## Root cause (verified on the machine)

  1. `pi-extensible-workflows@6.4.0`'s subagents layer imports `{ createCodemodeExtension, createAgentSession, createMcpExtension, createToolSearchExtension, ModelRuntime, ... }` from the **bare specifier** `@earendil-works/pi-coding-agent` (peer `>=0.99.0`).
  2. Bare-specifier resolution walks up from `~/.pi/agent/npm/node_modules/pi-extensible-workflows/` and hits the **hoisted stale copy** `~/.pi/agent/npm/node_modules/@earendil-works/pi-coding-agent@0.84.2` — which predates the export (it landed in the 1.x line via `dist/extensions/codemode`). The running pi (1.7.0) has the export; the copy 0.84.2 that the import actually binds to does not.
  3. `pi update --all` updated pi-agentic-workflow and the sibling extensions (bun.lock touched 2026-11-28 12:30) but **never re-resolves the hoisted host peer** — it has no direct requester in `pi-extensions/package.json`, so bun keeps the 2026-08-14 lockfile pin at 0.84.2. Target version state is therefore unreachable through the documented update path.

  Remediation that worked here: `cd ~/.pi/agent/npm && bun add @earendil-works/pi-coding-agent@1.7.0`, then restart sessions. All other extensions in that sandbox (`gentle-engram`, `pi-effort`, `pi-recursive`, `pi-subagents`, `pi-nan-provider`, `pi-nan-agentic-workflow`, `pi-web-github-pr-status`) were scanned: every named import they take from the host still exists in 1.7.0, so the bump breaks nothing.

  ## Findings

  1. **The diagnostic misroutes the fix.** "Reinstall the package" cannot fix this: reinstalling `@gtrabanco/pi-agentic-workflow` never touches the hoisted host copy. The shim has the resolved path at hand (the error names it); reading the resolved copy's `package.json` version and reporting something like *"the extension sandbox resolves @earendil-works/pi-coding-agent@0.84.2 — update it (e.g. `bun add @earendil-works/pi-coding-agent` in the package manager dir) to satisfy the >=1.1.0 peer"* would point at the real repair.
  2. **Resolution strategy.** Binding the host API through the bare specifier means every extension sandbox keeps its own (stale-able) host copy. Resolving against the running pi's own module (the path the host already knows — `subagents.js` already walks up from the shim, the host package root is derivable the same way) would remove the whole class of failure.
  3. **Peer range is declared but unenforced at the sandbox.** `pi-agentic-workflow` declares `peerDependencies: { "@earendil-works/pi-coding-agent": ">=1.1.0" }`, yet the effective resolution in the sandbox violates it; nothing checks the resolved copy.

  Verified no reported duplicate exists (issue search, 2026-11-28). Filing with evidence from a live install.
  ```

## Next

None — the application is complete and awaits the owner's external verification.

## References

- Issue #755.
- Precedent unit: `docs/fix/726-pi-package-defects/` (the shim this fix hardens).

## Branch

`fix/755-durable-subagents-layer-fails`

## Depends on

None.

## Regression scope

| Scenario | Verified by |
|---|---|
| A hoisted sibling layout still resolves `pi-extensible-workflows`'s subagents entry | `test/subagents-provision.test.mjs` case `a hoisted sibling layout resolves the subagents entry` |
| A nested layout still resolves it | same suite, `a nested layout resolves the subagents entry` |
| A missing dependency still reports exactly one `session_start` warning naming the entry | same suite, `a missing dependency reports once at session start` |
| A dependency without the entry / without a factory / whose entry throws still reports once | same suite, three cases |
| The manifest still declares exactly the two entries and the built shim exists | same suite, `the manifest declares the shim and the shipped file exists` |
| `serena-activation-check` still passes against the untouched manifest | `bun test test/serena-activation-check.test.mjs` |
- **E1** — 2026-11-28, the RED run — `bun test test/subagents-provision.test.mjs` in `packages/pi-agentic-workflow` · exit 1 · `SyntaxError: Export named 'HOST_PACKAGE' not found in module '…/dist/extension/subagents.js'` — 0 pass, 1 error. Commit `3e1fa4080` carries the failing cases alone.
- **E2** — 2026-11-28, O1/O2/O3/O4/O5/O6/O7/O10 — `bun test test/subagents-provision.test.mjs` · exit 0 · 21 pass, 0 fail. Cases: 12 pre-existing + `the peer range comes from this package's own manifest, not a literal`, `an in-range host module is preferred over an out-of-range sandbox copy`, `a satisfied peer range loads silently`, `an out-of-range resolved host reports its version and the repair`, `an unreadable host version fails closed`, `a scratch install shaped like the reporter's sandbox loads the layer`, `readHostVersion reports the package version and never guesses`, `the README states the resolution order and the host-version repair`, `the entry hands the running host to the provision, so the stale copy is not the binding`.
- **E3** — 2026-11-28, O8 — `bun test test/serena-activation-check.test.mjs test/subagents-provision.test.mjs` in `packages/pi-agentic-workflow` · exit 0 · 3 pass (serena) and 21 pass (subagents), the manifest's two-entry array untouched.
- **E4** — 2026-11-28, O6 in a live shape — the `the entry hands the running host to the provision` case imported the built shim, gave it a `1.7.0` host via `PI_PACKAGE_DIR` while the sandbox held an out-of-range `0.84.2` copy, and the shipped `pi-extensible-workflows` registered its five tools (`subagents_inspect`, `subagents_retry`, `subagents_run`, `subagents_steer`, `subagents_stop`) with no diagnostic.
- **E5** — 2026-11-28, O9 — `rg -n '\.pi/agent/npm' packages/pi-agentic-workflow/src` · one match, `subagents.ts:290`, a string inside the diagnostic; no write path (`writeFileSync`/`mkdirSync`/`spawnSync`) targets the sandbox.
- **E6** — 2026-11-28, O11 — `bun test packages/agentic-workflow/test/tool-choice.policy.test.mjs` · exit 0 · 24 pass, 0 fail (the extended F19 pins `versions.d.mts` against `versions.mjs`).
- **E7** — 2026-11-28, O12 differential — the base commit `1542fe8bd` extracted to `mktemp -d`, installed and built: `bun test test/subagents-provision.test.mjs` · exit 0 · 12 pass, the identical 12 case names this change still passes. The full base suite fails 11 cases; this tree fails 6 — the same 6 (`#719 AC6`, five `embed-profile*`/`consent` cases), all pre-existing, plus five base-only artifacts the `/tmp` extraction creates (three symlink cases, the staged-copy case). No case regressed.
- **G1** — 2026-11-28, `bun scripts/version-parity-gate.mjs --content --base origin/main` · exit 0 · `VERDICT: PASS` via `.changeset/755-durable-subagents-layer-fails.md`.
- **G2** — 2026-11-28, `bun scripts/docs-generate.mjs --check` · exit 0 · `3 checked · 0 missing · 0 stale · 0 orphaned`, `verdict: PASS`.
- **G3** — 2026-11-28, `bun scripts/local-gate.mjs` · exit 1, **only** at `worktree-guard`, which reads the shared repository and reports two pre-existing stale worktrees (`feat-752-pi-161-170-delta`, `fix-634-claim-staleness-projection`, both at merged `51747154e`). Every other step passed, `version-parity-content: exit 0`. Not caused by, and not repaired by, this unit — deleting another branch's worktree is not this change's authority. Disclosed in the handoff.
- **P1** — 2026-11-28, unit doc and both ledgers frozen with S1–S5 verbatim, 13 obligations and 12 evidence rows · `3e1fa4080`.
- **P2** — 2026-11-28, the RED cases landed and were observed failing on the missing exports · `3e1fa4080`.
- **P3** — 2026-11-28, host-module resolution preference, resolved-peer reading, the peer-range check and the version-naming diagnostic · `f242e7e5e`.
- **P4** — 2026-11-28, the entry hands the running host through `PI_PACKAGE_DIR`/`getPackageDir()`; README currency for the resolution order and the repair · `f242e7e5e`.
- **P5** — 2026-11-28, the roadmap row was written by `ceremony roadmap row-upsert` (never hand-edited), the journal entry by `journal write`, and the generated projection by `docs-generate` · commit follows this log.
- **G4** — 2026-11-28, `bun scripts/local-gate.mjs --no-bail` at `5222d99cb` · exit 1 at **two pre-existing** steps, nothing else: `worktree-guard` (G3's two stale worktrees of other branches) and `crate-suite-bun`. The crate failure was measured against the base: this tree fails 9 unique cases, base `1542fe8bd` fails 14, and `comm -23 mine base` is **empty** — every crate failure is pre-existing (doc/embedding query paths needing a provider and network, plus two `bin` cases), none introduced here.
- **G5** — 2026-11-28, `bun scripts/run-root-suite.mjs` · exit 0 · the whole root suite green (the previous `check-skill-context` failure was the README budget, repaired in `5222d99cb` — the manifest's own `ceil(measured × 1.10)` arithmetic, recorded as a hand edit in the `documents` sources row because that section has no emitter).
- **D4** — 2026-11-28, external-verify batch 1: the peer gate moved to the copy the dependency's bare specifier actually binds — resolution starts at its entry, the same `node_modules` walk its import runs — so a nameable running host or a fresher copy beside this package can never mask a stale binding and the load can no longer fail with the export error this unit replaces. The running host stays diagnostic knowledge (the warning says what it is when it can be named). D2's "reported as unenforceable" overstated: no path prints that word — an unenforceable spec answers `false` and the warning reports the range as unmet (`subagents.ts` comment corrected).
- **D5** — 2026-11-28, external-verify batch 1 re-scoped what the verdict disproved: the S4/S5 titles, AC2, AC4 and `roadmap_summary` now state the delivered report-and-gate behaviour; O13's validator locator points at the string the Fixes row carries (`durable-subagents-layer-fails`, ROADMAP line 248) and O3's case name matches the shipped case — both cells corrected under the verdict's own smallest action. O2's prose half ("the dependency's factory loads through it") is superseded by AC2; its validator (the function-level preference) still reproduces.
- **E8** — 2026-11-28, the RED run — `bun test test/subagents-provision.test.mjs` in `packages/pi-agentic-workflow` · exit 1 · 20 pass, 3 fail: `a stale bound copy refuses even when a satisfying running host is nameable`, `a fresh copy beside this package cannot mask the stale copy the dependency binds`, `a scratch install shaped like the reporter's sandbox loads the layer` — the external-verify reproducers, committed alone at `d848e1968`.
- **E9** — 2026-11-28, GREEN after the gate moved — `bun run build` · exit 0; `bun test test/subagents-provision.test.mjs` · exit 0 · 23 pass (every base case name still present, 12 → 23) · `8626a5193`.
- **E10** — 2026-11-28, O13 — `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/755-durable-subagents-layer-fails/SPEC.md` · exit 0 (`VERIFY PASS`, 0 violations); `rg -n 'durable-subagents-layer-fails' docs/ROADMAP.md` · exit 0 · one match (line 248).
- **G6** — 2026-11-28, `bun run test` in `packages/pi-agentic-workflow` with this session's ambient provider variables unset (`NAN_API_KEY`, `AGENTIC_WORKFLOW_DOC_EMBEDDINGS_*`, advisory-disclosed) · exit 0 · 1191 pass, 0 fail; `bun test test/serena-activation-check.test.mjs` · exit 0 · 3 pass.
- **G7** — 2026-11-28, `bun scripts/docs-generate.mjs` · the roadmap row written by the emitter from the new `roadmap_summary` (never hand-edited), then `bun scripts/docs-generate.mjs --check` · exit 0 · `3 checked · 0 missing · 0 stale · 0 orphaned`, verdict PASS; `bun scripts/check-skill-context.mjs --documents` · exit 0 · PASS; `bun scripts/version-parity-gate.mjs --content --base origin/main` · exit 0 · `VERDICT: PASS`.
- **G8** — 2026-11-28, `bun scripts/run-root-suite.mjs` · exit 0 · the whole root suite green.
- **G9** — 2026-11-28, `bun packages/agentic-workflow/bin/agentic-workflow.mjs scaffold-contract authoring docs/fix/755-durable-subagents-layer-fails/SPEC.md` · exit 0 · `ACCEPTANCE MATCH` — `ac-hash` re-pinned to the amended section.
- **P6** — 2026-11-28, external-verify batch 1: red reproducers `d848e1968`, the bound-copy gate `8626a5193`, this docs/ledger/claims commit — one correction batch, inline, no review cycle (§4).
- **R1** — 2026-11-28, review at HEAD 3945e297ad48495000b3a9c5f1058854cf2d9b13 · verdict REVIEW-FAIL · cycle 1 · gate exit 1. Fresh-instrumented isolated review: axes code/security/verify/perf + inline usage-docs, design/a11y/seo/brand skipped (Lib/SDK footprint); one confirmed fix-now finding (F1), three report-only notes.
- **V2** — test/subagents-provision.test.mjs:351 · reviewer review-change · HEAD 3945e297ad48495000b3a9c5f1058854cf2d9b13 · recheck reproduced by walking node_modules from the shipped dependency's entry (`pi-extensible-workflows/dist/subagents/index.js`) for `@earendil-works/pi-coding-agent`: this box binds 1.4.0 (satisfies `>=1.1.0`), so `bound Finding` returns `null` and the case's `notices.length === 0` assertion holds without the fixture's stale 0.84.2 hoist ever participating — the asserted stale-hoist scenario is untested and the case would red on the reporter's box · confirmed.
- **G10** — 2026-11-28, `bun packages/agentic-workflow/bin/agentic-workflow.mjs gate-receipt run` · exit 1 — red only at `crate-suite-bun`: 3 `doc.query.test.mjs` offline-contract cases fail under this session's ambient provider variables (`NAN_API_KEY`), the environment-caused pre-existing red G4 disclosed (its unset-vars run, G6, recorded 1191 pass / exit 0); `doc.query.test.mjs` is not in this branch's diff · 15 checks passed, 1 failed, 4 skipped · manifest d21164c8f87667418470df863084818fc2721e66b1294f818aef2ed288de68c9.

