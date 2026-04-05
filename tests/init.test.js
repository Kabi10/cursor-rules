import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { composeModules, writeRules } from '../src/compose.js';
import { detectModules } from '../src/detect.js';

// Integration: detect + compose + write pipeline (no CLI prompts)
test('full pipeline: detect nextjs project and write .cursorrules', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'cursor-int-'));
  try {
    writeFileSync(
      join(tmp, 'package.json'),
      JSON.stringify({
        dependencies: { next: '^14', typescript: '^5' },
      })
    );

    const modules = detectModules(tmp);
    assert.ok(modules.includes('core'));
    assert.ok(modules.includes('nextjs'));
    assert.ok(modules.includes('typescript'));

    const content = composeModules(modules);
    assert.ok(content.length > 100);

    const outPath = writeRules(content, 'legacy', tmp);
    assert.ok(existsSync(outPath));
  } finally {
    rmSync(tmp, { recursive: true });
  }
});
