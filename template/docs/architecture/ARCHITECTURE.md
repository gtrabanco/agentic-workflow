# Architecture

> Stub. Document **your** chosen architecture here. The workflow is
> architecture-agnostic — it respects whatever you write, it does not impose a
> pattern.

## Pattern

Name the pattern you use (layered, hexagonal/ports-and-adapters, clean, modular
monolith, MVC, feature-sliced, …) and why.

## Modules / layers

List the modules or layers and what each is responsible for.

| Module / layer | Responsibility | May depend on | Must NOT depend on |
|---|---|---|---|
| `<name>` | `<what it does>` | `<…>` | `<…>` |

## Dependency rules (invariants)

The rules that must never be violated. These are what the workflow's review and
planning skills check against. Be explicit, e.g.:

- `<rule, e.g. "the domain layer imports no framework/IO code">`
- `<rule, e.g. "UI never talks to the database directly">`

## Diagram

```
<optional: a simple ASCII or mermaid diagram of the dependency direction>
```
