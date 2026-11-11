---
type: feature
scope: medium
ac-hash: 549d0f3644504536043b703db492cdee5a6689bd26cd81cb4cc19ca817e13455
roadmap_summary: Issue [#269](https://github.com/gtrabanco/agentic-workflow/issues/269) (M): the two JEV-free quick wins of the system-one evaluation's Idea 2 — P1 ripgrep-first search as the default wherever "grep" is meant, under an explicit gitignore contract plus an ask-first bootstrap installer; P2 a per-phase `Relevant files:` line in the unit doc's `## Tasks`, written at plan time and consumed by the executor. Owner decision 2026-09-29: ships ahead of #192. The stale branch `feat/69-efficient-context-targeting` carries this issue's number but not this row's — re-open it as `feat/80-efficient-context-targeting` — Owner decision 2026-11-10: the row's re-open-as-feat/80 instruction is withdrawn (work parks on feat/269-efficient-context-targeting); the remaining P2 consumption scope lands entirely AFTER #434 (its fused design/plan authors the Relevant-files lines) — #269 is now natively blocked-by #434. Missing scope, complete list for the future implementer: (1) forward-propagation — a phase that discovers files relevant to later phases appends them to those phases Relevant-files sub-sections at phase close; (2) review-change consumes the unit's per-phase lists as its read set around the diff (git keeps review scope); (3) triage-issue/replan start from the affected-file set, not from scratch; (4) the never-authority discipline test — an unlisted file is never out of scope, executors may always add a file, logged in the Progress log; (5) the ask-first, never-root rg bootstrap installer in the runner crate (row 61 vehicle, done); (6) the measured delta evidence row (files-read/tokens for one plan-execute-review cycle with vs without the sub-section). Already delivered, do not duplicate: P1 rg-first (guide convention + fix/329 invocation-drift gate) and the Relevant-files grammar (phase-contract + phase-lint, #272/#276, wired into unit-lane PLAN.md and execute-phase) — 2026-11-10 update: origin/feat/69-efficient-context-targeting was deleted on owner order (tip da76ab97, backup refs/backup/feat-69-efficient-context-targeting) — the stale-branch clause above is history; the depends-on cell now carries the native blocker #434.
---

# 80 — efficient-context-targeting (remaining P2)

> One-line: the remaining half of issue #269 — a per-phase read-set tool with the
> never-authority discipline, executor/review/triage consumption of the unit's
> `Relevant files:` lists, forward propagation at phase close, and the ask-first
> `rg` bootstrap installer — after #434 landed the authoring half. Issue #269,
> no JEV, ships ahead of #192. (Unit dir keyed to roadmap row 80, the issue's
> row; the `[#269]` fix-index row belongs to the parallel
> `docs/fix/269-external-verify-findings` correction unit.)

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#269` — tracked issue in the project's forge. The PR closes it via `Closes #269`
in the body.

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim
between the quote markers (elisions marked). A later correction is appended
under its own id and never rewrites the id it corrects.

**S1 — Apply the local unpublished workflow to issue #269.**
> Apply to this repository: issue #269. "This is a **local, unpublished**
> workflow for changing agentic-workflow itself." […] Work inline — "No
> `review-change`, no `audit-pr`, no fold cycle, no self-granted gate exceptions
> on this change. Direct application: the §5 ledger freeze **is** the plan;
> implement against it, hand the diff to me." […] "Freeze the planning ledgers
> before the first line of code" […] "Then run the declared verification
> commands in the foreground and report each as `command: observed result`. Then
> stop and present: the diff summary, the obligations ledger state (rows ×
> status), the verification block, the §7 documentation state, and every
> failed/skipped/pending check honestly — **I am the external verifier**."

**S2 — Park: #269 waits for #434; annotate what is missing, in the PR and on the issue (delivered 2026-11-10, PR #506).**
> "No reabras ni rescates spec de feat/69 ni reabras feat/80" […] "Esperamos a
> #434, crea la PR y anota que falta P2 que debe aterrizar completamente tras
> #434 (tanto en la pr como en #269) para que luego el implementador tenga claro
> que es lo que falta por implementar sin tener que revisar todo."

**S3 — Implement the remaining scope now that #434 is merged.**
> "434 ya fue mergeado en main y ya he actualizado (git pull) este worktree/rama,
> puedes proceder a implementar este cambio"

