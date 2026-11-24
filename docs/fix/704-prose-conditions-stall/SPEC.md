---
type: fix
scope: medium
roadmap_summary: Issue [#704](https://github.com/gtrabanco/agentic-workflow/issues/704) (M): a delivery condition stops being prose — closing as "covered by #N" against an OPEN #N is refused by `runner delivery-conditions --close-check <n>` (the cover must be delivered, or the issue stays open with a `blocked-by` link), and a scheduled `--sweep` re-checks every recorded condition against the cited issues' state and reports the ones whose follow-up came due (#301's shape) instead of leaving it to a later session's memory.
ac-hash: fa41aa417e870ba613397a9a28d0c5dfc63dfcdc8ec504eb07718e5fc7d3aba4
---

# fix/704-prose-conditions-stall

> One-line: a condition that gates delivery names a carrier the machine
> re-checks — the close-time guard refuses coverage by an undelivered issue, and
> the weekly sweep notices a met condition at worst one sweep later.

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
SPEC.md | kept
decisions.md | kept
known-issues.md | kept
planning-obligations.md | kept
planning-evidence.md | kept
external-verify.md | trimmable
review-findings.md | trimmable
planning-findings.md | trimmable
progress.md | trimmable · legacy carrier
```

## Issue

`#704` — tracked issue in the project's forge. This unit's PR closes it via
`Closes #704`.

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim
between the quote markers, in the order the issue states them.

**S1 — the defect: a prose condition stalls silently.**
> Delivery conditions recorded as prose stall silently: the machine never re-checks them, so a condition lives only until the session that wrote it dies.

**S2 — the field record: #301 is the confirmed silent stall.**
> **#301** — the only confirmed *silent* stall: it documented the repair-receipt consumer gap and closed with the reopen condition "cuando #260 lande". #260 landed CLOSED; nobody reopened; the gap stayed live and was re-hit by field data two consumer units later (fix-101 and fix-334, see #698). The reopen condition lived in a comment and had no carrier or watcher.

**S3 — the rule: a gating condition names a carrier the machine re-checks.**
> A condition that gates delivery — "retire when…", "reopen when X lands", "covered by #N", "proceeds when these three mechanisms are live" — must name a **carrier the machine re-checks**: typically the issue whose body carries the condition and whose open/closed state gates it, or a roadmap row with its done-settle. Colloquially: a `closed-as-covered-by` linkage must be *verifiable by machine* — when the covering issue closes, the covered one either reopens itself through a recorded check or is audited in a scheduled sweep; never depends on someone noticing in conversation.

**S4 — the cheapest mechanism: a close against an open cover is refused.**
> or the simplest of all: closing as "covered by #N" against an OPEN #N is refused — the cover must already be delivered, or the issue stays open with a `blocked-by` link (which the forge already tracks natively).

**S5 — the backstop: a scheduled sweep reports conditions whose state moved.**
> an `gh`-based scheduled sweep over open/closed issue bodies that extracts `(re)?open when`, `covered by`, `wait(s) for`, `proceeds when` patterns and reports each one whose cited blocker's current state no longer satisfies the condition — report-only, advisory, cheap;
>
> The third candidate costs the least and reuses the forge's own blocked-by machinery; the sweep remains the backstop for historical prose.

**S6 — the acceptance shape.**
> An issue whose only open work is a condition on another issue's landing cannot close silently past that condition's fulfillment — and if it closes anyway, something scheduled notices at worst within one sweep, not two consumer units later.

**S7 — the surfaces the issue names.**
> - `packages/agentic-workflow/src/runner/ceremony/` — the ceremony state writers and verdicts (condition carriers)
> - `scripts/` — the sweep/re-check script (prose-based extraction of delivery conditions)
> - `docs/ROADMAP.md` — condition rows need carrier field
> - `skills/triage-issue/references/ISSUE_PROCESS.md` — condition lifecycle in the issue process
> - `skills/unit-lane/references/` — unit doc template if a condition carrier shape is added

**S8 — the boundary: incremental, no migration, no reopen of the stalled case.**
> - #301's current state (it's closed; the gap is what matters)
> - #441's full implementation (needs a finish line but conditions are recorded)
> - Migration of all existing prose conditions (incremental, backward-compatible)

**S9 — out of scope by the issue's own words: candidate 2 is not adopted as a prose gate.**
> or the normative-surface extension: such patterns become declared surfaces, and `docs-language`-style gates pin them;

## Acceptance criteria

Frozen at the cut; `ac-hash:` in the frontmatter is this section's SHA-256
(heading and the next `## ` excluded). One criterion per requirement, each
naming the check that proves it.

1. **S1 — the condition stops depending on a session's memory.** Two machine paths exist for it: `runner delivery-conditions --close-check <n>` (close-time) and `runner delivery-conditions --sweep` (periodic), both registered in the CLI's dispatch table, the crate README's Commands table and the help registry. `node packages/agentic-workflow/bin/agentic-workflow.mjs help delivery-conditions` prints the block, and `node packages/agentic-workflow/bin/agentic-workflow.mjs delivery-conditions --close-check 704 --issues-file <fixture>` exits 0 or 1 — never 127/「unknown subcommand」.
2. **S2 — the #301 reproducer is a case, not an anecdote.** `bun test scripts/delivery-conditions.test.mjs` exits 0 with `#301: an issue closed with "reopen when #260 lands", whose #260 has since closed, is reported condition-stalled`, built from the issue's own words (`reopen when #260 lands` in a **comment**, the citing issue CLOSED, #260 CLOSED).
3. **S3 — every condition row resolves to a carrier verdict.** The same suite exits 0 with one case per published verdict (`satisfied`, `pending`, `stalled`, `unresolved`) and `a condition citing no issue number is condition-uncarried, never a silent skip`; `bun test scripts/normative-drift.test.mjs` exits 0 with the four published vocabularies and the `delivery-conditions@1` grammar declared in `AGENTS.md`'s `normative-surfaces@1`.
4. **S4 — closing against an undelivered cover is refused.** The same suite exits 0 with `close-check refuses covered-by against an OPEN cited issue, naming the blocked-by route` and `close-check passes when the cover is already delivered`; the refusal carries the published code `covered-by-open` and exit 1.
5. **S5 — the sweep extracts the five prose families and reports, never writes.** The same suite exits 0 with `the sweep extracts covered-by, reopen-when, proceeds-when, waits-for and retire-when from a corpus`, `the sweep emits one finding per due condition and none for a consistent corpus`, and `the sweep writes nothing: no file changes and no forge mutation call in the module` (`rg -n 'writeFileSync|spawnSync\\(\"gh\", \\[\"issue\", \"(close|edit|comment)'` over the module matches nothing).
6. **S6 — something scheduled notices within one sweep.** `.github/workflows/delivery-conditions.yml` declares a `schedule:` trigger (weekly) plus `workflow_dispatch`, runs `--sweep` from the tree, writes the block to the run summary, and fails the job when the sweep reports findings; `scripts/delivery-conditions.test.mjs` asserts the workflow's shape from the file's own bytes (`schedule`, the subcommand, the `--sweep` argv).
7. **S7 — the declared surfaces ship, and the one not needed says so.** Package module + `scripts/` caller + suite (S7 rows 1–2), the roadmap's `## Fixes` rows are a sweep corpus (row 3), `ISSUE_PROCESS.md` carries the condition lifecycle with the exact commands (row 4), and the unit-doc template answer is recorded rather than silently skipped (row 5): `bun test scripts/delivery-conditions.test.mjs` exits 0 with `the roadmap corpus is evaluated: a done fix row citing an open issue is a finding` and `ISSUE_PROCESS.md states the condition lifecycle and its commands`, and `docs/fix/704-prose-conditions-stall/decisions.md` carries `D5` answering row 5 `n/a` with its reason.
8. **S8 — nothing is migrated, nothing is reopened.** `git diff --name-only $(git merge-base origin/main HEAD)..HEAD` lists no issue-body migration, no reopen of #301 and no #441 implementation; the sweep's own output is the only artifact it produces, and criterion 5's no-write case is the proof.
9. **S9 — candidate 2 is not adopted as a prose gate.** No new `docs-language`-style gate scans prose for condition patterns, and `scripts/normative-drift.test.mjs` is green with five new surfaces — the vocabularies plus one block grammar — instead of a prose-inspection gate.

## Impact

Five surfaces, one vocabulary home, and the prose that declares them:

- `packages/agentic-workflow/src/delivery-conditions/index.mjs` (**new**) — the
  one owner of the extraction, the state rules and the rendering: five kinds,
  four verdicts, three finding codes, one refusal code, and the close-time
  guard. It reads a corpus (a live forge read or a `--issues-file` cache),
  never writes, and never prints third-party text — findings carry issue
  numbers, kinds and verdicts only.
- `packages/agentic-workflow-schema/src/vocabularies.ts` — the four closed sets
  (`DELIVERY_CONDITION_KINDS`, `DELIVERY_CONDITION_VERDICTS`,
  `DELIVERY_CONDITION_FINDINGS`, `DELIVERY_CONDITION_REFUSALS`) plus their
  types, published from the canonical home so the module imports them instead
  of restating them (`IR1`).
- `scripts/delivery-conditions.mjs` + `scripts/delivery-conditions.test.mjs`
  (**new**) — the repository's caller (the crate module's logic, pinned by a
  root suite, red-first) and the frozen-failure corpus.
