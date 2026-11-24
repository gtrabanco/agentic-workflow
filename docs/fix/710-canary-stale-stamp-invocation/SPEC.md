---
type: fix
scope: large
roadmap_summary: Issue [#710](https://github.com/gtrabanco/agentic-workflow/issues/710) (M): one root defect class closed on both install surfaces — a canary cut stamps the skills at the train version it publishes and the published tarball's bundle is rebuilt from those bytes, every shipped page orders the symbolic `runner <subcommand>` form (a gate refuses a bare launcher by name and line), and the pi command doors compose a tool call at the exact version they already know instead of handing the model an unresolvable launcher.
ac-hash: edbac7c24919d58c43f3f5d72ad153ad9f3a396d6836d905fb2d357bf0dc300c
---

# fix/710-canary-stale-stamp-invocation

> One-line: an invocation instruction that resolves to nothing is refused by a
> gate, and the two surfaces that compose one in code — the canary stage and the
> pi command door — now carry the exact train they ship.

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
external-verify.md | trimmable
review-findings.md | trimmable
```

## Issue

`#710` — tracked issue in the project's forge. This unit's PR closes it via
`Closes #710`. Family: the #679 incident (manual invocation following the
shipped docs fails); PR #689 closed #679's bin/usage/pin halves and left its
verification-sketch item 3 — the sweep over the skill bodies — unrun.

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim
between the quote markers. `S1` is the operator's order; `S2`–`S10` quote the
issue's own words, which that order adopts as the work.

**S1 — the order: apply #710 to this repository, inline.**
> Apply to this repository: issue #710

**S2 — the defect (A1): a canary cut publishes stale-stamped skills.**
> **Canary publishes ship stale-stamped skills.** At tag `v5.0.0-canary.20261122.1` the tree's `RUNNER.md` pin IS train-coherent (verified: `bunx @gtrabanco/agentic-workflow@5.0.0-canary.20261122.1 <subcommand>` — #689's `stampRunnerPin` did stamp it), but every `skills/*/SKILL.md` frontmatter still reads `version: 4.10.0`. Cause, pinned to lines: `scripts/release.mjs` `publishStage` stages package manifests + the runner pin and **never calls `stampSkillVersions`** (that helper runs only on the stable `apply` path), and the publish job's restore checkout names only `packages/*/package.json` + `skills/runner-contract/references/RUNNER.md` — the skill stamps are neither staged nor restored on the canary path. The version a consumer reads to judge what a skill carries lies one train behind the package that ships it.

**S3 — the defect (A2): skill bodies spell the bare, scope-less launcher.**
> **Skill bodies spell the bare, scope-less name instead of the contract's symbolic form.** `RUNNER.md` §"What a skill cites" mandates `runner <subcommand>` ("A skill never spells a launcher"), yet: `skills/log-session/SKILL.md` (the fragment-carrier step and the long-prose pipe form), `skills/workflow-status/SKILL.md` (`agentic-workflow workflow-status` executes…), `skills/init-workspace/SKILL.md` (`agentic-workflow scaffold`, `agentic-workflow provision permissions`, `agentic-workflow diff-guard`), `skills/pre-execution-review/SKILL.md` (the snapshot recipe). The bare `agentic-workflow` resolves nowhere: the scope-less npm name is the `0.0.0` placeholder without a `bin` (verified inside #679, still true today — command not found on PATH, `npx agentic-workflow` cannot determine an executable).

**S4 — Expected A: both channels carry the train they ship, and no page spells a bare launcher.**
> **Expected A:** published skills (both channels) carry the train version actually shipped; every invocation instruction in a skill body is either the symbolic `runner <svc>` form or the exact-version launcher — never the bare name.

**S5 — the defect (B1): the contract's pin has no referent in the pi bundle.**
> **The contract's textual pin cannot resolve inside a pi session.** The pi bundle pointerizes `RUNNER.md` §The invocation (`projection-manifest.json`: heading survives, body replaced by `> Enforced by runner resolve`), so the surviving "at the pin above" has **no referent** in the shipped bundle.

**S6 — the defect (B2): the command door composes a bare instruction in code.**
> **The command door hands the agent an unresolvable bare instruction composed in code.** `dist/log-session-invocation.js` (~line 291) pushes `agentic-workflow journal write --kind narrative --session <id> …` — bare, unversioned, scope-less — into the prompt the model must then execute. Reproduced this session (2026-11-24): the agent took the line verbatim, hit `command not found` (exit 127), failed a second time on an invented module path, and only reached the CLI through the dogfooding worktree's checkout. The failure is deterministic, not model drift: the instruction names nothing that resolves.

