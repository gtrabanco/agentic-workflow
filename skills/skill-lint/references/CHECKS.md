## Skill content checks — smells and the supply chain

`scripts/skill-lint.mjs` mechanizes the seven checks below. This file owns what
each check *means*, the shapes each one admits, and the smells this repository
deliberately does not adopt; the script carries the patterns and never a second
copy of the meaning. Sources: `docs/research/papers-sweep-2026-11-02.md`
(arXiv 2607.01456 — SKILL.md smells; arXiv 2601.10338 + 2604.02837 — the skills
supply chain), adopted in `docs/research/ATTRIBUTION.md`.

### Scope

Every `*.md` under `skills/`: the `SKILL.md` **and** its `references/`.
`npx skills add` ships the folder, so the installing agent reads both and a
hidden instruction in a reference is the same attack as one in the `SKILL.md`.
A changed skill is scanned alone (`--skill <name>`); the default scan is the
whole tree.

### The seven checks

| id | flags | admitted |
|---|---|---|
| `SL-01` html-comment | a comment whose body is prose — the hidden-instruction vector an agent reads and a human never sees | a declared machine marker: a body shaped `<namespace>:<field>`, optionally followed by `key=value` tokens — the receipt markers (`review-change:pass`, `audit-pr:merge-ready`) and the `unit-lane` region markers |
| `SL-02` frontmatter-tag | an XML/HTML tag in the frontmatter `description:` (the text an agent reads to choose the skill) | plain text; `<placeholder>` argument hints live in `argument-hint:`, which this check never reads |
| `SL-03` invisible-codepoint | a soft hyphen, a zero-width or bidi control, a Unicode tag character — on any line | nothing: no instruction has a legitimate reason to hide a byte from its reader |
| `SL-04` unpinned-url | an external URL with no version, tag, commit or tree/blob ref | a URL carrying `@<version>`, `/v<X.Y[.Z]>`, `/tree/<ref>`, `/blob/<ref>`, `/tags/<ref>`, or a 7–40 hex commit |
| `SL-05` credential-or-exfiltration | an instruction that sends data to an external sink, or that reaches for a credential | prose about provenance, a path, a local command; the check wants a transfer verb **and** a sink on one line, or an access verb **and** a credential |
| `SL-06` backslash-path | a drive-qualified path, or a relative path whose segments are joined with a backslash instead of `/` — agents navigate a skill directory as a POSIX path | a POSIX path; a regex escape (`\d`) and a table escape (`\|`) are not paths |
| `SL-07` time-sensitive-claim | a dated currency claim (`as of <date>`, `the latest … <date>`) or an expiry (`expires`, `valid until`, `deadline`, …) | a provenance date written next to what it proves (`verified <date>`, `decision <date>`): a record that cannot rot |

Each finding prints `FINDING <id> <name> <path>:<line> — <detail>`; the verdict is
`PASS` only with zero findings and the exit code follows it (`0`/`1`). The lint
repairs nothing, writes nothing, and never touches the network.

### Recorded skips

The 2026 studies list 26 smells. The three below conflict with this repository's
own conventions and are **not** adopted — recorded here so the omission is a
decision, never an oversight.

| smell | reason | disposition |
|---|---|---|
| a per-skill `version:` that must be bumped with the change | unified train versioning (D-40-14): `scripts/release.mjs apply` stamps every skill from the accumulated changesets, and a hand bump is a second writer | skipped |
| a SKILL.md length / progressive-disclosure smell | context budgets are owned by `scripts/check-skill-context.mjs` and `docs/workflow/SKILL_CONTEXT_BUDGETS.json`; a second ceiling would be a second owner of the same fact | skipped |
| a missing-localization / translation smell | the package ships English-only permanently (owner decision 2026-10-27, issue #232): a locale smell has no target here | skipped |

### Report and next step

`bun scripts/skill-lint.mjs` (the node fallback is the same argv) prints the
block above; paste it verbatim in your report. A finding is repaired by the
author of the change — never by the lint.
