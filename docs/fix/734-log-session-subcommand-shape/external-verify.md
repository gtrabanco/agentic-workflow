# External verify — 2026-11-27

Full verdict, once: no prior `EXTERNAL VERIFY` block existed in this unit dir
(no `external-verify.md`, no block in `SPEC.md`), and PR
[#737](https://github.com/gtrabanco/agentic-workflow/pull/737) carries no review
verdict (zero reviews, zero comments — `gh pr view 737 --json state,reviews,comments`).
Read-only run — no `git commit`, no `git push`, no branch creation, no `gh pr
create/edit/comment`, no source edit; the only file written is this receipt
(uncommitted). Base confirmed against the remote without fetching
(`git ls-remote origin refs/heads/main` = `f1b04a3a9`; `refs/pull/737/head` =
`a8f5740cc`). Base-side proofs ran in `mktemp -d` scratch (a `git archive
f1b04a3a9` copy carrying the head suites, plus per-run probe fixtures); all
scratch removed after the runs. The change introduces no unproven mutation path:
every declared check is check-only (`docs-generate --check`,
`version-parity-gate --content`, `check-skill-context`, `lint-changeset`,
`verify --no-git`, `path-guard` reads with `--no-optional-locks`), the package
`test` script writes only gitignored build output (`dist/`, staged `skills/`),
and every crate execution the suite or my probe performed ran against `mktemp`
fixtures, never the live tree. Live tree byte-clean (`git status --short` empty)
after every run. Ambient embedding variables (`AGENTIC_WORKFLOW_DOC_EMBEDDINGS_*`,
`NAN_API_KEY`) were unset for the package/root-gate runs exactly as `## Log`
G2–G5 recorded; with them set the pi suite fails its six documented env cases —
see notes 5a.

EXTERNAL VERIFY — base: f1b04a3a9 · head: a8f5740cc
Blockers: 0
Advisories: 2 — (1) `docs/fix/734-log-session-subcommand-shape/SPEC.md:297` — P6's checkbox is left unticked (`- P6 —`) although `## Log` P6 records the run and its validator re-ran green here (`bun run --cwd packages/pi-agentic-workflow test` → exit 0, 1127 pass / 0 fail). Why advisory: no gate reads the box — the unit's own `verify … --no-git` PASSes with it open — and the substance is evidenced (G1 reproduced, spot check); it is a record inconsistency between `## Tasks` and `## Log`, not a dropped need. Smallest action: tick P6 → `/aw-local-apply`. (2) `docs/fix/734-log-session-subcommand-shape/SPEC.md:347-351` — the unit declares `freeze-after: P3` but carries no `path-protection-records@1` justification/approval rows, so `bun packages/agentic-workflow/bin/path-guard.mjs --unit docs/fix/734-log-session-subcommand-shape --phase P6 --base f1b04a3a9` → exit 1, `PATH-GUARD fail — protected-modification` on all three edited suites (`packages/agentic-workflow/test/journal.write.test.mjs:modify`, `packages/pi-agentic-workflow/test/log-session-invocation.test.mjs:modify`, `packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs:modify`), plus `DEGRADED — missing-config` (no `.agentic-workflow/path-policy.json` — base-identical, pre-existing). Why advisory: only `6813afa44` (the crate pin, justification recorded in `decisions.md` D8) landed after P3 — the two pi suites were appended inside P3 itself; the enforcement point (execute-phase's preflight) was waived by the recorded owner order (L2, quoted in `## Triaged steps`: "the §5 ledger freeze substitutes for the lane's plan step"); `path-guard` is in no running gate set (not a `local-gate` step, not the pre-push offline subset, not `run-root-suite` or `.github/` — `rg path-guard` over those exits 1); no AC, obligation or claimed validator reads it; and the justification substance plus human authority are recorded (SPEC §Path protection prose, `decisions.md` D5/D8, owner orders L2/D10) — the gap is the records grammar, the carrier class the 679 receipt accepted from `decisions.md`. Smallest action: add `path-protection-records@1` justification+approval rows quoting L2/D10 and covering all three suites → `/aw-local-apply`.
Sibling sweep: clean — every survivor of the removed/rewritten truth is a dated history quote, never a current claim: the spaced body survives only in the changeset's defect narration (`.changeset/734-log-session-subcommand-shape.md:8-9`), `docs/LOGS.md:9243` (the issue-filing entry), the unit SPEC's quoted issue/evidence, and the past-tense bug comment `packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs:128`; `rg '"subcommand": "(journal write|session-close close)' packages/*/src skills template scripts` matches nothing; `skills/log-session/SKILL.md` cites only the symbolic CLI form (`runner journal write …`, `runner session-close close` — separate argv tokens, the conforming shape), and `skills/runner-contract/references/RUNNER.md`'s new `"journal write"` sentence names it as the refusal the rule prevents; no dynamic composer exists — the only `agentic_workflow_run {` render sites in `packages/*/src skills template` are the two fixed templates at `packages/pi-agentic-workflow/src/log-session-invocation.ts:380,395`.
Completeness: S1–S11 resolved — S1→P1/P5, S2/S3/S5/S8→P4, S4/S10→P3, S7/S9/S11→P6 (validator green here; P6's box is advisory 1), S6→ recorded disposition `decisions.md` D1 (2026-11-27, route (b) rejected — the dated wontfix of the spec's content) with AC-S6 and obligation O3 re-verified green here; obligations O1–O8 all `verified` with their stated outcomes reproduced (validators in notes 1–9), O9 evidenced `n/a` per owner order D10 — its G1 half reproduced, the two environmental reds disclosed and re-checked (worktree-guard now 0 findings; the load-bound red isolated in note 11) | open ids: none
Spot check: `bun run --cwd packages/pi-agentic-workflow test` → match — observed `1127 pass / 0 fail · Ran 1127 tests across 95 files`, equals reported `## Log` G1 (embedding vars unset, as in G2–G5)
Verdict: VERIFIED

## Notes — command : observed result

1. `bun test packages/pi-agentic-workflow/test/log-session-invocation.test.mjs` →
   exit 0 · **18 pass / 0 fail**, including `the rendered journal call is the one
   the crate accepts` and `S7: a crate-route close …` (O1, O2, AC-S2/AC-S4).
2. `bun test packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs`
   → exit 0 · **8 pass / 0 fail** (M5 ceiling, M7 shape green; O5, AC-S8).
   18 + 8 = 26 = `## Log` E7's combined figure.
3. `bun test packages/pi-agentic-workflow/test/telemetry-attribution.test.mjs` →
   exit 0 · **6 pass / 0 fail** (O4, AC-S7); `rg -c '"journal write"'
   packages/pi-agentic-workflow/src` → 0 matches (exit 1), and source reads
   confirm `journal`/`session-close` are in neither `UNIT_COMMANDS`
   (`session-telemetry.ts:361`) nor `PHASE_LABELS` (`:205`) — the seam attributes
   nothing either way (PE-005 true).
4. `bun test packages/agentic-workflow/test/journal.write.test.mjs` → exit 0 ·
   **34 pass / 0 fail** — the re-bound pin (D8) is two literals where one stood,
   stronger not relaxed (IR3 read: the old assertion pinned the defect's own
   phrase and cannot survive the fix; the new pair fails on a regression to the
   spaced form).
5. Package gate (spot check): `bun run --cwd packages/pi-agentic-workflow test`
   (embedding vars unset) → exit 0 · **1127 pass / 0 fail / 95 files** = G1.
   (a) With the session's ambient embedding vars set: exit 1 · 1121/6 — the six
   failures are `default-on` ×2, `withhold` ×2, `tuning`, `#719 AC6`, the
   env-sensitive class `## Log` E17 discloses ("no provider configured" cases
   seeing a provider); with them unset the same run is green, which is how CI
   runs. Not change-caused (same six fail on any checkout in this environment).
6. State gates: `bun scripts/version-parity-gate.mjs --content` → exit 0
   `VERDICT: PASS` and all four `packages/*/package.json` read `4.10.1` (O7,
   AC-S9); `bun scripts/lint-changeset.mjs .changeset/734-log-session-subcommand-shape.md`
   → `ok`; `bun scripts/docs-generate.mjs --check` → PASS (3 checked, 0 stale,
   ROADMAP unchanged); `bun scripts/check-skill-context.mjs` → PASS 33 skills,
   `--documents` → PASS 7 documents; `bun packages/agentic-workflow/bin/agentic-workflow.mjs
   verify docs/fix/734-log-session-subcommand-shape/SPEC.md --no-git` → exit 0
   `ok: true, violations: []` (E19's O9 refusal is gone now that O9 closed;
   P1's validator green).
7. AC/O sweeps (all as declared): `git diff f1b04a3a9 --
   packages/pi-agentic-workflow/src/extension/workflow-tools.ts` → 0 bytes (O3,
   AC-S6 — the door never learns the shorthand); `git diff f1b04a3a9 --
   packages/*/package.json CHANGELOG.md` → 0 bytes (P2); `rg 'subcommand[^\n]*\.split\('
   packages/pi-agentic-workflow/src` → exit 1; `rg '"subcommand": "(?:journal
   write|session-close close)"' packages/pi-agentic-workflow/src` → exit 1;
   AC-S8 sweep over `packages/*/src skills template` → exit 1 (no match);
   `rg -c '^## Specs$' SPEC.md` → `1`; `rg 'route \(a\)' decisions.md` → D1
   (O8, AC-S11); `git log --format=%s f1b04a3a9..HEAD` → 12 conventional commits,
   none a review/fold/gate-exception commit (AC-S1).
8. Base-side red (O6, AC-S10) in `mktemp -d` (`git archive f1b04a3a9`, head
   suites copied in, bundle staged, `tsc` built) → exit 1 · **21 pass / 5 fail**:
   the four expected — `M7 …`, `S7: the directive names the tool …`, `the
   rendered journal call is the one the crate accepts`, `S7: a crate-route close …`
   — plus `O6: the miss …` which timed out at the bare `bun test` 5000 ms default
   (my invocation omitted the suite script's `--timeout=10000`; the same test
   passes green under the declared command at both base and head — invocation
   artifact, not a tree defect). `## Log` E6 reports 22/4 for the same four
   change-related fails; the delta is that O6 timeout.
9. Independent probe of S4's reproduction (my own, not the writer's harness): the
   exact call bodies extracted from `git show f1b04a3a9:…/log-session-invocation.ts`
   and from the head file, placeholders filled, executed against the crate in
   `mktemp` git fixtures → **base** write: exit 2, `EDIT REFUSAL — Unknown service:
   journal write … Did you mean: journal-corpus, journal?`, 0 fragments; **base**
   close: exit 2, `Unknown service: session-close close`; **head** write: exit 0,
   exactly one fragment (`20261127T104436Z-probe-branch-narrative-probe-session.md`,
   157 bytes); **head** close: exit 1, `session-close: no new fragment under
   .agentic-workflow/journal — write the entry first` — the crate's own writer
   validation, never exit 2. S2's error message and S4's expected exit 0 both
   reproduced, with the base side proven in scratch.
10. Contract-text qualifier check (`skills/runner-contract/references/RUNNER.md`,
    the only contract/instruction surface rewritten): the `in-pi` row keeps
    `(or its typed twin)` and `never a shell command` and replaces `no runner
    executable exists to call` with `no runner executable; subcommand is the
    service alone, every later token an args entry` — the new universal claim is
    verified true of the untouched door (`workflow-tools.ts:767`,
    `[subcommand, ...forwarded]`); the `discovery` row's `from a codemode script`
    → `in codemode` and the `outside-pi` row's `outside a pi session`/`the
    standalone` → `outside pi`/bare path are word trims to fit the declared
    132-est ceiling (D4) — no `only`/`every`/`never`/`unless` qualifier lost, no
    conditional→absolute flip, and the outside-pi pointer itself is unchanged.
    The README addition is purely additive; no SKILL.md frontmatter, AGENTS.md,
    template or normative block outside `runner-mapping@1` was touched.
11. Root gate `bun scripts/run-root-suite.mjs` (embedding vars unset): run 1 →
    exit 1 with a single red, `FAIL scripts/workflow-status-sensor.test.mjs
    (120.0s) — SUITE TIMEOUT`, zero assertion failures — the suite is untouched
    by this change (no diff) and the red is load-shaped: the same suite alone
    under its declared per-test budget `bun test scripts/workflow-status-sensor.test.mjs
    --timeout 30000` → **81 pass / 0 fail** (131.9 s wall at load average ~10 on
    6 CPUs), the class `scripts/test-timeout-allowlist.json` already records for
    `phase-lint`/`red-first`/`doc.structure` under concurrent sessions (its two
    forge-timeout tests are ~10.6 s each by design); run 2, solo → exit 0 ·
    **147 PASS / 0 FAIL**, including `workflow-status-sensor (84.0s)` — matching
    G2's every-root-suite-PASS. Stability: the reproducer fires on an untouched
    adjacent suite, so it is not attributed to the change.
12. G2's two disclosed reds re-checked: `bun scripts/worktree-guard.mjs` →
    `0 finding(s) · verdict: PASS` (the three stale-worktree findings no longer
    reproduce on this checkout); the `crate-suite-bun`/`doc.structure` class stays
    as disclosed and owner-dispositioned (D10) — the crate's own suite was
    exercised here via `journal.write.test.mjs` (34/0) and the change's declared
    crate-side validators, all green. O9 stands as the evidenced `n/a` D10
    records; this receipt does not upgrade it to a full local-gate pass.
13. Sibling/records sweep for the rewritten assertion: the old pin's literal
    `/journal write/` survives nowhere as a current claim; every remaining
    `journal write`/`session-close close` hit in the tree is CLI-argv form (the
    correct contract: `skills/log-session/SKILL.md:128,162`,
    `skills/pre-execution-review/references/LEDGERS.md:218-220`,
    `scripts/log-immutability.mjs`), "the journal writer" prose, or dated
    history in other units' records.

Scratch (`/tmp/aw734base-*`, `/tmp/aw734probe-*`, probe fixtures, run logs)
removed; the live tree carries no side effect beyond this uncommitted receipt.

## Correction batch — 2026-11-27

Owner instruction, verbatim (SPEC `## Log` L3): "Apply to this repository: triage and fix those that deserve to fix but understand the context before fix and check you haven't broke another different thing, if you have done, start the loop again until you fixed full symbol/related stuff"

Both advisories triaged, both confirmed, both folded at `84fd6290b`;
**Blockers: 0 (unchanged)**; the verdict above stands — this addendum records
the batch and its recheck, it is not a re-verification.

- **Advisory 1 folded (F1)** — `SPEC.md:297`'s P6 row closed (`- [x] P6`) only
  after its unproven half ran in the foreground: `bun run --cwd
  packages/pi-agentic-workflow test:node` → exit 0 (fail 0 · 1 skipped; the bun
  half was already green here — spot check, 1127/0). Recheck: `rg -c '^- \[x\] P6'`
  → 1.
- **Advisory 2 folded (F1)** — `decisions.md` now carries `path-protection-records@1`
  with six rows (justification `execute-phase` + approval `human-owner`, one
  pair per post-freeze phase P4/P5/P6, paths = the three suites, authority
  quoted verbatim from this order with L2/D10). The block was validated on a
  `mktemp -d` fixture before the tree was touched — `parseRecords` 6 rows,
  `evaluatePathGuard` pass/approved ×3 over the real change list, both controls
  failing as designed (E22). RED (E21): path-guard exit 1 at P4/P5/P6,
  `protected-modification` on all three suites. GREEN (E23): exit 0 at P4/P5/P6,
  `PATH-GUARD pass — approved`, `offenders: none`.
- **Recheck, limited to the two advisories (G6)** — `verify … --no-git` exit 0;
  `bun test scripts/path-protection.test.mjs` 21/0; `docs-generate --check` PASS;
  `check-skill-context` PASS (skills + documents); `lint-changeset` ok;
  `version-parity-gate --content` PASS; `run-root-suite.mjs` exit 0 · **147 PASS /
  0 FAIL**. No obligation row was touched; no row reopened.
- **Sibling check** — the fold changed no other unit. The same-shape inventory
  found one pre-existing gap elsewhere: `docs/fix/495-doc-store-sharing-and-chunk-limit`
  declares `freeze-after: P5` with no records block — reported to the owner as a
  new finding (§9: a new finding never earns another cycle), not fixed in this
  batch, and left unprobed since its base range is not this branch's.
- The receipt's header "(uncommitted)" described the verification run itself;
  it ships with this batch record (commit 2).
