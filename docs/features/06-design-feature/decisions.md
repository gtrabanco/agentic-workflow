# 06 — design-feature · decisions

Architecture/scope decisions and open questions. Revisions are appended, never
overwritten (this is also the record `design-feature`'s own upsert semantics
mirror).

## Decisions taken (source: issue #13 + this SPEC)

- **D1 — Canonical name `design-feature`, no alias skill.** Trigger phrases
  ("add feature", "add a feature", "new feature") live in the description. A stub
  alias skill was considered and rejected for menu/bookkeeping noise. *(issue)*
- **D2 — One SPEC, two halves; no `DESIGN.md`.** `design-feature` writes the
  product half; `plan-feature` writes the engineering half. A second document
  would guarantee drift. *(issue)*
- **D3 — Gate keys on the SPEC `## Design status` marker in U3.** The roadmap
  `defined` status does not exist until U4, so the available ground truth is the
  SPEC marker. U4 re-points the gate from marker → roadmap status without
  reshaping the SPEC body. *(this SPEC, from the issue constraint "this unit may
  introduce the SPEC-half convention and the redirect, U4 wires the status
  machine".)*
- **D4 — `plan-feature-interview` is removed, not kept as a wrapper.** Two doors
  to product definition would defeat the purpose; its interview logic moves into
  `design-feature`. Major change; `MIGRATION.md` note. *(this SPEC)*
- **D5 — `plan-feature-from-issue` stays in plan-feature for U3.** The issue moves
  only the *interview* out. from-issue emits the two-halves SPEC and satisfies the
  closure gate; full unification is deferred (`known-issues.md`). *(scope control)*
- **D6 — No bypass flag on the redirect.** XS features pass the gate cheaply
  because `design-feature` scales down, not because the gate opens. *(issue)*
- **D7 — Upsert by default; no `--update` flag.** `design-feature <existing-slug>`
  re-reads SPEC/decisions, asks only deltas, appends revisions, destroys nothing.
  "delete and redesign" in the prompt is the only reset path. *(issue)*
- **D8 — Interaction rule.** Bare `design-feature <slug>` → summary + ask what to
  change (review mode); `design-feature <slug> <instruction>` → apply directly,
  no questions, touch only what the instruction implies. *(issue, 2026-07-09)*
- **D9 — Proportional research, no per-feature market research.** Closure
  checklist first (cheap); external/domain research only when the domain is new to
  the project. *(issue; systematic market research explicitly rejected)*
- **D10 — Composition tier.** `plan-feature` **hands off** to `design-feature`
  (prints `run /design-feature <slug>`), never composes it from a weaker tier.
  `plan-feature-from-issue` may compose `design-feature` only at ≥ its tier; else
  it hands off. *(CLAUDE.md "Hand off, don't compose across a model/effort
  boundary")*

## Revisions (execution-time)

- **D11 — Template layout: `Goal`/`Branch`/`Size`/`Dependencies` stay as meta
  sections before the two halves, not folded into `## Product half`.** SPEC's
  P1 task list groups `Goal` under the Product half, but `Branch`/`Size`/
  `Dependencies` are not listed in either half and are read before a SPEC's
  content exists (routing/sizing metadata, not product or engineering content).
  Keeping all four together above `## Product half` preserves the template's
  existing top-of-file convention and avoids a half-in/half-out Goal section.
  Resolved during `execute-phase 06 P1`, 2026-07-09.
- **Q2 resolved — marker token is `## Design status`, value line reads
  `designed` (bold, first word) vs. `not designed`.** `plan-feature`'s gate
  (P3) greps for `## Design status` followed by `` `designed` `` on the next
  content line; `design-feature` (P2) is responsible for writing exactly that
  string when closure is complete. Confirmed in the template at
  `docs/features/_TEMPLATE/SPEC.md` during P1, 2026-07-09.

- **D12 — AC7's grep (`! grep -rq "plan-feature-interview" skills docs
  README.md README.es.md`) is scoped to LIVE/operational references, not every
  historical mention.** As written, the literal command can never return zero
  hits: this feature's own planning docs
  (`docs/features/06-design-feature/{SPEC,TASKS,PLAN,decisions,
  architecture-notes,progress,testing}.md`) necessarily name the retired skill
  to document its own retirement, `docs/features/ROADMAP.md`'s row 06
  describes this unit's scope the same way every other row describes its own,
  and `docs/workflow/MIGRATION.md`'s **existing** (pre-U3) v2 history section
  already keeps other removed skill names (`design-feature` (old, different
  meaning), `feature-from-issue`, `draft-fix-spec`) for historical accuracy —
  the same precedent now covers `plan-feature-interview`'s two mentions there.
  `docs/design/REDESIGN.md` and `docs/LOGS.md` are frozen historical records,
  never rewritten after the fact. **Every skill file under `skills/` and every
  currently-operative workflow doc** (`docs/workflow/FEATURE_WORKFLOW.md`,
  `docs/workflow/SKILLS.md`, `docs/workflow/PORTABLE_PROMPT.md`,
  `docs/workflow/RECOMMENDED_SKILLS.md`, `docs/workflow/REPLICATE.md`,
  `docs/workflow/model-routing.yml`, `README.md`, `README.es.md`) had every
  reference repointed to `design-feature` during P3 — verified individually,
  file by file, not by the blanket grep. `testing.md`'s AC7 command is kept
  verbatim (matches the SPEC), with this note as the documented interpretation
  a P4 hardening pass should apply rather than treating a nonzero grep as a
  failure. Resolved during `execute-phase 06 P3`, 2026-07-09.

## Open questions

- **Q1 — Does U4 absorb the full issue-path unification (D5 deferral), or does it
  need its own follow-up unit?** Resolve when planning U4. Tracked in
  `known-issues.md`.
- **Q2 — Exact marker string.** SPEC proposes a `## Design status` section with a
  `designed` value. Confirm the grep target during P1 so P2/P3 and U4 all read the
  same token. (Low risk — single line, defined in the template.)
