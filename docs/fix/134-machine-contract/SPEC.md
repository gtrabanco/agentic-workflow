# fix/134-machine-contract

## Goal

Make the programmatic boundary deterministic without inflating user-facing
skills: preserve the `workflow-status` sensor envelope, give driven working
skills a compact result, and compile repository facts from selected documents
with explicit provenance, unknowns, and contradictions.

## Issue

`#134` — tracked in the project forge. Its current proposed acceptance asks
for an inline machine-envelope section in every user-facing skill. That is
out of scope for this fix: it duplicates prompt tokens and creates a second
schema source. The issue must be amended before a PR claims remote completion.

## Branch

`codex/fix-134-machine-contract`

## Depends on

None.

## Root cause

Envelope v2 had an intended but not strict routing boundary. User-facing
skill prose, legacy examples, and driver parsing could drift independently,
so one malformed result failed a driver without a safe way to distinguish
recoverable legacy data from invented facts.

## Detected in

A driven `audit-pr` result used its native vocabulary for `unit.id`,
`blockers`, and `findings.issues_filed`; downstream validation correctly
rejected it but had no package-owned compatibility contract or deterministic
document snapshot.

## Scope

### In scope

- Package v3 contracts, strict validators, JSON Schemas, profiles, parser,
  documented compatibility mappings, and deterministic snapshot compiler.
- `workflow-status` reference correction: design candidates are
  `detail.design_candidates`, never an envelope root key.
- Smaller orchestration guidance, one bounded repair protocol, and bilingual
  package and workflow documentation.

### Out of scope

- Session retry implementation, filesystem/Git/forge access, or driver
  persistence; those remain the consuming driver responsibility.
- Adding machine-output sections or repeated schema text to every user-facing
  skill.
- Remote issue edits, pushes, releases, or PR creation without explicit
  authorization.

## Acceptance

- AC1 — `npm test` in `packages/agentic-workflow-schema` passes strict v2,
  SkillOutcome v1, snapshot, compatibility, native-fallback, and schema tests.
- AC2 — `parseTurn` accepts only strict contracts, named legacy repairs, and
  the two fixed native verdicts; arbitrary prose and unrecoverable values fail.
- AC3 — `compileWorkflowSnapshot` returns phase state with source provenance
  and preserves unknown or contradicted inputs instead of guessing.
- AC4 — `npm pack --dry-run` includes all three JSON Schemas and bilingual
  package README files.
- AC5 — `npx skills add . --list` and
  `node scripts/check-skill-context.mjs` pass after the skill/reference edits.

### Spec-lint

- [x] No template placeholders remain.
- [x] Out-of-scope has concrete boundaries.
- [x] Every acceptance criterion has a runnable validator.
- [x] Every phase has a concrete, independently checkable task.

## Phases

### P1 — Contract tests and schemas

Layer: domain. Done-when: `npm test` in
`packages/agentic-workflow-schema` exercises the red-first public contract.

- [x] Add public tests before exports and schemas exist, including the
  malformed audit result, native fixed verdicts, snapshot provenance, and
  contradictions.
- [x] Publish strict JSON Schemas for Envelope v2, SkillOutcome v1, and
  WorkflowSnapshot v1.

### P2 — Pure parser and snapshot implementation

Layer: domain. Done-when: `npm test` passes with pure package APIs only.

- [x] Implement strict validators, profiles, generated output instructions,
  parser precedence, and bounded compatibility diagnostics.
- [x] Implement the no-I/O snapshot compiler and public validators.

### P3 — Skill and documentation alignment

Layer: docs. Done-when: `node scripts/check-skill-context.mjs` exits zero.

- [x] Reduce `orchestration-envelope` to policy and executable package links.
- [x] Move workflow-status design candidates under `detail` and update
  bilingual package, workflow, README, migration, and changelog references.

### P4 — Hardening & PR

Layer: hardening. Done-when: declared verification commands pass and the
diff is ready for independent review; no remote operation is performed.

- [x] Re-run package tests, package dry-run, skill discovery, context check,
  and repository verification; record the exact results.
- [x] Benchmark the parser and snapshot compiler on representative synthetic
  input; investigate a material regression before handoff.
- [x] Review the final diff for contract/schema parity, bilingual docs,
  accidental user-skill prompt growth, and unrelated changes.
- [ ] Obtain explicit authorization before any commit, push, PR, release, or
  remote issue amendment.

## Testing

The package tests public seams: strict contract rejection, compatibility that
does not invent identities, profile/instruction selection, fixed native
fallbacks, snapshot provenance/unknowns/contradictions, and schema parity.
Package dry-run verifies published files. Repository checks validate skill
discovery and context budgets.

## Rollback

Revert this change set as one commit. Existing sensor consumers can remain on
`parseEnvelope()` while a driver migrates; no repository data migration is
introduced by the package.

## Status

`in-progress`
