---
name: triage-issue
user-invocable: true
version: 4.10.1
argument-hint: <issue-number> [more issue numbers…] | <audit-id> F<k> [F<j>…] | --prioritize-now <unit> F<k> [F<j>…]
author: "Gabriel Trabanco <1969593+gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Verify an issue, persisted audit finding, or unresolved review finding against
  current code, classify it, and write only the contracted forge/ledger
  outcome. Supports independent batches and a routed review-finding
  route: a `fix-now` row is handed to `/fold-findings`, never implemented
  here. Triggers: "triage-issue", "triage issue N", "triage this finding",
  "is this trigger met".
---

# Triage Issue
> **Runner commands** below are `runner <subcommand> [args…]` — the launcher, its
> order and the pin are owned by
> [references/RUNNER.md](../runner-contract/references/RUNNER.md): read it before the
> first command, then keep it for the whole unit — nowhere else spells either.

Decide what happens to an issue, grounded in evidence — not vibes. Prevents both
premature work (acting on a deferred item whose trigger is unmet) and silent rot
(a fix-now bug left to drift).

## Turn contract

Load and verify the **canonical** [Turn contract](../orchestration-envelope/references/TURN_CONTRACT.md) (11 boxes) before ending every turn. Skill-specific additions (the docs-language and `→ Next:` boxes are canonical-owned and not restated here):

```
✓ One fixed-format verdict block per issue (Trigger / Checked / Evidence / VERDICT / Action) — plus the summary table when batched
✓ Nothing deferred was implemented inline
✓ Audit-finding mode (`<audit-id> F<k>`): the audit file carries its `↳ triaged` note, and any opened issue cites `Origin: product audit <id>, finding F<k>`
✓ Review-finding mode (`--prioritize-now <unit> F<k>`): every named unresolved finding gets a verdict **and a route** — a `fix-now` row is routed to `/fold-findings` (or an explicit `/execute-phase <unit> P<n>`), never implemented in this turn
✓ Batched input? The closing recommendation maps every issue/finding ID to its own next command, joined with ` + `; it never collapses to one generic action
✓ The issue body carries a `## Surfaces` declaration the batch scheduler can read — written from `--infer-surfaces` output, never hand-typed, never rewritten when one is already there (owner: [ISSUE_PROCESS.md](references/ISSUE_PROCESS.md) step 6)
✓ Every verdict's `Criteria:` line carries a **published** provenance token (`TRIAGE_CRITERIA_PROVENANCE`) — never an invented criteria set, never a silent default
```

Missing reference → STOP. About to end the turn with any box unchecked? The
turn is NOT done — complete the missing box first (weak models drop
end-of-document duties; this list is first on purpose).

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
- **Review findings** — `triage-issue --prioritize-now <unit> F<k> [F<j> …]`
  triages unresolved rows from the current feature/fix unit's findings carrier:
  its `## Findings` section in `SPEC.md` for a migrated unit (issue #308), or
  `review-findings.md` for a legacy one — probe the doc first, never both. This
  route is for findings that `fold-findings` could not close. `--prioritize-now`
  forces the fold route for the named rows in this turn instead of queuing them
  for a later turn; it does not permit a downgrade, postponement, or silent
  drop, and it never authorizes implementing them here — the fold owns the fix
  and the `folded:` flip.
- **Typed receipts** — the same modes accept a **receipt** wherever they accept
  a markdown file: a typed `EnvelopeFixNowFinding` envelope, or the local
  flow's `EXTERNAL VERIFY` block. Read
  [typed receipts](references/RECEIPTS.md) before consuming one.
- **The organic route (`one-shot`)** — small, understood work that meets all
  six eligibility conditions runs inline with the gate only, on your explicit
  consent, and opens no unit. The conditions and the tier disqualification are
  the issue process's classification step; this skill never invents a seventh.
- **Removal (`remove`)** — a deletion is a verdict over measurements published
  by the tree (the residual classifier, the code-net band, the impact sweep),
  never a judgment. It routes the unit that performs the deletion; nothing is
  deleted in a triage turn.


## Step 0 — Discover the project (always first)

