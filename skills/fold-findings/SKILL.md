---
name: fold-findings
user-invocable: true
version: 1.0.0
argument-hint: [finding-id …]
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Take a review/audit findings ledger (`review-findings.md`) or an `audit-pr`
  BLOCKED verdict's blocker list and truly repair each fix-now finding —
  closing the escape hatches a lazy or weak model reaches for: a
  known-issues/backlog dump, a `decisions.md` tradeoff note, a downgraded
  severity, a skipped/loosened test, a lint suppression, or a `TODO` stub. One
  finding at a time, root-cause fix, gate green, committed and pushed, ledger
  row ticked `folded: yes` with the sha. Triggers: "fold the findings", "fold
  the review findings", "fix the review findings", "repair the audit
  blockers", "fold-findings".
---

# Fold Findings

Repair fix-now findings for real. `review-change` and `audit-pr` already
classify — this skill's only job is to make each classified fix-now finding
disappear by fixing its root cause, never by relabeling, deferring, or
weakening the check that caught it.

## Turn contract — verify before ending the turn

```
✓ 1. Every finding taken up this turn produced its fixed per-finding output
     line (FOLDED <sha> | DISPUTED <reason> | BLOCKED <missing input>) — no
     finding silently skipped.
✓ 2. For each FOLDED finding: the gate was RUN (not assumed) and green, a
     single commit was RUN with its sha pasted, and (if the branch has an
     open PR) `git push` was RUN immediately after that commit.
✓ 3. The ledger row for each FOLDED finding was flipped `folded: no → yes`
     in the same commit — never a bare code fix with the ledger left stale.
✓ 4. No finding was reclassified: no severity downgrade, no fix-now →
     non-fix-now, no "actually this is fine" — a genuine objection produced
     `DISPUTED` with evidence, routed to `/triage-issue`, never a silent drop.
✓ 5. The closing `Folded: n/m · Disputed: k · Blocked: j` tally and the
     outcome-branched `→ Next:` block are printed as the ABSOLUTE last output.
```

About to end the turn with any box unchecked? The turn is NOT done — complete
the missing box first (weak models drop end-of-document duties; this list is
first on purpose).

## When to use

- After a `/review-change` run reports `Decision: FAIL` with one or more
  fix-now findings on the unit's `review-findings.md` ledger.
- After an `/audit-pr` run reports `VERDICT: BLOCKED` — every blocker on a
  BLOCKED verdict is fix-now by definition and is already persisted to the
  same ledger (see `skills/audit-pr/SKILL.md` step 5).
- Never for findings not yet routed fix-now (postpone / wontfix / promote /
  documented-tradeoff) — those are `/triage-issue`'s job, not this skill's.

## Step 0 — Discover the project (always first)

Per the agent guide's **Workflow conventions**, then read what this skill
needs:

1. The unit's `review-findings.md` ledger — `docs/features/<NN>-<slug>/` for a
   feature or `docs/fix/<n>-<topic>/` for a fix. Fixed schema (owned by
   `review-change`/`audit-pr`, never redefined here):

   ```
   | id | file:line | axis | severity | class | route | folded |
   ```

2. Rows with `folded: no` are this turn's queue. If invoked with explicit
   finding IDs as arguments, restrict the queue to those IDs only — everything
   else on the ledger is left untouched (never opportunistically folded).
3. The project's verification gate (type-check, tests, build — per its own
   docs) and its forge CLI (examples use `gh`; translate if the project
   declares another forge).
4. Whether the branch already has an open PR (`gh pr view` or equivalent) —
   this decides whether each commit pushes immediately (see *Process*).

## Frozen classification (hard rule, never relaxed)

This skill **never** edits a finding's `severity`, `class`, or `route`, and
never moves a finding out of fix-now. Those fields belong to `review-change` /
`audit-pr`, the skills that produced the verdict — reopening them here would
let a fix turn into a reclassification. If, while investigating, the finding
genuinely looks wrong (not reproducible, already fixed elsewhere, or the
axis/severity is mistaken), that is **evidence for a dispute**, not a
license to edit the row: mark it `DISPUTED` with the evidence and route it to
`/triage-issue` — the row's `severity`/`class`/`route` stay exactly as
written until `triage-issue` (or a human) says otherwise.

## Definition of fixed (checklist — every box, every finding)

A finding is `FOLDED` only when **all** of these hold:

```
✓ A root-cause diff exists — the actual defect is fixed, not worked around
✓ The gate is green (type-check + tests + build actually RUN, exit codes
  pasted — never assumed)
✓ If the finding was behavioral (a bug, not a style/debt nit): a test or
  check was added/updated that fails without the fix and passes with it
✓ The ledger row is ticked `folded: yes`, in the same commit as the fix
✓ The commit is made AND pushed — an unpushed fix does not exist for CI, the
  reviewer, or the merge gate (skip the push only if the branch has no PR yet
  and the unit's own workflow says push happens later, at the PR step)
```

## Forbidden (never — even if it "would resolve the finding")

```
✗ Adding a known-issues.md / backlog entry instead of fixing the code
✗ A decisions.md tradeoff note that accepts the defect as-is
✗ Deleting, skipping (.skip, .only elsewhere), or loosening a test to make it pass
✗ eslint-disable / @ts-ignore / equivalent suppression AS the fix
✗ A TODO/FIXME stub left in place of the actual fix
✗ Ticking `folded: yes` without a reviewer-mappable diff behind it
✗ Fixing anything NOT on the ledger (or not in the explicit finding-ID
  scope this turn was given) — an opportunistic extra fix belongs to
  /triage-issue as its own finding, never bundled in silently
```

