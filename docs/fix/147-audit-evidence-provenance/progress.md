# Progress — fix/147-audit-evidence-provenance

## Dependency receipt v1
- Fingerprint: 326676a43ec8cfb2d129915d9074b14c0aa9c812 · Closure: 147-audit-evidence-provenance ← (none)
- Merged PRs: none required (SPEC `Depends on:` = None) · Fully merged: yes · Verified: 2026-08-27

## Acceptance receipt v1
- Manifest: docs/fix/147-audit-evidence-provenance/ACCEPTANCE.md · Blob: 42a91680cb09d470c921ddd663aa0a7ba599f459 · Status: frozen · Verified: 2026-08-27

## Architectural invariants receipt
- Project invariant document `docs/architecture/ARCHITECTURAL_INVARIANTS.md`: absent in
  this repository (NRS F013 recorded it empty; the path does not exist). The declared
  workflow-side invariant doc `docs/workflow/WORKFLOW_INVARIANTS.md` carries the
  template/protocol text (its `AI-001` block is an example inside the protocol
  section, not a project rule). → `n/a: no project invariants declared`; P1–P5 are
  additive docs-layer edits to `skills/product-audit/**` and
  `docs/workflow/GOLDEN_FIXTURE.md(.es.md)`, which preserve every standing rule in
  `CLAUDE.md` (stack-agnostic wording, EN+ES pairing, version-every-change,
  fail-closed context budgets).

## Unit-loop receipt — P1
- Commit: pending · Gate: `node scripts/check-skill-context.mjs` (exit 0) · Acceptance blob: 42a91680cb09d470c921ddd663aa0a7ba599f459
- Next: P2 · Attempts: 1
- Phase-lint: PASS (8/8) · fingerprint P1:docs:6:Evidence-provenance checklist · triggers: none (docs layer, 3 files / +24 lines)

## P1 — 2026-08-27
- Done: `Evidence-provenance gate (fixed):` block inserted under step 2 of `AUDIT_PROCESS.md` with the five labeled domains (`- Forge state —`, `- Command-derived metrics —`, `- Repository inventories —`, `- Freshness/timestamps —`, `- Conflicting sources —`), one `Fallback:` each (5/5), plus the 2-line Guardrails pointer in `SKILL.md` binding evidence to that gate; AC1–AC4 validators green (incl. the five AC4 absence scans → 0 hits).
- Remains: P2 delta reporting, P3 fixture pair, P4 bump surfaces, P5 hardening & PR (SPEC `## Phases` ledger is the task ledger).
- Gotchas: **SKILL.md budget is now the binding constraint**: `product-audit` main estimate 2784/2800 (≈16 bytes free), 221/240 lines. P2 must add the `## Delta vs audit <prior-id>` literals + the `never global slugs` clause there, so P2 must free bytes first by compressing existing SKILL.md prose with no rule lost (strictly-required budget relief, stated in the P2 commit). The Forge-state anchor literal has to stay contiguous on one line — a wrap inside it silently breaks AC2. `TASKS.md`/`testing.md`/`known-issues.md` are n/a for a fix unit (SPEC checkboxes + this file are the ledger).
- Files: skills/product-audit/references/AUDIT_PROCESS.md, skills/product-audit/SKILL.md, docs/fix/147-audit-evidence-provenance/SPEC.md, docs/fix/147-audit-evidence-provenance/progress.md
- Next: P2 — Cross-audit delta reporting
- Reconciliation: P1 committed as f4b79d9 (receipt `pending` → f4b79d9); P1 ticks verified against `AUDIT_PROCESS.md:11-27` + `SKILL.md` Guardrails before starting P2.

## Unit-loop receipt — P2
- Commit: pending · Gate: `node scripts/check-skill-context.mjs` (exit 0, 35 skills PASS) · Acceptance blob: 42a91680cb09d470c921ddd663aa0a7ba599f459
- Next: P3 · Attempts: 1
- Phase-lint: PASS (8/8) · fingerprint P2:docs:6:Cross-audit delta reporting · triggers: none (docs layer, 3 files / +38 lines, no sensitive surface)
- Strictly-required budget relief: P1 left 16 bytes of `mainEstimateMax` headroom, so the frozen AC5/AC8 literals could not land. The provisional `ultracode` tip was reworded shorter (4 lines, all four facts kept: user-enabled session setting, research-preview, subagent fan-out, sequential fallback with unchanged coverage) and the post-format triage sentence dropped its redundant "in the proposals" clause. No rule, gate, or literal was removed.

## P2 — 2026-08-27
- Done: `## Delta vs audit <prior-id>` fixed section added to the SKILL.md output format between Findings and Proposals (`New` / `Unchanged` with `F<k> <- audit <prior-id> F<j>` / `Resolved`, empty case `none — <why no equivalent-scope prior exists>`); AUDIT_PROCESS.md steps 8→9 / 9→10 renumbered and new step 8 (compare the newest prior equivalent-scope audit **after** independent synthesis, same-date rerun needs a reason + delta, `not forbidden by date alone`) inserted; persist step wording now names the delta section; Guardrails F-ID bullet extended (`never global slugs or replaced ids`). AC5–AC8 green.
- Remains: P3 fixture pair (EN+ES), P4 bump surfaces (`3.0.3` → `3.1.0`), P5 hardening & PR.
- Gotchas: `product-audit/SKILL.md` is now **2786/2800 est, 225/240 lines** — only 56 bytes free: P4's version bump is byte-neutral, and nothing else may be added there without an equal compression (AC10 runs the full budget gate on the final tree). Follow-on consequences of the renumber were fixed in this phase: "execute all ten steps" and "(Process step 9)" for the audit id. Deliberately **not** changed (no budget): the Turn-contract box still enumerates "health by dimension, F-numbered ranked findings, four proposal streams" without naming the delta — the box defers to "the fixed output format", which now contains it.
- Files: skills/product-audit/SKILL.md, skills/product-audit/references/AUDIT_PROCESS.md, docs/fix/147-audit-evidence-provenance/SPEC.md, docs/fix/147-audit-evidence-provenance/progress.md
- Next: P3 — Audit-evidence golden-fixture scenario
