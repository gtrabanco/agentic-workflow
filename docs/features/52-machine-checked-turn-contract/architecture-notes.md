# Architecture notes — 52-machine-checked-turn-contract

Artifact revision: `52-plan-1`.

## Layer placement

- `packages/agentic-workflow/bin/turn-contract.mjs` + `packages/agentic-workflow/test/`
  → `config/infra` (producer-crate tooling; node-stdlib-only, zero
  dependencies, no lockfile change — PE-006).
- `template/.agentic-workflow/hooks/turn-contract.sh` + its test → `docs`
  layer per the frozen prefix table (`template/` → docs — PE-001), which is
  what forces the P1/P2 split (ED-52-1).
- `skills/orchestration-envelope/references/TURN_CONTRACT.md`,
  `CLAUDE.md`, `docs/workflow/ORCHESTRATION.md`, `docs/workflow/FEATURE_WORKFLOW.md`,
  CHANGELOG/README sync → `docs`.
- `scripts/turn-contract-grammar.test.mjs` → `config/infra`.

## Boundaries

- Read-only verifier: both engines never mutate the repository, index, or
  git config; asserted by the engine suite.
- No schema-package change (`packages/agentic-workflow-schema` untouched;
  D-52-5 — the receipt grammar is pinned repo-side, machine `n/a` in the
  normative-surfaces table).
- No sensor change: the echo consumes the envelope's existing `next`
  fields (`scripts/workflow-status.mjs:922`, `:1270` — PE-002).
- The crate stays `private: true`; target projects receive the verifier via
  the scaffold shim, not the crate (D-52-2).
- Adoption boundary: the canonical `TURN_CONTRACT.md` only; bespoke inline
  contracts migrate via #173 (D-52-7).
- The pi mirror is re-bundled via `npm run bundle:skills` because the
  skills tree changes (PE-010).

## Binding impact

- Downstream: feature 33 (#173, `turn-contract-single-owner`) adopts this
  feature's machine profile for bespoke contracts per skill — its SPEC
  work must not start before the profile exists (soft dependency, SPEC
  §Dependencies). Features 35 (#182) and 48 (#215) may later extend the
  receipt family (scoped receipts, binary continuations) without surface
  overlap today.
- The machine-check profile changes how every canonical-contract consumer
  demonstrates boxes 1–5 (paste a receipt instead of reciting prose); the
  boxes' requirements themselves are unchanged, and boxes 6–11 stay
  agent-attested.
