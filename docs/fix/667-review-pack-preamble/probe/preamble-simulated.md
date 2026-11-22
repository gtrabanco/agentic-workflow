# Shared pass preamble — the internal review pack (single owner)

Every internal review-pack finder (review-code, review-security, review-verify,
review-design, review-a11y, review-brand, review-perf, review-seo) and the
review-debt transform follow this file as the routed step's preamble: it owns
the scope contract, the checklist discipline and the findings-only guardrail.
The axis checklists stay in each pass's SKILL.md.

## Scope contract

The diff or path/glob the caller passes; default the current change vs the
default branch. For review-debt the scope is the caller's synthesized findings
table — never rescan the diff. State the scope at the top of the returned
table.

## Checklist discipline

Evaluate EVERY checklist item — none is optional. Every item is evaluated with
evidence (file:line or command output) or explicitly marked n/a with the
reason. The tally line reports the evaluated count equal to the checklist's
item count; a silently skipped item is a failed pass.

## Findings-only guardrail

Findings only; never edits, never refactors. Return only the fixed-format
findings table plus the tally, summary and decision lines — nothing more.

## Materiality bar

Owned by skills/review-implementation/references/FINDER_CONTRACT.md — apply it
as written; never pad the table.
