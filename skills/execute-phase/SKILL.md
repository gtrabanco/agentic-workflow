---
name: execute-phase
user-invocable: true
version: 6.2.1
argument-hint: <NN-slug> [P<k>|step] [--max-attempts N] [--force]
allowed-tools: [Bash, Read, Edit, Write, MultiEdit]
author: "Gabriel Trabanco <1969593+gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Step executor for units whose triage (unit-lane) decided which steps the unit
  needs. Implements one triaged step (or all remaining steps), with frozen
  acceptance, step-local gates, commits, red-gate repair, and diff-size guard.
  BREAKING: replaced PLAN.md/TASKS.md/progress.md/ACCEPTANCE.md with the unit
  doc's Tasks section, Evidence rows, and Progress log; ACCEPTANCE.md is gone —
  acceptance criteria live in the unit doc and Evidence rows are the receipts.
---

# Execute Phase

Step executor for units. The unit doc (created by `unit-lane`) owns `Tasks` P1…Pn,
`Evidence` rows, and a `Progress` log — these replace PLAN.md, TASKS.md,
progress.md, and ACCEPTANCE.md. Each step runs as an atomic gate/commit.

**Argument resolution (first match):**
- `<NN-slug> P<k>` — exactly the step named by the triage order (P1, P2, …)
- `<NN-slug>` (no step) — all remaining steps, one commit each
- `P<k>` alone — the step by position in the current unit (last-known NN-slug)

Never infer a step ID absent from the triage block in the unit doc.

## Turn contract

Tick every box before ending the turn; an unchecked box means the turn is not
done:

```
✓ Required user inputs were answered concretely (not defaulted). Nothing here
  is inferred: a gap runs `node scripts/needs-input.mjs <unit-dir>` and the
  `open-questions@1` block is pasted, then the run stops.
✓ Triage verified — unit doc Evidence section header matches
  `bun scripts/unit-route.mjs --triage <slug>` output block (PREFLIGHT.md)
✓ Unit doc read and step selected (explicit P<k> or first unfinished)
✓ Step executed and committed (one commit per step, conventional format)
✓ Evidence rows updated (command → exit/digest → output → verified-by)
✓ Progress log updated with a dated `YYYY-MM-DD HH:MM` entry that names the
  phase id (what, commit, next)
✓ Memory boundary ran — the phase's outcome saved under `unit/<NN-slug>/doc`,
  or the mirror marked pending when the layer is degraded
✓ Diff guard passed (on implement steps) — see `diff-guard` in PREFLIGHT.md
✓ → Next: block printed as the absolute last output
```

## When to use

- A triaged unit from `unit-lane`: steps include `implement`/`tests`/`evidence`
  → invoke with `<NN-slug>` or `<NN-slug> P<k>`.
- Docs-only units (triage returns only `[docs, evidence]`) do **not** load this
  skill — they are executed in-place by the unit-lane conductor.
- To execute all remaining steps: `<NN-slug>` with no step argument.
- To repair a failed step: `<NN-slug> P<k>` (retry the same step).

## Inputs — artifacts, never questions

