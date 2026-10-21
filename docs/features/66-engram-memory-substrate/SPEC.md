---
type: feature
scope: medium
---

# 66 — engram-memory-substrate

> One-line: Engram becomes required memory substrate — a save/recall protocol at
> unit boundaries, a bounded fail-soft health check, provisioning parity with
> #219, and a written recall discipline for Engram 3.3.x+.

## Issue

`#262` — tracked issue. The PR closes it via `Closes #262`.

## Objective

Make Engram the workflow's required cross-session memory substrate (owner
decision 2026-09-24, refs #260): a save/recall protocol that says **what** is
persisted at unit boundaries and **when**, a bounded health check with a
degraded path that warns and records instead of blocking, provisioning parity
with #219 (pi package ships the registration; `init-workspace` offers it
ask-first elsewhere), and the Engram 3.3.x recall discipline in writing.

## Why

Engram is installed on this machine but is neither provisioned nor
contract-bound inside the workflow. Nothing in the repository states what is
saved, when, or what happens when the memory layer does not answer
(triage receipt on #262, 2026-09-27: the only repo hits for `engram` are two
path-ignore mentions). Confirmed failure modes: the server accepted TCP but did
not answer HTTP (`mem_search` timed out while `mem_save` succeeded seconds
later — a caller cannot tell "nothing stored" from "not answering"); registration
lives machine-global in `~/.pi/agent/mcp.json`, so a second machine or a non-pi
host has no path; recall quality depends on whoever happened to call
`mem_save`. Roadmap row 66 is a hard dependency of row 68 (#260
subagent-first execution), which cannot start until 66 and 67 merge.

## User outcome

A session that picks up a unit recalls its goal, numbered acceptance criteria,
Evidence outcomes, and discoveries from Engram keyed by the unit id without
re-reading the docs; a session whose memory layer is down says so once, records
the absence in Evidence, and keeps working; a fresh host gets Engram registered
through the same ask-first path any other tool takes; and a caller who gets a
miss knows the miss is keyword-bound, not proof that nothing was saved.

## Acceptance criteria

> Draft at unit creation, induced from issue #262's mechanics (body + the
> 2026-09-28, 2026-10-15 and 2026-10-21 owner comments). The design step
> confirms or revises each row after its provenance search and gap interview,
> and pins the command verifier per AC at plan time.

