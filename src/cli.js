#!/usr/bin/env node
import prompts from 'prompts';
import kleur from 'kleur';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { detectModules } from './detect.js';
import { writeRulesMdc, writeRulesLegacy, estimateTokens, composeModules } from './compose.js';

const ALL_MODULES = [
  'core',
  'typescript',
  'nextjs',
  'fastapi',
  'flutter',
  'supabase',
  'drizzle',
  'shadcn',
  'saas',
  'ecommerce',
  'claude-code',
  'agentic',
];

// Exit cleanly on Ctrl+C
process.on('SIGINT', () => {
  console.log(kleur.yellow('\nCancelled.'));
  process.exit(0);
});

async function main() {
  // Node version check
  const [major] = process.versions.node.split('.').map(Number);
  if (major < 18) {
    console.error(
      kleur.red('cursor-compose requires Node 18+. Download at https://nodejs.org')
    );
    process.exit(1);
  }

  // --legacy flag
  const isLegacy = process.argv.includes('--legacy');

  console.log(kleur.bold('\ncursor-compose\n'));

  const detected = detectModules();

  if (detected.length > 1) {
    console.log(kleur.green('Detected: ') + detected.join(', ') + '\n');
  } else {
    console.log(kleur.dim('No stack detected — select modules manually.\n'));
  }

  // Module selection
  const { selected } = await prompts({
    type: 'multiselect',
    name: 'selected',
    message: 'Select modules (space to toggle, enter to confirm):',
    choices: ALL_MODULES.map((m) => ({
      title: m,
      value: m,
      selected: detected.includes(m),
    })),
    min: 1,
  });

  if (!selected || selected.length === 0) {
    console.log(kleur.yellow('No modules selected. Exiting.'));
    process.exit(0);
  }

  if (isLegacy) {
    // Legacy: single .cursorrules file
    const outFile = '.cursorrules';
    if (existsSync(outFile)) {
      const { action } = await prompts({
        type: 'select',
        name: 'action',
        message: `${kleur.yellow(outFile)} already exists:`,
        choices: [
          { title: 'Overwrite', value: 'overwrite' },
          { title: 'Cancel', value: 'cancel' },
        ],
        initial: 1,
      });
      if (!action || action === 'cancel') {
        console.log(kleur.yellow('Cancelled.'));
        process.exit(0);
      }
    }
    const outPath = writeRulesLegacy(selected);
    const tokens = estimateTokens(composeModules(selected));
    console.log('\n' + kleur.green('Done! ') + `Written to ${kleur.bold(outPath)} (~${tokens} tokens)`);
    console.log(kleur.dim('Restart Cursor to apply.\n'));
    return;
  }

  // Modern: one .mdc per module in .cursor/rules/
  const rulesDir = join(process.cwd(), '.cursor', 'rules');
  const existingMdc = existsSync(rulesDir)
    ? readdirSync(rulesDir).filter(f => f.endsWith('.mdc'))
    : [];

  if (existingMdc.length > 0) {
    const { action } = await prompts({
      type: 'select',
      name: 'action',
      message: `${kleur.yellow('.cursor/rules/')} already has ${existingMdc.length} rule file(s):`,
      choices: [
        { title: 'Overwrite', value: 'overwrite' },
        { title: 'Cancel', value: 'cancel' },
      ],
      initial: 1,
    });
    if (!action || action === 'cancel') {
      console.log(kleur.yellow('Cancelled.'));
      process.exit(0);
    }
  }

  const written = writeRulesMdc(selected);

  console.log('\n' + kleur.green('Done! ') + `Wrote ${written.length} rule file(s) to ${kleur.bold('.cursor/rules/')}`);
  written.forEach(f => console.log(kleur.dim('  ' + f.split(/[\\/]/).pop())));
  console.log(kleur.dim('\nRestart Cursor to apply.\n'));
}

main().catch((err) => {
  console.error(kleur.red('Error: ') + err.message);
  process.exit(1);
});
