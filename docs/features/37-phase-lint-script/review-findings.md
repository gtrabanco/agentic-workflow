# review-findings — 37-phase-lint-script

Candidate-code review ran 2026-09-10 (`review-change`, single-reviewer, five
applicable axes code/security/verify/brand/perf — design/a11y/seo skipped: no
UI/web surface; PR #212 head `d693fe8e`). Cycle 1. The review re-anchored
mid-review from `f8afc6d0` to `d693fe8e` after a docs/log-only delta
(`docs/LOGS.md` +84, zero overlap with every finding surface); all marks bind
the re-anchored head. Not ledgered, per outcome routing: **F5**
(decision-required — blocks the unit until the user rules on a
`phase-contract` amendment), low report-only notes **F11/F14/F16/F17**, and
**F18** (owner resolved mid-review: `.pi/mcp.json` `@latest` is intentional).
F7 is classified `replan-in-unit` — its row stays `folded: no` until the
plan-owner re-cut lands.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | docs/fix/_TEMPLATE/SPEC.md:119 | code (owner conformance) | high | fix-now | fold: add the missing `Layer: hardening · Done-when:` header to the template's mandated closing phase (aligns the template with owner rules 2+8; historical fix SPECs stay legacy shapes under the known-issues disclosure) | yes |
| VF-1 | docs/fix/_TEMPLATE/SPEC.md:112-119 · reviewer review-change · HEAD d693fe8e494c8d5f74696f7776e60e14968072c0 · recheck direct read (P1 carries `Layer:`/`Done-when:` at :114, mandated P2 none) + observed `bun scripts/phase-lint.mjs docs/fix/_TEMPLATE/SPEC.md` and `…/docs/fix/100-stale-fix-index-rows/SPEC.md` → both `verdict BLOCKED: unparseable` exit 1 | code | confirmed | finding-mark | n/a | n/a |
| F2 | scripts/phase-lint.mjs:192 | code | med | fix-now | fold: stop discarding box-2's `ambiguous` flag (the `BOXES` wrapper `(phase) => box2(phase).findings`) + corpus fixture for an unmappable target | yes |
| VF-2 | scripts/phase-lint.mjs:192 · reviewer review-change · HEAD d693fe8e494c8d5f74696f7776e60e14968072c0 · recheck failing reproducer: config/infra task `- [ ] Implement \`src/index.ts\` parser entry` → `PASS (8/8)` exit 0; SPEC §Design box-2 requires `BLOCKED: unparseable` ("never a guess") | code | confirmed | finding-mark | n/a | n/a |
| F3 | scripts/phase-lint.mjs:153 | code | med | fix-now | fold: condition the ≤10 task budget on the close-out phase (owner rule 3) and the final hardening/close-out phase (SPEC box-3) + corpus fixture | yes |
| VF-3 | scripts/phase-lint.mjs:37,153 · reviewer review-change · HEAD d693fe8e494c8d5f74696f7776e60e14968072c0 · recheck failing reproducer: mid-plan `Layer: hardening` phase with 9 tasks → `PASS (8/8)` exit 0; owner rule 3 "≤ 8 tasks (close-out phase: ≤ 10, only the literal close-out chain)" | code | confirmed | finding-mark | n/a | n/a |
| F4 | scripts/phase-lint.mjs:202 | code | med | fix-now | fold: match the frozen "task text containing `manual`" (substring, catching "manually") + corpus fixture | yes |
| VF-4 | scripts/phase-lint.mjs:202 · reviewer review-change · HEAD d693fe8e494c8d5f74696f7776e60e14968072c0 · recheck failing reproducer: docs-phase task "Verify the rendered site manually on staging" → no box-7 finding; SPEC §Design box-7 freezes "task text containing `manual`" | code | confirmed | finding-mark | n/a | n/a |
| F6 | docs/workflow/SKILL_CONTEXT_BUDGETS.json (route ceilings) | tests | med | fix-now | fold: declared re-basis for the 4 newly-over-ceiling routes (plan-feature:issue/scaffold/scoped, plan-fix:issue — estimate+lines) naming the growth source (feature 37 P4 run-and-paste slim), or trim the added route lines; the pre-existing 15-failure red stays owned by #200/#176 | yes |
| VF-6 | docs/workflow/SKILL_CONTEXT_BUDGETS.json · reviewer review-change · HEAD d693fe8e494c8d5f74696f7776e60e14968072c0 · recheck measured: `bun scripts/check-skill-context.mjs --routes --json` → 23 failures at HEAD vs 15 at an origin/main worktree (8 new: plan-feature:issue/scaffold/scoped + plan-fix:issue) | tests | confirmed | finding-mark | n/a | n/a |
| F7 | scripts/phase-lint.mjs:150-160 + SPEC §Design box-2 | code (owner conformance) | med | fix-now | replan-in-unit: plan owner re-cuts the SPEC-frozen box-2 prefix table (test-file mapping for the owner-sanctioned "test-only phase declares `hardening`" shape) + script + corpus on this branch, fresh `/review-plan`, then `/execute-phase` | no |
| VF-7 | scripts/phase-lint.mjs:155 · reviewer review-change · HEAD d693fe8e494c8d5f74696f7776e60e14968072c0 · recheck failing reproducer: test-only phase `Layer: hardening` task creating `scripts/tokenizer.test.mjs` → `BLOCKED — box 2`; owner rule 2: "a test-only phase declares `hardening`" | code | confirmed | finding-mark | n/a | n/a |
| F8 | packages/agentic-workflow/README.md:1 | brand (bilingual) | med | fix-now | fold: add `packages/agentic-workflow/README.es.md` with reciprocal language-switcher links | yes |
| VF-8 | packages/agentic-workflow/README.md · reviewer review-change · HEAD d693fe8e494c8d5f74696f7776e60e14968072c0 · recheck direct read: `find packages -maxdepth 2 -name "README*"` → only `agentic-workflow` lacks `README.es.md`; CLAUDE.md hard rule (EN+ES siblings, ES in the SAME change) | brand | confirmed | finding-mark | n/a | n/a |
| F9 | CHANGELOG.md:737 | brand (markdown integrity) | med | fix-now | fold: restore the 2026-09-05 release-log bullet to its own line (newline split; ES sibling already standalone) | yes |
| VF-9 | CHANGELOG.md:737 · reviewer review-change · HEAD d693fe8e494c8d5f74696f7776e60e14968072c0 · recheck direct read: `grep -c "^- \*\*2026-09-05 — receipts stop binding" CHANGELOG.md` → 0 (bullet fused onto the 2026-09-10 line); CHANGELOG.es.md:741 standalone | brand | confirmed | finding-mark | n/a | n/a |
| F10 | scripts/phase-lint.mjs:182-183,192 | perf | med | fix-now | fold: bound the box-5/box-6 regex backtracking (bounded quantifiers or single-pass position checks) + degenerate-line corpus fixture asserting completion; no verdict change on realistic input | yes |
| VF-10 | scripts/phase-lint.mjs:182,192 · reviewer review-change · HEAD d693fe8e494c8d5f74696f7776e60e14968072c0 · recheck measured: `/\beither\b[\s\S]*\bor\b/i` 0.28 MB→5.0 s, 1.12 MB→77.3 s (quadratic); 5.3 MB/8.4 MB single-task fixtures → rc=124 (>60 s) on bun 1.4.3 and node 24.19 | perf | confirmed | finding-mark | n/a | n/a |
| F12 | scripts/phase-lint.mjs:42,111 | code (grammar conformance) | med | fix-now | fold: tighten the parser to the SPEC-frozen grammar (`[—-]` heading dash; `[ (|x)]` checkbox) + corpus fixtures | yes |
| VF-12 | scripts/phase-lint.mjs:42,111 · reviewer review-change · HEAD d693fe8e494c8d5f74696f7776e60e14968072c0 · recheck failing reproducer: `## P1 – Docs` (en dash) → PASS (SPEC grammar would answer no-phases); `- [X] Decide the schema now` → parsed as task (SPEC `[ (|x)]` rejects) | code | confirmed | finding-mark | n/a | n/a |
| F13 | scripts/phase-lint.mjs:139 | code | med | fix-now | fold: Unicode-aware joiner detection (`\w` → Unicode word chars) + corpus fixture ("Café + Bar") | yes |
| VF-13 | scripts/phase-lint.mjs:139 · reviewer review-change · HEAD d693fe8e494c8d5f74696f7776e60e14968072c0 · recheck failing reproducer: title "Café + Bar" → box-1 PASS (ASCII `\w` misses `é + B`); owner rule 1 "joins nouns with `+`…" | code | confirmed | finding-mark | n/a | n/a |
| F15 | scripts/phase-lint.mjs:216 | code | med | fix-now | fold: anchor the box-8 outcome regex (`\bpass(?:es|ed)?\b`) + corpus fixture | yes |
| VF-15 | scripts/phase-lint.mjs:216 · reviewer review-change · HEAD d693fe8e494c8d5f74696f7776e60e14968072c0 · recheck failing reproducer: done-when "`bun run lint` bypasses nothing" → box-8 passes (unanchored `pass` matches "bypasses") | code | confirmed | finding-mark | n/a | n/a |

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F5 | scripts/phase-lint.mjs:111 + SPEC §Design box-3 + skills/phase-contract/SKILL.md rule 3 | code | med | fix-now | fold: add ≥1-task minimum (box-3 lint-blocked at 0 tasks) + amend phase-contract rule 3 + amend SPEC §Design box-3 + update known-issues.md disclosure | no |
| VF-5 | scripts/phase-lint.mjs:111 · reviewer review-change · HEAD d693fe8e494c8d5f74696f7776e60e14968072c0 · recheck observed: zero-checkbox phase bodies pass all 8 boxes vacuously; user ratified the strict-block ruling ("si eso pasa o el plan está mal o hay que borrar la fase") — amendment approved | code | confirmed | finding-mark | n/a | n/a |

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| REVIEW-RAN | HEAD d693fe8e494c8d5f74696f7776e60e14968072c0 | n/a | n/a | review-mark | n/a | n/a |

The mark row is the durable `review-mark@1` record of cycle 1's review at that
head — isolated context-clean passes (code, security, verify, brand, perf;
each returned only its findings table + verdict; verification of every
candidate against the reviewed head's bytes, with reproducers for behavioral
claims). It says a review ran, never that the candidate passed.
