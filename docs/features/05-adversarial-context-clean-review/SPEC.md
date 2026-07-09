# 05 — adversarial-context-clean-review

> Feature specification. This is the **feature doc** read at the start
> of the workflow (`CLAUDE.md` → Feature workflow). Fill every section.
> Detailed phase tasks live in `PLAN.md` / `TASKS.md`, generated in
> planning mode from this spec.

## Goal

Harden the **mandatory end-of-unit review** against the failure mode where the
conversation that *wrote* a change also reviews it and, sharing the author's
mental model, only catches mechanical issues (numbering, stale wording) while
design defects slip through. Two edits deliver this: (1) `review-implementation`'s
find phase adopts an **adversarial stance** by default — "assume the diff is
WRONG; prove it does not work" — and (2) `review-change` gains a **mandatory
context-clean turn-contract box** requiring the end review to run in a
conversation that did *not* implement the change. Motivated by the Bun-in-Rust
port write-up (bun.com/blog/bun-in-rust), where separated implementer/reviewer
contexts plus an adversarial reviewer caught critical bugs (use-after-free,
panics) that context-sharing reviews miss.

## Branch

`feat/05-adversarial-context-clean-review`

## Size

`S` — two SKILL.md body edits (minor bumps) plus `bump-skill` bookkeeping
(EN/ES). This SPEC is the only planning artifact; implement with
`execute-phase 05` in a single pass.

## Dependencies

