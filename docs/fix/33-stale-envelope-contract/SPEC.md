# fix/33-stale-envelope-contract

## Goal

Remove the two remaining statements of the pre-feature-10 envelope contract so
no document teaches the revoked rule ("every user-facing skill prints the
envelope"). It cannot wait: `orchestration-envelope` states the stale rule in
its frontmatter description and opening section — the exact position weak
models read first and trust most — so orchestrated runs can resurrect
per-skill envelope emission inconsistently.

## Issue

`#33` — the PR closes it via `Closes #33`.

## Branch

`fix/33-stale-envelope-contract`

## Depends on

None.

## Root cause

Feature 10 (`envelope-orchestrator-only`, PR #28) stripped envelope emission
from 14 user-facing skills and moved the requirement to the driver-injected
system-prompt snippet + repair loop, updating `orchestration-envelope` by
**appending** a corrective section ("As of feature 10…") instead of rewriting
the document's contradicted head: the frontmatter `description` and the
opening body section kept the old contract. The same sentence survived in
`packages/agentic-workflow-schema/README.md:5`.

## Detected in

Manual post-backlog adoption review, 2026-07-10 (conversation review of the
U1–U11 rollout; finding F1/F2).

## Scope

### In scope

- `skills/orchestration-envelope/SKILL.md`: rewrite the frontmatter
  `description` and the opening body section to the current contract — the
  schema and the last-fenced-json parse rule stay the core; emission is
  `workflow-status` (the sensor, always) plus any skill turn a driver runs
  with the injected snippet; interactive/human turns emit nothing. Keep the
  dated feature-10 note as history. Patch bump `1.1.0 → 1.1.1`.
- `packages/agentic-workflow-schema/README.md`: fix the one stale sentence
  (docs-only; no schema/code change, no package version bump — ships with the
  next npm release).
- Found during execution by this SPEC's own acceptance grep (plan amended,
  same defect/same nature): the identical sentence in the package's
  `package.json` `description`, the `src/index.ts` doc comment, and
  `envelope.schema.json`'s `description` — text/metadata only, zero behavior
  change (the schema's `type`/`required`/`properties` are untouched), covered
  by the existing tests.
- CHANGELOG.md + CHANGELOG.es.md rows for `orchestration-envelope` 1.1.1,
  listing every touched file (README.md, package.json, src/index.ts,
  envelope.schema.json).

### Out of scope

- Any behavior/schema-shape change (the JSON Schema's `type`/`required`/
  `properties`, the TypeScript types, and the validators are correct and
  untouched — only stale `description` strings were rewritten).
- The driver snippet / repair-loop wording in `ORCHESTRATION.md` /
  `PORTABLE_PROMPT.md` (already correct).

## Acceptance

- `grep -rn "every user-facing" skills/ packages/ docs/features/ docs/workflow/
  | grep -v docs/features/10-envelope-orchestrator-only` (the narrower literal
  match missed `envelope.schema.json` on the first pass — this broadened,
  file-scoped form is what must return nothing outside the feature-10 history
  docs, which legitimately quote the old wording).
- `orchestration-envelope`'s description and opening section state the
  workflow-status + driver-injected contract; the feature-10 note remains,
  dated, below.
- `version: 1.1.1` in the skill frontmatter; CHANGELOG EN/ES rows present and
  list all four touched package files.
- Gate green: `npx skills add . --list` exit 0; `npm test` in
  `packages/agentic-workflow-schema` passes (description-only touches, tests
  prove no accidental shape change).

## Testing

Docs-level: the acceptance greps above + the repo gate + the package's
existing `npm test` (13 tests) — no new tests (no behavior changed).

## Rollback

Revert the PR (single revert commit); no data or published-package cleanup —
the npm package is republished only on its own release cycle.
