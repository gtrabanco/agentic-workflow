# External verify — fix/540-embedding-pass-batch-limit

Date: 2026-11-14 · base `1a52465d` (`origin/main`) · head `4dfb8628` ·
first receipt for this unit (no prior `EXTERNAL VERIFY` block → full verdict, once).
Read-only run: no commit, push, branch or forge mutation; this file is the receipt,
written uncommitted. The declared gates (`run-root-suite`, `local-gate --skip-network`,
the four package suites) ran in this worktree as the repo's own proven machinery —
their only writes are gitignored build output (`agentic-workflow-schema/dist`, the
staged skills bundle); `git status --porcelain` was empty before this file was
written. Every `doc` mutating path (`--sync`, `--rebuild` with the provider double)
ran only in `mktemp -d` fixtures; the worktree's live `.agentic-workflow` store was
never touched; all scratch copies were removed after the run.

```
EXTERNAL VERIFY — base: 1a52465d · head: 4dfb8628
Blockers: 3 —
  1. docs/fix/540-embedding-pass-batch-limit/SPEC.md:339 (and :198) — P7's declared
     validator `bun scripts/local-gate.mjs --offline` (claim: "exits 0").
     Reproducer: `bun scripts/local-gate.mjs --offline --dry-run` → `local-gate: unknown
     argument --offline` + usage, exit 2 — the gate has no `--offline` flag; its offline
     subset is `--skip-network` (scripts/local-gate.mjs:551 usage, :594 parser), which
     passed here: `local-gate: PASS — 13 step(s) in 318s`, exit 0.
     Base-vs-head: SPEC.md does not exist at `1a52465d` (`git cat-file -e
     1a52465d:docs/fix/540-embedding-pass-batch-limit/SPEC.md` → "exists on disk, but not
     in '1a52465d'"), and `rg -c '"--offline"' scripts/local-gate.mjs` matches nothing at
     base or head — the false validator claim is change-caused and cannot reproduce at base.
     Stability: only this declared text fails; every real gate command runs green.
     Smallest action: replace `--offline` with `--skip-network` at SPEC.md:198 and :339,
     re-run (exit 0) — route to `/aw-local-apply`.
  2. docs/fix/540-embedding-pass-batch-limit/planning-obligations.md:21 (O11) — the
     `verified` obligation's validator `rg -n 'embeddings-request-rejected\|max_request_chars'
     packages/agentic-workflow/README.md` claims "matches ≥2".
     Reproducer: run it verbatim → exit 1, 0 matches (ripgrep reads `\|` as a literal pipe,
     so the pattern requires the literal text `…-rejected|max_request_chars`); the intended
     alternation `rg -c 'embeddings-request-rejected|max_request_chars' …` → 4 matches.
     Base-vs-head: planning-obligations.md absent at `1a52465d` (same cat-file proof), so
     the never-matching validator is change-caused; the README content itself is correct.
     Stability: fires only on the validator pattern, never on the docs it checks.
     Smallest action: unescape the pipes to `|` (or two `-e` patterns) in the O11 row,
     re-run → 4 ≥ 2 — route to `/aw-local-apply`.
  3. docs/fix/540-embedding-pass-batch-limit/SPEC.md:430 — P1's Log evidence "both planning
     ledgers frozen … before the first line of code · `4f90294c`'s parent" does not
     reproduce, and P1's task validator's second condition (every ledger row `planned`)
     matches 0 of 12 rows.
     Reproducer: `git ls-tree --name-only 4f90294c^ docs/fix/540-embedding-pass-batch-limit/`
     → empty (`4f90294c^` = `1a52465d`); `git log --oneline --diff-filter=A --
     docs/fix/540-embedding-pass-batch-limit/SPEC.md` → the sole adder is `4f90294c` itself,
     the same commit as the first test code (10 files, 1159 insertions);
     `rg -n '^\| O[0-9]+ \|.*\| (planned|in-progress) \|$'` over the ledger → 0 matches
     against the declared "matches every row".
     Base-vs-head: the unit dir is absent at base, so the wrong pointer exists only at
     head; the substantive ordering does hold (ledgers committed in `4f90294c`,
     implementation in `1ea21304`).
     Stability: fires only on this claim; no behavior depends on it.
     Smallest action: re-point the P1 line at `4f90294c` (freeze landed with the red
     suite, before the implementation in `1ea21304`) and phrase the `planned`-rows
     condition as the cut-time check with its SHA — route to `/aw-local-apply`.
Advisories: 4 —
  1. planning-obligations.md:17 (O7) — the validator's second path `test/doc.config` never
     existed (base tree has only `config-cli.test.mjs`); bun silently ignores the unmatched
     filter (observed `27 pass · 1 file`, exit 0). Advisory: the stated outcome (exit 0)
     reproduces and all three named cases run and pass in `doc.store.test.mjs:312-362`.
  2. SPEC.md:271 (AC-S4) — the literal fragment `bun test test/doc/hybrid` exits 1 (`Tests
     need ".test" …`). Advisory: the same sentence names `test/doc.hybrid.test.mjs`, which
     runs green here, and the AC's fixture half reproduced (`doc --rebuild` in a mktemp
     fixture prints `doc: rejection: 400 …` + `doc: skipped: a.md#A`).
  3. SPEC.md:106-108 (Retirements) — `rg -c 'unavailable-embeddings-provider-down'
     packages/agentic-workflow/src` claims `→ 1`; observed `query.mjs:1` + `retrieval.mjs:2`.
     Advisory: the substance (key narrowed to retrieval.mjs, the query path's own use
     unchanged) holds; only the inline count is off.
  4. SPEC.md:86-88 (Impact) — "`runDocOp` is the sole caller of `embedPendingChunks` and
     `resolveEmbedConfig`" is false as a direct-call-site claim: `query.mjs:356`
     (`realProviderOrNull`) also calls `resolveEmbedConfig`. Advisory: that path is only
     reached through `queryIndex` ← `runDocOp` (retrieval.mjs:170), so the consumer-set
     conclusion stands and `resolveEmbedConfig` itself was not modified by this change.
