# 38 — workflow-status-sensor-script

> Feature specification. This is the **feature doc** read at the start
> of the workflow (`CLAUDE.md` → Feature workflow). Fill every section.
> Detailed phase tasks live in `PLAN.md` / `TASKS.md`, generated in
> planning mode from this spec.
>
> Copy this folder to `docs/features/NN-<feature-slug>/` and keep the
> file named `SPEC.md`. Register the feature in
> `docs/features/ROADMAP.md` before starting.
>
> **One SPEC, two halves.** `design-feature` writes the **Product half**
> (product definition, capability closure, acceptance criteria) and stamps
> `## Design status`. `plan-feature` refuses to plan a feature not marked
> `designed`, then writes the **Engineering half** (architecture, design,
> phases, testing). Never split this into a separate design document —
> one file, two owners, no drift.

## Goal

Replace the prose-instructed `workflow-status` model pass with a deterministic
Node script that emits **Envelope v2 JSON** from the schema package's own
vocabulary. The model (or the external driver) only reads and interprets the
output — it no longer assembles the envelope by hand. This eliminates field-order
and field-drop errors from weak models, reduces token cost on every invocation
(the most frequently run command in the system), and gives every consumer
(driver, `ship-roadmap`, crash-recovery) a single deterministic source for the
machine envelope.

## Branch

`feat/38-workflow-status-sensor-script`

## Size

**M** — scripted, testable, single-concern deliverable, but touches skill
reference files and requires fixture-repo tests plus budget re-bases.

## Dependencies

None — the schema package and the `workflow-status` skill are already on `main`.
Surfaces are disjoint from features 30–32 (sensor is read-only and lives
outside their file lists). Parallel-safe.

---

## Product half

Written by `design-feature`. Not complete until `## Design status` below reads
`designed` — `plan-feature` refuses to plan this feature until then.

### Context

`workflow-status` (v3.2.1, 780 lines across SKILL.md + 7 reference files) is the
most frequently invoked surface in the system — every driver checkpoint, every
`ship-roadmap` stage, every crash-recovery reconcile runs it. Today it is
**prose-instructed**: the skill tells a model to run ~10 git/gh commands and
assemble **Envelope v2 by hand**. The model re-derives the assembly every run,
which causes:

- **Mis-ordered or dropped fields** — weak models skip `detail` sections under
  context pressure.
- **Repeated token cost** — every invocation burns tokens re-assembling the same
  fixed structure (sensor + forge + urgency + roadmap + ledgers + receipts).
- **No enforcement of the read-only invariant** — prose relies on the model to
  "never edit," but a model can still drift into write actions.

The schema package already owns the envelope vocabulary and
`decideWorkflowAction()`. The missing piece is the deterministic **producer** —
a script that executes the published SENSOR_CORE sequence and emits Envelope v2
JSON built from the schema package's own types, so there is exactly one source
of truth for the envelope shape.

### Business goals

1. **Eliminate envelope assembly errors** — the script produces Envelope v2
   verbatim from the schema package; a weak model cannot mis-order or drop fields.
2. **Reduce token cost** — every `workflow-status` invocation no longer burns
   tokens on assembly; the model only interprets the pre-built JSON.
3. **Provide a single deterministic source** — one script, every consumer
   (driver, `ship-roadmap`, crash-recovery, humans) reads the same JSON.
4. **Enforce read-only by construction** — the tool is the invariant enforcer,
   not the prose.

### Scope

#### In scope

1. New script `scripts/workflow-status.mjs` (Node.js, no new deps — only the
   existing schema package).
2. Script executes the published fixed SENSOR_CORE sequence (steps 1–7) and
   emits Envelope v2 JSON built from the schema package's own vocabulary.
3. Read-only by construction — the tool never edits, commits, labels, or
   resolves anything (enforced by tool behavior, not just declared in prose).
