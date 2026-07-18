# fix/79-workflow-status-driver-signals

> Fix specification. The SPEC alone is the source of truth; its `## Phases`
> section is the execution ledger. Registered in `docs/fix/README.md`.

## Goal

Give an external driver the machine-readable signals the 2026-07-17 design
round (#66, #76, #77, #78) added but never exposed, so it can decide *when to
suggest which next step* without re-reading prose — and, in the same change,
close the one backstop gap that shares this unit's root mechanism: `audit-pr`'s
descope gate misses a descoped issue whose title/body names neither the slug
nor the issue number. Both halves consume the **same** provenance —
"enumerate issues born since branch divergence, match them against the governing
SPEC's `## Amendments` log" — which is why they land as one unit. It cannot wait
for a regular feature cycle: it is additive glue over already-merged contracts;
building it as a feature would re-scope work that is purely the sensor/backstop
side of fixes that already shipped.

## Issue

`#79` (primary) — GitHub issue. `#89` folded in per its own triage decision
(*"bundle the fix there rather than as a standalone unit"* referring to #79's
envelope work). The PR must close **both**:

```
Closes #79
Closes #89
```

> **Merge basis — user-directed, not a clean checklist pass.** `plan-fix`'s
> 4-box shared-root-cause checklist did **not** all-tick (files are disjoint:
> `skills/workflow-status/SKILL.md` + the schema package vs.
> `skills/audit-pr/SKILL.md`; and #89 carried an open detection-mechanism
> decision). The merge was taken on the user's explicit instruction, backed by
> #89's recorded "bundle into #79" triage and the shared `## Amendments`-log
> provenance both halves need. Each issue keeps its own acceptance criteria
> below.

## Branch

`fix/79-workflow-status-driver-signals`

## Depends on

`#66`, `#76`, `#77`, `#78` — all **merged** (PRs #88, #91, #92, #85). Trigger
met: #79's own triage said "start when the LAST of #66/#76/#77/#78 merges."

## Root cause

- **#79.** The design round defined four new contracts —
  layer-boundary/accumulation/sensitivity review cadence and the
  `Last reviewed: <sha>` marker (#77), the mandatory terminal review + its
  `--adversarial N` anchor (#76), the mechanical capability-closure integrity
  states (#78), and the descope `## Amendments` invariant + scope-bleed counters
  (#66 item 4). Each is a fact a programmatic driver must route on, but the
  `workflow-status` envelope (`skills/workflow-status/SKILL.md`, the sensor that
  exists precisely to spare drivers from parsing prose) never grew fields for
  them. #66 explicitly deferred "guardrail #4 (workflow-status envelope)" to
  #79 (`docs/fix/66-scope-bleed-guardrail`, fix-index row).
- **#89.** `audit-pr`'s **Scope integrity (descope)** gate
  (`skills/audit-pr/SKILL.md:159-163`, "Scope integrity (descope) — fixed
  output", step 1) enumerates branch-born issues that reference the unit **by a
  text match only** — title/body must mention the slug or issue number. A
  descoped issue filed with a generic title (or by a session that didn't know
  the slug) is invisible to the backstop. Introduced in fix #66 (PR #88); noted
  there as an `intentional-tradeoff` because closing it needs a different
  detection mechanism, not a wording tweak. `execute-phase`'s creation-time
  descope guard (`skills/execute-phase/SKILL.md:324-357`) is the **primary**
  control; this gate is a backstop, so the miss is a coverage gap in the
  backstop, not a bypass of the primary control.

**The shared root** both halves consume: the governing SPEC's `## Amendments`
log is the single authoritative record of every descope (defined once in
`execute-phase`'s *Descope guard*, `skills/execute-phase/SKILL.md:356-357`).
#79's `issues_born.with_descope_amendment` counter and #89's widened gate both
need "branch-born issue → `## Amendments`-row provenance." Implementing that
match once, consumed by the sensor (report) and the audit gate (backstop), is
the unit.

## Detected in

- #79 — planned as the aggregation of the 2026-07-17 design round's sensor
  sides; trigger fired when the last dependency (#85, closing #78) merged.
- #89 — `review-change` on PR #88 (fix #66), classified `intentional-tradeoff`,
  deferred with a trigger ("bundle into #79's envelope work").

## Scope

### In scope

1. **workflow-status (`skills/workflow-status/SKILL.md`)** — per-unit signals
   attached to each `detail.features[]`/`detail.fixes[]` entry:
   - `review`: `last_checkpoint_sha`, `unreviewed_diff: {lines, files}` (vs that
     SHA), `terminal_done: bool`, `adversarial: {ran: bool, n: int}`.
   - `closure`: `{state: "present" | "absent-legacy" | "blocked"}` (the #78
     check's result).
   - `issues_born`: `{n, with_descope_amendment}` (#66 item 4).
   Plus a **typed** top-level `next.suggested[]` of
   `{command, trigger, source_skill}` — the suggestion surface extended with the
   new commands, each trigger **quoting the owning skill's own condition** and
   cross-referencing it (single-source, never a second drifting copy per #79).
2. **Schema package (`packages/agentic-workflow-schema`)** — mirror the one
   change that touches the *validated* surface: `next.suggested` as an
   **optional** typed field (`src/index.ts` type + `validateEnvelope`,
   `envelope.schema.json`, `dist/` rebuild, a test case), version **2.0.0 →
   2.1.0** (additive minor), `npm test` green. Schema README EN+ES gain the
   `next.suggested` field row (bilingual-sync rule).
3. **orchestration-envelope (`skills/orchestration-envelope/SKILL.md`)** — the
   schema owner: add `next.suggested` (optional) to the canonical Schema snippet
   and a field rule.
4. **audit-pr (`skills/audit-pr/SKILL.md`)** — widen the descope gate's step 1
   to a **second detection path**: an issue **linked from any `## Amendments`
   row** in the governing SPEC is enumerated regardless of its own title/body
   text. Text-match stays; this is additive coverage. Fixes #89.
5. **Registration** — `bump-skill` (versions of the 3 edited skills + CHANGELOG
   EN+ES + README skills table).

### Out of scope

- **Promoting the per-unit signals to typed top-level envelope keys.** They ride
  `detail.features[]`/`detail.fixes[]`, and `detail` is schema-opaque
  (`envelope.schema.json:158`, `"detail": {}`), exactly like `detail.urgent` /
  `detail.untriaged_issues` (fix #52). No schema field, no package churn for
  them. If a future driver needs strict validation of these, file a new fix.
- **A creation-time descope label on `execute-phase`** (#89 "possible direction"
  2) and **commit-trailer matching** (direction 3). The `## Amendments`-log
  cross-check subsumes the need; add these only if the amendments-log path is
  observed insufficient in practice → new fix.
- **Publishing the npm package to the registry.** The in-repo version bump lands
  here; the actual `npm publish` is the existing release flow
  (`docs/fix/38-schema-package-republish` precedent), not this PR.
- **GOLDEN_FIXTURE smoke.** None of the edited skills is on the executor/review
  smoke list (CLAUDE.md) — `workflow-status`, `orchestration-envelope`,
  `audit-pr` are not `execute-phase`/`plan-*`/`design-feature`/`review-*`. n/a.

## Rules that must never be violated

- **Read-only sensor.** `workflow-status` computes and reports; it never edits,
  commits, or judges. The new fields are computed from RUN/READ evidence only —
  unverifiable → `null` + a `workflow_observations` note, never a guess
  (`skills/workflow-status/SKILL.md` Guardrails).
- **Injection safety.** `next.suggested` triggers and `issues_born` counts are
  derived **only** from trustworthy mechanical signals — disposition/urgency
  **labels**, the `Last reviewed: <sha>` marker, `## Amendments` rows, `grep` of
  the closure block — **never** from issue/PR free-text title or body. This
  mirrors the `detail.urgent` labels-only discipline
  (`skills/workflow-status/SKILL.md:432-437`).
- **Same-PR schema mirror.** Any change to the *validated* envelope surface is
  mirrored in the schema package in the same PR (types + `envelope.schema.json`
  + version bump + `npm test`). `workflow-status` self-checks its emitted
  envelope against the bundled schema, so a skipped mirror breaks the skill at
  runtime (CLAUDE.md Verification).
- **Bilingual sync.** Editing `README.md`, `CHANGELOG.md`, or the schema package
  `README.md` obliges the reciprocal `.es.md` edit in the same change. SKILL.md
  and this SPEC stay English-only.
- **Single-source, don't duplicate.** `next.suggested`'s trigger strings quote
  the owning skill's condition and cross-reference it; the audit-pr widening
  keys off the same `## Amendments` log `execute-phase` owns — no second copy of
  either contract.
- **Additive only.** New fields are optional; old envelopes without them still
  validate; old consumers ignore them. Minor bump, no migration note.

## Operational risks

- **Runtime self-check coupling.** `workflow-status` validates its own emitted
  envelope against the bundled schema. If P3 emits `next.suggested` before P1's
  schema/dist rebuild lands, the self-check fails. Mitigation: phase order (P1
  schema first), and P1's done-when rebuilds `dist/` so the bundled validator
  matches. No jobs, queues, caches, or DB schema are touched.

## Security risks

- The only new attack surface is `next.suggested` / `issues_born` reading
  attacker-influenceable issue text. Closed by the injection-safety rule above:
  triggers and counts come from labels/markers/`## Amendments` rows/grep, never
  from free-text. No secrets, auth, PII, or webhooks involved.

## Compliance touchpoints

n/a — internal developer tooling; no user data, retention, or regional rules.

## Affected docs

- `skills/workflow-status/SKILL.md` — new Process steps + `## Machine envelope`
  fields + example + Turn contract + Done-when. (acceptance ↓)
- `skills/orchestration-envelope/SKILL.md` — canonical snippet + field rule.
- `skills/audit-pr/SKILL.md` — descope-gate step 1 second detection path + gate
  wording.
- `packages/agentic-workflow-schema/README.md` + `README.es.md` — `next.suggested`
  field row + versioning note (bilingual).
- `CHANGELOG.md` + `CHANGELOG.es.md`, `README.md` + `README.es.md` — via
  `bump-skill`.
- `docs/fix/README.md` — this fix's index row.

## Acceptance

**#79 — envelope signals + suggestion triggers**

- [ ] Each `detail.features[]`/`detail.fixes[]` entry can carry `review`
      (`last_checkpoint_sha`, `unreviewed_diff:{lines,files}`, `terminal_done`,
      `adversarial:{ran,n}`), `closure:{state}` ∈
      `present|absent-legacy|blocked`, and `issues_born:{n,with_descope_amendment}`
      — all additive, documented in `## Machine envelope` with the example
      envelope updated. Verify: `grep -q 'issues_born' skills/workflow-status/SKILL.md`
      and the other three field names present.
- [ ] `next.suggested[]` (`{command, trigger, source_skill}`) covers the new
      commands; each trigger quotes and cross-references its owning skill
      (`review-change`/cadence → #77; `review-change --adversarial N` → #76;
      `design-feature <slug>` retrofit → #78; `fold-findings` → #65). It is the
      same fixed checklist the skills print, not a second copy.
- [ ] `packages/agentic-workflow-schema`: `next.suggested` in `src/index.ts`
      types + `validateEnvelope` + `envelope.schema.json` (optional, additive) +
      `package.json` 2.0.0 → 2.1.0, in the same PR. Verify:
      `cd packages/agentic-workflow-schema && npm test` → all pass.
- [ ] `orchestration-envelope`'s canonical snippet + field rules include
      `next.suggested`. Verify: `grep -q suggested skills/orchestration-envelope/SKILL.md`.
- [ ] `workflow-status`'s self-check passes: an envelope with a populated
      `next.suggested` validates via the rebuilt `dist/` (covered by the P1 test
      case).
- [ ] `bump-skill` run: CHANGELOG EN+ES rows; schema package README EN+ES carry
      the `next.suggested` row.

**#89 — descope gate coverage**

- [ ] `audit-pr`'s descope gate step 1 enumerates an issue **linked from any
      `## Amendments` row** in the governing SPEC regardless of that issue's own
      title/body text; text-match stays as the other path. Verify:
      `grep -q 'linked from an' skills/audit-pr/SKILL.md` (the new path's marker
      phrase) and the gate table/summary no longer implies text-match is the
      only detection.
- [ ] `execute-phase`'s creation-time descope guard remains the primary control,
      unchanged (no edit to `skills/execute-phase/SKILL.md`).

## Phases

Execution ledger — `execute-phase --fix` runs **one phase per invocation** and
ticks tasks here. Every implementation phase below passed the 8-box phase-lint
(`docs/fix/_TEMPLATE/SPEC.md` `### Phase-lint`) before emission.

### P1 — Schema package `next.suggested` support

Layer: `schema/db`. Done-when: `cd packages/agentic-workflow-schema && npm test`
→ all pass, AND `grep -q '"suggested"' envelope.schema.json`.

- [x] Add `EnvelopeSuggestion` interface (`command`, `trigger`, `source_skill`:
      string) and an optional `suggested?: EnvelopeSuggestion[]` to
      `EnvelopeNext` in `src/index.ts`.
- [x] Extend `validateEnvelope`'s `next` block to validate `suggested` when
      present: array of objects with three string fields; absence is valid.
- [x] Add `suggested` (optional array; NOT in `required`) to the `next`
      properties in `envelope.schema.json`.
- [x] Bump `package.json` version 2.0.0 → 2.1.0.
- [x] Rebuild `dist/` (`npm run build`) so the committed validator matches
      (`dist/` is gitignored — rebuilt via `npm test`'s `tsc` step, verified
      `dist/index.d.ts` carries `suggested?: EnvelopeSuggestion[]`).
- [x] Add a test in `test/index.test.mjs`: an envelope with a populated
      `next.suggested` validates ok; a suggestion missing a field fails.
      (3 tests added: accepts populated, accepts absent, rejects incomplete —
      18/18 pass.)

### P2 — Schema package README field row

Layer: `docs`. Done-when:
`grep -q 'next.suggested' packages/agentic-workflow-schema/README.md && grep -q 'next.suggested' packages/agentic-workflow-schema/README.es.md`.

- [x] Add a `next.suggested[]` row to the "envelope, field by field" table in
      `README.md` (type: object array; open; meaning: trigger-attributed
      suggestions).
- [x] Add the reciprocal row to `README.es.md` (faithful translation).
- [x] Note the 2.1.0 additive-minor bump in each README's "Versioning" section
      (`README.md` "## Versioning", `README.es.md` "## Versionado").

### P3 — workflow-status per-unit signals emission

Layer: `docs`. Done-when: all four markers present —
`grep -q 'issues_born' skills/workflow-status/SKILL.md && grep -q '"closure"' skills/workflow-status/SKILL.md && grep -q 'last_checkpoint_sha' skills/workflow-status/SKILL.md && grep -q 'next.suggested' skills/workflow-status/SKILL.md`.

- [x] Add a Process step computing per-unit `review`
      (`last_checkpoint_sha` from #77's `Last reviewed: <sha>` marker;
      `unreviewed_diff` from `git diff --stat <sha>..HEAD`; `terminal_done` +
      `adversarial` from #76's terminal-review evidence), cross-referencing the
      owning skills. (Step 10. `terminal_done` is reused from step 8's existing
      `review_pending`, never recomputed. `adversarial.ran`/`n` are
      **honestly `null`** unless real evidence exists — no skill persists an
      adversarial-mode marker anywhere queryable today; this is documented
      inline, not silently guessed.)
- [x] Add a Process step computing per-unit `closure.state` via the #78
      capability-closure grep, cross-referencing `audit-pr`'s closure gate.
      (Step 11.)
- [x] Add a Process step computing per-unit
      `issues_born:{n,with_descope_amendment}` from the `## Amendments`-log
      provenance (single-source #66/`execute-phase`), labels/markers only.
      (Step 12, reusing `audit-pr`'s scope-bleed detection widened by P5.)
- [x] Add a Process step building `next.suggested[]`
      (`{command,trigger,source_skill}`), each trigger quoting the owning skill's
      condition (#77/#76/#78/#65) — single-source, not a second copy. (Step 13.)
- [x] Update `## Machine envelope`: document the four fields and update the
      example envelope (`review`/`closure`/`issues_born` on a `detail.features[]`
      entry; a populated `next.suggested`). Verified: the example envelope
      parses as valid JSON and passes `validateEnvelope()` from the rebuilt
      `dist/` (P1's schema mirror).
- [x] Update the Turn contract and Done-when to require the new fields; state the
      `detail`-placement rationale (schema-opaque, no package change) referencing
      `envelope.schema.json`. Renumbered steps 10→18 (was 10→14) and fixed every
      stale cross-reference (`step 6/7/8/2` unchanged; `10`→new content, old
      `10-14`→now `14-18`).

### P4 — orchestration-envelope contract snippet

Layer: `docs`. Done-when: `grep -q suggested skills/orchestration-envelope/SKILL.md`.

- [x] Add `suggested` (optional) to the `next` object in the canonical Schema
      snippet.
- [x] Add a field rule: `next.suggested[]` = `{command, trigger, source_skill}`,
      optional/additive, single-sourced from the owning skill's trigger.
- [x] Cross-reference the schema package 2.1.0 mirror.

### P5 — audit-pr descope-gate amendments cross-check

Layer: `docs`. Done-when: `grep -q 'linked from an' skills/audit-pr/SKILL.md`.

- [x] In "Scope integrity (descope) — fixed output" step 1, add a second
      detection path: an issue **linked from an `## Amendments` row** in the
      governing SPEC is enumerated regardless of its own title/body text.
- [x] State this widens the backstop's coverage only; `execute-phase`'s
      creation-time guard stays the primary control — cross-reference #89 and the
      single-source `## Amendments` log. (New "Backstop, not primary" bullet.)
- [x] Reword any gate-table/summary phrasing that implies text-match is the sole
      detection path. (Gate table row now states "Detection is two-path".)

### P6 — Skill registration via bump-skill

Layer: `docs`. Done-when: `git diff --name-only` includes `CHANGELOG.md`,
`CHANGELOG.es.md`, `README.md`, `README.es.md` and the three edited SKILL.md
`version:` bumps, AND `npx skills add . --list` lists every skill.

- [x] Run `bump-skill` for `workflow-status`, `orchestration-envelope`,
      `audit-pr` (minor bumps — additive capability). Versions: 1.6.1→1.7.0,
      1.2.0→1.3.0, 3.3.0→3.4.0. Lint: no violations.
- [x] Confirm CHANGELOG EN+ES rows and README skills-table versions updated.
      (Model/effort table unchanged — no tier changes.)

### P7 — Hardening & PR

- [x] Re-run the project's full verification gate (commands + exit codes pasted):
      `cd packages/agentic-workflow-schema && npm test` → 18/18 pass, exit 0;
      `npx skills add . --list` → clean
- [x] Pending-docs check: `git status --porcelain -- docs/` → empty
- [x] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and PRINT THE
      PR URL in the chat; the body includes `Closes #79` and `Closes #89`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #79` and push

## Testing

- **Schema package (P1)** — `npm test` in `packages/agentic-workflow-schema`
  (node:test): the new case proves a populated `next.suggested` validates and a
  malformed suggestion fails. This is the contract test; it also guards the
  `workflow-status` runtime self-check.
- **Skill discovery (P6/P7)** — `npx skills add . --list` lists every skill
  (markdown well-formed, frontmatter intact).
- No product runtime to drive; the skills are documents and the schema package
  is the only executable surface. Manual verification: read the updated
  `## Machine envelope` example and confirm the example envelope parses under the
  rebuilt `dist/` validator (implicit in the P1 test).

## Rollback

`git revert` the PR (single revert of the squash/merge commit). The schema
package version 2.1.0 is additive and harmless if left; revert it with the PR
for cleanliness. No data-side cleanup — nothing persisted, no migration, no
external state. If the package was not yet republished to npm (it is not, by
scope), there is nothing to yank.

## Effort

**M** (multi-commit, ≤ 1 day) — additive, mechanical work across the schema
package + three skill docs + bilingual READMEs + `bump-skill`; no new runtime
logic and no design decisions left open. Not L: each phase is a self-contained
additive edit with a machine-checkable done-when.

## Decisions made during drafting

- **D1 — Per-unit signals ride `detail`, not new top-level keys.** `detail` is
  schema-opaque (`envelope.schema.json:158`); precedent `detail.urgent` /
  `detail.untriaged_issues` (fix #52) needed no package change. Keeps the
  validated surface minimal.
- **D2 — `next.suggested` is the only validated-surface addition.** It is where
  #79's same-PR schema-mirror hard rule bites, so it is deliberately the single
  typed field: optional → minor bump (2.0.0 → 2.1.0), small mirror, self-check
  stays green.
- **D3 — #89 mechanism = `## Amendments`-log cross-check** (the issue's first
  "possible direction"), chosen over a creation-time label or commit trailers.
  Rationale: it is the mechanism #79's `issues_born.with_descope_amendment`
  already needs (the shared root that justified the merge), reuses the
  single-source `## Amendments` provenance, and avoids widening
  `execute-phase`'s creation-time contract. SKILL.md-only, no code.
- **D4 — `next.suggested` triggers are single-sourced.** Each entry quotes the
  owning skill's condition and cross-references it (#79's explicit "never a
  second, drifting copy"); computed from mechanical signals only (injection
  safety).
- **D5 — Merge taken on user instruction, not a clean checklist pass.** Recorded
  in `## Issue` above; each issue's acceptance criteria stay separable.

## Status

`pending`