**Backlog-sweep citation (S9 c, from #218).** Every newly opened issue must
cite its backlog-sweep `Checked:` line in the body — procedural, auditable
after the fact. When triaging a new issue on behalf of the user, the body
includes a `Checked: <what was searched>` line.

**Ceremony profile (read it before routing).** A project may declare a
`ceremony-profile@1` block in its guide's `## Project charter` — the versioned
machine block that says **which surfaces this project pays for** (grammar owned
by `@gtrabanco/agentic-workflow-schema`; the router reads it and prints
`Profile: <n> applied, <m> refused (ceremony-profile@1 — <source>)`, and an
unprofiled project declares none). Read it before a verdict names a surface: a
review pass or audit the profile marks `discarded` is not a route this skill may
offer, and a piece it does not declare is not added on this skill's authority.
The anti-gaming guard holds **in both directions**: the profile never authorizes
skipping a tier gate, a verification or a non-negotiable (the direction's four
non-negotiables), and a **discarded piece never turns a declared surface into an
error** — it is an explicit, recorded skip, not a silent absence. No profile is
the unprofiled default: unchanged behaviour.

Per the agent guide's **Workflow conventions** + **documentation map**, then read
what THIS skill needs: the location index (e.g. `docs/ROADMAP.md`, whose
`## Fixes` table is the fix index) and fix SPEC template, and the roadmap
tables. **Retrieval aid (optional, never authoritative):**
when the index entry point exists, run it once before the forge read —
`runner doc --query "<topic terms>" --json-only` — to surface prior
findings, decisions and session-log entries on this topic. It is a fast path
over the same corpus grep covers: a missing index, an absent entry point, or an
empty answer changes nothing (grep stays the exhaustive fallback — AC21), and
the index is never a decision authority. In review-finding mode, read the target unit's SPEC,
acceptance, `review-findings.md`, current diff, and PR instead of looking for an
issue comment. Verification starts from the affected-file set — the finding's
`file:line` citations plus the unit doc's per-phase `Relevant files:` lists —
and widens only on a cited lead; never a repo-wide survey from scratch. Otherwise
read the issue in full, comments and labels included, through the guarded read —
the transport lives in the crate, so this is the same command on any forge
(`skills/runner-contract/references/RUNNER.md` owns the invocation):

```sh
runner forge-read issue <N> --comments
```


## Progressive loading — select the triage source

The reference allowlist is exactly the six linked paths below. Never invent or
read another `references/` path. After Step 0:

- Forge issue number(s): read [issue process](references/ISSUE_PROCESS.md).
- Review finding(s): read [review finding process](references/REVIEW_FINDING_PROCESS.md).
- Persisted audit finding(s): first read
  [audit findings](references/AUDIT_FINDINGS.md), then use the verification and
  decision steps in [issue process](references/ISSUE_PROCESS.md).
- Before applying an urgency or disposition label, read
  [label vocabulary](references/LABELS.md); this file is the sole definition of
  names, colors, and mutation rules.
- Only when the verdict writes a row (`fix-in-unit` or `fix-now`), read
  [fold ledger](references/FOLD_LEDGER.md) before writing the row.
- When the findings input is a receipt rather than a markdown file, read
  [typed receipts](references/RECEIPTS.md) before consuming it.

Every resource is one hop from this file. A missing source artifact or required
resource stops that item; batch items remain independent. Never invent a label,
trigger, ledger row, verdict shape, or reference filename. A forge-issue
`postpone` route loads exactly issue process then label vocabulary; it skips
audit findings and fold ledger.

## Guardrails

- The all-stages no-assumption rule binds verification work — **ask-don't-infer**,
  owner `skills/unit-lane/references/DESIGN.md` (`ask-dont-infer@1`): a trigger
  the tree does not evidence is checked and asked about, never assumed.
- Don't build deferred work just because asked to "look at" the issue — surface
  that the trigger is unmet and stop.
- Keep issues, the fix index, and docs in sync with reality — the issue body's
  `## Surfaces` section included: it is what the batch scheduler routes on, so a
  stale one plans the wrong lanes and a missing one plans a guess.
- Otherwise per the project's **Workflow conventions** (docs-language, evidence):
  state exactly what you checked.


## Portability

Use the project's declared forge CLI and translate commands one-for-one. The
classification, label ownership, and persisted-output contracts do not change.

## Relationship to other skills

```
                 ┌─ one-shot ─────────▶ run inline with the gate only (owner consent, no unit doc)
                 ├─ fix-now ─────────▶ /unit-lane --fix <n> ─▶ the lane's implement step
                 ├─ fix-in-unit ─────▶ execute-phase <NN> P<k> (fold into phase)
triage-issue ────┤                    or fold-findings (ledger row)
                 │                    or unit-route <unit> → /unit-lane <unit> (replan)
                 ├─ promote ─────────▶ /unit-lane --from-issue <n> (feature from issue)
                 ├─ postpone ────────▶ dated comment, leave open
                 ├─ remove ──────────▶ /unit-lane --fix <n> carrying the measured receipts
                 └─ wontfix ─────────▶ propose close
```

In review-finding mode, `replan-in-unit` runs `runner unit-route
<unit>`: its `route: replan` line prints
the planner command — `/unit-lane <unit>` for a feature, `/unit-lane --fix <n>`
for a fix — which re-runs the
lane's `plan` catalog step and appends new `P<n>` phases to the same unit. The
lane's own `review` step is the gate before execution. The user manually runs
those phases; this skill never implements them.

## Done when

- The issue has a clear verdict with cited evidence.
- Each review finding has a clear verdict with cited evidence; an oversized
  finding has an explicit planning command and a manual `/execute-phase` hand-off.
- The verdict is recorded (routed, commented, and/or index-updated), and nothing
  deferred was implemented inline.
- **The closing `→ Next:` block is printed** per verdict:

  ```
  Single issue:
  → Next: <command for the recorded verdict> — act on the issue's evidence-backed action

  Batch:
  → Next: apply every verdict: #<n1> → <command> + #<n2> → <command> + #<n3> → <command>
    · fix-now → /unit-lane --fix <n>   · promote → /unit-lane --from-issue <n>
    · fix-in-unit → /execute-phase <NN> P<k> or /fold-findings — never a new planner skill
    · one-shot → run it inline with the gate only, on the owner's consent — no unit doc
    · remove → /unit-lane --fix <n> with the measured receipts attached
    · postpone → dated comment, leave open   · wontfix → propose close
    · same inconsistency across several issues → /product-audit (a recurring pattern,
      not isolated tickets — sweep the product rather than triaging one by one)
  ```

  Replace every placeholder with every actual issue/finding ID and its recorded
  route before printing; never print `<n2>`, `<command>`, or `…` in a live batch.

  A verdict whose route is the fold keeps `/fold-findings` as its command. The
  `execute-phase --repair <receipt>` route is **not live** until the
  fold-findings retirement triggers are green (issue #441 S7): a hand-off block
  never prints a command the tree does not ship.

  The `/product-audit` line fires **only on a recurring inconsistency** — the same
  underlying problem behind multiple issues, not any single triage.