S3's scope is the six remaining items of issue #269 as recorded in the 2026-11-10
scope state (roadmap row 80 annotation + the #269 scope comment): (1) execute-phase
consumes the per-phase `Relevant files:` lists and forward-propagates discovered
files at phase close; (2) `review-change` uses the unit's lists as its read set
around the diff; (3) `triage-issue`/replan start from the affected-file set;
(4) the never-authority discipline is mechanically enforced; (5) the ask-first,
never-root `rg` bootstrap installer ships in the runner crate; (6) the measured
delta is recorded as evidence.

## Impact

- `skills/execute-phase/SKILL.md`, `skills/review-change/SKILL.md`,
  `skills/triage-issue/SKILL.md` gain new contract prose — context budgets
  (`bun scripts/check-skill-context.mjs`) and the golden-fixture smoke
  (`scripts/golden-fixture.test.mjs`) must stay green; `skill-lint` re-lints all
  three.
- `scripts/relevant-files.mjs` is a new repo script with a sibling suite
  (red-first rule, `scripts/structural-sibling-pins.test.mjs` reads the tree).
- `packages/agentic-workflow` gains the `provision` subcommand: the bin's usage
  token list is pinned by `packages/agentic-workflow/test/cli.surface.test.mjs`
  and mirrored in the crate README's usage line + Commands row — both move
  together.
- `template/` is untouched except `.gitignore` policy: the installer itself
  appends the `.agentic-workflow/bin/` entry (the template carries no `.gitignore`
  scaffold to amend).
- Consumers: the lane's plan step already writes the lists
  (`skills/unit-lane/references/PLAN.md`); the schema package and the four
  packages' APIs are untouched.

## Retirements

none — the change only attaches consumption to surfaces that already exist; the
issue's own retired half (the duplicated `bump-skill` naming) was retired by
D-40-14 in a prior unit, and nothing in this change supersedes a shipped helper.

## Non-goals

- JEV / system-one decisions (parked by owner; see the evaluation record).
- Embeddings and the retrieval index → #192; graph layer (co-change / link /
  LSP-reference graphs) → #192 amplification.
- The install wizard command itself (future runner/AWL work; this unit ships
  only the `rg` bootstrap it can call).
- Model routing / tier selection → #201.
- Re-opening `feat/80-efficient-context-targeting` or rescuing the stale
  `origin/feat/69-efficient-context-targeting` SPEC (owner decision 2026-11-10).

## Risk tier

- **Tier** — `high` · **Task Size** — understood, contained risk named, resumable
  from diff (ceremony: unit-doc+review-change; verification: review-change)
- **Named high-risk item** — "1 path(s) touch a named high-risk surface:
  destructive (packages/agentic-workflow/bin/agentic-workflow.mjs ·
  ../src/doc/retrieval.mjs · (module-level))"

## Future

- `<open>` — a wizard `init`/`setup` command in the runner crate that runs this
  bootstrap with the other tools (shared provisioning module with #219's
  pattern). Recorded in issue #269; out of scope here.

## Future cost

- Every new skill-facing contract prose change re-arms the context budgets and
  the golden-fixture smoke as its standing gate (binds future editors of the
  three touched skills and of `scripts/relevant-files.mjs`).

## Applicable tests

- `scripts/relevant-files.test.mjs` (new, red-first) — read-set tool + prose pins
- `packages/agentic-workflow/test/provision.cli.test.mjs` (new, red-first),
  `packages/agentic-workflow/test/cli.surface.test.mjs` (extended)
- `scripts/golden-fixture.test.mjs`, `bun scripts/check-skill-context.mjs`,
  `node scripts/run-root-suite.mjs` (gates)

## Known pre-existing issues

- The stale `origin/feat/69-efficient-context-targeting` branch carries a
  diverged (no-merge-base) history — does-not-affect (never merged; left
  untouched by decision).
- `bun test` reports two pre-existing environment reds recorded by session
  #443/#284 (node-binary absent legs) — does-not-affect (bun-first invocations
  only).

## Acceptance criteria

One observable, testable criterion per `S#`, each naming the check that proves it.

- **AC-S1** — The unit is applied through the owner's local workflow: the
  planning ledgers were frozen at cut (this document, `planning-evidence.md`,
  `planning-obligations.md`), no repo review/fold machinery ran on the change,
  and the work lands as work-unit conventional commits with the RED commits
  observed failing. Check: `git log --oneline origin/main..HEAD` shows the
  unit's conventional commits and
  `ls docs/features/80-efficient-context-targeting/` lists `planning-evidence.md`
  and `planning-obligations.md`.
