---
"@gtrabanco/pi-agentic-workflow": patch
---

fix(guards): read a one-positional `git config` as a read, and stop parsing the data a command carries (issue #618)

The Layer 1 git identity guard asked for consent on `git config user.name` —
one positional, no value — because the implicit-legacy branch emitted a `set`
write regardless of arity. In real git one positional prints the value (exit 1
when unset) and only two or more are the legacy write, so every identity check a
model ran the natural way was refused, and a headless session (`ask` degrades to
`block`) failed the whole bash call. `findGitConfigWrites` now derives a write
from two or more positionals, keeping every explicit verb and every scope write
exactly as it was, and options are read only where git reads them — past the key
a flag-shaped word is the value git writes, so `git config user.name --unset`
still asks.

The statement split also stops reading data as a command: a newline separates
statements, so a write on its own line is seen; a heredoc body is skipped whole,
because bash feeds it to stdin and never runs it — the shape that blocked the
live capture while the issue was being filed; and a backtick span is a command
substitution, judged wherever it stands unquoted. The module header states the
boundary that remains, and the sibling `-c`-only gate
(`scripts/git-config-writes.mjs`) shares the same positional rule, so a plain
read in a test carrier is no longer reported as a write.
