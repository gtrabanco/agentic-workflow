#!/usr/bin/env bash
#
# test-temp-lib.sh — the one temp-directory resolution the hooks share (issue
# #546 S8).
#
# A Windows host sets TEMP (and TMP), a POSIX host sets TMPDIR, and some
# containers set none of them; `${TMPDIR:-/tmp}` covers the last case on Unix and
# nothing else. Every hook that needs a scratch file asks this library instead,
# and this suite is the contract: the candidate order, the writability test, the
# fallback, and the fact that no hook keeps a private copy of it.
#
# Run: bash template/.agentic-workflow/hooks/tests/test-temp-lib.sh

set -uo pipefail

hooks_dir=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
lib="$hooks_dir/lib/temp.sh"
failures=0
cases=0

pass() { printf 'ok %d — %s\n' "$cases" "$1"; }
fail() { printf 'not ok %d — %s\n' "$cases" "$1"; failures=$((failures + 1)); }
check() {
  cases=$((cases + 1))
  if [ "$1" = "$2" ]; then pass "$3"; else fail "$3 (want $2, got $1)"; fi
}

scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT

if [ ! -f "$lib" ]; then
  cases=$((cases + 1)); fail "the shared temp library exists at lib/temp.sh"
  printf '\n%d case(s), %d failure(s)\n' "$cases" "$failures"
  exit 1
fi

# shellcheck disable=SC1090
. "$lib"

# ── 1. the candidate order ────────────────────────────────────────────────
a=$scratch/a; b=$scratch/b; c=$scratch/c
mkdir -p "$a" "$b" "$c"
cases=$((cases + 1))
resolved=$(TMPDIR="$a" TEMP="$b" TMP="$c" aw_tmpdir) && [ "$resolved" = "$a" ] && pass "TMPDIR wins" || fail "TMPDIR wins (got ${resolved:-<none>})"

cases=$((cases + 1))
resolved=$(unset TMPDIR; TEMP="$b" TMP="$c" aw_tmpdir) && [ "$resolved" = "$b" ] && pass "TEMP is the second candidate" || fail "TEMP is the second candidate (got ${resolved:-<none>})"

cases=$((cases + 1))
resolved=$(unset TMPDIR TEMP; TMP="$c" aw_tmpdir) && [ "$resolved" = "$c" ] && pass "TMP is the third candidate" || fail "TMP is the third candidate (got ${resolved:-<none>})"

# ── 2. an unusable candidate is skipped, never used ───────────────────────
cases=$((cases + 1))
resolved=$(TMPDIR="$scratch/nope" TEMP="$b" aw_tmpdir) && [ "$resolved" = "$b" ] && pass "a missing candidate falls through" || fail "a missing candidate falls through (got ${resolved:-<none>})"

mkdir -p "$scratch/locked"
chmod 500 "$scratch/locked"
cases=$((cases + 1))
resolved=$(TMPDIR="$scratch/locked" TEMP="$b" aw_tmpdir) && [ "$resolved" = "$b" ] && pass "an unwritable candidate falls through" || fail "an unwritable candidate falls through (got ${resolved:-<none>})"
chmod 700 "$scratch/locked"

# ── 3. no candidate at all still answers /tmp ─────────────────────────────
cases=$((cases + 1))
resolved=$(unset TMPDIR TEMP TMP; aw_tmpdir) && [ "$resolved" = "/tmp" ] && pass "an empty environment resolves /tmp" || fail "an empty environment resolves /tmp (got ${resolved:-<none>})"

# ── 4. the file helper lands in the resolved directory ────────────────────
cases=$((cases + 1))
file=$(TMPDIR="$a" aw_mktemp_file agentic-workflow-test)
if [ -f "$file" ] && [ "$(dirname -- "$file")" = "$a" ]; then
  pass "aw_mktemp_file writes into the resolved directory"
  rm -f "$file"
else
  fail "aw_mktemp_file writes into the resolved directory (got ${file:-<none>})"
fi

# ── 5. no hook keeps a private copy of the fallback ───────────────────────
# The literal `${TMPDIR:-/tmp}` (and a bare `/tmp` mktemp) belongs to the helper
# and nowhere else; a hook that grows one again is the regression this unit
# exists to prevent.
cases=$((cases + 1))
offenders=$(grep -l -E 'TMPDIR:-/tmp|\$\{TEMP|mktemp (-d )?"?/tmp' "$hooks_dir"/*.sh 2>/dev/null)
if [ -z "$offenders" ]; then
  pass "no hook carries its own temp fallback"
else
  fail "no hook carries its own temp fallback (${offenders})"
fi

cases=$((cases + 1))
if grep -q 'lib/temp.sh' "$hooks_dir/fullauto-merge.sh"; then
  pass "fullauto-merge.sh sources the shared helper"
else
  fail "fullauto-merge.sh sources the shared helper"
fi

printf '\n%d case(s), %d failure(s)\n' "$cases" "$failures"
[ "$failures" -eq 0 ]
