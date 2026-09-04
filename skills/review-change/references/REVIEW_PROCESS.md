## Process

1. **Route selection.** No flag → the default single-reviewer review. With
   `--adversarial N` → run the **adversarial multi-reviewer mode** below
   instead (N reviewers FIND, per the *Isolation rule*). With `--synthesize` →
   skip straight to that mode's fusion step (N findings tables pasted in, per
   the synthesis contract). Either way, everything from step 2 onward runs
   once, over the fused table.
   **Freeze the reviewed commit before any pass:** after the clean/remote-current
   check, run `git rev-parse HEAD` once and retain its 40-hex output as the
   **reviewed head SHA**. The final PR receipt may be written only for that exact
   commit; a PR whose head changes during the review requires a fresh review.
   **Read the unit's fold ledger (`review-findings.md`) before any pass — it is
   the review's memory — and state the cycle number** in the report (`Cycle: <n>`,
   completed `REVIEW-RAN` marks + 1). From cycle 2 on, **every `folded: yes` row
   is re-verified at its cited location** before anything else: defect gone →
   pass; defect still present → one new row marked `regression of <id>` (that is
   the only legitimate bypass of the `file:line`+axis dedupe, and it is folded
   with the same evidence bar as any finding); reviewer disagreement with a
   user-approved amendment → `DISPUTED`, never a fresh row re-litigating the
   same location. A cycle ≥ 2 that produces any new fix-now row appends the
   `CONVERGENCE-ANOMALY` block (`pre-execution-review/references/POLICY.md` §4)
   to the report.
2. **Frozen acceptance + SPEC drift check (structural).** Locate sibling
   `ACCEPTANCE.md`, recompute its blob, and require an exact match with the
   execution receipt before assessing the candidate. Missing/mismatch is a
   `workflow` fix-now finding and no passing receipt may be posted. Legacy units
   use the verification contract's committed SPEC-blob fallback. Then build a
   **per-criterion coverage table** from the manifest — one row per acceptance
   criterion, no free-form comparison:

   ```
   | criterion | evidence (file:line or command run) | met | unmet | untouched |
   ```

   Cross-check manifest IDs against the governing SPEC so neither silently
   omits a criterion. Then map each diff hunk to a criterion — or to `none`. Findings, axis
   `spec-drift`: (a) every criterion marked `unmet`/`untouched` that the unit
   claims delivered, and (b) every `none`-mapped hunk (work the SPEC never
   asked for — silent scope excess). Catching drift at a phase checkpoint is
   far cheaper than at the `audit-pr` merge gate. (No SPEC found → note it
   and skip.)
3. **Workflow-discipline check (mechanical, every review).** On the branch
   under review, verify and file findings under axis `workflow`:
   commits follow `<type>(<scope>): <summary>`; phase labels in touched
   planning docs are `P1, P2, …` (never `S1`/"Steps"); the phase's per-phase
   docs were updated (TASKS ticks, progress entry); no commit landed on the
   default branch; artifacts are in the project's declared docs language.
   **Workspace state is a precondition, not a finding.** Run
   `git status --porcelain`, and when the branch has an open PR `git fetch` +
   `git status -sb`. Any tracked modification, or being ahead of/behind the
   remote, stops the review **before any pass runs** — no findings table, no
   ledger write, no verdict, and never a `workflow` finding persisted for it
   (a review that filed its own dirty tree would hand the next review the
   same finding, forever):

   ```text
   REVIEW BLOCKED — workspace state
   - `git status --porcelain`: <lines, or `clean`>
   - `git status -sb`: <line, or n/a: no open PR>
   → Next: commit or stash the listed files, then re-run /review-change.
     Untracked, non-ignored harness/toolstate nobody authored for this unit
     (.engram/, .pi/, .serena/, session files) is committed once or added to
     .gitignore — named here, never reviewed. A verdict on a workspace whose
     state the forge cannot see is withheld, not filed.
   ```

   Run the greps/`git log`/`git status` — don't infer compliance.
