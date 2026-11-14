#!/usr/bin/env bash
#
# test-forge-adapter.sh — one adapter, three forges, no fourth (issue #546 S4).
#
# `turn-contract.sh` and `fullauto-merge.sh` both need the same three facts: which
# forge does this remote belong to, which CLI speaks it, and what does that CLI say
# about a pull request. Those facts live in `hooks/lib/forge.sh` and nowhere else —
# this suite pins the adapter's argv against PATH stubs, which is the only thing a
# machine without a real forge can prove.
#
# Run: bash template/.agentic-workflow/hooks/tests/test-forge-adapter.sh

set -uo pipefail

hooks_dir=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
lib="$hooks_dir/lib/forge.sh"
failures=0
cases=0

pass() { printf 'ok %d — %s\n' "$cases" "$1"; }
fail() { printf 'not ok %d — %s\n' "$cases" "$1"; failures=$((failures + 1)); }
check() {
  cases=$((cases + 1))
  if [ "$1" = "$2" ]; then pass "$3"; else fail "$3 (want [$2], got [$1])"; fi
}
check_contains() {
  cases=$((cases + 1))
  case "$1" in
    *"$2"*) pass "$3" ;;
    *) fail "$3 (want [$2] inside [$1])" ;;
  esac
}
check_nonzero() {
  cases=$((cases + 1))
  if [ "$1" -ne 0 ]; then pass "$2"; else fail "$2 (exited 0)"; fi
}

scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT
mkdir -p "$scratch/bin" "$scratch/state"

if [ ! -f "$lib" ]; then
  cases=$((cases + 1)); fail "the forge adapter exists at lib/forge.sh"
  printf '\n%d case(s), %d failure(s)\n' "$cases" "$failures"
  exit 1
fi

# shellcheck disable=SC1090
. "$lib"

head_sha=0123456789abcdef0123456789abcdef01234567

# ── the PATH stubs: each one records its argv and answers one document ─────
cat > "$scratch/bin/gh" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$STUB_STATE/gh.argv"
case "$1 $2" in
  "pr view") printf '%s\n' "${GH_STUB_JSON:-{}}" ;;
  *) exit 3 ;;
esac
STUB
cat > "$scratch/bin/glab" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$STUB_STATE/glab.argv"
case "$1 $2" in
  "mr view") printf '%s\n' "${GLAB_STUB_JSON:-{}}" ;;
  "mr merge") exit "${GLAB_STUB_MERGE_EXIT:-0}" ;;
  "repo view") printf '%s\n' "${GLAB_STUB_REPO:-{\"default_branch\":\"main\"\}}" ;;
  api) printf '%s\n' "${GLAB_STUB_NOTES:-[]}" ;;
  *) exit 3 ;;
esac
STUB
cat > "$scratch/bin/gt" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$STUB_STATE/gt.argv"
case "$1 $2" in
  "pr view") printf '%s\n' "${GT_STUB_JSON:-{}}" ;;
  "pr merge") exit "${GT_STUB_MERGE_EXIT:-0}" ;;
  "repo view") printf '%s\n' "${GT_STUB_REPO:-{\"default_branch\":\"main\"\}}" ;;
  *) exit 3 ;;
esac
STUB
chmod +x "$scratch/bin/gh" "$scratch/bin/glab" "$scratch/bin/gt"
export STUB_STATE="$scratch/state"
export PATH="$scratch/bin:$PATH"
unset AGENTIC_WORKFLOW_FORGE

