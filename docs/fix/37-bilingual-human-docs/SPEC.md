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
`#44` landed there.

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

**Convention (P5):** record in `CLAUDE.md` that human-readable docs carry
EN + ES siblings, kept in sync **on next touch** (no automated
bookkeeping), while `SKILL.md`, SPECs, commits, PRs, and machine config
stay English-only.

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
- [ ] `docs/fix/README.md` row for this fix reaches `done`. [file-content]

**Manual verification required (why):** translation fidelity and Spanish
fluency cannot be asserted by an automated gate — a fluent reviewer must
spot-check that each `.es.md` says what the English says (no dropped
sections, no invented content, no mistranslated technical claims).

## Impact

- **Layers touched:** documentation only (`docs/workflow/`,
  `packages/agentic-workflow-schema/`) + repo guidance (`CLAUDE.md`) + one
  package-manifest field (`package.json` `files`). No skills, no schema,
  no runtime code.
- **Modules/files:** 12 new `.es.md`; 12 English docs edited (forward-link
  only); `packages/agentic-workflow-schema/package.json`; `CLAUDE.md`;
  `docs/fix/README.md`.
- **Blast radius:** dev-/reader-facing only. Worst realistic failure is a
  broken relative link or a mistranslation — no data, no behavior, no
  security surface. A wrong `files` entry could omit `README.es.md` from
  the published package (caught by the acceptance check + `npm pack`).
- **Detection lead time:** immediate at review (link check + manual
  read); a stale/omitted translation surfaces only when a Spanish reader
  hits it — hence the recorded on-next-touch convention.

## Rules that must never be violated

- **English-only process artifacts hold.** `SKILL.md`, SPECs, commits, PR
  descriptions, and machine config remain English (CLAUDE.md "Working
  rules"). This fix translates *human docs*, never those.
- **Stack/architecture-agnostic.** No product/stack/framework/ORM/runtime/
  architecture reference may be introduced into the translated docs
  (CLAUDE.md "Working rules").
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

## Effort

**L** (multi-commit, > 1 day-equivalent) — ~90 KB of prose across 12 files
plus 12 forward-link edits, a manifest change, and a convention note.

The `plan-fix` guidance says an L item may be escalated to a feature via
`plan-feature` — **the user decides at review**. Recommendation: keep it as
this phased fix. The work is mechanical translation with **zero open design
decisions**, cleanly partitioned by document cluster; the `## Phases`
ledger already sequences it into checkable multi-commit units, which is
exactly what `execute-phase --fix` runs. A feature SPEC would add planning
overhead without adding design content.

## Phases

Execution ledger — `execute-phase --fix` runs **one phase per invocation**.
Every translation task is independently checkable; the final phase is the
literal `Hardening & PR` close-out.

### P1 — Tutorial-flow docs → ES

- [ ] `docs/workflow/README.es.md` — faithful translation; back-link;
      internal Pages-table links repointed to `.es.md` siblings; add
      forward-link to `docs/workflow/README.md`.
- [ ] `docs/workflow/FEATURE_WORKFLOW.es.md` — translation + back-link;
      add forward-link to `FEATURE_WORKFLOW.md`.
- [ ] `docs/workflow/ISSUE_WORKFLOW.es.md` — translation + back-link;
      add forward-link to `ISSUE_WORKFLOW.md`.
- [ ] Gate: every relative link in the 3 new `.es.md` resolves; no
      stack/real-project reference introduced.

### P2 — Skill & review reference → ES

- [ ] `docs/workflow/SKILLS.es.md` — translation + back-link; forward-link on EN.
- [ ] `docs/workflow/REVIEW_AND_CLASSIFY.es.md` — translation + back-link; forward-link on EN.
- [ ] `docs/workflow/RECOMMENDED_SKILLS.es.md` — translation + back-link; forward-link on EN.
- [ ] `docs/workflow/ORCHESTRATION.es.md` — translation + back-link; forward-link on EN.
- [ ] Gate: every relative link in the 4 new `.es.md` resolves; no leak.

### P3 — Replication, testing, portability, migration → ES

- [ ] `docs/workflow/REPLICATE.es.md` — translation + back-link; forward-link on EN.
- [ ] `docs/workflow/GOLDEN_FIXTURE.es.md` — translation + back-link; forward-link on EN.
- [ ] `docs/workflow/PORTABLE_PROMPT.es.md` — translation + back-link; forward-link on EN.
- [ ] `docs/workflow/MIGRATION.es.md` — translation + back-link; forward-link on EN.
- [ ] Gate: every relative link in the 4 new `.es.md` resolves; no leak.

### P4 — Schema package API reference → ES

- [ ] `packages/agentic-workflow-schema/README.es.md` — faithful
      translation + back-link; add forward-link to the package `README.md`.
- [ ] Add `"README.es.md"` to the `files` array in
      `packages/agentic-workflow-schema/package.json`.
- [ ] Gate: `npm test` in the package passes; `npm pack --dry-run` lists
      `README.es.md`; relative links resolve.

### P5 — Sync-policy convention

- [ ] `CLAUDE.md`: under "Working rules", record that **human-readable
      docs** (`README`, `CHANGELOG`, `docs/workflow/*.md`, the schema
      package `README`) carry EN + ES siblings kept in sync **on next
      touch** — no automated bookkeeping — while `SKILL.md`, SPECs,
      commits, PRs, and machine config (`model-routing.yml`) stay
      English-only.
- [ ] Gate: `CLAUDE.md` still links resolve; wording is generic (no
      stack/project reference).

### P6 — Hardening & PR

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #37`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #37` and push

## Testing

No unit/integration layer applies (documentation). Verification is:

1. **Docs gate** — link resolution across every new `.es.md`, `npx skills
   add . --list` still enumerates all skills, no stack/real-project leak.
2. **Package test** — `npm test` in `packages/agentic-workflow-schema`
   (P4), plus `npm pack --dry-run` to confirm `README.es.md` is packaged.
3. **Manual review** — a fluent reader spot-checks translation fidelity
   (mandatory; not automatable).

Existing tests at regression risk: none — no code path changes; the schema
package test only re-runs to confirm the manifest edit is inert.

## Rollback

`git revert` the merge commit (or PR-revert flow): deletes the 12
`.es.md`, restores the English docs' pre-link state, reverts the
`package.json` `files` entry and the `CLAUDE.md` convention. No data-side
cleanup — no schema, migration, or state change. Nothing is lost beyond the
translations themselves (recoverable from git history).

## Status

`pending`

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
  schema / policy) rather than one phase per file — keeps each phase a
  single coherent concern while staying independently checkable.
