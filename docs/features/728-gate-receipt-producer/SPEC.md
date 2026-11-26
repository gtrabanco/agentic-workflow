---
type: feature
scope: large
roadmap_summary: Issue [#728](https://github.com/gtrabanco/agentic-workflow/issues/728) (L): the gate receipt gains a producer in the lane's execution path — `execute-phase`, `fold-findings`, `unit-lane` and `review-change` run their verification gate *as* `runner gate-receipt run`, the `GATE-RAN` mark fills its reserved `manifest <sha>` slot with the receipt's digest, the run is the step's last signed-byte write so the receipt is current at the audited head, a project declares the handshake gate that makes it possible, and a deterministic drift gate refuses a step owner shipped with zero citations.
ac-hash: 61db1db28348df5d28e8b9d12a082c0021d84f7a522c1da14cd8497687a4c2d0
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

1. **S1 — the issue is applied inside its declared surface.** `git diff --name-only $(git merge-base origin/main HEAD)..HEAD` lists only paths `## Impact` names, and every `S#` above appears verbatim in this document.
2. **S2 — no lane step leaves a green gate unrecorded.** `bun test scripts/gate-producer-drift.test.mjs` exits 0 with `every gate-running step owner cites the producer's command and its block`; the mechanic each caller relies on is pinned by `bun test scripts/gate-receipt.test.mjs` exiting 0 with `a green run writes the envelope and the full log`.
3. **S3 — the zero-citation tree is gone.** `bun scripts/gate-producer-drift.mjs` exits 0 and prints `gate-producer-drift — … · 4 callers · 1 owner block · 1 template guide · 0 findings` then `verdict: PASS`.
4. **S4 — the run is recorded where the head is decided, never after it.** The owner block declares the ordering rule and the receipt the mark cites: `bun test scripts/gate-producer-drift.test.mjs` exits 0 with `the owner block publishes every producer field and keeps the mark's manifest slot`, and `rg -n 'ordering \|' skills/pre-execution-review/references/LEDGERS.md` answers one line naming the step's last signed-byte write.
5. **S5 — the executor produces.** `skills/execute-phase` is one of the four callers the drift gate reads, and its step-completion gate names the producer: `bun scripts/gate-producer-drift.mjs` exits 0 with `execute-phase` in its four callers, and `rg -c 'gate-receipt run' skills/execute-phase` is ≥ 2.
6. **S6 — the hook route is deliberately not taken, and the reason is recorded.** `test -d .husky` answers absent (no pre-commit gate to route) and `rg -n 'install-hook' scripts/local-gate.mjs` shows the installed hook is `pre-push`; `## Non-goals` states the route and that evidence.
7. **S7 — the consumer side is untouched and now has a step to route to.** `bun test scripts/audit-pr-receipt.test.mjs` exits 0 and `bun test scripts/gate-receipt.test.mjs` exits 0 (the merge gate's receipt judgment and the freshness predicate are byte-identical), and `skills/review-verify/SKILL.md`'s re-route names the owner that produces the receipt.

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
- `skills/review-verify` — one clause of its consumer checklist names the owner
  a re-route goes to. Consumers: the review pack's composition.
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

**Nothing live is touched:** the receipts and logs the producer writes land under
`.agentic-workflow/gate/`, which is gitignored in this repository and absent from
the receipt's own signed closure, so producing a receipt never stales it.

## Surfaces

- `skills/execute-phase`
- `skills/fold-findings`
- `skills/unit-lane`
- `skills/review-change`
- `skills/review-verify`
- `skills/pre-execution-review`
- `template`
- `scripts`
- `packages/agentic-workflow`
- `docs`

## Retirements

Strictly additive: no surface is retired, renamed or removed. The computed
surface inventory (`runner residual-classify --inventory --base <base>`) is the
receipt for that answer:

| surface | state | consumer |
|---|---|---|

The inventory is filled at P7 from the classifier's own output; an empty table
here would be the omitted receipt the section exists to prevent.

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
- `bun test scripts/red-first.test.mjs`
- `bun scripts/check-skill-context.mjs`
- `bun test scripts/prose-gate-inventory.test.mjs`
- `bun scripts/lint-changeset.mjs .changeset/728-gate-receipt-producer.md`

## Known pre-existing issues

- **`scripts/unit-doc-contract.test.mjs`'s train-stamp case is red on `main` and
  on this branch alike** — the unit-doc templates stamp `4.10.0` while the train
  is `4.10.1`. `does-not-affect` any path this change touches; verified at the
  base commit `022769f8b`.
- **`workspace-install` is red on `main` and on this branch alike** — the pi
  package pins the crate one patch behind the local version, so the workspace
  link resolves the registry copy. `affects` the local gate's dependant set
  (every dependent step is run by hand and recorded in this doc's `G` line);
  not repaired here — the train version and the sibling pin are the release
  machinery's owner decision.
- **The roadmap carries a duplicate feature row for one number** (a pre-existing
  index artifact): `roadmap-settle` reports it, no emitter deletes a row.
  `does-not-affect` any path this change touches.

## Tasks

- P1 — Land the frozen-failure corpus alone: the producer-routing suite, observed
  red against the unchanged tree on the issue's own measurement (four step
  owners, zero citations).
  (validator: `bun test scripts/gate-producer-drift.test.mjs` exits 1 naming `Cannot find module './gate-producer-drift.mjs'` at the red commit)
  (Implements: S2, S3)
  - Relevant files: scripts/gate-producer-drift.test.mjs
- P2 — Publish the producer's rule: the `gate-producer@1` block in the gate-run
  mark's owner (six fields: owner, command, mark-slot, ordering, precondition,
  absent), its `normative-surfaces@1` row, and the gate inventory row that claims
  it.
  (validator: `bun test scripts/normative-drift.test.mjs` exits 0 and `bun test scripts/prose-gate-inventory.test.mjs` exits 0)
  (Implements: S3, S4)
  - Relevant files: skills/pre-execution-review/references/LEDGERS.md, AGENTS.md, docs/workflow/GATE_INVENTORY.md
- P3 — Ship the routing gate red-first's green half: the deterministic
  `gate-producer-drift` gate the corpus judges.
  (validator: `bun test scripts/gate-producer-drift.test.mjs` exits 0)
  (Implements: S2, S3, S4)
  - Relevant files: scripts/gate-producer-drift.mjs
- P4 — Point the producer's default at the named constant instead of a literal,
  so the drift gate reads one home.
  (validator: `bun test scripts/gate-receipt.test.mjs` exits 0 with its default-gate case green)
  (Implements: S2)
  - Relevant files: packages/agentic-workflow/src/gate-receipt/index.mjs
- P5 — Route the four gate-running step owners through the producer: the
  executor's step gate and its `gate-ran@1` marks section, the fold's gate and
  its `REPAIR-RECEIPT` line, the lane's close-out receipt stage, and the
  reviewer's own gate run.
  (validator: `bun scripts/gate-producer-drift.mjs` exits 0 printing `verdict: PASS`)
  (Implements: S2, S3, S4, S5)
  - Relevant files: skills/execute-phase/SKILL.md, skills/execute-phase/references/EXECUTION_CONTRACT.md, skills/execute-phase/references/FOLDING.md, skills/fold-findings/SKILL.md, skills/fold-findings/references/FOLD_PROCESS.md, skills/unit-lane/SKILL.md, skills/review-change/references/PERSIST_AND_DECIDE.md
- P6 — Declare the precondition where a project fills it in, and name the owner a
  consumer's re-route goes to.
  (validator: `bun test scripts/gate-producer-drift.test.mjs` exits 0 with its template case green)
  (Implements: S5, S6, S7)
  - Relevant files: template/AGENTS.md, skills/review-verify/SKILL.md, packages/agentic-workflow/README.md
- P7 — Ship the declared state and verify like a writer: the unit doc's evidence
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

## Next

P5 — route the four gate-running step owners through the producer.

## References

- Issue [#728](https://github.com/gtrabanco/agentic-workflow/issues/728) — the
  consumer-only ceremony this unit gives a producer.
- `docs/features/108-machine-gate-receipts/` — `gate-receipt@1`, the receipt's
  shape, freshness predicate and handshake, published by issue #409.
- `docs/workflow/GATE_INVENTORY.md` — the carrier every gate names.
