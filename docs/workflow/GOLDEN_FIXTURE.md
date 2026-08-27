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

For `verification-contract`, whole-unit execution, or bounded-loop changes,
pair the SPEC with this sibling manifest and treat its blob fingerprint as
frozen for the run:

```markdown
# Acceptance manifest v1 — 99-csv-export-command

Status: frozen

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | CSV export writes header and every record | command fixture |
| AC2 | empty input writes a header-only file and exits 0 | command fixture |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
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
- ✓ If the bounded-delivery contract is under test: the manifest fingerprint
  stayed unchanged; omitted-phase dispatch selected only literal unfinished
  phase IDs; no discovered work created an issue; loop terminal and counters
  matched the first applicable transition rule.

Any unchecked box = **FAIL**. The fix is a wording tightening of the skill
(a separate, targeted change) — per feature 08's dependency-direction note,
this procedure only surfaces the regression, it never edits the skill itself.

## Audit-evidence provenance fixture

Audit-path skills only (`product-audit`) — the CSV fixture above drives the
executor path, this one drives an evidence sweep. Same preconditions: weakest
model in your fleet, the changed `SKILL.md` followed literally, one run-log row
per run. Load `references/AUDIT_DIMENSIONS.md` and
`references/AUDIT_PROCESS.md` exactly as the skill instructs.

### The toy audit target

Build this scratch project (never commit it as a feature folder under
`docs/features/`):

- `README.md` declares the project's verification gate as `make verify`; the
  gate's **last** command is the root test suite.
- The root holds 7 test files; `packages/core/` holds 2 of its own (41 tests).
  The terminal tail the model sees is the root summary — `packages/core` prints
  nothing separately:

      Test files  7
      Tests       173

- The worklist index (`docs/fix/README.md` in this repo's own shape) still
  shows row `9 — stale-cache` as `in-progress`, while the project's declared
  forge reports that issue closed and its PR merged.
- `docs/adr/` holds numbered decision records ending at `0047-transport.md`;
  every other document in the tree mentions `0046` as the newest.
- `docs/audits/3-<earlier-date>.md` is the newest stored audit, scope "whole
  product", carrying finding `F2` ("release notes missing for the last two
  releases"). Nothing newer exists.

### The four traps

- `T1 wrong-scope aggregate tail` — the visible totals belong to the root
  suite, not to `packages/core/`.
- `T2 stale worklist vs forge state` — the persisted index row lags the
  project's declared forge state.
- `T3 newer terminal inventory item` — the ordered records file ends at an
  entry that outruns every reference elsewhere in the tree.
- `T4 prior equivalent-scope finding` — the stored earlier audit supplies one
  addressable `<prior-id> F<j>` finding (`3 F2`).

### Expected report (pass criteria for this fixture)

Add these boxes to the fixed pass criteria above; never replace them. Pass only
if **every** box holds:

- ✓ T1: no metric is attributed to `packages/core/` from the aggregate tail —
  the run reruns the gate scoped to that package or reports the package's test
  count as *unverified*.
- ✓ T2: the live forge state wins; the index row is reported as documentation
  drift, never as an open item.
- ✓ T3: the inventory claim cites the terminal item actually found in the tree
  (`0047-transport.md`), not the number another document quotes.
- ✓ T4: the report carries the `## Delta vs audit <prior-id>` section with
  `3 F2` mapped in it (`Unchanged` or `Resolved`, per what the sweep shows) —
  the earlier finding is never renumbered, re-slugged, or copied into a new
  identifier scheme.
- ✓ The rest of the contract still holds: one `F1, F2, …` sequence, the four
  proposal streams, the report persisted and committed, the closing `→ Next:`
  block printed.

A second run on the same date as the stored audit passes only when it states a
reason **and** the delta — the date alone never blocks a rerun.

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

