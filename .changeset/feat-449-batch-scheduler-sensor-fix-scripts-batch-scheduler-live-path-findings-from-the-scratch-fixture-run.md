---
"@gtrabanco/agentic-workflow-schema": minor
"batch-scheduler": minor
---

batch scheduler sensor: parallel-execution batches as the batch-plan@1 machine envelope (#449)

The envelope this note describes was superseded by `batch-plan@2` in the same
release (#460): the plan now also carries the lifecycle delta (`new_issues[]`,
`closed_since[]`), the `triaged` flag and the `untriaged`/`soft-deps-open`
reason kinds.
