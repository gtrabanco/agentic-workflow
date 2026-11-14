#!/usr/bin/env bash

set -u

test_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
guard=$(CDPATH='' cd -- "$test_dir/.." && pwd)/guard-command.sh
failures=0

expect_allow() {
  label=$1
  shift
  if ! "$guard" "$@" >/dev/null 2>&1; then
    printf 'FAIL allow: %s\n' "$label" >&2
    failures=$((failures + 1))
  fi
}

expect_block() {
  label=$1
  shift
  if "$guard" "$@" >/dev/null 2>&1; then
    printf 'FAIL block: %s\n' "$label" >&2
    failures=$((failures + 1))
  fi
}

expect_allow "export assignment" --command "export NODE_ENV=test"
expect_allow "export existing name" --command "export NODE_ENV"
expect_allow "env-prefixed command" --command "env NODE_ENV=test npm test"
expect_allow "export word in filename" --command "node scripts/export-report.mjs"
expect_allow "merge-base is not merge" --command "git merge-base main HEAD"
expect_allow "fullauto wrapper" --command "bash .agentic-workflow/hooks/fullauto-merge.sh --pr 12"
expect_allow "variable-indirection merge (documented boundary)" --command 'cmd=gh; $cmd pr merge 12'

expect_block "export listing" --command "export"
expect_block "export -p" --command "export -p"
expect_block "env listing" --command "env"
expect_block "absolute env listing" --command "/usr/bin/env"
expect_block "env assignment-only listing" --command "env NODE_ENV=test"
expect_block "printenv name" --command "printenv API_KEY"
expect_block "absolute printenv name" --command "/usr/bin/printenv API_KEY"
expect_block "declare exports" --command "declare -x"
expect_block "direct PR merge" --command "gh pr merge 12 --squash"
expect_block "bash-wrapped PR merge" --command "bash -c 'gh pr merge 12 --squash'"
expect_block "python-wrapped PR merge" --command "python -c 'os.system(\"gh pr merge 12\")'"
expect_block "shell-wrapped git merge" --command "sh -c 'git merge feature'"
expect_block "absolute PR merge" --command "/usr/bin/gh pr merge 12 --squash"
expect_block "repo-option PR merge" --command "gh --repo acme/app pr merge 12"
expect_block "attached repo-option PR merge" --command "gh --repo=acme/app pr merge 12"
expect_block "attached short repo-option PR merge" --command "gh -Racme/app pr merge 12"
expect_block "direct MR merge" --command "glab mr merge 12"
expect_block "repo-option MR merge" --command "glab -R acme/app mr merge 12"
expect_block "attached repo-option MR merge" --command "glab -Racme/app mr merge 12"
expect_block "direct git merge" --command "git merge feature"
expect_block "git -C merge" --command "git -C /tmp/repo merge feature"
expect_block "attached git -C merge" --command "git -C/tmp/repo merge feature"
expect_block "REST merge" --command "gh api -X PUT repos/acme/app/pulls/12/merge"
expect_block "GraphQL merge" --command "gh api graphql -f query='mutation { mergePullRequest }'"
expect_block "shell env read" --command "cat .env"
expect_block "grep env read" --command "grep API_KEY .env"
expect_block "sed env read" --command "sed -n 1p .env"
expect_block "awk env read" --command "awk 1 .env"
expect_block "quoted env read" --command "cat '.env'"
expect_block "nested env read" --command "head -1 config/.env.production"
expect_block "copy env read" --command "cp .env /tmp/env.backup"
expect_block "python env read" --command "python -c 'open(\".env\").read()'"
expect_block "read-tool env path" --path "/srv/app/.env.local"

# Issue #546 — the forge merge surface the guard claimed to cover, and the
# per-project allowlist. Every row here is a merge the old regexes let through.
expect_block "gitea direct PR merge" --command "gt pr merge 12"
expect_block "gitea repo-option PR merge" --command "gt -R acme/app pr merge 12"
expect_block "gitea squash PR merge" --command "gt pr merge 12 --method squash"
expect_block "hub merge" --command "hub merge https://github.com/acme/app/pull/12"
expect_block "hub API merge" --command "hub api -X PUT repos/acme/app/pulls/12/merge"
expect_block "GitLab API MR merge" --command "glab api -X PUT projects/acme%2Fapp/merge_requests/12/merge"
expect_block "GitLab REST MR merge" --command "curl -X PUT https://gitlab.com/api/v4/projects/1/merge_requests/12/merge"
expect_block "Gitea API merge" --command "curl -X POST https://gitea.com/api/v1/repos/acme/app/pulls/12/merge"
expect_block "Bitbucket API merge" --command "curl -X POST https://api.bitbucket.org/2.0/repositories/acme/app/pullrequests/12/merge"
expect_block "tea PR merge" --command "tea pr merge --repo acme/app 12"

