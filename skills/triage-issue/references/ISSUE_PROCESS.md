## Process

1. **Parse the issue's own contract.** Extract its severity and any "When to
   fix" / "Trigger" / "Acceptance (when triggered)" clause. Many issues carry an
   explicit signal-based trigger — honor it.
2. **Verify the trigger against current code.** Do the actual check, e.g.:
   - count real consumers of a duplicated helper (is the "3rd consumer" here?),
   - check a threshold (article count, p95 latency, row count),
   - reproduce a reported defect, or confirm it's already fixed.
   Use `rg`/`gh`/tests — cite the evidence (paths, counts, line refs).
3. **Scope-membership check.** Before classifying, decide whether this issue
   already belongs to a unit that is currently open, per this fixed checklist
   (every item independently checkable):
   - List candidate open units mechanically: roadmap/fix-index rows with
     status `in-progress` or `planned`, plus any unit with an open PR
     (`gh pr list --state open`). **Confirm the row against the forge before
     treating it as an open unit:** a row still reading `in-progress` whose
     issue is closed (`gh issue view <n> --json state` → `CLOSED`) is a stale
     index cell, never a home unit — the issue's own state decides.
   - For each candidate, compare the issue against it: membership = ✓ the
     issue's ask overlaps a SPEC **acceptance criterion** or a **phase task**
     — quote **both** sides (the issue's own line and the matching SPEC/phase
     line) before calling it a match; no quote pair means not a member.
   - **Member of an open unit → verdict `fix-in-unit <unit>`.** Resolve the
     issue on that unit's own branch, never as a new standalone unit. Pick
     exactly one of these sub-routes:
     - *repairable as-is* → **fold into the unit's** current/next phase, or
       append a provenance-marked row to the unit's findings carrier — `SPEC.md
       ## Findings` for a migrated unit (#308), `review-findings.md` for a legacy
       one, never both (see *Ledger-append mechanism* below).
     - *changes the unit's shape* → **incremental replan** on the same unit:
       name the exact command — `/unit-lane <slug>` (the lane re-reads the
       SPEC, re-triages, and re-runs its `design`/`plan` catalog steps) — or a
       user-approved, dated `## Amendments` entry per #66's mechanism (fix
       units). Never write "replan if needed" — always name which applies and
       why.
     - *born as an un-amended descope of an unmerged unit* →
       **scope-bleed restore**: the route is restore-the-criterion-in-the-unit
       (no matching `## Amendments` entry); the issue closes as
       scope-returned, not as new work.
   - No candidate matched → fall through to the published classification
     below — the seven rows of `triage-verdict@1`, unchanged by this step.
4. **Classify** into exactly one of the seven published verdicts. The set is
   machine grammar — `TRIAGE_VERDICTS` in
   `@gtrabanco/agentic-workflow-schema`, mirrored by the block below — so a
   verdict spelled here and published nowhere is a defect, not a nuance. The
   rows are ordered the way the classification walks: the cheapest organic
   route first, then the five original verdicts, then removal.

