# Decisions — fix/436-ceremony-profile

Owner decisions and path-protection records for this unit. Appended-only.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/agentic-workflow-schema/test/ceremony-profile.test.mjs | P1 | 2026-11-11 | execute-phase | Red-corpus completion before the green commit: the round-trip case re-serialized the profile without the contract-id marker line, so the reparse correctly returned null (absent block). The fix restores the marker the case always intended to carry; no assertion is relaxed, weakened or removed, and the suite was still red at the red commit (f1dd440f) exactly as recorded.
```

- **D1 — 2026-11-11** — Unit home `docs/fix/436-ceremony-profile/` for a feature
  issue: the owner's local workflow (§5) names this path explicitly, prompt
  instructions outrank repo conventions, and in-repo precedent agrees
  (feature 319 delivered as `docs/fix/319-location-index-consolidation/`,
  feature 440 as `docs/fix/440-product-audit-rescope/`).
- **D2 — 2026-11-11** — The profile block is authored inside the project
  guide's `## Project charter` section (the #435 writer); the router scopes
  its read to that section. Block detection itself is scope-free (fenced
  block, first match), so tests and other readers do not need the guide.
- **D3 — 2026-11-11** — Explicit `paid | discarded` per declared piece; an
  undeclared piece keeps the catalog default. No profile = today's full
  ceremony (the differential's invariant), and a partial profile narrows only
  what it names.
- **D4 — 2026-11-11** — Piece vocabulary = the issue's example rows, closed:
  `docs-step`, `captures`, `review-passes`, `publish-gate`, `test-policy`.
  `review-passes` is list-valued over the surfaces derived from `PASS_NAMES`
  (minus `classify`), derived at the type level and at runtime — one source.
- **D5 — 2026-11-11** — Step↔piece mapping is declared in
  `scripts/catalog.json` (`docs`→`docs-step`, `tests`→`test-policy`,
  `release`→`publish-gate`); `evidence`, `plan`, `implement`, `review`,
  `research`, `design` carry no piece and are never profile-discardable
  (`review` narrows its passes instead). #307 non-negotiables untouched.
- **D6 — 2026-11-11** — Malformed charter block fails closed (router exit 2,
  named diagnostic) — the catalog's own `activityFusion`/`budget_tier`
  doctrine (PE-007).
- **D7 — 2026-11-11** — Router-side runtime grammar lives in a
  dependency-free `scripts/ceremony-profile.mjs` (plain `.mjs` cannot import
  the TS package); its vocabularies and parser behavior are pinned to the
  schema package's published consts/reader by parity tests — the
  `LOG_KINDS`-reader pattern (PE-005).
- **D8 — 2026-11-11** — The `--json` answer gains a `profile` key only when a
  profile is declared, and the text block gains one additive `Profile:` line
  (the #434 fused-annotation pattern, PE-009).
- **D9 — 2026-11-11** — No JSON Schema artifact for the profile: it is a
  fenced-text grammar validated by the parser; the published consts are the
  machine surface. `doc-provenance` carries an artifact because it is an
  orchestration payload; the profile is charter prose read at dispatch.
