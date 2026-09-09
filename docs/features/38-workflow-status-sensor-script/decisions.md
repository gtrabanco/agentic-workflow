# 38 — decisions

> Decisions and open questions for feature 38. Each entry is dated and records
> what was decided and why. New entries are appended on every re-design
> (upsert) — never rewritten.

## 2026-08-30 — initial product design (artifactRevisionId: 38-0a1b2c3d4e5f)

**Decision:** Use Node.js for the sensor script language.
**Rationale:** Consistent with existing `scripts/*.mjs` convention in the repository.
No transpilation, no bundler. Direct ES module imports.
**Evidence:** all existing scripts in `scripts/` use `.mjs` with ES modules.

**Decision:** No new dependencies beyond the schema package.
**Rationale:** Keeps the script lightweight and avoids unnecessary pull-in of packages.
The schema package (`@gtrabanco/agentic-workflow-schema` v3.4.0) is already an
existing dependency (NRS F002).
**Evidence:** schema package already published and on `main`.

**Decision:** Output goes to stdout only, no file output, no color formatting.
**Rationale:** Consistent with existing CLI tools in the repo and enables piping
by consumers without intermediate files.
**Evidence:** existing scripts/ convention and repo CLI patterns.

**Decision:** Offline degradation uses machine-readable codes in `detail`.
**Rationale:** Consumers can distinguish "genuinely missing data" from
"transiently unavailable" without guessing.
**Evidence:** design assumption from issue #185.

**Open questions:** None. All rubric slots resolved by issue #185 body.
**Deferred decisions:** See `SPEC.md → Deferred decisions` section (degradation code vocabulary, `--output <path>`).
## 2026-09-09 — repair batch over review receipt rp-38-20260909-001 (artifactRevisionId: 38-73192450f7b4)

**Decision:** One evidence-bounded repair batch over findings F1–F11 (all
`class: product`); no receipt text touched; no severity edited; no forge issue
opened to hold an obligation. New SPEC artifactRevisionId
`38-73192450f7b4` = first 12 hex of sha256(SPEC.md) at this write — POLICY §7
manual pairing (no runtime rotates the revision id; the mutate-and-revert
guarantee rides this manual handoff, same as the 2026-08-30 authoring turn).

**Repair classes used:**
- Mechanical, intent-preserving (reviewed product intent unchanged): F4 (A:3
  check rewritten — the old grep banned reading labels, unsatisfiable together
  with A:7; the read-only invariant itself is unchanged, the check now greps for
  mutation calls only), F5 (spec-lint mechanical counts recomputed against the
  tables they lint — in-scope 11 / out-of-scope 2 / deferred 0; 16 runnable
  criteria + 1 `read-verified`; 13 integration rows = 8 filled resolutions +
  5 explicit `n/a:`), F6 (sweep rows 5/13 `deferred` → `in-scope`, pointer A:10 —
  in-scope item 10 already carried this work, the rows were mislabelled), F9
  (A:5's contradictory "modulo volatile timestamps" carve-out removed — Envelope
  v2 has no timestamp field, so the byte-identical check is verbatim and
  satisfiable; duplicate A:14/A:15 merged into one criterion), F10 (Delete row's
  blank test cell filled with an objective grep), F11 (Context wording: SKILL.md
  + **8** reference files; the 780-line total was already correct).
- Closure completion (new/refreshed evidence at `current` freshness): F1
  (in-scope item 2 re-scoped to the published SENSOR_CORE steps **1–9** —
  steps 8 *pending quality gates* and 9 *fix-now fold ledger* are envelope
  producers the old "steps 1–7" claim silently omitted; evidence row 1 refreshed
  against `SENSOR_CORE.md`), F2 (schema-package facts refreshed against the live
  package: v3.4.0 → **v4.1.1** in Tooling + evidence rows 2 and 4; new evidence
  row proving the package exports the Envelope v2 vocabulary live —
  `Envelope`, `validateEnvelope`, `parseEnvelope`, `decideWorkflowAction` in
  `src/index.ts`), F3 (integration closure completed to 13/13 — added explicit
  rows for File/media storage, Feature flags, Billing/payments, each
  `n/a:` with a reason, per the inventory's own floor-row guidance), F8 (the two
  surfaces issue #185 names that the SPEC excluded by silence are now named:
  `references/ENVELOPE_CORE.md` folded into in-scope item 7's slimming, and
  `docs/workflow/ORCHESTRATION.md` driver wiring added as in-scope item 12 +
  criterion A:16 — both were already implied by reviewed business goal 3 and the
  issue's affected-surfaces list; scope re-entered the inventory pass with this
  dated note, not widened beyond it).
- Routed to the human (class-3 product change, not repaired here): F7 (exact
  degradation-code vocabulary). Live evidence gathered: schema package v4.1.1
  declares **no** code vocabulary — `Envelope.detail` is `unknown`
  (schema-unconstrained, "documented per skill") — and no repo surface defines
  one (new Product evidence row). The deferred decision's decide-by is corrected
  from "Implementation phase" to "Human design owner"; a bounded question with a
  recommended default is being put to the human this turn. The answer folds into
  `Product decisions` and rotates the revision again before `/review-spec`.

**Note (drift, not silently edited):** NRS `F002` still freezes the schema
package at 3.4.0 with 554/554 passing; the live package is 4.1.1. Live-vs-frozen
conflict recorded in Product evidence row 2 as a contradiction candidate — only
`/resolve-repository-state` may update frozen facts.
