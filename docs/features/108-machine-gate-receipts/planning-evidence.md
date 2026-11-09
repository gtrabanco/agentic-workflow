# 108 — machine-gate-receipts · planning evidence

One row per Engineering claim this change rests on. `authority-kind` is the closed
cell (`known | assumption | unknown | spec`); `freshness` is
`current | stale | not-applicable`; every row was sampled at the cut head
(`2a28f038`). Column order and vocabularies are owned by
`skills/pre-execution-review/references/LEDGERS.md` §1.

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | known | The schema package declares no `dependencies`; its devDependencies are `ajv 8.20.0` and `typescript 7`, and its root export is `./dist/index.js` — so the contract is source + validators + a Draft-07 projection, never a runtime schema library | `packages/agentic-workflow-schema/package.json:3-27,63-68`; `bun.lock` | current | D1, S3, S10, O3 |
| PE-002 | known | The package already publishes the digest surface the manifest needs: `sha256HexSync` (and the async `sha256Hex`), re-exported from `src/index.ts` | `packages/agentic-workflow-schema/src/sha256.ts:175,190`; `src/index.ts` (`export { sha256Hex, sha256HexSync }`) | current | S3, S12, O4 |
| PE-003 | known | The batch-plan contract is the repository's hand-maintained precedent: one TS module + a dependency-free validator + `batch-plan.schema.json` + an `ajv` parity suite, and the document is closed (unknown keys refused, no metadata escape) | `packages/agentic-workflow-schema/src/batch-plan.ts:1-20`; `batch-plan.schema.json:1-12`; `test/batch-plan.test.mjs:1-50` | current | S3, S10, O1, O15 |
| PE-004 | known | `local-gate.mjs` prints per-step verdicts to stdout only: `runStepAsync` captures each child's stdout/stderr into buffers and hands them to `onSpawnOutput` (`471-497`), `scheduleSteps` returns `statuses`/`failures`/`skipped` (`~440`), and `parseArgs` has no machine-output flag (`508-555`). A receipt therefore needs a declared result document, not a parse of the human log | `scripts/local-gate.mjs:471-497,508-555,700-760` | current | S4, S8, S11, O10, O12 |
| PE-005 | known | `GATE_NAMES` is the closed 13-name audit gate set and `auditVerdict` blocks any name whose value is not exactly `pass`; the existing suite builds its gate maps from `GATE_NAMES`, so adding a name extends the fail-closed set without a second rule | `scripts/audit-pr-gate.mjs:46-115`; `scripts/audit-pr-receipt.test.mjs:18-50,203-207` | current | S5, S9, O14 |
| PE-006 | known | The drift gate reads a published vocabulary from committed source with `export const NAME = Object.freeze([ … ])`, never from `dist/`, and a `schema-export:` row is the declaration home that satisfies `must-name: yes` | `scripts/normative-drift.test.mjs:100-105,416-437,648-665` | current | S10, O15 |
| PE-007 | known | The prose-gate inventory fails closed on an uncited `normative-surfaces@1` id (`surface-seed` → every declared id must be claimed by a row's `surfaces` cell) | `scripts/prose-gate-inventory.mjs:302-417`; `docs/workflow/GATE_INVENTORY.md:58-59` | current | S10, O15 |
| PE-008 | known | `docs/generated/units.md` is a projection of the unit docs and the roadmap, and the gate runs `docs-generate.mjs --check` on every push | `scripts/docs-generate.mjs:1-40`; `scripts/local-gate.mjs:224-232`; `docs/generated/units.md` | current | S1, O17 |
| PE-009 | known | `.agentic-workflow/` carries tracked files (`index.json`, `journal/`), so runtime output must live in a declared ignored subdirectory; `.claude/pre-execution-gates/` is the repository's precedent for ignoring a machine-written local state directory | `.agentic-workflow/index.json` (tracked); `.gitignore` (`.claude/pre-execution-gates/`) | current | S4, O10 |
| PE-010 | known | A new `scripts/<x>.mjs` must land with `scripts/<x>.test.mjs` as two commits — suite red first, implementation green second — enforced by `scripts/red-first.mjs` over git history | `scripts/red-first.mjs:1-30`; `AGENTS.md` §Working rules | current | O10, O11 |
| PE-011 | known | Root suites are bun-first (`bun test scripts/<file>.test.mjs`) with `node --test` as the guaranteed fallback, and the schema package's suites import the built `dist/*.js` | `AGENTS.md` §Verification; `packages/agentic-workflow-schema/package.json:63-66` | current | every obligation validator |
| PE-012 | known | This worktree's checkout root is the git admin directory, so a bare `HEAD` argv is ambiguous ("both revision and filename") and `ceremony.mjs tier classify` must be invoked with `--paths`; unambiguous ranges (`origin/main...HEAD`) work | reproduced: `bun scripts/ceremony.mjs tier classify` → `git-error … ambiguous argument 'HEAD'` | current | §Known pre-existing issues, O16 |
| PE-013 | known | `packages/*/dist/` is a gitignored build output that the gate regenerates, so it cannot be part of a content manifest without hashing bytes no commit owns | `packages/agentic-workflow-schema/.gitignore`; `scripts/schema-runtime.mjs:1-20` | current | S14, O9 |

## Sampled-and-refuted

- **`local-gate.mjs` already emits machine JSON** — refuted by reading
  `parseArgs` (no flag) and `main` (stdout lines only). The runner adds the
  result document instead of scraping the log.
- **A HEAD sha is enough to decide freshness** — refuted by the owner's directive
  (L2): a later commit that touches a signed file leaves the sha valid and the
  evidence dead. The manifest digest carries validity; the sha stays provenance.
