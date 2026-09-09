# known-issues — 38-workflow-status-sensor-script

No unresolved product or engineering decision blocks implementation.

## Known boundaries to preserve

1. **Scripts do not travel with installed skill bundles (E-38-7).** The pi
   package's bundle copies skill directory trees only; root `scripts/` are not
   distributed (PE-009). The slimmed skill therefore references
   `scripts/workflow-status.mjs`, which exists in this repository (dogfooding
   model) but not in a consumer install. This is the tracked distribution gap
   issue #198 (per-skill package layout + shared runtime resolver) will close;
   until then, installed consumers of the slimmed skill need the repo's
   `scripts/` or the #198 resolver. Not blocking for this unit.
2. **Fix #179 will amend the sensor surface after this unit (E-38-6).** The
   `declared-delta` receipt vocabulary lands when its dependency gate opens
   (features 31/32 merged) and amends `scripts/pre-execution-snapshot.mjs` +
   `skills/workflow-status/references/PRE_EXECUTION.md` — and, from this unit
   on, the script's label table together. Sequenced, disjoint from 38's file
   list; no coordination action required now.
3. **Degradation constants are implementation-pinned (E-38-5).** The forge
   wall-clock timeout value and the unknown-flag exit code (repo convention 1–2)
   are fixed at implementation and pinned red-first by the suite; changing them
   later is a test+code change, never a silent tweak.
4. **`docs/CAPABILITIES.md` seeding is still pending user confirmation.** The
   product half proposed seeding the unfilled template (F19 resolution); the
   user confirmation was not part of planning scope and rides outside this
   unit (see SPEC §2 preamble + decisions.md).
