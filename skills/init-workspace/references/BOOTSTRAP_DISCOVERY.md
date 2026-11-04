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
     the lane's `design` catalog step's Integration closure walks). The row list
     in `template/docs/CAPABILITIES.md` is a **candidate set evaluated against
     this project**, never a floor to trim and never text to copy. Run
     `capability-inventory@1`'s six moves in order — no move substitutes for
     another — and score each candidate with the probes in
     `capability-evidence@1`. An unsettled row is an open question, never a
     default: the all-stages no-assumption rule owns that call (`ask-don't-infer`,
     `skills/unit-lane/references/DESIGN.md`) and this bullet only applies it. The
     result is checked by bootstrap write step 5, which refuses a raw seed.

     Roles follow the same three outcomes: a role cites the file that grants it,
     a role this project type cannot have is deleted, and a role nothing settles
     is asked — never invented from the levels such projects usually have.

     ```text
     capability-inventory@1
     move | what it settles | evidence it reads | what is written
     1 classify | which kind of project is this, and which surfaces can it carry at all | Step 0's discovery: manifests, the source tree, an existing agent guide, the documentation map, an existing roadmap | a project type and the surfaces it can carry — the input to the delete test; nothing reaches the inventory yet
     2 delete | can this candidate's surface exist in that kind of project | the classified project type, never the project's maturity | nothing: the row is removed **without a question**, and the report names the row and the type evidence that justified the deletion — a missing ACL in a service is a `no`, an ACL in a markdown-only project cannot exist
     3 infer | does evidence prove this row's state | one cited path per row, taken from that row's probes in `capability-evidence@1`: a directory, a package dependency, an entry point, a config key | `yes`, `partial` or `no` with that path recorded in the row's evidence cell; a `no` cites the surface it inspected and found absent
     4 ask | is the row plausible for this project but unproven | the absence of evidence, never the model's expectation of what projects usually have | one batched round covering every such row together — the existence question before any state question for the same subsystem, the inferred proposal beside each, `no` never offered as the safe default
     5 forbid | nothing — this move only binds | — | a state for a row with neither evidence nor a user reply: never `no` by default, never the template's text, never inferred from what projects usually have. The row is written `unresolved — <question>` and listed in the report
     6 report | what the run concluded | the three outcomes above | the deleted rows with their type evidence, the inferred rows with their cited paths, the asked round (questions, proposals, answers) or why no round was needed, and every `unresolved — <question>` row
     ```

     The probes are generic by contract — they name the surface, never a package:
     a stack whose equivalent differs is probed by its equivalent, and a probe that
     cannot resolve in this project is recorded as an open question, not read as
     absence. An empty repository has no evidence at all, so every surviving
     candidate is asked; the delete move still runs first, so the round never
     asks about a surface the project type excludes.

     ```text
     capability-evidence@1
     candidate | proves yes | proves partial | proves no
     Authentication | a login, registration or token entry point, an auth guard or middleware, and a session or credential store | a credential helper or store that no entry point consumes | the project has a request path and none of the three probes exists, or its dependency manifests carry no auth package
     ACL / permissions | a permission registry, policy file or guard declaring who may do what, enforced at an entry point | policy data with no enforcement call site | the project has an action surface and no policy file or guard names it
     Navigation (menus, dashboard) | a menu, sidebar, route table or dashboard view | a route table consumed by a single surface with no navigation entry | the project renders a UI and carries no menu, route or dashboard file
     Notifications (email, push, in-app) | a channel adapter, message templates plus a sender | templates with no sender, or a sender with no template | a project that could deliver a message has no channel, template or queue
     Search | an index builder plus a query entry point | one of the two without the other | a content-bearing project with neither an index nor a query path
     Audit log / activity trail | an append-only log surface plus a reader | an append-only log with no reader | the project mutates state and keeps no log path
     Settings / preferences | a config store plus its read and write entry points | a config file with no writer command | a project with runtime configuration and no store
     Background jobs / scheduling | a queue, worker, cron entry or event hook | an event hook with no scheduler | a project that runs on events and carries none
     File / media storage | an upload flow, a storage adapter or a bucket client | a storage dependency no flow consumes | a project that handles files and carries neither
     i18n / localization | locale files plus a locale switch | locale files with no switch | a user-facing surface with no locale file
     Feature flags | a flag store plus a read at a decision point | a flag constant with no store | a decision point with no flag read
     Billing / payments | a provider client, a plan or price model, a webhook handler | one of the three without the other two | a billable surface with none of the three
     Public API / integrations | a published package entry, a server route table or a documented client SDK | an internal module exported without documentation | a distributable project with no published entry
     ```
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
     a developer docs site can be written to? If yes, fill the template's
     `Docs site` block in `AGENTS.md` — `format`, `content-dir`, `build`, and
     the optional knowledge-map command — proposed from discovery (an
     `astro.config.*` + `@astrojs/starlight` dependency means Starlight). The
     `format` slot is the project's **declared output format** and it decides
     what the documentation generator renders: `markdown`/`md` → `.md`,
     `starlight`/`docusaurus`/`mdx` → `.mdx`, `html` → `.html`, `latex`/`tex` →
     `.tex`. Ask it as one question with those four targets and the proposal
     from evidence, never as a default. If no, leave the block commented out —
     the run then reports NOT-CONFIGURED instead of guessing, and the generator
     falls back to markdown **and reports the degradation**. Never scaffold the
     website itself.
     - **A new project** gets the format's output from its first unit: the
       declared slot is what `bun scripts/docs-generate.mjs` renders.
     - **An existing project** is offered the block **additively and with
       explicit consent**: the offer names the block, the four targets and the
       generator, and a refusal writes nothing and leaves the tree as it was —
       an upgrade never introduces a documentation surface the owner did not
       ask for.
   - **Naming conventions**, **MCP servers**, and **Serena language servers** (see
     [SERENA](SERENA.md) for the mapping), if any.
   - **Serena footprint** — the platform whose MCP config is the one to register
     (Claude Code, Cursor, VS Code/Copilot, Codex, JetBrains), the installers
     actually present (`uv --version`, `pipx --version`), and whether the global
     `serena_config.yml` already covers this project root under
     `trusted_project_path_patterns`. The write step offers **one** consent
     question from these three facts; it never asks a second time.
