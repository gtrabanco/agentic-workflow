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

# 4. The install-time pin (issue #718): init-workspace records the crate's own
#    resolver answer beside the hook, one argv token per line, and the hook runs
#    it verbatim. This is what makes the hook work where the crate is not on
#    PATH (a `bunx` host) — the case that used to be a silent no-op.
pin_root=$(mktemp -d)
mkdir -p "$pin_root/.agentic-workflow/hooks"
pin_record=$(mktemp)
pin_bin=$(mktemp)
cat > "$pin_bin" <<EOF
#!/usr/bin/env bash
printf '%s\n' "\$*" >> "$pin_record"
exit 0
EOF
chmod +x "$pin_bin"
printf '%s\n' "$pin_bin" doc --sync --quiet > "$pin_root/.agentic-workflow/hooks/runner.local"

if ( cd "$pin_root" && env -u AGENTIC_WORKFLOW_BIN PATH="/usr/bin:/bin" "$hook" post-merge ) >/dev/null 2>&1; then
  : # expected: the pinned argv ran and the hook stayed quiet
else
  printf 'FAIL pinned-run-not-ok\n' >&2
  failures=$((failures + 1))
fi
expect_recorded "the pinned argv ran verbatim" "doc --sync --quiet" "$pin_record"

# 4a. The explicit override still wins over the pin.
override_record=$(mktemp)
override_bin=$(mktemp)
cat > "$override_bin" <<EOF
#!/usr/bin/env bash
printf '%s\n' "\$*" >> "$override_record"
exit 0
EOF
chmod +x "$override_bin"
: > "$pin_record"
if ( cd "$pin_root" && AGENTIC_WORKFLOW_BIN="$override_bin" "$hook" post-checkout ) >/dev/null 2>&1; then
  : # expected
else
  printf 'FAIL override-not-ok\n' >&2
  failures=$((failures + 1))
fi
expect_recorded "the override ran" "doc --sync --quiet" "$override_record"
if [ -s "$pin_record" ]; then
  printf 'FAIL the pin ran despite the override\n' >&2
  failures=$((failures + 1))
fi

# 4b. A pin whose launcher fails still never breaks the git operation.
cat > "$pin_bin" <<'EOF'
#!/usr/bin/env bash
exit 1
EOF
chmod +x "$pin_bin"
if ( cd "$pin_root" && env -u AGENTIC_WORKFLOW_BIN PATH="/usr/bin:/bin" "$hook" post-merge ) >/dev/null 2>&1; then
  : # expected: exit 0 despite the pinned sync failing
else
  printf 'FAIL pinned failure leaked out of the hook\n' >&2
  failures=$((failures + 1))
fi

rm -rf "$pin_root"
rm -f "$pin_record" "$pin_bin" "$override_record" "$override_bin"

# 4c. A pin whose launcher is gone never disables the hook: the ordered resolution
#     falls through to `command -v` instead of ending in a silent no-op that skips
#     step 3 (review-change fix/718 cycle 1, report note 5).
fallback_root=$(mktemp -d)
mkdir -p "$fallback_root/.agentic-workflow/hooks" "$fallback_root/bin"
fallback_record=$(mktemp)
cat > "$fallback_root/bin/agentic-workflow" <<EOF
#!/usr/bin/env bash
printf '%s\n' "\$*" >> "$fallback_record"
exit 0
EOF
chmod +x "$fallback_root/bin/agentic-workflow"
printf '%s\n' "/nonexistent/runner-gone" doc --sync --quiet > "$fallback_root/.agentic-workflow/hooks/runner.local"
if ( cd "$fallback_root" && env -u AGENTIC_WORKFLOW_BIN PATH="$fallback_root/bin:/usr/bin:/bin" "$hook" post-merge ) >/dev/null 2>&1; then
  : # expected: a gone launcher is not a failure the git operation may see
else
  printf 'FAIL stale-pin-not-ok\n' >&2
  failures=$((failures + 1))
fi
expect_recorded "the PATH entry ran when the pin's launcher is gone" "doc --sync --quiet" "$fallback_record"
rm -rf "$fallback_root"
rm -f "$fallback_record"

if [ "$failures" -gt 0 ]; then
  printf 'INDEX-SYNC-HOOK-TESTS fail (%d)\n' "$failures"
  exit 1
fi
printf 'INDEX-SYNC-HOOK-TESTS ok\n'
