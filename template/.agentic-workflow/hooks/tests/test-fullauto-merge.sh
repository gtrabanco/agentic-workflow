#!/usr/bin/env bash

set -euo pipefail

hooks_dir=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
wrapper="$hooks_dir/fullauto-merge.sh"
fixture=$(mktemp -d "${TMPDIR:-/tmp}/agentic-workflow-fullauto.XXXXXX")
trap 'rm -rf "$fixture"' EXIT HUP INT TERM

mkdir -p "$fixture/bin" "$fixture/repo/docs/features" "$fixture/state"
git -C "$fixture" init -q --bare remote.git
git -C "$fixture/repo" init -q -b main
identity=(-c user.name=fixture -c user.email=fixture@example.invalid -c commit.gpgsign=false)
printf 'fixture\n' > "$fixture/repo/README.md"
printf 'merge: fullauto\n' > "$fixture/repo/docs/features/SHIP_DECISIONS.md"
git -C "$fixture/repo" add README.md docs/features/SHIP_DECISIONS.md
git -C "$fixture/repo" "${identity[@]}" commit -qm fixture
git -C "$fixture/repo" remote add origin "$fixture/remote.git"
git -C "$fixture/repo" push -qu origin main
git -C "$fixture/repo" switch -qc feat/fixture
printf 'feature\n' >> "$fixture/repo/README.md"
git -C "$fixture/repo" "${identity[@]}" commit -qam feature
git -C "$fixture/repo" push -qu origin feat/fixture
head_sha=$(git -C "$fixture/repo" rev-parse HEAD)
printf 'OPEN\n' > "$fixture/state/pr-state"
printf '0\n' > "$fixture/state/comments"
printf '0\n' > "$fixture/state/merges"
printf '\n' > "$fixture/state/method"
printf 'main\n' > "$fixture/state/base"
printf 'SUCCESS\n' > "$fixture/state/checks"

sed "s/__HEAD__/$head_sha/g" > "$fixture/bin/gh" <<'FIXTURE'
#!/usr/bin/env bash
set -euo pipefail
state_dir=${GH_TEST_STATE:?}
if [ "$1 $2" = "pr view" ]; then
  state=$(cat "$state_dir/pr-state")
  comments=$(cat "$state_dir/comments")
  checks=$(cat "$state_dir/checks")
  base=$(cat "$state_dir/base")
  bodies='[]'
  if [ "$comments" -gt 0 ]; then
    bodies='[{"body":"<!-- agentic-workflow:automerge head=__HEAD__ -->"}]'
  fi
  if [ "${GH_TEST_AUDIT:-1}" = "stale" ]; then
    bodies='[{"body":"<!-- audit-pr:merge-ready sha=deadbeef -->"}]'
  elif [ "${GH_TEST_AUDIT:-1}" = "1" ]; then
    if [ "$comments" -gt 0 ]; then
      bodies='[{"body":"<!-- agentic-workflow:automerge head=__HEAD__ -->"},{"body":"<!-- audit-pr:merge-ready sha=__HEAD__ -->"}]'
    else
      bodies='[{"body":"<!-- audit-pr:merge-ready sha=__HEAD__ -->"}]'
    fi
  fi
  status='[]'
  if [ "$checks" != "NONE" ]; then
    status="[{\"conclusion\":\"$checks\"}]"
  fi
  if printf '%s\n' "$*" | grep -q 'mergeCommit'; then
    printf '{"number":12,"url":"https://example.invalid/pr/12","state":"%s","baseRefName":"%s","headRefOid":"__HEAD__","mergeable":"MERGEABLE","statusCheckRollup":%s,"comments":%s,"mergeCommit":{"oid":"abc1234"}}\n' "$state" "$base" "$status" "$bodies"
  else
    printf '{"number":12,"url":"https://example.invalid/pr/12","state":"%s","baseRefName":"%s","headRefOid":"__HEAD__","mergeable":"MERGEABLE","statusCheckRollup":%s,"comments":%s}\n' "$state" "$base" "$status" "$bodies"
  fi
  exit 0
fi
if [ "$1 $2" = "repo view" ]; then
  printf '{"nameWithOwner":"acme/app","defaultBranchRef":{"name":"main"}}\n'
  exit 0
fi
if [ "$1" = "api" ]; then
  printf '{"content":"%s"}\n' "$(printf 'merge: fullauto\n' | base64 | tr -d '\n')"
  exit 0
