# Flutter Rules

## Widget Structure
- Prefer `StatelessWidget` by default. Only use `StatefulWidget` when local mutable state is required.
- Extract widgets into separate files when they exceed ~80 lines.
- Never build complex widget trees inline in `build()` — extract to named methods or widgets.

## State Management
- Use `provider` or `riverpod` for shared state. Never pass state down more than 2 widget levels via constructor.
- Keep business logic out of widgets — use a ViewModel or Notifier class.

## Naming Conventions
- Widget files: `snake_case.dart`
- Widget classes: `PascalCase`
- Private widgets (used only in one file): prefix with `_`

## Performance
- Use `const` constructors wherever possible.
- Use `ListView.builder` for long lists — never `ListView` with children array.
- Avoid rebuilding parent widgets for child state changes — use `Consumer` or scoped providers.

## Rules
- Always provide `key` parameters to widgets in lists.
- Never use `BuildContext` across async gaps without checking `mounted`.
- Platform-specific code goes in `platform/` with `import 'package:flutter/foundation.dart'` guards.
