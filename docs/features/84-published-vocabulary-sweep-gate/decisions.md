# Decisions — unit 84 (published-vocabulary-sweep-gate)

The question ledger (`open-questions@1`, the grammar `scripts/needs-input.mjs`
reads), the resolutions the decide stage recorded, and the assumptions taken
instead of asking. Append-only: a superseded entry gets a new row naming it.

open-questions@1
id | date | type | question | blocks | search-receipt | options | route
Q1 | 2026-10-27 | open-question | Allowlist shape for sweep greps: may the stale form appear only inside fenced quotes (fenced-quote-only), or is an exact-line allowlist kept? | The sweep claim kind's parser, its fail-closed reason and the FOLDING.md box all encode this shape; changing it after P3 lands means re-cutting the grammar and every emitted declaration | `scripts/promise-coherence.mjs:86-110` (closed kind/reason vocabularies the shape extends); issue #315 §Open questions (the question itself + "typically 0 outside an explicit allowlist: the ledger's own quote of the finding, log lines, fixtures"); `log-kind@1` fenced-quote convention in the unit-doc template | A — fenced-quote-only: a stale form may appear only inside a fenced code block (the fold's own evidence quote, log lines, fixtures); anything else counts toward `expected <n>` — stricter, and the F35 class (byte-identical copy outside the quote) can never hide behind an allowlist row \| B — exact-line allowlist: the declaration lists file:line exemptions — more flexible, but allowlists rot and each stale copy needs a human to re-judge \| Decide for me \| Explain the options | design
Q2 | 2026-10-27 | open-question | Where the canonical vocabulary sets live: schema-package consts the prose surfaces cite, or grammar blocks in the templates? | P1's declarations, the parity tests and the schema-mirror obligation (AC5) all hang off this home; moving it after packages consume the consts is a published-surface change | `AGENTS.md` §Packages ("schema package mirrors any new published vocabulary (types + `envelope.schema.json` + version bump, same PR)"); `scripts/unit-doc-phases.mjs:209` + `scripts/spec-by-reference.test.mjs:265-285` (the LOG_KINDS precedent lives in a script const, pinned by tests); issue #315 §Open questions ("decide at the plan step") | A — schema-package consts are canonical (`packages/agentic-workflow-schema/src/`), root scripts and templates cite them, parity tests pin every second copy, mirror rule applies by construction \| B — grammar blocks in the templates are canonical — no package change, but the schema mirror becomes a second copy to keep in sync by hand \| Decide for me \| Explain the options | unit-lane
Q3 | 2026-10-27 | open-question | Does the vocabulary probe scan every unit doc including closed ones (S1 says "every unit doc"), or only open units + fixtures? | P2's corpus decides whether the live `kept deferred` tokens in closed unit 79 fail the root suite on day one, and whether any closed unit can ever turn the suite red retroactively | issue #315 §In scope 1 ("across every unit doc") vs §Out of scope ("no historical unit doc is rewritten … closed units stay closed"); `docs/features/79-spec-by-reference/SPEC.md:161,168` (live off-vocabulary token in a closed unit, recorded debt at `review-findings.md:447`); `scripts/roadmap-settle.mjs` (status source for open vs done) | A — open units + fixtures: the probe resolves each unit's status from the roadmap/index and skips `done` rows; a closed unit's off-vocabulary token is recorded debt, never a retroactive red suite \| B — every unit doc: maximally literal to S1, but the suite goes red on unit 79's recorded debt immediately, and the only repair rewrites a closed unit doc — the exact thing the issue's non-goal forbids \| Decide for me \| Explain the options | design
D1 | 2026-10-27 | decision | Q1 | lane decision under the owner's issue delegation (issue #315 §Open questions flags the question; the resolution ladder's tier-2 cost filter rates it cheap-to-change: the shape lives in one parser + one grammar block) | recorded here (this file) | A — fenced-quote-only: the stale form counts everywhere except inside fenced code blocks (the fold's own evidence quote, log lines, fixtures); no exact-line allowlist exists to rot, and the F35 class cannot hide outside a quote | B — exact-line allowlist: discarded — allowlist rows rot, each stale copy needs re-judging, and "typically 0" becomes "typically 0 plus N rotting rows"
D2 | 2026-10-27 | decision | Q2 | lane decision under the owner's explicit delegation in issue #315 §Open questions ("decide at the plan step") | recorded here (this file) | A — schema-package consts are canonical, prose surfaces and root scripts cite them, parity tests pin every second copy, and the AGENTS.md mirror rule applies by construction | B — template grammar blocks as canonical: discarded — the schema mirror would become a hand-synced second copy, recreating the drift the parity pins exist to kill
D3 | 2026-10-27 | decision | Q3 | lane decision from the issue's own pair of constraints (S1 "every unit doc" vs §Out of scope "closed units stay closed"); cheap to widen later by changing one status filter | recorded here (this file) | A — the probe's corpus is open units + fixtures; closed units are skipped via the roadmap status source, and a closed unit's off-vocabulary token stays recorded debt with its re-trigger condition | B — scan every doc: discarded — it fails the suite on unit 79's recorded debt today and forces a closed-unit rewrite the issue forbids

## Justifications

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/vocabulary-probe.mjs | P2 | 2026-10-27 | execute-phase | S1's validator probe is a new deterministic script; the issue mandates it as a root-suite gate, not an edit to an existing one
justification | scripts/vocabulary-probe.test.mjs | P2 | 2026-10-27 | execute-phase | the probe's owning suite (frozen-failure corpus: the F40 reproducer must fail it first)
justification | scripts/vocabulary-parity.test.mjs | P1 | 2026-10-27 | execute-phase | the parity pins for every second copy of each declared set (the F22/LOG_KINDS pattern, S1/AC1)
justification | scripts/structural-sibling-pins.mjs | P5 | 2026-10-27 | execute-phase | the pin implementations (heading-search allowlist scanner, flatten-coverage scanner) shared by the pin suite
justification | scripts/structural-sibling-pins.test.mjs | P5 | 2026-10-27 | execute-phase | the negative-capability pin suite (S3/AC3): each pin fails on a fixture reintroducing the F37/F38/F39 pattern
justification | scripts/promise-coherence.test.mjs | P3 | 2026-10-27 | execute-phase | S2 extends the gate's closed claim-kind vocabulary: the sweep cases and the frozen-set deepEqual are the conscious-set-change path the closed-set test exists to force
justification | scripts/fixtures/vocabulary-probe/tree/docs/features/91-clean-future/SPEC.md | P5 | 2026-10-27 | execute-phase | review F6's fold: the clean fixture gains a fenced off-vocabulary quote so the shared fence-aware reader (the one path `openFence`/`closesFence` now owns) is proven to exempt the fold's own evidence — without the case, routing the probe onto the helper is unpinned
```

## Assumptions

Cheap defaults taken instead of asking, dated and correctable:

- **A1 — 2026-10-27** — `scope: medium` in the frontmatter, from the issue's
  "(M)" label; it puts the release step (and P7's settle task) in triage. If
  the owner rates the unit `standard`, re-triage
  (`bun scripts/unit-route.mjs --triage 84 --retriage`) and P7 drops.
- **A2 — 2026-10-27** — the vocabulary probe ships as
  `scripts/vocabulary-probe.mjs` with suite `scripts/vocabulary-probe.test.mjs`
  (names may follow the owning tree's conventions at cut time; the validator
  span is metadata, the behavior is the contract).
- **A3 — 2026-10-27** — the memory probe returned `degraded`
  (session-ambiguity check failed, 1+20 findings). Recorded per the memory
  protocol §1/§7; unit work never blocks on the mirror, and boundary saves are
  retried at the next boundary if the layer answers.
