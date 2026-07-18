# fix/76-adversarial-weak-fleet-usability

## Goal

`review-change --adversarial N` is documented but **not executable** by the
audience it most benefits: hand-orchestrated weak-model fleets (the NaN
reference stack). The mode's recommendation trigger keys only on the change
(`L`/sensitive) and never on the *model* condition; there is no N ladder, no
reviewer roles, and the tier-3 manual fallback quotes neither a reviewer prompt
nor any merge contract — so a manual orchestrator gets the weak-model failure
mode (re-litigated findings, silently dropped rows) by default. This fix makes
the mode a self-contained, paste-able contract: a recommendation checklist that
fires on the model condition, a fixed N ladder, index-assigned reviewer roles, a
`--merge` fusion mode with a forbidden-drop list, single-sourced reviewer/merge
contracts surfaced as Portability paste blocks, a stated once-per-unit cadence
anchor, and a NaN ladder row that names the free family-diversity the fleet
already has. It is doc/contract work with no code dependency, so it cannot
usefully wait for a feature cycle.

## Issue

`#76` — GitHub issue. The PR must close it via `Closes #76` in the body.

## Branch

`fix/76-adversarial-weak-fleet-usability`

## Depends on

None. (`#64`'s atomicity lint already merged — #75. The cadence-anchor sentence
this fix adds deliberately abuts `#77`'s scope but does not depend on it: see
*Cross-issue notes*.)

## Root cause

The adversarial mode (added in an earlier `review-change` revision, spec at
`skills/review-change/SKILL.md` §"Adversarial multi-reviewer mode",
L223–272) was written for a strong-model, subagent-capable host and never
adapted to hand-orchestrated weak fleets:

- Recommendation fires only on `L`/sensitive
  (`skills/review-change/SKILL.md` L240–243) — never on "the reviewer is
  weaker than the author / not the strongest in the fleet".
- The only N guidance is `ship-roadmap`'s hard floor `N=2`
  (`skills/review-change/SKILL.md` L233).
- All N reviewers run the identical engine with the identical checklist and no
  roles (`skills/review-change/SKILL.md` L245–247, L261–272) — with one model
  family available, N identical reviewers correlate heavily.
- The tier-3 fallback says "N sequential fresh conversations"
  (`skills/review-change/SKILL.md` L257–259) with no quoted reviewer prompt,
  and the merge step exists only implicitly inside the orchestrator's own
  steps (`skills/review-change/SKILL.md` L261–272) — no paste-able merge
  contract.
- No README ladder row mentions the mode, though the NaN section already
  documents four model families (`README.md` L368–374 / `README.es.md`
  mirror) — the family-diverse review the mode wants is available and
  undocumented.

## Detected in

Design discussion 2026-07-17; filed as issue #76 and triaged **fix-now** the
same day (issue comment `#issuecomment-5003381906`) — a live capability gap for
the documented reference fleet, doc/contract work with no dependency.

## Scope

### In scope

All eight proposal items from issue #76, single-sourced:

1. **Recommendation checklist** in `skills/review-change/SKILL.md` — replaces
   the single `L`/sensitive criterion; recommend `--adversarial 2` if ANY of
   four boxes tick (`L` · sensitive surface · reviewing model not strongest /
   weaker than author · single family AND ≥ `M`). The model condition is a
   documented rule of thumb **surfaced as a report line — never
   auto-detection** (an agent cannot reliably introspect its own model).
2. **Fixed N ladder** — `N=2` default; `N=3` when security/auth surface OR all
   reviewers share one model family; `>3` explicitly discouraged (with the ≥1
   inclusion-threshold rationale).
3. **Fixed role set assigned by reviewer index** — R1 correctness/logic
   adversary · R2 security/inputs adversary · R3 SPEC-coverage adversary; plus
   the **role-is-attention-priority-NOT-exclusive-scope** guardrail stated as
   an explicit rule (the full checklist stays mandatory for every reviewer).
