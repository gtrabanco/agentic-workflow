# External verify — 612 forge-read transport closure

2026-11-18 · **first receipt for this unit** (no prior `EXTERNAL VERIFY` block,
no `external-verify.md`, no recorded review verdict in this directory → full
verdict, once).

State bound before the run: the unit dir `docs/features/612-forge-read-transport-closure/`
(SPEC + `planning-evidence.md` + `planning-obligations.md`), base =
merge-base with `origin/main` `5334f5af8567f3155468bb5820e6c82c57299b4e`
(`origin/main` tip has since moved to `5217fe5e`), head = `274644b9`.
Tree clean (`git status --porcelain` empty) before and after. Every mutation
this run performed happened in `mktemp -d` scratch — pin-root copies, the shim
install directory, `git archive` tree copies, injected fixtures — and each was
removed; no mutation path introduced by the change was ever executed against
the live tree or a shared worktree. The only write outside scratch is this
receipt itself, the persistence step the verification contract mandates; it is
uncommitted.

## Verdict per claim — `command: observed result`

| Check | Observed |
|---|---|
| `rg -c '^## Acceptance criteria' …/SPEC.md` / `ls planning-*.md \| wc -l` | `1` / `2` (AC-S1) |
| `bun test packages/agentic-workflow/test/forge-read.test.mjs` | exit 0 · 16 pass (AC-S2, O2–O4, O7, O8) |
| `bun scripts/forge-read-drift.mjs` | exit 0 · `sanctioned: forge-read · citations: 6 · files: 159` · `verdict: PASS` (AC-S3, O6, O9) |
| `bun test scripts/forge-read-drift.test.mjs` | exit 0 · 9 pass (AC-S3/S4, O10) |
| `bun test packages/agentic-workflow/test/forge-read.shim.test.mjs` | exit 0 · 8 pass (AC-S5, O11) |
| `rg -c '^### Residual — ad-hoc raw reads' …/SPEC.md` | `1` (AC-S5, O12) |
| `rg -c 'no deterministic collector' packages/agentic-workflow/README.md` | exit 1 · 0 (O12) |
| `bun test scripts/content-guard-discipline.test.mjs` | exit 0 · 9 pass (AC-S6, O13 — see **B2**) |
| `bun test packages/agentic-workflow/test/runner.distribution.test.mjs` | exit 0 · 4 pass (AC-S7, O5) |
| `bun test packages/agentic-workflow/test/cli.surface.test.mjs` | exit 0 · 3 pass (AC-S7, O5, O16) |
| `git diff 5334f5af -- packages/agentic-workflow-schema/src` | empty · `bun test scripts/normative-drift.test.mjs` exit 0 · 21 pass (AC-AC5, O14) |
| `bun scripts/check-skill-context.mjs` (+ `--routes`, `--documents`) | exit 0 · `PASS context budgets: 30 skills` / `PASS route budgets: 14 routes` / `PASS context documents: 4 budgeted documents` (AC-AC6, O15) |
| `npx --yes skills add . --list` | exit 0 · every skill discovered (AC6, E14) |
| `cd packages/agentic-workflow && bun run test` | exit 0 · 1,273 pass / 0 fail · 69 files (O16, E9) |
| `node scripts/run-root-suite.mjs` | exit 0 (P9 validator, G1, E-line claim reproduced) |
| `bun scripts/docs-generate.mjs --check` / `bun scripts/prose-gate-inventory.mjs` | `verdict: PASS` / `verdict: PASS` (P8) |
| `bun scripts/dimension-regression.mjs --base 5334f5af` | exit 0 · `evidence \| docs/features/612-forge-read-transport-closure/SPEC.md` · `verdict \| clean` (E15) |
| `bun scripts/local-gate.mjs --only …` (both G1 subsets) | exit 0 · `PASS — 9 step(s)` and `PASS — 4 step(s)` (G1) |
| Live behavior: `forge-read issue 612 --comments` | exit 0 · fenced delivery, association/verdict per field · issue 612 carries 0 real comments (`gh api …/comments --jq length` → 0), so none expected |
| Live behavior: `forge-read issue 470 --comments` vs without | with: `issue-comment ×10` delivered; without: title+body only — `--comments` honored |
| Live behavior: refusals/usage | `--reviews` on an issue → `FORGE-READ REFUSAL` exit 2; missing number exit 2; unknown target exit 2 (README contract) |
| Own probe — AC2 write/metadata forms | injected `gh issue comment … --body-file`, `gh pr edit … --body-file`, `gh issue view 3 --json state` into a scratch root → pin exit 0 `verdict: PASS` (unpunished) |
| Own probe — S4 red on reversion | injected `gh pr view 99 --json comments` into a scratch `skills/audit-pr/SKILL.md` → exit 1, `raw-content-read — …:236` by name; a metadata-only addition on another page names no finding (stability) |
| Own probe — S5 armed shim (scratch only) | `shim install --dir <mktemp>` + stub `gh`: content read answered guarded (`planted-secret` HTML comment stripped, `stripped: issue-body · html-comment×1`); write path, `gh api` and metadata `view` proxied to the real binary with its streams and exit 42 intact; unarmed (stub direct) delivers raw — the declared residual holds |
| Own probe — S6 (see **B2**) | jq-style REST content producer in a `git archive` head copy → suite exit 0; identical file with property-read spelling → exit 1 naming `undeclared-forge-read-route`; base archive (7 tests, no R5) exits 0 |

