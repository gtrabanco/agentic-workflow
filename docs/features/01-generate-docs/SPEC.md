# 01 — generate-docs

> Feature specification. Detailed phase tasks live in `PLAN.md` / `TASKS.md`.

## Goal

Add a new user-invocable skill `generate-docs` that, after a unit of work (or on
demand), generates or updates **incremental developer documentation** inside the
target project's own docs site — so a public repo's whole knowledge base (how-to
guides, a navigable code knowledge map, and optionally exported review reports)
is readable from one website. The docs format is discovered per project
(**adapter model**); Starlight (Astro) MDX is the first-class documented adapter.

## Branch

`feat/01-generate-docs`

## Size

`M` — one new skill plus surgical edits to two existing skills and the template;
phased work with a hardening phase.

## Dependencies

- Hard: none. All composed skills (`execute-phase`, `audit-docs`,
  `review-change`) exist on `main`.
- Soft: feature `03-orchestrator-crash-recovery` is unrelated; feature
  `02-measured-perf-review` is unrelated. No ordering constraint.

## Context

The workflow produces process artifacts (SPECs, progress, fix docs) but never
**developer-facing documentation**: a contributor cannot learn "how do I create
a domain event and where do I register its handler" from the workflow's output,
and there is no navigable map of the code (call graph) to trace an error to its
origin through the docs. Review reports die in the chat. The gap: knowledge is
produced during every unit of work and then thrown away.

## Business goals

Public repos using this workflow get a complete, always-current docs website
"for free" as a by-product of shipping features — a differentiator for the
agentic-workflow pack itself.

## Technical goals

- A **stack-agnostic contract** with pluggable output adapters (the skill never
  hardcodes Starlight; it documents Starlight as the reference adapter).
- **Deterministic-first**: structural data (call graph / module graph) comes
  from project-declared tooling, never from model inference.
- **Drift-proof**: generated docs are tied into the workflow's gates so they
  cannot silently rot.

## Scope

### In scope

1. New skill `skills/generate-docs/SKILL.md` (user-invocable) with:
   - Step 0 discovery of the project's **docs adapter**: read the agent guide's
     documentation map for a `Docs site` declaration (format, content directory,
     build command, knowledge-map command). Fixed detection checklist, first
     match wins: explicit declaration → Starlight (`astro.config.*` with
     `@astrojs/starlight`) → Docusaurus (`docusaurus.config.*`) → plain
     markdown under `docs/` (always available fallback).
   - **Incremental, diff-driven generation**: input scope is the current unit's
     diff vs the default branch (or an explicit path/unit argument). The skill
     writes/updates only guide pages whose subject the diff touched. A
     whole-project pass is **Forbidden**.
   - **Knowledge map**: if the project declares a map command (an npm-script or
     equivalent that emits a JSON graph via deterministic tooling —
     dependency-cruiser, madge, TypeDoc, tree-sitter, LSP…), run it and generate
     the wrapper page(s) that render/annotate the graph. If not declared, mark
     the map n/a in the report — the model **never infers graph edges**.
   - **Review export mode** (`--review`): convert the most recent
     `review-change` report (its fixed-format output) into a docs page so humans
     can review findings from the website.
   - Generated-page **provenance marker**: every generated file carries a fixed
     frontmatter key (`generated-by: agentic-workflow/generate-docs`,
     `source-unit: <NN-slug|fix-n>`), so audit-docs can find orphans.
   - Turn contract, fixed output contract (report block + `PASS | FAIL`-style
     decision), closing `→ Next:` block, machine envelope (last output),
     `## Portability` section, Allowed/Forbidden lists.
2. `execute-phase`: at unit close-out, when a docs adapter is declared, the
   closing `→ Next:` block recommends `/generate-docs` (docs regeneration is a
   listed close-out task, not an assumed behavior).
3. `audit-docs`: new checklist item — generated pages whose `source-unit` no
   longer exists, or units merged after the page's last update, are reported as
   drift (orphan/stale generated docs).
4. `template/`: the documentation-map template gains an optional `Docs site`
   declaration block (format, content dir, build command, map command) that
   `init-workspace` fills during its interview.
5. `bump-skill` bookkeeping for every touched skill (versions, CHANGELOGs,
   README tables in EN and ES).

### Out of scope / non-goals

- Building or deploying the docs site itself (Astro install, CI publish) — the
  target project owns its site; `init-workspace` may *ask* about it (owned by
  the template block above), but this skill never scaffolds a website.
- Implementing the graph extractor — the target project declares the command;
  writing one belongs to the target project (or a future feature).
- Translating docs — target project's docs language rules apply.
- Any interactive graph UI component beyond what the adapter's ecosystem
  provides (a Starlight-compatible rendering recipe is documented, not built).

## Architecture impact

Pure addition to the skills layer. The skill is **project-adaptive** like its
siblings: all stack knowledge (Starlight, Docusaurus) lives in a clearly marked
adapter section, keeping the CLAUDE.md stack-agnostic rule intact — generic
contract first, named adapters as reference implementations. Composition rule:
`generate-docs` is invoked via hand-off (`→ Next:`), never composed in-turn by
`execute-phase` (tier boundary rule).

## Design

**Adapter contract** (what every adapter must define):

