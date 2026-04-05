# Claude Code Rules

## CLAUDE.md
Every project must have a `CLAUDE.md` at the repo root. It is loaded into every Claude Code session automatically.

Sections to include:
- Build, test, and lint commands
- Architecture overview (1–2 paragraphs)
- Key file locations
- Any non-obvious conventions

## Memory System
Use `~/.claude/projects/<project>/memory/` for persistent facts across sessions.
- `user_*.md` — user profile and preferences
- `feedback_*.md` — corrections and confirmed approaches
- `project_*.md` — project goals, decisions, deadlines
- `MEMORY.md` — index file (one line per memory)

## Tool Use
- Read files before editing them — never guess at content.
- Prefer dedicated tools (Read, Edit, Grep, Glob) over Bash for file operations.
- Use parallel tool calls for independent operations.

## Commit Convention
End every commit message with:
```
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

## Rules
- Do not add features, refactor, or "improve" code beyond what was asked.
- Do not add comments or docstrings to code you did not change.
- Verify before claiming work is complete — run the tests, check the output.
