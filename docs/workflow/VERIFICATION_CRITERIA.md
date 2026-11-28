# Verification criteria catalogue

> Filled at upgrade from the project charter's answers (2026-11-28).
> `/audit-docs` audits its coverage — placeholder cells and provenance-less rows
> are findings, never a silent pass.

The project's own answer to **what "done" means beyond the workflow's generic
baseline**. Triage and execution consume this catalogue; they **never invent a
criterion silently**.

## Provenance (mandatory per criterion)

Every row carries exactly one provenance value from this closed set — a row
without one is a defect the audit reports:

| Provenance | Meaning | Who may change it |
|---|---|---|
| `workflow-generic` | The workflow's own baseline (unit doc evidence, the declared gate, review-change's findings) — inherited, not re-declared | Only the workflow's own release; a target project never edits these rows |
| `project-declared` | A decision this project's owner made | The owner, via a recorded decision |
| `stamped assumption (dated)` | A default an agent proposed and the owner accepted-or-left in a hurry — re-confirmed by the first unit that needs it, then promoted to `project-declared` or discarded | Any unit, by surfacing the assumption and recording the owner's answer |

## Criteria

| Criterion | Applies to (surface type) | Provenance | Source / authority | Notes |
|---|---|---|---|---|
| `bun scripts/local-gate.mjs` green before every merge (local-first; CI delegates the same order) | code, docs | project-declared | `AGENTS.md § Verification · Where the gate runs` (owner decision 2026-11-04) | the push hook runs the offline subset; `test-impact` empty skips test-bearing steps |
| Per-file root suites bun-first with the node fallback | distributions (`scripts/`, packages) | project-declared | `AGENTS.md § Runtime convention` | the worker pool runs the identical per-file invocation |
| Skill + guide budgets within the ceilings of the budgets manifest | docs | project-declared | `bun scripts/check-skill-context.mjs` | after a guide edit, re-measure and re-base the manifest first |
| Version parity + changesets before any publish | packages | project-declared | `docs/workflow/PACKAGES.md` | the crate's parity gate + `.changeset/` per PR |
| Generated projection current (`bun scripts/docs-generate.mjs --check`) | docs | project-declared | `AGENTS.md § Docs site` | a prose-only push stales the projection, so it is export-free status on the ✓, not routed |
| Review passes: the code, docs, security and perf passes apply; the web-only axes (SEO, a11y, brand, design) are excluded | packages, scripts, docs | stamped assumption (2026-11-28) | charter § Ceremony profile seed (owner chose decide-for-me) | re-confirm at the first `/review-change` run that would include a web-only axis |
| No UI capture evidence required (manual) | n/a — no frontend | stamped assumption (2026-11-28) | charter § Ceremony profile seed | joined with `captures: discarded`; revisit if a UI ships |

## Review passes per surface type

| Surface type | Review passes that apply | Project-specific additions |
|---|---|---|
| code | the generic pack + code, security, perf, verify | API-ergonomics on the crate's CLI envelope (the repo's own policy: the CLI never invents an acceptance token) |
| scripts | the generic pack + code, security, perf, verify | the pair-suite rule: a new `scripts/x.mjs` ships `scripts/x.test.mjs` (red commit first) |
| docs | the generic pack + docs | budgets re-check, generated projection currency |

## Non-technical owners

Never silent defaults: an unconfirmed criterion lands as a dated assumption
above and grows into `project-declared` only when the owner confirms.
