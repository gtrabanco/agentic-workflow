# Mapping the "All Code Is Slop (Except Mine)" talk to agentic-workflow coverage

**Date:** 2026-11-15 · **Owner-directed analysis** · **Status:** evidence note; the
proposals below were filed as issues the same day.

## Source and limits

- Talk: Lauren Tan, *"All Code Is Slop (Except Mine)"*, AI Engineer Code Summit
  ([video](https://www.youtube.com/watch?v=O_zcc6Xl12g)). Analysis input: the
  owner's reviewed brief (auto-transcript checked against the 70 slide captures).
- The talk's numbers (PR volume, revert %, performance deltas) are **team
  experience, not reproducible measurement** — the deck states no hardware,
  sample, or method. Used here only as evidence of *mechanism shape*, never as
  benchmark.
- Central thesis, restated: agent trust is built from **deterministic
  constraints and verifiable execution**, not from longer instructions; repeated
  agent failures should become **machine-checkable properties** of the codebase;
  human review shifts to verification artifacts and to changes the safeguards
  do not cover; sequence matters (stabilize the inner loop before automating
  triggers).

## The six adoption questions → current coverage

The talk's "check these before adopting" list, mapped to what an install of
agentic-workflow provides today:

| # | Question | Coverage | Product evidence |
|---|---|---|---|
| 1 | Repeated corrections → deterministic checks / safer APIs | **Strong** | `fold-findings` (root-cause atomic repairs), `triage-issue` (verify-vs-code), `review-debt` (unfixed findings become debt items with re-trigger conditions), verification-contract anti-gaming (a test is never edited to pass; escapes need approval + amendment), red-first suite rule in AGENTS.md |
| 2 | Architectural boundaries only in docs/reviewer memory? | **Partial** | `init-workspace` offers `ARCHITECTURAL_INVARIANTS.md` (stable ID + evidence + authority), guardrail skills auto-load per project, `review-design` audits layering on the diff — but nothing converts a declared prose invariant into a machine rule (lint/dependency-analysis) and nothing *requires* a declared boundary to name its enforcement |
| 3 | Stable CLI/driver to run affected flows + evidence bound to the change | **Partial** | The evidence half is strong: `verification-contract` ("no command, no claim"; every AC names its demonstrating command), `review-verify` re-runs recorded commands and exercises claimed behavior for real. Missing: the per-project feature map (what exists, how a user reaches it, what proves it) and any application-driver/evidence-capture convention (snapshots, screenshots, videos) |
| 4 | Which invariants justify property / model-checking / formal tests | **Partial** | Risk/size tiers scale ceremony to risk; `verification-contract` explicitly admits property/fuzz validators as bounded `commands` rows — the door is open, but no step recommends them proactively for stateful flows, and formal methods appear nowhere |
| 5 | Metrics detecting quality+cost alongside volume | **Missing** | `workflow-status` measures *workflow state* (startable units, open PRs, pending findings); nothing measures *project quality* (reversion rate, escaped defects, review latency, verification cost). No sensor surface exists |
| 6 | Evidence + safety limits required before the agent creates/merges automatically | **Strong** | `review-change` mandatory before merge; `audit-pr` consumes a SHA-bound receipt and never merges; `batch-scheduler` plans but never spawns, dedups claims (TTL), reports `file-overlap` before two lanes rewrite one path; domain separation keeps proposals out of auto-fix |

**Coverage verdict per mechanism** (the talk's five technical mechanisms):

1. *Codebase as context and boundary* — covered as **discover-and-honor**
   (charter interview, invariants doc, guardrail skills, review-design); open as
   **machine-enforcement conversion**.
2. *Root causes over accumulated exceptions* — the workflow **is** this thesis
   institutionalized (fold → triage → debt with re-trigger conditions). Open:
   no recurrence detector ("this finding class appeared N times → propose a
   lint rule") — the findings corpus work (#437) is the adjacent surface.
3. *Reusable execution verification* — evidence half strong, driver/feature-map
   half missing (mechanism 3 table row above).
4. *Risk-scaled verification techniques* — structure ready (tiers + property/
   fuzz slot), technique recommendation missing.
5. *Automate after the inner loop stabilizes* — philosophy identical and
   enforced by construction (lane/gates/review before batch-scheduler; the
   conductor never merges). Open: no external-trigger surfaces (Linear/Slack/
   alerts), deliberately — a domain-separation boundary, not a defect.

## Answers to the owner's three questions (2026-11-15)

**Q1 — Does closing all currently open issues fully cover any of the six points?**
No. Points 1 and 6 are product-complete today and the backlog does not change
them. Of the partial/missing ones, **none reaches full coverage via the current
backlog**: #526 (elicitation) sharpens the *interview* that feeds point 2, and
#504 (extended telemetry) covers *workflow* telemetry, not project-quality
metrics — point 5 stays unserved, and the point-2 enforcement bridge and the
point-3 driver/feature map appear in no open issue. Closing today's backlog
leaves points 2–5 exactly where they are. That gap is what the three issues
filed with this note own.

**Q2 — Is there a point we cannot implement at all?**
No point is un-implementable, but each has a hard **product boundary**: the
workflow ships elicitation + scaffolding + declaration-checks; it never ships
the verification itself. TLA+/Lean models, per-project application drivers,
lint rule sets and property suites are **target-project code** — stack-specific
by nature and owned by the adopting team (the workflow adapts to the team,
never ships a concrete use). Everything else — asking which boundaries matter,
materializing their enforcement as project-local config/issues, checking that a
declared boundary names an enforcement mechanism, recommending property tests
at high risk tiers, computing quality metrics from forge/git data — is
implementable as deterministic product surface. The boundary is "adapt, don't
ship", and it is a feature of the team-adaptation constraint, not a defect.

**Q3 — Which point can reach 100% coverage at install time, like 1 and 6?**
**Point 5, the quality metrics sensor.** Every metric the talk cares about is
derivable from git/forge data — reverted-commit ratio, change-failure rate,
lead time, PR volume, review latency — stack-agnostic, deterministic, and
read-only: exactly the shape of `workflow-status`. One unit adds a fixed
machine envelope beside it and closes the only fully *missing* point. The
canonical metric set already has a name — the DORA four keys (*Accelerate*,
Forsgren/Kersten/Kim) plus reversion ratio — so the definitions are cited
literature, not invention. Points 2 and 3 can get *much* stronger via
interview + materialization (the two `init-workspace` issues), but their last
mile is always project-local code, so they cap below 100% by design.

## Owner directives recorded (2026-11-15)

1. **`init-workspace` must improve substantially.** It should run a repo-
   objectives interview and ask technical questions grounded in software
   engineering bibliography, not just tailor placeholders. → filed as the
   engineering-interview issue below.
2. **The interview's answers must materialize.** Verification decisions become
   project-local code/config or issues/features on the target forge — because
   several points must stay flexible and adaptable per project. → filed as the
   verification-materialization issue below (blocked by the first).
3. **Point 5 is implementable to 100%** → filed as the quality-sensor issue
   below.

## Proposals filed

| Issue | Owns | Points served |
|---|---|---|
| init-workspace engineering interview (objectives + bibliography-backed technical bank) | charter layer 3; team-adaptation knob; enforcement-declared answers | 2 (declaration half), 4 (asking), 6 (posture answers) |
| init-workspace verification materialization (project-local enforcement/evidence code or issues) | boundary-enforcement scaffolding, feature-map scaffold, evidence-capture convention, declaration-enforcement check | 2 (enforcement half), 3 (driver+map half), 4 (slots) |
| Quality sensor (deterministic forge/git metrics envelope) | point 5 end-to-end | 5 (full) |

Small pilots where each lands first: the interview on a bootstrap of this repo's
own scratch copy (golden-fixture rule), the materialization against the toy
repo, the sensor against this repo's own history (we have reverts and PRs to
reconcile by hand once).

## What the talk does not change

- The inner-loop-first sequence is already imposed (lane → review → scheduler);
  nothing to adopt.
- External triggers (chat/alerts → autonomous work) stay out of scope: a
  product-domain boundary under the domain-separation safeguard, revisitable
  only by owner decision.
- The talk's "no comments in code" and "ban `useEffect`" are **contextual
  choices of one team** — exactly the kind of rule the interview should *ask
  about*, never ship as default.
