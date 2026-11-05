# Obligations — unit 82 (relay-lane-execution)

M/L unit: this file is the obligations ledger (sizing rule,
`skills/unit-lane/references/PLAN.md`). Row shape, vocabularies and the status
lifecycle are owned by `skills/pre-execution-review/references/LEDGERS.md` §2;
ids are stable (`O1`, `O2`, …) and renaming one is a replan. Every row is
`planned` at cut time; before the unit ships every row is `verified` (or an
evidenced `n/a`), and each `status` flip cites the run recorded in `## Log`.

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1 / S14 / PE-009 | A code unit's triage offers the relay bootstrap only when pi-web is detectable, and names the packet path plus the leg-1 dispatch | P4 | P4 | execute-phase | `bun test scripts/relay-route.test.mjs` exits 0 | the two fixtures (`PI_WEB_SESSION` set/unset) named in the suite | verified |
| O2 | S2 / S11 / PE-002 / PE-006 | Each leg's tier comes from `scripts/catalog.json` only: the execute leg reads the `implement` row, the coherence-review leg the `review` row | P3 | P3 | execute-phase | `bun scripts/relay-packet.mjs tiers 20-relay-unit --repo scripts/fixtures/relay-packet` exits 0 | the printed `execute: cheap` + `coherence-review: strong` lines in the log's `E` entry | verified |
| O3 | S3 / PE-003 | The plan/continuity split is stated once, in `RELAY.md` §Ownership, and no other surface restates it | P5 | P5 | execute-phase | `rg -c '^## Ownership' skills/unit-lane/references/RELAY.md` matches 1 | the section present at that path | verified |
| O4 | S4 / PE-001 | A charter that restates a `P<n> —` task bullet, a `## Tasks` section or a gate list fails the check; a pointer-shaped charter passes | P3 | P3 | execute-phase | `bun test scripts/relay-packet.test.mjs` exits 0 | the rejected-charter fixture and the accepted pointer charter, both named in the suite | verified |
| O5 | S5 / PE-001 | A baton duplicating an Evidence row (`\| AC \|` table) fails; a baton carrying a phase cursor plus pointers passes | P3 | P3 | execute-phase | `bun test scripts/relay-packet.test.mjs` exits 0 | the duplicated-row fixture and the accepted baton, both named in the suite | verified |
| O6 | S6 / PE-003 | `decisions.md` is optional and never required: a packet without it passes, and its presence is never a checklist item | P3 | P3 | execute-phase | `bun test scripts/relay-packet.test.mjs` exits 0 | the packet fixture without `decisions.md` | verified |
| O7 | S7 / PE-008 | The packet is pointers, never embedded `SKILL.md` content, so the lane's context budgets stay within their declared ceilings | P5 | P5 | execute-phase | `bun scripts/check-skill-context.mjs --routes` exits 0 | the route re-base row in `SKILL_CONTEXT_BUDGETS.json` naming this unit's growth source | verified |
| O8 | S8 / S11 / PE-006 | The plan step is unchanged and still human-approved; the relay bootstrap adds a state gate, never a second planner | P5 | P5 | execute-phase | `rg -c 'Human approval' skills/unit-lane/references/RELAY.md` matches 1 | the bootstrap step's approval line | verified |
| O9 | S9 / PE-003 | The bootstrap state is the closed set: `Draft — awaiting approval` before approval, `Active` after it, `Complete`/`Needs help` at the ends; an unknown state fails | P3 | P3 | execute-phase | `bun test scripts/relay-packet.test.mjs` exits 0 | the accepted-state fixture and the rejected-state fixture | verified |
| O10 | S10 / PE-002 | A leg runs one triaged phase under the `execute-phase <NN> P<k>` contract, updates baton and log, and dispatches the next leg as its final operational action; the chain is bounded by phase count + review legs | P5 | P5 | execute-phase | `rg -c 'final operational action' skills/unit-lane/references/RELAY.md` matches 1 | the leg-contract section carrying the sentence | verified |
| O11 | S12 / PE-007 | The coherence review is the four-item positive-verification checklist and its output is the existing `REVIEW-VERDICT` block; a malformed block fails the checker | P3 | P3 | execute-phase | `bun test scripts/relay-packet.test.mjs` exits 0 | the four checklist letters in `RELAY.md` plus the accepted/rejected verdict fixtures | verified |
| O12 | S12 / PE-007 | The coherence review emits **no** receipt: the pre-PR gate is evidence, and `review-receipt.mjs verify` remains the merge gate's precondition | P5 | P5 | execute-phase | `rg -c 'emits no receipt' skills/unit-lane/references/RELAY.md` matches 1 | the receipt-boundary paragraph | verified |
| O13 | S13 / S15 | The post-PR order is untouched: `/review-change` posts the receipt, `/audit-pr` is the terminal stage, and the pre-PR gate never names `/audit-pr` first | P5 | P5 | execute-phase | `rg -c review-change skills/unit-lane/references/RELAY.md` matches 2 | the post-PR section | verified |
| O14 | S14 / S24 / PE-004 / PE-013 | Without pi-web the router prints the per-phase `/execute-phase <unit> P<k>` hand-off and no relay line; with pi-web it adds the bootstrap hint and the same fallback stays visible | P4 | P4 | execute-phase | `bun test scripts/relay-route.test.mjs` exits 0 | the degradation fixture naming the printed `next:` line | verified |
| O15 | S15 / S16 / S17 / S18 | The relationship rows are recorded with their issue numbers, so the neighbouring scopes are never re-implemented here | P5 | P5 | execute-phase | `rg -c '#260\\|#201\\|#174' skills/unit-lane/references/RELAY.md` matches 3 | the relationship table | verified |
| O16 | S19 / S21 / PE-005 | No relay engine and no packet-schema requirement enter this repository: the only new executable is a read-only checker, and the packet keeps pi-web's three anchors | P3 | P3 | execute-phase | `rg -c 'subscriptions\\|websocket\\|dispatchThroughHost' scripts/relay-packet.mjs` matches 0 | the checker's read-only module surface | verified |
| O17 | S20 / PE-007 | The receipt contract is not replaced: the coherence verdict never satisfies `review-receipt.mjs verify` | P5 | P5 | execute-phase | `rg -c review-receipt skills/unit-lane/references/REVIEW.md` matches 3 | `REVIEW.md`'s receipt boundary left intact (no edit to that section) | verified |
| O18 | S22 / PE-011 / PE-012 | Every affected surface ships in one change and the release surface is settled: a valid changeset declares the skill bumps (the release stamps the train version and renders the CHANGELOG row), no `.es.md` sibling | P6 | P6 | execute-phase | `bun scripts/version-parity-gate.mjs --content` exits 0 | the changeset file, the CHANGELOG rows and the two skill bumps | verified |
| O19 | S23 / PE-010 | The packet-validation contract is tested before it is implemented: the suite lands red, then green | P2 | P2 | execute-phase | `bun test scripts/relay-packet.test.mjs` exits 0 | the red commit's observed failure and the green commit's pass, as `E` lines | verified |
| O20 | S25 / PE-014 | The leg handover (charter + baton, the two docs a runner reads) measures under the declared ceiling, and a packet above it fails closed | P3 | P3 | execute-phase | `bun scripts/relay-packet.mjs budget 20-relay-unit --repo scripts/fixtures/relay-packet` exits 0 | the printed `measured`/`ceiling` line and the over-ceiling fixture | verified |
| O21 | compatibility invariant (#291 AC3/AC4) | Every existing router answer stays byte-identical when pi-web is absent: route, `next:`, read-set, fingerprint | P4 | P4 | execute-phase | `bun test scripts/unit-route.test.mjs scripts/catalog.test.mjs` exits 0 | the differential run against the base commit recorded as an `E` line | verified |
| O22 | compatibility invariant (AGENTS.md gate) | The root suite stays green at the head, with the recorded pre-existing `docs-generate` drift settled by the regenerated projection, and no existing test is weakened | P7 | P7 | execute-phase | `bun scripts/run-root-suite.mjs` exits 0 | the root-suite tally line in the log's `G` entry | verified |
| O23 | S22 / S23 | The unit-doc surfaces stay machine-valid: tasks link their `S#`, the ledgers stay the single home, and the phase-lint contract holds | P1 | P1 | execute-phase | `bun scripts/phase-lint.mjs docs/features/82-relay-lane-execution/SPEC.md` exits 0 | the `Phase-lint: PASS` line | verified |

## Row notes

- `O21` is the differential invariant: the base is commit `caee2502` (this
  branch's cut head) and the comparison is the router's own stdout on the same
  fixture tree with `PI_WEB_SESSION` unset in both runs.
- `O22` covers the one pre-existing red (`docs/generated` stale) recorded in the
  unit doc's `## Known pre-existing issues`; the docs step regenerates the
  projection, so the head is green rather than excused.
- `O16`'s pattern is deliberately literal: it is a negative-capability pin over
  the checker's own bytes, not a naming rule for future code.