**S7 — Expected B: the extension spawns the runner itself at the exact version it knows.**
> **Expected B:** the extension spawns the runner **itself, programmatically, at the exact version it already knows** — the pi package's own version, whose dependency pins ride the same train (`@gtrabanco/agentic-workflow: 5.0.0-canary.20261122.1` in the installed canary's manifest). The model is never asked to resolve a launcher. Where a printed instruction is unavoidable (documentation), it must spell the exact-version form, verified reachable today:
>
> ```
> bunx @gtrabanco/agentic-workflow@<pi package version> <subcommand> …
> ```

**S8 — the verification sketch, items 1 and 2 (the sweep is the acceptance).**
> 1. Next canary cut: at the published tag, `skills/*/SKILL.md` frontmatter `version:` == the tag's train version.
> 2. `rg "(^|[ \`/])agentic-workflow\b" skills/` over the published trees reports no unresolved invocation instruction (acceptance item #679 defined; #689 did not run it over skill bodies).

**S8a — the acceptance reading S8's own words already fix: no *unresolved instruction*, not zero occurrences of the product name.**
> the sweep that finds *no unresolved invocation instruction* across every `.md`/`.mjs`

**S9 — the issue's own out-of-scope list.**
> - Other bare invocations not covered by the S3 sweep criteria
> - Migration of existing bare invocations in other repos
> - Changes to the pi-bundle pointerization mechanism itself

**S10 — the verification sketch, item 3 (a fresh install lands the entry).**
> 3. Fresh `pi install @gtrabanco/pi-agentic-workflow@canary` + `/log-session` on a fragment-carrier project: the entry lands without the model ever composing the launcher — the extension calls its pinned crate directly, or the printed command carries the exact version and resolves on a clean machine.

## Acceptance criteria

Frozen at the cut; `ac-hash:` in the frontmatter is this section's SHA-256
(heading and the next `## ` excluded). One criterion per requirement, each
naming the check that proves it.

1. **S1 — the order is applied inline against the frozen ledgers.** `git log --oneline main..HEAD` carries only this unit's conventional commits, and `rg -n 'review-change|audit-pr' docs/fix/710-canary-stale-stamp-invocation/` matches no run record: no review pack, no fold cycle, no self-granted gate exception.
2. **S2 — a canary cut stamps the skills at its own train version.** `bun test scripts/release.test.mjs` exits 0 with the case `publish-stage stamps every skill frontmatter at the canary it publishes, and reports the count`, in a fixture whose `skills/*/SKILL.md` carries the previous version before the run and the staged prerelease after it; the same suite keeps `apply stamps every skill frontmatter with the train version` green, and `publish-stage leaves an undeclared sibling's version and its pin alone` green.
3. **S3 — no shipped page orders a bare launcher.** `bun scripts/runner-launcher-drift.mjs` exits 0 over `skills`, `template` and `docs/workflow` with `bare-launcher` findings at zero; `bun test scripts/runner-launcher-drift.test.mjs` exits 0 with the live-tree case (`L1`) plus one injected-finding case naming file and line.
4. **S4 — the restore and the tarball carry the stamped bytes.** `bun test scripts/release-workflows.test.mjs` exits 0 with the case `the canary restore covers the skill stamps and the published bundle is re-staged at the staged train` — the restore line names `skills/*/SKILL.md` and a `bundle:skills` step sits after `publish-stage` and before the publish loop.
5. **S5 — the surviving pin has a referent in the bundled contract.** `bun test packages/pi-agentic-workflow/test/projection.test.mjs` exits 0 with the case `the pointer line names the exact-version launcher at the shipped pin`, and the built bundle's `runner-contract/references/RUNNER.md` contains `bunx @gtrabanco/agentic-workflow@<package version>`, not only `Enforced by`.
6. **S6 — the /log-session directive names a tool, never a launcher.** `bun test packages/pi-agentic-workflow/test/log-session-invocation.test.mjs` exits 0 with the case `the directive names agentic_workflow_run and carries no bare launcher`, which fails on any `agentic-workflow <subcommand>` line in the composed bytes.
7. **S7 — the printed form is exact and derived.** The same two suites prove the version is read, not typed: `projection.test.mjs` moves the fixture's dependency pin and the pointer line follows it, and `log-session-invocation.test.mjs` proves the console notice's launcher equals the installed crate manifest version; `rg -n 'agentic-workflow@[0-9]' packages/pi-agentic-workflow/src` matches nothing (no version literal in the source).
8. **S8, S8a — the sweep reports no unresolved invocation instruction, and the raw grep the issue quotes is answered rather than dodged.** `bun scripts/runner-launcher-drift.mjs` exits 0 with `bare-launcher: 0` over `skills`, `template` and `docs/workflow` (item 2, mechanized); `rg --pcre2 -n '(?<![\w/@.-])agentic-workflow\s+[a-z]' skills/` still reports 16 lines over 12 pages, and every one of them is a prose noun phrase listed in `## Log` E23 (`review pack` ×9, `drivers`, `owns the plan`, `config is installed`, `install reads`, `scaffold` ×3, `maintenance`) — not one orders a command. The canary half is proved by acceptance 2 + 4 (the same code path the next cut runs).
9. **S9 — nothing outside the declared scope moves.** `git diff --name-only main...HEAD` lists no repo outside this one, no `pointerize` op change (`bun test packages/pi-agentic-workflow/test/projection.test.mjs` keeps the `pointerize` op and its hash binding green), and the gate's `SCANNED_ROOTS` is the declared sweep (`bun scripts/runner-launcher-drift.mjs` prints it on demand).
10. **S10 — the entry lands without the model composing a launcher.** The directive's two halves are both resolved by code: the tool name and the subcommand come from the module (`log-session-invocation.test.mjs`'s directive case), and the printed form resolves — in an empty `/tmp` directory, `npx --yes agentic-workflow workflow-status` exits 1 with `could not determine executable to run`, while `npx --yes @gtrabanco/agentic-workflow@4.10.0 unit-doc` exits 2 with the crate's own `EDIT REFUSAL — unit-doc requires` (the package ran, so the launcher resolved). Both runs are recorded as `E` evidence.

