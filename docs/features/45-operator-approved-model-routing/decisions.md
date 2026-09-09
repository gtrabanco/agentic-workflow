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

## AD-45-008 — Pass-entry `thinking` semantics (repair, SF-45-022)

- **Decision**: a pass entry's `thinking` accepts exactly the route vocabulary
  already shipped — a Pi thinking level `off|minimal|low|medium|high|xhigh|max`
  or `"inherit"` (`packages/pi-agentic-workflow/src/config/types.ts`
  `THINKING_LEVELS`/`ThinkingSetting`; the package README documents the same
  list for today's routes) — as a **single scalar only** (no array/chain: a
  model chain falls back over model availability, which a thinking level does
  not have), carried verbatim into the resolved table; an **absent** `thinking`
  key (or absent pass entry) resolves to `"inherit"`, mirroring the shipped
  default route `{"model": "inherit", "thinking": "inherit"}`; a pass resolved
  `inline` carries `thinking: "inherit"` as well. Non-scalar or unknown values
  are strict-validator rejections at `$.passes.<name>.thinking` (invalid-types
  class — no new rejection class). Issue #201 Mechanics 1 names `{model,
  thinking}` but enumerates only `model`'s values; this fills that gap without
  changing scope — `thinking` was already committed in-scope (SPEC in-scope
  items 2 and 4) and merely undefined.
- **Rationale**: the resolved table is a product-visible output (AC8's byte
  stability cannot catch wrong `thinking` content), so the implementer must not
  guess values, shapes, or absence behaviour; reusing the shipped route
  vocabulary avoids inventing a second thinking vocabulary for one platform.
- **Date**: 2026-09-09

## Repair batch v5 — 2026-09-09 (SF-45-020…SF-45-022, response to RS-45-05)

One batch over the full open findings set (two low + one medium); all three
classified `product`. Route honored from RS-45-05's printed CONVERGENCE-ANOMALY
("Route to owner: design-feature repair batch v5 — ONE batch over the full open
set, then /review-spec re-review of the new snapshot").

- **Closure completion (REPAIR class 2, evidence acquired)** — all three:
  - SF-45-020: issue #201's README/CHANGELOG affected-surface pair **claimed in
    scope** per the operator's dated instruction (2026-09-09: "claim the
    README/CHANGELOG affected-surface pair (in scope or an explicit
    out-of-scope row with an owner)") — in-scope item 9 added, derived-subsystem
    row "Package documentation" added, sweep row 14 added, AC19 added
    (command-verified, anchors pre-verified at HEAD `e13096d3`: `"passes"` → 0
    matches in both package READMEs, CHANGELOG anchor → 0/0, exit 1 — the
    pre-verified anchoring SF-45-019 introduced). Scope alignment, not widening:
    the pair is on issue #201's own affected-surface list (frozen in E1), so
    the SPEC now covers the issue it implements. Evidence row E13 added.
  - SF-45-021: AC17 added (command-verified) — invalid model reference → exit
    ≠ 0 reported at `$.passes.<name>.model` (issue #201 Tests first reporting
    shape), for both the bare-`"nope"` scalar and the non-`provider/modelId`
    chain-element shapes; semantics §3's fourth rejection class now observed;
    pointers extended (in-scope 2, item 8, sweep row 12).
  - SF-45-022: AD-45-008 appended (above) + new SPEC subsection "Pass-entry
    `thinking` semantics" (valid values, accepted shape, absent-entry
    resolution); AC18 added (command-verified) observing explicit-value
    carriage, absent → `"inherit"`, and non-scalar rejection; in-scope item 4
    now states the resolved table carries both fields; Evidence row E14 added.
- **Mechanical, intent-preserving (REPAIR class 1)** — none in this batch; every
  repair added previously-missing coverage (class 2). Spec-lint count updates
  (sweep 13→14, ACs 16→19, derived subsystems 6→7, in-scope items 8→9) are
  bookkeeping of the additions, dated here.
- **Not done here**: no counter-evidence dismissal, no receipt text touched, no
  forge issue created, no engineering content written; findings resolved via the
  `status/resolution-evidence/resolving-artifact-revision` columns only. One
  repair-class note: defining `thinking`'s semantics was directed by the
  operator's dated instruction ("record thinking's semantics (valid values,
  accepted shapes, absent-entry resolution in the table)") and is grounded in
  shipped code (`types.ts`) — no product change beyond what the reviewed in-scope
  set already committed.
- **Evidence**: issue #201 re-read 2026-09-09 via `gh issue view 201` (Summary,
  Mechanics 1, Tests first, Affected surfaces, Open questions — matching frozen
  E1); `packages/pi-agentic-workflow/src/config/types.ts` + `src/config/schema.ts`
  + `README.md`/`README.es.md` + root `CHANGELOG.md`/`CHANGELOG.es.md` read at
  HEAD `e13096d3`; greps for AC19's anchors run at the same HEAD (0 matches,
  exit 1).

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

## Repair batch v4 — 2026-09-09 (SF-45-019, response to RS-45-04)

One finding, one batch; classified `product`, class 1 mechanical, intent-preserving
(the finding itself names the class and states the recommendation work is fine).

- **Mechanical, intent-preserving (REPAIR class 1)** — SF-45-019: AC15's
  universal match-quantifier ("≥ 1 match in each file, and each match is a
  recommendation") was unsatisfiable — the broad pattern `"pass routing\|passes"`
  already matches unrelated prose (`GOLDEN_FIXTURE.md:252`, the stored-audit
  "passes only when it states a reason" sentence), so once the recommendation
  note lands the grep yields a non-recommendation match and no implementation
  can satisfy the criterion. Rewritten to anchor on the recommendation phrase:
  `grep -in "pass.?routing" …` → ≥ 1 match in each file, the matched line(s)
  form the recommendation note (not auto-written) pointing to `default` +
  `passes`, with bare-`passes` prose matches (GOLDEN_FIXTURE.md:252) explicitly
  out of scope. Verified at HEAD `1ad375dd`: `grep -in "pass.?routing"` → zero
  matches in both files today (the note is genuinely new work, so ≥ 1 match per
  file is achievable and decidable once it lands). The recommendation work, its
  two surfaces, its not-auto-written property, and every pointer (in-scope item
  6 → AC7/AC15, spec-lint label counts 16/16) are unchanged.
- **Not done here**: no product change, no scope widening, no receipt text
  touched, no counter-evidence dismissal, no forge issue; findings resolved via
  the status/resolution columns only.
- **Evidence**: `grep -in "pass.?routing" skills/ship-roadmap/references/MODEL_ROUTING.md docs/workflow/GOLDEN_FIXTURE.md` run 2026-09-09 at HEAD `1ad375dd` (0 matches, exit 1); the reviewer's broad-pattern run at `fcfd5263` (SF-45-019 evidence column).

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
