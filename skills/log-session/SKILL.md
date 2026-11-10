---
name: log-session
user-invocable: true
version: 4.10.0
argument-hint: "[note to prepend to the entry]"
author: "Gabriel Trabanco <1969593+gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Append a structured entry to the project's session log (`docs/LOGS.md`):
  what was done this session, files touched, decisions taken, and the next
  step — so the next session (or another person) can pick up the thread
  without re-reading git history. Run it before `/clear`, before closing your
  agent session, or at any natural stopping point. Model-agnostic: the skill
  inherits whatever model and effort your agent session is already using.
  Triggers: "log this
  session", "log-session", "write a session log", "journal what we did",
  "record this session before I clear", "save the session summary".
---

# Log Session

Capture the *why* and the *what-next* of a working session — the context that
git history alone never records. A commit says what changed; a session log says
what you were trying to do, what you decided, and where to resume.

Deliberately cheap (use the cheapest available model, with reasoning/thinking
off where the provider allows it — a quota-free tier when the plan offers one,
so this skill pays in bytes, not quota): structured summarization, not
judgment. It must never reach for an expensive model.

## Turn contract

Load and verify the **canonical** [Turn contract](../orchestration-envelope/references/TURN_CONTRACT.md) (11 boxes) before ending every turn; the entry write itself is the skill-specific commit box — the fragment carrier (issue #405) and the two-doors flow (#429) own where the entry lands, not an inline contract. Skill-specific additions (the docs-language and `→ Next:` boxes are canonical-owned and not restated here):

```
✓ The entry was WRITTEN with accurate git facts: appended to docs/LOGS.md, or — when the fragment carrier `.agentic-workflow/journal/` exists (issue #405) — written as a new fragment there (the aggregator owns the journal; a direct append is refused)
✓ `bun scripts/session-close.mjs close` RAN and exited 0 (or 2, with the leftover paths named) — the entry is committed, not left riding along
✓ No past entry was edited
```

Missing reference → STOP. About to end the turn with any box unchecked? The
turn is NOT done — complete the missing box first (weak models drop
end-of-document duties; this list is first on purpose).

## Two doors, one behaviour (#429)

With `@gtrabanco/pi-agentic-workflow` loaded, `/log-session` is a command: the
handler records the invocation (`.pi/.session-<id>.log-session`), runs the writer
below and names the entry's exact target before this file reaches you; a settled
turn with no entry there is reported. The record is code's fact, the prose is
yours. Without the extension, or via `/skill:log-session`, every step below is
yours.

## When to use

- **Before `/clear`** (or your agent's context-reset equivalent) — you're about
  to wipe context; capture it first.
- **Before closing your agent** for the day.
- **At a natural stopping point** — a feature paused mid-way, a thread you want
  to be able to resume cold.
- **After a long session** with several decisions worth remembering.

This is the *manual, rich* counterpart to the lightweight auto-logging hooks
the `template/` ships (see `template/.claude/`). The hooks capture the
mechanical facts for free on every exit; this skill writes the thoughtful
entry when you want one.

## Step 0 — Discover the project (always first)

Per the agent guide's **Workflow conventions** + **documentation map**, locate
the session log. Default path: `docs/LOGS.md`. If the documentation map names a
different location, use that. If no log file exists yet, create it from the
shape in `template/docs/LOGS.md` (a short header + the entry format below) and
say so.

If a session-start marker exists (`.claude/.session-*.start`, written by the
template's SessionStart hook), read it to bound the session precisely — it holds
the HEAD sha and start time at session open.

## Process

1. **Establish the session boundary.**
   - If a marker is present, the session spans `marker_sha..HEAD` plus any
     uncommitted work.
   - Otherwise, use your own conversation context as the source of truth for
     what happened this session, and corroborate with `git log` of the recent
     commits and `git status` / `git diff --stat` for uncommitted changes.

2. **Gather the mechanical facts** (cheaply, with git):
   - branch (`git branch --show-current`),
   - commits this session (`git log --oneline <since>..HEAD`),
   - files touched (`git diff --stat <since>..HEAD` + uncommitted).

3. **Write the narrative** — the part only you can add:
   - **Summary:** 1–3 sentences on what this session set out to do and what
     actually got done.
   - **Decisions:** the non-obvious choices made and *why* (the rationale that
     would otherwise be lost). Link related docs/issues.
   - **Next:** the concrete next step(s) — the command to run, the unfinished
     thread, the open question. Write it so a cold reader knows exactly where to
     resume.
   - **Status words are forge-verified.** `merged`, `closed`, `approved` — any
     claim about a PR/issue state is checked with the forge in the same turn
     (`gh pr view <N> --json state,mergedAt`) before it is written. A log that
     records a state the forge contradicts is a false record that the next
     review must chase (fix #157's F14). Write the actual state: "PR #N open,
     awaiting the human merge".

4. **Render and write the entry** — the mechanical facts (timestamp, branch,
   commit count and range, files touched) are computed for you:

   ```
   bun scripts/session-close.mjs render --summary "<what this session did>" \
     --decisions "<key choices + why>" --next "<the concrete next step>"
   ```

   It writes nothing: apply its output where the project opted in —

   - **No fragment carrier** (the default): append to the **end** of
     `docs/LOGS.md` (append-only, chronological) with your editing tool.
   - **Fragment carrier** (`.agentic-workflow/journal/` exists — issue #405):
     hand the entry to its writer, never to `docs/LOGS.md` (the aggregator
     owns that file):

     ```
     agentic-workflow journal write --kind narrative --summary "<summary>" \
       --decisions "<choices + why>" --next "<next step>" [--session <id>]
     ```

     It computes the timestamp, branch and name, renders the block, refuses
     bytes the aggregator could not read, never overwrites, and refuses a
     second entry of the same kind from a session that already registered one
     (`already registered` — one entry per conversation per kind; re-running
     this skill in the same conversation is the case it stops, while the
     auto-log's mechanical entry is the same conversation's other kind and
     does not block it) — the
     filename is never composed here. Grammar:
     `journal-fragment-grammar@1` + `journal-write-grammar@1` in
     `@gtrabanco/agentic-workflow`'s README; long prose: `… render … | …
     journal write --kind narrative --content -`.

   Omit `--decisions` / `--next` when there is nothing real to record — the script drops the line
   rather than emitting an empty one. A user-supplied note is prepended to the
   Summary.

5. **Close the session** — commit the entry and prove the tree is clean:

   ```
   bun scripts/session-close.mjs close
   ```

   It refuses unless the entry was written the way the project opted in —
   `docs/LOGS.md` appended to (a rewritten or truncated log is not a session
   entry), or, in fragment mode, new fragments added under
   `.agentic-workflow/journal/` with `docs/LOGS.md` untouched — commits that
   surface alone as
   `docs(log): <the appended summary>`, and reports every path still uncommitted:
   exit `0` clean, `2` the named leftovers are still dirty, `1` refused. Do not
   open a PR just for a log entry, and never `git add -A` here — a concurrent
   conversation's work must not be swept into a log commit.

## The canonical split — this skill's half (feature 66, D2)

Two writers exist on purpose; neither mirrors the other:

- **`docs/LOGS.md` (this skill)** is the **human/team journal** — what a session
  set out to do, what it decided, where to resume. It travels with git, so a
  teammate or a fresh clone reads it with no local state.
- **Engram (`mem_session_summary`, and the lane's `unit/<NN-slug>/doc` topic)**
  is **local decision and gotcha recall keyed by unit id**, written by
  `unit-lane` and `execute-phase` at unit boundaries. It stays on the machine.

Engram never mirrors this log, and this log never mirrors Engram: team memory
travels with git, agent recall stays local. Write the journal half here; the
protocol half (boundaries, recall order, degradation) lives in the lane's
memory reference, `../unit-lane/references/MEMORY.md`.

## Guardrails

- **Never use an expensive model for this.** It's summarization; the cheapest
  available model (reasoning off where the provider allows → zero thinking
  tokens) is the ceiling, and the hooks do the free mechanical version.
- **Don't invent facts.** Decisions and next steps come from the actual session
  (your context + git), not plausible-sounding filler. If a section has nothing
  real, omit its line rather than padding.
- **Append, never rewrite.** Past entries are a historical record — don't edit
  or "tidy" them. Same reasoning as not rewriting a delivered feature's planning
  artifacts.
- **One file, append-only.** Don't fan session logs across files.

## Portability (agents other than Claude Code)

Preamble: owned by `skills/orchestration-envelope/references/PORTABILITY.md` — this skill's own fallbacks:

- **No Claude Code hooks** — the template's auto-logging hooks (SessionStart
  marker, SessionEnd entry) don't run on other agents, so there is no marker
  file and no free mechanical entry: this skill is the **only** journal writer.
  Run it before ending every session, and bound the session with git alone
  (Process step 1's no-marker path).
- **No `/clear`** — read it as your agent's context-reset / new-conversation
  equivalent, in the triggers and in the closing block alike.
- **No per-skill `model:`/`effort:`** — the intent stands: use the cheapest
  available model for this. It's summarization, never judgment. Turn
  reasoning/thinking off where the provider allows so the append pays zero
  thinking tokens; a vendor preset (installed separately) may route this skill
  to a quota-free tier automatically.

## Relationship to other skills

- Complements the `template/`'s **SessionEnd hook** (free, mechanical, automatic
  on `/clear` and exit) and the **opt-in SessionStart restore hook** (re-injects
  the last entry to resume context). This skill is the rich, manual entry.
- Pairs with `execute-phase`'s unit doc `## Progress log`: that tracks progress
  *within* a unit; the session log is *cross-cutting* — whatever you touched
  this session, across units.
- Not part of the PR gate — it's a working-memory aid, not a merge artifact.

## Done when

- A new entry is written the way the project opted in — appended to `docs/LOGS.md`, or added as a fragment under `.agentic-workflow/journal/` — with at least Summary and Next.
- The mechanical facts (branch, commits, files) are accurate to git.
- **The closing `→ Next:` block is printed:**

  ```
  → Next: /clear (or your agent's context reset) is now safe — the session is captured
    · resume later → the command named in the entry's **Next** line
  ```
