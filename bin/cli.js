#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const {
  INSTALL_DIR,
  AI_TOOL_DIRS,
  WORKFLOWS_DIR,
  LEGACY_WORKFLOWS_DIR,
  BOOTSTRAP_COMMANDS,
  copyDir,
  copyFiles
} = require('../src');

const PACKAGE_ROOT = path.join(__dirname, '..');
const VERSION = require(path.join(PACKAGE_ROOT, 'package.json')).version;

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

const log = {
  info: (msg) => console.log(`${colors.green}[INFO]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg) => console.error(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}→${colors.reset} ${msg}`)
};

function getCommandName() {
  const binPath = process.argv[1] || '';
  const binName = path.basename(binPath);
  return binName || 'injoys';
}

// Help message
function showHelp() {
  const cmd = getCommandName();
  console.log(`
InJoys Agent SDK CLI v${VERSION}

Usage: ${cmd} <command> [options]

Commands:
  init [path]       Install InJoys Agent SDK into a project (default: current dir)
  check-env         Check the project environment / development toolchain
  version           Show version

Options for init:
  --tools <list>    Also bootstrap commands for these AI tools, in addition to
                    .agents/workflows (${Object.keys(AI_TOOL_DIRS).join(', ')}, all).
                    Default: .agents/workflows only (always installed)
  --force           Overwrite files that already exist
  --dry-run         Show what would be written without changing anything

Global options:
  -h, --help        Show this help message
  -v, --version     Show version

Examples:
  npx @injoysai/agent-sdk init
  npx @injoysai/agent-sdk init ./my-project --tools claude
  npx @injoysai/agent-sdk init --dry-run
  npx @injoysai/agent-sdk check-env
`);
}

// Minimal flag parser: returns { positional, flags }
function parseArgs(argv, valueFlags = []) {
  const positional = [];
  const flags = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const name = arg.slice(2);
      if (valueFlags.includes(name)) {
        const value = argv[i + 1];
        if (value === undefined || value.startsWith('--')) {
          throw new Error(`Option --${name} requires a value`);
        }
        flags[name] = value;
        i++;
      } else {
        flags[name] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  return { positional, flags };
}

// `.agents/workflows` is always installed (tool-agnostic): it is where /context-init
// syncs the full command set. Other tools' command directories are opt-in via --tools.
const DEFAULT_TOOLS = [];

function resolveTools(value) {
  const all = Object.keys(AI_TOOL_DIRS);
  if (!value) return DEFAULT_TOOLS;
  if (value === 'all') return all;

  const tools = value.split(',').map((t) => t.trim()).filter(Boolean);
  const unknown = tools.filter((t) => !all.includes(t));
  if (unknown.length > 0) {
    throw new Error(`Unknown tool(s): ${unknown.join(', ')}. Supported: ${all.join(', ')}`);
  }
  return [...new Set([...DEFAULT_TOOLS, ...tools])];
}

// Init command
function initCommand(args) {
  const { positional, flags } = parseArgs(args, ['tools']);
  const target = path.resolve(positional[0] || '.');
  const tools = resolveTools(flags.tools);
  const options = { overwrite: Boolean(flags.force), dryRun: Boolean(flags['dry-run']) };
  const rel = (p) => path.relative(target, p) || '.';

  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
    throw new Error(`Target directory does not exist: ${target}`);
  }

  const templatesDir = path.join(PACKAGE_ROOT, 'templates');
  const commandsDir = path.join(templatesDir, 'commands');
  if (!fs.existsSync(templatesDir) || !fs.existsSync(commandsDir)) {
    throw new Error(`Package is incomplete: templates not found in ${PACKAGE_ROOT}`);
  }

  log.info(`${options.dryRun ? '[dry-run] ' : ''}Initializing InJoys Agent SDK in: ${target}`);
  console.log('');

  const copied = [];
  const skipped = [];

  // 1. Templates -> design/context-dev (same layout as scripts/install.sh)
  log.step(`Installing templates to ${INSTALL_DIR.split(path.sep).join('/')}/ ...`);
  const installDir = path.join(target, INSTALL_DIR);
  const tpl = copyDir(templatesDir, installDir, [], options);
  copied.push(...tpl.copied);
  skipped.push(...tpl.skipped);

  // 2. Bootstrap commands for each selected AI tool
  log.step('Installing bootstrap commands (/context-init, /context-check) ...');
  const targets = [['workflows', WORKFLOWS_DIR], ...tools.map((t) => [t, AI_TOOL_DIRS[t]])];
  for (const [name, relDir] of targets) {
    const dest = path.join(target, relDir);
    const res = copyFiles(commandsDir, dest, BOOTSTRAP_COMMANDS, options);
    copied.push(...res.copied);
    skipped.push(...res.skipped);
    log.info(`${name}: ${relDir.split(path.sep).join('/')}`);
  }

  const legacy = path.join(target, LEGACY_WORKFLOWS_DIR);
  if (fs.existsSync(legacy)) {
    log.warn(`Legacy directory found: ${LEGACY_WORKFLOWS_DIR.split(path.sep).join('/')} — commands now live in ${WORKFLOWS_DIR.split(path.sep).join('/')}.`);
    log.warn('Move or remove the old directory yourself to avoid keeping two copies; nothing was deleted.');
  }

  // 3. Make helper scripts executable
  if (!options.dryRun) {
    const scriptsDir = path.join(installDir, 'scripts');
    if (fs.existsSync(scriptsDir)) {
      for (const name of fs.readdirSync(scriptsDir)) {
        if (name.endsWith('.sh')) {
          try {
            fs.chmodSync(path.join(scriptsDir, name), 0o755);
          } catch (e) {
            // chmod is best-effort (e.g. on Windows file systems)
          }
        }
      }
    }
  }

  console.log('');
  log.info(`${copied.length} file(s) ${options.dryRun ? 'would be ' : ''}written`);
  if (skipped.length > 0) {
    log.warn(`${skipped.length} existing file(s) skipped (use --force to overwrite):`);
    skipped.slice(0, 10).forEach((p) => console.log(`  - ${rel(p)}`));
    if (skipped.length > 10) console.log(`  ... and ${skipped.length - 10} more`);
  }

  if (options.dryRun) return;

  console.log('');
  log.info('✅ InJoys Agent SDK initialized successfully!');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Run /context-init in your AI tool to generate context from your docs');
  console.log(`  2. Read ${INSTALL_DIR.split(path.sep).join('/')}/README.md for the context framework usage`);
  console.log(`  3. (Optional) Install commands for other AI tools: bash ${INSTALL_DIR.split(path.sep).join('/')}/scripts/install-ai-commands.sh --tools <list>`);
  console.log(`  4. (Optional, Codex) Install prompts: bash ${INSTALL_DIR.split(path.sep).join('/')}/scripts/install-codex-prompts.sh`);
}

