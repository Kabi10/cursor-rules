#!/usr/bin/env node
import prompts from 'prompts';
import kleur from 'kleur';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { detectModules } from './detect.js';
import {
  writeRulesMdc,
  writeRulesLegacy,
  writeRulesAgentsMd,
  estimateTokens,
  composeModules,
  AGENTS_START,
} from './compose.js';

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

// Warn when an always-on AGENTS.md gets large enough to eat real context.
const TOKEN_WARN_THRESHOLD = 2000;

const HELP = `
${kleur.bold('cursor-compose')} — detect your stack and generate AI editor rules

${kleur.bold('Usage:')} cursor-compose [options]

${kleur.bold('Options:')}
  ${kleur.cyan('(default)')}   write per-module .mdc files to .cursor/rules/
  ${kleur.cyan('--agents')}    write AGENTS.md (portable: Cursor, Copilot, Codex, Claude Code)
  ${kleur.cyan('--all')}       write both .cursor/rules/*.mdc and AGENTS.md
  ${kleur.cyan('--legacy')}    write a single .cursorrules file
  ${kleur.cyan('--yes, -y')}   non-interactive: use detected modules, update/overwrite without prompts
  ${kleur.cyan('-h, --help')}  show this help

AGENTS.md is written between managed markers; anything you add outside them is
preserved when you regenerate.
`;

// Exit cleanly on Ctrl+C
process.on('SIGINT', () => {
  console.log(kleur.yellow('\nCancelled.'));
  process.exit(0);
});

async function main() {
  const argv = process.argv.slice(2);

  if (argv.includes('-h') || argv.includes('--help')) {
    console.log(HELP);
    process.exit(0);
  }

  // Node version check
  const [major] = process.versions.node.split('.').map(Number);
  if (major < 18) {
    console.error(
      kleur.red('cursor-compose requires Node 18+. Download at https://nodejs.org')
    );
    process.exit(1);
  }

  // Output mode flags ({--agents, --legacy, --all} are mutually exclusive).
  const isAgents = argv.includes('--agents');
  const isLegacy = argv.includes('--legacy');
  const isAll = argv.includes('--all');
  const isYes = argv.includes('--yes') || argv.includes('-y');

  if ([isAgents, isLegacy, isAll].filter(Boolean).length > 1) {
    console.error(kleur.red('Choose only one of --agents / --legacy / --all.'));
    process.exit(1);
  }

  console.log(kleur.bold('\ncursor-compose\n'));

  const detected = detectModules();

  if (detected.length > 1) {
    console.log(kleur.green('Detected: ') + detected.join(', ') + '\n');
  } else {
    console.log(kleur.dim('No stack detected — select modules manually.\n'));
  }

  // Module selection (skipped in non-interactive mode).
  let selected;
  if (isYes) {
    selected = detected.length > 0 ? detected : ['core'];
    console.log(kleur.dim('Non-interactive: using ') + selected.join(', ') + '\n');
  } else {
    ({ selected } = await prompts({
      type: 'multiselect',
      name: 'selected',
      message: 'Select modules (space to toggle, enter to confirm):',
      choices: ALL_MODULES.map((m) => ({
        title: m,
        value: m,
        selected: detected.includes(m),
      })),
      min: 1,
    }));
  }

  if (!selected || selected.length === 0) {
    console.log(kleur.yellow('No modules selected. Exiting.'));
    process.exit(0);
  }

  // Reports estimated tokens for an always-on file and warns when it's large.
  const reportTokens = () => {
    const tokens = estimateTokens(composeModules(selected));
    if (tokens > TOKEN_WARN_THRESHOLD) {
      console.log(
        kleur.yellow(`\n⚠ AGENTS.md is ~${tokens} tokens (${selected.length} modules).`) +
        kleur.dim(' Consider fewer modules to save context.')
      );
    }
    return tokens;
  };

  // --legacy: single .cursorrules file
  if (isLegacy) {
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

  // --agents: portable AGENTS.md (managed block)
  if (isAgents) {
    const tokens = reportTokens();
    const onForeignFile = await resolveForeignDecision(isYes);
    const result = writeRulesAgentsMd(selected, process.cwd(), { onForeignFile });
    if (result.action === 'cancelled') {
      console.log(kleur.yellow('Cancelled.'));
      process.exit(0);
    }
    console.log('\n' + kleur.green('Done! ') + `${actionVerb(result.action)} ${kleur.bold('AGENTS.md')} (~${tokens} tokens)`);
    console.log(kleur.dim('Works with Cursor, Copilot, Codex & Claude Code.\n'));
    return;
  }

  // --all: per-module .mdc AND AGENTS.md in one pass
  if (isAll) {
    const written = writeRulesMdc(selected);
    const tokens = reportTokens();
    const onForeignFile = await resolveForeignDecision(isYes);
    const result = writeRulesAgentsMd(selected, process.cwd(), { onForeignFile });
    console.log('\n' + kleur.green('Done! ') + `Wrote ${written.length} rule file(s) to ${kleur.bold('.cursor/rules/')}`);
    if (result.action !== 'cancelled') {
      console.log(kleur.green('       ') + `${actionVerb(result.action)} ${kleur.bold('AGENTS.md')} (~${tokens} tokens)`);
    }
    console.log(kleur.dim('Restart Cursor to apply.\n'));
    return;
  }

  // Default: one .mdc per module in .cursor/rules/
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

/**
 * Resolves how to handle an existing AGENTS.md, returning a sync callback for
 * writeRulesAgentsMd. Only a foreign file (exists, no managed markers) prompts;
 * a missing file or one with markers is handled non-destructively by the writer.
 */
async function resolveForeignDecision(isYes) {
  const p = join(process.cwd(), 'AGENTS.md');
  if (!existsSync(p)) return () => 'append';
  if (readFileSync(p, 'utf8').includes(AGENTS_START)) return () => 'append';
  if (isYes) return () => 'append';

  const { action } = await prompts({
    type: 'select',
    name: 'action',
    message: `${kleur.yellow('AGENTS.md')} exists without cursor-compose markers:`,
    choices: [
      { title: 'Append a managed block (keep existing content)', value: 'append' },
      { title: 'Overwrite the whole file', value: 'overwrite' },
      { title: 'Cancel', value: 'cancel' },
    ],
    initial: 0,
  });
  const decision = action || 'cancel';
  return () => decision;
}

function actionVerb(action) {
  switch (action) {
    case 'created': return 'Created';
    case 'updated': return 'Updated';
    case 'appended': return 'Appended managed block to';
    case 'overwritten': return 'Overwrote';
    default: return 'Wrote';
  }
}

main().catch((err) => {
  console.error(kleur.red('Error: ') + err.message);
  process.exit(1);
});
