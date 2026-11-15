---
type: feature
scope: medium
ac-hash: 87944e7000e5f0ea37917a2a01ae128cd700e39d7565a7a4e32c65166c7f3c49
roadmap_summary: Feature row 471 delivered through the fix lane at the owner apply request: a distributable composite action (`gtrabanco/agentic-workflow/journal@<tag>`) turns a headless run's declaration into one journal fragment through the crate's own writer — provenance in the fragment grammar's fields (session `gha-<run id>`, heading label), idempotent per run, no model and no token in the write path; the shipped aggregator stays the only writer of the journal file.
---

# fix/471-journal-github-action

> Feature row 471, delivered through the fix lane at the owner's apply request.
> A distributable GitHub Action for **headless** agent runs: a CI-driven session
> lands a PR and the journal stays silent, because `log-session` only covers
> interactive sessions with a live operator. The action carries the run's
> declaration into the crate's own deterministic fragment writer — the
> `journal-fragment-grammar@1` producer #405 shipped — so the next session keeps
> its trace. Applied through the owner's local unpublished workflow (§5 ledger
> freeze substitutes for the lane's plan step); no repository review or fold
> machinery runs on this change.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

[#471](https://github.com/gtrabanco/agentic-workflow/issues/471) — "NEW FEATURE:
journal as a distributable GitHub Action — headless-run journal fragments (lands
LAST; blocked-by #307, after all open features)". The PR closes it via
`Closes #471` in the body. Its single native `blocked-by` (#307) is CLOSED, so
the hard prerequisite the owner recorded at proposal time is satisfied.

## Specs

Requirements numbered `S#`, quoting the requester verbatim. `S1`–`S12` are the
owner's apply order (the governing request); `S13`–`S20` are issue #471's own
requirement bullets, which `S1` delegates to.

**S1 — Apply the issue.**
> Apply to this repository: issue #471

**S2 — Local, unpublished workflow.**
> This is a **local, unpublished** workflow for changing agentic-workflow itself. The failure it prevents: the workflow judging its own surgery (unit fix-258 burned 12 review→fold cycles that way). Follow this order, every step:

**S3 — Resolve intent from state.**
> Print the resolution **before** any action — the state decides the sequence, the words only pick the verb … Never guess.

**S4 — Verbatim intents.**
> Number the request as `S1..Sn`, quoting my words **verbatim** — exact strings, error messages, examples. Never summarize, never add a requirement I did not ask for, mark assumptions as assumptions. Every later decision cites its `S#`.

**S5 — Frozen-failure corpus first.**
> If this change repairs known failures, extract each one's reproducer from git history / the findings ledger **as a failing check before implementing** — they are the test corpus; the change is done when every reproducer passes. Nothing else is padded in.

**S6 — Fixtures before the real tree.**
> Any new mechanic (grammar, lint, script, template) is validated on a throwaway copy first: the golden fixture, fixture unit docs, or a toy repo under `mktemp -d /tmp/…`. Scratch lives outside the worktree and is removed after. Only when fixtures pass do the real files change.

**S7 — Work inline; deterministic gates only.**
> No `review-change`, no `audit-pr`, no fold cycle, no self-granted gate exceptions on this change. Direct application: the §5 ledger freeze **is** the plan; implement against it, hand the diff to me. The one exception is the repo's deterministic gates (tests, lints) — run those always.
>
> **Live-tree guard**: code introduced by this change (commands, hooks, emitters, scripts with side effects) is never executed against the live repository or a shared worktree until verified — mutating paths run only in scratch (§3). An accidental side effect is disclosed, cleaned, and reported in the handoff — never hidden, never doubled.

**S8 — Freeze the planning ledgers.**
> This command substitutes for the lane's plan step, so it writes the planning ledgers in the repo's own shapes … A change applied without them is a legacy unit with no ledgers, and the repo's reviews and audits refuse it until they are constructed — so cut them here, never retrofit them later

**S9 — Implement test-first, differential, in slices.**
> - One RED test per requested rule; for every existing command sharing changed code, one test proving its previous behavior still holds; nothing else.
> - **Differential check**: run each touched command against a copy of the base commit (in `mktemp -d`, never committed) and against the change; any stdout/stderr/exit difference nobody asked for is a regression — fix and pin it.
> - **Model memory is never a source**: any claim of the shape "tool/flag/syntax/API v behaves like X" carried from training is `inferred` at best — verify against the version the project pins (lockfile, manifest, action SHAs, current docs of that version) before it guides code. One fetch; record the source in the affected PE row.

**S10 — Documentation and state ship in the change.**
> Ship the docs **in the same change** — never deferred … Repository indexes: roadmap row, fix-index row — updated via the deterministic emitters/CLI where one exists, never hand-edited prose; a hand edit is a defect — report it instead.

**S11 — Verify like a writer, hand off like one.**
> Close the obligations ledger first: every row flips to `verified` only with its validator actually run in the foreground and the evidence recorded where its `required-evidence` cell says … I am the external verifier. Do not self-approve, do not claim done before my verdict.

**S12 — Correction bounds.**
> After my review: one correction batch fixing every reported blocker → one recheck limited to those blockers … **A new finding never earns another cycle** — it goes to me, and the turn ends.

**S13 — A distributable action for headless runs.**
> A **distributable GitHub Action** (`uses: …journal@vX`) that appends a journal fragment to `docs/LOGS.md` from **headless agent runs** — CI-driven sessions (agent actions landing PRs, scheduled drivers, gh-aw-style compiled workflows) that today produce no journal entry because `log-session` only covers interactive sessions with a live operator.

**S14 — The declaration is the input.**
> **Input**: the headless run's declaration (unit/issue number, what was done, files touched, next step) provided by the driver as a step input or a machine fragment file validated against the grammar.

**S15 — Deterministic append, one merge discipline.**
> **Write path**: deterministic append of the fragment to `docs/LOGS.md` via the same merge discipline as `docs/generated/**` (append-only fragment merge; the existing `docs-generated-merge.mjs` pattern), with the gate's `docs-generated` projection check unaffected.

**S16 — Least privilege.**
> **Permissions**: least-privilege token (contents:write only); the action never comments, labels, or triages — it writes the journal fragment and nothing else.

**S17 — Provenance in the grammar's fields.**
> **Provenance**: fragment carries the run context (workflow, run id, actor) per the grammar's fields, so a CI-written entry is distinguishable from an operator-written one.

**S18 — Opt-in, consent-gated.**
> **Config**: enabled per-project through the unified config home (#427), opt-in at init-workspace like every install surface (consent rule).

**S19 — Complementary to `log-session`, never a replacement.**
> **Not a replacement for `log-session`** — an Action cannot capture the interactive session's context, decisions or open questions. Complementary: same file, two writers, one grammar.

**S20 — No model, no second product.**
> - No model in the write path — the fragment is validated grammar, not generated prose.
> - No interactive-session capture (that stays `log-session`'s job).
> - No triage action of our own (see the analysis note above).

## Impact

What this change touches beyond its own lines, cut at plan time:

- **New: `journal/action.yml` + `journal/headless.mjs`.** The repository's first
  GitHub Action. `journal/` is the path the `uses:` form names
  (`gtrabanco/agentic-workflow/journal@<tag>`), so the directory enters the repo
  root layout; nothing in the tree enumerates root directories for a verdict
  (`rg -l 'readdirSync\(.*ROOT' scripts/*.test.mjs` → only
  `pre-execution-quality.test.mjs:607`, scoped to `*.md`).
- **New: `packages/agentic-workflow/src/journal/headless.mjs`**, reached through
  a new `journal headless` operation in `bin/agentic-workflow.mjs`. The router
  branch is additive: the existing `journal aggregate|write|name` branches keep
  their arguments and exit codes (differential below).
- **`packages/agentic-workflow/README.md`** — one command row plus the
  `journal-headless-grammar@1` block that publishes the declaration → fragment
  mapping. The two existing journal blocks (`journal-fragment-grammar@1`,
  `journal-write-grammar@1`) are untouched, so the writers cannot disagree.
- **`template/.agentic-workflow/journal.md`** — the carrier document every
  opted-in project receives gains the headless writer row in its writer table and
  a "Headless runs" section. This is the consent surface `init-workspace` points
  at; the scaffold still ships no carrier directory and no active workflow, which
  `journal.surfaces.test.mjs` (AC7/AC9) keeps pinning unchanged.
- **`skills/init-workspace/SKILL.md`** — the issue #405 consent bullet gains one
  clause naming the headless writer. The three sentences its suite pins stay
  verbatim, so no existing assertion changes.
- **`AGENTS.md`** — one `normative-surfaces@1` row for the new grammar, and the
  `machineLines` exact re-pin in `docs/workflow/SKILL_CONTEXT_BUDGETS.json`
  (+1 line, with its recorded source).
- **`docs/workflow/GATE_INVENTORY.md`** — the new surface id joins the two rows
  that already claim the journal grammars, so the drift gate's "an id no row
  claims" check stays satisfied.
- **`docs/CAPABILITIES.md`** — the audit-log capability row names the action as
  the headless producer beside `log-session`.
- **Consumers:** the calling workflow's job (it must check out the repo first and
  declare `permissions: contents: write` to push the fragment); the aggregator
  that already consumes `.agentic-workflow/journal/`; the `journal-carrier-check`
  gate step, which now also sees CI-written fragments.
- **Mentions that stop being true:** the carrier document's writer/aggregator
  table ("the total set of journal writers") and the crate README's journal
  command list, both of which gain the headless writer rather than being
  rewritten around it.
- **What to ask before touching something live:** the action runs inside other
  projects' CI. Its inputs, outputs and `uses:` shape are a published surface from
  the first tag; this unit keeps them minimal and documents the pin.

## Retirements

**Strictly additive — nothing is retired, and the reason is a rule rather than an
omission.**

- The headless writer enters beside `journal write`; it never replaces it. A
  project that wants its own headless producer keeps calling `journal write`
  directly, and the new operation is a thin, declared composition of it
  (`writeJournal` keeps the name, the bytes and the collision rule).
- No configuration key is added and none is removed: the carrier directory's
  presence remains the only opt-in signal (#405 D4), so `S18`'s "enabled
  per-project" cannot retire or duplicate that signal.
- No fragment field, kind or grammar value changes: `S17` is satisfied inside the
  existing `journal-fragment-grammar@1` fields, so no consumer has to migrate.

## Non-goals

- **No direct writer of `docs/LOGS.md`.** The action writes the fragment; the
  aggregation step (already shipped, and what this repository runs weekly) is the
  only writer of the journal file. A CI writer appending to `docs/LOGS.md`
  directly contradicts #405's AC1 and fails the push-level `log-immutability`
  gate (#468) — see D1.
- **No model in the write path** (`S20`): the block is rendered by
  `renderEntryBlock` from declared fields; no pass spawns a model.
- **No new fragment kind, session vocabulary or metadata line.** `mechanical` and
  `narrative` stay the closed set; adding a third kind or a metadata field to the
  block would move `journal-write-grammar@1` and every byte-parity contract for a
  provenance string the grammar already carries.
- **No triage action, no PR comment, no label, no check run** (`S16`): the
  action's only effect is one file under the carrier.
- **No second config surface** (`S18`): no `journal.headless` key.
- **Not an interactive-session feature** (`S19`): `log-session` and the pi
  extension are untouched.
- **No retroactive migration** of past CI runs into journal entries.

## Risk tier

Computed, never chosen —
`node packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify --paths <this unit's declared path set>`
at the cut:

```text
risk-tier-verdict@1
tier: standard
reason_kind: executable-content
reason: 1 path(s) carry executable content: packages/agentic-workflow/src/journal/headless.mjs
signals: (none — not a high-tier unit)
```

- **Tier** — `standard` · **Task Size** — `{ "understood": true,
  "contained_risk": "contained", "resumable_from_diff": true,
  "ceremony": "unit-doc", "verification": "gates" }`
- **Named high-risk item** — none; the verdict names no `destructive`, `publish`
  or `security` surface. The ceremony's `unit-doc` obligation is this document;
  the review pass `standard` does not add is replaced by the owner's external
  verification (S7/S11), which is why the `## Log` carries the evidence instead of
  a `REVIEW-RAN` mark.

## Future

- **A reusable *workflow* (not only a composite action)** so a caller can do
  `jobs: journal: uses: gtrabanco/agentic-workflow/.github/workflows/journal.yml@<tag>`
  with a job-level `permissions:` block of its own. Deferred: a reusable workflow
  must declare its own `workflow_call` inputs, and two published surfaces before
  the first one has a user is the second-grammar mistake. `status: open`.
- **A `journal headless --kind mechanical` mode** for a headless run that only has
  `log-facts@1` (no prose). Deferred: the mechanical entry is `autoLogSession`'s
  output and a headless run has no session to shut down. `status: open`.

## Future cost

- **Every headless producer now has one door.** A future action, hook or driver
  writes through `journal headless` (or `journal write`) and never composes a
  name; binds: whoever adds a headless writer.
- **The action's inputs/outputs are a published surface from its first tag.** A
  renamed input is a breaking change to every caller's YAML; binds: whoever
  evolves `journal/action.yml`, and the changeset records the intent.
- **The crate version the action installs is derived from its own ref.** A
  caller pinning `@main` gets an unpublished version in the window between a
  release commit and its publish; binds: the action's documentation (pin a tag)
  and the release workflow, which publishes right after the cut.

## Applicable tests

| Suite | Covers |
|---|---|
| `packages/agentic-workflow/test/journal.headless.test.mjs` (new) | the declaration (`S14`), provenance (`S17`), the fragment write and its name, the `--files` override, the absent-carrier refusal (`S18`), idempotent re-run, the block-on-stdin path, the CLI exit contract, the action's static contract (`S16`, no token/API), the adapter's env mapping and its `AGENTIC_WORKFLOW_RUNNER` override |
| `packages/agentic-workflow/test/journal.test.mjs` | the aggregator, naming and collision cases must stay green (non-regression) |
| `packages/agentic-workflow/test/journal.write.test.mjs` | `journal write`/`--check` unchanged (non-regression) |
| `packages/agentic-workflow/test/journal.surfaces.test.mjs` | the template/consent absences and the one-grammar-owner rule (non-regression) |
| `scripts/normative-drift.test.mjs` | the new `normative-surfaces@1` row resolves to its block |
| `scripts/prose-gate-inventory.test.mjs` | the new surface id is claimed by a gate row |
| `scripts/check-skill-context.test.mjs` | the guide's `machineLines` exact pin |
| `scripts/docs-generate.test.mjs` | the projection is generated, never hand-written |
| `node scripts/run-root-suite.mjs` | no existing suite regressed |

## Known pre-existing issues

- **`journal aggregate` closes over the repository's own carrier.** Running it
  here consumes committed fragments; the live-tree guard (`S7`) keeps every
  mutating run in a `mktemp -d` copy. *Affects* this unit's verification only:
  the aggregation case runs on a fixture, never on this worktree.
- **The shipped workflow example pins older action majors** than the two active
  workflows (`actions/checkout@v4` / `setup-node@v4` in
  `template/.github/workflows/agentic-workflow-journal.yml.example` vs `@v7.0.0`
  / `@v6.4.0` in `.github/workflows/`). *Does not affect* this unit: the new
  action declares no `uses:` of its own and the example is not changed here.
- **Two pre-existing suites are load-sensitive on this 6-CPU sandbox**:
  `scripts/phase-lint.test.mjs` legitimately costs 40–120 s and
  `scripts/unit-route.test.mjs` (60 CLI spawns) can cross the 10 s per-test
  budget. Both files are byte-identical to the base commit. Reds were observed
  only while this session ran another heavy command beside the suite (the first
  `--jobs 4` run: `phase-lint` 95 s → timeout, `unit-route` budget); with the
  box free, the same suites pass at the gate's default four workers
  (`phase-lint` 39.7 s, root suite 113/113) and at `--jobs 2` (113/113). *Affects*
  this unit's verification only: the reds are named as this environment's
  concurrent load, never as this change's.
- **`tmp-gc` can race the suites it no longer waits for**: the sweep lists `/tmp`
  candidates and removes them, while the root suite's fixtures create and clean
  `/tmp/<prefix>-*` directories in the same run; one gate run red-ed with
  `GC-ERROR /tmp/wording-manifest-… ENOENT` (the candidate vanished between the
  listing and the `lstat`) and the next passed. *Does not affect* this change:
  the candidates it named are other suites' fixtures and the sweep's own
  contract is unchanged.

## Tasks

- P1 — Cut this unit doc, its two planning ledgers and its decisions ledger; register the `## Fixes` row (validator: `node packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/fix/471-journal-github-action/SPEC.md` prints `verdict PASS` and exits 0)
  (Implements: S1, S2, S3, S4, S8, S10)
  - Relevant files: docs/fix/471-journal-github-action/SPEC.md, docs/fix/471-journal-github-action/planning-evidence.md, docs/fix/471-journal-github-action/planning-obligations.md, docs/fix/471-journal-github-action/decisions.md, docs/ROADMAP.md
- P2 — Land the RED corpus: one failing case per requested rule, observed red on the pre-change tree (validator: `bun test packages/agentic-workflow/test/journal.headless.test.mjs` exits non-zero at the red commit, recorded in the `## Log`)
  (Implements: S5, S9, S13, S14, S15, S16, S17, S18, S19)
  - Relevant files: packages/agentic-workflow/test/journal.headless.test.mjs
- P3 — Fixture walk before the real tree: the whole write path exercised on a `mktemp -d` toy repository (carrier, fragment, re-run, refusal), scratch removed after (validator: the fixture transcript recorded as an `E` line and `ls -d /tmp/aw471-*` exits 2 after cleanup)
  (Implements: S6, S7)
  - Relevant files: packages/agentic-workflow/src/journal/headless.mjs
- P4 — Implement the headless writer: declaration validation, provenance composition, block rendering through the one block owner, idempotency per run id, delegation to `writeJournal` (validator: `bun test packages/agentic-workflow/test/journal.headless.test.mjs` exits 0 with the declaration, provenance, idempotency and refusal cases green)
  (Implements: S14, S17, S18, S19, S20)
  - Relevant files: packages/agentic-workflow/src/journal/headless.mjs
- P5 — Wire `journal headless` into the CLI router with its closed flag set and its exit contract (validator: `bun test packages/agentic-workflow/test/journal.headless.test.mjs` exits 0 with the CLI cases green)
  (Implements: S13, S14)
  - Relevant files: packages/agentic-workflow/bin/agentic-workflow.mjs
- P6 — Ship the action: `journal/action.yml` (inputs, outputs, one composite step) and `journal/headless.mjs` (env → argv, runner resolution, `$GITHUB_OUTPUT` receipt, named refusals) (validator: `bun test packages/agentic-workflow/test/journal.headless.test.mjs` exits 0 with the action-contract and adapter cases green)
  (Implements: S13, S16, S17)
  - Relevant files: journal/action.yml, journal/headless.mjs
- P7 — Publish the grammar and declare the surface: the crate README's `journal-headless-grammar@1` block and command row, the `normative-surfaces@1` row, the gate-inventory claims and the `machineLines` re-pin (validator: `bun test scripts/normative-drift.test.mjs` and `bun test scripts/prose-gate-inventory.test.mjs` exit 0, and `bun scripts/check-skill-context.mjs --documents` prints `PASS`)
  (Implements: S9, S10, S17)
  - Relevant files: packages/agentic-workflow/README.md, AGENTS.md, docs/workflow/GATE_INVENTORY.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json
- P8 — The consent and product surfaces: the carrier document's headless section and writer row, the init-workspace clause, the capabilities row (validator: `bun test packages/agentic-workflow/test/journal.surfaces.test.mjs` exits 0 and the anchors in `## Log` match)
  (Implements: S10, S18, S19)
  - Relevant files: template/.agentic-workflow/journal.md, skills/init-workspace/SKILL.md, docs/CAPABILITIES.md
- P9 — Release and index state: the changeset, the feature row's status, the rendered projection and the session journal fragment (validator: `bun scripts/lint-changeset.mjs .changeset/471-journal-github-action.md` exits 0 and `node scripts/docs-generate.mjs --check` prints `PASS`)
  (Implements: S10)
  - Relevant files: .changeset/471-journal-github-action.md, docs/ROADMAP.md, docs/generated/, docs/LOGS.md
- P10 — Close every obligation on a foreground run, run the differential against the base commit, and report the gate state (validator: `bun scripts/local-gate.mjs --skip-network` exits 0 and the differential harness prints `UNDECLARED 0`)
  (Implements: S2, S9, S11, S12)
  - Relevant files: docs/fix/471-journal-github-action/planning-obligations.md

### Planning evidence

M unit: the ledger lives in
[`planning-evidence.md`](planning-evidence.md) (10 rows, `PE-001`–`PE-010`).

### Obligations

M unit: the ledger lives in
[`planning-obligations.md`](planning-obligations.md) (14 rows, `O1`–`O14`).

## Acceptance criteria

One observable, testable criterion per requirement, each naming the check that
proves it. Frozen at the cut; `ac-hash` above is this section's digest.

1. **S1** — the unit lands as one branch off `main` with this document, its two
   ledgers and its decisions ledger frozen before the first line of code; proven
   by `node packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/fix/471-journal-github-action/SPEC.md` → `verdict PASS`.
2. **S3** — the intent resolution precedes the first write, and the resolution's
   four outcomes are the only ones used (`proceed` here, with the state evidence
   in `## Log` L1).
3. **S5/S9** — the corpus is red before the implementation: `bun test
   packages/agentic-workflow/test/journal.headless.test.mjs` exits non-zero at
   the red commit (the operation and the action do not exist) and exits 0 at the
   head; both runs are `E` lines.
4. **S6/S7** — every mutating run of this unit's own code happens in a
   `mktemp -d` copy; the fixture walk is an `E` line and the proofs that no
   scratch survived are in the same line.
5. **S13** — a headless declaration becomes exactly one fragment under the
   carrier: `journal headless --issue 471 --workflow ci --run-id 42 --actor bot
   --summary …` exits 0, the receipt names one path, and that file parses through
   `parseFragmentName` with kind `narrative`.
6. **S14** — the declaration's five cells reach the entry: the block carries the
   issue, the summary, the decisions, the next step and the files (`--files`
   override wins over git facts); input can arrive as fields or as a rendered
   block on stdin.
7. **S15** — the action never writes `docs/LOGS.md`; the fragment it leaves is
   what `journal aggregate` consumes on a fixture, and the path is the carrier
   `.agentic-workflow/journal/` (#405 AC1's rule, #468's push-level gate).
8. **S16** — the action holds no token and reaches no forge: no `gh`, no API URL,
   no `GITHUB_TOKEN`/`GH_TOKEN` read anywhere under `journal/` or in the headless
   module, and the document states the caller's `contents: write`-only job
   permission.
9. **S17** — provenance is carried in the grammar's own fields: the session slug
   is `gha-<run id>` and the heading label names the workflow, the run id and the
   actor, so a CI entry is distinguishable from an operator's at a glance.
10. **S18** — an absent carrier is refused with exit 2 and nothing is created
    (no directory, no journal, no config key), and the init-workspace consent
    clause names the headless writer inside the existing opt-in question.
11. **S19/S20** — no model, no new kind, no `log-session` change: the block is
    `renderEntryBlock`'s bytes from declared fields; the kind set and
    `journal-write-grammar@1` are unchanged; `skills/log-session/SKILL.md` is not
    in this diff.
12. **S9/S11 (non-regression)** — every pre-existing suite still passes and the
    differential against the base commit shows no unrequested difference: the
    harness prints `UNDECLARED 0`.
13. **S10** — the indexes and docs ship in the same change: the changeset lints,
    the roadmap row and the fix row are written by the emitters, the projection
    is rendered by `docs-generate`, and the new grammar resolves in
    `bun test scripts/normative-drift.test.mjs`.

## Triaged steps

```text
triaged-steps@1
step | reason | basis
tests-first | every requirement has a reproducer in one named suite | ACCEPTANCE items 3, 5–11
implementation | one slice per surface: crate writer → CLI → action | ## Tasks P4→P6
differential | every touched command runs against the base commit over one corpus | ACCEPTANCE item 12
docs-and-state | grammar, surfaces, changeset, projection, journal, obligation close | S10, §7
```

The machine's `unit-route --triage` cannot answer for this unit — the lane never
opened it (`unit not found`), which is the substitution the apply order performs:
the block above is this unit's authoritative step list, recorded at the freeze
(D2).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-15, the request, verbatim: "Apply to this repository: issue #471" plus the ten-step local-application protocol frozen as S2–S12; the issue's own requirement bullets are S13–S20. The §0 resolution: `proceed` — `git log main..HEAD` → 0 commits, `HEAD..main` → 0, the single native `blocked-by` (#307) is CLOSED, `docs/fix/471-*` absent, Features row 471 reads `idea · postponed`.
- **P1** — 2026-11-15, ledgers frozen at `4eedcf61`: this doc, `planning-evidence.md` (PE-001–PE-010), `planning-obligations.md` (O1–O14, every row `planned`) and `decisions.md`; the `## Fixes` row registered through `roadmap fixrow`; `phase-lint` verdict PASS · `67deef3f`.
- **E1** — 2026-11-15, the RED corpus: `cd packages/agentic-workflow && bun test test/journal.headless.test.mjs` at `4f512cd2` · exit 1 · `0 pass / 1 fail / 1 error`, `Cannot find module '../src/journal/headless.mjs'` — the operation, the module and the action did not exist.
- **P2** — 2026-11-15, the corpus (24 cases: declaration, cells, files override, stdin block, provenance, the four refusals, idempotency, the aggregator consumer, the CLI contract, the action metadata and the adapter) · `4f512cd2`.
- **E2** — 2026-11-15, the fixture walk before the live tree (S6/S7): a `mktemp -d /tmp/aw471-dbg-…` toy repository (git `main`, one commit, an empty carrier) ran `journal headless` through the working tree — exit 0, one fragment `20261115T163102Z-main-narrative-gha-42.md`, the `$GITHUB_OUTPUT` receipt carrying `fragment`/`name`/`status`; the second invocation answered `already-present`; scratch removed. No mutating run touched this worktree's carrier.
- **P3** — 2026-11-15, the module: declaration validation, provenance composition, block rendering through `renderEntryBlock`, one-entry-per-run, delegation to `writeJournal` · `bd0d8048`.
- **P4** — 2026-11-15, the CLI operation `journal headless` with its closed flag set and its exit contract, plus the crate README's command row and `journal-headless-grammar@1` · `bd0d8048`.
- **P5** — 2026-11-15, the action: `journal/action.yml` (eight inputs, three outputs, one composite step) and `journal/headless.mjs` (env → argv, the crate version derived from its own tree, `AGENTIC_WORKFLOW_RUNNER`, the named refusals, `$GITHUB_OUTPUT`) · `679fcda5`.
- **E3** — 2026-11-15, `bun test test/journal.headless.test.mjs` · exit 0 · 24 pass; `bun test test/journal.test.mjs test/journal.write.test.mjs test/journal.surfaces.test.mjs` · exit 0 · 60 pass with no assertion edited. Two defects the corpus caught in the new code and fixed: the adapter mapped `fragment` from a receipt key that is `path`, and the crate module's docstring named the CI host, which `journal.surfaces.test.mjs`'s forge-free case refuses.
- **E4** — 2026-11-15, `cd packages/agentic-workflow && bun run test` · exit 0 · 822 pass across 47 files; `cd packages/pi-agentic-workflow && bun run test` · exit 0 · 873 pass across 77 files.
- **P6** — 2026-11-15, the surface declarations: the `normative-surfaces@1` row, the two gate-inventory claims, the `machineLines` exact re-pin (142 → 143), the carrier document's writer row and headless section, the init-workspace consent clause, the capabilities row, the changeset and the roadmap state · `53d054d0`.
- **E5** — 2026-11-15, the differential (O14): `4eedcf61` and this head exported to `mktemp -d /tmp/aw471-diff-…`, each package's `node_modules` linked, and one fixture corpus run against both (`journal name`, `journal write --json`, `journal aggregate --check`, `journal aggregate` twice, `log render --raw`, `journal` no-op, `journal name` without `--kind`, `journal write` without flags). Declared deltas only: the `journal` refusal now names the new operation, and `journal name`'s clock second is normalized as a wall-clock artifact. Harness: `UNDECLARED=0`. Scratch removed.
- **G1** — 2026-11-15, `node scripts/run-root-suite.mjs --jobs 2` · exit 0 · 113/113 suites PASS. At `--jobs 4` on this 6-CPU sandbox the pre-existing `scripts/phase-lint.test.mjs` (95–120 s of real work, byte-identical to base) hits its own 120 s suite bound and `scripts/unit-route.test.mjs` intermittently crosses the 10 s per-test budget; both pass alone, four concurrent standalone `unit-route` runs pass, and both pass at `--jobs 2` — the contention artifact the manifest already records for `secret-scan`. No suite touched by this unit failed in any run.
- **G2** — 2026-11-15, `bun scripts/local-gate.mjs --skip-network --jobs 2` · exit 0 · `PASS — 15 step(s) in 335s`; the four network steps run on their own: `--only workspace-install,pi-compat-guard` · exit 0 · `Checked 172 installs across 188 packages (no changes)`, `pi leg latest: tsc --noEmit clean`; `--only dependency-pin-gate,dependency-advisories` · exit 0 · both pins match the local train.
- **G3** — 2026-11-15, the prose and index gates: `bun scripts/skill-lint.mjs` · `0 finding(s)`; `bun scripts/check-skill-context.mjs` · `PASS context budgets: 30 skills`; `--documents` · `PASS context documents: 4 budgeted documents`; `bun test scripts/normative-drift.test.mjs scripts/prose-gate-inventory.test.mjs` · 43 pass; `bun scripts/docs-generate.mjs --check` · `PASS`; `bun scripts/roadmap-settle.mjs` · `violations: 0`; `bun scripts/lint-changeset.mjs .changeset/471-journal-github-action.md` · `ok`; `phase-lint` · `verdict PASS`; `bun test packages/agentic-workflow/test/journal.surfaces.test.mjs scripts/capability-inventory.test.mjs scripts/doc-discipline.test.mjs` · 47 pass.
- **E6** — 2026-11-15, the mechanical cells: `rg -n 'LOGS\.md' journal/ packages/agentic-workflow/src/journal/headless.mjs` → 0 lines (O5); `rg -ci 'gh api|api\.github\.com|GITHUB_TOKEN|GH_TOKEN|permissions:' journal/` → 0 (O6); `rg -ci 'github|gitlab|forge' packages/agentic-workflow/src/journal/headless.mjs` → 0 (the crate module knows no host — the AC5 rule the corpus enforces).
- **D1** — 2026-11-15, the `version-parity-content` step caught the first changeset as incomplete: editing `skills/init-workspace/SKILL.md` ships content in `@gtrabanco/pi-agentic-workflow`, so the changeset declares it (`patch`) beside the crate's `minor`. Fixed in the changeset, not in the gate.
- **D2** — 2026-11-15, the roadmap's two tables went through their own writers: the `## Fixes` row through `roadmap fixrow`, the Features row's status through `roadmap rowUpsert` with the row's existing slug, depends-on and description read back byte-exact, and the projection through `bun scripts/docs-generate.mjs`. The emitter then applied this doc's `roadmap_summary:` over the Fixes row's Notes cell — its documented behaviour — so the summary here is the detailed text and the row carries it verbatim.

## Next

The owner's external verification of the diff (S11). Nothing is pending in this
unit: every obligation is `verified` on a foreground run, and the one gate step
that reds at `--jobs 4` on this sandbox is the recorded contention artifact (G1),
green at `--jobs 2` and untouched by this change.

## References

- Issue [#471](https://github.com/gtrabanco/agentic-workflow/issues/471); roadmap
  Feature row 471 and this unit's `## Fixes` row.
- `docs/fix/405-journal-fragments/` (the carrier, the grammar and the opt-in),
  `docs/fix/452-journal-fragment-validation/` (the writer and the shared
  predicate), `docs/fix/468-log-immutability/` (the push-level carrier rule).
- `template/.agentic-workflow/journal.md` (the consent surface this unit extends),
  `packages/agentic-workflow/README.md` (`journal-headless-grammar@1`).
- `skills/runner-contract/references/RUNNER.md` (the `AGENTIC_WORKFLOW_RUNNER`
  override the adapter honours).

## Branch

`feat/471-journal-github-action`

## Depends on

None. #307 (the hard blocker) is CLOSED; #405, #452 and #468 landed.

## Regression scope

| scenario | verified by |
|---|---|
| `journal write` keeps its field contract, its refusals and its byte output | `bun test packages/agentic-workflow/test/journal.write.test.mjs` exits 0 |
| `journal aggregate` and `journal aggregate --check` keep appending newest-first, consuming already-present bytes and refusing malformed carriers | `bun test packages/agentic-workflow/test/journal.test.mjs` exits 0 |
| `journal name` still prints the deterministic name and still refuses a missing `--kind` | `bun test packages/agentic-workflow/test/journal.test.mjs` exits 0 and the differential |
| the carrier's prose contracts (template absences, one grammar owner) still hold | `bun test packages/agentic-workflow/test/journal.surfaces.test.mjs` exits 0 |
| every other crate subcommand keeps its arguments and exit codes | the differential against the base commit plus `cd packages/agentic-workflow && bun run test` exits 0 |
| the guide's budgets, the gate inventory and the projection stay green | `bun scripts/check-skill-context.mjs --documents`, `bun test scripts/prose-gate-inventory.test.mjs`, `node scripts/docs-generate.mjs --check` exit 0 |
| `log-session`, the pi extension and the mechanical entry are untouched | `git diff --stat` names none of their files; `cd packages/pi-agentic-workflow && bun run test` exits 0 |
