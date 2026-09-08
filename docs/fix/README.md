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
| [#154](https://github.com/gtrabanco/agentic-workflow/issues/154) | settings-picker-search-bulk-chain | `done` | Settings-console picker defects A–D (no filter/scroll/current value, one command per pass) + ordered model fallback chain (E): searchable windowed picker over `ctx.ui.custom` + pi-tui `SelectList`, current-value preselection, field independence, bulk apply/clear, `/aw-settings` alias, `model` chain schema (1–4 refs) probed by dispatch without touching session state; `setModel` ≤ 1 per routed turn. Package-only; README EN+ES + version bump same PR. Independent of #201/#198/#196/#174; branch cut from `main@f48dff00` to stay disjoint from fix #200. || [#191](https://github.com/gtrabanco/agentic-workflow/issues/191) | handoff-review-fold-order | `in-progress` · [#193](https://github.com/gtrabanco/agentic-workflow/pull/193) | Reorder every execute-phase/ship-roadmap terminal hand-off to the canonical `review-change → fold-findings → re-review → audit-pr` order (fix #161 P3a remap inverted it); drop "mandatory" from the fold; red-first discipline-test pin + release bookkeeping. Replan 2026-09-08: extended with the reviewer-side mirror defect — fence `review-change` to end at the report on `REVIEW-FAIL` (C1 Review-end turn boundary), reroute fix-now destination phrasing to a separate `/fold-findings` after the review ends (C2/C4), state the review's only mutations + `→ Next:` is a recommendation not a to-do list (C3), clarify two-cycle re-runs count separate review invocations (C5), bump 3.5.0. |
| [#181](https://github.com/gtrabanco/agentic-workflow/issues/181) | pi-server-devdep-obsolete | `done` · [#190](https://github.com/gtrabanco/agentic-workflow/pull/190) | Drop obsolete `@earendil-works/pi-server@0.85.0` devDependency (zero imports, shim only needed for pi 0.85.0's packaging defect fixed in 0.85.1 by #9132); pin peer to `>=0.85.1` to prevent stale installs; refresh README baseline note 0.85.0→0.85.1. |
| [#182](https://github.com/gtrabanco/agentic-workflow/issues/182) | scoped-workspace-state-binding | `planned` · [PR #190 open] | Scope review-change workspace preconditions, head-bound receipts, and turn-contract box 5 to the affecting surface; one deterministic CLI beside `pre-execution-snapshot.mjs` (sign/verify + ledger writes + forge-facts); audit-pr sole terminal-hygiene owner. Depends on #171 + #172; lands before #173. |
| [#165](https://github.com/gtrabanco/agentic-workflow/issues/165) | folded-yaml-description | `done` · [#169](https://github.com/gtrabanco/agentic-workflow/pull/169) | Every bundled command registered its description as literal `">"`: `readSkillMeta()` never parsed folded/literal YAML block scalars. Parser fix + regression fixture in `packages/pi-agentic-workflow/`; version 0.4.2. |
| [#159](https://github.com/gtrabanco/agentic-workflow/issues/159) | review-fold-loop-bounds | `done` · [#160](https://github.com/gtrabanco/agentic-workflow/pull/160) | Bounded the review→fold loop (materiality floor, state preconditions, folded-row re-verification, two-cycle cap) |
| `157-claude-skills-self-mount` | Untrack the always-on `.claude/skills` self-mount, gitignore local opt-in mounts, document the installed-release dogfooding model (CLAUDE.md + README EN/ES) | done · [#158](https://github.com/gtrabanco/agentic-workflow/pull/158) | — | [#157](https://github.com/gtrabanco/agentic-workflow/issues/157) |
| [#161](https://github.com/gtrabanco/agentic-workflow/issues/161) | finding-verification-loop-removal | `done` · [#163](https://github.com/gtrabanco/agentic-workflow/pull/163) | Authoring research gate (fetch/WebFetch/browser), verified+signed findings (`finding-mark@1`), `loop-review-fold` retirement (programmatic loop via AWL) — all six phases executed (P1–P4), AC1–AC7 green; plan-review-pass (ar-161-3); dep #160 merged. |
| [#166](https://github.com/gtrabanco/agentic-workflow/issues/166) | pi-0850-baseline-refresh | `done` · [#168](https://github.com/gtrabanco/agentic-workflow/pull/168) | Re-verify `@gtrabanco/pi-agentic-workflow` against pi 0.85.0 (dev peer re-point + suite + manual smoke) and refresh the verified-baseline note EN+ES; release bookkeeping 0.4.1 in the same PR. |
| [#162](https://github.com/gtrabanco/agentic-workflow/issues/162) | verdict-receipt-roadmap-desync | `done` · [#178](https://github.com/gtrabanco/agentic-workflow/pull/178) | Receipt self-check (write-then-report mechanical, sensor-verified in-turn), `done`-unmerged never suppresses a gate, `NEEDS-DESIGN` only from `review-spec`, guards gate blind re-reviews only, and the `impossible-timeline` receipt freshness guard (schema 4.1.0 + sensor). |
| [#179](https://github.com/gtrabanco/agentic-workflow/issues/179) | declared-ledger-delta-receipts | `pending` | Execution-ledger amendments (SPEC tick flips, obligation `status` cells) become a declared class: the sensor answers `declared-delta` instead of voiding plan receipts, `audit-pr` warns non-blocking, verify-axis staleness findings fold. Depends on #170/#171/#172 (features 30/31/32) merging — dependency gate enforces at execution. |

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
