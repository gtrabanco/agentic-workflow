---
type: fix
scope: medium
ac-hash: pending
---

# fix/566-upstream-corrected-instruction-bugs

> Fix specification — one single unit document. Routed by the owner onto the
> open fix-560 branch/PR (session ruling 2026-11-16, D1) — one branch carries
> issues #560, #566 and #567 to the owner's merge.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#566` — [ISSUE: upstream-corrected instruction bugs — mirror-reconciliation semantics, memory-probe capability gap, review_due contract correction (gentle-ai v4.5.0 rescan)](https://github.com/gtrabanco/agentic-workflow/issues/566). The issue is closed `completed` on the forge while its work is undone (session verification 2026-11-16); per the owner's ruling the PR carries `Refs #566` and he handles the forge state.

## Specs

Requirements, each numbered `S#`, quoting the requester's own words verbatim.

**S1 — B1: the mirror-reconciliation clause is repaired in `MEMORY.md`.**
> **B1 — mirror-reconciliation semantics in the memory protocol (shipped).** `skills/unit-lane/references/MEMORY.md` §3 step 5 and §7 last bullet say: *"read the file and the mirror; when the versions are irreconcilable, keep both and surface the difference rather than silently picking one."* […] The distinction our wording conflates: a **stale mirror right after our own write** is refreshed from the file (never surfaced, never blocked on); a **genuine conflict** (both sides independently edited differently) is the only case that preserves both versions and asks.
>
> - [ ] B1: `MEMORY.md` §3 step 5 and §7 carry the corrected semantics (file is source; stale mirror refreshed, never a blocker; no comparison/reconciliation scripts; never replay an applied write; preserve-both-and-ask only for genuine independent conflicting edits), with the superseded clause deleted in the same PR (no compatibility shim).

**S2 — B2: the probe verifies the capability, not the version.**
> **B2 — memory probe verifies presence/version, not capability (shipped).** `packages/agentic-workflow/src/memory/probe.mjs` check `binary-version` runs `engram --version` and `engram doctor`. Presence and version do not establish compatibility: the Pi companion hard-requires the `instance-id` capability […] and every engram core below `v2.0.0-rc.11` lacks it while passing presence checks […] the probe must check the **capability of the effective runtime** (`ENGRAM_BIN` then PATH; `ENGRAM_URL` set means the remote is authoritative and the local binary is not judged), not a version number.
>
> - [ ] B2: `memory/probe.mjs` verifies the effective runtime's `instance-id` capability (per upstream's documented probe form: `engram instance-id` with `ENGRAM_NO_UPDATE_CHECK=1` and a temp `ENGRAM_DATA_DIR`; `ENGRAM_URL` set → remote authoritative, local binary not judged); a missing binary stays a degraded answer, never a hard incompatibility; the verdict names the unmet capability. Shipped red-first with its sibling suite (`test/memory-probe.test.mjs` extended; both commits observed).

