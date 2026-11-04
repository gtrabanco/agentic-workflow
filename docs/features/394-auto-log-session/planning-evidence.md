# Planning Evidence — feature/394-auto-log-session

> One row per Engineering claim the change rests on. `authority-kind`:
> `known` | `assumption` | `unknown` | `spec`. `freshness`: `current` | `stale` |
> `not-applicable`. Every `known` row was sampled at the cut head (2026-11-04,
> branch `feat/394-auto-log-session` from `c8b64d0b`) with the command in its
> `source` cell.

## Ledger

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | known | Pi 1.4.0 exposes `session_shutdown` with `reason: "quit" \| "reload" \| "new" \| "resume" \| "fork"`, so the entry's `auto (<reason>)` has a real source and no extra field is needed | `packages/pi-agentic-workflow/node_modules/@earendil-works/pi-coding-agent/package.json` → `1.4.0`; `dist/core/extensions/types.d.ts:637-639`; `session_start`'s own reason at `:575-580` | current | O12, O16 |
| PE-002 | known | The package's own project directory is `.pi/` and the Claude hook owns the `.claude/.session-<id>.start` namespace, so sharing one home would let each writer read the other's crashed marker | `packages/pi-agentic-workflow/src/config/load.ts:29-35` (`PROJECT_CONFIG_DIR_NAME = ".pi"`); `template/.claude/hooks/log-session-end.sh:30` (`marker=".claude/.session-${session_id}.start"`) | current | O16, O17 |
| PE-003 | known | The hook's append is exactly three printf lines behind a leading `\n`, with UTC minute precision, the marker's full sha … `git rev-parse --short HEAD`, space-joined paths and `(no marker)` when the marker is absent — so parity is a byte contract, not a field list | `template/.claude/hooks/log-session-end.sh:30-52`; `printf '\n## %s — %s — auto (%s)\n'` at `:48`; `now_iso="$(date -u +%Y-%m-%dT%H:%MZ)"` at `:24` | current | O11, O14 |
| PE-004 | known | The runner crate is this repository's shipped `<object> <subcommand>` CLI — fixed receipt, `--json` variant, exit 0 / 1 / 2 — and the pi package already declares it as a pinned dependency, so the renderer's CLI belongs there and the extension can import the same module | `packages/agentic-workflow/bin/agentic-workflow.mjs:1-20,114-120`; `packages/pi-agentic-workflow/package.json` → `"@gtrabanco/agentic-workflow": "4.10.0"`; `packages/pi-agentic-workflow/node_modules/@gtrabanco/agentic-workflow -> ../../../agentic-workflow` | current | O3, O4, O5 |
| PE-005 | known | #383 ships the accumulator and the `TelemetrySink` interface and registers five events only when `enabled` is true; the log half was bolted into that same wiring by an earlier uncommitted draft, which is why S4 needs its own wiring module | `packages/pi-agentic-workflow/src/session-telemetry.ts:44-60`; `packages/pi-agentic-workflow/src/extension/telemetry-wiring.ts:35-41,246-257`; `git diff c8b64d0b -- packages/pi-agentic-workflow/src/extension/telemetry-wiring.ts` | current | O8, O9 |
| PE-006 | known | The base tree carries no `autoLogSession` surface at all: the frozen failure R2 is a capability that does not exist, not a broken one | `git grep -c "autoLogSession" c8b64d0b -- packages/pi-agentic-workflow/src` → no match, exit 1; `rg -c "log (render\|publish)" packages/agentic-workflow/bin/agentic-workflow.mjs` → no match, exit 1 | current | O1, O2, O6, O7 |
| PE-007 | known | `scripts/session-close.mjs` renders the `auto` kind differently (parenthesised range, no reason) and its own suite freezes that shape, so it is not edited to match the hook — the divergence is recorded with a re-trigger instead | `scripts/session-close.mjs:62-77`; `scripts/session-close.test.mjs:56-59` | current | O11 (known pre-existing, `## Future`) |
| PE-008 | known | The lineage gate reads the obligation ledger from `planning-obligations.md` for the separate-file shape and refuses any row that is not `verified`, so every row must close before the handoff | `scripts/unit-lineage.mjs:144-183`; `bun scripts/unit-lineage.mjs --unit 394-auto-log-session --json` → `{"verdict":"ok","path":"lane-era","obligations":4}` on the discarded draft | current | O1…O17 |
| PE-009 | known | Roadmap row 39 exists at `docs/ROADMAP.md:56` with its `folded → 41` history and no forward pointer to this unit | `sed -n 56p docs/ROADMAP.md` | current | O18 |
| PE-010 | assumption | That pi fires `session_shutdown` once per torn-down extension instance. Sampling it needs a live session teardown, which a suite cannot stage; the double-fire case is therefore handled by construction (an in-memory `flushed` guard) instead of assumed away | owner: this unit (P6) — the guard in `auto-log-session-wiring.ts`; #383 registers the same event (`telemetry-wiring.ts:255`) | current | O13 |
| PE-011 | unknown | Whether a target project already ignores `.pi/`. No repository fact can sample a consumer's ignore file, so the marker is removed at shutdown, the README states the ignore line, and a crash-left marker is inert (never adopted) | owner: the release notes — `packages/pi-agentic-workflow/README.md` | not-applicable | O17 |
| PE-012 | known | `docs/LOGS.md`'s header is the only prose in the tree that name the retired interim rule ("until feature 41's `autoLogSession:`"), so the currency repair is one sentence in one file | `rg -n "until feature 41" docs/LOGS.md` → `4:` | current | O18 |

## Notes

- Rows PE-007 and PE-011 are the two claims this unit deliberately does **not**
  turn into work: one is a frozen divergence with its re-trigger in `## Future`,
  the other is a consumer-side fact the repository cannot sample.