function runProvider(cmd, args, cwd) {
  const res = spawnSync(cmd, args, { cwd, stdio: 'inherit' });
  if (res.error) throw res.error;
  return res.status === null ? 1 : res.status;
}

function commandVersion(cmd, args = ['--version']) {
  const res = spawnSync(cmd, args, { encoding: 'utf8' });
  if (res.error || res.status !== 0) return null;
  return (res.stdout || res.stderr || '').split('\n')[0].trim();
}

// Check env command
// Mirrors `/context-check env`: use the project's own provider if present,
// otherwise fall back to a basic toolchain report.
function checkEnvCommand(args) {
  const { positional } = parseArgs(args);
  const root = path.resolve(positional[0] || '.');

  const makefile = path.join(root, 'Makefile');
  const script = path.join(root, 'scripts', 'check-env.sh');

  if (fs.existsSync(makefile) && /^check-env\s*:/m.test(fs.readFileSync(makefile, 'utf8'))) {
    log.info('Running `make check-env` ...');
    process.exitCode = runProvider('make', ['check-env'], root);
    return;
  }

  if (fs.existsSync(script)) {
    log.info('Running scripts/check-env.sh ...');
    process.exitCode = runProvider('bash', [path.join('scripts', 'check-env.sh')], root);
    return;
  }

  log.info('No project env provider (Makefile `check-env` target or scripts/check-env.sh) found.');
  log.info('Basic toolchain report:');
  console.log('');

  const major = Number(process.versions.node.split('.')[0]);
  const nodeOk = major >= 18;
  console.log(`  ${nodeOk ? '✓' : '✗'} node ${process.versions.node}${nodeOk ? '' : ' (>=18 required)'}`);

  const tools = [
    { name: 'git', required: true },
    { name: 'bash', required: false },
    { name: 'tsp', required: false, note: 'TypeSpec compiler, for SSoT API definitions' },
    { name: 'goose', required: false, note: 'Goose, for SSoT schema migrations' }
  ];

  let failed = !nodeOk;
  for (const tool of tools) {
    const version = commandVersion(tool.name);
    if (version) {
      console.log(`  ✓ ${tool.name} (${version})`);
    } else if (tool.required) {
      failed = true;
      console.log(`  ✗ ${tool.name} not found (required)`);
    } else {
      console.log(`  - ${tool.name} not found (optional${tool.note ? `: ${tool.note}` : ''})`);
    }
  }

  if (failed) process.exitCode = 1;
}

// Main
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const rest = args.slice(1);

  switch (command) {
    case 'init':
      initCommand(rest);
      break;
    case 'check-env':
      checkEnvCommand(rest);
      break;
    case '-v':
    case '--version':
    case 'version':
      console.log(`v${VERSION}`);
      break;
    case '-h':
    case '--help':
    case 'help':
    case undefined:
      showHelp();
      break;
    default:
      log.error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

try {
  main();
} catch (e) {
  log.error(e.message);
  process.exit(1);
}
