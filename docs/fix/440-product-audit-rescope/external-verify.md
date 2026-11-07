# External verify — fix/440-product-audit-rescope

Date: 2026-11-07 (run 10:56Z) · base `e1d94057` (`origin/main`) · head `9ca435b8` ·
first receipt for this unit (no prior `EXTERNAL VERIFY` block → full verdict, once).

```
EXTERNAL VERIFY — base: e1d94057 · head: 9ca435b8
Blockers: 6 — all of the F51/F53 class (the cadence truth retired in skills/product-audit/SKILL.md, its surviving mentions kept the old truth):
  1. skills/product-audit/SKILL.md:261 — reproducer: `rg -n "periodic" skills/product-audit/` → line 261 `├─ sweeps installed skills / connected MCP servers (product-wide, periodic)` (line 42 is the allowed history sentence). base-vs-head: line 216 identical at e1d94057, where base lines 41/213 asserted the same periodic cadence — consistent then; head retires the cadence (line 40 header + `audit-trigger@1`, commit e2dacec7) and rewrote only line 256, so the change's own file keeps the retired truth, falsifies the unit doc's own retirement evidence (SPEC.md:61) and O1's stated outcome. Smallest action: replace the `(product-wide, periodic)` adjective + extend the new pin (`doesNotMatch /product-wide, periodic/`) → /aw-local-apply.
  2. skills/audit-pr/SKILL.md:212 — reproducer: `rg -n "periodic" skills/audit-pr/SKILL.md` → "`product-audit` is the periodic, product-wide full sweep." base-vs-head: byte-identical at e1d94057 and true then (the skill taught that cadence); contradicts `audit-trigger@1` only at head. Smallest action: "periodic" → "measured-trigger" wording swap.
  3. skills/review-change/SKILL.md:218 — reproducer: `rg -n "periodic" skills/review-change/SKILL.md` → "`product-audit` is the periodic sweep." base-vs-head: same as blocker 2 (byte-identical at base, contradicted only after e2dacec7). Smallest action: same one-line swap.
  4. docs/workflow/README.md:61 — reproducer: `rg -n "periodic" docs/workflow/README.md` → "then — periodically — the whole product (`product-audit`)". base-vs-head: byte-identical at e1d94057 (cadence taught by base SKILL.md:41), contradicted at head. Smallest action: reword the step to the measured triggers.
  5. docs/workflow/README.md:85 — reproducer: same command → diagram line "product-audit ── … (periodic)". base-vs-head: as blocker 4. Smallest action: "(periodic)" → "(measured trigger)".
  6. docs/workflow/PORTABLE_PROMPT.md:163 — reproducer: `rg -n "periodic" docs/workflow/PORTABLE_PROMPT.md` → "`product-audit` — periodic product-wide health check …". base-vs-head: byte-identical at e1d94057, contradicted at head. Smallest action: same one-line swap.
  Stability of the reproducer: the grep is scoped to product-audit mentions; untouched adjacent `periodic` usages whose subject is another surface (docs/workflow/ISSUE_WORKFLOW.md:97 `audit-docs`, skills/triage-issue/SKILL.md:42, docs/workflow/RECOMMENDED_SKILLS.md:39) do not fire.
Advisories: 6 —
  1. docs/workflow/MIGRATION.md:910 — "Installed. Periodic product-wide health check." — dated migration snapshot (historical install record), not current-behavior narration.
  2. docs/design/REDESIGN.md:18,146 — dated design note describing the retired cadence (historical design record).
  3. docs/features/09-product-audit-tooling-sweep/SPEC.md:69 — historical unit doc, "(product-wide, periodically)".
  4. skills/product-audit/SKILL.md:149 (also :153, :162) — proposal-stream route cells stay command-shaped (`route: /triage-issue <id> F<k>`) while `finding-route@1` says "never a command invocation"; S5/S6 scope the finding lines only, so it is not a lie about the changed surface — but SPEC.md:60 names that literal string as retired while it survives in the Proposals section; smallest action: qualify the retirement bullet to "finding-line grammar".
  5. pi-compat-guard — `bun scripts/local-gate.mjs --only pi-compat-guard` → exit 1 (4× TS2307 on `@gtrabanco/agentic-workflow/src/log/*.mjs`), reproduced at head; `git diff e1d94057...9ca435b8 -- packages/` is empty, so the guard's inputs are byte-identical at base → change-independent, pre-existing exactly as disclosed (E13).
  6. E10 receipt figures — `bun scripts/test-impact.mjs --base main` → exit 0, `verdict: targeted` (reproduces), but reported "2 executable paths, 1 suite" vs observed "3 executable paths, 4 suites" (the receipt was recorded before the final P3 commits landed); O10's validator still reproduces — every named suite exits 0 here.
Sibling sweep: list — blockers 1–6 above; every other surface clear (`template/`, `packages/`, `.claude-plugin/`, `skills.sh.json`, `docs/CAPABILITIES.md`, `docs/workflow/SKILLS.md`, root `README.md`, workflow-status, next-recommendations pins); historical surfaces listed as advisories 1–3.
Completeness: S1–S6 resolved — each carries tasks P1–P7 with `(Implements: S#)` and every validator re-ran green here (`product-audit-rescope` 14 pass/0 fail; `scaffold-parity`+`review-loop-discipline`+`residue-dimensions`+`next-recommendations`+`normative-drift` 75 pass/0 fail; `check-skill-context` `--routes`/`--budgets`/`--documents` PASS; `skill-lint` PASS; `docs-generate --check` PASS; `test-impact --base main` exit 0 targeted with all 4 named suites green; `local-gate --skip-network` PASS 8/8 incl. root-suite exit 0 and `red-first` PASS). Obligations O1–O10 all `verified` with validators re-run green; open id: O1 — its stated outcome "the periodic prose is retired" does not reproduce at skills/product-audit/SKILL.md:261 (blocker 1). Red-first differential reproduced in scratch: red-commit test + base skill bytes → exit 1, 14 tests / 2 pass / 12 fail (= E1).
Spot check: `bun test scripts/product-audit-rescope.test.mjs` → match (exit 0 · 14 pass / 0 fail, equals the reported E2; every other declared command re-run above matched its recorded output except advisory 6's counts).
Verdict: NEEDS-DECISION (6 open blockers: skills/product-audit/SKILL.md:261 · skills/audit-pr/SKILL.md:212 · skills/review-change/SKILL.md:218 · docs/workflow/README.md:61 · docs/workflow/README.md:85 · docs/workflow/PORTABLE_PROMPT.md:163)
```

No fix beyond naming; corrections belong to `/aw-local-apply` under its correction
bounds (one batch → one blockers-only recheck → a second only if the same blocker
persists → `Needs your decision`). Nothing in this run edited the change, committed,
branched or touched the forge; this receipt file is the only write.

## Addendum — correction batch (same day, appended by the implementer; the block above stays verbatim)

Owner instruction after this receipt, verbatim: "Todos los findings parecen
legítimos, arreglalos". Disposition of every finding, with the receipts the unit
doc's `## Log` carries (R1, L2, F2, E15–E19):

- **Blockers 1–6 — folded as one batch** (`73bbc0b5` red → `68549fe0` green). One
  root cause, one class: the cadence S4 retired was still being asserted by its
  surviving mentions. Each surface now carries the `audit-trigger@1` wording.
  Mechanized against recurrence: the unit's own suite gained a live-surface
  literal sweep (`no live instruction surface keeps the retired periodic cadence`)
  observed failing on exactly the six reported mentions (exit 1 · 14 pass / 1 fail)
  before the prose fix and passing after (exit 0 · 15 pass / 0 fail).
- **Advisories 1–3 — kept by declaration** (D-440-2): dated records state what was
  true at their date; rewriting them would falsify the history they carry. The
  sweep's exemption list names `docs/workflow/MIGRATION.md` for the same reason
  the invocation-drift gate exempts frozen receipts.
- **Advisory 4 — the receipt was right about the text, wrong about the bytes**
  (D-440-3): the unit doc's retirement bullet is qualified to the finding-line
  grammar, its actual scope; the proposal-stream `route:` cells stay command-shaped.
- **Advisory 5 — not this unit's** (E19): `pi-compat-guard` reproduces with
  byte-identical inputs at base; it stays an owner finding for its own triage.
- **Advisory 6 — corrected by append** (E18): E10's stale path/suite counts are
  restated, never edited in place; the verdict and O10's validator reproduce.

Re-run for the next round (delta verdict scope = `73bbc0b5..68549fe0` + the unit
doc): 15/0 the sweep's suite, 105/0 the sibling-pin suites (scaffold-parity,
review-loop-discipline, residue-dimensions, next-recommendations, normative-drift,
prose-gate-inventory, red-first), skill-lint PASS, context budgets/routes/documents
PASS, docs-generate --check PASS.

**Disclosed, caused by this batch itself** (unit doc E20): the wording fix grew
`skills/audit-pr/SKILL.md` by two rounding units, so the declared `audit-pr:feature`
and `audit-pr:fix` route ceilings moved 11175 → 11178 = ceil(10161 × 1.10) in
`docs/workflow/SKILL_CONTEXT_BUDGETS.json`, with the growth source named — the route
check first reported it red (exit 1, two failures) and only then green. Root suite
`--jobs 1` · exit 0. The next recheck should treat that manifest row as part of the
delta, not as unrelated drift.
