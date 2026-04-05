import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Reads project files in cwd and returns an array of matched module IDs.
 * Always includes 'core'. Optional modules (saas, ecommerce, claude-code, agentic)
 * are never auto-detected — user opts in via CLI prompt.
 *
 * @param {string} cwd - directory to scan (defaults to process.cwd())
 * @returns {string[]} array of module IDs
 */
export function detectModules(cwd = process.cwd()) {
  const modules = new Set(['core']);

  // ── package.json ──────────────────────────────────────────────────────────
  const pkgPath = join(cwd, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      const deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
        ...pkg.peerDependencies,
      };

      if (deps['next']) modules.add('nextjs');
      if (deps['typescript'] || deps['@types/node']) modules.add('typescript');
      if (deps['@supabase/supabase-js']) modules.add('supabase');
      if (deps['drizzle-orm']) modules.add('drizzle');
      if (
        deps['shadcn-ui'] ||
        deps['@shadcn/ui'] ||
        deps['@radix-ui/react-dialog']
      )
        modules.add('shadcn');
    } catch {
      // malformed package.json — skip silently
    }
  }

  // ── requirements.txt ──────────────────────────────────────────────────────
  const reqPath = join(cwd, 'requirements.txt');
  if (existsSync(reqPath)) {
    const reqs = readFileSync(reqPath, 'utf8').toLowerCase();
    if (reqs.includes('fastapi')) modules.add('fastapi');
  }

  // ── pubspec.yaml (Flutter) ─────────────────────────────────────────────────
  const pubspecPath = join(cwd, 'pubspec.yaml');
  if (existsSync(pubspecPath)) {
    const pubspec = readFileSync(pubspecPath, 'utf8');
    if (pubspec.includes('flutter:')) modules.add('flutter');
  }

  return Array.from(modules);
}
