# fix/161-finding-verification-loop-removal

> Fix specification. Registered in `docs/fix/README.md` (`pending`). Fix unit —
> no Product half exists (D6); its authority is reproduction, root cause,
> regression scope, and rollback.

## Goal

Close the trust gap the review loop kept exposing: SPEC/plan authoring never
leaves the repo to learn what the capability must mean or how the domain solved
it before; review findings are accepted as real without independent
verification and carry no durable signature; and the model-driven
`loop-review-fold` router proved (fix/157: 11 rounds; feature 28: 5 cycles)
that a skill turn adds no bound a persisted state machine cannot enforce
better. This fix adds a **research gate** to authoring, gives findings the
feature-28 treatment (**verify independently, then sign**), and **retires
`loop-review-fold`**, leaving the loop to a programmatic driver (AWL) that
consumes the already-published contracts, with the manual
`review-change → fold-findings → re-run review-change` path as the fallback.

## Issue

#161 — tracked issue in this forge. The PR closes it via `Closes #161`.

## Branch

`fix/161-finding-verification-loop-removal` (from `main` @ `746a6d71`)

## Depends on

`159-review-fold-loop-bounds` (PR #160, open) — its contract text lives in the
same files (`review-change` references, `scripts/review-loop-discipline.test.mjs`)
and this unit *succeeds* its bounds (the two-cycle cap migrates from the
retired skill into `review-change` itself). Execute only after #160 merges, or
rebase this branch onto it.

## Root cause

Three independent gaps, evidenced under `### Planning evidence`:

1. **No research obligation at authoring time.** `design-feature` and the plan
   skills ground every claim in repo evidence only (`evidence-grounding`
   Guardrails name no web source; the bounded question set has no research
   step). An author model therefore designs from what the repo already
   believes — the exact bias that produced small-change plans for
   full-magnitude capabilities (PE-007).
2. **Findings are trusted at face value.** A finder's claim flows to
   classification and persistence with no second context checking the claim
   against the cited bytes. Feature 28 gave *verdicts* authority and signatures
   (`review-mark@1`, snapshot-bound receipts) but nothing for *individual
   findings* (PE-005). An unverified claim became a ledger row, a fold task,
   and a re-review trigger — the loop's fuel.
3. **A skill-loop router cannot add a bound.** `loop-review-fold` is another
   model turn; every bound it "adds" is text a model may skip, and its
   first-match table re-derives decisions the persisted marks already encode
   (PE-001). The loop's real state machine — `REVIEW-RAN` marks, ledger rows,
   SHA-bound receipts — is machine-readable already; a driver outside this repo
   can consume it programmatically (PE-004).

## Detected in

User report this session (2026-09-03), backed by field evidence: fix/157 ran
11 review/fold rounds (F1–F18) and feature 28 needed 5 cycles (F1–F77+);
recorded as issue #161 (PE-002, PE-003).

## Scope

### In scope

1. **Research gate (authoring).** `design-feature` gains a mandatory,
   fail-closed research pass before the Product half is emitted: ≥2 externally
   fetched sources on the capability's domain (fetch/WebFetch/browser), each
   cited as an evidence row (URL + access date), with explicit coverage of the
   capability's **full definition** (what it is / is not) and the **user's
   expectation** of it — including the **implicit case decomposition**: every
   enunciated expectation is expanded into the case vector it implies before
   design (valid/invalid values and limits, interaction states, degraded mode,
   backend validation/filtering/parsing, alternate user paths — the canonical
   example: a "phone number input" is not a field, it is the whole case
   vector the product owner's one-liner hides; PE-012). Offline or
   unanswered → `NEEDS-EVIDENCE`, never a guess. `plan-fix` /
   `plan-feature-scaffold` gain the **conditional** web step: only when a
   bounded question (ROWS.md Q1–Q5) cannot be answered by repo evidence — one
   web pass before the phase is emitted — plus the **mandatory reference
   trace**: affected code is located by symbol/reference search (LSP/serena
   when the environment offers it, grep otherwise) and the blast radius is
   derived from that search, never from model memory (PE-012). Finally,
   `review-code` gains the broken-reference checklist item (every changed
   symbol/API gets a reference search; un-updated callers are findings).
   `evidence-grounding` accepts fetched web sources as `source-and-location`
   (URL + access date).
2. **Independent finding verification + durable signatures.** `review-change`
   verifies every candidate finding in an isolated context against the
   reviewed head's bytes before anything persists, **by the method the
   finding's axis demands** (PE-012): a code/behavioral claim confirms only
   with a **failing reproducer** — a red test written first that encodes the
   expected behavior, run against unchanged code, or reproducible command
   output (the classic reproduction → red → fix → green circuit; the fold is
   then "fix until green", which `FOLD_POLICY` already demands) — while
   writing/documentation claims confirm by **direct read** of the cited text
   (typos and wording are corrected without ceremony, no test) and
   missing-documentation claims confirm the named user path is undocumented.
   Only **confirmed** findings reach the ledger, each annotated by the
   `finding-mark@1` block (a per-finding durable signature: reviewer, head
   SHA, recheck method + reproducer reference); **refuted** candidates are
   reported with their counter-evidence and never become rows. The marks are
   machine-checkable (annotator-safe `VF-` ids), so AWL can consume them.
3. **Retire `loop-review-fold`.** Delete the skill; remap every live consumer
   (hand-offs, routing tables, manifests, docs, schema vocabulary) to the
   manual path `review-change → fold-findings → re-run review-change` and to
   programmatic orchestration by an external driver consuming the published
   contracts. The two-cycle cap moves into `review-change` so the bound
   survives the retirement.
4. **Test immutability contract.** Once written, a test is unmodifiable: the
   executor fixes code until green, never the test. The single legitimate
   amendment is a **proven mis-encoding of external reality** — the test's
   expectation contradicts the actual documented semantics of the
   platform/library/language (cited from authoritative documentation), not a
   product decision change — and even that surfaces as a finding plus SPEC
   amendment, never a silent edit. Prevention rides the research gate:
   platform semantics are verified against authoritative documentation
   **before** a test encodes them (PE-013).

### Out of scope

- A `ReviewFinding v1` wire contract in the schema package (the ledger +
  annotator validator is the AWL-consumable contract for now) — user-routed
  proposal, recorded in `Decisions made during drafting`.
- Implementing the AWL driver (outside this repository per
  `REPOSITORY_STATE.md` "New AWL work" — no sequencing authority here).
- Any edit to historical unit artifacts (`docs/features/*`, `docs/fix/147`,
  `docs/fix/159`, `GOLDEN_FIXTURE` run-log rows, `docs/LOGS.md` history) —
  history is a record.
- `fold-findings`, `triage-issue`, `audit-pr` row semantics (unchanged; only
  the *population* of rows changes).

### Planning evidence

The fix's own authority, without a Product half — one row per material claim.

| id | claim-or-obligation | authority-kind | source-and-location | observed-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|---|
| PE-001 | `loop-review-fold` adds no bound the persisted evidence (marks, rows, receipts) cannot express; its process re-derives decisions from ledger state a driver can read directly | repository | `skills/loop-review-fold/SKILL.md` §Process | 746a6d71 | O8 | current | proven | — |
| PE-002 | Field evidence of the unbounded loop: 11 review/fold rounds F1–F18 (fix/157) and 5 cycles F1–F77+ on feature 28 | repository | `git show fix/157-claude-skills-self-mount:docs/fix/157-claude-skills-self-mount/review-findings.md` (branch-ref — the unit artifacts exist only on the unmerged #157 branch, head `d421bb59` at drafting; PR #158); `docs/features/28-evidence-grounded-spec-plan-review/progress.md` (cycle receipts, on main) | 746a6d71 (main); 157 rows bound to branch head `d421bb59` | O4 | current | proven | — |
| PE-003 | The user directs: research gate for SPEC/plan authoring (fetch/WebFetch/browser), independent finding verification with durable signature, and retiring `loop-review-fold` in favor of programmatic orchestration (AWL) | forge | https://github.com/gtrabanco/agentic-workflow/issues/161 (user report, 2026-09-03) | — | O1, O4, O8 | not-applicable | decision | — |
| PE-004 | AWL consumes published contracts; AWL work is outside this repository and has no sequencing authority here | ledger | `docs/workflow/REPOSITORY_STATE.md` §"New AWL work" row | 746a6d71 | O14 | current | proven | — |
| PE-005 | Feature 28 shipped verdict-level authority and signatures (`review-mark@1` in `LEDGERS.md`, `PreExecutionReviewReceipt v1`); findings themselves have no verification/signature contract — the extension point this fix uses | repository | `skills/pre-execution-review/references/LEDGERS.md` §"review-mark@1" | 746a6d71 | O5 | current | proven | — |
| PE-006 | The provenance annotator parses only rows matching `\| F<n> \|` and skips other id shapes, so `VF-`-prefixed mark rows cannot pollute fold provenance | repository | `scripts/ledger-provenance.mjs` (`ROW_RE`) | 746a6d71 | O7 | current | proven | — |
| PE-007 | Authoring skills carry no web-research obligation today, and the evidence row's acceptable `source-and-location` list excludes fetched web sources | repository | `skills/evidence-grounding/SKILL.md` §Guardrails; `skills/evidence-grounding/references/ROWS.md` §authority-kind | 746a6d71 | O2 | current | proven | — |
| PE-008 | Prior art (research-before-design): the Rust RFC template mandates `Motivation` and `Prior art` sections — research is a structural gate of the design, not an optional step | document | https://raw.githubusercontent.com/rust-lang/rfcs/master/0000-template.md (fetched 2026-09-03) | — | O1 | current | proven | — |
| PE-009 | Prior art (evidence signing): in-toto attestation v1.2 binds a `Statement` to a subject digest with a typed predicate and signature — the shape for a per-finding verified mark | document | https://raw.githubusercontent.com/in-toto/attestation/main/spec/v1/README.md (fetched 2026-09-03) | — | O5 | current | proven | — |
| PE-010 | Third prior-art anchor: GitHub Code Scanning marks an alert "Verified" only after independent confirmation — anchor for the `confirmed \| refuted` vocabulary | document | GitHub Code Scanning docs (rendered page not fetchable from this planning environment) | — | O4 | not-applicable | unknown | owner: P2 task 2 re-fetches and cites the rendered page before writing the confirmed/refuted vocabulary; consequence if open: the gate cites two fetches instead of three — acceptable for review |
| PE-011 | Verification-before-persist ends the accepted-unverified finding class: a refuted candidate never becomes a row, a fold task, or a re-review trigger | derived | rule "persist only rows carrying a confirmed finding-mark", inputs PE-003 + PE-005 | — | O4 | not-applicable | decision | — |
| PE-012 | The verification method follows the finding's axis (code claims need a failing reproducer — red test first, unchanged code; documentation claims are corrected by direct read without ceremony), user expectations must be decomposed into their implicit case vector (the phone-input canon: values/limits, interaction states, degraded mode, backend contract, alternate paths), and affected code is located by symbol/reference search (LSP/serena when available, grep otherwise) with the blast radius derived from that search | user | SPEC `## Decisions made during drafting` item 7 (user direction, 2026-09-03) | — | O3, O19, O20, O21 | not-applicable | decision | — |
| PE-013 | Tests are immutable once written; the sole legitimate amendment is a proven mis-encoding of external reality (the test's expectation contradicts the platform's actual documented semantics — cited from authoritative docs), surfaced as a finding + SPEC amendment, never a silent edit; the prevention is research-before-encode: platform semantics are verified against authoritative documentation before a test encodes them | user | SPEC `## Decisions made during drafting` item 8 (user direction, 2026-09-03) | — | O22, O23, O24 | not-applicable | decision | — |

### Obligations

| obligation-id | Authority source | Affected use case or invariant | Phase | Task | Implementation owner | Validator | Required evidence | Status |
|---|---|---|---|---|---|---|---|---|
| O1 | PE-003 + PE-008 | Full definition + user-expectation coverage before a Product half exists | P1 | 1 | execute-phase | `node scripts/authoring-research.test.mjs` → exit 0 | test `design-feature mandatory research gate` | planned |
| O2 | PE-007 | Fetched web sources are citable evidence; unanswered material questions never invent facts | P1 | 2 | execute-phase | `node scripts/authoring-research.test.mjs` → exit 0 | test `web source rows accepted` | planned |
| O3 | PE-003 ("plan: only if necessary") | Plan-stage research is conditional on a named unanswered bounded question | P1 | 3 | execute-phase | `node scripts/authoring-research.test.mjs` → exit 0 | test `conditional plan research` | planned |
| O4 | PE-003 + PE-011 | No unverified finding is persisted; verification runs isolated against the reviewed head | P2 | 1 | execute-phase | `node scripts/review-loop-discipline.test.mjs` → exit 0 (verification pins) | test output + receipt | planned |
| O5 | PE-009 + PE-011 | `finding-mark@1` block contract: shape, writer, `VF-` prefix, `confirmed`/`refuted` routes, excluded from fold queue and sensor | P2 | 2 | execute-phase | `grep -c "finding-mark@1" skills/pre-execution-review/references/LEDGERS.md` ≥ 1 | grep output | planned |
| O6 | PE-006 | Ownership map + normative-surfaces row name the new block and its single writer | P2 | 3 | execute-phase | `grep -c "finding-mark@1" CLAUDE.md` ≥ 1; `node --test scripts/normative-drift.test.mjs` | test output | planned |
| O7 | PE-006 | Provenance stays unambiguous: the annotator never parses `VF-` mark rows as findings | P2 | 4 | execute-phase | `node scripts/ledger-provenance.mjs --check` on the seeded fixture | provenance test output | planned |
| O8 | PE-001 + PE-003 | `skills/loop-review-fold/` deleted; `plugin.json`, `model-routing.yml`, budgets manifest carry no entry | P3a | 1 | execute-phase | AC3 validator → 0 | AC3 command output | planned |
| O9 | PE-001 + PE-003 | `review-change` hand-off remapped (`/fold-findings` + re-run + programmatic-driver line); two-cycle cap (`LOOP CAP REACHED`, cycle ≥3, explicit-user-instruction escape) now lives in `REVIEW_PROCESS.md` | P3a | 2 | execute-phase | `grep -n "LOOP CAP REACHED" skills/review-change/references/REVIEW_PROCESS.md` ≥ 1 | grep output | planned |
| O10 | PE-001 | Routing surfaces remapped: `review-implementation/CLASSIFY.md`, `review-spec`/`review-plan` OUTPUT fold routes, `pre-execution-review/POLICY.md` §5 | P3a | 3 | execute-phase | AC3 validator → 0 | AC3 command output | planned |
| O11 | PE-001 | Executor + autopilot surfaces remapped: `execute-phase` (SKILL + UNIT_LOOP/CLOSEOUT/FOLDING/BATCH_AND_PORTABILITY), `ship-roadmap` (SKILL/ADVANCE/MODEL_ROUTING), `triage-issue` (REVIEW_FINDING_PROCESS), `verification-contract` | P3a | 4 | execute-phase | AC3 validator → 0 | AC3 command output | planned |
| O12 | CLAUDE.md bilingual rule | Live docs EN+ES updated; MIGRATION EN+ES retirement note; site guides regenerated; root README EN+ES and Pi package README EN+ES cells corrected | P3a | 6 | execute-phase | AC7 bilingual grep | bilingual grep output | planned |
| O13 | bump-skill contract | Touched skills version-bumped; changelog EN+ES rows; `npx skills add . --list` sane | P3a | 7 | execute-phase | `npx skills add . --list` → exit 0 | AC7 output | planned |
| O14 | PE-004 | Schema vocabulary, capability profiles, and transition table no longer name `loop-review-fold` | P3b | 1 | execute-phase | AC4 validator | AC4 output | planned |
| O15 | O14 | `skill-outcome.schema.json` + `dist/` regenerated by the package's own scripts | P3b | 2 | execute-phase | `git status --porcelain packages/agentic-workflow-schema` clean after build | AC4 output | planned |
| O16 | O14 | Schema + scripts test pins updated (capabilities/machine-contract/workflow-decision; `review-loop-discipline` cap pins moved to review-change) | P3b | 3 | execute-phase | `node --test scripts/*.test.mjs` → 0 failing | AC6 output | planned |
| O17 | O14 | Package major bump 4.0.0 + CHANGELOG EN+ES package rows | P3b | 4 | execute-phase | `grep -n "4.0.0" packages/agentic-workflow-schema/package.json` | changelog rows | planned |
| O18 | verification-contract | Full gate suite green + GOLDEN_FIXTURE smoke + PR with `Closes #161` | P4 | all | execute-phase | AC5 + AC6 + PR URL printed | PR URL in progress receipt | planned |
| O19 | PE-012 | Plan-stage reference trace is mandatory: affected code is located via symbol/reference search (LSP/serena when available, grep fallback) and the blast radius is derived from that search; `review-code` gains the broken-reference checklist item | P1 | 3 | execute-phase | `node scripts/authoring-research.test.mjs` → exit 0 (trace pins) | test output | planned |
| O20 | PE-012 | Implicit case decomposition: each enunciated user expectation is expanded into its implicit case vector (values/limits, interaction states, degraded mode, backend contract, alternate user paths) before the Product half is cut | P1 | 1 | execute-phase | `node scripts/authoring-research.test.mjs` → exit 0 (decomposition pins) | test output | planned |
| O21 | PE-012 | Verification method follows the finding axis: code/behavioral claims confirm only with a failing reproducer (red test written first, run against unchanged code) or reproducible command output; documentation claims confirm by direct read; missing-doc claims confirm the named user path is undocumented | P2 | 1 | execute-phase | `node --test scripts/review-loop-discipline.test.mjs` → exit 0 (axis-method pins) | test output | planned |
| O22 | PE-013 | `verification-contract`: tests are immutable once written — the executor fixes code until green; the sole legitimate amendment is a proven mis-encoding of external semantics (cited from authoritative docs) surfaced as a finding + SPEC amendment; research-before-encode: platform semantics are verified against authoritative documentation before a test encodes them; adding stronger tests stays allowed, editing expectations never (except the proven-mis-encoding path) | P2b | 1 | execute-phase | `node --test scripts/review-loop-discipline.test.mjs` → exit 0 (immutability pins) | test output | planned |
| O23 | PE-013 | Fold-side mirror: `fold-findings/references/FOLD_POLICY.md` + `execute-phase/references/FOLDING.md` forbid editing an existing test's expectation to match behavior; setup repairs keep assertions at least as strong and never touch expectations | P2b | 2 | execute-phase | `node --test scripts/review-loop-discipline.test.mjs` → exit 0 (fold mirror pins) | test output | planned |
| O24 | PE-013 | Immutability pins red-first + budgets manifest + version bumps/changelog rows for touched skills | P2b | 3–4 | execute-phase | `node scripts/check-skill-context.mjs` → PASS | budgets output | planned |
| O25 | PE-001 | Retirement fallout is repaired in the same commit that deletes the skill: the three root test scripts that read `skills/loop-review-fold/SKILL.md` (`scripts/bounded-delivery-loops.test.mjs`, `scripts/next-recommendations.test.mjs`, `scripts/pre-execution-quality.test.mjs`) stop referencing it and keep the suite green | P3a | 1 | execute-phase | `node --test scripts/bounded-delivery-loops.test.mjs scripts/next-recommendations.test.mjs scripts/pre-execution-quality.test.mjs` → exit 0 | test output | planned |

## Rules that must never be violated

- Findings are never persisted unverified and never block as unverified claims
  (verification-contract anti-gaming; PE-011).
- A `refuted` candidate is never silently dropped — it is reported with its
  counter-evidence in the same review report.
- Historical unit artifacts are never edited (MIGRATION and run-logs excepted
  as named).
- Every doc edit ships its ES sibling in the same change (CLAUDE.md hard rule).
- Every touched SKILL.md is version-bumped and changelogged (bump-skill).
- AWL stays outside this repository (PE-004): this fix publishes consumable
  contracts, never the driver.

## Operational risks

- Schema package **major bump (4.0.0)**: vocabulary removal is breaking; CI
  publishes on merge. Mitigation: `docs/workflow/MIGRATION.md` note and a
  patch-level republish path documented in the rollback section.
- Consumers that routed `/loop-review-fold` by habit or config (custom
  `model-routing.yml`, pi-bundle slash commands) break loudly; MIGRATION names
  the replacement.
- The verification step adds one isolated pass per review; the context budget
  manifest and the finder isolation rules bound its cost.

## Security risks

n/a — text-only contract changes; no secrets, auth, PII, or network surface
changes beyond allowing authors to fetch public documentation.

## Compliance touchpoints

n/a — stated explicitly per the fix contract.

## Affected docs

Every mapped doc update is an acceptance criterion (AC7): CHANGELOG EN+ES,
README EN+ES, `packages/pi-agentic-workflow/README{,.es}.md`, `docs/workflow/{SKILLS,FEATURE_WORKFLOW,ISSUE_WORKFLOW,ORCHESTRATION,PORTABLE_PROMPT,WORKFLOW_INVARIANTS,MIGRATION}.md` + ES
siblings, `docs/workflow/model-routing.yml`, `docs/site/guides/` (regenerated),
`CLAUDE.md` (normative-surfaces row), `docs/workflow/SKILL_CONTEXT_BUDGETS.json`.

## Observability

- Green: `node --test scripts/*.test.mjs` (research + discipline pins) and the
  AC3 zero-hit grep prove the contracts hold.
- Silent failure caught: `scripts/review-loop-discipline.test.mjs` fails if a
  consumer reintroduces the retired route or an unverified finding persists.

## Cross-issue notes

- **#159 / PR #160** (open): prerequisite — same-file overlap; execute after
  merge or rebase. Decision: wait (this SPEC's branch already forks from
  `main`; rebase at execution preflight).
- **AWL driver work**: outside this repo (PE-004); consumes the
  `finding-mark@1` rows, `REVIEW-RAN` marks, and SHA-bound receipts. A
  `ReviewFinding v1` wire contract in the schema package is a **proposal** for
  the user to route — not this fix.
- **#159's known-issue 6** (harness toolstate re-reports): resolved by #160's
  workspace precondition; no residual work here.

## Rollback

One `git revert` of the fix PR restores skills, docs, and the schema package;
data cleanup: none (no generated data changes). If the schema package 4.0.0
already published, the revert PR bumps a patch release to republish the prior
vocabulary. Preserved: all history artifacts; lost: nothing (the retired
skill's capability remains as the manual path + driver contracts).

## Acceptance

1. `node --test scripts/authoring-research.test.mjs` exits 0 — research gate
   pins hold (design mandatory with ≥2 fetched sources + definition and
   user-expectation coverage; plan-stage conditional; web evidence rows).
2. `node --test scripts/review-loop-discipline.test.mjs` exits 0 with the
   verification pins (confirm-before-persist, `finding-mark@1` shape, refuted
   reporting, cap now in review-change) and the test-immutability pins.
3. `grep -rn "loop-review-fold" skills/ docs/workflow/ docs/site/guides/ README.md README.es.md packages/pi-agentic-workflow/README.md packages/pi-agentic-workflow/README.es.md .claude-plugin/ docs/workflow/model-routing.yml scripts/ packages/agentic-workflow-schema/src packages/agentic-workflow-schema/skill-outcome.schema.json --exclude=GOLDEN_FIXTURE.md --exclude=GOLDEN_FIXTURE.es.md | grep -v MIGRATION | wc -l` → 0 — only `MIGRATION`'s retirement note and the `GOLDEN_FIXTURE{,.es}.md` run-log history (protected historical rows, excluded by path) may still name it.
4. `cd packages/agentic-workflow-schema && bun run test` → 0 failing (major 4.0.0).
5. `node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs` → 0 failing;
   `cd packages/pi-agentic-workflow && bun run test` → 0 failing.
6. `node --test scripts/*.test.mjs` → 0 failing; `node scripts/check-skill-context.mjs`
   → PASS; `node scripts/check-skill-context.mjs --routes` → PASS.
7. `npx skills add . --list` → exit 0; bilingual grep (retired route removed
   from EN and ES doc pairs in the same change) passes; fix-index row `done`.

## Quality floor

- No validator was loosened to manufacture PASS; historical artifacts untouched.
- Red-first: every new pin test observed failing before its contract text
  landed.

## Commands

- `node scripts/authoring-research.test.mjs`
- `node --test scripts/review-loop-discipline.test.mjs`
- `grep -rn "loop-review-fold" skills/ docs/workflow/ docs/site/guides/ README.md README.es.md packages/pi-agentic-workflow/README.md packages/pi-agentic-workflow/README.es.md .claude-plugin/ docs/workflow/model-routing.yml scripts/ --exclude=GOLDEN_FIXTURE.md --exclude=GOLDEN_FIXTURE.es.md | grep -v MIGRATION | wc -l`
- `cd packages/agentic-workflow-schema && bun run test`
- `node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs`
- `node --test scripts/*.test.mjs`
- `node scripts/check-skill-context.mjs && node scripts/check-skill-context.mjs --routes`
- `npx skills add . --list`

## Phases

| Phase | Status | Tasks | Depends on |
|---|---|---|---|
| P1 — authoring research gate contract | planned · Phase-lint: PASS (8/8) · fingerprint `P1:docs:6:authoring-research-gate-contract` | (1) `design-feature` mandatory research gate: ≥2 fetched external sources cited as evidence rows (URL + access date), full-definition coverage, implicit case decomposition of every enunciated expectation (the phone-input case vector: values/limits, interaction states, degraded mode, backend contract, alternate paths), offline → `NEEDS-EVIDENCE` (2) `evidence-grounding`: web source rows accepted as `source-and-location`; inventory gains the web pass (3) `plan-fix` + `plan-feature-scaffold`: conditional web research (unanswered bounded question forces one web pass) + mandatory reference trace (symbol/reference search — LSP/serena when available, grep fallback — derives the blast radius) (4) `review-code`: broken-reference checklist item (reference search on every changed symbol/API) (5) new `scripts/authoring-research.test.mjs` pins O1–O3 + O19–O20 red-first; budgets manifest updated for the grown skills (6) version bumps + changelog EN+ES rows | none |
| P2 — signed finding verification | planned · Phase-lint: PASS (8/8) · fingerprint `P2:docs:6:signed-finding-verification` | (1) `review-change` verification step between finders and synthesis: isolated recheck of every candidate by its axis's method — code/behavioral claims need a failing reproducer (red test first, unchanged code) or reproducible command output, documentation claims a direct read, missing-doc claims the undocumented user path — → `confirmed \| refuted`; only confirmed persists (2) `LEDGERS.md`: `finding-mark@1` block contract (per-finding row, `VF-` prefix, writer `review-change`, recheck method + reproducer reference, `refuted` carries counter-evidence, excluded from fold queue/sensor/annotator) (3) `CLAUDE.md` normative-surfaces row + ownership-map writer for the block (4) `ledger-provenance.mjs`: seeded-ledger test proving `VF-` rows never parse as findings (5) report contract gains the refuted section; `review-loop-discipline.test.mjs` pins O4–O7 + O21 red-first (6) version bumps + changelog EN+ES rows | P1 |
| P2b — test immutability contract | planned · Phase-lint: PASS (8/8) · fingerprint `P2b:docs:4:test-immutability-contract` | (1) `verification-contract`: tests immutable once written — executor fixes code until green; sole legitimate amendment is a proven mis-encoding of external semantics (cited from authoritative docs) surfaced as finding + SPEC amendment; research-before-encode rule; stronger tests stay allowed (2) fold-side mirror: `FOLD_POLICY.md` + `execute-phase/references/FOLDING.md` forbid editing an existing test's expectation; setup repairs never touch expectations (3) `review-loop-discipline.test.mjs` immutability pins red-first (O22–O23) (4) budgets manifest + version bumps + changelog EN+ES rows | P2 |
| P3a — loop-review-fold retirement across live consumers | planned · Phase-lint: PASS (8/8) · fingerprint `P3a:docs:7:loop-review-fold-retirement` | (1) delete `skills/loop-review-fold/`; clean `plugin.json` skills array, `model-routing.yml`, budgets manifest; update the three root test scripts that read the deleted skill — `scripts/bounded-delivery-loops.test.mjs`, `scripts/next-recommendations.test.mjs`, `scripts/pre-execution-quality.test.mjs` (O25) (2) `review-change` hand-off remap (`/fold-findings` + re-run + programmatic-driver line) and the two-cycle cap moves into `REVIEW_PROCESS.md` (`LOOP CAP REACHED`, cycle ≥3, explicit-user-instruction escape) (3) remap routing surfaces: `review-implementation/CLASSIFY.md` + `review-spec`/`review-plan` OUTPUT fold routes + `pre-execution-review/POLICY.md` §5 (4) remap executor surfaces: `execute-phase` SKILL + UNIT_LOOP/CLOSEOUT/FOLDING/BATCH_AND_PORTABILITY (5) remap autopilot surfaces: `ship-roadmap` SKILL/ADVANCE/MODEL_ROUTING + `triage-issue` REVIEW_FINDING_PROCESS + `verification-contract` (6) live docs EN+ES + MIGRATION EN+ES retirement note + site-guide regeneration + root README EN+ES + Pi package README EN+ES cells (O12) (7) version bumps + changelog EN+ES rows + `npx skills add . --list` sanity | P2b |
| P3b — schema vocabulary without the loop router | planned · Phase-lint: PASS (8/8) · fingerprint `P3b:domain:4:schema-vocab-without-loop-router` | (1) `packages/agentic-workflow-schema/src/index.ts`: vocabulary, capability profiles, transition table (2) regenerate `skill-outcome.schema.json` + `dist/` via the package's own scripts (3) update `capabilities`/`machine-contract`/`workflow-decision` tests + the `scripts/*.test.mjs` pins whose text moved (4) package major bump 4.0.0 + CHANGELOG EN+ES package rows | P3a |
| P4 — Hardening & PR | planned | copy the template's final tasks literally: full gate suite, bilingual grep, AC3 grep, GOLDEN_FIXTURE smoke for the touched review/executor skills, PR with `Closes #161`, fix-index `done` | P3b |

## Decisions made during drafting

1. **Fix route (user-directed):** the unit borders L but the user explicitly
   directed a fix; scope is held to M by excluding the schema wire contract
   for findings (proposal) and all historical artifacts.
2. **No `ReviewFinding v1` schema contract in this unit:** the ledger block +
   `ledger-provenance.mjs` validator is the AWL-consumable contract (PE-004,
   PE-006); publishing a wire contract would force a second breaking release —
   user-routed proposal.
3. **The two-cycle cap survives the retirement:** it moves from
   `loop-review-fold` 4b into `review-change` (`LOOP CAP REACHED` at cycle ≥3
   absent explicit user instruction) — the bound must not live only in a skill
   being deleted.
4. **Ledgers embedded in this SPEC** (plan-fix Output contract; fix/157
   precedent), although the M size would point at separate files per
   `LEDGERS.md` — the plan-fix-vs-LEDGERS size wording drift is left as a
   note for `review-plan` to route as a proposal.
5. **Schema package goes major (4.0.0)** rather than keeping a retired alias —
   the closed vocabulary stays closed; MIGRATION carries the transition.
6. **This plan dogfoods the research gate it adds (PE-008/PE-009 fetched;
   PE-010 `unknown` with owner):** the planning environment could not render
   the third page, so the row is honest `unknown` instead of an invented
   citation.
7. **User direction recorded as `PE-012` (2026-09-03):** the verification
   circuit is the classic one — issue verified by use (e2e/user/dev) or tests;
   reproduce the failure, write the failing test encoding the expectation
   against unchanged code, then fix until green — and documentation is a
   different axis (typos/wording are corrected directly, missing docs are
   written, and only the expected user path is normally documented, which is
   where defects surface). User expectations decompose into their implicit
   case vector (the phone-input example: prefixes/suffixes, lengths, non-text
   rejection, focus, no-JS/JS behavior, backend filtering/validation/parsing)
   and that decomposition belongs to `design-feature` (features) and
   `plan-fix` (fixes). Affected code is located by symbol/reference search
   (serena/LSP when available) because added code can break something else or
   imply changes in more places — the blast radius comes from the search, not
   from memory. Conversation text is never evidence, so the direction lives
   here and in `PE-012`.
8. **User direction recorded as `PE-013` (2026-09-03):** tests, once written,
   are unmodifiable. The one exception — a test whose expectation turned out
   to contradict the platform's actual behavior — is treated as a mis-encoding
   defect: it must be proven against authoritative documentation and surfaces
   as a finding + SPEC amendment, never a quiet edit to go green. An agent
   that documents itself well (verifies semantics before encoding them in a
   test) should never need the exception; the research gate exists to make
   that the normal path.

## Effort

M — one day of executor work, multi-commit (6 phases), one PR.
