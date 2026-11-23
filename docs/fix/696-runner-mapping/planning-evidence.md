# Planning evidence — fix/696-runner-mapping

Frozen at the cut (issue
[#696](https://github.com/gtrabanco/agentic-workflow/issues/696)). One row per
Engineering claim the change rests on; the column order and the `authority-kind`
vocabulary are owned by `skills/pre-execution-review/references/LEDGERS.md`.
`freshness` states what was read and when — a claim carried from model memory is
`inferred` at best, and an unsampled assumption about a tool's behaviour is
`unknown` with an owner.

```text
planning-evidence@1
id | authority-kind | claim | source | freshness | affected-decision-or-obligation
```

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | tool-behaviour | `tool_search` is a real pi tool at the pinned version: it searches tools registered with `codemode`/`deferred` exposure and loads the matches for the next model call. | `pi-coding-agent@1.6.0` `dist/extensions/tool-search/tool.js` (`TOOL_SEARCH_TOOL_NAME = "tool_search"`, `isSearchable(exposure)`) — read at this cut | verified at this cut | O3, O10 |
| PE-002 | tool-behaviour | The workflow tools are registered `exposure: "deferred"` under the `agentic-workflow` namespace, so `tool_search` can surface them and a codemode script can call them by name. | `packages/pi-agentic-workflow/src/extension/workflow-tools.ts:81-83` and its namespace description at `:56-57` | verified at this cut | O3, O10 |
| PE-003 | unknown | The codemode sandbox's own search global is spelled inconsistently inside the pinned pi build: its own codemode doc names `n(query, …)`, the compiled sandbox registers `n`, while this session's codemode tool description names `searchTools`. | `pi-coding-agent@1.6.0`'s packaged codemode doc and its compiled `execute` module, vs this session's codemode tool description | unknown — owner: the block must not spell a codemode search global; it names `tool_search` and the by-name call, both verified | O3 |
| PE-004 | contract | The pi bundle's projection manifest pointerizes `RUNNER.md`'s `## The invocation` section, so the staged contract carries no `runner-set@1` table and no launcher; the new block must live outside that section and must not name a launcher. | `packages/pi-agentic-workflow/projection-manifest.json` + `test/runner-prose.test.mjs` (the bundle carries no `bunx|npx|pnpm dlx @gtrabanco/agentic-workflow` invocation) | verified at this cut | O1, O3, O4 |
| PE-005 | contract | A staged `SKILL.md` must keep its frontmatter first: `parseSkillFrontmatter` reads the leading `---` block, and `readSkillMeta`/`readCatalogue` return an empty meta for a document that opens with anything else. | `packages/pi-agentic-workflow/scripts/bundle-skills.mjs:frontmatterBlock`, `src/routing/catalogue.ts:37-40` | verified at this cut | O1 |
| PE-006 | measurement | `RUNNER.md` measures 3,834 est against its declared reference ceiling 3,991 — 157 est of headroom before the block lands. | `bun scripts/check-skill-context.mjs --skill runner-contract` and `docs/workflow/SKILL_CONTEXT_BUDGETS.json`'s `runner-contract` entry | measured at this cut | O2 |
| PE-007 | measurement | `AGENTS.md` measures 680 lines / 221 machine lines against `linesMax: 681` / `machineLines: 221`, so one inventory row spends the line ceiling exactly. | `bun scripts/check-skill-context.mjs --documents` and the manifest's `documents.files["AGENTS.md"]` | measured at this cut | O2 |
| PE-008 | capability | The extension's `tool_call` handler already filters `bash` and returns `{ block, reason }` to the session, and it runs the tool-choice carrier there. | `packages/pi-agentic-workflow/src/extension/index.ts:571-600` | verified at this cut | O6 |
| PE-009 | contract | `policy.mjs` is deliberately pure — no filesystem, no process — because availability is injected by the caller; a second `PATH`/disk probe inside it would break that contract. | `packages/agentic-workflow/src/tool-choice/policy.mjs` header + `packages/pi-agentic-workflow/src/guards/tool-choice.ts` header | verified at this cut | O7 |
| PE-010 | obligation | `policy.d.mts` is a projection of `policy.mjs`'s exports and the suite compares the two by name (case `F19`), so a changed signature must be declared there. | `packages/agentic-workflow/test/tool-choice.policy.test.mjs:224-232` | verified at this cut | O7 |
| PE-011 | unknown | Whether a project could legitimately ship its own `runner` executable on `PATH` — no evidence in this tree either way. | not evidenced | unknown — mitigation: the seam refuses only the bare `runner` head, never a path-qualified spelling (`./runner`, `/usr/local/bin/runner`) | O6 |
| PE-012 | measurement | The injected block's per-skill cost, and therefore its ceiling, is only knowable after the block is written (AC1's ceiling-after rule). | measured at P2 with `bun test packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs` | measured at P2 | O1 |
