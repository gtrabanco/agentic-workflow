## Normalized Repository State

When `docs/workflow/REPOSITORY_STATE.md` exists, plan from its frozen facts and
decisions. An absent fact may be inspected; a conflict is a resolver
contradiction, never a rewrite. Planned work and documentation are not
implementation evidence. A present ledger whose status is `draft`,
`contradicted`, or `resolved` stops planning and routes to discovery or
resolution first. If no ledger exists, inspect the repository directly and
record `n/a: no normalized repository state`; NRS is optional.

## Architectural invariants

Discover the optional project invariant document declared in the documentation
map (normally `docs/architecture/ARCHITECTURAL_INVARIANTS.md`). If absent,
record `n/a: no project invariants declared` and continue. For every applicable
rule, cite its ID and repository evidence and classify the planned change as
`preserves`, `violates`, `introduces`, or `changes`. Only `preserves` may reach
scaffolding. A violation, new rule, or changed rule stops for an explicit
architectural decision through the project's declared authority; never convert
it into an engineering task or infer approval from the SPEC. Use frozen NRS
facts when available, but repository inspection remains authoritative.
