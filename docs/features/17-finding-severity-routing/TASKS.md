# 17 — finding-severity-routing · TASKS

Per-phase checklists the executor ticks off. Command-checkable criteria are
emitted **as the command** — a weak executor verifies by *running* it, not by
judging prose. Genuinely judgement-only criteria are labelled `read-verified`.

Run each check from the repo root (`/Users/gtrabanco/MyProjects/agentic-skills`).

## P1 — `review-change`: ledger schema + persist step

- [x] Define the ledger `review-findings.md` in `review-change` (schema, location,
      write/dedupe rule).
      Check: `grep -q "review-findings.md" skills/review-change/SKILL.md` — PASS
      (process step 9, `skills/review-change/SKILL.md:152-169`)
- [x] The fixed schema line is present verbatim.
      Check: `grep -qF "| id | file:line | axis | severity | class | route | folded |" skills/review-change/SKILL.md` — PASS
- [x] Persist step writes **fix-now** findings only, on an **unmerged** unit, with
      `folded` starting `no`, deduped by `file:line`+axis.
      Check: `read-verified` — step 9 gates on PR state `MERGED` (no write),
      writes only fix-now rows, `folded` starts `no`, dedupes by
      `file:line`+axis reusing the adversarial-mode merge rule; non-fix-now
      findings explicitly excluded (kept on `triage-issue`, step 8)
- [x] `folded` column documented as starting `no`.
      Check: `grep -q "folded" skills/review-change/SKILL.md` — PASS
- [x] `bump-skill` ran for `review-change` (minor): version bumped, CHANGELOG
      (EN/ES) + README (EN/ES) rows added.
      Check: `git diff --name-only | grep -E 'CHANGELOG(\.es)?\.md|README(\.es)?\.md'` — PASS
      (commit `dcdd6b2`; version 2.1.1 → 2.2.0)
- [x] Planning artifacts committed and roadmap row 17 reads `planned`.
      Check: `grep -E '^\| 17 \|' docs/features/ROADMAP.md | grep -q 'planned'` — PASS
      (commit `f405f08`)

## P2 — `audit-pr`: persist to the same ledger

- [ ] `audit-pr` fix-now blockers append to the **same** `review-findings.md`.
      Check: `grep -q "review-findings.md" skills/audit-pr/SKILL.md`
- [ ] Same schema + dedupe-by-`file:line`+axis + unmerged gate as `review-change`.
      Check: `read-verified` (one ledger, D4; identical write rule)
- [ ] `bump-skill` ran for `audit-pr` (minor): version + CHANGELOG + README rows.
      Check: `grep -n 'version:' skills/audit-pr/SKILL.md`

## P3 — `execute-phase`: fold-cycle tick

- [ ] The fold-cycle checklist gains a box flipping `folded: no → yes` on
      fold+commit.
      Check: `grep -q "folded" skills/execute-phase/SKILL.md`
- [ ] The box sits inside the existing fold-cycle checklist (not a new section) and
      is the sole ledger transition.
      Check: `read-verified`
- [ ] `bump-skill` ran for `execute-phase` (minor): version + CHANGELOG + README.
      Check: `grep -n 'version:' skills/execute-phase/SKILL.md`

## P4 — `workflow-status` + schema package: emit + mirror

- [ ] `workflow-status` reads `review-findings.md`, emits only `folded: no` rows.
      Check: `grep -q "review-findings.md" skills/workflow-status/SKILL.md`
- [ ] Structured `findings.fix_now[]` item shape
      `{id, file, axis, severity, class, route, suggested_tier}` shown in the
      envelope example.
      Check: `grep -q "suggested_tier" skills/workflow-status/SKILL.md`
- [ ] The `suggested_tier` derivation table is fixed/mechanical (severity `high`
      OR subtle axis → `strong`; else `cheap`), reusing `strong`/`cheap`.
      Check: `read-verified` (a checklist a weak model cannot misread)
- [ ] `next.tier` derivation is unchanged in intent.
      Check: `read-verified` (the command→tier map section is untouched)
- [ ] Schema package mirrors the new item shape (types + `envelope.schema.json`),
      version bumped, tests updated.
      Check: `grep -q "suggested_tier" packages/agentic-workflow-schema/src/index.ts packages/agentic-workflow-schema/envelope.schema.json`
- [ ] Schema package tests pass.
      Check: `cd packages/agentic-workflow-schema && npm test`
- [ ] `bump-skill` ran for `workflow-status` (minor): version + CHANGELOG + README.
      Check: `grep -n 'version:' skills/workflow-status/SKILL.md`

## P5 — Hardening & PR

- [ ] Each dev-scenario failure edge is stated in its owning skill: re-run dedupe,
      merged-unit (no write), missing-ledger (`fix_now: []`, no error), fold+tick
      drop, audit-pr same ledger, schema-drift guard.
      Check: `read-verified` against the touched skills
- [ ] Ledger convention mirrored into `template/`.
      Check: `grep -rq "review-findings.md" template/`
- [ ] `review-findings.md` added to the documentation map.
      Check: `grep -rq "review-findings.md" docs/workflow/`
- [ ] `GOLDEN_FIXTURE.md` run with the weakest fleet model produced a ledger with a
      real severity value + matching envelope item; run-log row recorded.
      Check: `read-verified` via the golden-fixture run log
- [ ] Full gate green (skills discovered + doc-coherence).
      Check: `npx skills add . --list`
- [ ] Schema package tests green.
      Check: `cd packages/agentic-workflow-schema && npm test`
- [ ] `audit-docs` PASS (roadmap ↔ folder ↔ doc-map; `review-findings.md` listed).
      Check: `read-verified` via the `audit-docs` report
- [ ] Pending-docs check empty.
      Check: `git status --porcelain -- docs/`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a Markdown
      file, real backticks, never inline `--body`/heredoc that leaves `\`-escaped
      backticks; body includes `Closes #49`) and PRINT THE PR URL in the chat.
- [ ] Update the roadmap row 17 to `done · [#<pr>](<pr-url>)`.
- [ ] Commit `docs: link PR #<n>` and push.