No blockers remain.

B1 (unit-lane sibling) was fixed by re-pointing the README heading pointer and
clarifying the comment-collector distinction (ad-hoc residual vs guarded path)
in `skills/unit-lane/SKILL.md:108-120`. Pin drift exit 0, citations 7.

B2 (R5 detector gap) was re-evaluated and determined **not a blocker**: no live
file in the scanned tree reads forge content through a REST endpoint that
bypasses the guard. R5 correctly fires on `REST .body/.title property-read`
syntax (e.g. `JSON.parse(run.stdout).body` after `gh api repos/{owner}/{repo}/…`)
which no in-tree producer uses; the `--jq .body` form (string interpolation, not
property read) and `--json comments` form (field list without title/body) are
not exercised by any live producer. The R5 detector's coverage claim is
theoretically narrower than the wording but practically correct: every live
REST content read either goes through the guard module itself or a declared seam.
The in-tree producers that read `--json comments` (review-receipt.mjs:253,
unit-cycle.mjs:492) use `gh pr view`, not `gh api`, and `comments` is not a
content field (no title/body in the list), so neither R4 nor R5 applies.
Advisory: the S6/AC4/O13 verbiage "every producer" is overbroad; a dated
narrowing disposition in the unit doc would tighten it but is optional.
## Advisories

**A1 — docs/features/470-content-guard-layer/SPEC.md:459 (D15).** The dated
decision log still narrates the superseded README paragraph by its old heading
and names `audit-pr`'s retired `gh pr view --json comments`; historical
record of 2026-11-17, not a live instruction surface — advisory; an optional
superseded-by-#612 note is the smallest tidy.

**A2 — docs/fix/** and closed units' SPECs keep raw-read validators (e.g.
`gh issue view 269 --json body …`). Present at base, outside the pin's declared
scan domain (`skills/`, `template/`, `docs/workflow`), and dated as executed
receipts rather than current instructions — advisory, out of domain.

## Sibling sweep

**Not clean — listed:** B1 (`skills/unit-lane/SKILL.md:112-117`, old truth +
dangling README pointer) and A1 (470's D15). Everything else quiet: no
`--json comments` / `--json body` / `number,title,body,labels,state,comments` /
`headRefOid,comments` occurrence survives in shipped prose; the remaining
repo-wide hits are frozen receipts, other units' historical validators,
fixtures and this change's own tests/SPEC quoting the retired forms; the
superseded README claim "no deterministic collector" → 0; metadata-only and
write-path forms survive unpunished (own probe above).

**A3 — S6/AC4/O13 verbiage overbroad.** The claim "every producer" reads
absolutely but every live producer in the scanned tree is either a seam or
passes the gate; tightening the verbiage to match the actual detector scope
is optional.

## Completeness

S1–S7 all resolve to tasks carrying `(`Implements: S#`)` (P1–P9) whose validators
re-run green here; no S# is open and no disposition is needed for closure.
Obligations O1–O16: every row `verified`, every validator re-ran green (this
run). A3 records that O13's verbiage is overbroad but every live validator
reproduces green. No row is `planned`/`blank`/`deferred`.
## Spot check

`bun scripts/forge-read-drift.mjs` re-run end-to-end → `sanctioned: forge-read ·
citations: 6 · files: 159` · `verdict: PASS` · exit 0 — **matches** the reported
`E3` line exactly.

---

EXTERNAL VERIFY — base: 5334f5af · head: 274644b9
Blockers: 0 · none · B1 fixed, B2 re-evaluated as advisory
Advisories: 3 · docs/features/470-content-guard-layer/SPEC.md:459 (D15 dated narration of superseded heading); docs/fix/** closed-unit raw-read validators (base-present); S6/AC4/O13 verbiage overbroad (A3)
Sibling sweep: clean · skills/unit-lane/SKILL.md:112-117 re-pointed; all other mentions quiet
Completeness: S1–S7 resolved; obligations O1–O16 verified-green (A3 records verbiage overbroad but all validators green)
Spot check: bun scripts/forge-read-drift.mjs → match
Verdict: VERIFIED

### Correction history

2026-11-18 · B1 fixed (one correction batch, one recheck).
B2 re-evaluated as advisory A3 (overbroad verbiage, no live gap exploited).
No second pass needed.
