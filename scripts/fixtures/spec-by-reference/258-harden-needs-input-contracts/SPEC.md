---
type: fix
scope: large
---

# fix/258-harden-needs-input-contracts

> One-line: three interrupting skills stop inventing answers — the three-tier
> needs-input dispatch, the deterministic dispatcher and the published
> `open-questions@1` block. Requirement ids are `S#` and quote the owner's own
> words; phases are `P#`.

## Specs

Every requirement below is the owner's string, quoted between the markers.
`S#` is a requirement id; `P#` (in `## Tasks`) is a phase label. A later
correction is a verbatim quote under its own requirement id, never a rewrite of
the id it corrects; `S1`–`S4` carry theirs as `S1a`–`S4a`, from the 2026-10-19
owner amendment recorded in `decisions.md`.

**S1 — the three interrupting skills never default a required input.**
> Three surviving skills that interrupt the user for input (`execute-phase`, `unit-lane`, `init-workspace`) continue past a blank required answer by inferring defaults.

**S1a — the 2026-10-19 owner amendment, verbatim (supersedes the blank-answer behaviour above).**
> «en vez de recortar AC1-AC3 … hay que ampliar el scope de este fix para arreglarlo y que funcione como se pretende»

**S2 — one resolution ladder, in order, never skipped.**
> a required-input gap runs the three-tier resolution — repo provenance with a recorded search receipt → bounded research returning 2–3 options → emit the dispatcher's `open-questions@1` block and stop

**S2a — the 2026-10-19 owner amendment, verbatim (the halt carries the questions).**
> Only a user decision closes an open question; a request for more research or discussion is a legitimate answer that re-enters tier 0/1. Execution never interviews.

**S3 — optional input may default; ambiguous input is never the user's.** _S3 is quoted verbatim; at plan time two ordinary sentences were elided (marked `…`), the retained spans are unedited and the whole string is reproduced in `sources.md` row C5._
> Optional input may default; … a gap that survives both stops with the typed `open-questions` block routed back to the owning stage

**S3a — the 2026-10-19 owner amendment, verbatim (the scope is widened, not narrowed).**
> the guard becomes a deterministic producer (state + dispatcher + versioned block), because a prose contract cannot be regressed against

**S4 — the user always knows the workflow is waiting on them.**
> When a required answer is blank, the skill visibly stops with the `open-questions@1` block the needs-input dispatcher prints — the questions, their search receipts, their options and the route back to the owning stage — instead of inventing scope, targets or consent.

**S4a — the 2026-10-20 owner amendment, verbatim (the shipped shape, not a length promise).**
> The shipped shape is one named-policy section per skill (`## Inputs — artifacts, never questions`, `## Inputs — never inferred, never defaulted`, `## Consent — mandatory, never defaulted`), each carrying the three-tier ladder and the dispatcher pointer.

**S5 — a user decision close requires the typed ledger, appended, never rewritten.**
> `decisions.md` is the unit folder's own conversation ledger (extended, not forked)

**S5a — the owner directive of 2026-10-20, verbatim.**
> The fix covers the change and everything that depends on it — callers of what a piece receives, consumers of what it delivers, and a check before removing anything still in use.

## Impact

- **Consumes:** `scripts/needs-input.mjs` (the dispatcher), the
  `open-questions@1` grammar in `skills/orchestration-envelope/references/TURN_CONTRACT.md`,
  the schema package's `no-decision-available` continuation, and the three
  skills' context budgets in `docs/workflow/SKILL_CONTEXT_BUDGETS.json`.
- **Its deliverables are consumed by:** `unit-lane` (a halted lane resumes on
  the block), `execute-phase` (the same halt mid-phase), `init-workspace`
  (consent gaps) and `workflow-status` (the `needs_input` envelope field).
- **Stops being true:** the three hand-written `## Needs-input guard` sections,
  `re-ask once`, `Confirmed phase` and `Confirmed file targets`; a required
  answer may never be defaulted again.
