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

# ok: main + feat/ok with a committed SPEC.md at HEAD; clean, no upstream.
ok_repo=$tmp/ok
new_branch "$ok_repo" main
gitc -C "$ok_repo" checkout -q -b feat/ok
commit_file "$ok_repo" docs/features/ok/SPEC.md 'frozen'

# default: a repo sitting on its default branch.
default_repo=$tmp/default
new_branch "$default_repo" main

# notrepo: a plain directory.
mkdir -p "$tmp/notrepo"

# nocommits: feat/none points at main's only commit.
nocommits_repo=$tmp/nocommits
new_branch "$nocommits_repo" main
gitc -C "$nocommits_repo" checkout -q -b feat/none

# missing: unit-shaped branch whose unit dir has no SPEC.md at HEAD.
missing_repo=$tmp/missing
new_branch "$missing_repo" main
gitc -C "$missing_repo" checkout -q -b feat/missing
commit_file "$missing_repo" docs/features/missing/ROADMAP.md 'not a unit doc'

# plain: non-unit-shaped branch, otherwise clean (box2 is not-applicable).
plain_repo=$tmp/plain
new_branch "$plain_repo" main
gitc -C "$plain_repo" checkout -q -b chore/plain
commit_file "$plain_repo" note.txt 'x'

# unitfile: the unit path exists as a regular FILE, not a directory -> the unit
# directory does not exist, so box2 is not-applicable (ED-52-2; F5, cycle 2).
unitfile_repo=$tmp/unitfile
new_branch "$unitfile_repo" main
gitc -C "$unitfile_repo" checkout -q -b feat/unitfile
commit_file "$unitfile_repo" docs/features/unitfile 'not a directory'

# empty: unborn branch with no commits (dev scenario verifier:empty-repo).
empty_repo=$tmp/empty
gitc init -q -b feature/x "$empty_repo"

# unicode: dirty tree with spaces / unicode filenames (verifier:oversized-status).
unicode_repo=$tmp/unicode
new_branch "$unicode_repo" main
gitc -C "$unicode_repo" checkout -q -b feat/unicode
commit_file "$unicode_repo" docs/features/unicode/SPEC.md 'frozen'
printf 'x\n' > "$unicode_repo/a b.txt"
printf 'x\n' > "$unicode_repo/café.txt"

# corrupt: `git status` itself errors (corrupt .git/index) -> box5 fails
# closed, never a fake ok (F1, review cycle 1).
corrupt_repo=$tmp/corrupt
new_branch "$corrupt_repo" main
gitc -C "$corrupt_repo" checkout -q -b feat/corrupt
commit_file "$corrupt_repo" docs/features/corrupt/SPEC.md 'frozen'
printf 'not a git index\n' > "$corrupt_repo/.git/index"

# bigstatus: porcelain past the engine's 1 MiB read cap and past the shim's pipe
# buffer -> the truncating reads must still fail closed (F6, fold cycle 2).
bigstatus_repo=$tmp/bigstatus
new_branch "$bigstatus_repo" main
gitc -C "$bigstatus_repo" checkout -q -b feat/bigstatus
commit_file "$bigstatus_repo" docs/features/bigstatus/SPEC.md 'frozen'
seg=$(printf 'd%.0s' $(seq 1 200))
long_dir=$seg/$seg/$seg/$seg/$seg/$seg/$seg/$seg/$seg/$seg/$seg/$seg/$seg/$seg/$seg/$seg/$seg/$seg/$seg
mkdir -p "$bigstatus_repo/$long_dir"
printf 'x\n' > "$bigstatus_repo/$long_dir/tracked.txt"
gitc -C "$bigstatus_repo" add "$long_dir/tracked.txt"
gitc -C "$bigstatus_repo" commit -qm 'add long dir'
i=0
while [ "$i" -lt 320 ]; do
  printf 'x\n' > "$bigstatus_repo/$long_dir/f$i"
  i=$((i + 1))
done

