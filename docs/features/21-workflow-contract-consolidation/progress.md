# 21 — workflow-contract-consolidation · progress

Last reviewed: —

## P1 — 2026-08-03

- Done: Route cost measurement — manifest `SKILL_CONTEXT_BUDGETS.json` gains 14 named routes (plan-feature:scoped/issue, plan-fix:issue, execute-phase ×5, review-change ×4, audit-pr ×2); `check-skill-context.mjs` adds `--routes/--json/--route` with byte/4 route metrics and regression checks; `check-skill-context.test.mjs` covers unknown route, JSON shape, filtered route, bare `--route`, unknown-skill, estimate and lines regressions; baselines captured in `testing.md`; per-file mode backward compatible.
- Remains: none.
- Gotchas: route estimate = `Math.ceil(Buffer.byteLength(text,'utf8')/4)`; per-file mode still prints `PASS context budgets: N skills`; script's last line has no trailing newline (pre-existing, harmless). Prior interrupted run left P1 implemented but uncommitted — reconciled now.
- Files: scripts/check-skill-context.mjs, scripts/check-skill-context.test.mjs, docs/workflow/SKILL_CONTEXT_BUDGETS.json, docs/features/21-workflow-contract-consolidation/testing.md, docs/features/21-workflow-contract-consolidation/TASKS.md, docs/features/21-workflow-contract-consolidation/progress.md
- Next: P2 — Planning contract consolidation | unit not finished

## P2 — 2026-08-04

- Done: Planning contract consolidation — new internal `planning-preflight`
  (owns the normalized repository state read and the ONE final architectural
  classification) and `phase-contract` (owns the canonical eight-box phase-lint
  and the normalized phase fingerprint); `plan-feature` (3.4.0) and `plan-fix`
  (2.5.0) consume both with one immutable planning context; internals
  `plan-feature-from-issue` (1.7.0) and `plan-feature-scaffold` (1.13.0) drop
  their duplicated invariant/lint copies; feature/fix templates and mirrors slim
  to a phase-contract pointer + `Phase-lint: PASS (8/8) · fingerprint` record
  line; `execute-phase` PREFLIGHT points at the phase contract; the three
  planning routes gain reduced regression maxima in `SKILL_CONTEXT_BUDGETS.json`;
  all route totals now sit below their captured baselines.
- Remains: none.
- Gotchas: plan-fix grew above baseline when the two new consumption paths were
  added, so ~52 bytes of prose were trimmed to land at 3145 est/222 lines below
  the 3150/225 baseline; `PLANNING_GATES.md` deleted (route resolver only pulls
  `references/`-linked files, so `../skill` links change no route membership).
- Files: skills/planning-preflight/SKILL.md (new), skills/phase-contract/SKILL.md
  (new), skills/plan-feature/SKILL.md, skills/plan-feature/references/ROUTING.md,
  skills/plan-feature/references/PLANNING_GATES.md (deleted),
  skills/plan-feature-from-issue/SKILL.md, skills/plan-feature-scaffold/SKILL.md,
  skills/plan-feature-scaffold/references/SCAFFOLD_PROCESS.md, skills/plan-fix/SKILL.md,
  skills/plan-fix/references/PLANNING_PROCESS.md, skills/plan-fix/references/SPEC_CONTRACT.md,
  docs/features/_TEMPLATE/SPEC.md, docs/fix/_TEMPLATE/SPEC.md,
  template/docs/features/_TEMPLATE/SPEC.md, template/docs/fix/_TEMPLATE/SPEC.md,
  skills/execute-phase/references/PREFLIGHT.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json,
  docs/features/21-workflow-contract-consolidation/{testing,TASKS,decisions,progress}.md
- Next: P3 — Execution route consolidation | unit not finished

## P3 — 2026-08-04

