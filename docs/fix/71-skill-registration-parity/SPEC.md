# fix/71-skill-registration-parity

> Fix specification. The SPEC alone is the source of truth; its
> `## Phases` section is the execution ledger `execute-phase --fix` runs
> one phase per invocation.

## Goal

Close the registration/documentation-parity drift left by PR #70 (which
added the `fold-findings` skill) and make it non-recurring. Three defects
share one root cause — nothing asserts parity between `skills/*/` and the
repo's registration/config surfaces, and no ordering convention is written
down or linted: (#71) `fold-findings` is absent from
`.claude-plugin/plugin.json`, so it installs under the catch-all `General`
category instead of `Agentic Workflow`; (#72) the non-Claude
model-equivalence ladder in both READMEs never names `fold-findings` and
still routes folding through *"`execute-phase`'s fold cycle"*, and the same
tables carry a now-false "GLM-5.2 everywhere" tier; (#73) no surface declares
its ordering rule and `docs/workflow/model-routing.yml` has silently drifted
off alphabetical. The fixes land in overlapping files (both READMEs, both
`bump-skill` lint additions) and are cheap; splitting them would force three
near-identical passes over the same lines. It cannot wait for a feature
cycle because the install prompt — the user's first contact with the pack —
currently misrepresents the pack's own composition.

## Issue

`#71` (primary) — GitHub issue. Merged unit also closes `#72` and `#73`.
The PR body must carry one `Closes #<n>` line per issue:

```
Closes #71
Closes #72
Closes #73
```

## Branch

`fix/71-skill-registration-parity`

## Depends on

None. (#73's own "Depends on #71" is internalised as phase ordering: P1
registers `fold-findings` in `plugin.json` before any alphabetical
verification runs.)

## Root cause

PR #70 (fix #65) extracted the fold cycle from `execute-phase` into the
standalone `fold-findings` skill and registered it in most doc surfaces —
`docs/workflow/model-routing.yml:26`, `SKILLS.md`/`SKILLS.es.md`, both
READMEs' Claude-tier tables, both CHANGELOGs — but **not** in
`.claude-plugin/plugin.json`, and **not** in the non-Claude equivalence
ladder (whose fold row predates the skill). Nothing catches either omission:
`bump-skill`'s lint (`skills/bump-skill/SKILL.md:72–93`) checks only the
authoring rules (`→ Next:` block, `P1`-not-`S1` phases, Portability, Turn
contract) and never asserts `skills/*/` ↔ `plugin.json` parity or any
ordering rule; `npx skills add . --list` "passes" because it discovers skills
by directory scan regardless of the manifest. The manifest omission
(#71), the ladder omission + the stale GLM-5.2 column (#72), and the
undeclared/undrifted ordering (#73) are three faces of the same missing
parity discipline.

## Detected in

User report, 2026-07-17, split into three issues (#71/#72/#73) and triaged
the same day (all fix-now; the triage comments explicitly recommend one
merged unit). Confirmed against the current tree:

- `grep -c '"./skills/fold-findings"' .claude-plugin/plugin.json` → `0`;
  `npx skills add . --list` prints `fold-findings` under `General`.
- The fold row in both READMEs' *Preference ladders per task* table reads
  `**Folding …** | `execute-phase`'s fold cycle | …` — `fold-findings` is
  never named (`README.md:338`, `README.es.md:351`).
- `docs/workflow/model-routing.yml` runs alphabetically `audit-docs` →
  `triage-issue`, then appends `orchestration-envelope` and `workflow-status`
  out of order at the end.

## Scope

### In scope

- **`.claude-plugin/plugin.json`** — add `"./skills/fold-findings"` in its
  alphabetical slot (between `"./skills/execute-phase"` and
  `"./skills/generate-docs"`).
- **`docs/workflow/model-routing.yml`** — restore full alphabetical order
  (`orchestration-envelope` between `log-session` and `plan-feature`;
  `workflow-status` last). Keys and values are byte-identical; only line
  position changes.
- **`README.md` + `README.es.md`** (equivalence-ladder section only) — the
  fold row's `Skills` column names `fold-findings` as the primary path with
  `execute-phase`'s embedded fold cycle as the in-context/portability
  fallback (the routine-vs-subtle tier advice is preserved verbatim); the
  explanatory prose beneath the table is reconciled with the skill split; the
  ladder tables no longer present GLM-5.2 as an available tier (the
  "€200 plan" column is reconciled with what the two-profile section already
  documents as available, or annotated historical). Both files change in the
  same commit (bilingual-sync rule).
- **`CLAUDE.md`** (Conventions table) — declare the per-surface ordering
  rule: machine/config surfaces (`plugin.json`, `model-routing.yml`) →
  alphabetical; narrative surfaces (README "The skills" sections, `SKILLS.md`)
  → flow order.
- **`skills/bump-skill/SKILL.md`** — add two lint rules to §2b: (a)
  `plugin.json` parity (every `skills/<name>/` with `user-invocable: true`
  has a matching `./skills/<name>` entry); (b) alphabetical order of the
  machine surfaces (`plugin.json` `skills` array + `model-routing.yml`
  top-level keys). Update the Turn-contract line and the §Summary line that
  enumerate the lint results.
- **`bump-skill` version + changelog + README tables** — the mechanical
  consequence of editing `skills/bump-skill/SKILL.md`, run via the
  `bump-skill` skill in the hardening phase.

### Out of scope

- **#74** — `bump-skill` is installable despite `user-invocable: false`. Same
  missing-parity family, but its fix is an *exclusion/discovery* mechanism
  needing a design decision, not a registration line; kept a separate issue
  per its triage. The P4 lint is scoped to `user-invocable: true` skills, so
  it neither depends on nor pre-empts #74. Belongs to issue #74.
- **Reordering the README "The skills" `###` sections or `SKILLS.md`** — these
  are flow-ordered on purpose and self-documenting; alphabetising them would
  make the docs worse. The declared convention explicitly protects them.
  (#73's own scope-guard.)
- **`SKILLS.md`/`SKILLS.es.md` fold entries, Claude-tier tables,
  `model-routing.yml` `fold-findings` value** — already correct since PR #70;
  untouched.

## Acceptance

- [ ] `"./skills/fold-findings"` is present in the `skills` array of
      `.claude-plugin/plugin.json`, between `"./skills/execute-phase"` and
      `"./skills/generate-docs"`.
- [ ] `npx skills add . --list` prints `fold-findings` under `Agentic
      Workflow`; the `General` category no longer contains it.
- [ ] `.claude-plugin/plugin.json`'s `skills` array is fully alphabetical.
- [ ] `docs/workflow/model-routing.yml`'s top-level keys are fully
      alphabetical (`orchestration-envelope` between `log-session` and
      `plan-feature`; `workflow-status` last).
- [ ] Reordering `model-routing.yml` provably does not change the `claude`
      branch's injected frontmatter — confirmed: `inject_claude_frontmatter.py`
      iterates `routing.items()` and derives each path from the **key**
      (`skills/{name}/SKILL.md`), never from file position (recorded under
      Decisions).
- [ ] The fold row in `README.md`'s preference-ladder table names
      `fold-findings` as the primary path and `execute-phase`'s fold cycle as
      the fallback; the routine-vs-subtle tier advice is preserved.
- [ ] `README.es.md` carries the faithful ES counterpart of every ladder edit
      in the same commit (bilingual-sync rule).
- [ ] The explanatory prose under both ladder tables is reconciled with the
      skill split (no longer describes folding as a phase of `execute-phase`).
- [ ] The ladder tables no longer present GLM-5.2 as an available tier; the
      €200-plan column is reconciled with the two-profile section (available
      set) or annotated historical, EN and ES together.
- [ ] Spot-check recorded: no other ladder row silently omits a user-facing
      skill shipped after the section was written.
- [ ] `CLAUDE.md`'s Conventions table declares the ordering rule for machine
      surfaces and for narrative surfaces.
- [ ] `bump-skill` gains a lint rule asserting `skills/<name>/` (with
      `user-invocable: true`) ↔ `./skills/<name>` in `plugin.json`, reported
      with the other lint results.
- [ ] `bump-skill` gains a lint rule asserting the machine surfaces
      (`plugin.json` array + `model-routing.yml` keys) are alphabetical,
      reported with the other lint results.
- [ ] Updated `README.md` / `README.es.md` §"The skills"/§"Model & effort"
      rows and both CHANGELOGs for the `bump-skill` bump (via the `bump-skill`
      skill).
- [ ] The `claude` branch, regenerated by `sync-derived-branches.yml` post
      merge, carries the same `plugin.json` registration (automatic — the
      sync force-pushes the manifest unchanged; recorded under Decisions).

## Phases

Execution ledger — `execute-phase --fix` runs **one phase per invocation**.
Every implementation phase below passes all 8 phase-lint boxes
(`docs/fix/_TEMPLATE/SPEC.md` `## Phases`).

### P1 — Machine-config surfaces

Layer: `config/infra`. Done-when:
`node -e "const s=require('./.claude-plugin/plugin.json').skills; process.exit(s.includes('./skills/fold-findings') && JSON.stringify(s)===JSON.stringify([...s].sort())?0:1)"`
→ exit 0, **and** `grep -E '^[a-z-]+:' docs/workflow/model-routing.yml | sed 's/:.*//' | sort -c` → no "out of order" error.

- [ ] Add `"./skills/fold-findings"` to `.claude-plugin/plugin.json`'s
      `skills` array between `"./skills/execute-phase"` and
      `"./skills/generate-docs"`.
- [ ] Move `orchestration-envelope:` (with its `model`/`effort` block) in
      `docs/workflow/model-routing.yml` to its alphabetical slot between
      `log-session:` and `plan-feature:`.
- [ ] Move `workflow-status:` (with its block) to the end of
      `docs/workflow/model-routing.yml`, after `triage-issue:`.
- [ ] Confirm `npx skills add . --list` prints `fold-findings` under
      `Agentic Workflow` and not under `General`; paste the category lines.

### P2 — Equivalence-ladder tables

Layer: `docs`. Done-when:
`grep -c 'fold-findings' README.md README.es.md` → ≥ 1 in each **and**
`grep -n 'GLM-5.2 everywhere' README.md README.es.md` → no match in the
ladder-table caption of either file.

- [ ] Rewrite the fold row of `README.md`'s *Preference ladders per task*
      table so its `Skills` column names `fold-findings` (primary) with
      `execute-phase`'s fold cycle as the fallback; keep the
      routine-vs-subtle tier advice unchanged.
- [ ] Reconcile the prose beneath `README.md`'s ladder table (the
      "fold-cycle row supersedes…" paragraph) with the skill split.
- [ ] Reconcile the GLM-5.2 "€200 plan" availability framing in `README.md`'s
      ladder table + caption with the two-profile section (available set or
      historical annotation).
- [ ] Apply the faithful ES counterpart of all three edits above to
      `README.es.md` in this same phase (bilingual sync).
- [ ] Record the spot-check: read every ladder row and confirm none omits a
      user-facing skill shipped after the section was written.

### P3 — Ordering convention in CLAUDE.md

Layer: `docs`. Done-when: `grep -c 'alphabetical' CLAUDE.md` ≥ 1 in the
Conventions table region and the table names both machine and narrative
surfaces.

- [ ] Add a row (or rows) to `CLAUDE.md`'s Conventions table declaring:
      machine/config surfaces (`plugin.json`, `model-routing.yml`) →
      alphabetical; narrative surfaces (README "The skills" sections,
      `SKILLS.md`) → flow order.

### P4 — bump-skill machine-surface lint

Layer: `docs`. Done-when: `grep -c 'plugin.json' skills/bump-skill/SKILL.md`
≥ 1 in §2b and the two new lint bullets are present.

- [ ] Add a §2b lint bullet: every `skills/<name>/` with
      `user-invocable: true` must have a matching `./skills/<name>` entry in
      `.claude-plugin/plugin.json`; report the result (never auto-fix).
- [ ] Add a §2b lint bullet: the machine surfaces (`plugin.json` `skills`
      array + `model-routing.yml` top-level keys) must be alphabetical;
      report the result.
- [ ] Update the §Turn-contract line and the §Summary line that enumerate the
      lint results so they cover the new rules.

### P5 — Hardening & PR

- [ ] Run `bump-skill` on the edited `skills/bump-skill/SKILL.md` (version
      bump + `CHANGELOG.md`/`CHANGELOG.es.md` rows + `README.md`/`README.es.md`
      §"The skills"/§"Model & effort" table refresh)
- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #71`,
      `Closes #72`, `Closes #73` (one per line)
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #71` and push

## Impact

- **Layers touched:** repo tooling/config (`config/infra`) and documentation
  (`docs`) only — no application code, no skill *behavior* except
  `bump-skill`'s lint set.
- **Modules and files:** `.claude-plugin/plugin.json`,
  `docs/workflow/model-routing.yml`, `README.md`, `README.es.md`, `CLAUDE.md`,
  `skills/bump-skill/SKILL.md`, plus `bump-skill`-maintained
  `CHANGELOG.md`/`CHANGELOG.es.md`.
- **Blast radius:** dev-/installer-facing. Worst realistic case of a mistake:
  a malformed `plugin.json` (invalid JSON) would break `npx skills add`
  entirely — caught immediately by the P1 done-when node check and the
  hardening gate.
- **Detection lead time:** immediate — every change is asserted by a grep/CLI
  invariant in its phase.

## Rules that must never be violated

- Bilingual sync: every ladder/README edit lands EN + ES in the same commit
  (CLAUDE.md hard rule). CLAUDE.md itself and `bump-skill/SKILL.md` are
  English-only (no `.es.md` sibling), exempt.
- Stack/architecture agnosticism: no product/stack/framework reference enters
  the skills or shared docs.
- Version every skill change: editing `skills/bump-skill/SKILL.md` requires a
  `version:` bump + CHANGELOG rows via `bump-skill` (P5).
- `model-routing.yml` keys and values stay byte-identical under reordering —
  only line position changes (protects the `claude`-branch injection).
- The README "The skills" `###` sections and `SKILLS.md` stay flow-ordered;
  the convention forbids alphabetising them.

## Operational risks

- **`sync-derived-branches.yml`** regenerates the `claude` branch from `main`
  on merge. It force-pushes `main` to `inheritance` as-is and injects
  frontmatter only into `SKILL.md` files (keyed by `model-routing.yml` name).
  `plugin.json` and the reordered `model-routing.yml` propagate unchanged;
  reordering the YAML cannot alter the injected frontmatter (confirmed by
  reading `inject_claude_frontmatter.py`). No scheduled-job, queue, cache, or
  schema interaction otherwise.

## Security risks

None. No auth, secrets, PII, webhooks, or rate-limited surfaces are touched.

## Compliance touchpoints

n/a — repo-internal tooling/docs only.

## Affected docs

- `README.md` / `README.es.md` — ladder tables + prose (P2) and, via
  `bump-skill`, §"The skills"/§"Model & effort" rows (P5).
- `CLAUDE.md` — Conventions table (P3).
- `CHANGELOG.md` / `CHANGELOG.es.md` — `bump-skill` row (P5).
  Each is covered by an acceptance criterion above.

## Observability

No runtime component. "Live and healthy" = `npx skills add . --list` shows 29
skills with `fold-findings` under `Agentic Workflow`, and the two new
`bump-skill` lint rules report on the next skill bump. Degradation would
surface as a future install placing a new skill under `General` again — now
caught at authoring time by the P4 lint rather than by a user report.

## Cross-issue notes

- **#74** (bump-skill installable despite `user-invocable: false`) — same
  missing-parity family; needs a discovery-exclusion design decision. Out of
  scope; the P4 lint is `user-invocable: true`-scoped so it does not conflict.
- **#79, #82, #89** (open, `postponed`) — unrelated to registration/ordering
  parity; untouched.
- No open PRs; no merge conflicts anticipated.

## Effort

**M** (multi-commit, ≤ 1 day). Five phases across six files plus the
`bump-skill` machinery; each edit is mechanical but the surfaces are
numerous and the bilingual + version-bump discipline adds ceremony.

## Decisions made during drafting

- **Primary = #71** (lowest number of the merged unit); topic slug
  `skill-registration-parity` covers all three facets (manifest registration,
  ladder docs, ordering convention + lint).
- **P1 groups `plugin.json` + `model-routing.yml`** as one `config/infra`
  phase: both are machine-config surfaces governed by the single alphabetical
  rule, verified by one combined invariant. Split would be over-cutting.
- **`model-routing.yml` reorder is injection-safe** —
  `inject_claude_frontmatter.py` keys by skill name, not file position
  (verified). Recorded as satisfying #73's load-bearing acceptance without a
  separate experiment.
- **#71's `claude`-branch acceptance is automatic** — the sync workflow
  carries `plugin.json` unchanged to both derived branches; nothing to do
  beyond merging to `main`.
- **`bump-skill` lint additions are `docs`-layer** (markdown/checklist
  authoring in a `SKILL.md`), not `config/infra`; kept in their own phase (P4)
  distinct from the machine-config edits (P1) and separate from the
  `bump-skill` version-bump mechanics (P5).
- **No GOLDEN_FIXTURE smoke required** — `bump-skill` is not on the
  executor-path smoke-test list in CLAUDE.md.

## Testing

Architecture-/tooling-level assertions (this repo has no application build):
per-phase grep/CLI invariants in each done-when, plus the full verification
gate in P5 (`npx skills add . --list` discovers all skills; JSON well-formed;
cross-references resolve). No unit tests exist or are added.

## Rollback

Single `git revert` of the merge commit (or `gh pr revert`). No data-side
cleanup — all changes are text in config/docs/skill files; nothing is
persisted outside the repo. The `claude` branch self-heals on the next
`sync-derived-branches.yml` run after the revert lands on `main`.

## Status

`pending`
