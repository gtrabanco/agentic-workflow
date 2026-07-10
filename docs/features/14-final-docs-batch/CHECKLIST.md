# 14 — final-docs-batch — Completion checklist

- [x] Schema migration applied — n/a (docs only)
- [x] Core layer has no outer imports — n/a (docs only)
- [x] Orchestration idempotent + typed errors — n/a (docs only)
- [x] Adapters implement ports — n/a (docs only)
- [x] Tests pass — n/a; verification is the acceptance-criteria command list (below)
- [x] Type-check/lint green — n/a; `npx skills add . --list` used as the discovery check instead
- [x] UI strings localized — n/a (no UI); EN/ES parity read-verified for every swept block
- [x] Domain value-object rules respected — n/a (docs only)
- [x] User-facing limitations disclosed — n/a
- [x] New deps pinned — none added

## Decision not captured in the SPEC

**The SPEC's own acceptance-criteria grep for `N_UF` is unanchored and
over-counts by one.** `grep -rl "user-invocable: true" skills/*/SKILL.md`
matches any occurrence of the string anywhere in a file, not just the
frontmatter — `skills/orchestration-envelope/SKILL.md` mentions the phrase
`` `user-invocable: true` `` in prose (documenting a rule about *other*
skills) while its own frontmatter correctly declares
`user-invocable: false`. That false positive inflated the SPEC's assumed
reality from **15 user-facing + 13 internal** (verified by anchored
`^user-invocable: true` against every skill's actual frontmatter, and cross-
checked against `npx skills add . --list`, which shows 28 skills total) to
16 + 12.

**Resolution (reality over the SPEC's stale figure):** every count in this
sweep — `README.md`, `README.es.md`, `docs/workflow/SKILLS.md` — was set to
the frontmatter-verified **15 user-facing + 13 internal**, not the SPEC's
assumed 16 + 12. This is also why `README.es.md` needed **no** count edits:
it already read 15 + 13 correctly in both places; only `README.md`'s
repo-layout code block (line 56) and `docs/workflow/SKILLS.md`'s intro were
stale (at 14/14 and 12/4 respectively). `docs/features/01-generate-docs/known-issues.md`
#4's "real: 14 + 14" figure was itself already stale by the time this unit
ran (features 08–13 added skills since) — resolved against the same
frontmatter-verified 15 + 13.

The acceptance criterion "no occurrence of the stale `12|14|15` user-facing
figures remains" is satisfied in spirit, not letter: `15` is the *correct*
figure, not a stale one to be replaced with 16. Flagging this rather than
silently complying with a wrong hardcoded expectation, per the "when reality
contradicts the plan" rule.

## Also found and fixed during the sweep (in scope: model-routing coverage)

`docs/workflow/model-routing.yml` was missing a `generate-docs` entry despite
`generate-docs` being user-facing and already carrying a row in both README
model tables. Added (`sonnet` / `medium`, matching its README row) — this is
coverage, not a tier change, so it stays in scope per the SPEC's Design step 4.