- **Ask before touching:** the schema package's continuation vocabulary (a new
  refusal code is an owner call) and any skill outside the three named ones.

## Non-goals

- No changes to skills other than the three named in `S1`.
- No machine gate that *asks*: the dispatcher only reads and prints.
- No recovery of the absorbed `plan-feature-scaffold` / `plan-fix` skills.

## Future

- `open`, 2026-10-19 — "whether to add a distinct `insufficient-input`
  continuation code beside `no-decision-available`" (`decisions.md` PE-006).
  Deferred: the run reuses the existing code.

## Future cost

- The dispatcher and its suite ship with the repo, so any later change to the
  `decisions.md` grammar or the `open-questions@1` block has to land with them.

## Applicable tests

`node --test scripts/needs-input.test.mjs`, `node --test
scripts/normative-drift.test.mjs`, `node --test scripts/*.test.mjs`, and
`bun scripts/check-skill-context.mjs`.

## Known pre-existing issues

- The three skills sit under enforced context budgets — **affects** this unit:
  every added clause is paid for by a removed one, checked by the budget gate.

## Tasks

- P1 — Audit the three skills' input points and record the classification.
  (Implements: S1, S3)
  (validator: `grep -q "### Input audit" docs/fix/258-harden-needs-input-contracts/SPEC.md` exits 0)
  Relevant files: skills/execute-phase/SKILL.md, skills/unit-lane/SKILL.md, skills/init-workspace/SKILL.md
- P2 — Add the needs-input guard and the contract box to `execute-phase`; the
  `re-ask once` step is withdrawn by `S2a`.
  (Implements: S1, S2, S4)
  (validator: `grep -q "Inputs — artifacts, never questions" skills/execute-phase/SKILL.md` exits 0)
  Relevant files: skills/execute-phase/SKILL.md
- P3 — Add the same guard to `unit-lane` and its `DESIGN.md` / `RESEARCH.md`
  interruption points, plus the contract box.
  (Implements: S1, S2, S4)
  (validator: `grep -q "Inputs — never inferred, never defaulted" skills/unit-lane/SKILL.md` exits 0)
  Relevant files: skills/unit-lane/SKILL.md, skills/unit-lane/references/DESIGN.md, skills/unit-lane/references/RESEARCH.md
- P4 — Add the mandatory-consent guard and the contract box to `init-workspace`.
  (Implements: S1, S2, S4)
  (validator: `grep -q "Consent — mandatory, never defaulted" skills/init-workspace/SKILL.md` exits 0)
  Relevant files: skills/init-workspace/SKILL.md
- P5 — Publish the `decisions.md` ledger contract in the template agent guide
  and the lane docs, composing with the file's existing tables.
  (Implements: S5)
  (validator: `grep -q "open-question" template/AGENTS.md docs/workflow/LANE_FLOW.md` exits 0)
  Relevant files: template/AGENTS.md, docs/workflow/LANE_FLOW.md
- P6 — Implement the dispatcher `scripts/needs-input.mjs` and its suite: the
  `open-questions@1` block, exit 0 on a well-formed artifact, fail-closed on a
  malformed one.
  (Implements: S2, S4)
  (validator: `node --test scripts/needs-input.test.mjs` exits 0)
  Relevant files: scripts/needs-input.mjs, scripts/needs-input.test.mjs
- P7 — Declare `block:open-questions@1` as a normative surface: publish it in
  `TURN_CONTRACT.md` and add its `normative-surfaces@1` row to `AGENTS.md`.
  (Implements: S2, S5)
  (validator: `node --test scripts/normative-drift.test.mjs` exits 0)
  Relevant files: skills/orchestration-envelope/references/TURN_CONTRACT.md, AGENTS.md
- P8 — Shrink the three skills to the pointer: one named-policy section each,
  the stale strings deleted, budgets re-based, findings folded.
  (Implements: S1a, S3a, S4a)
  (validator: `bun scripts/check-skill-context.mjs` exits 0)
  Relevant files: skills/execute-phase/SKILL.md, skills/unit-lane/SKILL.md, skills/init-workspace/SKILL.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json