4. **Single-source reviewer & merge contracts** authored once in the mode
   section — the reviewer prompt (role + diff-only scope + "Return exactly:"
   table) and the merge contract (dedupe by `file:line`+axis → `Reviewers n/N`
   → steps 2–10 → `Decision: PASS | FAIL`, forbidden-drop list, ≥1 threshold
   restated inside the mode, provenance column for externally-produced tables).
5. **`--merge` mode** entry point that starts at the fusion step, consuming the
   merge contract; wired into Process step 1 + `argument-hint`.
6. **Portability paste blocks** — two quoted blocks (reviewer prompt, merge
   prompt) that reference the single-source contracts of item 4; the pro path
   invokes the flag, manual orchestrators paste the block.
7. **Cadence anchor** — adversarial runs **once per unit, at the mandatory
   terminal `review-change`** (pre-Hardening & PR), where the recommendation
   checklist is evaluated; explicit sensitive-phase early-pass exception; an
   explicit `#77` boundary note.
8. **`→ Next:` wiring** — the terminal `review-change` recommendation block
   gains the adversarial recommendation line (when the checklist fires);
   `execute-phase`'s **mandatory end-of-unit review hand-off** (not the
   every-2-phases checkpoint) mentions when to pass `--adversarial N`.
9. **NaN ladder row** in `README.md` **and** `README.es.md` (same change —
   bilingual-sync rule): reviewers never weaker than the author; worked example
   Qwen3.6-authored → `--adversarial 2` with Mimo V2.5 + DeepSeek V4 Flash
   (high); merge/orchestration per the Planning/routing ladder.
10. **`bump-skill`** — version bump (minor: backward-compatible capability) for
    `review-change`, patch for `execute-phase`; CHANGELOG EN+ES rows; README
    skill-table sync.

### Out of scope

- **General review-checkpoint cadence** (the every-2-phases → layer/accumulation/
  sensitivity trigger redesign) → `#77`. This fix owns **where** adversarial
  runs (the terminal review); `#77` owns the general checkpoint cadence. Neither
  PR edits the other's sentences (`execute-phase` L348 stays `#77`'s; this fix
  touches only the mandatory-review hand-off at L402/L425/L530).
- **Envelope / `workflow-status` exposure** of any new adversarial signal →
  deferred to `#79` (workflow-status new-signals issue), never smuggled here.
  No change to `skills/orchestration-envelope/SKILL.md` or the npm schema
  package.
- **Normalizing free-prose external reviews** — `--merge` accepts externally
  produced reviews **only if already in the fixed table format** (provenance
  column); converting free prose is the contributing conversation's job, not
  the merge step's.
- Auto-detection of the running model — explicitly rejected; the model
  condition is a surfaced rule of thumb only.

## Acceptance

- [ ] All eight proposal items implemented in `skills/review-change/SKILL.md`,
      plus the ladder row in `README.md` and `README.es.md` (same change).
- [ ] The recommendation checklist replaces the L/sensitive-only criterion:
      `grep -n "not the strongest" skills/review-change/SKILL.md` returns the
      model-condition box, and the block states "report line / never
      auto-detection".
- [ ] The fixed N ladder is present: `N=2` default, `N=3` conditions
      (security/auth OR single family), `>3` discouraged with the ≥1-threshold
      rationale — all as checkable statements.
- [ ] The fixed role set (R1/R2/R3, index-assigned) is present AND the
      role-is-attention-priority-not-exclusive-scope guardrail is stated
      verbatim-equivalent, naming the role-narrowed-reviewer failure mode.
- [ ] The reviewer contract and the merge contract each exist **once**,
      referenced by both the `--merge` mode and the Portability templates
      (single source of truth — the two Portability blocks point at the mode's
      contracts, not a second copy).
