# Provider: <name>

> Stub. Copy to `docs/providers/<provider>.md` and fill in. One file per external
> provider/integration (payment, auth, email, third-party API, …).

## What it is

What this provider does for the project and which use-cases depend on it.

## Integration

- **Auth:** how credentials/keys are obtained and stored (never commit them).
- **Endpoints / SDK:** the surface actually used.
- **Environments:** sandbox vs production differences.

## Limits & quotas

Rate limits, payload sizes, pagination, timeouts.

## Gotchas

Non-obvious behavior, eventual consistency, idempotency requirements, webhook
semantics, known failure modes and how to detect them.

## Failure handling

What the project does when this provider is slow, errors, or is unavailable.
