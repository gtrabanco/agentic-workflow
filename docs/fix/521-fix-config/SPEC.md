---
type: fix
scope: small
ac-hash: 478d883851678ca14ac1ecd9994853b89c34aae2ecf849c89ceccba9d887f1d7
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

**S5a — Correction: use Bun's native parser when the runtime has one, validated by the schema.**
> D1, use Bun native path if avalable, you can validate that with schema

**S7 — The settings console's save must preserve comments (a JSONC AST editor, editor choice reserved to the owner).**
> D3, use JSONC AST editor but ask which one to me, find best options and good balance between performance, compatibility (node/Bun) & well mantained

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
  catches up with the guide; the page gains the two consequences the landed
  change carries — the native-first reader with `parseJsonc` as the acceptance
  boundary on both runtimes (refusals carry line and column), and the save
  keeping the operator's comments while rewriting only what changed: an added
  or removed key re-renders the object that holds it, a removed key taking its
  own comment with it.
- **`packages/pi-agentic-workflow/README.md`** — the "Model routing" section
  already says "Two JSONC files"; it gains the same boundary and save
  consequences beside the file table it describes.
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
  `Bun.JSONC.parse` fast path whose result becomes the config on Bun with a
  fallback on Node is retired before it is written, because the two parsers do
  not accept the same language (PE-003: Bun 1.4.4 accepts single-quoted strings
  and hex numbers the package parser rejects). What landed instead (owner
  answer L3 → D5) is a native *first reader* whose result is discarded (`J8`)
  in front of the one parser both files already read — `parseJsonc` remains
  the acceptance boundary on both runtimes.
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
- No comment authoring: the console's save edits the bytes it read
  (`src/settings/jsonc-write.ts`) — a value change rewrites only its own span
  (`K1`), a no-change save is byte-identical (`K2`), and an add or remove
  re-renders only the object that holds it (`K3`/`K4`) — but authoring,
  moving, or restyling a comment stays a unit of its own.
- No runtime-split acceptance (D1 answered by L3 → D5): `Bun.JSONC.parse` is
  consulted first when the runtime has one, but its result never becomes the
  config (`J8`) — `parseJsonc` stays the sole acceptance boundary on both
  runtimes (PE-003). And no parser is implemented in this package: readers
  come from `@gtrabanco/agentic-workflow-schema`, the writer's edits from the
  pinned `jsonc-parser` (D9).
- No change to `hooks.json`, to `agentic-workflow.json`, to the config schema
  package's parser, or to any config key, value or default.
- No dependency beyond the single S7 addition: `jsonc-parser` 3.3.1, pinned
  exact with no transitive dependencies of its own (D9). The parser swap added
  none — `@gtrabanco/agentic-workflow-schema` was already a direct dependency
  of this package (`package.json`) and already imported by this file for
  `PASS_NAMES`.

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
- The landed writer's declared cost carries forward (D9): an add or remove
  re-renders the object that holds it — comments kept, the file's own
  indentation and line endings used, that object's layout normalized (`K3`,
  `K4`, `K7`) — and a removed key takes its comment with it. A member-granular
  add/remove is the editor a future unit would own.

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
- **AC-S2** — The extension file is read by the runtime's native JSONC parser
  first when the runtime has one (Bun) and by the schema package's `parseJsonc`
  otherwise, which stays the acceptance boundary; `parseConfigFile` carries no
  `JSON.parse`. Check: tests `J7` (the boundary refuses Bun's extra spellings and
  a malformed tail on both runtimes) and `J8` (the native parser is consulted and
  its result never becomes the config) exit 0 under bun, and the same file exits
  0 under node with `J8` declared skipped; `rg -n 'JSON.parse'
  packages/pi-agentic-workflow/src/config/schema.ts` exits 1 (0 matches).
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
- **AC-S7** — A settings-console save keeps the comments in
  `pi-agentic-workflow.json`: a change rewrites only its own value, a no-change
  save writes the original bytes back, adding or removing a member re-renders
  only the object that holds it (its comments kept, the file's indentation and
  line endings preserved), and a removed member takes its own comment with it.
  Check: tests `K1`–`K7` in `test/settings-console-jsonc.test.mjs` exit 0 under
  bun and under node.

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
- P6 — Native first reader (S5a, owner D1): `Bun.JSONC.parse` reads the file
  first when the runtime has one, while the schema parser stays the acceptance
  boundary — it defines what counts as JSONC, reports `line:<col>`, and supplies
  the validated value (validator: `bun test test/config-jsonc.test.mjs` exits 0
  on bun (`J7`, `J8`) and `node --test test/config-jsonc.test.mjs` exits 0 with
  `J8` declared skipped)
  (Implements: S5a)
  - Relevant files: packages/pi-agentic-workflow/src/config/schema.ts,
    packages/pi-agentic-workflow/test/config-jsonc.test.mjs
