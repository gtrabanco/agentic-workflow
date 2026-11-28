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

## K6 — the crate suite's document/embedding legs are red at the base commit on this box

**Measured.** At the head, `crate-suite-bun` fails 3 cases in
`packages/agentic-workflow/test/doc.query.test.mjs` (`returns rows with path,
section, lines, score, meta`, `answers offline with no key and no network`,
`answers offline at the CLI level too`) and 6 in `doc.hybrid.test.mjs` (the
`--rebuild`/sync/provider-down family). At the base commit `67133da45`, in a
separate `git archive` checkout with its own `bun install --frozen-lockfile` and
`bun run build`, the **same** suites fail the **same** 3 + 6 cases with identical
names (only timings differ).

**Decision.** Pre-existing and environment-dependent (no embedding provider /
offline on this host), not this unit's change; the failing sets are compared by
name, not by count. The gate cannot exit 0 on this box for that cause, so the
verification block reports the 17 steps that pass and these three by name.

**Re-trigger.** A host with the embedding provider configured, or the unit that
owns the doc/embedding offline answers.

**Affects.** Nothing in this unit: no obligation's validator is a document or
embedding case.

## K7 — `pi-node-compat` is red at the base commit too, and flaky in count

**Measured.** `cd packages/pi-agentic-workflow && bun run test:node` fails 11
tests at the base commit `67133da45` and 6 at this head, all in the
embedding-profile family (`embed-profile-default-on`, `withhold`, `tuning`,
`#719 AC6`). The failing set shifts between runs — each case resolves a provider
from the environment.

**Decision.** Pre-existing and environment-dependent; the count differs because
the cases read the host's provider configuration, not because this change moved
them.

**Re-trigger.** A host with a pinned provider, or the unit that owns the
embedding profile's environment resolution.

**Affects.** Nothing here: this unit touches no file under
`packages/pi-agentic-workflow/`.
