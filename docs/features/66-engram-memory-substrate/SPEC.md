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

> Induced from issue #262's owner comments (body + 2026-09-28 / 2026-10-15 /
> 2026-10-21) and confirmed by the design step's gap interview — decisions
> `D1`–`D3` in `decisions.md`, claims cited in `sources.md`. The plan step pins
> the command verifier per AC.

1. **Save protocol at unit boundaries, keyed by unit id.** At unit start, each
   phase transition, and unit close, the lane instructs persisting the unit's
   goal, its numbered acceptance criteria, the Evidence outcomes, and
   discoveries/gotchas under a stable per-unit topic
   (`unit/<NN-slug>/…`), so a later session recalls them without re-reading
   the docs. (source: #262 Mechanics 1; #262 comment 2026-10-21 item 1)
2. **Health check fail-soft at the claim.** A deterministic probe (runner-crate
   subcommand, decision D1) with a bounded timeout runs before the first memory
   read of a session and emits a JSON verdict — including an explicit `DEGRADED`
   result when the engram binary or transport is absent. On timeout it says so
   once, continues, and the verdict/absence is recorded in Evidence — never
   blocking a unit — and the verdict reads sync/autosync staleness as a health
   signal, so a responding server that has not synced is not reported green.
   (source: #262 Mechanics 2; #262 comment 2026-09-28 item 2; #262 comment
   2026-10-15 "REPLACES"; decision D1)
3. **Provisioning parity with #219.** The pi package registers Engram through
   its own consent surface (extension `pi.registerMcpServer`, only when the
   engram binary is present) and asks the user to install Engram — the
   documented route is `pi install npm:gentle-engram@latest`, **never**
   `engram setup pi` (it keeps the old version until re-executed) — and
   `init-workspace` offers the same ask-first provisioning for non-pi hosts.
   Both report exactly what was written. (source: #262 Mechanics 3; issue #219
   §Mechanics; decision D3)
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
6. **Canonical split decided and recorded** (decision D2): `docs/LOGS.md` is
   the git-traveling human/team journal owned by `log-session`;
   `mem_session_summary` is local decision/gotcha recall keyed by unit id.
   Both writers' texts state their own half, so the double-write is a recorded
   decision, not an accident. (source: #262 comment 2026-09-28 item 4;
   decision D2)
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

- 2026-10-21 — owner idea, verbatim from the Q3 answer and explicitly **not**
  part of that answer's decision: "create and install a local script to update
  engram and weekly check through code when using a command if possible when
  using unit-lane or audit-pr". Status: `open` — needs its own discussion and
  decision before anything is implemented.

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
- Stale exact pin on the pi package: pins `@gtrabanco/agentic-workflow-schema`
  4.6.0 while the registry published 4.7.0 (reproduced 2026-10-21:
  `node scripts/version-parity-gate.mjs --pins --package packages/pi-agentic-workflow`
  → `GATE REJECTION — dependency-pin-drift`) — **affects** this unit: the CI
  pins half fails on any PR under the trigger set, so P4 bumps pin + package
  version together; the owner's broader `fix(deps)` note (`docs/LOGS.md:3183`)
  covers the same schema pin and is absorbed here for that half.
- The pi package's `@gtrabanco/agentic-workflow` pin (0.2.0) cannot move to the
  workspace crate version until the crate publishes (`bun --frozen-lockfile`
  cannot resolve an unpublished version — `docs/LOGS.md:3183`) — **does-not-affect**
  this unit: 0.2.0 still equals the registry, so the pins half does not flag it.

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

- P1 — Runner-crate memory probe: new `memory probe` command printing a bounded
JSON verdict (`ok` | `degraded`) over five named checks — `http-health`,
`mcp-runner`, `binary-version`, `sync-staleness`, `session-ambiguity` — with
the probe transport, the timeout bounds, the injection seam and the fixtures
pinned in this task. **Transport** (closes the research uncertainty: both
transports plus the CLI are covered, no MCP tool call is ever issued, so the
probe never mutates the memory layer): HTTP `GET
http://127.0.0.1:7437/health` for the server (research R3, re-measured
2026-10-22 — HTTP 200 in 0.045 s); one MCP `initialize` round-trip against a
spawned `engram mcp --tools=agent` for the stdio runner (argv per R2
`~/.pi/agent/mcp.json` — 0.158 s, serverInfo `engram 3.4.0`); the CLI sources
`engram --version` (0.019 s), `engram sync --status` (0.203 s), `engram doctor
--json --check ambiguous_active_runtime_sessions` (0.286 s), `engram doctor
--json --check sync_target_closed_space` (0.450 s) — never the full
`engram doctor --json` sweep (12.2 s at the repo root, 23.2 s from /tmp,
2026-10-22). **Timeout bounds**: 4 s per HTTP/runner/version call, 10 s per
staleness/session CLI call, 30 s whole-probe ceiling; a bound hit fails that
check, sets the verdict `degraded`, never a hang, never a blocked unit. The
verdict is `ok` only when all five checks pass: healthy HTTP, runner
`initialize` answered, binary present, no pending sync work, no non-`ok` sync
target finding, no session-ambiguity finding (AC2 staleness signal).
**Injection seam**: `runProbe({ fetchImpl, runImpl, timeoutMs })` — the
crate's own injectable-dependency shape
(`packages/agentic-workflow/src/doc/embeddings.mjs:70`, `fetchImpl ?? fetch`);
the bin wires the real fetch/child-process defaults, tests inject fakes plus
millisecond `timeoutMs`, so every test runs with no network, no PATH, no real
engram process. **Fixtures** (obligations O1/O2, all in
`packages/agentic-workflow/test/memory-probe.test.mjs`): `fixture-timeout`
(accepts the connection, never answers, injected 20 ms bound, `degraded` on
`http-health`), `fixture-missing-binary` (`runImpl` ENOENT for `engram`,
`degraded` on `binary-version`), `fixture-missing-runner` (spawn failure,
connection refused, `degraded` on `mcp-runner`/`http-health`), `fixture-stale`
(pending sync work, verdict `degraded` on `sync-staleness`), `fixture-healthy`
(all five checks pass, verdict `ok`).
(validator: `bun run test` exits 0 in packages/agentic-workflow)
  - Relevant files: packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/src/memory/probe.mjs, packages/agentic-workflow/test/memory-probe.test.mjs, packages/agentic-workflow/package.json
- P2 — Canonical memory protocol: write
`skills/unit-lane/references/MEMORY.md` (boundary save payload keyed
`unit/<NN-slug>/doc` at unit start, each phase, close, recall discipline with explicit
`project` + one `all_projects: true` retry, keyword-bound ceiling, explicit
`session_id` / `mem_session_end` only confirmed-stale, degradation recorded
never silent, probe verdict pasted into Evidence) and wire the unit-lane +
execute-phase boundary instructions, budgets re-base, skill version bumps
(validator: `bun scripts/check-skill-context.mjs` exits 0)
  - Relevant files: skills/unit-lane/SKILL.md, skills/unit-lane/references/MEMORY.md, skills/execute-phase/SKILL.md, skills/execute-phase/references/*, docs/workflow/SKILL_CONTEXT_BUDGETS.json
- P3 — log-session states its half of the canonical split (D2: `docs/LOGS.md` =
git-traveling team journal, `mem_session_summary` = unit-keyed local recall)
with the pointer to the protocol; budgets re-base + version bump
(validator: `bun scripts/check-skill-context.mjs` exits 0)
  - Relevant files: skills/log-session/SKILL.md, skills/unit-lane/references/MEMORY.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json
- P4 — pi package provisioning: consent-gated `pi.registerMcpServer` registration
(only when the engram binary is present) reporting exactly what was written,
ask-to-install flow documented as `pi install npm:gentle-engram@latest` only
(never `engram setup pi`), schema pin 4.6.0 → 4.7.0 + lockfile, pi version +
CHANGELOG companion row, package tests
(validator: `bun run test` exits 0 in packages/pi-agentic-workflow)
  - Relevant files: packages/pi-agentic-workflow/src/extension/*, packages/pi-agentic-workflow/src/settings/*, packages/pi-agentic-workflow/README.md, packages/pi-agentic-workflow/package.json, packages/pi-agentic-workflow/bun.lock, packages/pi-agentic-workflow/test/*, CHANGELOG.md
- P5 — init-workspace non-pi provisioning parity: `references/ENGRAM.md`
(detect, ask consent, install guidance, report exactly what was written, skip
on refusal) wired through the skill + bootstrap write; budgets re-base +
version bump
(validator: `bun scripts/check-skill-context.mjs` exits 0)
  - Relevant files: skills/init-workspace/SKILL.md, skills/init-workspace/references/ENGRAM.md, skills/init-workspace/references/BOOTSTRAP_WRITE.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json
- P6 — Verification: whole gate green at head — root suite, skill budgets +
routes, both touched package suites, phase-lint, promise-coherence,
version-parity content + pins, mechanical golden-fixture half (weak-model half
run if the session can spawn it, otherwise disclosed to the owner, never
claimed); Evidence rows for every AC
(validator: `node --test scripts/*.test.mjs` exits 0)
  - Relevant files: scripts/, docs/workflow/SKILL_CONTEXT_BUDGETS.json, packages/agentic-workflow/package.json, packages/pi-agentic-workflow/package.json

### Planning evidence

M-scope home: [`planning-evidence.md`](planning-evidence.md) — 12 rows
(`PE-001`…`PE-012`), bound by the plan snapshot.

### Obligations

M-scope home: [`planning-obligations.md`](planning-obligations.md) — 15 rows
(`O1`…`O15`), one phase and one task each, all `planned` at cut time.

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
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|---|---|---|---|---|
| R1 | `grep -rn -i "engram" skills/ packages/*/src packages/*/README.md` | exit 0, 2 hits | both are path-ignore mentions (`REVIEW_PROCESS.md:95`, `audit-pr/SKILL.md:128`); no protocol/provisioning/health text exists | research step, 2026-10-21 |
| R2 | `engram --version`; `cat ~/.pi/agent/mcp.json`; `grep -n engram ~/.pi/agent/settings.json` | exit 0 | `engram 3.4.0`; `mcpServers.engram` → `/home/agent/.local/bin/engram mcp --tools=agent`; `npm:gentle-engram@latest` | research step, 2026-10-21 |
| R3 | `curl -m4 :7437/health`; `engram doctor`; `engram doctor --json`; `engram sync --status` | curl 0 (HTTP 200); doctor exit 0; JSON `status: error` | server answers today; doctor green-by-exit but 1 error + 1 blocked + 3 warnings; update notice 3.4.0 → 3.5.2 | research step, 2026-10-21 |
| R4 | `engram doctor` finding categories (grep of check ids) | exit 0 | `sync_target_closed_space` error; `ambiguous_active_runtime_sessions`, `unowned_session_project`, `session_project_directory_mismatch` warnings; 9 `foreign_sync_target` rows with unacked mutations | research step, 2026-10-21 |
| R5 | `engram --help`, `engram setup --help`, `engram sync --help`; `grep -n consent skills/init-workspace/SKILL.md skills/init-workspace/references/SERENA.md` | exit 0 | `engram setup <agent> [--protocol=slim\|full]` exists; sync is local-by-default, cloud needs explicit `--project`; init-workspace consent rule + SERENA.md:84 "exactly what was written" is the parity shape | research step, 2026-10-21 |
| R6 | `bun scripts/unit-route.mjs --triage 66-engram-memory-substrate` | exit 0 | 9 steps, full catalog, budget strong (block pasted under Triaged steps) | research step, 2026-10-21 |
| R7 | design provenance search + claim journal (`sources.md`, 22 `INV-*` rows) | exit 0 | greps recorded per row (repo footprint, pi `registerMcpServer` docs, #219 body, prior units); 19 confirmed / 2 inferred / 1 unknown | design step, 2026-10-21 |
| R8 | `node scripts/needs-input.mjs docs/features/66-engram-memory-substrate` | exit 0 | 3 open questions (Q1–Q3), route `design`, continuation `no-decision-available` | design step, 2026-10-21 |
| R9 | `node scripts/needs-input.mjs docs/features/66-engram-memory-substrate` (plan sweep) | exit 0 | `Open questions: 0` / `Decision: none` — empty ask backlog recorded verbatim in `decisions.md` §Plan sweep | plan step, 2026-10-21 |
| R10 | `bun scripts/phase-lint.mjs docs/features/66-engram-memory-substrate/SPEC.md` | exit 0 | `verdict PASS`, fingerprint `e0b6fb80b6bcfab23c0f7ba3c4dc8165e53b6947bb6367fcba332a61a5173efc` (6/6 per phase) | plan step, 2026-10-21 |
| R11 | `bun scripts/unit-route.mjs --triage 66-engram-memory-substrate` (re-run at plan completion) | exit 0 | identical 9-step block — the triage remains current after the plan edits | plan step, 2026-10-21 |
| R12 | `bun scripts/unit-route.mjs --triage 66-engram-memory-substrate` (owner-forced `--retriage`) | exit 0 | identical 9-step block, tiers unchanged — the block above stays authoritative | unit-lane retriage, 2026-10-22 |
| R13 | `curl -m4 :7437/health`; `engram --version`; MCP `initialize` via `engram mcp --tools=agent`; `engram sync --status`; `engram doctor --json --check ambiguous_active_runtime_sessions`; `engram doctor --json --check sync_target_closed_space`; full `engram doctor --json` (repo root + /tmp) | exit 0, timings 0.045 / 0.019 / 0.158 / 0.203 / 0.286 / 0.450 s (full sweep 12.2 s / 23.2 s) | HTTP 200; `engram 3.4.0` in both CLI and serverInfo; sync 15 local / 8 remote / 0 pending; doctor scoped checks sub-second, full sweep slow | plan re-cut (owner `--retriage`), 2026-10-22 |

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
- 2026-10-21 23:40 — plan step: 15 `CLAIM-*` rows swept against the candidate
  sources (1 contradicts candidate resolved at tier 0, recorded), empty ask
  backlog recorded verbatim (R9), phases `P1…P6` cut with validators,
  phase-lint PASS (R10, fingerprint `e0b6fb80…`), ledgers frozen in
  `planning-evidence.md` (12 rows) + `planning-obligations.md` (15 rows),
  roadmap row 66 → `planned`, triage re-run identical (R11); AC digest at plan
  `703a8b9441531593e92eeec6b082612210ef8a5f`; skill-text phase done-whens are
  the budgets gate (content pins live in the obligation greps); gate green at
  plan head — root suite 775/775, promise-coherence PASS (35 checked / 85
  skipped), budgets + routes PASS → evidence: R9–R11 —
  next: /execute-phase 66-engram-memory-substrate P1 (tier: cheap)
- 2026-10-21 23:05 — design stage 4: owner answered Q1–Q3 (ask
  21eda815-41e3-47a8-8ff2-bf010c986f87); `D1`–`D3` appended, ACs 2/3/6
  finalized to the decisions, Future row added, needs-input exits 0 with
  `Open questions: 0` → evidence: decisions.md D1–D3 — next: plan step
- 2026-10-22 13:20 — owner `--retriage`: triage re-run identical (R12); plan
  re-cut of P1 at owner instruction — probe transport (HTTP `:7437` health +
  stdio `engram mcp` initialize + CLI sources), timeout bounds (4 s / 10 s /
  30 s ceiling), injection seam (`runProbe({ fetchImpl, runImpl, timeoutMs })`,
  the `embeddings.mjs:70` shape) and the O1/O2 fixtures named in the task,
  every timing re-measured on this machine (R13); decisions.md records the
  re-cut and the out-of-scope dead pre-write-mapper link → evidence: R12–R13 —
  next: /execute-phase 66-engram-memory-substrate P1 (tier: cheap)

2026-10-22 16:05 — P1 (runner-crate memory probe) implemented: src/memory/probe.mjs with runProbe({fetchImpl, runImpl, timeoutMs}) over the five named checks, the `memory probe` bin subcommand (human block + --json, always exit 0), 17 tests covering the five planned fixtures plus parse/ceiling/read-only contracts, README section, crate 0.3.0→0.4.0 + CHANGELOG rows. Measured end-to-end on this machine (1.4 s, correctly degraded on the known sync_target_closed_space findings) → 58abf268 — next: /execute-phase 66-engram-memory-substrate P2 (tier: cheap)
2026-10-22 16:40 — P2 (canonical memory protocol): skills/unit-lane/references/MEMORY.md is the protocol home (probe, three save boundaries under unit/<NN-slug>/doc, fixed recall order with one all_projects retry, keyword-bound ceiling, session attribution, D2 split, degradation), wired thin into unit-lane (turn box + §5b) and execute-phase (turn box + Post-step item); budgets re-based with declared reasons, unit-lane 2.4.0 / execute-phase 6.2.0 + CHANGELOG rows → commit below — next: /execute-phase 66-engram-memory-substrate P3 (tier: cheap)
## Next

Plan step complete (P1–P6 cut, P1 re-cut 2026-10-22 with transport, timeout
bounds, injection seam and fixtures named — phase-lint re-verified, ledgers
frozen at `planned`): execution hands off one phase per turn.

```text
→ Next: /execute-phase 66-engram-memory-substrate P1 (tier: cheap) — run phase P1; the lane resumes after the last phase
```

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
