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

## Execution records

### P7 — Unify validation authority (2026-08-26)

- **Canonical definition location:** `src/verification-contract.ts` holds the
  one structural contract (closed field lists, vocabularies, bounds, patterns,
  cross-field rules) plus the `validateStructure` engine. It compiles to
  `dist/verification-contract.js`, which the published `exports` map does not
  expose, so the definition stays package-internal while both consumers — the
  runtime validators and `scripts/generate-verification-schemas.mjs` — read the
  same bytes (F76).
- **Ownership, not duplication:** the public `VERIFICATION_*` contract ids,
  stage/cost-class/status/verdict vocabularies are now re-exported from that
  definition instead of being declared twice (F64/F69). A test asserts the
  public `VERIFICATION_*` surface is exactly the planned eight names.
- **Normalized DTO shape:** a successful validation returns a fresh plain
  object of declared own properties and deliberately does **not** freeze it —
  freezing is specified for the published vectors and vocabularies, not for
  consumer data. Non-plain prototypes (class instances, `Object.create(...)`)
  and own `__proto__` keys are rejected rather than silently trusted.
- **Diagnostics deferred on purpose:** the failure branch still carries
  `errors: string[]`. D16's bounded `{code, path}` diagnostics are P11 work;
  landing them here would bundle two phases' contract changes (F71).
- **Projection metadata carrier:** `$comment` plus `description`. Ajv
  `strict: true` — which the shipped parity fixtures compile with — rejects
  unknown `x-*` keywords, and the alternative (`ignoreKeywords` /
  `strictSchema: "log"`) would have loosened a test validator. `$comment` is a
  Draft-07 annotation, so the non-authoritative declaration, the named
  authority and the runtime-only rule list survive strict mode with no
  weakened check.
- **Projections are stronger than the files they replace:** the generated
  output keeps every previously expressible rule and adds the D3-side
  "non-skipped rows carry skipReason null" rule the hand-written file omitted.
  A 65-fixture old-vs-new comparison across both files showed exactly that one
  difference, in the direction of agreement with the authoritative validator.
- **Test re-entry (not test weakening):** with the standalone structural
  receipt validator retired, `test/verification-receipt.test.mjs` runs every
  fixture through `validateVerificationReceiptAgainstPlan`. Inputs, expectations
  and assertion text are unchanged; five accept-cases were re-bound to a
  two-command fail-fast plan (or had their stored verdict set to the D2-derived
  value) because a receipt that disagrees with its bound plan is invalid by
  contract. Two retired-constant export tests were replaced by equal-strength
  assertions over the canonical definition, and the frozen-vocabulary check now
  scans the whole exported namespace instead of a fixed list.
- **Ledger untouched:** F63–F77 keep `folded: no`; P15 finalizes the fix-now
  ledger. `testing.md` and `known-issues.md` needed no change (the test plan
  already describes this layer; no new independent item was found).
- **Plan conflict recorded:** P14 gains one task — repoint the bilingual README
  examples at the two public entries. `README.md:258,300` and
  `README.es.md:267,309` still import the retired validator; docs are P14's
  layer, so P7 did not edit them.

### P8 — Repair freshness classification (2026-08-26)

- **F63 root cause, stated precisely:** the predicate scanned the required set of
  the *requested* stage and returned `incomplete-missing-results` from it, so a
  full receipt with a coverage gap answered `missing-results` and
  `incomplete-stage-coverage` had no input left that could produce it — AC4's
  "every stable code on a reachable, disjoint condition" was unmet. The F62 fold
  had widened `missing-results` to any stage without re-partitioning,
  re-introducing the same unreachability (recorded in the P6 gotcha).
- **Resolution (SPEC-frozen, no new contract):** partition the incomplete block by
  **the stage of the missing command**. `incomplete-missing-results` answers a
  missing FAST-stage row for either requested stage — which preserves F62's
  clause that missing results are not restricted to fast receipts — and
  `incomplete-stage-coverage` answers a missing FULL-stage row, reachable only
  when `stageRequested: "full"` because a fast receipt legitimately owes no
  full-stage rows (D7). Both codes are reachable; the requested stage never
  switches off the missing-results condition.
- **Malformed inputs → `stale-plan`, not an incompleteness:** the plan binding is
  the first precedence point, and a payload that fails its own contract cannot
  establish it. Returning `incomplete-missing-results` there claimed a verified
  binding and gave that code a second, unrelated trigger. The no-throw guarantee
  from F33/F40 is unchanged and still pinned.
