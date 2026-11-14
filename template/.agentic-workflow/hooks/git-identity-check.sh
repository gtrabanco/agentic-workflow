#!/usr/bin/env bash
#
# git-identity-check.sh — a pre-commit hook that refuses a commit whose resolved
# author or committer is not the project's approved identity (issue #514 S3).
#
# Layer 2 exists because Layer 1 (the pi guard) cannot see a process it did not
# launch: a test suite, a script, a `!` command, another agent host. Three of the
# three recorded leaks in the repository this ships from were produced that way,
# and every one of them was signed with the owner's key — a valid signature says
# nothing about attribution.
#
# One profile, one file: `gitIdentity` in `.pi/agentic-workflow.json` (project)
# over `$PI_CODING_AGENT_DIR/agentic-workflow.json` (global). The same section is
# read by the pi agent guard and by the push-range check
# (`scripts/push-identity-check.mjs`); this script and that one are two
# implementations of one contract, pinned by a shared corpus.
#
# What the profile asks of a *commit* is a declared scope (issue #546): the
# `commit*` values run this hook, the `push*` values leave it to the push-range
# check. Signing is declared too — `signing: "required"` refuses an unsigned
# commit, `"allowed"` (the default) lets a machine whose signing key does not
# resolve commit (gpg selects by UID), and `"off"` is the sign-off workflow that
# approves unsigned commits and refuses a signed one. `signingKeys` is the
# per-machine form of `signingKey`.
#
# The rule is read-only by construction: it reads git config, reads the profile,
# and prints. It never repairs, never rewrites, never retries — the repair text it
# prints is the operator's to run.
#
# Install (by consent, never by default):
#   ln -s ../../.agentic-workflow/hooks/git-identity-check.sh .git/hooks/pre-commit
#   # or chain it from an existing pre-commit hook:
#   .agentic-workflow/hooks/git-identity-check.sh || exit 1
#
# Exit: 0 the commit may proceed (or the project enforces nothing on commit);
# 1 the identity, the signing key or the profile is not what the project
# approved — the commit is refused.
#
# Requirements: git, jq. `gpg` only when commit.gpgsign is true with the default
# format. A missing requirement is named — the message says which tool is absent,
# never that the profile is invalid. Keep this file portable POSIX-ish bash: a git hook runs with no
# guarantee about PATH beyond the platform's shell.

set -u

hook_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
root=$(git rev-parse --show-toplevel 2>/dev/null || true)
if [ -z "$root" ]; then
  root=$(CDPATH='' cd -- "$hook_dir/../.." 2>/dev/null && pwd) || root="."
fi

project_file="$root/.pi/agentic-workflow.json"
global_file="${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/agentic-workflow.json"

fail() {
  printf 'agentic-workflow git identity: %s\n' "$1" >&2
}

# The repair block every failure prints. These are the *correct* forms: the
# 2026-11-03 repair ran `git config user.name --unset`, whose inverted argument
# order sets the literal value "--unset" instead of unsetting anything.
repair() {
  printf '%s\n' \
    'repair (never automatic):' \
    '  git config --show-origin --get-all user.name' \
    '  git config --show-origin --get-all user.email' \
    '  git config --unset user.name    # only when a stale local value shadows the approved one' \
    '  git var GIT_AUTHOR_IDENT' \
    '  git var GIT_COMMITTER_IDENT' >&2
}

# JSONC with one documented rule, shared with scripts/push-identity-check.mjs:
# full-line `//` comments, `/* … */` blocks and trailing commas are accepted.
# A string's own `//` survives because the awk state machine tracks quotes.
jsonc() {
  awk '
    BEGIN { inblock = 0; instr = 0; buffer = "" }
    {
      line = ""
      i = 1
      n = length($0)
      while (i <= n) {
        c = substr($0, i, 1)
        d = substr($0, i, 2)
        if (inblock) {
          if (d == "*/") { inblock = 0; i += 2; continue }
          i += 1
          continue
        }
        if (instr) {
          if (c == "\\") { line = line c substr($0, i + 1, 1); i += 2; continue }
          if (c == "\"") { instr = 0 }
          line = line c
          i += 1
          continue
        }
        if (c == "\"") { instr = 1; line = line c; i += 1; continue }
        if (d == "/*") { inblock = 1; i += 2; continue }
        if (d == "//" && (i == 1 || substr($0, 1, i - 1) ~ /^[[:space:]]*$/)) { break }
        line = line c
        i += 1
      }
      buffer = buffer line "\n"
    }
    END {
      # A trailing comma is dropped only where a closer follows it, across lines.
      while (match(buffer, /,[[:space:]]*[}\]]/)) {
        closer = substr(buffer, RSTART + RLENGTH - 1, 1)
        buffer = substr(buffer, 1, RSTART - 1) " " closer substr(buffer, RSTART + RLENGTH)
      }
      printf "%s", buffer
    }
  ' "$1"
}

