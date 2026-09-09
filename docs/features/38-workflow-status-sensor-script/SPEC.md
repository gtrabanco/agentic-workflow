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

`workflow-status` (v3.2.1, 780 lines across SKILL.md + 8 reference files) is the
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

1. New script `scripts/workflow-status.mjs` (Node.js, no new dependencies — the
   schema package's vocabulary is consumed through the repo's established
   `scripts/schema-runtime.mjs` loader, not a dependency install; Product
   decision 2).
2. Script executes the published fixed SENSOR_CORE sequence (steps 1–9, incl.
   6a — the nine numbered steps `SENSOR_CORE.md` publishes, through step 8
   *pending quality gates* and step 9 *fix-now fold ledger*), and emits Envelope
   v2 JSON built from the schema package's own vocabulary.
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
7. Slim the `workflow-status` skill — `SKILL.md` plus the sequence/envelope
   reference files (`references/SENSOR_CORE.md` and `references/ENVELOPE_CORE.md`,
   whose fixed-sequence prose slims to the script call) — to "run the script, read
   the JSON, interpret `next.recommended` per the contract, print the human report."
8. Fix the discipline-test pins for the slimmed skill (fewer lines = fewer
   budget tokens consumed).
9. Re-base `check-skill-context` budgets for the slimmed sensor route.
10. Support existing flags `--json-only` and `--last-envelope <json|path>` —
    pass-through semantics resolved (bounded questions to the human design owner,
    2026-09-09 — Product decision 7): `--json-only` is an accepted no-op (the
    script's output is already envelope-only; the flag preserves argv parity so
    callers pass the same argv to script and skill); `--last-envelope <json|path>`
    (inline JSON string or file path) is **computed by the script** — the hint is
    diffed against recomputed state and the no-progress guard runs whenever the
    flag is supplied (the skill's turn contract makes it mandatory), appending the
    divergence line and guard note to `detail.workflow_observations` (shape per
    `references/ENVELOPE_FIELDS.md`); the hint never overrides recomputed state;
    an unreadable or malformed hint degrades to a machine-readable
    `unavailable-hint-<cause>` note with exit 0 (fail-open).
11. Support `--help` / `--version` for script-level discoverability.
12. Update `docs/workflow/ORCHESTRATION.md` so the driver contract points
    consumers at the script as the envelope's deterministic producer (business
    goal 3's consumer wiring — issue #185: "Drivers consume the same JSON
    directly").
13. Fold fix #209's release policy into this feature's deliverables —
    `CLAUDE.md`'s versioning guidance gains the freeze-majors rule (minor/patch
    only until #176 merges; breaking changes ship as minor with a `BREAKING
    CHANGE:` footer); this feature's own bump (E-38-2, 3.2.1 → 3.3.0 minor)
    complies with the freeze.

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
- [x] Delete — UI: n/a · API: no runtime delete path; the script performs only
      reads (removing the script file itself is an ordinary PR, not a runtime
      capability of the sensor) · test: `grep -nE '(unlink|fs\.rm|rmSync|writeFile)'`
      returns nothing
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
**capability inventory** (`docs/CAPABILITIES.md` — provenance, stated per F19:
at this revision the file is the **unfilled template** `init-workspace` seeds —
placeholder `Exists` cells and a template-only roles row, not a populated
inventory; the 13 subsystems walked below are the template's **fixed floor
set**, each reconciled here with project-specific reasons rather than inventory
facts — **seeding `docs/CAPABILITIES.md` from the template is proposed** to the
design owner (user confirms; upsert-safe, see decisions.md)). One row per
inventory subsystem — **no subsystem skipped**; if the project has no inventory
yet, derive one from the architecture doc + codebase, walk it, and propose
seeding the file:

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
- [x] File / media storage — no — the script writes no files (stdout-only output,
      non-goal §5) and reads no media. test: n/a — no file I/O in the script  | n/a:
      no file/media storage in this product
- [x] Feature flags — no — no flag store exists in this project; the script's only
      flags are CLI arguments, not runtime feature flags. test: n/a  | n/a: no
      feature-flag subsystem in this product (inventory floor row)
- [x] Billing / payments — no — internal developer tool; no billing surfaces.
      test: n/a  | n/a: billing cannot apply to this product (inventory floor row)
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
| 2 | Non-zero exit on fatal errors — the sensor's fatal class is invalid invocation (an unknown flag is a usage error); environmental failures (no network, missing git, timed-out forge) are **not** fatal — they degrade to declared codes with exit 0 (Product decision 6 names `unavailable-git-missing`), so the row's original "like missing git" example was stale wording, corrected against the reviewed decision | in-scope | A:20 (unknown flag → non-zero exit, usage diagnostic on stderr) |
| 3 | No interactive prompts (non-interactive tool for automation) | in-scope | A:22 (grep proves no prompt/TTY-read call exists in the code path) |
| 4 | JSON output is deterministic and machine-parseable | in-scope | A:2 (property test over field presence) + A:5 (idempotence test) |
| 5 | `--help` / `--version` flags available (standard CLI discoverability) | in-scope | A:10 (--help / --version flags for script-level discoverability) |
| 6 | Stdout for data, stderr for diagnostics (standard CLI separation) | in-scope | A:23 (stdout alone parses as one valid JSON document; the offline run's diagnostics land on stderr) |
| 7 | Exit 0 on degraded (offline mode) — output reflects degradation, not failure | in-scope | A:4 (offline fixture: no network → declared degradation codes in output, exit 0, no hang) |
| 8 | Idempotence: consecutive runs on the same tree produce byte-identical output — verbatim, no volatile fields by construction (same guarantee A:5 binds; F9 removed the old timestamp carve-out) | in-scope | A:5 (idempotence test: two consecutive runs on same tree → byte-identical output) |
| 9 | No side effects — the script never creates, modifies, or deletes any file outside its own output | in-scope | A:3 (read-only enforcement) + A:12 (static analysis confirms no forge writes) |
| 10 | Timeout for forge commands (slow but available network should not hang the script) | in-scope | A:21 (fixture produces the hang case: non-terminating `gh` shim → exit 0 within the forge timeout, `unavailable-forge-timeout` in `detail`) |
| 11 | Color / ANSI output for human readability in the terminal | out-of-scope | Out of scope / non-goals §6 (output is for machine consumers, not terminal formatting) |
| 12 | File output option (e.g. `--output <path>`) for writing the envelope to disk | out-of-scope | Out of scope / non-goals §5 (output goes to stdout only) |
| 13 | A version flag that reports the script version matching the package version | in-scope | A:10 (--version prints the schema package version; in-scope item 11) |

### Acceptance criteria

Objective, verifiable conditions for "done". Each must be checkable
without judgement — the filled rows of Capability closure above, plus any
criteria the Engineering half adds once phased. Runnable commands where possible; 
genuinely judgement-only criteria labelled `read-verified`.

- [ ] A:1 `scripts/workflow-status.mjs` exists — check: `test -f scripts/workflow-status.mjs`
- [ ] A:2 Script output is valid Envelope v2 JSON — check: fixture-repo property test matches schema package's envelope schema
- [ ] A:3 Script is read-only: it performs no mutation action (branch creation,
      push, label mutation, issue/PR writes, file writes) — check:
      `grep -nE '(createBranch|git push|gh pr (edit|merge|close|create)|gh issue (edit|close|label|create)|writeFile|fs\.write|unlink)' scripts/workflow-status.mjs`
      returns nothing (label *reading* stays — required by A:7's labels-only scan)
- [ ] A:4 Offline fixture: no network → forge sections degrade to declared codes, exit 0, no hang — check: fixture-repo test with network severed. Scope note: severed network makes `gh` fail fast — this criterion covers the fail-fast case only; the slow-but-alive (stalling) forge case sweep row 10 names is A:21's fixture
- [ ] A:5 Idempotence: two consecutive runs on the same fixture tree → byte-identical output verbatim — the script emits no volatile fields by construction (Envelope v2 has no timestamp field, and `detail` performs no clock reads), so the check carries no modulo carve-out — check: `diff <(node scripts/workflow-status.mjs) <(node scripts/workflow-status.mjs)` returns empty
- [ ] A:6 Ambiguous roadmap row → mapped state + named degradation in output — check: fixture-repo test with ambiguous roadmap row, verify `detail` output
- [ ] A:7 Urgency labels read from the labels object only (labels-only
      scanning — the issue's title/body/comments are never scanned for urgency)
      — check: `grep -nE '\-\-json[^|]*(body|comment)' scripts/workflow-status.mjs`
      returns nothing (no forge request field list ever includes `body` or
      `comment` — those fields are never fetched or read; the forbidden set is
      scoped to forge request fields so documenting the invariant in a source
      comment cannot flip the check — F28 repair, intent-preserving) AND
      `grep -cE 'labels' scripts/workflow-status.mjs` ≥ 1 (the labels-only scan
      path exists); `title` is deliberately NOT in the forbidden set — SENSOR_CORE
      step 3 emits `urgent.issues[].title` from the step-2 list output, so the
      script must reference it: carrying an already-fetched title through to the
      envelope is output, not a scan (the read-verified criterion below owns the
      full labels-only review)
- [ ] A:8 Script consumes the schema package's Envelope v2 vocabulary through
      the repo's established schema-runtime loader — the built local package
      loaded by explicit path (`scripts/schema-runtime.mjs`, which deliberately
      does not fall back to a published `@gtrabanco/agentic-workflow-schema`:
      a published build can be older than the source under review) — check:
      `grep -nE "from ['\"]\\./schema-runtime\\.mjs['\"]" scripts/workflow-status.mjs`
      returns a match AND
      `grep -nE "^import .*'@gtrabanco/agentic-workflow-schema'" scripts/workflow-status.mjs`
      returns nothing (the repo provides no bare-specifier resolution for
      `scripts/` — no root package.json, no installed `@gtrabanco`, `dist/` is
      a gitignored build output; verified live 2026-09-09 — so a bare-specifier
      import line could never resolve and must not be mandated)
- [ ] A:9 `skills/workflow-status/SKILL.md` slimmed: SENSOR_CORE sequence replaced by script call reference — check: `git diff` shows SENSOR_CORE steps reduced, script call added
- [ ] A:10 `--help` and `--version` flags supported — check: `node scripts/workflow-status.mjs --help` exits 0 and prints usage; `--version` exits 0 and prints version
- [ ] A:11 No external dependencies beyond the schema package (consumed via the
      schema-runtime loader's built-dist precondition, same as the repo's root
      tests) — check, two cases: (a) with the schema runtime built
      (`packages/agentic-workflow-schema/dist/index.js` exists — build
      precondition; `dist/` is a gitignored build output),
      `node -e "import('./scripts/workflow-status.mjs')"` exits 0 (the specifier
      carries the mandatory `./` prefix — a bare specifier resolves as a package
      name and fails `ERR_MODULE_NOT_FOUND` regardless of the graph;
      control-verified live on Node v24.19.0); (b) with `dist/` hidden, the same
      import fails with the loader's named precondition error ("schema runtime
      is not built"), never a bare `ERR_MODULE_NOT_FOUND` — the script states
      its build precondition instead of looking like a broken module
- [ ] A:12 `decideWorkflowAction()` is NOT referenced in the script — check: `grep -c 'decideWorkflowAction' scripts/workflow-status.mjs` equals 0
- [ ] A:13 No change to the envelope vocabulary — check: `git diff` of `packages/agentic-workflow-schema/` is empty
- [ ] A:14 Discipline-test pins and `check-skill-context` budgets re-based for the
      slimmed sensor route — check: `node scripts/check-skill-context.mjs` exits 0
      with the updated budget for `workflow-status`
- [ ] A:15 Envelope v2 output includes `detail` section listing each degraded dimension (when offline) — check: offline fixture output contains `detail` key with degradation entries
- [ ] A:16 `docs/workflow/ORCHESTRATION.md` driver wiring points consumers at the
      script — check: `grep -c 'workflow-status.mjs' docs/workflow/ORCHESTRATION.md`
      ≥ 1
- [ ] A:17 `--json-only` is an accepted no-op — check:
      `diff <(node scripts/workflow-status.mjs --json-only) <(node scripts/workflow-status.mjs)`
      returns empty
- [ ] A:18 `--last-envelope <json|path>` guard: fixture-repo test supplies a stale
      hint (inline-JSON and file-path variants) whose `next.recommended` targeted a
      unit still at its pre-advance status → `detail.workflow_observations`
      contains the no-progress note (shape per `references/ENVELOPE_FIELDS.md`),
      the divergence line is present when hint and recomputed state differ, and
      the recomputed `state`/`next` are unchanged by the hint
- [ ] A:19 Unreadable/malformed hint degrades without failing — check: fixture-repo
      test with a missing path and with invalid JSON → machine-readable
      `unavailable-hint-<cause>` note in `detail.workflow_observations`, exit 0,
      recomputed envelope unaffected
- [ ] A:20 Invalid invocation is the only fatal exit class and exits non-zero
      (every environmental failure degrades with exit 0 per Product decisions
      4/6) — check: `node scripts/workflow-status.mjs --not-a-real-flag` exits
      non-zero and prints a usage diagnostic to stderr (matches the repo's
      established CLI convention: `scripts/ledger-provenance.mjs
      --not-a-real-flag` → usage + exit 2, `scripts/check-skill-context.mjs
      --not-a-real-flag` → exit 1)
- [ ] A:21 Slow-but-alive forge cannot hang the script: forge calls run under a
      bounded wall-clock timeout, and a forge that accepts connections but never
      answers degrades to `unavailable-forge-timeout` (Product decision 6) with
      exit 0 — the timed-out case is actually produced, not just declared
      (severed-network A:4 covers only `gh` failing fast) — check: fixture-repo
      test with `gh` replaced by a shim that accepts and never terminates →
      script exits 0 within its forge timeout, `detail` names
      `unavailable-forge-timeout`, and no forge call outlives the bound
- [ ] A:22 No interactive prompts — the script is headless by construction and
      never reads stdin interactively — check:
      `grep -nE '(readline|createInterface|process\\.stdin\\.(read|setRawMode)|@clack|inquirer|prompts?\\(|confirm\\()' scripts/workflow-status.mjs`
      returns nothing
- [ ] A:23 Stdout for data, stderr for diagnostics — check:
      `node scripts/workflow-status.mjs 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{JSON.parse(s)})'`
      exits 0 (stdout alone is one valid JSON document — stderr cannot leak into
      the data stream), and the offline fixture run (A:4) asserts the
      degradation/diagnostic lines land on stderr while stdout stays valid
      envelope JSON
