# features/494-telemetry-by-turn — decisions

Path-protection records for this unit (append-only; owner:
`skills/orchestration-envelope/references/TURN_CONTRACT.md`):

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/agentic-workflow-schema/test/telemetry.test.mjs | P2 | 2026-11-17 | execute-phase | The suite was written red-first and inspected; the one assertion that moved is the `model` property's type, from `string` to `["string","null"]`, after the implementation chose a nullable model (D1: a turn the provider named no model for gets no invented value). The rule the case proves (a string field is a string in the schema) is unchanged; the field's declared nullability is the decision D1 records.
justification | packages/pi-agentic-workflow/test/session-telemetry.test.mjs | P3 | 2026-11-17 | execute-phase | The sample's field set changes by design (S1, S15 names this suite as one to update): the content-free case's key list widens from eight to sixteen and the new breakdown/phase/version cases are added beside the untouched #383 cases (span, hung tool, one sample per session, broken sink, emit-time resolution), so the widening is proven not to soften any earlier rule.
justification | packages/pi-agentic-workflow/test/telemetry-wiring.test.mjs | P3 | 2026-11-17 | execute-phase | The phase/environment cases land in the suite that owns the wiring (S1's `AG_WF_PHASE`), beside the untouched #383 assertions (off registers nothing, no unit emits nothing, one session one sample, the path count is the session's own scope).
justification | packages/pi-agentic-workflow/test/telemetry-ledger-sink.test.mjs | P5 | 2026-11-17 | execute-phase | The sink's grammar negotiation (S4/S15: `tier-cost@1` still written to a `@1` ledger, `@2` written to a `@2` ledger) belongs in the round-trip suite; the fixture's column list becomes a parameter and every #383 case (append-only, concurrency, refusal on disagreement, whole-row duplicate guard) stays asserted.
justification | packages/pi-agentic-workflow/test/telemetry-extension.test.mjs | P5 | 2026-11-17 | execute-phase | The shipped-entry proof's fixture ledger and column list follow the grammar change; the two cases it exists for (the adapter names the session pi handed it, `off` registers nothing) keep their assertions verbatim.
justification | scripts/tier-cost.test.mjs | P5 | 2026-11-17 | execute-phase | The reader's `@1`/`@2` matrix (S4: both grammars read, a declared column with no sample value refused) lands in the suite that owns the ledger grammar; the fixture gains a grammar parameter and every existing assertion about tier resolution, ceremony counting and the comparison stays as written.
justification | packages/pi-agentic-workflow/test/default-inherit.test.mjs | P4 | 2026-11-17 | execute-phase | The case pins the whole resolved default shape: the telemetry section now carries `jsonFile` beside `enabled` (S3, D6), so its expected value gains the declared default. Every other section's expectation is untouched and the case still compares the complete object — the zero-config path it proves is unchanged.
justification | packages/agentic-workflow-schema/test/config-contract.test.mjs | P4 | 2026-11-17 | execute-phase | The case proves "defaults for absent keys": the telemetry section now ships `jsonFile` beside `enabled` (S3, D6), so the expected resolved value gains the declared default. The assertion's rule is unchanged — it still compares the fully-resolved section, and every other section's expectation in the same case is untouched.
justification | template/docs/features/_TEMPLATE/SPEC.md | P8 | 2026-11-17 | execute-phase | The scaffold's SPEC template gains the same one-paragraph pointer the repo template already carries for the two M/L ledgers; the section order the contract pins is untouched (the suite that reads all four templates stays green).
justification | template/docs/fix/_TEMPLATE/SPEC.md | P8 | 2026-11-17 | execute-phase | Same one-paragraph pointer as the features template, in the fix scaffold, so both shapes keep publishing the same file set; the pinned section order is untouched.
```

## Decision log

- **D-494-1 (2026-11-17)** — the sample's `model` field ships although S1's
  interface block omits it: S5's `--model` filter, the request's use-case table
  and the promoted feature all read it, and a documented filter that cannot read
  its key is worse than no filter. One deterministic value per session (the
  model that served the most turns, first seen on a tie), because a session may
  switch models and the sample is the session's cost.
- **D-494-2 (2026-11-17)** — S11's "no configuration flags" is read as "no new
  consent gate, never networked". The shipped `telemetry.enabled` switch stays
  (#383's behaviour; S3 itself declares a config key) and the unit adds exactly
  the `jsonFile` key S3 names.
- **D-494-3 (2026-11-17)** — one sample per session, so `phase` names the first
  unit-scoped command — the same rule `unit` already follows. Per-phase rows
  need a second accumulator and are recorded under `Future`.
- **D-494-4 (2026-11-17)** — `pi telemetry report` resolves to
  `bun scripts/telemetry-report.mjs` (I5's own spelling): pi's extension API
  registers slash commands, tools, flags and events and has no CLI-subcommand
  seam, so a package cannot create a `pi <subcommand>` verb.
- **D-494-5 (2026-11-17)** — one grammar per ledger file, chosen by the
  `tier-cost@N` block the file declares: the reader accepts `@1` and `@2`, the
  writer follows the file, and a project on `@1` keeps working (S4's
  "coexists"). This repository's ledger migrates to `@2`; its samples table is
  empty at the cut, so no row is rewritten.
- **D-494-6 (2026-11-17)** — `.pi/.telemetry/sessions.jsonl` is the shipped
  default for `telemetry.jsonFile` (S3 shows it as the configured value, S11
  asks for no extra switch). One switch, one path.
