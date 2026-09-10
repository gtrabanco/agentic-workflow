# 37 — phase-lint-script

> Feature specification. This is the **feature doc** read at the start
> of the workflow (`CLAUDE.md` → Feature workflow). Fill every section.
> Detailed phase tasks live in `PLAN.md` / `TASKS.md`, generated in
> planning mode from this spec.
>
> **One SPEC, two halves.** `design-feature` writes the **Product half**
> (product definition, capability closure, acceptance criteria) and stamps
> `## Design status`. `plan-feature` refuses to plan a feature not marked
> `designed`, then writes the **Engineering half** (architecture, design,
> phases, testing). Never split this into a separate design document —
> one file, two owners, no drift.

## Goal

Deliver `scripts/phase-lint.mjs`, a deterministic, offline linter that checks
implementation plans against the **eight phase-lint rules** and computes the
**normalized phase fingerprint**, replacing model reasoning on every plan with
a single command whose output can be pasted directly. This removes judgment
work from three skill routes (`plan-feature-scaffold`, `plan-fix`,
`execute-phase`), saving tokens on every planned feature/fix and shrinking the
token-budget-slimming routes (#176) that are always executed last.

## Branch

`feat/37-phase-lint-script`

## Size

`S/M` — estimated in planning, drives how much ceremony follows.
**XS/S** (≤ one commit / ≤ half a day): this SPEC plus compact frozen
`ACCEPTANCE.md` are the planning artifacts — implement with
`execute-phase <NN>`. **M/L** (phased work): the
full artifact set (`PLAN.md`, `TASKS.md`, …) is generated and execution goes phase
by phase. **Split — mandatory, not advisory**: an M/L feature MUST be split into
`Depends on:`-chained features if the plan would exceed ~5 phases, OR a single
phase would touch more than one layer/concern, OR a phase would require a design
decision not resolved in this SPEC. More, smaller, slower features is the
accepted trade — a phase a weak executor cannot complete without judgement is not
well-cut.

## Dependencies

- **Hard:** none — `skills/phase-contract/SKILL.md` (the rule owner) already
  exists on `main`.
- **Soft:** none blocking; downstream features 40 (`versioned-skills-releases`)
  and 42 (`deterministic-review-change`) depend on **this** feature, not vice versa.

---

## Product half

Written by `design-feature`. Not complete until `## Design status` below reads
`designed` — `plan-feature` refuses to plan this feature until then.

### Context

`plan-feature-scaffold`, `plan-fix` and `execute-phase` currently check plans
against the eight phase-lint rules by **model reasoning** (reading
`skills/phase-contract/SKILL.md` and judging each phase). This is repeated on
every planned feature and every phase execution, and is a known large recurring
token cost — issue #184 (traced to budget-slimming issue #176). What is missing
is a deterministic script that produces the identical `Phase-lint: PASS (8/8)` /
`Phase-lint: BLOCKED — box <n>: …` result with zero judgment, so the three
routes shrink to run-and-paste. `phase-contract` stays the single owner of the
rules; this feature only mechanizes checking them.

### Business goals

- **Biggest Phase-1 token saver** (per `docs/features/ROADMAP_EXECUTION_ORDER.md`):
  a deterministic linter replaces model reasoning on every plan.
- **Consistency:** the same plan always produces the same verdict — two
  executions with the same command cannot disagree.
- **Serves #176** (token-slimming of three always-executed routes).

### Scope

#### In scope

- `scripts/phase-lint.mjs`: deterministic linter that checks implementation
  phases against the eight phase-lint rules owned by `skills/phase-contract/SKILL.md`
  and computes the normalized phase fingerprint (parses the plan's fixed grammar;
  an ambiguous layer → `BLOCKED`, fail-closed). → AC1, AC2, AC5
- Fail-closed edge handling: any input the linter cannot judge — missing plan
  file, a plan with no phases, or grammar it cannot parse — resolves to
  `BLOCKED` with a distinct reason code and a non-zero exit (`missing-plan`,
  `no-phases`, `unparseable`); `PASS` is emitted only when all eight rules check
  clean on a fully parsed plan; never guess, never partially judge. → AC3
- Output contract: stdout is one fixed, human-pasteable text block — one line
  per failing rule (`<rule-id>: <finding>`), then the final `PASS` or
  `BLOCKED: <reason-code>` verdict, then a `fingerprint: <sha256>` line;
  exit codes `0` (PASS) / `1` (BLOCKED); **no `--json` mode in v1**. → AC1, AC2
- Input scope: exactly one file path argument — lints any explicitly passed
  Markdown plan (`PLAN.md`, `TASKS.md`, or SPEC files); no plan lookup/guessing
  when no argument is passed; no per-plan phase-count limit; no file-size cap —
  the file is read whole and any read/parse failure is `BLOCKED: unparseable`.
  → AC3
- Success criterion: running with a single command (`bun scripts/phase-lint.mjs
  <plan.md>`, fallback `node`) produces an unambiguous PASS/BLOCKED over a
  corpus of test plans (valid, invalid, ambiguous), with no network calls and
  no manual steps. → AC5
- Consumer integration: `plan-feature-scaffold`/`plan-fix`/`execute-phase`
  pre-flight slims to run-and-paste (invoke the script, paste its output). → AC8
- Vehicle rule (declined 43): mechanics of the first-producer-creates-the-crate
  redistribution — see Product decisions and Deferred decisions. → AC9 (n/a
  pending planning)

#### Out of scope / non-goals

- Does not rewrite, correct or fix the plan — read-only reporting only
  (no feature owns plan auto-correction; deliberately excluded).
- Does not change rules or thresholds — `skills/phase-contract/SKILL.md` is the
  sole owner of the eight rules; the linter implements them verbatim.
- Does not replace the full pre-execution gate (snapshots, receipts) — owned by
  `pre-execution-review` and `execute-phase`; this is only the deterministic
  lint portion.
- No auto-correction, no AI, no network calls, no external dependencies.
- No `--json` output mode in v1 — machine consumption comes via the producer
  family (roadmap rows 38/42).

### Capability closure

**1. Entity closure**

For EACH entity this feature introduces or touches:

- **Entity: phase-lint result (ephemeral, per run)**
  - [x] Create — UI entry point: n/a (no UI) · API: CLI `bun scripts/phase-lint.mjs <plan.md>`
        (fallback `node scripts/phase-lint.mjs <plan.md>`) · test: `scripts/phase-lint.test.mjs`
  - [x] Read/list — UI: n/a (no UI) · API: CLI stdout fixed text block + exit code · test: `scripts/phase-lint.test.mjs`
  - [x] Update — n/a: read-only tool, never modifies the plan or any file
  - [x] Delete — n/a: read-only tool, writes nothing
  - [x] State transitions — n/a: the PASS/BLOCKED verdict is ephemeral per-run
        output, not persisted state

- **Entity: plan files (`PLAN.md`, `TASKS.md`, SPEC — inputs)**
  - [x] Create — n/a: created by planning skills, not by this feature
  - [x] Read/list — UI: n/a (no UI) · API: read via the CLI's single path argument · test: `scripts/phase-lint.test.mjs`
  - [x] Update — n/a: read-only tool, never modifies the plan
  - [x] Delete — n/a: read-only tool, writes nothing
  - [x] State transitions — n/a: plans are static inputs to the linter

For EACH capability (action a user can take):

- **Capability: run the phase-lint on a plan file**
  - [x] Visible entry point: command line — `bun scripts/phase-lint.mjs <plan.md>`
        (fallback `node`), invoked by humans and by the three consumer skills' pre-flights
  - [x] Role matrix — the capability inventory (`docs/CAPABILITIES.md`) declares
        zero real roles (repo-level CLI tooling, no authentication/authz) →
        `n/a: no roles declared in the capability inventory; unauthenticated CLI tool`

For EACH role / permission this feature introduces:
- [x] n/a: the feature introduces no roles or permissions

**2. Integration closure**

`docs/CAPABILITIES.md` contains only template placeholders — no maintained
inventory exists for this project. Derived inventory from the repo structure
(skills, scripts, packages, template, docs, CI), walked below; offer to seed
`docs/CAPABILITIES.md` from this derived inventory (upsert-safe, user confirms).

For EACH subsystem in the derived inventory:

- [x] Skills content (`skills/*`) — consumers: `plan-feature-scaffold` and
      `plan-fix` lint every emitted phase via the script; `execute-phase`'s
      pre-flight runs it before editing; `skills/phase-contract/SKILL.md` stays
      sole rule owner (script points to it, never carries its own copy) ·
      test: skill-context + parity suites, corpus test
- [x] Scripts (`scripts/`) — new `scripts/phase-lint.mjs` + `scripts/phase-lint.test.mjs`;
      bun-first runtime with node fallback, `#!/usr/bin/env node` shebang ·
      test: `node --test scripts/phase-lint.test.mjs`
- [x] Packages (`packages/`) — no change to `agentic-workflow-schema` (no new
      vocabulary); `packages/pi-agentic-workflow` skills mirror re-bundled via
      `npm run bundle:skills` because 3 SKILL.md files change · test: skill-parity suite
- [x] Templates (`template/`) — no change: `phase-contract` stays the rule owner
      and template files point at it · test: n/a (no template edit)
- [x] Docs (`docs/`) — roadmap row 37 status transition `idea → defined` (this SPEC's
      write); SPEC registered in `docs/features/37-phase-lint-script/` · test: roadmap row check
- [x] CI / checks — skills CLI discovery and context budgets must pass after the
      skill edits (`bun scripts/check-skill-context.mjs --routes`;
      `npx skills add . --list`) · test: those commands
- [x] Roadmap / ledgers — roadmap row 37 status written by this skill to `defined`;
      ledger files created by `plan-feature-scaffold` at scaffold time · test: roadmap row check

**3. Role matrix**

- [x] n/a: the capability inventory declares no real roles (template placeholders
      only); this repo is a CLI/doc tooling repo with no authentication, no user
      roles, and no permissions — every role row resolves to `n/a: no roles declared`

### Expectation sweep

| # | Expectation | Resolution | Pointer |
|---|---|---|---|
| 1 | Deterministic: same input produces the same output, every run | in-scope | AC4 |
| 2 | Fails closed on ambiguous grammar (never guesses, never partially judges) | in-scope | AC2, AC3 |
| 3 | Reports all failing rules found in the plan, not silently stopping at the first | in-scope | AC1, AC2 |
| 4 | Works offline — no network calls | in-scope | AC6 |
| 5 | Exit codes usable in shell scripts and CI (0 = PASS, 1 = BLOCKED) | in-scope | AC1, AC2, AC3 |
| 6 | Runs with bun, falls back to node (runtime convention) | in-scope | AC7 |
| 7 | Auto-detects/guesses the active plan when no argument is passed | out-of-scope | Out of scope: no plan lookup/guessing (In scope bullet 4) |
| 8 | Auto-fixes or rewrites the plan | out-of-scope | Out of scope: no plan auto-correction (In scope bullet 1) |
| 9 | Machine-readable JSON output mode | deferred | Deferred decisions row 2 |
| 10 | Rule definitions carried inside the script | out-of-scope | Out of scope: phase-contract is sole rule owner (In scope bullet 1, Out of scope bullet 2) |
| 11 | Lints plans in any language | out-of-scope | Out of scope: English-only v1 (In scope bullet 4) |

### Acceptance criteria

- **AC1** (command): `bun scripts/phase-lint.mjs <corpus-valid-plan.md>` → exit 0;
  stdout is one fixed text block containing `Phase-lint: PASS (8/8)` per phase
  and a fingerprint line; final verdict line `PASS`.
- **AC2** (command): `bun scripts/phase-lint.mjs <corpus-invalid-plan.md>` → exit 1;
  stdout reports each failing rule (`<rule-id>: <finding>`), the phase's fixed
  `Phase-lint: BLOCKED — box <n>: <reason>` line, and the final `BLOCKED: <reason-code>` verdict.
- **AC3** (command): `bun scripts/phase-lint.mjs` with no argument → exit 1 + `BLOCKED: missing-plan`;
  a plan with no phases → exit 1 + `BLOCKED: no-phases`; a file that cannot be read/parsed
  → exit 1 + `BLOCKED: unparseable`.
- **AC4** (command): two consecutive runs on the same input produce byte-identical stdout
  (`diff <(cmd) <(cmd)` → empty) — determinism.
- **AC5** (command): `node --test scripts/phase-lint.test.mjs` → exit 0; the corpus of
  test plans (valid, invalid, ambiguous) each maps to its expected verdict and reason code.
- **AC6** (command): `grep -nE "fetch\(|require\(['\"](http|https)" scripts/phase-lint.mjs` → empty (no network calls).
- **AC7** (command): `node scripts/phase-lint.mjs <corpus-valid-plan.md>` → exit 0 (node fallback parity).
- **AC8** (command): the three consumer skills reference the script —
  `grep -n "phase-lint.mjs" skills/plan-feature-scaffold/SKILL.md skills/plan-fix/SKILL.md skills/execute-phase/` → matches in all three;
  `skills/phase-contract/SKILL.md` unchanged (sole rule owner); context budgets and
  skills CLI discovery pass (`bun scripts/check-skill-context.mjs`; `npx skills add . --list`);
  `npm run bundle:skills` re-run (mirror parity).
- **AC9** (command): `git diff --name-only main...HEAD -- packages/agentic-workflow-schema` → empty
  (no schema vocabulary change required).
- **AC10** (command): vehicle-rule artifacts present — `test -d packages/agentic-workflow` &&
  `test -f packages/agentic-workflow/package.json` && `test -d .agentic-workflow/tmp`
  (exact crate layout decided at planning; read-verified against the roadmap's
  vehicle rule).

### Tooling

- `phase-contract` (internal skill) — sole owner of the eight rules; consumed,
  never duplicated.
- `evidence-grounding` (internal skill) — owns the ordered passes and the
  readiness preflight consumed here.
- Repository verification gate: `bun scripts/check-skill-context.mjs` (context
  budgets), `npx skills add . --list` (CLI discovery), node/bun test runner.
- No MCPs relevant to this feature; no external dependencies.

### Product decisions

| ID | Decision | Rationale |
|---|---|---|
| PD1 | Fail-closed edge handling: every unresolvable input (`missing-plan`, `no-phases`, `unparseable`) → `BLOCKED` + non-zero exit; `PASS` only on a fully parsed clean plan | Confirmed in interview (Q1) — a deterministic linter consumed by three skills' pre-flights must never guess or partially judge; consistent fail-closed policy everywhere |
| PD2 | Output: one fixed human-pasteable stdout text block, exit 0/1, **no `--json` mode in v1** | Confirmed in interview (Q2) — the paste into a plan/gate trace is already the artifact phase-contract defines; machine consumption comes via the producer family (rows 38/42) |
| PD3 | Input: exactly one explicit file path argument; no auto-discovery; **no file-size cap** (read whole file; read/parse failures → `BLOCKED: unparseable`); English-only v1 | Confirmed in interview (Q3, with amendment) — auto-detection reintroduces the judgment this feature removes; the 1 MB cap was dropped as near-dead code with no realistic test coverage |
| PD4 | Success criterion: unambiguous PASS/BLOCKED over a corpus of test plans (valid, invalid, ambiguous), no network, no manual steps | Confirmed in interview (Q4) |
| PD5 | Vehicle rule applies as recorded in the roadmap (declined 43): the first producer feature creates the `packages/agentic-workflow` crate + `.agentic-workflow/tmp` convention if absent | Owner decision recorded on the roadmap and issue #196; mechanics (crate layout, script placement) are Engineering-half work — see Deferred decisions |

### Deferred decisions

| Decision | Why deferred | Decide by (trigger or phase) |
|---|---|---|
| Vehicle-rule mechanics: crate layout; whether `scripts/phase-lint.mjs` stays at `scripts/` or is re-homed as the crate's first producer | Structural/engineering detail; the policy (create the crate) is already fixed, the mechanics need the Engineering half | `plan-feature` / `plan-feature-scaffold` scaffold time |
| `--json` / machine-readable output mode | No consumer in v1; the producer family (rows 38/42) may add machine surfaces when the `workflow-status` sensor script is built | Feature 38 scaffold time |

### Spec-lint (mechanical — presence checks only)

Product boxes:

- [x] No template placeholders left in the product half — the fenced
      Capability-closure template blocks are replaced by the instantiated rows above.
- [x] `#### Out of scope / non-goals` has ≥ 1 concrete bullet (7 bullets).
- [x] Every Capability closure row is filled or `n/a: <reason>` — zero blank rows.
- [x] Integration closure has one row per subsystem of the derived inventory
      (recorded in the section — `docs/CAPABILITIES.md` has no maintained inventory) —
      zero subsystems skipped.
- [x] Every capability's role matrix lists EVERY role in the capability inventory —
      the derived inventory declares zero roles; explicit `n/a` recorded.
- [x] `### Expectation sweep` has 11 resolved rows (≥ 10 for S/M); every row's
      resolution is `in-scope`, `out-of-scope`, or `deferred` with a pointer.
- [x] Every `#### In scope` bullet maps to ≥ 1 Acceptance criterion (see mapping above).
- [x] Every Acceptance criterion is a runnable command OR labelled `read-verified`.
- [x] `### Deferred decisions` exists; every row has a decide-by trigger.

## Design status

`designed` — capability closure complete: every closure row filled or explicitly
`n/a`, Spec-lint product boxes all ticked. Readiness preflight (stage: spec)
returned `READY-FOR-REVIEW`.

### Evidence

| id | claim-or-obligation | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|
| E1 | The eight phase-lint rules, the fixed PASS/BLOCKED result, and the normalized phase fingerprint format are owned by `phase-contract` v1.0.1 | repo-skill | `skills/phase-contract/SKILL.md` | version 1.0.1 | current | proven | — |
| E2 | Fingerprint format is `P<n>:<layer>:<n-tasks>:<title-deliverable>`; phase layer enum is `schema/db \| domain \| api \| ui \| config/infra \| docs \| hardening \| close-out` | repo-skill | `skills/phase-contract/SKILL.md` | version 1.0.1 | current | proven | — |
| E3 | `plan-feature-scaffold` and `plan-fix` lint every phase they emit; `execute-phase` re-checks the same rules as a pre-flight guard — the three consumer routes | repo-skills | `skills/phase-contract/SKILL.md` §When to use; `skills/plan-feature-scaffold/SKILL.md` | current | current | proven | — |
| E4 | Roadmap row 37: `phase-lint-script`, status `idea`, size S/M, traced to issue #184, serves #176; no folder existed before this write | roadmap | `docs/features/ROADMAP.md` row 37 | git `8bab5c90` | current | proven | — |
| E5 | Runtime convention: bun first (`bun scripts/x.mjs`), node fallback, shebangs stay `#!/usr/bin/env node` | project-convention | `CLAUDE.md` §Verification | current | current | proven | — |
| E6 | Skill edits require `npm run bundle:skills` (pi package mirror parity, `test/skill-parity.test.mjs`) and context budgets (`bun scripts/check-skill-context.mjs`) | project-convention | `CLAUDE.md` §Verification | current | current | proven | — |
| E7 | Deterministic static analysis: same input → same output, explainable/reproducible diagnostics | external-fetch | https://vizejs.dev/blog/notes/2026-03-26-why-ai-needs-deterministic-fast-static-analysis/ (accessed 2026-09-09) | current | current | proven | — |
| E8 | Linter practice: rulesets of built-in rules, fail-closed validation with explicit errors, custom rules on top of a validation engine | external-fetch | https://www.speakeasy.com/docs/sdks/prep-openapi/linting/ (accessed 2026-09-09) | current | current | proven | — |
| E9 | Vehicle rule: first producer feature (37/38/42/45) creates the `packages/agentic-workflow` crate + `.agentic-workflow/tmp` convention | owner-decision (roadmap) | `docs/features/ROADMAP.md` row 43 (declined) and rows 37/38/42 | git `8bab5c90` | current | decision | — |
| E10 | Feature 37 is Phase 1 priority (biggest token saver); it precedes 38, 40, 42 | roadmap | `docs/features/ROADMAP_EXECUTION_ORDER.md`; `docs/features/ROADMAP.md` rows 37/38/40/42 | git `8bab5c90` | current | proven | — |

---

## Engineering half

Written by `plan-feature` / `plan-feature-scaffold`, only once the Product
half above is marked `designed`. Engineering artifact revision: `37-plan-2`.

### Technical goals

- Replace model-reasoning phase linting in `plan-feature-scaffold`, `plan-fix`,
  and `execute-phase` with a single deterministic command
  (`bun scripts/phase-lint.mjs <plan.md>`, node fallback) whose output can be
  pasted verbatim into a plan/gate trace.
- Produce, in the same run, the normalized phase fingerprint
  (`P<n>:<layer>:<n-tasks>:<title-deliverable>` per phase and a whole-plan
  sha256 line) so later re-lints and `execute-phase` can confirm phase shape
  has not drifted.
- Keep `skills/phase-contract/SKILL.md` the sole owner of the eight rules:
  the linter implements the checking; the prose owner is never duplicated.

### Architecture impact

- Affected surfaces: `scripts/phase-lint.mjs` (new), `scripts/phase-lint.test.mjs`
  (new), `skills/plan-feature-scaffold/SKILL.md`, `skills/plan-fix/SKILL.md`,
  `skills/execute-phase/SKILL.md` (+ its preflight reference), and the pi package
  mirror (`packages/pi-agentic-workflow`, re-bundled via `npm run bundle:skills`).
- Invariant held: one writer per phase-lint rule set — `phase-contract` is not
  edited and the script points to it rather than restating rule semantics
  (roadmap row 32 will separately audit this relationship; nothing here
  pre-empts it).
- Invariant held: read-only reporting — the linter never writes or rewrites a
  plan; fixing a BLOCKED plan stays with the authoring skill.
- Invariant held: no schema-package vocabulary change (AC9) — PASS/BLOCKED
  verdicts, reason codes, and the fingerprint format are already defined by
  `phase-contract`; the linter is a consumer-side mechanization.
- Vehicle rule (roadmap rows 37/38/42/45, declined 43): this is the first
  producer feature implemented, so it creates the `packages/agentic-workflow`
  crate and the `.agentic-workflow/tmp` scratch convention. The linter itself
  stays at `scripts/phase-lint.mjs` (see Decisions to confirm); downstream
  producers (38, 42) land their producers as subcommands of the crate.
- No runtime/provider dependency, no network, no AI, no new external dependency.

### Design

**Input grammar** (frozen here so the implementer never guesses):

- A *phase heading* is a Markdown heading of level 2–4 whose text matches
  `^P(\d+)\s*[—-]\s*(.+)$`. The title-deliverable is the text after the
  separator.
- The *body* of a phase runs from its heading to the next phase heading (or
  end of file). Within a body:
  - the *layer declaration* is the first line matching
    `Layer:\s*<value>` where `<value>` is one of the closed enum
    `schema/db | domain | api | ui | config/infra | docs | hardening | close-out`;
  - the *done-when* is the `Done-when:` line's remainder in the same block;
  - *tasks* are lines matching `^\s*- \[( |x)\] ` in the body.
- A `P<n>` heading with a missing, malformed, or out-of-enum `Layer:` line makes
  the file unparseable → `BLOCKED: unparseable` (fail-closed; no per-phase
  partial judgment is attempted).

**Rule checks** (implementing the eight rules verbatim as `phase-contract`
states them; rule ids `box-1`…`box-8` for finding lines):

- box-1: the title-deliverable must not contain a noun-joining `+`, `,`, `&`,
  `/`, ` and `, or ` y ` between deliverable words — except the templates'
  conventional final-phase title `Hardening & PR`
  (`docs/features/_TEMPLATE/SPEC.md`, `docs/fix/_TEMPLATE/SPEC.md`), which is
  kept literally by mandate and whose title-deliverable normalizes to
  `hardening-pr` (`&` is a normalization separator, not a deliverable joiner).
  Any other `&`-joined title still FAILs.
- box-2: every task's referenced file paths (path-like tokens
  `[\w./-]+\.[A-Za-z0-9]{1,5}`) must map to the declared layer via a fixed
  prefix table frozen here: `skills/`, `docs/`, `template/`, `*.md` → `docs`;
  `scripts/`, `packages/`, `.github/`, `.agentic-workflow/` → `config/infra`.
  Tests live with the phase's own layer. A path the table cannot map is
  *ambiguous* → the file-level verdict is `BLOCKED: unparseable`, never a guess.
