# sweep-redos — the evaded-bounds fixture

> Fixture for cycle-2 review F15 (`scripts/promise-coherence.mjs`). The F2
> bound pinned the shape `(x+)+` — body quantifier inside a quantified group,
> measured at 83 s per line — but the reviewed class is wider: an alternation
> inside a quantified group backtracks the same way (the measured reproducer,
> `(a|aa)+$`, cost 66 s on one short line), a curly body (`(a{2,})+`) hides the
> quantifier from a scan for `*`/`+` alone, and ungrouped adjacent quantified
> atoms (`a*a*a*b`) carry the overlap without any group at all. All three fit
> the line grammar and the 200-char budget; compiled, each hangs the gate that
> runs it per line over the whole corpus. Each declaration below must be
> refused **before it is compiled** — a red claim naming the bound, never a
> silent pass and never a timed-out run.

## Log

- **F1** — 2026-10-27, a fold reached for an alternation inside a repeated group → deadbeef
  swept: /(a|aa)+/ → expected 0 in scripts/fixtures/promise-coherence/sweep-redos-unit-doc.md
- **F2** — 2026-10-27, a fold used a curly quantifier inside a group body → deadbeef
  swept: /(a{2,})+/ → expected 0 in scripts/fixtures/promise-coherence/sweep-redos-unit-doc.md
- **F3** — 2026-10-27, a fold chained adjacent quantified atoms → deadbeef
  swept: /a*a*a*b/ → expected 0 in scripts/fixtures/promise-coherence/sweep-redos-unit-doc.md
