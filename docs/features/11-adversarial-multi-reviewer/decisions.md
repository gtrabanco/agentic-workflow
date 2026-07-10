# 11 — adversarial-multi-reviewer · decisions

Architecture/scope decisions + open questions. Product-definition decisions live
in `SPEC.md` → Product decisions; these are the engineering ones.

## Resolved

- **D1 — N is an integer ≥ 2; N<2 is a usage error.** `--adversarial` with no N,
  or N<2, does not silently run one reviewer — it states the requirement and
  falls back to the default single-reviewer path. Rationale: N=1 *is* the
  default; a silent 1 would hide a mistyped flag.

- **D2 — Inclusion threshold = ≥1 reviewer (no quorum).** A finding any single
  reviewer raised enters classification normally; the existing rubric decides its
  class. Rationale: the whole point of N adversarial reviewers is to catch what
  one misses — a majority-to-include gate would suppress a real defect only one
  sharp reviewer found. Reviewer count is recorded (`Reviewers n/N`) as a
  confidence signal, not a filter.

- **D3 — Dedupe key = `file:line` + axis.** Identical findings from multiple
  reviewers collapse to one row; two genuinely different findings on the same
  line (different axis) stay separate. Rationale: `file:line` alone would merge a
  security finding and a perf finding that happen to share a line.

- **D4 — Fan out the findings engine ONLY; the pack runs once.** Each of the N
  reviewers runs the existing findings engine (`review-implementation`) — and
  **only** the engine. The applicable pack (Process steps 2–10) runs **once**,
  over the merged table, exactly as in the single-reviewer case. This feature
  only adds the fan-out/merge around the engine — no new engine. Rationale:
  (a) a parallel engine would drift from the single-reviewer one; (b) the
  decorrelation N reviewers buy lives in the open-ended find phase — the pack
  passes are closed checklists that converge across models, so multiplying them
  yields near-duplicate findings at N× cost; (c) additional independent passes
  already come from the workflow itself: fix-now findings are folded and the
  re-review runs in a **fresh, context-clean conversation** (on any model), so
  every fix cycle is itself another independent pass — no need to multiply
  passes inside a single invocation.

- **D5 — Platform-adaptive spawn, three tiers.** Claude Code → N subagents;
  headless-capable agent → N headless invocations; neither → N sequential fresh
  conversations. Rationale: the skills install into 70+ agents; parallelism is a
  convenience, the N-reviewer *contract* is what must hold everywhere (portability
  standard).

- **D6 — Model-family diversity is a preference, not a requirement.** Prefer
  spreading the N reviewers across families where available (decorrelates blind
  spots, per feature 04's cross-family invariant); an agent with one family runs
  N same-family reviewers and says so. Rationale: don't block the mode on
  multi-family availability.

- **D7 — Default OFF; auto-recommend (never force) for L/sensitive.** Interactive
  `review-change` stays single-reviewer unless the flag is passed; it *recommends*
  the mode for L/sensitive changes. Rationale: 2–3× cost — the user decides when
  it's worth it.

- **D8 — ship-roadmap enables `--adversarial 2` as a HARD FLOOR for L/sensitive,
  deliberately NOT aligned with the interactive advisory.** The autopilot is
  unattended, so a risk-proportional floor replaces the human's skip judgment.
  This is recorded explicitly so a later "consistency" edit does not collapse the
  floor and the advisory into one. Rationale: the two serve different contexts —
  a human present can skip; an unattended loop cannot be trusted to.

- **D9 — MINOR bump for both skills.** `--adversarial N` is a new
  backward-compatible capability (additive flag, default off); `ship-roadmap`
  gains a policy but its existing contract is unchanged. Not MAJOR (no
  contract/flag removal, no breaking change). Handled by `bump-skill` in P3.

- **D10 — No change to the schema/npm package or `review-implementation`.** The
  feature is `review-change` + `ship-roadmap` + two docs only.

## Open questions

- _None._ All engineering decisions resolved above; product decisions in `SPEC.md`.