- **Test correction, not test weakening (project rule "never change a test to
  pass it"):** three assertions in the pre-existing suites
  (`verification-core.test.mjs`: full receipt missing a full-stage command, and
  the combined coverage-gap + unjustified-skip precedence case;
  `verification-scenarios.test.mjs`: requested-full coverage gap) encoded the
  F63 defect and contradicted the frozen manifest and `decisions.md` D1, which
  already stated the two conditions are disjoint. They now assert the SPEC codes
  with identical strength (`deepStrictEqual` on the whole result object, one
  exact code each) and the phase adds 15 independent matrix cases; nothing was
  deleted, skipped, or loosened. The precedence case now proves the F42 question
  directly: skip-before-coverage ordering under a simultaneous coverage gap.
- **Ledger untouched:** F63–F77 keep `folded: no`; P15 finalizes the fix-now
  ledger. `known-issues.md` needed no change (no new independent item surfaced);
  `testing.md` gains only the pointer to the new freshness matrix file.
- **Gates:** `npm test` 365/365 (was 350) and
  `node scripts/generate-verification-schemas.mjs --check` drift-free — the
  canonical definition was not touched, so no projection regeneration needed.

### P9 — Repair verification semantics (2026-08-26)

- **F65 — what "complete sequencing" means here:** the SPEC names the rule twice
  (S4: `stopOnFailure: true` marks later commands `skipped` with the failed
  command id; Design: "complete `stopOnFailure` sequencing and attribution") and
  AC2 lists "invalid fail-fast sequencing" as a rejection class. Before this
  phase the validator only checked rows that *already* carried a reason, so a
  receipt could show the run continuing past a stop (`passed`/`failed`/`timed-out`
  rows after the trigger) and a skip could be attributed to a command that never
  executed. The trigger is now defined as the earliest non-passed row of a
  `stopOnFailure` command, and everything after it must be `skipped` with that id.
- **Deliberate boundary — do not tighten further:** two degraded cases stay
  *valid* by contract, because the schema layer must not erase representable
  incompleteness. (a) `skipped` with `skipReason: null` after the trigger → D3
  says null is legal and yields verdict `incomplete`, which is AC3's
  `skipped-without-reason` scenario. (b) A later declared command with **no** row
  → D7 says missing rows are not schema errors. Both are pinned by acceptance
  tests so a later phase cannot silently invalidate them.
- **F66 was a coverage defect, not a behaviour defect:** the test named
  `rejects full-command result in fast-stage receipt` submitted only the fast row
  and asserted `ok: true`, so the D7 fast-stage subset rule had zero rejection
  coverage while the accepted case was mislabelled as a rejection test. The
  rejection fixture now carries the full-stage `build` row and a companion test
  keeps the acceptance case — coverage strictly increased.
- **F67 without touching a pre-existing export:** AC8 freezes
  `CanonicalVectorV1` (feature 25), so readonly-ness is applied at the
  feature-26 declaration (`ReadonlyArray<Readonly<CanonicalVectorV1>>`) instead of
  by editing the shared interface. `test/fixtures/` is inside
  `tsconfig.test.json`'s include set, so the `@ts-expect-error` directives are
  enforced by `npm test` itself: while the properties were mutable the build
  failed with three TS2578 "unused directive" errors (red-first, no new runner).
- **F72 / AC5 evidence moved off self-derivation:** the vector payloads are now
  one shared fixture module consumed by the digest, AJV-parity and
  authoritative-entry tests; expected digests are still computed independently
  through `node:crypto`, so sharing the payload does not make the digest claim
  circular.
- **Gates:** `npm test` 380/380 (was 365); projection check drift-free —
  sequencing is semantic and not expressible in Draft-07, so no regeneration was
  owed.

### P10 — Bound verification shapes (2026-08-26)

- **One number, read everywhere:** the D14 shape ceilings are declared once as
  `VERIFICATION_LIMITS` inside the canonical definition and consumed by the field
  specs, so a validator message, a projection and a boundary test can never quote
  three different limits. The object is also the public metadata surface AC10
  needs; P11 extends it with the payload fields and P12 with the timeout fields.
- **A real divergence was found while wiring the ceilings:** the generator projected
  `args.maxItems`, but the `stringArray` branch of `validateStructure` never
  checked it — the authoritative validator accepted 65 arguments that the shipped
  projection rejected. AC10 requires identical enforcement wherever Draft-07 can
  express the rule, so the branch now performs the cardinality check before
  iterating items (same early-`break` shape as the object-array branch).
- **Ceiling tightening is authorized, not improvised:** ids move from the F50
  hardening's 1024-char class to D14's 128. That is the user-approved bounded
  usability decision (ACCEPTANCE v2 AC10), so the pre-existing
  `rejects command id longer than 1024 chars (F50)` case was retargeted to the
  128/129 boundary — the assertion still demands rejection, now at the approved
  ceiling, and the 128-char accepted case was added.
- **Nullable projection shape is part of the contract:** `workingDirectory` bounds
  live on the non-null branch of its `oneOf`, which is why the boundary parity test
  resolves the branch instead of reading the property root.
- **Tool ordering for P13:** the generator renders from `dist/`, so a definition
  edit without a rebuild makes `--check` green against a stale render. The
  registered `check:verification-schemas` command must build first.
- **Ledger untouched:** F77 keeps `folded: no`; P15 finalizes the ledger.

## Open questions

none — D12/D13 and D14 were explicitly resolved by the user on 2026-08-26.

## Review proposals

Non-blocking and independent; no issue created — only the user routes these:

- **Pre-existing README.ts blocks do not compile standalone** — blocks outside
  feature 26 reference undeclared placeholders. Trigger: the next change to
  those blocks adds declarations so every snippet compiles verbatim.
- **AWL adoption/dialect work** — trigger: AWL upgrades to schema package 3.4.0
  and needs real plan/receipt emission or a runtime-specific dialect/runner.
