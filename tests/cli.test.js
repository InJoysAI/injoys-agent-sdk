const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const CLI = path.join(ROOT, 'bin', 'cli.js');
const pkg = require('../package.json');
const { copyDir, AI_TOOL_DIRS, WORKFLOWS_DIR } = require('../src');

function run(args, cwd = ROOT) {
  return spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8' });
}

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'injoys-test-'));
}

test('version comes from package.json', () => {
  assert.equal(run(['version']).stdout.trim(), `v${pkg.version}`);
});

test('every entry in package.json "files" exists', () => {
  for (const entry of pkg.files) {
    assert.ok(fs.existsSync(path.join(ROOT, entry)), `${entry} is listed in files but missing`);
  }
});

test('init installs templates to design/context-dev and bootstrap commands', () => {
  const dir = tmp();
  const res = run(['init', dir]);
  assert.equal(res.status, 0, res.stderr);

  assert.ok(fs.existsSync(path.join(dir, 'design/context-dev/openspec/AGENTS.md')));
  assert.ok(fs.existsSync(path.join(dir, 'design/context-dev/templates/openspec/proposal.md.template')));
  assert.ok(fs.existsSync(path.join(dir, 'design/context-dev/tools/specflow/specflow.mjs')));
  assert.ok(!fs.existsSync(path.join(dir, '.context')), 'init must not create .context/');

  const rel = WORKFLOWS_DIR;
  assert.equal(rel, path.join('.agents', 'workflows'));
  assert.ok(!('antigravity' in AI_TOOL_DIRS), 'antigravity is no longer a supported tool');
  assert.ok(fs.existsSync(path.join(dir, rel, 'context-init.md')), `${rel}/context-init.md`);
  assert.ok(fs.existsSync(path.join(dir, rel, 'context-check.md')), `${rel}/context-check.md`);
  assert.ok(!fs.existsSync(path.join(dir, rel, 'context-start.md')), 'only bootstrap commands are installed');

  // Other AI tools are opt-in: nothing is written outside .agents/workflows by default.
  for (const [tool, other] of Object.entries(AI_TOOL_DIRS)) {
    assert.ok(!fs.existsSync(path.join(dir, other)), `${other} must not be created by default`);
  }
});

test('init does not overwrite existing files without --force', () => {
  const dir = tmp();
  const file = path.join(dir, '.agents/workflows/context-init.md');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, 'mine');

  assert.equal(run(['init', dir]).status, 0);
  assert.equal(fs.readFileSync(file, 'utf8'), 'mine');

  assert.equal(run(['init', dir, '--force']).status, 0);
  assert.notEqual(fs.readFileSync(file, 'utf8'), 'mine');
});

test('init --dry-run writes nothing', () => {
  const dir = tmp();
  const res = run(['init', dir, '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
  assert.deepEqual(fs.readdirSync(dir), []);
});

test('init --tools adds extra AI tool directories on top of .agents/workflows', () => {
  const dir = tmp();
  assert.equal(run(['init', dir, '--tools', 'claude']).status, 0);
  assert.ok(fs.existsSync(path.join(dir, '.agents/workflows/context-init.md')));
  assert.ok(fs.existsSync(path.join(dir, '.claude/commands/context-init.md')));
  assert.ok(!fs.existsSync(path.join(dir, '.cursor')));
});

test('init --tools all installs every supported tool directory', () => {
  const dir = tmp();
  assert.equal(run(['init', dir, '--tools', 'all']).status, 0);
  for (const rel of Object.values(AI_TOOL_DIRS)) {
    assert.ok(fs.existsSync(path.join(dir, rel, 'context-init.md')), `${rel}/context-init.md`);
  }
});

test('init rejects unknown tools and missing target', () => {
  const dir = tmp();
  const bad = run(['init', dir, '--tools', 'nope']);
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /Unknown tool/);

  const missing = run(['init', path.join(dir, 'does-not-exist')]);
  assert.equal(missing.status, 1);
});

test('check-env uses the project provider script when present', () => {
  const dir = tmp();
  fs.mkdirSync(path.join(dir, 'scripts'));
  fs.writeFileSync(path.join(dir, 'scripts/check-env.sh'), 'echo provider-ran\nexit 3\n');
  const res = run(['check-env', dir]);
  assert.match(res.stdout, /provider-ran/);
  assert.equal(res.status, 3);
});

test('check-env falls back to a basic toolchain report', () => {
  const res = run(['check-env', tmp()]);
  assert.match(res.stdout, /Basic toolchain report/);
  assert.match(res.stdout, /node/);
});

test('copyDir honours overwrite=false and dryRun', () => {
  const src = tmp();
  const dest = tmp();
  fs.writeFileSync(path.join(src, 'a.txt'), 'new');
  fs.writeFileSync(path.join(dest, 'a.txt'), 'old');

  const kept = copyDir(src, dest, [], { overwrite: false });
  assert.equal(kept.skipped.length, 1);
  assert.equal(fs.readFileSync(path.join(dest, 'a.txt'), 'utf8'), 'old');

  const dry = copyDir(src, dest, [], { dryRun: true });
  assert.equal(dry.copied.length, 1);
  assert.equal(fs.readFileSync(path.join(dest, 'a.txt'), 'utf8'), 'old');
});

test('readManifest: null when missing, throws with the path when corrupt', () => {
  const { readManifest } = require('../src');
  const dir = tmp();
  assert.equal(readManifest(dir), null);

  const file = path.join(dir, '.context', 'context-manifest.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, '{ not json');
  assert.throws(() => readManifest(dir), (e) => e.message.includes('context-manifest.json'));

  fs.writeFileSync(file, '{"version":1}');
  assert.deepEqual(readManifest(dir), { version: 1 });
});

test('init warns about a legacy .agent/workflows directory and does not delete it', () => {
  const dir = tmp();
  const legacy = path.join(dir, '.agent/workflows');
  fs.mkdirSync(legacy, { recursive: true });
  fs.writeFileSync(path.join(legacy, 'context-init.md'), 'old');

  const res = run(['init', dir]);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout + res.stderr, /Legacy directory/);
  assert.equal(fs.readFileSync(path.join(legacy, 'context-init.md'), 'utf8'), 'old');
  assert.ok(fs.existsSync(path.join(dir, '.agents/workflows/context-init.md')));
});
