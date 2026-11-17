# Feature map

> **Seeded at bootstrap, maintained by the lane's docs step.** `/init-workspace`
> copies this file to `docs/workflow/FEATURE_MAP.md` and seeds one row per
> user-facing flow from `discover-repository-state` evidence; every unit that
> adds, changes or removes a user-facing flow updates its row in the same change
> (owner: `skills/unit-lane/references/DOCS.md`). The column contract is
> `materialization@1` in the runner crate's README.

Why this exists: the repository is judged by the jobs it does for its users, and
a flow nobody can name is a flow nobody can verify. The map is the shortest
answer to three questions an agent otherwise re-derives (or guesses) every unit:

- **what exists** — the flow, in the user's words, not the module's;
- **how a user reaches it** — the entry point: a route, a command, a menu path;
- **what evidence demonstrates it** — a named check, a capture digest, a test.

A row whose evidence cell is empty is the honest state of a flow nobody has
verified yet: write it `none — <why>` rather than leaving a placeholder, and let
the lane's docs step earn the evidence later. A placeholder cell is a finding
(`materialize check` → `feature-map-shape`), never a pass.

## The map

```text
feature-map@1
```

| flow | what-exists | how-a-user-reaches-it | evidence | status |
|---|---|---|---|---|
| `<the flow in the user's words>` | `<the behaviour a user gets>` | `<route, command or menu path>` | `<a named check, a capture digest, or none — why>` | `<shipped \| partial \| planned>` |

Example rows (delete before shipping; a placeholder cell is an audit finding):

| flow | what-exists | how-a-user-reaches-it | evidence | status |
|---|---|---|---|---|
| Sign in with an email link | a passwordless session, 15-minute link | `GET /login` → "email me a link" | `artifact: screenshot` of the sent state, digest in the unit's evidence row | shipped |
| Export an account | a JSON archive of the account's own data | Settings → Data → Export | `none — no export test yet` | partial |
