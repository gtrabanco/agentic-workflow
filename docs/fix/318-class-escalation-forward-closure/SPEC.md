# fix/318-class-escalation-forward-closure

> Fix specification — one single unit document. Copy this folder to
> `docs/fix/<issue-number>-<topic>/`, fill every section, register the
> entry in `docs/fix/README.md`. This is the same closed unit doc
> `scripts/unit-route.mjs --triage` reads for a feature, in the re-cut
> `spec-by-reference` shape; the fix template keeps four extra sections
> (`Issue`, `Branch`, `Depends on`, `Regression scope`) on top. A unit opened
> before the re-cut keeps the legacy 14-section shape — both are accepted, and a
> legacy doc is never rewritten to migrate it.

## Issue

`#318` — tracked issue in the project's forge. The PR must close it via
`Closes #318` in the body.

## Specs

**S1 — Class escalation: ≥ 2 folded rows sharing mechanism+axis ⇒ one class-level fix-now finding, not repeated instance fixes.**

> ≥ 2 folded ledger rows sharing mechanism+axis ⇒ one class-level fix-now finding whose repair is the *mechanism* (e.g. "pane figures must be machine-born", "readers must use the shared section reader"), not another instance. The two-cycle cap then means what it was built to mean: a class the loop refuses to repair is a planning defect, not more folds.

**S2 — Forward closure: document-or-don't-coin. A new externally-visible contract lands with its consumer-facing documentation in the same change.**

> document-or-don't-coin — a new externally-visible contract lands with its consumer-facing documentation in the same change, recorded where its consumer will look (the promise registry renders into the design/plan output and the PR). Coining without documenting is this issue's latent-defect class, aimed at the future.

**S3 — The PR as a generated, audience-graded evidence pack. Every AC links its demonstration artifact; the body is a generated render.**

> every acceptance criterion links its demonstration artifact (passing test + output, UI capture, reproduced command); the body is a **generated render** of the unit's evidence (criteria → proof → why → resolved ask-gates), never re-typed by hand; two audience layers — the human layer a non-technical approver can validate ("open the app, click the button, here is the capture"), the technical layer the merge gate checks. `audit-pr` extends from "receipt current" to "every AC links a demonstration"; reviewers dig into code only when evidence is absent or contradicts, so review cost scales with the change, not the project.

**S4 — Remove the narration surface that manufactures the findings. Panes become a render of the record.**

> panes become a render of the record (machine mark + pasted script output — no hand re-cuts), defect identity in the ledger moves from `file:line` to the mechanism (the site stays as evidence; this touches the `regression of <id>` rule — the piece needing the most design care), and cycle-count stops being the health metric in favor of machine-verifiable `closure: complete | open(n)` in `unit-route`. Each fold then strictly decreases the defect surface — convergence by construction; the cap + CONVERGENCE-ANOMALY revert to meaning "the design did not know the chain" → replan.

**S5 — Claim-evidence loop: repairer-owned verification with mandatory reproduction and loop-until-green.**

> The trial-and-error loop belongs to the one who repairs, not to the one who reviews. Mechanics, in the repair turn's order:
> 1. **Claim ledger** — before closing the fix, enumerate every claim the repair introduces (each new figure, cross-reference, "X is now Y"; in code: each behavior the fix declares).
> 2. **Mandatory reproduction** — every claim is executed, never asserted: re-derive the figure with the command, resolve the reference with grep, reproduce the behavior; **paste command + observed output** into the fold entry / Evidence row — never type the expected result by hand.
> 3. **Loop until green** — red → repair → re-run, *inside the same turn*, until every claim in the closure set verifies. The repairer's turn does not end with unreproduced claims.
> 4. **Admission rule** — if no command can verify the sentence, it is not a claim, it is an opinion, and it does not get written. This extends the repo's own tests-first rule to documentation artifacts, which today are edited with no test at all.
> Landing: `fold-findings` gains a "verify your own fix" step with a fixed `claim | command | output | ✓` table (the green suite stays necessary but stops being sufficient); `execute-phase`'s `## Evidence` rows become *reproduced* receipts (command + observed output at done-marking time); `verification-contract` requires every acceptance criterion to name its demonstrating command; `review-verify` shifts from discoverer to **auditor of recorded evidence** (re-runs a sample of the recorded commands instead of re-deriving the whole change); the evidence-row shape is pinned as versioned grammar (schema + envelope mirror).

