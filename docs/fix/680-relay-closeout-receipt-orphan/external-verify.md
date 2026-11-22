# 680 — relay close-out receipt orphan · external verification receipt

Date: 2026-11-22 · **full verdict, once** — no prior `EXTERNAL VERIFY` block or
review verdict exists anywhere in this unit dir (only the retention declaration
naming this file). Read-only run: no `git commit`, `git push`, branch creation,
forge mutation or tracked-file edit — the only file written is this receipt
(uncommitted).

- **base** `3f749feebcef` (`origin/main`, merge-base and cut base) · **head**
  `8e72b226cf33` (the diff under verification: `3f749feeb…8e72b226c`, 5 commits).
- All reproducers ran in `mktemp -d` scratch (`/tmp/tmp.CXXLAwwtyA`, removed
  after); the base side is a `git archive 3f749feeb` copy of the same corpus in
  the same scratch. Nothing was written to the live tree by a probe.
- **Mid-run head move (disclosed):** while verifying, the owner landed
  `8abd8f30e` (one 6-line journal fragment under `.agentic-workflow/journal/`,
  no code). The journal-affected gates were re-run green after it:
  `journal-corpus` 23 pass, `log-immutability` 23 pass, `workflow-docs-index`
  5 pass, `structural-sibling-pins` 8 pass, `docs-generate --check` PASS;
  `git status --short` empty.
- **Run artifact (disclosed, not a finding):** the first
  `node scripts/run-root-suite.mjs` reported
  `FAIL scripts/phase-lint.test.mjs (120.1s) — SUITE TIMEOUT` because the crate
  suite was running concurrently in the same box. Alone the suite is
  162 pass / 40.4s, and the re-run of the gate alone is 137 PASS, exit 0.
  `phase-lint` is untouched by this change — load, not the diff.
- **Declared generator:** `bun run bundle:skills` (E13) staged the gitignored
  pack-time skill copy; tracked bytes untouched, `git status --short` empty
  before and after.

## Declared commands run here (command → observed)

| Claim | Command | Observed |
|---|---|---|
| E1 | `node scripts/run-root-suite.mjs` | exit 0 · 137 PASS (re-run alone) |
| E2 | `cd packages/agentic-workflow && bun test test/` | exit 0 · 1388 pass / 0 fail |
| E3 / spot check | `bun test scripts/relay-packet.test.mjs` | exit 0 · 44 pass / 0 fail (CO1–CO12) |
| E4 / O12 | `check`/`budget`/`obligations` on the accepted fixture at `3f749feeb` and at head | `diff` empty on all three, exit identical |
| E5 | `bun test scripts/relay-route.test.mjs` | exit 0 · 13 pass / 0 fail |
| E6 | `bun scripts/skill-lint.mjs` · `bun scripts/check-skill-context.mjs` | 0 findings · PASS 30 skills (also `--documents`: PASS 7 documents, AGENTS.md 679/220/459/14361 as re-pinned) |
| E7 / AC-S3 | `rg -U -c 'REVIEW-VERDICT: PASS` never satisfies' skills/unit-lane/references/RELAY.md` | exit 0 · 1 |
| E8 | `bun packages/agentic-workflow/bin/agentic-workflow.mjs relay closeout --help` | exit 2 (see A1 for the parenthetical) |
| E9 | `bun test scripts/normative-drift.test.mjs` | exit 0 · 24 pass / 0 fail |
| E10 | base vs head frozen reproducer (Complete baton, no `Review:` line) | base `verdict: PASS` / exit 0 → head `verdict: FAIL` / exit 1, `a Complete verdict needs the receipt boundary` |
| E11 / O13 | `bun scripts/docs-generate.mjs --check` | exit 0 · 3 checked, 0 stale |
| E13 | `cd packages/pi-agentic-workflow && bun run bundle:skills && bun test` | exit 0 · 1035 pass / 0 fail |
| E15 | `bun packages/agentic-workflow/bin/agentic-workflow.mjs dimension-regression --base 3f749fe` | exit 0 · base 20 · head 20 · changed review surfaces 1 · verdict clean |

