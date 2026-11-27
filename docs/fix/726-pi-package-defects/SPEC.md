---
type: fix
scope: medium
roadmap_summary: Issue [#726](https://github.com/gtrabanco/agentic-workflow/issues/726) (M): two pi-package packaging defects close on the shipped surface — every skill's `argument-hint` is a quoted YAML string (the bundler refuses to stage an unsafe shape) so no skill loses its `skill:*` command, and the durable-subagents extension loads through a package-owned resolver entry that survives npm/bun hoisting, with one session-level diagnostic when it cannot resolve.
ac-hash: d0fcad3a9aff6fe63453c8e23985abbafa1f9b8ed0dcf87fdd46924a58e5374c
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

**S8 — the issue's addendum: the wrong-type variant and the SL-08 regression guard.**
> **Additions for this unit's scope** (2026-11-26, from re-running the frontmatter audit with pi's own YAML reader)
>
> 1. **Defect 1 extends to `fold-findings` — and to the silent wrong-type variant.** The audit of the whole shipped set (`argument-hint:` in every `skills/*/SKILL.md`, 14 hint-carrying skills) found a third affected file: `skills/fold-findings/SKILL.md` carries `argument-hint: [finding-id …]` unquoted. It does **not** error — `[finding-id …]` closes as a flow sequence — but parses to a YAML **array**, not the string a host renders. So the fix and its acceptance check must assert the string type, not just the absence of parse errors; a "no `Unexpected flow-seq-start`" pass would leave fold-findings silently wrong.
>
> 2. **Quoting convention to reuse.** `batch-scheduler`, `workflow-status` and `audit-docs` already quote the same shape — `argument-hint: "[…]"` — and that is the only change needed (hint text byte-identical, per AC2).
>
> 3. **Requested regression guard (new skill-lint check `SL-08 frontmatter-flow-scalar`).** Add one check to `packages/agentic-workflow/src/skills/screen.mjs` + `scripts/skill-lint.mjs`: a frontmatter scalar value (at minimum `argument-hint:`) that opens unquoted with `[` or `{` is a finding — it is either a broken flow collection (the doctor pair) or a silently wrong type (fold-findings). A quoted value or a placeholder-led value (`[<slug> …`) is admitted. Red-first: land the suite additions in `packages/agentic-workflow/test/skills.screen.test.mjs` and `scripts/skill-lint.test.mjs` (the "7 check(s)" header pin and the closed `SL-01…SL-07` id-set pin move to eight) before the engine change, and `skills/skill-lint/references/CHECKS.md` gains the eighth row ("the seven checks" → eight) plus the mention in `skills/skill-lint/SKILL.md`, one PR with the engine change. Note for `IR3`/path-protection: touching the two test files needs the `path-protection-records@1` justification rows in the unit doc before the first edit — recording that here so the lane doesn't stall on the refusal.
>
> 4. **Owner-note on installed copies:** the `5.0.0-canary.20261126.1` install on the verification host still carries the unquoted lines; it was patched in place (three `argument-hint` lines quoted) to keep both doctor skills registered until this unit lands. An update overwrites the patch — the repo-side fix is the durable one.

## Acceptance criteria

Frozen at the cut; `ac-hash:` in the frontmatter is this section's SHA-256
(heading and the next `## ` excluded). One criterion per requirement, each
naming the check that proves it. The `S8` criterion was appended by the issue's
2026-11-27 addendum and the hash re-pinned over the amended section.

