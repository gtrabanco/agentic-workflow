#!/usr/bin/env bash

set -euo pipefail

pr=""
head_sha=""
base=""
run_id=""
method="squash"
decision_file="docs/features/SHIP_DECISIONS.md"

fail() {
  printf 'fullauto-merge: %s\n' "$1" >&2
  exit 1
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --pr) [ "$#" -ge 2 ] || fail "--pr requires a value"; pr=$2; shift 2 ;;
    --head) [ "$#" -ge 2 ] || fail "--head requires a value"; head_sha=$2; shift 2 ;;
    --base) [ "$#" -ge 2 ] || fail "--base requires a value"; base=$2; shift 2 ;;
    --run-id) [ "$#" -ge 2 ] || fail "--run-id requires a value"; run_id=$2; shift 2 ;;
    --method) [ "$#" -ge 2 ] || fail "--method requires a value"; method=$2; shift 2 ;;
    --decision-file) [ "$#" -ge 2 ] || fail "--decision-file requires a value"; decision_file=$2; shift 2 ;;
    *) echo "fullauto-merge: unknown argument: $1" >&2; exit 2 ;;
  esac
done

[ "${AGENTIC_WORKFLOW_SHIP_ROADMAP_FULLAUTO:-}" = "1" ] || fail "active ship-roadmap --fullauto invocation is required"
[ -n "$pr" ] && [ -n "$head_sha" ] && [ -n "$base" ] && [ -n "$run_id" ] || fail "--pr, --head, --base, and --run-id are required"
printf '%s' "$pr" | grep -Eq '^[0-9]+$' || fail "PR must be numeric"
printf '%s' "$head_sha" | grep -Eq '^[0-9a-fA-F]{7,64}$' || fail "head SHA is invalid"
printf '%s' "$run_id" | grep -Eq '^[A-Za-z0-9._-]+$' || fail "run id is invalid"
case "$method" in merge|squash|rebase) ;; *) fail "method must be merge, squash, or rebase" ;; esac

command -v jq >/dev/null 2>&1 || fail "jq is required"
command -v gh >/dev/null 2>&1 || fail "gh is required"
[ -f "$decision_file" ] || fail "decision file not found: $decision_file"
grep -Eqi '^merge:[[:space:]]*fullauto[[:space:]]*$' "$decision_file" || fail "decision file does not authorize merge: fullauto"
[ -z "$(git status --porcelain)" ] || fail "working tree is not clean"
[ "$(git rev-parse HEAD)" = "$head_sha" ] || fail "local head does not match the audited SHA"
upstream=$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null) || fail "current branch has no upstream"
git fetch --quiet
sync_counts=$(git rev-list --left-right --count "$upstream...HEAD")
[ "$sync_counts" = $'0\t0' ] || fail "branch is not synchronized with its remote"

pr_json=$(gh pr view "$pr" --json number,url,state,baseRefName,headRefOid,mergeable,statusCheckRollup,comments)
remote_head=$(printf '%s' "$pr_json" | jq -r '.headRefOid')
remote_base=$(printf '%s' "$pr_json" | jq -r '.baseRefName')
remote_state=$(printf '%s' "$pr_json" | jq -r '.state')
pr_url=$(printf '%s' "$pr_json" | jq -r '.url')
marker="<!-- agentic-workflow:automerge head=$head_sha -->"

[ "$remote_head" = "$head_sha" ] || fail "remote head does not match the audited SHA"
[ "$remote_base" = "$base" ] || fail "PR base does not match the declared default branch"

comment_exists() {
  printf '%s' "$1" | jq -e --arg marker "$marker" '[.comments[]?.body | contains($marker)] | any' >/dev/null
}

post_comment() {
  merge_sha=$1
  comment_file=$(mktemp "${TMPDIR:-/tmp}/agentic-workflow-automerge.XXXXXX")
  trap 'rm -f "${comment_file:-}"; [ -z "${attempt_marker:-}" ] || rm -f "$attempt_marker"' EXIT HUP INT TERM
  tick='`'
  {
    printf '%s\n' "$marker"
    printf '%s\n' '## agentic-workflow: auto-merged'
    printf '\n- **Mode:** %sship-roadmap --fullauto%s\n' "$tick" "$tick"
    printf -- '- **Run:** %s%s%s\n' "$tick" "$run_id" "$tick"
    printf -- '- **Audited head:** %s%s%s\n' "$tick" "$head_sha" "$tick"
    printf -- '- **Merge commit:** %s%s%s\n' "$tick" "$merge_sha" "$tick"
    printf -- '- **Audit trail:** this comment is the durable automerge log; direct merge commands remained blocked.\n'
  } > "$comment_file"
  gh pr comment "$pr" --body-file "$comment_file" >/dev/null
}

if [ "$remote_state" = "MERGED" ]; then
  if ! comment_exists "$pr_json"; then
    merged_json=$(gh pr view "$pr" --json mergeCommit)
    post_comment "$(printf '%s' "$merged_json" | jq -r '.mergeCommit.oid')"
  fi
  printf 'MERGED %s @ %s (already merged; comment reconciled)\n' "$pr_url" "$head_sha"
  exit 0
fi

[ "$remote_state" = "OPEN" ] || fail "PR is not open"
[ "$(printf '%s' "$pr_json" | jq -r '.mergeable')" != "CONFLICTING" ] || fail "PR is conflicting"

check_count=$(printf '%s' "$pr_json" | jq '.statusCheckRollup | length')
if [ "$check_count" -eq 0 ]; then
  [ "${AGENTIC_WORKFLOW_LOCAL_GATE_SHA:-}" = "$head_sha" ] || fail "no CI checks and no fresh local gate for the audited SHA"
else
  printf '%s' "$pr_json" | jq -e '
    [.statusCheckRollup[] |
      ((.conclusion // .state // "") | ascii_upcase) as $result |
      ($result == "SUCCESS" or $result == "NEUTRAL" or $result == "SKIPPED")
    ] | all
  ' >/dev/null || fail "CI is not green on the audited SHA"
fi

git_common=$(git rev-parse --git-common-dir)
case "$git_common" in /*) ;; *) git_common="$(pwd)/$git_common" ;; esac
marker_dir="$git_common/agentic-workflow"
mkdir -p "$marker_dir"
umask 077
attempt_marker="$marker_dir/automerge-$run_id"
comment_file=""
trap 'rm -f "${comment_file:-}"; rm -f "${attempt_marker:-}"' EXIT HUP INT TERM
printf 'run=%s\npr=%s\nhead=%s\n' "$run_id" "$pr" "$head_sha" > "$attempt_marker"

gh pr merge "$pr" "--$method" --match-head-commit "$head_sha"

merged_json=$(gh pr view "$pr" --json number,url,state,headRefOid,baseRefName,mergeCommit,comments)
[ "$(printf '%s' "$merged_json" | jq -r '.state')" = "MERGED" ] || fail "forge did not report the PR as merged"
merge_sha=$(printf '%s' "$merged_json" | jq -r '.mergeCommit.oid')
if ! comment_exists "$merged_json"; then
  post_comment "$merge_sha"
fi

printf 'MERGED %s @ %s\n' "$pr_url" "$merge_sha"
