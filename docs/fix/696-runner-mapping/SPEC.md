---
type: fix
scope: large
roadmap_summary: Issue [#696](https://github.com/gtrabanco/agentic-workflow/issues/696) (L, high): the runner's pi mapping now reaches the point of execution — `bundle-skills.mjs` injects one canon block owned by `RUNNER.md` into every staged `SKILL.md` that cites `runner <subcommand>`, the extension's bash seam turns a literal `runner …` shell call into the same teaching, and the tool-choice guard stops suggesting a `scripts/…` path the session's project does not have.
ac-hash: 549b5ba2742c917b176fbdfd55479f7f4767ba2aa1ed874a8f7aa3857c1cc175
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
5. **S5 — present, absent and recomputed, never trusted.** `bun test packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs` exits 0 with `a skill that does not cite the symbolic form carries no block`, and `bun test packages/pi-agentic-workflow/test/skill-parity.test.mjs` exits 0 with `every bundled file equals its declared projection — byte-identical when no rule names it` — the injection recomputed from the same owner text, not read back from the build.
6. **S6 — the incident's command answers with its envelope.** The unit doc's `## Log` records the `batch-scheduler` run in a `mktemp` project through the runner door the block names, printing `batch-plan@4` with exit 0 and no `command not found`.
7. **S7 — the shell form is refused as a lesson.** `bun test packages/pi-agentic-workflow/test/runner-citation.test.mjs` exits 0 with `the classifier reads a runner head and preserves its arguments`, `the refusal names the subcommand and states the canon block` and `non-runner commands are untouched`.
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
- `packages/pi-agentic-workflow/src/guards/runner-citation.ts` (new) — the pure
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
- `.changeset/696-runner-mapping.md` — the two shipped packages' patch intent.
- `docs/ROADMAP.md` + `docs/generated/units.md` — the deterministic emitter's
  sync from `roadmap_summary:`, never a hand edit.
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
`packages/pi-agentic-workflow/src/guards/runner-citation.ts`,
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
  build** — `docs/codemode.md` of the pinned version names `n(query, …)` while
  this session's own codemode tool description names `searchTools`, so the block
  refuses to spell a codemode search global at all and names the pi tool plus
  the by-name call instead (recorded as `PE-003`). `affects` the block's wording
  only, and the choice is evidenced in the ledger.

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
  - Relevant files: packages/pi-agentic-workflow/src/guards/runner-citation.ts, packages/pi-agentic-workflow/src/extension/index.ts
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
- P6 — Verify like a writer: the derived test-impact set, the differential
  against the base commit, the two end-to-end receipts (S6, S9), the local gate
  and the session entry.
  (validator: `bun scripts/local-gate.mjs --jobs 4` exits 0 and `bun scripts/test-impact.mjs --base origin/main` exits 0)
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

## Next

P1 — land the frozen-failure corpus alone and observe it red.

## References

- Issue [#696](https://github.com/gtrabanco/agentic-workflow/issues/696).
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