# dirty: the ok fixture plus an unstaged edit.
dirty_repo=$tmp/dirty
new_branch "$dirty_repo" main
gitc -C "$dirty_repo" checkout -q -b feat/dirty
commit_file "$dirty_repo" docs/features/dirty/SPEC.md 'frozen'
printf 'dirty\n' >> "$dirty_repo/README.md"

# ahead: pushed to a bare remote, then one local commit on top.
ahead_repo=$tmp/ahead
new_branch "$ahead_repo" main
gitc -C "$ahead_repo" checkout -q -b feat/ahead
commit_file "$ahead_repo" docs/features/ahead/SPEC.md 'frozen'
gitc init -q --bare "$tmp/ahead-remote.git"
gitc -C "$ahead_repo" remote add origin "$tmp/ahead-remote.git"
gitc -C "$ahead_repo" push -qu origin feat/ahead
commit_file "$ahead_repo" extra.txt 'local only'

# dirtyahead: dirty AND ahead simultaneously (dirty wins inside box5).
dirtyahead_repo=$tmp/dirtyahead
new_branch "$dirtyahead_repo" main
gitc -C "$dirtyahead_repo" checkout -q -b feat/dirtyahead
commit_file "$dirtyahead_repo" docs/features/dirtyahead/SPEC.md 'frozen'
gitc init -q --bare "$tmp/da-remote.git"
gitc -C "$dirtyahead_repo" remote add origin "$tmp/da-remote.git"
gitc -C "$dirtyahead_repo" push -qu origin feat/dirtyahead
commit_file "$dirtyahead_repo" extra.txt 'local only'
printf 'dirty\n' >> "$dirtyahead_repo/README.md"

# numeric: an all-numeric branch name on a pushed branch — the name is not a
# PR number (F11, fold cycle 3).
numeric_repo=$tmp/numeric
new_branch "$numeric_repo" main
gitc -C "$numeric_repo" checkout -q -b 123
commit_file "$numeric_repo" note.txt 'x'
gitc init -q --bare "$tmp/num-remote.git"
gitc -C "$numeric_repo" remote add origin "$tmp/num-remote.git"
gitc -C "$numeric_repo" push -qu origin 123

# hidden: repo-local status.showUntrackedFiles=no must not hide an untracked
# file from box5 (F8, fold cycle 3).
hidden_repo=$tmp/hidden
new_branch "$hidden_repo" main
gitc -C "$hidden_repo" checkout -q -b feat/hidden
commit_file "$hidden_repo" docs/features/hidden/SPEC.md 'frozen'
gitc -C "$hidden_repo" config status.showUntrackedFiles no
printf 'x\n' > "$hidden_repo/untracked.txt"

# index: a stale mtime on a tracked file makes `git status` want to refresh the
# index; the read must not write it (F10, fold cycle 3).
index_repo=$tmp/index
new_branch "$index_repo" main
gitc -C "$index_repo" checkout -q -b feat/index
commit_file "$index_repo" docs/features/index/SPEC.md 'frozen'
touch -t 202001010000 "$index_repo/README.md"

# box4 fixtures: branch with an upstream (a bare remote), clean.
b4_repo=$tmp/b4
new_branch "$b4_repo" main
gitc -C "$b4_repo" checkout -q -b feat/b4
commit_file "$b4_repo" docs/features/b4/SPEC.md 'frozen'
gitc init -q --bare "$tmp/b4-remote.git"
gitc -C "$b4_repo" remote add origin "$tmp/b4-remote.git"
gitc -C "$b4_repo" push -qu origin feat/b4

