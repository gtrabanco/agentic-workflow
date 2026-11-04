## Which tests a phase must run

The guide's working rules own the obligation — tests first for a change with a
non-empty **test impact set**, and an empty set records its verdict. This file
owns the mechanism: how the set is derived, the block it answers with, and what
the RED evidence must name. It is cited by `execute-phase`, never restated.

## The set

Four static sources, unioned and sorted. Never a guess, and never the whole gate
standing in for one:

| source | what it contributes |
|---|---|
| `symbol` | the identifiers the change touches, resolved to the committed test files that reference them |
| `path` | a test naming the changed file's own path — how a spawn-based suite refers to what it exercises |
| `sibling` | the suite named after the changed file, in its own directory |
| `lsp` | the caller's own `find_referencing_symbols` results, handed in as a list |

`symbol`, `path` and `sibling` are the portable tier and need nothing but the
tree and one matcher. `lsp` is the preferred tier wherever the project's
language server is provisioned: the caller resolves the references and passes
them in, because a hint script never boots a server. The set is the **union** —
a tier never narrows what another found.

## The block

Run the project's hint. This repository ships one —
`bun scripts/test-impact.mjs --base <rev>` (the node fallback is the same argv) —
and it prints this block, in this order (the trailing `fallback:` and `lsp:`
lines appear only when they apply):

```text
TEST IMPACT — <verdict>
verdict: empty
tier: rg
changed: 1
executable: 0
suites (0):
symbols:
reason: no executable path changed — record this verdict, run no TDD ceremony, invent no test
fallback: rg absent — the symbol-to-test hint ran under grep (same answer, slower)
lsp: available (typescript, markdown) — pass --references with find_referencing_symbols results
```

- `verdict: empty` — only prose and assets changed. Record this block in the
  phase's evidence, run no ceremony, and invent no test. That recorded verdict
  **is** the receipt; a silent skip is the defect.
- `verdict: targeted` — at least one executable path changed. `suites` is what
  that change can affect.
- `suites (0)` under `targeted` — a code change no suite matches. Fall back to
  the project gate and say so in the evidence; this is a coverage gap to report,
  never an empty set.
- `tier:` — which matcher answered: `rg`, the degraded `grep`, or the `lsp`
  input. `fallback:` prints only when the preferred matcher is absent, so a
  degraded run says so instead of looking identical. `lsp:` is an advisory that
  the preferred tier is available.

## The RED evidence

The failing first run names the tests it ran, taken from the set — never "the
tests failed" with no names, and never a whole-gate run pretending to be the
targeted one:

```text
| <targeted suite> | <the project's runner> | exit <n> | <the failing test names> |
```

Then green on the same set. A phase that changed a test set it did not expect to
touch says why in the same row.

## Degradation, declared

- no `rg` → `grep`, and the block's `fallback:` line says so. Same answer, slower.
- no matcher at all → the hint refuses (exit 1). The phase records the project
  gate as the set's substitute and names why; it never reports an empty set.
- no LSP → the portable tier answers, and the evidence says the set came from it.

## Never

- Never run the whole suite as a substitute for the set — that is the untargeted
  ceremony this mechanism exists to replace.
- Never invent a test for a prose-only change to make the ceremony look run.
- Never widen the set to make it non-empty, and never narrow it to make a RED
  run pass.
- Never edit a test to go green: the set says which tests judge the change, not
  which tests agree with it.
