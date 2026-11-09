---
type: feature
scope: medium
# ac-hash: <sha256 of the ## Acceptance criteria section — frozen below>
---

# 174 — pi-state-flow-lifecycle

> One-line: opt-in, command-scoped State Flow (SKILLSTATE-inspired) episode
> lifecycle around long-running `@gtrabanco/pi-agentic-workflow` commands —
> `/execute-phase` and `/fold-findings` auto enter and leave an explicit
> execution-state mode; design/plan/review/audit surfaces stay
> history-preserving; canonical `skills/` are untouched.

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim
between the quote markers. Cut one requirement per distinct ask, in the order the
request states them. **A later correction is appended under its own id**
(`S1a`, `S2a`, …) and never rewrites the id it corrects — that is what makes the
change diffable: a correction moves one line, everything else stays put.

**S1 — Apply issue #174 to this repository.**
> Apply to this repository: issue #174

The requirement content is the tracked issue body, frozen at cut
([gtrabanco/agentic-workflow#174](https://github.com/gtrabanco/agentic-workflow/issues/174)):
an **optional, command-scoped** integration in `@gtrabanco/pi-agentic-workflow`
so long-running workflow commands (starting with `/execute-phase` and
`/fold-findings`) automatically enter and leave an explicit execution-state
mode — without the user typing state-flow commands. Pi-package concern only;
canonical `SKILL.md` files stay agent-agnostic and unchanged. Default-off until
dogfooded; soft (optional) backend dependency on `@llblab/pi-state-flow`;
on-disk workflow state remains the source of truth; no full SKILLSTATE
per-step projection in v1 — v1 is the automatic episode lifecycle around the
allowlisted commands. The issue's six success criteria are the acceptance
anchor (`## Acceptance criteria` below).

The grammar the machine reads (`spec-requirement@1`): one `**S# — title.**` line
per requirement, followed by a `>` blockquote carrying the requester's words. A
correction is its own line with its own id (`S1a`) — never a rewrite of the line
it corrects.

```text
spec-requirement@1
kind | shape | what it orders
requirement | **S<n>[a-z]? — <title>.** | one requirement; the id is what a task links and a finding cites
quote | > <the requester's words, verbatim> | the requirement's own text, unedited apart from a marked elision
correction | **S<n><letter> — <title>.** | an appended amendment to requirement S<n>; never an edit of it
```

## Impact

What the change touches beyond its own files:

- **Consumes:** `@llblab/pi-state-flow` (soft, optional — never a hard
  dependency of `@gtrabanco/pi-agentic-workflow`) and Pi's documented
  `ExtensionAPI` surface (`getCommands`, `sendUserMessage`, the
  `agent_settled` event).
- **Consumers:** operators of the pi package — new `stateFlow` config block in
  the same two config files the model routing reads; a new section in
  `/agentic-workflow-settings`; a new bottom `## References` section in the
  root `README.md` (the issue's bibliography obligation).
- **What stops being true:** nothing is replaced; the change is purely
  additive. The root README gains its first `## References` section.
- **Ask before touching something live on the other side:** none — no shared
  live surface is modified. The shipped adapters in `skills/` are read-only for
  this unit.

Issue-body coordination point (2026-09-24 scope adjustment): if the #260
orchestrate path replaces in-orchestrator execution for long commands, the
state-flow lifecycle must follow the spawned work, not only the command turn.
#260's orchestrator is one command turn that spawns subagents and waits, so
`stopOn: "command_settled"` still covers it; the residual multi-prompt gap is
documented as a v1 limitation (O10), not silently dropped.

## Retirements

Nothing is retired: the unit is purely additive (one config block, one
lifecycle module, wrapper wiring, one settings section, docs). No surface,
token, helper, contract or narrative is superseded — `rg -c 'stateFlow'
packages/pi-agentic-workflow/src` is 0 at the base commit and the change adds,
never removes. The issue's stale `/state-flow-start`/`/state-flow-stop`
wording is a documentation correction inside this unit (PE-001), not a
retirement of shipped code.

## Non-goals

From the issue body, frozen at cut:

- Do **not** rewrite or fork `SKILL.md` content for Pi.
- Do **not** enable state-mode for all workflow commands by default.
- Do **not** replace on-disk workflow state (SPEC, roadmap, ledgers,
  REVIEW-PASS receipts) — those remain the durable source of truth.
- Do **not** hard-require `@llblab/pi-state-flow` for installing the package
  (soft/optional integration first).
- Do **not** implement full SKILLSTATE Algorithm 1 (per-tool-step prompt =
  only P, Σt, Ot) in v1 — follow-ups only.
- Findings discovered during implementation never expand scope.

## Risk tier

The unit's ceremony is proportional to risk, and the tier is **computed, never
chosen**: `bun scripts/ceremony.mjs tier classify` reads the change's paths and
contents and emits `passive | standard | high` (owner:
`skills/execute-phase/references/risk-tiers.md`, block `risk-tier-verdict@1`).
Verdict copied verbatim (2026-11-09, `--paths` scope = the planned change):

- **`standard`** — reason `executable-content` over 9 paths; `signals: []`.
- **Task Size** — `understood: true · contained_risk: contained ·
  resumable_from_diff: true · ceremony: unit-doc · verification: gates`
- **Named high-risk item** — `none — not a high-tier unit`

## Future

Ideas the user deferred ("down the road I'd like…"), captured with a date and a
status: `open`, `planned`, or `discarded <YYYY-MM-DD>`. This unit never
implements, specs, or tasks a row here. Reviewed at unit close, on session
resume, and whenever later work returns to the same area.

- **2026-11-09, open** — the issue's four declared follow-ups, verbatim:
  1. True SKILLSTATE-per-step backend: `context` / `before_provider_request`
     filter so each LLM call sees only P + Σ + Ot, with a domain schema for
     execute-phase.
  2. Auto-start tied to skill frontmatter metadata or progressive-loading
     route hooks inside the execute-phase unit-loop.
  3. Integrate with programmatic orchestration (workflow-status driver) so
     external runners get the same lifecycle.
  4. Telemetry: optional prompt-token comparison allowlisted vs control runs.

## Future cost

Standing obligations this unit imposes on future work:

- A second State Flow backend value extends `STATE_FLOW_BACKENDS`
  (`config/types.ts`) and the adapter seam — the closed vocabulary lives in
  code, and every new backend ships its own detection + lifecycle tests.
- Future features citing papers append to the root README's `## References`
  and dedupe against entries added here.

## Applicable tests

The `@gtrabanco/pi-agentic-workflow` suite (`bun run test` in
`packages/pi-agentic-workflow/`): new RED-first suites
`config-schema-stateflow.test.mjs`, `config-merge-stateflow.test.mjs`,
`stateflow-lifecycle.test.mjs`, plus the existing dispatch/restore/settings
suites as the differential baseline (O6).

## Known pre-existing issues

- **The issue body's backend API description is stale** — it names
  `/state-flow-start` / `/state-flow-stop` and a `{contract, working,
  response}` state shape; the shipped backend (0.27.4) exposes modes
  (`/state-flow-active`, `/state-flow-passive`, `/state-flow-off`,
  `/state-flow-status`). Recorded as PE-001; `affects` this unit's adapter
  verbs only (start = Active, stop = Off), which the unit resolves by
  implementing against the verified current surface.
- **Worktree layout quirk:** a worktree rooted at
  `.git/worktrees/<dir>/` carries git admin files (`HEAD`, `index`, …) inside
  the working tree, so bare `git diff HEAD` from the worktree cwd fails with
  "ambiguous argument 'HEAD'" and `ceremony.mjs tier classify` without
  `--paths` cannot read the merge-base diff. `does-not-affect` this unit's
  code (repo-wide layout convention, pre-existing); the tier was computed with
  the explicit `--paths` scope above.
- **Root gate red: `scripts/log-immutability.test.mjs` cannot import its
  module.** The test is tracked on `main` but `scripts/log-immutability.mjs`
  exists only on the unmerged branch `feat/468-log-immutability-guard`
  (commits 9b873e03, fc6b20ca). `affects` this unit only in that the root gate
  reports exit 1 for a reason this change did not introduce (G3);
  `does-not-affect` the change itself — the suite fails identically at the
  base commit's tree.

## Tasks

P1…Pn with stable IDs, dependency-topological first, smallest within a ready
set. Final task is verification when the unit has behavior. Each task carries
its validator, an `(Implements: …)` line, and may carry a nested
`Relevant files:` line (metadata, never a task).

- P1 — `stateFlow` config: file-shape type, strict schema validation, shipped
  default (enabled `false`), per-field project-over-global merge (validator:
  `bun test packages/pi-agentic-workflow/test/config-schema-stateflow.test.mjs packages/pi-agentic-workflow/test/config-merge-stateflow.test.mjs` exits 0)
  (Implements: S1)
  Relevant files: packages/pi-agentic-workflow/src/config/types.ts,
  packages/pi-agentic-workflow/src/config/schema.ts,
  packages/pi-agentic-workflow/src/config/defaults.ts,
  packages/pi-agentic-workflow/src/config/merge.ts
- P2 — Pi-free state-flow lifecycle module: allowlist gate, ownership flag,
  backend interface (detect/start/stop), `onBackendMissing` policies
  (validator: `bun test packages/pi-agentic-workflow/test/stateflow-lifecycle.test.mjs` exits 0)
  (Implements: S1)
  Relevant files: packages/pi-agentic-workflow/src/stateflow/lifecycle.ts
- P3 — wrapper wiring: dispatch starts a package-owned episode before the
  skill prompt for allowlisted+enabled commands; `agent_settled` stops it (also
  on abort); backend detection via Pi's `getCommands()`; model-routing
  behaviour untouched (validator: `bun test packages/pi-agentic-workflow/test/` exits 0)
  (Implements: S1)
  Relevant files: packages/pi-agentic-workflow/src/routing/dispatch.ts,
  packages/pi-agentic-workflow/src/extension/index.ts,
  packages/pi-agentic-workflow/src/extension/factory.ts
- P4 — settings console: read-only State Flow status plus edit path for
  `enabled`, the allowlist, and `onBackendMissing` (validator:
  `bun test packages/pi-agentic-workflow/test/settings-console.test.mjs` exits 0)
  (Implements: S1)
  Relevant files: packages/pi-agentic-workflow/src/settings/console.ts
- P5 — documentation and state surfaces: package README "State Flow
  (optional)" section (allowlist, config, limitations vs full SKILLSTATE,
  install note); root README `## References` (the issue's bibliography
  obligation); `.changeset/` intent file; roadmap row 41 status via the
  crate's `rowUpsert`; `docs-generate` projection re-rendered;
  `docs/LOGS.md` session entry (validator:
  `bun scripts/docs-generate.mjs --check` exits 0 after a clean
  `bun scripts/docs-generate.mjs` run)
  (Implements: S1)
  Relevant files: packages/pi-agentic-workflow/README.md, README.md,
  .changeset/, docs/ROADMAP.md, docs/LOGS.md
- P6 — verification: full package suite plus the root gates named by the
  touched surfaces; differential run of the package suite at the base commit
  (validator: `bun run test --cwd packages/pi-agentic-workflow` exits 0, and
  `git diff --name-only 6f5d5453 -- skills/` outputs nothing)
  (Implements: S1)

The link grammar (`task-spec-link@1`): every task bullet names the requirements
it delivers on its own `(Implements: …)` line, and `phase-lint` refuses a bullet
with no link, a link to an undeclared id, and a base requirement no bullet
implements.

```text
task-spec-link@1
kind | shape | what it orders
link | (Implements: S<n>, S<m>, …) | the requirements this task delivers; metadata, never task text
```

## Acceptance criteria

One observable, testable criterion per issue-body success criterion; every
criterion traces to S1 and names the check that proves it. This section is the
anchor a review's per-criterion coverage table reads.

- **AC1 (S1 → issue §Success criteria 1).** With `stateFlow.enabled: true` and
  the backend present, `/execute-phase` starts an episode before the skill
  prompt runs and stops it when the command settles, with no manual state-flow
  command. Check: `bun test packages/pi-agentic-workflow/test/stateflow-lifecycle.test.mjs`
  exits 0 (episode-start/episode-stop rows).
- **AC2 (S1 → issue §Success criteria 2).** `/review-change`, `/design-feature`
  and every other non-allowlisted command never auto-start or auto-stop
  state-flow under the default allowlist. Check:
  `bun test packages/pi-agentic-workflow/test/stateflow-lifecycle.test.mjs`
  exits 0 (non-allowlisted rows assert zero backend calls).
- **AC3 (S1 → issue §Success criteria 3).** With the backend missing and
  `onBackendMissing: "noop"` (the default), allowlisted commands still run and
  the operator sees exactly one clear warning. Check:
  `bun test packages/pi-agentic-workflow/test/stateflow-lifecycle.test.mjs`
  exits 0 (backend-missing rows).
- **AC4 (S1 → issue §Success criteria 4).** Model routing apply/restore is
  unchanged when the state-flow wrapper is enabled. Check: the differential
  suite run — the package suite passes at the base commit and at the change,
  with the only new failures being the new tests' RED-first pairs
  (`bun run test --cwd packages/pi-agentic-workflow` exits 0 at both).
- **AC5 (S1 → issue §Success criteria 5).** Canonical skills stay untouched:
  no file under `skills/` changes in this unit. Check:
  `git diff --name-only 6f5d5453 -- skills/` outputs nothing (exit 0).
- **AC6 (S1 → issue §Success criteria 6).** The package README documents the
  allowlist, the config block, the limitations vs full SKILLSTATE, and the
  backend install note; the root README carries the issue's two bibliography
  entries under `## References`. Check: `rg -c "State Flow"
  packages/pi-agentic-workflow/README.md` matches ≥ 1 and `rg -c "arXiv:2608.26263"
  README.md` matches ≥ 1.

## Planning evidence

One row per Engineering claim (the closed column order and vocabularies are owned
by `skills/pre-execution-review/references/LEDGERS.md`). This is an M-scope
unit: the ledger lives in this folder's `planning-evidence.md` — never both.

## Obligations

One row per normative behaviour, compatibility invariant, affected use case,
and required failure state (`obligation-id | authority-source |
affected-use-case-or-invariant | phase | task | implementation-owner |
validator | required-evidence | status` — shape owned by
`skills/pre-execution-review/references/LEDGERS.md`). This is an M-scope unit:
the ledger lives in this folder's `planning-obligations.md` — never both.
Before the unit ships, every row is `verified` (or an evidenced `n/a`).

## Triaged steps

> Paste the `## Triaged steps` block from `bun scripts/unit-route.mjs --triage <slug>`
> here verbatim. This block is the machine's authoritative step list; the lane
> never re-derives or reorders it (owner: `skills/unit-lane/SKILL.md` §Turn contract).

```text
TRIAGE — 174-pi-state-flow-lifecycle (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
```

Applied inline per the request's own workflow (§4/§5): the lane machinery is
not run on this repository's own surgery; the frozen ledgers above are the
plan.

## Findings

OPEN rows only: a row a review persisted as fix-now work and no fold has closed
yet. A folded row leaves this table and becomes a `## Log` line. Rows are appended
by `review-change` and `triage-issue` — the writers the `review-findings` truth
class of the ownership map (`skills/pre-execution-review/references/LEDGERS.md`)
declares; this section is that ledger's collapsed carrier, never a second ledger,
and no other writer touches it.

The carrier grammar (`findings-table@1`): the OPEN rows only, appended by
`review-change` and `triage-issue`. A folded row leaves the table and becomes a
`## Log` line, so this table never grows a history column.

```text
findings-table@1
column | shape | what it holds
id | F<n> | the stable finding id a fold and a log line cite
target | S<n> · <file>:<line> | the requirement or the location the finding names
axis | <axis> | the review axis that found it
severity | BLOCKER \| CRITICAL \| WARNING \| SUGGESTION | the published ladder (meanings owned by `skills/review-implementation/references/CLASSIFY.md` §Severity ladder): `BLOCKER` requires a reproducer and is never a conversion target
impact | blocking \| docs-only \| report-only | whether the finding affects behaviour, only documents, or nothing that blocks: `blocking`/`docs-only` for a `BLOCKER`, and `report-only` for a pre-existing advisory, which never earns a correction round
class | product \| plan \| source \| environment \| runtime | the owner that repairs it
route | fold \| replan-in-unit \| decision-required \| product owner — … \| <free prose> | where the row goes; the router reads this column's head first (`scripts/unit-route.mjs`), and `class` names the owner that repairs it
```

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

Append-only. `L1` is the request verbatim; every later line carries one kind
token from the closed set in `log-kind@1` below. A correction never edits an
earlier line: it appends.

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

- **L1** — 2026-11-09, the request, verbatim:
  ```
  Apply to this repository: issue #174
  ```
- **D1** — 2026-11-09, repo owner decision 2026-10-27 (AGENTS.md, issue #232):
  the repository ships English-only permanently; the issue's
  "README.md (+ `.es.md`)" doc requirement is superseded — no `.es.md` sibling
  is created for the package README.
- **E1** — 2026-11-09, `node scripts/unit-route.mjs 174` · exit 0 · route
  `plan-from-issue`, next `/unit-lane --from-issue 174` (run inline per this
  change's own workflow: the ledgers below are the plan).
- **E2** — 2026-11-09, `bun scripts/ceremony.mjs tier classify --paths …` ·
  exit 0 · `risk-tier-verdict@1`: tier `standard`, `signals: []`, task size
  understood/contained/resumable.
- **E3** — 2026-11-09, RED runs observed before each implementation commit:
  `bun test test/config-schema-stateflow.test.mjs test/config-merge-stateflow.test.mjs`
  → 2 pass / 14 fail (commit daa9e455); `bun test test/stateflow-lifecycle.test.mjs`
  → 0 pass / 1 error, module missing (3a2abd6e); `bun test test/stateflow-dispatch.test.mjs`
  → 3 pass / 5 fail (e347b5f9); `bun test test/settings-console.test.mjs`
  → 60 pass / 5 fail (dce082b6).
- **E4** — 2026-11-09, differential baseline (O6/AC4): the package suite at the
  base commit `6f5d5453` in a throwaway worktree (removed after) —
  `bun run test` → **648 pass / 0 fail**; at the change — **691 pass / 0 fail**.
  The only difference is this unit's 43 new tests; no existing behavior moved.
- **E5** — 2026-11-09, obligation validators in the foreground:
  `bun run test` (packages/pi-agentic-workflow) · exit 0 · 691/0;
  `rg -c "State Flow" packages/pi-agentic-workflow/README.md` → 2 (≥1, O10);
  `rg -c "arXiv:2608.26263" README.md` → 1 (≥1, O10);
  `rg -c "pi-state-flow" packages/pi-agentic-workflow/package.json` → 0
  matches (O12, no runtime dependency);
  `git diff --name-only 6f5d5453 -- skills/` → empty (O8/AC5).
- **D2** — 2026-11-09, incident disclosure (workflow §4 live-tree guard): the
  P5 commit initially swallowed this worktree's git admin files (`HEAD`,
  `index`, `index.lock`, `logs/`…) via `git add -A` — the worktree-at-
  `.git/worktrees` layout quirk makes them visible to `add -A`. The commit was
  amended to carry only the five intended files (fccd008f); nothing was pushed,
  so no history rewrite is involved. The stray files are back to untracked.
- **P1** — 2026-11-09, stateFlow config (schema, default, merge) · red
  daa9e455 → green b7e54b61 (also extends the shipped-default pin in
  `test/default-inherit.test.mjs`, the established per-feature convention).
- **P2** — 2026-11-09, Pi-free episode lifecycle module · red 3a2abd6e →
  green 2a75093b.
- **P3** — 2026-11-09, dispatch consult + `agent_settled` stop + shipped
  backend over Pi's documented API · red e347b5f9 → green 683507ee.
- **P4** — 2026-11-09, settings console State Flow section · red dce082b6 →
  green 5a19f1eb.
- **P5** — 2026-11-09, docs + state surfaces: package README section, root
  README References (both bibliography entries, deduped), changeset intent,
  roadmap rows 41 (folded → 174) and 174 (in-progress) via the crate's
  `rowUpsert`, docs projection re-rendered · fccd008f.
- **G1** — 2026-11-09, `bun scripts/docs-generate.mjs --check` · exit 0 ·
  0 missing / 0 stale / 0 orphaned.
- **G2** — 2026-11-09, `node scripts/roadmap-settle.mjs` · exit 0 ·
  159 unit docs checked, 0 violations.
- **G3** — 2026-11-09, `bun scripts/run-root-suite.mjs` · exit 1 ·
  **91 PASS / 1 FAIL** — the single FAIL is `scripts/log-immutability.test.mjs`,
  which cannot import `./log-immutability.mjs`: the module exists only on the
  unmerged sibling branch `feat/468-log-immutability-guard` while its test is
  tracked on `main`. Pre-existing red, unrelated to this unit (recorded under
  Known pre-existing issues); every other root suite passes.
- **G4** — 2026-11-09, `bun scripts/lint-changeset.mjs` · exit 0 ·
  `ok 174-state-flow-lifecycle.md`.
- **G5** — 2026-11-09, `bun scripts/check-skill-context.mjs` · exit 0 ·
  `PASS context budgets: 29 skills`.
- **E6** — 2026-11-09, the two sibling packages' suites: `bun run test`
  (packages/agentic-workflow-schema) · exit 0 · 775/0; `bun run test`
  (packages/agentic-workflow) · exit 0 · 534/0.
- **P6** — 2026-11-09, verification close-out: every obligation row's
  validator run in the foreground (E4–E6, G1–G5); statuses flipped in
  `planning-obligations.md`; the root gate's single red is the pre-existing
  log-immutability suite (G3, Known pre-existing issues).

## Next

External verify (the owner is the verifier): review the diff on
`feat/174-state-flow-lifecycle` against the frozen acceptance criteria and the
obligations ledger; correction bounds per the applying workflow's §9.

## References

- Issue [#174](https://github.com/gtrabanco/agentic-workflow/issues/174) —
  the requirement source (feat(pi-agentic-workflow): opt-in State Flow /
  SKILLSTATE lifecycle on long-running workflow commands).
- Roadmap row 41 (`pi-state-flow-lifecycle`) — `docs/ROADMAP.md` §Features.
- Sanket Badhe, Priyanka Tiwari, and Jonghyun Chung, "SKILL.state: Scalable
  Long-Horizon Agent Skills," arXiv:2608.26263, 2026.
- `@llblab/pi-state-flow` — prior art and the soft integration target.
