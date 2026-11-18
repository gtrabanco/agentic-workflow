---
type: fix
scope: standard
roadmap_summary: Issue [#624](https://github.com/gtrabanco/agentic-workflow/issues/624): telemetry is lost when `session_shutdown` never fires (pi-web keeps sessions alive), so `agentic-workflow telemetry reconstruct` rebuilds the old samples from Pi's own session JSONL and merges the missing ones into the telemetry store and the ledger — manual, idempotent, and never by unit.
---

# fix/624-reconstruct-telemetry-from-pi-transcripts

> `docs/fix/624-reconstruct-telemetry-from-pi-transcripts` applies issue
> [#624](https://github.com/gtrabanco/agentic-workflow/issues/624). This command
> substitutes for the lane's plan step, so both planning ledgers are cut and
> frozen here (§5 of the governing request). The owner's answer to the one open
> question (the ledger-write conflict) is frozen below as `S3a`, and it moves the
> feature from automatic to manual reconciliation.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

[#624](https://github.com/gtrabanco/agentic-workflow/issues/624) — auto-reconstruct
telemetry from Pi session JSONL transcripts when the ledger is empty. The PR
closes it with `Closes #624` in the body. Branch
`feat/624-reconstruct-telemetry-from-pi-transcripts`.

The request's own report: the wiring flushes to the ledger and
`.pi/.telemetry/sessions.jsonl` only on `session_shutdown`; pi-web keeps a
session alive between prompts, so the flush never runs and 922+ historical Pi
transcripts' usage is unreachable through the workflow's own telemetry.

## Specs

**S1 — Prove feasibility: reconstruct telemetry from Pi session JSONL transcripts.**
> The agentic-workflow telemetry wiring flushes to TIER_COST.md ledger and `.pi/.telemetry/sessions.jsonl` on `session_shutdown`. In environments where `session_shutdown` never fires (pi-web between turns), the accumulated samples are lost — but Pi's own session JSONL transcript files preserve the same data. A standalone reconstruction script (`.pi/.telemetry/reconstruct-from-transcripts.mjs`) successfully extracts telemetry from Pi's session JSONL, proving the concept.

**S2 — Implement `agentic-workflow telemetry reconstruct` as a universal CLI subcommand.**
> The reconstruction must be a subcommand of the universal CLI (`@gtrabanco/agentic-workflow`) so it can be used via `bunx`/`npx`:
> ```bash
> agentic-workflow telemetry reconstruct stats [--by-model] [--by-date] [--project <path>]
> agentic-workflow telemetry reconstruct samples [--jsonl <path>] [--project <path>]
> agentic-workflow telemetry reconstruct write [--jsonl <path>] [--ledger <path>]
> ```

**S3 — Auto-reconstruct on first telemetry enable: when `telemetry.enabled` is true and the ledger is empty (zero rows), automatically reconstruct samples from Pi JSONL transcripts in the project's cwd.**
> When the wiring detects an empty ledger, it should:
> 1. Scan for Pi JSONL transcripts in the project's cwd
> 2. Reconstruct samples from those transcripts
> 3. Write to the ledger (if it exists) and the JSONL file (if configured)
> 4. Log "Reconstructed N samples from Pi transcript" to stderr
> 5. Continue with normal wiring (session_shutdown flush for future sessions)

**S4 — Preserve all usage fields from Pi transcripts in the reconstructed samples.**
> The reconstruction must map all available Pi usage data:
> - `message.usage.totalTokens` → `tokens`
> - `message.usage.input` → `input_tokens`
> - `message.usage.output` → `output_tokens`
> - `message.usage.cacheRead` → `cache_read_tokens`
> - `message.usage.cacheWrite` → `cache_write_tokens`
> - `message.usage.reasoning` → `reasoning_tokens`
> - `message.model` / `model_change.modelId` → `model`
> - `message.durationMs` → `model_ms` (approximate, includes tool overhead)
> - Count of assistant messages → `turns`
> - First timestamp → `observed` (YYYY-MM-DD)
> - `unit`, `phase`, `changed_paths`, `tool_ms` → null (not available from Pi transcripts)

**S5 — Do NOT implement full unit attribution from git history (future work).**
> The reconstruction can only report by project, by session, by date, by model — never by unit. The agentic-workflow wiring's `noteCommand()` call that attributes to a unit is lost in Pi transcripts. Linking reconstructed samples to units via git history is explicitly out of scope (future work).

**S3a — Correction: manual reconciliation, never per-session work, and the merge is the point.**
> La idea es poder recuperar telemetría vieja que no figure en el ledger si no existen datos.
>
> Como hasta que se implemente 623 fallará el evento para guardar los datos, estaría bien tener un comando en el universal cli que permita reconciliar datos viejos y actuales y así mergear y tener todos los datos disponibles de forma manual si el usuario quiere forzar esa reconciliación. Para no leer archivos ya leídos previamente en cada sesión mejor que sea manual.

`S3a` replaces S3's trigger: the wiring gains **no** listener and no session-start
read (nothing re-reads transcripts per session), and the command is the only
entry. It also makes the merge normative: a session already present in a
destination (under `pi:session=<id>` from the live sink or `pi:reconstruct=<id>`
from a previous run) is not written again there.

## Impact

- `packages/agentic-workflow/src/telemetry/reconstruct.mjs` (new) — transcript
  discovery, the S4 mapping, the stats envelope and the merge.
- `packages/agentic-workflow/src/telemetry/ledger.mjs` (new) — the `tier-cost@N`
  grammar and the two appends (`createLedgerSink`/`createJsonlSink`'s bodies),
  moved out of `scripts/tier-cost.mjs` and `telemetry-sinks.ts` so the crate's
  command and the Pi sink share one writer and one reader. `scripts/tier-cost.mjs`
  re-exports every name it already published (its suites and `telemetry-report.mjs`
  are unchanged); `telemetry-sinks.ts` keeps its two exports as thin wrappers.
- `packages/agentic-workflow/bin/agentic-workflow.mjs` — the `telemetry` case
  and the usage line.
- `packages/agentic-workflow/README.md` — the usage line token-for-token (the
  `cli.surface.test.mjs` contract) and one Commands row.
- `packages/agentic-workflow/test/telemetry-reconstruct.test.mjs` (new) plus
  committed fixtures under `packages/agentic-workflow/test/fixtures/telemetry-reconstruct/`.
- `scripts/tier-cost.mjs` — `readLedger` skips an unattributed row (a
  reconstruction) instead of refusing the whole ledger; a named unit that does
  not resolve still refuses `unknown-unit`. `scripts/tier-cost.test.mjs` gains
  the two cases.
- `packages/pi-agentic-workflow/src/extension/telemetry-wiring.ts` — **not
  touched** (S3a); the wiring's suites are the regression proof.
- `docs/workflow/CONFIG.md` — the `telemetry` row names the manual recovery.
- `docs/features/494-telemetry-by-turn/SPEC.md` — the limitation and the
  workaround, below its frozen sections.
- `docs/workflow/TIER_COST.md` — the "Who writes a row" note names the
  unattributed reconstruction row and the 0 projection (D2).
- `.changeset/624-reconstruct-telemetry.md` — the crate's minor.
- `docs/ROADMAP.md` `## Fixes` — the row the emitter appends for this folder.

## Surfaces

- `packages/agentic-workflow`
- `packages/pi-agentic-workflow`
- `scripts`
- `docs`

## Retirements

Strictly additive at the operator surface: no command, flag, contract id, skill
or vocabulary is removed. Two internal moves, each with its consumers kept
byte-identical:

- `parseLedger` and its column vocabulary move from `scripts/tier-cost.mjs` to
  `packages/agentic-workflow/src/telemetry/ledger.mjs`; the root script
  re-exports every published name, so `scripts/telemetry-report.mjs`,
  `scripts/tier-cost.test.mjs` and `scripts/telemetry-coverage.test.mjs` keep
  their imports and assertions untouched.
- `createLedgerSink`/`createJsonlSink`'s bodies move to the same crate module and
  the TypeScript sinks delegate to them; `telemetry-ledger-sink.test.mjs` and
  `telemetry-jsonl-sink.test.mjs` are unchanged and are the proof.

Nothing is deleted from the tree: the two moves retire no surface, so the
retirement count is `0` and this unit's negative-capability pin is
`bun test packages/pi-agentic-workflow/test/telemetry-ledger-sink.test.mjs`
exiting 0 with its assertions untouched.

## Non-goals

- Unit attribution from git history (S5), reconstruction from Claude
  Code/Codex/OpenCode transcripts, remote upload (the issue's own list).
- Any change to the telemetry accumulation logic (`session-telemetry.ts`'s
  counters are not touched).
- Automatic reconstruction on `session_start`/`session_shutdown` (S3a): no
  listener, no per-session transcript read, no empty-ledger trigger.
- A seventh column, a new ledger grammar version or a widened `tier-cost@2`: the
  ledger row is a projection of the S4 record (D2), and the grammar is unchanged.
- A consent gate, a sampling rate or a remote destination.

## Risk tier

- **`standard`** · **Task Size** — `medium` (the crate module + its re-home +
  one CLI subcommand + docs; no auth, CI or publish surface).
- **Named high-risk item** — `none — not a high-tier unit`.

## Future

- Link reconstructed samples to units via git history (diff-based) — `open`, the
  issue's own future row.
- Reconstruct from Claude Code/Codex/OpenCode session JSONL (if applicable) —
  `open`.
- Remote upload of reconstructed data to analytics service — `open`.

## Future cost

None — the command is a manual sensor/writer with no standing obligation. The
only recurring rule is the one it inherits: a new telemetry field is added to
`TELEMETRY_SAMPLE_FIELDS` and to the S4 mapping in the same change, or the
record and the schema drift (owned by
`packages/agentic-workflow-schema/src/telemetry.ts`).

## Applicable tests

- `packages/agentic-workflow/test/telemetry-reconstruct.test.mjs` (new) — the
  mapping, the stats envelope, the merge/idempotency and the refusals.
- `packages/agentic-workflow/test/cli.surface.test.mjs` — the README usage line
  and the Commands row.
- `packages/pi-agentic-workflow/test/telemetry-ledger-sink.test.mjs`,
  `test/telemetry-jsonl-sink.test.mjs`, `test/session-telemetry.test.mjs`,
  `test/telemetry-wiring.test.mjs` — unchanged regression proof for the re-home.
- `scripts/tier-cost.test.mjs` — the unattributed-row skip and the preserved
  `unknown-unit` refusal, alongside the existing `@1`/`@2` cases.
- `scripts/telemetry-report.test.mjs` — the report still reads a ledger carrying
  a reconstructed row.
- `node scripts/run-root-suite.mjs` — the whole root suite.

## Known pre-existing issues

- The feasibility POC the issue cites
  (`.pi/.telemetry/reconstruct-from-transcripts.mjs`) is gitignored and untracked;
  it exists only in a checkout, not in this branch. It **does not affect** this
  unit: S1's mapping is re-derived from the transcripts themselves (E1), and the
  command replaces the POC instead of shipping it.
- The flush itself still fails until #623 lands — **does not affect** this unit;
  it is the reason the manual reconciliation exists (S3a).

## Tasks

- P1 — Land the RED corpus: `packages/agentic-workflow/test/telemetry-reconstruct.test.mjs`, its fixtures, and the two new `scripts/tier-cost.test.mjs` cases, observed failing against the missing module and the unguarded reader (validator: `bun test packages/agentic-workflow/test/telemetry-reconstruct.test.mjs` exits 1 on `ERR_MODULE_NOT_FOUND` at the cut, and exits 0 with every case green once P5 lands)
  (Implements: S1, S2, S4, S5)
  - Relevant files: packages/agentic-workflow/test/telemetry-reconstruct.test.mjs, packages/agentic-workflow/test/fixtures/telemetry-reconstruct/, scripts/tier-cost.test.mjs
- P2 — Re-home the ledger grammar and the two appends into `src/telemetry/ledger.mjs`; re-export from `scripts/tier-cost.mjs` and delegate from `telemetry-sinks.ts` (validator: `bun test scripts/tier-cost.test.mjs` and `bun test packages/pi-agentic-workflow/test/telemetry-ledger-sink.test.mjs` exit 0 with their assertions untouched)
  (Implements: S1, S4)
  - Relevant files: packages/agentic-workflow/src/telemetry/ledger.mjs, scripts/tier-cost.mjs, packages/pi-agentic-workflow/src/telemetry-sinks.ts
- P3 — Implement `src/telemetry/reconstruct.mjs`: discovery, the S4 mapping, the stats envelope, the merge and the refusals (validator: `bun test packages/agentic-workflow/test/telemetry-reconstruct.test.mjs -t record` exits 0 with the mapping, null and skip cases green)
  (Implements: S1, S2, S4, S5)
  - Relevant files: packages/agentic-workflow/src/telemetry/reconstruct.mjs
- P4 — `readLedger` skips an unattributed reconstruction row while a named unknown unit still refuses (validator: `bun test scripts/tier-cost.test.mjs` exits 0 with both new cases and the existing `unknown-unit` case green)
  (Implements: S1, S4)
  - Relevant files: scripts/tier-cost.mjs
- P5 — Wire `agentic-workflow telemetry reconstruct <stats|samples|write>` into the bin and publish the surface in the crate README (validator: `bun test packages/agentic-workflow/test/cli.surface.test.mjs` exits 0 and `bun packages/agentic-workflow/bin/agentic-workflow.mjs telemetry reconstruct stats --project <fixture>` exits 0)
  (Implements: S2)
  - Relevant files: packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/README.md
- P6 — Document the limitation, the command and the ledger projection: crate README section, `CONFIG.md` row, 494's SPEC, `TIER_COST.md` note, changeset (validator: `bun scripts/lint-changeset.mjs .changeset/624-reconstruct-telemetry.md` exits 0 and `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S2, S3a, S5)
  - Relevant files: packages/agentic-workflow/README.md, docs/workflow/CONFIG.md, docs/features/494-telemetry-by-turn/SPEC.md, docs/workflow/TIER_COST.md, .changeset/624-reconstruct-telemetry.md
- P7 — Verification: the package suites, the root suite, the doc verifier and the differential run against the base commit (validator: `node scripts/run-root-suite.mjs` exits 0 and `agentic-workflow verify docs/fix/624-reconstruct-telemetry-from-pi-transcripts/SPEC.md` exits 0)
  (Implements: S1, S2, S3a, S4, S5)
  - Relevant files: docs/fix/624-reconstruct-telemetry-from-pi-transcripts/SPEC.md

### Planning evidence

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | repository | the only flush point is `session_shutdown`, so a session kept alive between prompts emits nothing; the wiring is registered from `session_start` on the first telemetry-enabled session | `packages/pi-agentic-workflow/src/extension/telemetry-wiring.ts` (`register`, the `session_shutdown` handler); `packages/pi-agentic-workflow/src/extension/index.ts:440-458` | current (read at `90ce7e90`) | O1, O7, D1 |
| PE-002 | tool-behaviour | a Pi session transcript is JSONL whose first line is `{type:"session", id, timestamp, cwd, version}`, later `model_change` lines carry `modelId`, and assistant `message` lines carry `usage{input,output,cacheRead,cacheWrite,reasoning,totalTokens}`, `model` and `durationMs`; 923 transcripts exist under `~/.pi/agent/sessions/` in this environment | `E1`: `find ~/.pi/agent/sessions -name '*.jsonl' \| wc -l` → 923; a parsed sample of `--home-agent-projects-agentic-workflow--/2026-11-16T22-43-15-761Z_…jsonl` | current (sampled 2026-11-18) | O1, O2, O8 |
| PE-003 | tool-behaviour | tool-result messages also carry `durationMs`, so `model_ms` must sum assistant messages only or it double-counts tool time | the same sampled transcript: 139 `durationMs` values, 59 with `usage`, roles `system/user/assistant/toolResult` | current (sampled 2026-11-18) | O1 |
| PE-004 | repository | the ledger's integer cells accept digits only, and `readLedger` refuses the whole ledger on a unit that resolves to no carrier, so an unattributed reconstructed row needs the skip plus a numeric projection | `scripts/tier-cost.mjs:173` (`row-shape`), `:258` (`unknown-unit`); `docs/workflow/TIER_COST.md:45-63` (`tier-cost@2`) | current | O6, D2 |
| PE-005 | repository | the ledger is empty (0 data rows) and telemetry is enabled in this repository, so the S3 trigger was live and a bad write would poison the only ledger | `bun scripts/tier-cost.mjs read --ledger docs/workflow/TIER_COST.md` → `rows: []`; `.pi/agentic-workflow.json` (`telemetry.enabled: true`) | current (`E2`) | D2, O6 |
| PE-006 | repository | the crate ships `bin` and `src` only, and the Pi package depends on the crate, so a shared writer belongs in the crate and the crate may not import `scripts/` | `packages/agentic-workflow/package.json` (`files`), `packages/pi-agentic-workflow/package.json` (`dependencies`) | current | O6, D2 |
| PE-007 | repository | the sample's field list and order are published once by the schema package and the crate already depends on it, so the record builder imports `TELEMETRY_SAMPLE_FIELDS` instead of restating sixteen names | `packages/agentic-workflow-schema/src/telemetry.ts` (`TELEMETRY_SAMPLE_FIELDS`); `packages/agentic-workflow/package.json` | current | O1, O2 |
| PE-008 | repository | the crate README's usage line must restate the bin's subcommand list token-for-token and every dispatched subcommand needs a Commands row, or `cli.surface.test.mjs` fails | `packages/agentic-workflow/test/cli.surface.test.mjs` | current | O10 |
| PE-009 | repository | Pi's agent directory is `$PI_CODING_AGENT_DIR`, else `~/.pi/agent` — the convention the session store follows | `packages/agentic-workflow/src/doctor/checks.mjs:36-39`; `src/guard/git-identity.mjs:84-88` | current | O1, O8 |
| PE-010 | repository | `docs/LOGS.md` has one legal writer (the merge-to-main aggregator), so this branch ships a journal fragment instead | `scripts/log-immutability.mjs`; `docs/LOGS.md:10-13` | current | O15 (delivery) |
| PE-011 | repository | the ledger sink writes `String(value)` for every declared column, so `null` in `changed_paths`/`tool_ms` would land as the literal `null` and the reader would refuse the row | `packages/pi-agentic-workflow/src/telemetry-sinks.ts` (`declared.map((column) => String(values[column]))`) | current | D2 |
| PE-012 | repository | the owner answered the open question with S3a (manual reconciliation, merge old and current) instead of a grammar widening | the owner's answer to the single question of 2026-11-18, quoted verbatim in S3a | current (2026-11-18) | D1, D2, O5, O7 |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1, S4 | one Pi transcript becomes one record carrying `tokens`, `turns`, the five provider fields, `model`, `model_ms` and `observed`, mapped exactly as S4 lists; `model_ms` sums assistant messages only | P1 | P3 | execute-phase | `bun test packages/agentic-workflow/test/telemetry-reconstruct.test.mjs` exits 0 with the mapping case (a fixture transcript → the exact sixteen fields) | the E line quoting the run, naming the case | planned |
| O2 | S4 | the fields the transcript cannot answer are `null` in the record: `unit`, `phase`, `version`, `changed_paths`, `tool_ms` | P1 | P3 | execute-phase | `bun test packages/agentic-workflow/test/telemetry-reconstruct.test.mjs` exits 0 with the null-fields case | the E line quoting the run | planned |
| O3 | S2 | `stats` answers the JSON totals and, with `--by-model` or `--by-date`, the matching breakdown; `--project` filters by the session header's `cwd` | P1 | P3 | execute-phase | `bun test packages/agentic-workflow/test/telemetry-reconstruct.test.mjs` exits 0 with the stats, by-model, by-date and project-filter cases | the E line quoting the run | planned |
| O4 | S2 | `samples` prints one JSON line per record to stdout, and `--jsonl <path>` writes the same dump to that path | P1 | P3 | execute-phase | `bun test packages/agentic-workflow/test/telemetry-reconstruct.test.mjs` exits 0 with the samples stdout and dump cases | the E line quoting the run | planned |
| O5 | S3a | `write` merges only the sessions absent from each destination, keyed by the session id after `pi:session=`/`pi:reconstruct=`; a second run adds nothing to either store | P1 | P3 | execute-phase | `bun test packages/agentic-workflow/test/telemetry-reconstruct.test.mjs` exits 0 with the merge and the second-run-idempotent cases | the E line quoting the run | planned |
| O6 | S1, S4 | a reconstructed ledger row is written with `unit`/`phase`/`version` = `null`, `changed_paths`/`tool_ms` = `0` and `source` `pi:reconstruct=<id>`, and `readLedger` skips it while a named unit that does not resolve still refuses | P4 | P4 | execute-phase | `bun test scripts/tier-cost.test.mjs` exits 0 with the unattributed-skip case and the preserved `unknown-unit` case | the E line quoting the run | planned |
| O7 | S3a | nothing in the session lifecycle reads a transcript: the wiring gains no listener and no module under `packages/pi-agentic-workflow/src` imports the reconstruction | P1 | P3 | execute-phase | `rg -n 'telemetry/reconstruct' packages/pi-agentic-workflow/src` matches 0 | the `rg` output in the `## Log` | planned |
| O8 | S5 | the record names no unit and no git history is read: attribution stays out of the reconstruction | P1 | P3 | execute-phase | `bun test packages/agentic-workflow/test/telemetry-reconstruct.test.mjs` exits 0 with the "never by unit" case, and `rg -n 'execFileSync\|execSync\|git ' packages/agentic-workflow/src/telemetry/reconstruct.mjs` matches 0 | the E line and the `rg` output | planned |
| O9 | S2 | the CLI grammar is closed: an unknown operation, flag or missing value exits 2 with `RECONSTRUCT REFUSAL —` on stderr and nothing written | P1 | P3 | execute-phase | `bun test packages/agentic-workflow/test/telemetry-reconstruct.test.mjs` exits 0 with the three refusal cases (exit code and message asserted) | the E line quoting the run | planned |
| O10 | S2 | the command is reachable as `agentic-workflow telemetry reconstruct …` and the crate README's usage line and Commands row match the bin | P5 | P5 | execute-phase | `bun test packages/agentic-workflow/test/cli.surface.test.mjs` exits 0 | the E line quoting the run | planned |
| O11 | regression scope | the telemetry accumulator, both sinks and the wiring behave exactly as before the re-home: their suites pass with their assertions untouched | P2 | P2 | execute-phase | `bun test packages/pi-agentic-workflow/test/telemetry-ledger-sink.test.mjs`, `test/telemetry-jsonl-sink.test.mjs`, `test/session-telemetry.test.mjs` and `test/telemetry-wiring.test.mjs` exit 0 | the E lines quoting the runs and `git diff` showing those suites untouched | planned |
| O12 | regression scope | the ledger reader still reads `@1` and `@2` ledgers and the report still answers from a ledger that carries a reconstructed row | P4 | P4 | execute-phase | `bun test scripts/tier-cost.test.mjs` and `bun test scripts/telemetry-report.test.mjs` exit 0 with their existing cases | the E lines quoting both runs | planned |
| O13 | S4 | a transcript with no assistant message, an unreadable line or no timestamp is reported as skipped rather than turned into a fabricated record | P1 | P3 | execute-phase | `bun test packages/agentic-workflow/test/telemetry-reconstruct.test.mjs` exits 0 with the skipped-transcript cases | the E line quoting the run | planned |
| O14 | S2 | the command writes only the destinations it names: no `git`, no network, no file outside `--jsonl`/`--ledger` | P1 | P3 | execute-phase | the suite's temp-root case diffs the tree before/after `write` and finds only the two destinations changed | the E line quoting the run | planned |
| O15 | S2, S3a | the limitation and the manual workaround are documented where a consumer reads them: crate README, `CONFIG.md`, the 494 SPEC and `TIER_COST.md` | P6 | P6 | execute-phase | `bun scripts/docs-generate.mjs --check` exits 0 and `rg -c 'telemetry reconstruct' packages/agentic-workflow/README.md docs/workflow/CONFIG.md docs/features/494-telemetry-by-turn/SPEC.md docs/workflow/TIER_COST.md` matches 4 files | the E line quoting both runs | planned |
| O16 | delivery | the crate's new public subcommand ships its release intent | P6 | P6 | execute-phase | `bun scripts/lint-changeset.mjs .changeset/624-reconstruct-telemetry.md` exits 0 | the E line quoting the lint | planned |
| O17 | S1–S5 | the whole change is green under the repository gate and the unit doc passes its own verifier | P7 | P7 | execute-phase | `node scripts/run-root-suite.mjs` exits 0 and `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/624-reconstruct-telemetry-from-pi-transcripts/SPEC.md` exits 0 | the G lines quoting both runs | planned |

## Triaged steps

```text
TRIAGE — 624-reconstruct-telemetry-from-pi-transcripts (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
relay: bootstrap-needed — no packet at .pi-web/relays/624-reconstruct-telemetry-from-pi-transcripts
relay-next: create .pi-web/relays/624-reconstruct-telemetry-from-pi-transcripts/ (charter → docs/fix/624-reconstruct-telemetry-from-pi-transcripts/SPEC.md) then dispatch_relay(packet: ".pi-web/relays/624-reconstruct-telemetry-from-pi-transcripts", leg: "1") · legs: 8 = 7 phases + 1 coherence review
```

The Relay line is the router's suggestion and is not taken: this unit is applied
inline under the owner's governing request (§4 — no lane machinery on this
repository's own surgery), so no packet is created and no leg is dispatched.

## Acceptance criteria

Frozen at the cut; each names the check that proves it.

- [ ] **S1** — the reconstruction is derived from Pi's own transcripts, not
  from the untracked POC: a fixture transcript produces the documented record.
  Proof: O1's mapping case in `telemetry-reconstruct.test.mjs`.
- [ ] **S2** — `agentic-workflow telemetry reconstruct stats|samples|write` run
  through the crate's bin with the flags S2 lists, documented token-for-token
  in the README. Proof: O3, O4, O5, O9, O10's cases and
  `bun test packages/agentic-workflow/test/cli.surface.test.mjs`.
- [ ] **S3** — superseded by S3a; recorded, not implemented.
- [ ] **S3a** — the recovery is manual and merges old with current: a session
  already recorded under either source prefix is not written again to that
  destination, and no session lifecycle code reads a transcript. Proof: O5's
  idempotency case and O7's `rg`.
- [ ] **S4** — every listed Pi field is preserved and every unavailable field is
  `null` in the record; the ledger row is the documented projection. Proof: O1,
  O2, O6.
- [ ] **S5** — the reconstruction reports by project, session, date and model
  and never by unit. Proof: O8's case and `rg`.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-06-30, the issue's report, verbatim (the full request is issue #624):
  ```
  No hay datos de telemetría en absoluto. Ni el ledger ni el JSONL tienen muestra alguna...

  Las JSONL de sesión de Pi no contienen muestras de telemetría del workflow — contienen los transcripts completos, que son otra cosa.

  El sistema de telemetría del workflow no guarda en esos transcripts — escribe sus muestras compactas en:
  .pi/.telemetry/sessions.jsonl (dentro del proyecto)
  Y esa ruta nunca se creó (ni siquiera el directorio existe).

  ¿Por qué no hay muestras?
  Las sesiones que ves (~/.pi/agent/sessions/...jsonl) son de Pi, del sistema que las ejecuta. El agentic-workflow telementry es un sink independiente que:
  1. Se activa cuando telemetry.enabled es true
  2. Escribe al sink JSONL (.pi/.telemetry/sessions.jsonl) al cerrar la sesión (flush)
  3. Escribe al sink ledger (TIER_COST.md) como fila de tabla

  Si ni el JSONL ni el ledger tienen filas, significa que nunca se disparó el flush

  session_shutdown se dispara solo cuando la sesión de Pi se termina definitivamente (no vuelve a responder)

  En pi-web, las sesiones permanecen vivas entre prompts. Se mandan mensajes, se responde, se vuelve a idle, se espera el siguiente prompt... pero la sesión no se cierra. Por tanto:
  - Envías un prompt / el modelo responde → No escribe telemetría — se acumula en memoria
  - La sesión se pone idle / timeout → No — sigue viva en memoria
  - La sesión se cierra (shutdown/archivo) → Sí — flush a JSONL + ledger

  La inmensa mayoría de interacciones con Pi-web pierden la telemetría acumulada porque flush() nunca se llama.
  ```
- **L2** — 2026-11-18, the owner's correction to S3, verbatim:
  ```
  La idea es poder recuperar telemetría vieja que no figure en el ledger si no existen datos.

  Como hasta que se implemente 623 fallará el evento para guardar los datos, estaría bien tener un comando en el universal cli que permita reconciliar datos viejos y actuales y así mergear y tener todos los datos disponibles de forma manual si el usuario quiere forzar esa reconciliación. Para no leer archivos ya leídos previamente en cada sesión mejor que sea manual.
  ```
- **D1** — 2026-11-18, the owner's S3a decides the delivery shape: manual
  reconciliation, no wiring listener, no per-session transcript read. Authority:
  L2.
- **D2** — 2026-11-18, the ledger projection: the S4 record keeps its nulls, and
  the `tier-cost@2` row is a projection with `unit`/`phase`/`version` = `null`,
  `changed_paths`/`tool_ms` = `0` (the grammar's integer cells; the sink writes
  `String(value)` and the reader accepts digits only) and
  `source = pi:reconstruct=<session id>`. `readLedger` skips an unattributed row;
  a named unit that does not resolve still refuses. Authority: PE-004, PE-005,
  PE-011, L2.
- **E1** — 2026-11-18, `find ~/.pi/agent/sessions -name '*.jsonl' | wc -l` · exit 0 · 923; a sampled transcript carries `session{cwd,timestamp,id}`, `model_change.modelId`, assistant `usage{input,output,cacheRead,cacheWrite,reasoning,totalTokens}` and `message.durationMs`.
- **E2** — 2026-11-18, `bun scripts/tier-cost.mjs read --ledger docs/workflow/TIER_COST.md` · exit 0 · `rows: []` (0 data rows), so the S3 trigger was live and the ledger is the only store at risk.

## Next

Run P1: land the RED corpus, then implement against it.

## References

- Issue [#624](https://github.com/gtrabanco/agentic-workflow/issues/624).
- Issue #623 — the flush-point fix the owner names; not a blocker, the reason
  the manual reconciliation exists.
- `docs/features/494-telemetry-by-turn/SPEC.md` — the sample, the sinks and the
  `tier-cost@2` grammar this unit reads.
- `packages/pi-agentic-workflow/src/extension/telemetry-wiring.ts` — the flush
  point that never fires in pi-web.
- `.pi/.telemetry/reconstruct-from-transcripts.mjs` — the untracked POC (S1),
  read for flag semantics only; it is not shipped.

## Branch

`feat/624-reconstruct-telemetry-from-pi-transcripts`

## Depends on

None.

## Regression scope

- The telemetry pipeline is unchanged: `off` registers nothing, one session
  emits one sample, the accumulator's counters, the two sinks' appends and the
  duplicate guard keep their assertions — proven by the four untoched
  `packages/pi-agentic-workflow/test/telemetry-*.test.mjs` and
  `session-telemetry.test.mjs` suites (O11).
- The ledger reader keeps reading `@1` and `@2` and refuses a malformed row; the
  report keeps answering from a ledger that carries a reconstructed row — proven
  by `scripts/tier-cost.test.mjs` and `scripts/telemetry-report.test.mjs` (O12).
- The crate's CLI surface keeps its usage-line and Commands-row contract —
  proven by `cli.surface.test.mjs` (O10).
