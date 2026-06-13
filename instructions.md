```markdown
# Cursor AI Project Rules .mdc Format Guide (2026)

**For the `cursor-compose` npm package (`npx cursor-compose`)**
*Expert reference for generating perfect `.cursor/rules/*.mdc` files*

---

## Why Your Current Implementation Is Broken

Your current approach — concatenating everything into one big `.cursor/rules/project.mdc` with no YAML frontmatter and sections separated by `---` — no longer works reliably in 2026.

**Correct modern approach:**
- Each rule **must** be its own separate `.mdc` file inside `.cursor/rules/`
- Cursor reads the folder recursively (subfolders are allowed and encouraged for organization)
- Every file **requires** YAML frontmatter at the top
- Filename prefixes like `010-`, `020-` control load order when rules might conflict

---

## Official Frontmatter Structure (2026)

Every `.mdc` file must begin with:

```yaml
---
description: "Clear, specific summary of the rule's purpose and when the AI should apply it"
globs:
  - "**/*.ts"
  - "app/**"
alwaysApply: false
---
# Rule content in Markdown goes here
```

### Supported Fields (only these three)

| Field          | Type             | Purpose                                                                 | Required? |
|----------------|------------------|-------------------------------------------------------------------------|-----------|
| `description`  | string           | Lets AI decide when to load the rule semantically                      | Recommended |
| `globs`        | array of strings | Auto-attach rule when matching files are open (minimatch patterns)     | Optional |
| `alwaysApply`  | boolean          | `true` = always loaded in every chat/session                           | Required  |

**Activation modes (important nuances):**
- `alwaysApply: true` → Always loaded (permanent token cost)
- `globs` + `alwaysApply: false` → Auto-attach on file match
- `description` only → AI intelligently decides relevance
- None of the above → Manual only via `@filename` in chat

---

## 1. Recommended Configuration Strategy per Module

**Do NOT set everything to `alwaysApply: true`** — this creates heavy token bloat.

**Recommended hybrid strategy:**

- **Core stack/language/framework** → `alwaysApply: true`
- **Libraries/integrations** → Targeted `globs`
- **Architectural/domain patterns** → `alwaysApply: true` or description-only

### Concrete Frontmatter Blocks (Copy-Paste Ready)

#### `nextjs.mdc`
```yaml
---
description: "Next.js 15+ App Router best practices: Server/Client Components, Server Actions, metadata, routing, caching, streaming, partial prerendering, and project structure"
globs:
  - "**/*.{js,jsx,ts,tsx}"
  - "app/**"
  - "pages/**"
  - "next.config.*"
alwaysApply: true
---
```

#### `typescript.mdc`
```yaml
---
description: "TypeScript strict mode, type safety, generics, utility types, interfaces vs. types, error handling, and module organization best practices"
globs:
  - "**/*.{ts,tsx,mts,cts}"
alwaysApply: true
---
```

#### `fastapi.mdc`
```yaml
---
description: "FastAPI best practices: async routes, dependency injection, Pydantic v2 models/schemas, error handling with HTTPException, project structure, and testing patterns"
globs:
  - "**/*.py"
  - "app/**"
alwaysApply: false
---
```

#### `flutter.mdc`
```yaml
---
description: "Flutter best practices: widget composition, state management (Riverpod/Provider), navigation, performance, theming, and Dart conventions"
globs:
  - "**/*.dart"
  - "pubspec.yaml"
  - "lib/**"
alwaysApply: false
---
```

#### `supabase.mdc`
```yaml
---
description: "Supabase integration best practices: client setup, auth (RLS, policies), database queries, realtime subscriptions, storage, edge functions, and TypeScript/Python patterns"
globs:
  - "**/supabase/**"
  - "**/*supabase*.{ts,js,py}"
  - "lib/db/**"
alwaysApply: false
---
```

#### `drizzle.mdc`
```yaml
---
description: "Drizzle ORM best practices: schema definitions, relations, migrations, queries, TypeScript inference, and config best practices"
globs:
  - "**/drizzle/**"
  - "**/schema*.ts"
  - "drizzle.config.*"
  - "migrations/**"
  - "db/**"
alwaysApply: false
---
```

#### `shadcn.mdc`
```yaml
---
description: "shadcn/ui component best practices: composition, customization with Tailwind, accessibility, adding/modifying components, and utils/helpers"
globs:
  - "**/components/ui/**"
  - "**/lib/utils.{ts,js}"
alwaysApply: false
---
```

#### `saas.mdc`
```yaml
---
description: "SaaS application patterns: multi-tenancy, auth/billing/subscriptions, feature flags, user management, analytics, onboarding, and common architectures"
alwaysApply: true
---
```

#### `ecommerce.mdc`
```yaml
---
description: "Ecommerce best practices: product catalog, cart/checkout flows, payments (Stripe/PayPal), order/inventory management, user flows, and SEO/performance"
alwaysApply: true
---
```

#### `agentic.mdc`
```yaml
---
description: "Agentic workflows: step-by-step planning, reflection, tool calling, multi-agent collaboration, structured reasoning, and iterative problem-solving"
alwaysApply: true
---
```

#### `claude-code.mdc`
```yaml
---
description: "Claude Code and Claude model best practices: effective prompting, artifact generation, long-context handling, tool use, and Cursor/Claude-specific patterns"
alwaysApply: true
---
```

---

## 2. Token Limits & Performance

- **No hard per-file limit**, but strong practical guidelines:
  - `alwaysApply: true` rules → **≤ 200 words (~300 tokens)**
  - Scoped or intelligent rules → **500–800 words max**
- Keep each rule focused on **one concern**
- Total loaded rules matter more than any single file

---

## 3. Description Best Practices

- **Length**: 50–150 characters (1–2 sentences)
- **Style**: Detailed enough to be triggerable, not vague
- **Good example**: "Next.js 15+ App Router best practices including Server Components, Server Actions, streaming, and caching—apply to route handlers and components."
- **Bad example**: "Next.js rules" or a full essay

---

## 4. Additional Tips for `cursor-compose`

- Use numeric prefixes for load order: `010-nextjs.mdc`, `020-typescript.mdc`, etc.
- Commit `.cursor/rules/` to Git
- Add a generated `README.md` inside `.cursor/rules/` explaining the rules
- Consider a `--always-apply` CLI flag per module
- Validate frontmatter parsing in your package

---

\
