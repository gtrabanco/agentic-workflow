---
name: implement-feature
user-invocable: true
description: >
  Implement a small feature end-to-end in a single pass from a filled SPEC under
  docs/features/<NN>-<slug>/. Reads the SPEC + project docs, maps changes to the
  project's own layers (per its architecture doc), writes the code
  with the project's hard rules in mind, and produces a completion checklist.
  Prefer execute-phase for phase-by-phase execution of larger features; this
  skill is the single-pass variant. Triggers: "implement the <NN>-<slug> feature",
  "build <slug> from its spec", "work on docs/features/<NN>-<slug>",
  "implement-feature <NN>".
---

# Implement Feature from Spec

## When to use

When asked to implement a feature that has a spec in `docs/features/<NN>-<slug>/`
and the scope is small enough to land in a single pass (no phase split needed).

For phase-by-phase execution, use `execute-phase` instead.

## Process

### 1. Read all spec files

```
docs/features/{name}/SPEC.md        ← required
docs/features/{name}/DECISIONS.md   ← if exists
```

Then read `CLAUDE.md` and the relevant docs for the feature domain.

### 2. Clarify before coding

If SPEC.md is ambiguous on any of these, ask before writing code:
- Scope: what is explicitly OUT of scope?
- Edge cases: error states, empty states, unauthorized access
- UI: does this need a new page, component, or only backend?

One question at a time. Don't ask about things the spec already covers.

### 3. Map to the project's layers

Before writing code, identify which of the project's layers each change touches,
following the boundaries and naming defined in its architecture doc. A typical
mapping (adapt to the project's actual layout):

| Concern | Files to create/modify |
|---|---|
| Core entity / value object (if new) | the project's core/domain layer |
| Error types (if new) | the project's error definitions |
| Abstraction for an external dep (if new) | the project's interface/port layer |
| Orchestration / use case | the project's application layer |
| External-system adapter | the project's infrastructure/adapter layer |
| Persistence / schema change | the project's data layer + any migration |
| Inbound message / event type | the project's message/event types |
| Controller / handler | the project's request-handling layer |
| API endpoint | the project's API layer |
| Page / view (if UI) | the project's UI layer |
| Component (if UI) | the project's component layer |
| Test | the project's test layout |

### 4. Implementation order

Work inner layers first, outer layers last — do not skip steps:

1. **Persistence / schema first** (if data changes needed)
   - Update the schema where the project defines it
   - Generate any migration with the project's tooling
   - Never edit generated migration output manually

2. **Core / domain layer** (entities, value objects, errors, abstractions)
   - No imports from outer layers
   - Use the project's domain value objects/rules where applicable

3. **Orchestration / use case**
   - Inject dependencies rather than constructing them inline
   - Idempotency if it can be called multiple times
   - Explicit error handling — throw typed domain errors

4. **External-system adapters**
   - Implement the project's abstractions/ports
   - Never let external errors reach the core unwrapped

5. **Controller / API endpoint**
   - Catch domain errors → appropriate response codes
   - For inbound webhooks: verify signature, enqueue, return fast

6. **UI** (if needed)
   - Follow the project's design-system, i18n, and accessibility docs
   - No hardcoded UI strings

7. **Tests**
   - Lightweight mocks implementing the project's interfaces
   - Test the orchestration, not the adapter

### 5. Write checklist on completion

Create `docs/features/{name}/CHECKLIST.md`:

```markdown
# {Feature name} — Implementation checklist

## Completed
- [ ] Schema migration generated and applied locally (if applicable)
- [ ] Core/domain layer: no outer-layer imports
- [ ] Orchestration: idempotent, typed errors
- [ ] Adapters implement the project's abstractions
- [ ] Tests pass
- [ ] Type-check / lint passes
- [ ] UI strings in i18n dictionaries (if UI)
- [ ] Domain value-object rules respected
- [ ] User-facing limitations disclosed if user-facing

## Notes
{Any decisions made during implementation not covered by SPEC.md}
```

## Hard constraints (never violate)

- Respect the project's dependency direction — inner layers never import outer ones
- Read config/secrets the way the project's runtime mandates, never inline
- No blocking external API calls in the request path — enqueue
- Follow the project's domain value-object rules (e.g. precise numeric handling)
- Install new dependencies pinned, per the project's convention