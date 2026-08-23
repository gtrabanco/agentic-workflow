# TASKS — 25-content-bound-review-receipts

Per-phase checklists. Command-checkable acceptance is expressed as the
command; judgment-only checks are labelled `read-verified`.

## P1 — Deliver the CandidateSnapshot v1 contract

Layer: schema · Done-when: `cd packages/agentic-workflow-schema && npm test` →
exit 0 including the new candidate-snapshot suites.

- [x] `test/candidate-snapshot.test.mjs` written FIRST through the public entry (red before validator)
- [x] Export `GitObjectId`, `GitObjectFormat`, `ChangeStatus`, `GitMode`, contract-id constant
- [x] Export `ManifestEntryV1` + `CandidateSnapshotV1` with null-applicability matrix
- [x] `validateCandidateSnapshotV1` structural rules: undeclared fields, contract id, empty-diff/trees-match, rename/copy oldPath, deletion/gitlink nullability
- [x] Path-byte rules: ascending unsigned-byte order, duplicates, NUL/absolute/`..`
- [x] Id/size rules: abbreviated ids, mixed algorithms, negative sizes, mode enum
- [x] `candidate-snapshot.schema.json` + schema↔validator parity test
- [x] Surface exported from `src/index.ts`

## P2 — Deliver the ReviewReceipt v1 contract

Layer: schema · Done-when: `cd packages/agentic-workflow-schema && npm test` →
exit 0 including the new review-receipt suites.

- [x] `test/review-receipt.test.mjs` written FIRST through the public entry (red before validator)
- [x] Export `REVIEW_KINDS` (10 values), `FINDING_SEVERITIES` (5 values), contract-id constant, `FindingV1`, `FindingEvidenceV1`
- [x] Export `ReviewReceiptV1`: id, digest, kind, verdict, findings, identities, timestamps, diagnostics, policyVersion
- [x] `validateReviewReceiptV1`: undeclared fields, vocabularies, formats, unique finding ids, `line ≥ 1`
- [x] `review-receipt.schema.json` + parity test on shared fixtures
- [x] Surface exported from `src/index.ts`
- [x] P1+P2 suites green together — no export collisions

## P3 — Implement the canonical content-binding core

Layer: schema · Done-when: `npm test` → exit 0 (vector/determinism/freshness);
`grep '"version"' package.json` → `"3.3.0"`.

- [x] `canonicalize` per D4 + unit tests
- [x] `digestCandidateSnapshot` + `computeAcceptanceFingerprint` + unit tests
- [x] `compareReceiptToCurrentSnapshot` with D1 reason codes in fixed order + unit tests
- [x] Published frozen `CANONICAL_VECTORS` + fixtures with expected digests
- [x] Vector agreement: TS path == JSON-Schema path == published digests; determinism deep-equal
- [x] `README.md` contracts section (validity ≠ correctness; mandatory binding)
- [x] `README.es.md` synchronized section
- [x] Version `3.2.0 → 3.3.0`; `npm pack --dry-run` lists both new schema files

## P4 — Cover the edge-condition matrix

Layer: hardening · Done-when: `npm test` → exit 0 with edge-matrix suites.

- [x] >32 changed paths: validate → canonicalize → digest → compare pass
- [x] >4 MiB file represented (`sizeBytes` true value, generated at test time)
- [x] Binary content: `binary: true`, manifest-present, evidence-reference reviewable
- [x] renamed/copied/type-changed: oldPath required-vs-forbidden both ways
- [x] Base advancement → `stale-base-tree`; candidate mutation → `stale-candidate-tree`
- [x] Acceptance mutation → `stale-acceptance-fingerprint`; policy mutation → `stale-review-policy`
- [x] Full revert stale; symlink/submodule modes; empty diff valid only trees-match, never reuses older receipt

## P5 — Hardening & PR

Layer: close-out · Done-when: gates green, PR open with `Closes #138`,
roadmap row `done · [#<pr>](<pr-url>)`.

- [x] Re-run the project's full verification gate — `cd packages/agentic-workflow-schema && npm test` → exit 0; `node scripts/check-skill-context.mjs` → PASS; `npx skills add . --list` → exit 0
- [x] Pending-docs check: `git status --porcelain -- docs/` → empty
- [x] Set the roadmap row status to `done` and commit the flip
- [x] `git push` — branch pushed, PR branch remote-current
- [x] Open the PR (`gh pr create --body-file <path>` — body written as a Markdown file, real backticks, never inline `--body`/heredoc that leaves `\`-escaped backticks) and PRINT THE PR URL in the chat; the body includes `Closes #138`
- [x] Update the roadmap row to `done · [#<pr>](<pr-url>)`
- [x] Commit `docs: link PR #<pr>` and push