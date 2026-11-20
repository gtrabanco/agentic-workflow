---
type: feature
scope: large
roadmap_summary: Adopt `@gotgenes/pi-permission-system` as the pi-side guard layer (bash/path/tool/MCP/skill), retire the first-party shell write guard whose prompts are decorative, and ship a config-driven guard-plugin core so a project declares its own deterministic guards — or a model-backed one once #444 lands — without touching package code.
---

# 654 — guard-layer

> One-line: the workflow stops policing its own shell writes with a guard whose
> approval prompt is decorative, hands bash/path/tool gating to the maintained
> plugin, and turns "the project's own guard" into a declaration in
> `pi-agentic-workflow.json` instead of a fork.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## State resolution (cut at P1)

`docs/features/654-guard-layer/` did not exist and the branch carried no commit
of its own (`git log --oneline origin/main...HEAD` printed nothing, the worktree
clean). The intent is therefore **continue/start**: the next incomplete phase is
`P1`. The three outcome words are not in play — no finding corpus exists to
repair and no head exists to re-verify.

At the owner's instruction the branch then took `origin/main` (`8fc204abb`,
units 632 and 650 plus the W47 journal aggregation) as an integration commit
before `P1` froze; the re-analysis below records what that integration changed
about this plan — one shape lesson, no superseded element.

## Specs

