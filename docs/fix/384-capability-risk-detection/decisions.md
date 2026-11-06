# Decisions — fix/384-capability-risk-detection

One table, one row per decision taken while cutting this unit. `authority` names
what settles the row — an owner instruction, a recorded owner decision, or a
pinned repository fact — so a reviewer can overturn a row by citing a stronger
authority, never by preference.

| id | decision | authority | rejected |
|---|---|---|---|
| D1 | The analyser is a **bounded syntactic analyser per language family** (imports + invocations extracted per family, resolved through a provider→capability catalogue, relative imports followed one module graph deep), not an AST parser and not an operation-name list | S10 names the question and the two constraints; `docs/fix/360-risk-tiered-ceremony/decisions.md` `D360-3` records the owner's shape — "one mini-analyser per language family in the repo (`mjs`, `ts`, `sh`, `py`)"; `scripts/risk-tier-classifier.test.mjs` `F6b` pins `scripts/risk-tiers.mjs` to `node:` + schema-source imports only, and `scripts/ceremony/lib.mjs` is dependency-free, so a real parser means adding a dependency to a module two callers already import | A real AST parser per language (a new dependency in the classifier path, and `#352`'s crate is not built yet — a bigger change than this unit); keeping and extending the operation-name regex (the objection S2 quotes) |
| D2 | The capability ids stay **internal evidence**: they appear in `reason` and in the analyser's own API, and no new published vocabulary or verdict field is introduced | S9: "No change to `detail.risk_tier` / `detail.size_tier`'s published shape beyond the reason codes the new analysis needs" — and no new reason code is needed, because `destructive` is already a named signal | Publishing `CAPABILITY_KINDS` in the schema package (three surfaces to bind — schema const, `normative-surfaces@1` row, parity pin — for a vocabulary no consumer reads yet) |
| D3 | `ceremony passive add` **refuses** a non-`passive` scope (exit 2, `route: standard-ceremony`) and a colliding id (exit 2, `record-exists`) | S6/S7 (the carrier's record is written by the CLI, never by hand) plus `skills/execute-phase/references/risk-tiers.md`: "A passive unit that turns out to touch executable content is not passive — it is routed to the standard ceremony, never patched into passivity" | Writing the record anyway and letting a false passivity claim exist on disk; a `--force` flag (a flag that defeats the record's only invariant is a footgun) — see the boundary note below |
| D4 | The analyser's bound on transitive resolution is one module graph, depth ≤ 4, cycle-safe, and only through a caller-supplied resolver | The repo's own purity contract (`risk-tiers.md`: "a pure function of `path → contents`") — the resolver keeps the module pure while letting both repo callers read the same tree | Making the module read the filesystem itself (two callers would then answer differently from the same scope — O12); an unbounded walk (a monorepo-wide call graph is `#352`'s crate work) |

## D3's boundary, stated so it is never re-litigated as a violation of S4/S9

`No command may refuse to run because of a tier or a capability verdict` (S9)
bounds **ordinary work**: `fold-findings`, `log-session`, every executor route,
every pre-existing ceremony operation. `passive add` is not ordinary work — it *is*
the passive ceremony, and what it refuses is writing a record that claims
passivity for an executable change. The refusal is exit 2 (the CLI's existing
ceremonial-block channel) and it leaves the tree untouched; nothing else in the
repository gains a tier check. `O6` pins the difference.
