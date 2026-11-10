# External verify — 388 extract-nan-vendor-coupling

```text
EXTERNAL VERIFY — 2026-11-09 — base: 5d778958 (origin/main) · head: b74a249a (feat/388-extract-nan-vendor-coupling)
Blockers: 0
Advisories: 1 — scripts/docs-generate.mjs prints "Format: md — degraded (no `Docs site` block in AGENTS.md)"; pre-existing at base (origin/main AGENTS.md carries no `Docs site` block either), verdict PASS, not change-caused.
Sibling sweep: clean — retired surfaces (RECOMMENDED_PROVIDERS, RECOMMENDED_PROFILES, src/config/recommended.ts, root README "Running on NaN.builders" section) have zero surviving asserting mentions; the only hit is docs/features/64-nan-mimo-v26-catalog-refresh/SPEC.md:38, a historical unit doc's own past acceptance criteria, not a current-truth surface. Root README's remaining NaN mentions name the optional companion package only.
Completeness: all S#s resolved — S1–S6 each map to P1–P7 tasks carrying (Implements: S#) whose validators re-ran green here; S7 soft orders recorded (#427 landed via the integration merge, #201 related-only); obligations O1–O15 all `verified`, validators re-run green here.
Spot check: node scripts/run-root-suite.mjs → 101 PASS, exit 0 → match (reported E7: 101 PASS / 0 FAIL).
Verdict: VERIFIED

Evidence re-run (this session, foreground):
- bun test packages/pi-agentic-workflow/test/vendor-neutral.test.mjs test/provider-presets.test.mjs test/config-schema-tier-routing.test.mjs → 29 pass / 0 fail
- bun test packages/pi-agentic-workflow/test/*.test.mjs → 779 pass / 0 fail (72 files)
- bun test packages/pi-nan-agentic-workflow/test/*.test.mjs → 20 pass / 0 fail
- bun scripts/lint-changeset.mjs .changeset/388-extract-nan-vendor-coupling.md → exit 0
- bun scripts/docs-generate.mjs --check → 3 checked, 0 stale, verdict PASS
- bun scripts/version-parity-gate.mjs --content → content parity holds, companion row present, VERDICT PASS
- git diff --stat origin/main...HEAD -- packages/agentic-workflow packages/agentic-workflow-schema → empty (O13)
- rg RECOMMENDED_PROVIDERS|RECOMMENDED_PROFILES packages/ → 0 hits
- Byte-pin check: PUBLISHED_LADDER (packages/pi-nan-agentic-workflow/src/preset.ts) compared line-by-line against origin/main's RECOMMENDED_PROFILES.nan (src/config/recommended.ts) — default + all 15 commands identical in model order and thinking values (S5 AC3 / O8 substance)
- vendor-neutral gate inspected: whole-word scanner with `NaN`-literal allowance, walks src/**.ts + README.md + skills/log-session/SKILL.md — enforces AC1/AC4 as claimed
- No unproven mutation path executed: the change introduces no new write-capable command surface (the companion's registration extension is in-memory registry mutation at pi load time); all gates run were check/test modes.
- Receipt written uncommitted by the verifying session; the implementer owns the commit.
```

Follow-up (2026-11-09, owner-directed correction): the advisory was routed and
repaired by the owner's instruction — issue #500, passive unit
`docs/passive/2026-11-09-declare-docs-site.md` (branch
`fix/500-declare-docs-site-block`, PR #501). The emitter now reports
`Format: md (declared)` with no degraded note.
