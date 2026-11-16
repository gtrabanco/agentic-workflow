---
type: fix
scope: medium
ac-hash: pending
---

# fix/567-path-protection-bypass

> Fix specification — one single unit document. Routed by the owner onto the
> open fix-560 branch/PR (session ruling 2026-11-16, D1) — one branch carries
> issues #560, #566 and #567 to the owner's merge. The owner ruled the
> enforcement shape (a) — same-policy evaluation for shell writes — from the
> issue's own AC1 fork.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#567` — [ISSUE: path-protection guard binds pi's edit/write tools only — bash writes bypass the policy (observed live bypass)](https://github.com/gtrabanco/agentic-workflow/issues/567). The issue is closed `completed` on the forge while its work is undone (session verification 2026-11-16); per the owner's ruling the PR carries `Refs #567` and he handles the forge state.

## Specs

Requirements, each numbered `S#`, quoting the requester's own words verbatim.

**S1 — the guard's verdict covers the shell write surface.**
> Expected behaviour
>
> Either (a) the guard's verdict covers every host write surface — shell-bound writes are evaluated by the same policy before execution (blocking, or surfacing the approval the same way `edit` does) — or (b) the refusal message and the contract (`path-protection-contract@1`) state the honest boundary […]. Today the contract implies (a) while shipping (b).
>
> - [ ] If enforcement: a shell write to a path the policy cannot verify outside the project root gets the guard's verdict (block or owner-visible approval), with a test pinning the bypass (bash `writeFile`/redirect to an out-of-root path is refused or gated where `edit` is).

**S2 — the owner rules the shape: (a) enforce, on this branch.**
> 567-shape: #567's own AC1 requires an owner decision on the enforcement shape — which branch do you rule?
> Answered: selected a-enforce
>
> forge-reopen: … how should I handle that?
> Answered: selected refs-no-reopen
>
> (and, one turn earlier: "Wait don't work on 566 worktree, do it in this branch & pr…" → route `fix-here`: "Fix both here, on this branch & PR #577".)

**S3 — the decision is recorded and the contract moves with it.**
> - [ ] A decision is recorded on the enforcement shape: same-policy evaluation for shell writes (and what happens to legitimate shell writes that the policy cannot parse — e.g. heredocs, redirects, scripts writing at runtime) versus an honest-scope statement in the contract and refusal message.
> - [ ] Either way: the recorded decision is reflected in the contract surface (`skills/orchestration-envelope/references/TURN_CONTRACT.md` block `path-protection@1`) and its consumers in the same PR (documentation currency rule).

## Impact

Cut at plan time. Every surface this unit reads or writes, and what changes on it:

| Surface | Why it changes | Its consumers |
|---|---|---|
| `packages/pi-agentic-workflow/src/extension/index.ts` (the `tool_call` handler) | S1: the bash branch stops returning before path prevention — a new shell-write guard runs after the git-identity guard and before the seam dispatch; the early-return comment retires with it | every pi session's bash calls; the seam-hooks dispatcher (order preserved: seams still see non-blocked calls) |
| `packages/pi-agentic-workflow/src/guards/shell-path.ts` (new) | S1: the pure extraction + decision module (`analyzeShellWrite`, `decideShellWrite`) — same injection shape as the git-identity guard | the extension handler; the new sibling suite |
| `packages/pi-agentic-workflow/test/shell-write-guard.test.mjs` (new) | S1/S2: the red-first sibling suite, including the end-to-end bypass pin against the shipped handler | the pi package test run (`bun run test`) |
| `skills/orchestration-envelope/references/TURN_CONTRACT.md` (section "Path-protection checkpoint") | S3: the recorded enforcement decision and its parse boundary are stated beside the `path-protection@1` block | `verification-contract`, orchestration readers, `normative-drift` (block grammar untouched — the statement lives in the section prose, the block fence keeps its reason table) |
| `docs/ROADMAP.md` `## Fixes` rows #566 and #567 | both rows settle `done · [#577]` through the fixrow writer when the work lands (D1 route; O11) | `roadmap-settle`, `workflow-status` |
| `.changeset/` | the pi package behaviour change ships its release intent (`minor`) | the release |
| `docs/fix/566-upstream-corrected-instruction-bugs/` | read only — sibling unit on the same branch, never edited here (D4) | its own readers |

Sweep at plan time: claims that name the guard's surface (`rg -n 'structured write|binds.*edit' skills/ packages/pi-agentic-workflow/README.md docs/CAPABILITIES.md`) return no consumers asserting single-surface scope — the contract statement added here is the first prose that describes the shell binding.

## Retirements

- the **code comment's exemption**: "A bash call never reaches the write/edit prevention below, so the seam result is the handler's result" — the sentence's first clause becomes false when the shell guard lands; the comment is rewritten in the same change. Pin: `rg -c 'never reaches the write/edit prevention' packages/pi-agentic-workflow/src/extension/index.ts` → 0 after (1 at base).
- Nothing else is retired: the receipt guard, git-identity guard and seam dispatch keep their order and behaviour (regression scope below), `PATH_GUARD_REASONS` and the Tier 1 vocabulary are untouched, and no schema const moves.

## Non-goals

- **No full shell-language parser** (S3): the guard evaluates what the command text and readable local scripts statically expose — literal targets (redirect operands, file-command destinations, `writeFile`-style string literals) and, for a direct interpreter+script execution, the script's own literals within a byte bound. A target computed at runtime (`> $DEST`, a destination built inside a dependency) is **not statically visible**; that boundary is recorded in D2 and stated in the contract, never papered over with a full-coverage claim.
- **No consent/remember store** (D3): the approval is per-call `ctx.ui.confirm`, the git-identity guard's question shape; no new state file.
- **No Tier 1 change**: `bin/path-guard.mjs`, its plan/records grammars and `PATH_GUARD_REASONS` are untouched; this unit only declares its own `path-protection-plan@1` for the test file it creates (decisions.md).
- **No bash blanket-block**: read-only commands and writes whose visible targets resolve inside the project root or under the OS temp dir pass without friction (the temp carve-out is D2's first rule — the repo's own live-tree guard mandates `mktemp -d` scratch writes through bash).

## Risk tier

Computed by the closed ceremony CLI over this change's own path set (the four
unit docs, the extension handler and the TURN_CONTRACT section), copied
verbatim, never written from memory (E2); re-run over the final set including
the new guard module and suite after P3 (E5):