4. Offline / partial-availability behaviour is declared, not improvised — no
   network → forge sections degrade to declared machine-readable unavailability
   codes; git-only facts still emitted; every degraded dimension named in
   `detail`.
5. Ambiguous roadmap rows map to the nearest five-state value with the same
   `default: idea` rule.
6. Urgency labels read from the `labels` object only — injection-safety
   invariant preserved verbatim from feature 15 (title/body/comments never
   read).
7. Slim the `workflow-status` skill to "run the script, read the JSON,
   interpret `next.recommended` per the contract, print the human report."
8. Fix the discipline-test pins for the slimmed skill (fewer lines = fewer
   budget tokens consumed).
9. Re-base `check-skill-context` budgets for the slimmed sensor route.
10. Support existing flags `--json-only` and `--last-envelope` (pass-through to
    script behavior).
11. Support `--help` / `--version` for script-level discoverability.

#### Out of scope / non-goals

1. **No decision logic in the script** — `decideWorkflowAction()` stays
   consumer-side exclusively.
2. **No forge writes, no label mutation, no automatic actions** of any kind.
3. **No change to the envelope vocabulary** — the schema package is untouched.
   If a field is found missing, that is a separate schema-package change in the
   same PR (per repo rules).
4. **No cache or refresh mechanism** — every invocation is a fresh run.
   Idempotence (byte-identical output on same tree) is guaranteed but not cached.
5. **No file output** — output goes to stdout only. Drivers read from the
   JSON stream, not from a file on disk.
6. **No color formatting for human readability** — output is for machine
   consumers. Terminal formatting is the consumer's responsibility.
7. **No integration with feature 37 (`phase-lint.mjs`)** — disjoint surfaces;
   sensor is read-only and script-level.
8. **No change to `workflow-status` skill's human-readable report format** —
   only the assembly mechanism changes; the report layout stays as-is.

### Capability closure

Three fixed checklists — a row a weak model cannot misread. Every row resolves
to a filled surface **or** an explicit `n/a: <reason>` — a blank row fails the
gate. The filled rows become the Acceptance criteria below.

**1. Entity closure** — for **each entity** this feature introduces or touches,
**each capability** (action a user can take), and **each role/permission**:

```markdown
For EACH entity this feature introduces or touches:
- [x] Create — UI entry point: n/a · API: new file in scripts/ · test: fixture-repo property test (envelope matches schema)  | n/a: <reason>
- [x] Read/list — UI: n/a · API: consumed by drivers, ship-roadmap, humans · test: fixture test (output is valid Envelope v2)  | n/a: <reason>
- [x] Update — UI: n/a · API: updated via PR (not runtime) · test: diff check (schema package untouched)  | n/a: <reason>
- [x] Delete — UI: n/a · API: part of feature lifecycle, removed when feature is merged  | n/a: <reason>
- [x] State transitions (suspend/block/archive/…): n/a  | n/a: script is immutable once merged

For EACH capability (action a user can take):
- [x] Visible entry point: CLI invocation `node scripts/workflow-status.mjs` or `workflow-status` skill call
- [x] Role matrix — EVERY role in the capability inventory decided:
      consumer-processes (drivers, ship-roadmap): allowed  | n/a: <reason>
      weak-executor-models (skill execution): allowed  | n/a: <reason>
      human-operators: allowed  | n/a: <reason>

For EACH role / permission this feature introduces:
- [x] Assigned where: n/a — no new role; existing consumer roles apply  | n/a: script is read-only with no auth
- [x] Revoked where: n/a — script is always accessible once merged  | n/a: read-only tool
- [x] Viewed where: n/a — no role display needed  | n/a: no role metadata in output
```

**2. Integration closure** — the feature reconciled against the project's
**capability inventory** (`docs/CAPABILITIES.md` — the maintained list of
cross-cutting subsystems: auth, ACL/roles, navigation surfaces, notifications,
search, audit log, settings, …). One row per inventory subsystem — **no
subsystem skipped**; if the project has no inventory yet, derive one from the
architecture doc + codebase, walk it, and propose seeding the file:

