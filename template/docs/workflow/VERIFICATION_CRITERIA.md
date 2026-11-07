# Verification criteria catalogue

> **This is a template.** Copy it to `docs/workflow/VERIFICATION_CRITERIA.md`
> (its documentation-map row ships in the agent guide) and fill it from the
> project charter's answers. `/init-workspace` asks for it at bootstrap and
> fills it with you; `/audit-docs` audits its coverage — placeholder cells and
> provenance-less rows are findings, never a silent pass.

The project's own answer to **what "done" means beyond the workflow's generic
baseline**: which acceptance criteria exist at project level, which review
passes apply per surface type, and the framework-specific gate commands, docs
coverage, captures and manual checks a "done" unit must carry. Triage and
execution consume this catalogue; they **never invent a criterion silently** —
a criterion absent from the catalogue is added with a recorded decision, or
recorded as a dated assumption, or the unit asks.

## Provenance (mandatory per criterion)

Every row carries exactly one provenance value from this closed set — a row
without one is a defect the audit reports:

| Provenance | Meaning | Who may change it |
|---|---|---|
| `workflow-generic` | The workflow's own baseline (unit doc evidence, the declared gate, review-change's findings) — inherited, not re-declared | Only the workflow's own release; a target project never edits these rows |
| `project-declared` | A decision this project's owner made (framework gate commands, docs coverage thresholds, required captures) | The owner, via a recorded decision (the unit's `decisions.md` or an explicit instruction) |
| `stamped assumption (dated)` | A default an agent proposed and the owner accepted-or-left in a hurry — written `stamped assumption (<YYYY-MM-DD>)`, re-confirmed by the first unit that needs it, then promoted to `project-declared` or discarded | Any unit, by surfacing the assumption and recording the owner's answer |

## Criteria

| Criterion | Applies to (surface type) | Provenance | Source / authority | Notes |
|---|---|---|---|---|
| `<criterion>` | `<surface type>` | `<workflow-generic \| project-declared \| stamped assumption (dated)>` | `<path:line / decision id / unit>` | `<the check that proves it>` |

Example rows (delete before shipping; keep none — a placeholder cell is an
audit finding):

| Criterion | Applies to (surface type) | Provenance | Source / authority | Notes |
|---|---|---|---|---|
| Type-check + test suite green before every commit | code | workflow-generic | agent guide §Commands | the declared gate |
| Storybook visual captures attached for UI units | UI components | stamped assumption (2026-01-15) | bootstrap interview, domain layer | re-confirm at the first UI unit |
| `npm run lint:docs` clean before docs-only merges | docs | project-declared | decision D3, 2026-01-20 | docs policy |

## Review passes per surface type

Which of the workflow's review passes apply to each surface this project
carries — record the project's own additions beside the generic ones, never
instead of them:

| Surface type | Review passes that apply | Project-specific additions |
|---|---|---|
| `<code>` | `<the generic pack + which>` | `<framework/stack passes, or none>` |
| `<UI>` | `<the generic pack + which>` | `<design/a11y expectations, or none>` |
| `<docs>` | `<the generic pack + which>` | `<coverage/captures expectations, or none>` |

## Non-technical owners

If the project has no declared criteria, do not fill this file with guesses:
the interrogation enters help-mode (a recommended option with its why,
"Explain the options", or "Decide for me"), the agent proposes rows that are
recorded as dated assumptions, and the catalogue grows into `project-declared`
rows only when the owner confirms. **Never silent defaults.**
