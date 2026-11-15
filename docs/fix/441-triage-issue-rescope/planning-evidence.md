# 441 — triage-issue re-scope · planning evidence

One row per Engineering claim this change rests on. Column order and
vocabularies owned by `skills/pre-execution-review/references/LEDGERS.md`.
`freshness`: when the claim was last verified against its source.

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | forge-issue | The seven behaviours, their wording, and the three Non-goals are the issue's own words, and the issue declares itself a fix unit whose items land when their inputs exist | issue [#441](https://github.com/gtrabanco/agentic-workflow/issues/441) body (`## Expected behaviour` 1–7, `## Non-goals`, `## Path`) read 2026-11-15 | read 2026-11-15 (this session) | S2–S8; the whole change |
| PE-002 | committed-source | Its declared inputs are all closed at this branch's base, so every item is implementable now | `gh issue view` for #436, #437, #438, #440 → all `CLOSED`; `docs/ROADMAP.md` rows 97, 148, and `docs/features/437-review-findings-corpus/` | verified 2026-11-15 (this session) | `## Depends on` = empty; P2–P7 ordering |
| PE-003 | committed-source | A published const array is read from committed source by the drift gate, and the row that declares it is what makes it a normative surface: `schema-export:NAME` parses `export const NAME = Object.freeze([…])` from the row's `file` cell and registers it under the row's `machine` cell, so `must-name: yes` is satisfied by the export itself | `scripts/normative-drift.test.mjs` (`publishedConstArrays`, the `kind === "schema-export"` branch, and the 4c machine→text loop) | read 2026-11-15 (this session) | D2; O1, O9; P2, P3 |
| PE-004 | committed-source | The parity suite enumerates the published sets explicitly — a new canonical const needs a line in its list, or the suite's "every canonical set, non-empty" invariant silently omits it | `scripts/vocabulary-parity.test.mjs` (the published-set table and the `LOG_KIND_TOKENS`/`CEREMONY_*` pin patterns) | read 2026-11-15 (this session) | O1, O9; P3 |
| PE-005 | committed-source | Inside an inventoried fenced block the drift gate treats `Verdict: <a\|b\|c>` alternations and `UPPERCASE-TOKEN —` display lines as **pre-execution** verdicts and refuses any token `PRE_EXECUTION_VERDICTS` does not publish — so the triage verdict line must keep its plain `VERDICT: a \| b` shape and must not gain an angle-bracket alternation | `scripts/normative-drift.test.mjs` (`readFencedTokens`: the `Verdict:` and uppercase display-line matchers; the `unpublished-verdict` refusal) | read 2026-11-15 (this session) | O1; P4, P6 |
| PE-006 | committed-source | The ceremony profile has no `ceremony profile` subcommand: the router reads the block (`readCeremonyProfile`) and emits `Profile: N applied, M refused (ceremony-profile@1 — <source>)` plus `Skipped:` rows, and the `profile` key exists only when a project declares one; the published grammar is `ceremony-profile@1` in the schema package's README with `readCeremonyProfile(text)` as the sole reading authority | `packages/agentic-workflow/src/runner/unit-route.mjs` (`loadCeremonyProfile`, `applyCeremonyProfile`, the triage block printer), `packages/agentic-workflow/src/runner/ceremony-profile.mjs`, `packages/agentic-workflow-schema/README.md` (`ceremony-profile@1`) | read 2026-11-15 (this session) | O7, O8; P5 |
| PE-007 | measured-tree | `execute-phase --repair` does not exist yet, so S7 can only describe the switch as conditional and must keep `/fold-findings` as the live route | `rg -c -- '--repair' skills/execute-phase/SKILL.md` → 0; `rg -c 'execute-phase --repair' skills/` → 0 | run 2026-11-15 (this session) | O11; P7; the Known pre-existing issue row |
| PE-008 | committed-source | The measurements the `remove` verdict consumes are all real commands: the retire receipt and the additive inventory, the tier verdict, and the n code-net ratio the corpus owns | `scripts/residual-classify.mjs` USAGE (`--receipt <surface\|symbol> --date`, `--inventory --base <rev>`); `packages/agentic-workflow/src/runner/ceremony/tier.mjs` (`classify --paths`); `docs/features/437-review-findings-corpus/SPEC.md` (S10, the n code-net metric) | read 2026-11-15 (this session) | O5, O6; P4 |
| PE-009 | committed-source | The typed-receipt carriers are published shapes and an in-tree file: `EnvelopeFixNowFinding` in the schema source, `gate-receipt@1` in the schema README, and the local flow's block already lands as `docs/fix/<unit>/external-verify.md` | `packages/agentic-workflow-schema/src/index.ts` (`EnvelopeFixNowFinding`), `packages/agentic-workflow-schema/README.md` (`gate-receipt@1`), `ls docs/fix/*/external-verify.md` | read 2026-11-15 (this session) | O10; P7 |
| PE-010 | committed-source | The verification-criteria catalogue belongs to the project charter's domain layer and is declared per project as `docs/workflow/VERIFICATION_CRITERIA.md`; **this repository declares none**, so a verdict here records `workflow-generic` and the skill must degrade instead of inventing a catalogue | `template/AGENTS.md` (the documentation-map row and the charter's catalogue paragraph); `ls docs/workflow/VERIFICATION_CRITERIA.md` → absent | verified 2026-11-15 (this session) | O9; P6 |

## Baseline at the cut head

Measured on `35bc7f56` after `bun install --frozen-lockfile` and the schema
package's `bun run build` — the floor this unit must not lower:

| Suite | Result |
|---|---|
| `bun test scripts/normative-drift.test.mjs` | 21 pass / 0 fail |
| `bun test scripts/vocabulary-parity.test.mjs` | 22 pass / 0 fail |
| `bun test scripts/unit-doc-contract.test.mjs` | 21 pass / 0 fail |
| `bun test scripts/skill-lint.test.mjs` | 20 pass / 0 fail |
| `bun test scripts/spec-by-reference.test.mjs` | 17 pass / 0 fail |
| `bun test scripts/review-loop-discipline.test.mjs` | exit 0 (assertion-style suite, no `test()` declarations) |
