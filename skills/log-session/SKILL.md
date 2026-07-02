---
name: log-session
user-invocable: true
version: 1.1.1
argument-hint: "[note to prepend to the entry]"
model: sonnet
effort: medium
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Append a structured entry to the project's session log (`docs/LOGS.md`):
  what was done this session, files touched, decisions taken, and the next
  step — so the next session (or another person) can pick up the thread
  without re-reading git history. Run it before `/clear`, before closing
  Claude Code, or at any natural stopping point. Using a non-Claude / free-inference model? Edit model:/effort: in this frontmatter to your closest equivalent tier (see the README model-equivalence table).
  Triggers: "log this
  session", "log-session", "write a session log", "journal what we did",
  "record this session before I clear", "save the session summary".
---

# Log Session

Capture the *why* and the *what-next* of a working session — the context that
git history alone never records. A commit says what changed; a session log says
what you were trying to do, what you decided, and where to resume.

Deliberately cheap (`sonnet`/`medium`): this is structured summarization, not
judgment. It must never reach for an expensive model.

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

4. **Append the entry** to `docs/LOGS.md`, newest at the bottom (append-only,
   chronological). Use this format so the auto-hook entries and these stay
   compatible:

   ```markdown
   ## <ISO-8601 timestamp> — <branch> — manual
   - **Commits:** <n> (`<short-sha>…<short-sha>`)
   - **Files:** <comma-separated paths, or a count if many>
   - **Summary:** <what this session did>
   - **Decisions:** <key choices + why; omit the line if none>
   - **Next:** <the concrete next step>
   ```

   If the user passed a note as an argument, prepend it to the Summary.

5. **Commit policy.** `docs/LOGS.md` is documentation — keep it coherent, but do
   **not** open a PR just for a log entry. If you're mid-feature on a branch,
   the entry rides along with the next commit. If the working tree is otherwise
   clean and the user wants it persisted, ask before committing a standalone
   `docs(log): session <date>` commit. Never push without the project's push
   convention.

## Guardrails

- **Never use an expensive model for this.** It's summarization; `sonnet` is the
  ceiling, and the hooks do the free mechanical version.
- **Don't invent facts.** Decisions and next steps come from the actual session
  (your context + git), not plausible-sounding filler. If a section has nothing
  real, omit its line rather than padding.
- **Append, never rewrite.** Past entries are a historical record — don't edit
  or "tidy" them. Same reasoning as not rewriting a delivered feature's planning
  artifacts.
- **One file, append-only.** Don't fan session logs across files.

## Portability (agents other than Claude Code)

The workflow is the contract; Claude Code features are conveniences. On an
agent that lacks one, apply the fallback — never skip the step the feature
enables:

- **No Claude Code hooks** — the template's auto-logging hooks (SessionStart
  marker, SessionEnd entry) don't run on other agents, so there is no marker
  file and no free mechanical entry: this skill is the **only** journal writer.
  Run it before ending every session, and bound the session with git alone
  (Process step 1's no-marker path).
- **No `/clear`** — read it as your agent's context-reset / new-conversation
  equivalent, in the triggers and in the closing block alike.
- **No per-skill `model:`/`effort:`** — the intent stands: use a **cheap**
  model for this. It's summarization, never judgment.

## Relationship to other skills

- Complements the `template/`'s **SessionEnd hook** (free, mechanical, automatic
  on `/clear` and exit) and the **opt-in SessionStart restore hook** (re-injects
  the last entry to resume context). This skill is the rich, manual entry.
- Pairs with `execute-phase`'s per-feature `progress.md`: that tracks progress
  *within* a feature; the session log is *cross-cutting* — whatever you touched
  this session, across features/fixes.
- Not part of the PR gate — it's a working-memory aid, not a merge artifact.

## Done when

- A new entry is appended to `docs/LOGS.md` with at least Summary and Next.
- The mechanical facts (branch, commits, files) are accurate to git.
- **The closing `→ Next:` block is printed:**

  ```
  → Next: /clear (or your agent's context reset) is now safe — the session is captured
    · resume later → the command named in the entry's **Next** line
  ```
