---
type: feature
scope: medium
---

# 394 — auto log-session

> One-line: opt-in automatic journal entries from the pi extension — one switch that is off by default, one pure renderer that is the only owner of the entry shape, a deterministic CLI that reproduces an entry without a session, and a publisher Strategy whose second backend is declared in config.

## Issue

[#394](https://github.com/gtrabanco/agentic-workflow/issues/394) — the PR closes it with `Closes #394` in the body. It takes over the scope #186 carried and that was folded into #174 on 2026-09-13; the owner re-homed it on 2026-11-03. Row 39 of [`docs/ROADMAP.md`](../../ROADMAP.md) keeps its number and gains the forward pointer to this unit.

The scope was corrected before the cut: Q0 is answered **no** — the session accumulator was born in #383 (`docs/fix/383-measured-acceptance/`, merged as PR #395) and this unit consumes it (S5a).

## Specs

Requirements in the issue's own numbering and wording, unedited. S6 and S7 are not restated: S5a moved them, with S5's counter set, into #383.

**S1 — Off switch.**
> `autoLogSession` defaults to `off`. When off: no marker written, no entry appended, no publisher invoked, no residue in the project. Enabling it is opt-in per global or project config, same resolution order as model routing (project → global).

**S2 — Programmatic path.**
> No LLM anywhere in the chain. The entry is the output of a pure renderer `renderEntry(facts) → string` over a frozen JSON facts payload, exposed through a deterministic CLI (`<object> <subcommand>`, JSON on stdout, documented exit codes) so a human, a test or a CI job can regenerate and byte-diff an entry without running a session. The renderer and the collector are separate modules: the renderer is testable with zero pi involvement.

**S3 — Pluggable publisher (Strategy).**
> The local append to `docs/LOGS.md` is one strategy; a config-declared publisher is another (external HTTP endpoint, a path outside the repo, a queue, a log sink — the *interface* ships here, not every backend). A publisher receives the same frozen facts payload, never rendered prose it would have to re-parse, so every backend renders identically.

**S4 — Independent switches.**
> Log writing and telemetry are separate switches. Turning the log off keeps the telemetry counters; turning telemetry off keeps the log entry.

**S5 — Content-free telemetry.**
> The counters this unit keeps are numbers only: tokens (input / output / cache), turn count, model time, tool time, peak context size. Never prompt text, model output, diffs, file contents or transcript excerpts. Disabling the log or the console output never disables them; disabling telemetry itself yields **absence**, never an estimate.

**S5a — Scope correction (2026-11-03): the accumulator, the counter set, turn-boundary time and "time never classifies" move to #383; this unit keeps the entry side.**
> Owner decision on this issue's Q0 (verbatim, Spanish): "dentro de #383: #394 solo escribe el log; el acumulador nace en #383 y #394 lo reutiliza después"

**S8 — Entry parity with the template hook.**
> The entry fields are byte-identical to `template/.claude/hooks/log-session-end.sh`'s on the same fixture (`## <iso> — <branch> — auto (<reason>)`, `- **Commits:** n `` `a…b` ``, `- **Files:** …`), pinned by a parity test so the two writers cannot drift.

**S9 — Journal contract.**
> `docs/LOGS.md` is append-only and its own header states it is "pure code output — no model writes it". A second shutdown for the same session id must not append a second entry; a marker left by a crashed session must never be adopted; a missing `LOGS.md` means the project did not opt in and nothing is written.

**S10 — Failure policy.**
> A publisher failure never blocks shutdown and never loses the local entry; retry/queue semantics are declared, not incidental.

**S11 — Events and the marker.**
> `session_start` → marker (`HEAD` sha, branch, epoch). `session_shutdown` → flush exactly one entry and one sample, then remove the marker.

**Owner's words (verbatim, Spanish), as quoted by the issue.**
> - Tiene que poder desactivarse el auto log
> - Tiene que funcionar de manera lo más programática posible
> - Tiene que aceptar plugins o una vía para publicar docs/LOGS.md en un servicio externo, vía plugin, un provider, patron Strategy o similar
> - En caso de desactivar las métricas o conversaciones tiene que seguir guardando las métricas que necesitamos para esta parte del wall-clock que entiendo que hará de clasificador para otras features/issues? Aclárame esto por favor

### Acceptance criteria

One observable criterion per requirement; each names the check that proves it.
The unit-doc shape this tree validates is `spec-by-reference` (issue #308), whose
closed section list retired the legacy `## Acceptance criteria` heading — so the
carrier is this `###` block inside `## Specs`, the same nesting the template uses
for `### Planning evidence` / `### Obligations`. Readers that accept `##`/`###`
(`scripts/promise-coherence.mjs`) find it by name.

- **AC-S1** — A project with `docs/LOGS.md` and no `autoLogSession` writes no marker, no entry and invokes no publisher; a `mechanical` project config writes one. Proved by `auto-log-session-wiring.test.mjs` (`off` case and `mechanical` case) and `auto-log-session-config.test.mjs` (project beats global, absent resolves `off`).
- **AC-S2** — `renderEntry(facts)` is importable with no pi module in its dependency closure, and `agentic-workflow log render --facts <payload>` reproduces the same bytes with exit 0, refusing a malformed payload with exit 2. Proved by `log.render.test.mjs`, and by `rg -c '@earendil-works' packages/agentic-workflow/src/log/render.mjs` → no match.
- **AC-S3** — A config-declared command publisher receives the frozen payload as JSON on stdin, byte-identical to the payload the journal strategy received, and the journal entry is still written when that command fails. Proved by `log.publish.test.mjs` and `auto-log-session-wiring.test.mjs`.
- **AC-S4** — With telemetry on and the log off, the ledger row is written and no entry appears; with the log on and telemetry off, the entry appears and no ledger row is. Proved by the two-case matrix in `auto-log-session-wiring.test.mjs`.
- **AC-S5** — The payload carries exactly the frozen key set and the rendered entry contains no prompt text, model output, diff or file content. Proved by the key-set assertion in `log.render.test.mjs` and the content-free assertion in `auto-log-session.test.mjs`.
- **AC-S5a** — The wiring reads the #383 accumulator and adds no counter of its own. Proved by `rg -c 'createSessionTelemetry|onTurnEnd' packages/pi-agentic-workflow/src/extension/auto-log-session-wiring.ts` → no match.
- **AC-S8** — On one fixture repository with one marker, the hook's appended bytes and the renderer's entry are identical. Proved by `auto-log-session-parity.test.mjs`.
- **AC-S9** — A missing `docs/LOGS.md` writes nothing; a second shutdown appends nothing; a marker written by another session id is never adopted. Proved by three cases in `auto-log-session-wiring.test.mjs`.
- **AC-S10** — A publisher that throws or exits non-zero leaves the local entry in place, reports the failure and never propagates out of the shutdown handler. Proved by `log.publish.test.mjs` and the wiring case.
- **AC-S11** — `session_start` writes `.pi/.session-<id>.start` with `<sha> <epoch> <iso>`, and `session_shutdown` removes it after appending. Proved by `auto-log-session.test.mjs` (marker store) and the wiring case.

## Impact

- **Consumes:** `packages/pi-agentic-workflow/src/session-telemetry.ts` (#383's accumulator) — read, never re-implemented: S4 only holds if the two switches are two wirings over one accumulator. The runner crate (`@gtrabanco/agentic-workflow`), which the pi package already declares as a dependency, as the home of the pure renderer and the CLI.
- **Consumed by:** #383's `tier-cost@1` ledger keeps its own wiring untouched; `docs/LOGS.md` gains a third sanctioned writer (the pi extension) beside `/log-session` and the template hook; the template's Claude Code hooks stay the non-pi path and become the parity oracle this unit's test executes.
- **Stops being true:** `docs/LOGS.md`'s header says the interim append-only rule holds "until feature 41's `autoLogSession: mechanical`" — feature 41 (#174) dropped that half and this unit ships it; `packages/pi-agentic-workflow` has no `autoLogSession` surface and no journal writer at all.
- **Asks before touching something live:** nothing outside this repository — the extension is opt-in and off by default, so no installed project starts writing. The repo's own dogfooding opt-in is a **post-release** step: repo sessions consume the installed release, not the working copy.

## Retirements

| Retired surface | Replacement | Pin |
|---|---|---|
| `docs/LOGS.md` header: "The interim rule (until feature 41's `autoLogSession: mechanical`)" | the switch this unit ships, named by unit and mode | `rg -c "until feature 41's" docs/LOGS.md` → no match |
| `src/extension/telemetry-wiring.ts` carrying the log hook (`createPublisher`, `collectGitFactsForPublisher`, `autoLogSession` option) | its own `auto-log-session-wiring.ts`, registered independently (S4) | `rg -c "autoLogSession\|createPublisher" packages/pi-agentic-workflow/src/extension/telemetry-wiring.ts` → no match |
| the abandoned `src/extension/auto-log-session-renderer.ts` / `auto-log-session-publisher.ts` / empty `src/extension/auto-log-session/` (uncommitted) | the crate's `src/log/render.mjs` + `src/log/publish.mjs`, one owner for the shape | `rg -c "renderSessionEntry" packages/pi-agentic-workflow/src` → no match |

Nothing else can be removed: the template hook and `scripts/session-close.mjs` keep their own behaviour (S8 makes the hook the oracle; `session-close`'s `--kind auto` branch is unused by any skill and is recorded as a known pre-existing divergence, not converged here — its own test pins that shape).

## Non-goals

- No narrative prose: `/log-session` stays the only writer of Summary / Decisions / Next, so the mode vocabulary is `off | mechanical` — there is no `rich` mode (an earlier draft invented one; the issue's non-goals forbid it).
- No conversation capture, no transcript storage, no diff capture.
- No new risk tier and no change to the classifier.
- No re-implementation of #174's state-flow lifecycle, and no counter of our own (S5a).
- No auto-commit of the entry (append only; the commit rides the next commit or the user decides).
- No bundled publisher backend: the interface plus the config-declared command ships; an HTTP client, SDK or queue binding does not.

## Risk tier

Computed, never chosen: `bun scripts/ceremony.mjs tier classify --base main` → `tier: standard`, `reason_kind: executable-content`, `signals: []`.

- **Tier** — `standard` · **Task Size** — `understood: true`, `contained_risk: contained`, `resumable_from_diff: true`, `ceremony: unit-doc`, `verification: gates`
- **Named high-risk item** — none — not a high-tier unit

## Future

- **2026-11-04** — Converge the three entry writers on one shape: `scripts/session-close.mjs --kind auto` still renders `## <iso> — <branch> — auto` with `- **Commits:** n (\`a…b\`)` (parenthesised, no reason) while the hook — this unit's oracle — renders `auto (<reason>)` with a bare range. No skill passes `--kind auto` today, so nothing reads the divergent branch. `open`. Re-trigger: the first skill that calls `render --kind auto`, or a review that finds a journal entry rendered two ways.
- **2026-11-04** — A redaction policy for publishers, if a bundled backend ever ships: today the frozen payload carries the changed-path list and the operator decides which destination receives it (Q4). `open`. Re-trigger: an SDK/HTTP backend lands in this package.
- **2026-11-04** — Filter the shutdown reason if `reload`/`new`/`resume` entries turn out to be noise: the contract says one entry per `session_shutdown` and records its reason, so nothing is filtered here. `open`. Re-trigger: a journal with more `auto (reload)` lines than sessions.

## Future cost

- Every new field of the frozen facts payload binds three readers at once — `src/log/render.mjs`, the CLI's `--json` receipt and the parity test against the hook. The payload is frozen at `log-facts@1` for that reason: a field added casually breaks S8 for every project.
- The template hook is a test oracle now: changing its output (reformatting, adding a line) reds `auto-log-session-parity.test.mjs` in this repository, which is the point, but the change must land with its own parity refresh.

## Applicable tests

- `bun test packages/agentic-workflow/test/log.render.test.mjs` — the facts contract, the entry bytes, the refusals.
- `bun test packages/agentic-workflow/test/log.publish.test.mjs` — the journal strategy, the config-declared command strategy, the never-throwing fan-out, the payload a publisher receives.
- `bun test packages/pi-agentic-workflow/test/auto-log-session.test.mjs` — facts building and the marker store, with no pi and no live session.
- `bun test packages/pi-agentic-workflow/test/auto-log-session-config.test.mjs` — the flag, its strict schema and the project → global resolution.
- `bun test packages/pi-agentic-workflow/test/auto-log-session-wiring.test.mjs` — the event wiring: off registers nothing, one entry per shutdown, the independence matrix, a publisher failure, a crashed marker.
- `bun test packages/pi-agentic-workflow/test/auto-log-session-parity.test.mjs` — byte parity with `template/.claude/hooks/log-session-end.sh`, and CLI-vs-extension parity over one frozen payload.

## Known pre-existing issues

- `scripts/session-close.mjs`'s `--kind auto` shape differs from the hook's — `does-not-affect` this unit (nothing calls it; the divergence is in `## Future` with its re-trigger).
- `docs/fix/383-measured-acceptance/SPEC.md` carries a retirement pin whose expected output was `rg -c 'session_shutdown\|autoLogSession' packages/pi-agentic-workflow/src` → 0. That row recorded that unit's state at its cut; after this unit the command answers 2. `does-not-affect`: it is a frozen historical record of a merged unit, not a gate this repository re-runs.
- `packages/pi-agentic-workflow/src/extension/telemetry-wiring.ts` is not a pi event *type* consumer (it is a factory over a `pi`-shaped object) — unchanged, `does-not-affect`.
- **The guide-layer budget is red before this unit.** `node scripts/check-skill-context.mjs --documents` answers `AGENTS.md: estimate 6884 > 6881` at the base commit `c8b64d0b` as well as at this head (the same command, same numbers, run in both trees). `does-not-affect` this unit — no guide-layer file is touched here — but it reds `scripts/check-skill-context.test.mjs` in the root suite, so the gate's red is reported rather than excused. Repairing it is a `budgets` re-base with its growth source, or 3 estimate points of `AGENTS.md` prose removed, and both are the owner's call on a surface this unit does not own.

## Tasks

- [x] P1 — Crate: the pure renderer `renderEntry(facts)` and the frozen `log-facts@1` payload contract, one owner for the entry shape (validator: `bun test packages/agentic-workflow/test/log.render.test.mjs` exits 0)
  (Implements: S2, S5, S8)
  Relevant files: packages/agentic-workflow/src/log/render.mjs, packages/agentic-workflow/test/log.render.test.mjs
- [x] P2 — Crate: the `log render` subcommand — JSON on stdout, `--raw` for the byte diff, documented exit codes (validator: `bun test packages/agentic-workflow/test/log.render.test.mjs` exits 0 and `bun packages/agentic-workflow/bin/agentic-workflow.mjs log render --facts /dev/null` exits 2)
  (Implements: S2)
  Relevant files: packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/README.md
- [x] P3 — Crate: the publisher Strategy — the journal append, the config-declared command, the never-throwing fan-out (validator: `bun test packages/agentic-workflow/test/log.publish.test.mjs` exits 0)
  (Implements: S3, S10)
  Relevant files: packages/agentic-workflow/src/log/publish.mjs, packages/agentic-workflow/test/log.publish.test.mjs
- [x] P4 — Pi: the frozen facts builder and the marker store, pi-free (validator: `bun test packages/pi-agentic-workflow/test/auto-log-session.test.mjs` exits 0)
  (Implements: S5, S11)
  Relevant files: packages/pi-agentic-workflow/src/auto-log-session.ts, packages/pi-agentic-workflow/test/auto-log-session.test.mjs
- [x] P5 — Pi: the `autoLogSession` flag — mode, declared publisher, strict schema, project → global merge, `off` default (validator: `bun test packages/pi-agentic-workflow/test/auto-log-session-config.test.mjs` exits 0)
  (Implements: S1)
  Relevant files: packages/pi-agentic-workflow/src/config/types.ts, packages/pi-agentic-workflow/src/config/schema.ts, packages/pi-agentic-workflow/src/config/merge.ts, packages/pi-agentic-workflow/src/config/defaults.ts, packages/pi-agentic-workflow/test/auto-log-session-config.test.mjs
- [x] P6 — Pi: the session wiring — marker on start, exactly one entry at shutdown, nothing at all when off (validator: `bun test packages/pi-agentic-workflow/test/auto-log-session-wiring.test.mjs` exits 0)
  (Implements: S1, S4, S9, S11)
  Relevant files: packages/pi-agentic-workflow/src/extension/auto-log-session-wiring.ts, packages/pi-agentic-workflow/test/auto-log-session-wiring.test.mjs
- [x] P7 — Pi: register the wiring in the extension, independently of the telemetry wiring, and take the log hook out of `telemetry-wiring.ts` (validator: `rg -c "auto-log-session-wiring" packages/pi-agentic-workflow/src/extension/index.ts` matches 1 and `rg -c "autoLogSession|createPublisher" packages/pi-agentic-workflow/src/extension/telemetry-wiring.ts` exits 1)
  (Implements: S4)
  Relevant files: packages/pi-agentic-workflow/src/extension/index.ts, packages/pi-agentic-workflow/src/extension/telemetry-wiring.ts
- [x] P8 — Parity: the test that runs `template/.claude/hooks/log-session-end.sh` for real and diffs its appended bytes against the renderer's, plus the CLI-vs-extension pin over one payload (validator: `bun test packages/pi-agentic-workflow/test/auto-log-session-parity.test.mjs` exits 0)
  (Implements: S8)
  Relevant files: packages/pi-agentic-workflow/test/auto-log-session-parity.test.mjs
- [x] P9 — Docs: the crate README's `log` row, the pi README's switch section, the `docs/LOGS.md` header correction, row 39's forward pointer and the changeset (validator: `bun scripts/version-parity-gate.mjs` exits 0 and `rg -c "until feature 41's" docs/LOGS.md` exits 1)
  (Implements: S1, S2, S3)
  Relevant files: packages/agentic-workflow/README.md, packages/pi-agentic-workflow/README.md, docs/LOGS.md, docs/ROADMAP.md, .changeset/394-auto-log-session.md
- [x] P10 — Verification: both package suites, the root suite and the context budgets in the foreground (validator: `bun scripts/run-root-suite.mjs` exits 0 and `bun run --cwd packages/pi-agentic-workflow test` exits 0)
  (Implements: S1, S2, S3, S4, S5, S8, S9, S10, S11, S5a)
  Relevant files: packages/agentic-workflow/test/log.render.test.mjs, packages/agentic-workflow/test/log.publish.test.mjs, packages/pi-agentic-workflow/test/auto-log-session.test.mjs

### Planning evidence

The ledger lives beside this document: [`planning-evidence.md`](planning-evidence.md) (M/L unit — never both homes).

### Obligations

The ledger lives beside this document: [`planning-obligations.md`](planning-obligations.md) (M/L unit — never both homes).

## Triaged steps

<!-- pasted verbatim from `bun scripts/unit-route.mjs --triage 394-auto-log-session` after the frontmatter landed -->

```text
TRIAGE — 394-auto-log-session (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
```

The owner's inline protocol for this change supersedes two catalog steps for this
run, and the substitution is recorded rather than silently applied: `design`,
`plan` and `review` are not run as separate steps (the requirements are the
issue's own text and the owner reviews the diff himself — no `review-change`, no
`audit-pr`, no fold cycle on this change), and `release` runs as P9's changeset
plus the roadmap settle after the owner opens the PR.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-04, the request, verbatim:
  ```
  Apply to this repository: issue #394

  This is a **local, unpublished** workflow for changing agentic-workflow itself. The failure it prevents: the workflow judging its own surgery (unit fix-258 burned 12 review→fold cycles that way). Follow this order, every step: …
  ```
  Carried with it, verbatim from the issue: `S1`–`S5`, the 2026-11-03 scope amendment, the mechanics bullets and the owner's four Spanish lines (all quoted in `## Specs`).
- **D1** — 2026-11-04, owner decision recorded on the issue (2026-11-03 amendment): Q0 is **no** — the accumulator is #383's, this unit consumes it (S5a). Authority: the issue comment.
- **D2** — 2026-11-04, Q1 (marker home) resolved to `.pi/.session-<id>.start`: the package's own project directory is `.pi/` (`src/config/load.ts:31-32`) and the Claude hook owns the `.claude/.session-*` namespace, so sharing it would let one writer's crashed marker be read by the other. The issue's own lean ("parity can be satisfied on the *entry* while the marker stays internal") is the authority.
- **D3** — 2026-11-04, Q2 (publisher contract) resolved to **mirror**: the local entry is written first and publishers are copies, because S10 says a publisher failure never loses the local entry — a replace contract would lose it by construction.
- **D4** — 2026-11-04, Q3 (transport) resolved to a **config-declared command** (`command: string[]`, facts JSON on stdin, `timeoutMs`), no bundled SDK: S3 says the interface ships here, not every backend, and a declared command reaches an HTTP endpoint, a queue, a path outside the repo or a log sink with `curl`/`tee`/a queue CLI.
- **D5** — 2026-11-04, Q4 (privacy) resolved to **paths travel in the frozen payload**: S3 requires every backend to render identically from the same payload, so a second redacted shape would be a second grammar. The destination is operator-declared and opt-in per project; a redaction policy is in `## Future` with its re-trigger.
- **D6** — 2026-11-04, Q5 (version floor) resolved to **no bump**: this unit uses `session_start`, `session_shutdown` and git — no `Usage.cost`, no `turn_*` event of its own — and #383 already verified the floor at Pi 1.1.0 for `tool_execution_end.durationMs` (`docs/LOGS.md`, 2026-11-03 entry, decision 5). Raising it would drop consumers for no surface.
- **D7** — 2026-11-04, the mode vocabulary is `off | mechanical` and the prior draft's `rich` is dropped: the issue's non-goals reserve narrative prose for `/log-session`, and row 39 states `autoLogSession: off|mechanical`.
- **D8** — 2026-11-04, the renderer and the publisher interface live in the runner crate (`@gtrabanco/agentic-workflow`), not in the pi package: S2 needs a CLI, the crate is the shipped home of `<object> <subcommand>` deterministic commands, the pi package already depends on it and cannot be imported by it, and one owner for the entry shape means one module — not a mirror plus a parity test.
- **D9** — 2026-11-04, `template/.claude/hooks/log-session-end.sh` is the parity **oracle**: the test executes it in a throwaway repository and diffs its appended bytes, so the prose about parity cannot drift from the script.
- **D10** — 2026-11-04, `docs/LOGS.md`'s header parenthetical ("until feature 41's `autoLogSession: mechanical`") is repaired in place: it is a header sentence, not a journal entry — the append-only rule governs entries, and a wrong header is documentation currency (AGENTS.md §Working rules).

- **D11** — 2026-11-04, the entry is appended on every `session_shutdown` with its `reason` recorded (no filter on `reload`/`new`/`resume`): the mechanics bullet says one entry per shutdown, and a filter would be an invented rule. A reason filter is in `## Future` with its re-trigger.
- **P1** — 2026-11-04 15:20, the crate's renderer, its frozen payload and the `log render` CLI, plus the publisher Strategy — `render.mjs`, `publish.mjs`, their type projections, the CLI route and the crate README row · `ad5a2b3f` (suites landed red first in `92d48e85`).
- **P2** — 2026-11-04 15:31, the crate's publisher Strategy — the journal append, the config-declared command and the never-throwing fan-out (`publish.mjs`, its type projection; the run is `E2`) · `573d3b0c` (suite landed red first in `5fd4440a`).
- **P3** — 2026-11-04 15:31, the pi side: the facts builder and the marker store, the `autoLogSession` switch with its strict schema and merge, the independent session wiring, and the registration in `index.ts` (the runs are `E3`–`E5`, `E8`, `E9`) · `573d3b0c` (suite landed red first in `2b5df9d0`).
- **P4** — 2026-11-04 15:44, the defect the first green run exposed: `git`'s porcelain output was trimmed, which shifted every path one character left (`docs/LOGS.md` → `ocs/LOGS.md`), and the `.pi/` marker directory appeared in the entry's own file list. The reader stopped trimming, and `collectFiles` now filters this package's own bookkeeping.
- **E1** — 2026-11-04, `bun test test/log.render.test.mjs` in `packages/agentic-workflow` · exit 0 · `17 pass · 0 fail`.
- **P5** — 2026-11-04 15:31, the `autoLogSession` flag — mode, declared publisher, strict schema, project → global merge, `off` default (the run is `E4`) · `573d3b0c`.
- **E2** — 2026-11-04, `bun test test/log.publish.test.mjs` in `packages/agentic-workflow` · exit 0 · `11 pass · 0 fail`.
- **E3** — 2026-11-04, `bun test test/auto-log-session.test.mjs` in `packages/pi-agentic-workflow` · exit 0 · `11 pass · 0 fail` (the marker round trip `AM-02`, the foreign marker `AM-03`, the frozen payload `AM-07`).
- **E4** — 2026-11-04, `bun test test/auto-log-session-config.test.mjs` in `packages/pi-agentic-workflow` · exit 0 · `7 pass · 0 fail`.
- **E5** — 2026-11-04, `bun test test/auto-log-session-wiring.test.mjs` in `packages/pi-agentic-workflow` · exit 0 · `11 pass · 0 fail` (the `off`, one-entry, second-shutdown, no-journal, foreign-marker, publisher-failure and S4 matrix cases).
- **E6** — 2026-11-04, `bun test test/auto-log-session-parity.test.mjs` in `packages/pi-agentic-workflow` · exit 0 · `4 pass · 0 fail` — `AP-01`/`AP-02` run `template/.claude/hooks/log-session-start.sh` and `log-session-end.sh` for real and compare the appended bytes, `AP-03` pins CLI-vs-extension, `AP-04` pins the marker's own namespace.
- **E7** — 2026-11-04, `rg -c "@earendil-works" packages/agentic-workflow/src/log/render.mjs` · exit 1 · no match (the renderer has no pi in its closure).
- **E8** — 2026-11-04, `rg -c "createSessionTelemetry|onTurnEnd" packages/pi-agentic-workflow/src/extension/auto-log-session-wiring.ts` · exit 1 · no match (the log adds no counter; the accumulator is #383's).
- **E9** — 2026-11-04, `rg -c "auto-log-session-wiring" packages/pi-agentic-workflow/src/extension/index.ts` · exit 0 · `1`, and `rg -c "autoLogSession|createPublisher" packages/pi-agentic-workflow/src/extension/telemetry-wiring.ts` · exit 1 · no match (two switches, two wirings).
- **E10** — 2026-11-04, `node packages/agentic-workflow/bin/agentic-workflow.mjs log render --facts <fixture> --json` · exit 0 · `{"ok":true,"contract":"log-entry@1","facts":"log-facts@1","entry":"## 2026-11-04T15:12Z — …`.
- **E11** — 2026-11-04, `node packages/agentic-workflow/bin/agentic-workflow.mjs log render --facts /dev/null` · exit 2 · `LOG REFUSAL — the facts payload is not JSON: Unexpected end of JSON input`.
- **E12** — 2026-11-04, `rg -c "until feature 41's" docs/LOGS.md` · exit 1 · no match (the retired interim rule).
- **E13** — 2026-11-04, differential against the base commit `c8b64d0b` (a source-only copy in `/tmp`): `agentic-workflow unit-doc 103-doc-currency validate`, `roadmap check docs/features/103-doc-currency/SPEC.md` and `memory probe --json` are byte-identical at base and head; the only difference is the intended `log` in the usage line (`…|doc|memory>` → `…|doc|memory|log>`).
- **E14** — 2026-11-04, `node scripts/check-skill-context.mjs --documents` at the base commit `c8b64d0b` · exit 1 · `AGENTS.md: estimate 6884 > 6881` — the guide-layer red predates this unit (recorded under `## Known pre-existing issues`).
- **G1** — 2026-11-04, `bun run test` in `packages/pi-agentic-workflow` · exit 0 · `526 pass · 0 fail` across 46 files (base `c8b64d0b`: 493 across 42).
- **G2** — 2026-11-04, `bun test test/` in `packages/agentic-workflow` · exit 0 · `287 pass · 0 fail` across 15 files (base: 260 across 13).
- **G3** — 2026-11-04, `node scripts/run-root-suite.mjs` · exit 1 · `tests 1524 · pass 1521 · fail 2 · skipped 1` — both failures are `scripts/check-skill-context.test.mjs`'s guide-layer ceiling, reproduced at the base commit (E14). Nothing else red.
- **G4** — 2026-11-04, `node scripts/version-parity-gate.mjs --content --base main` · exit 0 · `VERDICT: PASS` (changeset route for both packages), and `--pins` · exit 0 · `VERDICT: PASS`.
- **G5** — 2026-11-04, `node scripts/check-skill-context.mjs` (skills only) · exit 0 · `PASS context budgets: 28 skills`.
- **G6** — 2026-11-04, `node scripts/phase-lint.mjs docs/features/394-auto-log-session/SPEC.md` · exit 0 · `P1…P10 Phase-lint: PASS (6/6)` · `verdict PASS`.
- **G7** — 2026-11-04, `node packages/agentic-workflow/bin/agentic-workflow.mjs unit-doc 394-auto-log-session validate` · exit 0 · `{"ok": true, "violations": []}`, and `roadmap check docs/features/394-auto-log-session/SPEC.md` · exit 0 · `ok: true`, no violations.
- **G8** — 2026-11-04, `node scripts/unit-lineage.mjs --unit 394-auto-log-session` · exit 0 · `LINEAGE OK — lane-era (triage block re-derives) · obligations closed (19)`.
- **P6** — 2026-11-04 15:52, the session wiring: the marker on start, exactly one entry at shutdown and nothing at all when off (the run is `E5`) · `573d3b0c`.
- **P7** — 2026-11-04 15:58, the wiring registered in `index.ts` independently of the telemetry wiring, and the log hook taken out of `telemetry-wiring.ts` (the run is `E9`) · `573d3b0c`.
- **P8** — 2026-11-04 16:00, the byte-parity test against `template/.claude/hooks/log-session-end.sh` (the run is `E6`) · `573d3b0c`.
- **P9** — 2026-11-04 16:02, docs currency: the crate README's `log` row, the pi README's switch section, the `docs/LOGS.md` header correction, row 39's forward pointer and the changeset · `573d3b0c`.
- **P10** — 2026-11-04 16:06, the release step: the branch was rebased onto `main` at `92715797` (one docs commit had landed; no conflict — my edit is the journal header, main's is an appended entry), pushed, and PR [#401](https://github.com/gtrabanco/agentic-workflow/pull/401) opened with `Closes #394`. Roadmap row 394 settled to `done · [#401](…)` through the crate's writer (`roadmap rowUpsert` receipt pass, `07ecc0ee` → `dcd1dc61`) · settle commit follows this line.
- **G9** — 2026-11-04, `node scripts/roadmap-settle.mjs` · exit 0 · `131 unit docs checked · verdict: PASS`, and `roadmap check docs/features/394-auto-log-session/SPEC.md` · exit 0 · `ok: true`, no violations.
- **L2** — 2026-11-04, the external-verification correction round (one batch, owner-directed): the surviving "until feature 41's `autoLogSession: mechanical`" mention in `skills/execute-phase/SKILL.md`'s forbidden list was rewritten to name the shipped switch (#394) — the first repair had missed the sibling because PE-012 wrongly asserted `docs/LOGS.md` carried the only such prose (PE-012 corrected in place, history kept in the row); the guide-layer budget red was repaired by removing the redundant "(a PR's base is always `main`)" restatement from `AGENTS.md` §Working rules; dated reconciliation notes (frozen records kept, never rewritten) were added to `docs/fix/318-class-escalation-forward-closure/SPEC.md` and `docs/fix/383-measured-acceptance/SPEC.md`; and the pi README now states the two by-design silent refusals (non-git project, mid-session journal creation). Evidence: `E15`–`E17`.
- **E15** — 2026-11-04, `rg -n "until feature 41" docs/LOGS.md skills/ docs/features -g '!docs/features/394-auto-log-session/**'` · exit 1 · no match — no live prose surface carries the retired framing; the only remaining matches are the unit's own record (which names the phrase to pin its absence) and the frozen fix records (318, 383) with their reconciliation notes.
- **E16** — 2026-11-04, `node scripts/check-skill-context.mjs --documents` · exit 0 · PASS — the guide-layer red (AGENTS.md 6884 > 6881) is closed, so the root suite's only failures are gone.
- **E17** — 2026-11-04, `node scripts/run-root-suite.mjs` · exit 0 · `fail 0` (first fully green root gate on this branch; `bun scripts/skill-lint.mjs` clean, both package suites green, `check-skill-context` 28 skills PASS).
- **L3** — 2026-11-05, correcting line for `E15` (kept, never rewritten): the sweep's "no match" stopped holding the moment this log itself was appended — `docs/LOGS.md` now carries a journal entry quoting the retired phrase (line 4224), so the bare `rg` over the journal matches again. The retirement pin is unaffected (`rg -c "until feature 41's" docs/LOGS.md` still exits 1) and the quote is an append-only historical record, not live prose; the honest command for the sweep is the pin, or the sweep minus the journal.
- **P11** — 2026-11-05, the external-verifier repair round: `main` merged in (union of both journals, both roadmap rows; no rebase — the branch timeline is preserved), and the one code advisory was closed red-first: a shutdown `reason` outside the renderer's lowercase-token grammar is normalized to `unknown` at the wiring boundary instead of being refused at the renderer and costing the local entry (`test` commit then `fix` commit, suite 528 pass · 0 fail).

## Next

External verification of PR [#401](https://github.com/gtrabanco/agentic-workflow/pull/401) — the owner is the verifier; nothing here self-approves. The PR was opened against `main` after a clean rebase onto `92715797`, and roadmap row 394 is settled (`done · [#401](…)`, `bun scripts/roadmap-settle.mjs` → `verdict: PASS`).

## References

- Issue [#394](https://github.com/gtrabanco/agentic-workflow/issues/394) — the requirement text quoted above, the 2026-11-03 scope amendment and the 2026-11-04 triage verdict.
- Issue [#383](https://github.com/gtrabanco/agentic-workflow/issues/383) / `docs/fix/383-measured-acceptance/` — the accumulator this unit consumes (S5a).
- Row 39 of [`docs/ROADMAP.md`](../../ROADMAP.md) — `pi-auto-log-session`, kept with its `folded → 41` history and the forward pointer to this unit.
- `template/.claude/hooks/log-session-end.sh` — the non-pi writer and this unit's parity oracle.
- `scripts/session-close.mjs` — the mechanical close (`render`/`close`) `/log-session` uses; unchanged by this unit.
