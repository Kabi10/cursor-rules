import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { composeModules, writeRules, estimateTokens } from '../src/compose.js';

test('composeModules returns content from selected modules', () => {
  const result = composeModules(['core']);
  assert.ok(result.includes('Core Rules'));
});

test('composeModules warns and skips missing module', () => {
  // Should not throw — just skips
  const result = composeModules(['core', 'nonexistent-module']);
  assert.ok(result.includes('Core Rules'));
});

test('estimateTokens returns a number', () => {
  const tokens = estimateTokens('hello world');
  assert.equal(typeof tokens, 'number');
  assert.ok(tokens > 0);
});

test('estimateTokens approximates at ~4 chars per token', () => {
  const tokens = estimateTokens('a'.repeat(400));
  assert.equal(tokens, 100);
});

test('writeRules writes .cursorrules in legacy format', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'cursor-test-'));
  try {
    const outPath = writeRules('test content', 'legacy', tmp);
    assert.equal(outPath, join(tmp, '.cursorrules'));
    assert.equal(readFileSync(outPath, 'utf8'), 'test content');
  } finally {
    rmSync(tmp, { recursive: true });
  }
});

test('writeRules writes .cursor/rules/project.mdc in mdc format', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'cursor-test-'));
  try {
    const outPath = writeRules('test content', 'mdc', tmp);
    assert.equal(outPath, join(tmp, '.cursor', 'rules', 'project.mdc'));
    assert.ok(existsSync(outPath));
    assert.equal(readFileSync(outPath, 'utf8'), 'test content');
  } finally {
    rmSync(tmp, { recursive: true });
  }
});
