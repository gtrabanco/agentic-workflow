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

### P11 — Bound verification payloads (2026-08-27)

- **Failure evidence moves from prose to codes, and keeps the field.** F71 asked
  for bounded, redacted diagnostics "while preserving stable field evidence". A
  rejection is now `{ ok: false, diagnostics, truncated }` with rows
  `{ code, path }`: the code comes from a closed published vocabulary, the path is
  an RFC 6901 pointer into the payload, so the field that failed is still exactly
  identifiable (`/commands/3/id`) without shipping a human sentence that could
  echo a submitted value. Messages were deleted, not translated.
- **An undeclared key is data, so it cannot appear in a path.** The obvious
  implementation pointed `unknown-field` at `/<submitted key>`, which leaks exactly
  what D16 refuses to return (a probe named `__proto__`, a secret-bearing key, a
  4 KiB junk key name). `unknown-field` rows now name the **container** (`""` for
  the payload root, `/commands/0` for a bad command field), which keeps the
  evidence actionable and the value redacted. Five assertions moved to
  `assertDiagnosticAt` to pin that pointer instead of a key name.
- **The budget is measured before the document is read.** P11's fourth task is an
  ordering requirement: an oversized payload must be refused by the budget alone,
  not after the structural pass spent the 50-row ceiling disliking it field by
  field. `canonicalBudgetRefusal` therefore runs on the **submitted** value using
  the same canonical serializer the canonicalizers use. That is exact rather than
  approximate: the only thing a raw object can carry that a normalized DTO drops is
  undeclared keys, and the structural pass rejects those — so for every document
  that could be accepted, the two measurements are byte-identical. The cost of the
  ordering is that the budget outranks every other rule, which the ranking test
  asserts as a feature (129 wide commands → one root row, not 129 rows).
- **A ceiling that cannot bind is disclosed, not hidden.** AC10 names a 512 KiB
  canonical receipt budget. Measured against the other D14 ceilings, a
  maximum-capacity shape-legal receipt is 440,331 bytes, so the receipt budget can
  never be the first rule to fire on a payload that respects the cardinality and
  length ceilings. The rule is kept (it is the published contract, and it is the
  only thing standing between a future ceiling raise and an unbounded document) and
  the invariant is pinned by a test, so the review can see it is defensive rather
  than dead.
- **`invalid-evidence` got a real owner; `budget-exceeded` waits for P12.** P8
  established that a published code with no emitter is a finding. Two of the 16
  codes were silent. `invalid-evidence` now answers the D5 *content* rules through
  a new per-field `violationCode` (NUL in an evidence `ref`, a non-64-hex
  `sha256`), while capacity ceilings keep `limit-exceeded` and type errors keep
  `invalid-type` — specializing value rules only, so P10's uniform ceiling
  semantics are untouched. `budget-exceeded` belongs to the fast/full aggregate and
  timeout rules P12 owns; a new test asserts the *only* silent code is
  `budget-exceeded`, so no other code can go dangling again.
- **One shared fixture owns diagnostic assertions.** 68 assertion sites across the
  seven pre-existing feature-26 suites previously matched prose substrings. They now
  call `assertDiagnosticOn` / `assertDiagnosticAt` / `assertOnlyDiagnostic` /
  `assertRedacted` in `test/fixtures/verification-diagnostics.mjs`, which also
  enforces the pointer grammar and the frozen-row shape on every failure the suites
  produce. Rewriting prose into 68 hand-edited expectations would have been the
  DRY violation; the helper is the single place that knows what a row must look
  like.
- **Projections disclose what Draft-07 cannot say.** The regenerated
  `$comment` carries three generated clauses — payload budget, diagnostic ceiling,
  values-never-returned — rendered from `VERIFICATION_LIMITS`, so a ceiling change
  changes the disclosure automatically instead of leaving a stale sentence.
- **Ledger untouched:** F71 and F77 keep `folded: no`; P15 finalizes the ledger.

### P12 — Bound verification time (2026-08-27)

- **Time bounds join the same single declaration.** The four D14 millisecond
  ceilings (`fastCommandTimeoutMs`, `fastStageTimeoutMs`, `fullCommandTimeoutMs`,
  `fullStageTimeoutMs`) live in `VERIFICATION_LIMITS` beside the shape and payload
  fields, so the validator, the projection, the benchmark and P14's docs all quote
  one number. The per-command ceiling is expressed as a field `maximum` (the
  stage-independent 60 min) plus a `maximum-when` cross rule that tightens it to
  10 min when `stage == "fast"` — the same two-layer shape the projection uses, so
  neither authority can drift from the other.