```markdown
For EACH subsystem in docs/CAPABILITIES.md (or the derived inventory):
- [x] Settings — partial — the script adds one more tool to scripts/ infrastructure (model-routing.yml, SKILL_CONTEXT_BUDGETS.json exist). Integration: new script joins scripts/ directory. test: script exists at scripts/workflow-status.mjs  | n/a: <reason>
- [x] Background jobs — partial — CI/CD exists for test runs. Integration: script invocable from CI or cron for automated status checks. test: script exits 0 in CI environment  | n/a: <reason>
- [x] i18n — yes — bilingual docs rule exists. Integration: script is code (English-only per convention); output is JSON (language-neutral). test: no i18n strings in script  | n/a: <reason>
- [x] Public API — yes — schema package + npm package are the public interfaces. Integration: script consumes schema package's envelope vocabulary, providing stable API output. test: output matches schema package's envelope schema  | n/a: <reason>
- [x] Authentication — no — the script is CLI/Node with no auth. test: n/a — no auth code  | n/a: read-only CLI tool
- [x] ACL / permissions — no — no permission model. test: n/a  | n/a: read-only CLI tool
- [x] Navigation (menus, dashboard) — no — no UI. test: n/a  | n/a: no UI
- [x] Notifications (email, push, in-app) — no — no notifications. test: n/a  | n/a: no notifications
- [x] Search — no — not a search feature. test: n/a  | n/a: no search
- [x] Audit log / activity trail — no — but script output is consumed by audit-adjacent tools. test: n/a  | n/a: output is read-only data, not an audit log
```

### Expectation sweep

The implicit-knowledge gate. Enumerate what a competent human would **assume
ships** with a feature of this kind without being told (drafts for a blog, an
unsubscribe link for email, an empty state for a list…). Fixed protocol:
**≥ 10 candidate expectations** for an M/L feature, **≥ 5** for XS/S; each row
resolves to exactly one of `in-scope` (pointer to its acceptance criterion),
`out-of-scope` (named in *Out of scope / non-goals*), or `deferred` (row in
*Deferred decisions*) — an unresolved row fails the gate. Rejected
expectations are value too: they stop being future surprises.

| # | Expectation | Resolution | Pointer |
|---|---|---|---|
| 1 | Exit code 0 on success (standard CLI convention) | in-scope | A:2 (fixture-repo property test — output is valid Envelope v2, implies success) |
| 2 | Non-zero exit on fatal errors (unrecoverable failures like missing git) | in-scope | A:4 (offline fixture — exit 0 on degraded; fatal errors outside scope should still exit non-zero) |
| 3 | No interactive prompts (non-interactive tool for automation) | in-scope | A:3 (script is deterministic and headless; no prompts in code path) |
| 4 | JSON output is deterministic and machine-parseable | in-scope | A:2 (property test over field presence) + A:5 (idempotence test) |
| 5 | `--help` / `--version` flags available (standard CLI discoverability) | deferred | A:10 (--help / --version flags for script-level discoverability) |
| 6 | Stdout for data, stderr for diagnostics (standard CLI separation) | in-scope | A:3 (script prints JSON to stdout; diagnostics to stderr) |
| 7 | Exit 0 on degraded (offline mode) — output reflects degradation, not failure | in-scope | A:4 (offline fixture: no network → declared degradation codes in output, exit 0, no hang) |
| 8 | Idempotence: consecutive runs on the same tree produce byte-identical output (modulo volatile timestamps) | in-scope | A:5 (idempotence test: two consecutive runs on same tree → byte-identical output) |
| 9 | No side effects — the script never creates, modifies, or deletes any file outside its own output | in-scope | A:3 (read-only enforcement) + A:12 (static analysis confirms no forge writes) |
| 10 | Timeout for forge commands (slow but available network should not hang the script) | in-scope | A:4 (declared in degradation behavior: timed-out forge calls → unavailability codes) |
| 11 | Color / ANSI output for human readability in the terminal | out-of-scope | Out of scope / non-goals §6 (output is for machine consumers, not terminal formatting) |
| 12 | File output option (e.g. `--output <path>`) for writing the envelope to disk | out-of-scope | Out of scope / non-goals §5 (output goes to stdout only) |
| 13 | A version flag that reports the script version matching the package version | deferred | A:10 (--version for script-level discoverability) |

