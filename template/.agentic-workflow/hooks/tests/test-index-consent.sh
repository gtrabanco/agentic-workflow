#!/usr/bin/env bash
# AC22 consent gate (unit 65, F41 — closes F32): the retrieval index scaffold
# and git hooks are installed only after an explicit yes. The gate lives in
# init-workspace's ask-first contract; this test pins its mechanical surface:
# the declared ask question, the no-consent residual behavior, and a hook
# script that never installs itself (consent is init-workspace's job, never
# the hook's).

set -euo pipefail

test_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
repo_root=$(CDPATH='' cd -- "$test_dir/../../../.." && pwd)
skill="$repo_root/skills/init-workspace/SKILL.md"
hook="$repo_root/template/.agentic-workflow/hooks/index-sync.sh"

[ -f "$skill" ]
[ -f "$hook" ]

# the declared consent contract (AC22 wording, fixed by the SPEC's AC text;
# line-wrapped fragments are matched with regex dots standing for backticks)
grep -qF "consent-gated (AC22)" "$skill"
grep -qE 'to the question "install the doc retrieval index scaffold and' "$skill"
grep -qE 'its git hooks\?". Without consent: install nothing, record it as a residual' "$skill"
grep -qE 'never write .\.git/hooks/. or the config' "$skill"

# the freshness hook never installs itself or writes outside its own run —
# a self-installing hook would bypass the consent gate entirely
if grep -qE '(^|[;|])cp [^|]*\.git/hooks|mkdir[^|]*\.git/hooks|>[[:space:]]*\.git/hooks/' "$hook"; then
  echo "FAIL: index-sync.sh contains a self-install path — the consent gate is bypassable" >&2
  exit 1
fi

printf 'PASS index consent gate: AC22 ask-first contract declared; the hook never self-installs\n'
