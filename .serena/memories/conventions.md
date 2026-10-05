# Project conventions
- Commit messages use Conventional Commits: `<type>(<scope>): <summary>`; scope may be omitted where existing practice allows.
- Implementation phases are `P1`, `P2`, … and called phases; never `S1`/Steps.
- Skill directory and `name:` are matching kebab-case; every user-facing skill has `user-invocable: true`.
- Every user-facing skill includes an early Turn contract, fixed output contract, Portability section, and final visible `→ Next:` recommendation.
- Any `SKILL.md` edit requires per-skill version bump, EN+ES changelog rows, README tables, and the `bump-skill` maintenance procedure; executor/review skill wording changes also run the golden fixture.
- Shared skills/docs must remain stack/architecture agnostic.
- Machine/config lists are alphabetical; narrative skill listings follow workflow stage order.
- Never weaken tests or a frozen `ACCEPTANCE.md` validator to manufacture green.