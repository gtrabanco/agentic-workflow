# External verify — fix/702-ceremony-state-misreport

2026-11-23 — **first receipt for this unit** (no prior `EXTERNAL VERIFY` block
existed in this unit dir, so this is a full verdict, once). PR
[#709](https://github.com/gtrabanco/agentic-workflow/pull/709) was open with no
reviews at bind time; the target is the unit's own claims (S1–S10, AC1–AC10,
O1–O18).

Scope notes and disclosures:

- Every mutating probe (`ceremony findings append`/`update`, the fixture writes)
  ran only in `mktemp -d` scratch (`/tmp/ev702-uFknQx`, removed after this
  receipt). No mutating command was executed against the live tree or a shared
  worktree; the working tree was clean at close.
- The full `bun scripts/local-gate.mjs` was **not** executed: its
  `workspace-install` step mutates the shared install (the declared base-present
  red **A1**; G1/G2 carry its receipts). The gate's offline, read-only steps
  were run by hand at this head and all green: `version-parity-content`,
  `docs-generate --check`, `skill-context` (+ `--documents`), `journal aggregate
  --check`, `log-immutability`, `secret-scan`, `temp-hygiene`, `worktree-guard`,
  `rigidity-review`, `dimension-regression` (not-applicable without a push
  range). The network steps (`pi-compat-guard`, `dependency-pin-gate`,
  `dependency-advisories`) were not re-run (G2 recorded exit 0; network left at
  the verifier's discretion).
- Both crate legs re-ran green at the head: `bun run test` → 82/82 suites
  (EXIT 0) and `bun run test:node` → 82/82 (EXIT 0); schema bun and node legs →
  951 pass / 0 fail each. One earlier crate run in this session hit
  `doc.structure.test.mjs` SUITE TIMEOUT (240.1 s) under this session's own
  parallel root-suite contention; the clean re-runs are green (advisory A4).
- The field reproducers were re-derived from the `S#` wording in scratch against
  **both** sides: prose destroyed at base / preserved at head (S2), fold lines
  `F1`+`F2` at base vs `F1`+`F3` at head and next id `F15` at base vs `F4` at
  head (S3), silent dual/positional reads at base vs typed defects at head (S4),
  14 × `gate <name> failed` at base vs 13 × `unevaluatable: not-evaluated` +
  `gate gate-receipt failed: missing` at head, still BLOCKED (S5), prose-only
  section destroyed at base vs `carrier-table-missing` refusal at head (S7), and
  the usage-error-vs-silent-`failed` split for an out-of-vocabulary gate value
  (Retirements). The `ac-hash` matches the canonical `sectionText` bytes of the
  frozen Acceptance-criteria section.

```text
EXTERNAL VERIFY — base: 6dcfa53adc877a361bcc74515be1762867c1b916 · head: 893dad14c999699b195c96fa3bf00c18b9df5549
Blockers: 3 —
  B1 · docs/fix/702-ceremony-state-misreport/SPEC.md:108 (AC1) + :167 (Impact bullet) · reproducer: `git diff --name-only $(git merge-base origin/main HEAD)..HEAD` tested for literal membership in the `## Impact` section (SPEC.md:119-170) lists five shipped paths Impact never names — `.agentic-workflow/journal/20261123T224526Z-fix-702-ceremony-state-misreport-narrative-local.md`, `docs/workflow/SKILL_CONTEXT_BUDGETS.json`, `packages/agentic-workflow-schema/README.md`, `packages/agentic-workflow/test/runner.ceremony-p0.test.mjs`, `scripts/gate-receipt.test.mjs` — and Impact claims "the session entry in `docs/LOGS.md`" while `git diff --name-only … -- docs/LOGS.md` is empty (the session entry is the journal fragment; LOGS.md is written by a later aggregate run) · base-vs-head: the SPEC, the Impact claim and the fragment exist only at head (base carries no unit doc, so the claim cannot hold at base either) · smallest action: extend ## Impact to name the five paths and correct the `docs/LOGS.md` bullet to the journal fragment (Impact sits outside the ac-hash section — no re-freeze needed).
  B2 · docs/fix/702-ceremony-state-misreport/planning-obligations.md:26 (O16, status `verified`) · reproducer: `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap docs/ROADMAP.md read --nn 702` → exit 2 `EDIT REFUSAL — Unknown roadmap operation` (legal ops: rowUpsert, annotate, read, fixrow, check); the op-first form `roadmap read docs/ROADMAP.md --nn 702` → exit 0 and reports the `702` row · base-vs-head: the same refusal at base `6dcfa53ad` — the cell's stated outcome never reproduced, so the `verified` row fails the obligations-closure rule here · smallest action: restate O16's third command (and its evidence line) to the working order.
  B3 · skills/fold-findings/SKILL.md:62 (and :114) · reproducer: the sibling still asserts "every blocker is fix-now" and instructs "reconstruct rows from the verdict", while skills/audit-pr/references/03_AUDIT_PROCESS.md:36-41 now scopes fix-now persistence to blockers "whose outcome is `fail`" and routes `unevaluatable` blockers to the environment, persisting nothing · base-vs-head: at base both surfaces carried the same absolute (no contradiction); this change's rewrite creates the divergence · stability: fires only against the rewritten rule, never on untouched adjacent code · smallest action: scope the SKILL.md parenthetical to `fail`-outcome blockers and point `unevaluatable` at the environment route 03_AUDIT_PROCESS now names.
Advisories: 4 —
  A1 · docs/fix/147-audit-evidence-provenance/review-findings.md:3 and docs/features/17-finding-severity-routing/progress.md:81 keep the old absolute "`audit-pr` blockers are fix-now by definition" · why advisory: frozen history of settled units (rewriting them is out of this unit's scope), not a live contract surface.
  A2 · skills/audit-pr/references/03_AUDIT_PROCESS.md:36-41 flips the fold-persist rule from absolute ("Every blocker … is fix-now") to conditional ("whose outcome is `fail`") · why advisory: the flip is declared in ## Impact and entailed by S5/S10, but it changes what audit-pr persists and is not one of the two outcomes the Retirements section names — owner confirmation recommended.
  A3 · packages/agentic-workflow/src/audit-pr-gate/index.mjs:130 — a `skipped` gate's blocker line changes from base's `gate <name> failed` to `gate <name> skipped` (still blocking) · why advisory: within P6's "each gate's own outcome" intent, but an existing output change beyond the `unevaluatable` addition and not listed in Retirements.
  A4 · packages/agentic-workflow/test/doc.structure.test.mjs hit a 240.1 s SUITE TIMEOUT in one of this verification's own parallel runs (contention from this session's root-suite run, not the change) · why advisory: run-condition disclosure; clean bun and node re-runs are green (82/82 each).
Sibling sweep: list — B3's `skills/fold-findings/SKILL.md:62`/`:114` (blocker); A1's two historical carriers; otherwise clean: the crate README (`ceremony` + `audit-pr-gate` rows), schema README (`GATE_CHECK_STATUSES` row), `03_AUDIT_PROCESS.md`, `LEDGERS.md`, `GATE_INVENTORY.md`, the `normative-surfaces@1` and `rendered-facts@1` rows all state the new truth, no surviving "gate <name> failed"-for-an-unevaluated-gate claim on a live surface, no `unevaluable` misspelling, no surviving "append has no --id" / whole-section-rebuild / whole-doc-nextId claim.
Completeness: S1–S10 resolved — P1–P8 carry every `(Implements: S#)`, every task validator re-ran green here except P1's red-first record, which is a historical disposition (E1); obligations O1–O18 all `verified`, validators re-run green here except O16's third command (B2, open).
Spot check: `bun scripts/run-root-suite.mjs --jobs 4` → 139 PASS / 2 FAIL (`roadmap-settle`, `unit-doc-contract`) — equals G2's reported "139 PASS / 2 FAIL (A2, A3)" → match (also `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap check docs/fix/702-ceremony-state-misreport/SPEC.md --json` → `violations: []` = E9 → match).
Verdict: NEEDS-DECISION (B1, B2, B3)
```

---

## Correction batch recheck — 2026-11-24 (§9, one batch, blockers only)

Batch composition: red pin first (`ee1e28733`, `scripts/review-loop-discipline.test.mjs`,
0 pass / 1 fail observed at the pre-fix head), then the fixes — B1 re-declared the
shipped surface in the unit doc's `## Impact` (every diff path named literally; the
false `docs/LOGS.md` session-entry claim replaced by the journal-fragment carrier;
`## Retirements` now also declares A2/A3's two output changes), B2 restated O16's
validator cell to the working `roadmap read <path> --nn 702` order (reopened to
`planned`, flipped back only on the foreground run), B3 scoped
`skills/fold-findings/SKILL.md` beside its owner (`fail`-outcome blockers only;
`unevaluatable` routes to the environment) and pinned it.

Blocker rechecks:

- B1 → `git diff --name-only $(git merge-base origin/main HEAD)..HEAD` tested for
  literal membership in `## Impact` → **0 unnamed paths** (run at the batch head).
- B2 → `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap read docs/ROADMAP.md --nn 702`
  → **exit 0, row reported**; the cell's other two validators re-run: `docs-generate --check`
  → exit 0 (3 checked · 0 stale), `lint-changeset .changeset/702-ceremony-state-misreport.md`
  → exit 0 (ok). O16 stays `verified` on this run.
- B3 → `bun test scripts/review-loop-discipline.test.mjs` → **exit 0** (the scoped
  rule present, the pre-#702 absolute absent — the same file red at `ee1e28733`);
  `rg 'every blocker is fix-now' skills/` → 0 live hits.

Advisory dispositions (triaged under S1): A1 `wontfix` — settled units' frozen
history, barred by the unit's non-goals; A2 and A3 — fixed by declaring both
output changes in `## Retirements` (both are the requested surface, not reverted);
A4 `n/a` — a verifier run-condition disclosure.

Regression checks in the batch (S1's "haven't broke another different thing"):
`skill-lint` 0 findings · `check-skill-context` PASS (31 skills) ·
`test-obligation-tags` PASS (141 suites) · `bun test scripts/path-protection.test.mjs`
21 pass · `bun test scripts/roadmap-settle.test.mjs` — same base-present violation
only (A3) · `verify SPEC.md` VERIFY PASS · `journal aggregate --check` 0 refusals ·
`test-impact --base 893dad14c` → targeted, project gate fallback
`bun scripts/run-root-suite.mjs --jobs 4` → 139 PASS / 2 FAIL (A2, A3 — the receipt's
own base-present pair, no new red).
