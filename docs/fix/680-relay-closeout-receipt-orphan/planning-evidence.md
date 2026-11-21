# 680 — relay close-out orphans the review receipt · planning evidence

One row per Engineering claim the change rests on, in the ledger's closed column
order (`skills/pre-execution-review/references/LEDGERS.md`). Every source below
was read in this session at the cut head `3f749feeb` (branch
`fix/680-relay-review-receipt-closeout`); a claim carried from training is never
`confirmed`, and an unsampled assumption is `unknown` with an owner.

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | measured-run | The frozen failure reproduces at the cut head: a `Complete` baton whose packet names no review receipt prints `verdict: PASS` and exits 0 — the checker has no receipt concept at all, so the miss is structural, not a wording bug | `/tmp/repro680.ceIv` (a throwaway copy of `scripts/fixtures/relay-packet/` with `State: Active` → `State: Complete`), `RELAY_PACKET_REPO=<tree> bun scripts/relay-packet.mjs check 20-relay-unit` → `state: Complete` / `verdict: PASS`, `EXIT=0` | measured 2026-11-21 (this session) | O1, O2, O5; AC-S1, AC-S4 |
| PE-002 | committed-source | `batonOf` reads exactly three baton lines (`State`, `Legs`, `Phase`) and returns `null` for anything it cannot read; the `Review:` / `Blockers:` lines the baton grammar publishes are **never parsed**, so the receipt state has no reader | `packages/agentic-workflow/src/relay/Packet.mjs:136-152`; `rg -c 'Review:' packages/agentic-workflow/src/relay/Packet.mjs` → 0 | read 2026-11-21 (this session) | O1, O3; D1 |
| PE-003 | committed-source | The receipt grammar already exists and is exported side-effect-free (`parseReviewReceipt`, `latestReceipt`, `receiptStatus`), and a sibling consumer imports it rather than restating it — so this change imports it too and never re-implements a second marker regex | `packages/agentic-workflow/src/review-receipt/index.mjs:47-53,101-130`; `packages/agentic-workflow/src/audit-pr-gate/index.mjs:38-41` | read 2026-11-21 (this session) | O3, O6; AC-S5 |
| PE-004 | committed-source | `checkPacket` is the single owner of the check block and both entry points (`scripts/relay-packet.mjs`, `agentic-workflow relay`) print it verbatim, so a new fault class lands once and both CLIs inherit it | `packages/agentic-workflow/src/relay/Packet.mjs:1-25,236-300`; `scripts/relay-packet.mjs:1-20`; `packages/agentic-workflow/bin/agentic-workflow.mjs:711-745` | read 2026-11-21 (this session) | O1, O2, O7; D2 |
| PE-005 | committed-source | `RELAY_MODES` is a closed frozen list and `parseRelayArgs` refuses `--packet` outside `check`/`budget`; a new mode therefore enters that list, and `parseRelayArgs`'s `--packet` guard must be re-read for the new mode's needs | `packages/agentic-workflow/src/relay/Packet.mjs:60-66,463-492` | read 2026-11-21 (this session) | O4, O7; D2 |
| PE-006 | committed-source | The lane's close-out ladder already mandates the receipt check (`runner review-receipt verify --pr <N>`, exit 0 → `/audit-pr`, otherwise `→ Next: /review-change <NN-slug>` and `/audit-pr` is not printed) — the ladder text exists; what is absent is an **owner** it can be attached to when the lane session has already ended | `skills/unit-lane/SKILL.md:295-311` | read 2026-11-21 (this session) | O8, O9; AC-S2, AC-S3 |
| PE-007 | committed-source | `RELAY.md` §Receipt boundary states the verdict "emits no receipt" and that a `REVIEW-VERDICT: PASS` never satisfies the receipt check, but stops at "the lane's close-out is unchanged" — naming no relay-side owner, which is exactly the orphan the issue names | `skills/unit-lane/references/RELAY.md:170-180` | read 2026-11-21 (this session) | O8, O10; AC-S3 |
| PE-008 | committed-source | The router's relay hint (`relayAnswer`/`relayLines`) is a separate read-only path over the same baton and its `complete` arm prints the single line `relay: complete`; touching it is unnecessary — the checker owns the refusal the issue asks for | `packages/agentic-workflow/src/runner/unit-route.mjs:566-621`; `scripts/relay-route.test.mjs:103-116` | read 2026-11-21 (this session) | O11; regression scope |
| PE-009 | committed-source | `relay check` is documented as read-only and host-free ("writes nothing, spawns no shell, calls no network") — so the receipt evidence must be read from a file the workspace already carries, never by calling `gh` from the check | `packages/agentic-workflow/src/relay/Packet.mjs:20-24`; `scripts/relay-packet.mjs:16-18` | read 2026-11-21 (this session) | O3, O6; D3 |
| PE-010 | committed-source | The skill context budgets bind `unit-lane`'s main entry at `mainEstimateMax: 5246` / `mainLinesMax: 403`, and the measurements are re-based with a `mainSources` row in the same change — a prose addition that overruns is a gate failure, not a note | `docs/workflow/SKILL_CONTEXT_BUDGETS.json:398-420` | read 2026-11-21 (this session) | O9, O12; AC-S3 |
| PE-011 | unknown — owner: the forge-facing close-out | Whether a relay leg can read the open PR's comments **without** a forge call was not sampled: pi-web's dispatch surface is not part of this repository's tree, so a leg may or may not have a PR-comment reader. The design therefore does not require one — it reads a file the leg writes (`review-receipts.json` beside the packet, or the baton's own `Review:` line), which is what makes it offline by construction | none sampled | n/a — recorded as `unknown`, never cited as evidence | D3 |

## Design decisions

**D1 — the receipt state is read from the baton, not from the forge.** The baton
grammar already publishes a `Review:` line (`RELAY.md:73`); it was never parsed.
A `Complete` baton records the receipt its PR carries, in the closed form
`Review: receipt current at <40-hex>`; anything else (`pending`, `attempted <n> —
<result>`, a stale sha) is not current. This adds no new document and no new
forge call.

**D2 — one new mode, one new fault class, both owned by `Packet.mjs`.** `closeout`
renders the ladder (the verdict plus the mandated `→ Next:` block); `check` grows
the receipt-boundary fault. Both entry points inherit them, no second grammar.

**D3 — offline by construction.** The check never calls the forge (PE-009); a
`Complete` baton with no readable receipt evidence is refused, which is the
fail-closed direction — silence never reads as "current".

**D4 — the close-out shape is a published grammar block.** `relay-closeout@1`
on `RELAY.md` is the machine surface (S5); it enters the normative-surfaces
inventory like every other `block:` on a skill reference.