Requirements, each numbered `S#`, quoting the requester's own words verbatim.
`S1` is the turn's instruction; `S2…S11` quote issue
[#654](https://github.com/gtrabanco/agentic-workflow/issues/654), which `S1`
adopts. Every later decision cites the `S#` it serves.

**S1 — Apply the issue to this repository, locally, in this order.**
> Apply to this repository: issue #654
>
> This is a **local, unpublished** workflow for changing agentic-workflow itself. […] Work inline — never run this repo's own machinery on its own surgery. No `review-change`, no `audit-pr`, no fold cycle, no self-granted gate exceptions on this change.

**S2 — The goal: adopt the plugin, retire the first-party shell guard, ship a guard-plugin core.**
> Adopt [`@gotgenes/pi-permission-system`](https://github.com/gotgenes/pi-packages/tree/main/packages/pi-permission-system) (npm 42.2.0, MIT, actively maintained; fork of MasuRii's pi-permission-system) as the pi-side guard layer for bash/path/tool/MCP/skill gating, replacing the first-party shell write guard — the removal scope owner-confirmed in #606 that PR #608 never delivered (it shipped only the device-sink skip). Ship with it a **guard plugin core**: a declarative way for any project that installs agentic-workflow (via `init-workspace`) to add its **own** guards, because a target project's restrictions need not match ours — or may want more. One seam, two guard kinds: **deterministic** guards (available with this issue) and **SystemOne-backed** guards (issue #444, in or post — the seam must accept them without assuming them).

**S3 — The owner decisions this issue carries.**
> **Owner decisions (2026-11-19):** adopt the plugin; the SystemOne part lands in #444 or post-#444, never before; the deterministic part + plugin core is this issue and starts now; the guard/plugin configuration lives in `pi-agentic-workflow.json` (the extension's own config), while `agentic-workflow.json` keeps the agent hooks where the target agent supports them.

**S4 — Why now: the six verified failures of the first-party guard.**
> 1. **Path-guard prompts are decorative.** `decideShellWrite` judges `deps.confirm(question)` synchronously but the wiring injects async `ctx.ui.confirm` — a pending Promise is truthy, so the command runs regardless of the answer. Verified live: four out-of-root writes executed the **same second** their dialogs appeared, with zero user interaction (`packages/pi-agentic-workflow/src/guards/shell-path.ts`, wired at `src/extension/index.ts`).
> 2. **Heredoc bodies are scanned as command text** (bash feeds them to stdin and never runs them): a `/tmp`-writing heredoc whose payload merely *quoted* a redirect fired 3 dialogs with mangled pseudo-targets.
> 3. **No session grant**: no "allow for this session" option; an identical repeat re-prompts. Fix #608 only added the device-sink skip (`/dev/null`, `/dev/std*`, `/dev/fd/*`).
> 4. **No off switch**: `pathProtection` is declared always-on and not configurable.
> 5. **`write`/`edit` hard-block `/tmp` while bash allows it** (scratch carve-out asymmetry) — which pushes agents to write via bash heredocs.
> 6. **Static-analysis bypasses pass silently** (`python3 -c open()`, `dd of=`, `sed -i`, `curl -o`, computed `$DEST`; recorded in #606's debug): friction, not containment.

**S5 — What the plugin already solves.**
> The plugin already solves the class: tree-sitter-bash real grammar (heredocs are data; chained/nested commands decomposed; `bash -c`/`eval`/`sudo`/`env`/`xargs` indirection floors to **ask** — fail closed), `allow`/`ask`/`deny` per surface with omitted→`ask` default, cross-cutting `path` surface over **all** tools with canonical-form matching (symlink/case-resistant), an `external_directory` pattern map (kills the `/tmp` asymmetry), `/dev/null` + `/dev/std*` always excluded (POSIX and MSYS), native **session grants** ("Yes, allow \<pattern\> for this session", ephemeral), opt-in `promptTimeoutMs` (an unanswered prompt is **denied and the agent told** — never a silent decorative prompt), subagent ask forwarding, and the `permissions:ui_prompt` / `permissions:decision` bus that #444's SystemOne adapter can consume.

**S6 — In scope, verbatim.**
> - Adopt the plugin as the pi-side enforcement for bash/path/file-tool gating, including install/config guidance through `init-workspace` consent flows and the package README guards sections + pointer (the #606 agreed README requirement).
> - **Retire the first-party shell write guard** (the #606 owner-confirmed removal list): delete `packages/pi-agentic-workflow/src/guards/shell-path.ts`, the bash-branch wiring, the `SHELL_TEMP_ROOTS`/`SHELL_HOMEDIR` helpers, `test/shell-write-guard.test.mjs`, and the shell-bound-writes prose under the `path-protection@1` fence in `skills/orchestration-envelope/references/TURN_CONTRACT.md`. Tier 2 pathProtection (records-based, `edit`/`write` tools) **stays**.
> - **Guard plugin core**: a schema-first, config-driven way for a downstream project to declare its own guards in `pi-agentic-workflow.json` (extension-section owner; #427 merge rules; unknown keys refused, never merged; `init-workspace` offers meaningful defaults with consent). Both guard kinds share one seam: deterministic guards register as plugin Authorizer-chain links with deterministic logic (e.g. bridging our git-identity Layer 1 and the Tier 2 records into the chain), and model-backed guards use the same link contract once #444 ships the adapter.
> - Documentation for authoring a custom guard (package README / docs), so a user can add more than the defaults without touching package code.

**S7 — Out of scope, verbatim.**
> - **SystemOne adapter, decision templates, `/v1/systemone` provider calls**: owned by #444 (in or post). This issue ships no model call and must not block on #444.
> - **Git-identity semantics** (identity keys, scope escalation, `--file` scratch carve-out, approved identity): stays first-party (owner decision 2026-11-11); its mode-wiring defect is tracked separately.
> - OS-level sandboxing: `pi-permission-modes` territory (complementary, not here).
> - `permission-guard-pi`: evaluated 2026-11-19 and **not adopted** (fail-open on unknown commands, heuristic parser).

**S8 — Surfaces, verbatim.**
> - packages/pi-agentic-workflow
> - packages/agentic-workflow-schema
> - packages/pi-agentic-workflow/test
> - skills/init-workspace
> - skills/orchestration-envelope
> - docs

**S9 — Acceptance criteria, verbatim.**
> - With the plugin active, an out-of-root bash write prompts and a **decline blocks** the call (the await is honored); a session grant suppresses re-prompts for the session; `> /dev/null` never prompts.
> - Unparseable or indirected bash (`bash -c "…"`, `eval`, `sudo`) floors to ask (fail closed), never a silent pass.
> - The first-party shell guard is gone: no `shell-path.ts`, no bash-branch wiring, no shell-write suite; `rg -c 'decideShellWrite' packages/` returns 0; `TURN_CONTRACT.md` carries no shell-bound-writes prose; the normative-surfaces registry stays green.
> - A downstream project declares a custom deterministic guard in `pi-agentic-workflow.json` and sees it enforced **without touching package code**; unknown config keys are refused (not merged).
> - The seam's contract references no model or vendor; a SystemOne-backed guard is implementable against it after #444 without breaking changes (documented and stub-tested).
> - Verified in pi-web/RPC: the plugin's dialogs render and resolve via `extension_ui_request`/`extension_ui_response`; no double prompt once the shell guard is retired; no 5-minute unanswered hang (`promptTimeoutMs` denies and informs).
> - Root suites + affected package suites pass; changesets ship; version-parity gate green.

**S10 — Dependencies, verbatim.**
> **Blocked-by: none** — by owner decision (2026-11-19) nothing hard-blocks this issue: the deterministic layer and the plugin core stand alone, and the SystemOne-backed guard kind lands in #444 or post-#444. The native `blocked-by` list is intentionally empty; this prose is its mirror and they must agree.

**S11 — Open questions / risks, verbatim.**
> - Exact section shape and name in `pi-agentic-workflow.json` (schema-first; the extension descriptor owns it) — resolved at planning under #427's merge rules.
> - Whether the package bridges the plugin's own `config.json` or writes it through `init-workspace` consent (the plugin reads its own file; avoid a second copy of the same policy — one claim per path).
> - **Double-gate window**: between adopting the plugin and retiring the shell guard, both bash gates would fire — the unit must land adoption + retirement atomically (one PR).
> - pi-web RPC rendering of the plugin's TUI keybind dialog (the session-grant option must survive as a select option) — verify early in the unit.
> - The plugin is an operator-level pi package, not an npm dependency of our packages — pin/verify guidance must follow the pin and vendor-provenance rules.

## Impact

- **Consumers of the retired surface.** `packages/pi-agentic-workflow/src/extension/index.ts` loses one import, the bash branch's shell-guard block and the three module-scope helpers (`SHELL_TEMP_ROOTS`, `SHELL_HOMEDIR`, `readScriptBounded`); `test/shell-write-guard.test.mjs` disappears with its module. The bash branch keeps exactly its seam dispatch (`hooksWiring.onToolCall`), so the pre:commit/pre:push seams still see every bash call — pinned by the hooks suites.
- **What stops being true.** `skills/orchestration-envelope/references/TURN_CONTRACT.md` no longer claims bash containment under `path-protection@1`; `docs/workflow/CONFIG.md`'s `pathProtection` row and the pi package README's shell claims stop naming a first-party bash write guard. Nothing else in the tree asserts it (`rg 'decideShellWrite|analyzeShellWrite' packages/` is the pin).
- **What this unit consumes.** The plugin's published contract: install command, `~/.pi/agent/extensions/pi-permission-system/config.json` + `<project>/.pi/extensions/pi-permission-system/config.json` scopes, the `permission` surface map with last-match-wins, `external_directory`, `promptTimeoutMs`, native session grants, and the authorizer-chain seam (`getPermissionsService(sessionId).registerAuthorizer(name, authorize)`, links answer `allow`/`deny`/`defer`, config order wins, a missing link is skipped fail-safe). Source and freshness: `PE-001`…`PE-003`.
- **Double-gate window.** Adoption and retirement land in one branch and one commit series (S11's third bullet); the retirement commit is what removes the second bash gate.
- **Live-tree guard.** The plugin is not installed on this machine (`ls ~/.pi/agent/npm/node_modules/@gotgenes` → absent), so nothing in this change can execute against it: every mechanic is validated on fixtures and injected doubles, and the pi-web/RPC half of S9 is an operator checklist, recorded as such rather than claimed.
- **Public surface moving.** The pi package's config section gains one key (`guardPlugins`) and its descriptor is republished byte-for-byte, so the CLI's `config schema` offers it; the crate gains one `provision` operation.

## Surfaces

- `packages/agentic-workflow-schema`
- `packages/pi-agentic-workflow`
- `packages/agentic-workflow`
- `skills/init-workspace`
- `skills/orchestration-envelope`
- `docs`

## Retirements

| Surface | Replacement | Evidence |
|---|---|---|
| `packages/pi-agentic-workflow/src/guards/shell-path.ts` (`analyzeShellWrite`, `decideShellWrite`, `isScratchPath`, `SCRIPT_SCAN_MAX_BYTES`) | the operator-level permission plugin's `bash`/`path`/`external_directory` surfaces; the scratch carve-out moves to Tier 2's containment (`isScratchPath` relocates into `src/config/path-policy.ts`) | `rg -c 'decideShellWrite\|analyzeShellWrite\|shell-path' packages/` → 0 |
| the bash branch's shell-guard block in `src/extension/index.ts`, plus `SHELL_TEMP_ROOTS` / `SHELL_HOMEDIR` / `readScriptBounded` | the branch keeps only the seam dispatch; gating is the plugin's | `rg -c 'SHELL_TEMP_ROOTS\|SHELL_HOMEDIR\|readScriptBounded' packages/` → 0 |
| `packages/pi-agentic-workflow/test/shell-write-guard.test.mjs` (485 lines, 22 cases) | `test/permission-layer.test.mjs` pins the retirement, and `test/path-protection.test.mjs` absorbs the surviving scratch semantics | the file is absent; the deletion is recorded at `## Log` `D4` with its ground (the protected surface is gone) |
| the shell-bound-writes paragraph of `path-protection@1` in `skills/orchestration-envelope/references/TURN_CONTRACT.md` | one sentence naming the plugin as bash's owner (pointer, never a second copy of its contract) | `rg -c 'shell-bound writes' skills/orchestration-envelope/` → 0 |
| the pi package README's first-party shell-guard prose and the scratch-carve-out claim | the new "Permission layer" section + Tier 2's own section | `rg -c 'shell-bound' packages/pi-agentic-workflow/README.md` → 0 |

## Non-goals

- No model call, no SystemOne adapter, no decision template, no `/v1/systemone` provider (S7): a `model-backed` declaration is accepted by the schema and registers nothing until #444 supplies a kind handler.
- No git-identity change (S7): Layer 1, its keys, scope escalation and approved identity are untouched.
- No sandboxing, no `permission-guard-pi`.
- Not writing the operator's plugin `config.json` when it already exists: `provision permissions` refuses to overwrite and prints the block to merge instead.
- Not touching the plugin's own policy vocabulary: our declarations are *additions* rendered in the plugin's documented shape, never a fork of its semantics.

## Risk tier

- **Tier** — `standard` · **Task Size** — contained, resumable from the diff (retirement + one config section + one pure contract + one CLI operation)
- **Named high-risk item** — `none — not a high-tier unit`; the executable surface is a pure decision module and a renderer, and the retirement removes code rather than adding a live path.

`runner ceremony tier classify` needs the change's paths and was not run against a live tree (S1's inline route replaces the lane's plan step); the tier above is read from the touched set, and the review of this unit is the external verifier's, never a self-run ceremony.

## Future

none

## Future cost

- The `guard-plugin@1` seam binds whoever ships #444: a model-backed guard arrives as a **kind handler** (`registerGuardPluginLinks({ kinds })`), never as a second config section.
- The renderer's baseline block binds whoever changes the plugin's published policy shape: `renderGuardPluginPolicy` is the one place that shape is written, so an upstream surface rename is one edit plus its fixture.
- The retirement binds anyone tempted to add a first-party bash parser again: S4's six failures are the recorded cost of the last attempt, and `test/permission-layer.test.mjs` fails if a bash-gating module reappears under `src/guards/`.

## Applicable tests

- `packages/agentic-workflow-schema/test/guard-plugin.test.mjs` (new) — the contract, vocabulary and matcher.
- `packages/pi-agentic-workflow/test/guard-plugin-config.test.mjs` (new) — the `guardPlugins` section: strict validation, merge, descriptor parity.
- `packages/pi-agentic-workflow/test/guard-plugin-core.test.mjs` (new) — link building/registration, the model-backed stub, the absent-service degradation.
- `packages/pi-agentic-workflow/test/permission-layer.test.mjs` (new) — the retirement pins and the adoption's documented facts.
- `packages/pi-agentic-workflow/test/path-protection.test.mjs` (extended) — Tier 2 keeps its records decision and gains the scratch carve-out.
- `packages/agentic-workflow/test/provision.permissions.test.mjs` (new) — the renderer + the CLI operation.
- `packages/pi-agentic-workflow/test/config-extension.test.mjs`, `test/config-merge.test.mjs`, `test/config-schema-passes.test.mjs` — unchanged suites that must stay green with the new key.

## Known pre-existing issues

- The plugin is not installed in this environment, so its runtime behaviour (prompt rendering over pi-web RPC, the TUI keybind dialog's session-grant option) cannot be observed here. `does-not-affect` the code this unit ships; `affects` S9's pi-web bullet, which ships as the operator checklist in `skills/init-workspace/references/PERMISSIONS.md` and is reported `pending` in this unit's evidence.
- The verified plugin facts are read from its `main` branch today, not from the published `42.2.0` tarball (the issue names the version, the tarball is not vendored here). `does-not-affect` the seam's shape (it is ours); `affects` the documented policy skeleton, disclosed in `PE-002`.

## Tasks

- P1 — Freeze this unit doc and its two ledgers; record the path-protection justification rows for the paths this unit creates (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/features/654-guard-layer/SPEC.md` exits 0)
  (Implements: S1, S10, S11)
  - Relevant files: docs/features/654-guard-layer/SPEC.md, docs/features/654-guard-layer/planning-evidence.md, docs/features/654-guard-layer/planning-obligations.md, docs/features/654-guard-layer/decisions.md
- P2 — Land the RED suites alone — the six §2 reproducers plus the contract cases — and observe them fail on the absent module, the missing section, the surviving shell guard and the absent command (validator: `bun test packages/agentic-workflow-schema/test/guard-plugin.test.mjs packages/pi-agentic-workflow/test/permission-layer.test.mjs` exits 1 before P3)
  (Implements: S4, S9)
  - Relevant files: packages/agentic-workflow-schema/test/guard-plugin.test.mjs, packages/pi-agentic-workflow/test/permission-layer.test.mjs, packages/pi-agentic-workflow/test/guard-plugin-core.test.mjs, packages/pi-agentic-workflow/test/guard-plugin-config.test.mjs, packages/agentic-workflow/test/provision.permissions.test.mjs
- P3 — Publish the shared contract: the two vocabularies, `validateGuardPluginDeclaration`, `decideGuardPlugin`, `decideGuardPluginChain`, `matchesGuardPattern` and `renderGuardPluginPolicy` (validator: `cd packages/agentic-workflow-schema && bun run test` exits 0)
  (Implements: S2, S9)
  - Relevant files: packages/agentic-workflow-schema/src/vocabularies.ts, packages/agentic-workflow-schema/src/guard-plugin.ts, packages/agentic-workflow-schema/src/index.ts, packages/agentic-workflow-schema/README.md
- P4 — Wire the `guardPlugins` section into the pi extension config: types, strict validator, defaults, project-over-global merge, published descriptor and its committed copy (validator: `cd packages/pi-agentic-workflow && bun run test` exits 0)
  (Implements: S3, S8, S9, S11)
  - Relevant files: packages/pi-agentic-workflow/src/config/types.ts, packages/pi-agentic-workflow/src/config/schema.ts, packages/pi-agentic-workflow/src/config/defaults.ts, packages/pi-agentic-workflow/src/config/merge.ts, packages/pi-agentic-workflow/src/config/extension.ts, packages/pi-agentic-workflow/agentic-workflow.config.json
- P5 — Ship the guard-plugin core and its registration: the kind seam, the deterministic handler, the model-backed stub, the tolerant ask normalizer, the optional service loader and the session-start wiring (validator: `bun test packages/pi-agentic-workflow/test/guard-plugin-core.test.mjs` exits 0)
  (Implements: S2, S6, S7, S9)
  - Relevant files: packages/pi-agentic-workflow/src/guards/plugin-core.ts, packages/pi-agentic-workflow/src/extension/guard-plugin-wiring.ts, packages/pi-agentic-workflow/src/extension/index.ts
- P6 — Retire the first-party shell guard: delete the module and its suite, drop the bash-branch gate and the three helpers, move `isScratchPath` into Tier 2 and give write/edit the scratch carve-out (validator: `bun test packages/pi-agentic-workflow/test/permission-layer.test.mjs packages/pi-agentic-workflow/test/path-protection.test.mjs` exits 0)
  (Implements: S4, S6, S9)
  - Relevant files: packages/pi-agentic-workflow/src/extension/index.ts, packages/pi-agentic-workflow/src/config/path-policy.ts, packages/pi-agentic-workflow/src/guards/shell-path.ts, packages/pi-agentic-workflow/test/shell-write-guard.test.mjs
- P7 — Ship `agentic-workflow provision permissions`: the pure renderer (baseline skeleton plus declarations, collision refusal, last-match-wins order) and the CLI operation that prints the block and writes it only into an absent file (validator: `bun test packages/agentic-workflow/test/provision.permissions.test.mjs` exits 0)
  (Implements: S5, S6, S9, S11)
  - Relevant files: packages/agentic-workflow/src/provision/permissions.mjs, packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/README.md
- P8 — Update every prose surface the change touches — pi README, `docs/workflow/CONFIG.md`, `TURN_CONTRACT.md`, init-workspace's consent reference, the changeset — through their owners (validator: `bun scripts/normative-drift.test.mjs` exits 0 and `bun scripts/check-skill-context.mjs --documents` exits 0)
  (Implements: S5, S6, S8, S9, S11)
  - Relevant files: packages/pi-agentic-workflow/README.md, docs/workflow/CONFIG.md, skills/orchestration-envelope/references/TURN_CONTRACT.md, skills/init-workspace/references/PERMISSIONS.md, skills/init-workspace/SKILL.md, .changeset/654-guard-layer.md
- P9 — Run the declared verification in the foreground and record each command with its observed result: the root suite, both package suites, the drift gate, the projection check (validator: `bun scripts/run-root-suite.mjs` exits 0)
  (Implements: S7, S9)
  - Relevant files: docs/features/654-guard-layer/SPEC.md

### Planning evidence

The ledger lives in [`planning-evidence.md`](planning-evidence.md) (M/L unit: the
folder carries it, this section names it — never both).

### Obligations

The ledger lives in [`planning-obligations.md`](planning-obligations.md) (M/L unit).

## Re-analysis (before the plan froze)

| Issue element | Verdict | Evidence |
|---|---|---|
| The six first-party failures (S4) | confirmed, still present at the cut | `decideShellWrite` exists at `packages/pi-agentic-workflow/src/guards/shell-path.ts:352`; the bash branch injects `ctx.ui.confirm` into a sync `confirm` dep at `src/extension/index.ts:591` — the decorative-prompt defect, unchanged; `PE-001` |
| The retirement list (S6 bullet 2) | confirmed out of scope of every later unit, still fully present | `ls packages/pi-agentic-workflow/src/guards/shell-path.ts packages/pi-agentic-workflow/test/shell-write-guard.test.mjs` → both present; `rg -c 'shell-bound writes' skills/orchestration-envelope/references/TURN_CONTRACT.md` → 1; `PE-001`, `PE-004` |
| The plugin's contract (S5) | confirmed against its published docs, amended in detail | the chain seam is narrower than "deterministic guards decide at the gate": a link is consulted **only for an `ask`** and answers `allow`/`deny`/`defer`, so a deterministic `deny` must land in the plugin's *policy* to fire at all — hence one decision function, two carriers (policy projection + link) — `PE-002`, `PE-003`, `D1` |
| Section home (S11 bullet 1) | amended: resolved now, not at planning | `guardPlugins` in the pi extension section, `additionalProperties: false`, per-guard project-over-global merge — `D2`, `PE-005` |
| One claim per path (S11 bullet 2) | amended | the authoring surface is ours; the plugin's file is a **projection** written by a command, and only when absent — `D3`, `PE-003` |
| Double-gate window (S11 bullet 3) | confirmed and obeyed | retirement and adoption are one branch; the retirement commit is the only one that removes the second gate — `P6` |
| pi-web RPC rendering (S11 bullet 4) | superseded by environment: not observable here | the plugin is not installed (`ls ~/.pi/agent/npm/node_modules/@gotgenes` → absent); it ships as the operator checklist `PE-006` |
| Pin/vendor provenance (S11 bullet 5) | confirmed | no dependency is added: the service is loaded through an injected dynamic import, and the docs name the install command + version — `PE-007`, `D5` |
| The scratch asymmetry (S4 failure 5) | confirmed, and required on the surviving surface | Tier 2 blocks `/tmp` for `write`/`edit` exactly as the retired guard blocked it for bash; the plugin can only kill the asymmetry if Tier 2 stops blocking it — `D6`, `PE-008` |
| The integration of `origin/main` (2026-11-20, units 632 + 650) | confirmed, no element superseded; the plan takes the new precedent | `origin/main` landed `phaseBatching` — the same extension-section pattern this unit uses for `guardPlugins` — through `types`/`schema`/`defaults`/`merge`/`extension` + the committed descriptor + the `default-inherit` expectation + a `CONFIG.md` row and section (`PE-005`). So the re-analysis gains one shape lesson, not a new requirement: `guardPlugins` joins `ROOT_KEYS` beside it, `P4` carries the merged file set, and `test/default-inherit.test.mjs`'s resolved-shape expectation grows the section exactly as #632's did. Nothing in the guard layer moved: `shell-path.ts`, the bash branch and the `TURN_CONTRACT.md` prose are unchanged at `8fc204abb`, and the four new `normative-surfaces@1` rows are phase-batching's, so this unit still adds none — `PE-011`, `D7`. |

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-19, the request, verbatim:
  ```
  Apply to this repository: issue #654

  This is a **local, unpublished** workflow for changing agentic-workflow itself. The failure it prevents: the workflow judging its own surgery (unit fix-258 burned 12 review→fold cycles that way). Follow this order, every step:
  …
  ```
  (The full instruction is carried in the turn; `S1` quotes the part the plan
  binds, and the numbered `S#` requirements above are the issue's own words.)
- **E1** — 2026-11-20, `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/features/654-guard-layer/SPEC.md` · exit 0 · `verdict PASS`, nine phases at `PASS (6/6)`, fingerprint `d4770795f4bc…`.
- **P1** — 2026-11-19, unit doc and the two ledgers frozen at the cut; the six §2 reproducers and the contract cases are the planned RED corpus (`P2`). No code touched yet.
- **D1** — 2026-11-20, the seam is one decision function with two carriers. The plugin's authorizer chain is consulted **only for an `ask`** and a link answers `allow`/`deny`/`defer` (`PE-003`), so a deterministic `deny` declared only as a link would never fire: the same decision function therefore feeds both the policy projection (which decides at the gate) and the chain link (which answers the asks the policy left open). Authority: the plugin's published chain contract plus `S6` bullet 3's "one seam, two guard kinds".
- **D2** — 2026-11-20, the section is `guardPlugins` in `pi-agentic-workflow.json`: `{ enabled?: boolean, guards: { <name>: { kind, surface, rules: [{ match, verdict?, reason? }] } } }`. Strict at every level; `enabled` merges per field and guards per name (a project declaration replaces the global one wholesale, because a rule list is one ordered policy and a half-merged list is a different policy). Resolves `S11` bullet 1 under `S3`'s extension-section owner; the shape follows `PE-005`'s landed precedent.
- **D3** — 2026-11-20, one claim per path (`S11` bullet 2): our section is the authoring surface, and the plugin's `config.json` is a **projection** produced by `agentic-workflow provision permissions`. `--write` creates the file only when absent; an existing file is refused with the block printed, so an operator's own policy is never clobbered and never silently duplicated.
- **D4** — 2026-11-20, deletion ground (`IR3` §Deletion authority): `test/shell-write-guard.test.mjs` goes because the surface it protects is gone (`S6` bullet 2 names it, and `O6`'s validator proves the module with it). The surviving scratch semantics are not deleted with it — they move to `test/path-protection.test.mjs` as `O4`'s pair.
- **D5** — 2026-11-20, no dependency is added (`S11` bullet 5): the service is reached by an injected loader (`loadPermissionService`) that a caller supplies, and the service type is structural — the same shape the package already uses for `registerMcpServer`/`registerTool` (`PE-007`). A missing package is a declared skip, never an import error at module load.
- **D6** — 2026-11-20, Tier 2 gains the OS-temp scratch carve-out. `S4` failure 5 names the asymmetry and `S5` says the plugin's `external_directory` map kills it — which it cannot while our own Tier 2 refuses every `/tmp` write before the tool runs. The carved-out semantics are the retired guard's own (in-root first, then scratch, then refusal), so no new policy is invented; the durable out-of-root refusal is unchanged and pinned (`PE-008`, `O4`). This is the one behaviour change beyond pure retirement, and it is reported as such in the hand-off.
- **D7** — 2026-11-20, no `normative-surfaces@1` rows are added: `GUARD_PLUGIN_KINDS` and `GUARD_PLUGIN_SURFACES` are published exports that no gate reads, and the rowless-export precedent is recorded (`PE-011`). The contract's prose names the module as its owner (`IR11`), and registering them would spend the guide's exact machine-line pin for a vocabulary nothing orders.
- **D8** — 2026-11-20, the pi-web/RPC half of `S9` is an operator checklist: the plugin is not installed here (`PE-006`), so `O23` closes `n/a` with that citation and the reference carries the three observations to make on a machine that has it. No self-granted exception: the row is `n/a` on evidence, never `verified` on assumption.
- **D9** — 2026-11-20, registration happens at `session_start` through the two verified facts (`getPermissionsService(sessionId)` + `registerAuthorizer(name, authorize)`, `PE-003`): a session with no id, or a machine with no service, skips every declared guard with its reason and notifies once — the fail-safe direction the plugin's own contract states ("absence of a judge means more prompting, never less").

## Next

Run `P2`: land the RED suites alone and observe each one fail on the absent
surface before any implementation.
