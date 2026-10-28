# shell-and-args — the doc-sourced execution fixture

> Fixture for review F14/F17 (`scripts/promise-coherence.mjs`). A unit doc's
> validator cell is executed by the gate at the head: the reader path split on
> shell composition only at `;`/`&&`/`||`/`$( `/`>`/`<`, so a single `|` into
> any interpreter, an unquoted `$` expansion, and a backticked substitution
> all ran. The runner class allowlisted the *script* but not its *arguments*,
> so `--root <any-dir>` pointed a report validator at arbitrary tree content.
> The three refusal rows below must be refused by name and never executed —
> the first writes a marker file if it ever reaches a shell. The three control
> rows must keep running: quoted alternation, a reader→reader pipeline, and a
> plain `test` are literal arguments, not shell surface.

## Tasks

- P1 — Refuse the piped interpreter (validator: `cat README.md | node -e "require('fs').writeFileSync('scripts/fixtures/promise-coherence/.f14-marker', 'pwned')"` exits 0)

- P2 — Refuse the unquoted expansion (validator: `grep -c $HOME README.md` exits 1)

- P3 — Refuse the quoted expansion (validator: `grep -c "a$$b" README.md` exits 1)

- P4 — Keep the quoted alternation (validator: `grep -E "agentic|workflow" README.md` exits 0)

- P5 — Keep the reader pipeline (validator: `ls scripts | wc -l` exits 0)

- P6 — Keep the plain test (validator: `test -f README.md` exits 0)

- P7 — Refuse the absolute validator root (validator: `bun scripts/vocabulary-probe.mjs --root /home` exits 0)

- P8 — Refuse the escaping validator root (validator: `bun scripts/vocabulary-probe.mjs --root ../..` exits 0)
