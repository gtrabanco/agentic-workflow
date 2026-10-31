---
"@gtrabanco/pi-agentic-workflow": major
---

feat(pi)!: remove the config-gated tool guards

Removes the entire config-gated tool guards feature shipped on the 4.10.0
train (PR #344) — the merge, history, ci and expensiveTests guards, the
AW_ALLOW bypass tokens, the `guards` config key and its strict validation,
and the stashed `guards.pending.json`. Every command runs ungated again.

Why: issue #346 confirmed the design cannot deliver what it promises — the
fail-closed config switch bricked unrelated routed skills on any config
issue, textual matching refused innocuous commands that merely quoted
guarded verbs (and trained circumvention), and whole-invocation blocking
took down unrelated commands in the same script. The per-surface /
per-command rework attempted on fix/346-guards-per-surface is abandoned
unmerged; the enforcement surface in agent sessions is now the soft rule
in AGENTS.md (linear history, no force push without explicit owner
permission). A config file that still carries a `guards` block gets the
standard unknown-key warning and nothing more.
