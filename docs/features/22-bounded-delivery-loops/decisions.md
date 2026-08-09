# Decisions

- Use the existing `execute-phase` entry point with progressive unit-loop loading; do not duplicate execution contracts in a new skill.
- Add `loop-review-fold` because context-clean review cannot safely be embedded in a writer skill.
- Treat issue/finding grouping as an atomic delivery boundary, not a shared-file heuristic.
- Keep a two-correction default budget and stop on unchanged evidence.
- Route cheap models to isolated implementation batches; keep the conductor on a
  reasoning-enabled tier until a provider-specific fixture proves a lower floor.
- Keep the contract driver-portable instead of embedding a provider-specific RLM
  runtime in this feature.
