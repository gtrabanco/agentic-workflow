# 20 — relay-unit

## Tasks

- P1 — first phase (validator: `node --test scripts/toy.test.mjs` exits 0)
  - Relevant files: src/toy.txt
- P2 — second phase (validator: `node --test scripts/toy.test.mjs` exits 0)
  - Relevant files: src/toy.txt

## Log

- **L1** — 2026-11-05, the request, verbatim:
  ```
  Run this unit.
  ```
- **E1** — 2026-11-05, `node --test scripts/toy.test.mjs` · exit 0 · toy suite green.
- **P1** — 2026-11-05 10:00, first phase implemented · 0123456789abcdef0123456789abcdef01234567.
