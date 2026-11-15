#!/usr/bin/env bash
#
# test-secret-scan.sh — the push-range secret scan as a target project gets it
# (issue #552).
#
# The scan shipped by #487 lived in `scripts/secret-scan.mjs`, i.e. only in the
# repository that built it: a target project had no barrier against a credential
# riding a prose-only push. It now ships in `template/.agentic-workflow/hooks/`
# with a runner, and this suite is the contract a scaffolded project can run:
# the module and the runner are the only two files needed, a clean range passes,
# a leaked one fails, an absent allowlist allows nothing, a project allowlist
# narrows exactly its own path and rule, a malformed one refuses, and a host
# with neither `bun` nor `node` is refused by name instead of passing silently.
#
# The runner never installs itself: `init-workspace` asks first (the same consent
# contract `tests/test-index-consent.sh` pins for the retrieval hooks).
#
# Run: bash template/.agentic-workflow/hooks/tests/test-secret-scan.sh

set -uo pipefail

hooks_dir=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
module="$hooks_dir/secret-scan.mjs"
runner="$hooks_dir/secret-scan.sh"
bash_bin=${BASH:-/bin/bash}
failures=0
cases=0

pass() { printf 'ok %d — %s\n' "$cases" "$1"; }
fail() { printf 'not ok %d — %s\n' "$cases" "$1"; failures=$((failures + 1)); }
check() {
  cases=$((cases + 1))
  if [ "$1" = "$2" ]; then pass "$3"; else fail "$3 (want $2, got $1)"; fi
}
contains() {
  cases=$((cases + 1))
  case "$1" in *"$2"*) pass "$3" ;; *) fail "$3 (missing: $2)" ;; esac
}

scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT

if [ ! -f "$module" ] || [ ! -f "$runner" ]; then
  cases=$((cases + 1)); fail "the template carries the scan in secret-scan.mjs and secret-scan.sh"
  printf '\n%d case(s), %d failure(s)\n' "$cases" "$failures"
  exit 1
fi

# ── a throwaway project that carries ONLY the hooks directory ─────────────
# This is the freshness claim: nothing from this repository — no scripts/, no
# local-gate, no allowlist — travels with the scan.
project="$scratch/project"
mkdir -p "$project/.agentic-workflow"
cp -R "$hooks_dir" "$project/.agentic-workflow/hooks"

git_() {
  git -C "$project" \
    -c user.name='Fixture Human' -c user.email='fixture@example.com' -c commit.gpgsign=false \
    "$@"
}

git_ init -q -b main
printf 'seed\n' >"$project/seed.txt"
git_ add -A
git_ commit -q -m 'chore: a clean scaffold'
base=$(git_ rev-parse HEAD)

run_scan() { "$bash_bin" "$runner" --root "$project" --base "$base" 2>&1; }

# ── 1. the clean range passes, from the scaffold alone ────────────────────
out=$(run_scan); status=$?
check "$status" 0 "a fresh scaffold passes a clean push range"
contains "$out" "verdict: PASS" "the clean run prints its verdict"

# ── 2. an added credential is a finding, with no allowlist present ────────
# The payload is composed so this file carries no literal secret.
payload=$(printf '%s%s' 'd4f1a2b3' 'c4d5e6f7a8b9c0d1e2f3a4b5')
printf 'API_TOKEN="%s"\n' "$payload" >"$project/app.env"
git_ add -A
git_ commit -q -m 'feat: a leak'
out=$(run_scan); status=$?
check "$status" 1 "a leaked credential fails the scan"
contains "$out" "FINDING app.env:1 — credential-assignment" "the finding names the file, the line and the rule"
if printf '%s' "$out" | grep -q "$payload"; then
  cases=$((cases + 1)); fail "the report never echoes the credential it caught"
else
  cases=$((cases + 1)); pass "the report never echoes the credential it caught"
fi

# ── 3. a project allowlist narrows exactly its own path and rule ──────────
mkdir -p "$project/.agentic-workflow/hooks"
printf '[{"path": "app.env", "rule": "credential-assignment", "reason": "a documented sample"}]\n' \
  >"$project/.agentic-workflow/hooks/secret-scan-allowlist.json"
out=$(run_scan); status=$?
check "$status" 0 "the project allowlist narrows the shipped finding"
contains "$out" "ALLOWLISTED app.env:1 — credential-assignment" "an allowlisted hit stays visible, never silent"

# ── 4. a malformed allowlist refuses instead of allowing everything ───────
printf '{"path": "app.env"}\n' >"$project/.agentic-workflow/hooks/secret-scan-allowlist.json"
out=$("$bash_bin" "$runner" --root "$project" --base "$base" 2>&1); status=$?
check "$status" 2 "a malformed allowlist is a usage error, never a silent pass"
contains "$out" "secret-scan-allowlist.json" "the refusal names the file it could not read"
rm -f "$project/.agentic-workflow/hooks/secret-scan-allowlist.json"

# ── 5. no runtime on PATH is refused by name ──────────────────────────────
out=$(PATH='/nonexistent' "$bash_bin" "$runner" --root "$project" 2>&1); status=$?
check "$status" 2 "a host with no JS runtime refuses the scan"
contains "$out" "neither bun nor node" "the refusal names both runtimes"
if printf '%s' "$out" | grep -q 'verdict: PASS'; then
  cases=$((cases + 1)); fail "the degraded run never reports a pass"
else
  cases=$((cases + 1)); pass "the degraded run never reports a pass"
fi

# ── 6. the runner never installs itself ───────────────────────────────────
# Consent is init-workspace's job: a self-installing hook would bypass the
# question entirely (the same pin `test-index-consent.sh` applies).
if grep -qE '(^|[;|])cp [^|]*\.git/hooks|mkdir[^|]*\.git/hooks|>[[:space:]]*\.git/hooks/' "$runner"; then
  cases=$((cases + 1)); fail "the runner contains a self-install path — the consent gate is bypassable"
else
  cases=$((cases + 1)); pass "the runner never installs itself"
fi

# ── 7. one implementation: the runner only resolves and executes ──────────
if grep -q 'secret-scan\.mjs' "$runner"; then
  cases=$((cases + 1)); pass "the runner executes the one module"
else
  cases=$((cases + 1)); fail "the runner executes the one module"
fi
if grep -qE 'PRIVATE KEY|credential-assignment|aws-access-key' "$runner"; then
  cases=$((cases + 1)); fail "the runner carries a detection rule — that is a second implementation"
else
  cases=$((cases + 1)); pass "the runner carries no detection rule"
fi

printf '\n%d case(s), %d failure(s)\n' "$cases" "$failures"
[ "$failures" -eq 0 ]
