# 717 — the census: single-repo path assumptions in the distributable surface

Measured at base `67133da45` (the merge-base of
`feat/717-audit-single-repo-leaks` and `main`). The instrument is the shipped
CLI itself: every subcommand declares which root it resolves against, and the
read-only ones are executed once against a consumer-shaped fixture tree.

## The test every row answers (`S3`)

> is the consumer able to satisfy or declare this path, and was it documented as
> a product requirement? If the path only exists inside the product's own repo
> and nothing declares it to consumers — it is a leak.

The closed classification (`D1`): `declared-convention` · `construction-only
(documented)` · `construction-only (undocumented)` · `defect` · `intentional`.

## Method

1. **Inventory.** The shipped surface is `packages/agentic-workflow/src/**` and
   `bin/**` (181 modules, comments stripped), `packages/agentic-workflow-schema/src/**`
   (the published vocabularies and path constants), `packages/pi-agentic-workflow/**`,
   `packages/pi-nan-agentic-workflow/**`, `template/**`, and the skills as a
   consumer receives them.
2. **Instrument.** A lexical sweep measures the surface area but cannot classify
   it: the same scan yields **458** raw path-literal hits and **138** after
   comment stripping, across **57** files — dominated by prose citations
   (`"docs/workflow/GATE_INVENTORY.md (carrier: cli — a design-time reader)"`)
   and by segment-wise `path.join(root, "docs", …)` calls, neither of which is a
   resolution decision. `D3` therefore makes the standing criterion behavioural:
   one declared class per subcommand, plus a foreign-tree run.
3. **Fixture.** A consumer-shaped tree under `mktemp -d`: `src/pages`,
   `src/shared`, a `docs/features/49-ledger/PLAN.md` in the phase-block grammar,
   a `docs/fix/49-ledger/SPEC.md` in the unit-doc grammar, a co-located
   `src/pages/ledger.test.ts`, a git history — and **no** `packages/`, no root
   `skills/`, no root `template/`, no `scripts/`.
4. **Receipt.** `bun scripts/single-repo-leaks.mjs --root <fixture>` prints the
   `single-repo-leaks@1` receipt; the suite runs the same producer, so the census
   re-runs instead of being re-read.

## Candidates

| id | candidate | classification | reproducer | route |
|---|---|---|---|---|
| C1 | `phase-lint`'s target→layer prefix table knows only this repo's trees and answers a bare `unparseable` on a foreign target | `construction-only (documented)` — the phase-block grammar is the product's own legacy shape; the unit-doc grammar is the supported consumer shape and never reads the table (`D4`) | `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/features/49-ledger/PLAN.md` in the fixture → `verdict BLOCKED: layer-unknown` naming `src/pages/ledger.ts`; the same targets in the unit-doc `SPEC.md` → `verdict PASS` | repaired here: the refusal names its cause and the scope is documented (`P4`, `O5`, `O6`) |
| C2 | `test-obligation-tags` reads the obligation vocabulary from a repo-relative source and its estate assumes `packages/*` | `defect` — the command refuses on a consumer tree, naming a path the consumer cannot have | `bun packages/agentic-workflow/bin/agentic-workflow.mjs test-obligation-tags --root <fixture>` → `… packages/agentic-workflow-schema/src/vocabularies.ts is absent under <fixture> — the closed set has no source to resolve against`, exit 1 | repaired here (`P5`, `O7`, `O8`) |
| C3 | `dimension-regression`'s guard surfaces and dimension carrier exist only in the product repo | `construction-only (undocumented)` — the vocabulary is the product's own invariant, but nothing said so and a foreign range silently compared zero dimensions | `bun packages/agentic-workflow/bin/agentic-workflow.mjs dimension-regression --root <fixture> --base HEAD~1` → `verdict \| not-applicable` with no carrier line | repaired here: the absent carrier is named and a touched surface refuses `carrier-missing` (`P6`, `O9`) |
| C4 | ownership is cited as `skills/<name>/references/…`, which does not resolve at that location in a consumer | `declared-convention` once stated — the citation is product-relative by construction; what was missing is the rule | `rg -c "owner: skills/" skills/` over the shipped skills tree | the consumer-side resolution rule is stated once (`P7`, `O10`) |
| C5 | the seeded `## Surfaces` template asked for a lane key the producer refused | `declared-convention` — closed by #716 (`55300a030`), which made the vocabulary the project's own | `rg -n "the project's lane key" template/docs/features/_TEMPLATE/SPEC.md` → one match | recorded closed; no template edit here (`O11`) |
| C6 | no standing criterion flags shipped code that derives behaviour from this repo's layout | `defect` — the class recurred one issue at a time (#716, then these five) | the census's own instrument did not exist at the base: `bun scripts/single-repo-leaks.mjs` exits 1 with `missing-producer` | shipped here: the per-command declaration plus the foreign-tree run (`P3`, `O1`–`O3`) |

## What the declaration adds

The census's durable half is one required cell on each of the 77 `HELP_REGISTRY`
entries — `resolution: project | product | host`:

- `project` — resolves a path the target project owns; it must answer on a
  consumer tree without naming a product-internal path.
- `product` — reads the product's own tree (a gate index, the dimension
  carrier, the crate's own source); on any other tree it must name what is
  absent instead of comparing zeros.
- `host` — resolves the host agent's directory (`~/.pi/…`), neither root.

A new subcommand with no cell, or with a value outside the set, is refused by
`bun scripts/single-repo-leaks.mjs` and by its suite. That is the whole of the
standing criterion: it cannot be satisfied by wording, and it fails on the next
leak rather than on the next audit.

## Sweep result

`bun scripts/single-repo-leaks.mjs` at this head: 77 declared subcommands, three
classes, the read-only `project` rows executed against the fixture, **0**
findings. Repaired rows and their tests are named in `## Log` (`E` lines).
