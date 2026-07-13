# 17 — finding-severity-routing · testing

What is tested, at which layer, with the **runnable check** for each. This repo
has no application build — "green" is: the skills CLI discovers every skill,
markdown/cross-refs resolve, no stack leakage, and (schema package touched) its
`npm test` passes. Prefer a command; only genuinely judgement-only criteria stay
`read-verified`.

Run all commands from the repo root.

## Layer 1 — skill-body contract (grep-checkable)

| # | What | Command |
|---|---|---|
| 1 | `review-change` + `audit-pr` reference the ledger | `grep -l "review-findings.md" skills/review-change/SKILL.md skills/audit-pr/SKILL.md` |
| 2 | Fixed ledger schema present in `review-change` | `grep -qF "\| id \| file:line \| axis \| severity \| class \| route \| folded \|" skills/review-change/SKILL.md` |
| 3 | `execute-phase` fold cycle ticks `folded` | `grep -q "folded" skills/execute-phase/SKILL.md` |
| 4 | `workflow-status` reads the ledger | `grep -q "review-findings.md" skills/workflow-status/SKILL.md` |
| 5 | `workflow-status` emits `suggested_tier` | `grep -q "suggested_tier" skills/workflow-status/SKILL.md` |

## Layer 2 — machine contract (schema package, `npm test`)

| # | What | Command |
|---|---|---|
| 6 | Item shape mirrored in types + JSON schema | `grep -q "suggested_tier" packages/agentic-workflow-schema/src/index.ts packages/agentic-workflow-schema/envelope.schema.json` |
| 7 | `validateEnvelope()` + tests pass on the new shape | `cd packages/agentic-workflow-schema && npm test` |
| 8 | Package version bumped | `git -C . diff -- packages/agentic-workflow-schema/package.json \| grep -q '"version"'` |

## Layer 3 — integration (golden fixture, weakest fleet model)

- Run the `docs/workflow/GOLDEN_FIXTURE.md` procedure through the edited
  executor-path skills (`review-change`, `execute-phase`, `workflow-status`) with
  the weakest fleet model. **Pass** = the run writes a `review-findings.md` with a
  real `high`/`med`/`low` severity value, `execute-phase` flips one row to
  `folded: yes`, and `workflow-status` emits a matching `fix_now[]` item carrying
  `severity` + `suggested_tier` (and the folded row is **absent**). Record the
  run-log row (date · model · skill+version · result). — `read-verified`.

## Layer 4 — coherence (doc/roadmap drift)

| # | What | Command / method |
|---|---|---|
| 9 | Ledger mirrored into `template/` | `grep -rq "review-findings.md" template/` |
| 10 | Documentation map lists `review-findings.md` | `grep -rq "review-findings.md" docs/workflow/` |
| 11 | Roadmap ↔ folder ↔ doc-map coherent | `audit-docs` (read-verified PASS) |
| 12 | Skills all discoverable | `npx skills add . --list` |

## Dev-scenario failure modes (asserted in P5 hardening)

Each is `read-verified` against the owning skill unless a grep fits:

- **Re-run dedupe** — a second `review-change` on the same branch appends no
  duplicate `id` (dedupe by `file:line`+axis).
- **Merged unit** — writer runs on a merged unit → no ledger write.
- **Missing ledger** — `workflow-status` on a unit with no ledger → `fix_now: []`,
  no error.
- **Fold + tick** — `folded: yes` drops the item from the envelope.
- **audit-pr blockers** — append to the same ledger (D4), surfaced identically.
- **Schema drift** — a malformed item fails `validateEnvelope()` (`npm test`).
