# decisions — 26-staged-verification-contracts

## Decisions

- **D1 — Freshness/incomplete reason codes:** `stale-plan |
  stale-candidate-snapshot | stale-acceptance-fingerprint |
  incomplete-missing-results | incomplete-unjustified-skip |
  incomplete-stage-coverage`. Fast-stage missing rows and full-stage coverage
  gaps are disjoint so every code is reachable; fresh → `{fresh: true}`.
- **D2 — Verdict precedence:** `incomplete > fail > pass`. Failed, timed-out or
  infrastructure-error rows prevent pass; missing required rows or unjustified
  skips are incomplete; the stored verdict must equal the derived verdict.
- **D3 — Skip attribution:** non-skipped rows have null `skipReason`; a skipped
  row may be null (incomplete) or name an earlier non-passed command whose plan
  entry has `stopOnFailure: true`. The authoritative validator also requires
  every later executed-plan row after that stop to be a correctly attributed
  skip.
- **D4 — Exit/signal matrix:** passed/failed → exactly one of integer exit code
  or non-empty signal; timed-out → null exit code and nullable signal;
  infrastructure-error/skipped → both null.
- **D5 — Evidence references:** nullable `{ref, bytes, sha256}` per stream;
  opaque NUL-free ref ≤1024 chars, integer bytes ≥0, lowercase 64-hex digest;
  output contents never enter the receipt.
- **D6 — Canonical form:** UTF-8 JSON, sorted object keys, compact separators,
  nulls preserved, command/result array order preserved; lowercase SHA-256;
  deeply frozen readonly `VERIFICATION_CANONICAL_VECTORS`.
- **D7 — Stage coverage:** result ids exist in the plan, are unique and ordered;
  fast receipts contain only fast results; missing rows remain representable as
  incomplete. These are authoritative-validator rules, not standalone-schema
  claims.
- **D8 — Minimal receipt:** no identity field in v1; consumers identify receipts
  by digest.
- **D9 — Vacuous fast stage:** a plan with no fast commands may produce an empty
  passing fast receipt; delivery still requires a fresh full pass.
- **D10 — Sizing:** L, fifteen phases, one atomic unshipped v1 unit. P1–P6 are
  historical; P7–P15 implement the 2026-08-26 replan and end with a fresh
  close-out.
- **D11 — Traceability:** PR #145 carries `Closes #139`.
- **D12 — One validation authority:** the only public runtime validation entries
  are `validateVerificationPlanV1(value: unknown)` and
  `validateVerificationReceiptAgainstPlan(receipt: unknown, plan: unknown)`.
  Successful values are normalized own-property DTOs; the structural receipt
  helper is internal-only.
- **D13 — Generated structural projections:** both Draft-07 files are generated
  tooling projections from one internal canonical contract definition, carry
  non-authoritative metadata, and are guarded against hand-edit drift. Semantic
  PASS belongs only to D12.
- **D14 — Bounded usability:** max 128 commands/results, 64 args/command, ids
  128 chars, executable/working-directory/skip-reason/evidence-reference 1024,
  args 4096, canonical plan/receipt 256/512 KiB, diagnostics 50 stable-code +
  RFC 6901 path rows, fast command/aggregate 10/15 minutes, full command/
  aggregate full-stage 60/120 minutes, and warm 128-command validation+digest
  p95 ≤100 ms.
- **D15 — Consumer boundary:** AWL dialect/runner/adoption is separate consumer
  work only after AWL upgrades to the released package. This replan creates no
  issue automatically.
- **D16 — Closed diagnostic result:** every validation failure returns at most
  50 deterministic `{code, path}` rows plus a `truncated` flag; codes come
  from one frozen vocabulary, paths are RFC 6901 pointers over contract
  property names and indices only, and submitted values/messages are never
  echoed. The unshipped `errors: string[]` branch is replaced without a
  compatibility alias.

## Open questions

none — D12/D13 and D14 were explicitly resolved by the user on 2026-08-26.

## Review proposals

Non-blocking and independent; no issue created — only the user routes these:

- **Pre-existing README.ts blocks do not compile standalone** — blocks outside
  feature 26 reference undeclared placeholders. Trigger: the next change to
  those blocks adds declarations so every snippet compiles verbatim.
- **AWL adoption/dialect work** — trigger: AWL upgrades to schema package 3.4.0
  and needs real plan/receipt emission or a runtime-specific dialect/runner.
