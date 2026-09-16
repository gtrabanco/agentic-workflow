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

## Machine-check profile (boxes 1–5)

Boxes 1–5 are mechanical. Demonstrate them by running the verifier — the
scaffold shim `template/.agentic-workflow/hooks/turn-contract.sh` (bash + git +
gh) or the producer-crate engine
`packages/agentic-workflow/bin/turn-contract.mjs` — and pasting its one-line
receipt beside the git/gh evidence. When the receipt is pasted, reciting boxes
1–5 in prose is **not** required. Verifier unavailable (no bash, or no
shim/engine in the project)? Recite boxes 1–5 exactly as before — the profile
never weakens a box, and a turn with neither receipt nor recitation is
unverified. Boxes 6–11 are unchanged: they stay agent-attested judgment calls
no script may speak for. The closing `→ Next:` block may be echoed from the
`workflow-status` envelope instead of hand-authored: `next.recommended`
supplies the recommended line and `next.alternatives` the `·` sub-bullets,
preserving the fixed block shape.

```text
turn-contract-receipt@1
ok-line:    TURN-CONTRACT ok
fail-line:  TURN-CONTRACT fail box<N>: <code>
codes:      branch-default | not-a-repo | no-commits | acceptance-missing |
            phase-lint-failed | pr-not-open | pr-head-mismatch |
            pr-unreachable | dirty-tree | ahead-of-remote
exit:       0 ok | 1 contract fail | 2 usage error
order:      boxes 1→5, first failure wins; within box5, dirty-tree precedes
            ahead-of-remote
stdout:     exactly one line; diagnostics never (git/gh evidence stays in the
            agent's transcript)
```

## Hand-off grammar (versioned — read by `scripts/normative-drift.test.mjs`)

Box 9's closing hand-off and box 10's machine result are ordered here, so the
tokens they may use are declared as grammar rather than prose. Every `from`/`to`
pair below must exist in the schema package's `WORKFLOW_TRANSITION_TABLE`, and
every field row must be a key that package's envelope validator declares: a pair
or a key no machine surface defines is a defect in this file, never in the table.

```text
hand-off-transitions@1
from | to
workflow-intent:review-spec | workflow-intent:plan-feature
workflow-intent:plan-feature | workflow-intent:review-plan
workflow-intent:review-plan | workflow-intent:execute-phase
workflow-intent:plan-fix | workflow-intent:review-plan
workflow-intent:review-plan | workflow-intent:design-feature
workflow-intent:execute-phase | workflow-intent:review-change
workflow-intent:review-change | workflow-intent:audit-pr
workflow-intent:audit-pr | workflow-intent:merge
workflow-intent:triage-issue | workflow-intent:execute-phase
workflow-intent:status | workflow-intent:design-feature
```

```text
hand-off-fields@1
# machine: envelope
object | field
next | recommended
next | alternatives
next | tier
next | suggested
```

