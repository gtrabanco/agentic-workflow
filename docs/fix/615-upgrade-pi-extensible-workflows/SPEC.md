---
type: fix
scope: small
---

# fix/615-upgrade-pi-extensible-workflows

> The `pi-extensible-workflows` pin (`6.3.0`) is behind the registry (`6.4.0`)
> and the registry half of the parity gate is red on every branch. The bump is
> the last step of the unit: the window is read and classified entry by entry,
> the new APIs are inventoried and proposed, the breaking item's consequence is
> documented, and only then does the pin move — with its lock and its release
> intent.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#615` — [chore(deps): upgrade pi-extensible-workflows 6.3.0 -> 6.4.0 (pin drift, breaking change, API review)](https://github.com/gtrabanco/agentic-workflow/issues/615).
The PR closes it via `Closes #615`.

## Specs

**S1 — The drift, and the frozen failure it is.**
> "`packages/pi-agentic-workflow` pins `pi-extensible-workflows` at **6.3.0**; the
> registry published **6.4.0** on 2026-11-16. The PR-time pin half of the parity
> gate refuses the drift, so the `dependency-pin-gate` step is **red on every
> branch and on `main`** until the pin moves — PR #605 already carries it as a
> disclosed pre-existing failure."
>
> "### Detected in
>
> 2026-11-17, `bun scripts/local-gate.mjs` on `feat/470-content-guard-layer`
> (PR #605). Output: `GATE REJECTION — dependency-pin-drift · @gtrabanco/pi-agentic-workflow pins pi-extensible-workflows at 6.3.0 but the registry published 6.4.0`.
>
> ### Reproduction
>
> ```
> node scripts/version-parity-gate.mjs --pins
> # GATE REJECTION — dependency-pin-drift
> #   @gtrabanco/pi-agentic-workflow pins pi-extensible-workflows at 6.3.0
> #   but the registry published 6.4.0.
> ```"

**S2 — The bump is the last step, not the first: read, inventory, migrate, propose.**
> "The bump is the last step, not the first. In this order:
>
> 1. **Read the whole window** (6.3.0 → 6.4.0) and classify **every** item in the
>    PR: *affects us* / *does not* / *new API worth adopting*. The pin gate names
>    the version that moved, never what moved in it.
> 2. **Inventory the new APIs** — the `exports` map is identical between the two
>    versions (`.`, `./types`, `./utils`, `./budget`, `./runtime`, `./registry`,
>    `./trajectory`, `./validation`, `./persistence`), so the delta lives in
>    settings and behaviour. For each new API or setting: do we use it today, would
>    it replace a manual step, would it open a capability we do not have?
> 3. **Migrate** what the breaking change requires here (today: nothing in code;
>    the release-notes behaviour is documentation).
> 4. **Propose** every "worth adopting" to the owner with a one-paragraph case.
>    Accepted ones become **their own issues/units** — never scope of the deps PR."

**S3 — The delivery shape: pin, version intent and lock in the same PR.**
> "`pi-extensible-workflows` pinned at **6.4.0**, with the package version and its
> `CHANGELOG.md` companion row (or a valid `.changeset/` declaring
> `@gtrabanco/pi-agentic-workflow`) in the **same** PR."
>
> "5. **Then bump**: pin + package version + `CHANGELOG.md` companion row (or a
>    `.changeset/` declaring the package) in the same PR, `bun install` to refresh
>    `bun.lock`, and the gate green."

**S4 — The gate's pins half turns green.**
> "`node scripts/version-parity-gate.mjs --pins` exits 0 with the network up, and
> `bun scripts/local-gate.mjs` no longer lists `dependency-pin-gate` as a
> failure."

**S5 — Every 6.4.0 entry is classified, the breaking item included.**
> "The PR records the window classification (item → affects us / does not /
> worth adopting) for **every** 6.4.0 entry, the breaking item included."

**S6 — The extension still loads by path on the pinned Pi floor, suite green.**
> "The extension still loads by path on the pinned Pi floor and
> `bun run --cwd packages/pi-agentic-workflow test` is green, the subagent
> config-merge and settings-console suites included."

**S7 — The breaking item's consequence for our users is stated, and its fix is separate.**
> "The breaking item's consequence for our users (no release notes from a
> path-loaded extension) is stated in the PR and, if the owner wants it
> compensated, that work is a separate issue."

**S8 — Every "worth adopting" item is a recorded proposal with the owner's accept/reject.**
> "Every "worth adopting" item is recorded as a proposal with the owner's
> accept/reject; nothing accepted is implemented inside this PR."

**S9 — The lock carries only the resolution change the bump forces.**
> "`bun.lock` carries only the intended resolution change, reviewed."

## Impact

Cut at plan time. Every surface this unit reads or writes, and what changes on it:

