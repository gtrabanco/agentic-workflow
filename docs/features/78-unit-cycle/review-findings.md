# 78-unit-cycle — review findings

<!-- review-mark@1 -->
| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| REVIEW-RAN | HEAD 5a1597c581494c5e7a91bdd8b95de5d55cb76861 | n/a | n/a | review-mark | n/a | n/a |
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

<!-- gate-ran@1 -->
| id | file:line | cmds | exit |
|---|---|---|---|
| GATE-RAN | HEAD 5a1597c581494c5e7a91bdd8b95de5d55cb76861 | node --test scripts/unit-cycle.test.mjs | exit 0 |
| GATE-RAN | HEAD 58d8ef581c13e97d4b9e777802a73dd2a6a8b1f6 | node --test scripts/unit-cycle.test.mjs | exit 0 |

<!-- debt-transform@1 -->
| id | finding | trigger | fix |
|---|---|---|---|
| D1 | F3: resolveTargetUnit() duplicates unitFolders() (code duplication) | Future change to unit folder scanning in one but not the other | Export unitFolders from unit-route.mjs; have unit-cycle.mjs import and use it |

<!-- gate-ran@1 -->
| id | file:line | cmds | exit |
|---|---|---|---|
| GATE-RAN | HEAD 58d8ef581c13e97d4b9e777802a73dd2a6a8b1f6 | node --test scripts/unit-cycle.test.mjs | exit 0 |