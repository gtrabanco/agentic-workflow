# 99 — skip-surface

> Frozen-failure fixture · issue #305 · the disclosed gap: a document whose
> validators are commands this pass refuses to execute prints one `skip:` line
> each and still reports the claim it did check. "Not executed" is visible, never
> a pass.

## Tasks

- P1 — Retain the triage block as the authoritative step list (validator: `node scripts/unit-route.mjs --triage 99-skip-surface` exits 0)

- P2 — Keep the suite green (validator: `node --test scripts/promise-coherence.test.mjs` exits 0)

- P3 — Keep the guard prose cited from the section (`grep -q "Inputs" skills/execute-phase/SKILL.md` — pointer text)

- P4 — Keep the sample count pinned (validator: `grep -c "Q" scripts/fixtures/promise-coherence/changelog-sample.md` matches 7)
