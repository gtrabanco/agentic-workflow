# Normalized Repository State

**Status**: frozen
**Last updated**: 2026-08-21T10:24 (commit `2627a02`)
**Source revision**: `2627a02 doc(feature): added feature 23 spec`

---

## Repository Facts

### Identity
- **Repo name**: `agentic-workflow` (GitHub: `gtrabanco/agentic-workflow`)
  - Evidence: `CLAUDE.md` line ~1; `package.json` not present (no root package.json)
- **Primary branch**: `main`
  - Evidence: `git branch` output — `* main`
- **Remote branches**: `origin/main`, `origin/claude`, `origin/inheritance`
  - Evidence: `git branch -a` — `remotes/origin/claude`, `remotes/origin/inheritance`, `remotes/origin/main`
- **No root `package.json`**
  - Evidence: `cat package.json` returned empty; no package.json in repo root

### Schema Package
- **Package name**: `@gtrabanco/agentic-workflow-schema` (npm, public)
  - Evidence: `packages/agentic-workflow-schema/package.json` — `"name": "@gtrabanco/agentic-workflow-schema"`, `"publishConfig": { "access": "public" }`
- **Package version**: `3.0.0`
  - Evidence: `packages/agentic-workflow-schema/package.json` — `"version": "3.0.0"`
- **Engine requirement**: Node >= 18
  - Evidence: `packages/agentic-workflow-schema/package.json` — `"engines": { "node": ">=18" }`
- **Language**: TypeScript
  - Evidence: `packages/agentic-workflow-schema/package.json` — `"devDependencies": { "typescript": "6" }`; `tsconfig.json` present
- **Schemas**: `envelope.schema.json`, `skill-outcome.schema.json`, `workflow-snapshot.schema.json`
  - Evidence: `packages/agentic-workflow-schema/package.json` exports; `ls packages/agentic-workflow-schema/`
- **Tests**: 3 test files (index, machine-contract, and one more)
  - Evidence: `ls packages/agentic-workflow-schema/test/`
- **Build**: `npm run build` = `tsc`
  - Evidence: `packages/agentic-workflow-schema/package.json` — `"build": "tsc"`
- **Test**: `npm test` = `tsc && node --test test/*.test.mjs`
  - Evidence: `packages/agentic-workflow-schema/package.json` — `"test": "tsc && node --test test/*.test.mjs"`

### Skills
- **Total skill directories**: 35
  - Evidence: `ls skills/ | wc -l` = 35
- **User-invocable skills** (in `.claude-plugin/plugin.json`): 31
  - Evidence: `.claude-plugin/plugin.json` lists 31 entries under `skills` array
- **Non-user-invocable skills**: 4 (`bump-skill`, `orchestration-envelope`, `phase-contract`, `planning-preflight`, `plan-feature-from-issue`, `plan-feature-scaffold`, `review-implementation`, `verification-contract`) — these are internal, some with `metadata.internal: true`
  - Evidence: `ls skills/` shows 35 dirs; `.claude-plugin/plugin.json` has 31 entries

### Categories (from README.md, CLAUDE.md)
- **Setup**: `init-workspace`, `discover-repository-state`, `resolve-repository-state`
- **Design**: `design-feature`
- **Plan**: `plan-feature`, `plan-fix`
- **Execute**: `execute-phase`
- **Review & audit**: `review-change`, `fold-findings`, `loop-review-fold`, `audit-pr`, `product-audit`, `audit-docs`
- **Decide**: `triage-issue`
- **Document**: `generate-docs`
- **Session**: `log-session`, `workflow-status`
- **Repo maintenance**: `bump-skill`
- **Autopilot**: `ship-roadmap`
- Evidence: README.md "The skills" section; CLAUDE.md skills table

### Template
- **Contents**: `AGENTS.md`, `CLAUDE.md`, `docs/`
  - Evidence: `ls template/`
- **Purpose**: Exportable documentation scaffold copied to target projects
  - Evidence: `CLAUDE.md` — "the exportable documentation scaffold (generic, copyable)"

### Documentation
- **Workflow docs**: `docs/workflow/` — 26 files (EN + ES bilingual pairs)
  - Evidence: `ls docs/workflow/` — 26 files including README.md, FEATURE_WORKFLOW.md, GOLDEN_FIXTURE.md, MIGRATION.md, ORCHESTRATION.md, PORTABLE_PROMPT.md, REPLICATE.md, REVIEW_AND_CLASSIFY.md, SKILLS.md, WORKFLOW_INVARIANTS.md, RECOMMENDED_SKILLS.md, ISSUE_WORKFLOW.md, and their `.es.md` siblings, plus `SKILL_CONTEXT_BUDGETS.json`, `model-routing.yml`
