---
type: feature
scope: large
roadmap_summary: Issue [#728](https://github.com/gtrabanco/agentic-workflow/issues/728) (L): the gate receipt gains a producer in the lane's execution path — `execute-phase`, `fold-findings`, `unit-lane` and `review-change` run their verification gate *as* `runner gate-receipt run`, the `GATE-RAN` mark fills its reserved `manifest <sha>` slot with the receipt's digest, the run is the step's last signed-byte write so the receipt is current at the audited head, a project declares the handshake gate that makes it possible, and a deterministic drift gate refuses a step owner shipped with zero citations.
ac-hash: 22b07bae1a79e0117a7e0c7196209e95e530039e1dd8949b49cabf0bc042350d
---

# 728 — gate-receipt-producer

> One-line: the gate receipt had consumers and no producer; the lane's gate runs
> are now the receipt's runs, produced where the head is decided.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.1
schema: @gtrabanco/agentic-workflow-schema@4.10.1
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

```text
retention-declaration@1
path | disposition
TASKS.md | trimmable · legacy carrier
PLAN.md | trimmable
progress.md | trimmable · legacy carrier
ACCEPTANCE.md | trimmable · legacy carrier
testing.md | trimmable
CHECKLIST.md | trimmable
BRIEF.md | trimmable
pr-body.md | trimmable
external-verify.md | trimmable
review-findings.md | trimmable
planning-findings.md | trimmable
SPEC.md | kept
decisions.md | kept
known-issues.md | kept
planning-obligations.md | kept
planning-evidence.md | kept
architecture-notes.md | kept
sources.md | kept
research.md | kept
```

## Specs

`S1` is the owner's instruction; `S2`–`S8` are issue
[#728](https://github.com/gtrabanco/agentic-workflow/issues/728)'s own words,
quoted verbatim and in the issue's order.

**S1 — the issue is applied, not reinterpreted.**
> Apply to this repository: issue #728

**S2 — every unit lands with a stale receipt.**
> Every unit lands with a **stale** gate receipt. Nothing in the lane's execution path runs `gate-receipt run` after a green gate; the receipt is only ever produced **reactively** — when a downstream consumer (review-verify, audit-pr) refuses a stale one and routes it back.

**S3 — the ceremony has consumers and no producer.**
> Step-owning skills that **do** run the gate — `execute-phase`, `fold-findings`, `unit-lane` — cite `gate-receipt` **zero** times. The executor's green gate and the receipt's freshness are two disconnected worlds, so the freshness rule ("the declared closure has not moved since the run" — `gate-receipt@1` semantics in the crate README) is structurally unsatisfiable: the run it must bind to is never recorded at the moment it happens.

**S4 — the reactive re-run has a hidden cost.**
> It also has a hidden cost: the reactive re-run makes the reviewer/auditor execute the gate *outside* a recorded phase (or record an undocumented one), which is exactly the uncommitted-side-effect class the turn contract's commit/paste rules exist to prevent.

**S5 — fix A, the minimal one.**
> **A. Producer at the executor** — `execute-phase` calls `runner gate-receipt run` as part of the phase-gate/verification step whenever the declared gate is green (minimum: at the close-out/Hardening phase). The unit's Evidence/GATE-RAN row then points at a receipt that is current by construction.

**S6 — fix B, the alternative.**
> **B. Producer at the hook** — where a project's pre-commit gate runs the full gate anyway (this repo's `.husky/pre-commit` runs the same steps as `bun run verify` unconditionally), route the invocation through `gate-receipt run --gate <script>` so every recorded gate leaves the receipt fresh for free. No hook changes on projects without the handshake script; degrades to today's behavior.

**S7 — the merge gate already assumes a producer.**
> (May land together with the stale-as-blocker-confirming side of `audit-pr-gate`, which already assumes a producer exists.)

```text
spec-requirement@1
kind | shape | what it orders
requirement | **S<n>[a-z]? — <title>.** | one requirement; the id is what a task links and a finding cites
quote | > <the requester's words, verbatim> | the requirement's own text, unedited apart from a marked elision
correction | **S<n><letter> — <title>.** | an appended amendment to requirement S<n>; never an edit of it
```

## Acceptance criteria

Frozen at the cut; `ac-hash:` in the frontmatter is this section's SHA-256. One
criterion per requirement, each naming the check that proves it.

1. **S1 — the issue is applied inside its declared surface.** `git diff --name-only $(git merge-base origin/main HEAD)..HEAD` lists only paths this unit's `## Impact`, `## Surfaces`, the tasks' `Relevant files:` and the recorded decisions (D10) name — the unit doc and its ledgers included — and every `S#` above appears verbatim in this document.
2. **S2 — no lane step leaves a green gate unrecorded.** `bun test scripts/gate-producer-drift.test.mjs` exits 0 with `every gate-running step owner cites the producer's command and its block`; the mechanic each caller relies on is pinned by `bun test scripts/gate-receipt.test.mjs` exiting 0 with `a green run writes the envelope and the full log`.
3. **S3 — the zero-citation tree is gone.** `bun scripts/gate-producer-drift.mjs` exits 0 and prints `gate-producer-drift — … · 4 callers · 1 owner block · 1 template guide · 0 findings` then `verdict: PASS`.
4. **S4 — the run is recorded where the head is decided, never after it.** The owner block declares the ordering rule and the receipt the mark cites: `bun test scripts/gate-producer-drift.test.mjs` exits 0 with `the owner block publishes every producer field and keeps the mark's manifest slot`, and `rg -n 'ordering \|' skills/pre-execution-review/references/LEDGERS.md` answers one line naming the step's last signed-byte write.
5. **S5 — the executor produces.** `skills/execute-phase` is one of the four callers the drift gate reads, and its step-completion gate names the producer: `bun scripts/gate-producer-drift.mjs` exits 0 with `execute-phase` in its four callers, and `rg -c 'gate-receipt run' skills/execute-phase` is ≥ 2.
6. **S6 — the hook route is deliberately not taken, and the reason is recorded.** `test -d .husky` answers absent (no pre-commit gate to route) and `rg -n 'install-hook' scripts/local-gate.mjs` shows the installed hook is `pre-push`; `## Non-goals` states the route and that evidence.
7. **S7 — the consumer side is untouched, and the review pack's frozen checklists stay frozen.** `bun test scripts/audit-pr-receipt.test.mjs` exits 0 and `bun test scripts/gate-receipt.test.mjs` exits 0 (the merge gate's receipt judgment and the freshness predicate are byte-identical), and `git diff --name-only $(git merge-base origin/main HEAD)..HEAD -- skills/review-verify skills/audit-pr skills/review-* ':(exclude)skills/review-change'` lists **0** paths — the review pack's passes and both consumers, with the composer this unit deliberately edits excluded — `scripts/review-pack-preamble.test.mjs` protects those checklist bytes and passes.