# ── 1. detection ──────────────────────────────────────────────────────────
check "$(forge_detect 'https://github.com/acme/app.git')" "github" "a github host is github"
check "$(forge_detect 'git@github.com:acme/app.git')" "github" "the scp form is github too"
check "$(forge_detect 'https://gitlab.com/acme/app.git')" "gitlab" "a gitlab host is gitlab"
check "$(forge_detect 'https://gitlab.example.com/team/app.git')" "gitlab" "a self-hosted gitlab host is gitlab"
check "$(forge_detect 'https://gitea.com/acme/app.git')" "gitea" "a gitea host is gitea"
check "$(forge_detect 'https://bitbucket.org/acme/app.git')" "bitbucket" "a bitbucket host is bitbucket"
check "$(forge_detect '/tmp/agentic-workflow-remote.git')" "default" "a filesystem remote has no forge and takes the default CLI"
check "$(forge_detect 'https://git.example.com/acme/app.git')" "unknown" "a host that says nothing is unknown, never guessed"
check "$(forge_detect 'https://git.example.com/acme/app.git' gitlab)" "gitlab" "an explicit override wins over the host"
AGENTIC_WORKFLOW_FORGE=gitea check "$(forge_detect 'https://git.example.com/acme/app.git')" "gitea" "AGENTIC_WORKFLOW_FORGE wins over the host"
unset AGENTIC_WORKFLOW_FORGE

# ── 2. CLI resolution ─────────────────────────────────────────────────────
check "$(forge_cli github)" "gh" "github is spoken by gh"
check "$(forge_cli gitlab)" "glab" "gitlab is spoken by glab"
check "$(forge_cli gitea)" "gt" "gitea is spoken by gt (tea is archived upstream)"
check "$(forge_cli default)" "gh" "the filesystem default is gh"
merged=$(forge_cli bitbucket 2>&1); status=$?
check_nonzero "$status" "bitbucket has no CLI and is refused"
check_contains "$merged" "bitbucket" "the refusal names bitbucket"
merged=$(forge_cli unknown 2>&1); status=$?
check_nonzero "$status" "an unknown forge is refused"
check_contains "$merged" "--forge" "the refusal names the override"

# ── 3. the project path ───────────────────────────────────────────────────
check "$(forge_project_path 'https://gitlab.com/acme/app.git')" "acme/app" "the project path drops the host and .git"
check "$(forge_project_path 'git@gitlab.com:group/sub/app.git')" "group/sub/app" "a nested group survives"
check "$(forge_project_path '/tmp/agentic-workflow-remote.git')" "agentic-workflow-remote" "a path remote keeps its leaf"

# ── 4. the pull-request document, normalized per forge ────────────────────
export GH_STUB_JSON='{"number":12,"url":"https://github.com/acme/app/pull/12","state":"OPEN","baseRefName":"main","headRefOid":"'"$head_sha"'","mergeable":"MERGEABLE","statusCheckRollup":[{"conclusion":"SUCCESS"}],"comments":[{"body":"x"}]}'
json=$(forge_pr_json github 12)
check "$(printf '%s' "$json" | jq -r '.state')" "OPEN" "github state is passed through"
check "$(printf '%s' "$json" | jq -r '.headRefOid')" "$head_sha" "github head is passed through"
check "$(grep -c 'pr view' "$scratch/state/gh.argv")" "1" "github is asked once"

export GLAB_STUB_JSON='{"iid":12,"web_url":"https://gitlab.com/acme/app/-/merge_requests/12","state":"opened","target_branch":"main","sha":"'"$head_sha"'","merge_status":"can_be_merged","draft":false,"head_pipeline":{"status":"success"}}'
json=$(forge_pr_json gitlab 12)
check "$(printf '%s' "$json" | jq -r '.number')" "12" "gitlab iid becomes the number"
check "$(printf '%s' "$json" | jq -r '.state')" "OPEN" "gitlab opened is OPEN"
check "$(printf '%s' "$json" | jq -r '.baseRefName')" "main" "gitlab target_branch is the base"
check "$(printf '%s' "$json" | jq -r '.headRefOid')" "$head_sha" "gitlab sha is the head"
check "$(printf '%s' "$json" | jq -r '.mergeable')" "MERGEABLE" "gitlab can_be_merged is mergeable"
check "$(printf '%s' "$json" | jq -r '.statusCheckRollup[0].conclusion')" "SUCCESS" "gitlab pipeline success is a green check"
check "$(printf '%s' "$json" | jq -r '.url')" "https://gitlab.com/acme/app/-/merge_requests/12" "gitlab web_url is the url"
check "$(grep -c 'mr view 12 -F json' "$scratch/state/glab.argv")" "1" "gitlab is asked with the documented JSON flag"

