---
# Uncomment and set the keys the unit needs; until type/scope are set, the readers fall back to the folder
# (type) and to the requirement count (scope).
type: feature
scope: medium
# ac-hash: written at close (see ## Next)
---

# fix/413-pi-seam-hooks

> Feature unit for issue #413 (roadmap row 112 `pi-seam-hooks`). The unit home
> follows the governing request's §5 verbatim: `docs/fix/<issue>-<topic>/` — the
> issue is a promoted feature, so the roadmap `## Features` row 112 stays the
> narrative index and this folder is the single unit document.

## Issue

`#413` — NEW FEATURE: pi seam-hooks dispatcher — consent-gated, hooks.json-compatible project config. The PR closes it via `Closes #413`.

## Specs

Requirements cut in the issue's order, each quoting the requester's words
verbatim. **S1** is the governing request's own words; **S2–S10** are issue
#413's words (the target of S1), quoted unedited.

**S1 — Apply the issue to this repository under the governing workflow.**
> Apply to this repository: issue #413

**S2 — Dispatcher in the pi extension.**
> Dispatcher in the pi extension: read project hook config (priority: project-local, then global — mirroring established precedence), map declared events to seam events.

**S3 — Consent-gated, opt-in per seam, off by default.**
> Consent: nothing active before explicit `init-workspace` consent; opt-in flag per seam; off by default.

**S4 — Deterministic execution, bounded output, block with the requirement quoted.**
> Execution: commands run via the runtime module; bounded output; non-zero exit → block at the seam with the declared requirement quoted (teaching message).

**S5 — Auto commit/push only as explicit per-seam flags.**
> Auto commit/push between phases ships ONLY as explicit per-seam flags — never bundled defaults.

**S6 — Declared degradation, never silent.**
> Degradation: missing/broken config → declared no-op with a startup notice, never silent.

**S7 — Config form compatible with Claude Code `hooks.json`.**
> Config form compatible with Claude Code `hooks.json` so existing declarations port.

**S8 — Fixture proof: a declared `pre:commit` check runs and blocks on failure.**
> A fixture project with a declared `pre:commit` check sees it run and block on failure; consent flow gates activation; off-by-default proven by test.

**S9 — Sanitized execution.**
> Arbitrary-command execution is sanitized (no shell interpolation); output bounded.

**S10 — Suites green and docs in the same PR.**
> Root + package suites green; docs (`docs/workflow/`) updated in the same PR.

**Assumptions (marked, never smuggled):**
- The governing request's §5 fixes the unit home at `docs/fix/413-pi-seam-hooks/` even though the issue is a feature; recorded here rather than asked, because §5 names the path explicitly.
- The issue's open question ("Which subset of hooks.json event names maps 1:1 to workflow seams vs needs renaming — decide at triage") is decided in this unit's triage: `SessionStart` → `session:start` and `SessionEnd` → `session:end` port 1:1; every other workflow seam has no Claude Code counterpart, so the dispatcher also accepts the nine native `PROJECTION_SEAMS` names directly. The compatibility table ships in the package README (S7 docs).

## Impact

- Callers: `packages/pi-agentic-workflow/src/extension/index.ts` gains the seam wiring (session lifecycle + `git commit`/`git push` interception); `skills/init-workspace/SKILL.md` gains the consent step; the package README gains the feature + compatibility table; `docs/workflow/` gains the target-project guide page.
- Consumers: target projects that declare `.pi/hooks.json` (or a global `hooks.json`); the schema package's `PROJECTION_SEAMS`, `GUARD_VERDICTS`, `GUARD_REJECTION_REASONS` are consumed read-only (no schema change — S13 of feature 105 keeps the set closed).
- Nothing live changes on the other side: the dispatcher is off by default (S3) and executes nothing until both the consent marker and a per-entry `enabled` flag exist.
- Live-tree guard: the new modules run against fixtures and throwaway copies only until verified (governing request §4).

## Retirements

