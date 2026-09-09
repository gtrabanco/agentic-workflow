# testing — 38-workflow-status-sensor-script

## Validation ladder

| Layer | Required evidence | Command or check |
|---|---|---|
| Schema validity + field presence (P1) | output parses as one JSON doc that the schema package's `validateEnvelope` accepts, with steps 1–9 field presence per `sensor-fields@1` | `node --test scripts/workflow-status-sensor.test.mjs` (schema-validity + field-presence sections, git fixture repo) |
| Read-only by construction (P1) | no mutation path; labels read, bodies/comments never fetched; headless | A-03 / A-07 / A-22 greps (also pinned in the suite) |
| Determinism (P1) | two consecutive same-tree runs byte-identical | A-05 `diff` run (also pinned) |
| Roadmap/dependency semantics (P1) | five-state mapping with ambiguous-row fallback + transitive dependency closure | suite ambiguous-row + dependency sections (A-06) |
| Loader consumption (P1) | `./schema-runtime.mjs` import present; no bare-specifier import; named precondition when `dist/` missing | A-08 greps + A-11 two-case import test |
| Degradation matrix (P2) | offline fail-fast, non-terminating forge shim, missing git -> namespaced codes in `detail`, exit 0 | suite offline/timeout/missing-git sections (A-04, A-15, A-21) |
| Flag contract core (P1) | `--json-only` no-op + unknown-flag fatal class + envelope-mismatch diagnostic | suite P1 flag/mismatch sections (A-17/A-20 pins + E-38-1 pin) |
| Flag discoverability (P2) | `--help` usage text, `--version` prints the schema package's version | suite flag section + A-10 commands |
| Hint guard (P2) | stale hint -> no-progress note + divergence line, `state`/`next` unchanged; malformed hint fail-open | suite stale-hint + fail-open sections (A-18, A-19) |
| Stream separation (P2) | stdout alone is one valid JSON document; diagnostics on stderr | A-23 command + offline fixture stderr assertion |
| Slimmed skill + pins (P3) | script call present, numbered-step prose gone, grammar block intact; pins re-targeted, never weakened | A-09 greps; `node --test scripts/bounded-delivery-loops.test.mjs scripts/pre-execution-quality.test.mjs scripts/workflow-status-pre-execution.test.mjs scripts/normative-drift.test.mjs` |
| Context budgets (P3) | slimmed sensor within its re-based budget | `node scripts/check-skill-context.mjs` (A-14) |
| Untouched surfaces (P4) | schema package byte-untouched + green; six non-slimmed reference files byte-identical | `git diff --name-only main...HEAD -- packages/agentic-workflow-schema`; schema `npm test`; reference-file diff empty |
| Ledger truth classes (all) | no new ledger row type or owner; no durable-ledger write from the script | `node --test scripts/ledger-ownership.test.mjs scripts/ledger-provenance.test.mjs scripts/pre-execution-quality.test.mjs` |
| Pi distribution (P4) | bundle parity and package behavior after `bundle:skills` | `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test` |
| Injection-safety (P4) | labels-only invariant preserved (feature 15) | read-verified code-review pass (A-RV) |
| Bilingual sync (P4) | ORCHESTRATION.md + `.es.md` move together, links intact | read-verified at PR time (O25) |

## Mandatory scenario inventory

Each dev scenario from the SPEC (`### Dev scenarios`) resolves to the named
phase's pins:

- **sensor:empty-state** — empty roadmap + no forge output -> empty shapes,
  exit 0. Pinned in P1 (schema-validity section over the empty fixture).
- **sensor:invalid-input** — unknown flag -> non-zero + stderr usage;
  malformed/missing hint -> `unavailable-hint-<cause>`, exit 0. Pinned in P2
  (flag + fail-open sections).
- **sensor:envelope-mismatch** — forced invalid envelope (stub schema build
  whose `validateEnvelope` always fails, swapped via the explicit-path loader,
  PE-001) -> stderr diagnostic, envelope still printed, exit 0. Pinned in P1
  (envelope-mismatch section; E-38-1).
- **sensor:dependency-outage** — severed network -> fail-fast codes; non-
  terminating `gh` shim -> `unavailable-forge-timeout` within the bound. Pinned
  in P2 (offline + timeout sections).
- **sensor:concurrent-action** — two parallel runs on the same tree ->
  byte-identical outputs, no locks. Exercised by the A-05 diff run (P1/P2
  suite idempotence pin).
- **sensor:limit-threshold** — > 5 open issues -> `untriaged_issues.oldest_open`
  capped at 5; merged-PR list capped at 20. Pinned in P2 (cap section over a
  large fixture).
- `sensor:permission-denied` / `sensor:data-loss` — n/a (read-only CLI, no
  auth surface; no file writes — proven structurally by A-03/A-22).
