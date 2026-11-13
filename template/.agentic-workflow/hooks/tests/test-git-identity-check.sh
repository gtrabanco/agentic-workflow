#!/usr/bin/env bash
#
# test-git-identity-check.sh — the pre-commit identity hook's own suite (issue
# #514 S3). Every fixture is a throwaway repository; every identity is passed to
# the committing command with `-c` (git exports those values to the hook through
# GIT_CONFIG_PARAMETERS), so no fixture and no checkout has git config written.
#
# Run: bash template/.agentic-workflow/hooks/tests/test-git-identity-check.sh

set -uo pipefail

hooks_dir=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
hook="$hooks_dir/git-identity-check.sh"
failures=0
cases=0

pass() { printf 'ok %d — %s\n' "$cases" "$1"; }
fail() { printf 'not ok %d — %s\n' "$cases" "$1"; failures=$((failures + 1)); }

check() {
  # check <description> <expected-exit> <case-dir> <stdout+stderr file>
  local description=$1 expected=$2 dir=$3 output=$4
  cases=$((cases + 1))
  if [ "$status" -eq "$expected" ]; then
    pass "$description"
  else
    fail "$description (expected exit $expected, got $status)"
    sed 's/^/    /' "$output"
  fi
}

# A fixture repository: one seed commit, a project config file, a captured
# profile and the committing identity supplied per invocation.
make_repo() {
  dir=$(mktemp -d "${TMPDIR:-/tmp}/identity-hook.XXXXXX")
  global_dir=$(mktemp -d "${TMPDIR:-/tmp}/identity-hook-global.XXXXXX")
  git -C "$dir" init -q -b main
  printf 'seed\n' >"$dir/seed.txt"
  git -C "$dir" add -A
  git -C "$dir" -c user.name="Seed" -c user.email="seed@example.test" -c commit.gpgsign=false commit -qm seed
  mkdir -p "$dir/.pi"
}

cleanup() { rm -rf "$dir" "$global_dir"; }

# run_hook <identity-name> <identity-email> [extra git -c args…]
run_hook() {
  local name=$1 email=$2
  shift 2
  output="$dir/hook.out"
  GIT_AUTHOR_NAME="$name" GIT_AUTHOR_EMAIL="$email" \
    GIT_COMMITTER_NAME="$name" GIT_COMMITTER_EMAIL="$email" \
    PI_CODING_AGENT_DIR="$global_dir" \
    git -C "$dir" "$@" var GIT_AUTHOR_IDENT >/dev/null 2>&1
  # The hook is a child of `git commit`; running it directly is the same contract
  # (it reads the resolved identity and the profile), and it keeps the fixture
  # free of a commit that would itself be attributed.
  # HOME is the fixture's: the operator's global git config must not decide a
  # fixture's identity, and that isolation is what makes the cases deterministic.
  ( cd "$dir" && HOME="$global_dir" PI_CODING_AGENT_DIR="$global_dir" \
      GIT_AUTHOR_NAME="$name" GIT_AUTHOR_EMAIL="$email" \
      GIT_COMMITTER_NAME="$name" GIT_COMMITTER_EMAIL="$email" \
      bash "$hook" "$@" ) >"$output" 2>&1
  status=$?
}

code() { printf '{"gitIdentity": %s}\n' "$1" >"$dir/.pi/agentic-workflow.json"; }

# The hook, run with git-config values the way git exports a `-c` to a hook.
# (The signing cases cannot run a real commit: with commit.gpgsign=true git
# would sign with the fixture key and fail for a reason that is not the hook.)
run_hook_cfg() {
  local name=$1 email=$2
  shift 2
  local params=""
  local pair
  for pair in "$@"; do
    params="${params:+"$params "}'$pair'"
  done
  output="$dir/hook.out"
  ( cd "$dir" && HOME="$global_dir" PI_CODING_AGENT_DIR="$global_dir" \
      GIT_AUTHOR_NAME="$name" GIT_AUTHOR_EMAIL="$email" \
      GIT_COMMITTER_NAME="$name" GIT_COMMITTER_EMAIL="$email" \
      GIT_CONFIG_PARAMETERS="$params" \
      bash "$hook" ) >"$output" 2>&1
  status=$?
}

# ── 1. inert without a profile ────────────────────────────────────────────
make_repo
run_hook "t" "t@example.test"
check "no profile: the hook is inert" 0 "$dir" "$output"
cleanup

# ── 2. a matching identity passes ─────────────────────────────────────────
make_repo
code '{"enforce":"commit","approved":{"name":"Fixture Human","email":"human@example.com"}}'
run_hook "Fixture Human" "human@example.com"
check "matching name and email pass" 0 "$dir" "$output"
cleanup

# ── 3. a misattributed author fails and prints the correct repair forms ───
make_repo
code '{"enforce":"commit","approved":{"name":"Fixture Human","email":"human@example.com"}}'
run_hook "t" "t@example.test"
check "misattributed author fails" 1 "$dir" "$output"
if grep -q 'git config --show-origin --get-all user.name' "$output" \
  && grep -q 'git config --unset user.name' "$output" \
  && grep -q 'git var GIT_AUTHOR_IDENT' "$output"; then
  cases=$((cases + 1)); pass "the repair block carries the correct forms"
else
  cases=$((cases + 1)); fail "the repair block carries the correct forms"; sed 's/^/    /' "$output"
fi
if grep -q 'user.name --unset' "$output"; then
  cases=$((cases + 1)); fail "the inverted repair form is never printed"
else
  cases=$((cases + 1)); pass "the inverted repair form is never printed"
fi
cleanup

