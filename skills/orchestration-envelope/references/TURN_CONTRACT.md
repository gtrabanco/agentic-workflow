# Canonical Turn Contract (orchestration-envelope owner)

## Turn contract — verify before ending the turn

```
✓ 1. Branch verified FIRST (`git branch --show-current` RUN, output pasted; default branch → new branch created before edits). Never work on main/master.
✓ 2. All pre-edit gates (phase-lint, architectural invariants, dependency) RUN, plus frozen acceptance verified, with commands/exit codes pasted. Any FAIL without an allowed override → STOP.
✓ 3. `git add`, `git commit -m "<type>(<scope>): <summary>"` EXECUTED; SHA pasted. Commits you did not run do not count.
✓ 4. Unit finished (single-pass/--fix/final phase)? `git push`, `gh pr create` EXECUTED; PR URL printed in chat (with --body-file, real Markdown, Closes #N). Roadmap/fix-index updated to `done · [#<pr>](<pr-url>)` in follow-up commit. For mid-phase push rules when a PR is already open, see per-consumer supplement (§ Push policy supplement).
✓ 5. Clean-tree check LAST (`git status --porcelain` RUN, output pasted). No uncommitted changes (code or docs). PR branch not ahead of remote.
✓ 6. Artifact language: explicit user > project docs > English.
✓ 7. Descope guard applied to every issue created this turn (dated ## Amendments in SPEC before issue).
✓ 8. Out-of-scope findings classified per Opportunistic finding policy, recorded in decisions.md; proposals created no issue without explicit user triage.
✓ 9. Closing `→ Next:` block printed as ABSOLUTE last output.
✓ 10. Machine result emitted if driver requested (package output profile).
✓ 11. No reconstruction from memory — missing reference → STOP.
```

**Single owner:** orchestration-envelope/references/TURN_CONTRACT.md. All skills load this + skill-specific additions only. Duplication forbidden. Missing reference = STOP.

**Push policy supplement:** Box 4 covers the end-of-unit push. Some consumers (e.g. `execute-phase/references/PREFLIGHT.md`) define additional push rules for mid-phase commits when a PR is already open — those per-consumer supplements extend this contract and must be loaded alongside it by the consumer skill.
