---
type: feature
scope: medium
ac-hash: 977795d200f3857187ebbef331d387645f4381d2
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
- Named high-risk item (tier verdict at close): `packages/pi-agentic-workflow/test/hooks-runner.test.mjs · rm` — the suite's own `mkdtempSync` fixture cleanup under `os.tmpdir()`, never a repo path; quoted in full under `## Risk tier`.
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

Verdict re-classified on the real paths at close (2026-11-08):

```json
{
  "contract": "risk-tier-verdict@1",
  "tier": "high",
  "reason": "1 path(s) touch a named high-risk surface: destructive (packages/pi-agentic-workflow/test/hooks-runner.test.mjs · rm)",
  "reason_kind": "named-high-risk",
  "task_size": { "understood": true, "contained_risk": "named", "resumable_from_diff": true, "ceremony": "unit-doc+review-change", "verification": "review-change" }
}
```

- **`high`** · **Task Size** — understood · named risk · resumable from diff
- **Named high-risk item** — `packages/pi-agentic-workflow/test/hooks-runner.test.mjs · rm`: the suite's `rmSync` calls remove only its own `mkdtempSync` fixtures under `os.tmpdir()` (the same idiom every existing spawn-based suite in this repo uses — `git-sandbox.mjs` neighbors), never a repo path. The high tier's *full review pass* is discharged by the owner's external verdict per the governing request (§4: no self-review machinery on this repo's own surgery; the review cycle's cost is why this workflow exists).
- **Tier** — `high`

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

- **The unit-doc template's commented frontmatter used to be read as the H1 by the projection — fixed at the root in P10.** `scripts/docs-generate.mjs`'s `unitFacts` now skips the frontmatter before its title scan, so the template's `# Uncomment and set the keys …` block stays as the keys' documentation and can no longer reach `docs/generated/units.md`; #432's stale cell corrected itself on the next render without editing a closed unit's doc. The four templates were left as they are on purpose (their comments are legitimate YAML and now harmless).
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
- P11 — N3: the shutdown seam hands its promise to the host and runs inside a 5 s budget (validator: `bun test packages/pi-agentic-workflow/test/hooks-wiring.test.mjs` + `test/alias-coverage.test.mjs` exit 0)
  (Implements: S1, S4)
  Relevant files: packages/pi-agentic-workflow/src/extension/index.ts, src/extension/hooks-wiring.ts, src/hooks/dispatcher.ts, test/hooks-wiring.test.mjs, test/alias-coverage.test.mjs
