# 15 — injection-safe-urgency · TASKS

Per-phase checklists the executor ticks off. Command-checkable criteria are the
command; genuinely judgement-only ones are labelled `read-verified`. Run all
commands from the repo root.

## P1 — `triage-issue`: label vocabulary + apply

- [x] Define the `urgent` + `fix-next` vocabulary (names + colors `#B60205` /
      `#D93F0B`) in `skills/triage-issue/SKILL.md` as the sole owner.
      `read-verified` — new `## Urgency label vocabulary (owned here)` section,
      `skills/triage-issue/SKILL.md:47-88`.
- [x] Apply-on-verdict: on **fix-now + high-severity** only, the dated verdict
      comment states + applies the label (`gh label create` if missing →
      `gh issue edit --add-label`). `read-verified` — *Apply-on-verdict*
      subsection + Process step 3/5, `skills/triage-issue/SKILL.md:71-88,111-117,124-137`.
- [x] State the injection-safety invariant (label is capability-gated; never read
      urgency from issue title/body/comment). `read-verified` —
      `skills/triage-issue/SKILL.md:59-69`.
- [x] `grep -Eqi "urgent|fix-next" skills/triage-issue/SKILL.md` exits 0.
- [x] `grep -qi "gh label create" skills/triage-issue/SKILL.md` exits 0.
- [x] `grep -qi "add-label" skills/triage-issue/SKILL.md` exits 0.
- [x] Run `bump-skill` for `triage-issue` (minor). Verify:
      `grep -qE "^version: 2\.[1-9]" skills/triage-issue/SKILL.md` (bumped above
      2.0.0 → 2.1.0); new `triage-issue` rows in `CHANGELOG.md` + `CHANGELOG.es.md`;
      README/README.es skill tables updated. `read-verified` — commit `ba3648f`.
- [x] Commit planning artifacts: `git add docs/features/15-injection-safe-urgency
      && git commit -m "docs(15-injection-safe-urgency): planning artifacts"`.
      Commit `fd472e9`.
- [x] Confirm roadmap row 15 reads `planned`:
      `grep -qE "^\| 15 \| .injection-safe-urgency. \| planned" docs/features/ROADMAP.md`
      exits 0.

## P2 — `workflow-status`: `detail.urgent` + interruptibility facts

- [x] Add the `detail.urgent` field (open issues with `urgent`/`fix-next`, read
      **only** from the labels object). `read-verified` — Process step 3 +
      Machine envelope `detail.urgent` description,
      `skills/workflow-status/SKILL.md:67-82,197-211`.
- [x] Carry the interruptibility facts (phase · dirty/clean · distance to commit
      boundary), reusing the crash-recovery reconcile. `read-verified` —
      `interruptibility: {phase, dirty, tasks_from_boundary}`, reuses step 8 +
      crash recovery, no new git calls (`skills/workflow-status/SKILL.md:75-82`).
- [x] State: sensor reports facts, never a pause-vs-finish decision; `urgent`
      wins over `fix-next` on one issue. `read-verified` —
      `skills/workflow-status/SKILL.md:71-82,197-211,278-285` (Guardrails).
- [x] `grep -qi "urgent" skills/workflow-status/SKILL.md` exits 0.
- [x] `grep -qi "json labels" skills/workflow-status/SKILL.md` exits 0.
- [x] Run `bump-skill` for `workflow-status` (minor). Verify:
      `grep -qE "^version: 1\.[3-9]" skills/workflow-status/SKILL.md` (bumped above
      1.2.0 → 1.3.0); CHANGELOG (EN/ES) + README rows updated. `read-verified` —
      commit `f9cec3b`.

## P3 — Consumer judge: `ORCHESTRATION.md` rubric + `ship-roadmap` SELECT

- [x] Add the canonical pause-vs-finish micro-judge to
      `docs/workflow/ORCHESTRATION.md`: deterministic short-circuit → cheap-tier
      clean-context tool-less judge → closed-binary + repair loop →
      rubric-as-system-prompt → fail-safe `FINISH_FIRST`. `read-verified` — new
      `## Urgency: the pause-vs-finish micro-judge` section, all four
      guardrails + the short-circuit table present.
- [x] `grep -qi "FINISH_FIRST" docs/workflow/ORCHESTRATION.md` exits 0.
- [x] `grep -qi "INTERRUPT_NOW" docs/workflow/ORCHESTRATION.md` exits 0.
- [x] `ship-roadmap` SELECT handles `fix-next` (head of queue) + `urgent` (run the
      judge) and **references** the `ORCHESTRATION.md` rubric (no fork).
      `read-verified` — `skills/ship-roadmap/SKILL.md` SELECT priority 1.
- [x] `grep -Eqi "urgent|fix-next" skills/ship-roadmap/SKILL.md` exits 0.
- [x] `grep -qi "ORCHESTRATION" skills/ship-roadmap/SKILL.md` exits 0 (points at
      the canonical rubric).
- [x] Run `bump-skill` for `ship-roadmap` (minor). Verify:
      `grep -qE "^version: 2\.[2-9]" skills/ship-roadmap/SKILL.md` (bumped above
      2.1.0 → 2.2.0); CHANGELOG (EN/ES) + README rows updated. `read-verified` —
      commit `5d18630`.
      (`ORCHESTRATION.md` is a doc — **no** `bump-skill`.)

## P4 — `init-workspace`: seed both labels

- [x] Scaffold mode creates `urgent` + `fix-next` (name + color) in the target
      repo. `read-verified` — Process step 7,
      `skills/init-workspace/SKILL.md:139-150`.
- [x] Upgrade mode adds them additively (never-clobber). `read-verified` —
      Upgrade mode step 6, `skills/init-workspace/SKILL.md:172-179`.
- [x] `grep -Eqi "urgent|fix-next" skills/init-workspace/SKILL.md` exits 0.
- [x] `grep -qi "gh label create" skills/init-workspace/SKILL.md` exits 0.
- [x] Run `bump-skill` for `init-workspace` (minor). Verify:
      `grep -qE "^version: 2\.[2-9]" skills/init-workspace/SKILL.md` (bumped above
      2.1.1 → 2.2.0); CHANGELOG (EN/ES) + README rows updated. `read-verified` —
      commit `ff34505`.

## P5 — Hardening & PR

- [ ] Each dev-scenario failure edge is stated in the owning skill:
      `urgent:label-exists`, `urgent:no-permission`, `urgent:both-labels`,
      `judge:unparseable`, `judge:fix-next`, `status:issue-closed`,
      `status:no-labels`. `read-verified` — SPEC Dev scenarios cross-checked
      against each skill.
- [ ] Re-run the full verification gate: `npx skills add . --list` discovers all
      skills (exit 0, paste output) + doc-coherence.
- [ ] `audit-docs` passes (no roadmap/folder/link drift, no leaked
      stack/real-project reference). `read-verified` — PASS, no findings.
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty.
- [ ] Open the PR (`gh pr create --base main --body-file <path>` — body a Markdown
      file with real backticks, includes `Closes #42`) and **PRINT THE PR URL in
      the chat**.
- [ ] Update roadmap row 15 → `done · [#<pr>](<pr-url>)`.
- [ ] Commit `docs: link PR #<n>` and push.
