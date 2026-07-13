# 17 — finding-severity-routing · PLAN

Phased implementation plan. Phases are labelled `P1, P2, …` and called *phases* —
an implementation sequence, not a delivery boundary. `P1` also commits the
planning artifacts and confirms the roadmap row. The last phase (`P5`) is
Hardening & PR; opening the PR is the final *step* of `P5`, not a phase of its
own.

Each phase touches **one skill/concern**, carries **zero open decisions** (D1–D4
all resolved in `decisions.md`), and its verification gate (the phase's `grep`s +
`read-verified` + `npm test` for P4) **runs locally** — the cheap-executability
checklist passes for all five, so the mandatory split rule does not trigger.

## P1 — `review-change`: ledger schema + persist step

Single concern: `skills/review-change/SKILL.md`.

- Define the **fix-now fold ledger** `review-findings.md` in `review-change`: the
  fixed schema `| id | file:line | axis | severity | class | route | folded |`,
  its location (`docs/features/<NN>-<slug>/review-findings.md` for features,
  `docs/fix/<n>-<topic>/review-findings.md` for fixes), and the write/dedupe rule.
- Add a **persist step**: after classification, for each **fix-now** finding on an
  **unmerged** unit, append a row carrying the verbatim `Sev` value (create the
  file with the header if absent); `folded` starts `no`. Re-runs **dedupe by
  `file:line` + axis** (reuse the existing merge rule at `SKILL.md:225-227`); a
  new finding gets the next `Fn` id. Non-fix-now findings are **not** written here
  (they keep their `triage-issue` routes). Merged unit → no write.
- `bump-skill` for `review-change` (minor): CHANGELOG rows (EN/ES) + README
  skill-table rows (EN/ES).
- Commit this feature's planning artifacts (SPEC + this set) and confirm **roadmap
  row 17** reads `planned` (the `defined → planned` flip written during scaffold).

Verification: P1 `grep`s pass (`review-findings.md`, `folded`, `fix-now` in
`review-change`) + `read-verified` the persist step is fix-now-only and
unmerged-gated and dedupes by `file:line`+axis.

## P2 — `audit-pr`: persist to the same ledger

Single concern: `skills/audit-pr/SKILL.md`.

- Add the persist step to `audit-pr`: its **fix-now blockers** append to the
  **same** `review-findings.md` ledger (D4 — the fold cycle consumes one list),
  same schema, same dedupe-by-`file:line`+axis rule, same unmerged gate.
- `bump-skill` for `audit-pr` (minor): CHANGELOG + README rows (EN/ES).

Verification: P2 `grep`s pass (`review-findings.md` in `audit-pr`) +
`read-verified` it writes the same ledger with the same schema/dedupe/gate.

## P3 — `execute-phase`: fold-cycle tick

Single concern: `skills/execute-phase/SKILL.md`.

- Add a new box to the existing fold-cycle checklist (`SKILL.md:404-424`): when a
  folded finding is fixed **and committed**, flip its ledger row `folded: no →
  yes` — the one and only ledger state transition, owned solely by `execute-phase`.
- `bump-skill` for `execute-phase` (minor): CHANGELOG + README rows (EN/ES).

Verification: P3 `grep`s pass (`folded` in `execute-phase`) + `read-verified` the
box sits inside the existing fold-cycle checklist and is the sole transition.

## P4 — `workflow-status` + schema package: emit + mirror

Single concern: the `findings.fix_now[]` **envelope item shape** (the
`workflow-status` emit and its schema-package mirror are one contract — the repo's
Verification rule binds them to the same change).

- In `skills/workflow-status/SKILL.md`: read each unit's `review-findings.md`, take
  only `folded: no` rows, and emit them as structured `findings.fix_now[]` items
  `{id, file, axis, severity, class, route, suggested_tier}`. Document the fixed
  **`suggested_tier` derivation table** (severity `high` OR axis ∈ {security,
  correctness, logic, architecture, design, concurrency} → `strong`; else
  `cheap`) as a checklist a weak model cannot misread, reusing `next.tier`'s
  vocabulary. `next.tier` derivation is **unchanged**. Update the envelope example
  to show one populated item. Sensor stays **read-only**.
- In `packages/agentic-workflow-schema/`: replace `EnvelopeFixNowFinding`
  `{ref, title, file?}` (`src/index.ts:90`, `envelope.schema.json:84`) with the
  new item shape; update the `validateEnvelope()` field checks and tests; **bump
  the package version**. `npm test` green.
- `bump-skill` for `workflow-status` (minor): CHANGELOG + README rows (EN/ES).

Verification: P4 `grep`s pass (`review-findings.md`, `suggested_tier` in
`workflow-status`) + `cd packages/agentic-workflow-schema && npm test` exit 0 +
`read-verified` the derivation table is fixed/mechanical, the item shape matches
the SKILL example, and `next.tier` is untouched.

## P5 — Hardening & PR (hardening phase)

Implement + test the SPEC's dev-scenario failure modes, then close out.

- Ensure each failure edge is stated in the owning skill: **re-run dedupe** (no
  duplicate ids on a second `review-change`), **merged unit** (no write),
  **missing ledger** (`workflow-status` → `fix_now: []`, no error), **fold+tick**
  (`folded: yes` drops the item from the envelope), **audit-pr blockers**
  (same ledger), **schema drift** (malformed item fails `validateEnvelope()`).
- Mirror the ledger convention into `template/` and add `review-findings.md` to the
  **documentation map** (so a fresh install inherits it).
- Run the `GOLDEN_FIXTURE.md` procedure with the **weakest fleet model** through
  the edited executor-path skills (`review-change`, `execute-phase`,
  `workflow-status`) — it must write a ledger with a real severity value and a
  matching envelope item; record the run-log row.
- Re-run the project's full verification gate (`npx skills add . --list` +
  doc-coherence; `npm test` in the schema package) with commands + exit codes
  pasted.
- `audit-docs` — roadmap ↔ folder ↔ doc-map links resolve; `review-findings.md`
  listed; no stack/real-project reference leaked; naming conventions held.
- Pending-docs check: `git status --porcelain -- docs/` → empty.
- Close out: open the PR (`gh pr create --body-file <path>`, body includes
  `Closes #49`, PRINT THE PR URL); set roadmap row 17 → `done · [#PR]`; commit
  `docs: link PR #<n>` and push.

Verification: all dev-scenario `read-verified` checks + the gate green +
`npm test` green + `audit-docs` PASS + golden-fixture run-log row recorded.