- P9 — Verification: root suites, context budgets, the drift gate, phase-lint,
  and the version-parity gate at the head.
  (Implements: S4)
  (validator: `node --test scripts/*.test.mjs` exits 0)
  Relevant files: docs/fix/258-harden-needs-input-contracts/SPEC.md

### Planning evidence

M/L unit — the ledger is frozen as `planning-evidence.md` beside this doc (rows
PE-001…PE-009, the prior-decisions sweep included); this section names it and
does not duplicate its rows.

### Obligations

M/L unit — obligations are frozen as `planning-obligations.md` beside this doc
(rows O1–O11, one phase each); this section names it and does not duplicate its
rows.

## Findings

OPEN rows only, written by `review-change` and `triage-issue`; a folded row
becomes a `## Log` line and leaves this table. Rows `F1`–`F8`, `F33`–`F40` and
`F50`–`F57` are folded and live in `## Log`; the remaining rows from the
unit's 1,208-line ledger are summarised there too (`F9`–`F32`, `F41`–`F49`,
`F58`+).

| id | S# / file:line | axis | severity | class | route |
|---|---|---|---|---|---|
| F12 | S2a · `skills/unit-lane/references/DESIGN.md:88` | code | med | source | fold into P3 |
| F14 | S3 · `skills/unit-lane/references/RESEARCH.md:41` | code | low | source | fold into P3 |

## Log

Append-only. `L1` is the request verbatim; every later line is one of six
kinds: `L<n>` request/correction (verbatim quote), `E<n>` evidence run
(`command` · exit · output), `G<n>` gate run (`command` · exit), `F<n>` finding
folded (fold sha + what was verified), `D<n>` owner decision, `P<n>` phase
progress. A correction never edits an earlier line: it appends.