- Done: Execution route consolidation (P3-1) — `WORKFLOWS.md` split into four
  per-mode resources (feature, small/phased, fix, legacy); `execute-phase`
  (2.13.1) entrypoint selects **exactly one** mode from the target artifacts
  before loading mode detail; route resolution is now route-authoritative (a
  route with a `references` object loads only the listed files); the five
  execute routes gain reduced regression maxima in `SKILL_CONTEXT_BUDGETS.json`;
  `BATCH_AND_PORTABILITY` and `ISSUE_POLICY` do not load on mode routes; the
  context-checker test suite gains per-route mode-selection fixtures. Committed
  as `5c71105` (`feat(workflow): split execute-phase workflows into per-mode routes`).
- Done: Execution policy consolidation (P3-2) — `ISSUE_POLICY.md` (8538 B)
  split into `FORGE_BODY.md` (2052 B, final-pr route), `DESCOPE.md` (1874 B,
  descope route), and `OPPORTUNISTIC_FINDING.md` (4643 B, finding route);
  `execute-phase` (2.13.2) loads exactly one policy per situation; the three
  policy routes record their required resource with reduced maxima (final-pr
  tightened 11000/740 → 9500/660 after the ~1615 est drop); policy-selection
  fixtures added; all 16 routes pass; SKILL.md main budget re-verified at
  2799 est / 177 lines.
- Done: Dependency receipt + fast path (P3-3) — `PREFLIGHT.md` gains the
  versioned **dependency receipt (v1)** and its fail-closed local fingerprint
  fast path: after a full merged pass the unit's `progress.md` records
  `Dependency receipt v1` (fingerprint + closure + merged PRs); later phases
  recompute the cheap local fingerprint (SPEC `Depends on:` line + closure
  roadmap rows only) and skip forge traversal only when the receipt is current,
  matches, records `Fully merged: yes`, and no `--force` is dated after it;
  any of a changed graph, missing/older receipt, later `--force`, or an unmet
  dependency fails closed to the full gate. Design fix: the fingerprint covers
  only locally-derivable inputs — PR identities are receipt provenance, never
  fingerprint input (else fast-path recompute could never match). The contract
  is made testable by `scripts/dependency-gate.test.mjs` (10 cases: fast path +
  every invalidation case + a `git hash-object --stdin` fidelity cross-check).
  Because PREFLIGHT loads on every execute route, the seven execute maxima in
  `SKILL_CONTEXT_BUDGETS.json` were recalibrated to the new steady state
  (feature/small 9600/670, fix 9750/670, legacy 9400/660, final-pr 9500/660,
  descope 9400/670, finding 10100/690); all 16 routes pass and stay far below
  the 13284/866 baseline.
- Done: Execution safety boxes preserved read-verified (P3-4) — every
  pre-consolidation universal safety box (11 boxes, cut at `5c71105^`) is
  preserved in the compact Turn contract and maps to exactly one unique owner
  resource that carries its normative detail. Owner map verified by reading the
  files: box 1 branch-first, 3 architectural-invariant gate, 4 gate-RUN
  (commands + exit codes), 5 git add/commit (Docs COMMITTED gate), 7 clean-tree
  → `EXECUTION_CONTRACT.md`; box 2 phase-lint pre-flight guard →
  `PREFLIGHT.md` (proxying `skills/phase-contract/SKILL.md`, the owner of the
  8-box lint rules); box 6 finishing-a-unit push + PR → `CLOSEOUT.md`; box 8
  artifact language → `FORGE_BODY.md`; box 9 descope → `DESCOPE.md`; box 10
  finding classification → `OPPORTUNISTIC_FINDING.md`; box 11 `→ Next:` block →
  `CLOSEOUT.md`. Observable behavior preserved: each of the 7 execute routes
  loads only its own mode workflow (feature/small/fix/legacy exactly one
  `WORKFLOWS_*`) and policy routes load no mode workflow, no mode route loads a
  policy file, and every execute route still PASSes on its own. Enforced by
  `scripts/check-skill-context.test.mjs` (read-verified owner map + mode/policy
  disjointness + per-route PASS); `node --test scripts/*.test.mjs` → 11 pass.
