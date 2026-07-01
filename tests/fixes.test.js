import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  findManagedBlock,
  demoteHeadings,
  writeRulesAgentsMd,
  AGENTS_START,
  AGENTS_END,
} from '../src/compose.js';

const CLI = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'cli.js');
const tmp = () => mkdtempSync(join(tmpdir(), 'cc-'));

// Runs the real CLI as a subprocess with no stdin. Throws on non-zero exit or
// if it blocks on a prompt (timeout) — exactly the regression we're guarding.
function runCli(cwd, args) {
  return execFileSync(process.execPath, [CLI, ...args], {
    cwd,
    encoding: 'utf8',
    timeout: 20000,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

// ── findManagedBlock: both markers, in order ────────────────────────────────
test('findManagedBlock finds a valid, ordered marker pair', () => {
  const m = findManagedBlock(`intro\n${AGENTS_START}\nbody\n${AGENTS_END}\noutro`);
  assert.ok(m && m.startIdx < m.endIdx);
});

test('findManagedBlock returns null for an orphaned start marker', () => {
  assert.equal(findManagedBlock(`${AGENTS_START}\nno end marker here`), null);
});

test('findManagedBlock ignores an end marker that precedes the start', () => {
  assert.equal(findManagedBlock(`${AGENTS_END}\n${AGENTS_START}\nstill no trailing end`), null);
});

// ── demoteHeadings: incremental, capped at h6, fence-aware ───────────────────
test('demoteHeadings shifts every level by one and caps at h6', () => {
  assert.equal(
    demoteHeadings('# A\n## B\n###### F\nbody'),
    '## A\n### B\n###### F\nbody'
  );
});

test('demoteHeadings leaves headings inside fenced code blocks untouched', () => {
  assert.equal(
    demoteHeadings('# Title\n```\n# not a heading\n```'),
    '## Title\n```\n# not a heading\n```'
  );
});

// ── writeRulesAgentsMd: marker safety ───────────────────────────────────────
test('a file with an orphaned start marker is treated as foreign, not corrupted', () => {
  const dir = tmp();
  const p = join(dir, 'AGENTS.md');
  const original = `${AGENTS_START}\nhand-written, missing an end marker\n`;
  writeFileSync(p, original, 'utf8');

  const res = writeRulesAgentsMd(['core'], dir, { onForeignFile: () => 'cancel' });

  assert.equal(res.action, 'cancelled');
  assert.equal(readFileSync(p, 'utf8'), original); // left byte-for-byte intact
});

test('regenerating a managed block preserves content outside the markers', () => {
  const dir = tmp();
  const p = join(dir, 'AGENTS.md');
  writeRulesAgentsMd(['core'], dir); // create
  writeFileSync(p, readFileSync(p, 'utf8') + '\n## Hand-added section\nkeep me\n', 'utf8');

  const res = writeRulesAgentsMd(['core'], dir);

  assert.equal(res.action, 'updated');
  assert.match(readFileSync(p, 'utf8'), /Hand-added section/);
});

// ── CLI non-interactive mode: the --yes hang regressions ────────────────────
test('CLI: default --yes overwrites existing .cursor/rules without prompting', () => {
  const dir = tmp();
  const rules = join(dir, '.cursor', 'rules');
  mkdirSync(rules, { recursive: true });
  writeFileSync(join(rules, '010-core.mdc'), 'stale', 'utf8');
  writeFileSync(join(dir, 'package.json'), '{"dependencies":{"next":"14.0.0"}}', 'utf8');

  runCli(dir, ['--yes']); // hangs on the old code (prompt); throws if so

  assert.ok(existsSync(join(rules, '030-nextjs.mdc')));
});

test('CLI: --legacy --yes overwrites existing .cursorrules without prompting', () => {
  const dir = tmp();
  writeFileSync(join(dir, '.cursorrules'), 'STALE', 'utf8');

  runCli(dir, ['--legacy', '--yes']); // hangs on the old code (prompt); throws if so

  const out = readFileSync(join(dir, '.cursorrules'), 'utf8');
  assert.notEqual(out, 'STALE');
  assert.ok(out.length > 0);
});

test('CLI: --agents --yes appends to a foreign AGENTS.md without prompting', () => {
  const dir = tmp();
  writeFileSync(join(dir, 'AGENTS.md'), '# My existing rules\nkeep this line\n', 'utf8');

  runCli(dir, ['--agents', '--yes']);

  const md = readFileSync(join(dir, 'AGENTS.md'), 'utf8');
  assert.match(md, /keep this line/);   // original content preserved
  assert.ok(findManagedBlock(md));       // a valid managed block was added
});