- box-3: task count ≤ 8 (final hardening/close-out phase: ≤ 10).
- box-4: per task, FAIL if the task text contains a `→` chain of implementation
  steps, enumerates more than 3 numbered/enumerated cases, or names more than
  1 created file of distinct concerns (creation verbs + > 1 path).
- box-5: task text must not contain decision words `Decide`, `choose`, `Choose`,
  `either/or` between alternatives, or an `If … then <scope change>` pattern
  (`If .* then (add|remove|move|split|merge|defer)`).
- box-6: a task must not move work between phases at runtime — FAIL on task text
  referencing `P\d+` as a move target (`move(s)? .*(to|into) P\d+`, `defer(s)?
  .*(to|into) P\d+`).
- box-7: in non-hardening/non-close-out phases, FAIL on task text containing
  `manual`, `ask the user`, or a human verification step (`gh pr` in a phase
  other than the final hardening phase).
- box-8: every phase body must contain a `Done-when:` line carrying a
  backticked command and an expected outcome.

**Output contract** (one fixed stdout block, byte-stable per input):

```
P1 Phase-lint: PASS (8/8) · fingerprint P1:config/infra:6:phase-lint-script
P1 box-4: <finding>            (one line per failing rule, phase-prefixed)
P1 Phase-lint: BLOCKED — box 4: <reason>
...
verdict PASS                    (final verdict line, all phases clean)
verdict BLOCKED: <reason-code>  (any failure; reason codes:
                                missing-plan | no-phases | unparseable | lint-blocked)
fingerprint: <sha256>           (lowercase hex sha256 over the newline-joined
                                 per-phase fingerprint strings)
```