- P7 — Comment-preserving save (S7, owner pick `jsonc-parser` 3.3.1): the
  settings console edits the bytes it read instead of re-serializing, so a save
  keeps the comments, a change rewrites only its own span, a no-change save is
  byte-identical, and the file's own indentation and line endings survive a
  re-render (validator: `bun test test/settings-console-jsonc.test.mjs` exits 0 —
  `K1`–`K7`, on both runtimes)
  (Implements: S7)
  - Relevant files: packages/pi-agentic-workflow/src/settings/console.ts,
    packages/pi-agentic-workflow/package.json

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
| O1 | S3 | a `pi-agentic-workflow.json` carrying a `//` line comment parses: `parseConfigFile` answers `ok: true` with the declared keys, never `{ ok: false }` | P2 | P2 | direct application (this session) | `bun test test/config-jsonc.test.mjs` exits 0 (`J1`) | E line in SPEC `## Log` | verified — E4 line in SPEC `## Log` (811 pass, 0 fail; `J1` among them) |
| O2 | S5 | block comments and trailing commas in objects and arrays are accepted in the extension file | P2 | P2 | direct application (this session) | `bun test test/config-jsonc.test.mjs` exits 0 (`J2`) | E line in SPEC `## Log` | verified — E4 line in SPEC `## Log` (`J2` passes; E3 shows the base parser rejecting the same bytes) |
| O3 | S3, S6 | the loader reads a commented extension file end to end — `loadConfig.ok` is true, `problems` empty, the extension value is applied, and the base file's `memory.engram` consent is read (the issue's steps 3–5 no longer reach `config-invalid`) | P2 | P2 | direct application (this session) | `bun test test/config-jsonc.test.mjs` exits 0 (`J3`) | E line in SPEC `## Log` | verified — E4 line in SPEC `## Log` (`J3`: `ok`, no problems, `memory.engram` true, `onSettle` restore) |
| O4 | S2, S5, S5a | the extension file is read by the runtime's native JSONC parser first when the runtime has one (Bun), and by the schema package's `parseJsonc` otherwise — which stays the acceptance boundary on both runtimes and is the only refusal reporter | P6 | P6 | direct application (this session) | `rg -n 'JSON.parse' packages/pi-agentic-workflow/src/config/schema.ts` matches 0 and `bun test test/config-jsonc.test.mjs` exits 0 (`J7`, `J8`) | E line in SPEC `## Log` | verified — E10 line in SPEC `## Log` (0 matches; 8 pass on bun, `J7` green and `J8` declared skipped on node) |
| O5 | S5 | plain JSON is untouched: a comment-free file parses to exactly the config it produced before | P2 | P2 | direct application (this session) | `bun test test/config-jsonc.test.mjs` exits 0 (`J4`) and `bun test test/config-merge.test.mjs test/config-schema-stateflow.test.mjs test/model-profiles.test.mjs` exits 0 (69 pass) | E line in SPEC `## Log` | verified — E4 line in SPEC `## Log` (the 69-pass targeted run and the 811-pass package suite; E3's `J4` row is byte-identical base-vs-change) |
| O6 | S4 | a syntax error still fails at `$` with no `config` property, and the message carries the parser's error with its line and column (`invalid JSON: line <n>:<col>: …`) on both runtimes | P2 | P2 | direct application (this session) | `bun test test/config-jsonc.test.mjs` exits 0 (`J5`, `J6`) | E line in SPEC `## Log` | verified — E10 line in SPEC `## Log` (`J5`/`J6` on both runtimes; E11 shows the messages identical between bun and node) |
| O7 | S4 | a broken file still fails the load closed: `ok:false`, exactly one problem at `$` carrying `invalid JSON`, and the caller gets the shipped default rather than a half-read file | P2 | P2 | direct application (this session) | `bun test test/config-jsonc.test.mjs` exits 0 (`J6`) and `bun test test/config-merge.test.mjs` exits 0 (the `AC12` cases) | E line in SPEC `## Log` | verified — E4 line in SPEC `## Log` (`J6`; the `AC12` cases in the same 811-pass suite) |
| O8 | S5 | the pre-existing config behaviour is unchanged: every `parseConfigFile` consumer (loader, settings console open/save, profiles, passes, subagents, state flow) still reads its fixture and the package suite stays green | P4 | P2 | direct application (this session) | `cd packages/pi-agentic-workflow && bun run test` exits 0 | E line in SPEC `## Log` | verified — E4 line in SPEC `## Log` (811 pass, 0 fail, 75 files) |
| O9 | S5, S5a | the differential run against the base commit differs only in the declared deltas: comments/trailing commas now parse, the failure message gains `line <n>:<col>`, and a non-object root gains the `invalid JSON: ` prefix | P3 | P3 | direct application (this session) | differential run in `mktemp -d` (base copy vs change, identical corpus, both runtimes): every diff line is one of the three declared deltas | E line in SPEC `## Log` with the diff summary | verified — E3 (strict-only pass) and E11 (native-first pass): 15 changed cases, 5 unchanged, no undeclared delta under either runtime |
| O10 | S6 | the documentation states the landed contract: both files are JSONC through one acceptance boundary (`parseJsonc` on both runtimes, Bun's native parser first when it exists), and a settings-console save keeps the operator's comments, rewriting only what changed | P4 | P4 | direct application (this session) | `rg -n 'JSONC' docs/workflow/CONFIG.md packages/pi-agentic-workflow/README.md` matches 3, `rg -n 'acceptance boundary' docs/workflow/CONFIG.md packages/pi-agentic-workflow/README.md` matches 2, and `rg -n 'save keeps' docs/workflow/CONFIG.md packages/pi-agentic-workflow/README.md` matches 2 | E line in SPEC `## Log` | verified — E15 line in SPEC `## Log` (3 / 2 / 2 matches; cells re-scoped per D10) |
| O11 | S1 | repository state ships in the same change: the roadmap `## Fixes` row (hand edit — no emitter writes fix rows), the changeset intent, the journal fragment, and the generated projection through the renderer | P4 | P4 | direct application (this session) | `bun scripts/lint-changeset.mjs` exits 0, `bun scripts/docs-generate.mjs --check` exits 0, `rg -n '#521' docs/ROADMAP.md` matches 1 | E line in SPEC `## Log` | verified — E5 line in SPEC `## Log` (changeset ok, projection PASS, roadmap row present) |
| O12 | S1, S5 | the declared deterministic gates are green before handoff | P5 | P5 | direct application (this session) | `bun scripts/local-gate.mjs` exits 0 | G line in SPEC `## Log` | verified — G1 line in SPEC `## Log` (`PASS — 17 step(s) in 173s`, HEAD `1e7d02f2` in the clean worktree; the primary checkout's one red is E7's environment finding, reproduced at the base commit) |
| O13 | S5a | the same bytes accept and refuse identically on bun and node: the native parser never widens what a config may contain — single quotes, hex numbers, a concatenated root and a truncated tail are refused on both, with the same message | P6 | P6 | direct application (this session) | differential run under both runtimes (same corpus, base copy vs change): the change's bun and node outputs differ on 0 lines | E line in SPEC `## Log` | verified — E11 line in SPEC `## Log` (0 differing lines between runtimes; the base differed on 26) |
| O14 | S7 | a settings-console save preserves the file's comments and its untouched layout through a JSONC AST editor instead of rewriting plain JSON | P7 | P7 | direct application (this session), after the owner picks the editor | the console round-trip test exits 0 | E line in SPEC `## Log` | verified — E13 line in SPEC `## Log` (`K1`–`K7` on both runtimes; package suite 820 pass on bun, 819 + 1 declared skip on node) |

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
  acceptance criteria and task list, plus the roadmap `## Fixes` row (hand
  edit — PE-009) · commit `b5e4c5eb`.
- **P2a** — 2026-11-12, the RED corpus committed alone, observed failing before
  any implementation (E2) · commit `4b9dc40c`.
- **D4** — 2026-11-12, plan repair during close-out (authority: LEDGERS.md's "a
  validator with no stated outcome is a claim nobody can check"): AC-S2 and O4
  expected `rg -n 'parseJsonc'` to match 2 and it matches 3 (the call, the import
  and the doc comment), so both cells now pin `rg -n 'parseJsonc\(text\)'` at 1 —
  the single call site, stable against comment edits. Disclosed: the AC section
  was frozen at cut under `ac-hash 6a97b6c5…7eed3` and the implementation
  commit `58b46fd7` landed under that stamp; this wording change re-stamps it
  to `c216731c…ed0e` in the same commit that records it. The change tightens a
  validator and moves no assertion; no test was edited.
- **E3** — 2026-11-12, differential check (O9) in `mktemp -d /tmp/aw521-diff-*`
  (removed after): the base commit's `src/config/schema.ts`
  (`git show main:…`) compiled with the package's own `tsc`, and the change,
  driven over one 17-case corpus (the six `J` cases plus empty, comment-only,
  BOM, both non-object roots, duplicate keys, a trailing comment, an
  unterminated block, an unknown key and an invalid value). 12 cases differ in
  24 diff lines, every one declared: six now parse (the comments, the trailing
  comma, the comment-only file, the BOM, the trailing `//`), three failure
  messages gain `line <n>:<col>`, two non-object roots gain the `invalid JSON: `
  prefix, and one already-invalid extension file changes its first message from
  "Unrecognized token '/'" to the unknown-key issue it always reported after a
  successful parse. The other 5 cases are byte-identical (`J4`, empty,
  duplicate keys, unknown key, invalid value). This run is also the corrected
  RED receipt: through the base parser `J1`/`J2`/`J3a` reject and `J5`/`J6`
  carry no location.
- **E4** — 2026-11-12, `cd packages/pi-agentic-workflow && bun run test` · exit 0
  · 811 pass, 0 fail (75 files; `bundle:skills` + `tsc` + the whole suite,
  `J1`–`J6` included). The targeted pre-change floor was 69 pass (E1); the
  corpus adds six.
- **E5** — 2026-11-12, `bun scripts/lint-changeset.mjs` · exit 0 ·
  `ok fix-521-fix-config-…-521.md`; `bun scripts/docs-generate.mjs` · exit 0 ·
  `1 written, 0 deleted, 2 unchanged`, roadmap unchanged;
  `bun scripts/docs-generate.mjs --check` · exit 0 · 3 checked, 0 missing,
  0 stale, 0 orphaned; `bun scripts/roadmap-settle.mjs` · exit 0 · 189 unit
  docs, 0 violations; `bun scripts/phase-lint.mjs
  docs/fix/521-fix-config/SPEC.md` · exit 0 · verdict PASS (5 phases, 6/6).
- **E6** — 2026-11-12, the surface pins: `rg -n 'JSON.parse'
  packages/pi-agentic-workflow/src/config/schema.ts` · exit 1 · 0 matches;
  `rg -n 'parseJsonc\(text\)' packages/pi-agentic-workflow/src/config/schema.ts`
  · exit 0 · 1 match; `rg -n 'JSONC' docs/workflow/CONFIG.md
  packages/pi-agentic-workflow/README.md` · exit 0 · 3 matches;
  `rg -n 'plain JSON' docs/workflow/CONFIG.md
  packages/pi-agentic-workflow/README.md` · exit 0 · 2 matches.
- **P2b** — 2026-11-12, `parseConfigFile` reads the schema package's `parseJsonc`
  and reports `line <n>:<col>`; the corpus's `J3` fixture path was corrected
  while implementing (it wrote the base file's bytes at the extension path; the
  assertion set is unchanged and it now reads `paths.globalBase`) · commit
  `58b46fd7`.
- **P3** — 2026-11-12, differential recorded (E3); no undeclared difference ·
  same commit `58b46fd7`.
- **P4** — 2026-11-12, docs and repository state: `CONFIG.md` and the package
  README state the one-parser rule and the save consequence, the changeset
  intent through the deterministic emitter, the projection through the renderer
  (E5) · commit `dcf12f54`. The journal fragment was written through
  `agentic-workflow journal write --kind narrative` (the carrier's only writer)
  · commit `1e7d02f2`.
- **E7** — 2026-11-12, disclosure before the gate receipt: the primary checkout's
  root suite fails `scripts/prose-gate-inventory.test.mjs` with
  `multiple-homes` because this machine carries three untracked sibling
  worktrees whose checkouts hold a second copy of
  `docs/workflow/GATE_INVENTORY.md`. Reproduced at the **base** commit in
  `mktemp -d` (removed after): `git archive main` + `bun test
  scripts/prose-gate-inventory.test.mjs` · exit 0 · 21 pass, 0 fail; the same
  tree with the three `.worktrees/<name>/docs/workflow/GATE_INVENTORY.md`
  copies at their real paths · exit 1 · 18 pass, 3 fail, every finding naming
  those three paths. Caused by this checkout's untracked worktrees, not by this
  change (the diff adds no `GATE_INVENTORY.md`), and fixed by nothing inside
  this unit — the worktrees belong to other units.
- **G1** — 2026-11-12, `HEAD 1e7d02f2` in a clean worktree of this commit
  (`.worktrees/fix-521-gate`, branch `fix/521-fix-config-gate`, `bun install
  --frozen-lockfile` + the schema build, removed after): `bun
  scripts/local-gate.mjs --jobs 2` · exit 0 · `PASS — 17 step(s) in 173s`, no
  skipped step; root suite 106 suites, 0 fail. The run happens in a worktree
  because the primary checkout's only red is E7's environment finding — the
  same commit, the same tree bytes, and the clean-worktree run is how CI sees
  it.
- **P5** — 2026-11-12, verification closed: O1–O12 `verified` (G1 for O12); the
  branch is local-only, no push and no PR · commit `2ec67fb6`.
- **E8** — 2026-11-12, one gate run in three failed at `pi-node-compat` with
  `SyntaxError: Export named 'validateProjectionManifestV1' not found in module
  …/packages/agentic-workflow-schema/dist/index.js` while `schema-build` was
  rewriting that `dist/` in the same pool: a read/write race on the schema
  package's build output, not a red in this change — the export is present in
  the committed source and in `dist/` after the run, and `bun run --cwd
  packages/pi-agentic-workflow test:node` passes standalone (exit 0, 12.8s).
  Disclosed, not worked around: no suite was edited and no step was skipped by
  this unit. The gate owns the step graph; a missing `schema-build` →
  `pi-node-compat` edge is a gate finding for its own unit.
- **G2** — 2026-11-12, `HEAD 2ec67fb6` (the receipt commit, so the run is on the
  tree the ledger describes), same clean worktree: `bun
  scripts/local-gate.mjs --jobs 2` · exit 0 · `PASS — 17 step(s) in 173s`, root
  suite 106 suites PASS, no skipped step. Every later commit on this branch is
  documentation under `docs/fix/521-fix-config/`, so `test-impact` answers
  `empty` for it and no test-bearing step is affected.
- **L3** — 2026-11-12, the owner's review of the handoff, verbatim:
  ```
  D1, use Bun native path if avalable, you can validate that with schema
  D2, ok
  D3, use JSONC AST editor but ask which one to me, find best options and good balance between performance, compatibility (node/Bun) & well mantained
  D4 I don't understand which is the question and possible decisions here, seems like an observation (ledger/honest points)
  ```
- **D5** — 2026-11-12, correction batch on D1 (authority: S5a): `Bun.JSONC.parse`
  is the first reader when the runtime has one; the schema package's parser
  stays the acceptance boundary. The boundary is not negotiable: measured on bun
  1.4.4, `Bun.JSONC.parse('{"a":1},{"b":2}')` answers `{"a":1}` — it stops at
  the first root value and ignores the rest, so a native-only reader would read
  a truncated or concatenated file as valid (fail-open), and its errors carry no
  position. The strict parse is the only EOF check a JSONC reader has; the native
  result therefore never becomes the config, the schema parse supplies it. Cost
  measured on a 3.5 KB config: `Bun.JSONC.parse` 49.6 µs, `parseJsonc` 117.4 µs —
  the guard means both run, so this is ~0.17 ms per session start, not a saving;
  the owner gets the native reader he asked for without the fail-open.
- **D6** — 2026-11-12, D2 ratified by the owner (authority: L3 line 2): the
  engram notification keeps its text; no change to `src/extension/engram.ts`.
- **D7** — 2026-11-12, D4 answered (authority: L3 line 4): D4 was a disclosure,
  not a question — the AC section was changed after its first freeze at cut, so
  the `ac-hash` was recomputed and the fact recorded. No decision is needed from
  the owner unless he wants the first-cut wording restored.
- **D8** — 2026-11-12, second AC re-stamp (authority: S5a + S7): AC-S2 was
  re-worded for the native-first reader and AC-S7 was added for the
  comment-preserving save, so `ac-hash` moved `c216731c…` → `30331099…`. No
  existing assertion was relaxed; AC-S7 is marked not met, and its task P7
  carries the blocking reason.
- **E9** — 2026-11-12, RED for S5a observed on the pre-correction tree (strict
  reader only) with the new corpus: `bun test test/config-jsonc.test.mjs` · exit
  1 · 7 pass, 1 fail (`J8`: the native parser is never consulted). `J7` (the
  acceptance boundary) already passed there, which is the proof the guard is the
  strict parser and not the native one.
- **E10** — 2026-11-12, green after the correction: `bun test
  test/config-jsonc.test.mjs` · exit 0 · 8 pass, 0 fail; `node --test
  test/config-jsonc.test.mjs` · exit 0 · 7 pass, 0 fail, 1 skipped (`J8`, this
  runtime has no native parser). Whole package: `bun run test` · exit 0 · 813
  pass, 0 fail (75 files); `bun run test:node` · exit 0 · 812 pass, 0 fail, 1
  skipped (the declared `J8`).
- **E11** — 2026-11-12, differential re-run with the native-first reader, in
  `mktemp -d` (removed): the base commit's `schema.ts` compiled beside the
  change, one 20-case corpus, run under **both** runtimes. Against the base: 15
  changed cases (30 diff lines) under bun and the same 15 under node, 5
  unchanged — every change a declared delta (the six JSONC acceptances, four
  S5a refusals whose message gains `line:<col>`, three failures that gain a
  location, two non-object roots that gain the prefix). Between runtimes: the
  change's bun and node outputs differ on **0 lines**; the base tree differed on
  **26** (its `JSON.parse` error text is runtime-specific). That is S5a's whole
  point: the native reader is faster, the schema boundary makes the answer the
  same.
- **P6** — 2026-11-12, native first reader (S5a) · test corpus `dc8cc506` (red
  observed, E9) and implementation `b444c38c` (green, E10/E11).
- **P7** — 2026-11-12, the comment-preserving save landed on the owner's pick
  (L4/D9): `src/settings/jsonc-write.ts` + the console's save path · commit
  `90c066a9` (corpus `3826d326`, red at E12).
- **L4** — 2026-11-12, the owner's answers to the two asked questions, verbatim:
  ```
  d3-editor: selected jsonc-parser
  d1-guard: selected keep-guard
  ```
- **D9** — 2026-11-12, the editor pick (authority: L4 + S7): `jsonc-parser`
  3.3.1, pinned exact, zero dependencies, MIT (Microsoft/VS Code). The writer
  diffs the draft against the file it opened and applies one `modify`/`applyEdits`
  per changed leaf. The declared cost, pinned by `K3`/`K4`: the object that
  receives an added or removed member is re-rendered (comments kept, the file's
  own indentation and line endings used), and a removed member takes its own
  comment with it. D1 stays as answered — the native reader in front of the
  strict boundary.
- **E12** — 2026-11-12, RED for S7 observed before the writer existed: `bun test
  test/settings-console-jsonc.test.mjs` · exit 1 · `Cannot find module
  '../dist/settings/jsonc-write.js'`, 0 pass, 1 error.
- **E13** — 2026-11-12, green after the writer: `bun test
  test/settings-console-jsonc.test.mjs` · exit 0 · 7 pass, 0 fail (`K1`–`K7`);
  whole package `bun run test` · exit 0 · 820 pass, 0 fail (76 files, the `J` and
  `K` corpora included); `bun run test:node` · exit 0 · 819 pass, 0 fail, 1
  skipped (the declared `J8`); `bun scripts/lint-changeset.mjs` · exit 0 · the
  `521` entry at `minor` (`@gtrabanco/pi-agentic-workflow` only — the schema
  package is untouched).

- **G3** — 2026-11-12, `HEAD 5de52ac7` (the correction batch's last content commit),
  clean worktree `.worktrees/fix-521-gate` of this commit (removed after): `bun
  scripts/local-gate.mjs --jobs 2` · exit 0 · `PASS — 17 step(s) in 265s`, root
  suite 106 suites PASS, no skipped step.

- **E14** — 2026-11-12, disclosure before G4: one gate run at `--jobs 2` failed at
  `root-suite` with `scripts/red-first.test.mjs`'s whole-repository scan timing
  out (`killed 1 dangling process`; the runner's per-test budget). Not this
  change: `node scripts/red-first.mjs` answers `red-first — 56 pair(s) · 25 after
  the cutoff · cutoff 1374ea9` and `verdict: PASS` with **0 findings** (21.8 s
  wall, 4.99 s user), and the machine was at load average **11.7 on 6 CPUs** from
  other sessions (`npm install`, three `bun` processes and a `tsc`) at the time —
  the same suite passed inside G1–G3. The three suites the log then marks FAIL
  (`session-close`, `setup-env`, `shared-doc-merge`) printed every test as
  passing: that is the runner's bail accounting after the killed process, not a
  red of their own.
- **G4** — 2026-11-12, `HEAD 39317033` (the ledger commit that lands the editor),
  same clean worktree: `bun scripts/local-gate.mjs --jobs 1` · exit 0 · `PASS —
  17 step(s) in 495s`, root suite 106 suites, 0 fail, no skipped step — re-run at
  `--jobs 1` after the load dropped to 0.76 (E14), so the run measures the tree,
  not the neighbours.
- **D10** — 2026-11-12, correction batch on the external verify (authority: the
  owner's "triage and fix" request; `external-verify.md` 2026-11-12): all six
  blockers are text/ledger repairs inside this document and are fixed in one
  batch — Impact (the guides' save consequence), Retirements (the retired
  runtime-split vs. the landed first-reader), three Non-goals bullets (comment
  authoring / runtime-split acceptance / dependency), Future cost (the landed
  writer's re-render cost), and O10's obligation+validator cells re-scoped to
  the landed contract (the same cell-repair class as D4; the AC section is
  untouched, so `ac-hash` `478d8838…` stands). Advisory 1 (the
  `prose-gate-inventory` `multiple-homes` red from three sibling worktrees) is
  left open as environment — it reproduces independent of this change, the gate
  is green in a clean clone, and this unit owns no other unit's worktree.
  Advisory 2 (the release intent named only the console capability) is fixed
  through the emitter's own regenerate path (delete + `changeset-create.mjs
  --name/--message`), never hand-edited: the one changeset now names both the
  JSONC parse fix and the comment-keeping save. Dated carriers (Log D3/E6, the
  journal fragment, PE-006's cut-head sample) are history and stay untouched; no
  source file changes, so no differential applies.
- **E15** — 2026-11-12, the batch's recheck (blockers only, §9): every
  reproducer flipped green — the five stale-claim sweeps (`No comment-preserving
  writer|comments are not preserved by a save|rewrites plain JSON|No new
  dependency|No \`Bun.JSONC.parse\` fast path` over this SPEC; `plain JSON` over
  CONFIG.md+README; `does not preserve comments|comments do not survive a
  save|save rewrites plain JSON` over docs/+packages/, excluding the dated
  receipt) all exit 1 · 0 matches; O10's re-pinned validators run in the
  foreground · `JSONC` matches 3, `acceptance boundary` matches 2, `save keeps`
  matches 2; `bun scripts/phase-lint.mjs docs/fix/521-fix-config/SPEC.md` · exit
  0 · verdict PASS (fingerprints unchanged); `bun scripts/lint-changeset.mjs` ·
  exit 0 · the regenerated `fix-521-fix-config-parse-jsonc-and-keep-operator-comments.md`
  at `minor`; `bun scripts/docs-generate.mjs --check` · exit 0 · 3 checked, 0
  stale; `bun scripts/roadmap-settle.mjs` · exit 0 · violations 0; `rg -c
  '#521' docs/ROADMAP.md` · 1; both corpora re-run · `J` 8/8, `K` 7/7; O10's row
  keeps its 9-column shape; the `## Acceptance criteria` section is
  byte-identical (no AC hunk in the batch diff → `ac-hash` not re-stamped).

## Next

Owner verdict on the diff. Every obligation (`O1`–`O14`) is `verified` and the
editor picked in D9 is landed; the branch `fix/521-fix-config` is local-only — no
push, no PR — and the owner is the external verifier.

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
