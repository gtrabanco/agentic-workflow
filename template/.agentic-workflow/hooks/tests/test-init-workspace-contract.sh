#!/usr/bin/env bash

set -euo pipefail

test_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
repo_root=$(CDPATH='' cd -- "$test_dir/../../../.." && pwd)
template_dir="$repo_root/template"
fixture=$(mktemp -d "${TMPDIR:-/tmp}/agentic-workflow-init.XXXXXX")
trap 'rm -rf "$fixture"' EXIT HUP INT TERM

expected_files=(
  ".agentic-workflow/hooks/guard-command.sh"
  ".agentic-workflow/hooks/fullauto-merge.sh"
  ".agentic-workflow/hooks/adapters/pre-tool-guard.sh"
  ".agentic-workflow/hooks/adapters/copilot-guard.sh"
  ".agentic-workflow/hooks/adapters/normalize-hook-payload.sh"
  ".claude/settings.json.example"
  ".cursor/hooks.json.example"
  ".github/hooks/agentic-workflow.json.example"
  ".opencode/plugins/agentic-workflow-guard.ts.example"
)

for path in "${expected_files[@]}"; do
  [ -f "$template_dir/$path" ]
done

project="$fixture/project"
mkdir -p "$project/.agentic-workflow/hooks/adapters" "$project/.claude" "$project/.cursor" "$project/.github/hooks" "$project/.opencode/plugins"

cp "$template_dir/.agentic-workflow/hooks/guard-command.sh" "$project/.agentic-workflow/hooks/guard-command.sh"
cp "$template_dir/.agentic-workflow/hooks/fullauto-merge.sh" "$project/.agentic-workflow/hooks/fullauto-merge.sh"
cp "$template_dir/.agentic-workflow/hooks/adapters/pre-tool-guard.sh" "$project/.agentic-workflow/hooks/adapters/pre-tool-guard.sh"
cp "$template_dir/.agentic-workflow/hooks/adapters/copilot-guard.sh" "$project/.agentic-workflow/hooks/adapters/copilot-guard.sh"
cp "$template_dir/.agentic-workflow/hooks/adapters/normalize-hook-payload.sh" "$project/.agentic-workflow/hooks/adapters/normalize-hook-payload.sh"
cp "$template_dir/.cursor/hooks.json.example" "$project/.cursor/hooks.json.example"
cp "$template_dir/.github/hooks/agentic-workflow.json.example" "$project/.github/hooks/agentic-workflow.json.example"
cp "$template_dir/.opencode/plugins/agentic-workflow-guard.ts.example" "$project/.opencode/plugins/agentic-workflow-guard.ts.example"

printf 'customized hook configuration\n' > "$project/.claude/settings.json"
copy_if_missing() {
  [ -e "$2" ] || cp "$1" "$2"
}
copy_if_missing "$template_dir/.claude/settings.json.example" "$project/.claude/settings.json"

grep -q "customized hook configuration" "$project/.claude/settings.json"
[ -f "$project/.agentic-workflow/hooks/guard-command.sh" ]
[ -f "$project/.agentic-workflow/hooks/adapters/copilot-guard.sh" ]
grep -q "Agent safety hooks" "$repo_root/skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md"
grep -q "existing customized hook file becomes a residual" "$repo_root/skills/init-workspace/references/BOOTSTRAP_WRITE.md"
grep -q "residual reporting" "$repo_root/skills/init-workspace/SKILL.md"
bash "$test_dir/test-opencode-guard.sh"

printf 'PASS init-workspace contract: scratch install, inventory, additive preservation, residual reporting\n'