- Done: bump-skill pass over execute-phase (P3-6) — changelog rows for 2.13.2
  added to CHANGELOG.md/CHANGELOG.es.md (workflow split, policy split, versioned
  dependency receipt) plus the 2026-08-05 release-log line; all 7 authoring-rule
  lint checks pass (→ Next: block present, P1-only phase labels, Portability +
  Turn contract sections, plugin.json entry present and alphabetical,
  model-routing keys alphabetical, no internal-discovery violations). README
  cells remain accurate (no patch edit needed). Done-when gate green: both
  `execute-phase:feature` (9516/655) and `execute-phase:final-pr` (9378/646)
  pass below baseline.
- Remains: P4 — Review-to-audit boundary (see TASKS.md P4).
- Gotchas: SKILL.md step-3 conditional edit pushed the main estimate to 2863
  (over 2800); ~113 bytes of prose were trimmed (single-pass unit summary,
  PR-URL contract parenthetical, step-2 wording) to land at 2799 — only 1 est
  of headroom, so future SKILL.md edits must stay small.
- Files: skills/execute-phase/SKILL.md, skills/execute-phase/references/WORKFLOWS_FEATURE.md,
  skills/execute-phase/references/WORKFLOWS_SMALL_PHASED.md,
  skills/execute-phase/references/WORKFLOWS_FIX.md, skills/execute-phase/references/WORKFLOWS_LEGACY.md,
  skills/execute-phase/references/WORKFLOWS.md (deleted),
  skills/execute-phase/references/FORGE_BODY.md (new),
  skills/execute-phase/references/DESCOPE.md (new),
  skills/execute-phase/references/OPPORTUNISTIC_FINDING.md (new),
  skills/execute-phase/references/ISSUE_POLICY.md (deleted),
  skills/execute-phase/references/PREFLIGHT.md,
  docs/workflow/SKILL_CONTEXT_BUDGETS.json, scripts/check-skill-context.mjs,
  scripts/check-skill-context.test.mjs (P3-4 blocks), scripts/dependency-gate.test.mjs (new),
  docs/features/21-workflow-contract-consolidation/{testing,decisions,progress}.md
- Next: P4 — Review-to-audit boundary | unit not finished

## P4 — 2026-08-05

- Done: Merge → synthesize rename (P4 task 1) — `review-change/SKILL.md` (2.9.1)
  gains the `--synthesize` / `--adversarial N` flags and removes `--merge`;
  `ADVERSARIAL_MERGE.md` git-moved to `ADVERSARIAL_SYNTHESIS.md` and rewritten;
  PORTABILITY.md updated; legacy `--merge` refuses with a fixed no-mutation
  migration message and stops before any git/forge mutation; AC 2 grep for the
  legacy flag/terminology exits clean.
- Done: Owning-pass contract + single classifier + debt transform (P4 task 2) —
  `review-implementation/SKILL.md` (1.4.0) becomes the ONE scope/classification
  engine consuming the synthesized table (Step 1 axis-coverage verification with
  a `coverage` finding; Step 2 classify via CLASSIFY.md); new
  `references/FIND.md` maps every review concern to one owning axis pass
  (review-code owns correctness/simplification/dead-code/duplication/arch/
  runtime-compat/rules, review-security, review-verify, review-perf, named
  design/a11y/brand/SEO); `review-debt/SKILL.md` (1.0.1 → 1.1.0) rewritten as a
  synthesized-table transform (does not rescan the diff, TRIGGER mandatory per
  item, current-unit mislabels flagged back, dead-code exception, fixed
  critical|major|minor block). `review-change` applicability matrix now lists
  only finders; classifier and debt transform are footnote as non-finder passes.
