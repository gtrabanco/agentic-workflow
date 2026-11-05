// git-sandbox.mjs — the git location variables a test's child `git` must never
// inherit. A test suite runs throwaway repositories in `os.tmpdir()` while the
// host process may sit inside a tooling checkout (a git worktree whose harness
// exports `GIT_DIR`/`GIT_WORK_TREE`); `git -C <tmp>` then resolves the outer
// repository from the environment and the fixture commits land in the real
// repo. This is the test-side twin of `sandboxGitEnv` in
// `src/auto-log-session.ts` — the same list, kept in step.

const GIT_LOCATION_VARS = [
  "GIT_DIR",
  "GIT_WORK_TREE",
  "GIT_INDEX_FILE",
  "GIT_OBJECT_DIRECTORY",
  "GIT_ALTERNATE_OBJECT_DIRECTORIES",
  "GIT_COMMON_DIR",
  "GIT_NAMESPACE",
  "GIT_CEILING_DIRECTORIES",
];

export function sandboxGitEnv(env = process.env) {
  const clean = { ...env };
  for (const name of GIT_LOCATION_VARS) delete clean[name];
  return clean;
}
