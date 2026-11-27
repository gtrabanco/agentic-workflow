## 2026-11-27T00:14:12Z — fix/734-log-session-subcommand-shape — narrative
- **Commits:** 1 (`a494681e…a494681e`)
- **Files:** .changeset/734-log-session-subcommand-shape.md, packages/agentic-workflow/package.json, packages/pi-agentic-workflow/package.json, packages/pi-agentic-workflow/src/log-session-invocation.ts, packages/pi-agentic-workflow/test/log-session-invocation.test.mjs
- **Summary:** Applied issue #734: the /log-session directive now renders the runner door's call shape — the service alone in subcommand, the operation first in args — the runner-mapping block pins the rule, and an executable case runs the rendered call against the crate in a fixture (red on the base bytes).
- **Decisions:** Route (a) chosen per the issue's recommendation and the owner's inline order; (b) split-in-the-door rejected (IR11). The prior commit's hand version bump and malformed CHANGELOG row were repaired: a valid changeset is the release intent. The executable pin lives beside the emitter, not in the wiring suite (verified).
- **Next:** Owner verdict on the delivered diff; after merge the next pi release carries both sides and the fix row leaves docs/ROADMAP.md.
