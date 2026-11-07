# External verify — fix/432-model-memory-tier-0

2026-11-07

```text
EXTERNAL VERIFY — base: e1d94057a9204b02f2d7597e015f3855279f9a1c · head: 3e02d85c20ad6aec8f950e32eaede58ed4afaa11
Blockers: 1 — docs/fix/432-model-memory-tier-0/SPEC.md:253 · reproducer: read SPEC.md:253 ("The owner's external verify of 821b5af5 + dacf767c …; on approval, open the PR closing #432") against SPEC.md:248 (D3: approval "Okey", no findings, "The PR was opened") and `gh pr list --head feat/432-model-memory-tier-0` → #447 OPEN — the template defines `## Next` as "the single next action", and the sentence names only already-completed actions · base-vs-head: SPEC.md does not exist at e1d94057; commit 7b4e38f1 added the D3 line three lines above the stale `## Next` in the same file while registering the PR-open state in ROADMAP.md and docs/generated/units.md — the state fix landed in three surfaces and its sibling section kept the old truth (F51/F53 class) · smallest action: rewrite `## Next` to the actual single next action (review/merge PR #447) — route to /aw-local-apply
Advisories: 5 — 1) docs/fix/432-model-memory-tier-0/SPEC.md:47: Impact claims "its orient tiers name model memory as never tier-0", but DESIGN.md's orient tiers (Stage 2, DESIGN.md:81-93) never mention model memory — the ceiling lives in §Provenance (DESIGN.md:48-61); imprecise diff description, the rule text itself ships and is suite-pinned · 2) docs/fix/432-model-memory-tier-0/SPEC.md:164 (PE-001) and the Known-issues bullet claim "86 root suites / 86 PASS"; scripts/ carries 87 *.test.mjs at base and head (identical set, no test file added), observed head run = 87 PASS / 0 FAIL — the count does not reproduce, the green/0-FAIL substance does · 3) docs/fix/432-model-memory-tier-0/SPEC.md:71-72: the Retirements search note says the DESIGN/PLAN journal tables are the only `certainty` carriers, but the literal `rg -n certainty skills/ docs/` matches 33 files; the normative vocabulary spelling (`confirmed / inferred / unknown`) is indeed only in DESIGN.md+PLAN.md and the rest are other units' frozen ledgers (base-present) · 4) docs/LOGS.md:4588: the session entry's `Next:` still reads pre-approval — a dated append-only journal snapshot written before approval; corrections there are new entries, never edits, so the next log-session entry supersedes it · 5) the old 4-column journal shape survives in other units' frozen historical docs (docs/features/66-engram-memory-substrate/sources.md:3, docs/fix/303-investigate-orient-ask/BRIEF.md:16, docs/features/103-doc-currency/SPEC.md:156 et al.) — base-present historical evidence, no live normative surface carries it
Sibling sweep: list — blocker SPEC.md:253; advisories LOGS.md:4588 and the frozen-ledger 4-column residue; SPEC.md:125's old fragment name is accurate history about main (the rename ships only on this branch), no leftover "No fix is in flight" placeholder, live surfaces (skills/, docs/workflow/, template/, packages/) carry only the new 5-column provenance grammar, and prose-gate-inventory + docs-generate --check both resolve the new row
Completeness: S1-S5 resolved — every S# has (Implements: S#) tasks whose validators re-ran green here (knowledge-honesty suite 15/0, prose-gate-inventory PASS, budgets PASS, rg checks), S3's scriptable slice disposed in ## Future dated 2026-11-07; obligations O1-O13 all verified with re-run validators; open ids: none
Spot check: bun test scripts/knowledge-honesty-contract.test.mjs → match (reported E2: 15 pass / 0 fail; observed: 15 pass / 0 fail; base copy in scratch: 9 pass / 0 fail, red commit 17c65d12: 9 pass / 6 fail)
Verdict: NEEDS-DECISION (docs/fix/432-model-memory-tier-0/SPEC.md:253)
```

## Correction batch — 2026-11-07 (implementer side, not a verdict)

Repaired in one batch against the receipt above; the owner's external verify of
the new head is still what closes the unit.

| item | route taken | observed |
|---|---|---|
| Blocker — stale `## Next` (`SPEC.md:253`) | rewritten to the single next action: the owner's verify of this batch, then merge PR #447 | `sed -n "/^## Next/,+2p" SPEC.md` → `…then merge [PR #447](…), which closes #432`; the literal reproducer `rg -n "on approval, open the PR" SPEC.md` still returns **1** match — `## Log` `E10` quotes the reproducer itself, so read the `## Next` block, never the raw count |
| Advisory 1 — Impact claimed the orient tiers name model memory | the claim was made true rather than deleted: DESIGN.md's Stage 2 **tier-0** row now excludes model memory (S1's own opening sentence lives at the tier that defines `tier-0`), and the Impact bullet names both the tier-0 row and § Provenance | `sed -n '81,93p' DESIGN.md \| rg -c "model memory"` → 1 |
| Advisory 2 — `PE-001` counted 86 root suites | corrected to 87 with the correction noted in the row; `scripts/` carries 87 `*.test.mjs` at base, pre-edit head and head | `rg -n "86 (root suites\|PASS)" SPEC.md` → no match |
| Advisory 3 — Retirements' search receipt did not reproduce | replaced with `rg -ln "confirmed / inferred / unknown" skills/ template/ packages/`, which returns exactly DESIGN.md + PLAN.md; the 33-file `certainty` hit set is other units' frozen records, excluded by construction | command reproduces the claim |
| Advisory 4 — stale `Next` at `docs/LOGS.md:4588` | a NEW carrier fragment (`.agentic-workflow/journal/20261107T113150Z-feat-432-model-memory-tier-0-narrative-local.md`) supersedes it; `docs/LOGS.md` untouched — the aggregator is its only writer while the carrier is opted in | `writeFragment` ok, `parseFragmentName` ok |
| Advisory 5 — other units' frozen 4-column design records | declined first (D4), then **ordered by the owner** and applied as a shape-only migration in a second batch (D5): 7 claim-journal files, 11 tables, 148 rows, additive and idempotent | see the second batch below |