export GT_STUB_JSON='{"number":12,"url":"https://gitea.com/acme/app/pulls/12","state":"open","base":"main","head_sha":"'"$head_sha"'","mergeable":true,"draft":false,"merged":false,"comments":[{"body":"y"}]}'
json=$(forge_pr_json gitea 12)
check "$(printf '%s' "$json" | jq -r '.state')" "OPEN" "gitea open is OPEN"
check "$(printf '%s' "$json" | jq -r '.baseRefName')" "main" "gitea base is the base"
check "$(printf '%s' "$json" | jq -r '.headRefOid')" "$head_sha" "gitea head_sha is the head"
check "$(printf '%s' "$json" | jq -r '.mergeable')" "MERGEABLE" "gitea true is mergeable"
check "$(printf '%s' "$json" | jq -r '.statusCheckRollup | length')" "0" "gitea has no CI surface, so the check list is empty"
check "$(printf '%s' "$json" | jq -r '.comments[0].body')" "y" "gitea comments are preserved"

# ── 5. the notes carrier (glab needs its own call) ────────────────────────
export GLAB_STUB_NOTES='[{"body":"<!-- audit-pr:merge-ready sha=x -->"}]'
notes=$(forge_pr_notes gitlab 12 'https://gitlab.com/acme/app.git')
check "$(printf '%s' "$notes" | jq -r '.[0].body')" "<!-- audit-pr:merge-ready sha=x -->" "gitlab notes are read through the api"
check_contains "$(cat "$scratch/state/glab.argv")" "projects/acme%2Fapp/merge_requests/12/notes" "the project path is URL-encoded in the api call"

# ── 6. the default branch ─────────────────────────────────────────────────
export GLAB_STUB_REPO='{"default_branch":"trunk"}'
check "$(forge_default_base gitlab)" "trunk" "gitlab's default branch comes from repo view"
export GT_STUB_REPO='{"default_branch":"trunk"}'
check "$(forge_default_base gitea)" "trunk" "gitea's default branch comes from repo view"

# ── 7. the merge, per forge ───────────────────────────────────────────────
forge_merge github 12 merge "$head_sha" >/dev/null 2>&1 || true
check_contains "$(cat "$scratch/state/gh.argv")" "pr merge 12 --merge --match-head-commit $head_sha" "github merges SHA-bound"
forge_merge gitlab 12 squash "$head_sha" >/dev/null 2>&1 || true
check_contains "$(cat "$scratch/state/glab.argv")" "mr merge 12 --sha $head_sha --squash -y" "gitlab merges SHA-bound with --sha"
forge_merge gitea 12 rebase "$head_sha" >/dev/null 2>&1 || true
check_contains "$(cat "$scratch/state/gt.argv")" "pr merge 12 --method rebase -y" "gitea merges through gt"
merged=$(forge_merge bitbucket 12 merge "$head_sha" 2>&1); status=$?
check_nonzero "$status" "bitbucket never merges"

# ── 8. an absent CLI fails closed, naming it ──────────────────────────────
PATH="/usr/bin:/bin"
merged=$(forge_pr_json gitea 12 2>&1); status=$?
check_nonzero "$status" "a missing CLI is a failure, never an empty answer"
check_contains "$merged" "gt" "the failure names the missing CLI"
export PATH="$scratch/bin:$PATH"

printf '\n%d case(s), %d failure(s)\n' "$cases" "$failures"
[ "$failures" -eq 0 ]
