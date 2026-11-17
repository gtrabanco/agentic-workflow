---
type: feature
scope: large
roadmap_summary: Issue [#612](https://github.com/gtrabanco/agentic-workflow/issues/612) (L): forge-read transport closure — every content-bearing forge read routes through #470's guard, the sanctioned `runner forge-read` form replaces the raw `gh <view>` prose, an invocation-drift-style pin bans the raw form on reversion, and a session `gh` shim closes the ad-hoc read path while the unarmed residual is declared.
---

# 612 — forge-read-transport-closure

> One-line: the content guard stops being a property of the collection seam and
> becomes the only route a content-bearing forge read can take — one crate
> subcommand for the prose, one literal pin that fails on reversion, one shim for
> the ad-hoc read — with the transport living in code and the skills citing
> `runner`.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

The owner's request is this line, verbatim:

**S1 — Apply issue #612 to this repository.**
> Apply to this repository: issue #612

The issue's `## In scope` bullets are the requester's words for what the unit
delivers, one requirement per bullet, quoted verbatim and unedited. The issue's
`## Acceptance criteria` (`AC1`–`AC6`) are its own acceptance list, quoted in
`## Acceptance criteria` below; they are criteria, not additional requirements.
The issue's `## Out of scope` bullets are quoted in `## Non-goals`.

**S2 — The guarded forge-read path.**
> - **A guarded forge-read path reachable by skills**: a runner-crate subcommand (exact shape is the plan's decision; the `runner-contract` pattern applies — skills cite `runner`, never restate the transport) that performs the content-bearing read **through #470's guard** and prints the guarded result. The transport detail (`gh`, REST, GraphQL) lives inside the crate; skills stay forge-agnostic per #470's non-negotiable 3.

**S3 — The skills' prose re-point, read side only.**
> - **Skills prose re-point (read side only)**: the content-bearing `gh <view>` forms in `triage-issue`, `audit-pr`, `review-change` (and every other content-reading skill discovered at triage) are replaced by the `runner` citation. **Write-path forms stay raw** — `gh issue comment`, `gh pr edit`, label and GraphQL mutations are not content ingestion and are out of this guard's purpose.

**S4 — The sanctioned-forms pin.**
> - **Sanctioned-forms pin (invocation-drift pattern)**: once the guarded path exists, a literal test (the `scripts/invocation-drift.mjs` pattern — pinned prose, red on reversion) bans content-bearing raw forge reads from the skills' prose; the sanctioned `runner` forms are the only ones named. The pin reads the runner-contract's subcommand table as its source, never a second copy.

**S5 — The ad-hoc read interception.**
> - **Ad-hoc read interception (the shim)**: the session-scoped `gh` shim pipe-through — installed by the same setup layer that arms the #610 shims, filtering the response through the guard. It shares #610's carrier decision as its second consumer; if #610 lands with the `tool_call` hook only, the shim remains this issue's own carrier for the response side and cites #610's shim infrastructure. Without the shim armed, the residual (ad-hoc raw reads bypass the guard) is **declared in the unit doc**, never hidden.

**S6 — The discipline test extends to the read route.**
> - **Discipline-test extension**: #470's discipline test (no gate/receipt/verdict producer consumes unfiltered third-party content) extends to the read *route*: a producer consuming forge content outside the guarded path fails the suite.

**S7 — The runner-contract row.**
> - **Runner-contract row**: the new subcommand joins `skills/runner-contract/references/RUNNER.md`'s subcommand table (one row — the table is the closed set).

## Acceptance criteria

Frozen at cut. The issue's own list is quoted first (its words, its ids), then one
criterion per `S#` naming the check that proves it.

The issue's `## Acceptance criteria`, verbatim:

> - AC1 — Through the sanctioned path, a content-bearing forge read returns guarded content for every transport: author policy applied (untrusted roles excluded-and-declared), hidden content stripped-and-reported, third-party content fenced — exactly #470's ingestion contract, observed through this path.
> - AC2 — No skill prose names a content-bearing raw forge read (`gh issue view`/`gh pr view` with comments or bodies); the sanctioned `runner` forms are pinned by a literal test that fails on reversion; write-path `gh` forms stay sanctioned and unpunished.
> - AC3 — With the shim armed, an ad-hoc `gh` content read in a session passes through the guard (response filtered before model visibility); with it unarmed, the unit doc declares the residual explicitly.
> - AC4 — The extended discipline test fails on any gate/receipt/verdict producer that ingests forge content outside the guarded path.
> - AC5 — No new schema-export vocabulary; #470's `CONTENT_GUARD_REASONS` and config section are consumed as-is; normative-surfaces inventory unchanged except the runner-contract subcommand table row.
> - AC6 — Skills remain forge-agnostic: no `gh`-specific handling appears in `skills/` — the transport lives in the crate; `npx skills add . --list` and the context budgets stay green.

Per requirement:

- **AC-S1** — The unit exists with this document, its two planning ledgers and an
  acceptance section frozen before the first line of code. Check:
  `rg -c '^## Acceptance criteria' docs/features/612-forge-read-transport-closure/SPEC.md`
  matches 1 and `ls docs/features/612-forge-read-transport-closure/planning-*.md | wc -l` prints 2.
- **AC-S2** — `runner forge-read <issue|pr> <N> [--comments] [--reviews]` prints
  guarded content: each delivered field is a fenced block carrying its author
  association and verdict, an excluded author is declared with no content, and a
  stripped payload names each removal kind. Check:
  `bun test packages/agentic-workflow/test/forge-read.test.mjs` exits 0.
- **AC-S3** — No shipped prose names a content-bearing raw forge read; the
  metadata-only and write-path forms survive. Check:
  `bun scripts/forge-read-drift.mjs` prints `verdict: PASS` and
  `bun test scripts/forge-read-drift.test.mjs` exits 0.
- **AC-S4** — The pin is literal and red on reversion: injecting one raw content
  read into a scanned page fails it by name, and a page that only names metadata
  reads passes. Check: the pin's suite exits 0 with its injected cases.
- **AC-S5** — With the shim armed, `gh <issue|pr> view` reaches the guard; the
  unarmed residual is written in this document. Check:
  `bun test packages/agentic-workflow/test/forge-read.shim.test.mjs` exits 0 and
  `rg -c '^### Residual — ad-hoc raw reads' docs/features/612-forge-read-transport-closure/SPEC.md`
  matches 1.
- **AC-S6** — A producer that reads forge content over REST outside the guarded
  path fails the discipline gate by name. Check:
  `bun test scripts/content-guard-discipline.test.mjs` exits 0.
- **AC-S7** — `RUNNER.md`'s subcommand table carries the one `forge-read` row and
  the dispatch table names it. Check:
  `bun test packages/agentic-workflow/test/runner.distribution.test.mjs` exits 0.
- **AC-AC5** — No new schema export: `git diff main -- packages/agentic-workflow-schema/src`
  is empty, and `bun scripts/normative-drift.test.mjs` exits 0.
- **AC-AC6** — The transport-free verbs stay green: `bun test packages/agentic-workflow/test/cli.surface.test.mjs`
  exits 0, `bun scripts/check-skill-context.mjs` exits 0, and
  `bun scripts/forge-read-drift.mjs` reports zero `transport-leak` findings.

## Impact

What this unit touches beyond its own files, cut at plan time:

- **Consumes #470's guard as-is** — `guardForgeContent`, `CONTENT_GUARD_REASONS`,
  `CONTENT_HIDDEN_KINDS`, `CONTENT_AUTHOR_ASSOCIATIONS`, `readContentGuardPolicy`
  and the `contentGuard` config section. This unit adds no vocabulary and no
  config key (AC5).
- **Consumes #610's decision** — #610 shipped the `tool_call` carrier and left the
  PATH shim as its recorded fallback, which is exactly the branch the issue
  anticipated: the shim is this unit's own carrier for the response side, and it
  cites #610's carrier decision instead of restating it.
- **Leaves #611 the arming** — `AGENTIC_WORKFLOW_RUNNER` arming and the doctor
  vehicle row are #611's (its issue text: "the shim is armed by the same setup
  step that arms `AGENTIC_WORKFLOW_RUNNER`"). This unit ships the seam that step
  calls (`runner forge-read shim install --dir <dir>`); it does not add a second
  setup path, and the unit doc names the split rather than pretending it closed.
- **Changes what the prose may say** — ten shipped prose sites (eleven
  occurrences) in `skills/`, `template/` and one tutorial page stop naming a
  content-bearing raw read; the crate README's "What the layer does not cover"
  paragraph is superseded and is rewritten in the same change.
- **Stops being true** — `packages/agentic-workflow/README.md:431`'s claim that
  issue and PR comments "have no deterministic collector" and reach a model
  "verbatim" (it is the sentence this unit falsifies), and the review-pass prose
  that told `audit-pr` to read its marker with `gh pr view --json comments`.
- **Live-tree safety** — the shim's install path is the only writer this unit
  adds; it is exercised in scratch only (`mktemp -d`), never against this
  worktree's own `PATH`.

## Surfaces

- `packages/agentic-workflow`
- `skills/triage-issue`
- `skills/audit-pr`
- `skills/execute-phase`
- `skills/runner-contract`
- `scripts`
- `template`
- `docs`

## Retirements

Two shipped tokens retire, each with its replacement:

- `gh issue view <N> --json number,title,body,labels,state,comments` (the
  triage intake read, `skills/triage-issue/SKILL.md:117`) → replaced by
  `runner forge-read issue <N> --comments`. No-consumer evidence:
  `rg -c -- '--json number,title,body,labels,state,comments' skills template docs/workflow`
  → 0 after the change.
- `gh pr view <n> --json comments` / `gh pr view --json headRefOid,comments` (the
  marker and head reads in `audit-pr`, `execute-phase`, `triage-issue`) →
  replaced by `runner forge-read pr <n> --comments` plus the metadata-only
  `gh pr view --json headRefOid`. No-consumer evidence:
  `rg -c -- '--json comments' skills template docs/workflow` → 0.

Nothing else retires: the write-path `gh` forms, the metadata-only `--json`
reads and the `list` forms stay sanctioned.

## Non-goals

The issue's `## Out of scope`, verbatim:

> - **The guard itself** — author provenance policy, hidden-content sanitizer, fencing, `CONTENT_GUARD_REASONS`, config surface (`guards.contentGuard`, lists, `${ENV}` indirection) are #470's, design-closed in its thread. This issue consumes them; it adds **no new schema vocabulary**.
> - **The bash tool-choice carrier decision** (`tool_call` hook vs shim for grep/bun) — #610 owns it; this issue only consumes the shim route's infrastructure for the response side.
> - **Write-path protection, rate limiting, forge abuse prevention** — unrelated threat classes (#470's own non-goals).
> - **Re-cutting #470's body or reopening its design thread** — the requirement is cited, not restated; #470 stays as the policy owner, this issue is the transport owner.

### Residual — ad-hoc raw reads

Declared, not hidden (S5, AC3, AC-S5). With the shim **unarmed** — the shipped
default, because nothing in this repository arms it — an ad-hoc
`gh issue view 12 --json body` executed in a session still delivers raw third-party
text to the model. The guard covers every route the workflow *orders* (the crate
subcommand and the producers the discipline gate declares) and every route the
shim *intercepts* (`issue|pr view`, content-bearing, while armed); it cannot
cover a route nobody enumerates. Four residuals are named, and each one's owner:

| Residual | Why it is open | Owner |
|---|---|---|
| An unarmed session's ad-hoc `gh … view` | the shim must be installed into a directory on the session `PATH`; this repository installs no shim by default | #611 (the arming step) |
| `gh api repos/{owner}/{repo}/…` reads | the REST surface is arbitrary; the shim's grammar recognises `issue\|pr view` only, and an unrecognised form passes through untouched rather than blocking a write path | this unit's declared boundary |
| `gh issue list` / `gh pr list` without `--json` | a list prints titles; AC2 scopes the ban to the `view` forms, so lists stay sanctioned and this is the measured consequence | this unit's declared boundary |
| `files` / `commits` / diff text in a PR read | a diff is the artifact under review, and #470 ships no `code-comment` collector | #470's declared collector gap |

## Risk tier

Verdict copied from the crate's classifier over the changed paths
(`contract: risk-tier-verdict@1`), never written from memory — filled at the
verification step from `runner ceremony tier classify`.

- **Tier** — `standard` · **Task Size** — understood / contained / resumable-from-diff
- **Named high-risk item** — none — not a high-tier unit

## Future

none

## Future cost

| Rule | Binds |
|---|---|
| A new content-bearing forge read adds its fields to `FORGE_CONTENT_FIELDS` and its verb to the grammar — never a second classifier | any unit adding a forge read to the crate |
| A new shipped prose site that reads forge content cites `runner forge-read`, never `gh … view` with a content field | skill and template authors; enforced by `scripts/forge-read-drift.mjs` |
| Arming the shim is #611's setup step; a unit that arms it calls `runner forge-read shim install --dir <dir>` instead of writing its own wrapper | #611 and any later setup work |

## Applicable tests

- `bun test packages/agentic-workflow/test/forge-read.test.mjs` — the grammar,
  the guarded read, the exclusions, the fence and the refusals.
- `bun test packages/agentic-workflow/test/forge-read.shim.test.mjs` — the shim
  source, its install/check receipt and the exec pass-through/replacement split.
- `bun test scripts/forge-read-drift.test.mjs` — the pin, its live verdict and
  its injected disagreements.
- `bun test scripts/content-guard-discipline.test.mjs` — the extended discipline
  gate (the new seam and rule R5).
- `bun test packages/agentic-workflow/test/cli.surface.test.mjs` and
  `bun test packages/agentic-workflow/test/runner.distribution.test.mjs` — the
  existing command-surface behaviour this unit shares.
- `cd packages/agentic-workflow && bun run test` — the crate gate.
- `node scripts/run-root-suite.mjs` — the whole deterministic gate.

## Known pre-existing issues

- **`collectAssociations()` takes a `spawn` option the sensor passes and the
  function ignores** (`packages/agentic-workflow/src/content-guard.mjs:390-410`
  vs `workflow-status.mjs:376-388`): the association read spawns `gh` itself on a
  fixed 30 s timeout instead of the caller's bounded spawn. *Does not affect*
  this unit: the new read transports through its own injectable `spawn`, and the
  sensor's path is untouched — fixing it is #470's follow-up, not this unit's
  scope.
- **`scripts/invocation-drift.mjs`'s sanctioned set has no shim** — #610 shipped
  the `tool_call` carrier only, and #611 owns arming. *Does not affect* this
  unit: the shim is armed explicitly and its installer is the seam #611 calls.
- **The crate README documents the degradation codes under `quality-metrics`**
  (`packages/agentic-workflow/README.md:593-601`). *Does not affect* this unit:
  the read reuses those class words and points at that table instead of copying
  it.

## Tasks

- P1 — The read route's one grammar: the classifier over `gh` argv, the closed
  content-field set and the prose finder the pin and the shim both read
  (validator: `bun test packages/agentic-workflow/test/forge-read.test.mjs` exits 0)
  (Implements: S2, S4, S5)
  - Relevant files: packages/agentic-workflow/src/forge-read/grammar.mjs, packages/agentic-workflow/test/forge-read.test.mjs
- P2 — The guarded read: the REST transport, the guard wiring, the `forge-read@1`
  envelope, the fenced render and the `run` entry, registered in the dispatch
  table with its bin usage, README row and `RUNNER.md` subcommand row
  (validator: `bun test packages/agentic-workflow/test/forge-read.test.mjs` exits 0 and `bun test packages/agentic-workflow/test/cli.surface.test.mjs` exits 0)
  (Implements: S2, S7)
  - Relevant files: packages/agentic-workflow/src/forge-read/index.mjs, packages/agentic-workflow/src/runner/cli.mjs, packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/README.md, skills/runner-contract/references/RUNNER.md
- P3 — The ad-hoc read shim: the generated trampoline, the install/check receipt
  and the `shim exec` pass-through-or-replace decision
  (validator: `bun test packages/agentic-workflow/test/forge-read.shim.test.mjs` exits 0)
  (Implements: S5)
  - Relevant files: packages/agentic-workflow/src/forge-read/shim.mjs, packages/agentic-workflow/test/forge-read.shim.test.mjs
- P4 — The pin's suite, landed red before its script
  (validator: `bun test scripts/forge-read-drift.test.mjs` exits 1 naming the missing module)
  (Implements: S4)
  - Relevant files: scripts/forge-read-drift.test.mjs
- P5 — The pin: the literal scan over the shipped prose, its rules and its
  verdict line
  (validator: `bun scripts/forge-read-drift.mjs` exits 1 naming every raw content read, then 0 after P6)
  (Implements: S4)
  - Relevant files: scripts/forge-read-drift.mjs
- P6 — The prose re-point: ten shipped sites stop naming a content-bearing raw
  read, and the one elided field list names its metadata fields
  (validator: `bun scripts/forge-read-drift.mjs` prints `verdict: PASS`)
  (Implements: S3)
  - Relevant files: skills/triage-issue/SKILL.md, skills/triage-issue/references/ISSUE_PROCESS.md, skills/audit-pr/SKILL.md, skills/audit-pr/references/PORTABILITY.md, skills/audit-pr/references/05_ROUTING_AND_GUARDRAILS.md, skills/execute-phase/references/FORGE_BODY.md, skills/execute-phase/references/PREFLIGHT.md, template/AGENTS.md, docs/workflow/ISSUE_WORKFLOW.md
- P7 — The discipline gate's read-route rule: the new seam and R5 over the
  scanned tree, with its injected disagreements
  (validator: `bun test scripts/content-guard-discipline.test.mjs` exits 0)
  (Implements: S6)
  - Relevant files: scripts/content-guard-discipline.test.mjs
- P8 — The declared surfaces: the crate README's superseded paragraph and its
  `forge-read` section, the gate-inventory rows, the changeset, the roadmap row
  and the session log
  (validator: `bun scripts/docs-generate.mjs --check` exits 0 and `bun scripts/prose-gate-inventory.mjs` prints `verdict: PASS`)
  (Implements: S1, S2, S3, S5)
- P9 — Verification: the crate gate, the root gate, the context budgets and the
  normative-drift gate fixed point
  (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7)

### Planning evidence

Frozen beside this document in [`planning-evidence.md`](planning-evidence.md) —
M/L shape, so the ledger lives in its own file and this section only names it.

### Obligations

Frozen beside this document in [`planning-obligations.md`](planning-obligations.md) —
M/L shape, so the ledger lives in its own file and this section only names it.

## Triaged steps

Direct application (the owner's local, unpublished workflow for changing this
repository): the frozen ledgers above are the plan and no lane/triage block is
pasted here. `runner unit-route --triage` is deliberately not run — §4 of the
owner's workflow forbids running this repository's own review machinery on its
own surgery.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-18, the request, verbatim:
  ```
  Apply to this repository: issue #612
  ```
- **D1** — 2026-11-18, transport decision: the guarded read is a runner
  subcommand over **REST through `gh api`**, because `author_association` is what
  the author policy consumes and the pinned `gh` exposes no such field on
  `issue view --json` (measured: `gh api 'repos/{owner}/{repo}/issues/612'`
  returns it, `gh issue view 612 --json` cannot). Rest/detail/comments/reviews
  all carry it, so one transport serves every content kind.
- **D2** — 2026-11-18, scope decision: the pin bans the `view` grammar only
  (`gh issue view` / `gh pr view` with a content field or no `--json`); `list`
  forms and metadata-only `--json` lists stay sanctioned, and the title exposure
  a list carries is declared in `### Residual — ad-hoc raw reads` rather than
  silently widened.
- **D3** — 2026-11-18, one grammar home: `src/forge-read/grammar.mjs` classifies
  argv for the read, the shim and the pin; the pin reads the sanctioned spelling
  from `RUNNER.md`'s subcommand table, never a second list.
- **D4** — 2026-11-18, the shim is a trampoline that spends nothing on the paths
  that cannot be content reads: the shell prefilter (`issue|pr` + `view`) is
  generated from the grammar's own constant, and the JS classifier owns the
  content/metadata decision inside it.
- **D5** — 2026-11-18, arming: this unit ships
  `runner forge-read shim install --dir <dir>`; calling it from the setup step is
  #611's (its issue owns the `AGENTIC_WORKFLOW_RUNNER` arming), so no second
  setup path enters `scripts/setup-env.mjs` here.

## Next

The owner's review of the delivered diff — this unit stops at the handoff.

## References

- Issue [#612](https://github.com/gtrabanco/agentic-workflow/issues/612) —
  the request (`Closes #612` on the PR).
- Issue [#470](https://github.com/gtrabanco/agentic-workflow/issues/470) — the
  guard layer this unit consumes.
- Issue [#610](https://github.com/gtrabanco/agentic-workflow/issues/610) — the
  carrier decision the shim transposes to the response side.
- Issue [#611](https://github.com/gtrabanco/agentic-workflow/issues/611) — the
  arming step and the doctor vehicle row.
- Issue [#329](https://github.com/gtrabanco/agentic-workflow/issues/329) / #555
  — the invocation-drift pin and the runner citation the pin transposes.
- `skills/pre-execution-review/references/LEDGERS.md` — the ledger row contracts.