## Impact

What consumes this unit's deliverable, what it consumes, and what stops being
true. Cut at plan time; the executor sweeps it.

**It changes four executable-path skills and one scaffold guide**, which are the
product's substrate for every project that installs the workflow:

- `skills/execute-phase` — the step-completion gate and the `gate-ran@1` marks
  section now route the gate through the producer. Consumers: every unit the
  lane hands to the executor; `review-change`, which consumes the `GATE-RAN`
  marks; `product-audit`'s ceremony dimension, which reads whether a step's gate
  was recorded.
- `skills/fold-findings` — the fold gate and the `REPAIR-RECEIPT` `Gate:` line.
  Consumers: `review-change`'s re-review (it consumes the fold's gate evidence),
  the `FOLDING.md` sweep declaration's cycle arithmetic.
- `skills/unit-lane` — the close-out's receipt stage, which is where the last
  signed bytes of a unit land. Consumers: `audit-pr` (the terminal merge gate
  reads the receipt it produces), `relay`'s closeout leg.
- `skills/review-change` — the reviewer's own gate run. Consumers: `audit-pr`'s
  receipt gate, the `REVIEW-PASS` receipt's precondition.
- `template/AGENTS.md` — the Commands block gains the declared gate script a
  project's producer needs. Consumers: `init-workspace`'s scaffold (it exports
  this file), `scaffold-contract`'s section contract (unchanged: the slot is a
  line inside the existing `## Commands` section), every installed project's
  guide.

**What it consumes from others:** `gate-receipt@1`'s published shape and
`runner gate-receipt run`'s exit contract (feature 108 / issue #409, unit
`docs/features/108-machine-gate-receipts/`); the `gate-ran@1` mark grammar
(`LEDGERS.md`, which already reserved the `manifest <sha>` slot); the
`prose-gate-inventory@1` inventory (a new gate needs a row); the
`normative-surfaces@1` inventory (a new block needs a row and a claiming row).

