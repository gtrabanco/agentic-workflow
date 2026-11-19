---
"@gtrabanco/agentic-workflow-schema": minor
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": minor
"unit-lane": minor
"init-workspace": minor
"orchestration-envelope": minor
"runner-contract": patch
---

feat(644): route a substrate gap to the scaffolder instead of halting

The `needs-input` alarm gains its third route. A question the lane cannot resolve
because **no document in the workspace is scaffolded to own it** is no longer
just surfaced: a row routed `init-workspace:<class>` sends it to the scaffolder,
and the dispatcher verifies that claim against the workspace's substrate census
before granting it — a claim on a surface that already exists is refused
(`substrate-present`), so the route cannot become a way around an owner.

- `substrate check --workspace <dir>` is that census as a gate: one row per class
  (`architecture`, `decision-records`, `api-posture`, `documentation-map`) as
  `present`, `declined` (a dated `substrate-declines@1` row, written only on an
  explicit yes) or `absent`, plus the summary and the verdict. `init-workspace`
  runs it on both routes: bootstrap refuses an install that leaves a class absent,
  upgrade offers the additive block per absent class.
- `NEEDS_INPUT_ROUTES` and `SUBSTRATE_CLASSES` move to the schema package (one
  owner per closed vocabulary) and the runner imports them.
- `unit-lane`'s design step gains `evidence-staleness@1`: a claim read out of tree
  prose cites its location and is re-read against its neighbourhood before it
  decides anything — the #643 class that a stale header comment kept alive.
