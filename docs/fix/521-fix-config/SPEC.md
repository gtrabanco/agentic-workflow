---
type: fix
scope: small
ac-hash: 6a97b6c53408ba407f4bb2a035a1e9ee0dd204b3ea630a6e3aae27763c47eed3
---

# fix/521-fix-config

> Fix specification — one single unit document. Applied through the owner's
> local unpublished workflow (§5 ledger freeze substitutes for the lane's plan
> step); no repo review/fold machinery runs on this change. XS/S sizing: the
> two planning ledgers are embedded below, never a sibling file.

## Issue

`#521` — "fix(config): use Bun.JSONC.parse in parseConfigFile for JSONC
support". The PR closes it via `Closes #521`.

## Specs

**S1 — Apply the issue through the owner's local workflow.**
> Apply to this repository: issue #521

**S2 — The extension file is parsed with `JSON.parse`, so it is not JSONC.**
> `packages/pi-agentic-workflow/src/config/schema.ts` line 730 uses `JSON.parse()` to parse `pi-agentic-workflow.json`. `JSON.parse` does not support JSONC (comments, trailing commas), while Bun provides `Bun.JSONC.parse()` natively.
>
> The other config file (`agentic-workflow.json`) already uses the custom `parseJsonc` from `packages/agentic-workflow-schema/src/config-jsonc.ts` and works correctly. This inconsistency causes failures when the user writes comments or trailing commas in `pi-agentic-workflow.json` — particularly under Node.js where there is no built-in JSONC parser.

**S3 — The reproduction: a comment makes the file invalid and blames Engram.**
> 1. Create a `pi-agentic-workflow.json` with a comment:
> ```json
> {
>   // "default": { "model": "inherit" }
>   "stateFlow": { "enabled": false }
> }
> ```
>
> 2. `JSON.parse()` throws: `SyntaxError: Unexpected token ///`
> 3. `parseConfigFile()` returns `{ ok: false }`
> 4. `loadConfig.ok = false`
> 5. `provisionEngram(configInvalid: true)` → error message:
>
> ```
> pi-agentic-workflow: Engram not registered — the package's config file is invalid, so its consent could not be read and nothing was written (fix the reported problems and the next session reads the switch again).
> ```

**S4 — Root cause: raw `JSON.parse` where the base file uses `parseJsonc`.**
> Line 730 of `packages/pi-agentic-workflow/src/config/schema.ts`:
>
> ```typescript
> parsed = JSON.parse(text);
> ```
>
> `agentic-workflow.json` uses `parseJsonc` from the schema package and works fine. `pi-agentic-workflow.json` uses raw `JSON.parse` — a half-baked JSONC implementation that only works by accident when the file has no comments/trailing commas.

**S5 — Fix: a JSONC parser that works in both Bun and Node.**
> Replace `JSON.parse` with a JSONC parser that works in both Bun and Node:
>
> **Option A (recommended):** Use `Bun.JSONC.parse()` with a Node.js fallback (either a small inline parser or the existing `parseJsonc` from the schema package if it is importable from here).
>
> **Option B:** Import and reuse the existing `parseJsonc` function from `@gtrabanco/agentic-workflow-schema` — the schema package already has a robust JSONC parser (handles comments, block comments, and proper error location reporting). This is DRY and already tested.

**S6 — Impact: comments are common, Node fails immediately, the message misleads.**
> - Affects any user who puts comments in `pi-agentic-workflow.json` (very common since the package docs use `//` comments in examples)
> - Bun: works by luck (no comments in user files → no failure)
> - Node: fails immediately on any comment, which is probably most users
> - The error message is misleading: blames the Engram registration instead of showing the actual JSON parse error

## Impact

- **`packages/pi-agentic-workflow/src/config/schema.ts`** — `parseConfigFile`
  gains the schema package's `parseJsonc` import and loses the `JSON.parse`
  try/catch. The failure message keeps its `invalid JSON: ` prefix and gains
  `line <n>:<col>: `, the same location the base-file loader already reports.
- **Every `parseConfigFile` caller**, unchanged in signature and contract:
  `config/load.ts` (`loadScope` → `problems[].message`), `settings/console.ts`
  (opening a scope refuses over an invalid file; a commented file now opens)
  and the six schema suites that drive it from memory.
