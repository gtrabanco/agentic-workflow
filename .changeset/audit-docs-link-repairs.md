---
"execute-phase": patch
"review-change": patch
---

fix(skills): point two dead references at the surfaces that own them

`execute-phase`'s pre-write mapper step cited the retired
`implementation-discovery` skill; it now cites the contract's own home,
`skills/execute-phase/references/PRE_EXECUTION_GATE.md`. `review-change`'s Turn
contract link used the authoring-only local mount instead of a path inside the
skills tree, so it resolved nowhere for a reader of the installed skill; it now
names `../orchestration-envelope/references/TURN_CONTRACT.md`, like its sibling
references.
