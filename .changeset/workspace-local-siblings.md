---
"@gtrabanco/agentic-workflow": patch
"@gtrabanco/agentic-workflow-schema": patch
"@gtrabanco/pi-agentic-workflow": patch
---

The packages under packages/ are bun workspace members of a private root package.json, and ONE bun.lock at the root replaces the three package-local locks. A member's sibling dependency now resolves from the folder instead of the registry, so a sibling pin can name the version the same commit ships — the shape the --pins gate requires and that a package-local lock made impossible: an unpublished pin does not resolve, and a stale lock fails --frozen-lockfile, so no PR could both bump a sibling and stay installable. The published manifest is untouched (it keeps the exact version; npm publish never ships a workspace: protocol). scripts/workspace-lock-policy.test.mjs owns the one-lock rule, and the per-package lockfile-policy tests keep the policies that are still per package.

The workspace also carries the compiler upgrade that goes with that policy: `typescript` moves from a full `6.0.3` pin and a major-only `6` to a deliberate partial pin `7` in both packages — TypeScript honours semver, so a major-only pin keeps receiving its fixes and the native compiler's performance work, and the committed workspace lock records the exact resolution (`7.0.2`) either way.