- **`docs/workflow/CONFIG.md`** already declares both files JSONC, so the code
  catches up with the guide; the page gains the one consequence the contract has
  always implied — the settings console rewrites the extension file as plain
  JSON, so comments are not preserved by a save.
- **`packages/pi-agentic-workflow/README.md`** — the "Model routing" section
  already says "Two JSONC files"; it gains the same save consequence in one
  sentence, beside the file table it describes.
- **Nothing live is touched**: no `pi-agentic-workflow.json` in this repository
  is rewritten and the extension is not restarted; every parse runs in the
  package's own test process over in-memory text.
- **Out of scope, named**: `hooks.json` (`src/hooks/config.ts`) keeps
  `JSON.parse` — it is the Claude Code config shape ported as-is, no doc
  declares it JSONC, and issue #521 names only `pi-agentic-workflow.json`.

## Retirements

- **`JSON.parse` as the extension file's parser** (S4): retired in
  `parseConfigFile`; its replacement is the schema package's `parseJsonc`. No
  consumer evidence: `rg -n 'JSON.parse' packages/pi-agentic-workflow/src/config/schema.ts`
  → 0 matches, while the same command over `src/hooks/config.ts` still matches
  (the declared out-of-scope sibling).
- **The runtime-split parser the issue's Option A spells out** (D1): a
  `Bun.JSONC.parse` fast path with a Node fallback is retired before it is
  written, because the two parsers do not accept the same language (PE-003:
  Bun 1.4.4 accepts single-quoted strings and hex numbers the package parser
  rejects). Its replacement is the one parser both files already read.
- Nothing else is removed: the strict validator, the fail-closed loader, the
  settings console's refuse-to-save-over-invalid rule and every config key stay
  exactly as they are (S5 is a parser swap, not a schema change).

## Non-goals

- No change to the engram notification text. S6's last bullet is a symptom of
  S3's false invalid file: once a commented file parses, `configInvalid` only
  fires for a genuinely broken file, where the message is accurate and the
  dispatch refusal prints the parser's own problems
  (`src/routing/dispatch.ts`: `invalid configuration (<scope> <path>: <message>)`).
  Passing the problems into `provisionEngram` would duplicate that surface.
- No comment-preserving writer. The settings console keeps writing
  `JSON.stringify(file, null, 2)`; preserving comments across a save is a
  JSONC-AST editor, a unit of its own.
- No `Bun.JSONC.parse` fast path (D1) and no second parser in this package.
- No change to `hooks.json`, to `agentic-workflow.json`, to the config schema
  package's parser, or to any config key, value or default.
- No new dependency: `@gtrabanco/agentic-workflow-schema` is already a direct
  dependency of this package (`package.json`) and already imported by this
  file for `PASS_NAMES`.

## Risk tier

- **Tier** — `standard` · **Task Size** — `understood + contained + resumable`
- **Named high-risk item** — `none — not a high-tier unit`

Verdict (`bun scripts/ceremony.mjs tier classify --base main --paths
packages/pi-agentic-workflow/src/config/schema.ts
packages/pi-agentic-workflow/test/config-jsonc.test.mjs
docs/fix/521-fix-config/SPEC.md docs/ROADMAP.md .changeset/`, at the cut head
`43e8c1f9`):

```json
{"contract":"risk-tier-verdict@1","tier":"standard","reason":"3 path(s) carry executable content: .changeset/, packages/pi-agentic-workflow/src/config/schema.ts, packages/pi-agentic-workflow/test/config-jsonc.test.mjs","reason_kind":"executable-content","task_size":{"understood":true,"contained_risk":"contained","resumable_from_diff":true,"ceremony":"unit-doc","verification":"gates"},"signals":[]}
```

A parser swap on one private function: the change is the two lines that call a
tested parser, and every failure mode is observable through the loader, so the
verdict's `contained_risk` is the truth this unit relies on.

## Future

none

## Future cost

