#!/usr/bin/env node
/**
 * test-preload.mjs — the per-file and per-package-suite half of the git-env rule
 * (issue #514 S9, `scripts/git-env.mjs` owns the rule).
 *
 * `scripts/run-root-suite.mjs` and `scripts/local-gate.mjs` scrub the repository
 * locators before they spawn a suite, so a gate run from `git push`'s pre-push
 * hook cannot re-initialise the caller's checkout. A developer running one file
 * (`bun test scripts/x.test.mjs`) or a package's own suite (`bun run test` in
 * `packages/*`) does not pass through either entry point, so the same scrub is
 * applied here — inside the test process, before any fixture spawns git.
 *
 * Each `bunfig.toml` in the repository declares this file as its `[test]
 * preload`, which is what makes the protection inherit into a suite written
 * tomorrow without that suite knowing it exists. The node fallback has no
 * per-file preload: `node --test` runs `node --test --import ./scripts/test-preload.mjs`
 * or inherits a clean environment.
 *
 * Imported for its side effect only; it resolves the vocabulary from
 * `git-env.mjs` so there is no second list.
 */

import { GIT_LOCATOR_VARS } from "./git-env.mjs";

for (const name of GIT_LOCATOR_VARS) delete process.env[name];
