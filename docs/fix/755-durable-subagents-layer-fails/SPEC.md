---
# Uncomment and set the keys the unit needs; until type/scope are set, the readers fall back to the folder
# (type) and scope).
type: fix
scope: small
# ac-hash: <sha256 of the ## Acceptance criteria section — the design step writes it>
roadmap_summary: durable-subagents layer fails after update — hoisted host stays pinned (0.84.2), pi update --all never refreshes it
---

# fix/755-durable-subagents-layer-fails

> Fix specification — one single unit document. Copy this folder to `docs/fix/<issue-number>-<topic>/`, fill every section, register the entry in the `## Fixes` table of `docs/ROADMAP.md`.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.1
schema: @gtrabanco/agentic-workflow-schema@4.10.1
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

```text
retention-declaration@1
path | disposition
TASKS.md | trimmable · legacy carrier
PLAN.md | trimmable
progress.md | trimmable · legacy carrier
ACCEPTANCE.md | trimmable · legacy carrier
testing.md | trimmable
CHECKLIST.md | trimmable
BRIEF.md | trimmable
pr-body.md | trimmable
external-verify.md | trimmable
review-findings.md | trimmable
planning-findings.md | trimmable
SPEC.md | kept
decisions.md | kept
known-issues.md | kept
planning-obligations.md | kept
planning-evidence.md | kept
architecture-notes.md | kept
sources.md | kept
research.md | kept
```

## Issue

`#755` — tracked issue in the project's forge. Required. The PR must close it via `Closes #755` in the body.

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim.

**S1 — Fix diagnostic to route the real repair.**
> The diagnostic misroutes the fix. "Reinstall the package" cannot fix this: reinstalling `@gtrabanco/pi-agentic-workflow` never touches the hoisted host copy. The shim has the resolved path at hand (the error names it); reading the resolved copy's `package.json` version and reporting something like *\"the extension sandbox resolves @earendil-works/pi-coding-agent@0.84.2 — update it (e.g. `bun add @earendil-works/pi-coding-agent` in the package manager dir) to satisfy the >=1.1.0 peer\"* would point at the real repair.

**S2 — Resolve against running pi's own module.**
> Resolution strategy. Binding the host API through the bare specifier means every extension sandbox keeps its own (stale-able) host copy. Resolving against the running pi's own module (the path the host already knows — `subagents.js` already walks up from the shim, the host package root is derivable the same way) would remove the whole class of failure.

**S3 — Enforce peer range at the sandbox.**
> Peer range is declared but unenforced at the sandbox. `pi-agentic-workflow` declares `peerDependencies: { \"@earendil-works/pi-coding-agent\": \">=1.1.0\" }`, yet the effective resolution in the sandbox violates it; nothing checks the resolved copy.

## Impact

What the fix touches beyond its own lines: the durable-subagents layer loader in pi-agentic-workflow, the extension sandbox resolution, the error diagnostic output, and the peer dependency enforcement.

## Surfaces

The batch scheduler's lane keys this unit occupies, one per line.

- `packages/pi-agentic-workflow` (durable-subagents layer)
- `packages/agentic-workflow` (subagents.js resolution path)

## Retirements

None — this fix corrects behavior, does not retire surfaces.

## Non-goals

- No change to `pi-extensible-workflows` package — it is a third-party extension.
- No change to bun's hoisting behavior — we work around it.
- No change to the bare specifier itself — we resolve the running pi's path instead.

## Risk tier

The unit's ceremony is proportional to risk, and the tier is **computed, never chosen**: `runner ceremony tier classify` reads the change's paths and contents and emits `passive | standard | high` (owner: `skills/execute-phase/references/risk-tiers.md`, block `risk-tier-verdict@1`).

- **`standard`** — the ceremony this document describes.

**Task Size = Understood + Contained risk + Resumable-from-diff.**

- **Tier** — `<standard>` · **Task Size** — `<verdict.task_size>`
- **Named high-risk item** — `none — not a high-tier unit`

## Future

Ideas the user deferred ("down the road I'd like…"), captured verbatim with a date and a status.

- None deferred at this time.

## Future cost

Standing obligations this fix imposes on future work.

