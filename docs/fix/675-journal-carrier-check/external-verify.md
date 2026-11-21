# External verify — fix/675-journal-carrier-check

Receipts for the owner's external verification. Read-only pass: no commit, no
push, no branch, no forge mutation, no code edit; every mutating probe ran in
`mktemp -d` scratch (base-side copies via `git archive`, removed after).

Bound state: unit dir `docs/fix/675-journal-carrier-check/` (SPEC.md only — no
prior `external-verify.md`, no `EXTERNAL VERIFY` block, PR #677 → 0 reviews /
0 comments) → full verdict, once · base `origin/main` `278dff6c` (the
merge-base) · head `c012113b6` (pushed tip).

## 2026-11-21 — full verdict

```text
EXTERNAL VERIFY — base: 278dff6c · head: c012113b6 · 2026-11-21
Blockers: 3 —
1. docs/fix/675-journal-carrier-check/SPEC.md:103 (AC1's declared check; ## Impact :117, ## Surfaces :151) — reproducer: `git diff --name-only 278dff6c..HEAD` → 14 paths, of which four are named nowhere in ## Impact: `docs/fix/675-journal-carrier-check/SPEC.md`, `packages/agentic-workflow/src/journal/aggregate.d.mts`, `packages/agentic-workflow/test/journal.test.mjs`, `template/.agentic-workflow/journal.md` (the last also outside ## Surfaces' `packages/agentic-workflow` + `docs`). Base-vs-head: the AC and ## Impact are new in this change — neither exists at `278dff6c` — so the claim is change-caused and fails against this unit's own diff. Smallest action: add the four paths to ## Impact (and `template/` to ## Surfaces); the fix sits outside the `ac-hash`-frozen Acceptance-criteria section — /aw-local-apply.
2. docs/fix/675-journal-carrier-check/SPEC.md:276 (O10, status `verified`; with AC13 at :115 and ## Applicable tests at :202) — reproducer: `bun scripts/structural-sibling-pins.test.mjs` → exit 1, `error: Cannot use test outside of the test runner … structural-sibling-pins.test.mjs:49`, under the active bun 1.4.6-canary.1 AND under the repo's pinned `.bun-version` 1.4.4 (binary run in scratch), while the row claims "exits 0"; E6 (:302) records a different command — `bun test scripts/structural-sibling-pins.test.mjs` — which reproduces exactly here (exit 0 · 8 pass / 0 fail; `node --test …` likewise). Base-vs-head: the O10/AC13/Applicable-tests text is new (absent at `278dff6c`), while the direct-spelling's exit-1 is pre-existing behaviour of the unchanged file (`git diff 278dff6c..HEAD -- scripts/` is empty) — the defect is the claim, not the tool; the substance (nothing unpaired) holds. Smallest action: re-spell those three cells to `bun test scripts/structural-sibling-pins.test.mjs`, the command E6 recorded — /aw-local-apply.
3. docs/fix/675-journal-carrier-check/SPEC.md:280 (O14, status `in-progress`) — obligations closure: an `in-progress` row is a blocker, and the evidence is red at head: `bun scripts/local-gate.mjs --jobs 4 --no-bail` → exit 1, 18 of 20 steps green, `journal-carrier-check` exit 2 naming the live pair (`20261121T020442Z-feat-600-config-default-materialization-narrative-01a1fbaf-…md` and `20261121T114851Z-feat-600-config-default-materialization-narrative-01a1fbaf-…md`), while at base the same step is green (`journal aggregate --check` on that pair → exit 0, `{"ok":true,"checked":2}`). Change-caused but disclosed and dispositioned (## Known pre-existing issues :204/:221, D1, G1 :308, ## Next); the sanctioned clearing (`gh workflow run agentic-workflow-journal.yml --ref main` after the merge) has not run, so no verified row can exist yet. Smallest action: after the merge run the sanctioned aggregation, re-run the gate, record the before/after verdicts and flip O14 to `verified` — owner/forge step, /aw-local-apply cannot run it.
Advisories: 7 —
1. docs/fix/675-journal-carrier-check/SPEC.md:221 + gate step `worktree-guard` — `FINDING .worktrees/feat-667-review-pack-preamble-extraction — STALE: branch merged into origin/main`. Why advisory: another session's workspace in the primary checkout, identical at base, already disclosed in ## Known pre-existing issues; not change-caused.
2. docs/fix/675-journal-carrier-check/SPEC.md:307 (E11) — "all 7 ran green (E8)": the 7th derived entry is `packages/agentic-workflow/test/fixtures/tool-choice-corpus.json`, which cannot run as a suite (`bun test <json>` → exit 1, "Tests need .test…"); E8's six real suites all re-run green here (1, 17, 37, 18, 12, 8 pass). Why advisory: `scripts/test-impact.mjs` is untouched — pre-existing listing behaviour — and the substantive suites are green.
3. docs/fix/675-journal-carrier-check/SPEC.md:106 (AC4, second half) — "the `## Log` records both runs with their commit": the red run E1 (:294) carries `675d383da`, the green run E2 (:298) carries no SHA. Why advisory: red-first is independently re-verified here — `bun scripts/red-first.mjs` → `67 pair(s) · 0 finding(s) / verdict: PASS`, the red commit re-run in scratch → 27 pass / 8 fail exactly as E1 records, `git show 675d383da:…aggregate.mjs | rg -c superseded` → 0 matches — only the green run's SHA binding is missing from the receipt.
4. docs/fix/675-journal-carrier-check/SPEC.md:277 (O11) — the invariant claims the gate step fails "now also on an identity collision", but its validator (`bun test scripts/local-gate.test.mjs` → 62 pass ✓) exercises only the malformed fixture; the suite is untouched by this diff. Why advisory: the collision half is proven end-to-end — journal.test's CLI case, this verifier's scratch probe (exit 2, both names), and the live gate step run — only the named validator lacks the case.
5. packages/agentic-workflow/bin/agentic-workflow.mjs:123-131 — the CLI header describes `aggregate` / `aggregate --check` without the new entry-slot rule. Why advisory: it asserts no old truth (it never states a duplicate rule, and "re-running on an aggregated set is a no-op" already sat beside the already-present exception), so the sibling sweep stays clean; extending the docblock is optional currency.
6. packages/agentic-workflow/bin/agentic-workflow.mjs:1333 — the refusal header counts refusals, not files: a colliding slot prints `JOURNAL REFUSAL — 1 non-conforming fragment(s)` while the reason line names both files. Why advisory: exit 2 and both names on stderr are correct (AC2 ✓); cosmetic wording on the new path.
7. docs/fix/675-journal-carrier-check/SPEC.md:56 — "`S2`–`S11` are the issue's own words" while S12 (:92) and S13 (:95) are also verbatim issue bullets (issue #675 carries twelve asks; all twelve quotes compared verbatim against the fetched body). Why advisory: every quote is exact and L1 (:289) already says S1–S13 — only the intro's range is stale.
Sibling sweep: clean — no surviving mention asserts the old byte-coincidence truth. The rewritten carriers all carry the slot rule: packages/agentic-workflow/README.md:51 (command row), :374 (`entry-slot` row), :376 (`aggregate` row), :404 (`carrier-check` row), docs/workflow/GATE_INVENTORY.md:136, template/.agentic-workflow/journal.md:46; `.agentic-workflow/journal.md:12` defers to `journal-fragment-grammar@1` as one owner; `rg -n 'byte-identical|identical bytes|dedupe|in isolation' skills template docs packages scripts journal .github AGENTS.md` finds no live surface claiming the old duplicate rule — hits are the updated README row, bin:129 (advisory 5), and frozen historical unit docs quoting their own past receipts. Contract-text qualifier check over every removed/rewritten sentence (the three README rows, the gate-inventory row, the template paragraph, `aggregate.d.mts`, the `write.mjs` predicate, the `aggregate.mjs` header comment): no lost qualifier — "every", "never", "only", "before the first byte moves", the `.gitkeep` "ONE declared placeholder — skipped, never consumed" clause and "exit 0 conforming / 2 otherwise" all survive; every rewrite is additive; no rule flipped conditional↔absolute; `slug(…) !== "local"` → `isConversationSession(…)` is semantically identical (`SHARED_SESSION_SLUG = "local"`).
Completeness: S1–S13 resolved — S1→P5, S2→P2, S3→P3+P4, S4→P1, S5→P3, S6→P2, S7→P4, S8→P4, S9→P3, S10→P3, S11→P2, S12→P2, S13→P4+P5, each carrying `(Implements: S#)`; every task validator re-runs green here (journal 35/0, write 23/0, surfaces 11/0, local-gate suite 62/0, sibling-pins 8/0 under both sanctioned runners, check-skill-context --documents PASS, normative-drift 24/0, test-impact `targeted` with its six runnable suites green, docs-generate --check PASS, prose-gate-inventory PASS, red-first PASS, test-obligation-tags PASS, gate 18/20 with the two disclosed reds) | open ids: O14 (in-progress → blocker 3); O10's validator cell as written (blocker 2, its E6 evidence reproduces); O1–O9, O11–O13 all `verified` and re-run green.
Spot check: `bun test packages/agentic-workflow/test/journal.test.mjs` → 35 pass / 0 fail → match (E2 verbatim); companion re-run: `bun scripts/local-gate.mjs --jobs 4 --no-bail` → exit 1 with 18/20 and the same two disclosed reds as G1 (:308), live carrier + docs/LOGS.md sha256 byte-identical before/after the run.
Verdict: NEEDS-DECISION (3 open blockers — O14's clearing is an owner/forge step after merge; O10/AC13 and AC1 are unit-doc re-spellings for /aw-local-apply; no code behaviour is in question: every S2–S13 probe, my own and the suites', is green at head with its base side proven in mktemp -d scratch)
```

## Correction batch — 2026-11-21 (owner-ordered apply)

Owner instruction (verbatim): "Apply to this repository: triage and fix those
that deserve to fix but understand the context before fix and check you haven't
broke another different thing, if you have done, start the loop again until you
fixed full symbol/related stuff". The block above stays the point-in-time
verdict at base `278dff6c` · head `c012113b6`.

- **Folded — blockers 1-2, advisories 2-7.**
  - Blocker 1 (AC1) → `fbbc00cf0`: ## Impact names all 17 diff paths (the unit
doc + this receipt, `aggregate.d.mts`, the two suites, `bin/`, `template/`),
`## Surfaces` gains `template` + `scripts`; recheck `E14` → 17/17.
  - Blocker 2 (O10/AC13/Applicable tests) → `fbbc00cf0`: the validator is
re-spelled to `bun test scripts/structural-sibling-pins.test.mjs`, the command
E6 always recorded; recheck `E14` → exit 0 · 8 pass / 0 fail. `ac-hash`
re-pinned `cc1f99d1…` → `451a78df…` (AC change after freeze = plan repair,
DESIGN §Acceptance — command from that section).
  - Advisory 2 (E11) → folded as appended `E15` (the Log is append-only:
E11 keeps its record, the delta is declared; the 7th derived entry is a
non-suite fixture, the six runnable suites were green, 19/27 are green now).
  - Advisory 3 (AC4 green-run SHA) → `E16` binds the green run to `59de2b270`.
  - Advisory 4 (O11's uncovered half) → `4ff94dee7` adds the gate's
colliding-slot case; red at base (`0 !== 2`, `E12`), red pre-fix on the count,
green at head (`63 pass`, `E16`).
  - Advisory 5 (CLI docblock) + 6 (refusal count) → `4ff94dee7`: docblock
states the slot rule; the header counts refused FILES (malformed output
byte-identical vs base — `E13`; `journal.test`'s collision expectation moved
`1` → `${LIVE_PAIR.length}`, the contract the fix corrects, behavioural pins
untouched).
  - Advisory 7 (Specs intro range) → `fbbc00cf0`: `S2`–`S13`.
  - Session entry per §7 → `59de2b270` (mechanical fragment — the
conversation's narrative slot is this unit's own rule; `log-immutability`
PASS, 0 violations over the batch's range).
- **Not folded — blocker 3 (O14) and advisory 1.** O14's validator needs the
post-merge `gh workflow run agentic-workflow-journal.yml --ref main` to land its
aggregation PR; dispatching pre-merge would mutate the forge without an order
and a local consumption would violate `log-immutability`'s attribution model
(PE-006), so the row stays `in-progress` for the owner. Advisory 1 is another
session's stale worktree — the removal order is the owner's
(`docs/workflow/WORKTREES.md`).
- **Recheck (blockers-only, `E14` + `E16` + `G2`):** AC1 17/17 named ·
O10's validator 8/0 · full gate at `59de2b270` → 18/20 with only the two
disclosed reds, no new one; live carrier + `docs/LOGS.md` byte-identical across
the run; derived set 537/0 (19 suites) + 10 hook tests exit 0.
- **Open:** blocker 3 (O14) — owner/forge, after merge; advisory 1 — owner.
