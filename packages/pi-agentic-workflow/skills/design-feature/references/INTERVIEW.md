## Process

1. **Resolve the slug.** A raw idea with no existing folder → propose a number
   (next free roadmap slot) and a kebab-case slug; confirm before writing. An
   existing `NN-slug` → that folder's `SPEC.md` (create the folder + copy the
   template if the roadmap has the row but no folder yet).
2. **Interaction rule (fixed — no interpretation):**
   - **Bare `design-feature <slug>`** (existing SPEC/decisions found): print a
     summary of what the feature currently does (or would do, from a fresh
     idea) → ask what to add / remove / change. This doubles as review mode.
   - **`design-feature <slug> <instruction>`**: apply the instruction
     directly, no questions — touch only what the instruction implies. Still
     re-reads the existing SPEC/decisions first (upsert, never blind).
   - **Nothing exists yet** (brand-new idea, no prior SPEC): go straight to
     step 3 (interview), since there is nothing to review or upsert.
3. **Raw-idea interview (folded in, only when starting from zero or the
   instruction leaves genuine gaps).** Fixed protocol — structural, not
   judgement:
   - **One question per turn, never batched.** Each question carries a
     recommended default the user can accept with one word. Ask nothing the
     docs or the instruction already answer.
   - **Vagueness rubric (fixed slots — the question list IS this list).**
     Probe each slot until it is filled or explicitly `n/a: <reason>`:
     1. **Affected users/roles** — who uses it; who must not.
     2. **Error & edge states** — what happens on failure / empty / invalid.
     3. **Data shape** — what is stored and shown, roughly.
     4. **Boundaries & limits** — sizes, counts, rates, thresholds.
     5. **Out of scope** — what this deliberately does NOT do.
     6. **Success criteria** — how we verify it worked.
   - **Mandatory-question rule.** A stated requirement that has no verifiable
     acceptance criterion yet is automatically the next question — no
     requirement enters the SPEC without one.
   - **Reframe, don't interrogate.** Restate each vague requirement as
     measurable criteria ("fast" → "list renders < 200 ms at 1k rows") and
     ask: "are these the right targets?" — a yes converts directly into
     acceptance criteria.
   - **Deferred decisions.** An answer of "decide later" is recorded as a row
     in the SPEC's `### Deferred decisions` (with a decide-by trigger) —
     never dropped, never silently guessed.
   - **Escalation (structural).** If, after the interview, **≥ 3 rubric slots
     remain empty** (neither filled nor `n/a`), do not guess: end the turn
     `NEEDS_INPUT`, listing the empty slots verbatim as the pending
     questions — the feature is not designable yet.
   - The identity questions ride the same one-per-turn protocol: problem &
     goal, business goals, size estimate (`XS/S/M/L` — XS/S stays SPEC-only,
     M/L gets the full artifact set), non-goals / future work, traceability
     (offer a tracking issue; if created, the eventual PR will `Closes #n`).
4. **Proportional research.** Capability closure (step 5) is cheap and comes
   first. Reach for external or domain research **only** when the feature
   touches a domain genuinely new to the project (a regulation, an unfamiliar
   integration, an industry convention with no precedent in the codebase) —
   never as a systematic per-feature step.

## Turn contract — design closure boxes

```text
✓ Product half written with every capability-closure row resolved (filled surface
  or explicit `n/a: <reason>`) — zero blank rows
✓ Spec-lint product boxes ticked, and `## Design status` set to what they prove
  (never optimistically); roadmap row never written past `defined` here
✓ Evidence rows: every material claim `proven`/`decision` at `current` freshness,
  or `unknown` naming its owner and the next evidence step
✓ `stage: spec` readiness block printed; the artifact is handed off only on
  `READY-FOR-REVIEW`
✓ `artifactRevisionId` rotated for the bytes just written and named in the
  closing block
✓ Repair turns: one batch over the whole open findings set, each finding's repair
  class recorded, no receipt text touched
```