- Done: Current-unit classification contract (P4 task 3) — `CLASSIFY.md`
  rewritten to the D2/D3 contract: `ignore` first (false-positive claim), then
  current-unit classes fix-now / replan-in-unit / decision-required only
  (postpone/tradeoff/wontfix/disputed/new-issue forbidden for current-unit;
  approved trade-offs cited as evidence), then `proposal` for genuinely
  independent future capabilities (batched, user routes to triage-issue).
  Replan-in-unit phase-placement rule: insert new phases BEFORE the final
  Hardening & PR if not yet executed, else append AFTER it plus one fresh final
  Hardening & PR. `REVIEW_PROCESS.md` rewritten to 10 steps (route selection →
  SPEC drift → workflow discipline → finder passes (FIND only, fixed table +
  PASS|FAIL) → extras → synthesize (unclassified table, `# | Finding | Axis |
  Sev | Evidence | Suggested fix`, `Reviewers n/N` only in adversarial) →
  classify once → debt transform → manual checklist → route outcomes).
  `OUTPUT_AND_GUARDRAILS.md` routing rewritten (fix-now folds into the unit,
  never plan-fix/issue; proposals batched; postpone/tradeoff routing removed).
  Reviewer-prompt contract everywhere now returns `file:line | axis | Finding |
  Sev | Evidence` (no per-reviewer Class/WHY/Route); PERSIST_AND_DECIDE renumbered
  to steps 11–13 with D3 proposal routing; all step-number references consistent
  with the 10-step process; `node scripts/check-skill-context.mjs --routes` →
  PASS (16 routes; review-change routes grew to 9067 est/647 lines — no per-route
  cap, global per-file caps only); `node --test scripts/*.test.mjs` → 11 pass.
- Done: Route-manifest split for review-change (P4 task 4) — new
  `references/ADVERSARIAL_RECOMMENDATION.md` (32 L) holds the default route's only
  adversarial content: the 4-tick `--adversarial 2` recommendation checklist (L /
  sensitive surface / reviewing model not strongest-or-weaker-than-author / single
  family AND ≥M), the never-auto-detect model condition, and the fixed N ladder.
  `ADVERSARIAL_SETUP.md` (86 L, was 103) trimmed to the full roles/spawn contract
  (loads only for `--adversarial N`; N ladder pointer now to the recommendation
  file); `ADVERSARIAL_SYNTHESIS.md` stale "checklist above" cross-reference fixed.
  `docs/workflow/SKILL_CONTEXT_BUDGETS.json` gained explicit `references` arrays on
  all four review-change routes (precedent: execute-phase): default-backend/
  default-web = REVIEW_PROCESS + ADVERSARIAL_RECOMMENDATION + PERSIST_AND_DECIDE +
  OUTPUT_AND_GUARDRAILS; adversarial = + ADVERSARIAL_SETUP + ADVERSARIAL_SYNTHESIS;
  synthesize = REVIEW_PROCESS + ADVERSARIAL_SYNTHESIS + PERSIST_AND_DECIDE +
  OUTPUT_AND_GUARDRAILS. `SKILL.md` route table + allowlist now list seven linked
  paths with per-route SKIP column matching the manifests. Re-measured: default
  5 files / 6251 est / 451 lines, adversarial 6 / 7883 / 557, synthesize 5 / 6698 /
  471 (previously all four routes were identical 7 / 9067 / 647); SPEC done-when
  route pair + all 16 routes PASS, `node --test scripts/*.test.mjs` → 11 pass.
