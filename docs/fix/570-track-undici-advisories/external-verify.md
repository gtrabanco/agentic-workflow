# External verify — fix/570-track-undici-advisories

```text
EXTERNAL VERIFY — base: d1287c3d · head: 1fd379c1
Blockers: 2 — docs/fix/570-track-undici-advisories/SPEC.md:191, reproducer: `git archive d1287c3d` scratch + `node scripts/dependency-advisory-pass.mjs` → 8 `| undici |` rows (9 advisories incl. minimatch), base-vs-head: the claim "nine `undici` rows" exists only on this branch and contradicts the same doc's E4 ("the eight `undici` rows") and PE-002 (minimatch = only non-undici row); smallest action: "nine" → "eight" (nine advisories in total)
Blockers: 2 — docs/fix/570-track-undici-advisories/SPEC.md:466, reproducer: same base scratch + `bun test scripts/dependency-advisory-pass.test.mjs` → `20 pass / 0 fail`, base-vs-head: the claim "the 19 pre-existing cases" exists only on this branch and contradicts the same doc's E8 ("20 cases before this unit"); smallest action: "19" → "20"
Advisories: 2 — docs/fix/570-track-undici-advisories/SPEC.md:58, "one appended case" while two `test()` entries land (20 → 22; E8 names both): narrative Impact prose, defensible under D4's "one case" framing, hence advisory not blocker
Advisories: 2 — docs/audits/2-2026-11-16.md:27, F2 attributes all 5 report-only rows to undici (machine: 4 undici + minimatch): already present at base in a dated audit receipt — the miscount lineage blocker 1 inherited; belongs to the next audit's correction, not this unit
Sibling sweep: clean — live surfaces (pass receipt, ROADMAP row, docs/generated/units.md, journal fragment, manifests) all carry the new truth; surviving 8.10.2 / "4 blocking" mentions are dated historical receipts only (audits 1–2, docs/LOGS.md, fix/365/440/539 frozen evidence, unrelated beta@8.10.2 test fixtures), none asserting current state
Completeness: S1–S5 resolved (P1–P6, every validator re-ran green here); obligations O1–O8 verified with validators re-ran green here — open ids: none
Spot check: node scripts/dependency-advisory-pass.mjs (reported E4) → match — `186 packages resolved, 1 advisory, 0 blocking, 1 report-only`, minimatch row only, exit 0, stderr empty; base scratch run matches E3 verbatim (`9 advisories, 4 blocking, 5 report-only`)
Verdict: NEEDS-DECISION (SPEC.md:191, SPEC.md:466)
```

Date: 2026-11-16

Context for the next run (delta-verdict inputs):

- **Base binding.** `d1287c3d` is the unit's declared base and the PR merge-base.
  During verification `origin/main` advanced to `7116fa1f` (PRs #580/#581 —
  `scripts/local-gate.mjs` + its suite only). `package.json`, `bun.lock`,
  `scripts/dependency-advisory-pass.mjs` and its suite are **byte-identical**
  between `d1287c3d` and `7116fa1f`, so every base-side receipt re-derives
  unchanged; `origin/main` still resolves `undici@8.10.2`, so the fix remains
  necessary against current main.
- **Integration state.** PR #582 reports `mergeable: CONFLICTING`; `git merge-tree`
  confines the conflict to `docs/ROADMAP.md` and `docs/generated/units.md` —
  both sides inserted a row at the same position (the documented residual case).
  Integration is the owner/branch step per AGENTS.md; it is not a change-caused
  defect and does not alter the verdict above.
- **Commands observed (all green unless named).** `phase-lint` → `verdict PASS`,
  ac-hash recomputes to the frontmatter value; head pass → E4; base pass (scratch)
  → E3; `bun test scripts/dependency-advisory-pass.test.mjs` head → `22 pass`,
  base → `20 pass`, red commit `56451e61` → exit 1 / `21 pass, 1 fail` with the
  message naming the four GHSAs and the `8.12.2` floor (AC-S4, O2, O6);
  `bun install --frozen-lockfile` → `Checked 172 installs across 188 packages
  (no changes)`; `git diff --stat <base> -- packages/` and
  `scripts/dependency-advisory-pass.mjs` → empty; `rg -c '"undici"' packages/*/package.json`
  → no match; differential base-vs-head → only the count line and the eight
  `undici` rows, stderr byte-identical, exit 1 on the diff / 0 both receipts (P4);
  `docs-generate --check` → PASS; `roadmap-settle` → PASS (213 docs, 0 violations);
  `residual-classify --inventory --base d1287c3d` → `rows: []`;
  `ceremony tier classify` → `1 path(s) carry executable content`, `signals: []`;
  `local-gate` → `PASS — 19 step(s) in 557s`, exit 0, tree state unchanged
  before/after; package suites → 836 / 899 / 36 / 853 pass, 0 fail.
  Independent boundary probe (derived from AC-S4's wording, not the change's
  tests): `semverGt('8.12.2', v)` → fail for `8.12.1`/`8.10.2`, pass for
  `8.12.2`/`8.12.4`.
- **Discipline.** Read-only run: no commit, no push, no branch, no forge
  mutation; base/red proofs ran in `mktemp -d` scratch (removed after); the
  live tree was byte-identical before and after every step. This receipt file
  is written uncommitted, per the read-only mandate of the verifying command —
  `/aw-local-apply` (or the owner) commits it with the blocker corrections.