- The runner's own surface: `src/runner/cli.mjs` dispatch,
  `bin/agentic-workflow.mjs` usage line, `src/runner/help.mjs` registry, and
  the crate README's usage line + Commands row, which `test/cli.surface.test.mjs`
  pins in both directions.
- `skills/triage-issue/references/ISSUE_PROCESS.md` — the condition lifecycle
  (cut → close-check → sweep) and the `delivery-conditions@1` grammar block the
  drift gate reads.
- `.github/workflows/delivery-conditions.yml` (**new**) — the scheduled
  backstop: weekly, report-only, red when the sweep reports.

**The named high-risk item** — `{"path": ".github/workflows/delivery-conditions.yml", "signal": "ci"}`
from the risk-tier verdict — is a scheduled workflow that reads issues and
writes nothing but its own run summary. Its permissions are declared to the
minimum the read needs (`contents: read`, `issues: read`), it never checks out a
credential beyond the run's own `GITHUB_TOKEN`, and it invokes the tree's own
bin with no registry fetch. That is the whole of its blast radius; the
high-tier review pass it would otherwise owe is the owner's, this unit having
been applied under the owner's local workflow (`decisions.md` D6).

**Consumers of what changes.** `test/cli.surface.test.mjs`, `cli.help.test.mjs`
and the crate README's usage line all read the dispatch table's token list;
`scripts/normative-drift.test.mjs` and `scripts/prose-gate-inventory.test.mjs`
read `AGENTS.md`'s inventory blocks; `docs-generate` reads the roadmap. Each is
a regression row below.

