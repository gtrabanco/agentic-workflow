---
type: fix
scope: large
roadmap_summary: Issue [#678](https://github.com/gtrabanco/agentic-workflow/issues/678) (L, high): the six deferred workflow tools are rebuilt on pi's real tool contract — the adapter translates `execute(toolCallId, params, signal, onUpdate, ctx)` into the Pi-free `execute(params, cwd)`, `ctx.cwd` is the project root, and an unreadable cwd refuses loudly with `sensor-degraded` instead of sampling `process.cwd()`. A wiring suite calls every tool the way the host does, which is what turns a future signature regression red. SPEC: [SPEC](fix/678-deferred-tools-signature-bug/SPEC.md)
ac-hash: afcd2748bd33854ba68696cfcafe2bb198b7271374caae8e6b7e4b25fc3ebdc2
---

# fix/678-deferred-tools-signature-bug

> One-line: the deferred tool surface was written against a signature pi never
> calls, so five tools threw their own argument check on every call and the
> sixth silently sampled the process cwd; the adapter now owns the host
> convention, and the cwd a run uses is the one the host handed over or none.

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

`#678` — `Bug: workflow tools' execute(params, cwd) signature breaks every
deferred tool; agentic_workflow_status silently samples the wrong cwd`. The PR
closes it via `Closes #678`. The issue carries the `bug`, `fix-next` and
`pi-agentic-workflow` labels and was triaged `fix-now (high)` on 2026-11-21;
the roadmap row is `pending · Triaged fix-now (high)`.

## Specs

`S1` is the owner's instruction; `S2`–`S13` are the issue's own words, one
requirement per distinct ask, in the order the issue states them. The issue's
`## Verified current state` facts and `## Proposed fix` bullets are its
requirements — they are quoted as the document wrote them, including the
sites it names.

**S1 — Apply issue #678 to this repository.**
> Apply to this repository: issue #678

**S2 — The bug, in the issue's own title.**
> Bug: workflow tools' execute(params, cwd) signature breaks every deferred tool; agentic_workflow_status silently samples the wrong cwd

**S3 — The cause: pi's tool contract is the 5-arg call.**
> the deferred workflow tools declare `execute(params, cwd)` but pi's tool contract is `execute(toolCallId, params, signal, onUpdate, ctx)` — so every params-reading tool throws its own argument check and `agentic_workflow_status` silently runs against the wrong cwd.

**S4 — Expected behaviour: 5-arg signature, `ctx.cwd`, loud refusal.**
> Every tool uses pi's 5-arg signature and paths the project through `ctx.cwd`; a non-readable/absent cwd **refuses loudly** (degraded with a `detail`) instead of silently sampling `process.cwd()`.

**S5 — Proposed fix: the signature change itself.**
> Change all six tools to `async execute(_toolCallId, params, _signal, _onUpdate, ctx)` and use `ctx.cwd`.

**S6 — Proposed fix: `resolveCwd` stops falling back.**
> `resolveCwd`: no silent `process.cwd()` fallback — refuse with the degraded envelope naming the unresolved cwd.

**S7 — Proposed fix: a wiring suite on the host's call convention.**
> Add a wiring suite that simulates the host's call convention (`execute(<id>, args, signal, cb, ctxLike)`) so a future signature regression turns red instead of shipping.

**S8 — Out of scope: the runner/bin resolver pairing.**
> The resolver/pin pairing (`AGENTIC_WORKFLOW_RUNNER`, the closed set) — reported separately where it drifts.

**S9 — Out of scope: the harness.**
> pi harness itself (its contract is documented and consistent).

**S10 — Verification sketch: the reproducer.**
> Repro: from any pi session with codemode, `tools.agentic_workflow_run({ subcommand: "setup-env", args: ["--check"] })` errors with the requireString message.

**S11 — Verification sketch: after the fix.**
> After the fix: the same call exits with the tool's stdout/stderr envelope; `agentic_workflow_status` returns the calling project's unit counts (compare against a manual run of the sensor in that project).

**S12 — Verification sketch: the suite.**
> Suite: `bun run test` in `packages/pi-agentic-workflow` green, including the new call-convention test.

**S13 — The live failure the issue quotes.**
> `Error: subcommand is required and must be a non-empty string`

## Acceptance criteria

Frozen at the cut; `ac-hash:` in the frontmatter is this section's SHA-256. One
criterion per requirement, each naming the check that proves it.

1. **S1 — the issue is applied, not reinterpreted.** `git diff --name-only $(git merge-base origin/main HEAD)..HEAD` lists only the paths `## Impact` names, and every `S#` above appears verbatim in this document.
2. **S2 — both halves of the title are gone: the params-reading tools answer, and the status tool samples the calling project.** `bun test packages/pi-agentic-workflow/test/workflow-tools-wiring.test.mjs` exits 0 with `every params-reading tool answers when the host calls it with the 5-arg convention` and `status: the host's ctx.cwd is the project the sensor samples`.
3. **S3 — the adapter, not a Pi-free spec, owns the host signature.** `bunx tsc --noEmit` in `packages/pi-agentic-workflow` exits 0, `rg -F 'run.call(tool, params, ctx.cwd)' packages/pi-agentic-workflow/src/extension/index.ts` matches 1 — the adapter's five-into-two translation, whose declared shape is `execute: (_toolCallId, params, _signal, _onUpdate, ctx) => run.call(tool, params, ctx.cwd)` — and the `WorkflowToolSpec.execute` seam keeps its two arguments.
4. **S4 — an absent or unreadable cwd refuses loudly.** `bun test packages/pi-agentic-workflow/test/conductor-sensor.test.mjs` exits 0 with `an unreadable cwd refuses instead of sampling the process cwd`, and `rg -c 'process\.cwd\(' packages/pi-agentic-workflow/src/conductor/sensor.ts` matches 1 — only the header comment that records the removal.
5. **S5 — all six tools reach the host convention.** The wiring suite exits 0 with `every tool runs through the host's 5-arg convention` over the six registered names, and every registered tool carries a 5-arg `execute`.
6. **S6 — `runSensor` never falls back to `process.cwd()`.** `bun test packages/pi-agentic-workflow/test/conductor-sensor.test.mjs` exits 0 with `an unreadable cwd refuses instead of sampling the process cwd`, and `rg -c 'process\.cwd\(' packages/pi-agentic-workflow/src/conductor/sensor.ts` matches 1 — only the header comment that records the removal.
7. **S7 — the wiring suite calls every tool the way the host does.** `bun test packages/pi-agentic-workflow/test/workflow-tools-wiring.test.mjs` exits 0, and the pre-fix modules fail it (the red run in `## Log`).
8. **S8 — the resolver is untouched.** `git diff --name-only <base>..HEAD -- packages/pi-agentic-workflow/src/runner-bin.ts packages/agentic-workflow/src/runner` matches 0 lines.
9. **S9 — the harness is not edited.** `git diff --name-only <base>..HEAD -- packages/pi-agentic-workflow/package.json` shows no peer-dependency move, and the diff reaches no file outside this repository's tree (a session's disclosed out-of-tree global-install residue was reverted and ships nothing).
10. **S10 — the quoted reproducer answers with data instead of the argument check.** The wiring suite's `agentic_workflow_run` case calls with `{ subcommand: "setup-env", args: ["--check"] }` under the host convention and asserts the result carries `{ subcommand, stdout, stderr, exitCode }` — never `Error: subcommand is required and must be a non-empty string`.
11. **S11 — the status tool samples the calling project.** `bun test packages/pi-agentic-workflow/test/workflow-tools-wiring.test.mjs` exits 0 with the `ctx.cwd` case, where a sensor double records the cwd it received and it equals the host's `ctxLike.cwd` (not the process cwd).
12. **S12 — the package's own suite is green.** `bun run test` in `packages/pi-agentic-workflow` exits 0 with the new call-convention suite in the run.
13. **S13 — the exact live message never comes from the package path again.** The wiring suite asserts the string is absent from every params-reading tool's result — `agentic_workflow_status` reads no params, so it cannot emit it — and `## Log` records the pre-fix reproduction of it.