1. **S1 — the work is applied inline against the frozen ledgers.** `git log --oneline main..HEAD` carries only this unit's conventional commits, and no review pack, audit-pr or fold cycle was run by the repository on this change.
2. **S2 — every shipped skill frontmatter parses, and an unsafe shape cannot be staged.** `bun test test/argument-hint-frontmatter.test.mjs` in `packages/pi-agentic-workflow` exits 0: every source and bundled `SKILL.md` parses under `yaml@2.9.0` with `argument-hint` a string, and a fixture whose source carries a raw `[--unsafe]` hint is staged as a quoted string.
3. **S3 — the whole shipped set was audited and the three unsafe sources are repaired.** The same suite exits 0 over every `skills/*/SKILL.md`; `skills/agentic-workflow-doctor/SKILL.md`, `skills/aw-doctor/SKILL.md` and `skills/fold-findings/SKILL.md` carry a quoted `argument-hint`.
4. **S4 — the subagents layer resolves on either install layout and degrades loudly.** `bun test test/subagents-provision.test.mjs` exits 0: the resolver finds the entry in a hoisted-sibling fixture and in a nested fixture, invokes the entry's factory with `pi`, and an unresolvable entry registers exactly one `session_start` diagnostic naming `pi-extensible-workflows/dist/subagents/index.js`.
5. **S5 — the manifest and README declare the shipped provisioning surface.** The same manifest test exits 0: `pi.extensions` is exactly `./dist/extension/index.js` + `./dist/extension/subagents-entry.js`, the shim exists after `tsc`, the old `./node_modules/...` entry is gone, and the README's Subagent-layer disable instruction names the new entry.
6. **S6 — the declared acceptance is reproduced.** AC1–AC4 are the checks named in criteria 2–5; AC2's parity half is `bun test test/skill-parity.test.mjs test/alias-coverage.test.mjs` exits 0.
7. **S7 — the stale-daemon class is out of scope.** No change touches pi's module graph, `pi-web sessiond`, or a host restart path; `git diff --name-only main..HEAD` names no `sessiond`/daemon file.
8. **S8 — the addendum is applied: items 1–2 are already delivered, item 3 ships the `SL-08` guard red-first, item 4 needs no repository change.** `bun test scripts/skill-lint.test.mjs packages/agentic-workflow/test/skills.screen.test.mjs` exits 0 with the check set at eight (`SL-01`…`SL-08`), the CLI header reading `8 check(s)`, and the three shapes proven (unquoted `[` and `{` are findings; quoted and placeholder-led values are admitted; `allowed-tools` is not screened); the shipped tree still prints `verdict: PASS`; `skills/skill-lint/references/CHECKS.md` and `SKILL.md` name the eighth check.

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
- **`packages/agentic-workflow/src/skills/screen.mjs`** — the shared screen gains
  `SL-08 frontmatter-flow-scalar` (S8 item 3): an `argument-hint` value that opens
  unquoted with `[` or `{` is a finding unless it is placeholder-led (`[<slug> …`);
  the published check set becomes eight.
- **`packages/agentic-workflow/test/skills.screen.test.mjs` + `scripts/skill-lint.test.mjs`** —
  the closed id-set pin moves to eight and the CLI header says `8 check(s)`; new
  cases prove the finding, the quoted/placeholder-led admissions and the
  `allowed-tools` non-finding.
- **`skills/skill-lint/references/CHECKS.md` + `skills/skill-lint/SKILL.md`** —
  the eighth check's row and the count language the operator reads.
- **Consumers that stop being true**: the old disable instruction names a line
  that no longer exists; the `serena-activation-check` manifest pin asserted the
  old two-entry array; `docs/ROADMAP.md`'s fix row still reads `pending`; the
  “seven checks”/`SL-01…SL-07` pins in the screen and the CLI no longer match.

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
- Not a repair of the verification host's patched install (S8 item 4): that
  patch lives outside the repository and an update replaces it; the repo fix is
  the durable one.
- `SL-08` screens `argument-hint` only, not every flow scalar in every
  frontmatter: `skills/execute-phase/SKILL.md`'s `allowed-tools: [Bash, Read, …]`
  is a legitimate array-typed field, and flagging it would be a false positive.

## Risk tier

`runner ceremony tier classify` over the change's paths prints
`contract: risk-tier-verdict@1`, `tier: standard`, `reason_kind:
executable-content`, `task_size: {understood: true, contained_risk: contained,
resumable_from_diff: true}`, `signals: []`. The S8 addendum adds executable
paths (the screen and its two suites) and keeps the same verdict.

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
  `scripts/test-timeout-allowlist.json`; the bound was not raised to pass. It
  recurred on the addendum's gate runs (`crate-suite-bun` and `crate-suite-node`),
  the only red line both times.
