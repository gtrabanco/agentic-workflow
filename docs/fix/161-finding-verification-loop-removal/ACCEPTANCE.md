# Acceptance manifest v1 — fix-161-finding-verification-loop-removal

Status: frozen

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | The authoring research gate holds: design-stage research is mandatory and fail-closed (≥2 fetched sources, definition + user-expectation coverage), plan-stage research is conditional on a named unanswered bounded question, and fetched web sources are citable evidence rows. | `node scripts/authoring-research.test.mjs` → exit 0, PASS line |
| AC2 | Findings are verified before persistence and signed: confirm-before-persist pinned, `finding-mark@1` block contract pinned (shape, writer, `VF-` prefix, refuted reporting), two-cycle cap lives in `review-change`. | `node --test scripts/review-loop-discipline.test.mjs` → exit 0 (verification pins) |
| AC3 | `loop-review-fold` is fully retired from live surfaces (skills, workflow docs, guides, READMEs, plugin manifest, routing, scripts, schema vocabulary); only `MIGRATION`'s retirement note and the protected `GOLDEN_FIXTURE{,.es}.md` run-log history name it. | `grep -rn "loop-review-fold" skills/ docs/workflow/ docs/site/guides/ README.md README.es.md packages/pi-agentic-workflow/README.md packages/pi-agentic-workflow/README.es.md .claude-plugin/ docs/workflow/model-routing.yml scripts/ packages/agentic-workflow-schema/src packages/agentic-workflow-schema/skill-outcome.schema.json --exclude=GOLDEN_FIXTURE.md --exclude=GOLDEN_FIXTURE.es.md \| grep -v MIGRATION \| wc -l` → 0 |
| AC4 | The schema package builds and is green at 4.0.0 without the retired vocabulary. | `cd packages/agentic-workflow-schema && bun run test` → 0 failing |
| AC5 | The Pi package mirror is byte-identical and green (mirror excludes the retired skill). | `node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs` → 0 failing; `cd packages/pi-agentic-workflow && bun run test` → 0 failing |
| AC6 | No existing contract regressed: full root suite, context budgets, and route budgets all pass. | `node --test scripts/*.test.mjs` → 0 failing; `node scripts/check-skill-context.mjs` → PASS; `node scripts/check-skill-context.mjs --routes` → PASS |
| AC7 | Discovery, bilingual sync, and closure: skills CLI discovers the remaining skills, EN/ES doc pairs moved together, fix-index row `done`. | `npx skills add . --list` → exit 0; `grep -rn "loop-review-fold" docs/workflow/SKILLS.es.md` → 0 matches; fix-index row shows `done · [#PR](url)` |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC
  amendment.
- Passing declared checks is necessary, not sufficient; final independent
  review and named manual checks remain required.
- Validator stability rule honored: no validator gates on a surface other
  workflow actors mutate (historical artifacts and MIGRATION are excluded by
  path, never by hoping — AC3 excludes the `GOLDEN_FIXTURE{,.es}.md` run-log
  history and `MIGRATION` by path).

## Commands

- `node scripts/authoring-research.test.mjs`
- `node --test scripts/review-loop-discipline.test.mjs`
- `grep -rn "loop-review-fold" skills/ docs/workflow/ docs/site/guides/ README.md README.es.md packages/pi-agentic-workflow/README.md packages/pi-agentic-workflow/README.es.md .claude-plugin/ docs/workflow/model-routing.yml scripts/ packages/agentic-workflow-schema/src packages/agentic-workflow-schema/skill-outcome.schema.json --exclude=GOLDEN_FIXTURE.md --exclude=GOLDEN_FIXTURE.es.md | grep -v MIGRATION | wc -l`
- `cd packages/agentic-workflow-schema && bun run test`
- `node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs`
- `node --test scripts/*.test.mjs`
- `node scripts/check-skill-context.mjs && node scripts/check-skill-context.mjs --routes`
- `npx skills add . --list`
