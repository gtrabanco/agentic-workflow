---
type: feature
scope: medium
---

# 498 — shared-writer-driver

> One-line: a collision-safe write path for the repository's shared documents — a runtime writer driver (key-based splice, CAS, typed receipts) plus a file-class git merge-driver layer.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim
between the quote markers. Cut one requirement per distinct ask, in the order the
issue states them. **A later correction is appended under its own id**
(`S1a`, `S2a`, …) and never rewrites the id it corrects.

**S1 — Goal: two layers, forge-agnostic (issue Goal, verbatim).**
> A collision-safe write path for the repository's shared documents — the ones several concurrent sessions and PRs write and overwrite: `docs/ROADMAP.md` (both tables), `docs/workflow/SKILL_CONTEXT_BUDGETS.json`, `docs/workflow/REPOSITORY_STATE.md`, and the residual case of `docs/generated/**`. Today `docs/LOGS.md` is already collision-safe (journal fragments + deterministic aggregate) and `docs/generated/**` has a git merge driver (#420), but `ROADMAP.md` writes are whole-file rewrites with no concurrency guard (`src/edit/Roadmap.mjs` — last-write-wins), the `## Fixes` rows have no writer at all (edited by hand, per `RELEASE.md`: "no `NN` column, so `rowUpsert` does not apply"), and the other shared files have neither layer.
>
> Deliver it as two layers, forge-agnostic by construction:
>
> 1. **Runtime writer driver** (in `packages/agentic-workflow`, shaped like `journal-driver-contract@1`): key-based splice instead of whole-file rewrite, CAS — a write refuses with a named `stale-read` rejection when the file changed since the writer's read —, typed receipts, shared conformance suite, predictable failure. Pure Node; no git, no network.
> 2. **Git merge-driver layer** (generalizing the #420 pattern by file class): mechanical union of independent edits (e.g. two branches each inserting a different roadmap row), and semantic conflicts (both branches flipping the same row's status cell) surfaced as a real merge conflict — never silently resolved. Plain git local mechanics: runs wherever a `git merge` runs, no GitHub or forge API involved. CI already validates the post-merge result.

**S2 — Business value (issue, verbatim).**
> Parallel sessions/lanes (the batch-scheduler direction) stop losing each other's writes on shared index documents; integrations of `main` into feature branches stop producing hand-merge work on rows no author actually touched; the CLI gains the missing writers so no shared file is edited by hand.

**S3 — In scope (issue, verbatim bullets).**
> - Writer-driver contract in `packages/agentic-workflow` + shared `runDriverConformance`-style suite; ROADMAP `rowUpsert`/`annotate` and a new `## Fixes`-row writer on top of it.
> - File-class git merge drivers: `docs/ROADMAP.md` (row union by key; status-cell conflict surfaced), `docs/workflow/SKILL_CONTEXT_BUDGETS.json` (structural merge or fail-closed refusal — decide at plan), `docs/workflow/REPOSITORY_STATE.md` (frozen facts — decide at plan), `docs/generated/**` residual aligned with the existing driver.
> - CLI surface in the `agentic-workflow` bin for the new write operations (receipts, `--json`).
> - Docs ownership: AGENTS.md ownership line, `docs/workflow/GATE_INVENTORY.md` rows, package README contract block, normative-surfaces table rows for any new vocabulary.

**S4 — Out of scope (issue, verbatim bullets).**
> - Forge-side merge machinery or any forge API (CI already validates post-merge; unchanged).
> - A lock service or daemon; `docs/LOGS.md` and changesets (already collision-safe).
> - New skills (writers are consumed through the existing skills' prose + the CLI).

**S5 — Acceptance criteria (issue, verbatim bullets).**
> - Two concurrent writers to the same `ROADMAP.md` in one checkout: the second write refuses with `stale-read` (CAS) instead of last-write-wins; the receipt names both revisions.
> - A `## Fixes` row is writable via the CLI (no hand edit).
> - Merge driver: two branches each inserting a different row merge mechanically into the union; two branches flipping the same row's status exit nonzero and leave a real conflict for the human/agent.
> - A driver that rewrites foreign bytes, drops lines, or accepts a stale read fails the shared conformance suite.
> - Red-first sibling suites (red commit then green), bun-first, context budgets within ceilings, no network in any layer.
> - Docs updated in the same PR (README, GATE_INVENTORY, AGENTS.md row).

**S6 — Dependencies (issue, verbatim).**
> None — nothing must merge first. Related (soft order, no blocker): #420 (`docs-generated` merge driver — this generalizes its pattern to file classes), and the journal driver contract in `packages/agentic-workflow/README.md` (the contract shape this driver mirrors).

**S7 — Open questions / risks (issue, verbatim).**
> - Merge-driver config is per-checkout (`--install`), a git limitation already documented in #420 — the arming step must be documented beside `--install-hook`.
> - `REPOSITORY_STATE.md` is resolver-only: should the merge driver refuse non-resolver sides, or only union? (decide at plan)
> - `SKILL_CONTEXT_BUDGETS.json`: structural JSON merge vs fail-closed refusal. (decide at plan)
> - Size: at triage, consider splitting into two dependent units — runtime layer first, git layer second.

### Frozen request (verbatim, §1)

- **S1** — "Apply to this repository: issue #498" (the user's entire message; issue #498's body carries the requirements quoted above). The user message also carries the governing local workflow (intent resolution, frozen-failure corpus, fixtures-first, inline work, ledger freeze, test-first differential slices, docs-and-state-in-change, writer verification, correction bounds) — it is the process authority for this unit, not a requirement the deliverable implements.

**Interpretation decisions** (recorded, not silent):

- **D1 — unit home.** The workflow's §5 names `docs/fix/<issue>-<topic>/` as the ledger home; #498 is a feature (roadmap Features table, `feat/` branch, label `feature`), and the repo's routing reads feature unit docs from `docs/features/<n>-<topic>/` (precedent: inline-applied features #388, #427, #105). The unit is cut here, with the feature template. A feature unit doc in `docs/fix/` would break `roadmap check`'s path-based kind detection.
- **D2 — split decision (S7 bullet 4).** One unit, two ordered layers: P1–P3 build and gate the runtime layer before the git layer starts (P4–P5). The issue's split recommendation ("runtime layer first, git layer second") is preserved as intra-unit phase order; the inline application delivers one branch and one diff, so two dependent units would only duplicate the ledger ceremony without changing the merge order.
- **D3 — budgets class (S7 bullet 3).** `SKILL_CONTEXT_BUDGETS.json` gets a **structural merge**: recursive union keyed by JSON object key (per-skill/route keys are the common case), differing leaf scalars on the same key surface as a real conflict. Rationale: the file mixes owner-set ceilings with measured counts; two branches touching different skills is the common case, and two branches setting the same ceiling differently is a genuine decision conflict a union must never hide.
- **D4 — repository-state class (S7 bullet 2).** `REPOSITORY_STATE.md` is resolver-only, so the merge driver **fails closed always**: any concurrent side change to frozen facts is a conflict for the resolver, never unioned. A merge driver that silently unions two edits to frozen facts would fabricate a state neither side wrote.
- **D5 — CAS scope.** CAS (`stale-read`) is enforced when the caller supplies the revision it read (`expected`); without it, the write behavior is byte-identical to today (differential-pinned, O6). Existing CLI callers and skill prose are unchanged; new calls use `roadmap read` → `--expect <hash>`.

## Impact

- Consumers of `packages/agentic-workflow/src/edit/Roadmap.mjs`: the CLI (`roadmap rowUpsert`/`annotate`/`check`), the settle validators and sensors that read its receipts. Receipt shapes stay (`service/op/path/schema/before/after/ok`); the write path beneath them becomes splice + optional CAS.
- New consumers: the fixes-row writer (`roadmap fixrow`) for the release step that today hand-edits the Fixes table; the merge drivers at merge time (armed per checkout).
- `cli.surface.test.mjs` pins the README usage line to the bin's subcommand tokens — no new top-level subcommand is added (all new ops live under `roadmap`), so the usage line does not move; the README's roadmap prose gains the new operations.
- `.gitattributes` gains three file-class lines; unarmed checkouts degrade to git's textual merge (the same documented degradation #420 accepts), and `--install` arms the drivers.
- `docs/ROADMAP.md` edits (row settle) re-render the docs projection — via `bun scripts/docs-generate.mjs`, never hand-edited.
- Budgets: `AGENTS.md` grows the ownership line; measured at the change with `bun scripts/check-skill-context.mjs --documents`, ceilings re-pinned through the emitter only if a ceiling moves.

## Retirements

- The hand edit of `## Fixes` rows: `skills/unit-lane/references/RELEASE.md` states "no `NN` column, so `rowUpsert` does not apply" — replaced by the `roadmap fixrow` writer; replacement evidence: `rg -n 'rowUpsert does not apply' skills/ docs/` → 0 matches after the change.
- Nothing else: #420's `scripts/docs-generated-merge.mjs` stays (this unit generalizes the pattern by class, it does not replace the projection driver); the whole-file `writeFileSync` in `Roadmap.mjs` is replaced by the driver's splice write.

## Non-goals

- No forge-side merge machinery or forge API (S4).
- No lock service or daemon; `docs/LOGS.md` and changesets untouched (S4).
- No new skills; no edits to existing skill prose (S4).
- No CAS retrofit of other writers (`Budgets.mjs`, `Changelog.mjs`, `Manifest.mjs`, `UnitDoc.mjs`) — the driver is the shared base those can adopt later; this unit lands the contract + the roadmap family, per S3 scope.

## Risk tier

- **Tier** — `standard` · **Task Size** — Understood + contained risk + resumable from diff (verdict re-cut at P7 with `bun scripts/ceremony.mjs tier classify` over the change's paths; recorded in the `## Log`).
- **Named high-risk item** — none — not a high-tier unit.

## Future

- **2026-11-10 (owner, open)** — migrate the remaining writers (`Budgets.mjs`, `Changelog.mjs`, `Manifest.mjs`, `UnitDoc.mjs`) onto the shared driver. This unit never implements it.

## Future cost

- Every future writer over a shared document implements through `writer-driver-contract@1` and runs `runWriterConformance` before it ships (binds future contributors; owner: the package README contract block).
- A new file class (a new shared document) is registered in one place — the class map in `scripts/shared-doc-merge.mjs` — with its `.gitattributes` line and install entry; never a fourth ad-hoc driver (binds future units touching shared docs).

## Applicable tests

- `packages/agentic-workflow/test/writer.driver.test.mjs` (new — driver core, CAS, conformance harness catches violating writers)
- `packages/agentic-workflow/test/edit.test.mjs` (existing roadmap writer behavior holds; fixes-row writer; CAS refusal)
- `packages/agentic-workflow/test/cli.surface.test.mjs` (README usage parity — unchanged tokens)
- `scripts/shared-doc-merge.test.mjs` (new — fixture git merges: union, conflict, fail-closed classes, install)
- Root suite + `bun scripts/docs-generate.mjs --check` + `bun scripts/check-skill-context.mjs` (routes and documents)

## Known pre-existing issues

- **LOGS.md:2306 (unit 32 finding F19: "roadmap write clobbered by merge")** — affects: this unit exists to close that failure class; the runtime CAS half covers same-checkout writers, the merge-driver half covers branch integrations.
- **The features table is not number-sorted** (rows 99/104/100/101/…): does-not-affect — the union driver appends new rows deterministically at the end of the table block, it never re-sorts.

## Tasks

- P1 — Crate writer-driver core: `src/writer/driver.mjs` (`WRITER_REFUSAL_REASONS`, `WriterError`, `readShared`, `writeShared` with key-splice + CAS `stale-read` + atomic write + typed receipts) and `runWriterConformance` (`src/writer/conformance.mjs`); RED suite first (`test/writer.driver.test.mjs`) (validator: `bun test packages/agentic-workflow/test/writer.driver.test.mjs` exits 0)
  (Implements: S1, S5)
  Relevant files: packages/agentic-workflow/src/writer/driver.mjs, packages/agentic-workflow/src/writer/conformance.mjs, packages/agentic-workflow/test/writer.driver.test.mjs
- P2 — Roadmap writers re-based on the driver: `rowUpsert`/`annotate` write through `writeShared` (key-based splice; whole-file rewrite gone), optional `expected` CAS; new `fixRowUpsert` for the `## Fixes` table (keyed by issue number); existing receipt shapes preserved (validator: `bun test packages/agentic-workflow/test/edit.test.mjs` exits 0)
  (Implements: S1, S3, S5)
  Relevant files: packages/agentic-workflow/src/edit/Roadmap.mjs, packages/agentic-workflow/test/edit.test.mjs
- P3 — CLI surface: `roadmap read` (read-only revision receipt), `--expect` on `rowUpsert`/`annotate`/`fixrow`, `roadmap fixrow`; README roadmap prose gains the new operations (validator: `bun test packages/agentic-workflow/test/cli.surface.test.mjs` exits 0)
  (Implements: S2, S3, S5)
  Relevant files: packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/README.md
- P4 — Merge library in the crate: `src/writer/merges.mjs` — `unionTableRows` (row union by key within one table block; status-cell conflict surfaced) and `structuralJsonMerge` (recursive union, differing leaves conflict); RED tests first (validator: `bun test packages/agentic-workflow/test/writer.merge.test.mjs` exits 0)
  (Implements: S1, S5, S7)
  Relevant files: packages/agentic-workflow/src/writer/merges.mjs, packages/agentic-workflow/test/writer.merge.test.mjs
- P5 — Git merge-driver layer: `scripts/shared-doc-merge.mjs` (classes `roadmap`/`budgets`/`repo-state`, fail-closed refusal shape, `--install`, conflict-marker output + exit 1 on semantic conflict) + `.gitattributes` lines; RED sibling suite first in its own commit (validator: `bun test scripts/shared-doc-merge.test.mjs` exits 0)
  (Implements: S1, S5, S7)
  Relevant files: scripts/shared-doc-merge.mjs, scripts/shared-doc-merge.test.mjs, .gitattributes
- P6 — Docs ownership: package README `writer-driver-contract@1` block, AGENTS.md ownership line, `docs/workflow/GATE_INVENTORY.md` rows, normative-surfaces rows for the new vocabularies, RELEASE.md prose repair, `.changeset/` entry (validator: `bun test scripts/normative-drift.test.mjs` exits 0 and `bun test scripts/prose-gate-inventory.test.mjs` exits 0)
  (Implements: S3, S5)
  Relevant files: packages/agentic-workflow/README.md, AGENTS.md, docs/workflow/GATE_INVENTORY.md, skills/unit-lane/references/RELEASE.md, .changeset/
- P7 — Verification and state: differential against base, root gate, budgets, docs projection re-render, roadmap row settle through the new writer, LOGS entry, obligations closed (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S5, S6)
  Relevant files: docs/ROADMAP.md, docs/LOGS.md, docs/generated/

## Triaged steps

> Not pasted: this unit is applied inline under the owner's local workflow (§4), which substitutes the ledger freeze for the lane's plan step and forbids running the repo's review machinery on its own surgery. `unit-route.mjs --triage` output is not available offline here; the Tasks section above is the phase cut.

## Findings

OPEN rows only: a row a review persisted as fix-now work and no fold has closed
yet. A folded row leaves this table and becomes a `## Log` line. Rows are appended
by `review-change` and `triage-issue`; this unit is reviewed by the owner (external
verifier), never by the repo's own machinery (§4).

```text
findings-table@1
column | shape | what it holds
id | F<n> | the stable finding id a fold and a log line cite
target | S<n> · <file>:<line> | the requirement or the location the finding names
axis | <axis> | the review axis that found it
severity | BLOCKER \| CRITICAL \| WARNING \| SUGGESTION | the published ladder
impact | blocking \| docs-only \| report-only | whether the finding affects behaviour
class | product \| plan \| source \| environment \| runtime | the owner that repairs it
route | fold \| replan-in-unit \| decision-required \| product owner — … \| <free prose> | where the row goes
```

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

Append-only. `L1` is the request verbatim; every later line carries one kind
token from the closed set in `log-kind@1`. Evidence and gate lines carry the
command and its exit code, so a reviewer re-runs a line instead of trusting a table.

```text
log-kind@1
kind | token | what the line records
L | L<n> | the request or a correction, quoting the requester verbatim
E | E<n> | an evidence run — the command, its exit code and its output
G | G<n> | a gate run — the command and its exit code
F | F<n> | a folded finding — the fold commit and what was verified
D | D<n> | an owner decision — the authority and what was decided
P | P<n> | a phase's progress — what was done and the commit
R | R<n> | a review run — `HEAD <sha>`, the verdict, the cycle and the gate exit
V | V<n> | a finding's verification — the row it signs, the recheck and its result
```

- **L1** — 2026-11-10, the request, verbatim:
  ```
  Apply to this repository: issue #498
  ```
- **P1** — 2026-11-10, unit doc + planning ledgers cut at base `27275c94`; frozen-failure corpus extracted (FF-1 last-write-wins clobber — LOGS.md:2306 unit-32 F19; FF-2 Fixes rows have no writer; FF-3/FF-4 merge union and status-conflict absent).

## Next

P1 RED: write `test/writer.driver.test.mjs` failing on the missing module, commit the red, then implement the driver core.

## References

- Issue [#498](https://github.com/gtrabanco/agentic-workflow/issues/498) · roadmap row 498.
- Soft-related: #420 (`docs-generated` merge driver — the generalized pattern), journal driver contract (`packages/agentic-workflow/README.md`).
- Governing workflow: the owner's local apply protocol (§0–§9 of the apply request).
