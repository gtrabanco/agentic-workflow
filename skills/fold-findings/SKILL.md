---
name: fold-findings
user-invocable: true
version: 1.1.1
argument-hint: [finding-id …]
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Repair persisted fix-now findings one at a time: root-cause fix, green gate,
  commit/push, and `folded: yes` ledger update. Never reclassify or substitute
  backlog notes. Triggers: "fold-findings", "fix the review findings",
  "repair audit blockers".
---

# Fold Findings

Repair fix-now findings for real. `review-change` and `audit-pr` already
classify — this skill's only job is to make each classified fix-now finding
disappear by fixing its root cause, never by relabeling, deferring, or
weakening the check that caught it.

## Turn contract — verify before ending the turn

```
✓ 1. Every finding taken up this turn produced its fixed per-finding output
     line (FOLDED <sha> | DISPUTED <reason> | BLOCKED <missing input> |
     REPLAN <proposed phase(s)>) — no finding silently skipped.
✓ 2. For each FOLDED finding: the gate was RUN (not assumed) and green, a
     single commit was RUN with its sha pasted, and (if the branch has an
     open PR) `git push` was RUN immediately after that commit.
✓ 3. The ledger row for each FOLDED finding was flipped `folded: no → yes`
     in the same commit — never a bare code fix with the ledger left stale.
✓ 4. No finding was reclassified: no severity downgrade, no fix-now →
     non-fix-now, no "actually this is fine" — a genuine objection produced
     `DISPUTED` with evidence, routed to `/triage-issue`, never a silent drop.
✓ 5. The closing `Folded: n/m · Disputed: k · Blocked: j[ · Replan: r]` tally and the
     outcome-branched `→ Next:` block are printed as the ABSOLUTE last output.
```

About to end the turn with any box unchecked? The turn is NOT done — complete
the missing box first (weak models drop end-of-document duties; this list is
first on purpose).

## When to use

- After a `/review-change` run reports `Decision: FAIL` with one or more
  fix-now findings on the unit's `review-findings.md` ledger.
- After an `/audit-pr` run reports `VERDICT: BLOCKED` — every blocker on a
  BLOCKED verdict is fix-now by definition and should already be persisted to
  the same ledger (see `skills/audit-pr/SKILL.md` step 5). If it isn't —
  ledger absent or blockers missing — this skill reconstructs the rows from
  the verdict itself (Step 0) instead of reporting "no findings".
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

   **Ledger missing or missing blockers after an `audit-pr` BLOCKED verdict →
   reconstruct, never report "no findings".** If this run was invoked after a
   `VERDICT: BLOCKED` (the verdict is in the conversation, pasted by the user,
   or in the PR's audit comment — read it via the forge CLI when needed) and
   the ledger file is absent or lacks rows for one or more listed blockers:
   append one row per missing blocker yourself, in the ledger's fixed schema
   (`class: fix-now`, `folded: no`, next free `Fn` ids, dedupe by
   `file:line`+axis), commit it as `docs(<unit>): reconstruct fold ledger from
   audit-pr blockers`, and proceed with the fold. Ending the turn with
   "no findings" while a BLOCKED verdict lists blockers is a contract
   violation.
2. Rows with `folded: no` are this turn's queue. If invoked with explicit
   finding IDs as arguments, restrict the queue to those IDs only — everything
   else on the ledger is left untouched (never opportunistically folded).
3. The project's verification gate (type-check, tests, build — per its own
   docs) and its forge CLI (examples use `gh`; translate if the project
   declares another forge).
4. Whether the branch already has an open PR (`gh pr view` or equivalent) —
   this decides whether each commit pushes immediately (see the fold process).

## Progressive loading — fold queue

The reference allowlist is exactly the two paths below. Every invocation reads
both, in order, before changing code or the ledger:

1. [frozen classification, definition of fixed, and forbidden actions](references/FOLD_POLICY.md)
2. [per-finding fold process](references/FOLD_PROCESS.md)

Both resources are normative and one hop from this file. Missing resource →
stop; never infer a classification or fold procedure.

## Report — return exactly this structure (fixed output contract)

Per finding, in the order processed:

```
| <finding-id> | verdict: FOLDED <sha> | DISPUTED <reason → /triage-issue> | BLOCKED <missing input> | REPLAN <proposed phase(s) → /execute-phase> |
```

Then the tally line, exactly:

```
Folded: n/m · Disputed: k · Blocked: j · Replan: r
```

(`· Replan: r` is omitted when r = 0 — existing consumers of the tally line
see the unchanged three-field format.)

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
  finding even if the rest of the run uses a cheaper tier (see fold process 2c);
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
  `BLOCKED`/`REPLAN` line and the tally is printed.
- Every `FOLDED` finding has a pushed commit and a ticked ledger row.
- Nothing was reclassified, and nothing outside the queue was touched.

```
→ Next: (branches on outcome)
  · all FOLDED → /review-change — re-review the branch now that findings are fixed
  · any DISPUTED → /triage-issue <ids> — get an evidence-grounded verdict on the dispute(s)
  · any BLOCKED → supply the missing input listed above, then re-run /fold-findings
  · any REPLAN → confirm the proposed SPEC phase(s), then /execute-phase on this same branch
```
