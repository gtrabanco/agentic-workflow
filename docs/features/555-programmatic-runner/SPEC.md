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

- P1 — Freeze the unit doc, the two planning ledgers and the triaged steps block
  (validator: `node packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/features/555-programmatic-runner/SPEC.md` exits 0)
  (Implements: S1)
  - Relevant files: docs/features/555-programmatic-runner/SPEC.md, docs/features/555-programmatic-runner/planning-evidence.md, docs/features/555-programmatic-runner/planning-obligations.md
- P2 — RED: land `runner.resolve.test.mjs` alone (resolver cases + the RUNNER.md
  parity scan), observed failing on the absent module and on the absent
  `runner-set@1` block (validator: `bun test packages/agentic-workflow/test/runner.resolve.test.mjs` exits 1 — the module is absent)
  (Implements: S2, S7, S9)
  - Relevant files: packages/agentic-workflow/test/runner.resolve.test.mjs
- P3 — GREEN: the resolver module, the `runner resolve` command (bin usage,
  dispatch, crate README usage line + Commands row, projection `CRATE_COMMANDS`),
  and the lit parity block in RUNNER.md (validator: `bun test packages/agentic-workflow/test/runner.resolve.test.mjs` exits 0)
  (Implements: S2, S5, S7)
  - Relevant files: packages/agentic-workflow/src/runner/resolve.mjs, packages/agentic-workflow/src/runner/cli.mjs, packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/README.md, packages/pi-agentic-workflow/scripts/projection.mjs, skills/runner-contract/references/RUNNER.md
- P4 — RUNNER.md owns the prose: closed set, symbolic `runner` form, the
  cache/exact-pin contract, the pi-session section, the override; every other
  runner citation in `skills/`, the repo docs and the four SPEC templates
  becomes symbolic (validator: `rg -l '(bunx|npx( --yes)?|pnpm dlx) @gtrabanco/agentic-workflow' skills --glob '!runner-contract/references/RUNNER.md'` matches 0 files)
  (Implements: S5, S6, S9, S13)
  - Relevant files: skills/runner-contract/SKILL.md, skills/runner-contract/references/RUNNER.md, skills/*/SKILL.md, skills/*/references/*.md, docs/workflow/*.md, README.md, docs/features/_TEMPLATE/SPEC.md, docs/fix/_TEMPLATE/SPEC.md, template/docs/features/_TEMPLATE/SPEC.md, template/docs/fix/_TEMPLATE/SPEC.md
- P5 — pi consumes the resolver and drops the prose: `runnerLaunch`, the generic
  `agentic_workflow_run` tool, the projection rule, the README rewrite, the pi
  suites (validator: `cd packages/pi-agentic-workflow && bun run test` exits 0)
  (Implements: S3, S4, S8, S12)
  - Relevant files: packages/pi-agentic-workflow/src/runner-bin.ts, packages/pi-agentic-workflow/src/extension/workflow-tools.ts, packages/pi-agentic-workflow/src/conductor/sensor.ts, packages/pi-agentic-workflow/src/extension/aw-index-command.ts, packages/pi-agentic-workflow/projection-manifest.json, packages/pi-agentic-workflow/README.md, packages/pi-agentic-workflow/scripts/mutation-check.mjs, packages/pi-agentic-workflow/test/*
- P6 — The action's private resolver is deleted; `journal/headless.mjs` imports
  the crate module, keeping the S13 argv and refusals (validator: `bun test packages/agentic-workflow/test/journal.headless.test.mjs` exits 0)
  (Implements: S3)
  - Relevant files: journal/headless.mjs
- P7 — State ships: the changeset intent, the roadmap status/summary, the
  `normative-surfaces@1` row and the `machineLines` re-pin, `docs/LOGS.md`, the
  generated projection (validator: `bun scripts/docs-generate.mjs --check` exits 0 and `bun scripts/check-skill-context.mjs --documents` exits 0)
  (Implements: S10)
  - Relevant files: .changeset/*.md, docs/ROADMAP.md, AGENTS.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json, docs/LOGS.md, docs/generated/**
- P8 — Verify: every obligation's validator run in the foreground; the root gate,
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

## Next

P1 — paste the triage block, then P2's red suite.

## References

- Issue [#555](https://github.com/gtrabanco/agentic-workflow/issues/555) — `Closes #555`.
- Roadmap row 555 (`programmatic-runner`); the owner decision 2026-11-14.
- `skills/runner-contract/references/RUNNER.md` — the invocation contract this
  unit rewrites (feature 91 / #352).
- `docs/fix/471-headless-journal-writer/` — the action whose private resolver
  this unit replaces.
