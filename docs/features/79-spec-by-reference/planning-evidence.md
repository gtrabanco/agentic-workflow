# Planning evidence — unit 78 (spec-by-reference)

M/L unit: this file is the planning-evidence ledger (sizing rule,
`skills/unit-lane/references/PLAN.md:153-160`). Row shape and vocabularies are
owned by `skills/pre-execution-review/references/LEDGERS.md` §1; ids are stable
(`PE-nnn`) and renumbering is a replan.

| id | claim-or-obligation | authority-kind | source-and-location | observed-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|---|
| PE-001 | The re-cut ships as one 14-section shape in which `## Specs` and `## Log` replace `## Evidence` and `## Progress log`, and the machine accepts BOTH shapes so closed units keep validating | user | `decisions.md` D1 (owner answer, ask `b21dec14…`); `#308` §Scope 1 | 2026-10-21 | O1, O3, P2, P3 | current | decision | — |
| PE-002 | Today's machine rejects a doc missing any required section at triage and at the Product selector, so the re-cut cannot land without the machine change | repository | `scripts/unit-route.mjs:649-651`; `packages/agentic-workflow-schema/src/pre-execution.ts:225-241,529-556` | `39e2aa3a` | O1, O4, P2, P4 | current | proven | — |
| PE-003 | The section list is one owner constant mirrored by three surfaces and pinned by one suite — a shape change is a four-surface, same-PR change | repository | `scripts/unit-doc-contract.test.mjs:3-13,70-139`; `AGENTS.md` §same PR, always | `39e2aa3a` | O1, P2 | current | proven | — |
| PE-004 | Done-phase derivation in the router reads only `## Progress log`, so the re-cut needs an equivalent `## Log`-line derivation | repository | `scripts/unit-route.mjs:514-560` | `39e2aa3a` | O4, P4 | current | proven | — |
| PE-005 | `phase-lint` already runs two grammars behind one verdict contract, and an `S#` link inside a `P<n>` bullet trips no box (box 8 reads only the validator span) | repository | `scripts/phase-lint.mjs:1-40,640,731-748`; `skills/phase-contract/SKILL.md:83-104`; live lint PASS on this unit (verdict PASS, per-phase `PASS (6/6)`) | `39e2aa3a` | O4, P4 | current | proven | — |
| PE-006 | The findings ledger's readers are `unit-route` (open-row routing), `workflow-status` (sensor), `ledger-provenance` (CLI) plus `LEDGERS.md`'s mark blocks and five skill references; six suites pin its shape | repository | `scripts/unit-route.mjs:716`; `scripts/workflow-status.mjs:640-699`; `scripts/ledger-provenance.mjs:20,57`; `skills/pre-execution-review/references/LEDGERS.md` | `39e2aa3a` | O6, P5 | current | proven | — |
| PE-007 | `## Findings` is a tolerated heading for the Product selector (only required names are checked), so the open table gains a home without a required-list change | repository | `packages/agentic-workflow-schema/src/pre-execution.ts:529-556`; owner answer `D3` | `39e2aa3a` | O6, P5 | current | proven | — |
| PE-008 | The migration corpus has an in-repo home and convention: committed, read-only fixtures beside the golden fixture with their own suite | repository | `ls scripts/fixtures/golden-fixture/`; `scripts/golden-fixture.test.mjs` | `39e2aa3a` | O7, P1 | current | proven | — |
| PE-009 | `fix/258` is the failure corpus the issue names: 23 wholesale SPEC rewrites, a 1,151-line findings ledger, owner decisions that drifted in paraphrase | document | `docs/fix/258-harden-needs-input-contracts/SPEC.md`; `#308` §Why | folder as merged | O7, P1 | current | proven | — |
| PE-010 | Any change under root `skills/**` needs the Pi package version bump + CHANGELOG companion row in the same PR; a schema change needs its own version bump + mirrored types/schema | repository | `scripts/version-parity-gate.mjs:10,36`; `AGENTS.md` §Packages, :258 | `39e2aa3a` | O9, P6 | current | proven | — |
| PE-011 | The standing "never `S1`/`S2`" guide rule governs phase labels; `#308`'s `S#` are requirement ids, so `AGENTS.md`/`PLAN.md` wording is amended in P6 rather than blocking the format | document | `AGENTS.md` "Phases are P1, P2, …"; `skills/unit-lane/references/PLAN.md` checklist; `#308` §Summary; assumption `A4` | `39e2aa3a` | O8, P6 | current | proven | owner can correct `A4` |
| PE-012 | Red-first is the repo rule (tests before implementation with the expected behaviour), so P1 pins and fixtures land before any implementation phase | repository | `AGENTS.md` (project instructions: "Do tests before implementation") | current | O7, O10, P1 | current | proven | — |
| PE-013 | The owner reviews the converted fixture corpus before this repository's own workflow docs are re-cut — the implementer never verifies its own format change | user | `#308` §Validation without dogfooding; owner answers `D1`, `D2` | 2026-10-21 | O2, P2 | current | decision | AC7 decision row, recorded at P2 entry |

## Prior-decisions contradiction sweep (plan stage)

Candidate sources checked: no Normalized Repository State artifact is installed
(`find docs -iname "*normalized*"` → only the feature-18 folder), no
architectural-invariants doc is installed, this unit carries no legacy
`## Design status` marker (0 hits), and the prior `decisions.md` of the same
area was read (`77-promise-coherence-guard` D-77-1, `fix/303` stages).

| claim | prior decision | source path | relation |
|---|---|---|---|
| the machine moves with the published template in the same PR (Q1=A) | D-77-1: a published surface the machine refuses is the defect, "required since #305", never a tolerated extra | `docs/features/77-promise-coherence-guard/decisions.md` D-77-1 | compatible |
| one unit carries all five scope items (Q2=one-unit) | #307 layer 1: substantial work tracks in ONE recoverable feature document | issue #307 §The hybrid | compatible |
| `S#` requirement ids are written into SPEC and Tasks | "Phases are `P1, P2, …`, never `Steps`/`S1`" — the rule's stated scope is *phase labels* in plans/specs | `AGENTS.md`; `skills/unit-lane/references/PLAN.md` checklist | scoped — the letter needs the P6 wording amendment (PE-011), the intent (stable phase labels for executors) is preserved by keeping `P#` for phases |
| closed units are never migrated and keep validating | #308 Non-goals ("No migration of closed/historical unit docs") + the dual-shape acceptance of `D1` | issue #308; `decisions.md` D1 | compatible |
| tests are written before implementation (P1 first) | "Do tests before implementation with the expected behaviour and features" | `AGENTS.md` (project instructions) | compatible |
| one PR per unit against `main`, conventional commits | "One PR per unit of work, always against `main` … conventional commits" | `AGENTS.md` (Working rules) | compatible |

No `contradicts` hit needs `resolve-repository-state` or a `NEEDS-DECISION`:
the only letter-level tension (the `S#`/`P#` wording) is carried by PE-011 /
assumption `A4` and repaired in P6.
