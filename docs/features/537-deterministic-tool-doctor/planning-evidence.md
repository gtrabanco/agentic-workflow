# Planning evidence — feature 537 (deterministic tool doctor + setup wizard)

> One row per Engineering claim the change rests on, in the ledger's closed
> column order (`id | authority-kind | claim | source | freshness |
> affected-decision-or-obligation`, owner
> [`skills/pre-execution-review/references/LEDGERS.md`](../../../skills/pre-execution-review/references/LEDGERS.md)).
> Every claim below was read in this session at the cut base `0563b19d`.

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | forge-issue | The four gaps this unit closes are real and named: rg assumed but never checked; the `engram` binary-vs-served version pair unchecked (the 2026-11-13 incident: a 3.6.0 server serving from a deleted binary inode while 3.7.1 sat unrun); hooks and shared-merge drivers degrading silently when un-armed; install routes hardcoded per tool instead of a closed vocabulary | issue [#537](https://github.com/gtrabanco/agentic-workflow/issues/537) body (Goal / In scope / Acceptance criteria) + `docs/research/2026-11-13-tool-doctor-inventory.md` §"Gaps the spike surfaced" at `0563b19d` | read 2026-11-14 (this session) | O4–O8; the whole change |
| PE-002 | committed-source | The twin module already exists and fixes the pattern: a read-only module with its own contract id, an injectable reading seam, zero dependencies — `RESOURCES_DETECT_CONTRACT_ID = "resources-detect@1"`, `detectHost({ readings, caps })`, no write path anywhere | `packages/agentic-workflow/src/resources/detect.mjs:1,19,96-130` at `0563b19d` | read 2026-11-14 (this session) | O2, O3; the module's shape |
| PE-003 | committed-source | A crate module can publish a normative `schema-export` vocabulary without the schema package: `PATH_GUARD_REASONS` in `src/path-policy.mjs` is already a `normative-surfaces@1` row with `machine: path-protection-reason` | `AGENTS.md` §"Normative surfaces" (`path-protection-reasons` row), `packages/agentic-workflow/src/path-policy.mjs` | read 2026-11-14 (this session) | O13; the vocabulary home |
| PE-004 | committed-source | The bin's usage line and the crate README are pinned to each other token for token, and every dispatched subcommand must have a Commands row — so `doctor`/`setup` cannot land in fewer than three places | `packages/agentic-workflow/test/cli.surface.test.mjs:24-45` | read 2026-11-14 (this session) | O1, O20 |
| PE-005 | measured-probe | Engram's server answers `GET /health` on `127.0.0.1:7437` with a JSON body carrying `status` and `version`; on this host the served version (3.7.1) equals the binary's (`engram --version` → 3.7.1), so the pair check reports `ok` today and the incident is reproduced by injecting 3.6.0 | this session's probe (`curl -s http://127.0.0.1:7437/health`, `engram --version`) | run 2026-11-14 (this session) | O4, O5 |
| PE-006 | version-pinned doc | The two env surfaces the check reads are the extension's own: `ENGRAM_BIN` (binary override) and `ENGRAM_URL` (externally managed server), with blank/whitespace treated as unset | `packages/pi-agentic-workflow/src/extension/engram.ts:68,71,253` (the extension mirrors Engram's documented names) | read 2026-11-14 (this session) | O5, O6 |
| PE-007 | version-pinned doc | Pi declares packages in `settings.json` → `packages: (string \| { source })[]`, always from the agent dir plus `<cwd>/.pi/settings.json` for a trusted project | `packages/pi-agentic-workflow/src/extension/engram.ts:300-335`; installed `@earendil-works/pi-coding-agent@1.5.2` `docs/packages.md` | read 2026-11-14 (this session) | O10 |
| PE-008 | committed-source | The shared-merge driver write has one owner and it is idempotent per class: `SHARED_MERGE_CLASSES = [roadmap, budgets, repo-state, logs]`, `driverName(cls) = agentic-shared-<cls>`, `--install` writes only the keys that differ and reports `unchanged` | `scripts/shared-doc-merge.mjs:71,85,141-157` | read 2026-11-14 (this session) | O8, O16, O17 |
| PE-009 | committed-source | The pre-push hook's write has one owner: `--install-hook` writes the offline-subset `pre-push` hook, so the doctor must detect and never re-implement it | `scripts/local-gate.mjs` (usage block: `--install-hook`) + `AGENTS.md` §"Where the gate runs" | read 2026-11-14 (this session) | O8, O16 |
| PE-010 | committed-source | Serena's project-declaration read is already implemented once, as a `language_servers` list parse over `.serena/project.yml`, and an empty list means no server starts | `packages/pi-agentic-workflow/src/routing/serena-readiness.ts:31-60` | read 2026-11-14 (this session) | O9 |
| PE-011 | committed-tool | A new `normative-surfaces@1` id must be claimed by some gate-inventory row's `surfaces` cell, or `scripts/prose-gate-inventory.test.mjs` refuses; the table's `machine` cell resolves a `schema-export:NAME` against the file the row names | `scripts/prose-gate-inventory.mjs:23,183-220,395-400`; `scripts/normative-drift.test.mjs:417-440` | read 2026-11-14 (this session) | O13, O21 |
| PE-012 | committed-tool | `AGENTS.md`'s machine-region line count is pinned exactly (`machineLines: 137`) and the checker refuses a machine block that grew without a re-pin with its source recorded | `docs/workflow/SKILL_CONTEXT_BUDGETS.json` (`documents.files["AGENTS.md"]`), `scripts/check-skill-context.mjs` | read 2026-11-14 (this session) | O13, O22 |
| PE-013 | measured-baseline | The crate suite's floor at the cut base is **756 pass / 0 fail / 42 files** (after `bun run test`, which builds the schema package) | this session's run of `bun run --cwd packages/agentic-workflow test` | run 2026-11-14 (this session) | O3, O20; the regression floor |
| PE-014 | unknown | Engram's default HTTP port is taken as `7437` from this host's live server; no committed source in this repository declares it, so a host serving on another port reports `unreachable` and the operator's `ENGRAM_URL` is the documented escape — owner: the `engram-server` row's instruction text | not sampled in committed source (`rg -n '7437' packages/ scripts/` → 0) | unverified 2026-11-14 (this session) | O5, O6 |

## Notes

- PE-005 and PE-013 are measured, not cited: the pair check's healthy case and
  the suite's regression floor are the two facts a reviewer re-runs to disprove
  this unit, so both record the command that produced them.
- PE-014 is `unknown` on purpose. Assuming the port would have been a model
  memory claim; the row states what was actually observed and what the code does
  when the assumption fails.
