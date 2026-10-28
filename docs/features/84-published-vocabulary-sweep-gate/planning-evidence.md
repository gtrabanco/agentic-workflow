# Planning evidence — unit 84 (published-vocabulary-sweep-gate)

M/L unit: this file is the planning-evidence ledger (sizing rule,
`skills/unit-lane/references/PLAN.md`). Row shape and vocabularies are owned by
`skills/pre-execution-review/references/LEDGERS.md` §1; ids are stable
(`PE-nnn`) and renumbering is a replan.

| id | claim-or-obligation | authority-kind | source-and-location | observed-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|---|
| PE-001 | `promise-coherence.mjs` is the sole claim gate; this unit extends its closed `CLAIM_KINDS`/`REASON_CODES` rather than adding a second guard | repository | `scripts/promise-coherence.mjs:86-110`; `docs/features/77-promise-coherence-guard/SPEC.md` §Future cost (closed-set rule) | `main` @ 2026-10-27 | O3, O4, P3 | current | proven | — |
| PE-002 | The Future-status vocabulary is published in prose in three+ surfaces with no parser (the F40 class is live and unpinned) | repository | `docs/features/_TEMPLATE/SPEC.md:46-52`; `docs/fix/_TEMPLATE/SPEC.md:58-64`; `packages/agentic-workflow/src/edit/UnitDoc.mjs:70,150`; `docs/features/79-spec-by-reference/SPEC.md:161,168` | `main` @ 2026-10-27 | O1, O5, P1, P2 | current | proven | — |
| PE-003 | The LOG_KINDS precedent is the established machine-pin pattern: one owner const, parity tests pinning every prose second copy | repository | `scripts/unit-doc-phases.mjs:209`; `scripts/spec-by-reference.test.mjs:265-285`; `scripts/phase-lint.mjs:65,835` | `main` @ 2026-10-27 | O1, O2, P1 | current | proven | — |
| PE-004 | The `normative-surfaces@1` inventory is parsed fail-closed by `normative-drift.test.mjs`; new inventory rows extend the machine surface, and `must-name`/`grammar` cells have a fixed shape | repository | `AGENTS.md:321-356`; `scripts/normative-drift.test.mjs` (parses the block, fails closed) | `main` @ 2026-10-27 | O1, P1 | current | proven | — |
| PE-005 | The F37/F38/F39 instances are already repaired on `main` (shared `parseLog` reader; one `flattenCell` class on every echo path), so S3 pins the pattern, never repairs instances | repository | `scripts/workflow-status.mjs:788-840` (`readLogMarks` via `parseLog`; `bounded()` via `flattenCell`) | `main` @ 2026-10-27 | O6, P5 | current | proven | — |
| PE-006 | Any `skills/**` change requires the pi-package version bump + CHANGELOG companion row in the same PR (content half of the parity gate) | repository | `AGENTS.md` §Packages; `scripts/version-parity-gate.mjs` | `main` @ 2026-10-27 | O7, P4 | current | proven | — |
| PE-007 | Any new published vocabulary must be mirrored in the schema package (types + `envelope.schema.json` + version bump, same PR) | user | issue #315 AC5; `AGENTS.md` §Verification (schema bullet) | issue as filed | O5, O8, P3 | current | decision | — |
| PE-008 | Red-first: pins and fixtures land before the probe/gate code that must reject them | user | `AGENTS.md` (project instructions: "Do tests before implementation"); precedent PE-012 of unit 79 | current | O9, P1, P2, P3, P5 | current | decision | — |
| PE-009 | The sweep declaration belongs in the fold's `## Log` entry (`F` line's fold commit + verified span), parsed by the gate's log reader | repository | `log-kind@1` (`F` token) in `docs/features/_TEMPLATE/SPEC.md` + `docs/fix/_TEMPLATE/SPEC.md`; `docs/features/79-spec-by-reference/SPEC.md` `## Log` F-line shape | `main` @ 2026-10-27 | O3, P3 | current | proven | — |
| PE-010 | One unit carries all four scope items as one M-sized PR against `main`; the whole-unit diff guard is met per-phase or by a recorded exception, never a shrunk diff | user | issue #315 (single coherent enforcement half); `AGENTS.md` Working rules (one PR per unit, never on `main`); precedent: unit 79 D2 | issue as filed | O10, P1–P7 | current | decision | — |

## Prior-decisions contradiction sweep (plan stage)

Candidate sources checked: no Normalized Repository State artifact is installed
(`find docs -iname "*normalized*"` → only the feature-18 folder), no
architectural-invariants doc is installed, this unit carries no legacy
`## Design status` marker, and the prior `decisions.md` of the same area was
read (`77-promise-coherence-guard` D-77-1; `79-spec-by-reference` D1–D5).

| claim | prior decision | source path | relation |
|---|---|---|---|
| the sweep gate extends `promise-coherence.mjs`, never forks it | D-77-x / unit 77 Future cost: the guard's claim kinds are a closed set; adding one is a SPEC change in the owning reference, never a new branch in the script | `docs/features/77-promise-coherence-guard/SPEC.md` §Future cost | compatible |
| closed unit docs are never rewritten by the probe (D3) | unit 79 F40 fold: the live `kept deferred` tokens were left as recorded debt with a re-trigger condition, "closed units stay closed" | `docs/features/79-spec-by-reference/review-findings.md:242,447` | compatible |
| schema-package consts are the canonical vocabulary home (D2) | AGENTS.md mirror rule: any schema-envelope change is mirrored (types + schema + version bump, same PR) | `AGENTS.md` §Packages, §Verification | compatible |
| pins are pattern-level, instances stay repaired (PE-005) | unit 78/79 folds moved the readers onto the shared helpers — the durable residue is the pattern, per issue #315 scope item 3 | issue #315 §In scope 3 | compatible |
| one PR against `main`, conventional commits, tests before implementation | standing repo rules | `AGENTS.md` Working rules + project instructions | compatible |

No `contradicts` hit needs `resolve-repository-state` or a `NEEDS-DECISION`.
