---
name: triage-issue
user-invocable: true
version: 1.8.0
argument-hint: <issue-number> [more issue numbers…]
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Classify an issue and take a defensible decision: fix-now, postpone
  (deferred/trigger-based), wontfix, or promote-to-feature. Reads the issue's own
  "when to fix"/trigger and severity, verifies the trigger against the CURRENT
  codebase (counts consumers, checks thresholds, measures), then routes or
  reports with a dated, auditable comment. On Claude Code and want hand-tuned per-skill model/effort tiers? Install the `#claude` branch instead (`npx skills add gtrabanco/agentic-workflow#claude`) — see the README. This branch is model-agnostic: the skill inherits whatever model and effort your agent session is already using.
  Triggers: "triage issue N", "should we
  fix #N now", "classify this issue", "is #N's trigger met", "what do we do with
  #N".
---

# Triage Issue

Decide what happens to an issue, grounded in evidence — not vibes. Prevents both
premature work (acting on a deferred item whose trigger is unmet) and silent rot
(a fix-now bug left to drift).

## Turn contract — verify before ending the turn

```
✓ One fixed-format verdict block per issue (Trigger / Checked / Evidence / VERDICT / Action) — plus the summary table when batched
✓ Nothing deferred was implemented inline
✓ Artifact language: explicit user instruction > the project's declared docs language > English. The CONVERSATION language never decides — a Spanish prompt still produces English PRs/issues/commits/SPECs unless one of the first two says otherwise
✓ The closing `→ Next:` block is printed, then the machine envelope (fenced ```json — see ## Machine envelope) as the ABSOLUTE last output
```

About to end the turn with any box unchecked? The turn is NOT done — complete
the missing box first (weak models drop end-of-document duties; this list is
first on purpose).

## When to use

- Any issue needing a decision: a freshly filed bug, a `postpone`/`needs-triage`
  item, or a periodic re-confirmation of a deferred tradeoff.
- **Batch triage** — pass several numbers (`triage-issue 12 14 17`): each issue
  gets its own independent verdict + evidence, then one summary table at the
  end. Batching applies to *triage only* — any resulting fix still gets its own
  branch and PR.

## Step 0 — Discover the project (always first)

Per the agent guide's **Workflow conventions** + **documentation map**, then read
what THIS skill needs: the fix index (e.g. `docs/fix/README.md`) and fix SPEC
template, and the roadmap. Then read the issue in full, including comments and
labels (forge CLI per the project's Workflow conventions — examples use `gh`):

```sh
gh issue view <N> --json number,title,body,labels,state,comments
```

## Process

1. **Parse the issue's own contract.** Extract its severity and any "When to
   fix" / "Trigger" / "Acceptance (when triggered)" clause. Many issues carry an
   explicit signal-based trigger — honor it.
2. **Verify the trigger against current code.** Do the actual check, e.g.:
   - count real consumers of a duplicated helper (is the "3rd consumer" here?),
   - check a threshold (article count, p95 latency, row count),
   - reproduce a reported defect, or confirm it's already fixed.
   Use `grep`/`gh`/tests — cite the evidence (paths, counts, line refs).
3. **Classify** into one of:
   - **fix-now** — defect or trigger met → route to `plan-fix` then
     `execute-phase --fix`; add the entry to the fix index.
   - **promote-to-feature** — really new capability → route to `plan-feature`
     (the router handles the issue path).
   - **postpone** — valid but trigger unmet → leave open; post a **dated
     re-confirmation** comment stating what you checked and why it stays
     deferred. Do **not** implement deferred work inline.
   - **wontfix** — obsolete or explicitly bounded by the issue → propose closing,
     with rationale.
4. **When the call is the user's, ask.** If the decision hinges on product/risk
   judgment rather than evidence, present the verdict and options and let the
   user choose before acting.
5. **Report and keep docs coherent.** Post the decision as a dated issue comment
   with evidence. **The comment is Markdown, not shell — never hand-escape it:**
   backticks / `*` / `_` in the body are formatting; a `\` before them renders
   literally (`` \`code\` `` instead of `` `code` ``). Write the comment body to
   a file with the Write tool (plain Markdown, real backticks, zero backslashes)
   and post it with **`gh issue comment <n> --body-file <path>`** (or the
   declared forge's equivalent) — never an inline `--body "…"` or a quoted
   heredoc, which mangle backticks. After posting, `gh issue view <n> --json
   comments` must show the backticks rendering, no literal `` \` ``. If it
   becomes an active fix, register it in the fix index; if
   closed, remove any stale index entry. Never mutate GitHub state (labels,
   close) without confirmation when ambiguous.
6. **Return exactly, per issue** (fixed verdict format — batch runs repeat it,
   then add one summary table):

   ```
   ISSUE #<n> — <title>
   Trigger (the issue's own): <quoted clause | "none stated">
   Checked: <the exact commands/counts/repro run>
   Evidence: <paths, counts, line refs, output>
   VERDICT: fix-now | promote | postpone | wontfix
   Action taken: <fix-index entry + route | dated comment posted | close proposed>
   ```

## Guardrails

- Don't build deferred work just because asked to "look at" the issue — surface
  that the trigger is unmet and stop.
- Keep issues, the fix index, and docs in sync with reality.
- Otherwise per the project's **Workflow conventions** (docs-language, evidence):
  state exactly what you checked.

## Machine envelope

Every invocation ends with the **machine envelope** — schema, field rules and
placement per the installed `orchestration-envelope` skill: one fenced
```json block, printed **after** the closing block above, as the **absolute
last output** of the turn (external orchestrators parse the LAST fenced json
block; see `docs/workflow/ORCHESTRATION.md`). All top-level keys always
present; values only from verified command output, never invented.

This skill emits:

- **`state`:** `OK` (every requested issue got a recorded verdict) or
  `NEEDS_INPUT` (the call is the user's — product/risk judgment; `needs_input`
  carries the options).
- **Fields:** `findings.issues_filed` = issue numbers touched (comment posted /
  created) as integers; `next.recommended` follows the verdict (fix-now →
  `/plan-fix <n>` `tier: "strong"`; promote → `/plan-feature <n>`; postpone /
  wontfix → the next unit).
- `detail`: `{"verdicts": [{"issue": <n>, "verdict": "fix-now|postpone|wontfix|promote", "action": "<what was recorded>"}]}` —
  one entry per issue, batch runs included.

## Portability (agents other than Claude Code)

The workflow is the contract; Claude Code features are conveniences. On an
agent that lacks one, apply the fallback — never skip the step the feature
enables:

- **No slash-command menu** — where this skill says `/<skill>`, open that
  skill's `SKILL.md` (wherever your agent installed the skills) and follow it
  literally, in a fresh conversation: hand-offs assume a clean context.
- **No per-skill `model:`/`effort:`** — on the `#claude` branch the frontmatter pins these tiers; here, pick tiers yourself:
  verifying triggers against the code is a judgment call — run it on your
  **strongest** model.

## Relationship to other skills

```
                 ┌─ fix-now ─────────▶ plan-fix ─▶ execute-phase --fix
triage-issue ────┼─ promote ─────────▶ plan-feature (router → from-issue)
                 ├─ postpone ────────▶ dated comment, leave open
                 └─ wontfix ─────────▶ propose close
```

## Done when

- The issue has a clear verdict with cited evidence.
- The verdict is recorded (routed, commented, and/or index-updated), and nothing
  deferred was implemented inline.
- **The closing `→ Next:` block is printed** per verdict:

  ```
  → Next: act on the verdict(s)
    · fix-now → /plan-fix   · promote → /plan-feature
    · postpone → dated comment, leave open   · wontfix → propose close
    · same inconsistency across several issues → /product-audit (a recurring pattern,
      not isolated tickets — sweep the product rather than triaging one by one)
  ```

  The `/product-audit` line fires **only on a recurring inconsistency** — the same
  underlying problem behind multiple issues, not any single triage.