fi
if [ "$1 $2" = "pr merge" ]; then
  [ "${GH_TEST_FAIL_MERGE:-0}" = "0" ] || exit 1
  printf '%s\n' "$*" > "$state_dir/method"
  printf 'MERGED\n' > "$state_dir/pr-state"
  printf '%s\n' "$(( $(cat "$state_dir/merges") + 1 ))" > "$state_dir/merges"
  exit 0
fi
if [ "$1 $2" = "pr comment" ]; then
  printf '%s\n' "$*" > "$state_dir/comment.argv"
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
    "$wrapper" --pr 12 --run-id fixture-run)
}

missing_value=$({ "$wrapper" --pr; } 2>&1 || true)
printf '%s' "$missing_value" | grep -q -- '--pr requires a value'

run_wrapper >/dev/null
[ "$(cat "$fixture/state/comments")" = "1" ]
[ "$(cat "$fixture/state/merges")" = "1" ]
grep -q -- '--merge' "$fixture/state/method"
if find "$fixture/repo/.git/agentic-workflow" -type f -name 'automerge-*' 2>/dev/null | grep -q .; then
  echo "FAIL: attempt marker survived successful merge" >&2
  exit 1
fi

# A retry reconciles the already-merged PR and does not duplicate its comment.
run_wrapper >/dev/null
[ "$(cat "$fixture/state/comments")" = "1" ]
[ "$(cat "$fixture/state/merges")" = "1" ]

for case_name in unauthorized-audit stale-audit foreign-base failed-ci stale-local-gate; do
  printf 'OPEN\n' > "$fixture/state/pr-state"
  printf '0\n' > "$fixture/state/merges"
  case "$case_name" in
    unauthorized-audit) GH_TEST_AUDIT=0 run_wrapper >/dev/null 2>&1 && exit 1 || true ;;
    stale-audit) GH_TEST_AUDIT=stale run_wrapper >/dev/null 2>&1 && exit 1 || true ;;
    foreign-base) printf 'develop\n' > "$fixture/state/base"; run_wrapper >/dev/null 2>&1 && exit 1 || true; printf 'main\n' > "$fixture/state/base" ;;
    failed-ci) printf 'FAILURE\n' > "$fixture/state/checks"; run_wrapper >/dev/null 2>&1 && exit 1 || true; printf 'SUCCESS\n' > "$fixture/state/checks" ;;
    stale-local-gate) printf 'NONE\n' > "$fixture/state/checks"; AGENTIC_WORKFLOW_LOCAL_GATE_SHA=deadbeef run_wrapper >/dev/null 2>&1 && exit 1 || true; printf 'SUCCESS\n' > "$fixture/state/checks" ;;
  esac
  [ "$(cat "$fixture/state/merges")" = "0" ]
done

# The check_count=0 branch must still merge when a fresh local gate SHA matches.
printf 'OPEN\n' > "$fixture/state/pr-state"
printf '0\n' > "$fixture/state/merges"
printf 'NONE\n' > "$fixture/state/checks"
AGENTIC_WORKFLOW_LOCAL_GATE_SHA="$head_sha" run_wrapper >/dev/null
[ "$(cat "$fixture/state/merges")" = "1" ]
printf 'SUCCESS\n' > "$fixture/state/checks"

printf 'OPEN\n' > "$fixture/state/pr-state"
printf '0\n' > "$fixture/state/merges"
if GH_TEST_FAIL_MERGE=1 run_wrapper >/dev/null 2>&1; then
  echo "FAIL: merge failure was reported as success" >&2
  exit 1
fi

if [ "$(cat "$fixture/state/merges")" != "0" ]; then
  echo "FAIL: failed merge invoked fake merge unexpectedly" >&2
  exit 1
fi
if find "$fixture/repo/.git/agentic-workflow" -type f -name 'automerge-*' 2>/dev/null | grep -q .; then
  echo "FAIL: attempt marker survived failed merge" >&2
  exit 1
fi


# ══════════════════════════════════════════════════════════════════════════
# Issue #546 — the pushed remote and the forge matrix
# ══════════════════════════════════════════════════════════════════════════

mkdir -p "$fixture/forge-state"
export GH_TEST_STATE="$fixture/forge-state"

# The GitLab and Gitea stubs answer the adapter's documented argv.
cat > "$fixture/bin/glab" <<'FIXTURE'
#!/usr/bin/env bash
set -euo pipefail
state_dir=${GH_TEST_STATE:?}
printf '%s\n' "$*" >> "$state_dir/glab.argv"
case "$1 $2" in
  "mr view") cat "$state_dir/glab.mr" ;;
  "repo view") printf '{"default_branch":"main"}\n' ;;
  api) cat "$state_dir/glab.notes" ;;
  "mr merge") printf 'MERGED\n' > "$state_dir/glab.merged" ;;
  *) printf 'unsupported fake glab call: %s\n' "$*" >&2; exit 2 ;;