# The allowlist: one whole command line per entry, project-local, fail-closed.
allow_tmp=$(mktemp -d)
trap 'rm -rf "$allow_tmp"' EXIT
mkdir -p "$allow_tmp/hooks"
cp "$guard" "$allow_tmp/hooks/guard-command.sh"
allow_guard="$allow_tmp/hooks/guard-command.sh"

# no allowlist at all: blocked, as above
if "$allow_guard" --command "gh pr merge 12 --squash" >/dev/null 2>&1; then
  printf 'FAIL block: merge without an allowlist\n' >&2
  failures=$((failures + 1))
fi

# comments and blank lines are never entries
printf '# a per-project merge the owner approved\n\n' > "$allow_tmp/hooks/guard-allow.txt"
if "$allow_guard" --command "gh pr merge 12 --squash" >/dev/null 2>&1; then
  printf 'FAIL block: comments and blank lines are not entries\n' >&2
  failures=$((failures + 1))
fi
if "$allow_guard" --command "" >/dev/null 2>&1; then :; else
  printf 'FAIL allow: an empty command is inert\n' >&2
  failures=$((failures + 1))
fi

# the exact approved line passes; nothing else does
printf 'gh pr merge 12 --squash\n' > "$allow_tmp/hooks/guard-allow.txt"
if ! "$allow_guard" --command "gh pr merge 12 --squash" >/dev/null 2>&1; then
  printf 'FAIL allow: an allowlisted merge line\n' >&2
  failures=$((failures + 1))
fi
if "$allow_guard" --command "gh pr merge 13 --squash" >/dev/null 2>&1; then
  printf 'FAIL block: a different PR is not the allowlisted line\n' >&2
  failures=$((failures + 1))
fi
if "$allow_guard" --command "gh pr merge 12 --squash && cat .env" >/dev/null 2>&1; then
  printf 'FAIL block: an allowlisted line never smuggles a second command\n' >&2
  failures=$((failures + 1))
fi
if "$allow_guard" --command "cat .env" >/dev/null 2>&1; then
  printf 'FAIL block: the allowlist never widens the env rules\n' >&2
  failures=$((failures + 1))
fi

if command -v jq >/dev/null 2>&1; then
  adapter=$(CDPATH='' cd -- "$test_dir/../adapters" && pwd)/pre-tool-guard.sh
  copilot=$(CDPATH='' cd -- "$test_dir/../adapters" && pwd)/copilot-guard.sh
  if printf '%s' '{"tool_input":{"command":"gh pr merge 12"}}' | "$adapter" >/dev/null 2>&1; then
    printf 'FAIL block: normalized Claude/Cursor adapter\n' >&2
    failures=$((failures + 1))
  fi
  copilot_output=$(printf '%s' '{"tool_input":{"file_path":".env"}}' | "$copilot")
  printf '%s' "$copilot_output" | jq -e '.continue == false and (.stopReason | contains("Blocked"))' >/dev/null || {
    printf 'FAIL block: Copilot adapter\n' >&2
    failures=$((failures + 1))
  }
  if printf '%s' '{not-json' | "$adapter" >/dev/null 2>&1; then
    printf 'FAIL block: malformed Claude/Cursor payload\n' >&2
    failures=$((failures + 1))
  fi
  if printf '%s' '{}' | "$adapter" >/dev/null 2>&1; then
    printf 'FAIL block: unrecognized Claude/Cursor payload\n' >&2
    failures=$((failures + 1))
  fi
  newline_payload='{"tool_input":{"command":"echo safe\ngh pr merge 12"}}'
  if printf '%s' "$newline_payload" | "$adapter" >/dev/null 2>&1; then
    printf 'FAIL block: newline merge payload\n' >&2
    failures=$((failures + 1))
  fi
  copilot_output=$(printf '%s' '{not-json' | "$copilot")
  printf '%s' "$copilot_output" | jq -e '.continue == false and (.stopReason | contains("invalid hook payload"))' >/dev/null || {
    printf 'FAIL block: malformed Copilot payload\n' >&2
    failures=$((failures + 1))
  }
fi

[ "$failures" -eq 0 ] || exit 1
printf 'PASS command guard: 9 allowed, 37 blocked, adapters normalized\n'
