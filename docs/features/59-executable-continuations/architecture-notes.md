# architecture-notes — 59-executable-continuations

## Layer analysis

- **config/infra (P1, P2):** the schema package gains the optional
  `next.continuation` member (TS interface `src/index.ts:159-167` + JSON Schema
  projection `envelope.schema.json:161-182` — the projection must move with the
  interface because `next` sets `additionalProperties: false`), the closed
  `CONTINUATION_REFUSALS` export, the pure `emitContinuation` API, and the
  canonical vectors. The sensor (`scripts/workflow-status.mjs`) consumes the
  emitter at the `resolveNext()`/attach points (`:961-1004`, `:1192`) and gains
  the four fail-closed refusal paths plus the evidence-token binding. The sensor
  stays read-only (O15) and keeps feature 38's pin: `decideWorkflowAction()` is
  never imported into the script (PE-005) — the emitter projects the sensor's
  own resolved command (PE-004).
- **docs (P3, P4):** quote-not-author text at the five pinned surfaces + one
  FEATURE_WORKFLOW pointer; `normative-surfaces@1` row + `hand-off-fields@1`
  row + the drift gate's `schema-export:` grammar resolver; INTERVIEW.md §3 +
  design-feature SKILL.md form protocol; golden-fixture boxes; budget
  re-basis.
- **hardening (P5):** qualification only — ladder runs, mirror re-bundle +
  parity, release evidence, acceptance blob receipt, close-out.

## Contract impact

- **Additive envelope evolution:** `next.continuation` is optional; omission is
  the absence semantics (never `null`, never defaulted). Old consumers that
  validate envelopes stay green (AC1); the JSON Schema keeps
  `additionalProperties: false` with the new optional property declared.
- **Single-emitter boundary:** deterministic side (schema runtime via the
  sensor) is the only writer of continuation objects; models quote. The class
  set (3) and refusal vocabulary (4 codes) are closed; extension is a SPEC
  change (D-59-5).
- **Statelessness:** continuations are projections computed per envelope turn;
  no continuation store exists (D-59-9). The `evidence` token is
  receiver-verifiable by digest equality and persisted nowhere (D-59-9).
- **Normative surface additions:** `continuation-refusal-type` joins the
  drift gate's must-name closed set via the `schema-export:` grammar resolver
  (machine values read from committed schema source, never `dist/` — PE-010);
  `hand-off-fields@1` gains `next | continuation` under the existing
  `envelope-field:next` machine vocabulary.

## Schema/package release

- `@gtrabanco/agentic-workflow-schema` 4.1.2 → 4.2.0 (additive minor; the repo's
  majors freeze until #176 holds — D-59-6). CHANGELOG row + additive-guarantee
  sentence in the package README (AC7).
- `dist/` stays gitignored generated output; the drift gate reads committed
  source only (PE-010), and the sensor's runtime loader keeps requiring a built
  dist (repo convention, feature 38).