Exit codes: `0` only when every phase shows `PASS (8/8)` and the final verdict
is `PASS`; `1` on any BLOCKED/parse failure. `missing-plan` for a nonexistent
or unreadable path or no argument; `no-phases` for a parsed file containing
zero phase headings; `unparseable` for read/parse/ambiguity failures.

**Corpus** (`scripts/phase-lint.test.mjs`, embedded fixtures — no network, no
fixtures dir dependency): a minimal valid 2-phase plan; an invalid plan
violating boxes 1, 4, 5; an ambiguous-layer plan (`Layer:` line absent) →
`unparseable`; a plan with no phases → `no-phases`; missing file →
`missing-plan`; a determinism pair (two runs byte-identical); a node-fallback
parity run.

**Skill slims (P3):** in each of the three consumer skills, the phase-lint
step becomes: run `bun scripts/phase-lint.mjs <plan>` (node fallback) and paste
its stdout block; on exit 1, stop with the pasted output. `phase-contract`
remains the prose owner and is not edited. Version bumps: minor per skill.

### Planning evidence

see planning-evidence.md

### Obligations

see planning-obligations.md

### Decisions to confirm

- **ED1 (resolved at scaffold time, per SPEC Deferred decisions row 1):**
  `scripts/phase-lint.mjs` **stays at `scripts/`** and is not re-homed into the
  crate. Rationale: AC1–AC7 and AC5's corpus pin the exact `scripts/phase-lint.mjs`
  path as the frozen contract; re-homing would require a user-approved SPEC
  amendment. The vehicle rule is still satisfied: this feature creates the
  `packages/agentic-workflow` crate skeleton + `.agentic-workflow/tmp/` (AC10);
  features 38/42 land their producers as subcommands of it.