- **AC-S2** — The park state is machine-declared twice: roadmap row 80 carries
  the 2026-11-10 annotation written by `roadmap annotate`, and #269 is natively
  blocked-by #434; the scope comment with the complete missing-scope list is on
  the issue. Check: `rg -c 'blocked-by #434' docs/ROADMAP.md` ≥ 1 and
  `gh issue view 269 --json body` still carries the triage-update dependency
  section (delivered 2026-11-10 in PR #506; re-checked at close).
- **AC-S3** — The six remaining items of issue #269 are delivered:
  (1) `execute-phase` reads a phase's `Relevant files:` targets (resolved by
  `bun scripts/relevant-files.mjs <unit-doc> --phase P<k>`) plus the step's
  one-hop references instead of surveying the repo, and forward-propagates
  files a phase discovers into later phases' sub-sections at phase close;
  (2) `review-change` consumes the unit's lists as its read set around the diff,
  git still owning scope; (3) `triage-issue` verification starts from the
  affected-file set (the finding's `file:line` citations plus the unit's lists);
  (4) the never-authority discipline is mechanically enforced by
  `scripts/relevant-files.mjs` — a changed file that is neither listed in any
  phase's `Relevant files:` nor logged in the unit doc's Progress/Log exits 1
  naming the file (an unlisted file is never out of scope, only unlogged);
  (5) `bun packages/agentic-workflow/bin/agentic-workflow.mjs provision rg`
  refuses root/sudo, skips when `rg` is present, asks first (and refuses
  unattended without `--yes`), records consent, installs via user-scoped
  managers only (brew, cargo, npm/bun user prefix, pipx, scoop — never sudo),
  and downloads the pinned 15.2.0 binary to `~/.local/bin` when writable and on
  `$PATH`, else `.agentic-workflow/bin/` plus the gitignore entry; (6) the
  measured files-read delta for one plan→execute→review cycle with vs without
  the sub-section is recorded as an Evidence row in this document. Check: the
  obligations ledger's rows O1–O13 all `verified` with their validators run in
  the foreground, plus `bun scripts/check-skill-context.mjs` exits 0 and
  `node scripts/run-root-suite.mjs` exits 0.

## Tasks

- P1 — Freeze the planning ledgers: this SPEC with verbatim S1–S3, `planning-evidence.md`, `planning-obligations.md`, and register the triage block (validator: `bun scripts/phase-lint.mjs docs/features/80-efficient-context-targeting/SPEC.md` prints `verdict PASS`)
  (Implements: S1)
  - Relevant files: docs/fix/_TEMPLATE/SPEC.md, docs/fix/443-doc-index-auto-hybrid/SPEC.md
- P2 — RED commit: `scripts/relevant-files.test.mjs` (read-set tool contract, prose pins for the three skills, never-authority discipline cases) observed failing on the missing module (validator: `bun test scripts/relevant-files.test.mjs` exits 1 with ERR_MODULE_NOT_FOUND)
  (Implements: S3)
  - Relevant files: scripts/unit-doc-phases.mjs, scripts/phase-lint.mjs
- P3 — Implement `scripts/relevant-files.mjs` (parse via `unit-doc-phases`, `--phase P<k>` read-set mode, discipline check over `--changed`/git diff) and land the consumption prose: execute-phase read-set + forward-propagation + turn-contract box, review-change read-set rule, triage-issue affected-set start (validator: `bun test scripts/relevant-files.test.mjs` exits 0)
  (Implements: S3)
  - Relevant files: skills/execute-phase/SKILL.md, skills/review-change/SKILL.md, skills/triage-issue/SKILL.md
- P4 — RED commit: `packages/agentic-workflow/test/provision.cli.test.mjs` + the extended CLI-surface expectation (usage token `provision`) observed failing (validator: `cd packages/agentic-workflow && bun test test/provision.cli.test.mjs test/cli.surface.test.mjs` exits 1 on the red commit)
  (Implements: S3)
  - Relevant files: packages/agentic-workflow/test/cli.surface.test.mjs
