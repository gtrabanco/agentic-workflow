---
"@gtrabanco/agentic-workflow-schema": minor
"batch-scheduler": minor
---

fix(batch-scheduler): finish the claimed-surface contract — `batch-plan@4`, one cause, parent coverage

The claimed-surface verification landed without the version bump the closed-core
rule mandates, and its field conflated three causes. This change closes both,
plus the parent-surface blind spot the follow-up review demonstrated.

- **`batch-plan@4`.** `claimed_surface` is a field inside the closed `issues[]`
  key set, so adding it bumps `BATCH_PLAN_VERSION` (3 → 4) and the `schema`
  token: the schema source, the committed draft-07 projection (which never
  published the field, so strict Ajv refused a document the validator accepted),
  the package corpus and `PLAN.md`'s grammar and version history all move
  together. No compatibility shim: this repository ships one version at a time.
- **`claimed_surface` is a `string[]`.** The union's `string` arm was dead
  surface — the sole producer always emitted an array — so the closed contract
  keeps one shape and refuses an empty array or a bare string.
- **One cause, discriminated.** The field now reports only what it names: the
  declared surfaces a **live** branch's computed diff leaves uncovered.
  `collectLaunchEvidence` skips the diff of a merged branch (its trunk diff is
  empty by construction) and records whether a live branch's diff was computed;
  a diff that failed becomes `unavailable-launch-evidence-diff-issue-<n>-<cause>`
  in `degraded[]` instead of a silent "no files". A no-branch issue emits
  nothing — in a live run every flagged row was that case.
- **A declared parent covers its children.** `skills` is verified by any
  `skills/<name>` file from the branch, independent of what a sibling row
  declares, so a demonstrated false positive (a covered surface reported
  unverified) is gone while an uncovered parent is still reported.
- The human summary lists the remaining actionable rows only, one line per
  issue.
- 11 new or re-cut suite cases across the package corpus and the scheduler
  suite: the typed field and the refused `@3` stamp, the three causes, the
  parent probe, the diff-failure degradation, the summary rule and the
  superseded-token sweep extended to `@3`.