- **ED2:** `.agentic-workflow/tmp/` is committed with a `.gitkeep` so the
  convention exists on fresh clones and `test -d` (AC10) passes off-clone.
- **ED3:** no `--json` mode in v1 (PD2); machine consumption is feature 38/42
  work. No dependency added to `packages/agentic-workflow-schema` (AC9).

### Testing requirements

- Integration-level, offline, deterministic: `scripts/phase-lint.test.mjs`
  embeds the corpus fixtures and asserts verdict lines, reason codes, exit
  codes, and byte-identical determinism (AC4).
- Runtime parity: same corpus run under `node --test` (bun-first per repo
  convention, node fallback enforced by AC7).
- Skill-surface tests: existing suites must stay green
  (`scripts/check-skill-context.mjs`, skills CLI discovery,
  `bundle:skills` parity, ledger-ownership suite) after P3.

### Dev scenarios

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| lint:empty-plan | empty/zero state — a parsed plan with zero phase headings | `phase-lint.mjs` on a corpus fixture with no phase headings → `BLOCKED: no-phases` |
| lint:unparseable-layer | invalid input — a `P<n>` heading with a missing/ambiguous `Layer:` value | `phase-lint.mjs` on the ambiguous-layer corpus fixture → `BLOCKED: unparseable` |
| lint:missing-plan | invalid input — no path argument / nonexistent file | `phase-lint.mjs` with no argument or a bad path → `BLOCKED: missing-plan` |
| lint:oversized-input | invalid/oversized input — a large plan file read whole | `phase-lint.mjs` on a generated large fixture → same verdict as its content (no size cap; read failures → `BLOCKED: unparseable`) |
| lint:permission-denied | unreadable file | `phase-lint.mjs` on a chmod-000 fixture → exit 1 + `BLOCKED: unparseable` |
| lint:dependency-outage | network/offline environment | n/a: the linter makes no network calls; offline run equals online run (AC6 grep + determinism) |
| lint:concurrent-runs | concurrent/duplicate invocations on the same plan | two simultaneous `phase-lint.mjs` runs → identical stdout, both exit the same code (read-only tool) |
| lint:threshold | limit/threshold — a phase with 9+ tasks or > 10-task close-out | corpus fixture phase with 9 tasks → `BLOCKED — box 3` |