- The extension file's accepted language is now the schema package's JSONC
  parser, not a runtime builtin: a future `Bun.JSONC.parse` adoption (or a
  Node 24 `--experimental-json-modules`-style reader) must first reconcile the
  two languages (PE-003), or the config's meaning becomes host-dependent.
- A comment written into `pi-agentic-workflow.json` survives until the next
  settings-console save, which rewrites plain JSON. Whoever writes the
  comment-preserving editor owns making that sentence in `CONFIG.md` obsolete.

## Applicable tests

`bun test test/config-jsonc.test.mjs` (the corpus: red first per §2/§6), the
package suite `bun run test` (tsc + every consumer of `parseConfigFile`), and the
root gate `bun scripts/local-gate.mjs` before handoff.

## Known pre-existing issues

- `packages/pi-agentic-workflow/src/hooks/config.ts:162` parses `hooks.json`
  with `JSON.parse`. **Does not affect** this unit: a different file with a
  different (Claude Code) shape, declared as JSON in every doc; recorded here so
  the class is visible rather than silently skipped.
- The repository's `.agentic-workflow/index` toolchain and the four worktrees
  under `.worktrees/` are untouched by this unit; no config file under
  `~/.pi/agent` or `.pi/` is read or written by the tests (every fixture is
  in-memory).

## Acceptance criteria

- **AC-S1** — The unit is applied through the owner's local workflow: the
  planning ledgers are frozen in this document before the implementation lands,
  and the work arrives as conventional commits. Check: `ls
  docs/fix/521-fix-config/` lists `SPEC.md` only (XS/S embeds the ledgers);
  `git log --oneline main..HEAD` shows the unit's own conventional commits.
- **AC-S2** — The extension file is read by the same JSONC parser the base file
  uses, with no runtime split: `parseConfigFile` carries no `JSON.parse` and
  imports `parseJsonc` from `@gtrabanco/agentic-workflow-schema`. Check:
  `rg -n 'JSON.parse' packages/pi-agentic-workflow/src/config/schema.ts` exits 1
  (0 matches); `rg -n 'parseJsonc' packages/pi-agentic-workflow/src/config/schema.ts`
  matches 2 (the import and the call).
- **AC-S3** — The issue's reproduction now works: a `pi-agentic-workflow.json`
  with a `//` comment parses, `loadConfig` answers `ok: true` with no problems,
  and the Engram consent in the base file is read instead of refused. Check:
  tests `J1`/`J3` in `test/config-jsonc.test.mjs` exit 0.
- **AC-S4** — A genuinely invalid file still fails closed: `parseConfigFile`
  answers `ok: false` with no `config` property and one issue at `$` carrying
  the parser's error and its line and column, and `loadConfig` refuses with that
  problem. Check: tests `J5`/`J6` and the pre-existing `AC12` cases in
  `test/config-merge.test.mjs` exit 0.
- **AC-S5** — The declared JSONC surface is accepted and plain JSON is
  untouched: block comments and trailing commas parse, and a comment-free file
  parses to exactly the config it produced before. Check: tests `J2`/`J4` exit 0;
  `cd packages/pi-agentic-workflow && bun run test` exits 0.
- **AC-S6** — Documentation and repository state ship in the same change: both
  config docs state the landed contract and the save consequence, the roadmap
  `## Fixes` row exists, the changeset intent and the journal fragment are
  written, and the projection is rendered by the emitter. Check:
  `bun scripts/lint-changeset.mjs` exits 0, `bun scripts/docs-generate.mjs
  --check` exits 0, `rg -n '#521' docs/ROADMAP.md` matches 1, and
  `bun scripts/local-gate.mjs` exits 0.

## Tasks

- P1 — Freeze this unit doc with its embedded planning ledgers and the
  acceptance criteria, before the implementation lands (validator:
  `bun scripts/phase-lint.mjs docs/fix/521-fix-config/SPEC.md` exits 0)
  (Implements: S1)
  - Relevant files: docs/fix/521-fix-config/SPEC.md, docs/ROADMAP.md