Something forbidden looks like the only option → stop, do not apply it, and
mark the finding `DISPUTED` or `BLOCKED` with the reason instead.

## Process

1. **Build the queue.** Fix-now rows with `folded: no` on the ledger (or the
   explicit finding-ID subset passed as arguments), in ledger order (id
   ascending), which is also roughly severity order since higher-severity
   findings are appended first by the writer skills.
2. **One finding at a time.** For each:
   a. Read the finding's `file:line`, axis, severity, and route.
   b. Diagnose the actual root cause — not the symptom the finding names.
   c. Implement the smallest correct fix. Model-tier note: the model fixing a
      finding should never be weaker than the model that wrote the code, nor
      weaker than the finding's own subtlety warrants — a subtle logic or
      security finding earns your strongest available model for this one
      finding, even if the rest of the run is on a cheaper tier.
   d. Add/update a test for behavioral findings (see checklist).
   e. Run the gate. Red → keep fixing within this finding's scope; if it
      cannot be made green without touching work outside this finding, stop
      and mark it `BLOCKED` with what's missing — never commit red.
   f. Flip this finding's ledger row `folded: no → yes`.
   g. `git add` the diff + the ledger; `git commit -m "fix(<scope>): fold
      <finding-id> — <summary>"` — one commit per finding, never batched.
   h. If the branch has an open PR: `git push` immediately — every open PR
      always reflects the latest folded state.
   i. Emit this finding's line (see *Report*) before moving to the next.
3. **Disputes.** If frozen classification (above) blocks a fix you believe is
   wrong to apply as specified, do not silently skip it — emit `DISPUTED` with
   the evidence gathered in step 2b, and note it for the `/triage-issue`
   hand-off in the closing block. The ledger row is left `folded: no`;
   `triage-issue` (or a human) decides its fate, not this skill.
4. **Blocked.** If a finding needs an input only the user can supply (a
   product decision, a credential, an external system state) — mark it
   `BLOCKED` with exactly what's missing, leave `folded: no`, and continue to
   the next finding rather than stalling the whole run.

## Report — return exactly this structure (fixed output contract)

Per finding, in the order processed:

```
| <finding-id> | verdict: FOLDED <sha> | DISPUTED <reason → /triage-issue> | BLOCKED <missing input> |
```

Then the tally line, exactly:

```
Folded: n/m · Disputed: k · Blocked: j
```

## Guardrails

- Scope is the ledger (or the explicit finding-ID argument subset) — nothing
  else. A finding you notice in passing that isn't on the ledger is not this
  turn's to fix; note it and let `/triage-issue` decide its home.
- Never batch multiple findings into one commit — one finding, one commit,
  one push, one ledger tick; this keeps the fold reviewable finding-by-finding.
- Never widen a fix beyond the finding's own `file:line`/axis unless the root
  cause genuinely requires it — state why in the commit message when it does.
- Artifact language: explicit user instruction > the project's declared docs
  language > English. The conversation language never decides.

## Portability (agents other than Claude Code)

The workflow is the contract; Claude Code features are conveniences. On an
agent that lacks one, apply the fallback — never skip the step the feature
enables:

- **No slash-command menu** — where this skill says `/<skill>`, open that
  skill's `SKILL.md` (wherever your agent installed the skills) and follow it
  literally, in a fresh conversation: hand-offs assume a clean context.
- **No per-skill `model:`/`effort:`** — pick tiers yourself: a subtle
  logic/security finding deserves your strongest available model for that one
  finding even if the rest of the run uses a cheaper tier (see *Process* 2c);
  never fold a finding with a model weaker than the one that wrote the code.
- **No `/loop`** — re-invoke this skill by hand for the next unfolded finding,
  following the closing `→ Next:` block each time.

## Relationship to other skills

```
review-change ──FAIL──┐
audit-pr ──BLOCKED─────┼──▶ fold-findings ──FOLDED──▶ re-run review-change / audit-pr
                       │                  ──DISPUTED─▶ triage-issue
                       │                  ──BLOCKED──▶ user supplies missing input
```

- `review-change` and `audit-pr` **classify and persist** to
  `review-findings.md`; this skill never reclassifies, only reads `folded: no`
  rows and flips them to `yes` after a real fix.
- `execute-phase`'s embedded fold-cycle checklist (§ *Folding review / audit
  findings*) remains the in-context / portability fallback for agents that
  fold inline within a phase's own turn; this skill is the standalone,
  independently-invocable path with the frozen-classification and forbidden-
  list contract made explicit. It hands off rather than composing, and never
  runs above its own tier.
- `DISPUTED` findings route to `/triage-issue`, which reaches its own
  evidence-grounded verdict — this skill never re-litigates a dispute itself.

## Done when

- Every finding in this turn's queue has a per-finding `FOLDED`/`DISPUTED`/
  `BLOCKED` line and the tally is printed.
- Every `FOLDED` finding has a pushed commit and a ticked ledger row.
- Nothing was reclassified, and nothing outside the queue was touched.

```
→ Next: (branches on outcome)
  · all FOLDED → /review-change — re-review the branch now that findings are fixed
  · any DISPUTED → /triage-issue <ids> — get an evidence-grounded verdict on the dispute(s)
  · any BLOCKED → supply the missing input listed above, then re-run /fold-findings
```
