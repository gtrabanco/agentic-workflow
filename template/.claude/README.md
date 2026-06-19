# `.claude/` — session-logging hooks (optional)

Automatic, **free** session logging for the agentic workflow. These hooks keep
[`docs/LOGS.md`](../docs/LOGS.md) — the working journal — up to date without you
remembering to. They run plain shell + `git`: **no model, no token cost** for
the mechanical capture.

This pairs with the **`/log-session`** skill, which writes the *rich* entry
(summary, decisions, next step) when you want one. Hooks = the free automatic
floor; the skill = the thoughtful manual entry.

## Setup

1. Copy `settings.json.example` to `settings.json` and keep the hook blocks you
   want (JSON has no comments — delete the `"//"` keys).
2. Make the scripts executable:
   ```sh
   chmod +x .claude/hooks/*.sh
   ```
3. That's it. Entries start appending to `docs/LOGS.md` on `/clear` and exit.

## The hooks

| Hook | Event | Cost | Default |
|---|---|---|---|
| `log-session-start.sh` | `SessionStart` | free | **recommended** — writes a marker (HEAD sha + time) so the end hook can compute the session's exact diff |
| `log-session-end.sh` | `SessionEnd` | free | **recommended** — appends a mechanical entry (branch, commits, files) on `/clear`, exit, logout |
| `restore-context.sh` | `SessionStart` | input-context tokens only | **opt-in** — re-injects the last log entry so you resume cold. No model call; the only cost is the entry's tokens at each start. Delete its block to disable. |

## Why restore is opt-in

`restore-context.sh` doesn't *generate* anything — it just reads the last entry
and hands it back as context. But that text is added to every new session, so
it consumes input-context tokens each start. Useful if you frequently `/clear`
and want continuity; skip it if you'd rather keep sessions clean. Keeping log
entries short keeps the cost negligible either way.

## Want richer auto-entries (still cheap)?

The end hook captures facts, not narrative. If you want an automatic *summary*
too, point the SessionEnd hook at a headless, **cheap** model — never the
expensive tier — e.g. replace its command with one that runs
`claude -p --model claude-haiku-4-5 "Summarize the session at $transcript_path
into a docs/LOGS.md entry"`. This trades a little token cost and latency on each
exit for a narrative entry. Most setups don't need it — the `/log-session` skill
covers the rich case on demand.
