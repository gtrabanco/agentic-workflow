# Feature 64 — decisions & justification records

## Path protection

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/pi-agentic-workflow/test/model-profiles.test.mjs | P3 | 2026-09-26 | execute-phase | the operator-approved recommendation swap (mimo-v2.5 → mimo-v2.6-flash in the judgment slots) changes what AC2 must expect: the four `resolveProfileChain` model-id literals move with the decision, and two docs-parity tests are added (every model the profile routes to must be documented in the README's NaN guidance; every judgment rung the README names must be routed by the profile). No assertion is weakened — the four chains stay exact and `deepEqual`, and the file grows from 45 to 47 tests.
```

## Scope decisions

- **Promotion scope (operator choice, 2026-09-26):** `mimo-v2.6-flash` takes the
  three judgment slot families — `audit-pr`, `product-audit`, `review-change`,
  `unit-lane` — because it keeps the Xiaomi family (reviewer independence from
  the DeepSeek/GLM executors), is stronger on the shared coding/agentic
  benchmarks than the model it replaces, is OpenAI-`tools`-native, and carries
  the same 1.0B token/mo quota, the same always-on reasoning and the same
  concurrency cap of 5 as `mimo-v2.5`.
- **Executor path untouched:** `execute-phase` stays on
  `nan/deepseek-v4-flash` → `nan/glm5.3-flash`. Promoting a 4-day-old model
  into the file-editing loop is explicitly out of scope (README's own rule:
  run the tool-calling smoke test in `docs/workflow/GOLDEN_FIXTURE.md` before
  promoting a model into that path — not run here, so not promoted).
- **`mimo-v2.5` stays served, loses every recommendation.** It is documented
  exactly like `qwen3.6`: previous generation, kept so existing configurations
  keep working.
- **No workflow change in this unit.** The `publish-pi-package.yml` paths
  filter / E409 idempotence question raised alongside this work is a separate
  unit — it changes CI behavior, not the catalog.
