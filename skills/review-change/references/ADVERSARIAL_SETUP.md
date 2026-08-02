## Adversarial multi-reviewer mode (`--adversarial N`, opt-in)

**Default OFF.** No `--adversarial N` flag → today's single-reviewer behavior,
byte-for-byte unchanged (step 1 above). This mode only replaces the
findings-gathering stage; steps 2–10 run once, over the merged table.

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

**Recommendation checklist.** Recommend `--adversarial 2` if **ANY** box ticks
(this skill surfaces the recommendation in its report / `→ Next:` block but
proceeds single-reviewer unless the user opts in):

- ✓ the change is `L`
- ✓ the change touches a sensitive surface (auth, payments, destructive
  migrations, secrets, CI config)
- ✓ the reviewing model is **not the strongest model available in the fleet**,
  or is weaker than the model that authored the diff
- ✓ only one model family is available **and** the change is `≥ M`

The model condition is a documented rule of thumb, **surfaced as a report line
only — never auto-detection.** An agent cannot reliably introspect its own
model identity, so this skill never tries; it states the condition in prose
and lets the human (or the orchestrator that knows which model is running)
judge it.

**N ladder (fixed).** `N=2` is the default (the `ship-roadmap` floor). Bump to
`N=3` when either holds: the change has a security/auth surface, or all
available reviewers share one model family (the third reviewer buys back some
of the decorrelation a single family can't provide). `N>3` is **explicitly
discouraged** — with the ≥1 inclusion threshold below, reviewers beyond 3
mostly add dedupe work at merge time, not new findings.

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
`review-implementation` checklist stays **mandatory for every reviewer** —
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
it is an attention priority, not an exclusive scope: the full
review-implementation checklist stays mandatory. Flag anything wrong, not only
findings inside your role.

Return exactly:
| file:line | axis | Finding | Sev | Class | WHY | Route |
|---|---|---|---|---|---|---|
<one row per finding — empty table if none>
```

**Platform-adaptive spawn (three tiers).** Each of the N reviewers is a
**context-clean, diff-only, adversarial** run of the existing findings engine
(`review-implementation`), reviewing the same scope — none of them is the
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