Sibling sweep: clean — the retired catch-all comment ("Only add if not already present …"),
the chunk-limit "default 0 = unlimited" row, the rebuild keyword-only narrative and the
provider-down rejection label have no surviving old-truth mention (the only `rg` hits are
the unit's own Retirements prose and PE-007's base-dated evidence); one roadmap row for
#540; no stale `./ceremony/lib.mjs` / `./unit-doc-phases.mjs` imports anywhere in
`scripts/`; both READMEs, the changeset, the journal fragments and the `/aw-index` report
all assert the new truth.
Completeness: S2, S2a, S3, S4, S5, S6 resolved — tasks green here | open: S1 (P1,
blocker 3), S7 (P7, blocker 1); obligations O1–O10 and O12 verified and re-run green,
O11 blocked (blocker 2), O7 advisory.
Spot check: cd packages/agentic-workflow && bun run test → match (observed `726 pass ·
0 fail · 41 files` = reported G1)
Verdict: NEEDS-DECISION (SPEC.md:339/198 `--offline` validator exits 2;
planning-obligations.md:21 O11 rg validator matches 0; SPEC.md:430 P1 freeze pointer
does not reproduce)
```

## Observed this run (command → result)

- `cd packages/agentic-workflow && bun run test` → exit 0 · `726 pass · 0 fail · 41 files` (reported G1 ✓)
- `cd packages/agentic-workflow && bun run test:node` → exit 0 · `727 pass` (reported G2 ✓)
- `cd packages/agentic-workflow-schema && bun run test` → exit 0 · `851 pass · 48 files` (G3 ✓)
- `cd packages/pi-agentic-workflow && bun run test` → exit 0 · `866 pass · 77 files` (G4 ✓)
- `bun scripts/run-root-suite.mjs` → exit 0 · `110 suite(s)`, 0 fail (G8/G11 ✓)
- `bun scripts/local-gate.mjs --skip-network --jobs 1` → exit 0 · `PASS — 13 step(s) in 318s` (G12 ✓; duration host-dependent)
- `bun scripts/local-gate.mjs --offline` → exit 2 (declared exits 0 — blocker 1)
- Obligation/task validators: O1–O6, O8–O10, O12 green; O7 exit 0 with a dead path (advisory 1);
  O11 exit 1 / 0 matches (blocker 2); P1 row-condition 0/12 (blocker 3)
- `bun scripts/check-skill-context.mjs` and `--documents` → PASS (`AGENTS.md 690 / 136 / 554 / 11830`, the declared re-pin)
- `bun scripts/docs-generate.mjs --check` → `verdict: PASS`
- End-to-end differential in `mktemp -d` fixtures against a localhost provider double
  (400 on the batch carrying `a.md`, 200 otherwise): base `1a52465d` →
  `degradations:["unavailable-embeddings-provider-down"] · embedded: 0 · pending: 2`, no
  rejected record, human stderr only the degradation line; head →
  `degradations:["embeddings-request-rejected"] · embedded: 1 · pending: 1 ·
  store.rejected {count:1, failures:[{status:400, message:"…Context length exceeded…"}],
  chunks:["a.md#A"]}` with stderr `doc: rejection: 400 …` / `doc: skipped: a.md#A`, exit 0;
  `doc --rebuild` on head re-embeds (`embedded: 1`) and prints the same rejection lines.
- `git log --format='%an <%ae>|%cn <%ce>' 1a52465d..HEAD | sort -u` → single approved
  identity (D9 ✓); all 9 commit subjects conventional (AC-S1 ✓)
