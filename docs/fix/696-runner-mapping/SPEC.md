---
type: fix
scope: large
roadmap_summary: Issue [#696](https://github.com/gtrabanco/agentic-workflow/issues/696) (L, high): the runner's pi mapping now reaches the point of execution — `bundle-skills.mjs` injects one canon block owned by `RUNNER.md` into every staged `SKILL.md` that cites `runner <subcommand>`, the extension's bash seam turns a literal `runner …` shell call into the same teaching, and the tool-choice guard stops suggesting a `scripts/…` path the session's project does not have, and a deferred tool's result reaches the model through pi's `content` channel. Applied through the owner's local inline workflow (ledgers frozen at cut). PR [#697](https://github.com/gtrabanco/agentic-workflow/pull/697).
ac-hash: ef54108d8baa7097bc0a785f313c972ab7be172f7ffd1944e56efab21e8946a8
---

# fix/696-runner-mapping

> One-line: the symbolic `runner <subcommand>` citation is delivered where it is
> executed — the packaged skill carries the pi mapping, the shell form is refused
> with that same mapping, and the guard's repair stops pointing into a tree the
> consumer does not have.

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

`#696` — `ISSUE: pi pack never delivers the runner mapping at the point of
execution — sessions shell-run the symbolic runner citation (exit 127)`. The PR
closes it via `Closes #696`. The issue carries the `bug` and `urgent` labels and
its severity is `high`. Applied through the owner's local, unpublished inline
workflow: the ledgers below are the plan, no repository review machinery runs on
this change, and the diff is handed to the owner as the external verifier.

## Specs

`S1` is the owner's instruction; `S2`–`S9` are the issue's own `## Acceptance
criteria`, one requirement per criterion, quoted verbatim and in the issue's
order.

**S1 — Apply issue #696 to this repository.**
> Apply to this repository: issue #696

**S2 — AC1: the bundle carries the mapping, its text has one owner, and drift fails.**
> AC1 — `bundle-skills.mjs` prepends a canonical, short run-time mapping block to every staged SKILL.md that cites `runner <subcommand>`; the block's text is owned by one canon block in `skills/runner-contract/references/RUNNER.md` (declared in the normative-surfaces inventory) and the gate fails on drift between owner text and the injected wording — no second hand-maintained copy (IR11). (Length ceiling: fix it after the block is written, not before — it must fit the surfacing instruction too.)

**S3 — AC2: the mapping is executable advice, not just a tool name.**
> AC2 — the injected block (and the canon block) states, at minimum: in a pi session `runner <subcommand>` is the `agentic_workflow_run` tool (or the package's typed tool), never a shell command; the session surfaces it via the `agentic-workflow` tool lookup (`tool_search`/codemode `searchTools`) when it is not already declared; outside pi, see `runner-contract/references/RUNNER.md`. A mapping that names the tool without the discovery path is a failing AC2.

**S4 — AC3: the standalone tree and the crate are untouched by the injection.**
> AC3 — the standalone `skills/` tree and the crate (`packages/agentic-workflow`) are untouched by the injection: no prose runtime-detection return, no launcher decision restated in a skill. (AC7's guard change is a scripted behaviour change, not prose, and is out of this clause's scope.)

**S5 — AC4: a regression test pins present, absent and byte-equal.**
> AC4 — a regression test on the bundler pins the injection (present for every skill citing `runner `, absent for skills that do not, text byte-equal to the canon block).

**S6 — AC5: the incident's invocation runs through the tool surface.**
> AC5 — re-running the incident's invocation in a fresh session (`/batch-scheduler` in a target project) executes through the tool surface and prints the `batch-plan@4` envelope rather than exit 127.

**S7 — AC6: the bash seam converts the first literal attempt into the teaching.**
> AC6 — the bash tool-call seam rejects a `runner`-headed shell command with the same canon mapping (including the discovery path); the refusal names the subcommand and exits to the session as a teaching refusal, never executing a guess. Regression test over the hook's classifier (head `runner`, args preserved, non-runner commands untouched).

**S8 — AC7: the guard's repair is grounded in the session's project.**
> AC7 — the tool-choice guard's repair reasons are project-grounded: a `scripts/…` path appears in a suggestion only when `existsSync` (or equivalent) resolves it in the session's cwd; when it does not, the reason carries no path and points at the pi tool surface or the runner contract. Regression test: from a cwd without `scripts/batch-scheduler.mjs`, the `node` refusal names no such path; from the authoring checkout it still does.

**S9 — AC8: the discovery instruction resolves to a findable surface.**
> AC8 — end-to-end amendment check: with the tools never surfaced at session start, a session whose only input is the injected block can reach `agentic_workflow_run` through the discovery path the block names (the block's discovery instruction resolves to a real, findable surface — verified once in a fresh pi session, recorded in the unit doc).

```text
spec-requirement@1
kind | shape | what it orders
requirement | **S<n>[a-z]? — <title>.** | one requirement; the id is what a task links and a finding cites
quote | > <the requester's words, verbatim> | the requirement's own text, unedited apart from a marked elision
correction | **S<n><letter> — <title>.** | an appended amendment to requirement S<n>; never an edit of it
```

## Acceptance criteria

Frozen at the cut; `ac-hash:` in the frontmatter is this section's SHA-256
(heading and the next `## ` excluded). One criterion per requirement, each
naming the check that proves it.

1. **S1 — the issue is applied, not reinterpreted.** `git diff --name-only $(git merge-base origin/main HEAD)..HEAD` lists only the paths `## Impact` names, and every `S#` above appears verbatim in this document.
2. **S2 — the injection is delivered, owned once and drift-gated.** `bun test packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs` exits 0 with `the block is injected after the frontmatter of every skill that cites the symbolic form`, `the injected text is byte-equal to RUNNER.md's canon block` and `the injected block is inside its declared ceiling`; `bun test scripts/normative-drift.test.mjs` exits 0 with the `runner-mapping` row resolved from `AGENTS.md`'s inventory.
3. **S3 — the block is executable advice.** The same suite exits 0 with `the block names the tool, the deferred discovery path and the outside-pi pointer`.
4. **S4 — the standalone tree and the crate's runner modules are untouched.** `git diff --name-only $(git merge-base origin/main HEAD)..HEAD -- skills` matches exactly `skills/runner-contract/references/RUNNER.md`, and `git diff --name-only $(git merge-base origin/main HEAD)..HEAD -- packages/agentic-workflow/src/runner` matches 0 lines.
5. **S5 — present, absent and recomputed, never trusted.** `bun test packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs` exits 0 with `a skill that does not cite the symbolic form carries no block`, and `bun test packages/pi-agentic-workflow/test/skill-parity.test.mjs` exits 0 with `every bundled file equals its declared projection — byte-identical when nothing applies to it` — the injection recomputed from the same owner text, not read back from the build.
6. **S6 — the incident's command answers with its envelope.** The unit doc's `## Log` records the `batch-scheduler` run in a `mktemp` project through the runner door the block names, printing `batch-plan@4` with exit 0 and no `command not found`.
7. **S7 — the shell form is refused as a lesson.** `bun test packages/pi-agentic-workflow/test/runner-citation.test.mjs` exits 0 with `the classifier reads a runner head and preserves its arguments`, `the refusal names the subcommand and states the canon block` and `non-runner and path-qualified commands are untouched`.
8. **S8 — the repair is project-grounded.** `bun test packages/agentic-workflow/test/tool-choice.policy.test.mjs` exits 0 with `a scripts path the session's project lacks never appears in the reason, and the rewrite stands down`; `bun test packages/pi-agentic-workflow/test/tool-choice-guard.test.mjs` exits 0 with `the shipped handler names no scripts path from a cwd without it` and `the shipped handler keeps the path when the project has it`.
9. **S9 — the discovery path resolves.** `## Log` records the pinned pi build's own `tool_search` declaration (`TOOL_SEARCH_TOOL_NAME` in `packages/…/pi-coding-agent/dist/extensions/tool-search/tool.js` at the pinned version) plus the fresh headless session that reached `agentic_workflow_run` from the injected block alone.

## Impact

Three delivery layers and the prose that declares them:

- `skills/runner-contract/references/RUNNER.md` — gains the `runner-mapping@1`
  canon block in `## In a pi session`; it is the one owner of the mapping, and
  its prose stops restating what the block says.
- `packages/pi-agentic-workflow/scripts/bundle-skills.mjs` — reads that block
  from the canonical tree and splices it into every staged `SKILL.md` that cites
  the symbolic form, after the frontmatter (a `SKILL.md` whose first bytes are
  not `---` stops being a skill). Two helpers are exported so the parity suite
  recomputes the same projection instead of trusting the build.
- `packages/pi-agentic-workflow/test/skill-parity.test.mjs` — the parity
  expectation becomes the declared projection *including* the injection, read
  through those helpers (a contract change, never a weakened assertion).
- `packages/pi-agentic-workflow/src/extension/runner-citation.ts` (new) — the pure
  classifier and refusal text; `src/extension/index.ts` wires it into the
  `tool_call` bash seam and reads the canon block once from the staged bundle.
- `packages/agentic-workflow/src/tool-choice/policy.mjs` and its type
  projection `policy.d.mts` — the `node` classifier gains an injected
  existence probe: a `scripts/…` operand that does not resolve in the session's
  project makes the violation unrewritable and the reason pathless. The module
  stays pure (no filesystem); the caller injects the probe.
- `packages/pi-agentic-workflow/src/guards/tool-choice.ts` — forwards the
  probe; `src/extension/index.ts` supplies `existsSync(resolve(ctx.cwd, rel))`.
- `packages/agentic-workflow/test/tool-choice.policy.test.mjs`,
  `packages/pi-agentic-workflow/test/tool-choice-guard.test.mjs` and the two new
  suites — the receipts.
- The declared prose and machine surfaces: `AGENTS.md`'s
  `normative-surfaces@1` gains the `runner-mapping` row;
  `docs/workflow/GATE_INVENTORY.md`'s `normative-surface-grammar` row lists it;
  `docs/workflow/SKILL_CONTEXT_BUDGETS.json` re-pins the guide's `machineLines`
  and, if the block outgrows it, `runner-contract`'s reference ceiling;
  `packages/pi-agentic-workflow/README.md` states the delivered mapping, the
  seam's refusal and the grounded repair.
- `packages/pi-agentic-workflow/src/extension/index.ts` `hostTool` — discovered
  during the AC5 end-to-end run and repaired in-unit: the adapter translated the
  *call* (issue #678) but passed the spec's `{ text, structuredContent, isError }`
  result straight through, while pi 1.6's `AgentToolResult` carries the
  model-facing text as `content` and reserves `structuredContent` for
  programmatic callers — so every deferred tool answered the model with an empty
  result. `hostToolResult` translates it; `workflow-tools-wiring.test.mjs` gains
  the result-convention cases.
- `.changeset/696-runner-mapping.md` — the two shipped packages' patch intent.
- `docs/ROADMAP.md` + `docs/generated/units.md` — the deterministic emitter's
  sync from `roadmap_summary:`, never a hand edit.
- `.agentic-workflow/journal/*.md` — the fragment carrier's delta on this
  branch: the ten pending fragments (`20261122T*`: `main-narrative` ×6,
  `fix-690` ×4) consumed into the `docs/LOGS.md` session entries by this unit's
  closing session's log-session aggregation (commit `bdcb80bb9`), plus this
  correction batch's own session fragment; the carrier is the repository's own
  volatile state, and the aggregator consumes it on merge.
- This unit's own carriers and the session entry in `docs/LOGS.md`.

## Surfaces

- `packages/pi-agentic-workflow`
- `packages/agentic-workflow`
- `skills/runner-contract`
- `docs`

## Retirements

Nothing is retired. The change is additive in every layer: the projection
manifest keeps its one rule, `runner-set@1`/`runner-pin@1` keep their text and
their readers, the tool-choice classifier keeps its two violation kinds and its
forwarding tables, and no flag, cell or refusal code is removed. The two
narrowings are stated, not silent: the packaged `SKILL.md` files grow a block
they did not carry (a delivery gap, not a rule), and a `node` command naming a
`scripts/…` path the session's project lacks stops being rewritable — this
module's own `node`-default class is untouched everywhere else, pinned by the
existing 21 cases.

## Non-goals

- The crate's runner resolver, its closed set, its pin or the pi package's
  runtime detection (S4): the defect was the un-delivered mapping, never the
  resolution.
- A launcher sentence in any skill, or a runtime-detection return in prose (S4).
- Rewriting the pi bundle's projection manifest grammar: the injection is the
  bundler's own declared transform, and the manifest's closed op set
  (`remove | pointerize | prereq`) is untouched.
- The deferred tool surface's signature or registration (issue #678 owns it).
- A general "a shell command that cannot exist" guard: only the `runner` head is
  refused, and only when it is not spelled as a path.

## Risk tier

Copied verbatim from `runner ceremony tier classify` over the executable paths
(`packages/pi-agentic-workflow/scripts/bundle-skills.mjs`,
`packages/pi-agentic-workflow/src/extension/runner-citation.ts`,
`packages/agentic-workflow/src/tool-choice/policy.mjs`): `tier: standard`,
`reason_kind: executable-content`, `signals: []`, `task_size: { understood:
true, contained_risk: contained, resumable_from_diff: true }`.

- **Tier** — `standard` · **Task Size** — `large`
- **Named high-risk item** — none — no network call, no forge write, no live
  state: the injection is a build-time string splice exercised in `mktemp`
  trees, the seam refusal is a pure classifier over a command string, and the
  guard's probe is one `existsSync` over the caller's own project.

## Future

none

## Future cost

- **One owner for the mapping.** Any future change to what a pi session does
  with `runner <subcommand>` edits `RUNNER.md`'s `runner-mapping@1` block and
  nothing else; the bundle follows at the next build and the drift gate fails a
  hand-edited copy. Binds: `/runner-contract`, the pi package's bundler, this
  repository's reviewers.
- **A `scripts/…` suggestion is a claim about the reader's tree.** Any future
  repair hint that names a repo-relative path must answer for the *session's*
  project, not this repository's. Binds: `policy.mjs`'s reason builders and
  every caller that injects an existence probe.

## Applicable tests

- `bun test packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs`
- `bun test packages/pi-agentic-workflow/test/runner-citation.test.mjs`
- `bun test packages/pi-agentic-workflow/test/skill-parity.test.mjs`
- `bun test packages/pi-agentic-workflow/test/runner-prose.test.mjs`
- `bun test packages/pi-agentic-workflow/test/projection.test.mjs`
- `bun test packages/pi-agentic-workflow/test/tool-choice-guard.test.mjs`
- `bun test packages/pi-agentic-workflow/test/bundle-lifecycle.test.mjs`
- `bun test packages/agentic-workflow/test/tool-choice.policy.test.mjs`
- `bun test scripts/normative-drift.test.mjs`
- `bun test scripts/tool-choice-parity.test.mjs`
- `bun test scripts/invocation-drift.test.mjs`
- `bun scripts/check-skill-context.mjs --documents`

## Known pre-existing issues

- **`scripts/phase-lint.test.mjs` runs long under gate load** — the gate's
  suite wall-clock bound is 120s and this suite has measured near it on a loaded
  box. `does-not-affect` this unit: the suite reads plan fixtures this change
  never touches.
- **The codemode lookup's global name is inconsistent inside the pinned pi
  build** — the pinned package's own codemode doc names `n(query, …)` while
  this session's own codemode tool description names `searchTools`, so the block
  refuses to spell a codemode search global at all and names the pi tool plus
  the by-name call instead (recorded as `PE-003`). `affects` the block's wording
  only, and the choice is evidenced in the ledger.

- **The roadmap's Features table carries a duplicate `98` row, so
  `roadmap-settle` is red on `main` and on this branch alike** — the settled #537
  row (`98 · \`deterministic-tool-doctor\` · idea`) and fix #361's carried row
  (`98 · \`finding-severity-ladder\` · done`) both claim unit 98, and
  `runner roadmap-settle` reports `docs/features/98-deterministic-tool-doctor/SPEC.md:1
  slug-mismatch`. Verified pre-existing at the base commit
  (`fe4003e96`): a \`git archive\` of the base plus this worktree's
  `node_modules` reports the same single violation (267 docs vs 268 here, the
  extra one being this unit). `affects` the gate: `scripts/local-gate.mjs` reports
  `root-suite` red and skips its five dependants (run by hand, all green). Left
  alone on purpose — the row is the owner-managed index, no emitter deletes a
  row, and removing another unit's row is not this change's scope. `IR3`-safe:
  the suite's own fixture cases stay green, and only its live-tree case is red.
- **`ceremony roadmap settle` cannot settle a fix row** — found while closing this
  unit (2026-11-22). The op reads a row's PR URL from `row.summary ?? row[4]` and
  its status from `row.status ?? row[3]`, both of which are the *Features* table's
  five-column shape: `roadmapTableRows` returns positional cells, so on the
  four-column Fixes table `row[3]` is the Notes cell and `row[4]` does not exist.
  A fix row is therefore never settled by the op (`settled: 0`), which is the
  same class as fix #684's path/document defect. `does-not-affect` what this unit
  changes, but `affects` its close-out: the row was settled by invoking the crate's
  own writer (`fixRowUpsert`) with the settled cell the op's feature branch
  produces, never by editing prose by hand (`D4`). Reported, not repaired — the
  op belongs to the ceremony CLI's owner.
- **The pi bundle's `RUNNER.md` keeps the mapping block after the projection** —
  the projection pointerizes `## The invocation` only, so the packaged contract
  still states the pi mapping; that is intended (the block is the mapping), and
  `runner-prose.test.mjs` pins it. `does-not-affect` any consumer.

## Tasks

- P1 — Land the frozen-failure corpus alone: the injection suite, the citation
  suite, the project-grounded cases in the two tool-choice suites, and the
  parity suite's recomputation of the injection — observed red against the
  unchanged modules.
  (validator: `bun test packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs` at that commit exits 1 naming the missing injection cases)
  (Implements: S2, S3, S5, S7, S8)
  - Relevant files: packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs, packages/pi-agentic-workflow/test/runner-citation.test.mjs, packages/pi-agentic-workflow/test/skill-parity.test.mjs, packages/agentic-workflow/test/tool-choice.policy.test.mjs, packages/pi-agentic-workflow/test/tool-choice-guard.test.mjs
- P2 — Freeze the canon block in `RUNNER.md` and inject it at bundle time, after
  the frontmatter, from the one owner text.
  (validator: `bun test packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs` exits 0 and `bun test packages/pi-agentic-workflow/test/skill-parity.test.mjs` exits 0)
  (Implements: S2, S3, S4, S5)
  - Relevant files: skills/runner-contract/references/RUNNER.md, packages/pi-agentic-workflow/scripts/bundle-skills.mjs, packages/pi-agentic-workflow/test/skill-parity.test.mjs
- P3 — Refuse the `runner`-headed shell form at the bash seam, stating the same
  canon block.
  (validator: `bun test packages/pi-agentic-workflow/test/runner-citation.test.mjs` exits 0)
  (Implements: S7)
  - Relevant files: packages/pi-agentic-workflow/src/extension/runner-citation.ts, packages/pi-agentic-workflow/src/extension/index.ts
- P4 — Ground the tool-choice repair in the session's project through an
  injected existence probe.
  (validator: `bun test packages/agentic-workflow/test/tool-choice.policy.test.mjs` exits 0 and `bun test packages/pi-agentic-workflow/test/tool-choice-guard.test.mjs` exits 0)
  (Implements: S8)
  - Relevant files: packages/agentic-workflow/src/tool-choice/policy.mjs, packages/agentic-workflow/src/tool-choice/policy.d.mts, packages/pi-agentic-workflow/src/guards/tool-choice.ts, packages/pi-agentic-workflow/src/extension/index.ts
- P5 — Ship the declared prose and state: the inventory row, the gate-inventory
  covers entry, the re-pinned budgets, the package README's currency, the
  changeset and the generated roadmap projection.
  (validator: `bun test scripts/normative-drift.test.mjs` exits 0 and `bun scripts/check-skill-context.mjs --documents` exits 0)
  (Implements: S2, S4, S9)
  - Relevant files: AGENTS.md, docs/workflow/GATE_INVENTORY.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json, packages/pi-agentic-workflow/README.md, .changeset/696-runner-mapping.md
- P7 — Translate the tool result into the host's convention, so a deferred
  tool's output reaches the model rather than stopping at `structuredContent`
  (discovered by P6's AC5 run; required by S6).
  (validator: `bun test packages/pi-agentic-workflow/test/workflow-tools-wiring.test.mjs` exits 0 with `every tool answers the host's result convention, not the spec's`)
  (Implements: S6)
  - Relevant files: packages/pi-agentic-workflow/src/extension/index.ts, packages/pi-agentic-workflow/test/workflow-tools-wiring.test.mjs
- P6 — Verify like a writer: the derived test-impact set, the differential
  against the base commit, the two end-to-end receipts (S6, S9), the local gate
  and the session entry.
  (validator: `bun scripts/local-gate.mjs --jobs 4 --no-bail` exits 1 with every runnable step's output recorded, its only red `root-suite → scripts/roadmap-settle.test.mjs` (the base-present `A1`) and the five dependants skipped — those five exit 0 by hand — and `bun scripts/test-impact.mjs --base origin/main` exits 0 printing the derived set)
  (Implements: S1, S6, S9)
  - Relevant files: docs/fix/696-runner-mapping, docs/LOGS.md

### Planning evidence

Frozen at the cut in [`planning-evidence.md`](planning-evidence.md) (large unit —
the ledger lives beside this document, never both).

### Obligations

Frozen at the cut in [`planning-obligations.md`](planning-obligations.md) (large
unit — the ledger lives beside this document, never both). Before the unit
ships, every row is `verified` or an evidenced `n/a`.

## Triaged steps

`n/a — the owner's local inline workflow substitutes for the lane's plan step:
§5's ledger freeze is the plan, and no `unit-route --triage` block is derived for
this change (it would be a second, competing step list).`

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-22, `#696` — the owner's instruction and the issue's words,
  verbatim, are `## Specs` S1–S9 above (the issue body is the source; it is not
  duplicated here a second time).
- **L2** — 2026-11-22, the owner's instruction that binds this document's shape,
  verbatim: "Apply to this repository: issue #696" — applied through the local,
  unpublished inline workflow: the §5 ledger freeze is the plan, only the
  repository's deterministic gates run, and the diff is handed to the owner as
  the external verifier.
- **E1** — 2026-11-22, the frozen corpus at `273c5a306`, red against the unchanged tree: `bun test packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs` · exit 1 · 0 pass / 7 fail; `…/runner-citation.test.mjs` · exit 1 · 0 pass / 4 fail; `…/skill-parity.test.mjs` · exit 1 · `Export named 'projectSkillFile' not found`; `bun test packages/agentic-workflow/test/tool-choice.policy.test.mjs` · exit 1 · 22 pass / 2 fail (F22, F24); `…/tool-choice-guard.test.mjs` · exit 1 · 13 pass / 1 fail (F30 red, F31 green — today's behaviour pinned).
- **E2** — 2026-11-22, the injection lands (`a52c7b1de`): `bun run bundle:skills` · exit 0 · `bundled 29 skills (105 files) · projected: 22 files · excluded: skill-lint`; `bun test …/runner-mapping-injection.test.mjs` · exit 0 · 7 pass; `…/skill-parity.test.mjs` · exit 0 · 8 pass; `…/runner-prose.test.mjs` + `…/projection.test.mjs` · exit 0 · 23 pass.
- **E3** — 2026-11-22, the block measures 120 est (ceiling 132 declared after it); `bun scripts/check-skill-context.mjs --skill runner-contract` · exit 0 · `runner-contract 676 / 62 lines / 1 ref`; RUNNER.md 3985 est against its re-based 4384.
- **E4** — 2026-11-22, the seam and the grounded repair (`a5e91ad6d`): `bun test …/runner-citation.test.mjs` · exit 0 · 4 pass; `…/tool-choice-guard.test.mjs` · exit 0 · 14 pass; `bun test packages/agentic-workflow/test/tool-choice.policy.test.mjs` · exit 0 · 24 pass.
- **E5** — 2026-11-22, the result-shape repair (`S6`'s model-facing half, found by E8): `bun test packages/pi-agentic-workflow/test/workflow-tools-wiring.test.mjs` · exit 0 · 7 pass, including `every tool answers the host's result convention, not the spec's` and `a non-zero exit stays an error result with its output`.
- **E6** — 2026-11-22, the differential: base `policy.mjs` (`fe4003e96`) vs this branch over 88 commands (the frozen drift corpus plus the new cases), `analyzeToolChoice` and `forwardCommand` with no probe · 0 difference(s).
- **E7** — 2026-11-22, the derived set and the boundaries: `bun scripts/test-impact.mjs --base fe4003e96` · `verdict: targeted` · 13 suites, 15 symbols; `git diff --name-only fe4003e96..HEAD -- skills` · one line (`skills/runner-contract/references/RUNNER.md`); `… -- packages/agentic-workflow/src/runner` · 0 lines.
- **E8** — 2026-11-22, **S6/AC5 end to end in a fresh pi session** (headless, `mktemp` project that is not this repository, the staged `batch-scheduler` skill loaded, `--tools "+tool_search"`, the workflow tools never declared at start): `TOOL SEARCH: tool_search | RUNNER TOOL: agentic_workflow_run | EXIT: 0 | SCHEMA: batch-plan@4`. Before E5's fix the same session reached the tool and saw no output — the envelope sat in `structuredContent` while pi reads `content`.
- **E9** — 2026-11-22, **S7/AC6 end to end in a fresh pi session**: the session ran the literal `runner workflow-status` once and answered `REFUSED: yes | SUBCOMMAND NAMED: workflow-status | TOOL NAMED: agentic_workflow_run` — the seam refused the call before the shell saw it, and the refusal carried the canon block.
- **E10** — 2026-11-22, **S9/AC8's discovery surface verified at the pinned version**: `pi-coding-agent@1.6.0` `dist/extensions/tool-search/tool.js` publishes `TOOL_SEARCH_TOOL_NAME = "tool_search"` and `isSearchable` accepts `codemode` and `deferred` — the exposures `workflow-tools.ts` registers — so the block's instruction resolves to a real, findable surface, and E8 is the session that used it.
- **E11** — 2026-11-22, the declared prose and surfaces (`bfd0471fa`): `bun scripts/check-skill-context.mjs --documents` · exit 0 · 7 budgeted documents (guide 681 lines / 222 machine / 459 prose / 14,421 est); `bun test scripts/normative-drift.test.mjs` · exit 0 · 24 pass; `bun packages/agentic-workflow/bin/agentic-workflow.mjs docs-generate --check` · exit 0 · `3 checked · 0 missing · 0 stale · 0 orphaned`.
- **E12** — 2026-11-22, the packages' own suites: `bun run test` in `packages/pi-agentic-workflow` · exit 0 · 1070 pass / 0 fail (93 files); in `packages/agentic-workflow` · exit 0 · 78 suites; `bun run test:node` in the pi package · exit 0 · 1 skipped; in the crate · exit 0; in `packages/agentic-workflow-schema` · exit 0.
- **G1** — 2026-11-22, HEAD `bdcb80bb9` (`bun scripts/local-gate.mjs --jobs 4 --no-bail`) · the only red is `root-suite` → `scripts/roadmap-settle.test.mjs`, pre-existing at the base commit (see Known pre-existing issues); its five dependants were skipped and run by hand: `crate-suite-bun` exit 0, `crate-suite-node` exit 0, `schema-node-compat` exit 0, `pi-node-compat` exit 0, `pi-compat-guard` clean on both legs (`--only pi-compat-guard` · exit 0 · 25s).
- **D1** — 2026-11-22, the injected block carries no codemode search global: the pinned pi build spells it `n` in its own codemode doc and `searchTools` in this session's codemode description, so the block names the pi tool plus the by-name call, both verified (`PE-003`). Authority: S3.
- **D2** — 2026-11-22, the seam refuses only a bare `runner` head: a path-qualified spelling is a real binary a project may ship, and refusing it would be an accusation the carrier cannot answer (`PE-011`). Authority: S7.
- **D3** — 2026-11-22, **in-unit discovery and repair:** E8's first run showed the envelope arriving in `structuredContent` but not in the model-facing channel, because the adapter translated the call (issue #678) and passed the spec's result through while pi 1.6 reads `content`. Repaired here under `O15`/`P7` — `S6` cannot be satisfied without it — and disclosed rather than folded into the plan.
- **P1** — 2026-11-22, the frozen corpus alone · `273c5a306`.
- **P2** — 2026-11-22, the canon block and the bundle injection · `a52c7b1de`.
- **P3** — 2026-11-22, the bash seam and the project-grounded repair · `a5e91ad6d`.
- **P4** — 2026-11-22, the declared prose, the inventory row and the re-pinned ceilings · `bfd0471fa`.
- **P5** — 2026-11-22, the result-shape translation and its wiring cases · the handoff's head.


- **D4** — 2026-11-22, the fix row settles to `done · [#697](…)` through
  `fixRowUpsert` directly, because `ceremony roadmap settle` cannot read a fix
  row's cells at all (see Known pre-existing issues). The status cell is the one
  the op's own feature branch writes and the summary cell stays the unit doc's
  `roadmap_summary:`, so no hand-written prose enters the index and
  `roadmap-settle` is green for this unit.
- **P6** — 2026-11-22, the PR opens at
  [#697](https://github.com/gtrabanco/agentic-workflow/pull/697) and the roadmap
  row settles to `done` through the ceremony CLI; the push used the pre-push
  hook's own documented escape hatch (`AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1`),
  recorded with its reason in the PR body and here: the only red is main's
  duplicate feature-98 row (`roadmap-settle`), verified pre-existing at the base
  commit and reported, never repaired, and the five steps the bail skipped ran by
  hand green (`G1`).
- **L3** — 2026-11-23, the owner's correction request, verbatim: "Apply to this
  repository: triage and fix those that deserve to fix but understand the
  context before fix and check you haven't broke another different thing, if
  you have done, start the loop again until you fixed full symbol/related
  stuff" — one correction batch over the 2026-11-23 external-verify receipt
  (`external-verify.md`, `Verdict: NEEDS-DECISION (B1, B2, B3, B4)`); triaged
  one-for-one: all four are this unit's own frozen claims, all four deserve the
  fix, and no code, test or gate changes.
- **F1** — 2026-11-23, B1 folded: O14's validator cell and P6's span no longer
  claim `local-gate` exits 0 — both now state the outcome the foreground run
  produces (`--no-bail` exit 1, only red `root-suite →
  scripts/roadmap-settle.test.mjs`, the base-present A1, five dependants exit 0
  by hand). O14 was flipped `planned` before the restatement and back to
  `verified` only on the re-run (`G2`, `E13`); the underlying red stays advisory
  A1 — the duplicate #98 row is another unit's owner-managed index row,
  untouched.
- **F2** — 2026-11-23, B2 folded: `## Impact` names the ten
  `.agentic-workflow/journal/20261122T*.md` fragments consumed into
  `docs/LOGS.md` by `bdcb80bb9`, so AC1's path check passes (0 unnamed journal
  paths; 10 unnamed at the batch head).
- **F3** — 2026-11-23, B3 folded: AC5's quoted witness re-spelled to the case
  the suite prints — `every bundled file equals its declared projection —
  byte-identical when nothing applies to it` — the name this branch landed at
  `273c5a306` (the frozen quote was the base-era name); the quote now occurs
  in `skill-parity.test.mjs` (absent at the batch head).
- **F4** — 2026-11-23, B4 folded: AC7's quoted witness re-spelled to
  `non-runner and path-qualified commands are untouched`, the name
  `runner-citation.test.mjs` carries since `273c5a306` (absent at the batch
  head). Disclosed with the repair: the recorded `ac-hash` never matched
  `sectionText` on any committed state — recomputed `66ecb56c…` at every
  commit `fa6f3e070..8ce62fa96`, and heading-inclusive variants plus the issue
  body miss too — so the freeze-era draft bytes are unrecoverable; the
  frontmatter now carries the owner procedure's recomputation over the amended
  section (`skills/unit-lane/references/DESIGN.md` §acceptance):
  `ef54108d8baa7097bc0a785f313c972ab7be172f7ffd1944e56efab21e8946a8`,
  round-trip verified.
- **E13** — 2026-11-23, the batch's foreground re-runs: the journal-path check
  vs `## Impact` · 0 unnamed (10 at the batch head); AC5's quote in
  `skill-parity.test.mjs` · present; AC7's quote in `runner-citation.test.mjs` ·
  present; `ac-hash` round-trip through `sectionText` · match;
  `bun scripts/test-impact.mjs --base origin/main` · exit 0 · `verdict:
  targeted` · 16 paths / 15 symbols; the five gate dependants by hand · all
  exit 0 (`crate-suite-bun`, `crate-suite-node`, `schema-node-compat`,
  `pi-node-compat`, `pi-compat-guard`).
- **G2** — 2026-11-23, the batch head (`bun scripts/local-gate.mjs --jobs 4
  --no-bail`) · exit 1 · 20 steps, sole red `root-suite →
  scripts/roadmap-settle.test.mjs` (A1, base-present), 5 dependants skipped —
  the restated O14/P6 outcome; full root suite (`node
  scripts/run-root-suite.mjs`) · 139 pass / 1 fail — the same A1 only;
  `bin verify docs/fix/696-runner-mapping/SPEC.md` · `VERIFY PASS` (sections,
  obligations-closure, provenance-stamp, receipt-marks, log-kinds, cited-paths,
  cited-gates); docs gates: `docs-generate --check` · PASS,
  `check-skill-context --documents` · PASS (7 documents), `normative-drift` ·
  24 pass.
- **P7** — 2026-11-23, the four-blocker correction batch: O14/P6's validator
  restatement, the `## Impact` journal scope, the two AC witness quotes and the
  `ac-hash` plan repair · `d169f3d71`; the session's journal fragment rides the
  next commit.

## Next

The owner's review of [#697](https://github.com/gtrabanco/agentic-workflow/pull/697):
the diff, the obligations ledger, the verification block, the two end-to-end
receipts, and the verdict on the one in-unit discovery (`D3`/`O15`).

## References

- Issue [#696](https://github.com/gtrabanco/agentic-workflow/issues/696) — the PR
  closes it: [#697](https://github.com/gtrabanco/agentic-workflow/pull/697).
- `skills/runner-contract/references/RUNNER.md` — the mapping's owner.
- [fix #679](../679-runner-invocation-traps-canary/SPEC.md) and
  [fix #678](../678-deferred-tools-signature-bug/SPEC.md) — the same contract's
  canary-coherence and deferred-tool halves.

## Branch

`fix/696-runner-mapping`

## Depends on

none

## Regression scope

- **The pieced bundle still participates in every consumer.** `bun test packages/pi-agentic-workflow/test/skill-parity.test.mjs`, `…/bundle-lifecycle.test.mjs`, `…/alias-coverage.test.mjs`, `…/folded-description.test.mjs` and `…/aw-index-command.test.mjs` exit 0: the staged `SKILL.md` keeps its frontmatter first, so the catalogue, the command registrar and the description reader read what they read before.
- **The projection still projects.** `bun test packages/pi-agentic-workflow/test/projection.test.mjs` and `…/runner-prose.test.mjs` exit 0: the pointerized invocation section, its hash and the "no launcher in the bundle" rule are unchanged.
- **The tool-choice policy keeps its verdicts.** `bun test packages/agentic-workflow/test/tool-choice.policy.test.mjs` exits 0 with its 21 pre-existing cases, and `bun scripts/invocation-drift.test.mjs` exits 0 — a caller that injects no probe sees today's behaviour byte for byte.
- **The other bash guards keep their order.** `bun test packages/pi-agentic-workflow/test/tool-choice-guard.test.mjs` and `…/receipt-guard.test.mjs` exit 0: the citation refusal runs before the tool-choice carrier and adds no decision to a command that has no `runner` head.
