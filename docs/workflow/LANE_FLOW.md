# Lane Flow — How a Unit Travels the Adaptive Lane

Operator-facing guide. Every unit flows through a single document, a triage pass,
and a catalog of adaptive steps. No separate SPEC/PLAN/TASKS/ACCEPTANCE files.

## Lifecycle

```
idea → unit doc → triage → catalog steps → evidence → review → merge
```

1. **idea** — a feature request, issue, or raw concept. No unit folder yet.
2. **unit doc** — `docs/features/<NN>-<slug>/SPEC.md` (13 sections) or
   `docs/fix/<issue>-<slug>/SPEC.md`. Created by `unit-lane` from the template.
3. **triage** — `unit-route.mjs --triage <NN>` reads the unit doc's observable
   facts (type, scope, tests) and returns a deterministic ordered step list.
4. **catalog steps** — the triaged steps run in order (research → design →
   plan → implement → tests → evidence → review → docs → release).
   Each step is an atomic gate/commit.
5. **evidence** — every acceptance criterion is verified with run output.
   Evidence rows go in the unit doc's Evidence table.
6. **review** — the review pack composes axes (code, security, perf, …);
   findings are classified (fix-now / replan-in-unit / decision-required).
7. **merge** — `audit-pr` on the final PR; `workflow-status` reports the lane.

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
Skipped: none
Budget: strong
```

Paste this block **verbatim** into the unit doc's Evidence section header. It is
the authority — the model never re-derives, reorders, or invents steps.

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

## Where every artifact lives — the 13-section unit doc

The unit doc at `docs/features/<NN>-<slug>/SPEC.md` has exactly 13 sections:

| # | Section | Purpose |
|---|---------|---------|
| 1 | Objective | What this unit delivers |
| 2 | Why | The problem or gap |
| 3 | User outcome | From the user's perspective |
| 4 | Acceptance criteria | Numbered, scenario-induced list |
| 5 | Non-goals | What this unit is NOT |
| 6 | Future cost | Obligations on future work |
| 7 | Applicable tests | Triage-decided; `n/a` when no tests |
| 8 | Known pre-existing issues | Each marked `affects` / `does-not-affect` |
| 9 | Tasks | P1…Pn with stable IDs |
| 10 | Evidence | AC → command → exit/digest → output → verified-by |
| 11 | Progress log | Dated `YYYY-MM-DD HH:MM` entries |
| 12 | Next | Single next action |
| 13 | References | Issues, roadmap rows, related material |

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
| `/execute-phase <NN> [P<k>]` | Execute one step or all remaining steps |
| `/execute-phase <NN> --fix <n>` | Execute a fix unit |
| `/fold-findings` | Repair persisted fix-now review findings |
| `/review-change` | Review a change with applicable axes |
| `/audit-pr` | Merge gate audit on a PR |
| `workflow-status` | Read the sensor envelope |
| `bun scripts/unit-route.mjs --triage <NN> [--json]` | Triage a unit |
| `bun scripts/diff-guard.mjs --base <ref>` | Diff-size guard check |
| `agentic-workflow unit-doc create` | Create a unit doc (SDK) |
| `agentic-workflow unit-doc setSection` | Replace a section (SDK) |
| `agentic-workflow unit-doc evidence_addRow` | Append evidence row (SDK) |
| `agentic-workflow unit-doc progress_logEntry` | Add progress entry (SDK) |
| `agentic-workflow unit-doc validate` | Validate the doc schema (SDK) |
| `agentic-workflow roadmap rowUpsert` | Upsert a roadmap row (SDK) |
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

`UNIT_DOC_SECTIONS` (13): `Objective, Why, User outcome, Acceptance criteria,
Non-goals, Future cost, Applicable tests, Known pre-existing issues, Tasks,
Evidence, Progress log, Next, References`.

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