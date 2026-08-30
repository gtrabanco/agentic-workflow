# 27 — pi-agentic-workflow — decisions

Dated product decisions. Upsert only; never rewrite or delete a prior row.

## 2026-03-27 — design interview

- **Command surface:** native Pi slash commands from a Pi plugin/package, not Pi core and not a shell CLI.
- **Identity:** feature `27-pi-agentic-workflow`; npm `@gtrabanco/pi-agentic-workflow`; folder `packages/pi-agentic-workflow/`; branch `feat/27-pi-agentic-workflow`.
- **Install:** self-contained. `pi install npm:@gtrabanco/pi-agentic-workflow` provides canonical skills, aliases, and configuration helpers.
- **Unavailable model:** stop and explain by default; `onUnavailableRoute` may be set to `inherit`.
- **Config storage:** dedicated JSON files (global `~/.pi/agent/pi-agentic-workflow.json`, project `.pi/pi-agentic-workflow.json`) because Pi has no supported plugin block in `settings.json`. Console configuration via `/agentic-workflow-settings` is required.
- **Route shape:** one default route plus optional per-command overrides.
- **Lifecycle:** snapshot then restore model and thinking after `agent_settled`; do not restore over an explicit user model change.
- **First run:** effective default is `inherit`; show a one-time persisted hint pointing at JSON and `/agentic-workflow-settings`.
- **Coverage:** friendly aliases for every `user-invocable: true` skill plus `/agentic-workflow-settings`; internals stay bundled without aliases except `metadata.internal: true`, which is excluded.
- **Skills:** canonical and unchanged. Pi-specific behavior lives in the extension and config layer.
- **Success targets:** one-install aliases; argument forwarding; JSON + settings command; invocation-scoped routing with restore; fail-closed unavailable routes; inherit plus one-time hint; byte-identical bundled skills.
- **Size:** M.
- **Traceability:** roadmap only; no GitHub issue.

## 2026-08-29 — engineering half (scaffold)

- **D-E1 — One unit, six phases.** Plan cut to six single-layer phases (P1
  bundling, P2 config engine, P3 routed execution, P4 settings console, P5
  READMEs, P6 hardening & PR). Hard split rule evaluated: a split would move
  S4/S12 (console + docs) to a new chained unit — a product re-scope the
  scaffold cannot perform (product half frozen; D-P12 pins one unit). Every
  phase passes the eight-box lint with local-only verification, satisfying the
  rule's intent; recorded here rather than silently exceeding.
- **D-E2 — Test stack mirrors the schema package:** TypeScript + `tsc` +
  `tsconfig.test.json` + `node --test`; `npm test` = compile then run (NRS F005
  precedent).
- **D-E3 — Bundled skills are committed build copies** with the parity test as
  the drift guard; no skill prose is ever edited inside the package.
- **D-E4 — Settings console declares layer `ui`** (interactive console surface);
  dispatch-only command handlers declare `api`.
- **D-E5 — Strict config validation:** present-but-invalid = refuse (S10);
  only *missing* files resolve to the default. Locked by tests.
- **D-E6 — READMEs written in P5**, after all behavior exists, so documented
  sections describe built features.
- **D-E7 — Hint acknowledgement state in a dedicated file**
  (`~/.pi/agent/pi-agentic-workflow-state.json`), never inside the user's
  config file.

## 2026-08-29 — roadmap collision resolution (user-approved)

