# Session log

Append-only journal of working sessions — the context git history doesn't
record. A commit says *what* changed; an entry here says what the session set
out to do, what was decided and *why*, and where to resume.

**How it gets written**

- **Automatically (free)** — the SessionEnd hook in `.claude/` appends a
  *mechanical* entry (timestamp, branch, commits, files) on every `/clear` and
  exit. No model, no tokens. See [`.claude/README.md`](../.claude/README.md).
- **Manually (rich)** — run `/log-session` to add a thoughtful entry with a
  summary, the decisions made, and the concrete next step. Do it before
  `/clear`, before closing for the day, or at any natural stopping point.

Newest entries go at the **bottom** (chronological, append-only). Don't edit or
tidy past entries — they're a record.

## Entry format

```markdown
## <ISO-8601 timestamp> — <branch> — manual|auto
- **Commits:** <n> (`<short-sha>…<short-sha>`)
- **Files:** <paths, or a count if many>
- **Summary:** <what this session did>          (manual only)
- **Decisions:** <key choices + why>            (manual only; omit if none)
- **Next:** <the concrete next step>            (manual only)
```

---

<!-- entries appended below this line -->
