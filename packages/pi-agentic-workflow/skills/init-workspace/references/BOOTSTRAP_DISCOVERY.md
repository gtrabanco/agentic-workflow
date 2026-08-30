## Process

1. **Preflight.** Confirm the target dir and the discovery findings. If scaffold
   files already exist, get an explicit decision before overwriting.
2. **Fetch the template.** `npx degit gtrabanco/agentic-workflow/template <dir>`
   (into the target if empty, else a temp dir to merge from). **`degit` can't read
   a private repo — it fails, or in `--mode=git` silently leaves an empty dir; for
   a private source, `git clone` via SSH and copy the `template/` subtree instead.**
3. **Interview to adapt** — small batched rounds, each with a recommended default
   drawn from Step 0; skip whatever discovery already answers:
   - **Project** — name + one-line purpose.
   - **Gate** — dev / build / test commands and the verification gate (proposed
     from the detected stack; confirm).
   - **Forge** — issue/PR tracker + CLI (proposed from the remote URL; confirm)
     → recorded in the Workflow conventions **Forge** line.
   - **Git workflow** — how parallel work is handled: **branches** (default —
     one active unit at a time, sequential, plain `git switch -c`) or
     **worktrees** (parallel units in separate checkouts; only if the user's
     agent/tooling manages them). Recorded in the Workflow conventions
     **Git workflow** line; every skill that creates branches honors it.
   - **Agent safety hooks** — detect where the agent actually runs and which
     repository adapters apply: Claude Code, Cursor, Copilot, OpenCode, or none.
     Recommend the shared command guard for every detected platform; explain
     that shell adapters require `jq`, OpenCode uses the bundled Bun plugin,
     and hooks are defense-in-depth behind forge rulesets. Ask one explicit
     yes/no per adapter before activating it. Remote/VPS execution is not a
     reason to skip: commit the repository adapter so the remote clone loads it.
   - **Docs language.**
   - **Architecture** — pattern, layers/modules, and dependency-direction rules
     (stay architecture-agnostic; record the user's choice in `ARCHITECTURE.md`).
   - **Doc domains** — which of `providers/ brand/ domain/ business/
     infrastructure/ legal/ frontend/` apply. **Delete the folders that don't**
     (e.g. `frontend/` for a non-UI project).
   - **Capability inventory** (`docs/CAPABILITIES.md` — the substrate
     `design-feature`'s Integration closure walks). Seed it from discovery,
     not raw placeholders: on an existing codebase, propose the roles and the
     `yes|no|partial` state of each template subsystem row (auth, ACL,
     navigation, notifications, search, audit, settings, jobs, storage, i18n,
     flags, billing, public API) from what the code actually shows; on an
     empty repo, walk the same fixed rows with the user (`no` is a valid,
     load-bearing answer). Delete rows that can never apply to this product;
     confirm the result in one round — never leave the file as the raw
     template.
   - **Performance tooling** — detect what the stack offers, one slot at a
     time (fixed checklist, first match per slot; record `none` explicitly
     when nothing fits — never leave the slot undiscussed):
     - *Static complexity lint*: Biome present → enable its `complexity`
       group (incl. `noExcessiveCognitiveComplexity`); ESLint present →
       suggest `eslint-plugin-sonarjs` + `eslint-plugin-unicorn`; neither →
       ask for the stack's equivalent or record `none`.
     - *Benchmark harness*: Vitest → `vitest bench`; Bun runtime → `mitata`;
       Node → `tinybench`/`mitata`; other stacks → ask for the project's
       benchmark command or record `none`.
     - *Profiler*: Node → `node --cpu-prof` (zero-dependency default) or `0x`
       via the project's package runner; Bun → `bun --inspect` CPU profiling;
       other → ask or record `none`.
     (The named tools are the TS/JS **adapter examples**; the contract is the
     generic block below.) Offer installation — **the user confirms each
     dependency; never install silently** — and register the outcome in the
     template's `Performance commands` block next to the verification gate,
     so `review-perf` can measure instead of guess.
   - **Docs site** — does the project have (or want) a developer docs website
     the `generate-docs` skill can write into? If yes, fill the template's
     `Docs site` block in `CLAUDE.md` (format: starlight/docusaurus/markdown,
     content dir, build command, optional knowledge-map command — proposed
     from discovery: an `astro.config.*` + `@astrojs/starlight` dependency
     means Starlight). If no, leave the block commented out — `generate-docs`
     then reports NOT-CONFIGURED instead of guessing. Never scaffold the
     website itself.
   - **Naming conventions** and **MCP servers**, if any.