merged='{}'
found_any=0
for file in "$global_file" "$project_file"; do
  [ -f "$file" ] || continue
  found_any=1
  if ! command -v jq >/dev/null 2>&1; then
    fail "jq is not installed, so $file cannot be read and the commit is refused; install jq, or set enforce to off"
    exit 1
  fi
  parsed=$(jsonc "$file" | jq -c '.' 2>/dev/null) || {
    fail "$file is not valid JSON/JSONC; the approved identity cannot be read, so the commit is refused"
    exit 1
  }
  merged=$(printf '%s\n%s\n' "$merged" "$parsed" | jq -sc '.[0] * .[1]')
done

if [ "$found_any" -eq 0 ]; then
  exit 0
fi

section=$(printf '%s' "$merged" | jq -c '.gitIdentity // {}')
if [ "$section" = "{}" ]; then
  exit 0
fi

enforce=$(printf '%s' "$section" | jq -r '.enforce // "off"')
case "$enforce" in
  off | push | push-upstream)
    exit 0
    ;;
  commit | commit-and-push | commit-and-push-upstream) ;;
  *)
    fail "gitIdentity.enforce is \"$enforce\", which is not off, commit, push, push-upstream, commit-and-push or commit-and-push-upstream"
    exit 1
    ;;
esac

approved_name=$(printf '%s' "$section" | jq -r '.approved.name // ""')
approved_email=$(printf '%s' "$section" | jq -r '.approved.email // ""')
approved_full_name=$(printf '%s' "$section" | jq -r '.approved.fullName // ""')
approved_format=$(printf '%s' "$section" | jq -r '.approved.format // ""')
approved_key=$(printf '%s' "$section" | jq -r '.approved.signingKey // ""')

if [ -z "$approved_name" ] && [ -z "$approved_email" ]; then
  fail "gitIdentity.enforce is \"$enforce\" but gitIdentity.approved declares no name or email; declare the approved identity or set enforce to off"
  exit 1
fi

ident_name() {
  printf '%s' "$1" | sed -e 's/ [0-9][0-9]* [-+][0-9][0-9]*$//' -e 's/ <.*$//'
}
ident_email() {
  printf '%s' "$1" | sed -e 's/^.*<//' -e 's/>.*$//'
}

check_ident() {
  local role="$1" ident="$2" name email
  name=$(ident_name "$ident")
  email=$(ident_email "$ident")
  local ok=1
  if [ -n "$approved_name" ]; then
    [ "${name,,}" = "${approved_name,,}" ] || ok=0
  fi
  if [ -n "$approved_email" ]; then
    [ "${email,,}" = "${approved_email,,}" ] || ok=0
  fi
  if [ "$ok" -eq 1 ]; then
    return 0
  fi
  fail "the resolved $role is not the approved identity"
  printf '  %s: %s <%s>\n' "$role" "$name" "$email" >&2
  if [ -n "$approved_name" ] || [ -n "$approved_email" ]; then
    printf '  approved: %s <%s>\n' "${approved_name:-<any name>}" "${approved_email:-<any email>}" >&2
  fi
  repair
  exit 1
}

author_ident=$(git var GIT_AUTHOR_IDENT 2>/dev/null) || {
  fail "git var GIT_AUTHOR_IDENT failed; the identity cannot be verified, so the commit is refused"
  exit 1
}
committer_ident=$(git var GIT_COMMITTER_IDENT 2>/dev/null) || {
  fail "git var GIT_COMMITTER_IDENT failed; the identity cannot be verified, so the commit is refused"
  exit 1
}
check_ident author "$author_ident"
check_ident committer "$committer_ident"