## Impact

The change is small in lines and wide in consumers: the tool surface is what a
codemode script and `tool_search` reach for, and three suites read it.

- `packages/pi-agentic-workflow/src/extension/factory.ts` — the registration
  step stops handing the raw Pi-free spec to `registerTool` and hands the
  adapter's translation instead; the `toolRegistrar` seam keeps its shape, so a
  host double and the shipped adapter both keep working.
- `packages/pi-agentic-workflow/src/extension/index.ts` — the one file allowed
  to speak Pi's types; the translation lives beside the `toolRegistrar`
  structural read it already owns.
- `packages/pi-agentic-workflow/src/extension/workflow-tools.ts` — the specs
  stop claiming to be the host contract: the docblock says the adapter owns
  `execute(toolCallId, params, signal, onUpdate, ctx)` and the spec seam stays
  `execute(params, cwd)`. Nothing else in the module moves.
- `packages/pi-agentic-workflow/src/conductor/sensor.ts` — `resolveCwd`'s
  silent `process.cwd()` fallback dies; an unreadable cwd returns the
  `sensor-degraded` refusal naming the path.
- `packages/pi-agentic-workflow/test/workflow-tools.test.mjs` — the existing
  spec-level suite is unchanged in its assertions: it drives the Pi-free seam,
  which is not what broke.
