# fix/147-audit-evidence-provenance

## Goal

Make `product-audit`'s evidence mechanical instead of aspirational: a fixed
evidence-provenance gate (forge state authority, command-scope binding,
inventory recomputation, freshness, conflicting-source resolution) plus a
mandatory cross-audit delta so two audits of one scope cannot publish the same
false product facts twice. Without this, an audit turns an aggregate command
tail or a stale worklist into a confident product finding and never compares
against the previous report for the same scope.

## Issue

#147 — tracked in this repo's forge (`gtrabanco/agentic-workflow`). The PR
closes it via `Closes #147`.

## Branch

`fix/147-audit-evidence-provenance`

## Depends on

None. Open work on adjacent surfaces (PR #145 / #139 staged verification
contracts, #146 planning receipts) shares no file with this change.

## Root cause

- The skill's only evidence rule is generic citation shape ("every
  finding/proposal cites a `file:line`/metric/doc/issue source; mark
  uncertainties *verify*" — `skills/product-audit/SKILL.md` Guardrails).
  It says what a citation looks like, not how the fact was produced, how fresh
  it is, or which source wins when repository indexes and live systems
  disagree.
- `skills/product-audit/references/AUDIT_PROCESS.md` defines nine steps with
  no provenance checklist and no prior-audit read-back: persistence allocates
  a fresh audit id and rewrites a full report with no comparison against the
  newest previous audit of equivalent scope.

## Detected in

Two whole-product audits of `gtrabanco/webs` on 2026-08-22 documented in
issue #147: both attributed a root-suite test count (`173 tests across 7
files`) to the package, both missed ADR 0047 already present in the audited
tree, both derived live-backlog claims from a stale `docs/fix/README.md`, and
audit 4 claimed a fresh independent sweep while repeating most of audit 3
with no delta. Consumer-side repair was done in webs PR #398; the skill fix
is owned here.

## Scope

### In scope

All edits land in `skills/product-audit/`, `docs/workflow/GOLDEN_FIXTURE.md`
(+ `.es.md` sibling), and bump-owned surfaces. Additions stay surgical:
`SKILL.md` sits at 219 budgeted lines of a 240 cap, references hold a
280-line / ~2200-token reference budget (`docs/workflow/SKILL_CONTEXT_BUDGETS.json`
defaults), so every item below has a known line cost ceiling.

1. **Fixed evidence-provenance gate** in
   `skills/product-audit/references/AUDIT_PROCESS.md` — block headed by the
   literal `Evidence-provenance gate (fixed):` inserted directly under step 2
   (applies during every evidence-collecting sweep step). Five labeled items,
   each ending `Fallback:` + exactly one of `rerun in scope` | `mark unverified`:
   - `- Forge state —` project-declared forge CLI/API is authoritative for
     live issue and pull-request status; fix-index/worklist/roadmap rows are
     audited for documentation drift, never treated as the live ledger.
     Fallback: `mark unverified`.
   - `- Command-derived metrics —` bind exact command + working directory or
     target + supporting output line or structured field; an aggregate
     terminal summary may never be attributed to a narrower scope without a
     package/target-scoped rerun. Fallback: `rerun in scope`.
   - `- Repository inventories —` ordered/inventory claims (e.g. "decisions
     through N") recomputed from the current tree with project-compatible
     tools, citing the terminal path/item found. No hardcoded product names,
     package managers, runtimes, forge hosts, or non-portable shell recipes
     inside the portable contract. Fallback: `rerun in scope`.
   - `- Freshness/timestamps —` record when each source was captured and by
     what method; stale-capture claims older than the current tree recompute
     before use. Fallback: `mark unverified`.
   - `- Conflicting sources —` resolve by declared authority order (live
     forge > scope-bound command output > repository inventory > worklist
     index); record the winner next to the claim. Fallback: `mark unverified`.
2. **Guardrail pointer** in `skills/product-audit/SKILL.md` (Guardrails, ≤2
   added lines): evidence must satisfy the fixed evidence-provenance checklist
   in AUDIT_PROCESS.md; uncertainties remain marked *verify*.
3. **Delta vs prior equivalent-scope audit**:
   - New fixed output section in the `skills/product-audit/SKILL.md` output
     format block, placed between Findings and Proposals, headed literally
     `## Delta vs audit <prior-id>` carrying `New` / `Unchanged` /
     `Resolved` subsections whose entries map findings with the literal
     syntax `F<k> <- audit <prior-id> F<j>`; first-audit/no-prior case printed as
     the section body `none — <why no equivalent-scope prior exists>`.
   - New step 8 in `AUDIT_PROCESS.md` (`Delta vs prior equivalent-scope
     audit`): after independent synthesis and numbering, load the newest
     previous audit with an equivalent scope and fill the delta section;
     existing steps 8→9, 9→10 renumber mechanically. Persisted reports carry
     the delta section (persist-step wording amended).
   - Second same-date/equivalent-scope audit: allowed when it states a reason
     plus the required delta — never forbidden by date alone.
4. **Finding-ID contract preserved**: SKILL.md Guardrails extends the existing
   `F1, F2, …` bullet — `<audit-id> F<k>` stays the only addressing scheme;
   cross-audit lineage lives exclusively in delta mappings, never global slugs
   or replacement IDs.
5. **Weak-model golden-fixture scenario** appended to
   `docs/workflow/GOLDEN_FIXTURE.md`: new section headed `Audit-evidence
   provenance fixture` whose toy repo exposes four labeled traps —
   `T1 wrong-scope aggregate tail` (root suite owns the gate's terminal
   summary), `T2 stale worklist vs forge state` (persisted index row lags
   merged/closed state), `T3 newer terminal inventory item` (ordered records
   where the terminal entry outruns every doc reference), `T4 prior
   equivalent-scope finding` (stored earlier audit with one addressable
   `<prior-id> F<j>`); expected-report subsection states the weak model must
   mark unverified rather than attribute the tail, prefer live forge over the
   stale row, cite the actual terminal inventory item, emit the Delta section
   mapped onto `<prior-id> F<j>`, and state a reason if rerun the same date.
6. **Bilingual sync**: mirror scenario 5 faithfully into
   `GOLDEN_FIXTURE.es.md` in the same commit, keeping trap labels T1–T4 verbatim.
7. **Version surfaces** via the repo's bump-skill flow: `product-audit`
   version `3.0.3` → `3.1.0` (minor — backward-compatible capability),
   CHANGELOG.md + CHANGELOG.es.md rows, README.md/README.es.md tables.

### Out of scope

- Global slug IDs or any redesign of `F1..Fn` / `<audit-id> F<k>` addressing —
  explicitly rejected by the issue (#147, Expected behaviour ¶5).
- PR #145 / issue #139 (staged candidate-bound verification contracts) and
  issue #146 (portable pre-execution review receipts) — different surface,
  own units.
- Audit triage mechanics (`triage-issue`) and report proposal streams — the
  delta is additive reporting, not routing logic.
- Consumer-repository repairs (webs): already delivered there via webs #398.

## Acceptance

Objective criteria mapping 1:1 to the issue's acceptance checklist. Validators
are frozen in `ACCEPTANCE.md`; anchors below are the exact literals validators
grep.

1. Provenance gate present with five labeled domains, each ending `Fallback:`
   → command: grep for the five literals under anchor `Evidence-provenance
   gate (fixed):` in `AUDIT_PROCESS.md` — five matches with fallback labels.
2. Forge-authority statement explicit → grep `authoritative for live issue
   and pull-request status` in `AUDIT_PROCESS.md`.
3. Command evidence binding + aggregate-tail prohibition → greps for
   `working directory or target`, `supporting output line or structured
   field`, `aggregate terminal summary` in `AUDIT_PROCESS.md`.
4. Inventory portability, no embedded non-portable recipes → presence: grep
   `recomputed from the current tree` in `AUDIT_PROCESS.md`; inverse checks
   per AC4 validator (token-by-token absence scans over
   `skills/product-audit/` for `gtrabanco/webs`, `bun `, `sort -V`,
   `gh issue`, `gh pr` — baseline today: empty; must stay empty through
   implementation).
5. Delta section in the output-format block with three classes + mapping
   syntax + explicit no-prior case → greps in `SKILL.md` for `## Delta vs
   audit <prior-id>`, `F<k> <- audit <prior-id> F<j>`, `none — <why no
   equivalent-scope prior exists>`.
6. Same-date/equivalent-scope rerun needs stated reason + delta, not banned
   by date alone → grep `not forbidden by date alone` in `AUDIT_PROCESS.md`.
7. Process loads newest prior equivalent-scope audit after synthesis → grep
   `newest previous audit` + `equivalent scope` in `AUDIT_PROCESS.md`.
8. F-ID-only addressing preserved with lineage-in-delta wording → grep
   `never global slugs` in `SKILL.md` Guardrails.
9. Golden-fixture scenario with the four traps + expected reject/mend/delta
   behavior in both languages → greps for `T1 wrong-scope aggregate tail`,
   `T2 stale worklist vs forge state`, `T3 newer terminal inventory item`,
   `T4 prior equivalent-scope finding` in GOLDEN_FIXTURE.md AND its .es.md.
10. Repo gates green on the final tree → `node scripts/check-skill-context.mjs`
    exit 0 (35 skills PASS) and `npx skills add . --list` lists `product-audit`;
    version shows `3.1.0` in `SKILL.md`, with matching rows in both CHANGELOGs.

### Spec-lint (mechanical — presence checks only)

Run by `plan-fix` before committing the draft; fail-closed, no quality
judgement. Any FAIL → fix the SPEC before the commit.

- [ ] No template placeholders left (`grep -nE '<(topic|n|task|command|expected)'`
      over the filled sections returns nothing — the `### P1` scaffold lines
      are replaced, not kept).
- [ ] `### Out of scope` has ≥ 1 concrete bullet — never empty.
- [ ] Every `## Acceptance` criterion is a runnable command OR labelled
      `read-verified`.
- [ ] Every phase passes the 8-box Phase-lint below (already mandatory,
      owned by `skills/phase-contract/SKILL.md`).

## Phases

Execution ledger — `execute-phase --fix 147` runs **all remaining phases by
default** and ticks tasks here; an explicit phase argument (`--fix 147 P3`)
runs exactly one phase.
**Always ≥ 2 phases**: `P1..Pn` implement the fix
(each task independently checkable, no judgement); the final phase is
always `Hardening & PR` — keep its pre-written tasks **literally**, never
paraphrase or merge them into an implementation phase.

### Phase-lint (owned by `skills/phase-contract/SKILL.md`)

Every implementation phase below must pass all 8 boxes before it is emitted
(planner skills) or executed (`execute-phase` pre-flight). Fail-closed: any
unticked box blocks emission/execution until the phase is re-cut or split.
Consume the canonical checklist from `skills/phase-contract/SKILL.md`; record
each implementation phase's result on its own line below as
`Phase-lint: PASS (8/8) · fingerprint P<idx>:docs:<count>:<Title-deliverable>`
(a BLOCKED line names the first failing box).

Phase-lint results at drafting time:

```text
P1 Evidence-provenance checklist ............ PASS (8/8) · fingerprint P1:docs:6:Evidence-provenance checklist
P2 Cross-audit delta reporting .............. PASS (8/8) · fingerprint P2:docs:6:Cross-audit delta reporting
P3 Audit-evidence golden-fixture scenario ... PASS (8/8) · fingerprint P3:docs:4:Audit-evidence golden-fixture scenario
P4 Version bump bilingual sync .............. PASS (8/8) · fingerprint P4:docs:2:Version bump bilingual sync
```

### P1 — Evidence-provenance checklist

Layer: `docs`. Target: `skills/product-audit/references/AUDIT_PROCESS.md`
(+1 pointer line in `SKILL.md`). Done-when:
`grep -c 'Fallback:' skills/product-audit/references/AUDIT_PROCESS.md` → ≥ 5
AND `node scripts/check-skill-context.mjs --skill product-audit` → exit 0.

- [ ] Insert the `Evidence-provenance gate (fixed):` block directly under
      step 2 carrying the intro sentence binding it to every
      evidence-collecting sweep step, plus the `- Forge state —` item stating
      live forge authority (issue/PR status from the project-declared forge
      CLI/API) and drift-not-ledger treatment of fix-index/worklist/roadmap
      rows, ending `Fallback: mark unverified`.
- [ ] Add the `- Command-derived metrics —` item: exact command + working
      directory or target + supporting output line or structured field bound
      per metric; an aggregate terminal summary cannot back a narrower-scope
      claim — `Fallback: rerun in scope`.
- [ ] Add the `- Repository inventories —` item: ordered/inventory claims
      recomputed from the current tree with project-compatible tools citing
      the terminal path/item; no hardcoded products, runtimes, package
      managers, forge hosts, or non-portable recipes — `Fallback:
      rerun in scope`.
- [ ] Add the `- Freshness/timestamps —` item recording capture time/method
      and requiring recompute before reuse of stale captures — `Fallback:
      mark unverified`.
- [ ] Add the `- Conflicting sources —` item fixing the resolution order
      (live forge > scope-bound command output > repository inventory >
      worklist index) with the winner recorded beside the claim — `Fallback:
      mark unverified`.
- [ ] Append the ≤2-line Guardrails pointer in `SKILL.md` binding findings to
      the fixed evidence-provenance checklist (uncertainties stay *verify*).

### P2 — Cross-audit delta reporting

Layer: `docs`. Targets: `skills/product-audit/SKILL.md` (output format +
Guardrails), `references/AUDIT_PROCESS.md` (steps). Done-when:
`grep -n '## Delta vs audit <prior-id>' skills/product-audit/SKILL.md` → 1
match AND `grep -n 'equivalent scope' skills/product-audit/references/AUDIT_PROCESS.md`
→ ≥ 2 matches AND context script exit 0.

- [ ] Add the fixed `## Delta vs audit <prior-id>` section to the SKILL.md
      output-format block between Findings and Proposals, carrying `New` /
      `Unchanged` / `Resolved` subsections, mapping entries with
      `F<k> <- audit <prior-id> F<j>`, and the empty case line
      `none — <why no equivalent-scope prior exists>` as the section body.
- [ ] Renumber existing AUDIT_PROCESS.md steps 8 (Persist) → 9 and 9 (Report)
      → 10, text otherwise unchanged.
- [ ] Insert new step 8 (`Delta vs prior equivalent-scope audit`):
      independently synthesize first, then load the newest previous audit
      with an equivalent scope, fill the delta section including explicit
      mappings, and define the absent-prior case explicitly.
- [ ] Add the same-date/equivalent-scope rerun rule inside step 8: permitted
      with a stated reason plus the required delta — never blocked by date
      alone.
- [ ] Amend the persist step wording so the persisted report includes the
      delta section alongside the fixed format.
- [ ] Extend the SKILL.md Guardrails F-ID bullet: lineage expressed only via
      delta mappings using `<audit-id> F<k>`, never global slugs or replaced
      IDs.

### P3 — Audit-evidence golden-fixture scenario

Layer: `docs`. Targets: `docs/workflow/GOLDEN_FIXTURE.md` +
`docs/workflow/GOLDEN_FIXTURE.es.md`. Done-when:
`grep -c 'T1 wrong-scope aggregate tail' docs/workflow/GOLDEN_FIXTURE.md
docs/workflow/GOLDEN_FIXTURE.es.md` → ≥ 1 match per file AND context script
exit 0.

- [ ] Add the `Audit-evidence provenance fixture` section part 1: toy repo
      definition exposing `T1 wrong-scope aggregate tail` (root verification
      gate ends with a root-suite summary owning the visible totals) and
      `T2 stale worklist vs forge state` (persisted fix-index row lagging the
      project's declared forge state).
- [ ] Add part 2: `T3 newer terminal inventory item` (ordered records file
      whose terminal entry outruns every reference elsewhere) and `T4 prior
      equivalent-scope finding` (stored earlier audit containing one
      addressable `<prior-id> F<j>` finding).
- [ ] Add the expected-report contract subsection: reject/mend all four traps
      (mark unverified on the unattributed tail, prefer live forge state over
      the stale row, cite the actual terminal item) and emit the Delta section
      mapped onto `<prior-id> F<j>`, with a stated reason required for a
      same-date rerun.
- [ ] Mirror the full scenario into GOLDEN_FIXTURE.es.md keeping trap labels
      T1–T4 verbatim (bilingual EN+ES pair updated in the same commit).

### P4 — Version bump bilingual sync

Layer: `docs`. Targets: bump-owned surfaces (`SKILL.md` frontmatter,
CHANGELOG.md/.es.md, README tables). Done-when:
`grep '^version:' skills/product-audit/SKILL.md` → `version: 3.1.0` AND
`grep -l '3\.1\.0' CHANGELOG.md CHANGELOG.es.md` lists both files AND
context script exits 0 AND `npx skills add . --list` includes `product-audit`.

- [ ] Run bump-skill for product-audit: minor bump `3.0.3` → `3.1.0`
      (backward-compatible capability addition), producing the frontmatter
      version, CHANGELOG.md row, CHANGELOG.es.md row, and README.md /
      README.es.md table updates.
- [ ] Verify both language pairs agree (same version string and content-equ
      ivalent changelog rows in EN + ES; README EN + ES tables consistent)
      and the full gate stays green (`node scripts/check-skill-context.mjs`,
      `npx skills add . --list`).

### P5 — Hardening & PR

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #147`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #147` and push

## Testing

No application build exists here — verification is the markdown discipline
itself (repo Verification section in CLAUDE.md):

- **Architecture/integration:** `node scripts/check-skill-context.mjs` proves
  the edited skill + reference still fit their budgets; regression risk is
  blowing the 240-line SKILL.md cap or the 280-line reference cap while
  adding the gate and delta sections — checked at every phase's done-when.
- **Contract tests:** the AC validator greps above (commands, exit-status
  expectations) act as presence tests for every frozen anchor; several are
  also absence tests (non-portable tokens must stay out of
  `skills/product-audit/`).
- **Regression test for the original defect:** the P3 fixture scenario is the
  executable expectation — running the changed skill against those four traps
  with a weak model must reject/mend each trap and emit the delta; recorded
  manually in the fixture log during Hardening (manual observation, cannot be
  automated without a model harness).

## Rollback

Single PR revert against `main` restores all touched text
(`git revert <merge-commit>`); no data migration, no external state, nothing
preserved to lose beyond the reverted prose itself. A partially executed
local branch (`docs(fix): …` commits) is discarded with
`git branch -D fix/147-audit-evidence-provenance`.

## Impact

- Layers touched: docs-layer workflow contracts only —
  `skills/product-audit/SKILL.md`,
  `skills/product-audit/references/AUDIT_PROCESS.md`,
  `docs/workflow/GOLDEN_FIXTURE.md(.es.md)`, CHANGELOG/README tables.
- Blast radius: every target-project `product-audit` run gets stricter
  evidence rules (audits take longer; false-confidence findings drop). Weak
  models get mechanical templates instead of judgment calls, improving
  conformance (that is the point of the fixture).
- Detection lead time: immediate — any drift from the contract fails the
  phase grep gates at execution, and misformatted audits self-announce via
  the turn-contract box list.

## Rules that must never be violated

- Stack/architecture agnostic language everywhere (CLAUDE.md "Working
  rules"): no `webs`, Bun, POSIX-only pipelines, GitHub-specific commands, or
  product paths inside the portable contract texts.
- Docs/artifacts in English; conversation replies follow the user.
- Bilingual EN+ES human docs move together (CLAUDE.md hard rule): fixture edit
  lands in both languages same change; CHANGELOG/README pairs likewise via
  bump-skill.
- Skill changes version every change (CLAUDE.md): minor bump + changelog rows,
  applied before merge, never skipped.
- Context budgets enforce themselves fail-closed (`scripts/check-skill-context.mjs`);
  a FAIL blocks merge regardless of content quality.
- Finding identity remains `F1..Fn` / `<audit-id> F<k>` (#147 Expected
  behaviour ¶5); delta mappings never mint alternative identifier schemes.
- One PR per unit against `main`; never stack on other open PRs.

## Operational risks

None — no jobs, queues, caches, schemas, or external adapters. The only
"runtime" is agent executions of `product-audit` inside downstream projects;
stricter gates lengthen those runs slightly (accepted, purposeful).

## Security risks

n/a — no auth, secrets, PII, webhooks, or limits touched. (Stricter evidence
provenance indirectly reduces risk of confident-but-false security claims in
published audits.)

## Compliance touchpoints

n/a

## Affected docs

Each becomes an acceptance criterion or bump-skill surface:

- `skills/product-audit/SKILL.md` — guardrails pointer, Delta output section,
  ID-contract wording → AC5, AC7, AC8.
- `skills/product-audit/references/AUDIT_PROCESS.md` — provenance gate block,
  step 8 delta compare, renames/reorders → AC1–AC4, AC6.
- `docs/workflow/GOLDEN_FIXTURE.md` + `.es.md` — new fixture scenario → AC9.
- `CHANGELOG.md`, `CHANGELOG.es.md`, `README.md`, `README.es.md` —
  bump-skill-driven → AC10.

## Observability

This repo ships contracts, not services; health signals are the standing
gates: `node scripts/check-skill-context.mjs` (blocks merge on failure) and
`npx skills add . --list` (discovery integrity). Downstream, the observable
contract IS the persisted audit: every future audit report carries the
`Delta vs audit <prior-id>` section — an audit missing it is detectably
nonconforming; that presence-check doubles as the silent-failure alarm.

## Cross-issue notes

| Ref | Relationship | Decision |
|---|---|---|
| PR #145 (`feat/26-staged-verification-contracts`) | parallel, unrelated surface (schema package/tests) | proceed; base stays `main`, merge order irrelevant |
| #139 staged verification contracts | parallel feature (same surface as PR #145) | unaffected; no shared files |
| #146 portable pre-execution review receipts | parallel feature (planning receipts) | unaffected; absorb overlaps later in its own unit if any emerge |
| webs #395 / #398 (consumer side) | external evidence trail only | no action here |

## Effort

S — localized additive prose across 2 skill files + 1 fixture pair + bump
surfaces; every phase gated by cheap greps; well under a day, single
reviewable fix PR (executor may checkpoint commits per phase).

## Decisions made during drafting

- The provenance gate lives **inside** `AUDIT_PROCESS.md` rather than as a
  third progressive-loading reference — keeps the skill's two-path allowlist
  and budgets stable, and adds no hop for weak models. (Alternative rejected:
  new `references/EVIDENCE_PROVENANCE.md` would force allowlist/budget churn.)
- Fallback assignment is fixed per domain (metrics/inventories default
  `rerun in scope`; forge/freshness/conflicts default `mark unverified`) so
  executors never choose mid-flight.
- Step insertion point frozen: new compare step becomes step 8 (before
  Persist); downstream steps renumber — chosen over appending after Report so
  comparison provably precedes persistence.
- Fixture placement: separate appended section after the CSV fixture (the
  existing toy feature stays untouched; its audience is executor-path skills,
  ours is an audit-path skill).
- Version target pinned to `3.1.0` at plan time; bump-skill executes it
  mechanically (avoids an execution-time version decision).

## Status

`pending` · `in-progress` · `done` (built, PR open — merge state lives in the forge)

(Removed from `docs/fix/README.md` only **after** the PR merges.)
