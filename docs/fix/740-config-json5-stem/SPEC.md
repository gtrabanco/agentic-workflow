---
type: fix
scope: large
roadmap_summary: Issue [#740](https://github.com/gtrabanco/agentic-workflow/issues/740) (L): every config file is read as JSON5, located by stem across `.json`/`.jsonc`/`.json5` with silent precedence, written back to the file that already exists and created as `<stem>.json5` otherwise; the identity becomes the stem, `NaN`/`Infinity` are refused instead of serialized to `null`, the load degrades a schema-absent key silently, and `validate --sanitize` drops values that no longer validate.
---

# fix/740-config-json5-stem

> Fix specification — applied through the owner's local, unpublished workflow: the
> ledgers below are frozen at cut, the change is worked inline, and the owner is
> the external verifier.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.1
schema: @gtrabanco/agentic-workflow-schema@4.10.1
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#740` — [Config: accept JSON5 everywhere, resolve configs by stem
(.json/.jsonc/.json5), create
.json5](https://github.com/gtrabanco/agentic-workflow/issues/740). The PR closes
it via `Closes #740`.

The problem the issue states, verbatim:

> The unified config (issue #427) ships one dialect (the schema package's hand-written JSONC parser) and one fixed extension (`agentic-workflow.json`). Operators who write JSON5 (unquoted keys, single quotes, hex numbers, `NaN`/`Infinity`) get a parse refusal, and nothing accepts any other extension, so a commented file cannot honestly live at a `.jsonc`/`.json5` name.

## Specs

**S0 — Apply the issue to this repository.**
> Apply to this repository: issue #740

**S1 — JSON5 is the dialect.**
> **Dialect**: every config file is read as JSON5. The dependency-free parser in `@gtrabanco/agentic-workflow-schema` gains the JSON5 grammar over its current JSONC subset (ES5 identifier keys, single-quoted strings + ES5 escapes `\x`/`\u`/line continuation, hex and leading/trailing-dot numbers, `+`-sign, `Infinity`/`NaN`), keeping line/column error reporting. Strict EOF stays the acceptance boundary (decision D1 of #521).

**S2 — Read-side extension resolution.**
> **Read-side extensions**: a config file is located by stem across `.json`, `.jsonc` and `.json5`, silent precedence `json → jsonc → json5`. All readers use it: the config CLI store, the pi package loader, `gitIdentity`, doctor/divergence, extension discovery drop-ins.

**S3 — Write-side extension respect.**
> **Write-side extension respect**: writes always target the file that already exists (never rename an operator's config); when no candidate exists, the file is created as `<stem>.json5` (also for `config init` and `config default` over a missing file).

**S4 — The stem is the canonical identity.**
> **Names**: the canonical identity becomes the stem (`agentic-workflow`, `pi-agentic-workflow`); `.json` never created again. The repo's own committed `.pi/*.json` configs are renamed to `.jsonc` to exercise the middle extension.

**S5 — Data safety for JSON5-only values.**
> **Data safety**: a JSON5-only value (`NaN`, `±Infinity`) would silently serialize to `null` through the standard-JSON writer — the validator refuses it with an INVALID issue instead.

**S6 — Graceful degradation at load.**
> **Graceful degradation at load**: a key or section the schema no longer declares, and a value that no longer validates (shape mutated), neither refuses the load nor errors — the key is dropped and the shipped default fills in, silently. Only a file that does not **parse** keeps refusing (present-but-broken stays evidence). `config validate` and the doctor divergence remain the on-demand trail for everything dropped.

**S7 — `validate --sanitize` drops invalid values too.**
> `config validate --sanitize` also drops keys whose **value no longer validates** (not only unknown keys), keeping the on-demand cleanup trail. New defaults are then one `config default` away — materialize already fills every missing declared option, respecting operator values.

## Acceptance criteria

- **AC-S0** — the change lands on branch `fix/740-config-json5-stem` and closes `#740`; the unit dir carries the four ledgers (`SPEC.md`, `planning-evidence.md`, `planning-obligations.md`) and the roadmap's Fixes row is written through `roadmap fixrow`.
- **AC-S1** — `bun test packages/agentic-workflow-schema/test/config-jsonc.test.mjs` exits 0 with a case per JSON5 construct the issue lists — identifier keys, single-quoted strings, `\x`/`\u`/line-continuation escapes, hex, leading- and trailing-dot numbers, `+`-signed numbers, `Infinity`/`NaN` — plus the retained line/column error and the strict end-of-input refusal.
- **AC-S2** — one exported resolver answers a stem's candidates in `json → jsonc → json5` order and is used by the config CLI store, the pi package loader, `gitIdentity`, the doctor's divergence probe and extension drop-in discovery; a test per reader proves the middle and last extensions are read.
- **AC-S3** — `config set`/`reset`/`default`/`init` write to the candidate that exists and create `<stem>.json5` when none does; no command renames an existing file (asserted by file bytes and directory listing).
- **AC-S4** — the base section spec and the `config-extension@1` descriptor name the stem; `.pi/agentic-workflow.jsonc` and `.pi/pi-agentic-workflow.jsonc` are the committed files; a suite reads them through the resolver.
- **AC-S5** — a config value of `NaN` or `±Infinity` is refused as INVALID (exit 2 for the CLI, an issue path for the validator) and is never written as `null`.
- **AC-S6** — a file with an unknown section/key or an invalid value loads with the offending key dropped and the shipped default in its place, `ok: true`, zero problems; a file that does not parse still refuses with the parse error and its location.
- **AC-S7** — `config validate --sanitize` removes a declared key whose value no longer validates, and the resulting file passes a second `validate`.
- **AC-docs** — `docs/workflow/CONFIG.md`, the three package READMEs and the identity guide state the dialect, the resolution and the create name; a changeset names every touched package; `docs-generate --check` and the changeset lint pass.

## Impact

- **`packages/agentic-workflow-schema`** — `parseJsonc` widens to the JSON5 grammar (same function name: it is the one parser both packages read files with); `validateJsonSchema` refuses a non-finite number; `sanitizeJsonSchema` drops values that no longer validate (the `--sanitize` extension and the load path's drop); `BASE_CONFIG_FILE` becomes `BASE_CONFIG_STEM` and the new `configFileCandidates`/`resolveConfigFileName` pair owns the precedence. `config.schema.json` is generated from the section schemas and does not name files, so it is unchanged — the artifact checker confirms it.
- **`packages/agentic-workflow`** — every join of a section's `file` with a scope directory becomes a resolver call (store, api, materialize, discovery, git-identity, doctor probe, `provision permissions` refusal path). `section.file` is now a stem, so `config default`'s receipt `file` field and the doctor's evidence name the stem while `path` names the real file.
- **`packages/pi-agentic-workflow`** — `configFilePaths` resolves by existence (absent → the `.json5` create target) and is the one place the loader and the settings console learn a path; the loader stops turning an unknown key or an invalid value into a problem (S6) while keeping the parse refusal; the published descriptor's `file` becomes `pi-agentic-workflow`.
- **Retired surface** — `BASE_CONFIG_FILE` (the file-name constant) is deleted in favour of `BASE_CONFIG_STEM`; a `config-extension@1` descriptor that names a `.json`-suffixed file is refused with a message naming the stem rule. Both are owner decisions in the issue (S4) and are recorded in the changeset; no compatibility shim is kept (IR6).
- **Live-tree guard** — the parser, the resolver and the sanitizer are exercised in `mktemp -d` fixtures first; the repo's own `.pi/` is only touched by the declared rename (`git mv`), never by a config command while the code is being built.
- **This repository's own config** — the two committed files move from `.json` to `.jsonc`, so `scripts/local-config-contract.test.mjs` (which reads them directly) reads the resolved names and the gate proves the middle extension is live.

## Surfaces

- `packages/agentic-workflow-schema`
- `packages/agentic-workflow`
- `packages/pi-agentic-workflow`
- `.pi/`
- `docs/workflow`

## Retirements

- `BASE_CONFIG_FILE` — replaced by `BASE_CONFIG_STEM` plus `resolveConfigFileName`; `rg -c 'BASE_CONFIG_FILE' packages scripts skills template docs/workflow` → 0 after the change (the constant's consumers all import the stem).
- The `.json`-suffixed extension descriptor file name — replaced by the stem; `validateConfigExtension` refuses it (`docs/workflow/CONFIG.md` § Extension contract states the stem).

## Non-goals

- No JSON5 *writer*: `stringifyJsoncValue` stays standard JSON, and JSON5-only values are refused rather than round-tripped.
- No file watching, no migration of an operator's existing `.json` (it keeps being read and written where it is).
- No new config key, no schema shape/default/enum change beyond the finite-number refusal.
- No change to `parseConfigFile`'s strict validator: it stays the console's and the tests' validator; only the loader's use of it changes.

## Risk tier

- **Tier** — `standard` · **Task Size** — understood, contained risk, resumable from diff
- **Named high-risk item** — `none — not a high-tier unit`

Verdict quoted from `agentic-workflow ceremony tier classify --paths <this unit's paths>` at the cut (`risk-tier-verdict@1`): `tier: standard`, `reason_kind: executable-content`.

## Future

none

## Future cost

- A new config file name is a stem: a package that publishes a `config-extension@1` descriptor names the stem, never a name with an extension (binds extension authors).

## Applicable tests

`packages/agentic-workflow-schema/test/config-jsonc.test.mjs`,
`packages/agentic-workflow-schema/test/config-contract.test.mjs`,
`packages/agentic-workflow/test/config-cli.test.mjs`,
`packages/agentic-workflow/test/config-materialize.test.mjs`,
`packages/agentic-workflow/test/git-identity.hook.test.mjs`,
`packages/agentic-workflow/test/doctor.checks.test.mjs`,
`packages/pi-agentic-workflow/test/config-jsonc.test.mjs`,
`packages/pi-agentic-workflow/test/default-inherit.test.mjs`,
`packages/pi-agentic-workflow/test/config-extension.test.mjs`,
`scripts/local-config-contract.test.mjs`,
`scripts/push-identity-check.test.mjs`,
`scripts/identity-hook-parity.test.mjs`.

## Known pre-existing issues

- `packages/pi-agentic-workflow/src/config/schema.ts` carries its own strict validator beside the published descriptor, and `test/config-extension.test.mjs` pins the descriptor's bytes, not the two validators' semantic equality — **does not affect** this unit: the load path keeps the strict validator as its final authority.
- `packages/agentic-workflow/src/config/materialize.mjs` interleaves plan/write per file — **does not affect** this unit (fixed by #600's own run); only the path resolution changes here.

## Tasks

- P1 — Freeze this unit's ledgers and cut the branch. (validator: `ls docs/fix/740-config-json5-stem` exits 0 and lists `SPEC.md`, `decisions.md`, `planning-evidence.md` and `planning-obligations.md`)
  (Implements: S0)
  - Relevant files: docs/fix/740-config-json5-stem/SPEC.md
- P2 — The schema package's parser reads JSON5 and the validator refuses a non-finite number; the sanitizer drops a value that no longer validates. (validator: `bun test packages/agentic-workflow-schema/test/config-jsonc.test.mjs` and `bun test packages/agentic-workflow-schema/test/config-contract.test.mjs` exit 0)
  (Implements: S1, S5, S7)
  - Relevant files: packages/agentic-workflow-schema/src/config-jsonc.ts, packages/agentic-workflow-schema/src/config.ts
- P3 — The stem resolver (`configFileCandidates`, `resolveConfigFileName`) and the stem-based section spec and descriptor contract. (validator: `bun test packages/agentic-workflow-schema/test/config-contract.test.mjs` exits 0)
  (Implements: S2, S4)
- P4 — The crate's store, API, materializer, discovery, identity reader, doctor probe and `provision permissions` resolve by stem and write to the file that already exists, creating `<stem>.json5` when none does. (validator: `bun test packages/agentic-workflow/test/config-cli.test.mjs` and `bun test packages/agentic-workflow/test/config-materialize.test.mjs` exit 0)
  (Implements: S2, S3, S4, S7)
- P5 — The pi package resolves its two file pairs by stem, keeps the parse refusal, and drops every schema-absent key and every invalid value silently at load. (validator: `bun test packages/pi-agentic-workflow/test/config-jsonc.test.mjs` and `bun test packages/pi-agentic-workflow/test/default-inherit.test.mjs` exit 0)
  (Implements: S2, S4, S6)
- P6 — The committed `.pi` configs are renamed to `.jsonc` and the repository's own contract suite reads them through the resolver. (validator: `bun test scripts/local-config-contract.test.mjs` exits 0)
  (Implements: S4)
- P7 — Docs, changeset, roadmap row, evidence and the session journal. (validator: `bun scripts/lint-changeset.mjs` and `bun scripts/docs-generate.mjs --check` exit 0)
  (Implements: S0)
- P8 — Verification: the differential run against the base commit and the root gate. (validator: `node scripts/run-root-suite.mjs --bail` exits 0 and the package suites exit 0)
  (Implements: S0, S1, S2, S3, S4, S5, S6, S7)
- P9 — The write-path refusals: `set`, `reset` and `validate --sanitize` refuse before any byte moves on a target file that does not parse (present-but-broken stays evidence) and on a document that still carries a non-finite value anywhere — never clobbering the evidence, never serializing `NaN`/`Infinity` as `null`. (validator: `bun test packages/agentic-workflow/test/config-cli.test.mjs` exits 0 with the cross-section non-finite refusal and the present-but-broken refusal cases)
  (Implements: S5, S6)
- P10 — `findRow` answers the `## Fixes` table by issue key, so the CAS read half agrees with the locator `fixRowUpsert` writes with. (validator: `bun test packages/agentic-workflow/test/roadmap-check.test.mjs` exits 0 with the fixes-read case)
  (Implements: S0)
- P11 — Evidence and surface currency: the E3 count correction, the pi-nan stem narrations, the decisions and log for the correction batch. (validator: `bun scripts/docs-generate.mjs --check` exits 0 and `rg -n 'pi-agentic-workflow\.json|agentic-workflow\.json' packages/pi-nan-agentic-workflow --glob '!**/test/**'` exits 1 with no matches — a test fixture's literal `.json` file is a legal location (S3) and stays)
  (Implements: S0, S4)

The link grammar (`task-spec-link@1`) is honoured above: every task names the requirements it delivers and every requirement is delivered by one task.

### Planning evidence

The ledger lives beside this document in `planning-evidence.md` (M/L unit — never embedded here).

### Obligations

The ledger lives beside this document in `planning-obligations.md` (M/L unit — never embedded here).

## Triaged steps

n/a — this unit is applied through the owner's local, unpublished workflow; the `## Tasks` list above is the authoritative step list and no lane triage was run.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-27, the issue, verbatim:
  ```
  Apply to this repository: issue #740
  ```
- **D1** — 2026-11-27, the seven proposal items are the seven requirements (S1-S7) and the `## Problem` paragraph is the motivation, never an eighth ask.
- **D2** — 2026-11-27, `BASE_CONFIG_FILE` is deleted in favour of `BASE_CONFIG_STEM` and the `config-extension@1` `file` field becomes a stem: the canonical identity is the stem (S4), and no compatibility shim is kept (IR6).
- **D3** — 2026-11-27, the JSON5 grammar widens `parseJsonc` (one parser, one name): a second exported parser would be the duplicate `IR11` refuses.
- **D4** — 2026-11-27, S6's degradation is silent at the load boundary only: the CLI's `config validate`/`show` and the doctor's divergence keep reporting, because they are the on-demand trail the issue names.
- **D5** — 2026-11-27, the load drops at the granularity its validator reports: the base file per section through the exported sanitizer, the pi file per reported path through its own strict validator (which stays the acceptance authority).
- **D6** — 2026-11-27, the correction's write-path refusal is whole-document: `set`, `reset` and `validate --sanitize` refuse before any byte moves when the target file does not parse or the document still carries a non-finite value anywhere — written section, other section, or unknown key alike — with issues from `validateJsonSchema` (one owner for the message) and the broken-file refusal filtered to the file the write targets (full text: `decisions.md`).
- **D7** — 2026-11-27, `findRow` falls back to the `## Fixes` table through the writer's own locator (`fixTableShape` + `issueKeyInCell`); the Features NN scan keeps precedence, the envelope maps Topic→`slug` and Notes→`description`, the absent depends column answers `""`, and a document without a `## Fixes` heading answers null exactly as before (full text: `decisions.md`).
- **E1** — 2026-11-27, `bun test packages/agentic-workflow-schema/test/config-jsonc.test.mjs` · exit 1 · 9 fail / 925 pass on the red run (the JSON5 constructs and the descriptor/stem contract had no implementation); `bun run test` after the implementation · exit 0 · 965 pass, 0 fail.
- **E2** — 2026-11-27, `bun run test:node` in `packages/agentic-workflow-schema` · exit 0 · 965 pass, 0 fail (the same parser under node).
- **E3** — 2026-11-27, `bun test packages/agentic-workflow/test/config-cli.test.mjs` · exit 0 · 19 pass, 0 fail (`.jsonc`/`.json5` read, silent precedence, write-in-place, create `.json5`, `--sanitize` drops an invalid value, non-finite refusal, drop-in descriptor by stem).
- **E4** — 2026-11-27, `bun test packages/agentic-workflow/test/config-materialize.test.mjs` · exit 0 · 11 pass, 0 fail (receipt `file` is the stem, the create name, the backup beside the real file).
- **E5** — 2026-11-27, `bun test packages/agentic-workflow/test/git-identity.hook.test.mjs` · exit 0 · 26 pass; `bun test scripts/push-identity-check.test.mjs` · exit 0 · 20 pass (the identity reader resolves the stem; the `ok` line now names the resolved path).
- **E6** — 2026-11-27, `bun test packages/agentic-workflow/test/doctor.checks.test.mjs` · exit 0 · 24 pass, 0 fail (the probe resolves `.jsonc` and `.json` wins silently over it).
- **E7** — 2026-11-27, `bun test` in `packages/pi-agentic-workflow` · exit 1 · the six embed/model-fact failures and `argument-hint-frontmatter` are pre-existing (reproduced on a `git archive` of `67133da45`); every config suite passes: `config-jsonc` J9-J11, `default-inherit`, `auto-log-session-config`, `untrusted-project-config`, `config-extension`, `dispatch-refusals`, `path-protection`, `settings-console`, `shipped-adapter`, `engram-provision`.
- **E8** — 2026-11-27, `bun test scripts/local-config-contract.test.mjs` · exit 0 · 4 pass, 0 fail (the committed `.jsonc` files are what the resolver finds, and they satisfy the registry and the package descriptor).
- **E9** — 2026-11-27, `bun scripts/lint-changeset.mjs` · exit 0; `bun scripts/docs-generate.mjs --check` · exit 0 · PASS; `bun test scripts/normative-drift.test.mjs` · exit 0 · 24 pass; `bun test scripts/check-skill-context.test.mjs` · exit 0 · 1 pass (the pi README was trimmed back inside its 1415-line ceiling after the first run reported 1420).
- **E10** — 2026-11-27, the differential run against a `git archive` of `67133da45` installed in `/tmp` (both trees at the same commands and fixtures): `get`, `list`, `show`, `validate`, `set`, `reset`, `schema` and `git-identity-check` are byte-identical in exit, stdout and file bytes; the only differences are the three the requirement orders — `config init` creates `.json5`, `config default`'s receipt names the stem and the `.json5` path, and the `provision permissions` header names the stem instead of the base's old `pi-agentic-workflow.json` header — plus the stderr duration line.
- **E11** — 2026-11-27, `bun test packages/pi-agentic-workflow/test/settings-console-jsonc.test.mjs` · exit 0 · 7 pass (the console's comment-preserving save is unchanged).
- **E13** — 2026-11-27, `bun test packages/agentic-workflow/test/git-identity.hook.test.mjs` · exit 0 · 27 pass, 0 fail — the run that proves the reader finds a `.jsonc` and a `.json5` profile (the case added after E5, which is why that line records 26).
- **E12** — 2026-11-27, `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap fixrow docs/ROADMAP.md <json> --expect 2ae272ee…` · pass · `Before: 2ae272ee · After: 3fe136f2`; `roadmap read docs/ROADMAP.md --nn 740 --json` answers the row.
- **G1** — 2026-11-27, `node scripts/run-root-suite.mjs` · 147 suites · 1 fail (`check-skill-context`, repaired and re-run green; see E9). · head not recorded (legacy run; no sha captured at run time)
- **G2** — 2026-11-27, `bun run test` in `packages/agentic-workflow` · exit 1 · only `doc.query` and `doc.hybrid` fail, both reproduced on the base commit (an embeddings-store state in this environment, unrelated to config). · head not recorded (legacy run; no sha captured at run time)
- **G3** — 2026-11-27, `node scripts/run-root-suite.mjs` on the final tree · exit 0 · 147 suite(s), 147 PASS (the earlier run's one failure, `check-skill-context`, was repaired inside the pi README's ceiling and the suite re-ran green). · head not recorded (legacy run; no sha captured at run time)
- **G4** — 2026-11-27, `bun run test` / `bun run test:node` in `packages/agentic-workflow` · exit 1 · only `doc.query` (3) and `doc.hybrid` (6) fail under both runtimes, reproduced on the base commit — an embeddings-store state in this environment, unrelated to config. · head not recorded (legacy run; no sha captured at run time)
- **G5** — 2026-11-27, `bun run test` / `bun run test:node` in `packages/pi-agentic-workflow` · exit 1 · 1142/1141 pass, the same 7 pre-existing failures (six embed/model-fact cases and `argument-hint-frontmatter`), each reproduced on the base commit. · head not recorded (legacy run; no sha captured at run time)
- **G6** — 2026-11-27, `bun run check:config-schema` · `config.schema.json: current`; `bun scripts/version-parity-gate.mjs --content` and `--pins` · PASS; `bun scripts/secret-scan` (hook form) · PASS; `bun scripts/temp-hygiene.mjs` · PASS; `bun scripts/worktree-guard.mjs` · PASS; `bun scripts/rigidity-review.mjs` · ok; `bun scripts/dimension-regression.mjs` · not-applicable (no push range). · head not recorded (legacy run; no sha captured at run time)
- **E14** — 2026-11-27, the red class E7/G2/G4/G5 recorded is environmental, not the base commit's own state, and the environment is now clean for the gate: this container exports `AGENTIC_WORKFLOW_DOC_EMBEDDINGS_{BASE_URL,API_KEY,MODEL,MAX_REQUEST_CHARS}` (so the offline keyword tests see a configured provider) and the checkout was missing the `yaml` package link the argument-hint suite imports. With those four variables unset for the run and `bun install --frozen-lockfile --force` restoring the link, `doc.query` answers 22 pass / 0 fail, `packages/pi-agentic-workflow` answers 1159 pass / 0 fail, and the pre-push gate runs green end to end.
- **E15** — 2026-11-27, the correction batch's RED corpus, observed before the fix: `bun test packages/agentic-workflow/test/config-cli.test.mjs` · exit 1 · 3 fail / 21 pass and `bun test packages/agentic-workflow/test/roadmap-check.test.mjs` · exit 1 · 2 fail / 24 pass — exactly the five new cases, every pre-existing case green. Count correction for E3 (EXTERNAL VERIFY advisory A2): the file answered 21 at `836119718` because two cases landed in `fda5089fb` after E3 recorded 19; this batch adds three more.
- **E16** — 2026-11-27, the correction batch GREEN: the same two suites · 24 pass / 0 fail and 26 pass / 0 fail; `bun run test` in `packages/agentic-workflow` with the four `AGENTIC_WORKFLOW_DOC_EMBEDDINGS_*` variables unset · exit 0 · 0 fail.
- **E17** — 2026-11-27, the correction batch's foreground obligation validators: O2 — `bun test packages/agentic-workflow-schema/test/config-contract.test.mjs` · 27 pass / 0 fail and `bun test packages/agentic-workflow/test/config-cli.test.mjs` · 24 pass / 0 fail; O15 — `ls docs/fix/740-config-json5-stem` lists the four unit-doc files beside the `external-verify.md` receipt, and `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap read docs/ROADMAP.md --nn 740 --json` answers the `## Fixes` row (`slug: config-json5-stem`, `status: done · [#741]…`); O16 — the three refusal cases in that config-cli run. Re-runs of the untouched rows' validators: config-jsonc 15/0, config-materialize 11/0, doctor.checks 24/0, git-identity.hook 27/0, push-identity-check 20/0, local-config-contract 4/0, settings-console-jsonc 7/0, edit 40/0, normative-drift 24/0, lint-changeset exit 0, `bun run test` in `packages/pi-nan-agentic-workflow` 93/0.
- **E18** — 2026-11-27, the correction batch's differential against a fresh `git archive` of `67133da45` (same commands, same fixture bytes, one line per command): byte-identical on absent-`get`, `get`/`list`/`show`/`schema`/`validate`, plain-file `set` and `reset`, and the Features-row `roadmap read --nn 650`; every difference is one this change asks for — S7's sanitize (base refuses `expected integer` with no write, head drops the value and writes), S3's `init` create name (`.json` → `.json5`), S4's `default` receipt (stem + `.json5` path), A1's broken-file refusal (base clobbers with exit 0, head keeps bytes with exit 2), B1's non-finite refusal on `set` and `--sanitize` (base clobbers/parse-refuses, head refuses with bytes kept and the finite issue), B2's Fixes-row answer (base `row: null`, head answers `--nn 734`).
- **P2** — 2026-11-27, docs and state: CONFIG.md, the three package READMEs, the identity guide pair, the init-workspace/lane references, the changeset, the roadmap row and the regenerated projection · commits `b83f609b1`, `4e241212e`.
- **P1** — 2026-11-27, S1's grammar, S5's finite refusal and S7's sanitizer land in the one parser/validator, with the resolver beside them · this change's commits.

- **G7** — 2026-11-27, the correction batch's root gate: the first re-run answered 147 suites · 1 fail — `scripts/local-gate.test.mjs` red inside its `version-parity-content` step, because the batch's two pi-nan edits changed shipped content without a declared version (change-caused, caught by the gate). Fixed through the gate's own alternative — `@gtrabanco/pi-nan-agentic-workflow: patch` declared in this unit's changeset — then `bun scripts/version-parity-gate.mjs --content` PASS, `bun test scripts/local-gate.test.mjs` 66 pass / 0 fail, and the second full re-run at HEAD 23443c0492f6eeb18266d89fb6c4ce5a4eaf49a1 (working tree) · exit 0 · 147 PASS / 0 FAIL.
- **E19** — 2026-11-27, the unit doc's own gates, first run of both: `phase-lint` was BLOCKED at cut (the inline `(Implements: …)` shape never parsed — `task-spec-link@1` wants it on its own line — plus P1's missing outcome anchor, a standalone `or` in P4/P5, and this batch's own P9/P11 findings) and `verify` refused (six G-lines without a HEAD sha, two stale `.pi/*.json` citations). Repairs: every task link moved to its own line (P1-P11, semantics unchanged), P1's validator carries `exits 0`, P4/P5/P9 reworded with no standalone `or` (meaning preserved), P11's validator no longer uses a creation verb, the regression-scope citation now names the committed `.pi/agentic-workflow.jsonc`, E10's historical mention quotes the old file name without a path prefix, and G1-G6 carry `head not recorded` — those runs never captured a sha (their judged trees were uncommitted work; inventing one would fabricate a receipt). After: `phase-lint` verdict PASS (11 phases, 6/6 each) and `verify` ok:true with zero violations.

- **E20** — 2026-11-27, the push incident: a concurrent session's commit (`cc1ed52ff`) landed a second, malformed copy of its research fragment (two-segment heading, no trailing newline) beside its conforming copy, so the corpus gate refused the carrier (`journal aggregate --check`) and the immutability gate refused every hand repair or deletion of it (`log-immutability`, 2 violations) — the branch was unpushable by any normal commit. Resolution: the three commits above origin's tip that created-and-repaired the malformed duplicate were dropped from the unpushed chain by rebase — content preserved byte-for-byte in the conforming fragment (now `febeef66a`), no force push (origin's tip `836119718` untouched) — after which `journal aggregate --check` (38 fragments, ok), `log-immutability` (0 violations over the 6-commit range), `journal.surfaces` 14/0, `verify` ok and `phase-lint` PASS all answered green. The push landed at `febeef66a` with `local-gate: PASS — 18 steps in 788s`. The dropped commit's distinct subject line ("three-project mining, U1-U3 issues") survives only in the reflog.

## Next

Hand the diff to the owner as the external verifier: the four commits, the ledgers above and the verification block in the session reply.

## References

- Issue [#740](https://github.com/gtrabanco/agentic-workflow/issues/740); dependants named by the issue: [#427](https://github.com/gtrabanco/agentic-workflow/issues/427), [#521](https://github.com/gtrabanco/agentic-workflow/issues/521), [#600](https://github.com/gtrabanco/agentic-workflow/issues/600).

## Branch

`fix/740-config-json5-stem`

## Depends on

Empty — #427, #521 and #600 are merged.

## Regression scope

- Every `config get/set/list/show/schema/reset/default/init` run against a `.json` file keeps its output, exit codes and refusal text: `bun test packages/agentic-workflow/test/config-cli.test.mjs` and `packages/agentic-workflow/test/config-materialize.test.mjs` exit 0 with their pre-existing cases kept (changed only where the requirement changes the expected name).
- The identity guard reads this repository's committed `.pi/agentic-workflow.jsonc` profile: `bun test packages/agentic-workflow/test/git-identity.hook.test.mjs` and `scripts/push-identity-check.test.mjs` exit 0.
- A plain-JSON config still parses to the same value on both runtimes: `bun test packages/pi-agentic-workflow/test/config-jsonc.test.mjs` exits 0 with the `J4` case unchanged.
- The settings console's comment-preserving save keeps its bytes: `bun test packages/pi-agentic-workflow/test/settings-console-jsonc.test.mjs` exits 0.
