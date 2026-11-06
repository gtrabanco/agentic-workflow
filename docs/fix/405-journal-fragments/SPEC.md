---
type: feature
scope: medium
---

# fix/405-journal-fragments

> Session-log fragment carrier + merge-to-main aggregator — kill `docs/LOGS.md`
> merge conflicts (changeset-style, forge-agnostic, `.agentic-workflow/journal/`
> namespace). Applied inline per the owner's governing request (S1–S8 below);
> the owner's S4 substitutes for the lane's review machinery on this unit's own
> surgery.

## Issue

[#405](https://github.com/gtrabanco/agentic-workflow/issues/405) — NEW FEATURE:
session-log fragment carrier + merge-to-main aggregator. Roadmap row 114. The
PR closes it with `Closes #405` in the body.

## Specs

The governing request is the owner's command message, quoted verbatim as
S1–S8. S1 delegates the functional requirements to issue #405, whose "In
scope" items 1–6 are quoted verbatim as S9–S14 (the issue is the requirement
source S1 names; the issue's own numbering is preserved in parentheses). Each
requirement is quoted unedited.

**S1 — Apply issue #405.**
> Apply to this repository: issue #405

**S2 — Frozen-failure corpus first (RED before anything).**
> If this change repairs known failures, extract each one's reproducer from git history / the findings ledger **as a failing check before implementing** — they are the test corpus; the change is done when every reproducer passes. Nothing else is padded in.

**S3 — Fixtures before the real tree.**
> Any new mechanic (grammar, lint, script, template) is validated on a throwaway copy first: the golden fixture, fixture unit docs, or a toy repo under `mktemp -d /tmp/…`. Scratch lives outside the worktree and is removed after. Only when fixtures pass do the real files change.

**S4 — Work inline — never run this repo's own machinery on its own surgery.**
> No `review-change`, no `audit-pr`, no fold cycle, no self-granted gate exceptions on this change. Direct application: plan briefly, implement, hand the diff to me. The one exception is the repo's deterministic gates (tests, lints) — run those always.

**S5 — Freeze the planning ledgers before the first line of code.**
> This command substitutes for the lane's plan step, so it writes the planning ledgers in the repo's own shapes — row contracts owned by `skills/pre-execution-review/references/LEDGERS.md`, mirrored in `docs/fix/_TEMPLATE/SPEC.md`. A change applied without them is a legacy unit with no ledgers, and the repo's reviews and audits refuse it until they are constructed — so cut them here, never retrofit them later:
>
> - **Home:** the target issue's unit dir `docs/fix/<issue>-<topic>/`. When it does not exist, create the unit doc from `docs/fix/_TEMPLATE/SPEC.md` with my verbatim `S1..Sn` as the frozen request. XS/S embeds `### Planning evidence` / `### Obligations` in the unit doc; M/L freezes `planning-evidence.md` / `planning-obligations.md` beside it — never both. No issue # given → ask me once where the ledger lives, then continue.
> - **Obligations** — one row per normative behaviour, compatibility invariant, affected use case, and required failure state, in the 9-column shape (`obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status`). Ids `O1, O2, …`; each row's `authority-source` cites its `S#`; exactly one phase and one task per row; every validator is a backticked command plus the outcome it must produce (`… exits 0`, `… matches <N>`); every row is `planned` at cut time. Each §2 frozen-failure reproducer is at least one row's validator. An empty ledger is a defect — if the change truly imposes nothing, one `n/a: <reason>` row.
> - **Planning evidence** — one row per Engineering claim the change rests on (`PE-001, …`; `id | authority-kind | claim | source | freshness | affected-decision-or-obligation`). An unsampled assumption about a tool's or model's behaviour is `unknown` with an owner, never a silent citation.
> - **Acceptance criteria** — the unit doc's `## Acceptance criteria` section is frozen with one observable, testable criterion per `S#`, each naming the check that proves it. This is the anchor `review-change`'s per-criterion coverage table and SPEC-drift check reads; a unit doc without filled criteria gives the review nothing to dismantle per criterion and reports fewer findings than the same change developed through `unit-lane` — fewer findings that mean less declared surface, not a better change.
>
> The ledgers freeze at cut except `status`. Phase labels are `P1, P2, …`.

**S6 — Implement test-first, differential, in slices.**
> - One RED test per requested rule; for every existing command sharing changed code, one test proving its previous behavior still holds; nothing else.
> - **Differential check**: run each touched command against a copy of the base commit (in `mktemp -d`, never committed) and against the change; any stdout/stderr/exit difference nobody asked for is a regression — fix and pin it.
> - Work-unit commits of ~400 authored changed lines (additions+deletions), Conventional Commit messages, tests and docs alongside behavior. **Never delete spaces, blank lines, or comments for cosmetic line savings; never omit tests, minify, add gratuitous abstractions, or split artificially** to fit the slice — if the correct solution exceeds it, say why and continue. If a slice boundary nears, ask me once for the delivery strategy (stacked PRs / single PR), then keep going.

**S7 — Verify like a writer, hand off like one.**
> Close the obligations ledger first: every row flips to `verified` only with its validator actually run in the foreground and the evidence recorded where its `required-evidence` cell says — or an evidenced `n/a` (cite `path:line`, a ledger row, or a contract). A `planned`, `in-progress`, blank, or `deferred` row blocks the handoff — name the open ids; never defer out of the unit (deferral needs my SPEC amendment first, never a follow-up issue). A blocker that reopens a behaviour flips its row back before anything else.
>
> Then run the declared verification commands in the foreground and report each as `command: observed result`. Then stop and present: the diff summary, the obligations ledger state (rows × status), the verification block, and every failed/skipped/pending check honestly — **I am the external verifier**. Do not self-approve, do not claim done before my verdict. A checkbox or a passing suite grants nothing by itself.

**S8 — Correction bounds (hard).**
> After my review: one correction batch fixing every reported blocker → one recheck limited to those blockers (re-running the touched obligation rows' validators and flipping their statuses back) → a second pass only if the **same** blocker still fails → then one `Needs your decision` result naming the open blockers. **A new finding never earns another cycle** — it goes to me, and the turn ends.

**S9 — Fragment carrier.** (issue "In scope" 1)
> **Fragment carrier**: one file per entry under `.agentic-workflow/journal/`, written by the session instead of a direct `docs/LOGS.md` append, committed in the PR like any other change. Serves both writer classes: mechanical entries (rendered by `log render` from `log-facts@1`) and narrative `/log-session` entries (same fragment rules; the existing append-only, git-facts and refusal rules hold at fragment level).

**S10 — Deterministic fragment naming.** (issue "In scope" 2)
> **Deterministic fragment naming** from git facts (timestamp + branch + kind/session id) so two sessions cannot collide; a collision is refused, never overwritten.

**S11 — The aggregator CLI.** (issue "In scope" 3)
> **The aggregator CLI** (`journal aggregate` or the crate's next free subcommand): reads fragments, appends them to `docs/LOGS.md` newest-first with a deterministic tie-break, deletes consumed fragments, exits non-zero on anything ambiguous. Idempotent: re-running on an aggregated set is a no-op diff.

**S12 — Merge-to-main CI wiring as an example only.** (issue "In scope" 4)
> **Merge-to-main CI wiring as an example only**: a GitHub Actions workflow (concurrency-grouped) that aggregates + deletes + bot-commits, plus a documented `post-receive` example for self-hosted forges. The script itself knows no forge.

**S13 — Template + `init-workspace` deployment.** (issue "In scope" 5)
> **Template + `init-workspace` deployment**: the carrier ships in `template/` and installs consent-gated, opt-in, off by default — same contract as the existing hooks. A repo that opts out keeps today's direct-append behavior with zero residue.

**S14 — Driver-contract forward path.** (issue "In scope" 6)
> **Driver-contract forward path**: a documented note of how this layout slots into #374's contract once it lands (fragment layout = driver; aggregator = its render step). No dependency on #374 shipping first.

## Acceptance criteria

One observable criterion per requirement; each names the check that proves it.
AC1–AC9 quote issue #405's "Acceptance criteria" verbatim.

- **AC1** — A project opted into the carrier writes every new journal entry to a fragment under `.agentic-workflow/journal/`; **no writer edits `docs/LOGS.md` directly** (grep + gate test proves the direct-append path is unreachable when opted in). Check: `bun test packages/agentic-workflow/test/journal.test.mjs` (carrier-routing cases) + `scripts/session-close.mjs close` fragment-mode refusal test.
- **AC2** — Fragment names are deterministic and collision-free across concurrent sessions on the same branch; the test demonstrates two simulated sessions producing two fragments, never one overwrite. Check: `bun test packages/agentic-workflow/test/journal.test.mjs` (naming + collision cases).
- **AC3** — The aggregator is deterministic: the same fragment set always yields byte-identical `docs/LOGS.md` (order newest-first, declared tie-break); idempotency is proven by a re-run producing a zero diff. Check: `bun test packages/agentic-workflow/test/journal.test.mjs` (determinism + idempotency cases).
- **AC4** — Two branches each carrying a fragment merge to `main` back-to-back with **zero journal conflicts and zero lost or duplicated entries** — proven by a race fixture (the case that was manual resolution until now). Check: `bun test packages/agentic-workflow/test/journal.test.mjs` (race fixture — the frozen-failure reproducer).
- **AC5** — The aggregator CLI has no forge dependency; the GitHub workflow and the `post-receive` example both invoke the same command unchanged. Check: `rg -c 'github|gitlab|gh |forge' packages/agentic-workflow/src/journal/` → no match, plus the example files naming the identical argv.
- **AC6** — Mechanical fragments are produced by `log render` from the frozen `log-facts@1` payload, so an aggregated entry is byte-identical to today's direct append for the same facts (parity test against a direct append). Check: `bun test packages/agentic-workflow/test/journal.test.mjs` (parity case) + `bun test packages/pi-agentic-workflow/test/auto-log-session-parity.test.mjs`.
- **AC7** — Template + `init-workspace` install is consent-gated and opt-in; a fresh install without consent writes nothing (no directory, no workflow, no config). Check: `test -e template/.agentic-workflow/journal` → absent, `test -e template/.github/workflows` → absent (only `.example` ships), and the init-workspace consent step's wording test.
- **AC8** — The repo's own gates (context budgets, doc audits, root suites) behave correctly with `.agentic-workflow/journal/` present — the dot-directory caveat is tested, not assumed. Check: `bun test packages/agentic-workflow/test/journal.test.mjs` (dot-directory case) + `node scripts/run-root-suite.mjs` green on the changed tree.
- **AC9** — Every consumer-facing prose surface names one owner for the fragment layout and naming grammar (no second hand-rolled grammar — the repository's single-owner rule). Check: the owner-citation assertion in `bun test packages/agentic-workflow/test/journal.test.mjs`.

## Impact

- **Consumes:** feature 394's `log render` / `log-facts@1`
  (`packages/agentic-workflow/src/log/render.mjs`) as the byte-canonical
  mechanical-fragment generator; `.changeset/` + `scripts/lint-changeset.mjs`
  as the fragment-and-consume precedent; `init-workspace`'s consent contract
  as the installation path.
- **Consumed by:** the three journal writers —
  `template/.claude/hooks/log-session-end.sh` (mechanical, bash),
  `@gtrabanco/pi-agentic-workflow`'s `autoLogSession` publisher (mechanical,
  TS), and `/log-session` (narrative) — which gain a fragment mode selected by
  the carrier's presence; #374 later consumes the layout as one more store
  driver (forward note, S14).
- **Stops being true:** "`docs/LOGS.md`'s only writers append to it directly"
  — in a carrier-opted-in project every writer writes a fragment and only the
  aggregator touches the journal file; the journal header's writer table gains
  the fragment rule.
- **Differential surface:** every touched command must behave byte-identically
  when the carrier directory is absent (the default install): the hook, the
  extension publisher, `session-close.mjs render|close`, `log render`, and the
  CLI router's existing subcommands.

## Retirements

Nothing is retired. The direct-append path is not removed — it remains the
behavior of every project that has not opted in (S13 keeps it "with zero
residue"), so the carriers it served stay. `merge=union` is not used on
`docs/LOGS.md` today (`.gitattributes` verified 2026-11-05, PE-006), so there
is no stopgap to retire either; the issue leaves its adoption to the owner and
this unit does not adopt it.

## Non-goals

The issue's "Out of scope" list, verbatim:

- **Storage backends, DBs, query contracts** — #374's territory; the sibling relationship is composition, not duplication.
- **Changing the entry shape** — `log render` remains the single owner of the mechanical entry's bytes; `/log-session` remains the only writer of narrative prose.
- **The web viewer or any retrieval work** — feature 65 owns retrieval; feature 87 owns the panel.
- **Retroactive migration** of existing `docs/LOGS.md` entries into fragments — the journal's history stays where it is.
- **Replacing `merge=union` as a repo-local stopgap**: if adopted here, `.gitattributes merge=union` on `docs/LOGS.md` is an interim measure that may coexist until this lands (owner decides in the unit).

Unit decisions recorded against the issue's open questions: namespace resolved
by the owner (`.agentic-workflow/journal/`); the aggregator's order is
**append-at-end, batch newest-first** (the journal is append-only, so inserting
at the top would rewrite it); this repository does **not** opt in — the carrier
ships via `template/` only; no config knob — the carrier directory's presence
is the only opt-in signal; feature 65's index does **not** ingest fragments
(open question 5's default).

## Risk tier

Computed at cut time against the planned path set
(`bun scripts/ceremony.mjs tier classify --paths …`, run 2026-11-05):

- **Tier** — `high` · **Task Size** — `understood: true, contained_risk: named, resumable_from_diff: true` (`ceremony: unit-doc+review-change`)
- **Named high-risk item** — signals[0..1]: `destructive` (`packages/agentic-workflow/bin/agentic-workflow.mjs` · `../src/doc/retrieval.mjs` · module-level), `publish` (`packages/agentic-workflow/src/log/publish.mjs`)

The computed ceremony names `review-change`; the owner's S4 explicitly
substitutes inline application with the owner as external verifier for this
unit's own surgery. The tier's `high` verification obligation is discharged by
S7's foreground evidence run instead of a review pass — recorded here, not
silently dropped.

## Future

- **Repo self-adoption** (2026-11-05 `open` → 2026-11-06 `implemented`): the
  owner flipped the decision (S15, Log L18) — this repository now opts in to
  its own carrier, with `autoLogSession: mechanical` on, and the aggregation
  workflow installed; the flip ships in this unit's diff and goes live for
  `main` at the merge.
- **Feature 65 pre-aggregation visibility** (2026-11-05, status `open`): the
  index ingesting fragments between merge and aggregate — the issue's open
  question 5 default is no; revisit only if the gap proves real.

## Future cost

- Every future journal writer must route through the carrier check (fragment
  when `.agentic-workflow/journal/` exists, direct append otherwise) — binds
  new writers, enforced by AC1's grep + gate test.
- The fragment naming grammar has one owner
  (`journal-fragment-grammar@1`, the crate README block); any prose surface
  that needs the grammar names it instead of restating it — binds docs and
  skills.

## Applicable tests

- `packages/agentic-workflow/test/journal.test.mjs` (new — the frozen-failure
  reproducer suite: naming, collision, race fixture, determinism, idempotency,
  refusals, parity, dot-directory, routing, owner citation)
- `packages/agentic-workflow/test/log.publish.test.mjs` (extended — fragment
  routing of the local publisher)
- `packages/pi-agentic-workflow/test/auto-log-session-parity.test.mjs`
  (extended — the hook's fragment mode against the crate's grammar)
- `packages/pi-agentic-workflow/test/auto-log-session-wiring.test.mjs`
  (extended — carrier-present wiring)
- `scripts/session-close.test.mjs` (extended — fragment-mode close)
- `node scripts/run-root-suite.mjs` (the repo gate, always)

## Known pre-existing issues

- `docs/LOGS.md` is not strictly chronological in its existing entries (the
  two newest are swapped) — `affects` only the aggregator's append-at-end
  contract: the aggregator orders the fragments it consumes, never rewrites
  the committed history (non-goal: retroactive migration).
- The GitHub Actions example is never executed by this unit's tests (no CI
  runner in the suite) — `does-not-affect` the code contracts (AC5 checks the
  argv by reading the files), `affects` only the example's live behavior,
  which its first real install verifies (PE-005).

## Tasks

- P1 — Cut the frozen-failure reproducer suite RED: fragment naming, collision
  refusal, race fixture, determinism, idempotency, refusals, parity,
  dot-directory, carrier routing, owner citation
  (validator: `bun test packages/agentic-workflow/test/journal.test.mjs` exits 0 after the implementation lands; observed failing first)
  (Implements: S2, S9, S10, S11)
  Relevant files: packages/agentic-workflow/test/journal.test.mjs
- P2 — Implement the fragment module: naming grammar owner, sanitizer,
  `writeFragment`, `createFragmentJournalPublisher`
  (validator: `bun test packages/agentic-workflow/test/journal.test.mjs` exits 0)
  (Implements: S10, AC2, AC6)
  Relevant files: packages/agentic-workflow/src/journal/fragment.mjs
- P3 — Implement the aggregator + the crate CLI subcommand (`journal aggregate`,
  `journal name`), forge-free, refusal exit 2
  (validator: `bun test packages/agentic-workflow/test/journal.test.mjs` exits 0)
  (Implements: S11, AC3, AC4, AC5)
  Relevant files: packages/agentic-workflow/src/journal/aggregate.mjs, packages/agentic-workflow/bin/agentic-workflow.mjs
- P4 — Flip the mechanical writers: `createJournalPublisher` carrier routing,
  pi wiring session id + carrier presence, template hook fragment mode, parity
  test extension
  (validator: `bun test packages/pi-agentic-workflow/test/` exits 0)
  (Implements: S9, AC1, AC6)
  Relevant files: packages/agentic-workflow/src/log/publish.mjs, packages/pi-agentic-workflow/src/extension/auto-log-session-wiring.ts, template/.claude/hooks/log-session-end.sh
- P5 — Narrative writer + session close: `session-close.mjs` fragment mode
  (commits new fragments, refuses a touched `docs/LOGS.md`), `log-session`
  skill fragment-mode section
  (validator: `bun test scripts/session-close.test.mjs` exits 0)
  (Implements: S9, AC1)
  Relevant files: scripts/session-close.mjs, skills/log-session/SKILL.md
- P6 — Carrier + consent: `template/.agentic-workflow/journal.md`, the GitHub
  Actions example (`.yml.example`), the post-receive example, `init-workspace`
  consent step, template guide section
  (validator: `bash template/.agentic-workflow/hooks/tests/test-init-workspace-contract.sh` exits 0 and the AC7 absence checks)
  (Implements: S12, S13, AC5, AC7)
  Relevant files: template/.agentic-workflow/journal.md, skills/init-workspace/SKILL.md
- P7 — Docs + single-owner wiring: crate README grammar block
  (`journal-fragment-grammar@1`), normative-surfaces row, #374 forward note,
  roadmap row 114, changeset
  (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S14, AC8, AC9)
- P8 — Verification: full package suites, root gate, differential runs against
  the base commit, obligations ledger closed
  (validator: `bun scripts/local-gate.mjs` exits 0)
  (Implements: S7, S6)

### Planning evidence

The M-size ledger lives beside this doc: [`planning-evidence.md`](planning-evidence.md).

### Obligations

The M-size ledger lives beside this doc: [`planning-obligations.md`](planning-obligations.md).

## Triaged steps

> The owner's S4 substitutes for the lane's plan step; the lane's triage
> command was not run — the task list above is the plan, frozen before the
> first line of code. Recorded here so no later reader mistakes the omission
> for an oversight.

## Findings

OPEN rows only: a row a review persisted as fix-now work and no fold has closed
yet. This unit runs no review pass (S4); the owner is the external verifier.

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — (L) Owner request, verbatim: "Apply to this repository: issue #405" + the eight-step inline-application protocol frozen as S1–S8 above.
- **L2** — (D) Owner decision inherited from the issue: namespace `.agentic-workflow/journal/` (owner, 2026-11-05, recorded in the issue).
- **L3** — (D) Unit decision: aggregator appends at the end of `docs/LOGS.md` (append-only journal), batch ordered newest-first with tie-break branch → kind → session ascending.
- **L4** — (D) Unit decision: the carrier directory's presence is the opt-in signal; no config knob (issue open question 4's default). This repository does not opt in.
- **L5** — (D) Unit decision: the template ships the carrier documentation at `template/.agentic-workflow/journal.md` and the CI example as `*.yml.example`; the `.agentic-workflow/journal/` directory itself is created only on consent, so a wholesale template copy never opts a project in.
- **L6** — (E) S3 fixture: the race mechanic walked on a toy repo in `mktemp -d /tmp/j405-XXXX` (two branches, two fragments, back-to-back merges clean, newest-first manual aggregate) — passed; scratch removed before any real file changed.
- **L7** — (E) RED observed: `bun test packages/agentic-workflow/test/journal.test.mjs` exit 1 — `Cannot find module '../src/journal/fragment.mjs'` (the corpus fails before the implementation, S2/S6).
- **L8** — (P) P1 landed red-first, commit `805a2618` (unit doc + ledgers + the corpus). P2–P3 green, commit `bdb3bd69` (fragment module, aggregator, CLI, publisher routing). P4, commit `d872b812` (hook + extension flip, parity). P5, commit `b3071b21` (session-close fragment mode + skill). P6–P7, commits `9c96ea44` + `57cbc042` (carrier, consent, single-owner wiring, gate re-pins).
- **L9** — (E) `bun test packages/agentic-workflow/test/journal.test.mjs` exit 0 — 22 pass (naming, two-sessions, collision refused, parse round-trip, unknown kind, mechanical parity, narrative validation, race fixture, determinism, idempotency, already-present crash-safe re-run, three refusal cases, no-op, dot-directory, both routing cases, three CLI cases).
- **L10** — (E) `bun test packages/agentic-workflow/test/` exit 0 — 357 pass across 19 files (the crate suite, `log.render.test.mjs` unmodified among them).
- **L11** — (E) `bun test packages/pi-agentic-workflow/test/` (via `bun run test`) exit 0 — 530 pass across 46 files, including AP-05 (hook fragment parity: name parsed by the crate grammar, bytes `renderEntry`-equal), AW-12 (wiring routes to a fragment, journal untouched) and AM-10 (carrier counts as opt-in).
- **L12** — (E) `bun test scripts/session-close.test.mjs` exit 0 — 27 pass, three new carrier cases (clean close; a touched `docs/LOGS.md` refused; no-new/edited/deleted fragments refused). Two real defects the new cases caught were fixed in the code: `ls-tree` full paths vs basenames, and the commit subject preferring the Summary line.
- **L13** — (G) `node scripts/run-root-suite.mjs` exit 0 — 87/87 suites PASS on the changed tree (after the gate re-pin commit `57cbc042`).
- **L14** — (G) `bun scripts/local-gate.mjs --no-bail` — 12 of 13 steps exit 0 (docs-generated-projection, version-parity-content, workspace-install, schema-build, dependency-pin-gate, dependency-advisories, pi-node-compat, crate-suite-node, crate-suite-bun, root-suite, schema-node-compat, and the lint/context steps). One step failed: `pi-compat-guard` exit 1 — **pre-existing and environmental**: reproduced identically on the base commit `b180892c` (the same `TS2307 Cannot find module '@gtrabanco/agentic-workflow/src/…'` errors, including the pre-existing `render.mjs`/`publish.mjs` imports — the throwaway fixture cannot resolve the workspace crate). Disclosed to the owner, not worked around.
- **L15** — (E) Differential check (S6/O10) against base `b180892c` in `mktemp -d /tmp/j405-diff-XXXX`, both trees `git archive`-exported: `agentic-workflow log render --facts … --raw`, `session-close.mjs render`, `session-close.mjs close` (non-carrier) and the template hook pair (start+end, non-carrier) — stdout, stderr and exit code identical modulo wall-clock timestamps and commit SHAs; the hook's appended bytes compared equal after timestamp/range normalization. Scratch removed.
- **L16** — (E) Foreground validators: `rg -ci 'github|gitlab|forge' packages/agentic-workflow/src/journal/` → zero matches (O5); `test -e template/.agentic-workflow/journal` → exit 1 and `test -e template/.github/workflows/agentic-workflow-journal.yml` → exit 1 with only `agentic-workflow-journal.yml.example` shipping (O7); `rg -c 'concurrency:'` → 1 and `rg -c 'journal aggregate'` → 2 (workflow) + 3 (carrier doc) (O12); `rg -c 'pluggable|driver' template/.agentic-workflow/journal.md` → 3 (O13); `rg -c 'agentic-workflow/journal' packages/agentic-workflow/src/log/publish.mjs` → 1 (O1 grep half); `bash template/.agentic-workflow/hooks/tests/test-init-workspace-contract.sh` exit 0.
- **D6** — (D) Two cut-time validator cells were amended at close, each with its reason recorded in the row: O5's regex dropped the `gh ` token (it matched the English word "through" inside a comment — the scan's intent, no forge names, is what the amended regex preserves); O7's check pins no *active* workflow file rather than no `workflows/` directory, because shipping the inert `.yml.example` requires the directory (the `.github/hooks/…example` precedent). Both amendments are visible in the ledger rows, not silent edits.
- **L17** — (E) S3 fixture hygiene: the toy race repo (`/tmp/j405-…`), the differential tree (`/tmp/j405-diff-…`) and the compat legs were all removed after use; no scratch remains.
- **L18** — (S15) Owner correction, verbatim (2026-11-06): "Vale, pero este repo si quiero que se active a sí mismo tras el merge y quiero que configures el auto log-session para que funcione automático tras el merge" — this repository opts in to its own carrier (the Future row "Repo self-adoption" moves to implemented) and the pi extension's `autoLogSession` is switched to `mechanical` in the project config, so the mechanical entry pipeline runs automatically once the branch merges.
- **D7** — (D) The opt-in lands on the branch, not post-merge: the carrier directory, the config switch and the aggregation workflow are part of this unit's diff, so the pipeline is exercised and gated before it merges; it becomes live for `main` at the merge itself, which is what S15 asks for. The mechanical fragment pipeline is the only automation enabled — the narrative entry stays `/log-session`'s manual job (the feature-394 non-goal holds).
- **L19** — (E) S15 validators in the foreground: `test -d .agentic-workflow/journal` exit 0; `rg -c '"mode": "mechanical"' .pi/pi-agentic-workflow.json` → 1; `test -f .github/workflows/agentic-workflow-journal.yml` exit 0 with `rg -c 'journal aggregate'` → 2; `node scripts/run-root-suite.mjs` exit 0 (87/87) on the amended tree; the nested `.agentic-workflow/.gitignore` whitelist gained `!journal/` (the fragments are committed entries, not store output — F38's probe suite stays green).
- **L20** — (D) Interim window disclosed, not worked around: until the release carrying this branch ships and is installed locally, a pi session on this checkout runs the installed 4.10.0 extension, whose publisher still appends directly to `docs/LOGS.md`; the branch's `session-close close` refuses that touch (AC1's guard) and the writer falls back to a fragment per the updated `/log-session` skill. Full automation goes live at merge + release + install.
