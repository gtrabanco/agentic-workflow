#!/usr/bin/env bash
# Hook suite for turn-contract.sh — per-box pass/fail/n-a cases against
# throwaway fixture repositories (D-52-9 proportionality: no combinatorial
# flag x state sweep). Needs bash + git only; `gh` is PATH-stubbed because a
# real forge is never contacted.

set -u

test_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
shim=$test_dir/../turn-contract.sh
failures=0
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

gitc() { git -c user.email=t@example.com -c user.name=test -c commit.gpgsign=false "$@"; }

# new_branch <repo> <branch>: fresh repo with one commit on <branch>.
new_branch() {
  gitc init -q -b "$2" "$1"
  printf 'base\n' > "$1/README.md"
  gitc -C "$1" add README.md
  gitc -C "$1" commit -qm base
}

# commit_file <repo> <relpath> <content>
commit_file() {
  mkdir -p "$(dirname -- "$1/$2")"
  printf '%s\n' "$3" > "$1/$2"
  gitc -C "$1" add "$2"
  gitc -C "$1" commit -qm "add $2"
}

# run: executes the shim from $run_dir with the remaining args.
run() {
  out=$(cd "$run_dir" && "$shim" "$@" 2>"$tmp/stderr")
  code=$?
}

# assert <label> <want-code> <want-stdout>
assert() {
  ok=1
  if [ "$code" -ne "$2" ]; then
    printf 'FAIL %s: exit %s, want %s\n' "$1" "$code" "$2" >&2
    ok=0
  fi
  if [ "$out" != "$3" ]; then
    printf 'FAIL %s: stdout %s, want %s\n' "$1" "$out" "$3" >&2
    ok=0
  fi
  [ "$ok" -eq 1 ] || failures=$((failures + 1))
}

# ---- shared fixtures -------------------------------------------------------

# ok: main + feat/ok with a committed ACCEPTANCE.md at HEAD; clean, no upstream.
ok_repo=$tmp/ok
new_branch "$ok_repo" main
gitc -C "$ok_repo" checkout -q -b feat/ok
commit_file "$ok_repo" docs/features/ok/ACCEPTANCE.md 'frozen'

# default: a repo sitting on its default branch.
default_repo=$tmp/default
new_branch "$default_repo" main

# notrepo: a plain directory.
mkdir -p "$tmp/notrepo"

# nocommits: feat/none points at main's only commit.
nocommits_repo=$tmp/nocommits
new_branch "$nocommits_repo" main
gitc -C "$nocommits_repo" checkout -q -b feat/none

# missing: unit-shaped branch whose unit dir has no ACCEPTANCE.md at HEAD.
missing_repo=$tmp/missing
new_branch "$missing_repo" main
gitc -C "$missing_repo" checkout -q -b feat/missing
commit_file "$missing_repo" docs/features/missing/SPEC.md 'no acceptance here'

# plain: non-unit-shaped branch, otherwise clean (box2 is not-applicable).
plain_repo=$tmp/plain
new_branch "$plain_repo" main
gitc -C "$plain_repo" checkout -q -b chore/plain
commit_file "$plain_repo" note.txt 'x'

# empty: unborn branch with no commits (dev scenario verifier:empty-repo).
empty_repo=$tmp/empty
gitc init -q -b feature/x "$empty_repo"

# unicode: dirty tree with spaces / unicode filenames (verifier:oversized-status).
unicode_repo=$tmp/unicode
new_branch "$unicode_repo" main
gitc -C "$unicode_repo" checkout -q -b feat/unicode
commit_file "$unicode_repo" docs/features/unicode/ACCEPTANCE.md 'frozen'
printf 'x\n' > "$unicode_repo/a b.txt"
printf 'x\n' > "$unicode_repo/café.txt"

# corrupt: `git status` itself errors (corrupt .git/index) -> box5 fails
# closed, never a fake ok (F1, review cycle 1).
corrupt_repo=$tmp/corrupt
new_branch "$corrupt_repo" main
gitc -C "$corrupt_repo" checkout -q -b feat/corrupt
commit_file "$corrupt_repo" docs/features/corrupt/ACCEPTANCE.md 'frozen'
printf 'not a git index\n' > "$corrupt_repo/.git/index"

