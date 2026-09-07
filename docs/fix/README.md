# Active fixes

Index of in-progress and pending fixes. Merged fixes are removed from this
table — history lives in git log + closed issues.

## Status legend

- `pending` — SPEC drafted, branch not yet open
- `in-progress` — branch open, work ongoing
- `done` — built, PR open, awaiting merge (merge state lives in the forge — same
  meaning as the roadmap's `done`); the row is removed only **after** the PR merges

## Active

| Issue | Topic | Status | Notes |
|---|---|---|---|
| [#165](https://github.com/gtrabanco/agentic-workflow/issues/165) | folded-yaml-description | `done` · [#169](https://github.com/gtrabanco/agentic-workflow/pull/169) | Every bundled command registered its description as literal `">"`: `readSkillMeta()` never parsed folded/literal YAML block scalars. Parser fix + regression fixture in `packages/pi-agentic-workflow/`; version 0.4.2. |
| [#159](https://github.com/gtrabanco/agentic-workflow/issues/159) | review-fold-loop-bounds | `done` · [#160](https://github.com/gtrabanco/agentic-workflow/pull/160) | Bounded the review→fold loop (materiality floor, state preconditions, folded-row re-verification, two-cycle cap) |
| `157-claude-skills-self-mount` | Untrack the always-on `.claude/skills` self-mount, gitignore local opt-in mounts, document the installed-release dogfooding model (CLAUDE.md + README EN/ES) | done · [#158](https://github.com/gtrabanco/agentic-workflow/pull/158) | — | [#157](https://github.com/gtrabanco/agentic-workflow/issues/157) |
| [#161](https://github.com/gtrabanco/agentic-workflow/issues/161) | finding-verification-loop-removal | `done` · [#163](https://github.com/gtrabanco/agentic-workflow/pull/163) | Authoring research gate (fetch/WebFetch/browser), verified+signed findings (`finding-mark@1`), `loop-review-fold` retirement (programmatic loop via AWL) — all six phases executed (P1–P4), AC1–AC7 green; plan-review-pass (ar-161-3); dep #160 merged. |
| [#166](https://github.com/gtrabanco/agentic-workflow/issues/166) | pi-0850-baseline-refresh | `done` · [#168](https://github.com/gtrabanco/agentic-workflow/pull/168) | Re-verify `@gtrabanco/pi-agentic-workflow` against pi 0.85.0 (dev peer re-point + suite + manual smoke) and refresh the verified-baseline note EN+ES; release bookkeeping 0.4.1 in the same PR. |
| [#162](https://github.com/gtrabanco/agentic-workflow/issues/162) | verdict-receipt-roadmap-desync | `done` · [#178](https://github.com/gtrabanco/agentic-workflow/pull/178) | Receipt self-check (write-then-report mechanical, sensor-verified in-turn), `done`-unmerged never suppresses a gate, `NEEDS-DESIGN` only from `review-spec`, guards gate blind re-reviews only, and the `impossible-timeline` receipt freshness guard (schema 4.1.0 + sensor). |

Historical artifacts remain under `docs/fix/`; merged and closed work is
intentionally absent from this index.

---

## Conventions

- Folder: `docs/fix/<issue-number>-<topic>/`
- Branch: `fix/<issue-number>-<topic>`
- Every fix has a tracked issue in the project's forge; the PR closes it via
  `Closes #<n>` (or the forge's equivalent auto-close convention).
- The row is removed from this table only **after** the PR merges — do not
  maintain history here.
- See `_TEMPLATE/SPEC.md` for the spec format.
- Workflow rules: the `execute-phase` skill's `--fix` mode (wherever your
  agent installed the skills).
