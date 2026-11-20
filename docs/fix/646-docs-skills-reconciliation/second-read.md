# Second full read — 646 docs + skills reconciliation

The S5/S5a hunter pass: every in-scope file, three lenses (duplicates, dead
docs, missing architecture), each finding with line-level evidence and a route.
Nothing here is a keyword sweep presented as a read — the coverage block at the
bottom is derived from the tree by `scripts/reading-coverage.mjs`, which refuses
an unrowed in-scope file, so a file this pass skipped is visible instead of
counted.

Depth is declared per row: `full` means the file was read end-to-end in this
session, `scanned` means it was read structurally — headings, owner pointers,
the unit's own patterns — and is disclosed as such. The claim this pass makes is
the one a machine can check: every in-scope file is accounted for, at a stated
depth, with the evidence for that depth named.

## Scope

The S5a list, made executable: every `SKILL.md` and every file under every
`skills/*/references/`, all of `docs/workflow/`, `docs/design/`, `docs/research/`,
`docs/assets/`, `docs/passive/`, `docs/pre-spec/`, `docs/telemetry/`, the
top-level `docs/*.md` and `docs/*.json`, all of `template/`, and the `.github/`
templates. Frozen unit history is out of scope by the issue's own boundary
(`docs/features/**`, `docs/fix/**` — this unit excepted), as is the aggregated
`docs/LOGS.md` and the emitted `docs/generated/**`: those are records, never
edited for currency, and a broken reference inside one is a new correcting
commit, not a rewrite.

## Findings

