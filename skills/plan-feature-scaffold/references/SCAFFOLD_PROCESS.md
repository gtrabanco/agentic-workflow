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
4. **Scale by size:**

   - **XS/S:** SPEC only. Its `### Phases` has checkbox tasks and at least `P1`
     implementation plus final `P2 — Hardening & PR`. Copy the final phase's
     literal tasks from `docs/fix/_TEMPLATE/SPEC.md`; never paraphrase them.
   - **M/L:** create `PLAN.md`, `TASKS.md`, `progress.md`, `testing.md`,
     `known-issues.md`, `decisions.md`, and `architecture-notes.md`.
   - **Mandatory split:** use `Depends on:`-chained features when the plan would
     exceed about five phases, any phase spans multiple layers/concerns, or a
     phase contains an unresolved design decision. Reuse the existing dependency
     gate/build order; never invent another mechanism.
   - Every phase passes: independently checkable tasks without judgment; zero
     open design decisions; one layer/concern; locally runnable verification.
     Re-cut or split on any failure.
   - Run the canonical eight-box Phase-lint from
     `docs/fix/_TEMPLATE/SPEC.md` against every phase before emission. Any FAIL
     is re-cut/split; never emit an unticked phase.
   - Run the feature template's full Spec-lint after the Engineering half is
     filled, including Product-half regression boxes. Fix every presence failure
     before reporting.

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

- `progress.md`: initialize only `Last reviewed: —`; `execute-phase` appends
  the fixed schema in `references/HANDOFF.md` of that skill.
- `testing.md`: test layers, preferring integration; use the same command rule.
- `known-issues.md`: deferred items linked to/destined for issues, never inline.
- `decisions.md`: architecture/scope decisions and open questions.
- `architecture-notes.md`: layer, port, schema, and binding impact.

5. **Register and verify.** Set the roadmap row to `planned` (`defined → planned`;
   a missing row may be added directly as `planned`). Re-read it after the write.
   If it does not literally say `planned`, reapply and re-read before continuing.
6. **Do not branch or code.** Record the future branch in the SPEC only.
7. **Return exactly**; the `plan-feature` caller prints the closing hand-off:

```
SCAFFOLD <NN>-<slug> — size: <XS|S|M|L>
Artifacts written: <SPEC.md [+ PLAN.md TASKS.md progress.md testing.md
  known-issues.md decisions.md architecture-notes.md for M/L]>
Roadmap: registered as <NN> (deps: <list|none>)   Phases: <n> (P1…P<n>, last = <hardening (M/L) | Hardening & PR (XS/S)>)
Spec-lint: PASS (<n>/<n> boxes)   Phase-lint: PASS (all phases)
Open questions: <n> (in decisions.md) | none
```
