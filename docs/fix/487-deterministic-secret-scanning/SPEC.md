---
type: fix
scope: medium
ac-hash: e82de8dac52547b61b606f4795a0dda4c873fbd6
---

# fix/487-deterministic-secret-scanning

> The repository's only barrier against a committed secret is one line of the
> `review-security` checklist, conducted by a model, inside a review pass that
> can be skipped. This unit makes that barrier deterministic: one offline gate
> step scans the push range for secret-shaped values, fails closed on a
> finding, and rides the `pre-push` hook and CI with the rest of the offline
> subset.

## Issue

`#487` — tracked issue in the project's forge. The PR must close it via
`Closes #487` in the body.

## Specs

**S1 — a deterministic push-range scan for secret-like patterns.**
> A deterministic gate step scans for secret-like patterns (key/token/credential shapes with high-entropy payloads) over the **push range** before anything reaches `main`.

**S2 — it rides the offline pre-push subset and CI.**
> It runs in the **offline subset of the `pre-push` hook** (a secret is exactly the thing a push must never wait on a registry to catch), and in CI for the same step.

**S3 — fails closed, and allowlisting follows the gate's conventions.**
> It **fails closed** on a finding; allowlisting follows the gate's existing verdict/finding conventions.

**S4 — the sibling suite lands red-first.**
> The step ships with its **sibling suite red-first** (`scripts/<step>.mjs` + `scripts/<step>.test.mjs`, red commit before green), per the repository's working rules.

**S5 — the gate inventory records the step's carrier.**
> `docs/workflow/GATE_INVENTORY.md` records the new step's carrier.

**S6 — the gate runs a `secret-scan` step that exits non-zero on a finding.**
> `bun scripts/local-gate.mjs` runs a `secret-scan` step (new id) that scans the push range and exits non-zero on a secret-like finding.

**S7 — a push carrying a secret in its range fails the hook.**
> The step is in the offline pre-push subset: a push containing a secret-shaped string in the range fails the hook before the remote is contacted.

**S8 — the scan runs on a prose-only push too.**
> A push whose range contains no executable path change still runs the scan (not a `tests:` step — the prose-only push is the leak path, same reasoning as `journal-carrier-check`).

**S9 — the suite passes and the red commit precedes the implementation.**
> `bun test scripts/secret-scan.test.mjs` passes, and the red commit introducing the suite precedes the implementation commit (enforced by `scripts/red-first.mjs`).

**S10 — a known secret is detected; a benign shape is not flagged without an allowlist entry.**
> A known-secret fixture in the suite is detected; a false-positive-prone benign string (e.g. `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` in workflow files, or a documented placeholder) is not flagged without an explicit allowlist entry.

**S11 — the inventory names the step and its carrier.**
> `docs/workflow/GATE_INVENTORY.md` names the step and its carrier.

**S12 — the unit is additive and reverts in one revert.**
> Remove the gate step entry and its suite in a single revert; the step is additive and guards nothing else.

## Impact

- `scripts/secret-scan.mjs` (new) — the scan and its allowlist reader. Read-only:
  it writes no byte and calls no network.
- `scripts/secret-scan-allowlist.json` (new) — the explicit allowlist. One entry
  ships: the suite's own known-secret fixture, narrowed to its rule, so the
  scan of this branch's own range stays green.
- `scripts/local-gate.mjs` — one `STEPS` row and one `DEPS` row. The step is
  offline and non-test-bearing, so the impact gate can never skip it; it has no
  shared prerequisite, so it neither waits nor is waited on.
- `scripts/local-gate.test.mjs`, `scripts/release-workflows.test.mjs` — the two
  step-id pin suites. Both lists grow by exactly one id in the slot the table
  puts it; no existing assertion is relaxed.
- `docs/workflow/GATE_INVENTORY.md` — one row, and
  `docs/workflow/SKILL_CONTEXT_BUDGETS.json`'s `machineLines` re-pins to the
  measured machine region (an exact count, never a ceiling).
