#!/usr/bin/env bash
# Tests for the consent-installed index-sync git fast path (unit 65, P8 —
# AC23). The hook invokes the retrieval entry point as `doc --sync --quiet`,
# is best-effort by contract (never fails a git operation), and is a no-op
# when the entry point is not installed (the grep fallback holds, AC21).

set -u

test_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
hook=$(CDPATH='' cd -- "$test_dir/.." && pwd)/index-sync.sh
failures=0

expect_hook_ok() {
  label=$1
  shift
  if ! "$hook" "$@" >/dev/null 2>&1; then
    printf 'FAIL hook-not-ok: %s\n' "$label" >&2
    failures=$((failures + 1))
  fi
}

expect_absent_bin_noop() {
  label=$1
  shift
  if ! env -u AGENTIC_WORKFLOW_BIN PATH="/usr/bin:/bin" "$hook" "$@" >/dev/null 2>&1; then
    printf 'FAIL absent-bin-noop: %s\n' "$label" >&2
    failures=$((failures + 1))
  fi
}

expect_recorded() {
  label=$1
  shift
  if ! grep -q -- "$1" "$2" 2>/dev/null; then
    printf 'FAIL missing %s in %s\n' "$label" "$2" >&2
    failures=$((failures + 1))
  fi
}

# 1. No entry point on PATH and no override ⇒ silent no-op, exit 0.
expect_absent_bin_noop "absent bin no-op" post-merge

# 2. A bin override is invoked with exactly the AC23 spelling, for each of
#    the three freshness hooks.
record=$(mktemp)
fake_bin=$(mktemp)
cat > "$fake_bin" <<EOF
#!/usr/bin/env bash
printf '%s\n' "\$*" >> "$record"
exit 0
EOF
chmod +x "$fake_bin"

for name in post-merge post-checkout post-rewrite; do
  : > "$record"
  AGENTIC_WORKFLOW_BIN="$fake_bin" expect_hook_ok "invokes under $name" "$name"
  expect_recorded "doc subcommand under $name" "doc" "$record"
  expect_recorded "--sync under $name" "--sync" "$record"
  expect_recorded "--quiet under $name" "--quiet" "$record"
done

# 3. The hook swallows a failing sync — a fast path never breaks git.
cat > "$fake_bin" <<'EOF'
#!/usr/bin/env bash
exit 1
EOF
chmod +x "$fake_bin"
if AGENTIC_WORKFLOW_BIN="$fake_bin" "$hook" post-merge >/dev/null 2>&1; then
  : # expected: exit 0 despite the sync failure
else
  printf 'FAIL sync failure leaked out of the hook\n' >&2
  failures=$((failures + 1))
fi

rm -f "$record" "$fake_bin"

if [ "$failures" -gt 0 ]; then
  printf 'INDEX-SYNC-HOOK-TESTS fail (%d)\n' "$failures"
  exit 1
fi
printf 'INDEX-SYNC-HOOK-TESTS ok\n'
