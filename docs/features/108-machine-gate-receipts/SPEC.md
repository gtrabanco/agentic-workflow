---
type: feature
scope: medium
---

# 108 — machine-gate-receipts

> Persist the project verification gate's output as a machine artifact instead of
> conversation text: a bounded, content-bound gate envelope (exit codes, per-check
> verdicts, failing fragments only) that `review-verify` and `audit-pr` consume
> rather than re-run or re-litigate.

## Issue

`#409` — tracked issue in the project's forge. The PR must close it via
`Closes #409` in the body.

Roadmap row: **108 `machine-gate-receipts`**. The folder is feature-numbered
(`108`) so it pairs with its roadmap row (`roadmap-settle` pairs a feature
folder's number with its `## Features` row); the issue it closes is #409. Cut
under the owner's direct-application workflow for changes to this repository
itself: plan, implement, hand the diff back — no lane review machinery.

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim.

**S1 — Goal: the gate as a machine artifact.**
> Persist the project verification gate's output as a machine artifact instead of conversation text: a bounded, SHA-bound gate envelope (exit codes, per-check verdicts, failing fragments only) that `review-verify` and `audit-pr` consume rather than re-run or re-litigate. The LLM reads the envelope; the full log stays on disk for humans.

**S2 — Business value: change understanding, bounded contexts.**
> Directly attacks the review bottleneck the modern-code-review literature identifies — change *understanding*, not defect finding — and removes redundant gate re-execution from review and audit passes. Bounded contexts instead of raw logs.

**S3 — Gate-envelope shape in the schema package.**
> Gate-envelope shape in `agentic-workflow-schema` (follows the orchestration-envelope pattern; bound to head SHA + manifest/digest of the run), compact by design.

**S4 — A command that runs the gate and emits the envelope.**
> Runner-crate command to execute the local gate and emit the envelope (bounded failing fragments: test name + first error lines; full log path referenced, never inlined).

**S5 — Consumers: current receipt is evidence, missing/stale routes to a re-run.**
> `review-verify` and `audit-pr` consume a current envelope as verification evidence; missing/stale (SHA mismatch) routes to re-run — never silently accepted.

**S6 — Freshness binding checked on every consumption.**
> Freshness binding follows the feature-65 pattern (invariant checked on every consumption).

**S7 — Out of scope.**
> pi hooks/guards/prereq (separate issues); remote CI orchestration; tiering of which gate subset runs per step (follows existing `TIER_COST.md` conventions; changes there are doc updates in the same PR).

**S8 — Green and red both produce a valid envelope.**
> A green gate produces a valid envelope; a red one names failing checks with bounded fragments.

**S9 — `audit-pr` blocks on a stale or missing envelope.**
> `audit-pr` treats a stale/missing envelope as a blocker routed back, verifiable via fixture.

**S10 — Schema validated and registered.**
> Envelope schema validated (TypeBox) and registered in `normative-surfaces@1`.

**S11 — Declared degradation for unrecognized output.**
> Gate output formats vary per project — the envelope parser needs a declared degradation for unrecognized output (bounded raw tail, marked degraded), never a silent pass.

**S12 — Validity is the declared content manifest, not the commit.**
> La firma del envelope debe **declarar qué archivos forman parte de la firma** (manifiesto de rutas + hash de contenido por fichero) y bindar a ese contenido — **no al commit completo**:
> 1. Un commit intermedio no relacionado no debe invalidar la firma.
> 2. Añadir otro archivo al commit no debe invalidar la firma.
> 3. **Short-circuit**: si la firma es válida y los ficheros firmados no han mutado, no hay nada que volver a comprobar — verificación puramente local (hash + comparar), sin re-run del gate.

**S13 — The determinism frontier of the short-circuit.**
> El short-circuit solo aplica a claims deterministas (gate sobre bytes). Claims no deterministas (timings, tokens por tier del measured acceptance, veredictos de review) son *records sobre una run*, no promesas sobre bytes: no se re-validan por hash aunque los ficheros no hayan mutado; llevan procedencia (de dónde salió el valor).

**S14 — The manifest is a minimal, declared closure.**
> El manifiesto es una clausura mínima y declarada. Debe incluir todo de lo que depende la validez: lockfile/config para claims tipo "tests pass", versión del script/gate ejecutado, etc. Un manifiesto incompleto es el modo de fallo: firma válida que vaza evidencia que ya no se sostiene porque cambió algo no firmado. […] la clausura aquí debe ser mínima y declarada, no derivada.

### S10/S4 resolution (owner answer by direction, recorded)

S10 asks for a TypeBox schema; the schema package declares **no** `dependencies`
and the repository's own pattern (feature 105, D-105-1) resolves that conflict as
*hand-written TS contract + dependency-free validator + hand-maintained Draft-07
projection + `ajv` fixture parity*. Applied here, quoted as the owner-approved
carrier rather than silently reinterpreted.

S4 asks for a *runner-crate* command. The gate it wraps
(`scripts/local-gate.mjs`) exists only in this repository — a consumer project
has no `local-gate.mjs` — so the **shipped** artifact is the contract (schema
package) and the runner is `scripts/gate-receipt.mjs`, which accepts
`--gate <script>` so any project's gate becomes a receipt source without this
repository's files. Recorded as a deviation from S4's letter and disclosed in the
handoff: packing the runner into `packages/agentic-workflow` would ship a
subcommand that can only ever run in this repo.

## Acceptance criteria

One observable criterion per requirement, each naming the check that proves it.

1. **S1** — the envelope is a JSON document with `contract`, `version`,
   `provenance`, `manifest`, `gate`, `checks`, `verdict`, `degraded`, and no
   raw log is inlined. Check:
   `bun test packages/agentic-workflow-schema/test/gate-receipt.test.mjs` exits 0
   (the shape and the closed-core cases).
2. **S2** — the envelope is compact by construction: at most 8 fragments per
   check, 240 chars each, 64 checks, 4096 manifest entries, and the whole
   receipt under a declared byte budget. Check: the same suite's `limits` cases
   exit 0.
3. **S3** — the contract is declared once in
   `packages/agentic-workflow-schema/src/gate-receipt.ts`, exported from the
   package root, and bound to the manifest digest. Check: the same suite's
   `digest` and `export` cases exit 0.
4. **S4** — `scripts/gate-receipt.mjs run` executes a declared gate, writes the
   envelope plus the full log, and inlines only bounded fragments with the log
   path referenced. Check: `bun test scripts/gate-receipt.test.mjs` exits 0
   (`run` cases).
5. **S5** — both consumer skills name the envelope as the verified evidence and
   route a missing/stale one to a re-run. Check:
   `rg -c 'gate-receipt.mjs verify' skills/review-verify/SKILL.md skills/audit-pr/SKILL.md`
   matches 1 each.
6. **S6** — `judgeGateReceipt` recomputes the manifest on every call and never
   trusts a stored verdict alone. Check: the same suite's `stale` case exits 0.
7. **S7** — no pi-package, remote-CI or tiering surface changes. Check:
   `git diff --name-only origin/main...HEAD -- packages/pi-agentic-workflow .github docs/workflow/TIER_COST.md`
   prints nothing.
8. **S8** — a red fixture gate yields `verdict: fail` naming the failing check id
   and its bounded fragments; a green one yields `verdict: pass`. Check:
   `bun test scripts/gate-receipt.test.mjs` exits 0 (`run` green and red cases).
9. **S9** — `audit-pr-gate.mjs` carries a `gate-receipt` gate that blocks with
   route `re-run` when the envelope is missing or stale. Check: the same suite's
   `audit-pr` fixture case exits 0.
10. **S10** — the three published vocabularies are read from committed source by
    the drift gate and the `gate-receipt@1` grammar block resolves. Check:
    `bun test scripts/normative-drift.test.mjs` exits 0.
11. **S11** — an unrecognized gate output writes a `degraded` receipt with a
    bounded raw tail and never `verdict: pass`. Check:
    `bun test scripts/gate-receipt.test.mjs` exits 0 (`degraded` case).
12. **S12** — a receipt stays `current` across an unrelated commit that touches
    no signed file, and flips to `stale` when one signed file changes. Check: the
    same suite's `provenance-only` and `stale` cases exit 0.
13. **S13** — the envelope marks non-deterministic fields (`duration_ms`,
    `generated_at`) as provenance, and freshness never compares them. Check: the
    same suite's `provenance-only` case exits 0 and the record fields carry the
    `generated_at`/`duration_ms` names.
14. **S14** — the signed closure is one declared, exported pattern list including
    the lockfile, the manifests, the gate script and the skills; a path outside
    the closure is not hashed. Check: the same suite's `manifest closure` case
    exits 0 (`GATE_MANIFEST_PATTERNS` import plus the excluded-path assertion).

## Impact

- **Consumers:** `skills/review-verify` and `skills/audit-pr` gain one checklist
  item each and consume the envelope instead of re-running the gate;
  `scripts/audit-pr-gate.mjs` gains the `gate-receipt` gate name, so every
  existing caller that builds its gate map from `GATE_NAMES` inherits the
  fail-closed behaviour without a second copy of the rule.
- **Gate:** `scripts/local-gate.mjs` gains `--json <path>`, the machine result
  the runner reads. The step table, order, concurrency and exit contract are
  unchanged.
- **Schema package:** one new contract module, one hand-maintained Draft-07
  projection, `exports`/`files`/README growth, no dependency.
- **Registration surfaces:** `AGENTS.md` `normative-surfaces@1` rows,
  `docs/workflow/GATE_INVENTORY.md` surface claims, `scripts/vocabulary-parity.test.mjs`
  imports, one `.changeset/` intent.
- **Not touched:** pi package, remote CI workflows, `TIER_COST.md` tiering
  (S7), and no gate step is added or removed.

## Retirements

Nothing is retired: this unit only adds. `rg -c 'gate-receipt|gateReceipt'
packages/ scripts/ skills/` → 0 at the cut head (one unrelated prose mention of
"gate receipt" in `docs/CAPABILITIES.md` describes `## Log` `G` lines and stays
true). The *claim* this unit narrows is S3's "bound to head SHA": delivered as
HEAD-sha **provenance** plus a content-manifest **validity** criterion, per S12's
later owner directive; recorded here rather than edited out of the verbatim quote.

## Non-goals

- No remote CI orchestration, no pi hook/guard/prereq surface (S7).
- No change to which gate subset runs per step (`TIER_COST.md` untouched).
- No re-run of the gate from `audit-pr` or `review-verify`: a stale receipt is a
  route, never a prompt to run it there.
- No dependency in the schema package; no hand-bumped version (a changeset).
- Findings discovered during implementation never expand this unit.

## Risk tier

Computed, never chosen:

```text
$ bun scripts/ceremony.mjs tier classify --paths packagessrc,scripts,skills,docs
"tier": "standard"
```

- **Tier** — `standard` · **Task Size** — understood · contained risk · resumable from diff
- **Named high-risk item** — none — not a high-tier unit

## Future

- The envelope's `checks[]` is a generic per-check row; a future consumer
  (`workflow-status`, the pi conductor) can read it without a schema change.
  **open**
- A second gate source (a project-declared `--gate` script speaking
  `local-gate-result@1`) is supported but has no shipped adapter yet. **open**

## Future cost

- A new input to the gate's result must be added to `GATE_MANIFEST_PATTERNS` in
  the same change, or a receipt stays "current" while the evidence it claims has
  moved. This binds every future gate step added to `scripts/local-gate.mjs`.
- Any new value in the three published vocabularies needs the schema const, the
  Draft-07 projection and the `normative-surfaces@1` row in the same PR.

## Applicable tests

- `packages/agentic-workflow-schema/test/gate-receipt.test.mjs` — the contract:
  shape, closed core, limits, digest, freshness, schema parity.
- `scripts/gate-receipt.test.mjs` — the runner: manifest closure, green/red
  fixture gates, bounded fragments, full-log reference, degraded output,
  provenance-only freshness, stale/missing route, `audit-pr` gate.
- `scripts/local-gate.test.mjs` — `--json` result shape and the unchanged step
  table.
- `scripts/normative-drift.test.mjs`, `scripts/vocabulary-parity.test.mjs`,
  `scripts/prose-gate-inventory.test.mjs` — registration.
- `scripts/audit-pr-receipt.test.mjs` — the `gate-receipt` gate joins the
  fail-closed set.
- `bun scripts/local-gate.mjs` — the repository gate.

## Known pre-existing issues

- The full gate's `pi-compat-guard` step fails at `origin/main` too (peer-floor
  install resolves the published 1.x crate, whose `src/` lacks newer modules).
  **does-not-affect**: this unit's gate is the offline subset, and this unit
  touches no pi-package source.