4. **Applicable pack passes (the finders).** For each axis the matrix +
   footprint mark as relevant, run the workflow's own internal skill for it
   (`review-code`, `review-security`, `review-verify`, `review-design`,
   `review-a11y`, `review-brand`, `review-perf`, `review-seo`) — **isolated,
   per the *Isolation rule* above**, each returning ONLY its fixed-format
   findings table + `PASS|FAIL`. **Skip the rest** and say which you skipped and
   why. The pack ships with the workflow, so an applicable pass can never be
   "missing". Passes **FIND** only — none of them classifies.
5. **Optional extras.** If the project recorded additional platform review skills
   (stack-specific linters, framework skills) and they are installed, run them
   **in addition** — their findings merge into the same table. Never treat an
   absent extra as a gap; the pack already covered the axis.
6. **Verify, then synthesize.** Before fusing anything, every candidate finding
   is **verified in an isolated context against the reviewed head's bytes** (the
   SHA frozen in step 1) and marked `confirmed` or `refuted`. The recheck method
   follows the finding's axis:
   - a **code / behavioral** claim confirms only with a **failing reproducer** —
     a red test written first and run against **unchanged code**, or
     **reproducible command output**;
   - a **documentation / wording** claim confirms by **direct read** of the
     cited text (typos and wording are corrected without ceremony, no test);
   - a **missing-documentation** claim confirms the named user path is
     undocumented.
   Only **confirmed** candidates flow to synthesis; a **refuted** candidate is
   reported with its counter-evidence in the same report and never becomes a
   row, a fold task, or a re-review trigger. The per-finding durable mark is
   `finding-mark@1` (contract in `pre-execution-review/references/LEDGERS.md`).

7. **Synthesize.** Fuse all findings into **one** findings table, deduped by
   `file:line` + axis, per the synthesis contract (the same fusion rules apply
   in the default single-reviewer case). Columns: `# | Finding | Axis | Sev |
   Evidence | Suggested fix` — **unclassified**. Overlapping signals on the same
   defect collapse into one row. Add a **`Reviewers n/N`** column when running
   in `--adversarial N` mode (omitted entirely in the default single-reviewer
   case).
8. **Classify (once).** Run `review-implementation` over the synthesized table
   (isolated, per the *Isolation rule*) — the single classification engine
   (D5). It verifies axis coverage (every applicable axis represented; a
   missing axis is a `coverage` finding) and applies the current-unit contract:
   `ignore` first, then fix-now / replan-in-unit / decision-required for
   current-unit work, `proposal` for genuinely independent future capabilities
   → the **classified decision table** (Sev, Class, WHY, impl risk, long-term
   impact, premature-opt?, Route). No per-pass or per-reviewer classification,
   no re-litigation.
9. **Debt transform.** Run `review-debt` over the classified table — it
   transforms debt-shaped findings into explicit TRIGGER-carrying debt items;
   it does not rescan the diff (SPEC contract).
10. **Manual-verification checklist.** List what automated review **cannot** confirm
   and a human must check — visual correctness, real-device/locale behavior, UX
   feel, perf under load, anything marked *verify*. Be explicit so the dev has zero
   doubt about what to eyeball.
11. **Route the outcomes.** fix-now findings fold into the current unit (or gain
    user-confirmed phases via replan-in-unit); decision-required stops for the
    user's decision; genuinely independent future capabilities become
    **non-blocking proposals** — batched in the report with a trigger, and
    **never** sent to `triage-issue` automatically (D3). `review-change` creates
    no backlog work. No non-fix-now finding may end without a destination — none
    silently lost.

## Two-cycle cap

The review→fold loop runs at most **two** review→fold cycles per unit, counted
unit-level and family-agnostic from the ledger's `REVIEW-RAN` marks and forge
receipts — new finding families do not reset the count. After two cycles without
convergence, the review prints

```text
LOOP CAP REACHED — <unit>
- Finding ids: <every open id>
- Cycles: 2 (REVIEW-RAN marks + forge receipts)
- Route: /triage-issue --prioritize-now <unit> F<k> … (or the programmatic outer driver)
```

A **third cycle never starts** unless the user explicitly instructs it — it is
the user's escape, never a reviewer election. The residue routes to
`triage-issue --prioritize-now` (or the programmatic outer driver), and a unit
that needs a third cycle has a planning or root-cause defect, not a review
deficit.