- **A conditional ceiling is expressible, so it must be projected.** AC10 asks for
  identical enforcement "where Draft-07 can express" the rule. Projecting only the
  60 min maximum would let the shipped schema accept an 11-minute fast command the
  authoritative validator rejects — the P10 `args.maxItems` divergence in a new
  form. `maximum-when` therefore renders as an `allOf` fragment
  (`if stage=fast → timeoutMs ≤ 600000`), and the parity test walks all eight
  boundary payloads through Ajv and the validator side by side.
- **Sums are disclosed, not faked.** No Draft-07 keyword counts a list, so the two
  aggregate stage budgets join `unique-command-ids` in the generated
  `runtime-only rules:` disclosure. That list is derived from
  `rule.projectable === false`, so declaring a rule non-projectable is the only
  place the decision is written.
- **An aggregate violation reports a member.** A sum has no single owner, but
  "the plan is over budget" is not actionable. The rule walks the stage in declared
  order and names the **first command that crosses** (`/commands/2/timeoutMs`),
  which is deterministic, cheap, and points at the edit a human would make.
- **Rules answer independently, so one payload can produce two kinds of row.** A
  plan with two over-ceiling fast commands also breaks the stage budget and gets
  three diagnostics. Suppressing the budget row behind the ceiling row would make
  the diagnostic set depend on rule order; the 50-row ceiling is the real bound.
- **The budgets reshaped the capacity fixtures, and that is worth watching.** With
  a 15-minute fast stage budget, a 128-command plan cannot declare 30 seconds per
  command. Three accepted-payload fixtures from P10/P11/core now size their
  fixture timeout at `floor(fastStageTimeoutMs / commands)` = 7031 ms. The asserted
  ceilings are untouched — this is fixture validity, not weakened expectations —
  but it is exactly the kind of edit a reviewer should confirm, and P13's
  128-command benchmark must make the same choice deliberately.
- **`budget-exceeded` is no longer a spare.** P11 pinned "the only silent code is
  `budget-exceeded`" with P12 as its owner; now that the aggregates emit it, the
  guard tightened to **zero** silent codes, so the published vocabulary can never
  accumulate an unreachable entry again.
- **Ledger untouched:** F77 keeps `folded: no`; P15 finalizes the ledger.

### P13 — Build package qualification tooling (2026-08-27)

- **F70 resolved by deletion, and the asymmetry was one-sided.** `tsconfig.json`
  pinned `"types": ["node"]` and the manifest carried `@types/node`, yet the
  package compiles with zero errors without either: target `ES2022` supplies
  `TextEncoder` and `Crypto` from the default libraries, and `src/` imports no
  `node:` module. `bun.lock` never listed the package, so only the npm lock needed
  regeneration — "synchronize the locks" is therefore satisfied by an assertion that
  both locks match the manifest, not by rewriting a file that was already right.
- **A gate that can be loosened from the command line is not a gate.** The
  benchmark accepts `--commands`, `--samples` and `--warm` but **no** ceiling
  argument: 100 ms is AC10's declared number, and changing it requires a user-approved
  SPEC amendment plus a replacement manifest. The ceiling is additionally pinned by a
  test that reads the script source, so an edit that lifts it fails `npm test`.
- **The measured unit is the delivery cycle, not a micro-operation.** One sample =
  validate plan → canonicalize → digest → validate receipt against plan →
  canonicalize → digest, on a 128-command plan whose timeouts fit the P12 stage
  budgets. Measuring only `validateVerificationPlanV1` would have satisfied the
  words of AC10 while the real gate work (digests are `await`ed per payload) stayed
  unmeasured.
- **Pack asserts from two directions.** `check:verification-package` re-reads the
  manifest and the `npm pack --dry-run --json` file list: every `exports` target must
  be shipped, both projections must be in `files` **and** `exports`, and no
  `src`/`test`/`scripts` path may leak. The first run failed on the checker's own
  lookup (`exports` keys carry a `./` prefix, the projection list did not), which is
  the value of having the checker exist in the gate rather than as a manual step.