**The issue's surface not taken (row 5, `skills/unit-lane/references/`).** No
condition carrier shape is added to the unit-doc templates: a delivery
condition gates an *issue's* delivery, and the template's carrier for that is
the issue the PR closes. Adding a section would change the published unit-doc
section contract (`UNIT_DOC_SPEC_REF_SECTIONS`, the scaffold twin, and
`scaffold-parity`), which buys no carrier the forge does not already hold. The
decision is recorded (`decisions.md` D5) instead of silently skipped.

**The ceremony surface (row 1) is read, not rewritten.** `ceremony pr` and the
merge verdict already read forge state; no ceremony writer is changed. Closing
an issue is a forge action (`gh issue close`, or a PR merge), and the guard is
the check that runs *before* that action — the issue process names the exact
command. A guard on the forge's own close button does not exist (no pre-close
hook exists to install), so the scheduled sweep is the backstop this unit
delivers, exactly as S6 requires.

## Surfaces

- `packages/agentic-workflow`
- `packages/agentic-workflow-schema`
- `scripts`
- `skills/triage-issue`
- `docs`
- `.github`

## Retirements

Contract: none removed. The unit is additive: one module, four vocabularies,
one caller + suite, one workflow, the process prose, and the inventory rows
that declare them. The negative-capability receipt is the vocabulary's own
parity pin — a second copy of any set is refused by
`bun test scripts/vocabulary-parity.test.mjs` (`the delivery-condition sets are
imported, never restated`), and the module's `rg` no-write case refuses a second
write path.

## Non-goals

- **No migration of the historical prose corpus** (S8). The sweep *reports* old
  conditions; rewriting issue bodies is not this unit and never runs
  automatically.