- [ ] `--merge` mode is documented and wired into Process step 1 +
      `argument-hint`; it starts at the fusion step and produces the fixed
      report ending `Decision: PASS | FAIL`.
- [ ] `--merge` never drops a finding: the forbidden list (no dropping,
      downgrading, reclassifying, re-litigating) is present and the ≥1
      inclusion threshold is restated **inside** the mode.
- [ ] The cadence anchor is stated (once per unit at the terminal
      `review-change`; sensitive-phase early-pass exception) with an explicit
      `#77` boundary note.
- [ ] The terminal `review-change` `→ Next:` recommendation block gains the
      adversarial recommendation line (fires when the checklist fires);
      `execute-phase`'s mandatory end-of-unit review hand-off mentions when to
      pass `--adversarial N`, and the every-2-phases checkpoint sentence
      (`skills/execute-phase/SKILL.md` L348) is **unchanged**.
- [ ] `README.md` and `README.es.md` each carry the NaN adversarial ladder row
      with the Qwen3.6 → Mimo V2.5 + DeepSeek V4 Flash (high) worked example;
      the two are faithful siblings (bilingual-sync rule).
- [ ] Updated `docs/fix/README.md` fix-index row for this fix.
- [ ] GOLDEN_FIXTURE smoke: `docs/workflow/GOLDEN_FIXTURE.md` run with the
      weakest fleet model against the new `--merge` mode and the reviewer
      template — no misread.
- [ ] `bump-skill` run: `review-change` `version:` bumped (minor),
      `execute-phase` bumped (patch); CHANGELOG.md + CHANGELOG.es.md rows;
      README + README.es.md skill/version tables synced.
- [ ] No envelope/`workflow-status`/npm-schema change (deferred to `#79`);
      `git diff --name-only main..HEAD` touches none of
      `skills/orchestration-envelope/`, `skills/workflow-status/`,
      `packages/`.
- [ ] All committed artifacts in English (SKILL.md/SPEC/commits/PR); README
      ES sibling updated.

## Phases

Execution ledger — `execute-phase --fix` runs **one phase per invocation** and
ticks tasks here. All implementation phases are the `docs` layer (this fix is
entirely Markdown skill-contract and README prose).

### Phase-lint (authoritative copy — keep in sync with
`docs/features/_TEMPLATE/SPEC.md` `### Phases`)

Every implementation phase below must pass all 8 boxes before it is emitted
(planner skills) or executed (`execute-phase` pre-flight). Fail-closed: any
unticked box blocks emission/execution until the phase is re-cut or split.

- [ ] Title names ONE deliverable — FAIL if it joins nouns with `+`, `,`,
      `&`, `and`/`y`, or `/`.
- [ ] One declared layer — each phase declares exactly one of the fixed enum
      `schema/db | domain | api | ui | config/infra | docs | hardening |
      close-out`; FAIL if any task's target file belongs to another. Tests
      for the phase's own layer belong to the phase; a test-only phase
      declares `hardening`.
- [ ] ≤ 8 tasks (close-out phase: ≤ 10, only the literal close-out chain).
- [ ] One checkbox = one deliverable — FAIL if a task contains a `→` chain
      of implementation steps, enumerates > 3 cases/scenarios, or creates
      > 1 file of distinct concerns.
- [ ] Zero decision words — FAIL on `Decide`, `choose`, `OR` between
      alternatives, `If … then <change scope>`.
- [ ] No conditional scope mutation — a task may not move work between
      phases at runtime.
- [ ] No external/manual gates inside implementation phases —
      human/out-of-repo verifications live in the hardening/close-out phase,
      marked `manual`.
- [ ] Machine-checkable done-when — every phase ends with one verifiable
      invariant (a command + expected outcome).

### P1 — Adversarial-mode reviewer-selection rules

