#!/usr/bin/env bash

set -u

command_text=""
file_path=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --command)
      [ "$#" -ge 2 ] || { echo "agentic-workflow guard: --command needs a value" >&2; exit 2; }
      command_text=$2
      shift 2
      ;;
    --path)
      [ "$#" -ge 2 ] || { echo "agentic-workflow guard: --path needs a value" >&2; exit 2; }
      file_path=$2
      shift 2
      ;;
    *)
      echo "agentic-workflow guard: unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

deny() {
  printf 'Blocked by agentic-workflow safety policy: %s\n' "$1" >&2
  exit 2
}

is_env_path() {
  printf '%s\n' "$1" | grep -Eqi '(^|/)(\.env($|\.)|[^/]*\.env($|\.))'
}

if [ -n "$file_path" ] && is_env_path "$file_path"; then
  deny "reading environment files may disclose secrets"
fi

if [ -z "$command_text" ]; then
  exit 0
fi

# Direct merges stay blocked. Automated merges use fullauto-merge.sh, whose
# child process is outside the agent tool boundary and has its own fail-closed
# checks. There is intentionally no persistent allow marker for these patterns.
if printf '%s\n' "$command_text" | grep -Eqi '(^|[;&|()[:space:]])([^;&|()[:space:]]*/)?gh[[:space:]]+pr[[:space:]]+merge([[:space:]]|$)' \
  || printf '%s\n' "$command_text" | grep -Eqi '(^|[;&|()[:space:]])([^;&|()[:space:]]*/)?gh[[:space:]]+(-R|--repo)[[:space:]]+[^;&|()[:space:]]+[[:space:]]+pr[[:space:]]+merge([[:space:]]|$)'; then
  deny "direct pull-request merge; use ship-roadmap --fullauto"
fi
if printf '%s\n' "$command_text" | grep -Eqi '(^|[;&|()[:space:]])glab[[:space:]]+mr[[:space:]]+merge([[:space:]]|$)'; then
  deny "direct merge-request merge; use ship-roadmap --fullauto"
fi
if printf '%s\n' "$command_text" | grep -Eqi '(^|[;&|()[:space:]])([^;&|()[:space:]]*/)?git[[:space:]]+merge([[:space:]]|$)' \
  || printf '%s\n' "$command_text" | grep -Eqi '(^|[;&|()[:space:]])([^;&|()[:space:]]*/)?git[[:space:]]+-C[[:space:]]+[^;&|()[:space:]]+[[:space:]]+merge([[:space:]]|$)'; then
  deny "direct git merge"
fi
if printf '%s\n' "$command_text" | grep -Eqi 'mergePullRequest|/pulls/[0-9]+/merge([?[:space:]]|$)'; then
  deny "merge through a forge API"
fi

# Block disclosure commands, not legitimate assignments such as
# `export NODE_ENV=test` or `env NODE_ENV=test command`.
if printf '%s\n' "$command_text" | grep -Eqi '(^|[;&|()[:space:]])([^;&|()[:space:]]*/)?printenv([[:space:]]|$)' \
  || printf '%s\n' "$command_text" | grep -Eqi '(^|[;&|()[:space:]])([^;&|()[:space:]]*/)?(declare|typeset)[[:space:]]+-x([[:space:]]|$)'; then
  deny "environment-variable disclosure"
fi
if printf '%s\n' "$command_text" | grep -Eqi '(^|[;&|()[:space:]])export([[:space:]]+-p)?[[:space:]]*($|[;&|)])'; then
  deny "environment export listing"
fi
if printf '%s\n' "$command_text" | grep -Eqi '(^|[;&|()[:space:]])([^;&|()[:space:]]*/)?env([[:space:]]+(-0|--null))?[[:space:]]*($|[;&|)])' \
  || printf '%s\n' "$command_text" | grep -Eqi '(^|[;&|()[:space:]])([^;&|()[:space:]]*/)?env([[:space:]]+[A-Za-z_][A-Za-z0-9_]*=[^[:space:]]+)+[[:space:]]*($|[;&|)])' \
  || printf '%s\n' "$command_text" | grep -Eqi '(^|[;&|()[:space:]])([^;&|()[:space:]]*/)?set[[:space:]]*($|[;&|)])'; then
  deny "environment-variable disclosure"
fi

# Shell reads are covered even on platforms that expose only a shell hook.
if printf '%s\n' "$command_text" | grep -Eqi '(^|[;&|()[:space:]])(cat|bat|head|tail|less|more|grep|sed|awk|source|\.)[[:space:]]' \
  && printf '%s\n' "$command_text" | grep -Eqi '(^|/|[^[:alnum:]_])\.env($|[^[:alnum:]_])'; then
  deny "reading environment files may disclose secrets"
fi

exit 0
