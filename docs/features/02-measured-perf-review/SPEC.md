# 02 — measured-perf-review

> Feature specification. Size S — this SPEC is the only planning artifact;
> implement with `execute-phase 02` in a single pass.

## Goal

Make performance review **measured instead of guessed**: `init-workspace`
discovers (and offers to install) performance tooling whenever the target
project's stack allows it and registers the commands in the project's docs;
`review-perf` runs those declared commands so its findings cite real numbers.
A finding backed by a measurement beats a finding backed by reading.

## Branch

`feat/02-measured-perf-review`

## Size

`S` — surgical edits to two existing SKILL.md files plus a template block.

## Dependencies

None. (Independent of 01 and 03.)

## Context

`review-perf` v1.0.1 is a static-reading checklist: it detects structural
antipatterns (N+1, unclosed resources, invariant recomputation) but cannot
verify a complexity claim or a regression — and its own last checklist item
forbids optimization "without a cited measurement", a measurement the workflow
currently never produces. Meanwhile `init-workspace` interviews the project but
never asks about perf tooling, so no project ends up with benchmark/profiling
commands the reviews could run.

## Business goals

n/a — internal workflow quality.

## Technical goals

- Perf findings graduate from "plausible" to "measured" wherever the stack has
  cheap tooling.
- Stay stack-agnostic: the generic contract is "the project declares perf
  commands"; concrete tools appear only in a marked adapter section
  (TS/JS reference set, per the user's primary stack).

## Scope

### In scope

1. **`init-workspace`**: new interview step "Performance tooling" —
   - Detect the stack's options via a fixed checklist (first match per slot):
     - *Static complexity lint*: Biome present → enable its `complexity` group
       (incl. `noExcessiveCognitiveComplexity`); ESLint present → suggest
       `eslint-plugin-sonarjs` + `eslint-plugin-unicorn`; neither → n/a.
     - *Benchmark harness*: Vitest → `vitest bench`; Bun runtime → `mitata`;
       Node → `tinybench`/`mitata`; other stacks → ask for the project's
       benchmark command or record n/a.
     - *Profiler*: Node → `node --cpu-prof` (zero-dep default) or `0x` via the
       project's package runner; Bun → `bun --inspect` CPU profiling; other →
       ask or n/a.
   - Offer installation (user confirms; never silently add dependencies) and
     **register the resulting commands** in the project's agent guide under a
     `Performance commands` block (bench command, profile command, lint scope),
     next to the verification gate.
   - Template: the agent-guide template gains the (commented, optional)
     `Performance commands` block.
2. **`review-perf`** (minor version bump): checklist gains measured items —
   - ✓ If the project declares a benchmark command AND the diff touches paths
     the benchmarks cover: RUN it, paste the before/after numbers (base branch
     vs change) in Evidence. A regression beyond noise is a major finding.
   - ✓ If no perf commands are declared: state `n/a — no declared perf
     commands` explicitly (never silently skip), and when the diff adds
     algorithmic code on growable input, emit a **minor** finding recommending
     the project adopt the tooling (points at `init-workspace`).
   - Evidence column for measured findings carries the command + numbers, not
     only `file:line`.
3. `bump-skill` bookkeeping (versions, CHANGELOG EN/ES, README tables EN/ES).

### Out of scope / non-goals

- A separate `optimize` skill that *applies* perf fixes — review-perf stays
  findings-only. If wanted later, plan it as its own feature.
- Writing benchmark files for the target project — the project (or a unit of
  work in it) owns its benches; the skills only run declared commands.
- CI perf budgets/regression gates — target-project infra.
- Non-TS/JS adapter sets (Python, Go…) — the generic "declare your commands"
  contract already covers them; named recipes can be added on demand.

## Architecture impact

None structural: two skill bodies + one template block. Keeps the
stack-agnostic rule: TS/JS tool names live only in the marked adapter list
inside `init-workspace`; `review-perf` references only "the project's declared
perf commands".

## Design

Fixed contract shape (closed, agent-independent):

- The declaration block the skills read/write (in the target project's agent
  guide):

  ```
  ## Performance commands
  - bench: <command | none>
  - profile: <command | none>
  - complexity-lint: <command | none>
  ```

- `review-perf`'s measured-evidence format inside the existing report table:
  `Evidence: <cmd> → base <x> / change <y> (<±z%>)`.
- Decision rule unchanged (`PASS | FAIL` on critical/major), so callers
  (`review-change`, `product-audit`) need no changes.

## Decisions to confirm

- D1 — review-perf runs benches only when declared AND relevant to the diff
  (never unconditionally): **chosen** — keeps review cost bounded.
- D2 — installation is always user-confirmed in init-workspace: **chosen** —
  a scaffolding skill must not add dependencies silently.

## Acceptance criteria

- `init-workspace` SKILL.md contains the Performance tooling interview step
  with the fixed per-slot detection checklist and the registration block;
  template updated with the commented block.
- `review-perf` SKILL.md contains the run-when-declared items with the exact
  n/a wording and measured Evidence format; report contract otherwise
  unchanged.
- Both skills' `version:` bumped; CHANGELOG.md, CHANGELOG.es.md, README.md,
  README.es.md rows updated.
- `npx skills add . --list` still lists every skill; cross-references resolve.
- No stack-specific names outside the marked adapter list.

## Testing requirements

Docs-level gate (CLAUDE.md → Verification): skills CLI discovery, markdown
link sweep, stack-leak grep (`grep -rn "biome\|mitata\|0x\|sonarjs"` must hit
only the marked adapter section of init-workspace).

## Dev scenarios

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| `perf:declared-and-hit` | bench declared, diff touches covered path | dry-run the checklist on a fixture declaration → measured Evidence row |
| `perf:not-declared` | project without perf commands | explicit `n/a — no declared perf commands` + minor adopt-tooling finding |
| `perf:bench-fails` | declared command exits non-zero | finding (gate can't measure) routed like a red verification gate, not silently skipped |

## Phases

Single-pass (`execute-phase 02`) — no PLAN/TASKS. Close-out: open the PR, print
its URL, roadmap row → done.

## Deploy & rollback

n/a — merging is enough.

## Open questions / risks

- R1: benchmark noise on laptops → mitigated by requiring the ± delta in
  Evidence and treating <noise-band deltas as no-finding; band stated in the
  checklist (default ±5% unless the project declares one).

## Deliverables

Edits to `skills/init-workspace/SKILL.md`, `skills/review-perf/SKILL.md`,
template agent-guide block; CHANGELOGs + READMEs; this SPEC.

## Post-merge next feature

`03-orchestrator-crash-recovery` (independent; see ROADMAP).
