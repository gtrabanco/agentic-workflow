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

## 2026-07-02T15:31:12Z — main — manual
- **Commits:** 6 (`5e1d16d…71ac500`)
- **Files:** README.md, README.es.md, CLAUDE.md, CHANGELOG.md, CHANGELOG.es.md, 9 new `skills/review-*/SKILL.md`, `skills/{execute-phase,review-change,product-audit,init-workspace,triage-issue,audit-docs,ship-roadmap,plan-feature,plan-fix,audit-pr,log-session,bump-skill,plan-feature-interview,plan-feature-from-issue,plan-feature-scaffold,review-implementation}/SKILL.md`, `template/CLAUDE.md` (32 files, +1492/-233 total)
- **Summary:** Added the ship-roadmap demo video to both READMEs (then repositioned it above the title, centered, per feedback), then did two rounds of workflow hardening: (1) every user-facing skill now carries a `## Portability` section with generic fallbacks for agents/models without Claude Code's slash menu, per-skill model/effort, or `/loop`; (2) a much stricter pass — a brand-new 9-skill internal review pack (`review-code/-security/-verify/-debt/-design/-a11y/-brand/-perf/-seo`) so the workflow never depends on Claude-bundled or external review skills, heuristics converted to checklists and fixed "Return exactly" output contracts across the core skills, a Git-workflow convention (branches default vs worktrees) the user declares, and a Claude-tier → generic-capability-class model-equivalence table so the skills work on any model. A follow-up audit for leftover ambiguous phrasing found and fixed 5 remaining vague spots plus 3 internal planning skills missing a fixed completion-report contract.
- **Decisions:** External review skills (code-review, security-review, design-review, etc.) demoted from implicit dependencies to optional extras — the internal `review-*` pack is now the only thing `review-change`/`product-audit` require, so the workflow works identically on any agent with zero external skills installed. Git workflow default is `branches` (one active unit, no worktrees) per the user's own preference, not `worktrees`, even though worktrees would parallelize faster — correctness/simplicity over speed for a single-operator repo. Model-equivalence table keeps Claude tiers as the *declared default* (Anthropic sets the reference bar) rather than trying to be neutral — explicit choice per the user.
- **Next:** Validate the new formats for real — run `/plan-feature` + `/execute-phase` on a target repo (e.g. ship-lab) and confirm the fixed output blocks (`Return exactly`, checklists, PASS|FAIL) print exactly as specified, ideally once on Claude and once on a non-Claude model to check the model-agnostic claim. Optionally extend the same checklist/ambiguity audit to `docs/workflow/*.md` (out of scope this session — skills only).
