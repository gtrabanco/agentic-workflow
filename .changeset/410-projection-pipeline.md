---
"@gtrabanco/pi-agentic-workflow": minor
---

feat(projection): the pack-time projection — the skill bundle becomes a declared transform, not a byte-copy

`bundle-skills.mjs` now applies a repo-internal projection manifest
(`projection-manifest.json`, committed at the package root and never packed) to
the staged bundle: each rule removes or pointerizes one declared prose section,
resolved through the section locator (#407) and bound by sha256 to the exact
bytes it removes. Failure modes are distinct and fail-closed: a selector that
resolves to zero sections is `stale-rule`, several is `ambiguous-match`, a moved
range is `hash-mismatch`, an enforcing command the crate CLI does not dispatch
is `unknown-command`, and the `prereq` op is refused (`unsupported-op`) until
its own unit lands. The manifest ships EMPTY — the bundle is byte-identical to
the plain copy until the first entries land. The parity suite is redefined from
byte-identity to declared projection: untouched files stay byte-identical
(always), ruled files must equal the recomputed projection, and the projection
never grows a skill.
