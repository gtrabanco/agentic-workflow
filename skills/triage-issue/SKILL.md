---
name: triage-issue
user-invocable: true
version: 2.5.1
argument-hint: <issue-number> [more issue numbers…] | <audit-id> F<k> [F<j>…]
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Verify an issue or persisted audit finding against current code, classify it,
  and write only the contracted forge/ledger outcome. Supports independent
  batches. Triggers: "triage-issue", "triage issue N", "is this trigger met".
---

# Triage Issue

Decide what happens to an issue, grounded in evidence — not vibes. Prevents both
premature work (acting on a deferred item whose trigger is unmet) and silent rot
(a fix-now bug left to drift).

## Turn contract — verify before ending the turn

```
✓ One fixed-format verdict block per issue (Trigger / Checked / Evidence / VERDICT / Action) — plus the summary table when batched
✓ Nothing deferred was implemented inline
✓ Audit-finding mode (`<audit-id> F<k>`): the audit file carries its `↳ triaged` note, and any opened issue cites `Origin: product audit <id>, finding F<k>`
✓ Batched input? The closing recommendation maps every issue/finding ID to its own next command, joined with ` + `; it never collapses to one generic action
✓ Artifact language: explicit user instruction > the project's declared docs language > English. The CONVERSATION language never decides — a Spanish prompt still produces English PRs/issues/commits/SPECs unless one of the first two says otherwise
✓ The closing `→ Next:` block is printed as the ABSOLUTE last output
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
- **Audit findings** — `triage-issue <audit-id> F<k> [F<j> …]` triages findings
  from a persisted `product-audit` report instead of existing issues (see
  *Audit-finding mode* below). Batching works the same way.


## Step 0 — Discover the project (always first)

Per the agent guide's **Workflow conventions** + **documentation map**, then read
what THIS skill needs: the fix index (e.g. `docs/fix/README.md`) and fix SPEC
template, and the roadmap. Then read the issue in full, including comments and
labels (forge CLI per the project's Workflow conventions — examples use `gh`):

```sh
gh issue view <N> --json number,title,body,labels,state,comments
```


## Progressive loading — select the triage source

The reference allowlist is exactly the four linked paths below. Never invent or
read another `references/` path. After Step 0:

- Forge issue number(s): read [issue process](references/ISSUE_PROCESS.md).
- Persisted audit finding(s): first read
  [audit findings](references/AUDIT_FINDINGS.md), then use the verification and
  decision steps in [issue process](references/ISSUE_PROCESS.md).
- Before applying an urgency or disposition label, read
  [label vocabulary](references/LABELS.md); this file is the sole definition of
  names, colors, and mutation rules.
- Only when the verdict is `fix-in-unit`, read
  [fold ledger](references/FOLD_LEDGER.md) before writing the row.

Every resource is one hop from this file. A missing source artifact or required
resource stops that item; batch items remain independent. Never invent a label,
trigger, ledger row, verdict shape, or reference filename. A forge-issue
`postpone` route loads exactly issue process then label vocabulary; it skips
audit findings and fold ledger.

## Guardrails

- Don't build deferred work just because asked to "look at" the issue — surface
  that the trigger is unmet and stop.
- Keep issues, the fix index, and docs in sync with reality.
- Otherwise per the project's **Workflow conventions** (docs-language, evidence):
  state exactly what you checked.


## Portability

Use the project's declared forge CLI and translate commands one-for-one. The
classification, label ownership, and persisted-output contracts do not change.

## Relationship to other skills

```
                 ┌─ fix-now ─────────▶ plan-fix ─▶ execute-phase --fix
                 ├─ fix-in-unit ─────▶ execute-phase <NN> P<k> (fold into phase)
triage-issue ────┤                    or fold-findings (ledger row)
                 │                    or design-feature / plan-feature (replan)
                 ├─ promote ─────────▶ plan-feature (router → from-issue)
                 ├─ postpone ────────▶ dated comment, leave open
                 └─ wontfix ─────────▶ propose close
```

## Done when

- The issue has a clear verdict with cited evidence.
- The verdict is recorded (routed, commented, and/or index-updated), and nothing
  deferred was implemented inline.
- **The closing `→ Next:` block is printed** per verdict:

  ```
  Single issue:
  → Next: <command for the recorded verdict> — act on the issue's evidence-backed action

  Batch:
  → Next: apply every verdict: #<n1> → <command> + #<n2> → <command> + #<n3> → <command>
    · fix-now → /plan-fix <n>   · promote → /plan-feature <n>
    · fix-in-unit → /execute-phase <NN> P<k> or /fold-findings — never /plan-fix
    · postpone → dated comment, leave open   · wontfix → propose close
    · same inconsistency across several issues → /product-audit (a recurring pattern,
      not isolated tickets — sweep the product rather than triaging one by one)
  ```

  Replace every placeholder with every actual issue/finding ID and its recorded
  route before printing; never print `<n2>`, `<command>`, or `…` in a live batch.

  The `/product-audit` line fires **only on a recurring inconsistency** — the same
  underlying problem behind multiple issues, not any single triage.
