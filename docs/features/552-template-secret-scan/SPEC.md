---
type: feature
scope: medium
---

# 552 — template-secret-scan

> One-line: the deterministic push-range secret scan stops being a gate only
> this repository has. Its single implementation moves into
> `template/.agentic-workflow/hooks/`, ships with a bun-else-node runner a
> target project arms as a consent-gated `pre-push` hook, reads a per-project
> allowlist that allows nothing when absent, and degrades fail-closed naming the
> tool or file it could not use.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim.
The requester adopted issue #552 as the request ("Apply to this repository:
issue #552"), so each `S#` below quotes the issue verbatim; `S1` is the turn's
instruction and `S2` is the requirement the issue itself carries verbatim.

**S1 — Apply the issue to this repository.**
> Apply to this repository: issue #552

**S2 — The scan must be in the template without the local gate.**
> Owner requirement, verbatim (2026-11-14): "secret scan sin el local-gate debe estar en el template de agentic workflow (aw)."

**S3 — A standalone scanner under the template, with its own entry point.**
> A standalone scanner under `template/.agentic-workflow/` with its own entry point — no dependency on `scripts/local-gate.mjs`

**S4 — A runner decision for target projects.**
> A runner decision for target projects: an `init-workspace`-offered, consent-gated pre-push hook (pattern: `git-identity-check.sh`), or a sibling crate bin (pattern: `path-guard`), or documented manual invocation in the hooks README

**S5 — Single-source ownership, no second implementation.**
> Single-source ownership: this repo's `local-gate` step and the template copy must not become two implementations (AGENTS.md: every repetition names its owner)

**S6 — A per-project allowlist that allows nothing when absent.**
> A per-project allowlist config (pattern: `hooks/guard-allow.txt`), absent file = allows nothing

**S7 — Tests under the template's hook-test convention.**
> Tests under `template/.agentic-workflow/hooks/tests/` following the existing hook-test convention

**S8 — The hooks README gains the scanner's section.**
> The hooks README gains the scanner's section: invocation, exit contract, fail-closed degradation

**S9 — The domain-separation classification is recorded in the unit doc.**
> Domain-separation recorded in the unit doc: a project-domain gate becomes a product surface at owner request (dual-landing exception; classification authority per AGENTS.md domain separation)

**S10 — #487's shipped behaviour does not change.**
> Changing the gate behavior merged in #487 (push-range semantics, the repo's allowlist file, the `local-gate` step and CI wiring stay as shipped)

**S11 — The scan judges the push range's added lines and nothing else.**
> Scanning anything other than the push range's added lines (the #487 contract)

**S12 — A fresh target scaffold runs the scan with no repo-local file present.**
> A fresh target scaffolded by `init-workspace` can run the scan over its push range with no repo-local file present

**S13 — Exactly one implementation owns the scanner; both invocation sites call it.**
> Exactly one implementation owns the scanner; both invocation sites call it (no second copy)

**S14 — The template's hook tests pass.**
> The template's hook tests pass under `template/.agentic-workflow/hooks/tests/`

**S15 — An absent allowlist allows nothing; every degradation names its cause.**
> An absent allowlist allows nothing, and every degradation names the missing tool or file (fail-closed)

**S16 — The unit doc carries the domain-separation classification row.**
> The unit doc carries the domain-separation classification row

**S17 — Dependencies.**
> #487 (origin, closed — the implementation this distributes)

