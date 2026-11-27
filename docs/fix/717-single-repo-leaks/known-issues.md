# 717 — single-repo-leaks · known issues

Pre-existing issues and findings this unit deliberately leaves open, each with
its re-trigger condition. A row here is not an excuse for a red gate: it names
what was measured and who owns it.

## K1 — the phase-lint layer map is this repository's tree

**Measured.** `packages/agentic-workflow/src/runner/sensors/phase-lint.mjs:269`
maps a target to a layer by this repository's prefixes only; a consumer target
under `src/**` maps to `null`.

**Decision.** `D4` — the phase-block grammar is product-construction-only, so
the map is correct *for its grammar*; the consumer shape (unit-doc) never reads
it. The refusal is now named (`layer-unknown`). A project that wants the
cross-layer check for its own tree needs a declared map.

**Re-trigger.** A project writes the phase-block grammar with real layer
declarations and foreign-tree targets, or a consumer reports `layer-unknown` as
a blocker. Then the declared-map unit (`phaseLint.layers` in the unified config)
opens, with `D4` as its authority to revisit.

**Affects.** This unit's S5 criterion is satisfied by the decision plus the named
refusal; nothing else here depends on the map.

## K2 — the obligation-tag estate discovers only `scripts/` and `packages/*/test/`

**Measured.** `packages/agentic-workflow/src/test-obligation-tags/index.mjs:78`,
`:435-451` — the two legs are this repository's layout.

**Decision.** `D5` — the repair in this unit is the fail-closed half: an estate
that discovers nothing refuses `estate-empty` (`S6`) instead of passing. The
leg redesign (declared suite roots, or discovery of co-located suites) is a
behaviour change with its own regression surface.

**Re-trigger.** A consumer runs the gate and cannot declare its suite roots, or
the repository's own estate grows a third tree the two legs miss.

**Affects.** S6 only in that the empty case now refuses; no other criterion reads
the estate.

## K3 — audit 2 F2 attributes all five report-only advisory rows to undici

**Measured.** `docs/audits/2-2026-11-16.md` F2; the pass reports four undici rows
plus one minimatch row.

**Decision.** Pre-existing at the base commit `67133da45`; the row belongs to the
next audit's correction block, not to this unit.

**Re-trigger.** The next product audit of equivalent scope.

**Affects.** Nothing here — this unit runs no advisory pass.

## K4 — the roadmap row for `#716` reads `pending` while the issue is closed

**Measured.** `docs/ROADMAP.md` row `716 \| batch-scheduler-surface-vocab` →
`pending`; `gh issue view 716 --json state` → `CLOSED` since 2026-11-26.

**Decision.** The row's settle is unit 716's own close-out work. This unit reads
the roadmap and records what it found; rewriting another unit's row is the
`audit-docs` low-risk repair route, not this change.

**Re-trigger.** The next `audit-docs` run, or unit 716's settle.

**Affects.** Nothing here — this unit's own row is written through the emitter
(`P9`).

## K5 — the citation face is documented, not enforced

**Measured.** `skills/<name>/references/…` owner citations appear in prose a
consumer receives (`PE-007`); `S8` asks whether a consumer-side resolution rule
is owed.

**Decision.** The rule is stated once (`O10`). No gate enforces it: the
occurrences are prose, and a lexical allowlist would measure wording (`D3`).

**Re-trigger.** A consumer report of an unresolvable owner path, or a review
finding that the rule is being restated rather than cited.

**Affects.** S8's criterion is the rule's presence plus `skill-lint` green.