## Impact

Six surfaces, one root defect class ("an invocation instruction that resolves to
nothing") plus one versioning gap on the canary path.

- **`scripts/release.mjs`** — the canary stage gains the stamp the stable `apply`
  path already had, and the restore line it prints grows the same path set the
  workflow's restore uses. Anything reading that printed block (the operator, the
  publish job's copy) must agree with it, so the workflow is edited in the same
  commit family.
- **`.github/workflows/publish.yml`** — **the named high-risk item** (verdict
  signal `ci`): the restore step and a new bundle re-stage step. A mistake here
  publishes a tarball, so the workflow's shape is asserted from its own bytes by
  `scripts/release-workflows.test.mjs` (`publish` signal on that suite).
- **`skills/**`, `template/**`, `docs/workflow/**`** — prose. Every changed page
  loses a launcher spelling; nothing else moves. Two consumers read it: the
  standalone skills install (agent composes the launcher from the page) and the
  pi bundle (the page is projected). Context budgets and `skill-lint` read the
  same bytes, so both gates re-run in the same change.
- **`packages/pi-agentic-workflow/`** — the `/log-session` directive
  (`log-session-invocation.ts`), the projection's pointer line and its pin
  plumbing (`scripts/projection.mjs`, `scripts/bundle-skills.mjs`), the
  exact-version launcher helper (`src/runner-bin.ts`) and the settings console's
  operator notice (`src/settings/console.ts`). The bundle is rebuilt by the same
  code every install runs, so a fixture that stages the bundle is the proof.
- **`docs/AGENTS-level surfaces`** — the gate inventory gains one row
  (`runner-launcher-drift`), `RUNNER.md` §"What a skill cites" states the
  enforcement, and the roadmap's `## Fixes` row moves through its own writer.
- **What stops being true**: `RUNNER.md`'s claim that the pin "is stamped at
  release time" was, for the canary channel, half true — it now is true of both
  channels and the section says so.

## Surfaces

- `scripts`
- `.github`
- `packages/pi-agentic-workflow`
- `skills/<name>` (33 pages, one token each)
- `template`
- `docs`

## Retirements

The bare-launcher spelling retires from the shipped prose: the symbolic
`runner <subcommand>` form replaces it, one token per line, and the gate refuses
its return. Nothing else is retired — the `pointerize` op, its selector and its
hash binding stay exactly as shipped (S9), and no skill, reference or contract
file is deleted.

Computed inventory of what this unit *adds* (each with its consumer, so no
surface lands orphaned):

| surface | consumer |
|---|---|
| `scripts/runner-launcher-drift.mjs` | the root suite (`scripts/runner-launcher-drift.test.mjs`) and the local gate |
| `scripts/runner-launcher-drift.test.mjs` | the root suite; the gate-inventory row cites it |
| `docs/fix/710-canary-stale-stamp-invocation/` | this unit's ledger carrier |

## Non-goals

- No migration of another project's prose (S9).
- No change to the pi bundle's `pointerize` op, selector, manifest rule or hash
  binding (S9): only the *text* the rule leaves behind grows the exact-version
  clause, because S7 forbids an unresolvable printed instruction.
- No new release channel, no canary re-cut, no registry publish — the next cut
  is the owner's step.
- No fix for the registry gap the probe found (the committed pin reads `4.10.1`
  while the registry's `latest` is `4.10.0`): publishing the next train is the
  release process's job, and it is recorded as a known pre-existing issue.

## Risk tier

Copied verbatim from `runner ceremony tier classify` at the cut head over the
planned paths:

- **Tier** — `high` · **Task Size** — `{understood: true, contained_risk: "named", resumable_from_diff: true, ceremony: "unit-doc+review-change", verification: "review-change"}`
- **Named high-risk item** — `.github/workflows/publish.yml` (`signal: ci`); second named path `scripts/release-workflows.test.mjs` (`signal: publish`)

`reason`: `4 path(s) touch a named high-risk surface: ci (.github/workflows/publish.yml), publish (scripts/release-workflows.test.mjs)`.
The `review-change` half of the ceremony is replaced by the operator's own
external verification (S1's inline workflow, `## Log` L2/D1).

## Future

none.

## Future cost

- A new runner subcommand is picked up by `scripts/runner-launcher-drift.mjs`
  automatically (the set is read from the CLI's `HELP_REGISTRY`, never restated):
  it binds whoever adds a subcommand to also keeping the prose honest.
- A canary cut now stamps three artifact families (manifests, runner pin, skill
  frontmatter). Adding a fourth train-stamped family means adding it to
  `publishStage` and to the workflow's restore line in the same change — the
  suite's byte assertions are where that is noticed.

## Applicable tests

- `bun test scripts/runner-launcher-drift.test.mjs` — the new gate (red first).
- `bun test scripts/release.test.mjs` — the canary stamp parity.
- `bun test scripts/release-workflows.test.mjs` — the workflow's restore and
  bundle re-stage shape.
- `bun test packages/pi-agentic-workflow/test/log-session-invocation.test.mjs` —
  the directive's bytes.
- `bun test packages/pi-agentic-workflow/test/projection.test.mjs` — the pointer
  line's pin.
- `bun run --cwd packages/pi-agentic-workflow test` and
  `bun run --cwd packages/agentic-workflow test` — the two package gates.
- `bun scripts/check-skill-context.mjs`, `bun scripts/skill-lint.mjs`,
  `bun test scripts/prose-gate-inventory.test.mjs`,
  `bun test scripts/normative-drift.test.mjs` — the prose budget, the authoring
  lint and the two drift gates the changed pages belong to.

## Known pre-existing issues

- **The registry's `latest` is `4.10.0` while the tree's pin reads `4.10.1`** —
  `affects` this unit's evidence only: the exact-version form is probed at
  `4.10.0` (the reachable version), and the *next cut* is what publishes 4.10.1.
  The pin is not edited here: `release.mjs apply` owns it and the cut fixes it.
- **`--version` on the canary channel is rejected by design** (D-40-3) —
  `does-not-affect`: this unit's suite passes `--date` only.
- **`bun test` can report `0 pass 0 fail` on a few suites that pass under
  `node --test`** (#710's family was not hit by this) — `does-not-affect`: every
  suite this unit touches is run under both invocations in the verification block.

## Tasks

- P1 — Cut this unit doc and its ledgers; register the row through the writer (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/710-canary-stale-stamp-invocation/SPEC.md --no-git` exits 0)
  (Implements: S1)
  - Relevant files: docs/fix/710-canary-stale-stamp-invocation/SPEC.md, docs/fix/710-canary-stale-stamp-invocation/planning-evidence.md, docs/fix/710-canary-stale-stamp-invocation/planning-obligations.md, docs/fix/710-canary-stale-stamp-invocation/decisions.md, docs/fix/710-canary-stale-stamp-invocation/known-issues.md
- P2 — RED: the launcher-drift suite lands alone and is observed failing on the missing module (validator: `bun test scripts/runner-launcher-drift.test.mjs` exits 1 with the module-resolution failure recorded as an `E` line)
  (Implements: S3, S8)
  - Relevant files: scripts/runner-launcher-drift.test.mjs
- P3 — RED: the canary-stamp, restore-shape, pointer-line and directive cases land and are observed failing (validator: `bun test scripts/release.test.mjs` exits 1 on the new case)
  (Implements: S2, S4, S5, S6, S7)
  - Relevant files: scripts/release.test.mjs, scripts/release-workflows.test.mjs, packages/pi-agentic-workflow/test/projection.test.mjs, packages/pi-agentic-workflow/test/log-session-invocation.test.mjs
- P4 — The gate: `scripts/runner-launcher-drift.mjs` reads the subcommand set from the CLI's registry and the sanctioned head from the runner contract, and reports `bare-launcher` by file and line (validator: `bun test scripts/runner-launcher-drift.test.mjs` exits 0 with the injected-finding and exemption cases green)
  (Implements: S3, S8, S9)
  - Relevant files: scripts/runner-launcher-drift.mjs
- P5 — The sweep: every bare launcher in the shipped prose becomes the symbolic `runner <subcommand>` form (validator: `bun scripts/runner-launcher-drift.mjs` exits 0)
  (Implements: S3, S4, S8)
  - Relevant files: skills, template, docs/workflow
- P6 — Canary parity: `publishStage` stamps the skill frontmatter and prints it (validator: `bun test scripts/release.test.mjs` exits 0)
  (Implements: S2, S4)
  - Relevant files: scripts/release.mjs
- P7 — The published bytes: the restore covers the skill stamps and the bundle is re-staged after the stage (validator: `bun test scripts/release-workflows.test.mjs` exits 0)
  (Implements: S2, S4, S8)
  - Relevant files: .github/workflows/publish.yml
- P8 — The pi door: the `/log-session` directive names the tool and the exact-version launcher helper lands (validator: `bun test packages/pi-agentic-workflow/test/log-session-invocation.test.mjs` exits 0)
  (Implements: S6, S7, S10)
  - Relevant files: packages/pi-agentic-workflow/src/log-session-invocation.ts, packages/pi-agentic-workflow/src/runner-bin.ts, packages/pi-agentic-workflow/src/settings/console.ts
- P9 — The bundled pin: the projection's pointer line carries the exact-version launcher at the shipped pin (validator: `bun test packages/pi-agentic-workflow/test/projection.test.mjs` exits 0)
  (Implements: S5, S7, S9)
  - Relevant files: packages/pi-agentic-workflow/scripts/projection.mjs, packages/pi-agentic-workflow/scripts/bundle-skills.mjs
- P10 — Surfaces and state: the gate-inventory row, the contract's enforcement sentence, the roadmap row through its writer, the session journal (validator: `bun test scripts/prose-gate-inventory.test.mjs` exits 0)
  (Implements: S1, S3, S4)
  - Relevant files: docs/workflow/GATE_INVENTORY.md, skills/runner-contract/references/RUNNER.md, docs/ROADMAP.md
- P11 — Verification: the full gate and the obligation ledger closed (validator: `bun scripts/local-gate.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8, S9, S10)
  - Relevant files: docs/fix/710-canary-stale-stamp-invocation/planning-obligations.md, docs/fix/710-canary-stale-stamp-invocation/SPEC.md

## Triaged steps

`runner unit-route --triage 710` at the cut head, verbatim:

```text
TRIAGE — 710 (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
```

The command's fifth line (the `relay:` / `relay-next:` addendum, `bootstrap-needed`)
is this pi-web session's own packet state, not a triaged step: this unit is applied
inline by the operator's workflow (`## Log` L2), so no Relay packet is dispatched.
The `review` step is replaced by that same workflow's external verification.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-24, the operator's order, verbatim:
  ```
  Apply to this repository: issue #710
  ```
- **L2** — 2026-11-24, the operator's governing workflow for this application, verbatim (the part that binds the procedure):
  ```
  4. Work inline — never run this repo's own machinery on its own surgery

  No `review-change`, no `audit-pr`, no fold cycle, no self-granted gate exceptions on this change. Direct application: the §5 ledger freeze **is** the plan; implement against it, hand the diff to me. The one exception is the repo's deterministic gates (tests, lints) — run those always.
  ```

- **L1** — 2026-11-24, the operator's order, verbatim:
  ```
  Apply to this repository: issue #710
  ```
- **L2** — 2026-11-24, the operator's governing workflow for this application, verbatim (the part that binds the procedure):
  ```
  4. Work inline — never run this repo's own machinery on its own surgery

  No `review-change`, no `audit-pr`, no fold cycle, no self-granted gate exceptions on this change. Direct application: the §5 ledger freeze **is** the plan; implement against it, hand the diff to me. The one exception is the repo's deterministic gates (tests, lints) — run those always.
  ```
- **E1** — 2026-11-24, `bun test scripts/runner-launcher-drift.test.mjs` at `999edf66c` · exit 1 · `Cannot find module './runner-launcher-drift.mjs'`, 0 pass / 1 fail — the red commit before the gate existed.
- **E2** — 2026-11-24, `bun test scripts/release.test.mjs` at `f6c9c2643` · exit 1 · 2 fail (`publish-stage stamps every skill frontmatter…`, `the restore publish-stage prints…`), 75 pass.
- **E3** — 2026-11-24, `bun test scripts/release-workflows.test.mjs` at `f6c9c2643` · exit 1 · 2 fail (the restore path set, the bundle re-stage), 26 pass.
- **E4** — 2026-11-24, `bun test test/projection.test.mjs test/settings-console.test.mjs test/log-session-invocation.test.mjs` in `packages/pi-agentic-workflow` at `f6c9c2643` · exit 1 · `Export named 'pointerLine' not found`, `Export named 'crateVersion' not found`, and the two directive cases red.
- **E5** — 2026-11-24, the frozen-failure corpus, measured with a code-context scanner over the three roots (subcommand set read from `HELP_REGISTRY`) · **101 sites / 52 files** — 57 under `skills/`, 14 under `template/`, 30 under `docs/workflow/`.
- **E6** — 2026-11-24, `bun scripts/runner-launcher-drift.mjs` after the sweep · exit 0 · `bare-launcher: 0` · `roots: skills,template,docs/workflow · sanctioned: runner · ordered: 75 · citations: 83 · files: 173` · `verdict: PASS`.
- **E7** — 2026-11-24, `npx --yes agentic-workflow workflow-status` in an empty `/tmp` directory (the A2 reproducer) · exit 1 · `npm error could not determine executable to run`.
- **E8** — 2026-11-24, `npx --yes @gtrabanco/agentic-workflow@4.10.0 unit-doc` in the same directory (the exact-version form resolves) · exit 2 · `EDIT REFUSAL — unit-doc requires <slug> <operation> [args...]` — the crate ran; `journal`, `verify`, `doctor`, `help` and `relay` are refused by name at that published version.
- **E9** — 2026-11-24, `npm view @gtrabanco/agentic-workflow version` → `4.10.0`; `npm view @gtrabanco/agentic-workflow versions --json` last row `5.0.0-canary.20261122.1` — the tree's pin (`4.10.1`) is not published yet (known-issues).
- **E10** — 2026-11-24, `bun -e '… Object.keys(HELP_REGISTRY).length'` · `75` — the ordered set the gate derives.
- **E11** — 2026-11-24, `rg --no-filename '^version:' skills/*/SKILL.md | sort | uniq -c` · `31 version: 4.10.1` — the stamp's target and its current state.
- **E12** — 2026-11-24, `bun test scripts/release.test.mjs` · exit 0 · **77 pass / 0 fail**.
- **E13** — 2026-11-24, `bun test scripts/release-workflows.test.mjs` · exit 0 · **28 pass / 0 fail**.
- **E14** — 2026-11-24, `bun run --cwd packages/pi-agentic-workflow bundle:skills` · `bundled 30 skills (112 files) · projected: 24 files`; the staged `runner-contract/references/RUNNER.md` carries the pointer line with `bunx @gtrabanco/agentic-workflow@4.10.1`.
- **E15** — 2026-11-24, `bun test test/projection.test.mjs` · exit 0 · **21 pass / 0 fail**; `bun test test/log-session-invocation.test.mjs` · exit 0 · **17 pass / 0 fail**.
- **E16** — 2026-11-24, `bun scripts/skill-lint.mjs` · `skill-lint: 0 finding(s) in 0 file(s)· verdict: PASS`; `bun scripts/check-skill-context.mjs` · `PASS context budgets: 31 skills`; `--documents` · `PASS context documents: 7 budgeted documents` after the re-pin.
- **E17** — 2026-11-24, `bun scripts/invocation-drift.mjs` · `verdict: PASS`; `bun scripts/forge-read-drift.mjs` · `verdict: PASS`; `bun scripts/red-first.mjs` · `0 finding(s) · verdict: PASS`.
- **E18** — 2026-11-24, `bun test scripts/prose-gate-inventory.test.mjs` · exit 0 · **22 pass**; `bun test scripts/normative-drift.test.mjs` · exit 0 · **24 pass**; `bun test scripts/test-obligation-tags.test.mjs` · exit 0 · **22 pass**.
- **E19** — 2026-11-24, `bun run --cwd packages/agentic-workflow test` · exit 0 · every suite PASS; `bun run --cwd packages/agentic-workflow-schema test` · exit 0 · **953 pass / 0 fail**.
- **E20** — 2026-11-24, `bun run --cwd packages/pi-agentic-workflow test` · exit 1 · **1074 pass / 2 fail** — both failures are `runner-prose.test.mjs` (`the packaged skills carry no runner invocation`, `the package's own files carry no runner invocation`), which pins issue #555's grep-clean AC against the two documentation sites this unit's S5/S7 fill (D11, known-issues' blocker).
- **E21** — 2026-11-24, `bun scripts/version-parity-gate.mjs --content` · exit 0 · `VERDICT: PASS` (changeset declares the crate and the pi package); `bun scripts/lint-changeset.mjs` · `ok 710-canary-stale-launcher-spelling.md`.
- **G1** — 2026-11-24, HEAD `09ef2959e`, `bun scripts/run-root-suite.mjs --jobs 4` · exit 0 · **143/143 PASS**.
- **G2** — 2026-11-24, HEAD `09ef2959e`, `bun scripts/local-gate.mjs --jobs 4 --no-bail` · 19 of 20 steps exit 0 (`root-suite` 166s, `crate-suite-bun` 100s, `crate-suite-node` 133s, `schema-node-compat`, `pi-compat-guard`, `docs-generated-projection`, `version-parity-content`, …); `pi-node-compat` exits 1 on the two `runner-prose` cases above.
- **G3** — 2026-11-24, HEAD `09ef2959e`, `rg -n '^\- \*\*R[0-9]' docs/fix/710-canary-stale-stamp-invocation/SPEC.md` matches nothing and no review receipt exists: no review pack ran on this unit (criterion 1's substance; the two textual mentions of `review-change`/`audit-pr` are the prohibition quoted as L2 and D1, never a run record).
- **E22** — 2026-11-24, the differential check of the gate against its own corpus: the first classifier scanned inline spans line by line, so a command whose span wraps in a narrow column slipped past. Measuring with the wrapped-span rule finds **11 more sites** (9 pages: `execute-phase`, `BOOTSTRAP_WRITE`, `LEDGERS`, `review-change`, `RUNNER.md`, `RELEASE.md` ×2, `template/.agentic-workflow/journal.md`, `template/AGENTS.md`, `template/docs/architecture/ARCHITECTURAL_INVARIANTS.md`), all fixed as `44ec8c8e0`'s sweep had fixed the first 100; suite case `L10` pins the shape. Total corpus: **111 code-context sites over 51 pages**.
- **E23** — 2026-11-24, HEAD `ebd7b35fe`+E22, `rg --pcre2 -n '(?<![\w/@.-])agentic-workflow\s+[a-z]' skills/` · 16 lines over 12 pages, every one a prose noun phrase and none an instruction: `review pack` ×9 (`review-verify`, `review-design`, `review-brand`, `review-a11y`, `review-perf`, `review-seo`, `review-debt`, `review-security` descriptions, all frontmatter), `agentic-workflow drivers` (`orchestration-envelope` description), `agentic-workflow owns the plan` (`RELAY.md:23`), `an agentic-workflow config is installed` (`ENGINEERING_INTERVIEW.md:119`, an interview cell), `An agentic-workflow install reads` (`CONFIG.md:9`), `agentic-workflow scaffold` ×3 (`init-workspace/SKILL.md:85,128`, `UPGRADE.md:3`), `agentic-workflow maintenance` (`skill-lint/SKILL.md:8`).
- **E24** — 2026-11-24, the re-run after E22/D12/D13 · `bun scripts/runner-launcher-drift.mjs` exit 0 (`bare-launcher: 0 · ordered: 75 · citations: 83 · files: 173`) · `bun test scripts/runner-launcher-drift.test.mjs` **10 pass / 0 fail** · `bun scripts/run-root-suite.mjs --jobs 4` **143/143 PASS** · `bun run --cwd packages/agentic-workflow test` all PASS · `…-schema test` **953/0** · `skill-lint` PASS · `check-skill-context` PASS (31 skills / 7 documents) · `invocation-drift`, `forge-read-drift`, `docs-generate --check` PASS · `bun run --cwd packages/pi-agentic-workflow test` **1074 pass / 2 fail** (D11's two cases, unchanged).
- **G4** — 2026-11-24, HEAD `8112cfb05`, `bun scripts/local-gate.mjs --jobs 4 --no-bail` · **19 of 20 steps exit 0** (`root-suite` 174s, `crate-suite-bun` 139s, `crate-suite-node` 289s, `schema-node-compat` 15s, `pi-compat-guard` 56s, `docs-generated-projection`, `version-parity-content`, `secret-scan`, `temp-hygiene`, `skill-context-budgets`, `journal-carrier-check`, `log-immutability`, `dependency-pin-gate`, `dependency-advisories`, `workspace-install`, `schema-build`, `worktree-guard`, `rigidity-review`, `tmp-gc`) · `pi-node-compat` exit 1 on D11's two cases.
- **L3** — 2026-11-24, the operator's ruling on D11, verbatim in substance: in the **skills** the runtime detection is prose (a standalone skills install has nothing else) and pointing at the wrong version is exactly what makes an agent hunt for workarounds when a subcommand is missing; in **pi-agentic-workflow** the launcher makes no sense because those calls happen in code — which also keeps them out of the context the model pays for, and lets the session stop, run the command and add its output when it must run anyway. #555 stands; the skills keep their prose.
- **E25** — 2026-11-24, after D11: `bun run --cwd packages/pi-agentic-workflow test` · exit 0 · **1075 pass / 0 fail** (the two `runner-prose` cases now pass **unamended**); `bun test test/projection.test.mjs` · 20 pass; `bun test test/settings-console.test.mjs` · 71 pass; the staged bundle's pointer line reads `In a pi session the pin is the crate this package installs and the extension spawns it at that exact version; outside pi, cite \`runner <subcommand>\``.
- **P1** — 2026-11-24, unit doc + ledgers cut; the roadmap row moved to `in-progress` through `runner roadmap … fixrow` · `5a95fcea5`.
- **P2** — 2026-11-24, the launcher-drift suite alone, observed red · `999edf66c`.
- **P3** — 2026-11-24, the four reproducers, observed red · `f6c9c2643`.
- **P4** — 2026-11-24, the gate (`scripts/runner-launcher-drift.mjs`) · `9ff8681ee`.
- **P5** — 2026-11-24, the sweep: 100 code-context sites over 51 pages + the contract's enforcement sentence + two superseded expectations · `44ec8c8e0`.
- **P6** — 2026-11-24, canary parity in `publishStage` and the printed restore · `f94e4ce87`.
- **P7** — 2026-11-24, the workflow's restore path set and the post-stage bundle rebuild · `f94e4ce87`.
- **P8** — 2026-11-24, the `/log-session` tool call, the exact-version launcher helper and the console notice · `0c4fdb801`.
- **P9** — 2026-11-24, the pointer line's referent and its derived pin · `0c4fdb801`.
- **P10** — 2026-11-24, the gate-inventory row, the re-pinned budget, the release intent, the roadmap row and projection · `09ef2959e`.
- **D1** — 2026-11-24, owner order (L2): the unit is applied inline; the operator is the external verifier; the repository's deterministic gates are the only ceremony.
- **D2** — 2026-11-24, the sweep's scope and classifier are the ones `docs/fix/710-canary-stale-stamp-invocation/decisions.md` D2 states (`skills`, `template`, `docs/workflow`; code context only).
- **D12** — 2026-11-24, the acceptance reading of S8 is amended by **S8a**: the issue's own words are "no *unresolved invocation instruction*", and the criterion I froze used a raw occurrence grep that also matches the framework's name in prose (`the agentic-workflow review pack`). S8 is untouched — S8a appends the reading, criterion 8 is restated against it, and `ac-hash` is recomputed (`edbac7c2…`). The amendment narrows nothing: the gate is stricter than the raw grep (110 sites it found, 16 residual prose lines it proves are not commands).
- **D11** — 2026-11-24, the operator's ruling closed it: the pi package resolves the runtime in code (no launcher prose, no context cost), the **skills** keep theirs (a standalone install has no code to resolve anything, and an exact pin is what stops the agent hunting for a workaround). #555 stands unamended; both pi documentation sites were repaired without printing a launcher.

## Next

Nothing in the unit is open: 18/18 obligations verified, every local-gate step
green. The next action is the merge gate on PR #713, then the release note the
changeset declares.

## References

- Issue [#710](https://github.com/gtrabanco/agentic-workflow/issues/710) — the work order this unit applies; the PR closes it via `Closes #710`.
- Issue [#679](https://github.com/gtrabanco/agentic-workflow/issues/679) and PR [#689](https://github.com/gtrabanco/agentic-workflow/pull/689) — the same incident family; its verification-sketch item 3 is this unit's acceptance 3.
- Issue [#696](https://github.com/gtrabanco/agentic-workflow/issues/696) — the pi-side runner mapping (`runner-mapping@1`), whose owner file this unit's pin plumbing reads.
- Issue [#612](https://github.com/gtrabanco/agentic-workflow/issues/612) — `scripts/forge-read-drift.mjs`, the sanctioned-forms gate this unit's gate is transposed from.

## Branch

`fix/710-canary-stale-skills` (the worktree branch this unit is applied on; the
unit slug follows the roadmap row's topic cell, the branch its already-created
worktree).

## Depends on

Empty — independent.

## Regression scope

| scenario | check |
|---|---|
| the stable `apply` path still stamps every skill, template and runner pin | `bun test scripts/release.test.mjs` exits 0 (`apply stamps the runner pin…`, the skill and template stamp cases) |
| a canary cut still writes nothing durable: no changelog row, no consumed changeset | `bun test scripts/release.test.mjs` exits 0 (the durability assertions of the publish-stage cases) |
| the pi bundle still applies the declared projection and its hash binding | `bun test packages/pi-agentic-workflow/test/projection.test.mjs` exits 0 |
| every skill still fits its context ceiling and its authoring lint | `bun scripts/check-skill-context.mjs` exits 0 and `bun scripts/skill-lint.mjs` exits 0 |
| the crate's CLI surface is untouched | `bun run --cwd packages/agentic-workflow test` exits 0 |
| this repository's own provided pages still order a runnable command | `bun scripts/invocation-drift.mjs` exits 0 and `bun scripts/forge-read-drift.mjs` exits 0 |
