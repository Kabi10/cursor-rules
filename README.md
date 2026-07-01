<div align="center">

# cursor-compose

**Stop hand-writing AI coding rules. Detect your stack, generate them — for every tool.**

One command scans your project, detects your frameworks, and writes a tailored rules file. Output a portable **`AGENTS.md`** (read by Cursor, Copilot, Codex & Claude Code) or Cursor's native `.cursor/rules/*.mdc` — from one source.

[![npm version](https://img.shields.io/npm/v/cursor-compose.svg)](https://www.npmjs.com/package/cursor-compose)
[![CI](https://github.com/Kabi10/cursor-rules/actions/workflows/ci.yml/badge.svg)](https://github.com/Kabi10/cursor-rules/actions/workflows/ci.yml)
[![Node](https://img.shields.io/node/v/cursor-compose.svg)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

```bash
npx cursor-compose --agents     # → AGENTS.md, works across every major AI editor
```

<!--
  ⚠️ ADD A DEMO GIF HERE — the #1 thing that converts a visitor into a star.
  Record with https://github.com/charmbracelet/vhs (scriptable) or asciinema + agg.
  Show: run command → detected modules → toggle one → file written. Then update the path below.
-->
![demo](docs/demo.gif)

---

## Why

Everyone is pasting the same recycled rules files between projects. They go stale, they don't match your actual stack, and every editor wants its own format.

`cursor-compose` reads your **real dependencies** (`package.json`, `requirements.txt`, `pubspec.yaml`) and composes a rules file from modular, stack-specific building blocks — and writes it as the portable **`AGENTS.md`** standard so the same source works in Cursor, Copilot, Codex and Claude Code. Zero config to start.

## Usage

```bash
# In your project root:
npx cursor-compose            # default → per-module .cursor/rules/*.mdc
npx cursor-compose --agents   # → AGENTS.md (portable, cross-tool)
npx cursor-compose --all      # → both .mdc and AGENTS.md, one pass
```

It will:
1. **Scan** your project for dependency files.
2. **Show** the modules it detected and let you toggle optional ones.
3. **Write** your chosen output(s).

No install, no config file required.

### Flags

| Flag | Output |
|---|---|
| _(default)_ | per-module `.cursor/rules/*.mdc` (current Cursor format) |
| `--agents` | `AGENTS.md` at repo root — portable across Cursor, Copilot, Codex, Claude Code |
| `--all` | both `.mdc` and `AGENTS.md` in one pass |
| `--legacy` | a single `.cursorrules` file |
| `--yes`, `-y` | non-interactive: use detected modules, no prompts (great for CI/scripts) |
| `-h`, `--help` | show help |

### AGENTS.md is safe to hand-edit

The generated content lives between managed markers:

```markdown
<!-- cursor-compose:start -->
# AGENTS.md
...generated from your stack...
<!-- cursor-compose:end -->

## Your own notes (preserved on regenerate)
```

Re-running `--agents` only replaces the managed block — anything you add outside it is kept.

## What it detects

| Auto-detected | From |
|---|---|
| Next.js + TypeScript | `package.json` |
| Supabase | `package.json` |
| Drizzle ORM | `package.json` |
| shadcn / Radix UI | `package.json` |
| FastAPI | `requirements.txt` |
| Flutter | `pubspec.yaml` |

Core conventions always load by default.

## Optional modules

Toggle these on during the interactive prompt:

- **`saas`** — multi-tenancy, billing, auth patterns
- **`ecommerce`** — cart, checkout, payment flows
- **`claude-code`** — `CLAUDE.md` / documentation conventions
- **`agentic`** — agent & tool-calling patterns

## Requirements

- Node.js 18+

## Roadmap

- [ ] **`cursor-compose check`** — CI command that fails the build when your committed rules drift from your actual dependencies.
- [ ] More stacks (Django, Rails, SvelteKit, Expo).

Want a stack supported? [Open an issue](https://github.com/Kabi10/cursor-rules/issues) or send a PR — adding a module is just a markdown file (see [CONTRIBUTING.md](CONTRIBUTING.md)).

## How it works

```
src/
  cli.js          # interactive prompt + orchestration + flags
  detect.js       # reads dependency files → detected modules
  compose.js      # assembles selected modules; writes .mdc / .cursorrules / AGENTS.md
  frontmatter.js  # Cursor .mdc YAML frontmatter (not used for AGENTS.md)
modules/          # one .md per framework — the rule building blocks
patterns/         # reusable code-organization patterns
```

## Contributing

New modules are welcome and easy — drop a markdown file in `modules/`. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
