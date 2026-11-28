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
| C1 | `phase-lint`'s target→layer prefix table knows only this repo's trees and answers a bare `unparseable` on a foreign target | `construction-only (documented)` | `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/features/49-ledger/PLAN.md` → `verdict BLOCKED: layer-unknown` naming `src/pages/ledger.ts`; the same targets in the unit-doc `SPEC.md` → `verdict PASS` | repaired here (`P4`, `O5`, `O6`) |
| C2 | `test-obligation-tags` reads the obligation vocabulary from a repo-relative source and its estate assumes `packages/*` | `defect` | `bun packages/agentic-workflow/bin/agentic-workflow.mjs test-obligation-tags --root <fixture>` → `… packages/agentic-workflow-schema/src/vocabularies.ts is absent under <fixture> …`, exit 1 | repaired here (`P5`, `O7`, `O8`) |
| C3 | `dimension-regression`'s guard surfaces and dimension carrier exist only in the product repo | `construction-only (undocumented)` | `bun packages/agentic-workflow/bin/agentic-workflow.mjs dimension-regression --root <fixture> --base HEAD` → `verdict \| not-applicable` with no carrier line | repaired here: the absent carrier is named and a touched surface refuses `carrier-missing` (`P6`, `O9`) |
| C4 | ownership is cited as `skills/<name>/references/…` — in prose and in the CLI's own usage banner — which does not resolve at that location in a consumer | `declared-convention` | `rg -c "owner: skills/" skills/` and `bun packages/agentic-workflow/bin/agentic-workflow.mjs` (the banner's `pin:` cell) | repaired here: the banner names the skill, and the consumer-side rule is stated once (`O10`) |
| C5 | the seeded `## Surfaces` template asked for a lane key the producer refused | `declared-convention` | `rg -n "the project's lane key" template/docs/features/_TEMPLATE/SPEC.md` → one match | closed by #716 (`55300a030`); recorded, no edit here (`O11`) |
| C6 | no standing criterion flags shipped code that derives behaviour from this repo's layout | `defect` | `bun scripts/single-repo-leaks.mjs` did not exist at the base: the instrument itself is the reproducer | shipped here (`P3`, `O1`–`O3`) |

### Why each classification

- **C1 — `construction-only (documented)`.** `S5` asks exactly this question. The
  phase-block grammar has no consumer: all four unit-doc templates seed the
  unit-doc grammar, and every unit doc in this tree uses it, where boxes 1–2 are
  skipped and the table is never read (`PE-002`). The scope is now written where
  the grammar's rules are owned, and the refusal names its cause.
- **C2 — `defect`.** The command refuses before reading anything, and the path it
  names exists only in the product tree (`PE-003`); a consumer cannot satisfy or
  declare it.
- **C3 — `construction-only (undocumented)`.** The dimension vocabulary *is* the
  product's own invariant, so the scope is legitimate — but nothing said so, and
  a foreign range silently compared zero dimensions (`PE-005`).
- **C4 — `declared-convention`.** Product-relative owner citations are correct by
  construction; what was missing is the rule that says so, and the banner that
  named the path to a consumer.
- **C5 — `declared-convention`.** Closed by #716: the template now asks for the
  project's own lane key, and the producer reads the project's declaration
  (`PE-006`).
- **C6 — `defect`.** The class recurred per issue because no criterion asked the
  question; the declaration plus the fixture run is the answer (`D3`).

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

`bun scripts/single-repo-leaks.mjs` at this head:

```text
single-repo-leaks@1
root | consumer fixture · /tmp/single-repo-leaks-…
declared | 78 subcommand(s) · project 67 · product 7 · host 4
probe | 13 read-only project command(s) executed · 13 declared
verdict PASS
```

Zero findings, and the 13 probes are the read-only `project` rows that declare
one (`ledger-provenance`, `needs-input`, `prose-gate-inventory`,
`quality-metrics`, `relevant-files`, `scaffold-contract`, `skill-context`,
`substrate`, `telemetry`, `test-impact`, `test-obligation-tags`, `test-route`,
`workflow-status`). The rows that are declared but not executed are the ones
with no safe argument-free form (the forge readers, the writers, the ceremony
family) — the declaration still binds them, and the probe set grows by adding
one `probe` cell.

The two litmus shapes, on the same fixture (`src/**`, no `packages/`, no root
`skills/`, no `template/`):

```text
$ runner phase-lint docs/features/49-ledger/PLAN.md        # the plan grammar
P1 box-2: task 1 target `src/pages/ledger.ts` belongs to no layer the shipped prefix table knows — …
verdict BLOCKED: layer-unknown

$ runner phase-lint docs/fix/49-ledger/SPEC.md             # the unit-doc grammar
P1 Phase-lint: PASS (6/6) · fingerprint P1:unit-doc:1:create-ledger-page
verdict PASS

$ runner test-obligation-tags --root <fixture>
test-obligation-tags@1 — 0 suite(s) · 0 finding(s)
  estate-empty — scripts/ — no suite under the declared legs (<fixture>)
verdict: FAIL

$ runner dimension-regression --root <fixture> --base HEAD
base | 9bda0fe · 0 dimensions
head | 0 dimensions · changed review surfaces 0
carrier | skills/product-audit/references/AUDIT_DIMENSIONS.md absent
verdict | not-applicable
```

The `test-obligation-tags` answer is the repair's whole point: at the base
commit the same run refused before reading anything
(`packages/agentic-workflow-schema/src/vocabularies.ts is absent under …`), and
an estate that found nothing answered `PASS`. Now the vocabulary is the
dependency's, and an empty estate is a refusal.

## What this census does not measure

- **The distributable skill prose** (`skills/**`, `template/**`) is read as a
  consumer receives it, and its citation face is a documented rule (`C4`), not a
  machine check: the occurrences are prose, and a lexical pass would measure
  wording.
- **`packages/agentic-workflow-schema`'s path constants** are declared product
  conventions by construction (they name the files the workflow seeds), so they
  are not candidate rows; the sweep would only re-confirm that.
- **A consumer's own failure** is out of scope: this census measures what the
  product prints, not what a project does with it.