**S6 — Three-direction closure (backward + sideways + forward) with ask-don't-infer and document-or-don't-coin gates.**

> The closure set of any change = **(backward: existing constraints and contracts) + (sideways: sibling surfaces of the same mechanism) + (forward: new promises — every name, field, or endpoint coined that another party will consume)**, with two explicit gates — *ask-don't-infer* whenever the expectation is not evidenced, and *document-or-don't-coin* whenever a contract is invented. Design delivers this graph as its deliverable; the plan turns every promise into a task (including its documentation); review audits that no node is ownerless. This extends the issue body's "Dependency chain in design/plan" piece from a map to a three-direction closure with gates; `finding-closure@1` and the design-time chain share the same grammar so defects and features are audited with one mechanism.

**S7 — PR evidence pack: self-contained, audience-graded, no command no claim.**

> The chain closes at the PR: evidence does not end when the fold verifies its claims — it ends when **someone who did not do the work can approve it without excavating the project**. A non-technical approver is the invariant's final test: if approving requires understanding the codebase, the evidence is incomplete — another instance of works ≠ serves. Four properties:
> 1. **PR as evidence pack, not description.** Every "was asked for X" appears paired with: *here is X* → *here is the proof* (passing tests with outputs, a UI capture of the button, reproduced command output) → *this is how and why* (decisions: why that field name, why the design-system constraint was honored) → *this is what I asked and what was answered* (resolved ask-don't-infer gates stay recorded, so the approver sees nothing was invented).
> 2. **Audience-graded evidence.** Two layers in the same PR: the human layer ("open the app, click the button, here is the capture — you can reproduce this yourself") and the technical layer (test names, commands, outputs). The non-technical approver validates the first; the merge gate (`audit-pr`) validates the second exists and is linked to every criterion.
> 3. **"No command, no claim" scales to the PR.** Like the fold's claims: every acceptance criterion links its demonstration (passing test, capture, reproduced output). A PR whose ACs lack demonstrations never reaches the merge gate.
> 4. **The why travels with the what.** The justification layer (decisions, promise registry — including new contracts and where they are documented for their future consumers) is rendered into the PR's human layer: the approver reads "the button uses the design-system's standard component and the value flows into the existing `color` input, documented for the backend" — not the graph itself.
> Landing: the PR body becomes a **generated render of the unit's evidence** (from the unit doc's acceptance criteria, Evidence rows, decisions and promise registry) — generated, never re-typed, per the same anti-hand-narration rule that kills F49/F50/F51; `audit-pr` extends its gate from "receipt current" to "every AC links a demonstration artifact"; the human/technical layering is part of the PR template's fixed grammar.

**S8 — Deletion mandate: design and plan produce retirements as first-class deliverables.**

