---
type: fix
scope: small
ac-hash: ad82f8be6d4c7c7913cd4652bbc57919404872099c1bdcc650c83d56138db2ff
roadmap_summary: Issue [#538](https://github.com/gtrabanco/agentic-workflow/issues/538): the Engram startup report printed a remediation advisory on every session start, healthy installs included — the module now decides consent × runtime health: a healthy opted-in install is silent, a broken one reports one `error` naming the resolution that failed (`PATH` / `ENGRAM_BIN` / `ENGRAM_URL`) with its repair routes and the binary-vs-served version check, and the opt-out stays quiet.
---

# fix/538-engram-startup-report

> Fix specification — one single unit document. Applied through the owner's local
> unpublished workflow (§5 ledger freeze substitutes for the lane's plan step); no
> repo review/fold machinery runs on this change. XS/S sizing: the two planning
> ledgers are embedded below, never a sibling file.

## Issue

`#538` — "engram startup report prints remediation guidance when memory is not
broken". The PR closes it via `Closes #538`.

## Specs

**S1 — Apply the issue through the owner's local workflow.**
> Apply to this repository: issue #538

**S2 — A healthy opted-in install says nothing.**
> With memory resolvable and opted-in: **no startup message**.

**S3 — An opted-in broken runtime is one error naming the failed resolution and its repair route.**
> When opted-in and the runtime is broken: one error naming the exact failed resolution and the repair route (including the binary-vs-served version pair).

**S4 — A session without the opt-in says nothing.**
> When not opted-in: silence.

**S5 — Retiring the opt-in guidance row is the decision, not a side effect.**
> The current messages fold all three into one advisory, and losing the opt-in guidance row (today: "set memory.engram in agentic-workflow.json to opt in") is part of the decision, not a side effect.

**S6 — The `native-active` branch must decide on `binaryPath`, not on `ENGRAM_URL` alone.**
> its `native-active` branch consults only whether `ENGRAM_URL` is set to choose between two messages — it holds `binaryPath` in its inputs and does not consult it

**S7 — Broken-state evidence names *which* resolution failed, never a catch-all.**
> the same day a second incident (stale 3.6.0 server running from a deleted binary) proved the broken-state message must carry *evidence* (which resolution failed: binary absent/unresolvable, server down, version pair mismatch), not a generic catch-all.

**S8 — Consent × runtime health replaces the folded advisory.**
> The report semantics need the consent × runtime-health state machine decided in triage: **healthy + opted-in → silence; opted-in + broken → error with evidence (what failed, which route repairs it); not opted-in → silence** (an operator who does not want memory owes it nothing).

## Impact

- `packages/pi-agentic-workflow/src/extension/engram.ts` — the module that owns
  every provisioning decision. Gains the report's notification axis (`notice`),
  the session's `ENGRAM_BIN` as an input (S7's "absent vs unresolvable"), the
  health branch inside `native-active` (S6), one shared evidence builder for the
  unresolved substrate (S3/S7), and the `binary-missing` / `config-invalid` /
  `unsupported-host` levels (S3). The `message` field becomes "what an operator
  would read back", empty when the state says nothing (S2).
- `packages/pi-agentic-workflow/src/extension/index.ts` — the module's only
  consumer. It passes the session's `ENGRAM_BIN` and prints `report.message` at
  `report.notice`; the status-keyed `INFORMATIONAL_ENGRAM` set retires (S8).
  Verified consumer surface: `rg -n 'provisionEngram|EngramReport' packages skills
  docs` names `src/extension/index.ts` and the two suites below, nothing else.
- `packages/pi-agentic-workflow/test/engram-provision.test.mjs` — the pure
  contract: the silent healthy state (S2), the two broken states and their
  evidence (S3/S7), the per-status `notice` values (S8), and the behaviours that
  stay correct (S2's `registered`/`external-server`/`already-declared`).
- `packages/pi-agentic-workflow/test/shipped-adapter.test.mjs` — the shipped
  entry through Pi's double: the S2 reproducer end to end (a healthy native
  install triggers no `notify`), the broken state's single `error`, the opt-out's
  silence, and the untrusted-project case where the MCP path is the only one.
- `packages/pi-agentic-workflow/README.md` — the situation table's native row and
  the informative-versus-warning paragraph describe the old advisory; both are
  superseded (S3/S8).
- Repository state: the roadmap `## Fixes` row, the changeset intent, the
  rendered projection and the session journal entry ship in the same change.

## Retirements

- The `INFORMATIONAL_ENGRAM` set in `src/extension/index.ts` retires: the level
  now belongs to the outcome the module decides, so the adapter holds no status
  list. `rg -c 'INFORMATIONAL_ENGRAM' packages/pi-agentic-workflow/src` → 0 after
  this change.
- The native branch's two `memory` sentences retire — `Memory is served by the
  external Engram server ${ENGRAM_URL_VAR} names.` and `If memory is not working,
  put the "engram" core binary on PATH or set ENGRAM_BIN …`. They carry the
  advisory S2 retires, and the healthy native state now says nothing.
- Requirement 531 O8's assertion (`the overlap message carries "served by the
  external Engram server"`) is **superseded for the native branch**: S2/S8 make
  the healthy native state silent. The external-server fact keeps its own
  `external-server` status and its line for every host without the native
  package (531 AC2/AC4 unaffected). Recorded as `D3` so the supersession is a
  decision, not a test edited to pass.
- The leftover `mcpServers.engram` callout moves from the `native-active` info
  line to its own `warning` report: it is the one thing that still breaks
  native-only writes (531's own reasoning) and a healthy-but-conflicting install
  is not information.
- The `binary-missing` refusal's text retires: it named the three surfaces but
  never said which resolution failed, never quoted `ENGRAM_BIN`'s state, and
  never named the binary-vs-served version pair (S3/S7). Its replacement is the
  shared evidence builder.
- No export, file or helper is deleted beyond `INFORMATIONAL_ENGRAM`; the
  statuses themselves and every resolution reader stay.

## Non-goals

- No session-start probe. "Server down" and "version pair mismatch" are not
  observable without an `engram --version` process and a `GET /health` request at
  every session start; this repository already owns a bounded probe for the first
  memory read (`packages/agentic-workflow/src/memory/probe.mjs`, five checks, 30 s
  ceiling) and the research inventory assigns the version pair to the doctor
  feature (`docs/research/2026-11-13-tool-doctor-inventory.md`, row 8). S3's
  version pair is therefore **named as a check to run**, with its commands, and
  never claimed as measured. Carried as an assumption in the owner's answer
  (`D2`); overrule in one line if the probe is wanted.
- No change to `registered`, `external-server` or `already-declared`: the owner's
  answer (`D1`) keeps their lines. S8's "healthy → silence" is applied to the
  healthy **native** state, which is the state the issue reports.
- No change to the `not-consented` message text. The adapter has not printed it
  since 531, so S5's "losing the opt-in guidance row" is the printed surface and
  the row 531 S3a corrected stays green (`D4`).
- No config key for any of this: `memory` keeps `{ engram: boolean }`.
- No deregistration of an operator's `mcpServers.engram` entry, and no change to
  the native-package detection, the two `settings.json` scopes or the binary
  lookup's `ENGRAM_BIN` semantics.

## Risk tier

- **Tier** — `standard` · **Task Size** — `understood + contained + resumable`
- **Named high-risk item** — `none — not a high-tier unit`

Verdict (`bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier
classify --paths packages/pi-agentic-workflow/src/extension/engram.ts,packages/pi-agentic-workflow/src/extension/index.ts,packages/pi-agentic-workflow/test/engram-provision.test.mjs,packages/pi-agentic-workflow/test/shipped-adapter.test.mjs,packages/pi-agentic-workflow/README.md,docs/fix/538-engram-startup-report/SPEC.md,docs/ROADMAP.md,.changeset/538-engram-startup-report.md`,
at the cut head `a83b9b38`):

```json
{"contract":"risk-tier-verdict@1","tier":"standard","reason":"4 path(s) carry executable content: packages/pi-agentic-workflow/src/extension/engram.ts, packages/pi-agentic-workflow/src/extension/index.ts, packages/pi-agentic-workflow/test/engram-provision.test.mjs, …","reason_kind":"executable-content","task_size":{"understood":true,"contained_risk":"contained","resumable_from_diff":true,"ceremony":"unit-doc","verification":"gates"},"signals":[]}
```

One pure decision module plus its single caller: the whole state machine is
reachable without a Pi session, a network call or a real binary, so
`contained_risk` is the truth this unit relies on.

## Future

none

## Future cost

- The `notice` axis is now the contract every future status binds to: a status
  added without a notice is a compile error, and a healthy status that ships with
  `warning` re-introduces the noise S2 removes (owner: `src/extension/engram.ts`).
- The engine's version pair stays unmeasured here. Whoever builds the doctor
  (research row 8) must give the extension either a bounded probe or the pairing
  table, or the broken-state message keeps naming a check it never runs.
- S2's silence raises the cost of a wrong "healthy": a resolution this module
  cannot see (a wrapper binary, a socket the operator's PATH does not expose) is
  silent instead of advisory. The evidence builder is the place to widen that
  knowledge, never a return to a standing advisory.

## Applicable tests

`bun test test/engram-provision.test.mjs test/shipped-adapter.test.mjs` (the
corpus: red first per §2/§6), the package suite `bun run test` (tsc + every
consumer), and the root gate `bun scripts/local-gate.mjs` before handoff.

## Known pre-existing issues

- The binary-vs-served version pair is **unowned** (`docs/research/2026-11-13-tool-doctor-inventory.md`
  row 8). **Does not affect** this unit: the fix names the check and its commands
  instead of claiming a measurement (S3, `## Non-goals`), so the message stays
  true on a machine where the pair disagrees.
- The `not-consented` message in `src/extension/engram.ts` is unreachable through
  the adapter (531's silence) and is kept as the module's caller contract
  (`D4`). **Does not affect** this unit: no surface prints it, and deleting it
  would supersede 531 S3a's pinned text without a requirement asking for it.
- `scripts/run-root-suite.test.mjs` spawns other suites under timing bounds and
  has been observed red once under the gate's parallel load while green
  standalone (531's record). **Does not affect** this unit: recorded so the flake
  is not mistaken for a regression here.
- `scripts/check-skill-context.test.mjs` is **red on `main` before this branch**:
  `bun scripts/check-skill-context.mjs --documents` reports `AGENTS.md:
  machine-table lines 135 != the declared 134`. Reproduced in the primary
  checkout at `0a47bca6` with the same single failure (E11); this unit edits
  neither `AGENTS.md` nor the budget cell. **Does not affect** this unit: a
  guide-layer budget discrepancy, not an executable path this change touches.
- `scripts/residual-classify.test.mjs` is **red on `main` before this branch**:
  `scripts/residual-classify.mjs` imports `./ceremony/lib.mjs`, which #524's
  ceremony migration removed, so 20 of its 25 cases fail with `Cannot find
  module './ceremony/lib.mjs'` (E12, reproduced in the primary checkout at
  `0a47bca6`). **Does not affect** this unit: another unit's orphaned import,
  outside this change's regression boundary. Reported to the owner in the
  handoff rather than repaired here — repairing another unit's surface is scope
  this unit does not own.

## Acceptance criteria

- **AC-S1** — The unit is applied through the owner's local workflow: the
  planning ledgers and these criteria are frozen in this document before the
  implementation lands, and the work arrives as conventional commits. Check:
  `ls docs/fix/538-engram-startup-report/` lists `SPEC.md` only, and
  `git log --oneline main..HEAD` shows the unit's own commits.
- **AC-S2** — A healthy opted-in install prints nothing: with the native
  `gentle-engram` package declared, `memory.engram: true`, and the core binary
  resolvable on `PATH` (or by `ENGRAM_BIN`) or `ENGRAM_URL` set, the module
  reports `native-active` with `notice: "silent"` and an empty message,
  registering nothing, and the shipped entry calls `notify` zero times. Check:
  `bun test test/engram-provision.test.mjs test/shipped-adapter.test.mjs` exits 0
  (the silent-native cases).
- **AC-S3** — An opted-in broken runtime is exactly one `error` naming what
  failed and every route that repairs it, the binary-vs-served version pair
  included. Check: `bun test test/engram-provision.test.mjs` exits 0 (the
  native-without-substrate case asserts `PATH`, `ENGRAM_BIN`, `ENGRAM_URL`,
  `engram --version` and the companion route in one message) and
  `bun test test/shipped-adapter.test.mjs` exits 0 (exactly one `error`).
- **AC-S4** — A session without the opt-in prints nothing. Check:
  `bun test test/engram-provision.test.mjs` exits 0 (`notice: "silent"` on
  `not-consented`) and `bun test test/shipped-adapter.test.mjs` exits 0 (no
  `memory` key → zero `notify`).
- **AC-S5** — The opt-in guidance is printed in no state, and the README's
  situation table no longer offers an opt-in line as a startup message. Check:
  `bun test test/shipped-adapter.test.mjs` exits 0 (the no-opt-in case asserts
  zero `notify` calls at all) and the README's absent-opt-in row states the
  silence (read recorded in `## Log`).
- **AC-S6** — `binaryPath` decides the native branch: byte-identical input with
  the binary present is silent, with it absent is an error. Check:
  `bun test test/engram-provision.test.mjs` exits 0 (the paired cases), plus the
  differential harness (`P5`).
- **AC-S7** — Broken-state evidence distinguishes "absent" from "unresolvable"
  by quoting `ENGRAM_BIN`'s state instead of a catch-all. Check:
  `bun test test/engram-provision.test.mjs` exits 0 (the case where `ENGRAM_BIN`
  names a missing file asserts the override value in the message).
- **AC-S8** — The notification level is the module's `notice` for every status,
  and the adapter's status-keyed set is gone. Check:
  `rg -n 'INFORMATIONAL_ENGRAM' packages/pi-agentic-workflow/src` matches 0 and
  `bun run test` in `packages/pi-agentic-workflow` exits 0.

## Tasks

- P1 — Freeze this unit doc with its embedded planning ledgers and the
  acceptance criteria, before the implementation lands (validator:
  `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint
  docs/fix/538-engram-startup-report/SPEC.md` prints
  `verdict: PASS` and exits 0)
  (Implements: S1)
  - Relevant files: docs/fix/538-engram-startup-report/SPEC.md, docs/ROADMAP.md
- P2 — RED corpus first: the silent healthy state (S2's reproducer), the
  evidenced broken state (S3/S7's reproducer), the `ENGRAM_BIN` evidence, the
  per-status notices, and the adapter's silence/error cases land as checks
  observed failing on the pre-change tree (validator:
  `bun test test/engram-provision.test.mjs test/shipped-adapter.test.mjs` exits 1
  before P3/P4 and 0 after, with the red run recorded in `## Log`)
  (Implements: S2, S3, S4, S6, S7, S8)
  - Relevant files: packages/pi-agentic-workflow/test/engram-provision.test.mjs,
    packages/pi-agentic-workflow/test/shipped-adapter.test.mjs
- P3 — The module: the `notice` axis, the `engramBin` input, the health branch
  inside `native-active`, the shared evidence builder for the unresolved
  substrate, and the level of every other status (validator:
  `bun test test/engram-provision.test.mjs` exits 0, 0 fail)
  (Implements: S2, S3, S4, S6, S7, S8)
  - Relevant files: packages/pi-agentic-workflow/src/extension/engram.ts
- P4 — The adapter: pass the session's `ENGRAM_BIN`, print on `notice`, retire
  the status-keyed informational set (validator:
  `bun test test/shipped-adapter.test.mjs` exits 0, 0 fail)
  (Implements: S2, S3, S4, S8)
  - Relevant files: packages/pi-agentic-workflow/src/extension/index.ts
- P5 — Differential check: the same corpus driven through a copy of the base
  commit's module and through this change, in `mktemp -d`, with every difference
  declared (validator: `bun /tmp/diff-538.mjs` exits 0 with the diff matching
  only the declared deltas — the silent healthy native state, the evidenced
  errors, the `ENGRAM_BIN` quote, the leftover warning — zero undeclared rows)
  (Implements: S6, S2, S3)
- P6 — Documentation and repository state in the same change: the README's memory
  section, this unit doc, the roadmap `## Fixes` row (placement by hand — the
  emitter never appends a fix row — with the summary cell rendered from
  `roadmap_summary:`), the changeset intent and the rendered projection
  (validator: `bun scripts/lint-changeset.mjs` exits 0 and
  `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S1, S5, S8)
  - Relevant files: packages/pi-agentic-workflow/README.md, docs/ROADMAP.md,
    .changeset/538-engram-startup-report.md, docs/generated/
- P7 — Verification: the package suite and the declared root gate in the
  foreground, every obligation closed (validator: `bun scripts/local-gate.mjs`
  exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8)

### Planning evidence

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | forge-issue | The defect is real: an opted-in install with the native package present prints a remediation advisory on every session start although memory works, and the same string serves the healthy, broken and unconfigured states | issue [#538](https://github.com/gtrabanco/agentic-workflow/issues/538) body (What's broken / Expected behaviour / Actual behaviour) + `packages/pi-agentic-workflow/src/extension/engram.ts:381-391` at `a83b9b38` | read 2026-11-14 (this session) | O1–O14; the whole change |
| PE-002 | committed-source | The native branch reads `engramUrl` alone (`isNonBlank(engramUrl) ? … : remediationClause`) and never `binaryPath`, so the healthy/broken distinction is not decidable in it as written | `src/extension/engram.ts:381-400` at `a83b9b38` | read 2026-11-14 (this session) | O1, O3, O9; D5 |
| PE-003 | committed-source | The adapter is the module's only consumer and owns the level today through the status-keyed `INFORMATIONAL_ENGRAM` set, printing every status except `not-consented` | `src/extension/index.ts:275-287` (`INFORMATIONAL_ENGRAM`), `:452-472` (the `session_start` listener) | read 2026-11-14 (this session) | O7, O8, O10; D6 |
| PE-004 | committed-source | Pi's notification kinds are exactly `"error" \| "info" \| "warning"`, so "one error" (S3) is expressible without inventing a level | `src/extension/hooks-wiring.ts:40` (the shipped `ui.notify` shape) and `src/extension/index.ts:470` | read 2026-11-14 (this session) | O3, O6, O10 |
| PE-005 | committed-source | The shipped-entry harness drives the real `session_start` listener with an isolated `agentDir`/`cwd`, records `notify(message, kind)`, and already isolates `PATH`, `ENGRAM_URL` and `ENGRAM_BIN` — the S2 reproducer is expressible end to end with no Pi session | `test/shipped-adapter.test.mjs:527-549` (`withEngramEnv`), `:95-150` (`shippedEntry`), `:630-660` (the 531 native case, which creates a stub binary on PATH — the exact healthy input) | read 2026-11-14 (this session) | O1, O3, O8, O10; AC-S2 |
| PE-006 | version-pinned doc | Engram's own extension resolves its binary as `optionalEnvironmentValue(process.env.ENGRAM_BIN) ?? "engram"` from `PATH`, so this module's `resolveEngramBinary` mirrors the substrate the native tools actually use — a binary this module cannot resolve is one the native extension cannot start either | 531's sampling of the installed `gentle-engram@0.7.0` (`index.ts:45,924`, recorded in `docs/fix/531-engram-native-skip-remote-surfaces/SPEC.md` PE-003); re-read here as a committed-source claim about this repo's own `resolveEngramBinary` at `src/extension/engram.ts:196-222` | carried from 2026-11-13, re-checked 2026-11-14 (this session) | O3, O9; D5 |
| PE-007 | unowned-gap | The served-vs-binary version pair has no owner in this repository: the memory probe measures `binary-version` and `http-health` only for the first memory read (30 s ceiling), and the doctor inventory assigns the pair to a future feature | `packages/agentic-workflow/src/memory/probe.mjs:47-56`, `docs/research/2026-11-13-tool-doctor-inventory.md` rows 7–9 and gap 2 | read 2026-11-14 (this session) | O3; D2; `## Non-goals` |
| PE-008 | committed-tool | The tier authority is the crate CLI: the repo-local ceremony script #524 moved no longer exists: `ceremony tier classify --paths` emits `risk-tier-verdict@1`, `phase-lint` reads the unit-doc grammar, and `docs-generate` owns the roadmap summary cell | `packages/agentic-workflow/bin/agentic-workflow.mjs` usage block; this session's tier and phase-lint runs; `scripts/docs-generate.mjs` | run 2026-11-14 (this session) | `## Risk tier`; O11, O13 |
| PE-009 | measured-baseline | The regression floor at the cut head `a83b9b38` (after `bun run test`, which builds): **864 pass / 0 fail / 77 files** | this session's run of `bun run --cwd packages/pi-agentic-workflow test` | run 2026-11-14 (this session) | O7, O13; AC-S8 |
| PE-010 | unknown | No repository evidence says whether an operator's shell exports `ENGRAM_BIN` or `ENGRAM_URL` while Pi runs; the contract that stays true either way is Engram's own blankness rule plus a corpus that pins the variables | not sampled — no session env capture exists in this repository (`rg -n 'ENGRAM_BIN' packages/pi-agentic-workflow/src`) | unverified 2026-11-14 (this session) | O3, O7; the suites' env isolation |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S2, S6 | a healthy opted-in native install (binary resolvable on `PATH` or by `ENGRAM_BIN`, or `ENGRAM_URL` set, no leftover declaration) reports `native-active` with `notice: "silent"` and an empty message, registers nothing, and the shipped entry prints nothing — the S7 reproducer of the issue | P3 | P3 | direct application (this session) | `bun test test/engram-provision.test.mjs` exits 0 (the silent-native cases) and `bun test test/shipped-adapter.test.mjs` exits 0 (zero `notify` for the healthy native entry) | E line in SPEC `## Log` | verified — E5 (the silent-native cases, and the shipped entry's zero `notify` for the healthy install) |
| O2 | S6 | `binaryPath` is what flips the native state: the same input with the binary present is silent and with it absent is an error, which is the input the old branch ignored | P3 | P3 | direct application (this session) | `bun test test/engram-provision.test.mjs` exits 0 (the paired present/absent native cases) | E line in SPEC `## Log` | verified — E5 (the present/absent pair flips the notice) and E8 (the same pair as a declared delta) |
| O3 | S3, S7 | an opted-in native install with no binary and no `ENGRAM_URL` reports one `notice: "error"` naming the failed resolutions (`PATH`, `ENGRAM_BIN`, `ENGRAM_URL` unset), every repair route, the binary-vs-served version check with its commands, and the companion-route clarification | P3 | P3 | direct application (this session) | `bun test test/engram-provision.test.mjs` exits 0 (the native-without-substrate case asserts `PATH`, `ENGRAM_BIN`, `ENGRAM_URL`, `engram --version` and the companion route) and `bun test test/shipped-adapter.test.mjs` exits 0 (exactly one `error`) | E line in SPEC `## Log` | verified — E5 (the native-without-substrate message asserts `PATH`, `ENGRAM_BIN`, `ENGRAM_URL`, `engram --version` and the companion route) and E8 (the error rows) |
| O4 | S7 | "absent" and "unresolvable" are distinguishable: with `ENGRAM_BIN` naming a non-executable path the error quotes that value instead of claiming the binary is absent | P3 | P3 | direct application (this session) | `bun test test/engram-provision.test.mjs` exits 0 (the `ENGRAM_BIN` evidence case asserts the quoted override) | E line in SPEC `## Log` | verified — E5 (the `ENGRAM_BIN` quote, and the case that rejects "is unset" when the override is set) |
| O5 | S3, S7 | the no-native `binary-missing` state is one `error` built by the same evidence builder, so both broken routes carry the same facts | P3 | P3 | direct application (this session) | `bun test test/engram-provision.test.mjs` exits 0 (the binary-missing cases: `notice: "error"`, surfaces named, `ENGRAM_BIN` state quoted) | E line in SPEC `## Log` | verified — E5 (the `binary-missing` cases: `notice: "error"`, surfaces named, override quoted) |
| O6 | S3, S8 | `config-invalid` and `unsupported-host` are errors, not warnings: an unreadable consent and a host without `registerMcpServer` are both broken states | P3 | P3 | direct application (this session) | `bun test test/engram-provision.test.mjs` exits 0 (the `notice` assertions on those statuses) | E line in SPEC `## Log` | verified — E5 (`config-invalid` and `unsupported-host` both carry `notice: "error"`) |
| O7 | S2, S8 | the states the owner kept keep both their behaviour and their line: `registered` (one `info`, exact command), `external-server` (one `info`), `already-declared` (one `info`) | P4 | P4 | direct application (this session) | `bun test test/engram-provision.test.mjs test/shipped-adapter.test.mjs` exits 0 with those cases' assertions intact | E line in SPEC `## Log` | verified — E5 (those cases' assertions intact) and E8 (their messages byte-identical to the base) |
| O8 | S4, S5 | a session without the opt-in prints nothing: the module's `not-consented` carries `notice: "silent"`, and no state prints the opt-in instruction | P4 | P4 | direct application (this session) | `bun test test/shipped-adapter.test.mjs` exits 0 (no `memory` key → zero `notify`) and `bun test test/engram-provision.test.mjs` exits 0 (`notice: "silent"` on `not-consented`) | E line in SPEC `## Log` | verified — E5 (the shipped entry with no opt-in emits zero `notify`) |
| O9 | S2, S3 | a leftover `mcpServers.engram` declaration beside the native package keeps its callout and is reported as a `warning` (it breaks the native-only write guarantee even when memory resolves) | P3 | P3 | direct application (this session) | `bun test test/engram-provision.test.mjs` exits 0 (the leftover case asserts `notice: "warning"`, `mcp.json Pi reads still declares`, `remove that entry`) | E line in SPEC `## Log` | verified — E5 (the leftover case: `notice: "warning"`, the entry named, the removal route) |
| O10 | S8 | the level is the module's `notice` on every status and the adapter's status-keyed set is gone, so no future status can be informational by accident | P4 | P4 | direct application (this session) | `rg -n 'INFORMATIONAL_ENGRAM' packages/pi-agentic-workflow/src` matches 0 and `bun test test/shipped-adapter.test.mjs` exits 0 | E line in SPEC `## Log` | verified — E10 (0 matches for `INFORMATIONAL_ENGRAM`, the adapter renders `report.notice`) |
| O11 | S1, S5, S8 | documentation and repository state ship in the same change: the README's memory section states the silence, the roadmap `## Fixes` row exists with its summary cell rendered from `roadmap_summary:`, the changeset intent exists, and the projection is fresh | P6 | P6 | direct application (this session) | `bun scripts/docs-generate.mjs --check` exits 0, `bun scripts/lint-changeset.mjs` exits 0, `rg -c '#538' docs/ROADMAP.md` matches 1 | E line in SPEC `## Log` | verified — E9 (projection PASS, changeset ok, settle 0 violations, one `#538` row) |
| O12 | S6, S2, S3 | the change differs from the base commit only in the declared deltas: the silent healthy native state, the evidenced errors, the `ENGRAM_BIN` quote, the leftover warning and the `notice` axis; every other input keeps the base's status and message | P5 | P5 | direct application (this session) | differential harness in `mktemp -d` (base module copy vs this change, identical corpus): the diff lists only those deltas | E line in SPEC `## Log` with the diff summary | verified — E8 (11 declared deltas, 9 identical rows, 8 identical binary rows) |
| O13 | S1 | the declared deterministic gates are green before handoff | P7 | P7 | direct application (this session) | `bun scripts/local-gate.mjs` exits 0 | G line in SPEC `## Log` | verified — G1 (15 of 17 steps pass; the only red is E11/E12, reproduced on `main` before this branch) |
| O14 | S2, S3, S4 | no suite depends on the operator's environment: the Engram cases pin `PATH`, `ENGRAM_URL` and `ENGRAM_BIN`, so a shell exporting either variable cannot flip the result | P4 | P4 | direct application (this session) | `bun test test/shipped-adapter.test.mjs` exits 0 with `ENGRAM_URL` and `ENGRAM_BIN` exported | E line in SPEC `## Log` | verified — E6 (66 pass with `ENGRAM_URL` and `ENGRAM_BIN` exported) |

## Triaged steps

n/a — applied inline per the owner's instruction (S1): the §5 ledger freeze
substitutes for the lane's plan step, and no repo machinery runs on this surgery.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-14, the request, verbatim:
  ```
  Apply to this repository: issue #538
  ```
- **L2** — 2026-11-14, the issue, verbatim (body as filed; labels `bug`,
  `needs-triage`):
  ```
  ## What's broken

  The engram resolution report of the `@gtrabanco/pi-agentic-workflow` extension (`src/extension/engram.ts`) is emitted **every session start**, and its `native-active` branch consults only whether `ENGRAM_URL` is set to choose between two messages — it holds `binaryPath` in its inputs and does not consult it. Result: with the binary present and resolvable and memory working, the report still prints "If memory is not working, put the \"engram\" core binary on PATH or set ENGRAM_BIN..., or set ENGRAM_URL to a running Engram server", which reads as "engram is not available". Operators get a permanent remediation advisory for a healthy state.

  The report semantics need the consent × runtime-health state machine decided in triage: **healthy + opted-in → silence; opted-in + broken → error with evidence (what failed, which route repairs it); not opted-in → silence** (an operator who does not want memory owes it nothing). The current messages fold all three into one advisory, and losing the opt-in guidance row (today: "set memory.engram in agentic-workflow.json to opt in") is part of the decision, not a side effect.

  ## Detected in

  2026-11-13, operator report — after installing the new `pi-agentic-workflow` release, every new session printed the advisory although memory was working; the same day a second incident (stale 3.6.0 server running from a deleted binary) proved the broken-state message must carry *evidence* (which resolution failed: binary absent/unresolvable, server down, version pair mismatch), not a generic catch-all.

  ## Reproduction

  1. Host with the native `gentle-engram` extension + an `engram` binary resolvable on `PATH` (or `ENGRAM_BIN`); `memory.engram` opted-in in the base config; `ENGRAM_URL` unset.
  2. Start a pi session.
  3. The report prints: "Engram MCP not registered — the native gentle-engram extension already provides the mem_* tools... If memory is not working, put the \"engram\" core binary on PATH...".

  ## Expected behaviour

  With memory resolvable and opted-in: **no startup message**. When opted-in and the runtime is broken: one error naming the exact failed resolution and the repair route (including the binary-vs-served version pair). When not opted-in: silence. Evidence background: `docs/research/2026-11-13-tool-doctor-inventory.md` (rows 7–9) and the version-pair gap this fix surfaces incidentally.

  ## Actual behaviour

  One advisory string per session start in every state (healthy, broken, unconfigured), with a remediation clause that is wrong in most of them; the native-active branch never consults `binaryPath`.

  ## Root cause

  `engram.ts`'s native-active branch builds the `memory` sentence from `engramUrl` alone (`isNonBlank(engramUrl) ? ... : remediationClause`), leaving the resolved binary path unused in a branch that could otherwise state "memory is served by the local engram server (binary at <path>)" — or say nothing under the new state machine.

  ## Severity

  medium — noise that trains operators to ignore the one message that matters (the genuinely broken one), private to the pi package surface; no data loss, memory keeps working.

  ## Depends on

  (none)

  *This issue was automated-written using AI.*
  ```
- **D1** — 2026-11-14, the owner's answer to the one question this unit asked
  (which healthy outcomes may speak), verbatim: `selected advisory-only` — "Silence
  only the healthy native-active advisory (smallest change)": `native-active`
  healthy is silent; `registered`, `external-server` and `already-declared` keep
  today's lines; `not-consented` stays silent; broken states speak as errors and
  a leftover declaration keeps its callout.
- **D2** — 2026-11-14, no session-start probe. The question carried the
  assumption and the owner did not overrule it: the version pair is named as a
  check to run (`engram --version` against the server's `/health`), never
  measured at startup. Reason recorded under `## Non-goals` and PE-007.
- **D3** — 2026-11-14, 531's `native-active` + `ENGRAM_URL` sentence retires by
  supersession, not by a relaxed test: S2/S8 make the healthy native state silent,
  and 531 AC2's external-server report keeps its own status for hosts without the
  native package. The test that asserted the sentence now asserts the silence
  (O1), and this row is the authority for that change.
- **D4** — 2026-11-14, the `not-consented` message text stays. The adapter has
  not printed it since 531, so S5's "losing the opt-in guidance row" is the
  printed surface; deleting the string would supersede 531 S3a's pinned text
  (obligation O17) without a requirement asking for it. Recorded rather than
  silently skipped.
- **D5** — 2026-11-14, `native-active` keeps one status with three notices
  (`silent` healthy, `warning` leftover declaration, `error` unresolvable
  substrate) instead of three statuses: the status says what provisioning did
  (nothing registered, the native package is present), which is true in all three,
  and the notice says what the operator must read. Adding statuses would widen the
  published vocabulary and the README table without adding truth.
- **D6** — 2026-11-14, the level moves from the adapter's status-keyed set into
  the module's `notice` axis (superseding 531 D4's placement, keeping its intent):
  the level is now a property of the outcome — "healthy silent, broken error" is
  the module's decision (S8) — and the adapter only renders it.
- **D7** — 2026-11-14, plan repair to AC-S5: the criterion's check greps a
  *comment* (`rg 'to opt in' src/extension/index.ts`) that legitimately says an
  unreadable config must not tell an opted-in operator to opt in, so the check
  could never pass. The criterion is unchanged; its check is now the case that
  proves it (the shipped entry with no opt-in emits zero notifications).
  `ac-hash` recomputed after the repair; no test was weakened and the comment was
  not edited to satisfy a grep.
- **E1** — 2026-11-14, `cd packages/pi-agentic-workflow && bun run test` at the
  cut head `a83b9b38` · exit 0 · 864 pass, 0 fail, 77 files (the regression floor,
  PE-009).
- **E2** — 2026-11-14, `bun packages/agentic-workflow/bin/agentic-workflow.mjs
  ceremony tier classify --paths …` at `a83b9b38` · exit 0 · `tier: standard`,
  `task_size` understood/contained/resumable, `signals: []`.
- **E3** — 2026-11-14, `bun packages/agentic-workflow/bin/agentic-workflow.mjs
  phase-lint docs/fix/538-engram-startup-report/SPEC.md` · exit 0 · 7 phases
  `PASS (6/6)`, `verdict PASS`, fingerprint `c852bae1…` (P5's validator needed
  its outcome anchor; the freeze itself is unchanged).

- **E4** — 2026-11-14, RED corpus before the implementation:
  `cd packages/pi-agentic-workflow && bun test test/engram-provision.test.mjs
  test/shipped-adapter.test.mjs` against the pre-change `dist/` · exit 1 ·
  46 pass, **20 fail** — `report.notice` did not exist, the healthy native state
  printed the advisory, the broken native state had no evidence, and the adapter
  still printed both. The opt-out case already passed (531 silenced it).
- **E5** — 2026-11-14, `cd packages/pi-agentic-workflow && bun test
  test/engram-provision.test.mjs test/shipped-adapter.test.mjs` · exit 0 · 66
  pass, 0 fail (58 cases before this unit; the 8 new ones are the silent native
  state, its `ENGRAM_URL` variant, the present/absent pair, the evidenced error,
  the `ENGRAM_BIN` quote, the leftover warning, and the adapter's silence + one
  `error` + no-opt-in cases).
- **E6** — 2026-11-14, `ENGRAM_URL=http://127.0.0.1:7437
  ENGRAM_BIN=/nope/engram bun test test/engram-provision.test.mjs
  test/shipped-adapter.test.mjs` · exit 0 · 66 pass, 0 fail — the operator's
  shell cannot flip the result (O14).
- **E7** — 2026-11-14, `cd packages/pi-agentic-workflow && bun run test` · exit 0
  · 871 pass, 0 fail, 77 files (the floor of E1 plus the 7 new cases; `tsc`
  built `dist/` first).
- **E8** — 2026-11-14, differential in `mktemp -d` (the base commit's module
  beside this change, one 28-row corpus) · exit 0 · 20 `provisionEngram` rows:
  **11 changed, 9 identical**; 8 `resolveEngramBinary` rows: all identical. Every
  changed row is a declared delta — the silent healthy native state (3 rows, two
  of them the old "served by the external Engram server" sentence D3 retires),
  the four evidenced errors (native-broken, the `ENGRAM_BIN` quote, the
  leftover-and-broken pair), the leftover warning (same words as before, minus
  the advisory clause), and `binary-missing` with its two `ENGRAM_BIN` variants.
  No undeclared line: `not-consented`, `config-invalid`, `external-server`,
  `unsupported-host`, `already-declared` and `registered` keep byte-identical
  messages.
- **E9** — 2026-11-14, `bun scripts/docs-generate.mjs --check` · exit 0 ·
  `3 checked · 0 missing · 0 stale · 0 orphaned`, roadmap unchanged, `verdict:
  PASS`; `bun scripts/lint-changeset.mjs` · exit 0 · `ok
  538-engram-startup-report.md`; `bun scripts/roadmap-settle.mjs` · exit 0 ·
  `196 unit docs checked`, `violations: 0`; `rg -c '#538' docs/ROADMAP.md` → 1
  (O11).
- **E10** — 2026-11-14, `rg -n 'INFORMATIONAL_ENGRAM'
  packages/pi-agentic-workflow/src` · exit 1 · 0 matches, and `rg -c 'notice'
  packages/pi-agentic-workflow/src/extension/engram.ts` → 13 (O10). The README's
  absent-opt-in row now reads "nothing is registered and nothing is said — an
  operator who does not want memory owes the report nothing", and
  `rg -n 'If memory is not working' packages skills docs` matches only this unit
  doc's quotes of the retired string (AC-S5).
- **E11** — 2026-11-14, `bun scripts/check-skill-context.mjs --documents` in the
  primary checkout at `0a47bca6` · exit 1 · `AGENTS.md: machine-table lines 135
  != the declared 134` — pre-existing on `main`, and the identical failure here.
- **E12** — 2026-11-14, `bun test scripts/residual-classify.test.mjs` in the
  primary checkout at `0a47bca6` · exit 1 · 5 pass, 20 fail — `Cannot find
  module './ceremony/lib.mjs'` from `scripts/residual-classify.mjs` (#524 removed
  it) — pre-existing on `main`, outside this unit's surface.
- **P1** — 2026-11-14, the unit doc frozen with its ledgers, criteria, ac-hash
  and tier verdict; phase-lint `PASS (6/6)` × 7 · `988c30e3`.
- **P2** — 2026-11-14, the RED corpus landed alone and observed red (E4) ·
  `0e4f4810`.
- **P3/P4** — 2026-11-14, the module's `notice` axis + health branch + evidence
  builder, and the adapter's `ENGRAM_BIN` input + `notice` rendering ·
  `0d252d3b`.
- **G1** — 2026-11-14, `bun scripts/local-gate.mjs --no-bail` at HEAD `e053e936` ·
  exit 1 · 17 steps: 15 pass (`docs-generated-projection`, `log-immutability` 0
  violations over 4 commits, `version-parity-content`, `temp-hygiene`,
  `worktree-guard`, `tmp-gc`, `workspace-install`, `journal-carrier-check`,
  `schema-build`, `dependency-advisories`, `dependency-pin-gate`,
  `pi-node-compat`, `pi-compat-guard`, `crate-suite-node`, `crate-suite-bun`),
  `root-suite` exit 1, `schema-node-compat` skipped as its dependent.
  `bun scripts/run-root-suite.mjs` · 109 suites PASS, **2 FAIL** —
  `check-skill-context` (E11) and `residual-classify` (E12), both reproduced on
  `main` at `0a47bca6` in the primary checkout and neither touched by this unit.
- **D8** — 2026-11-14, `main` moved while this unit was applied
  (`a83b9b38` → `0a47bca6`, another session's `docs(log)` commit). This branch is
  **not** integrated with it: nothing is pushed, there is no conflict, and the
  repo's rule leaves the integration to the owner. The gate receipt (G1) is at
  this branch's head on its own base, and the two root-suite reds are identical
  at both commits.

## Next

The owner's external verdict on this branch's diff. After it: push the branch and
open the PR against `main` (`Closes #538`), settle the roadmap row to `done` with
the PR link, and integrate `main` (`0a47bca6`) if the owner wants it before the
merge. Both root-suite reds (E11, E12) are another unit's surface.

## References

Issues, roadmap rows, related material. The PR closes the tracked issue via
`Closes #538`. `none` if empty.

## Branch

`fix/538-engram-startup-report`

## Depends on

none — 531 (the module's current contract) is merged.

## Regression scope

| Scenario | How it is verified |
|---|---|
| consent-first ordering, `already-declared`, `unsupported-host`, `registered` read-back keep working | `bun test test/engram-provision.test.mjs` exits 0 with those cases' assertions intact |
| an external `ENGRAM_URL` is still reported as a deliberate choice with one `info` line | `bun test test/shipped-adapter.test.mjs` exits 0 (the external-server case) |
| native-package detection over Pi's two `settings.json` scopes, and the `ENGRAM_BIN`-aware binary lookup | `bun test test/engram-provision.test.mjs` exits 0 (the detection and override cases) |
| a trusted project's native install still suppresses the MCP path, and an untrusted project's does not | `bun test test/shipped-adapter.test.mjs` exits 0 (the project-scope pair; the trusted half now asserts silence, the untrusted half the registration) |
| no suite depends on the operator's shell | `ENGRAM_URL=… ENGRAM_BIN=… bun test test/shipped-adapter.test.mjs` exits 0 (O14) |
