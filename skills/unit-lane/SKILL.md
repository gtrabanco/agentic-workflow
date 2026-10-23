---
name: unit-lane
user-invocable: true
version: 2.4.1
argument-hint: <NN-slug | "<idea>"> [--retriage] | --fix <issue-number> | --from-issue <issue-number>
description: >
  One-shot lane conductor for a delivery unit: triage, implement, evidence, and
  close in a single document. Triggers: "unit-lane", "run the lane",
  "work on this feature/fix", "build this unit".
---

# Unit Lane — Adaptive Conductor

One document, adaptive steps. The lane reads a closed catalog, triages which
steps a unit needs, executes them in order, and commits at each gate. Replaces:
design-feature, plan-feature, review-spec, review-plan.

## Turn contract

Tick every box before ending the turn; an unchecked box means the turn is not
done:

```
✓ Required user inputs were answered concretely (not defaulted). Nothing here
  is inferred: a gap re-enters provenance → research, and a gap surviving both
  runs `node scripts/needs-input.mjs <unit-dir>` and stops with the
  `open-questions@1` block routed back to the owning stage.
✓ Every claim the SPEC or the plan asserts (objective, why, ACs, tasks) cites
  its source — `path:line`, a doc, or an owner answer in the unit folder's
  `sources.md`. A claim with none is a question, never a default.
✓ Every question asked is recorded with its resolution (owner answer, "Decide
  for me" + reason, or the explicit `none — no questions` line) in
  `decisions.md`; no question the user already answered is asked twice.
✓ Triage ran (bun scripts/unit-route.mjs --triage <slug>) and its block pasted
  verbatim into the unit doc's Evidence section as the authoritative step list
✓ Unit doc exists at docs/features/<NN>-<slug>/SPEC.md (created from template
  if new, with all mandatory sections filled or n/a)
✓ Guard ran (bun scripts/diff-guard.mjs --base <ref>) after each implement step;
  on BREACH: re-triage or record exception, never shrink the diff
✓ The unit's evidence carrier updated (Evidence rows, or `## Log` `E` lines for a
  re-cut unit — command → exit/digest → output → verified-by) and its progress
  recorded (dated Progress entry, or a `## Log` `P` line) before every commit
✓ → Next: block printed as the absolute last output
```

## When to use

- A known unit slug: `unit-lane <NN-slug>`
- A raw idea (no slug yet): `unit-lane "<idea description>"`
- A tracked fix issue (no fix folder yet): `unit-lane --fix <issue-number>`
- A tracked roadmap feature issue (no feature folder yet): `unit-lane --from-issue <issue-number>`
- Force re-triage: `unit-lane <NN-slug> --retriage`

Both `--fix <n>` and `--from-issue <n>` are the exact forms
`scripts/unit-route.mjs` prints for a tracked issue with no unit folder
(`route: plan-from-issue`) — never invent a different spelling.

## Inputs — never inferred, never defaulted

The unit identifier, a mode's issue number, the unit kind, and the
objective/why/user-outcome the SPEC carries are **never inferred**: no silent
`feature` default, no acceptance criterion invented from a vague request. A gap
is resolved in one fixed order — **(0) provenance** (search the repo's own docs
and append an `open-question` row to the unit's `decisions.md` recording where)
→ **(1) research** (2–3 concrete options with trade-offs; asking for more
research is a legitimate answer) → **(2) halt**: run `node
scripts/needs-input.mjs <unit-dir>`, paste the `open-questions@1` block verbatim,
stop. The block routes each question back to the stage that owns the fact —
`design` for scope/architecture, `unit-lane` for plan-owned facts. Grammar and
exit codes: `orchestration-envelope`'s `references/TURN_CONTRACT.md` §Open
questions.

The conversation lives in the unit folder's `decisions.md` (append-only
`open-questions@1`; its two entry types are published in the template agent
guide's question protocol). A resumed session re-reads the pending rows and
continues from the first one still open — never re-asks them.

## Step 0 — Discover the project

Per the agent guide's **Workflow conventions** + **documentation map**, then read
`docs/features/_TEMPLATE/SPEC.md` (the unit doc template). If the unit folder
exists, read its current `SPEC.md` to avoid overwriting. If this work returns
to an area other unit docs already touch, scan their `## Future` sections and
surface each open row as plan-now / keep-deferred / discard before continuing.

