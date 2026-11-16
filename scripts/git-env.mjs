#!/usr/bin/env node

/**
 * git-env.mjs — one definition of "the caller's repository may not reach a step".
 *
 * `git push` exports `GIT_DIR` (and its siblings) to its `pre-push` hook. A
 * suite that spawns `git init <dir>` under that environment re-initializes the
 * *caller's* repository instead of the throwaway directory — `git init` answers
 * `warning: re-init: ignored --initial-branch=…` and writes nothing under `<dir>`
 * — so the fixture's commits move the real branch. On 2026-11-05 the local gate
 * ran from the hook and clobbered the working checkout's branch pointer that way.
 *
 * The fix belongs in the entry points that spawn suites, not in every fixture:
 * one place strips the repository-locator variables, and a fixture written
 * tomorrow inherits the protection without knowing about it.
 *
 * What stays: `GIT_CONFIG_*` (the root gate disables commit signing through it),
 * `GIT_AUTHOR_*` / `GIT_COMMITTER_*` (a fixture sets its own identity) and
 * `GIT_DEFAULT_BRANCH`. Those configure git; they do not point it at a
 * repository.
 *
 * The same boundary carries a second rule (owner-routed S15): ambient git
 * *tracing* may not reach a suite either. `GIT_TRACE=1 git push` exports the
 * flag through the hook, every suite inherits it, and the product's own `git`
 * children then write `git.c:479 trace: …` lines to stderr — so a test that
 * pins an empty stderr fails on output it never produced (observed 2026-11-16,
 * `feedback.test.mjs`). A trace does not point git at a repository, so it is
 * not a locator: it lives in its own published set, `GIT_TRACE_VARS`, and the
 * boundary function `scrubGitEnv` removes both sets. `scrubGitLocator` keeps
 * its published locator-only meaning for callers that want exactly that.
 */

/** The variables that locate a repository, an index or an object store. */
export const GIT_LOCATOR_VARS = Object.freeze([
  "GIT_DIR",
  "GIT_WORK_TREE",
  "GIT_INDEX_FILE",
  "GIT_OBJECT_DIRECTORY",
  "GIT_ALTERNATE_OBJECT_DIRECTORIES",
  "GIT_COMMON_DIR",
  "GIT_NAMESPACE",
  "GIT_PREFIX",
  "GIT_QUARANTINE_PATH",
]);

/**
 * A copy of `env` with every repository locator removed.
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} [env]
 * @returns {Record<string, string | undefined>}
 */
export function scrubGitLocator(env = process.env) {
  const clean = { ...env };
  for (const name of GIT_LOCATOR_VARS) delete clean[name];
  return clean;
}

/**
 * The ambient git tracing variables: they change what `git` prints, not where
 * it reads or how it is configured — which is exactly what a suite asserts on.
 */
export const GIT_TRACE_VARS = Object.freeze([
  "GIT_TRACE",
  "GIT_TRACE2",
]);

/**
 * A copy of `env` with every repository locator **and** every ambient trace
 * removed — the scrub the suite-boundary entry points use (local gate, root
 * runner, bunfig preload).
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} [env]
 * @returns {Record<string, string | undefined>}
 */
export function scrubGitEnv(env = process.env) {
  const clean = scrubGitLocator(env);
  for (const name of GIT_TRACE_VARS) delete clean[name];
  return clean;
}