Layer: `docs`. Target: `skills/review-change/SKILL.md` (the "Adversarial
multi-reviewer mode" section). Done-when:
`grep -n "not the strongest" skills/review-change/SKILL.md` → returns the
model-condition line.

- [x] Replace the single `L`/sensitive criterion (L240–243) with the four-box
      recommendation checklist defined in Scope item 1 (recommend
      `--adversarial 2` if ANY box ticks). — `skills/review-change/SKILL.md`
      "Recommendation checklist" block.
- [x] State the model condition as a surfaced **report line, never
      auto-detection** (an agent cannot reliably introspect its own model). —
      same block, "surfaced as a report line only — never auto-detection".
- [x] Add the fixed N ladder: `N=2` default (the `ship-roadmap` floor); `N=3`
      when security/auth surface OR all reviewers share one model family; `>3`
      explicitly discouraged, with the ≥1-inclusion-threshold rationale (extra
      reviewers add dedupe, not findings). — `skills/review-change/SKILL.md`
      "N ladder (fixed)" block.
- [x] Add the fixed role set assigned by reviewer index (reviewer *i* → role
      *i*): R1 correctness/logic adversary · R2 security/inputs adversary · R3
      SPEC-coverage adversary ("find what the SPEC promises the diff does not
      do"). — `skills/review-change/SKILL.md` "Reviewer roles (fixed, assigned
      by index)" block.
- [x] State the role-is-attention-priority-**NOT**-exclusive-scope guardrail
      verbatim-equivalent: the full checklist stays mandatory for every
      reviewer; the role only orders where it bites first; name the known
      failure mode (a role-narrowed reviewer skipping an obvious off-role
      defect). — `skills/review-change/SKILL.md` "A role is an attention
      priority, NOT an exclusive scope." paragraph.

### P2 — Single-source adversarial review contracts

Layer: `docs`. Target: `skills/review-change/SKILL.md` (author the two
canonical contract blocks once in the mode section). Done-when:
`grep -c "Return exactly" skills/review-change/SKILL.md` → the two contract
blocks are present.

- [x] Author the **reviewer contract** once: a "Return exactly:" block giving
      role (by index) + diff-only scope + the fixed findings-table output the
      reviewer must return. — "Reviewer contract (single source)" block.
- [x] Author the **merge contract** once: dedupe by `file:line`+axis →
      `Reviewers n/N` column → steps 2–10 → fixed report ending
      `Decision: PASS | FAIL`. — "Merge contract (single source)" block.
- [x] State the merge contract's forbidden list as prohibitions: never drop,
      downgrade, reclassify, or re-litigate any finding. — same block,
      "Forbidden — never" bullet.
- [x] Restate the **≥1 inclusion threshold inside the merge contract** (a
      finding any single reviewer raised enters classification normally). —
      "Inclusion threshold = ≥1 reviewer" bullet, restated in the same block.
- [x] Add a `provenance` column note: externally-produced reviews are accepted
      **only if already in the fixed table format**. — "Externally-produced
      reviews" bullet.

### P3 — `--merge` fusion mode

Layer: `docs`. Target: `skills/review-change/SKILL.md` + line 5
`argument-hint`. Done-when:
`grep -n "\-\-merge" skills/review-change/SKILL.md` → returns the mode entry
and the argument-hint.

- [x] Add the `--merge` mode: it starts at the fusion step, accepts N pasted
      findings tables (fixed format), and runs the merge contract (P2) to the
      fixed report ending `Decision: PASS | FAIL`. — "`--merge` mode." block.
- [x] Reference the P2 merge contract from the `--merge` mode (single source —
      no second copy of the dedupe/threshold/forbidden rules). — same block,
      "the mode consumes the single merge contract above, never a second
      copy of it".
- [x] Wire `--merge` into Process step 1 (the findings-engine branch) alongside
      the existing no-flag and `--adversarial N` branches. — Process step 1
      rewritten with the `--merge` branch.
- [x] Add `--merge` to the `argument-hint:` frontmatter (line 5). — done.

### P4 — Portability manual-orchestration templates

Layer: `docs`. Target: `skills/review-change/SKILL.md` (Portability section).
Done-when: `grep -n "Portability" skills/review-change/SKILL.md` and the two
paste blocks are present below it.

- [x] Add the **reviewer-prompt** paste block (role + diff scope + "Return
      exactly:" table), referencing the P2 reviewer contract as its source. —
      "Reviewer-prompt paste block" under Portability.
- [x] Add the **merge-prompt** paste block (the textual form of the P2 merge
      contract), referencing the P2 merge contract as its source. —
      "Merge-prompt paste block" under Portability.
- [x] State the one-source-two-wrappers rule: pro invokes the flag, manual
      orchestrators paste the block — both render the same contract. — "One
      source, two wrappers" sentence.

### P5 — Adversarial cadence anchor

Layer: `docs`. Target: `skills/review-change/SKILL.md` (mode section /
"When to use"). Done-when:
`grep -n "once per unit" skills/review-change/SKILL.md` → returns the cadence
statement.

- [x] State that the adversarial run happens **once per unit, at the mandatory
      terminal `review-change`** (pre-Hardening & PR), where the recommendation
      checklist is evaluated. — "Cadence — once per unit." paragraph.
- [x] State the explicit sensitive-phase exception (not a cadence): a sensitive
      phase may earn an early adversarial pass scoped to that phase's diff. —
      same paragraph, "one stated exception" sentence.
- [x] Add the explicit `#77` boundary note: this issue owns **where**
      adversarial runs; `#77` owns the general checkpoint cadence — neither edits
      the other's sentences. — "Boundary with `#77`" sentence.

### P6 — Adversarial `→ Next:` wiring

Layer: `docs`. Targets: `skills/review-change/SKILL.md` (step 11 terminal
recommendation blocks) + `skills/execute-phase/SKILL.md` (mandatory
end-of-unit review hand-off). Done-when:
`grep -n "adversarial" skills/execute-phase/SKILL.md` → returns the hand-off
line, and `git diff main -- skills/execute-phase/SKILL.md` shows L348 unchanged.

- [x] Add the adversarial recommendation line to `review-change` step 11's
      terminal `→ Next:` block(s), firing exactly when the P1 checklist fires
      (naming which box), as its own literal line. — new `·` sub-bullet added
      to both the `Decision: FAIL` and `Decision: PASS` blocks.
- [x] Add to `execute-phase`'s **mandatory end-of-unit review hand-off**
      (L402/L425/L530 area) a note on when to pass `--adversarial N`, leaving
      the every-2-phases checkpoint sentence (L348) untouched. — new
      "Adversarial pass at that mandatory end review." paragraph in *Review
      checkpoint & finishing a unit*; the every-2-phases sentence (step 7) is
      byte-for-byte unchanged (verified via `git diff`).

### P7 — NaN adversarial ladder row

Layer: `docs`. Targets: `README.md` + `README.es.md` (NaN "Running on
NaN.builders" section). Done-when:
`grep -c "adversarial" README.md README.es.md` → each side carries the new row.

- [x] Add to `README.md` the adversarial ladder row/note: reviewers never
      weaker than the author; worked example Qwen3.6-authored → `--adversarial
      2` with Mimo V2.5 + DeepSeek V4 Flash (high); merge/orchestration per the
      Planning/routing ladder (Qwen3.6 thinking ON is compliant). — new
      "Adversarial review" row + rationale paragraph in the NaN ladder table.
- [x] Mirror the row faithfully in `README.es.md` (bilingual-sync rule — same
      change). — "Revisión adversarial" row + rationale paragraph, faithful
      translation, same commit.

### P8 — Version bump (bump-skill)

Layer: `docs`. Target: run `bump-skill` for the edited skills. Done-when:
`grep -n "^version:" skills/review-change/SKILL.md` → shows the bumped minor,
and CHANGELOG rows exist.

- [x] Run `bump-skill` for `review-change` (minor — backward-compatible new
      `--merge` capability + recommendation/role/ladder additions). —
      2.3.0 → 2.4.0.
- [x] Run `bump-skill` for `execute-phase` (patch — hand-off wording only). —
      2.5.1 → 2.5.2.
- [x] Confirm CHANGELOG.md + CHANGELOG.es.md rows added and README +
      README.es.md skill/version tables synced by `bump-skill`. — both
      changelogs' per-skill tables + release logs updated; both README skills
      tables' `review-change` row updated to mention `--merge` and the new
      recommendation conditions.

### P9 — Hardening & PR

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] GOLDEN_FIXTURE smoke (`manual`): run `docs/workflow/GOLDEN_FIXTURE.md`
      with the weakest fleet model against the new `--merge` mode and the
      reviewer template; confirm no misread
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #76`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #76` and push

## Testing

No executable test surface — this fix is Markdown skill-contract and README
prose. Verification is:

- **Grep invariants** — the acceptance checkboxes above are each a `grep`/`git
  diff` assertion over the edited files (checklist anchors, `--merge`, role
  guardrail, forbidden list, `#77` boundary note, unchanged L348, ES sibling).
- **GOLDEN_FIXTURE smoke** (`docs/workflow/GOLDEN_FIXTURE.md`) — the
  executor-path acceptance for a `review-*` skill: drive the toy fixture
  through the new `--merge` mode and the reviewer template with the **weakest**
  fleet model, confirming a weak model does not misread the new contract
  (re-litigating findings / dropping rows is the failure the fix exists to
  prevent).
- **`npx skills add . --list`** still discovers every skill (no frontmatter
  breakage from the `argument-hint`/`version` edits).

## Rollback

Single revert: `git revert <merge-commit>` (or close the PR unmerged). No
data-side cleanup — the change is documentation only; no schema, cache,
migration, or runtime state is touched. Reverting restores the prior
`review-change`/`execute-phase` `version:` and the pre-existing (strong-model)
adversarial-mode wording; nothing downstream persists state from these docs.

## Impact

- **Layers touched:** `docs` only — `skills/review-change/SKILL.md`,
  `skills/execute-phase/SKILL.md` (one hand-off line), `README.md`,
  `README.es.md`, `CHANGELOG.md`, `CHANGELOG.es.md`, `docs/fix/README.md`.
- **Modules/files:** no runtime code; no package under `packages/`.
- **Blast radius:** dev-only — changes how agents are *instructed* to run
  adversarial review; a wording error degrades review quality, it cannot
  corrupt data or regress a running system.
- **Detection lead time:** immediate — the GOLDEN_FIXTURE smoke and the grep
  invariants catch a bad edit before merge; downstream, a misread surfaces as a
  poorly-run review at the next `audit-pr` gate.

## Rules that must never be violated

- **Docs-language rule** — every committed artifact is English; `SKILL.md`,
  SPEC, commits, PR stay English-only (no ES sibling); the README ES sibling is
  updated in the **same** change (bilingual-sync hard rule, CLAUDE.md).
- **Stack/architecture agnostic** — no product/stack/framework reference leaks
  into the skills or shared docs; the NaN ladder row lives in the README's
  existing NaN section, not in the skill body.
- **Phases are `P1, P2, …`** — never `S1`/"Step N" in any emitted artifact.
- **Self-contained reviews** — the adversarial mode must not come to depend on
  any external/third-party skill; the reviewer engine stays
  `review-implementation` (the workflow's own pack).
- **Every user-facing skill keeps its `## Portability` section and closing
  `→ Next:` block** — the edits extend them, never remove them.
- **Hand off, don't compose across a model/effort boundary** — the fix does not
  make `review-change` compose a higher-tier skill in-turn; it only edits prose.

## Operational risks

None — no scheduled job, queue, cache, schema, or external adapter is touched.
The only "concurrency" note is pre-existing and unchanged: the NaN section's
≤5-concurrent cap on review fan-out already bounds any `--adversarial N`
subagent spawn.

## Security risks

None introduced. The recommendation checklist *adds* a security/auth-surface
trigger (item 1) and the R2 role is a security/inputs adversary — the fix
strengthens, not weakens, the review of sensitive changes. No secret, auth
path, webhook, or rate-limit is touched.

## Compliance touchpoints

n/a — documentation-only change to an open-source workflow repo; no data
retention, regional, or consumer-protection rule applies.

## Affected docs

- `skills/review-change/SKILL.md` — the mode rewrite (items 1–8) — acceptance
  criteria above.
- `skills/execute-phase/SKILL.md` — one hand-off line (item 8).
- `README.md` + `README.es.md` — NaN adversarial ladder row (item 9) +
  `bump-skill` skill/version-table sync.
- `CHANGELOG.md` + `CHANGELOG.es.md` — `bump-skill` rows (item 10).
- `docs/fix/README.md` — this fix's index row.

## Observability

n/a for a docs change — there is no prod log line or metric. The proxy signal
that the fix is "live and healthy" is the GOLDEN_FIXTURE smoke passing on the
weakest fleet model and the next real adversarial review producing a merged
table with a `Reviewers n/N` column and no dropped rows.

## Cross-issue notes

- **`#77`** (review-checkpoint cadence redesign) — **open, not yet planned.**
  Intentional scope abutment: this fix owns **where** adversarial runs (item 7,
  the terminal-review anchor); `#77` owns the general every-2-phases → trigger
  redesign. Boundary kept explicit in both directions: this fix touches only
  `execute-phase`'s mandatory-review hand-off (L402/L425/L530) and leaves the
  every-2-phases checkpoint sentence (L348) untouched; `#77`'s triage note
  records the reciprocal boundary. Parallel, not blocking.
- **`#79`** (workflow-status new-signals) — **open, postponed.** Any envelope
  exposure of an adversarial signal is deferred there; this fix touches no
  envelope/schema/npm artifact (explicit acceptance box).
- **`#72`** (fold-findings absent from the NaN ladder) — parallel, unrelated;
  both edit the README NaN ladder but different rows. No conflict expected; if
  both are in flight, the second to merge rebases the ladder table.

## Effort

**M** (multi-commit, ≤ 1 day). Eight proposal items plus bilingual README sync,
a `bump-skill` pass, and a GOLDEN_FIXTURE smoke — all doc/contract work, but the
single-sourcing (item 4 referenced by items 5 and the `--merge` mode) and the
`#77` boundary discipline make it more than an XS/S edit.

## Decisions made during drafting

- **Eight implementation phases + Hardening & PR**, each the `docs` layer and
  each a single deliverable, to satisfy the 8-box phase-lint (recommendation
  checklist, contracts, `--merge`, Portability blocks, cadence, `→ Next:`
  wiring, README rows, `bump-skill` are distinct deliverables that a weak
  executor must not conflate). The implementer may merge adjacent phases only
  if each still passes all 8 lint boxes.
- **`execute-phase` bumped patch, `review-change` minor** — the `execute-phase`
  change is a one-line hand-off note (wording); the `review-change` change adds
  a backward-compatible `--merge` capability (minor). `bump-skill` is the
  authority; re-question if it computes otherwise.
- **The reviewer + merge contracts are single-sourced in the mode section**,
  with the `--merge` mode and both Portability blocks referencing them — chosen
  over duplicating the contract text, per the acceptance "exist once" criterion.
- **`docs` chosen as the layer for every phase** — this repo's product is
  Markdown skill contracts; the fixed layer enum has no "skill" member and
  `docs` is the honest mapping for `SKILL.md`/README/CHANGELOG edits.

## Status

`pending`