# dirty: the ok fixture plus an unstaged edit.
dirty_repo=$tmp/dirty
new_branch "$dirty_repo" main
gitc -C "$dirty_repo" checkout -q -b feat/dirty
commit_file "$dirty_repo" docs/features/dirty/ACCEPTANCE.md 'frozen'
printf 'dirty\n' >> "$dirty_repo/README.md"

# ahead: pushed to a bare remote, then one local commit on top.
ahead_repo=$tmp/ahead
new_branch "$ahead_repo" main
gitc -C "$ahead_repo" checkout -q -b feat/ahead
commit_file "$ahead_repo" docs/features/ahead/ACCEPTANCE.md 'frozen'
gitc init -q --bare "$tmp/ahead-remote.git"
gitc -C "$ahead_repo" remote add origin "$tmp/ahead-remote.git"
gitc -C "$ahead_repo" push -qu origin feat/ahead
commit_file "$ahead_repo" extra.txt 'local only'

# dirtyahead: dirty AND ahead simultaneously (dirty wins inside box5).
dirtyahead_repo=$tmp/dirtyahead
new_branch "$dirtyahead_repo" main
gitc -C "$dirtyahead_repo" checkout -q -b feat/dirtyahead
commit_file "$dirtyahead_repo" docs/features/dirtyahead/ACCEPTANCE.md 'frozen'
gitc init -q --bare "$tmp/da-remote.git"
gitc -C "$dirtyahead_repo" remote add origin "$tmp/da-remote.git"
gitc -C "$dirtyahead_repo" push -qu origin feat/dirtyahead
commit_file "$dirtyahead_repo" extra.txt 'local only'
printf 'dirty\n' >> "$dirtyahead_repo/README.md"

# box4 fixtures: branch with an upstream (a bare remote), clean.
b4_repo=$tmp/b4
new_branch "$b4_repo" main
gitc -C "$b4_repo" checkout -q -b feat/b4
commit_file "$b4_repo" docs/features/b4/ACCEPTANCE.md 'frozen'
gitc init -q --bare "$tmp/b4-remote.git"
gitc -C "$b4_repo" remote add origin "$tmp/b4-remote.git"
gitc -C "$b4_repo" push -qu origin feat/b4

# PATH-stubbed gh: emits $GH_STUB_JSON and exits $GH_STUB_EXIT.
stub_dir=$tmp/bin
mkdir -p "$stub_dir"
cat > "$stub_dir/gh" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "${GH_STUB_JSON:-}"
[ "${GH_STUB_EXIT:-0}" -eq 0 ] || exit "${GH_STUB_EXIT}"
STUB
chmod +x "$stub_dir/gh"
export PATH="$stub_dir:$PATH"
export GH_STUB_JSON=''
export GH_STUB_EXIT=0

# ---- box1 ------------------------------------------------------------------

run_dir=$default_repo
run
assert "box1 default branch" 1 'TURN-CONTRACT fail box1: branch-default'

run_dir=$tmp/notrepo
run
assert "box1 not a repo" 1 'TURN-CONTRACT fail box1: not-a-repo'

# ---- box2 ------------------------------------------------------------------

run_dir=$missing_repo
run
assert "box2 acceptance missing" 1 'TURN-CONTRACT fail box2: acceptance-missing'

run_dir=$plain_repo
run
assert "box2 not-applicable" 0 'TURN-CONTRACT ok'

# ---- box3 ------------------------------------------------------------------

run_dir=$nocommits_repo
run
assert "box3 no commits" 1 'TURN-CONTRACT fail box3: no-commits'

run_dir=$empty_repo
run
assert "box3 empty repo" 1 'TURN-CONTRACT fail box3: no-commits'

# ---- box4 ------------------------------------------------------------------

run_dir=$ok_repo
run
assert "box4 not-applicable without --finished" 0 'TURN-CONTRACT ok'