- **Registration order for the docs suite.** P13 registers `test:verification-docs`
  and seeds it with the facts that must hold whatever the prose says; P14 writes the
  content assertions red-first. The temptation to assert `VERIFICATION_LIMITS`
  coverage now was resisted deliberately — neither README mentions it today, so that
  assertion belongs to P14's evidence, not P13's.
- **Build-then-check is part of the command.** The generator renders from `dist/`,
  so `check:verification-schemas` begins with `tsc`; a test asserts the order so the
  trap P10 recorded cannot return through a renamed script.
- **Ledger untouched:** F70's `folded: no` row and F77 stay for P15 to finalize.

### P14 — Document the verification contract (2026-08-27)

- **Documentation is asserted by running it, not by reading it.** The docs suite
  extracts the feature-26 example from both references, typechecks it against the
  **published types**, and executes it. That single decision is what makes AC6's
  "coherent examples" claim falsifiable: the retired `validateVerificationReceiptV1`
  import and the `pv.errors.join(…)` reads were compile errors, and the
  timestamp/timeout incoherence becomes a thrown `Error` in the example itself, so
  the documented chain has to reach `Delivery verified` for the phase to be green.
- **Scope of the compile-and-run proof is the feature's own example.** The older
  snippets in both READMEs use undeclared placeholders (`snapshot`, `headSha`,
  `invokeAgent`) because they were written as illustrations of a call shape, not as
  runnable programs. Making them self-contained is the review proposal already
  recorded below and routed to the user; pretending to compile them here would have
  either hidden that debt behind skipped blocks or dragged unrelated docs into this
  unit. The scoping is stated in the test, not assumed.
- **The F70 decision reaches the docs.** Removing `@types/node` means a documented
  snippet may not import a `node:` specifier — the first version of the corrected
  example imported `node:assert` for its coherence check and failed its own
  typecheck. The example now throws a plain `Error`, which is also better for a
  reader who copies it into any runtime.
- **Prose assertions match claims, not formatting.** Two rounds of red came from
  markdown line wrapping (`no` + newline + `autoritativas`, "not part" + newline +
  "of"). The AC6/D15/D16 assertions use whitespace windows rather than single
  spaces, so a reflowed sentence stays green while a missing claim cannot pass —
  which is the difference between a documentation test and a line-length test.
- **Spanish parity is asserted on code and structure, and prose is translated into
  the terminology the reference already uses.** `the English and Spanish examples are
  the same code` compares the two examples after comment stripping, and the limits
  table is checked key-by-key against `VERIFICATION_LIMITS`. The ES section keeps
  "gate de entrega", "frescura" and "canonicaliza" — the existing Spanish README's
  vocabulary — instead of introducing a second dialect for the same concept.
- **Both validator lists had to change.** The "Validate or use another language"
  sections named three public validators. Leaving them there while the new authority
  section named two more would have made the reference contradict itself in the same
  file, so they now state that staged verification adds exactly
  `validateVerificationPlanV1` and `validateVerificationReceiptAgainstPlan`.
- **D15 boundary documented without an issue.** Both references say an AWL
  dialect/runner/adapter is not part of the package and that no issue tracks it;
  the trigger for opening that work stays in the review-proposal list below.
- **Ledger untouched:** F68 keeps `folded: no` for P15; no ledger row was edited here.

## Open questions

none — D12/D13 and D14 were explicitly resolved by the user on 2026-08-26.

## Review proposals

Non-blocking and independent; no issue created — only the user routes these:

- **Pre-existing README.ts blocks do not compile standalone** — blocks outside
  feature 26 reference undeclared placeholders. Trigger: the next change to
  those blocks adds declarations so every snippet compiles verbatim.
- **`canonicalJSONValue` throws on `BigInt` (relocated F62b, 2026-08-27)** — the
  shared canonical core stringifies with `JSON.stringify`, so a `BigInt` value
  reaching it directly raises a `TypeError`. No public path can deliver one today:
  every `canonicalize*`/`digest*` call that the verification and snapshot entries
  expose runs on a normalized DTO whose integer rules already rejected `BigInt`,
  and the D14 budget pre-check swallows serialization failures. Trigger: a
  third-party caller uses a `canonicalize*` export on a hand-built object and the
  throw becomes observable, or the package publishes a canonicalizer that accepts
  unvalidated input — then make the core total (serialize `BigInt` as a decimal
  string or reject it with a diagnostic) instead of crashing.
  **Superseded by the relocated F80 fold below:** after the immediate fix at
  9ef8c5d the core refuses these leaves with a named TypeError by design.
