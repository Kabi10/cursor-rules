# Core Rules

## Search Before You Build
Before implementing anything, search the codebase for existing solutions.
1. Search for related functionality by keyword
2. List the directory you're about to create a file in
3. Check for similar files by name pattern

Never create a new file if an existing one can be enhanced.

## Pre-Implementation Checklist
Before writing ANY code:
- [ ] I have read the files I am about to change
- [ ] I have searched for existing implementations
- [ ] I understand why a new file is needed (if creating one)
- [ ] I have a clear picture of inputs, outputs, and side effects

## Implementation Discipline
- Write the smallest change that achieves the goal.
- Do not add features, error handling, or abstractions beyond what was asked.
- Do not refactor surrounding code unless it directly blocks the task.
- Do not add comments or docstrings to code you did not write.

## Commit Hygiene
- One logical change per commit.
- Commit message describes WHY, not WHAT.
- Stage specific files — never `git add .` blindly.

## Verification
Before claiming a task is done:
1. Run the tests
2. Read the output
3. Check that the file was written / the change was applied

"It should work" is not verification. Evidence is.