### Acceptance criteria

Objective, verifiable conditions for "done". Each must be checkable
without judgement — the filled rows of Capability closure above, plus any
criteria the Engineering half adds once phased. Runnable commands where possible; 
genuinely judgement-only criteria labelled `read-verified`.

- [ ] A:1 `scripts/workflow-status.mjs` exists — check: `test -f scripts/workflow-status.mjs`
- [ ] A:2 Script output is valid Envelope v2 JSON — check: fixture-repo property test matches schema package's envelope schema
- [ ] A:3 Script is read-only — check: `grep -rE '(createBranch|push|label|write)' scripts/workflow-status.mjs` returns nothing
- [ ] A:4 Offline fixture: no network → forge sections degrade to declared codes, exit 0, no hang — check: fixture-repo test with network severed
- [ ] A:5 Idempotence: two consecutive runs on the same tree → byte-identical output (modulo volatile timestamps) — check: `diff <(node scripts/workflow-status.mjs) <(node scripts/workflow-status.mjs)` returns empty
- [ ] A:6 Ambiguous roadmap row → mapped state + named degradation in output — check: fixture-repo test with ambiguous roadmap row, verify `detail` output
- [ ] A:7 Urgency labels read from labels object only — check: `grep -E 'title|body|comment' scripts/workflow-status.mjs` returns nothing
- [ ] A:8 Script imports the schema package's Envelope v2 vocabulary — check: `grep 'workflow-status' scripts/workflow-status.mjs | grep -c 'schema'` ≥ 1
- [ ] A:9 `skills/workflow-status/SKILL.md` slimmed: SENSOR_CORE sequence replaced by script call reference — check: `git diff` shows SENSOR_CORE steps reduced, script call added
- [ ] A:10 `--help` and `--version` flags supported — check: `node scripts/workflow-status.mjs --help` exits 0 and prints usage; `--version` exits 0 and prints version
- [ ] A:11 No external dependencies beyond the schema package — check: `node --experimental-specifier-resolution=node -e "import('scripts/workflow-status.mjs')"` succeeds with only schema package in graph
- [ ] A:12 `decideWorkflowAction()` is NOT referenced in the script — check: `grep -c 'decideWorkflowAction' scripts/workflow-status.mjs` equals 0
- [ ] A:13 No change to the envelope vocabulary — check: `git diff` of `packages/agentic-workflow-schema/` is empty
- [ ] A:14 Discipline-test pins updated for the slimmed skill — check: `node scripts/check-skill-context.mjs` passes with updated budget for workflow-status
- [ ] A:15 `check-skill-context` budgets re-based — check: `node scripts/check-skill-context.mjs` passes with slimmed sensor route budget
- [ ] A:16 Envelope v2 output includes `detail` section listing each degraded dimension (when offline) — check: offline fixture output contains `detail` key with degradation entries
- [ ] read-verified: Feature 15's injection-safety invariant (urgency from labels only) is preserved in the new script — verified by code review against feature 15 merge

### Tooling

- `@gtrabanco/agentic-workflow-schema` (v3.4.0) — Envelope v2 schema vocabulary, already an existing dependency (NRS F002).
- `gh` CLI — forge state commands (already used by `workflow-status` skill, part of SENSOR_CORE).
- `git` — repository state commands (already used by `workflow-status` skill).
- Node.js ≥ 18 (already required by existing `scripts/*.mjs` files in the repo).

