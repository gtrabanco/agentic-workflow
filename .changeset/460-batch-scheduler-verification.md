---
"@gtrabanco/agentic-workflow-schema": minor
"batch-scheduler": minor
---

fix: batch-plan@2 — the plan verifies the work graph's lifecycle and readiness (issue #460)

The batch scheduler's envelope moves to `batch-plan@2` with four evidence-backed
repairs: the state file persists the last-seen open-issue set (`seen`) and every
run emits the lifecycle delta (`new_issues[]` first-seen, `closed_since[]` with
the last known row) — a closed blocker or a fresh issue is reported, never
silent; an issue whose roadmap fix-row is below `planned` is marked untriaged
(`triaged: false`, `reason.kind: untriaged` — never plain `satisfied-inputs`)
and named in the human summary as co-scheduling-provisional; an open soft dep
the plan does not deliver strictly before the dependent yields a
`soft-deps-open` caveat reason naming the dep and its batch; and the
prose-dependency parser fails closed — only the declared
`| Depends on | Kind | Why |` table form parses, any other shape is a declared
degradation naming the issue (`unavailable-prose-dependencies-issue-<n>-…`)
with zero harvested deps, so non-conforming prose can no longer produce false
`orphaned-soft-dep`/`prose-native-mismatch` findings (the #307 case). Schema
package: `BATCH_PLAN_VERSION` 2, two new reason kinds, the `triaged` field and
the two delta arrays with their validator + `batch-plan.schema.json` projection
in the same change.
