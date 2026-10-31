# fix/338-closed-ceremony-cli

> Fix specification — one single unit document, cut in the re-cut
> `spec-by-reference` shape from `docs/fix/_TEMPLATE/SPEC.md`. Size: **M** —
> the planning ledgers live beside this doc as `planning-evidence.md` and
> `planning-obligations.md` (never both embedded and separate).

## Issue

`#338` — Closed ceremony: deterministic CLI for ALL operations (write, read,
edit, delete). The PR closes it via `Closes #338`.

## Specs

Requirements numbered `S#`, quoting the issue's own words verbatim (marked
elisions point at the full verbatim text frozen as **L1** in `## Log`). The
frozen request is L1; every later decision cites its `S#`.

**S1 — Closed deterministic CLI, not invented ad-hoc commands.**
> The ceremony of review, design, plan, execute, fold, audit must be a closed deterministic CLI — not ad-hoc bash/python/any-language commands that the agent invents each time.

**S2 — Four properties.**
> 1. **Closed** — the set of operations is defined once and never changes per-invocation
> 2. **Documented** — each operation has a fixed input/output contract, verifiable
> 3. **Deterministic** — same input → same output, always
> 4. **Operable** — can write, edit (partial or full), and delete any ceremony file

**S3 — Home of the CLI (ambiguous in the issue; resolved by owner decision D1).**
> A CLI (npm package or `scripts/` within the repo) that encapsulates **all** ceremony operations.

**S4 — Object model.**
> The ceremony operates on **objects**, not on generic files

…with the issue's object table (unit, plan, evidence, progress, findings,
ledger, review, commit, pr, roadmap, workspace — each with its operations;
[elided: the full table — verbatim in L1]).

**S5 — Complete operation map.**
> ### `ceremony unit` — unit management

…followed by the issue's subcommand tables for unit, plan, evidence, progress,
findings, ledger, review, commit, workspace, docs, acceptance, refutation,
fusion, delta, pr and roadmap ([elided: the full tables — verbatim in L1]).

**S6 — I/O contract.**
> Output: JSON on stdout
> Exit codes:
>   0 = success (JSON contains findings or results)
>   1 = usage error (wrong flags, slug doesn't exist)
>   2 = ceremonial block (workspace dirty, cannot continue)

**S7 — Section edit model.**
> ceremony <object> <slug> update --section <section> --content <markdown-or-json>

…with partial vs full edit (`--section <token>` vs `--content <full-markdown>`)
and the delete taxonomy — full object, section, individual item, by-criterion
([elided: the full subsection — verbatim in L1]).

**S8 — Closed-world error.**
> if the agent doesn't find an operation in the CLI, the CLI returns error, no bash workaround invented

**S9 — Module priority.**
> No need for 12 separate scripts — need **modules of the ceremony-cli**

…with the issue's numbered module list (P0: workspace, docs, unit + plan,
findings + ledger; P1: review, acceptance, refutation, fusion, progress,
evidence, roadmap; P2: delta, pr, commit; "follow-up PRs extending the CLI" —
[elided: the full list — verbatim in L1]).

**S10 — The #307 slice (overridden for this unit by owner decision D2).**
> Issue 307 (partial mechanical verification) should include:
> 1. **`workspace` module** — all git operations
> 2. **`docs` module** — all discipline checks
> 3. **`review` module** — minimum: `create`, `append-axis`, `synthesize`

## Impact

Callers and consumers: this repo's own ceremony operators — `review-change`,
`fold-findings`, `audit-pr`, `execute-phase`, `triage-issue` — currently emit
ad-hoc `git status --porcelain`, `grep -c`, `sed -i`, `git hash-object`
commands (the issue's "What this CLI covers that isn't covered now" table).
This unit ships the CLI; **no skill is rewired in this unit** (that is the
follow-up the issue itself orders: "follow-up PRs extending the CLI"), so no
committed narration stops being true when it lands. The mentions that change
are this unit's own files plus the `docs/fix/README.md` index row.

## Retirements

Nothing is retired by this unit: it only adds `scripts/ceremony.mjs` +
`scripts/ceremony/` and the unit's docs. The ad-hoc command *practice* it
replaces is not a committed surface, so there is nothing to delete
(`grep -rc 'ceremony-cli' scripts/ skills/` at cut → 0 hits: no prior art to
retire). Skill rewiring and the retirement of ad-hoc command narration in
skills happens in the follow-up PRs the issue itself defers.

## Non-goals

- Not rewiring any skill to call the CLI (follow-up PRs per S9).
- Not implementing the P1/P2 modules (review, acceptance, refutation, fusion,
  delta, pr, progress, evidence, commit, roadmap) — outside the closed set for
  now; they answer the closed-world error (D2, S9).
- Not publishing an npm package and not building a binary (D1 — the future
  `bun build --compile` promotion is recorded under Future, not built here).
- Not rewriting legacy units' side ledgers (`review-findings.md`) — the CLI
  *reads* them (the R1 reproducer needs that) and never rewrites them, per the
  ledger-ownership contract.
- Findings discovered during implementation never expand this scope.

## Future

- **2026-11-24 · open** — Owner (D1): "si en el futuro creamos un binario con
  bun build y distribuimos el binario completo" — promote the single-CLI
  modules to a compiled binary (`bun build --compile scripts/ceremony.mjs`)
  and/or distribute the CLI alongside the skills that need it. Deferred: the
  module layout (`scripts/ceremony/*.mjs`, one entry) is cut precisely so this
  promotion is a build step, not a rewrite.
- **2026-11-24 · open** — S10's `review` module minimum (create, append-axis,
  synthesize) lands with the P1 review module (follow-up PR per S9).

