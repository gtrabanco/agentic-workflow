# fix/80-plan-fix-multi-issue-semantics

## Goal

`plan-fix` is single-issue by contract, but accepts extra issue numbers with
**no defined behavior**: `/plan-fix 71 72 73` is accepted input whose outcome
depends on model strength (a frontier model does primary+absorb; a weak model
may silently plan only the first, ignore the rest, or interleave scopes — and
the user cannot tell which happened without auditing the SPEC). This is the
exact defect class the repo exists to eliminate ("instructions a weaker model
cannot misread", `CLAUDE.md`). It cannot wait for a feature cycle because it
**gates the already-triaged execution** of the #71+#72+#73 shared unit
(triage verdicts 2026-07-17): the recommended path exists but the skill that
materializes it has no contract to receive it, so it works today only when the
user hand-writes the merge instruction in prose.

## Issue

`#80` — GitHub issue. The PR must close it via `Closes #80` in the body.

## Branch

`fix/80-plan-fix-multi-issue-semantics`

## Depends on

None. Independent — pure skill-authoring + doc-parity change.

## Root cause

`skills/plan-fix/SKILL.md` was authored for the 1-issue→1-fix flow: every
artifact is keyed to a single `<n>` — `argument-hint` (L5), branch/SPEC path/
`Closes #<n>`/hand-off (L28, L44, L48–51, L61, L74, L100–106). The
shared-unit practice (multiple issues, one root cause, one fix unit) emerged
later from real triage and never got a contract. No text forbids **or** defines
extra arguments, so multi-number input is accepted-but-unspecified — the worst
contract state for a weak executor (triage evidence, issue #80 comment
2026-07-17).

## Detected in

Issue #80 (filed + triaged 2026-07-17, verdict fix-now, severity high). Not a
runtime failure: a static contract gap surfaced while preparing to execute the
triaged #71+#72+#73 shared unit, which currently has no safe non-prose path.

## Scope

### In scope

The smallest change set that gives `/plan-fix <n> [<n2> …]` fully defined
semantics, plus the doc parity the change forces:

1. `skills/plan-fix/SKILL.md` — `argument-hint`, the `## Input` section, and a
   new multi-issue step in `## Algorithm` encoding the five semantics below,
   the shared-root-cause checklist, and both fixed outputs (merge summary /
   refusal) quoted verbatim; the `## Output` and `## Hand-off` sections adjusted
   so a merged unit is keyed to the **lowest** issue number and the PR carries
   one `Closes #<n>` line **per** issue.
2. `docs/workflow/SKILLS.md` + `docs/workflow/SKILLS.es.md` — the `plan-fix`
   invocation-table row's argument shape (bilingual-sync rule, `CLAUDE.md`).
3. `README.md` + `README.es.md` — any row that states the `plan-fix` argument
   shape (bilingual-sync rule).
4. Version + changelog + README skills/model tables via `bump-skill` (minor
   bump, backward-compatible capability): `skills/plan-fix/SKILL.md` `version:`,
   `CHANGELOG.md`, `CHANGELOG.es.md`, `README.md`, `README.es.md`.

The five defined semantics (verbatim target for the skill body):

1. **One number** → today's behavior, byte-for-byte unchanged.
2. **Multiple numbers** → ingest ALL issues, then run a fixed
   **shared-root-cause checklist** (every box independently checkable):
   - ✓ the issues name the same defect class in the same files/surfaces (cite paths)
   - ✓ one fix would naturally cover them in the same commits (no issue needs work the others' files don't touch)
   - ✓ no issue requires a design decision the others don't (a "needs design call" issue never merges into a mechanical unit)
   - ✓ no conflicting severities/routes recorded in their triage verdicts
3. **All boxes tick** → ONE unit: primary = the **lowest issue number**; branch
   `fix/<primary>-<topic>`, SPEC `docs/fix/<primary>-<topic>/SPEC.md` whose
   scope lists every issue with its own acceptance criteria; the fix-index row
   references all; the PR carries `Closes #<n>` for **each** issue (one per line).
4. **Any box fails** → STOP with a fixed **refusal output**: name the failing
   box per issue pair and print the split
   (`plan these separately: /plan-fix <a>, /plan-fix <b> …`). Never silently
   plan a subset; never silently plan only the first number.
5. **Invalid input** (non-number, unknown issue) → usage error naming the bad
   token; never proceed partially. (Precedent: `review-change` `--adversarial N`
   invalid-input → usage error, `skills/review-change/SKILL.md` L229–233.)

### Out of scope

- **`execute-phase --fix` changes** — none needed; it keys on
  `docs/fix/<n>-<topic>/` and reuses an existing SPEC without re-drafting
  (`skills/execute-phase/SKILL.md` L360, L365). A merged unit under the lowest
  issue number is consumed transparently. Verified, not modified.
- **Actually planning the #71+#72+#73 unit** — that is a separate `plan-fix`
  invocation once this contract lands; belongs to its own fix folder, not here.
- **`triage-issue` batch semantics** — already defined
  (`skills/triage-issue/SKILL.md` L42–45); this fix mirrors its shape, does not
  touch it.
- **Auto-detecting shared root cause across issues the user did NOT pass** — the
  contract is explicit-input only; discovery stays the user's job.

## Acceptance

Objective, verifiable conditions for "done":

- [ ] `skills/plan-fix/SKILL.md` `argument-hint` is `<issue-number> [<issue-number> …]`.
- [ ] The skill body contains the five semantics, the shared-root-cause
      checklist (4 boxes), and both fixed outputs (merge summary + refusal)
      quoted as copy-verbatim fenced blocks (per `CLAUDE.md` "fixed output
      contracts").
- [ ] Single-number invocation is demonstrably unchanged: the one-number path
      produces the same branch / SPEC path / `Closes #<n>` / hand-off as before
      (checklist item "One number → today's behavior, byte-for-byte unchanged"
      present and the single-number examples in `## Input`/`## Hand-off`
      untouched in meaning).
- [ ] `execute-phase --fix <primary>` consumes a merged unit with no change on
      its side — verified by reading `skills/execute-phase/SKILL.md` L360/L365
      (keys on `docs/fix/<n>-<topic>/`); no edit to that file in this PR.
- [ ] Updated `docs/workflow/SKILLS.md` `plan-fix` invocation-table row argument shape.
- [ ] Updated `docs/workflow/SKILLS.es.md` `plan-fix` invocation-table row argument shape (bilingual sync).
- [ ] Updated `README.md` + `README.es.md` any row stating the `plan-fix` argument shape (bilingual sync).
- [ ] `bump-skill` run: `skills/plan-fix/SKILL.md` `version:` minor-bumped
      (2.2.0 → 2.3.0); `CHANGELOG.md` + `CHANGELOG.es.md` rows added; README
      skills/model tables reflect the change.
- [ ] GOLDEN_FIXTURE-style smoke test with the **weakest fleet model** passes:
      (a) two mergeable toy issues → one unit, both `Closes #` present;
      (b) two non-mergeable toy issues → the refusal output verbatim, **zero**
      SPECs written.
- [ ] Repo verification "green" (`CLAUDE.md` Verification): `npx skills add . --list`
      lists `plan-fix`; cross-references resolve; no stack/real-project leakage.

## Phases

Execution ledger — `execute-phase --fix` runs **one phase per invocation** and
ticks tasks here. Every implementation phase below passes all 8 phase-lint boxes
(`docs/fix/_TEMPLATE/SPEC.md` `## Phases` "Phase-lint" — authoritative copy).

### P1 — Multi-issue contract in the plan-fix skill body

Layer: `docs`. Done-when:
`grep -n "argument-hint: <issue-number> \[<issue-number> …\]" skills/plan-fix/SKILL.md`
returns the updated hint **and** `grep -c "shared-root-cause" skills/plan-fix/SKILL.md`
≥ 1 **and** the body contains both fenced fixed-output blocks (merge summary +
refusal).

- [x] Set `argument-hint` to `<issue-number> [<issue-number> …]`.
- [x] Rewrite `## Input` to define one-number vs. multiple-numbers vs.
      invalid-input, deferring semantics to the new Algorithm step.
- [x] Add an Algorithm step encoding the five semantics (one / multiple /
      all-tick / any-fail / invalid) with the 4-box shared-root-cause checklist,
      placed so it runs **before** scope/phases drafting.
- [x] Quote the fixed **merge-summary** output as a copy-verbatim fenced block
      (primary = lowest number; every issue listed with its own acceptance;
      fix-index references all; `Closes #<n>` one per line).
- [x] Quote the fixed **refusal** output as a copy-verbatim fenced block (name
      the failing box per issue pair; print `plan these separately: …`; never
      plan a subset or only the first).
- [x] Adjust `## Output` + `## Hand-off` so a merged unit keys to the lowest
      issue number and the hand-off's `Closes #<n>` note is per-issue; keep the
      single-number wording intact.

### P2 — Documentation parity for the multi-issue argument shape

Layer: `docs`. Done-when: the argument shape `<issue-number> [<issue-number> …]`
appears in `docs/workflow/SKILLS.md`, `docs/workflow/SKILLS.es.md`, and (where
the shape is stated) `README.md` + `README.es.md`; `grep -n "version: 2.3.0"
skills/plan-fix/SKILL.md` matches; `CHANGELOG.md` and `CHANGELOG.es.md` each
carry a new `plan-fix` 2.3.0 row.

- [ ] Update the `plan-fix` argument shape in `docs/workflow/SKILLS.md` invocation table.
- [ ] Update the `plan-fix` argument shape in `docs/workflow/SKILLS.es.md` invocation table.
- [ ] Update any `plan-fix` argument-shape row in `README.md` + `README.es.md`.
- [ ] Run `bump-skill` for `plan-fix` (minor: 2.2.0 → 2.3.0) — version, CHANGELOG EN+ES rows, README skills/model tables.

### P3 — Hardening & PR

- [ ] (manual) GOLDEN_FIXTURE-style smoke test with the weakest fleet model —
      scenario (a) two mergeable toy issues → one unit, both `Closes #` present;
      scenario (b) two non-mergeable toy issues → refusal output verbatim, zero
      SPECs written; paste both transcripts
- [ ] (manual) Confirm `execute-phase --fix` needs no change — read
      `skills/execute-phase/SKILL.md` L360/L365 (keys on `docs/fix/<n>-<topic>/`),
      paste the line refs
- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #80`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #80` and push

## Testing

- **Smoke (authoritative for this fix):** the GOLDEN_FIXTURE-style manual run in
  P3 with the weakest fleet model — the only test that exercises the "weak model
  cannot misread" invariant this fix exists to guarantee. Two scenarios: a
  mergeable pair (→ one unit, both `Closes #`) and a non-mergeable pair (→
  refusal verbatim, zero SPECs).
- **Static (repo gate):** `npx skills add . --list` discovers `plan-fix`;
  markdown well-formed; cross-references resolve; no stack/real-project leakage
  (`CLAUDE.md` Verification). No application build exists.
- **Regression watch:** the single-number path — the smoke test's implicit
  control is that scenario (a)/(b) both start from the multi-number branch; a
  separate one-number dry-read confirms branch/SPEC/`Closes` wording is
  unchanged.

## Rollback

Revert the PR (`gh pr revert` / `git revert <merge-sha>`). Pure
skill-authoring + doc edits — **no** data-side cleanup, no schema, no runtime
state. Reverting restores the prior undefined-but-in-practice-frontier-safe
behavior; nothing is lost because no artifact format changed (the merged-unit
SPEC folder is just an ordinary `docs/fix/<n>-*` folder).

## Impact

- **Layers touched:** `docs` only — one skill body (`skills/plan-fix/SKILL.md`),
  workflow docs (`docs/workflow/SKILLS*.md`), top-level `README*.md`,
  `CHANGELOG*.md`. No code, no schema, no adapter.
- **Modules/files:** `skills/plan-fix/SKILL.md`; `docs/workflow/SKILLS.md`;
  `docs/workflow/SKILLS.es.md`; `README.md`; `README.es.md`; `CHANGELOG.md`;
  `CHANGELOG.es.md`; `docs/fix/README.md` (index row).
- **Blast radius:** dev-only. Worst case of a bad edit = `plan-fix` behaves
  wrongly on the next invocation; caught immediately by the invoking user. No
  user-facing runtime, no data corruption path.
- **Detection lead time:** immediate — the next `plan-fix` run (or the P3 smoke
  test) reveals any defect.

## Rules that must never be violated

- **Single-number path is byte-for-byte unchanged** (issue AC; the contract is
  additive).
- **Fixed output contracts** — both new outputs are copy-verbatim fenced blocks,
  not prose heuristics (`CLAUDE.md` "Checklists over heuristics; fixed output
  formats").
- **Checklists over heuristics** — the shared-root-cause test is 4 independently
  checkable boxes, not a judgement call.
- **Bilingual sync** — every edited EN doc with an ES sibling updates the ES
  sibling in the SAME PR (`CLAUDE.md`). `SKILL.md`/`CHANGELOG` rows follow the
  docs-language rule (EN skill body; CHANGELOG has an ES sibling that IS synced).
- **Phases labelled `P1, P2, …`; final phase is the literal `Hardening & PR`
  close-out chain** (`CLAUDE.md`).
- **Version every change** — `bump-skill` runs; `version:` + both CHANGELOGs +
  both READMEs move together (`CLAUDE.md`).
- **Stack/architecture agnostic** — no product/stack/framework reference leaks
  into the skill or shared docs.

## Operational risks

n/a — no scheduled job, queue, cache, schema, or external adapter. The only
"job" is the next human/agent invocation of `plan-fix`.

## Security risks

n/a — no auth, secrets, PII, webhooks, or rate-limits touched. Input is issue
numbers passed by the user; the invalid-input branch (usage error on a
non-number/unknown issue) closes the only new input surface.

## Compliance touchpoints

n/a — documentation/skill-authoring repo; no domain, data-retention, regional,
or consumer-protection rules apply.

## Affected docs

Each is an acceptance criterion above:

- `docs/workflow/SKILLS.md` — `plan-fix` invocation-table argument shape.
- `docs/workflow/SKILLS.es.md` — same (bilingual sync).
- `README.md` / `README.es.md` — any row stating the `plan-fix` argument shape;
  skills/model tables via `bump-skill` (bilingual sync).
- `CHANGELOG.md` / `CHANGELOG.es.md` — 2.3.0 rows via `bump-skill`.
- `docs/fix/README.md` — this fix's index row (added here; flipped to `done`
  in P3).

## Observability

n/a for prod (no runtime). The "is the fix live and healthy" signal is the P3
smoke test: a weak-model run that produces exactly one merged unit (mergeable
pair) or the verbatim refusal with zero SPECs (non-mergeable pair). If it
degrades silently, the symptom is a future `plan-fix` multi-number run that
plans a subset or only the first number — the precise failure this contract
forbids.

## Cross-issue notes

- **#71 / #72 / #73** — the real downstream consumer. Their triage verdicts
  (2026-07-17) recommend planning them as ONE shared fix unit; #80 supplies the
  contract that lets `plan-fix` receive that unit safely. Relationship:
  **enables** (not a blocker for #80). Decision: land #80 first, then run the
  71+72+73 unit via `/plan-fix 71 72 73`; until #80 merges, the documented prose
  workaround remains the interim path (issue #80 triage comment).
- **#82** — `Phase-lint` heading rendering; postponed; unrelated. No overlap.
- **#78** — `audit-pr` capability-closure check; unrelated planner-contract work;
  no shared files. Decision: unrelated.
- **Open PRs:** none (`gh pr list --state open` → empty), so no PR can absorb or
  block this.

## Effort

**M** — multi-commit by the phased ledger (skill body → doc parity + version
bump → hardening), but each phase is light: no runtime code, no tests to author
beyond the manual weak-model smoke test. Well under a day. Sits at the S/M
boundary; sized M because the phased close-out is genuinely multi-commit.

## Decisions made during drafting

- **Primary = lowest issue number** — taken directly from the issue's expected
  behavior (#80, semantics rule 3). Re-questionable by the implementer only if
  the issue text is later revised.
- **Two docs-layer implementation phases** (contract, then parity) rather than
  one — keeps each phase to a single deliverable and lets `bump-skill` run after
  the skill edit is final. An implementer could merge them only if they can still
  pass phase-lint box 1 (one deliverable per title); the split is the safe default.
- **`bump-skill` lives in P2, not the close-out phase** — it is doc/version
  parity work, and the close-out phase keeps its literal template chain
  unaltered (`CLAUDE.md`).
- **Manual smoke test placed in P3, marked `(manual)`** — phase-lint box 7
  forbids manual/external gates inside implementation phases.

## Status

`pending`
