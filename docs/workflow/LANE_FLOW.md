# Lane Flow — How a Unit Travels the Adaptive Lane

Operator-facing guide. Every unit flows through a single document, a triage pass,
and a catalog of adaptive steps. No separate SPEC/PLAN/TASKS/ACCEPTANCE files.

## Lifecycle

```
idea → unit doc → triage → catalog steps → evidence → review → merge
```

1. **idea** — a feature request, issue, or raw concept. No unit folder yet.
2. **unit doc** — `docs/features/<NN>-<slug>/SPEC.md` or
   `docs/fix/<issue>-<slug>/SPEC.md`, created by `unit-lane` from the template, in
   either accepted shape (#308): the 14-section set, or the re-cut set whose
   `## Specs` / `## Findings` / `## Log` replace the four prose sections and the two
   receipt sections. `scripts/unit-route.mjs` resolves which one a doc carries.
3. **triage** — `unit-route.mjs --triage <NN>` reads the unit doc's observable
   facts (type, scope, tests) and returns a deterministic ordered step list.
4. **catalog steps** — the triaged steps run in order (research → design →
   plan → implement → tests → evidence → review → docs → release).
   Judgment steps (research, design, plan, evidence, docs, review) run inline,
   one atomic gate/commit each; execution steps (implement, tests) hand off to
   `/execute-phase <NN> P<k> (tier: <tier>)` — one phase per turn, tier from
   the triage block's `Tiers:` line — and the lane resumes after the last
   phase.
   Every one of those boundaries is also a **memory boundary**: the lane's
   `references/MEMORY.md` protocol probes the substrate once per session
   (`agentic-workflow memory probe`), then saves the unit's goal, numbered
   acceptance criteria, Evidence outcomes and discoveries under
   `unit/<NN-slug>/doc` at unit start, at each phase transition and at close.
   Required substrate, never a hard dependency — a `degraded` verdict is said
   once, recorded in Evidence, and the unit keeps working.
5. **evidence** — every acceptance criterion is verified with run output.
   Evidence rows go in the unit doc's Evidence table.
6. **review** — the review pack composes axes (code, security, perf, …);
   findings are classified (fix-now / replan-in-unit / decision-required).
   At close-out the receipt stage verifies the PR's `review-change:pass`
   receipt (`review-receipt.mjs verify --pr <N>`): current → `/audit-pr`; else
   the lane hands off to `/review-change` before the gate is ever named.
7. **merge** — `audit-pr` on the final PR (the terminal stage; a current
   review receipt is its precondition); `workflow-status` reports the lane.

## Triage — what the unit needs and why

Invoke:

```
bun scripts/unit-route.mjs --triage <NN> [--json]
```

Triage reads the unit doc's frontmatter (`type`, `scope`) and the `## Applicable
tests` section body. The **catalog** (nine closed steps) decides with no
model participation:

| Unit type / scope         | Steps returned                          | Why |
|---------------------------|-----------------------------------------|-----|
| `type:docs`               | `docs, evidence`                        | No code → no implement/tests/review/plan |
| `type:chore`              | `implement, evidence`                   | Chore → implement only; no tests/review/plan/docs |
| `scope:trivial`           | `implement, evidence`                   | Small blast radius → skip tests/review/plan |
| `feature` + non-trivial   | `research, design, plan, implement, tests, evidence, review, docs` | Full pipeline for code features |
| `fix` + non-trivial       | `plan, implement, tests, evidence, review, docs` | Fix pipeline: no research/design/release |
| `feature` + medium/large  | all above + `release`                   | Release prep required for larger features |

Triage output block:

```
TRIAGE — 61-adaptive-unit-lane (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
```

The `Tiers:` line carries each selected step's `budget_tier` from
`scripts/catalog.json` (one source of truth) and `Budget:` derives from it
(any strong → strong). The `implement` tier is the execution tier named on
per-phase hand-offs.

Paste this block **verbatim** into the unit doc's Evidence section header. It is
the authority — the model never re-derives, reorders, or invents steps.

## Needs-input — the open-question ledger

A step that cannot proceed because a fact is missing asks **the plan, not the
user**. The conversation lives in the unit folder's `decisions.md` as an
append-only, two-typed ledger (`open-questions@1`, the grammar the template's
agent guide publishes):

- `open-question` — the question, why it blocks, the **search receipt** (where
  the repository was searched: `path:line` hits, greps, the unit folder, prior
  units of the same area), the researched options with their trade-offs, and the
  `route` back to the stage that owns the fact (`design` for
  scope/architecture, `unit-lane` for plan-owned facts).
- `decision` — authority `human-owner`, the date, what was chosen, what was
  discarded and why.

The resolution order is fixed and never skipped: **(0) provenance** — search the
repository's own docs first and record where; **(1) research** — an external gap
is researched and returned as 2–3 concrete options with trade-offs and a
recommendation; **(2) emit and stop** — the step stops with the open questions
written out. A request for more research, a new option, or a discussion is a
legitimate answer that appends a new `open-question` row and re-enters tier 0/1;
only a user decision closes a question.

Consume it with the deterministic dispatcher:

```
node scripts/needs-input.mjs <unit-dir> [--json]
```

It reads the unit doc plus `decisions.md` and prints the versioned
`open-questions@1` block (questions, search receipts, options, the route back,
and the typed continuation — the schema's existing `no-decision-available`,
because no decision is available by definition). Exit 0 means a well-formed
artifact and a block on stdout; a missing or malformed `decisions.md` exits
non-zero and prints a `NEEDS-INPUT FAIL` line, so a broken ledger never reads as
"nothing pending". The owning grammar lives in
[`skills/orchestration-envelope/references/TURN_CONTRACT.md`](../../skills/orchestration-envelope/references/TURN_CONTRACT.md).

**Interactive vs unattended.** Interactive, the block is the pause point: the run
waits for a user decision and never assumes one. Unattended, an open question is
a hard fail carrying the same block — the run stops with a `needs-input` terminal
state instead of proceeding on a guess.

## The guard story — diff-size, scope, and path-protection

Three guards enforce unit boundaries:

1. **Diff-size guard** (`scripts/diff-guard.mjs`): after every `implement` step.
   Measures `git diff --numstat` between `--base` and HEAD (staged + unstaged).
   Default budget: 400 lines, 8 files.

   PASS output:
   ```
   DIFF-GUARD PASS — 61
   Lines: 234 (+180/-54) · Files: 5 (limit 8)
   ```

   BREACH output:
   ```
   DIFF-GUARD BREACH — 61
   Lines: 512 > 400 · Files: 9 > 8
   Anti-gaming: NEVER shrink a diff by deleting comments, blank lines, docs or
   tests. One honest split attempted? If the unit still cannot fit, stop and
   report the real count with an exception flag — never force the number.
   → Next: re-triage the unit (/unit-lane <NN> re-triage) or record an exception
   ```

   Exit codes: 0 = PASS, 1 = BREACH, 2 = ERROR (missing `--base`).

2. **Scope guard** — the unit doc's Non-goals section. Findings discovered
   during implementation never widen scope. An acceptance criterion removed from
   scope requires explicit user approval, recorded in `## References`.

3. **Path-protection** — the plan-declaration block (`path-protection-plan@1`)
   plus the policy matrix (`path-protection-policy@1`). In `post-freeze` phase,
   test/fixture paths require `approval` for modify/delete/rename; `pre-freeze`
   only needs `justification`. The guard evaluates `(path, operation)` pairs
   against the effective policy and returns a reason from the closed set:
   `clean`, `justified`, `approved`, `protected-modification`, `approval-required`,
   `undeclared-test`, `unmatched-record`, `malformed-declaration`,
   `missing-config`, `malformed-config`.

## Review — what the evidence step checks

The `evidence` step verifies each acceptance criterion by running what was
planned and recording the result in the Evidence table. It does not merely claim:

- **Evidence reproduces** — the command was run, exit code or digest recorded,
  and ≤2 lines of output captured.
- **AC hash unchanged** — the acceptance blob (the original AC text) is not
  weakened. Evidence rows are the receipts; the acceptance criteria section is
  frozen.
- **Materiality** — evidence is only recorded for ACs that the step actually
  covers. An `n/a` step is recorded as `n/a: <reason>`.

## Where every artifact lives — the 14-section unit doc

The unit doc at `docs/features/<NN>-<slug>/SPEC.md` has exactly 14 required
sections — `UNIT_DOC_REQUIRED_SECTIONS` is the whole list, `## Impact` included:

| # | Section | Purpose |
|---|---------|---------|
| 1 | Objective | What this unit delivers |
| 2 | Why | The problem or gap |
| 3 | User outcome | From the user's perspective |
| 4 | Acceptance criteria | Numbered, scenario-induced list |
| 5 | Impact | What the change touches beyond its own files: consumers, dependents, and every mention that stops being true when it lands |
| 6 | Non-goals | What this unit is NOT |
| — | Future (extra) | User-deferred ideas, verbatim; never implemented. Reviewed at close, on session resume, and when work returns to the area |
| 7 | Future cost | Obligations on future work |
| 8 | Applicable tests | Triage-decided; `n/a` when no tests |
| 9 | Known pre-existing issues | Each marked `affects` / `does-not-affect` |
| 10 | Tasks | P1…Pn with stable IDs (a re-cut doc links each phase to its `S#`) |
| 11 | Evidence | AC → command → exit/digest → output → verified-by — **legacy shape**: a re-cut doc carries these as `## Log` `E` lines |
| 12 | Progress log | Dated `YYYY-MM-DD HH:MM` entries — **legacy shape**: a re-cut doc carries them as `## Log` `P` lines |
| 13 | Next | Single next action |
| 14 | References | Issues, roadmap rows, related material |

A **re-cut** doc (#308) keeps rows 5–10 and 13–14 and replaces the rest: `## Specs`
(numbered `S#` quoting the requester verbatim) for rows 1–4, and `## Findings` +
`## Log` for rows 11–12. Both shapes are read by the same linter, router and
executor; `scripts/unit-route.mjs` resolves the shape from the headings present.

The Evidence table uses the five columns: `AC`, `What was run`, `Exit / digest`,
`Output (≤2 lines)`, `Verified-by`. The Progress log entry regex:
`YYYY-MM-DD HH:MM — <what> → <commit/evidence> — next: <what>`.

## Deterministic next-step — the sensor's queue

`scripts/workflow-status.mjs` emits Envelope v2 on stdout. The top-level `next`
field is a priority queue (first non-empty wins):

| Priority | Condition | `reason` code | Typical `next.recommended` |
|----------|-----------|---------------|----------------------------|
| 1 | NRS draft/contradicted, substrate blockers | `blocking` | `/discover-repository-state` |
| 2 | Crash-resume RESUMABLE | `in-flight` | `/execute-phase <unit> P<N>` |
| 3 | Crash-ambiguous | `blocking` | `/workflow-status` |
| 4 | In-flight unit on current branch | `in-flight` | `/execute-phase <unit> P<N>` |
| 5 | Urgent issues (labels `urgent`/`fix-next`) | `urgent-issue` | `/triage-issue <n>` |
| 6 | Triaged issues (disposition labels) | `triaged-issue` | `/triage-issue <n>` |
| 7 | Defined features (deps met) | `defined-feature` | `/unit-lane <NN>` |
| 8 | Idea status rows | `idea` | `/unit-lane <NN>` |
| 9 | Nothing to do | `idle` | `/workflow-status` |

The sensor also emits `next.candidate_count` (candidates at that priority level),
`next.alternatives` (other items at the same level), and `detail.pre_execution`
(lane rows with `stage: "lane"`, `label: "current"`, `verdict: "READY"`).

## Command cheat-sheet

| Command | Purpose |
|---------|---------|
| `/unit-lane <NN>` | Lane conductor: triage + steps + doc updates in one document |
| `/unit-lane <NN> --retriage` | Force re-triage |
| `/unit-lane "<idea>"` | Create a unit from a raw idea |
| `/execute-phase <NN> P<k>` | Execute one phase (one phase per turn) |
| `/execute-phase <NN>` | Operator choice only: loop all remaining steps |
| `/execute-phase <NN> --fix <n>` | Execute a fix unit |
| `/fold-findings` | Repair persisted fix-now review findings |
| `/review-change` | Review a change with applicable axes |
| `/audit-pr` | Merge gate audit on a PR |
| `advance` | Pi-native conductor: sensor → decide → invoke loop (feature 62) |
| `workflow-status` | Read the sensor envelope |
| `bun scripts/unit-route.mjs --triage <NN> [--json]` | Triage a unit |
| `node scripts/needs-input.mjs <unit-dir>` | Print the `open-questions@1` block (exit 0 well-formed, non-zero malformed) |
| `bun scripts/diff-guard.mjs --base <ref>` | Diff-size guard check |
| `agentic-workflow memory probe [--json]` | Bounded memory-substrate health verdict (`memory-probe@1`), once per session before the first memory read; always exits 0 |
| `agentic-workflow unit-doc create` | Create a unit doc (SDK) |
| `agentic-workflow unit-doc setSection` | Replace a section (SDK) |
| `agentic-workflow unit-doc evidence_addRow` | Append evidence row (SDK) |
| `agentic-workflow unit-doc progress_logEntry` | Add progress entry (SDK) |
| `agentic-workflow unit-doc validate` | Validate the doc schema (SDK) |
| `agentic-workflow roadmap rowUpsert` | Upsert a roadmap row (SDK) |
| `agentic-workflow roadmap check` | Cross-document settle check: a unit doc that carries a PR URL must have its row `done · [#N](<same url>)` — named codes, exit 1 fail-closed (issue #316) |
| `agentic-workflow changelog rowAdd` | Add a changelog row (SDK) |
| `agentic-workflow budgets ceilingRebase` | Rebase budget ceiling (SDK) |
| `agentic-workflow manifest skillAdd` / `skillRemove` | Update manifest (SDK) |

---

## Programmatic contract — machine-facing

This section is the implementation contract for building a pi-native conductor
or SDK consumer. Every field, function, and boundary below is sourced verbatim
from the repository's authoritative modules.

### 1. Envelope v2 emission

`scripts/workflow-status.mjs` → stdout (JSON). Top-level fields:

```
{
  "skill": "workflow-status",
  "state": "OK | BLOCKED | NEEDS_INPUT | CONTINUE",
  "summary": "<count summary>",
  "unit": { "type", "id", "issue", "branch" },
  "phase": { "current", "total", "completed" },
  "pr": { "number", "url", "state", "head_sha", "merge_ready", "ci" },
  "gates": { "verification", "review_pending", "audit_pending" },
  "findings": { "fix_now", "issues_filed", "untriaged", "decisions_recorded" },
  "blockers": [{ "kind", "id", "scope", "detail" }],
  "dependencies": { "unmet": [id…], "build_order": [id…] },
  "recommendations": { "product_audit", "reason" },
  "needs_input": { "question", "options" } | null,
  "next": {
    "recommended": "<command>",
    "alternatives": ["<command>…"],
    "tier": "cheap | strong",
    "reason": "blocking | in-flight | urgent-issue | triaged-issue | defined-feature | idea | idle",
    "candidate_count": <number>,
    "suggested": [{ "command", "trigger", "source_skill" }]
  },
  "detail": {
    "repository_state": { "status", "snapshot_id", "source_revision" },
    "design_candidates": [{ "id", "status", "next" }],
    "pre_execution": [{ "unit", "unitDir", "stage", "label", "verdict", "boundDigest", "observedDigest", "recommended", "reason" }],
    "review_loop_cycles": { "spec", "plan" },
    "features": [{ "id", "status", "deps", "deps_unmet", "phase", "pr", "review_pending" }],
    "fixes": [{ "id", "status", "deps", "deps_unmet", "phase", "pr", "review_pending", "issue" }],
    "startable_now": ["<unit-id>…"],
    "blocked_units": { "<id>": { "unmet", "build_order" } },
    "open_prs": [{ "number", "unit", "ci" }],
    "pending_triage": [],
    "untriaged_issues": { "count", "oldest_open": [n…] },
    "workflow_observations": ["<text>…"],
    "degradations": [{ "source", "code", "detail" }],
    "continuation_refusal": "<code>" | absent,
    "crash_recovery": { "verdict", "branches" },
    "urgent": { "issues": [{ "number", "title", "label" }], "interruptibility": { "unit", "phase", "dirty", "tasks_from_boundary" } },
    "substrate_notice": { "id", "state", "blocking" } | absent
  }
}
```

`next.reason` is a closed set: `{blocking, in-flight, urgent-issue, triaged-issue,
defined-feature, idea, idle}`. `next.candidate_count` is the count at that level.

### 2. Continuation (Envelope v2 additive)

`next.continuation` is emitted by `schema.emitContinuation()` when the command
is a `status-refresh` class (`/workflow-status` or `/unit-lane`). Shape:

```
{
  "argv": ["<verb>", "<arg>…"],
  "rendering": "<posix-shell-string>",
  "preconditions": [{ "id", "check", "satisfied": bool }],
  "evidence": { "artifact": "<path>", "digest": "<64-hex-sha256>" },
  "convergence": "next.recommended | detail.pre_execution.<stage>.label"
}
```

Refusals (from `CONTINUATION_REFUSALS`): `{precondition-uncheckable, rendering-failed,
no-decision-available, sensor-degraded}`.

### 3. Triage output (`--triage`)

`scripts/unit-route.mjs --triage <NN> [--json]`:

Human text:
```
TRIAGE — <slug> (<type>)
Steps: <step, step, …>
Tiers: <step>: <cheap | strong>, …
Skipped: <step>: <reason>, … | none
Budget: strong | cheap
```

JSON (`--json`):
```
{
  "unit": "<slug>",
  "type": "feature | fix | docs | chore",
  "steps": ["<step>…"],
  "skipped": [{ "step", "reason" }],
  "tiers": { "<step>": "cheap | strong" },
  "budget": "strong | cheap"
}
```

Exit 2 on error (unknown type, invalid scope, missing sections, ambiguous unit).

### 4. Unit-doc SDK operations (agentic-workflow edit layer)

`packages/agentic-workflow/src/edit/UnitDoc.mjs` — 5 operations:

| Function | Schema | Returns |
|----------|--------|--------|
| `create(dir, slug)` | `unit-doc-template@1` | `{ ok, receipt }` |
| `setSection(doc, name, body)` | `unit-doc-section@1` | receipt |
| `evidence_addRow(doc, { ac, command, exitDigest, output, verifiedBy })` | `evidence-table@1` | receipt |
| `progress_logEntry(doc, { ts, what, ref, next })` | `progress-log@1` | receipt |
| `validate(text)` | `unit-doc-schema@1` | `{ ok, violations[] }` |

`UNIT_DOC_SECTIONS` (14): `Objective, Why, User outcome, Acceptance criteria,
Impact, Non-goals, Future cost, Applicable tests, Known pre-existing issues,
Tasks, Evidence, Progress log, Next, References`.

`EVIDENCE_COLUMNS`: `AC, What was run, Exit / digest, Output (≤2 lines), Verified-by`.

`PROGRESS_ENTRY_REGEX`: `YYYY-MM-DD HH:MM — <what> → <ref> — next: <what>`.

### 5. Receipt shape

Every edit operation returns a receipt:

```
{ "service": "unitDoc | roadmap | changelog | budgets | manifest",
  "op": "<operation-name>",
  "path": "<file-path>",
  "schema": "<schema-version>@1",
  "before": "<8-char-sha-prefix>",
  "after": "<8-char-sha-prefix>",
  "ok": boolean }
```

Operation names by service (from `file-schemas.ts`):
- `unitDoc`: `create, setSection, evidence_addRow, progress_logEntry, validate`
- `roadmap`: `rowUpsert, annotate`
- `changelog`: `rowAdd`
- `budgets`: `ceilingRebase`
- `manifest`: `skillAdd, skillRemove`

### 6. Diff-guard invocation

`scripts/diff-guard.mjs --base <ref> [--repo <path>] [--unit <label>] [--max-lines N] [--max-files N] [--json]`

Exit: 0 = PASS, 1 = BREACH, 2 = ERROR.

JSON output: `{ lines, files, additions, deletions, maxLines, maxFiles, breach, base, error }`.

### 7. Path-protection evaluation

`packages/agentic-workflow/src/path-policy.mjs` — `evaluatePathGuard({ changes, policy, declaration, records, phase })`:

- `changes`: `{ path, operation }[]` (operation ∈ `{create, modify, delete, rename}`)
- `declaration`: parsed from `path-protection-plan@1` block (`freezeAfter`, `rows`)
- `records`: parsed from `path-protection-records@1` block
- `phase`: `P<n>` string

Returns `{ verdict: "pass" | "fail", reason, offenders[] }`.

`reason` is from `PATH_GUARD_REASONS`: `{clean, justified, approved,
protected-modification, approval-required, undeclared-test, unmatched-record,
malformed-declaration, missing-config, malformed-config}`.

### 8. Conductor (`advance`) — consumer loop

`advance` is a native pi package command (feature 62), not a skill. The
conductor drives units end-to-end through one deterministic loop:

```
sensor (Envelope v2) → decideWorkflowAction() → /skill:<verb> <args>
```

Per iteration: (1) spawn `scripts/workflow-status.mjs` via `runtimeBin`,
(2) validate the Envelope v2 JSON, (3) map to `WorkflowSnapshot`, (4) feed
snapshot + policy to `decideWorkflowAction()`, (5) on `invoke` send the
decision's command verbatim through the pi router (`argv` never mutated).
Unattended runs append `--adversarial 2` for L/sensitive units and
`--adversarial 3` for security/auth units.

Refusals are the closed set `{precondition-uncheckable, rendering-failed,
no-decision-available, sensor-degraded}`; stop codes are the schema's closed
`stop-*` set. The iteration cap defaults to 12.

Terminal banners: `ADVANCE: COMPLETE` (nothing startable),
`ADVANCE: BLOCKED` (with unblock map), `ADVANCE: STOPPED`
(cap / refusal / needs-input), or `ADVANCE: CONTINUE` (one stage advanced —
the default wiring stops after one invocation because the invoked skill must
settle before the next sensor run can see its effect; re-invoke, or pass
`--continue` for the bounded full loop). The conductor **never merges** — a
merge-ready PR triggers `stop-needs-input` naming `/audit-pr` and human merge.

The urgency judge is deterministic (no model call): `fix-next` queues
head-of-line; `urgent` + clean boundary → `INTERRUPT_NOW`; `tasks_from_boundary
<= 1` or ambiguous → `FINISH_FIRST`.