### Phases

Detailed tasks live in `TASKS.md`; this section is the high-level ledger
`execute-phase` ticks.

#### P1 — Implement the deterministic phase linter

Layer: config/infra. Done-when: `node --test scripts/phase-lint.test.mjs` → exit 0.

Build `scripts/phase-lint.mjs` (parser, eight rule checks, reason codes,
output block, fingerprints) and `scripts/phase-lint.test.mjs` (corpus) per the
Design section; verify determinism and node-fallback parity.

#### P2 — Create the producer crate vehicle

Layer: config/infra. Done-when: `test -d packages/agentic-workflow && test -f packages/agentic-workflow/package.json && test -d .agentic-workflow/tmp` → exit 0.

Create the minimal `packages/agentic-workflow` crate skeleton (package.json,
README stub; no build, no dependencies) and the `.agentic-workflow/tmp/.gitkeep`
scratch convention, per ED1/ED2.

#### P3 — Slim the three consumer routes to run-and-paste

Layer: docs. Done-when: `grep -n "phase-lint.mjs" skills/plan-feature-scaffold/SKILL.md skills/plan-fix/SKILL.md skills/execute-phase/SKILL.md` → matches in all three, and `bun scripts/check-skill-context.mjs` + `npx skills add . --list` → exit 0.