Own probes (not the change's tests), all in scratch, head vs base copy:
`check` refuses Complete + no line / `pending` / `attempted … PASS` (exit 1),
accepts Complete + `receipt current at <40-hex>` with and without ` · pr <url>`
(exit 0), never asks a non-Complete baton (exit 0, byte-identical block to
base); `closeout` routes absent/stale/not-current to `→ Next: /review-change
20-relay-unit` with no `/audit-pr`, current+pr to `→ Next: /audit-pr <url>`,
refuses `Active` (exit 1, no `→ Next:`), prints no "awaiting owner decision"
anywhere; `--packet` works for `closeout` and `tiers --packet` still exits 2;
a hand-authored `## Final review receipt` heading never clears the fault.

## Findings

### Blockers (4)

- **B1 — `skills/unit-lane/references/RELAY.md:50`** — "A project carrying only
  the crate runs the **same four modes**" is false at head: the change grew
  `RELAY_MODES` from 4 to 5 (`closeout`).
  Reproducer: `rg -n "four modes" skills/unit-lane/references/RELAY.md` → line 50;
  `bun -e '…import Packet.mjs…RELAY_MODES.length'` → base **4**, head **5**.
  Base side: the sentence and the list agree at `3f749feeb`.
  Smallest action: change "four" to "five" (or drop the cardinality) in the
  correction batch.
- **B2 — `packages/agentic-workflow/src/relay/Packet.mjs:48`** — the comment
  `/** The four modes, in the order the usage strings list them. */` sits
  directly above the `RELAY_MODES` line this change rewrote 4→5.
  Reproducer: same count probe (base 4 / head 5); the comment is correct at base
  and false at head. Smallest action: update the comment to five, or drop the
  count.
- **B3 — `packages/agentic-workflow/src/promise-coherence/index.mjs:175`** —
  comment `#294: the packet checker's four modes are read-only verdicts…` is
  false at head, true at base; the file is untouched by this change (the
  F51/F53 sibling class: one surface updated, siblings kept the old truth).
  Reproducer: same count probe. Smallest action: same count fix.
- **B4 — `packages/agentic-workflow/src/relay/Packet.mjs:569-570`** — on the
  contract-legal baton `State: Complete` + `Review: receipt current at <40-hex>`
  **without** ` · pr <url>` (optional in the published grammar, RELAY.md:73 and
  the `relay-status@1` row; blessed by this change's own CO3 case where `check`
  exits 0), `relay closeout` prints `receipt: current`, `precondition: a current
  review-change receipt at the PR head`, then `→ Next: /review-change
  <NN-slug>` — it asserts the gate's precondition is met while routing the leg
  to produce it, and AC-S2's clause "when the receipt is current, exactly one
  `→ Next: /audit-pr <PR-url>` line" does not hold on that input.
  Reproducer: scratch packet, `State: Complete`,
  `Review: receipt current at 0123456789abcdef0123456789abcdef01234567`;
  `RELAY_PACKET_REPO=<tree> bun scripts/relay-packet.mjs closeout 20-relay-unit`
  → block above, exit 0; the same packet through `check` → `verdict: PASS`,
  exit 0 (the two new surfaces disagree about one baton).
  Base side: at `3f749feeb` the mode does not exist (`closeout` → usage,
  exit 2), so the defect cannot reproduce at base.
  Stability: quiet on non-Complete batons and on `current · pr <url>` (both
  behave per AC-S2); only the pr-less current case fires.
  Smallest action: derive the `precondition:` line and the `→ Next:` route from
  one condition — treat `current` without ` · pr <url>` as not-routable to the
  gate and say why (e.g. `precondition: none — the receipt records no PR url`)
  — or require ` · pr <url>` in the `current` form in both the grammar and
  `check`.

### Advisories (4)

- **A1 — `docs/fix/680-relay-closeout-receipt-orphan/SPEC.md:249` (E8)** — the
  parenthetical "(the unit token is required…)" does not reproduce: the observed
  refusal is `RELAY REFUSAL — unknown flag: --help`. The exit code (2) matches,
  so O8's validator holds; only the recorded reason is wrong (A2 receipt class).
- **A2 — `SPEC.md` AC-S5 and `planning-evidence.md` PE-003** — both claim the
  close-out tokens "resolve against the same receipt grammar the runtime
  imports" / "this change imports it too", but `Packet.mjs` imports nothing from
  `src/review-receipt/`; the four states are hand-mirrored from
  `receiptStatus`'s `current|stale|absent` vocabulary. Behaviour is consistent
  today and no gate flags it (`published-vocabulary-parity` green); the claim
  overstates import as mirror, with the IR1-shaped drift risk that carries.
- **A3 — `skills/unit-lane/references/RELAY.md:73`** — the rewritten baton
  fence drops the previously published `attempted <n> — <result>` value while
  `Packet.mjs:167,180` and O1's evidence still treat it as a legal non-current
  `Review:` line; the new fence also repeats the `Review:` prefix on each
  alternative (`Review: pending | Review: receipt current …`), unlike the
  `State:` line at RELAY.md:67. Doc-level narrowing/formatting; behaviour for
  `attempted` is intended (refused for `Complete`, passes otherwise).
- **A4 — `packages/agentic-workflow/src/relay/Packet.mjs:172`** — an uppercase
  40-hex sha (`Review: receipt current at …ABCD…`) reads as `not-current` and a
  `Complete` baton is refused. Fail-closed and git SHAs are lowercase, so an
  advisory: a hand-pasted uppercase sha gets "carries no current review
  receipt".

### Contract-text qualifier check

- RELAY.md §Receipt boundary, removed sentence: "After the PR opens, the
  lane's close-out is unchanged — `/review-change` posts the SHA-bound receipt
  and `/audit-pr` is the terminal merge gate; a `REVIEW-VERDICT: PASS` never
  satisfies `runner review-receipt verify --pr <N>`." → the binding qualifier
  "**never** satisfies" survives verbatim (E7); "terminal merge gate" survives
  as "the merge gate only once it is [current]" in `relay-closeout@1` and
  SKILL.md step 4 ("terminal stage"); the temporal condition "after the PR
  opens" is replaced by the declared condition "the ladder runs when the relay
  is `Complete`". Declared retirement (SPEC §Retirements), no unqualified
  absolute introduced.
- SKILL.md §8 step 1, rewritten: "already had it performed" (absolute) →
  "already had the *verdict* performed … the verdict is evidence, and step 4
  stays owed" (scoped). A qualifier is **added**, not lost; the
  absolute→conditional shift is the fix's own intent (S3) and tightens what
  counts as done. No binding rule weakened.
- Only lost surface found: the `attempted <n> — <result>` baton value → A3.

## Sibling sweep

**list** (three surviving mentions of what the change rewrote — the mode count
4→5 — all blockers B1–B3). Examined and excluded:
`docs/features/82-relay-lane-execution/SPEC.md:242` (dated historical Log line
recording the 2026-11-05 state), `docs/features/598-test-estate-sweep/SPEC.md:132`
(a different tool's four modes), and `docs/features/82-relay-lane-execution/SPEC.md:265`
("the lane's ordered close-out is unchanged" — asserts the *order*, which this
change does not alter, and denies no relay-side owner). No survivor of
"the lane's close-out is unchanged" or "already had it performed" outside this
unit's own Retirements table; every usage string (`scripts/relay-packet.mjs`,
`agentic-workflow.mjs` header and `RELAY_USAGE`) carries `closeout`.

## Completeness

**S1–S5 resolved** — P1–P5 each carry `(Implements: S#)` and their validators
re-run green here (relay-packet 44 pass, skill-lint 0 findings,
check-skill-context PASS, normative-drift 24 pass, root suite exit 0,
docs-generate --check PASS). **Obligations O1–O13: all `verified`, every
validator re-run green** (O12 re-derived by hand: three modes byte-identical
base↔head; O13 = root suite exit 0 + docs-generate PASS). No open ids, no
undispositioned `S#`.

## Spot check

`bun test scripts/relay-packet.test.mjs` → **match** (E3 reported 44 pass /
0 fail; observed 44 pass / 0 fail, exit 0). Cross-checked: `node
scripts/run-root-suite.mjs` → **match** (E1 reported 137 suites PASS, exit 0;
observed 137 PASS, exit 0).

```text
EXTERNAL VERIFY — base: 3f749feebcef · head: 8e72b226cf33
Blockers: 4 — B1 skills/unit-lane/references/RELAY.md:50 (rg -n "four modes" + RELAY_MODES length: base 4 = the sentence, head 5 ≠ the sentence) · B2 packages/agentic-workflow/src/relay/Packet.mjs:48 (same count probe; the comment sits on the line the change rewrote) · B3 packages/agentic-workflow/src/promise-coherence/index.mjs:175 (same count probe; untouched file, old truth survives) · B4 packages/agentic-workflow/src/relay/Packet.mjs:569-570 (`Complete` + `Review: receipt current at <40-hex>` without ` · pr <url>` → `precondition: a current review-change receipt at the PR head` above `→ Next: /review-change <slug>`, exit 0, while `check` exits 0 on the same baton; base has no `closeout` mode — usage, exit 2)
Advisories: 4 — A1 docs/fix/680-relay-closeout-receipt-orphan/SPEC.md:249 (E8's parenthetical reason does not reproduce; exit 2 does) · A2 SPEC.md AC-S5 + planning-evidence.md PE-003 (claim an import that does not exist; tokens are mirrored from receiptStatus) · A3 skills/unit-lane/references/RELAY.md:73 (fence drops `attempted <n> — <result>` and repeats the `Review:` prefix per alternative) · A4 packages/agentic-workflow/src/relay/Packet.mjs:172 (uppercase sha reads as not-current; fail-closed)
Sibling sweep: list — B1 RELAY.md:50, B2 Packet.mjs:48, B3 promise-coherence/index.mjs:175 (the "four modes" survivors); historical 82:242 and unrelated 598:132 excluded
Completeness: S1–S5 resolved · O1–O13 verified with re-run-green validators · no open ids
Spot check: bun test scripts/relay-packet.test.mjs → match (44 pass / 0 fail; root suite 137 PASS exit 0 also matched)
Verdict: NEEDS-DECISION (B1, B2, B3, B4)
```

Corrections belong to `/aw-local-apply` under its own correction bounds (one
batch → one blockers-only recheck → a second only if the same blocker persists
→ `Needs your decision`). This receipt makes the next run a delta verdict.