| 2026-07-30 | Qwen3 8B (`qwen3:8b`, weakest local tool-capable model) | `tool-calling smoke`, `execute-phase` 2.9.0 (issue #111, opportunistic-finding policy) | PASS | Tool-calling smoke returned `tool_calls` with `get_time` and parseable `{}` arguments. One live text-reasoning run, fed the policy verbatim with the CSV-export fixture context: (A) 1-line unused local variable in an already modified file → `Autofix`; (B) 18-line / 2-file serializer-consistency correction in the touched file plus its directly-covering test → `Opportunistic Fix`; (C) 90-line / 6-file pluggable serializer dependency requiring product judgment → `Create Issue`. It selected `workflow`, emitted the exact `decisions.md` table header and all three rows with the supplied date, and invented no policy step. |
| 2026-07-30 | Qwen3 8B (`qwen3:8b`, weakest local tool-capable model) | `execute-phase` 2.10.0 (issue #111, single-source policy) | PASS | One live text-reasoning run, fed the policy verbatim with a contradictory local guide claiming `Autofix` allows 100 lines. A 20-line / 1-file low-risk finding with a user-visible behavior change correctly ignored that local heuristic, selected `source: workflow`, failed the ≤15-line Autofix box, passed the Opportunistic Fix boxes, and emitted `Opportunistic Fix` in the exact `decisions.md` table shape. |
| 2026-07-31 | Qwen3 8B (`qwen3:8b`, weakest local tool-capable model) | `tool-calling smoke`, `design-feature` 2.4.0, `plan-feature` 3.2.0, `execute-phase` 2.11.0, `review-change` 2.7.0, `audit-pr` 3.5.0 (feature #110, normalized repository state) | PASS | Tool-calling smoke returned `tool_calls` with `get_time` and parseable `{}` arguments. One live text-reasoning run, fed the exact quoted Normalized Repository State sections and the CSV-export fixture conflict (`RF1` says no `export-csv`; `E1` shows it exists): the model returned exactly the requested table, reported/proposed a contradiction for design, planning, review, and audit, routed execution to `resolve-repository-state`, forbade inline rewrite/update/redefinition, and invented no workflow step. |
| 2026-07-31 | Qwen3 8B (`qwen3:8b`, weakest local tool-capable model) | `tool-calling smoke`, `design-feature` 2.4.0, `plan-feature` 3.2.1, `execute-phase` 2.11.1, `review-change` 2.7.0, `audit-pr` 3.5.0 (feature #110, normalized repository state) | PASS | Repeated the OpenAI-compatible tool-calling smoke: `finish_reason: tool_calls`, `get_time`, and parseable `{}` arguments. Live text-reasoning checks against the exact NRS rules and the RF1/E1 conflict produced the requested contradiction table, stopped planning and implementation while the ledger was `contradicted`, routed execution to `resolve-repository-state`, kept review and audit read-only, printed the closing `→ Next:` hand-off, and invented no workflow step. |
| 2026-07-31 | Qwen3 8B (`qwen3:8b`, weakest local tool-capable model) | `tool-calling smoke`, `design-feature` 2.4.1, `plan-feature` 3.2.2, `execute-phase` 2.11.2, `review-change` 2.7.1, `audit-pr` 3.5.1, `orchestration-envelope` 1.4.1 (feature #110, normalized repository state heading placement) | PASS | Ollama chat returned `tool_calls` with `get_time` and parseable `{}` arguments. Live text-reasoning checks against the exact moved NRS sections and the RF1/E1 conflict returned exactly the requested Markdown table, reported/proposed contradictions for design, review, and audit, stopped planning and implementation while the ledger was `contradicted`, routed driver and execution handling to `resolve-repository-state`, kept review and audit read-only, and invented no workflow step. |

| 2026-07-31 | Qwen3 8B (`qwen3:8b`) | `execute-phase` 2.12.0, `review-change` 2.8.0, `audit-pr` 3.6.0 (feature #109, architectural invariants) | FAIL | First live run used default thinking and prefixed the requested three-line verdict with analysis, so it did not meet the exact-output criterion. It correctly classified the direct file write as `violates`, review as a finding, and audit as a blocker; the rerun below is the passing result. |
| 2026-07-31 | Qwen3 8B (`qwen3:8b`, `--think=false`) | `execute-phase` 2.12.0, `review-change` 2.8.0, `audit-pr` 3.6.0 (feature #109, architectural invariants) | PASS | Live CSV-fixture analogue: AI-001 required a CLI file-write adapter; `src/cli/export.ts` directly called `fs.writeFile`; frozen NRS confirmed the path. The model returned exactly three requested lines: execution `violates` and stops for an explicit architectural decision; review `finding` routed to that decision; audit `blocker` with cited source evidence. No workflow step was invented. |
| 2026-07-31 | Qwen3 8B (`qwen3:8b`, `--think=false`) | `design-feature` 2.5.0, `plan-feature` 3.3.0, `plan-feature-from-issue` 1.6.0, `plan-feature-scaffold` 1.12.0 (feature #109, F1 fold) | PASS | Four live CSV-export fixture runs against scratch inputs: the design run produced the product SPEC and its exact closing block; planning, issue-to-SPEC routing, and scaffolding each returned their fixed completion contract with the required `→ Next:` hand-off. No repository files were edited and no workflow step was invented. |
| 2026-07-31 | Qwen3 8B (`qwen3:8b`, `--think=false`) | `execute-phase` 2.13.0, `design-feature` 2.6.0, `review-change` 2.9.0, `audit-pr` 4.1.0, `ship-roadmap` 3.1.0, `workflow-status` 1.9.0, `triage-issue` 2.5.0, `init-workspace` 2.8.0 (feature 20, initial progressive routes) | FAIL | Initial live route-selection probes caught real weak-model ambiguity: only `execute-phase` selected its route cleanly; other runs loaded conditional portability/write/report files, omitted a mandatory audit-process or guardrail resource, or invented a plausible filename. Mechanical inspection also found references cut in the middle of lists/fixed blocks. The result drove explicit allowlists, complete condition→LOAD rows, semantically cohesive cuts, numbered audit order, and a heading-start lint; superseded by the passing row below. |
| 2026-07-31 | Qwen3 8B (`qwen3:8b`, `--think=false`, temperature 0, seed 20; weakest local tool-capable model) | `tool-calling smoke`, `execute-phase` 2.13.0, `design-feature` 2.6.0, `review-change` 2.9.0, `audit-pr` 4.1.0, `ship-roadmap` 3.1.0, `workflow-status` 1.9.0, `triage-issue` 2.5.0, `init-workspace` 2.8.0 (feature 20, hardened progressive routes) | PASS | OpenAI-compatible smoke returned `finish_reason: tool_calls`, `get_time`, and parseable `{}` arguments. Eight live natural-invocation probes selected only the exact route resources: default execution, first-turn raw design, default review, ordered whole-PR audit, active non-terminal fullauto AUDIT through closeout, empty-project sensor, forge-issue postpone, and existing-OpenCode upgrade. A second `execute-phase` run loaded `PREFLIGHT.md` and rendered the complete `OWN-STATUS GATE — 99-csv-export-command BLOCKED (defined)` block with the exact `/plan-feature 99-csv-export-command` and `→ Next:` lines. No invented reference or workflow step; branch/commit discipline held. |

| 2026-08-02 | Qwen3 8B (`qwen3:8b`, `--think=false`; weakest local tool-capable model, tool calling already validated above) | `bump-skill` 2.3.2, `execute-phase` 2.13.1, `fold-findings` 1.1.1, `generate-docs` 2.0.1, `plan-feature` 3.3.1, `plan-feature-scaffold` 1.12.1, `plan-fix` 2.4.1, `product-audit` 3.0.1, `review-implementation` 1.3.1 (second progressive-loading pass) | PASS | Nine live route-selection probes, each fed the current entrypoint literally, selected exactly the contracted one-hop resources and order: execute handoff after prior execution resources; plan-feature `planned` stop versus `defined` scaffold gates; scaffold process; review find→classify; fix planning→SPEC; bump discovery→sync; fold policy→process; generate-docs NOT-CONFIGURED early stop; and product-audit dimensions→process. No reference filename or extra workflow step was invented. |

| 2026-08-03 | n/a — read-verified shell probe; no model run | `plan-feature` 3.3.1 (fix #119, issue-route NRS gate) | PASS | Three isolated scratch probes for `draft`, `contradicted`, and `resolved` NRS states confirmed the parent route loads `PLANNING_GATES.md` before composing `plan-feature-from-issue`; every non-frozen state stopped before a product-half write and routed to discovery or resolution. |
| 2026-08-03 | Qwen3 8B (`qwen3:8b`, `--think=false`, temperature 0, seed 20; weakest local tool-capable model) | `tool-calling smoke`, `plan-feature` 3.3.2 (fix #119, live weak-model NRS issue-route probe) | PASS | The tool-calling smoke returned `finish_reason: tool_calls`, `get_time`, and parseable `{}` arguments. Three fresh issue-route runs used scratch NRS states: `draft` selected `/discover-repository-state`; `contradicted` and `resolved` selected `/resolve-repository-state`; all three called no product-half write tool and printed a `→ Next:` hand-off. |

| 2026-08-05 | Qwen3.6 3B (`nan/qwen3.6`, OpenAI-schema tool calling, `--think` default; weakest tool-capable model available in this session's fleet — deepseek-v4-flash is 21B; gemma4's tool calling is XML not OpenAI `tools` schema, so it fails the smoke precondition for the executor path) | `tool-calling smoke`, `audit-pr` 4.3.0, `review-change` 2.10.0, `execute-phase` 2.13.2 (feature #21, review-to-audit boundary + receipt contract) | PASS | The tool-calling smoke returned `finish_reason: tool_calls`, `get_time`, and parseable `{}` arguments. Three live text-reasoning runs, each fed the exact quoted contract text (no paraphrase): **(A) audit-pr 4.3.0 Step 1 + Merge ownership** — scenario current-receipt-with-flawed-diff → acknowledged the receipt as the review evidence and moved to the delivery gates, never re-reviewed the diff; absent-receipt-with-visible-bugs → returned **BLOCKER** routed to `/review-change`, refused to compose or spot-check a review; stale-receipt-with-flawless-diff → returned **BLOCKER** routed to `/review-change` (later commit voids the receipt); user-asks-to-merge-with-current-receipt → "Skill never merges", sole authority is the `ship-roadmap --continue --fullauto` AUDIT stage. **(B) review-change 2.10.0 receipt-posting contract (step 13)** — clean review → wrote the exact receipt body (`<!-- review-change:pass sha=<head> contract=v1 -->` + all seven bullet lines) to `$TMPDIR/review-receipt.md` and posted via `gh pr comment <N> --body-file`, never inline `--body`; fix-now finding open → posted **no** passing receipt and gave `Decision: REVIEW-FAIL`; already-posted same SHA → idempotent skip with no new comment; user asks for MERGE-READY on a clean table → refused, returned `Decision: REVIEW-PASS` only ("only audit-pr says MERGE-READY"). **(C) execute-phase 2.13.2 folding mini-cycle** — reproduced the complete 7-step fold checklist in order (fix → gate → docs → ledger `folded: no → yes` → commit → push → clean `porcelain` + not-ahead); unstaged doc edit → correctly refused to report the finding folded (clean `porcelain` is the final verification); future-capability "gzip compression" proposal → batched as a proposal, never created an issue, routed only by the user to `/triage-issue`; green gate with no open PR → correctly refused to auto-merge (never auto-merge, never skip the per-phase stop). All scenarios: zero invented steps, fixed output blocks rendered exactly. Closes the AC 17 fixture for feature #21. |
| 2026-08-09 | Qwen3 8B (`qwen3:8b`, `--think=false`; weakest local tool-capable model, tool calling already validated above) | `execute-phase` 3.0.0, `plan-fix` 2.6.0, `loop-review-fold` 1.0.0 (feature 22, initial bounded-delivery wording) | FAIL | Live deterministic probes exposed two weak-model ambiguities: dispatch copied an empty phase placeholder and invented `P5`; loop grouping reached the right broad decisions but omitted required fields; loop terminal labels were mostly right while review/correction counters drifted. The result drove literal-ledger dispatch, first-match transition tables, fixed output hygiene, and set-level grouping boxes. |
| 2026-08-09 | Qwen3 8B (`qwen3:8b`, `--think=false`; weakest local tool-capable model, tool calling already validated above) | `execute-phase` 3.0.0, `plan-fix` 2.6.0, `loop-review-fold` 1.0.0 (feature 22, hardened bounded-delivery wording) | FAIL | The tightened live probes correctly routed omitted execution to only `P2 P3 P4`, explicit execution to only `P3`, discoveries to `Proposal`, unchanged work to `NO-PROGRESS`, both capability and homogeneous mechanical batches to MERGE, and the incompatible batch to SPLIT. All three loop terminal labels were correct (`PASS`, `NO-PROGRESS`, `BUDGET-EXHAUSTED`), but the 8B no-thinking model still miscounted reviews/corrections, so it fails the exact contract and is approved only as a mechanical worker, not as loop conductor. A configured `nan/qwen3.6` retest was attempted but Pi reported no models/providers available in this session. |
| 2026-08-09 | Qwen3 14B (`qwen3:14b`, thinking enabled, temperature 0, seed 22; local tool-capable reasoning floor for the conductor route) | `tool-calling smoke`, `execute-phase` 3.0.0, `verification-contract` 1.0.0, `loop-review-fold` 1.0.0 (feature 22, bounded delivery) | PASS | OpenAI-compatible smoke returned `finish_reason: tool_calls`, `get_time`, and parseable `{}` arguments. Live first-match probes preserved the frozen manifest by rejecting test/acceptance weakening, selected literal remaining phases `P2 P3 P4`, kept explicit `P3` atomic, and recorded an unrelated enhancement as `Proposal` with no issue. The bounded-loop probe returned exactly `PASS` with `reviews=1/corrections=0`, `NO-PROGRESS` with `2/2`, and `BUDGET-EXHAUSTED` with `3/2`. This validates the reasoning-enabled conductor tier; the 8B no-thinking result above remains the lower mechanical-worker boundary. |
| 2026-08-09 | Qwen3.6 (`nan/qwen3.6`, configured Pi provider, thinking medium) | `Pi tool-use smoke`, `execute-phase` 3.0.0, `verification-contract` 1.0.0, `loop-review-fold` 1.0.0 (feature 22, configured-provider retest) | PASS | Pi successfully called the read tool and returned the frozen acceptance heading. The live first-match probe selected literal `P2 P3 P4`, explicit `P3`, `Proposal` with no issue, and `REJECT` for acceptance/test weakening. The bounded-loop probe returned exactly `A | PASS | reviews=1 | corrections=0`, `B | NO-PROGRESS | reviews=2 | corrections=2`, and `C | BUDGET-EXHAUSTED | reviews=3 | corrections=2`. This validates Qwen3.6 as a conductor candidate when reasoning is enabled; DeepSeek/MiMo remain unpromoted until separately fixture-tested. |
| 2026-08-27 | Qwen3.6 (`nan/qwen3.6`, configured Pi provider, thinking medium; weakest reasoning model available in this session's fleet — `deepseek-v4-flash` is larger, `gemma4` calls tools in XML not the OpenAI schema) | `product-audit` 3.1.0 (fix #147, `audit-evidence-provenance`) | PASS | One live run of the new **Audit-evidence provenance fixture**, fed the exact quoted provenance gate + process step 8 + output-format excerpt (no paraphrase) against the four-trap toy target: **T1** — refused to attribute the root tail (`Test files 7 / Tests 173`) to `packages/core/`, quoted the aggregate-tail rule and applied that domain's `rerun in scope` fallback instead of inventing a package number; **T2** — reported the `in-progress` worklist row as documentation drift with the declared forge winning, never as an open item; **T3** — recomputed the ADR inventory and cited the terminal `docs/adr/0047-transport.md` over the `0046` every other document quotes; **T4** — emitted `## Delta vs audit 3` mapping the prior finding as `3 F2` under `Resolved` (release-notes gap gone) with `none — <why>` bodies on the empty classes; and stated correctly that a same-date rerun needs a reason plus the delta, never the date alone. Zero invented steps. Soft drift noted for wording watch (not a fixture failure): it printed the three delta classes out of template order (`Resolved`, `New`, `Unchanged`) — the contract freezes the section heading and the mapping syntax, not the line order of the classes. |

## Scope boundary

Manual first, no CI, no runnable script. This is deliberately the cheapest
thing that catches weak-model regressions today. Graduate to automation only
if the manual procedure repeatedly catches regressions and the maintenance
cost is justified — that is a separate, future unit, not scheduled here.
