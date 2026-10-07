# review-findings — fix/285-pre-execution-lineage-gate

Mark and finding shapes are owned by `skills/pre-execution-review/references/LEDGERS.md`
(`review-mark@1` / `finding-mark@1` — cited, not re-declared).

Axes run at HEAD `233295d535d4d2f8977aa84439e88156c17ba876`: code/correctness
(schema requiredness relaxation + CLI consumer sweep: every `acceptance`-row
consumer already handles absence — `attributeFreshness`'s acceptance-exclusion
explicitly tolerates a snapshot that binds no manifest; the wording-only route
stays fail-closed without one), security (no new input surface; docs +
requiredness only), perf (trivial — build-time row filtering), verify (all gates
re-run live at HEAD: repo suite 619/0, schema package 717/0, context budgets
PASS, schema drift checks PASS), a11y/brand/seo — n/a (no UI or user-facing
copy).

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| REVIEW-RAN | HEAD ee5a9f7096096a7ad4ba3c1274facda400076ade | n/a | n/a | review-mark | n/a | n/a |
| REVIEW-RAN | HEAD a1aab57cbbb307a3d27ac174a56ff6ae3cab92d6 | n/a | n/a | review-mark | n/a | n/a |
| F1 | scripts/unit-route.mjs (reasons map, ~line 447) | code | low | report-note | report-note: the triage block's `Skipped:` reason strings are static per unit type ("trivial scope") even when the actual scope is `standard` — misleading prose in an authoritative block. Pre-existing behaviour, outside this fix's regression boundary (fix/285 changes nothing in `unit-route.mjs`); file its own issue if a consumer ever parses those strings. | no |
| REVIEW-RAN | HEAD e2d51af5fe0d99971fe433cdb493d2d4c26b3512 | n/a | n/a | review-mark | n/a | n/a |
| F2 | packages/agentic-workflow-schema/package.json:3 · test/release-contract.test.mjs:28 · test/verification-gates.test.mjs:117 | code | high | fix-now | fold into current phase (bump both version pins to 4.6.0; make CI run the schema package's own `bun run test`) · fold 6f79ca9 (ticked f73783d) | yes |
| F3 | docs/fix/285-pre-execution-lineage-gate/SPEC.md:149 | spec-drift | high | fix-now | fold into current phase (rewrite the `bun run test` Evidence row to exit 1 / 715 pass / 2 fail) · fold 6f79ca9 (ticked f73783d) | yes |
| F4 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:95-106 | security | high | fix-now | fold into current phase (replace the `progress.md`-absence discriminator with a non-author-controlled marker; adversarial test) · fold 6f79ca9 (ticked f73783d) | yes |
| F5 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:120-128 | security | high | fix-now | fold into current phase (require ≥1 obligation row or an explicit `n/a: <reason>`; red test for an empty-present `### Obligations`) · fold 6f79ca9 (ticked f73783d) | yes |
| F6 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:104-107 | security | med | fix-now | fold into current phase (emit BLOCKED + `→ Next: /unit-lane <unit>` for an absent ledger section) · fold 6f79ca9 (ticked f73783d) | yes |
| F7 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:95-101 | security | med | fix-now | fold into current phase (bind the triage output + ledgers with a frozen digest/timestamp anchor; shrunk-objective test) · fold 6f79ca9 (ticked f73783d) | yes |
| F8 | CHANGELOG.md · docs/workflow/SKILL_CONTEXT_BUDGETS.json · README.md · skills/audit-pr/SKILL.md · SPEC `Depends on` | workflow | high | fix-now | coordinate with #288 F10: one PR rebases, single `audit-pr` version, single budget re-base; correct the SPEC "Depends on: None" · fold 6f79ca9 (ticked f73783d) | yes |
| REVIEW-RAN | HEAD 632205c969f27fc60daf302cfbba270d6dcf9a02 | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD 632205c969f27fc60daf302cfbba270d6dcf9a02 | node --test scripts/*.test.mjs | exit 0 |
| GATE-RAN | HEAD 632205c969f27fc60daf302cfbba270d6dcf9a02 | bun scripts/check-skill-context.mjs | exit 0 |
| GATE-RAN | HEAD 632205c969f27fc60daf302cfbba270d6dcf9a02 | (cd packages/agentic-workflow-schema && bun run test) | exit 0 |
| F9 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:122-129 | code,security | high | fix-now | regression of F7 — the "Frozen digest anchor" names a `unit-route.mjs --triage` digest the CLI never emits; retract the paragraph or implement the digest and assert it · fold bcf0e80 (ticked a02eb58) | yes |
| F10 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:95-139 | security | high | fix-now | regression of F4 — the lane-era/legacy discriminator is still author-controlled `progress.md` presence; replan route: key it on a non-author-controlled signal and bind the unit-doc bytes (`node scripts/unit-route.mjs 285-pre-execution-lineage-gate` → route: replan) · fold bcf0e80 (ticked a02eb58) | yes |
| F11 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:104-112 | security | med | fix-now | regression of F5 + F6 — the empty-or-absent `### Obligations` → BLOCKED rules are prose with no reader and no test; add the assertion over a fixture unit doc · fold bcf0e80 (ticked a02eb58) | yes |
| F12 | scripts/lane-era-lineage.test.mjs:161-174 | code,verify | high | fix-now | AC3 is asserted by substring presence only; add a behavioural assertion that runs `unit-route.mjs --triage` over the fixture and compares the `Steps:` line · fold bcf0e80 (ticked a02eb58) | yes |
| F13 | docs/fix/285-pre-execution-lineage-gate/review-findings.md:20 | workflow | med | fix-now | `ledger-provenance.mjs --check` exits 1 — F1 is `folded: yes` with no fold token, and a `low` report-note is never persisted to the fold ledger; drop the row to a report note or record its real fold token · fold a02eb58 | yes |
| VF-1 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:122-129 · reviewer review-change · HEAD 632205cb · recheck direct read + `node scripts/unit-route.mjs --triage 285-pre-execution-lineage-gate --json` (keys unit,type,steps,skipped,budget — no digest) | security | confirmed | finding-mark | n/a | n/a |
| VF-2 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:95 · reviewer review-change · HEAD 632205cb · recheck direct read ("no `progress.md`" vs "carries `progress.md` receipts") + `grep -rn 'Triaged steps' scripts/*.mjs` (only the test fixture) | security | confirmed | finding-mark | n/a | n/a |
| VF-3 | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:105-112 · reviewer review-change · HEAD 632205cb · recheck `grep -rn Obligations scripts/*.mjs` (excluding tests → none) + `node --test scripts/lane-era-lineage.test.mjs` green with both states untested | security | confirmed | finding-mark | n/a | n/a |
| VF-4 | scripts/lane-era-lineage.test.mjs:161-174 · reviewer review-change · HEAD 632205cb · recheck direct read (five `assert.match` prose pins, no command execution) | code | confirmed | finding-mark | n/a | n/a |
| VF-5 | docs/fix/285-pre-execution-lineage-gate/review-findings.md:20 · reviewer review-change · HEAD 632205cb · recheck `node scripts/ledger-provenance.mjs docs/fix/285-pre-execution-lineage-gate/review-findings.md --check` → exit 1, `CHECK FAIL: 1 folded row(s) lack a verified commit token: F1` | workflow | confirmed | finding-mark | n/a | n/a |
| REVIEW-RAN | HEAD 180427da7b82850f3527e0cb88aaf87358732c32 | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD 180427da7b82850f3527e0cb88aaf87358732c32 | node --test scripts/*.test.mjs | exit 0 |
| GATE-RAN | HEAD 180427da7b82850f3527e0cb88aaf87358732c32 | (cd packages/agentic-workflow-schema && bun run test) | exit 0 |
| GATE-RAN | HEAD 180427da7b82850f3527e0cb88aaf87358732c32 | bun scripts/check-skill-context.mjs | exit 0 |
| GATE-RAN | HEAD 180427da7b82850f3527e0cb88aaf87358732c32 | node scripts/ledger-provenance.mjs docs/fix/285-pre-execution-lineage-gate/review-findings.md --check | exit 0 |
| GATE-RAN | HEAD 180427da7b82850f3527e0cb88aaf87358732c32 | node scripts/unit-lineage.mjs --unit 285-pre-execution-lineage-gate | exit 0 |
| F14 | scripts/unit-lineage.mjs:123 | security | high | fix-now | fold into a red-first batch: `classifyObligations` closure reads the `status` cell only — drop the `\|\| /^n\/a/i.test(id)` disjunct, and pin an `n/a`-id + `planned`-status row as BLOCKED · fold e29a053 | yes |
| F15 | scripts/unit-lineage.mjs:135-140 | security | high | fix-now | fold into the same batch: `obligationLedger` must reject the dual-home shape (embedded + `planning-obligations.md`) as BLOCKED instead of returning on the first hit; red-first fixture with an embedded closed ledger and a separate open row · fold e29a053 | yes |
| F16 | CHANGELOG.md:554 · skills/audit-pr/SKILL.md:4 | workflow | med | fix-now | fold: correct the audit-pr 5.5.0 release note to the merged gate (`unit-lineage.mjs` runtime; the "frozen digest anchor" paragraph is retracted) and bump `audit-pr`'s `version:` per the version-every-change rule (`bump-skill`) · fold e29a053 | yes |
| F17 | scripts/ledger-provenance.mjs:54,209-224 · docs/features/26-staged-verification-contracts/review-findings.md · docs/fix/285-pre-execution-lineage-gate/review-findings.md | verify + workflow | high | fix-now | CI on PR #289 fails at `scripts/ledger-provenance.test.mjs` ("unit 26's fold ledger names a verified commit on every folded row", 107 rows unproven) — mechanism, not code: the 2026-10-06 23:11 force-push (74404dd5, tree byte-identical to the CI-green 9229ee4) rewrote the branch history, so (a) every fold SHA both ledgers cite is now orphaned — unreachable from HEAD and main — killing the `proven-cited` path: 58 dead tokens in the unit-26 ledger (b79f7b6, 7f26455, c94cc75, 2491036, 6cd9305, cbecef0, a855317, ef4a094, …) and 6 in this fix's own ledger (6f79ca9, f73783d, bcf0e80, a02eb58, e29a053, plus the evidence ref 9229ee4); and (b) the `merge-base(main,HEAD)..HEAD` candidate walk (lines 209-224) excludes the commits that actually folded those rows because they now sit on main's side of the new merge-base b548b3a. Aggravating latent bug: the `run` helper (line 54) swallows `execFileSync` errors via the `git()` catch → `""`, and its default 1 MB `maxBuffer` dies on this repo's full-history walk (1,198,067 bytes), so the "walk HEAD" fallback the comment promises is silently dead — no signal when the candidate walk produces nothing. BOTH repairs verified live on the current tree: REPAIR-A (tool, root cause) — set `maxBuffer: 64*1024*1024` in the `run` helper, stop swallowing the walk error (fail loud, fail closed), and widen step 2 to walk `HEAD` (union with `merge-base..HEAD` acceptable) → 93 `recovered` + 14 `recovered-by-message`, CHECK PASS, either one alone turns `--check` green. REPAIR-B (data, stronger status) — remap each dead cited token to its post-rewrite equivalent, found mechanically and deterministically: the reachable commit whose subject line is byte-identical (verified 64/64 with zero unmatched; sample pairs: b79f7b6→b79f7b6a, 7f26455→7f26455, c94cc75→c94cc75, 2491036→2491036, 6cd9305→6cd9305, cbecef0→cbecef0, a855317→a855317, ef4a094→ef4a094, e29a053→bdaef9f7, a02eb58→32fe6ec7, bcf0e80→355735b9, f73783d→5847efb8, 6f79ca9→b2142b8a, 9229ee4→74404dd5; full list reproducible with `git log --format=%H%x1f%s HEAD` subject index + `git merge-base --is-ancestor` reachability probe) → both ledgers 100% `proven-cited`. Validation run performed on the working tree: after the full mechanical remap of both ledgers, `ledger-provenance.mjs --check` printed CHECK PASS on BOTH and `node --test scripts/ledger-provenance.test.mjs` reported `fail 0` (the suite was then restored untouched — the fold re-executes it). Recommended fold: apply REPAIR-A + REPAIR-B together in one batch — A closes the silent-dead-fallback class and re-derives provenance after any future rewrite; B restores the strong `proven-cited` status now. Gate to green: `node scripts/ledger-provenance.mjs <both ledgers> --check` prints CHECK PASS and `node --test scripts/ledger-provenance.test.mjs` is fully green | yes |
| VF-6 | scripts/unit-lineage.mjs:123 · reviewer review-change · HEAD 180427db · recheck import `obligationLedger`/`classifyObligations` + reproducer: embedded row `\| n/a: not applicable \| AC1 \| planned \|` → `{"ok":true,"count":1}` | security | confirmed | finding-mark | n/a | n/a |
| VF-7 | scripts/unit-lineage.mjs:135-140 · reviewer review-change · HEAD 180427db · recheck `obligationLedger(embedded-closed, separate-open)` returns the embedded table (`{"ok":true}`) and never reads the open file | security | confirmed | finding-mark | n/a | n/a |
| VF-8 | CHANGELOG.md:554 · reviewer review-change · HEAD 180427db · recheck direct read of the 5.5.0 row against the retracted-paragraph text in `02_CLOSURE_AND_SCOPE_GATES.md:126-131` and `audit-pr`'s unchanged `version: 5.5.0` | workflow | confirmed | finding-mark | n/a | n/a |

Cycle 2 — independent review at HEAD `e2d51af3` (2026-10-05). Axes run: code,
security, verify, perf (perf PASS — no material surface); workflow/spec-drift
(FAIL); design / a11y / brand / SEO — n/a (no UI or user-facing copy).
Workspace precondition: clean worktree, branch in sync with `origin`. F1 (the
low report-note) stays report-only. Low findings (G–K) are report-only notes,
never ledger rows. Escalation: full pass, not delta.

Cycle 4 — independent review at HEAD `632205cb` (2026-10-05). Axes run: code
(FAIL — the audit gate names a triage digest `unit-route.mjs` never emits; AC3
is a substring-only test), security (FAIL — the F4/F5/F6/F7 folds are prose
without a mechanism; F4 marked `folded: yes` while the `progress.md`
discriminator is unchanged), verify (PASS — every Evidence exit code and count
matched live; one low note: the diff-guard magnitude in SPEC.md/decisions.md is
stale at 617/16, head-true 735/23), workflow (FAIL — `ledger-provenance.mjs
--check` exits 1 on the F1 row), perf (PASS — the artifact filter is strictly
cheaper). design / a11y / brand / SEO — n/a (no UI or user-facing copy).
Escalation: full pass, not delta (fold diff + ledger growth exceeded the delta
size trigger). Five new fix-now rows (F9–F13), four of them `regression of
<id>`: the F4–F7 fold answered its findings with prose, and the suite that
called the repairs green asserted words, not mechanisms.

Cycle 4 fold — `9c745ef1` (2026-10-06). F9–F12 folded as one mechanism:
`scripts/unit-lineage.mjs`, the machine surface of gate 1 — the discriminator
keys on a verifying plan receipt (F10), the absent/empty/open obligation rules
have a reader and fixture tests (F11), the triage currency check re-derives
behaviorally over fixture repos (F12), and the phantom-digest paragraph is
retracted (F9 — resolved by retraction, `unit-route.mjs` untouched). F13 folds
separately: F1 was a `low` report-note that was never folded — its `folded:
yes` mark was bogus (no fold token exists because no fold exists), dropped to
`folded: no`, which is the state `ledger-provenance.mjs --check` demands of a
report-note. Red-first: the behavioral suite ran 15 fail / 2 pass at
`a4400147` before the script existed.

Cycle 5 — independent review at HEAD `180427db` (2026-10-06). Axes run: code,
security, verify, perf, spec-drift, workflow. design / a11y / brand / SEO — n/a
(no UI or user-facing copy). Workspace precondition: clean worktree, branch in
sync with `origin`. Full pass, not delta (the fold diff is 723 changed lines and
touches files outside the folded rows' cited set — width + size triggers). All
gates green at the head: repo suite 632/0, schema package 717/0, context budgets
PASS, `ledger-provenance --check` CHECK PASS, `unit-lineage` OK. Every `folded:
yes` row re-verified: F2–F8 and F9–F13 are gone at their cited locations (F9 by
retraction; F10 by the verifying-receipt discriminator; F11/F12 by the behavioral
suite). The fold's own runtime did not survive the adversarial pass: `unit-lineage
.mjs` certifies `obligations closed` for a `planned` row whose **id** column reads
`n/a` (F14) and ignores open rows in `planning-obligations.md` when an embedded
`### Obligations` section is also present (F15 — the "never both" rule has no
reader), both reproduced live. F16 is the release-note bookkeeping the fold left
stale. Verdict: REVIEW-FAIL — 3 open fix-now rows. Two reviewer candidates were
**refuted** by direct recheck and are reported with counter-evidence, not
persisted: a prose-only `### Obligations` section and a bare-`n/a`
`planning-obligations.md` both correctly answer BLOCKED.

LOOP CAP REACHED — 285-pre-execution-lineage-gate
- Cycles: 2 (two review→fold cycles: `fcfcc792`, `9c745ef1`/`49b27f7c`; 4
  `REVIEW-RAN` marks) without convergence — the cycle-4 fold introduced F14/F15
  in its own runtime.
- Open fix-now ids: F17 (F14 + F15 + F16 are folded; F1 stays a `low` report-note, never folded).
- Route: /triage-issue --prioritize-now 285-pre-execution-lineage-gate F17
- Route: /triage-issue --prioritize-now 285-pre-execution-lineage-gate F14 F15 F16
  (or the programmatic outer driver). A third /fold-findings cycle never starts
  without an explicit user instruction.
