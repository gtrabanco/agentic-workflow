---
"@gtrabanco/pi-agentic-workflow": minor
"@gtrabanco/pi-nan-agentic-workflow": minor
---

feat(388)!: extract the NaN vendor coupling into the optional @gtrabanco/pi-nan-agentic-workflow companion

The pi layer ships provider-neutral: the built-in `nan` provider profile, its
per-skill model ladder, the settings-console special cases and the NaN README
section are removed from `@gtrabanco/pi-agentic-workflow` and replaced by a
provider-preset contribution seam — a process-global registry
(`config/presets.ts`) that installed companion packages fill at extension-load
time. With no companion installed, `recommendedModels: true` is a documented
no-op: every command routes on the session's model. A new generic `tierRouting`
opt-out (boolean, or `{ enabled, skills }` per skill) parses strict and merges
project-over-global.

The new `@gtrabanco/pi-nan-agentic-workflow` companion ships the NaN preset as
data — provider id, today's published ladder (the routing-off reference), the
per-model quota tiers, the strength-sensitive skill/task-class classification —
plus the registration extension, and the NaN fleet guidance moves from the root
README to its own. Ladders derive their order from tier + task class
(amendment 1): unlimited-eligible work resolves `qwen3.6`-first, judgment slots
keep the published limited-first ladders, and the opt-out byte-matches the
published order. `skills/log-session/SKILL.md` prose is neutralized. A
vendor-neutral lock-in gate (`test/vendor-neutral.test.mjs`) enforces zero
provider literals in the main package's src and README.

BREAKING: the built-in `nan` profile no longer ships in
`@gtrabanco/pi-agentic-workflow` — install the companion package to restore
NaN routing; `RECOMMENDED_PROVIDERS`/`RECOMMENDED_PROFILES` and
`config/recommended.ts` are retired (the `RecommendedProfile` shape moved to
`config/types.ts`).
