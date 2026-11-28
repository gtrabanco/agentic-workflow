---
type: fix
scope: medium
# ac-hash: written below by the cut, after the Acceptance criteria section freezes
roadmap_summary: The durable-subagents layer stops failing on a stale hoisted host copy — the diagnostic names the resolved copy's version and the repair, resolution binds the running host first, and the declared peer range is enforced at the sandbox
---

# fix/755-hoisted-peer-stale

> Fix specification — a local, unpublished application against the repository's
> own surgery. Ledgers are frozen in `planning-evidence.md` and
> `planning-obligations.md` beside this doc (scope `medium`), never embedded.

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

**S1 — The diagnostic must name the resolved copy's version and the real repair.**
> 1. **The diagnostic misroutes the fix.** "Reinstall the package" cannot fix this: reinstalling `@gtrabanco/pi-agentic-workflow` never touches the hoisted host copy. The shim has the resolved path at hand (the error names it); reading the resolved copy's `package.json` version and reporting something like *"the extension sandbox resolves @earendil-works/pi-coding-agent@0.84.2 — update it (e.g. `bun add @earendil-works/pi-coding-agent` in the package manager dir) to satisfy the >=1.1.0 peer"* would point at the real repair.

**S2 — Resolution must bind the running host's own module instead of the sandbox's stale copy.**
> 2. **Resolution strategy.** Binding the host API through the bare specifier means every extension sandbox keeps its own (stale-able) host copy. Resolving against the running pi's own module (the path the host already knows — `subagents.js` already walks up from the shim, the host package root is derivable the same way) would remove the whole class of failure.

**S3 — The declared peer range must be enforced against the resolved copy.**
> 3. **Peer range is declared but unenforced at the sandbox.** `pi-agentic-workflow` declares `peerDependencies: { "@earendil-works/pi-coding-agent": ">=1.1.0" }`, yet the effective resolution in the sandbox violates it; nothing checks the resolved copy.

**S4 — The reported failure must stop: the layer loads.**
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

**S5 — The remediation the reporter verified must not be required by a user who never touches the sandbox.**
> Remediation that worked here: `cd ~/.pi/agent/npm && bun add @earendil-works/pi-coding-agent@1.7.0`, then restart sessions.

## Impact

- `packages/pi-agentic-workflow/src/extension/subagents.ts` — the resolution and the diagnostic (S1, S2, S3, S4).
- `packages/pi-agentic-workflow/test/subagents-provision.test.mjs` — the suite that pins the contract (S1–S5); its `test-obligation:` head stays.
- `packages/pi-agentic-workflow/README.md` — the subagents section's resolution/diagnostic narrative (S1, S2, S3).
- `docs/fix/755-hoisted-peer-stale/` — this unit doc and its two ledgers.
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

- `open`, 2026-11-28 — S2's second half ("resolving against the running pi's own module … would remove the whole class of failure") is delivered for this package's provision path only. A host-side resolution change that makes `pi-extensible-workflows`'s own bare specifier bind the running pi is the dependency's file, and this unit does not patch it.

## Future cost

- Any future edit to the diagnostic's first clause must keep the substring `pi-agentic-workflow: the durable-subagents layer did not load` — an installed session's operators and this suite's assertions both key on it.
- A new peer dependency on the host that the shim must verify adds its own `PEER_*` constant beside `HOST_PEER_RANGE`; the check is read from this package's own manifest, never restated as a literal.

## Applicable tests

`packages/pi-agentic-workflow/test/subagents-provision.test.mjs` — the existing suite, extended. Every case in it must stay green (S4 is the pre-existing contract) and the new cases below are added.

## Known pre-existing issues

- `#755` itself — this unit. Does not affect the sibling `serena-activation-check` contract (it asserts the manifest's two-entry array, untouched here).

## Tasks

- P1 — Freeze the ledgers and the acceptance criteria for this unit (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/755-hoisted-peer-stale/SPEC.md` exits 0)
  (Implements: S1, S2, S3, S4, S5)
  - Relevant files: docs/fix/755-hoisted-peer-stale/SPEC.md, docs/fix/755-hoisted-peer-stale/planning-obligations.md, docs/fix/755-hoisted-peer-stale/planning-evidence.md

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
  - Relevant files: docs/fix/755-hoisted-peer-stale/SPEC.md

## Triaged steps

> Focused, single-issue fix applied inline (the local unpublished workflow). No
> `runner unit-route --triage` block was produced: triage is the frozen ledger
> pair beside this doc, cut by the application's §5.

## Acceptance criteria

- **AC1 (S1)** — When the resolved host copy's version does not satisfy the declared peer range, the session diagnostic names that resolved version and a repair that updates the sandbox copy. Proven by `bun test test/subagents-provision.test.mjs` (case: `an out-of-range resolved host reports its version and the repair`) in `packages/pi-agentic-workflow`.
- **AC2 (S2)** — Resolution prefers a host module that satisfies the peer range over a sandbox copy that does not, and the layer loads through it. Proven by the same suite (case: `an in-range host module is preferred over an out-of-range sandbox copy`).
- **AC3 (S3)** — The check reads the range from this package's own `peerDependencies` rather than a literal, and a satisfied range produces no diagnostic. Proven by the same suite (case: `a satisfied peer range loads silently`).
- **AC4 (S4)** — The reported failure no longer occurs when a satisfiable host is reachable: the resolved factory's tools register and the pre-existing five tools remain the registered set. Proven by the same suite (cases `the resolved factory registers its tools through the host API`, `a scratch install shaped like the reporter's sandbox loads the layer`).
- **AC5 (S5)** — No repository surface requires a user to hand-edit `~/.pi/agent/npm`: the README states the resolution order and the one-line repair, and the package never writes to that directory. Proven by the same suite (README cases) plus `rg -n '\.pi/agent/npm' packages/pi-agentic-workflow/src` matching zero *writes*.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

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

Write the P2 RED cases into `packages/pi-agentic-workflow/test/subagents-provision.test.mjs` and observe them fail before any source change.

## References

- Issue #755.
- Precedent unit: `docs/fix/726-pi-package-defects/` (the shim this fix hardens).

## Branch

`fix/755-hoisted-peer-stale`

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