# ── 4. a misattributed committer fails even when the author matches ───────
make_repo
code '{"enforce":"commit-and-push","approved":{"name":"Fixture Human","email":"human@example.com"}}'
output="$dir/hook.out"
( cd "$dir" && HOME="$global_dir" PI_CODING_AGENT_DIR="$global_dir" \
    GIT_AUTHOR_NAME="Fixture Human" GIT_AUTHOR_EMAIL="human@example.com" \
    GIT_COMMITTER_NAME="t" GIT_COMMITTER_EMAIL="t@example.test" \
    bash "$hook" ) >"$output" 2>&1
status=$?
check "misattributed committer fails" 1 "$dir" "$output"
if grep -q 'committer: t <t@example.test>' "$output"; then
  cases=$((cases + 1)); pass "the failure names the committer"
else
  cases=$((cases + 1)); fail "the failure names the committer"; sed 's/^/    /' "$output"
fi
cleanup

# ── 5. enforce=push is the gate's half: the hook stays out of it ──────────
make_repo
code '{"enforce":"push","approved":{"name":"Fixture Human","email":"human@example.com"}}'
run_hook "t" "t@example.test"
check "enforce=push leaves the commit hook inert" 0 "$dir" "$output"
cleanup

# ── 6. an unenforced project with no declared profile is a config error ───
make_repo
code '{"enforce":"commit","approved":{}}'
run_hook "Fixture Human" "human@example.com"
check "enforce=commit with no approved facts fails closed" 1 "$dir" "$output"
cleanup

# ── 7. JSONC (full-line comments, block comments, trailing comma) ─────────
make_repo
cat >"$dir/.pi/agentic-workflow.json" <<'JSON'
{
  // the approved identity for this project
  "gitIdentity": {
    /* corporate case: legal name plus a key */
    "enforce": "commit",
    "approved": {
      "name": "Fixture Human",
      "email": "human@example.com",
    },
  },
}
JSON
run_hook "Fixture Human" "human@example.com"
check "a JSONC profile is read" 0 "$dir" "$output"
cleanup

# ── 8. signing: commit.gpgsign=true with no key fails ─────────────────────
make_repo
code '{"enforce":"commit","approved":{"name":"Fixture Human","email":"human@example.com"}}'
run_hook_cfg "Fixture Human" "human@example.com" commit.gpgsign=true
check "signing on with no signing key fails" 1 "$dir" "$output"
if grep -q 'no user.signingKey' "$output"; then
  cases=$((cases + 1)); pass "the failure names the missing key"
else
  cases=$((cases + 1)); fail "the failure names the missing key"; sed 's/^/    /' "$output"
fi
cleanup

# ── 9. signing: an absent SSH key file fails, a present one passes ────────
make_repo
code '{"enforce":"commit","approved":{"name":"Fixture Human","email":"human@example.com"}}'
run_hook_cfg "Fixture Human" "human@example.com" commit.gpgsign=true gpg.format=ssh user.signingKey="$dir/missing_ed25519"
check "signing on with an absent SSH key fails" 1 "$dir" "$output"
cleanup

make_repo
code '{"enforce":"commit","approved":{"name":"Fixture Human","email":"human@example.com"}}'
printf 'not a real key\n' >"$dir/id_ed25519"
run_hook_cfg "Fixture Human" "human@example.com" commit.gpgsign=true gpg.format=ssh user.signingKey="$dir/id_ed25519"
check "signing on with a present SSH key passes" 0 "$dir" "$output"
cleanup

# ── 10. corporate case: fullName cannot be verified for an SSH key ────────
make_repo
code '{"enforce":"commit","approved":{"name":"Fixture Human","email":"human@example.com","fullName":"Fixture Human Legal","format":"ssh","signingKey":"'"$dir"'/id_ed25519"}}'
printf 'not a real key\n' >"$dir/id_ed25519"
run_hook_cfg "Fixture Human" "human@example.com" commit.gpgsign=true gpg.format=ssh user.signingKey="$dir/id_ed25519"
check "an unverifiable fullName is refused, never ignored" 1 "$dir" "$output"
cleanup

# ── 11. the approved key must be the resolved key ─────────────────────────
make_repo
code '{"enforce":"commit","approved":{"name":"Fixture Human","email":"human@example.com","format":"ssh","signingKey":"'"$dir"'/approved_ed25519"}}'
printf 'approved\n' >"$dir/approved_ed25519"
printf 'other\n' >"$dir/other_ed25519"
run_hook_cfg "Fixture Human" "human@example.com" commit.gpgsign=true gpg.format=ssh user.signingKey="$dir/other_ed25519"
check "a different signing key than the approved one fails" 1 "$dir" "$output"
run_hook_cfg "Fixture Human" "human@example.com" commit.gpgsign=true gpg.format=ssh user.signingKey="$dir/approved_ed25519"
check "the approved signing key passes" 0 "$dir" "$output"
cleanup

# ── 12. read-only: the profile and the config keep their bytes ────────────
make_repo
code '{"enforce":"commit","approved":{"name":"Fixture Human","email":"human@example.com"}}'
before_profile=$(cat "$dir/.pi/agentic-workflow.json")
before_config=$(git -C "$dir" config --local --list)
run_hook "t" "t@example.test"
after_profile=$(cat "$dir/.pi/agentic-workflow.json")
after_config=$(git -C "$dir" config --local --list)
cases=$((cases + 1))
if [ "$before_profile" = "$after_profile" ] && [ "$before_config" = "$after_config" ]; then
  pass "a failing check repairs nothing"
else
  fail "a failing check repaired something"
fi
cleanup

printf '\n%d case(s), %d failure(s)\n' "$cases" "$failures"
[ "$failures" -eq 0 ]
