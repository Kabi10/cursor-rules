import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  writeRulesAgentsMd,
  buildAgentsBlock,
  AGENTS_START,
  AGENTS_END,
} from '../src/compose.js';

function tmp() {
  return mkdtempSync(join(tmpdir(), 'cc-agents-'));
}

test('creates AGENTS.md with managed markers and a single H1', () => {
  const dir = tmp();
  try {
    const { outPath, action } = writeRulesAgentsMd(['core'], dir);
    assert.equal(action, 'created');
    const content = readFileSync(outPath, 'utf8');

    assert.ok(content.includes(AGENTS_START), 'has start marker');
    assert.ok(content.includes(AGENTS_END), 'has end marker');

    // Exactly one top-level H1 (the AGENTS.md title); module titles demoted to ##.
    const h1s = content.split('\n').filter((l) => /^# /.test(l));
    assert.equal(h1s.length, 1, 'exactly one H1');
    assert.equal(h1s[0], '# AGENTS.md');
    assert.ok(/^## /m.test(content), 'module headings demoted to H2');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('AGENTS.md is plain markdown — no Cursor frontmatter', () => {
  const dir = tmp();
  try {
    const { outPath } = writeRulesAgentsMd(['core', 'typescript'], dir);
    const content = readFileSync(outPath, 'utf8');
    assert.ok(!content.includes('alwaysApply:'), 'no alwaysApply');
    assert.ok(!content.includes('globs:'), 'no globs');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('regeneration replaces the managed block but preserves user content', () => {
  const dir = tmp();
  try {
    const { outPath } = writeRulesAgentsMd(['core'], dir);
    // User appends custom content after the managed block.
    const custom = '\n\n## Team notes\nDo not deploy on Fridays.\n';
    writeFileSync(outPath, readFileSync(outPath, 'utf8') + custom, 'utf8');

    const { action } = writeRulesAgentsMd(['core', 'typescript'], dir);
    assert.equal(action, 'updated');

    const after = readFileSync(outPath, 'utf8');
    assert.ok(after.includes('Do not deploy on Fridays.'), 'user content preserved');
    // New module set reflected inside the block.
    const block = buildAgentsBlock(['core', 'typescript']);
    assert.ok(after.includes(block), 'managed block updated to new module set');
    // Still exactly one managed region.
    assert.equal(after.split(AGENTS_START).length - 1, 1, 'single start marker');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('foreign AGENTS.md (no markers) is appended to, not clobbered', () => {
  const dir = tmp();
  try {
    const outPath = join(dir, 'AGENTS.md');
    writeFileSync(outPath, '# My hand-written rules\nKeep me.\n', 'utf8');

    const { action } = writeRulesAgentsMd(['core'], dir, {
      onForeignFile: () => 'append',
    });
    assert.equal(action, 'appended');

    const content = readFileSync(outPath, 'utf8');
    assert.ok(content.includes('Keep me.'), 'original content preserved');
    assert.ok(content.includes(AGENTS_START), 'managed block appended');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('foreign AGENTS.md can be overwritten or cancelled on request', () => {
  const dir = tmp();
  try {
    const outPath = join(dir, 'AGENTS.md');
    writeFileSync(outPath, 'old\n', 'utf8');

    const cancelled = writeRulesAgentsMd(['core'], dir, { onForeignFile: () => 'cancel' });
    assert.equal(cancelled.action, 'cancelled');
    assert.equal(readFileSync(outPath, 'utf8'), 'old\n', 'unchanged on cancel');

    const overwritten = writeRulesAgentsMd(['core'], dir, { onForeignFile: () => 'overwrite' });
    assert.equal(overwritten.action, 'overwritten');
    const content = readFileSync(outPath, 'utf8');
    assert.ok(!content.includes('old'), 'old content gone');
    assert.ok(content.includes(AGENTS_START), 'managed block written');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