- Done: P4 task 5 — receipt contract + fake-forge fixture suite —
  `PERSIST_AND_DECIDE.md` gained step 13 "Post the final-review receipt" (D6/D7:
  one idempotent exact-SHA `REVIEW-PASS` PR comment through a temporary
  `--body-file`, fixed body with `<!-- review-change:pass sha=… contract=v1 -->`
  marker, newest matching marker wins, same-SHA skip, later commit → stale;
  `REVIEW-FAIL`/`NEEDS-DECISION` post no receipt) and renumbered to steps 11–14;
  step 14 next-blocks now branch on the three-state D10 decision
  `REVIEW-PASS | REVIEW-FAIL | NEEDS-DECISION` (NEEDS-DECISION blocks, no issue,
  re-run after the user decides). Report contract (step 12) + SKILL.md turn
  contract L25 + `ADVERSARIAL_SYNTHESIS`/`PORTABILITY` endings updated to the
  three-state vocabulary (per-pass binary `PASS | FAIL` in SKILL.md L95 /
  REVIEW_PROCESS.md L41 unchanged — distinct reviewer-pass verdict).
  `OUTPUT_AND_GUARDRAILS.md` routing + guardrails updated (Decision: three-state;
  new guardrail: receipt is a PR comment, never a commit). New
  `scripts/review-receipt.test.mjs` (12 tests, pure functions, zero forge
  spawns): exact marker/fields, --body-file (never inline --body), idempotent
  same-SHA skip, stale-SHA re-post, REVIEW-FAIL no receipt, NEEDS-DECISION no
  issue, no-PR checkpoint (D7), absent/stale/current statuses, markdown body
  integrity, purity, full fixture matrix. review-change bumped 2.9.1 → 2.10.0 +
  CHANGELOG/CHANGELOG.es rows. Gates: `node --test scripts/*.test.mjs` → 23 pass;
  `--routes` 16 PASS (review-change routes grew 6251→7118 est / 451→513 lines
  default, 7883→8770 / 557→620 adversarial, 6698→7585 / 471→534 synthesize —
  within globals).
- Remains: P4 tasks 6–7 + fixtures + commit (see TASKS.md P4).
- Gotchas: none new — the `gh` probe test was removed because `gh` is installed
  in this env; replaced by a purity assertion.
- Files: skills/review-change/SKILL.md (2.10.0),
  skills/review-change/references/{PERSIST_AND_DECIDE,OUTPUT_AND_GUARDRAILS,
  ADVERSARIAL_SYNTHESIS,PORTABILITY}.md, scripts/review-receipt.test.mjs (new),
  CHANGELOG.md, CHANGELOG.es.md,
  docs/features/21-workflow-contract-consolidation/{TASKS,progress}.md
- Next: P4 — task 6 audit-pr receipt-gated delivery-only refactor | unit not finished
- Done: P4 task 6 — audit-pr consumes the current receipt, delivery-only gates —
  `skills/audit-pr/SKILL.md` (4.2.0 → 4.3.0) Step 1 now reads the current
  `REVIEW-PASS` receipt (marker `<!-- review-change:pass sha=… contract=v1 -->`;
  absent/stale → BLOCKED blocker routed to `/review-change`, gates not evaluated,
  never a re-review); the audit no longer loads feature/fix templates, rescans
  review axes, judges test quality, remaps diff hunks to acceptance criteria, or
  reclassifies invariants. `01_MERGE_GATES.md` narrowed: `Acceptance coverage`
  (receipt-named, never diff-remap), `Tests` gate dropped, `Verification gate / CI`
  requires green rollup at current head, `Architectural invariants` mirrors the
  receipt's result (pass | blocker | n-a) without reclassifying;
  `03_AUDIT_PROCESS.md` step-6 `axis` example now `Review receipt`;
  `04_VERDICT.md` `→ Next:` gains the receipt-absent/stale blocker route;
  `05_ROUTING_AND_GUARDRAILS.md` rewritten (`n/a` invariant → pass, receipt
  blocker → merge blocker routed to the cited decision);
  `PORTABILITY.md` addendum — receipt consumption is comment-based and
  forge-independent. New `scripts/audit-pr-receipt.test.mjs` (11 tests, pure
  functions, zero forge spawns): current-receipt MERGE-READY, gate-fail BLOCKED,
  absent/stale receipt BLOCKED routed to `/review-change` (gates skipped), marker
  idempotence + newest-wins, `--body-file`-only comment, verdict/action matrix,
  purity. Gates: `node --test scripts/*.test.mjs` → 34 pass; `--routes` 16 PASS
  (audit-pr:feature/fix now 7 files / 7964 est / 517 lines, growth from the
  additive receipt contract — pre/post explanation recorded in P5 per AC 1/17).