| id | file:line | lens | finding | evidence | route |
|---|---|---|---|---|---|
| F-S5-1 | `template/AGENTS.md:613-618` | shared content / distributability | The scaffold guide hardcoded `main` as the PR base — the same defect class as the four executor sites (A4), in the domain S5a asks to classify: a target project whose default branch is not `main` would be directed at the wrong branch by the scaffold it just adopted | `rg -n 'always against `main`' template/AGENTS.md` matched the PR & branch section; the product's own rule (`AGENTS.md` § Working rules) says the default branch | fix-now — landed in this unit |
| F-S5-2 | `docs/workflow/README.md:97` | dead statement | The tutorial's map still said "The unattended-conductor role is deferred to roadmap row 62", while row 62 is `done · [#254]` | `rg -n '^\| 62 \|' docs/ROADMAP.md` → `done · [#254]`; the sentence contradicted it | fix-now — landed in this unit |
| F-S5-3 | `docs/assets/ship-roadmap.png` | dead asset | Asset of the retired `ship-roadmap` skill (retired at feature 61 P9); no reader names it — `README.md` references only `logo.svg`, and the two other matches are frozen unit history and a research note describing the past | `rg -ln 'ship-roadmap.png' --glob '!docs/LOGS.md'` → the file itself plus frozen history; `rg -n 'assets/' README.md` → `logo.svg` only | delete-with-approval (R1) |
| F-S5-4 | `docs/design/REDESIGN.md:3` | false status | The design doc still declared itself "draft for review. Pin this down before touching any skill" although the router, the internal composition and the audit skills it proposed all shipped; it also carried a per-skill `model:`/`effort:` requirement that the portability contract has since forbidden, and the retired Notion mirror | read in full; the shipped state is `skills/orchestration-envelope/references/PORTABILITY.md` and `docs/workflow/SKILLS.md` | fix-now — landed in this unit (status marked historical; both stale claims named) |
| F-S5-5 | `docs/workflow/WORKFLOW_INVARIANTS.md` | duplicate | A second copy of the AI-001 entry template, naming neither the project doc that owns the shape nor being named by it | both files read; the workflow doc's own protocol step 1 sends a reader to the project doc | fix-now — landed in this unit (B5/D3) |
| F-S5-6 | `docs/workflow/PORTABLE_PROMPT.md` | apparent duplicate | The bootstrap prompt enumerates the skill set and the workflow's step names — a restatement of `SKILLS.md`'s subject matter | read end-to-end: it is a **self-contained prompt** whose whole purpose is to be pasted where no repository exists, so it cannot cite a file | sanctioned by design — recorded in the restatement corpus as a scope exclusion (it is not in any row's scope) |
| F-S5-7 | `docs/workflow/GATE_INVENTORY.md` | healthy contrast | Nine sanctioned copies of prose rules, **each carrying its owner pointer** — the pattern the B/D tables lacked | read in full | no finding — this is the pattern the unit copies |
| F-S5-8 | `docs/telemetry/schema.json` | missing architecture information | The telemetry schema's machine home is the schema package (`packages/agentic-workflow-schema/src/telemetry.ts`), and this file is the committed projection a suite reads | `rg -ln 'docs/telemetry/schema.json'` → the schema package module plus suites | no finding — the owner exists and is named |
| F-S5-9 | `.github/ISSUE_TEMPLATE/fix.yml` | missing architecture information | The fix template's fields map 1-to-1 to `docs/fix/_TEMPLATE/SPEC.md`, and its language note matches the permanent English-only rule | read end-to-end | no finding |
| F-S5-10 | `docs/workflow/MIGRATION.md` | obsolete sections | 1,089 lines of upgrade guidance from the previous skill set, with rename tables for skills that no longer exist | read structurally: the tables describe an install that predates the re-cut; nothing in the tree declares it superseded, and it is the only documented upgrade path for an older install | keep — deleting it would remove the one route an old install has (R2, declined) |
| F-S5-11 | `skills/*/SKILL.md`, `skills/*/references/*.md` | duplicates (D-table) | The eleven restatement sites the issue's D-table names (red-first ×3, weaker-than-author ×6, no-slash ×5, branch rule ×4, inline-degrade, conventional commits, relay tiers) | each row of the D-table re-read at its line; see `SPEC.md` § Specs S6 | fix-now — landed in this unit |
| F-S5-12 | `AGENTS.md` § Working rules | decision vs practice | The stack-agnostic rule and the ten host-agent names contradicted each other, with no carve-out recorded anywhere | `rg -c 'Claude Code' skills/` plus each portability section; the classification below | fix-now — landed in this unit (D6) |

### Host-agent naming, classified against the new carve-out (S6a)

The carve-out sanctions a host-agent name where a portability or adapter feature
requires it. Every occurrence in the skills tree, classified:

| site | what it says | class |
|---|---|---|
| `skills/*/SKILL.md` `## Portability` sections (9 skills) | "preamble + no-slash fallback: owned by `PORTABILITY.md`" | sanctioned — the section exists precisely to name the host feature being replaced |
| `skills/orchestration-envelope/references/PORTABILITY.md` | the workflow's host-feature map ("Claude Code features are conveniences") | sanctioned — the owner of the no-slash fallback |
| `skills/init-workspace/**` (6 sites) | the adapter offer: Claude Code, Cursor, Copilot, OpenCode | sanctioned — an adapter feature, the one the rule's carve-out names |
| `skills/review-change/references/ADVERSARIAL_SETUP.md` | host-specific paste blocks | sanctioned — portability of an adversarial setup |
| `skills/skill-lint/SKILL.md` | the `## Portability` requirement for a user-facing skill | sanctioned — the authoring rule about the section |
| `skills/log-session/SKILL.md`, `skills/product-audit/SKILL.md` | the no-hooks fallback | sanctioned — host hooks are the feature being replaced |
| `skills/{audit-pr,review-change,workflow-status}/references/PORTABILITY.md` | the per-skill portability reference: the `## Portability (agents other than Claude Code)` heading, plus `review-change`'s Claude Code subagent-tier note and `workflow-status`'s no-dependency sentence | sanctioned — a skill's portability surface, the carve-out's own category |
| no other site | — | — |

No unsanctioned product naming survives: every occurrence is a portability or
adapter statement, and the rule now says so in its own text.

## Obsolete-removal list (ask-first)

Each row carries its evidence and its **landing state**. Nothing here landed
without the owner's approval, and a declined row stays in the tree with the
reason recorded here — never silently.

### R1 — `docs/assets/ship-roadmap.png` (proposed deletion)

- **evidence:** the skill it illustrates was retired at feature 61 P9; `rg -ln
  'ship-roadmap.png' --glob '!docs/LOGS.md' --glob '!docs/features/**'` finds no
  live reader, and `README.md` embeds only `docs/assets/logo.svg`.
- **replacement:** none needed — the retired skill's routing lives in
  `workflow-status` / `unit-lane`, and no doc embeds the image.
- **landing state:** `awaiting owner approval` — the batch below is offered as one
  decision, and the file is *not* deleted by this unit's own commits.

### R2 — `docs/workflow/MIGRATION.md` (proposed deletion)

- **evidence:** describes an install that predates the current skill set (its
  rename tables name skills that no longer exist); nothing in the tree claims it
  current.
- **why declined now:** it is the only documented upgrade path for an installation
  older than the released skill set; deleting it would remove that route without
  a replacement.
- **landing state:** `declined` — kept, with the reason recorded here.

### R3 — the Notion mirror citations (deleted, pre-authorized)

- **evidence:** `docs/workflow/README.md:8` and `docs/design/REDESIGN.md:237`
  claimed a reader-friendly external mirror with no sync mechanism, no
  normativity declaration and no way to verify it from the tree.
- **landing state:** `landed` — both citations deleted (`D2`), the owner having
  retired the mirror on 2026-11-19 in the issue itself.

### R4 — `docs/design/REDESIGN.md` (status repaired, not deleted)

- **evidence:** see `F-S5-4`.
- **landing state:** `landed` (status marked historical, both stale claims named).
  Deletion was rejected: the design rationale has no other home.

## Measurements (S4 receipts)

| what | measured | how |
|---|---|---|
| the guide's stable prefix (bytes before the machine regions, which a unit re-pins) | 28,094 of 52,439 B (53%) at the cut head → 32,569 of 54,707 B (59%) at this head | `bun scripts/check-skill-context.mjs --documents` for the line/machine/prose split, plus the byte offsets of the `### Normalizer inventory` heading in `git show ab8fad926:AGENTS.md` and the head |
| bytes a machine-region edit invalidates | 24,345 → 22,124 B (−9.1%) | the same offsets |
| a typical `unit-lane` task (one triage-plus-plan pass) | guide 54,7xx B + lane skill 20,692 B + plan reference 17,041 B = ~92 kB, the guide being 59% | `wc -c AGENTS.md skills/unit-lane/SKILL.md skills/unit-lane/references/PLAN.md` |
| every budgeted document and skill after the conversions | PASS (docs 6 · skills 30) | `bun scripts/check-skill-context.mjs --documents` and `bun scripts/check-skill-context.mjs` |

The guide's byte counts move with its own edits, so this receipt records the
measurement of the change, never a live number a reader should trust: re-run the
commands for today's value. That is also why `LOADING.md` states the ratios and
points here for the receipt.

## Coverage

Every in-scope file, with the depth it was read at:

```text
reading-coverage@1
# excluded: docs/LOGS.md — frozen history, aggregated by the journal workflow, never edited for currency
# excluded: docs/features/ — frozen unit history (the issue's S3 boundary)
# excluded: docs/fix/ — frozen unit history, this unit's own folder excepted
# excluded: docs/generated/ — emitted projection, written by docs-generate only
file | tier | depth | evidence
.github/ISSUE_TEMPLATE/config.yml | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
.github/ISSUE_TEMPLATE/feature.yml | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
.github/ISSUE_TEMPLATE/fix.yml | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
.github/PULL_REQUEST_TEMPLATE.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
.github/workflows/agentic-workflow-journal.yml | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
.github/workflows/pin-watch.yml | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
.github/workflows/publish.yml | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
.github/workflows/root-suite.yml | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
AGENTS.md | 1-on-demand | full | read end-to-end this session
README.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/CAPABILITIES.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/ROADMAP.md | 1-on-demand | full | read end-to-end this session
docs/architecture/ARCHITECTURAL_INVARIANTS.md | 1-on-demand | full | read end-to-end this session
docs/architecture/ARCHITECTURE.md | 1-on-demand | full | read end-to-end this session
docs/assets/logo.svg | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/assets/nan-cloud.svg | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/assets/nan-model-routing-cheatsheet.pdf | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/assets/ship-roadmap.png | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/audits/1-2026-11-08.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/audits/2-2026-11-16.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/design/REDESIGN.md | 1-on-demand | full | read end-to-end this session
docs/fix/646-docs-skills-reconciliation/SPEC.md | 1-on-demand | full | read end-to-end this session
docs/fix/646-docs-skills-reconciliation/decisions.md | 1-on-demand | full | read end-to-end this session
docs/fix/646-docs-skills-reconciliation/planning-evidence.md | 1-on-demand | full | read end-to-end this session
docs/fix/646-docs-skills-reconciliation/planning-obligations.md | 1-on-demand | full | read end-to-end this session
docs/fix/646-docs-skills-reconciliation/second-read.md | 1-on-demand | full | read end-to-end this session
docs/passive/2026-11-09-declare-docs-site.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/passive/2026-11-10-park-269-verify-findings.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/passive/2026-11-15-settle-odd-hybrid-direction.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/pre-spec/2026-11-17-526-elicitation-layer.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/research/2026-11-12-input-quality-and-editing/README.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/research/2026-11-12-input-quality-and-editing/papers-sweep.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/research/2026-11-13-tool-doctor-inventory.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/research/2026-11-15-all-code-is-slop-mapping.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/research/2026-11-16-product-audit-extensibility.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/research/2026-11-17-issue-621-claimed-surface-verification.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/research/284-pi-durable-spike.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/research/ATTRIBUTION.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/research/agentic-workflow-machine-contract-options.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/research/model-routing-2026-08-22.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/research/papers-sweep-2026-11-02.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/research/papers-sweep-2026-11-06-merge-gates.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/telemetry/schema.json | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/workflow/CONFIG.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/workflow/DOMAIN_SEPARATION.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/workflow/FEATURE_WORKFLOW.md | 1-on-demand | full | read end-to-end this session
docs/workflow/FEEDBACK.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/workflow/GATE_INVENTORY.md | 1-on-demand | full | read end-to-end this session
docs/workflow/GIT_IDENTITY_HARDENING.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/workflow/GOLDEN_FIXTURE.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/workflow/ISSUE_WORKFLOW.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/workflow/LANE_FLOW.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/workflow/LOADING.md | 1-on-demand | full | read end-to-end this session
docs/workflow/MIGRATION.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/workflow/ORCHESTRATION.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/workflow/PACKAGES.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/workflow/PORTABLE_PROMPT.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/workflow/README.md | 1-on-demand | full | read end-to-end this session
docs/workflow/RECOMMENDED_SKILLS.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/workflow/REPLICATE.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/workflow/REPOSITORY_STATE.md | 1-on-demand | full | read end-to-end this session
docs/workflow/RETENTION.md | 1-on-demand | full | read end-to-end this session (the #660 integration)
docs/workflow/REVIEW_AND_CLASSIFY.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/workflow/SEAM_HOOKS.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/workflow/SETUP.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/workflow/SKILLS.md | 1-on-demand | full | read end-to-end this session
docs/workflow/SKILL_AUTHORING.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/workflow/SKILL_CONTEXT_BUDGETS.json | 1-on-demand | full | read end-to-end this session
docs/workflow/TIER_COST.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
docs/workflow/WORKFLOW_INVARIANTS.md | 1-on-demand | full | read end-to-end this session
docs/workflow/WORKTREES.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/audit-docs/SKILL.md | 1-on-demand | full | read end-to-end this session
skills/audit-docs/references/RESTATEMENT.md | 1-on-demand | full | read end-to-end this session
skills/audit-pr/SKILL.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/audit-pr/references/01_MERGE_GATES.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/audit-pr/references/03_AUDIT_PROCESS.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/audit-pr/references/04_VERDICT.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/audit-pr/references/05_ROUTING_AND_GUARDRAILS.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/audit-pr/references/PORTABILITY.md | 1-on-demand | full | read end-to-end this session
skills/batch-scheduler/SKILL.md | 1-on-demand | full | read end-to-end this session
skills/batch-scheduler/references/PLAN.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/discover-repository-state/SKILL.md | 1-on-demand | full | read end-to-end this session
skills/execute-phase/SKILL.md | 1-on-demand | full | read end-to-end this session
skills/execute-phase/references/DESCOPE.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/execute-phase/references/EXECUTION_CONTRACT.md | 1-on-demand | full | read end-to-end this session
skills/execute-phase/references/FOLDING.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/execute-phase/references/FORGE_BODY.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/execute-phase/references/PREFLIGHT.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/execute-phase/references/PRE_EXECUTION_GATE.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/execute-phase/references/TEST_IMPACT.md | 1-on-demand | full | read end-to-end this session
skills/execute-phase/references/risk-tiers.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/fold-findings/SKILL.md | 1-on-demand | full | read end-to-end this session
skills/fold-findings/references/FOLD_POLICY.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/fold-findings/references/FOLD_PROCESS.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/fold-findings/references/NIMIO.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/init-workspace/SKILL.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/init-workspace/references/BOOTSTRAP_WRITE.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/init-workspace/references/CONFIG.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/init-workspace/references/ENGINEERING_INTERVIEW.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/init-workspace/references/ENGRAM.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/init-workspace/references/MATERIALIZATION.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/init-workspace/references/PERMISSIONS.md | 2-rarely | full | read end-to-end this session (the #660 integration; this row repairs origin/main shipping the file unrowed)
skills/init-workspace/references/PORTABILITY.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/init-workspace/references/SERENA.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/init-workspace/references/UPGRADE.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/log-session/SKILL.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/orchestration-envelope/SKILL.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/orchestration-envelope/references/PORTABILITY.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/orchestration-envelope/references/TURN_CONTRACT.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/phase-contract/SKILL.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/pre-execution-review/SKILL.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/pre-execution-review/references/LEDGERS.md | 1-on-demand | full | read end-to-end this session
skills/pre-execution-review/references/POLICY.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/pre-execution-review/references/SNAPSHOT.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/product-audit/SKILL.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/product-audit/references/AUDIT_DIMENSIONS.md | 1-on-demand | full | read end-to-end this session
skills/product-audit/references/AUDIT_PROCESS.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/resolve-repository-state/SKILL.md | 1-on-demand | full | read end-to-end this session
skills/resolve-repository-state/references/STATE_CONTRACT.md | 1-on-demand | full | read end-to-end this session
skills/review-a11y/SKILL.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/review-brand/SKILL.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/review-change/SKILL.md | 1-on-demand | full | read end-to-end this session
skills/review-change/references/ADVERSARIAL_RECOMMENDATION.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/review-change/references/ADVERSARIAL_SETUP.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/review-change/references/ADVERSARIAL_SYNTHESIS.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/review-change/references/OUTPUT_AND_GUARDRAILS.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/review-change/references/PERSIST_AND_DECIDE.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/review-change/references/PORTABILITY.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/review-change/references/REVIEW_PROCESS.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/review-code/SKILL.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/review-debt/SKILL.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/review-design/SKILL.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/review-implementation/SKILL.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/review-implementation/references/CLASSIFY.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/review-implementation/references/FIND.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/review-implementation/references/FINDER_CONTRACT.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/review-perf/SKILL.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/review-security/SKILL.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/review-seo/SKILL.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/review-verify/SKILL.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/runner-contract/SKILL.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/runner-contract/references/RUNNER.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/skill-lint/SKILL.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/skill-lint/references/CHECKS.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/skill-lint/references/DISCOVERY_AND_LINT.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/triage-issue/SKILL.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/triage-issue/references/AUDIT_FINDINGS.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/triage-issue/references/FOLD_LEDGER.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/triage-issue/references/ISSUE_PROCESS.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/triage-issue/references/LABELS.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/triage-issue/references/RECEIPTS.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/triage-issue/references/REVIEW_FINDING_PROCESS.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/unit-lane/SKILL.md | 1-on-demand | full | read end-to-end this session
skills/unit-lane/references/DESIGN.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/unit-lane/references/DOCS.md | 1-on-demand | full | read end-to-end this session
skills/unit-lane/references/ELICITATION.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/unit-lane/references/EVIDENCE.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/unit-lane/references/IMPLEMENT.md | 1-on-demand | full | read end-to-end this session
skills/unit-lane/references/MEMORY.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/unit-lane/references/ORCHESTRATE.md | 1-on-demand | full | read end-to-end this session
skills/unit-lane/references/PLAN.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/unit-lane/references/RELAY.md | 1-on-demand | full | read end-to-end this session
skills/unit-lane/references/RELEASE.md | 1-on-demand | full | read end-to-end this session
skills/unit-lane/references/RESEARCH.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/unit-lane/references/REVIEW.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/unit-lane/references/STEPS.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/unit-lane/references/TESTS.md | 1-on-demand | full | read end-to-end this session
skills/verification-contract/SKILL.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/workflow-status/SKILL.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/workflow-status/references/CRASH_RECOVERY.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/workflow-status/references/ENVELOPE_CORE.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/workflow-status/references/ENVELOPE_FIELDS.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/workflow-status/references/GUARDRAILS.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/workflow-status/references/PORTABILITY.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/workflow-status/references/PRE_EXECUTION.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/workflow-status/references/SENSOR_CORE.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
skills/workflow-status/references/SENSOR_SIGNALS.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.agentic-workflow/hooks/README.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.agentic-workflow/hooks/adapters/copilot-guard.sh | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.agentic-workflow/hooks/adapters/normalize-hook-payload.sh | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.agentic-workflow/hooks/adapters/pre-tool-guard.sh | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.agentic-workflow/hooks/fullauto-merge.sh | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.agentic-workflow/hooks/git-identity-check.sh | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.agentic-workflow/hooks/guard-allow.txt | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.agentic-workflow/hooks/guard-command.sh | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.agentic-workflow/hooks/index-sync.sh | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.agentic-workflow/hooks/secret-scan.sh | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.agentic-workflow/hooks/tests/test-command-guard.sh | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.agentic-workflow/hooks/tests/test-fullauto-merge.sh | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.agentic-workflow/hooks/tests/test-git-identity-check.sh | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.agentic-workflow/hooks/tests/test-hook-shims.sh | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.agentic-workflow/hooks/tests/test-index-consent.sh | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.agentic-workflow/hooks/tests/test-index-sync.sh | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.agentic-workflow/hooks/tests/test-init-workspace-contract.sh | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.agentic-workflow/hooks/tests/test-opencode-guard.sh | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.agentic-workflow/hooks/tests/test-secret-scan.sh | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.agentic-workflow/hooks/tests/test-turn-contract.sh | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.agentic-workflow/hooks/turn-contract.sh | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.agentic-workflow/journal.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.agentic-workflow/path-policy.json | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.agentic-workflow/path-protection.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.claude/README.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.claude/hooks/log-session-end.sh | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.claude/hooks/log-session-start.sh | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.claude/hooks/restore-context.sh | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.claude/settings.json.example | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.cursor/hooks.json.example | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.github/ISSUE_TEMPLATE/config.yml | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.github/ISSUE_TEMPLATE/feature.yml | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.github/ISSUE_TEMPLATE/fix.yml | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.github/PULL_REQUEST_TEMPLATE.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.github/hooks/agentic-workflow.json.example | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.github/workflows/agentic-workflow-journal.yml.example | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/.opencode/plugins/agentic-workflow-guard.ts.example | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/AGENTS.md | 1-on-demand | full | read end-to-end this session
template/docs/CAPABILITIES.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/docs/LOGS.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/docs/architecture/ARCHITECTURAL_INVARIANTS.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/docs/architecture/ARCHITECTURE.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/docs/brand/BRAND.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/docs/business/README.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/docs/domain/README.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/docs/features/ROADMAP.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/docs/features/_TEMPLATE/SPEC.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/docs/fix/README.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/docs/fix/_TEMPLATE/SPEC.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/docs/frontend/ACCESSIBILITY.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/docs/frontend/COPYWRITING.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/docs/frontend/DESIGN.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/docs/frontend/I18N.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/docs/frontend/SEO.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/docs/infrastructure/README.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/docs/legal/README.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/docs/providers/_TEMPLATE.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/docs/workflow/BOUNDARY_ENFORCEMENT.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/docs/workflow/FEATURE_MAP.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/docs/workflow/GIT_IDENTITY_HARDENING.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/docs/workflow/REPOSITORY_STATE.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
template/docs/workflow/VERIFICATION_CRITERIA.md | 2-rarely | scanned | structural scan: headings, owner pointers and the unit's patterns
```

Re-run the claim with:

```sh
bun scripts/reading-coverage.mjs --scope docs-skills
```
