## Scaffold process

1. **Verify design.** `## Design status` must be `designed` and Capability
   closure complete. Otherwise stop: this is a caller bug; never repair the
   Product half here.
2. **Resolve identity.** Confirm the existing number/slug, or choose the next
   free number for a designed SPEC missing from the roadmap. Record dependencies
   and surface numbering, ordering, cycle, or overlap conflicts before writing.
3. **Fill only the Engineering half:** technical goals, architecture impact,
   design, decisions to confirm, branch, phases, testing requirements, and dev
   scenarios covering happy path plus reproducible empty/degraded, race, and
   outage cases. Leave no placeholders; put genuine unknowns in `decisions.md`.
   Ground it first per
   [`evidence-grounding`](<../../evidence-grounding/SKILL.md>) — inventory,
   evidence, draft from frozen rows — and freeze the two planning ledgers while
   you cut phases, never afterwards from memory:
   [planning ledgers](<../../pre-execution-review/SKILL.md>).

   - Freeze `planning-evidence.md` (M/L) or `### Planning evidence` in the SPEC
     (XS/S) and `planning-obligations.md` (M/L) or `### Obligations` (XS/S) with
     the column order, statuses, and homes defined **once** in
     [`pre-execution-review`](<../../pre-execution-review/SKILL.md>) — do not
     restate or reorder those columns here. No transcripts, no discarded
     hypotheses; one obligation row per normative behaviour, applicable invariant,
     affected use case, and required failure state.
   - Cut phases only after every obligation row has a phase and a validator that
     can fail.
   - Rotate `artifactRevisionId` for the unit's plan artifacts on this write and
     carry it in the hand-off. A later revert to these same bytes is a new
     authoring event and needs a new id.
4. **Scale by size:**

   - **XS/S:** SPEC + `ACCEPTANCE.md`. Its `### Phases` has checkbox tasks and at least `P1`
     implementation plus final `P2 — Hardening & PR`. Copy the final phase's
     literal tasks from `docs/fix/_TEMPLATE/SPEC.md`; never paraphrase them.
   - **M/L:** create `ACCEPTANCE.md`, `PLAN.md`, `TASKS.md`, `progress.md`, `testing.md`,
     `known-issues.md`, `decisions.md`, and `architecture-notes.md`.
   - **Mandatory split:** use `Depends on:`-chained features when the plan would
     exceed about five phases, any phase spans multiple layers/concerns, or a
     phase contains an unresolved design decision. Reuse the existing dependency
     gate/build order; never invent another mechanism.
   - Every phase passes: independently checkable tasks without judgment; zero
     open design decisions; one layer/concern; locally runnable verification.
     Re-cut or split on any failure.
    - Run the canonical eight-box Phase-lint owned by the
      [phase contract](<../../phase-contract/SKILL.md>) against every phase
      before emission. Any FAIL is re-cut/split; never emit an unticked phase.
   - Run the feature template's full Spec-lint after the Engineering half is
     filled, including Product-half regression boxes. Fix every presence failure
     before reporting.
   - Consume the canonical [verification contract](<../../verification-contract/SKILL.md>)
     and write one compact, frozen `ACCEPTANCE.md` for every size. Map every SPEC
     criterion to a deterministic command, labelled read check, or exact manual
     observation. The manifest is the implementation/review finish line, not a
     second specification.

### M/L artifact contract

- `PLAN.md`: `P1, P2, …` phases only; no `S1`/`Step`. The last implementation
  phase hardens and tests the SPEC failure scenarios.
- `TASKS.md`: per-phase checklists. Express command-checkable acceptance as the
  command; label judgment-only checks `read-verified`. Its final phase ends with
  these literal tasks:

  ```text
  [ ] open the PR (`gh pr create --body-file <path>` — body written as a Markdown file, real backticks, never inline `--body`/heredoc that leaves `\`-escaped backticks) and PRINT THE PR URL in the chat
  [ ] update the roadmap row to `done · [#<pr>](<pr-url>)`
  [ ] commit `docs: link PR #<n>` and push
  ```

- `progress.md`: initialize only `Last reviewed: —`; the executor appends one
  fixed-schema handoff entry after each phase with `Done`, `Remains`, `Gotchas`,
  `Files`, and `Next`.
- `testing.md`: test layers, preferring integration; use the same command rule.
- `ACCEPTANCE.md`: required for every size; frozen validation manifest owned by
  `verification-contract`, with the literal quality floor.
- `known-issues.md`: deferred items linked to/destined for issues, never inline.
- `decisions.md`: architecture/scope decisions and open questions.
- `architecture-notes.md`: layer, port, schema, and binding impact.

5. **Register and verify.** Set the roadmap row to `planned` (`defined → planned`;
   a missing row may be added directly as `planned`). Re-read it after the write.
   If it does not literally say `planned`, reapply and re-read before continuing.
6. **Run the `stage: plan` readiness preflight** from
   [`evidence-grounding`](<../../evidence-grounding/SKILL.md>) (it routes to
   `READINESS.md`) and paste its block. Only `READY-FOR-REVIEW` licenses the hand-off below;
   `NEEDS-EVIDENCE` / `NEEDS-DESIGN` / `NEEDS-REPLAN` means this turn re-runs its
   own step, and it is never written as, quoted as, or summarized as a review
   PASS. Never stamp a receipt or create `planning-findings.md` rows here.
7. **Do not branch or code.** Record the future branch in the SPEC only.
8. **Return exactly** (the caller prints the closing `→ Next:` block, which routes
   to `/review-plan`, never to `/execute-phase`):

```
SCAFFOLD <NN>-<slug> — size: <XS|S|M|L>
Artifacts written: <SPEC.md ACCEPTANCE.md [+ PLAN.md TASKS.md progress.md testing.md
  known-issues.md decisions.md architecture-notes.md for M/L]>
Roadmap: registered as <NN> (deps: <list|none>)   Phases: <n> (P1…P<n>, last = <hardening (M/L) | Hardening & PR (XS/S)>)
Spec-lint: PASS (<n>/<n> boxes)   Phase-lint: PASS (all phases)
Open questions: <n> (in decisions.md) | none
```