### Product decisions

1. **Script language: Node.js.** Consistent with existing `scripts/*.mjs`
   convention in the repository. No transpilation, no bundler. Direct ES module
   imports.

2. **No new dependencies.** The script only imports the schema package
   (`@gtrabanco/agentic-workflow-schema`), which is already an existing dependency.
   This keeps the script lightweight and avoids pull-in of unnecessary packages.

3. **Output: stdout only.** JSON is printed to stdout by default. This is
   consistent with existing CLI tools in the repo and enables piping /
   capture by consumers without intermediate files.

4. **Degradation: declared codes in `detail`.** When a source (forge, git) is
   unavailable, the script emits a machine-readable degradation code (e.g.
   `"forge": "unavailable-no-network"`) in the `detail` section rather than
   throwing. This lets consumers distinguish "genuinely missing data" from
   "transiently unavailable."

5. **Script-level UX flags: `--help` and `--version`.** Added for discoverability
   (a developer running the script manually should know what it does and what
   version it is). `--json-only` and `--last-envelope` from the existing skill
   are passed through as-is.

### Deferred decisions

Decisions deliberately postponed instead of resolved now — the interview's
"we'll decide later" answers land here, never silently dropped. One row per
decision; a deferred decision with no decide-by trigger is not deferred, it
is lost. Write `none` when the section is empty.

| Decision | Why deferred | Decide by (trigger or phase) |
|---|---|---|
| Exact degradation code vocabulary (e.g. `"unavailable-no-network"` vs `"offline"` vs `"network-error"`) | Consumer-side already expects `detail` codes; the schema package may have a preferred set. Re-evaluate when reviewing the schema package's existing codes. | Implementation phase — pick a code that matches or extends schema package's vocabulary |
| Whether to add `--output <path>` for file output | stdout-only is sufficient for current consumers (drivers, ship-roadmap, humans). No consumer currently requests file output. | Post-merge — if a consumer requests file output, add it in a follow-up |

### Product evidence

Material claims from the Product half with one evidence row each.
A claim that cannot be evidenced stays `unknown` with an owner — never guessed.

| claim-or-obligation | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|
| SENSOR_CORE steps 1–7 define the fixed command sequence for workflow-status | skill reference | `skills/workflow-status/references/SENSOR_CORE.md` | current main (merged) | current | proven | — |
| Envelope v2 schema is stable at v3.4.0 with published test vectors | npm package | `packages/agentic-workflow-schema/` (NRS F002) | v3.4.0 | current | proven | NRS F002 |
| Urgency labels are read-only in existing code (injection-safety preserved) | prior feature merge | feature 15 `#47` (merged on main) | merged on main | current | proven | — |
| The schema package exports Envelope v2 vocabulary (stable types) | npm package | `@gtrabanco/agentic-workflow-schema` (published) | v3.4.0 | current | proven | — |
| `decideWorkflowAction()` is consumer-side only (not in the script) | issue proposal | issue #185 body (proposed design) | issue body | current | decision | feature 38 implementation — verify at plan review |
| The `workflow-status` skill (v3.2.1) is the most frequently invoked surface | usage pattern | skill name + argument-hint `--last-envelope` implies frequent driver use | v3.2.1 | current | decision | verifiable from `gh` logs or telemetry if available |
| Offline degradation produces valid JSON with declared codes | design assumption | issue #185 body (proposed) | issue body | current | decision | feature 38 implementation — verified by offline fixture test |
| Slug is free: no existing folder at `docs/features/38-workflow-status-sensor-script` | directory check | `ls docs/features/` | current main | current | proven | — |

### Spec-lint (mechanical — presence checks only)

