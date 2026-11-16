---
type: feature
scope: medium
roadmap_summary: Issue [#555](https://github.com/gtrabanco/agentic-workflow/issues/555) (M): one programmatic runner resolver over a closed set (`bunx` → `npx --yes` → `pnpm dlx`), fail-closed naming every candidate it tried; consumed by pi's spawn path and the action; the invocation prose lives once in `RUNNER.md` and every other skill cites the symbolic `runner <subcommand>`, with a parity test pinning the two
---

# 555 — programmatic-runner

> One-line: runner selection becomes programmatic wherever code consumes it, while
> the invocation prose keeps its one home in the shipped skills; the pi package
> stops carrying it entirely.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

Requirements numbered `S#`, quoting the requester's own words verbatim. `S1` is
the owner requirement the issue carries verbatim; `S2`–`S6` are its in-scope
bullets in the order it states them; `S7`–`S10` are its acceptance block;
`S11`–`S13` are the three out-of-scope statements that bound the delivery.
Every later decision cites its `S#`.

**S1 — The prose stays in the skills; the detection goes programmatic; pi drops the prose.**
> esa prosa debe estar en las skills si se instalan vía 'npx skills add -g gtrabanco/agentic-workflow' (o bunx o lo que sea) pero esa detección debe ser programática y eliminar la prosa en pi-agentic-workflow.

**S2 — One resolver over the owner's closed set, fail-closed naming what it tried.**
> A programmatic runner resolver covering the closed set the owner names — at minimum `bunx`, `npx`, `pnpm dlx` (and whatever triage adds), fail-closed with a message naming the missing runner

**S3 — One implementation, consumed by pi's spawn path and by any step that must choose.**
> One implementation, consumed by: pi (spawn path), and any skill step that must choose a runner programmatically

**S4 — pi-agentic-workflow drops the runner-invocation prose, docs and bundle.**
> pi-agentic-workflow drops runner-invocation prose: no `npx`/`bunx` examples in its own docs, and its bundle no longer ships the runner prose (mechanism: bundle filter vs pi-specific variant of the runner contract — open question below)

**S5 — The skills keep the invocation prose, updated to the same closed set, pinned to the resolver.**
> The skills keep (and only they keep) the invocation prose, updated to the same closed runner set the resolver implements — no drift between the two (a parity test or normative row pins them together)

**S6 — The cache/exact-pin contract documented once.**
> Document the cache/exact-pin contract once: first run downloads, subsequent runs are cache hits, and the exact pin is what guarantees per-version contract compliance

**S7 — AC: one resolver, unit-tested, no prose involved, fail-closed naming what it tried.**
> One resolver, unit-tested against the pinned runtimes, answers the runner choice with no prose involved; an environment with none of the set fails closed naming what it tried

**S8 — AC: pi's docs and bundle carry no runner invocation prose.**
> pi's docs and bundle carry no `bunx`/`npx` invocation prose after this change (grep-clean in `packages/pi-agentic-workflow`)

**S9 — AC: the skills' runner prose and the resolver's closed set are pinned together.**
> The shipped skills' runner prose and the resolver's closed set are pinned together by a test (no drift)

**S10 — AC: the gate and both package suites are green.**
> `bun scripts/run-root-suite.mjs` exit 0; the crate suite and pi suite at or above baseline

**S11 — Out of scope: the pin mechanics do not change.**
> Changing the pin mechanics (release-stamped, normative-drift-checked) — unchanged

**S12 — Out of scope: pi's installed-package resolution stays.**
> pi's `createRequire` local resolution — already programmatic and correct for installed contexts

**S13 — Out of scope: the prose is not moved into code.**
> Moving the skills' prose into code — prose is where models read it (owner decision above)

## Impact

What consumes this unit's deliverables, and what stops being true when it lands:

- **`skills/runner-contract/references/RUNNER.md` is the invocation's one home.**
  Today it is one of 33 bundled files that name the runner; after this unit it is
  the only one, and every other skill's citation changes shape from
  `bunx @gtrabanco/agentic-workflow@<pin> <sub>` to `runner <subcommand> [args…]`.
  Every skill that runs a deterministic command (13 header notes, 145 citation
  lines repo-wide) is re-pointed in the same change; a stale
  `bunx …` citation left anywhere under `skills/` fails the parity gate.
- **The pi package stops shipping the invocation section.** `bundle:skills`
  stages the canonical tree; the declared projection pointerizes
  `RUNNER.md`'s `## The invocation` section, so the packaged skills teach pi's
  programmatic route instead of a package download. The pi README's `npx`
  example, `mutation-check.mjs`'s `npx` call and the bundle itself are
  grep-clean of the runner invocation.
- **pi's spawn path changes shape.** `runner-bin.ts` gains `runnerLaunch(args)`
  (the resolver's consumer in pi); the four crate-spawning workflow tools, the
  conductor sensor and `/aw-index` spawn through it, and a sixth deferred tool
  (`agentic_workflow_run`) gives a pi session a door for every subcommand the
  bundle's symbolic citations name. A pi session without the tool would keep a
  citation it could not execute — that is the regression this closes.
- **The GitHub action's private resolver is deleted.** `journal/headless.mjs`
  imports the crate's module from its own checkout; the action's S13 suite
  (bunx eligibility, the bun engine floor falling through to `npx`, the
  no-runner refusal, the override) is the differential corpus that must stay
  byte-compatible with its observed behaviour.
- **What stops being true:** "`bunx` first, `npx` when bun is not installed" (two
  runners resolved in prose) is retired; RUNNER.md's closed set is three
  candidates in a fixed order. The pi package's promise "the same `SKILL.md`
  sources as this repository — no Pi-specific fork" stays true: the difference
  is the declared projection row, never a second tree.
- **The crate's command surface grows by one** (`runner resolve`), which drags
  the bin's usage line, the crate README's usage line and Commands row, the
  projection's `CRATE_COMMANDS` mirror, `cli.surface.test.mjs` and the doctor's
  documented-surface rule together — one commit, because half of it is a red
  suite.
- **Normative registration:** the closed set is a normative surface. It gets one
  `normative-surfaces@1` row (`block:runner-set@1`), so `AGENTS.md`'s machine
  region grows by exactly one line and its exact `machineLines` pin moves
  `145 → 146` (the line and prose ceilings hold: 709/571 unchanged).

## Retirements

Strictly additive? No — four surfaces are retired, each with its replacement:

| Retired | Replacement | No-consumer evidence |
|---|---|---|
| `journal/headless.mjs`'s private `resolveRunner` + `hasCommand` + `bunFloor` (the action's only resolver) | `packages/agentic-workflow/src/runner/resolve.mjs`, imported relative from the action's checkout | `rg -c 'function resolveRunner' journal/headless.mjs` → 0 after the change; the S13 suite proves identical argv/refusal behaviour |
| `bunx @gtrabanco/agentic-workflow@<pin> <sub>` citations outside `RUNNER.md` (145 lines, 48 files) | `runner <subcommand> [args…]`, defined once in RUNNER.md | `rg -l '(bunx\|npx( --yes)?\|pnpm dlx) @gtrabanco/agentic-workflow' skills` → `RUNNER.md` only |
| `(npx fallback if bun is not installed)` and its variants (the prose-side runner choice) | RUNNER.md's closed set + the pointer every skill already carries | `rg -c 'npx fallback if bun is not installed' skills` → 0 |
| pi's README `npx` example and `mutation-check.mjs`'s `npx tsc` | the crate's `log render` command pointer; `bun x tsc` (same tool, the runtime pi ships) | `rg -n '(bunx\|npx)' packages/pi-agentic-workflow/README.md packages/pi-agentic-workflow/scripts` → 0 |

`bunx`, `npx` and `pnpm dlx` themselves are **not** retired: they are the closed
set, and they live in RUNNER.md (standalone) and in code (resolver).

## Non-goals

- Not a pin change: the release stamp, the `rendered-facts@1` row and
  `normative-drift` keep their exact mechanics (S11).
- Not a pi fork: no second skills tree, no overlay directory, no hand-edited
  bundle (S4's mechanism is the declared projection, not a variant tree).
- Not a prose move into code: RUNNER.md keeps the invocation words; the resolver
  only decides (S13).
- No new user-tunable config key: the runner is not configurable; the override
  the contract already documents (`AGENTIC_WORKFLOW_RUNNER`) is unchanged.
- No change to `createRequire` resolution from pi's dependency (S12).
- No `yarn dlx`/`deno run`/`pnpmx` candidate: the set is the owner's three, and
  a fourth candidate is a contract decision of its own (see `D1`).

## Risk tier

- **Tier** — `standard` · **Task Size** — understood · contained · resumable (`verification: gates`)
- **Named high-risk item** — none — not a high-tier unit (`signals[]` empty at cut:
  the change names no path, so the classifier answered `empty-change`, fail
  closed upward).

## Future

- **2026-11-14** — `pnpmx`/`yarn dlx` were named in the issue as candidates
  ("pnpm (`pnpm dlx`) and any other runner are not in the contract"). Status:
  `open` — a fourth candidate is a closed-set amendment, not a silent addition.
- **2026-11-14** — the issue asks whether the resolver should print the full
  pinned invocation or answer availability only. Status: `discarded` in this
  unit — `runner resolve` prints the whole argv (`D5`); a second answer-only
  surface has no consumer.

## Future cost

- Every future skill that runs the runner cites `runner <subcommand>` and
  points at RUNNER.md; adding a binary name anywhere else fails
  `runner.resolve.test.mjs`'s citation scan. Binds skill authors.
- A fourth runner candidate is one row in RUNNER.md's `runner-set@1` block plus
  one entry in `RUNNER_CANDIDATES` — both in the same commit, or the parity suite
  is red. Binds the crate and the skills train together.
- A new skill reference shipped in the pi bundle must carry no runner token;
  the pi grep test reads the staged bundle, so a citation lands in canonical
  `skills/` and is projected, never forked. Binds the pi package.

## Applicable tests

- `packages/agentic-workflow/test/runner.resolve.test.mjs` — the resolver, the
  closed set, the floors, the override, the fail-closed refusal and the
  RUNNER.md ↔ `RUNNER_CANDIDATES` parity (S2, S5, S7, S9).
- `packages/agentic-workflow/test/journal.headless.test.mjs` — the action's S13
  differential corpus after its private resolver is deleted (S3).
- `packages/pi-agentic-workflow/test/runner-launch.test.mjs` — pi's resolver
  consumption: installed route, spaced override, closed-set fallback,
  fail-closed refusal (S3, S12).
- `packages/pi-agentic-workflow/test/runner-prose.test.mjs` — pi's committed
  prose and the staged bundle carry no runner invocation (S4, S8).
- `packages/pi-agentic-workflow/test/skill-parity.test.mjs` and
  `projection.test.mjs` — the new projection rule is a declared projection of
  its source (S4).
- `packages/pi-agentic-workflow/test/workflow-tools.test.mjs` — the six tools,
  the generic runner door included (S3).
- `scripts/release.test.mjs` — the pin stamp is untouched (S11).
- `bun scripts/local-gate.mjs --jobs 1` — the whole gate (S10).

## Known pre-existing issues

- **A fresh worktree has no `node_modules`.** `bun install --frozen-lockfile`
  (164 packages, 3.26 s, sampled 2026-11-16) is a precondition of the pi suite
  and of `bundle:skills`; it does not affect this unit (no dependency change).
- **A bun below `engines.bun` is launched today by the action's fall-through
  path** — the sampled S13 case ("an old bun falls through to npx") is a
  regression fixture, not a defect; the resolver keeps it. Does not affect the
  closed set.
- **`docs/workflow/SKILL_CONTEXT_BUDGETS.json` `documents` section has no
  emitter** (the `budgets` CLI rebases `routes` only). This unit's
  `machineLines` re-pin is therefore a hand edit with its `sources` entry, as
  the manifest's own convention records. Does not affect the gate.

## Tasks

- [x] P1 — Freeze the unit doc, the two planning ledgers and the triaged steps block
  (validator: `node packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/features/555-programmatic-runner/SPEC.md` exits 0)
  (Implements: S1)
  - Relevant files: docs/features/555-programmatic-runner/SPEC.md, docs/features/555-programmatic-runner/planning-evidence.md, docs/features/555-programmatic-runner/planning-obligations.md
- [x] P2 — RED: land `runner.resolve.test.mjs` alone (resolver cases + the RUNNER.md
  parity scan), observed failing on the absent module and on the absent
  `runner-set@1` block (validator: `bun test packages/agentic-workflow/test/runner.resolve.test.mjs` exits 1 — the module is absent)
  (Implements: S2, S7, S9)
  - Relevant files: packages/agentic-workflow/test/runner.resolve.test.mjs
- [x] P3 — GREEN: the resolver module, the `runner resolve` command (bin usage,
  dispatch, crate README usage line + Commands row, projection `CRATE_COMMANDS`),
  and the lit parity block in RUNNER.md (validator: `bun test packages/agentic-workflow/test/runner.resolve.test.mjs` exits 0)
  (Implements: S2, S5, S7)
  - Relevant files: packages/agentic-workflow/src/runner/resolve.mjs, packages/agentic-workflow/src/runner/cli.mjs, packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/README.md, packages/pi-agentic-workflow/scripts/projection.mjs, skills/runner-contract/references/RUNNER.md
- [x] P4 — RUNNER.md owns the prose: closed set, symbolic `runner` form, the
  cache/exact-pin contract, the pi-session section, the override; every other
  runner citation in `skills/`, the repo docs and the four SPEC templates
  becomes symbolic (validator: `rg -l '(bunx|npx( --yes)?|pnpm dlx) @gtrabanco/agentic-workflow' skills --glob '!runner-contract/references/RUNNER.md'` matches 0 files)
  (Implements: S5, S6, S9, S13)
  - Relevant files: skills/runner-contract/SKILL.md, skills/runner-contract/references/RUNNER.md, skills/*/SKILL.md, skills/*/references/*.md, docs/workflow/*.md, README.md, docs/features/_TEMPLATE/SPEC.md, docs/fix/_TEMPLATE/SPEC.md, template/docs/features/_TEMPLATE/SPEC.md, template/docs/fix/_TEMPLATE/SPEC.md
- [x] P5 — pi consumes the resolver and drops the prose: `runnerLaunch`, the generic
  `agentic_workflow_run` tool, the projection rule, the README rewrite, the pi
  suites (validator: `cd packages/pi-agentic-workflow && bun run test` exits 0)
  (Implements: S3, S4, S8, S12)
  - Relevant files: packages/pi-agentic-workflow/src/runner-bin.ts, packages/pi-agentic-workflow/src/extension/workflow-tools.ts, packages/pi-agentic-workflow/src/conductor/sensor.ts, packages/pi-agentic-workflow/src/extension/aw-index-command.ts, packages/pi-agentic-workflow/projection-manifest.json, packages/pi-agentic-workflow/README.md, packages/pi-agentic-workflow/scripts/mutation-check.mjs, packages/pi-agentic-workflow/test/*
- [x] P6 — The action's private resolver is deleted; `journal/headless.mjs` imports
  the crate module, keeping the S13 argv and refusals (validator: `bun test packages/agentic-workflow/test/journal.headless.test.mjs` exits 0)
  (Implements: S3)
  - Relevant files: journal/headless.mjs
- [x] P7 — State ships: the changeset intent, the roadmap status/summary, the
  `normative-surfaces@1` row and the `machineLines` re-pin, `docs/LOGS.md`, the
  generated projection (validator: `bun scripts/docs-generate.mjs --check` exits 0 and `bun scripts/check-skill-context.mjs --documents` exits 0)
  (Implements: S10)
  - Relevant files: .changeset/*.md, docs/ROADMAP.md, AGENTS.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json, docs/LOGS.md, docs/generated/**
- [x] P8 — Verify: every obligation's validator run in the foreground; the root gate,
  the crate suite and the pi suite green; the obligations ledger closed
  (validator: `bun scripts/local-gate.mjs --jobs 1` exits 0)
  (Implements: S10, S11)
  - Relevant files: docs/features/555-programmatic-runner/SPEC.md, docs/features/555-programmatic-runner/planning-obligations.md

### Planning evidence

The ledger lives beside this doc as `planning-evidence.md` (M size — never both
embedded and separate).

### Obligations

The ledger lives beside this doc as `planning-obligations.md` (M size — never
both embedded and separate).

## Triaged steps

> Pasted verbatim from `agentic-workflow unit-route --triage 555`.

```text
TRIAGE — 555 (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
Fused: design + plan — one investigate→orient→ask→decide pass, carriers separated (activity-fusion@1)
relay: bootstrap-needed — no packet at .pi-web/relays/555-programmatic-runner
relay-next: create .pi-web/relays/555-programmatic-runner/ (charter → docs/features/555-programmatic-runner/SPEC.md) then dispatch_relay(packet: ".pi-web/relays/555-programmatic-runner", leg: "1") · legs: 9 = 8 phases + 1 coherence review
```

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-16, the request, verbatim:
  ```
  Apply to this repository: issue #555
  ```
  The issue's own frozen text is `## Specs` above (`S1`–`S13`).

- **D1** — 2026-11-16, S2/S7 (owner-named set; PE-005, PE-010). The closed set
  is `bunx` → `npx --yes` → `pnpm dlx`, in that order. `npx` carries `--yes`
  because a skill is non-interactive (the install prompt would hang it); `pnpm
  dlx` is last because a standalone pnpm ships its own runtime, so it is the one
  candidate that can exist on a box with no `node`. The floors are the crate's
  `engines`, read from its manifest — never a number restated here.
- **D2** — 2026-11-16, S3 (the issue's own third chicken-and-egg candidate:
  "prose fallback (bunx→npx) with the resolver only for code"). One
  implementation, `packages/agentic-workflow/src/runner/resolve.mjs`; consumers:
  the crate's `runner resolve`, pi (module import through its own dependency),
  and `journal/headless.mjs` (relative import from the action's checkout). The
  skills keep the prose; no skill is asked to resolve in code.
- **D3** — 2026-11-16, S5/S9. The invocation prose has one home: `RUNNER.md`
  declares the set in `runner-set@1`, every other skill cites the symbolic
  `runner <subcommand> [args…]`, and the crate suite parses the block against
  `RUNNER_CANDIDATES` — ids, order and rendered invocation, never a paraphrase.
- **D4** — 2026-11-16, S4 ("bundle filter vs pi-specific variant"). Chosen: the
  declared projection the package already owns — one hash-bound `pointerize`
  rule over `RUNNER.md`'s `## The invocation`, enforced by `runner resolve`. No
  second skills tree and no per-citation rule set; the pi route lives in the
  contract's `## In a pi session` section, which both trees share.
- **D5** — 2026-11-16, S3, assumption A2. A pi session needs a door for the
  subcommands no typed tool wraps, so the package gains one generic deferred
  tool (`agentic_workflow_run`) beside the five typed ones; without it the
  bundle's symbolic citations would be executable only by guesswork.
- **D6** — 2026-11-16, S3. `journal/headless.mjs` deletes its private chooser
  (`crateManifest`, `bunFloor`, `hasCommand`, `resolveRunner`) and imports the
  crate module; its four S13 behaviours are the differential corpus, unchanged.
- **D7** — 2026-11-16, PE-003, S6. The override is tokenised in every consumer,
  so `AGENTIC_WORKFLOW_RUNNER="bun /abs/bin.mjs"` now works in pi (the previous
  `runner-bin` silently ignored any value containing a space and used the
  installed bin).
- **D8** — 2026-11-16, PE-011, PE-014. The closed set is a normative surface:
  one `runner-set` row in `normative-surfaces@1`, one `machineLines` re-pin
  (145 → 146, the line ceiling spent exactly at 709) with its growth source, and
  the `normative-surface-grammar` surfaces cell in `GATE_INVENTORY.md`.
- **D9** — 2026-11-16, two honest test-side corrections, both disclosed. (a) The
  `runner-prose` case first asserted the symbolic citation in backticks with an
  ellipsis; the contract carries it as a fenced `runner <subcommand> [args...]`,
  so the assertion was corrected to the real spelling — the intent (the
  definition stays in the bundle) is unchanged and nothing was relaxed. (b) The
  crash-resume fixture's sensor stub is now executable and carries its shebang:
  the override names a *command* (RUNNER.md's form), so a bare non-executable
  path is no longer a legal value.
- **D10** — 2026-11-16, the external-verify correction batch (§9, over the verdict
  `NEEDS-DECISION (O21)`). O21's validator cell is widened (`--reverse` plus the
  implementation path) so its stated outcome is what the command prints. A1 pins
  the doctor's `rg` bootstrap by rendering `RUNNER_CANDIDATES[0]` at the crate's
  own manifest version through `renderInvocation` — bun-first kept (the doctor's
  bun row owns a missing bun), the evaluator stays pure over evidence, and the
  launcher/pin symbol has one home beside the resolver. A2/A3 re-point the last
  old-shape citation comments in crate code. A4 is dispositioned, not fixed:
  `docs/ROADMAP.md:169` quotes issue #553 verbatim and its linked unit doc is
  absent at base and at head — a reword belongs to #553's triage, not this unit.
- **E1** — 2026-11-16, `bun test packages/agentic-workflow/test/runner.resolve.test.mjs` · exit 1 at `eb961b9f` · `0 pass · 1 fail · 1 error`
  (`Cannot find module '../src/runner/resolve.mjs'`).
- **E2** — 2026-11-16, `bun test packages/agentic-workflow/test/runner.resolve.test.mjs` · exit 0 at `4aae8a50` · `17 pass · 0 fail`.
- **E3** — 2026-11-16, `bun test packages/agentic-workflow/test/cli.surface.test.mjs packages/agentic-workflow/test/runner.distribution.test.mjs` · exit 0 · `6 pass · 0 fail`.
- **E4** — 2026-11-16, `cd packages/pi-agentic-workflow && bun test test/runner-launch.test.mjs test/runner-prose.test.mjs` · exit 1 at `e282728e` · `0 pass · 5 fail · 1 error` (no resolver consumer, no generic door, no projection rule).
- **E5** — 2026-11-16, same pi command · exit 0 at `a1979dab` · `8 pass · 0 fail`.
- **E6** — 2026-11-16, `cd packages/pi-agentic-workflow && bun run test` · exit 0 · `928 pass · 0 fail` (83 files, bundle + `tsc` + suites).
- **E7** — 2026-11-16, `bun test packages/agentic-workflow/test/journal.headless.test.mjs` · exit 0 · `27 pass · 0 fail` (the action's S13 differential corpus, unchanged).
- **E8** — 2026-11-16, `cd packages/agentic-workflow && bun run test` · exit 0 · `858 pass · 0 fail` (48 files).
- **E9** — 2026-11-16, `bun scripts/local-gate.mjs --jobs 1` · exit 0 · `local-gate: PASS — 19 step(s) in 431s`.
- **E10** — 2026-11-16, `bun scripts/check-skill-context.mjs --documents` · exit 0 · `AGENTS.md 709 lines / 146 machine / 563 prose / 12,505 est — PASS`.
- **E11** — 2026-11-16, `bun scripts/check-skill-context.mjs --routes` · exit 0 · `PASS route budgets: 14 routes`.
- **E12** — 2026-11-16, `bun scripts/check-skill-context.mjs` · exit 0 · `PASS context budgets: 30 skills`.
- **E13** — 2026-11-16, `node --test scripts/normative-drift.test.mjs` · exit 0 · `21 pass · 0 fail`.
- **E14** — 2026-11-16, `bun scripts/docs-generate.mjs --check` · exit 0 · `3 checked · 0 missing · 0 stale · 0 orphaned`, `verdict: PASS`.
- **E15** — 2026-11-16, `bun test scripts/release.test.mjs` · exit 0 · `73 pass · 0 fail`; `git diff origin/main -- scripts/release.mjs scripts/normative-drift.test.mjs` is empty.
- **E16** — 2026-11-16, `bun scripts/skill-lint.mjs` · exit 0 · `0 finding(s)`, `verdict: PASS`.
- **E17** — 2026-11-16, `bun test scripts/prose-gate-inventory.test.mjs` · exit 0 · `22 pass · 0 fail`.
- **E18** — 2026-11-16, `bun test scripts/promise-coherence.test.mjs scripts/unit-cycle.test.mjs` · exit 0 · `82 pass · 0 fail` (the scanners read the symbolic citation; the loop's prompt command is resolved).
- **E19** — 2026-11-16, the citation scans · `rg -l '(bunx|npx( --yes)?|pnpm dlx) @gtrabanco/agentic-workflow' skills` → `skills/runner-contract/references/RUNNER.md` only; `rg -c … packages/pi-agentic-workflow/skills` → 0 files; `rg -n '(bunx|npx)' packages/pi-agentic-workflow/README.md packages/pi-agentic-workflow/scripts` → 0 lines; 13 header notes cite the symbolic form; `npx fallback if bun is not installed` → 0.
- **E20** — 2026-11-16, differential of pi's spawn argv (base formula resolved from the pi package's own dependency vs the head resolver) · `{"base":["node","…/packages/agentic-workflow/bin/agentic-workflow.mjs","workflow-status","--json-only"],"head":<same>,"source":"installed","equal":true}` — no unrequested difference.
- **E21** — 2026-11-16, `node packages/agentic-workflow/bin/agentic-workflow.mjs runner resolve --json phase-lint docs/x.md` · exit 0 · `{"source":"bunx","argv":["bunx","@gtrabanco/agentic-workflow@4.10.0","phase-lint","docs/x.md"],…}`.
- **E22** — 2026-11-16, `node scripts/lint-changeset.mjs .changeset/programmatic-runner-detection.md` · exit 0 · `ok programmatic-runner-detection.md`.
- **E23** — 2026-11-16, correction-batch RED before implementation · `bun test packages/agentic-workflow/test/doctor.checks.test.mjs` · exit 1 at the pre-fix working tree · `AssertionError: the bootstrap instruction is pinned to the crate's own version (never an unpinned latest)` — 1 fail, the rest green.
- **E24** — 2026-11-16, correction-batch GREEN after · same suite · exit 0 · `21 pass · 0 fail`; `bun test packages/agentic-workflow/test/doctor.cli.test.mjs packages/agentic-workflow/test/doctor.inventory.test.mjs packages/agentic-workflow/test/doctor.wizard.test.mjs packages/agentic-workflow/test/config-cli.test.mjs` · exit 0 · `28 pass · 0 fail`; corrected O21 validator · exit 0 · exactly `eb961b9f` (red) then `4aae8a50` (green); the re-pointed-comment scans (`rg` over `phase-lint.mjs` and `config-cli.test.mjs`) → 0 matches each.
- **E25** — 2026-11-16, differential vs the batch base `099244c2`, base copy in `mktemp -d` scratch (never committed, removed at close) · healthy env `doctor`: content byte-identical (only the measured-duration feedback line differs); `rg`-absent env (a PATH with no `rg` on it, exit 0 both sides): the only content delta is the instruction gaining `@4.10.0`, `3 advisories` on both sides; `phase-lint` on this unit doc: byte-identical — no unrequested stdout/stderr/exit difference.
- **E26** — 2026-11-16, `bun scripts/local-gate.mjs --jobs 1` · exit 0 at `9bba62cd` · `local-gate: PASS — 19 step(s) in 745s`. The first attempt red'd at `root-suite` while the box ran ~10×6 load from concurrent sessions (two different victims across runs; `bun test scripts/unit-route.test.mjs` → `64 pass · 0 fail` and `bun test scripts/phase-lint.test.mjs` → `162 pass · 0 fail` standalone) — environment, not change-caused; no code change was made for it.
- **P1** — 2026-11-16, unit doc, the two planning ledgers and the triage block frozen · `0c49b74a`.
- **P2** — 2026-11-16, the resolver suite landed alone, observed red (E1) · `eb961b9f`.
- **P3** — 2026-11-16, the resolver module, `runner resolve`, the crate README/usage/dispatch, `CRATE_COMMANDS` and RUNNER.md's parity block · `4aae8a50`.
- **P4** — 2026-11-16, the symbolic sweep: RUNNER.md owns the prose, 42 files re-pointed, the retired fallback rule deleted · `4e44eb49`.
- **P5** — 2026-11-16, pi's red suites landed alone (E4) · `e282728e`; the resolver consumer, the projection rule, the generic door and the README/suite work went green (E5, E6) · `a1979dab`.
- **P6** — 2026-11-16, the action's private chooser deleted, its S13 corpus green (E7) · `7961192e`.
- **P7** — 2026-11-16, state: changeset, roadmap row, the `runner-set` inventory row + `machineLines`, the gate inventory's surfaces cell, the generated projection (E14) · `fa81c10a`.
- **P8** — 2026-11-16, verification: every obligation's validator run in the foreground (E2–E22); the three suites and the root gate green.
- **P9** — 2026-11-16, the §9 correction batch: O21's cell, the pinned doctor instruction, the two re-pointed comments (E23–E25) · `9bba62cd`; the batch gate green (E26).

## Next

External verification: the delivery is complete on the branch (all 23 obligation
rows `verified`, the root gate green at `fa81c10a`) and the owner — the external
verifier — decides. Any blocker found is one correction batch over its rows,
never a second review cycle.

## References

- Issue [#555](https://github.com/gtrabanco/agentic-workflow/issues/555) — `Closes #555`.
- Roadmap row 555 (`programmatic-runner`); the owner decision 2026-11-14.
- `skills/runner-contract/references/RUNNER.md` — the invocation contract this
  unit rewrites (feature 91 / #352).
- `docs/fix/471-headless-journal-writer/` — the action whose private resolver
  this unit replaces.
