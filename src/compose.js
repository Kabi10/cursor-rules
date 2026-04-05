import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODULES_DIR = join(__dirname, '..', 'modules');

/**
 * Loads selected module .md files and concatenates them.
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
 * Writes the composed content to the appropriate file.
 *
 * @param {string} content
 * @param {'legacy' | 'mdc'} format
 * @param {string} cwd - target directory (defaults to process.cwd())
 * @returns {string} absolute path of written file
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