- `packages/pi-agentic-workflow/test/workflow-tools-wiring.test.mjs` (new) —
  the call-convention suite: it registers through the factory's seam, calls
  every tool with `(toolCallId, params, signal, onUpdate, ctxLike)` and asserts
  what the host would have observed.
- `packages/pi-agentic-workflow/test/shipped-adapter.test.mjs` — the shipped
  entry's tool assertion gains the adapter-level shape it was missing (the tool
  a host receives carries a 5-arg `execute`), which is the assertion whose
  absence let this ship.
- `packages/pi-agentic-workflow/README.md` — the tool table's "Two properties"
  block states the host convention and the loud refusal beside the cwd rule.
- The unit's own carriers — `docs/fix/678-deferred-tools-signature-bug/`
  (`SPEC.md`, `planning-evidence.md`, `planning-obligations.md`,
  `external-verify.md`) — carry the request, its evidence and its receipts.
- `docs/ROADMAP.md` + `docs/generated/units.md` — the fix row settles and the
  projection regenerates through the emitter, never by hand.
- `.changeset/678-deferred-tools-signature-bug.md` — the package's shipped
  content moved, so the version-parity gate needs the release intent the
  release applies; the train bump stays the release's job (`D-40-14`).
- The diff paths the session workflow appends on its own: every narrative
  journal fragment this unit's sessions write under `.agentic-workflow/journal/`
  (currently `20261122T003003Z-fix-678-deferred-tool-cwd-trap-narrative-local.md`
  and
  `20261122T014758Z-fix-678-deferred-tool-cwd-trap-narrative-01a2007e-0409-738d-aa16-9416534df253.md`),
  and `docs/workflow/SKILL_CONTEXT_BUDGETS.json` — the package README's
  context-budget re-pin from this unit's prose commit.

## Surfaces

- `packages/pi-agentic-workflow`
- `docs`

## Retirements

