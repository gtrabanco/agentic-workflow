## Adversarial multi-reviewer mode (`--adversarial N`, opt-in)

**Default OFF.** No `--adversarial N` flag → today's single-reviewer behavior
(step 1 above). This mode only replaces the findings-gathering stage (the
finder passes in step 4) with the N isolated reviewers; the rest of the
process — SPEC drift, workflow-discipline, synthesis, classification, debt
transform, manual verification, outcome routing, report — runs once, over the
fused table.

**N semantics.** `--adversarial` flag not passed at all → single-reviewer mode,
no message (today's default). `--adversarial` passed **without** a valid N
(no number given, or a number `< 2`) → usage error: state that `--adversarial`
needs an integer N≥2 and fall back to the single-reviewer path — never
silently run 1. `ship-roadmap`'s hard floor always passes `N=2`.

**Why N reviewers.** A single adversarial, context-clean reviewer (see the
turn-contract box) decorrelates some blind spots; running N independent
reviewers — ideally across **different model families** (a preference, not a
requirement: an agent with one family runs N same-family reviewers and says so)
— decorrelates more, at 2–3× the cost of the findings-gathering stage. That cost
is why the mode stays opt-in and is only **auto-recommended, never forced**.

**Recommendation checklist** (when to recommend this mode, and the only
adversarial content the **default** route loads) and the **N ladder** (choosing
N when a recommendation fires) live in `ADVERSARIAL_RECOMMENDATION.md`. On an
adversarial run N is already fixed by the caller's `--adversarial N`, so the
full roles/spawn contract below needs no ladder. The full contract loads
**only** for `--adversarial N`.

**Reviewer roles (fixed, assigned by index).** Each reviewer *i* gets role *i*
from this fixed set — never chosen ad hoc:

- **R1 — correctness/logic adversary.** Assume the diff is wrong until proven
  otherwise; hunt first for logic errors, wrong conditionals, off-by-one/edge
  cases, silent behavior changes.
- **R2 — security/inputs adversary.** Hunt first for untrusted input handling,
  injection, auth/authorization gaps, secret handling, and unsafe defaults.
- **R3 — SPEC-coverage adversary.** Hunt first for what the governing SPEC
  *promises* that the diff does not actually do — unmet acceptance criteria,
  silently narrowed scope, claims contradicted by the code.

**A role is an attention priority, NOT an exclusive scope.** The full
applicable finder checklists stay **mandatory for every reviewer** —
the role only orders where that reviewer looks first, it never narrows what
they're allowed to flag. The known failure mode this guards against: a
role-narrowed reviewer skips an obvious defect because it fell outside "their"
role. Every reviewer prompt (see the reviewer contract below) must carry this
sentence, not just the role assignment.

**Reviewer contract (single source).** Each of the N reviewers — spawned by
whichever tier below applies — receives this fixed prompt; only `<i>`/`<role
name>`/`<scope>` vary per reviewer. This is the **one and only place** the
reviewer prompt is authored — the Portability paste block later in this skill
quotes it verbatim, never a rewritten copy:

```
ROLE: R<i> — <role name, from the fixed set above>
SCOPE: <diff-only — the branch diff vs the default branch, or the passed path/glob>

You are reviewer <i> of N in an adversarial multi-reviewer review. Assume the
diff is wrong until proven otherwise. Your role orders where you look FIRST —
it is an attention priority, not an exclusive scope: the full applicable
finder checklists stay mandatory. Flag anything wrong, not only findings
inside your role.

Return exactly:
| file:line | axis | Finding | Sev | Evidence |
|---|---|---|---|---|
<one row per finding — empty table if none>
```

**Platform-adaptive spawn (three tiers).** Each of the N reviewers is a
**context-clean, diff-only, adversarial** run of the applicable finder
passes, reviewing the same scope — none of them is the
conversation that wrote the diff, and the orchestrating `review-change`
conversation never reviews in the same breath as authoring either (the
turn-contract box still applies to the orchestrator):

1. **Claude Code** → spawn **N subagents in parallel**, one reviewer each.
   Prefer assigning **different model families** across them where more than
   one is available.
2. **Another agent with headless invocation** → **N parallel headless
   invocations**, each a fresh context reviewing the diff.
3. **Neither** (inline fallback) → **N sequential fresh conversations** —
   slower, the documented floor-of-last-resort so no agent is blocked from
   using this mode.
