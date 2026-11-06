---
"@gtrabanco/agentic-workflow-schema": minor
---

feat(schema): publish the workflow-projection contract

The schema package becomes the one machine home for the workflow-projection
contract that the pi-bundle stripper, the in-process guards, the seam-hooks
dispatcher and the prereq injection consume, so none of them renegotiates the
grammar independently.

New in this release:

- `projection-manifest@1`: ops `remove` / `pointerize` / `prereq`, the shipped
  section locator's four selector forms carried as data, a `remove`-only
  `except` keep-list, and a per-rule `sha256` content hash over the removed
  UTF-8 bytes. `validateProjectionManifestV1` plus its hand-maintained Draft-07
  projection.
- `guard-verdict@1`: the fail-closed guard answer (`allow` / `block` /
  `degrade`) with the closed rejection reasons, the requirement, the enforcing
  command and the teaching message. `validateGuardVerdictV1` plus its Draft-07
  projection.
- The six closed vocabularies (`PROJECTION_SEAMS`, `PROJECTION_OPS`,
  `PROJECTION_SELECTOR_KINDS`, `PROJECTION_HASH_ALGORITHMS`, `GUARD_VERDICTS`,
  `GUARD_REJECTION_REASONS`), exported and registered in `normative-surfaces@1`.

Types and validation only: the package still declares no `dependencies`, and no
transform, hook or projection runs here. Issue #406.