**What stops being true:** the claim "each step runs the gate and records a
`GATE-RAN` mark" becomes "each step runs the gate *as* the producer and records a
`GATE-RAN` mark carrying the receipt's digest"; the doc that says the `manifest
<sha>` slot is "reserved, not yet consumed" is superseded by the producer
filling it; and a project with no handshake gate is no longer an implicit "run
the gate" — it is a declared absence with a recorded reason.

**A consumer clause was planned and withdrawn.** The cut also named the owner a
consumer's re-route goes to inside `skills/review-verify/SKILL.md`'s checklist.
`scripts/review-pack-preamble.test.mjs` pins those checklist blocks byte for byte
("an extraction that edits a checklist has edited the review"), and it failed by
name when the edit landed. The clause is withdrawn rather than the pin re-frozen:
a producer unit does not get to rewrite a review pass's brief (`D9`). The owner
the re-route needs is reachable from the rule itself, which is where it belongs.

**Nothing live is touched:** the receipts and logs the producer writes land under
`.agentic-workflow/gate/`, which is gitignored in this repository and absent from
the receipt's own signed closure, so producing a receipt never stales it.

## Surfaces

- `skills/execute-phase`
- `skills/fold-findings`
- `skills/unit-lane`
- `skills/review-change`
- `skills/pre-execution-review`
- `template`
- `scripts`
- `packages/agentic-workflow`
- `docs`

## Retirements

Strictly additive: no surface is retired, renamed or removed. The computed
surface inventory (`bun packages/agentic-workflow/bin/agentic-workflow.mjs
residual-classify --inventory --base origin/main`, 14 rows) is the receipt for
that answer:

| surface | kind | state | reason |
|---|---|---|---|
| `CALLER_TOKENS` | symbol | used | live-consumer |
| `GATE_DEFAULT_SCRIPT` | symbol | used | live-consumer |
| `PRODUCER_BLOCK` | symbol | used | live-consumer |
| `PRODUCER_CALLERS` | symbol | used | live-consumer |
| `PRODUCER_FIELDS` | symbol | used | live-consumer |
| `PRODUCER_OWNER` | symbol | used | live-consumer |
| `TEMPLATE_GUIDE` | symbol | used | live-consumer |
| `TEMPLATE_TOKENS` | symbol | used | live-consumer |
| `audit` | symbol | used | live-consumer |
| `main` | symbol | used | live-consumer |
| `producerFields` | symbol | used | live-consumer |
| `render` | symbol | used | live-consumer |
| `scripts/gate-producer-drift.mjs` | file | used | live-consumer |
| `scripts/gate-producer-drift.test.mjs` | file | andamio | recorded-planned-consumer |

## Non-goals

- **S6's hook route.** Its premise — a pre-commit gate that runs the full gate —
  does not hold here: this repository has no `.husky/` and
  `scripts/local-gate.mjs --install-hook` writes `.git/hooks/pre-push`, which
  runs *after* the commits a review audits. Recorded in `decisions.md` §D1.
- **No CLI, schema or contract behavior change.** `gate-receipt run`'s exit
  contract, `gate-receipt@1`, the freshness predicate and `audit-pr-gate`'s
  outcome stay byte-identical (D8).
- **No `record --from <result>` mode.** The producer replaces the gate run; a
  second step that records a finished run is exactly what gets forgotten (D2).
- **No mark↔receipt cross-check.** The `GATE-RAN` `manifest <sha>` slot is
  filled, not read: a consumer that compares it to the receipt's digest is a new
  consumer with its own failure states, outside S2–S5 (D6).
- **No retrofitting of projects without a handshake gate.** A receipt without
  per-check rows is `degraded` by contract, so such a project cannot be
  satisfied by prose; the declared repair is adopting the gate script, and no
  migration tooling ships here (D3).
- **The receipt's own gitignore status.** `.agentic-workflow/gate/` stays local
  in this repository (owner decision recorded beside it in `.gitignore`); this
  unit neither commits run records nor changes that decision.

## Risk tier

```text
tier: standard
reason_kind: executable-content
reason: 2 path(s) carry executable content: scripts/gate-producer-drift.mjs, scripts/gate-producer-drift.test.mjs
signals: []
size_tier: large
```

`bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify
--paths <the twelve changed paths>` printed that verdict at this cut; the size
tier is its own arithmetic — twelve changed paths against the classifier's
8-path `small` ceiling (`SIZE_TIER_THRESHOLDS`).

- **Tier** — `standard` · **Task Size** — `large`
- **Named high-risk item** — none.

## Future

none

## Future cost

- **The declared handshake is now a project's obligation.** Any project that
  wants a `pass` receipt must ship a gate script writing `local-gate-result@1`;
  a future `init-workspace` migration that scaffolds that script binds to
  `template/AGENTS.md`'s declared slot, not to a second narrative.
- **Every new gate-running step owner joins the drift gate's caller list.**
  Adding a fifth step that runs a verification gate means adding it to
  `PRODUCER_CALLERS` in `scripts/gate-producer-drift.mjs` and citing the block —
  otherwise the gate silently stops covering it.
- **The ordering law binds any future producer.** Anything that writes signed
  bytes after a receipt (a log writer, a roadmap emitter, a translator) stales
  it; the producer has to stay the last such write, or freshness becomes a lie.
- **The gate's own cost.** A caller that keeps the gate and adds the producer
  beside it pays twice; the rule is replace, never add.

## Applicable tests

- `bun test scripts/gate-producer-drift.test.mjs`
- `bun test scripts/gate-receipt.test.mjs`
- `bun test scripts/audit-pr-receipt.test.mjs`
- `bun test scripts/normative-drift.test.mjs`
- `bun test scripts/skill-lint.test.mjs`
- `bun test scripts/test-obligation-tags.test.mjs`
- `bun test scripts/structural-sibling-pins.test.mjs`
- `bun test --timeout 60000 scripts/red-first.test.mjs` (its declared bound — the
  shipped-history walk exceeds bun's 5s standalone default, which the
  `scripts/test-timeout-allowlist.json` entry records as base-present)
- `bun scripts/check-skill-context.mjs`
- `bun test scripts/prose-gate-inventory.test.mjs`
- `bun scripts/lint-changeset.mjs .changeset/728-gate-receipt-producer.md`

## Known pre-existing issues

Each is reproduced at the base commit `022769f8b`, not inherited from another
unit's notes.

- **`scripts/findings-corpus.test.mjs` is red on `main` and on this branch
alike** — its live-tree case freezes **1173** finding rows and the tree carries
**1178**. Measured at the base commit: `bun test`, 16 pass / 1 fail (the same
case). The same suite also runs `bun packages/agentic-workflow/bin/agentic-workflow.mjs
findings-corpus --json` → 1178 findings at base and at head, so this unit adds no
row. `affects` the root-suite step of the local gate (`G1`); not repaired here —
re-freezing a corpus count nobody moved is a different unit's receipt.
- **`scripts/workflow-doctor.test.mjs` is red on `main` and on this branch
alike** — `FAIL` in both root-suite runs (head 1.4s, base 2.7s). `does-not-affect`
any path this change touches.
- **`packages/agentic-workflow/test/doc.structure.test.mjs` hits its own declared
240s suite bound on this box** — `SUITE TIMEOUT` in both the bun and the node
legs of the crate suite, while all **19** cases pass standalone (`bun test
--timeout 60000`, 208s at head). Measured at the base commit: **291s** for the
same suite, so the bound is load-driven and base-present, not a regression.
`affects` the crate-suite legs of the local gate (`G1`); the bound is the
allowlist's owner decision and stays untouched here.
- **`scripts/ceremony-findings-ledger.test.mjs` reddens under the root gate's
per-test budget** — 19/19 pass at a 60s budget in 21.7s; under the 4-worker pool
several spawn-heavy cases cross 10s. Base-identical (5 of the same cases were
red at base under the 5s standalone default). `does-not-affect` the cases this
change adds, which spawn nothing.
- **The roadmap carries a duplicate feature row for one number** — pre-existing
index artifact; `roadmap-settle` reports `violations: []` at this head and
`docs-generate --check` answers `0 stale`, so nothing here requires it. Reported,
never hand-deleted (no emitter deletes a feature row).

## Tasks

- [x] P1 — Land the frozen-failure corpus alone: `scripts/gate-producer-drift.test.mjs`,
  observed red against the unchanged tree on the issue's own measurement (four
  step owners, zero citations).
  (validator: `bun test scripts/gate-producer-drift.test.mjs` exits 1 naming `Cannot find module './gate-producer-drift.mjs'` at the red commit)
  (Implements: S2, S3)
  - Relevant files: scripts/gate-producer-drift.test.mjs
- [x] P2 — Publish the producer's rule: the `gate-producer@1` block in the gate-run
  mark's owner (six fields: owner, command, mark-slot, ordering, precondition,
  absent), its `normative-surfaces@1` row, and the gate inventory row that claims
  it.
  (validator: `bun test scripts/normative-drift.test.mjs` exits 0 and `bun test scripts/prose-gate-inventory.test.mjs` exits 0)
  (Implements: S3, S4)
  - Relevant files: skills/pre-execution-review/references/LEDGERS.md, AGENTS.md, docs/workflow/GATE_INVENTORY.md
- [x] P3 — Ship the routing gate red-first's green half: the deterministic
  `gate-producer-drift` gate the corpus judges.
  (validator: `bun test scripts/gate-producer-drift.test.mjs` exits 0)
  (Implements: S2, S3, S4)
  - Relevant files: scripts/gate-producer-drift.mjs
- [x] P4 — Point the producer's default at the named constant instead of a literal,
  so the drift gate reads one home.
  (validator: `bun test scripts/gate-receipt.test.mjs` exits 0 with its default-gate case green)
  (Implements: S2)
  - Relevant files: packages/agentic-workflow/src/gate-receipt/index.mjs
- [x] P5 — Route the four gate-running step owners through the producer: the
  executor's step gate and its `gate-ran@1` marks section, the fold's gate and
  its `REPAIR-RECEIPT` line, the lane's close-out receipt stage, and the
  reviewer's own gate run.
  (validator: `bun scripts/gate-producer-drift.mjs` exits 0 printing `verdict: PASS`)
  (Implements: S2, S3, S4, S5)
  - Relevant files: skills/execute-phase/SKILL.md, skills/execute-phase/references/EXECUTION_CONTRACT.md, skills/execute-phase/references/FOLDING.md, skills/fold-findings/SKILL.md, skills/fold-findings/references/FOLD_PROCESS.md, skills/unit-lane/SKILL.md, skills/review-change/references/PERSIST_AND_DECIDE.md
- [x] P6 — Declare the precondition where a project fills it in, and name the owner a
  consumer's re-route goes to.
  (validator: `bun test scripts/gate-producer-drift.test.mjs` exits 0 with its template case green)
  (Implements: S5, S6, S7)
  - Relevant files: template/AGENTS.md, packages/agentic-workflow/README.md
- [x] P7 — Ship the declared state and verify like a writer: the unit doc's evidence
  and log, the roadmap row through `roadmap rowUpsert`, the changeset, the
  generated projection, the session fragment, the derived test-impact set, the
  differential against the base commit and the local gate.
  (validator: `bun scripts/local-gate.mjs --jobs 4 --no-bail` reports every step's verdict and `bun packages/agentic-workflow/bin/agentic-workflow.mjs docs-generate --check` exits 0)
  (Implements: S1)
  - Relevant files: docs/features/728-gate-receipt-producer, docs/ROADMAP.md, .changeset/728-gate-receipt-producer.md, docs/generated

### Planning evidence

Frozen at the cut in [`planning-evidence.md`](planning-evidence.md) (large unit —
the ledger lives beside this document, never both).

### Obligations

Frozen at the cut in [`planning-obligations.md`](planning-obligations.md) (large
unit — the ledger lives beside this document, never both). Before the unit ships,
every row is `verified` or an evidenced `n/a`.

## Triaged steps

`n/a — the owner's local inline workflow substitutes for the lane's plan step:
the §5 ledger freeze is the plan, and no `unit-route --triage` block is derived
for this change (it would be a second, competing step list).`

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|
| F1 | S4 · docs/features/728-gate-receipt-producer/SPEC.md:553 | workflow | WARNING | docs-only | runtime | fold |

## Log

- **L1** — 2026-11-26, the request, verbatim:
  ```
  Apply to this repository: issue #728
  ```
- **L2** — 2026-11-26, the issue's words are `## Specs` S2–S7 above, quoted
  verbatim and in the issue's order; they are not duplicated here a second time.
  Applied through the owner's local, unpublished inline workflow: the §5 ledger
  freeze is the plan, only the repository's deterministic gates run, and the diff
  is handed to the owner as the external verifier.
