# 15 — injection-safe-urgency · testing

This repo has **no application build** — "green" is doc coherence + the
command-checkable acceptance criteria, not a test suite. Prefer running the
`grep`s; only genuinely judgement-only checks are `read-verified`. Run all
commands from the repo root.

## Layer: command-checkable (run from repo root)

| Check | Command | Phase |
|---|---|---|
| Label vocab owned by triage-issue | `grep -Eqi "urgent\|fix-next" skills/triage-issue/SKILL.md` | P1 |
| triage-issue creates the label | `grep -qi "gh label create" skills/triage-issue/SKILL.md` | P1 |
| triage-issue applies the label | `grep -qi "add-label" skills/triage-issue/SKILL.md` | P1 |
| triage-issue bumped > 2.0.0 | `grep -qE "^version: 2\.[1-9]" skills/triage-issue/SKILL.md` | P1 |
| Roadmap row 15 planned | `grep -qE "^\| 15 \| .injection-safe-urgency. \| planned" docs/features/ROADMAP.md` | P1 |
| Sensor reports urgency | `grep -qi "urgent" skills/workflow-status/SKILL.md` | P2 |
| Sensor reads labels object | `grep -qi "json labels" skills/workflow-status/SKILL.md` | P2 |
| workflow-status bumped > 1.2.0 | `grep -qE "^version: 1\.[3-9]" skills/workflow-status/SKILL.md` | P2 |
| Judge output specified (finish) | `grep -qi "FINISH_FIRST" docs/workflow/ORCHESTRATION.md` | P3 |
| Judge output specified (interrupt) | `grep -qi "INTERRUPT_NOW" docs/workflow/ORCHESTRATION.md` | P3 |
| ship-roadmap knows the labels | `grep -Eqi "urgent\|fix-next" skills/ship-roadmap/SKILL.md` | P3 |
| ship-roadmap references the rubric | `grep -qi "ORCHESTRATION" skills/ship-roadmap/SKILL.md` | P3 |
| ship-roadmap bumped > 2.1.0 | `grep -qE "^version: 2\.[2-9]" skills/ship-roadmap/SKILL.md` | P3 |
| init-workspace seeds labels | `grep -Eqi "urgent\|fix-next" skills/init-workspace/SKILL.md` | P4 |
| init-workspace creates labels | `grep -qi "gh label create" skills/init-workspace/SKILL.md` | P4 |
| init-workspace bumped > 2.1.1 | `grep -qE "^version: 2\.[2-9]" skills/init-workspace/SKILL.md` | P4 |
| CHANGELOG rows (EN) | `grep -q "triage-issue\|workflow-status\|ship-roadmap\|init-workspace" CHANGELOG.md` | P1–P4 |
| CHANGELOG rows (ES) | `grep -q "triage-issue\|workflow-status\|ship-roadmap\|init-workspace" CHANGELOG.es.md` | P1–P4 |
| Skills still discoverable | `npx skills add . --list` (all skills listed) | P5 |

## Layer: read-verified (judgement-only)

- **The core injection-safety invariant.** Every urgency read derives **only**
  from the labels object; no skill reads urgency from issue title/body/comment,
  and no actor timeline check is performed. An issue with "URGENT" in its text but
  no label never surfaces in `detail.urgent`.
- **Verdict-gated application.** `triage-issue` applies a label **only** on a
  fix-now + high-severity verdict, states it in the dated verdict comment, and
  never silently.
- **Sensor reports, never decides.** `workflow-status`'s `detail.urgent` carries
  {urgent issues from labels} + {interruptibility facts: phase · dirty/clean ·
  distance to commit boundary}; it emits **no** pause-vs-finish decision.
- **Judge guardrails.** `ORCHESTRATION.md` specifies all four — tool-less ·
  closed-binary output + schema repair loop · rubric-as-system-prompt · fail-safe
  default `FINISH_FIRST` — **and** the deterministic short-circuit that precedes
  the model call.
- **ship-roadmap references, does not fork.** SELECT points at the one
  `ORCHESTRATION.md` rubric rather than restating it; handles `fix-next` (head of
  queue) and `urgent` (run the judge).
- **init-workspace seeding is additive-only** in both scaffold and upgrade mode
  (never-clobber).
- **`bump-skill` output** — README skill tables carry the new version for each of
  the four skills in both languages.

## Layer: coherence

- `audit-docs` after the change: roadmap ↔ folder ↔ doc-map links resolve; no
  stack/real-project reference leaked into any skill or shared doc; naming
  conventions held.

## Informal manual read (not a committed fixture)

Walk a toy case: an `urgent`-labeled issue lands while `execute-phase 15 P3` runs
(dirty tree, mid-phase). Confirm the chain `label object → detail.urgent →
short-circuit → judge → FINISH_FIRST` holds, and that a sibling issue with
"URGENT!!!" only in its body never enters `detail.urgent`.