| Slot | Starlight adapter (reference) | Plain-markdown fallback |
|---|---|---|
| Content dir | `src/content/docs/` | `docs/site/` |
| Page format | `.mdx` with Starlight frontmatter (`title`, `description`, `sidebar`) | `.md` with H1 |
| Guides location | `<content>/guides/<area>/<topic>.mdx` | `docs/site/guides/…` |
| Map location | `<content>/map/` + graph JSON in `<content>/map/graph.json` | `docs/site/map/` |
| Review reports | `<content>/reviews/<unit>-<date>.mdx` | `docs/site/reviews/…` |
| Verify step | project's docs build command (e.g. `astro check`/`astro build`) if declared | markdown link check |

**Page taxonomy** (fixed, so every agent produces the same tree):
`guides/` (how-to, diff-driven), `map/` (knowledge map wrappers), `reviews/`
(exported review reports). Nothing else is generated.

**Knowledge-map flow**: run declared command → validate output is JSON with
`nodes[]`/`edges[]` (minimal shape documented in the skill) → write/refresh
`graph.json` → generate one wrapper page per changed top-level module linking
nodes to source paths and to related guide pages. Error-tracing use case: each
node page lists callers/callees so a stack trace can be walked doc-to-doc.

**Incrementality rule** (checklist, not heuristic): a guide page is (re)written
only if ✓ the diff touches files under the page's subject paths, or ✓ the page
is newly needed because the diff introduces a public entry point with no page.
Whole-tree regeneration is Forbidden; the map's `graph.json` is the only
whole-project artifact and it is tool-generated (0 model tokens).

**Determinism/closed-output rule** (per repo standard): the skill's report is a
fixed block; page frontmatter keys are enumerated; file naming is
kebab-case-derived from the source module path — no model-chosen names.

## Decisions to confirm

- D1 — Provenance frontmatter keys: `generated-by` + `source-unit` (+`updated`
  ISO date). **Chosen**: yes, minimal set; audit-docs matches on `generated-by`.
- D2 — `--review` export is opt-in per invocation, not automatic. **Chosen**:
  opt-in; review reports may contain pre-fix findings a public site shouldn't
  auto-publish.
- D3 — Where the adapter declaration lives: the target project's agent-guide
  documentation map (single source the skills already read). **Chosen**: yes.

## Acceptance criteria

- `npx skills add . --list` lists `generate-docs`; frontmatter has
  `user-invocable: true`, `version: 1.0.0`.
- The SKILL.md contains, verbatim-checkable: a `## Turn contract`, Step 0
  adapter-detection checklist (fixed order, first match wins), Allowed/Forbidden
  lists, a fixed output report block, a closing `→ Next:` example, the machine
  envelope emission rule, and a `## Portability` section — so opencode, codex,
  hermes, or Claude produce the same tree and the same report.
- Running the skill against a repo with no docs adapter declared produces the
  documented "not configured" report and envelope (`state: NEEDS_INPUT` with the
  declaration snippet to add) — it never guesses a site into existence.
- `execute-phase` SKILL.md's close-out mentions the `/generate-docs`
  recommendation gated on adapter presence; `audit-docs` SKILL.md contains the
  orphan/stale generated-page checklist item; both versions bumped.
- Template contains the optional `Docs site` block; `init-workspace`'s interview
  references it.
- CHANGELOG.md, CHANGELOG.es.md, README.md, README.es.md updated (bump-skill).

## Testing requirements

This repo has no app build; the gate is documented in `CLAUDE.md`:
- `npx skills add . --list` discovers all skills (including the new one).
- Markdown well-formed; all cross-references resolve (SKILL.md ↔ docs ↔ README
  tables).
- Manual dry-run transcript: exercise the skill's checklists on a fixture
  description (documented in `testing.md`) for the three adapter outcomes
  (Starlight detected / plain fallback / not configured).

## Dev scenarios

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| `docs:starlight-detected` | happy path, Starlight project | fixture repo layout with `astro.config.mjs` + `@astrojs/starlight` dep |
| `docs:not-configured` | no adapter declared and none detectable | empty fixture → NEEDS_INPUT envelope with declaration snippet |
| `docs:map-command-missing` | project declares no map command | map marked n/a in report; no model-inferred graph |
| `docs:map-output-invalid` | declared command emits non-conforming JSON | FAIL report citing the schema mismatch; no pages written |
| `docs:orphan-page` | unit deleted/renamed after generation | audit-docs flags the `source-unit` mismatch |

## Phases

- **P1 — Core skill**: `skills/generate-docs/SKILL.md` complete (adapter
  detection, incremental guides, fixed contracts, envelope, portability).
  Commits the planning artifacts.
- **P2 — Integrations**: knowledge-map + `--review` sections finalized;
  `execute-phase` close-out hand-off; `audit-docs` orphan check; template
  `Docs site` block + `init-workspace` interview line; bump-skill run.
- **P3 — Hardening**: the failure-mode scenarios above encoded as explicit
  checklist branches in the SKILL.md; cross-reference sweep; README tables and
  both changelogs verified; open the PR (final step).

## Deploy & rollback

n/a — merging is enough (docs/skills only). Rollback = revert PR.

## Open questions / risks

- R1: adapter detection on monorepos (multiple docs sites) — DEFERRED to
  `known-issues.md` with trigger "first monorepo user report".
- R2: minimal `nodes[]/edges[]` JSON shape may not fit every extractor —
  mitigated by documenting a tiny mapping recipe per named tool in the adapter
  section.

## Deliverables

`skills/generate-docs/SKILL.md`; edits to `skills/execute-phase/SKILL.md`,
`skills/audit-docs/SKILL.md`, `skills/init-workspace/SKILL.md`,
`template/` doc-map file; CHANGELOGs + READMEs (EN/ES); this feature folder.

## Post-merge next feature

`02-measured-perf-review` (independent; see `docs/features/ROADMAP.md`).
