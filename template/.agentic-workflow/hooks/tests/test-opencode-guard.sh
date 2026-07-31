#!/usr/bin/env bash

set -euo pipefail

command -v bun >/dev/null 2>&1 || {
  printf 'SKIP OpenCode guard: bun is unavailable\n'
  exit 0
}

test_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
repo_root=$(CDPATH='' cd -- "$test_dir/../../../.." && pwd)
fixture=$(mktemp -d "${TMPDIR:-/tmp}/agentic-workflow-opencode.XXXXXX")
trap 'rm -rf "$fixture"' EXIT HUP INT TERM

mkdir -p "$fixture/.agentic-workflow/hooks"
cp "$repo_root/template/.agentic-workflow/hooks/guard-command.sh" "$fixture/.agentic-workflow/hooks/guard-command.sh"
plugin="$fixture/agentic-workflow-guard.ts"
cp "$repo_root/template/.opencode/plugins/agentic-workflow-guard.ts.example" "$plugin"

OPENCODE_PLUGIN="$plugin" OPENCODE_FIXTURE="$fixture" bun -e '
  import { pathToFileURL } from "node:url";
  const plugin = await import(pathToFileURL(process.env.OPENCODE_PLUGIN).href);
  const hooks = await plugin.AgenticWorkflowGuard({ worktree: process.env.OPENCODE_FIXTURE });
  const before = hooks["tool.execute.before"];
  const input = { tool: "bash" };
  const blocked = async (command) => {
    try {
      await before(input, { args: { command } });
      return false;
    } catch {
      return true;
    }
  };
  if (!await blocked("gh pr merge 12")) process.exit(1);
  if (!await blocked("cat .env")) process.exit(1);
  await before(input, { args: { command: "printf safe" } });
'

printf 'PASS OpenCode guard: allow and block paths exercised\n'