- P2 — RED corpus first, then the parser swap: `test/config-jsonc.test.mjs`
  observed failing on the pre-change tree, then `parseConfigFile` reads
  `parseJsonc` and reports `line <n>:<col>` with the parse error (validator:
  `bun test test/config-jsonc.test.mjs` exits 0 — `J1`–`J6`)
  (Implements: S2, S3, S4, S5)
  - Relevant files: packages/pi-agentic-workflow/test/config-jsonc.test.mjs,
    packages/pi-agentic-workflow/src/config/schema.ts
- P3 — Differential check: the same corpus driven from memory through the base
  commit's parser (`git show main:packages/pi-agentic-workflow/src/config/schema.ts`)
  and through this change, in `mktemp -d`, with every output difference declared
  (validator: the harness diff `matches` only the three declared deltas —
  comments/trailing commas flip from `invalid JSON` to parsed, the failure
  message gains `line <n>:<col>`, a non-object root gains the `invalid JSON: `
  prefix)
  (Implements: S5)
- P4 — Documentation and repository state in the same change:
  `docs/workflow/CONFIG.md` (one parser, the save consequence), the package
  README's routing section, the roadmap `## Fixes` row (hand edit — no emitter
  appends fix rows), the changeset intent through the deterministic emitter,
  the journal fragment, and the generated projection through the renderer
  (validator: `bun scripts/lint-changeset.mjs` exits 0 and
  `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S6, S1)
  - Relevant files: docs/workflow/CONFIG.md,
    packages/pi-agentic-workflow/README.md, docs/ROADMAP.md, .changeset/,
    docs/generated/
- P5 — Verification: the package suite and the declared root gate in the
  foreground, every obligation closed (validator: `bun scripts/local-gate.mjs`
  exits 0)
  (Implements: S1, S5)

### Planning evidence

One row per Engineering claim the change rests on, in the ledger's closed column
order. Every claim below was read in this session at the cut head `43e8c1f9`.

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | forge-issue | The bug is real and reproduced from the issue: `parseConfigFile` line 730 is the only parser of `pi-agentic-workflow.json`, it is `JSON.parse`, and a comment or trailing comma makes the whole load fail (`ok:false`) | issue [#521](https://github.com/gtrabanco/agentic-workflow/issues/521) body + `packages/pi-agentic-workflow/src/config/schema.ts:725-736` | read 2026-11-12 (this session) | O1–O7; the whole change |
| PE-002 | committed-source | The base file already reads the schema package's `parseJsonc` (`src/config/load.ts:8,123`), and this package already depends on that package and imports from it in the same file (`schema.ts:13` `PASS_NAMES`), so the fix is an import plus two lines — no manifest change, no new dependency | `packages/pi-agentic-workflow/src/config/load.ts`, `src/config/schema.ts`, `packages/pi-agentic-workflow/package.json` (`dependencies`) | read 2026-11-12 (this session) | D1; O4 |
| PE-003 | measured-baseline | `Bun.JSONC.parse` (bun 1.4.4, the runtime this checkout pins) and the schema package's `parseJsonc` do **not** accept the same language: Bun accepts `{'a': 1}` and `{"a": 0x10}`, the package parser rejects both; on the four JSONC constructs they agree (line/block comments, trailing commas in objects and arrays, BOM), and on duplicate keys both keep the last value. Bun's errors carry no position; the package's carry line and column | probe run in this session over `Bun.JSONC.parse` and `packages/agentic-workflow-schema/dist/index.js` (`parseJsonc`), 15 cases | run 2026-11-12 (this session) | D1; O4, O9 |
| PE-004 | committed-source | The JSONC parser exists precisely so both runtimes read the same bytes: its header states "Bun parses JSONC natively; Node does not, and this package is dependency-free by contract, so the parser lives here and both consumers read the same bytes", and it has its own suite (`config-jsonc.test.mjs`, 8 tests) covering comments, trailing commas, BOM, empty files, non-object roots and error location | `packages/agentic-workflow-schema/src/config-jsonc.ts:1-8`, `packages/agentic-workflow-schema/test/config-jsonc.test.mjs` | read 2026-11-12 (this session) | D1; O2, O5 |
| PE-005 | committed-docs | Both config files are already declared JSONC in the human docs ("Both files are **JSONC**", "Two JSONC files"), so the code is the drift this unit repairs and the docs need the save consequence, not a format change | `docs/workflow/CONFIG.md:23`, `packages/pi-agentic-workflow/README.md:267` | read 2026-11-12 (this session) | O10 |
| PE-006 | committed-source | `parseConfigFile` has four consumers and none inspects the parser: `config/load.ts` (problems), `settings/console.ts` (open refuses over invalid; save re-serializes with `JSON.stringify(file, null, 2)`), and six package suites that import `../dist/config/schema.js` | `rg -n 'parseConfigFile' packages/pi-agentic-workflow/src packages/pi-agentic-workflow/test` | read 2026-11-12 (this session) | O3, O8; the save consequence in O10 |
| PE-007 | committed-source | The existing failures pin the message contract this unit must keep: `test/config-merge.test.mjs` asserts `ok:false`, one issue at path `$`, a message matching `/JSON/`, and the absence of a `config` property; a non-object root (`[1,2,3]`, `null`) is asserted by path only, so the parser's own wording is free to move | `packages/pi-agentic-workflow/test/config-merge.test.mjs:193-240` | read 2026-11-12 (this session) | O6, O7, O9 |
| PE-008 | committed-source | The engram refusal is a separate decision surface that never sees the parse problems (`provisionEngram({configInvalid: !loaded.ok})`), and the dispatch refusal is where the problems are printed (`/${command.name} refused: invalid configuration (<detail>)`) | `src/extension/index.ts:433-437`, `src/extension/engram.ts:202-212`, `src/routing/dispatch.ts:231-237` | read 2026-11-12 (this session) | D2; Non-goals |
| PE-009 | committed-source | The roadmap `## Fixes` table has **no** deterministic emitter (`syncRoadmapDocument` writes feature rows only), so the `#521` row is a hand edit reported rather than silently written; the changeset and the projection do have emitters (`scripts/changeset-create.mjs`, `scripts/docs-generate.mjs`) | `scripts/docs-generate.mjs` (`syncTable`: `if (kind === "feature")`), the #509/#460 precedents | verified 2026-11-12 (this session) | O11 |
| PE-010 | measured-baseline | The regression floor at the cut head `43e8c1f9` (after `bun run build` in the package): `bun test test/config-merge.test.mjs test/config-schema-stateflow.test.mjs test/model-profiles.test.mjs` → 69 pass / 0 fail; the new corpus before any implementation → 1 pass / 5 fail | this session's two runs | run 2026-11-12 (this session) | O5, O8, O12 |
| PE-011 | committed-tool | `bun scripts/phase-lint.mjs` reads the unit-doc grammar (`P<n> — <task> (validator: …)` + `(Implements: …)` + optional `Relevant files:`), and `bun scripts/ceremony.mjs tier classify` is the only tier authority; both ran on this document at the cut head | `scripts/phase-lint.mjs` header, `scripts/ceremony/tier.mjs` | run 2026-11-12 (this session) | P1; Risk tier |
| PE-012 | unknown | Whether a user edits `pi-agentic-workflow.json` through any other writer than the package's settings console (an editor, a dotfiles manager, `jq`) is not observable from this repository; the save consequence is declared for the one writer this package owns and owned by that surface | not sampled — no writer exists in this repository beyond `src/settings/console.ts` (`rg -n 'writeFileSync' src/config src/settings`) | unverified 2026-11-12 (this session) | O10 |

### Obligations

One row per normative behaviour, compatibility invariant, affected use case and
required failure state, in the ledger's 9-column order. Each row carries its
`S#` in `authority-source`, exactly one phase and one task, a backticked
validator with the outcome it must produce, and is `planned` at cut time.

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S3 | a `pi-agentic-workflow.json` carrying a `//` line comment parses: `parseConfigFile` answers `ok: true` with the declared keys, never `{ ok: false }` | P2 | P2 | direct application (this session) | `bun test test/config-jsonc.test.mjs` exits 0 (`J1`) | E line in SPEC `## Log` | planned |
| O2 | S5 | block comments and trailing commas in objects and arrays are accepted in the extension file | P2 | P2 | direct application (this session) | `bun test test/config-jsonc.test.mjs` exits 0 (`J2`) | E line in SPEC `## Log` | planned |
| O3 | S3, S6 | the loader reads a commented extension file end to end — `loadConfig.ok` is true, `problems` empty, the extension value is applied, and the base file's `memory.engram` consent is read (the issue's steps 3–5 no longer reach `config-invalid`) | P2 | P2 | direct application (this session) | `bun test test/config-jsonc.test.mjs` exits 0 (`J3`) | E line in SPEC `## Log` | planned |
| O4 | S2, S5 | the extension file and the base file are parsed by the same JSONC parser, with no runtime split: `parseConfigFile` carries no `JSON.parse` and reads `parseJsonc` from the schema package | P2 | P2 | direct application (this session) | `rg -n 'JSON.parse' packages/pi-agentic-workflow/src/config/schema.ts` matches 0 and `rg -n 'parseJsonc' packages/pi-agentic-workflow/src/config/schema.ts` matches 2 | E line in SPEC `## Log` | planned |
| O5 | S5 | plain JSON is untouched: a comment-free file parses to exactly the config it produced before | P2 | P2 | direct application (this session) | `bun test test/config-jsonc.test.mjs` exits 0 (`J4`) and `bun test test/config-merge.test.mjs test/config-schema-stateflow.test.mjs test/model-profiles.test.mjs` exits 0 (69 pass) | E line in SPEC `## Log` | planned |
| O6 | S4 | a syntax error still fails at `$` with no `config` property, and the message carries the parser's error with its line and column (`invalid JSON: line <n>:<col>: …`) | P2 | P2 | direct application (this session) | `bun test test/config-jsonc.test.mjs` exits 0 (`J5`) | E line in SPEC `## Log` | planned |
| O7 | S4 | a broken file still fails the load closed: `ok:false`, exactly one problem at `$` carrying `invalid JSON`, and the caller gets the shipped default rather than a half-read file | P2 | P2 | direct application (this session) | `bun test test/config-jsonc.test.mjs` exits 0 (`J6`) and `bun test test/config-merge.test.mjs` exits 0 (the `AC12` cases) | E line in SPEC `## Log` | planned |
| O8 | S5 | the pre-existing config behaviour is unchanged: every `parseConfigFile` consumer (loader, settings console open/save, profiles, passes, subagents, state flow) still reads its fixture and the package suite stays green | P4 | P2 | direct application (this session) | `cd packages/pi-agentic-workflow && bun run test` exits 0 | E line in SPEC `## Log` | planned |
| O9 | S5 | the differential run against the base commit differs only in the declared deltas: comments/trailing commas now parse, the failure message gains `line <n>:<col>`, and a non-object root gains the `invalid JSON: ` prefix | P3 | P3 | direct application (this session) | differential run in `mktemp -d` (base copy vs change, identical corpus): every diff line is one of the three declared deltas | E line in SPEC `## Log` with the diff summary | planned |
| O10 | S6 | the documentation states the landed contract: both files are JSONC through one parser, and the settings console rewrites the extension file as plain JSON, so a save does not preserve comments | P4 | P4 | direct application (this session) | `rg -n 'JSONC' docs/workflow/CONFIG.md packages/pi-agentic-workflow/README.md` matches ≥2 and `rg -n 'plain JSON' docs/workflow/CONFIG.md packages/pi-agentic-workflow/README.md` matches 2 | E line in SPEC `## Log` | planned |
| O11 | S1 | repository state ships in the same change: the roadmap `## Fixes` row (hand edit — no emitter writes fix rows), the changeset intent, the journal fragment, and the generated projection through the renderer | P4 | P4 | direct application (this session) | `bun scripts/lint-changeset.mjs` exits 0, `bun scripts/docs-generate.mjs --check` exits 0, `rg -n '#521' docs/ROADMAP.md` matches 1 | E line in SPEC `## Log` | planned |
| O12 | S1, S5 | the declared deterministic gates are green before handoff | P5 | P5 | direct application (this session) | `bun scripts/local-gate.mjs` exits 0 | G line in SPEC `## Log` | planned |