Nothing is retired. No tool name, parameter, schema branch, envelope field or
refusal token is removed; the six registered tools and their `structuredContent`
contracts are unchanged. The one thing that dies is the specs' claim to be the
host's call contract — a claim no consumer could name, replaced by the
adapter's translation and pinned by the new wiring suite. `rg -c 'execute\(params, cwd\)'
packages/pi-agentic-workflow/src` → the spec seam only, which is the seam the
wiring suite drives.

## Non-goals

- The runner/bin resolver pairing (`AGENTIC_WORKFLOW_RUNNER`, the closed runner
  set) — `S8`'s out-of-scope line; issue #679 owns that drift.
- The pi harness and its documented tool contract (`S9`).
- A new tool, a new schema branch, or a vocabulary change: the fix moves the
  call plumbing, never the published shapes.
- The other consumers of `runSensor` (the conductor loop): they pass a cwd they
  resolved themselves, and the refusal replaces only the silent fallback.

## Risk tier

- **Tier** — `standard` · **Task Size** — `large`
- **Named high-risk item** — none — the unit adds no network call, no forge
  call and no mutating script path; its only runtime effect is which directory
  the existing spawns run in, and every probe of that runs in a fixture tree.

## Future

none

## Future cost

- **The host convention is owned by the adapter.** A future Pi-free tool module
  registers through the factory's translation, never by handing its own spec to
  `registerTool`; the wiring suite reads the registered shape and fails a spec
  that carries a 2-arg `execute`. Binds: any new deferred tool.
- **An unresolved cwd is a refusal, not a guess.** A future caller of
  `runSensor` must hand a real path; the `sensor-degraded` refusal is the
  contract. Binds: the conductor, the tools, any new sensor consumer.

## Applicable tests

- `bun test packages/pi-agentic-workflow/test/workflow-tools.test.mjs`
- `bun test packages/pi-agentic-workflow/test/workflow-tools-wiring.test.mjs`
- `bun test packages/pi-agentic-workflow/test/shipped-adapter.test.mjs`
- `bun test packages/pi-agentic-workflow/test/conductor-sensor.test.mjs`
- `bun run test` in `packages/pi-agentic-workflow`

## Known pre-existing issues

- **The deferred tools are dead in every released session** — `5.0.0-canary.20261121.2`
  and every earlier train carry the 2-arg spec, so the bug is live until this
  unit's release lands. `affects` this unit: it is the reason the fix ships a
  changeset rather than a bare code change.
- **The repository's carrier holds a published colliding journal pair** —
  `20261121T020442Z-…-01a1fbaf-…` and `20261121T114851Z-…-01a1fbaf-…` are two
  narrative fragments of one conversation. `does-not-affect` this unit's code:
  the sanctioned aggregation workflow consumes them, and `journal-carrier-check`
  is red on `main` until it does. Its verdict is recorded with the gate run.
- **A stale sibling worktree** — `.worktrees/feat-667-review-pack-preamble-extraction`
  holds a branch already merged into `origin/main`, so `scripts/worktree-guard.mjs`
  reports `STALE`. `does-not-affect` this unit: the finding is about another
  session's workspace, and the removal order is the owner's
  (`docs/workflow/WORKTREES.md`).

## Tasks

- P1 — Land the wiring suite alone, observed red against the unchanged
  registration path: the host-convention call over all six tools, the
  `ctx.cwd` sampling case, and the loud-refusal case. (validator:
  `bun test packages/pi-agentic-workflow/test/workflow-tools-wiring.test.mjs`
  exits 1 on the unchanged tree with the six-arg mismatch named, and the `E`
  line records the observed failure)
  (Implements: S7, S10, S13)
  - Relevant files: packages/pi-agentic-workflow/test/workflow-tools-wiring.test.mjs
- P2 — Translate the Pi-free spec into the host contract at the one registration
  site, so every tool answers the 5-arg call and runs in `ctx.cwd`. (validator:
  `bun test packages/pi-agentic-workflow/test/workflow-tools-wiring.test.mjs`
  exits 0 and `bun test packages/pi-agentic-workflow/test/workflow-tools.test.mjs`
  exits 0)
  (Implements: S3, S4, S5, S11)
  - Relevant files: packages/pi-agentic-workflow/src/extension/factory.ts, packages/pi-agentic-workflow/src/extension/index.ts, packages/pi-agentic-workflow/src/extension/workflow-tools.ts
- P3 — Drop the silent cwd fallback in the sensor: an unreadable cwd is a
  `sensor-degraded` refusal naming the path. (validator:
  `bun test packages/pi-agentic-workflow/test/conductor-sensor.test.mjs` exits 0
  and `rg -c 'process\.cwd\(' packages/pi-agentic-workflow/src/conductor/sensor.ts`
  matches 1 — only the comment that records the removal, no call site)
  (Implements: S4, S6)
  - Relevant files: packages/pi-agentic-workflow/src/conductor/sensor.ts, packages/pi-agentic-workflow/test/conductor-sensor.test.mjs
- P4 — Pin the shipped adapter's tool shape and run the package's whole suite.
  (validator: `bun test packages/pi-agentic-workflow/test/shipped-adapter.test.mjs`
  exits 0 and `bun run test` in `packages/pi-agentic-workflow` exits 0)
  (Implements: S12, S5)
  - Relevant files: packages/pi-agentic-workflow/test/shipped-adapter.test.mjs
- P5 — Ship the prose and the state: the README's tool-contract paragraph, the
  changeset, the settle pair (roadmap row + unit doc) and the regenerated
  projection. (validator: `bun scripts/docs-generate.mjs --check` exits 0 and
  `bun scripts/version-parity-gate.mjs --content --base origin/main` reports the
  changeset route declaring `@gtrabanco/pi-agentic-workflow`, `VERDICT: PASS`)
  (Implements: S1, S12)
  - Relevant files: packages/pi-agentic-workflow/README.md, .changeset/678-deferred-tools-signature-bug.md, docs/ROADMAP.md
- P6 — Verify like a writer: the derived test-impact set, the differential
  against the base commit, the untouched-surface diffs and the gate's per-step
  verdict. (validator: `bun scripts/test-impact.mjs --base origin/main` prints
  the set, and `bun scripts/local-gate.mjs` runs every gate step — each step's
  verdict `pass` is reported, reds included)
  (Implements: S1, S2, S12)
  - Relevant files: packages/pi-agentic-workflow/src, packages/pi-agentic-workflow/test
- P7 — Prove the two out-of-scope boundaries stay untouched: the runner/bin
  resolver pairing (`S8`) and the harness's package surface (`S9`) are neither
  edited nor re-pinned by this change. (validator:
  `git diff --name-only $(git merge-base origin/main HEAD)..HEAD -- packages/pi-agentic-workflow/src/runner-bin.ts packages/agentic-workflow/src/runner`
  matches 0 lines and `git diff $(git merge-base origin/main HEAD)..HEAD -- packages/pi-agentic-workflow/package.json`
  shows no `@earendil-works/pi-coding-agent` line)
  (Implements: S8, S9)
  - Relevant files: packages/pi-agentic-workflow/src/runner-bin.ts, packages/pi-agentic-workflow/package.json

### Planning evidence

The rows live in `planning-evidence.md` beside this document (L unit).

### Obligations

The rows live in `planning-obligations.md` beside this document (L unit). Their
evidence is the `E`/`G` lines below: `O1–O5` ← E3, `O6` ← E4, `O7` ← E1/E2,
`O8` ← E5, `O9` ← E6, `O10/O11` ← E9, `O12` ← E10, `O13` ← E8/G1. All thirteen
are `verified`.

## Triaged steps

`runner unit-route --triage 678` is not run for this unit: the owner applied the
issue through the local inline workflow, and the `## Tasks` list above is the
frozen plan (owner instruction, `S1`). No triage block is claimed here.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-21, the request, verbatim:
  ```
  Apply to this repository: issue #678
  ```