| Surface | Why it changes | Its consumers |
|---|---|---|
| `packages/pi-agentic-workflow/package.json` | S3: the `pi-extensible-workflows` pin `6.3.0` → `6.4.0`; no other field, no dependency added or removed | every install of the package, the `pi.extensions` path that loads the subagents entry |
| `bun.lock` (root, the workspace's one lockfile) | S9: the importer's pin, the `pi-extensible-workflows@6.4.0` entry, and the resolutions its own dependency change forces (`minimatch` `^10.2.5` → `^11.0.8`); frozen-installable | `bun install --frozen-lockfile`, the workspace-lock policy suite, the advisory pass |
| `.changeset/615-upgrade-pi-extensible-workflows.md` | S3/S5: the release intent declaring `@gtrabanco/pi-agentic-workflow` plus the window record the release notes render | `scripts/release.mjs`, `scripts/lint-changeset.mjs`, the version-parity content half |
| `packages/pi-agentic-workflow/README.md` (*Subagent layer*, line 423) | S7: the sentence states `6.3.0, pinned`; it names the version and now also states the release-notes consequence of loading the extension by path | the package's readers, the install/disable instructions |
| `docs/ROADMAP.md` `## Fixes` row | this unit's registration, written through the crate's `roadmap fixrow` writer | the roadmap readers, `roadmap-settle` |
| `docs/generated/units.md` | the projection of the unit tree, regenerated by its emitter | the docs site |
| `.agentic-workflow/journal/<ts>-fix-615-…md` | S7 of the apply workflow: the session entry as a committed fragment (the aggregator appends `docs/LOGS.md` at merge) | the merge aggregator, `docs/LOGS.md` |
| `docs/fix/615-upgrade-pi-extensible-workflows/SPEC.md` | this unit doc | the external verification |

Sweep at plan time: `rg -n '6\.3\.0' --glob '!bun.lock'` in the working tree names
exactly one live prose surface — `packages/pi-agentic-workflow/README.md:423`
(`pi-extensible-workflows` 6.3.0, pinned). Every other hit is another unit's
frozen ledger (`docs/fix/260-subagent-first-execution/*`,
`docs/fix/570-track-undici-advisories/SPEC.md:157`, `docs/features/494-*`,
`docs/features/591-*`), the CHANGELOG's own release history, or a synthetic
fixture (`scripts/local-gate.test.mjs:589`) — none of them is rewritten by a pin
bump, and the fixture builds its own manifest.

### Window classification (6.4.0, one row per changelog entry)

Read from `CHANGELOG.md` at the upstream `v6.4.0` tag and cross-checked against
the npm tarball diff (`pi-extensible-workflows-6.3.0.tgz` vs `-6.4.0.tgz`). The
unit's own `## Log` carries both runs.

| id | 6.4.0 entry | verdict | what it means here |
|---|---|---|---|
| W1 | **Breaking** — the extension no longer shows its own release-notes notice at startup; `<agentDir>/pi-extensible-workflows/changelog-state.json` is no longer read or written and can be deleted | affects us | `packages/pi-agentic-workflow/package.json` registers the extension **by path** (`pi.extensions`), so our users get no release notes from it after the bump. We never referenced `changelog-state.json` (`rg -c` in `packages skills docs` → 0 matches), so the removal needs no code change — the consequence is S7's documentation |
| W2 | New `worktreeSetup` workflow setting (shell commands run in each newly created workflow/subagent worktree, `PIEWF_WORKTREE_PATH`/`PIEWF_SOURCE_ROOT`/`PIEWF_WORKTREE_BRANCH`, failure or 10-minute timeout ⇒ `WORKTREE_FAILED` and the worktree is removed) | worth adopting — proposed, owner decides | it automates a copy step, but only in **piew-created** worktrees: this repo creates its worktrees with `git worktree add` per `AGENTS.md` (*Worktree creation*, step 5), and the subagents extension only creates one when a subagent is launched with a worktree scope — which no skill here instructs. Case and owner question: `## Future` PR1 |
| W3 | `reviewLoop` accepts `sharedReviewer: true` (one persistent reviewer handle across iterations instead of a fresh reviewer each time) | worth adopting — **recommend reject** | this repository never calls piew's `reviewLoop` (the starter extension is not loaded and no skill names `reviewLoop`); the reviews that would use it are `review-change`'s, whose isolation rule mandates independent passes. Adopting it would trade that independence for cost: PR2 |
| W4 | `@piewf/cli` bundles Pi 1.5.2 instead of 1.0.0 (drops Pi 1.0.0's vulnerable `undici`/`brace-expansion`) | does not affect us | `piewf` is upstream's standalone CLI; this repository neither ships it nor invokes it (`rg -c 'piewf' skills packages/pi-agentic-workflow/src packages/pi-agentic-workflow/README.md` → 0 matches) |
| W5 | Core depends on `minimatch` 11.0.8 instead of 10.2.5, fixing `GHSA-g3hv-75wg-m249` | affects us (resolution only) | our lock's `pi-extensible-workflows` entry moves `minimatch` `^10.2.5` → `^11.0.8`, so the top-level resolution goes `10.2.6` → `11.0.9`; Pi 1.4.0 (our dev-resolved peer) keeps its own `minimatch` `10.2.6`, so the advisory pass still reports that copy report-only — it is Pi's manifest, not ours |
| W6 | Prompt inspection works again on Pi 1.2.0 and later (the internal `before_agent_start` emitter signature changed) | does not affect us | prompt inspection is the workflow **engine** extension's `inspect` surface; `pi.extensions` registers only our own extension and the subagents entry — the engine is never loaded |
| W7 | In the agents workspace, plain Home and End (`\x1b[1~`, `\x1b[4~` from tmux and screen) end the notices again on Pi 1.5, where they no longer bind to an alt-screen action | affects us (positively, no action) | the keybinding matcher lives in the bundle we load (`dist/subagents/index.js`), so `/subagents`, the picker this extension registers, gets the wider action set back |
| W8 | `piewf doctor cleanup` and automatic retention no longer refuse a whole session as "corrupt or incomplete" when a worktree one of its runs borrowed was already removed; a missing directory counts as already cleaned up | affects us (positively, no action) | the store that decides this is inside the bundle we load (`store.ts` → `ownedWorktree`/`findNamedWorktree`/`validateBorrowedWorktrees` gain `requireDirectory = false` for the deletion path): a subagent run whose borrowed worktree was removed by hand is no longer un-retainable. No CLI involvement in our surface |
| W9 | The `subagents_run` tool description now tells the model that extensions may accept extra options and that their usage is described in the system prompt | affects us (no action) | the description is the one text the model reads from the tool we do load; it changes no schema and our docs do not restate it |

The issue's own window summary named five of these six fixes and omitted W7;
`## Known pre-existing issues` records that as a reading, not a defect of this
unit.

### Delta of the entry we load (`dist/subagents/index.js`)

The changelog is the user-facing list; the file-level delta is what our process
actually executes. Every hunk, classified:

| hunk | verdict |
|---|---|
| `Type` imported from `typebox` instead of `@earendil-works/pi-ai` (`host.ts`, `agent-execution.ts`, `subagents/src/contracts.ts`) | compatible: the bundle already imported `typebox/value` and `typebox/compile` at runtime in 6.3.0, so the peer-resolved `typebox` was already a load-time requirement; 6.4.0 unifies the two instances on the peer one |
| `resourcePatternMatches` invalid-pattern check: `matcher.makeRe() === false` → `matcher.set.length === 0` | behaviour-preserving: minimatch 11 no longer exposes the same `makeRe()` contract; the invalid-pattern refusal keeps its message. Pinned by the settings/selector probe (E9) |
| `runWorktreeSetup` + `settings.worktreeSetup` decode/validate/allow-list + adapter `create(context, setup)` | W2, inert until a user sets the key (the settings schema refuses an unknown key, so before 6.4.0 the same file was rejected) |
| `decodePhaseRecord` accepts an optional `startedAt` | additive acceptance: a persisted run record written by the newer engine still decodes |
| borrowed-worktree `requireDirectory` thread | W8 |
| `subagents_run` description text | W9 |
| TUI `TUI_ACTIONS` instead of `ALT_SCREEN_ACTIONS` | W7 |

## Surfaces

- `packages/pi-agentic-workflow`
- `docs`

## Retirements

Nothing is retired. The unit moves one pin value, refreshes the lock it forces,
and repairs one README sentence; no exported name, command, flag, config key,
doc section or skill is superseded. Inventory receipt over the cut base
`8c1a05a8`:

```
bun scripts/residual-classify.mjs --inventory --base origin/main
→ { "contract": "residual-classify-inventory@1", "rows": [] }
```

The empty inventory is the honest answer for a value-and-prose change: the diff
adds no surface to classify.

## Non-goals

- **No feature adoption.** `worktreeSetup` and `sharedReviewer` are proposals
  (S8); nothing accepted lands here, and a rejected one leaves no code.
- **No compensation for the release-notes loss.** W1's consequence is
  documented (S7); shipping our own release-notes notice is the owner's call and
  would be its own unit.
- **No move of Pi's own `minimatch`.** The remaining `10.2.6` in the tree is
  `@earendil-works/pi-coding-agent@1.4.0`'s declared dependency (W5); changing it
  means changing the peer the package is tested against — a separate unit with
  its own window review.
- **No `typebox` pin of our own.** The subagents entry resolves `typebox` as a
  peer of the host, as it already did in 6.3.0 (see the delta table).
- **No version bump written by hand.** D-40-14 keeps one train version across
  the four packages; the release intent carries the change and the train stamps
  it at cut.

## Risk tier

Verdict copied verbatim from `agentic-workflow ceremony tier classify` over the
planned paths (`contract: risk-tier-verdict@1`):

- **Tier** — `standard` · **Task Size** — `understood: true`, `contained_risk: contained`, `resumable_from_diff: true`, `ceremony: unit-doc`, `verification: gates`
- **Named high-risk item** — none — not a high-tier unit (`signals: []`)
- **Reason** — `executable-content`: 2 planned paths carry executable content (`bun.lock`, `packages/pi-agentic-workflow/package.json`)

## Future

Proposals owed to the owner by S8 — recorded with their case, decided by the
owner, and never implemented here. Status stays `open` until the owner answers.

- **PR1 — `worktreeSetup` (status: open, proposed 2026-11-17).** *Case:* the
  setting runs a declared list of shell commands inside every newly created
  workflow/subagent worktree, with `PIEWF_WORKTREE_PATH`, `PIEWF_SOURCE_ROOT`,
  `PIEWF_WORKTREE_BRANCH` in the environment, and removes the worktree when a
  command fails or exceeds ten minutes (`WORKTREE_FAILED`). Today `AGENTS.md`
  (*Worktree creation*, step 5) instructs an agent to `cp -n` the two Serena
  files by hand, which is exactly the kind of step a declared command list
  removes. *Limit worth weighing:* the setting only fires for worktrees piew
  creates — a subagent launched with a worktree scope — not for the
  `git worktree add` this repository's own recipe runs, and no skill here
  currently launches a subagent with a worktree. So adopting it means both
  setting the key in the workflow settings and giving the orchestrate path a
  reason to use piew worktrees; that is a capability change, not a copy step.
- **PR2 — `reviewLoop.sharedReviewer` (status: open, proposed 2026-11-17,
  recommended reject).** *Case:* keeping one reviewer handle across iterations
  cuts the reviewer's rebuild cost, but it also hands later iterations the
  previous conversation, and the whole point of `review-change`'s isolation rule
  is that a reviewer never inherits the conclusions of the pass before. The
  likely verdict is reject on that ground, not on cost.
- **PR3 — `minimatch` (`GHSA-g3hv-75wg-m249`) in the tree (status: open,
  proposed 2026-11-17).** *Case:* after this bump the top-level `minimatch`
  resolves `11.0.9` (fixed); the only `10.2.6` left is
  `@earendil-works/pi-coding-agent@1.4.0`'s own declared dependency. Moving it
  means moving the Pi version this repository dev-resolves and tests against —
  a separate unit with its own peer-window review, and the advisory is
  report-only until then.

## Future cost

| Standing obligation | Who it binds |
|---|---|
| A dependency upgrade is a deliberate `fix(deps)` unit with its own window read — never a side effect of unrelated work | every future pin bump |
| The `pi-extensible-workflows` pin and the README sentence at *Subagent layer* name the same version, and the README states what a path-loaded extension does not get | whoever moves this pin again |
| A piew window that removes or renames a surface the loaded entry exposes is read as a **loaded-entry** delta, not only as a changelog list (the changelog is written for the engine's users) | the next window review |
| `worktreeSetup` never lands in a workflow settings file before its proposal is accepted; the key executes shell commands | whoever writes `.pi/workflow.json` here |

## Acceptance criteria

- **AC1 (S1)** — the drift is real and its reproducer is on record: at the cut
  head `8c1a05a8`, `bun scripts/version-parity-gate.mjs --pins` exits 1 with
  `GATE REJECTION — dependency-pin-drift` naming `6.3.0` and `6.4.0` (E1).
- **AC2 (S2)** — the window was read before the pin moved, and the record is
  reviewable: the `CHANGELOG.md` at the upstream `v6.4.0` tag plus the two npm
  tarballs are the source (E3, E4), the classification carries one row per
  changelog entry (9) and one per loaded-entry hunk (7), and the unit's commit
  order puts the doc before the bump (`git log --reverse --format=%s`).
- **AC3 (S3)** — the manifest pin names `6.4.0` and the release intent declares
  the package in place of a hand version bump:
  `rg -c '"pi-extensible-workflows": "6.4.0"' packages/pi-agentic-workflow/package.json`
  matches 1, `bun scripts/lint-changeset.mjs .changeset/615-upgrade-pi-extensible-workflows.md`
  exits 0, and `bun scripts/version-parity-gate.mjs --content --base origin/main`
  exits 0.
- **AC4 (S4)** — the pins half turns green:
  `bun scripts/version-parity-gate.mjs --pins` exits 0 with no `GATE REJECTION`
  line, and the local gate's `dependency-pin-gate` step is no longer a failure.
- **AC5 (S5)** — every 6.4.0 entry is classified: the `### Window
  classification` table carries exactly 9 `W` rows — one per `- ` bullet of the
  `## [6.4.0]` section — and each row states affects-us / does-not /
  worth-adopting.
- **AC6 (S6)** — the extension still loads by path on the pinned Pi floor and
  the package suite is green: the floor (`@earendil-works/pi-coding-agent@1.1.0`)
  and latest load probe imports `dist/subagents/index.js` of both versions and
  registers the same five tools (E10), and
  `bun run --cwd packages/pi-agentic-workflow test` reports 956 pass / 0 fail,
  `config-merge-subagents` and `settings-console` included (E11).
- **AC7 (S7)** — the breaking consequence is stated where the pin is documented:
  `packages/pi-agentic-workflow/README.md` says a path-loaded extension shows no
  release notes (`rg -c 'no release notes' …` matches 1) and names `6.4.0`
  (`rg -c '6\.4\.0' …` matches ≥1); the compensation is a proposal, not code.
- **AC8 (S8)** — the proposals are recorded with their case and the owner's
  decision slot: `## Future` carries PR1–PR3, and
  `rg -c '^- \*\*PR[0-9]' docs/fix/615-upgrade-pi-extensible-workflows/SPEC.md`
  matches 3; the branch diff contains no feature code.
- **AC9 (S9)** — the lock carries only what the bump forces:
  `bun install --frozen-lockfile` exits 0,
  `rg -c 'pi-extensible-workflows@6\.4\.0' bun.lock` matches 1, and
  `git diff origin/main...HEAD -- bun.lock` names only the importer pin, the
  `pi-extensible-workflows` entry, `minimatch`, `@isaacs/nonrecursive-glob-match`
  and Pi's nested `minimatch` (E8 is the fixture that predicted exactly that).

## Applicable tests

No new test file: the change is a manifest value, its lock and one prose
sentence, and every rule it must satisfy already has an owner-backed check. The
derived set (`bun scripts/test-impact.mjs --paths
packages/pi-agentic-workflow/package.json bun.lock packages/pi-agentic-workflow/README.md`
→ verdict `targeted`, 14 suites, E7) is:

- `scripts/version-parity-gate.test.mjs` — the content/pins matrix (unchanged).
- `scripts/pin-watch.test.mjs` — the drift evaluator that filed the issue.
- `scripts/workspace-lock-policy.test.mjs` — the lock policy the refreshed lock
  must keep satisfying.
- `scripts/local-gate.test.mjs` — the steps, the pin step included.
- `scripts/release.test.mjs`, `scripts/changeset-create.test.mjs` — the release
  intent path.
- `scripts/dependency-advisory-pass.test.mjs` — the advisory census over the
  resolved tree.
- `scripts/differential-baseline.test.mjs`, `scripts/normative-drift.test.mjs`,
  `scripts/gate-receipt.test.mjs`, `scripts/review-loop-discipline.test.mjs` —
  the receipt, surface and review-contract paths the changed manifest feeds.
- `packages/agentic-workflow-schema/test/gate-receipt.test.mjs`,
  `packages/agentic-workflow-schema/test/verification-gates.test.mjs`,
  `packages/agentic-workflow/test/doc.section-locator.test.mjs` — the contract
  suites the workspace lock resolves.

The behavioural differential is the package suite plus the load probe
(`## Regression scope`).

## Known pre-existing issues

- **The issue's window summary names one fix bullet fewer than the changelog** —
  it lists five of the six `### Fixes` bullets; the `Home`/`End` notices fix
  (W7) is only in the changelog. **does-not-affect** this unit: the
  classification is cut from the changelog at the tag, and W7 is recorded there.
  Recorded so the next reader does not take the issue's list as complete.
- **`@earendil-works/pi-coding-agent@1.4.0` carries `minimatch@10.2.6`**, one
  advisory row that survives the bump (`GHSA-g3hv-75wg-m249`, report-only).
  **does-not-affect** this unit's deliverable (the drift and its gate are the
  bump's subject); the remaining copy is a peer-version decision — PR3.
- **`version-parity-gate --pins` defaults to the Pi package only** when
  `--package` is absent (the same gap `docs/fix/588-typebox-pin-drift` recorded),
  so a crate-only drift passes the wired gate. **does-not-affect** this unit: the
  drift this unit closes is the Pi package's own pin, which is the default.
- **Sibling worktrees in progress** (`feat/554-…`, `feat/610-…`) —
  `scripts/worktree-guard.mjs` judges each; neither touches this unit's paths and
  this unit neither reads nor writes their checkouts. **does-not-affect** this
  unit.

## Tasks

- P1 — Cut this unit doc with both planning ledgers, the window classification and the proposal rows, and register the `## Fixes` row through the crate's `roadmap fixrow` writer (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/fix/615-upgrade-pi-extensible-workflows/SPEC.md` prints `verdict PASS`)
  (Implements: S1, S2, S5, S8)
  - Relevant files: docs/fix/615-upgrade-pi-extensible-workflows/SPEC.md, docs/ROADMAP.md
- P2 — Move the pin to `6.4.0` and refresh the root lockfile (validator: `bun install --frozen-lockfile` exits 0 and `rg -c 'pi-extensible-workflows@6\.4\.0' bun.lock` matches 1)
  (Implements: S1, S3, S9)
  - Relevant files: packages/pi-agentic-workflow/package.json
- P3 — Ship the release intent with the window record and repair the README's pin sentence with the breaking consequence (validator: `bun scripts/lint-changeset.mjs .changeset/615-upgrade-pi-extensible-workflows.md` exits 0 and `rg -c 'no release notes' packages/pi-agentic-workflow/README.md` matches 1)
  (Implements: S3, S5, S7)
  - Relevant files: .changeset/615-upgrade-pi-extensible-workflows.md, packages/pi-agentic-workflow/README.md
- P4 — Verify the reproducer, both gate halves, the floor/latest load probe and the package differential (validator: `bun scripts/version-parity-gate.mjs --pins` exits 0 and `bun run --cwd packages/pi-agentic-workflow test` reports 956 pass / 0 fail)
  (Implements: S1, S4, S6, S9)
- P5 — Docs and state: settle the `## Fixes` row, regenerate the projection, write the session entry through the journal writer (validator: `bun scripts/docs-generate.mjs --check` exits 0 and `bun scripts/roadmap-settle.mjs` prints `verdict: PASS`)
  (Implements: S2, S5, S8)

### Planning evidence

One row per Engineering claim (column order and vocabularies owned by
`skills/pre-execution-review/references/LEDGERS.md`).

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | registry | `pi-extensible-workflows`' latest published release is `6.4.0` (2026-11-16T19:05:49.561Z); `6.3.0` published 2026-10-25T12:55:53.316Z, so the window is one release | `https://registry.npmjs.org/pi-extensible-workflows` (`dist-tags`, `time`) fetched 2026-11-17 (E2) | current | O1, O2 |
| PE-002 | repository | the drift is real at the cut head `8c1a05a8`: the Pi package pins `6.3.0` and the gate rejects it | `packages/pi-agentic-workflow/package.json` (`dependencies.pi-extensible-workflows`); `bun scripts/version-parity-gate.mjs --pins` → exit 1, `GATE REJECTION — dependency-pin-drift` (E1) | current | O1, O2 |
| PE-003 | tool-behaviour | the window's content is the upstream `CHANGELOG.md` at `v6.4.0`: 9 bullets — 1 breaking, 2 new capabilities, 6 fixes — and the release is a breaking change shipped as a minor on purpose | `https://raw.githubusercontent.com/vekexasia/pi-extensible-workflows/v6.4.0/CHANGELOG.md` fetched 2026-11-17 (E3) | current | O7, O8, O9, O11 |
| PE-004 | tool-behaviour | the package's surface is unchanged apart from version, devDeps and one dependency range: the `exports` map is byte-identical (9 entries), no top-level key added or removed, `dependencies.minimatch` `^10.2.5` → `^11.0.8`, bundled Pi `1.0.0` → `1.5.2`, tarball delta = 55 files (all `dist`/`src`/`starter`/`subagents` + `CHANGELOG.md` + `package.json`) | npm tarballs 6.3.0 vs 6.4.0 extracted in a `mktemp -d` and diffed (E4) | current | O6, O7, O10 |
| PE-005 | repository | nothing is imported from the package and it is loaded by path: `pi.extensions` names `./node_modules/pi-extensible-workflows/dist/subagents/index.js`, and no `pi-agentic-workflow/src` module imports it | `rg -n 'pi-extensible-workflows' packages/pi-agentic-workflow/src` → 0 matches; `package.json` `pi.extensions` (E5) | current | O8, O9, O10 |
| PE-006 | repository | we never read upstream's `changelog-state.json`, so the breaking removal needs no code change — only the documentation of what a path-loaded extension no longer shows | `rg -c 'changelog-state\|changelogState' packages skills docs` → 0 matches (E5) | current | O9 |
| PE-007 | tool-behaviour | `typebox` was already a runtime import of the loaded bundle in 6.3.0 (`typebox/value` line 4, `typebox/compile` via `agent-execution`), so 6.4.0's `Type`-from-`typebox` switch adds no new resolution requirement; Pi 1.5.2 declares `typebox@1.3.27` as its own dependency | `rg '^import' dist/subagents/index.js` in both tarballs; `/home/agent/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/package.json` (E4) | current | O10 |
| PE-008 | tool-behaviour | `worktreeSetup` is a workflow-settings key (allow-listed, validated, `INVALID_SETTINGS` otherwise) that this repository's config surfaces never write: our files are `agentic-workflow.json` / `pi-agentic-workflow.json`, and the setting belongs to `.pi/workflow.json` upstream | `src/settings.ts` diff 6.3.0 → 6.4.0 (E4); `rg -n 'workflow.json' packages/pi-agentic-workflow/src` → 0 matches | current | O10, PR1 |
| PE-009 | repository | no deterministic emitter writes a single package's companion `CHANGELOG.md` row — only `release.mjs apply` does, for the whole train — and a valid `.changeset` satisfies the version-parity content half (D-40-14 keeps one train version) | `docs/workflow/PACKAGES.md` (Version bumps); `docs/fix/588-typebox-pin-drift/SPEC.md` PE-004/PE-005 (same gate, same package pair) | current | O3, O4 |
| PE-010 | repository | `minimatch` reaches the tree only through `pi-extensible-workflows` (`^10.2.5` → lock `10.2.6`) and Pi 1.4.0 (`10.2.6`); no manifest of ours declares it, and the advisory pass reports it report-only (1 row, 0 blocking) | `rg -n '"minimatch"' package.json packages/*/package.json` → 0 matches; `bun scripts/dependency-advisory-pass.mjs` (E6) | current | O5, O6, PR3 |
| PE-011 | environment | the toolchain is complete in this worktree: bun 1.4.5, node v26.13.0; `node scripts/setup-env.mjs` provisioned the schema `dist/` and the Pi crate's modules; the package suite is 956 pass / 0 fail at the base (6.3.0 installed) | `node scripts/setup-env.mjs --check`; `bun run --cwd packages/pi-agentic-workflow test` (E12) | current | O10, O11 |

### Obligations

One row per normative behaviour, compatibility invariant, affected use case and
required failure state (shape owned by
`skills/pre-execution-review/references/LEDGERS.md`). `phase` names the phase
whose validator runs the row; `task` names the task that implements it.

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S3 | the Pi package's `pi-extensible-workflows` pin names the registry's latest release | P4 | P2 | execute-phase | `rg -c '"pi-extensible-workflows": "6.4.0"' packages/pi-agentic-workflow/package.json` matches 1 | the E line quoting the match | planned |
| O2 | S1, S4 | the frozen failure turns green: the pins half no longer rejects the drift | P4 | P4 | execute-phase | `bun scripts/version-parity-gate.mjs --pins` exits 0 and prints no `GATE REJECTION` | the E line with `VERDICT: PASS`, replacing E1's rejection | planned |
| O3 | S3 | the release intent declares `@gtrabanco/pi-agentic-workflow` in place of a hand version bump and lints clean | P4 | P3 | execute-phase | `bun scripts/lint-changeset.mjs .changeset/615-upgrade-pi-extensible-workflows.md` exits 0 | the E line with the lint's `ok` line | planned |
| O4 | S3 | the version-parity content half accepts the change carried by that intent | P4 | P4 | execute-phase | `bun scripts/version-parity-gate.mjs --content --base origin/main` exits 0 | the E line with the gate's verdict | planned |
| O5 | S9 | the workspace lock resolves exactly the bumped artifact and stays installable frozen | P4 | P2 | execute-phase | `bun install --frozen-lockfile` exits 0 and `rg -c 'pi-extensible-workflows@6\.4\.0' bun.lock` matches 1 | the E line with both results | planned |
| O6 | S9 | no resolution moves but the ones the bump forces | P4 | P2 | execute-phase | `git diff origin/main...HEAD -- bun.lock` names only the importer pin, the `pi-extensible-workflows` entry, `minimatch`, `@isaacs/nonrecursive-glob-match` and Pi's nested `minimatch` | the lock diff listed in the Log's P2 line, against the fixture E8 | planned |
| O7 | S5 | the window is classified entry by entry, the breaking item included, and the loaded-entry delta is classified separately | P4 | P3 | execute-phase | `rg -c '^\| W[0-9]+ \|' docs/fix/615-upgrade-pi-extensible-workflows/SPEC.md` matches 9 and `rg -c '^\| .* \| (affects\|does not\|compatible\|behaviour-preserving)' docs/fix/615-upgrade-pi-extensible-workflows/SPEC.md` matches ≥16 | the two tables and the count | planned |
| O8 | S6 | the extension still loads by path on the pinned Pi floor and on the latest leg, registering the same five tools as 6.3.0 | P4 | P4 | execute-phase | the scratch load probe imports both versions' `dist/subagents/index.js` at `pi-coding-agent@1.1.0` and at latest, exits 0, and prints the same five tool names | the E line with both legs' tool lists | planned |
| O9 | S7 | the breaking item's consequence is stated where the pin is documented | P4 | P3 | execute-phase | `rg -c 'no release notes' packages/pi-agentic-workflow/README.md` matches 1 and `rg -c '6\.4\.0' packages/pi-agentic-workflow/README.md` matches ≥1 | the README paragraph quoted in the Log | planned |
| O10 | S8 | every "worth adopting" item is a recorded proposal with its case, and nothing accepted is implemented here | P4 | P1 | execute-phase | `rg -c '^- \*\*PR[0-9]' docs/fix/615-upgrade-pi-extensible-workflows/SPEC.md` matches 3 and `git diff --stat origin/main...HEAD` names no source path beyond the pin, the lock and docs | the proposals table and the diff stat | planned |
| O11 | S6 | the package's behaviour is unchanged where nobody asked otherwise: no new failure against the base commit | P4 | P4 | execute-phase | `bun run --cwd packages/pi-agentic-workflow test` reports the same 956 pass / 0 fail as the base run E12 | the differential pair of E lines (base vs head) | planned |
| O12 | S2, S5 | the state surfaces stay current: the `## Fixes` row settled through the writer, the projection regenerated by its emitter, the session entry written through the journal writer | P5 | P5 | execute-phase | `bun scripts/docs-generate.mjs --check` exits 0 and `bun scripts/roadmap-settle.mjs` prints `verdict: PASS` and `bun packages/agentic-workflow/bin/agentic-workflow.mjs journal aggregate --check` exits 0 | the E lines with each verdict | planned |

## Triaged steps

Pasted verbatim after the doc was cut (the lane runs inline — see `## Next`):

```
TRIAGE — 615-upgrade-pi-extensible-workflows (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
relay: bootstrap-needed — no packet at .pi-web/relays/615-upgrade-pi-extensible-workflows
relay-next: create .pi-web/relays/615-upgrade-pi-extensible-workflows/ (charter → docs/fix/615-upgrade-pi-extensible-workflows/SPEC.md) then dispatch_relay(packet: ".pi-web/relays/615-upgrade-pi-extensible-workflows", leg: "1") · legs: 6 = 5 phases + 1 coherence review
```

## Findings

No OPEN row: this unit carries no `review-change` or `triage-issue` run (the
apply workflow runs the surgery inline), so nothing here was persisted by either
writer of the `review-findings` truth class.

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-17, the issue, verbatim:
  ```
  ### What's broken

  `packages/pi-agentic-workflow` pins `pi-extensible-workflows` at **6.3.0**; the
  registry published **6.4.0** on 2026-11-16. The PR-time pin half of the parity
  gate refuses the drift, so the `dependency-pin-gate` step is **red on every
  branch and on `main`** until the pin moves — PR #605 already carries it as a
  disclosed pre-existing failure.

  Nothing is broken in the product: the published package installs and runs. The
  red is the gate, and the upgrade itself is what this issue owns.

  ### Detected in

  2026-11-17, `bun scripts/local-gate.mjs` on `feat/470-content-guard-layer`
  (PR #605). Output: `GATE REJECTION — dependency-pin-drift · @gtrabanco/pi-agentic-workflow pins pi-extensible-workflows at 6.3.0 but the registry published 6.4.0`.

  ### Reproduction

  ```
  node scripts/version-parity-gate.mjs --pins
  # GATE REJECTION — dependency-pin-drift
  #   @gtrabanco/pi-agentic-workflow pins pi-extensible-workflows at 6.3.0
  #   but the registry published 6.4.0.
  ```

  The step is network-bound: offline it degrades instead of failing.

  ### Root cause

  The pin was adopted on 2026-11-08 in `ab678011` (*feat(pi-package): adopt
  pi-extensible-workflows 6.3.0 as the subagent substrate*, issue #260). Upstream
  published 6.4.0 on 2026-11-16 — no GitHub release was created for it, so the
  window has to be read from `CHANGELOG.md` at the `v6.4.0` tag.

  ### The upstream window (6.3.0 → 6.4.0), read before bumping

  **The release is a breaking change shipped as a minor on purpose** — upstream
  says so in its own changelog ("an explicit operator choice, not a SemVer-compliant
  version").

  - **Breaking** — the extension no longer shows its own release-notes notice at
    startup. `<agentDir>/pi-extensible-workflows/changelog-state.json` is no longer
    read or written and can be deleted. Pi versions that carry
    `earendil-works/pi#8790` show the package `CHANGELOG.md` under *Extension
    Updates*; **older Pi versions, RPC mode and extensions loaded by path show no
    release notes**.
  - **New capabilities** — `worktreeSetup`: an array of shell commands run in order
    inside every newly created workflow/subagent worktree, with
    `PIEWF_WORKTREE_PATH`, `PIEWF_SOURCE_ROOT` and `PIEWF_WORKTREE_BRANCH`, a
    failing or 10-minute command removing the worktree (`WORKTREE_FAILED`).
    `reviewLoop` accepts `sharedReviewer: true` to keep one reviewer handle across
    iterations.
  - **Fixes** — the CLI bundles Pi 1.5.2 (drops vulnerable `undici` and
    `brace-expansion`), core depends on `minimatch` 11.0.8 fixing
    `GHSA-g3hv-75wg-m249`, prompt inspection works on Pi ≥ 1.2.0, `piewf doctor
    cleanup` tolerates a borrowed worktree already removed, the `subagents_run`
    description documents extension-owned options.

  **Why the breaking item lands on us:** `packages/pi-agentic-workflow/package.json`
  registers the extension **by path** (`pi.extensions` →
  `./node_modules/pi-extensible-workflows/dist/subagents/index.js`), so after the
  bump our users see **no release notes** from that extension. That is a behaviour
  to record (and to compensate for only if the owner asks — a proposal, never scope
  of this bump).

  ### What we consume today (verified)

  - Nothing is `import`ed from the package: it is a Pi extension loaded by path.
  - Our suites exercise the subagent surface it enables —
    `packages/pi-agentic-workflow/test/config-merge-subagents.test.mjs` and
    `settings-console.test.mjs`.
  - `peerDependencies` floor: `@earendil-works/pi-coding-agent >= 1.1.0`.
  - We never reference `changelog-state.json`, so the removal needs no code change.

  ### The review this upgrade owes

  The bump is the last step, not the first. In this order:

  1. **Read the whole window** (6.3.0 → 6.4.0) and classify **every** item in the
     PR: *affects us* / *does not* / *new API worth adopting*. The pin gate names
     the version that moved, never what moved in it.
  2. **Inventory the new APIs** — the `exports` map is identical between the two
     versions (`.`, `./types`, `./utils`, `./budget`, `./runtime`, `./registry`,
     `./trajectory`, `./validation`, `./persistence`), so the delta lives in
     settings and behaviour. For each new API or setting: do we use it today, would
     it replace a manual step, would it open a capability we do not have?
  3. **Migrate** what the breaking change requires here (today: nothing in code;
     the release-notes behaviour is documentation).
  4. **Propose** every "worth adopting" to the owner with a one-paragraph case.
     Accepted ones become **their own issues/units** — never scope of the deps PR.
  5. **Then bump**: pin + package version + `CHANGELOG.md` companion row (or a
     `.changeset/` declaring the package) in the same PR, `bun install` to refresh
     `bun.lock`, and the gate green.

  ### Candidates already visible (the owner decides each; none is in scope here)

  - **`worktreeSetup`** — `AGENTS.md` (*Worktree creation*, step 5) instructs an
    agent to copy `.serena/project.yml` and `.serena/project.local.yml` into every
    new `.worktrees/<flat-name>` by hand, plus any gitignored local context. That
    is exactly what this setting automates (`wt step copy-ignored
    --require-include` or a `cp -n` pair), with a bounded failure that removes the
    worktree. Strong candidate.
  - **`reviewLoop.sharedReviewer`** — our adversarial review loop uses fresh
    reviewers per iteration. A shared reviewer keeps its transcript across
    iterations, which cuts cost and **breaks cross-iteration independence**; the
    likely answer is no, but the reason has to be `review-change`'s independence
    rule, not taste.
  - **`minimatch` 11.0.8** — this repository's own lock resolves `minimatch` 10.2.6,
    flagged **report-only** by `scripts/dependency-advisory-pass.mjs` for the same
    `GHSA-g3hv-75wg-m249`. The bump fixes upstream's copy, not necessarily ours:
    decide whether our own resolution moves in the same PR or in its own.

  ### Surfaces

  - packages/pi-agentic-workflow
  - (the bump also touches `bun.lock`, `CHANGELOG.md` or a `.changeset/`)

  ### Acceptance criteria

  1. `pi-extensible-workflows` pinned at **6.4.0**, with the package version and its
     `CHANGELOG.md` companion row (or a valid `.changeset/` declaring
     `@gtrabanco/pi-agentic-workflow`) in the **same** PR.
  2. `node scripts/version-parity-gate.mjs --pins` exits 0 with the network up, and
     `bun scripts/local-gate.mjs` no longer lists `dependency-pin-gate` as a
     failure.
  3. The PR records the window classification (item → affects us / does not /
     worth adopting) for **every** 6.4.0 entry, the breaking item included.
  4. The extension still loads by path on the pinned Pi floor and
     `bun run --cwd packages/pi-agentic-workflow test` is green, the subagent
     config-merge and settings-console suites included.
  5. The breaking item's consequence for our users (no release notes from a
     path-loaded extension) is stated in the PR and, if the owner wants it
     compensated, that work is a separate issue.
  6. Every "worth adopting" item is recorded as a proposal with the owner's
     accept/reject; nothing accepted is implemented inside this PR.
  7. `bun.lock` carries only the intended resolution change, reviewed.

  ### Rollback strategy

  Revert the pin and the package version in one commit: the extension is loaded by
  path, so the older copy is what runs again. No data migration is involved — the
  `changelog-state.json` file that 6.4.0 stops using is upstream's, never ours.

  ### Severity

  medium — the published package still installs and works; the red is the gate on
  every PR (and a security-adjacent advisory in the dependency's own core), not a
  product outage.

  ### Depends on

  Nothing. Resolve by closing this issue from the bump PR (a `Closes` footer keeps
  the trace).
  ```
- **L2** — 2026-11-17, owner apply-request, verbatim: "Apply to this repository: issue #615", followed by the local unpublished workflow this unit runs under (§0–§9). State resolved the intent to **proceed**: branch `chore-615-upgrade-pi-extensible-workflows` at `8c1a05a8` (clean, no commits ahead of `main`), no unit folder, nothing in flight.
- **E1** — 2026-11-17, `bun scripts/version-parity-gate.mjs --pins` at `8c1a05a8` · exit 1 · `[@gtrabanco/pi-agentic-workflow] exact pins checked: 4`, `GATE REJECTION — dependency-pin-drift`, `pins pi-extensible-workflows at 6.3.0 but the registry published 6.4.0`, `VERDICT: FAIL` — the §2 frozen failure reproduced.
- **E2** — 2026-11-17, `npm view pi-extensible-workflows versions dist-tags time` · `6.4.0` is `latest`, published `2026-11-16T19:05:49.561Z`; the version before it is `6.3.0` at `2026-10-25T12:55:53.316Z` — a one-release window.
- **E3** — 2026-11-17, the window read from `https://raw.githubusercontent.com/vekexasia/pi-extensible-workflows/v6.4.0/CHANGELOG.md` (848 lines) · `## [6.4.0] - 2026-11-16` carries **9** `- ` bullets: 1 breaking, 2 new capabilities, 6 fixes; the section opens with "**This minor version contains a breaking change.** Shipping it as 6.4.0 is an explicit operator choice, not a SemVer-compliant version."
- **E4** — 2026-11-17, the tarball differential in a `mktemp -d` (`npm pack` 6.3.0 + 6.4.0): **55** differing paths, all under `dist/`, `src/`, `starter/`, `subagents/`, plus `CHANGELOG.md` and `package.json`. `exports` byte-identical (9 entries); no top-level manifest key added or removed; `dependencies.minimatch` `^10.2.5` → `^11.0.8`; bundled Pi `1.0.0` → `1.5.2`; `dist/src/changelog.{js,d.ts}` removed; `dist/subagents/index.js` (the entry we load) 10944 → 10974 lines, every hunk classified in `## Impact`. `rg '^import' dist/subagents/index.js` shows `typebox/value` in **both** versions. Scratch removed.
- **E5** — 2026-11-17, the consumption sweep at `8c1a05a8`: `rg -n 'pi-extensible-workflows' packages/pi-agentic-workflow/src` → 0 matches (nothing imported); `package.json` `pi.extensions` → `./dist/extension/index.js` + `./node_modules/pi-extensible-workflows/dist/subagents/index.js` only; `rg -c 'changelog-state\|changelogState' packages skills docs` → 0 matches; `rg -c 'piewf' skills packages/pi-agentic-workflow/src packages/pi-agentic-workflow/README.md` → 0 matches.
- **E6** — 2026-11-17, `bun scripts/dependency-advisory-pass.mjs` at `8c1a05a8` · exit 0 · `186 packages resolved, 1 advisory, 0 blocking, 1 report-only` — `minimatch 10.2.6 → fixed 11.0.1`, `GHSA-g3hv-75wg-m249`.
- **E7** — 2026-11-17, `bun scripts/test-impact.mjs --paths packages/pi-agentic-workflow/package.json bun.lock packages/pi-agentic-workflow/README.md` · `verdict: targeted`, `tier: rg`, 14 suites, `sources: path` (the `## Applicable tests` set).
- **E8** — 2026-11-17, the §3 lock fixture: a `mktemp -d` mirror of the root manifest, the four package manifests and `bun.lock`, with the Pi package's pin set to `6.4.0`; `bun install --lockfile-only --ignore-scripts` · exit 0 · `Saved bun.lock (190 packages)` — the diff is exactly: the importer's pin line, `pi-extensible-workflows@6.3.0 → 6.4.0` (with its integrity), top-level `minimatch@10.2.6 → 11.0.9` (which adds `@isaacs/nonrecursive-glob-match@1.1.0`), and a new nested `@earendil-works/pi-coding-agent/minimatch@10.2.6` (Pi keeps its own). Scratch removed.
- **E9** — 2026-11-17, the risk tier over the planned paths: `bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify --paths …` · exit 0 · `tier: standard`, `reason_kind: executable-content` (2 paths), `signals: []`, `ceremony: unit-doc`, `verification: gates` — copied verbatim into `## Risk tier`.
- **P1** — 2026-11-17, this unit doc, both planning ledgers (every obligation row `planned` at the cut), the window classification and the proposal rows · see the `## Next` line's commit.
- **E10** — 2026-11-17, the answered-at-cut API inventory (`S2`): the 9 `exports` entries are unchanged, and the settings surface gains exactly one key (`worktreeSetup`) while `reviewLoop` gains one boolean option (`sharedReviewer`); both are recorded as proposals, neither is adopted (`## Future` PR1/PR2). No other exported API was added or removed (`exports` byte-identical, E4).
- **E11** — 2026-11-17, `node scripts/setup-env.mjs --check` before provisioning · `MISS schema-dist`, `MISS pi-crate-modules`; `node scripts/setup-env.mjs` · `SETUP — everything is already provisioned`, `tsc` clean, `bun install` frozen, Pi package modules installed with `pi-extensible-workflows` **6.3.0**.
- **E12** — 2026-11-17, `bun run --cwd packages/pi-agentic-workflow test` at `8c1a05a8` (resolved `pi-extensible-workflows` 6.3.0) · **956 pass / 0 fail**, 84 files (26s) — the differential baseline.
- **P2** — pending.

## Next

P2 — move the pin, refresh the lock, then the release intent and the README
sentence (P3), the verification block (P4) and the state surfaces (P5). The owner
is the external verifier; the review step is that verdict, not a self-run.

## References

Issue [#615](https://github.com/gtrabanco/agentic-workflow/issues/615) · the
substrate's adoption, issue [#260](https://github.com/gtrabanco/agentic-workflow/issues/260)
(`docs/fix/260-subagent-first-execution/`) · the same gate's previous pin unit,
issue [#588](https://github.com/gtrabanco/agentic-workflow/issues/588)
(`docs/fix/588-typebox-pin-drift/`, PR [#592](https://github.com/gtrabanco/agentic-workflow/pull/592)) ·
upstream `CHANGELOG.md` at the `v6.4.0` tag and the two npm tarballs ·
`docs/workflow/PACKAGES.md` (pins and version bumps).

## Branch

`chore-615-upgrade-pi-extensible-workflows` — the worktree the owner created at
`.worktrees/chore-615-upgrade-pi-extensible-workflows`.

## Depends on

none — independent.

## Regression scope

| Scenario | Verified by |
|---|---|
| The five subagent tools still register, on the Pi floor and on the latest leg, with the 6.4.0 entry loaded by path | the scratch load probe (O8): `pi-coding-agent@1.1.0` and latest, tool-name list compared against 6.3.0 |
| The selector/settings validation the extension performs keeps its verdicts on the bumped `minimatch` 11 | the load probe's settings/selector cases: a valid selector still validates, an invalid pattern still refuses (behaviour-preserving hunk in `## Impact`) |
| The package's own suite is unchanged by the bump — no new failure, no newly-skipped case | `bun run --cwd packages/pi-agentic-workflow test` at head vs the base run E12 (956/956) |
| A fresh checkout stays installable from the committed lock | `bun install --frozen-lockfile` at the repo root exits 0 (O5) |
| The sibling packages' resolutions in the same lock are untouched | `git diff origin/main...HEAD -- bun.lock` limited to E8's predicted entries (O6) |
| The wired pin gate and the advisory pass still answer | `bun scripts/version-parity-gate.mjs --pins` exits 0 (O2); `bun scripts/dependency-advisory-pass.mjs` still answers its one report-only row (E6, PR3) |
| The release train still reads the package's intent | `bun scripts/release.mjs plan` lists the new changeset without breaking the plan (O3, O4) |
