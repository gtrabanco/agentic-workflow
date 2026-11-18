#!/usr/bin/env bash
# Hook suite for the shim shape (unit 554).
#
# Every template hook resolves the agentic-workflow CLI, execs it and forwards the
# exit code — and carries no decision of its own. That is the whole contract of
# this unit, so it is pinned mechanically: the shape, the argv forwarding, the
# zero-logic rule and the per-capability degradation (a safety hook whose CLI is
# absent refuses; the index-refresh hook stays a silent no-op by its own contract).
#
# Run: bash template/.agentic-workflow/hooks/tests/test-hook-shims.sh

set -uo pipefail

test_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
hooks_dir=$(CDPATH='' cd -- "$test_dir/.." && pwd)
failures=0
cases=0

pass() { printf 'ok %d — %s\n' "$cases" "$1"; }
fail() { printf 'not ok %d — %s\n' "$cases" "$1"; failures=$((failures + 1)); }

scratch=$(mktemp -d "${TMPDIR:-/tmp}/aw-shims.XXXXXX")
trap 'rm -rf "$scratch"' EXIT HUP INT TERM

# The shims this unit converted. `index-sync.sh` and `secret-scan.sh` are shims
# too, but they predate the unit and answer their own contracts.
shims="turn-contract.sh guard-command.sh git-identity-check.sh fullauto-merge.sh adapters/pre-tool-guard.sh adapters/copilot-guard.sh adapters/normalize-hook-payload.sh"

# A CLI stub: records its argv, prints a marker, exits with $STUB_EXIT.
mkdir -p "$scratch/bin"
cat > "$scratch/bin/agentic-workflow" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >>"$STUB_ARGV"
printf 'STUB-RAN\n'
exit "${STUB_EXIT:-0}"
STUB
chmod +x "$scratch/bin/agentic-workflow"

# ── 1. the shape: resolve, exec, forward ──────────────────────────────────
for shim in $shims; do
  cases=$((cases + 1))
  file="$hooks_dir/$shim"
  ok=1
  grep -q 'AGENTIC_WORKFLOW_BIN' "$file" || ok=0
  grep -q 'command -v agentic-workflow' "$file" || ok=0
  grep -q 'exec "\$bin"' "$file" || ok=0
  if [ "$ok" -eq 1 ]; then
    pass "$shim is a shim (resolve + exec)"
  else
    fail "$shim is a shim (resolve + exec)"
  fi
done