- **No reopen of #301**, no #441 implementation (S8).
- **No pre-close forge hook.** GitHub ships no close-time hook; the guard is a
  command the process requires before the close, and the sweep is the periodic
  backstop. Claimed otherwise would be a promise no tree can keep.
- **No prose-scanning gate over every document** (S9). The patterns are read at
  one place — the sweep — over one corpus (issues + roadmap rows).
- **No new roadmap column.** The carrier is the cited `#N`, not a cell; a
  column would change the table shape every parser (`index-document.mjs`,
  `roadmap-settle`, the `roadmap fixrow` writer) reads. `D2` records it.
- **No decision model.** The extraction is a closed pattern table, the state
  rules are comparisons, and nothing in the path calls a model, an API or an
  embedding (`C5`'s case pins it).

## Risk tier

The verdict is computed, never chosen: `runner ceremony tier classify` over the
planned paths answered **`high`**, because the scheduled backstop is a CI
surface.

- **Tier** — `high` · **Task Size** — `{understood: true, contained_risk: "named", resumable_from_diff: true}`
- **Named high-risk item** — `{"path": ".github/workflows/delivery-conditions.yml", "signal": "ci"}` — quoted verbatim from the verdict's `signals[]`.

The high tier owes this document **plus** the named item quoted in `## Impact`
**plus** the full review pass. The review pass is not run by this session: the
owner's governing instruction for this unit is a local, unpublished workflow in
which the owner is the external verifier and no review machinery runs on the
workflow's own surgery. The obligation is recorded, not waived
(`decisions.md` D6); the verdict and its evidence are `planning-evidence.md`'s
`PE-007`.

## Future

none

## Future cost

- **A condition family that is not in the table is invisible to the sweep.** Who
  it binds: whoever writes the sixth phrasing. The route is a new row in the
  module's exported `CONDITION_PATTERNS` table plus its kind in the published
  set — the ISSUE_PROCESS block's parity case refuses the drift until both land
  (`O20`).
- **The comment carrier is a search, so a condition written in a dialect the
  forge search does not match is missed.** Who it binds: the sweep's weekly
  run. It degrades declared (`unavailable-forge-comment-scan-<cause>`) and the
  body carrier still runs; the residual is recorded in `known-issues.md`.

## Applicable tests

- `bun test scripts/delivery-conditions.test.mjs` · exit 0 — justifies: a
  delivery condition recorded in prose is judged against the issues it cites, so
  a close past an undelivered cover is refused with the route that repairs it and
  a follow-up that came due is reported instead of waiting for a session's
  memory; the #301 bytes are the suite's first case.
- `bun run --cwd packages/agentic-workflow-schema test` · exit 0 — justifies:
  the four closed sets a consumer imports are published from one home, frozen and
  slug-shaped, so no second copy can grow beside them.
- `bun run --cwd packages/agentic-workflow test` · exit 0 — justifies: the
  subcommand is registered on every surface the CLI's own grammar pins (dispatch,
  usage line, help row, README, runner contract), so a half-registered command is
  red rather than undiscoverable.
- `bun test scripts/normative-drift.test.mjs scripts/prose-gate-inventory.test.mjs
  scripts/vocabulary-parity.test.mjs scripts/test-obligation-tags.test.mjs
  scripts/red-first.test.mjs` · exit 0 — justifies: the new normative surfaces
  resolve, the gate inventory claims them, the published sets have one home, the
  suite declares the surface it protects, and its green commit follows its red
  one.
- `bun scripts/local-gate.mjs` · exit 0 — justifies: the repository's own gate
  (root suites, crate suites, schema build, budgets, projections, pin gate) is
  green at the head the handoff names.

## Known pre-existing issues

- `main`'s root suite carries no unit for this area, so nothing pre-existing can
  be red here. `bun scripts/local-gate.mjs` at the cut runs green; any red the
  implementation introduces is this unit's.
- The `ac-hash` frontmatter promise is checked by `runner scaffold-contract
  authoring` only when a document declares it; this document declares it and the
  hash is re-derived at the cut. `does-not-affect` this unit.
- `bun test <file>` applies bun's 5 s per-test default; this suite's cases are
  pure functions over in-memory fixtures and finish far inside it.
  `does-not-affect` this unit.