- **Unit 27 keeps its number; the two unstarted `idea · scheduled` rows move.**
  The user chose "keep 27, renumber the two unstarted idea rows" over
  renumbering this unit, so the frozen `ACCEPTANCE.md` (AC4/AC16 name the `27-`
  paths) stayed byte-identical and no SPEC amendment was needed. Applied during
  the rebase of `feat/27-pi-agentic-workflow` onto `main`:
  `27 · pre-execution-plan-review` → **28** (still depends on 26) and
  `28 · bounded-implementation-discovery` → **29** (its dependency was the row
  numbered 27 on `main`, i.e. the row now numbered 28). Traceability is intact:
  both rows carry their issue links (#146, #149), and `git grep` over the whole
  repository found no reference to either row by its old number — only by issue
  number, which did not change.
- **Branch rebased onto `main` (`829ad18`)** instead of merging, so the unit's
  history stays linear and AC16's `git diff main --stat` measures only this
  unit's paths. Verified after the rebase: acceptance blob still
  `22d3f3394a9ab0e0c0bd3596767ebeb3e502a44f`, P1's gate re-run green (7/7), and
  `git diff main --name-only -- packages/agentic-workflow-schema` → 0 files
  (AD-007 holds against the new base, which brought feature 26's schema work).

## Open questions

none — dispatch mechanism (sendUserMessage, per the product design's cited
example) and all engineering decisions above are resolved before P1; residual
risks (Pi API drift, skill drift) are pinned by peerDependency + parity test.

## 2026-08-29 — execution (P1)

- **Phase-lint re-check passed; stored task counts drifted.** Re-ran the
  canonical eight-box lint against `TASKS.md` as executed: every phase is
  single-layer, ≤ 8 tasks, one deliverable per checkbox, no decision words, no
  internal manual gate, machine-checkable done-when → `PASS (8/8)` for P1–P6.
  The fingerprints stored at scaffold time disagree with the checklist on two
  phases: P1 is 7 rows vs `P1:config/infra:5:…`, P2 is 6 rows vs
  `P2:domain:7:…`. No task was added, moved, or dropped here — both files came
  out of the scaffold in one commit, so the mismatch is authored into the plan.
  Re-lint as executed: `P1:config/infra:7:package-skeleton-with-byte-identical-skill-bundling`,
  `P2:domain:6:routing-config-engine`. The task list is NOT edited: splitting or
  merging rows would be a re-cut, which belongs to `plan-feature`.
- **D-E2 refinement — no `tsconfig.test.json`.** The stack still mirrors the
  schema package (`tsc` strict compile → `node --test test/*.test.mjs`), but the
  second `tsc -p tsconfig.test.json` pass is dropped: its purpose there is
  type-checking TypeScript test fixtures, and this package's fixtures are
  generated JS/JSON trees in temp dirs. A no-op config file would be dead
  configuration; `testing.md` states the same.
- **Dev dependency set.** `typescript@6` + `@types/node@^24` (dev) join the
  `@earendil-works/pi-coding-agent` peer: the extension does Node file I/O, so
  the strict `tsc` pass named by D-E2 cannot type-check `node:fs`/`node:path`
  without the Node type package. The peer is declared `"*"` exactly as Pi's
  package docs require for bundled core packages (Pi resolves it at runtime, so
  the published tarball stays dependency-free).
- **Pi surface types are derived, not imported.** Pi's public root export does
  not re-export `Model` or `ThinkingLevel`, so the extension derives them from
  the exported interfaces (`NonNullable<ExtensionContext["model"]>`,
  `ReturnType<ExtensionAPI["getThinkingLevel"]>`). Same drift guarantee, no
  deep-path import of an unexported module.
- **Bundling copies per skill directory, not by whole-tree copy.**
  `bundleSkills()` wipes the target and copies each included skill separately:
  a whole-tree copy would resurrect `metadata.internal: true` skills through the
  exclusion step and would merge stale bytes over a deleted source skill. The
  `rebuilding clears stale bundle copies` fixture locks the behavior.
- **Frontmatter is scanned, not parsed.** The bundler's reader understands only
  `name`, `user-invocable`, and `metadata.internal` (block or inline form).
  Full YAML would need a dependency the SPEC never justifies; folded scalars are
  safe because their continuation lines are indented.
- **Skill inventory observed at execution:** 35 `SKILL.md` (18
  `user-invocable: true`, 17 `false`), exactly 1 `metadata.internal: true`
  (`bump-skill`) → bundle = 34 skills / 105 files. NRS F008 says 2 internal
  skills and F013 says the invariants document exists but is empty; the
  repository at this revision has 1 and none respectively — repository is
  authoritative, recorded rather than routed to the resolver because nothing
  here depends on the stale counts.
- **`main` moved ahead and took the number.** `829ad18` registered
  `27 · pre-execution-plan-review`; feature 26 (#145) merged. See
  `known-issues.md` — the renumber/rebase choice is the user's, not the
  executor's, because the frozen `ACCEPTANCE.md` names the `27-` paths.

## 2026-08-29 — execution (P2)

- **The loader receives directories, never environment knowledge.** `loadConfig`
  takes `agentDir` + `cwd` and derives both file paths from them; P3 supplies
  them from Pi (`getAgentDir()`, `ctx.cwd`). Mirroring Pi's
  `PI_CODING_AGENT_DIR` handling inside the domain layer would have duplicated a
  rule Pi owns and gone stale silently the first time Pi relocated its profile.
  Same reason the domain modules contain no Pi value imports: only types.
- **Two shapes, one resolution order.** `ConfigFile` is what an operator writes
  (everything optional); `EffectiveConfig` is what the code reads (every route
  total). Resolution cascades per key — project command → global command →
  resolved default route → shipped default — because the SPEC's own precedence
  sentence ("per-command override, else `default`, otherwise inherit") is about
  one *field* at a time, not about whole route objects. With the total shape, P3
  never has to ask "was this omitted or explicitly inherited?".
- **Blank file ≡ absent file.** A whitespace-only file parses as JSON nothing and
  would otherwise be a hard error; declaring nothing is what an empty file means.
  A *missing* file and a *blank* file both yield the shipped default, and only
  the missing-vs-present distinction matters for D-E5.
- **Unknown keys are rejected, not skipped.** Forward-compat leniency is the
  exact failure D-E5 exists to prevent: a typo'd `defualt` block would otherwise
  keep the operator convinced a route was live. Strictness is symmetrical —
  `{"commands":{}}` is valid, because an empty override list is a real answer.
- **Fail closed on any problem.** When a present file is invalid the loader
  returns the shipped default with `ok: false` instead of merging the halves that
  did validate, so a hostile project file cannot take effect through a broken
  sibling, and `parseConfigFile` returns no `config` property at all on failure —
  a rejected file cannot be merged by accident one call later.
- **Drift guard is compile-time, not runtime.** `src/extension/index.ts` asserts
  the mirrored thinking-level union equals Pi's `setThinkingLevel` parameter
  type. Probed by deliberately shrinking the mirror: `tsc` fails with TS2322
  rather than the package rejecting a valid level at runtime (SPEC "Risks").
- **Reconciled, not skipped:** P2's AC6 bullet also names "dispatch without
  `setModel`". Dispatch is P3's deliverable, so P2's suite asserts the resolution
  legs only and P3 adds the dispatch leg to the same AC6 validator. No assertion
  was dropped, and `ACCEPTANCE.md` is untouched.
- **Carried into P3:** the schema validates a configured command *name* as a
  slug but cannot check it against the bundled catalogue (the catalogue is P3's
  `test/alias-coverage.test.mjs`, AC1/AC2 validator). P3 must assert
  `commands` keys ⊆ catalogue, so a typo'd command name cannot silently route
  nothing. Recorded here so the obligation is not lost between phases.

## 2026-08-29 — execution (P3)

- **Sequencing deviation, disclosed:** the six P3 suites were written after the
  implementation, which breaks the repo rule "tests before implementation". The
  assertions were written from `ACCEPTANCE.md`/SPEC text rather than from the
  code, and every rule the phase owns was then mutation-checked — 16 source
  mutants, 16 killed (`testing.md`). That is compensating evidence, not an
  exemption: the end review should treat P3's tests as unproven-by-order and
  re-read them against the ACs.
- **The session model is opaque to the router (`M extends ModelRef`).** Pi's
  `Model` carries credentials and capability data this package must not rebuild,
  so the router stores whatever `ctx.modelRegistry.find()` returned and hands the
  same value back. Binding `M` to `NonNullable<ExtensionContext["model"]>` in the
  adapter is what removes the cast: `pi.setModel(model)` receives the exact
  object Pi produced. An earlier draft projected `{ provider, id }` and needed
  `as never`, which is the shape of bug this avoids.
- **`source` cannot tell our switch from the operator's.** Pi emits
  `model_select` with `source: "set"` for both an extension `setModel` call and
  the `/model` picker, so the only reliable discriminator is identity: a select
  whose model is not the one this turn applied is the operator's, and the turn
  then restores nothing. Symmetrically for `thinking_level_select` — clobbering a
  level the operator picked mid-turn would be the same bug in a smaller costume.
- **Thinking is restored after the model.** `setModel` recomputes the thinking
  level internally (per-model overrides), so restoring the model last would let
  Pi leave the level somewhere else and AC8 could not hold.
- **The surface is resolved per call, not held.** Pi exposes the model registry
  and `ui.notify` on the *context*, and hands a fresh context per handler/event;
  `createRouter` therefore takes `surface: (ctx) => ExtensionSurface`. Caching the
  first one would pin a session-bound object across a session switch.
- **Pi's `Model` is reached only through the context**, and the entry subscribes
  to exactly three events (`model_select`, `thinking_level_select`,
  `agent_settled`). Everything else — catalogue, guards, routing, restore,
  hinting — is Pi-free and unit-tested without a session, which is what keeps the
  peer dependency a type-level contract rather than a test dependency.
- **Two scanners, pinned.** `scripts/bundle-skills.mjs` (build time, must run
  before `tsc` and without `dist/`) and `src/routing/catalogue.ts` (runtime,
  inside the published package) both read `name` / `user-invocable`. Making one
  import the other would have put `dist/` on the AC2 validator's critical path.
  The duplication is instead closed by an assertion in `alias-coverage` that
  compares both verdicts across the whole real skill tree.

## 2026-08-29 — execution (P4)

- **The console edits one scope at a time and always shows the merge.** Offering
  "clear the override" against the merged view would let a project value survive
  a global edit, and the operator would conclude the tool lied. So the first
  question is *which file*, the draft is that file's parsed content, and the
  merged view is context, not the thing being edited.
- **A scope whose file does not parse cannot be opened for editing.** The
  tempting behaviour is to start from `{}` and save a clean file over it; that
  deletes the operator's typo, which is the only evidence of what went wrong
  (D-P6 keeps invalid config visible for exactly this reason). The console names
  the field path and refuses until it is fixed.
- **Nothing is written that the loader would not accept.** The draft is
  serialised and pushed through `parseConfigFile` before the save confirmation,
  so the console and the dispatcher cannot disagree about validity — one
  validator, no second opinion (P2).
- **`inherit`-only routes and the shipped policy are not written at all.** A file
  that says what the defaults already say is noise that outlives its reason, and
  it makes the project file shadow the global one in ways the operator did not
  choose.
- **The interactive surface joined `InvocationContext` as `ui` +
  `availableModels()`.** Routing never asks a question, so P3's view had no need
  for them; the console does, and Pi's own `ctx.ui` / `ctx.modelRegistry.getAll()`
  satisfy the structural types unchanged. This is the package's only question-
  asking code path.
- **A failing console is reported, not thrown.** The handler catches and notifies
  (e.g. `EACCES` on a read-only home directory); a rejected command handler would
  take the session down for a convenience feature.

## 2026-08-29 — execution (P5)

- **The README documents the rule, not a snapshot.** The command table is
  generated by nothing, so the assertion that keeps it true lives in
  `alias-coverage`: both READMEs are parsed for `/name` table rows and compared
  with the live catalogue, and the siblings must agree on section count and on
  the JSON example. A skill rename now breaks a test instead of quietly
  desynchronising two languages of documentation.
- **Claims were cut back to what the code does.** "Internal skills are not
  callable" became "get no command of their own" (Pi still reaches them as
  `/skill:<name>`), and "shows which values come from which file" became "shows
  which file is refusing to parse" — the view prints merged values and per-scope
  problems, not a per-value provenance trail.
- **The root README is deliberately untouched.** AC16 confines the branch to the
  package, its feature folder and the roadmap row; advertising the Pi package in
  the repository's own README is a separate unit of work, not a leftover here.

## 2026-08-29 — roadmap number race, owner-approved resolution

- **Keep 27 for the delivered unit** (user chose this over renumbering to 30).
  Rationale accepted by the owner: a number with no artifact yields to a unit that
  is planned, executed, documented in two languages and already carries PR #150 —
  renumbering would churn a frozen acceptance manifest's path to protect an empty
  reservation.
- Rows 28/29 were taken from `main` verbatim; this branch does not touch them.
