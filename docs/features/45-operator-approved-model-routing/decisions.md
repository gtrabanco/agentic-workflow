# 45 — Decisions

> Product and engineering decisions for feature 45.

## AD-45-001 — Fallback default when model unavailable

- **Decision**: inherit (orchestrator's model)
- **Rationale**: safest path — the operator explicitly approved the orchestrator's model for the command; using it preserves correctness.
- **Date**: 2026-09-08

## AD-45-002 — Config granularity: per-skill

- **Decision**: per-skill, not per-pass
- **Rationale**: adversarial reviews spawn N parallel passes of the same skill — they share one chain, and the orchestrator distributes models round-robin from that chain. Per-pass would require the operator to enumerate every pass name.
- **Date**: 2026-09-08

## AD-45-003 — Global fallback location: extends `default`

- **Decision**: `default` accepts an array (extends existing shape)
- **Rationale**: avoids a new top-level key; `default` already represents the global fallback for commands.
- **Date**: 2026-09-08

## AD-45-004 — `auto` inclusion

- **Decision**: included in the model vocabulary, documented as operator-delegated
- **Rationale**: the operator explicitly wrote `"auto"` — it's a conscious choice to delegate, not a gap.
- **Date**: 2026-09-08

## AD-45-005 — Adversarial model distribution

- **Decision**: round-robin from the per-skill chain; wraps when N > chain.length
- **Rationale**: simple, deterministic, no new configuration needed.
- **Date**: 2026-09-08

## AD-45-006 — Unavailable-model and chain-exhaustion semantics (repair, SF-45-004)

- **Decision**: an ordered chain is tried in the operator's order and the first
  usable model wins (spawn-time, consuming skill's contract); a chain exhausted,
  empty, or absent degrades the pass **inline at the orchestrator's model** with
  the degrade stated in the report — never exit non-zero, never a spontaneous
  unapproved spawn. `resolve-passes` is an offline producer: it applies
  schema-level resolution only and exits non-zero only for config the strict
  validator rejects; `default: []` behaves as an absent default. Operationalizes
  AD-45-001 and issue #201's fail-closed rule (Mechanics 1 and 3).
- **Rationale**: the reviewed AC4/expectation 4 ("empty/exhausted chain exits
  non-zero") contradicted the recorded fallback decision AD-45-001; a
  deterministic offline producer cannot sample runtime availability, so
  availability judgement belongs to the consuming skill at spawn-time.
- **Date**: 2026-09-09

## AD-45-007 — `auto` and the project-trust gate (repair, SF-45-013)

- **Decision**: `auto` carries no gate of its own — it is honored exactly where
  its config file is honored. The pi package's project-trust gate refuses to
  read an untrusted project's config file at all
  (`packages/pi-agentic-workflow/src/config/load.ts`, S11 — "a cloned
  repository must not be able to steer routing"), and the settings console
  refuses project-scope edits while untrusted
  (`src/settings/console.ts:156`), so an untrusted project's `passes` entry
  (`"auto"` included) can never delegate model choice. `"auto"` in the global
  file is operator-written (AD-45-004). Resolves issue #201's open question
  ("Should `auto` be refused while the project is untrusted? Proposed: yes")
  as yes-by-construction: the gate the question proposed already exists at
  config-load time; a second, dedicated `auto` gate would be unreachable dead
  code. No scope added or removed — AD-45-004's meaning of the value is
  unchanged.
- **Rationale**: closes the inherited open question with repository evidence;
  the alternative (a new dedicated gate) would be a product change this repair
  does not take.
- **Date**: 2026-09-09

## Repair batch v3 — 2026-09-09 (SF-45-016…SF-45-018, response to RS-45-03)

One batch over the full open findings set (two low + one info); all classified
`product`.

- **Closure completion (REPAIR class 2, evidence acquired)** — SF-45-016
  (AC15 added, command-verified: the post-install recommendation note in the
  two named non-bootstrapping surfaces — `skills/ship-roadmap/references/MODEL_ROUTING.md`
  and `docs/workflow/GOLDEN_FIXTURE.md` — now has an observing criterion;
  in-scope item 6 maps 6→AC7/AC15; surfaces verified to exist at HEAD),
  SF-45-017 (AC16 added, command-verified: an unknown pass name under `passes`
  → exit ≠ 0 per the strict-validator rule, the inherited test obligation from
  issue #201's Tests first — "unknown pass names rejected per the
  strict-validator rule"; in-scope item 2 maps 2→AC2/AC5/AC12/AC16, item 8
  extends to AC16, expectation row 12's pointer extended to AC12 + AC16).
- **Mechanical, intent-preserving (REPAIR class 1)** — SF-45-018 (AC9's
  illustrative shape fixed to the described shape: the example is now a
  non-ModelRef element inside the `default` array
  (`"default": ["nan/glm5.3-flash", 42]`) instead of the object value it
  showed, so an implementer cannot test only the illustrated shape and leave
  the described array-element case untested; criterion decidable both ways
  before, unchanged in substance).
- **Not done here**: no product change taken, no scope widened, no
  counter-evidence dismissal, no receipt text touched; findings resolved via
  the status/resolution columns only.
- **Evidence**: `skills/ship-roadmap/references/MODEL_ROUTING.md` +
  `docs/workflow/GOLDEN_FIXTURE.md` verified to exist at HEAD (SPEC Evidence
  row E12 added); issue #201 Tests first re-read via `gh issue view 201`
  (2026-09-09, frozen already in E1).

## Repair batch v2 — 2026-09-09 (SF-45-012…SF-45-015, response to RS-45-02)

One batch over the full open findings set; all four classified `product`.

- **Mechanical, intent-preserving (REPAIR class 1)** — SF-45-012 (AC4's
  trailing clause "chain holds only invalid references → same inline result
  with a per-pass reason" removed: it contradicted semantics §3 + AC12 and was
  unimplementable for an offline producer; AC4 + semantics §4 now reserve the
  per-pass reason `no default chain` for schema-level degenerate chains —
  absent/empty `default`, or an entry that yields no chain — while invalid
  references stay validator rejections (AC12) and runtime unavailability stays
  spawn-time (AC6); this refines issue #201's "chain of unresolvable refs →
  inline with reason" fixture wording, preserving the fail-closed inline
  outcome AD-45-006 already recorded), SF-45-014 (Evidence row E7 refreshed:
  roadmap row 45 reads `defined`, deps `43` — the status this feature's repair
  batch itself wrote — instead of the stale `idea`), SF-45-015 (vocabulary
  note: AD-45-002's "per-skill, not per-pass" phrasing was imprecise — the
  SPEC's `passes` map is keyed by the closed pass-name vocabulary of issue #201
  Mechanics 1 (`review-*` finders, `verify`, `classify`, `debt`), entries are
  optional per-pass-name overrides (no entry → `default` chain), and the
  contrast AD-45-002 draws is per-subagent-instance granularity: all instances
  of one pass name share one chain. The SPEC's §Product decisions restatement
  ("per pass name, not per subagent instance") is the correct framing;
  AD-45-005's "per-skill chain" reads as the per-pass-name chain).
- **Closure completion (REPAIR class 2, evidence acquired)** — SF-45-013
  (AD-45-007 appended: issue #201's open question resolved yes-by-construction
  from `load.ts` S11 + `console.ts:156`; semantics item 5, sweep row 13, AC14
  read-verified, Evidence row E11 added).
- **Not done here**: no product change taken (the dedicated-gate alternative
  for `auto` was not adopted), no counter-evidence dismissal, no receipt text
  touched, findings resolved via the status/resolution columns only.
- **Evidence**: issue #201 fetched 2026-09-09 (Mechanics 1, Tests first, Open
  questions); `packages/pi-agentic-workflow/src/config/load.ts` +
  `src/settings/console.ts:156` read at HEAD.

## Repair batch — 2026-09-09 (SF-45-001…SF-45-011)

- **Mechanical, intent-preserving (REPAIR class 1)** — SF-45-001 (dependency
  pointers corrected: feature 196 → feature 43/issue #196, feature 154 → issue
  #154), SF-45-002 (roadmap row 45 → `defined`, deps `43`), SF-45-005 (AC12
  tested an actually-unknown root key; `passes` is a known key of this feature),
  SF-45-006 (producer home = feature 43's `aw resolve-passes` with `.mjs`
  fallback, per issue #196; `packages/agentic-workflow` references removed),
  SF-45-008 (AC1/AC3 made objective; AC6 labelled `read-verified`), SF-45-009
  (tooling row attributes pi config validation to
  `packages/pi-agentic-workflow/src/config/schema.ts`), SF-45-010 (placeholder
  grep re-run bounded to the Product half as the box states), SF-45-011
  (Engineering half restored to template state — plan-feature writes it after a
  review PASS). Reviewed product intent unchanged in all of these.
- **Closure completion (REPAIR class 2, evidence acquired)** — SF-45-003
  (`docs/CAPABILITIES.md` exists unseeded: its 13 subsystem rows walked one-by-one
  plus 6 derived project subsystems; seeding the file offered to the user,
  init-workspace's job), SF-45-004 (semantics clarified as AD-45-006 above; AC4
  and expectation row 4 aligned to the recorded intent), SF-45-007 (AC13 added
  observing in-scope item 7 — GOLDEN_FIXTURE.md pass-routing smoke test).
- **Evidence**: issues #196, #201, #154 fetched 2026-09-09 (SPEC `### Evidence`
  rows frozen); roadmap rows and `packages/` inspected at HEAD.
