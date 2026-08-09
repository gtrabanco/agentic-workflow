# Architecture notes

Ownership remains separated: planners freeze acceptance, executors write candidates, reviewers inspect immutable candidates, folders repair classified findings, audit validates delivery evidence, and only the guarded fullauto wrapper merges. The new conductor composes those owners without copying their checklists.
