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

## Blockers

**B1 — skills/unit-lane/SKILL.md:112-117 — sibling still asserts the old truth
(F51/F53 class).**
The paragraph states "it has no collector for comments", "it never sanitizes
what this prose tells you to go read", and points at the README boundary as
`*What the layer does not cover*`. The change renamed that section
(`packages/agentic-workflow/README.md:427` → "What the layer covers, and what
it still does not") and added the comment collector the sibling denies (README:
the guarded read "carries issue and PR titles, bodies, conversation comments,
reviews and inline review comments"). Reproducer:
`rg -c 'What the layer does not cover' packages/agentic-workflow/README.md`
→ base `5334f5af` = 1 (heading at base :426, sibling consistent), head = 0
(dangling pointer) plus the collector contradiction at README:434-439 vs
unit-lane:113. Stability: quiet everywhere else — only this unit's README
rewrite and forge-read seam make the sibling false; no untouched surface is
implicated (470's dated D15 repeats it, advisory A1). Smallest action
(`/aw-local-apply`): re-point the unit-lane paragraph — new section name, the
guard's comment collector through `runner forge-read`, keeping the unarmed
ad-hoc-read residual.

**B2 — scripts/content-guard-discipline.test.mjs:274-284 (R5 detector) falsifies
S6 / AC-S6 / AC4 / O13's absolute claim.**
Claim (S6/AC-S6): "a producer that reads a forge REST content field outside the
guarded path fails the discipline gate by name"; AC4: "any gate/receipt/verdict
producer that ingests forge content outside the guarded path". Reproducer 1
(in-tree): `scripts/review-receipt.mjs:253` (`--json comments` → parses comment
bodies to verify `contract=v1` receipts) and `scripts/unit-cycle.mjs:492`
(`--json comments` → `comment.body` regex into the merge-ready gate decision)
are undeclared — neither in `SEAMS` nor `EXEMPT` — ingest unfiltered comment
content, and `bun test scripts/content-guard-discipline.test.mjs` exits 0, 9
pass, naming neither. Reproducer 2 (own producer): a verdict-style
`scripts/gate-verdict.mjs` reading `spawnSync("gh", ["api",
"repos/{owner}/{repo}/issues/1", "--jq", ".body"], …)` passes the head suite
(exit 0), while the property-read spelling (`JSON.parse(…).body`) fails exit 1
with `undeclared-forge-read-route` — R5 requires a `[A-Za-z0-9_$\])]\.(title|body)`
property read, so the `--jq` content filter and the `--json comments` view form
are invisible. Base-vs-head: R5 and the AC4/S6 claim are new at head (base
archive: 7 tests, no R5, exit 0 — no rule claimed this coverage at base); the
two producer files are byte-identical at base (untouched by this diff), so
their ungated bytes are inherited while the false claim is the change's own.
Stability: the detector extension pressures nothing else — existing `--jq`
uses live only in the exempt guard module and the declared seam. The obligation
whose stated outcome no longer reproduces: **O13** (its validator is green; its
rule is not absolute). Smallest action (`/aw-local-apply`): extend R5 to the
`--jq` content-filter and `--json comments` view forms and declare the two
marker-reader producers as explained exemptions (the `ceremony/pr.mjs`
pattern), or, if the scope is to be narrowed instead, record a dated narrowing
disposition on S6/AC-S6.

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

## Completeness

S1–S7 all resolve to tasks carrying `(Implements: S#)` (P1–P9) whose validators
re-run green here; no S# is open and no disposition is needed for closure —
with B2 recording that S6's green validator does not prove its absolute
wording. Obligations O1–O16: every row `verified`, every validator re-ran green
(this run); **O13 named in B2** (stated outcome not absolute-reproducing). No
row is `planned`/`blank`/`deferred`.

## Spot check

`bun scripts/forge-read-drift.mjs` re-run end-to-end → `sanctioned: forge-read ·
citations: 6 · files: 159` · `verdict: PASS` · exit 0 — **matches** the reported
`E3` line exactly.

---

EXTERNAL VERIFY — base: 5334f5af · head: 274644b9
Blockers: 2 — (1) skills/unit-lane/SKILL.md:112-117 · reproducer: `rg -c 'What the layer does not cover' packages/agentic-workflow/README.md` → base 1 vs head 0 while README:434-439 declares the comment collector unit-lane:113 denies · base-vs-head: sibling consistent at 5334f5af, false after this change's README rewrite and forge-read seam · smallest action: re-point the paragraph (/aw-local-apply); (2) scripts/content-guard-discipline.test.mjs:274-284 · reproducer: head suite exit 0 while scripts/review-receipt.mjs:253 and scripts/unit-cycle.mjs:492 ingest `gh pr view --json comments` undeclared, and a jq-style `gh api … --jq .body` verdict producer passes where the property spelling fails `undeclared-forge-read-route` · base-vs-head: R5/AC4/S6 are new at head (base suite 7 tests, no R5, exit 0); the two producer files byte-identical at base, the false claim is the change's; O13 named · smallest action: extend R5 to the jq/`--json comments` forms and declare the marker readers with reasons, or record a dated narrowing on S6 (/aw-local-apply).
Advisories: 2 — docs/features/470-content-guard-layer/SPEC.md:459 (dated D15 narrates the superseded README paragraph and a retired prose form — historical record, not a live surface); docs/fix/** and closed units' raw-read validators (base-present, outside the pin's declared scan domain, executed receipts).
Sibling sweep: not clean — skills/unit-lane/SKILL.md:112-117 (old truth + dangling README pointer, blocker B1); docs/features/470-content-guard-layer/SPEC.md:459 (advisory A1). All other mentions quiet.
Completeness: S1–S7 resolved (P1–P9, validators green here); obligations O1–O16 verified-green — O13 named in B2 (validator green, absolute claim not absolute-reproducing); open ids: none.
Spot check: bun scripts/forge-read-drift.mjs → match (E3 reproduced byte-for-byte).
Verdict: NEEDS-DECISION (B1, B2)
