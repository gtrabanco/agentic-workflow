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
adjustment). Design step finalises wording and cites each AC in `sources.md`.

1. **pi path present by default.** `packages/pi-agentic-workflow/package.json`
   declares `@bacnh85/pi-serena` as a dependency (exact pin, per the package's
   pinned-dependency rule in `AGENTS.md` → Packages), a test pins that
   declaration so it cannot be dropped silently, and the package README
   documents what the dependency gives the user. FAIL if the dependency or its
   pin test is absent.
2. **Consented tool install (non-pi path).** In a bare repository where
   `uv`/`uvx` is detected, `init-workspace` asks **one** consented question
   offering the Serena install + MCP registration; on yes it installs
   (`uvx` preferred, `pipx` fallback) and registers the MCP server for the
   detected platform, then reports exactly what was installed and registered;
   on refusal it installs/registers nothing and records the absence as a
   residual, still exiting cleanly. FAIL if anything is installed, written or
   registered without that yes.
3. **Fallback and absence never block.** With neither `uv`/`uvx` nor `pipx`
   available, the step offers nothing it cannot perform and records the
   residual with the reason; `init-workspace` completes either way.
4. **The fresh clone can start a server (trust).** The provisioning flow
   detects that the project is not covered by Serena's
   `trusted_project_path_patterns`, asks consent before touching the user's
   global Serena configuration, and either trusts the project or records the
   untrusted state as the reason the health check failed — never a silent
   no-server run. FAIL if the global config is written without consent.
5. **Fail-closed at the claim.** The provisioning report records the health
   check result per listed language server (`Language server status:
   initialized`), names the offending entry when one fails, and drops a
   failing entry per the startup rule (`SERENA.md:96-110`). A run never claims
   LSP evidence it did not verify; a degraded run warns once and records the
   absence in the unit's Evidence. FAIL on a silent pass.
6. **LSP is confined to what it can do.** Diagnostics/evidence claims are
   confined to TypeScript/JavaScript — this Serena has no markdown/yaml/json
   server and `.yml` diagnostics came back as TypeScript false positives
   (verified 2026-09-24, issue #219 item 4). Document verification stays a
   deterministic script's job (`SERENA.md:118-121`).
7. **The suites stay green and the package ships its bump.** Root suite
   `node --test scripts/*.test.mjs` and `bun run test` in
   `packages/pi-agentic-workflow` both exit 0, and the touched-surface version
   parity gate passes (pi package version bump + CHANGELOG companion row in
   the same PR — `AGENTS.md` → Packages, feature 75 / #292). FAIL on a red
   gate or a missing bump/row.

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
  src, test), `skills/init-workspace/` (SKILL.md + `references/SERENA.md`,
  `BOOTSTRAP_DISCOVERY.md`, `BOOTSTRAP_WRITE.md`, `UPGRADE.md`), root
  `README.md`, `CHANGELOG.md`, `docs/features/ROADMAP.md` (row 67 status).
- **Stops being true:** `SERENA.md:124-128` "The install half is tracked by
  #219" (the residual sentence is replaced by the step itself);
  `init-workspace`'s `Done when` (`SKILL.md:218-221`) grows the install offer;
  the root README's `init-workspace` blurb (`README.md:80`) if the offer
  changes its description.
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
- **Fixed `markdown` + `json` entries (#264, CHANGELOG 3.2.0) vs AC6's
  "confine LSP evidence to TypeScript/JavaScript" (issue #219 item 4)** —
  **affects** AC5/AC6: `SERENA.md:34-40` mandates `markdown`+`json` as fixed
  entries while the scope adjustment says diagnostics claims stay TS/JS-only.
  The design step resolves this ask-don't-infer (listing a server for
  navigation vs claiming it as evidence), never by inference.
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

## Tasks

`n/a — the plan step fills this section (lane §3); triage decides the steps,
the model never re-derives them. See ## Triaged steps below.`

### Planning evidence

`n/a — embedded here for XS/S units; this M unit's ledger lives in
`planning-evidence.md` once the plan step writes it.`

### Obligations

`n/a — the obligations ledger lives in `planning-obligations.md` once the plan
step writes it.`

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

## Progress log

`YYYY-MM-DD HH:MM — <what was done> → <commit sha or evidence> — next: <what is next>`

- 2026-10-21 22:20 — unit doc created from `_TEMPLATE/SPEC.md` for issue #219
  (feature, scope `medium` per roadmap row 67's `(M)`); tier-0 provenance greps
  recorded as R1–R2 → evidence in this doc — next: triage (`bun
  scripts/unit-route.mjs --triage 67-serena-provisioning`).
- 2026-10-21 22:24 — triage ran and is pasted verbatim under
  `## Triaged steps` (9 steps, none skipped, budget strong) → evidence in this
  doc — next: research step.

## Next

`/unit-lane 67-serena-provisioning` continues at the first unfinished triaged
step (research → design → plan).

## References

- Issue [#219](https://github.com/gtrabanco/agentic-workflow/issues/219) — the
  request, its 2026-09-24 scope adjustment (refs #260).
- `docs/features/ROADMAP.md:77` — row 67 `serena-provisioning` (M).
- `skills/init-workspace/references/SERENA.md` — the landed project-config
  contract (owner); `skills/init-workspace/SKILL.md:92-95,125-127,218-221`.
- PRs #263 / #264 / #261 — config half and `.gitignore` correction.
- `packages/pi-agentic-workflow/package.json`, `README.md` — the pi path's
  current surface.
- Row 51 / issue #218 — the consumer of the LSP evidence tier (out of scope).
