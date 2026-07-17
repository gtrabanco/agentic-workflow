# Active fixes

Index of in-progress and pending fixes. Merged fixes are removed from
this table — history lives in git log + closed issues.

## Status legend

- `pending` — SPEC drafted, branch not yet open
- `in-progress` — branch open, work ongoing
- `done` — built, PR open, awaiting merge (merge state lives in the forge — same
  meaning as the roadmap's `done`); the entry is removed only **after** the PR merges

## Active

| Folder | Topic | Status | Depends on | Issue |
| ------ | ----- | ------ | ---------- | ----- |
| `38-schema-package-republish` | Republish schema package (bump 1.0.1 → 1.0.2 so the stranded #44 README reaches npm) | done · [#48](https://github.com/gtrabanco/agentic-workflow/pull/48) | — | [#38](https://github.com/gtrabanco/agentic-workflow/issues/38) |
| `37-bilingual-human-docs` | Spanish `.es.md` siblings for all human-readable docs (`docs/workflow/*.md` + schema package README) + on-next-touch sync convention; also folds in the model-routing recommendation revision (GLM-5.2 → €200 plan, quota-aware per-task ladders) | done · [#50](https://github.com/gtrabanco/agentic-workflow/pull/50) | — | [#37](https://github.com/gtrabanco/agentic-workflow/issues/37) |
| `52-workflow-status-envelope-hardening` | Emit-time hardening of the `workflow-status` envelope: turn-contract assertions for a non-bare, correctly-staged `next.recommended` + `next.tier` derivation + always-emit on follow-ups; schema shape reminders (`blockers[].scope`, `dependencies.unmet`) so it passes `validateEnvelope()`; mechanical (exception-proof) `product_audit` trigger; unknown-status → `idea` mapping; **new** untriaged open-issue backlog field (`detail.untriaged_issues`) | done · [#53](https://github.com/gtrabanco/agentic-workflow/pull/53) | — | [#52](https://github.com/gtrabanco/agentic-workflow/issues/52) |
| `51-plan-feature-replan-loop` | Break the infinite re-plan loop: `plan-feature` already-planned short-circuit (`planned`/`in-progress`/`done` → hand off, never re-scaffold) + `--next` retargets to `defined` + turn-contract assertion the `defined→planned` write landed; `plan-feature-scaffold` re-reads the row to confirm the write; `workflow-status` no-progress guard (hint recommended `/plan-feature <slug>` yet `<slug>` still `defined` → `workflow_observations` note) | done · [#55](https://github.com/gtrabanco/agentic-workflow/pull/55) | — | [#51](https://github.com/gtrabanco/agentic-workflow/issues/51) |
| `54-triage-disposition-labels` | Close the untriaged-detection spoof gap: make `triage-issue` the sole owner/writer of the `postponed` / `promoted` / `wontfix` disposition labels (applied on verdict, triage+-permission-gated, same injection-safety invariant as its urgency labels), and reframe `workflow-status` step 11 so the label is the authoritative triaged signal with the `VERDICT:` comment kept as a backward-compat legacy fallback | done · [#58](https://github.com/gtrabanco/agentic-workflow/pull/58) | — | [#54](https://github.com/gtrabanco/agentic-workflow/issues/54) |
| `63-next-block-verdict-branching` | Branch `review-change` step 11's `→ Next:` block on the `Decision` verdict: a FAIL block recommends folding the fix-now findings (gate green, commit + push, re-review) with `/audit-pr` demoted to a table-clean sub-bullet, a PASS block keeps `/audit-pr — merge gate`; restore the fixed-output contract weak models copy verbatim (multi-line, no `·`-joined prose) per CLAUDE.md "Checklists over heuristics" | done · [#68](https://github.com/gtrabanco/agentic-workflow/pull/68) | — | [#63](https://github.com/gtrabanco/agentic-workflow/issues/63) |
| `67-nan-ladder-design-feature-row` | Add the missing **Product definition** row for `design-feature` to the README "Running on NaN.builders" *Preference ladders per task* table (Mimo-first, merge-gate-class ladder) + a condensed rationale paragraph; mirror both in `README.es.md` (bilingual sync) | done · [#69](https://github.com/gtrabanco/agentic-workflow/pull/69) | — | [#67](https://github.com/gtrabanco/agentic-workflow/issues/67) |
| `65-fold-findings-skill` | New strict skill `fold-findings`: takes a `review-change`/`audit-pr` findings ledger and truly fixes each fix-now finding (frozen classification, definition-of-fixed `✓`-list, forbidden `✗`-list closing every escape hatch, one-commit-per-finding, `FOLDED`/`DISPUTED→triage`/`BLOCKED` verdicts) + minimal hand-off wiring (`review-change` FAIL `→ Next`, `execute-phase` fold-cycle reference) + registration (model-routing, SKILLS EN/ES, README tables, CHANGELOG) | done · [#70](https://github.com/gtrabanco/agentic-workflow/pull/70) | — | [#65](https://github.com/gtrabanco/agentic-workflow/issues/65) |
| `64-phase-atomicity-lint` | Mechanical phase-atomicity lint (fixed 8-box checklist) authored once in the fix SPEC template and quoted in the feature template + both emitters (`plan-feature-scaffold`, `plan-fix`) + a pre-flight guard in the consumer (`execute-phase`) that STOPS on a non-atomic phase (`--force`-overridable, logged); turns the existing "one layer/concern, no open decisions" heuristic into binary boxes weak models can't misread | done · [#75](https://github.com/gtrabanco/agentic-workflow/pull/75) | — | [#64](https://github.com/gtrabanco/agentic-workflow/issues/64) |
| `81-legacy-spec-phase-lint-carveout` | Restore fix #64's backward-compat promise: add a legacy-SPEC carve-out to `execute-phase`'s phase-lint pre-flight guard so a SPEC with no `## Phases` section skips the guard entirely (no lint, no STOP) and runs the legacy single-pass flow — mirroring the exemption already stated in the *Workflows* section; the guard's behavior for phased SPECs is unchanged | done | — | [#81](https://github.com/gtrabanco/agentic-workflow/issues/81) |

---

## Conventions

- Folder: `docs/fix/<issue-number>-<topic>/`
- Branch: `fix/<issue-number>-<topic>`
- Every fix has a GitHub issue; PR closes it with `Closes #<n>`.
- Entry is removed from this table on merge — do not maintain history
  here.
- See `_TEMPLATE/SPEC.md` for the spec format.
- Workflow rules: `.claude/skills/execute-phase/SKILL.md` (`--fix`
  mode).