- `scripts/workflow-status-sensor.test.mjs` (shared 120s suite bound) —
  **does-not-affect** this addendum; it passes standalone with the gate's 30s
  per-test budget (`bun test --timeout 30000`, 81/81 in 135s) but exceeds the
  shared suite bound under the root pool's load. Already on
  `scripts/test-timeout-allowlist.json` for its per-test budget; the suite bound
  was not raised to pass.
- Six `embed-profile*` cases in the package suite fail while this session exports
  `NAN_API_KEY`/`AGENTIC_WORKFLOW_DOC_EMBEDDINGS_*`/`PI_PROVIDER` —
  **does-not-affect** this unit; the suite is green with those variables unset
  (the same six fail on `main` in this environment). The same class explains the
  correction batch's first `crate-suite-bun` leg: `doc.query`/`doc.hybrid` failed
  only with those variables exported (47/47 green with them unset), so the gate
  runs for this batch export neither set (2026-11-27).
- An `argument-hint` that is already double-quoted but carries an invalid escape
  (e.g. `"[foo\q]"`) — **does-not-affect** this unit; the transform never
  re-quotes a quoted scalar (re-quoting would corrupt its valid escapes), so such
  a source frontmatter is unparseable at `origin/main` and at this head, byte for
  byte — an authoring defect in the source, never a staging regression. Pinned by
  the suite's own case (2026-11-27).

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
- P7 — land the S8 addendum's red corpus before the engine: the id-set pin moves to eight and the SL-08 cases assert a finding the engine does not emit yet (validator: `bun test scripts/skill-lint.test.mjs packages/agentic-workflow/test/skills.screen.test.mjs` exits 1, naming the missing `SL-08` and the eight-check set)
  (Implements: S8)
  - Relevant files: docs/fix/726-pi-package-defects/decisions.md, scripts/skill-lint.test.mjs, packages/agentic-workflow/test/skills.screen.test.mjs
- P8 — the SL-08 engine check and its owner docs (validator: `bun test scripts/skill-lint.test.mjs packages/agentic-workflow/test/skills.screen.test.mjs` exits 0, and `bun scripts/skill-lint.mjs` exits 0 with `8 check(s)`)
  (Implements: S8)
  - Relevant files: packages/agentic-workflow/src/skills/screen.mjs, scripts/skill-lint.mjs, skills/skill-lint/references/CHECKS.md, skills/skill-lint/SKILL.md
