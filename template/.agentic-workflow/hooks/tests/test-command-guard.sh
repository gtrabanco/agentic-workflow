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
printf 'PASS command guard: 6 allowed, 27 blocked, adapters normalized\n'