- **`canonicalJSONValue` total-leaf guard (relocated F80, immediate fix at
  9ef8c5d)** — five-axis review residual: the shared canonical core declared
  `-> string` but returned `undefined` for function/symbol leaves, emitted bare
  `undefined` fragments inside otherwise-canonical JSON for nested leaves, and
  threw a bare TypeError on bigint; both public validators guarded it through
  the `canonicalBudgetRefusal` try/catch, so the visible risk was direct
  unvalidated use of the exported `canonicalize*` helpers. Triage measurement
  proved it was a live collision class in the byte-level digest authority, not
  a dormant residual: `digest([]) === digest([fn])` returned identical digests
  and `["run", fn]` emitted the unparseable string `["run",]`. Fix: a named
  TypeError for function/symbol/bigint/non-finite leaves, pinned by 7 red-first
  tests; the guard is reachable only inside a projected field, because both
  legacy canonicalizers project a fixed key set. Trigger for more work: a
  consumer needs serializable totality (e.g. bigint decimal encoding) instead
  of refusal.
  **Scoped by F100 / P19 (2026-08-27):** the guard above is the *verification*
  canonicalizers' contract (`canonicalize/digestVerificationPlan`,
  `canonicalize/digestVerificationReceipt`, and the `canonicalBudgetRefusal`
  byte measure both public entries share). F100 showed the same edit had also
  reached the pre-feature-26 exports — `canonicalizeCandidateSnapshot`,
  `canonicalizeReviewReceipt`, `computeAcceptanceFingerprint` and the
  `digestCandidateSnapshot`/`digestReviewReceipt` pair — which is an observable
  behaviour change on shipped functions that AC8 forbids and the 3.4.0 "additive
  release" record denies. `canonicalJSONValue` now serves one serializer over two
  named leaf domains (`CanonicalLeafDomain`): `verification` refuses by name,
  `legacy` keeps the 3.3.0 `JSON.stringify` fallback byte-for-byte, pinned by
  golden vectors captured from the merge-base build
  (`test/fixtures/canonical-legacy-vectors.mjs`, regenerated by
  `scripts/capture-legacy-vectors.mjs`). **The accepted cost, stated here rather
  than discovered later:** the collision class above still exists on the legacy
  path — `digestReviewReceipt({diagnostics: []})` equals
  `digestReviewReceipt({diagnostics: [fn]})` in 3.3.0, so it does now, and
  `LEGACY_CANONICAL_COLLISION` plus a red-first case pin it so no future change
  can claim it was ever fixed there. Removing it means a major-version decision
  that breaks published digests, not a fold; the trigger is a consumer that needs
  legacy digests to be collision-free, which is a 4.0.0 conversation about
  re-binding every recorded receipt.
- **ajv devDependency caret range (relocated F81, watched debt)** —
  `ajv: "^8.20.0"` coexists with the exact `typescript: "6"` pin; the package
  has zero production dependencies and `bun.lock` pins resolution, so the
  exposure is dev-tooling reproducibility only. Re-trigger: ajv is promoted
  into `dependencies`, or the lockfile pin is dropped.
- **Shared `TextEncoder` on the UTF-8 hot path (relocated F82, resolved at
  9ef8c5d)** — `utf8Bytes` allocated a `TextEncoder` per call although a
  module-scope `_utf8Encoder` existed. Now `utf8Bytes` and `sha256Hex` share
  the single module-level encoder; bench p95 after the change: 14.87 ms against
  the 100 ms D14 ceiling. Re-trigger moot (item closed).
- **Hot-path set/array allocations (relocated F83, resolved at 9ef8c5d)** —
  `deriveVerdictUnchecked` rebuilt a duplicate `requiredSet` beside the
  already-materialized `required` array and evaluated a per-result status array
  literal inside the loop; `rejectUnexpectedKeys` constructed a `new Set(keys)`
  per call for fixed vocabularies. Fold: one required-id set per derivation;
  memoized vocabulary sets (bounded by the static literal vocabularies);
  pattern validation through a bounded `compiledPattern()` memo covering
  `verification-contract.ts:764-769` and `:1077`. Re-trigger moot (item closed).