- P9 — verify the addendum: re-run the SL-08 suites, the shipped-tree lint, the unit `verify`, the root suite and the projection check (validator: `bun test scripts/skill-lint.test.mjs packages/agentic-workflow/test/skills.screen.test.mjs` exits 0 AND `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/726-pi-package-defects/SPEC.md` exits 0 AND `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S8)
  - Relevant files: docs/fix/726-pi-package-defects/SPEC.md, docs/fix/726-pi-package-defects/planning-obligations.md, docs/fix/726-pi-package-defects/planning-evidence.md

The link grammar (`task-spec-link@1`) is owned by the unit-doc template.

## Triaged steps

`standard` tier, fix lane, both defects in one unit. The machine's step list is
`implement → verify`: the local workflow substitutes the frozen ledgers for the
lane's plan step, and no triage route is re-derived here.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|
| F4 | S2 · packages/pi-agentic-workflow/scripts/bundle-skills.mjs:135-142 | code | CRITICAL | blocking | source | fold |
| F5 | S2 · packages/pi-agentic-workflow/scripts/bundle-skills.mjs:127-171 | code | CRITICAL | blocking | source | fold |
| F6 | S2 · packages/pi-agentic-workflow/scripts/bundle-skills.mjs:127 | code | WARNING | blocking | source | fold |

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

- **V1** — packages/pi-agentic-workflow/scripts/bundle-skills.mjs:135-142 ·
  reviewer review-change · HEAD e7828e096 · recheck reproducible command
  output: `normalizeArgumentHint("---\nargument-hint: >-2\n  [--foo]\n---\nBody")`
  over the unchanged head tree (`bun -e` import + `yaml@2.9.0` `parse`) — the
  source bytes at base parse `[--foo]` as a string; the staged bytes at head
  throw `All mapping items must start at the same column at line 2`, the
  block-scalar PARSE-ERROR class this unit's D5 exists to prevent. The sign
  order yaml accepts (`>-2`, `|+2`) is misread as a non-plain scalar, the
  header line is quoted and its content line orphaned. confirmed. No shipped
  skill carries the shape today (differential E8/E22), so the regression is in
  the transform's contract, not the bundle.
- **V2** — packages/pi-agentic-workflow/scripts/bundle-skills.mjs:127-171 ·
  reviewer review-change · HEAD e7828e096 · recheck reproducible command
  output: `normalizeArgumentHint("---\nargument-hint: [--a,\n  b]\n---\nBody")`
  over the unchanged head tree — the multi-line raw value is rewritten on its
  opening line only and its continuation line orphaned; base parses the array
  (`["--a","b"]`, the wrong-type class the unit fixes, still loadable), head
  staged frontmatter throws `All mapping items must start at the same column
  at line 2`. confirmed. No shipped skill carries the shape today (E8/E22).
- **V3** — packages/pi-agentic-workflow/scripts/bundle-skills.mjs:127 ·
  reviewer review-change · HEAD e7828e096 · recheck direct read + the
  security pass's own probe: the single-line regex rewrites only the first
  `argument-hint:` occurrence, so a duplicate key ships its second line raw
  and yaml's last-key-wins makes the unrewritten unsafe value authoritative —
  the unit's invariant ("the bundler can never ship an unsafe hint") silently
  conditional on an authoring defect. confirmed as a code read; no shipped
  source has the shape (every shipped frontmatter carries exactly one
  `argument-hint:` line), so it is conditional. confirmed.
- **R1** — 2026-11-27, review at HEAD e7828e096 · verdict REVIEW-FAIL ·
  cycle 1 · gate exit outstanding — axes run: review-code, review-security,
  review-verify (validators re-run green at the head: frontmatter 8/8,
  subagents-provision 12/12, parity+alias 24/24, serena 3/3, screen+lint 33/33,
  skill-lint `8 check(s)` verdict PASS, docs-generate PASS, unit verify PASS,
  obligation tags 147 suites), review-perf; skipped: review-design,
  review-a11y, review-seo, review-brand (no UI/web/brand surface); fix-now
  rows F4, F5, F6 persisted (the code pass returned them; the classifier set
  the routes); report-only notes: the resolver's unused `root` field
  (subagents.ts:87) and the clean-clone validator wording (the
  subagents-provision suite imports the prebuilt `dist/` module the package
  `test` script stages first), both never persisted.
- **G1** — 2026-11-27, GATE-RAN | HEAD e7828e096 · `runner gate-receipt run --
  --jobs 4` and, re-run after the worker-load red, `-- --jobs 2` | exit 1 both |
  manifest `001ced15fabc646747d95553ffa06e1786ffe42ef64635b8d3117b6e26d60ee4`
  — the review's own produced run through the producer at the persist state
  (rows, marks and the corpus re-freeze on disk; this mark line post-dates the
  recorded digest, so the receipt it cites answers `stale` at the head that
  carries the mark — a red mark records a run, it never claims currency): 14
  passed / 1 failed / 5 skipped, the one red `scripts/workflow-status-sensor.test.mjs (120.x s) —
  SUITE TIMEOUT`, zero assertion failures inside it; the same suite standalone
  at this tree with the gate's 30s per-test budget is 81/81 in 122.8 s — the
  documented load-sensitive shared bound (`## Known pre-existing issues`,
  receipted by E18 and the batch's G1), not raised and not repaired here. A red
  mark is the run record; the review's verdict is REVIEW-FAIL on F4-F6 and
  cites no green gate.

## Next

The 2026-11-27 `EXTERNAL VERIFY` receipt's seven blockers are folded (F1–F3
below, four commits: records, narrations, red corpus, engine), advisory 3 is
folded with them, and the batch's own discovery — the transform broke
block-scalar hints — is folded in the same slice per the owner's loop clause.
Next: the delta external re-verify (blockers-only recheck of the receipt), then
the owner's merge of PR [#736](https://github.com/gtrabanco/agentic-workflow/pull/736).
Advisories 1, 2, 4, 5, 6 of the receipt remain triaged-and-left with their
grounds in the receipt; none carries a pending unit task. Every obligation row
is closed against a foreground run; `crate-suite-node`'s `doc.structure` bound
is the environment/load finding recorded in `## Known pre-existing issues`.

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
- **P1** — 2026-11-27, the unit's PR opened: [#736](https://github.com/gtrabanco/agentic-workflow/pull/736) from `feat/726-argument-hint-npm-hoisting`; the roadmap fix row is `done · #736` (owner-written status).
- **E14** — 2026-11-27, `bun packages/agentic-workflow/bin/agentic-workflow.mjs journal write --kind narrative …` · exit 0 · `.agentic-workflow/journal/20261127T011651Z-feat-726-argument-hint-npm-hoisting-narrative-fix-726.md` (976 bytes, kind `narrative`, session `fix-726`), then `journal write --supersedes 20261127T011651Z-…` after the commits existed · exit 0 · `.agentic-workflow/journal/20261127T011859Z-feat-726-argument-hint-npm-hoisting-narrative-fix-726.md` (1,337 bytes) — the correction names the three shas, and `journal aggregate --check` · exit 0 · `{"ok":true,"checked":1,"refusals":[]}`.
- **L3** — 2026-11-27, the issue's addendum (comment 2026-11-27T10:10:33Z), quoted
  verbatim as S8: the whole-set audit found `fold-findings`' array-shaped hint,
  the quoting convention is confirmed, and the owner requests `SL-08
  frontmatter-flow-scalar` red-first (both suite pins to eight, `CHECKS.md` and
  `SKILL.md` updated in the same PR), with the `path-protection-records@1` rows
  recorded before the first test edit. Item 4 (the patched install on the
  verification host) has no repository action.
