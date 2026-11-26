# 716 — batch-scheduler-surface-vocab · known pre-existing issues

Each row: the observation, then an explicit `affects` / `does-not-affect` verdict
for this unit. A red gate is never excused by an unrecorded issue.

| id | observation | verdict |
|---|---|---|
| K1 | the human summary joins every `claimed_surface` row into one line instead of one line per issue (unit 621's external-verify blocker B2, repaired as a wording alignment there) | `does-not-affect` — this unit changes which keys exist, never how the summary renders them; the field's shape and its rendering are untouched |
| K2 | `docs/features/107-mechanization-inventory/INVENTORY.md` restates the envelope's field set as `batch-plan@4` | `does-not-affect` — no field is added and no version moves (`D8`), so the row stays true |
| K3 | `docs/features/470-content-guard-layer` narrates `batch-plan@3` while the live token is 4 (unit 621's advisory A3) | `does-not-affect` — a sibling in-progress unit's own document; no version move here makes it move |
| K4 | `--infer-surfaces` cannot name a lane for a body that declares prose labels instead of paths (the issue's own reproduction on `sosfelinosbasti` #333: `## Surfaces` carries `S42` permission-system, `SACL`, `SAUTH`) | `does-not-affect` as a defect of this unit: a word that names no path is not a lane, and `- surface-unknown` remains the honest answer. The repaired emitter resolves the *path* declarations the same body carries under `## Where`, and the advisory tells the operator to declare the vocabulary once |
| K5 | a fresh worktree cannot run the repository's own commands until `bun install --frozen-lockfile` and the schema package's `bun run build` have run (measured this session, `PE-016`) | `does-not-affect` — an environment precondition of the checkout, not of the change; recorded so a later session does not read the missing-module error as a defect of this unit |
