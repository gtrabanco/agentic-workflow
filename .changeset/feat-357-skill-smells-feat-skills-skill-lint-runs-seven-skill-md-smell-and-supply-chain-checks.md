---
"skill-lint": minor
---

feat(skills): skill-lint runs seven SKILL.md smell and supply-chain checks

The repo-maintenance linter gains its mechanical half: `scripts/skill-lint.mjs`
runs seven content checks over every shipped skill markdown — `SKILL.md` and its
`references/` — for a hidden HTML comment, an XML/HTML tag in the frontmatter
`description:`, an invisible or zero-width codepoint, an unpinned external URL, a
credential-access or exfiltration-shaped instruction, a backslash path, and a
dated currency claim or expiry. Report-only, dependency-free, byte-stable output,
`PASS`/`FAIL` on the exit code.

Each check admits the shape this repo already uses (the declared machine marker,
the `<placeholder>` argument hint, the pinned URL, the regex escape, the
provenance date) and the smells that conflict with the train version, the context
budgets and the English-only policy are recorded as skipped with their reason.
Its sibling suite ships one fixture per pattern, the ablation of each, and the
shipped tree's clean pin, so a future skill edit that reintroduces a smell
reddens the root gate instead of waiting for an audit.
