#!/usr/bin/env node
import prompts from 'prompts';
import kleur from 'kleur';
import { existsSync } from 'fs';
import { detectModules } from './detect.js';
import { composeModules, writeRules, estimateTokens } from './compose.js';

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
      kleur.red('cursor-init requires Node 18+. Download at https://nodejs.org')
    );
    process.exit(1);
  }

  console.log(kleur.bold('\ncursor-init\n'));

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
    message: 'Select modules to include (space to toggle, enter to confirm):',
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

  // Format selection
  const { format } = await prompts({
    type: 'select',
    name: 'format',
    message: 'Output format:',
    choices: [
      {
        title: '.cursorrules  (legacy — works with all Cursor versions)',
        value: 'legacy',
      },
      {
        title: '.cursor/rules/project.mdc  (2026 format)',
        value: 'mdc',
      },
    ],
  });

  if (!format) process.exit(0);

  const outFile =
    format === 'mdc' ? '.cursor/rules/project.mdc' : '.cursorrules';

  // Overwrite check
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

  const content = composeModules(selected);
  const outPath = writeRules(content, format);
  const tokens = estimateTokens(content);

  console.log(
    '\n' +
      kleur.green('Done! ') +
      `Written to ${kleur.bold(outPath)} (~${tokens} tokens)`
  );
  console.log(kleur.dim('Restart Cursor to apply changes.\n'));
}

main().catch((err) => {
  console.error(kleur.red('Error: ') + err.message);
  process.exit(1);
});