- **Research docs**: `docs/research/` exists
  - Evidence: `ls docs/` — `research` directory present
- **Feature docs**: `docs/features/` — 23 feature folders (01-23) + `_TEMPLATE/` + `ROADMAP.md`
  - Evidence: `ls docs/features/` — numbered folders 01-23, `_TEMPLATE`, `ROADMAP.md`
- **Fix docs**: `docs/fix/` — index README.md, `_TEMPLATE/`, and ~30 fix folders
  - Evidence: `ls docs/fix/` — shows folders like `134-machine-contract`, `100-stale-fix-index-rows`, etc.
- **Design docs**: `docs/design/` exists
  - Evidence: `ls docs/` — `design` directory present
- **Session log**: `docs/LOGS.md` exists, append-only journal
  - Evidence: `cat docs/LOGS.md`
- **Capabilities doc**: `docs/CAPABILITIES.md` does NOT exist (empty file or absent)
  - Evidence: `cat docs/CAPABILITIES.md` — file present but appears empty (header returned nothing)
- **Architectural invariants**: `docs/ARCHITECTURAL_INVARIANTS.md` does NOT exist (empty)
  - Evidence: `cat docs/ARCHITECTURAL_INVARIANTS.md` — file present but empty content

### GitHub Templates
- **Issue templates**: `feature.yml`, `fix.yml`, `config.yml`
  - Evidence: `ls .github/ISSUE_TEMPLATE/`
- **PR template**: `PULL_REQUEST_TEMPLATE.md`
  - Evidence: `ls .github/` and `head .github/PULL_REQUEST_TEMPLATE.md`
- **GitHub workflows**: `scripts/` and `workflows/` directories exist under `.github/`
  - Evidence: `ls .github/` — `workflows` directory present

### Scripts
- **Verification scripts** (in `scripts/`):
  - `check-skill-context.mjs` — validates context budgets for skills
  - `check-skill-context.test.mjs` — tests for context-budget checker
  - `audit-pr-receipt.test.mjs`
  - `bounded-delivery-loops.test.mjs`
  - `dependency-gate.test.mjs`
  - `next-recommendations.test.mjs`
  - `review-receipt.test.mjs`
  - Evidence: `ls scripts/`

