# 99 — acceptance-length

> Frozen-failure fixture · issue #305 · replay of unit 258 finding **F55**: an
> acceptance criterion promising "a 3–5 line pointer" while the shipped
> sections measured 19 / 20 / 15 lines, certified `read-verified` by a
> length-blind command. The second criterion is the same defect one step
> earlier: a length promise that names neither the file nor the section it is
> about, so no recount is even possible.

## Acceptance criteria

1. Each shrunk skill keeps a 3–5 line pointer instead of its old section
   (read-verified).
2. Each shrunk skill keeps a 3–5 line pointer to `## Inputs — artifacts, never questions` in `skills/execute-phase/SKILL.md`, measured from the heading to the next `## ` (read-verified).
3. The second section keeps its length promise.

## Tasks

- P1 — Shrink the three guard sections to a pointer (validator: `grep -c "^## Needs-input guard" skills/execute-phase/SKILL.md` matches 0)
