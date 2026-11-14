#!/usr/bin/env bash
#
# forge.sh — the one place a hook names a forge (issue #546 S4/S5). Sourced:
#
#   hook_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
#   . "$hook_dir/lib/forge.sh" || exit 1
#   forge=$(forge_detect "$(git remote get-url origin)")
#
# A guard that needs to know whether a branch has an open pull request has to ask
# *some* forge, and every forge speaks its own CLI. Naming one of them inline is
# how these guards became GitHub-only; naming all of them everywhere is how they
# stay readable. So the names live here, once, and the callers ask this file.
#
# | forge      | CLI      | why                                                       |
# |------------|----------|-----------------------------------------------------------|
# | github     | `gh`     | official CLI                                              |
# | gitlab     | `glab`   | official CLI                                              |
# | gitea      | `gt`     | official CLI since 1.0; the older `tea` is archived        |
# | bitbucket  | none     | Atlassian ships no pull-request CLI — refused, never guessed |
# | default    | `gh`     | a filesystem remote has no forge to detect                |
#
# `unknown` is the answer for a host that says nothing (`git.example.com`), and
# the caller refuses rather than guessing: `AGENTIC_WORKFLOW_FORGE` or `--forge`
# is the documented way to name a self-hosted instance.
#
# Every function is read-only apart from the CLI calls the caller asked for; the
# normalizers print JSON on stdout and a diagnostic on stderr.

# forge_detect <remote-url> [override] — github|gitlab|gitea|bitbucket|default|unknown
forge_detect() {
  url=${1:-}
  override=${2:-${AGENTIC_WORKFLOW_FORGE:-}}
  if [ -n "$override" ]; then
    case "$override" in
      github | gitlab | gitea | bitbucket) printf '%s\n' "$override" ;;
      *)
        printf 'agentic-workflow: forge "%s" is not one of github, gitlab, gitea, bitbucket\n' "$override" >&2
        return 2
        ;;
    esac
    return 0
  fi
  # A filesystem remote names no forge; the project's default CLI answers.
  case "$url" in
    "" | /* | ./* | ../* | file://*) printf 'default\n'; return 0 ;;
  esac
  case "$url" in
    *github.com*) printf 'github\n' ;;
    *gitlab*) printf 'gitlab\n' ;;
    *gitea*) printf 'gitea\n' ;;
    *bitbucket*) printf 'bitbucket\n' ;;
    *://*) printf 'unknown\n' ;;
    *) printf 'default\n' ;;
  esac
}

# forge_cli <forge> — the binary, or a diagnostic naming why there is none.
forge_cli() {
  case "${1:-}" in
    github | default) printf 'gh\n' ;;
    gitlab) printf 'glab\n' ;;
    gitea) printf 'gt\n' ;;
    bitbucket)
      printf 'agentic-workflow: bitbucket has no official pull-request CLI, so this guard cannot ask it; use the REST API (https://api.bitbucket.org/2.0/repositories/<workspace>/<repo>/pullrequests/<n>/merge) or name a wrapper with --forge\n' >&2
      return 1
      ;;
    *)
      printf 'agentic-workflow: forge "%s" has no CLI mapping; name it with --forge or AGENTIC_WORKFLOW_FORGE\n' "${1:-}" >&2
      return 1
      ;;
  esac
}

# forge_require <forge> — the binary, once it is installed.
forge_require() {
  local cli
  cli=$(forge_cli "${1:-}") || return 1
  if ! command -v "$cli" >/dev/null 2>&1; then
    printf 'agentic-workflow: %s is not installed, so the %s forge cannot be asked\n' "$cli" "${1:-}" >&2
    return 1
  fi
  printf '%s\n' "$cli"
}

# forge_project_path <remote-url> — `owner/repo`, or the leaf of a filesystem remote.
forge_project_path() {
  local path=${1:-}
  case "$path" in
    /*)
      path=${path##*/}
      printf '%s\n' "${path%.git}"
      return 0
      ;;
    *://*)
      path=${path#*://}
      path=${path#*/}
      ;;
    *@*:*)
      path=${path#*@}
      path=${path#*:}
      ;;
  esac
  path=${path#/}
  path=${path%.git}
  path=${path%/}
  printf '%s\n' "$path"
}

# forge_pr_json <forge> <pr> — one GitHub-shaped document, so the callers read
# one shape: number, url, state, baseRefName, headRefOid, mergeable,
# statusCheckRollup, comments.
forge_pr_json() {
  local forge=${1:-} pr=${2:-} cli
  cli=$(forge_require "$forge") || return 1
  case "$forge" in
    github | default)
      "$cli" pr view "$pr" --json number,url,state,baseRefName,headRefOid,mergeable,statusCheckRollup,comments,headRepository,headRefName
      ;;
    gitlab)
      "$cli" mr view "$pr" -F json | jq -c '{
        number: .iid,
        url: .web_url,
        state: (if (((.state // "") | ascii_downcase) | IN("opened", "locked", "reopened")) then "OPEN" else ((.state // "") | ascii_upcase) end),
        baseRefName: .target_branch,
        headRefOid: .sha,
        mergeable: (if .merge_status == "can_be_merged" then "MERGEABLE" else "CONFLICTING" end),
        statusCheckRollup: (if ((.head_pipeline.status // "") | ascii_downcase) == "success" then [{conclusion: "SUCCESS"}] else [{conclusion: ((.head_pipeline.status // "pending") | ascii_upcase)}] end),
        comments: []
      }'
      ;;
    gitea)
      "$cli" pr view "$pr" --json number,url,state,base,head_sha,mergeable,comments,draft,merged | jq -c '{
        number: .number,
        url: .url,
        state: (if (.merged // false) then "MERGED" else ((.state // "") | ascii_upcase) end),
        baseRefName: .base,
        headRefOid: .head_sha,
        mergeable: (if .mergeable then "MERGEABLE" else "CONFLICTING" end),
        statusCheckRollup: [],
        comments: (.comments // [])
      }'
      ;;
    *)
      printf 'agentic-workflow: forge "%s" has no pull-request reader\n' "$forge" >&2
      return 1
      ;;
  esac
}

# forge_pr_notes <forge> <pr> <remote-url> — the comment bodies as `[{body}]`.
# GitHub and Gitea carry them in the pull-request document; GitLab needs its own
# call, which is why this is a separate function instead of a field.
forge_pr_notes() {
  local forge=${1:-} pr=${2:-} url=${3:-} cli project encoded
  case "$forge" in
    github | default | gitea)
      printf '[]\n'
      ;;
    gitlab)
      cli=$(forge_require gitlab) || return 1
      project=$(forge_project_path "$url")
      encoded=$(printf '%s' "$project" | sed 's|/|%2F|g')
      "$cli" api "projects/$encoded/merge_requests/$pr/notes?per_page=100" | jq -c '[.[] | {body: .body}]'
      ;;
    *)
      printf 'agentic-workflow: forge "%s" has no note reader\n' "$forge" >&2
      return 1
      ;;
  esac
}

# forge_pr_line <forge> <branch> — `<STATE> <HEAD>` for the branch's open pull
# request, empty when there is none, and exit 4 when the forge could not be
# asked (no CLI, an auth failure, a network refusal). The caller must treat 4 as
# "unverifiable", never as "no pull request". No `jq` binary is needed: each CLI
# filters its own JSON with its own `--jq`.
forge_pr_line() {
  local forge=${1:-} branch=${2:-} cli json state head line
  cli=$(forge_require "$forge") || return 4
  case "$forge" in
    github | default)
      json=$("$cli" pr list --head "$branch" --state open --json state,headRefOid 2>/dev/null) || return 4
      json=$(printf '%s' "$json" | tr -d '\n')
      state=$(printf '%s' "$json" | sed -n 's/.*"state"[[:space:]]*:[[:space:]]*"\([A-Za-z]*\)".*/\1/p')
      head=$(printf '%s' "$json" | sed -n 's/.*"headRefOid"[[:space:]]*:[[:space:]]*"\([0-9a-fA-F]*\)".*/\1/p')
      [ -n "$state" ] || return 0
      printf '%s %s\n' "$state" "$head"
      ;;
    gitlab)
      line=$("$cli" mr list --source-branch "$branch" -F json --jq '.[] | "\(.state) \(.sha)"' 2>/dev/null) || return 4
      printf '%s\n' "$line" | sed -n '1p'
      ;;
    gitea)
      line=$("$cli" pr list --head "$branch" --json state,head_sha --jq '.[] | "\(.state) \(.head_sha)"' 2>/dev/null) || return 4
      printf '%s\n' "$line" | sed -n '1p'
      ;;
    *)
      printf 'agentic-workflow: forge "%s" has no pull-request reader\n' "$forge" >&2
      return 4
      ;;
  esac
}

