# decisions — fix/316-roadmap-settle

Append-only `open-questions@1` record. One entry per question asked, with its
resolution.

## Decisions

| id | date | question | resolution |
|---|---|---|---|
| D-Q1 | 2026-10-26 | Which tree should unit #316's doc live in? The invocation was `--from-issue #316` (feature tree) but the issue carries `bug` + `fix-next`, the branch is `fix-316-roadmap-writer-call-sites`, and `scripts/unit-route.mjs` resolves neither index for 316 — the typed form could not be validated against the router. | **Owner answered** (`ask 00e3cc04-0105-43d1-9569-691a07eee23a`): **fix tree** — `docs/fix/316-roadmap-settle/`, registered in `docs/fix/README.md`. Mirrored into the unit doc's Log as D1. |
| D-Q2 | 2026-10-26 | Diff guard reports BREACH (1101 lines / 30 files vs 400/8) for the whole-unit diff. Shrink, split, or exception? | **Exception recorded** (unit doc Log D2): four-layer slice mandated by S1–S4; work was already committed in four scoped commits before the doc existed; nothing was deleted to shrink the diff. Precedent: unit 78's decisions.md D2. |

none — no other questions were asked; every other lane input (objective, scope,
non-goals, ACs) cites the issue text verbatim (`SPEC.md` `## Specs` quotes).
