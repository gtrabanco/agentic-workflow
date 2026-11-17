# External verify — 2026-11-16 (fix/574-surface-detection-blind-spots)

No prior `EXTERNAL VERIFY` block or review verdict existed for this unit (the
only files at the unit were `SPEC.md` and the two planning ledgers; `rg` over
the unit dir found no verdict, `docs/LOGS.md` carries no verify entry), so this
is the full verdict, once. Read-only pass: no commit, no push, no branch, no
forge mutation, no code edit during verification; every planner execution ran
`--no-state`, and all scratch lived in `mktemp -d` under `/tmp` (removed after).

EXTERNAL VERIFY — base: 5ef01c1f (origin/main at run time; the reviewed files
`scripts/batch-scheduler.mjs`, `packages/agentic-workflow-schema/src/batch-plan.ts`
and `skills/batch-scheduler/references/PLAN.md` are byte-identical at the
merge-base `888aaceb` and at `eb9390f0`, where origin/main moved mid-pass —
journal fragments only; the exercised base copy was the `5ef01c1f` archive) ·
head: 87244a20 (PR #599, OPEN)
Blockers: 6 —
(1) **B1** `scripts/batch-scheduler.mjs:545` (`extractFileClaims`): a body that
declares `## Surfaces` collapses file claims to that section's text, so the
prose around it stops claiming files — base narrowed only on
`## Where`/`## In scope` (`scopeSections`, base:367) and otherwise scanned the
whole body; `SURFACE_SECTIONS` gained `Surfaces` this branch (head:415; base has
no such constant) and the claims path consumes `declaredSections`. Identity-
asserted fixture differential (both modules' sources printed): `surfaces-only`
base `["scripts/shared-clean.mjs"]` vs head `[]`; `form-order` (the yml form's
real shape — Describe before Surfaces) base
`["bun test scripts/telemetry-coverage.test.mjs"]` vs head `[]`; the
`where-control` pair is `[]` at both (base's narrowing preserved). The unit's
own Non-goal freezes the opposite ("file claims stay what its body declares")
and O11 requires claims unchanged. Live corpus: per-issue claims are equal base
vs head except `#574`, where head is *stronger* (fence recovery, F1-intended) —
the regression is latent on today's bodies and deterministic on the default
form-filing shape. Stability: reproduces 3/3; no-section and `Where` bodies are
byte-identical base vs head;
(2) **B2** `scripts/batch-scheduler.mjs:632` (`surfaceKey`): literal placeholder
vocabulary keys become real lanes. Live differential (14 open issues, base copy
vs head): head emits `packages/<name>[598]` and `skills/<usage-carrier>[603]`,
base emits neither. Mechanism, traced per issue: head's line tokenizer reads
`#574`'s backticked `packages/<name>`/`skills/<name>` quotes that base's global
pairing swallowed (`#574 extractSurfaces base: [] head: [7 keys incl. both
placeholders]`), `#574` is launched so `noteChildren` registers the `<name>`
child and `expand` infects `#598`'s tree `packages` token, and `#603`'s new
`## Surfaces` bare bullet directly yields `skills/<usage-carrier>`. Function
level: `extractSurfaces("Use \`packages/<name>\` …")` is equal base vs head —
the unguarded resolution is base-proven, but every reader that now feeds it
(body tokenizer, `## Surfaces`, unit-doc fallback) is this change's, and this
repo's own templates are *required* to carry the literal tokens (T1:553-560), so
the guard belongs to this change per S2's full-symbol rule. Stability: 3/3;
(3) **B3** `docs/fix/574-batch-scheduler-surface-detection/SPEC.md:186-191`
(AC-S1) + `planning-obligations.md` O2: "the four issue forms carry a
`surfaces` field whose description names the six lane keys" is false for the two
`template/.github` forms — their descriptions say "The surface keys this
touches … the lane vocabulary the project's batch plan reports" and name no
keys, and T1 itself asserts `!text.includes("packages/<name>")` for exactly
those forms (domain separation): AC-S1's named check contradicts the claim it is
cited to prove. Reproduced by reading all four forms + T1; the claim is new
in-branch (base has no unit doc); stability: the four forms and T1 are static;
(4) **B4** `packages/agentic-workflow-schema/src/batch-plan.ts:196`: the
`degraded` field JSDoc still reads "Declared degradations,
`unavailable-<source>-<cause>`" while this branch's own diff updated the same
file's DEGRADED doc (:83-91), its regex (:93) and its error text (:280) to carry
`surface-unknown-issue-<n>` — a missed sibling on a published interface; base is
internally consistent, so the inconsistency is change-caused;
(5) **B5** `skills/batch-scheduler/references/PLAN.md` CLI section: base:168
ends the exit-code paragraph with the binding rule "One call per dimension,
never per issue."; the head rewrite (added `--infer-surfaces` usage) drops it,
`rg` finds no survivor in README/SKILLS/SKILL/PLAN/triage-issue, and
`## Retirements` records no retirement — a contract sentence deleted by the
rewrite, not by decision;
(6) **B6** `docs/fix/574-batch-scheduler-surface-detection/SPEC.md:100-102`
(Retirements): "`bun scripts/residual-classify.mjs --inventory --base origin/main`
is the receipt, recorded as an `E` line below" — `rg -n
'residual-classify|--inventory'` over the unit doc matches only the prose
(:101, :108); Log E1–E11 carries no such line. The command itself re-runs green
here (exit 0), so the fix is to record the receipt the doc promises.
Advisories: 7 —
(A1) `occupied_by` attribution differs for the same lanes on the live corpus
(base: `branch feat/590-product-audit-extensibility` on `docs`/`scripts`; head:
`PR #599 open + branch fix/574-… + unit-doc docs/fix/574-…`, and head's evidence
string carries the `unit-doc …` part `inFlightEvidence:395-402` builds) —
first-match, display-only; lane membership and batching are unchanged; not
covered by E5's two declared differences → route the batch;
(A2) E5/O14's receipt is snapshot-scoped: E5 declares "11 open issues … two
intended differences and no other"; on today's 14-issue corpus the differential
shows the intended class (fence-recovered `#574` claims/surfaces [F1/E5-class],
`#554`'s move [E5], three lost `file-overlap` warnings that vanish because
`#574` now has surfaces and the pairs serialize behind the in-flight occupancy
[E5-mechanism]) plus B2's phantom lanes and A1's attribution — E5's exclusivity
sentence no longer reproduces as "no other"; a fresh differential E-line is
planned with the batch;
(A3) `planning-evidence.md` PE-009 cites "GitHub Docs … fetched 2026-11-16",
but the GitHub Docs fetch does not reproduce in this pass (network fetch
failed); the claim itself is corroborated indirectly — the yml forms render
labels at level 3, and `headingBoundsAll` accepts levels 2-6 (a sample legacy
body shows level 2, also legal); no functional impact;
(A4) the SPEC templates' `## Surfaces` prose says "Advisory only: no reader
requires this section" (templates:64/75) while both fix forms mark the
`surfaces` field `required: true` — different artifacts (unit-doc section vs
issue field, `surface-unknown` being the honest required answer), but the
template prose invites reading the issue field as optional too; wording note;
(A5) `skills/batch-scheduler/SKILL.md` Step 0 (~:66) still describes the script
reading "`## Where`/`## In scope` sections from issue bodies" and omits the
`## Surfaces` section this change added — the skill's own discover step is
stale; one-line doc repair;
(A6) `--infer-surfaces` accepts `--json-only`, `--state` and `--remote`
silently (exit 0, no state file written, output unchanged) but refuses
`--mark-launched` (exit 2), and `PLAN.md:176`'s infer usage line documents only
`[--issues-file]` — asymmetric validation on the new flag (base has no
infer mode at all);
(A7) the disclosed size breach reproduces: `diff-guard --base 888aaceb` →
BREACH 1363 lines > 400 · 28 files > 8 (G1 recorded 1307/28 at `05838c8a`) —
still reported, not force-fit, per G1; `setup-env.mjs --check` also fails in
this fresh worktree (`.serena/cache` absent — environment, pre-existing).
Sibling sweep: clean — `batch-plan@1`/`@2` and `scopeSections` have zero hits
outside history; `surface-unknown`/`blind-spot` are carried by README.md,
`docs/workflow/SKILLS.md`, `skills/batch-scheduler/{SKILL.md,references/PLAN.md}`,
`docs/workflow/ISSUE_WORKFLOW.md` and `skills/triage-issue` (3 matches, O12/E8);
`docs/ROADMAP.md:203` and `.changeset/574-surface-declaration.md` carry the
landed contract (changeset lint exit 0); `docs/features/107-…/INVENTORY.md` BS04
enumerates only `cycle`/`orphaned-soft-dep`/`prose-native-mismatch` — incomplete
but not false (`file-overlap`/`stale-claim` were already absent at base);
B4's stale JSDoc and B5's dropped rule are the blockers above, not sweep items.
Completeness: S1–S6 resolved — every S# has a task carrying `(Implements: S#)`
(`promise-coherence` PASS, 42 checked · 23 skipped) and O1–O15 are `verified`
with their validators re-run in this pass (batch-scheduler 77/0 covers
O2–O7/O9–O11/O15, unit-doc-contract 21/0 covers O1, schema 887/0 covers O8,
triage `rg` 3 matches covers O12, root suite reproduces O13's disclosed flake,
the fresh differential re-runs O14 — its "11 issues / two differences" receipt
is advisory A2).
Spot check: `bun test scripts/batch-scheduler.test.mjs` → match (E1 reported
77 pass · 0 fail; observed 77 pass · 0 fail).
Verdict: NEEDS-DECISION (6 open blockers: scripts/batch-scheduler.mjs:545 ·
scripts/batch-scheduler.mjs:632 · docs/fix/574-batch-scheduler-surface-detection/SPEC.md:186-191
+ planning-obligations.md O2 · packages/agentic-workflow-schema/src/batch-plan.ts:196 ·
skills/batch-scheduler/references/PLAN.md CLI section ·
docs/fix/574-batch-scheduler-surface-detection/SPEC.md:100-102)

## Evidence

`command: observed result` — every command run on this checkout; `git status`
stayed clean (the only untracked path is this session's harness journal
fragment, produced by the session, not by any changed command).

| command | observed |
|---|---|
| `bun test scripts/batch-scheduler.test.mjs` | exit 0 · 77 pass, 0 fail (matches E1) |
| `bun test scripts/unit-doc-contract.test.mjs` | exit 0 · 21 pass, 0 fail (matches E2) |
| `bun test scripts/scaffold-parity.test.mjs` | exit 0 · 17 pass, 0 fail (matches E3) |
| `cd packages/agentic-workflow-schema && bun run test` | exit 0 · 887 pass, 0 fail (matches E4) |
| `bun scripts/check-skill-context.mjs` / `--documents` | PASS context budgets 30 skills · PASS 4 budgeted documents (matches E6) |
| `bun scripts/docs-generate.mjs --check` | verdict PASS, roadmap unchanged (matches E7) |
| `bun scripts/promise-coherence.mjs` | exit 0 · PASS, 42 checked · 23 skipped (matches E10) |
| `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/fix/574-…/SPEC.md` | exit 0 · verdict PASS, P4–P9 6/6 each, fingerprint `c021423a…` (matches E9 exactly) |
| `bun scripts/lint-changeset.mjs` | exit 0 · violations 0 (matches E7) |
| `bun scripts/skill-lint.mjs` | verdict PASS · 0 findings |
| `bun scripts/residual-classify.mjs --inventory --base origin/main` | exit 0 (the command B6 promises as an E-line; no E-line exists) |
| `rg -n 'surface-unknown' skills/triage-issue/` | exit 0 · 3 matches (matches E8/O12) |
| `node scripts/run-root-suite.mjs --suite-timeout 400` | exit 1 · 113 of 114 — `scripts/unit-route.test.mjs` `#291 F7` wall-clock (1202ms, expected <500ms) = E11's disclosed flake reproducing exactly; `bun test scripts/unit-route.test.mjs` standalone 3/3 → 64 pass, 0 fail (incl. F7 @129–165ms). The same root-suite command also passed 114/114 earlier this session — load-dependent, as E11 says |
| base-vs-head claims fixture differential (identity-asserted module sources printed) | `surfaces-only` base `["scripts/shared-clean.mjs"]` vs head `[]`; `form-order` base `["bun test scripts/telemetry-coverage.test.mjs"]` vs head `[]`; `where-control` `[]` = `[]`; fences excluded at both (F1) — B1 |
| `extractSurfaces("Use \`packages/<name>\` and \`skills/<name>\` plus \`scripts\`.")` base vs head | `["packages/<name>","scripts","skills/<name>"]` at both — the unguarded resolution is base-proven; the readers feeding it are new (B2) |
| `#574`/`#603`/`#598` body probe, base vs head `extractSurfaces` | `#574 base: [] head: [.github,docs,packages/<name>,packages/agentic-workflow,scripts,skills/<name>,template]`; `#603 base: [] head: [packages/agentic-workflow,packages/pi-agentic-workflow,skills/<usage-carrier>]`; `#598 base: [docs,packages,scripts] head: same` — B2's per-issue sources |
| live differential, 14 open issues (2026-11-16: 603,600,598,597,596,595,590,574,554,553,526,470,444,295), base copy vs head, `--no-state --json-only` | both exit 0 · degraded equal (head carries no `surface-unknown-*` — every live body/doc resolves); base `findings` = 3 × `file-overlap` (574,590 / 574,596 / 574,597) vs head `0` — all three vanish because `#574` gains surfaces and the pairs serialize behind the in-flight occupancy (E5-mechanism, not B1: per-issue claims equal except #574-head-stronger); head-only lanes `packages/<name>[598]` and `skills/<usage-carrier>[603]` (B2); `occupied_by` attribution differs on `docs`/`scripts` (A1); summary counts otherwise equal (batched 7, launched 2, label-blocked 5) |
| base `extractFileClaims` source (base:367 `scopeSections`) vs head (`declaredSections`, head:415 `SURFACE_SECTIONS = ["Surfaces","Where","In scope"]`) | base narrows only on Where/In scope else whole body; head treats Surfaces as a declaring section for claims — the change that causes B1 |
| `sed`/`git show` on `PLAN.md` base:168 vs head | base carries "One call per dimension, never per issue."; head lacks it; `rg` finds no survivor — B5 |
| `git diff origin/main...HEAD -- packages/agentic-workflow-schema/src/batch-plan.ts` | DEGRADED doc+regex+error updated in-branch; the `degraded` field JSDoc (:196) untouched — B4 |
| `rg -n 'residual-classify\|--inventory' docs/fix/574-…/SPEC.md` | matches :101/:108 prose only; no E-line in Log E1–E11 — B6 |
| four issue forms + T1 read | `.github` forms name the six keys; `template/.github` forms name none and T1 asserts they must not; AC-S1 claims all four name them — B3 |
| infer-mode probes (real corpus fixture) | `+ --json-only` exit 0 · `+ --state` exit 0 and no state file created · `+ --remote` exit 0 · `+ --mark-launched` exit 2 — A6 |
| `gh issue view 574 --json state` / `gh pr view 599` | `OPEN` / `OPEN` (no prior verify comment or block anywhere → full verdict once) |
| `diff-guard --base 888aaceb` | BREACH · 1363 lines > 400 · 28 files > 8 — G1's disclosed breach, reproduced (A7) |
| `git status --short` | clean except the session's own untracked journal fragment |

Note on the §0 draft verdict this receipt replaces: it listed 8 advisories and
named an "E11 receipt mismatch" — that mismatch is **withdrawn** here (E11
reproduces exactly, see the root-suite row), and the six blockers above were
each re-grounded with the commands shown before this file was written.
