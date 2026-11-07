# Fragment: 2026-11-07 product-audit rescope — external verify, correction batch, round-3 gates

## What happened

- **External verification** of fix/440-product-audit-rescope (base e1d94057, head 9ca435b8)
  found 6 blockers (all one class: periodic cadence retired in S4 but surviving as live
  assertion on 5 sibling surfaces) and 6 advisories (3 dated records exempt by declaration,
  1 under-declared intent, 1 dropped narration qualifier, 1 pre-existing #374 dead citation).
- **Correction batch** landed under owner order ("Todos los findings parecen legítimos,
  arreglalos"): 73bbc0b5 (red) → 68549fe0 (green). Recheck: all 6 closed, one new blocker
  (under-declared intent), folded as 459ee056.
- **Round 3** under owner order ("Repara los no plegados, los chageset deberían de tener
  lint propio y determinista"): two deterministic gates shipped — changeset-coverage in
  version-parity-gate.mjs, tree lint in lint-changeset.test.mjs. All round-2 advisories
  folded including #374 dead citation repair and explicit-invocation narration pin restored.
- Self-correction: E23 misread the tree linter exit code (last command of a pipeline masked
  the exit; the script alone exits 1).

## Key decisions

- D-440-1: fold all blockers as one batch (single root cause)
- D-440-2: dated records exempt by declaration
- D-440-3: route-cell retirement qualified to finding-line grammar
- D-440-5: deterministic gates over release intents
- D-440-6: repair #374 dead citation rather than exempt
- D-440-7: restore + pin explicit-invocation narration

## Where to resume

- Owner merge decision on PR #445 at 1bab6c8e; independence-clean pass recommended.
- pi-compat-guard red at main + journal fragment-name validation gap still riding.
