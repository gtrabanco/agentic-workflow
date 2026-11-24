## Write and verify the bootstrap

4. **Write the adapted scaffold.** Fill the `AGENTS.md` placeholders (commands,
   the documentation map rows, architecture, and the `Docs site` block when the
   interview answered it — `format`, `content-dir`, `build`, `map`, with
   `format` written as exactly one of the values the generator accepts); write
   the **adaptive lane conventions** (unit document, triage, catalog steps,
   guards, evidence rows, dated progress log, closed commit format
   `type(scope): description`); keep the documentation templates it ships —
   `features/_TEMPLATE` beside `features/ROADMAP.md`, and `fix/_TEMPLATE`
   beside `fix/README.md` — and the `.github/` templates; keep
   `.agentic-workflow/hooks/` and activate only the adapters explicitly accepted
   in the interview; prune unused doc folders and map rows. Leave honest
   placeholders where the user hasn't decided — never invent values.
   **The laws section is offered, never assumed** (issue #645 S3): keep the
   scaffold's `## Inviolable rules` section in the written guide, and ask once
   whether the project will fill its five rules with its own enforcement (a
   test, a lint, a CI job) or leave them as declared placeholders. A refusal
   keeps the section with its placeholders — an absent section is the one answer
   the doctrine refuses, because the review pack reads it to tell an enforced law
   from a wish. Upgrade mode adds a missing state cell and never rewrites a rule
   the project wrote. The shape is owned by
   `docs/workflow/SKILL_AUTHORING.md` §"The target project's guide"; this step
   writes it, it never restates the rules.
   The `Docs site` write is **additive**: on a fresh scaffold the block is
   filled in place, and on an existing install it is offered with its consent
   question first and left untouched on a refusal. A declared format is
   rendered by `runner docs-generate`; the project's first unit's docs
   step cites the same command, so never hand-write a generated page.
   **Write the charter answers where tier-0 reads reach them** (issue #435):
   the identity layer fills the guide's `## Project charter` section verbatim —
   decisions, policies and commands, never derivable-from-code description —
   and the domain layer lands as dated assumptions there and in their natural
   registered docs. The ceremony-profile seed lands there too as the
   machine-readable block the dispatcher checks in code (issue #436): one
   fenced `ceremony-profile@1` block inside `## Project charter`, one
   `piece: paid|discarded` line per declared piece (`docs-step`, `captures`,
   `review-passes: <surfaces|none>`, `publish-gate`, `test-policy`), undeclared
   pieces keeping the catalog default; a full-ceremony adopter may omit the
   block entirely. Never invent piece names — the closed vocabulary is the
   profile contract's. **Layer 3 lands through the deterministic writer** (unit
   556): assemble one payload from the interview —
   `{ "date": "<YYYY-MM-DD>", "answers": {…}, "defaults": {…} }` — and run
   `runner charter land --guide AGENTS.md --answers <payload>`.
   A slot the project already filled is reported `kept`
   and left byte-identical (a team convention always wins); a placeholder with
   an answer is `written`; a placeholder covered only by a bank default becomes
   `assumed <YYYY-MM-DD> — <default>`; a slot nobody answered and no default
   covers stays `unanswered` and joins the residuals — never an invented value.
   The boundary answer is written into `Architectural boundaries` in the
   machine-checked shape (`<boundary> → machine: <mechanism>` or
   `<boundary> → prose-only`), which is the location the materialization step
   reads. Run
   `runner charter check --guide AGENTS.md --bank <the shipped bank>` first:
   it proves every question still lands in a
   slot this guide carries. The verification-criteria answers fill
   `docs/workflow/VERIFICATION_CRITERIA.md` (copied from the template) with one
   provenance value per criterion from the closed set `workflow-generic` /
   `project-declared` / `stamped assumption (dated)` — a row without one is
   written `unresolved — <question>` and listed with the residuals, never
   guessed. Each layer-3 posture answer becomes a criteria row with its own
   provenance: `project-declared` when the owner stated it, `stamped
   assumption (<YYYY-MM-DD>)` when the bank's default was left in place. Both
   documentation-map rows (charter, criteria catalogue) are
   registered so design/plan provenance searches reach the answers without new
   machinery; `audit-docs`' charter check (16) recomputes the coverage.

   **Materialize the verification answers (unit 557, issue #564).** A charter
   answer that says a boundary is `prose-only` is an item this write step owes,
   never a note to carry forward: load
   [materialization](MATERIALIZATION.md) and run its round here, after the
   landing and before the closing report. Read the plan first
   (`runner materialize plan --guide AGENTS.md`), propose one outcome per
   `pending` boundary, and write the sanctioned ones back with
   `runner materialize apply --guide AGENTS.md --outcomes <payload>` — the only
   writer, and it needs an explicit `consent: "yes"` per item: a scaffolded rule
   lands in the tree and flips the charter answer to `machine: <mechanism>`, a
   filed forge issue records its reference, and a `no` writes nothing and prints
   one residual per item. Seed `docs/workflow/FEATURE_MAP.md` from the copy in
   `template/` with one row per user-facing flow, and read the `Evidence driver`
   answer the interview landed (a capture criterion records its digest with it,
   or fails closed with `manual:`). A project with no forge degrades to
   scaffold-or-decline — never to a failed run — and every refusal is a residual
   in the closing report.
5. **Install the generated-surfaces and shared-document merge drivers (fix #507 on the #498 base).** The generated
   projection and the roadmap tables are functions of the tree
   (`runner docs-generate`), and the shared documents the concurrent
   sessions write are covered by #498's file-class registry, so two branches
   that regenerate or append must never conflict by hand. In bootstrap and
   upgrade alike, after the template write: (a) keep `template/.gitattributes`
   as the project's `.gitattributes` — additively on an existing file, appending
   the registry lines it is missing (`docs/generated/** merge=docs-generated`,
   adjusted to the declared projection directory when `content-dir` moves it;
   plus the class-registry lines
   `docs/ROADMAP.md merge=agentic-shared-roadmap`,
   `docs/workflow/SKILL_CONTEXT_BUDGETS.json merge=agentic-shared-budgets`,
   `docs/workflow/REPOSITORY_STATE.md merge=agentic-shared-repo-state`,
   `docs/LOGS.md merge=agentic-shared-logs`, and the telemetry pair
   `docs/workflow/TIER_COST.md merge=agentic-shared-telemetry` +
   `.pi/.telemetry/sessions.jsonl merge=agentic-shared-telemetry` — issue #630's
   append-only class, whose driver the same `--install` arms because it iterates
   the class vocabulary) and never
   touching unrelated entries — each path is claimed once, so a
   project never carries two `merge=` claims on one path; (b) arm the drivers in
   the checkout's git config: `runner docs-generated-merge --install`
   and `runner shared-merge --install`,
   and verify `git config --get merge.docs-generated.driver` and
   `git config --get merge.agentic-shared-roadmap.driver` are non-empty (the
   other class keys arm in the same loop; the shared-driver suite pins them
   all); a
   missing `scripts/` tree (an install without the scripts directory) is
   recorded as a residual with the manual commands as the route, never a failed
   scaffold. The `.gitattributes` lines are committed; the config arming is
   per-checkout and is never pushed.
6. **Verify the capability inventory before calling it seeded.** `docs/CAPABILITIES.md`
   is the one written file whose raw form is wrong in both directions — a
   placeholder claims a subsystem the project does not have, and a missing row
   hides one it does — so the seed is checked after the write, never assumed:
   - no placeholder cell survives — a cell whose entire content is a `<…>`
     placeholder, code span or not (the template's own rows are the positive
     case, and a legal `unresolved — <question>` cell never matches):

     ```text
     rg -n '\| *`?<[^>]+>`? *\|' docs/CAPABILITIES.md   → prints nothing
     ```
   - every remaining row's `Exists` cell is `yes`, `partial`, `no`, or the
     explicit `unresolved — <question>` form;
   - a `yes`/`partial` row's evidence cell cites a path that exists in the
     target, and a `no` row cites the surface it inspected and found absent.
   A file that fails any check is **not reported as seeded**: re-open the round
   the missing answer belongs to (discovery step 3's capability move), and what
   the user declines to answer is written `unresolved — <question>` and listed
   with the other residuals. Copying the template and reporting it as seeded is
   the one failure this step exists to catch.
7. **Seed Normalized Repository State.** Copy
   `template/docs/workflow/REPOSITORY_STATE.md` to
   `docs/workflow/REPOSITORY_STATE.md` when it is absent. If the target already
   has one, leave it unchanged and report that discovery should refresh it.
   Explain that discovery freezes evidence before planning and only
   `resolve-repository-state` updates frozen facts.
8. **Offer architectural invariants.** Keep
   `docs/architecture/ARCHITECTURAL_INVARIANTS.md` from the template only when
   the project has long-lived architectural constraints. Explain that it is
   optional: an absent document means no project invariants are declared, not
   that the scaffold failed. If retained, add its documentation-map row and
   name the project's explicit architectural-decision authority.
9. **Propagate the unit doc templates.** Ensure both template folders exist and
   are cut in the `spec-by-reference` shape the scaffold ships —
   `docs/features/_TEMPLATE/SPEC.md` and `docs/fix/_TEMPLATE/SPEC.md` (`Specs`
   with `S#` requirements, Impact, Non-goals, Future cost, Applicable tests,
   Known pre-existing issues, `Tasks`, `Findings`, `Log`, Next, References).
   These are the templates used when creating new unit documents; a unit opened
   before this shape keeps the legacy 14-section shape and is never rewritten to
   migrate.
10. **Provision Serena — one consented question, then write.** Load
   [SERENA](SERENA.md) and ask its single consent question; one yes covers the
   tool install, the detected platform's MCP registration and the global trust
   append, and a refusal installs, registers and writes **nothing**. On yes:
   (a) append the `.gitignore` block additively (skip when already present);
   (b) write `.serena/project.yml` with the `language_servers` list for every
   detected language (never overwrite an existing file — report it); (c) run
   the health check and render the fixed provisioning report; (d) run `serena
   project index` to pre-cache symbols (avoids first-call delay). When no
   installer is available, offer only what the machine can perform and record
   the residual with its reason — the run completes either way.
11. **Offer Engram provisioning.** Load [ENGRAM](ENGRAM.md), detect the binary
   and ask consent: register the `engram` MCP server (absolute path, exact
   `mcp --tools=agent` argv) when the host has one, leave an existing
   declaration untouched, and report exactly what was written. An absent binary
   becomes a residual with the documented install route — never a failed run.
   Skip this step when the pi package provisions the host itself.
12. **Offer the subagent routing and resource config (issue #260, S11 edge 4; #201's Mechanics-4 shape, ask-first).** If the project installs `@gtrabanco/pi-agentic-workflow`, offer to seed `pi-agentic-workflow.json` with the subagent layer's two operator surfaces — **never written without a yes**:
    - the `passes` recommended entries for the review family (one cheap tier for the finders, `"auto"` left out unless the operator wants delegated choice);
    - the optional `subagents` key (`"parallelism": "auto"` plus caps shaped `"<n> of <m> <unit>"`, or the key omitted entirely — absent means the self-detected envelope with conservative defaults).
    An existing owner-written file is never rewritten: propose the additive keys, show the exact JSON, and record a declined offer as a residual. When the pi package is absent, this step is a residual with the package README's `Spawned passes` + `Subagent layer` sections as the documented route.** Keep the canonical policy and
   fullauto wrapper at `.agentic-workflow/hooks/`. Seed the shipped
   path-protection policy at `.agentic-workflow/path-policy.json` and its doc
   page at `.agentic-workflow/path-protection.md`, beside the hooks — the
   `path-policy.json` seed is byte-identical to the producer crate's canonical
   default, so a fresh install gets the guard with zero config. Leave an
   existing owner-written `.agentic-workflow/path-policy.json` untouched and
   report it as a residual. For each accepted platform,
   activate only its repository config/example as documented in the hook pack.
   Run `bash .agentic-workflow/hooks/tests/test-command-guard.sh`; a missing
   `agentic-workflow` CLI (the hooks are shims over it), an unknown payload, or
   an existing customized hook file becomes a residual, never a silent
   overwrite. Direct merges remain blocked; do not create a
   `.automerge` exception.
13. **Install accepted agent safety hooks.** Keep the canonical policy and
    fullauto wrapper at `.agentic-workflow/hooks/`. Seed the shipped
    path-protection policy at `.agentic-workflow/path-policy.json` and its doc
    page at `.agentic-workflow/path-protection.md`, beside the hooks — the
    `path-policy.json` seed is byte-identical to the producer crate's canonical
    default, so a fresh install gets the guard with zero config. Leave an
    existing owner-written `.agentic-workflow/path-policy.json` untouched and
    report it as a residual. For each accepted platform,
    activate only its repository config/example as documented in the hook pack.
    Run `bash .agentic-workflow/hooks/tests/test-command-guard.sh`; a missing
    `agentic-workflow` CLI (the hooks are shims over it), an unknown payload, or
    an existing customized hook file becomes a residual, never a silent
    overwrite. Direct merges remain blocked; do not create a
    `.automerge` exception. Then offer the **push-range secret scan** (issue
    #552) as one consent question — "install the push-range secret scan as a
    `pre-push` hook?" — and, on a yes, write a `pre-push` hook that execs
    `.agentic-workflow/hooks/secret-scan.sh "$@"` (chained from an existing hook
    when the project has one, never overwriting it) and run
    `bash .agentic-workflow/hooks/tests/test-secret-scan.sh`. A no installs
    nothing and records the residual, leaving the hooks README's manual
    invocation as the documented route; the hook never installs itself.
14. **Offer the workflow skills.** Propose installing them:
   `npx skills add gtrabanco/agentic-workflow` (note the SSH/local-path variant if
   the source is private). Don't install without a yes.
15. **State that reviews are self-contained; offer optional extras.** The
   workflow ships its **own internal review pack** (`review-code`,
   `review-security`, `review-verify`, `review-debt`, `review-design`,
   `review-a11y`, `review-brand`, `review-perf`, `review-seo`) — it installs
   with the skills and covers every review axis, so **no external review skill
   is required on any agent**. If the user wants platform-specific extras (a
   framework skill, a stack-specific security skill), record them in `AGENTS.md`
   under a short "Optional review extras" note so `review-change` and
   `product-audit` run them **in addition** — never as a dependency. Don't
   install anything without a yes.
   A skill installed through the discovery route
   ([BOOTSTRAP_DISCOVERY](BOOTSTRAP_DISCOVERY.md) step 3) is recorded by that
   route's own command, one `review-extras@1` row per skill carrying source,
   pin, install date and axis:
   `agentic-workflow skills register --guide AGENTS.md --name <n> --source <s>
   --pin <p> --axis <a>`. The scaffolded `AGENTS.md` already carries the note
   and an empty block, so registration appends a row and never invents a
   section; `runner skills inventory --guide AGENTS.md` reads the
   block back and is what `product-audit`'s Installed tooling dimension
   reports. A `no` writes no row.
16. **Seed the urgency labels (feature 15, injection-safe urgency).** Create the
   two capability-gated GitHub labels `triage-issue` owns and applies
   (`skills/triage-issue/SKILL.md` is the sole owner of the name/color
   vocabulary — this step only seeds it, never redefines it):
   `gh label create urgent --color B60205 --description "Evaluate for
   interrupt-now — reaches the pause-vs-finish judge"` and
   `gh label create fix-next --color D93F0B --description "Head of the fix
   queue — never interrupts the in-flight unit"`. Create-if-missing: an
   "already exists" error from `gh label create` is treated as success, not a
   failure. Requires the forge remote/auth Step 0 already detected — if the
   forge is unavailable or the user declines forge setup, skip this step and
   list the two labels as a residual for the user to create manually later
   (never fail the whole scaffold on it).
17. **Report.** List what was created, which placeholders still need human input,
   the companion skills recorded/installed, the urgency labels seeded (or
   skipped, with reason), and the next step:
   `discover-repository-state` → `/unit-lane` (or `workflow-status`) → catalog
   steps → `execute-phase`.