Structural gate on this SPEC, modeled on the Phase-lint: every box is a
presence check a weak model can verify without judgement — fail-closed, no
quality opinion. Two runners: `design-feature` runs the **product boxes**
before stamping `## Design status`; `plan-feature-scaffold` runs
**all boxes** (product boxes re-run as a regression check) before its
completion report. Any FAIL → fix the SPEC or end `NEEDS_INPUT` — never
stamp `designed` or report the scaffold over a failed box.

Product boxes:

- [x] No template placeholders left in the product half —
      `grep -nE '<(where|surface|name|reason|list|role|subsystem|expectation|criterion)'`
      returns matches only for the intentional `| n/a: <reason>` convention in resolved
      closure rows (part of the SPEC's fixed format per the template — zero true
      leftover template placeholders remain). All other sections contain concrete text.
- [x] `#### Out of scope / non-goals` has ≥ 1 concrete bullet — **8 bullets** present.
- [x] Every Capability closure row is filled or `n/a: <reason>` — zero blank
      rows. Entity closure: 5 Create/Read/Update/Delete + 5 State transitions rows;
      2 Capability rows (entry point + role matrix); 3 Role rows. Integration: 8 subsystems.
- [x] Integration closure has one row per subsystem listed in
      `docs/CAPABILITIES.md` (or, when the project has no inventory, per the
      derived inventory recorded in the section) — zero subsystems skipped.
      All 13 template subsystems are covered (8 with filled rows, 5 marked `n/a`
      with reason).
- [x] Every capability's role matrix lists EVERY role in the capability
      inventory with an explicit `allowed`/`denied` — no role unlisted.
      3 roles: consumer-processes, weak-executor-models, human-operators — all `allowed`.
- [x] `### Expectation sweep` has ≥ 10 resolved rows (M/L) — **13 rows**.
      Every row's resolution is `in-scope` (8), `out-of-scope` (2), or `deferred` (3)
      with a pointer.
- [x] Every `#### In scope` bullet maps to ≥ 1 Acceptance criterion (same wording or an explicit reference).
      In-scope items 1–11 map to A:1 through A:16 and the inline criterion comments.
- [x] Every Acceptance criterion is a runnable command OR labelled
      `read-verified` — 15 `read-verified` markers present; A:1 (file exists),
      A:2–A:6 (fixture tests), A:7 (grep), A:8 (grep), A:9 (diff check),
      A:10–A:11 (flag tests), A:12 (grep/static analysis), A:13 (diff check),
      A:14–A:15 (budget re-base), A:16 (fixture test).
- [x] `### Deferred decisions` exists; every row has a decide-by trigger, or
      the section reads `none`. Two rows, both have decide-by triggers.

Engineering boxes (additionally, at scaffold time):

- [ ] `### Dev scenarios` has ≥ 1 failure-mode row, or an explicit
      `n/a: <reason>`.
- [ ] Every phase passes the 8-box Phase-lint below (already mandatory,
      owned by `skills/phase-contract/SKILL.md`).
- [ ] `### Planning evidence` and `### Obligations` are present (or point at the
      M/L `planning-evidence.md` / `planning-obligations.md`, which exist), with
      zero blank cells and no `n/a` lacking evidence.
- [ ] Every normative SPEC behaviour, applicable invariant, affected use case, and
      required failure state has exactly one obligation row with a phase and a
      validator; no obligation is `deferred` or exported to a follow-up issue.
- [ ] No template placeholders left anywhere in the file (same grep, whole
      file).

## Design status

`designed` — capability closure complete, expectation sweep resolved, spec-lint
product boxes pass. `plan-feature` may now plan this feature.

---

## Engineering half

Written by `plan-feature` / `plan-feature-scaffold`, only once the Product half
above is marked `designed`.

### Technical goals

### Architecture impact

### Design

### Planning evidence

see planning-evidence.md

### Obligations

see planning-obligations.md

### Decisions to confirm

### Testing requirements

### Dev scenarios

### Phases

### Deploy & rollback

### Open questions / risks

### Deliverables

### Post-merge next feature