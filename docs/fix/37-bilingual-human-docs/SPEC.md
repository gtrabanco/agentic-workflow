# fix/37-bilingual-human-docs

> Fix specification. Source of truth for this fix; its `## Phases` section
> is the execution ledger run by `execute-phase --fix` (one phase per
> invocation).

## Goal

Extend the repo's bilingual "front door" (today only `README` and
`CHANGELOG` have EN/ES siblings) to **every human-readable documentation
file**: the full `docs/workflow/*.md` tutorial + reference set and the
`packages/agentic-workflow-schema/README.md` API reference. A
Spanish-speaking reader learning the workflow — or authoring a driver
against the schema — currently has no `.es.md` counterpart for any of it.
This is an inconsistency in how far the bilingual pattern was applied, not
a breach of the "committed artifacts are English" rule: that rule governs
process artifacts (`SKILL.md`, SPECs, commits, PRs) that are
language-neutral across any project this pack installs into — not human
tutorial/reference prose explaining the repo to a reader. The fix also
records a lightweight go-forward convention so the pattern stays coherent.

**Folded in (owner decision, 2026-07-12):** the README's model-routing
recommendation (`README.md` + `README.es.md`, the "Running on NaN.builders"
section + fallback ladder) is revised in the same fix. `GLM-5.2` is no
longer available on the basic plan — it stays in the docs but repositioned
as the **€200-plan** primary (practically unlimited there); for the
majority on the basic plan it is **not** the primary. The section is
restructured into quota-aware, 2–3-deep preference ladders per task with
per-model pros/cons. The owner chose to carry this in `#37` rather than a
separate issue/fix (see "Decisions made during drafting").

## Issue

`#37` — GitHub issue. The PR must close it via `Closes #37` in the body.

## Branch

`fix/37-bilingual-human-docs`

## Depends on

None open. Prerequisite already satisfied: `#44` (schema README full
field/state reference) is **closed** (2026-07-11) — the schema
`README.md` now carries the reference the owner's comment required to land
before translating it.

## Root cause