## Tasks

P1…P9, dependency-topological, smallest-first within a ready set.

- P1 — Freeze the unit doc and its two ledgers; commit the cut. (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs scaffold-contract authoring docs/fix/704-prose-conditions-stall/SPEC.md` prints `SCAFFOLD OK`, and `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/704-prose-conditions-stall/SPEC.md` reports only `obligations-open` rows — the ledger is open at the cut by construction)
  (Implements: S1, S3)
  - Relevant files: docs/fix/704-prose-conditions-stall/SPEC.md, docs/fix/704-prose-conditions-stall/planning-evidence.md, docs/fix/704-prose-conditions-stall/planning-obligations.md, docs/fix/704-prose-conditions-stall/decisions.md
- P2 — Land the suite alone, observed red on the missing module (the #301 reproducer first). (validator: `bun test scripts/delivery-conditions.test.mjs` exits 1 naming the missing module)
  (Implements: S2, S4, S5)
  - Relevant files: scripts/delivery-conditions.test.mjs
- P3 — Publish the four closed vocabularies from the canonical schema home. (validator: `bun run --cwd packages/agentic-workflow-schema test` exits 0)
  (Implements: S3)
  - Relevant files: packages/agentic-workflow-schema/src/vocabularies.ts, packages/agentic-workflow-schema/src/index.ts, packages/agentic-workflow-schema/test/vocabularies.test.mjs
- P4 — Implement the module and the repository's caller, green. (validator: `bun test scripts/delivery-conditions.test.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S7)
  - Relevant files: packages/agentic-workflow/src/delivery-conditions/index.mjs, scripts/delivery-conditions.mjs
- P5 — Register the subcommand on the runner's own surface (dispatch, bin usage, help row, crate README). (validator: `bun run --cwd packages/agentic-workflow test` exits 0)
  (Implements: S1)
  - Relevant files: packages/agentic-workflow/src/runner/cli.mjs, packages/agentic-workflow/src/runner/help.mjs, packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/README.md
- P6 — Declare the condition lifecycle where the issue process owns it, with the `delivery-conditions@1` block. (validator: `bun test scripts/delivery-conditions.test.mjs scripts/normative-drift.test.mjs` exits 0)
  (Implements: S3, S4, S5, S7, S9)
  - Relevant files: skills/triage-issue/references/ISSUE_PROCESS.md, AGENTS.md
- P7 — Ship the scheduled backstop workflow. (validator: `bun test scripts/delivery-conditions.test.mjs` exits 0 with the workflow-shape case)
  (Implements: S6)
  - Relevant files: .github/workflows/delivery-conditions.yml
- P8 — Land the repository indexes and the docs state through their owners (inventory row, roadmap row, session log). (validator: `bun test scripts/prose-gate-inventory.test.mjs` exits 0 and `rg -n '#704' docs/ROADMAP.md` matches the Fixes row)
  (Implements: S7)
  - Relevant files: docs/workflow/GATE_INVENTORY.md, docs/ROADMAP.md, docs/LOGS.md
