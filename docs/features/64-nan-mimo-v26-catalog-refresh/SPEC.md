# 64 — nan-mimo-v26-catalog-refresh

> One-line: refresh the NaN catalog surface — README guidance + the built-in `nan`
> profile move to `mimo-v2.6-flash` for every judgment slot, with the two
> surfaces pinned together by tests and released as `0.17.0`.

## Objective

Ship `mimo-v2.6-flash` (released 2026-09-22, catalog documented at
<https://nan.builders/docs/models>) as the Xiaomi model this workflow
recommends and routes to for merge gates, product definition and review —
replacing `mimo-v2.5` in those slots — across **both** surfaces that state the
recommendation: the root `README.md` NaN guidance (the human-facing source of
truth) and `src/config/recommended.ts` (the built-in profile a zero-config
install actually routes with).

## Why

Feature 63 shipped the built-in `nan` profile and, at the time, the README
ladder and `recommended.ts` were written to agree. The catalog then moved
(`mimo-v2.6-flash` landed in the NaN catalog and in `@gtrabanco/pi-nan-provider`
0.7.0) and neither surface followed: `mimo-v2.6-flash` appeared nowhere in the
README, and the profile still spent its judgment budget on `mimo-v2.5`. Nothing
asserted README↔profile parity, so the drift was invisible to CI — it was found
by reading, not by a red gate.

## User outcome

A fresh install with the `nan` provider routes `audit-pr`, `product-audit`,
`review-change` and `unit-lane` through `nan/mimo-v2.6-flash` first, and a
reader of the README sees the same four ladders, the same quota/reasoning/
tool-calling/rate-limit facts, and a catalog list that includes the current
Xiaomi model. Both statements are enforced by the package suite, so the next
catalog refresh cannot silently split them again.

## Acceptance criteria

1. `RECOMMENDED_PROFILES.nan.commands` for `audit-pr`, `product-audit`,
   `review-change` and `unit-lane` list `nan/mimo-v2.6-flash` as their first
   model. Verified by `bun test test/model-profiles.test.mjs` (exit 0).
2. The root README documents `mimo-v2.6-flash` on every surface where
   `mimo-v2.5` was documented: catalog list, quota rule, reasoning-control
   matrix, OpenAI-`tools` set, both judgment ladders, the "never here" columns,
   the adversarial worked example, the pros/cons table and the rate-limit
   paragraph — and no ladder row still runs `mimo-v2.5` as rung 1.
   Verified by `grep -c` over `README.md` (≥ 9 hits) plus
   `grep -n '\*\*mimo-v2.5\*\* (' README.md` returning nothing in a ladder cell.
3. Every model the built-in profile routes to appears in the README's NaN
   guidance, and every judgment rung the README names is routed by the profile
   (the new parity tests). Verified by `bun test test/model-profiles.test.mjs`
   (exit 0, 47 tests — 45 pre-existing + 2 new).
4. `packages/pi-agentic-workflow/package.json` reads `0.17.0` and `CHANGELOG.md`
   carries the matching `0.17.0` row. Verified by the root suite's
   rendered-facts check (`node --test scripts/*.test.mjs`, exit 0).
5. Feature 63's `SPEC.md` records amendment A1 for the AC2 exemplar chain, so a
   frozen acceptance criterion never contradicts the shipped behavior without a
   trace. Verified by `grep -n "Amendment A1" docs/features/63-model-profiles/SPEC.md`.
6. No `SKILL.md` is touched (this unit changes code + docs, not skill wording),
   so no skill version bump is owed. Verified by
   `git diff --name-only main...HEAD | grep -c 'SKILL\.md'` = 0.
7. The full gate is green: package `bun run test` + `bun run test:node`, root
   `node --test scripts/*.test.mjs`, and `bun scripts/check-skill-context.mjs`.

## Non-goals

- **No executor-path promotion.** `execute-phase` stays on
  `nan/deepseek-v4-flash` → `nan/glm5.3-flash`; `mimo-v2.6-flash` is 4 days old
  and the README requires a `GOLDEN_FIXTURE.md` tool-calling smoke run before
  any model enters that path.
- No change to `src/config/defaults.ts` (it names no model — `inherit` is the
  fresh-install contract, feature 63 AC3).
- No CI/workflow change (`publish-pi-package.yml` paths filter, E409
  idempotence) — raised in the same conversation, deliberately a separate unit.
- No catalog additions beyond `mimo-v2.6-flash` (no `glm5.3-flash` /
  `qwen3.8-flash` re-ranking), no NaN quota or rate-limit re-derivation beyond
  what the model page states.
- No `mimo-v2.5` deprecation: it stays in the README's pros/cons and reasoning
  matrix as previous generation.

## Future cost

| Rule | Binds |
|---|---|
| README NaN guidance and `src/config/recommended.ts` must state the same recommendation; the two parity tests fail the suite if a model id moves on one side only | anyone changing either file — enforced by `test/model-profiles.test.mjs` |
| Any recommendation change ships as a package version bump + `CHANGELOG.md` row in the same PR | the `publish-pi-package.yml` version gate skips same-version pushes, so a missed bump is a silent no-op publish |
| A model entering the executor path requires a `docs/workflow/GOLDEN_FIXTURE.md` tool-calling smoke run first | whoever proposes the next promotion |

## Applicable tests

`packages/pi-agentic-workflow`: `bun run test` and `bun run test:node`
(suite includes `test/model-profiles.test.mjs`).
`repository`: `node --test scripts/*.test.mjs` and
`bun scripts/check-skill-context.mjs`.

## Known pre-existing issues

- `publish-pi-package.yml` fails with E409 when a manual `workflow_dispatch`
  races the push-triggered run (observed 2026-09-24, run 36059110486) —
  `does-not-affect` this unit (separate CI unit; the push-triggered publish of
  this PR is unaffected).
- Skill-only merges do not trigger a republish of the npm package (paths filter
  + version gate) — `does-not-affect` this unit (this unit bumps the version).

## Tasks

- P1 — Confirm the catalog facts for `mimo-v2.6-flash` against
  <https://nan.builders/docs/models> and the benchmark position (context,
  quota, tool-calling format, reasoning control, concurrency, tpm) — done, facts
  recorded in the README rows below.
