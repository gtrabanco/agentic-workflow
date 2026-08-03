# 119-progressive-planning-docs-adapters · progress

## P1 — 2026-08-02
- Done: Required the planning-gates resource before every write-capable plan-feature route, including issue-derived inputs; recorded F1 as folded.
- Remains: P2 — Docusaurus adapter slots; P3 — Hardening & PR.
- Gotchas: `docs/workflow/REPOSITORY_STATE.md` and `docs/architecture/ARCHITECTURAL_INVARIANTS.md` are absent; record both as n/a in later gates.
- Files: `skills/plan-feature/SKILL.md`, `docs/fix/119-progressive-planning-docs-adapters/SPEC.md`, `docs/fix/119-progressive-planning-docs-adapters/review-findings.md`, `docs/fix/119-progressive-planning-docs-adapters/progress.md`, `docs/fix/119-progressive-planning-docs-adapters/testing.md`, `docs/fix/119-progressive-planning-docs-adapters/known-issues.md`
- Next: P2 — Docusaurus adapter slots | unit unfinished

## P2 — 2026-08-02
- Done: Added explicit Docusaurus content, MDX, guide, map, review, sidebar, verification, and asset slots; recorded F2 as folded.
- Remains: P3 — Hardening & PR.
- Gotchas: Docusaurus sidebar and build commands remain project-declared; the adapter table documents supported conventions without guessing a site configuration.
- Files: `skills/generate-docs/references/ADAPTERS.md`, `docs/fix/119-progressive-planning-docs-adapters/SPEC.md`, `docs/fix/119-progressive-planning-docs-adapters/review-findings.md`, `docs/fix/119-progressive-planning-docs-adapters/progress.md`, `docs/fix/119-progressive-planning-docs-adapters/testing.md`
- Next: P3 — Hardening & PR | unit unfinished

## P3 — 2026-08-02
- Done: Re-ran the full verification gate, pushed `codex/reduce-skill-context`, opened PR #120, linked it from the fix index, and recorded F3 as folded.
- Remains: P4 — NRS issue-route ordering; P5 — Reference ownership; P6 — Progressive-loading traceability; P7 — Hardening & PR.
- Gotchas: `docs/workflow/REPOSITORY_STATE.md` and `docs/architecture/ARCHITECTURAL_INVARIANTS.md` remain absent; P3 records both as n/a.
- Files: `docs/fix/README.md`, `docs/fix/119-progressive-planning-docs-adapters/SPEC.md`, `docs/fix/119-progressive-planning-docs-adapters/review-findings.md`, `docs/fix/119-progressive-planning-docs-adapters/progress.md`, `docs/fix/119-progressive-planning-docs-adapters/testing.md`
- Next: P4 — NRS issue-route ordering | replan approved; unit in progress

## P4 — 2026-08-03
- Done: Issue routing now resolves and validates identity without composing the product-half writer; `PLANNING_GATES.md` is required before the issue-derived write route, while redirected non-issue stops retain their early-stop behavior.
- Remains: P5 — Reference ownership; P6 — Progressive-loading traceability; P7 — Hardening & PR.
- Gotchas: The fresh-context `draft`, `contradicted`, and `resolved` probes remain assigned to P7; F4 and F5 stay unfolded until those probes are recorded.
- Files: `skills/plan-feature/SKILL.md`, `skills/plan-feature/references/ROUTING.md`, `docs/fix/119-progressive-planning-docs-adapters/SPEC.md`, `docs/fix/119-progressive-planning-docs-adapters/progress.md`, `docs/fix/119-progressive-planning-docs-adapters/testing.md`
- Next: P5 — Reference ownership | unit unfinished

