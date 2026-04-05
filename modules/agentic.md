# Agentic Coding Rules

## Plan Before You Build
For any task requiring 3+ file changes, write a plan first. Get approval before touching code.

## Small, Reversible Steps
- One logical change per commit.
- If a step fails, revert and diagnose before retrying.
- Never run destructive operations (reset --hard, rm -rf, DROP TABLE) without explicit user approval.

## Context Hygiene
- At the start of each task, read the files you will change. Never edit from memory.
- At the end of each task, verify: run tests, check output, confirm the file was actually written.

## Tool Discipline
- Search before creating — use Grep/Glob to check if something already exists.
- Prefer reading small focused files over large ones. If a file is >500 lines, read only the relevant section.
- Never call the same failing tool twice without changing something.

## Verification Loop
```
implement → run test → if fail: diagnose → minimal fix → run test again
                     → if pass: commit → next task
```

## Rules
- Do not retry a failing command identically — read the error first.
- Do not batch multiple unrelated changes into one commit.
- If blocked after 2 attempts, stop and ask the user — do not thrash.
