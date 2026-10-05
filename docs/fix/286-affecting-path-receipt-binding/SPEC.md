# fix/286-affecting-path-receipt-binding

> One-line: review receipts freeze the affecting-path scope manifest beside the
> head sha — a non-affecting commit no longer voids a review (#182's absorbed
> requirement, finally landed).

## Issue

`#286` — tracked issue in the project's forge. The PR must close it via
`Closes #286` in the body (or the forge's equivalent auto-close convention).

## Objective

Land the affecting-path receipt binding that #182's absorption into feature 61
recorded on paper but never shipped: `sign`/`verify` CLI for the scope manifest,
`review-receipt.mjs` recording and judging it, `audit-pr` accepting non-affecting
head deltas — so a `.serena/`/session-log commit between review and merge stops
forcing full re-reviews.

## Why

`scripts/review-receipt.mjs` compares the receipt sha to `headRefOid` only — no
scope manifest, no path digests (issue #286; reproduced 2026-10-05 on PR #282
where the authorized `.serena` commit `8af3a489` staled a receipt that named
`94efd299` with zero reviewed bytes touched). #182 was closed as absorbed by
feature 61, but its affecting-path manifest requirement (AC 3/9) silently
dropped between the roadmap fold and the lane's triage. Per #286, AC 3/9 of
#182 remain the spec; the fix is red-first in both directions.

## User outcome

A foreign-only commit (session log, agent toolstate/memory) pushed between
review and `audit-pr` leaves the review receipt current; any affecting-path
delta still voids it. Reviews of shared checkouts stop re-running on
unrelated concurrent work.

## Acceptance criteria

1. `bun scripts/scope-manifest.mjs sign --base <ref> [--head <sha>]` emits the
   affecting-path manifest: sorted affected paths (branch delta vs base, minus
   the non-affecting classes), per-path SHA-256 over the git blob at the head,
   the base/head revisions, and a scope digest — produced by the schema
   package's `sha256HexSync` (no second hash implementation) over a
   deterministic serialization. Red-first: the command does not exist at
   pre-fix bytes.
2. Non-affecting classes are exactly: the session log (`docs/LOGS.md`) and
   agent toolstate/memory dirs (`.engram/`, `.pi/`, `.serena/`). A path
   matching no named class is affecting — fail-closed (test: a foreign-looking
   but unlisted path binds).
3. `bun scripts/scope-manifest.mjs verify --base <ref> --head <sha> --scope
   <64-hex>` re-derives the manifest at the head and compares scope digests:
   exit 0 fresh · 4 stale (naming appeared/disappeared/changed paths) · 1
   error. Red-first both directions: a non-affecting delta keeps the digest
   fresh; an affecting delta (any bound path changed, or a new affecting path
   appeared) names the path and goes stale.
4. `review-receipt.mjs emit` accepts optional `--scope-manifest <64-hex>`; the
   marker gains an optional `scope=<64-hex>` attribute (legacy receipts without
   it keep head-bound semantics and parse unchanged); the fixed body gains a
   `- Scope manifest:` line. The "candidate changed during review" refusal
   exempts a head delta whose changed paths are all non-affecting **when a
   scope manifest is recorded**; otherwise unchanged.
5. `review-receipt.mjs verify` judges the manifest: a receipt whose sha ≠ head
   is **current** when it carries a scope manifest and the head delta (receipt
   sha → head, `git diff --name-only`) touches only non-affecting paths; stale
   on any affecting delta or when no scope manifest is recorded. Fail-closed:
   an unresolvable delta is stale, never current. (#182 AC 3/9, both
   directions, red-first.)
6. `audit-pr-gate.mjs`'s receipt gate and `audit-pr`'s Step 1 apply the same
   judge (pure judge function, impure git delta computed at the CLI layer);
   the reference names the verify command instead of voiding on any SHA
   mismatch.
7. `review-change`'s receipt closeout records the scope manifest: the Turn
   contract receipt box and `PERSIST_AND_DECIDE.md` step 12 pass
   `--scope-manifest "$(bun scripts/scope-manifest.mjs sign --base main …)"`.
8. Full gate green: `node --test scripts/*.test.mjs` (repo), schema package
   untouched (`bun run test` there unchanged at 4.6.0), context budgets PASS.

## Non-goals

- Not rewording turn-contract box 5, `log-session`'s commit-and-push policy, or
  the ahead/behind precondition (#182 EB1/3, AC 1/2/4/5/8/10/11) — #286's spec
  is AC 3/9; the workspace-precondition family is its own follow-up.
- No GATE-RAN digest slots (#182 amendment 1 item 3), no forge-facts
  subcommand (amendment 2), no findings-ledger subcommands (amendment 3).
- No schema package change (only the already-exported `sha256HexSync` is
  reused); no change to `pre-execution-snapshot.mjs` or the planning-snapshot
  family.
- Not changing the review-receipt contract id (`v1`) or the verdict grammar.

## Future cost

- The non-affecting class list is a security-relevant vocabulary: extending it
  binds a review-surface decision — future classes are added in
  `scripts/scope-manifest.mjs` with a test, never inline in a consumer.

## Applicable tests

`node --test scripts/scope-manifest.test.mjs scripts/review-receipt.test.mjs
scripts/audit-pr-receipt.test.mjs` (red-first before P2–P4), plus the full
`node --test scripts/*.test.mjs` for AC8.

## Known pre-existing issues

- `#285` (lane-era lineage gate) — does-not-affect (separate lane, PR #287).
- `#269` ripgrep — does-not-affect.
- `.claude/skills/orchestration-envelope` path (turn contract) is the pi
  package mirror surface; this fix edits `review-change`'s skill tree only —
  does-not-affect.

## Tasks

P1 — Red-first tests: `scripts/scope-manifest.test.mjs` (AC1–AC3 over a
throwaway git repo) + red cases appended to `scripts/review-receipt.test.mjs`
(AC4–AC5, pure contract) + `scripts/audit-pr-receipt.test.mjs` (AC6 judge).
(validator: those three suites fail before P2, pass after).

P2 — Enforcer: `scripts/scope-manifest.mjs` (`sign`/`verify`, non-affecting
classes, fail-closed, `sha256HexSync` from the schema package).
(validator: `node --test scripts/scope-manifest.test.mjs` exits 0).

P3 — Receipt binding: `scripts/review-receipt.mjs` scope marker + emit/verify
manifest judging (pure judge exported, git delta at the CLI layer);
`scripts/audit-pr-gate.mjs` receipt gate consumes the judge.
(validator: `node --test scripts/review-receipt.test.mjs
scripts/audit-pr-receipt.test.mjs` exits 0).

P4 — Consumers: `review-change` SKILL.md box + `PERSIST_AND_DECIDE.md` step 12
record the manifest; `audit-pr` Step 1 names the verify route.
(validator: `node --test scripts/*.test.mjs` exits 0).

P5 — Verification sweep: full repo gate, context budgets, diff guard.
(validator: `node --test scripts/*.test.mjs && bun scripts/check-skill-context.mjs` exits 0).

## Evidence

> Evidence is verified, not claimed — a reviewer re-runs it.

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| AC1 | `node --test scripts/scope-manifest.test.mjs` | 0 | sign emits sorted bound paths + blob digests + 64-hex scope digest, deterministic | scope-manifest suite (red-first at 3177f5ea) |
| AC2 | `node --test scripts/scope-manifest.test.mjs` | 0 | `fail-closed: a path matching no named class binds` pass (`notes.txt` bound) | scope-manifest suite |
| AC3 | `node --test scripts/scope-manifest.test.mjs` | 0 | fresh at signed head; non-affecting delta keeps fresh; affecting delta exit 4 naming `src/feature.ts` / `src/extra.ts` | scope-manifest suite |
| AC4 | `node --test scripts/review-receipt.test.mjs` | 0 | scope marker grammar + render line + legacy parse unchanged; moved-head refusal exempts non-affecting delta | review-receipt suite (29 tests) |
| AC5 | `node --test scripts/review-receipt.test.mjs` | 0 | CLI verify in a git checkout: foreign commit keeps receipt current (exit 0); affecting commit voids (exit 4) | review-receipt suite (AC3/AC9 both directions) |
| AC6 | `node --test scripts/audit-pr-receipt.test.mjs` | 0 | scoped receipt + non-affecting delta → MERGE-READY; affecting delta / legacy receipt / unresolvable delta → BLOCKED | audit-pr-receipt suite |
| AC7 | `grep -n "scope-base" skills/review-change/SKILL.md skills/review-change/references/PERSIST_AND_DECIDE.md` | 0 | both receipt-closeout surfaces pass `--scope-base main`; runtime derives the manifest | read-verified |
| AC8 | `node --test scripts/*.test.mjs` | 0 | 626 pass / 0 fail; `bun scripts/check-skill-context.mjs` PASS 28 skills + PASS 14 routes (declared re-bases) | full repo gate |
| — | `bun scripts/diff-guard.mjs --base main --unit 286` | 1 | `DIFF-GUARD BREACH — Lines: 979 > 400 · Files: 13 > 8` | exception recorded: `decisions.md` D-286-3 (real count, nothing shrunk) |

## Triaged steps

```text
TRIAGE — 286-affecting-path-receipt-binding (fix)
Steps: plan, implement, tests, evidence, review, docs
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
```

> Authoritative step list from `bun scripts/unit-route.mjs --triage 286-affecting-path-receipt-binding`. Skipped steps recorded as n/a: research — n/a (catalog: fix unit), design — n/a (catalog: fix unit), release — n/a (catalog: fix unit).

### Planning evidence

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | file-read | the receipt runtime compares the receipt sha to the PR head only — no scope manifest, no path digests | `scripts/review-receipt.mjs` (REVIEW_MARKER_RE, receiptStatus) | verified 2026-10-05 | O3, O4 |
| PE-002 | file-read | the audit gate consumes `receiptStatus` and blocks on any non-current status before reading gates | `scripts/audit-pr-gate.mjs` (auditVerdict, receipt gate first) | verified 2026-10-05 | O5 |
| PE-003 | file-read | `sha256HexSync` is already exported by the schema package — reuse, no second hash implementation | `packages/agentic-workflow-schema/src/index.ts` (`export { sha256Hex, sha256HexSync }`) | verified 2026-10-05 | O1 |
| PE-004 | file-read | `emit` refuses when the PR head differs from the reviewed head ("candidate changed during review") | `scripts/review-receipt.mjs` (emit branch) | verified 2026-10-05 | O4 |
| PE-005 | issue | the non-affecting classes per #182: session log (`docs/LOGS.md`), agent toolstate/memory (`.engram/`, `.pi/`, `.serena/`); fail-closed on unknown paths | issue #182 Expected behaviour 1 + issue #286 proposed fix | verified 2026-10-05 | O2 |
| PE-006 | issue | AC 3/9 of #182 remain the spec (commit-side, both directions); the workspace-precondition family (box 5, log-session, ahead/behind) stays out | issue #286 proposed fix | verified 2026-10-05 | O3–O6 |
| PE-007 | file-read | the field reproduction: `.serena` commit `8af3a489` staled a receipt naming `94efd299` on PR #282 with zero reviewed bytes touched | issue #286 body (audit-pr of PR #282, 2026-10-05) | verified 2026-10-05 | O3 |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | AC1 | scope manifest produced by the CLI with schema-package digests only | P2 | P2 (tests in P1) | unit-lane:implement | `node --test scripts/scope-manifest.test.mjs` | sign test records the digest shape | verified |
| O2 | AC2 | non-affecting classes exact + fail-closed on unknown paths | P2 | P2 (tests in P1) | unit-lane:implement | `node --test scripts/scope-manifest.test.mjs` | both-direction class tests | verified |
| O3 | AC3 | verify re-derives and names drift; fresh on non-affecting delta, stale on affecting | P2 | P2 (tests in P1) | unit-lane:implement | `node --test scripts/scope-manifest.test.mjs` | both-direction verify tests | verified |
| O4 | AC4 | emit records the manifest; refusal exempts non-affecting delta; legacy markers parse unchanged | P3 | P3 (tests in P1) | unit-lane:implement | `node --test scripts/review-receipt.test.mjs` | legacy-suite pass + new scope tests | verified |
| O5 | AC5+AC6 | verify judges the manifest (both directions); audit gate consumes the judge | P3 | P3 (tests in P1) | unit-lane:implement | `node --test scripts/review-receipt.test.mjs scripts/audit-pr-receipt.test.mjs` | both-direction tests + gate tests | verified |
| O6 | AC7+AC8 | consumers record the manifest; full gate green | P4 | P4–P5 | unit-lane:implement | `node --test scripts/*.test.mjs && bun scripts/check-skill-context.mjs` | gate output in Evidence | verified |

## Progress log

- 2026-10-05 13:52 — unit opened from issue #286: branch `fix/286-affecting-path-receipt-binding`, SPEC drafted, index row → in-progress → b68a9237 — next: triage + plan
- 2026-10-05 13:58 — triage ran (`bun scripts/unit-route.mjs --triage 286-affecting-path-receipt-binding`), block pasted verbatim; plan step: ledgers cut, decisions D-286-1/D-286-2 recorded → d75eff07 — next: red-first tests
- 2026-10-05 14:05 — tests step (red-first): `scripts/scope-manifest.test.mjs` (5 tests) + scope cases in review-receipt/audit-pr-receipt suites; red confirmed (module missing / no judgeReceipt) → 3177f5ea — next: implement
- 2026-10-05 14:20 — implement P2: `scripts/scope-manifest.mjs` sign/verify; two contract bugs caught by the red suite (head digested into the scope digest; cat-file -e empty-output guard) fixed against the tests → cd5b73d5 — next: receipt binding
- 2026-10-05 14:35 — implement P3: review-receipt scope marker + judgeReceipt + emit/verify judging; audit-pr-gate consumes the judge → 66028dc1 — next: scope-base derivation
- 2026-10-05 14:45 — emit gains `--scope-base` (runtime derives the manifest — no hand-assembled digests) → f815d3c3 — next: consumers
- 2026-10-05 14:55 — implement P4: review-change box + PERSIST_AND_DECIDE step 12 + audit-pr Step 1; budgets re-based at declared re-bases → 72317a06 — next: review
- 2026-10-05 15:00 — diff guard BREACH (979/13 vs 400/8): honest split attempted (four commits), exception recorded D-286-3 — next: review
- 2026-10-05 15:05 — review ran: 1 med security finding (unvalidated scope value reaching marker bytes) folded immediately at 2d222a88 with its red test; review-findings.md written — next: docs

## Next

Open the PR (closes #286); after merge, re-run `audit-pr` on PR #282 (its `.serena` receipt-void reproduction is exactly this fix's case).

## References

- Issue: [#286](https://github.com/gtrabanco/agentic-workflow/issues/286)
- #182 (AC 3/9 + amendments), fix-182/PR #241 (head-bound receipts), roadmap
  row 35 `scoped-receipt-verifier` (absorption record)
- Companion: #285 (separate lane, PR #287 — shared root-cause family)

## Branch

`fix/286-affecting-path-receipt-binding`

## Depends on

None for the code (PR #287 touches different scripts; the two skill-doc edits
do not overlap — `review-change`/`audit-pr` SKILL.md receipt sections vs #285's
`audit-pr/references/02` closure gate — sequential merges, no dependency).

## Regression scope

- Head-bound receipt semantics for legacy receipts (no `scope=` attribute):
  `scripts/review-receipt.test.mjs`, `scripts/audit-pr-receipt.test.mjs` — the
  existing suite must pass unchanged except where the manifest path is exercised.
- The marker grammar's strictness (40-hex sha, explicit contract): malformed
  markers never satisfy a reader.
- `audit-pr-gate.mjs` verdict precedence (receipt gate first, gates after).
