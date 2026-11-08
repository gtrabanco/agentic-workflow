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
silently run 1. `advance`'s hard floor always passes `N=2`.

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

**Reviewer model routing (issue #201).** Each reviewer's model resolves from
the same resolved table as every other pass (`agentic-workflow
resolve-passes`, the `SKILL.md` isolation rule): the finder passes a reviewer
runs resolve per pass name, the adversarial passes may be pinned to a
**different model family** than the orchestrator when the operator's table
pins them so (the cross-family recommendation below), and a row the table
leaves at the inline floor runs inline at the orchestrator's model — stated
in the report, never silently.

## Verdict layer — the pass verifies, it does not enumerate

A finder's table entry is a **candidate**, never a finding. On this route the
pass has a second half, and it is the half that decides what survives.

1. **Kill mandate.** Every candidate is arbitrated `kill | confirm`. A `kill`
   carries **falsifying evidence**: the run that shows the claim is not a defect,
   or the citation showing the rule it says is missing already holds. A `confirm`
   carries **supporting evidence**: the disproof attempt that failed, with the
   command and its output. A verdict with no evidence is an opinion. Context
   asymmetry is the point — the arbiter sees the claim and its evidence, never
   the producer's reasoning, so it cannot inherit the assumption it is meant to
   attack. The reviewer anti-invention rule binds **from cycle 1 of the pass**,
   not only from a second review cycle: a finding the pass raises itself
   (`origin: new`) must bring its own falsifying evidence in the first
   arbitration as much as in any later one. That is deliberately stricter than
   `SKILL.md`'s always-loaded *after cycle 1* wording, which keeps governing the
   default route — on this route the stricter rule wins.
2. **Diff-only reflector — the last precision filter.** An independent pass sees
   the diff and each surviving claim — its `file:line`, axis and own words. It is
   handed no exploration transcript, no tool notes and no reviewer prose, and a
   record that hands it one is refused. It answers `keep | drop` per finding with
   a reason, and it cannot keep what the diff does not ground: a location no hunk
   changes is a hallucination, and the reflector's answer to it is `drop`.
3. **Stability check (CIVER).** A reproducer that also fires on untouched
   adjacent code is a **misattribution** — the change is not what causes it. The
   row's stability is `unstable` and it is re-scoped to the surface that actually
   fails (`rescoped:<file>:<line>`) before it persists, never persisted
   as-reported.

The report names, per finding, what was killed and on what evidence. **The
operator owns the rescue**: kill mandates optimize precision, so a wrongly killed
finding is a false negative this pass will not detect itself — the falsifying
evidence is printed beside the kill so a human can overturn it. No recall-side
machinery exists on this route: nothing auto-resurrects a killed finding, and the
documented risk is accepted here rather than engineered around.

**Cross-model-family reviewers** stay the recommendation they already are;
the configurable half — which model families a pass uses — is the operator's
`passes` config (issue #201): pin the finder and adversarial pass entries to
the families the catalog allows, and the resolved table carries them to each
spawn. An agent with one family runs N same-family reviewers and says so.

**The record is checked, not trusted.** The pass writes one record for the whole
arbitration and the conductor runs one command over it and the reviewed diff:

```text
bun scripts/adversarial-verdict.mjs --record <record.json> --diff <diff.patch>
```

It prints the persist set — `| id | claim | verdict | evidence | stability |
reflector | destination |` — and refuses every violation: an unsupported verdict,
a verdict with no evidence, a kill whose evidence is not a disproof, a
self-raised finding without its own reproducer, a reflector handed a transcript,
a reflector verdict with no reason, a `keep` on a line the diff does not change,
and an `unstable` row still claiming `as-reported`. Exit 0 is `PASS` and 1 is
`FAIL`; a refused row is never persisted, and the report states why.

The verdicts are published machine vocabulary (`ADVERSARIAL_VERDICTS`,
`ADVERSARIAL_REFLECTOR_VERDICTS`, `ADVERSARIAL_STABILITY_VERDICTS` in
`@gtrabanco/agentic-workflow-schema`); this block is the surface that orders
them, and adding or renaming a token is a schema-const + block + parity change in
one PR.

```text
adversarial-verdict@1
kind | token | vocabulary | what it orders
mandate-verdict | kill | adversarial-verdict:kill | the claim is disproved by falsifying evidence, so the row never persists
mandate-verdict | confirm | adversarial-verdict:confirm | the disproof attempt failed and supporting evidence is required, so the row survives
reflector-verdict | keep | adversarial-reflector-verdict:keep | the claim is grounded in a line this diff changes
reflector-verdict | drop | adversarial-reflector-verdict:drop | the claim cannot be grounded in the diff or the reason refutes it, and a reason is required
stability-verdict | stable | adversarial-stability:stable | the reproducer fires on the changed code alone
stability-verdict | unstable | adversarial-stability:unstable | the reproducer also fires on untouched adjacent code, so the row is re-scoped before it persists
```