- `docs/fix/487-deterministic-secret-scanning/` — this unit's doc, its two
  planning ledgers and its `decisions.md` (the path-protection records for the
  two test files the step's pins live in).
- `docs/ROADMAP.md` — the `## Fixes` row registering the unit while it is open.
- The leak path this closes, named by the issue: a real token pasted into a
  fixture, a test, a log line or a session-fragment example in `docs/`. The scan
  judges added lines on every tracked text path — no directory is exempt.

## Retirements

None — the change only adds, and S12 makes that structural: nothing this unit
ships has a consumer to replace, and the whole unit is removable in one revert.
`rg -c 'secret-scan' scripts docs skills template` → 0 before the cut is the
no-consumer evidence for every name it introduces.

## Non-goals

- History rewriting or retroactive judgment: the scan judges the push range
  forward. Content already on `main` is not re-litigated — the allowlist, not a
  rewrite, is how a known-benign shape is answered.
- Detecting secrets inside binary containers (an archive, a compiled artifact, a
  compressed chunk). The scan is a text pass; a binary file is skipped by
  extension or by a NUL byte, and that bound is declared in the script and
  pinned by its suite.
- A vulnerability or dependency pass. `scripts/dependency-advisory-pass.mjs`
  owns that axis, and the organisation/entropy tuning of a dedicated scanner
  (`gitleaks`, `trufflehog`) stays out: no new dependency enters the gate.
- Rewriting the `review-security` checklist. It keeps its item; the step is the
  deterministic floor beneath it, not a replacement for a reviewer's judgment.

## Risk tier

Computed by the ceremony classifier over this unit's declared paths at the cut,
copied verbatim, never written from memory.

- **Cut verdict** — `standard` (`reason_kind: executable-content`) ·
  **Task Size** — `understood: true`, `contained_risk: contained`,
  `resumable_from_diff: true`, `ceremony: unit-doc`, `verification: gates` ·
  **signals** — `[]`
- **Named high-risk item** — none — not a high-tier unit

## Future

none — nothing was deferred.

## Future cost

| Standing obligation | Who it binds |
|---|---|
| The allowlist is a narrowing mechanism, never a silence: every entry names one path, one rule (or `*` with a reason), and why; an entry that matches no finding in whole-tree mode is itself a finding | future work that meets a benign secret-shaped string |
| The rule table is additive by shape and the closed `RULES` vocabulary is pinned by the suite: a new provider shape adds one row and one positive case in the same change | future provider coverage |
| The two step-id pin suites move with any local-gate step added or removed | future local-gate work |

## Applicable tests

`scripts/secret-scan.test.mjs` (the new corpus: every rule's positive case, the
benign shapes, the redaction, the diff parser, the allowlist and the exit codes)
· `scripts/local-gate.test.mjs` + `scripts/release-workflows.test.mjs` (the two
step-id pin suites) · `scripts/prose-gate-inventory.test.mjs` (the inventory row
resolves) · `scripts/check-skill-context.test.mjs` (the guide budget re-pin).

## Known pre-existing issues

- **The offline gate's `root-suite` step cannot go green under its own pool on this host.** The step runs its suites at one worker per CPU (4 by default) while the gate's three other heavy steps run beside it, and `scripts/phase-lint.test.mjs` — 23–35 s in isolation, 67 s beside four competing suites — crosses the runner's 120 s suite bound; `--bail` then kills the suites in flight, which are reported as failures too. Reproduced twice on this unit (2026-11-14) and independent of it: the diff touches no file under `packages/`, and the same root suite is green at 113/113 when it runs alone. **Affects** the handoff's gate receipt only: the per-step runs and the standalone root gate are green, and no bound was widened. The wall-clock and memory bounds are issue #493's contract, not this unit's.
- **`scripts/unit-route.test.mjs`'s `#291 F7` case asserts a 500 ms wall-clock bound** on a linear scan; it measured 507 ms once in a 113-suite sequential run and 229–238 ms in isolation, on a code path this diff does not touch (zero files under `packages/`). **Does-not-affect** this unit beyond the gate receipt: the same suite is green in every other run recorded here.
- The worktree checkout sits at a path git itself treats as a worktree admin
  directory, so `HEAD` as a bare revision argument is ambiguous in some git
  invocations — **does-not-affect** this unit: the scan's own range resolution
  goes through `git rev-parse`/`merge-base`, and its fixtures are throwaway
  repositories.
- `scripts/log-immutability.mjs` resolves its base from `@{upstream}`, so a
  branch that has integrated `main` locally can be refused for `main`'s own
  published commits — **does-not-affect** this unit: it touches neither the
  journal nor that script, and the step ran green over this branch's range.

## Tasks

- P1 — Cut this doc, the two planning ledgers, `decisions.md` and the roadmap Fixes row (validator: `node packages/agentic-workflow/bin/agentic-workflow.mjs unit-route --triage 487-deterministic-secret-scanning` exits 0)
  (Implements: S1, S3)
  - Relevant files: docs/fix/487-deterministic-secret-scanning/SPEC.md, docs/fix/487-deterministic-secret-scanning/planning-obligations.md, docs/fix/487-deterministic-secret-scanning/planning-evidence.md, docs/fix/487-deterministic-secret-scanning/decisions.md, docs/ROADMAP.md
- P2 — RED commit: land `scripts/secret-scan.test.mjs` alone and observe it fail on the missing module (validator: `node --test scripts/secret-scan.test.mjs` exits 1 at the red commit)
  (Implements: S4, S9)
  - Relevant files: scripts/secret-scan.test.mjs
- P3 — Implement `scripts/secret-scan.mjs` and ship `scripts/secret-scan-allowlist.json`; the suite turns green (validator: `bun test scripts/secret-scan.test.mjs` exits 0)
  (Implements: S1, S3, S10)
  - Relevant files: scripts/secret-scan.mjs, scripts/secret-scan-allowlist.json
- P4 — Register the step in `STEPS` and `DEPS` and move the two step-id pins, which are observed red before the table changes (validator: `bun test scripts/local-gate.test.mjs scripts/release-workflows.test.mjs` exits 0)
  (Implements: S6, S7, S8)
  - Relevant files: scripts/local-gate.mjs, scripts/local-gate.test.mjs, scripts/release-workflows.test.mjs
- P5 — Add the inventory row and re-pin the guide budget's machine count (validator: `bun test scripts/prose-gate-inventory.test.mjs scripts/check-skill-context.test.mjs` exits 0)
  (Implements: S5, S11)
  - Relevant files: docs/workflow/GATE_INVENTORY.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json
- P6 — Add the changeset and regenerate the documentation projection (validator: `node scripts/docs-generate.mjs --check` and `node scripts/version-parity-gate.mjs --content` exit 0)
  (Implements: S12)
  - Relevant files: .changeset/487-deterministic-secret-scanning.md, docs/generated/units.md
- P7 — Verification: the root suite and the offline gate subset in the foreground, plus the base-vs-head differential record (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S1, S2, S6)
- P8 — Session entry as a journal fragment, committed through the close path (validator: `node scripts/session-close.mjs close` exits 0)
  (Implements: S2)

## Acceptance criteria

- **AC1 (S1)** — a secret-shaped value added anywhere in the push range's tracked
  text paths is a finding, and one that the range removes is not; proven by
  `bun test scripts/secret-scan.test.mjs` exiting 0 with the added-line,
  removed-line and docs-path cases in the passing set.
- **AC2 (S2, S7)** — the step runs in the offline subset with the hook, and a
  fixture checkout whose range adds a secret exits 1 through
  `scripts/local-gate.mjs`; proven by `bun test scripts/local-gate.test.mjs`
  exiting 0 with the gate-level refusal case.
- **AC3 (S8)** — the step carries no `tests` marker and no network marker, so an
  empty test-impact verdict plans it; proven by the impact-gated planned-list
  case in `bun test scripts/local-gate.test.mjs` naming `secret-scan`.
- **AC4 (S6)** — `node scripts/local-gate.mjs --list` prints `secret-scan` in
  table order; proven by the `--list` case in `bun test scripts/local-gate.test.mjs`
  and by the same command in the foreground.
- **AC5 (S9, S4)** — the pair lands as two commits with the suite first;
  proven by `node scripts/red-first.mjs` exiting 0 with `verdict: PASS` after
  both commits, and by the Log's evidence line naming the red run.
- **AC6 (S3, S10)** — every rule has a detected positive case, every benign shape
  in the suite is unflagged, and the suite's own literal fixture is a finding
  with an empty allowlist and allowlisted with the shipped one; proven by
  `bun test scripts/secret-scan.test.mjs` exiting 0 with those cases green.
- **AC7 (S5, S11)** — the inventory names `secret-scan` with a carrier and a
  token that resolves; proven by `bun test scripts/prose-gate-inventory.test.mjs`
  exiting 0 and the row appearing in the inventory report.
- **AC8 (S12)** — nothing that existed loses behaviour: the two pin suites keep
  every pre-existing assertion and only their id lists grow; proven by the
  base-vs-head differential recorded in the Log and by
  `bun test scripts/local-gate.test.mjs scripts/release-workflows.test.mjs`
  exiting 0.

## Path protection

Both suites this unit modifies or creates are protected paths (`**/*.test.*`,
`freeze: true`), so each modification carries its record in this folder's
[`decisions.md`](decisions.md). Every record is an expansion: the only change a
pre-existing assertion receives is a list that grows by one shipped id.

```text
path-protection-plan@1
freeze-after: P3
kind | path | justification
created | scripts/secret-scan.test.mjs | the new gate step's own corpus, landed as its red commit before the module exists (S4, S9, S10)
created | scripts/local-gate.test.mjs | the step table's id pin, the impact-gated planned list and the gate-level refusal case (S6, S7, S8)
created | scripts/release-workflows.test.mjs | the local gate's id array grows by the one shipped id (S6, S12)
```

## Triaged steps

Pasted from the router after the doc was cut:

```text
TRIAGE — 487-deterministic-secret-scanning (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
```

The lane runs inline (owner's apply workflow): no Relay packet is cut for this
unit; the review step is the owner's external verification.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-14, the issue, verbatim:
  ```
  ## What's broken

  The repository's only barrier against committed secrets is the agent-driven `review-security` checklist item ("No secrets/credentials/tokens in code, config, tests, or fixtures — grep the diff"). That pass is model-conducted, runs only when `review-change`/`product-audit` is composed, and is not deterministic — it can be skipped, and its grep-the-diff heuristic is exactly the discipline-only barrier the research shows failing at scale. No step of the delivery path scans for secrets deterministically: `scripts/local-gate.mjs`, the offline `pre-push` hook and CI (`root-suite.yml`) carry no secret-scanning check (only `temp-hygiene` exists, which covers `/tmp` hygiene, not credentials).

  Context: Apiiro's security research ["The Secrets About Secrets in Code"](https://apiiro.com/blog/the-secrets-about-secrets-in-code) measured that 50.67% of secrets found in private repositories are still active/valid, and private repositories carry 8× more exposed secrets than public ones — "private ≠ secure". The typical leak path here is plausible and cheap: a real token pasted into a fixture, a test, a log line or a session-fragment example in `docs/`, riding a prose-only push that skips every test-bearing gate step.

  ## Detected in

  Session review on 2026-11-09 (gap analysis of the gate inventory after the Apiiro write-up; cross-checked `scripts/local-gate.mjs`, `.github/workflows/`, `.git/hooks/pre-push` and the `review-security` checklist).

  ## Expected behaviour

  - A deterministic gate step scans for secret-like patterns (key/token/credential shapes with high-entropy payloads) over the **push range** before anything reaches `main`.
  - It runs in the **offline subset of the `pre-push` hook** (a secret is exactly the thing a push must never wait on a registry to catch), and in CI for the same step.
  - It **fails closed** on a finding; allowlisting follows the gate's existing verdict/finding conventions.
  - The step ships with its **sibling suite red-first** (`scripts/<step>.mjs` + `scripts/<step>.test.mjs`, red commit before green), per the repository's working rules.
  - `docs/workflow/GATE_INVENTORY.md` records the new step's carrier.

  ## Actual behaviour

  Nothing deterministic inspects the push range for secrets; the sole protection is a prose checklist item inside an internal review skill.

  ## Acceptance criteria

  - `bun scripts/local-gate.mjs` runs a `secret-scan` step (new id) that scans the push range and exits non-zero on a secret-like finding.
  - The step is in the offline pre-push subset: a push containing a secret-shaped string in the range fails the hook before the remote is contacted.
  - A push whose range contains no executable path change still runs the scan (not a `tests:` step — the prose-only push is the leak path, same reasoning as `journal-carrier-check`).
  - `bun test scripts/secret-scan.test.mjs` passes, and the red commit introducing the suite precedes the implementation commit (enforced by `scripts/red-first.mjs`).
  - A known-secret fixture in the suite is detected; a false-positive-prone benign string (e.g. `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` in workflow files, or a documented placeholder) is not flagged without an explicit allowlist entry.
  - `docs/workflow/GATE_INVENTORY.md` names the step and its carrier.

  ## Rollback strategy (if known)

  Remove the gate step entry and its suite in a single revert; the step is additive and guards nothing else.
  ```
- **L2** — 2026-11-14, owner apply-request, verbatim: "Apply to this repository: issue #487" — plain prose; the state resolves it to **proceed** (no unit folder, no commits ahead of `main`, no prior receipt: the unit starts here).
- **P1** — 2026-11-14, unit doc, both planning ledgers, `decisions.md` and the roadmap Fixes row cut · `1790651a`.
- **P2** — 2026-11-14, the corpus landed alone, before any implementation existed · `60dfe5c0`.
- **E1** — 2026-11-14, `node --test scripts/secret-scan.test.mjs` at `60dfe5c0` · exit 1 · `ERR_MODULE_NOT_FOUND: Cannot find module '…/scripts/secret-scan.mjs'` — the red commit, observed before the module existed.
- **P3** — 2026-11-14, `scripts/secret-scan.mjs` and the shipped allowlist · `b6fc73e8`. One commit rather than a slice: the module's rules, range resolution, allowlist reader and report are one artefact — a half of it has no consumer and no test that could pass.
- **E2** — 2026-11-14, `bun test scripts/secret-scan.test.mjs` at `b6fc73e8` · exit 0 · 25 pass 0 fail.
- **P4** — 2026-11-14, the step row, the `DEPS` row and the two step-id pins · `cac1a1e1`.
- **E3** — 2026-11-14, `bun test scripts/local-gate.test.mjs scripts/release-workflows.test.mjs` with the pins moved and the table unchanged · 70 pass 5 fail — the five pins for the missing step (`every former remote check survives…` in both suites, the marker case, the gate-level refusal case, the impact-gated planned list).
- **E4** — 2026-11-14, the same command after `cac1a1e1` · exit 0 · 75 pass 0 fail.
- **P5** — 2026-11-14, the inventory row and the guide-budget re-pin · `a42cee1c`.
- **E5** — 2026-11-14, `bun test scripts/prose-gate-inventory.test.mjs` · exit 0 · 22 pass 0 fail; `bun scripts/prose-gate-inventory.mjs` · exit 0 · `verdict: PASS`, and the report resolves `secret-scan — script · scripts/secret-scan.test.mjs:421 · priority 9 · script`.
- **E6** — 2026-11-14, `bun test scripts/check-skill-context.test.mjs scripts/guide-split.test.mjs` · exit 0 · 16 pass 0 fail; `bun scripts/check-skill-context.mjs --documents` · `PASS context documents: 4 budgeted documents` · the inventory measures 166 lines / 95 prose / 6,218 est against the unchanged ceilings, so only `machineLines` moved (70 → 71).
- **P6** — 2026-11-14, the release intent and the regenerated projection · `143968cf`.
- **E7** — 2026-11-14, `node scripts/secret-scan.mjs` over this branch's own range (`f7e5dbba..HEAD`, 1,624 added lines) · exit 0 · `verdict: PASS`, 1 allowlisted (`scripts/secret-scan.test.mjs:60 — github-token`).
- **E8** — 2026-11-14, `node scripts/secret-scan.mjs --all` · exit 0 · 1,973 tracked files, 18 binary skipped, 0 findings, 1 allowlisted — the whole-tree fallback is green on the tree it ships in.
- **E9** — 2026-11-14, `node scripts/red-first.mjs` · exit 0 · `red-first — 54 pair(s) · 29 after the cutoff · cutoff 1374ea9`, 0 findings, `verdict: PASS`.
- **E10** — 2026-11-14, the differential against `f7e5dbba` (both trees rendered with `git archive` into scratch directories): `--list`, `--dry-run`, `--only does-not-exist`, `--nope`, `--jobs 0` and `--only root-suite --skip-network --dry-run` compared by stdout, stderr and exit — byte-identical apart from the two the unit asks for (`--list` gains `secret-scan`; `--dry-run` gains its plan line and the step count moves 18 → 19).
- **E11** — 2026-11-14, `node scripts/run-root-suite.mjs` at `143968cf` · exit 0 · `root gate: 113 suite(s) · 4 worker(s)` and 113 PASS, including `scripts/secret-scan.test.mjs (3.3s)` (the base at `f7e5dbba` ran 112 of 112 the same way).
- **E12** — 2026-11-14, the per-step gate runs in the foreground: `node scripts/local-gate.mjs --only version-parity-content,docs-generated-projection,journal-carrier-check,log-immutability,secret-scan,temp-hygiene,tmp-gc,worktree-guard,rigidity-review --skip-network --no-bail` · exit 0 · `PASS — 9 step(s)`; and `--only schema-build,crate-suite-node,schema-node-compat,pi-node-compat --skip-network --no-bail` · exit 0 · `PASS — 4 step(s)`.
- **E13** — 2026-11-14, the full offline gate (`node scripts/local-gate.mjs --skip-network`) twice · exit 1 both times · `FAILED at root-suite`, where `scripts/phase-lint.test.mjs` measured 23 s on the base tree and 35 s on this one in isolation, 67 s beside four competing suites, and crossed the runner's 120 s suite bound under the full pool — the pre-existing contention recorded in `## Known pre-existing issues`, with every other step green in the same runs.
- **P7** — 2026-11-14, verification closed: the standalone root gate, the per-step gate runs, the differential and the live-tree scans · `0d69b33c` (the receipt commit) with the final root gate re-run at the head named below.
- **G1** — 2026-11-14, `node scripts/local-gate.mjs --only secret-scan,log-immutability,journal-carrier-check,docs-generated-projection,version-parity-content --skip-network` · exit 0 · `PASS — 5 step(s)` at the final head, with `Log-immutability: 0 violations · range 8 commits`.
- **G2** — 2026-11-14, `node scripts/run-root-suite.mjs` at the final head · exit 0 · `root gate: 113 suite(s) · 4 worker(s)` and 113 PASS.
- **P8** — 2026-11-14, the session entry written as a journal fragment through `agentic-workflow journal write` and committed by `node scripts/session-close.mjs close` (the journal is aggregator-only since issue #468, so no hand-append) · `c4b4ef08`.
- **E14** — 2026-11-14, the last range scan of this branch (`f7e5dbba..HEAD`, 1,652 added lines including the fragment and this receipt) · exit 0 · `verdict: PASS`, 1 allowlisted; `node scripts/secret-scan.mjs --all` · exit 0 · `verdict: PASS`.
- **L3** — 2026-11-14, owner instruction, verbatim: "Create the PR".
- **G3** — 2026-11-14, the `pre-push` hook judged the branch's own range (`git push -u origin fix/487-deterministic-secret-scanning`) · exit 0 · `local-gate: PASS — 16 step(s)` in 217 s, with `secret-scan: exit 0` and `root-suite: exit 0` in 204 s.
- **P9** — 2026-11-14, branch pushed and the PR opened: [#551](https://github.com/gtrabanco/agentic-workflow/pull/551), and the roadmap row settled `done · [#551]`. One row, rewritten in place: the index already carried a `pending` intake row for #487 (`secret-scan-gate`), which this unit replaced rather than duplicating — the duplicate the first cut appended at the table's tail was removed, and the intake row's stray fifth cell is gone with it.
- **E15** — 2026-11-14, `node scripts/roadmap-settle.mjs` after the settle · exit 0 · `verdict: PASS`, 0 violations.

## Next

The PR is open ([#551](https://github.com/gtrabanco/agentic-workflow/pull/551)) and the
roadmap row is settled; the unit waits for the owner's external verification.
The gate receipt's one red is the pre-existing pool contention recorded above;
the per-step runs, the standalone root gate and the `pre-push` hook's own run
(16 of 16 steps) are green.

## References

Issue [#487](https://github.com/gtrabanco/agentic-workflow/issues/487) ·
PR: [#551](https://github.com/gtrabanco/agentic-workflow/pull/551) ·
Apiiro, ["The Secrets About Secrets in Code"](https://apiiro.com/blog/the-secrets-about-secrets-in-code)
(the measurement the issue cites) · `skills/review-security/SKILL.md` (the
checklist item this unit backs deterministically) · `scripts/temp-hygiene.mjs`
and `scripts/log-immutability.mjs` (the offline gate steps whose shape this one
follows) · `docs/workflow/GATE_INVENTORY.md` (the carrier index).

## Branch

`fix/487-deterministic-secret-scanning`

## Depends on

none — independent.

## Regression scope

| Scenario | Verified by |
|---|---|
| Every existing gate step keeps its id, its table position and its markers | `bun test scripts/local-gate.test.mjs scripts/release-workflows.test.mjs` |
| A checkout whose range carries no secret still passes the step, so no push is blocked by the new check | `bun test scripts/secret-scan.test.mjs` (clean-range case) and the live-tree `--all` run recorded in the Log |
| The step never writes a byte, so running it cannot mutate a checkout | `bun test scripts/secret-scan.test.mjs` (read-only cases: the fixture tree is compared before and after) |
| The scan never echoes a matched secret into terminal output or CI logs | `bun test scripts/secret-scan.test.mjs` (redaction case) |
