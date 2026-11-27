---
type: fix
scope: medium
roadmap_summary: Issue [#726](https://github.com/gtrabanco/agentic-workflow/issues/726) (M): two pi-package packaging defects close on the shipped surface — every skill's `argument-hint` is a quoted YAML string (the bundler refuses to stage an unsafe shape) so no skill loses its `skill:*` command, and the durable-subagents extension loads through a package-owned resolver entry that survives npm/bun hoisting, with one session-level diagnostic when it cannot resolve.
ac-hash: efce729c703be654d25752ff9e73b65817dbda2dba94bb80b36c4c9ebac83a61
---

# fix/726-pi-package-defects

> One-line: a frontmatter scalar that YAML refuses and a manifest path that npm
> never creates ship as a package that silently loses two commands and a whole
> tool layer; both are made structural instead of remembered.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.1
schema: @gtrabanco/agentic-workflow-schema@4.10.1
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

```text
retention-declaration@1
path | disposition
SPEC.md | kept
decisions.md | kept
known-issues.md | kept
planning-obligations.md | kept
planning-evidence.md | kept
review-findings.md | trimmable
```

## Issue

`#726` — tracked issue in the project's forge. This unit's PR closes it via
`Closes #726`. Filed 2026-11-25 from the `5.0.0-canary.20261125.1` verification:
two packaging defects reproduced in runtime-fresh processes, so they are package
defects and not the known stale-daemon module-graph class.

## Specs

The requester's words, verbatim. `S1` is the apply directive; `S2`–`S7` are the
issue's own asks in the issue's order (its two Expected-behaviour groups, then
its four acceptance criteria).

**S1 — apply issue 726 to this repository under the local workflow.**
> Apply to this repository: issue #726

**S2 — defect 1's expected behaviour.**
> - Every shipped skill frontmatter parses under pi's scanner; `argument-hint` values containing YAML-special characters (`[`, `]`, `<`) are quoted as strings in the shipped bundle (e.g. `argument-hint: "[--unit <slug>] [--search \"<words>\"] [--candidate <n>]"`), or the bundler rewrites/stamps them safely at stage time.
> - The pi package's own `test/skill-parity.test.mjs` / alias coverage still passes after the added quoting (the extension-side reader is itself line-oriented; watch for a follow-up change to keep both views equal).

**S3 — defect 1's declared surfaces.**
> Defect 1:
> - `skills/agentic-workflow-doctor/SKILL.md`, `skills/aw-doctor/SKILL.md` (frontmatter `argument-hint:` — quote or escape)
> - `packages/pi-agentic-workflow/scripts/bundle-skills.mjs` (optional: defensive rewrite at stage time, red-first test in a sibling suite)
> - Other skills' `argument-hint:` lines with special characters — audit the whole shipped set for the same shape

**S4 — defect 2's expected behaviour.**
> - The durable-subagents extension resolves and loads on a plain npm install with hoisted dependencies; the `subagents_*` tools appear in the session tool list.
> - If the subagent entrypoint cannot resolve for any layout reason, the package surfaces one session-level diagnostic naming the entry, never a silent skip.

**S5 — defect 2's declared surfaces.**
> Defect 2:
> - `packages/pi-agentic-workflow/package.json` (`pi.extensions` second entry)
> - `packages/pi-agentic-workflow/src/extension/index.ts` (the adapter's extension-provisioning side, if a runtime-safe resolution is implemented)
> - `packages/pi-agentic-workflow/README.md` § Subagent layer (documents the path-edit removal instruction; must state the hoisting caveat once fixed)

**S6 — the acceptance criteria, observed.**
> 1. Every shipped skill's frontmatter parses under pi's scanner: no `Unexpected flow-seq-start`-class warning for any bundled `SKILL.md`, with `agentic-workflow-doctor` and `aw-doctor`'s `skill:*` commands present in `get_commands`.
> 2. The shipped `argument-hint` values keep their current text (the hint strings themselves are unchanged; only the YAML quoting/escaping changes) and the repo's alias-coverage / skill-parity view still matches the extension aliases.
> 3. The durable-subagents extension resolves and loads on a plain npm install with hoisted dependencies; the `subagents_*` tools appear in the session tool list.
> 4. If the subagent entrypoint cannot resolve for any layout reason, the package surfaces one session-level diagnostic naming the entry, never a silent skip.

**S7 — the reported defect is not the stale-daemon class.**
> For contrast, the owner-visible "all slash commands gone" report that led to the verification turned out to be the known stale-daemon module-graph class (in-place package swap under a live `pi-web sessiond`; restart healed it, `/reload` did not) — **not** this issue. The two defects below are real and survive fresh runtimes.

## Acceptance criteria

Frozen at the cut; `ac-hash:` in the frontmatter is this section's SHA-256
(heading and the next `## ` excluded). One criterion per requirement, each
naming the check that proves it.

1. **S1 — the work is applied inline against the frozen ledgers.** `git log --oneline main..HEAD` carries only this unit's conventional commits, and no review pack, audit-pr or fold cycle was run by the repository on this change.
2. **S2 — every shipped skill frontmatter parses, and an unsafe shape cannot be staged.** `bun test test/argument-hint-frontmatter.test.mjs` in `packages/pi-agentic-workflow` exits 0: every source and bundled `SKILL.md` parses under `yaml@2.9.0` with `argument-hint` a string, and a fixture whose source carries a raw `[--unsafe]` hint is staged as a quoted string.
3. **S3 — the whole shipped set was audited and the three unsafe sources are repaired.** The same suite exits 0 over every `skills/*/SKILL.md`; `skills/agentic-workflow-doctor/SKILL.md`, `skills/aw-doctor/SKILL.md` and `skills/fold-findings/SKILL.md` carry a quoted `argument-hint`.
4. **S4 — the subagents layer resolves on either install layout and degrades loudly.** `bun test test/subagents-provision.test.mjs` exits 0: the resolver finds the entry in a hoisted-sibling fixture and in a nested fixture, invokes the entry's factory with `pi`, and an unresolvable entry registers exactly one `session_start` diagnostic naming `pi-extensible-workflows/dist/subagents/index.js`.
5. **S5 — the manifest and README declare the shipped provisioning surface.** The same manifest test exits 0: `pi.extensions` is exactly `./dist/extension/index.js` + `./dist/extension/subagents-entry.js`, the shim exists after `tsc`, the old `./node_modules/...` entry is gone, and the README's Subagent-layer disable instruction names the new entry.
6. **S6 — the declared acceptance is reproduced.** AC1–AC4 are the checks named in criteria 2–5; AC2's parity half is `bun test test/skill-parity.test.mjs test/alias-coverage.test.mjs` exits 0.
7. **S7 — the stale-daemon class is out of scope.** No change touches pi's module graph, `pi-web sessiond`, or a host restart path; `git diff --name-only main..HEAD` names no `sessiond`/daemon file.

## Impact

Two packaging mechanics, and the surfaces that stop failing:

- **`skills/agentic-workflow-doctor/SKILL.md`, `skills/aw-doctor/SKILL.md`,
  `skills/fold-findings/SKILL.md`** — the three `argument-hint:` values YAML
  cannot read as strings today. Quoting is the fix; the hint text is unchanged.
- **`packages/pi-agentic-workflow/scripts/bundle-skills.mjs`** — the staging
  projection gains one transform: an `argument-hint` whose raw value YAML cannot
  read as a plain or quoted string is rewritten as a double-quoted YAML string.
  The source stays the source; the bundle can never ship an unparseable hint.
- **`packages/pi-agentic-workflow/src/extension/subagents.ts`** (new) — the one
  owner of the dependency's resolution: resolve the package through Node's
  algorithm (hoisted or nested), locate `dist/subagents/index.js`, load its
  factory, and register one `session_start` diagnostic when any step fails.
- **`packages/pi-agentic-workflow/src/extension/subagents-entry.ts`** (new) — the
  manifest shim: an extension entry pi can always find, which provisions the
  dependency through the resolver. `pi.extensions` names it instead of a
  `node_modules/` path npm never creates on a hoisted install.
- **`packages/pi-agentic-workflow/package.json`** — the second `pi.extensions`
  entry becomes the shim.
- **`packages/pi-agentic-workflow/README.md` § Subagent layer** — states why the
  entry is a shim, that it resolves under hoisting, and how to disable the layer
  (remove the shim line).
- **Consumers that stop being true**: the old disable instruction names a line
  that no longer exists; the `serena-activation-check` manifest pin asserted the
  old two-entry array; `docs/ROADMAP.md`'s fix row still reads `pending`.

## Surfaces

- `packages/pi-agentic-workflow`
- `skills`
- `docs`

## Retirements

- `./node_modules/pi-extensible-workflows/dist/subagents/index.js` as a
  `pi.extensions` entry — replaced by `./dist/extension/subagents-entry.js`.
  `rg -c 'node_modules/pi-extensible-workflows/dist/subagents/index.js' packages/pi-agentic-workflow/package.json`
  → 0 after the change.
- The README instruction "remove the `./node_modules/...` line" — replaced by the
  shim line; `rg -c 'remove the\n  `./node_modules'` is not a check, the new
  suite pins the new text instead.
- No source skill's `argument-hint` text is retired: the value is byte-identical
  after YAML unquoting, only the scalar's quoting changes.

## Non-goals

- Not the stale-daemon module-graph class (S7), and no host or daemon behaviour
  is touched.
- Not a wrapper around `pi-extensible-workflows`'s engine/starter/trajectory
  extensions — only the subagents entry, as today.
- Not a general YAML linter for skill prose; the transform is scoped to the one
  frontmatter field the defect names, and the test is its guard.
- Not a redesign of the skill bundle's projection manifest.

## Risk tier

`runner ceremony tier classify` over the change's paths (`--paths` naming the
eleven touched/added files) prints `contract: risk-tier-verdict@1`, `tier:
standard`, `reason_kind: executable-content`, `task_size: {understood: true,
contained_risk: contained, resumable_from_diff: true}`, `signals: []`.

- **Tier** — `standard` · **Task Size** — `understood + contained + resumable`
- **Named high-risk item** — `none — not a high-tier unit`

## Future

none

## Future cost

- Every future skill that adds an `argument-hint` with a YAML-special shape
  relies on the bundler's normalisation; a future removal of that transform must
  keep the frontmatter suite green (owner: `packages/pi-agentic-workflow/scripts/bundle-skills.mjs`).
- The subagents shim owns the dependency's resolution; an upgrade of
  `pi-extensible-workflows` that moves or renames `dist/subagents/index.js` must
  update `SUBAGENTS_ENTRY` in `src/extension/subagents.ts` (owner: that module).

## Applicable tests

- `packages/pi-agentic-workflow/test/argument-hint-frontmatter.test.mjs` (new) —
  source and bundle parse under `yaml@2.9.0`, unsafe staging fixture, text
  preservation.
- `packages/pi-agentic-workflow/test/subagents-provision.test.mjs` (new) —
  hoisted/nested resolution, factory invocation, one diagnostic, manifest shim,
  README instruction.
- `packages/pi-agentic-workflow/test/skill-parity.test.mjs` (existing) — the
  projection still equals the declared bundle.
- `packages/pi-agentic-workflow/test/alias-coverage.test.mjs` (existing) — the
  command catalogue still matches the frontmatter.
- `packages/pi-agentic-workflow/test/serena-activation-check.test.mjs`
  (existing) — the manifest pin is re-cut to the new contract.

## Known pre-existing issues

- The stale-daemon module-graph class (in-place package swap under a live
  `pi-web sessiond`) — **does-not-affect** this unit; the two defects reproduce
  in fresh processes and this change touches no host module graph.
- `pi-extensible-workflows`'s subagents bundle imports its peers from its own
  install location; this unit does not change how that package loads itself —
  **does-not-affect** the resolution defect, which is our manifest's path.
- `packages/agentic-workflow/test/doc.structure.test.mjs` (240s suite bound) —
  **does-not-affect** this unit; it times out only under the gate pool's load and
  passes standalone (`node --test`, 19/19, 2m40s). Already on
  `scripts/test-timeout-allowlist.json`; the bound was not raised to pass.
- Six `embed-profile*` cases in the package suite fail while this session exports
  `NAN_API_KEY`/`AGENTIC_WORKFLOW_DOC_EMBEDDINGS_*`/`PI_PROVIDER` —
  **does-not-affect** this unit; the suite is green with those variables unset
  (the same six fail on `main` in this environment).

## Tasks

- P1 — freeze this unit doc, both ledgers, the fix row and the failure corpus as red tests (validator: `bun test test/argument-hint-frontmatter.test.mjs test/subagents-provision.test.mjs` in `packages/pi-agentic-workflow` exits 1, naming the three unsafe hints and the missing shim)
  (Implements: S1, S2, S4, S6)
  - Relevant files: docs/fix/726-pi-package-defects/SPEC.md, docs/fix/726-pi-package-defects/planning-evidence.md, docs/fix/726-pi-package-defects/planning-obligations.md, docs/ROADMAP.md, packages/pi-agentic-workflow/test/argument-hint-frontmatter.test.mjs, packages/pi-agentic-workflow/test/subagents-provision.test.mjs
- P2 — quote the three unsafe source hints and audit the set (validator: `bun test test/argument-hint-frontmatter.test.mjs` in `packages/pi-agentic-workflow` exits 0)
  (Implements: S2, S3)
  - Relevant files: skills/agentic-workflow-doctor/SKILL.md, skills/aw-doctor/SKILL.md, skills/fold-findings/SKILL.md
- P3 — the staging transform refuses to ship an unsafe hint (validator: `bun test test/argument-hint-frontmatter.test.mjs test/skill-parity.test.mjs` in `packages/pi-agentic-workflow` exits 0)
  (Implements: S2, S3)
  - Relevant files: packages/pi-agentic-workflow/scripts/bundle-skills.mjs, packages/pi-agentic-workflow/test/argument-hint-frontmatter.test.mjs
- P4 — the resolver and the manifest shim replace the void path (validator: `bun test test/subagents-provision.test.mjs` in `packages/pi-agentic-workflow` exits 0)
  (Implements: S4, S5)
  - Relevant files: packages/pi-agentic-workflow/src/extension/subagents.ts, packages/pi-agentic-workflow/src/extension/subagents-entry.ts, packages/pi-agentic-workflow/package.json, packages/pi-agentic-workflow/test/subagents-provision.test.mjs, packages/pi-agentic-workflow/test/serena-activation-check.test.mjs
- P5 — README currency and the unit's own state (validator: `bun test test/subagents-provision.test.mjs` in `packages/pi-agentic-workflow` exits 0 with the README case, and `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/726-pi-package-defects/SPEC.md` exits 0)
  (Implements: S5, S6)
  - Relevant files: packages/pi-agentic-workflow/README.md, docs/fix/726-pi-package-defects/SPEC.md, docs/fix/726-pi-package-defects/planning-obligations.md
- P6 — verify: every validator re-run in the foreground, the differential and the projection checked (validator: `bun test` in `packages/pi-agentic-workflow` exits 0, and `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7)
  - Relevant files: docs/fix/726-pi-package-defects/SPEC.md, docs/fix/726-pi-package-defects/planning-obligations.md, docs/LOGS.md

The link grammar (`task-spec-link@1`) is owned by the unit-doc template.

## Triaged steps

`standard` tier, fix lane, both defects in one unit. The machine's step list is
`implement → verify`: the local workflow substitutes the frozen ledgers for the
lane's plan step, and no triage route is re-derived here.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-27, the issue, verbatim: the body is the issue's own text;
  `S1` is the apply directive and `S2`–`S7` quote the two Expected-behaviour
  groups, the two Surfaces groups and the four Acceptance criteria, unedited.
- **L2** — 2026-11-27, owner directive for this run: applied inline, no
  `review-change` / `audit-pr` / fold cycle on this repository's own surgery;
  the deterministic gates run always. The six-step order (resolve intent →
  verbatim intent → red corpus → fixtures → ledgers → slices) governs the unit.
- **E1** — 2026-11-27, scratch parse of every `skills/*/SKILL.md` frontmatter
  with `yaml@2.9.0` · exit 1 · `PARSE-FAIL agentic-workflow-doctor`,
  `PARSE-FAIL aw-doctor` (`Unexpected flow-seq-start`), `NON-STRING-HINT
  fold-findings ["finding-id …"]`.
- **E2** — 2026-11-27, `rg -n '^argument-hint:' skills/*/SKILL.md` · exit 0 ·
  three values begin with `[`: `aw-doctor`, `agentic-workflow-doctor`,
  `fold-findings`; every other hint is a plain scalar or already quoted.

## Next

Land P1's red corpus, then P2–P5; hand the diff to the external verifier.

## References

- Issue [#726](https://github.com/gtrabanco/agentic-workflow/issues/726) — closed
  by this unit's PR (`Closes #726`).
- `docs/fix/727-machine-ledger-commits/` — the same inline-application shape and
  the ledger format this unit reuses.
- pi 1.6.1 `dist/utils/frontmatter.js` (the `yaml` reader) and
  `dist/core/extensions/loader.js` (`pi.extensions` resolution) — the two
  mechanics the defect rests on.

## Branch

`feat/726-argument-hint-npm-hoisting`

## Depends on

none

## Regression scope

- The skill catalogue still registers one command per user-invocable skill, and
  the bundled tree still equals its declared projection — `bun test test/skill-parity.test.mjs test/alias-coverage.test.mjs`
  in `packages/pi-agentic-workflow` exits 0 (unchanged before and after).
- Every `argument-hint` value still decodes to its previous text —
  `bun test test/argument-hint-frontmatter.test.mjs` asserts the decoded value
  against the pre-change source text for the three repaired skills.
- The package's own extension still loads and registers its alias set —
  `bun test test/alias-coverage.test.mjs` exits 0 (the entry is untouched by the
  shim).
- **E3** — 2026-11-27, the red corpus before implementation: `bun test test/argument-hint-frontmatter.test.mjs` in `packages/pi-agentic-workflow` · exit 1 · 5/5 fail — the two `Unexpected flow-seq-start` files and the array-shaped `fold-findings`; `bun test test/subagents-provision.test.mjs` · exit 1 · `Cannot find module '../dist/extension/subagents.js'`.
- **E4** — 2026-11-27, the repaired set: `bun test test/argument-hint-frontmatter.test.mjs` in `packages/pi-agentic-workflow` · exit 0 · 5 pass, 0 fail (source and staged bundle parse under `yaml@2.9.0`; the raw-`[...]` fixture is staged quoted).
- **E5** — 2026-11-27, the package suite: `bun run test` in `packages/pi-agentic-workflow` with the session's leaked `NAN_API_KEY`/`AGENTIC_WORKFLOW_DOC_EMBEDDINGS_*`/`PI_PROVIDER` unset · exit 0 · 1142 pass, 0 fail across 97 files (bundle + `tsc` included).
- **E6** — 2026-11-27, fresh-runtime `get_commands` (temp `PI_CODING_AGENT_DIR`, temp cwd, `pi --mode rpc --no-session --no-extensions --no-context-files --offline --skill <skills>`): base `main` skills → only `skill:fold-findings`; change → `skill:agentic-workflow-doctor`, `skill:aw-doctor` and `skill:fold-findings` (3/3), no `flow-seq-start` in the output.
- **E7** — 2026-11-27, the real dependency through the resolver: `resolveSubagentsEntry()` over the installed `pi-extensible-workflows@6.4.0` → `ok`, `.../dist/subagents/index.js`; `provisionSubagents(fake host)` → `status: loaded`, tools `subagents_inspect,subagents_retry,subagents_run,subagents_steer,subagents_stop`, handlers `session_shutdown,session_start` (temp `HOME`/`PI_CODING_AGENT_DIR`).
- **E8** — 2026-11-27, differential bundle (base script+source vs change script+source, `diff -rq`): identical `32 skills / 115 files / 25 projected`; exactly three files differ — `agentic-workflow-doctor/SKILL.md`, `aw-doctor/SKILL.md`, `fold-findings/SKILL.md` — each only on its `argument-hint:` line.
- **E9** — 2026-11-27, `bun scripts/docs-generate.mjs --check` · exit 0 · `Files: 3 checked · 0 missing · 0 stale · 0 orphaned`, `Roadmap: docs/ROADMAP.md — unchanged`, `verdict: PASS`.
- **E10** — 2026-11-27, `bun scripts/check-skill-context.mjs --documents` · exit 0 · `PASS context documents: 7 budgeted documents` (the package README re-pinned 1,392 -> 1,402 lines with its `sources` note).
- **E11** — 2026-11-27, `bun scripts/skill-lint.mjs` · exit 0 · `0 finding(s) in 0 file(s)`; `bun scripts/lint-changeset.mjs` · exit 0 · `.changeset/726-pi-package-defects.md` ok.
- **E12** — 2026-11-27, `bun scripts/local-gate.mjs --jobs auto`: `root-suite: exit 0`, `crate-suite-bun: exit 0`; `crate-suite-node: exit 1` on one suite only — `packages/agentic-workflow/test/doc.structure.test.mjs (240.0s) — SUITE TIMEOUT`, zero assertion failures inside it; the same suite standalone under `node --test --test-timeout=30000` · exit 0 · 19/19 pass in 2m40s. Pre-existing load-sensitive suite (already on `scripts/test-timeout-allowlist.json` at its declared 240s bound), unrelated to this unit's files; not raised to pass.
- **E13** — 2026-11-27, `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/726-pi-package-defects/SPEC.md` · exit 0 · `{"ok": true, "violations": []}` (obligations closed, ledgers and log shapes accepted).
- **E14** — 2026-11-27, `bun packages/agentic-workflow/bin/agentic-workflow.mjs journal write --kind narrative …` · exit 0 · `.agentic-workflow/journal/20261127T011651Z-feat-726-argument-hint-npm-hoisting-narrative-fix-726.md` (976 bytes, kind `narrative`, session `fix-726`).