esac
FIXTURE
chmod +x "$fixture/bin/glab"

cat > "$fixture/bin/gt" <<'FIXTURE'
#!/usr/bin/env bash
set -euo pipefail
state_dir=${GH_TEST_STATE:?}
printf '%s\n' "$*" >> "$state_dir/gt.argv"
case "$1 $2" in
  "pr view") cat "$state_dir/gt.pr" ;;
  "repo view") printf '{"default_branch":"main"}\n' ;;
  "pr merge") printf 'MERGED\n' > "$state_dir/gt.merged" ;;
  *) printf 'unsupported fake gt call: %s\n' "$*" >&2; exit 2 ;;
esac
FIXTURE
chmod +x "$fixture/bin/gt"

# new_forge_repo <name> <remote-url>: a clean pushed branch whose origin is a
# forge URL rather than a filesystem path.
new_forge_repo() {
  local name=$1 url=$2 dir="$fixture/forge-$1"
  git init -q --bare "$fixture/$name-remote.git"
  git init -q -b main "$dir"
  printf 'fixture\n' > "$dir/README.md"
  printf 'merge: fullauto\n' > "$dir/SHIP_DECISIONS.md"
  git -C "$dir" "${identity[@]}" add README.md SHIP_DECISIONS.md
  git -C "$dir" "${identity[@]}" commit -qm fixture
  git -C "$dir" remote add origin "$fixture/$name-remote.git"
  git -C "$dir" "${identity[@]}" push -qu origin main
  git -C "$dir" switch -qc feat/fixture
  printf 'feature\n' >> "$dir/README.md"
  git -C "$dir" "${identity[@]}" commit -qam feature
  git -C "$dir" "${identity[@]}" push -qu origin feat/fixture
  git -C "$dir" remote set-url origin "$url"
  printf '%s' "$(git -C "$dir" rev-parse HEAD)"
}

run_forge() {
  local dir=$1
  shift
  (cd "$dir" && PATH="$fixture/bin:$PATH" GH_TEST_STATE="$fixture/forge-state" \
    "$wrapper" --pr 12 --run-id fixture-run "$@")
}

# ---- the `--remote` flag names the remote box4-equivalent facts come from ----
forge_head=$(new_forge_repo remote "$fixture/remote-again.git")
cp "$fixture/state/checks" "$fixture/forge-state/checks"
printf 'SUCCESS\n' > "$fixture/forge-state/checks"
printf 'OPEN\n' > "$fixture/forge-state/pr-state"
printf '0\n' > "$fixture/forge-state/comments"
printf '0\n' > "$fixture/forge-state/merges"

run_forge "$fixture/forge-remote" --remote origin >/dev/null
[ "$(cat "$fixture/forge-state/merges")" = "1" ]

printf 'OPEN\n' > "$fixture/forge-state/pr-state"
printf '0\n' > "$fixture/forge-state/merges"
if run_forge "$fixture/forge-remote" --remote nowhere >/dev/null 2>&1; then
  echo "FAIL: an unknown --remote was accepted" >&2
  exit 1
fi
[ "$(cat "$fixture/forge-state/merges")" = "0" ]