- The worktree's `HEAD`/`index` files share the checkout root with the working
  tree (the repository's worktree layout), so a `git diff <base> HEAD` argv is
  ambiguous and `ceremony.mjs tier classify` must be called with `--paths`.
  **does-not-affect**: recorded in the `## Log`, and every command in this unit
  uses an unambiguous range (`origin/main...HEAD`) or `--paths`.

## Tasks

- P1 — Freeze the ledgers, then add the schema contract: vocabularies, validator,
  manifest digest, freshness predicate, canonical serialization, Draft-07
  projection, package exports and README grammar.
  (validator: `bun test packages/agentic-workflow-schema/test/gate-receipt.test.mjs` exits 0)
  (Implements: S1, S2, S3, S6, S10, S12, S13)
  Relevant files: packages/agentic-workflow-schema/src/gate-receipt.ts, packages/agentic-workflow-schema/src/index.ts, packages/agentic-workflow-schema/gate-receipt.schema.json, packages/agentic-workflow-schema/package.json, packages/agentic-workflow-schema/README.md, packages/agentic-workflow-schema/test/gate-receipt.test.mjs
- P2 — Add the machine result to the local gate and the runner that turns it into
  an envelope: declared manifest closure, bounded fragments, full-log reference,
  degraded mode.
  (validator: `bun test scripts/gate-receipt.test.mjs` exits 0)
  (Implements: S4, S8, S11, S14)
  Relevant files: scripts/local-gate.mjs, scripts/gate-receipt.mjs, scripts/gate-receipt.test.mjs, scripts/fixtures/gate-receipt/
- P3 — Add the consumption judgment: manifest recomputation, stale/missing route,
  provenance-only HEAD, and the `audit-pr` gate.
  (validator: `bun test scripts/audit-pr-receipt.test.mjs` exits 0)
  (Implements: S5, S9, S12)
  Relevant files: scripts/gate-receipt.mjs, scripts/audit-pr-gate.mjs, scripts/audit-pr-receipt.test.mjs, skills/review-verify/SKILL.md, skills/audit-pr/SKILL.md
- P4 — Register the machine grammars and the published sets.
  (validator: `bun test scripts/normative-drift.test.mjs` exits 0)
  (Implements: S10)
  Relevant files: AGENTS.md, docs/workflow/GATE_INVENTORY.md, scripts/vocabulary-parity.test.mjs, .changeset/409-machine-gate-receipts.md
- P5 — Settle the indexes and the docs projection through the writers.
  (validator: `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S1, S10)
  Relevant files: docs/ROADMAP.md, docs/generated/units.md, docs/LOGS.md
- P6 — Run the repository gate and close the obligations ledger.
  (validator: `bun scripts/local-gate.mjs --skip-network` exits 0)
  (Implements: S1, S8, S9, S10)
  Relevant files: docs/features/108-machine-gate-receipts/

### Planning evidence

The frozen ledger is `planning-evidence.md` beside this document (M shape).

### Obligations

The frozen ledger is `planning-obligations.md` beside this document (M shape).

## Triaged steps

Cut locally by the owner's direct-application workflow for changes to this
repository: plan, implement, hand the diff back. The lane's triage and review
machinery is deliberately not run on this unit.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-09, the issue, verbatim (elisions marked):
  ```
  ## Goal
  Persist the project verification gate's output as a machine artifact instead of conversation text: a bounded, SHA-bound gate envelope (exit codes, per-check verdicts, failing fragments only) that `review-verify` and `audit-pr` consume rather than re-run or re-litigate. The LLM reads the envelope; the full log stays on disk for humans.
  […]
  ## In scope
  - Gate-envelope shape in `agentic-workflow-schema` (follows the orchestration-envelope pattern; bound to head SHA + manifest/digest of the run), compact by design.
  - Runner-crate command to execute the local gate and emit the envelope (bounded failing fragments: test name + first error lines; full log path referenced, never inlined).
  - `review-verify` and `audit-pr` consume a current envelope as verification evidence; missing/stale (SHA mismatch) routes to re-run — never silently accepted.
  - Freshness binding follows the feature-65 pattern (invariant checked on every consumption).
  […]
  ## Acceptance criteria
  - A green gate produces a valid envelope; a red one names failing checks with bounded fragments.
  - `audit-pr` treats a stale/missing envelope as a blocker routed back, verifiable via fixture.
  - Envelope schema validated (TypeBox) and registered in `normative-surfaces@1`.
  […]
  - Gate output formats vary per project — the envelope parser needs a declared degradation for unrecognized output (bounded raw tail, marked degraded), never a silent pass.
  ```
- **L2** — 2026-11-09, the owner's design directive (issue comment, verbatim elision):
  ```
  La firma del envelope debe declarar qué archivos forman parte de la firma (manifiesto de rutas + hash de contenido por fichero) y bindar a ese contenido — no al commit completo … Short-circuit: si la firma es válida y los ficheros firmados no han mutado, no hay nada que volver a comprobar — verificación puramente local (hash + comparar), sin re-run del gate.
  ```
- **D1** — 2026-11-09, S10's TypeBox clause delivered as the repository pattern
  (hand-written contract + dependency-free validator + Draft-07 projection +
  `ajv` parity), the same owner-approved carrier feature 105 recorded.
- **D2** — 2026-11-09, S4's "runner-crate command" delivered as the root runner
  `scripts/gate-receipt.mjs` with a `--gate` seam, because the wrapped gate is
  repository-local and never ships; disclosed to the owner.
- **D3** — 2026-11-09, validity is the declared content manifest and HEAD sha is
  provenance only (S12/S13), superseding S3's "bound to head SHA" wording.
- **P1** — 2026-11-09, ledgers cut: 14 requirements, 14 acceptance criteria,
  12 planning-evidence rows, 17 obligation rows.

## Next

Close the obligations ledger with the validators actually run, then hand the diff
to the owner as the external verifier.

## References

- Issue #409; roadmap row 108; issue #138 (content-bound receipts),
  #139 (staged verification contracts), #359 (gate inventory), #406 (the
  projection vocabulary this unit's grammar style follows).
- `scripts/local-gate.mjs` — the gate this unit wraps.
- `skills/review-verify/SKILL.md`, `skills/audit-pr/SKILL.md` — the consumers.
- `skills/pre-execution-review/references/LEDGERS.md` — ledger shapes.
