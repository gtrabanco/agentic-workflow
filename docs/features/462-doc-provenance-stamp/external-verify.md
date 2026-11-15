# 462 — doc-provenance-stamp · external verify receipts

```
EXTERNAL VERIFY — 2026-11-09 — base: 1fa39fe137e1265e5fcb239bfd8e24803e99a112 · head: 226a3367
Blockers: 0
Advisories: 2
  1. scripts/release.test.mjs:974 — the new STAMPED_TEMPLATE fixture carries `format: unit-doc-spec-by-reference@1`,
     a token the published DOC_PROVENANCE_FORMATS ("unit-doc@1"/"unit-doc@2") refuses; the test passes because the
     stamper is deliberately token-agnostic. Fixture-only consistency wart; smallest action: rename the fixture
     token to "unit-doc@2".
  2. docs/features/462-doc-provenance-stamp/SPEC.md:63 — Decision D1 still names the pre-D4 vocabulary tokens
     (`unit-doc-legacy@1` / `unit-doc-spec-by-reference@1`); D4 (SPEC.md Log) records the rename. Dated historical
     record, amended in-document — kept for the evidence trail, not a live claim.
Sibling sweep: clean apart from the two advisory-grade mentions above; no normative surface asserts a superseded
  truth (the AGENTS.md rows read the vocabularies from committed source via `schema-export:`).
Completeness: S1–S10 all resolved to tasks with validators re-run green here; O1–O16 all `verified`, every
  validator re-run green (O14's differential re-run in mktemp scratch, see below; O15's local gate now 17/17 PASS
  — the G1 environment reds were node/npm absence, both present in the verifier environment).
Spot check: `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/features/462-doc-provenance-stamp/SPEC.md --no-git`
  → match with E15 (VERIFY PASS, checks incl. `provenance-stamp`, 0 violations, exit 0).
Verdict: VERIFIED
```

Evidence of the re-run (verifier environment: bun 1.4.4, node and npm present):

- E1' schema suite `bun test test/doc-provenance.test.mjs` — 15 pass / 0 fail.
- E2' crate `bun test test/provenance.test.mjs test/verify.test.mjs` — 35 pass / 0 fail.
- E12' package-wide `cd packages/agentic-workflow-schema && bun run test` — 791 pass / 0 fail (green here; the two
  recorded E12 failures were `spawnSync npm` ENOENT, npm present now).
- E13' crate-wide `bun test test/` — 565 pass / 0 fail (no runtime override needed; node present now).
- E3' `bun test scripts/unit-doc-contract.test.mjs` — 21/0 · E4' `normative-drift.test.mjs` — 21/0 ·
  E6' `release.test.mjs` — 70/0.
- E5' `prose-gate-inventory.mjs` — `verdict: PASS` · E7' `check-skill-context.mjs` + `--documents` — PASS ·
  E8' `docs-generate.mjs --check` — PASS.
- O14 differential re-run in `mktemp -d` (base `git archive 1fa39fe1` export vs head `git archive HEAD` export,
  identical fixtures; mutating paths exercised only in scratch, live tree untouched, scratch removed after):
  `verify` on the 460 SPEC (unstamped, refuses at base for a pre-existing `receipt-malformed-head`) → byte-identical
  stdout/stderr/exit both sides; the same doc stripped of its stamp → identical PASS receipts, the only delta is
  `provenance-stamp` in `checks`; `unit-doc create` → identical receipts modulo path/digests, created doc delta is
  exactly the added `doc-provenance@1` block (`format: unit-doc@1`); `roadmap check` → byte-identical; the new
  `unit-doc <slug> provenance` op re-stamps byte-identically (idempotent, run twice in scratch).
- O15' `bun scripts/local-gate.mjs --jobs 4` — **PASS, 17/17 steps, 169s** (G1's 4 reds + 1 skip do not reproduce
  here: node and npm exist in this environment).
- E17' `journal aggregate --check` — `{"ok":true,"checked":4,"refusals":[]}` (4 = one more fragment than E17's 3,
  landed with 226a3367; outcome identical).
- AC-S10 caveat: this environment's gh/GraphQL surface does not expose the native `blocked-by` relationship fields;
  the issue's `## Dependencies` prose declares none and the diff adds no forge mutation, so S10's substance holds
  with that tooling caveat.

No corrections have landed since this receipt → the next run on a moved head is a delta verdict over the new
commits only.
