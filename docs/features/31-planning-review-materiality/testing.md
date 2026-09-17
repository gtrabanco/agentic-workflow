# testing — 31-planning-review-materiality

## Validation ladder

| Layer | Required evidence | Command or check |
|---|---|---|
| Materiality predicate (schema runtime) | `pre-execution.ts` carries the `medium`+ membership test; a PASS with an open/unverified `low` row validates; the same PASS with an open/unverified `medium` row is refused `verdict-mismatch` | `grep -n 'severity !== "info"' packages/agentic-workflow-schema/src/pre-execution.ts` non-zero; `cd packages/agentic-workflow-schema && bun run test` → exit 0 with both readiness vectors named in the phase entry (AC1) |
| Predicate prose (schema contract) | the severity vocabulary comment and the field description state the `medium`+ line; no "only immaterial" phrasing survives | `grep -rn "the only immaterial" packages/agentic-workflow-schema/src/` non-zero; `grep -nE 'material = .medium'` and `grep -n "report-note"` on `packages/agentic-workflow-schema/src/pre-execution-contract.ts` both zero (AC2) |
| Finding reproducer (schema contract) | the optional bounded `reproducer` exists, its bound is declared on the field entry, vectors cover the bound refusal and back-compatibility, and the receipt contract id is unchanged | AC3's four anchors + the package suite exit 0 (AC3) |
| Cap refusal (decider) | two consecutive unconverged cycles refuse a third `review-spec`/`review-plan` invocation with `stop-review-loop-cap` and the human route named; a PASS reset re-allows the next cycle; `needs-design` routes to `design-feature`; the sensor derives the same count through the shared helper and projects it as `detail.review_loop_cycles` without referencing the decider | `grep -rln "review-loop-cap" packages/agentic-workflow-schema/test/` zero; `cd packages/agentic-workflow-schema && bun run test` → exit 0; `bun test scripts/workflow-status-pre-execution.test.mjs` → exit 0, with the projection and A:12 pins in the discipline suite (AC5, AC10) |
| Feature-38 sensor invariant (A:12) | `decideWorkflowAction()` stays consumer-side: the count reaches it through the envelope's `detail.review_loop_cycles`, never by a reference in the sensor | `grep -c decideWorkflowAction scripts/workflow-status.mjs` → 0; the projection and A:12 pins in the already-packed `scripts/review-loop-discipline.test.mjs` (AC10) |
| Wording-only route (snapshot CLI) | the determination parser reads the block from the unit's unbound `progress.md`; a matching determination answers fresh; material movement and a movement without the record fall through unchanged (never fresh, exit 4); no freshness code, flag or exit code moves | `bun test scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs` → exit 0 with the `wording-only` vectors (AC4) |
| Discipline pins (re-aimed) | the suite reads the schema package and the CLI report, and no existing assertion is removed | `bun test scripts/review-loop-discipline.test.mjs` → exit 0; `grep -n "packages/agentic-workflow-schema" scripts/review-loop-discipline.test.mjs` zero; the no-weakening diff walk (AC8) |
| Prose shrink (docs) | every declared removal grep is clean, the kept-side greps hit, and the `CONVERGENCE-ANOMALY` block plus receipt literals are byte-unchanged | AC7's nine removal greps (non-zero) and three kept greps (zero) + the diff-hunk walk (AC7) |
| Additive release (schema package) | the package gate passes and no enum value or contract id is removed | `cd packages/agentic-workflow-schema && bun run gate:pre-execution` → exit 0 + the vocabulary-diff walk (AC9) |
| Ledger truth classes | no new ledger row type, writer or owner: the determination block lives in the unbound `progress.md` record home (a block, not a new ledger column set) and the ownership block is untouched | `bun test scripts/ledger-ownership.test.mjs scripts/ledger-provenance.test.mjs scripts/pre-execution-quality.test.mjs` → exit 0 (AC10) |
| Normative surfaces | no declared grammar moves and no version restatement goes stale | `bun test scripts/normative-drift.test.mjs` → exit 0 (AC10) |
| Context/installability | the four bumped skills stay within their budgets after the shrink | `bun scripts/check-skill-context.mjs` → exit 0 (AC10) |
| Plan layer | the unit's canonical phase list passes all eight boxes at the PR head, with machine done-whens rather than prose recitation | `bun scripts/phase-lint.mjs docs/features/31-planning-review-materiality/PLAN.md` → exit 0, stdout pasted verbatim (AC6) |
| Pi distribution | canonical bundle parity plus package behavior, after the last skill edit and from the package that owns the bundler | `cd packages/pi-agentic-workflow && bun run bundle:skills && bun run test` → exit 0 (AC11) |
| Scope | every changed path belongs to one of AC13's three declared groups | the anchored `git diff main --name-only` listing + the per-path attribution walk (AC13) |
| Release records | one removed plus one added `version:` line per touched skill, CHANGELOG rows for the four skills and the schema package, accurate README cells, and the bibliography append | the AC14 bump-hunk count + the CHANGELOG/README walk + `grep -n "2603.00539" README.md` (AC12, AC14) |

