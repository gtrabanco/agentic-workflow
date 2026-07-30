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

## Tool-calling smoke test (model precondition)

Executor-path skills only work if the model can drive tools (read/edit files,
run commands). Before trusting **any model not yet validated for OpenAI-style
function calling** in the executor path — providers typically validate tool
calling on some models and not others (e.g. Gemma4's tool calling is
documented in an XML format, not the OpenAI `tools` schema) — run this once
per model, before step 3 above:

1. Send one chat request with a single trivial tool defined (e.g.
   `get_time`, no parameters) and a prompt that requires it ("What time is
   it? Use the tool.").
2. Pass only if: ✓ `finish_reason` is `tool_calls`; ✓
   `choices[0].message.tool_calls[0].function.name` names the tool; ✓
   `arguments` is parseable JSON (here: `{}`).
3. Any other shape (tool call narrated in prose, XML in `content`, empty
   `tool_calls`) = **FAIL** — do not use that model for executor-path runs;
   it can still serve non-agentic roles (single-shot review prose, vision).

Record the result as a run-log row (`Skill(s)` column: `tool-calling smoke`).

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
| 2026-07-12 | n/a — no weaker model available in this session | `plan-feature` 3.1.0, `plan-feature-scaffold` 1.9.0 (fix #51) | NOT RUN | Superseded by the row below — an earlier session had no weaker fleet model available and substituted a manual read-through. Kept here for the audit trail. |
| 2026-07-12 | Claude Haiku 4.5 (weakest model available in this session's fleet) | `plan-feature` 3.1.0, `plan-feature-scaffold` 1.9.0 (fix #51) | PASS | Two live runs against the fixture (`docs/features/99-csv-export-command`, scratch copies): (A) roadmap row pre-set to `planned` → `plan-feature 99-csv-export-command` correctly STOPPED at the already-planned short-circuit, printed the exact `→ Next: /execute-phase 99 P1 …` block verbatim, never invoked `plan-feature-scaffold`, touched no files. (B) roadmap row pre-set to `defined` → routed through `plan-feature-scaffold`, which wrote `defined → planned`, then performed a **distinct re-read step** (separate `Read` tool call after the `Edit`) confirming the row literally read `planned` before ending the turn; completion report matched the fixed `SCAFFOLD …` contract; no invented steps in either run. Closes the "owed" weak-model run flagged in the row above. |
| 2026-07-13 | Claude Haiku 4.5 (weakest model available in this session's fleet) | `review-change` 2.2.0, `execute-phase` 2.2.0, `workflow-status` 1.6.0 (feature 17, `finding-severity-routing`) | PASS | Three live subagent runs against the fixture (`docs/features/99-csv-export-command`, scratch copy at `/private/tmp/…/golden-fixture-99/`), fed the exact process-step text (no paraphrase): (A) `review-change`'s persist step (its process step 9), given one synthetic fix-now finding (`src/csv/export.ts:42`, axis `tests`, `Sev: med`) on an unmerged unit → wrote `review-findings.md` with the fixed schema verbatim, `id: F1`, `folded: no`, no invented steps. (B) `workflow-status`'s emit step (its process step 9), reading that same file → produced the exact JSON item `{id: "F1", file: "src/csv/export.ts:42", axis: "tests", severity: "med", class: "fix-now", route: "fold into phase", suggested_tier: "cheap"}` — correctly derived `cheap` (severity not `high`, axis not in the subtle set) purely from the mechanical table, stayed read-only. (C) `execute-phase`'s fold-cycle checklist box, given "F1 just fixed and committed" → flipped only the `folded` column to `yes`, no other edit. All three: zero ambiguity reported, zero invented steps — the ledger + matching envelope item round-trip end-to-end through a weak model exactly as specified. |
| 2026-07-17 | Claude Haiku 4.5 (weakest model available in this session's fleet) | `fold-findings` 1.0.0, `review-change` 2.3.0, `execute-phase` 2.3.0 (fix #65, `fold-findings-skill`) | PASS | Three live runs, fed the exact quoted section text (no paraphrase): (A) `fold-findings` — a real toy git repo (`/private/tmp/…/golden-fixture-65/repo`, branch `fix/99-csv-export-command`, no PR) with a one-row ledger (`F1`, axis `tests`, `folded: no`) for a missing empty-record-set test in a CSV exporter; given the skill's definition-of-fixed checklist, forbidden list, and process verbatim, the model diagnosed the real root cause (missing test, not a code bug — correctly left `export.ts` untouched), added the test, flipped `folded: no → yes`, committed (`fix(csv-export): fold F1 — add test for empty record set`, sha `b3c4b42`) with the fixed report line `| F1 | verdict: FOLDED b3c4b42 |` + `Folded: 1/1 · Disputed: 0 · Blocked: 0`, and correctly withheld the push per the toy-fixture's no-PR exception — zero scope bleed, zero invented steps. (B) `review-change`'s step 11 `Decision: FAIL` block, given one open fix-now finding and no recurring drift — reproduced the `→ Next: /fold-findings — …` block verbatim as separate literal lines (no `·`-joined prose), correctly omitted the product-audit line. (C) `execute-phase`'s fold-cycle section, given an open-PR branch — correctly named `/fold-findings` as the preferred hand-off, reproduced the inline-fallback checklist verbatim when asked for it, and correctly stated `git push` runs immediately after the commit. All three: zero invented steps. |
| 2026-07-17 | Claude Haiku 4.5 (weakest model available in this session's fleet) | `plan-feature-scaffold` 1.10.0, `plan-fix` 2.2.0, `execute-phase` 2.4.0 (fix #64, `phase-atomicity-lint`) | PASS | Three live text-reasoning runs, fed the exact quoted section text (no paraphrase), against a deliberately non-atomic toy `P1 — implement export and import commands` phase (9 tasks, `and`-joined title, 4 layers mixed, a `Decide`/`OR` decision task, a runtime-conditional `--skip-dupes` flag, a manual spreadsheet-verification task inside the implementation phase, and a non-machine-checkable done-when): (A) `execute-phase`'s Phase-lint pre-flight guard — correctly failed all 8 boxes with a one-line reason each, STOPPED before any edit, and reproduced the `PHASE-LINT GATE … BLOCKED` fixed block verbatim including the `→ Next:` sub-bullets. (B) `plan-feature-scaffold`'s emit-time Phase-lint checklist item — correctly refused to emit the phase as-is and produced a re-cut splitting it along layer/deliverable lines (separate api/hardening/ui/docs/schema/close-out phases), per the mandatory-split rule. (C) `plan-fix` Algorithm steps 12–13 — confirmed both gate emission on the same 8-box canonical lint with no invented alternate lint. All three: zero invented steps, fixed blocks rendered exactly. |

| 2026-07-17 | Claude Haiku 4.5 (weakest model available in this session's fleet) | `audit-pr` 3.2.0 (fix #78, `audit-pr-closure-integrity`) | PASS | Two live runs, fed the exact quoted "Closure integrity" gate table row + fixed-output block (no paraphrase), each against a scratch feature SPEC (`/private/tmp/…/golden-fixture-78/`): (A) `spec-hollow.md` — a `## Capability closure` block with one blank `Read/list` row (unchecked, no UI/API/test, no `n/a:`) → correctly evaluated Box 2 as failed, returned **BLOCKER**, cited the exact blank row, emitted a closure-integrity blocker line naming the row. (B) `spec-legacy.md` — no `## Capability closure` heading at all → correctly returned **WARNING** (never a blocker), emitted the dated `design-debt: closure absent, SPEC predates the rule (dated 2026-07-17)` line verbatim, and named the retrofit mechanism (`/design-feature <slug>` before further work). Both runs: zero invented steps, fixed-output text rendered exactly. |
| 2026-07-17 | Claude Haiku 4.5 (weakest model available in this session's fleet) | `execute-phase` 2.5.0 (fix #66, `scope-bleed-guardrail`) | PASS | Two live runs, fed the exact quoted "Descope guard" section text verbatim, each against the fixture SPEC (`/private/tmp/…/golden-fixture-66/SPEC.md`, P1 with one unticked task "Empty record set → header-only file, exit 0"): (A) candidate issue "Support empty record set as a follow-up … ship export-csv without it for now" → correctly classified **descope** (overlaps the unticked P1 task), stated it would STOP before creating the issue, request user approval, and log the canonical `## Amendments` row before ever filing the issue — never invented a workaround, never created the issue first. (B) candidate issue "Add a gzip-compression option … not something the current SPEC asks for" → correctly classified **discovered work** (outside every acceptance criterion/task, matches the SPEC's own "Out of scope" framing), stated it would file the issue immediately with no amendment or approval needed. Both runs: zero invented steps, correct classification on both sides of the discovered-vs-descope boundary. |
| 2026-07-18 | Claude Haiku 4.5 (weakest model available in this session's fleet) | `review-change` 2.4.0 (fix #76, `adversarial-weak-fleet-usability`) | PASS | One live run, fed the exact quoted "Reviewer contract" and "Merge contract" section text verbatim, against a toy CSV-export diff introducing a command-injection + path-traversal bug: (A) filled the reviewer-contract template as reviewer R2 (security/inputs adversary) and returned exactly the contracted `Return exactly:` table — two rows, no extra sections, no invented commentary. (B) applied the merge contract to R1's + R2's tables: correctly deduped by `file:line`+axis (kept the two findings as separate rows since their `file:line` differ), added the `Reviewers n/N` column (`2/2` for the row both flagged, `1/2` for the one only R2 raised), respected the ≥1 inclusion threshold (kept the `1/2` row, no majority gate), and violated none of the forbidden list (no drop/downgrade/reclassify). Self-reported ambiguity was limited to inferring exact line numbers from a diff that lacked them (a fixture artifact, not a wording gap) — zero invented steps against the contract itself. |
| 2026-07-18 | Claude Haiku 4.5 (weakest model available in this session's fleet) | `execute-phase` 2.6.0 (fix #77, `review-checkpoint-cadence-triggers`) | PASS | Two live runs, fed the exact quoted "Review checkpoint triggers" section and the fixed "Checkpoint hand-off" block verbatim, no scenario code available (text-only): (A) phase declaring `domain` followed by a next phase declaring `api`, small 180-line/3-file diff, no sensitive touch → correctly fired only the **layer boundary** trigger, reproduced the fixed hand-off block exactly with `<trigger name>` = "layer boundary" and the cited evidence phrase, correctly filled `<next phase>` = P4. (B) two same-`ui`-layer phases in a row, 40-line/2-file diff, no sensitive touch → correctly fired **no** trigger and, per the "No trigger fired? Omit the checkpoint line" rule, produced the shortened ending naming only the next phase — no invented checkpoint line, no invented extra steps. Both runs: zero invented steps, fixed blocks rendered exactly. |

| 2026-07-30 | Qwen3 8B (`qwen3:8b`, weakest local tool-capable model) | `tool-calling smoke`, `execute-phase` 2.9.0 (issue #111, opportunistic-finding policy) | PASS | Tool-calling smoke returned `tool_calls` with `get_time` and parseable `{}` arguments. One live text-reasoning run, fed the policy verbatim with the CSV-export fixture context: (A) 1-line unused local variable in an already modified file → `Autofix`; (B) 18-line / 2-file serializer-consistency correction in the touched file plus its directly-covering test → `Opportunistic Fix`; (C) 90-line / 6-file pluggable serializer dependency requiring product judgment → `Create Issue`. It selected `fallback`, emitted the exact `decisions.md` table header and all three rows with the supplied date, and invented no policy step. |

## Scope boundary

Manual first, no CI, no runnable script. This is deliberately the cheapest
thing that catches weak-model regressions today. Graduate to automation only
if the manual procedure repeatedly catches regressions and the maintenance
cost is justified — that is a separate, future unit, not scheduled here.
