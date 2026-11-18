---
type: fix
scope: small
roadmap_summary: Issue [#638](https://github.com/gtrabanco/agentic-workflow/issues/638): `telemetry reconstruct` walks both of Pi's store layouts (the old nested `<run>/session.jsonl` one included) while excluding marked subagents in both, and the ledger's one-row-per-session guard keys on the session id after either producer prefix, so a live flush replaces the row a reconstruction wrote instead of double-counting the session.
---

# fix/638-reconstruct-old-layout

> Fix specification — `telemetry reconstruct` against a real Pi store: the
> discovery reads both transcript layouts without counting spawned subagents,
> and the ledger's replacement guard recognizes one session under both
> producer prefixes.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

[#638](https://github.com/gtrabanco/agentic-workflow/issues/638) — telemetry
reconstruct is blind to the old transcript layout, and the ledger's
one-row-per-session guard keys on the raw `source` string. The PR closes it
with `Closes #638` in the body. Branch
`fix/638-reconstruct-old-layout`.

## Specs

**S1 — Discovery reads both store layouts and excludes marked subagents in both.**
> `telemetry reconstruct stats|samples|write` walks both layouts and excludes marked subagents in both, so a reconstruction neither misses sessions nor counts spawned workers as operator sessions.

**S2 — The ledger's replacement guard keys on the session identity, not the raw string.**
> The ledger's replacement guard keys on the session id after either producer prefix, so a live flush replaces the row a reconstruction wrote.

**S3 — The old layout's ground truth is honored, not invented.**
> The old layout never persisted the operator transcript. The operator session id appears in no transcript of that era — it is referenced only from subagent transcripts and never stored as its own file. Operator history before the new layout is unrecoverable; the old layout must be scanned, but its transcripts are subagents' and must stay excluded (the module's own contract).

## Acceptance criteria

- **AC1 (S1)** — both layouts are discovered: `bun test packages/agentic-workflow/test/telemetry-reconstruct.test.mjs` exits 0, and its old-layout case finds the unmarked nested transcript beside the flat one while the marked `subagent-` transcript and the artifact copy are excluded.
- **AC2 (S2)** — one row per session across producer prefixes: `bun test packages/pi-agentic-workflow/test/telemetry-ledger-sink.test.mjs` exits 0, and its cross-prefix case shows `pi:session=abc` replacing the row `pi:reconstruct=abc` wrote (later cumulative totals win, provenance `pi:session=` wins).
- **AC3 (S3)** — the exclusion is evidence-based, not a guess: the same suite pins the two markers (artifact file name; `session_info.name` prefixed `subagent-` before the first message), and an unmarked transcript still counts in either layout.
- **AC4** — no reader drift: `bun test scripts/tier-cost.test.mjs scripts/telemetry-report.test.mjs packages/pi-agentic-workflow/test/telemetry-jsonl-sink.test.mjs packages/pi-agentic-workflow/test/session-telemetry.test.mjs` exit 0.

## Impact

- `packages/agentic-workflow/src/telemetry/reconstruct.mjs` — `listTranscripts()` walks the old layout; `sessionHeader()` returns the transcript's subagent mark; both discovery loops filter on it.
- `packages/agentic-workflow/src/telemetry/ledger.mjs` — `sessionKeyOf()` moves here (the prefixes and the session-identity rule are the ledger grammar's own); the replacement guard compares session keys.
- `packages/agentic-workflow/src/telemetry/reconstruct.mjs` — re-imports `sessionKeyOf` from the ledger writer instead of carrying a second copy (the every-repetition-names-its-owner rule).
- `packages/agentic-workflow/README.md` — the `telemetry reconstruct` Commands row names both layouts and both subagent markers.
- `docs/workflow/TIER_COST.md` — the "Who writes a row" note states the cross-prefix replacement.
- `packages/agentic-workflow/test/telemetry-reconstruct.test.mjs` + fixture `session-old-subagent.jsonl` — the old-layout discovery case.
- `packages/pi-agentic-workflow/test/telemetry-ledger-sink.test.mjs` — the cross-prefix replacement case.

Beyond the issue's Impact: the CLI grammar, the record mapping (S4 of #624) and the merge receipt are unchanged — no new flag, no new contract id, no schema change.

## Surfaces

- `packages/agentic-workflow`
- `packages/pi-agentic-workflow`
- `scripts` (regression proof only)
- `docs`

## Retirements

Strictly additive: no command, flag, contract id, skill or vocabulary is removed. The one moved helper (`sessionKeyOf`) keeps both its call sites working — `reconstruct.mjs` re-exports it, so the module's published names are unchanged. Retirement count `0`; negative-capability pin: `bun test packages/agentic-workflow/test/telemetry-reconstruct.test.mjs` exits 0 with every pre-existing case untouched.

## Non-goals

- Discovering the `forks/*.jsonl` transcripts (20 files in the swept store) — a separate widening with its own double-count analysis; not scoped here.
- Unit attribution from git history (#624 S5 stays).
- Reconstructing from Claude Code/Codex/OpenCode transcripts (#624's non-goal stays).
- Any change to the live sink's emission, the `tier-cost@N` grammar or `TELEMETRY_SAMPLE_FIELDS`.
- Automatic reconstruction on any session event (#624 S3a stays).

## Risk tier

- **`standard`** · **Task Size** — `small` (one discovery loop, one guard expression, tests and docs; no auth, CI or publish surface).
- **Named high-risk item** — `none — not a high-tier unit`.

## Future

- Discover and merge the `forks/` transcripts with a distinct provenance prefix — `open`.
- Attribute reconstructed samples to units via git history (diff-based) — `open` (#624's own future row).

## Future cost

None — the discovery walks the same two directories it already lists; the guard compares a second derived string per row. No standing obligation beyond the suites.

## Applicable tests

- `packages/agentic-workflow/test/telemetry-reconstruct.test.mjs` — the old-layout discovery case (new) beside the mapping/stats/merge/grammar cases.
- `packages/pi-agentic-workflow/test/telemetry-ledger-sink.test.mjs` — the cross-prefix replacement case (new) beside the upsert cases.
- `scripts/tier-cost.test.mjs`, `scripts/telemetry-report.test.mjs` — the readers stay green over a ledger carrying reconstructed rows.
- `packages/pi-agentic-workflow/test/telemetry-jsonl-sink.test.mjs`, `test/session-telemetry.test.mjs`, `test/telemetry-wiring.test.mjs` — the producer's regression proof.

## Known pre-existing issues

- The `forks/*.jsonl` transcripts are not discovered (pre-existing; recorded as Future, never a regression of this unit).
- The `pi-web-activity.json` sidecar files beside flat transcripts are skipped by the `.jsonl` suffix check, not by an explicit rule — harmless today, fragile if Pi renames a sidecar to `.jsonl`.

## Tasks

- P1 — the old-layout discovery tests (red) beside the new fixture: `packages/agentic-workflow/test/telemetry-reconstruct.test.mjs`, `test/fixtures/telemetry-reconstruct/sessions/session-old-subagent.jsonl`.
- P2 — the cross-prefix ledger replacement test (red): `packages/pi-agentic-workflow/test/telemetry-ledger-sink.test.mjs`.
- P3 — the implementation: `listTranscripts()` walks the old layout, `sessionHeader()` reads the subagent mark, both loops filter on it; `sessionKeyOf()` re-homes to `ledger.mjs` and the guard compares session keys.
- P4 — docs and release intent: the crate README row, `docs/workflow/TIER_COST.md`'s writer note, this unit doc, the changeset, the roadmap row.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-18, the issue, verbatim:
  ```
  Two defects found while verifying `agentic-workflow telemetry reconstruct` against a real Pi store (~924 transcript files):

  1. **Discovery reads only the new layout.** `listTranscripts()` scans for `*.jsonl` directly in each project's session directory. Pi has two store layouts: the new one (post-2026-11, flat `<ts>_<id>.jsonl`) and an old one (pre-2026-11, one directory per session holding nested `<sub-session>/<run-N>/session.jsonl` transcripts). The old layout is never read.
  2. **The ledger's one-row-per-session guard compares the raw `source` string.** A session reconstructed as `pi:reconstruct=<id>` that later flushes live as `pi:session=<id>` appends a second row for the same session instead of replacing it — a double count.

  Verified evidence (real store sweep): flat `.jsonl` in the project's session dir 141 (operator sessions, new layout); nested `session.jsonl` (old layout) 430 — 100% spawned subagents, every one marking itself with a `session_info` name prefixed `subagent-`; `subagent-artifacts/` 333 (already excluded); `forks/*.jsonl` 20 (excluded today).

  Two hard facts the fix must honor: the old layout never persisted the operator transcript (the operator session id appears in no transcript of that era), and a subagent is marked differently per layout — artifact file name in the new layout, `session_info.name` prefix `subagent-` in the old one. An unmarked transcript counts.
  ```
- **E1** — 2026-11-18, the store sweep over `~/.pi/agent/sessions` · 924 `.jsonl` files · shapes: 141 flat, 430 nested `session.jsonl`, 333 `subagent-artifacts/`, 20 `forks/`.
- **E2** — 2026-11-18, every nested `session.jsonl` classified by its opening lines · 430/430 carry a `session_info` name prefixed `subagent-` · the old layout holds no operator transcript.
- **E3** — 2026-11-18, `rg -l "<operator session id>" ~/.pi/agent/sessions/` · the id appears only inside subagent transcripts (as the parent reference) and no file of the era is the operator's own transcript.
- **E4** — 2026-11-18, the RED run of the old-layout discovery case before any subagent exclusion: `bun test packages/agentic-workflow/test/telemetry-reconstruct.test.mjs` · exit 1 · `discovery: the old layout is read, and only its marked subagent transcripts are excluded` fails (the interim old-layout walker counts the marked subagent).
- **E5** — 2026-11-18, the RED run of the cross-prefix case: `bun test packages/pi-agentic-workflow/test/telemetry-ledger-sink.test.mjs` · exit 1 · `a live emission replaces the row a reconstruction wrote for the same session (#624)` fails (the guard compared raw `source` strings).
- **E6** — 2026-11-18, the GREEN run after the implementation: `bun test packages/agentic-workflow/test/telemetry-reconstruct.test.mjs packages/pi-agentic-workflow/test/telemetry-ledger-sink.test.mjs` · 38 pass / 0 fail.
- **E7** — 2026-11-18, the reader/producer regression: `bun test scripts/tier-cost.test.mjs scripts/telemetry-report.test.mjs scripts/telemetry-coverage.test.mjs packages/agentic-workflow-schema/test/telemetry.test.mjs packages/pi-agentic-workflow/test/telemetry-jsonl-sink.test.mjs packages/pi-agentic-workflow/test/telemetry-wiring.test.mjs packages/pi-agentic-workflow/test/session-telemetry.test.mjs` · 87 pass / 0 fail.
- **E8** — 2026-11-18, the real-store answer after the fix: `agentic-workflow telemetry reconstruct stats --project <this repo>` · 4 sessions / 0 skipped (3 closed historical + the live one) — the interim count of 145 was the subagent inflation this unit removes.
- **P1** — 2026-11-18, the old-layout discovery tests and the fixture, red first (E4), and the cross-prefix ledger replacement test, red first (E5) · `a9856840`.
- **P2** — 2026-11-18, the implementation — both layouts walked, the subagent mark read by `sessionHeader()`, both discovery loops filter on it, `sessionKeyOf()` re-homed to the ledger grammar and the guard keyed on the session identity — with the crate README row, `docs/workflow/TIER_COST.md`'s writer note, this unit doc, the changeset and the roadmap row · this commit.

## Next

Land via the PR closing #638; the fork transcripts stay a Future row.

## References

- [docs/fix/624-reconstruct-telemetry-from-pi-transcripts/SPEC.md](../624-reconstruct-telemetry-from-pi-transcripts/SPEC.md) — the command this fix corrects.
- `packages/agentic-workflow/src/telemetry/ledger.mjs` — the grammar owner the prefixes and `sessionKeyOf` live in.

## Branch

`fix/638-reconstruct-old-layout`

## Depends on

| Depends on | Kind | Why |
|---|---|---|
| #624 | soft | The command and the two producer prefixes this fix corrects. |

## Regression scope

`telemetry reconstruct stats|samples|write` discovery; the ledger sink's replacement guard. No other reader of the ledger or the JSONL changes behavior: the readers are exercised by E7.
