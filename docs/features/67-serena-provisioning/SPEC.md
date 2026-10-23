---
type: feature
scope: medium
---

# 67 — serena-provisioning

> Unit doc for issue [#219](https://github.com/gtrabanco/agentic-workflow/issues/219)
> (roadmap row 67, `idea → …`): make LSP-backed verification **present by
> default**. Both provisioning paths, one runtime contract.

## Objective

Ship the two provisioning paths of issue #219: (1) the **pi path** —
`@gtrabanco/pi-agentic-workflow` delivers Serena's language-server tools to a
pi session without further configuration; (2) the **non-pi path** —
`init-workspace` gains the consented Serena **tool install + MCP registration**
step (`uv`/`uvx` preferred, `pipx` fallback, ask-first, reports exactly what it
installed). The project-config half (`.serena/project.yml` + `.gitignore` +
health check) already landed (PRs #263/#264) and is verified here, not rebuilt.

## Why

LSP-backed navigation and verification were aspirational: nothing provisioned
the tool, and the project config was the only half anyone owned.

- The tool-install half is explicitly deferred to this issue:
  `skills/init-workspace/references/SERENA.md:124-128` — *"This file owns the
  project config, not the tool… The install half is tracked by #219."*
- The pi package declares no Serena surface today:
  `packages/pi-agentic-workflow/package.json:59-62` (`dependencies` = the
  agentic-workflow + schema packages only).
- Fresh-clone trust is handled nowhere in the workflow: repo-wide
  `grep -rn "trusted_project" skills/ scripts/ docs/ packages/` → **no hits**,
  yet a fresh clone whose `trusted_project_path_patterns` does not cover the
  project starts no language server at all (issue #219 scope adjustment,
  2026-09-24, refs #260).
- The failure mode is real and was reproduced in this repository (issue #219:
  a config pinning `language_servers: [bash]` made every symbol call time out
  with `Language server status: not initialized`; fixed in #261/#263/#264).

## User outcome

- A pi user who installs `@gtrabanco/pi-agentic-workflow` gets Serena's
  language-server tools (symbols, references, diagnostics) alongside the
  workflow skills — no separate discovery, no extra install step.
- A non-pi user who runs `/init-workspace` on a bare repository is **offered**
  the Serena install and MCP registration once, answered yes/no; on yes the run
  reports exactly what it installed and registered, on refusal it records a
  residual and finishes cleanly with nothing written.
- Either way, when a run reports Serena available, the health check behind that
  claim has asserted `Language server status: initialized` — and when it has
  not, the run says so once and records the absence instead of passing quietly.

## Acceptance criteria

Induced from issue #219 (its two delivery paths + the 2026-09-24 scope
adjustment) and closed by the owner's answers in `decisions.md` (D1–D5,
2026-10-21). Each row names what induced it; `sources.md` carries the claim's
source.

1. **pi path present by default** *(D1)*. `packages/pi-agentic-workflow/package.json`
   exact-pins `@bacnh85/pi-serena` in `dependencies` **and** declares
   `./node_modules/@bacnh85/pi-serena/extensions/index.ts` as a second
   `pi.extensions` entry; installing the packed tarball into a scratch pi
   install registers the `serena_*` tools (verified before merge); a test pins
   both the exact version and the manifest entry; the package README documents
   what ships and pi's own off switch (`pi config` / the `packages` resource
   filter). FAIL if any of the four is absent, or if the scratch install does
   not register the tools.
2. **Pins are watched** *(D1 addendum)*. A scheduled GitHub action checks the
   package's exact `dependencies` pins against the registry and opens (or
   reuses) an issue naming the package, the pinned version and the published
   version whenever a newer one exists; it reports "no drift" and exits 0 when
   there is none. The check is pinned by a test over an injected version list
   (no network in the suite). FAIL if the schedule or the issue-creation path
   is missing.