- **L3** — 2026-11-26, the issue's measurement re-taken before any
  implementation, in `mktemp -d` scratch: `rg -l 'gate-receipt' skills/` answers
  **7** files (both `audit-pr` files, `review-verify`, `runner-contract`,
  both `self-documenting-cli` files, `triage-issue`), and the four step owners
  that run a verification gate — `execute-phase`, `fold-findings`, `unit-lane`,
  `review-change` — answer **0** each. The producer's mechanic was measured
  against a toy project and against this repository's real gate before any file
  changed (PE-012–PE-015).
- **L4** — 2026-11-26, the consumer clause withdrawn (`D9`): the cut planned one
  clause in `skills/review-verify/SKILL.md`'s checklist naming the owner a
  re-route goes to. `bun test scripts/review-pack-preamble.test.mjs` refused it
  by name — `review-verify: the checklist items are byte-identical to the
  pre-change block` — so the clause is withdrawn, the file is byte-identical to
  the base commit, and criterion 7 states the untouched consumer instead (its
  `ac-hash` re-frozen to the amended section).
- **L5** — 2026-11-26, the context budgets re-based (`D10`): two reference
  ceilings, twelve route ceilings and two document ceilings, each measured and
  each with its growth source recorded in the manifest's own `sources` map. The
  gate caught it exactly as designed (`check-skill-context.test.mjs` red on
  `--routes --json`), which is why the re-basis is a recorded row and not a
  silent raise.