Edit `plan-feature-scaffold`, `plan-fix`, and `execute-phase` so their
phase-lint steps run the script and paste its output; keep `phase-contract`
untouched; minor version bumps; re-run `npm run bundle:skills`.

#### P4 — Hardening & PR

Layer: hardening. Done-when: `git status --porcelain -- docs/` → empty, and the
project verification gate commands exit 0.

Re-run the full verification gate, exercise the dev-scenario edge corpus
(oversized input, permission-denied, concurrent runs), confirm AC1–AC10, then
the literal close-out tasks.

#### Phase-lint (owned by `skills/phase-contract/SKILL.md` — keep in sync with `docs/fix/_TEMPLATE/SPEC.md`)

- P1 — Phase-lint: PASS (8/8) · fingerprint P1:config/infra:6:implement-deterministic-phase-linter
- P2 — Phase-lint: PASS (8/8) · fingerprint P2:config/infra:3:create-producer-crate-vehicle
- P3 — Phase-lint: PASS (8/8) · fingerprint P3:docs:6:slim-consumer-routes-to-run-and-paste
- P4 — Phase-lint: PASS (8/8) · fingerprint P4:hardening:8:hardening-pr

### Deploy & rollback

n/a — merging the PR is the whole deployment; rollback is reverting the PR. No
migrations, flags, or config changes.