A gate caught what the fixture set missed: the first `## Next` rewrite carried
PR #447's URL, and `scripts/roadmap-settle.test.mjs` refused it
(`pr-url-unsettled`). Repair routed through the same fixture first — the ROADMAP
Fixes row settles to the gate's own expected form `done · [#447](…)` and the
projection is regenerated by `bun scripts/docs-generate.mjs`.

## Second batch — advisory 5, applied on the owner's order (2026-11-07)

Shape migration of the claim journals behind advisories 1–4's grammar: the
`provenance` column added to 11 tables across 7 files (148 rows), plus the two
shape descriptions that spelled the old header. No claim, source or certainty
was touched — each file is byte-identical to its `HEAD` version once the added
cell and the dated note are stripped, and a second run of the migrator changes
nothing. Where the derivation could not be mechanical, the migration stops
rather than inventing cells: the three `### Planning evidence` tables still in
the retired 4-column shape are legacy ledgers of closed units, whose canonical
form is the six-column one, and `LEDGERS.md` forbids rewriting a legacy ledger
to migrate it. That residue is reported, not crossed (D6).

## Delta verdict — 2026-11-07 (second external verify, read-only)

Delta scope: the corrections after the previous receipt's head `3e02d85c` (`b50a6106`,
`530ed8eb`, `35fc6e1e`). That receipt's 1 blocker is closed and its 5 advisories are
closed or recorded; the delta mints two new blockers.