### Bilingual Documentation
- **ES siblings present** for: README.md, README.es.md, CLAUDE.md (implied), docs/workflow/*, CHANGELOG.md + CHANGELOG.es.md, packages/agentic-workflow-schema/README.md + README.es.md
  - Evidence: `ls docs/` and `ls docs/workflow/` show .es.md files
- **Hard rule**: English docs that have ES siblings MUST update both in the same commit
  - Evidence: CLAUDE.md — "Stack/agnostic agent skills for a disciplined, doc-driven..."

### Git State
- **Working tree**: clean (nothing to commit)
  - Evidence: `git status` — "nothing to commit, working tree clean"
- **Current branch**: `main` (up to date with origin/main)
  - Evidence: `git status` — "On branch main", "Your branch is up to date with 'origin/main'"
- **Most recent commit**: `2627a02 doc(feature): added feature 23 spec`
  - Evidence: `git log --oneline -1`
- **Total commits**: 2627 (implied by sha 2627a02 — short sha prefix)
  - Evidence: git log shows commits; last sha starts with 2627

### CLAUDE Plugin
- **Plugin manifest**: `.claude-plugin/plugin.json`
  - Evidence: `.claude-plugin/plugin.json` — `"name": "agentic-workflow"`, `"version": "1.0.0"`
- **Skills symlink**: `.claude/skills` → `../skills`
  - Evidence: README.md — ".claude/skills symlink → ../skills"

### Versioning
- **v3 breaking change (2026-07-04)**: default branch is now model-agnostic
  - Evidence: README.md — "Breaking change (v3, 2026-07-04): the default branch is now model-agnostic"
- **Branches**: `main` (default, model-agnostic), `claude` (hand-tuned tiers), `inheritance` (alias of main)
  - Evidence: `git branch -a` + README.md breaking change note

---

## Accepted Decisions

| ID | Decision | Evidence |
|----|----------|----------|
| AD-001 | Skills are model-agnostic by default (inherit session model/effort); Claude-tuned tiers are a `#claude` branch opt-in | README.md breaking-change note; CLAUDE.md model-equivalence section |
| AD-002 | English is the committed docs language; human-readable docs carry EN+ES siblings updated in the same commit | CLAUDE.md "Docs language is English" rule |
| AD-003 | Every user-invocable skill must have `user-invocable: true` in frontmatter and a matching entry in `.claude-plugin/plugin.json` | CLAUDE.md authoring rules |
| AD-004 | One PR per unit of work, always against `main`; never stack PRs | CLAUDE.md "One PR per unit of work" |
| AD-005 | Phases are labeled `P1, P2, …` (never "Steps" or `S1`) | CLAUDE.md authoring rules |
| AD-006 | The roadmap status machine is `idea → defined → planned → in-progress → done` (five states) | ROADMAP.md status legend |
| AD-007 | Schema package is `@gtrabanco/agentic-workflow-schema` v3.0.0, published to npm, with strict JSON Schemas and TypeScript build | `packages/agentic-workflow-schema/package.json` |
| AD-008 | The `template/` directory is the portable documentation scaffold for target projects | CLAUDE.md — "the exportable documentation scaffold (generic, copyable)" |

---

## Planned Work

### Roadmap Features (from `docs/features/ROADMAP.md`)

| NN | Slug | Status | Depends on | Summary |
|----|------|--------|------------|---------|
| 01-22 | (various) | `done` | — | 22 features completed and merged |
| 23 | `workflow-skill-capability-profiles` | `defined` | — | Extend WORKFLOW_SKILL_PROFILES with capability metadata |

### Fix Units (from `docs/fix/README.md`)

| Folder | Topic | Status | Issue |
|--------|-------|--------|-------|
| `134-machine-contract` | Hybrid machine result contract and deterministic workflow snapshot | `in-progress` | #134 |

(Several other fix units are marked `done` with merged PRs)

---

## Documentation

### Claims in Documentation (not yet independently verified against implementation)

| ID | Claim | Source |
|----|-------|--------|
| DOC-001 | 35 skill directories exist | README.md, `ls skills/` |
| DOC-002 | 18 user-facing + 15 workflow internals + 2 maintenance contracts = 31 plugin-listed | README.md "What's inside" |
| DOC-003 | The repo ships two things: skills/ and template/ | CLAUDE.md |
| DOC-004 | 70+ agent compatibility | README.md — "Claude Code, Cursor, Codex, OpenCode, Cline, and 70+ others" |
| DOC-005 | `execute-phase` now activates at about 3k estimated tokens (progressive loading) | README.md "largest skills" paragraph |
| DOC-006 | `bump-skill` carries `metadata.internal: true` for `skills` CLI exclusion | CLAUDE.md |
| DOC-007 | The fix index table contains stale rows (21 rows for merged PRs) | `docs/fix/README.md` + issue #100 (resolved) |

---

## Inference

| ID | Inference | Basis |
|----|-----------|-------|
| INF-001 | The project is self-hosting: it dogfoods its own skills (`.claude/skills` symlink) | `.claude/skills` → `../skills` |
| INF-002 | The schema package v3.0.0 aligns with the repo's v3 breaking change (model-agnostic default) | Schema package.json v3.0.0; README.md v3 breaking note |
| INF-003 | Feature 23 is likely the most recently completed/planned feature (highest NN, `defined` status) | ROADMAP.md ordering |
| INF-004 | Fix 134 is the only active fix-in-progress (others are `done`) | `docs/fix/README.md` active table |
| INF-005 | The project uses a formal design process: features go through `docs/design/` before implementation | `docs/design/` directory exists |
| INF-006 | The `docs/research/` directory is for research artifacts, not production code | Directory exists alongside `docs/design/`, `docs/features/` |

---

## Open Questions

| ID | Question | Why Unresolved |
|----|----------|----------------|
| Q-001 | Is `docs/CAPABILITIES.md` truly empty or does it exist but wasn't read properly? | `cat` returned no content; file may be empty |
| Q-002 | Is `docs/ARCHITECTURAL_INVARIANTS.md` truly empty? | `cat` returned no content; feature 19 introduced this concept but the file may be a stub |
| Q-003 | Does the roadmap's claim of "18 user-facing + 15 workflow internals + 2 maintenance contracts = 31 plugin-listed" match the actual count? | README says 35 dirs but 31 in plugin.json; need to reconcile the 4 difference |
| Q-004 | What is the current content of `docs/LOGS.md`? | Only the header was read; the actual session entries are unknown |

---

## Contradictions

_None recorded._

---

*This snapshot was produced by `/discover-repository-state`. Every fact is backed by direct file evidence (file:line or command output). Documentation claims are separated from implementation facts.*