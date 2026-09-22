---
type: feature
scope: medium
---

# 93-core-feature — Add user authentication with JWT

## Objective

Implement JWT-based authentication for the API, replacing session-based auth.

## Why

Session storage doesn't scale across multiple instances in the cluster.

## User outcome

Users can log in with email/password and receive a JWT valid for 24 hours.

## Acceptance criteria

1. POST /auth/login returns a valid JWT when credentials match.
2. GET /protected requires a valid JWT in the Authorization header.
3. Expired JWTs are rejected with a 401 response.
4. The JWT payload contains `sub` (user id), `iat`, and `exp`.

## Non-goals

No OAuth providers. No refresh token rotation.

## Future cost

Must audit all route handlers for JWT validation.

## Applicable tests

unit: test auth login flow
integration: test protected route access
security: test JWT expiration

## Known pre-existing issues

none

## Tasks

P1 — Implement the JWT signing middleware.
P2 — Create the login endpoint.
P3 — Add route guards for protected endpoints.
P4 — Write unit tests for the auth module.
P5 — Integration test: end-to-end login → protected request.

## Evidence

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|

## Progress log

## Next

Start with the JWT signing middleware.

## References

issue: 101