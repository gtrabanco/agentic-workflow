#!/usr/bin/env bash
# Deterministic verifier for the canonical turn contract's mechanical boxes
# (branch, pre-edit artifacts, commit, pushed pull request, clean tree).
# Needs bash, git and the forge's own CLI — `gh`, `glab` or `gt`, resolved from
# the remote by `lib/forge.sh` (issue #546). See the machine-check profile in
# skills/orchestration-envelope/references/TURN_CONTRACT.md.
#
# usage: turn-contract.sh [--finished|--remote <name>|--forge <name>|--help]
# prints exactly one line: TURN-CONTRACT ok
#                      or: TURN-CONTRACT fail box<N>: <code>

set -u

hook_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
# shellcheck source=lib/forge.sh
. "$hook_dir/lib/forge.sh" || { printf 'turn-contract: %s/lib/forge.sh is missing\n' "$hook_dir" >&2; exit 2; }

finished=0
# The remote box4 asks about, and the forge to assume instead of detecting one.
remote=origin
forge_override=""

usage() {
  printf 'usage: turn-contract.sh [--finished|--remote <name>|--forge <name>|--help]\n\n'
  printf '  --finished    also check box4 (pushed branch + open pull request whose head is local HEAD)\n'
  printf '  --remote <n>  the remote box4 asks the forge about (default origin)\n'
  printf '  --forge <n>   force the forge instead of detecting it (github, gitlab, gitea, bitbucket)\n'
  printf '  --help        print this usage and exit 0\n'
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --finished) finished=1; shift ;;
    --remote)
      [ "$#" -ge 2 ] || { printf 'turn-contract: --remote needs a value\n' >&2; usage >&2; exit 2; }
      remote=$2
      shift 2
      ;;
    --forge)
      [ "$#" -ge 2 ] || { printf 'turn-contract: --forge needs a value\n' >&2; usage >&2; exit 2; }
      forge_override=$2
      shift 2
      ;;
    --help) usage; exit 0 ;;
    *) printf 'turn-contract: unknown argument: %s\n' "$1" >&2; usage >&2; exit 2 ;;
  esac
done

# The forge is a fact about the remote, so the host decides it — and a host that
# says nothing is refused rather than guessed.
forge_of_remote() {
  url=$(git -C "$repo_root" remote get-url "$remote" 2>/dev/null) || return 1
  forge_detect "$url" "$forge_override" || return 2
}

fail() {
  printf 'TURN-CONTRACT fail box%s: %s\n' "$1" "$2"
  exit 1
}

# box1 — inside a git repository, and not on its default branch.
repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || fail 1 not-a-repo

# Default branch chain: the *checked* remote's HEAD, else local main, else local
# master. The remote is a parameter, never a literal: a fork's own default branch
# is not origin's (issue #546).
default_ref=""
remote_head=$(git -C "$repo_root" symbolic-ref --quiet --short "refs/remotes/$remote/HEAD" 2>/dev/null || true)
if [ -n "$remote_head" ]; then
  default_ref=$remote_head
elif git -C "$repo_root" show-ref --verify --quiet refs/heads/main; then
  default_ref=main
elif git -C "$repo_root" show-ref --verify --quiet refs/heads/master; then
  default_ref=master
fi
default_branch=${default_ref#"$remote"/}

current_branch=$(git -C "$repo_root" branch --show-current 2>/dev/null || true)
if [ -n "$default_branch" ] && [ "$current_branch" = "$default_branch" ]; then
  fail 1 branch-default
fi

# box2 — unit doc present at HEAD for a unit-shaped branch. In the adaptive
# lane model, the unit doc (SPEC.md) carries the Evidence and Progress sections
# presence at HEAD is the frozen surface. A pre-feature 61 project kept its
# frozen acceptance in a sibling ACCEPTANCE.md instead; that shape is legacy and
# is never produced by this hook, only tolerated by the readers below.
unit_dir=""
case "$current_branch" in
  feat/*) unit_dir="docs/features/${current_branch#feat/}" ;;
  fix/*) unit_dir="docs/fix/${current_branch#fix/}" ;;
esac
if [ -n "$unit_dir" ] && [ -d "$repo_root/$unit_dir" ]; then
  git -C "$repo_root" cat-file -e "HEAD:$unit_dir/SPEC.md" 2>/dev/null || fail 2 unit-doc-missing
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
  # The forge is decided once, from the checked remote, and an invalid --forge is
  # a usage error rather than a verdict about the push (issue #546).
  forge=$(forge_of_remote)
  case "$?" in
    0) ;;
    2) exit 2 ;;
    *) fail 4 pr-unreachable ;;
  esac
  # This branch's own pull requests, scoped by the branch name: a forge that
  # reads an all-numeric argument as a PR *number* would judge an unrelated PR
  # (F11, fold cycle 3). The list query also answers "is there a PR at all?" with
  # an empty result, which is what separates a missing PR (pr-not-open) from an
  # unaskable forge (pr-unreachable) — a view query exits nonzero for both
  # (F9, fold cycle 3).
  pr_line=$(forge_pr_line "$forge" "$current_branch")
  case "$?" in
    0) ;;
    4) fail 4 pr-unreachable ;;
    *) fail 4 pr-unreachable ;;
  esac
  [ -n "$pr_line" ] || fail 4 pr-not-open
  pr_state=${pr_line% *}
  pr_head=${pr_line#* }
  case "$(printf '%s' "$pr_state" | tr '[:upper:]' '[:lower:]')" in
    open | opened | draft) ;;
    *) fail 4 pr-not-open ;;
  esac
  [ "$pr_head" = "$local_head" ] || fail 4 pr-head-mismatch
fi

# box5 — clean tree, then not ahead of the configured upstream. A status
# query that cannot be answered is never proof of a clean tree: it fails
# closed as dirty-tree. The listing is read to its first byte only — any output
# at all means "dirty", so a huge listing (generated-tree scale) is never
# buffered (F6, fold cycle 2). `${PIPESTATUS[@]}` must be cloned as the VERY
# NEXT command: any command in between resets it, git's own status is lost, and
# the shim would print a fake ok on an unanswerable query. `--untracked-files=all`
# overrides a repo-local status.showUntrackedFiles=no, which would otherwise
# hide an untracked file (F8, fold cycle 3), and `--no-optional-locks` keeps
# this read from refreshing (rewriting) .git/index (F10, fold cycle 3).
git --no-optional-locks -C "$repo_root" status --porcelain --untracked-files=all 2>/dev/null | { IFS= read -r -n 1; }
status_ps=("${PIPESTATUS[@]}")
[ "${status_ps[0]}" -eq 0 ] || fail 5 dirty-tree
[ "${status_ps[1]}" -ne 0 ] || fail 5 dirty-tree
upstream=$(git -C "$repo_root" rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null || true)
if [ -n "$upstream" ]; then
  ahead=$(git -C "$repo_root" rev-list --count "$upstream..HEAD" 2>/dev/null) || ahead=1
  [ "${ahead:-1}" -eq 0 ] 2>/dev/null || fail 5 ahead-of-remote
fi

printf 'TURN-CONTRACT ok\n'
