---
name: agentic-workflow-doctor
user-invocable: true
version: 5.0.0-canary.20261125.1
argument-hint: [--unit <slug>] [--search "<words>"] [--candidate <n>]
description: >
  User-initiated batch ceremony-failure triage: mine this project's own journal
  and unit docs for its accumulated ceremony failures, apply a fixed
  discard/report rubric, render one anonymized bundle, and route it upstream to
  an existing or new agentic-workflow issue — with consent. Read-only; the user
  starts it. Triggers: "agentic-workflow-doctor", "aw-doctor", "why do
  my reviews keep blocking", "triage my ceremony failures", "report a workflow
  bug upstream".
---

# Agentic Workflow Doctor — batch ceremony-failure triage

> **Runner commands** below are `runner <subcommand> [args…]` — the launcher, its
> order and the pin are owned by
> [references/RUNNER.md](../runner-contract/references/RUNNER.md): read it before the
> first command, then keep it for the whole run — nowhere else spells either.

One invocation turns the project's own durable record — the session journal and
the unit docs — into one anonymized, maintainer-actionable report, and routes it
to the issue that already covers the defect family (or a new one). The
deterministic half is the `workflow-doctor` command family; the only part a model
does is apply the rubric in [`references/RUBRIC.md`](references/RUBRIC.md) and
write one sentence per class.

## Turn contract

Load and verify the **canonical** [Turn contract](../orchestration-envelope/references/TURN_CONTRACT.md) before ending every turn. This skill is a **read-only reporter** with one consent-gated write: the read-only profile substitutes the commit/push/PR boxes, and `publish` is the only command that reaches the forge. Skill-specific additions:

```
✓ All five `runner workflow-doctor` commands that apply ran, and each exit code is
  recorded (`mine`, `battery`, `bundle`, `route`, and `publish` only on consent)
✓ The triage file was written by lookup against references/RUBRIC.md — one row per
  marker kind the mine receipt carries, no verdict or reason outside the rubric
✓ The bundle and the routing receipt were shown to the user verbatim before any
  filing, and nothing was filed without an explicit yes in this turn
✓ No file inside the project changed; the working directory is byte-identical to
  the run's start (temp files live in the OS temp dir and are removed)
✓ The closing `→ Next:` block names the issue numbers the routing proposed, or
  `no filing` when the user declined
```

Missing reference → STOP. About to end the turn with any box unchecked? The turn is NOT done — complete the missing box first.

## When to use

- The user asks why reviews keep blocking each other, why the same gate keeps
  failing, why a receipt went stale, or "what is wrong with my workflow" — and
  wants it **filed upstream**, not just answered.
- The project has run the workflow for a while (a month of sessions, a dozen
  units) and the user wants one batch pass instead of reporting incidents one by
  one.
- **Not** for a live blocker in the current unit: that is `review-change`,
  `fold-findings` or `execute-phase`'s job. **Not** as a side effect of another
  step: this skill never runs unless the user invokes it.

## Step 0 — Discover the project (always first)

1. Read the project's guide (`AGENTS.md`, else `CLAUDE.md` — the guide says which
   is canonical) and the documentation map it carries. Follow the project's own
   commands; this skill names `runner` because that is the contract's form.
2. Confirm at least one carrier exists: `docs/LOGS.md`, `.agentic-workflow/journal/`,
   or `docs/{features,fix}/*/SPEC.md`. None of them → report `insufficient-input`
   and stop: there is nothing to mine, and a clean receipt would be a lie.
3. Take the facts the user named: the unit slug, the PR and issue numbers. Never
   invent one — no command validates them: an invented number would aim the
   filing at an issue the user never chose.

## Process

Work in a scratch directory outside the project (`tmp=$(mktemp -d)`); remove it at
the end. Each step's stdout is the next step's input.

### 1. Mine the record

```
runner workflow-doctor mine --json > "$tmp/mine.json"
runner workflow-doctor mine
```

The second form is the human block: carriers read, one line per marker kind, the
verdict. A refusal (`exit 1`) names the carriers it looked for — report it, do not
retry with a different flag.

### 2. Read the live facts

```
runner workflow-doctor battery --json > "$tmp/battery.json"
runner workflow-doctor battery --unit <slug>
```

`--unit` is optional (the slug the user named); without it the tier cell reads
`none`. The receipt carries the doctor's `doctor@1` envelope as-is, the runner
version against the installed pin, and the installed skill set — re-derive none
of it. The skills tree is located, not assumed: a `skills-absent` degradation
while the skills are installed (a host-mounted or other-layout tree) is answered
by passing `--skills-root <dir>`, never by re-running with edits.

### 3. Apply the rubric

Read [`references/RUBRIC.md`](references/RUBRIC.md) — the table is the whole
rubric; classify by lookup, one class per marker kind the mine receipt carries.
Write `$tmp/triage.json`:

```json
{
  "classes": [
    {
      "class": "gate-red",
      "verdict": "report",
      "reason": "reproducible-defect",
      "defect": "one sentence a maintainer can act on, with no path, name or log text",
      "rows": ["W3", "W17"]
    },
    {
      "class": "rework",
      "verdict": "discard",
      "reason": "one-off-human",
      "rows": []
    }
  ]
}
```

Rules the command enforces (a violation refuses the whole bundle by name):