- **E15** — 2026-11-27, the S8 red corpus before the engine: `bun test scripts/skill-lint.test.mjs` · exit 1 · 20 pass / 2 fail (the `8 check(s)` header pin and the `SL-08` finding case); `bun test packages/agentic-workflow/test/skills.screen.test.mjs` · exit 1 · 9 pass / 2 fail (the eight-id-set pin and the `SL-08` finding case). Both failures are the missing `SL-08`, not a weakened assertion.
- **E16** — 2026-11-27, the S8 engine: `bun test packages/agentic-workflow/test/skills.screen.test.mjs scripts/skill-lint.test.mjs` · exit 0 · 33 pass / 0 fail; `bun scripts/skill-lint.mjs` · exit 0 · `skill-lint — 118 file(s) · 8 check(s) · root .` and `0 finding(s)`, `verdict: PASS` (the shipped tree, including `execute-phase`'s `allowed-tools` array, is not a false positive).
- **E17** — 2026-11-27, the surrounding skill suites: `bun test packages/agentic-workflow/test/skills.screen.test.mjs packages/agentic-workflow/test/skills.discovery.test.mjs packages/agentic-workflow/test/skills.register.test.mjs scripts/skill-lint.test.mjs` · exit 0 · 58 pass / 0 fail.
- **P2** — 2026-11-27, the S8 addendum committed on the PR branch (`test(726)` red suites first, then the `feat(skill-lint)` engine/docs commit) and pushed to PR [#736](https://github.com/gtrabanco/agentic-workflow/pull/736).
- **E18** — 2026-11-27, the addendum's gates: `bun scripts/run-root-suite.mjs` · exit 1 · every suite green except `scripts/workflow-status-sensor.test.mjs (120.0s) — SUITE TIMEOUT` (0 assertion failures inside; standalone with the gate's `--timeout 30000` → 81/81 in 2m15s); `local-gate --only crate-suite-bun --jobs 1` · exit 1 · every suite green except `packages/agentic-workflow/test/doc.structure.test.mjs (240.3s) — SUITE TIMEOUT` (0 assertion failures inside; standalone node 19/19 earlier); `bun scripts/check-skill-context.mjs` · exit 0 · `PASS context budgets: 33 skills`; `bun scripts/check-skill-context.mjs --documents` · exit 0 · `PASS context documents: 7 budgeted documents`; `bun scripts/docs-generate.mjs --check` · exit 0 · `verdict: PASS`; `bun scripts/lint-changeset.mjs` · exit 0; `bun scripts/test-obligation-tags.mjs` · exit 0 · `147 suite(s) · 0 finding(s)`.
- **L4** — 2026-11-27, the correction request, verbatim:
  > Apply to this repository: triage and fix those that deserve to fix but understand the context before fix and check you haven't broke another different thing, if you have done, start the loop again until you fixed full symbol/related stuff

  Resolved as a correction batch against this unit's 2026-11-27 `EXTERNAL VERIFY`
  receipt (`base f1b04a3a9 · head 37f96b4f2`, `Verdict: NEEDS-DECISION`, 7
  blockers / 6 advisories). Triage: blockers 1–7 all real, all folded (F1–F3);
  advisory 3 folded with them because its fix is the same function the fixture
  probe then found breaking block-scalar hints; advisories 1, 2, 4, 5, 6 assessed
  and left (environment-embed class, documented load-sensitive bound, historical
  `#591 S3` citation superseded in the same comment, validator wording whose
  outcome reproduces, settled-unit records of their own time). No review-change,
  audit-pr or fold cycle ran on this batch (`IR7`/S1's inline-application shape).
- **F1** — 2026-11-27, folded blockers 2–7 in `e44326cf5`: the six live sibling
  narrations that still asserted seven checks now say eight
  (`packages/agentic-workflow/src/skills/discovery.mjs:9`,
  `packages/agentic-workflow/src/runner/skills.mjs:8`,
  `packages/agentic-workflow/README.md:66` and `:1043`,
  `skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md:82`,
  `packages/agentic-workflow/test/skills.discovery.test.mjs:7`). Verified by the
  six reproducers re-run green (each `rg` exits 1) and the live-tree sweep
  (`rg -n 'seven .?skill-lint. checks|the seven checks' packages scripts skills
  docs/workflow docs/CAPABILITIES.md README.md`) returning only
  `skills.screen.test.mjs:2` — the receipt's advisory 4, a historical `#591 S3`
  citation superseded two lines below by the eight-id-set sentence.
- **F2** — 2026-11-27, folded blocker 1: O12's validator is re-cut (decision D4)
  from the pattern that never matched this branch's roadmap to the row's
  registration, and the row flipped back to `planned` in `cf351b36b` before it
  re-verified — both halves run in the foreground after the flip: `rg -c '\|
  pi-package-defects \|' docs/ROADMAP.md` → `1`, exit 0, and `bun
  packages/agentic-workflow/bin/agentic-workflow.mjs verify
  docs/fix/726-pi-package-defects/SPEC.md` → exit 0, `{"ok": true,
  "violations": []}`; status `verified` again in this commit.
- **F3** — 2026-11-27, folded advisory 3 together with the change-caused defect
  the batch's own fixture probe found while understanding it (S1's loop clause):
  quoting the first line of `argument-hint: >-` / `|` turned a hint `yaml@2.9.0`
  reads as a string into a frontmatter `PARSE-ERROR` — base ships both shapes,
  the transform broke them (`D5`, `PE-018`). Red corpus `6de1870a1` (6 pass /
  2 fail), engine `5a5f761b6` (8 pass / 0 fail): block-scalar headers ship
  byte-identical, comment-led (`#…`) and YAML-core non-string values (`null`,
  `~`, bool, numeric) stage as the strings the host renders, and a quoted scalar
  is never re-quoted. One correction disclosed: the new
  `block-comment-header` case hardcoded its expected decode as `[--foo]`; the
  measured base decode is `[--foo]\n` (clip chomping), so the literal was
  repaired to base's own value — the byte-identical assertion beside it and every
  pre-existing expectation untouched.
- **E19** — 2026-11-27, the batch's frozen-failure corpus before the fixes: the
  six sibling `rg` reproducers each printed their stale line (exit 0) and O12's
  `rg -n '726-pi-package-defects.*in-progress' docs/ROADMAP.md` → exit 1; `bun
  test test/argument-hint-frontmatter.test.mjs` in `packages/pi-agentic-workflow`
  · exit 1 · 6 pass / 2 fail (the block-scalar byte-parity case and the
  comment/typed string case), observed with the corpus in the tree and the old
  engine (the corpus landed red as `6de1870a1`).
- **E20** — 2026-11-27, the fixture probe before the real tree (`mktemp -d`
  scratch, removed after): 39 hint shapes run through base decoding, the current
  transform and the candidate predicate against the pinned `yaml@2.9.0` — the
  current transform's two base-parity breaks (folded/literal block →
  `PARSE-ERROR`) and the candidate's 39/39 (block shapes byte-identical and
  base-equal, every other shape parsed as a string carrying the author's raw
  text). The measurements behind `PE-018`: block headers → string, `#…` → null,
  `null`/`true`/`123`/`1.5e3`/`.inf` → non-strings, `=foo`/`12:30`/`2026-11-27`
  → plain strings (no action needed on the last three).
