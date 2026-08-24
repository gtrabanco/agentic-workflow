# decisions — 26-staged-verification-contracts

## Decisions

- **D1 — Freshness/incomplete reason codes (closed set):** `stale-plan |
  stale-candidate-snapshot | stale-acceptance-fingerprint |
  incomplete-missing-results | incomplete-unjustified-skip |
  incomplete-stage-coverage`. Maps 1:1 to the issue's stale dimensions (plan,
  candidate, acceptance digest) and incompleteness clauses (missing results,
  skipped without reason, requested-full coverage gap). Fresh →
  `{fresh: true}`. Locked by tests.
- **D2 — Verdict precedence:** `incomplete > fail > pass`. `fail` ⟺ any
  result status ∈ `{failed, timed-out, infrastructure-error}` (distinct
  statuses, all prevent `pass`). `incomplete` ⟺ a fast-stage receipt missing
  a fast result row, a full-stage receipt not covering every declared
  command, or any skipped row without a reason. Stored verdict must equal
  the derived verdict or the receipt is invalid.
- **D3 — Skip-reason semantics:** null on non-skipped rows (schema rule);
  skipped rows may carry null (→ `incomplete`) or a non-empty ≤ 1024-char
  string that MUST equal the id of an earlier non-passed command whose plan
  entry declares `stopOnFailure: true` (machine-checked fail-fast
  attribution).
- **D4 — Exit/signal matrix:** `passed|failed` → exactly one of
  exitCode/signal; `timed-out` → exitCode null, signal nullable;
  `infrastructure-error` and `skipped` → both null.
- **D5 — Evidence references:** `{ref ≤ 1024 chars, bytes ≥ 0, sha256
  64-hex}` per stream, nullable; output contents never carried.
- **D6 — Canonical form:** mirrors the existing canonical core (UTF-8 JSON,
  sorted keys, compact separators, nulls preserved, arrays in declared
  order); lowercase-hex SHA-256 digests; published vectors exported as
  `VERIFICATION_CANONICAL_VECTORS` (the frozen `CANONICAL_VECTORS` array
  from #138 stays untouched).
- **D7 — Stage-coverage rules (schema level):** result ids exist in the
  plan, no duplicates, declared order, fast receipts limited to fast
  commands; missing rows are representable → verdict `incomplete`, never a
  schema error.
- **D8 — Minimal receipt surface:** no receipt identity field in v1 (the
  issue's closed enumeration is the contract); consumers identify receipts
  by digest.
- **D9 — Vacuous fast stage:** a plan with an empty fast set yields a valid
  fast receipt with zero results and verdict `pass`; the delivery gate
  requires `full`, so the vacuous pass cannot reach delivery verification.
  Pinned by a test.
- **D10 — Sizing:** M, five single-layer phases, no split trigger fired.
- **D11 — Traceability:** PR carries `Closes #139`.

## Open questions

none — all residual mechanical gaps are resolved above; changing any
decision later is a reviewed, versioned package change (v1 contracts are
frozen).