- The durable-subagents layer loader must always resolve against the running pi's module path, not through bare specifier hoisting.
- Peer dependency enforcement for extension sandbox must be re-checked on every `pi update`.

## Applicable tests

The tests this fix will run (triage-decided).

- `bun test packages/pi-agentic-workflow/test/*`
- `bun test packages/agentic-workflow/test/*`
- `bun scripts/run-root-suite.mjs` (node-compatible subset)
- Durable-subagents load test: verify no error message with stale hoisted copy

## Known pre-existing issues

- **#654** — guard-layer (related: extension sandbox setup). Does not affect: this fix is purely resolution/diagnostic.
- **#444** — decision-substrate (related: pi version delta, but not directly). Does not affect: this fix is version-agnostic.

## Tasks

P1…Pn with stable IDs, one line each, smallest first.

- P1 — Fix diagnostic to report resolved path and real repair command (validator: `rg 'hoisted' packages/pi-agentic-workflow/src/` shows diagnostic includes resolved path + update command)
  (Implements: S1)
  - Relevant files: packages/pi-agentic-workflow/src/durable-subagents

- P2 — Resolve durable-subagents layer against running pi's own module path (validator: `rg 'subagents' packages/agentic-workflow/src/` shows resolution uses running pi path)
  (Implements: S2)
  - Relevant files: packages/agentic-workflow/src/subagents.js, packages/pi-agentic-workflow/src/durable-subagents

- P3 — Add peer dependency check at sandbox resolution (validator: `rg 'peer' packages/pi-agentic-workflow/src/` shows version check)
  (Implements: S3)
  - Relevant files: packages/pi-agentic-workflow/src/durable-subagents

- P4 — Verification: run root suite + durable-subagents load test (validator: `bun scripts/run-root-suite.mjs` exits 0, no error message with stale hoisted copy)
  (Implements: S1-S3)

### Planning evidence

One row per Engineering claim (the closed column order and vocabularies are owned by `skills/pre-execution-review/references/LEDGERS.md`).

### Obligations

One row per normative behaviour, compatibility invariant, affected use case, and required failure state.

## Triaged steps

> Paste the `## Triaged steps` block from `runner unit-route --triage <slug>` here verbatim. This block is the machine's authoritative step list; the lane never re-derives or reorders it (owner: `skills/unit-lane/SKILL.md` §Turn contract).

## Findings

OPEN rows only: a row a review persisted as fix-now work and no fold has closed yet.

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

Append-only. `L1` is the issue text verbatim; every later line carries one kind token from the closed set.

```text
log-kind@1
kind | token | what the line records
L | L<n> | the request or a correction, quoting the requester verbatim
E | E<n> | an evidence run — the command, its exit code and its output
G | G<n> | a gate run — the command and its exit code
F | F<n> | a folded finding — the fold commit and what was verified
D | D<n> | an owner decision — the authority and what was decided
P | P<n> | a phase's progress — what was done and the commit
R | R<n> | a review run — `HEAD <sha>`, the verdict, the cycle and the gate exit
V | V<n> | a finding's verification — the row it signs, the recheck and its result
```

- **L1** — 2026-11-28, the issue, verbatim:
  ```
  BUG: durable-subagents layer fails after update — the extension sandbox's hoisted @earendil-works/pi-coding-agent stays pinned (0.84.2) and pi update --all never refreshes it
  ```

## Next

The single next action: run triage and begin P1 (fix diagnostic).

## References

- Issue: [#755](https://github.com/gtrabanco/agentic-workflow/issues/755)
- PR closes: Closes #755
- #654 — guard-layer (related extension sandbox setup)
- #444 — decision-substrate (related pi version delta)

## Branch

`fix/755-durable-subagents-layer-fails`

## Depends on

Other fixes (by folder name) that must merge first. Empty if independent.

## Regression scope

What previously-working behaviour must NOT break. Each row: the scenario and the test/command that verifies it.

- Durable-subagents layer loads successfully with stale hoisted copy (validator: no error message when hoisted copy is 0.84.2 and running pi is 1.7.0)
- Diagnostic output includes resolved path + update command (validator: error text contains "hoisted" + version number + `bun add` command)
- Peer dependency enforcement does not break valid installations (validator: `bun test packages/pi-agentic-workflow/test/durable-subagents.test.mjs` green)