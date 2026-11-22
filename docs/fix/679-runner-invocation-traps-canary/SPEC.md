---
type: fix
scope: small
roadmap_summary: Issue [#679](https://github.com/gtrabanco/agentic-workflow/issues/679) (S): manual `runner` invocation on a canary train hit two traps — the standalone skills' pin named the last stable while the tree cited canary-only services, and the crate usage string spelled the scope-less npm placeholder. A canary tag now records the staged tree, so a skills install at that tag cites the canary it shipped with; the bin's top-level usage names the scoped, pinned package; and an `Unknown service` refusal names the running crate version plus the pin/override that repairs it.
---

# fix/679-runner-invocation-traps-canary

> Fix specification — one single unit document.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

```text
retention-declaration@1
path | disposition
external-verify.md | trimmable
review-findings.md | trimmable
planning-findings.md | trimmable
planning-evidence.md | kept
planning-obligations.md | kept
decisions.md | kept
SPEC.md | kept
```

## Issue

`#679` — tracked issue in the project's forge. The PR closes it via
`Closes #679`.

## Specs

**S1 — a manual run of any subcommand the skills cite resolves a crate that has it.**
> A manual run of any subcommand the skills cite resolves a crate that has it — the (skills, crate, pin) triple is train-coherent on published canary packages, not only inside the pi resolver.

**S2 — the unknown-service refusal names the probable cause.**
> The `Unknown service` refusal names the probable cause when the invoked service is younger than the installed version (e.g. "service ships ≥ X; the resolved pin is 4.10.0 — check the pin or AGENTIC_WORKFLOW_RUNNER").

**S3 — no doc or usage string spells the scope-less package name.**
> No doc/usage string spells the scope-less package name, or the scope-less name actually resolves (alias/placeholder carrying the bin is out of scope below).

```text
spec-requirement@1
kind | shape | what it orders
requirement | **S<n>[a-z]? — <title>.** | one requirement; the id is what a task links and a finding cites
quote | > <the requester's words, verbatim> | the requirement's own text, unedited apart from a marked elision
correction | **S<n><letter> — <title>.** | an appended amendment to requirement S<n>; never an edit of it
```

## Impact

- `skills/runner-contract/references/RUNNER.md` — the standalone skills' only
  pin literal. A canary publish stages that pin into the working tree and then
  **restores** it, while the canary tag is recorded at the committed `HEAD`, so
  `npx skills add …#v<canary tag>` installs skills whose cited services may be
  younger than the stable pin. The fix records the staged tree as the tag.
- `.github/workflows/publish.yml` — the `cut-prerelease` job. Its tag step is the
  only consumer of the restored `HEAD`; its restore step omits
  `RUNNER.md` even though the stage prints a restore command that includes it.
- `scripts/canary-tag.mjs` (new) and `scripts/canary-tag.test.mjs` — the
  deterministic half: snapshot the staged tracked tree as a commit and record a
  tag on it, idempotently and fail-closed.
- `packages/agentic-workflow/bin/agentic-workflow.mjs` — the top-level usage
  line and the single closed-world `Unknown service` refusal.
- `packages/agentic-workflow/README.md` — its usage line restates the bin's
  token for token and must move with it.
- `packages/agentic-workflow/test/cli.surface.test.mjs` and
  `scripts/cli-coverage.test.mjs` — the two parsers that read the usage anchor;
  the anchor changes shape, so the tests read the new shape (a contract change,
  never a weakened assertion).
- `scripts/release-workflows.test.mjs` — pins the workflow's order: stage →
  snapshot → publish → restore → tag.
- Consumers that must keep working: the pi bundle pointerizes the invocation
  section, so the pi path is untouched (`packages/pi-agentic-workflow/test/runner-prose.test.mjs`);
  `scripts/release.mjs` already prints the restore that includes `RUNNER.md`;
  `npx skills add …#stable` and `#vX.Y.Z` keep reading stable-pin trees.
- Prose that becomes false if not moved: the canary paragraph in `RUNNER.md`,
  the canary bullet in `docs/workflow/FEATURE_WORKFLOW.md`, and the channels
  section in `README.md`.

## Surfaces

- `packages/agentic-workflow`
- `scripts`
- `.github`
- `skills/runner-contract`
- `docs`

## Retirements

Strictly additive apart from two superseded strings. No published command,
grammar or contract is removed, so no `orphan` retirement exists to classify.

| Superseded | Replaced by |
|---|---|
| The bin's top-level `usage: agentic-workflow <…>` line — a scope-less spelling an `npx` reader resolves to the `agentic-workflow@0.0.0` placeholder | `usage: bunx @gtrabanco/agentic-workflow@<pin> <…>`, with the scoped package and the pin source named on the next line |
| The bare `Unknown service: <name>` refusal | `Unknown service: <name> — this install is @gtrabanco/agentic-workflow@<running version>; a service added after it is not here …` naming the pin contract and `AGENTIC_WORKFLOW_RUNNER` |
| The canary tag created at the restored `HEAD` | the tag created on the staged tree (`scripts/canary-tag.mjs record`) |

## Non-goals

- **A scope-less alias package.** The issue marks it "heavier, separate call" and
  out of scope; this unit only stops the docs from inviting it.
- **Changing the closed-set contract.** The launcher order, the exact pin and the
  `AGENTIC_WORKFLOW_RUNNER` override are untouched.
- **Backfilling a published release.** `@gtrabanco/agentic-workflow@4.10.0` is
  immutable; the fix makes the next canary tag coherent, never an old one.
- **Auto-resolving a `#main` tree ahead of the last canary.** The exact-pin
  invariant forbids a moving ref, so the contract documents the state and the
  refusal names the repair; the next canary cut makes the tree coherent again.
- The deferred-tools `execute()` signature bug, issue #678.

## Risk tier

- **Tier** — `standard` · **Task Size** — understood + contained risk + resumable from diff
- **Named high-risk item** — none — not a high-tier unit

## Future

none

## Future cost

- A canary tag now points at a commit whose tree is the published staging tree,
  not at the branch `HEAD`. Anything that assumed tag == `HEAD` must compare
  trees instead; `scripts/canary-tag.mjs record` is the only writer that makes
  that comparison. Binds: release tooling and any future tag reader.
- The standalone skills' pin remains exact and immutable. A branch install can
  still be younger than the last cut, so every future service addition owes the
  next canary tag (or the documented override) before it is runnable manually.
  Binds: the release cadence and `RUNNER.md`.

## Applicable tests

- `scripts/canary-tag.test.mjs` — snapshot/record against throwaway git
  repositories: the staged tree is captured, untracked files are excluded, the
  worktree and `HEAD` are not moved, a re-record with the same tree is a no-op,
  and a different tree is refused.
- `scripts/release-workflows.test.mjs` — the canary cut's order and its tag
  target.
- `packages/agentic-workflow/test/cli.surface.test.mjs` — the usage anchor and
  the scoped/pinned spelling, read from the running bin.
- `packages/agentic-workflow/test/runner.dispatch.test.mjs` — the unknown-service
  refusal names the running version and the two repairs.
- `scripts/release.test.mjs` — the pinned stage behavior the fix rests on (the
  canary pin is staged and restored).

## Known pre-existing issues

- `@gtrabanco/agentic-workflow@4.10.0` on the registry has no `workflow-status`
  service — **does-not-affect** the diagnosis (the issue measured it) and cannot
  be repaired in place; the canary tag/pin and the refusal are the repair.
- A `#main` skills install can be ahead of the last canary, so a service added
  since that cut is still absent from the pinned stable — **affects** the
  manual path until the next canary cut; the note and the refusal name the
  override, and the exact-pin invariant is deliberately unchanged.
- The `cut-prerelease` job's restore step did not include `RUNNER.md` while the
  stage's printed restore did — **affects** this unit's ordering and is repaired
  with the tag change (nothing is committed either way).

## Tasks

- [x] P1 — Freeze the ledgers and the RED corpus: S1–S3 verbatim, PE/O/AC rows, and the failing cases in the four suites plus `scripts/canary-tag.test.mjs` (validator: `bun test scripts/canary-tag.test.mjs` exits non-zero)
  (Implements: S1, S2, S3)
  - Relevant files: docs/fix/679-runner-invocation-traps-canary/SPEC.md, scripts/canary-tag.test.mjs, scripts/release-workflows.test.mjs, packages/agentic-workflow/test/cli.surface.test.mjs, packages/agentic-workflow/test/runner.dispatch.test.mjs
- [x] P2 — `scripts/canary-tag.mjs`: snapshot the staged tracked tree as a commit and record a tag on it, idempotent by tree and fail-closed (validator: `bun test scripts/canary-tag.test.mjs` exits 0)
  (Implements: S1)
  - Relevant files: scripts/canary-tag.mjs, scripts/canary-tag.test.mjs
- [x] P3 — The crate surface: the top-level usage names the scoped package at `<pin>`, the refusal names the running version and the two repairs, and the README's usage line moves with it (validator: `bun test packages/agentic-workflow/test/cli.surface.test.mjs packages/agentic-workflow/test/runner.dispatch.test.mjs` exits 0)
  (Implements: S2, S3)
  - Relevant files: packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/README.md, packages/agentic-workflow/test/cli.surface.test.mjs, packages/agentic-workflow/test/runner.dispatch.test.mjs, scripts/cli-coverage.test.mjs
- [x] P4 — The release path: the canary cut snapshots the staged tree before the restore, records the tag on it, and restores the pin too (validator: `bun test scripts/release-workflows.test.mjs` exits 0)
  (Implements: S1)
  - Relevant files: .github/workflows/publish.yml, scripts/release-workflows.test.mjs
- [x] P5 — Documentation and state: the contract's canary and branch-install paragraphs, the flow/README wording, the changeset, the roadmap row through its writer, the emitter's projection, the journal entry and this document's ledgers (validator: `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S1, S2, S3)
  - Relevant files: skills/runner-contract/references/RUNNER.md, docs/workflow/FEATURE_WORKFLOW.md, README.md, .changeset/679-runner-invocation-traps-canary.md, docs/ROADMAP.md, docs/generated/units.md, docs/LOGS.md
- [x] P6 — Verification: the four suites and the repository gate in the foreground (validator: `bun scripts/run-root-suite.mjs` exits 0)
  (Implements: S1, S2, S3)
  - Relevant files: docs/fix/679-runner-invocation-traps-canary/SPEC.md

```text
task-spec-link@1
kind | shape | what it orders
link | (Implements: S<n>, S<m>, …) | the requirements this task delivers; metadata, never task text
```

### Planning evidence

Every source below was read in this session at the cut head `b5997ba82`; a
claim carried from training is never `confirmed`, and an unsampled assumption
is `unknown` with an owner.

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | measured-run | The scope-less npm name is a real placeholder and the documented invocation fails on it | `npm view agentic-workflow version` → `0.0.0`; `npm view agentic-workflow bin` → empty; `npx -y agentic-workflow --help` → exit 1, `npm error could not determine executable to run` (scratch `/tmp/pe679-red-*`) | measured 2026-11-22 (this session) | O4; AC-S3 |
| PE-002 | measured-run | The committed pin (4.10.0) lacks a service the current tree cites, while the canary crate has it | `npx -y @gtrabanco/agentic-workflow@4.10.0 workflow-status` → exit 2, `EDIT REFUSAL — Unknown service: workflow-status`; `npx -y @gtrabanco/agentic-workflow@5.0.0-canary.20261121.2 workflow-status --help` → exit 0 (scratch `/tmp/pe679-red-*`) | measured 2026-11-22 (this session) | O1, O2, O5; AC-S1, AC-S2 |
| PE-003 | measured-run | The published pin's top-level usage is the scope-less spelling the issue names | `npx -y @gtrabanco/agentic-workflow@4.10.0` → exit 1, `usage: agentic-workflow <unit-doc\|roadmap\|changelog\|budgets\|manifest\|doc\|memory> ...`; the current bin prints the longer scope-less line from `packages/agentic-workflow/bin/agentic-workflow.mjs:647` | measured 2026-11-22 (this session) | O4; AC-S3 |
| PE-004 | committed-source | The canary stage writes the pin into the working tree and restores it, but the tag is recorded at `HEAD` after the restore, so a git-tag skills install reads the committed stable pin | `scripts/release.mjs:1100-1107` (stage stamps `RUNNER.md`), `.github/workflows/publish.yml:339-355` (stage, then publish, then `git checkout -- packages/*/package.json`), `:392-405` (`git tag "v$V"` at `HEAD`) | read 2026-11-22 (this session) | O1, O3; AC-S1 |
| PE-005 | committed-source | The pi bundle does not ship the pin at all: the projection manifest pointerizes the invocation section, so refreshing that bundle is not part of this repair | `packages/pi-agentic-workflow/projection-manifest.json` (`runner-invocation-not-shipped`), `packages/pi-agentic-workflow/test/runner-prose.test.mjs:64-70` (the pointer assertion) | read 2026-11-22 (this session) | D2 (no bundle change); O3 |
| PE-006 | measured-run | A staged tree can be materialized as a commit without moving `HEAD` or the worktree, so a tag can record the published tree | throwaway git repo: `git add -u; TREE=$(git write-tree); git -c user.name=… -c user.email=… commit-tree "$TREE" -p HEAD -m …` → a commit whose tree carries the modified tracked files and excludes untracked ones; `git status` unchanged (scratch `/tmp/pe679-git-*`) | measured 2026-11-22 (this session) | O1, O3; AC-S1 |
| PE-007 | committed-source | `refuse()` is the single closed-world refusal path and the bin already reads files from its own package root, so the running version is available without a new dependency | `packages/agentic-workflow/bin/agentic-workflow.mjs:239-242` (`refuse`), `:150` (`readFileSync`), `:2019` (`refuse(Unknown service…)`) | read 2026-11-22 (this session) | O5; AC-S2 |
| PE-008 | committed-source | The usage line has two parsers, so changing its shape is a paired contract change rather than a source-only edit | `packages/agentic-workflow/test/cli.surface.test.mjs:17-22` (`usage: agentic-workflow <…>`), `scripts/cli-coverage.test.mjs:180-182` (the README's same anchor) | read 2026-11-22 (this session) | O4, O6; AC-S3 |
| PE-009 | committed-source | The canary cut's order is pinned by a workflow contract suite, and the restore command the stage prints already names the pin the workflow omits | `scripts/release-workflows.test.mjs:97-133` (stage before publish, restore after), `scripts/release.mjs:1117` (printed restore includes `RUNNER.md`), `.github/workflows/publish.yml:355` (restore omits it) | read 2026-11-22 (this session) | O3, O7; AC-S1 |
| PE-010 | measured-run | The four touched suites are green at the cut head, so their new cases are a real red-first baseline rather than a repair of another failure | `bun test packages/agentic-workflow/test/cli.surface.test.mjs` → 4 pass 0 fail; the same for `runner.dispatch.test.mjs`, `scripts/release.test.mjs`, `scripts/release-workflows.test.mjs` (recorded `E1`) | measured 2026-11-22 (this session) | O6, O8; AC-S1, AC-S2, AC-S3 |

## Obligations

One row per normative behaviour, compatibility invariant, affected use case and
required failure state (shape owned by
`skills/pre-execution-review/references/LEDGERS.md` §2).

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1 | A skills install at a canary tag cites the canary it shipped with: the tag's tree carries the staged pin, so a manual closed-set run of the tag's cited services resolves a crate that has them | P4 | P4 | execute-phase | `bun test scripts/release-workflows.test.mjs` exits 0 | the workflow cases' order and tag-target assertions; `## Log` `E5` | verified |
| O2 | S1 | Invariant: the committed pin stays stable and no branch moves — the tag records a synthetic commit whose parent is `HEAD`, so `#stable` and `#vX.Y.Z` installs are byte-unchanged | P2 | P2 | execute-phase | `bun test scripts/canary-tag.test.mjs` exits 0 | the snapshot case's `HEAD`-unchanged assertion plus `git status` readback; `## Log` `E4` | verified |
| O3 | S1 | Affected use case that must not regress: the canary cut still publishes the staged package versions, restores the worktree afterwards, and the tag still names the published cut | P4 | P4 | execute-phase | `bun test scripts/release-workflows.test.mjs` exits 0 | the existing canary cases green in that file; `## Log` `E5` | verified |
| O4 | S3 | No top-level doc or usage string spells the scope-less package name as an invocation: the bin and the crate README state `bunx @gtrabanco/agentic-workflow@<pin>` and the no-command run prints it | P3 | P3 | execute-phase | `bun test packages/agentic-workflow/test/cli.surface.test.mjs` exits 0 | the no-command case's stderr assertion; `## Log` `E3` | verified |
| O5 | S2 | Required failure state: an unknown service names the running crate version and both repairs (the pin contract and `AGENTIC_WORKFLOW_RUNNER`), while exit 2 and the `EDIT REFUSAL —` prefix stay | P3 | P3 | execute-phase | `bun test packages/agentic-workflow/test/runner.dispatch.test.mjs` exits 0 | the refusal case's version/hint assertions; `## Log` `E3` | verified |
| O6 | S3 | Affected use case that must not regress: the bin still dispatches every documented subcommand and the README restates the list token for token | P3 | P3 | execute-phase | `bun test packages/agentic-workflow/test/cli.surface.test.mjs scripts/cli-coverage.test.mjs` exits 0 | both suites green; `## Log` `E3` | verified |
| O7 | S1, S3 | Required failure state: a tag recorded on a different tree is refused, and a missing git repository is refused, never silently tagged | P2 | P2 | execute-phase | `bun test scripts/canary-tag.test.mjs` exits 0 | the two refusal cases' exit 2 and unchanged-tag assertions; `## Log` `E4` | verified |
| O8 | S1 | Affected use case that must not regress: the stable apply still stamps the pin and the canary stage still stages it, so the release plan and its printed restore keep their behavior | P6 | P6 | execute-phase | `bun test scripts/release.test.mjs` exits 0 | the pin cases green in that file; `## Log` `E6` | verified |

## Acceptance criteria

- **AC-S1** — A canary skills install (`#v<canary tag>`) carries the canary pin:
  the tag's tree reads the staged `runner-pin@1` value, the tag records the
  staged tree rather than the restored `HEAD`, and no branch moved. Proved by:
  `bun test scripts/canary-tag.test.mjs` exits 0 and
  `bun test scripts/release-workflows.test.mjs` exits 0.
- **AC-S2** — An unknown service refusal names the running crate version and the
  two repairs, while keeping exit 2 and `EDIT REFUSAL — Unknown service:
  <name>`. Proved by:
  `bun test packages/agentic-workflow/test/runner.dispatch.test.mjs` exits 0.
- **AC-S3** — The bin's no-command output and the crate README spell the scoped,
  pinned invocation; the scope-less placeholder is not offered. Proved by:
  `bun test packages/agentic-workflow/test/cli.surface.test.mjs` exits 0.

## Triaged steps

```
TRIAGE — 679-runner-invocation-traps-canary (fix)
Steps: plan, implement, tests, evidence, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
```

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-22, the issue, verbatim (the outer fence is `~~~` because the
  quoted body carries fences of its own):
  ~~~
  Two traps make a manual `runner` invocation following the documented closed set fail on a canary train: the pin names the last stable while the skills already cite canary-only subcommands, and the crate's own usage string invites the scope-less npm name (which is a placeholder package).

  ## Verified current state (2026-11-21)

  | Probe | Result |
  | --- | --- |
  | `npm view agentic-workflow` | `agentic-workflow@0.0.0`, no `bin` → `npx agentic-workflow …` fails with `npm error could not determine executable to run` |
  | Crate usage string | `packages/agentic-workflow/bin/agentic-workflow.mjs` prints `usage: agentic-workflow <unit-doc|roadmap|…>` — the scope-less name, exactly what npx resolves to the placeholder |
  | `npx -y @gtrabanco/agentic-workflow@4.10.0 workflow-status` | `EDIT REFUSAL — Unknown service: workflow-status` — the service does not exist at the published pin 4.10.0 (the exact pin in `skills/runner-contract/references/RUNNER.md` `runner-pin@1:20`); it landed after the 4.10.0 cut |
  | Installed canary crate (5.0.0-canary.20261121.2) | `workflow-status --json-only / --compact` work (verified in a scratch dir) |
  | pi-tool path | unaffected: the pi package's resolver spawns the *installed* candidate (canary skills + canary crate pair correctly) — only the manual closed-set path (`bunx`/`npx`/`pnpm dlx @<pin>`, `RUNNER.md:26-28`) hits the stale pin |
  | Refusal quality | `EDIT REFUSAL — Unknown service: <name>` offers no hint that the install may simply be older than the subcommand |

  Real consequence: an agent following the docs verbatim during a canary train gets two opaque failures in a row (scope-less name, then unknown service) and improvises untracked invocations.

  ## Expected behaviour

  - A manual run of any subcommand the skills cite resolves a crate that has it — the (skills, crate, pin) triple is train-coherent on published canary packages, not only inside the pi resolver.
  - The `Unknown service` refusal names the probable cause when the invoked service is younger than the installed version (e.g. "service ships ≥ X; the resolved pin is 4.10.0 — check the pin or AGENTIC_WORKFLOW_RUNNER").
  - No doc/usage string spells the scope-less package name, or the scope-less name actually resolves (alias/placeholder carrying the bin is out of scope below).

  ## Proposed fix (candidates, owner decides)

  1. Stamp `runner-pin@1` train-coherently when publishing canary packages (reciprocal to the stable-cut stage/restore dance), or ship canary skills with a resolver-aware invocation note.
  2. Make the unknown-service refusal version-aware.
  3. Purge scope-less spellings from usage strings and docs (or publish a real scope-less alias — heavier, separate call).

  ## Out of scope

  - The execute() signature bug of the deferred tools (#678).
  - Changing the closed-set contract itself.
  ~~~

- **D1** — 2026-11-22, the canary tag records the staged tree through `scripts/canary-tag.mjs`, never a branch move; see `docs/fix/679-runner-invocation-traps-canary/decisions.md`.
- **D2** — 2026-11-22, the pi bundle is untouched: its projection pointerizes the invocation section, so it never carries a pin (`PE-005`).
- **D3** — 2026-11-22, a `#main` tree ahead of the last canary is documented and refusal-guided, not auto-resolved; the exact-pin invariant stays.
- **D4** — 2026-11-22, no scope-less alias package (the issue's out-of-scope call).
- **D5** — 2026-11-22, subcommand usage lines keep the bin's own name; only the top-level invocation names the scoped package.
- **P1** — 2026-11-22, the ledgers were frozen and the RED corpus landed · 15d265a7a, 0fc9e14cc.
- **E1** — 2026-11-22, the cut-head baseline: `bun test packages/agentic-workflow/test/cli.surface.test.mjs` and the three sibling suites · exit 0 · 4/0, 6/0, 27/0, 21/0 pass/fail.
- **E2** — 2026-11-22, the corpus before implementation: `bun test scripts/canary-tag.test.mjs` · exit non-zero · 0 pass, 6 fail (missing module); `cli.surface` 0/1 error, `runner.dispatch` 6/1, `release-workflows` 26/1.
- **P2** — 2026-11-22, `scripts/canary-tag.mjs`: snapshot and record · 636c1d193.
- **E4** — 2026-11-22, `bun test scripts/canary-tag.test.mjs` · exit 0 · 6 pass, 0 fail.
- **P3** — 2026-11-22, the scoped usage and the version-aware refusal · c8cffcc27.
- **E3** — 2026-11-22, `bun test packages/agentic-workflow/test/cli.surface.test.mjs packages/agentic-workflow/test/runner.dispatch.test.mjs scripts/cli-coverage.test.mjs` · exit 0 · 20 pass, 0 fail (the no-command and refusal cases included).
- **P4** — 2026-11-22, the canary cut snapshots and tags the staged tree · 6d6194940, ada7e5463.
- **E5** — 2026-11-22, `bun test scripts/release-workflows.test.mjs scripts/release.test.mjs` · exit 0 · 102 pass, 0 fail (the tag-order case and the pin cases included).
- **P5** — 2026-11-22, the contract prose, the changeset and the roadmap row · 7cf9a8bc9, d54653a67.
- **E6** — 2026-11-22, the differential over the base bin at `b5997ba82`: `phase-lint`, `unit-route --triage`, `needs-input`, `roadmap read` and `verify` against the same tree · exit 0 each · stdout byte-identical; only the two asked surfaces differ (no-command usage 994 → 1183 bytes, unknown-service refusal 51 → 286 bytes).
- **E7** — 2026-11-22, `bun test packages/pi-agentic-workflow/test/runner-prose.test.mjs` · exit 0 · 4 pass, 0 fail (the pi projection still pointerizes the invocation section).
- **G1** — 2026-11-22, HEAD ada7e54634982a88bfc877e4756df782e580b202, `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/fix/679-runner-invocation-traps-canary/SPEC.md` · exit 0 · PASS (6/6) for every phase.
- **G2** — 2026-11-22, HEAD ada7e54634982a88bfc877e4756df782e580b202, `bun scripts/docs-generate.mjs --check` · exit 0 · verdict PASS.
- **G3** — 2026-11-22, HEAD ada7e54634982a88bfc877e4756df782e580b202, `bun scripts/check-skill-context.mjs` · exit 0 · PASS, 30 skills.
- **G4** — 2026-11-22, HEAD ada7e54634982a88bfc877e4756df782e580b202, `bun test scripts/normative-drift.test.mjs` · exit 0 · 24 pass, 0 fail.
- **G5** — 2026-11-22, HEAD ada7e54634982a88bfc877e4756df782e580b202, `bun scripts/run-root-suite.mjs` · exit 0 · 140 suites PASS, 0 FAIL.
- **G6** — 2026-11-22, HEAD ada7e54634982a88bfc877e4756df782e580b202, `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/679-runner-invocation-traps-canary/SPEC.md` · exit 0 · VERIFY PASS, every check green.

## Next

The owner's external verdict on the diff and the closed obligations ledger; the
canary publish path itself is exercised by the owner's next canary cut (no
publish is run by this local unit).

## References

- Issue [#679](https://github.com/gtrabanco/agentic-workflow/issues/679)
- Contract owner: `skills/runner-contract/references/RUNNER.md`
- Related: issue [#678](https://github.com/gtrabanco/agentic-workflow/issues/678) (same
  incident family, independent fix)

## Branch

`fix/679-runner-canary-pins`

## Depends on

none

## Regression scope

- Stable apply and canary stage keep their pin behavior:
  `bun test scripts/release.test.mjs` exits 0.
- The canary cut keeps staging, publishing and restoring:
  `bun test scripts/release-workflows.test.mjs` exits 0.
- The bin keeps dispatching every documented subcommand and the README keeps
  restating the list: `bun test packages/agentic-workflow/test/cli.surface.test.mjs`
  exits 0 and `bun test scripts/cli-coverage.test.mjs` exits 0.