Nothing is removed: the unit only adds (new modules, new prose sections, new
rows in existing tables). The empty answer's reason — no existing surface
declares seam-hook behaviour, so there is nothing to retire. Verified with
`rg -c 'seam-hooks|hooks.json' packages/pi-agentic-workflow/src` → 0 before this
unit (2026-11-08, at cut).

## Non-goals

- Internal guards (own issue #412) and `prereq` injection (own issue #414).
- New seam events beyond #406's `PROJECTION_SEAMS` vocabulary — the set is consumed, never extended (feature 105 S13).
- Writing or editing the user's hook config — init-workspace's consent flow only writes the consent marker, never the config.
- `phase:start`/`phase:end`/`unit:start`/`unit:end` seam *firing* from the extension: pi exposes no event at those boundaries yet (verified: pinned `types.d.ts` events). The dispatcher's `runSeam` accepts every seam and the config grammar validates every seam; the auto-commit/push machinery is reachable through `runSeam` and proven by test, and stays un-fired until a later unit wires the lane boundary.

## Risk tier

- **`standard`** — verdict at cut: `empty-change` → fail closed upward to standard; re-classified on the real paths at close (recorded in `## Log`).
- **Named high-risk item** — none — not a high-tier unit.

## Future

- Wire `phase:end`/`unit:end` (and `phase:start`/`unit:start`) firing into the lane boundary, which activates the auto-commit/push path end to end. **open**
- Grow `PROJECTION_SEAMS` with `skill:invoke`/`command:invoke` per feature 105's recorded future. **open**

## Future cost

- The compatibility table (package README) is a rendered surface: a new seam in `PROJECTION_SEAMS` or a new Claude Code alias must update it in the same PR.
- The consent marker schema (`<agentDir>/seam-hooks-consent.json`) is written by init-workspace only; any new writer is a contract change in the package README.

## Applicable tests

- `packages/pi-agentic-workflow/test/hooks-config.test.mjs` — discovery, precedence, trust gate, alias mapping, refusal grammar.
- `packages/pi-agentic-workflow/test/hooks-runner.test.mjs` — no-shell tokenization, bounded output, exit→verdict, runtime-module spawn.
- `packages/pi-agentic-workflow/test/hooks-dispatcher.test.mjs` — consent × enabled gates, degradation notices, teaching message, auto flags, the fixture AC (S8) on a git sandbox.
- `packages/pi-agentic-workflow/test/hooks-wiring.test.mjs` — the extension adapter's seam triggers.
- Package regression: the full `bun run test` in `packages/pi-agentic-workflow` (differential proof that existing behaviour holds).

## Known pre-existing issues

- Roadmap row 105 still reads `in-progress` although #406 is closed and merged (PR #426) — `does-not-affect` this unit (its dependency is the closed issue, not the row's prose); noted for the next roadmap sweep.
- `node_modules/@earendil-works/pi-coding-agent` is resolved from the global bun install, not a workspace pin — `does-not-affect` (peer dependency resolved at install time; the verified event names are recorded in planning evidence with their path).

## Tasks

- P1 — Cut the unit doc and freeze the two planning ledgers (this step; validator: `bun scripts/unit-route.mjs --triage 413-pi-seam-hooks` exits 0)
  (Implements: S1)
  Relevant files: docs/fix/413-pi-seam-hooks/
- P2 — Hook config discovery, validation and seam mapping: red suite first, then `src/hooks/config.ts` (validator: `bun run test` in `packages/pi-agentic-workflow` exits 0)
  (Implements: S2, S3, S6, S7)
  Relevant files: packages/pi-agentic-workflow/src/hooks/config.ts, packages/pi-agentic-workflow/test/hooks-config.test.mjs
- P3 — No-shell runner: tokenization, bounded capture, verdicts, runtime-module spawn: red suite first, then `src/hooks/runner.ts` (validator: `bun run test` in `packages/pi-agentic-workflow` exits 0)
  (Implements: S4, S9)
  Relevant files: packages/pi-agentic-workflow/src/hooks/runner.ts, packages/pi-agentic-workflow/test/hooks-runner.test.mjs
- P4 — Dispatcher `runSeam` + teaching message + auto flags, and the S8 fixture proof on a git sandbox: red suite first, then `src/hooks/dispatcher.ts` (validator: `bun run test` in `packages/pi-agentic-workflow` exits 0)
  (Implements: S4, S5, S8)
  Relevant files: packages/pi-agentic-workflow/src/hooks/dispatcher.ts, packages/pi-agentic-workflow/test/hooks-dispatcher.test.mjs
- P5 — Extension wiring: session lifecycle seams + `git commit`/`git push` interception, degradation startup notice: red suite first, then the adapter (validator: `bun run test` in `packages/pi-agentic-workflow` exits 0)
  (Implements: S2, S4, S6)
  Relevant files: packages/pi-agentic-workflow/src/extension/hooks-wiring.ts, packages/pi-agentic-workflow/test/hooks-wiring.test.mjs
- P6 — Consent step in `skills/init-workspace/SKILL.md`, package README feature + compatibility table, `docs/workflow/SEAM_HOOKS.md` target-project guide (validator: `bun scripts/check-skill-context.mjs --routes` exits 0)
  (Implements: S3, S7, S10)
  Relevant files: skills/init-workspace/SKILL.md, packages/pi-agentic-workflow/README.md, docs/workflow/SEAM_HOOKS.md, docs/workflow/README.md
- P7 — Repository indexes: roadmap row 112 status, `## Fixes` row, generated projection re-rendered (validator: `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S10)
  Relevant files: docs/ROADMAP.md, docs/generated/
- P8 — Verification: full package suite, root gate subset, ceremony re-classification on real paths, `docs/LOGS.md` session entry (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S10)

### Planning evidence

M-size unit: the ledger lives in this folder's `planning-evidence.md` — this
section names it, never embeds it.

### Obligations

M-size unit: the ledger lives in this folder's `planning-obligations.md` — this
section names it, never embeds it.

## Triaged steps

```text
TRIAGE — 413-pi-seam-hooks (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
```

> The governing request's §4 substitutes for the lane: work is inline, the
> review/evidence/release ceremony is discharged by the §8 external-verdict
> handoff, and the lane's steps map onto P1–P8 above. The relay suggestion is
> declined — the governing request forbids running the repo's own machinery on
> its own surgery.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-08, the request, verbatim:
  ```
  Apply to this repository: issue #413

  This is a **local, unpublished** workflow for changing agentic-workflow itself. The failure it prevents: the workflow judging its own surgery (unit fix-258 burned 12 review→fold cycles that way). Follow this order, every step:

  ## 0. Resolve the intent from state before acting
  [... the governing workflow, §0–§9, as received — the operative asks: verbatim S1..Sn; frozen-failure corpus first; fixtures before the real tree; inline work, no self-review machinery; freeze the planning ledgers before the first line of code; implement test-first, differential, in slices; documentation and state in the same change; verify like a writer, hand off like one; correction bounds]
  ```
  (Full text held by the requester's message; the S1 line and the §5 freeze contract are quoted in full in `## Specs` and `## Tasks`.)

## Next

P2 — the red suite for the hook config module.

## References

- Issue [#413](https://github.com/gtrabanco/agentic-workflow/issues/413), roadmap row 112.
- Dependency: #406 (closed, PR #426) — `PROJECTION_SEAMS`, `GUARD_VERDICTS`, `GUARD_REJECTION_REASONS`.
- Feature 105 unit doc: `docs/features/105-projection-manifest-vocabulary/`.

## Branch

`feat/413-pi-seam-hooks` (already cut from `main` at `b8b1d814`)

## Depends on

`#406` — merged 2026-11-06 (PR #426). None open.

## Regression scope

- Existing extension behaviour (routing, path protection, receipt guard, telemetry, auto-log-session) must not change: the full package suite is the differential check (`bun run test` in `packages/pi-agentic-workflow`, existing suites untouched and green).
- Existing config loading keeps its exact semantics: `packages/pi-agentic-workflow/test/config-merge.test.mjs` and `test/untrusted-project-config.test.mjs` green, untouched.
