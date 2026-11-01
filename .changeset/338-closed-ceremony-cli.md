---
"phase-contract": minor
---

fix(ceremony): closed ceremony CLI and a tick-aware unit-doc grammar

The unit-doc bullet grammar accepts the executed-phase tick mark
(`- [x] P<n> — …`, `- [ ] P<n> — …`). The tick is state, never a second
phase: a lane unit that ticks its tasks as they land keeps parsing as the
same `P<n>` phase in the shared reader (`scripts/unit-doc-phases.mjs`), so
`phase-lint` judges its boxes instead of answering `BLOCKED: no-phases`.
Documents without a tick parse byte-identically, and the phase fingerprint
(a phase count plus its title) is unchanged.
