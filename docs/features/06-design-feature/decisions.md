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

## Open questions

- **Q1 — Does U4 absorb the full issue-path unification (D5 deferral), or does it
  need its own follow-up unit?** Resolve when planning U4. Tracked in
  `known-issues.md`.
- **Q2 — Exact marker string.** SPEC proposes a `## Design status` section with a
  `designed` value. Confirm the grep target during P1 so P2/P3 and U4 all read the
  same token. (Low risk — single line, defined in the template.)
