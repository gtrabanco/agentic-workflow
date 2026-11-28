## 2026-11-27T23:05:39Z — feat/669-flow-driver — narrative
- **Commits:** 5 (`363db1f6…fad3e87d`)
- **Files:** 30 files
- **Summary:** Applied issue #669 (deterministic lane driver) inline: the crate gains `flow` — a sense → decide → hand-off driver over the closed catalog and the router's own answers — and the pi package registers `/flow` and `/draft` as code doors over it; `docs/workflow/LIFECYCLE.md` narrates the three entries, the review ladder and the command decision tree, and its four grammars are registered as normative surfaces.
- **Decisions:** The stop rule is an injectable seam (v1 defaults: a `high` tier stops after its plan, an explicit `--stop-after` always stops, `--yes` cancels the tier rule only and lands as a human-owner `decisions.md` row). No new config key ships: the driver reads flags and machine state. `unit-route.mjs` exports `runTriage`/`computeRoute`/`projectRoot` so the driver never keeps a second router. `--record` writes the composed session mode into the unit's `decisions.md`, never `SPEC.md` — the ledger-ownership map forbids a script writing the unit doc.
- **Next:** The operator's external verify of the handoff; then the PR against main.
