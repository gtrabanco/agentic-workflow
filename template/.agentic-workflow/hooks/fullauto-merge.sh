#!/usr/bin/env bash
#
# fullauto-merge.sh — the automated merge wrapper, forge-agnostic since #546.
#
# The former `ship-roadmap --fullauto` was the sole automated merge authority and
# called this wrapper only after a fresh, SHA-bound audit. The preconditions are
# unchanged and none of them is a forge fact: a clean, synchronized tree; a
# PR/MR whose base is the forge's default branch and whose head is the audited
# SHA; a green check rollup (or a fresh local gate for that same SHA); a
# `<!-- audit-pr:merge-ready sha=… -->` comment; `merge: fullauto` in the head's
# own `docs/features/SHIP_DECISIONS.md`. What changed is *who is asked*: the forge
# is resolved from the remote through `lib/forge.sh` (`gh`, `glab`, `gt`; a
# Bitbucket remote is refused with the message naming its absent CLI), so the
# wrapper no longer hard-codes GitHub.
#
# The decision file is read from the checkout at the audited SHA (`git show`),
# not from the forge's contents API: the bytes that authorize the merge are then
# the bytes of the commit being merged, and a forge that exposes no contents API
# needs no special case.
#
# The wrapper writes one transient marker under the git common directory and
# removes it on every exit, and posts an idempotent audit comment on the merged
# PR/MR. It never creates a persistent `.automerge` permission.
#
# usage: fullauto-merge.sh --pr <number> --run-id <id>
#                          [--method merge|squash|rebase] [--remote <name>] [--forge <name>]

set -euo pipefail

hook_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
# shellcheck source=lib/temp.sh
. "$hook_dir/lib/temp.sh" || { printf 'fullauto-merge: %s is missing\n' "$hook_dir/lib/temp.sh" >&2; exit 1; }
# shellcheck source=lib/forge.sh
. "$hook_dir/lib/forge.sh" || { printf 'fullauto-merge: %s is missing\n' "$hook_dir/lib/forge.sh" >&2; exit 1; }

pr=""
run_id=""
method="merge"
remote="origin"
forge_override=""

fail() {
  printf 'fullauto-merge: %s\n' "$1" >&2
  exit 1
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --pr) [ "$#" -ge 2 ] || fail "--pr requires a value"; pr=$2; shift 2 ;;
    --run-id) [ "$#" -ge 2 ] || fail "--run-id requires a value"; run_id=$2; shift 2 ;;
    --method) [ "$#" -ge 2 ] || fail "--method requires a value"; method=$2; shift 2 ;;
    --remote) [ "$#" -ge 2 ] || fail "--remote requires a value"; remote=$2; shift 2 ;;
    --forge) [ "$#" -ge 2 ] || fail "--forge requires a value"; forge_override=$2; shift 2 ;;
    *) echo "fullauto-merge: unknown argument: $1" >&2; exit 2 ;;
  esac
done

[ -n "$pr" ] && [ -n "$run_id" ] || fail "--pr and --run-id are required"
printf '%s' "$pr" | grep -Eq '^[0-9]+$' || fail "PR must be numeric"
printf '%s' "$run_id" | grep -Eq '^[A-Za-z0-9._-]+$' || fail "run id is invalid"
case "$method" in merge|squash|rebase) ;; *) fail "method must be merge, squash, or rebase" ;; esac

command -v jq >/dev/null 2>&1 || fail "jq is required"

# The forge is a fact about the remote being merged into.
remote_url=$(git remote get-url "$remote" 2>/dev/null) || fail "the remote \"$remote\" is not a remote of this repository"
forge=$(forge_detect "$remote_url" "$forge_override") || exit 2
forge_cli_bin=$(forge_cli "$forge") || fail "the $forge forge has no CLI carrier"
command -v "$forge_cli_bin" >/dev/null 2>&1 || fail "$forge_cli_bin is not installed, so the $forge forge cannot be asked"

[ -z "$(git status --porcelain)" ] || fail "working tree is not clean"
upstream=$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null) || fail "current branch has no upstream"
git fetch --quiet
sync_counts=$(git rev-list --left-right --count "$upstream...HEAD")
[ "$sync_counts" = $'0\t0' ] || fail "branch is not synchronized with its remote"

