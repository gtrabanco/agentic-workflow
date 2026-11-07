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

---

# External verify — round 2 (blockers-only recheck of the correction batch)

Date: 2026-11-07 · base `e1d94057` (`origin/main`) · head `078895bb` · delta scope
`9ca435b8..078895bb` (the batch: `73bbc0b5` red → `68549fe0` green → `078895bb`
receipts) · corrections landed since R1 → **delta verdict**: the six blockers, the
delta diff, then the spot check.

**Independence disclosure (read this before trusting the verdict):** round 1 was
produced by a session that only verified; round 2 is produced by the session that
*implemented* the batch it is rechecking. The evidence below is reproduced from
commands, not from the earlier receipt, but the repo's own rule wants the end review
in a conversation that did not implement the change — so this round is
evidence-complete and not independence-clean. A fresh session re-running the delta
scope costs one command (`bun test scripts/product-audit-rescope.test.mjs`) plus the
sibling suites named in E22.

```
EXTERNAL VERIFY — base: e1d94057 · head: 078895bb
Blockers: 1 — .changeset/feat-440-product-audit-rescope-…md:2 — reproducer: derive the intent from the PR's own rule (PE-007: affected packages and skills come from the modified files) over `origin/main...HEAD` → 23 changed files, affected skills = `audit-pr, product-audit, review-change`; the file declared 1 entry. base-vs-head: at base `9ca435b8` the derivation named exactly `product-audit` and the file agreed (no defect); the batch added two skill surfaces in `68549fe0` and left the intent under-declared. Class: the F51/F53 shape in the other direction — the change landed on a surface its own release-intent record did not name. No gate catches it (`version-parity-gate --content` is satisfied by any declared entry of the Pi package's content source), which is why it needed a recheck. Smallest action: add the two entries → folded in `459ee056`, verified by `bun scripts/release.mjs plan` (audit-pr=minor, product-audit=minor, review-change=minor), `bun scripts/lint-changeset.mjs <file>` exit 0 `ok`, `node scripts/version-parity-gate.mjs --content` VERDICT: PASS.
  The six R1 blockers: all closed. Each of the six lines now carries the `audit-trigger@1` wording (SKILL.md:261, audit-pr:212, review-change:218, workflow/README.md:61+85, PORTABLE_PROMPT.md:163); an independent grep — not the sweep — returns no retired-cadence claim on any live surface outside the declared dated records; the sweep is non-vacuous (scratch copy with one literal planted → exit 1, the failure naming that file:line alone: 14 pass / 1 fail), removed after, nothing committed.
Advisories: 3 —
  1. README.md:119 / docs/workflow/SKILLS.md:171 — base stated product-audit was explicit-invocation-only and head replaced that clause with the trigger wording. Why advisory: the constraint is machine-owned (`user-invocable: true`, `disable-model-invocation: true`, and the issue's own non-goal "no scheduled calendar run"), so no live surface asserts the opposite; the narration lost a true qualifier rather than gaining a false one. Re-trigger condition: it becomes a blocker the moment a surface claims the audit self-fires (a scheduled driver, an autopilot row, a model-invocation route). Smallest action, if you want the clause back: one qualifier in front of "Measured-trigger" in those two rows.
  2. .changeset/374-pluggable-session-journal.md — `bun scripts/lint-changeset.mjs` reports `cites a repo path that does not exist: .agentic-workflow/journal-store/entries.db`. Why advisory: reproduced on a `git archive` copy of base `e1d94057` — pre-existing, and no gate runs the linter over the committed tree (only over fixtures). Belongs to #374's intent file, never to this unit.
  3. docs/workflow/SKILL_CONTEXT_BUDGETS.json:255/280 — the two re-basis rows quote the retired literal (`“product-audit` is the periodic, product-wide full sweep”) inside the growth source. Why advisory: a quoted before-value is history, not an order; the sweep's roots exclude `.json` by construction. Kept because the manifest's own contract is "name the growth source".
Sibling sweep: clean for the cadence class (the six mentions are gone from every live surface and the mechanized sweep now holds the line); the proposal-stream route cells are the only remaining `route: /triage-issue …` shape and are correct by D-440-3; dated records untouched (`git diff --name-only origin/main...HEAD` names none of MIGRATION.md / REDESIGN.md / CHANGELOG.md / docs/features/09-*).
Completeness: S1–S6 resolved (unchanged from R1); obligations O1–O10 all `verified` and re-checked — O1's frozen outcome ("the periodic prose is retired") now reproduces tree-wide, which is what R1 said it did not. Open ids: none. The append-only rule held: E10 and E17 are byte-identical to their pre-batch form; their corrections are the appended E18/E20 lines, and the only lines this doc removed in the batch are the retirement bullet and the `## Next` paragraph (prose, not receipts).
Spot check: bun test scripts/product-audit-rescope.test.mjs → match (exit 0 · 15 pass / 0 fail at 459ee056, and the round-1 receipt's 14-test figure is now correctly reported as 15 after the sweep case landed). Second spot check `bun test scripts/scaffold-parity.test.mjs` → match (exit 0 · 17 pass / 0 fail). Gate at head: `bun scripts/local-gate.mjs --skip-network` → exit 0 · PASS 8/8 · 88 root suites PASS.
Verdict: NEEDS-DECISION (1 open blocker) → closed in the same round by `459ee056`; the same blocker did not persist, so per the correction bounds no third round is owed. Merge decision is yours, ideally after an independence-clean pass on the delta scope.
```

## Addendum — round 3 (owner order: repair the reported items, and gate the intents)

Owner instruction, verbatim: "Repara los no plegados, los chageset deberían de tener
lint propio y determinista". Everything R2 reported but did not fold is now folded,
each with a deterministic gate behind it (unit doc L3, P4, E24–E26, F4, `## Scope
rider`):

| R2 item | disposition now |
|---|---|
| Advisory 1 — explicit-invocation qualifier dropped from the narration | **folded** (`708b37b0`): restored in `README.md` and `docs/workflow/SKILLS.md`, and pinned in `scripts/product-audit-rescope.test.mjs` against the frontmatter that owns the constraint (`user-invocable: true` + `disable-model-invocation: true`) — the pin is the class-closer, not the prose |
| Advisory 2 — #374's intent cites a path the tree never carried | **folded**: the body now states the store is created on first use under the project's `.agentic-workflow` directory (every other claim kept); the reason it existed at all is the missing gate below |
| Advisory 3 — the budget rows quoted the retired literal | **folded**: reworded to name the change without quoting it, so no live machine row carries the retired wording |
| R2 blocker (F3) — the intent under-declared the PR's own skill set | **now gate-caught**: `scripts/version-parity-gate.mjs` refuses `changeset-coverage` when the route is taken through skill entries that miss a touched skill; a package-level entry still covers the whole content source |
| "lint propio y determinista" | **shipped**: `scripts/lint-changeset.test.mjs` runs the existing fail-closed linter over this repository's committed `.changeset/` directory inside the root suite — the tool was always deterministic; nothing pointed it here |

Evidence (red `6f3a224a` → green `708b37b0`): the three new cases observed failing on
the current bytes first — the tree-lint case naming #374's file, the coverage case
because the rule did not yet exist, the narration case naming `README.md`; after the
implementation `bun test scripts/lint-changeset.test.mjs scripts/version-parity-gate.test.mjs
scripts/product-audit-rescope.test.mjs` · exit 0 · 82 pass / 0 fail, `bun scripts/lint-changeset.mjs`
· exit 0, `node scripts/version-parity-gate.mjs --content` · `VERDICT: PASS`, doc-shape suites
254 pass / 0 fail. Discrimination against this PR's real bytes (E26, in-memory, no live
mutation): shipped intent → `changeset-intent`; the intent truncated to its round-2 state →
`changeset-coverage`, naming `audit-pr, review-change`.

**Self-correction, by append:** E23 recorded `bun scripts/lint-changeset.mjs` as
"exit 0" — that reading came from the last command of a pipeline, not the script.
The linter is fail-closed: alone over that tree it exits 1. The claim E23 built on it
(no gate runs it over the committed tree) was true and is what round 3 closed.