## Process

### 1. Resolve or create the unit doc

If the unit folder already exists, read its `SPEC.md` and continue. Otherwise
create it from the tree the unit belongs to:

| Invocation | Folder | Template | Index to register |
|---|---|---|---|
| `<NN-slug>` / `"<idea>"` | `docs/features/<NN>-<slug>/` | `docs/features/_TEMPLATE/SPEC.md` | `docs/features/ROADMAP.md` |
| `--fix <issue-number>` | `docs/fix/<issue-number>-<topic>/` | `docs/fix/_TEMPLATE/SPEC.md` | `docs/fix/README.md` |
| `--from-issue <issue-number>` | `docs/features/<NN>-<slug>/` | `docs/features/_TEMPLATE/SPEC.md` | `docs/features/ROADMAP.md` (row links `#<issue-number>`) |

For `--fix`/`--from-issue`, read the tracked issue in the forge first and keep
its number; the folder name carries it (`fix/<issue-number>-<topic>`). Fill
objective, why, user outcome, and non-goals from the invocation (or the issue).
Acceptance criteria are induced from user scenarios — **ask-don't-infer**; if the
request is too vague, STOP and ask the user with concrete options. Open
decisions that are not acceptance criteria run through the design step's
**gap interview** — one batched form-turn with recommended options + why,
`Decide for me` (recorded in `decisions.md`), and cheap defaults recorded as
assumptions. See
[the unit doc template](references/STEPS.md) for section order.

### 2. Triage — read the catalog, never re-derive

Run `bun scripts/unit-route.mjs --triage <slug>` (or `<NN>` for numeric). PASTE
its stdout block **verbatim** into the unit doc's Evidence section header under
a `## Triaged steps` heading. This block is authoritative. The model never
re-derives, reorders, or invents steps — it executes only what the catalog says.

### 3. Execute triaged steps in order

For each step the triage returned, follow its reference file. Judgment steps
(research, design, plan, evidence, docs, review) run inline, **one step per
turn-commit**:

1. Read the step's reference — for example:
   [research](references/RESEARCH.md), [design](references/DESIGN.md),
   [plan](references/PLAN.md), [implement](references/IMPLEMENT.md),
   [tests](references/TESTS.md), [evidence](references/EVIDENCE.md),
   [review](references/REVIEW.md), [docs](references/DOCS.md),
   [release](references/RELEASE.md) — only the ones the triage demands).
2. Perform the step's checklist items.
3. Write/update evidence in the unit doc.
4. Update the Progress log with a dated entry.
5. Commit with a conventional commit message.
6. For implement steps, run the diff guard (step 4 below).

Execution steps (implement, tests) **never run inline at the conductor's
tier** — per-step model routing is reachable only across a turn boundary, so
execution work hands off one phase per turn:

```
→ Next: /execute-phase <NN-slug> P<k> (tier: <tier>) — run phase P<k>; the lane resumes after the last phase
  · no unfinished phase → continue the close-out ladder (step 6)
```

`<k>` is the first unfinished phase (the unit doc's Progress log records the
phases done so far; `bun scripts/unit-route.mjs <NN-slug>` prints it — when every
phase is recorded but the index still reads `in-progress`, the router refuses with
`UNIT ROUTE — error … settle the index or roadmap status` and exits 1: settle the
status, then continue the ladder) and
`<tier>` is the `implement` entry of the triage block's `Tiers:` line. Never
print the bare whole-unit `/execute-phase <NN-slug>` — whole-unit loop mode
survives only as an explicit operator choice. When the last phase's turn
closes, `execute-phase` resumes the lane and the remaining judgment steps
(evidence, review, docs, release) run here.

### 4. Diff-size guard (after each implement step)

Run `bun scripts/diff-guard.mjs --base <last-reviewed-ref> --unit <NN>`. Paste
the output verbatim. On **BREACH**: stop, re-triage the unit, or record an
exception. **Anti-gaming: NEVER shrink a diff by deleting comments, blank lines,
docs or tests.** If the unit cannot fit the budget, record the exception and stop.

### 5. Update evidence and progress

Before every commit:

- **Evidence rows**: One row per AC satisfied — `| AC | command | exit/digest |
  output (≤2 lines) | verified-by |`
