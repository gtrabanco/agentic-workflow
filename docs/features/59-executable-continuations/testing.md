# testing — 59-executable-continuations

## Validation ladder

| Layer | Required evidence | Command or check |
|---|---|---|
| Schema contract (P1) | backward compat (no field), valid object, four fail-closed shapes with typed errors, canonical vectors, evidence-digest equality + mismatch, refusal-vocabulary export, additive 4.2.0 | `cd packages/agentic-workflow-schema && bun run test` → exit 0 |
| Emission & refusal (P2) | non-terminal fixture emits well-formed argv; every refusal path suppresses `continuation` and emits the mapped code at `detail.continuation_refusal`; offline forge → `sensor-degraded`, never a guessed command; evidence token bound via the schema sha256 helpers | `node --test scripts/workflow-status-sensor.test.mjs` → exit 0 |
| Discipline proof (P2) | 3 classes × (argv parses · preconditions checkable at emit · executing exactly as emitted advances the named `convergence` field) + rendering derivation per platform family + argv immutability + forced divergence fails | `node --test scripts/continuation-discipline.test.mjs` → exit 0 |
| Normative surfaces (P3) | refusal-vocabulary row resolves via the `schema-export:` grammar; `hand-off-fields@1` carries `next \| continuation`; machine→text closed set extended without gaps | `node --test scripts/normative-drift.test.mjs` → exit 0 |
| Quote adoption (P3) | five pinned surfaces quote the emitted continuation; exactly one FEATURE_WORKFLOW pointer; prose `→ Next:` blocks remain | read-verified: per-file sentences quoted in the phase handoff |
| Interview protocol (P4) | form-turn text in `INTERVIEW.md` §3 + `design-feature/SKILL.md` step 3 / progressive loading; superseded rule deleted; rubric/mandatory/ask-nothing verbatim; upsert/review modes untouched | read-verified: §3 + SKILL.md excerpts quoted; `grep -c 'One question per turn' skills/design-feature/references/INTERVIEW.md` → 0 |
| Budgets (P4) | touched skills re-based via the declared re-basis with growth source named | `node scripts/check-skill-context.mjs` → exit 0 |
| Qualification (P5) | whole ladder green; schema diff additive-only; Pi mirror byte-identical; release evidence | `node --test scripts/continuation-discipline.test.mjs scripts/workflow-status-sensor.test.mjs scripts/normative-drift.test.mjs` → exit 0; `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test` → exit 0; `node -p "require('./packages/agentic-workflow-schema/package.json').version"` → 4.2.0 |

## Mandatory scenario inventory

Each dev scenario from the SPEC resolves to the named phase's pins:

- **continuation:empty-state** — fixture repo with no startable unit → envelope
  carries no `continuation` field, exit 0 (P2).
- **continuation:invalid-shape** — package-suite fail-closed cases → typed
  errors, never a printed envelope (P1).
- **continuation:offline-forge** — `gh` shim failing fast → `sensor-degraded` at
  `detail.continuation_refusal`, no `continuation` key, exit 0, no hang (P2).
- **continuation:concurrent-emit** — two consecutive runs → byte-identical
  envelopes; no continuation store exists (P2, D-59-9).
- **interview:ambiguity-cap** — form-turn: 2 follow-up turns then the rubric's
  own `NEEDS_INPUT` escalation, no third ask (P4 text; exercised by the
  golden-fixture procedure, AC11).
- **interview:defaults-accept** — one-word acceptance of every default → one
  form-turn resolves all six slots (P4 text + AC8).

## Tooling

- bun-else-node runtime (repo convention, node-compat CI).
- Throwaway git fixture repos per the existing sensor-suite harness
  (`scripts/workflow-status-sensor.test.mjs:87-123` pattern); `gh` stubs for
  forge state; no network in tests.
