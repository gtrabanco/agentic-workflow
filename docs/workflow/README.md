# Agentic workflow

How we build with agentic programming in this repo: the end-to-end flow for a
**feature** and for an **issue** through the adaptive lane, the **skills** that
drive each step, and how to **replicate** the whole system in another project.

This is the versioned, in-repo copy.

## Pages

| Doc | What it covers |
|---|---|
| [LANE_FLOW.md](LANE_FLOW.md) | How a unit flows through the adaptive lane: lifecycle, triage rules, guards, evidence, review, deterministic next-step, command cheat-sheet, and programmatic contract |
| [FEATURE_WORKFLOW.md](FEATURE_WORKFLOW.md) | Idea/issue → SPEC + artifacts → phase execution → hardening → review → audit → PR |
| [ISSUE_WORKFLOW.md](ISSUE_WORKFLOW.md) | Triage → classify (one-shot / fix-now / fix-in-unit / promote / postpone / wontfix / remove) → route → report |
| [SKILLS.md](SKILLS.md) | Every skill in the system, what it does, and how they compose |
| [SKILL_AUTHORING.md](SKILL_AUTHORING.md) | The authoring contract for a skill: frontmatter, body sections, the closing `→ Next:` block, the hand-off-versus-compose rule across model tiers, and the guide shape a target project's scaffold must follow |
| [REVIEW_AND_CLASSIFY.md](REVIEW_AND_CLASSIFY.md) | When & how to review — `review-change` (the right reviews per platform) and its `review-implementation` engine (find → classified decision table) |
| [RECOMMENDED_SKILLS.md](RECOMMENDED_SKILLS.md) | Agnostic software-quality & architecture skills for good agentic programming — universal vs. conditional-by-project-nature; stack/infra skills out of scope |
| [REPLICATE.md](REPLICATE.md) | `npx skills` install — replicate the skill system in another project |
| [PORTABLE_PROMPT.md](PORTABLE_PROMPT.md) | The self-contained prompt that regenerates the whole system inside a target repository, adapted to that project's stack — the bootstrap `REPLICATE.md` points at |
| [SETUP.md](SETUP.md) | Provisioning **this repo's** own authoring toolchain: `node scripts/setup-env.mjs`, the `--check` verification, committed vs local state, the worktree resetup, and the Windows-via-WSL note |
| [MIGRATION.md](MIGRATION.md) | Upgrading an existing install from the previous skill set — what was renamed, what to delete |
| [SEAM_HOOKS.md](SEAM_HOOKS.md) | Workflow seam hooks for target projects (issue #413): consent-gated, opt-in per seam, hooks.json-compatible declarations executed deterministically at the workflow's lifecycle points — the workflow-level view; the machine contract lives in the pi package README |
| [ORCHESTRATION.md](ORCHESTRATION.md) | Programmatic orchestration: the machine envelope and `workflow-status` result an external driver reads at the invocation boundary, and how it composes with the repository documents |
| [REPOSITORY_STATE.md](REPOSITORY_STATE.md) | The frozen Normalized Repository State — the evidence-backed snapshot of observed truth that `discover-repository-state` writes and `resolve-repository-state` alone may replace |
| [GOLDEN_FIXTURE.md](GOLDEN_FIXTURE.md) | Golden fixture: the manual judgment protocol (run a changed executor-path skill against the committed toy fixture with the weakest fleet model) plus the executable `scripts/golden-fixture.test.mjs` suite that asserts its deterministic half |
| [WORKFLOW_INVARIANTS.md](WORKFLOW_INVARIANTS.md) | Portable contract for optional project architectural invariants and their evidence-based evaluation |
| [TIER_COST.md](TIER_COST.md) | The measured acceptance for the risk tiers: the `tier-cost@2` row grammar (`tier-cost@1` still read), who writes a sample, what a row never carries, and the `insufficient-corpus` verdict the comparison declares instead of inventing a figure |
| [CONFIG.md](CONFIG.md) | The unified config: the two files and two scopes, the fill-in resolution order, every feature section and its default, the `agentic-workflow config` CLI/API, and the `config-extension@1` plugin contract a package uses to publish its own section |
| [PACKAGES.md](PACKAGES.md) | The 4 companion npm packages: the bun workspace and its single lockfile, the pin rules, the version-parity gate, changesets, and the publish channels |
| [GIT_IDENTITY_HARDENING.md](GIT_IDENTITY_HARDENING.md) | Git identity & signing hardening: the two layers (agent config-write guard, fail-fast commit/push verification), the one `gitIdentity` profile with its corporate case, the opt-in pre-commit hook, the `-c`-only fixture convention, and the recommended environment layout applied by no default |
| [GATE_INVENTORY.md](GATE_INVENTORY.md) | The carrier inventory: every gate the workflow runs, whether it is script-pinned, a per-run CLI check or prose-only, how the ranking derives its tier, and where a stay-prose gate re-derives after a compaction |
| [FEEDBACK.md](FEEDBACK.md) | Every CLI's feedback contract: the three tiers (`--debug`, `--profile`), the `feedback:` line grammar, the stderr-only invariant, and what a command must report |
| [CLI.md](CLI.md) | The universal CLI as the project's sole distribution surface for runtime commands: why the scaffold ships no `scripts/` tree, the router and how a subcommand is added, the red-first script-migration pattern with its zero-logic shim, how a skill cites a command, and the coverage gate that refuses a path citation |
| [DOMAIN_SEPARATION.md](DOMAIN_SEPARATION.md) | Project-only: the product-vs-dogfooding safeguard in detail — the two domains, the classification test, both drift directions, the legitimate exceptions, and the domain-drift sweep this repo's product-audit runs carry |
| [RETENTION.md](RETENTION.md) | Document retention: the settled third unit-doc carrier, the eligibility predicate and its two merge proofs, the `doc archive`/`doc restore` write path with its byte-bound archive manifest, the trim ceremony declaration, the detection surfaces, and the reader contract a settle must not break |
| [LOADING.md](LOADING.md) | The loading ladder: which tier a document belongs to (always, one-hop, rarely), the balance rule behind tier 0, the stable-first/volatile-last ordering a prefix cache punishes when ignored, and the measurement method |
| [WORKTREES.md](WORKTREES.md) | Creating, naming, recovering and removing a worktree: where a worktree may live, the branch and worktree naming tables, the six ordered steps, the common failure modes, and the removal order |

## Data

Not pages — files this directory carries as machine input. Nothing here is a
reading surface, and `scripts/workflow-docs-index.test.mjs` keeps the split
exact: every other file in this directory must have a row above, and this one
must not have one.

| File | Consumed by |
|---|---|
| `SKILL_CONTEXT_BUDGETS.json` | `scripts/check-skill-context.mjs` (the enforced per-skill line/token budgets and route budgets) — read by the gate, never by a human, and cited as a claim source by `scripts/promise-coherence.mjs` |

## Core principles

The rules themselves have one owner — [`AGENTS.md`](../AGENTS.md) § Working
rules and § Inviolable rules — and this list is the tutorial's reading summary of
them: it cites them, it never words a stricter version, and where a principle has
an exception the exception travels with it. The mechanisms each one rests on are
linked, not restated.

1. **Docs drive the work.** Every skill reads the project's own guide
   (`AGENTS.md`), documentation map, architecture, roadmap, and style
   docs *first*, and respects them. The workflow adapts to the project, not the
   other way around.
2. **Plan before code.** Features get a SPEC + planning artifacts before a line
   is written (owner: [`skills/unit-lane/references/PLAN.md`](../../skills/unit-lane/references/PLAN.md)).
3. **One phase at a time.** Execution is phase-by-phase, each verified and
   committed separately (owner: [`skills/execute-phase/SKILL.md`](../../skills/execute-phase/SKILL.md)).
4. **One PR per unit, against the project's default branch.** Never work on
   `main` directly; never stack PRs. The one exception is the owner-applied
   inline-batch the guide records — a correction the owner orders lands straight
   on the default branch with no branch or PR, and it is never a licence an agent
   takes on its own initiative.
5. **Decisions are evidence-backed.** Issue triage verifies triggers against the
   real code; deferred work is tracked, not implemented inline.
6. **Verification gate before every commit** — the project's own gate commands,
   not a stand-in.
7. **Review at the right altitude.** The change (`review-change`), then the PR
   (`audit-pr`), then — on a measured trigger — the whole product (`product-audit`).
8. **Architecture changes are explicit.** Applicable architectural invariants
   are evidenced and preserved, or changed through an explicit decision — never
   inferred from a feature SPEC or implementation
   (owner: [`WORKFLOW_INVARIANTS.md`](WORKFLOW_INVARIANTS.md)).

## The map at a glance

```
                 ┌─────────────── ISSUE ───────────────┐
                 │            triage-issue              │
                 │   fix-now │ promote │ postpone │ wontfix
                 │   one-shot │ fix-in-unit │ remove
                 └─────┬──────────┬──────────┬──────────┘
                       │          │          └─ leave open + dated comment
                       │          │
              lane fix │   lane   │
                       │  feature │
                       ▼          ▼
   ISSUE──▶ triage ──▶ /unit-lane (conductor) ──▶ catalog steps ──▶ review-change ──▶ audit-pr ──▶ PR
              │           unit-lane│ (triage decides:            (auto after   (merge
              │                    implement, evidence, etc.)   all steps)   gate)
              │
              └─ promote ──▶ /unit-lane (feature mode)

   audit-docs ───── docs ↔ roadmap ↔ code ↔ fix index coherence            (anytime)
   product-audit ── product-wide health check → issues + roadmap proposals (measured trigger)

   # ship-roadmap is retired (feature 61 P9); its deterministic routing lives
   # in `workflow-status` / `unit-lane`.
   # The conductor role shipped as the companion package's `advance` command
   # (roadmap row 62, done) — see SKILLS.md.
```
