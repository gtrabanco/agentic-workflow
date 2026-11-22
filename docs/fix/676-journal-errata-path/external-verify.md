# External verify — fix/676-journal-errata-path

Date: 2026-11-22 · base `55525abad` (merge-base with `origin/main` `55525abad`) ·
head `6f546ae03` · **first receipt for this unit** (no prior `EXTERNAL VERIFY`
block, no PR review on #685 → full verdict, once). Binding note: the owner's
session-close commit `6f546ae03` (one narrative fragment append) landed on the
branch mid-verification at 13:36 UTC and is unpushed; PR #685's head is
`5de664a86`. Read-only run: no `git commit`, no `git push`, no branch creation,
no forge mutation, no code edit — the only file written is this receipt
(uncommitted). All mutating probes (`journal write`, `journal aggregate`,
base-side copies) ran in `mktemp -d` scratch and were removed after; the live
tree was byte-clean (`git status --short` empty) after every run. Base-side
proofs ran against `git archive 55525abad` copies in scratch with `node_modules`
linked to this checkout (the base journal write path imports no schema symbol;
the head schema dist is additive-only over what base code reads).

Declared verification commands, re-run at head (`command: observed result`):

- `bun test packages/agentic-workflow/test/journal.write.test.mjs` → exit 0 · `31 pass / 0 fail` (E4).
- `bun test packages/agentic-workflow/test/journal.test.mjs` → exit 0 · `40 pass / 0 fail` (E3).
- `bun test packages/agentic-workflow/test/journal.surfaces.test.mjs journal.headless.test.mjs journal.driver.test.mjs` → exit 0 · `63 pass / 0 fail` (E5+E6: 12+51).
- `bun test scripts/log-immutability.test.mjs scripts/normative-drift.test.mjs scripts/vocabulary-parity.test.mjs scripts/structural-sibling-pins.test.mjs` → exit 0 · `90 pass / 0 fail` (E7+E9: 23+24+35+8).
- `bun test scripts/local-gate.test.mjs scripts/session-close.test.mjs` → exit 0 · `93 pass / 0 fail` (E8: 63+30).
- `bun scripts/log-immutability.mjs --base 55525abad` → exit 0 · `0 violations · range 12 commits`; `bun scripts/log-immutability.mjs` (default) → exit 0 (O10/O12).
- `git diff --name-only 55525abad..HEAD -- scripts/log-immutability.mjs docs/LOGS.md` → 0 lines (AC3/AC10/O12).
- `bun scripts/check-skill-context.mjs` → exit 0 · `PASS context budgets: 30 skills`, `log-session 3138 / 238` (spot check, matches E14); `--documents` → exit 0 · `PASS context documents: 7 budgeted documents`.
- `bun scripts/test-impact.mjs --base origin/main` → exit 0 · `13 executable paths + 4 symbols · 42 suites + 6 hook scripts`; the six `template/.agentic-workflow/hooks/tests/*.sh` → all exit 0 under `bash` (E13).
- `bun scripts/test-obligation-tags.mjs` → exit 0 · `137 suite(s) · 0 finding(s)` (E9); `bun scripts/lint-changeset.mjs` → exit 0; `bun scripts/version-parity-gate.mjs --content` and `--pins` → exit 0 (E16); `bun scripts/prose-gate-inventory.mjs` → exit 0 · `verdict: PASS` (E15).
- `bun packages/agentic-workflow/bin/agentic-workflow.mjs journal aggregate --check` (live carrier) → exit 0 · `{"ok":true,"checked":11}` (PE-012 at head); `docs-generate --check` → exit 0 · `PASS · 0 stale`; `phase-lint docs/fix/676-journal-errata-path/SPEC.md` → exit 0 · `PASS (6/6)`; `dimension-regression --base origin/main` → exit 0 · `20/20 · 1 changed surface · verdict clean` (E15/E18).
- Packages: `bun test test/journal-entry.test.mjs test/index.test.mjs` (schema) → exit 0 · `32 pass`; `bun run test:node` (schema) → exit 0; `bun run test` (agentic-workflow, bun) and `bun run test:node` (agentic-workflow, node) → exit 0 (all suites PASS); `bun run --cwd packages/pi-agentic-workflow test:node` → exit 0 · `1040 pass / 0 fail / 1 skip` (E11).
- Red corpus (O14/P1): `git show 8aa89f03e --stat` names only the two journal test files; the same two suites run against a `git archive 8aa89f03e` copy in scratch → `36 pass / 4 fail` and `23 pass / 7 fail` (11 red — E1 reproduced).
- `bun scripts/local-gate.mjs --jobs 4 --no-bail` → **FAILED**: root-suite red on `scripts/roadmap-settle.test.mjs` (B1), 5 dependent steps skipped. `bun scripts/run-root-suite.mjs` (fail-fast off) → **exit 1 · 136/137 PASS, 1 FAIL** — the only red is `roadmap-settle` (no suite killed; the disclosed `phase-lint` load bound did not fire in my runs).
- Gate steps re-run individually after B1's red: secret-scan, temp-hygiene, rigidity-review, worktree-guard, skill-context, dependency-advisory-pass, dimension-regression, journal-carrier-check, log-immutability, docs-generated-projection, skill-context-budgets → all exit 0. Not re-run by me: `workspace-install` (mutates `node_modules`; deps present, every suite green), `schema-build` as a command (dist proven current: the surfaces suite imports `dist/index.js` and asserts the new `JOURNAL_ERRATA_MARKERS` export, green), `tmp-gc` (a temp sweeper; run after this receipt's cleanup), `pi-compat-guard` (network tarball install; `packages/pi-agentic-workflow` src is code-identical to G1's green run — every commit after `97713b6d8` is docs/journal only).

Own probes (derived from the `S#` wording and the contract rows, not the
writer's tests; head bin vs `git archive 55525abad` bin, same fixtures, scratch):

- S2/S12 refusals: unflagged second same-slot write → exit 2 `already registered …` routing to `--supersedes <head>` (head) vs base exit 2 ending `, and another --session id is a different conversation` (tail dropped at head — advisory A1); hand-edit/delete still refused by `log-immutability` (suite, green).
- S6 boundaries: equal-second correction → exit 2 `not newer`; older second → exit 2; no `--session` → exit 2 `needs an explicit --session`; mechanical kind → exit 2 `applies to a narrative entry`; foreign target → exit 2; target not slot-head (fork) → exit 2 `must name the entry slot's newest fragment`; `--supersedes` vs supplied block disagreeing → exit 2 `the flag and the bytes must agree`.
- S6 landing: valid correction → exit 0, receipt carries `supersedes`, stale fragment's sha256 unchanged, new fragment carries exactly one `- **Supersedes:**` cell (173 bytes, matching E12).
- S11: `journal aggregate --check` green on the errata pair and moves no byte; `journal aggregate` lands the correction once (`appended:[correction]`, `superseded:[{stale, supersededBy}]`), LOGS holds the corrected text once and none of the stale text, carrier emptied.
- S11/S12 lint: undeclared pair → exit 2 naming both files; chain skipping its predecessor → exit 2 naming all three; two correction cells → exit 2 `declares 2 correction cells`; base side: the same errata pair → exit 2 at base, exit 0 at head (the asked-for difference); the undeclared pair → exit 2 on both sides (stability).
- B4 probe (contract vs behaviour): `journal write --kind narrative --content - --session s9` **without** `--supersedes`, block carrying `- **Supersedes:** <name>` → **exit 0**, cell lands, receipt has no `supersedes`; `journal aggregate --check` on that lone declaring fragment → **exit 0 `ok:true`**, though README's errata row, GATE_INVENTORY's `journal-carrier-check` row and decisions D2 all say the lint refuses a slot whose oldest fragment names something. At base the same input also lands and passes — but base publishes no such claim and has no reader (the cell was inert), so the falsified claim is change-caused.
- Contract-text qualifier check: every rewritten surface was compared line-by-line against base. Lost qualifiers: one — the writer refusal's trailing clause `, and another --session id is a different conversation` (advisory A1; the rule survives in the message's own scoping and README's `entry-slot` row). No conditional→absolute or absolute→conditional flip on a binding rule: `log-immutability`, "never edited and never deleted", "one entry per conversation per kind", "every file named" all survive; the `entry-slot` row's new `multi-fragment` scope and the `carrier-check` row's chain condition are the asked-for D2 rewrites (the changeset uses the correct `every other multi-fragment slot` wording). The SKILL box line's missing `if one existed` condition is advisory A2 (checklist prose, the prohibition itself unflipped).

```text
EXTERNAL VERIFY — base: 55525abad · head: 6f546ae03
Blockers: 4 —
  B1. scripts/roadmap-settle.test.mjs:80 (the live-tree test) — the root suite and the local gate are RED at head.
      Reproducer: `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap-settle` → `verdict: FAIL`, 2 ×
      `pr-url-unsettled`; `bun scripts/run-root-suite.mjs` → exit 1 (136/137, only this suite red);
      `bun scripts/local-gate.mjs --jobs 4 --no-bail` → `FAILED root-suite`, 5 dependent steps skipped.
      Cause: docs/fix/676-journal-errata-path/SPEC.md:500 (Log P8) and :507 (Next) carry PR #685's URL while
      docs/ROADMAP.md:231 reads `in review · [#685]`; the closed code (issue #316,
      packages/agentic-workflow/src/roadmap-settle/index.mjs:33-34) requires `done · [#685]` once the doc's
      Log/Next carries the URL. Base-vs-head: quiet at base (the base SPEC carries no PR URL; the row was
      `pending`); stability: `262 unit docs checked`, only this unit violates — the red was introduced by the
      PR-head commit `5de664a86` (URL lines + the owner's `in review` row), which was never gated (P8's green
      run predates it, and test-impact's 42-suite set does not derive roadmap-settle). Smallest action: settle
      the row to `done · [#685]` (the PR-open settle #316 encodes) — the status cell is the owner's, so if
      `in review` must stand, drop the PR URL from the SPEC's Log/Next instead; one or the other, then the root
      suite is green. Route to `/aw-local-apply`.
  B2. packages/agentic-workflow/README.md:51 (the `journal aggregate` command-table row) — sibling still asserts
      the old lint truth: `--check` "lists … an entry slot holding more than one fragment with every file
      named". Reproducer: head `journal aggregate --check` on a 2-fragment declared pair exits 0 listing
      nothing (probes H15c/B4b), while base exits 2 — so the sentence is false at head and was true at base;
      the same README's `carrier-check` row (line 406) states the new chain rule, leaving the file
      self-contradictory. Smallest action: reword line 51's `--check` clause to the chain rule (mirror line
      406). Route to `/aw-local-apply`.
  B3. packages/agentic-workflow/src/journal/aggregate.mjs:24-26 — module-doc bullet "The lint refuses a slot
      holding more than one conforming fragment, naming every file" is false at head and directly contradicted
      by the bullet the same diff added two lines below (:29-35, "A slot may hold one entry plus the
      corrections … The lint accepts exactly that chain"). Same reproducer as B2; true at base. Smallest action:
      reword that bullet to the chain rule or delete it as superseded. Route to `/aw-local-apply`.
  B4. Contract claims a refusal the lint does not make — packages/agentic-workflow/README.md:376 (errata row:
      "the oldest … names nothing … the lint refuses a slot that is not that chain"; also "the writer's
      `--supersedes` is the only producer"), docs/workflow/GATE_INVENTORY.md:137 ("the oldest names nothing"),
      docs/fix/676-journal-errata-path/decisions.md D1/D2. Reproducer (the writer's own documented door):
      `printf '<block with - **Supersedes:** X>' | bun <bin> journal write --kind narrative --content - --session s9`
      with no `--supersedes` and an empty slot → exit 0 (the cell lands without the flag's head/newer/session
      validation — falsifying "only producer"); then `journal aggregate --check` → exit 0 `ok:true` on that
      lone fragment whose oldest/only entry names something. Base-vs-head: the behaviour is identical at base,
      but base publishes no claim and has no reader — the false claim is new at head, and multi-fragment
      violations ARE refused (H16-H18 green), so only the length-1 case escapes
      (packages/agentic-workflow/src/journal/aggregate.mjs `identityFaults` skips `group.length < 2`).
      Smallest action: refuse a lone fragment that declares a link in `identityFaults` (the multi-fragment
      chain checks unchanged — D2 then holds), or narrow the three contract sentences to multi-fragment slots
      (the changeset's wording already does). Route to `/aw-local-apply`.
Advisories: 5 —
  A1. packages/agentic-workflow/src/journal/write.mjs:246 — the already-registered refusal dropped base's tail
      `, and another --session id is a different conversation` (base write.mjs @55525abad:179) while routing to
      `--supersedes`. Why advisory: the routing edit is asked for (S7b), the dropped clause is prose whose rule
      survives in the message's own scoping ("session s1's … for this conversation") and README's `entry-slot`
      row; SPEC E12's "keeps the #675 sentence byte-identical" is verified TRUE for the lint's refusal
      (base/head differential: base reason byte-identical, head appends the chain clause). Smallest action if
      the owner wants it back: restore the clause ahead of the routing sentence.
  A2. skills/log-session/SKILL.md:38 — the replaced box line reads as an unconditional "A stale entry WAS
      corrected" check; the condition "when one existed" is implicit only (the old `No past entry was edited`
      was unconditionally checkable). Why advisory: checklist prose; the prohibition itself never weakened
      ("never edited and never deleted"; rules section line ~197 still says never edit). Smallest action: add
      the `if one existed` condition to the line.
  A3. docs/fix/676-journal-errata-path/SPEC.md `## Impact` ("one narrative fragment") — head carries two
      narrative fragments: the owner's session-close commit `6f546ae03` landed mid-verification (unpushed).
      Why advisory: AC1's path-level check holds (all 27 diff paths are named; the carrier dir is named) —
      only the count word drifted, from a post-PR commit.
  A4. docs/LOGS.md:8793 — #675's historical session entry asserts the old `slot holding more than one
      fragment` truth. Why advisory: dated historical record, not a normative surface, and unfixable in-unit —
      S9 keeps `docs/LOGS.md` append-only and forbids rewriting published journal bytes.
  A5. scripts/phase-lint.test.mjs — the disclosed load-bound suite (SPEC `## Known pre-existing issues`;
      73s head / 94s base standalone). Why advisory: pre-existing at base, disclosed, and it did NOT red in my
      fail-fast-off root run (136/137 with roadmap-settle the only red).
Sibling sweep: list — B2 (packages/agentic-workflow/README.md:51) and B3
  (packages/agentic-workflow/src/journal/aggregate.mjs:24-26) still assert the old lint truth; the historical
  mentions docs/LOGS.md:8793 and docs/fix/676-journal-errata-path/SPEC.md:62 (the frozen issue quote) are
  records, not current-truth surfaces. `No past entry was edited` survives nowhere; the `identityCollisionReason`
  name survives nowhere; template/.agentic-workflow/journal.md, docs/workflow/SKILLS.md, GATE_INVENTORY's
  `journal-carrier-check` row, the README grammar rows and the changeset all carry the new chain rule.
Completeness: S1–S13 resolved (P1–P6 each carry `(Implements: S#)` and every declared validator re-run here;
  obligations O1–O14 re-run — O13/P6's gate validator is RED at head, which is B1) · open ids: none
Spot check: bun scripts/check-skill-context.mjs → match (log-session 3138 est / 238 lines, PASS 30 skills — E14)
Verdict: NEEDS-DECISION (4)
```

## Correction record — 2026-11-22

Correction batch 1 under the workflow's §9 bounds (one batch: every reported
blocker plus the triaged advisories), applied through the owner's local inline
workflow — ledgers frozen first (`O15`–`O20`, `PE-015`–`PE-018`, `D7`), red
corpus before code, differential after:

- **B1 — fixed** (`474ccdc33`): the own-PR URLs leave the SPEC's `Log` (P8) and
  `Next`; the owner's `in review` cell stands (the status cell is owner-managed
  and P8 records the request — flipping it would contradict P8's own line);
  `roadmap-settle` → `verdict: PASS`, 0 violations (O17). The `in review`-vs-
  legend tension (no such token in the `## Status legend`; `done` is the PR-open
  state; `unit-route` refuses close-out otherwise; #678 shares the label) is
  flagged to the owner in the unit doc's `Next` and `D7`, never resolved here.
- **B2 — fixed** (`474ccdc33`): README's `journal aggregate` command row states
  the chain rule instead of the pre-#676 slot rule (O18).
- **B3 — fixed** (`606a6637b`): the crate module doc's bullet states the chain
  rule beside the chain bullet it contradicted (O18).
- **B4 — fixed at code** (`606a6637b`): the writer refuses a `Supersedes` cell
  the flag did not declare (O15) and the lint refuses a lone fragment that
  declares a correction (O16) — D2's decision enforced, the three contract
  sentences left true; the README `refusal` row names the new cause
  (`474ccdc33`).
- **A1 — fixed** (`606a6637b`): #468's published sentence restored
  byte-identical, the routing clause appended after it (O19).
- **A2 — fixed** (`474ccdc33`): the skill's box line gains `when one existed`
  (O20).
- **A3 — fixed** (`474ccdc33`): the Impact names the session entries the diff
  carries (O20).
- **A4 — wontfix (recorded disposition):** `docs/LOGS.md:8793` is a dated
  historical record; S9 keeps published journal bytes append-only — "fixing" it
  would break the boundary this unit protects.
- **A5 — n/a (recorded disposition):** the load-bound `phase-lint` suite is
  pre-existing at base (94s standalone), disclosed in `## Known pre-existing
  issues`, and did not red in any run of this batch.

Corpus and recheck: `6bbb3229b` landed five cases observed red before any code
(plus the pre-existing `roadmap-settle` red); two corpus regexes were repaired
for markdown/comment line-wrap before first green — intent unchanged, recorded
as SPEC `P11`. The blockers-only recheck (`E19`–`E21`, `G2`) re-ran every
touched obligation validator green — `O15`–`O20` all `verified`, 0 `planned`,
20/20 rows closed — the root suite is 137/137, the local gate
`PASS — 20 step(s) in 507s`, and the base/pre-batch/head differential in
scratch shows only the asked-for differences (plain paths byte-identical).

Delta verify pending — the block above stays this unit's pre-correction verdict;
the next run is a delta verdict over `6f546ae03..HEAD`.