- **L2** — 2026-11-21, the issue, verbatim:
  ```
  Bug: the deferred workflow tools declare `execute(params, cwd)` but pi's tool contract is `execute(toolCallId, params, signal, onUpdate, ctx)` — so every params-reading tool throws its own argument check and `agentic_workflow_status` silently runs against the wrong cwd.
  ```
- **D1** — 2026-11-21, owner decision carried from the issue: the fix lands on
  the adapter. A Pi-free spec keeps `execute(params, cwd)` and the package's
  adapter is the only place that knows the host's argument order, because the
  alternative — a 5-arg spec method whose four extra arguments are unused —
  puts a host signature into a module that imports no host type.
- **D2** — 2026-11-21, owner decision carried from the issue (`S6`): the sensor
  refuses an unreadable cwd instead of falling back to `process.cwd()`. The
  refusal reuses the existing `sensor-degraded` contract, so no vocabulary
  moves.
- **L3** — 2026-11-22, the correction request, verbatim:
  ```
  Apply to this repository: triage and fix those that deserve to fix but understand the context before fix and check you haven't broke another different thing, if you have done, start the loop again until you fixed full symbol/related stuff
  ```
- **D3** — 2026-11-22, the owner instruction (L3) decides the batch's scope:
  external-verify blockers B1–B7 all fold; advisories A1/A2/A4 fold with them
  (the evidence ledger's cut-base sampling sentence, AC13's quantifier, AC9's
  outside-tree scope), while A3 (`workflow-tools.test.mjs`'s seam title) and A5
  (the worktree's `setup-env` verdict) stand as recorded advisories — the title
  is true of the case it drives, and the environment is not this tree's state
  (authority: `external-verify.md` beside this document).
- **P1** — 2026-11-22 02:25, the correction batch: AC2/AC11 repointed to the
  wiring suite, AC3 checked against the real translation, AC9/AC13 scoped to
  what they prove, P3/P5 and O3's validators corrected to their observed
  outcomes, `## Impact` naming every diff path, V1's stale cells corrected, the
  evidence ledger's sampling point stated, `ac-hash` re-stamped with the
  DESIGN.md `sectionText` recipe · 3da5ee0883e4870dca8666e48ab619d3209e5e65.
- **E1** — 2026-11-22, red corpus at the test-only commit
  `9abeb4b67252838de54a3767818544a9c06b263a` (mktemp `git archive`, src byte-
  identical to base): `bun test test/workflow-tools-wiring.test.mjs` · exit 1 ·
  `0 pass / 5 fail`, the argument check `subcommand is required and must be a
  non-empty string` named — the green run of the same suite is
  `3da5ee0883e4870dca8666e48ab619d3209e5e65` (E3).
- **E2** — 2026-11-22, the same red tree: `bun test test/conductor-sensor.test.mjs`
  · exit 1 · `7 pass / 1 fail` — `AssertionError: the refusal names the cwd it
  could not resolve` (the pre-fix sensor ran in the process cwd).
- **E3** — 2026-11-22, head `3da5ee0883e4870dca8666e48ab619d3209e5e65`:
  `bun test packages/pi-agentic-workflow/test/workflow-tools-wiring.test.mjs` ·
  exit 0 · `5 pass / 0 fail` over the six registered names
  (`agentic_workflow_status`, `agentic_workflow_diff_guard`,
  `agentic_workflow_phase_lint`, `agentic_workflow_audit_pr_gate`,
  `agentic_workflow_snapshot_verify`, `agentic_workflow_run`) — cases:
  `every tool runs through the host's 5-arg convention` (`execute.length === 5`
  for all six), `every params-reading tool answers when the host calls it with
  the 5-arg convention`, `status: the host's ctx.cwd is the project the sensor
  samples` (the double recorded exactly the scratch project dir, never the
  process cwd), `a gate tool spawns in the host's ctx.cwd`,
  `agentic_workflow_run answers the issue's quoted reproducer`
  (`{ subcommand: "setup-env", stdout, stderr, exitCode: 0 }`);
  `bunx tsc --noEmit` · exit 0; `rg -c 'execute\(params'
  packages/pi-agentic-workflow/src/extension/workflow-tools.ts` → 7 (the
  corrected count: seam sentence + interface + five params-reading
  implementations).
- **E4** — 2026-11-22, head: `bun test
  packages/pi-agentic-workflow/test/conductor-sensor.test.mjs` · exit 0 ·
  `8 pass / 0 fail` — `an unreadable cwd refuses instead of sampling the process
  cwd`, `detail: cwd-unresolved: "/nonexistent/issue-678-unreadable-cwd" is not
  a readable directory; the sensor never samples another project`;
  `rg -c 'process\.cwd\(' packages/pi-agentic-workflow/src/conductor/sensor.ts`
  → 1 (the comment, no call site).
- **E5** — 2026-11-22, head: `bun test
  packages/pi-agentic-workflow/test/shipped-adapter.test.mjs` · exit 0 ·
  `28 pass / 0 fail`, each registered tool asserting
  `tool.execute.length === 5`.
- **E6** — 2026-11-22, head: `bun run test` in `packages/pi-agentic-workflow` ·
  exit 0 · `1041 pass / 0 fail` across 90 files (wiring suite included);
  `bunx tsc --noEmit` · exit 0.
- **E7** — 2026-11-22, the differential (mktemp; base side = `9abeb4b67…` src,
  byte-identical to base; head side = this branch): `runSensor("/nonexistent/
  issue-678-e7", <fake sensor>)` · base → `ok:true` with
  `summary:"sampled:<process cwd>"`; head → `ok:false`,
  `refusal:"sensor-degraded"`, `detail:"cwd-unresolved:
  \"/nonexistent/issue-678-e7\" is not a readable directory; the sensor never
  samples another project"`, no envelope.
- **E8** — 2026-11-22: `bun scripts/test-impact.mjs --base origin/main` · exit 0 ·
  `verdict: targeted`, changed 19 / executable 8 / suites 9 (the wiring suite,
  receipt-guard, skill-parity, check-skill-context, guide-split,
  promise-coherence, shared-doc-merge, version-parity-gate, tool-choice-corpus);
  `bun scripts/local-gate.mjs --jobs 4` · exit 0 · `local-gate: PASS — 20
  step(s) in 384s` — the per-step receipt is G1.
- **E9** — 2026-11-22, at `3da5ee0883e4870dca8666e48ab619d3209e5e65`:
  `git diff --name-only 3f749feebcefd67f6b72d1be418822b687df4559..HEAD` · 18
  paths, every one named in `## Impact` (both journal fragments,
  `docs/workflow/SKILL_CONTEXT_BUDGETS.json` and `external-verify.md` among
  them); the resolver-pairing scope → 0 lines; `--
  packages/pi-agentic-workflow/package.json` → 0 lines; `git stash list` →
  empty. The count is point-in-time: `## Impact` names journal fragments by
  class, so a session fragment written later is still named.
- **E10** — 2026-11-22: `bun scripts/docs-generate.mjs --check` · exit 0 ·
  `verdict: PASS`, 3 files · 0 stale; `bun test
  packages/pi-agentic-workflow/test/runner-prose.test.mjs` · exit 0 · `4 pass /
  0 fail`; the DESIGN.md `sectionText` recipe →
  `afcd2748bd33854ba68696cfcafe2bb198b7271374caae8e6b7e4b25fc3ebdc2` equals the
  frontmatter `ac-hash` (and on the pre-edit section it reproduces the frozen
  `48efe141ee4b578519598ce2c26fe51ba9992aeeecd3648598557bb05749a95d`);
  `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify
  docs/fix/678-deferred-tools-signature-bug/SPEC.md` · exit 0 · `VERIFY PASS`,
  violations `[]`.
- **G1** — 2026-11-22, HEAD 3da5ee0883e4870dca8666e48ab619d3209e5e65 (clean tree) · `bun scripts/local-gate.mjs --jobs 4` · exit 0 · `local-gate: PASS — 20 step(s) in 384s`, every selected step exit 0, zero reds:
  workspace-install 2s, version-parity-content 1s, log-immutability 1s,
  secret-scan 0s, temp-hygiene 0s, tmp-gc 0s, worktree-guard 0s, rigidity-review
  0s, dependency-pin-gate 5s, schema-build 0s, root-suite 151s,
  docs-generated-projection 1s, skill-context-budgets 1s, journal-carrier-check
  1s, dependency-advisories 1s, crate-suite-bun 88s, crate-suite-node 111s,
  schema-node-compat 7s, pi-node-compat 25s, pi-compat-guard 25s.
- **F1** — 2026-11-22, external-verify blockers B1–B7 folded at
  3da5ee0883e4870dca8666e48ab619d3209e5e65 (advisories A1/A2/A4 folded with
  them; A3/A5 stand per D3) · verified by E1–E10 and G1: the corpus that
  reproduces every blocker is red on the pre-fix tree (E1/E2 and the readings in
  `external-verify.md`) and green after the batch, and `verify` exits 0 with
  `violations: []`.
- **V2** — 2026-11-22, the six acceptance rows this batch corrected (AC1, AC2,
  AC3, AC9, AC11, AC13) · recheck = their repointed commands re-run — E3 (wiring
  `5 pass / 0 fail` under the corrected AC2/AC11 command), E9 (every diff path
  named; the outside-tree clause scoped), E10 (`tsc`, the recipe and `verify`),
  E4/E6 (AC13's quantifier over the params-reading results, the pre-fix
  reproduction in E1) · pass.

## Next

Land P1: the wiring suite alone, observed red.

## References

- Issue [#678](https://github.com/gtrabanco/agentic-workflow/issues/678) — the request. PR [#682](https://github.com/gtrabanco/agentic-workflow/pull/682) closes it (`Closes #678`).
- Issue [#274](https://github.com/gtrabanco/agentic-workflow/issues/274) — `docs/features/70-pi-tool-surface/SPEC.md`, the unit that introduced the tool surface.
- Issue [#555](https://github.com/gtrabanco/agentic-workflow/issues/555) — `docs/features/555-programmatic-runner/SPEC.md`, the runner door `agentic_workflow_run`.
- `packages/pi-agentic-workflow/README.md` § Workflow tools (deferred).

## Branch

`fix/678-deferred-tool-cwd-trap`

## Depends on

Empty — independent. The runner resolver drift the issue defers is issue #679's
unit, and this change does not touch it.

## Regression scope

| Scenario | Verified by |
|---|---|
| The Pi-free spec seam still drives every tool (the suite this unit does not rewrite) | `bun test packages/pi-agentic-workflow/test/workflow-tools.test.mjs` exits 0 |
| The five gate/status tools keep their schema branches and exit-code mapping (`isError` with data on a red gate) | the same suite's `spawnDouble` cases exit 0 |
| A readable cwd still resolves to itself, byte for byte | `bun test packages/pi-agentic-workflow/test/conductor-sensor.test.mjs` exits 0 |
| The conductor's own sensor path keeps working with the cwd it resolves | the same suite and `bun run test` in the package exit 0 |
| The host double that registers commands but no tools still loads the extension | `bun test packages/pi-agentic-workflow/test/shipped-adapter.test.mjs` exits 0 |

## Review

Not run on this change: the owner's instruction applies the issue through the
local inline workflow, where the §5 ledgers substitute for the lane's plan step
and the owner is the external verifier. The deterministic gate ran in full (G1)
and is the only ceremony claimed here.
- **V1** — 2026-11-21, the acceptance rows and their receipts (the re-cut carrier
  keeps them under `log-kind@1`'s `V` token; the `## Evidence` table is the legacy
  carrier's):
  | AC1 (S1) | `git diff --name-only 3f749feeb..HEAD` | every diff path named in `## Impact` — unit carriers, code, tests, README, changeset, roadmap + projection, the budgets manifest and the unit's journal fragments (enumeration in § E9; G1's `secret-scan` range) | pass |
  | AC2 (S2) | the wiring suite's two title cases | E3 (5 pass / 0 fail); E1 is their red counterpart | pass |
  | AC3 (S3) | `bunx tsc --noEmit` in the package; the spec seam's shape | `tsc` clean in E6 and G1's `pi-compat-guard`; `WorkflowToolSpec.execute(params, cwd)` unchanged, the translation is `hostTool` | pass |
  | AC4 (S4) | the sensor's refusal case + the call-site count | E4 (`cwd-unresolved: "…" is not a readable directory`; `rg -c` = 1, the header comment) | pass |
  | AC5 (S5) | the six registered tools' arity | E5 (28 pass / 0 fail, `execute.length === 5`); E3's first case | pass |
  | AC6 (S6) | `runSensor` never reaches `process.cwd()` | E4; E7's differential shows the base sampling the process cwd and the head refusing | pass |
  | AC7 (S7) | the wiring suite lands red | E1/E2 at `9abeb4b67`, 5 and 1 failures respectively | pass |
  | AC8 (S8) | the resolver pairing's diff | E9 (0 lines; `package.json` empty) | pass |
  | AC9 (S9) | the peer floor and the harness surface | E9 (`package.json` diff empty); the diff reaches no file outside the tree (the disclosed global-install residue was reverted) | pass |
  | AC10 (S10) | the issue's quoted reproducer | E3's `agentic_workflow_run` case answers `{ subcommand, stdout, stderr, exitCode }`; E1 shows the pre-fix `THROW` | pass |
  | AC11 (S11) | the status tool samples `ctx.cwd` | E3's `status: the host's ctx.cwd is the project the sensor samples` | pass |
  | AC12 (S12) | the package's own suite | E6 (1041 pass / 0 fail, the wiring suite included); G1's `pi-node-compat` and `pi-compat-guard` | pass |
  | AC13 (S13) | the quoted message never comes from the package path | E1 (pre-fix, reproduced) vs E3 (post-fix, absent); the wiring suite asserts its absence on every params-reading tool (status reads no params) | pass |

  2026-11-22 external-verify batch: the AC1, AC9 and AC13 cells above were
  corrected in place — their earlier readings carried a stale path count, an
  unscoped outside-tree absolute and an "every tool" quantifier the suite does
  not assert; `external-verify.md` beside this document holds the verdict, and
  the correction's own receipts are `E`/`G` lines in `## Log`.
