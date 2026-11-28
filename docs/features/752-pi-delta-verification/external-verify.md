# 752 — pi-delta-verification · external verify

Receipt carrier for this unit's external verification (the next run reads the
latest block here and verifies only the delta). Written 2026-11-28 by the
read-only external-verify run; no other byte of the branch was touched.

## 2026-11-28

EXTERNAL VERIFY — base: 51747154e · head: aba6ed133
Blockers: 1 —
  B1 docs/features/752-pi-delta-verification/planning-obligations.md:25 (O13) —
     the row is `verified` but its declared validator does not re-run green
     here: `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap
     docs/ROADMAP.md read --nn 752` → exit 2, `EDIT REFUSAL — Unknown roadmap
     operation` (the operation must precede the file: the correctly spelled
     `roadmap read docs/ROADMAP.md --nn 752`, as SPEC.md P6 writes it, exits 0
     and reports row 752 `in-progress`; the ledger cell transposed `read` after
     the path). Base-vs-head: `planning-obligations.md` is new at head (base
     `51747154e` carries no unit ledger), so the false receipt cannot exist at
     base; the reproducer fires only on this row's own command text — the same
     writer, correctly spelled, is green, so no adjacent surface is affected.
     Smallest action: in `planning-obligations.md:25` replace
     `roadmap docs/ROADMAP.md read --nn 752` with `roadmap read docs/ROADMAP.md
     --nn 752` and re-run it to exit 0 — /aw-local-apply.
Advisories: 3 —
  A1 packages/pi-agentic-workflow/README.md:1412 — lost qualifier on prose: the
     base's "continuously against `latest` by the `pi-compat-guard` gate — a
     moving tripwire, never a pin" became "The `pi-compat-guard` gate tracks
     `latest`, never a pin", dropping "continuously"; the binding machine claim
     ("never a pin") survives and the gate step re-ran green here, so prose
     only.
  A2 packages/pi-nan-agentic-workflow/README.md:671 — the quoted pre-1.7.0
     message pair `Model "…" not found` / `No API key found` is only half
     reproduced by this session's differential probe (scratch
     `PI_CODING_AGENT_DIR`, invalid `contextWindow`): 1.6.1 printed
     `No models available` / `No API key found`, never `Model "…" not found`
     (that variant is inherited verbatim from issue #752's own report); the
     adoption claim itself reproduced in all three modes — 1.7.0 prints
     `Warning: models.json error: Invalid models.json schema:` in text, `--mode
     json` (stderr beside the session envelope) and `--mode rpc`. Unverified
     half of a legacy-message quote, not the S2 claim.
  A3 docs/features/752-pi-delta-verification/planning-evidence.md:13 and :17
     (PE-003, PE-007) — cut-head snapshots still carrying freshness `current`
     for pre-change truths ("Current claim: `Also verified against Pi 1.6.1
     (2026-11-27)`"; "the seam drops every dialog option … `richUi` calls the
     host dialogs with two arguments") whose cited line numbers this change
     moved; the ledger's own contract freezes rows at the cut head (its
     preamble) and #694's identically shaped PE rows were accepted as history —
     frozen planning snapshots, not live claims.
Sibling sweep: list (no live-surface survivor) — `1.6.1 (2026-11-27)` → only
     PE-003 (A3) and `docs/features/694-pi-delta-migration/decisions.md` D4
     (closed-unit record); `stale at 1.5.2` → none; `pi-coding-agent@1.6.1` →
     only this unit's own differential evidence (O5/E4, intentional) and 694's
     decisions.md D5 (history); the old seam truth "drops every dialog
     option / two arguments" → only PE-007 (A3); the live README carries
     exactly one baseline claim (`Also verified against Pi 1.7.0 (2026-11-28)`,
     floor `Pi 1.1.0` agreeing with `peerDependencies >=1.1.0`), and the
     `pi-event-reliability@1` source line is re-pinned with both halves
     re-measured here: 41/41 `pi.on` event names present on pi.dev (fetched
     2026-11-28) and the 1.6.1↔1.7.0 extracted name sets `diff` empty.
Completeness: S1–S6 all resolve to tasks P1–P7 with `(Implements: S#)`; every
     stated validator re-ran green here — event-matrix + verified-baseline
     suites (9 pass / 0 fail across 2 files), shipped-adapter,
     settings-console (72 pass) and paged-select, `bun run --cwd
     packages/pi-nan-agentic-workflow build` exit 0, the `rg` counts (baseline
     claim 1, `diagnostics` 1, decisions `#631|#632|#495|#705` 4, routed
     capability scan exit 1), `unit-route --triage 752 --json` exit 0, and the
     correctly spelled roadmap read → `in-progress`. Obligations: O1–O12 and
     O14 re-ran green — `local-gate: PASS — 20 step(s) in 1109s` (both
     pi-compat-guard legs `tsc --noEmit clean`, skill-context-budgets and
     docs-generated-projection green, README at its 1418-line budget), the pi
     package suite 1182 pass / 0 fail across 99 files with the session's four
     `AGENTIC_WORKFLOW_DOC_EMBEDDINGS_*` unset, nan build exit 0, event sets
     41/41 identical, differential reproducer re-run in `mktemp -d` (1.7.0
     warning in text/json/rpc, 1.6.1 silent — state writes confined to the
     scratch dir, nothing against the live tree); open id: O13 (B1).
Spot check: `cd packages/pi-agentic-workflow && bun test
     test/event-reliability-matrix.test.mjs test/verified-baseline.test.mjs` →
     match (E2 reported exit 0 · `9 pass / 0 fail across 2 files`; observed
     identical).
Verdict: NEEDS-DECISION (B1)
