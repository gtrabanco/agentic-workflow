# known-issues — 29-bounded-implementation-discovery

No unresolved product or engineering decision blocks implementation.

## Known boundaries to preserve

1. **Semantic completeness is not mathematically provable** — exact source
   identity proves freshness, not that a mapper found every relevant consumer.
   The affected-surface question, reference searches, risk-based fresh route,
   probes, and later independent review remain necessary.
2. **Manual single-consumption is weaker than durable enforcement** — AWL can
   persist consumption/causal history; manual handoffs must carry/rotate the map
   revision honestly. Do not claim detection of out-of-protocol state history.
3. **No public map schema in v1** — opaque runtime persistence plus fixed text
   and existing feature-28 receipts are sufficient until a demonstrated
   interoperability need exists.
4. **A legitimate blocker can take time** — question bounds prevent aimless
   repetition, not unavailable repository/service evidence. BLOCKED is a valid
   result and must name the prerequisite.
5. **Context compaction can omit nuance** — the handoff must preserve every
   relevant evidence claim, contradiction, and unknown even while excluding raw
   exploration history.
6. **Pi bundle parity is mandatory** — feature 27's bundle script is the only
   writer of packaged copies; never edit the copies by hand.
7. **Effect size is unknown** — record canary results before describing this as
   faster or cheaper.