run_dir=$ok_repo
run --finished
assert "box4 no upstream" 1 'TURN-CONTRACT fail box4: pr-not-open'

GH_STUB_EXIT=1
run_dir=$b4_repo
run --finished
assert "box4 gh unreachable" 1 'TURN-CONTRACT fail box4: pr-unreachable'
GH_STUB_EXIT=0

head_sha=$(gitc -C "$b4_repo" rev-parse HEAD)
GH_STUB_JSON='{"headRefOid":"0000000000000000000000000000000000000000","state":"OPEN"}'
run_dir=$b4_repo
run --finished
assert "box4 head mismatch" 1 'TURN-CONTRACT fail box4: pr-head-mismatch'

GH_STUB_JSON="{\"headRefOid\":\"$head_sha\",\"state\":\"OPEN\"}"
run_dir=$b4_repo
run --finished
assert "box4 open PR at HEAD" 0 'TURN-CONTRACT ok'

# ---- box5 ------------------------------------------------------------------

run_dir=$dirty_repo
run
assert "box5 dirty tree" 1 'TURN-CONTRACT fail box5: dirty-tree'

run_dir=$ahead_repo
run
assert "box5 ahead of remote" 1 'TURN-CONTRACT fail box5: ahead-of-remote'

run_dir=$dirtyahead_repo
run
assert "box5 dirty precedes ahead" 1 'TURN-CONTRACT fail box5: dirty-tree'

run_dir=$unicode_repo
run
assert "box5 unicode/space names" 1 'TURN-CONTRACT fail box5: dirty-tree'

run_dir=$corrupt_repo
run
assert "box5 unreadable status fails closed" 1 'TURN-CONTRACT fail box5: dirty-tree'

# ---- read-only + cwd -------------------------------------------------------

before=$(gitc -C "$ok_repo" status --porcelain --untracked-files=all)
run_dir=$ok_repo
run
after=$(gitc -C "$ok_repo" status --porcelain --untracked-files=all)
assert "ok receipt on a clean feature branch" 0 'TURN-CONTRACT ok'
if [ "$before" != "$after" ]; then
  printf 'FAIL read-only: the verifier mutated the tree\n' >&2
  failures=$((failures + 1))
fi
if [ "$(printf '%s\n' "$out" | wc -l | tr -d ' ')" != "1" ]; then
  printf 'FAIL stdout: expected exactly one receipt line, got %s\n' "$out" >&2
  failures=$((failures + 1))
fi

mkdir -p "$ok_repo/subdir"
run_dir=$ok_repo/subdir
run
assert "subdirectory invocation" 0 'TURN-CONTRACT ok'

# ---- plumbing --------------------------------------------------------------

if [ "$(id -u)" -ne 0 ]; then
  plumbing_repo=$tmp/plumbing
  new_branch "$plumbing_repo" main
  gitc -C "$plumbing_repo" checkout -q -b feat/plumbing
  commit_file "$plumbing_repo" docs/features/plumbing/ACCEPTANCE.md 'frozen'
  chmod 000 "$plumbing_repo/.git"
  run_dir=$plumbing_repo
  run
  assert "unreadable .git fails closed" 1 'TURN-CONTRACT fail box1: not-a-repo'
  chmod 755 "$plumbing_repo/.git"
fi

# ---- flags -----------------------------------------------------------------

run_dir=$ok_repo
run --help
assert "--help exits 0" 0 "usage: turn-contract.sh [--finished|--help]

  --finished  also check box4 (pushed branch + open pull request whose head is local HEAD)
  --help      print this usage and exit 0"

run_dir=$ok_repo
run --nope
assert "unknown flag exits 2" 2 ''
if ! grep -q 'unknown argument: --nope' "$tmp/stderr"; then
  printf 'FAIL unknown flag: usage missing from stderr\n' >&2
  failures=$((failures + 1))
fi

[ "$failures" -eq 0 ] || exit 1
printf 'PASS turn contract: 23 cases\n'
