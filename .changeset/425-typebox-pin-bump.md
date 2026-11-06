---
"@gtrabanco/agentic-workflow": patch
---

fix(deps): bump the typebox pin from 1.4.3 to 1.4.5

The scheduled pin watch's drift (issue #425): the pin was behind the
registry's latest. Upstream published no release notes for the window —
the npm tarball diff (23 files) shows a rework of the type engine's call /
tail-call instantiation path, IRI format module updates (WHATWG
IPvFuture handling) and static-type inference adjustments in
array/codec/constructor/cyclic; no exported symbol changed. The lockfile
rides the same commit, refreshed with `bun install --lockfile-only`.