Not a defect in code — a **partial application** of a convention. When the
bilingual pattern was introduced, `README.md`/`README.es.md` and
`CHANGELOG.md`/`CHANGELOG.es.md` (the repo's "front door") got Spanish
siblings, but the deeper human-facing docs under `docs/workflow/` — the
tutorial a Spanish speaker actually needs — and the schema package's
driver-facing `README.md` never received the same treatment. There was no
recorded scope decision either way, so the gap persisted silently.

## Detected in

User conversation, 2026-07-11 — noticed while asking about
`docs/workflow/GOLDEN_FIXTURE.md`. Owner comment (2026-07-11) added
`packages/agentic-workflow-schema/README.md` to scope, to translate after
`#44` landed there. Conversation 2026-07-12: owner reported `GLM-5.2` left
the basic plan (returns on a forthcoming €200 plan) and folded the
model-routing recommendation revision into this fix.

## Scope

### In scope

Create a faithful Spanish `.es.md` sibling for every human-readable doc
below, add the reciprocal language-switcher link to each existing English
doc, and record the go-forward convention.

**`docs/workflow/` (11 files → 11 new `.es.md`):**

- `README.md` (index) · `FEATURE_WORKFLOW.md` · `ISSUE_WORKFLOW.md`
- `SKILLS.md` · `REVIEW_AND_CLASSIFY.md` · `RECOMMENDED_SKILLS.md` · `ORCHESTRATION.md`
- `REPLICATE.md` · `GOLDEN_FIXTURE.md` · `PORTABLE_PROMPT.md` · `MIGRATION.md`

**Schema package (1 file → 1 new `.es.md`):**

- `packages/agentic-workflow-schema/README.md` → `README.es.md`, and add
  `README.es.md` to the package's `files` array so it ships on npm.

**Per-file mechanics (uniform, no judgement):**

- The `.es.md` is a faithful, complete translation — same headings,
  tables, code blocks, and anchors; code, commands, identifiers, file
  paths, and skill names stay verbatim (untranslated).
- The `.es.md` gets a back-link under its H1: `> 🇬🇧 [English version](<name>.md)`.
- The English original gets a forward-link under its H1:
  `> 🇪🇸 [Versión en español](<name>.es.md)`.
- Internal relative links inside an `.es.md` point to the **`.es.md`
  sibling when it exists in this scope**; links to files not translated
  here (e.g. `model-routing.yml`, `SKILL.md` paths, `docs/features/`,
  `docs/fix/`) keep their existing English target.

**Convention (P6):** record in `CLAUDE.md` that human-readable docs carry
EN + ES siblings, kept in sync **on next touch** (no automated
bookkeeping), while `SKILL.md`, SPECs, commits, PRs, and machine config
stay English-only.

**Model-routing revision (P5) — `README.md` + `README.es.md`, the
"Running on NaN.builders" section + "If GLM-5.2 is down" fallback ladder.**
Same content change applied to EN, then mirrored into the ES sibling. The
new shape:

- **Two profiles, not one primary.** `GLM-5.2` stays listed but as the
  **€200-plan** primary (practically unlimited there; caps only bite very
  heavy use). On the basic plan it is **unavailable** → for most users it
  is not the primary.
- **Quota-aware routing rule.** Only `Mimo V2.5` and `DeepSeek V4 Flash`
  carry an explicit cap (500M tok/member/mo per the catalog); `Qwen3.6` /
  `Gemma4` show no listed cap (256K ctx). Reserve the capped 500M budgets
  for 1M-context work and merge-gating verdicts; push re-checkable and
  mechanical volume onto the uncapped models.
- **Preference ladders (2–3 deep) per task**, each entry with config
  (Thinking/effort) and a one-line pro/con:
  - *Merge gates* (`audit-pr`, `product-audit`): €200 → GLM-5.2 High/Max;
    basic → 1. Mimo V2.5 → 2. DeepSeek V4 Flash (floor) → else **defer to
    the human**. **Never** Qwen3.6/Gemma4 here.
  - *Planning/routing/triage* (`plan-feature`, `plan-fix`,
    `init-workspace`, `triage-issue`, `review-change`, `ship-roadmap`
    conductor — re-checked downstream): €200 → GLM-5.2; basic → 1. Qwen3.6
    (quota-saver) → 2. Mimo V2.5 → 3. DeepSeek V4 Flash.
  - *Execution/mechanical* (`execute-phase`, `audit-docs`, `bump-skill`,
    `workflow-status`): 1. Qwen3.6 → 2. Gemma4 → 3. DeepSeek V4 Flash.
  - *Cheap* (`log-session`, evidence): 1. DeepSeek V4 Flash → 2. Qwen3.6
    → 3. Gemma4.
  - *Folding `review-change`/`audit-pr` findings back into the branch*
    (`execute-phase`'s fold cycle): **routine/mechanical** findings (style,
    missing test stub, stale doc) → same as Execution/mechanical above
    (Qwen3.6 → Gemma4 → DeepSeek V4 Flash); **subtle** findings (logic,
    security, architecture — the kind a weak model wouldn't have caught in
    the first place) → bump to the tier that found them (Merge-gates or
    Planning/routing ladder, whichever review ran). Rule of thumb: the
    fixing model is never weaker than the one that wrote the original
    code, and never weaker than warranted by the finding's subtlety —
    otherwise the fix itself needs re-catching on re-review, wasting a
    cycle. Supersedes the current single-model "Alternates" line
    (`README.md`, subtle-logic bump) which only names GLM-5.2.
- **`Qwen3.6` reasoning caveat, stated explicitly:** acceptable only for
  **re-checked** reasoning; never a merge-gating verdict (3B active → a
  plausible-but-shallow audit is worse than none). On the basic plan, once
  Mimo + DeepSeek quota is spent, no strong reasoner remains → defer to
  human, wait for reset, or upgrade to the €200 plan.
- **Per-model pros/cons table** covering all five (GLM-5.2, Mimo V2.5,
  DeepSeek V4 Flash, Qwen3.6, Gemma4).
- **No unverified benchmark claims.** Model strength is framed by
  active-params + role, not invented leaderboard numbers; the existing
  "sanity-check against a current leaderboard" caveat stays.

### Out of scope

- `docs/workflow/model-routing.yml` — machine config, not human prose.
  Stays English-only. (Belongs to no other fix; simply excluded.)
- `skills/*/SKILL.md` — agent-facing contract, English-only by the CLAUDE.md
  rule. Explicitly excluded per the issue.
- `docs/features/**`, `docs/fix/**`, `.github/**` templates — process
  artifacts, not human tutorial prose. Out of scope; revisit only if a
  future issue requests it.
- **bump-skill-style enforcement tooling** for the new ES docs — the owner
  chose the lightweight "on next touch" convention. Automated staleness
  checking, if ever wanted, is a separate `plan-feature` item, not this fix.

## Acceptance

Each criterion is an independently-verifiable checkbox. Test layer noted
in brackets (this repo has no application build — see CLAUDE.md
"Verification"; "docs gate" = link resolution + `npx skills add . --list`
+ no stack/real-project leak).

- [ ] Every in-scope English doc has a sibling `.es.md` in the same
      directory (12 new files total). [file-existence]
- [ ] Every new `.es.md` opens (under its H1) with
      `> 🇬🇧 [English version](<name>.md)` and its English original opens
      with `> 🇪🇸 [Versión en español](<name>.es.md)`. [grep]
- [ ] Every relative link in every new `.es.md` resolves to a file that
      exists (ES sibling where in scope, else the EN target). [docs gate — link check]
- [ ] Each `.es.md` preserves the source's heading structure, tables, and
      fenced code blocks; all code/commands/identifiers/paths/skill-names
      are byte-identical to the English source. [manual review — translation fidelity]
- [ ] No stack/framework/real-project reference introduced by any
      translation (generic phrasing preserved). [docs gate — leak check]
- [ ] `packages/agentic-workflow-schema/package.json` `files` includes
      `README.es.md`, and `npm test` in that package passes. [package test]
- [ ] `CLAUDE.md` documents the EN+ES human-doc convention and its "on next
      touch" (no-tooling) sync policy. [file-content]
- [ ] `README.md` model-routing section is restructured: GLM-5.2 shown as
      the €200-plan option (not the basic-plan primary), quota-aware rule
      stated, per-task preference ladders (2–3 deep) with config + pro/con,
      the "never Qwen3.6 for merge gates / defer to human" rule, and a
      5-model pros/cons table. [file-content]
- [ ] `README.es.md` carries the **same** restructured section, a faithful
      translation of the revised `README.md` content (no divergence in the
      ladders, config values, or model names). [manual review — EN/ES parity]
- [ ] `docs/fix/README.md` row for this fix reaches `done`. [file-content]

**Manual verification required (why):** translation fidelity and Spanish
fluency cannot be asserted by an automated gate — a fluent reviewer must
spot-check that each `.es.md` says what the English says (no dropped
sections, no invented content, no mistranslated technical claims).

## Impact

- **Layers touched:** documentation only (`docs/workflow/`,
  `packages/agentic-workflow-schema/`, `README.md` + `README.es.md`) + repo
  guidance (`CLAUDE.md`) + one package-manifest field (`package.json`
  `files`). No skills, no schema, no runtime code.
- **Modules/files:** 12 new `.es.md`; 12 English docs edited (forward-link
  only); `README.md` + `README.es.md` (model-routing section rewritten —
  content, not a forward-link); `packages/agentic-workflow-schema/package.json`;
  `CLAUDE.md`; `docs/fix/README.md`.
- **Blast radius:** dev-/reader-facing only. Worst realistic failure is a
  broken relative link, a mistranslation, or a **stale/incorrect model
  recommendation** (a reader picks a model for a merge gate that the doc
  should have barred) — no data, no behavior, no security surface. A wrong
  `files` entry could omit `README.es.md` from the published package
  (caught by the acceptance check + `npm pack`).
- **Detection lead time:** immediate at review (link check + manual
  read); a stale/omitted translation surfaces only when a Spanish reader
  hits it — hence the recorded on-next-touch convention.

## Rules that must never be violated

- **English-only process artifacts hold.** `SKILL.md`, SPECs, commits, PR
  descriptions, and machine config remain English (CLAUDE.md "Working
  rules"). This fix translates *human docs*, never those.
- **Stack/architecture-agnostic.** No product/stack/framework/ORM/runtime/
  architecture reference may be introduced into the translated docs
  (CLAUDE.md "Working rules"). The model-routing revision stays inside
  `README.md`/`README.es.md`'s existing "Concrete picks / Running on
  NaN.builders" section — the doc's already-designated place for concrete,
  non-agnostic model recommendations — so it introduces no product
  reference into `skills/` or the shared workflow docs.
- **Schema mirror rule.** If `packages/agentic-workflow-schema/` is
  touched, `npm test` passes there; **any envelope-schema change** must be
  mirrored in types + `envelope.schema.json` + version bump, same PR. This
  fix touches only `README.es.md` + the `files` array — **no** schema
  change — so no mirror/bump is triggered, but `npm test` must still pass.
- **Phases labelled `P1, P2, …`**, never `S1`/"Step N" (CLAUDE.md).

## Operational risks

- **npm publish:** adding `README.es.md` to the `files` array means it
  ships on the next release. Republish is issue `#38` (PR
  [#48](https://github.com/gtrabanco/agentic-workflow/pull/48), status
  `done`); the Spanish schema README rides that publish naturally — no
  action needed here beyond the `files` entry. `prepublishOnly: npm test`
  still gates it.
- **Link rot going forward:** future renames of an English doc will orphan
  its `.es.md` link. Mitigated only by the recorded on-next-touch
  convention (deliberately no tooling — owner's choice).
- **No scheduled-job / queue / cache / external-adapter interaction.**

## Security risks

n/a — no auth, secrets, PII, webhooks, or rate-limits touched. Translated
prose introduces no executable content.

## Compliance touchpoints

n/a — no data-retention, regional, or consumer-protection rules apply to
in-repo documentation translation.

## Affected docs

Each is a first-class deliverable of this fix (already covered by
Acceptance), not a side update:

- All 11 `docs/workflow/*.md` (new `.es.md` + forward-link on the EN doc).
- `packages/agentic-workflow-schema/README.md` (new `.es.md` + `files`).
- `README.md` + `README.es.md` — model-routing section rewritten
  (GLM-5.2 → €200-plan; quota-aware per-task ladders; 5-model pros/cons),
  EN then mirrored to ES.
- `CLAUDE.md` — new bilingual human-doc convention (section under "Working
  rules").

## Observability

No production telemetry — docs. "Live and healthy" = the 12 `.es.md`
files exist, every relative link resolves (`docs gate`), and
`README.es.md` is present in `npm pack --dry-run` output for the schema
package. Degradation (a future EN edit not mirrored to ES) is silent by
design; the on-next-touch convention in `CLAUDE.md` is the only guard.

## Cross-issue notes

- **`#44`** (schema README reference) — **CLOSED**. Prerequisite for
  translating the schema README; satisfied. No action.
- **`#38`** (republish schema package, PR
  [#48](https://github.com/gtrabanco/agentic-workflow/pull/48), `done`) —
  parallel. The new `README.es.md` ships on that publish once added to
  `files`; does not block this fix and this fix does not block it.
- No open issue overlaps, absorbs, or is absorbed by this fix (`#37` is
  the only other open issue — this one).
- **Model-routing revision — no separate issue.** The GLM-5.2
  plan-availability change (basic → €200 plan) would normally be its own
  fix/issue (different files, editorial content vs. translation). The owner
  explicitly directed (2026-07-12) that it ride in `#37` with no new issue;
  the PR's `Closes #37` therefore also carries this documented,
  out-of-title change. Recorded here so the SPEC — not silent drift — is
  the source of truth.

## Effort

**L** (multi-commit, > 1 day-equivalent) — ~90 KB of prose across 12 files,
12 forward-link edits, a manifest change, a convention note, **plus** the
model-routing section rewrite in two files (the one genuinely editorial
piece).

The `plan-fix` guidance says an L item may be escalated to a feature via
`plan-feature` — **the user decides**; the owner has decided to keep it as
this phased fix (and to fold the model-routing change in). All but one
phase is mechanical translation; the single design-bearing piece
(model-routing, P5) is fully specified above (ladders, config, rules), so
no open design decision remains for the executor. The `## Phases` ledger
sequences everything into checkable multi-commit units, which is exactly
what `execute-phase --fix` runs.

## Phases

Execution ledger — `execute-phase --fix` runs **one phase per invocation**.
Every translation task is independently checkable; the final phase is the
literal `Hardening & PR` close-out.

### P1 — Tutorial-flow docs → ES

- [x] `docs/workflow/README.es.md` — faithful translation; back-link;
      internal Pages-table links repointed to `.es.md` siblings; add
      forward-link to `docs/workflow/README.md`.
- [x] `docs/workflow/FEATURE_WORKFLOW.es.md` — translation + back-link;
      add forward-link to `FEATURE_WORKFLOW.md`.
- [x] `docs/workflow/ISSUE_WORKFLOW.es.md` — translation + back-link;
      add forward-link to `ISSUE_WORKFLOW.md`.
- [x] Gate: every relative link in the 3 new `.es.md` resolves; no
      stack/real-project reference introduced. (Links within P1's own
      files resolve now. `README.es.md`'s Pages-table links to
      `SKILLS.es.md`, `REVIEW_AND_CLASSIFY.es.md`, `RECOMMENDED_SKILLS.es.md`,
      `REPLICATE.es.md`, `MIGRATION.es.md`, `GOLDEN_FIXTURE.es.md` are
      intentional forward references per the link-convention decision —
      those siblings land in P2/P3 and the full link-resolution check reruns
      at P7 Hardening. No stack/real-project reference found — grep-checked.)

### P2 — Skill & review reference → ES

- [x] `docs/workflow/SKILLS.es.md` — translation + back-link; forward-link on EN.
- [x] `docs/workflow/REVIEW_AND_CLASSIFY.es.md` — translation + back-link; forward-link on EN.
- [x] `docs/workflow/RECOMMENDED_SKILLS.es.md` — translation + back-link; forward-link on EN.
- [x] `docs/workflow/ORCHESTRATION.es.md` — translation + back-link; forward-link on EN.
- [x] Gate: every relative link in the 4 new `.es.md` resolves; no leak.
      (Verified with a link-resolution script; the two flagged items were
      false positives — a same-page anchor and a directory reference, both
      confirmed to exist. `npx skills add . --list` still enumerates all
      skills. No stack/real-project reference — grep-checked, one
      false-positive substring match on "Guardrails".)

### P3 — Replication, testing, portability, migration → ES

- [x] `docs/workflow/REPLICATE.es.md` — translation + back-link; forward-link on EN.
- [x] `docs/workflow/GOLDEN_FIXTURE.es.md` — translation + back-link; forward-link on EN.
- [x] `docs/workflow/PORTABLE_PROMPT.es.md` — translation + back-link; forward-link on EN
      (the pasteable prompt fence itself kept verbatim/untranslated per the
      code-block rule — translating a literal paste-in prompt would change
      what the agent executes; noted inline in the ES doc).
- [x] `docs/workflow/MIGRATION.es.md` — translation + back-link; forward-link on EN
      (two same-page anchor links re-slugged to match the translated
      headings; verified programmatically against GitHub's slug algorithm).
- [x] Gate: every relative link in the 4 new `.es.md` resolves; no leak.
      (`npx skills add . --list` green; grep-checked for stack/real-project
      leaks — none found.)

### P4 — Schema package API reference → ES

- [x] `packages/agentic-workflow-schema/README.es.md` — faithful
      translation + back-link; add forward-link to the package `README.md`.
- [x] Add `"README.es.md"` to the `files` array in
      `packages/agentic-workflow-schema/package.json`.
- [x] Gate: `npm test` in the package passes (13/13); `npm pack --dry-run`
      lists `README.es.md` (11.9kB, 7 total files); relative links
      resolve; no stack/real-project leak; `npx skills add . --list`
      still green.

### P5 — Model-routing recommendation revision

- [x] `README.md`: rewrite the "Running on NaN.builders" section + the
      "If GLM-5.2 is down" fallback ladder into the two-profile,
      quota-aware shape specified in Scope → Model-routing revision:
      GLM-5.2 = €200-plan option (not the basic-plan primary); quota-aware
      routing rule; per-task preference ladders (2–3 deep) with config +
      pro/con, **including the fold-cycle ladder** (routine finding →
      execution tier; subtle finding → bump to the tier that found it,
      superseding the old single-model "Alternates" line); the "never
      Qwen3.6 for merge gates / defer to human" rule; the 5-model pros/cons
      table. No unverified benchmark numbers; keep the "sanity-check
      against a current leaderboard" caveat.
- [x] `README.es.md`: mirror the **same** revised section as a faithful
      Spanish translation — identical ladders, config values, model names,
      and table rows; no divergence from `README.md`.
- [x] Gate: EN and ES model tables/ladders match 1:1 (diff the two
      sections); all links in both still resolve; no invented benchmark
      claim introduced. (Verified: model names, sizes, context, quota
      figures, and ladder ordering are identical across both files —
      grep-counted, with the only surface differences being the localized
      unit labels "tok/member/mo" vs. "tok/miembro/mes". `npx skills add .
      --list` green; no stack/real-project leak.)

### P6 — Sync-policy convention

- [x] `CLAUDE.md`: under "Working rules", record that **human-readable
      docs** (`README`, `CHANGELOG`, `docs/workflow/*.md`, the schema
      package `README`) carry EN + ES siblings kept in sync **on next
      touch** — no automated bookkeeping — while `SKILL.md`, SPECs,
      commits, PRs, and machine config (`model-routing.yml`) stay
      English-only.
- [x] Gate: `CLAUDE.md` still links resolve; wording is generic (no
      stack/project reference). (Only "broken" matches from the link
      checker were the literal `<name>.es.md`/`<name>.md` placeholder
      pattern inside the new bullet's own prose, not real links. No
      stack/real-project leak; `npx skills add . --list` still green.)

### P7 — Hardening & PR

- [x] Re-run the project's full verification gate (commands + exit codes pasted)
      (`npx skills add . --list` exit 0; `npm test` in
      `packages/agentic-workflow-schema` 13/13 pass; full link-resolution
      sweep across all 12 new `.es.md` + `README.md`/`README.es.md`/
      `CLAUDE.md` — 0 broken; no stack/real-project leak grep-checked
      across every phase.)
- [x] Pending-docs check: `git status --porcelain -- docs/` → empty
- [x] Set the fix-index row status to `done` and commit the flip
- [x] `git push`
- [x] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #37`
      (PR: https://github.com/gtrabanco/agentic-workflow/pull/50 — body
      verified with `gh pr view 50 --json body`, backticks render
      correctly, no literal `\`` escapes.)
- [x] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #37` and push

## Testing

No unit/integration layer applies (documentation). Verification is:

1. **Docs gate** — link resolution across every new `.es.md`, `npx skills
   add . --list` still enumerates all skills, no stack/real-project leak.
2. **Package test** — `npm test` in `packages/agentic-workflow-schema`
   (P4), plus `npm pack --dry-run` to confirm `README.es.md` is packaged.
3. **Manual review** — a fluent reader spot-checks translation fidelity
   (mandatory; not automatable).
4. **Model-routing parity + correctness** (P5) — diff the `README.md` and
   `README.es.md` model sections (ladders/config/names/table must match
   1:1); confirm the recommendation logic is present (GLM-5.2 = €200-plan,
   never Qwen3.6 for merge gates, defer-to-human when both capped models
   are spent). Correctness of the recommendation is a manual judgement, not
   an automatable gate.

Existing tests at regression risk: none — no code path changes; the schema
package test only re-runs to confirm the manifest edit is inert.

## Rollback

`git revert` the merge commit (or PR-revert flow): deletes the 12
`.es.md`, restores the English docs' pre-link state, reverts the
`package.json` `files` entry and the `CLAUDE.md` convention. No data-side
cleanup — no schema, migration, or state change. Nothing is lost beyond the
translations themselves (recoverable from git history).

## Status

`done`

## Decisions made during drafting

- **Scope = all human-readable docs**, per the user's answer ("tutorial and
  api reference docs … documents to be read by human"): the full
  `docs/workflow/*.md` set (not just the reader-facing subset) **plus** the
  schema package `README`. `model-routing.yml` excluded as machine config.
- **Sync policy = lightweight convention, no tooling**, per the user's
  answer — documented in `CLAUDE.md`, enforced "on next touch". No
  bump-skill extension (that would be a separate `plan-feature` item).
- **Link convention inside `.es.md`:** point to the `.es.md` sibling when
  it exists in this scope, otherwise keep the English target. Chosen so a
  Spanish reader stays in Spanish where a translation exists without
  producing dangling links to untranslated files.
- **Forward-link added to each English doc** (`> 🇪🇸 …`) mirroring the
  existing root-`README.md` pattern — the `docs/workflow/*.md` files have
  none today, so establishing the pair edits both sides.
- **Phase grouping by document cluster** (flow / reference / replication /
  schema / model-routing / policy) rather than one phase per file — keeps
  each phase a single coherent concern while staying independently
  checkable.
- **Model-routing revision folded into `#37`, no separate issue** — owner
  instruction (2026-07-12), overriding the default one-PR-per-unit /
  track-don't-inline discipline (flagged at the time, waived by the owner).
  Reflected in the SPEC so scope stays explicit rather than drifting.
- **GLM-5.2 repositioned, not removed** — it stays in the docs as the
  €200-plan primary (owner: practically unlimited there, limits only for
  very heavy use); the basic-plan default becomes the quota-aware fleet.
- **Quota-aware routing** — grounded in the nan.builders catalog
  (2026-07-12 fetch): only Mimo V2.5 and DeepSeek V4 Flash show a 500M
  tok/member cap; GLM-5.2/Qwen3.6/Gemma4 show none. "No cap listed" is
  treated as *unconfirmed, not unlimited* — the doc must not assert
  unlimited without the plan terms.
- **Qwen3.6 = re-checkable reasoning only** — reasoned from active-params
  (35B/3B) + role, not a live benchmark; never a merge-gating verdict;
  both capped models spent ⇒ defer to human. No invented benchmark numbers
  enter the doc (the leaderboard-sanity-check caveat stays).
