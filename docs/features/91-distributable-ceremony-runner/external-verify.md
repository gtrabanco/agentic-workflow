# External verification — feature/91-distributable-ceremony-runner

2026-11-13 · first receipt for this unit (no prior `EXTERNAL VERIFY` block in this
unit dir → full verdict, once). Read-only run: no commit, no push, no branch, no
`gh` mutation, no source edits — this file is the only write. No write-mode
runner command (`ceremony … create|settle|add|annotate|commit|pr …`) was executed
against the live tree; only read/verdict subcommands and the suites ran here.
`bun install --frozen-lockfile` (the gate's own `workspace-install` step) populated
this worktree's `node_modules`; `git status` stayed clean throughout. Base =
merge-base with `origin/main` (`43e8c1f9e6f854a1e57a5ba2227f32e7042dacee`);
`origin/main` at verify time: `8079f11a6803b9f54f17748a54100a2249eded30` (its
post-cut commits do not touch this unit's diff, so the merge-base is the base).

```text
EXTERNAL VERIFY — base: 43e8c1f9e6f854a1e57a5ba2227f32e7042dacee · head: b851077db0b17f1075551edacbff1a8141af444c
Blockers: 11 — each: file:line, reproducer, base-vs-head evidence
Advisories: 4 — each: file:line, why advisory
Sibling sweep: list (blockers B7–B11)
Completeness: S1–S13 resolved (phase-lint PASS 6/6 on P1–P9, every task validator re-run green here)
Spot check: node --test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs → mismatch
Verdict: NEEDS-DECISION (11 open blockers)
```

## Blockers

**B1 — O3's stated validator does not reproduce.**
`docs/features/91-distributable-ceremony-runner/planning-obligations.md:14` (`verified`).
Reproducer: `rg --files scripts/ | rg -c '(^scripts/)?(ceremony(\.mjs|/).*|phase-lint|diff-guard|workflow-status|pre-execution-snapshot|pre-execution-contract|needs-input|ledger-provenance|unit-route|unit-doc-phases|risk-tiers|capabilities|ceremony-profile)\.mjs$'`
→ **2** (ledger says `matches 0`): `scripts/ceremony/testing.mjs` (retained test
harness) and `scripts/fixtures/unit-route/scripts/phase-lint.mjs` (a 1-line stub:
`// stub cited by the dogfood ledger rows`). Base-side: both files exist
at `43e8c1f9` and the same command matched ≥10 there, so the cell's `0` never
reproduced. Smallest action: correct the O3 validator cell to a command that holds
at head (scope it past `scripts/fixtures/**` and the retained harness) or record an
evidenced disposition for the two survivors.

**B2 — O6's stated validator does not reproduce.**
`planning-obligations.md:17` (`verified`).
Reproducer: `rg -c 'agentic-workflow-schema/src/|schema-runtime' packages/agentic-workflow/src`
→ **7 files** (ledger says `matches 0`); base-side `git grep` at `43e8c1f9` → **3**
(`edit/Provenance.mjs`, `edit/schema.mjs`, `verify/Verify.mjs`), and this change
adds 4 more (`runner/ceremony-profile.mjs:6`, `sensors/workflow-status.mjs:16`,
`sensors/needs-input.mjs:24`, `sensors/pre-execution-contract.mjs:22`). All 7 hits
are comments (no `import` from `…-schema/src/` and no live `schema-runtime` load exists; the
import-substance of S7 holds and `package.json` dependencies are unchanged
`git diff 43e8c1f9 HEAD -- packages/agentic-workflow/package.json` → empty), so the
receipt cell, not the code, is what fails. Smallest action: restate O6's validator
to an import-only check (e.g. `rg 'from .*agentic-workflow-schema/src/|schema-runtime\.mjs'`
over import statements) and re-run it green.

**B3 — O18's stated validator does not reproduce.**
`planning-obligations.md:29` (`verified`).
Reproducer: `rg -c '91-distributable-ceremony-runner' docs/ROADMAP.md` → **no match,
exit 1** (ledger says `matches 1`); base-side `git grep` at `43e8c1f9` → also 0, so
the string never appears in the roadmap (row 91 carries the slug
`distributable-ceremony-runner`, and no roadmap cell links unit folders —
`rg -c 'docs/features/' docs/ROADMAP.md` → 20 rows, none of them row 91's).
The substantive state is present (row 91 `in-progress` at `docs/ROADMAP.md:120`,
`.changeset/352-distributable-ceremony-runner.md`, `docs/workflow/MIGRATION.md:1017`,
two `docs/LOGS.md` entries) — the validator names the wrong string. Smallest action:
point O18's validator at a string that exists (e.g. `rg -c 'distributable-ceremony-runner' docs/ROADMAP.md`).

**B4 — O22's stated validator does not reproduce.**
`planning-obligations.md:33` (`verified`).
Reproducer: `git diff -M --summary origin/main...HEAD -- scripts packages/agentic-workflow/test | rg -c 'rename'`
→ **0** (cell says "reports renames with no net case loss"). Unrestricted
`git diff -M --summary origin/main...HEAD` finds 21 renames, but every pair's
destination is `packages/agentic-workflow/src/runner/**` — outside the cell's own
pathspec, so the command as written can never report them. Base-side: at `43e8c1f9`
the sources sat under `scripts/` (their old side), so the pairing only exists
because of this change. Case-loss substance holds (root suite 106/106, crate suite
697/697 — no suite red, no case relaxed in the diff). O16's required-evidence cell
shares the same `git diff -M --stat … -- scripts packages/agentic-workflow/test`
claim. Smallest action: fix the pathspec in O22/O16's cell (drop it or add
`packages/agentic-workflow/src/runner`) and re-run.

**B5 — the unit doc's closing receipts are not bound to the runs they claim.**
`docs/features/91-distributable-ceremony-runner/SPEC.md:351,369,412,423,433` still
carry literal placeholder SHAs (`P3SHA`, `P6SHA`, `P7SHA` ×2, `P4SHA`) — commits
that do not exist (`git cat-file -e P3SHA` fails); `b851077d` bound G9/G10 to
`d094440a` but missed these five. Reproducer: `rg -n '[A-Z][0-9]SHA' SPEC.md` → 5
hits. Additionally `SPEC.md:435` (G9) reports `node --test …/runner.ceremony-p1p2.test.mjs
· exit 0 · 8 pass` at `HEAD d094440a`, and `SPEC.md:469` (G10) reports `8 + 9 + 8 + 6` —
the suite file is byte-identical at `d094440a` and head
(`git diff --stat d094440a HEAD -- packages/agentic-workflow/test/` → empty) and
re-running it yields **12 pass / 0 fail** (12 top-level `✔`), so the recorded count
cannot have come from that head. Base-side: this file is new in the diff (absent at
`43e8c1f9`). Smallest action: replace the five placeholder tokens with the real
SHAs (`git log --oneline` has them) and correct G9/G10's pass counts.

**B6 — a declared retirement gate in the SPEC fails.**
`SPEC.md:111` claims `rg -c 'scripts/ceremony' skills/ scripts/ packages/` → 0 after
the change; observed → **6 matches** (`scripts/ceremony-docs.test.mjs:5`,
`scripts/ceremony-profile.test.mjs:102`, `scripts/ceremony-workspace.test.mjs:4`,
`packages/agentic-workflow/src/runner/ceremony-profile.mjs:11`,
`packages/agentic-workflow/src/runner/ceremony/index.mjs:12`,
`scripts/tier-cost.test.mjs:116`). Base-side: the retired CLI itself matched there
(the count was higher); the `0` never held — the surviving six are fixture/historical
references (the `scripts/ceremony/testing.mjs` harness exists at head), so the
retirement substance holds but the SPEC's evidence cell does not. Smallest action:
restate the cell to the grep that actually holds (e.g. scope out the retained
harness/fixture references) or list the six as declared survivors.

**B7 — sibling surface: the pi package's tool instructions keep the old spawn truth.**
`packages/pi-agentic-workflow/src/extension/workflow-tools.ts:38-44` — `TOOL_COMMON.instructions`
still says "Each tool spawns the project's own script (scripts/<name>.mjs) … never
the package's pinned one", and `packages/pi-agentic-workflow/README.md:202-206,207-211`
still tabulates `agentic_workflow_status → scripts/workflow-status.mjs --json-only`,
`diff_guard → scripts/diff-guard.mjs`, `phase_lint → scripts/phase-lint.mjs`,
`snapshot_verify → scripts/pre-execution-snapshot.mjs` under the heading "The
project's own checkout runs … never the package's pinned copy". Base-vs-head:
at `43e8c1f9` the spawns were exactly `script: "scripts/diff-guard.mjs"` /
`"scripts/phase-lint.mjs"` / `"scripts/pre-execution-snapshot.mjs"` and the sensor
spawned `["scripts/workflow-status.mjs", "--json-only"]` — the prose was true; this
change (007250c8) re-pointed them to `runnerBin()` + subcommand
(`workflow-tools.ts:497,535,640`, `conductor/sensor.ts:57`) and deleted all four
scripts, so the instruction now asserts the opposite of the code. The files were
not updated by the change (`git diff origin/main...HEAD -- packages/pi-agentic-workflow/README.md` → empty).
Smallest action: re-point the `instructions` string and the README table/property
at the runner bin + subcommand.

**B8 — sibling surface: the repository README cites deleted commands as live.**
`README.md:117` (row `execute-phase`): "Each phase's pre-flight runs
`bun scripts/phase-lint.mjs <plan>` … runs the three-tier dispatch and then
`scripts/needs-input.mjs` prints the `open-questions@1` block". Both files exist at
`43e8c1f9` (`git cat-file -e` ✓) and are deleted by this change (retirement commit
`edde336c`); README.md itself is untouched by the diff. Reproducer:
`test -f scripts/phase-lint.mjs || echo missing` → missing at head, present at base.
Smallest action: re-point the row at the runner invocation (the S6 substitution set).

**B9 — sibling surface: the exported template still instructs the retired runtimes.**
`template/AGENTS.md:292` (`scripts/needs-input.mjs`), `template/AGENTS.md:313`
(`scripts/diff-guard.mjs`), `template/docs/features/_TEMPLATE/SPEC.md:74,162,188`
(`bun scripts/ceremony.mjs tier classify`, `bun scripts/unit-route.mjs --triage`,
`scripts/unit-route.mjs`) and `template/docs/fix/_TEMPLATE/SPEC.md:15,86,173,199`
(same four). `scripts/ceremony.mjs`, `scripts/unit-route.mjs`, `scripts/needs-input.mjs`
and `scripts/diff-guard.mjs` all exist at `43e8c1f9` and are deleted at head;
`template/` is untouched by the diff. Smallest action: re-point the template lines
at `bunx @gtrabanco/agentic-workflow@<pin> <subcommand>` (the S6 form) or name
`RUNNER.md`.

**B10 — sibling surface: the shipped crate's own usage blocks cite deleted scripts.**
All inside the package this change publishes, all asserting paths that exist at
base and are deleted at head:
`packages/agentic-workflow/src/runner/sensors/phase-lint.mjs:10`
(`bun scripts/phase-lint.mjs <plan.md>`),
`sensors/needs-input.mjs:14` (`node scripts/needs-input.mjs …`),
`sensors/ledger-provenance.mjs:20` (`Usage: bun scripts/ledger-provenance.mjs …`),
`sensors/pre-execution-snapshot.mjs:19,23,27`,
`sensors/pre-execution-contract.mjs:10,12` (names `scripts/pre-execution-snapshot.mjs`
and `scripts/workflow-status.mjs` as live siblings),
`sensors/workflow-status.mjs:53,929` (`scripts/risk-tiers.mjs`, `scripts/unit-route.mjs`),
`runner/risk-tiers.mjs:65` (`scripts/capabilities.mjs`), `runner/ceremony/tier.mjs:12`,
`runner/unit-doc-phases.mjs:6`, `src/doc/structure.mjs:75` (`scripts/unit-doc-phases.mjs`).
Reproducer: `rg -n 'scripts/(phase-lint|workflow-status|…)\.mjs' packages/agentic-workflow/src`
→ the hits above; each named file fails `test -f` at head and passes at base.
(`src/runner/ceremony/index.mjs:12` "the same code the repository ran as
`scripts/ceremony/*`" is past-tense history — not counted.)
Smallest action: update each header/usage block to the runner invocation.

**B11 — sibling surface: repo scripts this change touched keep the old truth — one of
them emits it as a generated instruction.**
`scripts/unit-cycle.mjs:217` builds an executor prompt ending
"`bun scripts/diff-guard.mjs --unit <n>`, commit, and stop" —
the file is in the diff (12 ±), the command exists at base
(`git show 43e8c1f9:scripts/unit-cycle.mjs | rg 'bun scripts/diff-guard.mjs'` → hit at :215)
and is deleted at head, so the loop now hands executors a dead command.
`scripts/promise-coherence.mjs:164` still allowlists `scripts/phase-lint.mjs` in
`REPORT_VALIDATORS` (a validator that can no longer be re-run; the file is in the diff).
Stale subject headers in touched files naming the retired runtime as their own
subject: `scripts/phase-lint.test.mjs:3`, `scripts/diff-guard.test.mjs:3`,
`scripts/unit-route.test.mjs:4`, `scripts/workflow-status-sensor.test.mjs:4`
(the same file already reads the crate path at :199+), `scripts/needs-input.test.mjs:3`,
`scripts/ledger-provenance.test.mjs:6`, `scripts/pre-execution-sensor.test.mjs:6`,
`scripts/golden-fixture.test.mjs:6` (its spawn at :46 is correctly re-aimed),
plus non-test prose `scripts/structural-sibling-pins.mjs:24`,
`scripts/vocabulary-probe.mjs:160`, `scripts/session-close.mjs:20`,
`scripts/check-skill-context.mjs:356`. Base-side: every named script existed at
`43e8c1f9`, so each mention was true there and falsified by the retirement.
Smallest action: re-point `unit-cycle`'s generated line and
`promise-coherence`'s allowlist at the runner, then refresh the headers.

## Advisories

**A1 — `bun scripts/local-gate.mjs` flaked once here.** First invocation
`local-gate: FAILED at root-suite` (no failing suite captured; run under the
default 4-worker pool on this 6-CPU host, where the root gate bounds each suite at
120 s). Standalone `node scripts/run-root-suite.mjs` → exit 0 (106/106), and the
immediate re-run → `local-gate: PASS — 17 step(s) in 230s`. Why advisory: it did
not reproduce on re-run, no suite fails deterministically, and the failing suite was
never identified — not change-attributable on this evidence.

**A2 — unknown top-level subcommand answers `EDIT REFUSAL` (exit 2, plain text), not a
JSON usage error.** `packages/agentic-workflow/bin/agentic-workflow.mjs:1543`
(`agentic-workflow invented-command` → `EDIT REFUSAL — Unknown service`, exit 2)
vs O2's wording "an unknown subcommand … JSON usage error (exit 1)"
(`planning-obligations.md:15`). Why advisory: pre-existing at base (same
`refuse(…)` at `43e8c1f9:bin/agentic-workflow.mjs:1525`), deliberately suite-pinned
(`runner.dispatch.test.mjs:106` asserts exit 2), and the ceremony-level
"unknown subcommand" (`ceremony workspace bogus` → `{"error":"unknown-subcommand"}`,
exit 1) does satisfy the JSON claim — the ledger wording overreaches, the code does not.

**A3 — `ledger-provenance <missing path>` throws a raw `ENOENT` stack (exit 1).**
Why advisory: pre-existing at base (the sensor's own file read), already declared in
`SPEC.md` §Known pre-existing issues, outside S4's preserve-the-contract scope.

**A4 — fixture/corpus/historical strings still name the retired scripts.**
e.g. `scripts/risk-tier-classifier.test.mjs:100,188,221,238` (synthetic trees),
`scripts/relevant-files.test.mjs:69-155` (pasted unit-doc corpora),
`scripts/invocation-drift.test.mjs:59` (stale-spelling fixture),
`docs/workflow/SKILL_CONTEXT_BUDGETS.json` `sources` reasons, `CHANGELOG.md:157,265`,
`docs/workflow/MIGRATION.md:1034-1039` (the rename table this unit added),
`docs/LOGS.md` history. Why advisory: fixed test inputs and historical records —
they do not assert the current tree, and firing on them would be misattribution.

## Receipt note on O20

O20's evidence cell (`planning-obligations.md:31`) was sampled **before** this
receipt was written and matched: `rg -c 'EXTERNAL VERIFY\|REVIEW-RAN' docs/features/91-distributable-ceremony-runner`
→ 0, `git log --oneline origin/main..HEAD` → 17 commits, none a review/receipt
commit (S12 intact — no `review-change`/`audit-pr`/fold machinery touched this
diff). This file itself makes the directory grep read 1, by design of the
external-verify protocol; O20's validator (the commit list) remains green. The next
verifier must read this note rather than treat the count of 1 as a violation.

## Spot check

Reported (SPEC.md:434-435, G9): `node --test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs`
→ `exit 0 · 8 pass` at HEAD `d094440a`. Re-run end-to-end here at head →
`exit 0 · 12 pass / 0 fail` (12 top-level tests; the file is identical at
`d094440a`). **Mismatch** — per the verification contract, every reported number in
the unit doc is treated as untrusted from here on; the verdict above rests only on
commands re-run in this session. (Context, not a defence: every other sampled
report figure reproduced — dispatch 6, cli.surface 3, distribution 3,
normative-drift 21, budgets 30/14/4, root suite 106/106, crate suite 697,
gate 17 steps — only the p1p2 counts disagree.)

## Commands re-run in this session (observed)

```text
bun scripts/local-gate.mjs                                  run1 FAILED at root-suite · run2 PASS — 17 step(s) in 230s
node scripts/run-root-suite.mjs                             exit 0 · 106/106
node --test packages/agentic-workflow/test/runner.dispatch.test.mjs        exit 0 · 6 pass
node --test packages/agentic-workflow/test/runner.sensors.test.mjs         exit 0 · 8 pass
node --test packages/agentic-workflow/test/runner.ceremony-p0.test.mjs     exit 0 · 9 pass
node --test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs   exit 0 · 12 pass   (reported 8)
node --test packages/agentic-workflow/test/runner.distribution.test.mjs    exit 0 · 3 pass
node --test packages/agentic-workflow/test/cli.surface.test.mjs            exit 0 · 3 pass
node --test scripts/normative-drift.test.mjs                  exit 0 · 21 pass
node --test scripts/golden-fixture.test.mjs                   exit 0
bun scripts/check-skill-context.mjs                           exit 0 · 30 skills
bun scripts/check-skill-context.mjs --routes                  exit 0 · 14 routes
bun scripts/check-skill-context.mjs --documents               exit 0 · 4 documents
agentic-workflow phase-lint docs/features/91-…/SPEC.md        exit 0 · PASS 6/6 × P1–P9
agentic-workflow ceremony nonsense x                          exit 1 · {"error":"unknown-object"}
agentic-workflow ceremony workspace bogus                    exit 1 · {"error":"unknown-subcommand"}
agentic-workflow ceremony workspace status                   exit 0 (read-only)
grep gates: O3 → 2 (claimed 0) · O6 → 7 (claimed 0) · O12 → 0 ✓ · O18 → 0 (claimed 1) ·
O19 → 0 ✓ · deferred-module → 0 ✓ · skills retired-runtime gates → 0 ✓ ·
SPEC:111 gate → 6 (claimed 0) · O22 rename pathspec → 0 renames (claimed renames)
```

Routing: every blocker above is evidence only — corrections belong to
`/aw-local-apply` under its correction bounds (one batch → one blockers-only
recheck → a second only if the same blocker persists → `Needs your decision`).

## Correction batch — 2026-11-13 (§9, one batch)

Scope: the 11 blockers above, applied on top of the `origin/main` integration
`35d442d6` (conflicts: `docs/LOGS.md`, `SKILL_CONTEXT_BUDGETS.json`,
`scripts/lane-era-lineage.test.mjs` — both sides' features kept in each). Recheck
= each blocker's own reproducer re-run after the batch:

- **B1** O3 cell re-instrumented → reproducer **0** (exclusions named in the cell;
  negative control: a runtime planted at `scripts/ceremony/<name>.mjs` still matches).
- **B2** O6 cell import-scoped → **0**; `git diff 43e8c1f9 HEAD -- packages/agentic-workflow/package.json` still empty.
- **B3** O18 cell greps the slug the roadmap carries → **1**.
- **B4** O22 pathspec dropped, summary form → **21** renames reported.
- **B5** five placeholder SHAs + three pre-re-author SHAs bound to ancestors of
  head; G9/G10's p1p2 count corrected to **12** (the suite's own output at the stated head).
- **B6** `rg -c 'scripts/ceremony' skills/` → **0**, the six survivors named in the cell.
- **B7** pi tool instructions + README table name the pinned runner bin
  (`audit-pr-gate` still the project script) → reproducer quiet.
- **B8** root README ✓ · **B9** four template twins + `template/AGENTS.md` ✓
  (`scaffold-parity` 17/17, `guide-split` 15/15).
- **B10** shipped usage headers → **0** retired-path matches · **B11**
  `unit-cycle` prompt, `promise-coherence` allowlist, twelve headers → **0**
  (`unit-cycle` 45/45, `promise-coherence` 37/37).

Integration finding folded in (both features must hold): main's #514
`git-config-writes` gate failed on this branch's three crate fixture suites →
migrated to the `-c`-per-invocation convention (`e8e8e393`), scanner 9/9.

**Verification:** `LOG_IMMUTABILITY_BASE=8079f11a bun scripts/local-gate.mjs` →
**PASS — 17 steps in 219s** at `e8e8e393`.

**New finding (§9 — owner decides, nothing was routed around):** the pre-push
`push-identity` step cannot pass for *any* push of this branch — its range
necessarily includes `origin/main`'s 13 already-published non-approved
committers (GitHub merges, journal-bot, github-actions, one name variant), none
from this branch; the journal step likewise needs
`LOG_IMMUTABILITY_BASE=8079f11a` (delta over main → 0 violations) because
`origin/main` itself carries two hand-appended entries. Push attempted exactly
as the hook requires → **refused at `push-identity`, nothing uploaded**.
Options: run the push with the hook's documented escape hatch
`AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1` and record the reason, or settle the
checker's range policy for merge pushes first.

**O20 note:** this receipt is now committed (`860437e8`), so its directory grep
reads 1 permanently — by design of this protocol; O20's validator (commit list:
no `review-change`/`audit-pr` receipt commit) stays green.