- P5 — Implement `agentic-workflow provision rg`: `src/provision/rg.mjs` behind the `provision-rg@1` receipt (root refusal, already-installed skip, ask-first consent + recorded consent ledger, user-scoped managers in the issue's order, pinned 15.2.0 binary download with digest verification, `~/.local/bin` else `.agentic-workflow/bin/` + gitignore entry) plus bin wiring and the crate README usage/Commands rows (validator: `cd packages/agentic-workflow && bun test test/provision.cli.test.mjs test/cli.surface.test.mjs` exits 0)
  (Implements: S3)
  - Relevant files: packages/agentic-workflow/bin/agentic-workflow.mjs
- P6 — Shipping gates: `.changeset/` intent for the two touched packages, `.gitignore` gains `.agentic-workflow/bin/`, `skill-lint` over the three touched skills, context budgets and golden-fixture smoke green (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S3)
  - Relevant files: skills/execute-phase/SKILL.md, skills/review-change/SKILL.md, skills/triage-issue/SKILL.md
- P7 — Close-out: measured delta evidence row computed on the golden fixture, roadmap row 80 settled via the crate's writer with the PR link, PR title/body rewritten to the implementation PR closing #269, and the document verifier's receipt green with every obligation closed (validator: `bun scripts/roadmap-settle.mjs` exits 0 and `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/features/80-efficient-context-targeting/SPEC.md` exits 0)
  (Implements: S1, S2)
  - Relevant files: docs/ROADMAP.md, scripts/fixtures/spec-by-reference/golden-fixture/SPEC.md

### Planning evidence

Embedded in `planning-evidence.md` beside this document (M-size unit): one row
per Engineering claim, `freshness` per the LEDGERS vocabulary.

### Obligations

Embedded in `planning-obligations.md` beside this document: one row per
normative behaviour and required failure state, every row `planned` at cut and
`verified` before handoff.

## Triaged steps

> Paste the `## Triaged steps` block from `bun scripts/unit-route.mjs --triage
> <slug>` here verbatim. This block is the machine's authoritative step list;
> the lane never re-derives or reorders it.

```text
TRIAGE — 80-efficient-context-targeting (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
```

(The `relay:` advisory lines are omitted as inert: the owner's local workflow
forbids Relay on the repo's own surgery (S1), so no packet is created.)

## Findings

OPEN rows only; appended by `review-change` and `triage-issue`.

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|
| (none — findings-only surface, no review machinery ran per S1) | | | | | | |

## Log

- **L1** — 2026-11-09, the issue, verbatim:

  ```
  ## Summary

  Two quick wins of the system-one/JEV evaluation's **Idea 2**, deliberately
  **without** JEV or embeddings (owner decision 2026-09-29: adopt everything
  relevant that does not need JEV; `Relevant files` is **urgent**):

  - **P1 — ripgrep-first search.** `rg` becomes the default tool whenever we
    mean "grep" (agent turns, skill wording, script guidance), under an explicit
    **gitignore contract**, plus a user-scoped ask-first bootstrap installer.
    Owner decision: adopt ripgrep and include it in the tool-installation
    surface.
  - **P2 — per-phase `Relevant files`.** The unit doc's `Tasks` section gains a
    `Relevant files:` sub-section per phase, written at plan time, consumed by
    `execute-phase`/`review-change`, and propagated forward when a phase
    discovers new relevant files — so plan → execute → review never re-reads the
    whole project.

  One feature, two phases, one goal: **target the context, not the repo.**

  ## Why now (evidence)

  - **Real incident:** an agent edited skills inside `node_modules`-installed
    copies because searches did not ignore gitignore rules. ripgrep's default
    traversal closes this class of error.
  - **Measured on this repo (5 runs each):** scoped searches at parity (grep
    132 ms / 95 ms vs rg 161 ms / 113 ms); broad sweep **grep 379 ms vs rg
    109 ms (3.5× faster)** — the gap grows with repo size (`webs` ≈ 29 MB of
    apps, `pi-web` ≈ 9 MB of src).
  - **Verified ripgrep 15.2 behavior (this repo + a `git init` fixture):**
    traversal respects `.gitignore`; **explicit path arguments bypass it** (a
    gitignored bundle dir and a gitignored `docs/` were both searched when named
    on the command line). This is exactly the required contract with zero custom
    logic:
    - default/traversal → ignore rules honored (never silently search
      `node_modules`/`dist`/gitignored bundles);
    - human-named path → always searched, **including directories the user
      chose to gitignore** (e.g. local `docs/`);
    - `--no-ignore` / `-u` → only when the human **explicitly** asks to see
      ignored content (inside and outside the gitignore simultaneously).
  - `#194` records that `review-change` is the highest recurring token
    consumer; per-phase file lists cut re-reads at the source.

  ## P1 — ripgrep-first search contract

  - **Default:** `rg` wherever we mean "grep". Detection via `command -v rg`;
    **declared fallback to `grep` when absent** (portability: the skills install
    into 70+ agents and rg is not POSIX — same resolve pattern as
    `bun-else-node`).
  - **Ignore contract:** traversal respects `.gitignore`; explicit path args are
    the supported way to include user-ignored dirs; `--no-ignore` only on an
    explicit human request, worded as such in the skills.
  - **Contract-grade exhaustive sweeps** (CI, normative checks, receipts):
    declared rule — `rg --no-ignore` (or `grep`) so gitignored build output
    cannot hide matches (verified: default rg missed `dist/index.d.ts`, 11 vs 12
    hits). Scripts that **parse** output keep their current tool for byte-stable
    receipts.
  - **Adoption surface:** the ~10 skill/reference files that say `grep` get
    rg-first wording + fallback + override rule; script guidance updated;
    `bump-skill` + CHANGELOG per skill touched.
  - **Bootstrap installer (ask-first, never root):**
    1. skip entirely if `rg` is already installed;
    2. otherwise explain the reason and ask before installing (existing
       ask-first contract);
    3. user-scoped package managers only — brew, `cargo install`, bun/npm
       global user prefix, pipx, scoop — **no sudo/root, ever**;
    4. else download a pinned binary to `~/.local/bin` if writable and on
       `$PATH`;
    5. else `.agentic-workflow/bin/` plus a gitignore entry added by the
       `init-workspace` template (default-ignored).
  - **Future (non-goal here):** a wizard `init`/`setup` command in the runner
    crate / AWL that runs this bootstrap with the other tools — shared
    provisioning module with #219.

  ## P2 — per-phase `Relevant files`

  - Unit-doc `Tasks` P1..Pn gains a `Relevant files:` sub-section. **Format
    owner: `phase-contract`** (the change goes through it, per the ownership
    rule).
  - The plan step writes it from the planner's own discovery; `execute-phase`
    reads those files (+ one-hop step references) instead of surveying the repo.
  - **Forward-propagation rule:** when a phase discovers files relevant to later
    phases, it appends them to those phases' sub-sections at phase close.
  - Findings carry their affected files (aligns with #218 evidence-bound
    `file:line` rows); `triage-issue`/`replan` start from the affected set, not
    from scratch.
  - `review-change` uses the unit's lists as its read set **around** the diff;
    git still owns the review scope.
  - **Never-authority (copy of #192's discipline):** a file not listed is never
    "out of scope" — executors may always add a file, logging it in the Progress
    log. A mechanically-enforced discipline test rides along.

  ## Out of scope

  - JEV / system-one decisions (parked by owner; see the evaluation record).
  - Embeddings and the retrieval index → #192 (this feature must ship and
    deliver measurable savings **before** it).
  - Graph layer (co-change / link / LSP-reference graphs) → #192 amplification.
  - The install wizard command itself (future runner/AWL work).
  - Model routing / tier selection → #201.

  ## Dependencies

  - `phase-contract` (unit-doc format owner) — hard for P2.
  - Feature 61 runner crate (home of the bootstrap script) — hard for P1's
    installer.
  - #219 (shared ask-first provisioning pattern), #218 (evidence-bound
    findings), #192 (later retrieval wiring) — soft/cross-links.

  ## Acceptance criteria (draft)

  - [ ] P1 fixture: traversal skips a gitignored dir; the same dir named
        explicitly returns hits; `--no-ignore` appears only in the documented
        human-request path.
  - [ ] With `rg` absent from `PATH`, the same instruction block completes via
        `grep` and declares the fallback.
  - [ ] Installer: refuses root/sudo, skips when rg is present, asks first and
        records consent, and lands in `.agentic-workflow/bin` + gitignore when
        `~/.local/bin` is unavailable.
  - [ ] `bun scripts/check-skill-context.mjs` green; `bump-skill` run for every
        skill touched; CHANGELOG rows added.
  - [ ] P2: phase-lint accepts the sub-section; a fixture shows execute reading
        only listed files; editing a non-listed file remains allowed and logged;
        review consumes the lists.
  - [ ] Measured delta recorded as Evidence: files-read / tokens for one
        plan→execute→review cycle with vs without the sub-section (same bar as
        #192's savings AC).

  ## Dependencies — triage update 2026-11-07
  - **Related (soft) — #434, after it**: the per-phase `Relevant files:` lines
    (this issue's remaining P2) are authored by the fused design/plan and
    consumed by the executor — author and consumer land in that order.
  - **P1 status note**: rg-first is delivered (guide convention + fix/329 drift
    gate) — deprecation comment 2026-11-07.
  ```

- **D1** — 2026-11-10, owner decision (recorded via PR #506): the row-80
  re-open-as-`feat/80` instruction is withdrawn; #269 parks until #434; the
  missing scope is annotated once, machine-declared twice.
- **D2** — 2026-11-10, owner decision: wait for #434 → it merged; S3 authorizes
  implementation on `feat/269-efficient-context-targeting`.
- **D3** — 2026-11-10, planning decision (this unit): the never-authority
  discipline is enforced by a new repo script `scripts/relevant-files.mjs`
  (`--changed`/git-diff cross-check against the union of the unit doc's
  `Relevant files:` lists + Progress/Log citations) because the discipline is
  the one item of the six that a byte-level harness can hold; the
  forward-propagation *rule itself* stays prose owned by `skill contract`
  surfaces (an executor judgment call by definition), with the tool's
  cross-check as the backstop.
- **D4** — 2026-11-10, planning decision (this unit): the installer is a
  read-side runner-crate command (`agentic-workflow provision rg`) with a
  consent ledger at `<root>/.agentic-workflow/provision-log.jsonl`; the wizard
  command of the issue's Future section may consume the same module later.
- **D5** — 2026-11-10, planning decision (this unit): the `rg` provenance pin is
  15.2.0 (the release the issue verified); five pinned digests (linux-musl
  x86_64, linux-gnu aarch64, darwin arm64/x64, windows-msvc x86_64) are embedded;
  unsupported platforms refuse with a manual hint instead of downloading
  unpinned bytes.
- **D7** — 2026-11-10, execution disclosure (this unit): the installer's
  implementation bytes landed inside the shipping commit `b9721a59` (an
  `git add -A` overreach), not in a dedicated P5 commit — the red-first
  ordering still holds chronologically (`3afbd4ce` is the observed-red suite
  commit, the implementation follows), no test was edited to pass (the two
  fixture-corrections replaced a malformed fixture construction with a real
  gzip/ustar container and fixed an `args`-record shape — assertions
  unchanged), and the disclosure is recorded here rather than rewritten.
- **D8** — 2026-11-10, unit-dir keying (this unit): the parallel correction
  unit `docs/fix/269-external-verify-findings/` (folded in the 2026-11-10
  pull, PR #506's external-verify batch) owns the `[#269]` fix-index key, so
  this feature unit re-keys to its roadmap row —
  `docs/features/80-efficient-context-targeting/`; the row's accumulated
  description cell is preserved byte-for-byte via the SPEC's
  `roadmap_summary` (the #507 emitter now renders that cell from the unit
  doc).
- **D6** — 2026-11-10, planning decision (this unit): the declared unit-doc
  grammar keeps the nested `- Relevant files:` **dash marker** (owner:
  `phase-contract`/`unit-doc-phases.mjs`); the parser only attaches lines
  carrying it, so this unit doc's Tasks lines and the two SPEC templates'
  example line adopt the marker. The dashless occurrences already in the tree
  (the golden-fixture SPEC among them) are pre-existing and left untouched —
  their lists are inert bullet text today and stay so; changing the parser to
  accept the markerless form would widen what phase-lint reports and was not
  asked for.

- **E1** — 2026-11-10, `bun test scripts/relevant-files.test.mjs` (RED commit 1638189e) · exit 1 · 0 pass / 10 fail on the missing module — the §2-style red corpus for the tool and prose contracts.
- **E2** — 2026-11-10, `bun test scripts/relevant-files.test.mjs` (after `c9e0bd3e`) · exit 0 · 10 pass / 0 fail.
- **E3** — 2026-11-10, `bun test scripts/relevant-files.test.mjs scripts/structural-sibling-pins.test.mjs` (after `3c4ec0f4`) · exit 0 · 18 pass / 0 fail.
- **E4** — 2026-11-10, `bun test scripts/phase-lint.test.mjs` · exit 0 · 162 tests, the O7 grammar regression clean.
- **E5** — 2026-11-10, `cd packages/agentic-workflow && bun test test/provision.cli.test.mjs test/cli.surface.test.mjs` (RED commit 3afbd4ce) · exit 1 · 2–10 fail on the missing module; after the implementation · exit 0 · 13 pass / 0 fail + surface green.
- **E6** — 2026-11-10, `bun scripts/check-skill-context.mjs` and `--routes` · exit 0 each — the O13 budget half.
- **E7** — 2026-11-10, O12's read-set delta (declared approximation: the read set of this unit's own plan→execute→review cycle, not an end-to-end token audit) — with the sub-section, the union of the lists resolves to **11 files / 386,111 bytes** (`bun scripts/relevant-files.mjs docs/features/80-efficient-context-targeting/SPEC.md --phase all | sort -u | xargs du -cb`); the without-sub-section alternative — the machinery survey a reviewer would otherwise make over `skills/ scripts/ packages/agentic-workflow/{src,test} packages/pi-agentic-workflow/src docs/fix docs/workflow` — is **930 files / 11,388,482 bytes** (`rg --files … | xargs du -cb`). Read-set surface: ~29.5× fewer files, ~29.5× fewer bytes on the same cycle.
- **E8** — 2026-11-10, `node packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/features/80-efficient-context-targeting/SPEC.md` — pre-close state: only the `obligations-open` rows this close-out then flips; closes green at G6.
- **P1** — 2026-11-10 17:4x, ledgers frozen (SPEC + planning-evidence + planning-obligations; phase-lint PASS) → `41e72230`.
- **P2** — 2026-11-10, RED suite committed (10 fail / 0 pass observed) → `1638189e`.
- **P3** — 2026-11-10, read-set tool + the three skills' consumption prose + budgets re-basis + template dash-grammar alignment → `c9e0bd3e`; differential repair → `a0407904`.
- **P4** — 2026-11-10, RED provision/surface suite committed (observed failing) → `3afbd4ce`.
- **P5** — 2026-11-10, `agentic-workflow provision rg` implemented (module + bin + README + companion projection token) → landed inside `b9721a59` (D7 disclosure).
- **P6** — 2026-11-10, shipping gates (changeset, gitignore, route re-bases, unit-dir re-key to row 80) → `b9721a59`; sibling-pin refactor → `3c4ec0f4`.
- **P7** — 2026-11-10, close-out: obligations flipped on the foreground validators above, this log block, roadmap settle + PR rewrite, journal fragment → this commit.

## Next

Owner verdict on the diff (the external verifier): the diff summary, the
obligations ledger (13 rows × status), the verification block, the docs state
and the disclosed items are in the closing hand-off. After the verdict: settle
and merge PR #506 (`Closes #269`); the RH delta review of the parallel
correction unit's receipt runs next if the owner orders it.

## References

- Issue [#269](https://github.com/gtrabanco/agentic-workflow/issues/269) · roadmap row 80 (annotated 2026-11-10)
- Park PR: [#506](https://github.com/gtrabanco/agentic-workflow/pull/506) (carries the park commit + this implementation)
- Author of the consumed lines: feature [#434](https://github.com/gtrabanco/agentic-workflow/issues/434) (PR #511)
- Grammar owners: `skills/phase-contract/SKILL.md` (sub-section + never-authority), `skills/unit-lane/references/PLAN.md` (plan-time write)
- Parallel unit: `docs/fix/269-external-verify-findings/` (PR #506's external-verify correction batch — same branch, separate unit doc)

## Branch

`feat/269-efficient-context-targeting`

## Depends on

- `#434` — merged (PR #511). Pre-requisite half: the `Relevant files:` grammar
  (`#272`/`#276`) — merged.

## Regression scope

- The eight phase-lint rules and the two grammars' parsing must not change in
  outcome for existing docs: `bun test scripts/phase-lint.test.mjs` exits 0.
- The unit-doc writer ops and the crate CLI's existing subcommands must not
  change behavior: `bun test packages/agentic-workflow/test/edit.test.mjs
  packages/agentic-workflow/test/cli.surface.test.mjs` exits 0.
- The executor/review/triage flows keep every existing turn-contract box: the
  golden-fixture smoke and context budgets stay green.