## Future cost

- Every new ceremony operation must join the CLI's closed set (one module
  function + one test + one `--help` line) — binds future workflow authors.
- The CLI is dependency-free (`node:` imports only, shebang
  `#!/usr/bin/env node`) so the future binary promotion stays possible — binds
  future edits to `scripts/ceremony/`.

## Applicable tests

Frozen-failure corpus (the user command's §2): the change repairs the
ad-hoc-command failure class the issue's Problem section names — the class
that burned unit 258's 12 review→fold cycles on the workflow's own surgery.
Four reproducers, extracted before implementing (RED), each mapped to its
obligation row:

- **R1** — counting review marks: ad-hoc `grep -c REVIEW-RAN
  docs/fix/258-harden-needs-input-contracts/review-findings.md` → 23.
  Reproducer: `node scripts/ceremony.mjs ledger count --slug
  258-harden-needs-input-contracts` returns `counts["REVIEW-RAN"] === 23`.
  Fails at cut (no CLI). → O9.
- **R2** — workspace cleanliness: ad-hoc `git status --porcelain`. Reproducer:
  `node scripts/ceremony.mjs workspace clean-check` exits 0 with
  `{"clean": true, ...}` at a clean head. Fails at cut. → O10.
- **R3** — phase-label discipline: ad-hoc `grep -rnE '\b(Step|S[0-9])\b'`.
  Reproducer: `ceremony docs check-phase-labels` on a fixture unit doc
  carrying a `Step 1` task label reports `valid: false` and exits 2. Fails at
  cut. → O11.
- **R4** — folded flips: ad-hoc `sed -i 's/folded: no/folded: yes/'`.
  Reproducer: `ceremony findings update --id 1 --folded true` removes the row
  from the migrated `## Findings` carrier and appends the `F` log line, in one
  deterministic step. Fails at cut. → O12.

Plus the standing suites below. Write exactly `n/a` when there is none: n/a —
not applicable, the corpus and module suites above are the unit's tests.

## Known pre-existing issues

- `node scripts/phase-lint.mjs docs/fix/340-deletion-reuse-obligations/SPEC.md`
  exits non-zero (verdict BLOCKED) at the cut head — pre-existing in that
  unit's own doc. Does-not-affect this unit (different unit doc; no shared
  code).
- The repo has no top-level `ROADMAP.md` (the roadmap lives at
  `docs/features/ROADMAP.md`), so the issue's `roadmap` module (P1) will need
  its target resolved in its own follow-up. Does-not-affect this unit.

## Tasks

- P1 — Freeze the planning ledgers (this commit): unit doc + `planning-evidence.md` + `planning-obligations.md` + index row, before the first line of code (validator: `grep -c '338-closed-ceremony-cli' docs/fix/README.md` matches 1)
  (Implements: S1)
  Relevant files: docs/fix/338-closed-ceremony-cli/
- P2 — RED frozen-failure corpus: run R1–R4 and the entry-contract checks, observe each fail at the pre-CLI head, record the observed failures as E-lines (validator: the four `node scripts/ceremony.mjs …` commands exit 1 with `unknown-command` before P3 lands)
  (Implements: S1, S8)
  Relevant files: docs/fix/338-closed-ceremony-cli/SPEC.md