```text
triage-verdict@1
verdict | label | route
one-shot | none | inline with the gate only, on the owner's explicit consent
fix-now | urgent · fix-next (high severity only) | /unit-lane --fix <n>
fix-in-unit | none | fold into the open unit, or an explicit execute-phase phase
promote | promoted | /unit-lane --from-issue <n>
postpone | postponed | dated comment, leave open
wontfix | wontfix | propose close
remove | none | the unit that performs the deletion, carrying its measured receipts
```

   **Setup-defect check first (issue #611).** A runner refusal is not a defect
   until the vehicle is ruled out. Read the tool doctor's `dogfooding-vehicle` row
   (the row's statuses, evidence and instruction are owned by the crate README's
   `tool-inventory@1`) and the working tree, then apply this table. The decision it
   encodes is implemented once, as `classifySetupState` in
   `packages/agentic-workflow/src/doctor/vehicle.mjs`, and
   `scripts/triage-setup-defect.test.mjs` refuses a drift between the two. The
   override's semantics stay where they are owned —
   `../runner-contract/references/RUNNER.md` — and are never restated here:

   ```text
   setup-defect-route@1
   row | when | classification | move
   R1 | the runner refuses, and the named subcommand or skill exists in the working tree, and the `dogfooding-vehicle` row reads `stale` or `unarmed` | setup-defect | apply the row's arming or refresh move, re-run the refused command, then re-triage what survives
   R2 | the named subcommand or skill does not exist in the working tree | code-bug | the ordinary classification, unchanged
   R3 | the `dogfooding-vehicle` row reads `ok` | code-bug | the ordinary classification, unchanged
   R4 | the row reads `unreachable` or `not-applicable`, so the vehicle cannot be shown healthy | unresolved | repair what the row's evidence names — its instruction is the exact command — then re-classify
   ```

   A `setup-defect` classification is never worked around in code: the move is
   applied, the command re-run, and every symptom it explained leaves the report.
   What survives falls through to the ordinary classification unchanged. When the
   move explains every reported symptom the verdict is `wontfix` — the report
   named a setup state, and there was no code defect to fix — and the closing
   comment carries the move's observed result.

   - **one-shot** — the organic route: work that is small and understood runs
     inline with the gate only, never as a unit. All six conditions must be
     **evidenced**, not asserted:
     1. **single surface** — one owner file or one contract surface;
     2. **no pending design decision** — nothing waits on the owner — evidenced
        by the pre-spec cut before triage saying `questions: none` — and no
        `open-questions@1` row is open;
     3. **no contract consumed by others** — no other skill, package or consumer
        reads what changes;
     4. **existing validator** — a command that already proves the surface is
        named before the work starts;
     5. **resumable-from-diff** — a reader of the diff can continue the work;
     6. **reversible** — the change is undone by reverting its own diff.
     A condition you cannot evidence disqualifies the verdict; it never becomes
     an assumption. **The computed tier outranks the verdict**: a `standard` or
     `high` answer from `ceremony tier classify` disqualifies `one-shot` — fail
     closed upward, because the classifier is not overridable by a prompt and
     `high` never runs without its named high-risk item. The owner's explicit
     consent is the last gate: without it, the answer is a unit.
     A `one-shot` opens **no unit doc** and pays **no review pass**. Its record
     is the issue's dated closing comment carrying the gate command and its
     observed result — plus `docs/passive/<id>.md` (`ceremony passive add`) when
     the classifier answered `passive`. The record written before this verdict
     (`docs/pre-spec/<id>.md`, owner: `skills/unit-lane/references/ELICITATION.md`)
     is part of that record: it is where `questions: none` was written and what
     the conditions above were evidenced from. Nothing else is emitted: no new
     receipt enters without an older one retiring.
   - **fix-now** — defect or trigger met → route to `/unit-lane --fix <n>`
     (creates the fix unit and triages it; the lane's `implement` step runs
     it); add the entry to the fix index. **High severity** →
     apply the urgency label per *Urgency label vocabulary* above (`urgent` by
     default; `fix-next` when the call is "queue it next" rather than "maybe
     interrupt now" — see that section's table). Non-high severity → no label.
   - **promote-to-feature** — really new capability → route to
     `/unit-lane --from-issue <n>` (creates the feature unit from the issue and
     triages it). Apply the `promoted` disposition
     label per *Disposition label vocabulary* above.
   - **postpone** — valid but trigger unmet → leave open; post a **dated
     re-confirmation** comment stating what you checked and why it stays
     deferred. Do **not** implement deferred work inline. Apply the
     `postponed` disposition label per *Disposition label vocabulary* above.
   - **wontfix** — obsolete or explicitly bounded by the issue → propose closing,
     with rationale. Apply the `wontfix` disposition label per *Disposition
     label vocabulary* above.
   - **remove** — the deletion decision is a measurement, never a free judgment
     (design note 11 of the direction). The verdict carries its inputs as
     receipts and fails closed: **no measured verdict, no removal.**
     - **residual state** — `runner residual-classify --receipt
       <surface|symbol> --date <YYYY-MM-DD>`; for the surfaces the unit itself
       adds, `runner residual-classify --inventory --base <rev>`. An
       **orphan** is the only retire-legitimate state: a scaffold (`andamio`)
       requires the recorded planned-consumer promise, and `half-built` routes
       to resume instead of removal.
     - **code-net ratio (ARW)** — eliminations over touched code surfaces, in
       the band the findings corpus owns (#437). Below three measured units the
       band is `insufficient-corpus`, so a removal cannot claim a trend.
     - **impact sweep** — the callers and consumers of the candidate surface,
       named from a real search of the tree.
     A `remove` verdict applies **no label** and implements nothing here: it
     routes the work to the unit that performs the deletion (`/unit-lane --fix
     <n>`), which then owes the ordinary evidence. Label ownership stays
     untouched, exactly as the issue's Non-goals state.
5. **When the call is the user's, ask.** If the decision hinges on product/risk
   judgment rather than evidence, present the verdict and options and let the
   user choose before acting.
6. **Report and keep docs coherent.** Post the decision as a dated issue comment
   with evidence. **The comment is Markdown, not shell — never hand-escape it:**
   backticks / `*` / `_` in the body are formatting; a `\` before them renders
   literally (`` \`code\` `` instead of `` `code` ``). Write the comment body to
   a file with the Write tool (plain Markdown, real backticks, zero backslashes)
   and post it with **`gh issue comment <n> --body-file <path>`** (or the
   declared forge's equivalent) — never an inline `--body "…"` or a quoted
   heredoc, which mangle backticks. After posting, `runner forge-read issue <n>
   --comments` must show the backticks rendering, no literal `` \` ``. On a
   fix-now + high-severity verdict, the comment also states the urgency label
   applied (or the failure to apply it — see *Apply-on-verdict (urgency)*
   above); on a **postpone**, **promote**, or **wontfix** verdict, the comment
   states the disposition label applied instead (or its failure — see
   *Apply-on-verdict (disposition)* above). Either way this is
   the one GitHub-state mutation this skill makes without separate
   confirmation, because it is fully determined by the verdict just reached,
   never by issue text. If it
   becomes an active fix, register it in the fix index; if
   closed, remove any stale index entry. Any **other** GitHub state mutation
   (closing, unrelated labels) still needs confirmation when ambiguous.

   **A close is checked before it is written (issue #704).** A delivery
   condition is never prose: if the issue records one — `closed as covered by
   #N`, `reopen when #N lands`, `proceeds when #N`, `waits for #N`, `retire when
   #N` — the machine re-checks the issue it cites, and the close-time guard is
   what you run before proposing or writing the close:

   ```
   runner delivery-conditions --close-check <n> [--issues-file <cache>]
   ```

   Exit 0 passes; exit 1 is `REFUSAL covered-by-open` and the block names the
   route — deliver the cover first, or leave the issue open and record the
   dependency as a native `blocked-by` relation (the forge already tracks it, so
   the block is not a promise, it is a link). Exit 2 is a usage or input error
   and proves nothing, so it is never read as a pass. The follow-up families
   (`reopen-when`, `waits-for`, `retire-when`) do **not** block a close — a
   recorded follow-up is the correct shape — and the scheduled sweep re-checks
   them; the table and the state rules are § *Delivery conditions* below.

   **Declare the surfaces (issue #574).** The batch scheduler routes parallel
   work on the issue body's `## Surfaces`, and a missing one is planned as a
   guess:
   - `runner batch-scheduler --infer-surfaces <n>` prints the block to
     paste (fences inert, `## Where`/`## In scope` honored, resolved through the
     project's own lane vocabulary) or `- surface-unknown`. `--issues-file
     <cache>` works offline. Never hand-write the lane keys: they are the
     script's, and the vocabulary is the project's (owner:
     `skills/batch-scheduler/references/PLAN.md` § The surface vocabulary).
   - When the emitter answers on stderr that the keys came from the project's
     tree rather than a declaration, record that config line (`runner config set
     batchScheduler.surfaces '[…]' --scope project`) in the triage receipt as the
     follow-up that would pin them — a discovered lane follows a directory rename.
   - **No `## Surfaces`** → append the printed block with
     `gh issue edit <n> --body-file <path>` (write the file first, never an
     inline `--body`), after the last section, never inside an existing one.
   - **An existing `## Surfaces`** is the author's: never rewrite or reorder it.
     A declaration your evidence contradicts is reported, and the owner changes it.
   - State the outcome in `Action taken`: `surfaces: declared <keys>` ·
     `surface-unknown` · `already declared`; the write is fully determined by the
     script's output, so it needs no separate confirmation.
7. **Return exactly, per issue** (fixed verdict format — batch runs repeat it,
   then add one summary table):

   ```
   triage-verdict-block@1
   ISSUE #<n> — <title>
   Trigger (the issue's own): <quoted clause | "none stated">
   Checked: <the exact commands/counts/repro run>
   Evidence: <paths, counts, line refs, output>
   Criteria: <workflow-generic | project-declared | stamped-assumption> — <the criterion, or "none — no project catalogue declared">
   VERDICT: fix-now | fix-in-unit | promote | postpone | wontfix | one-shot | remove
   Action taken: <fix-index entry + route | dated comment posted + disposition label applied | close proposed + disposition label applied> · surfaces: declared <keys> | surface-unknown | already declared | n/a — receipt or finding input
   ```

   No member unit matched a `fix-in-unit` candidate for this issue → the
   verdict, evidence, and action above are exactly what they would have been
   without the scope-membership step — the published classification,
   unchanged.

   **Criteria provenance (mandatory, every verdict).** The `Criteria:` line
   records where the criteria this verdict used come from, from the published
   set `TRIAGE_CRITERIA_PROVENANCE`:
   - `workflow-generic` — the workflow's own baseline. It is the only honest
     value when the project declares no criteria catalogue
     (`docs/workflow/VERIFICATION_CRITERIA.md` absent from the documentation
     map), and it is never a silent substitute for one.
   - `project-declared` — the project's criteria catalogue states it; quote the
     catalogue row.
   - `stamped-assumption` — a **dated** assumption, recorded because the
     project declares no catalogue yet and the verdict cannot wait.
   A verdict that touches an **open-with-default** criterion surfaces it to the
   owner and waits for the answer (help-mode per the charter's question
   protocol: the recommended option with its reason) instead of assuming it. A
   criterion with no provenance is a defect, the same way a claim without a
   source is.

   **Batch summary table — group by home unit.** When triaging several issues
   in one run, the closing summary table groups every `fix-in-unit` issue
   under its home unit's heading (one heading per unit, its member issues
   listed beneath), with any issue that matched no open unit listed last under
   a plain "no member unit" heading — this is the signal that surfaces N
   issues sharing one open unit at a glance, not N separate rows.

## Delivery conditions — the carrier a close and a sweep re-check

A condition that gates delivery names **a carrier the machine re-checks**, and
that carrier is the issue it cites: `closed as covered by #N` is only true when
#N is delivered, and `reopen when #N lands` is only a record when something
notices #N landing. Nothing here asks you to write differently; it asks the
condition to cite the issue it waits for, because an uncited condition is exactly
the prose that stalled #301 — recorded in a comment, fulfilled four months later,
and noticed only two consumer units after that.

This section is the owner of the lifecycle and of the recognisable phrasings. The
implementation is `judgeCondition` / `extractConditions` in
`packages/agentic-workflow/src/delivery-conditions/index.mjs` and the vocabulary
is `@gtrabanco/agentic-workflow-schema`'s `DELIVERY_CONDITION_*` consts; the
`stalled-when` column below states the rule that function implements, so a change
to one is a change to both.

```text
delivery-condition@1
id | kind | phrase | stalled-when | move
DC1 | covered-by | closed as covered by #N · covered by #N · cerrada como cubierta por #N · cubierta por #N | the citing issue is closed and a cited issue is still open — the close-time guard refuses it as `covered-by-open` | deliver the cover, or keep the issue open with a `blocked-by` link to #N
DC2 | reopen-when | reopen when #N · reopen once #N · reabrir cuando #N | the citing issue is closed and a cited issue has closed — the recorded follow-up is due | reopen it, or record the audit that closes the follow-up
DC3 | proceeds-when | proceeds when #N · proceeds once #N · continúa cuando #N | the citing issue is closed and a cited issue is still open | deliver the prerequisite, or keep the issue open with a `blocked-by` link
DC4 | waits-for | waits for #N · waiting for #N · espera a #N | the citing issue is closed and a cited issue is still open | as `proceeds-when`: the cited issue is the link, not the sentence
DC5 | retire-when | retire when #N · retirar cuando #N | a cited issue has closed — the retirement is due in either state of the citing issue | retire the surface (or record why it stays), then drop the condition
```

**The citation is the whole rule.** Every row above is read as "phrase, then
the `#N` in the clause that follows it" — one clause, never the next sentence, at
most three citations. A condition-shaped sentence that names no issue is
reported as `ADVISORY condition-uncarried`, because the honest answer to "the
machine cannot check this" is to say so. Advisories never fail a run; a stall
does.

**Two mechanisms, one command.**

```
runner delivery-conditions --close-check <n> [--issues-file <cache>] [--repo <owner/name>] [--json]
runner delivery-conditions --sweep [--issues-file <cache>] [--repo <owner/name>] [--root <dir>] [--limit <n>] [--json]
```

- `--close-check <n>` is the guard: run it before proposing or writing a close.
  One refusal class (`covered-by-open`), because a coverage claim against an
  undelivered cover is wrong by construction; the follow-up families are
  post-close by nature, and refusing those closes would forbid the correct
  behaviour.
- `--sweep` is the backstop: the issue corpus (bodies **and** comments — the
  #301 condition was a comment) plus the roadmap's `## Fixes` rows, judged, with
  the due conditions as `FINDING` lines and the uncarried ones as `ADVISORY`
  lines. A scheduled workflow runs it weekly and fails visibly on a finding
  (`.github/workflows/delivery-conditions.yml`), which is what "noticed within
  one sweep" means.

**The verdicts.** `satisfied` — the cited delivery landed and nothing is due;
`pending` — it has not landed and the record is consistent; `stalled` — the
cited state moved past the condition and the follow-up is due; `unresolved` —
the machine could not read the cited issue, so it refuses to guess. The report's
own verdict is `PASS` (exit 0), `VIOLATION` (exit 1, a stall or a refusal) or
`UNRESOLVED` (exit 1, the corpus or a citation could not be read). The block is
byte-stable for a given corpus and carries no third-party text: numbers, kinds,
verdicts and fixed sentences only.

**Offline and degraded-declared.** `--issues-file <json>` reads a cached
`[{number, state, body, comments}]` array and performs no forge call, which is
what makes a run deterministic and testable. An unreadable cache is exit 2 — the
input the caller named does not exist, and a check that did not run is never a
pass — while a forge that cannot be reached is a named
`DEGRADED unavailable-forge-…` line with exit 1, never an empty corpus presented
as truth.

**Where the condition is owed.** A unit whose work is genuinely held by another
issue records that as the forge's native `blocked-by` relation (authoritative,
per the relationships rule above) and, when it also writes a condition, cites the
same `#N`. The sweep reads the prose; the forge enforces the link.