**S18 — Domain-separation classification authority.**
> Domain-separation classification authority: AGENTS.md §Domain separation (classification test: #435)

## Acceptance criteria

- AC1 — the request is frozen as the unit doc `docs/features/552-template-secret-scan/SPEC.md`, carrying S1–S18 verbatim, the two planning ledgers and `decisions.md`, with the roadmap row for 552 pointing at it (check: `rg -c '^\*\*S[0-9]+ —' docs/features/552-template-secret-scan/SPEC.md` prints 18, and the roadmap link resolves)
- AC2 — the scan ships inside the template and runs without `scripts/local-gate.mjs`: `template/.agentic-workflow/hooks/secret-scan.mjs` is a self-contained entry point whose only imports are node builtins (check: `rg -n '^import' template/.agentic-workflow/hooks/secret-scan.mjs` lists node: builtins only, and `rg -n 'local-gate' template/.agentic-workflow/hooks/secret-scan.mjs` finds no match)
- AC3 — exactly one implementation file owns the scanner (check: `rg --files --glob 'secret-scan.mjs' scripts template` prints one path, the template one)
- AC4 — a target project gets a runner it arms by consent: `init-workspace` offers the scan as a consent-gated `pre-push` hook (question declared in its SKILL, install step in BOOTSTRAP_WRITE, a declined offer recorded as a residual) and the hooks README documents the manual invocation (check: `rg -n 'secret-scan' skills/init-workspace/SKILL.md` matches at least 2 lines, and the README names both doors)
- AC5 — both invocation sites call the one implementation — the gate step's argv[1] is the template path and the runner execs its sibling module, never a copy (check: `rg -n 'template/.agentic-workflow/hooks/secret-scan.mjs' scripts/local-gate.mjs` matches 1, and the suite's single-home pin exits 0)
- AC6 — the allowlist is per project: the default is `.agentic-workflow/hooks/secret-scan-allowlist.json` under the scanned root, `--allowlist <rel>` overrides it, and a malformed file still refuses (check: the suite's allowlist cases exit 0)
- AC7 — the template ships its own hook test under `template/.agentic-workflow/hooks/tests/`, following the existing convention (bash, `set -euo pipefail`, a temp tree removed by a trap, `PASS`/`FAIL` lines, non-zero exit) (check: `bash template/.agentic-workflow/hooks/tests/test-secret-scan.sh` exits 0)
- AC8 — the hooks README gains the scanner's section — invocation, exit contract (0/1/2) and fail-closed degradation (check: `rg -n '^## Push-range secret scan' template/.agentic-workflow/hooks/README.md` matches 1 and the section names all three)
- AC9 — the unit doc records the domain-separation classification: one row per surface, product vs project, plus the owner-requested dual-landing exception citing its authority (check: `rg -n '^## Domain separation' docs/features/552-template-secret-scan/SPEC.md` matches 1)
- AC10 — #487's shipped behaviour is unchanged — rule table, range semantics, report shape, exit codes and the repository's allowlist bytes — with the gate step keeping its id, its `tests: false` marker, its empty `DEPS` row and its CI wiring (check: `git diff --stat main -- scripts/secret-scan-allowlist.json` is empty and `node --test scripts/local-gate.test.mjs` exits 0)
- AC11 — the scan judges the push range's added lines only: a removed secret is never a finding, no path is exempt, and an unresolvable range falls back to the whole tracked tree rather than a skip (check: the suite's range cases exit 0)
- AC12 — a fresh scaffold runs the scan with no repository-local file present: a throwaway repository carrying only `template/.agentic-workflow/hooks/` scans its push range and reports a verdict (check: `bash template/.agentic-workflow/hooks/tests/test-secret-scan.sh` exits 0 with that case)
- AC13 — no second copy exists anywhere: the runner carries no rule pattern and the repository's `scripts/` carries no scanner module (check: the suite's single-source pins exit 0)
- AC14 — the template's hook tests pass under `template/.agentic-workflow/hooks/tests/` (check: `bash template/.agentic-workflow/hooks/tests/test-secret-scan.sh` exits 0, and every pre-existing hook test still exits 0)
- AC15 — an absent allowlist allows nothing and every degradation names the missing tool or file — no runtime, no git checkout, an unreadable tree or a malformed allowlist never exits 0 (check: the runner prints the absent-runtime message and exits 2, and the suite's fail-closed cases exit 0)
- AC16 — the unit doc's domain-separation classification row exists and names the product surfaces and the project surfaces of this change (check: `rg -n '^## Domain separation' docs/features/552-template-secret-scan/SPEC.md` matches 1 and the table names `template/.agentic-workflow/hooks/` and `scripts/local-gate.mjs`)
- AC17 — the origin dependency stays as declared — #487 is closed and referenced, and the moved module imports nothing from `packages/` or `scripts/` (check: `rg -n '#487' docs/features/552-template-secret-scan/SPEC.md` matches at least 2, and `rg -n 'from "\.\.' template/.agentic-workflow/hooks/secret-scan.mjs` finds no match)
- AC18 — the classification row cites its authority — the AGENTS.md domain-separation rule, `docs/workflow/DOMAIN_SEPARATION.md` and the classification test issue #435 (check: `rg -n 'DOMAIN_SEPARATION.md' docs/features/552-template-secret-scan/SPEC.md` matches 1 and the authority line names #435)

## Impact

**The callers of what changes.** `scripts/local-gate.mjs`'s `secret-scan` step
is the one caller in this repository: its `argv[1]` re-points from
`scripts/secret-scan.mjs` to the moved implementation and its argv gains the
repository's own allowlist path. `scripts/local-gate.test.mjs`'s
`secretSandbox()` stages the shipped step in a throwaway checkout, so it must
stage the moved file at its new relative path (its assertions do not move).
`scripts/secret-scan.test.mjs` imports the module and names the CLI script, so
its two path constants move with it.

**The consumers of what it delivers.** A target project scaffolded by
`init-workspace` gains `.agentic-workflow/hooks/secret-scan.mjs`, the runner
`secret-scan.sh`, the hook test, and the README section that names the exit
contract. `skills/init-workspace/SKILL.md` and its
`references/BOOTSTRAP_WRITE.md` gain the consent question and the install step,
because a hook that installs itself is the consent gate bypassed.

**What stops being true when this lands.** `AGENTS.md`-adjacent prose in
`docs/workflow/MIGRATION.md` states that the repository's own gates "stay in
`scripts/` — they gate this repository and never ship". The scanner is now the
one exception (it ships, `local-gate` does not), so that sentence gains the
boundary instead of silently contradicting the tree. The scanner's own header
says its allowlist is `scripts/secret-scan-allowlist.json`; it becomes the
project default plus a flag, because a target project has no `scripts/`.

**What must be asked before touching something live.** Nothing: every mutating
path (`init-workspace`'s install step) is prose this unit does not execute, and
the runner is exercised only against throwaway repositories under `mktemp -d`.

**Named high-risk item** (`risk-tier-verdict@1` `signals[0]`, quoted): `{"path":
"scripts/secret-scan.mjs", "signal": "auth"}` — the moved file is the audit's
`auth` surface, so its bytes are compared against the base commit rather than
trusted: the differential in the Log proves the same verdicts before and after.

## Retirements

Strictly additive in behaviour; three surfaces retire with their replacement
named in the same change:

| Retired surface | Replacement | No-consumer evidence |
|---|---|---|
| `scripts/secret-scan.mjs` (the repository-only implementation) | `template/.agentic-workflow/hooks/secret-scan.mjs` — the same module, moved, invoked by `scripts/local-gate.mjs` | `rg --files --glob 'secret-scan.mjs' scripts template` matches exactly 1 after the move |
| the module-derived default root (`<script dir>/..`, which is `.agentic-workflow/hooks` once the file moves) | the git working-tree top of the caller's directory, with `--root` as the override | `rg -n 'show-toplevel' template/.agentic-workflow/hooks/secret-scan.mjs` matches 1 |
| the hardcoded allowlist path `scripts/secret-scan-allowlist.json` inside the module | the project default `.agentic-workflow/hooks/secret-scan-allowlist.json` plus `--allowlist <rel>` | `rg -n 'DEFAULT_ALLOWLIST_REL' template/.agentic-workflow/hooks/secret-scan.mjs` matches 2 |

Nothing else is removed: the rule table, the range resolution, the report
shape, the exit contract and `scripts/secret-scan-allowlist.json`'s own bytes
are #487's and stay as shipped (S10).

## Non-goals

- Distributing `scripts/local-gate.mjs` itself. `local-gate` remains
  repository-only; the MIGRATION boundary keeps the gate out and lets the
  scanner in (S2, S10).
- A second scanner form: a CLI subcommand, a crate bin, a shell re-implementation
  or a hook that carries its own patterns. One implementation, three doors onto
  it (the gate step, the hook, the documented manual command) (S5, S13).
- Any rule-table, range-semantics or report-format change (S10, S11).
- Reading the `pre-push` hook's stdin ref list. The scanner resolves its own
  range — the #487 contract, where an unresolvable range scans *more* (the
  whole tree), never less (S10).
- Changing `scripts/secret-scan-allowlist.json`'s path or entries (S10).
- Installing the hook without an explicit yes, and writing `.git/hooks/` on a
  later visit without a fresh one (S4).

## Risk tier

`bun scripts/…`-free verdict, copied verbatim from
`ceremony tier classify --paths <this change's paths>`:

```json
{
  "contract": "risk-tier-verdict@1",
  "tier": "high",
  "reason": "4 path(s) touch a named high-risk surface: auth (scripts/secret-scan.mjs)",
  "reason_kind": "named-high-risk",
  "task_size": {
    "understood": true,
    "contained_risk": "named",
    "resumable_from_diff": true,
    "ceremony": "unit-doc+review-change",
    "verification": "review-change"
  },
  "signals": [
    {
      "path": "scripts/secret-scan.mjs",
      "signal": "auth"
    }
  ]
}
```

- **Tier** — `high` · **Task Size** — understood, contained risk (named), resumable from the diff
- **Named high-risk item** — `scripts/secret-scan.mjs` · signal `auth` (the moved audit surface; judged by the base-vs-head differential, §Impact)

## Future

none — the owner deferred nothing in the request this unit frozen.

## Future cost

- **The mainline ref literal in the shipped scanner stays audited-exempt.**
  `scripts/rigidity-review.mjs` declares `scripts/published-refs.mjs` as the one
  home for `origin/main`, but the scanner now lives in `template/`, which cannot
  import a repository script (S3). Its `origin/main` fallback is #487's shipped
  range contract (S10), so the new inventory row audits the rules it can
  (`hardcoded-temp-fallback`, `hardcoded-forge-cli`) and records the exemption
  with its reason. Whoever next touches the range contract (the crate migration
  of the hooks, #554) removes the exemption by resolving the ref names from a
  shipped home. Binds: the #554 cutter.
- **Two doors, one scanner.** Claiming the scan for a target project means
  pointing both `scripts/local-gate.mjs` and `template/.agentic-workflow/hooks/`
  at the template file; a third door that copies the module is the defect.
  Binds: every later change to the scan.
- **A hook a user declines re-appears as a residual.** `init-workspace` records
  a declined offer instead of retrying silently. Binds: `init-workspace`.

## Applicable tests

- `node --test scripts/secret-scan.test.mjs` — #487's corpus (rules, benign
  shapes, range semantics, allowlist, exit codes) re-pointed at the moved
  module, plus the new cases: the project allowlist default and `--allowlist`,
  the never-narrowing root derivation, the single-home pins, and the runner's
  forwarding.
- `bash template/.agentic-workflow/hooks/tests/test-secret-scan.sh` — the
  template's own hook test (new): a throwaway repository scaffolded from
  `template/.agentic-workflow/hooks` alone passes a clean range, refuses a
  leaked one, allows nothing with no allowlist, and the runner names both
  runtimes when neither exists.
- `node --test scripts/local-gate.test.mjs` — the gate step's staged-checkout
  fixture keeps its two refusal cases green.

## Known pre-existing issues

- `scripts/rigidity-review.mjs` audits only the `.sh` files it finds under
  `template/.agentic-workflow/hooks/`, so a `.mjs` guard next to them is
  reachable only once registered in its `INVENTORY`. **Affects this unit**: the
  new runner is auto-collected, and the moved module is registered by hand with
  its exemption recorded (see `## Future cost`).
- `scripts/temp-hygiene.mjs` scans `scripts/` and each package's `src`/`test`,
  not `template/`. **Does not affect this unit**: the new shell test creates its
  temporary trees with `mktemp -d` and removes them in a `trap`, and the moved
  module creates no temporary directory.
- `docs/workflow/MIGRATION.md`'s "gates … never ship" sentence predates the
  scanner's distribution. **Affects this unit**: the boundary is rewritten in
  the same change rather than left contradicting the tree.

## Tasks

- **P1** — freeze the planning ledgers and the acceptance criteria; register the roadmap row's state (validator: `rg -n '^## Domain separation' docs/features/552-template-secret-scan/SPEC.md` matches 1)
  (Implements: S1, S2, S9, S16)
  - Relevant files: docs/features/552-template-secret-scan/SPEC.md, docs/features/552-template-secret-scan/planning-evidence.md, docs/features/552-template-secret-scan/planning-obligations.md, docs/features/552-template-secret-scan/decisions.md, docs/ROADMAP.md
- **P2** — land the corpus red: the suite's new path constants, allowlist default, never-narrowing root, single-home pins and runner cases, plus the template hook test, all observed failing (validator: `node --test scripts/secret-scan.test.mjs` exits 1 with the moved-module import failing)
  (Implements: S5, S6, S7, S13, S14)
  - Relevant files: scripts/secret-scan.test.mjs, template/.agentic-workflow/hooks/tests/test-secret-scan.sh
- **P3** — move the implementation to `template/.agentic-workflow/hooks/secret-scan.mjs`, deriving the root from the caller's working tree and the allowlist from the project default plus `--allowlist` (validator: `rg --files --glob 'secret-scan.mjs' scripts template` matches 1)
  (Implements: S3, S5, S10, S11, S13)
  - Relevant files: template/.agentic-workflow/hooks/secret-scan.mjs, scripts/secret-scan.mjs
- **P4** — ship the runner `secret-scan.sh` (bun-else-node, argv and exit forwarded, fail-closed when neither exists) and register it with its audit rules (validator: `rg -n 'neither bun nor node' template/.agentic-workflow/hooks/secret-scan.sh` matches 1)
  (Implements: S4, S15)
  - Relevant files: template/.agentic-workflow/hooks/secret-scan.sh, scripts/rigidity-review.mjs
- **P5** — point both invocation sites at the one implementation: the gate step's argv plus its fixture, and `init-workspace`'s consent-gated offer (validator: `rg -n 'template/.agentic-workflow/hooks/secret-scan.mjs' scripts/local-gate.mjs` matches 1)
  (Implements: S4, S5, S12, S13)
  - Relevant files: scripts/local-gate.mjs, scripts/local-gate.test.mjs, skills/init-workspace/SKILL.md, skills/init-workspace/references/BOOTSTRAP_WRITE.md
- **P6** — ship the documentation and the repository state in the same change: the hooks README section, the MIGRATION boundary, the changeset, the roadmap state, the generated projection and the session journal (validator: `rg -n '^## Push-range secret scan' template/.agentic-workflow/hooks/README.md` matches 1)
  (Implements: S8, S10)
  - Relevant files: template/.agentic-workflow/hooks/README.md, docs/workflow/MIGRATION.md, .changeset/552-template-secret-scan.md, docs/ROADMAP.md, .agentic-workflow/journal/
- **P7** — run every validator in the foreground, close the obligations ledger, and record the base-vs-head differential (validator: `node --test scripts/secret-scan.test.mjs scripts/local-gate.test.mjs` exits 0)
  (Implements: S1, S10, S12, S14, S17, S18)
  - Relevant files: docs/features/552-template-secret-scan/SPEC.md, docs/features/552-template-secret-scan/planning-obligations.md

### Planning evidence

Frozen at cut in the unit folder's
[`planning-evidence.md`](planning-evidence.md) — M-sized unit: the ledger is a
separate file, never both.

### Obligations

Frozen at cut in the unit folder's
[`planning-obligations.md`](planning-obligations.md) — M-sized unit: the ledger is
a separate file, never both.

## Triaged steps

`n/a — this unit is applied under the owner's local, unpublished workflow: the
frozen planning ledgers substitute for the lane's plan step, so no
`unit-route --triage` block exists for this cut.` The phase cut above is the
declared step list (P1–P7, dependency-topological, smallest ready task first).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Domain separation

The classification test (`docs/workflow/DOMAIN_SEPARATION.md`, authority:
AGENTS.md §Domain separation, classification test issue #435): *can the
workflow execute/declare/verify this with its own code and prose, knowing
nothing about this repository?*

| Surface | Domain | Evidence behind the classification |
|---|---|---|
| `template/.agentic-workflow/hooks/secret-scan.mjs`, `secret-scan.sh`, `tests/test-secret-scan.sh` | **product** | The scan judges a git push range by shape and reads one project-local allowlist; nothing in it knows this repository, its forge or its labels. A fresh scaffold runs it with no file beyond the template (AC13). |
| `template/.agentic-workflow/hooks/README.md`'s scanner section | **product** | Invocation, exit contract and degradation are facts of the shipped hook, not of this repository. |
| `scripts/local-gate.mjs`'s `secret-scan` step, `scripts/secret-scan.test.mjs` | **project** | `local-gate` is this repository's own gate orchestration and never ships (MIGRATION boundary); the suite is the root gate's carrier. Both now *call* the product file. |
| `scripts/secret-scan-allowlist.json` | **project** | The entries answer shapes this repository's own bytes carry (its suite's known-secret fixture). A target project starts with no allowlist — allows nothing. |
| `docs/features/552-template-secret-scan/**`, the journal fragment | **project** | This repository's unit record and session journal. |

**Owner-requested dual landing** (the legitimate exception, not a drift):
issue #552, owner decision 2026-11-14, asks for a project-domain gate (the
scanner #487 built for this repo) to become a product surface while the
project's own gate keeps calling it. Classification authority and exception
list: `docs/workflow/DOMAIN_SEPARATION.md` §Legitimate exceptions.

## Log

- **L1** — 2026-11-14, the issue, verbatim:
  ```
  ## Goal

  The deterministic push-range secret scan shipped by #487 lives only in this repository (`scripts/secret-scan.mjs`, wired as a `local-gate` step). Owner decision 2026-11-14: the standalone scanner — **decoupled from `local-gate`**, which target projects do not have — must ship in `template/`, the same way the temp-dir guard ships as `template/.agentic-workflow/hooks/lib/temp.sh`.

  > Owner requirement, verbatim (2026-11-14): "secret scan sin el local-gate debe estar en el template de agentic workflow (aw)."

  ## In scope

  - A standalone scanner under `template/.agentic-workflow/` with its own entry point — no dependency on `scripts/local-gate.mjs`
  - A runner decision for target projects: an `init-workspace`-offered, consent-gated pre-push hook (pattern: `git-identity-check.sh`), or a sibling crate bin (pattern: `path-guard`), or documented manual invocation in the hooks README
  - Single-source ownership: this repo's `local-gate` step and the template copy must not become two implementations (AGENTS.md: every repetition names its owner)
  - A per-project allowlist config (pattern: `hooks/guard-allow.txt`), absent file = allows nothing
  - Tests under `template/.agentic-workflow/hooks/tests/` following the existing hook-test convention
  - The hooks README gains the scanner's section: invocation, exit contract, fail-closed degradation
  - Domain-separation recorded in the unit doc: a project-domain gate becomes a product surface at owner request (dual-landing exception; classification authority per AGENTS.md domain separation)

  ## Out of scope

  - Changing the gate behavior merged in #487 (push-range semantics, the repo's allowlist file, the `local-gate` step and CI wiring stay as shipped)
  - Scanning anything other than the push range's added lines (the #487 contract)

  ## Acceptance criteria

  - A fresh target scaffolded by `init-workspace` can run the scan over its push range with no repo-local file present
  - Exactly one implementation owns the scanner; both invocation sites call it (no second copy)
  - The template's hook tests pass under `template/.agentic-workflow/hooks/tests/`
  - An absent allowlist allows nothing, and every degradation names the missing tool or file (fail-closed)
  - The unit doc carries the domain-separation classification row

  ## Dependencies

  - #487 (origin, closed — the implementation this distributes)
  - Domain-separation classification authority: AGENTS.md §Domain separation (classification test: #435)

  ## Open questions / risks

  - Which runner a target project gets (consent-gated pre-push hook vs sibling crate bin vs manual) — the triage's first decision
  - Whether this repo's `local-gate` step switches to the shared implementation in the same unit or a follow-up — single-source must not land as two copies
  - MIGRATION.md's boundary keeps gates repo-only ("they gate this repository and never ship"); this issue distributes the *scanner*, not `local-gate`
  ```
- **D1** — 2026-11-14, issue #552's first open question (the runner), decided by this cut: a consent-gated `pre-push` hook, `secret-scan.sh` (the `git-identity-check.sh` pattern), offered by `init-workspace` and documented in the hooks README as the manual door. Rationale and the two rejected routes: `decisions.md` D1.
- **D2** — 2026-11-14, issue #552's second open question (does `local-gate` switch in this unit), decided: yes, in this unit, because S5 forbids ever landing two copies — the window where the step would call a stale path is the same window a drift can hide in. `decisions.md` D2.
- **P1** — 2026-11-14, planning ledgers frozen (this doc, `planning-evidence.md`, `planning-obligations.md`, `decisions.md`) and the roadmap row's state registered. (commit sha appended in P7)

## Next

P2 — land the corpus red.

## References

- Issue [#552](https://github.com/gtrabanco/agentic-workflow/issues/552)
- Origin unit: `docs/fix/487-deterministic-secret-scanning/` (the implementation
  this unit distributes; its D1 range decision and D2 allowlist decision are
  inherited unchanged)
- `docs/workflow/GATE_INVENTORY.md`'s `secret-scan` row (the gate's carrier)
- `docs/workflow/DOMAIN_SEPARATION.md` (the classification test and the
  dual-landing exception)
- `docs/workflow/MIGRATION.md` (the repo-only gate boundary this unit refines)