- `verdict` is `report` or `discard`; `reason` comes from that verdict's column.
- A `report` class cites **1–5** `W<n>` ids from the mine receipt and states a
  `defect`; `occurrences` is computed from the corpus for you.
- A `discard` class cites **no** row and states its reason.
- A class name is a lower-case slug. Rows no report class claims are counted as
  `unclassified`, so a class you skip is visible, never silently dropped.

### 4. Render the bundle

```
runner workflow-doctor bundle --triage "$tmp/triage.json" --mine "$tmp/mine.json" --battery "$tmp/battery.json" --json > "$tmp/bundle.json"
runner workflow-doctor bundle --triage "$tmp/triage.json" --mine "$tmp/mine.json" --battery "$tmp/battery.json"
```

The human form is the receipt you show the user: the allowlisted header cells,
one `## Report class` section per finding, the discarded table, the counts. The
`--json` form is what `route` and `publish` read.

### 5. Route it upstream

```
runner workflow-doctor route --bundle "$tmp/bundle.json" --search "<the defect in a few words>"
runner workflow-doctor route --bundle "$tmp/bundle.json" --candidate 698 --candidate 701
```

Try the known corpus first, one `--candidate` each: **#170, #301, #260, #698,
#701, #702** — or a `--search` phrase built from the class names and the defect
shape. The receipt answers one line per class: `existing-issue #<n>` with the
tokens that matched, or `new-issue`. A forge refusal is a named class
(`unavailable-forge-*`) on stderr with exit 1 — report it; never re-run with a
different transport.

### 6. Show, then file with consent

Show the bundle and the routing receipt verbatim. Ask **one** question: file on
which issues, or hand the draft over. Only on an explicit yes in this turn:

```
runner workflow-doctor publish --issue <n> --bundle "$tmp/bundle.json" --repo gtrabanco/agentic-workflow --yes
runner workflow-doctor publish --new-title "<title>" --bundle "$tmp/bundle.json" --repo gtrabanco/agentic-workflow --yes
```

`--repo` is the **upstream** tracker, never the user's own repository. Without
`--yes` the command refuses (exit 2) before it reads the bundle or runs a forge
command — that refusal is the consent gate, not a bug. One filing per class: a
second post of the same bundle is a duplicate, and a declined filing ends the run
with `no filing`.

## Guardrails

**Allowed**

- `runner workflow-doctor mine | battery | bundle | route` — read-only, any time.
- Reading `references/RUBRIC.md` and the project's own guides for orientation.
- Writing only inside the scratch directory; removing it at the end.
- `runner workflow-doctor publish` — after an explicit yes, to the upstream
  tracker the user named.

**Forbidden**

- Editing, formatting or generating any file inside the project.
- Running the project's review, audit or fold machinery to "fix" what the bundle
  reports: this skill reports, it never repairs.
- Inventing a verdict, a reason, a class field or a `W<n>` id: the bundle refuses
  unknown tokens by name, and a prose guess is worse than a refusal.
- Quoting repository content — paths, file names, log text, issue titles, user
  names, e-mails — into any field. The `defect` sentence is yours to write; the
  evidence is the slug and the token.
- Naming the consumer repository anywhere in the bundle unless the user asks to.
- Filing twice, filing after a declined question, or re-running a refused
  `publish` with different flags to get past the refusal.

## Relationship to other skills

- `review-change`, `audit-pr` and `fold-findings` **produce** the failures this
  skill mines; they never run it.
- `product-audit`'s journal dimension reads the same carriers inside the project;
  this skill is the anonymized, upstream-facing half.
- `triage-issue` classifies one item at a time against this project's roadmap;
  the doctor classifies a whole corpus against the upstream tracker.
- The ceremony rule's advisory (`#698`) may **suggest** running this skill. The
  invocation always stays the user's (`S9`).

## Done when

- The five commands that apply ran, each exit code recorded in the hand-off.
- The bundle and the routing receipt were shown, and the counts add up
  (`report occurrences + unclassified = the mine receipt's rows` — a discard
  cites no rows, so its occurrences are counted inside `unclassified`).
- Either the filing happened after an explicit yes — with the issue URL — or the
  draft was handed over and the run says `no filing`.
- The project tree is byte-identical to the run's start and the scratch directory
  is gone.
- The closing block names the proposed issue numbers, or `no filing`.

## Portability (agents other than Claude Code)

Preamble + no-slash-menu fallback: owned by
[`PORTABILITY.md`](../orchestration-envelope/references/PORTABILITY.md):

- **No per-skill `model:`/`effort:`** — the rubric is a lookup table and the
  commands are deterministic, so a small model is enough; use a stronger one only
  if the user asks for a judgment the table does not cover.
- **No subagents or `/loop`** — one pass, then the closing block. A second pass is
  a new invocation the user asks for.
- **No `bun`/`node` assumption** — the launcher and the pin are the runner
  contract's (`references/RUNNER.md`), same argv on every host.

→ Next: `/agentic-workflow-doctor --unit <slug>` — one pass over this project's record, when the user wants the batch.
  · `/agentic-workflow-doctor` with no flags → the same pass, project-wide, when no unit is in scope
  · `/review-change` → when the failure is a live blocker in the current unit, not a history question
  · `/triage-issue` → when the user has one filed item to classify, not a corpus to mine