- [ ] A:24 `references/ENVELOPE_CORE.md` slimmed to interpret-and-recommend:
      the envelope-shape/assembly prose (self-check reminders and per-field
      assembly notes) is replaced by script-backed references, keeping the
      crash-recovery state mapping and the `next.tier` command map the skill
      interprets — check: `grep -c 'scripts/workflow-status.mjs'
      skills/workflow-status/references/ENVELOPE_CORE.md` ≥ 1 (script-backed
      reference present) AND `grep -cE 'self-check before printing'
      skills/workflow-status/references/ENVELOPE_CORE.md` → 0 (assembly
      self-check prose gone — the script owns the self-check, E-38-1; F26
      repair: closes the in-scope item 7 surface that mapped to no criterion)
- [ ] A:25 Fix #209's release policy is documented in the repo's versioning
      guidance — check: `grep -nE '#176' CLAUDE.md` → ≥ 1 AND `grep -nE 'BREAKING CHANGE:' CLAUDE.md` → ≥ 1 (the freeze-majors rule names the gating milestone #176 and the breaking-change footer convention; operator-approved scope amendment 2026-09-10 folding fix #209 into 38's deliverables)
- [ ] read-verified: Feature 15's injection-safety invariant (urgency from labels only) is preserved in the new script — verified by code review against feature 15 merge

### Tooling

- `@gtrabanco/agentic-workflow-schema` (**v4.1.1**, verified live) — Envelope v2
  schema vocabulary; consumed via the repo's established `scripts/schema-runtime.mjs`
  loader (built local package by explicit path, named fail-fast build
  precondition, deliberately no published-package fallback — no dependency
  install exists or is added; Product decision 2). NRS F002 still freezes
  3.4.0 — drifted vs live, contradiction candidate for `/resolve-repository-state`
  (see Product evidence row 2); not silently edited here.
- `gh` CLI — forge state commands (already used by `workflow-status` skill, part of SENSOR_CORE).
- `git` — repository state commands (already used by `workflow-status` skill).
- Node.js ≥ 18 (already required by existing `scripts/*.mjs` files in the repo).

### Product decisions

1. **Script language: Node.js.** Consistent with existing `scripts/*.mjs`
   convention in the repository. No transpilation, no bundler. Direct ES module
   imports.

2. **No new dependencies; schema vocabulary via the established loader.** The
   script consumes the schema package's Envelope v2 vocabulary through the
   repo's established `scripts/schema-runtime.mjs` loader — the built local
   package loaded by explicit path (`packages/agentic-workflow-schema/dist/index.js`),
   with a named fail-fast precondition ("schema runtime is not built → build
   it first") and deliberately no fallback to a published
   `@gtrabanco/agentic-workflow-schema` (a published build can be older than
   the source under review). The repository provides no bare-specifier
   resolution for `scripts/` (no root package.json, no installed `@gtrabanco`,
   `dist/` is a gitignored build output — verified live 2026-09-09), so no
   dependency install exists or is added. Reviewed intent unchanged from the
   original decision (F23 repair, 2026-09-09): only the schema package, no new
   packages — only the resolution mechanism, previously recorded as the false
   claim "already an existing dependency", is corrected to the repo's
   documented precedent.

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
   are passed through — semantics resolved in Product decision 7.

6. **Degradation-code vocabulary: namespaced `unavailable-<source>-<cause>`.**
   The design owner selected namespaced codes (resolved via bounded question
   2026-09-09 — self-describing, extensible, consistent with Product decision
   4's example style). e.g. `unavailable-forge-no-network`,
   `unavailable-forge-timeout`, `unavailable-forge-auth`,
   `unavailable-git-missing`. The consumer (driver/orchestrator) matches the
   prefix `unavailable-` to route degraded readings appropriately. Forge calls
   run under a bounded wall-clock timeout (implementation constant; value fixed
   at implementation), so `unavailable-forge-timeout` is a reachable code rather
   than a declared-but-unreachable one (grounded by A:21's fixture, F21).

7. **Flag pass-through semantics (resolved via bounded questions to the human
   design owner, 2026-09-09).** `--json-only`: accepted no-op — the script always
   prints only the envelope, so the flag exists purely for argv parity between
   script and skill. `--last-envelope <json|path>` (inline JSON string or file
   path): computed by the script — hint diff against recomputed state plus the
   no-progress guard, which the skill's turn contract makes mandatory whenever
   the flag is supplied; results append to `detail.workflow_observations` (note
   shape per `references/ENVELOPE_FIELDS.md`); the hint never overrides
   recomputed state; an unreadable or malformed hint is fail-open — a
   machine-readable `unavailable-hint-<cause>` note (vocabulary per Product
   decision 6) with exit 0, because the sensor is the lowest link in the
   automation chain and must keep returning usable output even when the caller's
   input is bad.

### Deferred decisions

Decisions deliberately postponed instead of resolved now — the interview's
"we'll decide later" answers land here, never silently dropped. One row per
decision; a deferred decision with no decide-by trigger is not deferred, it
is lost. Write `none` when the section is empty.

| Decision | Why deferred | Decide by (trigger or phase) |
|---|---|---|
| Whether to add `--output <path>` for file output | stdout-only is sufficient for current consumers (drivers, ship-roadmap, humans). No consumer currently requests file output. | Post-merge — if a consumer requests file output, add it in a follow-up |

### Product evidence

Material claims from the Product half with one evidence row each.
A claim that cannot be evidenced stays `unknown` with an owner — never guessed.

| claim-or-obligation | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|
| SENSOR_CORE's published fixed sequence spans numbered steps 1–9 (incl. 6a): git, forge, urgency, roadmap/fix-index, dependency tree, readiness, receipts, phase progress, pending quality gates, fix-now fold ledger — steps 8 and 9 are envelope producers in scope | skill reference | `skills/workflow-status/references/SENSOR_CORE.md` (numbered steps, "Steps 1-9 print these keys") | current main (merged) | current | proven | — |
| Envelope v2 schema is stable at v4.1.1 with published schemas and test vectors | npm package | `packages/agentic-workflow-schema/package.json` + `envelope.schema.json` + `test/` (verified live 2026-09-09) | main (4.1.1) | current | proven | NRS F002 still freezes 3.4.0 — drifted vs live; contradiction candidate for `/resolve-repository-state`, never silently edited |
| Urgency labels are read-only in existing code (injection-safety preserved) | prior feature merge | feature 15 `#47` (merged on main) | merged on main | current | proven | — |
| The schema package v4.1.1 exports the Envelope v2 vocabulary (`Envelope`, `validateEnvelope`, `parseEnvelope`, `decideWorkflowAction`) | npm package | `packages/agentic-workflow-schema/src/index.ts` (verified live 2026-09-09) | v4.1.1 | current | proven | — |
| `decideWorkflowAction()` is consumer-side only (not in the script) | issue proposal | issue #185 body (proposed design) | issue body | current | decision | feature 38 implementation — verify at plan review |
| The `workflow-status` skill (v3.2.1) is the most frequently invoked surface | usage pattern | skill name + argument-hint `--last-envelope` implies frequent driver use | v3.2.1 | current | decision | verifiable from `gh` logs or telemetry if available |
| Offline degradation produces valid JSON with declared codes | design assumption | issue #185 body (proposed) | issue body | current | decision | feature 38 implementation — verified by offline fixture test |
| Feature folder exists at `docs/features/38-workflow-status-sensor-script/` and holds this unit's artifacts (SPEC.md, decisions.md, progress.md, planning-findings.md); the authoring-time "slug is free" check (2026-08-30) predates the folder's creation and is retained only as history | directory check | `ls docs/features/38-workflow-status-sensor-script/` (re-verified 2026-09-09) | current main | current | proven | — |
| Design-owner resolution: namespaced `unavailable-<source>-<cause>` vocabulary | human decision | `ask_user` response 2026-09-09 — selected `namespaced` (self-describing, extensible, consistent with Product decision 4's example style) | v4.1.1 | current | proven | F7 resolved: the vocabulary is now a deterministic product decision in Product decisions
| The schema package declares no degradation-code vocabulary — `Envelope.detail` is `unknown` (schema-unconstrained, "documented per skill") | npm package | `packages/agentic-workflow-schema/src/index.ts` `Envelope.detail` (verified live 2026-09-09) | v4.1.1 | current | proven | grounds the original F7 routing; resolved via bounded question (namespaced) -- see Product decisions |
| Script-side flag semantics resolved: `--json-only` accepted no-op; `--last-envelope <json|path>` computed by the script (hint diff + no-progress guard → `detail.workflow_observations`); hint never overrides recomputed state; unreadable/malformed hint fail-open (`unavailable-hint-<cause>`, exit 0) | human decision | `ask_user` bounded questions q1–q4 (2026-09-09) | — | current | proven | — |
| The existing skill contract for the flags: `--json-only` skips the human summary; `--last-envelope <json|path>` is a crash-recovery hint (never authoritative) whose supply makes the no-progress guard mandatory, emitting a `workflow_observations` note; `detail` is schema-unconstrained so the note needs no schema-package change | skill reference + npm package | `skills/workflow-status/SKILL.md:7,40,62`, `references/CRASH_RECOVERY.md:22-33`, `references/ENVELOPE_FIELDS.md:3-9,56`, `packages/agentic-workflow-schema/src/index.ts:182` (verified 2026-09-09) | v3.2.1 / v4.1.1 | current | proven | — |
| `docs/CAPABILITIES.md` at this revision is the unfilled seeded template — placeholder `Exists` cells and a template-only roles row; the 13 integration-closure subsystems are the template's fixed floor set, each reconciled with project-specific reasons (not inventory facts) | repo file | `docs/CAPABILITIES.md:17-47` (re-verified live 2026-09-09) | current main | current | proven | seeding `docs/CAPABILITIES.md` proposed to the design owner — user confirmation pending (upsert-safe) |
| The repository provides no bare-specifier resolution for `scripts/` — no root package.json, no installed `@gtrabanco` in node_modules, `packages/agentic-workflow-schema/dist/` is a gitignored build output; the established mechanism (`scripts/schema-runtime.mjs`) loads the built local package by explicit path with a named fail-fast precondition and deliberately no published-package fallback | repo file + live checks | `scripts/schema-runtime.mjs:5-20,47-49`; live 2026-09-09: no root `package.json`, `ls node_modules/@gtrabanco` → empty, `git check-ignore packages/agentic-workflow-schema/dist` → ignored, `packages/agentic-workflow-schema/package.json:22` `"main": "./dist/index.js"` | current main | current | proven | grounds A:8/A:11 + Tooling + Product decision 2 (F23 repair) |
| Forge calls are bounded by a wall-clock timeout; a slow-but-alive forge degrades to `unavailable-forge-timeout` with exit 0 instead of hanging | design decision | Product decision 6 (vocabulary) + A:21 fixture (behavior to be produced at implementation) | — | current | decision | feature 38 implementation — verified by A:21 fixture test (F21 repair) |
| Under `node -e`, a dynamic-import specifier must carry the `./` prefix — a bare `scripts/...` specifier resolves as a package name and fails `ERR_MODULE_NOT_FOUND` independent of the dependency graph; the legacy `--experimental-specifier-resolution=node` flag neither fixes nor affects this | live control run | control on Node v24.19.0 (2026-09-09): bare `import('scripts/ctl.mjs')` → `ERR_MODULE_NOT_FOUND`; `./`-prefixed → exit 0; repo CLI convention: unknown flag → usage on stderr + non-zero exit (`scripts/ledger-provenance.mjs` → 2, `scripts/check-skill-context.mjs` → 1) | Node v24.19.0 | current | proven | grounds A:11's and A:20's check forms |

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
      rows. Entity closure: 4 CRUD rows + 1 state-transitions row;
      2 Capability rows (entry point + role matrix); 3 Role rows. Integration: 13 subsystems.
- [x] Integration closure has one row per subsystem listed in
      `docs/CAPABILITIES.md` (or, when the project has no inventory, per the
      derived inventory recorded in the section) — zero subsystems skipped.
      All 13 template subsystems are covered — 13 rows (8 with filled resolutions,
      5 with explicit `n/a:` reasons; every row also carries the template's
      `| n/a: <reason>` convention tail), zero blank, zero skipped.
- [x] Every capability's role matrix lists EVERY role in the capability
      inventory with an explicit `allowed`/`denied` — no role unlisted.
      3 roles: consumer-processes, weak-executor-models, human-operators — all `allowed`
      (provenance per F19: these are derived from the sensor's consumer set,
      not `docs/CAPABILITIES.md` rows — the inventory's Roles table is still
      the template row).
- [x] `### Expectation sweep` has ≥ 10 resolved rows (M/L) — **13 rows**.
      Every row's resolution is `in-scope` (11), `out-of-scope` (2), or `deferred` (0 —
      none; the sweep's two earlier `deferred` rows were in-scope work mislabelled,
      repaired to A:10) with a pointer. F17's repair re-pointed row 2 to A:20;
      this batch (F21/F22) re-pointed rows 3→A:22, 6→A:23, 10→A:21 — all three
      now resolve to criteria whose checks carry their claims.
- [x] Every `#### In scope` bullet maps to ≥ 1 Acceptance criterion (same wording or an explicit reference).
      In-scope items 1–13 map to A:1 through A:25 (item 10's flag pass-through →
      A:17–A:19; item 7's ENVELOPE_CORE.md slimming → A:24; item 13's release-policy →
      A:25) and the inline criterion comments; A:20 resolves
      expectation-sweep row 2's fatal-exit expectation, A:21 resolves sweep row 10
      (timed-out forge), A:22 resolves sweep row 3 (no prompts), A:23 resolves
      sweep row 6 (stdout/stderr) — sweep expectations, not in-scope bullets.
- [x] Every Acceptance criterion is a runnable command OR labelled
      `read-verified` — **25 runnable criteria (A:1–A:25) + 1 labelled
      `read-verified` criterion** (injection-safety preservation): A:1 (file exists),
      A:2 (fixture test), A:3 (mutation grep), A:4 (offline fixture), A:5 (diff),
      A:6 (fixture test), A:7 (grep), A:8 (grep), A:9 (diff check),
      A:10–A:11 (flag/import tests), A:12 (grep), A:13 (diff check),
      A:14 (budget re-base), A:15 (fixture test), A:16 (grep), A:17 (diff),
      A:18 (fixture test), A:19 (fixture test), A:20 (unknown-flag non-zero exit),
      A:21 (fixture: non-terminating `gh` shim → timeout degradation), A:22 (grep),
      A:23 (stdout-alone JSON parse + stderr fixture), A:24 (ENVELOPE_CORE.md
      slimmed: script-backed reference present + assembly self-check prose gone),
      A:25 (fix #209 release-policy line in CLAUDE.md: freeze-majors rule present).
- [x] `### Deferred decisions` exists; every row has a decide-by trigger, or
      the section reads `none`. One row with a decide-by trigger (row 2, --output — still deferred; row 1 resolved via bounded question)
      to the human design owner — repair batch 2026-09-09; row 2 post-merge trigger).

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

2026-09-10 scope amendment (fix #209 fold): A:25 added, 24→25 runnable criteria,
in-scope items 1–12→1–13, E-38-9 recorded; artifactRevisionId: 2bee477ba469
(first 12 hex of sha256(SPEC.md)).

---

## Engineering half

Written by `plan-feature` / `plan-feature-scaffold`, only once the Product half
above is marked `designed`.

### Technical goals

1. **One deterministic producer.** `scripts/workflow-status.mjs` executes the
   published SENSOR_CORE sequence (steps 1–9 incl. 6a) and emits Envelope v2
   assembled field-for-field from the schema package's own vocabulary — the
   envelope is validated (`validateEnvelope`) before it leaves the process.
2. **Interpret-only model surface.** After P3 the `workflow-status` skill runs
   the script, reads the JSON, interprets `next.recommended` per the published
   contract, and prints the human report — it no longer runs the ~10-command
   assembly sequence (the biggest recurring token saver in the system).
3. **Declared failure, never improvised.** Every environmental failure (no
   network, slow forge, missing git, bad hint) degrades to a namespaced
   `unavailable-<source>-<cause>` code with exit 0; only invalid invocation is
   fatal.
4. **Read-only by construction.** The tool performs no write action — the
   greps in A:3/A:7/A:22 are structural proofs, not prose promises.

### Architecture impact

Surfaces (layers per the repo's docs/config/infra split; no domain/api/ui layer
is touched):

- **NEW `scripts/workflow-status.mjs`** (config/infra). Consumes the schema
  vocabulary through the repo's established loader `scripts/schema-runtime.mjs`
  — built local package by explicit path, named fail-fast precondition, no
  published-package fallback (PE-001). No new dependency, no root
  `package.json`, no install (PE-001; Product decision 2).
- **`skills/workflow-status/SKILL.md`, `references/SENSOR_CORE.md`,
  `references/ENVELOPE_CORE.md`** (docs layer) slim to interpret-and-recommend
  (in-scope item 7). The other six reference files stay byte-identical (PE-015):
  CRASH_RECOVERY / ENVELOPE_FIELDS / GUARDRAILS / PRE_EXECUTION / PORTABILITY /
  SENSOR_SIGNALS own semantics the slimmed skill still applies. SENSOR_CORE.md
  keeps the `sensor-fields@1` grammar block — it is the normative-drift surface
  (`scripts/normative-drift.test.mjs:845`) and the field contract the script
  implements (PE-004, PE-007).
- **Discipline tests re-targeted, never weakened** (O26): the prose pins that
  lose their home when SENSOR_CORE.md slims (`bounded-delivery-loops.test.mjs`
  6a heading + SKILL.md routing pin, `workflow-status-pre-execution.test.mjs`
  step-8 rule source, `pre-execution-quality.test.mjs` label-override pin)
  move to script-behavior form — the mechanical rule's single home becomes the
  script itself (E-38-3; PE-007).
- **`docs/workflow/SKILL_CONTEXT_BUDGETS.json`** gains the slimmed sensor
  entry (currently unlisted — defaults apply; PE-008; A:14).
- **`docs/workflow/ORCHESTRATION.md` + `.es.md`** (docs layer): the driver
  contract names the script as the envelope's deterministic producer (A:16,
  O16/O25; PE-010).
- **Untouched by contract:** `packages/agentic-workflow-schema/` (A:13 — the
  envelope vocabulary is unchanged; `detail` is schema-unconstrained,
  `envelope.schema.json:184`, so every new `detail` shape needs no package
  change, PE-003); the six non-slimmed reference files; the schema package's
  `decideWorkflowAction()` stays consumer-side (A:12).
- **Distribution boundary:** the pi package's bundle copies skill trees only;
  root `scripts/` do not travel (PE-009). In-repo dogfooding is unaffected;
  the installed-release gap is tracked (known-issues → #198, E-38-7).

Invariants the implementation must hold: read-only (A:3), labels-only urgency
(A:7 + the read-verified criterion), no decision logic (A:12), envelope
vocabulary unchanged (A:13), no dependency (A:8/A:11), fail-open posture for
every environmental failure (A:4/A:19/A:21) with invalid invocation as the
only fatal class (A:20).

### Design

**Script shape.** Single ESM file `scripts/workflow-status.mjs`, Node ≥ 18,
`main()` entry, no bundler, no transpilation (Product decision 1). Imports
`loadSchemaRuntime` from `./schema-runtime.mjs` — the loader throws the named
"schema runtime is not built" precondition when `dist/` is missing (PE-001;
A:11's case (b)).

**Collection (SENSOR_CORE steps 1–9, PE-004).**
- Steps 1–2: `git branch --show-current` / `git status --porcelain` / `git
  fetch` + `git status -sb`; the three `gh` list commands verbatim from
  SENSOR_CORE step 2. Forge calls run under a bounded wall-clock timeout
  (implementation constant, suite-pinned) so a hanging forge yields
  `unavailable-forge-timeout` (A:21).
- Step 3: urgency is the labels-only scan of the step-2 open-issue list
  (`{number, title, label}`; `urgent` dominates when both labels present) plus
  the in-flight unit's interruptibility facts reusing the same reads — bodies
  and comments are never fetched (A:7).
- Steps 4–5: roadmap + fix-index parsing into the five-state machine; a
  non-standard status maps to the nearest five-state value with
  `default: idea` and notes the raw string in `workflow_observations` (A:6);
  transitive depends-on closure with met/unmet edges (a `done` row with an
  open PR is NOT met) and cycle/consistency substrate blockers.
- Steps 6–6a: readiness classification (`idea` → `design_candidates` deps-
  agnostic; `defined`/`planned` + deps met → `startable_now`; unmet deps →
  `blocked_units`) and receipt sensing by shelling out to the snapshot
  verifier (`node scripts/pre-execution-snapshot.mjs verify --stage <spec|plan>
  --unit <id> [--parent <64-hex> for plan-stage features]` — PE-005), mapping
  its structured verdict to the label table; the label overrides the
  status-only command (demotion into a `gate` blocker, `detail.pre_execution`
  row). Unresolvable revisions fail open → unflagged.
- Steps 7–9: phase progress from each in-flight `TASKS.md`; pending quality
  gates from the `review-findings.md` review-mark ancestry rule (mark sha is
  an ancestor of head and no later commit touched a bound input); fix-now
  fold-ledger projection with the fixed `suggested_tier` table (`high` →
  `strong`; axis ∈ {security, correctness, logic, architecture, design,
  concurrency} → `strong`; else `cheap`).

**Envelope assembly (PE-002/PE-003/PE-014).** One literal object in the
schema's field order → `validateEnvelope` self-check → print exactly one JSON
document to stdout. Mismatch → stderr diagnostic, envelope still printed, exit
0 (E-38-1: the self-check is a diagnostic, not a gate — A:20 restricts the
fatal class to invalid invocation; A:2's fixture suite owns correctness).
Determinism: the output path reads no clock, key order is a fixed literal,
arrays follow roadmap-table order / numeric forge sorting — byte-identical
consecutive runs (A:5; PE-012). The crash-recovery mapping and substrate
override are reproduced as published (PE-014); no new state.

**Failure contract (Product decisions 4/6/7).** Namespaced
`unavailable-<source>-<cause>` codes in `detail`: forge (no-network, timeout,
auth, missing-cli), git (missing), hint (missing/unreadable/invalid). Missing
`gh` binary or missing git degrade with exit 0. `--json-only` is an accepted
no-op (argv parity, A:17). `--last-envelope <json|path>` is computed: load the
hint (inline JSON or file path), diff against the recomputed envelope, run the
no-progress guard with the exact note shape from ENVELOPE_FIELDS.md, append
divergence + note to `detail.workflow_observations`; the hint never mutates
`state`/`next` (A:18). An unreadable/malformed hint degrades fail-open:
`unavailable-hint-<cause>` note, exit 0, recomputed envelope unaffected
(A:19). `--help` prints usage (exit 0); `--version` prints the schema
package's version read from `packages/agentic-workflow-schema/package.json`
(E-38-4 — no root `package.json` exists; the vocabulary source is the version
the script emits from). An unknown flag is the only fatal class: usage
diagnostic on stderr + non-zero exit (value fixed at implementation per the
repo convention 1–2, suite-pinned — A:20; PE-006).

**Slimming (P3, PE-015/PE-016/PE-017).** SKILL.md slims to: run `node
scripts/workflow-status.mjs [--json-only] [--last-envelope <json|path>]`,
read the JSON, interpret `next.recommended` (tier map, suggested triggers) and
the degradation codes per the published contract, print the human summary then
the envelope last; the turn-contract boxes stay (read-only, envelope on every
invocation, the no-progress guard ran — by the script when the flag is
supplied). SENSOR_CORE.md slims the numbered-command prose to the script call
and keeps the `sensor-fields@1` grammar block; ENVELOPE_CORE.md slims the
assembly prose and keeps the state mapping + tier map the skill interprets.
The human report layout is a non-goal (§8) — unchanged. Skill bumps 3.2.1 →
3.3.0 via the bump-skill contract (E-38-2: process rewording, external argv +
envelope contract unchanged → minor).

### Planning evidence

see planning-evidence.md

### Obligations

see planning-obligations.md

### Decisions to confirm

All engineering decisions are resolved here and recorded in `decisions.md`
(2026-09-09 planning batch, `38-plan-1`); none is left for the implementer:

- **E-38-1** envelope self-validation is a stderr diagnostic, never a gate
  (exit 0); correctness is A:2's fixture suite's job.
- **E-38-2** skill bump level is **minor** (3.2.1 → 3.3.0): process rewording,
  external argv + envelope contract unchanged (PE-016/PE-017); compliant with
  fix #209's freeze-majors policy (minor, not major — breaking intent would
  carry a `BREAKING CHANGE:` footer while #176 is open).
- **E-38-9** fix #209's release-policy fold into 38's scope — operator-approved
  amendment 2026-09-10; `CLAUDE.md` line implemented pre-execution (A:25).
  artifactRevisionId rotated (see Design status).
- **E-38-3** discipline pins re-target from prose-presence to script-behavior
  assertions — every pin keeps its asserted behavior and gains the stronger
  form; the mechanical rules' single home becomes the script (never weakened,
  O26).
- **E-38-4** `--version` prints the schema package's version (no root
  `package.json`; PE-008's manifest facts, PE-001).
- **E-38-5** the forge timeout and the unknown-flag exit code are
  implementation constants pinned red-first by the suite (repo convention:
  non-zero, stderr usage — PE-006).
- **E-38-6** fix #179 overlap declared disjoint and sequenced (its dependency
  gate holds until features 31/32 merge; its sensor-side amendment then moves
  script + PRE_EXECUTION.md together — PE-011).
- **E-38-7** the scripts/ distribution gap (pi bundle carries skill trees only,
  PE-009) is a recorded boundary tracked in known-issues.md → #198; not
  blocking for the repo's dogfooding model.
- **E-38-8** step 6a receipt sensing invokes the snapshot verifier as a
  subprocess (`--stage`, `--unit`, `--parent` for plan-stage features; PE-005)
  and maps its structured verdict through the label table; unresolvable
  revisions fail open → unflagged.
- **E-38-9** fix #209's release policy fold into 38's scope — operator-approved
  amendment 2026-09-10. `CLAUDE.md` versioning guidance gains the freeze-majors
  rule (A:25 / AC-24). The feature's bump is minor (3.2.1 → 3.3.0), fully
  compliant; any future breaking change on this branch would carry a `BREAKING
  CHANGE:` commit footer while #176 is open.

### Testing requirements

- **New suite `scripts/workflow-status-sensor.test.mjs`** (P1/P2, red-first,
  written inside the phase that implements the behavior): git-init fixture repo
  per the established harness pattern (`workflow-status-pre-execution.test.mjs`
  builds fixture repos with `git init` + scripted commits); network control by
  a `gh` shim on PATH (missing, failing-fast, non-terminating variants);
  hints as inline JSON and file paths. Pins: schema validity + field presence
  (A-02), read-only greps (A-03/A-07/A-22), idempotence (A-05), ambiguous-row
  mapping (A-06), loader import form (A-08), offline/timeout/missing-git
  degradation (A-04/A-15/A-21), flags (A-10/A-17/A-20), hint guard + fail-open
  (A-18/A-19), stream separation (A-23).
- **Discipline suites re-targeted in P3, never weakened** (O26):
  `bounded-delivery-loops.test.mjs`, `pre-execution-quality.test.mjs`,
  `workflow-status-pre-execution.test.mjs`, `normative-drift.test.mjs` —
  every existing pin keeps its asserted behavior; prose pins that lose their
  home gain the script-behavior form. `PRE_EXECUTION.md` pins keep passing
  unchanged (file not slimmed).
- **Untouched-surface regressions (P4):** schema package suite green + empty
  `git diff --name-only main...HEAD -- packages/agentic-workflow-schema`
  (A-13); pi bundle parity after `bundle:skills`; ledger + audit-pr receipt
  suites; `check-skill-context.mjs` with the re-based budget (A-14).
- **Runtime:** Node ≥ 18 (loader + existing `scripts/*.mjs` convention);
  validators use the repo's root-suite convention (`node --test`, `node
  scripts/<tool>.mjs`) as in feature 30's frozen manifest.

### Dev scenarios

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| `sensor:empty-state` | empty/zero state — no roadmap rows, no PRs, no in-flight units | fixture repo with an empty roadmap + no forge output; envelope prints the empty shapes (`design_candidates: []`, `fix_now: []`), exit 0 (A-02 fixture) |
| `sensor:invalid-input` | invalid/oversized input — unknown flag; malformed or missing hint | `--not-a-real-flag` → non-zero + stderr usage (A-20); missing path / invalid JSON hint → `unavailable-hint-<cause>` note, exit 0 (A-19) |
| `sensor:envelope-mismatch` | forced invalid envelope — assembly output fails `validateEnvelope` | a stub schema build whose `validateEnvelope` always fails is swapped in via the explicit-path loader (PE-001; `dist/` is a gitignored build output) → stderr diagnostic, envelope still printed, exit 0 (E-38-1; P1 mismatch pin — F27 repair) |
| `sensor:dependency-outage` | dependency outage + timeout — network severed; forge accepts and never answers | `gh` shim failing fast → fail-fast degradation codes, exit 0 (A-04); non-terminating `gh` shim → `unavailable-forge-timeout` within the bound (A-21) |
| `sensor:concurrent-action` | concurrent/duplicate action — two simultaneous sensor runs | run twice in parallel on the same tree: both exit 0, outputs byte-identical, no locks or shared state (A-05 fixture run concurrently) |
| `sensor:limit-threshold` | limit/threshold hit — caps in the projections | fixture with > 5 open issues → `untriaged_issues.oldest_open` capped at 5; merged-PR list capped at 20 (ENVELOPE_FIELDS/SENSOR_CORE caps) |
| `sensor:permission-denied` | n/a: the sensor is a read-only CLI with no auth, role, or permission surface — a permission-denied state cannot arise (Capability closure: Authentication/ACL rows n/a) | — |
| `sensor:data-loss` | n/a: the script writes no file and deletes nothing (stdout-only output, non-goal §5; Delete row of entity closure) | — |

### Phases

Four phases (under the ~5 split threshold; every phase is one layer, zero open
decisions, locally verifiable). Detailed checklists in `TASKS.md`; the frozen
finish line is `ACCEPTANCE.md`.

#### P1 — Sensor script core emission

Layer: config/infra · Done-when: `node --test
scripts/workflow-status-sensor.test.mjs` → exit 0 with the schema-validity,
field-presence, read-only, idempotence, roadmap-mapping, labels-only,
flag-contract (A-17/A-20), and envelope-mismatch (E-38-1) pins green on the
git fixture repo, and the existing root suites still exit 0.

`scripts/workflow-status.mjs` exists and executes SENSOR_CORE steps 1–9 into
one schema-valid Envelope v2 on stdout (collection + assembly + the closed
flag contract — `--json-only` accepted no-op, unknown-flag fatal class — +
the validateEnvelope mismatch diagnostic path + read-only greps +
idempotence). Phase-lint: PASS (8/8) · fingerprint
`P1:config/infra:8:sensor-script-core-emission`

#### P2 — Sensor script failure contract

Layer: config/infra · Done-when: `node --test
scripts/workflow-status-sensor.test.mjs` → exit 0 with the offline,
forge-timeout, missing-git, hint-guard, hint-fail-open, `--help`/`--version`,
and stream-separation pins green and every P1 pin unchanged.

The script's declared-failure surface: namespaced degradation codes, bounded
forge latency, `--help`/`--version` (usage/version output), `--last-envelope`
hint diff + no-progress guard, fail-open hints, stdout/stderr separation —
the `--json-only` no-op and the invalid-invocation fatal class ship in P1
(F25 repair: behavior and pin in the same phase). Phase-lint: PASS (8/8) ·
fingerprint `P2:config/infra:8:sensor-script-failure-contract`

#### P3 — Workflow-status skill slimming

Layer: docs · Done-when: `node scripts/check-skill-context.mjs` → exit 0 with
the re-based `workflow-status` entry, and `node --test
scripts/bounded-delivery-loops.test.mjs scripts/pre-execution-quality.test.mjs
scripts/workflow-status-pre-execution.test.mjs scripts/normative-drift.test.mjs`
→ exit 0 with the re-targeted pins.

The slimmed interpret-and-recommend skill (SKILL.md + SENSOR_CORE.md +
ENVELOPE_CORE.md), re-targeted discipline pins, re-based budgets, version bump
3.2.1 → 3.3.0. Phase-lint: PASS (8/8) · fingerprint
`P3:docs:7:workflow-status-skill-slimming`

#### P4 — Qualify the sensor unit

Layer: hardening · Done-when: every frozen validator in `ACCEPTANCE.md`
passes, `git diff --name-only main...HEAD -- packages/agentic-workflow-schema`
→ empty, and the PR is open with `Closes #185` (PR URL printed in the chat).

Driver wiring (EN + ES), MIGRATION note, pi bundle parity, full frozen
validation ladder, read-verified injection-safety pass, truthful planning-doc
close-out, PR open + roadmap flip. Phase-lint: PASS (8/8) · fingerprint
`P4:hardening:9:qualify-sensor-unit`

### Deploy & rollback

n/a — merging is enough: the script is a repo tool, the skill bump is a docs
change, and no data, config, or service state exists. Rollback = revert the
PR (the skill's pre-slimming prose is recoverable from git history).

### Open questions / risks

- **RESOLVED — fix #179 overlap:** sequenced, disjoint (E-38-6, PE-011).
- **RESOLVED — scripts/ distribution gap:** recorded boundary → #198
  (E-38-7, PE-009); tracked in known-issues.md.
- **Risk — pin re-targeting breadth:** four root suites pin sensor prose;
  re-targeting must keep every untouched pin green. Mitigated by O26's
  validator (all four suites exit 0) and by slimming only the pinned surface
  the SPEC names (PE-015).
- **Risk — envelope drift between script and skill prose:** if the skill's
  interpretation prose and the script's output diverge, consumers break.
  Mitigated by the script being the single producer (A-02 validates against
  the schema package directly) and `normative-drift` keeping the grammar
  block bound (PE-007).

### Deliverables

- `scripts/workflow-status.mjs` — the deterministic sensor (new).
- `scripts/workflow-status-sensor.test.mjs` — the fixture-repo suite (new).
- `skills/workflow-status/SKILL.md`, `references/SENSOR_CORE.md`,
  `references/ENVELOPE_CORE.md` — slimmed (interpret-and-recommend).
- `scripts/bounded-delivery-loops.test.mjs`, `scripts/pre-execution-quality.test.mjs`,
  `scripts/workflow-status-pre-execution.test.mjs` — re-targeted pins.
- `docs/workflow/SKILL_CONTEXT_BUDGETS.json` — re-based sensor entry.
- `CLAUDE.md` — fix #209's release-policy line (pre-executed in the fold batch);
  `docs/workflow/ORCHESTRATION.md` + `.es.md` — driver wiring; `docs/workflow/MIGRATION.md`
  — additive note; `CHANGELOG.md` — 3.2.1 → 3.3.0 row.
- `packages/pi-agentic-workflow` — bundle re-synced (metadata per its own
  contract); `packages/agentic-workflow-schema/` — byte-untouched.

### Post-merge next feature

Per `docs/features/ROADMAP.md`: feature 31 (`planning-review-materiality`,
`idea`) becomes the next designable unit on the #171 issue; features 30–33
chain around it. The script this feature ships is also the sensor the
`workflow-status` route of every later unit consumes.