# External verification — feat/610-new-feature-enforce-shell-tool-choice-programmat

Full verdict — 2026-11-17 (no earlier `EXTERNAL VERIFY` block existed for this
unit, so no
correction has landed since). Unit bound: this directory, base `9de62e1c` (the
merge-base with `origin/main` `8c1a05a8`), head `3f4421bb` (bound at `d87d01ff`;
one commit landed during the run — its delta is reviewed below). Read-only: no
commit,
no push, no branch, no forge mutation — the only bytes this run writes are this
receipt. Every behavioural probe ran in `mktemp -d` scratch
(`/tmp/aw610-verify-P0l4`, removed after the run) and drove the shipped
`packages/pi-agentic-workflow/dist/extension/index.js` entry through an isolated
agent dir, project dir and `PATH`, so the carrier never judged this session's own
commands; the base side is a `git archive 9de62e1c` copy in the same scratch
(removed after the run). No command introduced by this change was executed
against the live tree: the change's own commands are read-only test/gate
invocations, and the mutation path under review (`event.input.command`) was only
ever exercised on scratch input.

```text
EXTERNAL VERIFY — base: 9de62e1c · head: 3f4421bb
Blockers: 2 —
  B1 packages/agentic-workflow/src/tool-choice/policy.mjs:224-226 — the glob
     mappers wrap a value that still carries the input's own quotes, so a quoted
     `--include`/`--exclude`/`--exclude-dir` value becomes a token the shell
     re-expands. Reproducer (derived from S3's "rewrites or blocks … with the
     reason surfaced to the model" and the module's own "forwarding is exact or
     refused … instead of a silent rewrite into a different command"):
     `classifySegment({operator:"", text:"grep --include='*.ts' -rn TODO src"})`
     → suggestion `rg -g ''*.ts'' -n TODO src`; through the shipped handler with
     `toolChoice.mode: "rewrite"` the call is mutated to exactly that string
     (guards/tool-choice.ts:78-80 → extension/index.ts:520), and in the shipped
     default `block` posture the reason names it as the equivalent. Behaviour in
     scratch holding `alpha.mjs`: `sh -c "rg -g ''*.mjs'' -n 'x' ."` →
     `rg: x: No such file or directory (os error 2)`, exit 2, while
     `sh -c "rg -g '*.mjs' -n 'x' ."` → `./alpha.mjs:1:x here`, exit 0. Base side:
     `9de62e1c` carries no `packages/agentic-workflow/src/tool-choice/` module and
     no `packages/pi-agentic-workflow/src/guards/tool-choice.ts` (both
     `git cat-file -e` absent), so that command ran as written there —
     change-caused. Stability: every other suggestion path stays correct
     (`grep -n`, `grep -rn`, `-E`, `-r`, quoted patterns with spaces, env-prefix
     node, multi-segment summaries all probe green), so the reproducer does not
     fire on untouched adjacent code. Smallest action: strip the value's existing
     quotes before wrapping it in the three `LONG_VALUES` mappers
     (policy.mjs:224-226) and add one policy-suite case for a quoted glob, then
     re-run the policy and guard suites.
  B2 docs/features/610-shell-tool-choice-enforcement/planning-obligations.md:27
     (O13) — a `verified` row whose stated validator does not reproduce.
     Reproducer: `rg -n 'canary\|before/after'
     docs/features/610-shell-tool-choice-enforcement/SPEC.md` → **0 matches, exit
     1** (ripgrep reads `\|` as a literal pipe and no line carries a literal
     `canary|before/after`), so the row's "matches 1" is red as written; the
     alternation reading `rg -c 'canary|before/after'` on the same file → 14, so
     "1" holds under no reading. The row's substance does hold (D10's arming and
     E16's before/after capture order are in SPEC.md), which is why this is a
     validator-text defect rather than a dropped obligation. Base side: the
     ledger ships with this diff (no `planning-obligations.md` at `9de62e1c`), so
     the red check is change-caused. Smallest action: correct O13's validator
     cell to a command whose observed count it records (the D7 precedent — a
     check is fixed before the status stands) and keep `verified`.
Advisories: 5 —
  A1 scripts/phase-lint.test.mjs — with the default worker pool
     (`node scripts/run-root-suite.mjs`) this suite hit the 120 s wall-clock
     bound (`FAIL scripts/phase-lint.test.mjs (120.3s) — SUITE TIMEOUT`, gate
     exit 1); it passes alone (`node --test scripts/phase-lint.test.mjs` → 162
     pass · 0 fail · 63.7 s) and inside the serialized gate (spot check below).
     Its diff against base is empty (`git diff 9de62e1c...HEAD` on
     phase-lint.test.mjs and phase-lint.mjs → no output), so the reproducer fires
     on untouched adjacent code: misattributed load flake, the same class E17
     already disclosed — advisory, never a blocker.
  A2 planning-obligations.md:28 (O14) — the row is an evidenced `n/a` (owner
     publish authority), so the obligations blocker trigger does not apply, but
     its validator/count are stale: `rg -n 'pi install' SPEC.md` → 4 matches, not
     "matches 1", and the row's `SPEC.md:449` pointer now sits in the P4/E11
     region (the post-merge step is named at SPEC.md:527, also 123/480). The n/a
     substance reproduces: `git diff --name-only 9de62e1c...HEAD` touches no
     `release.mjs`, no `package.json` and no publish path, and D10/E16 record the
     local canary arming plus the owner's post-merge cut.
  A3 packages/agentic-workflow/src/tool-choice/policy.mjs (`analyzeToolChoice`,
     segment split on `||`/`&&`/`|`/`;`/newline only) — a grep inside
     `$( … )`, behind `xargs`, under `time`, or in a segment headed by `bash …`
     passes untouched (observed: all four "passes"). The script boundary is a
     recorded non-goal (SPEC `## Non-goals`) and no `S#`/AC claims the other
     three shapes; `git grep` passing is correct behaviour. Reach-boundary gap on
     a literal reading of S3's "the tool call's own text" → advisory.
  A4 skills/init-workspace/references/CONFIG.md:14 — the live description of
     `pi-agentic-workflow.json` enumerates "routing, profiles, passes, subagent
     limits, State Flow" without the new `toolChoice` section, and the offer list
     at skills/init-workspace/references/BOOTSTRAP_WRITE.md:159-161 (the config
     policy's `init-workspace` offer step, docs/workflow/CONFIG.md:150) does not
     offer the key. Documentation-currency gap on a live surface: no qualifier was
     flipped (the sentence carries no "only"/"exactly"), the human doc
     (docs/workflow/CONFIG.md:64) and the package README both carry the key, and
     no gate contradicts it → advisory.
  A5 the pre-existing `dependency-pin-gate` drift E18 reports, re-verified as
     pre-existing rather than re-run: `pi-extensible-workflows` pins `6.3.0`
     both at `9de62e1c` and at `d87d01ff` while the registry publishes `6.4.0`
     (`npm view pi-extensible-workflows version` → 6.4.0), and the diff touches
     neither manifest. Already recorded under `## Known pre-existing issues`;
     present at base → advisory by rule.
Sibling sweep: list — live: skills/init-workspace/references/CONFIG.md:14 (A4).
     Frozen by contract: planning-evidence.md:24 (PE-012 states the *base* row's
     "checkability 3", which is exactly what S7 corrects; the row now reads
     checkability 2 and prose-gate-inventory re-runs PASS). Everything else
     clean: `re-decided at turn` and `bun-before-node and rg-before-grep` → 0
     matches repo-wide (outside this receipt); no second allowlist copy survives
     (`BOOTSTRAP_SCRIPTS` is defined once in policy.mjs:47 and imported by
     scripts/invocation-drift.mjs:52, pinned by scripts/tool-choice-parity.test.mjs);
     the derived `bootstrapLiteral` is byte-equivalent to the removed literal;
     no other surface claims the `invocation-drift` row checks at turn or carries
     checkability 3 for it; `spawn-provenance` → 0 matches in `packages/`; the
     AGENTS.md row and both SKILL_CONTEXT_BUDGETS re-pins are additive and
     re-measure green (`check-skill-context --documents` PASS: AGENTS.md 726/163,
     GATE_INVENTORY 172/77). Contract-text qualifier check on the rewritten
     contract sentences: the GATE_INVENTORY `invocation-drift` row is S7's truth
     correction and *gains* qualifiers ("never *teaches*", "outside the fallback
     rule", "both guides", "both executor skills", "the *use* … is the carrier's
     half") with no lost qualifier and no rule flipped absolute↔conditional; the
     invocation-drift.mjs header keeps "Every other script prints the bun form."
     verbatim and only adds the one-home sentence; AGENTS.md and CONFIG.md changes
     are purely additive; the roadmap row rewrite is a summary, not a rule.
Completeness: S1→P7 · S2→P1,P4,P6 · S3→P1,P4,P5,P6,P8 · S4→P7 · S5→P3,P4,P7 ·
     S6→P1,P2,P3 · S7→P7 — every `S#` resolves to a task carrying
     `(Implements: S#)` with a validator re-run green here: P1 policy suite
     `20 pass · 0 fail`, P2 `13 pass · 0 fail` + gate `verdict: PASS`, P3 parity
     `4 pass · 0 fail`, P4 guard suite `9 pass · 0 fail`, P5 config-extension
     `2 pass · 0 fail` + `rg -c toolChoice CONFIG.md` → 1, P6 pi package
     `965 pass · 0 fail` (85 files) and `test:node` exit 0 (`0 fail · 1 skipped`),
     P7 `prose-gate-inventory` `verdict: PASS` + `22 pass · 0 fail`, P8
     `rg -n 'AC4|before/after' SPEC.md` → 8 matches, P9 root suite `119/119 PASS`
     and `docs-generate --check` `verdict: PASS`. Obligations: O1–O12 and
     O15–O18 `verified` with their validators re-run green here (suite legs above;
     the rg-count checks observed verbatim: O5 1/0, O6 1, O15 1/1, O16 0/1, O17
     `30 pass · 0 fail`, O18 backed by F24/F28 plus an independent scratch probe
     showing an invalid `pi-agentic-workflow.json` still blocks under the shipped
     default), O14 evidenced `n/a` (A2), **O13 open → B2**.
Spot check: node scripts/run-root-suite.mjs --jobs 1 → match (run at head
     3f4421bb: exit 0 · 119 suites PASS, no FAIL line; reported E17: exit 0 ·
     119/119 PASS — the default-worker run of the same command differs only by
     A1's timeout on an untouched suite)
Verdict: NEEDS-DECISION (B1, B2)
```

## Head moved during the run — delta `d87d01ff..3f4421bb`

While this verification was in flight another session committed `3f4421bb`
(`docs(log): Apply issue #610 …`), one commit ahead of the `d87d01ff` the run was
bound to. The delta is exactly one file —
`.agentic-workflow/journal/20261117T180137Z-…-narrative-01a1ea29-….md`, 6 lines,
the append-only journal carrier — and touches no code, contract, doc or ledger
surface. Its own claims were checked against the tree: `9` commits
(`git rev-list --count 9de62e1c..d87d01ff` → 9), `30 files` (`git diff
--name-only 9de62e1c..d87d01ff` → 30), and its decision list matches SPEC.md's
D1/D4, the O14 closure and the G1 line. Its `Next` line (PR #617 and two
shared-document merge conflicts) is delivery state — the owner's merge step, not
a finding. Re-run at `3f4421bb`, all green: `doc-discipline` 21·0,
`workflow-docs-index` 5·0, `unit-doc-contract` 21·0, `structural-sibling-pins`
8·0, `prose-gate-inventory` 22·0 + `verdict: PASS`, `invocation-drift`
`verdict: PASS`, `docs-generate --check` `verdict: PASS`, `promise-coherence`
`verdict PASS`, `check-skill-context --documents` PASS. No finding opens or
closes; the spot check below ran at this head.

## Command ledger (declared checks, this run)

| command | observed |
|---|---|
| `bun test packages/agentic-workflow/test/tool-choice.policy.test.mjs` | exit 0 · 20 pass · 0 fail (E3) |
| `bun test packages/pi-agentic-workflow/test/tool-choice-guard.test.mjs` | exit 0 · 9 pass · 0 fail (E7) |
| `bun test scripts/tool-choice-parity.test.mjs` | exit 0 · 4 pass · 0 fail (E5) |
| `bun test scripts/invocation-drift.test.mjs` | exit 0 · 13 pass · 0 fail (E4) |
| `bun scripts/invocation-drift.mjs` | exit 0 · `verdict: PASS` · 4 usage strings · 135 skill files · 23 tutorial docs · 2 guides · 2 turn contracts (E4) |
| `bun test packages/pi-agentic-workflow/test/config-extension.test.mjs` | exit 0 · 2 pass · 0 fail (E8) |
| `cd packages/pi-agentic-workflow && bun run test` | exit 0 · 965 pass · 0 fail · 85 files (E9) |
| `cd packages/agentic-workflow && bun run test` | exit 0 · 1071 pass · 0 fail · 58 files (E10) |
| `cd packages/pi-agentic-workflow && bun run test:node` | exit 0 · 0 fail · 1 skipped (E18's node leg) |
| `bun scripts/prose-gate-inventory.mjs` | exit 0 · `verdict: PASS` · 70 rows, new `shell-tool-choice-carrier` row resolves (E11) |
| `bun test scripts/prose-gate-inventory.test.mjs` | exit 0 · 22 pass · 0 fail (E11) |
| `bun test scripts/normative-drift.test.mjs` | exit 0 · 21 pass · 0 fail (E12) |
| `node --test scripts/residue-dimensions.test.mjs` | exit 0 · 30 pass · 0 fail (E13) |
| `bun scripts/red-first.mjs` | exit 0 · `verdict: PASS` · 0 findings · 56 pairs (E13) |
| `bun test scripts/structural-sibling-pins.test.mjs` | exit 0 · 8 pass · 0 fail (E13) |
| `bun scripts/skill-lint.mjs` | exit 0 · `verdict: PASS` (E13) |
| `bun scripts/docs-generate.mjs --check` | exit 0 · `verdict: PASS` · 3 files · 0 stale (E14) |
| `bun scripts/promise-coherence.mjs` | exit 0 · `verdict PASS` · 42 checked · 24 skipped (E14) |
| `bun scripts/check-skill-context.mjs` / `--documents` | exit 0 · `PASS context budgets: 30 skills` / `PASS context documents: 4` |
| `bun scripts/dimension-regression.mjs --base 9de62e1c` | exit 0 · `verdict | clean` (the G1 receipt this log said would follow) |
| `node scripts/run-root-suite.mjs --jobs 1` | exit 0 · 119 PASS, no FAIL (E17) |
| `node scripts/run-root-suite.mjs` (default workers) | exit 1 · 118 PASS + `phase-lint` 120 s SUITE TIMEOUT (A1) |
| acceptance rg checks (AC-S1/S2/S4/S6) | 1 · 1 / 1 · 0 / 0 · 1 / 1 · 1 — all as declared (E15) |

## Independent probes (`mktemp -d`, removed after the run)

- **Q1** — S3/AC1 wording, module level: `grep -n 'x' file` → blocked with
  `` `rg -n 'x' file` `` in the reason; `node packages/agentic-workflow/bin/agentic-workflow.mjs doctor`
  → blocked with the `bun` twin; `grep -rn 'lighthouse' .` → reason never emits
  `rg -r`; `grep -E`/`grep -r`/`grep --include` never emit `rg -E`, `rg -r` or
  `--include`; a quoted pattern with a space survives (`rg -n 'hello world' src`).
- **Q2** — every sanctioned node form passes untouched in both postures
  (`node --test`, `node scripts/run-root-suite.mjs`, `node scripts/setup-env.mjs`,
  `node scripts/update-tools.mjs`, `node --version`, `node --help`), and so do
  commands that merely mention the words.
- **Q3** — unavailability stands the carrier down per class: `rg` absent → grep
  passes, `bun` absent → node passes (each verified with the other tool present).
- **Q4** — filters pass: `cat a.txt | grep -v x`, operand-less `grep -v x`; a
  quoted operator keeps one segment (`grep -n "^| gate" …` → 1 segment, still
  blocked as search).
- **Q5** — explicit options are honoured, never silently ignored: `mode:
  "rewrite"` forwards `grep -n 'x' file` → `rg -n 'x' file` and `node -p '1+1'` →
  `bun -p '1+1'` (env prefix preserved); `enabled: false` passes in both postures;
  an unknown flag under `rewrite` blocks instead of rewriting (the module's own
  exact-or-refused rule, holding outside the B1 class).
- **Q6** — shipped handler, end to end in scratch: block posture refuses grep and
  node and leaves `node --test` and a `read` call alone; rewrite posture mutates
  `grep -rn 'x' scripts/ | head -3` → `rg -n 'x' scripts/ | head -3`; an invalid
  `pi-agentic-workflow.json` still blocks under the shipped default (O18's
  fallback); `grep --include='*.ts' …` mutates to the B1 string.
- **Q7** — reach boundary observed (A3): `$(grep …)`, `xargs grep`, `time grep`,
  `bash scripts/thing.sh` pass; `/bin/grep -n 'x' f.txt` blocks (directory prefix
  stripped); `git grep -n 'x'` passes.

## Correction batch — 2026-11-17 (§9, owner-ordered, direct application)

One batch on the two blockers plus the two advisories that survived triage
(A2, A4); A1, A3 and A5 were triaged no-fix for the reasons recorded above and
in `SPEC.md` `D11`. No review/fold machinery ran on this repo's own surgery. The
fix is a pure classifier change with no mutating path: the live tree only ever
ran the repository's own read-only gates, and every behavioural probe (including
the shipped-handler legs) ran in `mktemp -d` scratch with an isolated agent dir,
project dir and `PATH`.

| finding | correction | reproducer, re-run |
|---|---|---|
| B1 quoted glob (`policy.mjs:224-226`) | `dequote` + `shellWord` in `packages/agentic-workflow/src/tool-choice/policy.mjs`: the three glob mappers strip the input's own quotes and emit one shell word (apostrophes escaped like `protect()`); `F21` added to `packages/agentic-workflow/test/tool-choice.policy.test.mjs` | RED first, before any implementation: `bun test packages/agentic-workflow/test/tool-choice.policy.test.mjs` → `20 pass · 1 fail`, `F21` on `rg -g ''*.ts'' -n TODO src`; after → `21 pass · 0 fail`. Shipped handler (scratch): block reason now `` `rg -g '*.ts' -n TODO src` ``, rewrite posture mutates the call to the same string, `sh -c "rg -g '*.ts' -n TODO ."` → match exit 0 (the pre-fix token exited 2) |
| B2 `planning-obligations.md:27` (O13) | validator cell → two fixed-string presence checks (`rg -q -F … exits 0`); status stays `verified` on the E16 line, cell note records the correction | `rg -q -F "canary build of **this worktree's** extension" docs/features/610-shell-tool-choice-enforcement/SPEC.md` → 0 and `rg -q -F 'Drift rate: **before 4/4' …` → 0; the frozen `'canary\|before/after'` cell → 1 with **0 matches** (literal pipe under ripgrep), alternation reading → 14 |
| A2 `planning-obligations.md:28` (O14) | validator cell → `rg -q -F 'pi install' … exits 0`; status pointer `SPEC.md:449` → `SPEC.md:527` | exit 0; `git diff --name-only 9de62e1c...HEAD \| rg 'release\.mjs\|package\.json\|publish'` → none |
| A4 pi-file enumerations | `docs/workflow/CONFIG.md:22`, `skills/init-workspace/references/CONFIG.md:14`, `packages/pi-agentic-workflow/src/config/extension.ts:6` now name the shell-tool-choice section beside State Flow | `rg -n 'subagent limits, State Flow\)' docs skills packages/pi-agentic-workflow/src` → 0 (was 2 prose spots + the header); budgets still PASS |

## Blockers-only recheck — 2026-11-17

Scope is the batch's own rows and the obligation validators their surfaces touch
(§9); nothing else was re-judged, and no new finding was taken into a second
cycle.

- corrected ledger validators, verbatim from the raw bytes → `O13a` exit 0,
  `O13b` exit 0, `O14` exit 0; `O14`'s second conjunct holds (no publish path in
  the diff).
- obligation counts unchanged on untouched rows: `O5` 1 / 0, `O6` 1, `O15` 1 / 1,
  `O16` 0 / 1.
- suites: policy `21 pass · 0 fail` · guard `9 · 0` · parity `4 · 0` ·
  invocation-drift suite `13 · 0` + gate `verdict: PASS` (same checked counts) ·
  config-extension `2 · 0` · residue-dimensions `30 · 0`.
- packages: `cd packages/pi-agentic-workflow && bun run test` → `965 pass, 0
  fail` (85 files, dist rebuilt); `cd packages/agentic-workflow && bun run test`
  → `1072 pass, 0 fail` (58 files; +1 = `F21`).
- shipped-handler probe (scratch): block reason, rewrite mutation, plain-rewrite
  control, sanctioned control, filter control, block-posture control — all held.
- prose/structural gates: prose-gate-inventory `verdict: PASS` + `22 · 0`,
  normative-drift `21 · 0`, doc-discipline `21 · 0`, structural-sibling-pins
  `8 · 0`, red-first `verdict: PASS`, skill-lint `verdict: PASS`,
  docs-generate --check `verdict: PASS`, check-skill-context both modes PASS,
  promise-coherence `verdict PASS`, dimension-regression `verdict | clean`,
  log-immutability `23 · 0`.
- `node scripts/run-root-suite.mjs --jobs 1` → exit 0 · `119/119 PASS`, no FAIL
  line (the default-worker run still carries A1's load-only timeout on the
  untouched `phase-lint` suite — unchanged, advisory).

Recheck verdict: **B1 and B2 reproduce as fixed; A2 and A4 closed; no new
finding.** The full `local-gate` receipt for this head:

- `bun scripts/local-gate.mjs --jobs 2 --no-bail` · exit 1 · 18 of 19 steps
  exit 0 — including `root-suite` exit 0 in 126s over 119 suites with 4 workers
  (A1's load-only phase-lint timeout did not recur), `journal-carrier-check`
  exit 0 (the batch's fragment conforms), `worktree-guard` 0 findings,
  `secret-scan` 0 findings, `crate-suite-bun` / `crate-suite-node` /
  `schema-node-compat` / `pi-node-compat` / `pi-compat-guard` all exit 0 — and
  **`dependency-pin-gate` exit 1 on the pre-existing registry drift**
  (`pi-extensible-workflows` 6.3.0 vs the registry's 6.4.0; this batch changes
  no manifest, `package.json` or `bun.lock`), the same known issue E18 recorded.

## Push record — 2026-11-17 (escape hatch, recorded as the hook asks)

`git push` ran the installed pre-push gate twice on this range
(`d87d01ff..e32b91d2`) and both runs finished **`local-gate: PASS — 17 step(s)`**
(529s, then 468s) — after which **git itself exited 141 (SIGPIPE)** and nothing
was published (remote tip stayed `d87d01ff`). The transport is healthy on the
same range: `git -c core.hooksPath=<empty> push --dry-run` → exit 0,
`d87d01ff..e32b91d2`, no hook. The publish was therefore completed with the
hook's own documented escape hatch, `AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1`, on the
grounds that the offline gate had already passed for exactly this range twice in
this session — recorded here per the hook's "record why" line, and worth one
line on PR #617 as the owner's step. A stray `SIGPIPE` in git's post-hook phase
is not this unit's surface; it is reported, not hidden.