3. **Consented tool install (non-pi path)** *(issue #219 Mechanics + A1/A2)*.
   In a bare repository where `uv` is detected, `init-workspace` asks **one**
   consented question offering the Serena install plus MCP registration; on yes
   it runs `uv tool install -p 3.13 serena-agent && serena init` (`pipx` only
   as the MCP-path fallback) and registers the MCP server for the **detected**
   platform, then reports exactly what it installed and registered; on refusal
   it installs/registers nothing and records the absence as a residual, still
   exiting cleanly. FAIL if anything is installed, written or registered
   without that yes.
4. **Fallback and absence never block** *(issue #219 Mechanics)*. With neither
   `uv`/`uvx` nor `pipx` available, the step offers only what it can perform
   and records the residual with the reason; `init-workspace` completes either
   way.
5. **Trust is consented and scoped** *(D4)*. The step detects that the project
   root is not covered by the global `trusted_project_path_patterns` and
   offers the append inside the same consented Serena question; a refusal
   records the untrusted state as the health-check residual. The global
   `serena_config.yml` is never written without a yes, and no other line of it
   is ever rewritten. FAIL on an implicit global write.
6. **One config writer** *(D2)*. `init-workspace` remains the only writer of
   `.serena/project.yml`; the pi package never writes or repairs it — it
   reports a missing/wrong config fail-closed at the claim, and the package
   README names `/init-workspace` as the required first run. FAIL if the pi
   package gains any write path into `.serena/`.
7. **Fail-closed at the claim** *(issue #219 scope adjustment item 2)*. The
   provisioning report records the health check per listed language server
   (`Language server status: initialized`), names the offending entry when one
   fails, and drops a failing entry per the startup rule (`SERENA.md:96-110`).
   A degraded run warns once and records the absence; never a silent pass.
8. **LSP evidence confined to TypeScript/JavaScript** *(issue #219 scope
   adjustment item 4)*: diagnostics/evidence claims stay TS/JS-only, and
   document verification remains a deterministic script's job
   (`SERENA.md:118-121`).
9. **Code-level readiness nudge** *(D5)*. In the pi package, a latched
   once-per-state check on session start / first workflow-command dispatch
   notices a missing or stale `.serena/project.yml` (or a changed recorded
   init-workspace revision) and emits **exactly one** notification suggesting
   `/init-workspace`; it writes nothing to the project and nothing to any
   configuration (its only write is its own global state latch,
   read-merge-write like the existing hint), is soft on failure, and its latch
   survives a restart (same latch contract as the package's first-run hint,
   `test/first-run-hint.test.mjs`). FAIL on a repeat notification or on any
   write outside its own state file.
10. **Suites green, bump shipped** *(AGENTS.md → Packages)*. Root suite
    `node --test scripts/*.test.mjs` and `bun run test` in
    `packages/pi-agentic-workflow` both exit 0, and the touched-surface version
    parity gate passes (Pi package version bump + CHANGELOG companion row in
    the same PR). FAIL on a red gate or a missing bump/row.

**Already satisfied, verification-only** (config half, PRs #263/#264 — re-run
as evidence rows, never re-implemented): `.serena/project.yml` written for the
detected languages; `.gitignore` carve-out written additively; health check +
startup rule documented as the single owner contract in `SERENA.md`.

## Impact

- **Consumes:** issue #219 + its 2026-09-24 scope adjustment; the landed
  config contract `skills/init-workspace/references/SERENA.md` (owner of the
  project-config rules); the pi package's optional-config surface
  (`packages/pi-agentic-workflow/README.md:148-160`, `pathProtection` /
  `recommendedModels` / `onSettle` — the shape an "opt-in" has today).
- **Touches:** `packages/pi-agentic-workflow/` (package.json, bun.lock, README,
  src, test), `skills/init-workspace/` (SKILL.md +
  `skills/init-workspace/references/SERENA.md`,
  `skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md`,
  `skills/init-workspace/references/BOOTSTRAP_WRITE.md`,
  `skills/init-workspace/references/UPGRADE.md`), a **new** scheduled workflow
  under `.github/workflows/` (pin watch → issue) with its runner
  `scripts/pin-watch.mjs` + `scripts/pin-watch.test.mjs`,
  `scripts/serena-activation-check.mjs` (P2's packed-artifact validator), the
  P1 fail-open fix in `scripts/version-parity-gate.mjs` + its test (the gate
  AC10 relies on), `docs/workflow/SKILL_CONTEXT_BUDGETS.json` (P4's declared
  reference re-base), root `README.md`,
  `CHANGELOG.md`, `docs/features/ROADMAP.md` (row 67 status).
- **Stops being true:** `SERENA.md:124-128` "The install half is tracked by
  #219" (the residual sentence is replaced by the step itself);
  `init-workspace`'s `Done when` (`SKILL.md:218-221`) grows the install offer
  and the trust offer; the root README's `init-workspace` blurb (`README.md:80`)
  if the offer changes its description; the pi package README gains the
  "what ships + how to switch it off" paragraph.
- **Must be asked before touching the other side:** Serena's **global**
  configuration (`trusted_project_path_patterns` lives in the user's global
  `serena_config.yml`, not the project's `.serena/project.yml` — see the
  project's own `.serena/project.yml:44-46` comment) is shared by every project
  on the machine: it is consent-gated, never auto-written, and never rewritten
  beyond the additive pattern that names this project.
- **Gate obligation:** the change sits in the version-parity trigger set
  (`skills/**` + `packages/pi-agentic-workflow/**`), so the PR must bump the Pi
  package version and add its CHANGELOG companion row (feature 75 / #292).

## Non-goals

- **No consumption of LSP evidence in the review path** — the optional LSP
  evidence tier of the review evidence substrate is roadmap row 51 / issue
  #218. This unit provisions and documents the contract; it does not build the
  evidence runner.
- No per-language-server management beyond Serena's own configuration.
- No LLM key or provider configuration — Serena runs locally (issue #219
  Non-goals).
- No new schema/envelope surface, no review-pack axis change, no change to the
  triage catalog or to `unit-route.mjs`.
- No hard runtime failure when Serena is absent: the degraded path (warn +
  continue + record) stays defined and working (issue #219 scope adjustment).

## Future

none

## Assumptions (also mirrored in `decisions.md` → `## Assumptions`)

- **A1 · 2026-10-21** — the install command is the verified one:
  `uv tool install -p 3.13 serena-agent && serena init` (INV-005/INV-006), not
  the issue's "uvx preferred" wording; pi-serena discovers Serena only through
  `uv tool dir` or `SERENA_PYTHON`, so an ephemeral `uvx` env would never be
  found.
- **A2 · 2026-10-21** — MCP registration targets the **detected** platform only,
  offered inside the same consented question.
- **A3 · 2026-10-21** — the pi path needs no MCP registration: pi-serena is a
  Pi extension that "avoids configuring Pi as an MCP client".

## Future cost

- **Required substrate with a degraded path.** Every skill that may report
  LSP-backed verification must keep the warn-once-and-record fallback — binds
  the review skills and any future consumer of the LSP tier (row 51).
- **Exact-pinned dependency.** `@bacnh85/pi-serena` joins the package's
  pinned-dependency set: upgrades are deliberate `fix(deps)` PRs, never side
  effects (AGENTS.md → Packages).
- **Global-config trust.** Anything that touches Serena's global configuration
  stays consent-gated; a future provisioning step that writes it implicitly
  re-opens this rule.

## Applicable tests

Root suite `node --test scripts/*.test.mjs` (includes
`scripts/version-parity-gate.test.mjs`, `scripts/lockfile-policy`-adjacent
gates and the skill-context budget check), plus `bun run test` in
`packages/pi-agentic-workflow` (skill parity, alias coverage, bundle lifecycle),
plus the new pins this unit adds for AC1's dependency declaration. Exactly what
the `tests` triage step runs is fixed by the triage block below.

## Known pre-existing issues

- **Config half already landed (PRs #263/#264, `f55165f1`, `84db98e1`)** —
  **does-not-affect** this unit's scope: `.serena/project.yml` provisioning,
  the additive `.gitignore` block and the health-check/startup-rule contract
  are verified here as evidence rows, never rebuilt.
- **Fixed `markdown` + `json` entries (#264, CHANGELOG 3.2.0) vs AC8's
  "confine LSP evidence to TypeScript/JavaScript" (issue #219 item 4)** —
  **affects** AC7/AC8: `SERENA.md:46-51` mandates `markdown`+`json` as fixed
  entries while the scope adjustment says diagnostics claims stay TS/JS-only.
  The design step resolves this ask-don't-infer (listing a server for
  navigation vs claiming it as evidence), never by inference. Resolution:
  listing stays (navigation), evidence claims stay TS/JS — restated in AC8.
- **Trust is provisioned nowhere** — **affects** AC4: no `grep` hit for
  `trusted_project_path_patterns` outside Serena's own config comments.
- **Serena's own tooling residue in this repository** (`markdown`: marksman
  needs system `libicu` — `SERENA.md:103-110`) — **does-not-affect**: it is
  the worked example of the startup rule, not a gate this unit must repair.
- **U1 — a dependency alone may not deliver AC1.** pi installs a package's
  `dependencies` but activates only the parent's own `pi.extensions` (R4), so
  issue #219's stated mechanic ("add `@bacnh85/pi-serena` as a dependency") may
  leave the `serena_*` tools unloaded — **affects** AC1: researched into
  options at the design step's gap interview, never assumed either way.
- **U2 — the issue's `uvx` wording has no verified command.** Serena's docs
  install with `uv tool install serena-agent` and run `serena start-mcp-server`;
  the `uvx --from serena serena start-mcp-server` form was not found (R5) —
  **affects** AC2/AC3: the exact install + registration commands must be
  verified (or corrected) at design, and the issue's wording corrected in the
  step it produces.
- **U3 — trust's blast radius is narrower than the issue's phrasing.**
  `trusted_project_path_patterns` gates `activation_command`,
  `ls_specific_settings`, symlink following and project-local LS installs;
  Serena's docs do not state that an untrusted project never starts a language
  server (R5) — **affects** AC4's exact claim: verify the behaviour in this
  environment before wording the AC as "no server ever starts".
- **U4 — `execute-phase` names no insert anchor for a Progress log entry
  (found 2026-10-23)** — **does-not-affect** this unit's ACs: "append a dated
  entry" was read as end-of-file, so P2–P6's 2026-10-21 entries landed *after*
  `## References` and `unit-route.mjs` routed `next: P2` with all six phases
  complete. Repaired here (entries moved into `## Progress log`; the P6 head
  gained its documented `tests P6` phase token, same facts); the recurrence
  guard — pin "insert before `## Next`" in `execute-phase`'s wording, or a
  doc-structure test — belongs to that skill's owner, and scope growth this
  unit does not take.

## Tasks

Cut by the plan step (2026-10-21), smallest first, one phase per commit; every
AC maps to at least one phase. Final phase is verification.

- P1 — Pin the activation wiring: exact-pin `@bacnh85/pi-serena` in the pi
  package's `dependencies`, add `./node_modules/@bacnh85/pi-serena/extensions/index.ts`
  as its second `pi.extensions` entry, bump the package version with its
  CHANGELOG companion row, and pin both declarations with a new test (AC1,
  AC10). (validator: `cd packages/pi-agentic-workflow && bun run test` exits 0
  with the exact-spec and manifest-entry cases green)
  - Relevant files: packages/pi-agentic-workflow/package.json, packages/pi-agentic-workflow/bun.lock, packages/pi-agentic-workflow/test/serena-activation.test.mjs, CHANGELOG.md
- P2 — Prove the wiring loads: add `scripts/serena-activation-check.mjs`,
  which packs the package into a temp directory, installs that artifact with
  `pi install ./local/path` under a temporary agent dir, and asserts pi
  resolves the dependency's extension entry and reports its `serena_*` tools
  (AC1). (validator: `node scripts/serena-activation-check.mjs` exits 0 with
  `ACTIVATION: ok` on stdout)
  - Relevant files: scripts/serena-activation-check.mjs
- P3 — Pin watch: add `scripts/pin-watch.mjs`, reusing `evaluatePins` with an
  injectable fetcher (a drift fails the run with its report, a clean run exits
  0, an unreachable registry degrades to exit 0 with a warning), pin it with an
  offline test, and add the scheduled `pin-watch.yml` workflow — a weekly cron
  plus `workflow_dispatch` — that opens an issue when a drift is found and
  reuses the one already open (AC2). (validator:
  `node --test scripts/pin-watch.test.mjs` exits 0 with the drift, clean,
  degraded and dedupe cases green)
  - Relevant files: scripts/pin-watch.mjs, scripts/pin-watch.test.mjs, .github/workflows/pin-watch.yml
- P4 — `init-workspace` install and trust: extend `references/SERENA.md` with
  the consented tool-install contract (`uv tool install -p 3.13 serena-agent`
  plus `serena init`, `pipx` only on the MCP path, `serena -V` as the health
  reader), the detected-platform MCP registration, and the consented global
  trust append; wire it through `BOOTSTRAP_DISCOVERY.md`, `BOOTSTRAP_WRITE.md`,
  `UPGRADE.md` and `SKILL.md`, then bump `init-workspace` (AC3, AC4, AC5, AC7,
  AC8). (validator: `grep -c "uv tool install -p 3.13 serena-agent"
  skills/init-workspace/references/SERENA.md` exits 0 with a count of at least 1)
  - Relevant files: skills/init-workspace/SKILL.md, skills/init-workspace/references/SERENA.md, skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md, skills/init-workspace/references/BOOTSTRAP_WRITE.md, skills/init-workspace/references/UPGRADE.md, README.md, CHANGELOG.md
- P5 — Code-level readiness nudge:
  `packages/pi-agentic-workflow/src/routing/serena-readiness.ts` carries a
  project-keyed latch in the existing state store, runs at session start and at
  the first workflow-command dispatch, and notifies once when
  `.serena/project.yml` is missing, when it is stale, and when the recorded
  init-workspace revision changed; pins latch-once, soft failure, and that the
  project stays untouched (AC6, AC9). (validator: `cd
  packages/pi-agentic-workflow && bun run test` exits 0 with the latch-once,
  soft-failure and no-project-mutation cases green)
  - Relevant files: packages/pi-agentic-workflow/src/routing/serena-readiness.ts, packages/pi-agentic-workflow/src/routing/state.ts, packages/pi-agentic-workflow/src/extension/index.ts, packages/pi-agentic-workflow/test/serena-readiness.test.mjs
- P6 — Verification: run the whole root suite with the unit's additions in
  place, so every earlier validator still reproduces at the head (AC10).
  (validator: `node --test scripts/*.test.mjs` exits 0)
  - Relevant files: scripts/

### Planning evidence

M-sized: the ledger lives in [`planning-evidence.md`](planning-evidence.md)
(12 rows, PE-001…PE-012, cut with this plan).

### Obligations

M-sized: the ledger lives in
[`planning-obligations.md`](planning-obligations.md) (13 rows, O1…O13, all
`planned` at cut time).

## Path-protection declaration

```text
path-protection-plan@1
freeze-after: none
kind | path | justification
created | packages/pi-agentic-workflow/test/serena-activation.test.mjs | P1 pins the two AC1 declarations (exact pin + manifest entry) so neither can be dropped silently
created | packages/pi-agentic-workflow/test/serena-readiness.test.mjs | P5 pins the AC9 latch contract (once per state, soft failure, no project write)
created | scripts/serena-activation-check.mjs | P2's validator: a runnable, non-test script that proves a packed tarball registers the `serena_*` tools under a scratch pi install
created | scripts/pin-watch.test.mjs | P3 pins the AC2 watcher offline (drift, clean, degraded, dedupe) with an injected fetcher
not-created | packages/pi-agentic-workflow/src/routing/serena-readiness.ts | a source module, not a test or fixture: the shipped-default policy declares no class over `src/`
```

## Triaged steps

```text
TRIAGE — 67-serena-provisioning (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
```

Step notes (conductor):
- **research** — one web pass over the package registry, pi's own docs and
  Serena's docs; returns recorded as R3–R5 below, uncertainties routed to the
  design step's gap interview, never resolved here.
- **design** — gap interview on the researched uncertainties (activation
  mechanism, install command shape, trust scope); AC wording finalised with
  `sources.md` rows.
- **plan** — cut phases P1… with validators; ledgers in `planning-evidence.md`
  / `planning-obligations.md` (M sizing).
- **implement/tests** — one phase per `/execute-phase` turn at the `implement`
  tier; diff guard after each implement step.
- **evidence/review/docs/release** — Evidence row per AC; review verdict;
  skill/README/CHANGELOG + package bump (version-parity trigger set); PR.

## Evidence

One row per acceptance criterion: what was run, exit status/digest, observed output (≤2 lines), verified-by.

> Evidence is verified, not claimed — a reviewer re-runs it.

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| R1 | `grep -rn "trusted_project" skills/ scripts/ docs/ packages/` (tier-0 provenance, 2026-10-21) | 0 hits | no workflow surface mentions Serena trust | unit-lane (main agent) |
| R2 | `grep -n "install half" skills/init-workspace/references/SERENA.md` | 0 | `SERENA.md:128 The install half is tracked by #219.` | unit-lane (main agent) |
| R3 | `https://registry.npmjs.org/@bacnh85/pi-serena/latest` + `https://pi.dev/packages/@bacnh85/pi-serena` (fetched 2026-10-21) | HTTP 200 | v0.10.0 · pi **extension** package · `manifest.pi.extensions = ["./extensions/index.ts"]` · 22 `serena_*` tools · peers `typebox`, `pi-coding-agent` · 0 runtime deps | unit-lane research step |
| R4 | pi docs `docs/packages.md` §"Create a package"/§"Declare dependencies", `docs/mcp.md` §"Configure servers", `docs/extensions.md:195-206` (local: `/home/agent/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/docs/`) | read | a `dependencies` entry is **installed but not activated**; only the parent package's `pi.extensions` load; MCP servers come from `mcp.json` or `pi.registerMcpServer` — no manifest key ships MCP | unit-lane research step |
| R5 | `github.com/oraios/serena` README §Quick Start + `docs/02-usage/{010_installation,020_running,030_clients,050_configuration}.md` (fetched 2026-10-21) | read | canonical install `uv tool install -p 3.13 serena-agent`, run `serena start-mcp-server`; `uvx --from serena …` **not found** in Serena docs; `trusted_project_path_patterns` is a **global** `serena_config.yml` key, new configs default `[]` | unit-lane research step |
| AC1 | `cd packages/pi-agentic-workflow && bun run test` (P1) | 0 · 435 pass / 0 fail | `AC1: @bacnh85/pi-serena is an exact pin in dependencies` · `AC1: the manifest loads the dependency's extension entry` · `AC1: the shipped entry points still load this package's own extension` | execute-phase (main agent) |
| AC1 | `node scripts/serena-activation-check.mjs` (P2) | 0 | `ACTIVATION: ok` · `dependency: @bacnh85/pi-serena@0.10.0 (installed from the packed artifact)` · `serena_* tools registered: 20 (required 5 present)` | execute-phase (main agent) |
| AC1 | same check against a manifest carrying only the package's own extension entry (negative control, P2) | 1 | `ACTIVATION: failed — tools-not-registered` · `registered: (none)` — the check is not vacuous | execute-phase (main agent) |
| AC2 | `node --test scripts/version-parity-gate.test.mjs` (P1, uncommitted-tree fail-open) | 0 · 22 pass / 0 fail | `changedFilesSince unions the uncommitted tree into the committed range` — red before the fix (returned `[]`), green after | execute-phase (main agent) |
| AC2 | `node --test scripts/pin-watch.test.mjs` (P3) | 0 · 20 pass / 0 fail | `drift: a published version above the pin is a finding naming both versions` · `dedupe: an already-open issue is reused, never opened twice` · `the workflow runs on a weekly schedule and by hand` · `the workflow may write issues and runs the filing path` | execute-phase (main agent) |
| AC2 | same suite against a workflow stripped of `schedule`, `issues: write` and `--file-issues` (negative control, P3) | 1 · 2 fail | `the schedule carries no cron expression` · `without issues: write the job cannot open the tracking issue` — the AC's two FAIL conditions are machine-checked | execute-phase (main agent) |
| AC2 | `node scripts/pin-watch.mjs --check` (P3, live registry) | 1 | `exact pins checked: 4` · `drift: @gtrabanco/pi-agentic-workflow · @gtrabanco/agentic-workflow-schema 4.6.0 → 4.7.0` · `drift: @gtrabanco/agentic-workflow · typebox 1.3.7 → 1.4.3` · `VERDICT: DRIFT` | execute-phase (main agent) |
| AC3 | `grep -c "uv tool install -p 3.13 serena-agent" skills/init-workspace/references/SERENA.md` (P4, O4) | 0 · 1 | `uv tool install -p 3.13 serena-agent`, then `serena init` | MCP path only: `pipx install serena-agent` — and the consent sentence: **"Ask ONCE**, with the whole set in the question: the tool install, the MCP registration for **the detected platform only**, and the global trust append" · **"On no** — install nothing, register nothing, write nothing." | execute-phase (main agent) |
| AC4 | `grep -c "Degraded path" skills/init-workspace/references/SERENA.md` (P4, O5) | 0 · 1 | `Serena unavailable — no tool, no installer (uv, pipx), or a refused consent → warn once, continue, and record the absence with its reason` · `Never block a run on it` | execute-phase (main agent) |
| AC5 | `grep -c "trusted_project_path_patterns" skills/init-workspace/references/SERENA.md` (P4, O6) | 0 · 1 | `On yes — append **one pattern naming this project root**. Never rewrite, reorder or reformat any other line` · `On no — record the untrusted state as the health-check residual` | execute-phase (main agent) |
| AC7 | `grep -c "Language server status" skills/init-workspace/references/SERENA.md` (P4, O7) | 0 · 2 | `verifying Language server status: initialized for every language in language_servers` · `an absent check is a residual, never a silent pass` | execute-phase (main agent) |
| AC8 | `grep -c "deterministic script" skills/init-workspace/references/SERENA.md` (P4, O8) | 0 · 2 | `LSP evidence itself stays confined to TypeScript/JavaScript: a diagnostic from any other listed server is navigation aid, never verification evidence` · `Document verification … stays a deterministic script's job` | execute-phase (main agent) |
| AC10 | `node --test scripts/normative-drift.test.mjs` + `bun scripts/check-skill-context.mjs` (P4, O13) | 0 · 18 pass / 0 fail · PASS context budgets: 28 skills | `init-workspace` 4.1.0 frontmatter = its CHANGELOG row; reference ceiling re-based to 2759 with the reason declared in `referenceSources` | execute-phase (main agent) |
| AC9 | `cd packages/pi-agentic-workflow && bun run test` (P5, O10) | 0 · 452 pass / 0 fail (17 new) | `AC9: a missing config is announced once, then latched` · `AC9: the latch is recorded in the package's own global state file` · `AC9: a changed init-workspace revision is announced once` · `AC9: an unpersistable latch is soft — one message per session, never an error` · `AC9: the first command dispatch announces the nudge, the second does not` | execute-phase (main agent) |
| AC6 | `grep -rn "writeFile" packages/pi-agentic-workflow/src/routing/serena-readiness.ts` (P5, O9) | 1 · no output | the module has no write path at all; `.serena` appears only as a read (`readFileSync`), and `AC6: checking leaves the project byte-identical` pins it | execute-phase (main agent) |
| AC1 | `packages/pi-agentic-workflow/README.md` §"Serena (ships by default)" (P5) | read | documents the two declarations that ship, the required one-time `/init-workspace`, the nudge, and pi's own off switch (`pi config` / the `packages` resource filter) | execute-phase (main agent) |
| AC10 | `cd packages/pi-agentic-workflow && bun run test:node` + `node --test scripts/*.test.mjs` (P5) | 0 · 452 pass / 0 fail · root suite 796/0 | the node fallback and the root suite both green at the head after the code change | execute-phase (main agent) |
| AC10 | `node --test scripts/*.test.mjs` (P6, whole-unit verification at the head) | 0 · 796 pass / 0 fail | every earlier phase's validator reproduces: `pin-watch` 20/0, `version-parity-gate` 22/0, `normative-drift` 18/0, `unit-doc-contract` 7/0 | execute-phase (main agent) |
| AC10 | `cd packages/pi-agentic-workflow && bun run test` and `bun run test:node` (P6) | 0 · 452 pass / 0 fail each | the bun gate and the node fallback agree at the head; `cd packages/agentic-workflow && bun run test` / `test:node` give 216/0 and 217/0 (the 5 CI-order failures were a missing `bun install` in `packages/agentic-workflow`, not a defect — reproduced green after install) | execute-phase (main agent) |
| AC1 | `node scripts/serena-activation-check.mjs` (P6, re-run at the head) | 0 | `ACTIVATION: ok` · `serena_* tools registered: 20 (required 5 present)` | execute-phase (main agent) |
| AC10 | `bun scripts/check-skill-context.mjs` + `node scripts/version-parity-gate.mjs --content --base main` (P6) | 0 · PASS | `PASS context budgets: 28 skills` · `content parity holds: version 0.26.0 → 0.29.0, companion row present` | execute-phase (main agent) |
| AC10 | `node scripts/version-parity-gate.mjs --content --base main` (P1) | 0 | `changed files: 13, triggered: 3` · `content parity holds: version 0.26.0 → 0.27.0, companion row present` | execute-phase (main agent) |
| AC6 | config half re-run (verification-only, PRs #263/#264): `grep -n language_servers .serena/project.yml` + `grep -n serena .gitignore` | 0 | `.serena/project.yml:41 language_servers:` → `typescript, bash, markdown, yaml, json` · `.gitignore:19-23` `**/.serena/` + `!.serena/` + `!.serena/project.yml` — additive carve-out, project config still versioned | unit-lane (evidence step) |
| AC7 | config half re-run (verification-only): `grep -n "Language server status: initialized" skills/init-workspace/references/SERENA.md` + `sed -n '98,107p' …SERENA.md` | 0 | `SERENA.md:90 … verifying Language server status: initialized for every language` · startup rule: a failing entry is removed from `language_servers` and recorded as a residual | unit-lane (evidence step) |
| AC3/AC4/AC5/AC7/AC8 | the five P4 greps re-run at the head (`uv tool install -p 3.13 serena-agent`, `Degraded path`, `trusted_project_path_patterns`, `Language server status`, `deterministic script` over `SERENA.md`) | 0 · 1 / 1 / 1 / 2 / 2 | identical counts to the P4 rows — the skill text is unchanged at the head | unit-lane (evidence step) |
| AC1 | `node scripts/serena-activation-check.mjs` (evidence step, re-run at head `34e41621`) | 0 | `ACTIVATION: ok` · `serena_* tools registered: 20 (required 5 present)` | unit-lane (evidence step) |
| AC2 | `node --test scripts/pin-watch.test.mjs` (evidence step, re-run) | 0 · 20 pass / 0 fail | drift, clean, degraded and dedupe cases green, with the shipped workflow wiring pinned | unit-lane (evidence step) |
| AC6 | `grep -rn "writeFile" packages/pi-agentic-workflow/src/routing/serena-readiness.ts` (evidence step, re-run) | 1 · no output | no write path in the nudge module; `.serena` appears only as a read | unit-lane (evidence step) |
| AC10 | `node --test scripts/*.test.mjs` (evidence step, re-run at head `34e41621`) | 0 · 796 pass / 0 fail | root suite green at the head with the repaired unit doc | unit-lane (evidence step) |
| AC10 | `cd packages/pi-agentic-workflow && bun run test` (evidence step, re-run) | 0 · 452 pass / 0 fail | package suite green at the head | unit-lane (evidence step) |
| AC10 | `node scripts/version-parity-gate.mjs --content --base main` + `bun scripts/check-skill-context.mjs` + triage-block diff (evidence step) | 0 · PASS · PASS · clean | `content parity holds: version 0.26.0 → 0.29.0, companion row present` · `PASS context budgets: 28 skills` · `TRIAGE BLOCK CLEAN` | unit-lane (evidence step) |

## Review

Step run 2026-10-23 (tier: strong) against head `528b4054`, working tree clean.

### Review pack axes (step: review)

| Axis | Run? | How / why not |
|---|---|---|
| `review-verify` (run the gate, confirm real behavior) | yes | every Evidence row re-run at the head — exit codes listed in the verdict block below |
| `review-code` (correctness, consistency, duplication, simplification) | yes | all 31 changed files swept against Impact's `Touches` list; nudge module has no write path (`grep -rn "writeFile" …serena-readiness.ts` → exit 1); both test edits are additive — alias-coverage's expectation gained `session_start` (stricter, not weakened), version-parity-gate gained the dirty-tree case |
| `review-security` | yes | `pin-watch`'s only write is `gh issue create` behind the workflow's lone `issues: write`; no token/secret read anywhere; the global `serena_config.yml` append stays consent-gated (AC5 grep) |
| `review-perf` | n/a | no hot path: the nudge is latched once-per-state at session start / first dispatch, soft on failure |
| `review-a11y` / `review-design` / `review-seo` | n/a | no UI, no route, no public web surface |
| `review-brand` | n/a | no end-user-facing copy — skills and READMEs are agent/operator-facing |
| `review-debt` | n/a | no fix-now debt item; the two live pin drifts are pre-existing and routed to a deliberate `fix(deps)` PR (P3 record) |

### Review verdict (step: review, cycle 1)

```text
REVIEW-VERDICT: PASS
- Findings: 0 material, 3 report-notes
- Evidence reproduced: yes — every row re-run at head 528b4054: needs-input
  `Pending: none`; triage block clean; root suite 796/0; package suite 452/0
  (bun); `ACTIVATION: ok` (20 serena_* tools); pin-watch suite 20/0;
  version-parity PASS (0.26.0 → 0.29.0); context budgets PASS 28; P4 greps
  1/1/1/2/2; `writeFile` grep exit 1; config-half greps green; phase-lint 6/6
  (fingerprint 6897a7af…, matches plan time); promise-coherence `verdict PASS`
- AC integrity: `## Acceptance criteria` sha256
  `5cdc1fde77c7651c50ac5ce05393a54d2c9c662bba66c5565bdce2ce1abb172b`
  identical from the plan commit `41cc53ce` (where the AC1–AC10 wording froze)
  through the working tree — no AC changed once implementation began. No hash
  was recorded at triage itself; the triage-time section predates the
  design/plan wording finalisation the template prescribes (2191518b… at
  `81fc1e7d`, db46c957… at design close `52bc7e0f`), so the plan commit is the
  comparison anchor and it holds unaltered
```

Report-notes (informational — none blocks):

- **N1 → docs step**: Impact's `Touches` list omits
  `scripts/version-parity-gate.mjs` and its test — P1's fail-open fix,
  recorded in the Progress log but never added to the Impact surface list.
- **N2**: the P5 diff-guard exception's `693 lines / 10 files` is a
  point-in-time measurement; the same base re-measured at the current head
  reads `828 / 10`, the delta being the P6, evidence and progress-doc commits
  that land after P5. No number was wrong when recorded, and nothing was
  removed to fit the budget.
- **N3**: `node scripts/pin-watch.mjs --check` still exits 1 on the two
  pre-existing drifts (schema `4.6.0 → 4.7.0`, typebox `1.3.7 → 1.4.3`) —
  expected, out of scope, already routed to a deliberate `fix(deps)` PR at P3.

Scope sweep confirmed: 20 commits, all conventional subjects, no commit on
`main`, no `.es.md` sibling, clean tree, every changed file declared in Impact
or the unit's own record (N1 is the one omission, routed above).

## Progress log

`YYYY-MM-DD HH:MM — <what was done> → <commit sha or evidence> — next: <what is next>`

- 2026-10-21 22:20 — unit doc created from `_TEMPLATE/SPEC.md` for issue #219
  (feature, scope `medium` per roadmap row 67's `(M)`); tier-0 provenance greps
  recorded as R1–R2 → evidence in this doc — next: triage (`bun
  scripts/unit-route.mjs --triage 67-serena-provisioning`).
- 2026-10-21 22:24 — triage ran and is pasted verbatim under
  `## Triaged steps` (9 steps, none skipped, budget strong) → evidence in this
  doc — next: research step.
- 2026-10-21 22:30 — research step: one web pass (pi package registry + pi
  docs + Serena docs + the pi-serena tarball); R3–R5 recorded under Evidence,
  U1–U3 uncertainties recorded under Known pre-existing issues → `81fc1e7d` —
  next: design step.
- 2026-10-21 22:40 — design stages 1–3: `sources.md` (INV-001…INV-019), orient
  tiers + cost verdicts, and the batched `open-questions@1` block (Q1–Q4) in
  `decisions.md`; `node scripts/needs-input.mjs docs/features/67-serena-provisioning`
  exits 0 with 4 pending questions → evidence: needs-input block — next: the
  owner answers Q1–Q4 (gap interview), then design stage 4 (decide) and the
  plan step.
- 2026-10-21 23:05 — gap interview round 1 (ask form `81f1be20`): Q4 decided
  **A** (D4); Q1–Q3 re-explained, Q2's feasibility question opened as Q5 →
  `6fb0c88d` — next: round 2.
- 2026-10-21 23:20 — design stage 4 (decide): D1 (activation = dependency +
  `node_modules` extension entry, exact pin + scheduled pin-watch action), D2
  (init-workspace is the only config writer), D3 (no settings toggle), D5
  (code-level readiness nudge); AC1–AC10 finalised, `BRIEF.md` written,
  `needs-input` exits 0 with **Pending: none** → evidence: needs-input block —
  next: plan step.
- 2026-10-21 23:55 — plan step: 12 `CLAIM-*` rows swept (0 `contradicts`), six
  phases P1–P6 cut with per-phase validators, ledgers frozen in
  `planning-evidence.md` (PE-001…PE-012) and `planning-obligations.md`
  (O1…O13, all `planned`); roadmap row 67 `idea → planned`; `phase-lint`
  6/6 PASS → evidence: `phase-lint` fingerprint
  `6897a7af29f95d8070efd8989e7166e48af4ca9415d8dce588178418ca553bd5` — next:
  `/execute-phase 67-serena-provisioning P1`.
- 2026-10-21 — execute P1 base ref `41cc53ce` (git rev-parse HEAD at step entry).
  **Gate 1 (path-protection) initially REJECTED — `malformed-declaration`:** the
  unit doc carried no `path-protection-plan@1` block, and P1 creates
  `packages/pi-agentic-workflow/test/serena-activation.test.mjs` (class
  `test-file`, `freeze: true`, pre-freeze `create` → `undeclared-test`). The
  declaration was added under a new `## Path-protection declaration` section
  (four `created` rows — the P1/P2/P3/P5 test+tools files — and one
  `not-created` row for the P5 source module); the gate now returns
  `PATH-GUARD pass — clean`, checked 7. The triage block is unchanged and still
  diffs clean against `unit-route.mjs --triage`.
- 2026-10-21 — implement P1 (pin the activation wiring), red-first:
  `test/serena-activation.test.mjs` (3 cases) ran **red 3 fail / 0 pass** before
  any manifest edit; then `bun add --exact @bacnh85/pi-serena@0.10.0` (lockfile
  delta: one new package key, three nested `typebox` keys collapse into one
  hoisted pin at the already-resolved `1.3.27`) and the second `pi.extensions`
  entry `./node_modules/@bacnh85/pi-serena/extensions/index.ts`; package
  `0.26.0 → 0.27.0` with its CHANGELOG companion row. **Defect found and fixed
  in `scripts/version-parity-gate.mjs`:** `--content` diffed `main...HEAD` only,
  so the gate reported `triggered: 0 — nothing to enforce` for a tree whose
  `skills/**` + `packages/pi-agentic-workflow/**` edits were still uncommitted —
  it failed open exactly where it exists to enforce the bump. `changedFilesSince`
  now unions the committed range with `git status --porcelain`, pinned by a new
  case in `scripts/version-parity-gate.test.mjs` (red first: it returned `[]`).
  Gates: package suite 435/0, root suite `node --test scripts/*.test.mjs` 776/0,
  `--content` PASS → commit `406ce8a7` — next: P2.
- 2026-10-21 — **diff-guard exception, P1** (established pattern): BREACH at
  541 lines > 400 / 13 files > 8 measured from the unit base `81fc1e7d`, which
  counts the four planning-ledger commits the plan step itself landed
  (`BRIEF.md`, `sources.md`, `decisions.md`, `planning-evidence.md`,
  `planning-obligations.md` — ~420 lines nobody in P1 wrote). P1's own delta from
  its recorded base `41cc53ce` is 107 lines / 6 files — inside both limits. An
  honest split was considered and rejected: the dependency pin and its manifest
  entry are two halves of one contract (either alone is the no-op AC1 forbids),
  and the gate fail-open is what surfaced while validating the bump. Real count,
  no gaming — no comment, blank line, doc or test was removed to shrink it.
  Exception recorded; the phase stands.

- 2026-10-21 — execute P2 base ref `d8e35ca1`. **Gate 1 (path-protection)
  passed at entry** (`PATH-GUARD pass — justified`, checked 8): the P1
  `justification` record was re-attached from P1 to P2, because the guard scopes
  records by phase and the P2 range is what carries the gate repair.
- 2026-10-21 — implement P2 (prove the wiring loads):
  `scripts/serena-activation-check.mjs` copies the package into a scratch tree,
  builds `dist/` there and stages the skill bundle with the package's own
  bundler, `npm pack`s the copy, `npm install --omit=dev`s the artifact, runs
  `pi install <dir>` against a temp `PI_CODING_AGENT_DIR`, and boots a real Pi
  session (SDK, `SessionManager.inMemory()`) to read the extension runner's
  registered tools. Result: **`ACTIVATION: ok`** — `@bacnh85/pi-serena@0.10.0`
  installed from the packed artifact, **20 `serena_*` tools registered**
  (required 5 present). Negative control (manifest reduced to the package's own
  entry, restored afterwards) prints `ACTIVATION: failed — tools-not-registered
  … registered: (none)`, so the check cannot pass vacuously. Three
  environment facts it had to encode: `tsc` is the package's devDependency (not
  on PATH), the staged copy needs a tsconfig whose `typeRoots`/`paths` point
  back at the installed toolchain and **no `baseUrl`** (npm rewrites
  host-provided bare specifiers into relative paths that pi's module mapping
  cannot resolve), and `pi install` must see the same `PI_CODING_AGENT_DIR` as
  `pi list`/the session. Gates: root suite 776/0, package suite 435/0,
  `diff-guard` 209 lines / 8 files ≤ 400/8 → PASS → `5b7b7389` — next: P3.
- 2026-10-21 — execute P3 base ref `308202ae`. **Gates at entry:** path-protection
  `PATH-GUARD pass — clean` (checked 1); phase-lint 6/6 PASS; triage block diffs
  clean. Authoring `scripts/pin-watch.test.mjs` then editing it tripped the Tier 2
  preventive guard (`test-file` class) — a P3 `justification` record was added to
  `decisions.md` rather than lowering the policy.
- 2026-10-21 — implement P3 (pin watch): `scripts/pin-watch.mjs` reuses the PR
  gate's own `evaluatePins` (never a second implementation of the rule), loops
  every package that declares exact pins (`packages/pi-agentic-workflow` +
  `packages/agentic-workflow`, PE-012/A4), and adds the dedupe layer the gate
  does not need: `issueFor` renders one issue naming the package and both
  versions, `planIssues` reuses an open issue carrying the same
  `<package>/<dependency>` marker — including when the published version moved
  again, since the operator is already tracking that dependency. `--check` exits
  1 on drift, 0 clean, **0 with a warning when the registry is unreachable**
  (a network blip must not redden a scheduled run no commit caused — the rule the
  PR gate's `--pins` half already follows). `--file-issues` exits 1 only when it
  opened a *new* issue, so a weekly job that re-files a known drift stays green.
  `.github/workflows/pin-watch.yml` runs it Mondays 06:17 UTC (off the :00
  stampede) plus `workflow_dispatch`, with `issues: write` as the only write.
  Offline suite `scripts/pin-watch.test.mjs` (20 cases, injected fetcher and
  injected open-issue list, no network) also pins the *shipped wiring* — AC2's
  "FAIL if the schedule or the issue-creation path is missing" is machine-checked;
  the negative control (workflow stripped of all three) fails 2 cases.
  **Live finding, out of scope and not widened:** the watch reports two real
  pre-existing drifts — schema `4.6.0 → 4.7.0` and typebox `1.3.7 → 1.4.3`. The
  CHANGELOG's 0.26.0 row already schedules the schema/runner pin move for a
  separate `fix(deps)` PR; per AGENTS.md → Packages that upgrade stays a
  deliberate human PR, so this unit neither bumps it nor files an issue for it.
  Gates: root suite 796/0, `pin-watch` suite 20/0, package suite unaffected
  → `692a5a12` — next: P4.
- 2026-10-21 — **diff-guard exception, P3**: BREACH at 702 lines > 400 (files 4
  ≤ 8) measured from P3's base `308202ae`. The overage is the AC2 surface itself
  — the watcher (285), its offline suite (353, twenty cases covering drift, clean,
  degraded, dedupe and the shipped workflow wiring) and the scheduled workflow
  (63) — and every line is doc comment, assertion or YAML comment. An honest
  split was considered: the natural cut is module+tests in one commit and the
  workflow in another, but the phase's own validator is
  `node --test scripts/pin-watch.test.mjs`, whose new wiring cases read the
  workflow file — so splitting would leave one commit red, which is forbidden.
  Shrinking is forbidden (no comment, blank line, doc or test removed to fit the
  number). Real count reported; exception recorded; the phase stands.
- 2026-10-21 — execute P4 base ref `692a5a12`. **Gates at entry:** path-protection
  `PATH-GUARD pass — clean` (checked 1); phase-lint 6/6 PASS.
- 2026-10-21 — implement P4 (`init-workspace` install and trust): `SERENA.md`
  stops deferring the tool half ("The install half is tracked by #219" is gone)
  and owns it — one consent question covering the install routes
  (`uv tool install -p 3.13 serena-agent` + `serena init`; `pipx install
  serena-agent` **MCP path only**, because pi-serena discovers Serena through
  `uv tool dir`/`SERENA_PYTHON` and an ephemeral `uvx` env would never be
  found), the **detected platform's** MCP registration from a five-row table
  (Claude Code `claude mcp add …`, `.vscode/mcp.json`, `.cursor/mcp.json`,
  JetBrains `mcp.json`, `~/.codex/config.toml` — each shape verified against
  Serena's own `030_clients.md`, not invented), and the consent-gated append to
  the global `trusted_project_path_patterns` (append-only: one pattern naming
  this root, no other line ever rewritten). Adds the fixed `SERENA PROVISIONING`
  report and the rule that an absent health check is a residual, never a silent
  pass. Wired through `BOOTSTRAP_DISCOVERY.md` (the three detection facts the
  question is built from), `BOOTSTRAP_WRITE.md` step 8, `UPGRADE.md` step 8
  (additive-only preserved), `SKILL.md` (guardrail, turn-contract box, `Done
  when`) and the root `README.md` blurb. `SKILL_CONTEXT_BUDGETS.json` re-bases
  `init-workspace`'s `referenceEstimateMax` to 2759 with the reason declared in
  `referenceSources` — measured 2590 est / 217 lines; `SKILL.md` stays inside its
  existing ceiling (3384/237 vs 3663/252, no re-base needed). Bumps:
  `init-workspace` 4.0.3 → **4.1.0** with its CHANGELOG row, and the Pi package
  0.27.0 → **0.28.0** with its re-bundle row (the `skills/**` trigger set).
  Gates: root suite 796/0, `normative-drift` 18/0, context budgets PASS 28,
  `version-parity --content` PASS → `7178243e` — next: P5.
- 2026-10-21 — **diff-guard exception, P4** (file-count only, the feature-65
  pattern): 251 lines (**within** the 400 budget) but **10 files > 8** — and the
  phase's own `Relevant files:` list names 7 of them. The rest are structural,
  not scope creep: `packages/pi-agentic-workflow/package.json` + `CHANGELOG.md`
  are the version-parity trigger set the `skills/**` change *requires* in the
  same PR, `docs/workflow/SKILL_CONTEXT_BUDGETS.json` carries the declared
  reference re-base, and the unit doc is the evidence/progress record. One
  coherent contract (Serena provisioning = one consent question) spanning the
  skill, its four references and the surfaces that publish it; splitting it
  would ship a skill whose reference and SKILL.md disagree. No honest reduction;
  shrinking is forbidden. Real count reported; exception recorded; the phase
  stands.
- 2026-10-21 — execute P5 base ref `7178243e`. **Gates at entry:** path-protection
  `PATH-GUARD pass — clean`; phase-lint 6/6 PASS.
- 2026-10-21 — implement P5 (code-level readiness nudge), red-first:
  `test/serena-readiness.test.mjs` ran red (`Cannot find module
  ../dist/routing/serena-readiness.js`) before the module existed. Then
  `src/routing/serena-readiness.ts` (tolerant `language_servers` reader →
  `missing` | `stale` | `outdated` | `ready` → one message naming
  `/init-workspace`; **no write path at all**), the latch as a third key
  (`serenaReadiness`, keyed by project root) in the existing global state file
  beside the first-run hint (`read-merge-write`, soft on every failure), and the
  two entry points sharing one gate: `session_start` in the adapter and the first
  workflow-command dispatch in `factory.ts`. **Two defects the suite caught and
  the fix addressed, not the assertion:** (a) the gate delegated the latch
  decision to the pure evaluator, which ignores the recorded state — so a missing
  config was announced on every session; the gate now compares state *kinds*
  (`missing`/`stale`/`outdated` vs the recorded one) and still latches `ready` so
  a later upgrade has a baseline; (b) the dispatch-path case needed the real
  config merge, not a hand-written stub, because the router reads fields the stub
  omitted. `test/alias-coverage.test.mjs`'s lifecycle-event list gained
  `session_start` — the shipped event surface legitimately grew with AC9, and the
  expectation now says why. Also closes AC1's fourth leg, which P1 left open: the
  package README gains §"Serena (ships by default)" documenting what ships,
  the required one-time `/init-workspace`, the nudge, and pi's own off switch
  (`pi config` / the `packages` resource filter). Bumps the Pi package
  0.28.0 → **0.29.0** with its CHANGELOG row. Gates: package suite 452/0 under
  bun **and** node, root suite 796/0, `version-parity --content` PASS
  → `f0da06d6` — next: P6.
- 2026-10-21 — **diff-guard exception, P5**: BREACH at 693 lines > 400 / 10 files
  > 8 from P5's base `7178243e`. The overage is the phase's shape, not scope
  creep: the red-first suite is ~330 lines of the 693 (17 cases — latch-once,
  restart, degrade-after-ready, changed revision, soft failure, the dispatch
  path, and the no-project-mutation contract AC6 requires), the module is ~200
  with the doc comments this repo requires, and the remaining files are the
  version-parity trigger set the `packages/pi-agentic-workflow/**` change
  *requires* in the same PR (`package.json` + `CHANGELOG.md`) plus the README
  that closes AC1 and the unit doc. An honest split was considered and rejected:
  the module, its store and its two wiring points are one contract (a nudge that
  fires at session start but not at dispatch is a bug, and pinning only one entry
  point would ship exactly that), and splitting the README into a separate step
  would not reduce a count measured from the phase base. Shrinking by deleting
  tests or comments is forbidden. Real count reported; the phase stands.
- 2026-10-21 — execute P6 base ref `f0da06d6`. **Gates at entry:** path-protection
  `PATH-GUARD pass — clean` (checked 0 — the phase is verification, no source edit).
- 2026-10-21 — tests P6 — **verification phase, run at the head** (`f0da06d6`):
  root suite `node --test scripts/*.test.mjs` **796/0**; Pi package suite
  `bun run test` **452/0** and `test:node` **452/0**; crate suite
  `packages/agentic-workflow` **216/0** (bun) and **217/0** (node);
  `scripts/serena-activation-check.mjs` → `ACTIVATION: ok`, 20 `serena_*` tools
  from the packed artifact; `scripts/pin-watch.mjs --check` → exit 1 with the two
  real drifts recorded at P3; `check-skill-context` **PASS 28 skills**;
  `version-parity-gate --content --base main` **PASS** (0.26.0 → 0.29.0);
  phase-lint **PASS**; the triage block still diffs clean against
  `unit-route.mjs --triage`. Every earlier validator reproduces.
  **One environment finding, not a defect:** the crate suite first reported 5
  failures with `Cannot find package 'typebox'` — `packages/agentic-workflow` had
  no `node_modules` in this checkout. `bun install --frozen-lockfile` (the step
  `root-suite.yml` runs before the crate) makes it 216/0. Recorded because a red
  gate must never be dismissed as "probably the environment" without proof, and
  the proof here is both directions: red before the install, green after, with
  the failure naming a missing module rather than a failing assertion.
  → `6cef364c` — next: the lane resumes (review, release, docs).


- 2026-10-23 14:24 — evidence step: **repaired the Progress log itself first**
  — the P2–P6 entries (2026-10-21) had been appended *after* `## References`,
  so `unit-route.mjs` routed `next: P2` with six phases complete; the entries
  are now inside `## Progress log`, the P6 head carries its documented
  `tests P6` phase token (facts unchanged), and the anchor gap is recorded as
  **U4** above. Evidence rows added for the config-half verification-only items
  and for a full re-run at the head `34e41621`: root suite **796/0**, package
  suite **452/0**, activation check `ACTIVATION: ok` (20 `serena_*` tools),
  `pin-watch` 20/0, version-parity PASS (0.26.0 → 0.29.0), context budgets PASS
  28, triage block still diffs clean → evidence in this doc — next: review step
  (`REVIEW-VERDICT` per `references/REVIEW.md`).
- 2026-10-23 14:47 — review step: every evidence row re-run at head
  `528b4054` (needs-input `Pending: none`, triage clean, root 796/0, package
  452/0, `ACTIVATION: ok` 20 tools, pin-watch 20/0, version-parity PASS,
  budgets PASS 28, P4 greps 1/1/1/2/2, `writeFile` exit 1, phase-lint 6/6 at
  the plan fingerprint, promise-coherence PASS); AC-section sha256
  `5cdc1fde…` unchanged from the plan commit `41cc53ce` to the tree; axes
  table + verdict written — **REVIEW-VERDICT: PASS** (0 material, 3
  report-notes; N1 routed to the docs step) → evidence: `## Review` above —
  next: docs step.
- 2026-10-23 15:42 — docs step: folded review report-note N1 into Impact's
  `Touches`, which now names every touched surface (pin-watch runner + test,
  `serena-activation-check.mjs`, the `version-parity-gate` fail-open fix +
  test, `SKILL_CONTEXT_BUDGETS.json` re-base) — the review's scope sweep had
  under-counted the omissions at one; repaired the drifted Known-issues
  citation `SERENA.md:34-40` → `:46-51`. **AC8's `SERENA.md:118-121` pointer
  drifted too (the text now sits at 125-128) but the AC section stays
  byte-identical** — editing it after the review would falsify the recorded
  AC-integrity hash, and the requirement itself was verified by grep; recorded
  here instead of in the frozen section. CHANGELOG rows (0.27/0.28/0.29 +
  init-workspace 4.1.0) and both READMEs verified current; no template or
  documentation-map change is demanded (no new artifacts) → evidence: this
  entry — next: release step.
- 2026-10-23 15:44 — release step: Future sweep = **none** (the section says
  `none` — nothing to resolve); obligation rows **O1–O13 → `verified`** (every
  validator re-ran this session, promise-coherence `verdict PASS` at the head);
  branch pushed, **PR [#313](https://github.com/gtrabanco/agentic-workflow/pull/313)**
  opened against `main` with the Evidence section as its verification record
  (`Closes #219`); roadmap row 67 `planned → done · [#313]` — the
  `planned → in-progress` transition that `execute-phase` never performed is
  settled here in one step, recorded rather than replayed; References carries
  Closes/PR/Branch/Commit → evidence: PR #313 — next: receipt stage
  (`bun scripts/review-receipt.mjs verify --pr 313`).

## Next

Receipt **current** at `16420012` (`bun scripts/review-receipt.mjs verify
--pr 313` → exit 0, driven by unit 78's coded loop) and `/audit-pr` has run:
**BLOCKED on one blocker** — the CI `dependency-pin-gate` fails on the
pre-existing pin drift (schema `4.6.0 → 4.7.0`, typebox `1.3.7 → 1.4.3`,
recorded out-of-scope at P3). Clear that blocker (owner decision: a
`fix(deps)` bump or in-PR), push the new head, then re-run `/audit-pr` for
the merge-ready comment.

## References

- Closes [#219](https://github.com/gtrabanco/agentic-workflow/issues/219)
- PR: https://github.com/gtrabanco/agentic-workflow/pull/313
- Branch: `feat/219-serena-mcp-provisioning`
- Commit: `61bb65b0` (head when the PR opened; the release commit follows on
  the same branch)
- Issue [#219](https://github.com/gtrabanco/agentic-workflow/issues/219) — the
  request, its 2026-09-24 scope adjustment (refs #260).
- `docs/features/ROADMAP.md:77` — row 67 `serena-provisioning` (M).
- `skills/init-workspace/references/SERENA.md` — the landed project-config
  contract (owner); `skills/init-workspace/SKILL.md:92-95,125-127,218-221`.
- PRs #263 / #264 / #261 — config half and `.gitignore` correction.
- `packages/pi-agentic-workflow/package.json`, `README.md` — the pi path's
  current surface.
- Row 51 / issue #218 — the consumer of the LSP evidence tier (out of scope).
