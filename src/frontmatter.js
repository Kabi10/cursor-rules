/**
 * Frontmatter config for each module.
 * Follows Grok/Gemini best practices:
 * - alwaysApply:true rules kept ≤ 200 words
 * - Scoped rules use targeted globs
 * - Numeric prefixes control load order
 */

export const FRONTMATTER = {
  core: {
    prefix: '010',
    description: 'Core coding discipline: search before building, pre-implementation checklist, commit hygiene, and verification before claiming done.',
    globs: [],
    alwaysApply: true,
  },
  typescript: {
    prefix: '020',
    description: 'TypeScript strict mode, type safety with unknown over any, interface vs type, and satisfies operator patterns.',
    globs: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
    alwaysApply: true,
  },
  nextjs: {
    prefix: '030',
    description: 'Next.js 15+ App Router: Server/Client Components, Server Actions, metadata, routing, caching, and project structure.',
    globs: ['**/*.{js,jsx,ts,tsx}', 'app/**', 'pages/**', 'next.config.*'],
    alwaysApply: true,
  },
  fastapi: {
    prefix: '040',
    description: 'FastAPI best practices: async routes, Pydantic v2 models, dependency injection, error handling, and project structure.',
    globs: ['**/*.py', 'app/**'],
    alwaysApply: false,
  },
  flutter: {
    prefix: '050',
    description: 'Flutter best practices: widget composition, Riverpod/Provider state management, navigation, performance, and Dart conventions.',
    globs: ['**/*.dart', 'pubspec.yaml', 'lib/**'],
    alwaysApply: false,
  },
  supabase: {
    prefix: '060',
    description: 'Supabase integration: RLS policies, auth with getUser(), typed client, and server-side usage in Next.js.',
    globs: ['**/supabase/**', '**/*supabase*.{ts,js,py}', 'lib/db/**'],
    alwaysApply: false,
  },
  drizzle: {
    prefix: '070',
    description: 'Drizzle ORM: schema definitions, TypeScript inference, query builder, migrations, and transactions.',
    globs: ['**/drizzle/**', '**/schema*.ts', 'drizzle.config.*', 'migrations/**', 'db/**'],
    alwaysApply: false,
  },
  shadcn: {
    prefix: '080',
    description: 'shadcn/ui: never modify components/ui/, wrap instead, use cva for variants, cn() for class merging.',
    globs: ['**/components/ui/**', '**/lib/utils.{ts,js}'],
    alwaysApply: false,
  },
  saas: {
    prefix: '090',
    description: 'SaaS patterns: multi-tenancy with org_id filtering, auth flow, feature flags, billing state sync from Stripe webhooks.',
    globs: [],
    alwaysApply: true,
  },
  ecommerce: {
    prefix: '100',
    description: 'E-commerce patterns: server-side cart/price validation, Stripe Payment Intents, atomic inventory, prices as integers.',
    globs: [],
    alwaysApply: true,
  },
  'claude-code': {
    prefix: '110',
    description: 'Claude Code conventions: CLAUDE.md structure, memory system, tool use discipline, and commit co-author format.',
    globs: [],
    alwaysApply: true,
  },
  agentic: {
    prefix: '120',
    description: 'Agentic coding: plan before building, small reversible steps, context hygiene, tool discipline, and verification loop.',
    globs: [],
    alwaysApply: true,
  },
};

/**
 * Builds YAML frontmatter string for a module.
 * @param {string} moduleId
 * @returns {string}
 */
export function buildFrontmatter(moduleId) {
  const cfg = FRONTMATTER[moduleId];
  if (!cfg) return '';

  const lines = ['---'];
  lines.push(`description: "${cfg.description}"`);

  if (cfg.globs.length > 0) {
    lines.push('globs:');
    cfg.globs.forEach(g => lines.push(`  - "${g}"`));
  }

  lines.push(`alwaysApply: ${cfg.alwaysApply}`);
  lines.push('---');

  return lines.join('\n');
}