1. **Save protocol at unit boundaries, keyed by unit id.** At unit start, each
   phase transition, and unit close, the lane instructs persisting the unit's
   goal, its numbered acceptance criteria, the Evidence outcomes, and
   discoveries/gotchas under a stable per-unit topic
   (`unit/<NN-slug>/…`), so a later session recalls them without re-reading
   the docs. (source: #262 Mechanics 1; #262 comment 2026-10-21 item 1)
2. **Health check fail-soft at the claim.** A bounded connectivity probe runs
   before the first memory read of a session; on timeout it says so once,
   continues, and records the absence in Evidence — never blocking a unit —
   and the probe reads sync/autosync staleness as a health signal, so a
   responding server that has not synced is not reported green. (source: #262
   Mechanics 2; #262 comment 2026-09-28 item 2; #262 comment 2026-10-15
   "REPLACES")
3. **Provisioning parity with #219.** The pi package ships/extends the Engram
   MCP registration and `init-workspace` offers it for non-pi hosts; both ask
   first per `init-workspace`'s consent rules and report exactly what was
   written. (source: #262 Mechanics 3)
4. **Recall discipline, Engram 3.3.x contract.** The written discipline is:
   `mem_context` first (explicitly scoped), then a scoped search with an
   **explicit** `project`; on a project-scoped miss retry once with
   **`all_projects: true`** explicitly passed; never rely on an omitted
   selector for a global read; when cwd is ambiguous, navigate via
   `mem_current_project`'s `available_projects`. (source: #262 Mechanics 4 as
   rewritten by #262 comment 2026-10-15 "CONTRADICTS" rewrite)
5. **Session attribution has a prescribed response.** Every write passes an
   explicit `session_id`; `mem_session_end` runs only on confirmed-stale ids;
   `mem_session_summary`'s explicit `project` fallback is the documented
   escape hatch — so the fail-closed multi-candidate case loses no memories
   silently. (source: #262 comment 2026-09-28 item 3; #262 comment 2026-10-15
   "`mem_session_summary` accepts explicit `project` fallback")
6. **Canonical split `log-session` ↔ `mem_session_summary` is decided and
   recorded.** The docs state which artifact each writer owns (team journal in
   git vs local decision/gotcha recall keyed by unit id), so the double-write
   is a recorded decision, not an accident. (source: #262 comment 2026-09-28
   item 4)
7. **Keyword-bound recall is disclosed.** The docs state that Engram's recall
   is keyword-bound (FTS5, no vectors), so a miss is not evidence that
   knowledge was never saved; hybrid FTS5+vector stays an Engram-side
   direction (#192), never built here. (source: #262 comment 2026-09-28 item 1)
8. **Degradation is recorded, never silent.** When Engram is unavailable:
   local progress is preserved, the mirror is marked pending explicitly,
   unrelated safe work continues, sync resumes when available, and both writes
   (file + mirror) are read back with irreconcilable versions preserved and
   surfaced. (source: #262 comment 2026-10-21 items 3–4)
9. **The gate stays green.** `node --test scripts/*.test.mjs`,
   `bun scripts/check-skill-context.mjs`, and the tests of every touched
   package exit 0, with the touched skills' `version:` bumped per the
   "Version every change" rule.

## Impact

What this unit touches beyond its own files:

- **Consumers of the lane's unit-boundary steps:** `skills/unit-lane/SKILL.md`,
  `skills/execute-phase/references/*`, and `skills/log-session/SKILL.md` gain
  save/recall and health-probe instructions — they currently carry none
  (grep receipt: the only `engram` hits in `skills/` are
  `skills/review-change/references/REVIEW_PROCESS.md:95` and
  `skills/audit-pr/SKILL.md:128`, both path-ignore mentions).
- **Provisioning:** `packages/pi-agentic-workflow` (registration, README,
  settings surfaces) and `skills/init-workspace/SKILL.md` — the ask-first
  consent rule and "report exactly what was written" are binding.
- **The `log-session` ↔ `mem_session_summary` split** changes what each writer
  persists; `docs/LOGS.md`'s role statement must match the recorded decision.
- **Feature 61's published non-goal stops being literally true:**
  `docs/features/61-adaptive-unit-lane/SPEC.md` §Non-goals says "No Engram
  memory hard dependency — Engram mirroring … is optional and can be added by a
  separate integration." This unit (via the #260 owner decision) makes Engram
  required substrate **without** making it a hard failure dependency — the
  wording must be reconciled, never silently contradicted.
- **Version/parity gates:** every touched skill bumps `version:` + CHANGELOG
  row; a skills-only or pi-package-only change bumps the pi package version in
  the same PR (`scripts/version-parity-gate.mjs`).
- **Docs map:** `docs/workflow/*` (and the template agent guide where the
  protocol binds every target project) must name the new surfaces.

## Non-goals

- No LLM summarisation inside a deterministic step.
- No hard failure of a unit because memory is unavailable — the degraded path
  is warn + record (issue #262 Non-goals).
- Not a replacement for the committed docs: Engram persists for recall; the
  repo artifacts stay authoritative.
- No hybrid FTS5+vector implementation here — semantic recall is Engram's own
  feature / #192's project-corpus direction, never this workflow's storage.
- No corpus retrieval, embeddings, or memory protocol added by #192's index —
  feature 65's project index owns corpus retrieval; this unit owns
  conversational recall only.
- No provisioning or installation without the user's explicit consent
  (`init-workspace` ask-first rules).

## Future

none

## Future cost

- Every unit that runs the lane carries the boundary save/recall obligation at
  start, each phase, and close — binds every future `unit-lane` / `execute-phase`
  session.
- A session touching memory runs the bounded health probe before its first
  read, and records a miss/degradation in Evidence — binds every executor and
  reviewer session on this repo.
- Provisioning edits stay ask-first and reported verbatim — binds
  `init-workspace` and the pi package's install path.
- The keyword-bound ceiling must stay disclosed wherever recall is described —
  binds every doc that writes "recall" guidance.

## Applicable tests

- `node --test scripts/*.test.mjs` (root suite, includes
  `version-parity-gate` discipline)
- `bun scripts/check-skill-context.mjs` (budgets + routes) after any SKILL.md
  edit
- `bun run test` in every touched package (`packages/pi-agentic-workflow`,
  and `packages/agentic-workflow-schema` only if its published vocabularies
  change — not expected here)
- `bun scripts/phase-lint.mjs docs/features/66-engram-memory-substrate/SPEC.md`
  (this doc's own grammar)

## Known pre-existing issues

- Engram server drift on `:7437` (server 0.1.0 vs CLI 2.2.1 observed
  2026-09-27, `docs/LOGS.md:2475`; CLI is 3.4.0 on this machine now) —
  **affects** this unit: the health probe design must treat version/server
  mismatch as a first-class unhealthy answer, not assume current tooling.
- Sync-queue staleness (0 enrolled projects, 8,444 pending mutations, oldest
  untouched 2026-08-24, measured 2026-09-28 — #262 comment) — **affects** AC2:
  "server answers" alone cannot be the health signal. (Engram 3.3.x added
  readable autosync phases; whether this machine is enrolled is verified at
  research.)
- Session-attribution ambiguity (`engram doctor`: still warns
  `ambiguous_active_runtime_sessions` today — 1 finding re-verified 2026-10-21,
  after the 135-candidate count of 2026-09-28) — **affects** AC5: omitted-session
  writes fail closed here, so the prescribed response is load-bearing on this
  very machine.

### Research uncertainties (stated, not guessed — 2026-10-21)

- **Probe transport unknown:** whether the 2026-09-24 `mem_search` timeout
  path is the `:7437` HTTP server or the stdio `engram mcp` process pi spawns
  was not reproduced today (`curl :7437/health` → 200). The health design must
  cover both transports or say which one it covers — open, routed to design.
- **Exit code is not a health signal:** `engram doctor` exits 0 while
  `engram doctor --json` reports `status: "error"` (errors 1, blocked 1,
  warnings 3). Whether the probe reads the JSON summary, the sync status, or
  both is a design decision — open, routed to design.
- **Cloud enrolment of this project unverified:** `engram sync --status`
  reports local chunk export only (15 local / 8 remote, 0 pending import);
  cloud requires an explicit `--project`, and `doctor` shows several
  `foreign_sync_target` rows with unacked mutations. Whether
  `agentic-workflow` itself is enrolled was not checked — partial gap, does
  not block design (AC2 reads staleness either way).

## Tasks

Filled by the plan step (phases `P1…Pn`, each with its validator). The
research/design steps run before this section exists as executable work.

### Planning evidence

Ledger lives in the unit folder's `planning-evidence.md` (M-scope unit; filled
by the plan step).

### Obligations

Ledger lives in the unit folder's `planning-obligations.md` (M-scope unit;
filled by the plan step).

## Evidence

### Triaged steps

```text
TRIAGE — 66-engram-memory-substrate (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
```

(command: `bun scripts/unit-route.mjs --triage 66-engram-memory-substrate`, exit 0.
Numeric `--triage 66` is ambiguous with `docs/fix/66-scope-bleed-guardrail`
and exits 2 — the full slug is the working form.)

### Evidence rows

One row per acceptance criterion: what was run, exit status/digest, observed
output (≤2 lines), verified-by.

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| R1 | `grep -rn -i "engram" skills/ packages/*/src packages/*/README.md` | exit 0, 2 hits | both are path-ignore mentions (`REVIEW_PROCESS.md:95`, `audit-pr/SKILL.md:128`); no protocol/provisioning/health text exists | research step, 2026-10-21 |
| R2 | `engram --version`; `cat ~/.pi/agent/mcp.json`; `grep -n engram ~/.pi/agent/settings.json` | exit 0 | `engram 3.4.0`; `mcpServers.engram` → `/home/agent/.local/bin/engram mcp --tools=agent`; `npm:gentle-engram@latest` | research step, 2026-10-21 |
| R3 | `curl -m4 :7437/health`; `engram doctor`; `engram doctor --json`; `engram sync --status` | curl 0 (HTTP 200); doctor exit 0; JSON `status: error` | server answers today; doctor green-by-exit but 1 error + 1 blocked + 3 warnings; update notice 3.4.0 → 3.5.2 | research step, 2026-10-21 |
| R4 | `engram doctor` finding categories (grep of check ids) | exit 0 | `sync_target_closed_space` error; `ambiguous_active_runtime_sessions`, `unowned_session_project`, `session_project_directory_mismatch` warnings; 9 `foreign_sync_target` rows with unacked mutations | research step, 2026-10-21 |
| R5 | `engram --help`, `engram setup --help`, `engram sync --help`; `grep -n consent skills/init-workspace/SKILL.md skills/init-workspace/references/SERENA.md` | exit 0 | `engram setup <agent> [--protocol=slim\|full]` exists; sync is local-by-default, cloud needs explicit `--project`; init-workspace consent rule + SERENA.md:84 "exactly what was written" is the parity shape | research step, 2026-10-21 |
| R6 | `bun scripts/unit-route.mjs --triage 66-engram-memory-substrate` | exit 0 | 9 steps, full catalog, budget strong (block pasted under Triaged steps) | research step, 2026-10-21 |
| R7 | design provenance search + claim journal (`sources.md`, 22 `INV-*` rows) | exit 0 | greps recorded per row (repo footprint, pi `registerMcpServer` docs, #219 body, prior units); 19 confirmed / 2 inferred / 1 unknown | design step, 2026-10-21 |
| R8 | `node scripts/needs-input.mjs docs/features/66-engram-memory-substrate` | exit 0 | 3 open questions (Q1–Q3), route `design`, continuation `no-decision-available` | design step, 2026-10-21 |

## Progress log

- 2026-10-21 22:20 — unit doc created from issue #262 (`--from-issue 262`),
  roadmap row 66; triage pasted verbatim (9 steps, full catalog) → a981a9e1 — next:
  research step
- 2026-10-21 22:34 — research step: 6 evidence rows (repo footprint, installed
  tooling, bounded probes, doctor categories, provisioning surfaces, triage),
  3 uncertainties recorded, no design decision taken → evidence: R1–R6 rows —
  next: design step
  (provenance search → sources.md → gap interview)
- 2026-10-21 22:48 — design stages 1–3: 22-claim `sources.md` journal (tier 0
  first), 4 dated assumptions, `open-questions@1` with Q1–Q3 pasted by
  needs-input (R7, R8) + `BRIEF.md` → evidence: R7–R8 — next: gap interview
  with the owner (stage 4 decide on the answers)

## Next

Gap interview (design stage 3): owner answers Q1–Q3 (`decisions.md`), then
stage 4 records `decision` rows and finalizes the acceptance criteria.

## References

- Issue [#262](https://github.com/gtrabanco/agentic-workflow/issues/262) — the
  tracked issue (mechanics, non-goals, 2026-09-28 findings, 2026-10-15 Engram
  3.3.2 audit, 2026-10-21 protocol canon).
- Roadmap row 66 (`docs/features/ROADMAP.md`) — hard dependency of row 68
  (#260).
- Issues [#260](https://github.com/gtrabanco/agentic-workflow/issues/260)
  (required-substrate owner decision), [#219](https://github.com/gtrabanco/agentic-workflow/issues/219)
  (Serena provisioning parity sibling), [#192](https://github.com/gtrabanco/agentic-workflow/issues/192)
  (project-corpus retrieval, opposite boundary).
- `docs/LOGS.md:2451`, `:2475`, `:2812` — owner decisions and observed
  Engram failure modes.
- `docs/features/61-adaptive-unit-lane/SPEC.md` §Non-goals — the sentence this
  unit reconciles (see Impact).
