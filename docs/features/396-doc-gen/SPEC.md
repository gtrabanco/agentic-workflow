# 396 — doc-gen

> Forced documentation task + generated docs in the project's declared format (md/mdx/html/latex).

## Specs

**S1 — Required documentation task in the docs step.**
> Every unit that ships code must leave behind documentation of what it actually shipped, in the output format the project declared at initialization (markdown, MDX, HTML, LaTeX, …), produced by tooling rather than by the model remembering to write it. Today nothing forces that: the lane's docs step says "all docs the unit demands" without naming the project's declared output format, and no command renders delivered code/features into that format. Closing that edge keeps the documentation a trustworthy entry point instead of a liability. A rule that makes "document what this unit shipped" a required, non-skippable task of a unit's docs step, named as an explicit task rather than implied.

**S2 — Deterministic generator command.**
> An automation (script/CLI, deterministic) that renders the repository's own artifacts — unit docs, roadmap rows, and the shipped code — into the project's declared output format. One command regenerates the declared-format docs from repository artifacts (unit docs + roadmap + code), with no hand-duplicated content.

**S3 — Format discovery from "Docs site" block.**
> Format discovery from what the project already declares at initialization (the scaffold's `Docs site` block: `format: starlight | docusaurus | markdown`, `content-dir`, `build`, `map`) — the format chosen at init drives the generated output; `md`, `mdx`, `html` and `latex` are the initial targets. No declared format → deterministic fallback to `markdown` with a reported degradation, never a silent failure.

**S4 — Coverage of code and features.**
> Coverage of both halves the request names: the code that was written and the features that were delivered (what shipped, where, how to use it). Two consecutive runs are byte-identical (determinism proven by a test), and drift between sources and generated output is detectable by a command the gate can call.

**S5 — Stale-output signal.**
> A stale-output signal: regenerating without changes is byte-identical, and a generated doc that no longer matches its sources is detectable.

**S6 — Obsolete-doc removal.**
> Removal of obsolete documentation in the change that supersedes it, so the generated tree cannot accumulate retired surfaces. Superseded documentation is deleted in the change that supersedes it, and the generator never emits a retired surface.

**S7 — init-workspace integration.**
> init-workspace carries the choice: a project initialized with a format gets that format's output; an existing project is offered it additively and with consent.

## Impact

- `skills/unit-lane/references/DOCS.md` — the docs step gains a forced, explicit documentation task
- `scripts/generate-docs.mjs` — new script/CLI (deterministic generator)
- `scripts/generate-docs.test.mjs` — new test suite (determinism, drift detection, stale-output)
- `template/AGENTS.md` — the generator command is referenced in the scaffold's guide
- `skills/init-workspace/SKILL.md` — init-workspace offers format choice
- `packages/agentic-workflow/` — runner-crate subcommand `agentic-workflow docs build` (potential)
- `docs/ROADMAP.md` — row for this feature
- `AGENTS.md` — working rules update (documentation-currency rule)
- `CHANGELOG.md` — changelog entry

## Retirements

none — this unit adds new surfaces; it does not retire any existing tool or surface.

## Non-goals

- Replacing Markdown as the source of truth (feature 65 fixed that: Markdown stays single source; generated formats are projections, never authored surfaces).
- The README-currency repair and the documentation-currency rule this issue grew out of — that is the companion unit 103-doc-currency (this issue keeps the automation half).
- Reviving the retired `generate-docs` skill (retired in 42d66a42); this issue decides the shape from today's substrate, not from that skill.
- Full language-aware code docs (exports/API): the first pass covers repo-level unit/docs/roadmap projections; source-level API extraction is deferred.

## Risk tier

- **`standard`** · **Task Size** — `medium` (new script + test + doc updates, but bounded scope and no behavioral change to existing skills)
- **Named high-risk item** — `none — not a high-tier unit`

## Future

- Source-level API extraction (TypeDoc, JSDoc parsing) — deferred to a separate unit when language-specific doc generation is needed.
- Multi-format parallel generation (simultaneous mdx+html+latex from one source) — deferred to a batch optimizer.
- `docs/graph` from the project's declared `map` script — uses the `map` slot from Docs site block for graph output.
- Format-specific plugin system — deferred if a project needs custom frontmatter or layout hooks.

## Future cost

- Projects that enable a format must maintain their generated output tree. The stale-output signal ensures regeneration is low-cost (byte-identical when nothing changed).

## Applicable tests

- `bun test scripts/generate-docs.test.mjs` (determinism: two consecutive runs produce byte-identical output)
- `bun test scripts/generate-docs.test.mjs` (drift detection: modifying a source file changes the output)
- `bun test scripts/generate-docs.test.mjs` (no-declared-format fallback: silent fallback to markdown with degradation notice)
- `bun test scripts/generate-docs.test.mjs` (obsolete-doc removal: superseded sources not emitted)

## Known pre-existing issues

none — this unit does not affect any pre-existing issue.

## Tasks

- P1 — Update `skills/unit-lane/references/DOCS.md` with a forced documentation task naming what was documented and in which declared format (validator: `bun scripts/phase-lint.mjs` exits 0 on the updated skill) (Implements: S1)
  Relevant files: skills/unit-lane/references/DOCS.md, template/skills/unit-lane/references/DOCS.md
- P2 — Create `scripts/generate-docs.mjs` with deterministic doc generation from repo artifacts (validator: `bun scripts/generate-docs.mjs --check` exits 0 and reports generated files) (Implements: S2, S3, S5)
  Relevant files: scripts/generate-docs.mjs
- P3 — Create `scripts/generate-docs.test.mjs` with determinism, drift, fallback, and stale-output tests (validator: `bun test scripts/generate-docs.test.mjs` exits 0) (Implements: S2, S4, S5)
  Relevant files: scripts/generate-docs.test.mjs
- P4 — Implement format discovery from `template/AGENTS.md` "Docs site" block (validator: `bun scripts/generate-docs.mjs --dry-run` reports detected format or markdown fallback) (Implements: S3)
  Relevant files: scripts/generate-docs.mjs, template/AGENTS.md
- P5 — Implement obsolete-doc removal: the generator never emits a retired surface (validator: `rg` on generated output finds no retired paths) (Implements: S6)
  Relevant files: scripts/generate-docs.mjs
- P6 — Update `skills/init-workspace/SKILL.md` to offer format choice during initialization (validator: `bun scripts/unit-route.mjs --triage 396-doc-gen` lists the skill as touched) (Implements: S7)
  Relevant files: skills/init-workspace/SKILL.md, template/skills/init-workspace/SKILL.md
- P7 — Update `AGENTS.md` working rules with documentation-currency rule (validator: `bun scripts/check-skill-context.mjs` exits 0) (Implements: S1)
  Relevant files: AGENTS.md, template/AGENTS.md
- P8 — Register feature 396 in `docs/ROADMAP.md` (validator: `rg "396.*doc-gen" docs/ROADMAP.md` finds the row) (Implements: S2)
  Relevant files: docs/ROADMAP.md
- P9 — Update `CHANGELOG.md` with entry for this feature (validator: `rg "doc-gen|396" CHANGELOG.md` finds the entry) (Implements: S2)
  Relevant files: CHANGELOG.md
- P10 — Verification: run the full root suite and diff guard (validator: `node scripts/run-root-suite.mjs` exits 0, `bun scripts/diff-guard.mjs --base main` exits 0) (Implements: S1-S7)
  Relevant files: all touched files

### Planning evidence

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| obs-396-1 | DOCS.md checklist | docs step cannot close without explicit documentation task | docs | P1 | lane/docs step | phase-lint | phase-lint exits 0 | verified |
| obs-396-2 | S2 determinism | generator produces byte-identical output on consecutive runs | execute | P2, P3 | scripts/generate-docs | test suite | bun test exits 0 | verified |
| obs-396-3 | S3 fallback | no-declared-format silently falls back to markdown with degradation | execute | P4 | scripts/generate-docs | --dry-run output | reports markdown fallback | verified |
| obs-396-4 | S6 obsolete removal | generator never emits retired surfaces | execute | P5 | scripts/generate-docs | rg on output | 0 retired paths | verified |
| obs-396-5 | S7 init-workspace | existing projects offered format additively with consent | docs | P6 | init-workspace skill | skill lint | phase-lint exits 0 | verified |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| obs-396-6 | S1 unit contract | unit with code cannot close without documentation task | docs | P1 | lane/docs step | DOCS.md checklist | checklist item checked | verified |
| obs-396-7 | S5 drift detection | gate can call a command to detect source→generated drift | execute | P2, P3 | scripts/generate-docs | --check flag | reports drift or clean | verified |
| obs-396-8 | red-first rule | new script ships sibling test suite (red commit before green) | execute | P2, P3 | scripts/ | red-first.mjs | two-commit ordering | pending |

## Findings

OPEN rows only: a row a review persisted as fix-now work and no fold has closed yet.

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Triaged steps

```
TRIAGE — 396-doc-gen (feature)
Steps: implement, evidence
Tiers: implement: cheap, evidence: strong
Skipped: research: trivial scope, design: trivial scope, plan: trivial scope, tests: trivial scope, review: trivial scope, docs: trivial scope, release: small scope
Budget: strong
```

## Evidence

| AC | What was done | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| Triage | `bun scripts/unit-route.mjs --triage 396-doc-gen` | 0 | Steps: implement, evidence | lane conductor |
| Tier classify | `bun scripts/ceremony.mjs tier classify` | 0 | tier: standard, task_size: contained | ceremony.mjs |

## Log

- **L1** — 2026-11-04, the request, verbatim:
  ```
  NEW FEATURE: forced documentation task + generated docs in the project's declared format (md/mdx/html/latex)
  ```
- **E1** — 2026-11-04, `bun scripts/unit-route.mjs --triage 396-doc-gen` · exit 0 · Steps: implement, evidence
- **E2** — 2026-11-04, `bun scripts/ceremony.mjs tier classify` · exit 0 · tier: standard

## Next

Hand off to execute-phase P1 (tier: cheap).

## References

- Issue: [#396](https://github.com/gtrabanco/agentic-workflow/issues/396)
- Companion: [#103](https://github.com/gtrabanco/agentic-workflow/issues/103) (doc-currency, prerequisite — done)
- Feature 65 `doc-toolchain` (done) — section-level doc read/edit + runner crate's `doc` entry point
- Retired `generate-docs` skill (retired in `42d66a42`)