# forge_default_base <forge> — the branch a merge must target.
forge_default_base() {
  local forge=${1:-} cli
  cli=$(forge_require "$forge") || return 1
  case "$forge" in
    github | default) "$cli" repo view --json defaultBranchRef | jq -r '.defaultBranchRef.name' ;;
    gitlab) "$cli" repo view -F json | jq -r '.default_branch' ;;
    gitea) "$cli" repo view --json default_branch | jq -r '.default_branch' ;;
    *)
      printf 'agentic-workflow: forge "%s" has no repository reader\n' "$forge" >&2
      return 1
      ;;
  esac
}

# forge_merge <forge> <pr> <method> <head-sha> — merge, pinned to the audited SHA
# wherever the CLI can express the pin (`gh --match-head-commit`,
# `glab --sha`). `gt` has no such flag: the caller re-reads the head after the
# merge, and the pre-merge compare is what stands between them.
forge_merge() {
  local forge=${1:-} pr=${2:-} method=${3:-merge} head=${4:-} cli weight
  cli=$(forge_require "$forge") || return 1
  case "$forge" in
    github | default) "$cli" pr merge "$pr" "--$method" --match-head-commit "$head" ;;
    gitlab)
      weight=""
      case "$method" in
        squash) weight="--squash" ;;
        rebase) weight="--rebase" ;;
      esac
      # shellcheck disable=SC2086
      "$cli" mr merge "$pr" --sha "$head" $weight -y
      ;;
    gitea) "$cli" pr merge "$pr" --method "$method" -y ;;
    *)
      printf 'agentic-workflow: forge "%s" has no merge carrier\n' "$forge" >&2
      return 1
      ;;
  esac
}