- Done: P4 task 7 — downstream legacy vocabulary cleared (repository search clean)
  — `README.md`/`README.es.md`: `--merge` → `--synthesize` in the review-change
  row and the adversarial-review routing row; audit-pr rows updated to
  receipt-consumption wording (EN + ES); `docs/workflow/SKILLS.md` + `.es.md`:
  review-implementation row class set → `fix-now / replan-in-unit /
  decision-required / proposal`, review-change hands-off → `plan-fix (fix-now) /
  triage-issue (independent proposals)`, routing diagram line rewritten;
  `skills/fold-findings/SKILL.md` `Decision: FAIL` → `Decision: REVIEW-FAIL`;
  `REVIEW_AND_CLASSIFY.md` + `.es.md`, `FEATURE_WORKFLOW.md` + `.es.md`,
  `PORTABLE_PROMPT.md` + `.es.md` decision tables/routing rewritten to the D2/D3
  class set. Check: AC 2 grep for `--merge` in `skills/review-change
  docs/workflow` (excl. legacy/refusal) exits clean (exit 1); repo sweep finds no
  active `--merge` outside the fixed migration-refusal text and no stale
  review-classifier vocabulary outside CHANGELOG/GOLDEN_FIXTURE/REDESIGN history
  and `triage-issue`/`product-audit` own vocabularies.
- Remains: P5 — hardening, verification matrix + pre/post receipt-context
  explanation (AC 1/AC 17), commit.
- Next: P5 — run the repository verification matrix, record commands/exit codes
  in `testing.md`, then commit + PR + roadmap flip | unit not finished

## P5 — 2026-08-05

- **t1 — verification matrix executed and recorded (AC 18).** Ran and appended
  to `testing.md`: `node --test scripts/*.test.mjs` (34 pass / 0 fail),
  `node --test scripts/check-skill-context.test.mjs` (PASS),
  `node scripts/check-skill-context.mjs` (PASS context budgets: 33 skills),
  `node scripts/check-skill-context.mjs --routes` (PASS route budgets: 16
  routes), the P4 done-when 2-route check (PASS), `npx skills add . --list`
  (exit 0), the AC 2 `--merge` sweep (clean, exit 1), and `git diff --check`
  (clean). All exit 0.
- **t2 — before/after proxy totals recorded (AC 1/17).** Appended the full
  16-route before/after table to `testing.md` (P5-2), baseline vs final
  (measured via `node scripts/check-skill-context.mjs --routes`). All routes
  decreased except three, each explained per AC 1's "no coverage-related file
  omitted" rule: `review-change:adversarial` (+358 est / +15 lines, files
  7 → 6) — the P4 per-route manifest split recorded the adversarial route's
  true resource set (before P4 all four review-change routes were the identical
  7-file superset); `audit-pr:feature`/`audit-pr:fix` (+1112 est / +68 lines,
  files 7 → 7) — the AC 13 receipt-consumption contract is additive; every
  baseline coverage file still loads, the route stays far below per-file
  globals. 9→7 and 7→5 file drops come from per-route `references` arrays
  excluding non-loading portability/example/policy resources (AC 16).
