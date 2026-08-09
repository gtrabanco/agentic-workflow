## Portability and model routing

### Fresh contexts

Use the strongest available primitive in this order:

1. native subagent/task per review or fold invocation;
2. headless agent process per invocation;
3. external driver using the workflow envelope;
4. manual fresh conversations following the terminal/next block.

An inline-only host cannot honestly claim context-clean final review after the
same context authored a correction. It stops after folding and asks for a fresh
`loop-review-fold`/`review-change` invocation; this is a capability limit, not a
reason to waive review independence.

### Tiers

- Conductor: strong enough to route fixed states; it does not inspect code.
- Review: never weaker than the writer; prefer a different model family.
- Fold: cheap for mechanical low/medium findings; strongest available for high,
  security, subtle logic, architecture, or reviewer-stronger-than-writer cases.
- RLM/external memory may retain receipts and failure summaries, but it does not
  replace frozen acceptance, deterministic validators, or the independent
  reviewer.

Cap parallel calls below provider concurrency. A 429 reduces fan-out. The
cycle/no-progress budgets remain identical on every platform.
