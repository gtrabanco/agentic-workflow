# onSettle: keep — the routed model stays after a command (0.9.0)

## What changed
`@gtrabanco/pi-agentic-workflow` gained a top-level config key `onSettle: "keep" | "restore"`, shipped default `"keep"`. After a routed command settles (`agent_settled`), the model and thinking level the command ran on now STAY in the open chat window instead of being restored to the pre-dispatch snapshot. The historical restore contract (AC8) is the explicit `onSettle: "restore"` opt-in.

## Why
If `/plan-feature` plans on a strong model (e.g. `nan/glm5.3-flash`), the follow-up prompt where you tweak the plan was running on the wrong (previous) model; you had to re-select it to keep going. With `keep`, the follow-up stays on the model that planned it; switch manually with `/model`/Ctrl+P when you want something cheaper (e.g. `nan/qwen3.6`).

## Behavior rules (both policies keep these)
- An operator's own mid-turn `/model`/Ctrl+P choice is never overwritten.
- A failed dispatch (send throws — turn never started) always rolls the session back, regardless of `onSettle`.
- `undoInFlight` (console release) always restores — it is not a settle.

## Files touched
- `src/config/{types,schema,defaults,merge}.ts` — `onSettle`/`SettlePolicy`/`SETTLE_POLICIES`
- `src/routing/dispatch.ts` — `settle()` branches on `turn.settlePolicy`; `PendingTurn` gains `settlePolicy`
- `src/settings/{console,view}.ts` — settle policy prompt + view line
- `test/on-settle-keep.test.mjs` — new keep suite (shipped default)
- `test/{restore-after-settle,shipped-adapter,config-merge,default-inherit,settings-console}.test.mjs` — updated to opt into `restore` where they validate AC8
- `scripts/mutation-check.mjs` — 2 new mutants
- `README.md` + `README.es.md`, `CHANGELOG.md` + `CHANGELOG.es.md`
- `docs/features/27-pi-agentic-workflow/SPEC.md` — AC8 / state-machine amendment
- `package.json` — 0.8.0 → 0.9.0

## Gotchas
- The router only snapshots/applies when `applied.model || applied.thinking`, so a pure-inherit turn still settles as a no-op under keep.
- Tests validating AC8 in `restore-after-settle.test.mjs` use a local `restoreConfigFor` wrapper forcing `onSettle: "restore"` — the shipped default is now `keep`.
- `dist/` is gitignored (generated in prepublishOnly); the skill bundle (`bundle:skills`) and `skill-parity` test are unaffected — no skill change.

## Verdict
185 tests pass · 30 mutants (24 killed, 0 survived, 6 compile-enforced) · `tsc` clean.