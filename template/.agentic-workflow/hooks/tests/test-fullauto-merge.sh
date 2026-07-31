#!/usr/bin/env bash

set -euo pipefail

hooks_dir=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
wrapper="$hooks_dir/fullauto-merge.sh"
fixture=$(mktemp -d "${TMPDIR:-/tmp}/agentic-workflow-fullauto.XXXXXX")
trap 'rm -rf "$fixture"' EXIT HUP INT TERM

mkdir -p "$fixture/bin" "$fixture/repo/docs/features" "$fixture/state"
git -C "$fixture" init -q --bare remote.git
git -C "$fixture/repo" init -q -b main
git -C "$fixture/repo" config user.name fixture
git -C "$fixture/repo" config user.email fixture@example.invalid
printf 'fixture\n' > "$fixture/repo/README.md"
printf 'merge: fullauto\n' > "$fixture/repo/docs/features/SHIP_DECISIONS.md"
git -C "$fixture/repo" add README.md docs/features/SHIP_DECISIONS.md
git -C "$fixture/repo" commit -qm fixture
git -C "$fixture/repo" remote add origin "$fixture/remote.git"
git -C "$fixture/repo" push -qu origin main
git -C "$fixture/repo" switch -qc feat/fixture
printf 'feature\n' >> "$fixture/repo/README.md"
git -C "$fixture/repo" commit -qam feature
git -C "$fixture/repo" push -qu origin feat/fixture
head_sha=$(git -C "$fixture/repo" rev-parse HEAD)
printf 'OPEN\n' > "$fixture/state/pr-state"
printf '0\n' > "$fixture/state/comments"

sed "s/__HEAD__/$head_sha/g" > "$fixture/bin/gh" <<'FIXTURE'
#!/usr/bin/env bash
set -euo pipefail
state_dir=${GH_TEST_STATE:?}
if [ "$1 $2" = "pr view" ]; then
  state=$(cat "$state_dir/pr-state")
  comments=$(cat "$state_dir/comments")
  bodies='[]'
  if [ "$comments" -gt 0 ]; then
    bodies='[{"body":"<!-- agentic-workflow:automerge head=__HEAD__ -->"}]'
  fi
  if printf '%s\n' "$*" | grep -q 'mergeCommit'; then
    printf '{"number":12,"url":"https://example.invalid/pr/12","state":"%s","baseRefName":"main","headRefOid":"__HEAD__","mergeable":"MERGEABLE","statusCheckRollup":[],"comments":%s,"mergeCommit":{"oid":"abc1234"}}\n' "$state" "$bodies"
  else
    printf '{"number":12,"url":"https://example.invalid/pr/12","state":"%s","baseRefName":"main","headRefOid":"__HEAD__","mergeable":"MERGEABLE","statusCheckRollup":[],"comments":%s}\n' "$state" "$bodies"
  fi
  exit 0
fi
if [ "$1 $2" = "pr merge" ]; then
  [ "${GH_TEST_FAIL_MERGE:-0}" = "0" ] || exit 1
  printf 'MERGED\n' > "$state_dir/pr-state"
  exit 0
fi
if [ "$1 $2" = "pr comment" ]; then
  count=$(cat "$state_dir/comments")
  printf '%s\n' "$((count + 1))" > "$state_dir/comments"
  exit 0
fi
printf 'unsupported fake gh call: %s\n' "$*" >&2
exit 2
FIXTURE
chmod +x "$fixture/bin/gh"

run_wrapper() {
  (cd "$fixture/repo" && PATH="$fixture/bin:$PATH" GH_TEST_STATE="$fixture/state" \
    AGENTIC_WORKFLOW_SHIP_ROADMAP_FULLAUTO=1 AGENTIC_WORKFLOW_LOCAL_GATE_SHA="$head_sha" \
    "$wrapper" --pr 12 --head "$head_sha" --base main --run-id fixture-run)
}

run_wrapper >/dev/null
[ "$(cat "$fixture/state/comments")" = "1" ]
if find "$fixture/repo/.git/agentic-workflow" -type f -name 'automerge-*' 2>/dev/null | grep -q .; then
  echo "FAIL: attempt marker survived successful merge" >&2
  exit 1
fi

# A retry reconciles the already-merged PR and does not duplicate its comment.
run_wrapper >/dev/null
[ "$(cat "$fixture/state/comments")" = "1" ]

printf 'OPEN\n' > "$fixture/state/pr-state"
if GH_TEST_FAIL_MERGE=1 run_wrapper >/dev/null 2>&1; then
  echo "FAIL: merge failure was reported as success" >&2
  exit 1
fi
if find "$fixture/repo/.git/agentic-workflow" -type f -name 'automerge-*' 2>/dev/null | grep -q .; then
  echo "FAIL: attempt marker survived failed merge" >&2
  exit 1
fi

printf 'PASS fullauto merge: transient marker cleaned; PR comment idempotent\n'