- P3 — Ship the CLI entry + closed-world dispatcher (exit 0/1/2 contract, JSON output, closed op registry) and the `workspace` module, with their suites (validator: `node --test scripts/ceremony.test.mjs scripts/ceremony-workspace.test.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S8, S9)
  Relevant files: scripts/ceremony.mjs, scripts/ceremony/workspace.mjs, scripts/ceremony.test.mjs, scripts/ceremony-workspace.test.mjs
- P4 — Ship the `docs` module (check-commit-format, check-phase-labels, check-tasks-ticks, check-docs-language, check-progress-entry, check-all) with its suite, incl. the R3 fixture (validator: `node --test scripts/ceremony-docs.test.mjs` exits 0)
  (Implements: S2, S5, S6)
  Relevant files: scripts/ceremony/docs.mjs, scripts/ceremony-docs.test.mjs
- P5 — Ship the `findings` + `ledger` modules (CRUD on the migrated `## Findings`/`## Log` carriers, read fallback to legacy `review-findings.md`) with their suite, incl. the R1 and R4 reproducers (validator: `node --test scripts/ceremony-findings-ledger.test.mjs` exits 0 and `node scripts/ceremony.mjs ledger count --slug 258-harden-needs-input-contracts` returns counts["REVIEW-RAN"] = 23)
  (Implements: S2, S4, S5, S6, S7)
  Relevant files: scripts/ceremony/findings.mjs, scripts/ceremony/ledger.mjs, scripts/ceremony-findings-ledger.test.mjs
- P6 — Ship the `unit` + `plan` modules (unit CRUD + list + select-next + descope on the unit doc; plan ops over the `## Tasks` section with `plan lint` delegating to `phase-lint.mjs`) with their suite (validator: `node --test scripts/ceremony-unit-plan.test.mjs` exits 0)
  (Implements: S2, S4, S5, S6, S7)
  Relevant files: scripts/ceremony/unit.mjs, scripts/ceremony/plan.mjs, scripts/ceremony-unit-plan.test.mjs
- P7 — Close-out verification: root suite, differential run against a base-commit copy, obligations ledger closed, `docs/fix/README.md` status updated (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S2, S9)
  Relevant files: docs/fix/338-closed-ceremony-cli/

### Planning evidence

M/L unit — the ledger lives in `planning-evidence.md` beside this doc.

### Obligations

M/L unit — the ledger lives in `planning-obligations.md` beside this doc.

## Findings

| id | S# / file:line | axis | severity | class | route |
|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-24, the issue, verbatim (526 lines, embedded unedited;
  fence is 4-backtick so the issue's own 3-backtick fences survive):

````markdown
---

**Auto-generated with AI. Written in English per project policy.**

---

# Closed ceremony: deterministic CLI for ALL operations (write, read, edit, delete)

**Type:** architecture  
**Scope:** The ceremony of review, design, plan, execute, fold, audit must be a closed deterministic CLI — not ad-hoc bash/python/any-language commands that the agent invents each time.

---

## Problem

Each ceremony operation (review, design, plan, execute, fold, audit) generates its own ad-hoc bash commands: `git log`, `git diff`, `grep -rn`, `sed -i`, `git hash-object`, `git show`, etc. The agent builds these commands on every invocation — there is no closed CLI that owns them all.

**The ceremony must determine what commands are used, not the other way around.** It must be:

1. **Closed** — the set of operations is defined once and never changes per-invocation
2. **Documented** — each operation has a fixed input/output contract, verifiable
3. **Deterministic** — same input → same output, always
4. **Operable** — can write, edit (partial or full), and delete any ceremony file

---

## Proposed architecture: `ceremony-cli`

A CLI (npm package or `scripts/` within the repo) that encapsulates **all** ceremony operations.

### Ceremony object model

The ceremony operates on **objects**, not on generic files:

| Object | What it is | Operations possible |
|---|---|---|
| **unit** | A work unit (feature/NN or fix/N) | create, read, update (partial/full), delete, list, route, triage |
| **plan** | The plan of a unit (tasks P1…Pn) | create, read, update (partial/full), delete, execute |
| **evidence** | Evidence for each task/ac | append, read, verify, delete |
| **progress** | Progress log of the unit | append, read, delete, list |
| **findings** | List of findings of a unit | append, read, update (severity/class/route), delete, fold |
| **ledger** | Review ledger (REVIEW-RAN, VF-<n>, etc.) | append, read, update (folded), delete |
| **review** | A review pass | create, read, update (verdict), delete, summarize, classify, transform-debt |
| **commit** | A conventional commit | create (message + files), verify-format, delete (undo) |
| **pr** | Pull request of the workflow | create, comment, verify-receipt, verify-hygiene, read-diff |
| **roadmap** | ROADMAP.md of the repo | update-row, read, list, settle |
| **workspace** | Checkout state | status, clean-check, diff-scope, diff-stat, main-check |

---

## CLI operations: complete map

### `ceremony unit` — unit management

| Subcommand | What it does | Input | Output |
|---|---|---|---|
| `unit create --slug <slug> --type feature\|fix --template <path>` | Creates unit doc (SPEC.md) with fixed structure | slug, type, optional template | JSON: created, path, sha |
| `unit read <slug>` | Reads unit doc fully | slug | JSON: unit (parsed structure), raw text |
| `unit update <slug> --section <section> --content <json>` | Updates one section of unit doc (partial) | slug, section (tasks\|findings\|evidence\|progress\|references\|spec), content (markdown or json) | JSON: updated, section, sha |
| `unit update <slug> --content <markdown>` | Updates ALL unit doc (full) | slug, full markdown | JSON: updated, sha |
| `unit delete <slug>` | Deletes unit | slug | JSON: deleted |
| `unit list` | Lists all units | — | JSON: units[{nn, slug, type, status}] |
| `unit triage <slug>` | Runs triage of unit | slug | JSON: route, steps, tier |
| `unit route <slug>` | Gets route (same as triage but read-only) | slug | JSON: route, next-step |
| `unit select-next <slug>` | Detects first unfinished step | slug | JSON: next-step (e.g. "P2") |
| `unit descope <slug> --criterion <n> --approved-by <user>` | Descope an acceptance criterion | slug, criterion number, user | JSON: descope-recorded |

### `ceremony plan` — plan management

| Subcommand | What it does | Input | Output |
|---|---|---|---|
| `plan create <slug> --tasks <json>` | Creates task plan for unit | slug, json of tasks [{n, label, spec, files}] | JSON: created, sha, plan-id |
| `plan read <slug>` | Reads plan fully | slug | JSON: plan (parsed structure) |
| `plan update <slug> --task <n> --label <text>` | Updates one task (partial) | slug, task number, label | JSON: updated, task-id |
| `plan update <slug> --task <n> --delete` | Deletes one task (partial) | slug, task number | JSON: deleted, task-id |
| `plan update <slug> --tasks <json-array>` | Updates task list (partial) | slug, json array of tasks | JSON: updated, tasks-added, tasks-removed |
| `plan update <slug> --content <markdown>` | Updates ALL plan (full) | slug, full markdown | JSON: updated, sha |
| `plan delete <slug>` | Deletes plan | slug | JSON: deleted |
| `plan execute <slug> --step <n>` | Marks step P<n> as completed | slug, step number | JSON: step-complete, sha |
| `plan execute-all <slug>` | Marks all tasks as completed | slug | JSON: steps-complete, sha |
| `plan lint <slug>` | Verifies plan against phase-contract rules | slug | JSON: lint-result [{rule, pass, detail}] |

### `ceremony evidence` — evidence management

| Subcommand | What it does | Input | Output |
|---|---|---|---|
| `evidence append <slug> --ac <n> --command <cmd> --exit <n> --output <text> --verified-by <author>` | Appends evidence for AC | slug, ac-number, command, exit-code, output (max 2 lines), verified-by | JSON: appended, row-number |
| `evidence read <slug>` | Reads evidence | slug | JSON: evidences[{ac, command, exit, output, verified-by}] |
| `evidence delete <slug> --row <n>` | Deletes evidence row | slug, row-number | JSON: deleted |
| `evidence verify <slug> --ac <n> --command <cmd>` | Re-runs verification command | slug, ac-number, command to run | JSON: result (exit-code, output, match: bool) |
| `evidence list <slug>` | Lists evidence by AC | slug | JSON: evidences grouped by AC |

### `ceremony progress` — progress log

| Subcommand | What it does | Input | Output |
|---|---|---|---|
| `progress append <slug> --entry <text>` | Appends entry to progress log | slug, text (format: "YYYY-MM-DD HH:MM → commit → next") | JSON: appended, sha |
| `progress read <slug>` | Reads full log | slug | JSON: entries[{timestamp, text}] |
| `progress delete <slug> --range <start-end>` | Deletes entries from log | slug, range (e.g. "2024-01-01 to 2024-01-03") | JSON: deleted-count |
| `progress clear <slug>` | Clears ALL progress log | slug | JSON: cleared |
| `progress list <slug>` | Lists entries (with filter) | slug, optional --from <date> --to <date> | JSON: entries filtered |

### `ceremony findings` — findings management

| Subcommand | What it does | Input | Output |
|---|---|---|---|
| `findings append <slug> --file <f> --line <n> --axis <a> --severity <s> --class <c> --route <r>` | Appends finding | slug, file, line, axis, severity, class, route | JSON: appended, id |
| `findings read <slug>` | Reads all findings | slug | JSON: findings[{id, file, line, axis, severity, class, route, folded}] |
| `findings update <slug> --id <n> --severity <s>` | Updates a finding (partial) | slug, id, severity | JSON: updated |
| `findings update <slug> --id <n> --class <c>` | Updates class (partial) | slug, id, class | JSON: updated |
| `findings update <slug> --id <n> --route <r>` | Updates route (partial) | slug, id, route | JSON: updated |
| `findings update <slug> --id <n> --folded <bool>` | Flip folded (partial) | slug, id, boolean | JSON: updated, folded: true/false |
| `findings delete <slug> --id <n>` | Deletes finding (full) | slug, id | JSON: deleted |
| `findings delete <slug> --axis <a>` | Deletes all findings of one axis | slug, axis | JSON: deleted-count |
| `findings delete <slug> --severity <s>` | Deletes all findings of one severity | slug, severity | JSON: deleted-count |
| `findings delete-all <slug>` | Deletes ALL findings (full) | slug | JSON: deleted-count |
| `findings merge <slug> --ids <n,m,o>` | Merges several findings into one | slug, comma-separated ids | JSON: merged, new-id |
| `findings summarize <slug>` | Summarizes findings (grouped by axis, severity, class) | slug | JSON: summary [{axis, severity, class, count, ids}] |

### `ceremony ledger` — ledger management

| Subcommand | What it does | Input | Output |
|---|---|---|---|
| `ledger append <slug> --mark REVIEW-RAN\|VF-<n>\|GATE-RAN\|F\|R\|V\|E --sha <sha> --detail <text>` | Appends mark to ledger | slug, mark type, sha, detail text | JSON: appended |
| `ledger read <slug>` | Reads full ledger | slug | JSON: marks[{type, sha, detail, timestamp}] |
| `ledger delete <slug> --mark <n>` | Deletes specific mark | slug, mark index | JSON: deleted |
| `ledger delete <slug> --type <type>` | Deletes marks of one type | slug, type (REVIEW-RAN, VF, etc.) | JSON: deleted-count |
| `ledger delete-all <slug>` | Deletes ALL ledger (full) | slug | JSON: deleted-count |
| `ledger count <slug>` | Counts marks by type | slug | JSON: counts[{REVIEW-RAN, VF, GATE-RAN, F, R, V, E}] |
| `ledger verify <slug> --required-mark REVIEW-RAN` | Verifies required mark exists | slug, required-mark | JSON: verified: bool |

### `ceremony review` — review management

| Subcommand | What it does | Input | Output |
|---|---|---|---|
| `review create <slug> --head <sha>` | Starts review (with frozen SHA) | slug, head sha | JSON: created, cycle, head-sha |
| `review read <slug>` | Reads full review | slug | JSON: review (state, head-sha, cycle, findings) |
| `review append-axis <slug> --axis <name> --findings <json-array>` | Appends findings from one axis | slug, axis name, json array of findings [{finding, severity, evidence}] | JSON: appended-count |
| `review synthesize <slug>` | Fuses all axis findings (step 7) | slug | JSON: fused [{finding, axis, severity, evidence, suggested-fix}] |
| `review classify <slug> --findings <json-array>` | Classifies findings (step 8) | slug, findings json | JSON: classified [{finding, severity, class, why, route}] |
| `review transform-debt <slug>` | Transforms to debt (step 9) | slug | JSON: debt-items[{id, trigger, finding, severity}] |
| `review set-verdict <slug> --verdict PASS\|FAIL\|NEEDS-DECISION` | Sets final verdict | slug, verdict | JSON: set, verdict |
| `review append-manual-checks <slug> --checks <json-array>` | Appends manual checks (step 10) | slug, json array of manual checks [{description, why}] | JSON: appended |
| `review append-proposals <slug> --proposals <json-array>` | Appends proposals (step 11) | slug, json array [{finding, trigger}] | JSON: appended |
| `review delete <slug>` | Deletes full review | slug | JSON: deleted |
| `review read-summary <slug>` | Reads review summary (without raw findings) | slug | JSON: {verdict, cycle, head-sha, axis-count, finding-count, proposal-count, manual-count} |

### `ceremony commit` — commit management

| Subcommand | What it does | Input | Output |
|---|---|---|---|
| `commit create <slug> --message <msg> --files <comma-separated>` | Creates conventional commit | slug, message, files | JSON: created, sha, message-verified |
| `commit verify-format <msg>` | Verifies conventional format of message | message | JSON: valid: bool, type, scope, summary |
| `commit delete <slug> --sha <sha>` | Deletes commit (git revert) | slug, sha | JSON: deleted, replacement-sha |
| `commit list <slug>` | Lists commits of unit | slug | JSON: commits[{sha, message, date}] |

### `ceremony workspace` — workspace state

| Subcommand | What it does | Input | Output |
|---|---|---|---|
| `workspace status` | git status porcelain | — | JSON: status [{file, index, working, staged}] |
| `workspace clean-check` | Verifies workspace is clean | — | JSON: clean: bool, dirty-files: [...] |
| `workspace pr-status` | git status -sb (if has PR) | — | JSON: ahead, behind, branch, base |
| `workspace diff-scope <from>..<to>` | Diff between two SHAs (numstat + unified) | from-sha, to-sha | JSON: {files, lines-added, lines-deleted, hunks} |
| `workspace diff-files-only <from>..<to>` | Lists only modified files | from-sha, to-sha | JSON: {files: [...]} |
| `workspace diff-stat <from>..<to>` | git diff --stat summary | from-sha, to-sha | JSON: {stat: "...", shortstat: "..."} |
| `workspace main-check <from>..<to>` | Verifies no commits on main | from-sha, to-sha | JSON: {commits-on-main: [{sha, message}], clean: bool} |
| `workspace hash-object <path>` | git hash-object of file | path | JSON: {sha: "..."} |
| `workspace file-content <path> --sha <sha>` | Reads file content at SHA | path, sha | JSON: {content: "..."} |
| `workspace find-files <glob> --ext <ext>` | Finds files by pattern | glob, optional ext | JSON: {files: [...]} |
| `workspace grep <pattern> --glob <glob>` | grep -rn with limit | pattern, glob | JSON: {hits: [{file, line, content}], count} |

### `ceremony docs` — discipline verification

| Subcommand | What it does | Input | Output |
|---|---|---|---|
| `docs check-commit-format <from>..<to>` | Verifies commit format on branch | from-sha, to-sha | JSON: {valid: bool, invalid: [{sha, message, reason}]} |
| `docs check-phase-labels <slug>` | Verifies P1,P2,... not S1/Steps | slug | JSON: {valid: bool, invalid: [{file, line, content}]} |
| `docs check-tasks-ticks <slug>` | Verifies TASKS ticks match unit doc | slug | JSON: {valid: bool, mismatched: [{task, doc-tick, tasks-tick}]} |
| `docs check-docs-language` | Verifies no .es.md files | — | JSON: {valid: bool, es-files: [...]} |
| `docs check-progress-entry <slug>` | Verifies progress log has timestamp entry | slug | JSON: {valid: bool, missing: [phase-ids]} |
| `docs check-all` | Runs ALL discipline checks | — | JSON: {commit-format, phase-labels, tasks-ticks, docs-language, progress, overall} |

### `ceremony acceptance` — acceptance criteria

| Subcommand | What it does | Input | Output |
|---|---|---|---|
| `acceptance read <slug>` | Reads acceptance criteria of unit | slug | JSON: {criteria: [{id, text, met: bool, unmet: bool, untouched: bool}]} |
| `acceptance update-criteria <slug> --criteria <json-array>` | Updates acceptance criteria (partial or full) | slug, json array | JSON: updated, criteria-count |
| `acceptance build-manifest <slug>` | Builds acceptance manifest table | slug | JSON: {manifest: [{criterion, evidence, met, unmet, untouched}], blob-sha} |
| `acceptance check-drift <slug> --diff <from>..<to>` | Verifies SPEC drift | slug, diff scope | JSON: {drift: [{criterion, status, hunks: [...]}]} |
| `acceptance hash <slug>` | Hash of acceptance artifact | slug | JSON: {blob-sha} |

### `ceremony refutation` — finding verification

| Subcommand | What it does | Input | Output |
|---|---|---|---|
| `refutation verify <sha> --findings <json-array>` | Verifies findings against SHA head | sha, findings json | JSON: {results: [{finding, verified: confirmed\|refuted, evidence, method}]} |
| `refutation verify-file <sha> <file> <line>` | Verifies content at file:line against SHA | sha, file, line | JSON: {found: bool, actual-content: "..."} |

### `ceremony fusion` — table fusion

| Subcommand | What it does | Input | Output |
|---|---|---|---|
| `fusion build <slug> --axis <json-object>` | Builds fused table from all axes | slug, json of axis-findings | JSON: {table: [{#, finding, axis, severity, evidence, suggested-fix, reviewers}], deduped-count} |
| `fusion delta <slug> --base <slug>` | Compares two fusions | base-slug, target-slug | JSON: {added, removed, unchanged, modified} |

### `ceremony delta` — delta mode

| Subcommand | What it does | Input | Output |
|---|---|---|---|
| `delta check <from>..<to> --cited <file-lines>` | Verifies delta scope (width/size) | from-sha, to-sha, cited file-lines | JSON: {needs-full-pass: bool, trigger: "width"\|"size"\|null, width-files: [...], size-lines: N, size-files: N, changed-lines-count} |
| `delta manifest-hash <slug>` | Hash of acceptance manifest for delta | slug | JSON: {blob-sha} |

### `ceremony pr` — PR management

| Subcommand | What it does | Input | Output |
|---|---|---|---|
| `pr create <slug> --base <branch> --title <title> --body <body>` | Creates PR | slug, base, title, body | JSON: {created, pr-number, url, sha} |
| `pr comment <N> --body <body> --marker <marker>` | Comments PR with marker | pr-number, body, marker | JSON: {comment-id, posted} |
| `pr verify-receipt <N> --head <sha>` | Verifies PR receipt | pr-number, head-sha | JSON: {verified: bool, receipt: {...}} |
| `pr verify-hygiene <N>` | Hygiene check of PR | pr-number | JSON: {hygiene: {draft: bool, mergeable: bool, reviews: N, ci: bool}} |
| `pr read-diff <N>` | Reads PR diff | pr-number | JSON: {files: N, lines-added, lines-deleted, stat, shortstat} |
| `pr read-commits <N>` | Reads PR commits | pr-number | JSON: {commits: [{sha, message}]} |

### `ceremony roadmap` — roadmap management

| Subcommand | What it does | Input | Output |
|---|---|---|---|
| `roadmap row-upsert <slug> --status <status> --depends-on <json>` | Updates/inserts roadmap row | slug, status, dependsOn json | JSON: {upserted, sha} |
| `roadmap read` | Reads full roadmap | — | JSON: {rows: [{nn, slug, status, dependsOn}]} |
| `roadmap settle` | Settle roadmap (post PR merge) | — | JSON: {settled: N} |
| `roadmap list` | Lists units by status | — | JSON: {by-status: {idea: [...], defined: [...], planned: [...], in-progress: [...], done: [...]}} |

---

## File editing operations (write/edit/delete) of ceremony files

The CLI must be able to manipulate ceremony files without the agent having to write `sed`, `grep`, `cat` or any shell command for editing.

### Section-based edit operations

Each ceremony object has a section-edit model:

```
ceremony <object> <slug> update --section <section> --content <markdown-or-json>
```

Where `section` is a fixed token defined by the object schema. Example:

- `unit` sections: `tasks`, `findings`, `evidence`, `progress`, `references`, `spec`, `acceptance`, `full` (for full edit)
- `plan` sections: `tasks`, `full`
- `findings` sections: `all` (row list), `individual` (by ID)
- `ledger` sections: `all`, `by-type`
- `review` sections: `findings`, `synthesis`, `classification`, `verdict`, `manual-checks`, `proposals`, `full`

### Full edit vs partial edit

- **Partial**: `--section <token> --content <data>` — updates only that section
- **Full**: `--content <full-markdown>` — rewrites the entire object

### Delete

- **Delete full object**: `ceremony <object> delete <slug>`
- **Delete section**: `ceremony <object> delete-section <slug> --section <token>`
- **Delete individual items**: `ceremony <object> delete <slug> --id <n>`
- **Delete all items by criterion**: `ceremony <object> delete <slug> --axis <a>` or `--severity <s>`

---

## CLI input/output model

```bash
# Input: args + stdin (json)
ceremony <object> <subcommand> [flags...]

# Output: JSON on stdout
# Exit codes:
#   0 = success (JSON contains findings or results)
#   1 = usage error (wrong flags, slug doesn't exist)
#   2 = ceremonial block (workspace dirty, cannot continue)

# Example:
$ ceremony workspace clean-check
{"clean": true}

$ ceremony docs check-all
{
  "commit-format": {"valid": true, "invalid": []},
  "phase-labels": {"valid": true, "invalid": []},
  "tasks-ticks": {"valid": true, "mismatched": []},
  "docs-language": {"valid": true, "es-files": []},
  "progress": {"valid": true, "missing": []},
  "overall": "PASS"
}

$ ceremony findings read --slug 01-auth
{
  "findings": [
    {"id": 1, "file": "src/auth.ts", "line": 42, "axis": "security", "severity": "high", "class": "fix-now", "route": "fold", "folded": false},
    {"id": 2, "file": "src/auth.ts", "line": 55, "axis": "code", "severity": "low", "class": "proposal", "route": "next", "folded": false}
  ]
}

$ ceremony findings update --slug 01-auth --id 1 --severity "medium" --folded true
{"updated": true, "id": 1, "severity": "medium", "folded": true}

$ ceremony review create --slug 01-auth --head abc123
{"created": true, "slug": "01-auth", "cycle": 1, "head-sha": "abc123"}

$ ceremony review append-axis --slug 01-auth --axis code --findings '[{"finding": "unused import", "severity": "low", "evidence": "src/auth.ts:3"}]'
{"appended": 1}

$ ceremony review synthesize --slug 01-auth
{"fused": 12, "deduped": 3, "table": [{"#": 1, "finding": "...", "axis": "code", "severity": "...", "evidence": "...", "suggested-fix": "..."}]}
```

---

## What this CLI covers that isn't covered now

| Current operation | How it's done now | How with ceremony-cli |
|---|---|---|
| Verify workspace is clean | `git status --porcelain` loose commands | `ceremony workspace clean-check` → JSON |
| Verify commit format | `git log --format='%s' main..HEAD | grep -vE ...` | `ceremony docs check-commit-format main..HEAD` → JSON |
| Verify phase labels P1,P2 | `grep -rnE '\b(Step|S[0-9])\b' docs/...` | `ceremony docs check-phase-labels <slug>` → JSON |
| Verify no .es.md | `find docs/ -name '*.es.md'` | `ceremony docs check-docs-language` → JSON |
| Verify no commits on main | `git log main --oneline -1` | `ceremony workspace main-check main..HEAD` → JSON |
| Verify TASKS ticks | Manual compare between TASKS.md and unit doc | `ceremony docs check-tasks-ticks <slug>` → JSON |
| Count REVIEW-RAN marks | `grep -c REVIEW-RAN review-findings.md` | `ceremony ledger count <slug>` → JSON |
| Verify fold delta scope | `git diff --unified=0` + `git diff --numstat` + ad-hoc logic | `ceremony delta check ...` → JSON |
| Hash acceptance artifact | `git hash-object <file>` | `ceremony acceptance hash <slug>` → JSON |
| Coverage table | Build ad-hoc with grep + grep + grep | `ceremony acceptance build-manifest <slug>` → JSON |
| Verify findings against SHA | `git show sha:file`, read, grep | `ceremony refutation verify` → JSON |
| Fuse findings tables | Manual fusion of markdown tables | `ceremony fusion build` → JSON |
| Flip folded in ledger | `sed -i 's/folded: no/folded: yes/'` ad-hoc | `ceremony findings update --id N --folded true` → JSON |
| Append evidence to unit doc | `sed` / `grep` insert row | `ceremony evidence append` → JSON |
| Append progress log | `echo "timestamp → ..." >> file` ad-hoc | `ceremony progress append` → JSON |
| Create conventional commit | `git add` + `git commit -m "..."` | `ceremony commit create --message "..." --files "..."` → JSON |
| Create PR | `gh pr create --title "..." --body "..." --head "..."` | `ceremony pr create --slug ... --base ... --title ... --body ...` → JSON |
| Verify PR receipt | `git log` + grep markers ad-hoc | `ceremony pr verify-receipt` → JSON |
| List roadmap units | `grep` in ROADMAP.md | `ceremony roadmap list` → JSON |
| Update roadmap row | `sed -i` ad-hoc in markdown table | `ceremony roadmap row-upsert` → JSON |
| Delete all findings | `sed -i` / `rm` ad-hoc | `ceremony findings delete-all <slug>` → JSON |
| Delete section from unit doc | `sed` / `awk` ad-hoc | `ceremony unit delete-section <slug> --section findings` → JSON |
| Update only tasks of unit | `sed -i` ad-hoc | `ceremony plan update --tasks [...]` → JSON |
| Verify SPEC drift | Manual map diff-hunks → criteria | `ceremony acceptance check-drift` → JSON |

---

## Why individual scripts aren't enough

Current scripts (`phase-lint.mjs`, `diff-guard.mjs`, `workflow-status.mjs`) are isolated pieces the agent invokes when it knows they exist. The problem is:

1. **The agent invents the other steps**: if `workflow-discipline.mjs` doesn't exist, the agent writes whatever grep it needs — each time different, non-deterministic.
2. **No unified contract**: each script has its own output format, its own errors, its own semantics.
3. **No CRUD operations**: current scripts are read-only or write-once. No way to update a specific field of a ceremony object without parsing and rewriting markdown by hand.
4. **No delete**: no programmatic way to delete a section or item from the ceremony — the agent has to use `sed -i`, `rm`, etc. ad-hoc.

The `ceremony-cli` closes this because:

- **Defines ALL operations**: there is no ceremony operation not in the CLI
- **Fixed output**: always JSON, always the same fields
- **Full CRUD**: create, read, update (partial/full), delete for each object
- **No invention**: if the agent doesn't find an operation in the CLI, the CLI returns error, no bash workaround invented

---

## Implementation priority

No need for 12 separate scripts — need **modules of the ceremony-cli**:

1. **`workspace` module** (P0) — `status`, `clean-check`, `diff-scope`, `main-check`, `hash-object`, `file-content`, `find-files`, `grep`
   - Covers: git operations used by everything else
   - Base of everything

2. **`docs` module** (P0) — `check-commit-format`, `check-phase-labels`, `check-tasks-ticks`, `check-docs-language`, `check-progress-entry`, `check-all`
   - Covers: step 3 of review-change (the one mentioned)
   - Depends on: `workspace` module

3. **`unit` + `plan` modules** (P0) — CRUD of units and plans
   - Covers: creation, update (partial/full), deletion of unit docs and plans
   - Depends on: `workspace` module (file operations)

4. **`findings` + `ledger` modules** (P0) — CRUD of findings and ledgers
   - Covers: fold-findings operations, append/read/delete findings, ledger marks
   - Depends on: `workspace` module

5. **`review` module** (P1) — create, append-axis, synthesize, classify, transform-debt, set-verdict, append-manual-checks, append-proposals
   - Covers: steps 7, 8, 9, 10, 11 of review-change
   - Depends on: `findings` module

6. **`acceptance` module** (P1) — read, build-manifest, check-drift, hash
   - Covers: step 2 of review-change (SPEC drift)
   - Depends on: `workspace` module

7. **`refutation` module** (P1) — verify, verify-file
   - Covers: step 6 of review-change (findings verification)
   - Depends on: `workspace` module

8. **`fusion` module** (P1) — build, delta
   - Covers: step 7 of review-change (synthesis)
   - Depends on: `findings` module

9. **`delta` module** (P2) — check, manifest-hash
   - Covers: delta mode escalation
   - Depends on: `workspace` module

10. **`pr` module** (P2) — create, comment, verify-receipt, verify-hygiene, read-diff, read-commits
    - Covers: PR operations
    - Depends on: `gh` CLI installed

11. **`progress` module** (P1) — append, read, delete, clear
    - Covers: progress log operations
    - Depends on: `workspace` module

12. **`evidence` module** (P1) — append, read, delete, verify
    - Covers: evidence row operations
    - Depends on: `workspace` module

13. **`commit` module** (P2) — create, verify-format, delete, list
    - Covers: commit operations
    - Depends on: `workspace` module

14. **`roadmap` module** (P1) — row-upsert, read, settle, list
    - Covers: roadmap operations
    - Depends on: `workspace` module

---

## Example JSON output of a complete review

```bash
# A full review can be executed like this:
ceremony review complete --slug 01-auth --head abc123
```

```json
{
  "review": {
    "slug": "01-auth",
    "cycle": 1,
    "head-sha": "abc123",
    "workspace": {
      "clean": true,
      "ahead": 0,
      "behind": 0
    },
    "discipline": {
      "commit-format": {"valid": true, "invalid": []},
      "phase-labels": {"valid": true, "invalid": []},
      "tasks-ticks": {"valid": true, "mismatched": []},
      "docs-language": {"valid": true, "es-files": []},
      "progress": {"valid": true, "missing": []},
      "main-check": {"clean": true}
    },
    "acceptance": {
      "manifest-hash": "d046f0b5...",
      "criteria": [
        {"id": "AC-1", "met": true, "evidence": ["src/auth.ts:42"]},
        {"id": "AC-2", "met": false, "evidence": []}
      ],
      "drift": []
    },
    "axes": {
      "code": {"findings": 3, "pass": true},
      "security": {"findings": 1, "pass": false},
      "perf": {"findings": 0, "pass": true}
    },
    "fused": {
      "total": 4,
      "deduped": 1,
      "unique": 4,
      "table": [...]
    },
    "classified": {
      "fix-now": 2,
      "replan": 1,
      "proposal": 1,
      "rows": [...]
    },
    "debt": {
      "items": [...],
      "count": 1
    },
    "verdict": "FAIL",
    "manual-checks": [
      {"description": "Check auth response headers", "why": "Not covered by automated tests"}
    ],
    "proposals": [
      {"finding": "...", "trigger": "When adding new endpoints"}
    ],
    "next": {
      "route": "fold-findings",
      "command": "ceremony findings batch-fix --slug 01-auth --ids 1,2"
    }
  }
}
```

---

## What issue #307 should cover

Issue 307 (partial mechanical verification) should include:

1. **`workspace` module** — all git operations
2. **`docs` module** — all discipline checks
3. **`review` module** — minimum: `create`, `append-axis`, `synthesize`

What comes next (`findings`, `ledger`, `plan`, `unit`, `acceptance`, `refutation`, `fusion`, `pr`, `progress`, `evidence`, `commit`, `roadmap`) gets added in follow-up PRs extending the CLI.

---

## Final summary

The problem is not "which ceremony steps don't have a script". The problem is that **no ceremony step should depend on loose bash commands**. The ceremony is its own domain with its own rules, and must exist as a closed CLI that implements it as such:

- **Write** ceremony files (create unit doc, plan, findings, ledger, etc.)
- **Read** ceremony files (verify state, content, integrity)
- **Edit by section** ceremony files (update tasks, append findings, flip folded, etc.)
- **Edit full** ceremony files (rewrite a unit doc, plan, etc.)
- **Delete** ceremony files (delete unit, delete all findings, clear log, etc.)
- **Delete portions** of ceremony files (delete individual finding, specific task, ledger mark, etc.)

All deterministic, all fixed input/output, all verifiable with exit code and JSON.
````

- **D1** — 2026-11-24, owner decision (answer to the delivery question, S3):
  the CLI lives at `scripts/ceremony.mjs` as **one** CLI — a local, unpublished
  own-package was the owner's first instinct ("parece la mejor solución pero
  sin publicar dicho paquete") but is discarded ("descartaría esta opción")
  so the scripts stay distributable with the necessary skills; a future
  compiled binary via `bun build` is recorded under Future, not built here.
  Package-vs-scripts resolved: **scripts/**.
- **D2** — 2026-11-24, owner-accepted recommendation resolving the S9/S10
  conflict: this unit delivers the **S9 P0 set** (workspace, docs, unit+plan,
  findings+ledger). S10's smaller slice and its `review` minimum stay with the
  P1 follow-up PR the issue itself orders. S10 is therefore a *routing note*
  for that follow-up, not a requirement of this unit.

## Next

P2 — run the frozen-failure corpus RED, then P3 (CLI entry + workspace).

## References

- Issue #338 (closed by the PR via `Closes #338`).
- Issue #307 — the S10 routing note's addressee.
- `skills/pre-execution-review/references/LEDGERS.md` — ledger row contracts.
- Unit 258 (`docs/fix/258-harden-needs-input-contracts/`) — the frozen-failure
  precedent (12 review→fold cycles judged with ad-hoc commands).

## Branch

`fix/338-closed-ceremony-cli`

## Depends on

Independent.

## Regression scope

The CLI is new code with no existing consumers; the only previously-working
behaviour it could regress is the repo's own deterministic gates, because the
root suite discovers every `scripts/*.test.mjs`. Verified by:

- `node scripts/run-root-suite.mjs` exits 0 at the final head (O14).
- Existing CLI-adjacent scripts (`unit-route.mjs`, `phase-lint.mjs`,
  `diff-guard.mjs`, `needs-input.mjs`) are imported-or-invoked read-only by
  the CLI and never rewritten by it — pinned by their existing suites, which
  the root suite runs.