pr_json=$(forge_pr_json "$forge" "$pr") || fail "the $forge forge could not answer for PR $pr"
notes=$(forge_pr_notes "$forge" "$pr" "$remote_url") || fail "the $forge forge could not answer for the comments of PR $pr"
pr_json=$(printf '%s' "$pr_json" | jq -c --argjson notes "$notes" '.comments = ((.comments // []) + $notes)')

head_sha=$(printf '%s' "$pr_json" | jq -r '.headRefOid')
remote_base=$(printf '%s' "$pr_json" | jq -r '.baseRefName')
remote_state=$(printf '%s' "$pr_json" | jq -r '.state')
pr_url=$(printf '%s' "$pr_json" | jq -r '.url')
default_base=$(forge_default_base "$forge") || fail "the $forge forge could not name its default branch"
[ -n "$head_sha" ] && [ "$head_sha" != "null" ] || fail "PR head is unavailable"
[ "$remote_base" = "$default_base" ] || fail "PR base is not the forge default branch"

audit_marker="<!-- audit-pr:merge-ready sha=$head_sha -->"
marker="<!-- agentic-workflow:automerge head=$head_sha -->"

comment_file=""
attempt_marker=""
trap 'rm -f "${comment_file:-}"; rm -f "${attempt_marker:-}"' EXIT HUP INT TERM

printf '%s' "$pr_json" | jq -e --arg marker "$audit_marker" \
  '[.comments[]?.body | contains($marker)] | any' >/dev/null \
  || fail "fresh SHA-bound audit MERGE-READY evidence is unavailable"

git rev-parse --verify --quiet "$head_sha^{commit}" >/dev/null || fail "the audited SHA $head_sha is not in this checkout"
decision_text=$(git show "$head_sha:docs/features/SHIP_DECISIONS.md" 2>/dev/null) \
  || fail "the audited SHA has no docs/features/SHIP_DECISIONS.md"
printf '%s' "$decision_text" | grep -Eqi '^merge:[[:space:]]*fullauto[[:space:]]*$' \
  || fail "PR head does not authorize merge: fullauto"

comment_exists() {
  printf '%s' "$1" | jq -e --arg marker "$marker" '[.comments[]?.body | contains($marker)] | any' >/dev/null
}

post_comment() {
  merge_sha=$1
  comment_file=$(aw_mktemp_file agentic-workflow-automerge) || fail "no writable temporary directory (TMPDIR, TEMP, TMP, /tmp)"
  tick='`'
  {
    printf '%s\n' "$marker"
    printf '%s\n' '## agentic-workflow: auto-merged'
    printf '\n- **Mode:** %sthe former ship-roadmap --fullauto (retired, feature 61)%s\n' "$tick" "$tick"
    printf -- '- **Run:** %s%s%s\n' "$tick" "$run_id" "$tick"
    printf -- '- **Forge:** %s%s%s\n' "$tick" "$forge" "$tick"
    printf -- '- **Audited head:** %s%s%s\n' "$tick" "$head_sha" "$tick"
    printf -- '- **Merge commit:** %s%s%s\n' "$tick" "$merge_sha" "$tick"
    printf -- '- **Audit trail:** this comment is the durable automerge log; direct merge commands remained blocked.\n'
  } > "$comment_file"
  forge_comment "$forge" "$pr" "$comment_file" >/dev/null
}

if [ "$remote_state" = "MERGED" ]; then
  if ! comment_exists "$pr_json"; then
    merged_json=$(forge_pr_json "$forge" "$pr")
    post_comment "$(printf '%s' "$merged_json" | jq -r '.mergeCommit.oid // ""')"
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
printf 'run=%s\npr=%s\nhead=%s\nforge=%s\n' "$run_id" "$pr" "$head_sha" "$forge" > "$attempt_marker"

forge_merge "$forge" "$pr" "$method" "$head_sha" || fail "the $forge forge refused the merge"

merged_json=$(forge_pr_json "$forge" "$pr")
[ "$(printf '%s' "$merged_json" | jq -r '.state')" = "MERGED" ] || fail "forge did not report the PR as merged"
# A forge whose CLI cannot pin the head at merge time is verified here instead:
# the merged PR must still be the one that was audited.
[ "$(printf '%s' "$merged_json" | jq -r '.headRefOid')" = "$head_sha" ] || fail "the forge merged a different head than the audited one"
merge_sha=$(printf '%s' "$merged_json" | jq -r '.mergeCommit.oid // ""')
if ! comment_exists "$merged_json"; then
  post_comment "$merge_sha"
fi

printf 'MERGED %s @ %s\n' "$pr_url" "$merge_sha"