# PATH-stubbed gh: `pr list --head <branch>` emits $GH_STUB_JSON (that branch's
# pull requests); `pr view <arg>` emits $GH_STUB_VIEW_JSON — real gh reads an
# all-numeric argument as a PR NUMBER and exits nonzero when no pull request
# matches the branch. $GH_STUB_EXIT forces a failure exit from either
# invocation; $GH_STUB_VIEW_EXIT forces one from `pr view` only.
stub_dir=$tmp/bin
mkdir -p "$stub_dir"
cat > "$stub_dir/gh" <<'STUB'
#!/usr/bin/env bash
case "$1 $2" in
  "pr list")
    printf '%s\n' "${GH_STUB_JSON:-[]}"
    exit_code="${GH_STUB_EXIT:-0}"
    ;;
  "pr view")
    printf '%s\n' "${GH_STUB_VIEW_JSON:-}"
    exit_code="${GH_STUB_VIEW_EXIT:-${GH_STUB_EXIT:-0}}"
    ;;
  *) exit 3 ;;
esac
[ "$exit_code" -eq 0 ] || exit "$exit_code"
STUB
chmod +x "$stub_dir/gh"
export PATH="$stub_dir:$PATH"
export GH_STUB_JSON=''
export GH_STUB_VIEW_JSON=''
unset GH_STUB_VIEW_EXIT
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
assert "box2 unit-doc missing" 1 'TURN-CONTRACT fail box2: unit-doc-missing'

run_dir=$plain_repo
run
assert "box2 not-applicable" 0 'TURN-CONTRACT ok'

run_dir=$unitfile_repo
run
assert "box2 unit path is a file" 0 'TURN-CONTRACT ok'

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

GH_STUB_JSON='[]'
export GH_STUB_VIEW_EXIT=1
run_dir=$b4_repo
run --finished
assert "box4 no PR for the branch" 1 'TURN-CONTRACT fail box4: pr-not-open'
unset GH_STUB_VIEW_EXIT

head_sha=$(gitc -C "$b4_repo" rev-parse HEAD)
GH_STUB_JSON="[{\"headRefOid\":\"$head_sha\",\"state\":\"MERGED\"}]"
GH_STUB_VIEW_JSON="{\"headRefOid\":\"$head_sha\",\"state\":\"MERGED\"}"
run_dir=$b4_repo
run --finished
assert "box4 merged PR is not an open PR" 1 'TURN-CONTRACT fail box4: pr-not-open'
GH_STUB_VIEW_JSON=''

GH_STUB_JSON='[{"headRefOid":"0000000000000000000000000000000000000000","state":"OPEN"}]'
run_dir=$b4_repo
run --finished
assert "box4 head mismatch" 1 'TURN-CONTRACT fail box4: pr-head-mismatch'

GH_STUB_JSON="[{\"headRefOid\":\"$head_sha\",\"state\":\"OPEN\"}]"
run_dir=$b4_repo
run --finished
assert "box4 open PR at HEAD" 0 'TURN-CONTRACT ok'

GH_STUB_JSON='[]'
GH_STUB_VIEW_JSON='{"headRefOid":"0000000000000000000000000000000000000000","state":"OPEN"}'
run_dir=$numeric_repo
run --finished
assert "box4 numeric branch is not a PR number" 1 'TURN-CONTRACT fail box4: pr-not-open'
GH_STUB_VIEW_JSON=''

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

run_dir=$bigstatus_repo
run
assert "box5 huge listing fails closed" 1 'TURN-CONTRACT fail box5: dirty-tree'

run_dir=$hidden_repo
run
assert "box5 ignores status.showUntrackedFiles=no" 1 'TURN-CONTRACT fail box5: dirty-tree'

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

# The stale-stat fixture: a porcelain-only before/after comparison cannot see
# the index write, so the index bytes are compared directly (F10, fold cycle 3).
cp "$index_repo/.git/index" "$tmp/index.before"
run_dir=$index_repo
run
assert "ok receipt leaves .git/index untouched" 0 'TURN-CONTRACT ok'
if ! cmp -s "$tmp/index.before" "$index_repo/.git/index"; then
  printf 'FAIL read-only: the verifier rewrote .git/index\n' >&2
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
  commit_file "$plumbing_repo" docs/features/plumbing/SPEC.md 'frozen'
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
printf 'PASS turn contract: 31 cases\n'
