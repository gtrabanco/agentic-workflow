# fix/165-folded-yaml-description

## Goal

Repair the Pi package's command catalogue so that every bundled skill command
registers its **real** frontmatter `description:` instead of the literal `">"`.
The bug makes pi-web's suggestion menu and Pi's command list render all 19
package commands description-less, breaking discovery/UX for the whole package.

## Issue

[#165](https://github.com/gtrabanco/agentic-workflow/issues/165) — tracked issue
in the project's forge. The PR closes it via `Closes #165` in the body.

## Branch

`fix/165-folded-yaml-description`

## Depends on

None. Independent.

## Root cause

`packages/pi-agentic-workflow/src/routing/catalogue.ts` — `readSkillMeta()` is a
line-oriented `key: value` frontmatter reader. Every skill in this repo declares
its description as a YAML **folded block scalar**:

```yaml
description: >
  Review a change with only applicable internal axes, ….
```

The reader sees `description: >`, takes `>` as the value (non-empty ⇒ stored),
and never reads the following indented lines. Folded (`>`) and literal (`|`)
scalars are unsupported, so **all** skill commands are affected; only
`/agentic-workflow-settings` (hardcoded description in `factory.ts`) is correct.

The bundler (`scripts/bundle-skills.mjs`) deliberately does **not** read
`description`, so the defect is runtime-only and is not caught by the bundle
parity tests.

## Detected in

User report 2026-09-04 on pi-web with pi 0.85.0 and
`@gtrabanco/pi-agentic-workflow` 0.3.0. Confirmed by running the package's own
catalogue reader against the bundled `./skills` directory: every command prints
`">"`.

## Scope

### In scope

- Extend `readSkillMeta()` in `src/routing/catalogue.ts` to parse folded (`>`)
  and literal (`|`) YAML block scalars for `description`, folding continuation
  lines correctly while ignoring other frontmatter keys; plain single-line
  values keep working.
- Add a regression test pinning a real bundled skill's parsed description
  against its frontmatter text, plus a fixture test for the exact folded /
  literal shape.
- Release-rule bookkeeping in the same PR: `version:` bump +
  `CHANGELOG.md` + `CHANGELOG.es.md` rows.

### Out of scope

- Any change to the bundler's frontmatter reader (`scripts/bundle-skills.mjs`);
  it is deliberately description-agnostic and its behaviour is correct.
- Any change to pi / pi-web; the bug is entirely in the package's own catalogue
  reader (confirmed by the issue — not a pi regression).
- Any schema/`types.ts` changes; `WorkflowCommand.description` is already optional
  and unchanged.

### Planning evidence

The fix's own authority, without a Product half.

| id | claim-or-obligation | authority-kind | source-and-location | observed-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|---|
| E1 | All 19 catalogue commands print `">"` — the description value is the one-char `>` | reproduction | `bun run build` then the issue's snippet against `dist/routing/catalogue.js` | 7aeaa547 | AC: every command reports its real description | current | verified | this fixture |
| E2 | `readSkillMeta()` is a line-oriented reader that takes the scalar indicator `>` as the value and never reads continuation lines | root cause | `src/routing/catalogue.ts` `readSkillMeta()` (the `description: >` branch is `value !== ""` ⇒ stored) | 7aeaa547 | AC: folded/literal scalars parse | current | verified | code read |
| E3 | The bundler does not read `description` and its parity tests can never catch this | regression scope | `scripts/bundle-skills.mjs` `parseSkillFrontmatter()` reads only `name`/`user-invocable`/`metadata.internal` | 7aeaa547 | regression test must live in the catalogue test suite | current | verified | code read |
| E4 | Descriptions are read at startup and never persisted | rollback path | `readSkillMeta()` returns a value; nothing writes it to disk or to a migrated store | 7aeaa547 | revert the parser change; no data migration | current | verified | code read |

### Obligations

| obligation-id | Authority source | Affected use case or invariant | Phase | Task | Implementation owner | Validator | Required evidence | Status |
|---|---|---|---|---|---|---|---|---|
| O1 | Issue AC | Every bundled command registers its real description (no `">"`) | P1 | parse folded/literal block scalars in `readSkillMeta` | catalogue.ts | `bun run test` | real-bundle assertion passes | planned |
| O2 | Issue AC | Plain single-line descriptions keep working | P1 | keep the existing single-line path | catalogue.ts | `bun run test` | fixture assertion | planned |
| O3 | Issue AC | A regression test pins a real bundled skill's description to its frontmatter text | P1 | add folded-description test | test/folded-description.test.mjs | `bun run test` | green suite | planned |
| O4 | Issue AC | Existing gates stay green (mirror parity, alias coverage, lockfile policy) | P2 | run full gate | package | `bun run test` | green suite | planned |
| O5 | Release rule | `version:` bump + CHANGELOG rows in the same PR | P2 | bookkeeping | package.json + CHANGELOG.es.md | README | diff present | planned |

## Acceptance

Objective, verifiable conditions for "done".

- `cd packages/pi-agentic-workflow && bun run test` → all tests pass.
- The issue's reproduction snippet (after `bun run build`) prints full sentences,
  never `">"`, for every command.
- `node --test test/folded-description.test.mjs` → green, asserts the real
  `review-change` description equals its frontmatter folded text and that no
  command's description is `">"`.

### Spec-lint (mechanical — presence checks only)

- [x] No template placeholders left.
- [x] `### Out of scope` has ≥ 1 concrete bullet.
- [x] Every `## Acceptance` criterion is a runnable command OR labelled `read-verified`.
- [x] Every phase passes the 8-box Phase-lint below.
- [x] `### Planning evidence` has `current` rows for reproduction, root cause,
      regression scope, and rollback path.
- [x] `### Obligations` has one row per obligation, each with a phase and validator;
      no `deferred` row.

## Phases

### Phase-lint (owned by `skills/phase-contract/SKILL.md`)

`Phase-lint: PASS (8/8) · fingerprint P1:domain:4:parse-folded-and-literal-descriptions`

### P1 — Parse folded/literal description scalars

Layer: `domain`. Done-when: `cd packages/pi-agentic-workflow && bun run test`
→ all tests pass, including the new folded/literal fixture.

- [x] Extend `readSkillMeta()` so `description: >` / `description: |` collects
      the indented continuation lines and folds them (space-joined for `>`,
      newline-preserved for `|`), ignoring other frontmatter keys.
- [x] Keep plain single-line `description:` values working unchanged.
- [x] Add `test/folded-description.test.mjs` with a fixture for the exact folded /
      literal shape and a real-bundle assertion that no command's description is
      `">"` and that `review-change` matches its frontmatter text.

### P2 — Hardening & PR

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #165`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #165` and push

## Testing

Unit layer in the package suite: `test/folded-description.test.mjs` exercises
`readSkillMeta()` directly on frozen folded/literal fixtures and asserts the real
bundled `review-change` description equals its frontmatter folded text and that
no catalogue command carries `">"`. `bun run test` runs all gates (mirror parity,
alias coverage, lockfile policy).

## Rollback

Revert the parser change only:
`git revert <merge-sha of this PR>` — or `git checkout packages/pi-agentic-workflow/src/routing/catalogue.ts && git checkout packages/pi-agentic-workflow/test/folded-description.test.mjs`.
Descriptions are read at startup and never persisted, so there is no data-side
cleanup.

## Status

`in-progress` (branch open, work ongoing)
