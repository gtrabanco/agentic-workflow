# 19 — architectural-invariants · architecture-notes

| Concern | Owner | Rule |
|---|---|---|
| Project invariants | Project architecture documentation | declares stable rules and change authority |
| Workflow protocol | `WORKFLOW_INVARIANTS.md` | defines evaluation and compatibility contract |
| Architectural decisions | Project-declared authority | explicitly accepts rule introduction, change, or violation |
| Repository facts | Repository / optional NRS | source is truth; NRS supplies frozen evidence when available |
| Workflow consumers | planning, execution, review, audit skills | classify and stop; never silently accept a decision |

This is a process/documentation boundary, not a runtime architecture layer.
