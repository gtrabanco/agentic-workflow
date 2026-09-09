# Acceptance manifest v1 — 45-operator-approved-model-routing

Status: frozen

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | Absent pass entry + default chain exists → pass = default chain | `printf '%s' '{"default":["nan/glm5.3-flash"]}' \| aw resolve-passes` (or `bun scripts/resolve-passes.mjs`) → exit 0; every pass with no `passes` entry resolves to the `["nan/glm5.3-flash"]` chain |
| AC2 | `inherit` → default chain | `printf '%s' '{"default":["nan/cheap1"],"passes":{"review-code":{"model":"inherit"}}}' \| aw resolve-passes` → resolved `passes.review-code` chain equals the `default` chain |
| AC3 | Per-pass chain vs global default | `printf '%s' '{"default":["nan/cheap1","nan/cheap2"],"passes":{"review-code":{"model":"nan/expensive"}}}' \| aw resolve-passes` → `passes.review-code` = `["nan/expensive"]`, every other pass = `["nan/cheap1","nan/cheap2"]` |
| AC4 | Fail-closed inline degrade (absent/empty default, no-yield entry) | `printf '%s' '{}' \| aw resolve-passes` → exit 0; every pass `inline` with reason `no default chain`; same for `"default": []` and for `{"model":"inherit"}` with no usable default |
| AC5 | `auto` passthrough | `printf '%s' '{"passes":{"verify":{"model":"auto"}}}' \| aw resolve-passes` → resolved `passes.verify` chain contains `"auto"` |
| AC6 | review-change consumes the resolved table; round-robin with wrap; spawn-time inline degrade stated | read-verified: `skills/review-change/SKILL.md` + `references/ADVERSARIAL_SETUP.md` name the per-pass resolution from the resolved table, the round-robin distribution (wraps when N > chain length), and the stated inline degrade |
| AC7 | init-workspace bootstrap/upgrade writes `default` + recommended `passes` entries | `grep -n "passes" skills/init-workspace/references/BOOTSTRAP_WRITE.md skills/init-workspace/references/UPGRADE.md` → the pass-routing step appears in both |
| AC8 | Byte stability | two runs of `aw resolve-passes` (or the `.mjs`) on the same input produce byte-identical stdout |
| AC9 | Schema rejects non-ModelRef array element | `default: ["nan/glm5.3-flash", 42]` fails the pi package's strict validator round-trip (`packages/pi-agentic-workflow/src/config/schema.ts`) — package suite case |
| AC10 | model-routing.yml keys stay alphabetical with the `passes` section in place | `bun test scripts/pre-execution-quality.test.mjs` → exit 0 (model-routing key-order assertion) |
| AC11 | Three accepted `default` forms; bare string rejected | `printf '%s' '{"default":{"model":"nan/glm5.3-flash","thinking":"inherit"}}' \| aw resolve-passes` → exit 0; `printf '%s' '{"default":["nan/glm5.3-flash"]}' \| aw resolve-passes` → exit 0; `printf '%s' '{"default":{"model":["nan/cheap","nan/expensive"],"thinking":"high"}}' \| aw resolve-passes` → exit 0; `printf '%s' '{"default":"nan/glm5.3-flash"}'` → exit ≠ 0 |
| AC12 | Unknown root key / invalid types → exit ≠ 0 | `printf '%s' '{"default":{"model":"nan/glm5.3-flash","thinking":"inherit"},"bogus":true}' \| aw resolve-passes` → exit ≠ 0; `printf '%s' '{"default":42}' \| aw resolve-passes` → exit ≠ 0 |
| AC13 | Pass-routing smoke test registered as a model precondition in GOLDEN_FIXTURE.md | `grep -n "pass-routing\|resolve-passes" docs/workflow/GOLDEN_FIXTURE.md` → ≥ 1 match |
| AC14 | `auto` needs no gate of its own — untrusted project config never honored (S11) | read-verified: `packages/pi-agentic-workflow/src/config/load.ts` does not read the project config while untrusted; `src/settings/console.ts` refuses project-scope edits while untrusted |
| AC15 | Recommendation note (not auto-written) in the two non-bootstrapping surfaces | `grep -in "pass.?routing" skills/ship-roadmap/references/MODEL_ROUTING.md docs/workflow/GOLDEN_FIXTURE.md` → ≥ 1 match in each; matched line(s) are the recommendation note (GOLDEN_FIXTURE.md:252 unrelated prose out of scope) |
| AC16 | Unknown pass name rejected | `printf '%s' '{"default":["nan/glm5.3-flash"],"passes":{"review-code":{"model":"nan/glm5.3-flash"},"bogus-pass":{"model":"nan/glm5.3-flash"}}}' \| aw resolve-passes` → exit ≠ 0 |
| AC17 | Invalid model reference rejected at `$.passes.<pass-name>.model` (indexed elements) | `printf '%s' '{"default":["nan/glm5.3-flash"],"passes":{"review-code":{"model":"nope"}}}' \| aw resolve-passes` → exit ≠ 0 with the path on stderr; `printf '%s' '{"default":["nan/glm5.3-flash"],"passes":{"verify":{"model":["nan/glm5.3-flash","also-nope"]}}}' \| aw resolve-passes` → exit ≠ 0, same path prefix with index |
| AC18 | `thinking` carried verbatim, absent → `inherit`, non-scalar rejected | `printf '%s' '{"default":["nan/glm5.3-flash"],"passes":{"debt":{"model":"nan/qwen3.6","thinking":"high"}}}' \| aw resolve-passes` → exit 0, `passes.debt.thinking` = `"high"`, `passes.review-code.thinking` = `"inherit"`; `printf '%s' '{"default":["nan/glm5.3-flash"],"passes":{"verify":{"model":"auto","thinking":["high"]}}}' \| aw resolve-passes` → exit ≠ 0 |
| AC19 | Package README EN+ES + root CHANGELOG EN+ES document `passes`/chain vocabulary; each pair same commit | `grep -n '"passes"' packages/pi-agentic-workflow/README.md packages/pi-agentic-workflow/README.es.md` → ≥ 1 match in each README (documented example/vocabulary line); `grep -cin "pass.?routing\|passes config" CHANGELOG.md CHANGELOG.es.md` → ≥ 1 matching line in each CHANGELOG; each pair verified EN+ES in one commit |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.

## Commands

- `cd packages/pi-agentic-workflow && bun run test` (node fallback: `npm run test:node`)
- `bun test scripts/resolve-passes.test.mjs` (node fallback: `node --test scripts/resolve-passes.test.mjs`)
- `bun test scripts/pre-execution-quality.test.mjs`
- `bun scripts/check-skill-context.mjs`
- `npx skills add . --list`
- `bun run bundle:skills` (after the last edit under `skills/`, before any freeze)