## P5 — 2026-08-03
- Done: Replaced the scaffold process's cross-skill `HANDOFF.md` link with a self-contained progress ownership statement; the scaffold keeps its one-hop reference allowlist and F6 is folded.
- Remains: P6 — Progressive-loading traceability; P7 — Hardening & PR.
- Gotchas: `docs/workflow/REPOSITORY_STATE.md` and `docs/architecture/ARCHITECTURAL_INVARIANTS.md` remain absent; both gates are n/a for this phase.
- Files: `skills/plan-feature-scaffold/references/SCAFFOLD_PROCESS.md`, `docs/fix/119-progressive-planning-docs-adapters/SPEC.md`, `docs/fix/119-progressive-planning-docs-adapters/review-findings.md`, `docs/fix/119-progressive-planning-docs-adapters/testing.md`, `docs/fix/119-progressive-planning-docs-adapters/progress.md`
- Next: P6 — Progressive-loading traceability | unit unfinished

## P6 — 2026-08-03
- Done: Removed only this branch's F51–F53 feature-20 ledger hunk, preserved historical findings, mapped the progressive resources into the fix scope, synchronized the bilingual context total to 16,035, and marked the P6 ledger tasks complete.
- Remains: P7 — Hardening & PR.
- Gotchas: The nine-entrypoint total is derived from the current context checker output; the feature-20 ledger must remain byte-for-byte unchanged from `origin/main` after this phase commit. NRS and architectural-invariant documents remain absent and are n/a.
- Files: `docs/features/20-runtime-guardrails-progressive-skills/review-findings.md`, `docs/workflow/SKILLS.md`, `docs/workflow/SKILLS.es.md`, `CHANGELOG.md`, `CHANGELOG.es.md`, `docs/fix/119-progressive-planning-docs-adapters/SPEC.md`, `docs/fix/119-progressive-planning-docs-adapters/testing.md`, `docs/fix/119-progressive-planning-docs-adapters/known-issues.md`, `docs/fix/119-progressive-planning-docs-adapters/progress.md`
- Next: P7 — Hardening & PR | unit unfinished

## P7 — 2026-08-03
- Done: Re-ran the full verification gate and three fresh-context NRS issue-route probes; folded F4–F8 after recording the no-write results and bilingual Golden Fixture evidence.
- Remains: PR #120 is audit-blocked until CI evidence is published; review-change found no new findings.
- Gotchas: `docs/workflow/REPOSITORY_STATE.md` and `docs/architecture/ARCHITECTURAL_INVARIANTS.md` remain absent; both gates are n/a. The probe is read-verified and does not replace a live weak-model Golden Fixture run.
- Files: `docs/fix/119-progressive-planning-docs-adapters/SPEC.md`, `docs/fix/119-progressive-planning-docs-adapters/review-findings.md`, `docs/fix/119-progressive-planning-docs-adapters/testing.md`, `docs/fix/119-progressive-planning-docs-adapters/progress.md`, `docs/workflow/GOLDEN_FIXTURE.md`, `docs/workflow/GOLDEN_FIXTURE.es.md`
- Next: publish/obtain CI evidence, then re-run audit-pr | merge only after a MERGE-READY verdict

## Replan — 2026-08-03

- Done: User approved an incremental replan for open F11, F12, F13, and F15;
  triage recorded F18 as `fix-in-unit` on issue #119.
- Remains: P8 — Acceptance coverage map; P9 — Issue route contract; P10 — Weak-model probe; P11 — Hardening & PR.
- Gotchas: P7 is historical close-out evidence only. P11 is the fresh final
  close-out and must retain the template's literal task chain.
- Next: P8 — Acceptance coverage map | unit unfinished

## P8 — 2026-08-03

- Done: Removed the duplicate NRS-probe acceptance criterion, added a complete acceptance-to-evidence map, and folded F11 and F12.
- Remains: P9 — Issue route contract; P10 — Weak-model probe; P11 — Hardening & PR.
- Gotchas: Acceptance 7 retains the read-verified contract; P10 adds the distinct live weak-model evidence required by the triage verdict for F18.
- Files: `docs/fix/119-progressive-planning-docs-adapters/SPEC.md`, `docs/fix/119-progressive-planning-docs-adapters/review-findings.md`, `docs/fix/119-progressive-planning-docs-adapters/testing.md`, `docs/fix/119-progressive-planning-docs-adapters/progress.md`, `docs/fix/119-progressive-planning-docs-adapters/known-issues.md`
- Next: P9 — Issue route contract | unit unfinished

