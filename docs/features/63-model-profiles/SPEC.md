# 63 — model-profiles

> One-line: zero-config model recommendations for the `nan` provider and a user-defined profile system with ordered fallback, manual rotation, and a retry timer — both shipped in one unit.

## Objective

Give `@gtrabanco/pi-agentic-workflow` (1) zero-config model recommendations for the `nan` provider and (2) a user-defined model-profile system with ordered fallback, manual rotation, and a retry timer. Both ship in one unit, delivering immediate value on fresh installs while giving power users full control over their model preference chains.

## Why

Today the package routes each command to a single Optional `Route` (`default` + per-command `commands`), with an already-shipped model chain fallback (1–4 references) at the command level. A fresh install routes everything on `inherit`. Users who run the `nan` provider get no recommendations; users who want "try my preferred profile, fall back to a cheaper one when quota runs out, and retry the preferred one later" must hand-write every route. Additionally the native `advance` conductor bypasses the router (it calls `surface.sendUserMessage` directly), so conductor-driven stages never get model routing at all.

## User outcome

After this unit ships:

- On a fresh install with the `nan` provider available, every command immediately gets sensible model recommendations — no configuration required.
- Users can define named profiles (their own preference chains), order them by preference, and the router automatically probes the chain: when a preferred profile's model is unavailable it falls back to the next in order.
- A demotion timer prevents thrashing — demoted profiles stay down for a configurable interval.
- The settings console lets users rotate profiles, toggle `recommendedModels`, and see all profiles including the built-in `nan` in a unified scope → profile → routes flow.
- The conductor routes its stage invocations through the router, so `advance`-driven stages benefit from profile fallback just like user-invoked commands.

## Acceptance criteria

1. `recommendedModels` defaults to `true`; setting it `false` disables the built-in `nan` profile entirely.
2. With no config and the `nan` provider available, `execute-phase` resolves to `["nan/deepseek-v4-flash", "nan/glm5.3-flash"]` and `product-audit` resolves to `["nan/glm5.3", "nan/mimo-v2.5", "nan/deepseek-v4-flash"]`.
3. With `nan` unavailable (provider absent), a fresh install still resolves to `inherit` for every command (bit-for-bit today's behavior).
4. An explicit user route (global or project, top-level or in a user profile) wins over the built-in `nan` profile for the same command/key.
5. `profiles` accepts any number of named profiles; each may carry its own `default` + `commands`.
6. `profileOrder` is honored in order; the first candidate with a usable model wins.
7. When the preferred profile's model chain is unusable and a later profile's is usable, the later profile serves the command (per-command fallback).
8. With `applyTo: "command"` no demotion is recorded; with `applyTo: "flow"` a demotion is recorded in the state file and later commands start probing from the demoted profile.
9. After `retryAfterSeconds` since the demotion, the preferred profile is re-probed from the top.
10. `resume: "continue"` (default) lets the in-flight stage proceed on the fallback profile; `resume: "restart"` makes the conductor re-run the current stage once on the fallback profile.
11. The settings console flow is scope → profile → routes; a `Rotate active profile` action moves a profile to the front of `profileOrder` and clears the demotion; saving materializes `recommendedModels: true` when absent; the built-in `nan` profile is shown but not editable.
12. The conductor routes its stage invocation through the router, so `advance`-driven stages obey profile routing and fallback.
13. An old config with only top-level `default`/`commands` resolves exactly as before (backward compatibility), and the existing test suite stays green.
14. The settings console's merged view renders the active profile, the order, and the built-in `nan` mode.
15. Invalid values (`recommendedModels` not boolean, `profiles` not an object, unknown profile key, empty/non-string `profileOrder` entry, `applyTo`/`resume` outside the closed sets, `retryAfterSeconds` not a positive integer) are REJECTED with a path-addressed issue, never silently ignored — same fail-closed rule as the existing validator.

## Non-goals

- No change to the shipped model-chain semantics, to `onUnavailableRoute`/`onSettle`, to `pathProtection`, or to any skill's `model:`/`effort:`.
- No runtime model discovery beyond the existing `ctx.find` / `ctx.hasConfiguredAuth` probe.
- No merge performed by any of this code.
- No new provider profiles besides the built-in `nan` (the design is generic so others can be added later, but only `nan` ships now).
- No changes to `skills/` or `template/`.
- No auto-merge.
- No runtime quota detection.

## Future cost

- The `profiles` system must remain extensible for additional provider profiles without breaking changes: the `Record<string, ...>` shape and the fallback probing loop are designed generically. Future provider profiles only need to register a built-in profile constant in `recommended.ts` and the existing machinery handles the rest.
- The demotion state stored in the package state file (`profileDemotion`) must survive across sessions; any state file migration in future units must preserve this key.
- The router's probe loop is the new hot path for model resolution; future model-routing changes should profile its cost and consider memoization if command volume warrants it.
- The settings console's merged-view rendering of built-in profiles must be updated whenever a new built-in profile constant is added.

## Applicable tests

- `test/model-profiles.test.mjs` — new file covering AC1–AC5, AC7–AC9, AC13, AC14, AC15
- Additions to `test/config-merge.test.mjs` — profile merge + effectiveProfileOrder (AC4, AC5, AC6)
- Additions to `test/settings-console.test.mjs` — scope → profile → routes, rotate, toggle, materialize (AC11, AC14)
- Additions to `test/default-inherit.test.mjs` — backward compat when `nan` unavailable (AC3)
- Additions to `test/dispatch-refusals.test.mjs` — profile chain probing + demotion (AC7, AC8, AC9)
- Additions to `test/conductor-invoke.test.mjs` — routed invocation + resume handling (AC10, AC12)

## Known pre-existing issues

- The conductor currently bypasses the router (`src/extension/conductor-command.ts` calls `surface.sendUserMessage` directly). **affects** this unit: AC12 fixes it.
- Pre-existing `onUnavailableRoute`/`onSettle` semantics are unchanged. **does-not-affect**.

## Tasks

P1 — SPEC + roadmap row (this file).
P2 — Types + schema validators + defaults (new keys); red tests for AC15 + AC13.
P3 — Built-in `nan` profile + profile merge/resolution (`recommended.ts`, `profiles.ts`); tests for AC1–AC7, AC13.
P4 — Router profile-chain probing + demotion state + retry interval; tests for AC7–AC9.
P5 — Console: scope → profile → routes, rotate, toggle, materialize; merged-view render; tests for AC11, AC14.
P6 — Conductor routed invocation + `resume` handling; tests for AC10, AC12.
P7 — Docs (README, CHANGELOG, version bump) + full gate (`bun run test`, `bun run test:node`, root suite).
P8 — Review + PR.

## Evidence

> Evidence is verified, not claimed — a reviewer re-runs it.

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |
| 6 | | | | |
| 7 | | | | |
| 8 | | | | |
| 9 | | | | |
| 10 | | | | |
| 11 | | | | |
| 12 | | | | |
| 13 | | | | |
| 14 | | | | |
| 15 | | | | |

## Progress log

2026-09-24 21:18 — P1 done: SPEC.md created with product + engineering halves, evidence table skeleton, and progress log → `feat/63-model-profiles` branch — next: P2

## Next

The single next action: `/execute-phase 63`

## References

Feature row: `docs/features/ROADMAP.md` row 63 (status: `defined`). No linked issues yet.
