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

**Adaptive lane note.** The unit SPEC.md carries its own **Progress log**
(section 11: dated `YYYY-MM-DD HH:MM` entries per step, what was done, commit
sha or evidence, what is next) and **Evidence** section (what was run, exit
digest, verified-by). LOGS.md is the cross-unit session journal; the unit
Progress log is the per-unit step ledger. They complement each other — run
`/log-session` at the end of each catalog step to capture the human-readable
session context alongside the machine-readable Progress log in the unit doc.

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