**S3 — B3: the contract correction stays a record until its unit ships.**
> **B3 — the `review_due` / review-on-slices wording must be adopted post-fix (pending — contract correction).** `review_due` semantics (#307 adoption item 2) were deliberately excluded from feature 79 (`SPEC.md` INV-006: *"review-on-slices is a follow-up unit once slices exist"*) and are not shipped on any committed surface — nothing to repair. […] This issue is the durable record of clauses 1–3; the future review-on-slices unit consumes it at design time.
>
> - [ ] B3: clauses 1–3 of this issue are cited verbatim by the review-on-slices unit at design time; the `under_budget` sentence (B3-3) never enters any committed surface.

**S4 — the ownership map does not move.**
> - [ ] No change to the memory protocol's ownership map (MEMORY.md stays the single home; thin pointers in `execute-phase`/`log-session` untouched).

## Impact

Cut at plan time. Every surface this unit reads or writes, and what changes on it:

| Surface | Why it changes | Its consumers |
|---|---|---|
| `skills/unit-lane/references/MEMORY.md` §7 last bullet (the "Read both sides back" bullet) | B1: the defective clause is replaced by the corrected contract and the superseded words are deleted (S1) | every session that reads the memory protocol; `unit-lane`/`execute-phase` step prose that points here (thin pointers, untouched) |
| `docs/features/66-engram-memory-substrate/SPEC.md` (narrative line + AC8 description) | sibling sweep: it asserts "irreconcilable versions preserved and surfaced" as delivered truth — gains a dated correction note (S1) | audit-docs, the receipt-neutrality readers |
| `packages/agentic-workflow/src/memory/probe.mjs` | B2: a sixth, additive `instance-id` capability check; the header's "Five checks" narration becomes six (S2) | `agentic-workflow memory probe` consumers (doctor, first-read Evidence), `packages/agentic-workflow/README.md` check table |
| `packages/agentic-workflow/test/memory-probe.test.mjs` | B2: the suite is extended first (red), then made green; the fixed-order/timeouts expectations grow with the check (S2) | the root gate's crate suite |
| `packages/agentic-workflow/README.md` (probe check table) | documentation currency: the sixth check is listed (S2) | the package's readers |
| `.changeset/` | a package-behaviour change ships its release intent (`feat`) | the release |
| `docs/ROADMAP.md` `## Fixes` row #566 | status settles to `done · [#577]` when the work lands on the owner's PR (D1 route) | `roadmap-settle`, `workflow-status` |
| `docs/fix/538-engram-startup-report/SPEC.md` PE-007 | checked: its "measures `binary-version` and `http-health` only for the first memory read" scopes the *timing*, not the check inventory — `does-not-affect` | — |
| `CHANGELOG.md` 0.4.0 row | historical release note for the five-check shape — left as history (no retro-edit) | — |

Deliberately untouched: `skills/execute-phase/**`, `skills/log-session/**` (S4), the `enam` binary itself, any MCP tool surface (the new check is a read-only CLI subcommand, so the probe's no-mutation contract holds).

## Retirements

One executable-adjacent retirement, one narrative:

- the B1 **clause** "when the versions are irreconcilable, keep both and surface the difference rather than silently picking one" — replaced by the corrected contract in the same bullet; pin: `rg -c 'keep both and surface the difference' skills/unit-lane/references/MEMORY.md` → 0 after the fix (1 at base).
- the **narration** "Five checks, one verdict" in `probe.mjs`'s header and the five-row README table — superseded in the same change by the six-check text (same files, same PR). The check itself is additive: no existing check id is removed, so `CHECK_IDS` keeps its five and gains `instance-id`.

## Non-goals

- **No version gate** (S2): a uniform `v2.0.0-rc.11` version gate is explicitly rejected by the issue ("A uniform version gate would falsely block working setups") — the check is capability-shaped only.
- **B3 ships nothing** (S3): no `review_due` wording enters any committed surface here; the issue body stays the record until the review-on-slices unit exists.
- **No new probe surface** beyond the one check: no MCP tool call, no network call, no sixth transport; `runProbe`'s injection shape and the 30 s ceiling stay as they are (the six checks still run in parallel, so the ceiling arithmetic does not grow).
- **No repair of the ownership-map pointers** (S4) and no translation of any surface.

## Risk tier

Computed by the closed ceremony CLI over this change's own path set (the four
unit docs plus `MEMORY.md`, `probe.mjs`, its suite, the package README and
feature 66's SPEC), copied verbatim, never written from memory (E-risk):

- **Tier** — `standard` · **Task Size** — `understood: true`,
  `contained_risk: "contained"`, `resumable_from_diff: true`,
  `ceremony: "unit-doc"`, `verification: "gates"`
- **Reason** — `2 path(s) carry executable content:
  packages/agentic-workflow/src/memory/probe.mjs,
  packages/agentic-workflow/test/memory-probe.test.mjs`
  (`reason_kind: executable-content`).
- **Named high-risk item** — none (`signals: []`) — not a high-tier unit.

## Future

`none` — the issue's own B3 row is a record inside the issue, not a deferred row of this unit.

## Future cost

| Standing obligation | Who it binds |
|---|---|
| The probe's check inventory stays additive: a seventh check is a docs+suite change in the same PR, and the README table plus the header narration move with it | anyone adding a probe check |
| The `instance-id` probe form (temp `ENGRAM_DATA_DIR`, `ENGRAM_NO_UPDATE_CHECK=1`, `ENGRAM_URL` remote-authoritative) is the capability probe's contract — a different probe form is a spec change, not a code tweak | whoever touches `checkInstanceId` |
| The corrected mirror contract's single home stays `MEMORY.md` §7; a future mirror surface adopts it by citation, never by copy | any future store-driver work |
| B3's three clauses are consumed only by the future review-on-slices unit, at design time | whoever files/lands review-on-slices |

## Applicable tests

`bun test packages/agentic-workflow/test/memory-probe.test.mjs` (the extended sibling suite — red-first, both commits observed), plus the deterministic gates: the root gate `bun scripts/local-gate.mjs --skip-network --jobs 1`, and `bun scripts/test-impact.mjs --base origin/main` to record the impact set.

## Known pre-existing issues

- **`scripts/next-step-ranking.test.mjs` can cross its 10 s per-test budget under load** (fix #560's disclosure) — `does-not-affect`: unrelated suite; the serial gate is green.
- **`docs/fix/538-engram-startup-report/SPEC.md` PE-007's phrasing** ("measures `binary-version` and `http-health` only for the first memory read") — `does-not-affect`: the "only" scopes the read window, not the check inventory (Impact table).

## Tasks

- P1 — Cut this unit doc with the frozen ledgers and `decisions.md`, triage pasted, risk verdict pasted (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/fix/566-upstream-corrected-instruction-bugs/SPEC.md` exits 0)
  (Implements: S1, S2, S3, S4)
  - Relevant files: docs/fix/566-upstream-corrected-instruction-bugs/SPEC.md, docs/fix/566-upstream-corrected-instruction-bugs/planning-obligations.md, docs/fix/566-upstream-corrected-instruction-bugs/planning-evidence.md, docs/fix/566-upstream-corrected-instruction-bugs/decisions.md
- P2 — B1: replace the §7 bullet with the corrected mirror contract (superseded clause deleted) and annotate feature 66's stale assertion (validator: `rg -c 'keep both and surface the difference' skills/unit-lane/references/MEMORY.md` exits 1)
  (Implements: S1)
  - Relevant files: skills/unit-lane/references/MEMORY.md, docs/features/66-engram-memory-substrate/SPEC.md
- P3 — B2 red-first, part 1: extend the sibling suite with the `instance-id` contract (fixed order, bounds, ENOENT, ENGRAM_URL, unmet capability, read-only form) and observe it fail against the current probe (validator: `bun test packages/agentic-workflow/test/memory-probe.test.mjs` exits 1)
  (Implements: S2)
  - Relevant files: packages/agentic-workflow/test/memory-probe.test.mjs
- P4 — B2 red-first, part 2: implement the sixth check and observe the suite green (validator: `bun test packages/agentic-workflow/test/memory-probe.test.mjs` exits 0)
  (Implements: S2)
  - Relevant files: packages/agentic-workflow/src/memory/probe.mjs
- P5 — Documentation and release currency: README check row, changeset, roadmap row (validator: `rg -c 'instance-id' packages/agentic-workflow/README.md` matches 1)
  (Implements: S2, S1)
  - Relevant files: packages/agentic-workflow/README.md, .changeset/, docs/ROADMAP.md
- P6 — The verification sweep: every obligation validator re-run, the impact verdict, the root gate (validator: `bun scripts/local-gate.mjs --skip-network --jobs 1` exits 0)
  (Implements: S1, S2, S3, S4)
  - Relevant files: docs/fix/566-upstream-corrected-instruction-bugs/SPEC.md

### Planning evidence

M-sized unit: the ledger lives in [`planning-evidence.md`](planning-evidence.md) beside this doc (never both).

### Obligations

M-sized unit: the ledger lives in [`planning-obligations.md`](planning-obligations.md) beside this doc.

## Acceptance criteria

- **AC1 (S1)** — the superseded clause is gone and the corrected semantics are stated — proved by `rg -c 'keep both and surface the difference' skills/unit-lane/references/MEMORY.md` exiting 1 and `rg -c 'The document is the source' skills/unit-lane/references/MEMORY.md` matching 1.
- **AC2 (S2)** — the probe carries the capability check with its contract — proved by `bun test packages/agentic-workflow/test/memory-probe.test.mjs` exiting 0 with the `instance-id` cases green, `rg -c 'const id = "instance-id"' packages/agentic-workflow/src/memory/probe.mjs` matching 1, and the red commit (suite exit 1) recorded before the green one in `## Log`.
- **AC3 (S3)** — B3 stays a record — evidenced `n/a`: the issue body's own words ("This issue is the durable record of clauses 1–3") plus feature 79 INV-006; no committed surface carries `review_due` wording (`rg -c 'review_due' skills/ packages/` → only the historical feature-79/560 citations, none a new adoption).
- **AC4 (S4)** — the ownership map did not move — proved by `git diff --name-only origin/main...HEAD -- skills/execute-phase skills/log-session` printing nothing, and the skills diff being `skills/unit-lane/references/MEMORY.md` only.

## Triaged steps

> Pasted verbatim from
> `bun packages/agentic-workflow/bin/agentic-workflow.mjs unit-route --triage 566-upstream-corrected-instruction-bugs`
> (the machine's authoritative step list). The owner's local workflow (§4/§5)
> substitutes for the lane: the frozen ledgers are the plan, the unit rides the
> fix-560 branch by owner ruling (D1), and no Relay packet is cut.

```text
TRIAGE — 566-upstream-corrected-instruction-bugs (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
relay: bootstrap-needed — no packet at .pi-web/relays/566-upstream-corrected-instruction-bugs
relay-next: create .pi-web/relays/566-upstream-corrected-instruction-bugs/ (charter → docs/fix/566-upstream-corrected-instruction-bugs/SPEC.md) then dispatch_relay(packet: ".pi-web/relays/566-upstream-corrected-instruction-bugs", leg: "1") · legs: 7 = 6 phases + 1 coherence review
```

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-16, the issue, verbatim:
  ```
### What's broken

Rescan of Gentleman-Programming/gentle-ai (v4.3.1 → v4.5.0, 2026-10-27 → 2026-11-14) found three bugs in instructions this repo adopted from its ODD canon (issue #307 direction): two shipped on committed surfaces here, one pending adoption that must never ship in its original form. Upstream found and fixed the first two by way of its own dogfooding; we adopted the pre-fix wording.

**B1 — mirror-reconciliation semantics in the memory protocol (shipped).** `skills/unit-lane/references/MEMORY.md` §3 step 5 and §7 last bullet say: *"read the file and the mirror; when the versions are irreconcilable, keep both and surface the difference rather than silently picking one."* Upstream replaced this exact clause after observing models author comparison/reconciliation scripts and stall on a mirror that is merely stale. The corrected contract (v4.5.0 `_shared/persistence-contract.md`):

> Read back both writes with the normal read tool; they are not atomic, but never author comparison or reconciliation scripts or gates for them. After a partial or failed sync, check which writes already applied and continue from that state; never replay an applied write. The document is the source: a mirror that differs from the document just written is refreshed from it, never a blocker. […] Preserve conflicting versions until the human resolves a genuine conflict.

The distinction our wording conflates: a **stale mirror right after our own write** is refreshed from the file (never surfaced, never blocked on); a **genuine conflict** (both sides independently edited differently) is the only case that preserves both versions and asks. Our boundary cadence (§2) is already correct and stays.

**B2 — memory probe verifies presence/version, not capability (shipped).** `packages/agentic-workflow/src/memory/probe.mjs` check `binary-version` runs `engram --version` and `engram doctor`. Presence and version do not establish compatibility: the Pi companion hard-requires the `instance-id` capability (an HTTP port-ownership concern, absent from the MCP tool schemas), and every engram core below `v2.0.0-rc.11` lacks it while passing presence checks — the mismatch then surfaces as a deterministic startup failure of the memory tools themselves (upstream issue [Gentleman-Programming/gentle-ai#5159](https://github.com/Gentleman-Programming/gentle-ai/issues/5159), open). On such a core our probe reports `ok` for the very layer it exists to qualify. A uniform version gate would falsely block working setups of agents that do not require the capability, so the probe must check the **capability of the effective runtime** (`ENGRAM_BIN` then PATH; `ENGRAM_URL` set means the remote is authoritative and the local binary is not judged), not a version number.

**B3 — the `review_due` / review-on-slices wording must be adopted post-fix (pending — contract correction).** `review_due` semantics (#307 adoption item 2) were deliberately excluded from feature 79 (`SPEC.md` INV-006: *"review-on-slices is a follow-up unit once slices exist"*) and are not shipped on any committed surface — nothing to repair. But the October wording we would have copied contains two defects upstream has since fixed, and one residual defect upstream has not:

1. **Boundary parity (fixed upstream):** the pre-fix rule closed and reviewed the open slice whenever a high-risk unit followed pending `under_budget` commits. Corrected: *"Review the pending slice only when `review_due` is true or the user explicitly asks; otherwise preserve the pending boundary and proceed without starting review. A task boundary neither authorizes review nor advances a reviewed boundary."*
2. **Failed assessment (fixed upstream):** pre-fix, an unavailable or failed assessment was treated as due (fail-closed *toward* review). Corrected: *"An unavailable or failed assessment never lowers the tier: report the missing assessment proof; never infer `review_due` or construct a preflight transition."*
3. **Residual upstream bug — do NOT copy (open, [gentle-ai#5371](https://github.com/Gentleman-Programming/gentle-ai/issues/5371)):** the sentence *"`under_budget` stays pending in the slice until a later commit reaches the budget"* is still present in v4.5.0 and is wrong for medium candidates: `assess` returns `under_budget` for a medium candidate regardless of size, so no later commit ever makes a medium range due by budget. Any unit that lands review-on-slices here must not carry that sentence.

This issue is the durable record of clauses 1–3; the future review-on-slices unit consumes it at design time.

### Detected in

Upstream rescan of 2026-11-15 (gentle-ai v4.3.1 → v4.5.0 diff, `odd/tasks/` records and open-issue sweep): `odd/tasks/review-due-boundary-parity.md` (B3-1, B3-2), `odd/tasks/5159-engram-companion-compatibility.md` (B2), `odd/tasks/5159` root-cause section (B2), `internal/assets/skills/_shared/persistence-contract.md` v4.5.0 (B1), upstream issue #5371 (B3-3). Cross-checked against our adopted-wording carriers: feature 79 SPEC INV-006 (B3 excluded, unshipped), `MEMORY.md` (B1 shipped), `memory/probe.mjs` (B2 shipped). Not affected, verified: "launched together" writer wording (we have no parallel-writer surface), correction bounds (our #159 wording has no reported defect), `branch-pr` policy removal (we never adopted it).

### Reproduction steps

B1: n/a (documentation-only). B2: run the probe against an engram core older than `v2.0.0-rc.11` — `binary-version` answers and the verdict is `ok`, while the memory tools fail to initialize with a deterministic startup error.

### Expected behaviour

B1: the file wins on every conflict with its own mirror; a differing mirror is refreshed from the file and is never a blocker or a surfaced difference; no reconciliation scripts; applied writes never replayed; only genuine independent conflicting edits preserve both versions and ask. B2: the probe's verdict reflects whether the effective runtime serves the capability the session's memory tools require, and names the unmet capability when it does not.

### Actual behaviour

B1: irreconcilable versions are "kept both and surfaced", inviting reconciliation scripts and stalls on a merely-stale mirror. B2: a capability-incompatible core passes the probe.

### Root cause (if known)

Pre-fix adoption from gentle-ai's ODD canon: B1 adopted the pre-v4.5.0 persistence contract; B2 reproduced upstream's own `VerifyInstalled` gap (executable presence treated as compatibility), which upstream itself has not yet fixed (#5159 open, fix designed in `odd/tasks/5159-engram-companion-compatibility.md`); B3 never shipped, so the root cause is only the recorded adoption wording predating upstream's boundary-parity fix.

### Acceptance criteria

- [ ] B1: `MEMORY.md` §3 step 5 and §7 carry the corrected semantics (file is source; stale mirror refreshed, never a blocker; no comparison/reconciliation scripts; never replay an applied write; preserve-both-and-ask only for genuine independent conflicting edits), with the superseded clause deleted in the same PR (no compatibility shim).
- [ ] B2: `memory/probe.mjs` verifies the effective runtime's `instance-id` capability (per upstream's documented probe form: `engram instance-id` with `ENGRAM_NO_UPDATE_CHECK=1` and a temp `ENGRAM_DATA_DIR`; `ENGRAM_URL` set → remote authoritative, local binary not judged); a missing binary stays a degraded answer, never a hard incompatibility; the verdict names the unmet capability. Shipped red-first with its sibling suite (`test/memory-probe.test.mjs` extended; both commits observed).
- [ ] B3: clauses 1–3 of this issue are cited verbatim by the review-on-slices unit at design time; the `under_budget` sentence (B3-3) never enters any committed surface.
- [ ] No change to the memory protocol's ownership map (MEMORY.md stays the single home; thin pointers in `execute-phase`/`log-session` untouched).

### Rollback strategy (if known)

B1 is prose — revert the MEMORY.md commit. B2 reverts with the same PR (probe check addition is additive; removing it restores the previous five-check shape).

### Severity

medium (functional but degraded)

## Dependencies

None. Soft order only: the future review-on-slices unit (not yet filed; excluded from feature 79 by INV-006) must consume this issue's B3 record at design time — `Related`, not a blocker. Upstream references: gentle-ai #5159 (open — we fix our own probe independently, capability probe form credited to their task record), #5371 (open — residual bug we must not copy), #6086 (open — `correction_request_unavailable` implemented upstream but not delivered; watch only, nothing adopted).

Automated written using an AI.
  ```
- **L2** — 2026-11-16, the owner's routing ruling, verbatim: "Wait don't work on 566 worktree, do it in this branch & pr or just open the closed issues with annotation of pending work to redo them" — route selected: `fix-here` ("Fix both here, on this branch & PR #577"), knowingly overriding one-PR-per-unit; recorded as D1.
- **E1** — 2026-11-16, the §2 RED corpus, observed before any fix: `rg -c 'keep both and surface the difference' skills/unit-lane/references/MEMORY.md` · 1 (the B1 defect live); `rg -c 'irreconcilable versions preserved' docs/features/66-engram-memory-substrate/SPEC.md` · 1 (the stale sibling); `rg -c 'instance-id' packages/agentic-workflow/src/memory/probe.mjs` · exit 1 (0 matches); `rg -c 'instance-id' packages/agentic-workflow/test/memory-probe.test.mjs` · exit 1; `rg -c 'instance-id' packages/agentic-workflow/README.md` · exit 1; `ls .changeset/probe-instance-id-capability.md` · exit 2 (absent).
- **E2** — 2026-11-16, the plan receipts: `bun packages/agentic-workflow/bin/agentic-workflow.mjs unit-route --triage 566-upstream-corrected-instruction-bugs` · exit 0 · the block pasted in `## Triaged steps`; `bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify --paths "…9 paths…"` · exit 0 · `tier: standard`, `reason_kind: executable-content`, `signals: []`, `task_size: {understood: true, contained_risk: contained, resumable_from_diff: true, ceremony: unit-doc, verification: gates}` — pasted in `## Risk tier`.
- **E3** — 2026-11-16, B1 GREEN at `27f33c41`: `rg -c 'keep both and surface the difference' skills/unit-lane/references/MEMORY.md` · exit 1 (RED was 1, E1); `rg -c 'The document is the source' …` · 1; `rg -c 'corrected 2026-11-16' docs/features/66-engram-memory-substrate/SPEC.md` · 1; sibling sweep `rg 'irreconcilable|surface the difference' skills/ packages/` → 0 matches; feature 66's AC8 pattern `rg -c 'pending' …MEMORY.md` · 4 (≥ 3 holds).
- **E4** — 2026-11-16, red-first (O7): RED observed at `68470eea` (the suite commit, landing alone) — `bun test packages/agentic-workflow/test/memory-probe.test.mjs` · exit 1 · **8 fail / 17 pass** (the new contract against the old probe); GREEN observed at `8db537de` · exit 0 · **25 pass / 0 fail**, and `node --test packages/agentic-workflow/test/memory-probe.test.mjs` · exit 0 — both runtimes.
- **E5** — 2026-11-16, the live read-only run (S2): `bun packages/agentic-workflow/bin/agentic-workflow.mjs memory probe` · exit 0 · six checks listed; `instance-id · ok · instance-id capability served (d56c06daeba8febb1acf428c3dcee1e7)` against the real engram 3.7.2 under the temp data dir; verdict `degraded` only on this machine's known `session-ambiguity` finding (pre-existing, feature 66/538 records it).
- **E6** — 2026-11-16, the P6 validators before the gate: O4 `rg -c 'const id = "instance-id"' …probe.mjs` · 1; O5 `rg -c 'env\?\.ENGRAM_URL === "string"' …` · 1; O8 `rg -c 'instance-id' packages/agentic-workflow/README.md` · 1; O9 `ls .changeset/probe-instance-id-capability.md` · exit 0; O10 `git diff --name-only origin/main...HEAD -- skills/execute-phase skills/log-session` · empty output, and the skills diff is `skills/unit-lane/references/MEMORY.md` only; O11 `gh api repos/gtrabanco/agentic-workflow/issues/566 --jq .body | rg -c 'durable record of clauses'` · 1, plus `rg 'review_due' skills/ packages/` → no matches (no adoption).
- **E7** — 2026-11-16, a cut-time ledger correction (never a weakening): O5's validator cell as frozen read `rg -c 'ENGRAM_URL' …` with outcome `matches 1`, but that pattern spans 5 lines of the delivered code; before any flip the cell was tightened to the exact condition line (`env?.ENGRAM_URL === "string"`, matches 1) — the row was still `planned`, the check got more precise, and the correction is recorded here.
- **P1** — 2026-11-16, the unit doc, both M-size ledgers and `decisions.md` cut, triage + risk pasted, RED corpus recorded · `31b338a2`.
- **P3** — 2026-11-16, B2 red-first part 1: the extended sibling suite lands alone and is observed failing (8/17, exit 1) · `68470eea`.
- **P4** — 2026-11-16, B2 red-first part 2: the sixth `instance-id` check lands, suite green 25/0 on bun and node, live run answers `capability served` · `8db537de`.
- **P2** — 2026-11-16, B1: the corrected mirror bullet and feature 66's dated note (authored before the B2 pair, committed when the working tree was committed) · `27f33c41`.
- **P5** — 2026-11-16, currency: README six-check table + prose, the changeset, the suite comment, O5's validator tightening · `550257a8`.

## Next

Execute P2 (B1) — the RED side of its failing check is already recorded (E-base, below).

## References

- Issue [#566](https://github.com/gtrabanco/agentic-workflow/issues/566) — the unit's request (closed `completed` while undone; PR carries `Refs #566`).
- Upstream gentle-ai v4.5.0 `_shared/persistence-contract.md` (the corrected wording, quoted through the issue) and gentle-ai [#5159](https://github.com/Gentleman-Programming/gentle-ai/issues/5159) (B2's upstream design record).
- `docs/features/66-engram-memory-substrate/` — the probe's owning unit (its narrative gains the B1 correction note).
- PR: https://github.com/gtrabanco/agentic-workflow/pull/577 — this unit's delivery (`Refs #566`).

## Branch

`fix/560-307-residual-completion` (owner ruling D1 — no separate branch or PR).

## Depends on

none — rides the same PR as #560 and #567 by owner ruling.

## Regression scope

| Scenario | Verified by |
|---|---|
| The five existing probe checks keep their ids, order, bounds and behaviours | the suite's pre-existing cases unchanged and green: `bun test packages/agentic-workflow/test/memory-probe.test.mjs` exits 0 |
| The probe stays read-only (no MCP tool call; `instance-id` is a CLI subcommand under a temp data dir) | the `read-only contract` describe block, extended to assert the new call, green |
| The memory protocol's thin pointers and ownership map are untouched | `git diff --name-only origin/main...HEAD -- skills/execute-phase skills/log-session` prints nothing |
| The mirror bullet keeps its five degradation obligations readable in §7 (feature 66's AC8 check) | `rg -c 'pending' skills/unit-lane/references/MEMORY.md` ≥ 3 matches (the AC8 pattern) |