## Mandatory scenario inventory

Scenario coverage per the SPEC's `### Dev scenarios` table; each row names the
phase and the validator that exercises it:

| Scenario | Exercised in | Validator |
|---|---|---|
| `loop:report-note-pass` — a review PASS coexists with open `low` report-note rows, with no repair batch and no re-review | P1 | the package suite's `low`-coexistence vector; live precedent: this unit's own open `info` rows in `planning-findings.md` (AC1) |
| `loop:reproducer-bound` — a `reproducer` past its declared bound is refused while an absent one still validates | P1 | `grep -A8 'key: "reproducer"' … \| grep -c "maxLength"` ≥ 1 + the bound and back-compatibility vectors (AC3) |
| `loop:deflation-guard` — a real defect mislabeled `low` re-classifies at `medium` minimum and blocks | P4 | the anti-deflation sentence in `LEDGERS.md`/both `CHECKS.md`, hit by AC7's `medium\` minimum` kept-side grep |
| `loop:role-violation` — an author turn filing findings against its own artifact, or a script writing a ledger row, stays denied | P5 | `bun test scripts/ledger-ownership.test.mjs` on the unchanged ownership block (AC10) |
| `loop:cap-hit` — two consecutive unconverged cycles make the decider refuse a third invocation with `stop-review-loop-cap` and the human route; a PASS reset re-allows the next cycle | P2 | the package suite's `review-loop-cap` vectors + the emission case in `workflow-status-pre-execution.test.mjs` and the projection/A:12 pins in the discipline suite (AC5, AC10) |
| `loop:wording-only-skip` — a recorded determination keeps `verify` current while the same movement without the record falls through | P3 | the `wording-only` vectors in both suites (AC4) |
| `loop:dup-finding` — the same finding re-reported in a later cycle keeps its stable id and gains a second resolution row | P4 | `LEDGERS.md` §3's `finding-id` stability text, outside every edited hunk (read-verified in the AC7 walk) |
| `loop:pin-vacuous` — a pin that reads a superseded prose sentence instead of the code carrier leaves the suite green | P3, then P5 at the PR head | the re-aimed pin block reading the schema predicate, the CLI report and the decider refusal (AC8) |
| outage/dependency failure — n/a: no runtime dependency exists; every validator is a local command over repository bytes | — | n/a |
| data loss / mass change — n/a: no data store is touched; the only durable writes are ledger appends and release records | — | n/a |

## Runtime convention

bun first (`bun test …`, `bun scripts/…`, `bun run <script>`); the same commands
under `node --test …` / `node scripts/…` are the guaranteed fallback (CI
node-compat job). Two commands are package-root-bound by construction — the
schema package's suite and the Pi package's bundler/parity pair — because this
repository has no root `package.json` (PE-018, PE-023). The wording-only
determination is recorded in the unit's `progress.md`, which is deliberately not
a bound artifact of either stage's snapshot (PE-026), so appending it does not
rotate the artifact revision it records.
