#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const VERSION = '0.1.0';
const PACKAGE_ROOT = path.join(__dirname, '..');

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
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
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
  init [path]       Initialize InJoys Agent SDK in target project (default: current dir)
  check-env         Check development environment toolchain
  version           Show version

Options:
  -h, --help        Show this help message
  -v, --version     Show version

Examples:
  npx @injoysai/agent-sdk init
  npx @injoysai/agent-sdk init ./my-project
  npx @injoysai/agent-sdk check-env
`);
}

// Copy directory recursively
function copyDir(src, dest, excludes = []) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    if (excludes.includes(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, excludes);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Init command
function initCommand(targetPath) {
  const target = path.resolve(targetPath || '.');
  
  log.info(`Initializing InJoys Agent SDK in: ${target}`);
  console.log('');

  // Copy templates
  const templatesDir = path.join(PACKAGE_ROOT, 'templates');
  const contextDir = path.join(target, '.context');
  
  log.step('Creating .context/ directory...');
  copyDir(templatesDir, contextDir, ['README.md', 'devenv', 'scripts', 'templates']);

  // Copy rules
  const rulesDir = path.join(PACKAGE_ROOT, 'rules');
  
  log.step('Copying rule templates...');
  if (fs.existsSync(rulesDir)) {
    const rules = fs.readdirSync(rulesDir);
    for (const rule of rules) {
      const src = path.join(rulesDir, rule);
      const destName = rule.replace('.template', '');
      const dest = path.join(target, destName);
      
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
        log.info(`Created: ${destName}`);
      } else {
        log.warn(`Skipped (exists): ${destName}`);
      }
    }
  }

  // Copy commands based on detected AI tool
  const commandsDir = path.join(PACKAGE_ROOT, 'commands');
  
  log.step('Copying command templates...');
  
  // Detect AI tool and copy appropriate commands
  const aiToolDirs = {
    '.agent/workflows': 'antigravity',
    '.claude/commands': 'claude', 
    '.cursor/commands': 'cursor',
    '.windsurf/workflows': 'windsurf'
  };

  for (const [destDir, srcDir] of Object.entries(aiToolDirs)) {
    const srcPath = path.join(commandsDir, srcDir);
    const destPath = path.join(target, destDir);
    
    if (fs.existsSync(srcPath)) {
      copyDir(srcPath, destPath);
      log.info(`Copied commands to: ${destDir}`);
    }
  }

  console.log('');
  log.info('✅ InJoys Agent SDK initialized successfully!');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Run /context-init in your AI tool to generate context from your docs');
  console.log('  2. Review .context/criterion.md for project constraints');
  console.log('  3. Check standards/ for AI programming guidelines');
}

// Check env command
function checkEnvCommand() {
  const scriptPath = path.join(PACKAGE_ROOT, 'scripts', 'check-toolchain.sh');
  
  if (fs.existsSync(scriptPath)) {
    log.info('Running environment check...');
    console.log('');
    try {
      execSync(`bash "${scriptPath}"`, { stdio: 'inherit' });
    } catch (e) {
      // Script may exit with non-zero for missing tools
    }
  } else {
    log.error('check-toolchain.sh not found');
    process.exit(1);
  }
}

// Main
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'init':
    initCommand(args[1]);
    break;
  case 'check-env':
    checkEnvCommand();
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