- P10 — Integrate `main` into the branch (owner's order) and fix F13 at the root: the projection's title scan skips the frontmatter (validator: `bun test scripts/docs-generate.test.mjs` exits 0, 22 pass)
  (Implements: S1, S10)
  Relevant files: scripts/docs-generate.mjs, scripts/docs-generate.test.mjs, docs/ROADMAP.md, docs/LOGS.md, docs/generated/units.md
- P9 — Correction batch over the 2026-11-08 external receipt: the three blockers and the eight `fix-now` advisories, with A4 recorded `not-a-defect` on the gate that proves it (validator: `bun run test` in `packages/pi-agentic-workflow` exits 0 with the ten new cases passing)
  (Implements: S1, S2, S3, S4, S6, S9, S10)
  Relevant files: packages/pi-agentic-workflow/src/hooks/runner.ts, src/hooks/dispatcher.ts, src/extension/hooks-wiring.ts, test/hooks-*.test.mjs, README.md, docs/workflow/SEAM_HOOKS.md, skills/init-workspace/SKILL.md

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

## Acceptance criteria

One observable, testable criterion per `S#`, each naming the check that proves
it. This is the anchor the owner's external verdict reads per criterion.

| # | Criterion (S#) | Proved by |
|---|---|---|
| AC-1 | Hook config is discovered project-local then global, project entries run after global ones, and an untrusted project's file is never read (S2) | `bun test packages/pi-agentic-workflow/test/hooks-config.test.mjs` exits 0 (O1/O2 cases) |
| AC-2 | Nothing executes without the init-workspace consent marker, and a group without `"enabled": true` never runs — off by default, proven by test (S3) | `bun test packages/pi-agentic-workflow/test/hooks-dispatcher.test.mjs` exits 0 (O3/O4 cases) |
| AC-3 | A failing hook blocks at the seam with a teaching message quoting the declared requirement as declared (S4) | `bun test packages/pi-agentic-workflow/test/hooks-runner.test.mjs` exits 0 (O8 cases) and the dispatcher sandbox case blocks with the message |
| AC-4 | Auto commit/push exist only as explicit `phase:end`/`unit:end` flags with the declared message, never bundled defaults (S5) | `bun test packages/pi-agentic-workflow/test/hooks-config.test.mjs` (refusal cases) and `test/hooks-dispatcher.test.mjs` (auto-flag cases) exit 0 |
| AC-5 | Missing config is a quiet no-op; broken config degrades with a notice naming the file, never silent, never thrown (S6) | `bun test packages/pi-agentic-workflow/test/hooks-config.test.mjs` + `test/hooks-wiring.test.mjs` (latched-notice case) exit 0 |
| AC-6 | The config form is hooks.json-compatible: matcher-group shape, `SessionStart`/`SessionEnd` aliases, unknown events refused — the compatibility table ships (S7) | `bun test packages/pi-agentic-workflow/test/hooks-config.test.mjs` exits 0; the table is present in `packages/pi-agentic-workflow/README.md` |
| AC-7 | A git sandbox with a declared `pre:commit` check sees it run and block on failure (S8) | the dispatcher suite's sandbox case passes (`bun test packages/pi-agentic-workflow/test/hooks-dispatcher.test.mjs` exits 0) and the wiring suite's interception case blocks a `git commit` |
| AC-8 | Commands spawn as argv with `shell: false`, metacharacters refused before any process, output capped with a truncation marker (S9) | `bun test packages/pi-agentic-workflow/test/hooks-runner.test.mjs` exits 0 (O6/O7 cases) |
| AC-9 | Package suites and the touched root suites are green, and the docs ship in the same PR (S10) | `bun run test` in `packages/pi-agentic-workflow` exits 0 (596/0); `node scripts/run-root-suite.mjs` exits 0; `bun scripts/docs-generate.mjs --check` exits 0 |
| AC-10 | The governing workflow was followed: S1–S10 quoted verbatim, ledgers frozen before code, red before green, inline work with no self-review machinery (S1) | this SPEC's `## Specs` quotes, the ledger freeze commit `0d2cf6a6` predating red commit `2d4d5ea7`, and the absence of any fold/review cycle in `## Log` |

## Findings

Rows appended from the 2026-11-08 `EXTERNAL VERIFY` receipt
(`external-verify.md`, 3 blockers + 10 advisories), triaged on 2026-11-08 and
folded in the P9 correction batch. `class` uses the review vocabulary
(`fix-now` / `not-a-defect`); `route` names the surface the correction landed
in, or the gate that proves the finding was misattributed.

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|
| F1 | B1 · `packages/pi-agentic-workflow/src/hooks/runner.ts:122-192` | correctness | blocker | a hook command that cannot spawn threw an unhandled `'error'` event: the host dies (pi interactive `exit(1)`) or the seam hangs; the config accepted the command as valid | fix-now | `src/hooks/runner.ts` — `'error'` handler settles as `block` naming the spawn failure (O15) |
| F2 | B2 · `src/extension/hooks-wiring.ts:108-114` + `src/extension/index.ts:356,397` | correctness | blocker | a failing `session:start`/`session:end` hook produced a `block` verdict that was discarded one layer up: no block, no notice, no output | fix-now | `src/extension/hooks-wiring.ts` — session seams notify their teaching message (O16) |
| F3 | B3 · `src/extension/hooks-wiring.ts:63-75` | correctness | medium | `git -C <p> commit`, `git -c k=v commit`, `git --git-dir=<p> commit`, `GIT_DIR=x git commit` skipped the declared `pre:commit`/`pre:push` gate silently (a real commit landed with its check never run) | fix-now | `src/extension/hooks-wiring.ts` — option-value and env-prefix aware matcher (O17) |
| F4 | A5 · `src/hooks/runner.ts:139-141,162` | correctness | medium | reaching the 32 KiB cap SIGTERM'd the hook, so a verbose-but-passing check blocked the seam | fix-now | `src/hooks/runner.ts` — truncate and drain, verdict from the exit code (O19) |
| F5 | A8 · `src/hooks/dispatcher.ts:91` | observability | medium | an `enabled` group with no consent entry was completely silent: a valid config produced nothing, forever | fix-now | `dispatcher.ts` info notice + `hooks-wiring.ts` one-time announce (O20) |
| F6 | A6 · `src/hooks/runner.ts:233` | correctness | low | the teaching message re-joined the argv, so a declaration carrying its own quoting was reported unquoted | fix-now | `seamBlockMessage` takes the declared string (O21) |
| F7 | A2 · `skills/init-workspace/SKILL.md:148` + `packages/pi-agentic-workflow/README.md:380,387` | docs | medium | `<agentDir>` was never resolved, and the consent entry is the only activation path | fix-now | skill + README name `~/.pi/agent` / `getAgentDir()` (O23) |
| F8 | A3 · `SPEC.md` frontmatter → `docs/generated/units.md:109` | docs | low | the projected 413 row published the template's commented frontmatter note as the unit title (`docs-generate` reads the first `/^# /` line, PE-011) | fix-now | comment lines dropped, projection re-rendered (O24) |
| F9 | A9 · `src/hooks/dispatcher.ts:91` | tests | info | the consent read bypassed the injected reader, so one suite read the real filesystem | fix-now | `readSeamHooksConsent(…, deps.readFile)` (O22) |
| F10 | A7 · `packages/pi-agentic-workflow/test/hooks-dispatcher.test.mjs:132` | tests | info | the "git sandbox" case created no git repository and ran no commit; the real-commit proof lives in the wiring suite | fix-now | dispatcher case renamed; `hooks-wiring.test.mjs` gains the real-repo commit case (O17) |
| F11 | A1 · `SPEC.md:218,220` | docs | low | G1/E3 recorded 87 PASS and 11/0 where the tree yields 88 and 12/0 | fix-now | the `## Log` receipts are corrected against a re-run (O24) |
| F12 | A4 · `docs/ROADMAP.md:131` + the `## Fixes` row | docs | low | `done · [#456]` before merge looked like state written ahead of the event | not-a-defect | `bun scripts/roadmap-settle.mjs` requires exactly that settle whenever the unit doc carries its PR URL (`pr-url-unsettled`, PE-012): reverting it fails the gate |

| F13 | A3's root cause · `scripts/docs-generate.mjs:199` | docs | medium | `unitFacts` took the first `/^# /` line as the unit title, and every SPEC template opens with `# Uncomment and set the keys …` inside the frontmatter — so a unit that keeps the block publishes template prose as its description (#432 still did; found at triage, not in the receipt) | fix-now | `unitFacts` skips the frontmatter before either scan: both rows read their H1 after the render, closed docs untouched (P10) |

| F14 | N3 · `src/extension/index.ts:397` + `src/extension/hooks-wiring.ts` | correctness | low | the `session_shutdown` handler discarded the wiring's promise (`void`), so a failing `session:end` report could be lost when the process exits — and awaiting it unbounded would let a declared check hold the quit | fix-now | handler returns the promise (pi awaits it before teardown) and the seam carries a 5 s `SHUTDOWN_BUDGET_MS` (P11) |

F1–F11 are folded in the P9 batch (each row's `route` names the surface and the
obligation that pins it); F12 stays `not-a-defect` on the gate's own word. No
row remains open.

## Log

- **L1** — 2026-11-08, the request, verbatim:
  ```
  Apply to this repository: issue #413

  This is a **local, unpublished** workflow for changing agentic-workflow itself. The failure it prevents: the workflow judging its own surgery (unit fix-258 burned 12 review→fold cycles that way). Follow this order, every step:

  ## 0. Resolve the intent from state before acting
  [... the governing workflow, §0–§9, as received — the operative asks: verbatim S1..Sn; frozen-failure corpus first; fixtures before the real tree; inline work, no self-review machinery; freeze the planning ledgers before the first line of code; implement test-first, differential, in slices; documentation and state in the same change; verify like a writer, hand off like one; correction bounds]
  ```
  (Full text held by the requester's message; the S1 line and the §5 freeze contract are quoted in full in `## Specs` and `## Tasks`.)
- **D1** — 2026-11-08, §2 frozen-failure corpus: **n/a — this change repairs no recorded failure** (no findings-ledger rows, no open findings, no failure reports reference seam hooks; the issue is a promoted feature). The red-first discipline is carried instead by the new suites themselves (E1).
- **D2** — 2026-11-08, §3 fixture-first: the new mechanic (no-shell argv spawn, bounded capture, kill-on-timeout, killTree for the close-event-on-inherited-stdio trap) spiked on a `mktemp -d /tmp/…` throwaway copy and was removed; the `/tmp` scratch left nothing behind.
- **D3** — 2026-11-08, triage decision the issue deferred to triage: `SessionStart` → `session:start` and `SessionEnd` → `session:end` map 1:1; every other workflow seam has no Claude Code counterpart, so the nine native seam names are accepted directly and every other Claude Code event name is refused `config-invalid`. Recorded in the compatibility table (package README) and `docs/workflow/SEAM_HOOKS.md`.
- **E1** — 2026-11-08, red commit `2d4d5ea7`: `bun run test` (packages/pi-agentic-workflow) · exit 1 · 555 pass / **4 fail** — the failures are exactly the four new hooks suites (`../dist/hooks/*` unresolvable); every pre-existing suite green.
- **P1** — 2026-11-08, unit doc + planning ledgers cut · commit `0d2cf6a6`.
- **P2** — 2026-11-08, green: `src/hooks/config.ts` + `runner.ts` + `dispatcher.ts` + `extension/hooks-wiring.ts` wired into the entry, all four suites green · commit `8544887f`. Slice size 899 authored lines — over the ~400 guidance because the four modules are one red-first suite's subject and the wiring is inert without the dispatcher; splitting further would have separated a suite from the code it pins mid-cycle (governing request §6, stated-reason clause).
- **P3** — 2026-11-08, docs + indexes: init-workspace consent step, package README (feature + compatibility table), `docs/workflow/SEAM_HOOKS.md` + pages index, roadmap row 112 → `in-progress`, Fixes row appended, generated projection re-rendered by `docs-generate` · commit `dbc30279`.
- **G1** — 2026-11-08, `node scripts/run-root-suite.mjs` · exit 0 · **88 PASS / 0 FAIL** (recorded as 87 at the time — a miscount: `scripts/` carries 88 `*.test.mjs` at base, at `dbc30279` and at the head; corrected on the 2026-11-08 verify, F11).
- **E2** — 2026-11-08, `bun run test` (packages/pi-agentic-workflow, full) · exit 0 · 596 pass / 0 fail — the differential proof: every pre-existing suite untouched and green; the one intentional delta is `test/alias-coverage.test.mjs`'s event inventory, which documents the entry's two new listeners (`session_shutdown`, `tool_result`) exactly as feature 66's precedent did.
- **E3** — 2026-11-08, foreground validators, one run each: `bun test test/hooks-config.test.mjs` **12/0** (11/0 as recorded before E6 pinned the real-filesystem case — F11) · `bun test test/hooks-runner.test.mjs` 9/0 · `bun test test/hooks-dispatcher.test.mjs` 13/0 · `bun test test/hooks-wiring.test.mjs` 8/0 · `rg -c 'writeFile|writeFileSync|appendFile' packages/pi-agentic-workflow/src/hooks/` → **zero matches** (O13).
- **E4** — 2026-11-08, `bun scripts/docs-generate.mjs --check` · exit 0 (0 stale) · `bun scripts/check-skill-context.mjs` + `--routes` · PASS (28 skills, 14 routes) · `bun scripts/skill-lint.mjs` · PASS (0 findings in 92 files).
- **G2** — 2026-11-08, `bun scripts/local-gate.mjs --only version-parity-content` · **exit 1** — the pi package ships changed content without a version bump; fixed by adding `.changeset/413-pi-seam-hooks.md` (the declared route), re-run · **exit 0 / PASS**. The first root-suite run predated the changeset; the same local-gate step is the one that caught it.
- **E5** — 2026-11-08, `bun scripts/ceremony.mjs tier classify` on the real paths · tier `high` (named-high-risk: the runner suite's own tmp-fixture `rm`) — verdict quoted verbatim in `## Risk tier`; the full review pass it names is the owner's external verdict (§4/§8).
- **E6** — 2026-11-08, the pre-push hook (installed at the repo level) went red at `pi-node-compat`: under node, `readIfExists`'s lazy `require("node:fs")` inside ESM throws `ReferenceError`, which `loadHooksConfig` swallowed as "unreadable" and `readSeamHooksConsent` as `false` — a real portability bug bun's ESM `require` tolerance had hidden from every bun-first run. Root-caused, fixed (top-level `import { readFileSync }`, the `../config/load.ts` contract) and pinned (new real-filesystem no-injected-reader case; the node leg itself is the runtime pin). Package suite after the fix: **597 pass / 0 fail**; the touched suites 20/0 under `node --test`.

- **L2** — 2026-11-08, the correction request, verbatim: `Apply to this repository: arregla todos los findings` (governing workflow §0–§9 as received; the operative asks: one correction batch over the receipt, ledgers frozen first, RED before the fix, fixtures before the real tree, docs and state in the same change, no self-review machinery).
- **D4** — 2026-11-08, triage of the receipt (`external-verify.md` §Triage): the three blockers and eight advisories are `fix-now`; **F12 (A4) is `not-a-defect`** — `scripts/roadmap-settle.mjs` refuses `pr-url-unsettled` while a unit doc carries its PR URL without the row reading `done · [#N](<same url>)` (PE-012), so the row stays as the gate requires. **F11 (A1) is a receipt-accuracy defect, not a behaviour one** — corrected against this batch's re-run. The batch is `P9` in the obligation ledger (O15–O25, `planned` at this freeze).
- **D5** — 2026-11-08, §3 fixtures before the real tree: the four new mechanics were spiked on `mktemp -d` scratch first — the `'error'`-settles-the-round solver (including the double-settle guard when `'close'` also fires), the drain-and-truncate capture, the quote-aware git matcher, and the inert-notice path — then removed; nothing ran against the live tree.
- **P9-F** — 2026-11-08, ledgers frozen: O15–O25 `planned`, PE-009–PE-012 recorded, the receipt's findings persisted in `## Findings`.

- **P9-R** — 2026-11-08, red commit `8fafc7d3`: `bun run test` (packages/pi-agentic-workflow) · exit 1 · **596 pass / 10 fail** of 606 — the ten new cases (O15–O22) and nothing else; every pre-existing suite green.
- **P9-G** — 2026-11-08, green: `'error'`-settles-the-round in the runner, drain-and-truncate capture, declared-string teaching message, inert-without-consent notice, one-notice-per-message latch, session seams reporting their blocks, and the shell-shaped git matcher · `bun run test` exit 0 · **606 pass / 0 fail** of 606; the three touched suites under `node --test` · 39 pass / 0 fail (O15's ENOENT case is the one that crashes without the handler).
- **P9-D** — 2026-11-08, docs in the same change: package README (spawn failure, cap semantics, session-seam reporting, interception residual, `<agentDir>` resolution), `docs/workflow/SEAM_HOOKS.md` (same four contracts), `skills/init-workspace/SKILL.md` (`<agentDir>` = `getAgentDir()` / `~/.pi/agent`), the changeset, this unit doc's frontmatter (the template note the projection read as the title, F8) and `## Next`.
- **P9-V** — 2026-11-08, foreground verification of this head: `bun run test` (packages/pi-agentic-workflow) exit 0 · **606 pass / 0 fail** of 606 (52 files); `node --test test/hooks-runner.test.mjs test/hooks-dispatcher.test.mjs test/hooks-wiring.test.mjs` · **39 pass / 0 fail**; `node scripts/run-root-suite.mjs` exit 0 · **88 PASS / 0 FAIL**; `bun scripts/docs-generate.mjs --check` exit 0 (3 files, 0 stale); `bun scripts/skill-lint.mjs` PASS (92 files, 0 findings); `bun scripts/check-skill-context.mjs` PASS 28 skills + `--routes` PASS 14 routes; `bun scripts/roadmap-settle.mjs` PASS (150 docs, 0 violations); `bun scripts/unit-route.mjs --triage 413-pi-seam-hooks` exit 0; `bun scripts/local-gate.mjs --skip-network --only version-parity-content,docs-generated-projection,pi-node-compat` exit 0 (changeset route, projection current, the whole package suite green under node); `rg -c 'writeFile|writeFileSync|appendFile' packages/pi-agentic-workflow/src/hooks/` → **0 matches** (O13).
- **P9-X** — 2026-11-08, disclosed — two timing-bound checks went red under load and green on the identical command when the machine was quiet, both in code this branch does not touch: **(1)** `schema-node-compat` (`packages/agentic-workflow-schema` has no diff on this branch) failed twice on its 50 ms preflight bound (90.51 ms / 95.74 ms), once pooled and once solo; green on two consecutive direct runs (756/756) and green through the gate afterwards (`exit 0 in 6s`). **(2)** `scripts/unit-route.test.mjs`'s `#291 F7` linear-scan bound (543 ms vs <500 ms) failed in one pooled root-suite run (the suite took 19.6 s pooled vs 3.3 s alone); the next pooled run was **88 PASS / 0 FAIL** exit 0. Both are the documented CPU-contention class, neither is change-caused, and neither is green-by-retry: each passes on repeated runs at this head.
- **P10-M** — 2026-11-08, `main` integrated into the branch on the owner's order: conflicts resolved on `docs/ROADMAP.md` (main's `#433` fixes row and this branch's `#413` row both kept; row 112 keeps the `done · #456` settle `roadmap-settle` requires), `docs/LOGS.md` (main's aggregate kept whole, this branch's three 413 entries re-appended, none rewritten), the journal fragment `20261107T151312Z-…` (main's deletion accepted — it renamed and then aggregated that narrative into `docs/LOGS.md`, superseding the branch's name-only repair) and `docs/generated/units.md` (re-rendered; the merge driver's incoming projection is not the authority). Merge commit `d821c3b4`, two parents, amended once before any push to carry the regenerated projection.
- **P10-R/G** — 2026-11-08, F13 red first (`930f4542`: `bun test scripts/docs-generate.test.mjs` · 21 pass / 1 fail) then the root fix (`cefc95f5`: **22 pass / 0 fail**): `unitFacts` skips the frontmatter, so a commented note can never be the projected title; `docs/generated/units.md` regenerated and now reads `fix/413-pi-seam-hooks` and `fix/432-model-memory-tier-0`.
- **P10-V** — 2026-11-08, foreground verification of the merged head: `bun test scripts/docs-generate.test.mjs` 22/0; `node scripts/run-root-suite.mjs` exit 0 · **89 PASS / 0 FAIL** (main's new suite included); `bun run test` (packages/pi-agentic-workflow) exit 0 · **606 pass / 0 fail**; `bun scripts/docs-generate.mjs --check` exit 0 (0 stale); `bun scripts/skill-lint.mjs` PASS; `check-skill-context` PASS 28 skills + `--routes` PASS 14 routes; `roadmap-settle` PASS (0 violations); `unit-route --triage 413-pi-seam-hooks` exit 0; `local-gate --only version-parity-content,docs-generated-projection,pi-node-compat` PASS 3/3.
- **P11-R/G** — 2026-11-08, N3 red first (`d7952e27`: `bun run test` · 606 pass / **2 fail** — a slow `session:end` hook held teardown its full 5 s and an entry-level case found `session_shutdown` returning `undefined`) then green (`e135927c`): the handler returns the wiring's promise (pi awaits every handler of that event before `dispose()`: `emitSessionShutdownEvent` → `await emit`), and `SeamDeps.budgetMs` caps the shutdown seam at `SHUTDOWN_BUDGET_MS` (5 s) — a slow check reports a timeout inside the bound, the quit is never held for a declaration's 60 s. **608 pass / 0 fail**; the four touched suites 56/0 under node.
- **P11-V** — 2026-11-08 (run in a re-cloned working copy after the environment loss below): `bun run test` 608/0; `node --test` on the four suites 56/0; `bun scripts/docs-generate.mjs --check` 0 stale; `bun scripts/skill-lint.mjs` PASS; `check-skill-context` PASS 28 skills + `--routes` PASS 14 routes; `roadmap-settle` PASS; `unit-route --triage` exit 0; root suite exit 0 · 89 PASS / 0 FAIL.
- **Incident (disclosed, 2026-11-07T22:55–23:20Z)** — the environment deleted this session's worktrees twice and then lost the branch's local objects; nothing shipped was lost because every commit through `60ff9659` was pushed, but the N3 commits that existed only locally were re-applied from the session transcript (red, then green, both re-run). Sequence observed: (1) `/home/agent/projects/feat/413-pi-seam-hooks` disappeared during the first N3 red run (`/tmp` was simultaneously at its inode ceiling, 1,048,576/1,048,576, and then reset); (2) after `git worktree add` restored it, it disappeared again, and I continued in a worktree at `/home/agent/wt/413-pi-seam-hooks` which was deleted minutes later; (3) the shared repository's `feat/413-pi-seam-hooks` ref then pointed at another session's commit (`f95bbd17`, built on `main`), and my branch's objects — including the pushed `60ff9659` — were gone from the local object store after that ref moved (gc). Recovery: a plain clone of the shared repo, `git fetch origin feat/413-pi-seam-hooks` → the pushed head `60ff9659`, N3 re-applied on top. No force-push, no rewritten published history; the other session's ref and work were left untouched.

## Next

The owner's re-verify of the P9 correction batch at this head. The unit is
implementation-complete, the receipt's three blockers and eight advisories are
folded, and PR #456 is open against `main` (`Closes #413`) with the roadmap row
settled as `roadmap-settle` requires. Nothing is pending in this unit: merging
PR #456 on the owner's verdict closes #413.

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
