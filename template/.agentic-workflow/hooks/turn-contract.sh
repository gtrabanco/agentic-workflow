#!/usr/bin/env bash
# Deterministic verifier for the canonical turn contract's mechanical boxes
# (branch, pre-edit artifacts, commit, pushed pull request, clean tree).
# Needs only bash, git and gh. See the machine-check profile in
# skills/orchestration-envelope/references/TURN_CONTRACT.md.
#
# usage: turn-contract.sh [--finished|--help]
# prints exactly one line: TURN-CONTRACT ok
#                      or: TURN-CONTRACT fail box<N>: <code>

set -u

finished=0

usage() {
  printf 'usage: turn-contract.sh [--finished|--help]\n\n'
  printf '  --finished  also check box4 (pushed branch + open pull request whose head is local HEAD)\n'
  printf '  --help      print this usage and exit 0\n'
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --finished) finished=1; shift ;;
    --help) usage; exit 0 ;;
    *) printf 'turn-contract: unknown argument: %s\n' "$1" >&2; usage >&2; exit 2 ;;
  esac
done

fail() {
  printf 'TURN-CONTRACT fail box%s: %s\n' "$1" "$2"
  exit 1
}

# box1 — inside a git repository, and not on its default branch.
repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || fail 1 not-a-repo

# Default branch chain: origin/HEAD, else local main, else local master.
default_ref=""
origin_head=$(git -C "$repo_root" symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null || true)
if [ -n "$origin_head" ]; then
  default_ref=$origin_head
elif git -C "$repo_root" show-ref --verify --quiet refs/heads/main; then
  default_ref=main
elif git -C "$repo_root" show-ref --verify --quiet refs/heads/master; then
  default_ref=master
fi
default_branch=${default_ref#origin/}

current_branch=$(git -C "$repo_root" branch --show-current 2>/dev/null || true)
if [ -n "$default_branch" ] && [ "$current_branch" = "$default_branch" ]; then
  fail 1 branch-default
fi

# box2 — frozen acceptance present at HEAD for a unit-shaped branch. Presence
# check only: this shim runs no other runtime (the phase-lint clause is
# engine-only).
unit_dir=""
case "$current_branch" in
  feat/*) unit_dir="docs/features/${current_branch#feat/}" ;;
  fix/*) unit_dir="docs/fix/${current_branch#fix/}" ;;
esac
if [ -n "$unit_dir" ] && [ -d "$repo_root/$unit_dir" ]; then
  git -C "$repo_root" cat-file -e "HEAD:$unit_dir/ACCEPTANCE.md" 2>/dev/null || fail 2 acceptance-missing
fi

# box3 — at least one commit on this branch that is not on the default.
if [ -n "$default_ref" ]; then
  own_commits=$(git -C "$repo_root" rev-list --count "$default_ref..HEAD" 2>/dev/null || printf '0')
else
  own_commits=$(git -C "$repo_root" rev-list --count HEAD 2>/dev/null || printf '0')
fi
[ "${own_commits:-0}" -ge 1 ] 2>/dev/null || fail 3 no-commits

# box4 — only with --finished: an upstream and an open PR whose head is HEAD.
if [ "$finished" -eq 1 ]; then
  upstream=$(git -C "$repo_root" rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null || true)
  [ -n "$upstream" ] || fail 4 pr-not-open
  local_head=$(git -C "$repo_root" rev-parse HEAD 2>/dev/null || true)
  pr_json=$(gh pr view "$current_branch" --json state,headRefOid 2>/dev/null) || fail 4 pr-unreachable
  pr_json=$(printf '%s' "$pr_json" | tr -d '\n')
  pr_state=$(printf '%s' "$pr_json" | sed -n 's/.*"state"[[:space:]]*:[[:space:]]*"\([A-Za-z]*\)".*/\1/p')
  pr_head=$(printf '%s' "$pr_json" | sed -n 's/.*"headRefOid"[[:space:]]*:[[:space:]]*"\([0-9a-fA-F]*\)".*/\1/p')
  [ -n "$pr_state" ] || fail 4 pr-not-open
  [ "$pr_state" = "OPEN" ] || fail 4 pr-not-open
  [ "$pr_head" = "$local_head" ] || fail 4 pr-head-mismatch
fi

# box5 — clean tree, then not ahead of the configured upstream. A status
# query that cannot be answered is never proof of a clean tree: it fails
# closed as dirty-tree.
status_out=$(git -C "$repo_root" status --porcelain 2>/dev/null) || fail 5 dirty-tree
if [ -n "$status_out" ]; then
  fail 5 dirty-tree
fi
upstream=$(git -C "$repo_root" rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null || true)
if [ -n "$upstream" ]; then
  ahead=$(git -C "$repo_root" rev-list --count "$upstream..HEAD" 2>/dev/null) || ahead=1
  [ "${ahead:-1}" -eq 0 ] 2>/dev/null || fail 5 ahead-of-remote
fi

printf 'TURN-CONTRACT ok\n'