**None (hard or soft).** The issue declares "S · no dependencies". This unit
*references* U1's cross-family model-preference one-liner but does **not**
duplicate or depend on unshipped work — U1 already shipped as feature
`04-running-economically` ([PR #22](https://github.com/gtrabanco/agentic-workflow/pull/22),
merged). No fix-index entries and no open fix-now issues touch
`review-implementation` or `review-change`.

## Context

In the 2026-07-05 session, reviews of PRs #8–#10 were run by the *same*
conversation that authored them. Those reviews surfaced only mechanical issues
(numbering clashes, stale wording) and no design defects — the textbook
context-sharing failure mode. Today `review-implementation`'s find phase opens
neutrally ("Scan the scope and record findings … Fix nothing"), and
`review-change`'s turn contract has three boxes, none of which requires the
reviewing conversation to be distinct from the implementing one. `review-change`
already tells other skills to hand off "in a fresh conversation" for *portability*
reasons (line ~244), but nothing makes context-cleanliness a **contract** of the
review itself. This unit closes that gap for the mandatory END review only.

## Business goals

n/a — internal workflow-quality feature (no external product surface).

## Technical goals

- Shift the default review posture from neutral discovery to adversarial
  refutation, so design/correctness defects — not just cosmetics — are the
  review's target.
- Make context-cleanliness an enforceable turn-contract obligation of the
  mandatory end-of-unit review, with an explicit STOP-and-hand-off instruction
  when the reviewing conversation authored the diff.

## Scope

### In scope

- **`review-implementation` — adversarial find stance (minor).** Reword the
  Phase 1 ("Find") framing from neutral ("record findings across these axes")
  to adversarial: **"assume the diff is WRONG; your job is to prove it does not
  work."** The axis table and the Phase 2 classification rubric are unchanged —
  only the *stance* of Phase 1 changes.
- **`review-change` — mandatory context-clean turn-contract box (minor).** Add a
  new box to the `## Turn contract` block:
  *"This review runs in a conversation that did NOT implement the change. If this
  conversation wrote the diff, STOP and hand off to a fresh one. The reviewer
  works from the diff (plus the SPEC for drift checks), not from the author's
  mental state."*
  Reinforce the same requirement wherever the body describes the mandatory
  end-of-unit review (the "When to use" / Process area), consistent with the new
  box.
- **Reference, don't duplicate, the cross-family preference.** Where relevant,
  point to feature 04's cross-family model-preference line ("prefer a different
  model *family* than the writer's") rather than restating it.
- **`bump-skill` bookkeeping.** Minor version bumps for `review-implementation`
  and `review-change`; changelog rows in `CHANGELOG.md` **and** `CHANGELOG.es.md`;
  README skills-table updates (EN/ES) as `bump-skill` dictates.

### Out of scope / non-goals

- **The multi-reviewer `--adversarial N` mode** — owned by **U8** ([#18](https://github.com/gtrabanco/agentic-workflow/issues/18)),
  a separate feature that *depends on* this one. Do not add any `--adversarial`
  flag, parallel-reviewer fan-out, or vote aggregation here.
- **The intermediate 2-phase checkpoint** (`execute-phase` 1.14.0's every-2-phases
  recommendation) stays exactly as it is — a *skippable recommendation*. This unit
  hardens only the **mandatory END review**; it does not touch, promote, or make
  mandatory the mid-flow checkpoint.
- **Re-authoring the cross-family model-preference text** — U1 (feature 04) owns
  it; reference only.
- **The Phase 2 classification rubric** in `review-implementation` — unchanged.
- Any change to `audit-pr`, `product-audit`, or the other `review-*` pack skills
  beyond what a version bump to their shared engine transitively implies (no body
  edits to them in this unit).

## Architecture impact

Docs-only change to two `SKILL.md` bodies (the skills are the product here).
Invariants to hold: (a) both skills keep the repo's authoring contract — turn
contract at the top, fixed output formats, `→ Next:` block last, `## Portability`
section intact; (b) no stack/architecture/product references leak into the skill
text (generic phrasing only); (c) the `review-implementation` axis table and
classification contract are **unchanged** — the diff touches stance wording and
the `review-change` turn contract only. Because `review-implementation` is the
engine `review-change`, `audit-pr`, and `product-audit` compose, the adversarial
stance propagates to all of them by reference — this is intended and requires no
edits to those callers.

## Design

**Edit 1 — `review-implementation`, Phase 1 stance.** Current opening line:
> "Scan the scope and record findings across these axes. Fix nothing."

becomes an adversarial framing, e.g.:
> "**Assume the diff is WRONG — your job is to prove it does not work.** Scan the
> scope adversarially and record every finding across these axes. Fix nothing;
> the classification in Phase 2 decides what matters."

The axis table (rows 1–10), the dead-code exception, the finding format, and all
of Phase 2 remain byte-for-byte as they are apart from surrounding prose that
must stay consistent with the new stance.

**Edit 2 — `review-change`, turn contract.** The current 3-box contract gains a
4th box (placed with the existing boxes, before the "About to end the turn…"
caveat):
> "✓ This review runs in a conversation that did NOT implement the change; if this
> conversation wrote the diff, STOP and hand off to a fresh one (the reviewer
> works from the diff + the SPEC, not the author's mental state)."

The mandatory-review description under "When to use" is reworded to state the
context-clean requirement in prose so the box has a referent in the body, and to
note the cross-family preference by reference to feature 04.

**Propagation.** No caller edits: `audit-pr` / `product-audit` reference
`review-implementation`'s rubric and therefore inherit the adversarial stance
automatically. Confirm (not edit) that their bodies don't restate the neutral
stance in a way that would now contradict the engine.

## Decisions to confirm

- **Adversarial stance is the default, not a flag** (per issue) — RESOLVED:
  default. A tunable multi-reviewer intensity is U8's job.
- **Context-clean box applies to the mandatory END review only** — RESOLVED: yes;
  the mid-flow 2-phase checkpoint stays a skippable recommendation.
- **Both bumps are minor** (per issue) — RESOLVED: minor for both
  (backward-compatible: no invocation/flag/contract-shape change, only stance
  wording + one added contract box; an added turn-contract box is a
  capability, not a breaking change).

## Acceptance criteria

1. `skills/review-implementation/SKILL.md` Phase 1 states the adversarial stance
   — the text "assume the diff is WRONG" (case-insensitive) appears in the Find
   section:
   `grep -iq "assume the diff is wrong" skills/review-implementation/SKILL.md`.
2. The Phase 1 axis table and the entire Phase 2 classification section are
   unchanged in structure (same 10 axes, same class set fix-now/postpone/ignore/
   intentional-tradeoff) — verified by diff review.
3. `skills/review-change/SKILL.md` `## Turn contract` block contains a box
   requiring the review to run in a conversation that did **not** implement the
   change, with an explicit STOP/hand-off instruction — locatable by
   `grep -n "did NOT implement" skills/review-change/SKILL.md` (or equivalent
   wording) inside the turn-contract fence.
4. The cross-family model preference is **referenced** (pointing at feature 04),
   not re-authored, in whichever skill mentions it.
5. No `--adversarial` flag, parallel-reviewer, or vote logic is introduced in
   either skill (U8 scope): `grep -rq "adversarial N\|--adversarial" skills/review-change skills/review-implementation` returns nothing.
6. `review-implementation` and `review-change` each have a bumped `version:`
   (minor), with matching rows in `CHANGELOG.md` and `CHANGELOG.es.md`, and the
   README skills tables (EN/ES) updated — i.e. `bump-skill` ran and its output is
   committed.
7. `npx skills add . --list` still discovers every skill (both edited skills
   parse).

## Testing requirements

No application build exists — "green" is the repo's doc-verification gate
(`CLAUDE.md` → Verification):

- **Structural:** `npx skills add . --list` lists all skills (both edited files
  parse; frontmatter valid).
- **Textual (acceptance criteria as commands):** run the `grep` checks in
  Acceptance criteria 1, 3, 5.
- **Cross-doc:** `bump-skill` bookkeeping is consistent (skill `version:` ↔
  changelog rows EN/ES ↔ README tables) — the same check `audit-docs` performs.
- **Manual read-through:** confirm the adversarial stance and the context-clean
  box read coherently and don't contradict the unchanged Phase 2 rubric or the
  `## Portability` fallbacks.

No unit/integration test layer applies (no code).

## Dev scenarios

n/a — the change alters skill *instruction text*, introducing no runtime
behavior, state, or failure modes to reproduce in dev. The "failure mode" this
feature addresses (context-sharing review) is a process condition enforced by the
turn-contract box, not a code path.

## Phases

Single-pass (size S) — no numbered phase breakdown. Executed end-to-end by
`execute-phase 05`: make both SKILL.md edits, run `bump-skill`, run the
doc-verification gate, open the PR with `Closes #12`. Hardening (edge cases) is
folded into the single pass: re-read both skills to confirm no stance/contract
contradiction and that the `→ Next:` blocks and `## Portability` sections stayed
intact.

## Deploy & rollback

n/a — merging the PR is the whole deploy. Rollback = revert the PR; no data, no
migration, no config.

## Open questions / risks

- **Risk: stance wording overreach.** Making Phase 1 adversarial must not turn
  into inflating severity in Phase 2 — the existing guardrail ("Don't inflate
  severity; separate correctness/security from taste") stays and should be
  reaffirmed so the adversarial *search* doesn't become adversarial
  *classification*. Mitigation: change only Phase 1 prose; leave Phase 2 intact.
- **Risk: contradiction with callers.** `audit-pr`/`product-audit` might restate
  the old neutral framing. Mitigation: Acceptance criterion — grep those skills
  for a conflicting neutral-stance restatement and reconcile by reference if
  found (no scope creep beyond a one-line pointer).
- **Inherited:** none.

## Deliverables

- Edited `skills/review-implementation/SKILL.md` (adversarial Phase 1 stance,
  minor bump).
- Edited `skills/review-change/SKILL.md` (context-clean turn-contract box +
  mandatory-review prose, minor bump).
- `CHANGELOG.md` + `CHANGELOG.es.md` rows; README (EN/ES) skills-table updates —
  via `bump-skill`.
- This SPEC and the `docs/features/ROADMAP.md` entry (row 05).
- PR against `main` carrying `Closes #12`.

## Post-merge next feature

Per the backlog execution order (U1→U2→U3→…), the next unit is **U3 — the
`design-feature` skill** ([#13](https://github.com/gtrabanco/agentic-workflow/issues/13)),
an M–L, major feature. **U8** ([#18](https://github.com/gtrabanco/agentic-workflow/issues/18),
`--adversarial N`) depends on *this* unit being merged. See
`docs/features/ROADMAP.md`.