# ── 2. no decision logic survives in a hook file ──────────────────────────
cases=$((cases + 1))
offenders=$(grep -l -E 'jq -|grep -E|mktemp |\$\{TMPDIR|forge_detect|aw_tmpdir|origin/HEAD' \
  "$hooks_dir"/*.sh "$hooks_dir"/adapters/*.sh 2>/dev/null)
if [ -z "$offenders" ]; then
  pass "no hook file carries a rule (no jq, no grep -E, no temp fallback, no forge adapter)"
else
  fail "no hook file carries a rule (${offenders})"
fi

# ── 3. argv is forwarded to the CLI, and the exit code with it ───────────
export STUB_ARGV="$scratch/argv"
export AGENTIC_WORKFLOW_BIN="$scratch/bin/agentic-workflow"

check_forward() {
  local description=$1 shim=$2 expected=$3
  shift 3
  cases=$((cases + 1))
  : >"$STUB_ARGV"
  "$hooks_dir/$shim" "$@" >"$scratch/out" 2>&1
  local status=$?
  local recorded
  recorded=$(cat "$STUB_ARGV")
  if [ "$status" -eq "${STUB_EXIT:-0}" ] && [ "$recorded" = "$expected" ]; then
    pass "$description"
  else
    fail "$description (exit $status, argv [$recorded], want [$expected])"
  fi
}

check_forward "turn-contract forwards its flags" turn-contract.sh "turn-contract --finished --remote fork" --finished --remote fork
check_forward "git-identity-check forwards its flags" git-identity-check.sh "git-identity-check --root /tmp" --root /tmp
check_forward "fullauto-merge forwards its flags" fullauto-merge.sh "fullauto-merge --pr 12 --run-id r1" --pr 12 --run-id r1
check_forward "guard-command names the project allowlist" guard-command.sh "guard-command --allowlist $hooks_dir/guard-allow.txt" 
check_forward "the generic adapter names its payload and format" adapters/pre-tool-guard.sh "guard-command --payload --format plain --allowlist $hooks_dir/guard-allow.txt"
check_forward "the copilot adapter names its format" adapters/copilot-guard.sh "guard-command --payload --format copilot --allowlist $hooks_dir/guard-allow.txt"
check_forward "the normalizer adapter names its format" adapters/normalize-hook-payload.sh "guard-command --payload --format json"

# ── 4. the exit code is forwarded, not swallowed ─────────────────────────
cases=$((cases + 1))
STUB_EXIT=7 "$hooks_dir/turn-contract.sh" >/dev/null 2>&1
status=$?
if [ "$status" -eq 7 ]; then
  pass "the CLI's exit code is forwarded"
else
  fail "the CLI's exit code is forwarded (got $status)"
fi

# ── 5. degradation: fail closed, and name the missing entry point ────────
mkdir -p "$scratch/minbin"
for tool in bash dirname grep env sed cat; do
  resolved=$(command -v "$tool" || true)
  [ -n "$resolved" ] && ln -sf "$resolved" "$scratch/minbin/$tool"
done

for shim in turn-contract.sh guard-command.sh git-identity-check.sh fullauto-merge.sh; do
  cases=$((cases + 1))
  env -u AGENTIC_WORKFLOW_BIN PATH="$scratch/minbin" "$hooks_dir/$shim" >"$scratch/out" 2>&1
  status=$?
  if [ "$status" -ne 0 ] && grep -qi 'agentic-workflow CLI is not installed' "$scratch/out"; then
    pass "$shim fails closed, naming the missing CLI (exit $status)"
  else
    fail "$shim fails closed, naming the missing CLI (exit $status)"
  fi
done

cases=$((cases + 1))
env -u AGENTIC_WORKFLOW_BIN PATH="$scratch/minbin" "$hooks_dir/index-sync.sh" post-merge >"$scratch/out" 2>&1
status=$?
if [ "$status" -eq 0 ] && [ ! -s "$scratch/out" ]; then
  pass "index-sync keeps its contract: a silent no-op without the entry point"
else
  fail "index-sync keeps its contract: a silent no-op without the entry point (exit $status)"
fi

# ── 6. the adapters keep their platform's answer shape ──────────────────
# The decision is real from here on: point the shims at the installed CLI, else at
# this checkout's crate bin when the suite runs inside the source tree.
unset AGENTIC_WORKFLOW_BIN
repo_root=$(CDPATH='' cd -- "$hooks_dir/../../.." && pwd)
if [ -f "$repo_root/packages/agentic-workflow/bin/agentic-workflow.mjs" ]; then
  AGENTIC_WORKFLOW_BIN="$repo_root/packages/agentic-workflow/bin/agentic-workflow.mjs"
  export AGENTIC_WORKFLOW_BIN
fi

cases=$((cases + 1))
copilot_out=$(printf '%s' '{"tool_input":{"file_path":".env"}}' | "$hooks_dir/adapters/copilot-guard.sh")
case "$copilot_out" in
  *'"continue":false'*Blocked*)
    pass "the copilot adapter answers with its decision document"
    ;;
  *)
    fail "the copilot adapter answers with its decision document (got [$copilot_out])"
    ;;
esac

cases=$((cases + 1))
if printf '%s' '{"tool_input":{"command":"gh pr merge 12"}}' | "$hooks_dir/adapters/pre-tool-guard.sh" >/dev/null 2>&1; then
  fail "the generic adapter blocks through the CLI"
else
  pass "the generic adapter blocks through the CLI"
fi

printf '\n%d case(s), %d failure(s)\n' "$cases" "$failures"
[ "$failures" -eq 0 ]