## P9 — 2026-08-03
- Done: Made issue detection an explicit route-selection step, assigned the planning-gate check to the parent before composition, recorded selected-route evidence, and folded F15.
- Remains: P10 — Weak-model probe; P11 — Hardening & PR.
- Gotchas: The route contract is read-verified in this phase; P10 still requires live weak-model probes with no product-half writes.
- Files: `skills/plan-feature/references/ROUTING.md`, `docs/fix/119-progressive-planning-docs-adapters/SPEC.md`, `docs/fix/119-progressive-planning-docs-adapters/review-findings.md`, `docs/fix/119-progressive-planning-docs-adapters/testing.md`, `docs/fix/119-progressive-planning-docs-adapters/known-issues.md`, `docs/fix/119-progressive-planning-docs-adapters/progress.md`
- Next: P10 — Weak-model probe | unit unfinished

## P10 — 2026-08-03
- Done: Ran the live weak-model tool-calling smoke and fresh NRS issue-route probes for `draft`, `contradicted`, and `resolved`; all three stopped before a product-half write, selected discovery or resolution, and recorded Golden Fixture evidence; folded F18.
- Remains: P11 — Hardening & PR.
- Gotchas: `qwen3:8b` was run with `think=false`, temperature `0`, and seed `20`; the tool-calling smoke returned parseable `{}` arguments. NRS and architectural-invariant documents remain absent and are n/a.
- Files: `docs/workflow/GOLDEN_FIXTURE.md`, `docs/workflow/GOLDEN_FIXTURE.es.md`, `docs/fix/119-progressive-planning-docs-adapters/SPEC.md`, `docs/fix/119-progressive-planning-docs-adapters/testing.md`, `docs/fix/119-progressive-planning-docs-adapters/known-issues.md`, `docs/fix/119-progressive-planning-docs-adapters/progress.md`
- Next: P11 — Hardening & PR | unit unfinished

## P11 — 2026-08-03
- Done: Re-ran the full verification gate, confirmed the fix-index `done · [#120](https://github.com/gtrabanco/agentic-workflow/pull/120)` entry and existing PR close-out contract, and recorded the final clean-docs check.
- Remains: P12 — Closeout reconciliation; P13 — Hardening & PR.
- Gotchas: PR #120 is already open and mergeable, so no duplicate PR was created; its body contains the amended progressive-resource scope and `Closes #119`. `gh pr checks 120` reports no published checks, so `/audit-pr` remains blocked pending CI evidence. NRS and architectural-invariant documents remain absent and are n/a.
- Files: `docs/fix/119-progressive-planning-docs-adapters/SPEC.md`, `docs/fix/119-progressive-planning-docs-adapters/testing.md`, `docs/fix/119-progressive-planning-docs-adapters/known-issues.md`, `docs/fix/119-progressive-planning-docs-adapters/progress.md`
- Next: P12 — Closeout reconciliation | unit unfinished

## P12 — 2026-08-03
- Done: Added explicit P11 close-out metadata, synchronized the progressive budget to 16,046 across the bilingual workflow docs and changelogs, set fix-index row 119 to `in progress`, and folded F13 and F20.
- Remains: P13 — Hardening & PR.
- Gotchas: PR #120 remains the existing open PR; P13 must verify its reconciled scope and push without creating a duplicate. NRS and architectural-invariant documents remain absent and are n/a.
- Files: `docs/fix/119-progressive-planning-docs-adapters/SPEC.md`, `docs/fix/119-progressive-planning-docs-adapters/review-findings.md`, `docs/fix/119-progressive-planning-docs-adapters/testing.md`, `docs/fix/119-progressive-planning-docs-adapters/known-issues.md`, `docs/fix/119-progressive-planning-docs-adapters/progress.md`, `docs/fix/README.md`, `docs/workflow/SKILLS.md`, `docs/workflow/SKILLS.es.md`, `CHANGELOG.md`, `CHANGELOG.es.md`
- Next: P13 — Hardening & PR | unit unfinished