> design and plan produce retirements as first-class deliverables, not as review-time discoveries.
> - **Design (`DESIGN.md` / `design-feature`)** — a pass-only-if checklist item beside #303's investigate/orient/ask: *"✓ the design states what this change makes obsolete — every surface, token, pane, helper or contract this unit retires, each with its replacement or its no-consumer evidence."* A design whose answer is empty must say *why nothing can be removed* (a design that only adds is the exceptional case, not the default). Same shape as the questions-and-resolutions section: fixed output, no judgment calls.
> - **Plan (`PLAN.md` / `plan-feature`)** — every retirement becomes a **planned task with its evidence**: the negative-capability pin (the test proving the removed thing cannot return — #315's exact pattern), the sweep grep, the surviving-reference count. Deliberate deletion gets the same rigor as deliberate construction: task, AC, evidence row. Ad-hoc deletions skip evidence; planned ones cannot.
> - **Execution** — retirement tasks are ordinary tasks: they can be a whole phase ("retire the hand-narrated panes") and their phase gate is the pin suite. The anti-gaming rule ("NEVER shrink a diff by deleting…") gains its complement: verified shrinkage is legitimate work, only unverified shrinkage is suspect.
> - **Review** — `review-code`'s checklist asks *"is deleting the surface the complete fix?"* before any edit is proposed; the classifier routes `fix-now (delete)`; `review-debt` items become *scheduled deletions* whose TRIGGER names the removal — executable by a fold batch, not archival prose.
> - **Measurement** — the tier measurement #307 requires counts deletion as value: net lines removed and surfaces retired are tracked deltas, so a unit can succeed by shrinking. Today every metric is a ceiling; shrinkage has no number, and what has no number does not happen.

**S9 — Additional improvements from owner-directed validation:**

> 4b. `LOGS.md` must be pure code output — no model writes it; the mechanism already exists as feature 39 `pi-auto-log-session` (absorbed into 41, #174, open): `autoLogSession: mechanical` writes `session_shutdown` git-facts entries with **no LLM in the hook**, deterministic extraction of the last `→ Next:` and verdicts; the model's conversational summary goes to memory (`mem_session_summary`), never to the tree (the canonical split row 66 already records). Until 41 lands, the interim rule is append-only: a wrong past line gets a *new correcting line*, never an edit.
> 1. The docs-only re-review skip exists (feature 30) and has never been exercised — fix: for docs-only batches with a green sweep declaration, **skip becomes the machine-decided default** — re-review requires recorded justification.
> 2. The gate is all-or-nothing; no surface→suite mapping — fix: affecting-path delta gate. Add a committed, versioned **test-route map** (path-glob → minimal sufficient suite). Intermediate checkpoints run the minimal route — seconds, not 132 s; **the full suite stays where it matters: the merge gate and CI**. Fail-closed: an unmatched path runs the full suite, never fewer tests.
> 3. The most-edited surfaces are the least validated — fix: reader-inventory classification. Extend the inventory with a mandatory classification: every recurring prose surface is declared **`machine-consumed`** (gets a validator probe) or **`history-only`** (exempt from gates — and therefore *cannot generate findings above report-note*). Undeclared surface ⇒ inventory defect, fail-closed.
> 5. Ledger context cost grows unmodeled — fix: deterministic filtered reads + visible size. Passes receive **open rows + last N cycle sections** via a deterministic filter; `unit-route` reports ledger size so growth is visible per unit.
> The original four candidates: (a) absorbed by 3 above; (b) `unit-route` prints `review cycles: N` beside `open-rows` — informed override instead of ritual; (c) every newly opened issue must cite its backlog-sweep `Checked:` line in the body — procedural, auditable after the fact; (d) the persist step gains a self-audit box — every claim the persist introduces is re-derived with pasted output before the commit lands.

**S10 — Deletion mechanics + measured orphan surfaces:**

> 1. **Make deletion measurable, not declarative.** Add a computed check: the net narration diff per fold must be ≤ 0 — lines deleted, not moved.
> 2. **Retirement obligation per unit.** Every unit doc declares which artifacts/sections it **retires**, not only which it adds.
> 3. **Coordinate with #227.** The pane/row renders must come from the #227 emitters, or the hand-render returns.
> 4. **Permanent token accounting.** Token usage should become a standing metric reported at handoff, with a budget gate analogous to the ~400-line diff guard.
> 5. **Owner for `LOGS.md` (3.5k lines, append-only, zero machine consumers) and read-only freeze for legacy carriers** (`progress.md`, `ACCEPTANCE.md`, legacy findings ledgers): declare nobody migrates them and no reader consults them — kill the re-reading cost, not only the writing cost.
> 6. **Survivor/dependents sweep** from comment 6: reviewer anti-invention rule (new findings must be grounded in provably-changed bytes or a mis-run cited check), evidence-bound findings (script verifies each finding's citation), per-file review state (`review-state.json` per unit, single writer = script), and pre-run cost estimate.

**S11 — Convergence by construction:**

> Combined with the closure set and class escalation, each fold now **strictly decreases** the defect surface (it closes the set, deletes orphans, and narration is machine-born) — convergence by construction, not by discipline; the cap + CONVERGENCE-ANOMALY revert to meaning "the design did not know the chain" → replan, not "one more fold".

## Impact

What the fix touches beyond its own lines: every workflow skill that writes narration, folds findings, gates verification, or generates PR content. The affected skill surfaces are: `fold-findings`, `execute-phase`, `verification-contract`, `review-change`, `review-verify`, `audit-pr`, `unit-lane`, `pre-execution-review`, `review-code`, `review-debt`, `triage-issue`, `workflow-status`, `skill-lint`, and the shared references (`LEDGERS.md`, `POLICY.md`, `PREFLIGHT.md`). The PR template (.github/) may need a generated body section. The test route map is a new normative surface. The existing golden fixture and unit docs must pass against changes.

## Non-goals

- Not a replacement for the two-cycle cap — the cap stays.
- Not open-ended repo hunting — closure stays bounded to the mechanism's reference graph.
- No new gate where #315's carrier (`promise-coherence`) can host it — one guard per claim kind.
- No per-stack machinery — closure keys on references and mechanisms: code, prose, design docs, apps, webs, backend, infra, data.
- The survivor/dependents sweep enforcement half is deferred to #315 (already has an owner).
- The machine-pinned vocabularies and figures (delta-measure class) are deferred to #315.

## Future

- #295 (project's upcoming web layer) will own the rendering of bilingual prompts and the web-facing PR evidence pack presentation.
- Feature 41's `autoLogSession: mechanical` fully replaces the LOGS.md append-only interim rule.
- #227 (emitters for pane/row renders) fully replaces hand-rendered panes/rows.

## Future cost

- The test-route map is a normative surface that must be updated when new file patterns are introduced.
- The reader-inventory requires maintenance as surfaces change machine-consumed status.
- The PR template's generated-render feature is a new dependency on the unit doc's structure.

## Applicable tests

- `node --test scripts/unit-route.test.mjs` — triage and route the fix unit
- `node --test scripts/phase-lint.test.mjs` — task/phase grammar
- `node --test scripts/ledger-ownership.test.mjs` — ledger row ownership
- `node --test scripts/ledger-provenance.test.mjs` — provenance annotator
- `node --test scripts/normative-drift.test.mjs` — drift gate for new surfaces
- `node --test scripts/pre-execution-quality.test.mjs` — planning evidence schema
- `node --test scripts/pre-execution-sensor.test.mjs` — pre-execution sensor
- `node --test scripts/golden-fixture.test.mjs` — golden fixture (fixture-validated first)
- `node --test scripts/workflow-status-sensor.test.mjs` — workflow status sensor
- `node --test scripts/lockfile-policy.test.mjs` — lockfile policy
- `node --test scripts/bounded-delivery-loops.test.mjs` — delivery loops
- `node --test scripts/scan-missing-version.mjs` — version scanning
- `bun run test` in `packages/agentic-workflow-schema/` — schema package
- `bun run test` in `packages/pi-agentic-workflow/` — pi package
- `bun scripts/check-skill-context.mjs` — skill context budgets

## Known pre-existing issues

- Feature 41's `autoLogSession: mechanical` is still open (#174). This unit's S9 4b applies the interim append-only rule; the full fix ships with 41.
- #227 (emitters for pane/row renders) is still open. This unit's S10 coordinate with #227 is noted; the full replacement ships with #227.
- #315 (sweep enforcement) is still open. This unit composes with #315; the sweep-receipt claim kind and negative-capability pins come from #315.

## Tasks

- P1 — Freeze the unit doc from the template and register it in docs/fix/README.md (validator: `node --test scripts/unit-doc-contract.test.mjs docs/fix/318-class-escalation-forward-closure/SPEC.md` exits 0)
  (Implements: all S#)
  Relevant files: docs/fix/318-class-escalation-forward-closure/SPEC.md, docs/fix/README.md

- P2 — Class escalation: fold-findings gains ≥ 2 rows sharing mechanism+axis ⇒ one class-level fix-now finding (validator: `bun scripts/pre-execution-quality.test.mjs` exits 0 on the updated fold-findings SKILL.md)
  (Implements: S1)
  Relevant files: skills/fold-findings/SKILL.md

- P3 — Forward closure: design-feature gains document-or-don't-coin checklist item; plan-feature turns every promise into a task (validator: `bun scripts/pre-execution-quality.test.mjs` exits 0 on the updated skill)
  (Implements: S2, S6)
  Relevant files: skills/design-feature/SKILL.md, skills/unit-lane/SKILL.md

- P4 — PR template: generated render of unit evidence (acceptance criteria → proof → why → resolved ask-gates); two audience layers (human + technical) (validator: `node --test scripts/unit-route.test.mjs` exits 0 on the template)
  (Implements: S3, S7)
  Relevant files: .github/PULL_REQUEST_TEMPLATE.md (or equivalent)

- P5 — Narration removal: panes become machine-born render of record; defect identity moves from file:line to mechanism (validator: grep for hand-written narration patterns in skill bodies returns 0 matches in affected skills)
  (Implements: S4, S11)
  Relevant files: skills/fold-findings/SKILL.md, skills/pre-execution-review/references/LEDGERS.md, skills/pre-execution-review/references/POLICY.md

- P6 — Claim-evidence loop: fold-findings gains mandatory reproduction step with claim | command | output | ✓ table; execute-phase Evidence rows require command + observed output (validator: `bun scripts/pre-execution-quality.test.mjs` exits 0 on affected skills)
  (Implements: S5)
  Relevant files: skills/fold-findings/SKILL.md, skills/execute-phase/SKILL.md

- P7 — Review-verify: shift from discoverer to auditor of recorded evidence (re-runs a sample of recorded commands) (validator: `bun scripts/pre-execution-quality.test.mjs` exits 0 on review-verify SKILL.md)
  (Implements: S5)
  Relevant files: skills/review-verify/SKILL.md

- P8 — audit-pr: extend gate from "receipt current" to "every AC links a demonstration artifact" (validator: `bun scripts/pre-execution-quality.test.mjs` exits 0 on audit-pr SKILL.md)
  (Implements: S3, S7)
  Relevant files: skills/audit-pr/SKILL.md

- P9 — Deletion mandate: design-feature checklist item for retirements; review-code checklist for "is deleting the surface the complete fix?" (validator: `bun scripts/pre-execution-quality.test.mjs` exits 0 on affected skills)
  (Implements: S8)
  Relevant files: skills/design-feature/SKILL.md, skills/review-code/SKILL.md, skills/review-debt/SKILL.md

- P10 — Additional improvements: LOGS.md append-only rule; docs-only re-review skip default inversion; test-route map; reader-inventory classification; unit-route prints review cycles count; persist self-audit box (validator: `node --test scripts/workflow-status-sensor.test.mjs` exits 0; `node --test scripts/unit-route.test.mjs` exits 0)
  (Implements: S9, S10)
  Relevant files: skills/execute-phase/SKILL.md, skills/triage-issue/SKILL.md, scripts/unit-route.mjs, docs/LOGS.md

- P11 — Deletion mechanics: net narration diff ≤ 0 check per fold; retirement obligation per unit; token accounting at handoff (validator: `bun scripts/pre-execution-quality.test.mjs` exits 0)
  (Implements: S10)
  Relevant files: skills/fold-findings/SKILL.md

- P12 — Reviewer anti-invention rule: new findings grounded in provably-changed bytes or mis-run cited check (validator: `bun scripts/pre-execution-quality.test.mjs` exits 0 on review-change SKILL.md)
  (Implements: S10)
  Relevant files: skills/review-change/SKILL.md

- P13 — Per-file review state: review-state.json per unit, single writer = script (validator: `node --test scripts/unit-route.test.mjs` exits 0)
  (Implements: S10)
  Relevant files: scripts/unit-route.mjs (or new script)

- P14 — Evidence-bound findings: script verifies each finding's citation — cited file:line exists and snippet matches (validator: `node --test scripts/pre-execution-quality.test.mjs` exits 0)
  (Implements: S10)
  Relevant files: skills/fold-findings/SKILL.md

- P15 — Verification: run the full test suite against the change (validator: `node --test scripts/*.test.mjs` exits 0)
  (Implements: all S#)
  Relevant files: (all)

### Planning evidence

M/L unit — the ledger lives in the separate file [`planning-evidence.md`](planning-evidence.md). Embedded here for XS/S units; for M/L the ledger lives in the unit folder's `planning-evidence.md` and this section names it instead — never both.

### Obligations

M/L unit — the ledger lives in the separate file [`planning-obligations.md`](planning-obligations.md). Embedded here for XS/S units; for M/L the ledger lives in the unit folder's `planning-obligations.md` and this section names it — never both.

## Findings

OPEN rows only: a row a review persisted as fix-now work and no fold has closed
yet. A folded row leaves this table and becomes a `## Log` line. Rows are appended
by `review-change` and `triage-issue` — the writers the `review-findings` truth
class of the ownership map (`skills/pre-execution-review/references/LEDGERS.md`)
declares; this section is that ledger's collapsed carrier, never a second ledger,
and no other writer touches it.

The carrier grammar (`findings-table@1`): the OPEN rows only, appended by
`review-change` and `triage-issue`. A folded row leaves the table and becomes a
`## Log` line, so this table never grows a history column.

```text
findings-table@1
column | shape | what it holds
id | F<n> | the stable finding id a fold and a log line cite
target | S<n> · <file>:<line> | the requirement or the location the finding names
axis | <axis> | the review axis that found it
severity | high \| med \| low | the ledger severity (the canonical scale)
class | product \| plan \| source \| environment \| runtime | the owner that repairs it
route | fold \| replan-in-unit \| decision-required \| product owner — … \| <free prose> | where the row goes; the router reads this column's head first (`scripts/unit-route.mjs`), and `class` names the owner that repairs it
```

| id | S# / file:line | axis | severity | class | route |

## Log

Append-only. `L1` is the issue text verbatim; every later line carries one kind
token from the closed set in `log-kind@1` below — a request or correction
(a verbatim quote), an evidence run, a gate run, a folded finding, an owner
decision, a phase's progress, a review run, a finding's verification. The review
mark and the finding signatures that used to be rows in `review-findings.md` are
`R` and `V` lines here (#308 §Scope 3), so a migrated unit's whole receipt history
is one section. A correction never edits an earlier line: it
appends. Evidence and gate lines carry the command and its exit code, so a
reviewer re-runs a line instead of trusting a table.

```text
log-kind@1
kind | token | what the line records
L | L<n> | the request or a correction, quoting the requester verbatim
E | E<n> | an evidence run — the command, its exit code and its output
G | G<n> | a gate run — the command and its exit code
F | F<n> | a folded finding — the fold commit and what was verified
D | D<n> | an owner decision — the authority and what was decided
P | P<n> | a phase's progress — what was done and the commit
R | R<n> | a review run — `HEAD <sha>`, the verdict, the cycle and the gate exit
V | V<n> | a finding's verification — the row it signs, the recheck and its result
```

- **L1** — 2026-10-29, the issue verbatim:
  ```
  Issue #318: class escalation + forward closure + generated PR evidence pack + remove the narration surface (complements #315 — F49→F50→F51, one class, eleven cycles)
  ```

## Next

Plan the unit: review the spec, cut planning evidence and obligations, then proceed to P1.

## References

- Issue #315 (sweep enforcement — composed, not implemented in this unit)
- Issue #303 (investigate/orient/ask — merged, referenced)
- Issue #227 (emitters for pane/row renders — noted dependency)
- Issue #307 (measured token delta — referenced)
- Issue #205 (review-loop-convergence — absorbed from closed)
- Issue #218 (review-evidence-substrate — absorbed from closed)
- Unit 79 (79-spec-by-reference) — F49→F50→F51: eleven review cycles, one mechanism class
- Unit fix-258 (fix-258-harden-needs-input-contracts) — 12 review→fold cycles that burned
- Feature 30 (re-review optional/skipped branch — never exercised)
- Feature 61 (review-spec/review-plan absorbed into lane)
- Feature 39/41/#174 (autoLogSession — pending, interim rule in S9)

## Branch

`fix/318-class-escalation-forward-closure`

## Depends on

- fix/315 (sweep enforcement) — composed; the sweep-receipt claim kind + negative-capability pins come from #315

## Regression scope

| Scenario | Verification |
|---|---|
| Existing fold-findings behavior: root-cause batch fix, ledger row flip, commit/push | Manual: fold a known finding and verify ledger row flips |
| Existing execute-phase: step execution, evidence rows, progress log | `node --test scripts/unit-route.test.mjs` exits 0 |
| Existing audit-pr: receipt current check | Manual: audit an existing PR |
| Existing review-change: axis classification, finding persistence | `node --test scripts/pre-execution-quality.test.mjs` exits 0 |
| Existing golden fixture: both grammar shapes pass validation | `node --test scripts/golden-fixture.test.mjs` exits 0 |
| Existing test suite: all root tests pass | `node --test scripts/*.test.mjs` exits 0 |
| Existing skill-lint: no skill goes out of budget | `bun scripts/check-skill-context.mjs` exits 0 |
| Schema package tests pass | `bun run test` in `packages/agentic-workflow-schema/` exits 0 |
| Pi package tests pass | `bun run test` in `packages/pi-agentic-workflow/` exits 0 |