## Triaged steps

n/a — applied inline per the owner's instruction (S1): the §5 ledger freeze
substitutes for the lane's plan step, and no repo machinery runs on this
surgery.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-12, the request, verbatim:
  ```
  Apply to this repository: issue #521
  ```
- **L2** — 2026-11-12, the issue, verbatim (title + the `Bug`, `Reproduction`,
  `Root cause`, `Fix` and `Impact` sections, quoted as S2–S6 above; full text in
  the forge):
  ```
  fix(config): use Bun.JSONC.parse in parseConfigFile for JSONC support

  `packages/pi-agentic-workflow/src/config/schema.ts` line 730 uses `JSON.parse()`
  to parse `pi-agentic-workflow.json`. `JSON.parse` does not support JSONC
  (comments, trailing commas), while Bun provides `Bun.JSONC.parse()` natively.
  The other config file (`agentic-workflow.json`) already uses the custom
  `parseJsonc` ... and works correctly.
  ```
- **D1** — 2026-11-12, parser choice (authority: S5's Option B + PE-003 + PE-004):
  the schema package's `parseJsonc`, with no `Bun.JSONC.parse` fast path, despite
  the issue title. The two parsers do not accept the same language (`Bun`
  accepts single-quoted strings and hex numbers the package parser rejects), so
  a runtime split would make "is this config valid?" depend on the host runtime —
  the exact inconsistency issue #521 reports. One parser, both files, both
  runtimes.
- **D2** — 2026-11-12, scope bound on S6's last bullet (authority: PE-008): the
  engram notification keeps its text; it fires only for a genuinely broken file
  once S3 is fixed, and the parse reason is printed by the dispatch refusal.
  Recorded in `## Non-goals`, not silently dropped.
- **D3** — 2026-11-12, scope bound on the writer (authority: PE-006 + PE-012):
  the settings console's plain-JSON save is documented, not changed; a
  comment-preserving writer is a JSONC-AST editor and owns its own unit.
- **E1** — 2026-11-12, baseline at the cut head `43e8c1f9` (after `bun run build`
  in the package): `bun test test/config-merge.test.mjs
  test/config-schema-stateflow.test.mjs test/model-profiles.test.mjs` · exit 0 ·
  69 pass, 0 fail.
- **E2** — 2026-11-12, RED corpus observed before any implementation:
  `bun test test/config-jsonc.test.mjs` · exit 1 · 1 pass, 5 fail (`J1`–`J3`
  fail on the comment/trailing comma, `J5`–`J6` on the missing location; `J4`
  is the no-change guard and passed trivially).
- **P1** — 2026-11-12, this document frozen with its embedded planning ledgers,
  acceptance criteria and task list · commit <this commit>.

## Next

P2: commit the RED corpus alone, then land the parser swap and close O1–O8.

## References

- Issue [#521](https://github.com/gtrabanco/agentic-workflow/issues/521) —
  closed by this unit's PR (`Closes #521`).
- Unit #427 (`docs/features/427-*/`) — the unified config that introduced
  `parseJsonc` for the base file and left this one on `JSON.parse`.
- `packages/agentic-workflow-schema/src/config-jsonc.ts` — the parser this unit
  reuses; its header states the one-parser rule.
- `docs/ROADMAP.md` `## Fixes` row `#521` (status carried by the row).

## Branch

`fix/521-fix-config`

## Depends on

none

## Regression scope

- **Plain JSON parsing** — every comment-free config file (the base file, every
  test fixture, every user who never writes a comment) must produce the same
  `ConfigFile` as before: `J4` plus the pre-existing `config-merge`,
  `config-schema-*` and `model-profiles` suites.
- **Schema validation** — a well-formed file with an invalid value still names
  its own path (`$.default.model`, `$.commands.<name>.<key>`, …); the parser
  swap never reaches the validator's work: the pre-existing `AC12` cases and the
  package suite.
- **Fail-closed loading** — an unparsable file still yields `ok:false`, the
  shipped default config and a problem at `$`; the settings console still
  refuses to save over it: `J6` and `test/config-merge.test.mjs`.
- **The base file (`agentic-workflow.json`)** — untouched, parsed by the same
  `parseJsonc` call as before: `test/config-extension.test.mjs` and the loader
  suites.
- **`hooks.json`** — untouched, still `JSON.parse`: the hooks suites.