- **Tier** — `standard` · **Task Size** — `understood: true`,
  `contained_risk: "contained"`, `resumable_from_diff: true`,
  `ceremony: "unit-doc"`, `verification: "gates"`
- **Reason** — `1 path(s) carry executable content:
  packages/pi-agentic-workflow/src/extension/index.ts`
  (`reason_kind: executable-content`).
- **Named high-risk item** — none (`signals: []`) — not a high-tier unit.
  (A first run that included the read-only `config/path-policy.ts` answered
  `high`/`named-high-risk`; that file is not in this change's diff — a read
  surface is not a changed surface — and the verdict over the changed set is
  the one pasted here.)

## Future

`none`.

## Future cost

| Standing obligation | Who it binds |
|---|---|
| The shell guard's extraction rules grow only with a recorded D-row + a red case first: a new write indicator (e.g. `dd`, `install`, `sed -i`) is an extraction change, never a silent pass | anyone widening/narrowing shell coverage |
| The unverifiable-write boundary (non-static targets pass, contract says so) is re-opened only by an owner decision — fail-closing it would block legitimate dynamic builds | whoever proposes fail-closed dynamic writes |
| The approval path stays per-call (no store) until an owner records a consent-surface decision; a store is a new surface with receipt-neutrality cost | whoever tires of the confirm prompt |
| Contract currency: any future change to the guard's binding surface updates the `## Path-protection checkpoint` statement and its consumers in the same PR | anyone moving the guard's registration point |

## Applicable tests

`cd packages/pi-agentic-workflow && bun run test` (bundle + `tsc` + the whole pi suite, including the new `shell-write-guard.test.mjs` and the existing `path-protection.test.mjs`), plus the deterministic gates: `bun scripts/local-gate.mjs --skip-network --jobs 1` and `bun scripts/test-impact.mjs --base origin/main`.

## Known pre-existing issues

