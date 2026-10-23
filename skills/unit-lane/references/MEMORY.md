# Memory protocol — save and recall at unit boundaries

Engram is this workflow's required cross-session memory substrate (owner
decision 2026-09-24, feature 66). **Required substrate is not a hard
dependency:** the committed docs stay authoritative, and a memory layer that is
down is reported once and recorded — it never blocks a unit.

This file is the protocol's single home. `execute-phase` and `log-session` carry
a thin instruction plus a pointer here; they never restate it.

## 1. Probe before the first memory read

Run the bounded health probe once per session, before the first read:

```sh
agentic-workflow memory probe        # human block
agentic-workflow memory probe --json # memory-probe@1 verdict
```

It is bounded (4 s / 10 s per check, 30 s ceiling), writes nothing, issues no
MCP tool call, and **always exits 0**. Paste its verdict into the unit doc's
Evidence section — one row, `verified-by` naming the session:

- `ok` → memory is trustworthy for this session.
- `degraded` → say **once** which checks failed, record the verdict, and keep
  working. Never re-probe in a loop, never ask the user to fix it first.

A `degraded` verdict is an answer, not a blocker: the degraded path in §7 is the
documented response.

## 2. Boundary saves — what, when, and under which key

Save at **three boundaries**, always under a stable per-unit topic key:

| Boundary | topic_key | Payload |
|---|---|---|
| unit start (after triage) | `unit/<NN-slug>/doc` | goal, the numbered acceptance criteria verbatim, the triaged step list |
| each phase transition | `unit/<NN-slug>/doc` | the phase id, what it changed, its Evidence outcome, new discoveries |
| unit close | `unit/<NN-slug>/doc` | final Evidence outcomes, decisions taken, the gotchas worth recalling |

One payload, four parts — the same four a later session needs to resume without
re-reading the docs:

```text
memory-payload@1
goal:    <one line — the unit's objective>
ac:      1. <numbered AC verbatim, one per line>
evidence: <phase> <command> → <exit/digest> → <outcome>
learned: <gotcha, edge case, or decision a fresh session would get wrong>
```

Call `mem_save` with `topic_key: "unit/<NN-slug>/doc"` and an explicit
`project`; on a write surface that exposes `session_id`, pass it too (§5). Later
boundaries reuse the same `topic_key` so the record **upserts** instead of
fragmenting into one row per phase.

**What is saved is a summary for recall, never the artifact.** The unit doc, its
Evidence rows and `docs/LOGS.md` stay authoritative; a memory record that
disagrees with them is wrong by definition.

## 3. Recall — the fixed order

Resume in this order, and stop as soon as the unit is reconstructable:

1. **`mem_context`** — scoped explicitly (`project: "<name>"`, and `scope` when
   you mean one).
2. **`mem_search`** — a scoped search with an **explicit `project`**. Never rely
   on an omitted selector for a global read; a default is not a decision.
3. **One retry** — if the project-scoped search misses, retry **once** with
   **`all_projects: true`** passed explicitly. A second miss is a miss.
4. **`mem_get_observation`** — fetch the full untruncated body of the hit that
   matters.
5. **Read the unit doc** and reconcile: the file wins on every conflict, and the
   difference is worth recording as a discovery (§2 `learned:`).

Only when `mem_context` and both searches miss does a fresh session fall back to
reading the docs cold — and that fallback is recorded, because it means the
recall path failed, not that nothing was ever saved.

When the cwd is ambiguous (several repos under it), call **`mem_current_project`**
and navigate by its `available_projects`: pick the matching project explicitly
rather than letting an ambiguous cwd decide. An ambiguous answer is never
resolved by guessing.

## 4. Keyword-bound recall — the disclosed ceiling

Engram's recall is **keyword-bound** (FTS5 over stored text, no vectors). Two
consequences are obligations, not trivia:

- **A miss is not evidence that knowledge was never saved.** It means the query
  did not hit the stored terms. Rephrase with the unit's own vocabulary (slug,
  AC wording, file paths) before concluding anything is absent.
- **What you save must be searchable later.** Save the words a future session
  will search for — the unit slug, the phase id, the failing command, the file
  path — not a paraphrase.

