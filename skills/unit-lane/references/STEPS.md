# Triaged Step Catalog

The 9 closed steps. Each step is defined by its reference file in
`references/<step>.md`.

| Step | Applies when | Skipped when | Requires gate |
|---|---|---|---|
| research | unit_type == feature, scope != trivial | unit_type in [docs, chore] or scope == trivial | No |
| design | unit_type == feature, scope != trivial | unit_type in [docs, chore] or scope == trivial | No |
| plan | unit_type in [feature, fix], scope != trivial | unit_type in [docs, chore] or scope == trivial | No |
| implement | unit_type in [feature, fix, chore] | unit_type == docs | No |
| tests | unit_type in [feature, fix], scope != trivial, tests != n/a | unit_type == docs or scope == trivial or tests == n/a | No |
| evidence | always (never skipped) | Never | Yes |
| review | unit_type in [feature, fix], scope != trivial | unit_type == docs or scope == trivial | Yes |
| docs | unit_type == docs or (feature/fix and scope != trivial) | unit_type == chore or scope == trivial | No |
| release | unit_type == feature, scope in [medium, large, xlarge] | unit_type != feature or scope in [trivial, small, xs] | Yes |

**Execution order:** research → design → plan → implement → tests → evidence →
review → docs → release. The catalog returns a filtered, ordered subset.

**When a step is skippable:** a step is skipped when its `skipped_when` rule is
true per the catalog. A skipped step is recorded in the Evidence section as
`n/a: <reason>`, not omitted entirely.