- **AWL adoption/dialect work** — trigger: AWL upgrades to schema package 3.4.0
  and needs real plan/receipt emission or a runtime-specific dialect/runner.

- **2026-08-27 corrective replan (user-ordered): phases P16–P21 appended; the F80 guard is scoped to the verification canonicalizers.** After two review rounds left F97/F99/F100/F106 open (replan-in-unit) and F107–F110 fold-directly, the user ordered a replan instead of another fold round. P17/P18 repair the two reproduced root causes (single-read input snapshot; bounded preflight refusal). P19 restores byte-identical 3.3.0 behavior for the legacy `canonicalize*`/`digest*` exports (golden vectors captured from merge base e84db167) and scopes the F80 named-TypeError guard to the feature-26 verification canonicalizers, making the 3.4.0 "additive release" record true without weakening any F92-era refusal. P20 recovers ledger fold provenance; P21 runs ONE `--adversarial 3` review as the bounded convergence gate. `ACCEPTANCE.md` stays untouched (blob `2e8058860b2c805cc30507053f15f91e2f273249`).


- **2026-08-27 P16: self-referential fold provenance is bound one commit later, never faked.** A
  `folded: yes` flip cannot contain the SHA of the very commit that carries it. F107 and F110 are
  therefore annotated "folded in P16" inside the P16 commit, and **P17's reconciliation note must
  replace that with the real P16 short SHA** (the same pending→SHA rule UNIT_LOOP uses for phase
  receipts). The alternative — amending a published commit to self-reference it — is forbidden, so
  the deferral is recorded here rather than silently left dangling. F98/F101–F105 cite commits that
  already exist (`e7a7f49`, `a76ad88`, `fdd2a98`), each verified by `git show --stat` to touch the
  surface its row describes before being cited.
- **2026-08-27 P16: dependency fast path is distrusted for this unit.** Recomputing receipt v1's
  fingerprint from its own declared inputs does not reproduce `0292879…` under any reading tried
  (SPEC hard-deps line alone, whole `## Dependencies` block, newline-joined with ROADMAP row 25), so
  PREFLIGHT's fail-closed rule applied: full gate pass re-run, forge traversal included, result
  written as receipt v2. Re-trigger: any future receipt whose fingerprint cannot be reproduced from
  its recorded inputs must be replaced, not skipped.

