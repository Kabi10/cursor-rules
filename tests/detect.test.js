import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { detectModules } from '../src/detect.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const fixtures = join(__dirname, 'fixtures');

test('always includes core module', () => {
  const result = detectModules(join(fixtures, 'nextjs'));
  assert.ok(result.includes('core'));
});

test('detects nextjs from package.json', () => {
  const result = detectModules(join(fixtures, 'nextjs'));
  assert.ok(result.includes('nextjs'));
});

test('detects typescript from package.json', () => {
  const result = detectModules(join(fixtures, 'nextjs'));
  assert.ok(result.includes('typescript'));
});

test('detects supabase from package.json', () => {
  const result = detectModules(join(fixtures, 'nextjs'));
  assert.ok(result.includes('supabase'));
});

test('detects drizzle from package.json', () => {
  const result = detectModules(join(fixtures, 'nextjs'));
  assert.ok(result.includes('drizzle'));
});

test('detects fastapi from requirements.txt', () => {
  const result = detectModules(join(fixtures, 'fastapi'));
  assert.ok(result.includes('fastapi'));
});

test('detects flutter from pubspec.yaml', () => {
  const result = detectModules(join(fixtures, 'flutter'));
  assert.ok(result.includes('flutter'));
});

test('returns only core when no project files found', () => {
  const result = detectModules('/tmp/empty-dir-that-does-not-exist');
  assert.deepEqual(result, ['core']);
});

test('does not include optional modules by default', () => {
  const result = detectModules(join(fixtures, 'nextjs'));
  assert.ok(!result.includes('saas'));
  assert.ok(!result.includes('ecommerce'));
  assert.ok(!result.includes('claude-code'));
  assert.ok(!result.includes('agentic'));
});