### Open questions / risks

- RESOLVED (was SPEC Deferred decisions row 1): vehicle-rule mechanics — see
  ED1–ED3 above.
- Risk: fix #191 (`handoff-review-fold-order`, in-progress · PR #193) edits
  `skills/execute-phase/` terminal hand-offs; P3 touches the same file's
  preflight section. Mitigation: rebase P3's edit on current `main` at
  execution time; the touch areas (preflight vs terminal hand-off) are disjoint
  by design.
- Risk: rule-4 heuristics (`→` chains, enumerated cases, created files) are
  approximations of "one deliverable"; the corpus pins their exact behavior so
  the approximation is a documented, deterministic contract, not a judgment.

### Deliverables

- `scripts/phase-lint.mjs` and `scripts/phase-lint.test.mjs` (new)
- `packages/agentic-workflow/` crate skeleton and `.agentic-workflow/tmp/` convention (new)
- Slimmed `skills/plan-feature-scaffold/SKILL.md`, `skills/plan-fix/SKILL.md`,
  `skills/execute-phase/SKILL.md` (+ preflight reference), minor bumps
- Re-bundled `packages/pi-agentic-workflow` mirror
- Frozen `ACCEPTANCE.md` + planning artifacts for this unit

### Post-merge next feature

Feature 38 (`workflow-status-sensor-script`) — next Phase-1 producer; it lands
as a subcommand of the crate this feature creates (roadmap rows 37→38; 40 and
42 depend on 37+38).
