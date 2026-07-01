import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { FRONTMATTER, buildFrontmatter } from './frontmatter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODULES_DIR = join(__dirname, '..', 'modules');

// Markers delimiting cursor-compose's managed region inside AGENTS.md.
// Content outside these markers is preserved across regenerations.
export const AGENTS_START = '<!-- cursor-compose:start -->';
export const AGENTS_END = '<!-- cursor-compose:end -->';

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
 * Demotes every ATX markdown heading one level (h1→h2 … h5→h6), capping at h6,
 * so a composed AGENTS.md keeps a single top-level H1 while preserving each
 * module's internal heading hierarchy. Headings inside fenced code blocks
 * (``` / ~~~) are left untouched.
 *
 * @param {string} md
 * @returns {string}
 */
export function demoteHeadings(md) {
  let inFence = false;
  return md
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;
      return line.replace(/^(#{1,6})(\s)/, (_, hashes, ws) =>
        (hashes.length >= 6 ? hashes : hashes + '#') + ws
      );
    })
    .join('\n');
}

/**
 * Locates cursor-compose's managed block: the start marker and the first end
 * marker that follows it. Returns null when a valid, ordered pair is absent
 * (e.g. an orphaned start marker), so callers treat the file as foreign rather
 * than corrupt it.
 *
 * @param {string} content
 * @returns {{ startIdx: number, endIdx: number } | null}
 */
export function findManagedBlock(content) {
  const startIdx = content.indexOf(AGENTS_START);
  if (startIdx === -1) return null;
  const endIdx = content.indexOf(AGENTS_END, startIdx + AGENTS_START.length);
  if (endIdx === -1) return null;
  return { startIdx, endIdx };
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
 * Builds the managed AGENTS.md block for the selected modules.
 *
 * AGENTS.md is the portable, cross-tool standard (Cursor, Copilot, Codex,
 * Claude Code), so this is plain markdown — NOT the Cursor-specific .mdc
 * frontmatter. Each module's top-level `# Heading` is demoted to `## Heading`
 * so the composed file keeps a single H1.
 *
 * @param {string[]} moduleIds
 * @returns {string} the managed block, wrapped in start/end markers
 */
export function buildAgentsBlock(moduleIds) {
  const sections = moduleIds.map((id) => {
    const modPath = join(MODULES_DIR, `${id}.md`);
    if (!existsSync(modPath)) {
      console.warn(`Warning: module "${id}" not found, skipping`);
      return null;
    }
    const content = readFileSync(modPath, 'utf8').trim();
    // Demote every module heading one level so AGENTS.md keeps a single H1.
    return demoteHeadings(content);
  }).filter(Boolean);

  const header =
    '# AGENTS.md\n\n' +
    '<!-- Generated by cursor-compose — https://github.com/Kabi10/cursor-rules\n' +
    '     Regenerate with `npx cursor-compose --agents`. Edit your modules, not this\n' +
    '     block; anything outside the markers is preserved across regenerations. -->';

  const body = [header, ...sections].join('\n\n');
  return `${AGENTS_START}\n${body}\n${AGENTS_END}`;
}

/**
 * Writes/updates AGENTS.md at the project root using a managed block, so the
 * tool can be re-run without clobbering content a user added by hand.
 *
 * - No file        → create it.
 * - Has markers    → replace only the managed block, preserve everything else.
 * - Foreign file   → decision via opts.onForeignFile() returning
 *                    'append' | 'overwrite' | 'cancel' (defaults to 'append').
 *
 * @param {string[]} moduleIds
 * @param {string} cwd - target directory (defaults to process.cwd())
 * @param {{ onForeignFile?: () => ('append'|'overwrite'|'cancel') }} [opts]
 * @returns {{ outPath: string, action: ('created'|'updated'|'appended'|'overwritten'|'cancelled') }}
 */
export function writeRulesAgentsMd(moduleIds, cwd = process.cwd(), opts = {}) {
  const outPath = join(cwd, 'AGENTS.md');
  const block = buildAgentsBlock(moduleIds);

  if (!existsSync(outPath)) {
    writeFileSync(outPath, block + '\n', 'utf8');
    return { outPath, action: 'created' };
  }

  const existing = readFileSync(outPath, 'utf8');
  const managed = findManagedBlock(existing);

  if (managed) {
    const before = existing.slice(0, managed.startIdx);
    const after = existing.slice(managed.endIdx + AGENTS_END.length);
    writeFileSync(outPath, `${before}${block}${after}`, 'utf8');
    return { outPath, action: 'updated' };
  }

  // Foreign file with no managed markers — don't silently destroy it.
  const decision = opts.onForeignFile ? opts.onForeignFile() : 'append';
  if (decision === 'cancel') {
    return { outPath, action: 'cancelled' };
  }
  if (decision === 'overwrite') {
    writeFileSync(outPath, block + '\n', 'utf8');
    return { outPath, action: 'overwritten' };
  }
  const sep = existing.endsWith('\n') ? '\n' : '\n\n';
  writeFileSync(outPath, `${existing}${sep}${block}\n`, 'utf8');
  return { outPath, action: 'appended' };
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
