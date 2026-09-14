# fix/221-sensor-null-parent-receipt

> Fix specification for issue #221 — `workflow-status` falsely reports fix
> plan receipts as missing because the receipt lineage line
> `Parent SPEC snapshot: null` parses as the string `"null"`, the sensor
> spawns `verify --parent null`, and the verifier refuses. Every sensed fix
> unit with a plan receipt lands a false `plan-stage receipt is missing`
> gate blocker.

## Goal

Repair the workflow-status sensor so a fix unit whose plan receipt records
`plan-review-pass` senses as `current` instead of `missing`: the receipt
grammar legitimately records `Parent SPEC snapshot: null` for fix plans (a
fix unit binds no parent), the contract parser must return `null` for that
line, and the sensor must never bind a `--parent` for a fix unit. A false
`missing` on the merge-gate surface makes operators re-run reviews that
already passed and distrust the sensor's review/plan state on every fix
unit, so this cannot wait for a feature cycle.

## Issue

[#221](https://github.com/gtrabanco/agentic-workflow/issues/221) — tracked
issue in the project's forge. The PR closes it via `Closes #221` in the body.

## Branch

`fix/221-sensor-null-parent-receipt`

## Depends on

None. Independent — the two defect sites (`scripts/pre-execution-contract.mjs`,
`scripts/workflow-status.mjs`) are untouched by every open PR (#212 is the
phase-lint script; forge sweep 2026-09-15, PE-012).

## Root cause

The defect is a chain across three layers, only the first two of which are
defective:

1. **Parse site** — `parseReceipts` (the one parser of the receipt grammar,
   F25) captures the lineage line raw:
   `parent: fieldFrom(chunk, "Parent SPEC snapshot") ?? fieldFrom(chunk,
   "Parent")` (`scripts/pre-execution-contract.mjs:132`). `fieldFrom`
   returns the captured text, so a fix plan receipt's contract-mandated
   `Parent SPEC snapshot: null` line
   (`skills/review-plan/references/OUTPUT.md:32`: "the contract forbids a
   parent on a fix plan") parses as the truthy STRING `"null"`. The module
   already owns the canonical normalizer for recorded lines —
   `recordedValue` + `NULL_WORDS` (`scripts/pre-execution-contract.mjs:75-83`)
   — but only `timelineField` uses it; the parser's own comment even
   documents "A SPEC block writes `Parent: null`" and still returns it as a
   string.
2. **Bind site** — `senseStage` binds the lineage blindly:
   `const boundParent = parent ?? receipt.parent;
   if (stage === "plan" && boundParent) args.push("--parent", boundParent)`
   (`scripts/workflow-status.mjs:598-599`). For a fix unit the explicit
   parent is the spec sense's `observedDigest` — `null`, because fix units
   record no spec-stage receipt (review-plan is their first review; both
   live fix units' `progress.md` hold plan receipts only) — so the fallback
   fires and the sensor spawns `verify --parent null`.
3. **Backstop (correct, untouched)** — the schema validator refuses a
   non-64-hex `parentSpecSnapshotDigest`
   (`packages/agentic-workflow-schema/src/pre-execution-contract.ts:383-393`,
   `invalid-value@/parentSpecSnapshotDigest`), the verifier exits 1 with an
   empty stdout, the sensor's `JSON.parse` fails into `payload = null`, and
   the row degrades to `label: "missing"` → gate blocker. The verifier's own
   comparison path is immune — it normalizes through
   `recordedValue`/`recordedDigest` before comparing
   (`scripts/pre-execution-snapshot.mjs:377-379`) — so the authoritative
   check without `--parent` is the truth the sensor fails to reach.

## Detected in

User-filed issue #221 (2026-09-14) after fix-214's plan receipt — recorded
`plan-review-pass` — was reported missing by the sensor while its PR was
open, with fix-191 showing the same false blocker. Re-proven live on this
tree at `170b25f6` (2026-09-15): the sensor reports fix-191
(`in-progress`, plan receipt `Verdict: plan-review-pass` on file) as
`label: "missing"` / `reason: "receipt is not current"` with the gate
blocker `fix-191 plan-stage receipt is missing — /review-plan 191`, and
`verify … --parent null` exits 1 with
`snapshot refused: limit-exceeded@/parentSpecSnapshotDigest,
invalid-value@/parentSpecSnapshotDigest` (PE-001, PE-004).

## Scope

### In scope

- `scripts/pre-execution-contract.mjs:132`: normalize the parsed lineage
  through the module's own `recordedValue` —
  `parent: recordedValue(fieldFrom(chunk, "Parent SPEC snapshot") ??
  fieldFrom(chunk, "Parent"))` — so every null-word lineage line
  (`null`, `none`, `n/a`, `na`, `—`, `-`) parses as `null` and a
  `sha256:`-dressed digest parses as its bare hex. No other field changes.
- `scripts/workflow-status.mjs:598`: never bind a parent for a fix receipt —
  `const boundParent = receipt.unitKind === "fix" ? null : (parent ??
  receipt.parent);` — encoding SNAPSHOT.md's rule ("a fix check must omit
  it — the snapshot it re-derives has to be the same shape the reviewer
  bound") at the sensor, independent of what any lineage line or spec sense
  produced.
- Red-first tests: new `scripts/pre-execution-receipt-parent.test.mjs`
  (parser shapes) and one pinned end-to-end case in
  `scripts/workflow-status-sensor.test.mjs` (a current fix-unit plan receipt
  senses `current`, driven through the real verifier subprocess in a
  throwaway fixture).
- `docs/fix/README.md`: the #221 unit row.

### Out of scope

- The schema package and its validator — refusing a non-64-hex
  `parentSpecSnapshotDigest` is the correct backstop that surfaced this
  defect; untouched.
- `scripts/pre-execution-snapshot.mjs` — the verifier is not defective
  (self-normalizing comparison path, PE-006); its CLI and JSON report are
  unchanged.
- Normalizing any other `parseReceipts` field — `snapshot` must stay raw
  (the verifier's digest-match path and the JSON report echo it), and
  verdict/stage/unit comparisons normalize on their own (Decision 4).
- The sensor's label table, spawn budget, and envelope shape — unchanged.
- #205's verdict-landing routing (roadmap row 50) — a downstream consumer
  of these rows, planned separately (see Cross-issue notes).

### Planning evidence

The fix's own authority, without a Product half: reproduction, root cause with
code evidence, regression scope, rollback path, and the affected invariant or
use case — one compact row each. Never an exploration transcript.

| id | claim-or-obligation | authority-kind | source-and-location | observed-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|---|
| PE-001 | Reproduction — the sensor reports fix-191 (`in-progress`, plan receipt `Verdict: plan-review-pass` on file) as `label: "missing"` / `reason: "receipt is not current"` with gate blocker `fix-191 plan-stage receipt is missing — /review-plan 191` | repository | `docs/fix/191-handoff-review-fold-order/progress.md:4-16` (receipt lines); live `node scripts/workflow-status.mjs` run 2026-09-15 (envelope `detail.pre_execution` + `blockers`) | 170b25f6 | AC2 · O3 | current | proven | sensor run this plan |
| PE-002 | Root cause (bind site) — `senseStage` binds `parent ?? receipt.parent` and pushes `--parent` whenever truthy; for fix units the explicit parent is the spec sense's `observedDigest`, null because fix units record no spec receipt, so the string `"null"` fallback fires | repository | `scripts/workflow-status.mjs:598-599` (bind), `:1036-1037` (explicit parent = `specSense.observedDigest`), `:63` (`OPEN_STATES` senses in-progress fix rows) | 170b25f6 | AC2 · O3 | current | proven | code read |
| PE-003 | Root cause (parse site) — `parseReceipts` captures the lineage line raw; only `timelineField` normalizes through `recordedValue` in this module, so `Parent SPEC snapshot: null` parses as the string `"null"` | repository | `scripts/pre-execution-contract.mjs:132` (the capture), `:127` (comment "A SPEC block writes `Parent: null`"), `:96-107` (`timelineField` uses `recordedValue`) | 170b25f6 | AC1 · O1 | current | proven | code read |
| PE-004 | Refusal — `verify --stage plan --unit fix-191 --dir docs/fix/191-handoff-review-fold-order --parent null` exits 1 with `snapshot refused: limit-exceeded@/parentSpecSnapshotDigest, invalid-value@/parentSpecSnapshotDigest`; the schema validator correctly refuses any non-64-hex `parentSpecSnapshotDigest` | repository | `packages/agentic-workflow-schema/src/pre-execution-contract.ts:383-393` (validator row: pattern `LOWERCASE_64HEX_PATTERN`, `violationCode: "invalid-value"`); live verifier run 2026-09-15 | 170b25f6 | AC2 · O3 | current | proven | verifier run this plan |
| PE-005 | Grammar authority — a feature plan receipt records `Parent SPEC snapshot: <64-hex>`, a fix plan receipt records `- Parent SPEC snapshot: null` ("the contract forbids a parent on a fix plan"), and re-verification orders "a fix check must omit it" | document | `skills/review-plan/references/OUTPUT.md:18` (feature line), `:32` (fix line); `skills/pre-execution-review/references/SNAPSHOT.md` §"Re-verifying a receipt (consumers)" ("a fix check must omit it") | 170b25f6 | AC1, AC2 · O1, O3 | current | proven | doc read |
| PE-006 | Verifier immunity — the verifier's comparison path normalizes the recorded lineage through `recordedValue`/`recordedDigest` before comparing, so the authoritative check (no `--parent`) is correct and the verifier needs no change | repository | `scripts/pre-execution-snapshot.mjs:377-379` (normalize), `:266` (`if (opts.parent)` binding) | 170b25f6 | AC3 · O4 | current | proven | code read |
| PE-007 | Normalizer authority — `recordedValue` + `NULL_WORDS` (`null, none, n/a, na, —, -`) is the contract module's own canonical "recorded line as a comparable value" helper; routing the lineage through it is a one-token change, not a new normalizer | repository | `scripts/pre-execution-contract.mjs:75` (`NULL_WORDS`), `:78-83` (`recordedValue`) | 170b25f6 | AC1 · O1 | current | proven | code read |
| PE-008 | Regression scope — `parseReceipts` has exactly two consumers (sensor import, verifier `receipts()`); `receipt.parent`'s only consumer is `workflow-status.mjs:598`; the verifier's JSON report echoes `receipt.snapshot` raw (not parent); feature receipts record bare hex so normalization is a no-op for them | repository | `scripts/workflow-status.mjs` (only `receipt.parent` use), `scripts/pre-execution-snapshot.mjs:448-449` (report fields, no parent), `:445-447` (raw `receipt.snapshot` digest match); `docs/features/*/progress.md` (bare-hex feature lineage lines) | 170b25f6 | AC1, AC3 · O2, O4 | current | proven | code read + grep |
| PE-009 | Rollback path — one `git revert` of the fix PR restores the prior parser/sensor behavior; the fix writes no persisted state (read-only sensing), so data cleanup is none | derived | rule "single-PR revert of a read-only scripts change" (inputs PE-002 + PE-003; the sensor mutates nothing — CLAUDE.md §Verification keeps the scripts read-only) | — | O5 | not-applicable | decision | — |
| PE-010 | Invariant / use case — the sensor's review/plan rows are the merge-gate surface operators route on; a false `missing` on every sensed fix unit makes the gate untrustworthy, and #205's verdict-landing tail routes ruled-but-unclosed units from exactly these rows | forge | https://github.com/gtrabanco/agentic-workflow/issues/221 (Impact section, read 2026-09-15); `docs/features/ROADMAP.md` row 50 (#205) | issue state 2026-09-15 | AC2 · O3 | current | proven | issue body + roadmap read |
| PE-011 | Test capability — the sensor suite's `makeFixture` writes fix-index rows and `extraFiles` pre-commit and returns `write` for post-build receipt append; the verifier suite's `recordReceipt` shows the real `build` invocation recipe; root suites run `node --test`; the schema `dist/` must be built first | repository | `scripts/workflow-status-sensor.test.mjs:67-133` (makeFixture: `extraFiles`, gh shim, `write` return), `scripts/pre-execution-sensor.test.mjs:161-175` (recordReceipt build recipe), `scripts/schema-runtime.mjs:12` (dist precondition) | 170b25f6 | AC1, AC2 · O1, O3 | current | proven | code read |
| PE-012 | Forge sweep 2026-09-15 — open PRs: #212 only (phase-lint script, no shared file); #205 related downstream consumer, does not absorb this; #217 and #193 merged | forge | https://github.com/gtrabanco/agentic-workflow/pulls (open list 2026-09-15); `docs/fix/README.md` rows | forge state 2026-09-15 | O6 | current | proven | forge read this plan |
| PE-013 | Fix receipts record `Unit kind: fix` (grammar-required), so the sensor can key the no-parent rule on the receipt's own recorded kind without re-deriving the dir-prefix rule the verifier owns | repository | `docs/fix/214-model-selection-over-24-options/progress.md:9` and `docs/fix/191-handoff-review-fold-order/progress.md:6` (`Unit kind: fix` lines); `scripts/pre-execution-snapshot.mjs:208` (the verifier's own dir-prefix derivation — the literal the sensor must not duplicate) | 170b25f6 | AC2 · O3 | current | proven | code + receipt read |

### Obligations

One row per normative behaviour, applicable invariant, affected use case, and
required failure state. Status is `planned | in-progress | verified | n/a |
deferred`; `n/a` requires evidence, and no current-unit obligation may be
`deferred` to a follow-up issue.

| obligation-id | Authority source | Affected use case or invariant | Phase | Task | Implementation owner | Validator | Required evidence | Status |
|---|---|---|---|---|---|---|---|---|
| O1 | AC1; PE-003, PE-005, PE-007 | the parser reads a null-word lineage line (`null`/`none`/`n/a`) as absent — a fix receipt's `Parent SPEC snapshot: null` and a SPEC receipt's `Parent: null` both parse `parent === null` | P1 | 3 | execute-phase | `node --test scripts/pre-execution-receipt-parent.test.mjs` → exit 0 | test output in progress.md | planned |
| O2 | AC1; PE-005, PE-008 | non-null lineage lines keep their recorded value: bare 64-hex passthrough, `sha256:`-dressed input parsed as bare hex; every other parsed field byte-identical | P1 | 3 | execute-phase | `node --test scripts/pre-execution-receipt-parent.test.mjs` → exit 0 | test output in progress.md | planned |
| O3 | AC2; PE-001, PE-002, PE-004, PE-005, PE-013 | a fix unit's plan sense spawns `verify` without `--parent`, and a current fix receipt senses `label: "current"` with no gate blocker — the false `plan-stage receipt is missing` class is dead | P1 | 2, 4 | execute-phase | `node --test scripts/workflow-status-sensor.test.mjs` → exit 0 (pinned case "a current fix-unit plan receipt senses current, not missing (#221)") | test output in progress.md | planned |
| O4 | AC3; PE-006, PE-008 | feature-unit sensing and the verifier's own comparison path stay behavior-identical (regression scope holds) | P1 | 5 | execute-phase | `node --test scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs scripts/pre-execution-timeline.test.mjs scripts/pre-execution-quality.test.mjs` → exit 0 | pasted exit codes | planned |
| O5 | AC4, AC5; PE-009 | repo-wide scripts regression, normative drift, and skill context budgets stay green; no skill/package byte moved | P2 | 1 | execute-phase | `node --test scripts/*.test.mjs` → exit 0 (after `cd packages/agentic-workflow-schema && bun install --frozen-lockfile && bun run build`); `bun scripts/check-skill-context.mjs` → exit 0 | pasted commands + exit codes | planned |
| O6 | AC6; PE-012 | fix index carries the #221 unit row and is flipped to `done · [PR]` at close-out | P2 | 3, 6 | execute-phase | read-verified: from repo root, `grep -cE "sensor-null-parent-receipt.*done · \[#"` → 1 (presence alone is green from plan time; only the flip proves the outcome) | grep output | planned |

## Acceptance

Objective, verifiable conditions for "done". Each criterion is a runnable
command where possible, or labelled `read-verified` — never unlabelled prose.
IDs are frozen in `ACCEPTANCE.md`.

### Spec-lint (mechanical — presence checks only)

Run by `plan-fix` before committing the draft; fail-closed, no quality
judgement. Any FAIL → fix the SPEC before the commit.

- [x] No template placeholders left (`grep -nE '<(topic|n|task|command|expected)'`
      over the filled sections returns nothing — the `### P1` scaffold lines
      are replaced, not kept).
- [x] `### Out of scope` has ≥ 1 concrete bullet — never empty.
- [x] Every `## Acceptance` criterion is a runnable command OR labelled
      `read-verified`.
- [x] Every phase passes the 8-box Phase-lint below (already mandatory,
      owned by `skills/phase-contract/SKILL.md`).
- [x] `### Planning evidence` has a `current` row for the reproduction (PE-001),
      the root cause (PE-002/PE-003/PE-004), the regression scope (PE-008),
      and the rollback path (PE-009) — none blank, none `n/a`.
- [x] `### Obligations` has one row per normative behaviour, applicable invariant,
      affected use case, and required failure state, each with a phase and a
      validator; no `deferred` row and none exported to a follow-up issue.

## Rules that must never be violated

- One parser of the receipt grammar (F25): no second parser or field
  extractor may appear in `workflow-status.mjs` (pinned at
  `scripts/workflow-status-sensor.test.mjs:738-739`); the lineage
  normalization lives only in `pre-execution-contract.mjs` (PE-007).
- The schema's refusal of a non-64-hex `parentSpecSnapshotDigest` stays
  untouched — it is the backstop that surfaced this defect (PE-004).
- Feature-unit sensing stays byte-identical: the explicit-parent path
  (`specSense.observedDigest`) remains the only parent a feature plan sense
  binds (PE-008).
- Tests are immutable once written; the red-first suites go green by fixing
  code, never expectations (`verification-contract`).
- Scope: `scripts/` + `docs/fix/` only — no `packages/`, `skills/`, or
  `template/` bytes; no SKILL.md edits (no `bump-skill`, no
  `bundle:skills`); no new dependency (PE-007 reuses the module's own
  helper).
- English-only committed artifacts; the bilingual-sibling rule does not
  apply (process artifacts carry no ES sibling — CLAUDE.md §Working rules
  scope exception).
- One PR per unit of work against `main`; never commit to `main`; the plan
  stage never pushes; the PR body carries `Closes #221` (CLAUDE.md; plan-fix
  hard rules).

## Impact

- **Layers** (per this repo's tooling layout): `domain` — the receipt
  grammar parser and the sensor's receipt sensing (`scripts/*.mjs`); no
  ui/api/schema/db surface.
- **Modules and files**: `scripts/pre-execution-contract.mjs`,
  `scripts/workflow-status.mjs`; tests `scripts/pre-execution-receipt-parent.test.mjs`
  (new), `scripts/workflow-status-sensor.test.mjs`; `docs/fix/README.md`.
- **Blast radius**: `parseReceipts`' two consumers only — the verifier is
  self-normalizing and unchanged (PE-006), the sensor's feature path is
  byte-identical (PE-008); no package, skill, or template byte moves; no
  persisted format changes (the grammar's recorded bytes are untouched —
  only their parse changes).
- **Detection lead time**: in production the false blocker was silent for
  the receipt's lifetime (the sensor said `missing` while the authoritative
  verify passed — PE-001/PE-004), so the class needed a fixture, not a
  runtime alarm: the pinned e2e case fails at PR time on any regression
  (AC2).

## Operational risks

None — the sensor is read-only sensing (no jobs, queues, caches, schema, or
external adapters interact with receipt parsing); its forge and verifier
subprocess invocations are unchanged except for the dropped `--parent` on
fix units (PE-002).

## Security risks

n/a — no auth, secrets, PII, webhooks, or rate limits; the parser and sensor
read local files and the forge's public read surfaces only.

## Compliance touchpoints

n/a — no domain/compliance rules apply to receipt parsing.

## Affected docs

Each becomes an acceptance criterion:

- `docs/fix/README.md` — the #221 unit row, flipped to `done · [PR]` at
  close-out (AC6).
- No other docs: no SKILL.md byte changes (no version bumps), and
  `skills/workflow-status/references/SENSOR_CORE.md` /
  `PRE_EXECUTION.md` document the verifier's `--parent` flag, whose
  semantics are unchanged.

## Observability

The sensor's own envelope is the observable: post-fix, `detail.pre_execution`
rows for fix units with a passing receipt read `label: "current"` /
`reason: null`, and the false `plan-stage receipt is missing` gate blockers
disappear (pinned by AC2). The silent-failure mode — a regression
reintroducing the refusal — re-manifests as false `missing` and is caught by
the pinned fixture at PR time, not by runtime telemetry (the sensor has
none; none is added).

## Cross-issue notes

- **#205** (review-loop convergence; roadmap row 50): related downstream
  consumer — its verdict-landing tail routes ruled-but-unclosed fix units
  from exactly these sensor rows, so this fix is a prerequisite for
  trustworthy routing there; #205 does not absorb it (different unit type;
  this is a two-site bug fix with its own receipt fixture).
- **PR #212** (deterministic phase-lint script): parallel — no shared file
  (PE-012).
- **#217** (fix-214): merged into `main` (`170b25f6`) — the original
  observation site; nothing to carry.
- **#193** (fix-191): merged; its unit remains the live `in-progress`
  instance of the false blocker on this tree (PE-001) and flips healthy
  once this lands (its receipt is also genuinely stale — bytes moved since
  its review — but post-fix the sensor will report that real answer instead
  of masking it as `missing`).
- **#182** (deterministic CLI beside `pre-execution-snapshot.mjs`): planned
  feature on a different surface (a new CLI); no overlap with this
  parse/bind fix.
- Forge sweep 2026-09-15: no other open issue or PR touches
  `scripts/pre-execution-contract.mjs` or the sensor's sensing path.

## Effort

S — two one-line source edits, one small new test file, one pinned e2e case;
single-commit-sized, well under the S bound.

## Decisions made during drafting

1. **Parser-side normalization is the root-cause site** (vs. sensor-only
   guarding): F25's "one parser of the one grammar" must not emit a
   non-comparable value for a line the grammar defines as null; the
   verifier already re-normalizes at `:377-379` (PE-006), and the sensor
   must not grow a second normalizer to cope.
2. **The sensor-side rule is kept anyway** (the issue's two-site direction):
   SNAPSHOT.md orders "a fix check must omit it", so the sensor encodes the
   rule itself rather than depending on lineage data happening to be null —
   that also kills the class for any future fix receipt shape.
3. **The guard keys on the receipt's recorded `Unit kind` line**, not a
   dir-prefix re-derivation: re-deriving `docs/fix/` in the sensor would
   duplicate the verifier's derivation literal
   (`pre-execution-snapshot.mjs:208` — drift risk); for a current receipt
   the verifier's `invalid-unit` check guarantees the recorded kind matches
   the derived kind, and for a mis-filed receipt the verify refuses
   regardless — the guard cannot manufacture a false `current`.
4. **Only `parent` is normalized at the parser**: `snapshot` must stay raw
   (the verifier's digest-match path and the JSON report echo it),
   verdict/stage/unit comparisons normalize on their own, and feature
   receipts record bare hex (PE-008) — widening would change the verifier's
   report output for no defect.
5. **Legacy receipts without a `Unit kind` line**: the guard no-ops
   (fail-open to current semantics); their lineage line, if any, is
   normalized by the parser fix anyway.
6. **The e2e pinned case uses an `in-progress` fix unit** (no PR shim): the
   false blocker hits every sensed fix unit with a plan receipt —
   `OPEN_STATES` plus done-with-open-PR (`workflow-status.mjs:63`,
   `:1029`) — and `in-progress` is the cheapest reproducing state
   (fix-191 is the live instance, PE-001).
7. **A new parser test file** rather than extending a CLI-driven suite: no
   existing suite imports `parseReceipts` directly (the sensor/attribution/
   timeline suites drive the CLI in throwaway repos), and a direct import
   pins the grammar semantics at the cheapest layer.
8. **No web research pass**: every bounded question (what must be true /
   which authority / what was observed / contradictions / unknowns) was
   answered from repository evidence — code, receipts, skill references,
   roadmap, forge; nothing external to fetch.

## Testing

Unit level (parser grammar shapes, direct `parseReceipts` import) plus
integration (the sensor driven end-to-end through its real verifier
subprocess in a throwaway fixture), red-first. The regression risk is
feature-path behavior change — pinned by the pre-execution quartet (O4) and
the full scripts suite (O5).

## Phases

Execution ledger — `execute-phase --fix 221` runs **all remaining phases by
default** and ticks tasks here; an explicit `P<n>` runs exactly one phase.
**Always ≥ 2 phases**: `P1..Pn` implement the fix
(each task independently checkable, no judgement); the final phase is
always `Hardening & PR` — keep its pre-written tasks **literally**, never
paraphrase or merge them into an implementation phase.

### Phase-lint (owned by `skills/phase-contract/SKILL.md`)

Every implementation phase below must pass all 8 boxes before it is emitted
(planner skills) or executed (`execute-phase` pre-flight). Fail-closed: any
unticked box blocks emission/execution until the phase is re-cut or split.
Consume the canonical checklist from `skills/phase-contract/SKILL.md` and
record the result here per phase.

- P1 — `Phase-lint: PASS (8/8) · fingerprint P1:domain:5:fix-receipts-bind-no-parent`
- P2 — `Phase-lint: PASS (8/8) · fingerprint P2:close-out:7:hardening-and-pr`

### P1 — Fix receipts bind no parent

Layer: `domain`. Done-when: `node --test
scripts/pre-execution-receipt-parent.test.mjs
scripts/workflow-status-sensor.test.mjs` → exit 0 (schema `dist/` built
first: `cd packages/agentic-workflow-schema && bun install
--frozen-lockfile && bun run build`).

- [x] Red-first `scripts/pre-execution-receipt-parent.test.mjs` (new;
      imports `parseReceipts` from `./pre-execution-contract.mjs`): pin the
      three lineage shapes — a fix plan receipt's `Parent SPEC snapshot:
      null` and a SPEC receipt's `Parent: null` both parse `parent ===
      null`, and a feature receipt's bare/`sha256:`-dressed 64-hex parent
      parses as the bare hex — run to red (O1, O2; PE-003, PE-005, PE-007).
- [x] Red-first pinned case in `scripts/workflow-status-sensor.test.mjs` —
      "a current fix-unit plan receipt senses current, not missing (#221)":
      `makeFixture` with an `in-progress` fix-index row for
      `sensor-null-parent-receipt`, `extraFiles` writing the unit's
      `docs/fix/221-sensor-null-parent-receipt/SPEC.md` + `ACCEPTANCE.md`
      (committed at fixture init), the real plan snapshot digest obtained by
      running the repo's `scripts/pre-execution-snapshot.mjs build --stage
      plan --unit fix-221 --dir docs/fix/221-sensor-null-parent-receipt
      --unit-kind fix --root <the fixture root>` (the `recordReceipt`
      recipe in `scripts/pre-execution-sensor.test.mjs:161-175`), the
      grammar-exact receipt block appended to the unit's `progress.md`
      (`Snapshot: <the built digest>` · `Parent SPEC snapshot: null` ·
      `Source/Artifact revision: <the fixture HEAD>` · `Policy: v1` ·
      `Verdict: plan-review-pass`), asserting the unit's
      `detail.pre_execution` row reads `label: "current"` with no gate
      blocker for it — run to red (O3; PE-001, PE-002, PE-004, PE-011).
- [x] Site 1 — `scripts/pre-execution-contract.mjs:132`: wrap the lineage
      extraction in the module's own normalizer — `parent:
      recordedValue(fieldFrom(chunk, "Parent SPEC snapshot") ??
      fieldFrom(chunk, "Parent"))` (O1, O2; PE-007) — parser suite green.
- [x] Site 2 — `scripts/workflow-status.mjs:598`: never bind a parent for a
      fix receipt — `const boundParent = receipt.unitKind === "fix" ? null
      : (parent ?? receipt.parent);` with a comment citing SNAPSHOT.md's
      fix-omits-parent rule (O3; PE-005, PE-013) — sensor suite green.
- [x] Regression gate: `node --test scripts/pre-execution-sensor.test.mjs
      scripts/pre-execution-attribution.test.mjs
      scripts/pre-execution-timeline.test.mjs
      scripts/pre-execution-quality.test.mjs` → exit 0 (O4; PE-006,
      PE-008).

### P2 — Hardening & PR

- [x] Re-run the project's full verification gate (commands + exit codes pasted)
- [x] Pending-docs check: `git status --porcelain -- docs/` → empty
- [x] Set the fix-index row status to `done` and commit the flip
- [x] `git push`
- [x] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #221`
- [x] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [x] Commit `docs: link PR #221` and push

## Rollback

Revert the fix PR (`gh pr revert <pr>` or `git revert <merge-sha>` on
`main`) — one step restores the prior parse and sensor behavior. Data
cleanup: none — the fix writes no persisted state and changes no recorded
bytes (PE-009); receipts already on disk parse identically under the
reverted code.

## Status

`done` (built, PR open — merge state lives in the
forge)

(Removed from `docs/fix/README.md` only **after** the PR merges.)