- P2 — README: catalog list, quota rule, reasoning matrix row, OpenAI-`tools`
  set, Merge-gates + Product-definition ladders, "never here" columns,
  adversarial worked example, design-step prose, quota-spent prose, pros/cons
  rows, rate-limit paragraph.
- P3 — `src/config/recommended.ts`: swap the four judgment commands to
  `nan/mimo-v2.6-flash` and update the header comment; move the four AC2
  expectations in `test/model-profiles.test.mjs` with the decision and add the
  two docs-parity tests; amendment A1 in feature 63's `SPEC.md`; version bump
  `0.16.0` → `0.17.0` + `CHANGELOG.md` row.
- P4 — Verification: package `bun run test`, `bun run test:node`, root
  `node --test scripts/*.test.mjs`, `bun scripts/check-skill-context.mjs`, plus
  the AC greps.
- P5 — PR against `main` (one PR, conventional commits).

## Evidence

One row per acceptance criterion: what was run, exit status/digest, observed output (≤2 lines), verified-by.

> Evidence is verified, not claimed — a reviewer re-runs it.

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| 1 | `bun test test/model-profiles.test.mjs` | 0 | 47 pass / 0 fail — `audit-pr`, `product-audit`, `review-change`, `unit-lane` all resolve `nan/mimo-v2.6-flash` first | main agent |
| 2 | `grep -c "mimo-v2.6-flash" README.md` · ladder rung-1 grep | 0 | 15 hits; 0 ladder rows still start on `mimo-v2.5` | main agent |
| 3 | `bun test test/model-profiles.test.mjs` (the 2 new parity tests) | 0 | 47 pass / 0 fail; profiled model set ⊆ README, 3 judgment rungs routed | main agent |
| 4 | `node --test scripts/*.test.mjs` | 0 | 561 pass / 0 fail — rendered-facts: the `0.17.0` row equals `package.json` | main agent |
| 5 | `grep -c "Amendment A1" docs/features/63-model-profiles/SPEC.md` | 0 | 1 (AC2 amended + dated progress-log entry) | main agent |
| 6 | `git diff --cached --name-only \| grep -c 'SKILL\.md'` | 0 | 0 — no skill touched, so no `bump-skill` is owed | main agent |
| 7 | package `bun run test` · `bun run test:node` · root `node --test scripts/*.test.mjs` · `bun scripts/check-skill-context.mjs` | 0 · 0 · 0 · 0 | 406/0 bun · 406/0 node · 561/0 root · PASS context budgets (28 skills) | main agent |

## Progress log

2026-09-26 00:40 — P1 done: catalog facts confirmed against `nan.builders/docs/models` (1M ctx, 1.0B tok/mo, OpenAI function calling, reasoning on with `max_tokens ≥ 300`, concurrency cap 5, 1.5M tpm) and the model's benchmark position confirmed (LLM Stats 45.7 vs `mimo-v2.5` 25.7; wins 3/3 shared benchmarks vs GLM-5.3-Flash) → working tree — next: P2

2026-09-26 00:55 — P2–P3 done: README NaN block refreshed (12 edits), `recommended.ts` judgment slots swapped to `nan/mimo-v2.6-flash` with an updated header comment, four AC2 expectations moved with the decision, two docs-parity tests added, amendment A1 recorded in feature 63's `SPEC.md`, `0.17.0` bump + CHANGELOG row → working tree — next: P4

2026-09-26 01:20 — P4 done: full gate green — package `bun run test` 406/0, `bun run test:node` 406/0, root suite 561/0, `check-skill-context` PASS (28 skills), `test/model-profiles.test.mjs` 47/0, AC greps 15 / 0 / 1 / 0 → Evidence table above — next: P5 (PR)

## Next

P5 — open the single PR against `main`. The path-protection justification is
recorded in `decisions.md`; the two dirty `skills/init-workspace/*` files in the
working tree belong to separate in-flight work and are **not** part of this PR.

## References

Roadmap row: `docs/features/ROADMAP.md` row 64. Amends:
`docs/features/63-model-profiles/SPEC.md` (AC2 exemplar chain, amendment A1).
Catalog: <https://nan.builders/docs/models>. `none` for issues.
