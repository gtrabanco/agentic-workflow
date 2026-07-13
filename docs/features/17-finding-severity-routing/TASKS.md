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

- [x] `audit-pr` fix-now blockers append to the **same** `review-findings.md`.
      Check: `grep -q "review-findings.md" skills/audit-pr/SKILL.md` — PASS
      (process step 5, `skills/audit-pr/SKILL.md:127-142`)
- [x] Same schema + dedupe-by-`file:line`+axis + unmerged gate as `review-change`.
      Check: `read-verified` — step 5 uses the identical fixed schema, the same
      `gh pr view --json state` → `MERGED` → no-write gate, and the same
      dedupe-by-`file:line`+axis rule (explicitly cross-referenced as
      "identical to `review-change`'s rule"); writes to the **same** ledger
      path (D4), not a separate one
- [x] `bump-skill` ran for `audit-pr` (minor): version + CHANGELOG + README rows.
      Check: `grep -n 'version:' skills/audit-pr/SKILL.md` — PASS (commit
      `13ab857`; version 3.0.0 → 3.1.0)

## P3 — `execute-phase`: fold-cycle tick

- [x] The fold-cycle checklist gains a box flipping `folded: no → yes` on
      fold+commit.
      Check: `grep -q "folded" skills/execute-phase/SKILL.md` — PASS
      (`skills/execute-phase/SKILL.md:411-420`)
- [x] The box sits inside the existing fold-cycle checklist (not a new section) and
      is the sole ledger transition.
      Check: `read-verified` — the new box is the fourth line inside the
      existing "Folding review / audit findings" checklist block (between the
      per-phase docs box and the `git add`+commit box); no new section was
      added; the box's own wording states it is "the one and only ledger
      state transition, owned solely by this fold cycle"
- [x] `bump-skill` ran for `execute-phase` (minor): version + CHANGELOG + README.
      Check: `grep -n 'version:' skills/execute-phase/SKILL.md` — PASS
      (commit `606dee6`; version 2.1.0 → 2.2.0; README unchanged — the
      skills-table cell is already generic and doesn't itemize fold-cycle
      mechanics)

## P4 — `workflow-status` + schema package: emit + mirror

- [x] `workflow-status` reads `review-findings.md`, emits only `folded: no` rows.
      Check: `grep -q "review-findings.md" skills/workflow-status/SKILL.md` — PASS
      (process step 9, `skills/workflow-status/SKILL.md:139-157`)
- [x] Structured `findings.fix_now[]` item shape
      `{id, file, axis, severity, class, route, suggested_tier}` shown in the
      envelope example.
      Check: `grep -q "suggested_tier" skills/workflow-status/SKILL.md` — PASS
      (envelope example, `SKILL.md:361`)
- [x] The `suggested_tier` derivation table is fixed/mechanical (severity `high`
      OR subtle axis → `strong`; else `cheap`), reusing `strong`/`cheap`.
      Check: `read-verified` — step 9 states the derivation as a 3-row fixed
      table (`severity == "high"` → `strong`; axis ∈ subtle set → `strong`;
      else `cheap`), a lookup a weak model runs mechanically, no judgement
- [x] `next.tier` derivation is unchanged in intent.
      Check: `read-verified` — the "`next.tier` derivation" section
      (`SKILL.md:305-319`, the command→tier fixed map) was not touched; step 9
      explicitly notes it's "a separate, per-finding field"
- [x] Schema package mirrors the new item shape (types + `envelope.schema.json`),
      version bumped, tests updated.
      Check: `grep -q "suggested_tier" packages/agentic-workflow-schema/src/index.ts packages/agentic-workflow-schema/envelope.schema.json` — PASS
      (`EnvelopeFixNowFinding` replaced; package version 1.0.2 → 2.0.0, major —
      breaking item-shape change per the package's own semver policy)
- [x] Schema package tests pass.
      Check: `cd packages/agentic-workflow-schema && npm test` — PASS, 15/15
      tests green (2 new: populated fix_now item accepted, malformed item
      rejected)
- [x] `bump-skill` ran for `workflow-status` (minor): version + CHANGELOG + README.
      Check: `grep -n 'version:' skills/workflow-status/SKILL.md` — PASS
      (commit `f35f9ba`; version 1.5.1 → 1.6.0)

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