- **L6** — 2026-11-26, one obligation validator corrected before its run, not
  after: O7's cell claimed `rg -c 'gate-receipt run' skills/review-change` would
  match ≥ 2, and the shipped text carries one (the step-11 ordering). The cell
  now states the count the tree actually holds, so `verified` is truthful.
- **L7** — 2026-11-26, the correction batch over the external-verify receipt
  (`external-verify.md`, `NEEDS-DECISION` with 3 blockers / 7 advisories),
  triaged under the owner's "triage and fix those that deserve to fix" — every
  blocker and all seven advisories corrected, none waived. Blockers: AC7/O10's
  consumer-side diff re-scoped (`skills/review-*` plus
  `':(exclude)skills/review-change'`, the composer this unit edits — 0 paths in
  both shell forms, the pack's passes and both consumers still covered), E15
  amended beside it, `D6`'s stale `review-verify` clause claim withdrawn in
  place, P6's stale `Relevant files` line dropped. Advisories: AC1 now names
  what the diff actually covers (Impact + Surfaces + tasks' files + D10), E16
  carries the loaded-box re-run note, the handshake exception reached the fold
  and reviewer call sites (new row O17), the `ed1ffdab4` corpus-expectation
  correction is recorded here at E17, `LEDGERS.md`'s mark example reads
  `additive trailing slot` instead of `reserved`, E12 names its three
  invocations, and the Applicable-tests red-first entry carries
  `--timeout 60000`. `ac-hash` re-frozen to the amended section (precedent L4);
  O10 was flipped back before its corrected validator re-ran, O17 added and
  judged on its own run. Two loop hits, both caught before any status flipped:
  the reviewer call-site clause pushed the four `review-change:*` routes past
  their exact-boundary ceilings (re-based under the gate's own instruction with
  a per-route growth-source row in `SKILL_CONTEXT_BUDGETS.json`), and a wrap
  split `no handshake gate` across two lines so O17's own validator named
  `fold-findings/SKILL.md` missing until the clause was re-wrapped.
- **E1** — 2026-11-26, the frozen corpus alone at `caf8f996f`, red against the
  unchanged tree: `bun test scripts/gate-producer-drift.test.mjs` · exit 1 ·
  `Cannot find module './gate-producer-drift.mjs'` · **0 pass / 1 fail**.
- **E2** — 2026-11-26, the green half (`ed1ffdab4`): `bun test
  scripts/gate-producer-drift.test.mjs` · exit 0 · **9 pass / 0 fail**.
- **E3** — 2026-11-26, the gate itself at the same head: `bun
  scripts/gate-producer-drift.mjs` · exit 0 · `gate-producer-drift —
  feat-728-gate-receipt-producer · 4 callers · 1 owner block · 1 template guide
  · 0 findings` then `verdict: PASS`.
- **E4** — 2026-11-26, the owner block and the mark: `bun test
  scripts/gate-receipt.test.mjs` · exit 0 · **10 pass**, the freshness case
  (`freshness ignores the HEAD sha and unsigned files, and flips on a signed
  byte`) among them; `bun test scripts/gate-producer-drift.test.mjs` · exit 0 ·
  its two owner-field cases green (the real block publishes all six fields and
  the mark's `manifest <sha>` slot).
- **E5** — 2026-11-26, the mechanic measured before any file changed
  (`mktemp -d`, PE-005–PE-009): a handshake gate → `run` exit 0 / `verdict:
  pass`, `verify` exit 0 `current` + `pass`; a write inside the signed closure (a
  file under the fixture's `docs/`) after it → `verify` exit **4** naming that
  path; a write under the fixture's `.agentic-workflow/` → still `current`; a
  gate that rejects `--json` → `run` exit **2** with `verdict: degraded`; a gate
  that ignores it and exits 0 → `run` exit **1**, `degraded`.
- **E6** — 2026-11-26, the four callers cite the producer (`rg -c 'gate-receipt
  run'`, per skill tree): `execute-phase` **3**, `fold-findings` **2**,
  `unit-lane` **1**, `review-change` **1** — every one of them zero at the base
  commit.
- **E7** — 2026-11-26, the precondition and the default: `bun test
  scripts/gate-producer-drift.test.mjs` · exit 0 with `the template guide
  declares the handshake and the producer command` and `the producer's default
  gate is this repository's real handshake gate`; the test imports both tokens
  (`GATE_DEFAULT_SCRIPT`, `GATE_RESULT_SCHEMA`) from their own homes and asserts
  they are equal — `scripts/local-gate.mjs` publishes `local-gate-result@1`.
- **E8** — 2026-11-26, S6's premise checked rather than assumed: `test -d .husky`
  · exit 1 (absent) and `rg -n 'install-hook' scripts/local-gate.mjs` names
  `.git/hooks/pre-push` (lines 51-52, 734) — the hook route is withdrawn in
  `## Non-goals` with that evidence, not silently.
- **E9** — 2026-11-26, the consumer half untouched: `bun test
  scripts/audit-pr-receipt.test.mjs` · exit 0 · **32 pass**; `bun test
  scripts/gate-receipt.test.mjs` · exit 0 · **10 pass**; `git diff --stat
  $(git merge-base origin/main HEAD)..HEAD -- packages/agentic-workflow-schema`
  · **0 lines**.
- **E10** — 2026-11-26, the declared state: `bun
  packages/agentic-workflow/bin/agentic-workflow.mjs docs-generate --check` ·
  exit 0 · `3 checked · 0 missing · 0 stale · 0 orphaned` / `Roadmap: unchanged`
  · `verdict: PASS`; `bun scripts/lint-changeset.mjs
  .changeset/728-gate-receipt-producer.md` · `ok` · exit 0; `roadmap read
  docs/ROADMAP.md --nn 728` · the row reads `in-progress` with the emitter's
  summary; `roadmap check docs/features/728-gate-receipt-producer/SPEC.md` ·
  `violations: []` scrolls.
- **E11** — 2026-11-26, the branch's own subjects (`git log --format=%s
  022769f8b..HEAD`): three `docs(728)`, one `test(gate-producer)`, one
  `feat(gate-producer)` — no review, fold or audit commit, and the red commit
  touches the suite alone.
- **E12** — 2026-11-26, the routing gate's neighbours at the final head: `bun
  test scripts/normative-drift.test.mjs` · exit 0 · **24 pass**; `bun test
  scripts/prose-gate-inventory.test.mjs` · exit 0 · **22 pass**; `bun test
  scripts/skill-lint.test.mjs` · exit 0 · **20 pass**; `bun test
  scripts/test-obligation-tags.test.mjs` · exit 0 · **22 pass**; `bun test
  scripts/structural-sibling-pins.test.mjs` · exit 0 · **8 pass**; `bun scripts/
  check-skill-context.mjs` · three invocations — default · `PASS context
  budgets: 33 skills`, `--routes` · `PASS route budgets: 14 routes`,
  `--documents` · `PASS context documents: 7 budgeted documents`; `bun test
  scripts/red-first.test.mjs` · exit 0 · **9 pass** (its declared 60s bound).
- **E13** — 2026-11-26, the differential (§6): a `mktemp` toy project (one
  handshake gate writing a `passed` step) driven by the base commit's
  `gate-receipt.mjs` (`022769f8b` in the main checkout) and by this branch's,
  then compared — `run` stdout **identical**, `verify --json` stdout
  **identical**, and the receipt **identical** modulo `generated_at`,
  `gate_command`, `duration_ms` (the only fields the named-constant refactor
  cannot touch). No unrequested stdout, stderr or exit difference.
- **E14** — 2026-11-26, the derived test impact: `runner test-impact --base
  origin/main` · `TEST IMPACT — targeted` · 24 changed paths, 4 executable, 166
  suites derived; the set is the conservative whole-estate answer, and the
  local gate's own suites subsume it (`G1`).
- **E15** — 2026-11-26, the review pack's frozen checklists after `D9`:
  `bun test scripts/review-pack-preamble.test.mjs` · PASS (0 fail), and the
  consumer-side diff with the 2026-11-26 correction batch's exclusion — `git diff
  --name-only $(git merge-base origin/main HEAD)..HEAD -- skills/review-verify
  skills/audit-pr skills/review-* ':(exclude)skills/review-change'` · **0 paths**
  (as first written the line carried no exclusion and counted
  `skills/review-change`, which this unit edits as the fourth caller — the
  receipt's blocker 1; see L7).
- **E16** — 2026-11-26, the root suite with the bound the reds were hiding:
  `bun scripts/run-root-suite.mjs --jobs 4 --test-timeout 60` · two reds only,
  `scripts/findings-corpus.test.mjs` (the frozen 1173 count against the tree's
  1178 — reproduced at the base commit, 16 pass / 1 fail there) and
  `scripts/workflow-doctor.test.mjs` (red at the base commit too); every other
  suite green, including `scripts/ceremony-findings-ledger.test.mjs` (19/19 with
  headroom, red only under the 5s standalone default). Re-run 2026-11-26 at the
  correction batch's handoff, box load 10.7–12.8 on 6 CPUs: the same command
  reported **5** reds — these two, plus `scripts/phase-lint.test.mjs` and
  `scripts/workflow-status-sensor.test.mjs` (SUITE TIMEOUT at the shared 120s
  bound) and `scripts/red-first.test.mjs` (64.2s against its declared 60s) — and
  all three are green standalone at this head (162/0; 81/0 and 9/0 at
  `--timeout 60000`), on three suites this diff does not touch: load-shaped,
  not change-caused (receipt advisory 2, `external-verify.md`).
- **E17** — 2026-11-26, the correction batch's foreground runs. O10: the
  corrected diff (AC7's own command) · **0 paths**, identical quoted and
  shell-expanded; `bun test scripts/audit-pr-receipt.test.mjs` · **32 pass**;
  `bun test scripts/gate-receipt.test.mjs` · **10 pass**. O17: `rg -l 'no
  handshake gate' <the three call sites>` · **3 files**;
  `bun scripts/check-skill-context.mjs --routes` · `PASS route budgets: 14
  routes` after the declared re-basis (adversarial 28013/1922, default-backend
  and default-web 24471/1697, synthesize 25225/1735 — each
  `ceil(measured × 1.10)`, one growth-source row per route). Neighbours after
  the batch, all 0 fail: `gate-producer-drift.test` 9 (+ `bun
  scripts/gate-producer-drift.mjs` · `verdict: PASS`), `normative-drift` 24,
  `skill-lint` 20, `test-obligation-tags` 22, `structural-sibling-pins` 8,
  `prose-gate-inventory` 22, `red-first` 9 at `--timeout 60000`,
  `review-loop-discipline` exit 0 (assertion script), `next-recommendations` 8,
  `invocation-drift` 13, `residue-dimensions` 30, `ledger-ownership` 15,
  `decision-promotion` 14, `check-skill-context.test` 1, `roadmap-settle.test`
  10, `docs-generate.test` 31, `lane-era-lineage` 24, `pre-execution-quality`
  2, `retention-declaration` 6, `doc-discipline` 21, `promise-coherence` 37,
  `delivery-conditions` 20, crate `scaffold-contract.test` 18 (ac-hash
  contract), pi `skill-parity` + `alias-coverage` 24; default/`--routes`/
  `--documents` budget modes all PASS; `acceptanceState` → `match`
  (`22b07bae…`); `bun scripts/lint-changeset.mjs` · ok; `docs-generate --check`
  · `3 checked · 0 stale` · `verdict: PASS`; `roadmap check` · `violations: 0`;
  and the batch's own full gate, `bun scripts/local-gate.mjs --jobs 4
  --no-bail` · exit 1 with the identical shape as G2 — every step green but
  `root-suite`, whose first red is the base-present `findings-corpus` count
  (1178 vs frozen 1173), 5 dependents skipped.
- **G1** — 2026-11-26, GATE-RAN | HEAD 9addb0bc9 | `bun scripts/gate-receipt.mjs
  run -- --jobs 4 --no-bail` | exit 1 | manifest
  e0cf41118e15a788d058bd76b918264d92d5ce273ef21c30506934510cb84207 — the run
  through the producer at that head: **14 passed / 1 failed / 5 skipped**, the
  failed check `root-suite`, `verdict: fail`, `manifest.entries` 2,431. The five
  skipped dependents were run by hand at the same head: `crate-suite-bun` exit
  1 (its sole red `doc.structure.test.mjs`, SUITE TIMEOUT at its own declared
  240s bound — 19/19 cases pass standalone in 208s against the base commit's
  291s), `crate-suite-node` exit 1 (the same single red), `schema-node-compat`
  exit 0 (**953 pass / 0 fail**), `pi-node-compat` exit 0 (**1,114 pass / 0
  fail / 1 skipped**), `pi-compat-guard` exit 0 (`pi leg floor` and `pi leg
  latest: tsc --noEmit clean`). The root suite's own reds are the two
  base-present ones named in `## Known pre-existing issues`.

- **G2** — 2026-11-26, GATE-RAN | HEAD 68f85b54 | `bun scripts/gate-receipt.mjs
  run -- --jobs 4 --no-bail` | exit 1 | manifest
  be3d4c29fb4eba6fa1bf780a6e67a6c5bebc5117ad5d9a1e6a406dc6cb7edaf3 — the
  terminal run through the producer at `68f85b545`, and the receipt it left:
  `runner gate-receipt verify` answers `status: current`, `verdict: fail`,
  `blocker: gate verdict is fail`, exit 1 — **14 passed / 1 failed / 5
  skipped**, `manifest.entries` 2,416, the one failed check `root-suite`, whose
  first red is `scripts/findings-corpus.test.mjs` (the base-present frozen
  count above). `scripts/ceremony-findings-ledger.test.mjs` passed inside that
  run in 72s, so its earlier red was the per-test budget under load, exactly as
  recorded. A receipt that cannot say `pass` says `fail` and names the check —
  the one behaviour this unit exists to make reachable.

- **G3** — 2026-11-26, GATE-RAN | HEAD b54671fb7 | `runner gate-receipt run`
  (`bun packages/agentic-workflow/bin/agentic-workflow.mjs gate-receipt run -- --jobs 4
  --no-bail`) | exit 1 | manifest
  269651b4…afe0 — the review's own produced run at `b54671fb7` (cycle 1):
  **14 passed / 1 failed / 5 skipped**, the first red again
  `scripts/findings-corpus.test.mjs` — the tree's open findings now 1,180 rows
  against the frozen 1,173 (the corpus freeze deficatie above, plus the two
  open rows this review persisted).

- **R1** — 2026-11-26, review at HEAD b54671fb7 · verdict NEEDS-DECISION ·
  cycle 1 · gate exit 1 — axes run: review-code, review-security,
  review-verify, review-perf, usage-docs (inline); skipped: review-design,
  review-a11y, review-seo (no UI/web surface), review-brand (no brand doc);
  fix-now rows F1 and F4 persisted (`external-verify` process again:
  F2 is a decision-required pre-existing deficit and is not persisted).

- **V1** — docs/features/728-gate-receipt-producer/SPEC.md:553 · reviewer
  review-change · HEAD b54671fb7 · recheck `reproducible command output:`
  `bun packages/agentic-workflow/bin/agentic-workflow.mjs gate-receipt verify`
  answers `status: stale` at `b54671fb7` (changed: the eight signed paths the
  correction batch wrote after the last produced receipt), with
  `git log --format='%h %ad' --date=format:'%H:%M'` (68f85b545 17:49 <
  27cbc26a3 19:29) · confirmed

- **V2** — skills/fold-findings/references/FOLD_PROCESS.md:40 · reviewer
  review-change · HEAD b54671fb7 · recheck `direct read:` lines 24-27 (the
  producer at step 4) plus line 40 ("The producer ran before this commit
  (step 4), because the ledger flip is a signed byte: producing after it
  would leave the receipt stale the moment the commit lands") contradict
  `gate-producer@1`'s `ordering` field (LEDGERS.md:304, "the producer is the
  step's last signed-byte write") and the pinned freshness behaviour
  (`gate-receipt.test.mjs`: a signed byte after a run flips it stale, so
  producing AFTER the flip is what covers it) · confirmed

- **F2** — 2026-11-26, F4 folded (S4 · `skills/fold-findings/references/FOLD_PROCESS.md`,
  review mark `V2`): the fold process placed the producer at step 4, *before* its
  own step-5 ledger flip, and its closing sentence claimed producing *after* the
  flip would stale the receipt — the inverse of `gate-producer@1`'s `ordering`
  field and of the pinned freshness behaviour, so a conforming batch landed stale
  by construction. Repaired by reordering, not by rewording: step 4 verifies,
  step 5 stages, step 7 produces (`runner gate-receipt run` over the staged bytes)
  and commits those same bytes unchanged; the contradicting sentence is deleted
  rather than moved (net narration diff −5 lines). The guard is a new case in the
  producer's suite reading every gate-running call site for the inverted claim —
  red first at `1a6bb9ac6` (9 pass / 1 fail), green with the repair, and red again
  by name (`FINDING ordering-inverted — skills/fold-findings`) when the inversion
  is re-injected into the real tree.
  swept: `/producing\s+after\s+(it|them|that|this)\s+would\s+leave\s+the\s+receipt\s+stale/iu` → expected 0 in skills/**
  swept: `/producer ran before/` → expected 0 in skills/**

- **G4** — 2026-11-26, GATE-RAN | HEAD 1cf9c68b0 | `runner gate-receipt run`
  (`bun packages/agentic-workflow/bin/agentic-workflow.mjs gate-receipt run -- --jobs 4
  --no-bail`) | exit 1 | manifest
  55cc4363…6b05 — the fold's produced run: **14 passed / 1 failed / 5 skipped**,
  the one failed check `root-suite`, whose first red is still
  `scripts/findings-corpus.test.mjs` (1,179 rows against the frozen 1,173, one
  fewer than G3 because F4's row left the carrier) — F2's pre-existing deficit,
  not this fold's. Producing this run *after* the fold's ledger flip is the
  ordering the repaired `FOLD_PROCESS.md` states.

## Next

The external verifier's verdict — the diff, the obligations ledger (`16 rows ×
`verified`) and the verification block above are handed over as one batch; no
repository review machinery ran on this change.

## References

- Pull request [#732](https://github.com/gtrabanco/agentic-workflow/pull/732) —
  this unit's delivery vehicle; merge state lives in the forge, not the roadmap
  row.
- Issue [#728](https://github.com/gtrabanco/agentic-workflow/issues/728) — the
  consumer-only ceremony this unit gives a producer.
- `docs/features/108-machine-gate-receipts/` — `gate-receipt@1`, the receipt's
  shape, freshness predicate and handshake, published by issue #409.
- `docs/workflow/GATE_INVENTORY.md` — the carrier every gate names.