This skill **never interviews**. It reads its inputs — the unit doc's `Tasks`,
`unit-route.mjs --triage`'s block, the route's tier — and a missing or ambiguous
one is a **gap**, resolved in one fixed order and never by inference:
**(0) provenance** (search the repo's own docs and record where) →
**(1) research** (2–3 concrete options with trade-offs; asking for more research
is a legitimate answer) → **(2) halt**: run `node scripts/needs-input.mjs
<unit-dir>`, paste the `open-questions@1` block verbatim, stop. Interactive the
block is the pause point, unattended it is a hard fail. Grammar and exit codes:
`orchestration-envelope`'s `references/TURN_CONTRACT.md` §Open questions.

Bare `<NN-slug>` runs **all remaining steps** — the phase is not an input. File
targets are the unit doc's nested `Relevant files:` metadata plus the
path-protection checkpoint. `--max-attempts N` defaults to 3; `--force` skips the
*stop* on the dependency and phase-lint gates (never the check — `PREFLIGHT.md`
records the override in the Progress log) and has **no bypass** on the
path-protection checkpoint.

## Step 0 — Discover the project

Per the agent guide's **Workflow conventions** + **documentation map**, read the
unit doc at `docs/features/<NN-slug>/SPEC.md`. Verify it carries `## Tasks` (P1…Pn),
`## Evidence`, and `## Progress` sections. If absent, the unit is not ready —
stop and suggest `unit-lane` triage first.

## Process

### 1. Verify triage currency

Run `bun scripts/unit-route.mjs --triage <slug>` and compare its block to the
Evidence section header in the unit doc. **Mismatch → STOP and re-triage first.**
This is the gate that ensures the executor and unit-lane agree on steps.

### 2. Select the step

If a step argument is given (e.g. `P2`), use that step. Otherwise, the **first
unfinished step** — the first P<k> in `Tasks` whose checkbox is unticked.
Never execute a step the triage skipped.

### 3. Pre-step gates

Run gates in order; any fails → STOP (see [PREFLIGHT.md](references/PREFLIGHT.md)):

1. **Path-protection checkpoint** — read the committed range against protected
   paths (e.g. `tests/`, `fixtures/`). Exit 1 → STOP with the gate rejection
   block. No `--force` bypass (no flag can override).
2. **Phase-lint** — run `bun scripts/phase-lint.mjs <unit-doc>` **only** when the
   step is `implement` and the unit has `Tasks` P1…Pn. Parse the `Tasks` section
   (not PLAN.md/TASKS.md). Exit 1 → STOP. If the script is absent, apply the
   eight `phase-contract` rules by hand, label weaker, and disclose.
3. **Pre-write mapper** — for `implement` steps, settle the pre-write mapper
   contract before branch creation, planning commit, or source/test edit:
   ([implementation-discovery](../implementation-discovery/SKILL.md)): it closes
   the seven evidence questions and routes `READY | REPLAN | NEEDS-DESIGN |
   BLOCKED`; only `READY` authorizes the first write.
4. **Dependency/invariant checks** — per unit-lane's triage catalog rules:
   ensure required dependencies are merged; architectural invariants preserved
   or backed by an explicit recorded decision (block `violates`/`introduces`/
   `changes` before edits).

### 4. Execute the step

Follow the unit-lane reference for this step (`references/STEPS.md` catalog):
one line — read the step's reference file, perform its checklist, commit the
work. For `implement` steps: write tests-first where they pay (core/domain,
orchestration — record the failing red run's command, exit, and failing test
names before implementation), then green. UI/adapter glue may test after.

### 5. Post-step

1. **Diff guard** (implement steps only): run `bun scripts/diff-guard.mjs --base
   <last-step-commit> --unit <unit>` — paste the block verbatim. **BREACH → STOP**
   (re-triage or record exception). Anti-gaming: **NEVER shrink a diff by deleting
   comments, blank lines, docs or tests.**
2. **Evidence rows**: one row per AC satisfied — `| AC | command | exit/digest |
   output (≤2 lines) | verified-by |`. Append to the Evidence section.
3. **Progress log**: append a dated entry —
   `YYYY-MM-DD HH:MM — <what was done> → <commit sha> — next: <what is next>`.
4. **Memory boundary** — this step is a phase transition. Follow
   [the memory protocol](../unit-lane/references/MEMORY.md): before the first
   memory read run `agentic-workflow memory probe` once and record its verdict
   in Evidence; after the step, save the phase id, what it changed, its Evidence
   outcome and any discovery under `topic_key: "unit/<NN-slug>/doc"`, an explicit
   `project` and explicit session attribution (§5). A `degraded` verdict is
   recorded and the mirror marked pending — it never blocks the step.
5. **Commit**: `git add <changed files>` then `git commit -m "<type>(<scope>):
   <step-summary>"` — run it, paste the SHA.

### 6. Red gate (repair loop)

After each step: run the project's verification gate (type-check + tests + build).

- **Gate green** → proceed.
- **Gate red** → record exit code + failing test names in the Progress log, repair
  the same step, retry. Default `--max-attempts 3` (user value overrides).
- **Exhausted** → STOP with:

  ```text
  UNIT LOOP — <unit> BLOCKED at <P<k>>
  Reason: <NO-PROGRESS|ATTEMPT-BUDGET> · Attempts: <n>
  Last validator: <command> → <exit/status + compact failure>
  Preserved: no red commit; acceptance blob <sha> unchanged

  → Next: inspect the named blocker, then re-run /execute-phase <unit> <P<k>>
    · architecture/product decision required → resolve it before resuming
    · continue atomically → /execute-phase <unit> <P<k>>
  ```

### 7. Whole-unit mode

When invoked as `<NN-slug>` with no step: loop all remaining steps, one commit
each. This is an **explicit operator choice only** — the lane's hand-offs
always name exactly one phase (`<NN-slug> P<k>`), so a bare `<NN-slug>` from a
lane hand-off is a defect; re-read the hand-off before looping. After each
step: gates, execute, diff guard (if implement), evidence/progress update,
commit. Skip intermediate review checkpoints; the mandatory end review covers
the full accumulated diff. On gate red at any step: repair that step (up to
`--max-attempts`), then continue the loop. Terminal:

```text
UNIT LOOP — <unit> COMPLETE
Steps: <n> · Commits: <sha list> · Gate: PASS
PR: <url>

→ Next: /review-change on the changed HEAD — the mandatory end review
  · findings (REVIEW-FAIL) → /fold-findings repairs them; a fresh /review-change follows the fold
  · merge gate after REVIEW-PASS → /audit-pr
```

### 8. Descope guard

Before creating **any** issue while executing: classify with the descope test.
A descope (moving an acceptance criterion or task out of scope) requires
**explicit user approval first**, then record in the unit doc's
`## References` section (not a follow-up issue) as:
`- <YYYY-MM-DD> — descoped: "<criterion>" — approved by user`.
An issue may never be the first record of a descope.

## Required references

These files must be loaded when their topic is active:
- [PREFLIGHT.md](references/PREFLIGHT.md) — all gate blocks (dependency, status, pre-exec, evidence, lint, path-protection)
- [EXECUTION_CONTRACT.md](references/EXECUTION_CONTRACT.md) — step completion gate, architectural invariants
- [PRE_EXECUTION_GATE.md](references/PRE_EXECUTION_GATE.md) — pre-execution review gate, normalizer order
- [FOLDING.md](references/FOLDING.md) — review finding fold cycle
- [DESCOPE.md](references/DESCOPE.md) — descope test and amendment rule
- [FORGE_BODY.md](references/FORGE_BODY.md) — forge operations (gh body-file rule)

## Guardrails

**Allowed:**
- Only the triaged steps listed by the unit doc's Evidence header
- Changes scoped to the acceptance criteria and step tasks
- Documentation updates in the unit doc (Evidence, Progress, References)
- Conventional commit messages per the project's Workflow conventions
- The step's own reference file (read one-hop from the unit doc catalog)

**Forbidden:**
- Never commit red (test failure) — fix within the step's scope, or record the
  blocker and stop.
- Never weaken a validator (loosen assertions, reduce coverage) — a repair must
  keep assertions at least as strong.
- Never execute a step the triage skipped — the catalog is authoritative.
- Never edit the unit doc's Acceptance criteria (that is re-triage with user consent).
- Never expand scope beyond what Non-goals define — findings discovered during
  implementation never widen the unit.
- Never invent an acceptance criterion — ask the user with concrete options.

## Relationship to other skills

`unit-lane` conducts (triage → judgment steps → close-out ladder) and hands
execution off **one phase per turn** (`<NN-slug> P<k>` with the catalog tier);
this executes the named phase — or, as an explicit operator choice only, all
remaining steps. The closing hand-off names exactly one phase and the tier
while phases remain, and resumes the lane after the last one.
`fold-findings` handles review finding repairs. The review pack axes
(`review-implementation`, `review-code`, `review-security`, `review-perf`,
`review-a11y`, `review-debt`) compose the review step; `workflow-status` routes
here. `triage-issue` feeds issues into the lane. This skill is the **step
executor** a turn invokes to perform one triaged step of a unit under the full
gate machinery.

## Portability (agents other than Claude Code)

- **No slash menu** — open this `SKILL.md` and follow it literally in a fresh
  conversation. Where it says `run`, execute the shell command directly.
- **No model tiers** — triage and review use the strongest model; execution
  steps may use cheaper. Never review with a weaker model than the author.
- **No `/loop`/subagents** — invoke `<NN-slug>` for all remaining steps (the
  built-in loop), or `<NN-slug> P<k>` for individual steps.
- **No fresh workers** — execute inline and reduce state to the unit doc after
  each commit; never re-read prior files.

## Done when

- Requested scope is implemented (the named phase, or all remaining steps in an
  explicit operator run), gate is green, unit doc Evidence/Progress are current
  (the Progress entry names the phase id), and the work is committed.
- **The closing `→ Next:` block is printed.**

## Closing recommendation

Exactly one end-state applies — pick by the unit's Tasks section, never print a
phase id the Tasks section does not define:

Phases remain:

```
→ Next: /execute-phase <NN-slug> P<k+1> (tier: <tier>) — one phase per turn; <tier> is the catalog's implement entry
  · whole-unit operator run complete → /review-change (mandatory end review)
  · findings (REVIEW-FAIL) → /fold-findings repairs them; a fresh /review-change follows the fold
  · merge gate after REVIEW-PASS → /audit-pr — the merge gate
```

The last phase just closed (a lane-run unit):

```
→ Next: /unit-lane <NN-slug> — resume the conductor for the remaining judgment steps
  · whole-unit operator run complete → /review-change (mandatory end review)
  · findings (REVIEW-FAIL) → /fold-findings repairs them; a fresh /review-change follows the fold
  · merge gate after REVIEW-PASS → /audit-pr — the merge gate
```