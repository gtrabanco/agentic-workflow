---
"@gtrabanco/agentic-workflow": patch
"@gtrabanco/pi-agentic-workflow": patch
---

fix(relay): the relay close-out owns the review-receipt ladder (issue #680)

A relay that ends with a coherence PASS used to end the review-receipt lane with
it: the closing leg recorded "awaiting owner decision" and the PR reached review
with no `review-change` receipt. The verdict is evidence; a receipt is a receipt,
and nothing on the relay side asked for one.

`relay check` now refuses a `Complete` verdict whose baton records no current
receipt — read from the baton's published `Review:` line, never from a forge
call, so the check stays offline and host-free. `relay closeout <unit>` renders
the ladder the last leg owes: the receipt's state, the precondition the merge
gate rests on, and exactly one `→ Next:` line — `/review-change` while the
receipt is not current, `/audit-pr` only once it is.

The shape is published as `relay-closeout@1` on the relay contract, alongside the
`Review:` row the baton grammar was missing, and `unit-lane`'s close-out ladder
names the relay leg as the receipt stage's owner for a unit that ran as legs.