- **2026-08-27 P17: capture the submitted document once; the capture never decides.** Both public
  entries and the canonical/digest helpers now run every pass — byte budget, structural walk,
  cross-rules, DTO construction — against one frozen own-property snapshot taken at entry
  (`captureVerificationInput`, `src/verification-contract.ts`). Deliberate shape of the snapshot:
  it copies, it does not police. A non-plain object is carried **by reference** and an unsupported
  leaf (function, symbol, bigint, `undefined`, non-finite number) is carried **as submitted**, so
  the codes a refusal reports stay exactly where the structural walk put them (AC1's
  prototype-pollution and F91's unsupported-leaf tests are unchanged). The capture's only own
  verdict is `invalid-type` at the frame that owns a throwing accessor, which is F92's rule.
- **2026-08-27 P17: two disclosed tightenings, neither a weakened validator.** (1) A throwing
  accessor now aborts *before* structural work, so a document that also carries an independent
  violation yields one `invalid-type` row instead of two — earlier refusal, same redacted shape.
  (2) A **non-enumerable own** declared key is no longer observable (the snapshot copies own
  *enumerable* keys, like `Object.keys` and the canonical serializer already did); it is now
  refused as `missing-field` rather than accepted. That input cannot come from `JSON.parse`, i.e.
  outside the documented input domain of both entries. Re-trigger: any consumer that submits a
  non-enumerable own field legitimately must reopen this decision.
- **2026-08-27 P17: TASKS task 1 named two accessors the contract does not have.** The phase text
  listed `durationMs` and `evidence` as receipt fields; `RESULT_SPEC` carries `startedAt`/`endedAt`
  (duration is derived, never submitted) and `stdout`/`stderr` evidence references. The suite
  covers **every real accessor** instead — a superset of the named list (22 receipt + 11 plan
  pointers, plus the evidence sub-fields) — and a coverage case now fails the suite if the
  contract grows an accessor with no hostile-getter case. `TASKS.md` is corrected in place; the
  intent (exhaustive single-observation coverage) is unchanged and strictly better served.

- **2026-08-27 P20: fold provenance is a citation the recount can re-verify, not prose.**
  `scripts/ledger-provenance.mjs` defines the accepted shape: a `folded: yes` row is green only
  when it names a commit that (a) resolves on the branch and (b) is either the commit that flipped
  the row or a commit whose own message names the id. A file intersection alone is NOT proof — the
  ledger is full of `@3112e34` review-point markers and `persist rows F88-F96` commits that touch
  the same surfaces without folding anything. Recovery therefore ranks a commit that changes a
  surface the row cites above one that merely claims the id beside an unrelated change, and nothing
  landed after the tick can be the fold the tick attested. Where the repair and the bookkeeping are
  different commits the row names both (`· fold <fix> (ticked <tick>)`); where only the tick claims
  it, the token says `ticked`, because saying `fold` would assert more than was verified. Re-trigger:
  any proposal to let a row cite a commit it cannot tie to (a range in another row's text, a review
  SHA, a phase label) reopens this decision — the whole point of F106 is that unverified provenance
  reads exactly like verified provenance until someone walks the history.
- **2026-08-28 P21 re-qualification (`--adversarial 3`) at head `2b002601`, and the two rows it filed are the phase's own queue.** The user ordered exactly one adversarial review as this unit's convergence gate. It ran as the contract requires — three isolated finder passes on three different model families (R1 correctness/logic, R2 security/inputs, R3 SPEC-coverage), then the isolated `review-implementation` classifier and the isolated `review-debt` transform, each holding only the tables. R1 returned an empty table; R2 returned two rows about `executable`/`args` carrying no content constraint beyond NUL-free + length while the field description says "Never a shell string"; R3 returned the roadmap row and F113. The classifier routed both R2 rows to `ignore` and neither is debt: the package validates data and never executes it, that boundary is stated in both references (`README.md:321` / `README.es.md:335` — "it does not execute commands. The caller owns execution") and shelled out of the SPEC as a non-goal, so the description is a usage warning, not a promised security control. **What was genuinely decided is what the review must not be told.** The only two `fix-now` rows were "row 26 is not `done`" and "F113 is open" — the phase's own remaining checkboxes. Folding them means committing the close-out, and committing the close-out moves HEAD off the head the review certified, so a second pass at the new head is what satisfies P21's Done-when. This is not a weakened review: the reviewer's verdict on the candidate's substance (code, contracts, docs, acceptance) was clean, and the re-review exists to confirm that the fold moved nothing but state. Re-trigger: any proposal to treat a review of head *N* as certification of head *N+k* on the grounds that "only docs moved" reopens this decision — that is the exact inference F113 was filed against.
- **2026-08-28 the review ran in a shared checkout under a no-build rule, and that rule is the reason its `verify` axis is narrower than it should have been.** Three reviewers executing concurrently in one working tree cannot each run `npm test`/`tsc`: the builds rewrite `dist/` and the generated projections, so a reviewer would have been reading a tree another reviewer had half-rebuilt, and a finding against that tree describes no commit. They were therefore limited to read-only commands plus at most one targeted `node --test` file, and the executed proof stayed with the executor's gate receipt in `progress.md`. The right correction is not to lift the rule but to give reviewers an isolated checkout (a worktree or a clone per pass) when a review needs to run the suite — otherwise `review-verify` is silently downgraded to `review-read` in exactly the place it matters most. Re-trigger: any adversarial round that asks reviewers to run the project gate in a shared tree, or any proposal to call a no-build review a full `review-verify` pass, reopens this decision.
- **2026-08-28 roadmap row 26 reads `done · [#145]` again, and `done` is the legend's PR-open state, not a merge claim.** The replan flipped row 26 to `in-progress` because F109 showed a `done` row reading merged-stable while four fix-now rows were open on the same unit. Those rows are now folded, the gate and the AC1–AC10 receipt are re-verified against the frozen blob, and #145 is open, which is precisely the state the state machine calls `done` ("PR-open step: row → done; merge state in the forge"). The merge gate stays where the legend puts it — `audit-pr`, downstream of a current exact-HEAD `review-change:pass`. Re-trigger: any `done` row whose unit still carries an open fix-now ledger row, or whose PR is closed unmerged, reopens this decision.