# A verified identity signed with a key that is not there is still a commit the
# operator cannot reproduce: check the key while signing is on — as strictly as
# the declared policy asks (issue #546).
approved_signing=$(printf '%s' "$section" | jq -r '.approved.signing // "allowed"')
case "$approved_signing" in
  required | allowed | off) ;;
  *)
    fail "gitIdentity.approved.signing is \"$approved_signing\", which is not required, allowed or off"
    exit 1
    ;;
esac

gpgsign=$(git config --get commit.gpgsign 2>/dev/null || true)

if [ "$approved_signing" = "off" ]; then
  # The sign-off workflow: the project approves unsigned commits, so a signed one
  # is the surprise this hook exists to name.
  if [ "$gpgsign" = "true" ]; then
    fail "gitIdentity.approved.signing is \"off\" but commit.gpgsign is true; this project approves unsigned commits — disable signing for this repository"
    repair
    exit 1
  fi
  exit 0
fi

if [ "$approved_signing" = "required" ] && [ "$gpgsign" != "true" ]; then
  fail "gitIdentity.approved.signing is \"required\" but commit.gpgsign is not true; the commit would carry no signature"
  repair
  exit 1
fi

if [ "$gpgsign" = "true" ]; then
  format=$(git config --get gpg.format 2>/dev/null || true)
  format=${format:-openpgp}
  resolved_key=$(git config --get user.signingKey 2>/dev/null || true)

  if [ -n "$approved_format" ] && [ "$approved_format" != "$format" ]; then
    fail "signing format is \"$format\" but the approved format is \"$approved_format\""
    exit 1
  fi

  if [ -z "$resolved_key" ]; then
    # `allowed` is the second-machine case: git resolves the key from the keyring
    # by UID, so an unset user.signingKey is not a broken configuration.
    if [ "$approved_signing" = "required" ]; then
      fail "commit.gpgsign is true but no user.signingKey is configured; the commit would fail or sign with an unapproved key"
      repair
      exit 1
    fi
    exit 0
  fi

  if [ "$format" = "ssh" ]; then
    key_path=${resolved_key/#\~/$HOME}
    if [ ! -f "$key_path" ]; then
      fail "commit.gpgsign is true and the SSH signing key \"$resolved_key\" does not exist"
      repair
      exit 1
    fi
    if [ -n "$approved_full_name" ]; then
      fail "gitIdentity.approved.fullName cannot be verified against an SSH key ($resolved_key); declare the approved key in signingKey instead, or set enforce to off"
      exit 1
    fi
  else
    if ! command -v gpg >/dev/null 2>&1; then
      fail "commit.gpgsign is true and gpg is not installed; the signing key cannot be verified, so the commit is refused"
      exit 1
    fi
    if ! gpg --list-secret-keys --with-colons "$resolved_key" >/dev/null 2>&1; then
      fail "commit.gpgsign is true and the signing key \"$resolved_key\" is not in the secret keyring"
      repair
      exit 1
    fi
    if [ -n "$approved_full_name" ]; then
      uids=$(gpg --list-keys --with-colons "$resolved_key" 2>/dev/null | awk -F: '$1 == "uid" { print $10 }')
      if ! printf '%s\n' "$uids" | grep -Fi -- "$approved_full_name" >/dev/null 2>&1; then
        fail "the signing key's UID does not carry the approved full name \"$approved_full_name\""
        exit 1
      fi
    fi
  fi

  # One key or many (one per machine): the resolved key must match any declared.
  approved_keys=$(printf '%s' "$section" | jq -r '((.approved.signingKeys // []) + (if ((.approved.signingKey // "") | length) > 0 then [.approved.signingKey] else [] end))[]' 2>/dev/null || true)
  if [ -n "$approved_keys" ]; then
    resolved_lower=${resolved_key,,}
    key_ok=0
    while IFS= read -r candidate; do
      [ -n "$candidate" ] || continue
      candidate_lower=${candidate,,}
      case "$resolved_lower" in
        *"$candidate_lower"*) key_ok=1 ;;
      esac
    done <<KEYLIST
$approved_keys
KEYLIST
    if [ "$key_ok" -ne 1 ]; then
      fail "the resolved signing key \"$resolved_key\" is not one of the approved keys: $(printf '%s' "$approved_keys" | tr '\n' ' ')"
      repair
      exit 1
    fi
  fi
fi

exit 0
