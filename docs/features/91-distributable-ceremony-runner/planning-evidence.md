# Planning Evidence — feature/91-distributable-ceremony-runner

> One row per Engineering claim the change rests on. `authority-kind`: `known` |
> `assumption` | `unknown` | `spec`. `freshness`: `current` | `stale` |
> `not-applicable`. Every `known` row was sampled at the cut head (2026-11-12,
> `43e8c1f9`); the command that sampled it is in the `source` cell.

## Ledger

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | known | The published crate cannot import a repository script: `files` is `["bin","src","README.md"]`, so every module a sensor imports must live inside `src/` | `packages/agentic-workflow/package.json` `files` + `bin` | current | O1–O4 (D2 closure) |
| PE-002 | known | Migrating the seven decision-4 sensors drags a 17-file / 9,551-line import closure: `workflow-status`→`unit-route`(1,301)→`ceremony-profile`, `risk-tiers`→`capabilities`(806), plus `unit-doc-phases`(512) and `ceremony/lib`(359); ~1,176 of those lines already live in the crate (`index-document`, `relay/Packet`) | closure walk at the cut head: `for f in scripts/{workflow-status,phase-lint,pre-execution-snapshot,ledger-provenance,needs-input,diff-guard}.mjs; import closure` → 17 files, 9,551 lines | current | O1, O4, O17 |
| PE-003 | known | `scripts/unit-route.mjs` is cited 33 times under `skills/` and is in `workflow-status`'s closure, so it cannot stay a repository script once its importer ships in the crate | `rg -c 'scripts/unit-route\.mjs' skills/**/*.md` → 33 | current | O4, O15 (D2) |
| PE-004 | known | The crate already ships the `agentic-workflow` bin and pins the schema package by exact version (`4.10.0`), so S7 is satisfied by keeping that pin and importing the package entry instead of `src/*.ts` | `packages/agentic-workflow/package.json` `bin`/`dependencies`; `scripts/risk-tiers.mjs:23-27` imports `../packages/agentic-workflow-schema/src/vocabularies.ts` (uncompilable from the crate) | current | O6 |
| PE-005 | known | `packages/agentic-workflow/test/cli.surface.test.mjs` asserts the bin's `usage:` token list equals the crate README's token-for-token and that every token has a Commands row — a new subcommand added to one side alone is a red suite | `packages/agentic-workflow/test/cli.surface.test.mjs:24-40` | current | O2, O14 |
| PE-006 | known | The root suite discovers only top-level `scripts/*.test.mjs`; the crate suite is a separate gated step (`crate-suite-bun` / `crate-suite-node`), so a moved suite must live under `packages/agentic-workflow/test/` to stay gated | `scripts/run-root-suite.mjs` (top-level `readdirSync` filter); `scripts/local-gate.mjs` `STEPS`/`DEPS` | current | O2, O3, O16 |
| PE-007 | known | Every migrated CLI module ends in a self-invocation guard (`invokedDirectly` / `isMain`) and writes its exit through `process.exitCode` or `process.exit`; exporting the existing body as `run(argv)` and dispatching from the bin preserves stdout, stderr and exit code exactly | sampled per file: `scripts/phase-lint.mjs:971-995`, `scripts/workflow-status.mjs:1840`, `scripts/pre-execution-snapshot.mjs:548`, `scripts/needs-input.mjs:453`, `scripts/diff-guard.mjs:277`, `scripts/ledger-provenance.mjs:251-273` | current | O1, O2 |
| PE-008 | known | `scripts/release.mjs apply` (stable) writes package versions and stamps skill/template frontmatter from the computed train version; the canary path only `publish-stage`s temp versions and the cut restores `packages/*/package.json` — so a canary stamp of `RUNNER.md` must be written into the staged tree and restored with it, never committed | `scripts/release.mjs:600-700` (`stageChannelVersions`/restore), `:960-1010` (stable apply), `:1010-1035` (canary) | current | O10 |
| PE-009 | known | `rendered-facts@1` recomputes only `pattern:` (machines `count:<x>` / `const:<contract>`) and `literal:` (same machines) / `package-versions`; a `package:version` machine does not exist, so the drift gate must gain it before the pin row can cite it | `scripts/normative-drift.test.mjs:672-760` (`4d. render-only prose`) | current | O10 |
| PE-010 | known | `phase-lint` accepts the unit doc's `P<n> — <task> (validator: …)` bullets and refuses a bullet without an `(Implements: …)` link or a base requirement no bullet implements | `scripts/phase-lint.mjs` grammar note; run at the cut head on `docs/fix/338-*/SPEC.md` | current | O17 |
| PE-011 | known | `scripts/test-route-map.json` maps changed symbols to their suites and names `unit-route.mjs` / `unit-doc-phases.mjs` paths, so moving those modules without updating the map answers stale paths in `test-impact` | `scripts/test-route-map.json` (grep for `unit-route`) | current | O17 |
| PE-012 | known | `scripts/structural-sibling-pins.mjs` refuses a `scripts/x.mjs` with no sibling `scripts/x.test.mjs`; deleting a migrated script while leaving its suite in `scripts/` (or the reverse) is a red gate | `scripts/structural-sibling-pins.test.mjs` + `scripts/structural-sibling-pins.mjs` | current | O3, O16 |
| PE-013 | assumption | `gh` is the only external dependency of the `pr` module and its failure modes are declared by this unit: absent binary → `gh-missing` (exit 2 block, JSON), unauthenticated → `gh-unauthenticated`, non-zero exit → `gh-error` naming the subcommand. Owner: this unit; each branch is pinned by its suite, and no code path may fall back to an invented API call | owner: this unit, `src/runner/ceremony/pr.mjs`; basis: the issue's "with a declared degradation contract when `gh` is absent". Sampled at the cut head: `gh --version` present on the authoring host; **not** present in CI, which is why the suite stubs `gh` on `PATH` instead of calling it | current | O11 |
| PE-014 | known | The crate suite runs under both runtimes (`bun test --timeout=30000 test/`, `node --test`), and every moved suite is `node:test`-based, so the migration needs no runner rewrite | `packages/agentic-workflow/package.json` `scripts.test`/`test:node`; the existing `test/*.test.mjs` import `node:test` | current | O2, O3 |
| PE-015 | known | `scripts/schema-runtime.mjs` throws at module scope when the schema `dist/` is absent, while the crate resolves the pinned package; a crate module must import the package entry, never the repository guard | `scripts/schema-runtime.mjs:33-45`; `packages/agentic-workflow/package.json` `dependencies` | current | O6 |
| PE-016 | known | `SKILL_CONTEXT_BUDGETS.json` ceilings are `ceil(measured × 1.10)` per file with a `sources` reason per change; `bun scripts/check-skill-context.mjs` and its `--documents` mode read it | `docs/workflow/SKILL_CONTEXT_BUDGETS.json` header + `docs/workflow/SKILL_AUTHORING.md` | current | O12 |
| PE-017 | known | The user-facing skill count is a rendered fact (`docs/workflow/SKILLS.md` restates `count:user-facing`), so a new non-invocable carrier skill must not move it, and a new invocable one must | `AGENTS.md` `rendered-facts@1` row 1; `scripts/normative-drift.test.mjs:676-680` | current | O10, O13 |
| PE-018 | known | The golden fixture spawns executor-path skills against a throwaway repository and asserts the deterministic half; a prose-only rewrite of those skills must leave it green without editing it | `scripts/golden-fixture.test.mjs`; `docs/workflow/GOLDEN_FIXTURE.md` | current | O12 |

## Verification

- Every `known` row was sampled at the cut head `43e8c1f9` with the command in
  its `source` cell; the closure walk (PE-002) is re-runnable against the tree.
- **PE-013 is the only `assumption`** and it is owned by this unit: its three
  refusal branches become suite-pinned facts at P4 (`O11`), where the ledger row
  flips to `verified` only after the suite runs in the foreground.
- No `unknown` rows remain at the cut: the two facts an unsampled model memory
  would have supplied — how `release.mjs` splits stable from canary (PE-008) and
  what the `rendered-facts` machinery can recompute (PE-009) — were read from the
  files at the cut head instead.
