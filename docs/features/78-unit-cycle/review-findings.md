# 78-unit-cycle — review findings

<!-- review-mark@1 -->
| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| REVIEW-RAN | HEAD 5a1597c581494c5e7a91bdd8b95de5d55cb76861 | n/a | n/a | review-mark | n/a | n/a |
| REVIEW-RAN | HEAD 4e63f5ceaa3afc005356c35a5044c8c2d9f02154 | n/a | n/a | review-mark | n/a | n/a |
| F1 | unit-cycle.mjs | security | high | fix-now | fold | yes |
| VF-F1 | HEAD 58d8ef581c13e97d4b9e777802a73dd2a6a8b1f6 | security | high | verifier | sha-bound: 58d8ef581c13e97d4b9e777802a73dd2a6a8b1f6 | n/a |
| F2 | unit-cycle.test.mjs | verify | high | fix-now | fold | yes |
| VF-F2 | HEAD 58d8ef581c13e97d4b9e777802a73dd2a6a8b1f6 | verify | high | verifier | sha-bound: 58d8ef581c13e97d4b9e777802a73dd2a6a8b1f6 | n/a |
| F3 | unit-cycle.mjs,unit-route.mjs | code | med | fix-now | fold | yes |
| VF-F3 | HEAD 58d8ef581c13e97d4b9e777802a73dd2a6a8b1f6 | code | med | verifier | sha-bound: 58d8ef581c13e97d4b9e777802a73dd2a6a8b1f6 | n/a |
| F4 | unit-cycle.mjs | security | med | fix-now | fold | yes |
| VF-F4 | HEAD 58d8ef581c13e97d4b9e777802a73dd2a6a8b1f6 | security | med | verifier | sha-bound: 58d8ef581c13e97d4b9e777802a73dd2a6a8b1f6 | n/a |
| F5 | unit-cycle.test.mjs | verify | med | fix-now | fold | yes |
| VF-F5 | HEAD 58d8ef581c13e97d4b9e777802a73dd2a6a8b1f6 | verify | med | verifier | sha-bound: 58d8ef581c13e97d4b9e777802a73dd2a6a8b1f6 | n/a |
| F6 | unit-cycle.mjs:42 | code | med | fix-now | fold | yes |
| F7 | unit-cycle.mjs:273 | code | med | fix-now | fold | yes |
| F8 | unit-cycle.mjs:674 | security | med | fix-now | fold | yes |

<!-- gate-ran@1 -->
| id | file:line | cmds | exit |
|---|---|---|---|
| GATE-RAN | HEAD 5a1597c581494c5e7a91bdd8b95de5d55cb76861 | node --test scripts/unit-cycle.test.mjs | exit 0 |
| GATE-RAN | HEAD 58d8ef581c13e97d4b9e777802a73dd2a6a8b1f6 | node --test scripts/unit-cycle.test.mjs | exit 0 |

<!-- debt-transform@1 -->
| id | finding | trigger | fix |
|---|---|---|---|
| D1 | F3: resolveTargetUnit() duplicates unitFolders() (code duplication) | Future change to unit folder scanning in one but not the other | Export unitFolders from unit-route.mjs; have unit-cycle.mjs import and use it |
| D2 | F6 + F7: dead unitFolders import + resolveTargetUnit() reimplementation (code duplication) | Any future refactoring that changes folder scanning in one place but not the other; new unit added via docs/fix/ | Use the exported unitFolders() from unit-route.mjs instead of the manual readdirSync loop; remove dead import |
| D3 | F8: error?.stack leak to stderr | Any unhandled error in the delivery loop exposes internal paths | Replace error?.stack with error?.message; strip or basename internal paths before printing |

<!-- gate-ran@1 -->
| id | file:line | cmds | exit |
|---|---|---|---|
| GATE-RAN | HEAD 58d8ef581c13e97d4b9e777802a73dd2a6a8b1f6 | node --test scripts/unit-cycle.test.mjs | exit 0 |
| GATE-RAN | HEAD 4e63f5ceaa3afc005356c35a5044c8c2d9f02154 | node --test scripts/*.test.mjs | exit 0 · 811 pass / 0 fail |