- **t3 — weak-model golden fixture (AC 17).** Tool-calling smoke for
  `nan/qwen3.6` (weakest tool-capable model in this fleet: 3B active;
  deepseek-v4-flash is 21B, gemma4 is XML-tool-calling so it fails the
  OpenAI-schema smoke) returned `tool_calls`/`get_time`/`{}` — PASS. Three
  live text-reasoning runs fed verbatim contract text: audit-pr 4.3.0 Step 1 +
  Merge ownership (current receipt → consume, never re-review; absent/stale →
  BLOCKER → `/review-change`; never merges), review-change 2.10.0 receipt
  posting (exact body via `--body-file`, decision-gated posting, idempotent
  skip, three-state refusal of MERGE-READY), execute-phase 2.13.2 folding
  mini-cycle (7-step checklist in order, no premature resolved, proposal never
  becomes an issue, never auto-merges). Zero invented steps in all scenarios.
  Run-log row appended to `docs/workflow/GOLDEN_FIXTURE.md` (2026-08-05).
- **t4 — AC 16 surface sync completed.** Final sweep found and closed three
  gaps: (1) `CHANGELOG.es.md` lacked the `audit-pr` 4.3.0 row — added (EN row
  was present); (2) `MIGRATION.md` + `MIGRATION.es.md` lacked a feature-21
  migration note — added a dated 2026-08-05 section documenting the
  `review-change` ↔ `audit-pr` pair-upgrade requirement (old `review-change`
  leaves audit-pr 4.3.0 blocked with no marker at the head; never mix
  versions); (3) `GOLDEN_FIXTURE.es.md` + `docs/workflow/SKILLS.md` +
  `SKILLS.es.md` audit-pr rows were stale — ES run-log row added, and the
  SKILLS/ES audit-pr rows updated to receipt-consumption wording matching
  README. Verified clean: AC 2 `--merge` grep (exit 1), stale
  `Decision: FAIL`/`postpone`/`tradeoff` sweep (exit 1), no `ADVERSARIAL_MERGE`
  references remain anywhere, all `--synthesize`/`ADVERSARIAL_SYNTHESIS`
  references consistent, version frontmatter (audit-pr 4.3.0, review-change
  2.10.0, execute-phase 2.13.2) matches CHANGELOG EN/ES rows, route manifest
  references all resolve to existing files.
- **t5 — AC 18 local close-out run.** All commands exit 0, recorded in
  `testing.md` P5-1: `node scripts/check-skill-context.test.mjs`,
  `node scripts/check-skill-context.mjs`, `npx skills add . --list`,
  `node --test scripts/*.test.mjs` (34 pass), `node --test
  scripts/audit-pr-receipt.test.mjs` (11 pass), `node --test
  scripts/review-receipt.test.mjs`, `git diff --check`, plus the manual doc
  link/coherence checks (renamed-file references, bilingual parity).
- **t6 — PR opened and linked.** Pushed `feat/21-workflow-contract-consolidation` and opened **PR #121** (`https://github.com/gtrabanco/agentic-workflow/pull/121`, `gh pr create --body-file`, Markdown body with real backticks). Title: "feat(workflow): consume review receipt in audit-pr; consolidate workflow contracts". No feature issue exists (row 21 is user-requested), so the body notes "Closes roadmap row 21".
- **t7-8 — roadmap flip + link commit.** `docs/features/ROADMAP.md` row 21 flipped `planned` → `done · [#121](https://github.com/gtrabanco/agentic-workflow/pull/121)`, committed `docs: link PR #121` (`db3a8c6`), pushed. `git status --porcelain` empty; branch not ahead of remote.
- **Unit complete.** P1–P5 all done: measured route tooling, planning/execution consolidation, review-to-audit boundary with SHA-bound receipt consumption, full P5 hardening. Done-when (`node scripts/check-skill-context.test.mjs && node scripts/check-skill-context.mjs && npx skills add . --list`) all exit 0 with golden evidence recorded.
- Next: `/review-change` on the merged-unit surface of PR #121 (accumulation > 400 lines / > 8 files) → `/audit-pr` for the merge gate | unit finished
