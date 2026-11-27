# Changelog

Release notes for this package, newest first. Written by `scripts/release.mjs apply`
at cut time — the same step that writes the repository's companion row — never by hand.
The whole train's history, including the other packages, is in the repository's
[`CHANGELOG.md`](../../CHANGELOG.md).

## [4.10.1] - 2026-11-23

**Train alignment (D-40-14):** hotfix 01b0a976e published `@gtrabanco/agentic-workflow` alone at 4.10.1, leaving `@gtrabanco/pi-nan-agentic-workflow` at 4.10.0 — the one-train assertion in `scripts/unit-doc-contract.test.mjs` failed and `packages/pi-agentic-workflow`'s exact pin resolved the mis-versioned member from a stale registry tarball. This row restores the uniform 4.10.1 train; no content change its own post-4.10.0 changes ride the pending changesets at the next cut.
