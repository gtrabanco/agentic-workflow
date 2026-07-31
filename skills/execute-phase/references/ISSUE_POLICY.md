## Issue policy

Forge operations use the project's declared forge CLI (Workflow conventions —
examples use `gh`; translate if the project declares another forge).

> **Forge bodies are Markdown, not shell — never hand-escape them.** Backticks,
> `*`, `_`, `#`, `|` in an issue / PR / comment body are **formatting**; a `\`
> before them renders **literally** (`` \`code\` `` instead of `` `code` ``) —
> the #1 forge-formatting bug (worse on some agents than others). Fix it at the
> source: **never pass a Markdown body inline** (`--body "…"`, a quoted
> `<<'EOF'` heredoc, or single quotes — all of these preserve a stray `\` or
> mangle backticks). Instead **write the body to a file with the Write tool**
> (plain Markdown — real backticks, zero backslashes; scratchpad is fine) and
> pass **`--body-file <path>`**: `gh issue create --body-file <path>`,
> `gh pr create --body-file <path>`, `gh issue comment <n> --body-file <path>`
> (or the declared forge's equivalent). Short one-liners with no Markdown (e.g.
> a bare `Closes #12`) may stay inline. **Verify after creating:**
> `gh issue view <n> --json body` / `gh pr view <n> --json body` must show
> backticks rendering — a literal `` \` `` in the output means redo it with
> `--body-file`.

- **`--fix`:** every fix needs a tracked issue; create with `gh issue create --template fix.yml --body-file <path>` if missing, populating the body from the SPEC (body as a Markdown file — see the Markdown rule above). Use the returned number for branch and folder.
- **feature:** if it came from an issue, include `Closes #<n>` in the PR body. Don't create issues for features that didn't originate from one.
- **Language precedence for every artifact** (issues, PRs, commits, SPECs, docs): (1) an explicit user instruction in the prompt, else (2) the project's declared docs language (Workflow conventions), else (3) English. The conversation language is NOT a signal — being asked in Spanish never makes the PR Spanish. Non-matching source material gets translated first.

### Descope guard (run before creating any issue during this unit)

A cheap way to look finished is to quietly convert unfinished SPEC scope into a
follow-up issue — the unit reads as done, the scope silently moved to the
backlog. Before creating **any** issue while executing this unit, classify it
with the fixed **descope test**:

- **Descope** — the issue's content overlaps a SPEC acceptance criterion or a
  phase task that is **not fully delivered** in this unit.
- **Discovered work** — everything else (genuinely new, outside the SPEC's
  promises) — file it freely; that's what `triage-issue` is for.

**On a descope → STOP before creating the issue.** An issue may never be the
first record of a descope. The descope must first be recorded as an explicit,
**user-approved, dated SPEC amendment**:

1. Get explicit user approval for the descope **first** (ask; never
   self-authorize moving a criterion out of scope — the amendment row must
   never be written before approval is in hand).
2. **Only then** move the criterion/task out of the active `## Acceptance` (or
   `## Phases` ledger), and log it in the governing SPEC's `## Amendments`
   section (create the section if absent) with this canonical row format:
   ```
   - <YYYY-MM-DD> — descoped: "<criterion/task>" — approved by user — follow-up: #<n>
   ```
3. **Only then** create the follow-up issue, and **link the amendment** in its
   body. Immediately after, edit the `## Amendments` row to replace the
   `#<n>` placeholder with the real issue number, and commit that edit — a
   row still reading the literal `#<n>` placeholder is unlinked and fails
   `audit-pr`'s symmetric check.

`audit-pr`'s scope-bleed gate and `product-audit`'s recurrence signal both key
off this same `## Amendments` log — it is the single authoritative record of
every descope, defined once here.

### Opportunistic finding policy (run when implementation discovers work)