- P9 — Run the declared verification in the foreground, close every obligation row, record the evidence. (validator: `bun scripts/local-gate.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8, S9)
  - Relevant files: docs/fix/704-prose-conditions-stall/SPEC.md, docs/fix/704-prose-conditions-stall/planning-obligations.md

## Triaged steps

Applied under the owner's local, unpublished workflow: the triage verdict is
already recorded on the issue (`fix-now (medium) 2026-12-23`), and this document's
`## Tasks` **is** the step list the owner's workflow substitutes for the lane's
plan step. No `runner unit-route --triage` block is pasted: that command derives
the lane's nine-step catalog, and this unit is applied inline against the frozen
ledgers it does not consume.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-12-23, issue [#704](https://github.com/gtrabanco/agentic-workflow/issues/704), verbatim:
  ```
  ## What's wrong

  Delivery conditions recorded as prose stall silently: the machine never re-checks them, so a condition lives only until the session that wrote it dies. Field record from the #307 review-economics cluster:

  - **#301** — the only confirmed *silent* stall: it documented the repair-receipt consumer gap and closed with the reopen condition "cuando #260 lande". #260 landed CLOSED; nobody reopened; the gap stayed live and was re-hit by field data two consumer units later (fix-101 and fix-334, see #698). The reopen condition lived in a comment and had no carrier or watcher.
  ```
- **L2** — 2026-12-24, the governing instruction of the applying session, verbatim: `Apply to this repository: issue #704` — the owner's local, unpublished workflow: state resolution first, the frozen ledgers before the first line of code, the frozen-failure corpus red before implementation, and no self-run review machinery.
- **D1** — 2026-12-24, the carrier is the cited forge issue; the roadmap row is a second corpus read through its own parser, never a new column. Authority: this document's S3/S7 and `decisions.md` D2.
- **D2** — 2026-12-24, the shipped mechanism is S4's close guard plus S5's sweep, not S9's prose-gate extension. Authority: the issue's own ranking (`The third candidate costs the least`) and `decisions.md` D1/D3.

- **G1** — 2026-12-24, GATE-RAN · HEAD 5b33cdd2e96a72bcc134daa1ccad162c3dfb7697 · `bun scripts/local-gate.mjs` · exit 0 · `local-gate: PASS — 20 step(s) in 836s` (root-suite, crate-suite-bun, crate-suite-node, schema-build, schema-node-compat, docs-generated-projection, journal-carrier-check, log-immutability, pin gates and every offline guard). The only delta after this head is this document's own evidence append.
- **E1** — 2026-12-24, `bun test scripts/delivery-conditions.test.mjs` at the red commit `d66ea67c0` · exit 1 · `0 pass, 1 fail, 1 error` — `Cannot find module '../packages/agentic-workflow/src/delivery-conditions/index.mjs'`.
- **E2** — 2026-12-24, `bun test scripts/delivery-conditions.test.mjs` · exit 0 · `20 pass, 0 fail` (the #301 case, the English twin, the five families, one case per verdict, the uncarried advisory, the guard's refusal and its pass, the roadmap corpus, the cache/degradations, the truncation, the byte-stable block, the no-write pin, the exit contract, the declared-table parity and the scheduled workflow).
- **E3** — 2026-12-24, `bun run --cwd packages/agentic-workflow-schema test` · exit 0 · `953 pass, 0 fail` (the four published sets included).
- **E4** — 2026-12-24, `bun run --cwd packages/agentic-workflow test` · exit 0 (`cli.surface.test.mjs`, `cli.help.test.mjs` and `runner.dispatch.test.mjs` green with the new subcommand); the gate's own `crate-suite-bun` and `crate-suite-node` steps agree.
- **E5** — 2026-12-24, `rg -n 'writeFileSync|appendFileSync|unlinkSync|rmSync' packages/agentic-workflow/src/delivery-conditions/index.mjs` · exit 1 · no match: the module has no write path.
- **E6** — 2026-12-24, `rg -n '"issue",\s*"(close|edit|comment)"' packages/agentic-workflow/src/delivery-conditions/index.mjs` · exit 1 · no match: the module mutates no forge state.
- **E7** — 2026-12-24, `rg -n 'delivery-conditions --close-check' skills/triage-issue/references/ISSUE_PROCESS.md` · exit 0 · two matches (step 6 and § Delivery conditions): the close path names the guard.
- **E8** — 2026-12-24, `rg -n '#704' docs/ROADMAP.md` · exit 0 · the `## Fixes` row (line 241) reads `in-progress`; written by `runner roadmap fixrow` (receipt `pass`, `ac1368f3 → b4fc4cad`) and then synced by `docs-generate` from the unit doc's `roadmap_summary`.
- **E9** — 2026-12-24, `rg -c '704' .agentic-workflow/journal/20261124T015900Z-fix-704-prose-only-delivery-stall-narrative-local.md` · exit 0 · `2`: the session entry exists in the carrier this repository's journal declares.
- **E10** — 2026-12-24, `rg -n 'permissions:' -A4 .github/workflows/delivery-conditions.yml` · exit 0 · `contents: read` and `issues: read` only; `rg -n 'secrets\.' .github/workflows/delivery-conditions.yml` · exit 1 · the run token is the only credential.
- **E11** — 2026-12-24, `bun packages/agentic-workflow/bin/agentic-workflow.mjs docs-generate --check` · exit 0 · `verdict: PASS` after the emitter wrote the roadmap cell and the two projections.
- **E12** — 2026-12-24, `bun scripts/check-skill-context.mjs --documents` · exit 0 · `PASS context documents: 7 budgeted documents` (the guide's six new surface rows and the inventory's one new gate row are inside the re-pinned exact boundaries).
- **E13** — 2026-12-24, `bun packages/agentic-workflow/bin/agentic-workflow.mjs scaffold-contract authoring docs/fix/704-prose-conditions-stall/SPEC.md` · exit 0 · `ACCEPTANCE MATCH` / `verdict SCAFFOLD OK`.
- **E14** — 2026-12-24, `bun packages/agentic-workflow/bin/agentic-workflow.mjs journal aggregate --check` · exit 0 · `{"ok":true,"checked":26,"refusals":[]}`.
- **D3** — 2026-12-24, the roadmap `## Fixes` row status moved to `in-progress` through its writer (`runner roadmap fixrow`), never a hand edit; `docs-generate` then owned the summary cell.
- **D4** — 2026-12-24, a declared re-base (no emitter exists for the `documents`/`referenceSources` sections): `triage-issue`'s reference ceilings to `ceil(5331 x 1.10) = 5865 / ceil(324 x 1.10) = 357`, and the guide/inventory machine pins to the exact boundary this unit spends. Recorded in the manifest's own `sources` entries.
- **D5** — 2026-12-24, the reading-coverage ledger (`docs/fix/646-docs-skills-reconciliation/second-read.md`) gains the new workflow's row: every in-scope file must be accounted for, and the gate refuses an unrowed one.
- **D9** — 2026-12-24, O16's validator amended at close from `docs/LOGS.md` to the fragment carrier, with its reason recorded in `decisions.md` D9; the rule the row states is unchanged.
- **P1** — 2026-12-24 01:59, the unit applied inline against its frozen ledgers; the cut at `44fd26b49`, the suite red at `d66ea67c0`, the green head at `5b33cdd2e`.
- **E15** — 2026-12-24, `bun packages/agentic-workflow/bin/agentic-workflow.mjs dimension-regression --base 15bcab21c4100f96c624bbffd4486cd0d521f969` · exit 0 · `verdict | clean` — the range touches one review surface (`docs/workflow/GATE_INVENTORY.md`, the gate row this unit adds) and the dimension set is unchanged at 20, so the new row re-verifies rather than drops a dimension.

## Next

P1 — the ledgers are frozen in this cut; the suite lands red next.

## References

- Issue [#704](https://github.com/gtrabanco/agentic-workflow/issues/704) — the
  request, its field record and its surface list.
- [fix #301](https://github.com/gtrabanco/agentic-workflow/issues/301) — the
  confirmed silent stall (closed; its reopen condition lived in a comment).
- [fix #260](https://github.com/gtrabanco/agentic-workflow/issues/260) — the
  landing that never triggered the reopen.
- `skills/triage-issue/references/ISSUE_PROCESS.md` — the condition lifecycle's
  owner.
- `packages/agentic-workflow/README.md` — the `delivery-conditions@1` grammar.
- `docs/workflow/GATE_INVENTORY.md` — the gate's carrier row.

## Branch

`fix/704-prose-conditions-stall`

## Depends on

none

## Regression scope

| scenario | verifies |
|---|---|
| the CLI's dispatch table still names every subcommand exactly once, and the README's usage line equals the bin's | `bun run --cwd packages/agentic-workflow test` (`cli.surface.test.mjs`) exits 0 |
| every help row still renders its own block and the registry equals the dispatch set | same command (`cli.help.test.mjs`) exits 0 |
| the normative-surface inventory still resolves every surface and every must-name value stays ordered | `bun test scripts/normative-drift.test.mjs` exits 0 |
| the gate inventory's rows, carriers and coverage still pass after the new row | `bun test scripts/prose-gate-inventory.test.mjs` exits 0 |
| the published vocabularies keep one home and no prose copy drifts | `bun test scripts/vocabulary-parity.test.mjs` exits 0 |
| the roadmap's own parsers and settle gate are untouched by this change | `bun run --cwd packages/agentic-workflow test` and `bun test scripts/roadmap-settle.test.mjs` exit 0 |