- **Progress log**: `YYYY-MM-DD HH:MM — <what was done> → <commit sha> — next:
  <what is next>`

### 6. Close the unit — the close-out ladder

When all triaged steps are done, in order:

1. Run the review step (the in-doc `REVIEW-VERDICT` per
   [review](references/REVIEW.md)).
2. Resolve every `## Future` row with the user (planned now — registered on
   explicit request only —, kept deferred, or discarded, dated).
3. Update the unit doc's status and the index row (release step: branch
   hygiene, PR creation, forge reconciliation).
4. **Receipt stage.** The in-doc verdict is not the machine receipt. Verify
   the PR's review receipt (`bun scripts/review-receipt.mjs verify --pr <N>`):
   - **exit 0** (a current `review-change:pass` receipt at the settled head) →
     the closing `→ Next:` recommends `/audit-pr <PR-url>` as the terminal
     stage, with the receipt stated as its precondition.
   - **otherwise** → the closing block is `→ Next: /review-change <NN-slug>`
     (the receipt's sole owner) and `/audit-pr` is not printed — the gate is
     never named before its precondition exists.

A turn that ends with an unchecked ladder step is not done.

## Guardrails

**Allowed:**
- Only the triaged steps listed by the catalog
- Changes scoped to the acceptance criteria
- Deferred user ideas recorded in the unit doc's `## Future`, never implemented
- Documentation updates in docs/ and template/
- Conventional commit messages per the project's Workflow conventions

**Forbidden:**
- Never expand scope beyond what Non-goals define — findings discovered during
  implementation never widen the unit
- Never invent an acceptance criterion — ask the user with concrete options
- Never skip a triaged step silently — every step the catalog demands must run
- Findings never authorize scope growth — record them, route to their owner
- Never commit red (test failure) — fix or replan, never silence tests
- Never alter a triaged step's order
- Never run an execution phase inline or print a bare whole-unit
  `/execute-phase` command — one phase per hand-off, tier attached
- Never print `/audit-pr` before the PR's review receipt verifies current —
  the receipt stage precedes the gate, always

## Relationship to other skills

`unit-lane` absorbed the retired fixed-pipeline skills (design-feature,
plan-feature, review-spec, review-plan) into catalog steps. `execute-phase` is
the lane's executor: the lane conducts (triage, plan, evidence, review,
close-out) and hands execution off one phase per turn at the phase's tier;
its closing block names the next single phase and resumes the lane after the
last one. The review pack axes (`review-implementation`, `review-code`,
`review-security`, `review-perf`, `review-a11y`, `review-debt`) compose the
review step; `/review-change` owns the SHA-bound receipt the close-out ladder
verifies; `/audit-pr` is the terminal merge gate. `triage-issue` feeds issues
into the lane; `workflow-status` computes the next lane invocation.
`init-workspace` seeds the unit doc template and catalog conventions into
target projects.

## Portability (agents other than Claude Code)

- **No slash menu** — open this `SKILL.md` and follow it literally in a fresh
  conversation. Where it says `run`, execute the shell command directly.
- **No model tiers** — triage and review use the strongest model; execution
  steps may use cheaper. Never review with a weaker model than the author.
- **No `/loop`/subagents** — re-invoke manually and follow the closing `→ Next:`
  block at each step boundary.

## Done when

- Every triaged step is executed and committed — execution phases one
  `/execute-phase <NN-slug> P<k>` turn each, never inline.
- The unit doc's Evidence rows, Progress log, and References section are current.
- The diff guard passed for all implement steps (or an exception is recorded).
- The review step is complete (or skipped per catalog).
- The close-out ladder ran: receipt verified current, or the closing block
  hands off to `/review-change` before any `/audit-pr` mention.
- **The closing `→ Next:` block is printed.**

## Closing recommendation

```
→ Next: /execute-phase <NN-slug> P<k> (tier: <tier>) — run the next unfinished phase
  · execution done, receipt current (verify --pr <N> exit 0) → /audit-pr <PR-url> — terminal merge gate; the current review-change:pass receipt is its precondition
  · execution done, PR open, receipt missing → /review-change <NN-slug> — post the SHA-bound receipt first
  · re-triage needed → /unit-lane <NN-slug> --retriage
```