- **L1** — 2026-10-18, the request, verbatim (`#258`):
  ```
  `#258` — tracked issue in the project's forge. The PR must close it via
  `Closes #258` in the body.
  ```
  Scope words (`S1`): a required-input gap, in `execute-phase`, `unit-lane` and
  `init-workspace`, runs the three-tier resolution and stops with the
  dispatcher's block.
- **L2** — 2026-10-19, correction, verbatim (owner, `S1a`/`S3a`):
  «en vez de recortar AC1-AC3 … hay que ampliar el scope de este fix para
  arreglarlo y que funcione como se pretende»
- **L3** — 2026-10-19, correction, verbatim (owner, `S2a`):
  Only a user decision closes an open question; a request for more research or
  discussion is a legitimate answer that re-enters tier 0/1. Execution never
  interviews.
- **L4** — 2026-10-20, correction, verbatim (owner, `S4a`):
  The shipped shape is one named-policy section per skill, each carrying the
  three-tier ladder and the dispatcher pointer.
- **L5** — 2026-10-20, correction, verbatim (owner, `S5a`):
  The fix covers the change and everything that depends on it — callers of what
  a piece receives, consumers of what it delivers, and a check before removing
  anything still in use.
- **E1** — 2026-10-18, `grep -rln "ask the user" skills/*/SKILL.md` · exit 0 ·
  3 skills: `execute-phase`, `unit-lane`, `init-workspace` (PE-002).
- **E2** — 2026-10-19, `node --test scripts/needs-input.test.mjs` · exit 0 ·
  `22 tests · 22 pass · 0 fail` (red run first: 22 failures against the absent
  script).
- **E3** — 2026-10-19, `node --test scripts/*.test.mjs` · exit 0 · `715 tests ·
  715 pass · 0 fail`.
- **E4** — 2026-10-19, `node --test scripts/normative-drift.test.mjs` · exit 0
  · `18 tests · 18 pass · 0 fail`.
- **E5** — 2026-10-20, `node --test scripts/*.test.mjs` · exit 0 · `727 tests ·
  727 pass · 0 fail`.
- **G1** — 2026-10-18, `node --test scripts/*.test.mjs` · exit 0 (P1–P5 head).
- **G2** — 2026-10-19, `bun scripts/check-skill-context.mjs` · exit 0 · 28
  skills PASS, `--routes` 14 routes PASS (P10 head).
- **G3** — 2026-10-19, `node scripts/phase-lint.mjs
  docs/fix/258-harden-needs-input-contracts/SPEC.md` · exit 0 · `verdict PASS`
  (11/11 phases, fingerprint 80fc2b86).
- **G4** — 2026-10-19, `node scripts/version-parity-gate.mjs --content --base
  main` · exit 0 · `VERDICT: PASS` (0.21.0 → 0.23.0).
- **F1** — 2026-10-18, folded F1–F8 · `ec10e7d6` · the P6 head: route ceilings
  re-based and the SPEC grammar repaired; re-verified by re-running the
  declared validators at the fold head.
- **F2** — 2026-10-19, folded F33–F40 · `026bcd50` · the three skills shrank to
  the pointer; `grep -c "^## Needs-input guard"` totals 0 across the three
  files, and the budgets came down with the bodies.
- **F3** — 2026-10-20, folded F50–F57 · `3d8241c5` · the dispatcher reads its
  own block of a multi-block `decisions.md` and skips the path-protection,
  planning-ledger and `Decide for me` records; 34/34 suite green.
- **F4** — 2026-10-20, folded F9–F32 and F41–F49 · `026bcd50` · the
  intermediate review-cycle rows of the widened unit; each was folded inside
  the phase its row routed to, and the fold sha above names the commit that
  carries them.
- **D1** — 2026-10-19, owner, via the form turn recorded in `decisions.md`:
  the scope is widened (P7–P11 appended) instead of narrowing AC1–AC3.
- **D2** — 2026-10-20, owner: the fold covers the change and its dependents;
  `fold-findings` 1.9.0 carries the rule.
- **P1** — 2026-10-18 22:00, input audit recorded · `30718a67`.
- **P2** — 2026-10-18 22:00, `execute-phase` guard + box · `30718a67`.
- **P3** — 2026-10-18 22:00, `unit-lane` + references · `30718a67`.
- **P4** — 2026-10-18 22:00, `init-workspace` consent guard · `30718a67`.
- **P5** — 2026-10-18 22:00, bump-skill pass, versions 5.2.0/1.6.0/3.4.0 ·
  `30718a67`.
- **P6** — 2026-10-18 22:00, verification, root suites and budgets green ·
  `ec10e7d6`.
- **P7** — 2026-10-19, `decisions.md` ledger contract published (AC7) ·
  `026bcd50`.
- **P8** — 2026-10-19, the dispatcher (AC8) · `cfd99fa0`.
- **P9** — 2026-10-19, `open-questions@1` declared (AC9).
- **P10** — 2026-10-19, the three skills shrunk to the pointer (AC1–AC3, AC10)
  · diff-guard exception recorded: 258 lines across 12 files against the
  8-file limit, one atomic step whose validator spans all three skills.
- **P11** — 2026-10-19, verification of the widened unit (AC5, AC6, AC9, AC10);
  every Evidence row re-run at that head.

## Next

The widening is implemented and every gate is green; the mandatory end review
is the next action.

→ Next: /review-change on the changed HEAD — the mandatory end review
  · findings (REVIEW-FAIL) → /fold-findings repairs them; a fresh /review-change follows the fold
  · merge gate after REVIEW-PASS → /audit-pr

## References

- Issue #258 (feat(skills): harden needs-input interactive contracts)
- `review-change` fix `29b52c63` (same defect class, referenced by the issue)
- Feature 61 (lane absorption — why only three skills survive)

## Branch

`fix/258-harden-needs-input-contracts`

## Depends on

none

## Regression scope

- All existing skill wording and behavior outside the guard clauses —
  verified by `node --test scripts/*.test.mjs` and
  `bun scripts/check-skill-context.mjs`.
- The dispatcher's own surface — the `open-questions@1` block, the fail-closed
  reasons and the exit codes — is covered by `scripts/needs-input.test.mjs`.
