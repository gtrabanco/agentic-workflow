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
