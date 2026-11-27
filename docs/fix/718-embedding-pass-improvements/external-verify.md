# External verify — 718-embedding-pass-improvements

2026-11-27. Full verdict (no prior `EXTERNAL VERIFY` receipt existed for this
unit). Read-only run: no commit, no branch, no forge mutation; every behavioral
probe ran in `/tmp/verify718-*` scratch git repos (base side proven in a
`git clone` of this tree checked out at the base sha). This receipt is
uncommitted, left for the owner.

```text
EXTERNAL VERIFY — base: f1b04a3a9093e17fe423e37cba1380f73a6ba963 · head: b61b6c0baa01364f0d3333a47dc55b2891dc2903
Blockers: 1 — B1 template/.agentic-workflow/hooks/README.md:30 — reproducer: `rg -n "The resolution is one line in every shim" template/.agentic-workflow/hooks/README.md` matches line 30, which asserts the resolution of *every* shim (index-sync included) is one line: `AGENTIC_WORKFLOW_BIN` … else `command -v agentic-workflow`. Base-vs-head: at f1b04a3a the sentence was true — `git show f1b04a3a:template/.agentic-workflow/hooks/index-sync.sh` has no pin branch, so index-sync really resolved override → command -v; at head the hook's own resolution block (index-sync.sh:12-20) and the README's new paragraph (:37-45) make index-sync a three-step order (override → pin → command -v → no-op), and SPEC.md:126-130 (Retirements) states this "resolution is one line" reading retires with the README's ordered list as its replacement — the blanket sentence was never amended, so the old truth survives beside the new one and the README contradicts itself across two paragraphs. Stability: the claim is false only for index-sync, the surface this change rewrote; untouched shims still are one line. Smallest action: amend README.md:30-32 to scope the one-line order to the shims other than `index-sync.sh`, or to state index-sync's full order there, per the unit's own retirement.
Advisories: 8 — A1 docs/fix/718-embedding-pass-improvements/SPEC.md:129 retirement receipt `rg -c 'command -v agentic-workflow' … → 1` observed 2 (index-sync.sh:17 order comment + :44 fallback); why advisory: receipt-count only — exactly one code occurrence (the intended fallback) survives, direction intact. A2 docs/fix/718-embedding-pass-improvements/planning-obligations.md:19 (O10 validator) `rg -n 'fetchTimeoutMs|lease-held|store.pending' packages/agentic-workflow/README.md matches 3` observed 5 (lines 46, 392, 393, 394, 402); why advisory: substance green — docs-generate --check PASS, every named subject present (coverage exceeds the cell), `runner.local` = 1 — only the count cell is stale. A3 SPEC.md Log E5/E6 red receipts record `50 pass · 3 fail` / `10 pass · 5 fail` at fb1d50135; observed `51 pass · 2 fail` and `9 pass · 6 fail` (after `tsc` build), both exit 1 at that sha; why advisory: the red-before-impl direction reproduces at the recorded sha for both, only the counts differ by one. A4 packages/agentic-workflow/src/doc/sync.mjs (scan-stage writes; the `busy_timeout` pragma was added only inside embeddings.mjs's embed pass) — concurrent CLI syncs can kill one child with `doc: database is locked` at `stage scan`; why advisory: pre-existing — the base clone reproduced the locked child in 4/6 and 5/5 double-launch rounds (worse than head's 3/6), and sync/sqlite bytes are untouched by this diff. A5 packages/agentic-workflow/src/doc/retrieval.mjs:163-176 (lease acquired after the destructive scan) — rare race: 1 of 15 head double-launch rounds ended with both children exit 0 (one `lease-held`) and the store fully re-pending after one pass' worth of calls (the loser's scan re-chunked the fresh store after the winner embedded; the fence then blocked repair); 0 of 11 later rounds; why advisory: not reproducible on demand and the scan wipe itself is byte-identical at base (base repairs it only by double-spending). Smallest action: re-read the pending set after acquiring the lease, or fence the scan stage too. A6 packages/agentic-workflow/README.md:402 — the degradations row enumerates `unavailable-embeddings-lease-held` inside a row declared "a closed vocabulary, published by the schema package (DOC_DEGRADATIONS…)", which does not contain it (schema intentionally untouched; open family); why advisory: prose — the row's later open-family sentence self-qualifies; smallest action: mark the member as open-family, not a published value. A7 packages/agentic-workflow/src/doc/query.mjs:365 — the query path now resolves full pacing per query, so an invalid pacing env value (e.g. AGENTIC_WORKFLOW_DOC_EMBEDDINGS_BATCH_SIZE=abc) now refuses a query by name where base queried fine (base sync already refused it); why advisory: fail-loud side effect of the S3 wiring, no option silently ignored. A8 the bare gate with this host's ambient provider vars set fails doc.query/doc.hybrid keyword cases (first run: crate-suite-bun FAIL); why advisory: pre-existing environment — the base clone fails the same suites with the same vars (40 pass · 7 fail), disclosed by the unit as PE-012, and the gate with vars cleared is PASS: 16 steps, 658s, exit 0.
Sibling sweep: 1 — B1 (template/.agentic-workflow/hooks/README.md:30, the surviving "one line in every shim" claim); every other sweep clean: no surviving rebuild-silent / fixed-600s-cap / status-shape-without-pending / no-pin claims (pi README, crate README rows, hooks table + degradation row, ROADMAP rows all current; `docs/features/719` "600 s cap" mentions are scope pointers to this unit, not behavior claims; the template carries no second runner version literal).
Completeness: S1–S6 resolved — P1–P11 each carry their `(Implements: S#)`; every current-state validator re-ran green here (P3 incl. doc.store 37/0, P5, P7 15/0 + hook ok, P9, P10, P11 = gate PASS 16 steps env-cleared + root suite; P1's and P2/P4/P6/P8's phase-time validators verified at their own shas: P1 11/11 `planned` at b7b7a7efe; reds E1 `54 pass · 3 fail` @10778af3f, E3 `2 pass · 3 fail` @4e4385d0e, E5 exit 1 @fb1d50135, E6 exit 1 @fb1d50135 after build, E9 `INDEX-SYNC-HOOK-TESTS fail (1)` @e00155c01). Obligations O1–O11 all `verified` with their validators re-run green (O10's count cell as A2). No open ids.
Spot check: bun scripts/run-root-suite.mjs → match (reported G5 "exit 0 · 147 suites"; observed exit 0 · 147 PASS).
Verdict: NEEDS-DECISION (1)
```

## Evidence notes (audit trail)

- Declared commands, all re-run at head: `bun scripts/docs-generate.mjs --check`
  PASS (0 stale) · `bun scripts/check-skill-context.mjs --documents` PASS (7) ·
  crate `bun run test` exit 0 (doc.structure 214.6s, inside its 240s bound) ·
  `bun run test:node` exit 0 (149.5s, alone; a concurrent run of mine timed it
  out at 240.1s — load artifact of this session, not the tree) · schema
  `bun run test` exit 0 ×3 standalone (one 1-fail flake under my concurrent
  load: F99 timing bound; schema package is byte-identical to base — 0 diff
  lines) · pi `bun run test` 1130/0 · root suite exit 0, 147 suites ·
  `bun scripts/local-gate.mjs --skip-network --jobs 1` exit 0 with the ambient
  provider vars cleared (`PASS — 16 step(s) in 658s`), and FAIL at
  `crate-suite-bun` with them set (A8, base-proven).
- Independent probes (derived from the S2–S6 wording, scratch only): S2 — CLI
  `--sync` and `--rebuild` emit `feedback: progress N/N chunks (100%)` rows,
  `--quiet` stderr empty, JSON one line; the `embedPendingChunks` seam fires
  per landed batch plus the final total. S3 — `fetch` carries an
  `AbortSignal.timeout` that rejects `TimeoutError` with no status at the
  configured ms; default 30000; config/env overrides; bad values refused by
  name; a hanging provider aborts, rides the ladder (2 attempts observed),
  declares `unavailable-embeddings-provider-down` in 3.7s; the hybrid query is
  bounded: 30.4s at default vs 1.8s with `FETCH_TIMEOUT_MS=1500`. S4 —
  `doc status` reports numeric `pending` on a present store, absent-store shape
  unchanged (no `pending` key); `derivedTimeoutMs` floor/`max` boundaries
  (481→601000, 12900→13020000, null/0/negative/NaN→600000). S5 — live lease:
  0 provider calls, `unavailable-embeddings-lease-held`, pending unchanged;
  stale lease taken over, embedded, no row left; two concurrent CLI syncs made
  exactly one pass' worth of calls in 11/11 head rounds (base: double-spent in
  2/6 + 1 partial round in a second sample). S6 — cold keyword sync declares
  `unavailable-embeddings-not-configured` (base: silent — the defect); zero-
  pending warm sync stays silent on a limit-pinned fixture; hook probes:
  pin argv executed verbatim (path with a space; a two-word token stays one
  argv element), `AGENTIC_WORKFLOW_BIN` wins over the pin, a failing pin exits
  0 with no output, no pin/no PATH is a silent no-op, empty pin falls through
  to `command -v`.
- Disclosures: (1) one in-process probe sync (~8 short scratch chunks, one
  request) went to this host's ambient embedding provider before I stripped the
  env — probe hygiene, negligible cost, no live-tree bytes touched; (2) my
  first bare gate run may likewise have driven ambient-provider calls through
  the keyword suites that failed there (the pre-existing A8 mode); (3) the
  live store was never synced, rebuilt or re-embedded — `git status` clean at
  close; (4) E5/E6 counts differ from their receipts by one case (A3).
