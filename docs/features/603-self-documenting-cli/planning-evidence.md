# 603 — planning evidence

One row per Engineering claim this change rests on (`id | authority-kind | claim
| source | freshness | affected-decision-or-obligation`). Shape owned by
`skills/pre-execution-review/references/LEDGERS.md` §1; the closed
`authority-kind` / `freshness` vocabularies live in the unit-lane's planning
reference and are not restated here.

A claim about a tool's or a model's behaviour that was never sampled is
`unknown` with an owner, never a silent citation.

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | sampled | the bin's closed-world refusal is `EDIT REFUSAL — Unknown service: <x>` on stderr with exit **2**, not exit 1 — so the issue's "usage-class failure (exit 1)" cannot be taken literally without breaking the pinned contract | `backend` — `bun packages/agentic-workflow/bin/agentic-workflow.mjs delete-section` at `7c395d880`, exit 2, stderr captured (E1) | current | D2; O3, O4 |
| PE-002 | sampled | `test/runner.dispatch.test.mjs:120-134` pins both the exit code (2) and the refusal prefix, so any change to either is a regression rather than a design choice | `repository` — read at `7c395d880` | current | D2; O3 |
| PE-003 | sampled | the dispatch surface is **72** subcommands: 27 `case` arms in the bin's switch plus 45 keys in `RUNNER_COMMANDS`, and the two lists are disjoint in name but read together by `cli.surface.test.mjs`'s usage-token parity | `repository` — `rg -c '^\s+case "'` = 27 and `RUNNER_COMMANDS` key count = 45, read at `7c395d880` | current | O1, O2, O7 |
| PE-004 | sampled | closed op vocabularies already exist as scattered literals: `fail("unknown-op", { op, ops: [...] })` in each ceremony module and `onlyFlags(flags, [...])` in `src/runner/lib.mjs`, so the registry centralizes existing data instead of inventing it | `repository` — `src/runner/ceremony/review.mjs:~230`, `src/runner/lib.mjs:70-95`, read at `7c395d880` | current | D5; O2 |
| PE-005 | sampled | `cli.surface.test.mjs` today asserts README↔bin usage-token equality and one README row per dispatched token — a two-way check that must be widened, not replaced, for S7 | `repository` — `packages/agentic-workflow/test/cli.surface.test.mjs`, 57 lines, read at `7c395d880` | current | O7 |
| PE-006 | sampled | the pi deferred tool set is declared once in `WORKFLOW_TOOLS_NAMESPACE.instructions` (`workflow-tools.ts`), which is model-facing and already carries prose — so the family index can ride it with no new tool and no added declaration | `repository` — `packages/pi-agentic-workflow/src/extension/workflow-tools.ts:29-56`, read at `7c395d880` | current | D4; O9 |
| PE-007 | sampled | the `runner-contract` skill is the precedent for a shipped-but-not-menu skill: `user-invocable: false`, **no** `metadata.internal`, and a `references/` neighbourhood | `repository` — `skills/runner-contract/SKILL.md` frontmatter + `references/RUNNER.md`, read at `7c395d880` | current | O8 |
| PE-008 | sampled | the context budget manifest keys per-skill ceilings under `documents.skills.<name>` and `check-skill-context.mjs` fails a skill whose measured bytes exceed them, so a new skill needs its row or the gate is red | `repository` — `docs/workflow/SKILL_CONTEXT_BUDGETS.json:446` (`runner-contract` block), read at `7c395d880` | current | O8 |
| PE-009 | sampled | this host pins `gh 2.46.0`, below the `2.90.0` floor `gh skill` needs, so the issue's primary gh route cannot run here | `environment` — `gh --version` at 2026-11-23 (E2) | current | D3; S5 coverage |
| PE-010 | sampled | a project-level `npx skills add` writes into the operator's skill directory, not the repository, so it leaves no committed artifact an external verifier can re-derive | `documentation` — issue #603's own scope note *"Project-level skill install location (no committed artifact; recorded in the unit doc)"* | current | D3 |
| PE-011 | sampled | the workspace's `node_modules` does not link `@gtrabanco/*` workspace members under bun's default isolated linker in a fresh worktree; `bun install --linker=hoisted` produces the links the suites expect | `environment` — E1 run log in `## Log` | current | O1 (the environment the validators run in) |
| PE-012 | unknown | whether every one of the 72 subcommands has a *derivable* closed op set from its source alone, or whether some only reject an unknown flag without enumerating the legal ones — the registry may have to declare ops for a command whose code does not | `own sample` — not measured before the cut | unknown — owner: P2, resolved by reading each module at implementation time | O2 |
| PE-013 | sampled | the crate README's Commands table is the grammar's declared home (692 lines of it), so the usage skill must point at `help`, never restate a flag list | `repository` — `packages/agentic-workflow/README.md`, and `AGENTS.md`'s "every repetition names its owner" (`IR11`) | current | O8 |
| PE-014 | documented | `normative-drift` fails closed on a normative surface with no fixed grammar, so any new committed grammar needs a `normative-surfaces@1` row in `AGENTS.md` | `repository` — `AGENTS.md` § Normative surfaces; `scripts/normative-drift.test.mjs` | current | O8 |