# ---- GitLab: glab answers the view, the notes and the merge ----------------
glab_head=$(new_forge_repo gitlab https://gitlab.com/acme/app.git)
printf 'OPEN\n' > "$fixture/forge-state/pr-state"
printf '0\n' > "$fixture/forge-state/merges"
printf '{"iid":12,"web_url":"https://gitlab.com/acme/app/-/merge_requests/12","state":"opened","target_branch":"main","sha":"%s","merge_status":"can_be_merged","draft":false,"head_pipeline":{"status":"success"}}\n' "$glab_head" > "$fixture/forge-state/glab.mr"
printf '[{"body":"<!-- audit-pr:merge-ready sha=%s -->"}]\n' "$glab_head" > "$fixture/forge-state/glab.notes"
: > "$fixture/forge-state/glab.argv"
rm -f "$fixture/forge-state/glab.merged"

run_forge "$fixture/forge-gitlab" --remote origin >/dev/null
if [ -f "$fixture/forge-state/glab.merged" ]; then :; else
  echo "FAIL: gitlab MR was not merged through glab" >&2
  exit 1
fi
if grep -q -- "mr merge 12 --sha $glab_head" "$fixture/forge-state/glab.argv"; then :; else
  echo "FAIL: gitlab merge is not SHA-bound" >&2
  sed 's/^/    /' "$fixture/forge-state/glab.argv" >&2
  exit 1
fi

# A stale audit marker on the MR notes is refused before any merge call.
rm -f "$fixture/forge-state/glab.merged"
printf '[{"body":"<!-- audit-pr:merge-ready sha=deadbeef -->"}]\n' > "$fixture/forge-state/glab.notes"
if run_forge "$fixture/forge-gitlab" --remote origin >/dev/null 2>&1; then
  echo "FAIL: a stale gitlab audit marker was accepted" >&2
  exit 1
fi
[ ! -f "$fixture/forge-state/glab.merged" ]
printf '[{"body":"<!-- audit-pr:merge-ready sha=%s -->"}]\n' "$glab_head" > "$fixture/forge-state/glab.notes"

# ---- Gitea: gt answers the view and the merge ------------------------------
gitea_head=$(new_forge_repo gitea https://gitea.com/acme/app.git)
printf 'OPEN\n' > "$fixture/forge-state/pr-state"
printf '0\n' > "$fixture/forge-state/merges"
printf '{"number":12,"url":"https://gitea.com/acme/app/pulls/12","state":"open","base":"main","head_sha":"%s","mergeable":true,"draft":false,"merged":false,"comments":[{"body":"<!-- audit-pr:merge-ready sha=%s -->"}]}\n' "$gitea_head" "$gitea_head" > "$fixture/forge-state/gt.pr"
: > "$fixture/forge-state/gt.argv"
rm -f "$fixture/forge-state/gt.merged"

run_forge "$fixture/forge-gitea" --remote origin >/dev/null
if [ -f "$fixture/forge-state/gt.merged" ]; then :; else
  echo "FAIL: gitea PR was not merged through gt" >&2
  exit 1
fi

# ---- the forges without a carrier are refused, never merged --------------
bitbucket_head=$(new_forge_repo bitbucket https://bitbucket.org/acme/app.git)
printf 'OPEN\n' > "$fixture/forge-state/pr-state"
printf '0\n' > "$fixture/forge-state/merges"
if run_forge "$fixture/forge-bitbucket" --remote origin >/dev/null 2>&1; then
  echo "FAIL: bitbucket was merged without a carrier" >&2
  exit 1
fi
[ "$(cat "$fixture/forge-state/merges")" = "0" ]

# ---- the override wins over the host, and an absent CLI fails closed ------
printf '{"number":12,"url":"https://gitlab.com/acme/app/-/merge_requests/12","state":"open","base":"main","head_sha":"%s","mergeable":true,"draft":false,"merged":false,"comments":[{"body":"<!-- audit-pr:merge-ready sha=%s -->"}]}\n' "$glab_head" "$glab_head" > "$fixture/forge-state/gt.pr"
rm -f "$fixture/forge-state/gt.merged"
run_forge "$fixture/forge-gitlab" --remote origin --forge gitea >/dev/null
[ -f "$fixture/forge-state/gt.merged" ]

printf 'OPEN\n' > "$fixture/forge-state/pr-state"
printf '0\n' > "$fixture/forge-state/merges"
rm -f "$fixture/forge-state/gt.merged"
missing_output=$( cd "$fixture/forge-gitlab" && PATH="$fixture/only-gh:$PATH" GH_TEST_STATE="$fixture/forge-state" \
  "$wrapper" --pr 12 --run-id fixture-run --remote origin --forge gitea 2>&1 ) && exit 1 || true
printf '%s' "$missing_output" | grep -q 'gt'

# ---- the comment file lands in the resolved temp directory ---------------
mkdir -p "$fixture/tmpdir"
printf 'OPEN\n' > "$fixture/state/pr-state"
printf '0\n' > "$fixture/state/merges"
printf '0\n' > "$fixture/state/comments"
printf 'SUCCESS\n' > "$fixture/state/checks"
( cd "$fixture/repo" && PATH="$fixture/bin:$PATH" GH_TEST_STATE="$fixture/state" TMPDIR="$fixture/tmpdir" \
  "$wrapper" --pr 12 --run-id fixture-run ) >/dev/null
if grep -q -- "--body-file $fixture/tmpdir/" "$fixture/state/comment.argv"; then :; else
  echo "FAIL: the comment file did not use TMPDIR" >&2
  sed 's/^/    /' "$fixture/state/comment.argv" >&2
  exit 1
fi

printf 'PASS fullauto merge: transient marker cleaned; PR comment idempotent\n'
