# External verify — fix/201-operator-approved-pass-routing

Date: 2026-11-08 · base `9e9b7be9` (`origin/main`) · head `37e5e01f` · first receipt
for this unit (no prior `EXTERNAL VERIFY` block → full verdict, once). Tree clean at
run time; free-text intent: none (full target). Disclosures: `bun scripts/local-gate.mjs`
(E16's "13 steps PASS") was not re-run end-to-end — its generator steps write build output
on the live tree (bundle staging, `tsc` dist, schema projections), which this read-only run
does not execute against the shared worktree; every constituent check was re-run instead and
is listed under Completeness. The unproven mutation path introduced by this change,
`resolve-passes`, ran only against `mktemp -d` fixtures (read-only producer, no network);
no live-tree mutation, no commit, no branch, no forge mutation — this receipt file is the
only write.

```
EXTERNAL VERIFY — base: 9e9b7be9 · head: 37e5e01f
Blockers: 3 —
  1. packages/agentic-workflow/src/passes/resolve.mjs:223 · reproducer: two-scope config where the project route overrides one key of a command route — global `{"commands":{"execute-phase":{"model":"qwen/qwen3-coder","thinking":"low"}}}` + project `{"commands":{"execute-phase":{"thinking":"high"}}}` → `node packages/agentic-workflow/bin/agentic-workflow.mjs resolve-passes --global g --project p` prints every pass as `spawn:inline · source:floor · reason:"…no pass entry, no passes.default, and no commands.execute-phase route…"` (the reason is false — a route exists in both scopes), while the loader's merge rule over the same two files (`mergeConfigs`, pi config) yields `commands["execute-phase"] = {model:"qwen/qwen3-coder", thinking:"high"}` — the configured cheap tier. The shallow `{...globalConfig.commands, ...projectConfig.commands}` replaces whole routes, so it contradicts AC3 "project wins, per the loader's merge rule" (SPEC.md:194) and O10's stated outcome (planning-obligations.md:19). · base-vs-head: `resolve.mjs` does not exist at 9e9b7be9 (`git cat-file -e 9e9b7be9:packages/agentic-workflow/src/passes/resolve.mjs` → absent); the loader's per-key `resolveRoute` loop is untouched context in this diff, so the rule existed at base and the new code violates it — stability: the reproducer fires only through the new `resolve-passes` path, quiet on pi's own merge and every untouched route · smallest action: merge `commands` routes per key (project key wins, else global) as `mergeConfigs` does → /aw-local-apply
  2. docs/fix/201-operator-approved-pass-routing/SPEC.md:223-224 (AC7, echoed by P5 SPEC.md:276 and O12 planning-obligations.md:21) · reproducer: read AC7 "roadmap row 45 and the Fixes-table row are written by the deterministic emitters (never hand-edited)" against the unit's own D3 (SPEC.md:366: "the `## Fixes` table row for #201 — the fix index has no row-writer" — hand-edited) and against ground truth: no writer can emit a Fixes row — `rowUpsert` requires a `| NN |` header (packages/agentic-workflow/src/edit/Roadmap.mjs:64), which the Fixes table (`| Issue | Topic | Status | Notes |`) does not have, and `scripts/roadmap-settle.mjs` writes roadmap rows only; O12's stated outcome "Fixes row via emitters" therefore does not reproduce. · base-vs-head: SPEC/ledger added in this branch (6c97dd22); no counterpart at 9e9b7be9 · smallest action: reword AC7/P5/O12 to the disclosed truth (row 45 via the emitter; the Fixes row hand-written because no writer exists — as D3 records) → /aw-local-apply
  3. docs/fix/358-adversarial-kill-mandate/planning-obligations.md:27 (O14 validator cells) · reproducer: `rg -c '#201' skills/review-change/references/ADVERSARIAL_SETUP.md` → 2 (cell asserts matches 1) and `rg -n 'resolve-passes' scripts/ packages/agentic-workflow/src skills/` → matches, exit 0 (cell asserts matches 0 / exit 1) — F51/F53 sibling class: this change rewrote ADVERSARIAL_SETUP.md's #201 paragraph and landed `resolve-passes`, so the closed unit's declared validators now encode the pre-#201 truth as their expected outcome. · base-vs-head: both green at 9e9b7be9 (`git grep -n resolve-passes 9e9b7be9 -- scripts packages/agentic-workflow/src skills/` → no matches; `#201` count → 1), red only at head; stability: fires only on this branch's added files and rewritten paragraph · smallest action: re-scope O14's validator cells to #358's own diff scope or date them "as of #358's merge" — the row's prose claim (nothing landed *here*) remains true → /aw-local-apply
Advisories: 3 —
  1. packages/agentic-workflow/src/passes/resolve.mjs:152,:237 — the resolver never applies pi's `default`-route fallback: a declared-but-model-less `commands.execute-phase` beside `default.model` resolves `floor` while `mergeConfigs` resolves the default model. Advisory because AC3's chain (SPEC.md:192-198) ends at `commands.execute-phase` → inline floor and never names `default`, and the direction is fail-closed (inline, recorded); partly absorbed by blocker 1's fix.
  2. docs/fix/358-adversarial-kill-mandate/planning-obligations.md:22 (O9's second validator half) — `git diff --name-only main -- scripts/ packages/…` at this head lists this branch's files, not "only the verdict layer's own files". Advisory: the half is a branch-scoped point-in-time diff receipt (its evidence cell is dated E12) rather than a content claim, and its content half still reproduces (`rg -c 'operator owns the rescue' …ADVERSARIAL_SETUP.md` → 1).
  3. docs/fix/201-operator-approved-pass-routing/SPEC.md:149 — "Applicable tests" names `config-merge.test.mjs` "(extended)", but that file is untouched by the change; the merge coverage landed in the new `test/config-merge-passes.test.mjs`, which AC2's check names correctly and re-ran green here. Advisory: planning-time inventory superseded by AC2's exact check, no behavior claim at stake; smallest action: repoint the row.
Sibling sweep: list — blocker 3 above plus advisory 2 (the only surviving old-truth mentions, both in fix/358's ledger); everything else clean: `Until it lands` is gone from every live surface (remaining hits are this unit's own quotes and docs/fix/360's unrelated classifier sentence), `rg -c '#201' skills/unit-lane/references/RELAY.md` → 1 and `#260|#201|#174` → 3 (feature 82's AC17/O15 still reproduce), review-change SKILL.md + ADVERSARIAL_SETUP.md state the landed config and record/statement rules, ROADMAP row 45 `in-progress · carried by fix #201` (pre-merge, per the status legend) and the Fixes row `done · #464` (PR OPEN, per the fix legend's "PR open, awaiting merge"), pi/crate/schema READMEs and the changeset document `passes`/`resolve-passes`, no surface still teaches the pre-#201 routing.
Completeness: S1, S2, S3, S1a, S1b, S2a, S2b all resolve to P1–P6 with `(Implements: S#)` and every declared validator re-ran green here — AC1/AC2 `bun test …/config-schema-passes.test.mjs …/config-merge-passes.test.mjs` → 14 pass · 0 fail; AC3/AC4 `bun test …/resolve-passes.test.mjs` → 19 pass · 0 fail plus a foreground golden run matching E5 (review-code → pinned/passes.review-code, verify → auto, classify → pinned/commands.review-change, review-security/debt → pinned/commands.execute-phase, empty config → inline/floor with reason) and refusals → exit 2 `PASSES REFUSAL`; AC5 `bun scripts/skill-lint.mjs` PASS (0 findings), `check-skill-context` PASS 29 skills / `--routes` 14 routes / `--documents` 4 documents; AC6 `bun test scripts/normative-drift.test.mjs` → 21 pass, schema `bun run test` → 775 pass; AC7 `bun scripts/docs-generate.mjs --check` PASS, `roadmap check …SPEC.md` → PASS 0 violations; AC8 pi `bun run test` → 624 pass, crate → 488 pass, `bun run test:node` → fail 0, `node scripts/run-root-suite.mjs` → exit 0; O11 differential spot-re-run vs `git archive 9e9b7be9` in mktemp → `log render --facts -` SAME (journal-name diff = clock second only) | open ids: O10 (stated cheap-tier outcome does not reproduce on blocker 1's input), O12 (stated "Fixes row via emitters" outcome falsified by D3 — blocker 2).
Spot check: `bun test packages/agentic-workflow/test/resolve-passes.test.mjs` → match (exit 0 · 19 pass · 0 fail, equals reported E4; E3's 14, E9's 21, E10's 624, E11's 488, E8's 775 also matched their recorded figures).
Verdict: NEEDS-DECISION (3 open blockers: packages/agentic-workflow/src/passes/resolve.mjs:223 · docs/fix/201-operator-approved-pass-routing/SPEC.md:223-224 (+O12) · docs/fix/358-adversarial-kill-mandate/planning-obligations.md:27)
```

No fix beyond naming the blocker and the smallest action; corrections belong to
`/aw-local-apply` under its own correction bounds (one batch → one blockers-only
recheck → a second only if the same blocker persists → `Needs your decision`).

## Addendum — correction batch (2026-11-08, owner-directed; the block above stays verbatim)

Owner instruction after this receipt, verbatim: "Apply to this repository: fix all
findings that can be probed as finding … annotate that plan to fix it and apply that
plan to fix it. Only do this for fixable stuff which means, triage first." Disposition
of every finding (triage first, then probe, then fix):

- **Blocker 1 — folded** (red `781005a1` → green `32f432aa`): `resolve.mjs` now merges
  the two scopes' command routes **per key** (`mergeCommandRoutes`), so a project
  thinking override keeps the global model and the configured cheap tier resolves
  instead of falling to the floor; a malformed route is carried unspread to the lazy
  validator so a selected malformed route still refuses. Probe re-run on the original
  reproducer: global `execute-phase {model,thinking}` + project `execute-phase
  {thinking}` → crate now `pinned · qwen/qwen3-coder · source commands.execute-phase`
  (was `inline · floor` with a false "no route" reason).
- **Blocker 1′ (triaged beside 1, new probe in the same block) — folded** (same
  commits): `"commands": "not-an-object"` used to exit 0 at the floor (silent
  fallback); it now refuses like `$.passes` — `PASSES REFUSAL — $.commands: must be
  an object mapping command names to routes`, exit 2. RED case landed in the same red
  commit; disclosed here because it postdates this receipt's corpus.
- **Blocker 2 — folded** (`6e23a424`): AC7/P5/O12 now state the truth D3 discloses
  (row 45 via the emitter; the Fixes row hand-written — no row-writer exists), and
  `ac-hash` was recomputed with the DESIGN.md `sectionText` recipe after proving the
  recipe against the frozen value (pre-edit recompute = `56b627e0…` byte-for-byte).
- **Blocker 3 — folded** (`6e23a424`): fix/358's O14 validators re-scoped from the
  pre-#201 repo-wide sweeps to fixed checks over #358's own merge — `rg -c '#201'`
  kept open-ended (≥ 1, observed 2), plus `git grep` sweeps of `5df5575d` for
  `resolve-passes` and the `"passes"` config key (both exit 1) with a positive
  control (3 files) so the sweep cannot pass vacuously; the row's claim ("lands
  here") is unchanged. The `git show --name-only` first attempt was caught passing
  vacuously (merge commit → empty combined diff) before it was written.
- **Advisory 1 — NOT fixed, decision-required**: the resolver never applies pi's
  `default`-route fallback (probe: global `default.model` + model-less declared
  `execute-phase` → crate floor vs loader pin). AC3's frozen chain ends at
  `commands.execute-phase` → inline floor and never names `default`, so applying the
  fallback would amend the frozen acceptance — owner to rule (chain amendment vs
  floor-as-written).
- **Advisory 2 — annotated** (`6e23a424`): fix/358 O9's `git diff main …` half is
  marked branch-scoped point-in-time (green at #358's head, red on any later branch);
  its content half re-run → 1.
- **Advisory 3 — folded** (`6e23a424`): SPEC's Applicable-tests row repointed to
  `config-merge-passes.test.mjs` (the file that actually carries the coverage).

§9 recheck, limited to the blockers' rows: `bun test …/resolve-passes.test.mjs` →
21 pass · 0 fail (E18); crate `bun run test` → 490 pass · 0 fail, `bun run test:node`
→ exit 0; pi `bun run test` → 624 pass · 0 fail; `bun scripts/docs-generate.mjs`
→ 0 written + `--check` PASS; `roadmap check` → 0 violations; fix/358's re-scoped
probes green with positive controls; `node scripts/run-root-suite.mjs` → exit 0
(E17–E19 in the unit `## Log`). Obligations: O10 and O12 reopened then re-`verified`
on those runs; every other row's validator re-ran green — no `planned` / `in-progress`
/ `deferred` / blank row remains. Open for the owner: advisory 1 (decision-required).