- **E21** — 2026-11-27, green after the engine: `bun test
  test/argument-hint-frontmatter.test.mjs` · exit 0 · 8 pass / 0 fail;
  `bun run test` in `packages/pi-agentic-workflow` with the embed/provider env
  unset · exit 0 · 1145 pass, 0 fail across 97 files (E5's 1142 + the three new
  cases), tracked tree byte-clean afterwards.
- **E22** — 2026-11-27, the batch's differential (both sides staged in `mktemp`
  scratch from `git archive` of `origin/main` and this head — script, sources and
  manifest; each side driving its own script copy with a scratch `node_modules`
  pointing at the workspace): identical `32 skills / 115 files / 25 projected`;
  110/115 staged files byte-identical; exactly five differ, each only on its
  asked-for line — the three repaired `argument-hint:` quotes (E8's set) plus
  `BOOTSTRAP_DISCOVERY.md:82` and `AUDIT_DIMENSIONS.md:147` (`seven` → `eight`).
  The new predicate rewrites nothing shipped.
- **G1** — 2026-11-27, the batch's gates with the embed/provider env unset:
  `bun scripts/local-gate.mjs --only root-suite,crate-suite-bun,docs-generated-projection,skill-context-budgets,journal-carrier-check,secret-scan,dimension-regression,rigidity-review
  --skip-network --jobs 2` · exit 0 · `PASS — 7 step(s) in 385s` (root-suite
  147/147 exit 0 in 168s; crate-suite-bun exit 0 in 217s with `doc.structure`
  green inside its bound at 207.1s; `dimension-regression` is skip-by-default as
  a step and its suite `scripts/dimension-regression.test.mjs` passed inside
  root-suite); `bun scripts/test-obligation-tags.mjs` · exit 0 · `147 suite(s) ·
  0 finding(s)`; `bun scripts/lint-changeset.mjs` · exit 0; `bun scripts/docs-generate.mjs
  --check` · exit 0 · `verdict: PASS`; `bun scripts/check-skill-context.mjs`
  and `--documents` · exit 0 · PASS (33 skills / 7 documents — the `seven` →
  `eight` swaps are byte-count-neutral, so no ceiling moved); `bun
  scripts/skill-lint.mjs` · exit 0 · `118 file(s) · 8 check(s)` · `verdict:
  PASS`. `crate-suite-node` was not re-run in this batch: its only red line is
  the documented load-sensitive `doc.structure` bound (receipt advisory 2),
  standalone green re-confirmed the same day (`node --test
  --test-timeout=30000`, 19/19 in 87s).
- **P3** — 2026-11-27, the batch's four commits (`cf351b36b` records, `e44326cf5`
  narrations, `6de1870a1` red corpus, `5a5f761b6` engine) plus this evidence
  commit pushed to PR [#736](https://github.com/gtrabanco/agentic-workflow/pull/736);
  no merge, no approval — the delta external re-verify is next.
