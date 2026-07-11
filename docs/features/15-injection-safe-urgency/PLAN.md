# 15 — injection-safe-urgency · PLAN

Phased implementation plan. Phases are labelled `P1, P2, …` and called *phases* —
an implementation sequence, not a delivery boundary. `P1` also commits the
planning artifacts and the roadmap row. The last phase (`P5`) is Hardening & PR;
opening the PR is the final *step* of `P5`, not a phase of its own.

Each phase touches **one skill/concern**, carries **zero open decisions**, and
its verification gate (the phase's `grep`s + `read-verified`) **runs locally** —
the cheap-executability checklist passes for all five.

## P1 — `triage-issue`: label vocabulary + apply

Single concern: `skills/triage-issue/SKILL.md`.

- Define the two-label vocabulary in `triage-issue` (the sole owner): `urgent`
  (reaches the judge) and `fix-next` (head of queue, never interrupts), with the
  color convention (`urgent` `#B60205`, `fix-next` `#D93F0B`).
- On a **fix-now + high-severity** verdict only, the dated verdict comment
  **states and applies** the correct label: `gh label create <name> --color <hex>
  --description <text>` if missing (create-if-missing — an "already exists" error
  is success), then `gh issue edit <N> --add-label <name>`. Never triggered by
  issue title/body/comment text; never silent.
- State the injection-safety invariant explicitly in the skill: the label is a
  capability-gated signal; urgency is never read from issue text.
- `bump-skill` for `triage-issue` (minor): CHANGELOG rows (EN/ES) + README
  skill-table rows (EN/ES).
- Commit this feature's planning artifacts (SPEC + this set) and confirm **roadmap
  row 15** reads `planned` (the `defined → planned` flip written during scaffold).

Verification: P1 `grep`s pass (`urgent|fix-next`, `gh label create`,
`--add-label`) + `read-verified` that application is verdict-gated and text-blind.

## P2 — `workflow-status`: `detail.urgent` + interruptibility facts

Single concern: `skills/workflow-status/SKILL.md`.

- Add the `detail.urgent` envelope field: open issues carrying `urgent` or
  `fix-next`, read **only** from the labels object (`gh issue view <N> --json
  labels` / `gh issue list --label <name> --json number,labels`) — presence-only,
  no title/body/comment parse, no actor timeline check.
- Alongside it, carry the in-flight unit's interruptibility facts (current phase ·
  dirty/clean tree · distance to the next commit boundary), reusing the
  crash-recovery reconcile the sensor already computes (feature 03).
- Both-labels rule: `urgent` wins (reaches the judge). Sensor **reports facts,
  never decides** — no pause-vs-finish output; urgency may inform
  `next.recommended`.
- `bump-skill` for `workflow-status` (minor): CHANGELOG + README rows (EN/ES).

Verification: P2 `grep`s pass (`urgent`, `--json labels`) + `read-verified` that
the field is labels-only and carries the interruptibility facts, and the sensor
emits no decision.

## P3 — Consumer judge: `ORCHESTRATION.md` rubric + `ship-roadmap` SELECT

Single concern: the consumer pause-vs-finish judge (the doc IS the rubric;
`ship-roadmap` only points at it — no independent decision spans the two edits).

- In `docs/workflow/ORCHESTRATION.md`, add the canonical pause-vs-finish
  micro-judge:
  1. **Deterministic short-circuit** (no model call): commit boundary →
     `INTERRUPT_NOW`; one checkbox from close → `FINISH_FIRST`; `fix-next` never
     reaches the judge.
  2. **The judge**: cheap-tier · clean-context · **tool-less**, fed issue content
     + interruptibility facts; closed-binary `FINISH_FIRST | INTERRUPT_NOW` +
     one-line reason; schema repair loop; **rubric-as-system-prompt**; **fail-safe
     default `FINISH_FIRST`**.
- In `skills/ship-roadmap/SKILL.md`, SELECT handles `fix-next` (head of queue, no
  interrupt) and `urgent` (run the judge), **referencing** the `ORCHESTRATION.md`
  rubric — never forking a copy.
- `ORCHESTRATION.md` is a doc → **no `bump-skill`**. `bump-skill` for
  `ship-roadmap` (minor): CHANGELOG + README rows (EN/ES).

Verification: `grep FINISH_FIRST`/`INTERRUPT_NOW` in `ORCHESTRATION.md` +
`read-verified` all four judge guardrails + the short-circuit are specified, and
`ship-roadmap` references (not forks) the rubric.

## P4 — `init-workspace`: seed both labels

Single concern: `skills/init-workspace/SKILL.md`.

- Scaffold mode creates `urgent` + `fix-next` (name + color convention) in the
  target repo.
- Upgrade mode adds them to an existing install (additive-only, never-clobber, per
  the upgrade-mode contract from feature 13).
- `bump-skill` for `init-workspace` (minor): CHANGELOG + README rows (EN/ES).

Verification: P4 `grep`s pass (`urgent`/`fix-next` + `gh label create` in
`init-workspace`) + `read-verified` seeding is additive-only in both modes.

## P5 — Hardening & PR (hardening phase)

Implement + test the SPEC's dev-scenario failure modes, then close out.

- Ensure each failure edge is stated in the owning skill: `urgent:label-exists`
  (create-if-missing), `urgent:no-permission` (reported, not silently dropped),
  `urgent:both-labels` (`urgent` wins), `judge:unparseable` (fail-safe
  `FINISH_FIRST`), `judge:fix-next` (never reaches the judge),
  `status:issue-closed` (drops from scan), `status:no-labels` (text never
  reprioritizes — the core invariant).
- Re-run the project's full verification gate (`npx skills add . --list` +
  doc-coherence) with commands + exit codes pasted.
- `audit-docs` — roadmap ↔ folder ↔ doc-map links resolve; no stack/real-project
  reference leaked; naming conventions held.
- Pending-docs check: `git status --porcelain -- docs/` → empty.
- Close out: open the PR (`gh pr create --body-file <path>`, body includes
  `Closes #42`, PRINT THE PR URL); set roadmap row 15 → `done · [#PR]`; commit
  `docs: link PR #<n>` and push.

Verification: all dev-scenario `read-verified` checks + the gate green +
`audit-docs` PASS.
