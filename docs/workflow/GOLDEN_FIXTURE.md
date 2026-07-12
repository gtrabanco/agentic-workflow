# Golden fixture procedure

> 🇪🇸 [Versión en español](GOLDEN_FIXTURE.es.md)

A repeatable smoke test for skill wording: run a small, fixed toy feature
through a changed skill **with the weakest model in your fleet**, and check
its contracted output still holds. This is U9 of the 2026-07-09 backlog
([#19](https://github.com/gtrabanco/agentic-workflow/issues/19)); it closes the
enforcement gap feature 08 (`phase-economics`) deferred to it
(`docs/features/08-phase-economics/known-issues.md`).

## Purpose

CLAUDE.md's "Checklists over heuristics" section promises that every skill
"must run correctly on any agent and any model." That promise is untested:
skill bodies get reworded freely, and a rewording a frontier model absorbs
without trouble can silently break a weak local model (Qwen3.6 35B /
Gemma4 26B) executing a phase — a dropped turn-contract box, a fixed output
block rendered loosely, an invented step. This procedure catches that
regression before it ships, manually, with no infrastructure.

## When to run

After editing any **executor-path** skill: `execute-phase`, `plan-feature`,
`plan-feature-scaffold`, `plan-feature-from-issue`, `design-feature`, or any
skill in the `review-*` pack. Optional but recommended before opening the PR
for that edit.

## The fixture

A fixed toy feature — **"add a CSV export command"** — with a pre-written toy
SPEC and the one-line issue text it stands in for.

For skills that take a raw idea or issue as input (`design-feature`,
`plan-feature-from-issue`), use this one-liner instead of the SPEC below:

> Add an `export-csv` command to the toy CLI that writes the current
> in-memory record list to a CSV file at a given path.

For every other executor-path skill (`execute-phase`, `plan-feature`,
`plan-feature-scaffold`, the `review-*` pack), use the pre-written toy SPEC
below — it's already `designed`, so those skills can run directly against it.
Copy whichever block you need to a scratch location (e.g. your scratchpad);
do **not** commit it as a feature folder under `docs/features/`.

```markdown
# 99 — csv-export-command

## Goal

Add a `export-csv` command to the toy CLI that writes the current in-memory
record list to a CSV file at a given path.

## Branch

`feat/99-csv-export-command`

## Size

`XS` — single command, no new dependencies, 2 phases.

## Dependencies

None.

## Product half

### Context

Users currently can only view records on screen; they want a file they can
open in a spreadsheet.

### Scope

#### In scope
- `export-csv <path>` command: writes all records to `<path>` as CSV
  (header row + one row per record).

#### Out of scope
- Filtering, sorting, or partial export — always exports the full record set.

### Acceptance criteria
- Running `export-csv out.csv` creates `out.csv` with a header row and one
  data row per record.
- Running it with no records writes a header-only file (exit 0).

## Design status

`designed`

## Engineering half

### Design

One new command handler that serializes the in-memory record list to CSV and
writes it to the given path; reuse the project's existing file-write helper
if one exists.

### Phases

#### P1 — implement `export-csv`

- [ ] Command handler writes a header row + one row per record to `<path>`
- [ ] Empty record set → header-only file, exit 0

#### P2 — Hardening & PR

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the roadmap row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat
- [ ] Update the roadmap row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #<n>` and push
```

## The procedure

1. **Pick the changed skill** — the one whose `SKILL.md` you just edited.
2. **Set the agent to the weakest model in your fleet** — name the current
   floor (Qwen3.6 35B / Gemma4 26B) if you don't have a weaker one available;
   otherwise use whatever is weakest in your fleet today.
3. **Run the changed skill against the fixture**, following its `SKILL.md`
   literally — no extra hand-holding, no filling gaps the model should fill
   itself.
4. **Observe the output** against the fixed pass criteria below.

## Fixed pass criteria

Pass only if **every** box holds:

- ✓ Every fixed output block prints **exactly** as contracted (`Return
  exactly` blocks, checklists, `PASS | FAIL` verdicts, turn-contract boxes) —
  not paraphrased, not partially rendered.
- ✓ Branch and commit discipline held — branched off `main`, conventional
  commit message, never worked directly on `main`.
- ✓ **No invented steps** beyond what the skill's `SKILL.md` states.
- ✓ The closing `→ Next:` block was printed.

Any unchecked box = **FAIL**. The fix is a wording tightening of the skill
(a separate, targeted change) — per feature 08's dependency-direction note,
this procedure only surfaces the regression, it never edits the skill itself.

## Run log

One row per run. Append a row after every run so coverage stays auditable
over time.

| Date | Model | Skill(s) + version | Result | Note |
|------|-------|--------------------|--------|------|
| 2026-07-10 | Qwen3.6 35B | `execute-phase` 1.x | PASS | example row — replace on first real run |

## Scope boundary

Manual first, no CI, no runnable script. This is deliberately the cheapest
thing that catches weak-model regressions today. Graduate to automation only
if the manual procedure repeatedly catches regressions and the maintenance
cost is justified — that is a separate, future unit, not scheduled here.
