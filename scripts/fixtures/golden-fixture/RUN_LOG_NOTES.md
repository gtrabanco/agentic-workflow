# Golden fixture — historical prose

Prose blocks that used to sit between the run-log rows in
`docs/workflow/GOLDEN_FIXTURE.md`. Moved here **verbatim**; they are historical
records of feature 12/28 coverage, not live procedure.

## Scope boundary

Manual first, no CI, no runnable script. This is deliberately the cheapest
thing that catches weak-model regressions today. Graduate to automation only
if the manual procedure repeatedly catches regressions and the maintenance
cost is justified — that is a separate, future unit, not scheduled here.

Coverage note (feature 28, P6 + F28 fold, 2026-09-01): the two rows above
(reviewer 1.2.0 at the F28 fold) plus the two P6 rows and the 2026-08-31 row
cover every executor-path skill this unit changed, at its current text —
review-spec 1.2.0, review-plan 1.2.0, pre-execution-review 1.3.0 (both F28 runs
loaded its `POLICY.md` §7, which is the rule under test), plan-fix 3.0.1,
execute-phase 4.0.2, workflow-status 3.0.3, audit-pr 5.0.2. Not covered live by
these rows: **evidence-grounding 1.2.0**, whose only change is the §7 citation
line — command-pinned by `scripts/pre-execution-quality.test.mjs`, no runner in
this session executed it as a route; and the **weakest supported executor**, which
this session could not reach (Claude Haiku 4.5 → `401 insufficient balance`,
configured nan-provider fallback → invalid API key). **Updated 2026-09-01:** the
weakest-executor leg is now carried at both stages by dated `nan/qwen3.6` rows —
**Product** (objective PASS, procedure FAIL: the run wrote into the host
repository, finding F35, reverted) and **Plan** (all five boxes held, and it
filed finding F37 by resolving the parent-digest rule opposite to a
stronger-model run of the same text). `evidence-grounding 1.2.0` remains an open
manual leg and is not claimed as satisfied here. Intermediate versions folded
inside the unit's unreleased cycle (workflow-status 3.0.0–3.0.2, execute-phase
4.0.1, audit-pr 5.0.0/5.0.1, plan-fix 3.0.0, review-spec/review-plan 1.1.0,
pre-execution-review 1.2.0) never shipped separately — the npm publish is blocked
by the unit's known-issue 12 — and their wording is command-pinned by the suites
their fold commits added
(`scripts/pre-execution-quality.test.mjs`).


**Coverage addendum (feature 28, P15 weakest-executor legs, 2026-09-02).** The four
rows above are this unit's P15 obligation: every skill whose `SKILL.md` P9-P14
changed — review-spec 1.3.0, review-plan 1.3.0, pre-execution-review 1.5.0 (both
reviewer legs loaded its `POLICY.md` §7 and §8, which are the rules P10 and P12
amended), workflow-status 3.1.0, evidence-grounding 1.3.0 — driven by the fleet's
sanctioned weakest reasoning executor with the library declared read-only, which is
the lesson finding F35 taught. Three of the four are PASS. The fourth records an
objective PASS beside a procedure FAIL on box 3, because a weak model read P12's
delegation contract and set it aside; per this file's own rule that is a FAIL row,
and the wording change it motivates is a separate targeted change, never an edit
inside a run. These legs also produced four findings the suites could not:
**F38** (a durable review mark that invalidates itself the moment it is committed),
**F39** (a receipt template that demands a digest the refusal path forbids
producing), **F40** (a contract with no trigger a weak executor can match),
**F41** (a prose readiness box standing where the machine owns the heading list).

With the 2026-09-02 re-run row above, the weakest-executor leg carries a dated PASS row for every skill P9-P14 changed —
review-spec 1.3.0, review-plan 1.3.0,
pre-execution-review 1.5.0 (named in both reviewer legs, which loaded its §7 and §8),
workflow-status 3.1.0, and evidence-grounding at 1.4.0 after its 1.3.0 leg failed box
3. F40 and F41 are closed by that targeted change; F38 and F39 remain open for this
unit's close-out fold, because F38 needs a currency test the flow can actually satisfy
and a redesigned fixture, and F39 one contracted refusal-path form at both stages.