Hybrid FTS5+vector recall is Engram's own direction (#192), never built here.

## 5. Session attribution — explicit on every write, on the surface that carries it

Every write must be **attributed to one known session**, never to whichever
session a machine happens to resolve. On a box with several active runtime
sessions an unresolved attribution fails closed and the write is lost — the one
outcome this protocol exists to prevent (the health probe's
`session-ambiguity` check reads exactly this signal, §1).

Which parameter carries that attribution depends on the surface in front of you:

| Write surface | How the session is carried | What you do |
|---|---|---|
| Engram's own MCP server (`engram mcp --tools=agent`) | its `mem_save`, `mem_save_prompt`, `mem_session_summary` and `mem_capture_passive` take a `session_id` argument | open the session (`mem_session_start`) and pass that id on **every** write |
| a host whose memory tools expose no `session_id` (Pi's Engram provider binds the runtime session itself) | the provider stamps the session from the live runtime session and **refuses** when that identity is ambiguous or disagrees with the project | never write before the session is open, always pass an explicit `project` (and `cwd` when the directory could match more than one project), and treat an attribution refusal as a failed write — record it (§7), do not retry blind |

On both surfaces the obligation is the same and the check is the same: **a write
that cannot say which session it belongs to is a write that did not happen**.

- `mem_session_start` opens the id (or the runtime session the provider binds to)
  at unit start; the boundaries in §2 reuse it, and nothing is written before it.
- **`mem_session_end` runs only on confirmed-stale ids** — ids you opened yourself
  and know are finished. Never end an id a live session may still hold.
- When `mem_session_summary` cannot resolve the project, the explicit
  **project fallback** is the documented escape hatch: pass `project` by name
  and the summary lands instead of being refused. Record the fallback when you
  use it.
- Passing a `session_id` to a tool that does not declare it is not "explicit
  attribution", it is an invalid call. Read the tool's own parameter list when
  the host offers more than one memory surface, and record which surface you used.

## 6. The canonical split (D2)

Both writers exist on purpose; neither mirrors the other.

| Writer | Owns | Travels |
|---|---|---|
| `docs/LOGS.md` (`log-session`) | the human/team journal: what happened, for people | with git |
| `mem_session_summary` / `unit/<NN-slug>/doc` | local decision and gotcha recall keyed by unit id | local only |

Team memory travels with git; agent recall stays local. A double-write on
purpose, recorded here so it is never mistaken for an accident.

## 7. Degradation — recorded, never silent

When the probe says `degraded` or a write fails:

- **Local progress is preserved.** The unit doc, Evidence rows and commit are
  the record; they never depend on memory.
- **The mirror is marked pending explicitly** — one line in the Progress entry
  or Evidence row saying the memory write is pending, so a later session knows
  the gap exists and is not a "nothing was saved" conclusion.
- **Unrelated safe work continues.** Never stop a unit for a mirror failure.
- **Sync resumes when the layer answers** — retry the pending write at the next
  boundary, not in a loop.
- **Read both sides back.** After a write, read the file and the mirror; when
  the versions are irreconcilable, keep both and surface the difference rather
  than silently picking one.

## Checklist (pass only if)

- [ ] The probe ran once and its verdict is in Evidence (§1)
- [ ] A save happened at unit start, at each phase transition, and at close (§2)
- [ ] Every save was explicitly attributed: a `session_id` on a surface that
  accepts one, otherwise an open session plus an explicit `project` — and it
  named the unit's `topic_key` (§2, §5)
- [ ] Recall followed the fixed order, with an explicit `project` and at most
  one explicit `all_projects: true` retry (§3)
- [ ] Any miss was treated as keyword-bound, not as absence (§4)
- [ ] Any degradation was recorded as pending — never silent (§7)

## Forbidden

- Never let a memory verdict block a unit, or re-probe in a loop
- Never rely on an omitted selector for a global read
- Never write with unresolved session attribution — pass the `session_id` where
  the surface takes one, and where it does not, never write before the session is
  open (§5)
- Never call `mem_session_end` on an id you did not open or cannot confirm stale
- Never mirror `docs/LOGS.md` verbatim — the split is deliberate (§6)
- Never treat a recall miss as proof nothing was saved
- Never let a memory record override the committed artifact