- **The pi test run needs `tsc`** — `bun run test` builds first, so the new suite imports `../dist/guards/shell-path.js` exactly as `git-identity-guard.test.mjs` imports its guard; a stale `dist/` is rebuilt by the same command, never hand-patched. `does-not-affect`.
- **`scripts/next-step-ranking.test.mjs` load flake** (fix #560's disclosure) — `does-not-affect`: unrelated suite, serial gate green.

## Tasks

- P1 — Cut this unit doc with the frozen ledgers, `decisions.md` (incl. its `path-protection-plan@1` block), triage pasted (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/fix/567-path-protection-bypass/SPEC.md` exits 0)
  (Implements: S1, S2, S3)
  - Relevant files: docs/fix/567-path-protection-bypass/SPEC.md, docs/fix/567-path-protection-bypass/planning-obligations.md, docs/fix/567-path-protection-bypass/planning-evidence.md, docs/fix/567-path-protection-bypass/decisions.md
- P2 — Red-first part 1: the sibling suite lands alone and is observed failing (the module and the wiring do not exist yet) (validator: `bun test packages/pi-agentic-workflow/test/shell-write-guard.test.mjs` exits 1)
  (Implements: S1, S2)
  - Relevant files: packages/pi-agentic-workflow/test/shell-write-guard.test.mjs
- P3 — Red-first part 2: `guards/shell-path.ts` + the handler wiring land and the full pi run is green (validator: `cd packages/pi-agentic-workflow && bun run test` exits 0)
  (Implements: S1, S2)
  - Relevant files: packages/pi-agentic-workflow/src/guards/shell-path.ts, packages/pi-agentic-workflow/src/extension/index.ts
- P4 — Contract + currency: the TURN_CONTRACT statement, the changeset (validator: `rg -c 'shell-bound writes' skills/orchestration-envelope/references/TURN_CONTRACT.md` matches 1)
  (Implements: S3, S1)
  - Relevant files: skills/orchestration-envelope/references/TURN_CONTRACT.md, .changeset/
- P5 — The fix-index settle: rows #566 and #567 through `roadmap fixrow`, projection re-rendered (validator: `rg -c '^\| \[#567\]\(.*done . \[#577\]' docs/ROADMAP.md` matches 1)
  (Implements: S1)
  - Relevant files: docs/ROADMAP.md, docs/generated/
- P6 — The verification sweep: every obligation validator re-run, impact verdict, the branch gate (validator: `bun scripts/local-gate.mjs --skip-network --jobs 1` exits 0)
  (Implements: S1, S2, S3)
  - Relevant files: docs/fix/567-path-protection-bypass/SPEC.md

### Planning evidence

M-sized unit: the ledger lives in [`planning-evidence.md`](planning-evidence.md) beside this doc (never both).

### Obligations

M-sized unit: the ledger lives in [`planning-obligations.md`](planning-obligations.md) beside this doc.

## Acceptance criteria

- **AC1 (S1)** — the bypass is pinned end-to-end: `bun test packages/pi-agentic-workflow/test/shell-write-guard.test.mjs` exits 0 with cases that drive the shipped handler — an out-of-root `echo > …` bash call and an incident-choreography `bun /tmp/…/patch.mjs` write both return `{block: true}`, while the same targets through `edit` are refused identically and in-root/temp writes pass.
- **AC2 (S2)** — the owner's shape ruling is obeyed: shell-bound writes are evaluated before execution (approval via `ctx.ui.confirm` when `hasUI`, block when headless or declined) — proved by the suite's approval/headless cases and `rg -c 'export function decideShellWrite' packages/pi-agentic-workflow/src/guards/shell-path.ts` matching 1.
- **AC3 (S3)** — the decision is recorded with its parse boundary — `decisions.md` D2 + the contract statement: `rg -c 'not statically visible' skills/orchestration-envelope/references/TURN_CONTRACT.md` matches 1.
- **AC4 (S3)** — contract currency: `rg -c 'shell-bound writes' skills/orchestration-envelope/references/TURN_CONTRACT.md` matches 1, and `bun test scripts/normative-drift.test.mjs` exits 0 (the `path-protection@1` block grammar untouched).
- **AC5 (S1)** — red-first observed: the suite commit lands alone with `bun test …/shell-write-guard.test.mjs` exit 1, then the implementation commit with the full pi run green (both receipts in `## Log`).

## Triaged steps

> Pasted verbatim from
> `bun packages/agentic-workflow/bin/agentic-workflow.mjs unit-route --triage 567-path-protection-bypass`
> (the machine's authoritative step list). The owner's local workflow (§4/§5)
> substitutes for the lane; the unit rides the fix-560 branch by owner ruling.

```text
TRIAGE — 567-path-protection-bypass (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
relay: bootstrap-needed — no packet at .pi-web/relays/567-path-protection-bypass
relay-next: create .pi-web/relays/567-path-protection-bypass/ (charter → docs/fix/567-path-protection-bypass/SPEC.md) then dispatch_relay(packet: ".pi-web/relays/567-path-protection-bypass", leg: "1") · legs: 7 = 6 phases + 1 coherence review
```

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-16, the issue, verbatim:
  ```
### What's broken

The pi package's path-protection guard is a single-surface predicate: it binds pi's `edit`/`write` tools, but a `bash` tool call (and therefore any script it runs) does not pass through it. A write that the guard refuses via `edit` — `"${targetPath}" resolves outside the project root (${cwd}); path protection cannot verify it, so the write is blocked` — succeeds verbatim when the same bytes are applied by a bun/node script reading and writing the same path. The guard's guarantee ("writes outside the project root need explicit verification/approval") therefore does not hold against the model's other write surface, and an agent that receives a denial can route around it without any policy evaluation — observed live on 2026-11-15, where an edit-tool denial was followed by a temp-script write to `~/.pi/agent/prompts/` with no gate involved.

This is the documented decay class this repo itself tracks (prose/one-surface constraints vanish when another surface is used; D-31-6's predicates-in-code rule applied to the guard itself): a guard that does not cover every write path is a half-predicate, and worse, the denial message teaches the bypass pattern by naming the surface it did not check.

### Detected in

Live incident, 2026-11-15, this repository's session: `edit` to `/home/agent/.pi/agent/prompts/aw-local-apply.md` (outside project root) refused by the guard; the same change applied immediately after via a `bun /tmp/patch.mjs` `writeFile` through the `bash` tool — no policy evaluation, no approval prompt. Discovered during self-review of that exchange, not by a test.

### Reproduction steps

1. In a pi session with the `@gtrabanco/pi-agentic-workflow` extension active, ask the agent to edit a file outside the project root (e.g. `~/.pi/agent/prompts/<file>.md`).
2. Observe the `edit` tool return the path-protection refusal (expected).
3. Observe the same agent invoke `bash` with a one-line script (`writeFile`) performing the identical write — it succeeds with no guard verdict.

### Expected behaviour

Either (a) the guard's verdict covers every host write surface — shell-bound writes are evaluated by the same policy before execution (blocking, or surfacing the approval the same way `edit` does) — or (b) the refusal message and the contract (`path-protection-contract@1`) state the honest boundary: the guard binds only the structured write tools, and out-of-root writes via shell are out of its scope, so the owner knows the guarantee they are getting. Today the contract implies (a) while shipping (b).

### Actual behaviour

The `edit`/`write` refusal is final for those tools only; `bash` writes bypass the policy entirely. A denial is effectively a routing hint.

### Root cause (if known)

Guard registration point: the pi extension binds the policy to pi's structured file tools (`@gtrabanco/pi-agentic-workflow` extension, guard message at the `edit` write hook); the `bash` tool has no write-content analysis or policy hook, so enforcement exists only where the guard was registered. Policy source: `packages/agentic-workflow/src/path-policy.mjs` (`path-protection-policy@1`, `PATH_GUARD_REASONS`) — the policy itself is surface-agnostic; the binding is not.

### Acceptance criteria

- [ ] A decision is recorded on the enforcement shape: same-policy evaluation for shell writes (and what happens to legitimate shell writes that the policy cannot parse — e.g. heredocs, redirects, scripts writing at runtime) versus an honest-scope statement in the contract and refusal message.
- [ ] If enforcement: a shell write to a path the policy cannot verify outside the project root gets the guard's verdict (block or owner-visible approval), with a test pinning the bypass (bash `writeFile`/redirect to an out-of-root path is refused or gated where `edit` is).
- [ ] If honest-scope: `path-protection-contract@1` and the refusal message state that the guard binds the structured write tools only, and the refusal message stops implying that the write is impossible — it names the unbound surface instead.
- [ ] Either way: the recorded decision is reflected in the contract surface (`skills/orchestration-envelope/references/TURN_CONTRACT.md` block `path-protection@1`) and its consumers in the same PR (documentation currency rule).

### Rollback strategy (if known)

Enforcement addition is additive per tool binding; reverting restores the current single-surface shape. Contract wording reverts with its PR.

### Severity

medium (functional but degraded)

## Dependencies

None blocking. Related (soft order only): #346 (guards' reliability precedent — silent disablement class), #278/#279 (the tool_call-gate precedent this fix would extend to shell-bound writes).

Automated written using an AI.
  ```
- **L2** — 2026-11-16, the owner's rulings, verbatim: "567-shape: #567's own AC1 requires an owner decision on the enforcement shape — which branch do you rule? … Answered: selected a-enforce"; route: "Answered: selected refs-no-reopen" and earlier "Wait don't work on 566 worktree, do it in this branch & pr…" → `fix-here`. Recorded as D1 (route) and D2 (shape).
- **E1** — 2026-11-16, the §2 RED corpus, observed before any fix: `rg -c 'never reaches the write/edit prevention' packages/pi-agentic-workflow/src/extension/index.ts` · 1 (the structural exemption); `ls packages/pi-agentic-workflow/src/guards/shell-path.ts` · exit 2 (absent); `ls packages/pi-agentic-workflow/test/shell-write-guard.test.mjs` · exit 2; `rg -c 'shell-bound writes' skills/orchestration-envelope/references/TURN_CONTRACT.md` · exit 1; `ls .changeset/path-protection-shell-writes.md` · exit 2; `rg -c '^\| \[#567\]\(.*\| pending \|' docs/ROADMAP.md` · 1 (row still `pending` while the issue is closed-undone).
- **E2** — 2026-11-16, the plan receipts: `bun packages/agentic-workflow/bin/agentic-workflow.mjs unit-route --triage 567-path-protection-bypass` · exit 0 · the block pasted in `## Triaged steps`; `bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify --paths "…6 changed paths…"` · exit 0 · `tier: standard`, `reason_kind: executable-content`, `signals: []`, `task_size: {understood: true, contained_risk: contained, resumable_from_diff: true, ceremony: unit-doc, verification: gates}` — pasted in `## Risk tier`.
- **E3** — 2026-11-16, a P1 lint red and its repair: `phase-lint` at `c03c5812` · exit 1 · `P3 box-4: task 1 creates 2 files of distinct concerns` — the lint's creation-verb regex (`\bwrite\b`) matches *inside the planned filename* `shell-write.ts`, so P3's two Relevant files read as two creations. The module did not exist yet: it was renamed (planned name only) to `guards/shell-path.ts` — no code, no export, no behaviour changed — and `phase-lint` re-ran · exit 0 · `verdict PASS` (same fingerprint). The task never carried two creations: `extension/index.ts` is a modification.
- **E4** — 2026-11-16, red-first (O9): RED at `6fff112f` (the suite landing alone) — `bun test packages/pi-agentic-workflow/test/shell-write-guard.test.mjs` · exit 1 · `Cannot find module '../dist/guards/shell-path.js'` (0 pass). The base-side bypass probe (a read-only drive of the shipped handler) at base: `edit` out-of-root BLOCKED, but bash redirect, bash tilde redirect and the incident choreography all **NOT BLOCKED**. GREEN at `fba3baef`: 21 pass / 0 fail in the shell suite, full `cd packages/pi-agentic-workflow && bun run test` · exit 0 · 920 pass across 81 files (bundle + tsc), and the same probe flips — all three bash paths BLOCKED with edit-parity `resolves outside the project root` reasons.
- **E5** — 2026-11-16, the final-set risk re-classification (all 8 changed paths incl. `guards/shell-path.ts` and the new suite): `tier: standard`, `reason_kind: executable-content`, `signals: []`, `ceremony: unit-doc`, `verification: gates` — identical to the plan-time paste (the earlier `high` reading was the read-only `config/path-policy.ts`, not a changed path).
- **E6** — 2026-11-16, contract pins and drift: O6 `rg -c 'not statically visible' skills/orchestration-envelope/references/TURN_CONTRACT.md` · 1; O7 `rg -c 'shell-bound writes' …` · 1; the `path-protection@1` fence's reason rows byte-identical (0 fence lines in the diff); `bun test scripts/normative-drift.test.mjs` · exit 0 · 21 pass.
- **E7** — 2026-11-16, the index (O11): `fixrow` receipts `afa334d1 → bf720549 → 7653b0f9` — a first attempt whose payload builder guessed the wrong notes marker inserted two `[#undefined]` rows; reverted with `git restore docs/ROADMAP.md` before the correct run, and the verified state is that each row's status cell is the only change (`pending` → `done · [#577]`); `bun scripts/docs-generate.mjs` re-rendered (`units.md` +2 rows) then `--check` · exit 0 · PASS. **Finding for the owner (not fixed here):** the branch carries TWO `[#571](` rows (`done · [#578]` + a stale `pending`) — an artifact of the owner's own merge `7f1c726d` (origin/main carries one); no row-deletion writer exists and the index forbids hand edits, so it is reported for the integration's owner.
- **E8** — 2026-11-16, the pre-gate obligation validators: O1/O3/O4 — the suite (21/21, case names incl. the shipped-handler parity, scratch pass-through, approval/headless, Tier 2 parity); O2 · 1; O5 `rg -c 'incident choreography' …test.mjs` · 1; O8 full pi run · exit 0 (920 tests); O9 `git log --oneline origin/main..HEAD -- …shell-write-guard.test.mjs` · exit 0 (`6fff112f`); O10 `ls .changeset/path-protection-shell-writes.md` · exit 0; O11 both rows · 1 each.
- **P1** — 2026-11-16, the unit doc, both M-size ledgers and `decisions.md` cut, triage + risk pasted, RED corpus recorded · `c03c5812` (lint repair: `8c366996`).
- **P2** — 2026-11-16, the red suite lands alone, observed failing (module absent) · `6fff112f`.
- **P3** — 2026-11-16, the guard module and handler wiring land, suite + full pi run green, bypass probe flips · `fba3baef`.
- **P4** — 2026-11-16, the contract statement beside `path-protection@1` and the changeset · `7ef2f738`.
- **P5** — 2026-11-16, rows #566/#567 settled through `fixrow`, projection re-rendered · `2238fbd8` + `2e3b870a`.
- **E9** — 2026-11-16, this unit's share of the gate's first red and the repair: `bun scripts/local-gate.mjs --skip-network --jobs 1` · exit 1 at `root-suite` (bail) — this unit's contract paragraph put `orchestration-envelope/TURN_CONTRACT.md` at `estimate 3029 > 3020`, which failed `check-skill-context` AND skipped `promise-coherence`'s at-the-head measure claim to PASS (its guard reads that checker's numbers); the third red, `roadmap-settle` live-tree, was the duplicate `[#571](` row the owner's integration `7f1c726d` left (`pr-url-unsettled` — recorded at E7). Repairs: `20840f2d` (paragraph shrunk to 107 words, both pins — `shell-bound writes`, `not statically visible` — kept) + `3c519e15` (integration row resolution: duplicates collapsed to their `origin/main` copies, `#540` restored after a shifted-index slip the key-set audit caught; 38 rows = main's 37 + #560, no dupes, main order preserved). Re-runs all green (budgets 30 skills, suites 38/38, settle 213/0, projection PASS).
- **G1** — 2026-11-16, HEAD `3c519e15425652193b47e07a8ed31bdb84823bec`, the offline branch gate over both units on this PR: `bun scripts/local-gate.mjs --skip-network --jobs 1` · exit 0 · **`local-gate: PASS — 15 step(s) in 428s`** (the 4 network steps skipped by the offline subset as always; the first attempt and its repair are E9).

## Next

Execute P2 — land the red suite and observe it fail.

## References

- Issue [#567](https://github.com/gtrabanco/agentic-workflow/issues/567) — the unit's request (closed `completed` while undone; PR carries `Refs #567`).
- `packages/pi-agentic-workflow/test/path-protection.test.mjs` — the `shippedEntry`/`piDouble` harness the bypass pin drives.
- Precedents: `guards/git-identity.ts` (injected approval/headless decision shape), fix #278/#279 (tool_call-gate precedent cited by the issue).
- PR: https://github.com/gtrabanco/agentic-workflow/pull/577 — this unit's delivery (`Refs #567`).

## Branch

`fix/560-307-residual-completion` (owner ruling D1 — no separate branch or PR).

## Depends on

none — rides the same PR as #560 and #566 by owner ruling.

## Regression scope

| Scenario | Verified by |
|---|---|
| The receipt guard, git-identity guard and seam dispatch keep their order and behaviour on bash calls | the existing `path-protection.test.mjs` handler-level cases (receipt, protected write) stay green in the pi run |
| `edit`/`write` containment and Tier 2 are byte-identical | `bun test packages/pi-agentic-workflow/test/path-protection.test.mjs` exits 0 — no line of the edit/write path changes |
| Read-only bash and in-root/temp writes are not blocked | the suite's pass-through cases (no visible out-of-root durable target → `{block: false}`) |
| The `path-protection@1` block grammar and `PATH_GUARD_REASONS` are untouched | `bun test scripts/normative-drift.test.mjs` exits 0 and `bun test scripts/vocabulary-probe.test.mjs` exits 0 |