This policy applies to a **real, out-of-scope finding discovered while
implementing the current unit**: a lint warning, dead code, missing defensive
check, documentation defect, or similar work that the current phase did not
promise. A missing acceptance criterion or phase task is **not** a finding to
route: it remains in-scope work and must be delivered (or follows the descope
guard above).

**Current policy — one source of truth.** Use the complete policy below for
every target project. The target project's agent guide and docs may supply
evidence for a finding, but they do not override its thresholds, decision
order, actions, or decision-log fields. Do not combine local heuristics with
this policy. A configurable project override is future work: it needs a
versioned, machine-checkable schema before it can be introduced safely. Record
`source: workflow` in every decision row.

**Fallback policy — classify every finding in this order; the first matching
row wins.** Estimates are the smallest complete fix, including tests and docs.
Before assigning a decision, write a pass/fail result for every box in the
candidate row. Each row uses **its own** limits: never reuse an Autofix limit
for an Opportunistic Fix, or vice versa. A failed row cannot be selected; move
to the next row and record the failed box in `Why`.

| Decision | Pass only if every box is true | Action |
|---|---|---|
| **Autofix** | ✓ ≤15 changed lines; ✓ ≤2 files; ✓ every file is already modified in this phase; ✓ low implementation and regression risk; ✓ no public API, schema, migration, dependency, permission, architecture, or user-visible behavior change; ✓ the primary phase objective remains unchanged | Fix now in the current phase commit; run the normal verification gate. |
| **Opportunistic Fix** | ✓ ≤40 changed lines; ✓ ≤3 files; ✓ every file is already modified in this phase or directly covered by its test; ✓ directly supports the current phase's behavior or makes its touched code consistent; ✓ low implementation and regression risk; ✓ no public API, schema, migration, dependency, permission, or architecture change; ✓ no acceptance criterion is added, removed, or changed; ✓ the primary phase objective remains unchanged | Fix in the current phase commit; add or update the focused test when behavior is affected; run the normal verification gate. |
| **Create Issue** | Any Autofix or Opportunistic Fix box fails, the evidence is uncertain, the finding is independent of the current phase, or it needs product/risk judgment | Do not change code for the finding. Apply the descope guard before filing; then create a tracked issue and route it through `triage-issue`. |

**Numerical boundary check — run before the remaining boxes.** `≤` is
inclusive. An estimate of 16–40 lines and 1–3 files **fails Autofix size** and
**passes Opportunistic Fix size**. An estimate of more than 40 lines or more
than 3 files fails both fix decisions. At 0–15 lines and 1–2 files, check
Autofix first; if any non-size Autofix box fails, still check Opportunistic
Fix rather than creating an issue immediately.

**Decision ladder — follow literally.** If the estimate is 16–40 lines, never
write `Autofix`: write `Opportunistic Fix` only when every other Opportunistic
Fix box passes; otherwise write `Create Issue`. If the estimate is more than
40 lines, write `Create Issue`. Only a 0–15-line finding may be `Autofix`.

**Record before acting — no silent scope expansion.** For each finding append a
row to `decisions.md` (create `## Opportunistic finding decisions` and its
header if absent) before editing or filing:

```
| Date | Finding | Evidence | Estimate (lines/files) | Risk | Local files | Decision | Why | Policy source | Record |
|---|---|---|---|---|---|---|---|---|---|
| <YYYY-MM-DD> | <one line> | <file:line or command> | <n lines>/<n files> | <low/med/high> | <yes/no + paths> | <Autofix/Opportunistic Fix/Create Issue> | <failed/passed boxes> | <workflow> | <pending commit, commit sha, or issue #n> |
```

For `Create Issue`, write `pending issue` in `Record`, create the issue only
after the descope guard passes, then replace it with the real `issue #<n>` in
the same phase commit. If the decision is not deterministic from the evidence,
record `Create Issue — judgment required` and ask the user before filing or
changing code. This table is the execution log required for later review;
`known-issues.md` remains for blockers, not a substitute for this decision.

