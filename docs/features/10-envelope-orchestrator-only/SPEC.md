# 10 — envelope-orchestrator-only

> Feature specification. This is the **feature doc** read at the start
> of the workflow (`CLAUDE.md` → Feature workflow). Fill every section.
> Detailed phase tasks live in `PLAN.md` / `TASKS.md`.
>
> **One SPEC, two halves.** The Product half below was written from issue
> [#17](https://github.com/gtrabanco/agentic-workflow/issues/17) by
> `plan-feature-from-issue`; the Engineering half by `plan-feature-scaffold`.

## Goal

Move the machine-readable turn envelope out of the per-skill contract and into the
orchestration layer that is its only consumer. Every user-facing skill stops
emitting the `## Machine envelope` JSON block (and drops its turn-contract box for
it); the sole exception is `workflow-status`, the sensor whose entire job is to
emit the envelope. In its place, the driver injects a canonical system-prompt
snippet demanding the envelope, and implements a **repair loop** that re-asks for
the envelope when a turn omits it. This makes the workflow read cleanly for humans
in interactive chat, stops weak models from being marked non-compliant for
dropping an end-of-document duty they were always going to drop, and puts the
contract where a machine can actually enforce it.

## Branch

`feat/10-envelope-orchestrator-only`

## Size

`M` — mechanical but wide (a MAJOR-bump chain across 14 skills plus the
orchestration docs), gated on an external driver. Full artifact set; four phases,
last = hardening. Not split: the plan is ≤5 phases, each phase is a single
concern/layer, and every design decision is resolved here (see `decisions.md`).

## Dependencies

- **No feature dependency.** The `## Machine envelope` sections this feature
  removes were all introduced by features 01–09, which are `done` **and merged**.
- **Hard external gate (not a roadmap dependency): the driver must ship the
  repair loop first.** Per issue #17, the user's Node/opencode driver must
  implement `parseEnvelope()` + the re-invoke repair loop **before** this skills
  change lands — otherwise driven runs lose routing the instant a skill stops
  emitting the envelope. This is an *execution* gate, not a *planning* gate: this
  SPEC and its artifacts are written now; **`execute-phase` must not start until
  the user confirms the driver is ready.** The gate is external to the roadmap
  dependency graph, so it lives here and in `known-issues.md`, and the
  `plan-feature` closing block flags it.

---

## Product half

Written from issue #17 by `plan-feature-from-issue`.

### Context

The workflow currently requires **every** user-facing skill to end its turn with a
fenced `json` machine envelope, enforced by a turn-contract box at the top of each
`SKILL.md`. This was useful when the envelope contract had no other home. But:

- **Humans don't want it.** In interactive chat the trailing JSON block is noise;
  the only consumer is an external orchestrator/driver.
- **Weak models drop it anyway.** "Weaker models drop end-of-document duties" is
  the workflow's own stated reason for putting turn contracts *first* — yet the
  envelope is the last thing in the document, so weak models omit it and are then
  scored non-compliant for a duty the harness could have enforced.
- **The contract is misplaced.** Enforcement belongs at the layer that reads the
  envelope (the driver), which can detect a missing envelope and re-ask for it —
  something a static `SKILL.md` instruction cannot do.

The single skill for which emitting the envelope **is** the function —
`workflow-status`, the sensor (`--json-only` is meaningless without it) — keeps
it. `orchestration-envelope` (internal, the layer skill) is not a consumer either;
it becomes the **home of the canonical contract**: the schema plus the
system-prompt snippet the driver injects.

### Business goals

Internal/technical feature — no external business goal. The outcome is a cleaner
human-facing workflow and a machine-enforceable envelope contract that survives
weak executor models.

### Scope

#### In scope

- Remove the `## Machine envelope` section **and** its turn-contract box from every
  user-facing skill **except `workflow-status`** — the 14 skills:
  `audit-docs`, `audit-pr`, `bump-skill`, `design-feature`, `execute-phase`,
  `generate-docs`, `init-workspace`, `log-session`, `plan-feature`, `plan-fix`,
  `product-audit`, `review-change`, `ship-roadmap`, `triage-issue`.
- `workflow-status` keeps its envelope section unchanged.
- `orchestration-envelope` + `docs/workflow/ORCHESTRATION.md` +
  `docs/workflow/PORTABLE_PROMPT.md` gain the canonical **driver-injected
  system-prompt snippet** ("every turn MUST end with exactly one fenced json block
  matching this schema…") and document the **driver repair loop** (`parseEnvelope()`
  fails → re-invoke the same session with a one-line "Emit only the machine
  envelope for the turn above" prompt).
- MAJOR `version:` bump for each of the 14 stripped skills; `CHANGELOG.md` +
  `CHANGELOG.es.md` rows; README skill/model tables refreshed — via `bump-skill`.
- A `docs/workflow/MIGRATION.md` note describing the removed section and where the
  contract now lives.

#### Out of scope / non-goals

- **Changing the envelope schema or the npm package**
  (`@gtrabanco/agentic-workflow-schema`) — explicitly unchanged (issue #17 §4).
  Owner: none; this feature must not touch `packages/agentic-workflow-schema/`.
- **Building the driver / repair loop implementation** — that is the user's
  external Node/opencode project, the hard gate this feature waits on. This
  feature only *documents* the contract and repair-loop protocol.
- **Removing the envelope from `workflow-status`** — the sensor keeps it.
- **Removing the envelope from internal routing sub-skills** that never carried it
  (`plan-feature-from-issue`, `plan-feature-scaffold`, `review-*` sub-skills) —
  they have no `## Machine envelope` section to remove (verified by grep).

### Capability closure

This is a docs/skills-workflow refactor: it introduces **no runtime entity** and
**no new user action** — it removes an output obligation from existing skills and
relocates a contract into docs. The entity/CRUD rows are therefore `n/a` with
reasons; the "capabilities" are the workflow behaviors that change, each mapped to
a checkable surface.

```markdown
For EACH entity this feature introduces or touches:
- [x] Create — n/a: no runtime entity; feature edits skill/docs text only
- [x] Read/list — n/a: no runtime entity
- [x] Update — n/a: no runtime entity
- [x] Delete — n/a: no runtime entity
- [x] State transitions — n/a: no runtime entity

For EACH capability (action a user/driver takes):
- [x] "Skill ends a turn without a JSON envelope (human-clean output)" —
      entry point: any of the 14 stripped skills · ACL: n/a (no auth surface)
- [x] "Driver obtains the envelope for a turn" — entry point: the canonical
      system-prompt snippet in orchestration-envelope/ORCHESTRATION.md,
      injected by the driver · ACL: n/a
- [x] "Driver recovers a missing envelope" — entry point: the documented repair
      loop (re-invoke with the one-line prompt) · ACL: n/a
- [x] "workflow-status emits the envelope on demand" — entry point:
      `workflow-status` / `--json-only` (unchanged) · ACL: n/a

For EACH role / permission:
- [x] n/a — no roles/permissions; the workflow skills have no auth model
```

### Acceptance criteria

All command-checkable except the two `read-verified` items. Commands assume repo
root. `SKILLS14` = the 14 stripped skills listed in *In scope*.

- **AC1 — envelope removed from all 14.** No stripped skill contains the section:
  ```sh
  grep -l "## Machine envelope" \
    skills/{audit-docs,audit-pr,bump-skill,design-feature,execute-phase,generate-docs,init-workspace,log-session,plan-feature,plan-fix,product-audit,review-change,ship-roadmap,triage-issue}/SKILL.md
  # expect: no output (exit 1)
  ```
- **AC2 — turn-contract envelope box removed from all 14.** None of the 14 still
  reference emitting the envelope in their turn contract:
  ```sh
  grep -il "machine envelope" \
    skills/{audit-docs,audit-pr,bump-skill,design-feature,execute-phase,generate-docs,init-workspace,log-session,plan-feature,plan-fix,product-audit,review-change,ship-roadmap,triage-issue}/SKILL.md
  # expect: no output (exit 1)
  ```
- **AC3 — sensor keeps it.** `workflow-status` still emits the envelope:
  ```sh
  grep -q "## Machine envelope" skills/workflow-status/SKILL.md   # expect: exit 0
  ```
- **AC4 — canonical snippet lives in the orchestration layer.**
  ```sh
  grep -qi "system-prompt snippet" skills/orchestration-envelope/SKILL.md   # exit 0
  ```
- **AC5 — repair loop documented.**
  ```sh
  grep -qi "repair loop" docs/workflow/ORCHESTRATION.md   # exit 0
  grep -qi "system-prompt snippet\|every turn MUST end" docs/workflow/PORTABLE_PROMPT.md   # exit 0
  ```
- **AC6 — migration note present.**
  ```sh
  grep -qi "envelope" docs/workflow/MIGRATION.md   # exit 0 (new entry for feature 10)
  ```
- **AC7 — MAJOR bumps + changelog rows for all 14** (bump-skill enforced):
  ```sh
  grep -c "10-envelope-orchestrator-only\|envelope" CHANGELOG.md   # >= 1 row referencing this change
  ```
  read-verified: each of the 14 skills' `version:` major digit incremented vs its
  pre-feature value, and mirrored in `CHANGELOG.md` + `CHANGELOG.es.md` + both
  README skill tables.
- **AC8 — schema package untouched.**
  ```sh
  git diff --name-only origin/main...HEAD | grep '^packages/agentic-workflow-schema/'
  # expect: no output (exit 1)
  ```
- **AC9 — nothing breaks discovery.** `npx skills add . --list` lists every skill
  (no malformed frontmatter from the edits).
- **AC10 — no dangling envelope references** anywhere in `skills/` or
  `docs/workflow/` point a stripped skill at a `## Machine envelope` section it no
  longer has (read-verified against the grep sweep in the hardening phase).

### Tooling

- `bump-skill` (this repo's internal skill) is the mechanical enforcement for
  AC7 — run it after the skill edits, before commit.
- No MCP servers apply.

### Product decisions

Settled in the 2026-07-09 design session (issue #17 is marked **USER DECISION**):
the envelope leaves the skills, `workflow-status` keeps it, enforcement moves to
the driver via an injected system-prompt snippet + repair loop, and the change is
**driver-gated**. No further product decisions open. See `decisions.md` for the
engineering decisions.

## Design status

`designed` — every capability-closure row is filled or explicitly `n/a`, and the
acceptance criteria are enumerated as runnable checks.

---

## Engineering half

Written by `plan-feature-scaffold`.

### Technical goals

- Single, uniform removal shape applied to 14 `SKILL.md` files, verifiable by grep.
- The envelope contract has exactly **one** authoritative home after this change:
  `orchestration-envelope` (schema + snippet) with `ORCHESTRATION.md` /
  `PORTABLE_PROMPT.md` as the driver-facing docs; `workflow-status` remains the
  sole *emitter* among the skills.
- Zero change to the envelope JSON schema or the npm package — parsers keep working.

### Architecture impact

- **Docs/skills layer only.** No code, no runtime, no schema. The invariant:
  `packages/agentic-workflow-schema/` is not touched (AC8), and
  `skills/workflow-status/SKILL.md`'s envelope section is not touched (AC3).
- The "contract lives at the consuming layer" principle mirrors feature 04/05's
  driver guidance in `ORCHESTRATION.md` — this feature extends that layer rather
  than inventing a new mechanism.

### Design

**The removal shape (applies to each of the 14 skills).** In each `SKILL.md`:

1. Delete the `## Machine envelope` section in full (heading through the end of
   that section, up to the next `##` or the closing `→ Next:`/Portability block).
2. Delete the turn-contract box line that requires emitting the envelope (the
   `✓ … the machine envelope (fenced ```json …) as the ABSOLUTE last output` line,
   and any "then the machine envelope" clause in the same box).
3. Where the closing `→ Next:` block text says the envelope is printed **after**
   it, remove that clause so the `→ Next:` block becomes the genuine last output.
4. Leave every other section untouched. Do **not** rewrite prose beyond these
   three deletions — this is a strip, not a rewrite.

Each skill's `version:` gets a **MAJOR** bump (contract change), handled by
`bump-skill` in P3, not hand-edited in P2.

**The orchestration home (P1).** In `skills/orchestration-envelope/SKILL.md` and
`docs/workflow/ORCHESTRATION.md` / `docs/workflow/PORTABLE_PROMPT.md`:

- Add the **canonical system-prompt snippet** the driver injects, verbatim and
  fenced, e.g.:
  > Every turn you produce MUST end with exactly one fenced ```json block matching
  > the orchestration envelope schema (all top-level keys present; values only
  > from verified command output). Emit nothing after it.
- Document the **repair loop** as driver protocol: `parseEnvelope(lastTurn)` →
  on failure, re-invoke the *same* session with the single-line prompt
  `Emit only the machine envelope for the turn above.` and parse that reply. State
  the rationale (a weak model that won't emit JSON spontaneously almost always can
  when it is the only ask) and the retry bound.
- Note that `workflow-status` is the one skill that still emits the envelope
  inline (sensor), so a driver polling it needs no repair loop for that call.

**Migration (P3).** Add a `docs/workflow/MIGRATION.md` entry: what was removed
(the per-skill `## Machine envelope` section + turn-contract box), from which
skills, that `workflow-status` retained it, and where the contract now lives
(orchestration layer + driver snippet/repair loop). Callers/drivers that relied on
skills emitting the envelope must inject the snippet + repair loop.

### Decisions to confirm

All resolved — see `decisions.md`. Summary: MAJOR bump for each stripped skill;
turn-contract box removed alongside the section; `→ Next:` becomes the true last
output; `orchestration-envelope` is the canonical home; schema/package frozen;
driver gate is external and blocks execution not planning.

### Testing requirements

Documentation/skills feature — the "tests" are the AC grep commands run at the
verification gate (see `testing.md`), plus `npx skills add . --list` for discovery
integrity. No unit/integration test code is added. Layer: repo-verification
(the CLAUDE.md "Verification" section) — markdown well-formed, cross-references
resolve, no leaked references, skills all discoverable.

### Dev scenarios

Orchestration-only; no new domain. Reproduced by running the AC greps against the
working tree.

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| `envelope:missing-turn` | a driven turn with no envelope after the strip | the documented repair loop (re-ask prompt) — verified by reading the ORCHESTRATION.md protocol, not by running a live driver |
| `envelope:dangling-ref` | a skill cross-referencing a removed section | the P4 grep sweep (AC10) catches any leftover pointer |
| `envelope:sensor-intact` | driver still needs machine routing | `workflow-status` emit path unchanged (AC3) |

### Phases

- **P1 — Orchestration home.** Add the canonical system-prompt snippet + repair-loop
  protocol to `orchestration-envelope/SKILL.md`, `ORCHESTRATION.md`,
  `PORTABLE_PROMPT.md`. (One concern: the orchestration layer.) Gate: AC4, AC5.
- **P2 — Strip the 14 skills.** Apply the uniform removal shape to all 14
  `SKILL.md` files. (One concern/layer: skills text; mechanical, grep-checkable.)
  Gate: AC1, AC2, AC3 (sensor untouched).
- **P3 — Release metadata.** Run `bump-skill` (MAJOR × 14, both CHANGELOGs, both
  README tables); add the MIGRATION.md note. (One concern: release/version docs.)
  Gate: AC6, AC7.
- **P4 — Hardening.** Sweep for dangling envelope references (AC10), confirm the
  schema package is untouched (AC8), confirm discovery (AC9), confirm
  `workflow-status` still emits (AC3), verify the repair-loop doc is internally
  coherent; then open the PR (`Closes #17`). Gate: AC8, AC9, AC10 + full re-run.

### Deploy & rollback

**n/a** — merging is the deploy. Rollback = revert the PR; no data, no migration,
no flag. (The *external* driver rollout is the user's concern and is the gate, not
part of this PR's deploy.)

### Open questions / risks

- **RISK (blocking, external): driver readiness.** If the skills land before the
  driver's repair loop, every driven run loses routing. Mitigation: the execution
  gate — do not run `execute-phase` until the user confirms the driver ships the
  repair loop. Tracked in `known-issues.md`.
- **RISK (low): count drift.** Issue #17 says "~13 skills"; the verified surface is
  **14** (all `## Machine envelope`-bearing user-facing skills except
  `workflow-status`). The SPEC's explicit 14-skill list is authoritative.
- **RESOLVED:** schema/package change? No — frozen (AC8).

### Deliverables

- 14 `SKILL.md` files with the envelope section + turn-contract box removed.
- `orchestration-envelope/SKILL.md`, `ORCHESTRATION.md`, `PORTABLE_PROMPT.md` with
  the canonical snippet + repair-loop protocol.
- `docs/workflow/MIGRATION.md` entry; `CHANGELOG.md` + `CHANGELOG.es.md` rows;
  refreshed README skill/model tables; MAJOR version bumps.
- PR with `Closes #17`, URL printed in chat.
