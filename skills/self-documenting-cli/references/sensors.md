# Sensors and guards — reading state, deciding actions

A sensor **computes** and prints; a guard **decides** and exits. Neither writes.
That is the whole contract, and it is what makes them safe to run on a tree you
are in the middle of changing.

**Flag spelling is not here.** It is `runner help <subcommand>`.

## The exit codes that are not errors

Sensors use the exit code to say *what kind of answer this is*, not *whether it
worked*. Reading these wrong is the most common way a session misbehaves:

| Exit | Meaning | What to do |
|---|---|---|
| **0** | an answer, including "degraded" or "nothing to do" | read the envelope; a degradation is a fact to report |
| **1** | a finding or a blocked state | this is the sensor's *job* — read what it named |
| **2** | a refusal or a usage error | nothing was measured; fix the invocation |

The exceptions worth memorising:

- **`needs-input`** answers 0 when the ledger is clean and 1 when it refuses a
  row — a 1 here means the unit has an open question that needs a route, not
  that the command broke.
- **`phase-lint`** answers 0 on PASS and 1 on a blocked phase **or** a usage
  error. A blocked phase prints one line per failing rule; a usage error prints
  the usage. Read which one you got before acting.

## The sensors worth running before you act

- **`workflow-status`** — the whole project's state as one envelope. It is the
  first thing to run in a fresh session and the thing to re-run after a change
  of plan. Its degradation fields are answers, not failures.
- **`test-impact`** — the set of tests a change can affect. A prose-only change
  answers `empty`; that is a legal verdict, and it means no test is invented.
- **`needs-input`** — whether the unit still has an open question. Run it before
  claiming a unit is blocked or unblocked.
- **`coverage-gap`** — declared criteria with no detector behind them. Run it
  when you are about to claim a change is *covered*.

## The guards

- **`diff-guard`** — the size ceiling on a change. It measures `git diff`, so it
  answers about the branch you are on, not the file you are editing.
- **`git-identity-check`** — refuses a commit whose identity is not the project's
  approved one. It **reads and prints; it never repairs**. A refusal is a
  configuration problem to fix at the source, never a flag to add.
- **`guard-command`** — the safety hooks' one decision. `--payload` reads a
  platform hook's stdin; `--format` names which platform's document to emit.
  Read-only: it decides, and writes nothing.

## The rule for any of them

A guard that refuses has already told you why, in its own vocabulary. Do not
translate that refusal into a workaround — the guard exists because the
workaround is the defect it was built to stop.