```text
EXTERNAL VERIFY — base: e1d94057a9204b02f2d7597e015f3855279f9a1c · head: 35fc6e1e698d37e693ab1ae3728263c68aba1b30
Blockers: 2 — B1 docs/features/67-serena-provisioning/sources.md:20 (same class: docs/features/66-engram-memory-substrate/sources.md:17, :20, :37) · reproducer: parse the migrated claim journals and read each row's provenance cell against its own first cited source — INV-003's source is `registry.npmjs.org/@bacnh85/pi-serena/latest` + `pi.dev/packages/@bacnh85/pi-serena` (fetched) yet the cell asserts `repository`, and 66's INV-002/INV-005/INV-022 assert `repository` for `cat ~/.pi/agent/mcp.json`, `curl -m4 :7437/health`, `~/.pi/agent/settings.json:24` + `gh issue view 219` — while DESIGN.md:58-61, the grammar this same branch ships, defines `repository` as "read from this repository" and forbids `confirmed` on anything not version-pinned ("never `latest`"); 66:17's own claim text says the provisioning is "machine-global … outside the workflow", so the cell contradicts the row it sits in · base-vs-head: `git show 3e02d85c:docs/features/67-serena-provisioning/sources.md` row INV-003 carries six columns and no provenance assertion at all (identical at e1d94057), so no false statement was possible there; `35fc6e1e` mints it · stability: fires only on cells `35fc6e1e` wrote — no other file in the tree carries a `provenance` cell, so it cannot fire on untouched code · smallest action: correct those four cells to an honest kind/ceiling (route to /aw-local-apply) · B2 docs/fix/432-model-memory-tier-0/SPEC.md:67-75 (`## Retirements`) · reproducer: read SPEC.md:70 ("no surface, token, helper, contract or narrative becomes obsolete") against SPEC.md:265 (D6 calls the same shape "the retired 4-column shape") and against the 148 rows now rewritten to the 5-column grammar — DESIGN.md:129-131 makes the retirement declaration a design deliverable ("each retired surface carries its replacement or no-consumer evidence", checklist DESIGN.md:270), so the section must name the retired shape, its replacement, and the survivors · base-vs-head: at 3e02d85c the sentence was true (nothing was made obsolete; the previous receipt classified the old shape as historical residue, advisory 5); `35fc6e1e` retired it and left the declaration unchanged — F51/F53 class, one surface fixed, its sibling section still asserting the old truth · smallest action: rewrite `## Retirements` (route to /aw-local-apply)
Advisories: 7 — A1 SPEC.md:4: the frontmatter `ac-hash: 6b7b62a1…` never matched the repo's documented recipe (`sed -n '/^## Acceptance criteria/,/^## /p' SPEC.md | git hash-object --stdin` → `43604f80…`) at any branch revision including the freeze commit `d391280b`; the AC section is byte-identical across the delta, so the freeze substance holds and only the recorded value is wrong — pre-existing at the previous receipt's head (that run missed it), hence advisory, not a delta regression; no script computes the hash, `docs-generate` only copies it. A2 SPEC.md:265 and the fragment `20261107T120858Z-…`: D6's boundary rests on a quote attributed to `LEDGERS.md` ("a legacy unit keeps the ledger it was written with and is never rewritten to migrate it"), but that sentence is LEDGERS.md:22-24 and is scoped to the **findings** carrier (`review-findings.md` vs the unit doc's `## Findings`), not to planning-evidence tables — D6's other reason (a fifth column would mint a third grammar; converting would invent `authority-kind`/`freshness` cells) stands alone. A3 docs/features/79-spec-by-reference/sources.md:65, :67, :76 (INV-004/INV-006/INV-015, provenance `owner answer`) records `#308`'s written decision "open units migrate at their next touch; closed units never" and "no closed/historical doc migration"; the second batch migrates seven closed units' journals on the owner's order (D5) and no row discloses the conflict with that precedent — the tier-0 rule this branch just strengthened (DESIGN.md:86, PLAN.md Stage 2) is exactly the check that would surface it. A4 SPEC.md:267-269 (`## Next`): still points at "the correction batch `## Log` records (`E10`–`E14`)"; the batch being verified now runs to E15/E16 with D5/D6 — the action named is still correct (owner verify, then merge PR #447; `gh pr view 447` → state OPEN, head `feat/432-model-memory-tier-0`, base `main`). A5 SPEC.md:40-66 (`## Impact`): still enumerates only the first batch's surface; the delta also touched 7 claim journals plus `docs/fix/303-investigate-orient-ask/BRIEF.md`, and Impact owns "the surface the executor must sweep". A6 DESIGN.md:58-61 + the migration note: the closed four-kind set has no kind for a fact read from the machine, a service or the forge this run, so the stated fallback ("anything else — path, command, git/gh receipt → repository") forces the label B1 complains of; three further rows (66:62 CLAIM-010, 66:67 CLAIM-015, 79:77 INV-016) obey the rule's letter while resting partly on `npm view` / `gh issue view`. A7 the delta's own records: the second fragment says "10 files" where the commit carries 11 (the enumeration omits 303/BRIEF.md), E12 juxtaposes "unit-lane 331 lines / 4,332 est, ceiling 322 / 4,528" (331/4,332 is SKILL.md's main measurement against ceilings 365/4,749; 322/4,528 is a reference ceiling — both checks PASS, the line reads as an over-ceiling claim), and E15's idempotency proof cannot be re-run from the tree because the migrator was never committed (its additivity half I reproduced independently: 11 tables / 148 rows compared against `3e02d85c`, 0 content drift once the `provenance` cell is dropped, 0 width mismatches, every value inside the closed four-kind set, 0 `model memory` + `confirmed` rows)
Sibling sweep: list — survivor: SPEC.md:67-75 (`## Retirements`, blocker B2); remaining old-shape mentions are accounted for — the three legacy `### Planning evidence` tables (353-residue-shadow-copies/SPEC.md:84, 375-release-notes-rendering/SPEC.md:104, 103-doc-currency/SPEC.md:156) are the six-column canonical shape's legacy instances named in D6, `CHANGELOG.md:747` is published history, and the two shape descriptions that spelled the old header (66/sources.md:3, 303/BRIEF.md:16) now state the five-column form; the live normative surfaces (skills/, template/, packages/, docs/workflow/) carry only the new grammar; `model-memory-provenance` still resolves at DESIGN.md:61; ROADMAP and `docs/generated/units.md` both carry `done · [#447]` and the fragment rename keeps both new fragments inside `journal-fragment-grammar@1`; no leftover "open the PR" instruction survives outside append-only history (the single `rg` hit for the old blocker phrase is the E10 log line quoting this receipt's own reproducer, and `docs/LOGS.md:4588` is an append-only journal snapshot superseded by the two new fragments)
Completeness: S1-S5 resolved — validators re-ran green here (`bun test scripts/knowledge-honesty-contract.test.mjs` 15/0; `node scripts/prose-gate-inventory.mjs` PASS; `bun scripts/check-skill-context.mjs` PASS 28 skills and `--documents` PASS 4; `bun scripts/skill-lint.mjs` 0 findings; attribution rg → 4 lines; `rg -l "sources\.md" scripts/*.mjs` non-test → no match; S3's scriptable slice disposed in `## Future`, `open`, dated 2026-11-07); obligations O1-O13 all `verified` and every stated outcome reproduces at this head (O13 re-run: `node scripts/run-root-suite.mjs` exit 0, 87 PASS / 0 FAIL); open ids: none — but the `## Findings` table is empty while these two blockers are open, so it owes the two rows
Spot check: `bun test scripts/knowledge-honesty-contract.test.mjs` → match (reported E2/E12/E16: 15 pass / 0 fail; observed: 15 pass / 0 fail; and `node scripts/run-root-suite.mjs` → match, 87 PASS / 0 FAIL exit 0 against E16's report)
Verdict: NEEDS-DECISION (2 open blockers)
```

Read-only mechanics of this run: no commit, no push, no branch, no forge write, no
code edit — only this append. Every command run against the live tree is a report or
`--check` mode (`docs-generate --check`, `prose-gate-inventory`, `roadmap-settle`,
`check-skill-context`, `skill-lint`, `lint-changeset`, the suites, and the crate
suites: `bun run test` 388 pass / 0 fail, `bun run test:node` 389 pass / 0 fail with
the two new fragments in the carrier). No mutation path introduced or rewritten by
this change was executed against the live tree; the scratch parsers lived in `/tmp`
and are deleted. `gh pr view 447` is a read.

## Triage of the delta verdict — 2026-11-07 (finding rows persisted, dispositions here)

The receipt's findings were triaged against the current tree with the published
vocabulary (`finding-severity-ladder@1`, `finding-impact@1`, `findings-table@1`).
Persisted to the unit doc's `## Findings` as F1–F7: B1 → F1, B2 → F2, A6 → F3 (the
decision that gates F1/F2/F5/F6), A1 → F4, A5 → F5, A4 → F6, A2 → F7.

Dispositions **not** persisted, because `report-only` never earns a correction round:

- advisory 3 (the `#308` prior-decision conflict) — **disproved as a blocker by
  re-reading the claim it cites.** `docs/features/79-spec-by-reference/sources.md:65,
  :67, :76` record a non-goal about the *unit-doc section shape* that `unit-route.mjs`
  must keep reading in both shapes; a `sources.md` column set is not that shape, and
  nothing parses these columns (PE-003 re-run here: `rg -l "sources\.md" scripts/*.mjs`
  non-test → no match; the root suite and both crate suites are green with the migrated
  files in the tree). The clash was by analogy, not by letter — my own receipt
  over-weighted it.
- the three mixed-source rows named in advisory 6 (`66/sources.md:62`, `:67`,
  `79/sources.md:77`) — each row's *first* cited source is in the repository, so they
  obey the stated mechanical rule; the rule's gap is F3, not these cells.
- advisory 7 (the "10 files" fragment count, E12's 331/322 juxtaposition, the
  unreproducible idempotency proof) — dated append-only records; correcting them means
  writing a new journal entry or committing the batch-2 migrator, which is the very
  surface F3 decides on. Recorded here, not repaired.

What triage did **not** do: no correction was applied (the fold and `/aw-local-apply`
own the repairs), no row was flipped, nothing was committed. The tree carries the two
receipt/ledger appends from this and the previous turn only.
