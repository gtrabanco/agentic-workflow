# Planning obligations — feature/728-gate-receipt-producer

Frozen at the cut (large unit: this ledger lives beside `SPEC.md`, never embedded
in it). Row shape, the `status` lifecycle and the "every row `verified` or an
evidenced `n/a` before the unit ships" rule are owned by
`skills/pre-execution-review/references/LEDGERS.md` §2. A validator is a
backticked command plus the outcome it must produce.

Two cells were corrected before their rows were judged, never after (`L6`):
O7's count was stated as ≥ 2 while the shipped text carries one, and O10 was
re-worded when the planned consumer clause was withdrawn (`D9`).

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S2, S3, PE-002, PE-013 | a step owner that runs a verification gate cannot be shipped with zero producer citations: the four callers each cite the producer's command and its block | P5 | P5 | execute-phase | `bun scripts/gate-producer-drift.mjs` exits 0 and prints `verdict: PASS` with `4 callers` | the `E` line naming the block, the four callers and the exit | verified |
| O2 | S3, S4, PE-003 | the owner block publishes the producer's six fields and keeps the mark's manifest slot filled by the producer's digest | P2 | P2 | execute-phase | `bun test scripts/gate-producer-drift.test.mjs` exits 0 with `the owner block publishes every producer field and keeps the mark's manifest slot` | the `E` line naming the case and the exit | verified |
| O3 | S4, S5, PE-003, PE-008, PE-009 | the ordering law is stated where the mark is owned, and the receipt still flips stale on a signed byte while an unsigned write leaves it current | P2 | P2 | execute-phase | `bun test scripts/gate-receipt.test.mjs` exits 0 with `freshness ignores the HEAD sha and unsigned files, and flips on a signed byte`, and the owner block's `ordering` field names the step's last signed-byte write | the `E` line with the suite exit and the quoted `ordering` row | verified |
| O4 | S5, PE-013 | the executor's step-completion gate and its gate-run marks section route the gate through the producer, so a step's green gate *is* the receipt | P5 | P5 | execute-phase | `rg -c 'gate-receipt run' skills/execute-phase` matches 3 and `bun scripts/gate-producer-drift.mjs` exits 0 | the `E` line with the count and the exit | verified |
| O5 | S3, S5, PE-013 | the fold's gate and its `REPAIR-RECEIPT` `Gate:` line carry the receipt the fold's gate run produced | P5 | P5 | execute-phase | `rg -c 'gate-receipt run' skills/fold-findings` matches 2 | the `E` line with the count | verified |
| O6 | S5, PE-013 | the lane's close-out produces the receipt before it verifies the review receipt, so the last signed bytes of a unit are covered | P5 | P5 | execute-phase | `rg -c 'gate-receipt run' skills/unit-lane` matches 1 | the `E` line with the count | verified |
| O7 | S4, S5, PE-013 | the reviewer's own gate run is produced after its ledger append and before the commit that carries it, so the review never stales the receipt it will be audited against | P5 | P5 | execute-phase | `rg -c 'gate-receipt run' skills/review-change` matches 1 and `bun scripts/gate-producer-drift.mjs` exits 0 | the `E` line with the count and the exit | verified |
| O8 | S2, S5, PE-006, PE-007, PE-014, PE-018 | a project is never routed into a producer its gate cannot satisfy: the template declares the handshake gate script and admits its absence | P6 | P6 | execute-phase | `bun test scripts/gate-producer-drift.test.mjs` exits 0 with `the template guide declares the handshake and the producer command` | the `E` line naming the case and the exit | verified |
| O9 | S6, PE-012 | the hook route is deliberately not taken, and the evidence that its premise does not hold here is recorded rather than assumed | P6 | P6 | execute-phase | `test -d .husky` exits 1 and `rg -n 'install-hook' scripts/local-gate.mjs` names `.git/hooks/pre-push` | the `E` line with both outputs | verified |
| O10 | S7, PE-004 | the consumer half nobody asked to change still holds, and a producer unit does not rewrite a review pass's brief: `review-verify` consumes and never re-runs, `audit-pr`'s receipt gate still blocks on missing/stale/invalid, and the review pack's pinned checklists are byte-identical to the base commit | P6 | P6 | execute-phase | `bun test scripts/audit-pr-receipt.test.mjs` exits 0, `bun test scripts/gate-receipt.test.mjs` exits 0 and `git diff --name-only $(git merge-base origin/main HEAD)..HEAD -- skills/review-verify skills/audit-pr skills/review-*` matches 0 lines | the `E` line with both exits and the empty diff | verified |
| O11 | S2, S3, PE-001, PE-010, PE-011 | the producer's default gate has one home — the drift gate reads the exported constant and this repository's gate publishes the handshake it names | P4 | P4 | execute-phase | `bun test scripts/gate-producer-drift.test.mjs` exits 0 with `the producer's default gate is this repository's real handshake gate` | the `E` line naming the case and the exit | verified |
| O12 | S1, PE-002, PE-016 | tests first: the routing corpus lands alone, observed red against the unchanged tree, before any implementation commit | P1 | P1 | execute-phase | `git show --stat caf8f996f` lists `scripts/gate-producer-drift.test.mjs` only | the `E` line with the red head, its exit and the failing module name | verified |
| O13 | S1, PE-017 | documentation and state ship with the change: the unit doc, the roadmap row through the deterministic writer, the changeset, the generated projection and the session fragment | P7 | P7 | execute-phase | `bun packages/agentic-workflow/bin/agentic-workflow.mjs docs-generate --check` exits 0 and `bun scripts/lint-changeset.mjs .changeset/728-gate-receipt-producer.md` exits 0 | the `E` line with both outcomes | verified |
| O14 | S1, S2, PE-001 | nothing the producer rests on changed behavior: the receipt's shape, the freshness predicate and the merge gate's judge are byte-identical to the base commit | P4 | P4 | execute-phase | `git diff --stat $(git merge-base origin/main HEAD)..HEAD -- packages/agentic-workflow-schema` matches 0 lines and `bun test scripts/gate-receipt.test.mjs` exits 0 | the `E` line with the diff stat and the exit | verified |
| O15 | S1 | no repository review machinery judges this change — no `review-change`, no `audit-pr`, no fold cycle, and no self-granted gate exception | P7 | P7 | execute-phase | `git log --format=%s $(git merge-base origin/main HEAD)..HEAD` names no review/fold/audit commit | the `E` line listing the branch's own subjects | verified |
| O16 | S2, S3, PE-015 | a new versioned block and a new gate land with their inventories: the block is a declared normative surface and the gate names its carrier, with the surface claimed by that row | P2 | P2 | execute-phase | `bun test scripts/normative-drift.test.mjs` exits 0 and `bun test scripts/prose-gate-inventory.test.mjs` exits 0 | the `E` line with both exits | verified |

Evidence, per row (the `## Log` line that records the run):

- O1 → E3, E6
- O2 → E4
- O3 → E4, E5
- O4 → E6
- O5 → E6
- O6 → E6
- O7 → E6
- O8 → E7
- O9 → E8
- O10 → E9, E15
- O11 → E7
- O12 → E1
- O13 → E10
- O14 → E9
- O15 → E11
- O16 → E12
