import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { FRONTMATTER, buildFrontmatter } from './frontmatter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODULES_DIR = join(__dirname, '..', 'modules');

/**
 * Loads selected module .md files and concatenates them (legacy single-file mode).
 *
 * @param {string[]} moduleIds
 * @returns {string} composed rules content
 */
export function composeModules(moduleIds) {
  const sections = moduleIds.map((id) => {
    const modPath = join(MODULES_DIR, `${id}.md`);
    if (!existsSync(modPath)) {
      console.warn(`Warning: module "${id}" not found, skipping`);
      return null;
    }
    return readFileSync(modPath, 'utf8').trim();
  }).filter(Boolean);

  return sections.join('\n\n---\n\n');
}

/**
 * Rough token estimate: 1 token ≈ 4 characters.
 *
 * @param {string} text
 * @returns {number}
 */
export function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

/**
 * Writes each selected module as its own .mdc file with proper YAML frontmatter.
 * Files are written to .cursor/rules/ with numeric prefixes for load order.
 *
 * @param {string[]} moduleIds
 * @param {string} cwd - target directory (defaults to process.cwd())
 * @returns {string[]} array of written file paths
 */
export function writeRulesMdc(moduleIds, cwd = process.cwd()) {
  const rulesDir = join(cwd, '.cursor', 'rules');
  mkdirSync(rulesDir, { recursive: true });

  const written = [];

  for (const id of moduleIds) {
    const modPath = join(MODULES_DIR, `${id}.md`);
    if (!existsSync(modPath)) {
      console.warn(`Warning: module "${id}" not found, skipping`);
      continue;
    }

    const content = readFileSync(modPath, 'utf8').trim();
    const frontmatter = buildFrontmatter(id);
    const cfg = FRONTMATTER[id];
    const prefix = cfg?.prefix ?? '999';
    const filename = `${prefix}-${id}.mdc`;
    const outPath = join(rulesDir, filename);

    writeFileSync(outPath, `${frontmatter}\n\n${content}\n`, 'utf8');
    written.push(outPath);
  }

  return written;
}

/**
 * Writes all selected modules into a single legacy .cursorrules file.
 *
 * @param {string[]} moduleIds
 * @param {string} cwd - target directory (defaults to process.cwd())
 * @returns {string} path of written file
 */
export function writeRulesLegacy(moduleIds, cwd = process.cwd()) {
  const content = composeModules(moduleIds);
  const outPath = join(cwd, '.cursorrules');
  writeFileSync(outPath, content, 'utf8');
  return outPath;
}

/**
 * @deprecated Use writeRulesMdc or writeRulesLegacy directly.
 * Kept for backwards compat with existing tests.
 */
export function writeRules(content, format, cwd = process.cwd()) {
  let outPath;
  if (format === 'mdc') {
    const rulesDir = join(cwd, '.cursor', 'rules');
    mkdirSync(rulesDir, { recursive: true });
    outPath = join(rulesDir, 'project.mdc');
  } else {
    outPath = join(cwd, '.cursorrules');
  }
  writeFileSync(outPath, content, 'utf8');
  return outPath;
}
